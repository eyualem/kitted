// T102 · KC1.5: every card is rebuilt in Past chats from what was stored, and Past chats never show a live button.
// Written before the code (tasks/T102/TESTING.md). Pure: stored payloads, closets built from named pieces.
import { G } from '@kitted/core';
import {
  cardControls, cardKey, linkedPiece, optionsNow, outfitNow as realOutfitNow, storedCard, type AskCard, type CardPiece,
} from '@/features/ask/cards';
import type { ClosetItemRow } from '@/data/types';
import { rowOf } from '@/testing/kitCardsHelpers';

/** outfitNow with the two fields T102 adds to its result in its type. */
type Now = { items: ClosetItemRow[]; needs: CardPiece[]; example: boolean; gone: boolean };
const outfitNow = (c: Extract<AskCard, { type: 'outfit' }>, closet: readonly ClosetItemRow[]) => realOutfitNow(c, closet) as unknown as Now;

const TEE: CardPiece = { kind: 'tee', color: 'white', name: 'White tee' };
const JEANS: CardPiece = { kind: 'jeans', color: 'black', name: 'Black jeans' };
const SNEAKERS: CardPiece = { kind: 'white_leather_sneaker', color: 'white', name: 'White leather sneakers' };
const BOOTS: CardPiece = { kind: 'work_boot', color: 'brown', name: 'Brown work boots' };
const CHORE: CardPiece = { kind: 'chore_coat', color: 'charcoal', name: 'Charcoal chore coat' };
const PUFFER: CardPiece = { kind: 'puffer', color: 'black', name: 'Black puffer' };
const fields = (name: string, color: string) => ({ name, slot: 'top', garment: G('top', 'tee', color), hex: '#1E2026', confirmedFields: ['color_family'] });

const card = (c: unknown) => c as AskCard;

/** One card of every shape, with a label. The first is the shape written before T102. */
const SHAPES: readonly (readonly [string, Record<string, unknown>])[] = [
  ['old outfit (itemIds and occasion only)', { type: 'outfit', itemIds: ['a', 'b', 'c'], occasion: 'everyday' }],
  ['outfit with needs and example false', { type: 'outfit', itemIds: ['a', 'b'], occasion: 'date', needs: [BOOTS], example: false }],
  ['outfit with accessories in needs', { type: 'outfit', itemIds: ['a', 'b', 'c'], occasion: 'everyday', needs: [{ kind: 'watch', color: 'black', name: 'Black watch' }], example: false }],
  ['example', { type: 'outfit', itemIds: [], occasion: 'going_out', needs: [TEE, JEANS, SNEAKERS], example: true }],
  ['options (his id and drawn entries)', { type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { piece: CHORE }, { piece: PUFFER }] }],
  ['options of drawn entries only', { type: 'options', slot: 'shoes', options: [{ piece: BOOTS }, { piece: SNEAKERS }] }],
  ['colors about a piece', { type: 'colors', about: 'piece', kind: 'tee', itemId: 'a', families: ['light_blue', 'tan_camel'] }],
  ['colors about a kind he does not own', { type: 'colors', about: 'piece', kind: 'oxford_shirt', families: ['light_blue', 'white', 'khaki_beige'] }],
  ['colors in general', { type: 'colors', about: 'general', goesWith: 'olive', families: ['white', 'tan_camel', 'brown'] }],
  ['add, asked', { type: 'add', piece: JEANS, outcome: 'asked', itemId: null }],
  ['add, added (with itemId)', { type: 'add', piece: JEANS, outcome: 'added', itemId: 'C-7' }],
  ['add, declined', { type: 'add', piece: JEANS, outcome: 'declined', itemId: null }],
  ['changed', { type: 'changed', itemId: 'a', before: fields('Grey tee', 'grey'), after: fields('White tee', 'white') }],
  ['changed, undone', { type: 'changed', itemId: 'a', before: fields('Grey tee', 'grey'), after: fields('White tee', 'white'), undone: true }],
  ['buy without why', { type: 'buy', starterId: 's02', gain: 12 }],
  ['buy with why', { type: 'buy', starterId: 's02', gain: 12, why: 'It works with both of your chinos.' }],
  ['buy with no gain', { type: 'buy', starterId: 's05', gain: null }],
  ['check', { type: 'check', occasion: 'interview' }],
  ['ask', { type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Business casual', 'Not sure'] }],
  ['link to a piece', { type: 'link', itemId: 'a' }],
  ['link to a check', { type: 'link', checkId: 'FC-1' }],
  ['correct', { type: 'correct', checkId: 'FC-1' }],
];

describe('KC1.5 · every shape reads back from what was stored', () => {
  it.each(SHAPES)('KC1.5 · %s reads back equal after a JSON round trip', (_label, c) => {
    expect(storedCard(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });

  it('KC1.5 · the table holds every shape the spec lists', () => {
    expect(new Set(SHAPES.map(([, c]) => c.type))).toEqual(new Set(['outfit', 'options', 'colors', 'add', 'changed', 'buy', 'check', 'ask', 'link', 'correct']));
    expect(SHAPES.length).toBeGreaterThanOrEqual(22);
    // and each is read back as a card by the same function, never dropped
    for (const [label, c] of SHAPES) expect([label, storedCard(c)?.type]).toEqual([label, c.type]);
  });
});

describe('KC1.5 · a malformed stored card is null and never throws', () => {
  const outfitBase = { type: 'outfit', itemIds: ['a', 'b', 'c'], occasion: 'everyday' };
  const MALFORMED: readonly (readonly [string, unknown])[] = [
    ['needs is not an array', { ...outfitBase, needs: 'boots', example: false }],
    ['needs is an object', { ...outfitBase, needs: { kind: 'work_boot' }, example: false }],
    ['a needs entry misses its color', { ...outfitBase, needs: [{ kind: 'work_boot', name: 'Work boots' }], example: false }],
    ['a needs entry misses its kind', { ...outfitBase, needs: [{ color: 'brown', name: 'Brown boots' }], example: false }],
    ['a needs entry has a color family outside the 25', { ...outfitBase, needs: [{ kind: 'work_boot', color: 'chartreuse', name: 'Chartreuse work boots' }], example: false }],
    ['an options entry that is neither an itemId nor a piece', { type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { color: 'black' }] }],
    ['an options entry that is a string', { type: 'options', slot: 'outer', options: [{ itemId: 'a' }, 'b'] }],
    ['an options piece with a color outside the 25', { type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { piece: { kind: 'puffer', color: 'chartreuse', name: 'x' } }] }],
    ['options that is not an array', { type: 'options', slot: 'outer', options: 'a' }],
    ['an add card with an outcome other than the three', { type: 'add', piece: JEANS, outcome: 'maybe', itemId: null }],
    ['an add card with no outcome', { type: 'add', piece: JEANS, itemId: null }],
    ['an add card with a piece that is not one', { type: 'add', piece: 'jeans', outcome: 'asked', itemId: null }],
    ['a colors card with no families', { type: 'colors', about: 'general', goesWith: 'olive', families: [] }],
    ['a colors card with a family outside the 25', { type: 'colors', about: 'general', goesWith: 'olive', families: ['white', 'chartreuse', 'brown'] }],
    ['a colors card with families that is not an array', { type: 'colors', about: 'general', goesWith: 'olive', families: 'white' }],
    ['an unknown type', { type: 'poster', title: 'x' }],
    ['no type', { itemIds: ['a'], occasion: 'everyday' }],
    ['a string', 'outfit'],
    ['a number', 5],
    ['null', null],
    ['undefined', undefined],
    ['an array of cards', [{ type: 'check', occasion: 'everyday' }]],
    ['an empty object', {}],
  ];

  it.each(MALFORMED)('KC1.5 · %s', (_label, v) => {
    expect(() => storedCard(v)).not.toThrow();
    expect(storedCard(v)).toBeNull();
  });

  it('KC1.5 · the same malformed shapes with the one thing fixed do read (so the null is for that one thing)', () => {
    expect(storedCard({ ...outfitBase, needs: [BOOTS], example: false })).toEqual({ ...outfitBase, needs: [BOOTS], example: false });
    expect(storedCard({ type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { piece: PUFFER }] })).not.toBeNull();
    expect(storedCard({ type: 'add', piece: JEANS, outcome: 'asked', itemId: null })).not.toBeNull();
    expect(storedCard({ type: 'colors', about: 'general', goesWith: 'olive', families: ['white', 'tan_camel', 'brown'] })).not.toBeNull();
  });

  it('KC1.5 · after a wipe and reinstall an empty or foreign payload is no card', () => {
    for (const v of [{}, { foo: 1 }, { askCard: { type: 'check', occasion: 'date' } }, { type: 'Outfit', itemIds: ['a'], occasion: 'everyday' }, []]) expect(storedCard(v)).toBeNull();
  });
});

describe('KC1.5 · drawn pieces always redraw; his pieces that left show as gone', () => {
  const closet = ['tee', 'jeans', 'sneakers'].map((k) => rowOf(k));
  const outfit = (itemIds: string[], more: Record<string, unknown> = {}) => card({ type: 'outfit', itemIds, occasion: 'everyday', ...more }) as Extract<AskCard, { type: 'outfit' }>;

  it('KC1.5 · outfitNow returns the drawn needs unchanged even when none of his pieces exist', () => {
    const c = outfit(['x1', 'x2'], { needs: [BOOTS, JEANS], example: false });
    expect(outfitNow(c, [])).toEqual({ items: [], needs: [BOOTS, JEANS], example: false, gone: true });
    expect(outfitNow(c, closet)).toEqual({ items: [], needs: [BOOTS, JEANS], example: false, gone: true });
  });

  it('KC1.5 · an example has no pieces of his, so it is never gone', () => {
    const c = outfit([], { needs: [TEE, JEANS, SNEAKERS], example: true });
    expect(outfitNow(c, closet)).toEqual({ items: [], needs: [TEE, JEANS, SNEAKERS], example: true, gone: false });
    expect(outfitNow(c, [])).toEqual({ items: [], needs: [TEE, JEANS, SNEAKERS], example: true, gone: false });
  });

  it('KC1.5 · one of his pieces removed since: gone is true and the remaining items are still there', () => {
    const c = outfit(['tee', 'jeans', 'sneakers'], { needs: [BOOTS], example: false });
    const now = outfitNow(c, [rowOf('tee'), rowOf('jeans', { isDeleted: true }), rowOf('sneakers')]);
    expect(now.gone).toBe(true);
    expect(now.items.map((r) => r.id)).toEqual(['tee', 'sneakers']);
    expect(now.needs).toEqual([BOOTS]);
    expect(now.example).toBe(false);
  });

  it('KC1.5 · a piece merged into another since counts as gone, as today', () => {
    const c = outfit(['tee', 'jeans', 'sneakers'], { needs: [], example: false });
    const now = outfitNow(c, [rowOf('tee'), rowOf('jeans', { mergedInto: 'tee' }), rowOf('sneakers')]);
    expect(now.gone).toBe(true);
    expect(now.items.map((r) => r.id)).toEqual(['tee', 'sneakers']);
  });

  it('KC1.5 · an old outfit card (no needs, no example) still works: nothing drawn, not an example', () => {
    const now = outfitNow(outfit(['tee', 'jeans', 'sneakers']), closet);
    expect(now.items.map((r) => r.id)).toEqual(['tee', 'jeans', 'sneakers']);
    expect(now.gone).toBe(false);
    expect(now.needs).toEqual([]);
    expect(now.example).toBe(false);
    expect(cardKey(outfit(['b', 'a', 'c']))).toBe('a+b+c');
  });

  it('KC1.5 · optionsNow draws every drawn entry as a piece even when his closet is empty', () => {
    const c = card({ type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { piece: CHORE }, { piece: PUFFER }] });
    expect(optionsNow(c, [])).toEqual({ entries: [{ gone: true }, { piece: CHORE }, { piece: PUFFER }] });
  });

  it('KC1.5 · optionsNow gives his piece as an item, and gone for the removed entry only', () => {
    const bomber = rowOf('bomber');
    const denim = rowOf('denimJkt');
    const c = card({ type: 'options', slot: 'outer', options: [{ itemId: 'bomber' }, { itemId: 'denimJkt' }, { piece: PUFFER }] });
    const live = optionsNow(c, [bomber, denim]).entries;
    expect(live[0]).toEqual({ item: bomber });
    expect(live[1]).toEqual({ item: denim });
    expect(live[2]).toEqual({ piece: PUFFER });
    expect(optionsNow(c, [bomber, rowOf('denimJkt', { isDeleted: true })]).entries).toEqual([{ item: bomber }, { gone: true }, { piece: PUFFER }]);
    expect(optionsNow(c, [rowOf('bomber', { mergedInto: 'denimJkt' }), denim]).entries).toEqual([{ gone: true }, { item: denim }, { piece: PUFFER }]);
  });

  it('KC1.5 · exists: a removed piece behind an add card or a changed card opens nothing', () => {
    const gone = rowOf('jeans', { isDeleted: true });
    expect(linkedPiece('jeans', [gone])).toBeNull();
    expect(linkedPiece('jeans', [])).toBeNull();
    expect(linkedPiece('tee', closet)?.id).toBe('tee');
  });
});

describe('KC1.5 · Past chats never show a button that changes anything', () => {
  type Ctl = { wear: boolean; checkIt: boolean; correct: boolean; needMenu: boolean; add: boolean; noThanks: boolean; undo: boolean; outcome: string | null; answers: { tappable: boolean }[] };
  const controls = (c: Record<string, unknown>, o: { readOnly: boolean; tapped?: string | null; gone?: boolean }) =>
    cardControls(card(c), { readOnly: o.readOnly, tapped: o.tapped ?? null, ...(o.gone ? { gone: true } : {}) }) as unknown as Ctl;

  it.each(SHAPES)('KC1.5 · %s: every button flag is false in Past chats', (_label, c) => {
    const r = controls(c, { readOnly: true });
    expect({ add: r.add, noThanks: r.noThanks, undo: r.undo, wear: r.wear, checkIt: r.checkIt, needMenu: r.needMenu, correct: r.correct }).toEqual({
      add: false, noThanks: false, undo: false, wear: false, checkIt: false, needMenu: false, correct: false,
    });
    for (const a of r.answers) expect(a.tappable).toBe(false);
  });

  it('KC1.5 · in Past chats an add card still says what happened: added, declined, asked; nothing for other cards', () => {
    const outcome = (o: string) => controls({ type: 'add', piece: JEANS, outcome: o, itemId: o === 'added' ? 'x' : null }, { readOnly: true }).outcome;
    expect([outcome('added'), outcome('declined'), outcome('asked')]).toEqual(['added', 'declined', 'asked']);
    for (const [label, c] of SHAPES.filter(([, x]) => x.type !== 'add')) expect([label, controls(c, { readOnly: true }).outcome]).toEqual([label, null]);
  });

  const TODAY: readonly (readonly [string, Record<string, unknown>, Partial<Ctl>])[] = [
    ['old outfit', SHAPES[0]![1], { wear: true, checkIt: true, needMenu: false, add: false, noThanks: false, undo: false, outcome: null }],
    ['outfit with a drawn piece', SHAPES[1]![1], { wear: true, checkIt: true, needMenu: true, add: false, noThanks: false, undo: false, outcome: null }],
    ['example (no Wear this, keeps Check it, no menu)', SHAPES[3]![1], { wear: false, checkIt: true, needMenu: false, add: false, noThanks: false, undo: false, outcome: null }],
    ['options holding a drawn piece', SHAPES[4]![1], { wear: false, checkIt: false, needMenu: true, add: false, noThanks: false, undo: false, outcome: null }],
    ['options of his own pieces only', { type: 'options', slot: 'outer', options: [{ itemId: 'a' }, { itemId: 'b' }] }, { needMenu: false, wear: false, add: false, undo: false }],
    ['colors', SHAPES[6]![1], { wear: false, checkIt: false, needMenu: false, add: false, noThanks: false, undo: false, outcome: null }],
    ['add, asked', SHAPES[9]![1], { add: true, noThanks: true, undo: false, needMenu: false, wear: false, outcome: 'asked' }],
    ['add, added', SHAPES[10]![1], { add: false, noThanks: false, undo: true, needMenu: false, wear: false, outcome: 'added' }],
    ['add, declined', SHAPES[11]![1], { add: false, noThanks: false, undo: false, needMenu: false, wear: false, outcome: 'declined' }],
    ['changed', SHAPES[12]![1], { undo: true, add: false, noThanks: false, needMenu: false, wear: false, outcome: null }],
    ['changed, undone', SHAPES[13]![1], { undo: false, add: false, noThanks: false, needMenu: false, wear: false, outcome: null }],
    ['buy', SHAPES[14]![1], { add: false, noThanks: false, undo: false, needMenu: false, wear: false, checkIt: false, outcome: null }],
    ['check', SHAPES[17]![1], { checkIt: true, wear: false, add: false, undo: false, needMenu: false, outcome: null }],
    ['correct', SHAPES[21]![1], { correct: true, wear: false, add: false, undo: false, needMenu: false, outcome: null }],
  ];

  it.each(TODAY)('KC1.5 · today\'s chat, %s', (_label, c, want) => {
    expect(controls(c, { readOnly: false })).toMatchObject(want);
  });

  it('KC1.5 · today\'s chat: a gone outfit has neither Wear this nor Check it', () => {
    const r = controls(SHAPES[1]![1], { readOnly: false, gone: true });
    expect(r.wear).toBe(false);
    expect(r.checkIt).toBe(false);
  });

  it('KC1.5 · the ask card\'s answers are tappable in today\'s chat until one is picked', () => {
    const open = controls(SHAPES[18]![1], { readOnly: false });
    expect(open.answers.map((a) => a.tappable)).toEqual([true, true, true]);
    const picked = controls(SHAPES[18]![1], { readOnly: false, tapped: 'Yes' });
    expect(picked.answers.map((a) => a.tappable)).toEqual([false, false, false]);
    expect(open.needMenu).toBe(false);
  });
});
