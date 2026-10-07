// The live score line at the bottom of an editing sheet (S8, S21): "Score stays 8.0" or
// "Score 8.0 → 9.0" with the new score in copper. One VoiceOver element.
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { KText, Numeral, displayScore, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

export function ScoreMoveLine({ before, after, trailing }: { before: number; after: number; trailing?: ReactNode }) {
  const { colors } = useTheme();
  let left: ReactNode;
  if (after === before) {
    const [lead] = t('nqr.scoreStays', { score: '' }).split('{');
    left = (
      <KText variant="subheadline" color="ink2" accessibilityLabel={t('nqr.scoreStays', { score: displayScore(before) })}>
        {lead}
        <KText variant="headline" tabular>
          {displayScore(before)}
        </KText>
      </KText>
    );
  } else {
    left = (
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }} accessible accessibilityLabel={t('nqr.scoreMoves', { from: displayScore(before), to: displayScore(after) })}>
        <KText variant="subheadline" color="ink2">
          {t('nqr.scoreMoves', { from: '', to: '' }).split(' ')[0]}
        </KText>
        <Numeral size={31}>{displayScore(before)}</Numeral>
        <KText variant="subheadline" color="ink2">
          →
        </KText>
        <Numeral size={31} color={colors.accent}>
          {displayScore(after)}
        </Numeral>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
      <View style={{ flexShrink: 1 }}>{left}</View>
      {trailing}
    </View>
  );
}
