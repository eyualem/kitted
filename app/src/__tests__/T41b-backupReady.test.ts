// T41b round 3 · SB6.1d (tasks/T41b/TESTING.md): a backup round must not pull before the age question. `createBackup` takes a
// `ready()` dep (false while a Welcome restore waits for the age answer, and false while the under-18 lock is set). While it is
// false a round returns 'off' and does nothing: no connection, no pull, no row written, no `sync.uid`. Memory remote, no network.
import { createMemoryRemote } from '@/sync/memoryRemote';
import { SYNC_UID_KEY } from '@/sync/backup';
import { backupRig, fitIds, fitRow, newPhone, piece, T0, type Phone } from '@/testing/t41bBackup';

/** The account already holds 2 fits and a piece (pushed from another phone). */
async function accountWithRows() {
  const remote = createMemoryRemote(T0);
  const a = newPhone(remote, 'dev-a');
  await a.inner.fitChecks.put(fitRow('A1'));
  await a.inner.fitChecks.put(fitRow('A2'));
  await a.inner.closet.put(await piece('AI1'));
  await a.engine.markAllDirty({});
  await a.engine.push();
  return remote;
}

/** A fresh phone mid-Welcome: the account is saved (the rig's `account()` says U1, a real non-guest Firebase user), onboarding is not
 *  done, and it holds one fit of its own that must not go up either. */
async function welcomePhone(remote: ReturnType<typeof createMemoryRemote>): Promise<Phone> {
  const p = newPhone(remote, 'dev-b');
  await p.inner.setKv('account.user', JSON.stringify({ uid: 'U1', provider: 'apple' }));
  await p.inner.fitChecks.put(fitRow('B1'));
  return p;
}

const untouched = async (p: Phone, remote: ReturnType<typeof createMemoryRemote>, writesBefore: number, commitsBefore: number) => {
  expect(await fitIds(p.inner)).toEqual(['B1']);
  expect((await p.inner.closet.all()).length).toBe(0);
  expect(await p.inner.getKv(SYNC_UID_KEY)).toBeNull();
  expect(await p.inner.syncRows.all()).toEqual([]);
  expect(await p.inner.syncFiles.all()).toEqual([]);
  expect(remote.writes).toBe(writesBefore);
  expect(remote.commits).toBe(commitsBefore);
};

describe('SB6.1d · no backup round before the age question', () => {
  it('SB6.1d · not ready (a Welcome restore waits for the age): the round is off, no connect, nothing pulled, no row written, no sync.uid', async () => {
    const remote = await accountWithRows();
    const writes = remote.writes;
    const commits = remote.commits;
    const p = await welcomePhone(remote);
    let asked = 0;
    const rig = backupRig(p, remote, { ready: async () => (asked++, false) });
    expect(await rig.backup.syncNow()).toBe('off');
    expect(await rig.backup.syncNow()).toBe('off');
    expect(asked).toBeGreaterThan(0);
    expect(rig.connects).toEqual([]);
    expect(rig.uploads).toEqual([]);
    await untouched(p, remote, writes, commits);
  });

  it('SB6.1d · the under-18 lock set: the round is off, no connect, nothing pulled, no row written, no sync.uid', async () => {
    const remote = await accountWithRows();
    const writes = remote.writes;
    const commits = remote.commits;
    const p = await welcomePhone(remote);
    const lock = { set: true };
    const rig = backupRig(p, remote, { ready: () => !lock.set });
    expect(await rig.backup.syncNow()).toBe('off');
    expect(rig.connects).toEqual([]);
    await untouched(p, remote, writes, commits);
    // A phone that is already joined to the account (rows and sync.uid on it) also stops sending while the lock is set.
    const q = newPhone(remote, 'dev-c');
    const rigQ = backupRig(q, remote);
    expect(await rigQ.backup.syncNow()).toBe('ok');
    expect(await q.inner.getKv(SYNC_UID_KEY)).toBe('U1');
    lock.set = true;
    const locked = backupRig(q, remote, { ready: () => !lock.set });
    q.clock.now += 50;
    await q.app.fitChecks.put(fitRow('Q1'));
    const writesQ = remote.writes;
    expect(await locked.backup.syncNow()).toBe('off');
    expect(locked.connects).toEqual([]);
    expect(remote.writes).toBe(writesQ);
  });

  it('SB6.1d · ready: the round runs as usual and pulls the account\'s rows, then the phone\'s own go up', async () => {
    const remote = await accountWithRows();
    const p = await welcomePhone(remote);
    const answered = { yes: false };
    const rig = backupRig(p, remote, { ready: () => answered.yes });
    expect(await rig.backup.syncNow()).toBe('off');
    expect(rig.connects).toEqual([]);
    // He answered 18 or over: the next round is the normal first round.
    answered.yes = true;
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(rig.connects).toEqual(['U1']);
    expect(await fitIds(p.inner)).toEqual(['A1', 'A2', 'B1']);
    expect((await p.inner.closet.all()).map((c) => c.id)).toEqual(['AI1']);
    expect(await p.inner.getKv(SYNC_UID_KEY)).toBe('U1');
    expect(remote.docs('fitChecks').map((d) => d.id)).toEqual(['A1', 'A2', 'B1']);
  });
});
