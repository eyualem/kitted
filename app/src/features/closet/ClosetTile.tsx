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
  /** Share of the tile the drawing takes (the flats carry their own margin; 02 C1's 62% was for the old icons). */
  scale?: number;
  dim?: boolean;
  /** Draw the name under it. */
  label?: string | null;
  onPress?: () => void;
  /** Long-press (the piece's menu, #118); VoiceOver gets it as the custom action `longPressLabel`. */
  onLongPress?: () => void;
  longPressLabel?: string;
  /** VoiceOver custom actions without a press of its own (the Closet tile inside the native long-press menu). */
  actions?: readonly { name: string; label: string; onAction: () => void }[];
  accessibilityHint?: string;
  /** Inside a row that carries VoiceOver itself. */
  decorative?: boolean;
}

export function ClosetTile({ item, size, aspect = 1, radius, scale = 0.8, dim, label, onPress, onLongPress, longPressLabel, actions: own, accessibilityHint, decorative }: ClosetTileProps) {
  const { colors } = useTheme();
  const spec = artSpec(item);
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
  if (!onPress && !onLongPress) {
    if (!own?.length) return <View accessible accessibilityLabel={spec.a11y}>{body}</View>;
    return (
      <View
        accessible accessibilityLabel={spec.a11y} accessibilityHint={accessibilityHint} accessibilityActions={own.map(({ name, label: l }) => ({ name, label: l }))}
        onAccessibilityAction={(e) => own.find((a) => a.name === e.nativeEvent.actionName)?.onAction()}
      >
        {body}
      </View>
    );
  }
  // A tap (the piece page, #276) can come with the tile's own custom actions (Rename, Remove).
  const actions = [
    ...(onLongPress && longPressLabel ? [{ name: 'longpress', label: longPressLabel }] : []),
    ...(own ?? []).map(({ name, label: l }) => ({ name, label: l })),
  ];
  const onAction = (name: string) => {
    if (name === 'longpress') onLongPress?.();
    else if (name === 'activate') onPress?.();
    else own?.find((a) => a.name === name)?.onAction();
  };
  return (
    <Pressable
      onPress={onPress} onLongPress={onLongPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={spec.a11y}
      accessibilityHint={accessibilityHint} accessibilityActions={actions.length > 0 ? actions : undefined} onAccessibilityAction={(e) => onAction(e.nativeEvent.actionName)}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      {body}
    </Pressable>
  );
}
