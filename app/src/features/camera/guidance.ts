// Camera guidance (DECISIONS-LOG #100): what the tip says before the shot, and what the quick
// check says after it. The camera (kitted-vision) only measures; every threshold and the order
// of the tips live here, pure and tested, so they can be tuned without a native rebuild.
// Thresholds were set Oct 8 on the Mac from the 52 real photos plus darkened, brightened and
// blurred copies (#101); the live ones (ISO, motion) still need tuning on the phone.
import type { GuideEvent, GuideState, StillAssessment } from '../../../modules/kitted-vision';

export const T = {
  /** Fit: his own mean brightness (0–1) below which it's too dark. The real photos' darkest
   *  person read 0.18 (a studio shot on black reads 0.14 overall, so the frame isn't used when
   *  he's found); this catches about half of the copies darkened by 3.5 stops. */
  darkLuma: 0.15,
  /** Scan: the frame's brightness. Lower, because dark clothes on dark sheets are honestly dark. */
  scanDarkLuma: 0.1,
  /** Live: the camera is at its limit (ISO near its max and a long exposure) even if the
   *  auto-exposure keeps the picture bright. */
  darkIsoShare: 0.9,
  darkExposureS: 1 / 20,
  /** Still: how much of the edge detail survives a light blur. Real photos ≤ 0.19; a 10 px motion
   *  blur at 2048 px ≥ 0.20; a 6 px soft focus ≥ 0.5. */
  blurRatio: 0.24,
  /** Backlit: a lot of near-white (a window behind him) while he himself is dim. */
  backlitClipped: 0.15,
  backlitSubject: 0.35,
  /** Scan: near-white share that means glare on the clothes. */
  glareClipped: 0.1,
  /** Fit: his body (shoulders to ankles) shorter than this share of the frame height. */
  tooFarBody: 0.3,
  /** Live: mean frame-to-frame change (0–1) that means shake or movement. Provisional (phone). */
  moving: 0.035,
  /** Scan: a person box at least this share of the frame is "a person in view". */
  personShare: 0.04,
  /** Scan: the clothes label's confidence below this, with no pieces, is "no clothes". */
  clothes: 0.1,
  /** Scan: pieces smaller than this are noise; larger than this is the bed or the floor. */
  pieceMin: 0.005,
  pieceMax: 0.6,
  /** Scan: all pieces together cover less than this share: too far. */
  piecesTooFar: 0.06,
  /** Live: how long after the first frame (or a flip) the exposure is still settling. His phone's
   *  first frame always read ISO 294 at 1/60 s and luma 0.03–0.14, and the next one, 0.1–0.2 s
   *  later, 0.3–0.6 (guide.log, Oct 18–24, #380); so no "too dark" and no countdown before this. */
  exposureSettleMs: 1000,
} as const;

// ---- Live tips ----------------------------------------------------------------------------

export type FitTip =
  | 'dark' | 'darkFlash' | 'noPerson' | 'mirrorAim' | 'backlit' | 'tooClose' | 'shortMirror' | 'tooFar' | 'moveLeft' | 'moveRight' | 'moving' | 'good' | 'goodFull';
export type ScanTip = 'looking' | 'dark' | 'darkTorch' | 'person' | 'noClothes' | 'moving' | 'glare' | 'cutOff' | 'tooFar' | 'good';

const isGoodState = (s: GuideState) => s === 'good' || s === 'goodFull';

/** Too dark to see well: he (or the frame) is dim, or the camera is at its limit. */
export function isDark(g: Pick<GuideEvent, 'luma' | 'subjectLuma' | 'iso' | 'maxIso' | 'exposure'>, limit: number = T.darkLuma): boolean {
  const luma = g.subjectLuma ?? g.luma;
  if (luma !== undefined && luma < limit) return true;
  if (g.iso && g.maxIso && g.exposure !== undefined) return g.iso / g.maxIso >= T.darkIsoShare && g.exposure >= T.darkExposureS;
  return false;
}

export interface FitTipResult {
  tip: FitTip;
  /** The 3-2-1 may run (Propped) on this frame. */
  ready: boolean;
  /** Show "Turn on flash" under the tip. */
  offerFlash: boolean;
}

/** True until `T.exposureSettleMs` after the first frame it sees (or after `reset()`, for a
 *  flip): while the auto-exposure is still finding the light, a dark frame means nothing (#380). */
export function createExposureClock(settleMs: number = T.exposureSettleMs) {
  let start: number | null = null;
  return {
    settling(nowMs: number): boolean {
      start ??= nowMs;
      return nowMs - start < settleMs;
    },
    reset() {
      start = null;
    },
  };
}

/** The fit-check camera's tip, most urgent first. Older native builds send only `state`.
 *  `settling`: the exposure isn't settled yet, so darkness isn't judged and the 3-2-1 waits. */
export function fitTip(g: GuideEvent, o: { mode: 'propped' | 'mirror'; flash: boolean; settling?: boolean }): FitTipResult {
  const dark = !o.settling && isDark(g);
  const res = (tip: FitTip, ready = false): FitTipResult => ({ tip, ready: ready && !o.settling, offerFlash: dark && !o.flash });
  if (dark && !o.flash) return res('dark');
  // In the dark the pose often fails, so "Step into the frame" would be wrong while he's in it.
  if (g.state === 'noPerson') return res(dark ? 'darkFlash' : o.mode === 'mirror' ? 'mirrorAim' : 'noPerson');
  const backlit = (g.clipped ?? 0) >= T.backlitClipped && g.subjectLuma !== undefined && g.subjectLuma < T.backlitSubject;
  if (backlit) return res('backlit');
  // No hips in Mirror is usually a short mirror (a bathroom), where "step back" can't help: offer Propped (#313).
  if (g.state === 'tooClose') return res(o.mode === 'mirror' ? 'shortMirror' : 'tooClose');
  if (g.bodyShare !== undefined && g.bodyShare < T.tooFarBody) return res('tooFar');
  if (g.state === 'moveLeft' || g.state === 'moveRight') return res(g.state);
  // Propped is hands-free (the countdown already says "Hold still"); Mirror is handheld.
  if (o.mode === 'mirror' && (g.motion ?? 0) >= T.moving) return res('moving');
  if (dark) return res('darkFlash', isGoodState(g.state));
  return res(g.state === 'goodFull' ? 'goodFull' : 'good', true);
}

export interface ScanTipResult {
  tip: ScanTip;
  /** Pieces in view (for "{n} pieces in view"). */
  count: number;
  offerFlash: boolean;
}

/** The pieces worth drawing and counting: not noise, not the bed or floor itself. */
export function scanPieces<P extends { share: number }>(pieces: readonly P[] | undefined): P[] {
  return (pieces ?? []).filter((p) => p.share >= T.pieceMin && p.share <= T.pieceMax);
}

/** The clothes-scan camera's tip, most urgent first. */
export function scanTip(g: GuideEvent, o: { torch: boolean; settling?: boolean }): ScanTipResult {
  const dark = !o.settling && isDark({ ...g, subjectLuma: undefined }, T.scanDarkLuma);
  const res = (tip: ScanTip, count = 0): ScanTipResult => ({ tip, count, offerFlash: dark && !o.torch });
  if (dark) return res(o.torch ? 'darkTorch' : 'dark');
  const s = g.scan;
  if (!s) return res('looking');
  if ((s.people ?? []).some((share) => share >= T.personShare)) return res('person');
  const pieces = scanPieces(s.pieces);
  if (pieces.length === 0 && (s.clothes ?? 0) < T.clothes) return res('noClothes');
  if ((g.motion ?? 0) >= T.moving) return res('moving', pieces.length);
  if ((g.clipped ?? 0) >= T.glareClipped) return res('glare', pieces.length);
  if (pieces.some((p) => p.edge)) return res('cutOff', pieces.length);
  if (pieces.length > 0 && pieces.reduce((a, p) => a + p.share, 0) < T.piecesTooFar) return res('tooFar', pieces.length);
  return res(pieces.length > 0 ? 'good' : 'looking', pieces.length);
}

/**
 * Keeps the tip from flickering: a new tip shows only after it has been the answer for `holdMs`
 * straight. The first tip shows at once. Pure (time passed in).
 */
export function createTipFilter<K extends string>(holdMs = 400) {
  let shown: K | null = null;
  let pending: K | null = null;
  let since = 0;
  return {
    feed(next: K, nowMs: number): K {
      if (shown === null || next === shown) {
        shown = next;
        pending = null;
        return shown;
      }
      if (next !== pending) {
        pending = next;
        since = nowMs;
      } else if (nowMs - since >= holdMs) {
        shown = next;
        pending = null;
      }
      return shown;
    },
    get shown() {
      return shown;
    },
  };
}

// ---- After the shot -----------------------------------------------------------------------

export type IssueReason = 'dark' | 'blurry' | 'backlit' | 'noPerson' | 'cantFrame' | 'person' | 'cantHide' | 'noClothes' | 'cutOff' | 'glare';
export interface Issue {
  reason: IssueReason;
  /** "Use it anyway" is offered. Never when the photo couldn't be sent anyway (no person, or a
   *  face that can't be hidden: ruling 10). */
  allowUse: boolean;
}

const blurry = (a: StillAssessment) => (a.blurRatio ?? 0) >= T.blurRatio;
const darkStill = (a: StillAssessment) => isDark({ luma: a.luma, subjectLuma: a.subjectLuma });
const darkScan = (a: StillAssessment) => isDark({ luma: a.luma }, T.scanDarkLuma);

/** The fit check's quick look at a photo. null: nothing to say (two people go to S23 later).
 *  A shoe snap (`needsPerson: false`) is only checked for light and blur. */
export function fitIssue(a: StillAssessment | null, o: { needsPerson?: boolean } = {}): Issue | null {
  if (!a || !a.ok) return null; // couldn't measure: photo prep still decides
  if (o.needsPerson === false) {
    if (isDark({ luma: a.luma })) return { reason: 'dark', allowUse: true };
    return blurry(a) ? { reason: 'blurry', allowUse: true } : null;
  }
  if (a.frame === 'couldNotFrame') return { reason: 'cantFrame', allowUse: false };
  if (a.frame === 'noPerson') {
    // Say the cause when there is one; it can't be sent either way.
    return { reason: darkStill(a) ? 'dark' : blurry(a) ? 'blurry' : 'noPerson', allowUse: false };
  }
  if (darkStill(a)) return { reason: 'dark', allowUse: true };
  if (blurry(a)) return { reason: 'blurry', allowUse: true };
  if ((a.clipped ?? 0) >= T.backlitClipped && a.subjectLuma !== undefined && a.subjectLuma < T.backlitSubject) return { reason: 'backlit', allowUse: true };
  return null;
}

/** The clothes scan's quick look. Everything but a face we can't hide may be used anyway. */
export function scanIssue(a: StillAssessment | null): Issue | null {
  if (!a || !a.ok) return null;
  if (a.frame === 'couldNotFrame') return { reason: 'cantHide', allowUse: false };
  if (darkScan(a)) return { reason: 'dark', allowUse: true };
  if (blurry(a)) return { reason: 'blurry', allowUse: true };
  if ((a.people ?? []).some((b) => b.width * b.height >= T.personShare)) return { reason: 'person', allowUse: true };
  const pieces = scanPieces(a.pieces);
  if (pieces.length === 0 && (a.clothes ?? 0) < T.clothes) return { reason: 'noClothes', allowUse: true };
  if (pieces.some((p) => p.edge)) return { reason: 'cutOff', allowUse: true };
  if ((a.clipped ?? 0) >= T.glareClipped) return { reason: 'glare', allowUse: true };
  return null;
}
