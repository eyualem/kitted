// C3 · "What it is" → one row's picker (09-ui-review §17, #315; replaces 02 C3's one-form Edit item, founder's pick:
// one row at a time, from pictures). Kind, Leg, Fit and Pattern: a grid of the piece itself drawn with only that one
// thing changed, in its own color (pieceEdit.withEdit, the same thing the pick writes), the current one ringed with a
// check; Kind keeps the rest of the slot's kinds under "More kinds". Color: named swatches in four groups. One tap picks:
// the sheet closes and a toast says what changed, with Undo. Scores never change.
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { lightnessOf } from '@kitted/core';
import { Icon, KText, TagLine, lightColors, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { artSpec } from './artSpec';
import { GarmentArt } from './GarmentArt';
import { pickEdit } from './pieceActions';
import { doubtLine, fitDoubt } from './fitDoubt';
import { editOptions, editRows, optionA11y, withEdit, type EditField, type EditOption } from './pieceEdit';
import { isAwaitingAnswer, isOwned } from './profile';

const GAP = 10;
const FIELDS: readonly EditField[] = ['kind', 'color', 'leg', 'fit', 'pattern'];

function Choice({ item, field, option, size, onPick }: { item: ClosetItemRow; field: EditField; option: EditOption; size: number; onPick: () => void }) {
  const { colors } = useTheme();
  const a11y = optionA11y(field, option);
  const preview = withEdit(item, field, option.value);
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel={a11y.label}
      accessibilityState={{ selected: a11y.selected }}
      style={({ pressed }) => ({ width: size, gap: 6, opacity: pressed ? opacity.pressed : 1 })}
    >
      <View
        style={{
          width: size, height: size, borderRadius: radius.tile, borderCurve: 'continuous', backgroundColor: colors.surface,
          borderWidth: option.current ? 2.5 : 1, borderColor: option.current ? colors.ink : colors.line, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <GarmentArt spec={artSpec(preview)} size={Math.round(size * 0.76)} />
        {option.current ? (
          <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={12} weight="bold" color="bg" />
          </View>
        ) : null}
      </View>
      <KText variant="footnote" weight={option.current ? '600' : '400'} style={{ textAlign: 'center' }} numberOfLines={2}>
        {option.label}
      </KText>
    </Pressable>
  );
}

function Swatch({ option, hex, width, onPick }: { option: EditOption; hex: string; width: number; onPick: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ selected: option.current }}
      style={({ pressed }) => ({ width, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? opacity.pressed : 1 })}
    >
      <View
        style={{
          width: 34, height: 34, borderRadius: 17, backgroundColor: hex, alignItems: 'center', justifyContent: 'center',
          // a hairline ring so black on night and white on chalk still show; the current one ringed in ink
          borderWidth: option.current ? 2.5 : 1, borderColor: option.current ? colors.ink : colors.line,
        }}
      >
        {option.current ? <Icon name="check" size={13} weight="bold" color={(lightnessOf(hex) ?? 50) > 62 ? lightColors.ink : '#FFFFFF'} /> : null}
      </View>
      <KText variant="subheadline" weight={option.current ? '600' : '400'} style={{ flexShrink: 1 }}>
        {option.label}
      </KText>
    </Pressable>
  );
}

export function EditSheet() {
  const { id, field: rawField } = useLocalSearchParams<{ id: string; field?: string }>();
  const field = (FIELDS.find((f) => f === rawField) ?? 'kind') as EditField;
  const { colors, isAccessibilitySize: ax } = useTheme();
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const data = useLive(['closet', 'closetObs'], async () => {
    const all = await store.closet.all();
    const item = all.find((c) => c.id === id);
    if (!item || !isOwned(item) || isAwaitingAnswer(item, all.filter(isOwned))) return null;
    return { item, doubt: fitDoubt(item, await store.closetObs.all()) };
  }, [id]);
  const item = data?.item ?? null;
  const row = item ? editRows(item).find((r) => r.field === field) : undefined;
  const title = row?.label ?? t('closet.edit.title');
  const cols = ax ? 2 : 3;
  const tile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  const pick = (value: EditOption['value']) => {
    if (!item || busy) return;
    setBusy(true);
    void pickEdit(item, field, value, { onDone: () => router.back() }).finally(() => setBusy(false));
  };
  const grid = (list: readonly EditOption[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: space.m }}>
      {list.map((o) => <Choice key={String(o.value)} item={item!} field={field} option={o} size={tile} onPick={() => pick(o.value)} />)}
    </View>
  );
  // A "Not sure" row (§18): nothing ringed as current, so any pick settles it.
  const opts = item && row ? editOptions(item, field, { unsure: data?.doubt?.field === field }) : null;

  return (
    <SheetScaffold title={title} subtitle={data?.doubt?.field === field ? doubtLine(data.doubt) : t('closet.edit.sub')}>
      <View style={{ gap: space.l, paddingTop: 4 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {item && opts && tile > 0 ? (
          field === 'color' ? (
            (opts.groups ?? []).map((g) => (
              <View key={g.title} style={{ gap: space.s }}>
                <TagLine left={g.title} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: 4 }}>
                  {g.options.map((o) => (
                    <Swatch
                      key={String(o.value)} option={o} hex={withEdit(item, 'color', o.value).hex}
                      width={ax ? width : Math.floor((width - GAP * 2) / 3)} onPick={() => pick(o.value)}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <>
              {grid(opts.main)}
              {opts.more.length > 0 ? (
                showMore ? (
                  <View style={{ gap: space.m }}>
                    <TagLine left={t('closet.edit.more')} />
                    {grid(opts.more)}
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowMore(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('closet.edit.more')}
                    accessibilityHint={t('closet.edit.a11y.more', { n: opts.more.length })}
                    style={({ pressed }) => ({
                      minHeight: 50, borderRadius: radius.cardSmall, borderCurve: 'continuous', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: space.s,
                      paddingHorizontal: space.rowX, paddingVertical: space.rowY, opacity: pressed ? opacity.pressed : 1,
                    })}
                  >
                    <KText variant="body" style={{ flex: 1 }}>{t('closet.edit.more')}</KText>
                    <KText variant="subheadline" color="ink3">{String(opts.more.length)}</KText>
                    <Icon name="next" size={13} weight="semibold" color="ink3" />
                  </Pressable>
                )
              ) : null}
            </>
          )
        ) : null}
      </View>
    </SheetScaffold>
  );
}
