// T41b · A new phone and "both have fits" (specs/sign-in-and-backup.md SB6.1a–c, SB7.1's inAccount ids; tasks/T41b/TESTING.md): what an
// account holds, the age stop, the restore, and the choice's real fit ids, over the memory remote and two simulated phones. The accounts
// are made by a first phone pushing real rows through the sync engine. No photo, no network, no AI.
//
// Profile (CLAUDE.md rule 6): no photo is used. The age bands are the ones tapped on About you (22–25, under 18); the name is a stand-in.
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { ABOUT_KEY, BASICS_KEY, LOOKS_KEY } from '@/features/onboarding/basics';
import { hasConsent } from '@/features/onboarding/complete';
import { ONBOARDING_STEP_KEY } from '@/features/onboarding/resume';
import { afterSignIn, getAccount, resolveChoice, saveAccount } from '@/features/account/account';
import type { AccountUser } from '@/features/account/auth';
import { accountChoice, readAccountHoldings, restoreAccount, type RestoreDeps } from '@/features/account/restore';
import { mayUpload } from '@/features/privacy/wipe';
import { counterIds } from '@/services/ids';
import { createMemoryRemote, type MemoryRemote } from '@/sync/memoryRemote';
import { RemoteUnavailable, type RemoteStore } from '@/sync/remote';
import { backupRig, fit, fitIds, newPhone, piece, profileRow, T0 } from '@/testing/t41bBackup';

const T1 = T0 + 5_000_000;
const user: AccountUser = { uid: 'U1', provider: 'apple', email: null, signedInAt: T0 };
const LOOKS = [['minimal', 0.5], ['streetwear', 0.3]];

interface AccountShape {
  fits?: number;
  rechecks?: number;
  failedFits?: number;
  deletedFits?: number;
  pieces?: number;
  softDeletedPieces?: number;
  deletedPieces?: number;
  profile?: boolean | 'no-looks';
}

/** An account: a first phone pushes these rows to the server through the engine. */
async function makeAccount(remote: MemoryRemote, o: AccountShape) {
  const a = newPhone(remote, 'dev-a');
  for (let i = 1; i <= (o.fits ?? 0); i++) await a.app.fitChecks.put(fit(`FA${i}`));
  for (let i = 1; i <= (o.rechecks ?? 0); i++) await a.app.fitChecks.put(fit(`FA-RC${i}`, { parentId: 'FA1' }));
  for (let i = 1; i <= (o.failedFits ?? 0); i++) await a.app.fitChecks.put(fit(`FA-FAIL${i}`, { status: 'failed', score: null }));
  for (let i = 1; i <= (o.deletedFits ?? 0); i++) {
    await a.app.fitChecks.put(fit(`FA-GONE${i}`));
    a.clock.now += 10;
    await a.app.fitChecks.delete(`FA-GONE${i}`);
  }
  for (let i = 1; i <= (o.pieces ?? 0); i++) await a.app.closet.put(await piece(`IT${i}`));
  for (let i = 1; i <= (o.softDeletedPieces ?? 0); i++) await a.app.closet.put(await piece(`IT-SOFT${i}`, { isDeleted: true }));
  for (let i = 1; i <= (o.deletedPieces ?? 0); i++) {
    await a.app.closet.put(await piece(`IT-GONE${i}`));
    a.clock.now += 10;
    await a.app.closet.delete(`IT-GONE${i}`);
  }
  if (o.profile) {
    const styles = o.profile === 'no-looks' ? [] : LOOKS;
    await a.app.profile.put(profileRow({ styles: styles as never, fitPreference: 'regular', name: 'Alice', ageBand: '26-30', birthYear: 1997, consentVersion: '2', consentAt: 5 }));
  }
  expect((await a.engine.push()).refused).toBe(0);
  return a;
}

const ok = (holdings: Awaited<ReturnType<typeof readAccountHoldings>> | { fits: number; pieces: number; profile?: boolean }) => ({ kind: 'ok' as const, user, holdings });
async function emptyStore(): Promise<KittedStore> {
  const s = createMemoryStore();
  await s.init();
  return s;
}

describe('SB6.1a · real holdings decide the path after a Welcome sign-in', () => {
  it('SB6.1a · the counts: scored full checks only, live closet pieces, and whether a profile with looks exists', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 5, rechecks: 2, failedFits: 1, deletedFits: 1, pieces: 3, softDeletedPieces: 1, deletedPieces: 1, profile: true });
    expect(await readAccountHoldings(remote)).toEqual({ fits: 5, pieces: 3, profile: true });
  });

  it('SB6.1a · a profile with no looks is not a saved style profile; re-checks alone are not fits', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 0, rechecks: 2, pieces: 0, profile: 'no-looks' });
    expect(await readAccountHoldings(remote)).toEqual({ fits: 0, pieces: 0, profile: false });
  });

  it('SB6.1a · an account with fits goes to restore; one with only a saved style profile goes to restore too', async () => {
    const withFits = createMemoryRemote(T0);
    await makeAccount(withFits, { fits: 5, pieces: 3, profile: true });
    const h1 = await readAccountHoldings(withFits);
    const s1 = await emptyStore();
    const r1 = await afterSignIn(s1, 'welcome', ok(h1));
    expect(r1).toEqual({ next: 'restore', holdings: h1 });
    expect((await getAccount(s1))?.uid).toBe('U1');

    const profileOnly = createMemoryRemote(T0);
    await makeAccount(profileOnly, { profile: true });
    const h2 = await readAccountHoldings(profileOnly);
    expect(h2).toEqual({ fits: 0, pieces: 0, profile: true });
    const s2 = await emptyStore();
    expect((await afterSignIn(s2, 'welcome', ok(h2))).next).toBe('restore');
  });

  it('SB6.1a · only an account with neither goes to setup, signed in: empty, pieces only, or a profile with no looks', async () => {
    const cases: AccountShape[] = [{}, { pieces: 4 }, { rechecks: 2, profile: 'no-looks' }];
    for (const shape of cases) {
      const remote = createMemoryRemote(T0);
      await makeAccount(remote, shape);
      const h = await readAccountHoldings(remote);
      const s = await emptyStore();
      expect([JSON.stringify(shape), (await afterSignIn(s, 'welcome', ok(h))).next]).toEqual([JSON.stringify(shape), 'setup']);
      expect((await getAccount(s))?.uid).toBe('U1');
    }
  });

  it('SB6.1a · offline the holdings reader rejects (it never reads an empty account)', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 2, profile: true });
    expect((await readAccountHoldings(remote)).fits).toBe(2);
    remote.offline = true;
    await expect(readAccountHoldings(remote)).rejects.toBeInstanceOf(RemoteUnavailable);
  });
});

/** Phone B, a draft from About you, and fakes for sign-out and the Keychain lock. */
async function restoreRig(remote: RemoteStore, age: string | null, over: Partial<RestoreDeps> = {}) {
  const b = await emptyStore();
  await saveAccount(b, user);
  await b.setKv(ABOUT_KEY, JSON.stringify({ age, name: ' Sam ' }));
  await b.setKv(BASICS_KEY, JSON.stringify({ fit: 'slim', birthYear: null }));
  await b.setKv(LOOKS_KEY, JSON.stringify(['workwear']));
  await b.setKv(ONBOARDING_STEP_KEY, 'basics');
  const calls = { n: 0 };
  const counted: RemoteStore = {
    commit: (w) => (calls.n++, remote.commit(w)),
    get: (c, i) => (calls.n++, remote.get(c, i)),
    changesSince: (c, cur, l) => (calls.n++, remote.changesSince(c, cur, l)),
  };
  const signOutCalls: number[] = [];
  const lock: boolean[] = [];
  const progress: { fits: number; pieces: number }[] = [];
  const d: RestoreDeps = {
    store: b, remote: counted, deviceId: 'dev-b', nowMs: () => T1, ids: counterIds(),
    auth: { signOut: async () => void signOutCalls.push(1) },
    setAgeBlocked: async (v) => void lock.push(v),
    onProgress: (c) => progress.push({ ...c }),
    ...over,
  };
  return { b, d, calls, signOutCalls, lock, progress };
}

describe('SB6.1b · under 18 stops and pulls nothing', () => {
  it('SB6.1b · under 18: the age stop, no remote call, no row written, signed out, the lock set', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 5, pieces: 3, profile: true });
    const r = await restoreRig(remote, 'under18');
    expect(await restoreAccount(r.d)).toEqual({ kind: 'underage' });
    expect(r.calls.n).toBe(0);
    for (const t of ['fitChecks', 'closet', 'outfits', 'wearLog', 'facts', 'readings', 'profile', 'chat'] as const) expect([t, await r.b[t].all()]).toEqual([t, []]);
    expect(r.signOutCalls).toEqual([1]);
    expect(await getAccount(r.b)).toBeNull();
    expect(r.lock).toEqual([true]);
  });

  it('SB6.1b · 18 or over: the pull runs and the lock is not touched', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 2, pieces: 1, profile: true });
    const r = await restoreRig(remote, '22-25');
    const res = await restoreAccount(r.d);
    expect(res.kind).toBe('fits');
    expect(r.calls.n).toBeGreaterThan(0);
    expect(r.lock).toEqual([]);
    expect(r.signOutCalls).toEqual([]);
    expect(await getAccount(r.b)).not.toBeNull();
    expect(await fitIds(r.b)).toEqual(['FA1', 'FA2']);
  });

  it('SB6.1b · no age picked yet: it rejects and nothing is pulled', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 2, profile: true });
    const r = await restoreRig(remote, null);
    await expect(restoreAccount(r.d)).rejects.toThrow();
    expect(r.calls.n).toBe(0);
    expect(await r.b.fitChecks.all()).toEqual([]);
    expect(r.lock).toEqual([]);
    // Once an age is picked the same call goes through.
    await r.b.setKv(ABOUT_KEY, JSON.stringify({ age: '22-25', name: '' }));
    expect((await restoreAccount(r.d)).kind).toBe('fits');
    expect(r.calls.n).toBeGreaterThan(0);
  });
});

describe('SB6.1c · the restore pulls, counts as rows arrive, then skips setup', () => {
  it('SB6.1c · 5 fits and 3 pieces: the counts only go up and end at 5 fits · 3 pieces; setup is done with this phone\'s age band; no agreement is restored', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 5, rechecks: 1, pieces: 3, profile: true });
    const r = await restoreRig(remote, '22-25');
    const res = await restoreAccount(r.d);
    expect(res).toEqual({ kind: 'fits', fits: 5, pieces: 3 });
    expect(r.progress.length).toBeGreaterThan(0);
    for (let i = 1; i < r.progress.length; i++) {
      expect(r.progress[i]!.fits).toBeGreaterThanOrEqual(r.progress[i - 1]!.fits);
      expect(r.progress[i]!.pieces).toBeGreaterThanOrEqual(r.progress[i - 1]!.pieces);
    }
    expect(r.progress[r.progress.length - 1]).toEqual({ fits: 5, pieces: 3 });
    expect(await fitIds(r.b)).toEqual(['FA-RC1', 'FA1', 'FA2', 'FA3', 'FA4', 'FA5']);
    expect((await r.b.closet.all()).length).toBe(3);

    const prof = (await r.b.profile.get('me'))!;
    expect(prof.onboardingDone).toBe(true);
    expect(prof.styles).toEqual(LOOKS);
    expect(prof.fitPreference).toBe('regular');
    expect([prof.ageBand, prof.ageBandAt, prof.name, prof.birthYear]).toEqual(['22-25', T1, 'Sam', null]);
    // The account's agreement is not applied: the camera asks on its first open here.
    expect([prof.consentVersion, prof.consentAt]).toEqual([null, null]);
    expect(await hasConsent(r.b)).toBe(false);
    expect(await mayUpload(r.b)).toBe(false);
    // The setup steps are cleared.
    for (const k of [ABOUT_KEY, BASICS_KEY, LOOKS_KEY, ONBOARDING_STEP_KEY]) expect([k, await r.b.getKv(k)]).toEqual([k, null]);
    expect((await getAccount(r.b))?.uid).toBe('U1');
  });

  it('SB6.1c · an account with only a saved style profile ends with the profile result and no counts', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { profile: true });
    const r = await restoreRig(remote, '22-25');
    expect(await restoreAccount(r.d)).toEqual({ kind: 'profile' });
    const prof = (await r.b.profile.get('me'))!;
    expect(prof.onboardingDone).toBe(true);
    expect(prof.styles).toEqual(LOOKS);
    expect([prof.ageBand, prof.name, prof.consentVersion]).toEqual(['22-25', 'Sam', null]);
    expect(await r.b.fitChecks.all()).toEqual([]);
    expect(await r.b.getKv(ONBOARDING_STEP_KEY)).toBeNull();
  });

  it('SB6.1c · a pull that cannot reach the server gives a retry result and does not mark setup done; the retry works', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 5, pieces: 3, profile: true });
    const r = await restoreRig(remote, '22-25');
    remote.offline = true;
    expect(await restoreAccount(r.d)).toEqual({ kind: 'retry' });
    expect(await r.b.profile.get('me')).toBeNull();
    expect(await r.b.fitChecks.all()).toEqual([]);
    expect(await r.b.getKv(ABOUT_KEY)).not.toBeNull();
    expect(await r.b.getKv(ONBOARDING_STEP_KEY)).toBe('basics');
    expect(r.lock).toEqual([]);
    remote.offline = false;
    expect(await restoreAccount(r.d)).toEqual({ kind: 'fits', fits: 5, pieces: 3 });
    expect((await r.b.profile.get('me'))!.onboardingDone).toBe(true);
  });
});

describe('SB7.1 · "Use the account\'s" uses the account\'s real fit ids', () => {
  /** The server holds FA1–FA3. The phone holds copies of FA1 and FA2, two fits of its own (FP1, FP2) and a re-check of FP1. */
  async function bothHaveFits() {
    const remote = createMemoryRemote(T0);
    const a = await makeAccount(remote, { fits: 3 });
    const p = newPhone(remote, 'dev-p');
    for (const id of ['FA1', 'FA2']) await p.inner.fitChecks.put((await a.inner.fitChecks.get(id))!);
    await p.inner.fitChecks.put(fit('FP1'));
    await p.inner.fitChecks.put(fit('FP2'));
    await p.inner.fitChecks.put(fit('FPR1', { parentId: 'FP1' }));
    return { remote, p };
  }
  const liveOnServer = (remote: MemoryRemote) => remote.docs('fitChecks').filter((d) => !d.deleted).map((d) => d.id).sort();

  it('SB7.1 · the ids passed as inAccount are exactly the account\'s scored full checks, not re-checks or failed ones', async () => {
    const remote = createMemoryRemote(T0);
    await makeAccount(remote, { fits: 3, rechecks: 2, failedFits: 1, deletedFits: 1 });
    const c = await accountChoice(remote);
    expect(c.ready).toBe(true);
    if (c.ready) expect([...c.inAccount].sort()).toEqual(['FA1', 'FA2', 'FA3']);
  });

  it('SB7.1 · useAccount deletes only after the second confirm: this phone\'s own 2 fits and their re-check go, the account\'s 3 remain', async () => {
    const { remote, p } = await bothHaveFits();
    const c = await accountChoice(remote);
    if (!c.ready) throw new Error('the account\'s ids should be ready');
    expect([...c.inAccount].sort()).toEqual(['FA1', 'FA2', 'FA3']);

    // Not confirmed: nothing is deleted and the account is not saved.
    expect(await resolveChoice(p.inner, 'useAccount', { user, inAccount: c.inAccount })).toEqual({ status: 'needsConfirm' });
    expect(await fitIds(p.inner)).toEqual(['FA1', 'FA2', 'FP1', 'FP2', 'FPR1']);
    expect(await getAccount(p.inner)).toBeNull();

    const done = await resolveChoice(p.inner, 'useAccount', { user, inAccount: c.inAccount, confirmed: true });
    expect(done.status).toBe('saved');
    if (done.status === 'saved') expect([...done.deleted].sort()).toEqual(['FP1', 'FP2', 'FPR1']);
    expect(await fitIds(p.inner)).toEqual(['FA1', 'FA2']);

    // The next round brings the third one down; the deleted two never reach the server.
    const rig = backupRig(p, remote, { account: async () => getAccount(p.inner) });
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(await fitIds(p.inner)).toEqual(['FA1', 'FA2', 'FA3']);
    expect(liveOnServer(remote)).toEqual(['FA1', 'FA2', 'FA3']);
    expect(remote.docs('fitChecks').map((d) => d.id).sort()).toEqual(['FA1', 'FA2', 'FA3']);
  });

  it('SB7.1 · Keep both merges: both sets exist afterwards, on the phone and on the server', async () => {
    const { remote, p } = await bothHaveFits();
    const c = await accountChoice(remote);
    if (!c.ready) throw new Error('the account\'s ids should be ready');
    expect(await resolveChoice(p.inner, 'keepBoth', { user, inAccount: c.inAccount })).toEqual({ status: 'saved', deleted: [] });
    const rig = backupRig(p, remote, { account: async () => getAccount(p.inner) });
    expect(await rig.backup.syncNow()).toBe('ok');
    const all = ['FA1', 'FA2', 'FA3', 'FP1', 'FP2', 'FPR1'];
    expect(await fitIds(p.inner)).toEqual(all);
    expect(liveOnServer(remote)).toEqual(all);
  });

  it('SB7.1 · when the account\'s ids cannot be fetched (offline) the choice is not ready, nothing is deleted, nothing is saved', async () => {
    const { remote, p } = await bothHaveFits();
    remote.offline = true;
    const c = await accountChoice(remote);
    expect(c).toEqual({ ready: false, why: 'offline' });
    expect('inAccount' in c).toBe(false);
    expect(await fitIds(p.inner)).toEqual(['FA1', 'FA2', 'FP1', 'FP2', 'FPR1']);
    expect(await getAccount(p.inner)).toBeNull();
  });
});
