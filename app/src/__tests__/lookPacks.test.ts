// Starter basics that follow his looks (09-ui-review §16, K1–K12, #364; the founder's OK Oct 17). The lists in
// finish/packs.ts: every look's 12 against its own "never with" rules (rubric/v5-styles.md), the blend
// of up to 3 picks, the stored ids, that no list changes a score or a "+N", and the wiring (K9–K12): every suggestion
// comes from his list, a stored id outside it still works, and changing his looks deletes nothing. Since the merge onto
// #343 the lists feed Next best buy, "Add shoes" and Kit's buy cards; "What you already own" keeps today's 12 (K9), and
// move 3 is gone with the moves.
import { detectStyles, outfitReading, outfitValid, scoreParts, US_EASTERN, type ClosetItem, type Garment, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { STYLES, type ClosetItemRow, type StyleKey } from '@/data/types';
import { checkSentence } from '@/features/ask/gate';
import { scoreOptions } from '@/features/fitcheck/scoring';
import {
  CATALOG, catalogRow, COMMON_IDS, CORE_IDS, LIST_SIZE, LOOK_ROWS, overlaps, PACKS, picksOf, QUOTAS, starterList,
} from '@/features/finish/packs';
import { cardSpoken, starterFor } from '@/features/ask/cards';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence } from '@/features/ask/evidence';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { bestMissing, ghostPiece, nextBestBuy, starterGain } from '@/features/finish/gains';
import { markedPiece, ownedCount, ownership, STARTER, type StarterEntry } from '@/features/finish/starter';
import { manualClock } from '@/services/clock';

const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
declare const __dirname: string;

const row = (id: string): StarterEntry => catalogRow(id)!;
/** T94 (founder 2): Tailored has no pack yet; the looks with a pack are the ones the lists below cover. */
const PACKED: StyleKey[] = STYLES.filter((l) => PACKS[l] !== undefined);
const pack = (look: StyleKey) => PACKS[look]!;
const one = (look: StyleKey): Styles => [[look, 1]];
const picks = (...looks: string[]): Styles => looks.map((l, i) => [l, i === 0 ? 0.5 : 0.25] as const);
const ghost = (id: string) => ghostPiece(row(id))!;
const asItems = (rows: readonly ClosetItemRow[]) => rows as unknown as ClosetItem[];

/** The look's anchor outfit with `id` swapped into its slot (an outer piece goes over the anchor's top). */
function anchorWith(look: StyleKey, id?: string): ClosetItemRow[] {
  const a = pack(look).anchor;
  const slots: Record<string, string | undefined> = { top: a.top, bottom: a.bottom, shoes: a.shoes, outer: a.outer };
  if (id) {
    const slot = row(id).slot;
    if (slot) slots[slot] = id;
  }
  return (['outer', 'top', 'bottom', 'shoes'] as const).filter((s) => slots[s]).map((s) => ghost(slots[s]!));
}
const readsAs = (items: readonly ClosetItemRow[]) => detectStyles(outfitReading(asItems(items))).detected;
const everyday = (items: readonly ClosetItemRow[], styles: Styles = []) =>
  scoreParts(outfitReading(asItems(items)), scoreOptions({ occasion: 'everyday', styles, boldness: null, secondLook: null })).overall;

const wearable = (e: StarterEntry) => !!e.pick && !!e.slot;

/** Every top + bottoms + shoes the look's own list makes, each alone and under each of its layers. */
function packOutfits(look: StyleKey): ClosetItemRow[][] {
  const rows = pack(look).ids.map(row).filter(wearable);
  const of = (slot: string) => rows.filter((e) => e.slot === slot).map((e) => ghost(e.id));
  const out: ClosetItemRow[][] = [];
  for (const t of of('top')) for (const b of of('bottom')) for (const s of of('shoes')) {
    out.push([t, b, s]);
    for (const o of of('outer')) out.push([o, t, b, s]);
  }
  return out;
}
/** The Closet's count's own test (#84.3): the hard rules let it through and it's Put together at Everyday. */
const counts = (items: readonly ClosetItemRow[]) => outfitValid(asItems(items), []) && (everyday(items) ?? 0) >= 7.0;
const subOf = (x: Garment) => String(x.subcategory);

// v5-styles' "never with" rules, as the pieces each one names (a plain outfit: no jacket over a top).
const NEVER: Partial<Record<StyleKey, { rule: string; bad(x: Garment): boolean }[]>> = {
  streetwear: [
    { rule: 'STR-3 tailoring', bad: (x) => ['blazer', 'sport_coat', 'unstructured_blazer', 'suit_jacket', 'suit_trousers', 'overcoat', 'trousers', 'dress_shirt'].includes(subOf(x)) },
    { rule: 'STR-3 dress shoes', bad: (x) => ['loafer', 'derby', 'dress_shoe'].includes(subOf(x)) },
    { rule: 'STR-3 skinny legs', bad: (x) => x.leg_shape === 'skinny' },
    { rule: 'STR-3 collared tops with no jacket', bad: (x) => ['polo', 'oxford_shirt', 'knit_polo', 'cardigan', 'rugby_shirt'].includes(subOf(x)) },
  ],
  workwear: [
    { rule: 'WRK-3', bad: (x) => ['sweatpants', 'joggers', 'athletic_shorts', 'jersey', 'tank_top', 'suit_jacket', 'suit_trousers', 'dress_shoe', 'slides_sandals'].includes(subOf(x)) },
    { rule: 'WRK-3 bright', bad: (x) => x.saturation === 'bright' },
    { rule: 'WRK-2 against', bad: (x) => ['graphic_tee', 'chunky_sneaker', 'basketball_sneaker', 'performance_runner', 'puffer', 'shell_jacket', 'rain_jacket', 'fleece', 'blazer', 'sport_coat'].includes(subOf(x)) || x.logo === 'large' || x.volume === 5 },
  ],
  vintage_sport: [
    { rule: 'VSP-3', bad: (x) => ['athletic_shorts', 'tank_top'].includes(subOf(x)) },
    { rule: 'VSP-2 against', bad: (x) => ['chunky_sneaker', 'basketball_sneaker', 'slides_sandals'].includes(subOf(x)) },
    { rule: 'VSP-1 not skinny', bad: (x) => x.leg_shape === 'skinny' },
  ],
  outdoor: [
    { rule: 'OUT-2', bad: (x) => ['blazer', 'sport_coat', 'unstructured_blazer', 'suit_jacket', 'dress_shirt', 'trousers', 'suit_trousers', 'dress_shoe', 'derby', 'loafer', 'sweatpants', 'joggers', 'athletic_shorts', 'jersey'].includes(subOf(x)) },
    { rule: 'OUT-1 against', bad: (x) => ['work_boot', 'chore_coat', 'denim_jacket'].includes(subOf(x)) },
  ],
  minimalist: [
    { rule: 'MIN-3 patterns', bad: (x) => ['graphic', 'camo', 'floral', 'checks_plaid'].includes(String(x.pattern)) || subOf(x) === 'graphic_tee' },
    { rule: 'MIN-3 logo, bright, sweats, tailoring', bad: (x) => x.logo === 'large' || x.saturation === 'bright' || ['sweatpants', 'joggers', 'blazer', 'sport_coat', 'suit_jacket'].includes(subOf(x)) },
    { rule: 'MIN-1 palette', bad: (x) => !['white', 'off_white_cream', 'light_grey', 'grey', 'charcoal', 'black', 'navy', 'khaki_beige', 'tan_camel', 'brown', 'olive', 'light_blue', 'denim_dark', 'burgundy', 'sage'].includes(String(x.color_family)) },
    { rule: 'MIN-2 against', bad: (x) => ['chunky_sneaker', 'basketball_sneaker', 'performance_runner', 'slides_sandals'].includes(subOf(x)) },
    { rule: 'MIN-3 a regular collared or zip-neck top (over straight legs: the pack has straight chinos)', bad: (x) => ['polo', 'oxford_shirt', 'knit_polo', 'quarter_zip', 'dress_shirt', 'camp_collar_shirt'].includes(subOf(x)) },
  ],
  classic_prep: [
    { rule: 'PRP-2 bottoms', bad: (x) => ['sweatpants', 'joggers', 'athletic_shorts', 'cargos'].includes(subOf(x)) || (subOf(x) === 'jeans' && ['relaxed', 'wide'].includes(String(x.leg_shape))) },
    { rule: 'PRP-2 shoes', bad: (x) => ['chunky_sneaker', 'basketball_sneaker', 'performance_runner', 'slides_sandals', 'work_boot'].includes(subOf(x)) },
    { rule: 'PRP-2 street tops with no blazer, any roomy top', bad: (x) => ['hoodie', 'sweatshirt', 'graphic_tee', 'tank_top', 'jersey', 'fleece'].includes(subOf(x)) || (x.category === 'top' && Number(x.volume) >= 4) },
  ],
  smart_casual: [
    { rule: 'SMC-2 tops', bad: (x) => ['hoodie', 'sweatshirt', 'graphic_tee', 'jersey', 'rugby_shirt', 'flannel_shirt', 'fleece', 'puffer', 'shell_jacket', 'rain_jacket', 'tank_top'].includes(subOf(x)) },
    { rule: 'SMC-2 bottoms and shoes', bad: (x) => ['sweatpants', 'joggers', 'athletic_shorts', 'cargos', 'slides_sandals'].includes(subOf(x)) },
    { rule: 'SMC-2 logo, camo, roominess 5', bad: (x) => x.logo === 'large' || x.pattern === 'camo' || x.volume === 5 },
  ],
};

/** Every ordered blend of 2 and 3 different looks. */
const BLENDS: StyleKey[][] = [];
for (const a of PACKED) for (const b of PACKED) {
  if (a === b) continue;
  BLENDS.push([a, b]);
  for (const c of PACKED) if (c !== a && c !== b) BLENDS.push([a, b, c]);
}

describe('K1 · every list is 12 rows with the core', () => {
  it('each look and today\'s list', () => {
    for (const look of PACKED) {
      const ids = pack(look).ids;
      expect(ids).toHaveLength(LIST_SIZE);
      expect(new Set(ids).size).toBe(LIST_SIZE);
      for (const c of CORE_IDS) expect(ids).toContain(c);
      for (const id of ids) expect(catalogRow(id)).toBeDefined();
    }
    expect(COMMON_IDS).toHaveLength(LIST_SIZE);
  });
  it(`every blend of 2 and 3 picks (${BLENDS.length})`, () => {
    for (const looks of BLENDS) {
      const ids = starterList(picks(...looks)).map((e) => e.id);
      expect(ids).toHaveLength(LIST_SIZE);
      expect(new Set(ids).size).toBe(LIST_SIZE);
      for (const c of CORE_IDS) expect(ids).toContain(c);
    }
  });
});

describe('K2 · no piece breaks its look\'s "never with" rules', () => {
  it.each(PACKED)('%s', (look) => {
    const broken: string[] = [];
    for (const id of pack(look).ids) {
      const e = row(id);
      if (!e.pick) continue;
      for (const r of NEVER[look]!) if (r.bad(e.pick.garment)) broken.push(`${id} ${e.name}: ${r.rule}`);
    }
    expect(broken).toEqual([]);
  });
});

describe('K3 · each look\'s pieces make that look', () => {
  it.each(PACKED)('%s: the anchor reads as the look, passes the closet\'s hard rules and is Put together', (look) => {
    const items = anchorWith(look);
    expect(readsAs(items)).toContain(look);
    expect(outfitValid(asItems(items), [])).toBe(true);
    expect(everyday(items)).toBeGreaterThanOrEqual(7.0);
  });
  it.each(PACKED)('%s: each of its own pieces is in an outfit from the list that reads as the look and counts', (look) => {
    const outfits = packOutfits(look).filter(counts);
    const off = pack(look).own.filter((id) => !outfits.some((o) => o.some((c) => c.starterId === id) && readsAs(o).includes(look)));
    expect(off).toEqual([]);
  });
  it.each(PACKED)('%s: every wearable piece is in an outfit from the list that counts (no dead suggestion)', (look) => {
    const outfits = packOutfits(look).filter(counts);
    const dead = pack(look).ids.filter((id) => wearable(row(id)) && !outfits.some((o) => o.some((c) => c.starterId === id)));
    expect(dead).toEqual([]);
  });
  it('the pick names the piece its row is for (each row fills its own pick)', () => {
    for (const e of CATALOG.filter(wearable)) expect(e.fills(e.pick!.garment, e.slot!)).toBe(true);
  });
});

describe('K4 · one piece never fills two rows of one list', () => {
  const pairs = (rows: readonly StarterEntry[]) => {
    const out: string[] = [];
    rows.forEach((a, i) => rows.slice(i + 1).forEach((b) => overlaps(a, b) && out.push(`${a.id}+${b.id}`)));
    return out;
  };
  it('each look and today\'s list', () => {
    for (const look of PACKED) expect(pairs(pack(look).ids.map(row))).toEqual([]);
    expect(pairs(COMMON_IDS.map(row))).toEqual([]);
  });
  it('every blend', () => {
    for (const looks of BLENDS) expect(pairs(starterList(picks(...looks)))).toEqual([]);
  });
});

describe('K5 · his picks blend in his order', () => {
  const nonCore = (look: StyleKey) => pack(look).ids.filter((id) => !(CORE_IDS as readonly string[]).includes(id));
  it('no picks, "Not sure" (no picks stored) or only unknown keys: today\'s 12 in today\'s order', () => {
    expect(starterList(null).map((e) => e.id)).toEqual(STARTER.map((e) => e.id));
    expect(starterList([]).map((e) => e.id)).toEqual(STARTER.map((e) => e.id));
    expect(starterList(picks('something_else')).map((e) => e.id)).toEqual(STARTER.map((e) => e.id));
  });
  it('TL4 · a Tailored pick alone keeps today\'s 12 (founder 2: no Tailored list yet); with others, theirs', () => {
    expect(STYLES).toContain('tailored');
    expect(PACKED).not.toContain('tailored');
    expect(PACKED).toHaveLength(7);
    const tl = 'tailored' as StyleKey;
    expect(starterList(one(tl)).map((e) => e.id)).toEqual(STARTER.map((e) => e.id));
    expect(starterList(picks('tailored', 'streetwear')).map((e) => e.id)).toEqual([...pack('streetwear').ids]);
    expect(starterList(picks('streetwear', 'tailored', 'minimalist')).map((e) => e.id))
      .toEqual(starterList(picks('streetwear', 'minimalist')).map((e) => e.id));
  });
  it('one pick: that look\'s 12 in its order; old keys map (preppy, old_money, gorpcore)', () => {
    for (const look of PACKED) expect(starterList(one(look)).map((e) => e.id)).toEqual([...pack(look).ids]);
    expect(starterList(picks('preppy')).map((e) => e.id)).toEqual([...pack('classic_prep').ids]);
    expect(starterList(picks('gorpcore')).map((e) => e.id)).toEqual([...pack('outdoor').ids]);
  });
  it('the first pick gets its full share, first, and leads the list', () => {
    for (const looks of BLENDS) {
      const ids = starterList(picks(...looks)).map((e) => e.id);
      const share = QUOTAS[looks.length as 2 | 3][0]!;
      for (const id of nonCore(looks[0]!).slice(0, share)) expect(ids).toContain(id);
      expect(ids[0]).toBe(pack(looks[0]!).ids[0]);
    }
  });
  it('every row comes from one of his picks or the core; today\'s list only refills', () => {
    for (const looks of BLENDS) {
      const mine = new Set([...CORE_IDS, ...looks.flatMap((l) => pack(l).ids)]);
      const extra = starterList(picks(...looks)).filter((e) => !mine.has(e.id)).map((e) => e.id);
      for (const id of extra) expect(COMMON_IDS).toContain(id);
    }
  });
  it('a later pick gets its share unless its rows clash with an earlier pick\'s', () => {
    for (const looks of BLENDS) {
      const list = starterList(picks(...looks));
      looks.slice(1).forEach((look, j) => {
        const share = QUOTAS[looks.length as 2 | 3][j + 1]!;
        const got = nonCore(look).filter((id) => list.some((e) => e.id === id)).length;
        expect(got).toBeGreaterThanOrEqual(Math.min(share, 1));
      });
    }
  });
  it('order matters: streetwear then minimal is not minimal then streetwear', () => {
    const a = starterList(picks('streetwear', 'minimalist')).map((e) => e.id);
    const b = starterList(picks('minimalist', 'streetwear')).map((e) => e.id);
    expect(a).not.toEqual(b);
    expect(picksOf(picks('streetwear', 'streetwear', 'minimalist', 'outdoor', 'workwear'))).toEqual(['streetwear', 'minimalist', 'outdoor']);
  });
});

describe('K6 · stored ids stay valid', () => {
  it('s01–s12 are today\'s rows, unchanged, first in the catalog', () => {
    expect(CATALOG.slice(0, 12)).toEqual([...STARTER]);
  });
  it('new ids follow on (s13…), unique, never reused', () => {
    expect(LOOK_ROWS.map((e) => e.id)).toEqual(LOOK_ROWS.map((_, i) => `s${String(13 + i).padStart(2, '0')}`));
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length);
  });
  it('every id any list can show is in the catalog, so any stored id still finds its row', () => {
    for (const looks of [...STYLES.map((l) => [l]), ...BLENDS]) for (const e of starterList(picks(...looks))) expect(catalogRow(e.id)).toBe(e);
  });
});

describe('K7 · the list never changes a score or a "+N" (#211, #309)', () => {
  it('each anchor outfit scores the same under every pick and none', () => {
    for (const look of PACKED) {
      const items = anchorWith(look);
      const base = everyday(items);
      for (const p of STYLES) expect(everyday(items, one(p))).toBe(base);
    }
  });
  it('on the demo closet, every row\'s "+N" is the same whichever looks he picked', async () => {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:00:00-04:00') });
    const closet = await store.closet.all();
    const diff: string[] = [];
    for (const e of CATALOG.filter(wearable)) {
      const base = starterGain(closet, null, e);
      for (const p of [one('streetwear'), one('classic_prep'), picks('outdoor', 'minimalist', 'workwear')]) {
        if (starterGain(closet, p, e) !== base) diff.push(e.id);
      }
    }
    expect(diff).toEqual([]);
  });
});

describe('K8 · the words', () => {
  const PRICE = /^(\$\d+–\d+|About \$\d+)$/;
  const low = (s: string) => Number(/\$(\d+)/.exec(s)?.[1]);
  it('every new row: a name, a phrase and a short name that pass the sentence gate (no brand, no shop)', () => {
    const ctx = { allowedScores: new Set<number>() } as unknown as Parameters<typeof checkSentence>[1];
    for (const e of LOOK_ROWS) for (const s of [e.name, e.pick!.phrase, e.pick!.name]) expect([s, checkSentence(s, ctx)]).toEqual([s, null]);
  });
  it('prices read "$a–b", budget below mid', () => {
    for (const e of LOOK_ROWS) {
      expect(e.budget).toMatch(PRICE);
      expect(e.mid).toMatch(PRICE);
      expect(low(e.budget)).toBeLessThan(low(e.mid));
    }
  });
});

const AS_OF = Date.parse('2026-10-22T12:00:00-04:00');
async function demo() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: AS_OF });
  return { store, closet: await store.closet.all(), profile: (await store.profile.get('me'))! };
}
const ids = (rows: readonly StarterEntry[]) => rows.map((e) => e.id);

describe('K9 · "What you already own" keeps today\'s 12 (#343)', () => {
  it('a piece filling a row of another look counts only where that row is shown', () => {
    const streetwear = ids(starterList(one('streetwear')));
    const loafers = { ...markedPiece(row('s10'), { subcategory: 'loafer', color: 'brown' }, 'L', AS_OF)!, isPhotographed: true, starterId: null, source: 'fitCheck' as const };
    const own = ownership([loafers], []);
    expect(own.s10?.owned).toBe(true);
    expect(ownedCount(own, streetwear)).toBe(0);
    expect(ownedCount(own, ids(starterList(null)))).toBe(1);
  });
  it('the screen draws today\'s 12, not his looks\' list (read from the source)', () => {
    const src = readFileSync(join(__dirname, '../features/finish/StarterScreen.tsx'), 'utf8');
    expect(src).not.toMatch(/starterList/);
    for (const e of LOOK_ROWS) expect(e.owns).toEqual([]);
  });
});

describe('K10 · every suggestion comes from his list', () => {
  it('on the demo closet: the next best buy and "Add shoes" pick only rows of his list, for each look and the demo\'s own picks', async () => {
    const { closet, profile } = await demo();
    for (const styles of [profile.styles, ...STYLES.map(one), picks('streetwear', 'outdoor')]) {
      const list = ids(starterList(styles));
      const nb = nextBestBuy({ closet, checks: [], styles, marks: [] });
      if (nb) expect(list).toContain(nb.entry.id);
      const best = bestMissing(closet, styles, []);
      if (best) expect(list).toContain(best.entry.id);
    }
  });
  it('ties go to his first look: the pick is the earliest row of his list among the most outfits', async () => {
    const { closet } = await demo();
    for (const styles of [picks('streetwear', 'minimalist'), picks('minimalist', 'streetwear'), picks('workwear', 'outdoor')]) {
      const own = ownership(closet, []);
      const rows = starterList(styles).filter((e) => wearable(e) && !own[e.id]?.owned);
      const gains = rows.map((e) => starterGain(closet, styles, e));
      const top = Math.max(...gains);
      expect(bestMissing(closet, styles, [])!.entry.id).toBe(rows[gains.indexOf(top)]!.id);
    }
  });
  it('the chat\'s buy-next evidence lists only rows of his list', async () => {
    const { store } = await demo();
    for (const styles of [one('streetwear'), one('workwear')]) {
      const p = (await store.profile.get('me'))!;
      await store.profile.put({ ...p, styles });
      const snap = await loadStylistSnapshot(store, manualClock(AS_OF));
      const q = 'What should I buy next?';
      const ctx = buildStylistContext(snap, q);
      const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: () => ({ dow: 4, today: true }) });
      const ev = await buildEvidence(route, snap, ctx, { readingOf: async () => null, starterMarks: [] });
      const shown = ev.text.split('\n').filter((l) => l.startsWith('- ')).map((l) => /^- (s\d\d)/.exec(l)?.[1]);
      expect(shown.length).toBeGreaterThan(0);
      for (const id of shown) expect(ids(starterList(styles))).toContain(id);
    }
  });
});

describe('K11 · a stored id outside his list still works', () => {
  it('an old buy card and a new look\'s card both speak, whatever his looks', () => {
    for (const starterId of ['s08', 's26']) {
      expect(cardSpoken({ type: 'buy', starterId, gain: 3 }, { nameOf: () => null })).toContain(row(starterId).pick!.name);
    }
  });
  it('the chat\'s named kind finds his list\'s row first, then any row', () => {
    expect(starterFor('hoodie', null, one('streetwear'))?.id).toBe('s15');
    expect(starterFor('hoodie', null, null)?.id).toBe('s11');
    expect(starterFor('chore coat', null, one('workwear'))?.id).toBe('s26');
    // s07 is plain "Overshirt" since #343, so with no picks the catalog's chore coat row answers.
    expect(starterFor('chore coat', null, null)?.id).toBe('s26');
    expect(starterFor('overshirt', null, null)?.id).toBe('s07');
    expect(starterFor('rugby shirt', null, null)?.id).toBe('s31');
  });
  it('a marked piece and the belt\'s kv mark keep their rows in every list', () => {
    const hoodie = markedPiece(row('s15'), { subcategory: 'hoodie', color: 'grey' }, 'H', AS_OF)!;
    for (const styles of [null, one('streetwear'), one('minimalist')]) {
      const own = ownership([hoodie], ['s12']);
      expect(own.s15).toEqual({ owned: true, how: 'marked', itemId: 'H' });
      expect(own.s12?.owned).toBe(true);
      expect(ids(starterList(styles))).toContain('s12');
    }
  });
});

describe('K12 · changing his looks', () => {
  it('the list follows his profile at once; a piece from a look\'s row stays in Closet and comes back ticked', async () => {
    const { store } = await demo();
    const p = (await store.profile.get('me'))!;
    await store.profile.put({ ...p, styles: one('streetwear') });
    const piece = markedPiece(row('s15'), { subcategory: 'hoodie', color: 'grey' }, 'H15', AS_OF)!;
    await store.closet.put(piece);
    await store.profile.put({ ...p, styles: one('classic_prep') });
    const prep = starterList((await store.profile.get('me'))!.styles);
    expect(ids(prep)).not.toContain('s15');
    expect((await store.closet.all()).some((c) => c.id === piece.id && !c.isDeleted)).toBe(true);
    await store.profile.put({ ...p, styles: one('streetwear') });
    const own = ownership(await store.closet.all(), []);
    expect(ids(starterList((await store.profile.get('me'))!.styles))).toContain('s15');
    expect(own.s15).toMatchObject({ owned: true, how: 'marked' });
  });
});
