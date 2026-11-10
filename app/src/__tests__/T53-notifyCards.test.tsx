// T53 · Kit's ask (NT1.2, NT1.4, NT1.5) and the comeback card (NT4.2) as he sees them and as VoiceOver reads them (NT5.4).
// The real cards and the real design system (Reanimated on its Jest mock), driven by the real finish and nudge services
// over a memory store, with the test writer's doubles for iOS and the scheduler. Only the time menu is a stand-in
// (MorphPicker draws its pill, labelled with its accessibilityLabel, and one button per option), KButton is wrapped to
// record its props, and the theme's accessibility size can be forced. The contract: tasks/T53/TESTING.md.
import { fireEvent, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';
import { AccessibilityInfo } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, FitCheckRow } from '@/data/types';
import { createFinishService, type FinishDeps } from '@/features/finish/service';
import { createNudgeService } from '@/features/morning/nudgeService';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { iosDouble, schedulerDouble, type IosDouble } from '@/testing/notifyDoubles';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// The app's wired services: forwarded to the ones each test builds.
jest.mock('@/features/finish/session', () => {
  const ref: { finish: Record<string | symbol, unknown> | null } = { finish: null };
  return { ref, finish: new Proxy({}, { get: (_t, k) => ref.finish?.[k] }), useFinishSequence: () => {}, sequenceOn: () => true, setDemoFinish: () => {} };
});
jest.mock('@/features/morning/nudgeSession', () => {
  const ref: { nudges: Record<string | symbol, unknown> | null } = { nudges: null };
  return {
    ref, nudges: new Proxy({}, { get: (_t, k) => ref.nudges?.[k] }),
    readyWatch: { appState: async () => {}, checksChanged: async () => {} }, useNotifications: () => {},
  };
});
jest.mock('@/design-system', () => {
  const actual = jest.requireActual('@/design-system');
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  const mockUi = { ax: false, buttons: [] as { title: string; kind?: string; fullWidth?: boolean }[] };
  return {
    ...actual,
    mockUi,
    useTheme: () => ({ ...actual.useTheme(), isAccessibilitySize: mockUi.ax }),
    KButton: (p: { title: string; kind?: string; fullWidth?: boolean }) => {
      mockUi.buttons.push({ title: p.title, kind: p.kind, fullWidth: p.fullWidth });
      return React.createElement(actual.KButton, p);
    },
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
import { NotifyAskCard } from '@/features/finish/NotifyAskCard';
import { ComebackCard } from '@/features/morning/ComebackCard';

const ui = (jest.requireMock('@/design-system') as { mockUi: { ax: boolean; buttons: { title: string; kind?: string; fullWidth?: boolean }[] } }).mockUi;
const finishRef = (jest.requireMock('@/features/finish/session') as { ref: { finish: unknown } }).ref;
const nudgesRef = (jest.requireMock('@/features/morning/nudgeSession') as { ref: { nudges: unknown } }).ref;

const at = (iso: string) => Date.parse(iso);
const T0 = at('2026-10-22T11:42:00Z'); // 7:42 am EDT
const LAPSE = at('2026-10-29T13:00:00Z'); // a week later, 9:00 am
const ASK = "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before.";
const COMEBACK = 'I paused your daily ideas after a week without a visit. Want them back?';

function check(id: string, createdAt: number): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 6.5, rawScore: 6.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: true, readingId: null, parentId: null, itemIds: [], details: {},
  } as FitCheckRow;
}

async function services(o: { ios?: IosDouble; ideaTime?: string; now?: number } = {}) {
  const store: KittedStore = createMemoryStore();
  await store.init();
  await store.profile.put({
    id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
    lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: o.ideaTime ?? '08:00', units: 'imperial', createdAt: T0,
  });
  const clock = manualClock(o.now ?? T0);
  const ios = o.ios ?? iosDouble('allow');
  const sched = schedulerDouble();
  const ids = counterIds();
  const nudges = createNudgeService({
    store, clock, ids, built: () => true, permissions: ios, scheduler: sched, canSuggest: async () => false, ageBlocked: async () => false, afterTodaysCard: async () => {},
  });
  const deps: FinishDeps = {
    store, clock, ids, busy: () => false, paywallOn: () => false, isPro: () => false, notificationsOn: () => true, notifications: ios,
    stylistInFront: () => true, openPaywall: () => {}, later: () => {}, ageBlocked: async () => false, afterTodaysCard: async () => {},
    rescheduleNudges: async () => {
      await nudges.reschedule('change');
    },
  };
  const finish = createFinishService(deps);
  finishRef.finish = finish;
  nudgesRef.nudges = nudges;
  return { store, clock, ios, sched, nudges, finish };
}

/** His first fit is scored and the setup ask is posted. */
async function askOnScreen(o: Parameters<typeof services>[0] = {}) {
  const s = await services(o);
  await s.store.fitChecks.put(check('a', T0 - 60_000));
  await s.finish.ensure();
  const id = (await s.store.chat.all()).find((m) => m.payload.question === 'notify')!.id;
  const m = async () => (await s.store.chat.get(id))!;
  return { ...s, id, m };
}

/** A week away: the comeback question is posted. */
async function comebackOnScreen(o: { now?: number } = {}) {
  const s = await services({ ios: iosDouble('allow', 'granted') });
  await s.store.setKv('notify.idea', '1');
  await s.nudges.reschedule('open');
  s.clock.set(o.now ?? LAPSE);
  const res = (await s.nudges.reschedule('open')) as { messageId: string };
  const m = async () => (await s.store.chat.get(res.messageId))!;
  return { ...s, id: res.messageId, m };
}

const wrap = (el: React.ReactElement) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <ThemeProvider scheme="light">{el}</ThemeProvider>
  </SafeAreaProvider>
);
const flush = () => new Promise((r) => setTimeout(r, 0));

/** Every label and text in the drawn tree, in order (what's on screen, top to bottom). */
function reading(): string[] {
  const out: string[] = [];
  const walk = (n: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null) => {
    if (n === null) return;
    if (typeof n === 'string') return void out.push(n);
    if (Array.isArray(n)) return void n.forEach(walk);
    const label = n.props?.accessibilityLabel;
    if (typeof label === 'string') out.push(`[${label}]`);
    (n.children ?? []).forEach(walk);
  };
  walk(screen.toJSON() as ReactTestRendererJSON | ReactTestRendererJSON[] | null);
  return out;
}
const indexOf = (seq: string[], s: string) => {
  const i = seq.indexOf(s);
  expect({ s, found: i >= 0 }).toEqual({ s, found: true });
  return i;
};
const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  ui.ax = false;
  ui.buttons.length = 0;
  jest.restoreAllMocks();
});

describe("NT1.2 · Kit's ask, one step", () => {
  it('NT1.2 · one step: question, time row, two buttons', async () => {
    const a = await askOnScreen();
    await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    expect(screen.getByTestId('notify-ask')).toBeTruthy();
    expect(screen.getByLabelText(`Kit: ${ASK}`)).toBeTruthy();
    const row = screen.getByTestId('notify-ask-time-row');
    expect(screen.getByLabelText('I get dressed at, 8:00 am')).toBeTruthy();
    expect(screen.getByText('I get dressed at', { includeHiddenElements: true })).toBeTruthy();
    expect(row).toBeTruthy();
    const seq = reading();
    const order = [`[Kit: ${ASK}]`, '[I get dressed at, 8:00 am]', '[Send me ideas]', '[No thanks]'].map((s) => indexOf(seq, s));
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(ui.buttons.filter((b) => b.title === 'Send me ideas').every((b) => b.kind === undefined || b.kind === 'primary')).toBe(true);
    expect(ui.buttons.filter((b) => b.title === 'No thanks').every((b) => b.kind === 'secondary')).toBe(true);
    expect(new Set(ui.buttons.map((b) => b.title))).toEqual(new Set(['Send me ideas', 'No thanks']));
    // Must not: the old two-step card.
    const all = seq.join('\n');
    for (const old of ['Yes, pick a time', 'Set 8:00 am', 'Daily idea at', 'Daily outfit idea time']) expect({ old, present: all.includes(old) }).toEqual({ old, present: false });
  });

  it('NT1.2 · his own time on the pill; picking one changes the pill and saves nothing', async () => {
    const a = await askOnScreen({ ideaTime: '07:30' });
    const r = await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    expect(screen.getByLabelText('I get dressed at, 7:30 am')).toBeTruthy();
    const b = await askOnScreen();
    await r.rerender(wrap(<NotifyAskCard m={await b.m()} showHeader />));
    await fireEvent.press(screen.getByLabelText('option 7:30 am'));
    await flush();
    await r.rerender(wrap(<NotifyAskCard m={await b.m()} showHeader />));
    expect(screen.getByLabelText('I get dressed at, 7:30 am')).toBeTruthy();
    expect(screen.queryByLabelText('I get dressed at, 8:00 am')).toBeNull();
    expect((await b.store.profile.get('me'))!.ideaTime).toBe('08:00');
    expect(b.sched.calls).toEqual([]);
    expect(b.ios.requests).toBe(0);
  });

  it('NT1.2 · a stored picking card from an older build renders as the open card', async () => {
    const a = await askOnScreen();
    const m = await a.m();
    await render(wrap(<NotifyAskCard m={{ ...m, payload: { question: 'notify', state: 'picking', time: '08:00' } } as ChatMessage} showHeader />));
    expect(screen.getByTestId('notify-ask')).toBeTruthy();
    expect(screen.getByLabelText('I get dressed at, 8:00 am')).toBeTruthy();
    expect(button('Send me ideas')).toBeTruthy();
    expect(button('No thanks')).toBeTruthy();
    expect(screen.queryByText(/^Set /)).toBeNull();
  });
});

describe('NT1.4–NT1.5 · the answered line', () => {
  it('NT1.4 · Send me ideas → Allow: the done line, no buttons; the stored "today" stays', async () => {
    const a = await askOnScreen();
    const r = await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    await fireEvent.press(button('Send me ideas'));
    await flush();
    await flush();
    expect(a.ios.requests).toBe(1);
    await r.rerender(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    expect(screen.getByTestId('notify-ask-line')).toBeTruthy();
    expect(screen.getByLabelText('Kit: Done. Your first idea lands today at 7:45 am.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send me ideas' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'No thanks' })).toBeNull();
    expect(screen.queryByTestId('notify-ask-time-row')).toBeNull();
    // The clock passes 7:45: the line reads its stored "today".
    a.clock.advance(30 * 60_000);
    await r.rerender(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    expect(screen.getByLabelText('Kit: Done. Your first idea lands today at 7:45 am.')).toBeTruthy();
  });

  it('NT1.4 · tomorrow, and a stored allowed card with no `when` reads tomorrow', async () => {
    const a = await askOnScreen();
    const m = await a.m();
    await render(wrap(<NotifyAskCard m={{ ...m, payload: { question: 'notify', state: 'allowed', time: '08:00', when: 'tomorrow' } } as ChatMessage} showHeader />));
    expect(screen.getByLabelText('Kit: Done. Your first idea lands tomorrow at 7:45 am.')).toBeTruthy();
    await render(wrap(<NotifyAskCard m={{ ...m, id: 'M-old', payload: { question: 'notify', state: 'allowed', time: '08:00' } } as ChatMessage} showHeader />));
    expect(screen.getByLabelText('Kit: Done. Your first idea lands tomorrow at 7:45 am.')).toBeTruthy();
    // Never the get-dressed time as the landing time.
    expect(screen.queryByLabelText(/lands (today|tomorrow) at 8:00 am/)).toBeNull();
  });

  it("NT1.5 · Don't Allow and No thanks: the later line, no buttons", async () => {
    for (const [answer, press] of [['deny', 'Send me ideas'], ['allow', 'No thanks']] as const) {
      const a = await askOnScreen({ ios: iosDouble(answer) });
      const r = await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
      await fireEvent.press(button(press));
      await flush();
      await flush();
      await r.rerender(wrap(<NotifyAskCard m={await a.m()} showHeader />));
      expect(screen.getByTestId('notify-ask-line')).toBeTruthy();
      expect(screen.getByLabelText('Kit: No problem. You can turn it on later in You → Notifications.')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Send me ideas' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'No thanks' })).toBeNull();
      expect(a.ios.requests).toBe(press === 'No thanks' ? 0 : 1);
    }
  });
});

describe('NT5.4 · VoiceOver and the largest text', () => {
  it('NT5.4 · VoiceOver labels on the ask and the comeback', async () => {
    const a = await askOnScreen();
    await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    expect(screen.getByLabelText(`Kit: ${ASK}`)).toBeTruthy();
    // "Kit" and "I get dressed at" are drawn but hidden from VoiceOver (the pill says it).
    expect(screen.queryByText('I get dressed at')).toBeNull();
    expect(isHiddenFromAccessibility(screen.getByText('I get dressed at', { includeHiddenElements: true }))).toBe(true);
    expect(screen.getByLabelText('I get dressed at, 8:00 am').props.accessibilityRole).toBe('button');
    for (const name of ['Send me ideas', 'No thanks']) expect(button(name).props.accessibilityLabel).toBe(name);

    const c = await comebackOnScreen();
    await render(wrap(<ComebackCard m={await c.m()} showHeader />));
    expect(screen.getByTestId('comeback')).toBeTruthy();
    expect(screen.getByLabelText(`Kit: ${COMEBACK}`)).toBeTruthy();
    const seq = reading();
    const order = [`[Kit: ${COMEBACK}]`, '[Turn them back on]', '[Change the time]', '[No thanks]'].map((s) => indexOf(seq, s));
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    for (const name of ['Turn them back on', 'Change the time', 'No thanks']) expect(button(name).props.accessibilityLabel).toBe(name);
    expect(ui.buttons.filter((b) => b.title === 'Turn them back on').every((b) => b.kind === undefined || b.kind === 'primary')).toBe(true);
    expect(ui.buttons.filter((b) => b.title === 'Change the time' || b.title === 'No thanks').every((b) => b.kind === 'secondary')).toBe(true);
  });

  it("NT5.4 · while Apple's prompt is up: spinner, No thanks disabled", async () => {
    const a = await askOnScreen({ ios: iosDouble('pending') });
    await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    await fireEvent.press(button('Send me ideas'));
    await flush();
    expect(a.ios.requests).toBe(1);
    expect(button('Send me ideas').props.accessibilityState).toMatchObject({ busy: true });
    expect(button('No thanks').props.accessibilityState).toMatchObject({ disabled: true });
    // A second tap on either does nothing.
    await fireEvent.press(button('Send me ideas'));
    await fireEvent.press(button('No thanks'));
    await flush();
    expect(a.ios.requests).toBe(1);
    expect((await a.m()).payload.state).toBe('open');
    expect(await a.store.getKv('notify.idea')).toBe('1');
  });

  it('NT5.4 · focus moves to the answered line', async () => {
    const focus = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus').mockImplementation(() => {});
    // React Native's Jest setup already mocks it, and its calls carry over between tests.
    focus.mockClear();
    // An answered card that scrolls into view takes no focus.
    const old = await askOnScreen();
    const om = await old.m();
    await render(wrap(<NotifyAskCard m={{ ...om, payload: { question: 'notify', state: 'declined', time: '08:00' } } as ChatMessage} showHeader />));
    await flush();
    expect(focus).not.toHaveBeenCalled();

    const answers: [string, 'allow' | 'deny', string, string][] = [
      ['Send me ideas', 'allow', 'Kit: Done. Your first idea lands today at 7:45 am.', 'allowed'],
      ['No thanks', 'allow', 'Kit: No problem. You can turn it on later in You → Notifications.', 'declined'],
    ];
    for (const [press, answer, line, state] of answers) {
      focus.mockClear();
      const a = await askOnScreen({ ios: iosDouble(answer) });
      const r = await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
      expect(focus).not.toHaveBeenCalled();
      await fireEvent.press(button(press));
      await flush();
      await flush();
      expect((await a.m()).payload.state).toBe(state);
      await r.rerender(wrap(<NotifyAskCard m={await a.m()} showHeader />));
      await flush();
      expect(screen.getByLabelText(line)).toBeTruthy();
      expect({ press, focused: focus.mock.calls.length > 0 }).toEqual({ press, focused: true });
    }

    for (const [press, line] of [['Turn them back on', 'Kit: Back on. Next one lands tomorrow at 7:45 am.'], ['No thanks', 'Kit: Done. You can turn them on in You → Notifications.']] as const) {
      focus.mockClear();
      const c = await comebackOnScreen();
      const r = await render(wrap(<ComebackCard m={await c.m()} showHeader />));
      await fireEvent.press(button(press));
      await flush();
      await flush();
      await r.rerender(wrap(<ComebackCard m={await c.m()} showHeader />));
      await flush();
      expect(screen.getByTestId('comeback-line')).toBeTruthy();
      expect(screen.getByLabelText(line)).toBeTruthy();
      expect({ press, focused: focus.mock.calls.length > 0 }).toEqual({ press, focused: true });
    }

    // Change the time: the time row, focused.
    focus.mockClear();
    const c = await comebackOnScreen();
    const r = await render(wrap(<ComebackCard m={await c.m()} showHeader />));
    await fireEvent.press(button('Change the time'));
    await flush();
    await r.rerender(wrap(<ComebackCard m={await c.m()} showHeader />));
    await flush();
    expect(screen.getByTestId('comeback-time-row')).toBeTruthy();
    expect(screen.getByLabelText('I get dressed at, 8:00 am')).toBeTruthy();
    expect(button('Turn them back on')).toBeTruthy();
    expect(button('No thanks')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Change the time' })).toBeNull();
    expect(focus.mock.calls.length > 0).toBe(true);
    // A pick there: back on at the new time.
    await fireEvent.press(screen.getByLabelText('option 7:00 am'));
    await flush();
    await flush();
    await r.rerender(wrap(<ComebackCard m={await c.m()} showHeader />));
    expect(screen.getByLabelText('Kit: Back on. Next one lands tomorrow at 6:45 am.')).toBeTruthy();
    expect(c.ios.requests).toBe(0);
  });

  it('NT5.4 · at accessibility sizes the buttons stack full width', async () => {
    ui.ax = true;
    const a = await askOnScreen();
    await render(wrap(<NotifyAskCard m={await a.m()} showHeader />));
    const c = await comebackOnScreen();
    const r = await render(wrap(<ComebackCard m={await c.m()} showHeader />));
    await fireEvent.press(button('Change the time'));
    await flush();
    await r.rerender(wrap(<ComebackCard m={await c.m()} showHeader />));
    const titles = new Set(ui.buttons.map((b) => b.title));
    expect(titles).toEqual(new Set(['Send me ideas', 'No thanks', 'Turn them back on', 'Change the time']));
    expect(ui.buttons.filter((b) => b.fullWidth !== true)).toEqual([]);
    // At regular sizes they sit in a row, not full width.
    ui.ax = false;
    ui.buttons.length = 0;
    const b = await askOnScreen();
    await render(wrap(<NotifyAskCard m={await b.m()} showHeader />));
    const d = await comebackOnScreen();
    await render(wrap(<ComebackCard m={await d.m()} showHeader />));
    expect(ui.buttons.length).toBeGreaterThanOrEqual(5);
    expect(ui.buttons.filter((x) => x.fullWidth === true)).toEqual([]);
  });

  it('NT4.2 · the comeback card read-only (Past chats): the question only', async () => {
    const c = await comebackOnScreen();
    await render(wrap(<ComebackCard m={await c.m()} showHeader readOnly />));
    expect(screen.getByLabelText(`Kit: ${COMEBACK}`)).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByTestId('comeback-time-row')).toBeNull();
  });
});
