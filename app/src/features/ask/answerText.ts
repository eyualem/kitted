// How an answer is laid out (07 §15.4, look C, founder Oct 16): the move on its own line, the reason under it, and his
// pieces as chips. All of it is decided here, by code, from the answer's plain text: the model never sends markup.
//   splitLead     the first sentence is the lead; a first sentence of 1–3 words ("Got it.", "Yes.") takes the next one
//                 with it, so the lead is never a lone word (L1).
//   pieceSegments his owned pieces' exact names, longest first, whole words, each piece once, at most 3 chips (L2).
import type { ClosetItemRow } from '@/data/types';
import { isOwned } from '@/features/closet/profile';
import { t } from '@/i18n/en';
import { sentences } from './gate';

export interface AnswerParts {
  lead: string;
  rest: string;
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function splitLead(text: string): AnswerParts {
  const ss = sentences(text.trim());
  if (ss.length === 0) return { lead: '', rest: '' };
  const take = ss.length > 1 && words(ss[0]!) <= 3 ? 2 : 1;
  return { lead: ss.slice(0, take).join(' '), rest: ss.slice(take).join(' ') };
}

export interface ChipPiece {
  id: string;
  name: string;
  hex: string;
}

export type Segment = { text: string; piece?: undefined } | { text: string; piece: ChipPiece };

/** The pieces a chip may name: owned, not removed or merged. */
export function chipPieces(closet: readonly ClosetItemRow[]): ChipPiece[] {
  return closet.filter((c) => isOwned(c) && !c.isDeleted && !c.mergedInto && c.name.trim()).map((c) => ({ id: c.id, name: c.name.trim(), hex: c.hex }));
}

export const MAX_CHIPS = 3;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The text cut around his pieces' names: "…the dark straight jeans…" → [text, chip, text]. */
export function pieceSegments(text: string, pieces: readonly ChipPiece[], max = MAX_CHIPS): Segment[] {
  if (!text) return [];
  // Longest name first, so "dark straight jeans" wins over "jeans"; two pieces with one name are both skipped (which
  // one he means is a guess).
  const byName = new Map<string, ChipPiece | null>();
  for (const p of pieces) {
    const k = p.name.toLowerCase();
    byName.set(k, byName.has(k) ? null : p);
  }
  const names = [...byName.entries()].filter((e): e is [string, ChipPiece] => e[1] !== null).sort((a, b) => b[0].length - a[0].length);
  type Hit = { at: number; end: number; piece: ChipPiece };
  const hits: Hit[] = [];
  const used = new Set<string>();
  for (const [name, piece] of names) {
    // ASCII word edges (Hermes and unicode property escapes aren't worth the risk; piece names are English).
    const re = new RegExp(`(^|[^A-Za-z0-9'’-])(${escape(name)})(?![A-Za-z0-9'’-])`, 'i');
    const m = re.exec(text);
    if (!m) continue;
    const at = m.index + m[1]!.length;
    const end = at + m[2]!.length;
    if (hits.some((h) => at < h.end && end > h.at)) continue;
    if (used.has(piece.id)) continue;
    hits.push({ at, end, piece });
    used.add(piece.id);
  }
  const chosen = hits.sort((a, b) => a.at - b.at).slice(0, max);
  const out: Segment[] = [];
  let i = 0;
  for (const h of chosen) {
    if (h.at > i) out.push({ text: text.slice(i, h.at) });
    out.push({ text: text.slice(h.at, h.end), piece: h.piece });
    i = h.end;
  }
  if (i < text.length) out.push({ text: text.slice(i) });
  return out;
}

export interface AnswerLayout {
  lead: string;
  rest: Segment[];
  chips: ChipPiece[];
}

/** An answer's look: the lead, then the reason cut around his pieces (chips only in the reason; the lead stays plain). */
export function answerLayout(text: string, closet: readonly ClosetItemRow[] | null): AnswerLayout {
  const { lead, rest } = splitLead(text);
  const segs = pieceSegments(rest, closet ? chipPieces(closet) : []);
  return { lead, rest: segs, chips: segs.flatMap((s) => (s.piece ? [s.piece] : [])) };
}

/** VoiceOver's name for a chip's action: "Open white sneakers". */
export const chipLabel = (p: ChipPiece): string => t('a11y.openPiece', { name: p.name.toLowerCase() });
