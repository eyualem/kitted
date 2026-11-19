// O2's style tile (02 D2, #173): two drawn outfits, the style's name and one plain line. Never a person.
// The tile is one button for VoiceOver ("Streetwear: Hoodies, graphic tees…", selected trait); the drawings are hidden.
// A picked tile shows its pick order (1 · 2 · 3, like You's style card; the first pick breaks ties, #86), every tile in
// a row is as tall as the tallest, and the selected ring is drawn over the border so nothing inside moves (#276).
import { useEffect, useId, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Icon, KText, space, useTheme } from '@/design-system';
import { radius } from '@/design-system/tokens';
import { renderFlat, type FlatSpec } from '@/features/closet/flats';
import { styleLabel } from '@/features/morning/copy';
import { t, type StringKey } from '@/i18n/en';
import type { Look, LookOutfit } from './looks';

function Flat({ spec, width, height }: { spec: FlatSpec; width: number; height: number }) {
  const { scheme } = useTheme();
  const id = useId();
  const xml = useMemo(() => renderFlat(spec, { scheme: scheme === 'dark' ? 'dark' : 'light', id: `l${id}` }), [spec, scheme, id]);
  return <SvgXml xml={xml} width={width} height={height} />;
}

/** One outfit standing: the top, the bottoms tucked up under it, the shoes under the hems (about 2.3 × w tall). Also the
 *  Going-for inset's compact tiles (#215). */
export function Outfit({ outfit, w }: { outfit: LookOutfit; w: number }) {
  const [top, bottom, shoe] = outfit;
  return (
    <View style={{ width: w, alignItems: 'center' }}>
      <Flat spec={top} width={w * 0.95} height={w * 0.95} />
      <View style={{ marginTop: -w * 0.14 }}>
        <Flat spec={bottom} width={w * 0.95} height={w * 1.08} />
      </View>
      <View style={{ marginTop: -w * 0.1 }}>
        <Flat spec={shoe} width={w * 0.78} height={w * 0.51} />
      </View>
    </View>
  );
}

export function lookLine(look: Pick<Look, 'style'>): string {
  return t(`onb.looks.line.${look.style}` as StringKey);
}

export interface LookTileProps {
  look: Look;
  width: number;
  selected: boolean;
  /** 1-based pick order when selected. */
  order?: number;
  /** Bumped on a 4th tap: the tile shakes once. */
  shake: number;
  onPress: () => void;
  /** T113: the Add a look sheet's tiles are found by it (addlook-tile-<look>). */
  testID?: string;
}

export function LookTile({ look, width, selected, order, shake, onPress, testID }: LookTileProps) {
  const { colors, a11y } = useTheme();
  const [x] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const reduceMotion = a11y.reduceMotion;
  useEffect(() => {
    if (!shake) return;
    // Reduce Motion: a quick dim and back instead of the side-to-side shake.
    if (reduceMotion) {
      Animated.sequence([0.55, 1].map((v) => Animated.timing(fade, { toValue: v, duration: 120, useNativeDriver: true }))).start();
      return;
    }
    Animated.sequence([6, -6, 4, -4, 0].map((v) => Animated.timing(x, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  }, [shake, x, fade, reduceMotion]);
  const name = styleLabel(look.style);
  const line = lookLine(look);
  const inner = width - 2 * TILE_PAD;
  const outfitW = Math.min(90, (inner - 12) / 2);
  return (
    <Animated.View style={{ transform: [{ translateX: x }], opacity: fade }}>
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={selected && order ? `${t('profile.a11y.pick', { style: name, n: order })}: ${line}` : t('onb.looks.tileA11y', { style: name, line })}
        style={[styles.tile, { width, backgroundColor: colors.surface, borderColor: colors.line }]}
      >
        {selected ? <View pointerEvents="none" style={[styles.ring, { borderColor: colors.ink }]} /> : null}
        <View style={[styles.art, { backgroundColor: colors.surface2 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {look.outfits.map((o, i) => (
            <Outfit key={i} outfit={o} w={outfitW} />
          ))}
        </View>
        <View style={styles.nameRow}>
          <KText variant="subheadline" weight="700" style={{ flexShrink: 1 }}>
            {name}
          </KText>
          {selected ? (
            <View style={[styles.check, { backgroundColor: colors.ink }]}>
              {order ? (
                <KText variant="caption" weight="700" color="onPrimary" tabular maxFontSizeMultiplier={1.3}>{String(order)}</KText>
              ) : (
                <Icon name="check" size={13} color={colors.bg} weight="bold" />
              )}
            </View>
          ) : null}
        </View>
        <KText variant="footnote" color="ink3">
          {line}
        </KText>
      </Pressable>
    </Animated.View>
  );
}

const TILE_PAD = 10;

const styles = StyleSheet.create({
  // flexGrow: as tall as the tallest tile in its row. The border stays 1 pt; the selected ring sits over it.
  tile: { flexGrow: 1, borderWidth: 1, borderRadius: radius.look + 1, padding: TILE_PAD, paddingBottom: space.m, gap: space.xxs },
  ring: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderWidth: 2.5, borderRadius: radius.look + 1 },
  art: { flexDirection: 'row', justifyContent: 'center', gap: space.xs, borderRadius: radius.look - 3, paddingTop: space.s, paddingBottom: space.xs, marginBottom: space.s },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.xs, minHeight: 22 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
