// C1 · Closet (02 D15). Until P5 builds the full screen (Rotation, Starter essentials, filters),
// it shows what the closet really holds: the C1e empty state, or a plain grid of his pieces.
// No dev placeholder text in a tab (DECISIONS-LOG #56).
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EmptyState, GarmentIcon, KButton, KText, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { garmentIconType } from '@/features/fitcheck/labels';
import { goToStylist } from '@/router/stylistAction';
import { t } from '@/i18n/en';

const GAP = 10;

export default function ClosetScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const items = useLive(['closet'], async () => (await store.closet.all()).filter((c) => !c.isDeleted), []);
  const [width, setWidth] = useState(0);
  if (!items) return null;
  const cols = isAccessibilitySize ? 2 : 3;
  const tile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, gap: 13 }}>
      {items.length === 0 ? (
        <EmptyState icon="closet" title={t('closet.empty.title')} body={t('closet.empty.body')}>
          <KButton title={t('closet.empty.check')} icon="camera" size="regular" style={{ alignSelf: 'center' }} onPress={() => goToStylist({ kind: 'checkMyFit' })} />
        </EmptyState>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {tile > 0
            ? items.map((it) => (
                <View key={it.id} style={{ width: tile, gap: 6 }} accessible accessibilityLabel={it.name}>
                  <View style={{ width: tile, height: tile, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <GarmentIcon type={garmentIconType(it.garment)} color={it.hex} size={Math.round(tile * 0.62)} />
                  </View>
                  <KText role="miniLabel" numberOfLines={2}>
                    {it.name}
                  </KText>
                </View>
              ))
            : null}
        </View>
      )}
    </ScrollView>
  );
}
