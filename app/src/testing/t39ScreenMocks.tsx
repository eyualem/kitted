// Test only, never imported by the app. T39's shared render set-up (tasks/T39/TESTING.md "Shared set-up"), used by
// T39-setupScreens.test.tsx, T39-offerCard.test.tsx and T39-styleProfile.test.tsx: the module mocks, the state they read
// at call time (mockT39), and small helpers. Import it first in the test file, so its jest.mock calls are registered
// before the screens load.
//
// The design system becomes plain Text / View / Pressable passing their props through. StylistMessage and UserBubble
// are counted markers (a bubble at opacity 0 is still counted). Nothing may be sent: global.fetch fails the test when
// called, and the app's AI transport is a recording one that must stay empty.
import { act, configure, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { resolveColors } from '@/design-system/tokens';
import { counterIds, setIdFactory } from '@/services/ids';

/** 2026-10-22 07:41 New York (TESTING.md: sessionClock fixed at T0). */
export const T0 = Date.parse('2026-10-22T07:41:00-04:00');

export type MockTheme = {
  scheme: 'light' | 'dark'; colors: ReturnType<typeof resolveColors>; fixed: unknown;
  a11y: { reduceMotion: boolean; reduceTransparency: boolean; boldText: boolean; highContrast: boolean };
  fontScale: number; isAccessibilitySize: boolean; archivoLoaded: boolean; isFixedDark: boolean;
};

export function themeFor(o: { scheme?: 'light' | 'dark'; ax?: boolean } = {}): MockTheme {
  const scheme = o.scheme ?? 'light';
  return {
    scheme, colors: resolveColors(scheme, false), fixed: {},
    a11y: { reduceMotion: false, reduceTransparency: false, boldText: false, highContrast: false },
    fontScale: o.ax ? 1.79 : 1, isAccessibilitySize: o.ax ?? false, archivoLoaded: true, isFixedDark: false,
  };
}

/** What the mocks read at call time; reset before every test by setUpT39Tests. */
export const mockT39 = {
  theme: themeFor(),
  accounts: false,
  params: {} as Record<string, string>,
  canGoBack: true,
  store: undefined as unknown as KittedStore,
  /** The in-memory Keychain (@/data/secure). */
  keychain: { ageBlocked: false, deviceId: null as string | null },
  /** The app's AI transport (@/services/server's aiTransport), recording; it must never be called before Agree. */
  transport: { kind: 'server' as const, send: jest.fn() },
  /** The navigation listeners the screen registered (useNavigation().addListener). */
  listeners: {} as Record<string, ((e: unknown) => void)[]>,
};

jest.mock('@/design-system', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  const tokens = jest.requireActual('@/design-system/tokens');
  const score = jest.requireActual('@/design-system/score');
  const typography = jest.requireActual('@/design-system/typography');
  const symbols = jest.requireActual('@/design-system/symbols');
  const { t } = jest.requireActual('@/i18n/en');
  const TextPass = (p: Record<string, unknown>) => <Text {...p} />;
  const ViewPass = (p: Record<string, unknown>) => <View {...p} />;
  const Press = ({ title, label, onPress, accessibilityLabel, accessibilityHint, disabled, testID }: Record<string, never>) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      {title ? <Text>{title}</Text> : null}
    </Pressable>
  );
  const StylistMessage = jest.fn(({ children, showHeader }: { children?: string; showHeader?: boolean }) => (
    <View testID="mock-stylist-message">
      {showHeader ? <Text>{t('common.who')}</Text> : null}
      <Text>{children}</Text>
    </View>
  ));
  const UserBubble = jest.fn(({ children }: { children?: string }) => (
    <View testID="mock-user-bubble">
      <Text>{children}</Text>
    </View>
  ));
  const explicit: Record<string, unknown> = {
    KText: TextPass, MonoLabel: TextPass, Numeral: TextPass, WovenLabel: TextPass,
    KCard: ViewPass, KCardSection: ViewPass, Seam: ViewPass, RowDivider: ViewPass, ChipFlow: ViewPass,
    KButton: Press, TextLink: Press, IconButton: Press, Chip: Press,
    StylistMessage, UserBubble,
    ScoreBlock: ({ score: s, verdict }: { score: number; verdict?: string }) => (
      <View>
        <Text>{score.displayScore(s)}</Text>
        <Text>{score.scoreWordLabel(s)}</Text>
        {verdict ? <Text>{verdict}</Text> : null}
      </View>
    ),
    FixRow: ({ number, title, detail, gain }: Record<string, string | number | undefined>) => (
      <View>
        <Text>{String(number)}</Text>
        <Text>{title}</Text>
        {detail ? <Text>{detail}</Text> : null}
        {gain ? <Text>{gain}</Text> : null}
      </View>
    ),
    TipLine: ({ lead, text }: { lead?: string; text: string }) => (
      <View>
        {lead ? <Text>{lead}</Text> : null}
        <Text>{text}</Text>
      </View>
    ),
    TagLine: ({ left, right }: { left: string; right?: string }) => (
      <View>
        <Text>{left}</Text>
        {right ? <Text>{right}</Text> : null}
      </View>
    ),
    useTheme: () => mockT39.theme,
  };
  const base: Record<string | symbol, unknown> = { ...tokens, ...score, ...typography, ...symbols, ...explicit, __esModule: true };
  return new Proxy(base, {
    get: (target, prop) => (prop in target ? target[prop] : typeof prop === 'string' && /^[A-Z]/.test(prop) ? ViewPass : undefined),
  });
});
jest.mock('@/design-system/components/Chat', () => {
  const { View } = jest.requireActual('react-native');
  return new Proxy({ __esModule: true } as Record<string | symbol, unknown>, {
    get: (target, prop) => (prop in target ? target[prop] : typeof prop === 'string' && /^[A-Z]/.test(prop) ? (p: Record<string, unknown>) => <View {...p} /> : undefined),
  });
});
jest.mock('@/features/closet/GarmentArt', () => {
  const { View } = jest.requireActual('react-native');
  return { GarmentArt: () => <View testID="garment-art" />, PieceArt: () => <View testID="piece-art" /> };
});
jest.mock('@/features/why/PartsBreakdown', () => {
  const { View } = jest.requireActual('react-native');
  return { PartsBreakdown: () => <View testID="mock-parts-breakdown" /> };
});
jest.mock('@/features/camera/CameraScreen', () => {
  const { View } = jest.requireActual('react-native');
  return { CameraScreen: () => <View testID="camera-screen" />, CameraShell: () => <View testID="camera-shell" /> };
});
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  const state = () => mockT39;
  return {
    router: {
      push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => state().canGoBack), dismiss: jest.fn(), dismissAll: jest.fn(), navigate: jest.fn(),
    },
    useLocalSearchParams: jest.fn(() => state().params),
    useFocusEffect: jest.fn((cb: () => void | (() => void)) => useEffect(() => cb(), [cb])),
    Redirect: ({ href }: { href: unknown }) => (
      <View testID="redirect" href={href}>
        <Text>{typeof href === 'string' ? href : JSON.stringify(href)}</Text>
      </View>
    ),
    useNavigation: () => ({
      addListener: (ev: string, cb: (e: unknown) => void) => {
        const l = state().listeners;
        (l[ev] ??= []).push(cb);
        return () => {
          l[ev] = (l[ev] ?? []).filter((x) => x !== cb);
        };
      },
    }),
    Stack: {
      Screen: ({ options }: { options?: { headerRight?: () => unknown } }) => (options?.headerRight ? <View testID="header-right">{options.headerRight() as never}</View> : null),
    },
  };
});
jest.mock('expo-status-bar', () => ({ setStatusBarStyle: jest.fn(), StatusBar: jest.fn(() => null) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(), notificationAsync: jest.fn(), selectionAsync: jest.fn(), performAndroidHapticsAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: Record<string, unknown>) => <View {...p} testID="photo-image" />, ImageBackground: (p: Record<string, unknown>) => <View {...p} testID="photo-image" /> };
});
jest.mock('@/demo/demoPhotos', () => ({
  demoPhoto: jest.fn((id: string) => ({ id, source: { uri: `test://photo/${id}` }, aspect: 0.8, crop: null })),
  shownPhoto: jest.fn(() => undefined),
  DEMO_PHOTOS: [],
  SAMPLE_ORDER: [],
}));
jest.mock('@/features/account/account', () => {
  const actual = jest.requireActual('@/features/account/account');
  const state = () => mockT39;
  return { ...actual, useAccountsOn: () => state().accounts, accountsOn: () => state().accounts };
});
jest.mock('@/data/db', () => ({
  get store() {
    return mockT39.store;
  },
}));
jest.mock('@/data/secure', () => {
  const k = () => mockT39.keychain;
  return {
    getAgeBlocked: jest.fn(async () => k().ageBlocked),
    setAgeBlocked: jest.fn(async (b: boolean) => {
      k().ageBlocked = b;
    }),
    getDeviceId: jest.fn(async () => k().deviceId),
    setDeviceId: jest.fn(async (id: string) => {
      k().deviceId = id;
    }),
    clearDeviceId: jest.fn(async () => {
      k().deviceId = null;
    }),
  };
});
jest.mock('@/services/server', () => {
  const state = () => mockT39;
  return { aiTransport: () => state().transport, DIRECT_AI: false };
});
jest.mock('@/state/session', () => {
  const actual = jest.requireActual('@/state/session');
  const { fixedClock } = jest.requireActual('@/services/clock');
  // T0, written out: a factory can't read this module's constants (it may run while this module loads).
  const clock = fixedClock(Date.parse('2026-10-22T07:41:00-04:00'));
  return { ...actual, sessionClock: clock, getClock: () => clock, getDemoArgs: () => ({ ...actual.getDemoArgs(), demoScreen: null }) };
});
jest.mock('react-native-safe-area-context', () => {
  const { createContext } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const insets = { top: 62, bottom: 34, left: 0, right: 0 };
  const frame = { x: 0, y: 0, width: 402, height: 874 };
  return {
    useSafeAreaInsets: () => insets, useSafeAreaFrame: () => frame, SafeAreaView: View,
    SafeAreaProvider: ({ children }: { children: unknown }) => children, SafeAreaInsetsContext: createContext(insets),
    initialWindowMetrics: { insets, frame },
  };
});
jest.mock('@/features/fitcheck/reveal', () => ({ revealSlow: () => 1 }));

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────
export type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[]; queryAll(p: (n: Node) => boolean): Node[] };
export const textOf = (n: Node | string): string => (typeof n === 'string' ? n : n.children.map(textOf).join(''));
export const root = () => screen.container as unknown as Node;
export const allNodes = (n: Node = root()) => n.queryAll(() => true);
export const allTexts = (n: Node = root()) => n.queryAll((x) => x.type === 'Text').map(textOf);
export const byId = (id: string): Node | null => screen.queryByTestId(id) as unknown as Node | null;
export const getId = (id: string): Node => {
  const n = byId(id);
  if (!n) throw new Error(`Unable to find an element with testID: ${id}`);
  return n;
};
export const textAt = (id: string) => textOf(getId(id));
/** Host elements in tree order with a testID (the screen's own parts). */
export const idsInOrder = () => allNodes().filter((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
export const flat = (n: Node) => StyleSheet.flatten(n.props.style as never) as Record<string, unknown>;
/** Every string a person could see or hear: text children, labels, hints and placeholders. */
export function everyString(): string[] {
  const out: string[] = [];
  for (const n of allNodes()) {
    if (n.type === 'Text') out.push(textOf(n));
    for (const k of ['accessibilityLabel', 'accessibilityHint', 'placeholder', 'aria-label']) {
      const v = n.props[k];
      if (typeof v === 'string') out.push(v);
    }
  }
  return out;
}

export async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}
export async function flush() {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}
export async function mount(el: ReactElement) {
  const r = await render(el);
  await flush();
  return r;
}
export async function press(el: unknown) {
  await fireEvent.press(el as never);
  await flush();
}
export async function typeIn(el: unknown, text: string) {
  await fireEvent.changeText(el as never, text);
  await flush();
}

/** beforeEach / afterEach for a T39 render test file: fake timers, a fresh memory store, an empty Keychain, ids
 *  M-1, M-2, …, a spied Alert, a failing fetch and an empty recording transport. Returns the live handles. */
export function setUpT39Tests() {
  const state = { fetchMock: undefined as unknown as jest.Mock, alert: undefined as unknown as jest.SpyInstance };
  const realFetch = globalThis.fetch;
  beforeEach(async () => {
    configure({ defaultIncludeHiddenElements: true });
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick', 'setImmediate', 'clearImmediate'] });
    jest.clearAllMocks();
    mockT39.theme = themeFor();
    mockT39.accounts = false;
    mockT39.params = {};
    mockT39.canGoBack = true;
    mockT39.keychain = { ageBlocked: false, deviceId: null };
    mockT39.listeners = {};
    mockT39.transport.send = jest.fn(() => Promise.reject(new Error('T39 test: nothing may be sent')));
    mockT39.store = createMemoryStore();
    await mockT39.store.init();
    setIdFactory(counterIds());
    state.fetchMock = jest.fn(() => Promise.reject(new Error('T39 test: no network before Agree')));
    globalThis.fetch = state.fetchMock as never;
    state.alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    state.alert.mockRestore();
    jest.useRealTimers();
    // Nothing sent, in any test here.
    expect(state.fetchMock).toHaveBeenCalledTimes(0);
    expect(mockT39.transport.send).toHaveBeenCalledTimes(0);
  });
  return state;
}
