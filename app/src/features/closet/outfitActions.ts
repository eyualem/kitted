// "Wear this" on an outfit (09-ui-review §13 O10): today's wear is this outfit, saved as an outfit row, with an Undo
// that puts back whatever today's log held. The same as the chat's and the morning card's Wear this.
import { dayKey } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { OccasionKey, OutfitRow } from '@/data/types';
import type { Clock } from '@/services/clock';

export interface WearDeps {
  store: Pick<KittedStore, 'outfits' | 'wearLog'>;
  clock: Clock;
  ids: (prefix: string) => string;
}

/** Logs today's wear; returns its Undo. */
export async function wearOutfit(deps: WearDeps, itemIds: readonly string[], occasion: OccasionKey, summary = ''): Promise<() => Promise<void>> {
  const { store, clock } = deps;
  const now = clock.nowMs();
  const day = dayKey(now, clock.offset);
  const outfit: OutfitRow = {
    id: deps.ids('O'), itemIds: [...itemIds], occasion, title: null, summary, details: {} as OutfitRow['details'],
    source: 'idea', isSaved: false, createdAt: now,
  };
  await store.outfits.put(outfit);
  const before = await store.wearLog.get(day);
  await store.wearLog.put({ day, fitCheckId: null, outfitId: outfit.id, createdAt: now });
  return async () => {
    if (before) await store.wearLog.put(before);
    else await store.wearLog.delete(day);
  };
}
