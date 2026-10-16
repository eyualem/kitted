// The standing outfit (#84.2; 09-ui-review §13): his pieces drawn in body order on one 3:4 tile, a layer at the side;
// a piece he'd buy (the next best buy, §14) dashed and faded.
import { View } from 'react-native';
import { radius, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { PieceArt } from './GarmentArt';

/** The standing outfit (#84.2): his pieces stacked in body order on one 3:4 tile, a layer at the side. */
export function StandingOutfit({ items, layerId, width = 96, ghostId }: { items: readonly ClosetItemRow[]; layerId: string | null; width?: number; ghostId?: string }) {
  const { colors } = useTheme();
  const layer = items.find((i) => i.id === layerId) ?? null;
  const core = (['top', 'bottom', 'shoes'] as const).map((s) => items.find((i) => i.slot === s && i.id !== layerId)).filter((c): c is ClosetItemRow => !!c);
  const h = Math.round(width * 4 / 3);
  const piece = Math.round(h / 3.2);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: h, borderRadius: radius.tile, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      {core.map((c) => (
        <View
          key={c.id}
          style={[
            { height: c.slot === 'shoes' ? piece * 0.75 : piece, alignItems: 'center', justifyContent: 'center' },
            // The piece he'd buy (C7): dashed and faded, like a closet piece with no photo yet.
            c.id === ghostId ? { opacity: 0.55, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inkFaint, borderRadius: 10, paddingHorizontal: 4 } : null,
          ]}
        >
          {/* Shoes are wide and short: drawn at the tile's full piece size so they don't look tiny next to the top. */}
          <PieceArt item={c} size={c.slot === 'shoes' ? Math.round(piece * 1.15) : piece} />
        </View>
      ))}
      {layer ? (
        <View style={{ position: 'absolute', left: 2, top: piece * 0.15 }}>
          <PieceArt item={layer} size={Math.round(piece * 0.8)} />
        </View>
      ) : null}
    </View>
  );
}

