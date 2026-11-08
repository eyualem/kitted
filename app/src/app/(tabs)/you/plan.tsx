// Y5 · Plan & usage (02-screens.md): the status card, today's usage and the subscription rows. "Try Pro" waits for
// the paywall (P1 is still a placeholder until P6), so a free plan shows no upgrade button yet. Mocked until P6:
// the plan comes from the demo entitlement, a trial only on demo screens (features/settings/plan.ts).
import { View } from 'react-native';
import { KButton, KCard, KText, radius, space } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { openManageSubscription } from '@/features/settings/actions';
import { planStatus, restorePurchases, restoreToast, usageLines } from '@/features/settings/plan';
import { LinkRow, Section, SettingsScroll, ValueRow } from '@/features/settings/SettingsList';
import { isProNow, usePlan } from '@/features/settings/usePlan';
import { showToast } from '@/features/toast/toast';
import { usePaywallOn } from '@/features/paywall/switch';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';

export default function PlanUsageScreen() {
  const plan = usePlan();
  // Nothing to restore while the paywall is off (09 §20.7 R5, #323).
  const paywall = usePaywallOn();
  const today = useLive(['usage', 'fitChecks'], async () => {
    const snap = await quota.snapshot();
    const day = await store.usage.get(snap.dayKey);
    return { snap, rechecks: day?.rechecks ?? 0 };
  }, []);
  if (!today) return null;

  const status = planStatus(plan, sessionClock.offset);
  const lines = usageLines(today.snap, today.rechecks);
  const restore = async () => showToast(restoreToast(await restorePurchases(isProNow)));

  return (
    <SettingsScroll>
      <KCard radius={radius.cardSmall} accessibilityLabel={`${status.title}. ${status.detail}`}>
        <View style={{ paddingHorizontal: space.rowX, paddingVertical: space.l, gap: space.xxs }}>
          <KText variant="headline" weight="600">
            {status.title}
          </KText>
          <KText variant="subheadline" color="ink2">
            {status.detail}
          </KText>
        </View>
      </KCard>

      <Section label={t('usage.today')} footer={t('usage.resets')}>
        {lines.map((l) => (
          <ValueRow key={l.key} label={l.label} value={l.value} spoken={l.spoken} />
        ))}
      </Section>

      {plan.kind !== 'free' ? <KButton kind="secondary" size="large" title={t('settings.manage')} onPress={() => void openManageSubscription()} accessibilityHint={t('settings.a11y.appStoreHint')} /> : null}

      {paywall ? (
        <Section>
          <LinkRow title={t('settings.restore')} chevron={false} onPress={() => void restore()} />
        </Section>
      ) : null}
    </SettingsScroll>
  );
}
