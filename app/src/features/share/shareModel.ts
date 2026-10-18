// S12 · the share card's model (02 D20, DECISIONS-LOG #341; the demos: mockups/share-cards/). Pure: one read-only
// model from the stored rows; the screen draws it and captures it as an image. Nothing here writes.
//
// What a card may carry (#341's rules): the look first (his photo, neck down unless he picks "Full photo" for this
// share), the score lockup (number, /10, word, "Reads as …"), up to four pieces by kind and color (never a brand),
// and the sign-off (the woven label, "Score your fit · trykitted.com"). Never the occasion, a fix he hasn't made, the
// date or time, Kit's name, or another person. A before → after names only the fix the re-check caught.
//
// When it's offered: a scored full check at 7.0 or more, or a re-check that went up (its first check is the
// "before"). Partial checks get none in v1: a card has no room for "Partial check: shoes not included".
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { shownPhoto, type ShownPhoto } from '@/demo/demoPhotos';
import type { PhotoCrop } from '@/design-system/components/Chat';
import { displayScore, scoreWordLabel, spokenScore } from '@/design-system/score';
import { composeName } from '@/features/closet/itemName';
import { styleLabel } from '@/features/morning/copy';
import { t } from '@/i18n/en';

export type ShareFormat = 'story' | 'tiktok' | 'beforeAfter' | 'beat';
export type FaceChoice = 'neck' | 'full';

/** Drawn size (pt) and export size (px) per format: 9 : 16 at 1080 × 1920, the DM card 4 : 5 at 1080 × 1350. */
export const FORMAT_SIZE: Readonly<Record<ShareFormat, { w: number; h: number; px: { w: number; h: number } }>> = {
  story: { w: 360, h: 640, px: { w: 1080, h: 1920 } },
  tiktok: { w: 360, h: 640, px: { w: 1080, h: 1920 } },
  beforeAfter: { w: 360, h: 640, px: { w: 1080, h: 1920 } },
  beat: { w: 360, h: 450, px: { w: 1080, h: 1350 } },
};

/** Where each platform's own buttons and captions cover a 9 : 16 card (fractions of the card), #341 rule 5. Text
 *  stays out of these bands: Instagram Stories 14% top / 20% bottom; TikTok and Reels 14% / 30% and a 12% right rail. */
export const SAFE: Readonly<Record<'story' | 'tiktok', { top: number; bottom: number; right: number }>> = {
  story: { top: 0.14, bottom: 0.2, right: 0 },
  tiktok: { top: 0.14, bottom: 0.3, right: 0.12 },
};

/** Lowest score a single check is offered at (founder, Oct 18). */
export const SHARE_MIN_SCORE = 7;
/** Space under the lowest head (0–1000 of the photo's height), as the closet crops leave (cropSafety HEAD_PAD). */
const HEAD_PAD = 15;
const MAX_PIECES = 4;
const SLOT_ORDER: readonly string[] = ['outer', 'top', 'bottom', 'shoes'];

export interface SharePhoto {
  source: ShownPhoto['source'];
  /** width / height of the image; undefined for a stored photo we have no size for (it then fills the frame). */
  aspect: number | undefined;
  /** The neck-down crop, or null when no safe line below the face is known (the card then shows the pieces only). */
  neck: PhotoCrop | null;
}

export interface SharePiece {
  id: string;
  /** "Tan chinos": kind and color, no brand, no detail word. */
  name: string;
  item: ClosetItemRow;
}

export interface ShareModel {
  checkId: string;
  formats: ShareFormat[];
  score: number;
  scoreText: string;
  word: string;
  /** "Reads as minimal", or null when the look reads as none. */
  readsAs: string | null;
  pieces: SharePiece[];
  photo: SharePhoto | null;
  /** The re-check's first check, when this is a re-check that went up. */
  before: { score: number; scoreText: string; photo: SharePhoto | null; delta: string; fix: string | null } | null;
}

/** May this check offer a share card? (The card's Share button and the route both ask.) */
export function canShare(row: Pick<FitCheckRow, 'status' | 'score' | 'isPartial' | 'parentId' | 'details'>): boolean {
  if (row.status !== 'scored' || row.score === null || row.isPartial) return false;
  if (row.parentId) return (row.details.recheck?.delta ?? 0) > 0 || row.score >= SHARE_MIN_SCORE;
  return row.score >= SHARE_MIN_SCORE;
}

/** The neck-down crop of a stored (or demo) photo. A demo photo has its chin line. A kept photo uses the heads the
 *  phone measured on it (closetSummary.heads, #276): the crop starts just under the lowest one; [] = no head in it.
 *  Not measured: null (no safe line known). */
export function neckCrop(row: Pick<FitCheckRow, 'details'>, photo: ShownPhoto): PhotoCrop | null {
  if (photo.crop) return photo.crop;
  const heads = row.details.closetSummary?.heads;
  if (!heads) return null;
  const lowest = heads.reduce((m, h) => (h.length === 4 && typeof h[2] === 'number' ? Math.max(m, h[2]) : m), -1);
  const neck = lowest < 0 ? 0 : Math.min(1, (lowest + HEAD_PAD) / 1000);
  return neck >= 0.9 ? null : { neck, foot: 1, cx: 0.5 };
}

function sharePhoto(row: FitCheckRow, aspect: number | undefined): SharePhoto | null {
  const p = shownPhoto(row.demoPhotoId, row.photoFile, aspect);
  if (!p) return null;
  return { source: p.source, aspect: p.aspect, neck: neckCrop(row, p) };
}

/** A piece's name on a card: its kind and color, never a brand or a name he typed (it might hold one). */
export function shareName(item: ClosetItemRow): string {
  return composeName(item.garment, item.art ? { ...item.art, brand: null } : null, null);
}

function piecesOf(ids: readonly string[], closet: readonly ClosetItemRow[]): SharePiece[] {
  const byId = new Map(closet.map((c) => [c.id, c]));
  const out: SharePiece[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    let it = byId.get(id);
    for (let hops = 0; it?.mergedInto && hops < 8; hops++) it = byId.get(it.mergedInto);
    if (!it || it.isDeleted || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push({ id: it.id, name: shareName(it), item: it });
  }
  const rank = (p: SharePiece) => {
    const i = SLOT_ORDER.indexOf(p.item.slot);
    return i < 0 ? SLOT_ORDER.length : i;
  };
  return out.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_PIECES);
}

/** The share card's model, or null when this check can't be shared. `aspects`: the photo messages' image aspects. */
export function buildShare(
  row: FitCheckRow, parent: FitCheckRow | null, closet: readonly ClosetItemRow[], aspects: { row?: number; parent?: number } = {},
): ShareModel | null {
  if (!canShare(row)) return null;
  const score = row.score!;
  const up = !!row.parentId && !!parent && parent.status === 'scored' && parent.score !== null && (row.details.recheck?.delta ?? score - parent.score) > 0;
  const fix = up ? row.details.recheck?.doneFixes?.[0]?.copy ?? null : null;
  const before = up
    ? {
        score: parent!.score!,
        scoreText: displayScore(parent!.score!),
        photo: sharePhoto(parent!, aspects.parent),
        delta: `+${(score - parent!.score!).toFixed(1)}`,
        fix,
      }
    : null;
  const readsAs = row.details.readsAs ? t('readsAs.line', { style: styleLabel(row.details.readsAs).toLowerCase() }) : null;
  const formats: ShareFormat[] = [
    ...(score >= SHARE_MIN_SCORE ? (['story', 'tiktok'] as const) : []),
    ...(before ? (['beforeAfter'] as const) : []),
    ...(score >= SHARE_MIN_SCORE ? (['beat'] as const) : []),
  ];
  if (formats.length === 0) return null;
  return {
    checkId: row.id,
    formats,
    score,
    scoreText: displayScore(score),
    word: scoreWordLabel(score),
    readsAs,
    pieces: piecesOf(row.itemIds.length > 0 ? row.itemIds : parent?.itemIds ?? [], closet),
    photo: sharePhoto(row, aspects.row),
    before,
  };
}

/** The photo a card draws for his face choice: neck down needs a safe line; "Full photo" is the whole picture. null:
 *  no photo on this card (none kept, or neck down with no safe line: the card shows the pieces instead). */
export function photoFor(p: SharePhoto | null, face: FaceChoice): { source: SharePhoto['source']; aspect: number | undefined; crop: PhotoCrop | undefined } | null {
  if (!p) return null;
  if (face === 'full') return { source: p.source, aspect: p.aspect, crop: undefined };
  // The crop needs the image's aspect to place it; without one the photo would fill the frame from the top (face in).
  return p.neck && p.aspect ? { source: p.source, aspect: p.aspect, crop: p.neck } : null;
}

/** VoiceOver for the preview image: "Share card: 8 out of 10, Sharp, reads as minimal." */
export function shareA11y(m: ShareModel, format: ShareFormat): string {
  const base = format === 'beforeAfter' && m.before
    ? t('share.a11y.cardBeforeAfter', { before: spokenScore(m.before.score), after: spokenScore(m.score), word: m.word })
    : format === 'beat'
      ? t('share.a11y.cardBeat', { score: spokenScore(m.score), word: m.word })
      : t('share.a11y.card', { score: spokenScore(m.score), word: m.word });
  return m.readsAs ? `${base} ${m.readsAs}.` : base;
}
