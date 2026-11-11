// T74 · To confirm, one card at a time (specs/closet-beta.md CB2): Closet's "To confirm" shows one question per card
// with "1 of 5", the "How do your … fit?" question last; Skip and a sideways swipe step through (wrapping, saving
// nothing); an answer saves through the closet service with a toast and Undo, and the next card shows; the last answer
// takes the card away. Written before the code (tasks/T74/TESTING.md).
//
// Set-up. The pure rules are called directly. The screen is the real ClosetScreen with the real design system
// (Reanimated and Worklets from their mocks), the real useLive on a memory store loaded with the demo's full closet, and
// the real DuplicateQuestion / FitQuestion. Its open questions come from a mocked `fitCheck.closet.openAsks` (so a test
// can drop or bring back a question, as the store would after an answer or an Undo); `answerDuplicate` /
// `unanswerDuplicate`, `showToast`, `router.push` and the haptics are mocks. The fit question is real: three sightings
// of the demo's dark jeans read slim, wide and wide (§19's DOUBT_STORY, on B3), and the real `fitCard` picks it. The
// pictures are stand-ins that keep their sizes. A swipe goes through the card's own PanResponder handlers with touch
// histories shaped as React Native's responder system sends them. `findNodeHandle` hands back the ref it is given, so
// a focus call can be checked against the element it lands on.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, Dimensions, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { emitChange } from '@/data/changes';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { AskReason, ClosetAsk, ClosetItemRow } from '@/data/types';
import { SCREENS } from '@/demo/scenarios';
import { RowDivider, TextLink, ThemeProvider, trailingIconMetrics } from '@/design-system';
import ClosetScreen from '@/app/(tabs)/closet/index';
import { answerWithUndo } from '@/features/closet/answerToast';
import { askQuestionText, askReasonText, isPluralPiece } from '@/features/closet/askText';
import { DuplicateQuestion } from '@/features/closet/DuplicateQuestion';
import { FitQuestion } from '@/features/closet/FitQuestion';
import { doubtQuestion, doubtSeen, FIT_SKIP_KEY, fitCard, withSkip, type FitDoubt } from '@/features/closet/fitDoubt';
import { closetGridItems, closetSections, pieceSectionLabel } from '@/features/closet/merge';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import * as deckRules from '@/features/closet/toConfirm';
import {
  cardMotion, deckA11y, deckCount, deckTag, DECK_MOTION, dupKey, fitKey, followsFinger, markAnswered, reconcileDeck, showsSkip,
  startDeck, stepDeck, SWIPE, swipeStart, swipeStep, type DeckCard,
} from '@/features/closet/toConfirm';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { fitCheck } from '@/features/fitcheck/session';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import type { GarmentMeasurer, MeasuredPieces } from '@/services/measure/garments';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import { sessionClock } from '@/state/session';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
// findNodeHandle(ref) → the ref itself, so AccessibilityInfo.setAccessibilityFocus can be checked against its element.
jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
  ...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
  findNodeHandle: (r: unknown) => r,
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
// SF Symbols as a plain View that keeps its name and size.
jest.mock('expo-symbols', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SymbolView: ({ name, size, weight, fallback: _f, ...rest }: Record<string, unknown>) => (
      <View testID="symbol" symbolName={name} symbolSize={size} symbolWeight={weight} {...rest} />
    ),
  };
});
// The real design system, with RowDivider counted (the 3-at-a-time card drew one between questions).
jest.mock('@/design-system', () => ({ ...jest.requireActual('@/design-system'), RowDivider: jest.fn(() => null) }));
// The pictures: stand-ins that keep the sizes they're given.
jest.mock('@/features/closet/SightingCrop', () => {
  const { View } = jest.requireActual('react-native');
  return { SightingCrop: (p: { width: number; height: number }) => <View testID="stand-crop" standW={p.width} standH={p.height} /> };
});
jest.mock('@/features/closet/ClosetTile', () => {
  const { View } = jest.requireActual('react-native');
  return {
    ClosetTile: (p: { size: number; aspect?: number; item: { id: string } }) => (
      <View testID="stand-tile" standSize={p.size} standAspect={p.aspect} standItem={p.item.id} />
    ),
  };
});
// What a question shows as evidence (its photos and his answer count): set per test.
const mockEvidence: { current: unknown } = { current: { thisPhoto: null, inCloset: null, answered: 0 } };
jest.mock('@/features/closet/askEvidence', () => ({
  ...jest.requireActual('@/features/closet/askEvidence'),
  useAskEvidence: () => mockEvidence.current,
}));
jest.mock('@/features/closet/PieceMenu', () => {
  const { Text } = jest.requireActual('react-native');
  return { PieceMenu: ({ item }: { item: { name: string } }) => <Text>{`tile:${item.name}`}</Text> };
});
jest.mock('@/features/closet/OutfitsView', () => {
  const { Text } = jest.requireActual('react-native');
  return { OutfitsView: () => <Text>outfits-view</Text> };
});
jest.mock('@/features/settings/SettingsList', () => {
  const { Text, View } = jest.requireActual('react-native');
  return { Section: ({ children }: { children?: unknown }) => <View>{children as never}</View>, LinkRow: ({ title }: { title: string }) => <Text>{title}</Text> };
});
jest.mock('@/features/fitcheck/session', () => ({
  fitCheck: { closet: { openAsks: jest.fn(async () => []) }, answerDuplicate: jest.fn(), unanswerDuplicate: jest.fn(async () => ({})) },
}));
jest.mock('@/features/closet/photoChecks', () => ({ loadPhotoChecks: async () => [], livePhotoDeps: {} }));
jest.mock('@/features/scan/inbox', () => ({ INBOX_KEY: 'scan.inbox', parseInbox: () => [], waitingRow: () => null }));
jest.mock('@/router/stylistAction', () => ({ goToStylist: jest.fn() }));
jest.mock('@/features/toast/toast', () => ({ ...jest.requireActual('@/features/toast/toast'), showToast: jest.fn() }));
jest.mock('@/data/db', () => ({ store: {} }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() } }));

// The screen's toConfirm as Interfaces gives it (the module still has the 3-at-a-time one until T74 is built).
const toConfirm = deckRules.toConfirm as unknown as <Q extends { ask: { obsId: string } }, F extends { item: { id: string } }>(
  open: readonly Q[], fit: F | null,
) => DeckCard<Q, F>[];

// ------------------------------------------------------------------------------------------------ the world
const AS_OF = Date.parse('2026-10-22T12:00:00-04:00');
const NOW = Date.parse('2026-10-22T12:20:00-04:00');
/** A card's move (240 ms slide, 150 ms fade, 200 ms spring) has ended by then. */
const MOVE_MS = 300;
/** An answer's focus waits for the toast's announcement, or this long. */
const ANNOUNCE_CAP_MS = 1500;

interface Q { checkId: string; obsId: string; itemId: string; candidateId: string; runnerUpId?: string; reason: AskReason; reasonWord?: string }
/** Four open "Is this your …?" questions, newest first, on real pieces of the demo's full closet (and one that arrives later). */
const QA: Q = { checkId: 'K-a', obsId: 'O-qa', itemId: 'Q-a', candidateId: 'B1', reason: 'color' }; // khaki chinos
const QB: Q = { checkId: 'K-b', obsId: 'O-qb', itemId: 'Q-b', candidateId: 'T3', runnerUpId: 'T6', reason: 'type', reasonWord: 'sweatshirt' }; // navy crewneck
const QC: Q = { checkId: 'K-c', obsId: 'O-qc', itemId: 'Q-c', candidateId: 'S2', reason: 'shoes' }; // brown loafers
const QD: Q = { checkId: 'K-d', obsId: 'O-qd', itemId: 'Q-d', candidateId: 'L1', reason: 'logo' }; // navy overshirt
const QZ: Q = { checkId: 'K-z', obsId: 'O-qz', itemId: 'Q-z', candidateId: 'T1', reason: 'color' }; // white tee
const FOUR = [QA, QB, QC, QD];

const askOf = (q: Q): ClosetAsk => ({
  obsId: q.obsId, itemId: q.itemId, candidateId: q.candidateId, ...(q.runnerUpId ? { runnerUpId: q.runnerUpId } : {}),
  answer: null, reason: q.reason, reasonWord: q.reasonWord ?? null,
});

const mockOpen: { current: { checkId: string; ask: ClosetAsk }[] } = { current: [] };
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The demo's full closet, each question's own piece beside it (waiting on his answer), and the dark jeans read slim,
 *  wide, wide when `fit`. Returns the store and the words each card says. */
async function world(o: { asks: Q[]; fit: boolean; folded?: true }) {
  const mem = createMemoryStore();
  await loadScenario(mem, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: AS_OF });
  for (const [i, q] of [QA, QB, QC, QD, QZ].entries()) {
    const c = (await mem.closet.get(q.candidateId))!;
    await mem.closet.put({ ...c, id: q.itemId, maybeSameAs: q.candidateId, addedAt: AS_OF + 1000 + i });
  }
  const jeans = (await mem.closet.get('B3'))!;
  if (o.fit) {
    for (const [i, leg] of ['slim', 'wide', 'wide'].entries()) {
      await mem.closetObs.put({
        id: `O-fit-${i}`, itemId: 'B3', fitCheckId: null, readingId: null, closetReadingId: null, garmentIndex: null, origin: 'garment',
        garment: { ...jeans.garment, leg_shape: leg }, closet: null, sampledHex: null, sampledL: null, cropFile: null, cropQuality: null,
        decision: 'same', identityScore: null, candidates: [], askItemId: null, answeredAt: null, userConfirmed: null,
        createdAt: AS_OF - (3 - i) * 86_400_000, isDeleted: false,
      } as never);
    }
  }
  mockOpen.current = o.asks.map((q) => ({ checkId: q.checkId, ask: askOf(q) }));
  // These tests are about the open card: since To confirm folds (CB2 "Folded", the founder, Nov 10) he has opened it.
  // The folded row has its own tests (CB2.11, at the end; `folded: true` leaves it as he first finds it).
  if (!o.folded) await mem.setKv('closet.confirm.open', 'open');
  jest.requireMock<{ store: unknown }>('@/data/db').store = mem;
  const all = await mem.closet.all();
  const byId = new Map(all.map((c) => [c.id, c]));
  const owned = all.filter(isOwned);
  const fc = fitCard(owned.filter((c) => !isAwaitingAnswer(c, owned)), await mem.closetObs.all(), {});
  const sections = closetSections(closetGridItems(all));
  return { mem, byId, fc, jeans, firstSection: pieceSectionLabel(sections.sections[0]!) };
}

/** The words of a question card: its question, its reason, and its VoiceOver label at a place in the deck. */
function wordsOf(q: Q, byId: Map<string, ClosetItemRow>) {
  const c = byId.get(q.candidateId)!;
  const item = lower(c.name);
  const question = askQuestionText(item, c.slot);
  const reason = askReasonText({ reason: q.reason, reasonWord: q.reasonWord ?? null }, isPluralPiece(c.slot));
  return { item, question, reason, label: (n: number, total: number) => `Question ${n} of ${total}. ${t('closet.q.a11y', { question, item, reason })}` };
}

// ------------------------------------------------------------------------------------------------ the device
const listeners: { event: string; fn: (e: unknown) => void }[] = [];
let focusSpy: jest.SpyInstance;

function device(o: { fontScale?: number; reduceMotion?: boolean } = {}) {
  const fontScale = o.fontScale ?? 1;
  const d = { width: 402, height: 874, scale: 3, fontScale };
  Dimensions.set({ window: d, screen: d });
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(o.reduceMotion ?? false);
}

beforeEach(() => {
  jest.clearAllMocks();
  listeners.length = 0;
  device();
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((event: string, fn: (e: unknown) => void) => {
    const l = { event, fn };
    listeners.push(l);
    return { remove: () => void listeners.splice(listeners.indexOf(l) >>> 0, listeners.includes(l) ? 1 : 0) };
  }) as never);
  focusSpy = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus').mockImplementation(() => undefined);
  jest.spyOn(sessionClock, 'nowMs').mockReturnValue(NOW);
  mockEvidence.current = { thisPhoto: null, inCloset: null, answered: 0 };
  jest.mocked(fitCheck.closet.openAsks).mockImplementation(async () => mockOpen.current.slice());
  jest.mocked(fitCheck.answerDuplicate).mockImplementation((async (c: string) => ({ id: c })) as never);
  jest.mocked(fitCheck.unanswerDuplicate).mockImplementation((async (c: string) => ({ id: c })) as never);
});

afterEach(async () => {
  await cleanup();
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------------------------------------ the tree
type HostEl = { type: string; props: Record<string, unknown>; children: (HostEl | string)[]; parent: HostEl | null };
const hostEls = (e: HostEl): HostEl[] => [e, ...e.children.flatMap((c) => (typeof c === 'string' ? [] : hostEls(c)))];
const root = () => screen.container as unknown as HostEl;
const all = () => hostEls(root());
const byTestId = (id: string, under: HostEl = root()) => hostEls(under).filter((e) => e.props.testID === id);
const one = (id: string) => {
  const xs = byTestId(id);
  if (xs.length !== 1) throw new Error(`expected one ${id}, found ${xs.length}`);
  return xs[0]!;
};
const textsOf = (e: HostEl): string[] =>
  hostEls(e).filter((x) => x.type === 'Text').map((x) => x.children.filter((c): c is string => typeof c === 'string').join('')).filter((s) => s.length > 0);
const allTexts = () => textsOf(root());
const flat = (e: HostEl) => (StyleSheet.flatten(e.props.style as never) ?? {}) as Record<string, unknown>;
const hiddenFromVoiceOver = (e: HostEl | null): boolean => {
  for (let x = e; x; x = x.parent) if (x.props.accessibilityElementsHidden === true || x.props.importantForAccessibility === 'no-hide-descendants') return true;
  return false;
};

/** Every view gets a width (the grid, the pictures and the card measure themselves). */
async function layoutAll(width = 362) {
  for (const el of all().filter((e) => typeof e.props.onLayout === 'function')) {
    await fireEvent(el as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height: 300 } } });
  }
}

async function settle(ms = MOVE_MS, width = 362) {
  await act(async () => {
    await sleep(ms);
  });
  await layoutAll(width);
  await act(async () => {
    await sleep(0);
  });
}

async function openCloset(width = 362) {
  await render(
    <ThemeProvider>
      <ClosetScreen />
    </ThemeProvider>,
  );
  await settle(60, width);
  await settle(30, width);
}

/** What the card shows: its tag line's words and its question's VoiceOver label. Exactly one card, one question. */
function shown() {
  const cards = byTestId('closet-confirm-card');
  if (cards.length !== 1) throw new Error(`expected one card, found ${cards.length}`);
  const qs = [...byTestId('closet-confirm-question'), ...byTestId('closet-confirm-fit')];
  if (qs.length !== 1) throw new Error(`expected one question, found ${qs.length}`);
  return { tag: textsOf(one('closet-confirm-tag')), label: qs[0]!.props.accessibilityLabel as string };
}
const tagOf = (n: number, total: number) => ['To confirm', `${n} of ${total}`];

async function tap(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
  await act(async () => {
    await sleep(0);
  });
}
async function skip() {
  await fireEvent.press(within(one('closet-confirm-skip') as never).getByRole('button', { name: 'Skip' }));
  await settle();
}
/** The store drops a question (an answer landed) or brings it back (Undo), and tells the screen. */
async function setOpen(qs: Q[]) {
  mockOpen.current = qs.map((q) => ({ checkId: q.checkId, ask: askOf(q) }));
  await act(async () => {
    emitChange('fitChecks');
    await sleep(20);
  });
  await settle();
}
const scrollView = () => all().find((e) => e.props.contentInsetAdjustmentBehavior === 'automatic')!;
const focusedOn = () => focusSpy.mock.calls.map((c) => {
  const p = (c[0] as { props?: Record<string, unknown> } | null)?.props;
  return (p?.accessibilityLabel as string | undefined) ?? `(no label: ${String(p?.testID ?? c[0])})`;
});
const announce = () => act(async () => {
  for (const l of listeners.filter((x) => x.event === 'announcementFinished')) l.fn({ announcement: 'Saved.', success: true });
  await sleep(0);
});

// ------------------------------------------------------------------------------------------------ a finger
/** One finger on the card, as React Native's responder system reports it (pageX/Y, a touch history, timestamps). */
class Finger {
  private t = 10_000;
  private sx: number; private sy: number; private st: number;
  private x: number; private y: number; private px: number; private py: number; private pt: number;
  granted = false;
  constructor(x = 300, y = 200) {
    this.sx = this.x = this.px = x;
    this.sy = this.y = this.py = y;
    this.st = this.pt = this.t;
  }
  ev(active = true) {
    const touch = { pageX: this.x, pageY: this.y, locationX: this.x, locationY: this.y, identifier: 0, timestamp: this.t, target: 1 };
    return {
      nativeEvent: { ...touch, touches: active ? [touch] : [], changedTouches: [touch] },
      touchHistory: {
        numberActiveTouches: active ? 1 : 0, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: this.t,
        touchBank: [{
          touchActive: active, startPageX: this.sx, startPageY: this.sy, startTimeStamp: this.st, currentPageX: this.x, currentPageY: this.y,
          currentTimeStamp: this.t, previousPageX: this.px, previousPageY: this.py, previousTimeStamp: this.pt,
        }],
      },
      persist() {}, preventDefault() {}, stopPropagation() {}, isDefaultPrevented: () => false, isPropagationStopped: () => false,
    };
  }
  step(dx: number, dy: number, ms: number) {
    this.px = this.x; this.py = this.y; this.pt = this.t;
    this.x += dx; this.y += dy; this.t += ms;
  }
}
/** The card's View with the pan handlers. */
const panCard = () => {
  const xs = byTestId('closet-confirm-card');
  const card = xs.find((e) => typeof e.props.onResponderGrant === 'function') ?? xs[0];
  if (!card) throw new Error('no closet-confirm-card to swipe');
  return card;
};
type Call = (e: unknown) => unknown;
const call = (name: string, e: unknown) => {
  const h = panCard().props[name];
  return typeof h === 'function' ? (h as Call)(e) : undefined;
};
async function down(x = 300, y = 200) {
  const f = new Finger(x, y);
  await act(async () => {
    call('onStartShouldSetResponderCapture', f.ev());
    call('onStartShouldSetResponder', f.ev());
  });
  return f;
}
/** A move: until the card has taken the touch, it is asked (capture first, as the responder system does). */
async function move(f: Finger, dx: number, dy: number, ms: number) {
  f.step(dx, dy, ms);
  await act(async () => {
    const e = f.ev();
    if (!f.granted) {
      const claimed = call('onMoveShouldSetResponderCapture', e) === true || call('onMoveShouldSetResponder', e) === true;
      if (claimed) {
        f.granted = true;
        call('onResponderGrant', e);
      }
    }
    if (f.granted) call('onResponderMove', e);
  });
}
async function lift(f: Finger) {
  await act(async () => {
    if (f.granted) call('onResponderRelease', f.ev(false));
  });
  await settle();
}
/** A slow drag: 12 pt to start, then the rest, then a still second (no fling), and lift. dx is measured from where
 *  the card took the touch, as PanResponder measures it. */
async function swipe(dx: number) {
  const f = await down();
  const start = Math.sign(dx) * 12;
  await move(f, start, 0, 16);
  await move(f, dx, 0, 100);
  await move(f, 0, 0, 1000);
  await lift(f);
  return f;
}

// ================================================================================================ the rules
describe('the deck\'s rules (pure)', () => {
  const K = ['a', 'b', 'c', 'd', 'e'];
  const open = (n: number) => Array.from({ length: n }, (_, i) => ({ checkId: `K${i}`, ask: { obsId: `O${i}` } }));
  const fit = { item: { id: 'B3' }, doubt: { field: 'leg' } };

  it('CB2.1 · the deck holds every question, the fit question last', () => {
    const open4 = open(4);
    const deck = toConfirm(open4, fit);
    expect(deck).toHaveLength(5);
    expect(deck.map((c) => c.kind)).toEqual(['dup', 'dup', 'dup', 'dup', 'fit']);
    expect(deck.map((c) => c.key)).toEqual(['dup:O0', 'dup:O1', 'dup:O2', 'dup:O3', 'fit:B3']);
    expect(deck.slice(0, 4).map((c) => (c.kind === 'dup' ? c.q : null))).toEqual(open4);
    expect(deck[0]!.kind === 'dup' && deck[0]!.q).toBe(open4[0]);
    expect(deck[4]!.kind === 'fit' && deck[4]!.fit).toBe(fit);
    expect(dupKey('O7')).toBe('dup:O7');
    expect(fitKey('B3')).toBe('fit:B3');
    // No fit question, none at all, and no cap.
    expect(toConfirm(open4, null).map((c) => c.key)).toEqual(['dup:O0', 'dup:O1', 'dup:O2', 'dup:O3']);
    expect(toConfirm([], null)).toEqual([]);
    expect(toConfirm(open(7), null)).toHaveLength(7);
    expect(toConfirm([], fit).map((c) => [c.kind, c.key])).toEqual([['fit', 'fit:B3']]);
    // The 3-at-a-time rule is gone.
    expect(Object.keys(deckRules)).not.toContain('TO_CONFIRM_MAX');
    // A fresh mount starts on card 1; the count and its words.
    const keys = deck.map((c) => c.key);
    expect(startDeck(keys)).toEqual({ key: 'dup:O0', undoKey: null });
    expect(startDeck([])).toEqual({ key: null, undoKey: null });
    expect(deckCount(keys, keys[0]!)).toEqual({ n: 1, total: 5 });
    expect(deckCount(keys, 'fit:B3')).toEqual({ n: 5, total: 5 });
    expect(deckTag(1, 5)).toBe('1 of 5');
    expect(deckTag(2, 5)).toBe('2 of 5');
    expect(deckTag(1, 1)).toBe('1 of 1');
  });

  it('CB2.2 · an answer moves to the next card (reconcile)', () => {
    expect(markAnswered({ key: 'b', undoKey: null }, 'b')).toEqual({ key: 'b', undoKey: 'b' });
    const r = reconcileDeck({ key: 'b', undoKey: 'b' }, K, ['a', 'c', 'd', 'e']);
    expect(r).toEqual({ state: { key: 'c', undoKey: 'b' }, move: 'forward' });
    expect(deckCount(['a', 'c', 'd', 'e'], r.state.key!)).toEqual({ n: 2, total: 4 });
    const first = reconcileDeck({ key: 'a', undoKey: 'a' }, K, ['b', 'c', 'd', 'e']);
    expect(first).toEqual({ state: { key: 'b', undoKey: 'a' }, move: 'forward' });
    expect(deckCount(['b', 'c', 'd', 'e'], 'b')).toEqual({ n: 1, total: 4 });
    // The last card answered while others remain: card 1.
    const last = reconcileDeck({ key: 'e', undoKey: null }, K, ['a', 'b', 'c', 'd']);
    expect(last).toEqual({ state: { key: 'a', undoKey: null }, move: 'forward' });
    expect(deckCount(['a', 'b', 'c', 'd'], 'a')).toEqual({ n: 1, total: 4 });
  });

  it('CB2.3 · Undo brings the card back in its place (reconcile)', () => {
    const back = reconcileDeck({ key: 'c', undoKey: 'b' }, ['a', 'c', 'd', 'e'], K);
    expect(back).toEqual({ state: { key: 'b', undoKey: null }, move: 'back' });
    expect(deckCount(K, back.state.key!)).toEqual({ n: 2, total: 5 });
    // He skipped on before Undo: still that card.
    const skipped = reconcileDeck({ key: 'd', undoKey: 'b' }, ['a', 'c', 'd', 'e'], K);
    expect(skipped).toEqual({ state: { key: 'b', undoKey: null }, move: 'back' });
    expect(deckCount(K, skipped.state.key!)).toEqual({ n: 2, total: 5 });
    // Undo after the last card: it appears again.
    const again = reconcileDeck({ key: null, undoKey: 'a' }, [], ['a']);
    expect(again).toEqual({ state: { key: 'a', undoKey: null }, move: 'appear' });
    expect(deckCount(['a'], 'a')).toEqual({ n: 1, total: 1 });
  });

  it('CB2.4 · stepping wraps both ways', () => {
    expect(stepDeck(K, 'e', 1)).toBe('a');
    expect(stepDeck(K, 'a', -1)).toBe('e');
    expect(stepDeck(K, 'b', 1)).toBe('c');
    expect(stepDeck(K, 'c', -1)).toBe('b');
    expect(stepDeck(['a'], 'a', 1)).toBe('a');
    expect(stepDeck(['a'], 'a', -1)).toBe('a');
    expect(showsSkip([{ kind: 'dup' }])).toBe(false);
    expect(showsSkip([{ kind: 'fit' }])).toBe(true);
    expect(showsSkip([{ kind: 'dup' }, { kind: 'dup' }])).toBe(true);
    expect(showsSkip([{ kind: 'dup' }, { kind: 'fit' }])).toBe(true);
    expect(showsSkip([])).toBe(false);
  });

  it('CB2.4 · the swipe\'s start and commit rules', () => {
    expect(SWIPE).toEqual({ startX: 12, failY: 10, commit: 1 / 3, flick: 500 });
    expect(swipeStart(12, 0)).toBe('claim');
    expect(swipeStart(11, 0)).toBe('wait');
    expect(swipeStart(4, 10)).toBe('fail');
    expect(swipeStart(30, 10)).toBe('fail');
    expect(swipeStart(-12, 9)).toBe('claim');
    expect(swipeStart(0, -10)).toBe('fail');
    expect(swipeStep(-121, 0, 362, 5)).toBe(1);
    expect(swipeStep(-120, 0, 362, 5)).toBe(0);
    expect(swipeStep(121, 0, 362, 5)).toBe(-1);
    expect(swipeStep(40, 600, 362, 5)).toBe(-1);
    expect(swipeStep(-40, -500, 362, 5)).toBe(1);
    expect(swipeStep(-40, -499, 362, 5)).toBe(0);
    expect(swipeStep(40, -600, 362, 5)).toBe(0);
    expect(swipeStep(-200, 0, 362, 1)).toBe(0);
    expect(swipeStep(0, 900, 362, 5)).toBe(0);
  });

  it('CB2.6 · the last answer empties the deck (reconcile)', () => {
    expect(reconcileDeck({ key: 'a', undoKey: 'a' }, ['a'], [])).toEqual({ state: { key: null, undoKey: 'a' }, move: 'empty' });
    expect(reconcileDeck({ key: 'a', undoKey: null }, ['a'], [])).toEqual({ state: { key: null, undoKey: null }, move: 'empty' });
    // Nothing before and nothing now: nothing moves. A first question arriving: it appears.
    expect(reconcileDeck({ key: null, undoKey: null }, [], [])).toEqual({ state: { key: null, undoKey: null }, move: 'none' });
    expect(reconcileDeck({ key: null, undoKey: null }, [], ['a', 'b'])).toEqual({ state: { key: 'a', undoKey: null }, move: 'appear' });
  });

  it('CB2.9 · Reduce Motion cross-fades', () => {
    expect(cardMotion(false)).toEqual({ kind: 'slide', ms: 240 });
    expect(cardMotion(true)).toEqual({ kind: 'fade', ms: 150 });
    expect(followsFinger(true)).toBe(false);
    expect(followsFinger(false)).toBe(true);
    expect(DECK_MOTION).toEqual({ slideMs: 240, fadeMs: 150, springMs: 200, gap: 16 });
  });

  it('CB2.10 · a question answered elsewhere leaves the deck (reconcile)', () => {
    const stay = reconcileDeck({ key: 'a', undoKey: null }, K, ['a', 'c', 'd', 'e']);
    expect(stay).toEqual({ state: { key: 'a', undoKey: null }, move: 'none' });
    expect(deckCount(['a', 'c', 'd', 'e'], 'a')).toEqual({ n: 1, total: 4 });
    const on = reconcileDeck({ key: 'b', undoKey: null }, K, ['a', 'c', 'd', 'e']);
    expect(on).toEqual({ state: { key: 'c', undoKey: null }, move: 'forward' });
    expect(deckCount(['a', 'c', 'd', 'e'], 'c')).toEqual({ n: 2, total: 4 });
    const arrived = reconcileDeck({ key: 'b', undoKey: null }, K, ['z', ...K]);
    expect(arrived).toEqual({ state: { key: 'b', undoKey: null }, move: 'none' });
    expect(deckCount(['z', ...K], 'b')).toEqual({ n: 3, total: 6 });
  });

  it('CB2.8 · the card is read as Question n of total first (words)', () => {
    expect(deckA11y(2, 5)).toBe('Question 2 of 5.');
    expect(deckA11y(1, 1)).toBe('Question 1 of 1.');
  });

  it('CB2.8 · Skip\'s chevron scales with the text (metrics)', () => {
    expect(trailingIconMetrics(1)).toEqual({ size: 13, gap: 4 });
    expect(trailingIconMetrics(3.25)).toEqual({ size: 42, gap: 13 });
    expect(trailingIconMetrics(2)).toEqual({ size: 26, gap: 8 });
  });
});

// ================================================================================================ CB2.1
describe('CB2.1 · one card', () => {
  it('CB2.1 · Closet shows one card, 1 of 5', async () => {
    const w = await world({ asks: FOUR, fit: true });
    expect([w.fc?.item.id, w.fc?.doubt.field, w.fc?.doubt.a, w.fc?.doubt.b]).toEqual(['B3', 'leg', 'slim', 'wide']);
    await openCloset();
    expect(byTestId('closet-confirm-deck')).toHaveLength(1);
    expect(byTestId('closet-confirm-card')).toHaveLength(1);
    expect(byTestId('closet-confirm-question')).toHaveLength(1);
    expect(byTestId('closet-confirm-fit')).toHaveLength(0);
    const a = wordsOf(QA, w.byId);
    expect(a.question).toBe('Are these your khaki chinos?');
    expect(shown()).toEqual({ tag: tagOf(1, 5), label: a.label(1, 5) });
    expect(shown().label).toBe(
      'Question 1 of 5. Are these your khaki chinos? The color looked a little different. This photo and your khaki chinos are shown side by side.',
    );
    // The card is the first question's: its words on screen, no other question's, no fit question, no divider.
    const texts = allTexts();
    expect(texts).toContain('Are these your khaki chinos?');
    for (const q of [QB, QC, QD]) {
      const o = wordsOf(q, w.byId);
      expect([o.question, texts.includes(o.question)]).toEqual([o.question, false]);
      expect([o.question, all().some((e) => typeof e.props.accessibilityLabel === 'string' && (e.props.accessibilityLabel as string).includes(o.question))]).toEqual([o.question, false]);
    }
    expect(texts.filter((s) => /^How do your .* fit\?$/.test(s))).toEqual([]);
    expect(all().filter((e) => typeof e.props.accessibilityLabel === 'string' && /How do your/.test(e.props.accessibilityLabel as string))).toEqual([]);
    expect(texts.filter((s) => s === 'To confirm')).toHaveLength(1);
    expect(jest.mocked(RowDivider)).not.toHaveBeenCalled();
  });

  it('CB2.1 · a fresh mount starts on card 1, whatever showed before', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    await skip();
    await skip();
    expect(shown()).toEqual({ tag: tagOf(3, 5), label: wordsOf(QC, w.byId).label(3, 5) });
    await cleanup();
    await openCloset();
    expect(shown()).toEqual({ tag: tagOf(1, 5), label: wordsOf(QA, w.byId).label(1, 5) });
  });

  it('CB2.1 · no questions: no card at all', async () => {
    await world({ asks: [], fit: false });
    await openCloset();
    expect(byTestId('closet-confirm-card')).toHaveLength(0);
    expect(byTestId('closet-confirm-tag')).toHaveLength(0);
    expect(allTexts()).not.toContain('To confirm');
    expect(byTestId('closet-confirm-deck')).toHaveLength(0);
  });

  it('CB2.1 · demo screens 262–264 open Closet on the full closet', () => {
    const at = (n: number) => SCREENS.find((s) => s.n === n);
    expect([262, 263, 264].map((n) => {
      const s = at(n);
      return s ? [s.n, s.name, s.id, s.scenario, s.onboarded, s.href] : [n, 'missing'];
    })).toEqual([
      [262, 'Closet · To confirm, 5 questions', 'C1', 'full', true, '/closet'],
      [263, 'Closet · To confirm, the fit question only', 'C1', 'full', true, '/closet'],
      [264, 'Closet · To confirm, one question', 'C1', 'full', true, '/closet'],
    ]);
  });
});

// ================================================================================================ CB2.2
describe('CB2.2 · an answer saves, says so, and shows the next card', () => {
  it('CB2.2 · Yes, same one saves through the closet service, says so with Undo, and shows 1 of 4', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    await tap('Yes, same one');
    expect(fitCheck.answerDuplicate).toHaveBeenCalledTimes(1);
    expect(fitCheck.answerDuplicate).toHaveBeenCalledWith('K-a', 'O-qa', 'same');
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(jest.mocked(showToast).mock.calls[0]![0]).toBe('Saved as your khaki chinos.');
    expect(typeof jest.mocked(showToast).mock.calls[0]![1]).toBe('function');
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    // The card stays until the store drops the question, then the next one shows.
    await setOpen([QB, QC, QD]);
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: wordsOf(QB, w.byId).label(1, 4) });
    expect(shown().label.startsWith('Question 1 of 4. ')).toBe(true);
    expect(fitCheck.unanswerDuplicate).not.toHaveBeenCalled();
  });

  it('CB2.2 · No, a new one and the runner-up chip', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    await tap('No, a new one');
    expect(jest.mocked(fitCheck.answerDuplicate).mock.calls).toEqual([['K-a', 'O-qa', 'new']]);
    expect(jest.mocked(showToast).mock.calls.map((c) => c[0])).toEqual(['Kept as a new piece.']);
    await setOpen([QB, QC, QD]);
    // Card 1 of 4 (three questions and the fit question) is the navy crewneck, with its runner-up.
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: wordsOf(QB, w.byId).label(1, 4) });
    await tap("It's my black sweatshirt");
    expect(jest.mocked(fitCheck.answerDuplicate).mock.calls).toEqual([['K-a', 'O-qa', 'new'], ['K-b', 'O-qb', 'runnerUp']]);
    expect(jest.mocked(showToast).mock.calls.map((c) => c[0])).toEqual(['Kept as a new piece.', 'Saved as your black sweatshirt.']);
    expect(typeof jest.mocked(showToast).mock.calls[1]![1]).toBe('function');
    // The store drops it: the loafers, 1 of 3 (two questions and the fit question).
    await setOpen([QC, QD]);
    expect(shown()).toEqual({ tag: tagOf(1, 3), label: wordsOf(QC, w.byId).label(1, 3) });
  });

  it('CB2.2 · a light haptic on an answer only', async () => {
    await world({ asks: FOUR, fit: true });
    await openCloset();
    await skip();
    await swipe(-200);
    await swipe(200);
    await skip();
    await skip();
    await skip();
    expect(shown().tag).toEqual(tagOf(5, 5));
    await skip(); // the fit card's Skip
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(shown().tag).toEqual(tagOf(1, 4));
    await tap('Yes, same one');
    expect(jest.mocked(Haptics.impactAsync).mock.calls).toEqual([[Haptics.ImpactFeedbackStyle.Light]]);
  });

  it('CB2.2 · a double tap saves once', async () => {
    await world({ asks: FOUR, fit: true });
    await openCloset();
    await fireEvent.press(screen.getByRole('button', { name: 'Yes, same one' }));
    await act(async () => {
      await sleep(100);
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Yes, same one' }));
    await act(async () => {
      await sleep(20);
    });
    expect(jest.mocked(fitCheck.answerDuplicate).mock.calls).toEqual([['K-a', 'O-qa', 'same']]);
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it('CB2.2 · an answer that didn\'t land: no toast, the same card, and its answers work again after a second', async () => {
    const w = await world({ asks: FOUR, fit: true });
    jest.mocked(fitCheck.answerDuplicate).mockResolvedValue(null as never);
    await openCloset();
    await tap('Yes, same one');
    expect(fitCheck.answerDuplicate).toHaveBeenCalledTimes(1);
    await settle();
    expect(showToast).not.toHaveBeenCalled();
    expect(shown()).toEqual({ tag: tagOf(1, 5), label: wordsOf(QA, w.byId).label(1, 5) });
    await act(async () => {
      await sleep(1000);
    });
    await tap('Yes, same one');
    expect(fitCheck.answerDuplicate).toHaveBeenCalledTimes(2);
    expect(showToast).not.toHaveBeenCalled();
    expect(shown()).toEqual({ tag: tagOf(1, 5), label: wordsOf(QA, w.byId).label(1, 5) });
  });
});

// ================================================================================================ CB2.3
describe('CB2.3 · Undo', () => {
  it('CB2.3 · Undo shows the answered card with its old count', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    await skip();
    const b = wordsOf(QB, w.byId);
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: b.label(2, 5) });
    await tap('Yes, same one');
    expect(jest.mocked(fitCheck.answerDuplicate).mock.calls).toEqual([['K-b', 'O-qb', 'same']]);
    expect(jest.mocked(showToast).mock.calls[0]![0]).toBe('Saved as your navy crewneck.');
    await setOpen([QA, QC, QD]);
    expect(shown()).toEqual({ tag: tagOf(2, 4), label: wordsOf(QC, w.byId).label(2, 4) });
    // Undo on the toast opens the question again; the store brings it back in its place.
    const undo = jest.mocked(showToast).mock.calls[0]![1] as () => void;
    await act(async () => {
      undo();
      await sleep(0);
    });
    expect(jest.mocked(fitCheck.unanswerDuplicate).mock.calls).toEqual([['K-b', 'O-qb']]);
    await setOpen(FOUR);
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: b.label(2, 5) });
    expect(shown().label.startsWith('Question 2 of 5. ')).toBe(true);
  });

  it('CB2.3 · Undo after he skipped on still shows the answered card', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    await skip();
    await tap('Yes, same one');
    await setOpen([QA, QC, QD]);
    await skip(); // on to the overshirt, 3 of 4
    expect(shown()).toEqual({ tag: tagOf(3, 4), label: wordsOf(QD, w.byId).label(3, 4) });
    const undo = jest.mocked(showToast).mock.calls[0]![1] as () => void;
    await act(async () => {
      undo();
      await sleep(0);
    });
    await setOpen(FOUR);
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: wordsOf(QB, w.byId).label(2, 5) });
  });
});

// ================================================================================================ CB2.4
describe('CB2.4 · Skip and swipe', () => {
  it('CB2.4 · Skip and the VoiceOver Skip action move on and save nothing', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    const L = [QA, QB, QC, QD].map((q) => wordsOf(q, w.byId));
    await skip();
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: L[1]!.label(2, 5) });
    await skip();
    expect(shown()).toEqual({ tag: tagOf(3, 5), label: L[2]!.label(3, 5) });
    // The question's VoiceOver action "Skip" does the same.
    await act(async () => {
      fireEvent(one('closet-confirm-question') as never, 'accessibilityAction', { nativeEvent: { actionName: 'skip' } });
    });
    await settle();
    expect(shown()).toEqual({ tag: tagOf(4, 5), label: L[3]!.label(4, 5) });
    await skip();
    const fitLabel = `Question 5 of 5. ${doubtQuestion(w.fc!.doubt, w.jeans.name)} ${doubtSeen(w.fc!.doubt)}`;
    expect(shown()).toEqual({ tag: tagOf(5, 5), label: fitLabel });
    // On the last card a swipe left shows the first; the fit card isn't skipped by it.
    const setKv = jest.spyOn(w.mem, 'setKv');
    await swipe(-200);
    expect(shown()).toEqual({ tag: tagOf(1, 5), label: L[0]!.label(1, 5) });
    expect(setKv.mock.calls.filter((c) => c[0] === FIT_SKIP_KEY)).toEqual([]);
    expect(await w.mem.getKv(FIT_SKIP_KEY)).toBeNull();
    // On the first, a swipe right shows the last.
    await swipe(200);
    expect(shown()).toEqual({ tag: tagOf(5, 5), label: fitLabel });
    expect(fitCheck.answerDuplicate).not.toHaveBeenCalled();
    expect(fitCheck.unanswerDuplicate).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(await w.mem.getKv(FIT_SKIP_KEY)).toBeNull();
  });

  it('CB2.4 · skipped questions stay open: four Skips on four questions come back to card 1', async () => {
    const w = await world({ asks: FOUR, fit: false });
    await openCloset();
    expect(shown().tag).toEqual(tagOf(1, 4));
    for (const n of [2, 3, 4]) {
      await skip();
      expect(shown().tag).toEqual(tagOf(n, 4));
    }
    await skip();
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: wordsOf(QA, w.byId).label(1, 4) });
    expect(fitCheck.answerDuplicate).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('CB2.4 · a swipe moves, wraps and never answers', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    expect(scrollView().props.scrollEnabled).not.toBe(false);
    // While a sideways drag holds the card, Closet doesn't scroll; after it, it does.
    const f = await down();
    await move(f, -12, 0, 16);
    expect(f.granted).toBe(true);
    await move(f, -200, 0, 100);
    expect(scrollView().props.scrollEnabled).toBe(false);
    await move(f, 0, 0, 1000);
    await lift(f);
    expect(scrollView().props.scrollEnabled).not.toBe(false);
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: wordsOf(QB, w.byId).label(2, 5) });
    await swipe(200);
    expect(shown().tag).toEqual(tagOf(1, 5));
    await swipe(200);
    expect(shown().tag).toEqual(tagOf(5, 5));
    // A short slow drag springs back.
    const g = await down();
    await move(g, -12, 0, 16);
    await move(g, -80, 0, 400);
    await move(g, 0, 0, 1000);
    await lift(g);
    expect(shown().tag).toEqual(tagOf(5, 5));
    // A pan that starts on "Yes, same one" moves the card and answers nothing.
    await swipe(-200);
    expect(shown().tag).toEqual(tagOf(1, 5));
    await fireEvent(screen.getByRole('button', { name: 'Yes, same one' }), 'pressIn', { nativeEvent: {} });
    const h = await down(120, 260);
    await move(h, -12, 0, 16);
    expect(h.granted).toBe(true);
    await move(h, -200, 0, 100);
    await move(h, 0, 0, 1000);
    await lift(h);
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: wordsOf(QB, w.byId).label(2, 5) });
    expect(fitCheck.answerDuplicate).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('CB2.4 · a drag that goes 10 pt up or down first is never a swipe', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    const f = await down();
    await move(f, 2, 10, 16);
    expect(f.granted).toBe(false);
    // Then sideways (back to level): still Closet's scroll, not the card's, until the finger lifts.
    await move(f, -200, -10, 100);
    await move(f, 0, 0, 1000);
    expect(f.granted).toBe(false);
    await lift(f);
    expect(shown()).toEqual({ tag: tagOf(1, 5), label: wordsOf(QA, w.byId).label(1, 5) });
    expect(scrollView().props.scrollEnabled).not.toBe(false);
    // The next touch starts fresh: a sideways drag is a swipe again.
    await swipe(-200);
    expect(shown().tag).toEqual(tagOf(2, 5));
  });

  it('CB2.4 · no Skip on a lone question', async () => {
    const w = await world({ asks: [QA], fit: false });
    await openCloset();
    const a = wordsOf(QA, w.byId);
    expect(shown()).toEqual({ tag: tagOf(1, 1), label: a.label(1, 1) });
    expect(byTestId('closet-confirm-skip')).toHaveLength(0);
    expect(allTexts()).not.toContain('Skip');
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
    expect((one('closet-confirm-question').props.accessibilityActions as unknown[] | undefined) ?? []).toEqual([]);
    await swipe(-200);
    expect(shown()).toEqual({ tag: tagOf(1, 1), label: a.label(1, 1) });
    await swipe(200);
    expect(shown()).toEqual({ tag: tagOf(1, 1), label: a.label(1, 1) });
    expect(fitCheck.answerDuplicate).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });
});

// ================================================================================================ CB2.5
describe('CB2.5 · the fit card', () => {
  async function onFitCard() {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    for (let i = 0; i < 4; i++) await skip();
    return w;
  }

  it('CB2.5 · the fit card\'s Skip writes today\'s skip and the deck moves to card 1', async () => {
    const w = await onFitCard();
    const fit = one('closet-confirm-fit');
    expect(w.fc!.doubt).toEqual({ field: 'leg', a: 'slim', b: 'wide', checks: 3, group: 'loose' });
    expect(fit.props.accessibilityLabel).toBe('Question 5 of 5. How do your dark jeans fit? Seen as slim and as wide.');
    expect(fit.props.accessibilityRole).toBe('button');
    expect(fit.props.accessibilityHint).toBe('Opens the choices. Your scores stay the same.');
    expect(fit.props.accessibilityActions).toEqual([{ name: 'skip', label: 'Skip' }]);
    expect(shown().tag).toEqual(tagOf(5, 5));
    const setKv = jest.spyOn(w.mem, 'setKv');
    await skip();
    await settle();
    expect(setKv.mock.calls.map((c) => c[0])).toEqual([FIT_SKIP_KEY]);
    expect(await w.mem.getKv(FIT_SKIP_KEY)).toBe(withSkip({}, 'B3', w.fc!.doubt, NOW));
    // The store drops the fit question: card 1 of 4.
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: wordsOf(QA, w.byId).label(1, 4) });
    expect(showToast).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    // Round again: the fit question is gone.
    for (let i = 0; i < 4; i++) {
      await skip();
      expect(byTestId('closet-confirm-fit')).toHaveLength(0);
      expect(allTexts().filter((s) => /How do your .* fit\?/.test(s))).toEqual([]);
    }
  });

  it('CB2.5 · the fit card\'s VoiceOver Skip does the same', async () => {
    const w = await onFitCard();
    await act(async () => {
      fireEvent(one('closet-confirm-fit') as never, 'accessibilityAction', { nativeEvent: { actionName: 'skip' } });
    });
    await settle();
    await settle();
    expect(await w.mem.getKv(FIT_SKIP_KEY)).toBe(withSkip({}, 'B3', w.fc!.doubt, NOW));
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: wordsOf(QA, w.byId).label(1, 4) });
    expect(showToast).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('CB2.5 · tapping the fit card opens its Leg or Fit sheet', async () => {
    const w = await onFitCard();
    const setKv = jest.spyOn(w.mem, 'setKv');
    await fireEvent.press(one('closet-confirm-fit') as never);
    expect(jest.mocked(router.push).mock.calls).toEqual([['/sheets/edit-item/B3?field=leg&via=card']]);
    await settle();
    expect(setKv).not.toHaveBeenCalled();
    expect(await w.mem.getKv(FIT_SKIP_KEY)).toBeNull();
    expect(shown().tag).toEqual(tagOf(5, 5));
  });

  it('CB2.5 · a lone fit card keeps Skip and goes away after it', async () => {
    const w = await world({ asks: [], fit: true });
    await openCloset();
    expect(shown()).toEqual({ tag: tagOf(1, 1), label: 'Question 1 of 1. How do your dark jeans fit? Seen as slim and as wide.' });
    expect(byTestId('closet-confirm-skip')).toHaveLength(1);
    await skip();
    await settle();
    expect(await w.mem.getKv(FIT_SKIP_KEY)).toBe(withSkip({}, 'B3', w.fc!.doubt, NOW));
    expect(byTestId('closet-confirm-card')).toHaveLength(0);
    expect(byTestId('closet-confirm-deck')).toHaveLength(0);
    expect(allTexts()).not.toContain('To confirm');
    await act(async () => {
      await sleep(ANNOUNCE_CAP_MS + 100);
    });
    expect(focusedOn().slice(-1)).toEqual([w.firstSection]);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('CB2.5 · the Outfits fit card keeps today\'s words (no deck)', async () => {
    const w = await world({ asks: [], fit: true });
    await render(
      <ThemeProvider>
        <FitQuestion item={w.fc!.item} doubt={w.fc!.doubt as FitDoubt} />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('How do your dark jeans fit? Seen as slim and as wide.')).toBeTruthy();
    expect(screen.queryByLabelText(/^Question /)).toBeNull();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
    expect(byTestId('closet-confirm-fit')).toHaveLength(0);
    expect(byTestId('closet-confirm-skip')).toHaveLength(0);
  });
});

// ================================================================================================ CB2.6
describe('CB2.6 · the last answer', () => {
  it('CB2.6 · the last answer leaves no card and no space', async () => {
    const w = await world({ asks: [QA], fit: false });
    await openCloset();
    expect(shown().tag).toEqual(tagOf(1, 1));
    await tap('No, a new one');
    expect(jest.mocked(fitCheck.answerDuplicate).mock.calls).toEqual([['K-a', 'O-qa', 'new']]);
    expect(jest.mocked(showToast).mock.calls.map((c) => c[0])).toEqual(['Kept as a new piece.']);
    await setOpen([]);
    await settle();
    expect(byTestId('closet-confirm-card')).toHaveLength(0);
    expect(byTestId('closet-confirm-tag')).toHaveLength(0);
    expect(byTestId('closet-confirm-deck')).toHaveLength(0);
    expect(allTexts()).not.toContain('To confirm');
    expect(allTexts().filter((s) => /all set/i.test(s))).toEqual([]);
    // Nothing is left in the card's place: each of Closet's rows draws something (an empty View would keep a gap).
    const content = scrollView().children.filter((c): c is HostEl => typeof c !== 'string');
    const rows = content.flatMap((c) => c.children.filter((x): x is HostEl => typeof x !== 'string'));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => textsOf(r).length > 0)).toEqual(rows.map(() => true));
    // VoiceOver moves to the first section title.
    await act(async () => {
      await sleep(ANNOUNCE_CAP_MS + 100);
    });
    expect(focusedOn()).toEqual([w.firstSection]);
    // Undo brings the card back as 1 of 1.
    const undo = jest.mocked(showToast).mock.calls[0]![1] as () => void;
    await act(async () => {
      undo();
      await sleep(0);
    });
    expect(jest.mocked(fitCheck.unanswerDuplicate).mock.calls).toEqual([['K-a', 'O-qa']]);
    await setOpen([QA]);
    expect(shown()).toEqual({ tag: tagOf(1, 1), label: wordsOf(QA, w.byId).label(1, 1) });
  });
});

// ================================================================================================ CB2.7
describe('CB2.7 · the pictures', () => {
  const shot = { photo: { id: 'p', source: 1, aspect: 0.75 }, box: [100, 200, 500, 600], top: 0, mirrored: false };
  /** The picture in a frame wrapper: [width, height]. */
  const sizeIn = (wrapperId: string): [number, number] => {
    const [wrap] = byTestId(wrapperId);
    if (!wrap) throw new Error(`no ${wrapperId}`);
    const crop = byTestId('stand-crop', wrap)[0];
    if (crop) return [crop.props.standW as number, crop.props.standH as number];
    const tile = byTestId('stand-tile', wrap)[0]!;
    return [tile.props.standSize as number, Math.round((tile.props.standSize as number) * (tile.props.standAspect as number))];
  };

  it('CB2.7 · the deck\'s pictures are 96 by 110', async () => {
    mockEvidence.current = { thisPhoto: shot, inCloset: null, answered: 0 };
    await world({ asks: FOUR, fit: true });
    await openCloset(322);
    expect(sizeIn('closet-confirm-photo')).toEqual([96, 110]);
    expect(sizeIn('closet-confirm-incloset')).toEqual([96, 110]);
    // This photo is the crop; the piece in his closet its drawing (no photo of it), drawn 96 wide at 110/96.
    expect(byTestId('stand-crop', one('closet-confirm-photo'))).toHaveLength(1);
    const tile = byTestId('stand-tile', one('closet-confirm-incloset'))[0]!;
    expect(tile.props.standSize).toBe(96);
    expect(tile.props.standAspect).toBeCloseTo(110 / 96, 10);
    expect(hiddenFromVoiceOver(one('closet-confirm-photo'))).toBe(true);
    expect(hiddenFromVoiceOver(one('closet-confirm-incloset'))).toBe(true);
    // Side by side, with their captions.
    const photo = one('closet-confirm-photo'), inCloset = one('closet-confirm-incloset');
    const shared = (() => {
      const up = new Set<HostEl>();
      for (let x: HostEl | null = photo; x; x = x.parent) up.add(x);
      for (let x: HostEl | null = inCloset; x; x = x.parent) if (up.has(x)) return x;
      return null;
    })()!;
    expect(flat(shared).flexDirection).toBe('row');
    expect(textsOf(shared)).toEqual(['This photo', 'In your closet']);
  });

  it('CB2.7 · at an accessibility size the pictures stack and stay 96 by 110', async () => {
    device({ fontScale: 3.2 });
    mockEvidence.current = { thisPhoto: shot, inCloset: null, answered: 0 };
    await world({ asks: FOUR, fit: true });
    await openCloset(322);
    expect(sizeIn('closet-confirm-photo')).toEqual([96, 110]);
    expect(sizeIn('closet-confirm-incloset')).toEqual([96, 110]);
    const photo = one('closet-confirm-photo'), inCloset = one('closet-confirm-incloset');
    const up = new Set<HostEl>();
    for (let x: HostEl | null = photo; x; x = x.parent) up.add(x);
    let shared: HostEl | null = inCloset;
    while (shared && !up.has(shared)) shared = shared.parent;
    expect(flat(shared!).flexDirection).not.toBe('row');
  });

  it('CB2.7 · the score card and the Added sheet keep today\'s pictures', async () => {
    mockEvidence.current = { thisPhoto: shot, inCloset: null, answered: 0 };
    const w = await world({ asks: FOUR, fit: false });
    const photo = w.byId.get('Q-a')!, candidate = w.byId.get('B1')!;
    const a = wordsOf(QA, w.byId);
    for (const compact of [false, true]) {
      await render(
        <ThemeProvider>
          <DuplicateQuestion ask={askOf(QA)} photo={photo} candidate={candidate} runnerUp={null} onAnswer={() => {}} compact={compact} />
        </ThemeProvider>,
      );
      await layoutAll(322);
      await act(async () => {
        await sleep(0);
      });
      const crop = byTestId('stand-crop')[0]!;
      const tile = byTestId('stand-tile')[0]!;
      const want = compact ? [120, 120] : [150, 173];
      expect([compact, crop.props.standW, crop.props.standH]).toEqual([compact, ...want]);
      expect([compact, tile.props.standSize, Math.round((tile.props.standSize as number) * (tile.props.standAspect as number))]).toEqual([compact, ...want]);
      // No deck: no Skip, no "Question n of total." and today's header label.
      expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
      expect(allTexts()).not.toContain('Skip');
      expect(screen.getByRole('header').props.accessibilityLabel).toBe(t('closet.q.a11y', { question: a.question, item: a.item, reason: a.reason }));
      expect(byTestId('closet-confirm-question')).toHaveLength(0);
      await cleanup();
    }
  });
});

// ================================================================================================ CB2.8
describe('CB2.8 · VoiceOver and targets', () => {
  /** The first element VoiceOver can reach under `top`, in tree order. */
  function firstReachable(top: HostEl): HostEl | null {
    const walk = (e: HostEl): HostEl | null => {
      if (e.props.accessibilityElementsHidden === true || e.props.importantForAccessibility === 'no-hide-descendants') return null;
      if (e.props.accessible === true) return e;
      for (const c of e.children) {
        if (typeof c === 'string') continue;
        const r = walk(c);
        if (r) return r;
      }
      return null;
    };
    return walk(top);
  }

  it('CB2.8 · the card is read as Question n of total first', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    await skip();
    const b = wordsOf(QB, w.byId);
    const card = one('closet-confirm-card');
    const first = firstReachable(card);
    expect(first?.props.testID).toBe('closet-confirm-question');
    const q = one('closet-confirm-question');
    expect(q.props.accessibilityRole).toBe('header');
    expect(q.props.accessibilityLabel).toBe(`Question 2 of 5. ${t('closet.q.a11y', { question: b.question, item: b.item, reason: b.reason })}`);
    expect(q.props.accessibilityLabel).toBe(
      'Question 2 of 5. Is this your navy crewneck? It looked like a sweatshirt in this photo. This photo and your navy crewneck are shown side by side.',
    );
    expect(q.props.accessibilityActions).toEqual([{ name: 'skip', label: 'Skip' }]);
    // The tag line is hidden from VoiceOver by its wrapper.
    const tag = one('closet-confirm-tag');
    expect(tag.props.accessibilityElementsHidden).toBe(true);
    expect(tag.props.importantForAccessibility).toBe('no-hide-descendants');
    // The reason is read inside the question, not on its own; the score line is its own text after it.
    expect(textsOf(q)).toEqual([b.question, b.reason]);
    const scoreLine = all().filter((e) => e.type === 'Text' && textsOf(e)[0] === 'Your score stays the same either way.');
    expect(scoreLine).toHaveLength(1);
    expect(hostEls(q).includes(scoreLine[0]!)).toBe(false);
    expect(hostEls(card).includes(scoreLine[0]!)).toBe(true);
    expect(hiddenFromVoiceOver(scoreLine[0]!)).toBe(false);
    // The pictures are hidden.
    expect(hiddenFromVoiceOver(one('closet-confirm-photo'))).toBe(true);
    expect(hiddenFromVoiceOver(one('closet-confirm-incloset'))).toBe(true);
  });

  it('CB2.8 · answers and Skip are buttons with 44 pt targets', async () => {
    await world({ asks: FOUR, fit: true });
    await openCloset();
    await skip(); // card 2 has a runner-up
    for (const name of ['Yes, same one', 'No, a new one', "It's my black sweatshirt"]) {
      const chip = screen.getByRole('button', { name }) as unknown as HostEl;
      expect([name, chip.props.accessibilityLabel]).toEqual([name, name]);
      expect([name, flat(chip).paddingVertical]).toEqual([name, 6]);
      const face = chip.children.find((c): c is HostEl => typeof c !== 'string')!;
      expect([name, flat(face).minHeight]).toEqual([name, 32]);
    }
    const box = one('closet-confirm-skip');
    expect(flat(box).minHeight).toBe(44);
    const link = within(box as never).getByRole('button', { name: 'Skip' }) as unknown as HostEl;
    expect(link.props.accessibilityLabel).toBe('Skip');
    expect(link.props.accessibilityHint).toBeUndefined();
    expect(link.props.hitSlop).toEqual({ top: 12, bottom: 12, left: 8, right: 8 });
    // Its chevron: the "next" symbol, 13 pt semibold, hidden from VoiceOver.
    const sym = byTestId('symbol', box);
    expect(sym.map((s) => [s.props.symbolName, s.props.symbolSize, s.props.symbolWeight])).toEqual([['chevron.right', 13, 'semibold']]);
    expect(hiddenFromVoiceOver(sym[0]!)).toBe(true);
  });

  it('CB2.8 · every card is reachable without a swipe', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    const L = [QA, QB, QC, QD].map((q) => wordsOf(q, w.byId));
    const voSkip = async (id: string) => {
      await act(async () => {
        fireEvent(one(id) as never, 'accessibilityAction', { nativeEvent: { actionName: 'skip' } });
      });
      await settle();
    };
    await skip();
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: L[1]!.label(2, 5) });
    await voSkip('closet-confirm-question');
    expect(shown()).toEqual({ tag: tagOf(3, 5), label: L[2]!.label(3, 5) });
    await skip();
    expect(shown()).toEqual({ tag: tagOf(4, 5), label: L[3]!.label(4, 5) });
    await voSkip('closet-confirm-question');
    expect(shown()).toEqual({ tag: tagOf(5, 5), label: 'Question 5 of 5. How do your dark jeans fit? Seen as slim and as wide.' });
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
    // The fit card's Skip leads back to card 1 (the fit question rests until a newer photo disagrees).
    await skip();
    await settle();
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: L[0]!.label(1, 4) });
  });

  it('CB2.8 · focus moves to the new question', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    focusSpy.mockClear();
    await skip();
    expect(focusedOn()).toEqual([wordsOf(QB, w.byId).label(2, 5)]);
    focusSpy.mockClear();
    await swipe(-200);
    expect(focusedOn()).toEqual([wordsOf(QC, w.byId).label(3, 5)]);
    focusSpy.mockClear();
    // After an answer: it waits for the toast's line to be read, then moves.
    await swipe(200);
    await swipe(200);
    focusSpy.mockClear();
    await tap('Yes, same one');
    await setOpen([QB, QC, QD]);
    expect(focusSpy).not.toHaveBeenCalled();
    await announce();
    await settle();
    expect(focusedOn()).toEqual([wordsOf(QB, w.byId).label(1, 4)]);
  });

  it('CB2.8 · after an answer with no announcement heard, focus moves within 1.5 s', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    focusSpy.mockClear();
    await tap('Yes, same one');
    await setOpen([QB, QC, QD]);
    expect(focusSpy).not.toHaveBeenCalled();
    await act(async () => {
      await sleep(ANNOUNCE_CAP_MS + 100);
    });
    expect(focusedOn()).toEqual([wordsOf(QB, w.byId).label(1, 4)]);
  });

  it('CB2.8 · Skip\'s chevron scales with the text', async () => {
    for (const [fontScale, size, gap] of [[1, 13, 4], [3.25, 42, 13]] as const) {
      device({ fontScale });
      await render(
        <ThemeProvider>
          <TextLink title="Skip" trailingIcon="next" compact onPress={() => {}} />
        </ThemeProvider>,
      );
      const link = screen.getByRole('button', { name: 'Skip' }) as unknown as HostEl;
      const sym = byTestId('symbol', link);
      expect([fontScale, sym.map((s) => [s.props.symbolName, s.props.symbolSize, s.props.symbolWeight])]).toEqual([fontScale, [['chevron.right', size, 'semibold']]]);
      let row: HostEl | null = sym[0]!.parent;
      while (row && flat(row).flexDirection !== 'row') row = row.parent;
      expect([fontScale, row ? flat(row).gap : 'no row', row ? flat(row).alignItems : 'no row']).toEqual([fontScale, gap, 'center']);
      expect(textsOf(link)).toEqual(['Skip']);
      await cleanup();
    }
    // Without a trailing icon: no icon.
    device();
    await render(
      <ThemeProvider>
        <TextLink title="Change" compact onPress={() => {}} />
      </ThemeProvider>,
    );
    expect(byTestId('symbol')).toEqual([]);
    expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy();
  });
});

// ================================================================================================ CB2.9
describe('CB2.9 · Reduce Motion', () => {
  const translateXs = (top: HostEl) =>
    hostEls(top).flatMap((e) => ((flat(e).transform as Record<string, unknown>[] | undefined) ?? []).filter((x) => 'translateX' in x).map((x) => x.translateX));

  it('CB2.9 · with Reduce Motion the card doesn\'t follow the finger', async () => {
    device({ reduceMotion: true });
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    const f = await down();
    await move(f, -12, 0, 16);
    await move(f, -80, 0, 400);
    expect(f.granted).toBe(true);
    // Mid-drag: only the shown card, not moved, and no neighbour.
    expect(byTestId('closet-confirm-question')).toHaveLength(1);
    expect(byTestId('closet-confirm-question')[0]!.props.accessibilityLabel).toBe(wordsOf(QA, w.byId).label(1, 5));
    expect(allTexts()).not.toContain(wordsOf(QB, w.byId).question);
    expect(translateXs(one('closet-confirm-deck')).filter((x) => x !== 0)).toEqual([]);
    await move(f, 0, 0, 1000);
    await lift(f);
    expect(shown().tag).toEqual(tagOf(1, 5));
    // A release past a third still moves; so does Skip.
    await swipe(-200);
    expect(shown()).toEqual({ tag: tagOf(2, 5), label: wordsOf(QB, w.byId).label(2, 5) });
    await skip();
    expect(shown()).toEqual({ tag: tagOf(3, 5), label: wordsOf(QC, w.byId).label(3, 5) });
  });

  it('CB2.9 · without Reduce Motion the next card follows the drag in', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    const f = await down();
    await move(f, -12, 0, 16);
    await move(f, -80, 0, 400);
    expect(f.granted).toBe(true);
    expect(allTexts()).toContain(wordsOf(QB, w.byId).question);
    await move(f, 0, 0, 1000);
    await lift(f);
    expect(shown()).toEqual({ tag: tagOf(1, 5), label: wordsOf(QA, w.byId).label(1, 5) });
    expect(allTexts()).not.toContain(wordsOf(QB, w.byId).question);
  });
});

// ================================================================================================ CB2.10
describe('CB2.10 · answered elsewhere', () => {
  it('CB2.10 · answered elsewhere: the count updates, the shown card stays or moves on', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    focusSpy.mockClear();
    // Card 3 answered on the score card: the same card, 1 of 4, focus stays.
    await setOpen([QA, QB, QD]);
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: wordsOf(QA, w.byId).label(1, 4) });
    await act(async () => {
      await sleep(ANNOUNCE_CAP_MS + 100);
    });
    expect(focusSpy).not.toHaveBeenCalled();
    // A new question arrives in front while card 2 shows: only the numbers change.
    await skip();
    expect(shown()).toEqual({ tag: tagOf(2, 4), label: wordsOf(QB, w.byId).label(2, 4) });
    focusSpy.mockClear();
    await setOpen([QZ, QA, QB, QD]);
    expect(shown()).toEqual({ tag: tagOf(3, 5), label: wordsOf(QB, w.byId).label(3, 5) });
    await act(async () => {
      await sleep(MOVE_MS);
    });
    expect(focusSpy).not.toHaveBeenCalled();
    expect(fitCheck.answerDuplicate).not.toHaveBeenCalled();
  });

  it('CB2.10 · answered elsewhere: the shown card leaves, the next one shows and takes focus', async () => {
    const w = await world({ asks: FOUR, fit: true });
    await openCloset();
    focusSpy.mockClear();
    await setOpen([QB, QC, QD]);
    expect(shown()).toEqual({ tag: tagOf(1, 4), label: wordsOf(QB, w.byId).label(1, 4) });
    await act(async () => {
      await sleep(ANNOUNCE_CAP_MS + 100);
    });
    expect(focusedOn()).toEqual([wordsOf(QB, w.byId).label(1, 4)]);
    expect(fitCheck.answerDuplicate).not.toHaveBeenCalled();
  });
});

// ================================================================================================ the real service
// closetBatch287 C2's set-up: p01b's real chinos question, then four more like it on the same check.
const measureNothing: GarmentMeasurer = async (check, pieces) => {
  const out: MeasuredPieces = new Map(pieces.map((p) => [p.key, { sampledHex: null, sampledL: null, cropFile: `closet/${check.imageHash.slice(0, 6)}-${p.key}.png`, cropQuality: 0.8 }]));
  out.heads = [[120, 380, 300, 620]];
  return out;
};

async function fiveOpen() {
  const store: KittedStore = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T07:41:00-04:00') });
  for (const c of await store.closet.all()) if (!['T1', 'B1', 'S1'].includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource(), measure: measureNothing });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const r = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
  await closet.settle();
  const first = (await closet.openAsks()).find((a) => a.checkId === r.checkId)!;
  const flagged = (await store.closet.get(first.ask.itemId))!;
  const obs = (await store.closetObs.get(first.ask.obsId))!;
  const row = (await store.fitChecks.get(r.checkId))!;
  const asks = [...(row.details.closetSummary!.asks ?? [])];
  for (let i = 1; i <= 4; i++) {
    await store.closet.put({ ...flagged, id: `C-x${i}`, addedAt: flagged.addedAt + i });
    await store.closetObs.put({ ...obs, id: `O-x${i}`, itemId: `C-x${i}` });
    asks.push({ ...first.ask, obsId: `O-x${i}`, itemId: `C-x${i}`, answer: null });
  }
  await store.fitChecks.patch(r.checkId, { details: { ...row.details, closetSummary: { ...row.details.closetSummary!, asks } } });
  return { store, closet, svc };
}

/** The deck's keys for open questions (and no fit question). */
function deckKeys(open: readonly { ask: { obsId: string } }[]): string[] {
  const deck = toConfirm(open, null);
  expect(Array.isArray(deck)).toBe(true);
  return deck.map((c) => c.key);
}

describe('the real closet service', () => {
  it('CB2.2 · on the real service the answered question leaves the deck', async () => {
    const env = await fiveOpen();
    const open = await env.closet.openAsks();
    expect(open).toHaveLength(5);
    const keys = deckKeys(open);
    expect(keys).toEqual(open.map((o) => `dup:${o.ask.obsId}`));
    const toasts: { text: string; undo: () => void }[] = [];
    const deps = { answer: env.closet.answer, unanswer: env.closet.unanswer, toast: (text: string, undo: () => void) => void toasts.push({ text, undo }) };
    const candidate = (await env.store.closet.get(open[0]!.ask.candidateId))!;
    await answerWithUndo(deps, open[0]!.checkId, open[0]!.ask, 'same', candidate, null);
    expect(toasts.map((x) => x.text)).toEqual(['Saved as your khaki chinos.']);
    const open2 = await env.closet.openAsks();
    expect(open2).toHaveLength(4);
    const keys2 = deckKeys(open2);
    expect(keys2).toEqual(keys.slice(1));
    expect(reconcileDeck({ key: keys[0]!, undoKey: keys[0]! }, keys, keys2)).toEqual({ state: { key: keys[1]!, undoKey: keys[0]! }, move: 'forward' });
    // Undo opens it again, in its place.
    toasts[0]!.undo();
    for (let i = 0; i < 50 && (await env.closet.openAsks()).length < 5; i++) await sleep(10);
    const keys3 = deckKeys(await env.closet.openAsks());
    expect(keys3).toEqual(keys);
    expect(reconcileDeck({ key: keys[1]!, undoKey: keys[0]! }, keys2, keys3)).toEqual({ state: { key: keys[0]!, undoKey: null }, move: 'back' });
  });

  it('CB2.10 · the score card\'s answer path leaves openAsks', async () => {
    const env = await fiveOpen();
    const open = await env.closet.openAsks();
    const keys = deckKeys(open);
    // The score card answers through fitCheck.answerDuplicate (FitCheckCard's answerAsk), the same closet write.
    await env.svc.answerDuplicate(open[2]!.checkId, open[2]!.ask.obsId, 'same');
    const keys2 = deckKeys(await env.closet.openAsks());
    expect(keys2).toEqual([keys[0], keys[1], keys[3], keys[4]]);
    expect(reconcileDeck({ key: keys[0]!, undoKey: null }, keys, keys2)).toEqual({ state: { key: keys[0]!, undoKey: null }, move: 'none' });
    expect(deckCount(keys2, keys[0]!)).toEqual({ n: 1, total: 4 });
  });
});

// ================================================================== CB2.11 · To confirm folds (the founder, Nov 10)
describe('CB2.11 · folded or open, as he left it', () => {
  it('CB2.11 · folded or open is read from his saved choice; nothing saved means folded', () => {
    expect([null, undefined, 'folded', 'yes', ''].map((v) => deckRules.confirmOpen(v as string | null | undefined))).toEqual([false, false, false, false, false]);
    expect(deckRules.confirmOpen('open')).toBe(true);
    expect([deckRules.confirmOpenValue(true), deckRules.confirmOpenValue(false)]).toEqual(['open', 'folded']);
    expect([deckRules.confirmRowA11y('To confirm', 1), deckRules.confirmRowA11y('To confirm', 4)]).toEqual(['To confirm, 1 piece', 'To confirm, 4 pieces']);
  });

  it('CB2.11 · folded by default: one row with the first piece and its question, the count, a button VoiceOver hears as collapsed; no card in sight', async () => {
    const w = await world({ asks: FOUR, fit: true, folded: true });
    await openCloset();
    const row = one('closet-confirm-folded');
    const a = wordsOf(QA, w.byId);
    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toBe(`To confirm, 5 pieces. ${a.question}`);
    expect(row.props.accessibilityState).toEqual({ expanded: false });
    // "A little picture of the first one" (the founder, Nov 10): the first question's own piece, then its words.
    expect(textsOf(row)).toEqual(['To confirm', '5', a.question]);
    expect(byTestId('closet-confirm-folded-piece', row)).toHaveLength(1);
    expect(hostEls(row).indexOf(one('closet-confirm-folded-piece'))).toBeLessThan(hostEls(row).findIndex((e) => e.type === 'Text'));
    expect(flat(one('closet-confirm-deck')).display).toBe('none');
    expect(await w.mem.getKv('closet.confirm.open')).toBeNull();
  });

  it('CB2.11 · a tap opens the card at the current question and keeps it open; the tag line folds it again', async () => {
    const w = await world({ asks: FOUR, fit: true, folded: true });
    await openCloset();
    await act(async () => {
      fireEvent.press(one('closet-confirm-folded') as never);
      await sleep(0);
    });
    await settle();
    expect(await w.mem.getKv('closet.confirm.open')).toBe('open');
    expect(byTestId('closet-confirm-folded')).toHaveLength(0);
    expect(flat(one('closet-confirm-deck')).display).toBeUndefined();
    expect(shown().tag).toEqual(tagOf(1, 5));
    // VoiceOver: the question still comes first; the fold button comes after it, expanded.
    const card = one('closet-confirm-card');
    const folds = hostEls(card).filter((e) => e.props.accessibilityRole === 'button' && e.props.accessibilityLabel === 'To confirm, 5 pieces');
    expect(folds).toHaveLength(1);
    expect(folds[0]!.props.accessibilityState).toEqual({ expanded: true });
    expect(hostEls(card).indexOf(one('closet-confirm-question'))).toBeLessThan(hostEls(card).indexOf(folds[0]!));
    // VoiceOver reads by place on screen: the fold is laid out last in the card (never over the tag line), so it's
    // the last element VoiceOver reaches.
    expect(folds[0]!.props.testID).toBe('closet-confirm-fold');
    expect(flat(folds[0]!).position).toBeUndefined();
    const reachable = hostEls(card).filter((e) => e.props.accessible === true && !hiddenFromVoiceOver(e));
    expect(reachable[reachable.length - 1]).toBe(folds[0]);
    // Fold again, from the tag line's row.
    const tagRow = one('closet-confirm-tag').parent!;
    await act(async () => {
      fireEvent.press(tagRow as never);
      await sleep(0);
    });
    await settle();
    expect(await w.mem.getKv('closet.confirm.open')).toBe('folded');
    expect(one('closet-confirm-folded').props.accessibilityLabel).toBe(`To confirm, 5 pieces. ${wordsOf(QA, w.byId).question}`);
  });

  it('CB2.11 · a new question while folded changes only the count; it never opens by itself', async () => {
    const w = await world({ asks: [QA, QB, QC], fit: false, folded: true });
    await openCloset();
    const first = wordsOf(QA, w.byId).question;
    expect(one('closet-confirm-folded').props.accessibilityLabel).toBe(`To confirm, 3 pieces. ${first}`);
    await setOpen(FOUR);
    await settle();
    expect(one('closet-confirm-folded').props.accessibilityLabel).toBe(`To confirm, 4 pieces. ${first}`);
    expect(textsOf(one('closet-confirm-folded'))).toEqual(['To confirm', '4', first]);
    expect(flat(one('closet-confirm-deck')).display).toBe('none');
    expect(await w.mem.getKv('closet.confirm.open')).toBeNull();
  });

  it('CB2.11 · with nothing left to confirm there is no row', async () => {
    await world({ asks: [], fit: false, folded: true });
    await openCloset();
    expect(byTestId('closet-confirm-folded')).toHaveLength(0);
    expect(allTexts()).not.toContain('To confirm');
  });
});
