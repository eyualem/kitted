// T53 · You → Notifications (NT3, NT5.4): the real page and the real design system (Reanimated on its Jest mock), over a
// memory store, with the real nudge service behind the app's `nudges` and the test writer's doubles for iOS and the
// scheduler. The time menu is a stand-in (MorphPicker draws its pill, labelled with its accessibilityLabel, and one
// button per option unless disabled). The contract: tasks/T53/TESTING.md.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';
import { AppState, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { createNudgeService } from '@/features/morning/nudgeService';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { NotifyPermission } from '@/services/notifications';
import { iosDouble, schedulerDouble, type IosDouble } from '@/testing/notifyDoubles';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('@/data/db', () => {
  const ref: { store: unknown } = { store: null };
  return { ref, store: new Proxy({}, { get: (_t, k) => (ref.store as Record<string | symbol, unknown> | null)?.[k] }) };
});
jest.mock('@/features/morning/nudgeSession', () => {
  const ref: { nudges: Record<string | symbol, unknown> | null } = { nudges: null };
  return {
    ref, nudges: new Proxy({}, { get: (_t, k) => ref.nudges?.[k] }),
    readyWatch: { appState: async () => {}, checksChanged: async () => {} }, useNotifications: () => {},
  };
});
// The permission in use is switch.ts's `notifications`: here, the test's iOS double.
jest.mock('@/features/paywall/switch', () => {
  const ref: { ios: { permission(): Promise<string>; request(): Promise<string> } | null } = { ios: null };
  return {
    ...jest.requireActual('@/features/paywall/switch'),
    ref,
    notifications: { permission: () => ref.ios!.permission(), request: () => ref.ios!.request() },
    notificationsOn: () => true,
  };
});
// A trial plan: the old page showed "Trial ending" only then.
jest.mock('@/features/settings/usePlan', () => {
  const T = Date.parse('2026-10-22T11:42:00Z');
  return { usePlan: () => ({ kind: 'trial', endsAtMs: T + 7 * 86_400_000 }), isProNow: () => false };
});
jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  return {
    router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
    useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({ demoPlan: 'trial' }),
    useFocusEffect: (cb: () => void | (() => void)) => React.useEffect(cb, [cb]),
    Stack: { Screen: () => null },
  };
});
jest.mock('@/design-system', () => {
  const actual = jest.requireActual('@/design-system');
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  return {
    ...actual,
    MorphPicker: (p: { label: string; accessibilityLabel: string; sections: { options: { value: string; label: string }[] }[]; onPick?: (v: string) => void; disabled?: boolean }) =>
      React.createElement(
        RN.View,
        null,
        React.createElement(
          RN.Pressable,
          { accessibilityRole: 'button', accessibilityLabel: p.accessibilityLabel, accessibilityState: { disabled: !!p.disabled }, disabled: p.disabled },
          React.createElement(RN.Text, null, p.label),
        ),
        p.disabled
          ? null
          : p.sections.flatMap((s) => s.options).map((o) =>
              React.createElement(RN.Pressable, { key: o.value, accessibilityRole: 'button', accessibilityLabel: `option ${o.label}`, onPress: () => p.onPick?.(o.value) }, React.createElement(RN.Text, null, o.label)),
            ),
      ),
  };
});

// After the mocks (Jest hoists them).
import { ThemeProvider } from '@/design-system';
import NotificationsScreen from '@/app/(tabs)/you/notifications';

const dbRef = (jest.requireMock('@/data/db') as { ref: { store: KittedStore | null } }).ref;
const nudgesRef = (jest.requireMock('@/features/morning/nudgeSession') as { ref: { nudges: unknown } }).ref;
const iosRef = (jest.requireMock('@/features/paywall/switch') as { ref: { ios: IosDouble | null } }).ref;

const at = (iso: string) => Date.parse(iso);
const T0 = at('2026-10-22T11:42:00Z'); // 7:42 am EDT
const HEADER = "An outfit idea once a day, and a heads-up when a fit check finishes after you leave. That's all I send.";
const OCT23_29 = ['10-23', '10-24', '10-25', '10-26', '10-27', '10-28', '10-29'];

async function page(o: { permission?: NotifyPermission; answer?: 'allow' | 'deny' | 'pending'; idea?: '1' | '0' | null; ready?: '1' | '0' | null; ideaTime?: string | null; profile?: boolean; paused?: boolean } = {}) {
  const store: KittedStore = createMemoryStore();
  await store.init();
  if (o.profile !== false) {
    await store.profile.put({
      id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
      lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: o.ideaTime === undefined ? '08:00' : o.ideaTime, units: 'imperial', createdAt: T0,
    });
  }
  const idea = o.idea === undefined ? '1' : o.idea;
  if (idea) await store.setKv('notify.idea', idea);
  if (o.ready) await store.setKv('notify.ready', o.ready);
  if (o.paused) await store.setKv('notify.paused', '1');
  const clock = manualClock(T0);
  const ios = iosDouble(o.answer ?? 'allow', o.permission ?? 'granted');
  const sched = schedulerDouble();
  const nudges = createNudgeService({
    store, clock, ids: counterIds(), built: () => true, permissions: ios, scheduler: sched, canSuggest: async () => false, ageBlocked: async () => false, afterTodaysCard: async () => {},
  });
  dbRef.store = store;
  nudgesRef.nudges = nudges;
  iosRef.ios = ios;
  const appState: ((s: string) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, cb: (s: string) => void) => {
    appState.push(cb);
    return { remove: () => {} };
  }) as never);
  const openSettings = jest.spyOn(Linking, 'openSettings').mockImplementation(async () => {});
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ThemeProvider scheme="light">
        <NotificationsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  await screen.findByTestId('notifs-idea');
  return { store, clock, ios, sched, nudges, appState, openSettings, kv: (k: string) => store.getKv(k) };
}

/** Every label and text in the drawn tree, in order. */
function reading(): string[] {
  const out: string[] = [];
  const walk = (n: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null) => {
    if (n === null) return;
    if (typeof n === 'string') return void out.push(n);
    if (Array.isArray(n)) return void n.forEach(walk);
    const label = n.props?.accessibilityLabel;
    const id = n.props?.testID;
    if (typeof id === 'string') out.push(`#${id}`);
    if (typeof label === 'string') out.push(`[${label}]`);
    (n.children ?? []).forEach(walk);
  };
  walk(screen.toJSON() as ReactTestRendererJSON | ReactTestRendererJSON[] | null);
  return out;
}
const inOrder = (items: string[]) => {
  const seq = reading();
  const idx = items.map((s) => ({ s, i: seq.indexOf(s) }));
  expect(idx.filter((x) => x.i < 0)).toEqual([]);
  expect([...idx].sort((a, b) => a.i - b.i).map((x) => x.s)).toEqual(items);
};
const sw = (id: string) => screen.getByTestId(id);
const toggle = (id: string, v: boolean) => fireEvent(sw(id), 'valueChange', v);
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('NT3.1 · the page', () => {
  it('NT3.1 · header and the three rows in order, no Trial ending (even on a trial plan)', async () => {
    await page();
    expect(screen.getByText(HEADER)).toBeTruthy();
    expect(sw('notifs-idea').props.value).toBe(true);
    expect(sw('notifs-idea').props.accessibilityLabel).toBe('Daily outfit idea');
    expect(sw('notifs-ready').props.value).toBe(true);
    expect(sw('notifs-ready').props.accessibilityLabel).toBe('Fit check ready');
    expect(screen.getByTestId('notifs-time')).toBeTruthy();
    expect(screen.getByLabelText('I get dressed at, 8:00 am')).toBeTruthy();
    expect(screen.getByText('I get dressed at', { includeHiddenElements: true })).toBeTruthy();
    inOrder([HEADER, '#notifs-idea', '#notifs-time', '[I get dressed at, 8:00 am]', '#notifs-ready']);
    expect(screen.queryByTestId('notifs-off-card')).toBeNull();
    const all = reading().join('\n');
    for (const old of ['Trial ending', 'No reminders to open the app', 'Daily outfit idea time, 8:00 am']) expect({ old, present: all.includes(old) }).toEqual({ old, present: false });
    expect(screen.queryByText('Time', { includeHiddenElements: true })).toBeNull();
  });

  it('NT3.1 · before onboarding\'s profile exists, the time row reads 8:00 am', async () => {
    await page({ profile: false });
    expect(screen.getByLabelText('I get dressed at, 8:00 am')).toBeTruthy();
  });
});

describe('NT3.2 · the time and the switch', () => {
  it('NT3.2 · a new time reschedules all 7 at once', async () => {
    const p = await page();
    await fireEvent.press(screen.getByLabelText('option 7:00 am'));
    await waitFor(async () => expect((await p.store.profile.get('me'))!.ideaTime).toBe('07:00'));
    await waitFor(() => expect(p.sched.last()).toEqual({ op: 'replaceNudges', list: expect.any(Array) }));
    expect((await p.sched.pending()).map((n) => n.atMs)).toEqual(OCT23_29.map((d) => at(`2026-${d}T10:45:00Z`)));
    expect(p.sched.lists()).toHaveLength(1);
    await screen.findByLabelText('I get dressed at, 7:00 am');
  });

  it('NT3.2 · switch off: nothing scheduled, the time row hides', async () => {
    const p = await page();
    await p.nudges.reschedule('open');
    expect(await p.sched.pending()).toHaveLength(7);
    await toggle('notifs-idea', false);
    await waitFor(async () => expect(await p.kv('notify.idea')).toBe('0'));
    await waitFor(() => expect(p.sched.last()).toEqual({ op: 'cancelAll' }));
    expect(await p.sched.pending()).toEqual([]);
    expect(await p.kv('notify.through')).toBeNull();
    await waitFor(() => expect(screen.queryByTestId('notifs-time')).toBeNull());
    expect(sw('notifs-idea').props.value).toBe(false);
    expect(sw('notifs-ready').props.value).toBe(true);
    // His time is kept: on again shows 7:00 if he had picked it.
    await p.store.profile.patch('me', { ideaTime: '07:00' });
    await toggle('notifs-idea', true);
    await screen.findByLabelText('I get dressed at, 7:00 am');
    expect(p.ios.requests).toBe(0);
  });
});

describe('NT3.3 · from never asked', () => {
  it("NT3.3 · never asked: switching on shows Apple's prompt; Allow → on, 7 scheduled", async () => {
    const p = await page({ permission: 'undetermined', answer: 'allow', idea: null });
    expect(sw('notifs-idea').props.value).toBe(false);
    expect(screen.queryByTestId('notifs-time')).toBeNull();
    expect(sw('notifs-ready').props.value).toBe(false);
    await toggle('notifs-idea', true);
    await waitFor(() => expect(p.ios.requests).toBe(1));
    await waitFor(() => expect(sw('notifs-idea').props.value).toBe(true));
    await screen.findByTestId('notifs-time');
    expect(await p.sched.pending()).toHaveLength(7);
    expect(await p.kv('notify.idea')).toBe('1');
    expect(screen.queryByTestId('notifs-off-card')).toBeNull();
    expect(p.ios.prompts).toBe(1);
  });

  it('NT3.3 · while the prompt is up the switch shows on and disabled', async () => {
    const p = await page({ permission: 'undetermined', answer: 'pending', idea: null });
    await toggle('notifs-idea', true);
    await waitFor(() => expect(p.ios.requests).toBe(1));
    expect(sw('notifs-idea').props.value).toBe(true);
    expect(sw('notifs-idea').props.disabled).toBe(true);
    expect(await p.sched.pending()).toEqual([]);
  });

  it("NT3.3 · Don't Allow: nothing scheduled, the off card, the switch can't be on", async () => {
    const p = await page({ permission: 'undetermined', answer: 'deny', idea: null });
    await toggle('notifs-idea', true);
    await screen.findByTestId('notifs-off-card');
    expect(screen.getByText('Notifications are off for Kitted.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Settings' })).toBeTruthy();
    expect(sw('notifs-idea').props.disabled).toBe(true);
    expect(sw('notifs-ready').props.disabled).toBe(true);
    expect(sw('notifs-idea').props.value).toBe(true); // his yes kept, greyed (phone 10)
    expect(p.sched.lists().filter((l) => l.length > 0)).toEqual([]);
    expect(await p.sched.pending()).toEqual([]);
    expect(await p.kv('notify.idea')).toBe('1');
    expect(p.ios.prompts).toBe(1);
  });

  it('NT3.3 · Fit check ready on, never asked: the prompt too', async () => {
    const p = await page({ permission: 'undetermined', answer: 'allow', idea: null });
    await toggle('notifs-ready', true);
    await waitFor(() => expect(p.ios.requests).toBe(1));
    await waitFor(() => expect(sw('notifs-ready').props.value).toBe(true));
    expect(await p.kv('notify.ready')).toBe('1');
    expect(sw('notifs-idea').props.value).toBe(false);
    expect(await p.kv('notify.idea')).toBeNull();
    expect(p.sched.lists().filter((l) => l.length > 0)).toEqual([]);
  });

  it('NT3.3 · paused: the daily switch shows off, Fit check ready on; on resumes', async () => {
    const p = await page({ paused: true });
    expect(sw('notifs-idea').props.value).toBe(false);
    expect(screen.queryByTestId('notifs-time')).toBeNull();
    expect(sw('notifs-ready').props.value).toBe(true);
    await toggle('notifs-idea', true);
    await waitFor(async () => expect(await p.sched.pending()).toHaveLength(7));
    expect(await p.kv('notify.paused')).toBeNull();
    expect(p.ios.requests).toBe(0);
  });
});

describe('NT3.4 · off in iOS', () => {
  it('NT3.4 · denied: off card, Open Settings, greyed rows with saved values', async () => {
    const p = await page({ permission: 'denied', idea: '1', ready: null });
    inOrder(['#notifs-off-card', 'Notifications are off for Kitted.', '[Open Settings]', HEADER, '#notifs-idea', '#notifs-time', '#notifs-ready']);
    expect(sw('notifs-idea').props.value).toBe(true);
    expect(sw('notifs-idea').props.disabled).toBe(true);
    expect(sw('notifs-ready').props.value).toBe(true);
    expect(sw('notifs-ready').props.disabled).toBe(true);
    const pill = screen.getByLabelText('I get dressed at, 8:00 am');
    expect(pill).toBeDisabled();
    // Greyed: the time can't be changed.
    const opt = screen.queryByLabelText('option 7:00 am');
    if (opt) await fireEvent.press(opt);
    await settle();
    expect((await p.store.profile.get('me'))!.ideaTime).toBe('08:00');
    expect(p.sched.calls).toEqual([]);
    // Open Settings: Kitted's page in iOS Settings, once.
    await fireEvent.press(screen.getByRole('button', { name: 'Open Settings' }));
    expect(p.openSettings).toHaveBeenCalledTimes(1);
    expect(p.ios.requests).toBe(0);
  });

  it('NT3.4 · back from iOS Settings with them on: the card goes and 7 are scheduled', async () => {
    const p = await page({ permission: 'denied', idea: '1' });
    expect(screen.getByTestId('notifs-off-card')).toBeTruthy();
    expect(p.appState.length).toBeGreaterThan(0);
    p.ios.set('granted');
    for (const cb of p.appState) cb('active');
    await waitFor(() => expect(screen.queryByTestId('notifs-off-card')).toBeNull());
    expect(sw('notifs-idea').props.disabled).not.toBe(true);
    expect(sw('notifs-idea').props.value).toBe(true);
    expect(screen.getByLabelText('I get dressed at, 8:00 am')).not.toBeDisabled();
    // The app-wide return (useNotifications) reschedules; the nudge service, given the same answer, schedules 7.
    expect(await p.nudges.reschedule('foreground')).toMatchObject({ kind: 'scheduled' });
    expect(await p.sched.pending()).toHaveLength(7);
  });
});

describe('NT5.4 · the page for VoiceOver', () => {
  it("NT5.4 · the page's labels and dimmed states", async () => {
    await page();
    expect(sw('notifs-idea').props.accessibilityLabel).toBe('Daily outfit idea');
    expect(sw('notifs-ready').props.accessibilityLabel).toBe('Fit check ready');
    expect(sw('notifs-idea').props.accessibilityRole).toBe('switch');
    expect(screen.getByLabelText('I get dressed at, 8:00 am').props.accessibilityRole).toBe('button');
    // The title is drawn but hidden from VoiceOver (the pill says it).
    expect(screen.queryByText('I get dressed at')).toBeNull();
    expect(screen.getByText('I get dressed at', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByLabelText('I get dressed at, 8:00 am')).not.toBeDisabled();
  });
});
