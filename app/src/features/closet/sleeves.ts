// Long-sleeve tees (09-ui-review §24, #359; founder, Oct 19: "closet does not detect full sleeve tees"). The reading
// has no long-sleeve kind, so a long-sleeve tee stays a `tee` (or `graphic_tee`) and every score stays as it is; its
// sleeves are part of the piece's look (ClosetArt.sleeves), which names and draws it. Pure.
import type { Observation } from '@kitted/core';
import type { ClosetArt } from '@/data/types';

export type Sleeves = NonNullable<ClosetArt['sleeves']>;
const SLEEVES: readonly Sleeves[] = ['short', 'long', 'sleeveless'];

/** The kinds that come with short or long sleeves and are named and drawn by them ("Grey long-sleeve tee"). */
export const SLEEVED_KINDS: readonly string[] = ['tee', 'graphic_tee', 'polo', 'knit_polo', 'jersey'];
/** The tees the Kind list's "Long-sleeve tee" stands for. */
export const TEE_KINDS: readonly string[] = ['tee', 'graphic_tee'];
/** The pseudo-kind "What it is" offers (§24 K1): written as `tee` with his confirmed long sleeves, never as itself. */
export const LONG_SLEEVE_TEE = 'long_sleeve_tee';

/** Where the scoring read says a sleeve ends when there is one to see ("na" covers short sleeves and not visible). */
const LONG_ENDS: readonly string[] = ['above_wrist', 'at_wrist', 'covers_hand'];

/** One sighting's sleeve read: the closet call's, else the scoring read's sleeve end on a top or layer. */
export function sleeveRead(o: Observation): Sleeves | null {
  const c = o.sleeve_length;
  if (typeof c === 'string' && (SLEEVES as readonly string[]).includes(c)) return c as Sleeves;
  if ((o.category === 'top' || o.category === 'outerwear') && typeof o.sleeve_end === 'string' && LONG_ENDS.includes(o.sleeve_end)) return 'long';
  return null;
}

/** A sleeved kind worn with long sleeves: what's named "long-sleeve …" and drawn with long sleeves. */
export function isLongSleeved(subcategory: unknown, art: Pick<ClosetArt, 'sleeves'> | null | undefined): boolean {
  return typeof subcategory === 'string' && SLEEVED_KINDS.includes(subcategory) && art?.sleeves === 'long';
}
