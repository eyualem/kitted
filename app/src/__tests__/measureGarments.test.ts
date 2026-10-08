// On-device measuring (DECISIONS-LOG #104): the pure parts of services/measure/garments.ts.
import type { MeasuredGarment } from '../../modules/kitted-vision';
import { cropQuality, measuredOf, MIN_COLOR_PX, printFileOf } from '@/services/measure/garments';

const g = (o: Partial<MeasuredGarment> = {}): MeasuredGarment => ({
  key: 'garment-0', hex: '#444343', L: 28.4, clusters: [], ownedPx: 20000, coverage: 0.6, overlapOuter: 0, headOverlap: 0, droppedOuter: 0,
  boxW: 500, boxH: 600, lapVar: 900, personMask: true, cropUri: 'file:///var/mobile/Containers/Data/Application/AB/Documents/closet/abc-garment-0.png',
  ...o,
});

describe('cropQuality', () => {
  it('full for a big, unhidden piece; lower when small, under an outer layer or inside a head/hand region', () => {
    expect(cropQuality(g())).toBe(1);
    expect(cropQuality(g({ ownedPx: 4000 }))).toBe(0.5);
    expect(cropQuality(g({ overlapOuter: 1 }))).toBe(0.4);
    expect(cropQuality(g({ headOverlap: 0.71 }))).toBe(0.29);
    expect(cropQuality(g({ ownedPx: 0 }))).toBe(0);
  });
});

describe('measuredOf', () => {
  it('keeps the color and a Documents-relative cut-out path', () => {
    expect(measuredOf(g())).toEqual({ sampledHex: '#444343', sampledL: 28.4, cropFile: 'closet/abc-garment-0.png', cropQuality: 1 });
  });
  it('drops the color when too few of his pixels were measured, and the crop when none was written', () => {
    const m = measuredOf(g({ ownedPx: MIN_COLOR_PX - 1, cropUri: undefined }));
    expect(m).toEqual({ sampledHex: null, sampledL: null, cropFile: null, cropQuality: null });
  });
});

describe('printFileOf', () => {
  it('sits next to the cut-out', () => {
    expect(printFileOf('closet/abc-garment-0.png')).toBe('closet/abc-garment-0.print');
    expect(printFileOf(null)).toBeNull();
    expect(printFileOf('closet/abc.jpg')).toBeNull();
  });
});
