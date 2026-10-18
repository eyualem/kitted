// S12 · the share card's model (02 D20, DECISIONS-LOG #346). Pure: one read-only model from the stored rows; the
// screen draws it and captures it as an image. Nothing here writes.
//
// One design in three versions, after Strava's share stickers (founder, Oct 18): white stats (a small label over a big
// value), the tape with a copper dot on the score, and the KITTED wordmark. "Transparent" is that overlay alone, a PNG
// he lays on his own photo or video; "Solid" is the same overlay on the indigo ground; "With photo" is the same overlay
// on his fit photo (neck down unless he picks "Full photo" for this share). A single check shows Score and Rating; a re-check that went up shows Before, After and
// Change. Never the occasion, a fix, the date, Kit's name, or another person.
//
// When it's offered: a scored full check at 7.0 or more, or a re-check that went up (its first check is the
// "before"). Partial checks get none in v1.
import type { FitCheckRow } from '@/data/types';
import { shownPhoto, type ShownPhoto } from '@/demo/demoPhotos';
import type { PhotoCrop } from '@/design-system/components/Chat';
import { displayScore, scoreWordLabel, spokenScore } from '@/design-system/score';
import { t } from '@/i18n/en';

export type ShareFormat = 'sticker' | 'solid' | 'photo';
export type FaceChoice = 'neck' | 'full';

/** Drawn size (pt) and export size (px, 3×): the sticker 1080 × 600 with a transparent background, the solid card the
 *  same size on indigo; the photo card 9 : 16 at 1080 × 1920 (Instagram and Snapchat Stories, TikTok photo mode). */
export const FORMAT_SIZE: Readonly<Record<ShareFormat, { w: number; h: number; px: { w: number; h: number } }>> = {
  sticker: { w: 360, h: 200, px: { w: 1080, h: 600 } },
  solid: { w: 360, h: 200, px: { w: 1080, h: 600 } },
  photo: { w: 360, h: 640, px: { w: 1080, h: 1920 } },
};

/** On the photo card the overlay's bottom edge sits this far up (pt of 640): just above Instagram's bottom 20%. */
export const PHOTO_OVERLAY_BOTTOM = 132;

/** Lowest score a single check is offered at (founder, Oct 18). */
export const SHARE_MIN_SCORE = 7;
/** Space under the lowest head (0–1000 of the photo's height), as the closet crops leave (cropSafety HEAD_PAD). */
const HEAD_PAD = 15;

export interface SharePhoto {
  source: ShownPhoto['source'];
  /** width / height of the image; undefined for a stored photo we have no size for. */
  aspect: number | undefined;
  /** The neck-down crop, or null when no safe line below the face is known. */
  neck: PhotoCrop | null;
}

export interface ShareStat {
  label: string;
  value: string;
  /** "/10" after the score on a single check. */
  unit?: string;
}

export interface ShareModel {
  checkId: string;
  score: number;
  scoreText: string;
  word: string;
  photo: SharePhoto | null;
  /** The re-check's first check, when this is a re-check that went up. */
  before: { score: number; scoreText: string; delta: string } | null;
  stats: ShareStat[];
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

/** The share card's model, or null when this check can't be shared. `aspect`: the photo message's image aspect. */
export function buildShare(row: FitCheckRow, parent: FitCheckRow | null, aspect?: number): ShareModel | null {
  if (!canShare(row)) return null;
  const score = row.score!;
  const up = !!row.parentId && !!parent && parent.status === 'scored' && parent.score !== null && score > parent.score;
  if (!up && score < SHARE_MIN_SCORE) return null;
  const before = up ? { score: parent!.score!, scoreText: displayScore(parent!.score!), delta: `+${(score - parent!.score!).toFixed(1)}` } : null;
  const scoreText = displayScore(score);
  const word = scoreWordLabel(score);
  const stats: ShareStat[] = before
    ? [
        { label: t('share.stat.before'), value: before.scoreText },
        { label: t('share.stat.after'), value: scoreText },
        { label: t('share.stat.change'), value: before.delta },
      ]
    : [
        { label: t('share.stat.score'), value: scoreText, unit: '/10' },
        { label: t('share.stat.rating'), value: word },
      ];
  return { checkId: row.id, score, scoreText, word, photo: sharePhoto(row, aspect), before, stats };
}

/** The photo the photo card draws for his face choice: neck down needs a safe line and the image's size; "Full photo"
 *  is the whole picture. null: no photo (none kept, or no safe neck-down line): the card is the overlay on night. */
export function photoFor(p: SharePhoto | null, face: FaceChoice): { source: SharePhoto['source']; aspect: number | undefined; crop: PhotoCrop | undefined } | null {
  if (!p) return null;
  if (face === 'full') return { source: p.source, aspect: p.aspect, crop: undefined };
  // The crop needs the image's aspect to place it; without one the photo would fill the frame from the top (face in).
  return p.neck && p.aspect ? { source: p.source, aspect: p.aspect, crop: p.neck } : null;
}

/** VoiceOver for the preview image: "Share card: 8 out of 10, Sharp." / "Share card: 7.5 to 8.5 out of 10, Sharp." */
export function shareA11y(m: ShareModel, format: ShareFormat): string {
  const base = m.before
    ? t('share.a11y.cardWin', { before: spokenScore(m.before.score), after: spokenScore(m.score), word: m.word })
    : t('share.a11y.card', { score: spokenScore(m.score), word: m.word });
  return format === 'sticker' ? `${base} ${t('share.a11y.transparent')}` : base;
}
