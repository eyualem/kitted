// T41b · What backs up and what never does (specs/sign-in-and-backup.md SB5.1a–c; tasks/T41b/TESTING.md): the sync schema and the
// engine over the memory remote. The bundled seed supplies real fit checks, readings, closet pieces, outfits, wear log and facts.
// Profile (CLAUDE.md rule 6): no photo, no person; the name and age band are stand-in sentinels. Nothing is sent anywhere.
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { loadScenario } from '@/data/seedLoader';
import type { ChatMessage } from '@/data/types';
import { rowToData } from '@/sync/codec';
import { createMemoryRemote } from '@/sync/memoryRemote';
import { KV_SYNCED, SYNCED_COLLECTIONS, SYNCED_TABLES, TABLE_POLICY, isSyncedKv, kvPolicy, tableForCollection } from '@/sync/schema';
import { fitRow, newPhone, profileRow, T0 } from '@/testing/t41bBackup';

const NAME = 'Zelda-SENTINEL';
const BAND = '22-25';
const chat = (id: string, text: string): ChatMessage => ({
  id, createdAt: 1, role: 'user', kind: 'text', text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {},
});

/** Every key and every string or number leaf of a doc, found by walking it and the JSON texts inside it. */
function walk(v: unknown, keys: Set<string>, leaves: unknown[], depth = 0): void {
  if (depth > 14 || v === null || v === undefined) return;
  if (typeof v === 'string') {
    leaves.push(v);
    if ((v.startsWith('{') || v.startsWith('[')) && v.length < 1_000_000) {
      try {
        walk(JSON.parse(v) as unknown, keys, leaves, depth + 1);
      } catch {
        // plain text
      }
    }
    return;
  }
  if (typeof v === 'number' || typeof v === 'boolean') {
    leaves.push(v);
    return;
  }
  if (Array.isArray(v)) return v.forEach((x) => walk(x, keys, leaves, depth + 1));
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    keys.add(k);
    walk(x, keys, leaves, depth + 1);
  }
}

const COLLECTIONS_TO_WALK = [...SYNCED_COLLECTIONS, 'chatMessages', 'usageDays'];
function everythingOnTheServer(remote: ReturnType<typeof createMemoryRemote>) {
  const keys = new Set<string>();
  const leaves: unknown[] = [];
  let docs = 0;
  for (const c of COLLECTIONS_TO_WALK) {
    for (const d of remote.docs(c)) {
      docs += 1;
      walk(d, keys, leaves);
    }
  }
  return { keys, leaves, docs, json: JSON.stringify(COLLECTIONS_TO_WALK.map((c) => remote.docs(c))) };
}

async function seededPhone(remote: ReturnType<typeof createMemoryRemote>, id: string) {
  const p = newPhone(remote, id);
  await loadScenario(p.inner, seed, { scenario: 'full', zone: US_EASTERN });
  return p;
}

describe('SB5.1a · chat messages never reach the server', () => {
  it('SB5.1a · the schema: chat is local, no chatMessages collection, none in the synced list', () => {
    expect(TABLE_POLICY.chat).toBe('local');
    expect(SYNCED_COLLECTIONS).not.toContain('chatMessages');
    expect(SYNCED_TABLES as readonly string[]).not.toContain('chat');
    expect(tableForCollection('chatMessages')).toBeNull();
  });

  it('SB5.1a · a store full of chat rows, synced through the engine, puts no chat row, text or payload in any remote doc', async () => {
    const remote = createMemoryRemote(T0);
    const a = await seededPhone(remote, 'dev-a');
    expect((await a.inner.chat.all()).length).toBeGreaterThan(3);
    await a.app.chat.put(chat('M-SENT', 'CHAT-TEXT-SENTINEL what shoes with grey chinos'));
    await a.engine.markAllDirty();
    const r = await a.engine.push();
    expect(r.sent).toBeGreaterThan(10);
    expect(r.refused).toBe(0);
    expect(remote.docs('chatMessages')).toEqual([]);
    const all = everythingOnTheServer(remote);
    expect(all.docs).toBe(r.sent);
    expect(all.json).not.toContain('CHAT-TEXT-SENTINEL');
    expect(all.json).not.toContain('M-SENT');
  });

  it("SB5.1a · a pulled account never adds or overwrites chat rows on the other phone", async () => {
    const remote = createMemoryRemote(T0);
    const a = newPhone(remote, 'dev-a');
    const b = newPhone(remote, 'dev-b');
    await a.app.chat.put(chat('M-1', 'from A'));
    await a.app.chat.put(chat('M-2', 'only on A'));
    await a.app.facts.put({ id: 'F-1', key: 'budget', value: 'under $60', source: 'told', createdAt: 1, isDeleted: false });
    await b.app.chat.put(chat('M-1', 'from B, kept'));
    await a.engine.markAllDirty();
    await a.engine.push();
    await b.engine.pull();
    expect((await b.inner.chat.all()).map((m) => [m.id, m.text])).toEqual([['M-1', 'from B, kept']]);
    expect(await b.inner.facts.get('F-1')).not.toBeNull();
  });
});

describe('SB5.1b · name, age band, birth year, the under-18 lock and the other never-sent state never reach the server', () => {
  it('SB5.1b · no remote doc holds the name, band, birth year, height, build or consent, as a key or a value', async () => {
    const remote = createMemoryRemote(T0);
    const a = await seededPhone(remote, 'dev-a');
    await a.app.profile.put(
      profileRow({
        name: NAME, ageBand: BAND as never, ageBandAt: 1_700_000_123_456, birthYear: 1999, heightCm: 187.3, build: 'build-SENTINEL', consentVersion: 'consent-SENT-9',
        consentAt: 1_700_000_987_654,
      }),
    );
    // Local-only kv: the About you draft (name and band), the account, notifications, the resume step.
    await a.app.setKv('onboarding.about', JSON.stringify({ age: BAND, name: NAME }));
    await a.app.setKv('account.user', JSON.stringify({ uid: 'U1', provider: 'apple', email: 'zelda-SENTINEL@example.com', signedInAt: 5 }));
    await a.app.setKv('account.offer', JSON.stringify({ shown: 2 }));
    await a.app.setKv('notify.idea', '0');
    await a.app.setKv('onboarding.step', 'basics');
    await a.app.setKv('onboarding.basics', JSON.stringify({ fit: 'regular', birthYear: 1999 }));
    await a.engine.markAllDirty();
    await a.engine.push();

    const all = everythingOnTheServer(remote);
    // Other tables have their own `name` (a closet piece), so the field names are checked on the profile doc; the values everywhere.
    const profileKeys = new Set<string>();
    for (const d of remote.docs('profile')) walk(d, profileKeys, []);
    for (const k of ['name', 'ageBand', 'ageBandAt', 'birthYear', 'heightCm', 'build', 'consentVersion', 'consentAt']) expect([k, profileKeys.has(k)]).toEqual([k, false]);
    for (const leaf of [NAME, BAND, 1999, 187.3, 'build-SENTINEL', 'consent-SENT-9', 1_700_000_123_456, 1_700_000_987_654]) {
      expect([leaf, all.leaves.includes(leaf)]).toEqual([leaf, false]);
    }
    expect(all.json).not.toContain('SENTINEL');
    expect(all.json).not.toContain('ageBlocked');
    // The profile did go up, with the looks and the fit.
    const prof = remote.docs('profile')[0]!;
    expect(prof.id).toBe('me');
    expect(prof.data).toMatchObject({ fitPreference: 'regular' });
    expect(JSON.parse(String(prof.data!.styles))).toEqual([['minimal', 0.5], ['streetwear', 0.3]]);
    // The prefs docs hold only synced keys, never a local one; the basics went up without the birth year.
    const prefIds = remote.docs('prefs').map((d) => d.id);
    expect(prefIds.length).toBeGreaterThan(0);
    for (const id of prefIds) expect([id, Object.keys(KV_SYNCED).includes(id)]).toEqual([id, true]);
    for (const local of ['onboarding.about', 'account.user', 'account.offer', 'notify.idea', 'onboarding.step']) expect(prefIds).not.toContain(local);
    const basics = remote.docs('prefs').find((d) => d.id === 'onboarding.basics')!;
    expect(JSON.parse(String(basics.data!.value))).toEqual({ fit: 'regular' });
  });

  it('SB5.1b · the local keys are classified local, and the under-18 lock (the Keychain flag) is not a synced key', () => {
    for (const k of ['onboarding.about', 'account.user', 'account.offer', 'notify.idea', 'notify.ready', 'onboarding.step', 'onboarding.styleGame']) {
      expect([k, kvPolicy(k)]).toEqual([k, 'local']);
    }
    // The age lock lives in the Keychain (data/secure.ts, 'kitted.ageBlocked'), not in kv or any table; no spelling of it syncs.
    for (const k of ['kitted.ageBlocked', 'ageBlocked', 'age.blocked', 'account.ageBlocked']) expect([k, isSyncedKv(k)]).toEqual([k, false]);
  });
});

describe('SB5.1c · what is backed up does come back', () => {
  it('SB5.1c · fits, closet, outfits, wear log, Lookbook flags, looks and fit, and Kit\'s facts written on phone A are on phone B, row for row', async () => {
    const remote = createMemoryRemote(T0);
    const a = await seededPhone(remote, 'dev-a');
    await a.inner.fitChecks.put(fitRow('FC-FAV', { isFavorite: true, occasion: 'date', style: 'streetwear' as never, score: 8.5, fixes: [] }));
    await a.inner.facts.put({ id: 'F-9', key: 'budget', value: 'under $60', source: 'told', createdAt: 5, isDeleted: false });
    await a.inner.profile.put(profileRow({ name: NAME, ageBand: BAND as never, birthYear: 1999, consentVersion: '2', consentAt: 5 }));
    await a.engine.markAllDirty();
    expect((await a.engine.push()).refused).toBe(0);

    const b = newPhone(remote, 'dev-b');
    // B already has its own profile: its name, band, birth year and agreement are its own.
    await b.inner.profile.put(profileRow({ name: 'Bo', ageBand: '26-30' as never, ageBandAt: 77, birthYear: 1995, consentVersion: null, consentAt: null, styles: [], fitPreference: '' }));
    await b.engine.pull();

    for (const n of SYNCED_TABLES) {
      if (n === 'profile') continue;
      const rowsA = await (a.inner[n] as unknown as { all(): Promise<object[]> }).all();
      const rowsB = await (b.inner[n] as unknown as { all(): Promise<object[]> }).all();
      if (['fitChecks', 'readings', 'closet', 'outfits', 'wearLog', 'facts'].includes(n)) expect([n, rowsA.length > 0]).toEqual([n, true]);
      const sortBy = (x: object[]) => x.map((r) => JSON.stringify(rowToData(n, r))).sort();
      expect([n, sortBy(rowsB)]).toEqual([n, sortBy(rowsA)]);
    }
    expect((await b.inner.fitChecks.get('FC-FAV'))!.isFavorite).toBe(true);
    expect(await b.inner.facts.get('F-9')).toEqual(await a.inner.facts.get('F-9'));
    const prof = (await b.inner.profile.get('me'))!;
    expect(prof.styles).toEqual([['minimal', 0.5], ['streetwear', 0.3]]);
    expect(prof.fitPreference).toBe('regular');
    expect([prof.name, prof.ageBand, prof.ageBandAt, prof.birthYear]).toEqual(['Bo', '26-30', 77, 1995]);
    expect([prof.consentVersion, prof.consentAt]).toEqual([null, null]);
  });
});

// A pulled profile on a phone that has none yet (a restore): nothing of A's personal state arrives.
describe('SB5.1c · a pulled profile onto an empty phone carries no name, band, birth year or agreement', () => {
  it('SB5.1c · phone B with no profile gets the looks and fit only', async () => {
    const remote = createMemoryRemote(T0);
    const a = newPhone(remote, 'dev-a');
    await a.app.profile.put(profileRow({ name: NAME, ageBand: BAND as never, ageBandAt: 9, birthYear: 1999, consentVersion: '2', consentAt: 5 }));
    await a.engine.push();
    const b = newPhone(remote, 'dev-b');
    await b.engine.pull();
    const prof = (await b.inner.profile.get('me')) as unknown as Record<string, unknown>;
    expect(prof.styles).toEqual([['minimal', 0.5], ['streetwear', 0.3]]);
    expect(prof.fitPreference).toBe('regular');
    for (const k of ['name', 'ageBand', 'ageBandAt']) expect([k, prof[k] ?? null]).toEqual([k, null]);
    expect([prof.birthYear, prof.consentVersion, prof.consentAt]).toEqual([null, null, null]);
  });
});
