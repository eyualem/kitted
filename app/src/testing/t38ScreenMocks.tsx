// Test only, never imported by the app. T38's shared screen-test set-up (tasks/T38/TESTING.md "Shared set-up"), used by
// drawnWelcomeScreens.test.tsx, drawnWelcomeNoExample.test.tsx and drawnWelcomeOtherReading.test.tsx: the module mocks,
// the state they read at call time (mockT38), and the helpers. Import it first in the test file, so its jest.mock calls
// are registered before the screens load.
//
// The design system becomes plain Text / View / Pressable (Reanimated needs the native runtime). GarmentArt draws a
// marker View carrying its `spec`, so a test reads what is drawn right now and inside which piece wrapper.
// useFocusEffect runs its callback like a real focus (and its cleanup like a blur), so a forced status bar would show.
import { act, configure, fireEvent, render, screen, within } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { onChange, type Topic } from '@/data/changes';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { SPECS, type TableName } from '@/data/tables';
import { resolveColors } from '@/design-system/tokens';
import { NeckDownPhoto, PhotoBubble } from '@/design-system/components/Chat';
import { demoPhoto } from '@/demo/demoPhotos';

export type MockTheme = {
  scheme: 'light' | 'dark'; colors: unknown; fixed: unknown;
  a11y: { reduceMotion: boolean; reduceTransparency: boolean; boldText: boolean; highContrast: boolean };
  fontScale: number; isAccessibilitySize: boolean; archivoLoaded: boolean; isFixedDark: boolean;
};

/** What the mocks read at call time; reset before every test by setUpT38Tests. */
export const mockT38 = {
  theme: undefined as unknown as MockTheme,
  accounts: false,
  slow: 1,
  params: {} as Record<string, string>,
  canGoBack: true,
  store: undefined as unknown as KittedStore,
};

export function themeFor(o: { scheme?: 'light' | 'dark'; reduceMotion?: boolean; ax?: boolean } = {}): MockTheme {
  const scheme = o.scheme ?? 'light';
  return {
    scheme, colors: resolveColors(scheme, false), fixed: {},
    a11y: { reduceMotion: o.reduceMotion ?? false, reduceTransparency: false, boldText: false, highContrast: false },
    fontScale: o.ax ? 1.79 : 1, isAccessibilitySize: o.ax ?? false, archivoLoaded: true, isFixedDark: false,
  };
}

jest.mock('@/design-system', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  const tokens = jest.requireActual('@/design-system/tokens');
  const score = jest.requireActual('@/design-system/score');
  const typography = jest.requireActual('@/design-system/typography');
  const symbols = jest.requireActual('@/design-system/symbols');
  const { t } = jest.requireActual('@/i18n/en');
  const chat = jest.requireMock('@/design-system/components/Chat');
  const TextPass = (p: Record<string, unknown>) => <Text {...p} />;
  const ViewPass = (p: Record<string, unknown>) => <View {...p} />;
  const Press = ({ title, label, onPress, accessibilityLabel, disabled }: Record<string, never>) => (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label ?? title} onPress={onPress} disabled={disabled}>
      {title ? <Text>{title}</Text> : null}
    </Pressable>
  );
  const explicit: Record<string, unknown> = {
    KText: TextPass, MonoLabel: TextPass, Numeral: TextPass, WovenLabel: TextPass,
    KCard: ViewPass, KCardSection: ViewPass, Seam: ViewPass, TextLinkRow: ViewPass, RowDivider: ViewPass,
    KButton: Press, TextLink: Press, IconButton: Press,
    ScoreBlock: ({ score: s, verdict, onPress }: { score: number; verdict?: string; onPress?: () => void }) => (
      <View>
        <Pressable testID="mock-score-block" onPress={onPress}>
          <Text>{score.displayScore(s)}</Text>
          <Text>{score.scoreWordLabel(s)}</Text>
        </Pressable>
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
    StylistMessage: ({ children, showHeader }: { children: string; showHeader?: boolean }) => (
      <View>
        {showHeader ? <Text>{t('common.who')}</Text> : null}
        <Text>{children}</Text>
      </View>
    ),
    PhotoBubble: chat.PhotoBubble,
    NeckDownPhoto: chat.NeckDownPhoto,
    useTheme: () => mockT38.theme,
  };
  const base: Record<string | symbol, unknown> = { ...tokens, ...score, ...typography, ...symbols, ...explicit, __esModule: true };
  // Anything else the screens draw from the design system is a plain View around its children.
  return new Proxy(base, {
    get: (target, prop) => (prop in target ? target[prop] : typeof prop === 'string' && /^[A-Z]/.test(prop) ? ViewPass : undefined),
  });
});
jest.mock('@/design-system/components/Chat', () => {
  const { View } = jest.requireActual('react-native');
  const base: Record<string | symbol, unknown> = {
    __esModule: true,
    PhotoBubble: jest.fn(() => <View testID="photo-bubble" />),
    NeckDownPhoto: jest.fn(() => <View testID="neck-down-photo" />),
  };
  return new Proxy(base, {
    get: (target, prop) => (prop in target ? target[prop] : typeof prop === 'string' && /^[A-Z]/.test(prop) ? (p: Record<string, unknown>) => <View {...p} /> : undefined),
  });
});
jest.mock('@/features/closet/GarmentArt', () => {
  const { View } = jest.requireActual('react-native');
  return {
    GarmentArt: jest.fn(({ spec, size }: { spec: unknown; size: number }) => <View testID="garment-art" spec={spec} size={size} />),
    PieceArt: jest.fn(() => <View testID="piece-art" />),
  };
});
jest.mock('@/features/why/PartsBreakdown', () => {
  const { View } = jest.requireActual('react-native');
  return { PartsBreakdown: jest.fn(() => <View testID="mock-parts-breakdown" />) };
});
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => mockT38.canGoBack), dismiss: jest.fn(), dismissAll: jest.fn(), navigate: jest.fn() },
    useLocalSearchParams: jest.fn(() => mockT38.params),
    // Runs like a real focus (and its cleanup like a blur), so a status-bar style forced on focus is seen.
    useFocusEffect: jest.fn((cb: () => void | (() => void)) => useEffect(() => cb(), [cb])),
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
jest.mock('@/features/account/account', () => ({ useAccountsOn: () => mockT38.accounts, accountsOn: () => mockT38.accounts }));
jest.mock('@/data/db', () => ({
  get store() {
    return mockT38.store;
  },
}));
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
jest.mock('@/features/fitcheck/reveal', () => ({ revealSlow: () => mockT38.slow }));

export type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[]; queryAll(p: (n: Node) => boolean): Node[] };
export const textOf = (n: Node | string): string => (typeof n === 'string' ? n : n.children.map(textOf).join(''));
export const root = () => screen.container as unknown as Node;
export const allNodes = (n: Node = root()) => n.queryAll(() => true);
export const allTexts = (n: Node = root()) => n.queryAll((x) => x.type === 'Text').map(textOf);
/** The card's parts are looked up inside `welcome-card`, and the drawn pieces inside the drawing they belong to
 *  (`welcome-drawing` on Welcome, `example-bubble` on the Example check), so an invisible measuring copy elsewhere
 *  (`welcome-card-measure`) can't be mistaken for what he sees. */
function scopeOf(id: string): string | null {
  if (id.startsWith('welcome-card-')) return 'welcome-card';
  if (id.startsWith('drawn-piece-')) return screen.queryByTestId('welcome-drawing') ? 'welcome-drawing' : 'example-bubble';
  return null;
}
export const byId = (id: string): Node | null => {
  const scope = scopeOf(id);
  if (!scope) return screen.queryByTestId(id) as unknown as Node | null;
  const host = screen.queryByTestId(scope);
  return host ? (within(host).queryByTestId(id) as unknown as Node | null) : null;
};
export const getId = (id: string): Node => {
  const n = byId(id);
  if (!n) throw new Error(`Unable to find an element with testID: ${id}`);
  return n;
};
export const textAt = (id: string) => textOf(getId(id));
export const artIn = (n: Node | null) => (n ? n.queryAll((x) => x.props.testID === 'garment-art').map((x) => x.props.spec) : []);
export const tree = () => JSON.stringify(screen.toJSON());

export async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}
export async function mount(el: ReactElement) {
  return render(el);
}
export async function press(el: unknown) {
  await fireEvent.press(el as never);
}
export function appStateListeners(): ((s: string) => void)[] {
  const add = AppState.addEventListener as unknown as jest.Mock;
  return add.mock.calls.filter((c) => c[0] === 'change').map((c) => c[1] as (s: string) => void);
}
/** The mocked display's frames. iOS stops requestAnimationFrame while the app is in the background: a frame due then
 *  is held, not run, and the held frames run on the first frame after he comes back (setAppState('active')). So a
 *  swap whose clock counts frames, not time, is caught coming back mid-swap (verifier's M9). */
const frames = {
  background: false,
  nextId: 1,
  /** id → the pending 16 ms timer, or the callback held while backgrounded. */
  pending: new Map<number, { timer: ReturnType<typeof setTimeout> | null; cb: (ts: number) => void }>(),
};
function scheduleFrame(id: number, cb: (ts: number) => void) {
  const entry = { timer: null as ReturnType<typeof setTimeout> | null, cb };
  entry.timer = setTimeout(() => {
    if (frames.background) {
      entry.timer = null; // held until he's back
      return;
    }
    frames.pending.delete(id);
    cb(Date.now());
  }, 16);
  frames.pending.set(id, entry);
}
function requestFrame(cb: (ts: number) => void): number {
  const id = frames.nextId++;
  if (frames.background) frames.pending.set(id, { timer: null, cb });
  else scheduleFrame(id, cb);
  return id;
}
function cancelFrame(id: number) {
  const entry = frames.pending.get(id);
  if (entry?.timer) clearTimeout(entry.timer);
  frames.pending.delete(id);
}
export async function setAppState(s: 'active' | 'background' | 'inactive') {
  (AppState as unknown as { currentState: string }).currentState = s;
  frames.background = s === 'background';
  if (s === 'active') for (const [id, entry] of [...frames.pending]) if (!entry.timer) scheduleFrame(id, entry.cb);
  await act(async () => {
    appStateListeners().forEach((l) => l(s));
  });
}

/** Every write to the store (method calls) and every change notice, from now on. */
export function watchStore(store: KittedStore) {
  const writes: string[] = [];
  const s = store as unknown as Record<string, unknown>;
  const wrap = (obj: Record<string, unknown>, name: string, label: string) => {
    const orig = obj[name] as (...a: unknown[]) => Promise<unknown>;
    obj[name] = (...a: unknown[]) => {
      writes.push(name === 'setKv' ? `kv:${String(a[0])}=${String(a[1])}` : `${label}.${name}:${JSON.stringify(a[0])}`);
      return orig.apply(obj, a);
    };
  };
  wrap(s, 'setKv', 'kv');
  wrap(s, 'deleteKv', 'kv');
  wrap(s, 'wipe', 'store');
  const tables = Object.keys(SPECS) as TableName[];
  for (const tname of tables) for (const m of ['put', 'patch', 'delete']) wrap(s[tname] as Record<string, unknown>, m, tname);
  const changes: string[] = [];
  const topics: Topic[] = [...tables, 'kv'];
  const off = onChange(topics, () => changes.push('change'));
  return { writes, changes, off };
}
export async function storeIsEmpty() {
  expect(await mockT38.store.fitChecks.all()).toEqual([]);
  expect(await mockT38.store.chat.all()).toEqual([]);
  expect(await mockT38.store.usage.all()).toEqual([]);
  expect(await mockT38.store.closet.all()).toEqual([]);
  expect(await mockT38.store.readings.all()).toEqual([]);
  expect(await mockT38.store.getKv('onboarding.step')).toBeNull();
  expect(await mockT38.store.getKv('reveal.fullShown')).toBeNull();
}

/** No photo of a person anywhere on screen: no lookup, no photo bubble, no Image (hidden or not). */
export function expectNoPhoto() {
  expect(demoPhoto).toHaveBeenCalledTimes(0);
  expect(PhotoBubble).toHaveBeenCalledTimes(0);
  expect(NeckDownPhoto).toHaveBeenCalledTimes(0);
  expect(screen.queryAllByTestId('photo-image')).toHaveLength(0);
  expect(screen.queryAllByTestId('photo-bubble')).toHaveLength(0);
  expect(screen.queryAllByTestId('neck-down-photo')).toHaveLength(0);
  expect(allNodes().filter((n) => /image/i.test(n.type) || n.props.source !== undefined)).toHaveLength(0);
  expect(allTexts().some((x) => /A real photo|Here's a real check/.test(x))).toBe(false);
}

/** beforeEach / afterEach for a T38 screen test file: fake timers, a fresh memory store watched for writes, fetch
 *  that rejects (offline) and must never be called, and no haptic in any test.
 *
 *  The clock: Jest's modern fake timers for setTimeout / setInterval and Date, with React's microtasks left real (so
 *  jest.getTimerCount() counts only the screen's own timers and frames). requestAnimationFrame is a 16 ms frame on the
 *  fake clock (a 60 Hz display; React Native's Jest preset makes it a 0 ms timeout, and Jest can't fake it because the
 *  preset defines it after the fake clock is built), and performance.now() reads the fake clock too, so the swap's
 *  clock is the same whichever of Date.now(), performance.now() or the frame's timestamp the hook uses. As on iOS,
 *  frames stop while setAppState('background') holds them, and resume on 'active' (the fake clock keeps going). */
export function setUpT38Tests() {
  const state = { watch: undefined as unknown as ReturnType<typeof watchStore>, fetchMock: undefined as unknown as jest.Mock };
  const g = globalThis as unknown as Record<string, unknown> & { performance: { now: () => number } };
  const realFetch = globalThis.fetch;
  const realRaf = g.requestAnimationFrame;
  const realCaf = g.cancelAnimationFrame;
  const realPerfNow = g.performance.now;
  let watch: ReturnType<typeof watchStore>;
  let fetchMock: jest.Mock;
  beforeEach(async () => {
    // Queries see everything, VoiceOver-hidden or not (the drawing is hidden); the tests check hiding explicitly.
    configure({ defaultIncludeHiddenElements: true });
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick', 'setImmediate', 'clearImmediate'] });
    frames.background = false;
    frames.pending.clear();
    g.requestAnimationFrame = requestFrame;
    g.cancelAnimationFrame = cancelFrame;
    g.performance.now = () => Date.now();
    jest.clearAllMocks();
    mockT38.theme = themeFor();
    mockT38.accounts = false;
    mockT38.slow = 1;
    mockT38.params = {};
    mockT38.canGoBack = true;
    mockT38.store = createMemoryStore();
    await mockT38.store.init();
    watch = watchStore(mockT38.store);
    state.watch = watch;
    // Offline: anything on these screens that reached for the network would reject, and fail below.
    fetchMock = jest.fn(() => Promise.reject(new Error('T38 test: no network on Welcome or the Example check')));
    globalThis.fetch = fetchMock as never;
    state.fetchMock = fetchMock;
    (AppState as unknown as { currentState: string }).currentState = 'active';
  });

  afterEach(() => {
    watch.off();
    globalThis.fetch = realFetch;
    g.requestAnimationFrame = realRaf;
    g.cancelAnimationFrame = realCaf;
    g.performance.now = realPerfNow;
    jest.useRealTimers();
    // Nothing sent, and no haptic, in any test here.
    expect(fetchMock).toHaveBeenCalledTimes(0);
    for (const [name, fn] of Object.entries(Haptics)) if (jest.isMockFunction(fn)) expect([name, fn.mock.calls.length]).toEqual([name, 0]);
  });
  return state;
}
