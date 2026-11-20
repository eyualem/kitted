// "Delete account and all data" (specs/sign-in-and-backup.md SB9; Apple 5.1.1(v)): the order is Apple's token revoked (his own
// Apple sheet, once), then the server's copy deleted once (database, photos, the account), then this phone wiped as "Delete all
// my data" does (the age block stays). Any step that doesn't succeed stops the rest and deletes nothing on the phone
// (deleteAccount.ts runDeleteAccount, tested). Backup is paused while this runs, so nothing is written to the account on its way out.
import { Alert } from 'react-native';
import { store } from '@/data/db';
import { runDeleteAllData } from '@/features/privacy/actions';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { auth, getAccount, usesFirebase } from './account';
import { runDeleteAccount, type DeleteAccountDeps } from './deleteAccount';

/* eslint-disable @typescript-eslint/no-require-imports */
const revokeApple = (): Promise<'ok' | 'cancelled' | 'offline' | 'failed'> =>
  (require('./firebaseAuth') as typeof import('./firebaseAuth')).revokeAppleAccess();
const serverJob = (): Promise<'ok' | 'offline' | 'failed'> =>
  (require('@/services/firebase/data') as typeof import('@/services/firebase/data')).deleteAccountOnServer();
const backupControl = () => require('@/sync/appBackup') as typeof import('@/sync/appBackup');
/* eslint-enable @typescript-eslint/no-require-imports */

export async function deleteAccountAndData(): Promise<void> {
  const account = await getAccount(store);
  const live = usesFirebase();
  const deps: DeleteAccountDeps = {
    provider: account?.provider ?? 'google',
    // On a demo screen (MockAuth) there is no Apple sheet and no server: the scripted outcome answers the server step.
    revokeApple: live ? revokeApple : async () => 'ok',
    deleteServer: live
      ? serverJob
      : async () => {
          const r = await auth.deleteAccount();
          return r.kind;
        },
    wipe: async () => {
      // Firebase's own sign-in goes with the phone's data (the account on the server is already gone).
      await auth.signOut().catch((e: unknown) => console.warn('[account] sign-out after delete failed', e));
      await runDeleteAllData();
    },
  };
  if (live) await backupControl().haltBackup();
  const r = await runDeleteAccount(deps);
  if (r.kind === 'deleted') {
    if (live) backupControl().backupAccountDeleted(); // the account is gone: signing in again in this session backs up
    return;
  }
  if (live) backupControl().resumeBackup();
  if (r.kind === 'offline') showToast(t('acct.delete.offline'));
  else if (r.kind === 'failed') {
    // Nothing was deleted: the same line offers Try again, which runs the whole order again.
    Alert.alert(t('acct.delete.failed'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('acct.delete.tryAgain'), onPress: () => void deleteAccountAndData() },
    ]);
  }
  // 'cancelled': he closed Apple's sheet. Nothing was deleted, nothing to say.
}
