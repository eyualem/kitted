// "Your White tee?" for his cream striped oxford (Oct 11, #219): knownPieces now carries each piece's pattern (the
// tile's drift-guarded one, else the item's own read), and knownMatches never offers a piece whose pattern or collar
// family differs from the read. Rows mirror his Oct 11 pull (20261011-133011): the White tee, seen in 3 checks.
import { askWithClosetParts, knownMatches, scoreParts, type Garment, type PartsScored, type Reading } from '@kitted/core';
import type { ClosetItemRow, ClosetObservationRow } from '@/data/types';
import { knownPieces } from '@/features/closet/profile';
import { whyParts } from '@/features/why/partsRows';

const tee = { category: 'top', subcategory: 'tee', color_family: 'white', pattern: 'solid', certainty: 'clear' } as Garment;
const whiteTee = {
  id: 'C-910e2a06', name: 'White tee', slot: 'top', garment: tee, hex: '#F2F0EA', confirmedFields: [], photoFile: null, demoPhotoId: null,
  isPhotographed: true, source: 'fitCheck', starterId: null, wornCount: 3, lastWornAt: null, addedAt: 0, isDeleted: false,
  profile: { aliases: [], distinctFrom: [], confirmed: {}, autoName: true }, mergedInto: null,
  art: { family: 'white', shade: 'white|-|-', details: [], brand: null, pattern: 'solid', shoeProfile: null, denimWear: null },
} as unknown as ClosetItemRow;
const seen = (fc: string, i: number): ClosetObservationRow => ({
  id: `O${i}`, itemId: whiteTee.id, fitCheckId: fc, readingId: null, closetReadingId: null, garmentIndex: 0, origin: 'garment', garment: tee,
  closet: null, sampledHex: null, sampledL: null, cropFile: null, cropQuality: null, decision: i === 0 ? 'new' : 'same', identityScore: null,
  candidates: [], askItemId: null, answeredAt: null, userConfirmed: null, createdAt: i, isDeleted: false,
}) as ClosetObservationRow;

// his first read (R-f8e1bd93): the oxford is garment 0
const oxford = {
  category: 'top', subcategory: 'oxford_shirt', color_family: 'off_white_cream', pattern: 'stripes', logo: 'none', volume: 3, leg_shape: 'na',
  hem: 'na', tucked: 'none', condition: 'wrinkled', certainty: 'likely', length: 'mid_fly', pattern_scale: 'small', saturation: 'muted',
  sleeve_end: 'na', strain: 'none', distressed_by_design: false, shows_below_outer: true,
} as Garment;
const reading = {
  scene: { framing: 'full_body', shoes_visible: true, people_count: 1, mirror_selfie: true, lighting: 'good', clothed: 'fully' },
  garments: [
    oxford,
    { category: 'outerwear', subcategory: 'hoodie', color_family: 'green', pattern: 'solid', logo: 'small', volume: 3, leg_shape: 'na', hem: 'na',
      tucked: 'na', condition: 'clean', certainty: 'clear', length: 'at_belt', pattern_scale: 'na', saturation: 'muted', sleeve_end: 'at_wrist',
      strain: 'none', distressed_by_design: false, shows_below_outer: false },
    { category: 'bottom', subcategory: 'jeans', color_family: 'denim_mid', pattern: 'solid', logo: 'none', volume: 4, leg_shape: 'wide',
      hem: 'full_break', tucked: 'na', condition: 'clean', certainty: 'clear', length: 'na', pattern_scale: 'na', saturation: 'muted',
      sleeve_end: 'na', strain: 'none', distressed_by_design: true, shows_below_outer: false },
    { category: 'footwear', subcategory: 'basketball_sneaker', color_family: 'black', pattern: 'solid', logo: 'none', volume: 3, leg_shape: 'na',
      hem: 'na', tucked: 'na', condition: 'clean', certainty: 'likely', length: 'na', pattern_scale: 'na', saturation: 'na', sleeve_end: 'na',
      strain: 'none', distressed_by_design: false, shows_below_outer: false },
  ],
} as unknown as Reading;

describe('known pieces never cross a pattern or a collar (#219)', () => {
  const known = knownPieces([whiteTee], [seen('FC1', 0), seen('FC2', 1), seen('FC3', 2)]);

  it('the White tee is known, with its pattern', () => {
    expect(known.map((p) => [p.id, p.pattern, p.sightings])).toEqual([['C-910e2a06', 'solid', 3]]);
  });

  it('his striped oxford never matches it, so "Your White tee?" is never asked', () => {
    expect(knownMatches(known, oxford)).toEqual([]);
    const q = askWithClosetParts(reading, { occasion: 'class', styles: [['streetwear', 1]] as never }, known);
    expect(q?.question ?? null).not.toBe('Your White tee?');
  });

  it('a plain white tee read as a "likely" tee still matches it', () => {
    expect(knownMatches(known, { ...tee, certainty: 'likely' } as Garment).map((p) => p.id)).toEqual(['C-910e2a06']);
  });
});

describe('the Why sheet names the unsure wrinkles, with no points (#219)', () => {
  it('Condition: the tip line, ±0, and the score is 8.0 (parts v8, #228; v7 7.5)', () => {
    const res = scoreParts(reading, { occasion: 'class', styles: [['streetwear', 1]] as never }) as PartsScored;
    expect(res.overall).toBe(8);
    const row = whyParts(res, { occasion: 'class', readsAs: 'streetwear', gainPart: null }).after.find((x) => x.key === 'condition')!;
    expect([row.item, row.amount]).toEqual(["the oxford shirt might be wrinkled; not counted, it isn't clear enough in the photo", 0]);
  });
});
