// T73 · Closet without Outfits (specs/closet-beta.md CB1): for the beta, Outfits, Next best buy and Goes with are off
// behind one switch (`outfitsOn()`), on only for the demo screens that show them (182, 183, 184, 193, 202). Off, Closet
// opens on the pieces whatever he last tapped, a piece's page has no Outfits row or Goes with, Kit's buy card has no
// "+N outfits" line (Kit still ranks by that count, privately), Starter essentials says "Added {item}." and the Next
// best buy sheet sends him back to Closet. The piece page's note drops "and your outfits". Each test starts with the
// switch off (`afterEach`), as on a fresh start.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect, useState, type DependencyList } from 'react';
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { OUTFITS_BUILT } from '@/config/features';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { ChatMessage, ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { SCREENS } from '@/demo/scenarios';
import ClosetScreen from '@/app/(tabs)/closet/index';
import { AskAttachment } from '@/features/ask/AskCardView';
import { buildCard, buyGainLine, cardSpoken } from '@/features/ask/cards';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence } from '@/features/ask/evidence';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { NextBuySheet } from '@/features/closet/NextBuySheet';
import { buildOutfits, closetView, goesWith, openingSegment, outfitCount, pieceOutfits, SEGMENT_KEY } from '@/features/closet/outfits';
import { outfitsOn, prepareOutfitsDemo, setDemoOutfits } from '@/features/closet/outfitsSwitch';
import { ghostPiece, nextBestBuy } from '@/features/finish/gains';
import { ownership, STARTER } from '@/features/finish/starter';
import { pickStarter } from '@/features/finish/starterActions';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';

// Closet's screen now reaches the app tour's examples (T118), which animate with Reanimated.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native') as typeof import('react-native');
  return { __esModule: true, default: { View }, Easing: {}, FadeIn: {}, ReduceMotion: {}, withDelay: () => 0, withTiming: () => 0 };
});

// The card and the sheet alone: the design system pulls in Reanimated, which needs the native runtime.
jest.mock('@/design-system', () => {
  const { Text, View } = jest.requireActual('react-native');
  const Pass = ({ children }: { children?: unknown }) => <View>{children as never}</View>;
  return {
    KText: Text,
    Numeral: Text,
    KCard: ({ children, accessibilityLabel }: { children?: unknown; accessibilityLabel?: string }) => (
      <View accessible accessibilityLabel={accessibilityLabel}>{children as never}</View>
    ),
    KCardSection: Pass,
    EmptyState: Pass,
    RowDivider: () => null,
    radius: { tile: 12 },
    Chip: () => null,
    ChipFlow: Pass,
    KButton: ({ title }: { title: string }) => <Text>{title}</Text>,
    TextLink: ({ title }: { title: string }) => <Text>{title}</Text>,
    TagLine: ({ left, right }: { left: string; right?: string }) => (
      <View>
        <Text>{left}</Text>
        {right ? <Text>{right}</Text> : null}
      </View>
    ),
    space: { xs: 4, s: 8, m: 16, l: 24, xxl: 32, gutter: 16, stack: 16 },
    useTheme: () => ({ colors: { bg: '#FFF' }, isAccessibilitySize: false }),
  };
});
jest.mock('@/features/sheet/SheetScaffold', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    SheetScaffold: ({ title, children }: { title: string; children?: unknown }) => (
      <View>
        <Text>{title}</Text>
        {children as never}
      </View>
    ),
  };
});
jest.mock('@/features/closet/StandingOutfit', () => ({ StandingOutfit: () => null }));
jest.mock('@/features/stylist/cards/OutfitTiles', () => ({ OutfitTiles: () => null, PieceTiles: () => null, CardRoom: jest.requireActual('react').createContext(0) }));
jest.mock('@/data/useLive', () => ({ useLive: jest.fn() }));
// The Closet screen alone (CB1.1's "nothing writes closet.segment while off"): its pieces' tiles, questions and the
// Outfits view are stand-ins, so what's left is the screen's own choice of what to draw and what to store.
jest.mock('@/features/closet/PieceMenu', () => {
  const { Text } = jest.requireActual('react-native');
  return { PieceMenu: ({ item }: { item: { name: string } }) => <Text>{`tile:${item.name}`}</Text> };
});
jest.mock('@/features/closet/DuplicateQuestion', () => ({ DuplicateQuestion: () => null }));
jest.mock('@/features/closet/FitQuestion', () => ({ FitQuestion: () => null }));
jest.mock('@/features/closet/OutfitsView', () => {
  const { Text } = jest.requireActual('react-native');
  return { OutfitsView: () => <Text>outfits-view</Text> };
});
jest.mock('@/features/onboarding/Segmented', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    Segmented: ({ label, options }: { label: string; options: { label: string }[] }) => (
      <View accessible accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => <Text key={o.label} accessibilityRole="radio">{o.label}</Text>)}
      </View>
    ),
  };
});
jest.mock('@/features/settings/SettingsList', () => {
  const { Text, View } = jest.requireActual('react-native');
  return { Section: ({ children }: { children?: unknown }) => <View>{children as never}</View>, LinkRow: ({ title }: { title: string }) => <Text>{title}</Text> };
});
jest.mock('@/features/fitcheck/session', () => ({
  fitCheck: { closet: { openAsks: async () => [] }, answerDuplicate: jest.fn(), unanswerDuplicate: jest.fn() },
}));
jest.mock('@/features/closet/photoChecks', () => ({ loadPhotoChecks: async () => [], livePhotoDeps: {} }));
jest.mock('@/features/scan/inbox', () => ({ INBOX_KEY: 'scan.inbox', parseInbox: () => [], waitingRow: () => null }));
jest.mock('@/router/stylistAction', () => ({ goToStylist: jest.fn() }));
jest.mock('@/features/toast/toast', () => ({ ...jest.requireActual('@/features/toast/toast'), showToast: jest.fn() }));
jest.mock('@/data/db', () => ({ store: {} }));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() },
    Redirect: jest.fn(({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>),
    useLocalSearchParams: () => ({}),
  };
});
// Kit's buy card draws its piece (T104): the drawing needs the theme, which this test doesn't mount.
jest.mock('@/features/closet/GarmentArt', () => ({ PieceArt: () => null }));

const AS_OF = Date.parse('2026-10-22T12:00:00-04:00');

afterEach(() => setDemoOutfits(false));

async function setup() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: AS_OF });
  const closet = await store.closet.all();
  const checks = await store.fitChecks.all();
  const styles = (await store.profile.get('me'))?.styles ?? null;
  return { store, closet, checks, styles };
}

/** The Closet's count with the row's piece minus without it (oneCount G1's rule). */
const closetGain = (closet: readonly ClosetItemRow[], styles: Parameters<typeof outfitCount>[2], e: (typeof STARTER)[number]) =>
  outfitCount([...closet, ghostPiece(e)!], [], styles) - outfitCount(closet, [], styles);

const missing = (closet: readonly ClosetItemRow[]) => {
  const own = ownership(closet, []);
  return STARTER.filter((e) => e.pick && e.slot && !own[e.id]?.owned);
};

/** useLive without the store's change feed: runs the screen's loader once per deps change. */
function useLoaded<T>(_topics: unknown, load: () => Promise<T>, deps: DependencyList): T | undefined {
  const [v, setV] = useState<T | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    void load().then((x) => alive && setV(x));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

type HostEl = { props: Record<string, unknown>; children: (HostEl | string)[] };
const hostEls = (e: HostEl): HostEl[] => [e, ...e.children.flatMap((c) => (typeof c === 'string' ? [] : hostEls(c)))];

/** The demo's full closet in the screen's store, with "closet.segment" saved; `writes()` lists every later write or
 *  delete of that key. */
async function closetWithRemembered(remembered: string) {
  const { store: mem } = await setup();
  await mem.setKv(SEGMENT_KEY, remembered);
  const set = jest.spyOn(mem, 'setKv');
  const del = jest.spyOn(mem, 'deleteKv');
  jest.requireMock<{ store: unknown }>('@/data/db').store = mem;
  jest.mocked(useLive).mockImplementation(useLoaded as never);
  const writes = () => [...set.mock.calls, ...del.mock.calls].filter((c) => c[0] === SEGMENT_KEY);
  return { mem, writes };
}

/** Renders Closet, waits for its loaders, and gives the grid its width (tiles draw once it has one). */
async function renderCloset() {
  await render(<ClosetScreen />);
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  for (const el of hostEls(screen.container as unknown as HostEl).filter((e) => typeof e.props.onLayout === 'function')) {
    await fireEvent(el as never, 'layout', { nativeEvent: { layout: { width: 343, height: 0 } } });
  }
}

const COUNTS = [0, 2, 3, 37] as const;
const REMEMBERED = ['outfits', 'pieces', 'junk', null] as const;

const buyMessage = (card: Record<string, unknown>): ChatMessage => ({
  id: 'M1', createdAt: AS_OF, role: 'stylist', kind: 'text', text: null, cardType: null, fitCheckId: null, outfitId: null, itemId: null,
  chips: [], payload: { askCard: card },
} as unknown as ChatMessage);

// ------------------------------------------------------------------------------------------------ CB1.1
describe('CB1.1 · with the switch off, Closet opens on the pieces with no switcher', () => {
  it('CB1.1 · switch off: no switcher, pieces, whatever is remembered', async () => {
    // The precondition: on the demo's full closet, today's rule would open on Outfits.
    const { closet, checks, styles } = await setup();
    expect(outfitCount(closet, checks, styles)).toBeGreaterThanOrEqual(3);
    expect(openingSegment(outfitCount(closet, checks, styles), null)).toBe('outfits');
    for (const n of COUNTS) {
      for (const r of REMEMBERED) {
        expect([n, r, closetView(false, n, r)]).toEqual([n, r, { switcher: false, segment: 'pieces' }]);
      }
    }
    expect(closetView(false, outfitCount(closet, checks, styles), 'outfits')).toEqual({ switcher: false, segment: 'pieces' });
  });

  it('CB1.1 · the beta build has the switch off', () => {
    expect(OUTFITS_BUILT).toBe(false);
    expect(outfitsOn()).toBe(false);
  });

  it('CB1.1 · leaving a switch-on demo screen turns it off', () => {
    prepareOutfitsDemo({ outfits: true });
    expect(outfitsOn()).toBe(true);
    prepareOutfitsDemo({});
    expect(outfitsOn()).toBe(false);
    // And setDemoOutfits itself turns it both ways.
    setDemoOutfits(true);
    expect(outfitsOn()).toBe(true);
    setDemoOutfits(false);
    expect(outfitsOn()).toBe(false);
  });

  it('CB1.1 · the Closet screen, switch off: the pieces head to toe, no switcher, and closet.segment never written', async () => {
    const { mem, writes } = await closetWithRemembered('outfits');
    await renderCloset();
    expect(screen.getByLabelText('Jackets and layers, 3 pieces')).toBeTruthy();
    expect(screen.getByLabelText('Tops, 6 pieces')).toBeTruthy();
    expect(screen.getByLabelText('Bottoms, 3 pieces')).toBeTruthy();
    expect(screen.getByLabelText('Shoes, 4 pieces')).toBeTruthy();
    expect(screen.getAllByText(/^tile:/)).toHaveLength(16);
    expect(screen.queryByText('Pieces')).toBeNull();
    expect(screen.queryByText('Outfits')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByText('outfits-view')).toBeNull();
    // Nothing on Closet writes or deletes his saved tap while off: it is still "outfits" for when Outfits come back.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(writes()).toEqual([]);
    expect(await mem.getKv(SEGMENT_KEY)).toBe('outfits');
  });
});

// ------------------------------------------------------------------------------------------------ CB1.2
describe('CB1.2 · nothing about outfits on a switch-off screen', () => {
  it('CB1.2 · a piece page builds no Outfits row or Goes with while off', async () => {
    const { closet, checks, styles } = await setup();
    const around = buildOutfits({ closet, checks, styles, occasion: 'everyday' });
    // The precondition: B1 is in outfits today, so the page would show both.
    expect(around.filter((o) => o.itemIds.includes('B1')).length).toBeGreaterThan(0);
    expect(goesWith('B1', around).length).toBeGreaterThan(0);
    expect(pieceOutfits(false, around, 'B1')).toEqual({ outfitsWith: 0, goes: [] });
  });

  it('CB1.2 · Kit\'s buy card has no outfits line while off, on screen and for VoiceOver', async () => {
    for (const n of [null, 0, 1, 12, 18]) expect([n, buyGainLine(n, false)]).toEqual([n, null]);
    expect(cardSpoken({ type: 'buy', starterId: 's02', gain: 12 }, { nameOf: () => null })).toBe('Next buy. Navy polo. $30–40.');
    expect(cardSpoken({ type: 'buy', starterId: 's27', gain: 18 }, { nameOf: () => null })).toBe('Next buy. Brown work boots. $50–70.');

    await render(<AskAttachment m={buyMessage({ type: 'buy', starterId: 's27', gain: 18 })} readOnly={false} />);
    expect(screen.getByText('Next buy')).toBeTruthy();
    expect(screen.getByText('$50–70')).toBeTruthy();
    expect(screen.getByText('Brown work boots')).toBeTruthy();
    expect(screen.queryByText(/outfits? with what you own/)).toBeNull();
    expect(screen.queryByText(/^\+\d+/)).toBeNull();
    expect(screen.getByLabelText('Next buy. Brown work boots. $50–70.')).toBeTruthy();
    expect(screen.queryByLabelText(/outfits? with what you own/)).toBeNull();
  });

  it('CB1.2 · Kit still ranks by the Closet\'s count (private evidence)', async () => {
    const { store, closet, styles } = await setup();
    const input = { handles: {}, closet, checks: [], styles, starterMarks: [], gate: { allowedScores: new Set<string>() } };
    // T69: under v16 the boots add 6 outfits at 7.0+ (v15: 18) and dark straight jeans lead (+16)
    expect(buildCard({ type: 'buy', kind: 'work boots', shade: 'brown' }, input)).toEqual({ type: 'buy', starterId: 's27', gain: 6 });
    // The demo's own answer card, too (oneCount G8): the Closet's pick with its gain, stored on the message.
    const nb = nextBestBuy({ closet, checks: [], styles, marks: [] })!;
    expect([nb.entry.id, nb.gain]).toEqual(['s05', 16]);

    const clock = manualClock(Date.parse('2026-10-22T12:30:00-04:00'));
    const snap = await loadStylistSnapshot(store, clock);
    const q = 'What should I buy next?';
    const ctx = buildStylistContext(snap, q);
    const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: () => ({ dow: 4, today: true }) });
    expect(route.kind).toBe('buyNext');
    const ev = await buildEvidence(route, snap, ctx, { readingOf: async () => null, starterMarks: [] });
    const lines = ev.text.split('\n').filter((l) => l.startsWith('- '));
    expect(lines.length).toBeGreaterThan(2);
    expect(lines[0]).toMatch(/^- s05 dark straight jeans · \+16 outfits/); // T69 (v15: s27 brown work boots, +18)
    const gains = lines.map((l) => Number(/\+(\d+) outfits/.exec(l)![1]));
    for (let i = 1; i < gains.length; i++) expect(gains[i - 1]).toBeGreaterThanOrEqual(gains[i]!);
  });

  it('CB1.2 · Starter essentials says "Added {item}." while off, with Undo', async () => {
    const { store, closet, styles } = await setup();
    const e = missing(closet).find((x) => closetGain(closet, styles, x) > 1)!;
    expect(e).toBeDefined();
    const g = e.pick!.garment;
    const toast = await pickStarter(store, e, { subcategory: String(g.subcategory), color: String(g.color_family) }, counterIds(), AS_OF + 1000);
    const after = await store.closet.all();
    const added = after.filter((c) => !closet.some((x) => x.id === c.id));
    expect(added).toHaveLength(1);
    const piece = added[0]!;
    expect(piece.isDeleted).toBeFalsy();
    expect(toast?.text).toBe(t('starter.addedToast', { item: piece.name }));
    expect(toast?.text).toBe(`Added ${piece.name}.`);
    expect(toast?.text).not.toMatch(/^\+\d+ fits?$/);
    expect(typeof toast?.undo).toBe('function');
    await toast!.undo!();
    expect((await store.closet.get(piece.id))?.isDeleted).toBe(true);
    // Undo leaves the closet as it was: the same live pieces.
    const live = (rows: readonly ClosetItemRow[]) => rows.filter((c) => !c.isDeleted).map((c) => c.id).sort();
    expect(live(await store.closet.all())).toEqual(live(closet));
  });

  it('CB1.2 · Next best buy\'s sheet sends him to Closet while off', async () => {
    const { closet, checks, styles } = await setup();
    const nb = nextBestBuy({ closet, checks, styles, marks: [] });
    expect(nb).not.toBeNull();
    const { Redirect } = jest.requireMock<{ Redirect: jest.Mock }>('expo-router');
    // Loaded, and still loading: either way, back to Closet and nothing of the sheet.
    for (const live of [{ ...nb!, closet }, undefined]) {
      Redirect.mockClear();
      jest.mocked(useLive).mockReturnValue(live);
      await render(<NextBuySheet />);
      expect(Redirect).toHaveBeenCalled();
      expect(Redirect.mock.calls[0]![0]).toEqual({ href: '/closet' });
      expect(screen.getByText('redirect:/closet')).toBeTruthy();
      expect(screen.queryByText('Next best buy')).toBeNull();
      expect(screen.queryByText('What it unlocks')).toBeNull();
      expect(screen.queryByText('Brown work boots')).toBeNull();
      expect(screen.queryByText(/outfits? with what you own/)).toBeNull();
      await cleanup();
    }
  });
});

// ------------------------------------------------------------------------------------------------ CB1.3
describe('CB1.3 · the piece page\'s note', () => {
  it('CB1.3 · the piece page\'s note', () => {
    const note = t('closet.edit.foot');
    expect(note).toBe('Got one wrong? Change it here. The drawing follows. Your scores stay the same.');
    expect(note).not.toMatch(/your outfits/i);
    expect(note).not.toMatch(/and your outfits follow/i);
  });
});

// ------------------------------------------------------------------------------------------------ CB1.5
describe('CB1.5 · with the switch on (a demo screen), everything as before', () => {
  it('CB1.5 · switch on: today\'s opening rule', () => {
    for (const c of COUNTS) {
      for (const r of REMEMBERED) {
        expect([c, r, closetView(true, c, r)]).toEqual([c, r, { switcher: true, segment: openingSegment(c, r) }]);
      }
    }
    expect(closetView(true, 3, null)).toEqual({ switcher: true, segment: 'outfits' });
    expect(closetView(true, 2, null)).toEqual({ switcher: true, segment: 'pieces' });
    expect(closetView(true, 37, 'pieces')).toEqual({ switcher: true, segment: 'pieces' });
    expect(closetView(true, 0, 'outfits')).toEqual({ switcher: true, segment: 'outfits' });
    expect(closetView(true, 37, 'junk')).toEqual({ switcher: true, segment: 'outfits' });
  });

  it('CB1.5 · switch on: a piece\'s Outfits row and Goes with as before', async () => {
    const { closet, checks, styles } = await setup();
    const around = buildOutfits({ closet, checks, styles, occasion: 'everyday' });
    const want = around.filter((o) => o.itemIds.includes('B1')).length;
    expect(want).toBeGreaterThan(0);
    const goes = goesWith('B1', around);
    expect(goes.length).toBeGreaterThan(0);
    const got = pieceOutfits(true, around, 'B1');
    expect(got.outfitsWith).toBe(want);
    expect(got.goes).toEqual(goes);
    // A piece in no outfit: nothing, as today.
    expect(pieceOutfits(true, around, 'NOPE')).toEqual({ outfitsWith: 0, goes: [] });
  });

  it('CB1.5 · switch on: the buy line and the Starter toast as before', async () => {
    expect(buyGainLine(1, true)).toBe('+1 outfit with what you own');
    expect(buyGainLine(12, true)).toBe('+12 outfits with what you own');
    expect(buyGainLine(18, true)).toBe('+18 outfits with what you own');
    expect(buyGainLine(0, true)).toBeNull();
    expect(buyGainLine(-2, true)).toBeNull();
    expect(buyGainLine(null, true)).toBeNull();

    setDemoOutfits(true);
    expect(cardSpoken({ type: 'buy', starterId: 's02', gain: 12 }, { nameOf: () => null })).toBe('Next buy. Navy polo. +12 outfits with what you own. $30–40.');
    expect(cardSpoken({ type: 'buy', starterId: 's02', gain: 0 }, { nameOf: () => null })).toBe('Next buy. Navy polo. $30–40.');

    // The card draws the line under the name, and VoiceOver reads it.
    await render(<AskAttachment m={buyMessage({ type: 'buy', starterId: 's27', gain: 18 })} readOnly={false} />);
    expect(screen.getByText('+18 outfits with what you own')).toBeTruthy();
    expect(screen.getByLabelText('Next buy. Brown work boots. +18 outfits with what you own. $50–70.')).toBeTruthy();
    // Turning the switch off (leaving the demo screen) redraws the card without it.
    await act(async () => setDemoOutfits(false));
    expect(screen.queryByText('+18 outfits with what you own')).toBeNull();
    expect(screen.getByText('Brown work boots')).toBeTruthy();
    await cleanup();

    // Starter: "+N fits", N the Closet's own gain (oneCount G1), with Undo.
    setDemoOutfits(true);
    const { store, closet, styles } = await setup();
    const e = missing(closet).find((x) => closetGain(closet, styles, x) > 1)!;
    const n = closetGain(closet, styles, e);
    const g = e.pick!.garment;
    const toast = await pickStarter(store, e, { subcategory: String(g.subcategory), color: String(g.color_family) }, counterIds(), AS_OF + 1000);
    expect(toast?.text).toBe(t('toast.fits', { n }));
    expect(toast?.text).toBe(`+${n} fits`);
    const added = (await store.closet.all()).filter((c) => !closet.some((x) => x.id === c.id));
    expect(added).toHaveLength(1);
    await toast!.undo!();
    expect((await store.closet.get(added[0]!.id))?.isDeleted).toBe(true);
  });

  it('CB1.5 · switch on: Next best buy\'s sheet as before', async () => {
    setDemoOutfits(true);
    const { closet, checks, styles } = await setup();
    const nb = nextBestBuy({ closet, checks, styles, marks: [] })!;
    const { Redirect } = jest.requireMock<{ Redirect: jest.Mock }>('expo-router');
    Redirect.mockClear();
    jest.mocked(useLive).mockReturnValue({ ...nb, closet });
    await render(<NextBuySheet />);
    expect(Redirect).not.toHaveBeenCalled();
    expect(screen.getByText('Dark straight jeans')).toBeTruthy(); // T69: v16's next best buy (v15: brown work boots)
    expect(screen.getByText('What it unlocks')).toBeTruthy();
    expect(screen.getByText(String(nb.unlocks.length))).toBeTruthy();
  });

  it('CB1.5 · switch on: the Closet screen has the switcher and opens on the remembered Outfits', async () => {
    setDemoOutfits(true);
    const { writes } = await closetWithRemembered('outfits');
    await renderCloset();
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    expect(screen.getByLabelText('Closet')).toBeTruthy();
    expect(screen.getByText('Pieces')).toBeTruthy();
    expect(screen.getByText('Outfits')).toBeTruthy();
    expect(screen.getByText('outfits-view')).toBeTruthy();
    expect(screen.queryByLabelText('Tops, 6 pieces')).toBeNull();
    expect(writes()).toEqual([]);
    await cleanup();

    // His last tap on Pieces: the switcher, and the pieces head to toe.
    const again = await closetWithRemembered('pieces');
    await renderCloset();
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    expect(screen.getByLabelText('Tops, 6 pieces')).toBeTruthy();
    expect(screen.queryByText('outfits-view')).toBeNull();
    expect(again.writes()).toEqual([]);
  });

  it('CB1.5 · the demo screens that show Outfits, and only those', () => {
    const on = (n: number) => {
      const s = SCREENS.find((x) => x.n === n);
      expect([n, s === undefined]).toEqual([n, false]);
      return s!.outfits === true;
    };
    for (const n of [182, 183, 184, 193, 202]) expect([n, on(n)]).toEqual([n, true]);
    for (const n of [15, 260, 261, 12, 13, 25, 171, 161]) expect([n, on(n)]).toEqual([n, false]);
    expect(SCREENS.filter((s) => s.outfits === true).map((s) => s.n).sort((a, b) => a - b)).toEqual([182, 183, 184, 193, 202]);
    // The two new switch-off screens: Closet on the full closet, and B1's page under Closet (screen 184's piece).
    const c260 = SCREENS.find((s) => s.n === 260)!;
    expect([c260.scenario, c260.onboarded, c260.href]).toEqual(['full', true, '/closet']);
    const c261 = SCREENS.find((s) => s.n === 261)!;
    expect([c261.scenario, c261.onboarded, c261.href, c261.under]).toEqual(['full', true, '/closet/item/B1', '/closet']);
  });
});
