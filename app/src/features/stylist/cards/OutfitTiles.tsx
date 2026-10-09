// The outfit tile grid (02 D12 / "S1d"): square garment tiles with a label under each, and dashed
// "You'd need" tiles for slots the closet can't fill. 4 across; 2 at accessibility text sizes.
import { useState } from 'react';
import { View } from 'react-native';
import { Icon, KText, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { PieceArt } from '@/features/closet/GarmentArt';

const GAP = 8;

export function OutfitTiles({ items, needs = [], compact = false }: { items: readonly ClosetItemRow[]; needs?: readonly string[]; compact?: boolean }) {
  const { colors, isAccessibilitySize } = useTheme();
  const [width, setWidth] = useState(0);
  const cols = compact ? 6 : isAccessibilitySize ? 2 : 4;
  const tile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  const radius = compact ? 10 : 18;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {tile > 0
        ? [
            ...items.map((it) => (
              <View key={it.id} style={{ width: tile, gap: 6 }}>
                <View style={{ width: tile, height: tile, borderRadius: radius, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <PieceArt item={it} size={Math.round(tile * 0.8)} />
                </View>
                {compact ? null : (
                  <KText role="miniLabel" numberOfLines={2}>
                    {it.name}
                  </KText>
                )}
              </View>
            )),
            ...needs.map((label) => (
              <View key={`need-${label}`} style={{ width: tile, gap: 6 }}>
                <View
                  style={{
                    width: tile, height: tile, borderRadius: radius, borderCurve: 'continuous', borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: colors.inkFaint, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon name="plus" color="ink3" size="small" />
                </View>
                {compact ? null : (
                  <KText role="miniLabel" numberOfLines={2}>
                    {label}
                  </KText>
                )}
              </View>
            )),
          ]
        : null}
    </View>
  );
}
