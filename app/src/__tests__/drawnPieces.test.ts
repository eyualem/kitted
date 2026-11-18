// T101 · Pieces drawn without a closet row, and a watch, belt, cap and beanie (specs/kit-stylist-chat.md KC9.1, KC9.2,
// KC9.3, and KC2.2's drawing; tasks/T101/TESTING.md). The logic half: the real artSpec, renderFlat, drawnItem, core's G,
// FAMILY_HEX and displayHex. No store, no network, no mocks. "Draws" means renderFlat(artSpec(item).flat, { scheme, id: 'x' }).
//
// Profile (CLAUDE.md rule 6): the one scoring check uses s14's bundled reading, a stock photo, "profile unknown", run with
// one stated test profile: occasion everyday, no picked looks, boldness null, an empty closet, a first check. No photo.
import { displayHex, FAMILY_HEX, G, UNKNOWN_HEX, type ClosetItem, type Reading } from '@kitted/core';
import {
  artSpec, DRAWN_KINDS, drawnItem, pieceArtSpec, pieceSlotOf, type ArtItem, type DrawnPieceSpec, type PieceSlot,
} from '@/features/closet/artSpec';
import { METAL_HEX, renderFlat, WATCH_METALS, type FlatSpec, type WatchMetal } from '@/features/closet/flats';
import { VARIANTS } from '@/features/closet/kinds';
import { tileArtBox } from '@/features/closet/tileArt';
import { evaluateCheck, overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import baseline from './fixtures/flatsBaseline.json';

const { createHash } = jest.requireActual<{ createHash(a: string): { update(s: string): { digest(e: 'hex'): string } } }>('crypto');

type Scheme = 'light' | 'dark';
const SCHEMES: readonly Scheme[] = ['light', 'dark'];
const FAMILIES = Object.keys(FAMILY_HEX);
const FOUR = ['watch', 'belt', 'cap', 'beanie'] as const;
const BLACK = '#1E2026';
const WHITE = '#F2F0EA';
const GOLD = '#C9A44C';
const SILVER = '#C5C9CF';
const BLACK_METAL = '#2A2D34';
const ELEMENTS = ['svg', 'defs', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'linearGradient', 'radialGradient', 'stop', 'pattern'];

/** drawnItem, failing the test (not throwing "undefined") when it gives null. */
function must(piece: DrawnPieceSpec, hint?: PieceSlot): ArtItem {
  const it = drawnItem(piece, hint);
  if (it === null) throw new Error(`drawnItem gave null for ${JSON.stringify(piece)}`);
  return it;
}
const draw = (it: ArtItem, scheme: Scheme = 'light') => renderFlat(artSpec(it).flat, { scheme, id: 'x' });
const drawSpec = (p: DrawnPieceSpec, scheme: Scheme = 'light') => draw(must(p), scheme);
const elementsOf = (xml: string) => [...xml.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]!);
const fillsHex = (xml: string, hex: string) => new RegExp(`fill="${hex}"`, 'i').test(xml);
const clean = (xml: string) => {
  expect(xml).not.toMatch(/NaN|undefined/);
  expect(xml).not.toContain('<text');
  expect(xml).not.toContain('<image');
  expect(xml).not.toMatch(/href/i);
};
const flatOf = (it: ArtItem) => artSpec(it).flat as unknown as Record<string, unknown>;
const closetRow = (it: ArtItem, over: Record<string, unknown> = {}) => ({
  ...it, id: 'C-1', slot: 'accessory', source: 'chat', isPhotographed: false, photoFile: null, starterId: null, confirmedFields: [], wornCount: 0, lastWornAt: null,
  addedAt: 0, isDeleted: false, demoPhotoId: null, ...over,
});

// ──────────────────────────────────────────────────────────────────────────────────────────────── KC9.1
describe('KC9.1 · a watch, a belt, a cap and a beanie are drawn in code', () => {
  it('KC9.1 · the four accessories draw in every color and both themes', () => {
    expect(FAMILIES).toHaveLength(25);
    for (const kind of FOUR) {
      for (const family of FAMILIES) {
        const item = must({ kind, family, name: 'x' });
        const spec = artSpec(item);
        expect(spec.shape).toBe('accessory');
        expect(spec.flat.kind).toBe('accessory');
        expect((spec.flat as unknown as { type: string }).type).toBe(kind);
        for (const scheme of SCHEMES) {
          const xml = draw(item, scheme);
          expect(xml.startsWith('<svg')).toBe(true);
          expect(xml).toContain('viewBox="0 0 200 200"');
          // a watch in 'multicolor' (no strap color said) is a metal bracelet, silver when no metal is said; everything else is in its swatch
          if (kind === 'watch' && family === 'multicolor') expect(fillsHex(xml, SILVER)).toBe(true);
          else expect(fillsHex(xml, FAMILY_HEX[family]!)).toBe(true);
          clean(xml);
          for (const el of elementsOf(xml)) expect(ELEMENTS).toContain(el);
          expect(draw(item, scheme)).toBe(xml);
        }
      }
    }
  });

  it('KC9.1 · each accessory is its own drawing', () => {
    for (const scheme of SCHEMES) {
      for (const family of ['black', 'navy', 'tan_camel']) {
        const x = FOUR.map((kind) => drawSpec({ kind, family, name: 'x' }, scheme));
        for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(x[i]).not.toBe(x[j]); // 6 pairs, cap vs beanie among them
      }
      for (const kind of FOUR) {
        expect(drawSpec({ kind, family: 'black', name: 'x' }, scheme)).not.toBe(drawSpec({ kind, family: 'navy', name: 'x' }, scheme));
        expect(drawSpec({ kind, family: 'white', name: 'x' }, scheme)).not.toBe(drawSpec({ kind, family: 'tan_camel', name: 'x' }, scheme));
      }
    }
    // must not: an accessory that draws as a top (a tee-shaped watch)
    const tee = renderFlat({ kind: 'top', type: 'tee', color: BLACK }, { scheme: 'light', id: 'x' });
    for (const kind of FOUR) expect(drawSpec({ kind, family: 'black', name: 'x' })).not.toBe(tee);
  });

  it('KC9.1 · a black piece keeps an edge in dark and a white one in light', () => {
    const darkRim = '<g fill="none" stroke="#fff" stroke-opacity=".22"';
    const lightRim = 'stroke-opacity=".12" stroke-width="2.4"';
    for (const kind of FOUR) {
      expect(drawSpec({ kind, family: 'black', name: 'x' }, 'dark')).toContain(darkRim);
      expect(drawSpec({ kind, family: 'black', name: 'x' }, 'light')).not.toContain(darkRim);
      expect(drawSpec({ kind, family: 'white', name: 'x' }, 'light')).toContain(lightRim);
      expect(drawSpec({ kind, family: 'white', name: 'x' }, 'dark')).not.toContain(lightRim);
      // a middle color gets neither
      expect(drawSpec({ kind, family: 'tan_camel', name: 'x' }, 'dark')).not.toContain(darkRim);
      expect(drawSpec({ kind, family: 'tan_camel', name: 'x' }, 'light')).not.toContain(lightRim);
    }
  });

  it('KC9.1 · the accessory shape fills a tile like a top or pants', () => {
    // ('accessory' is a new ArtShape the implementer adds; cast so this file type-checks before and after)
    const ACC = 'accessory' as never;
    for (const w of [76, 110, 152]) expect(tileArtBox(ACC, w, w, 0.8)).toEqual({ size: Math.round(w * 0.8), dy: 0 });
    // the same box a top and pants get, not a shoe's
    expect(tileArtBox(ACC, 110, 110, 0.8)).toEqual(tileArtBox('top', 110, 110, 0.8));
    expect(tileArtBox(ACC, 110, 110, 0.8)).not.toEqual(tileArtBox('shoe', 110, 110, 0.8));
  });

  it('KC9.1 · every drawing that existed is byte-identical', () => {
    const tops = ['tee', 'polo', 'tank', 'crew', 'quarter_zip', 'cardigan', 'hoodie', 'shirt', 'overshirt', 'denim_jacket', 'bomber', 'jacket', 'puffer', 'blazer', 'coat'];
    const bottoms = ['jeans', 'chinos', 'trousers', 'cargos', 'joggers', 'shorts'];
    const shoes = ['sneaker', 'runner', 'work_boot', 'chukka', 'chelsea', 'loafer', 'derby', 'slides'];
    const keys: string[] = [];
    let different = 0;
    for (const [kind, types] of [['top', tops], ['bottom', bottoms], ['shoe', shoes]] as const) {
      for (const type of types) {
        for (const color of [BLACK, WHITE, '#B98E62']) {
          for (const scheme of SCHEMES) {
            const key = `${kind}|${type}|${color}|${scheme}`;
            keys.push(key);
            const sha = createHash('sha256').update(renderFlat({ kind, type, color } as FlatSpec, { scheme, id: 'x' })).digest('hex');
            if ((baseline as Record<string, string>)[key] !== sha) different++;
          }
        }
      }
    }
    expect(keys).toHaveLength(174); // 29 types x 3 colors x 2 schemes
    expect(Object.keys(baseline).sort()).toEqual([...keys].sort()); // the fixture holds all of them: no entry dropped to pass
    expect(different).toBe(0);
  });

  it('KC9.1 · an accessory never draws a brand word or any text', () => {
    for (const kind of FOUR) {
      const f = flatOf(must({ kind, family: 'navy', name: 'Nike cap', metal: 'gold', face: 'digital' }));
      for (const scheme of SCHEMES) {
        const xml = renderFlat({ ...f, brand: 'NIKE' } as unknown as FlatSpec, { scheme, id: 'x' });
        expect(xml).not.toContain('NIKE');
        expect(xml).not.toContain('<text');
        clean(xml);
      }
    }
  });

  it('KC9.1 · what is stored redraws the same (Past chats), and junk input never throws', () => {
    const pieces: DrawnPieceSpec[] = [
      { kind: 'watch', family: 'multicolor', name: 'Gold digital watch', metal: 'gold', face: 'digital' },
      { kind: 'belt', family: 'black', name: 'Black belt' }, { kind: 'cap', family: 'navy', name: 'Navy cap' },
      { kind: 'beanie', family: 'charcoal', name: 'Charcoal beanie' }, { kind: 'work_boot', family: 'black', name: 'Black work boots' },
      { kind: 'bomber', family: 'tan_camel', name: 'Tan bomber' }, { kind: 'henley', family: 'white', name: 'White henley' },
    ];
    for (const p of pieces) {
      const it = must(p);
      const back = JSON.parse(JSON.stringify(it)) as ArtItem;
      for (const scheme of SCHEMES) expect(draw(back, scheme)).toBe(draw(it, scheme));
      expect(artSpec(back)).toEqual(artSpec(it));
    }
    const junk: DrawnPieceSpec[] = [
      { kind: '', family: '', name: '' }, { kind: 'watch', family: '', name: '', metal: 'copper' as WatchMetal },
      { kind: 'belt', family: 'teal', name: '' }, { kind: 'cap', family: '', name: 'x', face: 'round' as never },
    ];
    for (const p of junk) {
      expect(() => drawnItem(p)).not.toThrow();
      expect(() => drawnItem(p, 'top')).not.toThrow();
      expect(() => pieceArtSpec(p)).not.toThrow();
      const it = drawnItem(p, 'top');
      expect(it).not.toBeNull();
      for (const scheme of SCHEMES) clean(draw(it!, scheme));
    }
    const odd = must({ kind: 'watch', family: '', name: '', metal: 'copper' as WatchMetal });
    expect(draw(odd)).toContain(SILVER); // an unknown metal draws silver
    expect(drawnItem({ kind: '', family: '', name: '' })).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────────────────────── KC9.2
describe('KC9.2 · a watch can show a metal, and accessories never move a score', () => {
  it("KC9.2 · a watch's metal changes the case and nothing else", () => {
    expect(WATCH_METALS).toEqual(['gold', 'silver', 'black']);
    expect(METAL_HEX).toEqual({ gold: GOLD, silver: SILVER, black: BLACK_METAL });
    const hexOf: Record<string, string> = { gold: GOLD, silver: SILVER, black: BLACK_METAL };
    const made = (['gold', 'silver', 'black'] as const).map((metal) => ({ metal, item: must({ kind: 'watch', family: 'black', name: 'x', metal }) }));
    for (const { metal, item } of made) {
      expect(flatOf(item)).toMatchObject({ kind: 'accessory', type: 'watch', metal, color: BLACK });
      for (const scheme of SCHEMES) {
        const xml = draw(item, scheme);
        expect(xml).toContain(hexOf[metal]!);
        expect(fillsHex(xml, BLACK)).toBe(true); // the strap stays the family's color
        clean(xml);
      }
      expect(item.garment.color_family).toBe('black');
      expect(item.art!.family).toBe('black');
      expect(item.hex).toBe(BLACK);
      expect(item.art!.details).toContain(`metal_${metal}`);
      for (const other of ['gold', 'silver', 'black'].filter((m) => m !== metal)) expect(item.art!.details).not.toContain(`metal_${other}`);
    }
    for (const scheme of SCHEMES) {
      const [g, s, b] = made.map((m) => draw(m.item, scheme));
      expect(new Set([g, s, b]).size).toBe(3);
    }
  });

  it('KC9.2 · metal is not a color family', () => {
    expect(FAMILIES).toHaveLength(25);
    expect(FAMILIES).not.toContain('gold');
    expect(FAMILIES).not.toContain('silver');
    // 'black' IS a family (a black strap); the metal 'black' is a case tone and never moves the family (see the test above)
    for (const family of ['gold', 'silver']) {
      const it = must({ kind: 'watch', family, name: 'x' });
      expect(it.hex).toBe('#9CA0A6');
      expect(flatOf(it).color).toBe('#9CA0A6');
      expect(fillsHex(draw(it), '#9CA0A6')).toBe(true);
      expect(draw(it)).not.toContain(GOLD); // a family named gold is not a gold strap
    }
    // a metal moves nothing about the piece's color, for every family
    for (const family of FAMILIES) {
      const plain = must({ kind: 'watch', family, name: 'x' });
      const gold = must({ kind: 'watch', family, name: 'x', metal: 'gold' });
      expect([gold.hex, gold.garment.color_family, gold.art!.family]).toEqual([plain.hex, plain.garment.color_family, plain.art!.family]);
    }
  });

  it('KC9.2 · metal and face are for watches only', () => {
    for (const kind of ['belt', 'cap', 'beanie'] as const) {
      const bare = must({ kind, family: 'brown', name: 'x' });
      for (const extra of [{ metal: 'gold' as const }, { metal: 'black' as const }, { face: 'digital' as const }, { metal: 'gold' as const, face: 'digital' as const }]) {
        const withExtra = must({ kind, family: 'brown', name: 'x', ...extra });
        for (const scheme of SCHEMES) expect(draw(withExtra, scheme)).toBe(draw(bare, scheme));
        expect(withExtra).toEqual(bare); // nothing about it carries the metal or the face
      }
      expect(draw(bare)).not.toContain(GOLD);
    }
    // and a non-accessory ignores them too
    expect(must({ kind: 'tee', family: 'navy', name: 'x', metal: 'gold', face: 'digital' })).toEqual(must({ kind: 'tee', family: 'navy', name: 'x' }));
  });

  it('KC9.2 · metal, face and bracelet on a belt, cap or beanie flat draw nothing different', () => {
    // The drawing itself ignores them (flats.ts), even when a flat somehow carries them; and artSpec never puts them there.
    for (const kind of ['belt', 'cap', 'beanie'] as const) {
      for (const family of ['brown', 'black', 'multicolor']) {
        const item = must({ kind, family, name: 'x' });
        const flat = artSpec(item).flat as FlatSpec;
        for (const scheme of SCHEMES) {
          const bare = renderFlat(flat, { scheme, id: 'x' });
          for (const metal of ['gold', 'silver', 'black'] as const) {
            const loaded = renderFlat({ ...flat, metal, face: 'digital', bracelet: true } as FlatSpec, { scheme, id: 'x' });
            expect(loaded).toBe(bare);
            expect(loaded).not.toContain(METAL_HEX[metal]);
          }
          expect(bare).not.toContain(GOLD);
        }
        // a stored row that says metal_gold and digital: the flat has no metal, face or bracelet
        const row = { ...item, art: { ...item.art!, details: ['metal_gold', 'digital'] } } as ArtItem;
        const rowFlat = artSpec(row).flat as unknown as Record<string, unknown>;
        expect(rowFlat.metal).toBeUndefined();
        expect(rowFlat.face).toBeUndefined();
        expect(rowFlat.bracelet).toBeUndefined();
        expect('metal' in rowFlat || 'face' in rowFlat || 'bracelet' in rowFlat).toBe(false);
        expect(artSpec(row).flat).toEqual(artSpec(item).flat);
        for (const scheme of SCHEMES) expect(draw(row, scheme)).toBe(draw(item, scheme));
      }
    }
  });

  it("KC9.2 · a watch with no strap color is a bracelet in its metal", () => {
    // no metal: silver, and unset on the flat
    const none = must({ kind: 'watch', family: 'black', name: 'x' });
    expect(flatOf(none).metal).toBeUndefined();
    for (const scheme of SCHEMES) expect(draw(none, scheme)).toContain(SILVER);
    // unknown metal in the details = no metal; two metals at once: gold, then silver, then black
    const withDetails = (details: string[]) => ({ ...none, art: { ...none.art!, details } }) as ArtItem;
    const copper = withDetails(['metal_copper']);
    expect(artSpec(copper).flat).toEqual(artSpec(none).flat);
    expect(draw(copper)).toBe(draw(none));
    expect(flatOf(withDetails(['metal_silver', 'metal_gold'])).metal).toBe('gold');
    expect(flatOf(withDetails(['metal_gold', 'metal_silver'])).metal).toBe('gold');
    expect(flatOf(withDetails(['metal_black', 'metal_silver'])).metal).toBe('silver');
    expect(flatOf(withDetails(['metal_black', 'metal_gold'])).metal).toBe('gold');
    expect(draw(withDetails(['metal_silver', 'metal_gold']))).toContain(GOLD);
    // multicolor + gold: a bracelet in gold
    const bracelet = must({ kind: 'watch', family: 'multicolor', name: 'Gold watch', metal: 'gold' });
    expect(flatOf(bracelet).bracelet).toBe(true);
    for (const scheme of SCHEMES) expect(draw(bracelet, scheme)).toContain(GOLD);
    expect(bracelet.garment.color_family).toBe('multicolor');
    // the same grey, said as a grey strap: a strap, not a bracelet, and drawn differently
    const grey = must({ kind: 'watch', family: 'grey', name: 'Grey strap watch', metal: 'gold' });
    expect(flatOf(grey).bracelet).toBeFalsy();
    expect(draw(grey)).not.toBe(draw(bracelet));
    // black strap + gold case: no bracelet, strap black, case gold
    const strap = must({ kind: 'watch', family: 'black', name: 'x', metal: 'gold' });
    expect(flatOf(strap).bracelet).toBeFalsy();
    expect(fillsHex(draw(strap), BLACK)).toBe(true);
    expect(draw(strap)).toContain(GOLD);
  });

  it('KC9.2 · a digital face', () => {
    for (const metal of ['gold', 'silver', 'black'] as const) {
      const analog = must({ kind: 'watch', family: 'black', name: 'x', metal });
      const digital = must({ kind: 'watch', family: 'black', name: 'x', metal, face: 'digital' });
      expect(flatOf(analog).face).toBeUndefined();
      expect(flatOf(digital).face).toBe('digital');
      expect(digital.art!.details).toContain('digital');
      expect(analog.art!.details).not.toContain('digital');
      for (const scheme of SCHEMES) {
        expect(draw(digital, scheme)).not.toBe(draw(analog, scheme));
        expect(draw(digital, scheme)).not.toContain('<text');
        clean(draw(digital, scheme));
      }
    }
    // read from a stored row's details, not only from the spec
    const base = must({ kind: 'watch', family: 'black', name: 'x', metal: 'gold' });
    const fromDetails = { ...base, art: { ...base.art!, details: ['metal_gold', 'digital'] } } as ArtItem;
    expect(flatOf(fromDetails)).toMatchObject({ face: 'digital', metal: 'gold' });
  });

  it('KC9.2 · an accessory moves no score', () => {
    const reading = demoReadingById('s14')!;
    const base = { occasion: 'everyday' as const, styles: [], boldness: null, closet: [] as ClosetItem[], firstCheck: true };
    const plain = evaluateCheck({ reading, ...base });
    expect(plain.row.status).toBe('scored');
    expect(plain.row.score).not.toBeNull();
    const opts = scoreOptions({ occasion: 'everyday', styles: [], boldness: null });
    const accessories = [
      G('accessory', 'watch', 'black'), G('accessory', 'belt', 'black'), G('accessory', 'hat', 'navy'), G('accessory', 'cap', 'navy'),
      G('accessory', 'beanie', 'charcoal'), G('accessory', 'watch', 'multicolor'),
    ];
    for (const garment of accessories) {
      const withIt: Reading = { ...reading, garments: [...reading.garments, garment] };
      const ev = evaluateCheck({ reading: withIt, ...base });
      expect(ev.row.score).toBe(plain.row.score);
      expect(ev.row.rawScore).toBe(plain.row.rawScore);
      expect(ev.row.subscores).toEqual(plain.row.subscores);
      expect(ev.row.fixes).toEqual(plain.row.fixes);
      expect(ev.row).toEqual(plain.row);
      expect(ev.fixes).toEqual(plain.fixes);
      expect(overallFor(withIt, opts)).toBe(overallFor(reading, opts));
      expect(overallFor(withIt, opts, 'v4')).toBe(overallFor(reading, opts, 'v4'));
    }
    // a closet-shaped accessory row with a metal, in the closet the fixes read
    for (const kind of ['watch', 'belt', 'cap', 'beanie'] as const) {
      const it = must({ kind, family: 'black', name: `Gold ${kind}`, ...(kind === 'watch' ? { metal: 'gold' as const } : {}) });
      const row = closetRow(it, { name: `Gold ${kind}` }) as unknown as ClosetItem;
      const ev = evaluateCheck({ reading, ...base, closet: [row] });
      expect(ev.row).toEqual(plain.row);
      expect(ev.fixes).toEqual(plain.fixes);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────────────────────── KC9.3
describe('KC9.3 · a piece added from chat draws the same in Closet', () => {
  const pieces: DrawnPieceSpec[] = [
    { kind: 'watch', family: 'multicolor', metal: 'gold', face: 'digital', name: 'Gold digital watch' },
    { kind: 'belt', family: 'black', name: 'Black belt' },
    { kind: 'cap', family: 'navy', name: 'Navy cap' },
    { kind: 'beanie', family: 'charcoal', name: 'Charcoal beanie' },
  ];

  it('KC9.3 · a closet row built from a drawn piece draws the same picture', () => {
    for (const p of pieces) {
      const it = must(p);
      const row = closetRow(it) as unknown as ArtItem;
      const spec = artSpec(row);
      expect(spec).toEqual(artSpec(it));
      expect(spec.shape).toBe('accessory');
      expect(spec.a11y).toBe(p.name);
      expect(spec.glyphs).toEqual([]);
      expect(row.hex).toBe(displayHex(p.family));
      for (const scheme of SCHEMES) expect(draw(row, scheme)).toBe(draw(it, scheme));
    }
    expect(flatOf(must(pieces[0]!))).toMatchObject({ type: 'watch', metal: 'gold', bracelet: true, face: 'digital' });
    expect(flatOf(must(pieces[1]!))).toMatchObject({ type: 'belt' });
    expect(flatOf(must(pieces[2]!)).type).toBe('cap');
    expect(flatOf(must(pieces[3]!)).type).toBe('beanie');
    // the chat card's drawing and the row's are one: pieceArtSpec gives the same for the drawn piece and for the row
    for (const p of pieces) expect(pieceArtSpec(p)).toEqual(artSpec(closetRow(must(p)) as unknown as ArtItem));
  });

  it("KC9.3 · a reading's hat draws as a cap and other accessories are as before", () => {
    const row = (g: ReturnType<typeof G>, name: string): ArtItem => ({ garment: g, hex: displayHex(g.color_family), art: null, name });
    const hat = artSpec(row(G('accessory', 'hat', 'navy'), 'Navy hat'));
    expect([hat.shape, hat.flat.kind]).toEqual(['accessory', 'accessory']);
    expect(hat.flat).toMatchObject({ type: 'cap', color: FAMILY_HEX.navy });
    expect(hat.a11y).toBe('Navy hat');
    for (const sub of ['bag', 'other']) {
      const s = artSpec(row(G('accessory', sub, 'black'), 'Black thing'));
      expect(s.shape).toBe('top');
      expect(s.flat.kind).toBe('top');
      expect((s.flat as unknown as { type: string }).type).toBe('tee');
      expect(s.a11y).toBe('Black thing');
    }
    // the same as a plain tee: no new fallback was added and none removed
    expect(artSpec(row(G('accessory', 'bag', 'black'), 'x')).flat).toEqual(artSpec(row(G('top', 'tee', 'black'), 'x')).flat);
  });

  it('KC9.3 · a piece with no art at all still draws as its subcategory says', () => {
    const bare = (sub: string, family: string): ArtItem => ({ garment: G('accessory', sub, family), hex: displayHex(family), art: null, name: `A ${sub}` });
    expect(() => artSpec(bare('beanie', 'black'))).not.toThrow();
    expect(artSpec(bare('beanie', 'black')).flat).toMatchObject({ kind: 'accessory', type: 'beanie', color: BLACK });
    expect(artSpec(bare('cap', 'navy')).flat).toMatchObject({ kind: 'accessory', type: 'cap' });
    expect(artSpec(bare('belt', 'brown')).flat).toMatchObject({ kind: 'accessory', type: 'belt' });
    const watch = artSpec(bare('watch', 'black'));
    expect(watch.shape).toBe('accessory');
    expect(watch.flat).toMatchObject({ kind: 'accessory', type: 'watch', color: BLACK });
    expect((watch.flat as unknown as { metal?: string }).metal).toBeUndefined();
    expect((watch.flat as unknown as { bracelet?: boolean }).bracelet).toBeFalsy();
    expect(renderFlat(watch.flat, { id: 'x' })).toContain(SILVER);
    expect(artSpec(bare('watch', 'multicolor')).flat).toMatchObject({ bracelet: true });
  });
});

// ──────────────────────────────────────────────────────────────────────────────────────────────── KC2.2
describe('KC2.2 · a piece he does not own is drawn in a named color', () => {
  const SLOT_KINDS = ['tee', 'bomber', 'chinos', 'work_boot'];

  it("KC2.2 · a drawn piece is drawn in its family's swatch", () => {
    for (const family of FAMILIES) {
      for (const kind of SLOT_KINDS) {
        const it = must({ kind, family, name: 'x' });
        const hex = FAMILY_HEX[family]!;
        expect(it.hex).toBe(hex);
        expect(flatOf(it).color).toBe(hex);
        for (const scheme of SCHEMES) {
          expect(draw(it, scheme).toLowerCase()).toContain(hex.toLowerCase());
          clean(draw(it, scheme));
        }
      }
    }
    expect(drawSpec({ kind: 'work_boot', family: 'black', name: 'Black work boots' })).toContain(BLACK);
    expect(flatOf(must({ kind: 'work_boot', family: 'black', name: 'Black work boots' })).color).toBe(BLACK);
  });

  it('KC2.2 · a drawn piece needs no closet row', () => {
    const real = globalThis.fetch;
    const fetchSpy = jest.fn(() => { throw new Error('network'); });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      for (const kind of [...SLOT_KINDS, 'watch', 'cap']) {
        const it = must({ kind, family: 'navy', name: 'x' });
        expect(Object.keys(it).sort()).toEqual(['art', 'garment', 'hex', 'name']);
        for (const k of ['id', 'slot', 'isPhotographed', 'source', 'photoFile', 'starterId']) expect(Object.keys(it)).not.toContain(k);
      }
    } finally {
      globalThis.fetch = real;
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    // and no state leaks between calls: the same facts give equal pieces
    expect(must({ kind: 'bomber', family: 'tan_camel', name: 'Tan bomber' })).toEqual(must({ kind: 'bomber', family: 'tan_camel', name: 'Tan bomber' }));
  });

  it('KC2.2 · every kind draws', () => {
    const tops = [
      'tee', 'graphic_tee', 'jersey', 'tank_top', 'polo', 'knit_polo', 'oxford_shirt', 'dress_shirt', 'flannel_shirt', 'camp_collar_shirt', 'overshirt', 'chore_coat',
      'sweater', 'sweatshirt', 'fleece', 'rugby_shirt', 'quarter_zip', 'cardigan', 'hoodie', 'denim_jacket', 'bomber', 'leather_jacket', 'field_jacket', 'shell_jacket',
      'rain_jacket', 'puffer', 'blazer', 'unstructured_blazer', 'sport_coat', 'suit_jacket', 'overcoat', 'henley', 'button_up_shirt', 'short_sleeve_shirt', 'turtleneck', 'zip_hoodie',
    ];
    const bottoms = ['jeans', 'chinos', 'trousers', 'suit_trousers', 'drawstring_trousers', 'cargos', 'joggers', 'sweatpants', 'shorts', 'athletic_shorts', 'jorts'];
    const shoes = [
      'white_leather_sneaker', 'canvas_sneaker', 'low_profile_sneaker', 'basketball_sneaker', 'chunky_sneaker', 'retro_runner', 'performance_runner', 'work_boot',
      'suede_chukka', 'chelsea_boot', 'loafer', 'dress_shoe', 'derby', 'slides_sandals',
    ];
    const outer = [
      'chore_coat', 'denim_jacket', 'bomber', 'leather_jacket', 'field_jacket', 'shell_jacket', 'rain_jacket', 'puffer', 'blazer', 'unstructured_blazer', 'sport_coat',
      'suit_jacket', 'overcoat',
    ];
    expect(DRAWN_KINDS).toHaveLength(tops.length + bottoms.length + shoes.length + 4); // 65
    expect(new Set(DRAWN_KINDS).size).toBe(DRAWN_KINDS.length);
    expect(DRAWN_KINDS).toEqual(expect.arrayContaining([...tops, ...bottoms, ...shoes, ...FOUR]));
    for (const k of ['chelsea_boot', 'overshirt', 'henley', 'jorts', 'watch', 'belt', 'cap', 'beanie']) expect(DRAWN_KINDS).toContain(k);
    expect(DRAWN_KINDS).not.toContain('bag');
    for (const kind of DRAWN_KINDS) {
      expect(pieceSlotOf(kind)).not.toBeNull();
      const it = must({ kind, family: 'olive', name: 'x' });
      for (const scheme of SCHEMES) clean(draw(it, scheme));
    }
    for (const k of tops) expect(pieceSlotOf(k)).toBe(outer.includes(k) ? 'outer' : 'top');
    for (const k of bottoms) expect(pieceSlotOf(k)).toBe('bottom');
    for (const k of shoes) expect(pieceSlotOf(k)).toBe('shoes');
    for (const k of FOUR) expect(pieceSlotOf(k)).toBe('accessory');
    expect([pieceSlotOf('bomber'), pieceSlotOf('tee'), pieceSlotOf('jeans'), pieceSlotOf('loafer'), pieceSlotOf('watch'), pieceSlotOf('bag')])
      .toEqual(['outer', 'top', 'bottom', 'shoes', 'accessory', null]);
    expect(pieceSlotOf('')).toBeNull();
    expect(pieceSlotOf('spaceship')).toBeNull();
    // each slot's category, as a reading names it
    expect(must({ kind: 'bomber', family: 'black', name: 'x' }).garment.category).toBe('outerwear');
    expect(must({ kind: 'tee', family: 'black', name: 'x' }).garment.category).toBe('top');
    expect(must({ kind: 'jeans', family: 'black', name: 'x' }).garment.category).toBe('bottom');
    expect(must({ kind: 'loafer', family: 'black', name: 'x' }).garment.category).toBe('footwear');
    expect(must({ kind: 'beanie', family: 'black', name: 'x' }).garment).toMatchObject({ category: 'accessory', subcategory: 'beanie' });
    expect(must({ kind: 'cap', family: 'black', name: 'x' }).garment).toMatchObject({ category: 'accessory', subcategory: 'cap' });
    // the closet-only kinds keep the reading's kind in subcategory and their own key in art.kind, as Closet stores them
    for (const [key, v] of Object.entries(VARIANTS)) {
      const it = must({ kind: key, family: 'navy', name: 'x' });
      expect(it.garment.subcategory).toBe(v.sub);
      expect(it.art!.kind).toBe(key);
    }
  });

  it("KC2.2 · a kind that can't be drawn is the slot's stand-in or nothing", () => {
    const bag = { kind: 'bag', family: 'black', name: 'Black bag' };
    const stand: [PieceSlot, Record<string, unknown>, string][] = [
      ['shoes', { kind: 'shoe', type: 'sneaker', color: BLACK }, 'low_profile_sneaker'],
      ['top', { kind: 'top', type: 'tee', color: BLACK }, 'tee'],
      ['outer', { kind: 'top', type: 'jacket', color: BLACK }, 'field_jacket'],
      ['bottom', { kind: 'bottom', type: 'chinos', color: BLACK }, 'chinos'],
    ];
    for (const [hint, flat, sub] of stand) {
      const it = must(bag, hint);
      expect(flatOf(it)).toMatchObject(flat);
      expect(it.garment.subcategory).toBe(sub);
      expect(it.name).toBe('Black bag');
      expect(it.hex).toBe(BLACK);
      expect(pieceArtSpec(bag, hint)).toEqual(artSpec(it));
    }
    expect(drawnItem(bag)).toBeNull();
    expect(drawnItem(bag, 'accessory')).toBeNull();
    expect(pieceArtSpec(bag)).toBeNull();
    expect(pieceArtSpec(bag, 'accessory')).toBeNull();
    expect(drawnItem({ kind: 'ring', family: 'grey', name: 'Silver ring' }, 'accessory')).toBeNull();
    // the hint only matters for a kind that can't be drawn
    expect(must({ kind: 'bomber', family: 'black', name: 'x' }, 'shoes')).toEqual(must({ kind: 'bomber', family: 'black', name: 'x' }));
    expect(must({ kind: 'watch', family: 'black', name: 'x' }, 'top')).toEqual(must({ kind: 'watch', family: 'black', name: 'x' }));
    // an unknown family is grey, never the near-white unknown swatch
    const teal = must({ kind: 'tee', family: 'teal', name: 'x' });
    expect(teal.hex).toBe('#9CA0A6');
    expect(teal.hex).not.toBe(UNKNOWN_HEX);
    expect(UNKNOWN_HEX).toBe('#ECEEF1');
    expect(flatOf(teal).color).toBe('#9CA0A6');
    expect(draw(teal).toLowerCase()).not.toContain('#eceef1');
    expect(must({ kind: 'bag', family: 'teal', name: 'x' }, 'top').hex).toBe('#9CA0A6');
  });

  it('KC2.2 · the name never decides the color', () => {
    const brownName = must({ kind: 'work_boot', family: 'black', name: 'Brown boots' });
    expect(brownName.hex).toBe(BLACK);
    expect(flatOf(brownName).color).toBe(BLACK);
    expect(draw(brownName)).toBe(draw(must({ kind: 'work_boot', family: 'black', name: 'Black work boots' })));
    expect(brownName.name).toBe('Brown boots');
    for (const name of ['Red tee', 'Bright orange tee', '']) {
      const it = must({ kind: 'tee', family: 'navy', name });
      expect(it.hex).toBe(FAMILY_HEX.navy);
      expect(draw(it)).toBe(draw(must({ kind: 'tee', family: 'navy', name: 'x' })));
    }
    // and the name never decides the kind
    expect(flatOf(must({ kind: 'cap', family: 'black', name: 'Black beanie' })).type).toBe('cap');
  });

  it('KC2.2 · a henley draws as Closet draws a henley', () => {
    const it = must({ kind: 'henley', family: 'white', name: 'White henley' });
    expect(it.garment.subcategory).toBe('tee');
    expect(it.art!.kind).toBe('henley');
    expect(flatOf(it)).toMatchObject({ kind: 'top', type: 'tee', neck: 'henley', color: FAMILY_HEX.white });
  });

  it('KC2.2 · pieceArtSpec reads a closet row, a reading garment and a drawn piece alike', () => {
    const p: DrawnPieceSpec = { kind: 'work_boot', family: 'black', name: 'Black work boots' };
    const it = must(p);
    expect(pieceArtSpec(p)).toEqual(artSpec(it));
    expect(pieceArtSpec(it)).toEqual(artSpec(it));
    expect(pieceArtSpec(closetRow(it) as unknown as ArtItem)).toEqual(artSpec(it));
  });
});

// ──────────────────────────────────────────────────────────────────────────────────────────────── round 2: gaps the verifier planted
// Each test builds the flat itself and calls renderFlat, so it pins the drawing's own dispatch and branches (flats.ts),
// not artSpec. Markers are structural: a path or element only that drawing has. Added, never loosening an earlier test.
const acc = (type: 'watch' | 'belt' | 'cap' | 'beanie', color: string, extra: Record<string, unknown> = {}) =>
  ({ kind: 'accessory', type, color, ...extra }) as unknown as FlatSpec;
const COLORS: Record<string, string> = { black: BLACK, white: WHITE, navy: FAMILY_HEX.navy, tan: FAMILY_HEX.tan_camel, brown: FAMILY_HEX.brown };
const count = (xml: string, needle: string) => xml.split(needle).length - 1;
const CAP_BRIM = 'd="M142,98 C170,92 198,106 198,124 C190,138 160,140 122,140 Z"';
const CAP_WRAP = '<g transform="translate(0,12)">';
const CAP_BUTTON = '<circle cx="96" cy="33" r="6"';
const BEANIE_CUFF = 'd="M26,106 Q26,100 34,100 L166,100';
const BEANIE_CUFF_RIBS = 'M36,104 V164';
const BEANIE_CROWN_RIBS = 'M94,32 C';
const BELT_TURN = 'rotate(-8 100 100)';
const WATCH_CROWN = '<rect x="134" y="92" width="11" height="16"';

describe('KC9.1 · which drawing each accessory type gets (round 2, N12)', () => {
  it('KC9.1 · a cap flat draws a cap (brim and button) and a beanie flat draws a beanie (rib and cuff), in every scheme and color', () => {
    for (const scheme of SCHEMES) {
      for (const [name, hex] of Object.entries(COLORS)) {
        const cap = renderFlat(acc('cap', hex), { scheme, id: 'x' });
        const beanie = renderFlat(acc('beanie', hex), { scheme, id: 'x' });
        const label = `${name} ${scheme}`;
        // cap: a brim, a button on the crown, panel seams, and no knit
        expect([label, cap.includes(CAP_BRIM)]).toEqual([label, true]);
        expect([label, cap.includes(CAP_WRAP)]).toEqual([label, true]);
        expect([label, count(cap, CAP_BUTTON)]).toEqual([label, 1]);
        expect([label, count(cap, '<circle')]).toEqual([label, 3]); // the button and two eyelets
        expect([label, cap.includes(BEANIE_CUFF)]).toEqual([label, false]);
        expect([label, cap.includes(BEANIE_CUFF_RIBS)]).toEqual([label, false]);
        expect([label, cap.includes(BEANIE_CROWN_RIBS)]).toEqual([label, false]);
        // beanie: knit ribs on the crown, a ribbed cuff, and no brim, button or circle at all
        expect([label, beanie.includes(BEANIE_CUFF)]).toEqual([label, true]);
        expect([label, beanie.includes(BEANIE_CUFF_RIBS)]).toEqual([label, true]);
        expect([label, beanie.includes(BEANIE_CROWN_RIBS)]).toEqual([label, true]);
        expect([label, count(beanie, '<circle')]).toEqual([label, 0]);
        expect([label, beanie.includes(CAP_BRIM)]).toEqual([label, false]);
        expect([label, beanie.includes(CAP_WRAP)]).toEqual([label, false]);
        expect([label, beanie.includes(CAP_BUTTON)]).toEqual([label, false]);
      }
    }
  });

  it('KC9.1 · each drawn kind carries its own marker, so no type draws as another (watch, belt, cap, beanie)', () => {
    const marks: Record<string, string> = { watch: WATCH_CROWN, belt: BELT_TURN, cap: CAP_BRIM, beanie: BEANIE_CUFF };
    for (const scheme of SCHEMES) {
      for (const hex of [BLACK, WHITE, COLORS.brown!]) {
        for (const type of FOUR) {
          const xml = renderFlat(acc(type, hex), { scheme, id: 'x' });
          for (const [other, mark] of Object.entries(marks)) expect([scheme, hex, type, other, xml.includes(mark)]).toEqual([scheme, hex, type, other, other === type]);
        }
      }
    }
    // and the same through a drawn piece: the kind he names is the drawing he gets
    for (const kind of FOUR) {
      for (const scheme of SCHEMES) {
        const xml = drawSpec({ kind, family: 'navy', name: 'x' }, scheme);
        for (const [other, mark] of Object.entries(marks)) expect([kind, other, xml.includes(mark)]).toEqual([kind, other, other === kind]);
      }
    }
  });
});

describe('KC9.2 · a digital face and a bracelet draw their own parts (round 2, N1, N10, N2)', () => {
  const DISPLAY = '#0C0E11';
  const LIT = '#B7F0D2';
  const METALS = ['gold', 'silver', 'black'] as const;

  it('KC9.2 · a digital watch draws the dark display and lit digits and no hands; an analog one draws hands and neither', () => {
    for (const scheme of SCHEMES) {
      for (const metal of METALS) {
        for (const color of [BLACK, COLORS.brown!, WHITE]) {
          const tag = `${scheme} ${metal} ${color}`;
          const digital = renderFlat(acc('watch', color, { metal, face: 'digital' }), { scheme, id: 'x' });
          const analog = renderFlat(acc('watch', color, { metal }), { scheme, id: 'x' });
          // digital: the display panel, the lit-digit stroke (the ghost digits at .1 and the lit ones at full), the colon dots
          expect([tag, digital.includes(DISPLAY)]).toEqual([tag, true]);
          expect([tag, count(digital, `stroke="${LIT}"`)]).toEqual([tag, 2]);
          expect([tag, count(digital, `fill="${LIT}"`)]).toEqual([tag, 2]);
          expect([tag, count(digital, '<polygon')]).toEqual([tag, 0]);
          expect([tag, digital.includes('#F6F5F1')]).toEqual([tag, false]); // no analog dial
          expect([tag, digital.includes('#1A1C22')]).toEqual([tag, false]);
          // analog: two hands, a dial, no display and no lit digits
          expect([tag, count(analog, '<polygon')]).toEqual([tag, 2]);
          expect([tag, analog.includes(DISPLAY)]).toEqual([tag, false]);
          expect([tag, analog.includes(LIT)]).toEqual([tag, false]);
          expect([tag, analog.includes(metal === 'black' ? '#1A1C22' : '#F6F5F1')]).toEqual([tag, true]);
          expect([tag, analog.includes(metal === 'black' ? '#F6F5F1' : '#1A1C22')]).toEqual([tag, false]);
        }
      }
      // an explicit 'analog' is the unset face
      expect(renderFlat(acc('watch', BLACK, { metal: 'gold', face: 'analog' }), { scheme, id: 'x' })).toBe(renderFlat(acc('watch', BLACK, { metal: 'gold' }), { scheme, id: 'x' }));
    }
    // through a drawn piece, as the user adds one
    for (const scheme of SCHEMES) {
      const d = drawSpec({ kind: 'watch', family: 'black', name: 'x', metal: 'gold', face: 'digital' }, scheme);
      const a = drawSpec({ kind: 'watch', family: 'black', name: 'x', metal: 'gold' }, scheme);
      expect([d.includes(DISPLAY), d.includes(LIT), count(d, '<polygon')]).toEqual([true, true, 0]);
      expect([a.includes(DISPLAY), a.includes(LIT), count(a, '<polygon')]).toEqual([false, false, 2]);
    }
  });

  it('KC9.2 · a bracelet draws many links in the metal and no strap fill; a strap draws a keeper and holes and no links', () => {
    for (const scheme of SCHEMES) {
      for (const metal of METALS) {
        for (const color of [COLORS.brown!, COLORS.navy!, WHITE]) {
          const tag = `${scheme} ${metal} ${color}`;
          const bracelet = renderFlat(acc('watch', color, { metal, bracelet: true }), { scheme, id: 'x' });
          const strap = renderFlat(acc('watch', color, { metal }), { scheme, id: 'x' });
          // bracelet: 6 links above and 6 below, each with a lit inset, the links filled with the metal; the crown is the one other rect
          expect([tag, count(bracelet, '<rect x="77"')]).toEqual([tag, 12]);
          expect([tag, count(bracelet, '<rect x="86"')]).toEqual([tag, 12]);
          expect([tag, count(bracelet, '<rect')]).toEqual([tag, 25]);
          expect([tag, count(bracelet, `<rect x="77" y=`) === count(bracelet, `width="46" height="8.2" rx="2.5" fill="${METAL_HEX[metal]}"`)]).toEqual([tag, true]);
          expect([tag, count(bracelet, `fill="${METAL_HEX[metal]}" stroke=`) >= 12]).toEqual([tag, true]);
          // no strap: nothing is filled or stroked with the strap's color, and no keeper loop or holes
          expect([tag, bracelet.toLowerCase().includes(color.toLowerCase())]).toEqual([tag, false]);
          expect([tag, bracelet.includes('M75,143 h50 v7 h-50 Z')]).toEqual([tag, false]);
          expect([tag, count(bracelet, 'r="2.3"')]).toEqual([tag, 0]);
          // strap: its color fills both straps, a keeper loop and three holes, and not one link
          expect([tag, count(strap, 'fill="' + color + '" stroke=')]).toEqual([tag, 2]);
          expect([tag, count(strap, '<rect x="77"')]).toEqual([tag, 0]);
          expect([tag, count(strap, '<rect')]).toEqual([tag, 1]); // the crown
          expect([tag, strap.includes('M75,143 h50 v7 h-50 Z')]).toEqual([tag, true]);
          expect([tag, count(strap, 'r="2.3"')]).toEqual([tag, 3]);
          expect([tag, bracelet === strap]).toEqual([tag, false]);
        }
      }
    }
    // a multicolor watch from a drawn piece is that bracelet, in its metal
    for (const metal of METALS) {
      const xml = drawSpec({ kind: 'watch', family: 'multicolor', name: 'x', metal });
      expect([metal, count(xml, '<rect x="77"')]).toEqual([metal, 12]);
      expect([metal, xml.includes(METAL_HEX[metal])]).toEqual([metal, true]);
    }
  });

  it("KC9.2 · a bracelet's halo follows the metal, not the strap color", () => {
    const HALO = '<g fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="5"';
    for (const metal of ['gold', 'silver'] as const) {
      // a black strap color in dark: the metal is bright, so a bracelet has no halo at all (a strap would)
      const bracelet = renderFlat(acc('watch', BLACK, { metal, bracelet: true }), { scheme: 'dark', id: 'x' });
      expect([metal, count(bracelet, HALO)]).toEqual([metal, 0]);
      expect([metal, count(renderFlat(acc('watch', BLACK, { metal }), { scheme: 'dark', id: 'x' }), HALO)]).toEqual([metal, 1]); // the strap's; the bright case has none
    }
    // a black metal bracelet in dark: a halo for the links and one for the case, even when the strap color is bright
    for (const color of [BLACK, WHITE, COLORS.tan!]) {
      const dark = renderFlat(acc('watch', color, { metal: 'black', bracelet: true }), { scheme: 'dark', id: 'x' });
      expect([color, count(dark, HALO)]).toEqual([color, 2]);
    }
    // a gold bracelet, strap color black, in light: no rim and no halo
    const light = renderFlat(acc('watch', BLACK, { metal: 'gold', bracelet: true }), { scheme: 'light', id: 'x' });
    expect(count(light, HALO)).toBe(0);
    expect(count(light, 'stroke-opacity=".12" stroke-width="2.4"')).toBe(0);
  });
});
