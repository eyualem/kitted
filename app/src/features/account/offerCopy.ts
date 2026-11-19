// T41 (SB3.1): the "Keep your fits" card's body, by the numbers. Not built yet.

export interface OfferCounts {
  /** Scored full checks (re-checks don't count) when the card was posted. */
  fits: number;
  /** Closet pieces (not deleted) when the card was posted. */
  pieces: number;
}

/** SB3's body: `Your {n} fits and the {m} pieces in your closet live only on this iPhone. Sign in to back them up and get
 *  them back on a new phone. Kitted works the same without it.` With one fit `Your first fit` (see TESTING.md for the
 *  exact lines); with no pieces the closet part is left out. */
export function offerBody(_c: OfferCounts): string {
  throw new Error('T41: not built');
}
