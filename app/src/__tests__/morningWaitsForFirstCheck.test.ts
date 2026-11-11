// The founder's phone, Nov 11 (TestFlight 0.1.0 (2)): right after setup, Stylist showed two cards at once: Kit's "Want to
// check a fit now?" and, under it, the morning card's "Your first fit check" with its own "Check my fit". His rule (in chat,
// Nov 11): until his first fit check is done he sees only the first-check card; after it, the morning card can show.
//
// How it happened: setup leaves the camera's agreement for later (consent 'later'), so the morning card stays away until he
// taps Agree on the camera; from then on Stylist's focus posted it while Kit's card still waited for its first check.
//
// Profile (CLAUDE.md rule 6): no photo is scored by a person here. The demo photo `p01b` is a bundled stock photo, "profile
// unknown", run with one stated test profile: age band 22–25, looks smart casual then workwear, occasion everyday.
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { createMorningService } from '@/features/morning/service';
import { withoutMorningWhileFirstCheckPending } from '@/features/stylist/thread';
import { completeOnboarding, giveConsent } from '@/features/onboarding/complete';
import { firstCheckPending, postFirstCheckOffer, tapLater } from '@/features/onboarding/firstCheckOffer';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import type { WeatherSource } from '@/services/weather';

const at = (iso: string) => Date.parse(iso);
const SETUP_AT = at('2026-11-11T10:20:00-05:00');
const AGREE_AT = at('2026-11-11T10:23:00-05:00');
const CHECK_AT = at('2026-11-11T10:24:00-05:00');
const DAY_ID = '2026-11-11|day';
const ANSWERS = seed.scenarios.firstRun.onboardingAnswers;

// No weather: the card doesn't wait on a forecast, so the test needs no timers.
const noWeather: WeatherSource = {
  kind: 'sample',
  permission: async () => 'unknown',
  requestPermission: async () => 'unknown',
  forecast: async () => null,
};

/** A new setup as About you ends it (aboutStep.ts): the profile with no agreement yet, Kit's note, then the offer card. */
async function newSetup() {
  const store = createMemoryStore();
  const ids = counterIds();
  const clock = manualClock(SETUP_AT);
  await completeOnboarding(store, { styles: ANSWERS.styles as never, fitPreference: ANSWERS.fitPreference, birthYear: ANSWERS.birthYear, consent: 'later' }, SETUP_AT, ids);
  await postFirstCheckOffer(store, SETUP_AT, ids);
  const svc = createMorningService({ store, clock, weather: noWeather, ids });
  return { store, ids, clock, svc };
}

const morningCards = async (store: KittedStore) => (await store.chat.all()).filter((m) => m.kind === 'card' && m.cardType === 'morning');

async function firstCheck(e: Awaited<ReturnType<typeof newSetup>>) {
  e.clock.set(CHECK_AT);
  const checks = createFitCheckService({
    store: e.store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler, fault: () => null }), prep: demoImagePrep,
    quota: createQuota({ store: e.store, clock: e.clock, isPro: () => false }), clock: e.clock, scheduler: realScheduler, ids: e.ids,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  const r = (await checks.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })) as { outcome: string };
  expect(r.outcome).toBe('scored');
}

describe('the morning card waits for his first fit check', () => {
  it('a new setup that agreed on the camera but has done no check sees Kit’s first-check card only', async () => {
    const e = await newSetup();
    await giveConsent(e.store, AGREE_AT);
    e.clock.set(AGREE_AT);
    expect(await e.svc.ensureCard()).toBeNull();
    // Stylist asks again (focus, the app back to the front): still nothing.
    expect(await e.svc.ensureCard()).toBeNull();
    expect(await morningCards(e.store)).toHaveLength(0);
    expect(await e.store.dailyIdeas.get(DAY_ID)).toBeNull();
    // Kit's card is the one thing there.
    expect((await e.store.chat.all()).filter((m) => m.cardType === 'firstCheckOffer')).toHaveLength(1);
  });

  it('Later on Kit’s card does not bring the morning card in: it still waits for the first check', async () => {
    const e = await newSetup();
    await giveConsent(e.store, AGREE_AT);
    await tapLater(e.store, AGREE_AT, e.ids);
    e.clock.set(AGREE_AT);
    expect(await e.svc.ensureCard()).toBeNull();
    expect(await morningCards(e.store)).toHaveLength(0);
  });

  it('after the first scored check the morning card can show (and shows as checked)', async () => {
    const e = await newSetup();
    await giveConsent(e.store, AGREE_AT);
    e.clock.set(AGREE_AT);
    expect(await e.svc.ensureCard()).toBeNull();
    await firstCheck(e);
    // Stylist shown again after the check lands.
    expect(await e.svc.ensureCard()).toBe(DAY_ID);
    expect(await morningCards(e.store)).toHaveLength(1);
  });

  it('an install with no offer card (set up before the offer existed) keeps its morning card, which is its first-check card', async () => {
    const store = createMemoryStore();
    const ids = counterIds();
    const clock = manualClock(CHECK_AT);
    await completeOnboarding(store, { styles: ANSWERS.styles as never, fitPreference: ANSWERS.fitPreference, birthYear: ANSWERS.birthYear, consent: true }, SETUP_AT, ids);
    const svc = createMorningService({ store, clock, weather: noWeather, ids });
    expect(await svc.ensureCard()).toBe(DAY_ID);
    expect(await morningCards(store)).toHaveLength(1);
  });
});

describe('a morning card that was posted before the first check is hidden until it', () => {
  it('shows only Kit’s card while the first check is pending, then the morning card as well', async () => {
    const e = await newSetup();
    await giveConsent(e.store, AGREE_AT);
    // A morning card the old build posted while Kit's card still waited: put it in the thread by hand.
    const offer = (await e.store.chat.all()).find((m) => m.cardType === 'firstCheckOffer')!;
    await e.store.chat.put({ ...offer, id: 'M-old-morning', createdAt: offer.createdAt + 1, cardType: 'morning', payload: { ideaId: DAY_ID } });
    const kinds = (ms: readonly { cardType?: string | null }[]) => ms.filter((m) => m.cardType === 'morning' || m.cardType === 'firstCheckOffer').map((m) => m.cardType);

    expect(await firstCheckPending(e.store)).toBe(true);
    expect(kinds(withoutMorningWhileFirstCheckPending(await e.store.chat.all(), true))).toEqual(['firstCheckOffer']);

    await firstCheck(e);
    expect(await firstCheckPending(e.store)).toBe(false);
    expect(kinds(withoutMorningWhileFirstCheckPending(await e.store.chat.all(), false))).toEqual(['firstCheckOffer', 'morning']);
  });
});
