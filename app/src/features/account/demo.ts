// Demo screens 130–147 (10-onboarding.md): turn the account screens on with a scripted MockAuth outcome, start signed
// in, and post the save offer, through the same code the app runs. Every other demo screen turns accounts back off.
import type { KittedStore } from '@/data/store';
import type { ScreenScenario } from '@/demo/scenarios';
import { saveAccount, setDemoAccounts } from './account';
import { MOCK_EMAILS } from './auth';
import { accountOffer } from './offerSession';

export async function prepareAccountDemo(store: Pick<KittedStore, 'setKv'>, sc: ScreenScenario, nowMs: number): Promise<void> {
  setDemoAccounts(sc.accounts?.script ?? null);
  if (!sc.accounts) return;
  const p = sc.accounts.signedIn;
  if (p) await saveAccount(store, { uid: 'mock-demo', provider: p, email: MOCK_EMAILS[p], signedInAt: nowMs });
  if (sc.accounts.photos === 'on') await store.setKv('backup.photos', 'on'); // PHOTO_BACKUP_KEY
  if (sc.accounts.offer) {
    const id = await accountOffer.ensure();
    if (id && sc.accounts.offer === 'declined') await accountOffer.decline(id);
  }
}
