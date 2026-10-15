// What a closet question shows as evidence (#117): this photo with the piece's box, the closet piece's first photo
// as its page shows it (his cover, else its cleanest, largest sighting; never one he removed, #276), each cropped
// below his head and true-view (cropSafety), and how many closet questions he has answered (the "Your score stays
// the same" line shows on his first few only).
import type { ClosetAsk, ClosetObservationRow } from '@/data/types';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { shownPhoto, type ShownPhoto } from '@/demo/demoPhotos';
import { bestSighting } from './piecePreview';
import { isMirrorReading } from './cropSafety';
import { livePhotoDeps, loadPhotoChecks } from './photoChecks';
import { photoCheckOf, photoOfSighting, piecePhotos } from './piecePhotos';

export { bestSighting };

export interface Shot {
  photo: ShownPhoto;
  box: number[];
  /** The first photo row the crop may show, below his head (cropSafety.cropTop). */
  top: number;
  /** A mirror selfie: shown true-view. */
  mirrored: boolean;
}
export interface AskEvidence {
  thisPhoto: Shot | null;
  inCloset: Shot | null;
  answered: number;
}

/** The score line shows until he has answered this many closet questions. */
export const SCORE_LINE_UNTIL = 3;
const ANSWERS: readonly string[] = ['answeredSame', 'answeredNew', 'split'];

const boxOf = (o: ClosetObservationRow): number[] | null => (o.closet?.visible && o.closet.box.length === 4 ? o.closet.box : null);

/** The sighting's photo cropped below his head (#276); null (the drawing stands in) when no crop is safe. */
async function shotOf(o: ClosetObservationRow | null | undefined): Promise<Shot | null> {
  const box = o ? boxOf(o) : null;
  // A shoe snap's sighting carries its parent check's id, not the snap's own photo: no crop of the wrong photo.
  if (!o || !box || !o.fitCheckId || o.origin !== 'garment') return null;
  const row = await store.fitChecks.get(o.fitCheckId);
  if (!row) return null;
  const reading = row.readingId ? await store.readings.get(row.readingId) : null;
  const crop = photoOfSighting(o, photoCheckOf(row, isMirrorReading(reading?.reading)), livePhotoDeps);
  const photo = crop ? shownPhoto(row.demoPhotoId, row.photoFile, undefined) : undefined;
  return crop && photo ? { photo, box, top: crop.top, mirrored: crop.mirrored } : null;
}

/** The closet piece's first photo as the piece page shows it (#276: his cover, never a photo he removed from it). */
async function pieceShot(itemId: string, all: readonly ClosetObservationRow[]): Promise<Shot | null> {
  const item = await store.closet.get(itemId);
  if (!item) return null;
  const first = piecePhotos(item, all, await loadPhotoChecks(store), livePhotoDeps).shown[0];
  return first ? { photo: { id: first.checkId, source: first.source, aspect: first.aspect }, box: first.box, top: first.top, mirrored: first.mirrored } : null;
}

export function useAskEvidence(ask: Pick<ClosetAsk, 'obsId' | 'candidateId'>): AskEvidence | undefined {
  return useLive(['closetObs', 'fitChecks', 'closet'], async () => {
    const all = await store.closetObs.all();
    return {
      thisPhoto: await shotOf(all.find((o) => o.id === ask.obsId)),
      inCloset: await pieceShot(ask.candidateId, all),
      answered: all.filter((o) => ANSWERS.includes(o.decision)).length,
    };
  }, [ask.obsId, ask.candidateId]);
}
