// The one attachment under an answer (07 §1, §5.2; checks R4, R5, R8): built by code from the handles the model
// named, never from its text. Each kind is checked against his real data; anything that doesn't check out drops
// the card and keeps the answer. Cards are stored by id (not by the per-question handles), so Past chats can draw
// them again later; a piece removed since then shows "No longer in your closet".
import { outfitKey, outfitValid, type ClosetItem, type Styles } from '@kitted/core';
import { OCCASIONS, type ClosetItemRow, type FitCheckRow, type OccasionKey } from '@/data/types';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { fitsGain, ownership, STARTER } from '@/features/finish/starter';
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
  | { type: 'link'; itemId: string };

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
      // "+N" is the rotation's, counting only pieces he's photographed or added (not ones he only mentioned in chat).
      const gain = fitsGain(input.closet.filter((c) => c.source !== 'chat'), input.styles, row.pick.garment, row.slot);
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
  return null;
}

/** An outfit card's pieces now: the ones still in his closet, and whether any left since (R8). */
export function outfitNow(card: Extract<AskCard, { type: 'outfit' }>, closet: readonly ClosetItemRow[]): { items: ClosetItemRow[]; gone: boolean } {
  const items = card.itemIds.map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c && isOwned(c));
  return { items, gone: items.length < card.itemIds.length };
}
