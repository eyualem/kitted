// O2's style tile (02 D2, #173): two drawn outfits, the style's name and one plain line. Never a person.
// The tile is one button for VoiceOver ("Streetwear: Hoodies, graphic tees…", selected trait); the drawings are hidden.
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
  /** Bumped on a 4th tap: the tile shakes once. */
  shake: number;
  onPress: () => void;
}

export function LookTile({ look, width, selected, shake, onPress }: LookTileProps) {
  const { colors } = useTheme();
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!shake) return;
    Animated.sequence([6, -6, 4, -4, 0].map((v) => Animated.timing(x, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  }, [shake, x]);
  const name = styleLabel(look.style);
  const line = lookLine(look);
  const inner = width - 2 * TILE_PAD;
  const outfitW = Math.min(90, (inner - 12) / 2);
  return (
    <Animated.View style={{ transform: [{ translateX: x }] }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={t('onb.looks.tileA11y', { style: name, line })}
        style={[
          styles.tile,
          { width, backgroundColor: colors.surface, borderColor: selected ? colors.ink : colors.line, borderWidth: selected ? 2.5 : StyleSheet.hairlineWidth * 2 },
        ]}
      >
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
              <Icon name="check" size={13} color={colors.bg} weight="bold" />
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
  tile: { borderRadius: radius.look + 1, padding: TILE_PAD, paddingBottom: space.m, gap: space.xxs },
  art: { flexDirection: 'row', justifyContent: 'center', gap: space.xs, borderRadius: radius.look - 3, paddingTop: space.s, paddingBottom: space.xs, marginBottom: space.s },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.xs, minHeight: 22 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
