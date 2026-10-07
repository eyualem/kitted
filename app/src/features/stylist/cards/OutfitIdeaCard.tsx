// Outfit idea card (02 D12 / D13): four closet tiles with labels, "Wear this" and "Swap one".
// Built from closet items in code (no AI). P2 renders the seeded ideas; the generator is P5.
import { useState } from 'react';
import { View } from 'react-native';
import { GarmentIcon, KButton, KCard, KCardSection, KText, TagLine, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { garmentIconType } from '@/features/fitcheck/labels';
import { t } from '@/i18n/en';
import { dayKey } from '@kitted/core';
import { sessionClock } from '@/state/session';

export function OutfitIdeaCard({ outfitId }: { outfitId: string }) {
  const { isAccessibilitySize } = useTheme();
  const data = useLive(['outfits', 'closet'], async () => {
    const o = await store.outfits.get(outfitId);
    const closet = await store.closet.all();
    return o ? { o, items: o.itemIds.map((id) => closet.find((c) => c.id === id)).filter((c) => !!c) } : null;
  }, [outfitId]);
  const [wearing, setWearing] = useState(false);
  const [width, setWidth] = useState(0);
  if (!data) return null;
  const { o, items } = data;
  const cols = isAccessibilitySize ? 2 : 4;
  const tile = width > 0 ? Math.floor((width - 8 * (cols - 1)) / cols) : 78;
  const names = items.map((i) => i!.name.toLowerCase()).join(', ');
  const wear = async () => {
    setWearing(true);
    const now = sessionClock.nowMs();
    await store.wearLog.put({ day: dayKey(now, sessionClock.offset), fitCheckId: null, outfitId, createdAt: now });
  };
  return (
    <KCard
      accessibilityLabel={`${t('idea.tag')}, ${t('idea.fromCloset')}: ${o.title ? `${o.title}. ` : ''}${names}.`}
      accessibilityActions={[{ name: 'wear', label: t('idea.wear') }, { name: 'swap', label: t('idea.swap') }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'wear' ? void wear() : undefined)}
    >
      <KCardSection gap={9}>
        <TagLine left={t('idea.tag')} right={t('idea.fromCloset')} />
        {o.title ? (
          <KText variant="headline">{o.title}</KText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {items.map((it) => (
            <View key={it!.id} style={{ width: tile, gap: 6 }}>
              <TileBox size={tile}>
                <GarmentIcon type={garmentIconType(it!.garment)} color={it!.hex} size={Math.round(tile * 0.62)} />
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <KButton title={wearing ? t('idea.wearing') : t('idea.wear')} size="regular" disabled={wearing} onPress={() => void wear()} />
          <KButton title={t('idea.swap')} size="regular" kind="secondary" />
        </View>
      </KCardSection>
    </KCard>
  );
}

function TileBox({ size, children }: { size: number; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
