// S5 Reading (02 D6, ruling 13): an inline skeleton card that fills in as pieces are found. Since #215 the
// "Going for" question rides inside it ("While I read it", under the stages): it slides in once the first piece is
// found (or 1.2 s in, whichever is first), the skeleton numeral folds away to give it room, and at accessibility sizes
// the stage list shrinks to the current stage. Morphs into the result card in the same thread slot.
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { KCard, KCardSection, Pill, Seam, StageList, TagLine, useTheme } from '@/design-system';
import { defaultStageLabels } from '@/design-system/components/StageList';
import { readingPill } from '@/features/fitcheck/labels';
import { pendingSlots, piecesCount, stageStates, type SessionState } from '@/features/fitcheck/machine';
import { t } from '@/i18n/en';

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

/** The inset arrives with the first piece found, or this long after the read started. */
export const INSET_AFTER_MS = 1200;

/** True once the Going-for inset should show for this read (the first piece, or INSET_AFTER_MS). */
export function useInsetShown(s: Reading, enabled: boolean): boolean {
  const firstPiece = s.slots.length > 0 || s.stage !== 'pieces';
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!enabled || firstPiece) return;
    const h = setTimeout(() => setLate(true), INSET_AFTER_MS);
    return () => clearTimeout(h);
  }, [enabled, firstPiece, s.attempt]);
  return enabled && (firstPiece || late);
}

const layout = LinearTransition.springify().duration(450).dampingRatio(0.85);

export function ReadingCard({ s, inset }: { s: Reading; inset?: ReactNode }) {
  const { isAccessibilitySize, a11y } = useTheme();
  const labels = defaultStageLabels();
  const states = stageStates(s.stage);
  const { found, total } = piecesCount(s);
  const missing = s.slots.filter((x) => x.state === 'missing');
  const pending = s.stage === 'pieces' ? pendingSlots(s) : [];
  const slotWord = (k: string) => (k === 'footwear' ? t('label.slot.footwear') : t('label.slot.bottom'));
  const withInset = !!inset;
  // AX sizes with the question: only the current stage ("Checking fit · 2 of 4"), so the question fits under it.
  const compact = withInset && isAccessibilitySize;
  const nowIndex = Math.max(0, states.indexOf('now'));
  const stages = labels.map((label, i) => ({
    label,
    state: states[i]!,
    count: i === 0 ? t('read.stage.piecesCount', { found, total }) : undefined,
  }));
  const shown = compact ? [{ ...stages[nowIndex]!, count: t('read.stage.piecesCount', { found: nowIndex + 1, total: stages.length }) }] : stages;
  const lay = a11y.reduceMotion ? undefined : layout;
  return (
    // With the question inside, the card isn't one VoiceOver element: the tiles must be reachable one by one.
    <KCard accessibilityLabel={withInset ? undefined : t('read.tag')}>
      <KCardSection>
        <TagLine left={t('read.tag')} right={s.slow ? t('read.slow') : t('read.eta')} />
        {withInset ? null : (
          <Animated.View exiting={a11y.reduceMotion ? undefined : FadeOut.duration(120)} style={styles.scoreRow}>
            <Shimmer style={styles.numeral} />
            <View style={styles.bars}>
              <Shimmer style={styles.bar1} />
              <Shimmer style={styles.bar2} />
            </View>
          </Animated.View>
        )}
        {compact ? null : <Animated.View layout={lay} style={styles.pills}>
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
        </Animated.View>}
      </KCardSection>
      <Seam />
      <Animated.View layout={lay}>
        <KCardSection>
          <StageList stages={shown} />
        </KCardSection>
      </Animated.View>
      {inset}
    </KCard>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  numeral: { width: 76, height: 62, borderRadius: 12 },
  bars: { gap: 8, paddingBottom: 4 },
  bar1: { width: 96, height: 18, borderRadius: 7 },
  bar2: { width: 160, height: 14, borderRadius: 7 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
