// P1 · Paywall, page 1 of 2 (02 D18; 10-onboarding.md §9.4): his result and what Pro adds. X and Continue free from the
// first frame; See plans pushes P1b. Already Pro: "You're Pro." and Manage subscription. Never "unlimited": the limits
// are the quota's own.
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, KButton, KText, NeckDownPhoto, TextLink, WovenLabel, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { shownPhoto } from '@/demo/demoPhotos';
import { getFinish } from '@/features/finish/service';
import { MANAGE_SUBSCRIPTIONS_URL, PRIVACY_URL, TERMS_URL } from '@/config/links';
import { restoreToast } from '@/features/settings/plan';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { useIsPro } from '@/services/entitlements';
import { getDemoArgs, sessionClock } from '@/state/session';
import { dayKey } from '@kitted/core';
import { paywallPerks, paywallTitle, plansReminder, todayCard, type TodayCard } from './content';
import { closePaywall, parseFrom } from './flow';
import { purchases } from './switch';

/** The root stack's back: closes the whole cover from either page. */
export function useCloseCover(): () => void {
  const nav = useNavigation();
  return () => {
    const parent = nav.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else if (router.canGoBack()) router.back();
    else router.replace('/stylist');
  };
}

function useTodayCard(onboarding: boolean): { card: TodayCard; photo: ReturnType<typeof shownPhoto> } | null | undefined {
  return useLive(
    ['fitChecks', 'kv'],
    async () => {
      const all = await store.fitChecks.all();
      const s = onboarding ? await getFinish(store) : null;
      const full = all.filter((c) => c.status === 'scored' && c.parentId === null).sort((a, b) => b.createdAt - a.createdAt);
      const check = (s?.checkId ? all.find((c) => c.id === s.checkId) : null) ?? full[0] ?? null;
      if (!check) return null;
      const recheck = all.find((c) => c.parentId === check.id && c.status === 'scored') ?? null;
      const card = todayCard(check, recheck, { todayKey: dayKey(sessionClock.nowMs(), sessionClock.offset), first: onboarding });
      if (!card) return null;
      const row = card.checkId === check.id ? check : recheck!;
      return { card, photo: shownPhoto(row.demoPhotoId, row.photoFile, null) };
    },
    [onboarding],
  );
}

export function PaywallScreen() {
  const { colors, isAccessibilitySize: ax } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ from?: string }>();
  const from = parseFrom(params.from);
  const close = useCloseCover();
  const isPro = useIsPro() || getDemoArgs().pro;
  const today = useTodayCard(from === 'onboarding');
  const done = (purchased = false) => closePaywall(close, from, purchased);
  const restore = async () => {
    const r = await purchases.restore();
    showToast(restoreToast(r));
    if (r === 'restored') done();
  };

  const footer = (
    <View style={ax ? { gap: 6.5 } : { paddingHorizontal: space.heroGutter, gap: 6.5 }}>
      {isPro ? (
        <KButton title={t('settings.manage')} kind="secondary" onPress={() => void Linking.openURL(MANAGE_SUBSCRIPTIONS_URL)} />
      ) : (
        <>
          <KButton title={t('pay.seePlans')} onPress={() => router.push({ pathname: '/paywall/plans', params: { from } })} />
          <KButton title={t('pay.continueFree')} kind="ghost" inkLabel onPress={() => done()} />
        </>
      )}
      <LegalLinks />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space.l) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, minHeight: 44 }}>
        <IconButton icon="close" label={t('common.close')} onPress={() => done()} />
        {isPro ? null : <TextLink title={t('pay.restore')} color="ink2" onPress={() => void restore()} />}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.heroGutter, paddingTop: space.xs, paddingBottom: space.l, gap: 17 }}>
        <WovenLabel text={t('brand.wordmark.pro')} size="small" tone="copper" spokenLabel={t('you.plan.pro')} />
        {isPro ? (
          <View style={{ gap: space.s }}>
            <KText variant="largeTitle" weight="700" accessibilityRole="header">
              {t('pay.alreadyPro')}
            </KText>
            <KText variant="body" color="ink2">
              {plansReminder()}
            </KText>
          </View>
        ) : (
          <>
            <KText variant="largeTitle" weight="700" accessibilityRole="header" style={{ letterSpacing: -0.8 }}>
              {paywallTitle()}
            </KText>
            {today ? <TodayRow card={today.card} photo={today.photo} /> : null}
            <View style={{ gap: 9 }}>
              {paywallPerks().map((p) => (
                <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 10.5 }} accessible accessibilityLabel={p}>
                  <Icon name="check" size={15.5} weight="bold" color={colors.ink} />
                  <KText variant="callout" weight="500" style={{ flex: 1 }}>
                    {p}
                  </KText>
                </View>
              ))}
            </View>
          </>
        )}
        {/* At the largest text sizes the buttons would fill the screen and squeeze the page out, so they scroll with it. */}
        {ax ? footer : null}
      </ScrollView>
      {ax ? null : footer}
    </View>
  );
}

function TodayRow({ card, photo }: { card: TodayCard; photo: ReturnType<typeof shownPhoto> }) {
  const { colors } = useTheme();
  const spoken = [card.title.replace('→', 'to'), card.detail].filter(Boolean).join('. ');
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10.5, paddingHorizontal: 13, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}
    >
      {photo ? <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={49.5} height={62.5} borderRadii={{ tl: 11.5, tr: 11.5, br: 11.5, bl: 11.5 }} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="callout" weight="600">
          {card.title}
        </KText>
        {card.detail ? (
          <KText variant="footnote" color="ink2">
            {card.detail}
          </KText>
        ) : null}
      </View>
    </View>
  );
}

/** `Terms` · `Privacy`, each only once its page exists (a link to nothing is worse than none; 3.1.2 needs both before
 *  PAYWALL_BUILT can be on, which a test checks). */
export function LegalLinks() {
  if (!TERMS_URL && !PRIVACY_URL) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18 }}>
      {TERMS_URL ? <TextLink title={t('common.terms')} color="ink2" compact onPress={() => void Linking.openURL(TERMS_URL!)} /> : null}
      {PRIVACY_URL ? <TextLink title={t('common.privacy')} color="ink2" compact onPress={() => void Linking.openURL(PRIVACY_URL!)} /> : null}
    </View>
  );
}
