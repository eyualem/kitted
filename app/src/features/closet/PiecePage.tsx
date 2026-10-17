// C2 · A piece's page (#276; 09-ui-review §3 option A; 02 C2). A tap on a Closet tile opens it (long-press stays the
// shortcut). The drawing comes first (#141, #276 call 2: tiles stay pure drawings), then his real photos of the piece
// with the piece outlined, never the cut-out alone (#276 call 1), and a photo never changes the drawing (call 3).
//   1. The hero: a swipe gallery, the drawing, then his cover photo and his other photos; page dots only when there
//      are photos, a light tick per page. A tap on a photo opens it full screen on that check.
//   2. The name (tap to rename), the slot, then "What it is" (§17, #315): Kind · Color · Leg or Fit · Pattern, each
//      opening its picker (a Fit or Leg its photos disagree on reads "Not sure", §18, #316); then what the data says:
//      worn, last worn, added.
//   3. "Your photos · N": square crops, best first, the cover marked. Long-press (or VoiceOver actions): Use as cover ·
//      Open the look · Not this piece (a correction, with Undo) · It's another piece… (move just this photo to another
//      piece of its kind, with Undo; on the piece's only photo, merge the piece; §8, #289) · Remove photo (with Undo). Mostly hidden ones fold into
//      "N more, partly hidden"; the same photo re-checked shows once.
//   4. Remove from Closet (with Undo), back to the grid.
// Every crop starts below his head and a mirror selfie reads true-view (cropSafety). Nothing here is sent anywhere.
//   5. "Same as another piece…" (#280) when another piece in its slot could be it: a picker, one confirm, then this
//      piece folds into that one (Undo in the toast); the page then moves to the kept piece, and an Undo while this
//      page is still on screen moves it back to the restored piece (§7 C3).
// Not built yet (no dead buttons): Add a photo of it, Goes with, Style this.
import { useCallback, useId, useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Stack, router, useFocusEffect, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon, KText, TagLine, TextLink, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { addedDetail } from '@/features/added/addedDetail';
import { LinkRow, Section, ValueRow } from '@/features/settings/SettingsList';
import { t } from '@/i18n/en';
import { longDate } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { artSpec } from './artSpec';
import { ClosetTile } from './ClosetTile';
import { colorPhrase } from './itemName';
import { mergeOffer, notePieceBlur, notePieceFocus } from './merge';
import { anotherPiece, editHref, openLook, openPhoto, notThisPiece, removePhoto, removePiece, renamePiece, setAsCover } from './pieceActions';
import { fitDoubt } from './fitDoubt';
import { editRows } from './pieceEdit';
import { piecePhotos, type PiecePhoto } from './piecePhotos';
import { livePhotoDeps, loadPhotoChecks } from './photoChecks';
import { OutfitCard } from './OutfitsView';
import { buildOutfits, goesWith } from './outfits';
import type { PhotoAction } from './PiecePhotoTile';
import { PhotoMenu } from './PhotoMenu';
import { isOwned } from './profile';
import { SightingCrop } from './SightingCrop';
import { photoMenuItems, photoOffer, type PhotoMenuItem } from './wrongCard';

/** iOS destructive red at the mockup's values (as Y7's red rows): systemRed is under 4.5:1 on white. */
const DANGER = { light: '#C9302C', dark: '#FF6961' } as const;
const GRID_GAP = 8;

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "Layer · Grey · Regular fit" (S11's "Layer · Regular fit" with the color it's drawn in). */
export function pieceDetail(item: Pick<ClosetItemRow, 'slot' | 'garment' | 'art'>): string {
  const base = addedDetail(item);
  const color = cap(colorPhrase(item.art?.family ?? (typeof item.garment.color_family === 'string' ? item.garment.color_family : null), item.art?.shade ?? null, item.garment.subcategory));
  if (!color) return base;
  const [slot, ...rest] = base.split(' · ');
  return rest.length > 0 ? t('closet.piece.detail', { slot: slot ?? '', color, fit: rest.join(' · ') }) : t('closet.piece.detailNoFit', { slot: slot ?? '', color });
}

/** The line under the name: the slot ("Bottom", "Layer"); the rest lives in "What it is" (§17). */
function slotWord(item: Pick<ClosetItemRow, 'slot' | 'garment'>): string {
  return addedDetail({ slot: item.slot, garment: {} });
}

function addedLine(item: ClosetItemRow): string {
  const date = longDate(item.addedAt, sessionClock.offset);
  if (item.starterId) return t('item.source.starter');
  if (item.source === 'chat') return t('item.source.chat');
  return item.source === 'fitCheck' ? t('item.source.fitCheck', { date }) : t('item.source.added', { date });
}

export function PiecePage({ id, mergedFrom = null }: { id: string; mergedFrom?: string | null }) {
  const { colors, scheme, isAccessibilitySize } = useTheme();
  const { width: screenW } = useWindowDimensions();
  // The hero page, with the page count it was read at: when a photo is removed or comes back, the gallery remounts at
  // the drawing, so a page from the old count no longer applies.
  const [paged, setPaged] = useState({ n: 0, of: 0 });
  // The column's real width (the web preview boxes the app narrower than the window).
  const [colW, setColW] = useState(0);
  const [showFolded, setShowFolded] = useState(false);
  const data = useLive(['closet', 'closetObs', 'fitChecks'], async () => {
    const all = await store.closet.all();
    const item = all.find((c) => c.id === id) ?? null;
    if (!item || !isOwned(item)) return { item: null, mergedInto: item?.mergedInto ?? null };
    const obs = await store.closetObs.all();
    const checks = await loadPhotoChecks(store);
    const photos = piecePhotos(item, obs, checks, livePhotoDeps);
    const rows = new Map((await store.fitChecks.all()).map((r) => [r.id, r]));
    const inLookbook = new Set([...rows.values()].filter((r) => !r.details.removedFromLookbook).map((r) => r.id));
    // What each photo's menu offers: Not this piece and It's another piece… (§8, #289).
    const ctx = { all, obs, checks };
    const offers = new Map([...photos.shown, ...photos.folded].map((ph) => [ph.obsId, photoOffer(item, ph.obsId, ctx)]));
    // Goes with (09-ui-review §13 O9, #307): the outfits with this piece; a layer gets the list built around it.
    const fitRows = [...rows.values()];
    const styles = (await store.profile.get('me'))?.styles ?? null;
    const around = buildOutfits({ closet: all, checks: fitRows, styles, occasion: 'everyday', ...(item.slot === 'outer' ? { withLayer: item.id } : {}) });
    const outfitsWith = around.filter((o) => o.itemIds.includes(item.id));
    return { item, photos, inLookbook, offers, merge: mergeOffer(item, all), all, goes: goesWith(item.id, around), outfitsWith: outfitsWith.length, doubt: fitDoubt(item, obs) };
  }, [id]);
  // Folded into another piece (#280): back on this page after the picker closes, it shows the kept piece instead.
  const mergedInto = data && !data.item ? data.mergedInto : null;
  useFocusEffect(useCallback(() => {
    if (mergedInto) router.replace(`/closet/item/${mergedInto}?mergedFrom=${encodeURIComponent(id)}` as Href);
  }, [mergedInto, id]));
  // Which piece page is on screen, so a merge's Undo moves only the page that ran it back (§7 C3).
  const pageKey = useId();
  useFocusEffect(useCallback(() => {
    notePieceFocus({ key: pageKey, pieceId: id, mergedFrom });
    return () => notePieceBlur(pageKey);
  }, [pageKey, id, mergedFrom]));
  if (!data) return null;
  const W = colW || Math.max(0, Math.round(screenW - space.gutter * 2));
  if (!data.item) {
    return <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} />;
  }
  const { item, photos, inLookbook, offers, merge, goes, outfitsWith, all: closetAll, doubt } = data;
  const spec = artSpec(item);
  const rows = editRows(item, doubt);
  const hero = photos.shown;
  const all = hero.length + photos.folded.length;
  const date = (ph: PiecePhoto) => longDate(ph.createdAt, sessionClock.offset);
  const photoLabel = (ph: PiecePhoto) => t('closet.piece.a11y.photo', { date: date(ph) });
  const actionsFor = (ph: PiecePhoto): PhotoAction[] => {
    const menu: Record<PhotoMenuItem, PhotoAction> = {
      cover: { name: 'cover', label: t('closet.piece.useCover'), systemImage: 'star', onAction: () => setAsCover(item.id, ph.obsId) },
      look: { name: 'look', label: t('closet.piece.openLook'), systemImage: 'bubble.left', onAction: () => openLook(ph.checkId) },
      notThis: { name: 'notThis', label: t('closet.piece.notThis'), systemImage: 'arrow.triangle.branch', onAction: () => notThisPiece(ph.obsId) },
      another: { name: 'another', label: t('closet.piece.another'), systemImage: 'arrow.right.square', onAction: () => anotherPiece(item.id, ph.obsId) },
      remove: {
        name: 'remove', label: t('closet.piece.removePhoto'), systemImage: 'trash', destructive: true,
        onAction: () => removePhoto(item.id, ph.obsId, { inLookbook: inLookbook.has(ph.checkId) }),
      },
    };
    return photoMenuItems(ph, offers.get(ph.obsId) ?? { notThis: false, another: null }).map((n) => menu[n]);
  };
  const onPage = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const n = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, W));
    if (n === page) return;
    setPaged({ n, of: pages });
    if (Platform.OS === 'ios') void Haptics.selectionAsync();
  };
  const cols = isAccessibilitySize ? 2 : 3;
  const tile = Math.floor((W - GRID_GAP * (cols - 1)) / cols);
  const pages = hero.length + 1;
  const page = paged.of === pages ? paged.n : 0;
  const pageLabel = (n: number) => (pages > 1 ? ` ${t('viewer.a11y.page', { n, total: pages })}` : '');
  const grid = (list: readonly PiecePhoto[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
      {list.map((ph) => (
        <PhotoMenu key={ph.obsId} photo={ph} size={tile} label={photoLabel(ph)} actions={actionsFor(ph)} onPress={() => openPhoto(ph.checkId)} />
      ))}
    </View>
  );

  // The first view stays the ScrollView (the tab bar shrinks on scroll).
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s, paddingBottom: space.xxxl, gap: space.xl }}
    >
      <Stack.Screen options={{ title: item.name }} />
      {W > 0 ? (
        <View style={{ gap: space.s }} onLayout={(e) => setColW(Math.round(e.nativeEvent.layout.width))}>
          <ScrollView
            key={pages}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={pages > 1} onMomentumScrollEnd={onPage}
            style={{ width: W, height: W, borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' }}
          >
            <View accessible accessibilityLabel={`${t('closet.piece.a11y.drawing', { art: spec.a11y })}${pageLabel(1)}`} style={{ width: W, height: W }}>
              <ClosetTile item={item} size={W} aspect={1} radius={radius.card} scale={0.7} decorative />
            </View>
            {hero.map((ph, i) => (
              <Pressable
                key={ph.obsId}
                onPress={() => openPhoto(ph.checkId)}
                accessibilityRole="button"
                accessibilityLabel={`${ph.cover ? t('closet.piece.a11y.coverPhoto', { photo: photoLabel(ph) }) : photoLabel(ph)}${pageLabel(i + 2)}`}
                accessibilityHint={t('closet.piece.a11y.photoHint')}
                style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
              >
                <SightingCrop source={ph.source} aspect={ph.aspect} box={ph.box} top={ph.top} mirrored={ph.mirrored} width={W} height={W} radius={radius.card} />
              </Pressable>
            ))}
          </ScrollView>
          {pages > 1 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {Array.from({ length: pages }, (_, i) => (
                <View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: i === page ? colors.ink : colors.inkFaint }} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: space.xs }}>
        <Pressable
          onPress={() => renamePiece(item)}
          disabled={Platform.OS !== 'ios'} // Rename is the iOS text prompt (the web preview can't rename)
          accessibilityRole="button"
          accessibilityLabel={item.name}
          accessibilityHint={t('closet.piece.a11y.renameHint')}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.s, alignSelf: 'flex-start', opacity: pressed ? opacity.pressed : 1 })}
        >
          <KText variant="title2" weight="700" style={{ flexShrink: 1 }}>
            {item.name}
          </KText>
          {Platform.OS === 'ios' ? <Icon name="edit" size="small" color="ink3" scalesWithText /> : null}
        </Pressable>
        <KText variant="subheadline" color="ink2">
          {slotWord(item)}
        </KText>
      </View>

      {/* What it is (§17, #315): the rest of the old detail line, each part a row he can fix. */}
      {rows.length > 0 ? (
        <Section label={t('closet.edit.title')} footer={t('closet.edit.foot')}>
          {rows.map((r) => (
            <LinkRow key={r.field} title={r.label} value={r.value} detail={r.detail} hint={t('closet.edit.a11y.rowHint')} onPress={() => router.push(editHref(item, r.field) as Href)} />
          ))}
        </Section>
      ) : null}

      <Section>
        <ValueRow
          label={t('item.worn')} value={t('item.wornCount', { n: item.wornCount })}
          spoken={`${t('item.worn')}, ${t('item.wornCount', { n: item.wornCount })}`}
        />
        {item.lastWornAt ? (
          <ValueRow
            label={t('item.lastWorn')} value={longDate(item.lastWornAt, sessionClock.offset)}
            spoken={`${t('item.lastWorn')}, ${longDate(item.lastWornAt, sessionClock.offset)}`}
          />
        ) : null}
        <ValueRow label={t('item.addedLabel')} value={addedLine(item)} spoken={`${t('item.addedLabel')}, ${addedLine(item)}`} />
        {outfitsWith > 0 ? (
          <ValueRow
            label={t('closet.seg.outfits')} value={outfitsWith === 1 ? t('closet.piece.outfitsOne') : t('closet.piece.outfits', { n: outfitsWith })}
            spoken={`${t('closet.seg.outfits')}, ${outfitsWith === 1 ? t('closet.piece.outfitsOne') : t('closet.piece.outfits', { n: outfitsWith })}`}
          />
        ) : null}
      </Section>

      {goes.length > 0 ? (
        <View style={{ gap: space.s }}>
          <TagLine left={t('closet.goesWith.title')} />
          {goes.map((g) => (
            <OutfitCard
              key={g.outfit.key} outfit={g.outfit} closet={closetAll} occasion="everyday"
              label={g.role === 'best' ? t('closet.goesWith.best') : g.role === 'dressier' ? t('closet.goesWith.dressier') : g.role === 'relaxed' ? t('closet.goesWith.relaxed') : undefined}
            />
          ))}
        </View>
      ) : null}

      {all > 0 ? (
        <View style={{ gap: space.m }}>
          <TagLine left={t('closet.piece.photos')} right={String(all)} />
          {hero.length > 0 ? grid(hero) : null}
          {photos.folded.length > 0 ? (
            <View style={{ gap: space.m }}>
              <TextLink
                compact
                title={showFolded ? t('closet.piece.fewer') : t('closet.piece.more', { n: photos.folded.length })}
                onPress={() => setShowFolded((v) => !v)}
              />
              {showFolded ? grid(photos.folded) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: space.xs }}>
          {t('closet.piece.noPhotos')}
        </KText>
      )}

      {merge ? (
        <Section>
          <LinkRow title={merge.label} hint={t('closet.merge.a11y.hint')} onPress={() => router.push(merge.href as Href)} />
        </Section>
      ) : null}

      <Pressable
        onPress={() => removePiece(item, { onRemoved: () => router.back() })}
        accessibilityRole="button"
        accessibilityLabel={t('closet.remove.action')}
        style={({ pressed }) => ({
          minHeight: 50, borderRadius: radius.cardSmall, borderCurve: 'continuous', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: space.rowX, paddingVertical: space.rowY, opacity: pressed ? opacity.pressed : 1,
        })}
      >
        <KText variant="callout" weight="500" color={DANGER[scheme]}>
          {t('closet.remove.action')}
        </KText>
      </Pressable>
    </ScrollView>
  );
}
