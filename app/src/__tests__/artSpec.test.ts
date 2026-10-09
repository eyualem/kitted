// The drawn closet tiles (#141): what each piece's flat draws from the reading and the closet call, the brand as a
// plain word, what VoiceOver says, and that every type renders cleanly. The summary row's words.
import { G, parseShade, shadeId } from '@kitted/core';
import type { ClosetArt, ClosetSummary } from '@/data/types';
import { artSpec } from '@/features/closet/artSpec';
import { renderFlat } from '@/features/closet/flats';
import { closetSummaryText, isPending } from '@/features/closet/summaryText';

const art = (o: Partial<ClosetArt> & { family: string }): ClosetArt => ({ shade: null, details: [], brand: null, shoeProfile: null, denimWear: null, ...o });
const piece = (g: ReturnType<typeof G>, a: ClosetArt | null, name: string) => ({ garment: g, hex: '#9CA0A6', art: a, name });

describe('artSpec', () => {
  it("the founder's hoodie: drawn with its hood, drawstrings and pouch, NIKE as a plain word, never a logo", () => {
    const s = artSpec(piece(G('top', 'hoodie', 'grey'), art({ family: 'grey', shade: shadeId(parseShade('medium grey')), brand: 'nike', details: ['drawstring', 'elastic_cuffs', 'front_pouch', 'hood'] }), 'Medium grey Nike hoodie'));
    expect(s.flat).toMatchObject({ kind: 'top', type: 'hoodie', color: '#9CA0A6', brand: 'NIKE', details: { drawstrings: true, pouch: true, fullZip: false, ribHem: true }, pattern: { type: 'solid' } });
    expect(s.a11y).toBe('Medium grey Nike hoodie, front pouch, drawstrings, cuffs');
    expect(renderFlat(s.flat)).toContain('>NIKE</text>');
  });
  it('a zip hoodie: the zip splits the pouch; heather gets the speckle', () => {
    const s = artSpec(piece(G('top', 'hoodie', 'grey'), art({ family: 'grey', shade: shadeId(parseShade('heather grey')), details: ['full_zip', 'hood', 'drawstring', 'front_pouch'] }), 'Heather grey zip hoodie'));
    expect(s.flat).toMatchObject({ details: { fullZip: true, pouch: true }, pattern: { type: 'heather' } });
    expect(s.glyphs.slice(0, 2)).toEqual(['fullZip', 'pouch']);
  });
  it('bottoms: the leg shape, the break and the wash come from the reading', () => {
    const s = artSpec(piece(G('bottom', 'jeans', 'black', { leg_shape: 'wide', hem: 'full_break' }), art({ family: 'black', denimWear: 'faded' }), 'Washed black jeans'));
    expect(s.flat).toMatchObject({ kind: 'bottom', type: 'jeans', fit: 'wide', hem: 'full_break', wash: 'faded', buttonColor: '#8D9096' });
    const cargo = artSpec(piece(G('bottom', 'chinos', 'olive'), art({ family: 'olive', details: ['cargo_pockets', 'side_stripe'] }), 'Olive cargos'));
    expect([cargo.flat.kind === 'bottom' && cargo.flat.type, cargo.glyphs]).toEqual(['cargos', ['sideStripe', 'cargoPockets']]);
    const joggers = artSpec(piece(G('bottom', 'sweatpants', 'grey'), null, 'Grey sweatpants'));
    expect(joggers.flat).toMatchObject({ type: 'joggers', fit: 'relaxed' });
  });
  it('shoes: each kind its own drawing; a chunky sole; the brand as a word', () => {
    const kinds = ['white_leather_sneaker', 'retro_runner', 'work_boot', 'suede_chukka', 'chelsea_boot', 'loafer', 'derby', 'slides_sandals'];
    expect(kinds.map((k) => { const f = artSpec(piece(G('footwear', k, 'brown'), art({ family: 'brown' }), 'x')).flat; return f.kind === 'shoe' ? f.type : null; }))
      .toEqual(['sneaker', 'runner', 'work_boot', 'chukka', 'chelsea', 'loafer', 'derby', 'slides']);
    const nb = artSpec(piece(G('footwear', 'chunky_sneaker', 'white'), art({ family: 'white', shoeProfile: 'chunky', brand: 'new_balance' }), 'White New Balance chunky sneakers'));
    expect([nb.flat, nb.glyphs]).toMatchObject([{ chunky: true, brand: 'NEW BALANCE' }, ['chunkySole']]);
  });
  it('a v3-only piece (no closet call yet): its type\'s usual details, no extra words', () => {
    const s = artSpec({ garment: G('top', 'hoodie', 'grey'), hex: '#9CA0A6', art: null, name: 'Grey hoodie' });
    expect([s.flat, s.a11y]).toMatchObject([{ details: { drawstrings: true, pouch: true } }, 'Grey hoodie']);
  });
  it('patterns from the scored reading: stripes, checks, a graphic print', () => {
    expect(artSpec(piece(G('top', 'tee', 'navy', { pattern: 'stripes' }), art({ family: 'navy' }), 'Navy tee')).flat.pattern?.type).toBe('stripes');
    expect(artSpec(piece(G('top', 'flannel_shirt', 'red', { pattern: 'checks_plaid' }), art({ family: 'red', details: ['collar', 'buttons'] }), 'Red flannel')).glyphs).toEqual(['checks', 'collarButtons']);
    const tee = artSpec(piece(G('top', 'graphic_tee', 'black', { pattern: 'graphic' }), art({ family: 'black' }), 'Black graphic tee'));
    expect([tee.flat.kind === 'top' && tee.flat.print, tee.glyphs]).toEqual([true, ['graphic']]);
  });
  it('every subcategory draws, in both themes, deterministically, with no unsafe text', () => {
    const subs = ['tee', 'polo', 'tank_top', 'oxford_shirt', 'overshirt', 'sweater', 'quarter_zip', 'cardigan', 'hoodie', 'denim_jacket', 'bomber', 'leather_jacket', 'puffer', 'blazer', 'overcoat', 'other'];
    for (const sub of subs) {
      const f = artSpec(piece(G('top', sub, 'navy'), art({ family: 'navy', brand: 'text:acme' }), sub)).flat;
      for (const scheme of ['light', 'dark'] as const) {
        const a = renderFlat(f, { scheme, id: 'x' });
        expect(a).toBe(renderFlat(f, { scheme, id: 'x' }));
        expect(a).not.toMatch(/NaN|undefined/);
      }
    }
    for (const sub of ['jeans', 'chinos', 'trousers', 'cargos', 'joggers', 'shorts']) expect(renderFlat(artSpec(piece(G('bottom', sub, 'khaki_beige'), art({ family: 'khaki_beige' }), sub)).flat)).not.toMatch(/NaN|undefined/);
    expect(renderFlat({ kind: 'top', type: 'tee', color: '#FFFFFF', brand: '<b>&"' })).toContain('&lt;b&gt;&amp;&quot;');
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
