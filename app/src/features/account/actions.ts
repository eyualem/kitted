// "Delete account and all data" (10-onboarding.md §4.6, Apple 5.1.1(v)): the account and its server copy first (the
// Firebase build revokes the Apple token, then calls firebase/functions deleteAccount), and only if that worked, the
// phone is wiped as "Delete all my data" does (the age block stays). A failure deletes nothing.
import { runDeleteAllData } from '@/features/privacy/actions';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { store } from '@/data/db';
import { auth, getAccount } from './account';

export async function deleteAccountAndData(): Promise<void> {
  const r = await auth.deleteAccount((await getAccount(store))?.provider);
  if (r.kind !== 'ok') {
    showToast(r.kind === 'offline' ? t('acct.offline') : t('acct.delete.failed'));
    return;
  }
  await runDeleteAllData();
}
