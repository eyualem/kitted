// DEMO: the Simulator has no camera, so the guide is scripted over a bundled photo (02 D5 demo
// note). `?guide=<tip>` holds one tip for a screenshot; `?review=<reason>` opens the after-shot
// panel at once (demo screens 41–49, DECISIONS-LOG #100). The measures are what the real camera
// would send for that state; guidance.ts judges them the same way.
import type { GuideEvent, ScanPiece, StillAssessment, ViewBox } from '../../../modules/kitted-vision';
import type { FitTip, Issue, IssueReason, ScanTip } from './guidance';

const base = (body: ViewBox): GuideEvent => ({ state: 'good', body, faces: [], luma: 0.5, subjectLuma: 0.5, clipped: 0, motion: 0.004, bodyShare: 0.72 });

export function simFitEvent(tip: FitTip, body: ViewBox): GuideEvent {
  const g = base(body);
  switch (tip) {
    case 'dark':
    case 'darkFlash':
      return { ...g, luma: 0.07, subjectLuma: 0.08, iso: 2560, maxIso: 2560, exposure: 1 / 15 };
    case 'backlit':
      return { ...g, luma: 0.55, clipped: 0.32, subjectLuma: 0.22 };
    case 'tooFar':
      return { ...g, bodyShare: 0.24 }; // the bundled photo can't move; only the measure says "far"
    case 'tooClose':
      return { ...g, state: 'tooClose', body: { ...body, height: body.height * 0.55 } };
    case 'moving':
      return { ...g, motion: 0.07 };
    case 'noPerson':
    case 'mirrorAim':
      return { ...g, state: 'noPerson', body: undefined, subjectLuma: undefined, bodyShare: undefined };
    case 'moveLeft':
    case 'moveRight':
      return { ...g, state: tip };
    default:
      return { ...g, state: tip };
  }
}

/** Where the pieces sit on the sample flat lay (fractions of the 3:4 preview). */
export const SIM_LAYOUT: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 0.08, y: 0.07, w: 0.46, h: 0.38 }, // hoodie
  { x: 0.58, y: 0.1, w: 0.36, h: 0.48 }, // jeans
  { x: 0.14, y: 0.6, w: 0.34, h: 0.22 }, // sneakers
];

/** Where each sample piece is drawn for a state (square art, centered in its layout box). */
export function simPieceRects(state: ScanTip | 'review', w: number, h: number): ViewBox[] {
  if (state === 'noClothes' || state === 'person') return [];
  const far = state === 'tooFar' ? 0.32 : 1;
  return SIM_LAYOUT.map((l, i) => {
    const shift = state === 'cutOff' && i === 1 ? 0.24 : 0;
    const cx = 0.5 + (l.x + l.w / 2 - 0.5) * far + shift, cy = 0.5 + (l.y + l.h / 2 - 0.5) * far;
    const size = Math.min(l.w * w, l.h * h) * far * 1.05;
    return { x: cx * w - size / 2, y: cy * h - size / 2, width: size, height: size };
  });
}

export function simScanEvent(tip: ScanTip, w: number, h: number): GuideEvent {
  const pieces: ScanPiece[] = simPieceRects(tip, w, h).map((box) => ({
    // Clipped to the frame like the real mask; a box reaching the edge is "cut off".
    box: { ...box, width: Math.min(box.width, w - box.x) },
    share: tip === 'tooFar' ? 0.015 : (box.width * box.height * 0.5) / (w * h),
    edge: box.x + box.width >= w - 1,
  }));
  const g: GuideEvent = { state: 'noPerson', faces: [], luma: 0.55, clipped: 0.01, motion: 0.004, scan: { people: [], clothes: 0.86, labels: [], pieces } };
  switch (tip) {
    case 'dark':
    case 'darkTorch':
      return { ...g, luma: 0.05, iso: 3200, maxIso: 3200, exposure: 1 / 12 };
    case 'person':
      return { ...g, scan: { ...g.scan!, people: [0.3] } };
    case 'noClothes':
      return { ...g, scan: { people: [], clothes: 0.02, labels: [], pieces: [] } };
    case 'moving':
      return { ...g, motion: 0.08 };
    case 'glare':
      return { ...g, clipped: 0.18 };
    case 'looking':
      return { ...g, scan: undefined };
    default:
      return g;
  }
}

const REASONS: readonly IssueReason[] = ['dark', 'blurry', 'backlit', 'noPerson', 'cantFrame', 'person', 'cantHide', 'noClothes', 'cutOff', 'glare'];

/** `?review=<reason>` → that issue, as guidance.ts would return it. */
export function simIssue(reason: string | undefined): Issue | null {
  const r = REASONS.find((x) => x === reason);
  if (!r) return null;
  return { reason: r, allowUse: r !== 'noPerson' && r !== 'cantFrame' && r !== 'cantHide' };
}

/** For the dev log: one line per after-shot check, so thresholds can be tuned from the phone. */
export function assessLine(a: StillAssessment | null): string {
  if (!a) return 'not measured';
  const f = (v?: number) => (v === undefined ? '–' : v.toFixed(3));
  const scan = a.kind === 'scan'
    ? ` · people ${(a.people ?? []).length} · clothes ${f(a.clothes)} · pieces ${(a.pieces ?? []).map((p) => `${p.share.toFixed(3)}${p.edge ? ' edge' : ''}`).join(', ') || 'none'} · ${(a.labels ?? []).join('; ')}`
    : ` · person ${f(a.subjectLuma)} · body ${f(a.bodyShare)}`;
  return `luma ${f(a.luma)} · clipped ${f(a.clipped)} · blur ${f(a.blurRatio)} · frame ${a.frame ?? '–'}${scan} · ${a.ms ?? '?'} ms`;
}
