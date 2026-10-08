// S5q · One quick tap (02 "S5q", DECISIONS-LOG #85, #120): the reading card's slot while the check is 'asking'.
// One question before the score: a look-alike pair ("Jeans or sweatpants?", two answers) or the shoe question
// ("Boots, sneakers or slides?", three), equal buttons in the question's word order (no scores shown), and Skip
// (a pair: the more generous reading; the shoe question: the kind that was read). Built from existing parts only.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { KButton, KCard, KCardSection, KText, Seam, TagLine, opacity, size, space, useTheme } from '@/design-system';
import type { FitCheckRow, TapState } from '@/data/types';
import { fitCheck } from '@/features/fitcheck/session';
import { occasionLabel } from '@/features/stylist/thread';
import { en, t } from '@/i18n/en';

/** Checks answered on this device just now: their result card takes VoiceOver focus once it appears. */
export const justAnswered = new Set<string>();

const deck = en as Record<string, string | undefined>;

/** The deck's words for the question and its answers (core's text, kept identical by copyChecks); core's own
 *  text if a pair is ever added to the rubric before the deck. */
export function tapQuestion(tap: Pick<TapState, 'pair' | 'question'>): string {
  return deck[`tap.q.${tap.pair.split('/').join('_')}`] ?? tap.question;
}
/** What a stored value is called on the buttons and in sentences: the shoe question's kind ("boots"), else the value. */
export function tapWord(tap: Pick<TapState, 'options'>, value: string): string {
  return tap.options.find((o) => o.value === value)?.group ?? value;
}
export function tapOption(value: string): string {
  return deck[`tap.opt.${value}`] ?? value.replace(/_/g, ' ');
}
/** The answer inside a sentence: "I'll score it as jeans." */
export function tapAs(value: string): string {
  return deck[`tap.as.${value}`] ?? value.replace(/_/g, ' ');
}

export function TapCard({ row }: { row: FitCheckRow }) {
  const tap = row.details.tap!;
  const { colors, a11y, isAccessibilitySize } = useTheme();
  const [busy, setBusy] = useState(tap.answer !== null);
  const question = tapQuestion(tap);
  const choice = tapAs(tapWord(tap, tap.default));

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(t('tap.a11y.announce', { question }));
  }, [question]);

  const pick = (a: string) => {
    if (busy) return;
    setBusy(true);
    if (Platform.OS === 'ios') void Haptics.selectionAsync();
    justAnswered.add(row.id);
    void fitCheck.answerTap(row.id, a).then((r) => {
      if (!r) {
        justAnswered.delete(row.id);
        setBusy(false);
      }
    });
  };

  return (
    <Animated.View entering={a11y.reduceMotion ? undefined : FadeIn.duration(180)}>
      <KCard>
        <KCardSection>
          <TagLine left={t(row.isPartial ? 'card.tag.partial' : 'card.tag.full')} right={occasionLabel(tap.occasion)} />
          <View style={styles.qRow}>
            {isAccessibilitySize ? null : (
              <View
                style={[styles.placeholder, { backgroundColor: colors.surface2 }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            )}
            <View style={styles.qText}>
              <KText variant="headline" accessibilityRole="header">
                {question}
              </KText>
              <KText variant="subheadline" color="ink2">
                {t('tap.hint')}
              </KText>
            </View>
          </View>
          <View style={isAccessibilitySize ? styles.stack : styles.pair}>
            {tap.order.map((v) => (
              <KButton
                key={v}
                title={tapOption(tapWord(tap, v))}
                kind="secondary"
                size="regular"
                fullWidth={isAccessibilitySize}
                disabled={busy}
                accessibilityHint={t('tap.a11y.optionHint', { choice: tapAs(tapWord(tap, v)) })}
                style={isAccessibilitySize ? undefined : styles.half}
                onPress={() => pick(v)}
              />
            ))}
          </View>
        </KCardSection>
        <Seam />
        <Pressable
          onPress={() => pick('skip')}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('tap.a11y.skip', { choice })}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [styles.skip, { opacity: pressed ? opacity.pressed : busy ? opacity.disabled : 1 }]}
        >
          <KText role="textLink" color="ink2">
            {t('tap.skip')}
          </KText>
          <KText variant="footnote" color="ink3" style={{ flexShrink: 1 }}>
            {t(tap.kind === 'shoes' ? 'tap.skipNote.shoes' : 'tap.skipNote', { choice })}
          </KText>
        </Pressable>
      </KCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  placeholder: { width: 76, height: 62, borderRadius: 12 },
  qText: { flex: 1, gap: 4 },
  pair: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  stack: { gap: 8 },
  skip: { minHeight: size.hit, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 10, rowGap: 2, paddingHorizontal: space.cardPadH, paddingVertical: 10 },
});
