// T35 · Closet's tab badge as expo-router hands it to iOS (specs/setup-and-you.md SY2.3, SY2.6): at 0 there is no badge
// at all (no `0`, no empty dot), else the number. Run through expo-router's own conversion of a tab's children, so a
// change in how it reads `hidden` or an empty value turns this red. Regression for the `0` and the dot seen on the
// Simulator (Nov 10).
import { convertTabPropsToOptions } from 'expo-router/build/native-tabs/NativeTabTrigger';
import { closetBadge } from '@/features/closet/ClosetBadge';

const valueFor = (count: number) => (convertTabPropsToOptions({ children: closetBadge(count, '#1A2448') }) as { badgeValue?: string }).badgeValue;

describe('SY2.3 · the badge iOS gets', () => {
  it('SY2.3 · 0 pieces: no badge value at all (not "0", not the " " that draws a dot)', () => {
    expect(valueFor(0)).toBeUndefined();
  });

  it('SY2.3 · 4 pieces, then 6: the number', () => {
    expect(valueFor(4)).toBe('4');
    expect(valueFor(6)).toBe('6');
  });
});
