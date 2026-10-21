// The one attachment under an answer (07 §1, §5.2; checks R4, R5, R8): built by code from the handles the model
// named, never from its text. Each kind is checked against his real data; anything that doesn't check out drops
// the card and keeps the answer. Cards are stored by id (not by the per-question handles), so Past chats can draw
// them again later; a piece removed since then shows "No longer in your closet".
import { outfitKey, outfitValid, type ClosetItem, type Styles } from '@kitted/core';
import { OCCASIONS, type ClosetItemRow, type FitCheckRow, type OccasionKey } from '@/data/types';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { starterGain } from '@/features/finish/gains';
import { ownership, STARTER } from '@/features/finish/starter';
import { t } from '@/i18n/en';
import { oneLine } from './context';
import { checkSentence, type GateContext } from './gate';

export type AskCard =
  | { type: 'outfit'; itemIds: string[]; occasion: OccasionKey }
  | { type: 'check'; occasion: OccasionKey }
  /** `options` ends with "Not sure" (added by code). */
  | { type: 'ask'; question: string; options: string[] }
  /** A Starter row; `gain` from rotation, null when it can't be counted. */
  | { type: 'buy'; starterId: string; gain: number | null }
  | { type: 'link'; checkId: string }
  | { type: 'link'; itemId: string }
  /** "That score is wrong" about today's check (09 §20.8 G19): opens its Not quite right?. Built by code from the route
   *  (prepare.ts), never from the model's block. */
  | { type: 'correct'; checkId: string };

export interface CardInput {
  handles: Readonly<Record<string, string>>;
  closet: readonly ClosetItemRow[];
  checks: readonly FitCheckRow[];
  styles: Styles | null;
  starterMarks: readonly string[];
  /** The ask card's words pass the same sentence gate as the answer. */
  gate: GateContext;
}

const MAX_OPTIONS = 4;

const occasionOr = (v: unknown, fallback: OccasionKey | null): OccasionKey | null =>
  v === undefined || v === null ? fallback : typeof v === 'string' && (OCCASIONS as readonly string[]).includes(v) ? (v as OccasionKey) : null;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The Starter row a buy card's "kind" (and shade) names: its words all in the row's piece, e.g. "loafers" → s10. */
export function starterFor(kind: string, shade: string | null): (typeof STARTER)[number] | null {
  const words = norm(kind).split(' ').filter((w) => w.length > 2).map((w) => w.replace(/s$/, ''));
  if (words.length === 0) return null;
  const rows = STARTER.filter((e) => e.pick).map((e) => ({ e, text: norm(`${e.pick!.phrase} ${e.pick!.name} ${e.name}`) }));
  const hits = rows.filter((r) => words.every((w) => r.text.includes(w)));
  if (hits.length <= 1) return hits[0]?.e ?? null;
  const sh = shade ? norm(shade) : '';
  return hits.find((r) => sh && r.text.includes(sh))?.e ?? hits[0]!.e;
}

/** The model's card, checked (R4). Null drops it. */
export function buildCard(raw: unknown, input: CardInput): AskCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const owned = input.closet.filter(isOwned);
  const usable = owned.filter((c) => !isAwaitingAnswer(c, owned));
  const piece = (h: unknown) => (typeof h === 'string' && /^P\d+$/.test(h) ? usable.find((c) => c.id === input.handles[h]) : undefined);
  switch (o.type) {
    case 'outfit': {
      if (!Array.isArray(o.pieces) || o.pieces.length < 3 || o.pieces.length > 5) return null;
      const items = o.pieces.map(piece);
      if (items.some((x) => !x) || new Set(items.map((x) => x!.id)).size !== items.length) return null;
      const list = items as ClosetItemRow[];
      if (!outfitKey(list as unknown as ClosetItem[]) || !outfitValid(list as unknown as ClosetItem[], input.styles)) return null;
      const occasion = occasionOr(o.occasion, 'everyday');
      return occasion ? { type: 'outfit', itemIds: list.map((x) => x.id), occasion } : null;
    }
    case 'check': {
      const occasion = occasionOr(o.occasion, 'everyday');
      return occasion ? { type: 'check', occasion } : null;
    }
    case 'ask': {
      const question = typeof o.question === 'string' ? oneLine(o.question, 120) : '';
      if (!question || !Array.isArray(o.options)) return null;
      const notSure = t('gf.notSure');
      const opts = o.options.filter((x): x is string => typeof x === 'string').map((x) => oneLine(x, 40)).filter(Boolean)
        .filter((x) => norm(x) !== norm(notSure));
      if (opts.length < 2 || opts.length > MAX_OPTIONS || new Set(opts.map(norm)).size !== opts.length) return null;
      if ([question, ...opts].some((x) => checkSentence(x, input.gate))) return null;
      return { type: 'ask', question, options: [...opts, notSure] };
    }
    case 'buy': {
      const kind = typeof o.kind === 'string' ? o.kind : '';
      const row = starterFor(kind, typeof o.shade === 'string' ? o.shade : null);
      if (!row || !row.pick || !row.slot) return null;
      if (ownership(input.closet, input.starterMarks)[row.id]?.owned) return null;
      // "+N" is the Closet's count (#309), never the model's; pieces he only mentioned in chat aren't counted.
      const gain = starterGain(input.closet, input.styles, row);
      return { type: 'buy', starterId: row.id, gain };
    }
    case 'link': {
      const to = typeof o.to === 'string' ? o.to : '';
      const m = /^(check|piece):((?:FC|P)\d+)$/.exec(to);
      if (!m) return null;
      if (m[1] === 'check' && m[2]!.startsWith('FC')) {
        const id = input.handles[m[2]!];
        return id && input.checks.some((c) => c.id === id && c.status === 'scored') ? { type: 'link', checkId: id } : null;
      }
      if (m[1] === 'piece' && m[2]!.startsWith('P')) {
        const it = piece(m[2]);
        return it ? { type: 'link', itemId: it.id } : null;
      }
      return null;
    }
    default:
      return null;
  }
}

/** A stored card as read back from a chat row (Past chats, R8); null when it's not one. */
export function storedCard(v: unknown): AskCard | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (o.type === 'outfit' && Array.isArray(o.itemIds) && o.itemIds.every((x) => typeof x === 'string') && typeof o.occasion === 'string') return o as unknown as AskCard;
  if (o.type === 'check' && typeof o.occasion === 'string') return o as unknown as AskCard;
  if (o.type === 'ask' && typeof o.question === 'string' && Array.isArray(o.options)) return o as unknown as AskCard;
  if (o.type === 'buy' && typeof o.starterId === 'string') return o as unknown as AskCard;
  if (o.type === 'link' && (typeof o.checkId === 'string' || typeof o.itemId === 'string')) return o as unknown as AskCard;
  if (o.type === 'correct' && typeof o.checkId === 'string') return o as unknown as AskCard;
  return null;
}

/** An outfit card's pieces now: the ones still in his closet, and whether any left since (R8). */
export function outfitNow(card: Extract<AskCard, { type: 'outfit' }>, closet: readonly ClosetItemRow[]): { items: ClosetItemRow[]; gone: boolean } {
  const items = card.itemIds.map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c && isOwned(c));
  return { items, gone: items.length < card.itemIds.length };
}

// ---------------------------------------------------------------- what a card says and shows (07 §14 P1, P2, P4)
export interface CardWords {
  /** Piece names by id (his closet now). */
  nameOf: (itemId: string) => string | null;
  /** A check's link words ("Today's check"), or null when it's gone. */
  checkLabel?: (checkId: string) => string | null;
}

const low = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** One VoiceOver line for a card (P1), also read after the answer when it's complete (P2). Null: nothing to say. */
export function cardSpoken(card: AskCard | null, w: CardWords): string | null {
  if (!card) return null;
  switch (card.type) {
    case 'outfit': {
      const names = card.itemIds.map(w.nameOf).filter((x): x is string => !!x).map(low);
      return names.length ? t('ask.card.a11y.outfit', { names: names.join(', ') }) : t('ask.card.gone');
    }
    case 'check':
      return t('ask.card.startCheck');
    case 'ask':
      return `${card.question} ${card.options.join(', ')}.`;
    case 'buy': {
      const row = STARTER.find((e) => e.id === card.starterId);
      if (!row) return null;
      const gain = card.gain === null || card.gain <= 0 ? null : card.gain === 1 ? t('ask.card.buy.gainOne') : t('ask.card.buy.gain', { n: card.gain });
      return [t('ask.card.buy.tag'), row.pick?.name ?? row.name, gain, row.budget].filter(Boolean).join('. ') + '.';
    }
    case 'link': {
      if ('itemId' in card) {
        const n = w.nameOf(card.itemId);
        return n ? t('ask.card.link.piece', { item: low(n) }) : t('ask.card.gone');
      }
      return w.checkLabel?.(card.checkId) ?? t('ask.card.gone');
    }
    case 'correct':
      return t('card.nqr');
  }
}

/**
 * The card a "that score is wrong" question gets (G19): today's scored check the router named opens its Not quite
 * right?. An earlier day's check is read-only (#276), and a check that isn't scored has nothing to correct: no card.
 */
export function correctCard(route: { kind: string; check: string | null }, handles: Readonly<Record<string, string>>, checks: readonly FitCheckRow[], today: string): AskCard | null {
  if (route.kind !== 'feedback' || !route.check) return null;
  const id = handles[route.check];
  const c = id ? checks.find((x) => x.id === id) : undefined;
  return c && c.status === 'scored' && c.score !== null && c.dayKey === today ? { type: 'correct', checkId: c.id } : null;
}

/** Which controls a card shows (P4): Past chats show the card and his pick, never a button that changes anything. */
export function cardControls(card: AskCard, o: { readOnly: boolean; tapped: string | null; gone?: boolean }) {
  return {
    wear: card.type === 'outfit' && !o.readOnly && !o.gone,
    checkIt: (card.type === 'outfit' && !o.readOnly && !o.gone) || (card.type === 'check' && !o.readOnly),
    /** Not quite right? (G19): today's chat only; Past chats are read-only. */
    correct: card.type === 'correct' && !o.readOnly,
    /** The ask card's answers: tappable until one is picked, never in Past chats. */
    answers: card.type === 'ask' ? card.options.map((option) => ({ option, picked: o.tapped === option, tappable: !o.readOnly && o.tapped === null })) : [],
  };
}

/** The saved line's Undo shows only in today's chat (P4). */
export const savedUndoShows = (readOnly: boolean): boolean => !readOnly;

/**
 * The piece a link card opens, as it stands now: a piece merged into another opens the one it lives on in, a removed
 * one opens nothing ("No longer in your closet"). It checked only removal and opened a merged-away page (07 §17, U9).
 */
export function linkedPiece(id: string, closet: readonly ClosetItemRow[]): ClosetItemRow | null {
  let it = closet.find((c) => c.id === id) ?? null;
  for (let hops = 0; it && it.mergedInto && hops < 5; hops++) {
    const into: string = it.mergedInto;
    it = closet.find((c) => c.id === into) ?? null;
  }
  return it && isOwned(it) ? it : null;
}
