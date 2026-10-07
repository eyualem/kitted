// S5 Reading (02 D6, ruling 13): an inline skeleton card that fills in as pieces are found,
// then the occasion question under it. Morphs into the result card in the same thread slot.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Chip, ChipFlow, KCard, KCardSection, KText, Pill, Seam, StageList, TagLine, useTheme } from '@/design-system';
import { defaultStageLabels } from '@/design-system/components/StageList';
import { OCCASIONS, type OccasionKey } from '@/data/types';
import { readingPill } from '@/features/fitcheck/labels';
import { pendingSlots, piecesCount, stageStates, type SessionState } from '@/features/fitcheck/machine';
import { t } from '@/i18n/en';
import { occasionLabel } from '../thread';

type Reading = Extract<SessionState, { kind: 'reading' }>;

function Shimmer({ style }: { style: object }) {
  const { colors, a11y } = useTheme();
  const o = useSharedValue(1);
  useEffect(() => {
    if (a11y.reduceMotion) return;
    o.value = withRepeat(withSequence(withTiming(0.55, { duration: 450 }), withTiming(1, { duration: 450 })), -1, false);
    return () => cancelAnimation(o);
  }, [a11y.reduceMotion, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ backgroundColor: colors.surface2 }, style, a11y.reduceMotion ? null : anim]} />;
}

export function ReadingCard({ s }: { s: Reading }) {
  const labels = defaultStageLabels();
  const states = stageStates(s.stage);
  const { found, total } = piecesCount(s);
  const missing = s.slots.filter((x) => x.state === 'missing');
  const pending = s.stage === 'pieces' ? pendingSlots(s) : [];
  const slotWord = (k: string) => (k === 'footwear' ? t('label.slot.footwear') : t('label.slot.bottom'));
  return (
    <KCard accessibilityLabel={t('read.tag')}>
      <KCardSection gap={10}>
        <TagLine left={t('read.tag')} right={s.slow ? t('read.slow') : t('read.eta')} />
        <View style={styles.scoreRow}>
          <Shimmer style={styles.numeral} />
          <View style={styles.bars}>
            <Shimmer style={styles.bar1} />
            <Shimmer style={styles.bar2} />
          </View>
        </View>
        <View style={styles.pills}>
          {s.slots
            .filter((x) => x.state === 'found' && x.garment)
            .map((x, i) => (
              <Pill key={`f${i}`} title={readingPill(x.garment!, x.slot === 'held')} />
            ))}
          {missing.map((x, i) => (
            <Pill key={`m${i}`} tone="pending" title={t('read.notInPhoto', { slot: slotWord(x.slot) })} />
          ))}
          {pending
            .filter((k) => k === 'footwear')
            .map((k) => (
              <Pill key={`p${k}`} tone="pending" title={t('read.pending', { slot: slotWord(k) })} />
            ))}
        </View>
      </KCardSection>
      <Seam />
      <KCardSection>
        <StageList
          stages={labels.map((label, i) => ({
            label,
            state: states[i]!,
            count: i === 0 ? t('read.stage.piecesCount', { found, total }) : undefined,
          }))}
        />
      </KCardSection>
    </KCard>
  );
}

export function OccasionQuestion({ s, onPick }: { s: Reading; onPick: (o: OccasionKey) => void }) {
  return (
    <View style={styles.occasion}>
      <KText variant="subheadline" weight="600">
        {t('read.occasion.q')}
      </KText>
      <ChipFlow accessibilityLabel={t('read.occasion.q')}>
        {OCCASIONS.map((o) => (
          <Chip key={o} title={occasionLabel(o)} state={o === s.occasion ? 'selected' : 'normal'} onPress={() => onPick(o)} />
        ))}
      </ChipFlow>
      {!s.occasionTouched ? (
        <KText variant="footnote" color="ink3" style={{ marginTop: -2 }}>
          {t('read.occasion.hint', { occasion: occasionLabel(s.occasion) })}
        </KText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  numeral: { width: 76, height: 62, borderRadius: 12 },
  bars: { gap: 8, paddingBottom: 4 },
  bar1: { width: 96, height: 18, borderRadius: 7 },
  bar2: { width: 160, height: 14, borderRadius: 7 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  occasion: { gap: 6 },
});
