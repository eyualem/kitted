// The answer while it streams (07 §6.1, 02 S25): three 6 pt ink3 dots pulsing in the stylist's place until the first
// words (a static "…" with Reduce Motion), then the words as they arrive. Drawn after the thread's rows; the row is
// written to the chat table once, when the answer is done, and this one steps aside when the thread shows it.
// VoiceOver skips it while it streams; the finished answer is announced once (features/ask/session.ts).
import { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { cancelAnimation, FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { KText, StylistMessage, useTheme } from '@/design-system';
import { AnswerBody, answerLayout, useAnswerCloset } from './AnswerBody';
import { t } from '@/i18n/en';
import { liveRowSpoken, type LiveAnswer } from './live';

export { liveRowShows, liveRowSpoken } from './live';

export function LiveAnswerRow({ live }: { live: LiveAnswer }) {
  const text = live.phase === 'waiting' ? '' : live.text;
  const closet = useAnswerCloset();
  const spoken = liveRowSpoken(live);
  const slow = live.phase === 'waiting' && live.slow === true;
  // "Taking longer…" is said once when it shows: he may be waiting on the row from elsewhere on the screen.
  useEffect(() => {
    if (slow) AccessibilityInfo.announceForAccessibility?.(t('ask.slow'));
  }, [slow]);
  // Look C (#302): drawn like the stored answer it becomes (the mark, the lead, the chips), so nothing jumps when
  // the thread's row takes over. The dots sit in the text column, beside the mark.
  return (
    // While it's on its way the row is one element, "Your stylist is writing" (it was hidden, so a VoiceOver user heard
    // nothing for up to 20 s); the words as they stream aren't read (half sentences), the finished answer is announced.
    <View accessible={spoken !== null} accessibilityLabel={spoken ?? undefined}>
      <StylistMessage
        showHeader
        body={
          text ? (
            // The first words fade in once (180 ms; none with Reduce Motion), then sentences join as they pass.
            <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}>
              <AnswerBody layout={answerLayout(text, closet)} />
            </Animated.View>
          ) : (
            <View style={{ gap: 4 }}>
              <TypingDots />
              {live.phase === 'waiting' && live.slow ? (
                <KText role="miniLabel" color="ink3">
                  {t('ask.slow')}
                </KText>
              ) : null}
            </View>
          )
        }
      >
        {text}
      </StylistMessage>
    </View>
  );
}

const DOT = 6;
/** At the accessibility sizes 6 pt dots were lost beside the huge words (07 §17, U13). */
const DOT_AX = 10;
const PULSE_MS = 420;

export function TypingDots() {
  const { a11y, isAccessibilitySize } = useTheme();
  const d = isAccessibilitySize ? DOT_AX : DOT;
  if (a11y.reduceMotion) {
    return (
      <KText role="chatText" color="ink3">
        …
      </KText>
    );
  }
  return (
    <View style={{ flexDirection: 'row', gap: d - 1, alignItems: 'center', height: d * 3.5, paddingLeft: 2 }}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} d={d} />
      ))}
    </View>
  );
}

function Dot({ index, d }: { index: number; d: number }) {
  const { colors } = useTheme();
  const p = useSharedValue(0.35);
  useEffect(() => {
    p.set(withDelay(index * 140, withRepeat(withSequence(withTiming(1, { duration: PULSE_MS }), withTiming(0.35, { duration: PULSE_MS })), -1)));
    return () => cancelAnimation(p);
  }, [p, index]);
  return <DotView p={p} color={colors.ink3} d={d} />;
}

function DotView({ p, color, d }: { p: SharedValue<number>; color: string; d: number }) {
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 1.5 }] }));
  return <Animated.View style={[{ width: d, height: d, borderRadius: d / 2, backgroundColor: color }, style]} />;
}
