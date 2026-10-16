// The rules judge the chat's outfits too (07 §15.6, J1–J3, #302): "the code knows, the AI talks". An outfit the chat
// talks about (the pieces he names in "can I wear…", the picker's outfits) is built from his closet pieces' stored
// facts and run through the same parts engine a fit check uses, so the answer can't disagree with what a check would
// say. What comes out is words only: the rules' own reason lines, never a number (only a photo is ever scored; the
// locked rule). Facts a closet can't hold (how the hem meets the shoe, a tuck, where the top ends) are set neutral by
// core's outfitReading and named as "can't tell".
// His preferences are code too (J3): what he said he avoids ("hates skinny jeans", "no yellow") takes those pieces out
// of every outfit and buy the chat suggests, instead of only being a line in the prompt.
import { outfitReading, scoreParts, type ClosetItem, type Styles } from '@kitted/core';
import type { ClosetItemRow, FactRow, OccasionKey } from '@/data/types';
import { scoreOptions } from '@/features/fitcheck/scoring';

export interface Judgement {
  /** yes: no rule finds a problem · depends: a smaller problem (a better swap exists) · no: a big one (a charge of 2 or
   *  more on a part, or the occasion holds the outfit down). */
  verdict: 'yes' | 'depends' | 'no';
  works: string[];
  problems: string[];
  /** What the outfit can't be judged on without a photo. */
  cantTell: string[];
}

export const CANT_TELL_ALWAYS = 'how the hem meets the shoes, and whether the top is tucked or where it ends';

const SLOT_WORD: Record<string, string> = { top: 'a top', bottom: 'pants', shoes: 'shoes' };

/** Rules that read what outfitReading only assumes (a tuck, where the top ends, the hem): never said either way. */
const ASSUMED = /waist|tuck|pool|hem|stack|length|long|break/i;
const BIG = -2;

/** The parts engine's verdict on an outfit of his pieces (null when nothing in it can be judged). */
export function judgeOutfit(items: readonly ClosetItemRow[], occasion: OccasionKey, styles: Styles | null): Judgement | null {
  if (items.length === 0) return null;
  const reading = outfitReading(items as unknown as ClosetItem[]);
  const res = scoreParts(reading, scoreOptions({ occasion, styles: styles ?? [], boldness: null, secondLook: null }));
  if (res.overall === null) return null;
  const works: string[] = [];
  const problems: string[] = [];
  const add = (list: string[], line: string) => {
    const l = line.trim();
    if (l && !list.includes(l)) list.push(l);
  };
  let big = res.occasion.ceiling !== null;
  for (const part of Object.values(res.parts)) {
    for (const r of part.reasons) {
      if (ASSUMED.test(r.check)) continue;
      if (r.points < 0) add(problems, r.line);
      else if (r.points > 0) add(works, r.line);
      if (r.points <= BIG) big = true;
    }
  }
  // An occasion line's ": held to 6.0" is a score for an outfit no photo has scored: the words stay, the number goes.
  if (res.occasion.deduction > 0 || res.occasion.ceiling !== null) for (const l of res.occasion.lines) add(problems, l.replace(/:\s*held to \d+(?:\.\d+)?/, ''));
  const cats = new Set(items.map((i) => String(i.garment.category)));
  const missing = ['top', 'bottom', 'shoes'].filter((c) => !cats.has(c)).map((c) => SLOT_WORD[c]!);
  const cantTell = [CANT_TELL_ALWAYS, ...(missing.length ? [`the rest of the outfit (${missing.join(', ')}): he didn't say`] : [])];
  return { verdict: big ? 'no' : problems.length ? 'depends' : 'yes', works, problems, cantTell };
}

/** The judgement as evidence lines (no numbers, the rules' own words). */
export function judgementLines(j: Judgement): string[] {
  return [
    `What the app's rules say about it (verdict: ${j.verdict}): ${j.verdict === 'yes' ? 'it works' : j.verdict === 'depends' ? 'it works, with a better option' : 'it doesn\'t work'}`,
    ...j.problems.map((p) => `- Problem: ${p}`),
    ...j.works.slice(0, 3).map((w) => `- Works: ${w}`),
    ...j.cantTell.map((c) => `- Can't tell without a photo: ${c}`),
  ];
}

// ---------------------------------------------------------------------------------------- his preferences (J3)

const LEG_WORDS: Record<string, readonly string[]> = {
  skinny: ['skinny'], slim: ['slim'], straight: ['straight'], wide: ['wide', 'baggy'], bootcut: ['bootcut', 'flare'], relaxed: ['relaxed'],
};
const FIT_WORDS: Record<string, readonly string[]> = { oversized: ['oversized', 'baggy'], fitted: ['fitted', 'tight', 'muscle'], relaxed: ['relaxed'] };
const COLOR_WORDS = ['black', 'white', 'grey', 'gray', 'navy', 'blue', 'light blue', 'brown', 'tan', 'beige', 'khaki', 'cream', 'olive', 'green', 'red', 'burgundy', 'orange', 'yellow', 'pink', 'purple', 'rust'];

const words = (s: string) => s.toLowerCase().replace(/[^a-z\s-]/g, ' ');
const hasWord = (text: string, w: string) => new RegExp(`(^|\\s)${w}(s|es)?(\\s|$)`).test(text);

/** Does one avoid-fact rule this piece out? */
function avoids(fact: FactRow, c: ClosetItemRow): boolean {
  const v = words(fact.value);
  const g = c.garment as Record<string, unknown>;
  const str = (k: string) => (typeof g[k] === 'string' ? (g[k] as string).toLowerCase().replace(/_/g, ' ') : '');
  if (fact.key === 'color_avoid') {
    const fam = str('color_family');
    const name = words(c.name);
    return COLOR_WORDS.some((w) => hasWord(v, w) && (fam === w || (w === 'gray' && fam === 'grey') || hasWord(name, w)));
  }
  if (fact.key === 'fit_avoid') {
    const leg = str('leg_shape');
    const fit = str('fit');
    const sub = str('subcategory');
    // "skinny jeans" names a leg and a kind: both have to match when both are said.
    const legHit = Object.entries(LEG_WORDS).some(([shape, ws]) => ws.some((w) => hasWord(v, w)) && leg === shape);
    const fitHit = Object.entries(FIT_WORDS).some(([f, ws]) => ws.some((w) => hasWord(v, w)) && fit === f);
    const saysLeg = Object.values(LEG_WORDS).some((ws) => ws.some((w) => hasWord(v, w)));
    const saysFit = Object.values(FIT_WORDS).some((ws) => ws.some((w) => hasWord(v, w)));
    if (legHit) return true;
    if (fitHit) return true;
    if (!saysLeg && !saysFit && sub) return sub.split(' ').some((w) => w.length > 3 && hasWord(v, w));
    return false;
  }
  return false;
}

/** His pieces the chat must leave out of outfits, by what he said he avoids (live, told facts only). */
export function avoidedIds(closet: readonly ClosetItemRow[], facts: readonly FactRow[]): Set<string> {
  const rules = facts.filter((f) => !f.isDeleted && f.source === 'told' && (f.key === 'fit_avoid' || f.key === 'color_avoid'));
  const out = new Set<string>();
  if (rules.length === 0) return out;
  for (const c of closet) if (rules.some((f) => avoids(f, c))) out.add(c.id);
  return out;
}

/** Whether a kind of piece to buy ("skinny jeans", "yellow tee") is one he said he avoids. */
export function avoidsPhrase(phrase: string, facts: readonly FactRow[]): boolean {
  const p = words(phrase);
  return facts.some((f) => {
    if (f.isDeleted || f.source !== 'told') return false;
    const v = words(f.value);
    if (f.key === 'color_avoid') return COLOR_WORDS.some((w) => hasWord(v, w) && hasWord(p, w));
    if (f.key === 'fit_avoid') return [...Object.values(LEG_WORDS), ...Object.values(FIT_WORDS)].some((ws) => ws.some((w) => hasWord(v, w) && hasWord(p, w)));
    return false;
  });
}
