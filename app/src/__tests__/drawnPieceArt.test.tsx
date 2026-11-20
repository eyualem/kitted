// T101 · The component half of the drawn pieces (tasks/T101/TESTING.md): PieceArt draws a drawn piece and a closet row
// alike (KC2.2), and a chat-added watch is a solid Closet tile with the accessory drawing (KC9.3; solid since Nov 19, KC4.3).
//
// Set-up: react-native-svg's SvgXml is a View carrying its `xml` (testID `svg`); the theme is mocked to the scheme under
// test; GarmentArt's own drawing is replaced by a marker View (testID `garment-art`) carrying its `spec` and `size` for the
// ClosetTile test only (PieceArt keeps the real GarmentArt inside its own module, so its tests read the real SvgXml);
// the design system is mocked as in cardNoAddTile.test.tsx (Reanimated needs the native runtime). useId is fixed so two
// drawings of one piece have the same ids and can be compared byte for byte.
import { displayHex, FAMILY_HEX, G } from '@kitted/core';
import { render, type RenderResult } from '@testing-library/react-native';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { artSpec, drawnItem, type ArtItem, type DrawnPieceSpec } from '@/features/closet/artSpec';
import { ClosetTile } from '@/features/closet/ClosetTile';
import { PieceArt } from '@/features/closet/GarmentArt';
import { renderFlat } from '@/features/closet/flats';
import { tileArtBox } from '@/features/closet/tileArt';

// the drawing is hidden from VoiceOver on purpose, so the queries must look at hidden elements too
const ANY = { includeHiddenElements: true };
let mockScheme: 'light' | 'dark' = 'light';

jest.mock('react-native-svg', () => {
  const R = jest.requireActual('react');
  // a string host element keeps every prop (a mocked View drops the unknown ones)
  return { SvgXml: ({ xml }: { xml: string }) => R.createElement('SvgXmlMock', { testID: 'svg', xml }) };
});
jest.mock('@/design-system/theme', () => ({
  useTheme: () => ({ scheme: mockScheme, colors: { surface2: '#EEE', line: '#DDD', inkFaint: '#999', surface: '#FFF' }, isAccessibilitySize: false }),
}));
jest.mock('@/design-system', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    KText: Text,
    CONTROL_TEXT_MAX_SCALE: 1.3,
    opacity: { pressed: 0.6 },
    useTheme: () => ({ scheme: mockScheme, colors: { surface2: '#EEE', line: '#DDD', inkFaint: '#999', surface: '#FFF' }, isAccessibilitySize: false }),
  };
});
jest.mock('@/features/closet/GarmentArt', () => {
  const R = jest.requireActual('react');
  return {
    ...jest.requireActual('@/features/closet/GarmentArt'),
    GarmentArt: ({ spec, size }: { spec: unknown; size: number }) => R.createElement('GarmentArtMock', { testID: 'garment-art', spec, size }),
  };
});

beforeEach(() => {
  mockScheme = 'light';
  // the real module object (a babel namespace import is a copy, and spying on a copy changes nothing)
  jest.spyOn(jest.requireActual<typeof React>('react'), 'useId').mockReturnValue('fixed');
});
afterEach(() => jest.restoreAllMocks());

// Queries go through the latest render's own result, not the global `screen`, so one test's tree can't leak into the next.
let cur: RenderResult;
const show = async (el: React.ReactElement) => (cur = await render(el));

const flat = (s: React.ComponentProps<typeof StyleSheet.flatten>) => (StyleSheet.flatten(s) ?? {}) as Record<string, unknown>;
const xmlOf = () => cur.getByTestId('svg', ANY).props.xml as string;
const must = (p: DrawnPieceSpec, hint?: Parameters<typeof drawnItem>[1]): ArtItem => {
  const it = drawnItem(p, hint);
  if (!it) throw new Error('drawnItem gave null');
  return it;
};
const row = (it: ArtItem, over: Record<string, unknown> = {}) => ({
  ...it, id: 'C-1', slot: 'accessory', source: 'chat', isPhotographed: false, photoFile: null, starterId: null, ...over,
});
const BOOT: DrawnPieceSpec = { kind: 'work_boot', family: 'black', name: 'Black work boots' };
const bootRow = {
  garment: G('footwear', 'work_boot', 'black'), hex: FAMILY_HEX.black, name: 'Black work boots',
  art: { family: 'black', shade: null, details: [], brand: null, shoeProfile: null, denimWear: null },
};

describe('KC2.2 · PieceArt draws a drawn piece', () => {
  it('KC2.2 · PieceArt draws a drawn piece and a closet row alike', async () => {
    for (const scheme of ['light', 'dark'] as const) {
      mockScheme = scheme;
      const { unmount } = await show(<PieceArt item={BOOT} size={61} />);
      const fromDrawn = xmlOf();
      expect(fromDrawn).toBe(renderFlat(artSpec(must(BOOT)).flat, { scheme, id: 'gfixed' }));
      expect(fromDrawn.toLowerCase()).toContain(FAMILY_HEX.black!.toLowerCase());
      await unmount();

      await show(<PieceArt item={bootRow} size={61} />);
      expect(xmlOf()).toBe(fromDrawn); // the same kind and color: the same picture
    }
  });

  it('KC2.2 · PieceArt still draws a closet row exactly as before, in both themes', async () => {
    for (const scheme of ['light', 'dark'] as const) {
      mockScheme = scheme;
      const { unmount } = await show(<PieceArt item={bootRow} size={95} />);
      expect(xmlOf()).toBe(renderFlat(artSpec({ ...bootRow, art: bootRow.art }).flat, { scheme, id: 'gfixed' }));
      const root = cur.toJSON() as { props: Record<string, unknown> };
      expect(flat(root.props.style as never)).toMatchObject({ width: 95, height: 95 });
      await unmount();
    }
  });

  it('KC2.2 · PieceArt draws a drawn piece at its size and hides it from VoiceOver', async () => {
    await show(<PieceArt item={BOOT} size={61} />);
    const root = cur.toJSON() as { props: Record<string, unknown> };
    expect(flat(root.props.style as never)).toMatchObject({ width: 61, height: 61 });
    expect(root.props.accessibilityElementsHidden).toBe(true);
    expect(root.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(cur.getByTestId('svg', ANY).props.xml).toContain('viewBox="0 0 200 200"');
  });

  it('KC2.2 · PieceArt draws an accessory, and a stand-in under its slot', async () => {
    const watch: DrawnPieceSpec = { kind: 'watch', family: 'multicolor', name: 'Gold watch', metal: 'gold' };
    const { unmount } = await show(<PieceArt item={watch} size={61} />);
    expect(xmlOf()).toBe(renderFlat(artSpec(must(watch)).flat, { scheme: 'light', id: 'gfixed' }));
    expect(xmlOf()).toContain('#C9A44C');
    await unmount();

    const bag: DrawnPieceSpec = { kind: 'bag', family: 'black', name: 'Black bag' };
    await show(<PieceArt item={bag} size={61} slot="shoes" />);
    expect(xmlOf()).toBe(renderFlat(artSpec(must(bag, 'shoes')).flat, { scheme: 'light', id: 'gfixed' }));
  });

  it("KC2.2 · PieceArt draws nothing for a piece it can't draw", async () => {
    const bag: DrawnPieceSpec = { kind: 'bag', family: 'black', name: 'Black bag' };
    for (const slot of [undefined, 'accessory'] as const) {
      const { unmount } = await show(<PieceArt item={bag} size={61} {...(slot ? { slot } : {})} />);
      expect(cur.queryByTestId('svg', ANY)).toBeNull();
      const root = cur.toJSON() as { props: Record<string, unknown> } | null;
      expect(root).not.toBeNull();
      expect(flat(root!.props.style as never)).toMatchObject({ width: 61, height: 61 });
      await unmount();
    }
  });
});

describe('KC9.3 · a chat-added piece is a Closet tile with the accessory drawing', () => {
  const spec: DrawnPieceSpec = { kind: 'watch', family: 'multicolor', metal: 'gold', face: 'digital', name: 'Gold digital watch' };
  const above = (start: { parent: unknown }, pred: (s: Record<string, unknown>) => boolean) => {
    for (let n = start.parent as { props?: { style?: never }; parent: unknown } | null; n; n = n.parent as typeof n) {
      const s = flat(n.props?.style as never);
      if (pred(s)) return s;
    }
    return null;
  };

  it('KC9.3 · a chat-added watch is a solid, full-strength Closet tile with the accessory drawing', async () => {
    const item = row(must(spec)) as unknown as Parameters<typeof ClosetTile>[0]['item'];
    await show(<ClosetTile item={item} size={110} />);
    const marker = cur.getByTestId('garment-art', ANY);
    expect((marker.props.spec as { shape: string }).shape).toBe('accessory');
    expect(marker.props.spec).toEqual(artSpec(must(spec)));
    expect(marker.props.size).toBe(tileArtBox('accessory' as never, 110, 110, 0.8).size);
    expect(marker.props.size).toBe(88);
    expect(above(marker, (s) => s.borderStyle === 'dashed')).toBeNull();
    expect(above(marker, (s) => s.opacity === 0.5)).toBeNull();
    // the only words: the piece's name
    const tile = cur.getByLabelText('Gold digital watch');
    expect(tile.props.accessibilityLabel).toBe('Gold digital watch');
    expect(cur.queryByText(/./)).toBeNull();
  });

  it('KC9.3 · an unphotographed tee is solid like a photographed one, and says `No photo yet` only when the tile carries its name (KC4.3, Nov 19)', async () => {
    const tee = { garment: G('top', 'tee', 'navy'), hex: FAMILY_HEX.navy, art: null, name: 'Navy tee' };
    const { unmount } = await show(<ClosetTile item={{ ...tee, isPhotographed: false }} size={110} />);
    let marker = cur.getByTestId('garment-art', ANY);
    expect((marker.props.spec as { shape: string }).shape).toBe('top');
    expect(above(marker, (s) => s.borderStyle === 'dashed')).toBeNull();
    expect(above(marker, (s) => s.backgroundColor === '#EEE')).not.toBeNull();
    expect(above(marker, (s) => s.opacity === 0.5)).toBeNull();
    // no name line on a bare thumbnail: no words, the name alone for VoiceOver
    expect(cur.getByLabelText('Navy tee').props.accessibilityLabel).toBe('Navy tee');
    expect(cur.queryByText('No photo yet')).toBeNull();
    await unmount();
    // named (the Closet grid): the line sits under the name, and VoiceOver hears it
    await show(<ClosetTile item={{ ...tee, isPhotographed: false }} size={110} label="Navy tee" />);
    expect(cur.getByText('No photo yet')).toBeTruthy();
    expect(cur.getByLabelText('Navy tee, no photo yet')).toBeTruthy();
    await cur.unmount();
    await show(<ClosetTile item={{ ...tee, isPhotographed: true }} size={110} label="Navy tee" />);
    expect(cur.queryByText('No photo yet')).toBeNull();
    await cur.unmount();
    await show(<ClosetTile item={{ ...tee, isPhotographed: true }} size={110} />);
    marker = cur.getByTestId('garment-art', ANY);
    expect(above(marker, (s) => s.borderStyle === 'dashed')).toBeNull();
    expect(above(marker, (s) => s.backgroundColor === '#EEE')).not.toBeNull();
    expect(above(marker, (s) => s.opacity === 0.5)).toBeNull();
  });

  it('KC9.3 · the same watch, photographed, is a solid full-strength tile with no `No photo yet` line', async () => {
    const item = row(must(spec), { isPhotographed: true }) as unknown as Parameters<typeof ClosetTile>[0]['item'];
    await show(<ClosetTile item={item} size={110} />);
    const marker = cur.getByTestId('garment-art', ANY);
    expect((marker.props.spec as { shape: string }).shape).toBe('accessory');
    expect(above(marker, (s) => s.borderStyle === 'dashed')).toBeNull();
    expect(above(marker, (s) => s.backgroundColor === '#EEE')).not.toBeNull();
    expect(above(marker, (s) => s.opacity === 0.5)).toBeNull();
  });

  it('KC9.3 · each of the four is drawn as an accessory in Closet, at the same box a top gets, with its name only', async () => {
    const four: DrawnPieceSpec[] = [
      spec, { kind: 'belt', family: 'black', name: 'Black belt' }, { kind: 'cap', family: 'navy', name: 'Navy cap' },
      { kind: 'beanie', family: 'charcoal', name: 'Charcoal beanie' },
    ];
    for (const p of four) {
      const item = row(must(p)) as unknown as Parameters<typeof ClosetTile>[0]['item'];
      const { unmount } = await show(<ClosetTile item={item} size={88} />);
      const marker = cur.getByTestId('garment-art', ANY);
      expect((marker.props.spec as { shape: string }).shape).toBe('accessory');
      expect(marker.props.size).toBe(Math.round(88 * 0.8));
      expect(cur.getByLabelText(p.name).props.accessibilityLabel).toBe(p.name);
      expect(displayHex(p.family)).toBe((marker.props.spec as { flat: { color: string } }).flat.color);
      await unmount();
    }
  });
});
