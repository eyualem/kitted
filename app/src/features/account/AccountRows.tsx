// You's account rows (SB1.4, SB8): signed out, "Back up your fits" opens the sheet; signed in, which account (an Apple
// relay address reads "Hidden email") and Sign out, which keeps his fits on this phone. Hidden while ACCOUNTS_BUILT is
// off, outside demo screens.
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { LinkRow, Section, ValueRow } from '@/features/settings/SettingsList';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { ACCOUNT_KEY, getAccount, signOut, useAccountsOn } from './account';
import { isRelayEmail } from './email';

export function AccountSection() {
  const on = useAccountsOn();
  const account = useLive(['kv'], () => getAccount(store), [], ACCOUNT_KEY);
  if (!on || account === undefined) return null;
  if (!account) {
    return (
      <Section label={t('acct.settings.label')}>
        <LinkRow title={t('acct.settings.backup')} value={t('acct.settings.backupOff')} onPress={() => router.push({ pathname: '/sheets/sign-in', params: { from: 'settings' } })} />
      </Section>
    );
  }
  const signedIn = t('acct.settings.signedIn', { provider: t(`acct.provider.${account.provider}`) });
  const email = account.email ? (isRelayEmail(account.email) ? t('acct.settings.hiddenEmail') : account.email) : undefined;
  const confirmSignOut = () =>
    Alert.alert(t('acct.signOut.title'), t('acct.signOut.body'), [
      { text: t('common.cancel'), style: 'cancel', isPreferred: true },
      {
        text: t('acct.settings.signOut'),
        style: 'destructive',
        onPress: () =>
          void signOut(store).then(() => showToast(t('acct.signOut.done'))),
      },
    ]);
  return (
    <Section label={t('acct.settings.label')}>
      {/* Information, not a button: nothing to open yet (switching accounts comes with Firebase). */}
      <ValueRow label={signedIn} value={email ?? ''} spoken={email ? `${signedIn}, ${email}` : signedIn} />
      <LinkRow title={t('acct.settings.signOut')} chevron={false} onPress={confirmSignOut} />
    </Section>
  );
}
