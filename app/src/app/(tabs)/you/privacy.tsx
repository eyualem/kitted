// Y7 · Privacy & data (02-screens.md; revised copy DECISIONS-LOG #246, mockups/theme-round2.html → Settings, Privacy):
// the honest promise, "See what I send" (the face-blurred copy his last check sent), the "Score my fits" switch (off
// withdraws consent at once; on goes through the consent sheet), his photos' count and size, then the three deletes,
// each confirmed with the spec's dialog (Cancel is the default). All local, so it works offline.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Pressable, View } from 'react-native';
import { Icon, KCard, KText, TextLink, opacity, space, useTheme } from '@/design-system';
import { PRIVACY_URL, MANAGE_SUBSCRIPTIONS_URL } from '@/config/links';
import { store } from '@/data/db';
import { DEMO_ENABLED } from '@/demo/config';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { realPrivacyFiles, bytesParts, type PhotoUsage } from '@/features/privacy/files';
import { runDeleteAllData, runDeleteAllPhotos, runForgetFacts, turnScoringOff, turnScoringOn } from '@/features/privacy/actions';
import { LinkRow, Section, SettingsScroll, ToggleRow, ValueRow } from '@/features/settings/SettingsList';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';

/** iOS destructive red, at the mockup's values (`.danger`): systemRed itself is 3.6:1 on white, under 4.5:1. */
const DANGER = { light: '#C9302C', dark: '#FF6961' } as const;

function sizeText(bytes: number): string {
  const { n, unit } = bytesParts(bytes);
  return t(unit === 'gb' ? 'privacy.size.gb' : unit === 'mb' ? 'privacy.size.mb' : 'privacy.size.kb', { n });
}

function storageText(u: PhotoUsage): string {
  const size = sizeText(u.bytes);
  return u.photos === 1 ? t('privacy.storageValueOne', { size }) : t('privacy.storageValue', { n: u.photos, size });
}

/** Photos on this iPhone: read from the folders when the screen shows, after a delete, and on return to the app. */
function usePhotoUsage(): [PhotoUsage, () => void] {
  const [usage, setUsage] = useState<PhotoUsage>(() => realPrivacyFiles.usage());
  const refresh = useCallback(() => setUsage(realPrivacyFiles.usage()), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);
  return [usage, refresh];
}

function askFirst(title: string, message: string, cta: string, run: () => Promise<void>) {
  Alert.alert(title, message, [
    { text: t('common.cancel'), style: 'cancel', isPreferred: true },
    { text: cta, style: 'destructive', onPress: () => void run() },
  ]);
}

function DangerRow({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  const { colors, scheme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        { minHeight: 44, paddingVertical: space.rowY, paddingHorizontal: space.rowX, justifyContent: 'center' },
        pressed && { backgroundColor: colors.surface2 },
        disabled && { opacity: opacity.disabled },
      ]}
    >
      <KText variant="callout" weight="500" color={DANGER[scheme]}>
        {title}
      </KText>
    </Pressable>
  );
}

export default function PrivacyDataScreen() {
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  const plan = useLive(['usage', 'fitChecks'], () => quota.snapshot(), []);
  const [usage, refreshUsage] = usePhotoUsage();
  const [busy, setBusy] = useState(false);
  const provider = t('config.providerDefault');
  const consentOn = !!profile?.consentVersion;
  // Demo screen 88 (`?demoPlan=pro`): the Pro warning row without a Pro session.
  const { demoPlan } = useLocalSearchParams<{ demoPlan?: string }>();
  const pro = plan?.pro === true || (DEMO_ENABLED && demoPlan === 'pro');

  const run = (job: () => Promise<void>) => async () => {
    if (busy) return;
    setBusy(true);
    try {
      await job();
    } catch (e: unknown) {
      console.error('[privacy] failed', e);
      showToast(t('privacy.failed'));
    } finally {
      setBusy(false);
      refreshUsage();
    }
  };

  const onToggle = (next: boolean) => {
    if (next) turnScoringOn();
    else void run(turnScoringOff)();
  };

  return (
    <SettingsScroll>
      <KCard radius={20}>
        <View style={{ flexDirection: 'row', gap: space.m, paddingVertical: space.rowY + 2, paddingHorizontal: space.rowX }}>
          <View style={{ paddingTop: 1 }}>
            <Icon name="lock" color="ink2" />
          </View>
          <KText variant="subheadline" color="ink2" style={{ flex: 1 }}>
            {t('privacy.promise')}
          </KText>
        </View>
      </KCard>

      <Section footer={t('privacy.consentFooter')}>
        <LinkRow key="sent" title={t('privacy.seeSent')} onPress={() => router.push('/you/sent')} />
        <ToggleRow key="consent" title={t('privacy.consentToggle')} detail={t('privacy.consentSub', { provider })} value={consentOn} onChange={onToggle} disabled={busy || !profile} />
        <ValueRow key="photos" label={t('privacy.storage')} value={storageText(usage)} spoken={t('privacy.a11y.storage', { label: t('privacy.storage'), value: storageText(usage) })} />
      </Section>

      {PRIVACY_URL ? (
        <Section>
          <LinkRow key="policy" title={t('common.privacyPolicy')} onPress={() => void Linking.openURL(PRIVACY_URL!)} />
        </Section>
      ) : null}

      <View style={{ gap: space.s }}>
        {pro ? (
          <View style={{ paddingHorizontal: space.xs, gap: 2 }}>
            <KText variant="footnote" color="ink2">
              {t('privacy.proWarning')}
            </KText>
            <View style={{ alignSelf: 'flex-start' }}>
              <TextLink title={t('privacy.manage')} onPress={() => void Linking.openURL(MANAGE_SUBSCRIPTIONS_URL)} />
            </View>
          </View>
        ) : null}
        <Section>
          <DangerRow
            key="photos"
            title={t('privacy.deletePhotos')}
            disabled={busy}
            onPress={() =>
              askFirst(t('privacy.deletePhotos.title'), t('privacy.deletePhotos.msg'), t('privacy.deletePhotos'), run(async () => {
                await runDeleteAllPhotos();
                showToast(t('privacy.deletePhotos.done'));
              }))
            }
          />
          <DangerRow
            key="facts"
            title={t('privacy.forget')}
            disabled={busy}
            onPress={() =>
              askFirst(t('privacy.forget.title'), t('privacy.forget.msg'), t('privacy.forget.cta'), run(async () => {
                await runForgetFacts();
                showToast(t('privacy.forget.done'));
              }))
            }
          />
          <DangerRow
            key="all"
            title={t('privacy.deleteAll')}
            disabled={busy}
            onPress={() => askFirst(t('privacy.deleteAll.title'), t('privacy.deleteAll.msg'), t('privacy.deleteAll.cta'), run(runDeleteAllData))}
          />
        </Section>
      </View>
    </SettingsScroll>
  );
}
