// A closet tile (C1 grid, S11 rows, the duplicate question): the detailed graphic on the tile color, ghosted
// (dashed edge, faded) for a piece he only described. One VoiceOver element: the name and what's drawn.
import { Pressable, View } from 'react-native';
import { KText, opacity, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { artSpec } from './artSpec';
import { GarmentArt } from './GarmentArt';

export interface ClosetTileProps {
  item: Pick<ClosetItemRow, 'garment' | 'hex' | 'art' | 'name' | 'isPhotographed'>;
  /** Tile width; height = width × aspect. */
  size: number;
  aspect?: number;
  radius?: number;
  /** Share of the tile the drawing takes (02 C1: 62%). */
  scale?: number;
  large?: boolean;
  dim?: boolean;
  /** Draw the name under it. */
  label?: string | null;
  onPress?: () => void;
  accessibilityHint?: string;
  /** Inside a row that carries VoiceOver itself. */
  decorative?: boolean;
}

export function ClosetTile({ item, size, aspect = 1, radius, scale = 0.62, large, dim, label, onPress, accessibilityHint, decorative }: ClosetTileProps) {
  const { colors } = useTheme();
  const spec = artSpec(item, large ? 'large' : 'tile');
  const ghost = item.isPhotographed === false;
  const h = Math.round(size * aspect);
  const body = (
    <View style={{ width: size, gap: label ? 6 : 0 }}>
      <View
        style={{
          width: size, height: h, borderRadius: radius ?? Math.round(size * 0.16), borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center',
          backgroundColor: ghost ? 'transparent' : colors.surface2, borderWidth: ghost ? 1.5 : 0, borderStyle: ghost ? 'dashed' : 'solid',
          borderColor: colors.inkFaint, opacity: dim ? 0.4 : 1,
        }}
      >
        <View style={{ opacity: ghost ? 0.5 : 1 }}>
          <GarmentArt spec={spec} size={Math.round(Math.min(size, h) * scale)} />
        </View>
      </View>
      {label ? (
        <KText role="miniLabel" numberOfLines={2}>
          {label}
        </KText>
      ) : null}
    </View>
  );
  if (decorative) return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{body}</View>;
  if (!onPress) return <View accessible accessibilityLabel={spec.a11y}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={spec.a11y} accessibilityHint={accessibilityHint} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}>
      {body}
    </Pressable>
  );
}
