// T116 · the dots row (SY2.16, SY2.17): one element read "Kit is writing"; with Reduce Motion a still "…" in place of the dots.
import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { ThemeProvider } from '@/design-system';
import { KitTypingRow } from '@/features/stylist/KitTypingRow';

// The design system loads Reanimated: its mocks, as closetDeck.test.tsx.
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const row = () => (
  <ThemeProvider>
    <KitTypingRow />
  </ThemeProvider>
);

describe('Kit types: the dots row', () => {
  it('reads as "Kit is writing" (SY2.17)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    await render(row());
    expect(screen.getByLabelText('Kit is writing')).toBeTruthy();
    expect(screen.queryByText('…')).toBeNull();
  });

  it('with Reduce Motion shows a still "…" (SY2.16)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(row());
    expect(await screen.findByText('…')).toBeTruthy();
    expect(screen.getByLabelText('Kit is writing')).toBeTruthy();
  });
});
