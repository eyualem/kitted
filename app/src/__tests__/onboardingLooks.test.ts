import { STYLES } from '@/data/types';
import { renderFlat } from '@/features/closet/flats';
import { cleanOtherWords, LOOKS, picksToStyles, togglePick } from '@/features/onboarding/looks';
import { t, type StringKey } from '@/i18n/en';

describe('O2 pick looks (#173)', () => {
  it('has one tile for each of the 8 styles, two drawn outfits each', () => {
    expect(LOOKS.map((l) => l.style).sort()).toEqual([...STYLES].sort());
    for (const l of LOOKS) {
      expect(l.outfits).toHaveLength(2);
      for (const o of l.outfits) {
        expect(o.map((p) => p.kind)).toEqual(['top', 'bottom', 'shoe']);
        for (const p of o) expect(renderFlat(p, { scheme: 'light', id: 't' })).toContain('<svg');
      }
      // Every tile has its own plain line in the copy deck.
      expect(t(`onb.looks.line.${l.style}` as StringKey)).not.toMatch(/^onb\./);
    }
  });

  it('takes up to 3 picks in the order tapped; a 4th tap is refused', () => {
    let p = togglePick([], 'workwear').picks;
    p = togglePick(p, 'streetwear').picks;
    p = togglePick(p, 'outdoor').picks;
    expect(p).toEqual(['workwear', 'streetwear', 'outdoor']);
    const full = togglePick(p, 'minimalist');
    expect(full.full).toBe(true);
    expect(full.picks).toEqual(p);
    expect(togglePick(p, 'streetwear').picks).toEqual(['workwear', 'outdoor']);
  });

  it('saves the picks as ordered weights: the 1st 0.5, the rest split', () => {
    expect(picksToStyles([])).toEqual([]);
    expect(picksToStyles(['minimalist'])).toEqual([['minimalist', 1]]);
    expect(picksToStyles(['smart_casual', 'workwear'])).toEqual([['smart_casual', 0.5], ['workwear', 0.5]]);
    expect(picksToStyles(['streetwear', 'workwear', 'outdoor'])).toEqual([['streetwear', 0.5], ['workwear', 0.25], ['outdoor', 0.25]]);
  });

  it('keeps his own words as written, trimmed and capped', () => {
    expect(cleanOtherWords('   ')).toBeNull();
    expect(cleanOtherWords('  skater   but clean ')).toBe('skater but clean');
    expect(cleanOtherWords('x'.repeat(200))).toHaveLength(80);
  });
});
