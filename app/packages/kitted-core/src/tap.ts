// The one quick tap's answer (rubric v4, RULEBOOK Part 5; app side of rubric.ask_question).
// askQuestion() decides whether to ask and what each answer scores; these helpers apply the answer to a reading
// the way askQuestion scored it (the subcategory, and an "unsure" piece becomes "likely"), give the buttons the
// question's word order, and carry the answer onto a re-check's raw reading so a second misread can't undo it.
// Tap v2 (#120) adds the shoe question ("Boots, sneakers or slides?"): three options, each a kind (`group`).

import { RUBRIC_DATA } from "./rubricData";
import type { Reading, ShoeKind, TapOption, TapQuestion } from "./types";
import { clone } from "./util";

/** A NEW reading with the asked garment's subcategory set to `value` (the original is never edited). Exactly the
 *  change askQuestion scored (rubric._with), so score(applyTapAnswer(r, q, o.value)).overall === o.score. */
export function applyTapAnswer(reading: Reading, q: Pick<TapQuestion, "garmentIndex" | "field">, value: string): Reading {
  const r = clone(reading);
  const g = r.garments[q.garmentIndex];
  if (!g) throw new RangeError(`no garment at index ${q.garmentIndex}`);
  g[q.field] = value;
  if (g.certainty === "unsure") g.certainty = "likely";
  return r;
}

const SHOES = RUBRIC_DATA.tap.shoes;
const isShoeKind = (x: string): x is ShoeKind => (SHOES.order as string[]).includes(x);
/** The shoe question's pair names kinds ("boots/sneakers/slides"); a look-alike pair names two types. */
export const isShoeQuestion = (pair: string): boolean => pair.split("/").every(isShoeKind);

/** Which garment of its slot the question is about (0 = the first bottom), so a later reading can find it. */
export function tapOrdinal(reading: Reading, garmentIndex: number): number {
  const cat = reading.garments[garmentIndex]?.category;
  if (cat === undefined) throw new RangeError(`no garment at index ${garmentIndex}`);
  return reading.garments.slice(0, garmentIndex).filter((g) => g.category === cat).length;
}

/** The options in the question's word order ("Jeans or sweatpants?" → Jeans, Sweatpants; "Boots, sneakers or
 *  slides?" → Boots, Sneakers, Slides), not as-read first. */
export function tapOrder(q: Pick<TapQuestion, "pair" | "options"> & { kind?: TapQuestion["kind"] }): TapOption[] {
  if (q.kind === "known") return [...q.options]; // Yes, No
  const words = q.pair.split("/");
  const at = (o: TapOption) => {
    const i = words.indexOf(o.group ?? o.value);
    return i < 0 ? words.length : i;
  };
  return [...q.options].sort((x, y) => at(x) - at(y));
}

/** Every type a stored question covers: the pair's two, or for the shoe question "other" plus each asked kind's types. */
export function tapSpan(pair: string): string[] {
  const words = pair.split("/");
  return words.every(isShoeKind) ? ["other", ...words.flatMap((k) => SHOES.kinds[k as ShoeKind])] : words;
}

/** What a stored tap needs to find its garment again. */
export interface TapCarry {
  /** "jeans/sweatpants", or "boots/sneakers/slides" */
  pair: string;
  slot: TapQuestion["slot"];
  ordinal: number;
}

/**
 * A re-check's raw reading with the first check's answer carried over: when the same garment is read as the other
 * half of the asked pair again, it gets the parent's CURRENT value (his answer, or a later correction inside the
 * pair). Not when a fix replaces that whole slot (then the new photo's piece is read as it is), and never outside
 * the pair. recheckMerge then keeps the first reading's identity instead of seeing a "swap". For the shoe question
 * the span is "other" plus every type of the asked kinds (his boots read "slides" again stay his boots), and an
 * "unsure" shoe becomes "likely", as when he answered.
 */
export function carryTapAnswer(parentCurrent: Reading, tap: TapCarry, next: Reading, targets: Iterable<string>): Reading {
  const T = new Set(targets);
  if (T.has(tap.slot) || T.has("*")) return next;
  const pair = tapSpan(tap.pair);
  const nth = (r: Reading) => r.garments.filter((g) => g.category === tap.slot)[tap.ordinal];
  const was = nth(parentCurrent)?.subcategory;
  const now = nth(next)?.subcategory;
  if (typeof was !== "string" || typeof now !== "string" || was === now) return next;
  if (!pair.includes(was) || !pair.includes(now)) return next;
  const out = clone(next);
  const g = nth(out)!;
  g.subcategory = was;
  if (isShoeQuestion(tap.pair) && g.certainty === "unsure") g.certainty = "likely";
  return out;
}
