// SY1.2 (specs/setup-and-you.md, changed with the founder's yes on Nov 12): What Kit knows left You and is a row in
// Privacy & data, in the first section next to "See what I send". It opens the same list (`/you/knows`) the You tab's
// "See all" used to, and that list's Back reads "Privacy & data" because that is the page it is pushed from.
import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import PrivacyDataScreen from '@/app/(tabs)/you/privacy';
import { SCREENS } from '@/demo/scenarios';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/data/db', () => ({ store: { profile: { get: () => Promise.resolve({ consentVersion: 1 }) }, getKv: () => Promise.resolve(null) } }));
jest.mock('@/features/fitcheck/session', () => ({ quota: { snapshot: () => Promise.resolve({ pro: false }) } }));
jest.mock('@/features/privacy/files', () => ({
  realPrivacyFiles: { usage: () => ({ photos: 3, bytes: 2048 }) },
  bytesParts: () => ({ n: 2, unit: 'kb' }),
}));
jest.mock('@/features/account/account', () => ({ ACCOUNT_KEY: 'account.user', getAccount: () => Promise.resolve(null) }));
jest.mock('@/features/account/actions', () => ({ deleteAccountAndData: jest.fn() }));
jest.mock('@/features/privacy/actions', () => ({
  runDeleteAllData: jest.fn(), runDeleteAllPhotos: jest.fn(), runForgetFacts: jest.fn(), turnScoringOff: jest.fn(), turnScoringOn: jest.fn(),
}));
jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn() }));
// The design system pulls in Reanimated, which needs the native runtime: plain stand-ins, the real tokens.
jest.mock('@/design-system', () => {
  const { Text, View } = jest.requireActual('react-native');
  const tokens = jest.requireActual('@/design-system/tokens');
  const colors = new Proxy({}, { get: () => '#808080' });
  const Wrap = ({ children }: { children?: ReactNode }) => <View>{children}</View>;
  const Words = ({ children, ...rest }: { children?: ReactNode }) => <Text {...rest}>{children}</Text>;
  return {
    ...tokens,
    useTheme: () => ({ colors, fixed: colors, scheme: 'light', fontScale: 1, isAccessibilitySize: false, a11y: { reduceMotion: false, reduceTransparency: false, boldText: false, highContrast: false } }),
    KText: Words,
    MonoLabel: Words,
    KCard: Wrap,
    Icon: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text>,
    TextLink: Words,
    RowDivider: () => null,
    MorphPicker: () => null,
  };
});

describe('SY1.2 · What Kit knows is a row in Privacy & data', () => {
  it('the row is in the first section after "See what I send", and opens the facts list', async () => {
    await render(<PrivacyDataScreen />);
    const sent = screen.getByLabelText('See what I send');
    const knows = screen.getByTestId('privacy-row-knows');
    expect(knows.props.accessibilityLabel).toBe('What Kit knows');
    expect(knows.props.accessibilityRole).toBe('button');
    // Same card as "See what I send", right under it, ahead of the "Score my fits" switch.
    const labels = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel as string);
    expect(labels.indexOf('What Kit knows')).toBe(labels.indexOf('See what I send') + 1);
    expect(sent).toBeTruthy();
    fireEvent.press(knows);
    expect(jest.mocked(router.push).mock.calls).toEqual([['/you/knows']]);
  });

  it('the list opens from Privacy & data in the demo (screen 81 sits under /you/privacy), so its Back reads Privacy & data', () => {
    const s = SCREENS.find((x) => x.n === 81);
    expect([s?.href, s?.under]).toEqual(['/you/knows', '/you/privacy']);
  });
});
