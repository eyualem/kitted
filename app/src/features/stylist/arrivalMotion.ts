// The look of Kit's arrival (arrival.ts decides who moves): fade in while rising ARRIVE.risePt, ARRIVE.riseMs long,
// after `delay` ms. Reduce Motion: the same fade, no rise (how GoingFor.tsx reads `a11y.reduceMotion`).
// One function per delay, kept: the screen draws often, and a new function each time would make every row's
// `entering` prop look changed.
import { Easing, FadeIn, withDelay, withTiming } from 'react-native-reanimated';
import type { ComponentProps } from 'react';
import type Animated from 'react-native-reanimated';
import { ARRIVE } from './arrival';

type Entering = NonNullable<ComponentProps<typeof Animated.View>['entering']>;
const made = new Map<string, Entering>();

export function arrivalEntering(delay: number, reduceMotion: boolean): Entering {
  const key = `${delay}:${reduceMotion ? 'fade' : 'rise'}`;
  let enter = made.get(key);
  if (!enter) {
    if (reduceMotion) {
      enter = FadeIn.duration(ARRIVE.riseMs).delay(delay);
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
