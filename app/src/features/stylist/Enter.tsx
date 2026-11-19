// The card's own beat (log #496): wraps a just-finished answer's card or one follow-up tap in its entrance
// (arrivalMotion.ts). `on` false draws it still: an older answer, Past chats, a remount.
import type { ReactNode } from 'react';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/design-system';
import { cardEntering, tapEntering } from './arrivalMotion';

/** Whether an answer's card and taps enter: only when the screen says so (the just-finished live answer), never read-only. */
export const attachmentEnters = (enter: boolean | undefined, readOnly: boolean): boolean => enter === true && !readOnly;

export function Enter({ on, tap, children }: { on: boolean; tap?: number; children: ReactNode }) {
  const { a11y } = useTheme();
  if (!on) return <>{children}</>;
  return <Animated.View entering={tap === undefined ? cardEntering(a11y.reduceMotion) : tapEntering(tap, a11y.reduceMotion)}>{children}</Animated.View>;
}
