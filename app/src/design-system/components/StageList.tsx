// StageList (`.steps`, `.st`) — the loading rows inside the skeleton fit-check card (03 §5, 02 D6).
// Rows: 24 pt circle (1.5 pt line ring) | 13 gap | label (callout ink3) | optional mono count.
// 12 pt between rows. States: pending (ring, ink3) · now (copper ring with the top segment
// clear, spinning once a second; label semibold ink) · done (filled ink circle, surface check).
// Reduce Motion: no spin, the ring is fully copper. Each stage is announced once; the list is
// one VoiceOver element whose value is "Checking fit, step 2 of 4".
// The four rows (exact copy, 02 D6): Finding your pieces → Checking fit → Colors & proportion
// → Writing your fixes. "Photo looks good" / "Sending…" are internal events, not rows.

import { useEffect, useRef } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { size } from '../tokens';
import { Icon } from './Icon';
import { KText } from './KText';

export type StageState = 'pending' | 'now' | 'done';

export interface Stage {
  label: string;
  state: StageState;
  /** "3 of 4" */
  count?: string;
}

export const defaultStageLabels = ['Finding your pieces', 'Checking fit', 'Colors & proportion', 'Writing your fixes'] as const;

function SpinningRing({ reduceMotion }: { reduceMotion: boolean }) {
  const { colors } = useTheme();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(turn);
      turn.value = 0;
      return;
    }
    turn.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(turn);
  }, [reduceMotion, turn]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Animated.View
      style={[
        {
          width: size.stageDot,
          height: size.stageDot,
          borderRadius: size.stageDot / 2,
          borderWidth: 1.5,
          borderColor: colors.accent,
          borderTopColor: reduceMotion ? colors.accent : 'transparent',
        },
        reduceMotion ? null : spinStyle,
      ]}
    />
  );
}

export function StageList({ stages }: { stages: readonly Stage[] }) {
  const { colors, a11y } = useTheme();
  const nowIndex = stages.findIndex((s) => s.state === 'now');
  const announced = useRef(-1);

  useEffect(() => {
    if (nowIndex >= 0 && nowIndex !== announced.current) {
      announced.current = nowIndex;
      const s = stages[nowIndex];
      if (s) AccessibilityInfo.announceForAccessibility(s.label);
    }
  }, [nowIndex, stages]);

  const current = stages[nowIndex] ?? stages[stages.length - 1];
  const value = current ? `${current.label}, step ${(nowIndex >= 0 ? nowIndex : stages.length - 1) + 1} of ${stages.length}` : '';

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Checking your fit" accessibilityValue={{ text: value }} style={{ gap: 12 }}>
      {stages.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          {s.state === 'now' ? (
            <SpinningRing reduceMotion={a11y.reduceMotion} />
          ) : (
            <View
              style={{
                width: size.stageDot,
                height: size.stageDot,
                borderRadius: size.stageDot / 2,
                borderWidth: 1.5,
                borderColor: s.state === 'done' ? colors.ink : colors.line,
                backgroundColor: s.state === 'done' ? colors.ink : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.state === 'done' ? <Icon name="check" size={12} weight="bold" color={colors.surface} /> : null}
            </View>
          )}
          <KText role="stageRow" weight={s.state === 'now' ? '600' : undefined} color={s.state === 'pending' ? 'ink3' : 'ink'} style={{ flex: 1 }}>
            {s.label}
          </KText>
          {s.count ? <KText role="stageCount">{s.count}</KText> : null}
        </View>
      ))}
    </View>
  );
}
