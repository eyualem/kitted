// knownPieces (#114): the pieces the app is sure he owns, before the check being asked about. Rows mirror his Oct 8
// closet as the phone saved it (pull 20261008-165206): 4 checks, 12 rows (3 folded in by "Yes, same one"), 14 sightings.
import { knownMatches, type Garment } from '@kitted/core';
import type { ClosetItemRow, ClosetObservationRow, ObservationDecision } from '@/data/types';
import { knownPieces } from '@/features/closet/profile';

const g = (category: string, subcategory: string, color_family: string): Garment => ({ category, subcategory, color_family }) as Garment;
const item = (id: string, name: string, slot: string, garment: Garment, extra: Partial<ClosetItemRow> = {}): ClosetItemRow => ({
  id, name, slot, garment, hex: '#9CA0A6', confirmedFields: [], photoFile: null, demoPhotoId: null, isPhotographed: true,
  source: 'fitCheck', starterId: null, wornCount: 1, lastWornAt: null, addedAt: 0, isDeleted: false, profile: null, mergedInto: null, ...extra,
}) as ClosetItemRow;
let n = 0;
const seen = (itemId: string, fitCheckId: string, garment: Garment, decision: ObservationDecision, extra: Partial<ClosetObservationRow> = {}): ClosetObservationRow => ({
  id: `O${++n}`, itemId, fitCheckId, readingId: null, closetReadingId: null, garmentIndex: 0, origin: 'garment', garment, closet: null,
  sampledHex: null, sampledL: null, cropFile: null, cropQuality: null, decision, identityScore: null, candidates: [], askItemId: null,
  answeredAt: null, userConfirmed: null, createdAt: n, isDeleted: false, ...extra,
});

const hoodie = g('top', 'hoodie', 'grey'), jeans = g('bottom', 'jeans', 'black'), shoes = g('footwear', 'other', 'grey');
const items = [
  item('cream', 'Cream overshirt', 'outer', g('outerwear', 'overshirt', 'off_white_cream')),
  item('hoodie', 'Medium grey hoodie', 'top', hoodie),
  item('jeans', 'Washed black jeans', 'bottom', jeans),
  item('shoes', 'Grey shoes', 'shoes', shoes),
  item('nike', 'Heather grey Nike hoodie', 'top', hoodie, { isDeleted: true, mergedInto: 'hoodie' }),
  item('jeans2', 'Washed black jeans 2', 'bottom', jeans),
  item('tee', 'Grey tee', 'top', g('top', 'tee', 'grey')),
  item('tan', 'Tan overshirt', 'outer', g('outerwear', 'overshirt', 'tan_camel')),
  item('faded', 'Faded black jeans', 'bottom', jeans, { isDeleted: true, mergedInto: 'jeans' }),
  item('sweat', 'Grey sweatshirt', 'top', g('top', 'sweatshirt', 'grey')),
  item('black', 'Black jeans', 'bottom', jeans, { isDeleted: true, mergedInto: 'jeans' }),
  item('slides', 'Grey slides', 'shoes', g('footwear', 'slides_sandals', 'grey')),
];
const obs = [
  seen('cream', 'FC1', items[0]!.garment, 'new'), seen('hoodie', 'FC1', hoodie, 'new'), seen('jeans', 'FC1', jeans, 'new'), seen('shoes', 'FC1', shoes, 'new'),
  seen('hoodie', 'FC2', hoodie, 'answeredSame'), seen('jeans2', 'FC2', jeans, 'new', { userConfirmed: { subcategory: 'jeans' } }),
  seen('tee', 'FC3', items[6]!.garment, 'new'), seen('tan', 'FC3', items[7]!.garment, 'new'), seen('jeans', 'FC3', jeans, 'answeredSame'), seen('shoes', 'FC3', shoes, 'same'),
  seen('tan', 'FC4', items[7]!.garment, 'same'), seen('sweat', 'FC4', items[9]!.garment, 'new'), seen('jeans', 'FC4', jeans, 'answeredSame'),
  seen('slides', 'FC4', items[11]!.garment, 'new'),
];

describe('knownPieces on his Oct 8 closet', () => {
  it('known = confirmed or seen in 2+ checks; one-off pieces and folded-in rows are not', () => {
    expect(knownPieces(items, obs).map((p) => [p.id, p.confirmed, p.sightings])).toEqual([
      ['hoodie', true, 2], // "Yes, same one" at 16:38
      ['jeans', true, 3],
      ['jeans2', true, 1], // the duplicate, but he answered the jeans tap on it
      ['shoes', false, 2],
      ['tan', false, 2],
    ]);
  });

  it("the check being asked about doesn't count: before 16:41 the tan overshirt was seen once", () => {
    const before = knownPieces(items, obs, { excludeCheckIds: ['FC4'] });
    expect(before.map((p) => p.id)).toEqual(['hoodie', 'jeans', 'jeans2', 'shoes']);
    expect(before.find((p) => p.id === 'jeans')!.sightings).toBe(2);
  });

  it('16:41 against the closet before it: the "sweatshirt" is his grey hoodie, the "slides" his grey shoes, the jeans are ambiguous', () => {
    const before = knownPieces(items, obs, { excludeCheckIds: ['FC4'] });
    expect(knownMatches(before, g('top', 'sweatshirt', 'grey')).map((p) => p.name)).toEqual(['Medium grey hoodie']);
    expect(knownMatches(before, g('footwear', 'slides_sandals', 'grey')).map((p) => p.name)).toEqual(['Grey shoes']);
    expect(knownMatches(before, jeans)).toHaveLength(2); // two black jeans pieces: no question
  });

  it('a shoe-kind answer is carried, and a piece he added himself is known from day one', () => {
    const said = [...obs, seen('shoes', 'FC5', g('footwear', 'work_boot', 'grey'), 'same', { userConfirmed: { shoeKind: 'boots' } })];
    const added = [...items, item('loafers', 'Brown loafers', 'shoes', g('footwear', 'loafer', 'brown'), { source: 'added' })];
    const k = knownPieces(added, said);
    expect(k.find((p) => p.id === 'shoes')).toMatchObject({ shoeKind: 'boots', shoeKindSaid: true, confirmed: true, sightings: 3 });
    expect(k.find((p) => p.id === 'loafers')).toMatchObject({ confirmed: true, sightings: 0, shoeKind: null });
  });
});
