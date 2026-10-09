// What a closet question shows as evidence (#117): this photo with the piece's box, the closet piece's best earlier
// photo (its largest, cleanest sighting), and how many closet questions he has answered (the "Your score stays the
// same" line shows on his first few only).
import type { ClosetAsk, ClosetObservationRow } from '@/data/types';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { shownPhoto, type ShownPhoto } from '@/demo/demoPhotos';
import { isLive } from './profile';

export interface Shot {
  photo: ShownPhoto;
  box: number[];
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
const area = (b: readonly number[]) => (b[2]! - b[0]!) * (b[3]! - b[1]!);

async function shotOf(o: ClosetObservationRow | null | undefined): Promise<Shot | null> {
  const box = o ? boxOf(o) : null;
  if (!o || !box || !o.fitCheckId) return null;
  const row = await store.fitChecks.get(o.fitCheckId);
  const photo = row ? shownPhoto(row.demoPhotoId, row.photoFile, undefined) : undefined;
  return photo ? { photo, box } : null;
}

/** The candidate's best sighting with a photo: the cleanest crop measured, else the biggest box. Pure. */
export function bestSighting(itemId: string, obs: readonly ClosetObservationRow[]): ClosetObservationRow | null {
  const mine = obs.filter((o) => o.itemId === itemId && isLive(o) && o.fitCheckId && boxOf(o));
  mine.sort((a, b) => (b.cropQuality ?? -1) - (a.cropQuality ?? -1) || area(boxOf(b)!) - area(boxOf(a)!) || (a.id < b.id ? -1 : 1));
  return mine[0] ?? null;
}

export function useAskEvidence(ask: Pick<ClosetAsk, 'obsId' | 'candidateId'>): AskEvidence | undefined {
  return useLive(['closetObs', 'fitChecks'], async () => {
    const all = await store.closetObs.all();
    return {
      thisPhoto: await shotOf(all.find((o) => o.id === ask.obsId)),
      inCloset: await shotOf(bestSighting(ask.candidateId, all)),
      answered: all.filter((o) => ANSWERS.includes(o.decision)).length,
    };
  }, [ask.obsId, ask.candidateId]);
}
