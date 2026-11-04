// Checks B1–B15 (handoff/11-firestore-schema.md §11.4, #386): the backup controller on two simulated phones and one
// server per account (memoryRemote, which applies the same checks as firebase/firestore.rules and storage.rules).
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, FitCheckRow, ProfileRow } from '@/data/types';
import { finishRestore } from '@/features/account/restore';
import { BASICS_KEY } from '@/features/onboarding/basics';
import { backupText } from '@/features/privacy/backupLine';
import { BUSY_RETRY_MS, JOIN_MODE_KEY, PUSH_DELAY_MS, backsUp, createBackup, localHoldings, type Backup } from '@/sync/backup';
import { createMemoryRemote, type MemoryRemote } from '@/sync/memoryRemote';
import { RemoteMissing } from '@/sync/remote';
import { createStorageTransport, MAX_FILE_BYTES } from '@/sync/storageTransport';
import { trackChanges } from '@/sync/tracker';
import { SYNC_UID_KEY, createTracking } from '@/sync/tracking';

const T0 = 1_760_000_000_000;

function manualScheduler() {
  let n = 0;
  const timers = new Map<number, { fn: () => void; ms: number }>();
  return {
    timers,
    setTimer: (fn: () => void, ms: number) => {
      timers.set(++n, { fn, ms });
      return n;
    },
    clearTimer: (h: unknown) => {
      timers.delete(h as number);
    },
    delays: () => [...timers.values()].map((t) => t.ms),
    fire() {
      const all = [...timers.values()];
      timers.clear();
      for (const t of all) t.fn();
    },
  };
}

interface Phone {
  inner: KittedStore;
  app: KittedStore;
  backup: Backup;
  files: Map<string, string>;
  removed: string[];
  sched: ReturnType<typeof manualScheduler>;
  clock: { now: number };
  s: { signed: string | null; busy: boolean; online: boolean; allowed: boolean; deleteServer: 'ok' | 'failed' | 'offline'; deleted: number; connects: number };
}

/** One server per account (uid → its folder). */
type Servers = Record<string, MemoryRemote>;

function phone(servers: Servers, device: string, signed: string | null = 'U1'): Phone {
  const inner = createMemoryStore();
  const files = new Map<string, string>();
  const removed: string[] = [];
  const sched = manualScheduler();
  const clock = { now: T0 + 1000 };
  const s = { signed, busy: false, online: true, allowed: true, deleteServer: 'ok' as 'ok' | 'failed' | 'offline', deleted: 0, connects: 0 };
  const tracking = createTracking({ raw: inner, allowed: () => s.allowed, loadDeviceId: async () => device, nowMs: () => clock.now });
  const app = trackChanges(inner, tracking.options);
  const backup = createBackup({
    store: inner,
    tracking,
    async connect(uid) {
      s.connects += 1;
      const remote = servers[uid];
      if (!remote) return null;
      const live = () => remote.transport(files, { canTransfer: () => s.online && !s.busy && !remote.offline });
      return {
        remote: {
          ...remote,
          commit: (w) => remote.commit(w),
          get: (c, id) => remote.get(c, id),
          changesSince: (c, cur, max) => remote.changesSince(c, cur, max),
          async holdings() {
            const docs = remote.docs('fitChecks').filter((d) => !d.deleted && d.data?.status === 'scored' && d.data?.parentId === null);
            return { fits: docs.length, pieces: remote.docs('closetItems').filter((d) => !d.deleted).length, chats: remote.docs('chatMessages').filter((d) => !d.deleted).length };
          },
        },
        // Read through at each call, so a test can swap the server's transport after the connection is made.
        files: {
          exists: (path) => live().exists(path),
          upload: (path) => live().upload(path),
          download: (path) => live().download(path),
          remove: (path) => live().remove(path),
          removeLocal: (path) => live().removeLocal(path),
          canTransfer: () => live().canTransfer(),
        },
      };
    },
    signedIn: async () => (s.signed ? { uid: s.signed } : null),
    allowed: () => s.allowed,
    busy: () => s.busy,
    online: () => s.online,
    foreground: () => true,
    nowMs: () => clock.now,
    scheduler: sched,
    appVersion: '0.1.0',
    async deleteServer() {
      s.deleted += 1;
      return s.deleteServer;
    },
    removeLocalFile: (p) => {
      removed.push(p);
      files.delete(p);
    },
    log: () => {},
  });
  return { inner, app, backup, files, removed, sched, clock, s };
}

const msg = (id: string, text: string, payload: Record<string, unknown> = {}): ChatMessage => ({
  id, createdAt: 1, role: 'user', kind: 'text', text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload,
});
const check = (id: string, over: Partial<FitCheckRow> = {}): FitCheckRow =>
  ({
    id, createdAt: 1, dayKey: '2026-11-03', photoFile: `photos/${id}-photo.jpg`, thumbFile: null, demoPhotoId: null, imageHash: id, occasion: 'everyday',
    style: null, status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.4, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [],
    advice: [], fixes: [], explanation: null, rubricVersion: 'p15', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false,
    readingId: null, parentId: null, itemIds: [], details: {}, ...over,
  }) as unknown as FitCheckRow;
const profile = (over: Partial<ProfileRow> = {}): ProfileRow => ({
  id: 'me', birthYear: 2004, heightCm: null, build: '', fitPreference: 'regular', styles: [['streetwear', 0.5]] as never, boldness: null, budget: null,
  lastOccasion: 'everyday', consentVersion: '2', consentAt: 5, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: 1, ...over,
});

/** A phone that has joined its account (the first sync ran). */
async function joined(p: Phone) {
  await p.backup.syncNow();
  expect(await p.inner.getKv(SYNC_UID_KEY)).toBe(p.s.signed);
}

describe('B1 never signed in, or a guest', () => {
  it('records nothing and calls no server', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a', null);
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.backup.syncNow();
    expect(await a.inner.syncRows.all()).toEqual([]);
    expect(a.s.connects).toBe(0);
    expect(servers.U1.writes).toBe(0);
    expect(a.sched.timers.size).toBe(0);
    expect(a.backup.status()).toEqual({ kind: 'off' });
  });
  it('a guest (anonymous Firebase user) or a different user never backs up', () => {
    expect(backsUp({ uid: 'U1' }, { uid: 'U1', isAnonymous: true })).toBeNull();
    expect(backsUp({ uid: 'U1' }, { uid: 'U2', isAnonymous: false })).toBeNull();
    expect(backsUp(null, { uid: 'U1', isAnonymous: false })).toBeNull();
    expect(backsUp({ uid: 'U1' }, { uid: 'U1', isAnonymous: false })).toEqual({ uid: 'U1' });
  });
});

describe('B2 signed in', () => {
  it('a change goes up once, 5 s after the last one; the birth year and local keys never do', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await a.app.profile.put(profile());
    await joined(a);
    expect(servers.U1.docs('profile')[0]!.data).not.toHaveProperty('birthYear');
    expect(servers.U1.docs('profile')[0]!.data).not.toHaveProperty('consentVersion');
    const before = servers.U1.writes;
    await a.app.chat.put(msg('M-1', 'What shoes with grey chinos?'));
    await a.app.chat.patch('M-1', { text: 'What shoes with olive chinos?' });
    await a.app.setKv('camera.mode', 'mirror');
    await a.app.setKv(BASICS_KEY, JSON.stringify({ fit: 'regular', birthYear: 2004 }));
    expect(a.sched.delays()).toEqual([PUSH_DELAY_MS]);
    a.sched.fire();
    await a.backup.syncNow();
    expect(servers.U1.writes - before).toBe(2);
    expect(servers.U1.docs('chatMessages')[0]!.data!.text).toBe('What shoes with olive chinos?');
    expect(servers.U1.docs('prefs').map((d) => d.id)).not.toContain('camera.mode');
    expect(JSON.parse(String(servers.U1.docs('prefs').find((d) => d.id === BASICS_KEY)!.data!.value))).toEqual({ fit: 'regular' });
    await a.backup.syncNow();
    expect(servers.U1.writes - before).toBe(2);
    expect(a.backup.status()).toEqual({ kind: 'upToDate', at: a.clock.now });
  });
});

describe('B3 offline', () => {
  it('nothing is marked sent; when the connection returns it all goes, once', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await joined(a);
    a.s.online = false;
    await a.app.chat.put(msg('M-1', 'one'));
    await a.backup.syncNow();
    expect(servers.U1.docs('chatMessages')).toEqual([]);
    expect(a.backup.status()).toEqual({ kind: 'offline', changes: 1 });
    // Online by the phone's own check, but the server doesn't answer (a timeout).
    a.s.online = true;
    servers.U1.offline = true;
    await a.app.chat.put(msg('M-2', 'two'));
    await a.backup.syncNow();
    expect(a.backup.status()).toEqual({ kind: 'offline', changes: 2 });
    servers.U1.offline = false;
    await a.backup.syncNow();
    expect(servers.U1.docs('chatMessages').map((d) => d.id).sort()).toEqual(['M-1', 'M-2']);
    const w = servers.U1.writes;
    await a.backup.syncNow();
    expect(servers.U1.writes).toBe(w);
  });
});

describe('B4 one fit check at a time', () => {
  it('pushes nothing and moves no photo while a check runs; goes when it is done', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await joined(a);
    a.s.busy = true;
    a.files.set('photos/FC-1-photo.jpg', 'JPEG');
    await a.app.fitChecks.put(check('FC-1'));
    a.sched.fire();
    await a.backup.syncNow();
    expect(servers.U1.docs('fitChecks')).toEqual([]);
    expect(servers.U1.files.size).toBe(0);
    expect(a.sched.delays()).toEqual([BUSY_RETRY_MS]);
    a.s.busy = false;
    a.sched.fire();
    await a.backup.syncNow();
    expect(servers.U1.docs('fitChecks').map((d) => d.id)).toEqual(['FC-1']);
    expect(servers.U1.files.get('photos/FC-1-photo.jpg')).toBe('JPEG');
  });
});

describe('B5 a half-done upload', () => {
  it('the photo stays queued and goes next time; its row is already up', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await joined(a);
    a.files.set('photos/FC-1-photo.jpg', 'JPEG');
    await a.app.fitChecks.put(check('FC-1'));
    // A check starts between the row and its photo (the transport says no), as when the app closes mid-photo.
    const real = servers.U1.transport;
    let cut = true;
    servers.U1.transport = (local, o) => {
      const t = real(local, o);
      return { ...t, canTransfer: () => !cut && t.canTransfer() };
    };
    await a.backup.syncNow();
    expect(servers.U1.docs('fitChecks').map((d) => d.id)).toEqual(['FC-1']);
    expect(servers.U1.files.size).toBe(0);
    expect((await a.inner.syncFiles.all()).map((f) => f.path)).toEqual(['photos/FC-1-photo.jpg']);
    cut = false;
    await a.backup.syncNow();
    expect(servers.U1.files.get('photos/FC-1-photo.jpg')).toBe('JPEG');
    expect(await a.inner.syncFiles.all()).toEqual([]);
  });
});

describe('B6 a reinstall', () => {
  it('a fresh phone gets every row back and the photos, keeps its birth year, and asks it before onboarding is done', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    a.files.set('photos/FC-1-photo.jpg', 'JPEG');
    await a.app.profile.put(profile({ styles: [['streetwear', 0.5], ['minimal', 0.3]] as never }));
    await a.app.fitChecks.put(check('FC-1'));
    await a.app.fitChecks.put(check('FC-2', { parentId: 'FC-1', photoFile: null }));
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.app.setKv('onboarding.done', '1');
    await a.app.setKv('appearance', 'dark');
    await joined(a);

    // The new phone: Basics asked only the birth year; a default was written before the sign-in.
    const b = phone(servers, 'dev-b');
    await b.app.setKv(BASICS_KEY, JSON.stringify({ fit: null, birthYear: 2004 }));
    await b.app.setKv('appearance', 'system');
    expect(await b.backup.holdings('U1')).toEqual({ fits: 1, pieces: 0, chats: 1 });
    expect(await b.backup.joinNow()).toBe('ok');
    await finishRestore(b.app, T0 + 5000);
    expect(await localHoldings(b.inner)).toEqual({ fits: 1, pieces: 0, chats: 1 });
    const p = await b.inner.profile.get('me');
    expect(p).toMatchObject({ birthYear: 2004, fitPreference: 'regular', onboardingDone: true, consentVersion: null });
    expect(p!.styles).toEqual([['streetwear', 0.5], ['minimal', 0.3]]);
    expect(await b.inner.getKv('appearance')).toBe('dark');
    // Onboarding is per phone: A4 marks it done once the birth year was asked (a synced "done" could skip the question).
    expect(await b.inner.getKv('onboarding.done')).toBeNull();
    expect(b.files.get('photos/FC-1-photo.jpg')).toBe('JPEG');
    // The restored profile went back up without his age or the agreement.
    await b.backup.syncNow();
    const doc = servers.U1.docs('profile')[0]!;
    expect(doc.data).not.toHaveProperty('birthYear');
    expect(doc.data!.styles).toBe(JSON.stringify([['streetwear', 0.5], ['minimal', 0.3]]));
  });
});

describe('B7 two phones editing', () => {
  it('the newer edit to one row ends up on both; edits to different rows both survive', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    const b = phone(servers, 'dev-b');
    await a.app.chat.put(msg('M-1', 'first'));
    await joined(a);
    await joined(b);
    a.s.online = false;
    b.s.online = false;
    a.clock.now += 10;
    await a.app.chat.patch('M-1', { text: 'from a' });
    b.clock.now += 20;
    await b.app.chat.patch('M-1', { text: 'from b, later' });
    await a.app.chat.put(msg('M-2', 'only a'));
    await b.app.chat.put(msg('M-3', 'only b'));
    a.s.online = true;
    b.s.online = true;
    await a.backup.syncNow();
    await b.backup.syncNow();
    await a.backup.syncNow();
    for (const p of [a, b]) {
      expect((await p.inner.chat.get('M-1'))!.text).toBe('from b, later');
      expect((await p.inner.chat.all()).map((m) => m.id).sort()).toEqual(['M-1', 'M-2', 'M-3']);
    }
  });
});

describe('B8 an account with fits on a phone with fits', () => {
  async function setup() {
    const servers = { U1: createMemoryRemote(T0) };
    const old = phone(servers, 'dev-old');
    old.files.set('photos/FC-A-photo.jpg', 'ACCOUNT');
    await old.app.fitChecks.put(check('FC-A'));
    await old.app.profile.put(profile({ styles: [['workwear', 0.5]] as never }));
    await joined(old);
    const p = phone(servers, 'dev-new');
    p.files.set('photos/FC-L-photo.jpg', 'LOCAL');
    await p.app.profile.put(profile({ birthYear: 2003 }));
    await p.app.fitChecks.put(check('FC-L'));
    await p.app.chat.put(msg('M-L', 'local'));
    return { servers, p };
  }
  it('Keep both adds this phone\'s rows to the account', async () => {
    const { servers, p } = await setup();
    await p.backup.setJoinMode('merge');
    await p.backup.syncNow();
    expect(servers.U1.docs('fitChecks').map((d) => d.id).sort()).toEqual(['FC-A', 'FC-L']);
    expect((await p.inner.fitChecks.all()).map((c) => c.id).sort()).toEqual(['FC-A', 'FC-L']);
    expect(servers.U1.files.get('photos/FC-L-photo.jpg')).toBe('LOCAL');
    expect(p.files.get('photos/FC-A-photo.jpg')).toBe('ACCOUNT');
  });
  it("Use the account's leaves only the account's rows and this phone's birth year, deleting this phone's photos", async () => {
    const { servers, p } = await setup();
    await p.backup.setJoinMode('replace');
    expect(await p.inner.getKv(JOIN_MODE_KEY)).toBe('replace');
    await p.backup.syncNow();
    expect((await p.inner.fitChecks.all()).map((c) => c.id)).toEqual(['FC-A']);
    expect(await p.inner.chat.all()).toEqual([]);
    expect(p.removed).toEqual(['photos/FC-L-photo.jpg']);
    expect(servers.U1.docs('fitChecks').map((d) => d.id)).toEqual(['FC-A']);
    expect(servers.U1.docs('chatMessages')).toEqual([]);
    const prof = await p.inner.profile.get('me');
    expect(prof).toMatchObject({ birthYear: 2003 });
    expect(prof!.styles).toEqual([['workwear', 0.5]]);
    expect(await p.inner.getKv(JOIN_MODE_KEY)).toBeNull();
  });
  it("Use the account's deletes nothing while the account can't be reached", async () => {
    const { servers, p } = await setup();
    await p.backup.setJoinMode('replace');
    servers.U1.offline = true;
    await p.backup.syncNow();
    expect((await p.inner.fitChecks.all()).map((c) => c.id)).toEqual(['FC-L']);
    expect(p.removed).toEqual([]);
    expect(await p.backup.joinNow()).toBe('offline');
  });
});

describe('B9 sign out', () => {
  it('nothing goes while signed out; those edits go at the next sign-in to the same account', async () => {
    const servers = { U1: createMemoryRemote(T0), U2: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await joined(a);
    a.s.signed = null;
    await a.backup.accountChanged();
    await a.app.chat.put(msg('M-1', 'while signed out'));
    a.sched.fire();
    await a.backup.syncNow();
    expect(servers.U1.docs('chatMessages')).toEqual([]);
    expect(a.backup.status()).toEqual({ kind: 'off' });
    a.s.signed = 'U1';
    await a.backup.accountChanged();
    expect(servers.U1.docs('chatMessages').map((d) => d.id)).toEqual(['M-1']);
  });
  it('a different account starts from cleared bookkeeping (and gets this phone\'s rows, as Keep both)', async () => {
    const servers = { U1: createMemoryRemote(T0), U2: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await a.app.chat.put(msg('M-1', 'hi'));
    await joined(a);
    a.s.signed = 'U2';
    await a.backup.accountChanged();
    expect(await a.inner.getKv(SYNC_UID_KEY)).toBe('U2');
    expect(servers.U2.docs('chatMessages').map((d) => d.id)).toEqual(['M-1']);
  });
});

describe('B10 delete account', () => {
  it('a failed server delete changes nothing and keeps him backing up', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await joined(a);
    a.s.deleteServer = 'failed';
    expect(await a.backup.deleteServerCopy()).toBe('failed');
    await a.app.chat.put(msg('M-1', 'still here'));
    await a.backup.syncNow();
    expect(servers.U1.docs('chatMessages').map((d) => d.id)).toEqual(['M-1']);
  });
  it('after the server delete nothing more is sent for that account', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await joined(a);
    await a.app.chat.put(msg('M-1', 'queued'));
    expect(await a.backup.deleteServerCopy()).toBe('ok');
    expect(a.s.deleted).toBe(1);
    expect(a.sched.timers.size).toBe(0);
    await a.backup.syncNow();
    expect(servers.U1.docs('chatMessages')).toEqual([]);
    // The wipe that follows ("Delete all my data") resets the tracking.
    await a.app.wipe();
    a.backup.storeReset();
    a.s.signed = null;
    await a.app.chat.put(msg('M-2', 'after'));
    expect(await a.inner.syncRows.all()).toEqual([]);
  });
  it('not signed in: nothing to delete on a server', async () => {
    const a = phone({}, 'dev-a', null);
    expect(await a.backup.deleteServerCopy()).toBe('none');
    expect(a.s.deleted).toBe(0);
  });
});

describe('B11 demo builds and the web preview', () => {
  it('never record or sync', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    a.s.allowed = false;
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.backup.syncNow();
    expect(a.s.connects).toBe(0);
    expect(await a.inner.syncRows.all()).toEqual([]);
    expect(await a.backup.holdings('U1')).toBeNull();
    expect(await a.backup.deleteServerCopy()).toBe('none');
  });
});

describe('B12 the status line', () => {
  it('says not yet, waiting, offline and up to date', async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    expect(backupText(a.backup.status())).toBeNull();
    a.s.busy = true;
    await a.backup.syncNow();
    expect(a.backup.status()).toEqual({ kind: 'never' });
    expect(backupText(a.backup.status())).toBe('Not backed up yet');
    a.s.busy = false;
    await joined(a);
    expect(backupText(a.backup.status())).toBe('Up to date');
    a.s.busy = true;
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.backup.syncNow();
    expect(backupText(a.backup.status())).toBe('Waiting to back up');
    a.s.busy = false;
    a.s.online = false;
    await a.backup.syncNow();
    expect(backupText(a.backup.status())).toBe('Waiting for a connection');
    expect(backupText({ kind: 'syncing' })).toBe('Backing up…');
  });
});

describe('B13 a photo over 3 MB', () => {
  it('is refused before it leaves, dropped from the queue, and its row still syncs', async () => {
    const calls: string[] = [];
    const t = createStorageTransport({
      http: {
        exists: () => true,
        size: (p) => (p.includes('big') ? MAX_FILE_BYTES : 1000),
        request: async (method, url) => {
          calls.push(`${method} ${url}`);
          return { status: 200, headers: { 'x-goog-upload-url': 'https://x/upload/1' } };
        },
        send: async (url) => {
          calls.push(`send ${url}`);
          return { status: 200 };
        },
        download: async () => ({ status: 200 }),
        removeLocal: () => {},
      },
      bucket: 'b', base: 'https://x', uid: 'U1', token: async () => 'tok', canTransfer: () => true,
    });
    await expect(t.upload('photos/big-photo.jpg')).rejects.toThrow(/too big/);
    await t.upload('photos/ok-photo.jpg');
    expect(calls).toEqual([`POST https://x/v0/b/b/o?name=${encodeURIComponent('users/U1/files/photos/ok-photo.jpg')}`, 'send https://x/upload/1']);
    await expect(t.upload('photos/x-send.jpg')).rejects.toThrow(/never uploaded/);

    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    await joined(a);
    const real = servers.U1.transport;
    servers.U1.transport = (local, o) => ({ ...real(local, o), upload: () => t.upload('photos/big-photo.jpg') });
    a.files.set('photos/FC-1-photo.jpg', 'HUGE');
    await a.app.fitChecks.put(check('FC-1'));
    await a.backup.syncNow();
    expect(servers.U1.docs('fitChecks').map((d) => d.id)).toEqual(['FC-1']);
    expect(await a.inner.syncFiles.all()).toEqual([]);
  });
});

describe('B14 a photo the other phone has not uploaded yet', () => {
  it('a 404 on download is retried with a backoff for days; a 404 on delete is done', async () => {
    const statuses: Record<string, number> = {};
    const t = createStorageTransport({
      http: {
        exists: () => false, size: () => 10,
        request: async () => ({ status: 404, headers: {} }),
        send: async () => ({ status: 200 }),
        download: async (url) => ({ status: statuses[url] ?? 404 }),
        removeLocal: () => {},
      },
      bucket: 'b', base: 'https://x', uid: 'U1', token: async () => 'tok', canTransfer: () => true,
    });
    await expect(t.download('photos/a-photo.jpg')).rejects.toBeInstanceOf(RemoteMissing);
    await expect(t.remove('photos/a-photo.jpg')).rejects.toBeInstanceOf(RemoteMissing);

    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    const b = phone(servers, 'dev-b');
    a.files.set('photos/FC-1-photo.jpg', 'JPEG');
    await a.app.fitChecks.put(check('FC-1'));
    // A's row goes up, its photo doesn't yet.
    await joined(b);
    const realT = servers.U1.transport;
    servers.U1.transport = (local, o) => {
      const tr = realT(local, o);
      return { ...tr, canTransfer: () => false };
    };
    await a.backup.syncNow();
    servers.U1.transport = realT;
    await b.backup.syncNow();
    const missing = (await b.inner.syncFiles.all())[0]!;
    expect(missing).toMatchObject({ path: 'photos/FC-1-photo.jpg', op: 'down', tries: 1 });
    // Days of tries later it's still waiting (24 tries, the backoff capped at 6 h).
    for (let i = 0; i < 15; i += 1) {
      b.clock.now += 6 * 3_600_000;
      await b.backup.syncNow();
    }
    expect((await b.inner.syncFiles.all())[0]).toMatchObject({ op: 'down' });
    a.clock.now = b.clock.now;
    await a.backup.syncNow();
    b.clock.now += 6 * 3_600_000;
    await b.backup.syncNow();
    expect(b.files.get('photos/FC-1-photo.jpg')).toBe('JPEG');
  });
});

describe('B15 "Delete all photos" while backed up', () => {
  it("removes the backup's copies too", async () => {
    const servers = { U1: createMemoryRemote(T0) };
    const a = phone(servers, 'dev-a');
    a.files.set('photos/FC-1-photo.jpg', 'JPEG');
    await a.app.fitChecks.put(check('FC-1'));
    await joined(a);
    expect(servers.U1.files.has('photos/FC-1-photo.jpg')).toBe(true);
    a.files.clear();
    await a.backup.forgetPhotos();
    await a.backup.syncNow();
    expect(servers.U1.files.size).toBe(0);
    expect(servers.U1.docs('fitChecks').map((d) => d.id)).toEqual(['FC-1']);
  });
});
