// The example closet (specs/app-tour.md AT1.2; tasks/T118/DESIGN.md frames 1, 3, 5): every piece of the three example
// looks as Closet's own tiles, in its head-to-toe sections, under a small `Example` tag. They drop in a piece at a time,
// about a second in all (Reduce Motion: already in place). Inert: nothing here is a piece he owns, and nothing responds
// to a tap. VoiceOver hears one element, "Example closet, 10 pieces". Closet's screen shows this in place of itself while
// the tour is up; it can still scroll, so Bottoms and Shoes get seen above the card.
import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Pill, TagLine, radius, space, useTheme } from '@/design-system';
import { ClosetTile } from '@/features/closet/ClosetTile';
import { arrivalEntering } from '@/features/stylist/arrivalMotion';
import { t } from '@/i18n/en';
import { exampleCloset, exampleClosetCount } from './exampleLooks';

const GAP = 10;
/** Each piece starts this long after the one before it (ms): ten pieces land in about a second. */
export const DROP_STAGGER_MS = 70;

/** Room under the list for the card and the tab bar, so the last section clears them. */
export function tourBottomRoom(height: number, accessibilitySize: boolean): number {
  return accessibilitySize ? Math.round(height * 0.6) + 140 : 300;
}

export function ExampleCloset() {
  const { colors, isAccessibilitySize: ax, a11y } = useTheme();
  const { height } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const sections = exampleCloset();
  const cols = ax ? 2 : 3;
  const tile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  // Each piece's place in the drop, in the order the sections list them.
  const order = new Map(sections.flatMap((s) => s.pieces).map((p, i) => [p.id, i]));
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.gutter, paddingBottom: space.gutter + tourBottomRoom(height, ax), gap: space.stack }}
    >
      <View style={{ alignSelf: 'flex-start' }}>
        <Pill title={t('onb.example.time')} />
      </View>
      <View
        accessible
        accessibilityLabel={t('tour.a11y.closet', { n: exampleClosetCount(sections) })}
        style={{ gap: space.xxl }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {tile > 0 ? sections.map((s) => (
          <View key={s.slot} style={{ gap: space.s }}>
            <TagLine left={t(s.titleKey)} right={String(s.pieces.length)} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP }}>
              {s.pieces.map((p) => (
                <Animated.View key={p.id} entering={a11y.reduceMotion ? undefined : arrivalEntering(DROP_STAGGER_MS * (order.get(p.id) ?? 0), false)}>
                  <ClosetTile item={p.item} size={tile} aspect={0.92} radius={radius.tile} label={p.name} decorative />
                </Animated.View>
              ))}
            </View>
          </View>
        )) : null}
      </View>
    </ScrollView>
  );
}
