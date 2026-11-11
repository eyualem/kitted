// Y1 · You (02 D17, revised Oct 14 in mockups/theme-round2.html, DECISIONS-LOG #246; SY1 in specs/setup-and-you.md,
// #405): "how your stylist sees you", and the home of every setting. His style card (looks in pick order, basics in one
// quiet line), the plan row on Pro, what the stylist knows, today's check (with Check my fit or Re-check, #370), then
// the settings rows (features/settings/SettingsRows.tsx) and the version line. No gear, no separate Settings page: a
// link that opened Settings opens You at its rows (`/you?at=settings`). No stats, no body, no copper here (copper is
// for score movement, #231). The ScrollView is the screen's first view so the iOS 26 tab bar shrinks on scroll.
import { useCallback, useContext, useEffect, useRef, type RefObject } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { HeaderHeightContext } from 'expo-router/build/react-navigation/elements';
import { Pressable, ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Icon, KButton, KCard, KText, MonoLabel, TextLink, WovenLabel, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ProfileRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { FactCard } from '@/features/you/FactRows';
import { FACTS_ON_YOU, liveFacts } from '@/features/you/facts';
import { StyleTile, StyleTileGrid } from '@/features/you/StyleTile';
import { basicsLine, blankProfile, picksOf, styleCardSpoken } from '@/features/you/profile';
import { todayAction } from '@/features/you/today';
import { t } from '@/i18n/en';
import type { QuotaSnapshot } from '@/services/quota';
import { useIsPro } from '@/services/entitlements';
import { usePaywallOn } from '@/features/paywall/switch';
import { SettingsRows } from '@/features/settings/SettingsRows';
import { goToStylist } from '@/router/stylistAction';

export default function YouScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const isPro = useIsPro();
  const { at } = useLocalSearchParams<{ at?: string }>();
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  const facts = useLive(['facts'], async () => liveFacts(await store.facts.all()), []);
  const usage = useLive(['usage', 'fitChecks'], () => quota.snapshot(), [isPro]);
  const scroll = useRef<ScrollView>(null);
  const land = useLandAtRows(at === 'settings', scroll);
  if (profile === undefined || !facts || !usage) return null;
  return (
    <ScrollView
      ref={scroll}
      onLayout={land.onLayout}
      onContentSizeChange={land.onContentSizeChange}
      onScroll={land.onScroll}
      onScrollBeginDrag={land.onScrollBeginDrag}
      scrollEventThrottle={16}
      scrollToOverflowEnabled
      testID="you-scroll"
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.gutter, paddingBottom: space.xxxl, gap: space.stack }}
    >
      {/* No profile (an install that skipped onboarding): the blank card still opens the editor. */}
      <View testID="you-style">
        <StyleCard p={profile ?? blankProfile(0)} />
      </View>
      {usage.purchased ? <PlanRow /> : null}
      <View testID="you-knows" style={{ gap: space.s, marginTop: space.xs }}>
        {/* At the accessibility sizes the link goes under the header instead of squeezing beside it. */}
        <View
          style={
            isAccessibilitySize
              ? { alignItems: 'flex-start', gap: space.xs, paddingHorizontal: space.xs }
              : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.m, paddingHorizontal: space.xs }
          }
        >
          <View style={{ flexShrink: 1 }} accessibilityRole="header">
            <MonoLabel>{t('you.knows')}</MonoLabel>
          </View>
          {facts.length > 0 ? <TextLink title={t('you.seeAll', { n: facts.length })} onPress={() => router.push('/you/knows')} compact /> : null}
        </View>
        <FactCard facts={facts.slice(0, FACTS_ON_YOU)} />
      </View>
      <TodayCard s={usage} />
      <SettingsRows onLayout={land.onRowsLayout} />
    </ScrollView>
  );
}

/** `/you?at=settings` (an old Settings link, the demo screens): each time he arrives with it, You opens once at its
 *  rows, unanimated: the rows' top just under the nav bar, or the page's true end (above the tab bar) when the page is
 *  too short for that. It lands once the rows, the page and its content have all been measured, and it also works
 *  when You is already open (native tabs keep it mounted, so the link only changes `at`); `at` is cleared when he
 *  leaves You, so the next link lands again and a return by the tab doesn't. The offset is ours to clamp
 *  (`scrollToOverflowEnabled`): React Native's own clamp leaves out the bars' insets, which stopped the page short of
 *  its end. And on a cold launch the native side can still move the page right after, when it first applies those
 *  insets (iOS shifts an offset set before they existed), or the bars report their final size a moment later; while
 *  he hasn't touched the page, it lands again with the settled numbers (a few times at most, in the first moments). */
function useLandAtRows(wanted: boolean, ref: RefObject<ScrollView | null>) {
  // The nav bar with the status bar (the native stack's measured header) and the tab bar with the home indicator (the
  // tab's own safe area). Outside a navigator (tests) both are 0.
  const top = useContext(HeaderHeightContext) ?? 0;
  const bottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  // This screen's own navigation (not the router's focused route), to clear its `at` when he leaves.
  const navigation = useNavigation<{ setParams(p: { at?: string }): void; addListener(type: 'blur', fn: () => void): () => void }>();
  const wantedNow = useRef(false);
  const bars = useRef({ top: 0, bottom: 0 });
  const rowsY = useRef<number | null>(null);
  const pageH = useRef(0);
  const contentH = useRef(0);
  const pending = useRef(false);
  /** After a landing: where it put the page, until when a move is the native side's, and landings left. */
  const watch = useRef<{ y: number; until: number; left: number } | null>(null);

  const scrollToRows = useCallback(() => {
    if (rowsY.current === null || !watch.current) return;
    const end = Math.max(0, contentH.current - pageH.current + bars.current.bottom);
    const y = Math.max(0, Math.min(rowsY.current - space.m - bars.current.top, end));
    watch.current.y = y;
    ref.current?.scrollTo({ y, animated: false });
  }, [ref]);
  const again = useCallback(() => {
    const w = watch.current;
    if (!w || Date.now() > w.until || w.left <= 0) {
      watch.current = null;
      return;
    }
    w.left -= 1;
    scrollToRows();
  }, [scrollToRows]);
  const tryLand = useCallback(() => {
    if (!pending.current || rowsY.current === null || pageH.current <= 0 || contentH.current <= 0) return;
    pending.current = false;
    watch.current = { y: 0, until: Date.now() + RELAND_WINDOW_MS, left: RELANDS };
    scrollToRows();
  }, [scrollToRows]);

  useEffect(() => {
    const changed = bars.current.top !== top || bars.current.bottom !== bottom;
    bars.current = { top, bottom };
    if (changed && watch.current) again();
  }, [top, bottom, again]);
  useEffect(() => {
    // Only an arrival starts a landing; `at` clearing (after one) leaves its settling-in watch running.
    pending.current = wanted;
    wantedNow.current = wanted;
    tryLand();
  }, [wanted, tryLand]);
  // When he leaves You the link is spent: `at` is cleared, so coming back by the tab leaves You where he left it, and
  // the next old link (which sets it again) lands again.
  useEffect(
    () =>
      navigation.addListener('blur', () => {
        if (wantedNow.current) navigation.setParams({ at: undefined });
      }),
    [navigation],
  );

  return {
    onRowsLayout: (e: LayoutChangeEvent) => {
      rowsY.current = e.nativeEvent.layout.y;
      tryLand();
    },
    onLayout: (e: LayoutChangeEvent) => {
      pageH.current = e.nativeEvent.layout.height;
      tryLand();
    },
    onContentSizeChange: (_w: number, h: number) => {
      const changed = contentH.current > 0 && contentH.current !== h;
      contentH.current = h;
      if (changed && watch.current) again();
      tryLand();
    },
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const w = watch.current;
      if (!w) return;
      const y = e.nativeEvent.contentOffset.y;
      if (Math.abs(y - w.y) > 1) again();
    },
    onScrollBeginDrag: () => {
      watch.current = null;
    },
  };
}

/** How long after landing a move of the page is the native side's, not his, and how many times it lands again. */
const RELAND_WINDOW_MS = 1500;
const RELANDS = 3;

/** The whole card opens Y2; "Edit" is the visible cue. One VoiceOver element. */
function StyleCard({ p }: { p: ProfileRow }) {
  const picks = picksOf(p.styles);
  const edit = () => router.push('/you/profile');
  return (
    <Pressable onPress={edit} accessibilityRole="button" accessibilityLabel={styleCardSpoken(p)} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}>
      <KCard radius={radius.cardSmall}>
        <View style={{ paddingHorizontal: space.rowX, paddingTop: space.s, paddingBottom: space.l, gap: space.s }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 36 }}>
            <MonoLabel>{t('you.style.label')}</MonoLabel>
            {/* A cue, not a second button: the card is the one target (no control nested in a control). */}
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <KText role="textLink" color="ink">
                {t('common.edit')}
              </KText>
            </View>
          </View>
          {picks.length ? (
            // T44: each look is a squared tile with setup's drawn outfits, in pick order (the card is still the one button).
            <StyleTileGrid
              render={(w, row) => picks.map((s, i) => <StyleTile key={s} look={s} width={w} row={row} n={i + 1} first={i === 0} />)}
            />
          ) : (
            <KText variant="subheadline" color="ink2">
              {t('you.style.none')}
            </KText>
          )}
          {basicsLine(p) ? (
            <KText variant="footnote" color="ink3" style={{ marginTop: 2 }}>
              {basicsLine(p)}
            </KText>
          ) : null}
          {/* The drawn figure for advice (#247) goes here later: a faceless, code-drawn figure in his own pieces,
              no ruler and no numbers. Not built yet. */}
        </View>
      </KCard>
    </Pressable>
  );
}

/** Pro only: the indigo woven label with copper stitches on its own row (#246). Free has no row: usage is in Today. */
function PlanRow() {
  return (
    <View testID="you-pro">
      <Pressable
        onPress={() => router.push('/you/plan')}
        accessibilityRole="button"
        accessibilityLabel={t('you.plan.pro')}
        accessibilityHint={t('settings.plan')}
        style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
      >
        <KCard radius={radius.cardSmall}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.rowX, paddingVertical: space.rowY, minHeight: 52 }}>
            <WovenLabel text={t('brand.wordmark.pro')} size="small" tone="pro" spokenLabel={t('you.plan.pro')} />
            <KText variant="subheadline" color="ink2" style={{ flex: 1 }}>
              {t('you.plan.pro')}
            </KText>
            <Icon name="next" size="small" color="ink3" weight="semibold" scalesWithText />
          </View>
        </KCard>
      </Pressable>
    </View>
  );
}

function questionsLeft(n: number): string {
  return n === 1 ? t('you.today.question1') : t('you.today.questions', { n });
}

/** Today's check and questions (the mockup's last card). Free: done / next at 4 am, the re-check, questions left.
 *  Pro and the beta (FP7): the day's counts. Its button (#370): Check my fit while a check is left, else Re-check
 *  while today's re-check is open. */
function TodayCard({ s }: { s: QuotaSnapshot }) {
  const { isAccessibilitySize } = useTheme();
  const paywallShown = usePaywallOn();
  const qLeft = Math.max(0, s.questionLimit - s.questionsUsed);
  const cLeft = Math.max(0, s.checkLimit - s.checksUsed);
  const act = todayAction(s);
  const tryPro = paywallShown && s.tier === 'free';
  let title: string;
  let right: string | null;
  let line: string;
  if (s.pro || s.tier === 'beta') {
    title = t('you.today.title');
    right = t('you.today.resets');
    line = t('you.today.pro', { checks: cLeft, checkLimit: s.checkLimit, questions: qLeft, questionLimit: s.questionLimit });
  } else if (cLeft > 0) {
    title = t('you.today.free');
    right = null;
    line = questionsLeft(qLeft);
  } else {
    title = t('you.today.done');
    right = t('you.today.next');
    line = s.recheckOpen ? [t('you.today.recheck'), questionsLeft(qLeft)].join(' · ') : questionsLeft(qLeft);
  }
  return (
    <View testID="you-today">
      <KCard radius={radius.cardSmall}>
        <View style={{ paddingHorizontal: space.rowX, paddingVertical: 14, gap: 2 }} accessible accessibilityLabel={[title, right, line].filter(Boolean).join('. ')}>
          <View style={isAccessibilitySize ? { gap: 2 } : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.m }}>
            <KText variant="callout" weight="600" style={{ flexShrink: 1 }}>
              {title}
            </KText>
            {right ? (
              <KText variant="footnote" color="ink3">
                {right}
              </KText>
            ) : null}
          </View>
          <KText variant="footnote" color="ink3">
            {line}
          </KText>
        </View>
        {act || tryPro ? (
          <View style={{ paddingHorizontal: space.rowX, paddingBottom: space.m, gap: space.s }}>
            {act?.kind === 'check' ? (
              <KButton title={t('closet.empty.check')} icon="camera" size="regular" fullWidth onPress={() => goToStylist({ kind: 'checkMyFit' })} />
            ) : act?.kind === 'recheck' ? (
              <KButton title={t('look.recheck')} icon="recheck" size="regular" fullWidth onPress={() => goToStylist({ kind: 'recheck', checkId: act.checkId })} />
            ) : null}
            {/* Free: a quiet outlined "Try Pro" (02 D17), only once the paywall exists. */}
            {tryPro ? <KButton kind="outline" size="regular" fullWidth title={t('you.plan.tryPro')} onPress={() => router.push('/paywall?from=you')} /> : null}
          </View>
        ) : null}
      </KCard>
    </View>
  );
}
