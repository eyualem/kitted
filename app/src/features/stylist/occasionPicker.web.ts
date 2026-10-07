// WEB PREVIEW ONLY: no action sheet; each tap moves to the next occasion.
import { OCCASIONS, type OccasionKey } from '@/data/types';

export function pickOccasion(current: OccasionKey, onPick: (o: OccasionKey) => void): void {
  const i = OCCASIONS.indexOf(current);
  onPick(OCCASIONS[(i + 1) % OCCASIONS.length]!);
}
