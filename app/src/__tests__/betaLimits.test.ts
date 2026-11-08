// T14 · the beta's limits (specs/free-and-pro.md FP7), written before the build (tasks/T14/TESTING.md). On the beta the
// server answers `beta`: 3 fit checks a day (each with its re-check) and 20 questions a day, days at 4 am, no lifetime
// count, and no paywall, price, "Pro", "free check" or "trial" anywhere he can see.
//
// Photos: the bundled sample photos (stock, "profile unknown"), run with one stated test profile: born 2004 (age band
// 22–25), looks minimalist, fit regular, occasion everyday. Readings are the recorded ones (assets/demo-readings);
// nothing here calls the AI or the network.
import { dayKey, US_EASTERN } from '@kitted/core';
import { router } from 'expo-router';
import { PAYWALL_BUILT } from '@/config/features';
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, FitCheckRow } from '@/data/types';
import { demoPhoto } from '@/demo/demoPhotos';
import { createAsk, type AskDeps } from '@/features/ask/pipeline';
import type { AnswerEvent, AnswerSource } from '@/features/ask/source';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { PAYWALL_AFTER_MS } from '@/features/finish/sequence';
import { createFinishService, getFinish, type FinishDeps } from '@/features/finish/service';
import { heldReadyContent, limitCardContent, type LimitCardContent } from '@/features/held/content';
import { paywallOn, setDemoPaywall } from '@/features/paywall/switch';
import { currentPlan, hasPro, planShortName, planStatus, usageLines } from '@/features/settings/plan';
import { en, t } from '@/i18n/en';
import { manualClock, parseZonedIso } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep, type ImagePrep } from '@/services/imagePrep/demo';
import { scriptedNotifications } from '@/services/notifications';
import { createQuota, questionLimitText, quotaLine, stylistSubtitle, type QuotaSnapshot } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { DemoFault, ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';
import {
  appTier, fallbackTier, resetTierForTests, SERVER_TIER_KV, serverTier, setDemoTier, tierNow, tierRecorder, type ServerTier,
} from '@/services/server/tier';
import { serverTransport, type AiFetch } from '@/services/server/transport';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), dismissAll: jest.fn(), replace: jest.fn() } }));
jest.mock('@/data/db', () => ({ store: {} }));
jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn() }));

const fs = jest.requireActual('fs') as {
  writeFileSync(p: string, d: string): void; mkdtempSync(p: string): string; rmSync(p: string, o?: { recursive?: boolean; force?: boolean }): void;
};
const os = jest.requireActual('os') as { tmpdir(): string };
const path = jest.requireActual('path') as { join(...p: string[]): string };

/** A wall-clock time in New York (the manual clock's zone). */
const at = (iso: string) => parseZonedIso(iso) ?? 0;
const S15 = demoPhoto('s15')!.sha256;

// FP7 "Never during the beta": a price, "Pro", "free check(s)" or "trial" (TESTING.md, the banned list).
const BANNED = [/\bpro\b/i, /free checks?/i, /trial/i, /\$\s?\d/, /\/(yr|mo)\b/];
const offenders = (strings: readonly string[]) => strings.filter((s) => BANNED.some((re) => re.test(s)));
/** A string from the copy deck by key, without throwing on a key that isn't there yet. */
const copy = (key: string): string => (en as Record<string, string>)[key] ?? `<missing ${key}>`;

/** His photo from the camera or the library: kept on the phone like photo prep does; read by its SHA. */
function filePrep(dir: string, sha = S15): ImagePrep {
  return {
    async prepare(p) {
      if (p.kind === 'demo') return demoImagePrep.prepare(p);
      if (p.kind === 'retry') return { status: 'ok', image: { photoId: null, sha256: p.sha256, uploadUri: null, keptUri: p.keptUri ?? undefined, thumbUri: p.thumbUri ?? undefined } };
      const keptUri = path.join(dir, `${sha.slice(0, 12)}-photo.jpg`);
      const thumbUri = path.join(dir, `${sha.slice(0, 12)}-thumb.jpg`);
      fs.writeFileSync(keptUri, 'kept');
      fs.writeFileSync(thumbUri, 'thumb');
      return { status: 'ok', image: { photoId: null, sha256: sha, uploadUri: null, keptUri, thumbUri, aspect: 0.75 } };
    },
  };
}

interface SetupOpts {
  now?: string;
  prep?: ImagePrep;
  /** The tier the server answered with (TESTING.md: "on beta"). */
  tier?: () => Promise<ServerTier | null>;
  isPro?: () => boolean;
}

/** The shared set-up: a memory store, a manual New York clock, the mock reading source at latency 0, and the quota on
 *  the beta's rules (`serverTier: async () => 'beta'`). `fault` and `limitOnce` stand in for a failed read and for the
 *  server's 429 on the next read. */
async function setup(o: SetupOpts = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at(o.now ?? '2026-10-22T09:00:00'));
  const env = { fault: null as DemoFault | null, limitOnce: false };
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler, fault: () => env.fault });
  const source: ReadingSource = {
    read(image, kind, opts) {
      if (env.limitOnce) {
        env.limitOnce = false;
        return (async function* limited() {
          yield { type: 'failed' as const, code: 'limit' as const, counted: false as const };
        })();
      }
      return mock.read(image, kind, opts);
    },
  };
  const reads = jest.spyOn(source, 'read');
  const quota = createQuota({ store, clock, isPro: o.isPro ?? (() => false), serverTier: o.tier ?? (async () => 'beta') });
  const svc = createFitCheckService({
    store, source, prep: o.prep ?? demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2004, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, clock, quota, svc, reads, env };
}

type Env = Awaited<ReturnType<typeof setup>>;
const usageOn = async (e: Env, ms: number = e.clock.nowMs()) =>
  (await e.store.usage.get(dayKey(ms, e.clock.offset))) ?? { checks: 0, rechecks: 0, questions: 0 };
const cardsFor = async (e: Env, checkId: string) =>
  (await e.store.chat.all()).filter((m) => m.fitCheckId === checkId).sort((a, b) => a.createdAt - b.createdAt);
const heldCards = async (e: Env) => (await e.store.chat.all()).filter((m) => m.cardType === 'held');
const readyFor = async (e: Env, checkId?: string) =>
  (await e.store.chat.all()).filter((m) => m.role === 'stylist' && m.payload.ready === true && (!checkId || m.fitCheckId === checkId));

/** A new check at a New York time; returns the outcome and its check id. */
async function checkAt(e: Env, iso: string, input: { photoId: string } | { photoUri: string }) {
  e.clock.set(at(iso));
  const r = await e.svc.start({ mode: 'check', occasion: 'everyday', ...input });
  return { outcome: r.outcome, id: 'checkId' in r ? r.checkId : '' };
}

async function recheckAt(e: Env, iso: string, parentCheckId: string, photoId: string) {
  e.clock.set(at(iso));
  const r = await e.svc.start({ mode: 'recheck', photoId, parentCheckId });
  return r.outcome;
}

/** Three scored checks in one evening (none of them s15, which the held photo uses). */
async function threeChecks(e: Env) {
  const ids: string[] = [];
  for (const [iso, photoId] of [['2026-10-22T20:00:00', 'p01b'], ['2026-10-22T20:10:00', 's05'], ['2026-10-22T20:20:00', 's09']] as const) {
    const r = await checkAt(e, iso, { photoId });
    expect(r.outcome).toBe('scored');
    ids.push(r.id);
  }
  return ids;
}

const NIGHT = '2026-10-22T21:12:00';

let tmp: string;
beforeEach(() => {
  resetTierForTests();
  setDemoPaywall(null);
  jest.mocked(router.push).mockClear();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kitted-beta-'));
});
afterEach(() => {
  setDemoPaywall(null);
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ── FP7.1 · a 4th photo in one day ───────────────────────────────────────────────────────────────────────────────
describe('FP7.1 · the 4th photo of the day is held', () => {
  it('FP7.1 · a 4th photo (camera or library) is held with the beta card; nothing read, nothing counted', async () => {
    for (const input of [{ photoId: 's15' }, { photoUri: 'file:///tmp/kitted-capture-1.jpg' }] as const) {
      const e = await setup({ prep: filePrep(tmp) });
      // The 3rd photo is never held: all three score.
      await threeChecks(e);
      expect((await usageOn(e)).checks).toBe(3);
      const readsBefore = e.reads.mock.calls.length;
      const r = await checkAt(e, NIGHT, input);
      expect(r.outcome).toBe('held');
      // Never read or sent, and the count never reaches 4.
      expect(e.reads.mock.calls.length).toBe(readsBefore);
      const u = await usageOn(e);
      expect([u.checks, u.rechecks]).toEqual([3, 0]);
      expect(await e.quota.canStartCheck()).toBe(false);
      // His photo and the stylist's held card, in that order.
      expect((await cardsFor(e, r.id)).map((m) => [m.role, m.kind, m.cardType])).toEqual([['user', 'photo', null], ['stylist', 'card', 'held']]);
      expect((await e.store.fitChecks.get(r.id))!.status).toBe('held');
      // No paywall route is pushed.
      expect(jest.mocked(router.push).mock.calls.filter((c) => String(c[0]).includes('paywall'))).toEqual([]);
    }
  });

  it("FP7.1 · the beta card's words and its one button", async () => {
    const e = await setup();
    await threeChecks(e);
    const id = (await checkAt(e, NIGHT, { photoId: 's15' })).id;
    const row = (await e.store.fitChecks.get(id))!;
    const s = await e.quota.snapshot();
    const want: LimitCardContent = {
      state: 'limit', tag: 'Daily limit', tagRight: 'Resets at 4 am', title: "That's today's 3 fit checks.",
      body: "I'll save this photo and score it after 4 am.", save: 'Save for tomorrow', tryPro: null, dontScore: null,
      a11y: "Daily limit. That's today's 3 fit checks. I'll save this photo and score it after 4 am.",
    };
    expect(limitCardContent(row, s, { paywallBuilt: false })).toEqual(want);
    // No upgrade button, even once the paywall is built, and with the demo store script on.
    expect(limitCardContent(row, s, { paywallBuilt: true })).toEqual(want);
    expect(limitCardContent(row, s, { paywallBuilt: true, trialUsed: true })).toEqual(want);
    setDemoPaywall('ok');
    expect(limitCardContent(row, s)).toEqual(want);
    // The body never grows the re-check sentence on the beta (FP7 gives it exactly), with a re-check still open.
    expect(limitCardContent(row, { ...s, recheckOpen: true }, { paywallBuilt: true })).toEqual(want);
    // With no questions left the body is still FP7's.
    expect(limitCardContent(row, { ...s, questionsUsed: 20 }, { paywallBuilt: true })!.body).toBe("I'll save this photo and score it after 4 am.");
    expect(await e.quota.canStartCheck()).toBe(false);
  });

  it('FP7.1 · at 4 am the next photo scores and the held one is offered', async () => {
    const e = await setup();
    await threeChecks(e);
    const night = at(NIGHT);
    const held = (await checkAt(e, NIGHT, { photoId: 's15' })).id;
    await e.svc.saveHeld(held);
    // 3:59 am is still the old day: another photo is held too.
    const late = await checkAt(e, '2026-10-23T03:59:00', { photoId: 's14' });
    expect(late.outcome).toBe('held');
    expect(await e.svc.dropHeld(late.id)).toBe(true);
    expect((await usageOn(e, night)).checks).toBe(3);
    const readsBefore = e.reads.mock.calls.length;

    // 4:00 am: a new day. The held photo is offered once; nothing is read before he taps.
    e.clock.set(at('2026-10-23T04:00:00'));
    await e.svc.onAppOpen();
    await e.svc.onAppOpen();
    expect(await readyFor(e, held)).toHaveLength(1);
    expect(heldReadyContent((await e.store.fitChecks.get(held))!)).toEqual({ text: "Ready to score last night's photo?", score: 'Score it', notThis: 'Not this one' });
    expect(e.reads.mock.calls.length).toBe(readsBefore);
    expect(await e.quota.canStartCheck()).toBe(true);

    // A new photo scores: day 2's first.
    const fresh = await checkAt(e, '2026-10-23T04:05:00', { photoId: 's22' });
    expect(fresh.outcome).toBe('scored');
    expect((await usageOn(e)).checks).toBe(1);

    // "Score it" scores the held one on day 2's count.
    expect((await e.svc.scoreHeldNow(held)).outcome).toBe('scored');
    expect((await e.store.fitChecks.get(held))!.status).toBe('scored');
    expect((await usageOn(e)).checks).toBe(2);
    expect((await usageOn(e, night)).checks).toBe(3);
    // The question has done its job: never asked again.
    await e.svc.onAppOpen();
    expect(heldReadyContent((await e.store.fitChecks.get(held))!)).toBeNull();
    expect(await readyFor(e)).toHaveLength(0);
  });

  it("FP7.1 · the server says the day's checks are used before the phone does: the next photo is held without a call", async () => {
    const e = await setup();
    expect((await checkAt(e, '2026-10-22T20:00:00', { photoId: 'p01b' })).outcome).toBe('scored');
    expect((await checkAt(e, '2026-10-22T20:10:00', { photoId: 's05' })).outcome).toBe('scored');
    expect((await usageOn(e)).checks).toBe(2);
    // The phone has 2, the server 3: the 3rd photo is refused there (429 limit).
    e.env.limitOnce = true;
    const refused = await checkAt(e, '2026-10-22T20:20:00', { photoId: 's09' });
    expect(refused.outcome).toBe('failed');
    const row = (await e.store.fitChecks.get(refused.id))!;
    expect([row.status, row.details.failCode, row.score]).toEqual(['failed', 'limit', null]);
    expect(t('fail.limit')).toBe("That's today's fit checks. Your photo is saved here. Try again after 4 am. This one doesn't count.");
    // The phone's count agrees from now on.
    expect((await usageOn(e)).checks).toBe(3);
    expect(await e.quota.canStartCheck()).toBe(false);
    const readsBefore = e.reads.mock.calls.length;
    expect((await checkAt(e, NIGHT, { photoId: 's15' })).outcome).toBe('held');
    expect(e.reads.mock.calls.length).toBe(readsBefore);
  });
});

// ── FP7.2 · each check keeps its re-check ────────────────────────────────────────────────────────────────────────
describe('FP7.2 · re-checks', () => {
  it('FP7.2 · check, re-check ×3: all scored; checks 3, re-checks 3; the 4th photo is held', async () => {
    const e = await setup();
    const pairs = [['p01b', 'p01a'], ['s14', 's15'], ['s05', 's09']] as const;
    const outcomes: string[] = [];
    let minute = 0;
    for (const [first, after] of pairs) {
      const c = await checkAt(e, `2026-10-22T09:${String(minute).padStart(2, '0')}:00`, { photoId: first });
      outcomes.push(c.outcome);
      outcomes.push(await recheckAt(e, `2026-10-22T09:${String(minute + 5).padStart(2, '0')}:00`, c.id, after));
      // A re-check never raises the checks, and never closes the day on its own.
      const u = await usageOn(e);
      expect([u.checks, u.rechecks]).toEqual([outcomes.length / 2, outcomes.length / 2]);
      if (outcomes.length < 6) expect(await e.quota.canStartCheck()).toBe(true);
      minute += 10;
    }
    expect(outcomes).toEqual(['scored', 'scored', 'scored', 'scored', 'scored', 'scored']);
    const u = await usageOn(e);
    expect([u.checks, u.rechecks]).toEqual([3, 3]);
    expect(await e.quota.canStartCheck()).toBe(false);
    expect((await checkAt(e, '2026-10-22T09:40:00', { photoId: 's10' })).outcome).toBe('held');
  });

  it("FP7.2 · three checks first, then the 3rd's re-check still scores", async () => {
    const e = await setup();
    const first = await checkAt(e, '2026-10-22T09:00:00', { photoId: 'p01b' });
    const second = await checkAt(e, '2026-10-22T09:10:00', { photoId: 's14' });
    const third = await checkAt(e, '2026-10-22T09:20:00', { photoId: 's15' });
    expect([first.outcome, second.outcome, third.outcome]).toEqual(['scored', 'scored', 'scored']);
    expect((await usageOn(e)).checks).toBe(3);
    // Offline: the re-check isn't counted and stays open.
    e.env.fault = 'offline';
    expect(await recheckAt(e, '2026-10-22T09:25:00', third.id, 's05')).toBe('failed');
    expect((await usageOn(e)).rechecks).toBe(0);
    e.env.fault = null;
    // Inside its 30 minutes: scored, and the checks stay 3.
    expect(await recheckAt(e, '2026-10-22T09:30:00', third.id, 's05')).toBe('scored');
    let u = await usageOn(e);
    expect([u.checks, u.rechecks]).toEqual([3, 1]);
    // A second re-check of the same check is refused.
    expect(await recheckAt(e, '2026-10-22T09:31:00', third.id, 's09')).toBe('limit');
    // The 2nd check's window (30 min, 9:10–9:40) has passed: refused.
    expect(await recheckAt(e, '2026-10-22T09:41:00', second.id, 's09')).toBe('limit');
    // The first-ever check's stays open until 4 am.
    expect(await recheckAt(e, '2026-10-22T23:00:00', first.id, 'p01a')).toBe('scored');
    u = await usageOn(e);
    expect([u.checks, u.rechecks]).toEqual([3, 2]);
  });

  it("FP7.2 · a re-check whose window crosses 4 am still scores and uses none of the new day's 3", async () => {
    const e = await setup({ now: '2026-10-22T21:00:00' });
    expect((await checkAt(e, '2026-10-22T21:00:00', { photoId: 'p01b' })).outcome).toBe('scored');
    const late = await checkAt(e, '2026-10-23T03:45:00', { photoId: 's14' });
    expect(late.outcome).toBe('scored');
    expect((await usageOn(e, at('2026-10-23T03:45:00'))).checks).toBe(2);
    // 4:05 am, inside the 3:45 check's 30 minutes.
    expect(await recheckAt(e, '2026-10-23T04:05:00', late.id, 's15')).toBe('scored');
    expect((await usageOn(e)).checks).toBe(0);
    expect(await e.quota.canStartCheck()).toBe(true);
    for (const [iso, photoId] of [['2026-10-23T09:00:00', 's05'], ['2026-10-23T09:10:00', 's09'], ['2026-10-23T09:20:00', 's10']] as const) {
      expect((await checkAt(e, iso, { photoId })).outcome).toBe('scored');
    }
    expect((await checkAt(e, '2026-10-23T09:30:00', { photoId: 's22' })).outcome).toBe('held');
  });
});

// ── FP7.3 · questions ────────────────────────────────────────────────────────────────────────────────────────────
const KHAKI = 'What shoes go with my khaki chinos?';
const ANSWER: AnswerEvent[] = [{ type: 'delta', text: 'White leather sneakers or brown suede boots.' }, { type: 'done' }];

async function askSetup(o: { used: number; tryPro?: () => boolean; events?: AnswerEvent[]; online?: () => boolean }) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T12:20:00'));
  const quota = createQuota({ store, clock, isPro: () => false, serverTier: async () => 'beta' });
  for (let i = 0; i < o.used; i++) await quota.consumeQuestion();
  let calls = 0;
  const events = () => o.events ?? ANSWER;
  const source: AnswerSource = {
    name: 'script',
    async *answer() {
      calls++;
      for (const ev of events()) yield ev;
    },
  };
  const deps: AskDeps = {
    store, quota, clock, ids: counterIds(), source: () => source, consent: async () => true, openConsent: () => {}, tryPro: o.tryPro ?? (() => false),
    online: o.online,
  };
  const ask = createAsk(deps);
  const chat = async () => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const used = async () => (await quota.snapshot()).questionsUsed;
  const send = async (q: string) => {
    const r = await ask.ask(q);
    return r.kind === 'sent' ? { kind: r.kind, done: await r.done } : { kind: r.kind, done: null };
  };
  return { store, clock, quota, ask, chat, used, send, calls: () => calls };
}
const lines = (ms: ChatMessage[]) => ms.map((m) => [m.role, m.cardType ?? m.kind, m.text]);

describe('FP7.3 · questions', () => {
  it('FP7.3 · the 20th question is still answered', async () => {
    const s = await askSetup({ used: 19 });
    expect(await s.quota.canAskQuestion()).toBe(true);
    const r = await s.send(KHAKI);
    expect(r.kind).toBe('sent');
    expect(r.done).toMatchObject({ kind: 'answered', counted: true });
    expect(s.calls()).toBe(1);
    expect(await s.used()).toBe(20);
    expect(lines(await s.chat())).toEqual([['user', 'text', KHAKI], ['stylist', 'text', 'White leather sneakers or brown suede boots.']]);
    expect(await s.quota.canAskQuestion()).toBe(false);
  });

  it('FP7.3 · the 21st question gets the beta line, no Try Pro, not counted', async () => {
    for (const tryPro of [() => false, () => true, () => paywallOn()]) {
      setDemoPaywall('ok');
      setDemoTier('beta');
      const s = await askSetup({ used: 20, tryPro });
      const r = await s.send(KHAKI);
      expect(r.kind).toBe('limit');
      // Never sent, never counted.
      expect(s.calls()).toBe(0);
      expect(await s.used()).toBe(20);
      const ms = await s.chat();
      expect(lines(ms)).toEqual([['user', 'text', KHAKI], ['stylist', 'limit', "That's 20 questions today. More at 4 am."]]);
      expect(ms[1]!.payload.tryPro).toBe(false);
      expect(ms[1]!.text).not.toMatch(/\bpro\b|go pro|up to/i);
    }
    expect(questionLimitText({ tier: 'beta' })).toBe("That's 20 questions today. More at 4 am.");
    // The Stylist subtitle with 20 used.
    const s = await askSetup({ used: 20 });
    const sub = stylistSubtitle(await s.quota.snapshot())!;
    expect(sub).toEqual({ key: 'stylist.quota.questions', n: 0 });
    expect(t(sub.key, { n: sub.n! })).toBe('0 questions left today');
  });

  it('FP7.3 · the subtitle on beta: no check line; questions left once 3 or fewer', async () => {
    const s = await askSetup({ used: 0 });
    expect(stylistSubtitle(await s.quota.snapshot())).toBeNull();
    expect(quotaLine(await s.quota.snapshot())).toBeNull();
    for (let i = 0; i < 16; i++) await s.quota.consumeQuestion();
    expect(stylistSubtitle(await s.quota.snapshot())).toBeNull();
    await s.quota.consumeQuestion();
    expect(stylistSubtitle(await s.quota.snapshot())).toEqual({ key: 'stylist.quota.questions', n: 3 });
  });

  it('FP7.3 · a failed or offline question never counts; at 4 am the count resets', async () => {
    const off = await askSetup({ used: 19, events: [{ type: 'failed', code: 'offline' }] });
    const r = await off.send(KHAKI);
    expect(r.done).toMatchObject({ kind: 'failed' });
    expect((await off.chat()).at(-1)!.text).toBe("You're offline, so I couldn't answer that. It doesn't count.");
    expect(await off.used()).toBe(19);
    const failed = await askSetup({ used: 19, events: [{ type: 'delta', text: 'Half an' }, { type: 'failed', code: 'http' }] });
    await failed.send(KHAKI);
    expect(await failed.used()).toBe(19);

    const s = await askSetup({ used: 20 });
    expect((await s.send(KHAKI)).kind).toBe('limit');
    s.clock.set(at('2026-10-23T04:00:00'));
    const next = await s.send(KHAKI);
    expect(next.kind).toBe('sent');
    expect(next.done).toMatchObject({ kind: 'answered', counted: true });
    expect(await s.used()).toBe(1);
  });
});

// ── FP7.4 · what never counts ────────────────────────────────────────────────────────────────────────────────────
describe('FP7.4 · what never counts', () => {
  it('FP7.4 · failed, offline, not rated and same-photo checks leave 3 checks', async () => {
    const e = await setup();
    const steady = async () => {
      expect((await usageOn(e)).checks).toBe(0);
      expect(await e.quota.canStartCheck()).toBe(true);
    };
    // The reading starts, then fails mid-way (the AI's error after the slots arrive).
    e.env.fault = 'ai';
    expect((await checkAt(e, '2026-10-22T09:00:00', { photoId: 's05' })).outcome).toBe('failed');
    await steady();
    e.env.fault = 'offline';
    expect((await checkAt(e, '2026-10-22T09:05:00', { photoId: 's09' })).outcome).toBe('failed');
    await steady();
    // Nothing ratable: "not rated" (an unreadable photo, and one not fully clothed).
    e.env.fault = 'unreadable';
    expect((await checkAt(e, '2026-10-22T09:10:00', { photoId: 's10' })).outcome).toBe('failed');
    await steady();
    e.env.fault = 'notClothed';
    const nc = await checkAt(e, '2026-10-22T09:15:00', { photoId: 's12' });
    expect(nc.outcome).toBe('notScored');
    expect((await e.store.fitChecks.get(nc.id))!.status).toBe('notClothed');
    await steady();
    e.env.fault = null;

    // One scored, then the same photo again: scored from its read, not counted.
    expect((await checkAt(e, '2026-10-22T09:20:00', { photoId: 'p01b' })).outcome).toBe('scored');
    expect((await usageOn(e)).checks).toBe(1);
    const readsBefore = e.reads.mock.calls.length;
    const again = await checkAt(e, '2026-10-22T09:25:00', { photoId: 'p01b' });
    expect(again.outcome).toBe('scored');
    expect(e.reads.mock.calls.length).toBe(readsBefore);
    expect((await usageOn(e)).checks).toBe(1);
    expect(await e.quota.canStartCheck()).toBe(true);

    // Two more different photos: 3 different scored photos in all, and only the next is held.
    expect((await checkAt(e, '2026-10-22T09:30:00', { photoId: 's14' })).outcome).toBe('scored');
    expect((await checkAt(e, '2026-10-22T09:35:00', { photoId: 's15' })).outcome).toBe('scored');
    expect((await usageOn(e)).checks).toBe(3);
    expect(await heldCards(e)).toHaveLength(0);
    expect((await checkAt(e, '2026-10-22T09:40:00', { photoId: 's22' })).outcome).toBe('held');
    expect(await heldCards(e)).toHaveLength(1);
  });
});

// ── FP7.5 · no paywall, no price, no "Pro" ───────────────────────────────────────────────────────────────────────
const T0 = at('2026-10-22T07:42:00');

function finishCheck(id: string, createdAt: number): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 6.5, rawScore: 6.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: true, readingId: null, parentId: null, itemIds: [], details: {},
  } as FitCheckRow;
}

async function finishRun(o: Partial<FinishDeps> = {}) {
  const store = createMemoryStore();
  await store.init();
  await store.profile.put({
    id: 'me', birthYear: 2004, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
    lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: '08:00', units: 'imperial', createdAt: T0,
  });
  await store.fitChecks.put(finishCheck('a', T0));
  const clock = manualClock(T0);
  const timers: { fn: () => void; at: number }[] = [];
  const opened: number[] = [];
  const d: FinishDeps = {
    store, clock, ids: counterIds(), busy: () => false, paywallOn, isPro: () => false, notificationsOn: () => true,
    notifications: scriptedNotifications('allow'), stylistInFront: () => true, openPaywall: () => opened.push(clock.nowMs()),
    later: (fn, ms) => timers.push({ fn, at: clock.nowMs() + ms }), ...o,
  };
  const tick = async (ms: number) => {
    clock.advance(ms);
    for (const x of timers.splice(0).filter((x) => x.at <= clock.nowMs())) x.fn();
    await new Promise((r) => setTimeout(r, 0));
  };
  const s = createFinishService(d);
  await s.ensure();
  await tick(PAYWALL_AFTER_MS + 50);
  await s.ensure();
  const cards = (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt).map((m) => m.cardType);
  return { store, opened, cards };
}

describe('FP7.5 · nothing to buy on the beta', () => {
  it('FP7.5 · paywallOn is false on beta, even with the demo store on; true on free with it on', async () => {
    expect(PAYWALL_BUILT).toBe(false);
    setDemoPaywall('ok');
    setDemoTier('beta');
    expect(tierNow()).toBe('beta');
    expect(paywallOn()).toBe(false);
    // The control: the tier, not the build, closes it.
    setDemoTier('free');
    expect(paywallOn()).toBe(true);
    // No demo tier: the tier the server last answered with.
    setDemoTier(null);
    const record = tierRecorder(createMemoryStore());
    record('free');
    await new Promise((r) => setTimeout(r, 0));
    expect(tierNow()).toBe('free');
    expect(paywallOn()).toBe(true);
    record('beta');
    await new Promise((r) => setTimeout(r, 0));
    expect(tierNow()).toBe('beta');
    expect(paywallOn()).toBe(false);
  });

  it('FP7.5 · the soft page is skipped on beta and the notification ask follows', async () => {
    setDemoPaywall('ok');
    setDemoTier('beta');
    const beta = await finishRun();
    expect(beta.opened).toEqual([]);
    expect(beta.cards).toEqual([null, 'plan', 'question']);
    expect((await getFinish(beta.store)).step).toBe('done');
    expect(jest.mocked(router.push).mock.calls.filter((c) => String(c[0]).includes('paywall'))).toEqual([]);
    // The control: on free with the demo store on, the soft page opens.
    setDemoTier('free');
    const free = await finishRun();
    expect(free.opened).toHaveLength(1);
  });

  it("FP7.5 · no upgrade button anywhere on beta (limit card, question line, You's Today card)", async () => {
    setDemoPaywall('ok');
    setDemoTier('beta');
    // The limit card.
    const e = await setup();
    await threeChecks(e);
    const id = (await checkAt(e, NIGHT, { photoId: 's15' })).id;
    const s = await e.quota.snapshot();
    expect(s.tier).toBe('beta');
    for (const o of [undefined, { paywallBuilt: true }, { paywallBuilt: true, trialUsed: true }]) {
      expect(limitCardContent((await e.store.fitChecks.get(id))!, s, o)!.tryPro).toBeNull();
    }
    // The question line: Try Pro's switch is the paywall's, and it reads false; even when asked, no row.
    const a = await askSetup({ used: 20, tryPro: () => paywallOn() });
    await a.send(KHAKI);
    expect((await a.chat()).at(-1)!.payload.tryPro).toBe(false);
    // You's Today card shows Try Pro only when the paywall is on and the tier is free: neither holds on beta.
    expect(paywallOn()).toBe(false);
    expect(s.pro).toBe(false);
    expect(s.purchased).toBe(false);
    expect([s.checkLimit, s.questionLimit]).toEqual([3, 20]);
  });

  it('FP7.5 · copy sweep: every string a beta state shows is free of banned words', async () => {
    const e = await setup();
    const base = await e.quota.snapshot();
    expect(base.tier).toBe('beta');
    const seen: string[] = [];
    const add = (...xs: (string | null | undefined)[]) => {
      for (const x of xs) if (x) seen.push(x);
    };
    // The Stylist subtitle and the check line: 0–3 checks used, re-check open or not, a held photo or none, 0–20
    // questions used.
    for (let checksUsed = 0; checksUsed <= 3; checksUsed++) {
      for (const recheckOpen of [false, true]) {
        for (const heldCount of [0, 1]) {
          for (let questionsUsed = 0; questionsUsed <= 20; questionsUsed++) {
            const snap: QuotaSnapshot = { ...base, checksUsed, recheckOpen, heldCount, questionsUsed };
            const sub = stylistSubtitle(snap);
            if (sub) add(t(sub.key, sub.n === undefined ? undefined : { n: sub.n }));
            const line = quotaLine(snap);
            if (line) add(t(line));
          }
        }
      }
    }
    // The limit card and its saved state, every way it can be built.
    const held = (saved: boolean) => ({ status: 'held', details: { held: { saved, takenAt: T0 } } }) as unknown as FitCheckRow;
    for (const saved of [false, true]) {
      for (const questionsUsed of [0, 10, 20]) {
        for (const recheckOpen of [false, true]) {
          for (const o of [undefined, { paywallBuilt: true }, { paywallBuilt: true, trialUsed: true }]) {
            const c = limitCardContent(held(saved), { ...base, questionsUsed, recheckOpen }, o)!;
            add(c.tag, c.tagRight, c.title, c.body, c.save, c.tryPro, c.dontScore, c.a11y);
          }
        }
      }
    }
    const ready = heldReadyContent({ status: 'held', details: { held: { saved: true, takenAt: T0, offeredAt: T0 } } } as unknown as FitCheckRow)!;
    add(ready.text, ready.score, ready.notThis);
    add(questionLimitText({ tier: 'beta' }));
    // You → Plan & usage and Settings' row.
    const plan = currentPlan(false, T0, null, 'beta');
    const status = planStatus(plan, US_EASTERN);
    add(status.title, status.detail, planShortName(plan));
    for (const checksUsed of [0, 1, 3]) {
      for (const l of usageLines({ ...base, checksUsed }, checksUsed)) add(l.label, l.value, l.spoken);
    }
    // You's Today card (title, its right side and its line on beta), the morning card's line, the server's limit line.
    add(t('you.today.title'), t('you.today.resets'));
    for (const [c, q] of [[3, 20], [0, 0], [1, 7]] as const) add(t('you.today.pro', { checks: c, checkLimit: 3, questions: q, questionLimit: 20 }));
    add(copy('own.limit.beta'), t('fail.limit'));

    // Not a vacuous sweep: the beta's own words are in it.
    expect(seen).toEqual(expect.arrayContaining([
      '1 photo waiting to score', '3 questions left today', '0 questions left today', "That's today's 3 fit checks.", 'Save for tomorrow',
      "That's 20 questions today. More at 4 am.", 'Kitted beta', '3 fit checks and 20 questions a day · resets at 4 am', 'Your fit checks reset at 4 am.',
    ]));
    expect(seen.length).toBeGreaterThan(300);
    expect(offenders(seen)).toEqual([]);
  });

  it("FP7.5 · the beta saved card's body, word for word", async () => {
    const e = await setup();
    await threeChecks(e);
    const id = (await checkAt(e, NIGHT, { photoId: 's15' })).id;
    await e.svc.saveHeld(id);
    const row = (await e.store.fitChecks.get(id))!;
    expect(limitCardContent(row, await e.quota.snapshot(), { paywallBuilt: true })).toEqual({
      state: 'saved', tag: 'Waiting to score', tagRight: 'After 4 am', title: null, body: "Saved. I'll score it when you open Kitted after 4 am.",
      save: null, tryPro: null, dontScore: "Don't score it", a11y: "Waiting to score. After 4 am. Saved. I'll score it when you open Kitted after 4 am.",
    });
    // On free the saved body stays FP3's.
    const free = await setup({ tier: async () => 'free' });
    expect((await checkAt(free, '2026-10-22T20:00:00', { photoId: 'p01b' })).outcome).toBe('scored');
    const fid = (await checkAt(free, NIGHT, { photoId: 's15' })).id;
    await free.svc.saveHeld(fid);
    expect(limitCardContent((await free.store.fitChecks.get(fid))!, await free.quota.snapshot(), { paywallBuilt: false })!.body)
      .toBe("Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check.");
  });

  it("FP7.5 · the morning card's checks-used line on beta, word for word", () => {
    // The words; that the morning card shows them on beta (and FP3's line on free) is the flow's last step (demo 259).
    expect(copy('own.limit.beta')).toBe('Your fit checks reset at 4 am.');
    expect(t('own.limit')).toBe('Your free check resets tomorrow');
    expect(offenders([copy('own.limit.beta')])).toEqual([]);
  });

  it("FP7.5 · the tier before and after the server's answers; a purchase wins", async () => {
    // Before the first answer (a fresh install): beta while the paywall isn't built.
    const store = createMemoryStore();
    expect(fallbackTier()).toBe('beta');
    expect(await appTier(store)).toBe('beta');
    expect(tierNow()).toBe('beta');
    // A 'pro' stored from the server's old default turns into 'beta' on the next answer.
    await store.setKv(SERVER_TIER_KV, 'pro');
    expect(await serverTier(store)).toBe('pro');
    tierRecorder(store)('beta');
    await new Promise((r) => setTimeout(r, 0));
    expect(await store.getKv(SERVER_TIER_KV)).toBe('beta');
    expect(await serverTier(store)).toBe('beta');
    expect(await appTier(store)).toBe('beta');
    // The header: `x-kitted-tier: beta` is recorded; an unknown value is not.
    const seen: ServerTier[] = [];
    const fetchWith = (tier: string): AiFetch => async () => ({
      ok: true, status: 200, body: null, text: async () => '{}', headers: { get: (n: string) => (n.toLowerCase() === 'x-kitted-tier' ? tier : null) },
    });
    for (const tier of ['beta', 'gold']) {
      await serverTransport({ base: 'https://srv.test/api', fetch: fetchWith(tier), token: async () => 'TOKEN', tzMinutes: () => -240, onTier: (x) => seen.push(x) })
        .send({ route: 'ask', model: 'm', stream: false, body: '{}' });
    }
    expect(seen).toEqual(['beta']);
    // A purchase on a beta server is Pro.
    const bought = await setup({ isPro: () => true });
    const s = await bought.quota.snapshot();
    expect([s.tier, s.pro, s.purchased, s.checkLimit, s.questionLimit]).toEqual(['pro', true, true, 10, 50]);
  });
});

// ── FP7.6 · beta checks never touch the 7 free checks ────────────────────────────────────────────────────────────
describe('FP7.6 · day counts only', () => {
  it('FP7.6 · on beta the phone keeps day counts only; switching the tier to free gives free\'s rules', async () => {
    const store0 = createMemoryStore();
    const writes: string[] = [];
    const setKv = store0.setKv.bind(store0);
    store0.setKv = async (k, v) => {
      writes.push(k);
      return setKv(k, v);
    };
    const record = tierRecorder(store0);
    record('beta');
    await new Promise((r) => setTimeout(r, 0));
    // The tier writes only its own key.
    expect(writes).toEqual([SERVER_TIER_KV]);
    const e = await setup({ tier: () => serverTier(store0) });
    const phoneWrites: string[] = [];
    const phoneSetKv = e.store.setKv.bind(e.store);
    e.store.setKv = async (k, v) => {
      phoneWrites.push(k);
      return phoneSetKv(k, v);
    };
    await threeChecks(e);
    const s = await e.quota.snapshot();
    expect(s.tier).toBe('beta');
    expect(Object.keys(s).sort()).toEqual([
      'checkLimit', 'checksUsed', 'dayKey', 'heldCount', 'nextResetMs', 'pro', 'purchased', 'questionLimit', 'questionsUsed', 'recheckId', 'recheckOpen', 'tier',
    ]);
    // Only today's row holds counts, and it has no lifetime field.
    const rows = await e.store.usage.all();
    expect(rows.map((r) => r.dayKey)).toEqual(['2026-10-22']);
    expect(Object.keys(rows[0]!).sort()).toEqual(['checks', 'dayKey', 'items', 'questions', 'rechecks']);
    expect(rows[0]!.checks).toBe(3);
    // Switching the server to free: free's rules today (until T11), and the day's 3 still hold it to its limit.
    record('free');
    await new Promise((r) => setTimeout(r, 0));
    const f = await e.quota.snapshot();
    expect([f.tier, f.checkLimit, f.questionLimit, f.pro, f.purchased]).toEqual(['free', 1, 5, false, false]);
    expect(await e.quota.canStartCheck()).toBe(false);
    // No "free checks used" or lifetime count is written anywhere on the phone.
    expect([...writes, ...phoneWrites].filter((k) => /free|lifetime|trial|used|count/i.test(k))).toEqual([]);
  });
});

// ── FP7.7 · You → Plan ───────────────────────────────────────────────────────────────────────────────────────────
describe('FP7.7 · the beta plan', () => {
  it('FP7.7 · the beta plan: Kitted beta, its line, no button', async () => {
    const plan = currentPlan(false, T0, null, 'beta');
    expect(plan).toEqual({ kind: 'beta' });
    expect(planStatus(plan, US_EASTERN)).toEqual({ title: 'Kitted beta', detail: '3 fit checks and 20 questions a day · resets at 4 am' });
    expect(planShortName(plan)).toBe('Kitted beta');
    expect(hasPro(plan)).toBe(false);
    // Manage subscription shows only with Pro; Restore only with the paywall on: neither on beta.
    setDemoPaywall('ok');
    setDemoTier('beta');
    expect(paywallOn()).toBe(false);
    // The server's tier alone never makes him "Kitted Pro"; a purchase on a beta server does.
    expect(currentPlan(false, T0, null, 'pro')).toEqual({ kind: 'free' });
    const bought = currentPlan(true, T0, null, 'beta');
    expect(bought.kind).toBe('pro');
    expect(hasPro(bought)).toBe(true);
    expect(planStatus(bought, US_EASTERN).title).toBe('Kitted Pro');
    // The Today list on beta.
    const e = await setup();
    expect((await checkAt(e, '2026-10-22T12:00:00', { photoId: 'p01b' })).outcome).toBe('scored');
    e.clock.set(at('2026-10-22T12:22:00'));
    const rows = usageLines(await e.quota.snapshot(), 0);
    expect(rows.map((r) => [r.label, r.value, r.spoken])).toEqual([
      ['Fit checks', '1 of 3', 'Fit checks, 1 of 3 used'],
      ['Re-check', '1 left', 'Re-check, 1 left'],
      ['Questions', '0 of 20', 'Questions, 0 of 20 used'],
    ]);
  });

  it("FP7.7 · Settings' Plan & usage row reads Kitted beta", () => {
    // Before the first server answer: the fallback is beta.
    expect(planShortName(currentPlan(false, T0, null, tierNow()))).toBe('Kitted beta');
    // After the server says beta.
    tierRecorder(createMemoryStore())('beta');
    expect(planShortName(currentPlan(false, T0, null, tierNow()))).toBe('Kitted beta');
    // The control: a demo screen on free reads the free plan.
    setDemoTier('free');
    expect(planShortName(currentPlan(false, T0, null, tierNow()))).toBe('Free plan');
  });
});
