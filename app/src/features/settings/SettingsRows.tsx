// You's settings rows (SY1, specs/setup-and-you.md; T34): what the Settings page behind the gear held, now on You under
// the style card, What Kit knows and Today. Account first (once accounts exist), then Notifications, Appearance and
// Plan & usage in one card, Privacy & data in its own, the subscription rows, help and about, and the version line.
// Units went with height (#375). Rows whose address isn't set yet (support mail, privacy policy, terms:
// config/links.ts) are hidden, not dead. Deleting data lives in Privacy & data. "Redeem a code" waits for StoreKit
// (P6), so it isn't shown. Notifications (nothing is scheduled until expo-notifications) and the subscription rows
// (nothing to buy or restore while the paywall is off, and never on the beta) are hidden, not dead (09 §20.7 R5, #323).
import { router } from 'expo-router';
import { useEffect, useState, type JSX } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { KText, space, type AppAppearance } from '@/design-system';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/config/links';
import { NOTIFICATIONS_BUILT } from '@/config/features';
import { store } from '@/data/db';
import { AccountSection } from '@/features/account/AccountRows';
import { usePaywallOn } from '@/features/paywall/switch';
import { mailtoUrl, openLink, openManageSubscription } from '@/features/settings/actions';
import { appVersion, planShortName, restorePurchases, restoreToast, versionLine } from '@/features/settings/plan';
import { APPEARANCES, appearanceLabel, loadAppearance, saveAppearance } from '@/features/settings/prefs';
import { LinkRow, PickerRow, Section } from '@/features/settings/SettingsList';
import { isProNow, usePlan } from '@/features/settings/usePlan';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';

const APPEARANCE_OPTIONS = APPEARANCES.map((a) => ({ value: a, label: appearanceLabel(a) }));

const BUILD_LINKS = { support: SUPPORT_EMAIL, privacy: PRIVACY_URL, terms: TERMS_URL };

export interface SettingsRowsProps {
  /** Defaults to NOTIFICATIONS_BUILT (@/config/features). Tests pass it. */
  notificationsBuilt?: boolean;
  /** Defaults to SUPPORT_EMAIL, PRIVACY_URL, TERMS_URL (@/config/links). Tests pass them. */
  links?: { support: string | null; privacy: string | null; terms: string | null };
  /** You's ScrollView reads where the block sits, to open at it (`/you?at=settings`). */
  onLayout?: (e: LayoutChangeEvent) => void;
}

export function SettingsRows({ notificationsBuilt = NOTIFICATIONS_BUILT, links = BUILD_LINKS, onLayout }: SettingsRowsProps = {}): JSX.Element {
  const plan = usePlan();
  const paywall = usePaywallOn();
  const [appearance, setAppearance] = useState<AppAppearance>('system');
  useEffect(() => {
    void loadAppearance(store).then(setAppearance);
  }, []);

  const pickAppearance = (a: AppAppearance) => {
    setAppearance(a);
    void saveAppearance(store, a);
  };
  const restore = async () => showToast(restoreToast(await restorePurchases(isProNow)));
  const v = appVersion();
  // Local consts so the checks below narrow inside the press handlers.
  const { support, privacy, terms } = links;

  return (
    <View testID="you-rows" onLayout={onLayout} style={{ gap: space.xxl }}>
      {/* Accounts (#289): first, once Firebase exists; hidden until then. */}
      <AccountSection />
      <View testID="you-section-main">
        <Section>
          {notificationsBuilt ? (
            <LinkRow testID="you-row-notifications" title={t('settings.notifications')} onPress={() => router.push('/you/notifications')} />
          ) : null}
          <PickerRow testID="you-row-appearance" title={t('settings.appearance')} value={appearance} options={APPEARANCE_OPTIONS} onPick={pickAppearance} />
          <LinkRow testID="you-row-plan" title={t('settings.plan')} value={planShortName(plan)} onPress={() => router.push('/you/plan')} />
        </Section>
      </View>

      <View testID="you-section-privacy">
        <Section>
          <LinkRow testID="you-row-privacy" title={t('settings.privacy')} onPress={() => router.push('/you/privacy')} />
        </Section>
      </View>

      {paywall ? (
        <View testID="you-section-subscription">
          <Section label={t('settings.subscription')}>
            <LinkRow testID="you-row-manage" title={t('settings.manage')} onPress={() => void openManageSubscription()} hint={t('settings.a11y.appStoreHint')} />
            <LinkRow testID="you-row-restore" title={t('settings.restore')} chevron={false} onPress={() => void restore()} />
          </Section>
        </View>
      ) : null}

      <View testID="you-section-help">
        <Section label={t('settings.helpAbout')}>
          {support ? (
            <LinkRow
              testID="you-row-report"
              title={t('settings.report')}
              hint={t('settings.a11y.mailHint')}
              onPress={() => void openLink(mailtoUrl(support, t('settings.report.subject', { version: v.version })))}
            />
          ) : null}
          {support ? (
            <LinkRow
              testID="you-row-support"
              title={t('settings.support')}
              hint={t('settings.a11y.mailHint')}
              onPress={() => void openLink(mailtoUrl(support, t('settings.support.subject', { version: v.version, build: v.build })))}
            />
          ) : null}
          {privacy ? (
            <LinkRow testID="you-row-privacy-policy" title={t('common.privacyPolicy')} hint={t('settings.a11y.webHint')} onPress={() => void openLink(privacy)} />
          ) : null}
          {terms ? <LinkRow testID="you-row-terms" title={t('common.termsOfUse')} hint={t('settings.a11y.webHint')} onPress={() => void openLink(terms)} /> : null}
          <LinkRow testID="you-row-acknowledgements" title={t('settings.acknowledgements')} onPress={() => router.push('/you/acknowledgements')} />
        </Section>
      </View>

      <View testID="you-version">
        <KText variant="footnote" color="ink3" tabular style={{ textAlign: 'center', paddingHorizontal: space.l }}>
          {versionLine(v)}
        </KText>
      </View>
    </View>
  );
}
