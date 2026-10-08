// The detailed closet tiles (#91): what the overlay draws per piece, at most 3 glyphs, the fabric hint, the brand as a
// plain mark (its word only at large size), and what VoiceOver says. The summary row's words.
import { G, parseShade, shadeId } from '@kitted/core';
import type { ClosetArt, ClosetSummary } from '@/data/types';
import { artSpec } from '@/features/closet/artSpec';
import { closetSummaryText, isPending } from '@/features/closet/summaryText';

const art = (o: Partial<ClosetArt> & { family: string }): ClosetArt => ({ shade: null, details: [], brand: null, shoeProfile: null, denimWear: null, ...o });
const piece = (g: ReturnType<typeof G>, a: ClosetArt, name: string) => ({ garment: g, hex: '#9CA0A6', art: a, name });

describe('artSpec', () => {
  it("the founder's hoodie: drawstrings over the icon's own pouch, a neutral chest mark for Nike, never a logo", () => {
    const s = artSpec(piece(G('top', 'hoodie', 'grey'), art({ family: 'grey', shade: shadeId(parseShade('medium grey')), brand: 'nike', details: ['drawstring', 'elastic_cuffs', 'front_pouch', 'hood'] }), 'Medium grey Nike hoodie'));
    expect([s.icon, s.glyphs, s.fabric, s.brand]).toEqual(['hoodie', ['drawstrings', 'cuffs'], null, { word: 'Nike', mark: 'dot' }]);
    expect(s.a11y).toBe('Medium grey Nike hoodie, drawstrings, cuffs, front pouch');
  });
  it('a zip hoodie: the zip first; heather gets the speckle', () => {
    const s = artSpec(piece(G('top', 'hoodie', 'grey'), art({ family: 'grey', shade: shadeId(parseShade('heather grey')), details: ['full_zip', 'hood', 'drawstring', 'front_pouch'] }), 'Heather grey zip hoodie'));
    expect([s.glyphs, s.fabric]).toEqual([['fullZip', 'drawstrings'], 'heather']);
  });
  it('at most 3 glyphs, the most telling first', () => {
    const s = artSpec(piece(G('bottom', 'jeans', 'denim_mid'), art({ family: 'denim_mid', details: ['belt_loops', 'cargo_pockets', 'side_stripe', 'elastic_cuffs'], denimWear: 'ripped' }), 'Ripped jeans'));
    expect([s.glyphs, s.fabric]).toEqual([['sideStripe', 'cargoPockets', 'rips'], 'twill']);
  });
  it('shoes: a chunky sole; the brand word only at large size', () => {
    const shoe = piece(G('footwear', 'chunky_sneaker', 'white'), art({ family: 'white', shoeProfile: 'chunky', brand: 'new_balance' }), 'White New Balance chunky sneakers');
    expect([artSpec(shoe).glyphs, artSpec(shoe).brand, artSpec(shoe, 'large').brand]).toEqual([['chunkySole'], { word: 'New Balance', mark: 'dot' }, { word: 'New Balance', mark: 'word' }]);
  });
  it('a v3-only piece (no closet call yet): just the icon', () => {
    const s = artSpec({ garment: G('top', 'tee', 'white'), hex: '#F2F0EA', art: null, name: 'White tee' });
    expect([s.glyphs, s.fabric, s.brand, s.a11y]).toEqual([[], null, null, 'White tee']);
  });
  it('patterns from the scored reading: stripes, checks, a graphic', () => {
    expect(artSpec(piece(G('top', 'tee', 'navy', { pattern: 'stripes' }), art({ family: 'navy' }), 'Navy tee')).glyphs).toEqual(['stripes']);
    expect(artSpec(piece(G('top', 'flannel_shirt', 'red', { pattern: 'checks_plaid' }), art({ family: 'red', details: ['collar', 'buttons'] }), 'Red flannel')).glyphs).toEqual(['checks']);
    expect(artSpec(piece(G('top', 'graphic_tee', 'black', { pattern: 'graphic' }), art({ family: 'black' }), 'Black graphic tee')).glyphs).toEqual(['graphic']);
  });
});

describe('the summary row', () => {
  const cs = (o: Partial<ClosetSummary>): ClosetSummary => ({ matched: [], added: [], undone: [], ...o });
  it('"Added 3 to Closet · 1 question"; undone pieces and answered questions drop out', () => {
    expect(closetSummaryText(cs({ added: ['a', 'b', 'c'], asks: [{ obsId: 'o', itemId: 'b', candidateId: 'B1', answer: null }] }), 0)!.text).toBe('Added 3 to Closet · 1 question');
    expect(closetSummaryText(cs({ added: ['a', 'b'], undone: ['b'], asks: [{ obsId: 'o', itemId: 'b', candidateId: 'B1', answer: null }] }), 0)!.text).toBe('Added 1 to Closet');
    expect(closetSummaryText(cs({ added: ['a'], asks: [{ obsId: 'o', itemId: 'a', candidateId: 'B1', answer: 'new' }] }), 0)!.text).toBe('Added 1 to Closet');
    expect(closetSummaryText(cs({ matched: ['T1', 'S1'] }), 0)!.text).toBe('2 already in your closet');
    expect(closetSummaryText(cs({}), 0)).toBeNull();
  });
  it('"Checking the details…" for up to 12 s while the closet call is out', () => {
    const p = cs({ state: 'pending', startedAt: 1000 });
    expect(closetSummaryText(p, 5000)).toEqual({ text: 'Checking the details…', pending: true, itemIds: [] });
    expect(isPending(p, 13_001)).toBe(false);
  });
});
