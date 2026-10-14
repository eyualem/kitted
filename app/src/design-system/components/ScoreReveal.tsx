// The score reveal's drawing (DECISIONS-LOG #242, #246 point 16): a tape of half-step values slides under the numeral
// and settles on the score, then the numeral locks in ink. Everything here is driven by one timeline value `t` (ms
// from the start, before the slow factor; features/fitcheck/reveal.ts makes the plans and runs it). Past the end
// every piece sits exactly where today's card draws it, so nothing jumps when the reveal finishes.
//
// Layout rule: each piece keeps its final size from the first frame (only opacity and transforms move), so the card
// never changes height while it plays and the thread's scroll-to-end stays put.

import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { displayScore } from '../score';
import { Numeral } from './Numeral';

/** One element's window on the timeline (ms), with an optional rise in pt. Same shape as reveal.ts's Step. */
export interface RevealStep {
  at: number;
  ms: number;
  rise?: number;
}

/** Past every window: the final state. */
export const REVEAL_END = 1e9;

const easeOut = Easing.out(Easing.cubic);

/** 0 → 1 across a step's window (a zero-length step jumps at `at`). */
export function stepP(t: number, s: RevealStep): number {
  'worklet';
  if (s.ms <= 0) return t >= s.at ? 1 : 0;
  return Math.min(1, Math.max(0, (t - s.at) / s.ms));
}

/** Fades (and rises) its children in over `step`. Without a timeline it's a plain View (today's card). */
export function RevealStepView({ t, step, children, style }: { t?: SharedValue<number>; step?: RevealStep | null; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  if (!t || !step) return style ? <View style={style}>{children}</View> : <>{children}</>;
  return <AnimatedStep t={t} step={step} style={style}>{children}</AnimatedStep>;
}

function AnimatedStep({ t, step, children, style }: { t: SharedValue<number>; step: RevealStep; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const a = useAnimatedStyle(() => {
    const p = stepP(t.value, step);
    return { opacity: p, transform: [{ translateY: (step.rise ?? 0) * (1 - easeOut(p)) }] };
  });
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** "/10" (and the tap cue): faint while waiting (hidden for the quiet fade), full at the lock. */
export function useOutOfStyle(t: SharedValue<number> | undefined, step: RevealStep | null | undefined, from: number) {
  return useAnimatedStyle(() => {
    if (!t || !step) return { opacity: 1 };
    return { opacity: from + (1 - from) * stepP(t.value, step) };
  });
}

export interface TapeNumeralProps {
  t: SharedValue<number>;
  /** The final score. */
  score: number;
  /** The tape's values (reveal.ts tapeValues: ends exactly on the score). Empty: no tape. */
  values: readonly number[];
  size: number;
  face?: 'score' | 'scoreLight';
  /** The tape slides (null: no tape). */
  tape: RevealStep | null;
  /** "–.–" → the numeral cross-fade, without a tape. */
  swap: RevealStep | null;
  /** The numeral locks in ink; the tape and its ticks fade out over this window. */
  lock: RevealStep;
  /** No "–.–" while waiting (the quiet fade; the re-check's new score, which arrives on the tape). */
  noDash?: boolean;
}

/** The numeral slot: the real numeral (laid out first, so the row's baseline and width are today's), with the
 *  waiting "–.–" and the tape drawn over it inside a clip the numeral's width. */
export function TapeNumeral({ t, score, values, size, face = 'score', tape, swap, lock, noDash }: TapeNumeralProps) {
  const { colors } = useTheme();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!box || box.w !== width || box.h !== height) setBox({ w: width, h: height });
  };
  const numStyle = useAnimatedStyle(() => {
    const s = tape ? lock : swap ?? lock;
    return { opacity: stepP(t.value, s) };
  });
  const dashStyle = useAnimatedStyle(() => {
    if (noDash) return { opacity: 0 };
    if (tape) return { opacity: 1 - stepP(t.value, { at: tape.at, ms: 100 }) };
    return { opacity: 1 - stepP(t.value, swap ?? lock) };
  });
  const tapeStyle = useAnimatedStyle(() => ({ opacity: tape ? 1 - stepP(t.value, lock) : 0 }));
  return (
    <View>
      <Animated.View style={numStyle} onLayout={onLayout}>
        <Numeral size={size} face={face}>{displayScore(score)}</Numeral>
      </Animated.View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, dashStyle]}>
          <Numeral size={size} face={face} color={colors.ink3}>{'–.–'}</Numeral>
        </Animated.View>
        {tape && box && values.length > 0 ? (
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: box.w, height: box.h }, tapeStyle]}>
            {values.map((v, i) => (
              <TapeCell key={i} t={t} index={i} count={values.length} value={v} clipW={box.w} h={box.h} size={size} face={face} tape={tape} />
            ))}
            {/* The tape window's shaded edges, like a tape measure's housing: digits fade into the card instead of
                being cut. Card surface → clear, a quarter of the window wide on each side. */}
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: box.w * 0.28, experimental_backgroundImage: sideFade(colors.surface, 90) }} />
            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: box.w * 0.28, experimental_backgroundImage: sideFade(colors.surface, 270) }} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

/** A horizontal fade from the card colour (at the window edge) to clear (inward). */
function sideFade(hex: string, deg: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  return `linear-gradient(${deg}deg, rgba(${rgb}, 1) 0%, rgba(${rgb}, 0.7) 40%, rgba(${rgb}, 0) 100%)`;
}

/** Values sit ~1.35 numeral widths apart, so mostly one is in the window at a time. */
const CELL = 1.35;

function TapeCell({ t, index, count, value, clipW, h, size, face, tape }: {
  t: SharedValue<number>; index: number; count: number; value: number; clipW: number; h: number; size: number; face: 'score' | 'scoreLight'; tape: RevealStep;
}) {
  const { colors } = useTheme();
  const W = clipW * CELL;
  // Start: the first value just off the clip's right edge. End: the last value (the score) exactly over the numeral.
  const x0 = clipW;
  const x1 = -(count - 1) * W - (W - clipW) / 2;
  const style = useAnimatedStyle(() => {
    const x = x0 + (x1 - x0) * easeOut(stepP(t.value, tape));
    const center = index * W + W / 2 + x;
    const d = Math.abs(center - clipW / 2);
    return { transform: [{ translateX: x }], opacity: interpolate(d, [0, clipW * 0.2, clipW * 0.48], [1, 0.75, 0], 'clamp') };
    // Fully faded by the time a value's centre reaches the clip edge, so a value is never seen cut in half.
  });
  const tick = (k: number) => (
    <View
      key={k}
      style={{ position: 'absolute', top: 2, left: W / 2 + (k * W) / 5 - 0.5, width: 1, height: k === 0 ? 7 : 4, backgroundColor: colors.ink3 }}
    />
  );
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: index * W, width: W, height: h, alignItems: 'center' }, style]}>
      <Numeral size={size} face={face} color={colors.ink3}>{displayScore(value)}</Numeral>
      {[-2, -1, 0, 1, 2].map(tick)}
    </Animated.View>
  );
}
