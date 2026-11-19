// The look of Kit's arrival (arrival.ts decides who moves): fade in while rising ARRIVE.risePt, ARRIVE.riseMs long,
// after `delay` ms. Reduce Motion: the same fade, no rise (how GoingFor.tsx reads `a11y.reduceMotion`).
// One function per delay, kept: the screen draws often, and a new function each time would make every row's
// `entering` prop look changed. The fade runs with Reduce Motion on (Reanimated would otherwise skip it).
import { Easing, FadeIn, ReduceMotion, withDelay, withTiming } from 'react-native-reanimated';
import type { ComponentProps } from 'react';
import type Animated from 'react-native-reanimated';
import { ARRIVE, ARRIVE_CARD } from './arrival';

type Entering = NonNullable<ComponentProps<typeof Animated.View>['entering']>;
const made = new Map<string, Entering>();

export function arrivalEntering(delay: number, reduceMotion: boolean): Entering {
  const key = `${delay}:${reduceMotion ? 'fade' : 'rise'}`;
  let enter = made.get(key);
  if (!enter) {
    if (reduceMotion) {
      enter = FadeIn.duration(ARRIVE.riseMs).delay(delay).reduceMotion(ReduceMotion.Never);
    } else {
      enter = () => {
        'worklet';
        const timing = { duration: ARRIVE.riseMs, easing: Easing.out(Easing.cubic) };
        return {
          initialValues: { opacity: 0, transform: [{ translateY: ARRIVE.risePt }] },
          animations: {
            opacity: withDelay(delay, withTiming(1, timing)),
            transform: [{ translateY: withDelay(delay, withTiming(0, timing)) }],
          },
        };
      };
    }
    made.set(key, enter);
  }
  return enter;
}

/** The card under a just-finished answer (ARRIVE_CARD): fades in while rising 12 pt over 280 ms, 120 ms after the words.
 *  Reduce Motion: a 200 ms fade, no rise. */
export function cardEntering(reduceMotion: boolean): Entering {
  return riseOrFade(`card:${reduceMotion}`, ARRIVE_CARD.delayMs, reduceMotion);
}

/** The follow-up taps after the card: each fades in, 50 ms apart, once the card has settled. */
export function tapEntering(i: number, reduceMotion: boolean): Entering {
  const after = ARRIVE_CARD.delayMs + (reduceMotion ? ARRIVE_CARD.fadeMs : ARRIVE_CARD.riseMs) + i * ARRIVE_CARD.tapStaggerMs;
  const key = `tap:${after}`;
  let enter = made.get(key);
  if (!enter) {
    enter = FadeIn.duration(ARRIVE_CARD.fadeMs).delay(after).reduceMotion(ReduceMotion.Never);
    made.set(key, enter);
  }
  return enter;
}

function riseOrFade(key: string, delay: number, reduceMotion: boolean): Entering {
  let enter = made.get(key);
  if (!enter) {
    if (reduceMotion) {
      enter = FadeIn.duration(ARRIVE_CARD.fadeMs).delay(delay).reduceMotion(ReduceMotion.Never);
    } else {
      enter = () => {
        'worklet';
        const timing = { duration: ARRIVE_CARD.riseMs, easing: Easing.out(Easing.cubic) };
        return {
          initialValues: { opacity: 0, transform: [{ translateY: ARRIVE_CARD.risePt }] },
          animations: {
            opacity: withDelay(delay, withTiming(1, timing)),
            transform: [{ translateY: withDelay(delay, withTiming(0, timing)) }],
          },
        };
      };
    }
    made.set(key, enter);
  }
  return enter;
}
