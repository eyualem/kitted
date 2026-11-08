// Y4 · Settings (02-screens.md; the revised design in mockups/theme-round2.html and DECISIONS-LOG #246): the three
// pushes, appearance (units went with height, #375), the subscription rows, help and about, and the version footer. Rows whose address
// isn't set yet (support mail, privacy policy, terms: config/links.ts) are hidden, not dead. Deleting data lives in
// Privacy & data. "Redeem a code" waits for StoreKit (P6), so it isn't shown. Notifications (nothing is scheduled until
// expo-notifications) and the subscription rows (nothing to buy or restore while the paywall is off) are hidden, not
// dead (09 §20.7 R5, #323).
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KText, space, type AppAppearance } from '@/design-system';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/config/links';
import { store } from '@/data/db';
import { mailtoUrl, openLink, openManageSubscription } from '@/features/settings/actions';
import { appVersion, planShortName, restorePurchases, restoreToast, versionLine } from '@/features/settings/plan';
import { APPEARANCES, appearanceLabel, loadAppearance, saveAppearance } from '@/features/settings/prefs';
import { LinkRow, PickerRow, Section, SettingsScroll } from '@/features/settings/SettingsList';
import { isProNow, usePlan } from '@/features/settings/usePlan';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { AccountSection } from '@/features/account/AccountRows';
import { NOTIFICATIONS_BUILT } from '@/config/features';
import { usePaywallOn } from '@/features/paywall/switch';

const APPEARANCE_OPTIONS = APPEARANCES.map((a) => ({ value: a, label: appearanceLabel(a) }));

export default function SettingsScreen() {
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
  const support = SUPPORT_EMAIL;
  const privacy = PRIVACY_URL;
  const terms = TERMS_URL;

  return (
    <SettingsScroll>
      {/* Accounts (#289): first, once Firebase exists; hidden until then. */}
      <AccountSection />
      <Section>
        {NOTIFICATIONS_BUILT ? <LinkRow title={t('settings.notifications')} onPress={() => router.push('/you/notifications')} /> : null}
        <LinkRow title={t('settings.plan')} value={planShortName(plan)} onPress={() => router.push('/you/plan')} />
        <LinkRow title={t('settings.privacy')} onPress={() => router.push('/you/privacy')} />
      </Section>

      <Section>
        <PickerRow title={t('settings.appearance')} value={appearance} options={APPEARANCE_OPTIONS} onPick={pickAppearance} />
      </Section>

      {paywall ? (
        <Section label={t('settings.subscription')}>
          <LinkRow title={t('settings.manage')} onPress={() => void openManageSubscription()} hint={t('settings.a11y.appStoreHint')} />
          <LinkRow title={t('settings.restore')} chevron={false} onPress={() => void restore()} />
        </Section>
      ) : null}

      <Section label={t('settings.helpAbout')}>
        {support ? (
          <LinkRow
            title={t('settings.report')}
            hint={t('settings.a11y.mailHint')}
            onPress={() => void openLink(mailtoUrl(support, t('settings.report.subject', { version: v.version })))}
          />
        ) : null}
        {support ? (
          <LinkRow
            title={t('settings.support')}
            hint={t('settings.a11y.mailHint')}
            onPress={() => void openLink(mailtoUrl(support, t('settings.support.subject', { version: v.version, build: v.build })))}
          />
        ) : null}
        {privacy ? <LinkRow title={t('common.privacyPolicy')} hint={t('settings.a11y.webHint')} onPress={() => void openLink(privacy)} /> : null}
        {terms ? <LinkRow title={t('common.termsOfUse')} hint={t('settings.a11y.webHint')} onPress={() => void openLink(terms)} /> : null}
        <LinkRow title={t('settings.acknowledgements')} onPress={() => router.push('/you/acknowledgements')} />
      </Section>

      <KText variant="footnote" color="ink3" tabular style={{ textAlign: 'center', paddingHorizontal: space.l }}>
        {versionLine(v)}
      </KText>
    </SettingsScroll>
  );
}
