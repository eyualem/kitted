// O1e · The example check (02 §3.1, 10-onboarding.md): the bundled Welcome reading (s14) scored by the engine new checks
// use, at Everyday with no picks and an empty closet, the way a first check would be. Nothing is sent and nothing is
// stored: it's computed here, so it can't drift from Welcome's mini card (same reading, same score). Since T38 there is
// no photo: the screens draw the reading's garments (outfitDrawing.ts).
import type { Fix, Reading } from '@kitted/core';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { whyParts, type WhyParts } from '@/features/why/partsRows';
import { demoReadingById } from '@/services/readingSource/demoReadings';

/** The bundled reading Welcome and the Example check draw and score (was WELCOME_PHOTO). Defined here and re-exported
 *  by welcomeExample.ts, so neither module needs the other at load. */
export const WELCOME_READING = 's14';

export interface ExampleCheck {
  /** The reading that is drawn and scored (the same object as welcomeExample().reading). */
  reading: Reading;
  score: number;
  summary: string | null;
  /** The card's fix rows, as a first check shows them (no repeats). */
  fixes: Fix[];
  nextLevel: string | null;
  /** The Why breakdown (parts engine); null if the engine in use doesn't give one. */
  why: WhyParts | null;
}

let cached: ExampleCheck | null | undefined;

export function exampleCheck(): ExampleCheck | null {
  if (cached !== undefined) return cached;
  const reading = demoReadingById(WELCOME_READING);
  if (!reading) return (cached = null);
  const ev = evaluateCheck({ reading, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
  const score = ev.row.score;
  if (ev.row.status !== 'scored' || score === null) return (cached = null);
  const parts = ev.row.details.parts;
  const rows = ev.row.fixes;
  cached = {
    reading,
    score,
    summary: ev.row.explanation,
    fixes: rows.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i),
    nextLevel: ev.row.details.nextLevel?.[0] ?? null,
    why: parts ? whyParts(parts, { occasion: 'everyday', readsAs: ev.row.details.readsAs ?? null, gainPart: parts.gainPart }) : null,
  };
  return cached;
}
