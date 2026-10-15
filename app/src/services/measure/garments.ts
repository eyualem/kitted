// On-device measuring after the closet call (DECISIONS-LOG #104): the AI names each piece and draws its box; the
// phone measures. For every piece with a box, kitted-vision finds his pixels (person mask, the smallest box where
// boxes overlap, heads removed), measures the dominant color, and writes a display cut-out and an image feature
// print under Documents/closet. Nothing here is sent anywhere, and nothing changes a score: the values only feed
// the closet (sampled_hex / sampled_l on the sighting, which the identity engine already reads; crop_file and
// crop_quality for tiles). Only real photos on a native build with #104; demo photos and the web get nothing.
import { Paths } from 'expo-file-system';
import { measureGarments, type MeasuredGarment, type MeasureInput } from '../../../modules/kitted-vision';
import { resolveStoredPath, toStoredPath } from '../photoFiles';

/** What a sighting keeps from the measurement. Paths are stored relative to Documents (#56). The feature print
 *  sits next to the cut-out with the same name and `.print` (printFileOf). */
export interface Measured {
  sampledHex: string | null;
  sampledL: number | null;
  cropFile: string | null;
  cropQuality: number | null;
}

/** The stored print next to a stored cut-out ("closet/<sha>-garment-2.png" → "….print"). */
export function printFileOf(cropFile: string | null | undefined): string | null {
  return cropFile && cropFile.endsWith('.png') ? `${cropFile.slice(0, -4)}.print` : null;
}

export interface MeasurePiece {
  /** The sighting's key in the check: origin + index ("garment-2"). Also the file name's suffix. */
  key: string;
  category: string;
  /** The closet call's box, [ymin, xmin, ymax, xmax] 0–1000. */
  box: readonly number[];
}

/** Each piece's values by key; `heads`: every head the phone found on the kept photo ([ymin, xmin, ymax, xmax]
 *  0–1000; [] = none), so crops of his photo stay below the neck (#276). Absent: an older native build. */
export type MeasuredPieces = Map<string, Measured> & { heads?: number[][] | null };

/** Measures a check's pieces. Resolves to an empty map whenever it can't run; never throws. */
export type GarmentMeasurer = (
  check: { imageHash: string; photoFile: string | null; demoPhotoId: string | null; mirrored?: boolean },
  pieces: readonly MeasurePiece[],
) => Promise<MeasuredPieces>;

/** The measurer's head boxes, checked (4 numbers each, clamped to 0–1000); null when absent or malformed. */
export function headsOf(raw: unknown): number[][] | null {
  if (!Array.isArray(raw)) return null;
  const out: number[][] = [];
  for (const h of raw) {
    if (!Array.isArray(h) || h.length !== 4 || !h.every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
    out.push(h.map((v: number) => Math.min(1000, Math.max(0, Math.round(v)))));
  }
  return out;
}

/** Fewer of his pixels than this (at 1024 px) and the color isn't trusted. */
export const MIN_COLOR_PX = 400;

/**
 * A provisional 0–1 crop score from the measured numbers (the Closet session decides crop vs drawing and may
 * retune this): enough of his pixels (8,000 at 1024 px = full), not mostly under an outer layer, not mostly
 * inside a head/hand region.
 */
export function cropQuality(m: Pick<MeasuredGarment, 'ownedPx' | 'overlapOuter' | 'headOverlap'>): number {
  const size = Math.min(1, m.ownedPx / 8000);
  const q = size * (1 - 0.6 * Math.min(1, m.overlapOuter)) * (1 - Math.min(1, m.headOverlap));
  return Math.round(q * 100) / 100;
}

/** The sighting's values from one measured garment. */
export function measuredOf(m: MeasuredGarment): Measured {
  const colorOk = m.ownedPx >= MIN_COLOR_PX && typeof m.hex === 'string' && typeof m.L === 'number';
  return {
    sampledHex: colorOk ? m.hex! : null,
    sampledL: colorOk ? m.L! : null,
    cropFile: toStoredPath(m.cropUri ?? null),
    cropQuality: m.cropUri ? cropQuality(m) : null,
  };
}

function detailUri(sha: string): string | null {
  try {
    const root = Paths.cache.uri;
    return `${root.endsWith('/') ? root : `${root}/`}detail/${sha}.jpg`;
  } catch {
    return null;
  }
}

export const liveMeasurer: GarmentMeasurer = async (check, pieces) => {
  const out: MeasuredPieces = new Map<string, Measured>();
  if (check.demoPhotoId || !check.photoFile || pieces.length === 0) return out;
  const kept = resolveStoredPath(check.photoFile);
  const detail = detailUri(check.imageHash);
  if (!kept || !detail) return out;
  const input: MeasureInput[] = pieces.filter((p) => p.box.length === 4).map((p) => ({ key: p.key, category: p.category, box: [...p.box] }));
  const r = await measureGarments(kept, detail, check.imageHash, input, check.mirrored === true);
  if (r.status !== 'ok') {
    if (__DEV__ && r.status !== 'notImplemented') console.log(`[measure] ${r.status}`);
    return out;
  }
  for (const g of r.garments) out.set(g.key, measuredOf(g));
  out.heads = headsOf(r.heads);
  if (__DEV__) {
    const parts = r.garments.map((g) => `${g.key} ${g.hex ?? '-'} L${g.L ?? '-'} px${g.ownedPx} q${g.cropUri ? cropQuality(g) : '-'}`);
    console.log(`[measure] ${r.ms ?? '?'} ms${check.mirrored ? ' · mirrored' : ''} · ${parts.join(' · ')}`);
  }
  return out;
};
