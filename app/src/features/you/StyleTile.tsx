// A look on You (T44, the founder's Nov 11 phone pass): the same two drawn outfits as setup's look tile (`Outfit`, not
// redrawn), his name for the look and, once picked, its pick order. Squared off with setup's tile corner
// (`radius.look + 1`, continuous), not a capsule. On You's style card the tiles only show (the card is the one button,
// like before); on Style profile each tile is a button. Ink only: copper is for score movement (#231).
// `shake` bumped = a 4th pick was refused: one side-to-side shake (a dim and back with Reduce Motion), as LookTile.
import { memo, useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CONTROL_TEXT_MAX_SCALE, KText, opacity, radius, space, useTheme } from '@/design-system';
import { LOOKS } from '@/features/onboarding/looks';
import { Outfit } from '@/features/onboarding/LookTile';
import type { StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';

export const TILE_GAP = 8;
const PAD = 6;
const COLUMNS = 3;

/** Lays its tiles three across (one per row at the accessibility sizes) and hands each its width. */
export function StyleTileGrid({ render, accessibilityLabel }: { render: (tileWidth: number, row: boolean) => ReactNode; accessibilityLabel?: string }) {
  const { isAccessibilitySize } = useTheme();
  const screenSize = useWindowDimensions();
  const [measured, setW] = useState(0);
  // Before the first layout: the card's inner width on a full-width phone, so the tiles never pop in or jump.
  const w = measured || screenSize.width - 2 * (space.gutter + space.rowX);
  const columns = isAccessibilitySize ? 1 : COLUMNS;
  const tileW = Math.floor((w - TILE_GAP * (columns - 1)) / columns);
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP }}
    >
      {render(tileW, isAccessibilitySize)}
    </View>
  );
}

export interface StyleTileProps {
  look: StyleKey;
  width: number;
  /** At the accessibility sizes: the art on the left, the name and number on the right. */
  row?: boolean;
  /** 1-based pick order; absent = not picked. */
  n?: number;
  /** His first pick (the one that breaks ties): its number is ink-filled. Others are a quiet grey disc. */
  first?: boolean;
  /** Style profile: the ring that says "picked", like setup's tile. The card shows no ring. */
  ring?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  shake?: number;
}

export const StyleTile = memo(function StyleTile({ look, width, row, n, first, ring, onPress, accessibilityLabel, shake = 0 }: StyleTileProps) {
  const { colors, a11y, isAccessibilitySize, fontScale } = useTheme();
  const [x] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const reduceMotion = a11y.reduceMotion;
  useEffect(() => {
    if (!shake) return;
    if (reduceMotion) {
      Animated.sequence([0.55, 1].map((v) => Animated.timing(fade, { toValue: v, duration: 120, useNativeDriver: true }))).start();
      return;
    }
    Animated.sequence([6, -6, 4, -4, 0].map((v) => Animated.timing(x, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  }, [shake, x, fade, reduceMotion]);

  const L = LOOKS.find((l) => l.style === look);
  const name = styleLabel(look);
  // Two outfits side by side in the tile (the same pair setup shows); one column of them in a row at big text sizes.
  const outfitW = row ? 30 : Math.max(24, Math.min(46, Math.floor((width - 2 * PAD - 2 * 4 - 4) / 2)));
  // At the accessibility sizes the number grows (up to CONTROL_TEXT_MAX_SCALE) and its disc with it: no fixed height.
  const disc = isAccessibilitySize ? Math.round(18 * Math.min(fontScale, CONTROL_TEXT_MAX_SCALE)) : 18;
  const filled = !!first || !!ring;
  const art = (
    <View
      testID={`style-art-${look}`}
      style={[styles.art, row ? { paddingHorizontal: space.s } : null, { backgroundColor: colors.surface2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {L?.outfits.map((o, i) => <Outfit key={i} outfit={o} w={outfitW} />)}
    </View>
  );
  const badge =
    n !== undefined ? (
      <View
        style={[
          { alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? colors.ink : colors.surface2 },
          isAccessibilitySize ? { minWidth: disc, minHeight: disc, paddingHorizontal: 4, borderRadius: disc / 2 } : { minWidth: 18, height: 18, borderRadius: 9 },
        ]}
      >
        <KText variant="caption" weight="700" color={filled ? 'onPrimary' : 'ink'} maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE} tabular>
          {String(n)}
        </KText>
      </View>
    ) : null;
  const label = (
    <View style={styles.nameRow}>
      <KText
        variant="footnote"
        weight="600"
        style={{ flexShrink: 1 }}
        numberOfLines={isAccessibilitySize ? 0 : name.includes(' ') ? 2 : 1}
        adjustsFontSizeToFit={!isAccessibilitySize}
        minimumFontScale={0.75}
      >
        {name}
      </KText>
      {badge}
    </View>
  );
  const body = (
    <View
      style={[
        styles.tile,
        row ? styles.tileRow : null,
        onPress ? { flex: 1 } : { width },
        { backgroundColor: colors.surface, borderColor: colors.line },
      ]}
    >
      {ring ? <View pointerEvents="none" style={[styles.ring, { borderColor: colors.ink }]} /> : null}
      {art}
      {row ? <View style={{ flex: 1 }}>{label}</View> : label}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityState={{ selected: !!ring }}
      // The wrapper carries the width and stretches to its row, so a tile with a two-line name never leaves its
      // neighbours shorter (setup's LookTile does the same with flexGrow).
      style={({ pressed }) => ({ width, opacity: pressed ? opacity.pressed : 1 })}
    >
      <Animated.View style={{ flex: 1, transform: [{ translateX: x }], opacity: fade }}>{body}</Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  // Setup's tile corner (LookTile: radius.look + 1); the picked ring sits over the 1 pt border so nothing moves.
  tile: { borderWidth: 1, borderRadius: radius.look + 1, borderCurve: 'continuous', padding: PAD, gap: space.xs },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  ring: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderWidth: 2.5, borderRadius: radius.look + 1, borderCurve: 'continuous' },
  art: { flexDirection: 'row', justifyContent: 'center', gap: 4, borderRadius: radius.look - 5, borderCurve: 'continuous', paddingTop: space.xs, paddingBottom: space.xxs, paddingHorizontal: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.xxs, minHeight: 22, paddingHorizontal: 2, paddingBottom: 2 },
});
