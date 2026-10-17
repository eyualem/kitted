// Closet's To confirm: "How do your mid-wash jeans fit?" (09-ui-review §18, #316). One card at most, for the piece
// whose own photos disagree most (fitDoubt.fitCard). A tap opens the piece's Leg or Fit picker (§17's sheet, nothing
// ringed); a pick settles it and the card goes. Skip keeps it quiet until a newer photo disagrees again. Never on a
// score card, and no answer here moves a score.
import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon, KText, TextLink, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { ClosetTile } from './ClosetTile';
import { doubtQuestion, doubtSeen, FIT_SKIP_KEY, parseSkips, withSkip, type FitDoubt } from './fitDoubt';
import { editHref } from './pieceActions';

const THUMB = 64;

export function FitQuestion({ item, doubt }: { item: ClosetItemRow; doubt: FitDoubt }) {
  const { isAccessibilitySize: ax } = useTheme();
  const question = doubtQuestion(doubt, item.name);
  const seen = doubtSeen(doubt);
  const skip = async () => {
    const skips = parseSkips(await store.getKv(FIT_SKIP_KEY));
    await store.setKv(FIT_SKIP_KEY, withSkip(skips, item.id, doubt, sessionClock.nowMs()));
  };
  return (
    <View style={{ gap: space.s }}>
      <Pressable
        onPress={() => router.push(editHref(item, doubt.field, 'card') as Href)}
        accessibilityRole="button"
        accessibilityLabel={`${question} ${seen}`}
        accessibilityHint={t('closet.unsure.a11y.hint')}
        style={({ pressed }) => ({ flexDirection: ax ? 'column' : 'row', alignItems: ax ? 'flex-start' : 'center', gap: space.m, opacity: pressed ? opacity.pressed : 1 })}
      >
        <ClosetTile item={item} size={THUMB} aspect={1} radius={radius.tile} decorative />
        <View style={{ flex: ax ? undefined : 1, gap: 2 }}>
          <KText variant="callout" weight="600">
            {question}
          </KText>
          <KText variant="footnote" color="ink3">
            {seen}
          </KText>
        </View>
        {ax ? null : <Icon name="next" size={13} weight="semibold" color="ink3" />}
      </Pressable>
      {/* under the question, not the drawing (stacked at the largest sizes) */}
      <View style={{ alignSelf: 'flex-start', marginLeft: ax ? 0 : THUMB + space.m }}>
        <TextLink compact title={t('tap.skip')} onPress={() => void skip()} />
      </View>
    </View>
  );
}
