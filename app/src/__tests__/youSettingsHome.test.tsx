// T34 · SY1 (specs/setup-and-you.md): You becomes the settings home. The gear and the Settings page go; Settings' rows
// sit on You under the style card, What Kit knows and Today, and each does exactly what it did on Settings. Written
// before the code (tasks/T34/TESTING.md); the render tests drive the real YouScreen and SettingsRows on the memory
// store with the full demo seed, and only stand in for the design system (Reanimated needs the native runtime), the
// router, the quota snapshot, the account section, and the outward actions (mail, Safari, the App Store, toasts).
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { KV, type KittedStore } from '@/data/store';
import { radius, space } from '@/design-system/tokens';
import { textStyles } from '@/design-system/typography';
import { HeaderHeightContext } from 'expo-router/build/react-navigation/elements';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { redirectSystemPath } from '@/app/+native-intent';
import YouScreen from '@/app/(tabs)/you/index';
import YouStack from '@/app/(tabs)/you/_layout';
import { SCREENS } from '@/demo/scenarios';
import { setDemoPaywall } from '@/features/paywall/switch';
import { mailtoUrl, openLink, openManageSubscription } from '@/features/settings/actions';
import { appVersion, versionLine } from '@/features/settings/plan';
import { LinkRow } from '@/features/settings/SettingsList';
import { SettingsRows } from '@/features/settings/SettingsRows';
import { StyleTile } from '@/features/you/StyleTile';
import { picksOf } from '@/features/you/profile';
import { styleLabel } from '@/features/morning/copy';
import { showToast } from '@/features/toast/toast';
import { factTitle, liveFacts } from '@/features/you/facts';
import { demoEntitlements } from '@/services/entitlements';
import { LIMITS, type QuotaSnapshot } from '@/services/quota';
import { resetTierForTests, setDemoTier } from '@/services/server/tier';

// ── stand-ins ───────────────────────────────────────────────────────────────────────────────────────────────────
let mockStore: KittedStore;
let mockParams: Record<string, string> = {};
let mockSnapshot: () => Promise<QuotaSnapshot>;
let mockAccountsOn = false;
const mockScreens: { name: string; options?: Record<string, unknown> }[] = [];
const mockStackProps: Record<string, unknown>[] = [];
/** Verify round 2: the accessibility text sizes (rows stack) for the stand-in theme. */
let mockAx = false;
/** The route's params and focus, as the router would change them (verify round 2, a second old link): a params
 *  change or a focus change re-renders You, as it does under expo-router. `mockFocusGen` counts focuses; -1 = blurred. */
const mockRouterListeners = new Set<() => void>();
let mockFocusGen = 0;
const mockNavListeners = new Map<string, Set<() => void>>();
function mockNotifyRouter() {
  mockRouterListeners.forEach((l) => l());
}
function mockApplyParams(p: Record<string, string | undefined>) {
  const next: Record<string, string> = { ...mockParams };
  for (const [k, val] of Object.entries(p)) {
    if (val === undefined) delete next[k];
    else next[k] = val;
  }
  mockParams = next;
  mockNotifyRouter();
}
function mockSetFocus(focused: boolean) {
  mockFocusGen = focused ? Math.abs(mockFocusGen) + 1 : -Math.abs(mockFocusGen) - 1;
  mockNotifyRouter();
  mockNavListeners.get(focused ? 'focus' : 'blur')?.forEach((l) => l());
}

jest.mock('expo-router', () => {
  const Stack = Object.assign(
    (p: { children?: unknown; screenOptions?: Record<string, unknown> }) => {
      mockStackProps.push(p);
      return p.children ?? null;
    },
    {
      Screen: (p: { name: string; options?: Record<string, unknown> }) => {
        mockScreens.push(p);
        return null;
      },
    },
  );
  const React = jest.requireActual('react');
  const subscribe = (cb: () => void) => {
    mockRouterListeners.add(cb);
    return () => mockRouterListeners.delete(cb);
  };
  const useGen = (): number => React.useSyncExternalStore(subscribe, () => mockFocusGen);
  const setParams = jest.fn((p: Record<string, string | undefined>) => mockApplyParams(p));
  return {
    router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), replace: jest.fn(), dismissAll: jest.fn(), setParams },
    useLocalSearchParams: () => React.useSyncExternalStore(subscribe, () => mockParams),
    useGlobalSearchParams: () => React.useSyncExternalStore(subscribe, () => mockParams),
    useIsFocused: () => useGen() > 0,
    useFocusEffect: (cb: () => void | (() => void)) => {
      const gen = useGen();
      React.useEffect(() => (gen > 0 ? cb() : undefined), [cb, gen]);
    },
    useNavigation: () => ({
      isFocused: () => mockFocusGen > 0,
      setParams,
      addListener: (type: string, fn: () => void) => {
        const set = mockNavListeners.get(type) ?? new Set<() => void>();
        set.add(fn);
        mockNavListeners.set(type, set);
        return () => set.delete(fn);
      },
    }),
    Stack,
  };
});
jest.mock('@/data/db', () => ({
  get store() {
    return mockStore;
  },
}));
jest.mock('@/features/fitcheck/session', () => ({ quota: { snapshot: () => mockSnapshot() } }));
jest.mock('@/features/account/AccountRows', () => {
  const { View } = jest.requireActual('react-native');
  return { AccountSection: () => (mockAccountsOn ? <View testID="you-section-account" /> : null) };
});
jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn(), hideToast: jest.fn(), getToast: jest.fn() }));
jest.mock('@/features/settings/actions', () => ({
  ...jest.requireActual('@/features/settings/actions'),
  openLink: jest.fn(() => Promise.resolve()),
  openManageSubscription: jest.fn(() => Promise.resolve()),
}));
// The design system pulls in Reanimated, which needs the native runtime: plain stand-ins, the real tokens.
jest.mock('@/design-system', () => {
  const RN = jest.requireActual('react-native');
  const { Text, View, Pressable } = RN;
  const { useState } = jest.requireActual('react');
  const tokens = jest.requireActual('@/design-system/tokens');
  const colors = new Proxy({}, { get: () => '#808080' });
  const Wrap = ({ children }: { children?: ReactNode }) => <View>{children}</View>;
  const Words = ({ children, ...rest }: { children?: ReactNode }) => <Text {...rest}>{children}</Text>;
  const Button = ({ title, onPress }: { title: string; onPress?: () => void }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
  /** The pill (one button with its spoken label) that opens its menu; each option a button that picks it. */
  function MorphPicker({ accessibilityLabel, label, sections, onPick }: {
    accessibilityLabel?: string; label: string; sections: { options: { value: string; label: string }[] }[]; onPick: (v: string) => void;
  }) {
    const [open, setOpen] = useState(false);
    return (
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} onPress={() => setOpen(!open)}>
          <Text>{label}</Text>
        </Pressable>
        {open
          ? sections.flatMap((s) => s.options).map((o) => (
              <Pressable key={o.value} accessibilityRole="button" accessibilityLabel={`option:${o.label}`} onPress={() => { setOpen(false); onPick(o.value); }}>
                <Text>{`option:${o.label}`}</Text>
              </Pressable>
            ))
          : null}
      </View>
    );
  }
  return {
    ...tokens,
    useTheme: () => ({ colors, fixed: colors, scheme: 'light', fontScale: mockAx ? 3.12 : 1, isAccessibilitySize: mockAx, archivoLoaded: false, isFixedDark: false, a11y: { reduceMotion: false, reduceTransparency: false, boldText: false, highContrast: false } }),
    KText: Words,
    MonoLabel: Words,
    KCard: Wrap,
    Icon: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text>,
    KButton: Button,
    TextLink: Button,
    WovenLabel: ({ text }: { text: string }) => <Text>{text}</Text>,
    RowDivider: () => null,
    MorphPicker,
  };
});

const scrollTo = jest.mocked(ScrollView.prototype.scrollTo);

// ── states ──────────────────────────────────────────────────────────────────────────────────────────────────────
function snap(o: Partial<QuotaSnapshot> = {}): QuotaSnapshot {
  return {
    dayKey: '2026-10-22', tier: 'free', pro: false, purchased: false, checksUsed: 0, checkLimit: LIMITS.freeChecks, recheckOpen: false,
    recheckId: null, questionsUsed: 0, questionLimit: LIMITS.freeQuestions, heldCount: 0, nextResetMs: 0, ...o,
  };
}
const FREE = snap();
const BETA = snap({ tier: 'beta', checkLimit: LIMITS.betaChecks, questionLimit: LIMITS.betaQuestions });
const PRO = snap({ tier: 'pro', pro: true, purchased: true, checkLimit: LIMITS.proChecks, questionLimit: LIMITS.proQuestions });

type State = 'free' | 'beta' | 'proPaywall' | 'freePaywall' | 'betaPaywall';
/** "Free": tier free, paywall off. "Beta": the demo tier beta. "Paywall on": the store script with tier free. "Pro":
 *  the demo entitlement bought and the snapshot's purchase. */
function given(state: State) {
  setDemoTier(state === 'beta' || state === 'betaPaywall' ? 'beta' : 'free');
  if (state === 'proPaywall' || state === 'freePaywall' || state === 'betaPaywall') setDemoPaywall('ok');
  if (state === 'proPaywall') demoEntitlements.setPro(true);
  const s = state === 'proPaywall' ? PRO : state === 'beta' || state === 'betaPaywall' ? BETA : FREE;
  mockSnapshot = () => Promise.resolve(s);
}

async function seeded(): Promise<KittedStore> {
  const s = createMemoryStore();
  await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
  return s;
}

beforeEach(async () => {
  resetTierForTests();
  setDemoPaywall(null);
  setDemoTier(null);
  demoEntitlements.setPro(false);
  mockParams = {};
  mockAccountsOn = false;
  mockScreens.length = 0;
  mockAx = false;
  mockFocusGen = 1;
  mockRouterListeners.clear();
  mockNavListeners.clear();
  mockStackProps.length = 0;
  mockStore = await seeded();
  mockSnapshot = () => Promise.resolve(FREE);
  jest.mocked(router.push).mockClear();
  jest.mocked(router.setParams).mockClear();
  jest.mocked(openLink).mockClear();
  jest.mocked(openManageSubscription).mockClear();
  jest.mocked(showToast).mockClear();
  scrollTo.mockClear();
});

afterAll(() => {
  resetTierForTests();
  setDemoPaywall(null);
  demoEntitlements.setPro(false);
});

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** You, once its data has loaded (the Today card is the last block to need it). */
async function renderYou() {
  await render(<YouScreen />);
  await screen.findByTestId('you-today');
  await settle();
}

/** Lets the mount's reads (the saved appearance) land. */
async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function renderRows(props?: Parameters<typeof SettingsRows>[0]) {
  await render(<SettingsRows {...props} />);
  await screen.findByTestId('you-rows');
}

type ReactTestInstance = ReturnType<typeof screen.getByTestId>;

const ids = () => screen.getAllByTestId(/^you-/).map((el) => el.props.testID as string);

const role = (el: ReactTestInstance) => (el.props.accessibilityRole ?? el.props.role) as string | undefined;
const label = (el: ReactTestInstance) => (el.props.accessibilityLabel ?? el.props['aria-label']) as string | undefined;

/** The nearest element at or above `el` that carries a role. */
function roleAbove(el: ReactTestInstance): string | undefined {
  for (let n: ReactTestInstance | null = el; n; n = n.parent as ReactTestInstance | null) {
    const r = role(n);
    if (r) return r;
  }
  return undefined;
}

/** Every string drawn inside `el`, in tree order. */
function texts(node: ReturnType<typeof screen.toJSON>): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  return (node.children ?? []).flatMap((c) => texts(c as never));
}

const v = appVersion();
const LINKS = { support: 's@x.co', privacy: 'https://p.x', terms: 'https://t.x' };

// ── SY1.1 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe('SY1.1 · no gear, no Settings page; old links open You', () => {
  it('SY1.1 · an old kitted://you/settings link opens You at its rows', () => {
    for (const initial of [true, false]) {
      expect(redirectSystemPath({ path: 'kitted://you/settings', initial })).toBe('/you?at=settings');
      expect(redirectSystemPath({ path: '/you/settings', initial })).toBe('/you?at=settings');
      expect(redirectSystemPath({ path: '/you/settings/', initial })).toBe('/you?at=settings');
      expect(redirectSystemPath({ path: 'kitted://you/settings?x=1', initial })).toBe('/you?at=settings');
      expect(redirectSystemPath({ path: '/you/settings?x=1', initial })).toBe('/you?at=settings');
      // Controls: everything else as before; Plan & usage is not rewritten to You.
      expect(redirectSystemPath({ path: '/closet', initial })).toBe('/closet');
      expect(redirectSystemPath({ path: 'kitted://you/plan', initial })).toBe('/you/plan');
      expect(redirectSystemPath({ path: 'kitted://you', initial })).toBe('/you');
      expect(redirectSystemPath({ path: 'kitted://demo/screen/9?latency=0', initial })).toBe('/demo/screen/9?latency=0');
    }
  });

  it('SY1.1 · /you?at=settings opens You scrolled once to its rows; any other value, or none, does not scroll', async () => {
    // Round 1 dispute (REPORT.md): the exact y the native scroll needs depends on iOS's adjusted insets (the nav bar,
    // the large title, the tab bar), which don't exist in Jest. So this pins what Jest can see on a tall page (sizes
    // given through the ScrollView's own events): one unanimated scrollTo after the rows' first layout, never past
    // the rows' top (y ≤ rows.y − space.m), never below 0, and moving 1:1 with the rows (rows 260 pt lower → y 260
    // lower). Where the rows land on the phone (at the top of the visible area, or the end of a short page) is the
    // flow's "SY1.2 rows" step.
    const lay = async (y: number) =>
      fireEvent(screen.getByTestId('you-rows'), 'layout', { nativeEvent: { layout: { x: 0, y, width: 370, height: 500 } } });
    const tallPage = async () => {
      const sv = screen.getByTestId('you-scroll');
      await fireEvent(sv, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 874 } } });
      await fireEvent(sv, 'contentSizeChange', 402, 3000);
    };
    const scrollToEnd = jest.mocked(ScrollView.prototype.scrollToEnd);
    const targets: number[] = [];
    for (const rowsY of [640, 900]) {
      mockParams = { at: 'settings' };
      scrollTo.mockClear();
      scrollToEnd.mockClear();
      await renderYou();
      await tallPage();
      expect(scrollTo).not.toHaveBeenCalled();
      await lay(rowsY);
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollToEnd).not.toHaveBeenCalled();
      const arg = scrollTo.mock.calls[0]?.[0] as { y?: number; animated?: boolean } | undefined;
      expect(arg?.animated).toBe(false);
      const y = arg?.y ?? Number.NaN;
      expect([y >= 0, y <= rowsY - space.m]).toEqual([true, true]);
      targets.push(y);
      // Only on the first layout after it mounts.
      await lay(rowsY + 60);
      expect([scrollTo.mock.calls.length, scrollToEnd.mock.calls.length]).toEqual([1, 0]);
      await screen.unmount();
    }
    expect(targets[1]! - targets[0]!).toBe(260);

    // Floored at 0.
    scrollTo.mockClear();
    await renderYou();
    await tallPage();
    await lay(3);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ y: 0, animated: false }));
    await screen.unmount();

    const others: Record<string, string>[] = [{}, { at: 'plan' }];
    for (const params of others) {
      mockParams = params;
      scrollTo.mockClear();
      scrollToEnd.mockClear();
      await renderYou();
      await tallPage();
      await lay(640);
      expect([scrollTo.mock.calls.length, scrollToEnd.mock.calls.length]).toEqual([0, 0]);
      await screen.unmount();
    }
  });

  it('SY1.1 · no demo screen opens or sits under /you/settings', () => {
    const settings = SCREENS.filter((s) => s.href.startsWith('/you/settings') || (s.under ?? '').startsWith('/you/settings'));
    expect(settings.map((s) => s.n)).toEqual([]);
    const byN = (n: number) => SCREENS.find((s) => s.n === n);
    for (const n of [84, 141, 142, 258, 270]) {
      expect([n, byN(n)?.href, byN(n)?.under]).toEqual([n, '/you?at=settings', undefined]);
    }
    expect([byN(271)?.href, byN(271)?.under]).toEqual(['/you', undefined]);
    expect([byN(17)?.href, byN(257)?.href]).toEqual(['/you', '/you']);
  });

  it('SY1.1 · the Settings route is gone', async () => {
    const fs = jest.requireActual<{ existsSync(p: string): boolean }>('fs');
    const path = jest.requireActual<{ resolve(...p: string[]): string }>('path');
    expect(fs.existsSync(path.resolve('src/app/(tabs)/you/settings.tsx'))).toBe(false);
    // The control: the pages Settings used to push are still there.
    expect(['plan', 'privacy', 'acknowledgements', 'notifications'].map((f) => fs.existsSync(path.resolve(`src/app/(tabs)/you/${f}.tsx`)))).toEqual([true, true, true, true]);

    // The You stack: no settings screen, and nothing in You's header (no gear, no other button).
    await render(<YouStack />);
    const names = mockScreens.map((s) => s.name);
    expect(names).not.toContain('settings');
    expect(names).toEqual(expect.arrayContaining(['index', 'profile', 'knows', 'plan', 'notifications', 'acknowledgements', 'privacy']));
    const index = mockScreens.find((s) => s.name === 'index')?.options ?? {};
    expect(index.title).toBe('You');
    expect(index.headerLargeTitleEnabled).toBe(true);
    expect([index.headerRight, index.headerLeft, index.unstable_headerRightItems, index.unstable_headerLeftItems]).toEqual([undefined, undefined, undefined, undefined]);
    const shared = (mockStackProps[0]?.screenOptions ?? {}) as Record<string, unknown>;
    expect([shared.headerRight, shared.headerLeft]).toEqual([undefined, undefined]);

    // You itself has no element labelled Settings.
    await screen.unmount();
    await renderYou();
    expect(screen.queryByLabelText('Settings')).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.queryByLabelText(/Settings/)).toBeNull();
    expect(screen.getByTestId('you-row-plan')).toBeTruthy();
  });
});

// ── SY1.2 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe('SY1.2 · You, in order: style, knows, Today, the rows, the version line', () => {
  it('SY1.2 · free: style, knows, Today, then Appearance, Plan & usage, Privacy & data, Acknowledgements, then the version line', async () => {
    given('free');
    await renderYou();
    expect(ids()).toEqual([
      'you-scroll', 'you-style', 'you-knows', 'you-today', 'you-rows',
      'you-section-main', 'you-row-appearance', 'you-row-plan',
      'you-section-privacy', 'you-row-privacy',
      'you-section-help', 'you-row-acknowledgements',
      'you-version',
    ]);
    // Section labels: Help & about only.
    expect(screen.getAllByText('Help & about')).toHaveLength(1);
    expect(screen.queryByText('Subscription')).toBeNull();
    expect(screen.queryByText('Account')).toBeNull();
    // The version line: the build's, word for word.
    const line = versionLine(appVersion());
    expect(line).toMatch(/^Kitted \S+ \(\S+\) · Scoring v\S+$/);
    expect(screen.getByTestId('you-version')).toHaveTextContent(line, { exact: true });
    // Nothing after the version line: it is the last thing drawn on You.
    const drawn = texts(screen.toJSON());
    expect(drawn[drawn.length - 1]).toBe(line);
    expect(drawn.filter((s) => s === line)).toHaveLength(1);
    // No Show me around row in T34.
    expect(screen.queryByText(/Show me around/)).toBeNull();
    expect(screen.queryByLabelText(/Show me around/)).toBeNull();
  });

  it('SY1.2 · each conditional row shows only under its condition', async () => {
    // Accounts on: the account section comes first in the rows, before the main card.
    given('free');
    mockAccountsOn = true;
    await renderYou();
    const withAccount = ids();
    expect(withAccount.slice(withAccount.indexOf('you-rows'), withAccount.indexOf('you-row-appearance'))).toEqual(['you-rows', 'you-section-account', 'you-section-main']);
    await screen.unmount();
    mockAccountsOn = false;

    // Notifications built: first in the main card, before Appearance.
    await renderRows({ notificationsBuilt: true, links: { support: null, privacy: null, terms: null } });
    expect(ids()).toEqual([
      'you-rows', 'you-section-main', 'you-row-notifications', 'you-row-appearance', 'you-row-plan',
      'you-section-privacy', 'you-row-privacy', 'you-section-help', 'you-row-acknowledgements', 'you-version',
    ]);
    expect(screen.getByTestId('you-row-notifications')).toHaveTextContent('Notifications', { exact: false });
    expect(label(screen.getByTestId('you-row-notifications'))).toBe('Notifications');
    await screen.unmount();

    // Not built: no Notifications row.
    await renderRows({ notificationsBuilt: false, links: { support: null, privacy: null, terms: null } });
    expect(screen.getByTestId('you-row-plan')).toBeTruthy();
    expect(screen.queryByTestId('you-row-notifications')).toBeNull();
    expect(screen.queryByText('Notifications')).toBeNull();
    await screen.unmount();

    // Paywall on (free): Subscription between Privacy & data and Help & about, Manage then Restore.
    given('freePaywall');
    await renderRows({ notificationsBuilt: false, links: { support: null, privacy: null, terms: null } });
    expect(ids()).toEqual([
      'you-rows', 'you-section-main', 'you-row-appearance', 'you-row-plan', 'you-section-privacy', 'you-row-privacy',
      'you-section-subscription', 'you-row-manage', 'you-row-restore',
      'you-section-help', 'you-row-acknowledgements', 'you-version',
    ]);
    expect(within(screen.getByTestId('you-section-subscription')).getByText('Subscription')).toBeTruthy();
    expect(label(screen.getByTestId('you-row-manage'))).toBe('Manage subscription');
    expect(label(screen.getByTestId('you-row-restore'))).toBe('Restore purchases');
    await screen.unmount();

    // Beta with the paywall script on: nothing to buy, no Subscription at all (no empty card).
    resetTierForTests();
    setDemoPaywall(null);
    given('betaPaywall');
    await renderRows({ notificationsBuilt: false, links: { support: null, privacy: null, terms: null } });
    expect(screen.getByTestId('you-row-plan')).toBeTruthy();
    expect(screen.queryByTestId('you-section-subscription')).toBeNull();
    expect(screen.queryByText('Subscription')).toBeNull();
    expect(screen.queryByText('Manage subscription')).toBeNull();
    expect(screen.queryByText('Restore purchases')).toBeNull();
    await screen.unmount();

    // Paywall off (free): no Subscription section either.
    resetTierForTests();
    setDemoPaywall(null);
    given('free');
    await renderRows({ notificationsBuilt: false, links: { support: null, privacy: null, terms: null } });
    expect(screen.getByTestId('you-row-plan')).toBeTruthy();
    expect(screen.queryByTestId('you-section-subscription')).toBeNull();
    await screen.unmount();

    // Every address set: Help & about reads report, support, privacy policy, terms, then Acknowledgements.
    await renderRows({ notificationsBuilt: false, links: LINKS });
    const help = within(screen.getByTestId('you-section-help')).getAllByTestId(/^you-row-/).map((el) => el.props.testID);
    expect(help).toEqual(['you-row-report', 'you-row-support', 'you-row-privacy-policy', 'you-row-terms', 'you-row-acknowledgements']);
    expect(['you-row-report', 'you-row-support', 'you-row-privacy-policy', 'you-row-terms'].map((id) => label(screen.getByTestId(id)))).toEqual([
      'Report a wrong score', 'Contact support', 'Privacy policy', 'Terms of use',
    ]);
    await screen.unmount();

    // Only the support address: the two mail rows, not the two web rows.
    await renderRows({ notificationsBuilt: false, links: { support: 's@x.co', privacy: null, terms: null } });
    const helpMail = within(screen.getByTestId('you-section-help')).getAllByTestId(/^you-row-/).map((el) => el.props.testID);
    expect(helpMail).toEqual(['you-row-report', 'you-row-support', 'you-row-acknowledgements']);
    await screen.unmount();

    // No address: no mail or web row.
    await renderRows({ notificationsBuilt: false, links: { support: null, privacy: null, terms: null } });
    const helpNone = within(screen.getByTestId('you-section-help')).getAllByTestId(/^you-row-/).map((el) => el.props.testID);
    expect(helpNone).toEqual(['you-row-acknowledgements']);
    expect(screen.queryByText(/Report a wrong score|Contact support|Privacy policy|Terms of use/)).toBeNull();
  });

  it("SY1.2 · with no props the rows follow the build's switches (Notifications, the mail and web rows)", async () => {
    const { NOTIFICATIONS_BUILT } = jest.requireActual('@/config/features');
    const { SUPPORT_EMAIL, PRIVACY_URL, TERMS_URL } = jest.requireActual('@/config/links');
    given('free');
    await renderRows();
    expect(screen.getByTestId('you-row-plan')).toBeTruthy();
    expect(screen.queryByTestId('you-row-notifications') !== null).toBe(NOTIFICATIONS_BUILT);
    expect(screen.queryByTestId('you-row-report') !== null).toBe(SUPPORT_EMAIL !== null);
    expect(screen.queryByTestId('you-row-support') !== null).toBe(SUPPORT_EMAIL !== null);
    expect(screen.queryByTestId('you-row-privacy-policy') !== null).toBe(PRIVACY_URL !== null);
    expect(screen.queryByTestId('you-row-terms') !== null).toBe(TERMS_URL !== null);
  });

  it('SY1.2 · Pro: the Pro row under the style card', async () => {
    given('proPaywall');
    await renderYou();
    expect(ids()).toEqual([
      'you-scroll', 'you-style', 'you-pro', 'you-knows', 'you-today', 'you-rows',
      'you-section-main', 'you-row-appearance', 'you-row-plan',
      'you-section-privacy', 'you-row-privacy',
      'you-section-subscription', 'you-row-manage', 'you-row-restore',
      'you-section-help', 'you-row-acknowledgements',
      'you-version',
    ]);
    const pro = within(screen.getByTestId('you-pro')).getByRole('button');
    expect([label(pro), pro.props.accessibilityHint]).toEqual(['Kitted Pro', 'Plan & usage']);
    await screen.unmount();

    // Free: no Pro row.
    resetTierForTests();
    setDemoPaywall(null);
    demoEntitlements.setPro(false);
    given('free');
    await renderYou();
    expect(screen.getByTestId('you-knows')).toBeTruthy();
    expect(screen.queryByTestId('you-pro')).toBeNull();
  });

  it('SY1.2 · What Kit knows: up to 4 facts and See all {n}; none: the empty line and no See all', async () => {
    given('free');
    const live = liveFacts(await mockStore.facts.all());
    expect(live.length).toBeGreaterThan(4);
    await renderYou();
    const knows = within(screen.getByTestId('you-knows'));
    expect(knows.getByLabelText(`See all ${live.length}`)).toBeTruthy();
    for (const f of live.slice(0, 4)) expect(knows.getAllByText(factTitle(f)).length).toBeGreaterThanOrEqual(1);
    for (const f of live.slice(4)) expect(knows.queryByText(factTitle(f))).toBeNull();
    expect(knows.queryByText("I'll add what I learn here.")).toBeNull();
    await screen.unmount();

    for (const f of await mockStore.facts.all()) await mockStore.facts.patch(f.id, { isDeleted: true });
    await renderYou();
    const empty = within(screen.getByTestId('you-knows'));
    expect(empty.getByText("I'll add what I learn here.")).toBeTruthy();
    expect(empty.queryByLabelText(/^See all/)).toBeNull();
    expect(empty.queryByText(/^See all/)).toBeNull();
  });

  it('SY1.2 · before its data loads You draws nothing', async () => {
    given('free');
    mockSnapshot = () => new Promise<QuotaSnapshot>(() => undefined);
    await render(<YouScreen />);
    expect(screen.toJSON()).toBeNull();
    expect(screen.queryByTestId('you-rows')).toBeNull();
  });

  // Verify round 1, defect 3: each of You's three reads holds the page back on its own, not just the usage read.
  it('SY1.2 · before its data loads You draws nothing: the profile read still pending', async () => {
    given('free');
    const s = mockStore;
    mockStore = { ...s, profile: { ...s.profile, get: () => new Promise<never>(() => undefined) } };
    await render(<YouScreen />);
    await settle();
    expect(screen.toJSON()).toBeNull();
    expect(screen.queryByTestId('you-style')).toBeNull();
    expect(screen.queryByTestId('you-rows')).toBeNull();
  });

  it('SY1.2 · before its data loads You draws nothing: the facts read still pending', async () => {
    given('free');
    const s = mockStore;
    mockStore = { ...s, facts: { ...s.facts, all: () => new Promise<never>(() => undefined) } };
    await render(<YouScreen />);
    await settle();
    expect(screen.toJSON()).toBeNull();
    expect(screen.queryByTestId('you-style')).toBeNull();
    expect(screen.queryByTestId('you-rows')).toBeNull();
  });

  it('SY1.2 · with no profile (an install that skipped onboarding) the style card still comes first', async () => {
    given('free');
    mockStore = createMemoryStore();
    mockSnapshot = () => Promise.resolve(FREE);
    await renderYou();
    expect(ids().slice(0, 3)).toEqual(['you-scroll', 'you-style', 'you-knows']);
    expect(within(screen.getByTestId('you-style')).getByText('No looks picked yet')).toBeTruthy();
    expect(screen.getByTestId('you-row-plan')).toBeTruthy();
  });
});

// ── SY1.3 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe('SY1.3 · each row does what the Settings row did', () => {
  it('SY1.3 · each push row opens its page', async () => {
    given('free');
    await renderRows({ notificationsBuilt: true, links: { support: null, privacy: null, terms: null } });
    const push = jest.mocked(router.push);
    const cases: [string, string][] = [
      ['you-row-plan', '/you/plan'],
      ['you-row-privacy', '/you/privacy'],
      ['you-row-acknowledgements', '/you/acknowledgements'],
      ['you-row-notifications', '/you/notifications'],
    ];
    for (const [id, route] of cases) {
      push.mockClear();
      await fireEvent.press(screen.getByTestId(id));
      expect([id, push.mock.calls]).toEqual([id, [[route]]]);
    }
    // Nothing pushes the old page.
    push.mockClear();
    for (const [id] of cases) await fireEvent.press(screen.getByTestId(id));
    expect(push.mock.calls.flat().filter((r) => String(r).includes('settings'))).toEqual([]);
    expect(push).toHaveBeenCalledTimes(4);
  });

  it("SY1.3 · Plan & usage shows the plan's short name", async () => {
    const planLabel = async () => {
      await renderRows({ notificationsBuilt: false, links: { support: null, privacy: null, terms: null } });
      const l = label(screen.getByTestId('you-row-plan'));
      await screen.unmount();
      return l;
    };
    given('free');
    expect(await planLabel()).toBe('Plan & usage, Free plan');
    resetTierForTests();
    given('beta');
    expect(await planLabel()).toBe('Plan & usage, Kitted beta');
    resetTierForTests();
    given('proPaywall');
    expect(await planLabel()).toBe('Plan & usage, Kitted Pro');
    resetTierForTests();
    setDemoPaywall(null);
    demoEntitlements.setPro(false);
    given('free');
    mockParams = { demoPlan: 'trial' };
    expect(await planLabel()).toBe('Plan & usage, Pro trial');
  });

  it('SY1.3 · Appearance shows the saved choice and saves a new one', async () => {
    given('free');
    // The pill by its label: once open, the menu's options are buttons inside the row too (round 1 dispute).
    const pill = () => within(screen.getByTestId('you-row-appearance')).getByLabelText(/^Appearance, /);
    // Unset (a fresh install): Light.
    await renderRows();
    await waitFor(() => expect(label(pill())).toBe('Appearance, Light'));
    expect(role(pill())).toBe('button');
    // Open and close without a pick: nothing written, still Light.
    await fireEvent.press(pill());
    await fireEvent.press(pill());
    expect(await mockStore.getKv(KV.appearance)).toBeNull();
    expect(label(pill())).toBe('Appearance, Light');
    // Pick System: shown at once, saved (System stays available).
    await fireEvent.press(pill());
    await fireEvent.press(screen.getByLabelText('option:System'));
    expect(label(pill())).toBe('Appearance, System');
    await waitFor(async () => expect(await mockStore.getKv(KV.appearance)).toBe('system'));
    await screen.unmount();

    // Saved Dark before You opens: Dark.
    await mockStore.setKv(KV.appearance, 'dark');
    await renderRows();
    await waitFor(() => expect(label(pill())).toBe('Appearance, Dark'));
    await screen.unmount();

    // A saved System is kept, not turned into Light.
    await mockStore.setKv(KV.appearance, 'system');
    await renderRows();
    await waitFor(() => expect(label(pill())).toBe('Appearance, System'));
    await screen.unmount();

    // After "Delete all my data" (the store wiped): Light again, the fresh-install default.
    await mockStore.wipe();
    await renderRows();
    // Let the mount's load settle before reading.
    await waitFor(async () => expect(await mockStore.getKv(KV.appearance)).toBeNull());
    await waitFor(() => expect(label(pill())).toBe('Appearance, Light'));
  });

  it('SY1.3 · Manage, Restore and the mail and web rows do what Settings did', async () => {
    given('freePaywall');
    await renderRows({ notificationsBuilt: false, links: LINKS });

    await fireEvent.press(screen.getByTestId('you-row-manage'));
    expect(openManageSubscription).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('you-row-manage').props.accessibilityHint).toBe('Opens your subscriptions in the App Store');

    // Restore, not Pro: one toast, the result's.
    await fireEvent.press(screen.getByTestId('you-row-restore'));
    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(jest.mocked(showToast).mock.calls).toEqual([['No purchases to restore.']]);

    // Restore with the demo entitlement Pro.
    jest.mocked(showToast).mockClear();
    await act(async () => demoEntitlements.setPro(true));
    await fireEvent.press(screen.getByTestId('you-row-restore'));
    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(jest.mocked(showToast).mock.calls).toEqual([['Restored. Kitted Pro is on.']]);

    const open = jest.mocked(openLink);
    const pressed = async (id: string) => {
      open.mockClear();
      await fireEvent.press(screen.getByTestId(id));
      return open.mock.calls;
    };
    expect(await pressed('you-row-report')).toEqual([[mailtoUrl('s@x.co', 'A wrong score (Kitted ' + v.version + ')')]]);
    expect(await pressed('you-row-support')).toEqual([[mailtoUrl('s@x.co', 'Kitted ' + v.version + ' (' + v.build + ')')]]);
    expect(await pressed('you-row-privacy-policy')).toEqual([['https://p.x']]);
    expect(await pressed('you-row-terms')).toEqual([['https://t.x']]);
    expect(['you-row-report', 'you-row-support', 'you-row-privacy-policy', 'you-row-terms'].map((id) => screen.getByTestId(id).props.accessibilityHint)).toEqual([
      'Opens Mail', 'Opens Mail', 'Opens the page in Safari', 'Opens the page in Safari',
    ]);
    // None of these navigates.
    expect(router.push).not.toHaveBeenCalled();
  });
});

// ── SY1.4 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe('SY1.4 · Privacy & data once on You', () => {
  it('SY1.4 · one Privacy & data on You, in the rows', async () => {
    for (const state of ['free', 'beta', 'proPaywall'] as const) {
      for (const accounts of [false, true]) {
        resetTierForTests();
        setDemoPaywall(null);
        demoEntitlements.setPro(false);
        given(state);
        mockAccountsOn = accounts;
        await renderYou();
        const byText = screen.getAllByText('Privacy & data');
        const byLabel = screen.getAllByLabelText('Privacy & data');
        expect([state, accounts, byText.length, byLabel.length]).toEqual([state, accounts, 1, 1]);
        const row = screen.getByTestId('you-row-privacy');
        expect(byLabel[0]).toBe(row);
        expect(within(screen.getByTestId('you-section-privacy')).getByText('Privacy & data')).toBe(byText[0]);
        const order = ids();
        expect(order.indexOf('you-row-privacy')).toBeGreaterThan(order.indexOf('you-today'));
        // The old card (a lock icon between Today and the rows) is gone.
        expect(screen.queryByText('icon:lock')).toBeNull();
        // One tap from You opens Privacy & data (youTonight YT2's check, moved here).
        jest.mocked(router.push).mockClear();
        await fireEvent.press(row);
        expect(jest.mocked(router.push).mock.calls).toEqual([['/you/privacy']]);
        await screen.unmount();
      }
    }
  });
});

// ── SY1.5 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe('SY1.5 · the ScrollView is You’s first view', () => {
  it("SY1.5 · the screen's root is the ScrollView", async () => {
    given('free');
    await renderYou();
    const root = screen.toJSON();
    expect(root !== null && !Array.isArray(root) && typeof root === 'object' ? [root.type, root.props.testID] : root).toEqual(['RCTScrollView', 'you-scroll']);
    const scroll = within(screen.getByTestId('you-scroll'));
    for (const id of ['you-style', 'you-knows', 'you-today', 'you-rows', 'you-row-plan', 'you-version']) expect(scroll.getByTestId(id)).toBeTruthy();
    expect(screen.getByTestId('you-scroll').props.contentInsetAdjustmentBehavior).toBe('automatic');
  });
});

// ── SY1.6 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe('SY1.6 · VoiceOver reads each row as one button with its value', () => {
  it('SY1.6 · every row is one button read with its value', async () => {
    given('freePaywall');
    await renderRows({ notificationsBuilt: true, links: LINKS });
    const expected: [string, string][] = [
      ['you-row-notifications', 'Notifications'],
      ['you-row-plan', 'Plan & usage, Free plan'],
      ['you-row-privacy', 'Privacy & data'],
      ['you-row-manage', 'Manage subscription'],
      ['you-row-restore', 'Restore purchases'],
      ['you-row-report', 'Report a wrong score'],
      ['you-row-support', 'Contact support'],
      ['you-row-privacy-policy', 'Privacy policy'],
      ['you-row-terms', 'Terms of use'],
      ['you-row-acknowledgements', 'Acknowledgements'],
    ];
    for (const [id, words] of expected) {
      const row = screen.getByTestId(id);
      const style = StyleSheet.flatten(row.props.style) ?? {};
      expect([id, role(row), label(row), row.props.accessible, (style.minHeight ?? 0) >= 44]).toEqual([id, 'button', words, true, true]);
      // One element: nothing inside the row is read on its own.
      const inner = within(row).queryAllByRole('button').filter((el) => el !== row);
      expect([id, inner.length]).toEqual([id, 0]);
    }
    // Appearance: the pill is the button, read with its value.
    const pill = within(screen.getByTestId('you-row-appearance')).getByRole('button');
    expect(label(pill)).toBe('Appearance, Light');
    // Section labels are headers.
    expect(roleAbove(screen.getByText('Help & about'))).toBe('header');
    expect(roleAbove(screen.getByText('Subscription'))).toBe('header');
    await screen.unmount();

    // Beta and Pro read their plan in the row's label.
    resetTierForTests();
    setDemoPaywall(null);
    given('beta');
    await renderRows();
    expect(label(screen.getByTestId('you-row-plan'))).toBe('Plan & usage, Kitted beta');
    await screen.unmount();
    resetTierForTests();
    given('proPaywall');
    await renderRows();
    expect(label(screen.getByTestId('you-row-plan'))).toBe('Plan & usage, Kitted Pro');
  });
});

// ── Verify round 2 (REPORT.md → Verification, round 2: defects 1–5) ────────────────────────────────────────────────
/** The landing's geometry, through the ScrollView's own events. */
async function page(frame: number, content: number) {
  const sv = screen.getByTestId('you-scroll');
  await fireEvent(sv, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 402, height: frame } } });
  await fireEvent(sv, 'contentSizeChange', 402, content);
}
const rowsAt = (y: number) =>
  fireEvent(screen.getByTestId('you-rows'), 'layout', { nativeEvent: { layout: { x: 0, y, width: 370, height: 500 } } });
const scrollArgs = () => scrollTo.mock.calls.map((c) => c[0] as { y?: number; animated?: boolean });

/** The first host element at or above `el` (the badge around the pick's number). */
function hostAbove(el: ReactTestInstance): ReactTestInstance | null {
  for (let n: ReactTestInstance | null = el.parent as ReactTestInstance | null; n; n = n.parent as ReactTestInstance | null) {
    if (typeof n.type === 'string') return n;
  }
  return null;
}

/** The lowest host element that holds both `a` and `b`. */
function commonHost(a: ReactTestInstance, b: ReactTestInstance): ReactTestInstance | null {
  const chain = new Set<ReactTestInstance>();
  for (let n: ReactTestInstance | null = a; n; n = n.parent as ReactTestInstance | null) chain.add(n);
  for (let n: ReactTestInstance | null = b; n; n = n.parent as ReactTestInstance | null) {
    if (chain.has(n) && typeof n.type === 'string' && n !== a && n !== b) return n;
  }
  return null;
}

describe('verify round 2 · the landing, its bars, and the largest text', () => {
  it('SY1.1 · the landing allows for the bars: rows just under a 116 pt nav bar; a short page ends above an 83 pt tab bar', async () => {
    const withBars = (
      <SafeAreaInsetsContext.Provider value={{ top: 0, bottom: 83, left: 0, right: 0 }}>
        <HeaderHeightContext.Provider value={116}>
          <YouScreen />
        </HeaderHeightContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );
    mockParams = { at: 'settings' };
    // A tall page: the rows' top lands just under the nav bar.
    await render(withBars);
    await screen.findByTestId('you-today');
    await settle();
    await page(874, 3000);
    await rowsAt(640);
    expect(scrollArgs()).toEqual([expect.objectContaining({ y: 640 - space.m - 116, animated: false })]);
    await screen.unmount();

    // A short page (demo 270's numbers): its true end, the tab bar's inset included.
    scrollTo.mockClear();
    await render(withBars);
    await screen.findByTestId('you-today');
    await settle();
    await page(874, 1228);
    await rowsAt(755);
    expect(scrollArgs()).toEqual([expect.objectContaining({ y: 1228 - 874 + 83, animated: false })]);
  });

  it('SY1.1 · a second old link lands on the rows again; coming back by the tab does not', async () => {
    mockParams = { at: 'settings' };
    await renderYou();
    await page(874, 3000);
    await rowsAt(640);
    expect(scrollArgs()).toEqual([expect.objectContaining({ y: 640 - space.m, animated: false })]);
    // He scrolls back to the top himself, then goes to Stylist.
    const sv = screen.getByTestId('you-scroll');
    await fireEvent(sv, 'scrollBeginDrag', { nativeEvent: { contentOffset: { x: 0, y: 600 } } });
    await fireEvent(sv, 'scroll', { nativeEvent: { contentOffset: { x: 0, y: 0 }, contentSize: { width: 402, height: 3000 }, layoutMeasurement: { width: 402, height: 874 } } });
    await act(async () => mockSetFocus(false));
    // Back to You by its tab (no link): You stays where he left it.
    await act(async () => mockSetFocus(true));
    await settle();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    // Stylist again, then the old link again: You lands on the rows again, once.
    await act(async () => mockSetFocus(false));
    await act(async () => {
      mockApplyParams({ at: 'settings' });
      mockSetFocus(true);
    });
    await settle();
    expect(scrollArgs()).toEqual([
      expect.objectContaining({ y: 640 - space.m, animated: false }),
      expect.objectContaining({ y: 640 - space.m, animated: false }),
    ]);
  });

  it('SY1.6 · a one-word row title stays whole on one line (shrinks to fit); a title with spaces wraps', async () => {
    mockAx = true;
    await render(
      <>
        <LinkRow title="Acknowledgements" onPress={() => undefined} />
        <LinkRow title="Plan & usage" value="Free plan" onPress={() => undefined} />
      </>,
    );
    const one = screen.getByText('Acknowledgements');
    const scale = one.props.minimumFontScale as unknown;
    expect([one.props.numberOfLines, one.props.adjustsFontSizeToFit, typeof scale]).toEqual([1, true, 'number']);
    expect([(scale as number) > 0, (scale as number) < 1]).toEqual([true, true]);
    const many = screen.getByText('Plan & usage');
    expect([many.props.numberOfLines ?? 0, !!many.props.adjustsFontSizeToFit]).toEqual([0, false]);
  });

  it("SY1.6 · at the accessibility sizes What Kit knows and See all {n} stack (not squeezed side by side)", async () => {
    given('free');
    const n = liveFacts(await mockStore.facts.all()).length;
    const header = async () => {
      await renderYou();
      const knows = within(screen.getByTestId('you-knows'));
      const box = commonHost(knows.getByText('What Kit knows'), knows.getByLabelText(`See all ${n}`));
      const dir = (StyleSheet.flatten(box?.props.style) ?? {}).flexDirection ?? 'column';
      await screen.unmount();
      return dir;
    };
    // The control: at normal sizes the link sits to the right of the header.
    expect(await header()).toBe('row');
    mockAx = true;
    expect(await header()).toBe('column');
  });

  it("SY1.6 · at the accessibility sizes the style card's pick numbers fit their badge", async () => {
    mockAx = true;
    await render(<StyleTile look="streetwear" width={104} n={1} first />);
    const digit = screen.getByText('1');
    const title = screen.getByText('Streetwear');
    const variant = (digit.props.variant ?? 'body') as keyof typeof textStyles;
    const cap = digit.props.maxFontSizeMultiplier as number | undefined;
    const tallest = textStyles[variant].lineHeight * (cap ?? Number.POSITIVE_INFINITY);
    // Every box between the number and the pill (the badge and anything inside it) must hold the number's tallest
    // line (its line height at its largest allowed scale), or grow with it (no fixed height).
    const boxes: { height?: unknown; maxHeight?: unknown }[] = [];
    for (let n = hostAbove(digit); n && !within(n).queryByText('Streetwear'); n = hostAbove(n)) boxes.push(StyleSheet.flatten(n.props.style) ?? {});
    expect(boxes.length).toBeGreaterThanOrEqual(1);
    expect(title).toBeTruthy();
    const fixed = boxes.flatMap((b) => [b.height, b.maxHeight]).filter((h): h is number => typeof h === 'number');
    for (const h of fixed) expect([h, h >= tallest]).toEqual([h, true]);
  });
});

// ── T44 · your Nov 11 phone pass: the style card shows setup's drawings on squared tiles ─────────────────────────────
describe('T44 · Your style shows each look as a squared tile with its drawing', () => {
  /** The first element at or above `el` whose style has a borderRadius (the tile's own box). */
  const cornerAround = (el: ReactTestInstance): number | undefined => {
    for (let n: ReactTestInstance | null = el; n; n = n.parent) {
      const r = (StyleSheet.flatten(n.props.style) ?? {}).borderRadius;
      if (typeof r === 'number') return r;
    }
    return undefined;
  };

  it("the card lists his picks in pick order, each with its drawn outfits, and the card stays one button", async () => {
    given('free');
    await renderYou();
    const card = within(screen.getByTestId('you-style'));
    const picks = picksOf((await mockStore.profile.get('me'))?.styles);
    expect(picks.length).toBeGreaterThan(0);
    // The card's own rendered tree, in reading order.
    type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[] | null };
    const find = (n: Node | string, test: (x: Node) => boolean, out: Node[] = []): Node[] => {
      if (typeof n === 'string') return out;
      if (test(n)) out.push(n);
      for (const c of n.children ?? []) find(c, test, out);
      return out;
    };
    const root = find(screen.toJSON() as unknown as Node, (x) => x.props.testID === 'you-style')[0];
    const words = find(root, (x) => x.type === 'Text').flatMap((x) => (x.children ?? []).filter((c): c is string => typeof c === 'string'));
    // His looks in his order, each with its number ...
    const labels = picks.map((k) => styleLabel(k));
    expect(words.filter((c) => labels.includes(c))).toEqual(labels);
    expect(words.filter((c) => /^[123]$/.test(c))).toEqual(picks.map((_, i) => String(i + 1)));
    // ... each with its drawing (two outfits, hidden from VoiceOver); the card is still the one button.
    const art = find(root, (x) => typeof x.props.testID === 'string' && x.props.testID.startsWith('style-art-'));
    expect(art.map((x) => x.props.testID)).toEqual(picks.map((k) => `style-art-${k}`));
    for (const a of art) expect(find(a, (x) => x.type === 'RNSVGSvgView' || x.type === 'Svg' || x.type === 'RNSVGSvgViewAndroid').length).toBeGreaterThan(0);
    expect(card.getAllByRole('button')).toHaveLength(1);
  });

  it('a tile is a rounded rectangle with setup\'s tile corner, not a capsule', async () => {
    await render(<StyleTile look="streetwear" width={104} n={1} first />);
    const corner = cornerAround(screen.getByText('Streetwear'));
    expect(corner).toBe(radius.look + 1);
    // A capsule would be half the tile's height (about 70+ pt here); this is the same few points setup uses.
    expect(corner).toBeLessThan(20);
  });

  it('on Style profile a tile is a button that says its pick order; an unpicked one is not selected', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <StyleTile look="minimalist" width={104} n={2} ring onPress={onPress} accessibilityLabel="Minimal, pick 2" />
        <StyleTile look="workwear" width={104} onPress={onPress} accessibilityLabel="Workwear" />
      </>,
    );
    const picked = screen.getByRole('button', { name: 'Minimal, pick 2' });
    fireEvent.press(picked);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(picked.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole('button', { name: 'Workwear' }).props.accessibilityState).toMatchObject({ selected: false });
    // Its number shows only when picked.
    expect(screen.getAllByText(/^[123]$/)).toHaveLength(1);
  });

  it('at the accessibility sizes a tile is a row: the drawing on the left, the name and number beside it', async () => {
    mockAx = true;
    await render(<StyleTile look="streetwear" width={300} row n={1} first />);
    const art = screen.getByTestId('style-art-streetwear', { includeHiddenElements: true });
    // The tile's own box (the nearest ancestor with a border) lays its art and words out in a row.
    let box: ReactTestInstance | null = art.parent;
    while (box && !(StyleSheet.flatten(box.props.style) ?? {}).borderWidth) box = box.parent;
    expect((StyleSheet.flatten(box?.props.style) ?? {}).flexDirection).toBe('row');
  });
});
