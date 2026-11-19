// T41 (SB3.1): the "Keep your fits" card's body, by the numbers.

export interface OfferCounts {
  /** Scored full checks (re-checks don't count) when the card was posted. */
  fits: number;
  /** Closet pieces (not deleted) when the card was posted. */
  pieces: number;
}

/** SB3's body: `Your {n} fits and the {m} pieces in your closet live only on this iPhone. Sign in to back them up and get
 *  them back on a new phone. Kitted works the same without it.` With one fit `Your first fit` (see TESTING.md for the
 *  exact lines); with no pieces the closet part is left out. */
export function offerBody(c: OfferCounts): string {
  const one = c.fits === 1;
  const fits = one ? 'Your first fit' : `Your ${c.fits} fits`;
  if (c.pieces > 0) {
    return `${fits} and the ${c.pieces} ${c.pieces === 1 ? 'piece' : 'pieces'} in your closet live only on this iPhone. Sign in to back them up and get them back on a new phone. Kitted works the same without it.`;
  }
  return one
    ? 'Your first fit lives only on this iPhone. Sign in to back it up and get it back on a new phone. Kitted works the same without it.'
    : `${fits} live only on this iPhone. Sign in to back them up and get them back on a new phone. Kitted works the same without it.`;
}
