// C2 · A piece's page (#276; 09-ui-review §3 option A; 02 C2). A tap on a Closet tile opens it (long-press stays the
// shortcut). The drawing comes first (#141, #276 call 2: tiles stay pure drawings), then his real photos of the piece
// with the piece outlined, never the cut-out alone (#276 call 1), and a photo never changes the drawing (call 3).
//   1. The hero: a swipe gallery, the drawing, then his cover photo and his other photos; page dots only when there
//      are photos, a light tick per page. A tap on a photo opens it full screen on that check.
//   2. The name (tap to rename), "Layer · Grey · Regular fit", and what the data says: worn, last worn, added.
//   3. "Your photos · N": square crops, best first, the cover marked. Long-press (or VoiceOver actions): Use as cover ·
//      Open the look · Not this piece (a correction) · Remove photo (with Undo). Mostly hidden ones fold into
//      "N more, partly hidden"; the same photo re-checked shows once.
//   4. Remove from Closet (with Undo), back to the grid.
// Every crop starts below his head and a mirror selfie reads true-view (cropSafety). Nothing here is sent anywhere.
// Not built yet (no dead buttons): Add a photo of it, Goes with, Style this, Merge.
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon, KText, TagLine, TextLink, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { addedDetail } from '@/features/added/addedDetail';
import { Section, ValueRow } from '@/features/settings/SettingsList';
import { t } from '@/i18n/en';
import { longDate } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { artSpec } from './artSpec';
import { ClosetTile } from './ClosetTile';
import { colorPhrase } from './itemName';
import { openLook, openPhoto, notThisPiece, removePhoto, removePiece, renamePiece, setAsCover } from './pieceActions';
import { piecePhotos, type PiecePhoto } from './piecePhotos';
import { livePhotoDeps, loadPhotoChecks } from './photoChecks';
import type { PhotoAction } from './PiecePhotoTile';
import { PhotoMenu } from './PhotoMenu';
import { isOwned } from './profile';
import { SightingCrop } from './SightingCrop';
import { canSplitOff } from './service';

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

function addedLine(item: ClosetItemRow): string {
  const date = longDate(item.addedAt, sessionClock.offset);
  if (item.starterId) return t('item.source.starter');
  return item.source === 'fitCheck' ? t('item.source.fitCheck', { date }) : t('item.source.added', { date });
}

export function PiecePage({ id }: { id: string }) {
  const { colors, scheme, isAccessibilitySize } = useTheme();
  const { width: screenW } = useWindowDimensions();
  // The hero page, with the page count it was read at: when a photo is removed or comes back, the gallery remounts at
  // the drawing, so a page from the old count no longer applies.
  const [paged, setPaged] = useState({ n: 0, of: 0 });
  // The column's real width (the web preview boxes the app narrower than the window).
  const [colW, setColW] = useState(0);
  const [showFolded, setShowFolded] = useState(false);
  const data = useLive(['closet', 'closetObs', 'fitChecks'], async () => {
    const item = await store.closet.get(id);
    if (!item || !isOwned(item)) return { item: null };
    const obs = await store.closetObs.all();
    const checks = await loadPhotoChecks(store);
    const photos = piecePhotos(item, obs, checks, livePhotoDeps);
    const rows = new Map((await store.fitChecks.all()).map((r) => [r.id, r]));
    const inLookbook = new Set([...rows.values()].filter((r) => !r.details.removedFromLookbook).map((r) => r.id));
    const splittable = new Set(obs.filter((o) => o.itemId === id && canSplitOff(o)).map((o) => o.id));
    return { item, photos, inLookbook, splittable };
  }, [id]);
  if (!data) return null;
  const W = colW || Math.max(0, Math.round(screenW - space.gutter * 2));
  if (!data.item) {
    return <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} />;
  }
  const { item, photos, inLookbook, splittable } = data;
  const spec = artSpec(item);
  const hero = photos.shown;
  const all = hero.length + photos.folded.length;
  const date = (ph: PiecePhoto) => longDate(ph.createdAt, sessionClock.offset);
  const photoLabel = (ph: PiecePhoto) => t('closet.piece.a11y.photo', { date: date(ph) });
  const actionsFor = (ph: PiecePhoto): PhotoAction[] => [
    ...(ph.cover ? [] : [{ name: 'cover', label: t('closet.piece.useCover'), systemImage: 'star' as const, onAction: () => setAsCover(item.id, ph.obsId) }]),
    { name: 'look', label: t('closet.piece.openLook'), systemImage: 'bubble.left' as const, onAction: () => openLook(ph.checkId) },
    ...(splittable.has(ph.obsId)
      ? [{ name: 'notThis', label: t('closet.piece.notThis'), systemImage: 'arrow.triangle.branch' as const, onAction: () => notThisPiece(ph.obsId) }]
      : []),
    {
      name: 'remove', label: t('closet.piece.removePhoto'), systemImage: 'trash' as const, destructive: true,
      onAction: () => removePhoto(item.id, ph.obsId, { inLookbook: inLookbook.has(ph.checkId) }),
    },
  ];
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
          {pieceDetail(item)}
        </KText>
      </View>

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
      </Section>

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
