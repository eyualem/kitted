// Demo screens 240, 241, 243, 244 (10-onboarding.md §10–§11, #373, #375): Kit's "About you" card in each state, posted
// through the same service the app runs. The full scenario's fit is cleared first (the card never asks a profile that
// gave one), and the end-of-onboarding sequence is marked done, as on a phone past its first day.
import type { KittedStore } from '@/data/store';
import type { ScreenScenario } from '@/demo/scenarios';
import { FINISH_KEY } from '@/features/finish/service';
import { NO_FINISH } from '@/features/finish/sequence';
import { newId } from '@/services/ids';
import { createAboutYouService } from './service';

export type AboutYouDemo = 'answer' | 'visit' | 'declined' | 'saved';

export async function prepareAboutYouDemo(store: KittedStore, sc: ScreenScenario, nowMs: number): Promise<void> {
  if (!sc.aboutYou) return;
  const p = await store.profile.get('me');
  if (p) await store.profile.put({ ...p, fitPreference: '' });
  await store.setKv(FINISH_KEY, JSON.stringify({ ...NO_FINISH, step: 'done' }));
  const svc = createAboutYouService({ store, now: () => nowMs, ids: newId, busy: () => false, held: async () => false });
  const id = sc.aboutYou === 'answer' ? await svc.afterAnswer({ kind: 'fitHowTo', at: nowMs }) : await svc.ensure();
  if (!id) return;
  if (sc.aboutYou === 'declined') await svc.notNow(id);
  if (sc.aboutYou === 'saved') await svc.pick(id, 'relaxed');
}
