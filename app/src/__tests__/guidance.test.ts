// Camera guidance (#100): the tip order, the flicker filter and the after-shot reasons.
import { createExposureClock, createTipFilter, fitIssue, fitTip, scanIssue, scanTip, T, type FitTip } from '@/features/camera/guidance';
import { fitTipCopy } from '@/features/camera/guidanceCopy';
import type { GuideEvent, StillAssessment } from '../../modules/kitted-vision';

const ok = (extra: Partial<GuideEvent> = {}): GuideEvent => ({ state: 'good', faces: [], luma: 0.5, subjectLuma: 0.5, clipped: 0, bodyShare: 0.7, motion: 0, ...extra });
const propped = { mode: 'propped' as const, flash: false };
const mirror = { mode: 'mirror' as const, flash: false };
const piece = (share: number, edge = false) => ({ box: { x: 0, y: 0, width: 10, height: 10 }, share, edge });
const scanEv = (scan: Partial<NonNullable<GuideEvent['scan']>>, extra: Partial<GuideEvent> = {}): GuideEvent =>
  ok({ scan: { people: [], clothes: 0.8, pieces: [piece(0.1), piece(0.08)], ...scan }, subjectLuma: undefined, ...extra });

describe('fit-check live tips', () => {
  it('an older native build (state only) behaves as before', () => {
    const states = ['noPerson', 'tooClose', 'moveLeft', 'moveRight', 'good', 'goodFull'] as const;
    expect(states.map((state) => fitTip({ state, faces: [] }, propped).tip)).toEqual(states);
    expect(fitTip({ state: 'good', faces: [] }, propped).ready).toBe(true);
    expect(fitTip({ state: 'tooClose', faces: [] }, propped).ready).toBe(false);
  });

  it('too dark comes first and offers the flash; the countdown waits', () => {
    const r = fitTip(ok({ subjectLuma: 0.08 }), propped);
    expect(r).toEqual({ tip: 'dark', ready: false, offerFlash: true });
  });

  it('a camera at its ISO limit counts as dark even when the picture looks bright', () => {
    expect(fitTip(ok({ iso: 2400, maxIso: 2560, exposure: 1 / 15 }), propped).tip).toBe('dark');
    expect(fitTip(ok({ iso: 2400, maxIso: 2560, exposure: 1 / 60 }), propped).tip).toBe('good');
  });

  it('with the flash on, dark no longer blocks the countdown, and replaces a failed "step into the frame"', () => {
    const lit = { ...propped, flash: true };
    expect(fitTip(ok({ subjectLuma: 0.08 }), lit)).toEqual({ tip: 'darkFlash', ready: true, offerFlash: false });
    expect(fitTip(ok({ state: 'noPerson', subjectLuma: undefined, luma: 0.05 }), lit).tip).toBe('darkFlash');
  });

  it('a studio shot on black is not dark: his own brightness counts, not the frame', () => {
    expect(fitTip(ok({ luma: 0.1, subjectLuma: 0.18 }), propped).tip).toBe('good');
    expect(fitTip(ok({ luma: 0.1, subjectLuma: 0.14 }), propped).tip).toBe('dark');
  });

  it('backlit, too far, and the order after "no one in frame"', () => {
    expect(fitTip(ok({ clipped: 0.3, subjectLuma: 0.2 }), propped).tip).toBe('backlit');
    expect(fitTip(ok({ clipped: 0.3, subjectLuma: 0.5 }), propped).tip).toBe('good');
    expect(fitTip(ok({ bodyShare: 0.2 }), propped).tip).toBe('tooFar');
    expect(fitTip(ok({ state: 'tooClose', bodyShare: 0.2 }), propped).tip).toBe('tooClose');
    expect(fitTip(ok({ state: 'moveLeft' }), propped).tip).toBe('moveLeft');
  });

  it('S0.8 (#313): in Mirror, no hips is a short mirror, not "step back"; Propped still says step back', () => {
    expect(fitTip(ok({ state: 'tooClose' }), mirror)).toEqual({ tip: 'shortMirror', ready: false, offerFlash: false });
    expect(fitTip({ state: 'tooClose', faces: [] }, mirror).tip).toBe('shortMirror');
    expect(fitTip(ok({ state: 'tooClose' }), propped).tip).toBe('tooClose');
    // Dark still comes first.
    expect(fitTip(ok({ state: 'tooClose', subjectLuma: 0.08 }), mirror).tip).toBe('dark');
    expect(fitTipCopy('shortMirror')).toEqual({ text: "Can't step back? Prop your phone up instead.", icon: null });
  });

  it('"Hold still" only in Mirror (handheld)', () => {
    expect(fitTip(ok({ motion: 0.08 }), mirror).tip).toBe('moving');
    expect(fitTip(ok({ motion: 0.08 }), propped).tip).toBe('good');
  });

  it("Mirror's no-one tip doesn't promise the volume button (not built)", () => {
    expect(fitTip(ok({ state: 'noPerson' }), mirror).tip).toBe('mirrorAim');
  });
});

describe('scan live tips', () => {
  it('counts pieces when all is well', () => {
    expect(scanTip(scanEv({}), { torch: false })).toEqual({ tip: 'good', count: 2, offerFlash: false });
  });

  it('waits for the first measures (older native builds have none)', () => {
    expect(scanTip({ state: 'noPerson', faces: [] }, { torch: false }).tip).toBe('looking');
  });

  it('dark first, with the torch offer; with the torch on, "still dark"', () => {
    expect(scanTip(scanEv({}, { luma: 0.05 }), { torch: false })).toEqual({ tip: 'dark', count: 0, offerFlash: true });
    expect(scanTip(scanEv({}, { luma: 0.05 }), { torch: true }).tip).toBe('darkTorch');
  });

  it('a person, no clothes, movement, glare, cut off, too far, in that order', () => {
    const tip = (e: GuideEvent) => scanTip(e, { torch: false }).tip;
    expect(tip(scanEv({ people: [0.2] }))).toBe('person');
    expect(tip(scanEv({ people: [0.01] }))).toBe('good'); // a hand at the edge isn't a person
    expect(tip(scanEv({ pieces: [], clothes: 0.02 }))).toBe('noClothes');
    expect(tip(scanEv({ pieces: [], clothes: 0.5 }))).toBe('looking'); // clothes, no boxes yet
    expect(tip(scanEv({}, { motion: 0.1 }))).toBe('moving');
    expect(tip(scanEv({}, { clipped: 0.2 }))).toBe('glare');
    expect(tip(scanEv({ pieces: [piece(0.1, true), piece(0.1)] }))).toBe('cutOff');
    expect(tip(scanEv({ pieces: [piece(0.02), piece(0.01)] }))).toBe('tooFar');
  });

  it('dark clothes on dark sheets are not "too dark" until the frame is really dim', () => {
    expect(scanTip(scanEv({}, { luma: 0.13 }), { torch: false }).tip).toBe('good');
    expect(scanIssue({ ok: true, luma: 0.13, blurRatio: 0.1, frame: 'ok', clothes: 0.8, pieces: [piece(0.1)] })).toBeNull();
  });

  it('ignores noise and the bed itself when counting', () => {
    expect(scanTip(scanEv({ pieces: [piece(0.8, true), piece(0.1), piece(0.001)] }), { torch: false })).toEqual({ tip: 'good', count: 1, offerFlash: false });
  });
});

// #380: every time the camera opened, its first frame was taken before the auto-exposure had
// settled (ISO 294, 1/60 s, luma 0.03–0.14), so "Too dark" and Turn on flash showed for a moment
// on every open. These are his phone's own log lines (guide.log, Oct 18–24).
describe('the first second after the camera opens (#380)', () => {
  const firstFrame = (extra: Partial<GuideEvent> = {}): GuideEvent =>
    ({ state: 'noPerson', faces: [], luma: 0.049, clipped: 0, iso: 294, maxIso: 1920, exposure: 1 / 60, ...extra });

  it('D1: an unsettled first frame never says too dark or offers the flash', () => {
    const settling = { ...mirror, settling: true };
    expect(fitTip(firstFrame(), settling)).toEqual({ tip: 'mirrorAim', ready: false, offerFlash: false });
    expect(fitTip(firstFrame(), { ...propped, settling: true }).tip).toBe('noPerson');
    expect(fitTip(firstFrame(), mirror).tip).toBe('dark'); // the same frame later is honestly dark
  });

  it('D2: while settling the countdown waits, even on a good frame', () => {
    expect(fitTip(ok(), { ...propped, settling: true })).toEqual({ tip: 'good', ready: false, offerFlash: false });
    expect(fitTip(ok({ subjectLuma: 0.08 }), { ...propped, settling: true }).ready).toBe(false);
  });

  it('D3: the clock settles after T.exposureSettleMs from the first frame, and restarts on reset', () => {
    const c = createExposureClock();
    expect(c.settling(5000)).toBe(true); // first frame starts it
    expect(c.settling(5000 + T.exposureSettleMs - 1)).toBe(true);
    expect(c.settling(5000 + T.exposureSettleMs)).toBe(false);
    c.reset(); // a camera flip starts the exposure over
    expect(c.settling(9000)).toBe(true);
    expect(c.settling(9000 + T.exposureSettleMs)).toBe(false);
  });

  // [ms after opening, frame] from guide.log
  const replay = (frames: [number, GuideEvent][], mode: 'mirror' | 'propped') => {
    const clock = createExposureClock();
    const filter = createTipFilter<FitTip>();
    return frames.map(([ms, g]) => filter.feed(fitTip(g, { mode, flash: false, settling: clock.settling(ms) }).tip, ms));
  };

  it('D4: his Oct 24 3:18 pm open (Mirror) never shows "Too dark"', () => {
    const later = (luma: number): GuideEvent => ({ state: 'noPerson', faces: [], luma, clipped: 0.001, iso: 701, maxIso: 7392, exposure: 1 / 30, motion: 0.01 });
    const frames: [number, GuideEvent][] = [[0, firstFrame({ iso: 516, maxIso: 7392 })]];
    for (let ms = 100; ms <= 3000; ms += 100) frames.push([ms, later(0.3)]);
    const shown = replay(frames, 'mirror');
    expect(shown).not.toContain('dark');
    expect(shown[shown.length - 1]).toBe('mirrorAim');
  });

  it('D5: a room that is really dark still says so, a moment later (Oct 21: ISO at its limit)', () => {
    const atLimit: GuideEvent = { state: 'noPerson', faces: [], luma: 0.566, clipped: 0, iso: 1920, maxIso: 1920, exposure: 1 / 15 };
    const frames: [number, GuideEvent][] = [[0, firstFrame()]];
    for (let ms = 100; ms <= 3000; ms += 100) frames.push([ms, atLimit]);
    const shown = replay(frames, 'propped');
    expect(shown.slice(0, 10)).not.toContain('dark'); // the first second
    expect(shown[shown.length - 1]).toBe('dark');
  });

  it('D6: the scan camera waits the same way', () => {
    const dim = scanEv({}, { luma: 0.04 });
    expect(scanTip(dim, { torch: false }).tip).toBe('dark');
    expect(scanTip(dim, { torch: false, settling: true })).toEqual({ tip: 'good', count: 2, offerFlash: false });
  });
});

describe('tip filter', () => {
  it('shows the first tip at once, and a change only after it holds', () => {
    const f = createTipFilter<FitTip>(400);
    expect(f.feed('noPerson', 0)).toBe('noPerson');
    expect(f.feed('good', 100)).toBe('noPerson');
    expect(f.feed('good', 400)).toBe('noPerson');
    expect(f.feed('good', 500)).toBe('good');
  });

  it('a one-frame blip never shows', () => {
    const f = createTipFilter<FitTip>(400);
    f.feed('good', 0);
    f.feed('moveLeft', 100);
    expect(f.feed('good', 200)).toBe('good');
    expect(f.feed('moveLeft', 300)).toBe('good');
    expect(f.feed('moveLeft', 650)).toBe('good');
    expect(f.feed('moveLeft', 700)).toBe('moveLeft');
  });
});

describe('after the shot', () => {
  const fine: StillAssessment = { ok: true, kind: 'fit', luma: 0.5, subjectLuma: 0.5, clipped: 0, blurRatio: 0.12, frame: 'ok' };

  it('a good photo has nothing to say; an unmeasured one goes on to photo prep', () => {
    expect(fitIssue(fine)).toBeNull();
    expect(fitIssue(null)).toBeNull();
    expect(fitIssue({ ok: false })).toBeNull();
  });

  it('dark, blurry and backlit may be used anyway', () => {
    expect(fitIssue({ ...fine, subjectLuma: 0.08 })).toEqual({ reason: 'dark', allowUse: true });
    expect(fitIssue({ ...fine, blurRatio: T.blurRatio + 0.01 })).toEqual({ reason: 'blurry', allowUse: true });
    expect(fitIssue({ ...fine, clipped: 0.3, subjectLuma: 0.2 })).toEqual({ reason: 'backlit', allowUse: true });
  });

  it("no person or a face that can't be hidden can't be used (ruling 10); the cause is named", () => {
    expect(fitIssue({ ...fine, frame: 'couldNotFrame' })).toEqual({ reason: 'cantFrame', allowUse: false });
    expect(fitIssue({ ...fine, frame: 'noPerson' })).toEqual({ reason: 'noPerson', allowUse: false });
    expect(fitIssue({ ...fine, frame: 'noPerson', blurRatio: 0.5 })).toEqual({ reason: 'blurry', allowUse: false });
    expect(fitIssue({ ...fine, frame: 'noPerson', luma: 0.05, subjectLuma: undefined })).toEqual({ reason: 'dark', allowUse: false });
  });

  it('two people are left to "Which one is you?" after the camera closes', () => {
    expect(fitIssue({ ...fine, frame: 'multiplePeople' })).toBeNull();
  });

  const scanFine: StillAssessment = { ok: true, kind: 'scan', luma: 0.5, clipped: 0, blurRatio: 0.12, frame: 'ok', people: [], clothes: 0.8, pieces: [{ box: { x: 0.2, y: 0.2, width: 0.3, height: 0.3 }, share: 0.08, edge: false }] };
  it('scans: every reason may be used anyway except a face that cannot be hidden', () => {
    expect(scanIssue(scanFine)).toBeNull();
    expect(scanIssue({ ...scanFine, frame: 'couldNotFrame' })).toEqual({ reason: 'cantHide', allowUse: false });
    expect(scanIssue({ ...scanFine, people: [{ x: 0, y: 0, width: 0.4, height: 0.6 }] })).toEqual({ reason: 'person', allowUse: true });
    expect(scanIssue({ ...scanFine, pieces: [], clothes: 0.02 })).toEqual({ reason: 'noClothes', allowUse: true });
    expect(scanIssue({ ...scanFine, pieces: [{ ...scanFine.pieces![0]!, edge: true }] })).toEqual({ reason: 'cutOff', allowUse: true });
    expect(scanIssue({ ...scanFine, clipped: 0.2 })).toEqual({ reason: 'glare', allowUse: true });
    expect(scanIssue({ ...scanFine, luma: 0.05 })).toEqual({ reason: 'dark', allowUse: true });
  });
});
