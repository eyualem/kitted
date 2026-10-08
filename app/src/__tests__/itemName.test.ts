// Closet names (#91): "{shade} {Brand} {detail} {garment}" from fixed tables only; unique across his closet with
// the fewest words; sticky; his own names and the seed's never change.
import { G, parseShade, shadeId, type Garment } from '@kitted/core';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { assignNames, brandWord, colorPhrase, composeName } from '@/features/closet/itemName';
import { artOf, guarded, observationOf } from '@/features/closet/profile';

const art = (o: Partial<ClosetArt> & { family: string }): ClosetArt => ({ shade: null, details: [], brand: null, shoeProfile: null, denimWear: null, ...o });
const sh = (t: string) => shadeId(parseShade(t));
let n = 0;
function item(g: Garment, a: ClosetArt, over: Partial<ClosetItemRow> = {}): ClosetItemRow {
  n += 1;
  return {
    id: `C${n}`, name: '', slot: 'top', garment: g, confirmedFields: [], hex: '#000000', photoFile: null, demoPhotoId: null, isPhotographed: true,
    source: 'fitCheck', starterId: null, wornCount: 1, lastWornAt: null, addedAt: n, isDeleted: false, art: a,
    profile: { aliases: [], distinctFrom: [], confirmed: {}, autoName: true }, ...over,
  };
}
const hoodie = G('top', 'hoodie', 'grey');

describe('names', () => {
  it('"Medium grey Nike hoodie": shade words only from the fixed tables, a listed brand', () => {
    expect(composeName(hoodie, art({ family: 'grey', shade: sh('medium grey'), brand: 'nike' }), null)).toBe('Medium grey Nike hoodie');
    expect(composeName(hoodie, art({ family: 'grey', shade: sh('heather grey') }), null)).toBe('Heather grey hoodie');
    expect(composeName(G('bottom', 'jeans', 'denim_dark'), art({ family: 'denim_dark', shade: sh('dark wash') }), null)).toBe('Dark jeans');
    expect(composeName(G('bottom', 'jeans', 'denim_mid'), art({ family: 'denim_mid', shade: sh('faded medium wash') }), null)).toBe('Faded mid-wash jeans');
    expect(composeName(G('bottom', 'chinos', 'khaki_beige'), art({ family: 'khaki_beige', shade: sh('khaki') }), null)).toBe('Khaki chinos');
    expect(composeName(G('top', 'tee', 'white'), art({ family: 'white', shade: sh('optic white') }), null)).toBe('White tee');
  });
  it('the shade can never move the color word to another family', () => {
    expect(colorPhrase('grey', sh('light grey'))).toBe('grey'); // "light grey" folds to light_grey: not this piece's family
    expect(colorPhrase('charcoal', sh('light charcoal'))).toBe('light charcoal');
  });
  it('brands: the known list, or one plain word', () => {
    expect([brandWord('nike'), brandWord('levis'), brandWord('text:kithx'), brandWord('text:two words'), brandWord('none'), brandWord('unreadable')])
      .toEqual(['Nike', "Levi's", 'Kithx', null, null, null]);
  });
});

describe('unique names', () => {
  it('two grey Nike hoodies: the older keeps its name, the zip one gets the word; a charcoal one needs none', () => {
    const a = item(hoodie, art({ family: 'grey', shade: sh('medium grey'), brand: 'nike', details: ['front_pouch', 'hood'] }));
    const b = item(hoodie, art({ family: 'grey', shade: sh('medium grey'), brand: 'nike', details: ['full_zip', 'hood'] }));
    const c = item(hoodie, art({ family: 'charcoal' }), { garment: G('top', 'hoodie', 'charcoal') });
    const names = assignNames([a, b, c]);
    expect([names.get(a.id)!.name, names.get(b.id)!.name, names.get(c.id)!.name]).toEqual(['Medium grey Nike hoodie', 'Medium grey Nike zip hoodie', 'Charcoal hoodie']);
    expect(names.get(b.id)!.nameDetail).toBe('zip');
  });
  it('nothing tells them apart: a number, never a duplicate', () => {
    const a = item(G('top', 'tee', 'white'), art({ family: 'white' }));
    const b = item(G('top', 'tee', 'white'), art({ family: 'white' }));
    const names = assignNames([a, b]);
    expect([names.get(a.id)!.name, names.get(b.id)!.name]).toEqual(['White tee', 'White tee 2']);
  });
  it('his own names and the seed names stay; an app piece steps around them', () => {
    const mine = item(G('top', 'tee', 'white'), art({ family: 'white' }), { name: 'Lucky tee', profile: { aliases: [], distinctFrom: [], confirmed: {}, nameLocked: true } });
    const seeded = item(G('top', 'tee', 'white'), art({ family: 'white' }), { name: 'White tee', source: 'seed', profile: { aliases: [], distinctFrom: [], confirmed: {} } });
    const app = item(G('top', 'tee', 'white'), art({ family: 'white', details: ['chest_pocket'] }));
    const names = assignNames([mine, seeded, app]);
    expect([names.has(mine.id), names.has(seeded.id), names.get(app.id)!.name]).toEqual([false, false, 'White pocket tee']);
  });
  it('sticky: once a detail word is set it stays while the piece has that detail', () => {
    const a = item(hoodie, art({ family: 'grey', details: ['full_zip', 'hood'] }), { profile: { aliases: [], distinctFrom: [], confirmed: {}, autoName: true, nameDetail: 'zip' } });
    expect(assignNames([a]).get(a.id)!.name).toBe('Grey zip hoodie');
  });
});

describe('the drift guard', () => {
  it('a look changes only when 2 newer sightings agree, or he confirms it', () => {
    expect(guarded(['a', 'b'])).toBe('a');
    expect(guarded(['a', 'b', 'a', 'b'])).toBe('b');
    expect(guarded([null, 'a', null])).toBe('a');
    expect(guarded(['a', 'b'], 'c')).toBe('c');
  });
  it("one dark sighting doesn't redraw a medium grey hoodie; two do", () => {
    const g = G('top', 'hoodie', 'grey');
    const f = (shade: string) => ({ visible: true, box: [], shade, lightness: null, details: [], logo_text: null, sleeve_length: null, shoe_profile: null, denim_wear: null });
    const base = { garment: g, confirmedFields: [], profile: null };
    expect(artOf(base, [observationOf(g, f('medium grey')), observationOf(g, f('dark grey'))]).shade).toBe('grey|mid|-');
    expect(artOf(base, [observationOf(g, f('medium grey')), observationOf(g, f('heather grey')), observationOf(g, f('heather grey'))]).shade).toBe('grey|-|heather');
  });
});
