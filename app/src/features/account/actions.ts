// "Delete account and all data" (10-onboarding.md §4.6, Apple 5.1.1(v)): the server copy first (#386: the deleteAccount
// job deletes every document, every photo and the Auth user), then the sign-in's own delete (it revokes Google's or
// Apple's grant), and only then is the phone wiped as "Delete all my data" does (the age block stays). If the server
// copy can't be deleted, nothing is. Once it's gone, the phone is wiped even if the provider's step then fails: the
// account doesn't exist any more, so keeping its rows here would keep a backup that isn't there.
import { runDeleteAllData } from '@/features/privacy/actions';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { auth } from './account';

export async function deleteAccountAndData(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { backup } = require('@/sync/appBackup') as typeof import('@/sync/appBackup');
  const server = await backup.deleteServerCopy();
  if (server === 'failed' || server === 'offline') {
    showToast(server === 'offline' ? t('acct.offline') : t('acct.delete.failed'));
    return;
  }
  const r = await auth.deleteAccount();
  if (r.kind !== 'ok') {
    if (server === 'none') {
      showToast(r.kind === 'offline' ? t('acct.offline') : t('acct.delete.failed'));
      return;
    }
    await auth.signOut().catch((e: unknown) => console.warn('[account] sign-out after deletion', e));
  }
  await runDeleteAllData();
}
