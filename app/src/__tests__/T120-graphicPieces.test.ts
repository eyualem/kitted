// T120: a graphic is not only a tee's. The print mark is drawn on any top and on jeans, sweatpants and shorts; the piece
// page offers Pattern on a bottom. Scores never read any of this (the drawing and the page's rows only).
import { G } from '@kitted/core';
import { artSpec } from '@/features/closet/artSpec';
import { renderFlat } from '@/features/closet/flats';
import { BOTTOM_PATTERNS, editOptions, editRows } from '@/features/closet/pieceEdit';

const draw = (g: ReturnType<typeof G>, hex = '#9CA0A6') => artSpec({ garment: g, hex, art: null, name: 'x' });
const MARK = /opacity="\.5"\/><path d="M[\d.]+,[\d.]+ L[\d.]+,[\d.]+ L[\d.]+,[\d.]+ L[\d.]+,[\d.]+ L[\d.]+,[\d.]+ Z"[^>]*opacity="\.7"/;

describe('T120 graphic pieces', () => {
  const tops: [string, string][] = [['top', 'tee'], ['top', 'hoodie'], ['top', 'sweatshirt'], ['top', 'polo'], ['top', 'oxford_shirt'], ['outerwear', 'bomber'], ['outerwear', 'denim_jacket'], ['outerwear', 'puffer']];
  it.each(tops)('a graphic %s (%s) is drawn with the print mark and says "graphic"', (cat, sub) => {
    const g = G(cat, sub, 'grey', { pattern: 'graphic' });
    const s = draw(g);
    expect(s.flat).toMatchObject({ kind: 'top', print: true });
    expect(s.glyphs).toContain('graphic');
    expect(renderFlat(s.flat)).toMatch(MARK);
    const plain = draw(G(cat, sub, 'grey'));
    expect(renderFlat(plain.flat)).not.toMatch(MARK);
    expect(plain.glyphs).not.toContain('graphic');
  });

  const bottoms = ['jeans', 'sweatpants', 'shorts', 'athletic_shorts', 'cargos', 'chinos', 'joggers'];
  it.each(bottoms)('graphic %s: the print mark on the thigh, and "graphic" said; plain %s: neither', (sub) => {
    const s = draw(G('bottom', sub, 'grey', { pattern: 'graphic', leg_shape: 'straight' }));
    expect(s.flat).toMatchObject({ kind: 'bottom', print: true });
    expect(s.glyphs).toContain('graphic');
    expect(renderFlat(s.flat)).toMatch(MARK);
    const plain = draw(G('bottom', sub, 'grey', { leg_shape: 'straight' }));
    expect(plain.flat).toMatchObject({ print: false });
    expect(renderFlat(plain.flat)).not.toMatch(MARK);
  });

  it('the mark stays on the leg: inside the drawing for every leg shape and in both schemes', () => {
    for (const leg of ['skinny', 'slim', 'straight', 'relaxed', 'wide']) {
      for (const scheme of ['light', 'dark'] as const) {
        const svg = renderFlat(draw(G('bottom', 'jeans', 'denim_dark', { pattern: 'graphic', leg_shape: leg })).flat, { scheme });
        const m = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="[\d.]+" fill="[^"]+" opacity="\.5"\/>/.exec(svg);
        expect(m).not.toBeNull();
        const [x, , w] = [Number(m![1]), Number(m![2]), Number(m![3])];
        const G_: Record<string, number> = { skinny: 6, slim: 5, straight: 4, relaxed: 3, wide: 1.5 };
        const LH: Record<string, number> = { skinny: 10.5, slim: 12.5, straight: 15.5, relaxed: 18, wide: 21.5 };
        expect(x + w / 2).toBeCloseTo(100 - G_[leg]! - LH[leg]!, 0); // centred on the right leg (viewer's left)
        expect(x + w).toBeLessThan(100 - G_[leg]!); // never over the crotch gap
      }
    }
  });

  it('a top\'s side mark stays inside the body edge at every fit, and a denim jacket\'s sits between its seam and the placket', () => {
    const HW: Record<number, number> = { 2: 37, 3: 41, 4: 46, 5: 50 };
    const rect = (svg: string) => { const m = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="[\d.]+" fill="[^"]+" opacity="\.5"\/>/.exec(svg); expect(m).not.toBeNull(); return m!.slice(1).map(Number) as [number, number, number, number]; };
    for (const [cat, sub] of [['top', 'polo'], ['top', 'oxford_shirt'], ['outerwear', 'bomber'], ['top', 'hoodie']] as const) {
      for (const vol of [2, 3, 4, 5]) {
        const flat = draw(G(cat, sub, 'grey', { pattern: 'graphic', volume: vol })).flat;
        if (sub === 'hoodie') { expect(renderFlat(flat)).toMatch(MARK); continue; } // a pullover hoodie keeps its chest mark
        const [x, , w] = rect(renderFlat(flat));
        expect(x).toBeGreaterThanOrEqual(100 - HW[vol]! + 3);
        expect(x + w).toBeLessThan(94); // clear of the placket and zip at the middle
      }
    }
    const [dx, , dw] = rect(renderFlat(draw(G('outerwear', 'denim_jacket', 'denim_mid', { pattern: 'graphic' })).flat));
    expect(dx).toBeGreaterThan(100 - 21);
    expect(dx + dw).toBeLessThan(100 - 5.5);
  });

  it('a graphic cap, beanie or shoe keeps its drawing (accessories draw no glyphs; shoes no print)', () => {
    const cap = artSpec({ garment: G('accessory', 'cap', 'black', { pattern: 'graphic' }), hex: '#2A2D34', art: null, name: 'Black cap' });
    expect(cap.glyphs).toEqual([]);
    const shoe = draw(G('footwear', 'chunky_sneaker', 'white', { pattern: 'graphic' }));
    expect(shoe.glyphs).not.toContain('graphic');
  });

  const item = (sub: string, category: string, slot: string, pattern = 'solid') => ({ slot, garment: G(category, sub, 'grey', { pattern }), hex: '#9CA0A6', art: null, name: 'x', confirmedFields: [] }) as never;
  it('the piece page offers Pattern on every bottom: Solid or Graphic print; a top keeps all four', () => {
    expect(editRows(item('jeans', 'bottom', 'bottom')).map((r) => r.field)).toEqual(['kind', 'color', 'leg', 'pattern']);
    expect(editRows(item('shorts', 'bottom', 'bottom')).map((r) => r.field)).toEqual(['kind', 'color', 'pattern']);
    expect(editOptions(item('jeans', 'bottom', 'bottom'), 'pattern').main.map((o) => o.value)).toEqual([...BOTTOM_PATTERNS]);
    expect(editOptions(item('hoodie', 'top', 'top'), 'pattern').main.map((o) => o.value)).toEqual(['solid', 'stripes', 'checks_plaid', 'graphic']);
    expect(editRows(item('sweatpants', 'bottom', 'bottom', 'graphic')).find((r) => r.field === 'pattern')!.value).toBe('Graphic print');
  });
});
