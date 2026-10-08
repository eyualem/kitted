// The card's closet row (02 D7, #91): up to 4 overlapping thumbs, "Added 3 to Closet · 1 question" (or
// "Checking the details…" while the closet call is out), and Review. The AddedRow look, with the new tiles.
import { View } from 'react-native';
import { KText, TextLink, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';

export function ClosetSummaryRow({ items, text, onReview }: { items: ClosetItemRow[]; text: string; onReview?: () => void }) {
  const { colors, isAccessibilitySize } = useTheme();
  return (
    <View style={isAccessibilitySize ? { gap: 6, alignItems: 'flex-start' } : { flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {items.length > 0 ? (
        <View style={{ flexDirection: 'row' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {items.slice(0, 4).map((it, i) => (
            <View key={it.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: i, borderRadius: 9.5, borderWidth: 1.5, borderColor: colors.surface }}>
              <ClosetTile item={it} size={28} radius={8} scale={0.86} decorative />
            </View>
          ))}
        </View>
      ) : null}
      <KText role="addedRow" style={{ flexShrink: 1 }}>
        {text}
      </KText>
      {onReview ? (
        <View style={isAccessibilitySize ? undefined : { marginLeft: 'auto' }}>
          <TextLink title={t('card.review')} onPress={onReview} compact />
        </View>
      ) : null}
    </View>
  );
}
