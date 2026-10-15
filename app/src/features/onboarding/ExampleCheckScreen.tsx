// O1e · Example check (02 §3.1, 10-onboarding.md §2): "Here's a real check." The Welcome photo as his own photo bubble,
// then the result card the engine gives it (exampleCheck.ts), with "Why 7.5?" opening the math in place. Read-only:
// no Not quite right?, Re-check or Share. No photo is sent, no consent is needed and nothing is saved. From Welcome the
// dock says Get started; from Consent, "Check my own fit" goes back to the agreement.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FixRow, KButton, KCard, KCardSection, KText, PhotoBubble, RowDivider, ScoreBlock, Seam, StylistMessage, TagLine, TextLink, TextLinkRow, TipLine,
  displayScore, space, spokenScore, useTheme,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { demoPhoto } from '@/demo/demoPhotos';
import { PartsBreakdown } from '@/features/why/PartsBreakdown';
import { t } from '@/i18n/en';
import { store } from '@/data/db';
import { exampleCheck } from './exampleCheck';
import { OnboardingNav } from './OnboardingNav';

export function ExampleCheckScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromConsent = from === 'consent';
  const [why, setWhy] = useState(false);
  const ex = exampleCheck();
  const photo = ex ? demoPhoto(ex.photoId) : undefined;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/onboarding/welcome'));
  const go = () => {
    if (fromConsent) return back();
    void store.setKv('onboarding.step', 'looks');
    router.push('/onboarding/looks');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <OnboardingNav onBack={back} />
      <ScrollView contentContainerStyle={styles.thread}>
        <StylistMessage showHeader>{t('onb.example.intro')}</StylistMessage>
        {photo ? (
          <View style={{ alignSelf: 'flex-end' }}>
            <PhotoBubble source={photo.source} aspect={photo.aspect} crop={photo.crop} occasion={t('onb.welcome.cardOccasion')} time={t('onb.example.time')} />
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
});
