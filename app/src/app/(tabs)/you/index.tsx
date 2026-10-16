// Y1 · You (02 D17, revised Oct 14 in mockups/theme-round2.html, DECISIONS-LOG #246): "how your stylist sees you".
// His style card (looks in pick order, basics in one quiet line), the plan row on Pro, what the stylist knows, and
// today's check. Settings sit behind the gear (the header button, `_layout.tsx`); privacy lives there now. No stats,
// no body, no copper here (copper is for score movement, #231). The ScrollView is the screen's first view so the
// iOS 26 tab bar shrinks on scroll.
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, KButton, KCard, KText, MonoLabel, TextLink, WovenLabel, opacity, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ProfileRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { quota } from '@/features/fitcheck/session';
import { styleLabel } from '@/features/morning/copy';
import { YourMovesRow } from '@/features/finish/YourMovesRow';
import { FactCard } from '@/features/you/FactRows';
import { FACTS_ON_YOU, liveFacts } from '@/features/you/facts';
import { NumberedPill } from '@/features/you/NumberedPill';
import { basicsLine, picksOf, styleCardSpoken } from '@/features/you/profile';
import { t } from '@/i18n/en';
import type { QuotaSnapshot } from '@/services/quota';
import { useIsPro } from '@/services/entitlements';
import { usePaywallOn } from '@/features/paywall/switch';

export default function YouScreen() {
  const { colors } = useTheme();
  const isPro = useIsPro();
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  const facts = useLive(['facts'], async () => liveFacts(await store.facts.all()), []);
  const usage = useLive(['usage', 'fitChecks'], () => quota.snapshot(), [isPro]);
  if (profile === undefined || !facts || !usage) return null;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.stack }}>
      {/* Pinned atop while a move is left (02 S14, D17; 10-onboarding.md §9.9). */}
      <YourMovesRow href="/you/moves" />
      {profile ? <StyleCard p={profile} /> : null}
      {usage.pro ? <PlanRow /> : null}
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
    </ScrollView>
  );
}

/** The whole card opens Y2; "Edit" is the visible cue. One VoiceOver element. */
function StyleCard({ p }: { p: ProfileRow }) {
  const picks = picksOf(p.styles);
  const edit = () => router.push('/you/profile');
  return (
    <Pressable onPress={edit} accessibilityRole="button" accessibilityLabel={styleCardSpoken(p)} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}>
      <KCard>
        <View style={{ paddingHorizontal: space.rowX, paddingTop: space.s, paddingBottom: space.l, gap: space.s }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 36 }}>
            <MonoLabel>{t('you.style.label')}</MonoLabel>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <TextLink title={t('common.edit')} onPress={edit} compact />
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
      <KCard>
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

/** Today's check and questions (the mockup's last card). Free: done / next at 4 am, the re-check, questions left. */
function TodayCard({ s }: { s: QuotaSnapshot }) {
  const { isAccessibilitySize } = useTheme();
  const paywallShown = usePaywallOn();
  const qLeft = Math.max(0, s.questionLimit - s.questionsUsed);
  const cLeft = Math.max(0, s.checkLimit - s.checksUsed);
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
    <KCard>
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
      {/* Free: a quiet outlined "Try Pro" (02 D17), only once the paywall exists. */}
      {paywallShown && !s.pro ? (
        <View style={{ paddingHorizontal: space.rowX, paddingBottom: space.m }}>
          <KButton kind="outline" size="regular" title={t('you.plan.tryPro')} onPress={() => router.push('/paywall?from=you')} />
        </View>
      ) : null}
    </KCard>
  );
}
