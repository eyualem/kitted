// The pinned "Your moves · n of 3" row (02 D16, D17; 10-onboarding.md §9.9): the first row of Lookbook and You while a
// move is left. Gone before the moves card is posted and once all 3 are done.
import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon, KCard, KText, opacity, space, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { useYourMoves } from './hooks';
import { movesDoneCount, pinnedShows } from './yourMoves';

/** `href`: L3 inside the tab it's pinned in, so Back returns there. */
export function YourMovesRow({ href }: { href: Href }) {
  const plan = useYourMoves();
  const { isAccessibilitySize: ax } = useTheme();
  if (!pinnedShows(plan)) return null;
  const n = movesDoneCount(plan);
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={t('moves.a11y.pinned', { n })}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
    >
      <KCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.rowX, paddingVertical: space.s, minHeight: 52 }}>
          <Icon name="checklist" size="regular" color="ink" scalesWithText />
          {/* At the largest text sizes the count goes under the title; side by side it squeezed the title to "move / s". */}
          <View style={{ flex: 1, flexDirection: ax ? 'column' : 'row', alignItems: ax ? 'flex-start' : 'center', gap: ax ? 2 : space.m }}>
            <KText variant="subheadline" weight="600" style={ax ? undefined : { flex: 1 }}>
              {t('lookbook.moves')}
            </KText>
            <KText variant="subheadline" color="ink2">
              {t('lookbook.movesCount', { n })}
            </KText>
          </View>
          <Icon name="next" size="small" color="ink3" weight="semibold" scalesWithText />
        </View>
      </KCard>
    </Pressable>
  );
}
