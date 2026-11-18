// T94 · Tailored, the 8th look, in the app (specs/tailored.md TL2.2 and TL4; tasks/T94/TESTING.md). LOOKS holds 8 looks
// with Tailored after Classic prep, its name, line and two drawings (setup's screen itself is T113's style game, which
// reads LOOKS); Style profile shows 8 tiles and a tap saves "tailored" in his order; You's Your style shows it; Going
// for offers it and changes no score; How I scored on a suit says "Reads as tailored". The screens render with the shared T39 mocks (src/testing/t39ScreenMocks.tsx) on the memory
// store; the service test runs the real fit-check service with the mock reading source (no server, no network).
//
// Profile (CLAUDE.md rule 6): no real person's profile. The demo photo s09 (a navy suit) is a stock photo, "profile
// unknown", run with the stated test profile: picks Tailored, Classic prep, Minimal (0.5, 0.25, 0.25), born 2005
// (18–21), regular fit, everyday. Nothing is sent: global fetch fails the test, the AI transport must stay empty.
import { flush, mockT39, mount, press, root, setUpT39Tests, textOf, type Node } from '@/testing/t39ScreenMocks';
import { screen, within } from '@testing-library/react-native';
import { scoreParts, type PartsScored, type Reading, type Styles } from '@kitted/core';
import type { ProfileRow, StyleKey } from '@/data/types';
import { normStyleKey, STYLES } from '@/data/types';
import { renderFlat } from '@/features/closet/flats';
import { LOOKS, picksToStyles, togglePick } from '@/features/onboarding/looks';
import { adviceText, asksLook, lookTiles } from '@/features/fitcheck/goingFor';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { whyParts } from '@/features/why/partsRows';
import { styleLabel } from '@/features/morning/copy';
import { t, type StringKey } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota, type QuotaSnapshot } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { realScheduler } from '@/services/scheduler';
import { createMemoryStore } from '@/data/memoryStore';
import YouScreen from '@/app/(tabs)/you/index';
import StyleProfileScreen from '@/app/(tabs)/you/profile';

// You's own reads: the day's usage (a free day, nothing used) and the settings rows (not under test here).
jest.mock('@/features/fitcheck/session', () => ({
  quota: {
    snapshot: async () => ({
      dayKey: '2026-10-22', tier: 'free', pro: false, purchased: false, checksUsed: 0, checkLimit: 7, recheckOpen: false, recheckId: null,
      questionsUsed: 0, questionLimit: 5, heldCount: 0, nextResetMs: Date.parse('2026-10-23T04:00:00-04:00'),
    } satisfies QuotaSnapshot),
  },
  fitCheck: {},
}));
jest.mock('@/features/settings/SettingsRows', () => {
  const { View } = jest.requireActual('react-native');
  return { SettingsRows: () => <View testID="mock-settings-rows" /> };
});

setUpT39Tests();

const TAILORED = 'tailored' as StyleKey;
const NAME = 'Tailored';
const LINE = 'Suits, blazers, dress trousers, loafers';
const TILE = `${NAME}: ${LINE}`;
const ORDER = ['Streetwear', 'Minimal', 'Smart casual', 'Classic prep', 'Tailored', 'Workwear', 'Outdoor', 'Vintage sport'];
const PICKS: Styles = [['tailored', 0.5], ['classic_prep', 0.25], ['minimalist', 0.25]];

function profileRow(o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'me', birthYear: 2005, heightCm: null, build: '', fitPreference: 'regular', styles: PICKS as never, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '2', consentAt: Date.parse('2026-10-22T07:00:00-04:00'), onboardingDone: true,
    ideaTime: null, units: 'imperial', createdAt: Date.parse('2026-10-22T06:00:00-04:00'), ageBand: '18-21', name: null, ...o,
  } as ProfileRow;
}
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const nearBlack = (c: string) => hex(c).every((x) => x <= 0x40);
const white = (c: string) => hex(c).every((x) => x >= 0xe8);

// ── TL4.1 · the look ────────────────────────────────────────────────────────────────────────────────────────────
// T113 replaces setup's tile grid with the style game (its cards cover "Setup's style screen shows 8 look tiles"); T94
// checks Tailored's place in LOOKS, which the game, You and Style profile all draw from, and Style profile's tiles.
const styleArt = (from: Node = root()) =>
  from.queryAll((n) => typeof n.props.testID === 'string' && (n.props.testID as string).startsWith('style-art-') && typeof n.type === 'string');
const svgs = (n: Node) => n.queryAll((x) => x.props.xml !== undefined && String(x.props.xml).includes('<svg'));
const done = () => screen.getByLabelText('Done');

describe('TL4.1 · Tailored is the 8th look, after Classic prep', () => {
  it('TL4.1 · LOOKS has 8 looks, Tailored right after Classic prep, its name and line word for word', () => {
    expect(STYLES).toHaveLength(8);
    expect(new Set(STYLES).size).toBe(8);
    expect([...LOOKS.map((l) => l.style)].sort()).toEqual([...STYLES].sort());
    expect(LOOKS.map((l) => l.style)).toEqual(['streetwear', 'minimalist', 'smart_casual', 'classic_prep', 'tailored', 'workwear', 'outdoor', 'vintage_sport']);
    expect(LOOKS.map((l) => styleLabel(l.style))).toEqual(ORDER);
    expect(LOOKS.filter((l) => l.style === TAILORED)).toHaveLength(1);
    expect([styleLabel(TAILORED), t('style.tailored' as StringKey), t('onb.looks.line.tailored' as StringKey)]).toEqual([NAME, NAME, LINE]);
    // every look has its own line in the deck
    for (const l of LOOKS) expect(t(`onb.looks.line.${l.style}` as StringKey)).not.toMatch(/^onb\./);
  });

  it("TL4.1 · Tailored's two drawings are the suits TL4 describes", () => {
    const tl = LOOKS.filter((l) => l.style === TAILORED);
    expect(tl).toHaveLength(1);
    const [one, two] = tl[0]!.outfits;
    // 1: a charcoal suit (jacket and trousers the same charcoal) with black derbies
    const [t1, b1, s1] = one;
    expect([t1.type, b1.type, s1.type]).toEqual(['blazer', 'trousers', 'derby']);
    expect(t1.color).toBe(b1.color);
    const [r, g, b] = hex(t1.color);
    expect(Math.max(r!, g!, b!) - Math.min(r!, g!, b!)).toBeLessThanOrEqual(16);        // a grey, not a colour
    expect(Math.max(r!, g!, b!)).toBeGreaterThanOrEqual(0x30);                            // charcoal, not black
    expect(Math.max(r!, g!, b!)).toBeLessThanOrEqual(0x60);                               // and not a mid grey
    expect(nearBlack(s1.color)).toBe(true);
    // 2: a navy suit with white leather sneakers (not chunky)
    const [t2, b2, s2] = two;
    expect([t2.type, b2.type, s2.type]).toEqual(['blazer', 'trousers', 'sneaker']);
    expect(t2.color).toBe(b2.color);
    const [nr, ng, nb] = hex(t2.color);
    expect(nb! - Math.max(nr!, ng!)).toBeGreaterThanOrEqual(20);                          // navy: blue leads
    expect(Math.max(nr!, ng!, nb!)).toBeLessThanOrEqual(0x60);                            // and dark
    expect(white(s2.color)).toBe(true);
    expect((s2 as { chunky?: boolean }).chunky ?? false).toBe(false);
    // every piece is a flat (top, bottom, shoe: never a person) and draws
    for (const l of LOOKS) {
      for (const o of l.outfits) {
        expect([l.style, o.map((p) => p.kind)]).toEqual([l.style, ['top', 'bottom', 'shoe']]);
        for (const p of o) for (const scheme of ['light', 'dark'] as const) expect(renderFlat(p, { scheme, id: 't' })).toContain('<svg');
      }
    }
  });

  it("TL4.1 · founder 3: the three redraws (Outdoor's slate-blue shell and heather zip pullover, Streetwear's black chunky sneakers)", () => {
    const look = (s: StyleKey) => LOOKS.find((l) => l.style === s)!;
    const street2 = look('streetwear').outfits[1][2];
    expect([street2.type, street2.color, (street2 as { chunky?: boolean }).chunky, (street2 as { sole?: string }).sole, (street2 as { laceColor?: string }).laceColor])
      .toEqual(['sneaker', '#26272B', true, '#F2F1EC', '#F2F1EC']);
    const out1 = look('outdoor').outfits[0][0];
    expect([out1.type, out1.color, (out1 as { details?: { fullZip?: boolean } }).details?.fullZip]).toEqual(['jacket', '#3D5A73', true]);
    const out2 = look('outdoor').outfits[1][0];
    expect([out2.type, out2.color, (out2 as { pattern?: { type: string } }).pattern?.type, (out2 as { details?: { ribHem?: boolean } }).details?.ribHem])
      .toEqual(['quarter_zip', '#D8D2C2', 'heather', false]);
  });

  it('TL4.1 · Style profile shows 8 look tiles, Tailored 5th, with its two drawings', async () => {
    await mockT39.store.profile.put(profileRow({ styles: [['streetwear', 1]] as never }));
    await mount(<StyleProfileScreen />);
    await flush();
    const tiles = styleArt();
    expect(tiles.map((n) => n.props.testID)).toEqual(LOOKS.map((l) => `style-art-${l.style}`));
    expect(tiles).toHaveLength(8);
    expect(tiles.filter((n) => n.props.testID === 'style-art-tailored')).toHaveLength(1);
    expect(tiles[4]!.props.testID).toBe('style-art-tailored');
    const tl = screen.getByRole('button', { name: NAME });
    expect(within(tl).getByText(NAME)).toBeTruthy();
    expect(svgs(styleArt(tl as unknown as Node)[0]!)).toHaveLength(6);
    // the tiles' buttons, in screen order: his pick, then the other looks by their names
    const names = screen.getAllByRole('button').map((b) => String(b.props.accessibilityLabel ?? '')).filter((l) => ORDER.some((n) => l === n || l.startsWith(`${n}, pick`)));
    expect(names).toEqual(['Streetwear, pick 1', ...ORDER.slice(1)]);
  });
});

// ── TL4.2 · picking it ──────────────────────────────────────────────────────────────────────────────────────────
describe('TL4.2 · picking Tailored', () => {
  it('TL4.2 · tapping Tailored saves "tailored" in tap order', async () => {
    // the pick rules setup and Style profile share
    let p = togglePick([], 'classic_prep').picks;
    p = togglePick(p, TAILORED).picks;
    p = togglePick(p, 'minimalist').picks;
    expect(p).toEqual(['classic_prep', 'tailored', 'minimalist']);
    expect(togglePick(p, 'streetwear')).toEqual({ picks: p, full: true });
    expect(picksToStyles(p)).toEqual([['classic_prep', 0.5], ['tailored', 0.25], ['minimalist', 0.25]]);
    // on Style profile: tap Classic prep, Tailored, Minimal, then a 4th; Done saves his order
    await mockT39.store.profile.put(profileRow({ styles: [] as never }));
    await mount(<StyleProfileScreen />);
    await press(screen.getByRole('button', { name: 'Classic prep' }));
    await press(screen.getByRole('button', { name: NAME }));
    const picked = screen.getByRole('button', { name: 'Tailored, pick 2' });
    expect(picked.props.accessibilityState).toMatchObject({ selected: true });
    expect(within(picked).getByText('2')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Minimal' }));
    await press(screen.getByRole('button', { name: 'Streetwear' }));
    expect(screen.getByRole('button', { name: 'Streetwear' }).props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByRole('button', { name: 'Tailored, pick 2' })).toBeTruthy();
    await press(done());
    expect((await mockT39.store.profile.get('me'))?.styles).toEqual([['classic_prep', 0.5], ['tailored', 0.25], ['minimalist', 0.25]]);
  });

  it('TL4.2 · the keys: tailored is a look key; the old keys map as before', () => {
    expect(normStyleKey('tailored')).toBe('tailored');
    expect(['preppy', 'old_money', 'gorpcore', 'nope'].map(normStyleKey)).toEqual(['classic_prep', 'classic_prep', 'outdoor', null]);
    expect(picksToStyles([TAILORED])).toEqual([['tailored', 1]]);
    expect(picksToStyles(['streetwear', TAILORED, 'outdoor'])).toEqual([['streetwear', 0.5], ['tailored', 0.25], ['outdoor', 0.25]]);
  });

  it("TL4.2 · You's Your style and Style profile show Tailored with its drawings, in his order", async () => {
    await mockT39.store.profile.put(profileRow());
    let r = await mount(<YouScreen />);
    await flush();
    const card = screen.getByTestId('you-style') as unknown as Node;
    const art = styleArt(card);
    expect(art.map((n) => n.props.testID)).toEqual(['style-art-tailored', 'style-art-classic_prep', 'style-art-minimalist']);
    expect(svgs(art[0]!)).toHaveLength(6);
    expect(art[0]!.props.accessibilityElementsHidden).toBe(true);
    const spoken = card.queryAll((n) => n.props.accessibilityRole === 'button' && typeof n.type === 'string').map((n) => String(n.props.accessibilityLabel));
    expect(spoken).toEqual(['Your style: Tailored, first pick; Classic prep; Minimal. Regular fit. Edit.']);
    await r.unmount();

    r = await mount(<StyleProfileScreen />);
    await flush();
    expect(styleArt().map((n) => n.props.testID)).toEqual(LOOKS.map((l) => `style-art-${l.style}`));
    const tl = screen.getByRole('button', { name: 'Tailored, pick 1' });
    expect(tl.props.accessibilityState).toMatchObject({ selected: true });
    expect([within(tl).getByText('1'), within(tl).getByText(NAME)].every(Boolean)).toBe(true);
    expect(screen.getByRole('button', { name: 'Classic prep, pick 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Minimal, pick 3' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Workwear' }).props.accessibilityState).toMatchObject({ selected: false });
    await r.unmount();
  });

  it('TL4.2 · a stored list with an unknown key shows the rest (no crash)', async () => {
    await mockT39.store.profile.put(profileRow({ styles: [['tailored', 0.5], ['not_a_look', 0.5]] as never }));
    await mount(<YouScreen />);
    await flush();
    const card = screen.getByTestId('you-style') as unknown as Node;
    expect(styleArt(card).map((n) => n.props.testID)).toEqual(['style-art-tailored']);
    expect(card.queryAll((n) => n.type === 'Text').map(textOf)).toContain(NAME);
  });
});

// ── TL4.4 · VoiceOver ───────────────────────────────────────────────────────────────────────────────────────────
describe('TL4.4 · VoiceOver', () => {
  it("TL4.4 · the Tailored tile's VoiceOver label", async () => {
    // the look tile's words (setup's template, read by the style game's tile): name and line, word for word
    expect(t('onb.looks.tileA11y', { style: styleLabel(TAILORED), line: t('onb.looks.line.tailored' as StringKey) })).toBe(TILE);
    expect(`${t('profile.a11y.pick', { style: styleLabel(TAILORED), n: 1 })}: ${t('onb.looks.line.tailored' as StringKey)}`).toBe(`Tailored, pick 1: ${LINE}`);
    // Style profile's tile: a button named Tailored, then "Tailored, pick 1" once picked, its drawings hidden
    await mockT39.store.profile.put(profileRow({ styles: [] as never }));
    await mount(<StyleProfileScreen />);
    const tile = screen.getByRole('button', { name: NAME });
    expect([tile.props.accessibilityRole, tile.props.accessibilityLabel, tile.props.accessibilityState?.selected]).toEqual(['button', NAME, false]);
    const hidden = (tile as unknown as Node).queryAll((n) => n.props.accessibilityElementsHidden === true && typeof n.type === 'string');
    expect(hidden).toHaveLength(1);
    expect(svgs(hidden[0]!)).toHaveLength(6);
    await press(tile);
    const picked = screen.getByRole('button', { name: 'Tailored, pick 1' });
    expect([picked.props.accessibilityLabel, picked.props.accessibilityState?.selected]).toEqual(['Tailored, pick 1', true]);
    const labels = screen.getAllByRole('button').map((b) => String(b.props.accessibilityLabel ?? ''));
    expect(labels.some((l) => l.includes('onb.') || l.includes('style.tailored'))).toBe(false);
  });
});

// ── TL4.3 · Going for ───────────────────────────────────────────────────────────────────────────────────────────
async function service(styles: Styles) {
  const store = createMemoryStore();
  await store.init();
  const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
  const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const quota = createQuota({ store, clock, isPro: () => true });
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => false,
  });
  await store.profile.put(profileRow({ styles: styles as never }));
  return { store, svc };
}

describe('TL4.3 · Going for offers Tailored and changes no score', () => {
  it('TL4.3 · Tailored is offered in Going for and choosing it keeps the score', async () => {
    jest.useRealTimers();
    expect(lookTiles([TAILORED, 'classic_prep', 'minimalist'])).toEqual({
      tiles: ['tailored', 'classic_prep', 'minimalist'], more: ['streetwear', 'smart_casual', 'workwear', 'outdoor', 'vintage_sport'],
    });
    expect(lookTiles([]).more).toEqual(['classic_prep', 'tailored', 'workwear', 'outdoor', 'vintage_sport']);
    expect([asksLook('gym'), asksLook('home'), asksLook('everyday')]).toEqual([false, false, true]);

    const { store, svc } = await service(PICKS);
    const { checkId } = (await svc.start({ mode: 'check', photoId: 's09', occasion: 'everyday' })) as { checkId: string };
    const before = (await store.fitChecks.get(checkId))!;
    // his first pick from setup is the pre-pick, and the suit reads as it
    expect([before.style, before.details.goingFor?.style, before.details.goingFor?.source, before.details.readsAs]).toEqual(['tailored', 'tailored', 'setup', 'tailored']);
    expect([before.details.goingForAdvice?.kind, before.details.goingForAdvice?.readsAs]).toEqual(['match', 'tailored']);
    // a match says what it says for every look (Going for works as today; dispute 2, Nov 18)
    expect(adviceText(before.details.goingForAdvice!)).toMatchObject({ kind: 'match', lead: 'It reads that way too.', move: null });
    const s09 = demoReadingById('s09') as Reading;
    expect(before.score).toBe(scoreParts(s09, { occasion: 'everyday' }).overall);

    const same = (r: typeof before) => [r.score, r.rawScore, r.subscores, r.occasion, r.details.parts?.parts, r.details.readsAs, r.fixes.map((f) => [f.target, f.to])];
    const other = (await svc.changeGoingFor(checkId, 'classic_prep'))!;
    expect(same(other)).toEqual(same(before));
    expect([other.style, other.details.goingForAdvice?.going, other.details.goingForAdvice?.kind, other.details.goingForAdvice?.readsAs])
      .toEqual(['classic_prep', 'classic_prep', 'mismatch', 'tailored']);
    // the mismatch names the look it reads as: "Reads as tailored."
    expect(adviceText(other.details.goingForAdvice!)).toMatchObject({ kind: 'mismatch', lead: 'Reads as tailored.' });
    const back = (await svc.changeGoingFor(checkId, TAILORED))!;
    expect(same(back)).toEqual(same(before));
    expect([back.style, back.details.goingFor?.confirmed, back.details.goingForAdvice?.kind]).toEqual(['tailored', true, 'match']);
    expect(adviceText(back.details.goingForAdvice!).lead).toBe('It reads that way too.');
  });
});

describe('TL4.3 · Going for Tailored names what pulls away', () => {
  it('TL4.3 · a graphic tee under a blazer, going for Tailored: the card names the tee and the swap, the score stays', () => {
    // Verification round 1 (Nov 18): a made-up outfit (no person): a white graphic tee under a navy blazer, grey trousers,
    // brown loafers. The graphic tee is on Tailored's never-list; a plain tee in its place reads as Tailored.
    const G = (category: string, subcategory: string, color: string, more: Record<string, unknown> = {}) => ({
      category, subcategory, color_family: color, pattern: 'solid', logo: 'none', volume: 3, leg_shape: 'na', hem: 'na', tucked: 'na',
      condition: 'clean', certainty: 'clear', length: 'na', pattern_scale: 'na', saturation: 'na', sleeve_end: 'na', strain: 'none',
      distressed_by_design: false, shows_below_outer: false, ...more,
    });
    const reading = {
      scene: { framing: 'full_body', shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: 'good', clothed: 'fully' },
      garments: [
        G('top', 'graphic_tee', 'white', { pattern: 'graphic', tucked: 'none', length: 'mid_fly', sleeve_end: 'at_wrist' }),
        G('outerwear', 'blazer', 'navy', { length: 'at_belt', sleeve_end: 'at_wrist' }),
        G('bottom', 'trousers', 'grey', { leg_shape: 'straight', hem: 'slight_break' }),
        G('footwear', 'loafer', 'brown'),
      ],
    } as unknown as Reading;
    const ev = (goingFor: StyleKey | null) =>
      evaluateCheck({ reading, occasion: 'everyday', styles: PICKS, boldness: null, closet: [], firstCheck: false, goingFor });
    const a = ev(TAILORED).row.details.goingForAdvice!;
    expect([a.going, a.kind, a.readsAs, a.piece]).toEqual(['tailored', 'mismatch', 'classic_prep', { index: 0, name: 'graphic tee', plural: false, why: 'loud' }]);
    expect(adviceText(a)).toEqual({
      kind: 'mismatch', lead: 'Reads as classic prep.', rest: 'For a tailored look, the graphic tee pulls the other way.',
      move: { title: 'Swap the graphic tee for a plain tee', detail: 'Toward tailored' },
    });
    const none = ev(null).row;
    expect([ev(TAILORED).row.score, ev(TAILORED).row.rawScore, ev(TAILORED).row.subscores]).toEqual([none.score, none.rawScore, none.subscores]);
  });
});

// ── TL2.2 · How I scored ────────────────────────────────────────────────────────────────────────────────────────
describe('TL2.2 · How I scored on a suit', () => {
  it('TL2.2 · How I scored on the suit shows "Reads as tailored"', () => {
    const res = scoreParts(demoReadingById('s09') as Reading, { occasion: 'everyday' }) as PartsScored;
    expect(res.styleLabel).toBe('tailored');
    const w = whyParts(res, { occasion: 'everyday', readsAs: res.styleLabel as StyleKey, gainPart: null });
    const style = w.groups.find((g) => g.part === 'cohesion')!;
    expect(style.rows.filter((r) => /^Reads as/.test(r.rule)).map((r) => [r.rule, r.amount])).toEqual([['Reads as tailored', 0.5]]);
    const every = [...w.groups.flatMap((g) => g.rows), ...w.after].map((r) => `${r.rule} ${r.item ?? ''}`);
    expect(every.filter((x) => /matching suit/i.test(x))).toEqual([]);
    // the engine line says it, so no "Reads as" row after the parts
    expect(w.after.filter((r) => r.key === 'readsAs')).toEqual([]);
  });
});
