// "Going for" (#215): asked during the wait, saved on the check, and it changes the advice, NEVER the score.
// Readings: the bundled demo photos (stock, profile unknown), run with the firstRun test profile from seed.json
// (born 2005, so 18–21; picks Smart casual then Workwear; height 178, average build, regular fit) unless a test sets
// other picks (said in the test). Rule 7: no real person's profile is involved here; every case is a stated test profile.
import { scoreParts, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { STYLES as LOOKS_ALL, type StyleKey } from '@/data/types';
import { createFitCheckService, DEFAULT_TIMERS, GOING_FOR_LAST_KV, LAST_LOOK_MS } from '@/features/fitcheck/service';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { adviceText, lineA11y, lookTiles, noteText, picksOf } from '@/features/fitcheck/goingFor';
import { whyParts } from '@/features/why/partsRows';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { realScheduler } from '@/services/scheduler';
import index from '../../assets/demo-readings/INDEX.json';

const at = (iso: string) => Date.parse(iso);
const PROFILE_STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as Styles;
const LOOKS: (StyleKey | null)[] = [...LOOKS_ALL, null];

async function setup(o: { latency?: number; styles?: Styles; store?: KittedStore } = {}) {
  const store = o.store ?? createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  const source = createMockReadingSource({ latency: () => o.latency ?? 0, scheduler: realScheduler });
  const quota = createQuota({ store, clock, isPro: () => true });
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => false,
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: o.styles ?? PROFILE_STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, svc, clock };
}

describe('the pre-pick (02 "Going for")', () => {
  it('opened from the morning card: its look ("Both from this morning\'s card." when the occasion came too)', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date', style: 'minimalist' })) as { checkId: string };
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.style, row.details.goingFor]).toEqual(['minimalist', { style: 'minimalist', confirmed: false, source: 'card', bothFromCard: true }]);
    expect(noteText({ where: 'wait', look: 'minimalist', touched: false, source: 'card', bothFromCard: true }).lead).toBe("Both from this morning's card.");
  });

  it('else his last confirmed look within 7 days, else his first pick from setup (said in words), else Not sure', async () => {
    const { store, svc, clock } = await setup();
    await store.setKv(GOING_FOR_LAST_KV, JSON.stringify({ style: 'streetwear', at: clock.nowMs() - LAST_LOOK_MS + 60_000 }));
    let r = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })) as { checkId: string };
    expect((await store.fitChecks.get(r.checkId))!.details.goingFor).toEqual({ style: 'streetwear', confirmed: false, source: 'last' });
    await store.setKv(GOING_FOR_LAST_KV, JSON.stringify({ style: 'streetwear', at: clock.nowMs() - LAST_LOOK_MS - 60_000 }));
    r = (await svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' })) as { checkId: string };
    expect((await store.fitChecks.get(r.checkId))!.details.goingFor).toEqual({ style: 'smart_casual', confirmed: false, source: 'setup' });
    expect(noteText({ where: 'wait', look: 'smart_casual', touched: false, source: 'setup' }).lead).toBe('Your first pick from setup.');

    const none = await setup({ styles: [] });
    r = (await none.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })) as { checkId: string };
    const row = (await none.store.fitChecks.get(r.checkId))!;
    expect([row.style, row.details.goingFor?.source, row.details.goingForAdvice]).toEqual([null, 'none', null]);
  });

  it('the tiles are his picks (none: the setup screen\'s first three), More holds the rest', () => {
    expect(lookTiles(picksOf(PROFILE_STYLES))).toEqual({
      tiles: ['smart_casual', 'workwear'], more: ['streetwear', 'minimalist', 'classic_prep', 'outdoor', 'vintage_sport'],
    });
    expect(lookTiles([]).tiles).toEqual(['streetwear', 'minimalist', 'smart_casual']);
  });
});

describe('the answer during the wait', () => {
  it('a tap is saved when the score lands (confirmed) and becomes his last confirmed look; the score never waits for it', async () => {
    const { store, svc } = await setup({ latency: 0.25 });
    const done = svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' });
    await new Promise((r) => setTimeout(r, 40));
    expect(svc.getState()).toMatchObject({ kind: 'reading', look: 'smart_casual', lookSource: 'setup', lookTouched: false });
    svc.selectLook('minimalist');
    expect(svc.getState()).toMatchObject({ look: 'minimalist', lookTouched: true });
    const { checkId } = (await done) as { checkId: string };
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.style, row.details.goingFor?.confirmed, row.details.goingFor?.source]).toEqual(['minimalist', true, 'setup']);
    expect(JSON.parse((await store.getKv(GOING_FOR_LAST_KV))!).style).toBe('minimalist');
    expect(row.score).toBe(scoreParts(demoReadingById('s15')!, { occasion: 'everyday' }).overall);
  });

  it('no tap: the pre-pick stands, unconfirmed, and nothing is remembered', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })) as { checkId: string };
    expect((await store.fitChecks.get(checkId))!.details.goingFor?.confirmed).toBe(false);
    expect(await store.getKv(GOING_FOR_LAST_KV)).toBeNull();
  });
});

describe('it never changes the score (#213, #215)', () => {
  it('every demo reading × every look (and Not sure) × occasion: the same score, raw score and parts', () => {
    for (const p of index.photos) {
      const reading = demoReadingById(p.id)!;
      for (const occasion of ['everyday', 'date', 'interview', 'gym'] as const) {
        const base = evaluateCheck({ reading, occasion, styles: PROFILE_STYLES, boldness: null, closet: [], firstCheck: false });
        for (const look of LOOKS) {
          const ev = evaluateCheck({ reading, occasion, styles: look ? [[look, 1]] : PROFILE_STYLES, boldness: null, closet: [], firstCheck: false, goingFor: look });
          expect([p.id, occasion, look, ev.row.score, ev.row.rawScore, ev.row.subscores]).toEqual([p.id, occasion, look, base.row.score, base.row.rawScore, base.row.subscores]);
        }
      }
    }
  });

  it('Change after the score rewrites the advice only: the number, the word, the parts and the Why rows stay', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 's14', occasion: 'everyday', style: 'minimalist' })) as { checkId: string };
    const before = (await store.fitChecks.get(checkId))!;
    expect(before.details.goingForAdvice?.kind).toBe('match');
    const msgs = (await store.chat.all()).length;
    const after = (await svc.changeGoingFor(checkId, 'smart_casual'))!;
    expect([after.score, after.rawScore, after.subscores, after.occasion, after.details.parts?.parts, after.details.readsAs, after.details.rescoredFrom])
      .toEqual([before.score, before.rawScore, before.subscores, before.occasion, before.details.parts?.parts, before.details.readsAs, before.details.rescoredFrom]);
    const why = (r: typeof before) => whyParts(r.details.parts as never, { occasion: r.occasion, readsAs: r.details.readsAs ?? null, gainPart: null });
    expect(why(after)).toEqual(why(before));
    expect([after.style, after.details.goingFor?.confirmed]).toEqual(['smart_casual', true]);
    expect(adviceText(after.details.goingForAdvice!)).toEqual({
      kind: 'mismatch', lead: 'Reads as minimal.', rest: '',
      move: { title: 'Swap the chunky sneakers for white leather sneakers', detail: 'Toward smart casual' },
    });
    expect((await store.chat.all()).length).toBe(msgs); // the same card, no new check
  });

  it('a new occasion still asks first (#62) and re-scores; the answer and its advice follow the new occasion', async () => {
    const { svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 's14', occasion: 'everyday', style: 'minimalist' })) as { checkId: string };
    const preview = (await svc.previewLens(checkId, { occasion: 'date' }))!;
    const after = (await svc.changeLens(checkId, { occasion: 'date' }))!;
    expect(after.score).toBe(preview.after);
    expect(after.details.goingFor?.style).toBe('minimalist');
    expect(after.details.goingForAdvice?.kind).toBe('match');
    const gym = (await svc.changeLens(checkId, { occasion: 'gym' }))!;
    expect(gym.details.goingForAdvice).toBeNull(); // nothing to aim at
  });
});

describe('what the answer says', () => {
  it('a match: "It reads that way too."', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date', style: 'minimalist' })) as { checkId: string };
    expect(adviceText((await store.fitChecks.get(checkId))!.details.goingForAdvice!).lead).toBe('It reads that way too.');
  });

  it('a mismatch names the piece only when a rule turns it away: s15 going minimal, the plaid overshirt', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday', style: 'minimalist' })) as { checkId: string };
    const a = adviceText((await store.fitChecks.get(checkId))!.details.goingForAdvice!);
    // parts v8 (#228): plain, the overshirt reads minimal and keeps the score (no standout-pattern credit to lose), so a move shows
    expect(a).toEqual({ kind: 'mismatch', lead: 'Reads as smart casual.', rest: 'For a minimal look, the overshirt pulls the other way.',
      move: { title: 'Swap the patterned overshirt for a solid color', detail: 'Toward minimal' } });
  });

  it('the folded line says where a pre-pick came from in words', () => {
    expect(lineA11y({ style: 'minimalist', confirmed: false, source: 'setup' }, 'Everyday')).toBe('Going for minimal, picked from your first pick in setup. Headed: Everyday.');
    expect(lineA11y({ style: 'minimalist', confirmed: true, source: 'setup' }, 'Everyday')).toBe('Going for minimal. Headed: Everyday.');
  });

  it('a re-check keeps the first check\'s answer and never asks', async () => {
    const { store, svc } = await setup();
    const first = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date', style: 'minimalist', checkId: 'story-first' })) as { checkId: string };
    await svc.changeGoingFor(first.checkId, 'smart_casual');
    const re = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: first.checkId })) as { checkId: string };
    const row = (await store.fitChecks.get(re.checkId))!;
    expect([row.style, row.details.goingFor?.style, row.details.goingFor?.confirmed]).toEqual(['smart_casual', 'smart_casual', true]);
  });
});
