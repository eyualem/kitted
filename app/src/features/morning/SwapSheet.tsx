// S28 Swap one (02 §3.3, 09-ui-review §28, #370): the card's pieces in a row; tapping one shows what else in his
// closet works in its place (the picker's own rules, `morning.swapOptions`); tapping one of those changes the card in
// place, closes the sheet and offers Undo. It replaced the action sheet that let code pick the replacement (#353).
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { KText, MonoLabel, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { PieceArt } from '@/features/closet/GarmentArt';
import { GoneSheet } from '@/features/gone/Gone';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { morning } from './index';

const GAP = 8;
/** "Instead of your grey tee": the name mid-sentence, as the card's "Updated for your …" line says it. */
const midName = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

export function SwapSheet() {
  const { ideaId } = useLocalSearchParams<{ ideaId: string }>();
  const { isAccessibilitySize } = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const data = useLive(['dailyIdeas', 'outfits', 'closet'], async () => {
    const row = await store.dailyIdeas.get(ideaId);
    if (!row) return null;
    const outfit = row.outfitId ? await store.outfits.get(row.outfitId) : null;
    const closet = await store.closet.all();
    const items = (outfit?.itemIds ?? []).map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c && !c.isDeleted);
    return { items };
  }, [ideaId]);
  const options = useLive(['dailyIdeas', 'outfits', 'closet', 'kv'], async () => {
    if (!selected) return [];
    const opts = await morning.swapOptions(ideaId, selected);
    const closet = await store.closet.all();
    return opts.map((o) => closet.find((c) => c.id === o.itemId)).filter((c): c is ClosetItemRow => !!c);
  }, [ideaId, selected]);

  if (data === null) return <GoneSheet />;
  const pieces = data?.items ?? [];
  const current = pieces.find((p) => p.id === selected) ?? null;
  const pieceTile = width > 0 && pieces.length ? Math.floor((width - GAP * (pieces.length - 1)) / pieces.length) : 0;
  const cols = isAccessibilitySize ? 2 : 3;
  const optionTile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;

  const pick = async (item: ClosetItemRow) => {
    if (!selected || busy) return;
    setBusy(true);
    const undo = await morning.swapTo(ideaId, selected, item.id);
    router.back();
    if (undo) showToast(t('swap.done', { item: midName(item.name) }), undo, { ms: TOAST_MS_REMOVAL });
    else setBusy(false);
  };

  return (
    <SheetScaffold title={t('swap.title')} subtitle={t('swap.sub')}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', gap: GAP, paddingTop: 4 }}>
        {pieceTile > 0
          ? pieces.map((it) => (
              <Tile
                key={it.id}
                size={pieceTile}
                selected={it.id === selected}
                label={t('swap.a11y.piece', { name: it.name })}
                onPress={() => setSelected(it.id)}
              >
                <PieceArt item={it} size={Math.round(pieceTile * 0.84)} />
              </Tile>
            ))
          : null}
      </View>
      {current ? (
        <View style={{ gap: space.m, paddingTop: space.l }}>
          <MonoLabel>{t('swap.instead', { item: midName(current.name) })}</MonoLabel>
          {options === undefined ? null : options.length === 0 ? (
            <KText variant="subheadline" color="ink2">
              {t('swap.none')}
            </KText>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, rowGap: space.m }}>
              {optionTile > 0
                ? options.map((it) => (
                    <Tile key={it.id} size={optionTile} name={it.name} label={t('swap.a11y.option', { name: it.name })} onPress={() => void pick(it)}>
                      <PieceArt item={it} size={Math.round(optionTile * 0.8)} />
                    </Tile>
                  ))
                : null}
            </View>
          )}
        </View>
      ) : null}
    </SheetScaffold>
  );
}

function Tile({ size, selected, name, label, onPress, children }: {
  size: number; selected?: boolean; name?: string; label: string; onPress: () => void; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({ width: size, gap: 6, opacity: pressed ? opacity.pressed : 1 })}
    >
      <View
        style={{
          width: size, height: size, borderRadius: radius.tile, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.surface2, borderWidth: 2, borderColor: selected ? colors.ink : 'transparent',
        }}
      >
        {children}
      </View>
      {name ? (
        <KText role="miniLabel" numberOfLines={3}>
          {name}
        </KText>
      ) : null}
    </Pressable>
  );
}
