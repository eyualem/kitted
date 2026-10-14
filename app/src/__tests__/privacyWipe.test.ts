// Y7 · Privacy & data: the three deletes on the memory store (the web preview's and the tests' store, same interface
// as SQLite), and "Score my fits" off stopping a fit check before his photo is prepped or sent.
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { KV } from '@/data/store';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { giveConsent } from '@/features/onboarding/complete';
import type { PrivacyFiles } from '@/features/privacy/files';
import { bytesParts } from '@/features/privacy/files';
import { deleteAllData, deleteAllPhotos, forgetFacts, mayUpload, withdrawConsent } from '@/features/privacy/wipe';
import { INBOX_KEY } from '@/features/scan/inbox';
import { US_EASTERN } from '@kitted/core';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep, type ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);

function fakeFiles() {
  const calls: string[] = [];
  const files: PrivacyFiles = {
    usage: () => ({ photos: 0, bytes: 0 }),
    lastSent: () => null,
    deletePhotos: () => void calls.push('photos'),
    deleteLogs: () => void calls.push('logs'),
  };
  return { files, calls };
}

/** The Keychain as secure.web.ts holds it: the age block and the device ID. */
function fakeKeychain() {
  const k = { ageBlocked: true, deviceId: 'D-123' as string | null };
  return { k, clearDeviceId: async () => void (k.deviceId = null) };
}

async function fullStore(): Promise<KittedStore> {
  const store = createMemoryStore();
  await store.init();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN });
  return store;
}

/** Gives the seed's checks and pieces real photo paths, as his own photos would have. */
async function withPhotos(store: KittedStore) {
  const checks = await store.fitChecks.all();
  for (const c of checks) await store.fitChecks.put({ ...c, photoFile: `photos/${c.id}-photo.jpg`, thumbFile: `photos/${c.id}-thumb.jpg` });
  const items = await store.closet.all();
  for (const it of items) await store.closet.put({ ...it, photoFile: `photos/${it.id}.jpg`, cropFile: `closet/${it.id}.png`, cropScore: 0.8 });
  await store.chat.put({
    id: 'M-photo', createdAt: 1, role: 'user', kind: 'photo', text: null, cardType: null, fitCheckId: checks[0]!.id, outfitId: null, itemId: null, chips: [],
    payload: { photoUri: 'photos/x-photo.jpg', aspect: 0.75 },
  });
  await store.chat.put({
    id: 'M-which', createdAt: 2, role: 'stylist', kind: 'card', text: null, cardType: 'question', fitCheckId: null, outfitId: null, itemId: null, chips: [],
    payload: { question: 'whichOne', state: 'open', photoUri: 'file:///tmp/kitted-capture-1.jpg', people: [], mode: 'check', parentCheckId: null },
  });
  await store.setKv(INBOX_KEY, JSON.stringify([{ sha256: 'a', keptPath: 'scans/a-photo.jpg' }]));
  return { checks: checks.length, items: items.length };
}

describe('Delete all photos', () => {
  it('removes every photo file and path; scores, readings and the closet stay', async () => {
    const store = await fullStore();
    const before = await withPhotos(store);
    const scores = (await store.fitChecks.all()).map((c) => [c.id, c.score]);
    const readings = (await store.readings.all()).length;
    const { files, calls } = fakeFiles();

    const r = await deleteAllPhotos({ store, files });

    expect(calls).toEqual(['photos']);
    expect(r.checks).toBe(before.checks);
    expect(r.items).toBe(before.items);
    for (const c of await store.fitChecks.all()) expect([c.photoFile, c.thumbFile]).toEqual([null, null]);
    for (const it of await store.closet.all()) expect([it.photoFile, it.cropFile]).toEqual([null, null]);
    expect((await store.fitChecks.all()).map((c) => [c.id, c.score])).toEqual(scores);
    expect((await store.closet.all()).length).toBe(before.items);
    expect((await store.readings.all()).length).toBe(readings);
    expect((await store.chat.get('M-photo'))!.payload).toEqual({ aspect: 0.75 });
    expect(await store.chat.get('M-which')).toBeNull();
    expect(await store.getKv(INBOX_KEY)).toBeNull();
  });
});

describe('Forget what your stylist knows', () => {
  it('deletes every fact for good; the closet and looks stay', async () => {
    const store = await fullStore();
    const facts = (await store.facts.all()).length;
    const items = (await store.closet.all()).length;
    expect(facts).toBeGreaterThan(0);
    expect(await forgetFacts(store)).toBe(facts);
    expect(await store.facts.all()).toEqual([]);
    expect((await store.closet.all()).length).toBe(items);
    expect(await store.profile.get('me')).not.toBeNull();
  });
});

describe('Delete all my data', () => {
  it('clears the profile, facts, checks, closet, chat and kv, and the device ID; the age block stays', async () => {
    const store = await fullStore();
    await withPhotos(store);
    await store.setKv(KV.onboardingDone, '1');
    const { files, calls } = fakeFiles();
    const { k, clearDeviceId } = fakeKeychain();

    await deleteAllData({ store, files, clearDeviceId });

    expect(calls).toEqual(['photos', 'logs']);
    expect(await store.profile.get('me')).toBeNull();
    expect(await store.facts.all()).toEqual([]);
    expect(await store.fitChecks.all()).toEqual([]);
    expect(await store.readings.all()).toEqual([]);
    expect(await store.closet.all()).toEqual([]);
    expect(await store.closetObs.all()).toEqual([]);
    expect(await store.chat.all()).toEqual([]);
    expect(await store.outfits.all()).toEqual([]);
    expect(await store.getKv(KV.onboardingDone)).toBeNull();
    expect(await store.getKv(INBOX_KEY)).toBeNull();
    expect(k.deviceId).toBeNull();
    expect(k.ageBlocked).toBe(true);
  });

  it('in a demo build, the bundled seed is kept from loading into the wiped store at the next launch', async () => {
    const store = await fullStore();
    const { files } = fakeFiles();
    await deleteAllData({ store, files, clearDeviceId: async () => {}, demo: true });
    expect(await store.getKv(KV.seedLoaded)).toBe('wiped');
    expect(await store.profile.get('me')).toBeNull();
  });
});

describe('Score my fits (consent)', () => {
  it('off withdraws consent; on again only through giveConsent (the consent sheet)', async () => {
    const store = await fullStore();
    expect(await mayUpload(store)).toBe(true);
    await withdrawConsent(store);
    const p = (await store.profile.get('me'))!;
    expect([p.consentVersion, p.consentAt]).toEqual([null, null]);
    expect(await mayUpload(store)).toBe(false);
    await giveConsent(store, 5000);
    expect(await mayUpload(store)).toBe(true);
  });

  it('no profile (after Delete all my data) means no upload', async () => {
    const store = createMemoryStore();
    expect(await mayUpload(store)).toBe(false);
  });

  it('off: his own photo is never prepped, nothing is posted or counted; bundled demo photos still score', async () => {
    const store = await fullStore();
    const clock = manualClock(at('2026-10-22T12:00:00-04:00'));
    const prepped: string[] = [];
    const prep: ImagePrep = {
      prepare: (photo) => {
        prepped.push(photo.kind);
        return demoImagePrep.prepare(photo);
      },
    };
    const quota = createQuota({ store, clock, isPro: () => true });
    const svc = createFitCheckService({
      store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep, quota, clock, scheduler: realScheduler, ids: counterIds(),
      timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
      consent: () => mayUpload(store),
    });
    await withdrawConsent(store);
    const checksBefore = (await store.fitChecks.all()).length;
    const chatBefore = (await store.chat.all()).length;
    const usedBefore = (await quota.snapshot()).checksUsed;

    expect(await svc.start({ mode: 'check', photoUri: 'file:///tmp/kitted-capture-1.jpg' })).toEqual({ outcome: 'noConsent' });
    expect(prepped).toEqual([]);
    expect((await store.fitChecks.all()).length).toBe(checksBefore);
    expect((await store.chat.all()).length).toBe(chatBefore);
    expect((await quota.snapshot()).checksUsed).toBe(usedBefore);

    // Try again on a failed check of his own photo is refused the same way.
    const failed = { ...(await store.fitChecks.all())[0]!, id: 'FC-own', status: 'failed' as const, demoPhotoId: null, photoFile: 'photos/own-photo.jpg' };
    await store.fitChecks.put(failed);
    expect(await svc.retry('FC-own')).toEqual({ outcome: 'noConsent' });
    expect(prepped).toEqual([]);

    // Bundled demo photos never leave the phone, so they're not an AI call.
    expect((await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })).outcome).toBe('scored');
    expect(prepped).toEqual(['demo']);
  });
});

describe('photo storage size', () => {
  it('reads as KB, MB or GB without Intl', () => {
    expect(bytesParts(0)).toEqual({ n: '0', unit: 'kb' });
    expect(bytesParts(860 * 1024)).toEqual({ n: '860', unit: 'kb' });
    expect(bytesParts(4.24 * 1024 * 1024)).toEqual({ n: '4.2', unit: 'mb' });
    expect(bytesParts(42.4 * 1024 * 1024)).toEqual({ n: '42', unit: 'mb' });
    expect(bytesParts(1.25 * 1024 * 1024 * 1024)).toEqual({ n: '1.3', unit: 'gb' });
  });
});
