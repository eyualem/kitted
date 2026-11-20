// T41b · Delete account and all data (specs/sign-in-and-backup.md SB9.1a–c; tasks/T41b/TESTING.md): the order revoke, server, phone,
// and what a failure leaves, over recording fakes for Apple's revoke, the server job and the wipe. The wipe in the "nothing was deleted"
// checks is the real one (privacy/wipe.ts deleteAllData) on the memory store with the bundled seed, so "untouched" is shown by the data
// itself. The Keychain is an in-memory stand-in. No network, no AI, no photo.
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import { clearDeviceId, getAgeBlocked, getDeviceId, setAgeBlocked, setDeviceId } from '@/data/secure';
import { runDeleteAccount, type DeleteAccountDeps } from '@/features/account/deleteAccount';
import { getAccount, saveAccount } from '@/features/account/account';
import type { PrivacyFiles } from '@/features/privacy/files';
import { deleteAllData } from '@/features/privacy/wipe';
import { t } from '@/i18n/en';

jest.mock('@/data/secure', () => {
  const k = { ageBlocked: false, deviceId: null as string | null };
  return {
    getAgeBlocked: async () => k.ageBlocked,
    setAgeBlocked: async (b: boolean) => void (k.ageBlocked = b),
    getDeviceId: async () => k.deviceId,
    setDeviceId: async (id: string) => void (k.deviceId = id),
    clearDeviceId: async () => void (k.deviceId = null),
  };
});

async function hisPhone(): Promise<{ store: KittedStore; files: PrivacyFiles; fileCalls: string[] }> {
  const store = createMemoryStore();
  await store.init();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN });
  await saveAccount(store, { uid: 'U1', provider: 'apple', email: null, signedInAt: 1 });
  await setAgeBlocked(false);
  await setDeviceId('D-123');
  const fileCalls: string[] = [];
  const files: PrivacyFiles = {
    usage: () => ({ photos: 0, bytes: 0 }),
    lastSent: () => null,
    deletePhotos: () => void fileCalls.push('photos'),
    deleteLogs: () => void fileCalls.push('logs'),
  };
  return { store, files, fileCalls };
}

const rowsOf = async (s: KittedStore) =>
  JSON.stringify([await s.fitChecks.all(), await s.closet.all(), await s.outfits.all(), await s.chat.all(), await s.facts.all(), await s.profile.all(), await getAccount(s)]);

type Answers = { revoke?: 'ok' | 'cancelled' | 'offline' | 'failed'; server?: 'ok' | 'offline' | 'failed'; provider?: 'apple' | 'google' };
function rig(phone: Awaited<ReturnType<typeof hisPhone>>, a: Answers = {}) {
  const log: string[] = [];
  const d: DeleteAccountDeps = {
    provider: a.provider ?? 'apple',
    revokeApple: async () => (log.push('revoke'), a.revoke ?? 'ok'),
    deleteServer: async () => (log.push('server'), a.server ?? 'ok'),
    wipe: async () => {
      log.push('wipe');
      await deleteAllData({ store: phone.store, files: phone.files, clearDeviceId, demo: false });
    },
  };
  return { d, log };
}

describe('SB9.1a · delete runs revoke, server, phone, in that order, once each', () => {
  it('SB9.1a · an Apple account: the call log is exactly revoke, server, wipe', async () => {
    const phone = await hisPhone();
    const { d, log } = rig(phone);
    expect(await runDeleteAccount(d)).toEqual({ kind: 'deleted' });
    expect(log).toEqual(['revoke', 'server', 'wipe']);
    expect(await phone.store.fitChecks.all()).toEqual([]);
    expect(await getAccount(phone.store)).toBeNull();
    expect(await getDeviceId()).toBeNull();
  });

  it('SB9.1a · a Google account: server, wipe (no revoke step)', async () => {
    const phone = await hisPhone();
    const { d, log } = rig(phone, { provider: 'google' });
    expect(await runDeleteAccount(d)).toEqual({ kind: 'deleted' });
    expect(log).toEqual(['server', 'wipe']);
    expect(await phone.store.fitChecks.all()).toEqual([]);
  });

  it('SB9.1a · the wipe waits for the server\'s answer', async () => {
    const log: string[] = [];
    let answer!: (v: 'ok') => void;
    const server = new Promise<'ok'>((r) => (answer = r));
    const outcome = runDeleteAccount({
      provider: 'apple',
      revokeApple: async () => (log.push('revoke'), 'ok'),
      deleteServer: () => (log.push('server'), server),
      wipe: async () => void log.push('wipe'),
    }).then((v) => v, (e: unknown) => e);
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(log).toEqual(['revoke', 'server']);
    answer('ok');
    expect(await outcome).toEqual({ kind: 'deleted' });
    expect(log).toEqual(['revoke', 'server', 'wipe']);
  });
});

describe('SB9.1b · offline or a server failure deletes nothing', () => {
  it('SB9.1b · the server step offline: the log ends after server, nothing on the phone changed, the result says offline', async () => {
    const phone = await hisPhone();
    const before = await rowsOf(phone.store);
    await setAgeBlocked(true);
    const { d, log } = rig(phone, { server: 'offline' });
    expect(await runDeleteAccount(d)).toEqual({ kind: 'offline' });
    expect(log).toEqual(['revoke', 'server']);
    expect(await rowsOf(phone.store)).toBe(before);
    expect(phone.fileCalls).toEqual([]);
    expect(await getDeviceId()).toBe('D-123');
    expect((await getAccount(phone.store))?.uid).toBe('U1');
    expect(t('acct.delete.offline' as never)).toBe('Deleting your account needs a connection. Nothing was deleted.');
  });

  it('SB9.1b · a server failure: same, the result is failed, and a second attempt runs the whole order again', async () => {
    const phone = await hisPhone();
    const before = await rowsOf(phone.store);
    const answers: Answers = { server: 'failed' };
    const { d, log } = rig(phone, answers);
    expect(await runDeleteAccount(d)).toEqual({ kind: 'failed' });
    expect(log).toEqual(['revoke', 'server']);
    expect(await rowsOf(phone.store)).toBe(before);
    expect(phone.fileCalls).toEqual([]);
    expect((await getAccount(phone.store))?.uid).toBe('U1');

    answers.server = 'ok';
    expect(await runDeleteAccount(d)).toEqual({ kind: 'deleted' });
    expect(log).toEqual(['revoke', 'server', 'revoke', 'server', 'wipe']);
    expect(await phone.store.fitChecks.all()).toEqual([]);
  });

  it('SB9.1b · Apple\'s sheet cancelled: the server is never called and nothing is deleted', async () => {
    const phone = await hisPhone();
    const before = await rowsOf(phone.store);
    const { d, log } = rig(phone, { revoke: 'cancelled' });
    expect(await runDeleteAccount(d)).toEqual({ kind: 'cancelled' });
    expect(log).toEqual(['revoke']);
    expect(await rowsOf(phone.store)).toBe(before);
    expect(phone.fileCalls).toEqual([]);
    expect(await getDeviceId()).toBe('D-123');
  });

  it('SB9.1b · the Apple revoke failing: the server is never called and nothing is deleted', async () => {
    const phone = await hisPhone();
    const before = await rowsOf(phone.store);
    const { d, log } = rig(phone, { revoke: 'failed' });
    expect(await runDeleteAccount(d)).toEqual({ kind: 'failed' });
    expect(log).toEqual(['revoke']);
    expect(await rowsOf(phone.store)).toBe(before);
    expect(phone.fileCalls).toEqual([]);
  });

  it('SB9.1b · the Apple revoke offline: the server is never called, nothing is deleted, the result says offline', async () => {
    const phone = await hisPhone();
    const before = await rowsOf(phone.store);
    const { d, log } = rig(phone, { revoke: 'offline' });
    expect(await runDeleteAccount(d)).toEqual({ kind: 'offline' });
    expect(log).toEqual(['revoke']);
    expect(await rowsOf(phone.store)).toBe(before);
  });
});

describe('SB9.1c · the under-18 lock stays after a delete', () => {
  it('SB9.1c · a phone locked under 18 stays locked after a delete that wiped everything else', async () => {
    const phone = await hisPhone();
    await setAgeBlocked(true);
    const { d, log } = rig(phone);
    expect(await runDeleteAccount(d)).toEqual({ kind: 'deleted' });
    expect(log).toEqual(['revoke', 'server', 'wipe']);
    expect(await phone.store.profile.all()).toEqual([]);
    expect(await getDeviceId()).toBeNull();
    expect(await getAgeBlocked()).toBe(true);
  });

  it('SB9.1c · a failed delete leaves the lock where it was too', async () => {
    const phone = await hisPhone();
    await setAgeBlocked(true);
    const { d } = rig(phone, { server: 'failed' });
    await runDeleteAccount(d);
    expect(await getAgeBlocked()).toBe(true);
  });
});
