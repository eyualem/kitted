// The score reveal and the re-check win (features/fitcheck/reveal.ts; DECISIONS-LOG #242, #246 (16)).
import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow } from '@/data/types';
import { parseArgs } from '@/demo/demoArgs';
import { STORY_FIRST_CHECK, STORY_RECHECK } from '@/demo/scenarios';
import {
  FULL_SHOWS, REVEAL_KV, armDemoReveal, checkPlan, fullShownCount, isRevealEligible, noteLive, noteRevealed, persistRevealed, resetRevealRun,
  revealMode, setDemoPreparing, tapeValues, winMode, winPlan, type RevealContext,
} from '@/features/fitcheck/reveal';

const ctx = (over: Partial<RevealContext> = {}): RevealContext => ({ eligible: true, revealedAt: null, reduceMotion: false, voiceOver: false, fullShown: 0, ...over });

const row = (over: Partial<FitCheckRow> = {}): FitCheckRow => ({
  id: 'FC1', createdAt: 0, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: '', occasion: 'date',
  status: 'scored', isPartial: false, notRated: [], score: 8, rawScore: 8, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
  fixes: [], explanation: null, rubricVersion: '3.1.0', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
  parentId: null, itemIds: [], details: {}, style: null, ...over,
});

describe('which reveal plays (a new check)', () => {
  it.each<[string, number, Partial<RevealContext>, ReturnType<typeof revealMode>]>([
    ['first checks get the full tape', 8, {}, 'full'],
    ['the 5th check still gets it', 8, { fullShown: FULL_SHOWS - 1 }, 'full'],
    ['after 5 full shows: the 0.5 s lock', 8, { fullShown: FULL_SHOWS }, 'short'],
    ['below 6.0: quiet', 5.5, {}, 'quiet'],
    ['6.0 is not quiet', 6, {}, 'full'],
    ['quiet wins over Reduce Motion', 4, { reduceMotion: true }, 'quiet'],
    ['Reduce Motion: the cross-fade', 8, { reduceMotion: true }, 'reduced'],
    ['Reduce Motion after 5 shows is still the cross-fade', 8, { reduceMotion: true, fullShown: 9 }, 'reduced'],
    ['VoiceOver: no animation', 8, { voiceOver: true, reduceMotion: true }, 'voiceOver'],
    ['VoiceOver below 6.0 too', 5, { voiceOver: true }, 'voiceOver'],
    ['already revealed: nothing plays', 8, { revealedAt: 123 }, 'none'],
    ['already revealed beats VoiceOver', 8, { revealedAt: 123, voiceOver: true }, 'none'],
    ['not new to him (scroll-back, relaunch, Past chats): nothing', 8, { eligible: false }, 'none'],
  ])('%s', (_name, score, over, expected) => {
    expect(revealMode(score, ctx(over))).toBe(expected);
  });
});

describe('which reveal plays (a re-check)', () => {
  const c = { eligible: true, revealedAt: null, reduceMotion: false, voiceOver: false };
  it('a higher score is a win', () => expect(winMode(8, 9, c)).toBe('win'));
  it('a win even from a low score, and every time (no 5-check limit)', () => expect(winMode(4.5, 5.5, c)).toBe('win'));
  it('the same score: no flourish', () => expect(winMode(8, 8, c)).toBe('none'));
  it('a lower score: no flourish', () => expect(winMode(8, 7.5, c)).toBe('none'));
  it('Reduce Motion: the cross-fade', () => expect(winMode(8, 9, { ...c, reduceMotion: true })).toBe('reduced'));
  it('VoiceOver: the final card and one announcement', () => expect(winMode(8, 9, { ...c, voiceOver: true })).toBe('voiceOver'));
  it('already revealed or not new: nothing', () => {
    expect(winMode(8, 9, { ...c, revealedAt: 5 })).toBe('none');
    expect(winMode(8, 9, { ...c, eligible: false })).toBe('none');
  });
});

describe('the tape', () => {
  it('always ends exactly on the score, for every half step', () => {
    for (let h = 0; h <= 19; h++) {
      const score = h / 2;
      const v = tapeValues(score);
      expect(v[v.length - 1]).toBe(score);
      expect(v.every((x, i) => i === 0 || x - v[i - 1]! === 0.5)).toBe(true);
      expect(v.every((x) => x <= score && x >= 0)).toBe(true);
    }
  });
  it('starts 2.0 below the score (never under 0)', () => {
    expect(tapeValues(8)).toEqual([6, 6.5, 7, 7.5, 8]);
    expect(tapeValues(1)).toEqual([0, 0.5, 1]);
  });
  it('a re-check runs from the old score up to the new one', () => {
    expect(tapeValues(9, 8)).toEqual([8, 8.5, 9]);
    expect(tapeValues(7.5, 6)).toEqual([6, 6.5, 7, 7.5]);
  });
  it('the same score → the same tape (same photo, same animation)', () => {
    expect(tapeValues(7.5)).toEqual(tapeValues(7.5));
    expect(checkPlan('full', 2)).toEqual(checkPlan('full', 2));
  });
});

describe('the timelines', () => {
  it('full: waiting to 400, the tape 400–900, lock at 900, the word at 1020, the summary 80 ms later, fixes 60 ms apart, the gain last', () => {
    const p = checkPlan('full', 3);
    expect(p.tape).toEqual({ at: 400, ms: 500 });
    expect(p.lock.at).toBe(900);
    expect(p.lock.ms).toBe(120);
    expect(p.word).toEqual({ at: 1020, ms: 220, rise: 6 });
    expect(p.summary.at).toBe(1100);
    expect(p.fixes.map((f) => f.at)).toEqual([1180, 1240, 1300]);
    expect(p.fixes.every((f) => f.rise === 4)).toBe(true);
    expect(p.gain.at).toBeGreaterThan(p.fixes[2]!.at);
    expect(p.haptic).toBe(true);
  });
  it('short: no tape, the numeral cross-fades at 200 ms and locks within 0.5 s', () => {
    const p = checkPlan('short', 1);
    expect(p.tape).toBeNull();
    expect(p.swap!.at).toBe(200);
    expect(p.lock.at).toBeLessThanOrEqual(500);
    expect(p.word.at).toBeGreaterThanOrEqual(p.lock.at);
  });
  it('quiet: no tape, no haptic, the score and its fix in one 200 ms fade', () => {
    const p = checkPlan('quiet', 2);
    expect([p.tape, p.haptic, p.blankStart]).toEqual([null, false, true]);
    for (const s of [p.swap!, p.word, p.summary, p.fixes[0]!, p.gain]) expect(s).toEqual({ at: 0, ms: 200 });
  });
  it('Reduce Motion: a 200 ms cross-fade, the word 150 ms after it, haptic kept, no rise', () => {
    const p = checkPlan('reduced', 1);
    expect(p.swap).toEqual({ at: 0, ms: 200 });
    expect(p.word.at).toBe(350);
    expect(p.word.rise ?? 0).toBe(0);
    expect(p.haptic).toBe(true);
  });
  it('the re-check win: shrink 300–620, arrow at 700, tape 800–1400, lock 1400, badge 1500, word 1750', () => {
    const p = winPlan('win');
    expect(p.shrink).toEqual({ at: 300, ms: 320 });
    expect(p.arrow).toEqual({ at: 700, ms: 160, dx: -8 });
    expect(p.tape).toEqual({ at: 800, ms: 600 });
    expect([p.lock.at, p.badge.at, p.word.at, p.word.ms]).toEqual([1400, 1500, 1750, 220]);
    expect(p.pillSpring).toBe(true);
    expect(winPlan('reduced').tape).toBeNull();
    expect(winPlan('reduced').pillSpring).toBe(false);
  });
});

describe('once per check', () => {
  beforeEach(() => resetRevealRun());

  it('only a check seen reading in this run is new; once revealed, never again', () => {
    expect(isRevealEligible('FC1')).toBe(false);
    noteLive('FC1');
    expect(isRevealEligible('FC1')).toBe(true);
    expect(isRevealEligible('FC1', 99)).toBe(false);
    noteRevealed('FC1');
    expect(isRevealEligible('FC1')).toBe(false);
  });

  it('demo stories never arm themselves; -demoReveal arms screens 7 and 10 and resets the counter', async () => {
    const store = createMemoryStore();
    await store.init();
    noteLive(STORY_FIRST_CHECK);
    setDemoPreparing(true);
    noteLive('FC-during-prep');
    setDemoPreparing(false);
    expect([isRevealEligible(STORY_FIRST_CHECK), isRevealEligible('FC-during-prep')]).toEqual([false, false]);
    await store.setKv(REVEAL_KV, '7');
    await armDemoReveal(store, 7, false);
    expect([isRevealEligible(STORY_FIRST_CHECK), await fullShownCount(store)]).toEqual([false, 7]);
    await armDemoReveal(store, 7, true);
    expect([isRevealEligible(STORY_FIRST_CHECK), await fullShownCount(store)]).toEqual([true, 0]);
    await armDemoReveal(store, 10, true);
    expect([isRevealEligible(STORY_FIRST_CHECK), isRevealEligible(STORY_RECHECK)]).toEqual([false, true]);
  });

  it('revealedAt persists on the row and the full-show counter goes up once per check', async () => {
    const store = createMemoryStore();
    await store.init();
    const closetSummary = { matched: [], added: ['C1'], undone: [] } as never;
    await store.fitChecks.put(row({ details: { closetSummary } }));
    await store.fitChecks.put(row({ id: 'FC2' }));
    expect(await persistRevealed(store, 'FC1', 1000, true)).toBe(true);
    expect(await persistRevealed(store, 'FC1', 2000, true)).toBe(false);
    const got = await store.fitChecks.get('FC1');
    expect(got!.details.revealedAt).toBe(1000);
    expect(got!.details.closetSummary).toEqual(closetSummary);
    expect(await fullShownCount(store)).toBe(1);
    // A short, quiet or VoiceOver reveal marks the row but isn't a full show.
    expect(await persistRevealed(store, 'FC2', 3000, false)).toBe(true);
    expect((await store.fitChecks.get('FC2'))!.details.revealedAt).toBe(3000);
    expect(await fullShownCount(store)).toBe(1);
    expect(await persistRevealed(store, 'missing', 1, true)).toBe(false);
  });
});

describe('demo arguments', () => {
  it('-demoReveal and -demoRevealSlow', () => {
    expect(parseArgs({ demoReveal: '1', demoRevealSlow: '4' })).toEqual({ reveal: true, revealSlow: 4 });
    expect(parseArgs({ demoRevealSlow: '0' })).toEqual({});
    expect(parseArgs({ demoRevealSlow: '11' })).toEqual({});
  });
});
