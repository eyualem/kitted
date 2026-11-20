// SB4: the last step after a sign-in. Photo backup is off until he taps `Back up photos too`; `Done` leaves it off. Shown once
// (the mark is this phone's, sync/photoBackup.ts), and not at all when the account already has it on. Used inside the sign-in
// sheet and at the end of the restore.
import { View } from 'react-native';
import { KButton, KText, space } from '@/design-system';
import { store } from '@/data/db';
import { t } from '@/i18n/en';
import { markPhotoStepOffered, turnOnPhotoBackup } from '@/sync/photoBackup';
import type { AuthProvider } from './auth';

/** `showTitle` off where the screen already has its own title (the restore's "Your fits are back."). */
export function PhotoStep({ provider, onDone, showTitle = true }: { provider: AuthProvider; onDone: () => void; showTitle?: boolean }) {
  const choose = (on: boolean) => async () => {
    try {
      await markPhotoStepOffered(store);
      // Through the app's store, so the setting is recorded and goes to the account like any other change.
      if (on) await turnOnPhotoBackup(store);
    } catch (e: unknown) {
      console.warn('[photos] step failed', e);
    }
    onDone();
  };
  return (
    <View style={{ gap: space.m }}>
      {showTitle ? (
        <KText variant="headline" accessibilityRole="header">
          {t('acct.photos.title', { provider: t(`acct.provider.${provider}`) })}
        </KText>
      ) : null}
      <KText variant="body" color="ink2">
        {t('acct.photos.body')}
      </KText>
      <View style={{ gap: space.s, paddingTop: space.xs }}>
        <KButton title={t('acct.photos.yes')} size="regular" fullWidth onPress={() => void choose(true)()} />
        <KButton title={t('acct.photos.done')} kind="secondary" size="regular" fullWidth onPress={() => void choose(false)()} />
      </View>
    </View>
  );
}
