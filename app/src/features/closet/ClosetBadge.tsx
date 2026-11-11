// Closet's tab badge (SY2.3, SY2.7): the number, navy. At 0 there's none at all: expo-router draws a number even with
// `hidden` (it showed `0`), and draws a dot when there's no number and no `hidden`; so 0 is no number AND hidden.
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export function closetBadge(count: number, color: string) {
  return (
    <NativeTabs.Trigger.Badge hidden={count === 0} selectedBackgroundColor={color}>
      {count > 0 ? String(count) : undefined}
    </NativeTabs.Trigger.Badge>
  );
}
