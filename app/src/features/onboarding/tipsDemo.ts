// Demo screens for the feature guide (T35, specs/setup-and-you.md SY2, SY3). Every other screen is an established user
// who has dismissed the tips, so their pictures don't change; 272–275 leave them showing, 276 is just after Show me around.
import type { KittedStore } from '@/data/store';
import { newId } from '@/services/ids';
import { FIRST_SCORE_AFTER_KEY, TIP_IDS, dismissTip, showMeAround, tipKey } from './tips';

export async function prepareTipsDemo(store: Pick<KittedStore, 'getKv' | 'setKv' | 'deleteKv' | 'chat'>, tips: true | 'around' | undefined, nowMs: number): Promise<void> {
  await store.deleteKv(FIRST_SCORE_AFTER_KEY);
  if (tips === 'around') return showMeAround(store, nowMs, newId);
  for (const id of TIP_IDS) {
    if (tips) await store.deleteKv(tipKey(id));
    else await dismissTip(store, id);
  }
}
