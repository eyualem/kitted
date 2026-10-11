// "Going for" (#215) as words: which looks the question shows, the note under it, the folded line and the advice
// sentence. Pure, so the copy is tested without a screen. Wording: mockups/going-for.html v2 (en.ts `gf.*`).
import type { GoingForAdvice, Styles } from '@kitted/core';
import { normStyleKey, type GoingForSource, type GoingForState, type OccasionKey, type StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { LOOKS } from '@/features/onboarding/looks';
import { t } from '@/i18n/en';

/** Occasions with no look to aim at: the question isn't asked there (the advice is null too). */
export const NO_LOOK_OCCASIONS: readonly OccasionKey[] = ['gym', 'home'];
export const asksLook = (o: OccasionKey): boolean => !NO_LOOK_OCCASIONS.includes(o);

/** His picks from setup, in order (old keys mapped). */
export function picksOf(styles: Styles | null | undefined): StyleKey[] {
  const out: StyleKey[] = [];
  for (const [k] of styles ?? []) {
    const s = normStyleKey(k);
    if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 3);
}

/** The tiles: his up-to-3 picks (none: the first three looks on the setup screen), and the rest for More. */
export function lookTiles(picks: readonly StyleKey[]): { tiles: StyleKey[]; more: StyleKey[] } {
  const order = LOOKS.map((l) => l.style);
  const tiles = picks.length > 0 ? picks.slice(0, 3) : order.slice(0, 3);
  return { tiles, more: order.filter((s) => !tiles.includes(s)) };
}

/** "minimal", "smart casual": a look's name inside a sentence. */
export const lookWord = (s: StyleKey | null): string => styleLabel(s).toLowerCase();
const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'an' : 'a');

export interface NoteText {
  /** The first sentence (semibold, or good-green after a tap). */
  lead: string;
  /** The rest, quieter. */
  tail: string;
  tone: 'ink' | 'good';
}

/** The line under the question. `where: 'result'` is the Change state. */
export function noteText(o: { where: 'wait' | 'result'; look: StyleKey | null; touched: boolean; source: GoingForSource; bothFromCard?: boolean }): NoteText {
  if (o.where === 'result') return { lead: t('gf.note.change'), tail: t('gf.note.changeTail'), tone: 'ink' };
  if (o.touched) {
    return o.look ? { lead: t('gf.note.got', { style: lookWord(o.look) }), tail: t('gf.note.gotTail'), tone: 'good' } : { lead: t('gf.note.gotNone'), tail: '', tone: 'good' };
  }
  if (!o.look) return { lead: t('gf.note.none'), tail: '', tone: 'ink' };
  const lead = o.source === 'card' ? t(o.bothFromCard ? 'gf.note.both' : 'gf.note.card') : o.source === 'last' ? t('gf.note.last') : t('gf.note.setup');
  return { lead, tail: t('gf.note.tail'), tone: 'ink' };
}

const SOURCE_WORDS: Record<Exclude<GoingForSource, 'none'>, 'gf.src.card' | 'gf.src.last' | 'gf.src.setup'> = {
  card: 'gf.src.card', last: 'gf.src.last', setup: 'gf.src.setup',
};

/** VoiceOver, said once when the question arrives (focus doesn't move). */
export function arriveAnnouncement(look: StyleKey | null, source: GoingForSource): string {
  if (!look || source === 'none') return t('gf.a11y.arriveNone');
  return t('gf.a11y.arrive', { style: styleLabel(look), source: t(SOURCE_WORDS[source]) });
}

/** The folded line's VoiceOver label. */
export function lineA11y(g: GoingForState, occasion: string): string {
  if (!g.style) return t('gf.line.a11y.none', { occasion });
  if (g.confirmed || g.source === 'none') return t('gf.line.a11y.chosen', { style: lookWord(g.style), occasion });
  return t('gf.line.a11y.picked', { style: lookWord(g.style), source: t(SOURCE_WORDS[g.source]), occasion });
}

export interface AdviceText {
  kind: 'match' | 'mismatch';
  /** Match: "It reads that way too." Mismatch: "Reads as streetwear." / "It doesn't read as one look yet." */
  lead: string;
  /** Mismatch with a named piece: "For a minimal look, the graphic tee pulls the other way.", else ''. */
  rest: string;
  /** The move row: its words and "Toward minimal", or null. */
  move: { title: string; detail: string } | null;
}

/** The advice under the score, from the stored core advice. `moveIsFix`: the card's fix number that is the same move
 *  (it already shows with its number), so the move isn't drawn twice; the sentence says that fix goes toward the look. */
export function adviceText(a: GoingForAdvice, moveIsFix: number | null = null): AdviceText {
  if (a.kind === 'match') return { kind: 'match', lead: t('gf.adv.match'), rest: '', move: null };
  const going = lookWord(a.going);
  const lead = a.readsAs ? t('gf.adv.reads', { style: lookWord(a.readsAs) }) : t('gf.adv.readsNone');
  const pulls = a.piece ? t(a.piece.plural ? 'gf.adv.pullsPlural' : 'gf.adv.pulls', { article: article(going), going, piece: a.piece.name }) : '';
  if (a.move && moveIsFix !== null) {
    return { kind: 'mismatch', lead, rest: [pulls, t('gf.adv.fixToward', { n: moveIsFix, style: going })].filter(Boolean).join(' '), move: null };
  }
  return { kind: 'mismatch', lead, rest: pulls, move: a.move ? { title: a.move.copy, detail: t('gf.adv.toward', { style: going }) } : null };
}
