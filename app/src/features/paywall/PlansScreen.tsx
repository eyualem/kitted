// P1b · Paywall page 2, the plan (02 P1b, P1s; 10-onboarding.md §9.4). Our own page (React Native has no Apple
// paywall view), so it carries everything App Review 3.1.2 asks for: the plan's name and length, the billed price as
// the biggest price, the trial and the price after it, that it renews and how to cancel, Restore, Terms and Privacy,
// and X and Continue free from the first frame. Monthly only (#285).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, KButton, KText, TextLink, WovenLabel, space, useTheme } from '@/design-system';
import { restoreToast } from '@/features/settings/plan';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import type { ProProduct } from '@/services/purchases';
import { ctaTitle, finePrint, planDetail, plansReminder } from './content';
import { closePaywall, parseFrom } from './flow';
import { LegalLinks, useCloseCover } from './PaywallScreen';
import { purchases } from './switch';

type Load = { kind: 'loading' } | { kind: 'failed' } | { kind: 'offline' } | { kind: 'ok'; product: ProProduct; trial: boolean };
type Buy = 'idle' | 'buying' | 'pending' | 'failed';

export function PlansScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const from = parseFrom(useLocalSearchParams<{ from?: string }>().from);
  const close = useCloseCover();
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [buy, setBuy] = useState<Buy>('idle');
  const done = (purchased = false) => closePaywall(close, from, purchased);

  // The plan from the store; Try again bumps `attempt` (the first render already shows the loading card).
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const r = await purchases.products();
      const product = r.kind === 'ok' ? r.products[0] : undefined;
      const next: Load = r.kind !== 'ok' ? { kind: r.kind } : !product ? { kind: 'failed' } : { kind: 'ok', product, trial: await purchases.trialEligible() };
      if (alive) setLoad(next);
    })();
    return () => {
      alive = false;
    };
  }, [attempt]);

  const purchase = async (p: ProProduct) => {
    setBuy('buying');
    const r = await purchases.purchase(p.id);
    if (r.kind === 'ok') return done(true);
    // A cancel shows nothing (P1s); offline says so in the same place as a failure.
    setBuy(r.kind === 'pending' ? 'pending' : r.kind === 'cancelled' ? 'idle' : 'failed');
    if (r.kind === 'offline') setLoad({ kind: 'offline' });
  };
  const restore = async () => {
    const r = await purchases.restore();
    showToast(restoreToast(r));
    if (r === 'restored') done();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space.l) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, minHeight: 44 }}>
        <IconButton icon="back" label={t('common.back')} onPress={() => router.back()} />
        <IconButton icon="close" label={t('common.close')} onPress={() => done()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.heroGutter, paddingTop: space.xs, paddingBottom: space.l, gap: space.l }}>
        <View style={{ gap: 12 }}>
          <WovenLabel text={t('brand.wordmark.pro')} size="small" tone="copper" spokenLabel={t('you.plan.pro')} />
          <KText variant="title2" weight="700" accessibilityRole="header">
            {t('pay.p2.title')}
          </KText>
          <KText variant="subheadline" color="ink2">
            {plansReminder()}
          </KText>
        </View>
        {load.kind === 'loading' ? <PlanSkeleton /> : null}
        {load.kind === 'failed' ? (
          <View style={{ gap: space.s, alignItems: 'flex-start' }}>
            <KText variant="subheadline">{t('pay.loadFailed')}</KText>
            <KButton
              title={t('pay.retry')}
              kind="secondary"
              size="regular"
              onPress={() => {
                setLoad({ kind: 'loading' });
                setAttempt((n) => n + 1);
              }}
            />
          </View>
        ) : null}
        {load.kind === 'offline' ? (
          <KText variant="subheadline">
            {t('pay.offline')}
          </KText>
        ) : null}
        {load.kind === 'ok' ? (
          <>
            <PlanCard product={load.product} trial={load.trial} />
            <KText variant="caption" color="ink3" style={{ textAlign: 'center' }}>
              {finePrint(load.product, load.trial)}
            </KText>
          </>
        ) : null}
        {buy === 'pending' ? (
          <KText variant="footnote" color="ink2" style={{ textAlign: 'center' }}>
            {t('pay.pending')}
          </KText>
        ) : null}
        {buy === 'failed' && load.kind === 'ok' ? (
          <KText variant="footnote" color="ink2" style={{ textAlign: 'center' }} accessibilityRole="alert">
            {t('pay.failed')}
          </KText>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: space.heroGutter, gap: 6.5 }}>
        {load.kind === 'ok' ? (
          <KButton
            title={ctaTitle(load.product, load.trial)}
            loading={buy === 'buying'}
            disabled={buy === 'buying' || buy === 'pending'}
            onPress={() => void purchase(load.product)}
          />
        ) : load.kind === 'loading' ? (
          <KButton title={t('pay.cta.trial')} disabled />
        ) : null}
        <KButton title={t('pay.continueFree')} kind="ghost" inkLabel onPress={() => done()} />
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <TextLink title={t('pay.restorePurchases')} color="ink2" compact onPress={() => void restore()} />
        </View>
        <LegalLinks />
        {purchases.mock ? (
          <KText variant="caption2" color="ink3" style={{ textAlign: 'center' }}>
            {t('pay.demoNote')}
          </KText>
        ) : null}
      </View>
    </View>
  );
}

/** The one plan, selected (ink border). The billed price is the biggest number on the page (3.1.2). */
function PlanCard({ product, trial }: { product: ProProduct; trial: boolean }) {
  const { colors } = useTheme();
  const detail = planDetail(product, trial);
  return (
    <View
      accessible
      accessibilityRole="radio"
      accessibilityState={{ selected: true, checked: true }}
      accessibilityLabel={t('pay.a11y.plan', { plan: t('pay.plan.monthly'), price: product.price, detail })}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m, paddingVertical: 13, paddingHorizontal: 17,
        borderRadius: 19.5, borderCurve: 'continuous', borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.surface,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="headline">{t('pay.plan.monthly')}</KText>
        <KText variant="footnote" color="ink2">
          {detail}
        </KText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <KText variant="title2" weight="700" style={{ fontVariant: ['tabular-nums'] }}>
          {product.price}
        </KText>
        <KText variant="subheadline" color="ink2">
          {t('pay.plan.perMonth')}
        </KText>
      </View>
    </View>
  );
}

/** Loading: the card's shape, still (Reduce Motion needs nothing more). */
function PlanSkeleton() {
  const { colors } = useTheme();
  return <View style={{ height: 76, borderRadius: 19.5, borderCurve: 'continuous', backgroundColor: colors.surface2 }} accessibilityLabel={t('pay.a11y.loading')} accessible />;
}
