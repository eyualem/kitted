// Y1 · You (02 D17, revised Oct 14 in mockups/theme-round2.html, DECISIONS-LOG #246): "how your stylist sees you".
// His style card (looks in pick order, basics in one quiet line), the plan row on Pro, what the stylist knows, and
// today's check (with Check my fit or Re-check, #370), and Privacy & data one tap away (also in Settings, behind the
// gear). No stats, no body, no copper here (copper is for score movement, #231). The ScrollView is the screen's first
// view so the iOS 26 tab bar shrinks on scroll.
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, KButton, KCard, KText, MonoLabel, TextLink, WovenLabel, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ProfileRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { styleLabel } from '@/features/morning/copy';
import { FactCard } from '@/features/you/FactRows';
import { FACTS_ON_YOU, liveFacts } from '@/features/you/facts';
import { NumberedPill } from '@/features/you/NumberedPill';
import { basicsLine, blankProfile, picksOf, styleCardSpoken } from '@/features/you/profile';
import { todayAction } from '@/features/you/today';
import { t } from '@/i18n/en';
import type { QuotaSnapshot } from '@/services/quota';
import { useIsPro } from '@/services/entitlements';
import { usePaywallOn } from '@/features/paywall/switch';
import { goToStylist } from '@/router/stylistAction';

export default function YouScreen() {
  const { colors } = useTheme();
  const isPro = useIsPro();
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  const facts = useLive(['facts'], async () => liveFacts(await store.facts.all()), []);
  const usage = useLive(['usage', 'fitChecks'], () => quota.snapshot(), [isPro]);
  if (profile === undefined || !facts || !usage) return null;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.stack }}>
      {/* No profile (an install that skipped onboarding): the blank card still opens the editor. */}
      <StyleCard p={profile ?? blankProfile(0)} />
      {usage.purchased ? <PlanRow /> : null}
      <View style={{ gap: space.s, marginTop: space.xs }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.m, paddingHorizontal: space.xs }}>
          <View style={{ flexShrink: 1 }} accessibilityRole="header">
            <MonoLabel>{t('you.knows')}</MonoLabel>
          </View>
          {facts.length > 0 ? <TextLink title={t('you.seeAll', { n: facts.length })} onPress={() => router.push('/you/knows')} compact /> : null}
        </View>
        <FactCard facts={facts.slice(0, FACTS_ON_YOU)} />
      </View>
      <TodayCard s={usage} />
      <PrivacyRow />
    </ScrollView>
  );
}

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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
              {picks.map((s, i) => (
                <NumberedPill key={s} n={i + 1} title={styleLabel(s)} filled={i === 0} />
              ))}
            </View>
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
  );
}

function questionsLeft(n: number): string {
  return n === 1 ? t('you.today.question1') : t('you.today.questions', { n });
}

/** Privacy & data, one tap from You (09 §2: three taps deep before, under the gear). It stays in Settings too. */
function PrivacyRow() {
  return (
    <Pressable
      onPress={() => router.push('/you/privacy')}
      accessibilityRole="button"
      accessibilityLabel={t('settings.privacy')}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
    >
      <KCard radius={radius.cardSmall}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.rowX, paddingVertical: space.rowY, minHeight: 52 }}>
          <Icon name="lock" size="small" color="ink2" scalesWithText />
          <KText variant="callout" weight="500" style={{ flex: 1 }}>
            {t('settings.privacy')}
          </KText>
          <Icon name="next" size="small" color="ink3" weight="semibold" scalesWithText />
        </View>
      </KCard>
    </Pressable>
  );
}

/** Today's check and questions (the mockup's last card). Free: done / next at 4 am, the re-check, questions left.
 *  Its button (#370): Check my fit while a check is left, else Re-check while today's re-check is open. */
function TodayCard({ s }: { s: QuotaSnapshot }) {
  const { isAccessibilitySize } = useTheme();
  const paywallShown = usePaywallOn();
  const qLeft = Math.max(0, s.questionLimit - s.questionsUsed);
  const cLeft = Math.max(0, s.checkLimit - s.checksUsed);
  const act = todayAction(s);
  const tryPro = paywallShown && !s.pro;
  let title: string;
  let right: string | null;
  let line: string;
  if (s.pro) {
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
  );
}
