// O1e · Example check (02 §3.1, 10-onboarding.md §2, §14): "Here's an example check." Welcome's drawn outfit where his
// photo would be (no photo since #388), then the result card the engine gives it (exampleCheck.ts), with "Why {score}?" opening the math in place. Read-only:
// no Not quite right?, Re-check or Share. No photo is sent, no consent is needed and nothing is saved. From Welcome the
// dock says Get started; from Consent, "Check my own fit" goes back to the agreement.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FixRow, IconButton, KButton, KCard, KCardSection, KText, RowDivider, ScoreBlock, Seam, StylistMessage, TagLine, TextLink, TextLinkRow, TipLine,
  displayScore, space, spokenScore, useTheme,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { garmentLabel } from '@/features/fitcheck/labels';
import { PartsBreakdown } from '@/features/why/PartsBreakdown';
import { t } from '@/i18n/en';
import { store } from '@/data/db';
import { exampleCheck } from './exampleCheck';
import { OnboardingNav } from './OnboardingNav';
import { WelcomeOutfit } from './WelcomeHero';

/** `sheet`: from S26's "See an example" after onboarding (09-ui-review §20.8 G23): an X closes it, and "Check my own
 *  fit" closes it and opens the agreement as a sheet. */
export function ExampleCheckScreen({ mode = 'screen' }: { mode?: 'screen' | 'sheet' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const sheet = mode === 'sheet';
  const fromConsent = from === 'consent' || sheet;
  const [why, setWhy] = useState(false);
  const ex = exampleCheck();

  const back = () => (router.canGoBack() ? router.back() : router.replace('/onboarding/welcome'));
  const go = () => {
    if (sheet) {
      router.back();
      setTimeout(() => router.push('/sheets/consent'), 350);
      return;
    }
    if (fromConsent) return back();
    void store.setKv('onboarding.step', 'looks');
    router.push('/onboarding/looks');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: sheet ? space.s : insets.top }]}>
      {sheet ? (
        <View style={styles.closeRow}>
          <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
        </View>
      ) : (
        <OnboardingNav onBack={back} />
      )}
      <ScrollView contentContainerStyle={styles.thread}>
        <StylistMessage showHeader>{t('onb.example.intro')}</StylistMessage>
        {ex ? (
          <View
            style={{ alignSelf: 'flex-end', alignItems: 'flex-end', gap: 4 }}
            accessible
            accessibilityLabel={t('onb.example.outfitA11y', { pieces: ex.pieces.map((p) => garmentLabel(p.garment)).join(', ') })}
          >
            <WelcomeOutfit pieces={ex.pieces} width={150} height={196} />
            <KText variant="footnote" color="ink3">{`${t('onb.welcome.cardOccasion')} · ${t('onb.example.time')}`}</KText>
          </View>
        ) : null}
        {ex ? (
          <KCard
            accessibilityLabel={t('onb.example.a11y', {
              occasion: t('onb.welcome.cardOccasion'), score: spokenScore(ex.score), word: scoreWordLabel(ex.score), summary: ex.summary ?? '',
            })}
          >
            <KCardSection>
              <TagLine left={t('onb.example.tag')} right={t('onb.welcome.cardOccasion')} />
              <ScoreBlock score={ex.score} verdict={ex.summary ?? undefined} onPress={() => setWhy((w) => !w)} />
            </KCardSection>
            {ex.fixes.length > 0 || ex.nextLevel ? (
              <>
                <Seam />
                <KCardSection paddingVertical={4} gap={0}>
                  {ex.fixes.map((f, i) => (
                    <View key={f.target + i}>
                      {i > 0 ? <RowDivider /> : null}
                      <FixRow number={i + 1} title={f.copy} detail={f.tag} gain={t('card.gainTo', { score: displayScore(f.to) })} />
                    </View>
                  ))}
                  {ex.nextLevel ? <TipLine lead={t('card.nextLevel')} text={ex.nextLevel} first={ex.fixes.length === 0} /> : null}
                </KCardSection>
              </>
            ) : null}
            <Seam />
            <KCardSection gap={6}>
              <TextLinkRow>
                <TextLink title={why ? t('onb.example.whyHide') : t('card.why', { score: displayScore(ex.score) })} onPress={() => setWhy((w) => !w)} compact />
              </TextLinkRow>
            </KCardSection>
          </KCard>
        ) : null}
        {/* The math sits under the card at the thread's width, as in the Why sheet (inside the card its amounts clipped). */}
        {why && ex?.why ? <PartsBreakdown parts={ex.why} score={ex.score} /> : null}
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: 4 }}>
          {t('onb.example.note')}
        </KText>
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.l), borderTopColor: colors.line }]}>
        <KButton title={fromConsent ? t('onb.example.ctaOwn') : t('onb.welcome.start')} onPress={go} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  thread: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xl, gap: space.m },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, borderTopWidth: StyleSheet.hairlineWidth },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.gutter },
});
