// O1's example (02 D1, 10-onboarding.md §14): the outfit Welcome and the example check (O1e) show, and what the engine
// gives it. Since #388 it's a drawn outfit, not a photo (the founder: the stock photo isn't ours and looked bad): the
// closet's own flats draw these garments, so the drawing *is* the reading and nothing can show a face. A navy crewneck,
// khaki straight chinos and black running shoes: the most common beginner outfit, with one full-point fix (the runners).
// Scored by the engine new checks use, at Everyday with no picks (picks never change a score, #211), so Welcome shows
// the score the app would give it. A photo of the founder's own (#279) can take this reading's place.
import type { Fix, Garment, Reading } from '@kitted/core';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { garmentHex } from '@/features/fitcheck/labels';
import { scoreWordLabel } from '@/design-system/score';

const plain = {
  pattern: 'solid', logo: 'none', condition: 'clean', certainty: 'clear', pattern_scale: 'na', saturation: 'na', strain: 'none',
  distressed_by_design: false, shows_below_outer: false, leg_shape: 'na', hem: 'na', tucked: 'na', length: 'na', sleeve_end: 'na',
} as const;

export const WELCOME_OUTFIT: Reading = {
  scene: { framing: 'full_body', shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: 'good', clothed: 'fully' },
  garments: [
    { ...plain, category: 'top', subcategory: 'sweater', color_family: 'navy', volume: 3, length: 'at_belt' },
    { ...plain, category: 'bottom', subcategory: 'chinos', color_family: 'khaki_beige', volume: 3, leg_shape: 'straight', hem: 'slight_break' },
    { ...plain, category: 'footwear', subcategory: 'performance_runner', color_family: 'black', volume: 3 },
  ],
};

export interface WelcomePiece {
  garment: Garment;
  hex: string;
}

export interface WelcomeExample {
  score: number;
  word: string;
  summary: string | null;
  /** The card's fix rows, as a first check shows them (no repeats). */
  fixes: Fix[];
  nextLevel: string | null;
  /** The pieces drawn, top to toe; a first check adds each to the closet. */
  pieces: WelcomePiece[];
  /** The engine's whole result, for the example check's Why. */
  details: ReturnType<typeof evaluateCheck>['row']['details'];
}

let cached: WelcomeExample | null | undefined;

export function welcomeExample(): WelcomeExample | null {
  if (cached !== undefined) return cached;
  const ev = evaluateCheck({ reading: WELCOME_OUTFIT, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
  const score = ev.row.score;
  if (ev.row.status !== 'scored' || score === null) return (cached = null);
  const rows = ev.row.fixes;
  cached = {
    score,
    word: scoreWordLabel(score),
    summary: ev.row.explanation,
    fixes: rows.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i),
    nextLevel: ev.row.details.nextLevel?.[0] ?? null,
    pieces: (WELCOME_OUTFIT.garments ?? []).map((g) => ({ garment: g, hex: garmentHex(g) })),
    details: ev.row.details,
  };
  return cached;
}
