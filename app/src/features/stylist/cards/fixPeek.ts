// The piece peek (09-ui-review §28.3, #371; the founder's pick, Oct 23): a tap on a fix row that names a closet piece
// floats a small card over the row with that piece. These are the pure parts: which piece, where the card goes, what
// it says, and the VoiceOver actions on the fit-check card.
import type { ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';

/** The closet piece a fix row names ("Swap to your cream chunky sneakers"): the live one, following a merge to the
 *  piece it lives in now. Null for a generic fix ("free if you own one"), a free move, or a removed piece. */
export function fixPiece(fix: { itemId?: string | null }, closet: readonly ClosetItemRow[]): ClosetItemRow | null {
  let id = fix.itemId ?? null;
  for (let hop = 0; id && hop < 8; hop++) {
    const it = closet.find((c) => c.id === id);
    if (!it) return null;
    if (it.mergedInto) { id = it.mergedInto; continue; }
    return it.isDeleted ? null : it;
  }
  return null;
}

export interface Rect { x: number; y: number; w: number; h: number }
export interface PeekFrame { x: number; y: number; w: number; above: boolean }

export const PEEK_GUTTER = 16;
export const PEEK_MAX_W = 280;
/** The gap between the row and the peek, room for its pointer. */
export const PEEK_GAP = 8;

/** Where the peek goes: above the row when it fits under the top inset, else below; centered on the row, inside the
 *  screen's 16 pt gutters. */
export function peekFrame(row: Rect, peekH: number, win: { width: number; height: number }, insets: { top: number; bottom: number }): PeekFrame {
  const w = Math.min(PEEK_MAX_W, win.width - PEEK_GUTTER * 2);
  const x = Math.min(Math.max(PEEK_GUTTER, row.x + row.w / 2 - w / 2), win.width - PEEK_GUTTER - w);
  const aboveY = row.y - PEEK_GAP - peekH;
  if (aboveY >= insets.top + PEEK_GUTTER) return { x, y: aboveY, w, above: true };
  const belowY = row.y + row.h + PEEK_GAP;
  return { x, y: Math.min(belowY, Math.max(insets.top + PEEK_GUTTER, win.height - insets.bottom - PEEK_GUTTER - peekH)), w, above: false };
}

/** The peek's words: the name, "Worn 4 times" (none before he's worn it), "Open piece". */
export function peekLines(item: Pick<ClosetItemRow, 'name' | 'wornCount'>): { name: string; worn: string | null; open: string } {
  return {
    name: item.name,
    worn: item.wornCount > 0 ? `${t('item.worn')} ${t('item.wornCount', { n: item.wornCount })}` : null,
    open: t('fix.peek.open'),
  };
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** VoiceOver on a card (one element): "Show your cream chunky sneakers" for each fix with a closet piece, once each. */
export function peekActions(fixes: readonly { itemId?: string | null }[], closet: readonly ClosetItemRow[]): { name: string; label: string; item: ClosetItemRow }[] {
  const out: { name: string; label: string; item: ClosetItemRow }[] = [];
  for (const f of fixes) {
    const it = fixPiece(f, closet);
    if (!it || out.some((o) => o.item.id === it.id)) continue;
    out.push({ name: `peek:${it.id}`, label: t('fix.peek.a11y', { item: lowerFirst(it.name) }), item: it });
  }
  return out;
}
