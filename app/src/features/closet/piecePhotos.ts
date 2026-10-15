// His photos of one closet piece (the piece page, the long-press preview; #276): his real photo with the piece
// outlined, never the cut-out alone (cut-outs stay on disk for matching and measured color only). Best first (the
// closet question's order, rankedSightings), his chosen cover leading; photos he removed from the piece are gone;
// the same photo re-checked shows once; a mostly hidden sighting (a shirt under a jacket) folds into "N more, partly
// hidden". Every crop starts below his head and a mirror selfie reads true-view (cropSafety). Pure.
import type { ClosetItemRow, ClosetObservationRow, FitCheckRow } from '@/data/types';
import { cropTop, demoHeads, storedHeads, type HeadBox } from './cropSafety';
import { LOW_CROP, isLive, profileOfItem } from './profile';

/** Kept photos are 3:4 portrait (12 MP, #83). */
export const KEPT_ASPECT = 0.75;

/** What a check gives its sightings' crops. */
export interface PhotoCheck {
  id: string;
  photoFile: string | null;
  demoPhotoId: string | null;
  imageHash: string;
  createdAt: number;
  /** The heads found on the kept photo (closetSummary.heads); null = not known. */
  heads: HeadBox[] | null;
  /** The reading says it's a mirror selfie. */
  mirrored: boolean;
}

export interface PhotoDeps {
  /** A stored path (relative to Documents) → a file:// URL, or null. */
  resolve: (stored: string) => string | null;
  /** Whether a file:// URL is still on the phone (a kept photo can be gone). */
  exists: (uri: string) => boolean;
  /** A bundled demo photo: its image module, aspect and chin line. Absent: demo photos aren't shown. */
  demo?: (id: string) => { source: number; aspect: number; neck: number } | undefined;
}

export interface PiecePhoto {
  obsId: string;
  checkId: string;
  /** expo-image source: a file:// URL, or a bundled module. */
  source: number | string;
  /** The file:// URL (the native preview needs one); null for a bundled photo. */
  uri: string | null;
  aspect: number;
  /** The closet call's box, [ymin, xmin, ymax, xmax] 0–1000. */
  box: number[];
  /** The first row the crop may show (below his head), 0–1000. */
  top: number;
  mirrored: boolean;
  /** Mostly hidden or tiny in its photo (measured crop quality under LOW_CROP): folded away. */
  partlyHidden: boolean;
  /** The one shown first: his pick, else the best. */
  cover: boolean;
  imageHash: string;
  createdAt: number;
}

const boxOf = (o: ClosetObservationRow): number[] | null => (o.closet?.visible && o.closet.box.length === 4 ? o.closet.box : null);
const area = (b: readonly number[]) => (b[2]! - b[0]!) * (b[3]! - b[1]!);

/**
 * A piece's live sightings with a photo and a box, best first: the cleanest crop measured, else the biggest box. Only
 * pieces worn in a check's own photo: a shoe snap's sighting carries its parent check's id, not its own photo.
 */
export function rankedSightings(itemId: string, obs: readonly ClosetObservationRow[]): ClosetObservationRow[] {
  const mine = obs.filter((o) => o.itemId === itemId && isLive(o) && o.fitCheckId && o.origin === 'garment' && boxOf(o));
  return mine.sort((a, b) => (b.cropQuality ?? -1) - (a.cropQuality ?? -1) || area(boxOf(b)!) - area(boxOf(a)!) || (a.id < b.id ? -1 : 1));
}

/** One sighting's photo crop, or null (no photo on the phone, no box, or no crop that stays below his head). */
export function photoOfSighting(o: ClosetObservationRow, check: PhotoCheck | undefined, deps: PhotoDeps): Omit<PiecePhoto, 'cover'> | null {
  const box = boxOf(o);
  if (!box || !check) return null;
  let source: number | string, uri: string | null, aspect: number, heads: HeadBox[] | null;
  if (check.demoPhotoId) {
    const d = deps.demo?.(check.demoPhotoId);
    if (!d) return null;
    source = d.source;
    uri = null;
    aspect = d.aspect;
    heads = demoHeads(d.neck);
  } else {
    const u = check.photoFile ? deps.resolve(check.photoFile) : null;
    if (!u || !deps.exists(u)) return null;
    source = u;
    uri = u;
    aspect = KEPT_ASPECT;
    heads = check.heads;
  }
  const top = cropTop(box, typeof o.garment.category === 'string' ? o.garment.category : null, heads);
  if (top === null) return null;
  const partlyHidden = o.garment.category !== 'footwear' && typeof o.cropQuality === 'number' && o.cropQuality < LOW_CROP;
  return {
    obsId: o.id, checkId: check.id, source, uri, aspect, box: [...box], top, mirrored: check.mirrored, partlyHidden, imageHash: check.imageHash, createdAt: o.createdAt,
  };
}

/** The photo hashes he removed from a piece (removing one removes the same photo re-checked too). */
function hiddenHashes(hidden: readonly string[], obs: readonly ClosetObservationRow[], checks: ReadonlyMap<string, PhotoCheck>): Set<string> {
  const out = new Set<string>();
  for (const id of hidden) {
    const o = obs.find((x) => x.id === id);
    const c = o?.fitCheckId ? checks.get(o.fitCheckId) : undefined;
    if (c) out.add(c.imageHash);
  }
  return out;
}

/** His photos of a piece: `shown` (cover first) and `folded` (partly hidden), each photo once. */
export function piecePhotos(
  item: Pick<ClosetItemRow, 'id' | 'profile'>, obs: readonly ClosetObservationRow[], checks: ReadonlyMap<string, PhotoCheck>, deps: PhotoDeps,
): { shown: PiecePhoto[]; folded: PiecePhoto[] } {
  const p = profileOfItem(item);
  const hidden = new Set(p.hiddenObsIds ?? []);
  const gone = hiddenHashes([...hidden], obs, checks);
  const seen = new Set<string>();
  const all: Omit<PiecePhoto, 'cover'>[] = [];
  for (const o of rankedSightings(item.id, obs)) {
    if (hidden.has(o.id)) continue;
    const ph = photoOfSighting(o, o.fitCheckId ? checks.get(o.fitCheckId) : undefined, deps);
    if (!ph || gone.has(ph.imageHash) || seen.has(ph.imageHash)) continue;
    seen.add(ph.imageHash);
    all.push(ph);
  }
  // His cover, or the same photo of it re-checked (shown once, under the first sighting kept).
  const coverObs = p.coverObsId ? obs.find((o) => o.id === p.coverObsId && o.itemId === item.id) : undefined;
  const coverHash = coverObs?.fitCheckId ? checks.get(coverObs.fitCheckId)?.imageHash : undefined;
  const coverAt = coverObs ? all.findIndex((x) => x.obsId === coverObs.id || (!!coverHash && x.imageHash === coverHash)) : -1;
  if (coverAt > 0) all.unshift(...all.splice(coverAt, 1));
  const picked = coverAt >= 0;
  const shown = all.filter((x, i) => !x.partlyHidden || (picked && i === 0));
  const folded = all.filter((x) => !shown.includes(x));
  return { shown: shown.map((x, i) => ({ ...x, cover: i === 0 })), folded: folded.map((x) => ({ ...x, cover: false })) };
}

/** A check as the crops need it: its heads (closetSummary.heads) and whether its reading is a mirror selfie. */
export function photoCheckOf(
  row: Pick<FitCheckRow, 'id' | 'photoFile' | 'demoPhotoId' | 'imageHash' | 'createdAt' | 'details'>, mirrored: boolean,
): PhotoCheck {
  return {
    id: row.id, photoFile: row.photoFile, demoPhotoId: row.demoPhotoId, imageHash: row.imageHash, createdAt: row.createdAt,
    heads: storedHeads(row.details?.closetSummary?.heads), mirrored,
  };
}
