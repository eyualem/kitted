// oversized-tee (founder, Nov 19: "Can we add tiles for oversized T's?"): a tee whose name or fit says oversized draws oversized
// (dropped shoulders, a boxy body, a longer hem, longer sleeves toward the elbow); a plain tee draws as it always did.
import { renderFlat } from '@/features/closet/flats';
import { artSpec, drawnItem, type ArtItem } from '@/features/closet/artSpec';
import { G } from '@kitted/core';

const GREY = '#8A8D93';
const tee = (name: string, volume?: number): ArtItem => ({
  garment: { ...G('top', 'tee', 'grey'), ...(volume === undefined ? {} : { volume }) },
  hex: GREY, art: null, name,
});
const fitOf = (it: ArtItem) => (artSpec(it).flat as { fit?: string }).fit;
const draw = (it: ArtItem, scheme: 'light' | 'dark' = 'light') => renderFlat(artSpec(it).flat, { scheme, id: 'x' });

describe('oversized-tee · an oversized tee has its own drawing', () => {
  it('a tee named oversized, boxy or drop-shoulder draws oversized; a plain tee does not', () => {
    for (const name of ['Oversized tee', 'Black boxy tee', 'Drop shoulder tee', 'drop-shoulder tee', 'Uniqlo oversized tee']) expect(fitOf(tee(name))).toBe('oversized');
    for (const name of ['Charcoal tee', 'Grey tee', 'Tan long-sleeve tee', 'Boxer tee']) expect(fitOf(tee(name))).toBe('regular');
  });

  it('the drawing differs from the regular tee in both themes, and is deterministic', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const big = draw(tee('Oversized tee'), scheme);
      expect(big).not.toBe(draw(tee('Charcoal tee'), scheme));
      expect(draw(tee('Oversized tee'), scheme)).toBe(big);
      expect(big).not.toMatch(/NaN|undefined/);
    }
  });

  it('a fit he set wins over the name, and a volume 5 tee draws the same oversized tee', () => {
    expect(fitOf(tee('Oversized tee', 2))).toBe('slim');
    expect(fitOf(tee('Oversized tee', 4))).toBe('relaxed');
    expect(fitOf(tee('Grey tee', 5))).toBe('oversized');
    expect(draw(tee('Grey tee', 5))).toBe(draw(tee('Oversized tee')));
  });

  it('only tees take the name: a hoodie named oversized, and a regular tee, keep their drawings', () => {
    const hoodie: ArtItem = { garment: G('top', 'hoodie', 'grey'), hex: GREY, art: null, name: 'Oversized hoodie' };
    expect(fitOf(hoodie)).toBe('regular');
    expect(fitOf(tee('Relaxed fit tee'))).toBe('relaxed');
  });

  it('a drawn tee card named oversized draws oversized too, as a closet tile does', () => {
    const card = drawnItem({ kind: 'tee', family: 'grey', name: 'Oversized tee' });
    expect(card).not.toBeNull();
    expect(fitOf(card!)).toBe('oversized');
  });
});
