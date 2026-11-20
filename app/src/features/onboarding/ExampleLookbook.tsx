// The example lookbook (specs/app-tour.md AT2.2–AT2.3; tasks/T118/DESIGN.md frame 2): three drawn looks as Lookbook's own
// rows (drawing, `Everyday`, the word, the score), Welcome's outfit on top, under a small `Example` tag. Each score and
// word is the scoring code's output for its bundled reading (exampleLooks.ts). The rows slide in from the bottom one
// after another, Welcome's last (Reduce Motion: already in place). Inert; VoiceOver hears "Example lookbook, 3 looks".
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { KCard, KText, Numeral, Pill, RowDivider, space, useTheme } from '@/design-system';
import { occasionLabel } from '@/features/stylist/thread';
import { arrivalEntering } from '@/features/stylist/arrivalMotion';
import { t } from '@/i18n/en';
import { DrawnOutfit } from './DrawnOutfit';
import { exampleLooks, type ExampleLook } from './exampleLooks';
import { tourBottomRoom } from './ExampleCloset';

/** Each row starts this long after the one below it (ms). */
export const SLIDE_STAGGER_MS = 220;

export function ExampleLookbook() {
  const { colors, isAccessibilitySize: ax, a11y } = useTheme();
  const { height } = useWindowDimensions();
  const looks = exampleLooks();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.gutter, paddingBottom: space.gutter + tourBottomRoom(height, ax), gap: space.stack }}
    >
      <View style={{ alignSelf: 'flex-start' }}>
        <Pill title={t('onb.example.time')} />
      </View>
      <View accessible accessibilityLabel={t('tour.a11y.lookbook', { n: looks.length })}>
        <KCard>
          {looks.map((l, i) => (
            <Animated.View
              key={l.readingId}
              // The bottom row lands first, the top (newest) row last.
              entering={a11y.reduceMotion ? undefined : arrivalEntering(SLIDE_STAGGER_MS * (looks.length - 1 - i), false)}
            >
              {i > 0 ? <RowDivider /> : null}
              <ExampleRow look={l} />
            </Animated.View>
          ))}
        </KCard>
      </View>
    </ScrollView>
  );
}

function ExampleRow({ look }: { look: ExampleLook }) {
  const { isAccessibilitySize: ax } = useTheme();
  return (
    <View style={{ flexDirection: ax ? 'column' : 'row', alignItems: ax ? 'flex-start' : 'center', gap: space.m, paddingVertical: space.rowY, paddingHorizontal: space.rowX }}>
      <DrawnOutfit pieces={look.pieces} layout={{ kind: 'tile', width: 50, height: 63 }} />
      <View style={ax ? { gap: 2, alignSelf: 'stretch' } : { flex: 1, gap: 2 }}>
        <KText variant="subheadline" weight="600">{occasionLabel('everyday')}</KText>
        <KText variant="footnote" color="ink2">{look.word}</KText>
      </View>
      <Numeral size={20} trimDescender={false}>{look.scoreText}</Numeral>
    </View>
  );
}
