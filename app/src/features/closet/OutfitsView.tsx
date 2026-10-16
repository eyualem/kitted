// The Closet's Outfits (09-ui-review §13, #307; 02 D15; mockups/closet-concepts.html): the count, occasion chips, then
// "Try next" (never worn, best first, no score) and "Your go-tos" (worn: his photo and that check's real score). Each
// outfit is a standing outfit (his pieces drawn top / bottoms / shoes, a layer at the side) with its reason line,
// Wear this (logs today, Undo) and Check it (the camera with the occasion). With no full outfit yet: what's missing.
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Chip, ChipFlow, KButton, KCard, KCardSection, KText, Numeral, TagLine, TextLink, radius, space, useTheme, Icon } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow, FitCheckRow, OccasionKey } from '@/data/types';
import { useLive } from '@/data/useLive';
import { shownPhoto } from '@/demo/demoPhotos';
import { scoreWordLabel, displayScore } from '@/design-system/score';
import { showToast } from '@/features/toast/toast';
import { occasionLabel } from '@/features/stylist/thread';
import { t } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { goToStylist } from '@/router/stylistAction';
import { wearOutfit } from './outfitActions';
import { gainLine, loadNextBuy } from './nextBuyData';
import { StandingOutfit } from './StandingOutfit';
import { buildOutfits, gainForSlot, OUTFIT_OCCASIONS, outfitLists, outfitPieces, slotChecklist, type Outfit } from './outfits';

/** How many outfits a list shows before "Show {n} more". */
const FIRST = 5;

export function OutfitsView({ closet, checks, count, styles }: { closet: readonly ClosetItemRow[]; checks: readonly FitCheckRow[]; count: number; styles: Parameters<typeof buildOutfits>[0]['styles'] }) {
  const [occasion, setOccasion] = useState<OccasionKey>('everyday');
  const pieces = outfitPieces(closet).length; // the pieces the grid shows (only the outfit count leaves chat-only pieces out)
  const list = useLive([], async () => outfitLists(buildOutfits({ closet, checks, styles, occasion })), [closet, checks, styles, occasion]);
  if (count === 0) return <NoOutfits closet={closet} checks={checks} styles={styles} />;
  return (
    <View style={{ gap: space.stack }}>
      <KText variant="footnote" color="ink2">
        {count === 1 ? t('closet.outfits.countOne', { p: pieces }) : t('closet.outfits.count', { p: pieces, n: count })}
        {count < 3 ? ` · ${count === 1 ? t('closet.outfits.soFarOne') : t('closet.outfits.soFar', { n: count })}` : ''}
      </KText>
      <NextBuyRow />
      <ChipFlow>
        {OUTFIT_OCCASIONS.map((o) => (
          <Chip key={o} title={occasionLabel(o)} small state={o === occasion ? 'selected' : 'normal'} onPress={() => setOccasion(o)} />
        ))}
      </ChipFlow>
      {list ? (
        <>
          {list.tryNext.length ? <OutfitSection title={t('closet.outfits.tryNext')} right={t('closet.outfits.tryNextCount', { n: list.tryNext.length })} outfits={list.tryNext} closet={closet} occasion={occasion} /> : null}
          {list.goTos.length ? <OutfitSection title={t('closet.outfits.goTos')} right={t('closet.outfits.goTosCount', { n: list.goTos.length })} outfits={list.goTos} closet={closet} occasion={occasion} /> : null}
        </>
      ) : null}
    </View>
  );
}

function OutfitSection({ title, right, outfits, closet, occasion }: { title: string; right: string; outfits: readonly Outfit[]; closet: readonly ClosetItemRow[]; occasion: OccasionKey }) {
  const [all, setAll] = useState(false);
  const shown = all ? outfits : outfits.slice(0, FIRST);
  return (
    <View style={{ gap: space.s }}>
      <TagLine left={title} right={right} />
      {shown.map((o) => (
        <OutfitCard key={o.key} outfit={o} closet={closet} occasion={occasion} />
      ))}
      {outfits.length > FIRST ? (
        <TextLink title={all ? t('closet.piece.fewer') : t('closet.outfits.more', { n: outfits.length - FIRST })} onPress={() => setAll(!all)} />
      ) : null}
    </View>
  );
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export function OutfitCard({ outfit, closet, occasion, label }: { outfit: Outfit; closet: readonly ClosetItemRow[]; occasion: OccasionKey; label?: string }) {
  const { isAccessibilitySize } = useTheme();
  const items = outfit.itemIds.map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
  const names = items.map((i) => lower(i.name)).join(', ');
  const wear = async () => {
    const undo = await wearOutfit({ store, clock: sessionClock, ids: newId }, outfit.itemIds, occasion, names);
    showToast(t('toast.logged'), undo);
  };
  const check = () => router.push({ pathname: '/camera', params: { occasion, from: 'closet' } } as unknown as Href);
  const w = outfit.worn;
  const spoken = [label, t('closet.outfits.a11y', { names, reason: outfit.reason }), w ? `${displayScore(w.score)}, ${scoreWordLabel(w.score)}` : null].filter(Boolean).join('. ');
  return (
    <KCard
      accessibilityLabel={spoken}
      accessibilityActions={[{ name: 'wear', label: t('idea.wear') }, { name: 'check', label: t('ask.card.checkIt') }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'wear' ? void wear() : e.nativeEvent.actionName === 'check' ? check() : undefined)}
    >
      <KCardSection gap={space.s}>
        <View style={isAccessibilitySize ? { gap: space.s } : { flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
          {w ? <WornPhoto worn={w} /> : <StandingOutfit items={items} layerId={outfit.layerId} />}
          <View style={{ flex: isAccessibilitySize ? undefined : 1, gap: 6 }}>
            {label ? <KText role="miniLabel" color="ink2">{label}</KText> : null}
            <KText variant="subheadline" weight="600">
              {items.map((i) => i.name).join(' · ')}
            </KText>
            <KText variant="footnote" color="ink2">
              {outfit.reason}
            </KText>
            {w ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Numeral size={20} trimDescender={false}>{displayScore(w.score)}</Numeral>
                <KText variant="footnote" color="ink2">{scoreWordLabel(w.score)}</KText>
              </View>
            ) : null}
          </View>
        </View>
        <View style={isAccessibilitySize ? { gap: space.s } : { flexDirection: 'row', gap: space.s }}>
          <KButton title={t('idea.wear')} size="regular" fullWidth={isAccessibilitySize} onPress={() => void wear()} />
          <KButton title={t('ask.card.checkIt')} icon="camera" kind="secondary" size="regular" fullWidth={isAccessibilitySize} onPress={check} />
        </View>
      </KCardSection>
    </KCard>
  );
}

function WornPhoto({ worn, width = 96 }: { worn: NonNullable<Outfit['worn']>; width?: number }) {
  const { colors } = useTheme();
  const photo = shownPhoto(worn.demoPhotoId, worn.photoFile, undefined);
  const h = Math.round(width * 4 / 3);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('closet.piece.openLook')}
      onPress={() => router.push(`/photo/${worn.checkId}` as Href)}
      style={{ width, height: h, borderRadius: radius.tile, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}
    >
      {photo ? <Image source={typeof photo.source === 'string' ? { uri: photo.source } : photo.source} style={{ width, height: h }} resizeMode="cover" /> : <Icon name="photo" color="ink3" size="small" />}
    </Pressable>
  );
}

/** No outfits yet (#88): Top · Bottoms · Shoes, the missing one named with what it would unlock, and the ways in. */
function NoOutfits({ closet, checks, styles }: { closet: readonly ClosetItemRow[]; checks: readonly FitCheckRow[]; styles: Parameters<typeof buildOutfits>[0]['styles'] }) {
  const slots = slotChecklist(closet);
  const missing = slots.find((s) => !s.have);
  const gain = missing && slots.filter((s) => !s.have).length === 1 ? gainForSlot(closet, checks, styles, missing.slot) : 0;
  return (
    <KCard>
      <KCardSection gap={space.s}>
        <KText variant="headline">{t('closet.outfits.none.title')}</KText>
        {slots.map((s) => (
          <View key={s.slot} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible accessibilityLabel={`${t(`closet.outfits.slot.${s.slot}`)}${s.have ? '' : `. ${t(`closet.outfits.none.need.${s.slot}`)}`}`}>
            <Icon name={s.have ? 'checkFilled' : 'circle'} size="small" color={s.have ? 'ink' : 'ink3'} />
            <KText variant="subheadline" color={s.have ? 'ink' : 'ink2'}>{t(`closet.outfits.slot.${s.slot}`)}</KText>
          </View>
        ))}
        {missing ? (
          <KText variant="footnote" color="ink2">
            {gain > 0 ? t(`closet.outfits.none.add.${missing.slot}`, { n: gain }) : t(`closet.outfits.none.need.${missing.slot}`)}
          </KText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
          <KButton title={t('closet.empty.basics')} kind="secondary" size="regular" onPress={() => router.push('/closet/starter' as Href)} />
          <KButton title={t('closet.empty.check')} icon="camera" size="regular" onPress={() => goToStylist({ kind: 'checkMyFit' })} />
        </View>
      </KCardSection>
    </KCard>
  );
}


/** The next best buy (C7, #308): one row under the count; a tap opens its sheet. */
function NextBuyRow() {
  const nb = useLive(['closet', 'fitChecks', 'kv'], loadNextBuy, []);
  if (!nb) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('closet.nextBuy.tag')}: ${nb.entry.pick!.name}. ${gainLine(nb.gain)}. ${nb.entry.budget}`}
      onPress={() => router.push('/sheets/next-buy' as Href)}
    >
      <KCard>
        <KCardSection gap={4}>
          <TagLine left={t('closet.nextBuy.tag')} right={nb.entry.budget} />
          <KText variant="headline">{nb.entry.pick!.name}</KText>
          <KText variant="subheadline" color="ink2">{gainLine(nb.gain)}</KText>
        </KCardSection>
      </KCard>
    </Pressable>
  );
}
