// A piece's drawing (#141): the code-drawn flat from flats.ts, rendered by SvgXml at any size and redrawn for the
// theme (night rims dark pieces). Decorative: the parent carries VoiceOver (spec.a11y).
import { useId, useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@/design-system/theme';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { artSpec, type ArtSpec, type DrawnPieceSpec, type PieceSlot } from './artSpec';
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

/** A closet piece (or a reading's garment) drawn at `size`: the morning card, outfit tiles, Which shoes?. */
export function PieceArt({ item, size }: { item: (Pick<ClosetItemRow, 'garment' | 'hex'> & { art?: ClosetArt | null; name?: string }) | DrawnPieceSpec; size: number; slot?: PieceSlot }) {
  if ('kind' in item && 'family' in item) throw new Error('T101: not built');
  return <GarmentArt spec={artSpec({ garment: item.garment, hex: item.hex, art: item.art ?? null, name: item.name ?? '' })} size={size} />;
}
