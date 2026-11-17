// A piece's drawing (#141): the code-drawn flat from flats.ts, rendered by SvgXml at any size and redrawn for the
// theme (night rims dark pieces). Decorative: the parent carries VoiceOver (spec.a11y).
import { useId, useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@/design-system/theme';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { pieceArtSpec, type ArtSpec, type DrawnPieceSpec, type PieceSlot } from './artSpec';
import { renderFlat } from './flats';

export function GarmentArt({ spec, size }: { spec: ArtSpec; size: number }) {
  const { scheme } = useTheme();
  const raw = useId();
  const key = JSON.stringify(spec.flat);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the spec's content, not its identity
  const xml = useMemo(() => renderFlat(spec.flat, { scheme: scheme === 'dark' ? 'dark' : 'light', id: `g${raw}` }), [key, scheme, raw]);
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

/** A closet piece, a reading's garment, or a drawn piece (no closet row), at `size`. A drawn piece that can't be drawn
 *  renders an empty size x size box: it never throws and never draws something else. */
export function PieceArt({ item, size, slot }: { item: (Pick<ClosetItemRow, 'garment' | 'hex'> & { art?: ClosetArt | null; name?: string }) | DrawnPieceSpec; size: number; slot?: PieceSlot }) {
  const spec = pieceArtSpec('kind' in item && 'family' in item ? item : { garment: item.garment, hex: item.hex, art: item.art ?? null, name: item.name ?? '' }, slot);
  if (!spec) return <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" />;
  return <GarmentArt spec={spec} size={size} />;
}
