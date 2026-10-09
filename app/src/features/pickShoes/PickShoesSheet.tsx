// S10 Which shoes? (02 S10): finish a partial check with a pair from his closet. The pair he
// wore last comes first with "Last worn {weekday}". Tapping one applies what the app knows about
// it and re-scores in code (no reading); hems stay unrated. The dashed last tile opens the shoe
// snap (S9; in the demo, the sample sheet in shoe-snap mode). Medium detent, plus large for
// a closet with more than one row of shoes.
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon, KText, opacity, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { fitCheck } from '@/features/fitcheck/session';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { PieceArt } from '@/features/closet/GarmentArt';

const COLUMNS = 3;
const GAP = 8;

export function PickShoesSheet() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const [width, setWidth] = useState(0);
  const data = useLive(['fitChecks', 'closet'], async () => {
    const row = await store.fitChecks.get(checkId);
    if (!row) return null;
    const shoes = (await store.closet.all()).filter((c) => c.slot === 'shoes' && !c.isDeleted);
    const f = row.details.finish;
    const lastId = f?.suggestedItemId ?? null;
    const last = lastId && f?.weekday !== null && f?.weekday !== undefined ? { id: lastId, weekday: weekdayName(f.weekday) } : null;
    // Last-worn first, then the rest in the order he added them.
    const ordered = [...shoes].sort((a, b) => (a.id === last?.id ? -1 : b.id === last?.id ? 1 : a.addedAt - b.addedAt));
    return { shoes: ordered, last };
  }, [checkId]);

  const tile = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  const pick = async (item: ClosetItemRow) => {
    await fitCheck.pickShoes(checkId, item.id);
    router.back();
  };

  return (
    <SheetScaffold title={t('shoes.title')} subtitle={t('shoes.sub')}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingTop: 4 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {tile > 0 && data
          ? [
              ...data.shoes.map((item) => {
                const lastWorn = data.last?.id === item.id ? t('shoes.lastWorn', { weekday: data.last.weekday }) : null;
                return (
                  <ShoeTile key={item.id} size={tile} label={item.name} lastWorn={lastWorn} onPress={() => void pick(item)}>
                    <PieceArt item={item} size={Math.round(tile * 0.8)} />
                  </ShoeTile>
                );
              }),
              <ShoeTile
                key="snap"
                size={tile}
                label={t('shoes.snap')}
                dashed
                onPress={() => router.replace(`/camera?mode=shoeSnap&parent=${checkId}`)}
              >
                <Icon name="camera" size="large" color="ink2" />
              </ShoeTile>,
            ]
          : null}
      </View>
    </SheetScaffold>
  );
}

function ShoeTile({ size, label, lastWorn, dashed, onPress, children }: {
  size: number; label: string; lastWorn?: string | null; dashed?: boolean; onPress: () => void; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={lastWorn ? `${label}. ${lastWorn}` : label}
      style={({ pressed }) => ({ width: size, gap: 6, opacity: pressed ? opacity.pressed : 1 })}
    >
      <View
        style={{
          width: size, height: size, borderRadius: 18, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center',
          backgroundColor: dashed ? 'transparent' : colors.surface2,
          borderWidth: dashed ? 1.5 : 0, borderStyle: dashed ? 'dashed' : 'solid', borderColor: colors.inkFaint,
        }}
      >
        {children}
      </View>
      <KText role="miniLabel" numberOfLines={2}>
        {label}
      </KText>
      {/* A caption, not 02's pill: a pill can't wrap, and "Last worn Wednesday" is wider than a
          third of the sheet (DECISIONS-LOG #33). */}
      {lastWorn ? (
        <KText variant="caption" weight="600" color="accent" numberOfLines={2}>
          {lastWorn}
        </KText>
      ) : null}
    </Pressable>
  );
}
