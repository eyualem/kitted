// The one quick tap's answer (rubric v4, RULEBOOK Part 5; app side of rubric.ask_question).
// askQuestion() decides whether to ask and what each answer scores; these helpers apply the answer to a reading
// the way askQuestion scored it (subcategory only, never certainty), give the buttons the question's word order,
// and carry the answer onto a re-check's raw reading so a second misread can't undo it.

import type { Reading, TapOption, TapQuestion } from "./types";
import { clone } from "./util";

/** A NEW reading with the asked garment's subcategory set to `value` (the original is never edited). Exactly the
 *  change askQuestion scored, so score(applyTapAnswer(r, q, o.value)).overall === o.score. */
export function applyTapAnswer(reading: Reading, q: Pick<TapQuestion, "garmentIndex" | "field">, value: string): Reading {
  const r = clone(reading);
  const g = r.garments[q.garmentIndex];
  if (!g) throw new RangeError(`no garment at index ${q.garmentIndex}`);
  g[q.field] = value;
  return r;
}

/** Which garment of its slot the question is about (0 = the first bottom), so a later reading can find it. */
export function tapOrdinal(reading: Reading, garmentIndex: number): number {
  const cat = reading.garments[garmentIndex]?.category;
  if (cat === undefined) throw new RangeError(`no garment at index ${garmentIndex}`);
  return reading.garments.slice(0, garmentIndex).filter((g) => g.category === cat).length;
}

/** The two options in the question's word order ("Jeans or sweatpants?" → Jeans, Sweatpants), not as-read first. */
export function tapOrder(q: Pick<TapQuestion, "pair" | "options">): [TapOption, TapOption] {
  const [a] = q.pair.split("/");
  const [x, y] = q.options;
  return x.value === a ? [x, y] : [y, x];
}

/** What a stored tap needs to find its garment again. */
export interface TapCarry {
  /** "jeans/sweatpants" */
  pair: string;
  slot: TapQuestion["slot"];
  ordinal: number;
}

/**
 * A re-check's raw reading with the first check's answer carried over: when the same garment is read as the other
 * half of the asked pair again, it gets the parent's CURRENT value (his answer, or a later correction inside the
 * pair). Not when a fix replaces that whole slot (then the new photo's piece is read as it is), and never outside
 * the pair. recheckMerge then keeps the first reading's identity instead of seeing a "swap".
 */
export function carryTapAnswer(parentCurrent: Reading, tap: TapCarry, next: Reading, targets: Iterable<string>): Reading {
  const T = new Set(targets);
  if (T.has(tap.slot) || T.has("*")) return next;
  const pair = tap.pair.split("/");
  const nth = (r: Reading) => r.garments.filter((g) => g.category === tap.slot)[tap.ordinal];
  const was = nth(parentCurrent)?.subcategory;
  const now = nth(next)?.subcategory;
  if (typeof was !== "string" || typeof now !== "string" || was === now) return next;
  if (!pair.includes(was) || !pair.includes(now)) return next;
  const out = clone(next);
  nth(out)!.subcategory = was;
  return out;
}
