// The outfit card's hero strip (#70): the outfit, edge to edge across the card under the menus.
import { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { PieceArt } from '@/features/closet/GarmentArt';
import { t } from '@/i18n/en';

/** Equal tiles with 1 pt hairline gaps, no labels (each tile is labelled for VoiceOver), 2×2 at AX sizes. Only the
 *  pieces he owns: the "add a piece" tiles for a missing one did nothing and are gone (founder, Oct 28, #380), so the
 *  pieces fill the strip. Nothing to draw (an empty closet): no strip. */
export function HeroStrip({ items }: { items: readonly ClosetItemRow[] }) {
  const { colors, isAccessibilitySize } = useTheme();
  const [w, setW] = useState(0);
  if (items.length === 0) return null;
  const cols = isAccessibilitySize ? 2 : items.length;
  const tileW = w > 0 ? (w - (cols - 1)) / cols : 0;
  const tileH = Math.min(Math.round(tileW * 1.05), 120);
  return (
    <View
      testID="hero-strip"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1, backgroundColor: colors.line }}
    >
      {tileW > 0
        ? items.map((it) => (
            <View key={it.id} accessible accessibilityLabel={t('idea.tile.a11y', { name: it.name })} style={{ width: tileW, height: tileH, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <PieceArt item={it} size={Math.round(Math.min(tileW, tileH) * 0.84)} />
            </View>
          ))
        : null}
    </View>
  );
}
