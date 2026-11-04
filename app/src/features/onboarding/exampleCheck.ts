// O1e · The example check (02 §3.1, 10-onboarding.md §14): Welcome's drawn example outfit, scored by the engine new
// checks use, at Everyday with no picks and an empty closet, the way a first check would be. No photo is sent and
// nothing is stored: it's computed here from welcomeExample(), so it can't drift from Welcome's card.
import type { Fix } from '@kitted/core';
import { whyParts, type WhyParts } from '@/features/why/partsRows';
import { welcomeExample, type WelcomePiece } from './welcomeExample';

export interface ExampleCheck {
  /** The drawn outfit, top to toe (no photo since #388). */
  pieces: WelcomePiece[];
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
  const w = welcomeExample();
  if (!w) return (cached = null);
  const parts = w.details.parts;
  cached = {
    pieces: w.pieces,
    score: w.score,
    summary: w.summary,
    fixes: w.fixes,
    nextLevel: w.nextLevel,
    why: parts ? whyParts(parts, { occasion: 'everyday', readsAs: w.details.readsAs ?? null, gainPart: parts.gainPart }) : null,
  };
  return cached;
}
