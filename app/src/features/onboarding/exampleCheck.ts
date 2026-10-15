// O1e · The example check (02 §3.1, 10-onboarding.md): the Welcome photo scored by the engine new checks use, at
// Everyday with no picks and an empty closet, the way a first check would be. No photo is sent and nothing is stored:
// it's computed here, so it can't drift from Welcome's mini card (same photo, same score).
import type { Fix } from '@kitted/core';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { whyParts, type WhyParts } from '@/features/why/partsRows';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { WELCOME_PHOTO } from './welcomeExample';

export interface ExampleCheck {
  photoId: string;
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
  const reading = demoReadingById(WELCOME_PHOTO);
  if (!reading) return (cached = null);
  const ev = evaluateCheck({ reading, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
  const score = ev.row.score;
  if (ev.row.status !== 'scored' || score === null) return (cached = null);
  const parts = ev.row.details.parts;
  const rows = ev.row.fixes;
  cached = {
    photoId: WELCOME_PHOTO,
    score,
    summary: ev.row.explanation,
    fixes: rows.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i),
    nextLevel: ev.row.details.nextLevel?.[0] ?? null,
    why: parts ? whyParts(parts, { occasion: 'everyday', readsAs: ev.row.details.readsAs ?? null, gainPart: parts.gainPart }) : null,
  };
  return cached;
}
