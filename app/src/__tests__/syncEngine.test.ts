// Checks E1–E14 (handoff/11-firestore-schema.md §9): two simulated phones and one server (memoryRemote, which applies
// the same checks as firebase/firestore.rules).
import { createMemoryStore } from '@/data/memoryStore';
import { KV, type KittedStore } from '@/data/store';
import type { ChatMessage, FactRow, ProfileRow } from '@/data/types';
import { BASICS_KEY, LOOKS_KEY } from '@/features/onboarding/basics';
import { createSyncEngine, remoteWins, SyncDisabled } from '@/sync/engine';
import { createMemoryRemote, type MemoryRemote } from '@/sync/memoryRemote';
import { RemoteUnavailable } from '@/sync/remote';
import { trackChanges } from '@/sync/tracker';

const T0 = 1_760_000_000_000;

interface Phone {
  inner: KittedStore;
  app: KittedStore;
  engine: ReturnType<typeof createSyncEngine>;
  clock: { now: number };
  files: Map<string, string>;
  on: { value: boolean };
}

function phone(remote: MemoryRemote, deviceId: string, opts: { backUpPhotos?: boolean } = {}): Phone {
  const inner = createMemoryStore();
  const clock = { now: T0 };
  const on = { value: true };
  const files = new Map<string, string>();
  const app = trackChanges(inner, { isOn: () => on.value, nowMs: () => clock.now, deviceId });
  const engine = createSyncEngine({
    store: inner, remote, files: remote.transport(files), deviceId, nowMs: () => clock.now, enabled: () => on.value,
    backUpPhotos: () => opts.backUpPhotos ?? true,
  });
  return { inner, app, engine, clock, files, on };
}

const msg = (id: string, text: string, createdAt = 1): ChatMessage => ({
  id, createdAt, role: 'user', kind: 'text', text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {},
});
const fact = (id: string, value: string): FactRow => ({ id, key: 'budget', value, source: 'told', createdAt: 1, isDeleted: false });
const profile = (over: Partial<ProfileRow> = {}): ProfileRow => ({
  id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: 'regular', styles: [['minimal', 0.5]] as never, boldness: null, budget: null,
  lastOccasion: 'everyday', consentVersion: 'v2', consentAt: 5, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: 1, ...over,
});

describe('E1 push once', () => {
  it('sends a change once, with the change time', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    a.clock.now = T0 + 10;
    await a.app.chat.put(msg('M-1', 'What shoes with grey chinos?'));
    const r1 = await a.engine.push();
    expect(r1).toMatchObject({ sent: 1, batches: 1, refused: 0 });
    const doc = remote.docs('chatMessages')[0]!;
    expect(doc).toMatchObject({ id: 'M-1', v: 1, updatedAt: T0 + 10, deleted: false, by: 'dev-a' });
    expect(doc.data!.chips).toBe('[]');
    expect(await a.engine.push()).toMatchObject({ sent: 0, batches: 0 });
    expect(remote.writes).toBe(1);
  });
  it('two changes in the same millisecond both go up', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    await a.app.chat.put(msg('M-1', 'one'));
    await a.engine.push();
    await a.app.chat.patch('M-1', { text: 'two' });
    expect((await a.engine.push()).sent).toBe(1);
    expect(remote.docs('chatMessages')[0]!.data!.text).toBe('two');
  });
});

describe('E2 deletes', () => {
  it('a delete becomes a tombstone with no data, and the other phone deletes the row', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    const b = phone(remote, 'dev-b');
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.engine.push();
    await b.engine.pull();
    expect(await b.app.chat.get('M-1')).not.toBeNull();
    a.clock.now += 5;
    await a.app.chat.delete('M-1');
    await a.engine.push();
    const doc = remote.docs('chatMessages')[0]!;
    expect(doc.deleted).toBe(true);
    expect('data' in doc).toBe(false);
    await b.engine.pull();
    expect(await b.app.chat.get('M-1')).toBeNull();
  });
});

describe('E3 newest wins, ties the same on both phones', () => {
  it('compares updatedAt, then device id', () => {
    const local = { id: 'x', coll: 'c', rowKey: 'x', localAt: 100, pushedAt: 100, deleted: false, by: 'dev-a', files: [] };
    expect(remoteWins({ updatedAt: 101, by: 'dev-a' }, local)).toBe(true);
    expect(remoteWins({ updatedAt: 99, by: 'dev-z' }, local)).toBe(false);
    expect(remoteWins({ updatedAt: 100, by: 'dev-b' }, local)).toBe(true);
    expect(remoteWins({ updatedAt: 100, by: 'dev-b' }, { ...local, by: 'dev-b' })).toBe(false);
    expect(remoteWins({ updatedAt: 100, by: 'dev-a' }, { ...local, by: 'dev-b' })).toBe(false);
    expect(remoteWins({ updatedAt: 1, by: 'dev-a' }, null)).toBe(true);
  });
});

describe('E4 no ping-pong', () => {
  it('a pulled change is not pushed back', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    const b = phone(remote, 'dev-b');
    await a.app.facts.put(fact('F-1', 'under $60'));
    await a.engine.push();
    const before = remote.writes;
    expect((await b.engine.pull()).applied).toBe(1);
    expect((await b.engine.push()).sent).toBe(0);
    expect((await a.engine.pull()).applied).toBe(0);
    expect(remote.writes).toBe(before);
  });
});

describe('E5 two phones offline', () => {
  it('the newer edit of a row wins on both; different rows both survive', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    const b = phone(remote, 'dev-b');
    await a.app.facts.put(fact('F-1', 'under $60'));
    await a.engine.syncNow();
    await b.engine.syncNow();
    a.clock.now = T0 + 100;
    b.clock.now = T0 + 200;
    await a.app.facts.patch('F-1', { value: 'under $80' });
    await b.app.facts.patch('F-1', { value: 'under $100' });
    await a.app.chat.put(msg('M-A', 'from a'));
    await b.app.chat.put(msg('M-B', 'from b'));
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.engine.syncNow();
    for (const p of [a, b]) {
      expect((await p.app.facts.get('F-1'))!.value).toBe('under $100');
      expect((await p.app.chat.all()).map((m) => m.id).sort()).toEqual(['M-A', 'M-B']);
      expect(await p.engine.pending()).toBe(0);
    }
  });
});

describe('E6 a stale write', () => {
  it("doesn't block the batch; the newer server copy is pulled instead", async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    const b = phone(remote, 'dev-b');
    await a.app.facts.put(fact('F-1', 'old'));
    await a.engine.syncNow();
    await b.engine.syncNow();
    b.clock.now = T0 + 500;
    await b.app.facts.patch('F-1', { value: 'newest' });
    await b.engine.push();
    // a edits earlier than b did, and hasn't pulled.
    a.clock.now = T0 + 300;
    await a.app.facts.patch('F-1', { value: 'older edit' });
    await a.app.chat.put(msg('M-1', 'unrelated'));
    const r = await a.engine.push();
    expect(r).toMatchObject({ lost: 1, refused: 0 });
    expect(remote.docs('chatMessages')).toHaveLength(1);
    expect((await a.app.facts.get('F-1'))!.value).toBe('newest');
    expect(await a.engine.pending()).toBe(0);
  });
});

describe('E7 batching', () => {
  it('1,000 changes go up in 3 batches of ≤ 400', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    for (let i = 0; i < 1000; i += 1) await a.app.chat.put(msg(`M-${i}`, `m${i}`));
    const r = await a.engine.push();
    expect(r).toMatchObject({ sent: 1000, batches: 3 });
    expect(remote.commits).toBe(3);
  });
});

describe('E8 first sign-in and a new phone', () => {
  it('pushes everything once; a fresh phone ends with the same synced data', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    a.on.value = false; // signed out: nothing recorded
    await a.app.profile.put(profile());
    await a.app.facts.put(fact('F-1', 'under $60'));
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.app.setKv(LOOKS_KEY, JSON.stringify(['minimal', 'streetwear']));
    await a.app.setKv(KV.appearance, 'dark');
    await a.app.setKv(KV.notifyIdea, '0');
    await a.app.usage.put({ dayKey: '2026-10-15', checks: 1, rechecks: 0, questions: 2, items: 0 });
    expect(await a.inner.syncRows.all()).toHaveLength(0);
    a.on.value = true; // signs in
    expect(await a.engine.markAllDirty()).toBe(5);
    expect((await a.engine.push()).sent).toBe(5);
    expect((await a.engine.push()).sent).toBe(0);

    const b = phone(remote, 'dev-b');
    await b.engine.pull();
    expect(await b.app.chat.all()).toEqual(await a.app.chat.all());
    expect(await b.app.facts.all()).toEqual(await a.app.facts.all());
    expect(await b.app.getKv(LOOKS_KEY)).toBe(await a.app.getKv(LOOKS_KEY));
    expect(await b.app.getKv(KV.appearance)).toBe('dark');
    expect(await b.app.getKv(KV.notifyIdea)).toBeNull();
    expect(await b.app.usage.all()).toEqual([]);
    expect(await b.app.profile.get('me')).toEqual({ ...profile(), birthYear: null });
  });
});

describe('E9 a newer app version', () => {
  it('applies a doc with an unknown field, and writing back keeps that field on the server', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    await remote.commit([{ coll: 'facts', doc: { id: 'F-1', v: 2, updatedAt: T0 + 1, deleted: false, by: 'dev-new',
      data: { id: 'F-1', key: 'budget', value: 'under $60', source: 'told', createdAt: 1, isDeleted: false, confidence: 0.9 } } }]);
    await a.engine.pull();
    const row = (await a.app.facts.get('F-1'))!;
    expect(row).toEqual(fact('F-1', 'under $60'));
    a.clock.now = T0 + 10;
    await a.app.facts.patch('F-1', { value: 'under $80' });
    await a.engine.push();
    expect(remote.docs('facts')[0]!.data).toMatchObject({ value: 'under $80', confidence: 0.9 });
  });
});

describe('E10 offline', () => {
  it('loses nothing when the network fails', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    await a.app.chat.put(msg('M-1', 'hi'));
    remote.offline = true;
    await expect(a.engine.push()).rejects.toBeInstanceOf(RemoteUnavailable);
    expect(await a.engine.pending()).toBe(1);
    remote.offline = false;
    expect((await a.engine.push()).sent).toBe(1);
  });
});

describe('E11 kv', () => {
  it("synced keys go up as prefs (no birth year); local keys never; a pull keeps this phone's birth year", async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    const b = phone(remote, 'dev-b');
    await a.app.setKv(BASICS_KEY, JSON.stringify({ heightIn: 70, build: 'slim', fit: null, birthYear: 2003 }));
    await a.app.setKv(KV.onboardingStep, 'basics');
    await a.app.setKv('sync.cursor.facts', 'x');
    await a.engine.push();
    const prefs = remote.docs('prefs');
    expect(prefs.map((d) => d.id)).toEqual([BASICS_KEY]);
    expect(JSON.stringify(prefs)).not.toContain('birthYear');
    await b.inner.setKv(BASICS_KEY, JSON.stringify({ heightIn: null, build: null, fit: null, birthYear: 2001 }));
    await b.engine.pull();
    expect(JSON.parse((await b.app.getKv(BASICS_KEY))!)).toEqual({ heightIn: 70, build: 'slim', fit: null, birthYear: 2001 });
  });
});

describe('E12 files', () => {
  it('uploads his photos once, never send copies; the other phone downloads; a delete removes the remote file', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    const b = phone(remote, 'dev-b');
    a.files.set('photos/abc-photo.jpg', 'JPEG');
    a.files.set('scans/def-photo.jpg', 'SCAN');
    a.files.set('scans/def-send.jpg', 'BLURRED');
    await a.app.chat.put({ ...msg('M-1', ''), kind: 'photo', payload: { photo: 'photos/abc-photo.jpg' } });
    await a.app.setKv('scan.inbox', JSON.stringify([{ sha256: 'def', keptPath: 'scans/def-photo.jpg', sendPath: 'scans/def-send.jpg' }]));
    await a.engine.push();
    expect((await a.engine.drainFiles()).moved).toBe(2);
    expect([...remote.files.keys()].sort()).toEqual(['photos/abc-photo.jpg', 'scans/def-photo.jpg']);
    await a.app.chat.patch('M-1', { text: 'edited' });
    await a.engine.push();
    expect((await a.engine.drainFiles()).moved).toBe(0);

    await b.engine.pull();
    expect((await b.engine.drainFiles()).moved).toBe(2);
    expect(b.files.get('photos/abc-photo.jpg')).toBe('JPEG');
    expect(b.files.has('scans/def-send.jpg')).toBe(false);

    a.clock.now += 10;
    await a.app.chat.delete('M-1');
    await a.engine.push();
    await a.engine.drainFiles();
    expect(remote.files.has('photos/abc-photo.jpg')).toBe(false);
    await b.engine.pull();
    expect(b.files.has('photos/abc-photo.jpg')).toBe(false);
  });
  it('keeps a file another row still points at, and uploads nothing with "Back up photos" off', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    a.files.set('photos/abc-photo.jpg', 'JPEG');
    await a.app.chat.put({ ...msg('M-1', ''), payload: { photo: 'photos/abc-photo.jpg' } });
    await a.app.chat.put({ ...msg('M-2', ''), payload: { photo: 'photos/abc-photo.jpg' } });
    await a.engine.push();
    await a.engine.drainFiles();
    a.clock.now += 10;
    await a.app.chat.delete('M-1');
    await a.engine.push();
    await a.engine.drainFiles();
    expect(remote.files.has('photos/abc-photo.jpg')).toBe(true);

    const off = createMemoryRemote(T0);
    const c = phone(off, 'dev-c', { backUpPhotos: false });
    c.files.set('photos/x-photo.jpg', 'JPEG');
    await c.app.chat.put({ ...msg('M-1', ''), payload: { photo: 'photos/x-photo.jpg' } });
    await c.engine.push();
    expect((await c.engine.drainFiles()).moved).toBe(0);
    expect(off.files.size).toBe(0);
  });
});

describe('E13 off means off', () => {
  it('records nothing and refuses to run when signed out or in a demo build', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    a.on.value = false;
    await a.app.chat.put(msg('M-1', 'hi'));
    expect(await a.inner.syncRows.all()).toEqual([]);
    await expect(a.engine.push()).rejects.toBeInstanceOf(SyncDisabled);
    await expect(a.engine.pull()).rejects.toBeInstanceOf(SyncDisabled);
    await expect(a.engine.markAllDirty()).rejects.toBeInstanceOf(SyncDisabled);
    expect(remote.writes).toBe(0);
  });
});

describe('E14 delete all my data', () => {
  it('clears the bookkeeping, so nothing goes up afterwards', async () => {
    const remote = createMemoryRemote(T0);
    const a = phone(remote, 'dev-a');
    await a.app.chat.put(msg('M-1', 'hi'));
    a.files.set('photos/abc-photo.jpg', 'JPEG');
    await a.app.chat.put({ ...msg('M-2', ''), payload: { photo: 'photos/abc-photo.jpg' } });
    await a.app.wipe();
    expect(await a.inner.syncRows.all()).toEqual([]);
    expect(await a.inner.syncFiles.all()).toEqual([]);
    expect((await a.engine.push()).sent).toBe(0);
  });
});

describe('the server stand-in enforces the rules', () => {
  it('refuses a far-future clock, an unknown collection, a changed reading, too many fields', async () => {
    const remote = createMemoryRemote(T0);
    const env = { v: 1, deleted: false, by: 'dev-a' };
    await expect(remote.commit([{ coll: 'facts', doc: { id: 'F', updatedAt: T0 + 2 * 86_400_000, ...env, data: {} } }])).rejects.toThrow('updatedAt');
    await expect(remote.commit([{ coll: 'usageDays', doc: { id: 'd', updatedAt: T0, ...env, data: {} } }])).rejects.toThrow('collection');
    await remote.commit([{ coll: 'readings', doc: { id: 'R', updatedAt: T0, ...env, data: { reading: '{"a":1}' } } }]);
    await expect(remote.commit([{ coll: 'readings', doc: { id: 'R', updatedAt: T0 + 1, ...env, data: { reading: '{"a":2}' } } }])).rejects.toThrow('reading changed');
    await remote.commit([{ coll: 'readings', doc: { id: 'R', updatedAt: T0 + 2, v: 1, deleted: true, by: 'dev-a' } }]);
    const big = Object.fromEntries(Array.from({ length: 49 }, (_, i) => [`f${i}`, i]));
    await expect(remote.commit([{ coll: 'facts', doc: { id: 'G', updatedAt: T0, ...env, data: big } }])).rejects.toThrow('too many fields');
    await expect(remote.commit([{ coll: 'facts', doc: { id: 'H', updatedAt: T0, ...env, data: { x: [[1]] } } }])).rejects.toThrow('array in array');
  });
});
