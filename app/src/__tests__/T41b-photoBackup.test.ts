// T41b · Photo backup and the gate (specs/sign-in-and-backup.md SB4.1a, SB4.1c, SB4.3a (the switch's logic), SB4.3b, SB-GATE;
// tasks/T41b/TESTING.md): the backup over the memory remote and a recording file transport, on the memory store. The
// photos are file names only (no real person's photo), nothing is sent anywhere, no AI.
import { createMemoryRemote } from '@/sync/memoryRemote';
import { RemoteUnavailable } from '@/sync/remote';
import { KV_SYNCED, isSyncedKv, kvPolicy } from '@/sync/schema';
import { backsUp } from '@/sync/backup';
import { PHOTO_BACKUP_KEY, PHOTO_STEP_KEY, isPhotoBackupOn, markPhotoStepOffered, photoStepFor, turnOffPhotoBackup, turnOnPhotoBackup } from '@/sync/photoBackup';
import { backupRig, fitRow, newPhone, piece, T0, type Phone } from '@/testing/t41bBackup';

/** A phone with kept photos in the three backed-up folders, plus things that must never go up: a face-hidden send copy, a cache file and a
 *  path outside the three folders, all named inside the rows. */
async function photoPhone(remote: ReturnType<typeof createMemoryRemote>, id = 'dev-a'): Promise<Phone> {
  const p = newPhone(remote, id);
  await p.inner.fitChecks.put(
    fitRow('FC1', {
      photoFile: 'photos/FC1-photo.jpg',
      thumbFile: 'photos/FC1-thumb.jpg',
      details: { sendCopy: 'photos/FC1-photo-send.jpg', cache: 'file:///var/mobile/Containers/Data/Application/X/Library/Caches/upload/c.jpg', other: 'tmp/kitted-capture-1.jpg' } as never,
    }),
  );
  await p.inner.closet.put(await piece('IT1', { cropFile: 'closet/IT1-top.png', photoFile: 'scans/IT1-scan.jpg' }));
  for (const f of ['photos/FC1-photo.jpg', 'photos/FC1-thumb.jpg', 'closet/IT1-top.png', 'scans/IT1-scan.jpg', 'photos/FC1-photo-send.jpg']) p.files.set(f, 'BYTES');
  return p;
}
const KEPT = ['closet/IT1-top.png', 'photos/FC1-photo.jpg', 'photos/FC1-thumb.jpg', 'scans/IT1-scan.jpg'];
const sorted = (a: readonly string[]) => [...a].sort();

describe('SB4.1a · photo backup is off after sign-in; with it off no photo is uploaded', () => {
  it('SB4.1a · signed in with the setting absent, the rows go up and upload is never called, not for a photo added later, a second round or a restore', async () => {
    const remote = createMemoryRemote(T0);
    const a = await photoPhone(remote);
    const rig = backupRig(a, remote);
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(remote.docs('fitChecks').map((d) => d.id)).toEqual(['FC1']);
    expect(remote.docs('closetItems').map((d) => d.id)).toEqual(['IT1']);
    expect(rig.uploads).toEqual([]);
    expect(await a.inner.syncFiles.all()).toEqual([]);
    expect(remote.files.size).toBe(0);

    // A photo added after the sign-in (through the tracked store), then the app comes back to the foreground (another round).
    a.clock.now += 50;
    await a.app.fitChecks.put(fitRow('FC2', { photoFile: 'photos/FC2-photo.jpg' }));
    a.files.set('photos/FC2-photo.jpg', 'BYTES');
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(remote.docs('fitChecks').map((d) => d.id)).toEqual(['FC1', 'FC2']);
    expect(rig.uploads).toEqual([]);
    expect(remote.files.size).toBe(0);

    // A restore on a second phone: the rows come down, nothing goes up.
    const b = newPhone(remote, 'dev-b');
    const rigB = backupRig(b, remote);
    expect(await rigB.backup.syncNow()).toBe('ok');
    expect(await b.inner.fitChecks.get('FC2')).not.toBeNull();
    expect(rigB.uploads).toEqual([]);
    expect(remote.files.size).toBe(0);
  });

  it('SB4.1a · with the setting on, every kept photo goes up exactly once, under photos, closet and scans, and never a send copy, a cache or a stray path', async () => {
    const remote = createMemoryRemote(T0);
    const a = await photoPhone(remote);
    const rig = backupRig(a, remote);
    await rig.backup.syncNow();
    expect(rig.uploads).toEqual([]);
    // The rows were pushed while it was off; turning it on must still bring their photos.
    a.clock.now += 50;
    await a.app.setKv(PHOTO_BACKUP_KEY, 'on');
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(sorted(rig.uploads)).toEqual(KEPT);
    expect([...remote.files.keys()].sort()).toEqual(KEPT);
    expect(rig.uploads.some((p) => /-send\.|Caches|tmp\//.test(p))).toBe(false);
    // Once per photo: another round uploads nothing more.
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(rig.uploads).toHaveLength(4);
    // A photo he adds afterwards goes up too, once.
    a.clock.now += 50;
    await a.app.fitChecks.put(fitRow('FC3', { photoFile: 'photos/FC3-photo.jpg' }));
    a.files.set('photos/FC3-photo.jpg', 'BYTES');
    await rig.backup.syncNow();
    expect(sorted(rig.uploads)).toEqual(sorted([...KEPT, 'photos/FC3-photo.jpg']));
  });

  it('SB4.1a · turning it off stops further uploads, including a photo that was waiting to go up', async () => {
    const remote = createMemoryRemote(T0);
    const a = await photoPhone(remote);
    const rig = backupRig(a, remote);
    // On, but transfers are blocked (cellular): the photos are waiting.
    await a.inner.setKv(PHOTO_BACKUP_KEY, 'on');
    rig.transfer.on = false;
    await rig.backup.syncNow();
    expect(rig.uploads).toEqual([]);
    // He turns it off, then the phone gets Wi-Fi: nothing may go up.
    a.clock.now += 50;
    await a.app.setKv(PHOTO_BACKUP_KEY, 'off');
    rig.transfer.on = true;
    await rig.backup.syncNow();
    await rig.backup.syncNow();
    expect(rig.uploads).toEqual([]);
    expect(remote.files.size).toBe(0);
    // A new photo while it is off: still nothing.
    a.clock.now += 50;
    await a.app.fitChecks.put(fitRow('FC4', { photoFile: 'photos/FC4-photo.jpg' }));
    a.files.set('photos/FC4-photo.jpg', 'BYTES');
    await rig.backup.syncNow();
    expect(rig.uploads).toEqual([]);
  });
});

describe('SB4.1c · the setting belongs to the account', () => {
  it('SB4.1c · backup.photos is a synced pref, and the photo step is this phone\'s own mark', () => {
    expect(PHOTO_BACKUP_KEY).toBe('backup.photos');
    expect(Object.keys(KV_SYNCED)).toContain('backup.photos');
    expect(isSyncedKv('backup.photos')).toBe(true);
    expect(kvPolicy('backup.photos')).not.toBe('local');
    expect(isSyncedKv(PHOTO_STEP_KEY)).toBe(false);
  });

  it('SB4.1c · a second phone pulls the setting; a restore to an account with it on skips the photo step, off or absent shows it', async () => {
    const remote = createMemoryRemote(T0);
    const a = newPhone(remote, 'dev-a');
    await a.app.setKv(PHOTO_BACKUP_KEY, 'on');
    await a.engine.push();
    const b = newPhone(remote, 'dev-b');
    await b.engine.pull();
    expect(await b.inner.getKv(PHOTO_BACKUP_KEY)).toBe('on');
    expect(await isPhotoBackupOn(b.inner)).toBe(true);
    expect(await photoStepFor(b.inner)).toBe('skip');

    // The account's setting is off: the step shows.
    a.clock.now += 100;
    await a.app.setKv(PHOTO_BACKUP_KEY, 'off');
    await a.engine.push();
    const c = newPhone(remote, 'dev-c');
    await c.engine.pull();
    expect(await isPhotoBackupOn(c.inner)).toBe(false);
    expect(await photoStepFor(c.inner)).toBe('show');

    // The account never had it: the step shows.
    const empty = newPhone(createMemoryRemote(T0), 'dev-d');
    await empty.engine.pull();
    expect(await isPhotoBackupOn(empty.inner)).toBe(false);
    expect(await photoStepFor(empty.inner)).toBe('show');
  });

  it('SB4.1c · the step is offered once: after it was shown, the next launch skips it', async () => {
    const p = newPhone(createMemoryRemote(T0), 'dev-a');
    expect(await photoStepFor(p.inner)).toBe('show');
    await markPhotoStepOffered(p.inner);
    expect(await photoStepFor(p.inner)).toBe('skip');
    expect(await photoStepFor(p.inner)).toBe('skip');
    // Turning it on is what the step's button does: on reads as on.
    await turnOnPhotoBackup(p.inner);
    expect(await p.inner.getKv(PHOTO_BACKUP_KEY)).toBe('on');
    expect(await isPhotoBackupOn(p.inner)).toBe(true);
  });
});

describe('SB4.3a and SB4.3b · turning photo backup off', () => {
  async function onPhone() {
    const remote = createMemoryRemote(T0);
    const p = await photoPhone(remote);
    await p.inner.setKv(PHOTO_BACKUP_KEY, 'on');
    await p.inner.syncFiles.put({ path: 'photos/FC1-photo.jpg', op: 'up', tries: 0, nextAt: 0, queuedAt: 1 });
    await p.inner.syncRows.put({ id: 'fitChecks/FC1', coll: 'fitChecks', rowKey: 'FC1', localAt: 5, pushedAt: 5, deleted: false, by: 'dev-a', files: KEPT });
    return p;
  }
  const snapshot = async (p: Phone) =>
    JSON.stringify([await p.inner.syncRows.all(), await p.inner.syncFiles.all(), await p.inner.fitChecks.all(), await p.inner.closet.all(), [...p.files.entries()]]);

  it('SB4.3a · confirm, then the job runs once, then the setting is off; rows and photos on the phone are untouched', async () => {
    const p = await onPhone();
    const log: string[] = [];
    const rowsBefore = JSON.stringify([await p.inner.fitChecks.all(), await p.inner.closet.all(), [...p.files.entries()]]);
    const r = await turnOffPhotoBackup({
      store: p.inner,
      confirm: async () => (log.push('confirm'), true),
      deleteBackedUp: async () => void log.push('job'),
    });
    expect(r).toEqual({ status: 'off' });
    expect(log).toEqual(['confirm', 'job']);
    expect(await isPhotoBackupOn(p.inner)).toBe(false);
    expect(JSON.stringify([await p.inner.fitChecks.all(), await p.inner.closet.all(), [...p.files.entries()]])).toBe(rowsBefore);
  });

  it('SB4.3a · Cancel calls nothing and the setting stays on', async () => {
    const p = await onPhone();
    const log: string[] = [];
    const before = await snapshot(p);
    const r = await turnOffPhotoBackup({
      store: p.inner,
      confirm: async () => (log.push('confirm'), false),
      deleteBackedUp: async () => void log.push('job'),
    });
    expect(r).toEqual({ status: 'cancelled' });
    expect(log).toEqual(['confirm']);
    expect(await p.inner.getKv(PHOTO_BACKUP_KEY)).toBe('on');
    expect(await snapshot(p)).toBe(before);
  });

  it('SB4.3b · offline: the job rejects, the setting stays on, the bookkeeping is unchanged, and the result says offline', async () => {
    const p = await onPhone();
    const before = await snapshot(p);
    const r = await turnOffPhotoBackup({
      store: p.inner,
      confirm: async () => true,
      deleteBackedUp: async () => {
        throw new RemoteUnavailable();
      },
    });
    expect(r).toEqual({ status: 'offline' });
    expect(await p.inner.getKv(PHOTO_BACKUP_KEY)).toBe('on');
    expect(await isPhotoBackupOn(p.inner)).toBe(true);
    expect(await snapshot(p)).toBe(before);
  });

  it('SB4.3b · a failed job: the setting stays on, nothing changes, and the result says failed (not offline)', async () => {
    const p = await onPhone();
    const before = await snapshot(p);
    const r = await turnOffPhotoBackup({
      store: p.inner,
      confirm: async () => true,
      deleteBackedUp: async () => {
        throw new Error('server 500');
      },
    });
    expect(r).toEqual({ status: 'failed' });
    expect(await p.inner.getKv(PHOTO_BACKUP_KEY)).toBe('on');
    expect(await snapshot(p)).toBe(before);
  });
});

describe('SB-GATE · nothing backs up or restores with the switch off, for a guest or while signed out', () => {
  /** '@/sync/allowed' loaded fresh with ACCOUNTS_BUILT as given. */
  function allowedWith(built: boolean): typeof import('@/sync/allowed') {
    let mod!: typeof import('@/sync/allowed');
    jest.isolateModules(() => {
      jest.doMock('@/config/features', () => ({ ...jest.requireActual('@/config/features'), ACCOUNTS_BUILT: built }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('@/sync/allowed') as typeof import('@/sync/allowed');
    });
    jest.dontMock('@/config/features');
    return mod;
  }

  it('SB-GATE · syncAllowed is the switch AND iPhone AND no demo screen', () => {
    const real = allowedWith(false);
    expect(real.syncAllowed({ platformOS: 'ios', demoScreen: null })).toBe(false);
    const on = allowedWith(true);
    expect(on.syncAllowed({ platformOS: 'ios', demoScreen: null })).toBe(true);
    expect(on.syncAllowed({ platformOS: 'android', demoScreen: null })).toBe(false);
    expect(on.syncAllowed({ platformOS: 'web', demoScreen: null })).toBe(false);
    expect(on.syncAllowed({ platformOS: 'ios', demoScreen: 130 })).toBe(false);
  });

  it('SB-GATE · with the real flag (off) a signed-in phone never connects and nothing is written', async () => {
    const real = allowedWith(false);
    const remote = createMemoryRemote(T0);
    const p = await photoPhone(remote);
    const rig = backupRig(p, remote, { allowed: () => real.syncAllowed({ platformOS: 'ios', demoScreen: null }) });
    expect(await rig.backup.syncNow()).toBe('off');
    expect(rig.connects).toEqual([]);
    expect(remote.commits).toBe(0);
    expect(remote.writes).toBe(0);
    expect(rig.uploads).toEqual([]);
    expect(await p.inner.syncRows.all()).toEqual([]);
  });

  it('SB-GATE · with it on, a guest, a signed-out phone and a different user push nothing and call no server; the real user does push', async () => {
    const on = allowedWith(true);
    const allowed = () => on.syncAllowed({ platformOS: 'ios', demoScreen: null });
    const cases: [string, Parameters<typeof backupRig>[2]][] = [
      ['a guest', { firebaseUser: async () => ({ uid: 'U1', isAnonymous: true }) }],
      ['signed out of the app', { account: async () => null }],
      ['signed out of Firebase', { firebaseUser: async () => null }],
      ['a different user than the saved account', { firebaseUser: async () => ({ uid: 'U2', isAnonymous: false }) }],
    ];
    for (const [name, over] of cases) {
      const remote = createMemoryRemote(T0);
      const p = await photoPhone(remote);
      const rig = backupRig(p, remote, { allowed, ...over });
      expect([name, await rig.backup.syncNow()]).toEqual([name, 'off']);
      expect([name, rig.connects, remote.commits, remote.writes, rig.uploads]).toEqual([name, [], 0, 0, []]);
    }
    const remote = createMemoryRemote(T0);
    const p = await photoPhone(remote);
    const rig = backupRig(p, remote, { allowed });
    expect(await rig.backup.syncNow()).toBe('ok');
    expect(rig.connects).toEqual(['U1']);
    expect(remote.writes).toBeGreaterThan(0);
  });

  it('SB-GATE · backsUp: only the app account that is the Firebase user, not a guest', () => {
    expect(backsUp({ uid: 'U1' }, { uid: 'U1', isAnonymous: false })).toEqual({ uid: 'U1' });
    expect(backsUp({ uid: 'U1' }, { uid: 'U1', isAnonymous: true })).toBeNull();
    expect(backsUp({ uid: 'U1' }, { uid: 'U2', isAnonymous: false })).toBeNull();
    expect(backsUp(null, { uid: 'U1', isAnonymous: false })).toBeNull();
    expect(backsUp({ uid: 'U1' }, null)).toBeNull();
  });
});
