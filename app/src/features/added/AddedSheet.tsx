// S11 Added to your closet (02 S11): what this check put in his closet. Undo takes an item out
// (the row stays, so he can add it back); the score never changes. A row tap opens the item's
// editor (C3). The "Same as your white tee?" question needs a closet-match confidence the
// reading doesn't have yet, so it isn't shown (DECISIONS-LOG #31).
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Garment } from '@kitted/core';
import { GarmentIcon, Icon, KText, RowDivider, TextLink, opacity, size, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { volumeWord } from '@/features/correct/fields';
import { garmentIconType } from '@/features/fitcheck/labels';
import { fitCheck } from '@/features/fitcheck/session';
import { SheetList, SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t, type StringKey } from '@/i18n/en';

const SLOT: Record<string, StringKey> = { top: 'added.slot.top', bottom: 'added.slot.bottom', shoes: 'added.slot.shoes', outer: 'added.slot.outer' };
const LEG: Record<string, StringKey> = {
  skinny: 'value.leg.skinny', slim: 'value.leg.slim', straight: 'value.leg.straight', relaxed: 'value.leg.relaxed', wide: 'value.leg.wide',
};

/** "Top · Regular fit", "Bottom · Straight leg", "Shoes". */
export function addedDetail(item: Pick<ClosetItemRow, 'slot' | 'garment'>): string {
  const slot = SLOT[item.slot] ? t(SLOT[item.slot]!) : '';
  const fit = fitWord(item.garment);
  return fit && slot ? t('added.detail', { slot, fit }) : slot || fit;
}

function fitWord(g: Garment): string {
  if (g.category === 'top' || g.category === 'outerwear') return t('added.topFit', { fit: volumeWord(g.volume) });
  const leg = g.category === 'bottom' && typeof g.leg_shape === 'string' ? LEG[g.leg_shape] : undefined;
  return leg ? t('added.legFit', { leg: t(leg) }) : '';
}

export function AddedSheet() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const data = useLive(['fitChecks', 'closet'], async () => {
    const row = await store.fitChecks.get(checkId);
    if (!row) return null;
    const cs = row.details.closetSummary ?? { matched: [], added: [], undone: [] };
    const closet = await store.closet.all();
    const items = cs.added.map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
    return { items, undone: new Set(cs.undone) };
  }, [checkId]);

  return (
    <SheetScaffold title={t('added.title')} subtitle={t('added.sub')} doneLabel={t('common.done')}>
      {data && data.items.length > 0 ? (
        <SheetList>
          {data.items.map((item, i) => (
            <View key={item.id}>
              {i > 0 ? <RowDivider /> : null}
              <AddedItemRow
                item={item}
                removed={data.undone.has(item.id)}
                onEdit={() => router.push(`/sheets/edit-item/${item.id}`)}
                onToggle={(undone) => void fitCheck.setItemUndone(checkId, item.id, undone)}
              />
            </View>
          ))}
        </SheetList>
      ) : null}
    </SheetScaffold>
  );
}

function AddedItemRow({ item, removed, onEdit, onToggle }: { item: ClosetItemRow; removed: boolean; onEdit: () => void; onToggle: (undone: boolean) => void }) {
  const { colors } = useTheme();
  const detail = addedDetail(item);
  const name = item.name;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 8, minHeight: 64 }}
      accessible
      accessibilityLabel={removed ? t('added.a11y.removed', { name }) : t('added.a11y.row', { name, detail: detail.replace(' · ', ', ').toLowerCase() })}
      accessibilityActions={removed ? [{ name: 'addBack', label: t('added.addBack') }] : [{ name: 'edit', label: t('common.edit') }, { name: 'undo', label: t('common.undo') }]}
      onAccessibilityAction={(e) => {
        const a = e.nativeEvent.actionName;
        if (a === 'edit') onEdit();
        else if (a === 'undo') onToggle(true);
        else if (a === 'addBack') onToggle(false);
      }}
    >
      <Pressable
        onPress={removed ? undefined : onEdit}
        disabled={removed}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? opacity.pressed : 1 })}
      >
        <View
          style={{
            width: 44, height: 44, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surface2,
            alignItems: 'center', justifyContent: 'center', opacity: removed ? 0.4 : 1,
          }}
        >
          <GarmentIcon type={garmentIconType(item.garment)} color={item.hex} size={36} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <KText variant="subheadline" weight="600" color={removed ? 'ink3' : 'ink'} style={removed ? { textDecorationLine: 'line-through', textDecorationColor: colors.ink3 } : undefined}>
            {name}
          </KText>
          <KText role="rowSubtitle" color="ink2">
            {removed ? t('added.removed') : detail}
          </KText>
        </View>
      </Pressable>
      {removed ? (
        <View style={{ paddingRight: 8 }}>
          <TextLink title={t('added.addBack')} onPress={() => onToggle(false)} />
        </View>
      ) : (
        <Pressable
          onPress={() => onToggle(true)}
          accessibilityRole="button"
          accessibilityLabel={t('added.a11y.undo', { name })}
          style={({ pressed }) => ({ width: size.hit, height: size.hit, alignItems: 'center', justifyContent: 'center', opacity: pressed ? opacity.pressed : 1 })}
        >
          <Icon name="undo" size="regular" color="ink2" />
        </Pressable>
      )}
    </View>
  );
}
