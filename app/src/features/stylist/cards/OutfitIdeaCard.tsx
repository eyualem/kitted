// Outfit idea card (02 D12 / D13): four closet tiles with labels, "Wear this" and "Swap one".
// Built from closet items in code (no AI). P2 renders the seeded ideas; the generator is P5.
// No "Swap one" here: a seeded idea has no daily-idea row to re-pick (morning.swap needs one), so the
// button did nothing. The morning card (MorningCard) adopts this card on its day and has a working Swap.
import { useState } from 'react';
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, TagLine, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { dayKey } from '@kitted/core';
import { sessionClock } from '@/state/session';
import { PieceArt } from '@/features/closet/GarmentArt';

/** `readOnly`: Past chats (07 §17, U8): an earlier day's idea shows what it was, with no Wear this (it would log today). */
export function OutfitIdeaCard({ outfitId, readOnly = false }: { outfitId: string; readOnly?: boolean }) {
  const { isAccessibilitySize } = useTheme();
  const data = useLive(['outfits', 'closet', 'wearLog'], async () => {
    const o = await store.outfits.get(outfitId);
    const closet = await store.closet.all();
    const today = await store.wearLog.get(dayKey(sessionClock.nowMs(), sessionClock.offset));
    return o ? { o, items: o.itemIds.map((id) => closet.find((c) => c.id === id)).filter((c) => !!c), wearing: today?.outfitId === outfitId } : null;
  }, [outfitId]);
  const [width, setWidth] = useState(0);
  if (!data) return null;
  const { o, items, wearing } = data;
  const cols = isAccessibilitySize ? 2 : 4;
  const tile = width > 0 ? Math.floor((width - space.s * (cols - 1)) / cols) : 78;
  const names = items.map((i) => i!.name.toLowerCase()).join(', ');
  // "Logged for today." with Undo, which puts back whatever today's log held before (02 S1).
  const wear = async () => {
    const now = sessionClock.nowMs();
    const day = dayKey(now, sessionClock.offset);
    const before = await store.wearLog.get(day);
    await store.wearLog.put({ day, fitCheckId: null, outfitId, createdAt: now });
    showToast(t('toast.logged'), async () => {
      if (before) await store.wearLog.put(before);
      else await store.wearLog.delete(day);
    });
  };
  return (
    <KCard
      accessibilityLabel={`${t('idea.tag')}, ${t('idea.fromCloset')}: ${o.title ? `${o.title}. ` : ''}${names}.`}
      accessibilityActions={readOnly ? undefined : [{ name: 'wear', label: t('idea.wear') }]}
      onAccessibilityAction={readOnly ? undefined : (e) => (e.nativeEvent.actionName === 'wear' ? void wear() : undefined)}
    >
      <KCardSection gap={space.s}>
        <TagLine left={t('idea.tag')} right={t('idea.fromCloset')} />
        {o.title ? (
          <KText variant="headline">{o.title}</KText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {items.map((it) => (
            <View key={it!.id} style={{ width: tile, gap: space.xs }}>
              <TileBox size={tile}>
                <PieceArt item={it!} size={Math.round(tile * 0.8)} />
              </TileBox>
              <KText role="miniLabel" numberOfLines={2}>
                {it!.name}
              </KText>
            </View>
          ))}
        </View>
        {o.summary && o.title ? (
          <KText variant="subheadline" color="ink2">
            {o.summary}
          </KText>
        ) : null}
        {readOnly ? null : (
          <View style={isAccessibilitySize ? undefined : { flexDirection: 'row' }}>
            <KButton title={wearing ? t('idea.wearing') : t('idea.wear')} icon={wearing ? 'check' : undefined} size="regular" fullWidth={isAccessibilitySize} disabled={wearing} onPress={() => void wear()} />
          </View>
        )}
      </KCardSection>
    </KCard>
  );
}

function TileBox({ size, children }: { size: number; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: radius.tile, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
