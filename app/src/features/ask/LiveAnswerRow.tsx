// The answer while it streams (07 §6.1, 02 S25): three 6 pt ink3 dots pulsing in the stylist's place until the first
// words (a static "…" with Reduce Motion), then the words as they arrive. Drawn after the thread's rows; the row is
// written to the chat table once, when the answer is done, and this one steps aside when the thread shows it.
// VoiceOver skips it while it streams; the finished answer is announced once (features/ask/session.ts).
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { KText, StylistMessage, useTheme } from '@/design-system';
import type { LiveAnswer } from './live';

/** Whether the live row still has something to draw, given the ids the thread shows. */
export function liveRowShows(live: LiveAnswer | null, shownIds: ReadonlySet<string>): boolean {
  if (!live) return false;
  return live.phase !== 'done' || !shownIds.has(live.messageId);
}

export function LiveAnswerRow({ live }: { live: LiveAnswer }) {
  const text = live.phase === 'waiting' ? '' : live.text;
  return (
    <View accessibilityElementsHidden={live.phase !== 'done'} importantForAccessibility={live.phase !== 'done' ? 'no-hide-descendants' : 'auto'}>
      {text ? <StylistMessage>{text}</StylistMessage> : <TypingDots />}
    </View>
  );
}

const DOT = 6;
const PULSE_MS = 420;

export function TypingDots() {
  const { a11y } = useTheme();
  if (a11y.reduceMotion) {
    return (
      <KText role="chatText" color="ink3">
        …
      </KText>
    );
  }
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', height: 24, paddingLeft: 2 }}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} />
      ))}
    </View>
  );
}

function Dot({ index }: { index: number }) {
  const { colors } = useTheme();
  const p = useSharedValue(0.35);
  useEffect(() => {
    p.set(withDelay(index * 140, withRepeat(withSequence(withTiming(1, { duration: PULSE_MS }), withTiming(0.35, { duration: PULSE_MS })), -1)));
    return () => cancelAnimation(p);
  }, [p, index]);
  return <DotView p={p} color={colors.ink3} />;
}

function DotView({ p, color }: { p: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 1.5 }] }));
  return <Animated.View style={[{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: color }, style]} />;
}
