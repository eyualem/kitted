// T102 · Kit's card shapes, built and checked by code (specs/kit-stylist-chat.md KC1.2, KC2.1 to KC2.6, KC2.9).
// Written before the code (tasks/T102/TESTING.md). Nothing here calls a model: the model is a script. A closet is a few
// named pieces (testing/kitCardsHelpers.ts); every combination a test relies on is checked with the rubric first.
import { dayKey, garmentName, G, FAMILY_HEX, nearestFamily, US_EASTERN, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { loadScenario } from '@/data/seedLoader';
import type { ChatMessage } from '@/data/types';
import {
  askedAgain, buildCard as realBuildCard, buyPiece, cardKey, cardPiece, colorName, colorPieces, exampleOutfit, KIND_SLOT, kindNoun, nextBuyFor,
  shownKeysToday, slotOfKind, type AskCard, type CardPiece,
} from '@/features/ask/cards';
import { buildStylistContext } from '@/features/ask/context';
import { checkSentence } from '@/features/ask/gate';
import { liveAnswer } from '@/features/ask/live';
import { CLOSING_FORMAT, PROMPT_VERSION, systemPrompt } from '@/features/ask/prompt';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { artSpec } from '@/features/closet/artSpec';
import { starterList } from '@/features/finish/packs';
import { colorWord } from '@/features/fitcheck/labels';
import { LOOKS } from '@/features/onboarding/looks';
import { createMemoryStore } from '@/data/memoryStore';
import { manualClock } from '@/services/clock';
import { GATE, harness, kit, kitOver, NOW, rowOf, says, valid, type Input } from '@/testing/kitCardsHelpers';

/** buildCard with T102's extra inputs (shownToday, avoid, allowedColors) in its type. */
const buildCard = (raw: unknown, input: Input) => realBuildCard(raw, input);

beforeEach(() => liveAnswer.clear());

type Outfit = { type: 'outfit'; itemIds: string[]; occasion: string; needs: CardPiece[]; example: boolean };
type Options = { type: 'options'; slot: string; options: ({ itemId: string } | { piece: CardPiece })[] };
type Colors = { type: 'colors'; about: 'piece' | 'general'; kind?: string; itemId?: string; goesWith?: string; families: string[] };
type Buy = { type: 'buy'; starterId: string; gain: number | null; why?: string };

const outfit = (c: AskCard | null): Outfit => {
  expect(c).not.toBeNull();
  expect(c!.type).toBe('outfit');
  return c as unknown as Outfit;
};
const options = (c: AskCard | null): Options => {
  expect(c).not.toBeNull();
  expect(c!.type).toBe('options');
  return c as unknown as Options;
};
const entryName = (e: Options['options'][number]): string => ('itemId' in e ? e.itemId : `piece:${e.piece.kind}`);
const pair = (p: CardPiece): string => `${p.kind}|${p.color}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The spec's color words (Interfaces: the `colorName` table; the founder's OK, Nov 17). */
const COLOR_WORDS: Readonly<Record<string, string>> = {
  white: 'White', off_white_cream: 'Off-white', light_grey: 'Light grey', grey: 'Grey', charcoal: 'Charcoal', black: 'Black', navy: 'Navy',
  light_blue: 'Light blue', blue: 'Blue', denim_light: 'Light denim', denim_mid: 'Mid denim', denim_dark: 'Dark denim', olive: 'Olive',
  green: 'Green', sage: 'Sage', khaki_beige: 'Beige', tan_camel: 'Tan', brown: 'Brown', burgundy: 'Burgundy', red: 'Red', orange: 'Orange',
  yellow: 'Yellow', pink: 'Pink', purple: 'Purple',
};
const FAMILIES = Object.keys(COLOR_WORDS);
const ACCESSORIES = ['watch', 'belt', 'cap', 'beanie'];

/** Every kind the closet draws today (artSpec's TOP, BOTTOM and SHOE tables) and the slot each belongs to. */
const SURE_TOP = ['tee', 'graphic_tee', 'polo', 'oxford_shirt', 'dress_shirt', 'flannel_shirt', 'sweater', 'sweatshirt', 'hoodie', 'tank_top'];
const SURE_OUTER = ['denim_jacket', 'bomber', 'leather_jacket', 'field_jacket', 'puffer', 'blazer', 'sport_coat', 'suit_jacket', 'overcoat', 'chore_coat', 'overshirt', 'shell_jacket', 'rain_jacket'];
const EITHER_TOP_OR_OUTER = ['jersey', 'knit_polo', 'camp_collar_shirt', 'fleece', 'rugby_shirt', 'quarter_zip', 'cardigan', 'unstructured_blazer', 'henley', 'button_up_shirt', 'short_sleeve_shirt', 'turtleneck', 'zip_hoodie'];
const BOTTOMS = ['jeans', 'chinos', 'trousers', 'suit_trousers', 'drawstring_trousers', 'cargos', 'joggers', 'sweatpants', 'shorts', 'athletic_shorts', 'jorts'];
const SHOES = ['white_leather_sneaker', 'canvas_sneaker', 'low_profile_sneaker', 'basketball_sneaker', 'chunky_sneaker', 'retro_runner', 'performance_runner', 'work_boot', 'suede_chukka', 'chelsea_boot', 'loafer', 'dress_shoe', 'derby', 'slides_sandals'];
const DRAWABLE = [...SURE_TOP, ...SURE_OUTER, ...EITHER_TOP_OR_OUTER, ...BOTTOMS, ...SHOES];
const SLOT_OF: Readonly<Record<string, string>> = {
  ...Object.fromEntries(SURE_TOP.map((k) => [k, 'top'])), ...Object.fromEntries(SURE_OUTER.map((k) => [k, 'outer'])),
  ...Object.fromEntries(BOTTOMS.map((k) => [k, 'bottom'])), ...Object.fromEntries(SHOES.map((k) => [k, 'shoes'])),
  ...Object.fromEntries(ACCESSORIES.map((k) => [k, 'accessory'])),
};

/** The name a drawn piece must have: the spec's color word, then the closet's own noun (founder, Nov 17). */
function checkName(p: CardPiece) {
  if (p.kind === 'jeans' && p.color.startsWith('denim')) {
    expect(p.name).toBe(`${colorWord({ color_family: p.color, subcategory: 'jeans' })} jeans`);
    return;
  }
  const noun = ACCESSORIES.includes(p.kind) ? p.kind : garmentName({ subcategory: p.kind });
  expect(p.name.startsWith(COLOR_WORDS[p.color]!)).toBe(true);
  expect(p.name.toLowerCase().endsWith(noun.toLowerCase())).toBe(true);
  expect(p.name).toBe(cap(p.name));
}

// ================================================================ KC1.2 · an answer carries at most one card
describe('KC1.2 · one card per answer', () => {
  const good = (k: ReturnType<typeof kit>) => ({ type: 'outfit', pieces: [k.h('olive'), k.h('tee'), k.h('jeans'), k.h('sneakers')], occasion: 'everyday' });
  const KEYS = ['olive', 'tee', 'jeans', 'sneakers'];

  it('KC1.2 · a block whose card is an array of two valid cards gives no card', () => {
    const k = kit(KEYS);
    expect(valid(KEYS)).toBe(true);
    expect(buildCard(good(k), k.input)).not.toBeNull(); // each alone is valid
    const colors = { type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown'] };
    expect(buildCard(colors, k.input)).not.toBeNull();
    expect(buildCard([good(k), colors], k.input)).toBeNull();
    expect(buildCard([good(k), good(k)], k.input)).toBeNull();
  });

  it('KC1.2 · a block with one valid card gives one card object, never an array', () => {
    const k = kit(KEYS);
    const card = buildCard(good(k), k.input);
    expect(Array.isArray(card)).toBe(false);
    expect(card).toEqual({ type: 'outfit', itemIds: KEYS, occasion: 'everyday', needs: [], example: false });
  });

  it('KC1.2 · exists: model blocks of type add or changed never build a card (only code builds those)', () => {
    const k = kit(KEYS);
    expect(buildCard({ type: 'add', piece: { kind: 'jeans', color: 'black' }, outcome: 'added' }, k.input)).toBeNull();
    expect(buildCard({ type: 'add', piece: { kind: 'jeans', color: 'black' }, outcome: 'asked', itemId: null }, k.input)).toBeNull();
    expect(buildCard({ type: 'changed', itemId: 'jeans', undone: true }, k.input)).toBeNull();
    expect(buildCard({ type: 'changed', itemId: 'jeans' }, k.input)).toBeNull();
  });

  it('KC1.2 · exists: a card type the app does not know is no card', () => {
    const k = kit(KEYS);
    expect(buildCard({ type: 'poster' }, k.input)).toBeNull();
    expect(buildCard({ type: 'correct', checkId: 'x' }, k.input)).toBeNull(); // only code builds this one too
    expect(buildCard('outfit', k.input)).toBeNull();
    expect(buildCard(null, k.input)).toBeNull();
  });

  it('KC1.2 · through the pipeline: two cards store the words and no askCard key, one card stores exactly one', async () => {
    const rows = KEYS.map((x) => rowOf(x));
    const colors = { type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown'] };
    const h = await harness(rows, (q, handle) => {
      const outfitBlock = { type: 'outfit', pieces: KEYS.map(handle), occasion: 'everyday' };
      return q.startsWith('Two') ? says('Wear the overshirt open.', { card: [outfitBlock, colors] }) : says('Wear the overshirt open.', { card: outfitBlock });
    });
    const one = await h.run('One card please');
    expect(one.text).toBe('Wear the overshirt open.');
    expect(Array.isArray(one.payload.askCard)).toBe(false);
    expect(one.payload.askCard).toEqual({ type: 'outfit', itemIds: KEYS, occasion: 'everyday', needs: [], example: false });
    const two = await h.run('Two cards please');
    expect(two.text).toBe('Wear the overshirt open.');
    expect('askCard' in two.payload).toBe(false);
  });

  it('KC1.2 · exists: a code-built card (that score is wrong) wins over an outfit the model also proposed', async () => {
    const asOfMs = Date.parse('2026-10-22T12:04:00-04:00');
    const h = await harness([], (_q, handle) => says('I hear you, and there is a button for it.', { card: { type: 'outfit', pieces: ['T1', 'B3', 'S1', 'L2'].map(handle) } }), {
      setup: async (store) => void (await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs })),
    });
    const m = await h.run('That score is wrong.');
    expect((m.payload.askCard as { type: string }).type).toBe('correct');
  });

  it('KC1.2 · a card dropped for a piece that does not exist keeps the words; so does an outfit the rubric refuses', async () => {
    const keys = ['oxford', 'joggers', 'slides'];
    expect(valid(keys)).toBe(false);
    const rows = [...keys, ...KEYS].filter((x, i, a) => a.indexOf(x) === i).map((x) => rowOf(x));
    const h = await harness(rows, (q, handle) => {
      if (q.startsWith('Missing')) return says('Try the loafers.', { card: { type: 'outfit', pieces: [handle('tee'), handle('jeans'), 'P999'] } });
      if (q.startsWith('Valid')) return says('Wear the overshirt open.', { card: { type: 'outfit', pieces: KEYS.map(handle) } });
      return says('Try the oxford.', { card: { type: 'outfit', pieces: keys.map(handle) } });
    });
    const missing = await h.run('Missing piece question');
    expect(missing.text).toBe('Try the loafers.');
    expect('askCard' in missing.payload).toBe(false);
    const refused = await h.run('Refused outfit question');
    expect(refused.text).toBe('Try the oxford.');
    expect('askCard' in refused.payload).toBe(false);
    // the same pipeline does build a card when the block checks out
    const valid_ = await h.run('Valid question');
    expect(valid_.payload.askCard).toEqual({ type: 'outfit', itemIds: KEYS, occasion: 'everyday', needs: [], example: false });
  });
});

// ================================================================ KC2.1 · his pieces first
describe('KC2.1 · his pieces first', () => {
  const KEYS = ['tee', 'jeans', 'sneakers'];

  it.each([
    ['words', { kind: 'jeans', color: 'dark denim' }],
    ['keys', { kind: 'jeans', color: 'denim_dark' }],
  ])('KC2.1 · his dark jeans stand in for a drawn need of the same kind and color family (%s)', (_label, need) => {
    const k = kit(KEYS);
    expect(valid(KEYS)).toBe(true);
    const card = outfit(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('sneakers')], needs: [need] }, k.input));
    expect([...card.itemIds].sort()).toEqual(['jeans', 'sneakers', 'tee']);
    expect(card.needs).toEqual([]);
    expect(card.example).toBe(false);
  });

  it('KC2.1 · the same kind in another color family stays a drawn piece (his jeans are dark denim, the need is black jeans)', () => {
    const k = kit(KEYS);
    const card = outfit(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('sneakers')], needs: [{ kind: 'jeans', color: 'black' }] }, k.input));
    expect([...card.itemIds].sort()).toEqual(['sneakers', 'tee']);
    expect(card.needs).toEqual([{ kind: 'jeans', color: 'black', name: 'Black jeans' }]);
    expect(card.example).toBe(false);
  });

  it('KC2.1 · a need whose slot one of his pieces in the card already holds makes no card', () => {
    const k = kit([...KEYS, 'chinos']);
    expect(valid([...KEYS, 'chinos'])).toBe(true);
    expect(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans'), k.h('sneakers')], needs: [{ kind: 'chinos', color: 'khaki' }] }, k.input)).toBeNull();
    // without the clash the same drawn need is fine
    expect(outfit(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('sneakers')], needs: [{ kind: 'chinos', color: 'khaki' }] }, k.input)).itemIds).toContain('chinos');
  });

  it('KC2.1 · a piece of his in avoid is never used: an outfit naming it gives no card, a need is not met by it', () => {
    const avoid = new Set(['jeans']);
    const k = kit(KEYS, { avoid });
    expect(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans'), k.h('sneakers')] }, k.input)).toBeNull();
    const card = outfit(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('sneakers')], needs: [{ kind: 'jeans', color: 'dark denim' }] }, k.input));
    expect(card.itemIds).not.toContain('jeans');
    expect(card.needs.map(pair)).toEqual(['jeans|denim_dark']);
  });

  it('KC2.1 · a deleted piece and a piece awaiting his answer are never used, and a drawn need is not met by them', () => {
    const { input, h } = kitOver([rowOf('tee'), rowOf('sneakers'), rowOf('jeans', { isDeleted: true }), rowOf('chinos', { maybeSameAs: 'tee' })]);
    expect(buildCard({ type: 'outfit', pieces: [h('tee'), h('sneakers'), h('jeans')] }, input)).toBeNull(); // deleted
    expect(buildCard({ type: 'outfit', pieces: [h('tee'), h('sneakers'), h('chinos')] }, input)).toBeNull(); // awaiting an answer
    const card = outfit(buildCard({ type: 'outfit', pieces: [h('tee'), h('sneakers')], needs: [{ kind: 'jeans', color: 'dark denim' }] }, input));
    expect(card.itemIds).toEqual(['tee', 'sneakers']);
    expect(card.needs.map(pair)).toEqual(['jeans|denim_dark']);
  });

  it('KC2.1 · a drawn piece that is a Starter pick maps to the Starter row (nextBuyFor)', () => {
    expect(nextBuyFor(cardPiece('polo', 'navy')!, null)).toBe('s02');
    expect(nextBuyFor(cardPiece('jeans', 'denim_dark')!, null)).toBe('s05');
    expect(nextBuyFor(cardPiece('watch', 'black')!, null)).toBeNull();
  });
});

// ================================================================ KC2.2 · drawn data in one of the 25 colors
describe('KC2.2 · a piece he does not own is drawn data', () => {
  it('KC2.2 · cardPiece makes the name from code, in the closet\'s noun', () => {
    expect(cardPiece('collared shirt', 'off white')).toEqual({ kind: 'oxford_shirt', color: 'off_white_cream', name: `Off-white ${garmentName({ subcategory: 'oxford_shirt' })}` });
    expect(cardPiece('work_boot', 'black')).toEqual({ kind: 'work_boot', color: 'black', name: 'Black work boots' });
    expect(cardPiece('work boots', 'brown')).toEqual({ kind: 'work_boot', color: 'brown', name: 'Brown work boots' });
    expect(cardPiece('oxford_shirt', 'light blue')!.name).toBe(`Light blue ${garmentName({ subcategory: 'oxford_shirt' })}`);
    expect(cardPiece('watch', 'black')).toEqual({ kind: 'watch', color: 'black', name: 'Black watch' });
    expect(cardPiece('belt', 'brown')).toEqual({ kind: 'belt', color: 'brown', name: 'Brown belt' });
    expect(cardPiece('jeans', 'dark denim')).toEqual({ kind: 'jeans', color: 'denim_dark', name: 'Dark jeans' });
  });

  it('KC2.2 · colorName is the spec\'s word for each of the 24 usable families, and nothing for multicolor or an unknown one', () => {
    for (const f of FAMILIES) expect([f, colorName(f)]).toEqual([f, COLOR_WORDS[f]]);
    expect(FAMILIES).toHaveLength(24);
    expect(colorName('multicolor')).toBeNull();
    expect(colorName('unknown')).toBeNull();
    expect(colorName('chartreuse')).toBeNull();
    expect(colorName('')).toBeNull();
  });

  it('KC2.2 · for every drawable kind and each of the 24 families the name\'s color word is the drawn color', () => {
    let n = 0;
    for (const kind of [...DRAWABLE, ...ACCESSORIES]) {
      for (const family of FAMILIES) {
        const p = cardPiece(kind, family);
        expect([kind, family, p === null]).toEqual([kind, family, false]);
        expect(p!.kind).toBe(kind);
        expect(p!.color).toBe(family);
        expect(Object.keys(FAMILY_HEX)).toContain(p!.color);
        checkName(p!);
        n += 1;
      }
    }
    expect(n).toBe((DRAWABLE.length + ACCESSORIES.length) * 24);
  });

  it('KC2.2 · cardPiece refuses a kind the app cannot draw and a color outside the 24', () => {
    expect(cardPiece('harrington', 'navy')).toBeNull();
    expect(cardPiece('spaceship', 'navy')).toBeNull();
    expect(cardPiece('', 'navy')).toBeNull();
    for (const bad of [undefined, null, 3, {}, []]) expect(cardPiece(bad, 'navy')).toBeNull();
    expect(cardPiece('jeans', 'multicolor')).toBeNull();
    expect(cardPiece('jeans', 'unknown')).toBeNull();
    expect(cardPiece('jeans', 'plaid')).toBeNull();
    expect(cardPiece('jeans', 'chartreuse')).toBeNull();
    for (const bad of [undefined, null, 3, {}, []]) expect(cardPiece('jeans', bad)).toBeNull();
  });

  it('KC2.2 · a kind the app lacks falls to the closest kind of the same slot: "harrington jacket" is a navy jacket', () => {
    expect(cardPiece('harrington jacket', 'navy')).toEqual({ kind: 'field_jacket', color: 'navy', name: 'Navy jacket' });
  });

  it('KC2.2 · slotOfKind and KIND_SLOT cover every kind the closet draws, and each one draws', () => {
    for (const kind of DRAWABLE) {
      const sure = SLOT_OF[kind];
      if (sure) expect([kind, slotOfKind(kind)]).toEqual([kind, sure]);
      else expect([kind, slotOfKind(kind)]).toEqual([kind, expect.stringMatching(/^(top|outer)$/)]);
    }
    for (const kind of ACCESSORIES) expect([kind, slotOfKind(kind)]).toEqual([kind, 'accessory']);
    expect(slotOfKind('harrington')).toBeNull();
    expect(slotOfKind('')).toBeNull();
    expect(Object.keys(KIND_SLOT)).toEqual(expect.arrayContaining([...DRAWABLE, ...ACCESSORIES]));
    const cat: Record<string, string> = { top: 'top', outer: 'outerwear', bottom: 'bottom', shoes: 'footwear' };
    const shape: Record<string, string> = { top: 'top', outer: 'top', bottom: 'bottom', shoes: 'shoe' };
    let drawn = 0;
    for (const [kind, slot] of Object.entries(KIND_SLOT)) {
      if (slot === 'accessory') continue;
      const spec = artSpec({ garment: G(cat[slot]!, kind, 'white'), hex: FAMILY_HEX.white!, art: null, name: kind });
      expect([kind, spec.shape]).toEqual([kind, shape[slot]]);
      expect(spec.flat).toBeTruthy();
      drawn += 1;
    }
    expect(drawn).toBeGreaterThanOrEqual(DRAWABLE.length);
  });

  it('KC2.2 · kindNoun is the closet\'s own noun, lowercase', () => {
    for (const kind of DRAWABLE) expect([kind, kindNoun(kind)]).toEqual([kind, garmentName({ subcategory: kind }).toLowerCase()]);
    for (const kind of ACCESSORIES) expect(kindNoun(kind)).toBe(kind);
  });

  it('KC2.2 · in a built outfit a piece he does not own is data in needs, never in itemIds, and the model\'s own name is ignored', () => {
    const k = kit(['tee', 'jeans']);
    expect(valid(['tee', 'jeans'], [G('footwear', 'work_boot', 'brown')])).toBe(true);
    const card = outfit(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans')], needs: [{ kind: 'work boots', color: 'brown', name: 'Black boots' }] }, k.input));
    expect(card.itemIds).toEqual(['tee', 'jeans']);
    expect(card.needs).toEqual([{ kind: 'work_boot', color: 'brown', name: 'Brown work boots' }]);
    for (const p of card.needs) {
      expect(Object.keys(FAMILY_HEX)).toContain(p.color);
      expect(p.color).not.toBe('multicolor');
    }
  });

  it('KC2.2 · needs.length is the n of "From your closet + n": one drawn piece is 1, two are 2, none is 0', () => {
    const one = kit(['tee', 'jeans']);
    expect(outfit(buildCard({ type: 'outfit', pieces: [one.h('tee'), one.h('jeans')], needs: [{ kind: 'work_boot', color: 'brown' }] }, one.input)).needs).toHaveLength(1);
    const two = kit(['jeans']);
    expect(valid(['jeans'], [G('top', 'tee', 'white'), G('footwear', 'white_leather_sneaker', 'white')])).toBe(true);
    const card = outfit(buildCard({ type: 'outfit', pieces: [two.h('jeans')], needs: [{ kind: 'tee', color: 'white' }, { kind: 'white_leather_sneaker', color: 'white' }] }, two.input));
    expect(card.needs).toHaveLength(2);
    expect(card.example).toBe(false);
    const none = kit(['olive', 'tee', 'jeans', 'sneakers']);
    const all = outfit(buildCard({ type: 'outfit', pieces: ['olive', 'tee', 'jeans', 'sneakers'].map(none.h) }, none.input));
    expect(all.needs).toEqual([]);
    expect(all.example).toBe(false);
  });

  it('KC2.2 · a need that does not resolve (unknown kind, multicolor, no color) drops the whole card', () => {
    const k = kit(['tee', 'jeans']);
    const ok = { type: 'outfit', pieces: [k.h('tee'), k.h('jeans')], needs: [{ kind: 'work boots', color: 'brown' }] };
    expect(buildCard(ok, k.input)).not.toBeNull();
    for (const bad of [{ kind: 'harrington', color: 'brown' }, { kind: 'work boots', color: 'multicolor' }, { kind: 'work boots' }, { color: 'brown' }, 'work boots', null]) {
      expect(buildCard({ ...ok, needs: [bad] }, k.input)).toBeNull();
    }
  });
});

// ================================================================ KC2.3 · an Example when his closet cannot make it
const FLAT_KIND: Readonly<Record<string, string>> = {
  tee: 'tee', polo: 'polo', tank: 'tank_top', crew: 'sweatshirt', quarter_zip: 'quarter_zip', cardigan: 'cardigan', hoodie: 'hoodie', shirt: 'oxford_shirt',
  overshirt: 'overshirt', denim_jacket: 'denim_jacket', bomber: 'bomber', jacket: 'field_jacket', puffer: 'puffer', blazer: 'blazer', coat: 'overcoat',
  jeans: 'jeans', chinos: 'chinos', trousers: 'trousers', cargos: 'cargos', joggers: 'joggers', shorts: 'shorts', sneaker: 'low_profile_sneaker',
  runner: 'retro_runner', work_boot: 'work_boot', chukka: 'suede_chukka', chelsea: 'chelsea_boot', loafer: 'loafer', derby: 'derby', slides: 'slides_sandals',
};

/** The example a look gives, worked out from LOOKS itself: its flat types mapped to kinds, its hexes to families. */
function lookExample(style: string, index: 0 | 1): string[] {
  const look = LOOKS.find((l) => l.style === style)!;
  return look.outfits[index].map((f) => {
    const kind = FLAT_KIND[f.type];
    if (!kind) throw new Error(`no kind for flat ${f.type}`);
    return `${kind}|${nearestFamily(f.color)}`;
  });
}
/** The key of an example's pieces, as a card holds them. */
const keyOf = (pieces: readonly CardPiece[]): string =>
  cardKey({ type: 'outfit', itemIds: [], needs: [...pieces], example: true, occasion: 'everyday' } as unknown as AskCard)!;
const streetwear: Styles = [['streetwear', 1]];

/** The first Starter row for each of top, bottom and shoes in a styles' list, as pieces. */
function starterExample(styles: Styles | null): string[] {
  const list = starterList(styles);
  return (['top', 'bottom', 'shoes'] as const).map((slot) => {
    const g = list.find((e) => e.slot === slot && e.pick)!.pick!.garment;
    return `${String(g.subcategory)}|${String(g.color_family)}`;
  });
}

describe('KC2.3 · Example when his closet cannot make it', () => {
  const needs3 = [{ kind: 'tee', color: 'white' }, { kind: 'jeans', color: 'black' }, { kind: 'work boots', color: 'brown' }];

  it('KC2.3 · an outfit with none of his pieces is an example of 3 or more drawn pieces, same key for the same pieces', () => {
    const k = kit(['olive']); // his one piece is not in the proposal
    expect(valid([], [G('top', 'tee', 'white'), G('bottom', 'jeans', 'black', { leg_shape: 'straight' }), G('footwear', 'work_boot', 'brown')])).toBe(true);
    const raw = { type: 'outfit', pieces: [], needs: needs3, occasion: 'date' };
    const a = outfit(buildCard(raw, k.input));
    expect(a.example).toBe(true);
    expect(a.itemIds).toEqual([]);
    expect(a.occasion).toBe('date');
    expect(a.needs.length).toBeGreaterThanOrEqual(3);
    expect(a.needs.map(pair)).toEqual(starterExample(null)); // no picked looks: the Starter fallback
    expect(a.needs.map(pair)).toEqual(['tee|white', 'jeans|denim_dark', 'white_leather_sneaker|white']);
    expect(a.needs.map(pair)).toEqual(exampleOutfit(null, new Set())!.map(pair));
    for (const p of a.needs) expect(p).toEqual(cardPiece(p.kind, p.color));
    const empty = outfit(buildCard(raw, kit([]).input)); // an empty closet: the same
    expect(empty).toEqual(a);
    expect(cardKey(a as unknown as AskCard)).toBe(cardKey(empty as unknown as AskCard));
    expect(cardKey(a as unknown as AskCard)).toBe(keyOf(a.needs));
  });

  it('KC2.3 · exactly 2 drawn pieces with 3 of his is not an example', () => {
    const his = ['tee', 'crew', 'jeans'];
    const drawn = [{ kind: 'white_leather_sneaker', color: 'white' }, { kind: 'overshirt', color: 'olive' }];
    expect(valid(his, [G('footwear', 'white_leather_sneaker', 'white'), G('outerwear', 'overshirt', 'olive')])).toBe(true);
    const k = kit(his);
    const card = outfit(buildCard({ type: 'outfit', pieces: his.map(k.h), needs: drawn }, k.input));
    expect(card.example).toBe(false);
    expect(card.itemIds).toEqual(his);
    expect(card.needs.map(pair)).toEqual(['white_leather_sneaker|white', 'overshirt|olive']);
  });

  it('KC2.3 · 3 drawn clothing pieces with 1 of his is an example, and his piece is not in it', () => {
    // His one piece is a navy sweater; the example the code picks (the Starter fallback) holds no sweater, so his piece has nowhere to hide.
    const k = kit(['crew']);
    const drawn = [{ kind: 'jeans', color: 'dark denim' }, { kind: 'white_leather_sneaker', color: 'white' }, { kind: 'overshirt', color: 'olive' }];
    expect(valid(['crew'], [G('bottom', 'jeans', 'denim_dark', { leg_shape: 'straight' }), G('footwear', 'white_leather_sneaker', 'white'), G('outerwear', 'overshirt', 'olive')])).toBe(true);
    const card = outfit(buildCard({ type: 'outfit', pieces: [k.h('crew')], needs: drawn }, k.input));
    expect(card.example).toBe(true);
    expect(card.itemIds).toEqual([]);
    expect(JSON.stringify(card)).not.toContain('crew'); // his id appears nowhere on the card
    expect(card.needs.map((p) => p.kind)).not.toContain('sweater'); // nor a piece of his kind
    expect(card.needs.length).toBeGreaterThanOrEqual(3);
  });

  it('KC2.3 · 3 of his pieces with 2 accessories is not an example (accessories do not count toward the 2)', () => {
    const his = ['tee', 'jeans', 'sneakers'];
    const k = kit(his);
    const card = outfit(buildCard({ type: 'outfit', pieces: his.map(k.h), needs: [{ kind: 'watch', color: 'black' }, { kind: 'belt', color: 'brown' }] }, k.input));
    expect(card.example).toBe(false);
    expect(card.itemIds).toEqual(his);
    expect(card.needs.map(pair)).toEqual(['watch|black', 'belt|brown']);
  });

  it('KC2.3 · example is true only on a card with none of his pieces, and itemIds is empty then', () => {
    const k = kit(['olive', 'tee', 'jeans', 'sneakers']);
    const all = outfit(buildCard({ type: 'outfit', pieces: ['olive', 'tee', 'jeans', 'sneakers'].map(k.h) }, k.input));
    expect(all.example).toBe(false);
    expect(all.itemIds.length).toBeGreaterThan(0);
    // A closet that holds none of the needed kinds (his boots are black, the need is brown work boots: another color family, so still drawn, KC2.1).
    const k2 = kit(['olive', 'crew', 'chinos', 'boots']);
    const ex = outfit(buildCard({ type: 'outfit', pieces: [], needs: needs3 }, k2.input));
    expect(ex.example).toBe(true);
    expect(ex.itemIds).toHaveLength(0);
  });

  it('KC2.3 · exampleOutfit: the first picked look\'s first outfit, then its second, then the next fallback', () => {
    expect(lookExample('streetwear', 0)).toEqual(['hoodie|charcoal', 'jeans|black', 'low_profile_sneaker|white']); // the spec's own example
    const first = exampleOutfit(streetwear, new Set())!;
    expect(first.map(pair)).toEqual(lookExample('streetwear', 0));
    expect(first.map((p) => p.kind)).toEqual(['hoodie', 'jeans', 'low_profile_sneaker']);
    expect(first.map((p) => p.color)).toEqual(['hoodie', 'jeans', 'low_profile_sneaker'].map((_, i) => nearestFamily(LOOKS.find((l) => l.style === 'streetwear')!.outfits[0][i]!.color)));
    for (const p of first) expect(p).toEqual(cardPiece(p.kind, p.color));
    const second = exampleOutfit(streetwear, new Set([keyOf(first)]))!;
    expect(second.map(pair)).toEqual(lookExample('streetwear', 1));
    expect(second.map(pair)).not.toEqual(first.map(pair));
    const third = exampleOutfit(streetwear, new Set([keyOf(first), keyOf(second)]));
    // both of the look's outfits shown, no other picked look: the Starter catalog is next (spec KC2.3), and when that too is shown, no card
    expect(third!.map(pair)).toEqual(starterExample(streetwear));
    expect(exampleOutfit(streetwear, new Set([keyOf(first), keyOf(second), keyOf(third!)]))).toBeNull();
  });

  it('KC2.3 · exampleOutfit: with several picked looks the first pick\'s outfits come first', () => {
    const styles: Styles = [['workwear', 1], ['streetwear', 1]];
    const w1 = exampleOutfit(styles, new Set())!;
    expect(w1.map(pair)).toEqual(lookExample('workwear', 0));
    const w2 = exampleOutfit(styles, new Set([keyOf(w1)]))!;
    expect(w2.map(pair)).toEqual(lookExample('workwear', 1));
    const s1 = exampleOutfit(styles, new Set([keyOf(w1), keyOf(w2)]))!;
    expect(s1.map(pair)).toEqual(lookExample('streetwear', 0));
  });

  it('KC2.3 · exampleOutfit: no picked looks gives the first Starter rows for top, bottom and shoes', () => {
    const p = exampleOutfit([], new Set())!;
    expect(p.map(pair)).toEqual(['tee|white', 'jeans|denim_dark', 'white_leather_sneaker|white']);
    expect(exampleOutfit(null, new Set())!.map(pair)).toEqual(p.map(pair));
    for (const x of p) expect(x).toEqual(cardPiece(x.kind, x.color));
    expect(exampleOutfit(null, new Set([keyOf(p)]))).toBeNull(); // nothing else fresh to give
  });

  it('KC2.3 · every look\'s examples are valid drawn pieces made from LOOKS', () => {
    expect(LOOKS.length).toBeGreaterThanOrEqual(7);
    for (const look of LOOKS) {
      const a = exampleOutfit([[look.style, 1]], new Set())!;
      expect([look.style, a.map(pair)]).toEqual([look.style, lookExample(look.style, 0)]);
      const b = exampleOutfit([[look.style, 1]], new Set([keyOf(a)]))!;
      expect([look.style, b.map(pair)]).toEqual([look.style, lookExample(look.style, 1)]);
      for (const p of [...a, ...b]) expect(p).toEqual(cardPiece(p.kind, p.color));
    }
  });

  it('KC2.3 · exampleOutfit never uses a kind in avoid', () => {
    const second = exampleOutfit(streetwear, new Set(), new Set(['hoodie']))!;
    expect(second.map(pair)).toEqual(lookExample('streetwear', 1));
    expect(second.map((p) => p.kind)).not.toContain('hoodie');
  });

  it('KC2.3 · an example already shown today is not repeated when a fresh one exists (KC2.6)', () => {
    const raw = { type: 'outfit', pieces: [], needs: needs3 };
    const k = kit([], { styles: streetwear });
    const a = outfit(buildCard(raw, k.input));
    expect(a.needs.map(pair)).toEqual(lookExample('streetwear', 0));
    const b = outfit(buildCard(raw, { ...k.input, shownToday: new Set([keyOf(a.needs)]) }));
    expect(b.needs.map(pair)).toEqual(lookExample('streetwear', 1));
    expect(b.example).toBe(true);
  });
});

// ================================================================ KC2.4 · an options card
describe('KC2.4 · options: 2 or 3, one slot, never the replaced piece, his first', () => {
  const KEYS = ['bomber', 'denimJkt', 'oliveSweater'];
  const choreCoat = { kind: 'chore_coat', color: 'charcoal' };
  const puffer = { kind: 'puffer', color: 'black' };

  it('KC2.4 · his denim jacket first, then the two drawn pieces in the model\'s order', () => {
    const k = kit(KEYS);
    const card = buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [k.h('denimJkt')], needs: [choreCoat, puffer] }, k.input);
    expect(card).toEqual({
      type: 'options', slot: 'outer',
      options: [{ itemId: 'denimJkt' }, { piece: { kind: 'chore_coat', color: 'charcoal', name: 'Charcoal chore coat' } }, { piece: { kind: 'puffer', color: 'black', name: 'Black puffer' } }],
    });
  });

  it('KC2.4 · a fourth entry is cut: 3 kept, his first', () => {
    const k = kit(KEYS);
    const card = options(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [k.h('denimJkt')], needs: [choreCoat, puffer, { kind: 'overcoat', color: 'navy' }] }, k.input));
    expect(card.options.map(entryName)).toEqual(['denimJkt', 'piece:chore_coat', 'piece:puffer']);
  });

  it('KC2.4 · dropped: the replaced piece, a drawn copy of it, a copy of one he keeps, and anything in another slot', () => {
    const k = kit(KEYS);
    const raw = {
      type: 'options', replaces: k.h('bomber'),
      pieces: [k.h('bomber'), k.h('denimJkt'), k.h('oliveSweater')],
      needs: [{ kind: 'bomber', color: 'tan' }, { kind: 'denim jacket', color: 'mid denim' }, { kind: 'sweater', color: 'navy' }, puffer, choreCoat],
    };
    const card = options(buildCard(raw, k.input));
    expect(card.slot).toBe('outer');
    expect(card.options.map(entryName)).toEqual(['denimJkt', 'piece:puffer', 'piece:chore_coat']);
  });

  it('KC2.4 · one entry left, or none, gives no card (two entries are enough)', () => {
    const k = kit(KEYS);
    expect(options(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [k.h('denimJkt')], needs: [puffer] }, k.input)).options.map(entryName)).toEqual(['denimJkt', 'piece:puffer']);
    expect(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [k.h('denimJkt')], needs: [{ kind: 'bomber', color: 'tan' }] }, k.input)).toBeNull();
    expect(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [k.h('bomber')], needs: [] }, k.input)).toBeNull();
    expect(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [], needs: [] }, k.input)).toBeNull();
  });

  it('KC2.4 · the slot is the replaced piece\'s slot even when the model says another', () => {
    const k = kit(KEYS);
    const card = options(buildCard({ type: 'options', slot: 'top', replaces: k.h('bomber'), pieces: [k.h('denimJkt')], needs: [puffer] }, k.input));
    expect(card.slot).toBe('outer');
    expect(card.options.map(entryName)).toEqual(['denimJkt', 'piece:puffer']);
  });

  it('KC2.4 · with no piece replaced the model\'s slot is used; a slot that is not one gives no card', () => {
    const k = kit(KEYS);
    const card = options(buildCard({ type: 'options', slot: 'outer', pieces: [k.h('denimJkt'), k.h('bomber')], needs: [puffer] }, k.input));
    expect(card.slot).toBe('outer');
    expect(card.options.map(entryName)).toEqual(['denimJkt', 'bomber', 'piece:puffer']);
    expect(buildCard({ type: 'options', slot: 'hat', pieces: [k.h('denimJkt'), k.h('bomber')], needs: [puffer] }, k.input)).toBeNull();
  });

  it('KC2.4 · code orders his pieces first but never adds one the model did not name', () => {
    const k = kit(KEYS); // his denim jacket is in the closet but not in the model's list
    const card = options(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [], needs: [puffer, choreCoat] }, k.input));
    expect(card.options.map(entryName)).toEqual(['piece:puffer', 'piece:chore_coat']);
  });

  it('KC2.4 · a piece in avoid is not an entry', () => {
    const k = kit(KEYS, { avoid: new Set(['denimJkt']) });
    const card = options(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [k.h('denimJkt')], needs: [puffer, choreCoat] }, k.input));
    expect(card.options.map(entryName)).toEqual(['piece:puffer', 'piece:chore_coat']);
  });

  it('KC2.4 · through the pipeline: a card of 3 is stored, and with fewer than 2 left the words still answer with no card', async () => {
    const rows = KEYS.map((x) => rowOf(x));
    const h = await harness(rows, (q, handle) => {
      const block = q.startsWith('Few')
        ? { type: 'options', replaces: handle('bomber'), pieces: [handle('denimJkt')], needs: [{ kind: 'bomber', color: 'tan' }] }
        : { type: 'options', replaces: handle('bomber'), pieces: [handle('denimJkt')], needs: [choreCoat, puffer] };
      return says('Try the denim jacket.', { card: block });
    });
    const ok = await h.run('Another jacket than the bomber?');
    expect((ok.payload.askCard as Options).options.map(entryName)).toEqual(['denimJkt', 'piece:chore_coat', 'piece:puffer']);
    const few = await h.run('Few left question');
    expect(few.text).toBe('Try the denim jacket.');
    expect('askCard' in few.payload).toBe(false);
  });
});

// ================================================================ KC2.5 · the question asked
describe('KC2.5 · every entry is in the asked slot and none is the piece he asked to replace', () => {
  const KEYS = ['bomber', 'denimJkt', 'oliveSweater', 'oxford', 'tee', 'jeans', 'chinos', 'boots', 'sneakers'];
  const SLOT_OF_KEY: Record<string, string> = { bomber: 'outer', denimJkt: 'outer', oliveSweater: 'top', oxford: 'top', tee: 'top', jeans: 'bottom', chinos: 'bottom', boots: 'shoes', sneakers: 'shoes' };
  const n = (kind: string, color: string) => ({ kind, color });

  interface Row { label: string; slot: string; replaces?: string; pieces: string[]; needs: { kind: string; color: string }[]; expect: string[] }
  const TABLE: Row[] = [
    { label: 'an alternative to the tan bomber', slot: 'outer', replaces: 'bomber', pieces: ['denimJkt'], needs: [n('puffer', 'black')], expect: ['denimJkt', 'piece:puffer'] },
    { label: 'an alternative to the olive sweater', slot: 'top', replaces: 'oliveSweater', pieces: ['oxford', 'tee'], needs: [n('hoodie', 'grey')], expect: ['oxford', 'tee', 'piece:hoodie'] },
    { label: 'an alternative to the dark jeans', slot: 'bottom', replaces: 'jeans', pieces: ['chinos'], needs: [n('cargos', 'olive')], expect: ['chinos', 'piece:cargos'] },
    { label: 'an alternative to the black work boots', slot: 'shoes', replaces: 'boots', pieces: ['sneakers'], needs: [n('loafer', 'brown')], expect: ['sneakers', 'piece:loafer'] },
    { label: 'a jacket, not a sweater, with a sweater and a shirt in the list', slot: 'outer', pieces: ['denimJkt', 'bomber', 'oliveSweater', 'oxford'], needs: [n('puffer', 'black')], expect: ['denimJkt', 'bomber', 'piece:puffer'] },
    { label: 'a jacket, with a mixed list of four slots', slot: 'outer', pieces: ['denimJkt', 'oliveSweater', 'jeans', 'sneakers'], needs: [n('chore_coat', 'charcoal'), n('hoodie', 'grey'), n('cargos', 'olive'), n('loafer', 'brown')], expect: ['denimJkt', 'piece:chore_coat'] },
    { label: 'the replaced piece listed again by the model', slot: 'outer', replaces: 'bomber', pieces: ['bomber', 'denimJkt'], needs: [n('puffer', 'black')], expect: ['denimJkt', 'piece:puffer'] },
    { label: 'a drawn piece that is the replaced piece', slot: 'outer', replaces: 'bomber', pieces: ['denimJkt'], needs: [n('bomber', 'tan'), n('puffer', 'black')], expect: ['denimJkt', 'piece:puffer'] },
    { label: 'a drawn copy of the replaced sweater', slot: 'top', replaces: 'oliveSweater', pieces: ['oxford'], needs: [n('sweater', 'olive'), n('polo', 'navy')], expect: ['oxford', 'piece:polo'] },
  ];

  it('KC2.5 · 100% of the table gives a card in the asked slot, with the entries expected', () => {
    expect(TABLE.length).toBeGreaterThanOrEqual(8);
    let passed = 0;
    for (const r of TABLE) {
      const k = kit(KEYS);
      const card = buildCard({ type: 'options', ...(r.replaces ? { replaces: k.h(r.replaces) } : { slot: r.slot }), pieces: r.pieces.map(k.h), needs: r.needs }, k.input) as unknown as Options | null;
      if (card && card.type === 'options' && card.slot === r.slot && card.options.map(entryName).join(',') === r.expect.join(',')) passed += 1;
    }
    expect(passed).toBe(TABLE.length);
  });

  it.each(TABLE)('KC2.5 · $label', (r) => {
    const k = kit(KEYS);
    const card = options(buildCard({ type: 'options', ...(r.replaces ? { replaces: k.h(r.replaces) } : { slot: r.slot }), pieces: r.pieces.map(k.h), needs: r.needs }, k.input));
    expect(card.slot).toBe(r.slot);
    expect(card.options.map(entryName)).toEqual(r.expect);
    for (const e of card.options) {
      const slot = 'itemId' in e ? SLOT_OF_KEY[e.itemId] : SLOT_OF[e.piece.kind];
      expect(slot).toBe(r.slot);
      if (r.replaces) {
        expect('itemId' in e && e.itemId === r.replaces).toBe(false);
        const gone = rowOf(r.replaces).garment;
        if ('piece' in e) expect(e.piece.kind === gone.subcategory && e.piece.color === gone.color_family).toBe(false);
      }
    }
  });
});

// ================================================================ KC2.6 · the same outfit is not shown twice in one chat day
describe('KC2.6 · no repeat on one chat day', () => {
  const KEYS = ['olive', 'tee', 'jeans', 'sneakers'];
  const msg = (id: string, at: string, card: unknown, role: ChatMessage['role'] = 'stylist'): ChatMessage => ({
    id, createdAt: Date.parse(at), role, kind: 'text', text: 'x', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [],
    payload: card === undefined ? {} : { answerTo: 'q', askCard: card },
  });
  const o = (ids: string[], more: Record<string, unknown> = {}) => ({ type: 'outfit', itemIds: ids, occasion: 'everyday', needs: [], example: false, ...more });

  it('KC2.6 · cardKey is the same for the same pieces in any order and different when one piece differs', () => {
    const pieces = [cardPiece('jeans', 'black')!, cardPiece('watch', 'brown')!];
    const a = o(['x2', 'x1'], { needs: pieces }) as unknown as AskCard;
    const b = o(['x1', 'x2'], { needs: [...pieces].reverse() }) as unknown as AskCard;
    expect(cardKey(a)).toBe(['jeans|black', 'watch|brown', 'x1', 'x2'].sort().join('+'));
    expect(cardKey(b)).toBe(cardKey(a));
    expect(cardKey(o(['x1', 'x3'], { needs: pieces }) as unknown as AskCard)).not.toBe(cardKey(a));
    expect(cardKey(o(['x1', 'x2'], { needs: [cardPiece('jeans', 'navy')!, pieces[1]!] }) as unknown as AskCard)).not.toBe(cardKey(a));
    expect(cardKey(o(['x1', 'x2'], { needs: [pieces[0]!] }) as unknown as AskCard)).not.toBe(cardKey(a));
  });

  it('KC2.6 · cardKey is null for every card that is not an outfit', () => {
    const cards = [
      { type: 'check', occasion: 'everyday' }, { type: 'ask', question: 'Which?', options: ['a', 'b', 'Not sure'] }, { type: 'buy', starterId: 's02', gain: 12 },
      { type: 'link', itemId: 'x' }, { type: 'correct', checkId: 'x' },
      { type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { itemId: 'b' }] }, { type: 'colors', about: 'general', goesWith: 'olive', families: ['white', 'tan_camel', 'brown'] },
    ];
    for (const c of cards) expect([c.type, cardKey(c as unknown as AskCard)]).toEqual([c.type, null]);
  });

  it('KC2.6 · shownKeysToday holds the keys of today\'s stored outfit cards and none from yesterday', () => {
    const today = dayKey(NOW, US_EASTERN);
    const A = o(['a', 'b', 'c']);
    const B = o(['d', 'e', 'f']);
    const C = o(['g', 'h', 'i']);
    const D = o(['j', 'k', 'l']);
    const E = o([], { example: true, needs: [cardPiece('tee', 'white')!, cardPiece('jeans', 'black')!, cardPiece('loafer', 'brown')!] });
    const chat = [
      msg('A', '2026-10-22T10:00:00-04:00', A), msg('B', '2026-10-21T20:00:00-04:00', B), msg('C', '2026-10-22T03:59:00-04:00', C), msg('D', '2026-10-22T04:00:00-04:00', D),
      msg('E', '2026-10-22T11:00:00-04:00', E), msg('F', '2026-10-22T11:30:00-04:00', { type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { itemId: 'b' }] }),
      msg('G', '2026-10-22T11:45:00-04:00', undefined), msg('H', '2026-10-22T11:50:00-04:00', o(['m', 'n', 'p']), 'user'),
    ];
    const keys = shownKeysToday(chat, today, US_EASTERN);
    expect(keys).toEqual(new Set([cardKey(A as unknown as AskCard), cardKey(D as unknown as AskCard), cardKey(E as unknown as AskCard)]));
    expect(keys.has(cardKey(B as unknown as AskCard)!)).toBe(false);
    expect(keys.has(cardKey(C as unknown as AskCard)!)).toBe(false); // 03:59 belongs to the earlier chat day
    expect(shownKeysToday(chat, '2026-10-21', US_EASTERN)).toEqual(new Set([cardKey(B as unknown as AskCard), cardKey(C as unknown as AskCard)]));
    expect(shownKeysToday([], today, US_EASTERN)).toEqual(new Set());
  });

  it('KC2.6 · buildCard of an outfit already shown today gives no card; another day, or one piece different, builds', () => {
    const k = kit(KEYS);
    const raw = { type: 'outfit', pieces: KEYS.map(k.h), occasion: 'everyday' };
    const built = buildCard(raw, k.input)!;
    const key = cardKey(built)!;
    expect(typeof key).toBe('string');
    expect(buildCard(raw, { ...k.input, shownToday: new Set([key]) })).toBeNull();
    expect(buildCard(raw, { ...k.input, shownToday: new Set() })).toEqual(built); // yesterday's key is not in today's set
    const reordered = { ...raw, pieces: [...raw.pieces].reverse() };
    expect(buildCard(reordered, { ...k.input, shownToday: new Set([key]) })).toBeNull(); // order is not a different outfit
    const other = kit(['olive', 'oxford', 'jeans', 'sneakers']);
    expect(buildCard({ type: 'outfit', pieces: ['olive', 'oxford', 'jeans', 'sneakers'].map(other.h) }, { ...other.input, shownToday: new Set([key]) })).not.toBeNull();
  });

  it('KC2.6 · options, colors and buy cards are not blocked by the repeat key', () => {
    const k = kit(['bomber', 'denimJkt']);
    const shownToday = new Set(['anything', cardKey(o(['bomber', 'denimJkt']) as unknown as AskCard)!]);
    expect(buildCard({ type: 'options', replaces: k.h('bomber'), pieces: [k.h('denimJkt')], needs: [{ kind: 'puffer', color: 'black' }] }, { ...k.input, shownToday })).not.toBeNull();
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown'] }, { ...k.input, shownToday })).not.toBeNull();
  });

  it('KC2.6 · askedAgain: again, same one or outfit, repeat', () => {
    for (const q of ['show me that outfit again', 'Same outfit please', 'show the same one', 'Repeat that', 'Again?']) expect([q, askedAgain(q)]).toEqual([q, true]);
    for (const q of ['What goes with my olive overshirt?', 'Shoes for tonight?', 'I wore the same shirt yesterday', 'Is it against the dress code?', 'He repeated himself']) expect([q, askedAgain(q)]).toEqual([q, false]);
  });

  it('KC2.6 · through prepare: the same outfit twice in a day gets no card the second time; "again" builds it; the next day builds', async () => {
    const rows = KEYS.map((x) => rowOf(x));
    const h = await harness(rows, (_q, handle) => says('Wear the overshirt open.', { card: { type: 'outfit', pieces: KEYS.map(handle), occasion: 'everyday' } }));
    const first = await h.run('What goes with my olive overshirt?');
    const firstCard = first.payload.askCard as Outfit;
    expect(firstCard).toEqual({ type: 'outfit', itemIds: KEYS, occasion: 'everyday', needs: [], example: false });
    const second = await h.run('What goes with my olive overshirt?');
    expect(second.text).toBe('Wear the overshirt open.');
    expect('askCard' in second.payload).toBe(false);
    const again = await h.run('Show me that outfit again');
    expect(again.payload.askCard).toEqual(firstCard);
    h.clock.set(NOW + 24 * 3_600_000);
    const tomorrow = await h.run('What goes with my olive overshirt?');
    expect(tomorrow.payload.askCard).toEqual(firstCard);
  });

  it('KC2.6 · a card that was dropped earlier left no row, so it blocks nothing', async () => {
    const rows = KEYS.map((x) => rowOf(x));
    const h = await harness(rows, (q, handle) => says('Wear the overshirt open.', {
      card: { type: 'outfit', pieces: q.startsWith('First') ? [handle('tee'), handle('jeans'), 'P999'] : KEYS.map(handle), occasion: 'everyday' },
    }));
    const dropped = await h.run('First question');
    expect('askCard' in dropped.payload).toBe(false);
    const built = await h.run('Second question');
    expect(built.payload.askCard).toEqual({ type: 'outfit', itemIds: KEYS, occasion: 'everyday', needs: [], example: false });
  });
});

// ================================================================ KC2.9 · 3 to 5 clothing tiles plus up to 2 accessories, accessories last
describe('KC2.9 · clothing 3 to 5, accessories up to 2, accessories last', () => {
  const FOUR = ['olive', 'tee', 'jeans', 'sneakers'];
  const FIVE = ['tee', 'crew', 'jeans', 'sneakers', 'olive'];
  const watch = { kind: 'watch', color: 'black' };
  const belt = { kind: 'belt', color: 'brown' };
  const cap_ = { kind: 'cap', color: 'navy' };

  it('KC2.9 · 4 clothing pieces and 2 accessories build, accessories last in the model\'s order', () => {
    const k = kit(FOUR);
    expect(valid(FOUR)).toBe(true);
    const card = outfit(buildCard({ type: 'outfit', pieces: FOUR.map(k.h), needs: [watch, belt] }, k.input));
    expect(card.itemIds).toEqual(FOUR);
    expect(card.needs.map(pair)).toEqual(['watch|black', 'belt|brown']);
    expect(card.example).toBe(false);
  });

  it('KC2.9 · an accessory the model lists before the clothing still comes last', () => {
    const k = kit(['tee', 'jeans']);
    expect(valid(['tee', 'jeans'], [G('footwear', 'white_leather_sneaker', 'white')])).toBe(true);
    const card = outfit(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans')], needs: [watch, { kind: 'white_leather_sneaker', color: 'white' }, belt] }, k.input));
    expect(card.needs.map(pair)).toEqual(['white_leather_sneaker|white', 'watch|black', 'belt|brown']);
    expect(card.itemIds).toEqual(['tee', 'jeans']);
  });

  it('KC2.9 · two clothing pieces give no card, accessories or not', () => {
    const k = kit(['tee', 'jeans']);
    expect(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans')] }, k.input)).toBeNull();
    expect(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans')], needs: [watch, belt] }, k.input)).toBeNull();
    // a third clothing piece, drawn, makes it a card
    expect(buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans')], needs: [{ kind: 'white_leather_sneaker', color: 'white' }, watch, belt] }, k.input)).not.toBeNull();
  });

  it('KC2.9 · six clothing pieces give no card', () => {
    const six = ['tee', 'crew', 'oxford', 'jeans', 'sneakers', 'olive'];
    expect(valid(six)).toBe(true);
    const k = kit(six);
    expect(buildCard({ type: 'outfit', pieces: six.map(k.h) }, k.input)).toBeNull();
    const five = kit(FIVE);
    expect(valid(FIVE, [G('footwear', 'work_boot', 'brown')])).toBe(true);
    expect(buildCard({ type: 'outfit', pieces: FIVE.map(five.h), needs: [{ kind: 'work_boot', color: 'brown' }] }, five.input)).toBeNull(); // 5 his + 1 drawn
  });

  it('KC2.9 · three accessories, or two of one kind, give no card', () => {
    const k = kit(FOUR);
    expect(buildCard({ type: 'outfit', pieces: FOUR.map(k.h), needs: [watch, belt, cap_] }, k.input)).toBeNull();
    expect(buildCard({ type: 'outfit', pieces: FOUR.map(k.h), needs: [watch, { kind: 'watch', color: 'brown' }] }, k.input)).toBeNull();
    expect(buildCard({ type: 'outfit', pieces: FOUR.map(k.h), needs: [watch, belt] }, k.input)).not.toBeNull();
  });

  it.each([
    ['no shoes', ['tee', 'jeans', 'olive'], { kind: 'white_leather_sneaker', color: 'white' }],
    ['no top', ['olive', 'jeans', 'sneakers'], { kind: 'tee', color: 'white' }],
    ['no bottom', ['tee', 'olive', 'sneakers'], { kind: 'jeans', color: 'black' }],
  ])('KC2.9 · %s, his or drawn, gives no card', (_label, keys, missing) => {
    expect(valid(keys)).toBe(true);
    const k = kit(keys);
    expect(buildCard({ type: 'outfit', pieces: keys.map(k.h) }, k.input)).toBeNull();
    // the same outfit with the missing piece drawn is a card
    const card = outfit(buildCard({ type: 'outfit', pieces: keys.map(k.h), needs: [missing] }, k.input));
    expect(card.needs.map(pair)).toEqual([pair(cardPiece(missing.kind, missing.color)!)]);
  });

  it('KC2.9 · 5 clothing pieces and 2 accessories build, 7 tiles', () => {
    expect(valid(FIVE)).toBe(true);
    const k = kit(FIVE);
    const card = outfit(buildCard({ type: 'outfit', pieces: FIVE.map(k.h), needs: [watch, belt] }, k.input));
    expect(card.itemIds).toEqual(FIVE);
    expect(card.needs.map(pair)).toEqual(['watch|black', 'belt|brown']);
    expect(card.itemIds.length + card.needs.length).toBe(7);
  });

  it('KC2.9 · 3 clothing pieces and no accessories build (the old 3 to 5 rule stays)', () => {
    const three = ['tee', 'jeans', 'sneakers'];
    expect(valid(three)).toBe(true);
    const k = kit(three);
    expect(buildCard({ type: 'outfit', pieces: three.map(k.h) }, k.input)).toEqual({ type: 'outfit', itemIds: three, occasion: 'everyday', needs: [], example: false });
  });

  it('KC2.9 · an accessory is never in itemIds and never counted as clothing', () => {
    const k = kit(['tee', 'jeans']);
    const card = buildCard({ type: 'outfit', pieces: [k.h('tee'), k.h('jeans')], needs: [{ kind: 'beanie', color: 'grey' }, { kind: 'white_leather_sneaker', color: 'white' }] }, k.input);
    const c = outfit(card);
    expect(c.itemIds).toEqual(['tee', 'jeans']);
    expect(c.needs.map((p) => slotOfKind(p.kind))).toEqual(['shoes', 'accessory']);
  });
});

// ================================================================ the card's side of the plain checks
describe('KC2.2 · colors cards (the card side of KC3.3), buy cards and what they hand to the views', () => {
  const k = kit(['tee', 'jeans']);
  const allowed = new Set(['white', 'light_blue', 'tan_camel', 'brown']);

  it('KC2.2 · a colors card about his piece: 2 or 3 families, the kind from the piece, with its itemId', () => {
    const card = buildCard({ type: 'colors', piece: k.h('tee'), colors: ['light blue', 'tan'] }, k.input) as unknown as Colors;
    expect(card).toEqual({ type: 'colors', about: 'piece', kind: 'tee', itemId: 'tee', families: ['light_blue', 'tan_camel'] });
    expect(buildCard({ type: 'colors', piece: k.h('tee'), colors: ['light blue'] }, k.input)).toBeNull();
    expect(buildCard({ type: 'colors', piece: k.h('tee'), colors: ['light blue', 'tan', 'brown', 'olive'] }, k.input)).toBeNull();
    expect(buildCard({ type: 'colors', piece: k.h('tee'), colors: ['light blue', 'tan', 'brown'] }, k.input)).not.toBeNull();
  });

  it('KC2.2 · a colors card about a kind he does not own: the kind from the words, no itemId', () => {
    const card = buildCard({ type: 'colors', piece: 'collared shirt', colors: ['light blue', 'tan'] }, k.input) as unknown as Colors;
    expect(card).toEqual({ type: 'colors', about: 'piece', kind: 'oxford_shirt', families: ['light_blue', 'tan_camel'] });
  });

  it('KC2.2 · a general colors card: goesWith and 3 to 5 families', () => {
    const card = buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown'] }, k.input) as unknown as Colors;
    expect(card).toEqual({ type: 'colors', about: 'general', goesWith: 'olive', families: ['white', 'tan_camel', 'brown'] });
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan'] }, k.input)).toBeNull();
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown', 'navy', 'grey', 'black'] }, k.input)).toBeNull();
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown', 'navy', 'grey'] }, k.input)).not.toBeNull();
  });

  it('KC2.2 · with an allowed set a color outside it makes no card; goesWith is exempt; no set means no check', () => {
    const withSet = { ...k.input, allowedColors: allowed };
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown'] }, withSet)).toEqual({ type: 'colors', about: 'general', goesWith: 'olive', families: ['white', 'tan_camel', 'brown'] });
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'navy'] }, withSet)).toBeNull();
    expect(buildCard({ type: 'colors', piece: k.h('tee'), colors: ['light blue', 'olive'] }, withSet)).toBeNull();
    expect(buildCard({ type: 'colors', piece: k.h('tee'), colors: ['light blue', 'tan'] }, withSet)).not.toBeNull();
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'navy'] }, { ...k.input, allowedColors: null })).not.toBeNull();
    expect(buildCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'navy'] }, k.input)).not.toBeNull();
  });

  it('KC2.2 · colorPieces: one drawn piece per family, its name made from the color word', () => {
    const card = buildCard({ type: 'colors', piece: k.h('tee'), colors: ['light blue', 'tan'] }, k.input)!;
    const pieces = colorPieces(card as Extract<AskCard, { type: 'colors' }>);
    expect(pieces.map(pair)).toEqual(['tee|light_blue', 'tee|tan_camel']);
    expect(pieces.map((p) => p.name)).toEqual([`Light blue ${garmentName({ subcategory: 'tee' })}`, `Tan ${garmentName({ subcategory: 'tee' })}`]);
  });

  describe('on the full scenario', () => {
    async function scenario() {
      const store = createMemoryStore();
      const clock = manualClock(NOW, US_EASTERN);
      await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:04:00-04:00') });
      const snap = await loadStylistSnapshot(store, clock);
      const ctx = buildStylistContext(snap, 'q');
      return { handles: ctx.handles, closet: snap.closet, checks: snap.checks, styles: snap.profile?.styles ?? null, starterMarks: [] as string[], gate: GATE };
    }

    it('KC2.2 · a buy card may carry a why of at most 90 characters that passes the gate; otherwise the card keeps and the why goes', async () => {
      const input = await scenario();
      const why = 'It works with both of your chinos.';
      expect(checkSentence(why, GATE)).toBeNull();
      // The gain is scoring-derived (it moves when the scoring version does), so it is read from the same call without a why.
      const bare = buildCard({ type: 'buy', kind: 'polo', shade: 'navy' }, input) as unknown as Buy;
      expect(bare.type).toBe('buy');
      expect(bare.starterId).toBe('s02');
      expect(typeof bare.gain).toBe('number');
      expect(bare.gain as number).toBeGreaterThan(0);
      expect(Object.keys(bare).sort()).toEqual(['gain', 'starterId', 'type']);
      expect(buildCard({ type: 'buy', kind: 'polo', shade: 'navy', why }, input)).toEqual({ ...bare, why });
      const ninety = 'It works with both pairs of chinos and the jeans you have, and it keeps every outfit easy.';
      expect(ninety).toHaveLength(90);
      expect(checkSentence(ninety, GATE)).toBeNull();
      expect((buildCard({ type: 'buy', kind: 'polo', shade: 'navy', why: ninety }, input) as unknown as Buy).why).toBe(ninety);
      const over = 'It works with both pairs of chinos and the jeans you have, and it keeps every outfit clean.';
      expect(over).toHaveLength(91);
      expect(checkSentence(over, GATE)).toBeNull();
      expect(buildCard({ type: 'buy', kind: 'polo', shade: 'navy', why: over }, input)).toEqual(bare);
      expect(buildCard({ type: 'buy', kind: 'polo', shade: 'navy', why: 'Nike makes a good one.' }, input)).toEqual(bare);
    });

    it('KC2.2 · buyPiece draws the Starter pick; no pick or an unknown row draws nothing', () => {
      expect(buyPiece({ type: 'buy', starterId: 's02', gain: 12 })).toEqual({ kind: 'polo', color: 'navy', name: 'Navy polo' });
      expect(buyPiece({ type: 'buy', starterId: 's05', gain: null })).toEqual({ kind: 'jeans', color: 'denim_dark', name: 'Dark jeans' });
      expect(buyPiece({ type: 'buy', starterId: 's12', gain: null })).toBeNull(); // the belt has no pick
      expect(buyPiece({ type: 'buy', starterId: 's999', gain: null })).toBeNull();
    });
  });
});

describe('KC1.2 · the prompt version moves with the closing format', () => {
  it('KC1.2 · PROMPT_VERSION is 5 or more', () => {
    expect(PROMPT_VERSION).toBeGreaterThanOrEqual(5);
  });

  it('KC1.2 · the closing format the model is sent offers options, colors and followUps, and never offers add or changed', () => {
    for (const part of [CLOSING_FORMAT, systemPrompt('general')]) {
      expect(part).toContain('"followUps"');
      expect(part).toContain('{"type":"options"');
      expect(part).toContain('{"type":"colors"');
      expect(part).toContain('{"type":"outfit"');
      expect(part).not.toContain('{"type":"add"');
      expect(part).not.toContain('{"type":"changed"');
    }
  });
});
