// O1e · Example check (02 §3.1, 10-onboarding.md §2; T38): "Here's an example check." Welcome's drawn outfit (the
// bundled s14 reading, drawn by Closet's code, no photo of anyone) in his photo bubble's place, then the result card the
// engine gives that reading (exampleCheck.ts), with "Why 7.5?" opening the math in place. Read-only: no Not quite
// right?, Re-check or Share. Nothing is sent, no consent is needed and nothing is saved. From Welcome the dock says Get
// started; from Consent, "Check my own fit" goes back to the agreement.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FixRow, IconButton, KButton, KCard, KCardSection, KText, RowDivider, ScoreBlock, Seam, StylistMessage, TagLine, TextLink, TextLinkRow, TipLine,
  displayScore, space, spokenScore, useTheme,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { PartsBreakdown } from '@/features/why/PartsBreakdown';
import { t } from '@/i18n/en';
import { store } from '@/data/db';
import { DrawnOutfitBubble } from './DrawnOutfit';
import { exampleCheck } from './exampleCheck';
import { drawnOutfitA11y, drawnPieces } from './outfitDrawing';
import { OnboardingNav } from './OnboardingNav';

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
  const pieces = ex ? drawnPieces(ex.reading) : [];

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
    <View testID="example-root" style={[styles.root, { backgroundColor: colors.bg, paddingTop: sheet ? space.s : insets.top }]}>
      {sheet ? (
        <View style={styles.closeRow}>
          <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
        </View>
      ) : (
        <OnboardingNav onBack={back} />
      )}
      <ScrollView contentContainerStyle={styles.thread}>
        <StylistMessage showHeader>{t('onb.example.intro')}</StylistMessage>
        {ex && pieces.length > 0 ? (
          <View style={{ alignSelf: 'flex-end' }}>
            <DrawnOutfitBubble
              testID="example-bubble"
              pieces={pieces}
              occasion={t('onb.welcome.cardOccasion')}
              time={t('onb.example.time')}
              label={drawnOutfitA11y(pieces, t('onb.welcome.cardOccasion'))}
            />
          </View>
        ) : null}
        {ex ? (
          // KCard takes no testID: the wrapper carries it and the card's one VoiceOver label (as KCard would).
          <View
            testID="example-card"
            accessible
            accessibilityLabel={t('onb.example.a11y', {
              occasion: t('onb.welcome.cardOccasion'), score: spokenScore(ex.score), word: scoreWordLabel(ex.score), summary: ex.summary ?? '',
            })}
          >
            <KCard>
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
          </View>
        ) : null}
        {/* The math sits under the card at the thread's width, as in the Why sheet (inside the card its amounts clipped). */}
        {why && ex?.why ? (
          <View testID="example-math">
            <PartsBreakdown parts={ex.why} score={ex.score} />
          </View>
        ) : null}
        <View testID="example-note" style={{ paddingHorizontal: 4 }}>
          <KText variant="footnote" color="ink3">
            {t('onb.example.note')}
          </KText>
        </View>
      </ScrollView>
      <View testID="example-dock" style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.l), borderTopColor: colors.line }]}>
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
