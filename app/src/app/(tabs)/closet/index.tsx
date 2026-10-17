// C1 · Closet (02 D15). Until P5 builds the full screen (Rotation, Starter essentials, filters),
// it shows what the closet really holds: the C1e empty state, or a grid of his pieces drawn with their
// details (#91), with the "Same as your …?" questions the stylist still has on top, 3 at a time (#111). A tap on a piece
// opens its page (#276); a long-press is the shortcut menu. While clothes scans wait to be read, one row on top
// ("Waiting to be read · 2 photos", #280) opens the scan inbox.
// Pieces | Outfits (09-ui-review §13, #307; #84, #87): opens on Outfits once he can make 3+, else Pieces, then
// remembers his tap.
// No dev placeholder text in a tab (DECISIONS-LOG #56). The ScrollView stays the first child (tab bar
// minimize behavior).
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { EmptyState, KButton, KCard, KCardSection, RowDivider, TagLine, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { PieceMenu } from '@/features/closet/PieceMenu';
import { piecePreviewSource } from '@/features/closet/piecePreview';
import { livePhotoDeps, loadPhotoChecks } from '@/features/closet/photoChecks';
import { DuplicateQuestion } from '@/features/closet/DuplicateQuestion';
import { FitQuestion } from '@/features/closet/FitQuestion';
import { FIT_SKIP_KEY, fitCard, parseSkips } from '@/features/closet/fitDoubt';
import { closetGridItems } from '@/features/closet/merge';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { toConfirm } from '@/features/closet/toConfirm';
import { INBOX_KEY, parseInbox, waitingRow } from '@/features/scan/inbox';
import { LinkRow, Section } from '@/features/settings/SettingsList';
import { fitCheck } from '@/features/fitcheck/session';
import { goToStylist } from '@/router/stylistAction';
import { OutfitsView } from '@/features/closet/OutfitsView';
import { openingSegment, outfitCount, SEGMENT_KEY } from '@/features/closet/outfits';
import { Segmented } from '@/features/onboarding/Segmented';
import { t } from '@/i18n/en';


const GAP = 10;

export default function ClosetScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  // His Skips on the fit card (§18), watched on their own key so other kv writes don't reload the closet.
  const fitSkips = useLive(['kv'], () => store.getKv(FIT_SKIP_KEY), [], FIT_SKIP_KEY);
  const data = useLive(['closet', 'fitChecks', 'closetObs'], async () => {
    const all = await store.closet.all();
    const byId = new Map(all.map((c) => [c.id, c]));
    // Newest first (a row's place in the store moves when it's updated). A piece still waiting on his answer shows in
    // its question card only, not as a tile of its own (#116).
    const items = closetGridItems(all);
    // Long-press preview (founder, Oct 14; #276): his real photo of each piece, outlined, else its drawing.
    const obs = await store.closetObs.all();
    const checks = await loadPhotoChecks(store);
    const previews = new Map(items.map((it) => [it.id, piecePreviewSource(it, obs, checks, livePhotoDeps)]));
    const fitChecks = await store.fitChecks.all();
    const styles = (await store.profile.get('me'))?.styles ?? null;
    // One "How do your … fit?" at most (§18, #316): the piece whose own photos disagree most, unless he skipped it.
    const owned = all.filter(isOwned);
    const fit = fitCard(owned.filter((c) => !isAwaitingAnswer(c, owned)), obs, parseSkips(fitSkips));
    return { items, byId, previews, asks: await fitCheck.closet.openAsks(), all, fitChecks, styles, count: outfitCount(all, fitChecks, styles), fit };
  }, [fitSkips]);
  const remembered = useLive(['kv'], () => store.getKv(SEGMENT_KEY), [], SEGMENT_KEY);
  // Clothes scans waiting to be read (#280): one row on top while any wait.
  const inbox = useLive(['kv'], async () => waitingRow(parseInbox(await store.getKv(INBOX_KEY))), [], INBOX_KEY);
  const [width, setWidth] = useState(0);
  if (!data) return null;
  const { items, byId, previews, asks, all, fitChecks, styles, count, fit } = data;
  const segment = openingSegment(count, remembered ?? null);
  const pick = (v: 'pieces' | 'outfits') => void store.setKv(SEGMENT_KEY, v);
  const open = asks.flatMap(({ checkId, ask }) => {
    const photo = byId.get(ask.itemId), candidate = byId.get(ask.candidateId);
    if (!photo || !candidate) return [];
    return [{ checkId, ask, photo, candidate, runnerUp: ask.runnerUpId ? byId.get(ask.runnerUpId) ?? null : null }];
  });
  // At most 3 questions at a time (#111); answering one brings the next in.
  const queue = toConfirm(open);
  const cols = isAccessibilitySize ? 2 : 3;
  const tile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.stack }}>
      {inbox ? (
        <Section>
          <LinkRow title={inbox.title} hint={t('scan.inbox.a11y.rowHint')} onPress={() => router.push(inbox.href as Href)} />
        </Section>
      ) : null}
      {items.length === 0 ? (
        <EmptyState icon="closet" title={t('closet.empty.title')} body={t('closet.empty.body')}>
          <KButton title={t('closet.empty.check')} icon="camera" size="regular" style={{ alignSelf: 'center' }} onPress={() => goToStylist({ kind: 'checkMyFit' })} />
        </EmptyState>
      ) : (
        <>
          <Segmented<'pieces' | 'outfits'>
            label={t('closet.title')}
            shrinkToFit={false}
            value={segment}
            onChange={pick}
            options={[{ value: 'pieces', label: t('closet.seg.pieces') }, { value: 'outfits', label: t('closet.seg.outfits') }]}
          />
          {/* The same one fit card on Outfits (§19, #322): Closet opens there once he has 3+ outfits. */}
          {segment === 'outfits' && fit ? (
            <KCard>
              <KCardSection gap={12}>
                <TagLine left={t('closet.confirm.tag')} right="1" />
                <FitQuestion item={fit.item} doubt={fit.doubt} />
              </KCardSection>
            </KCard>
          ) : null}
          {segment === 'outfits' ? <OutfitsView closet={all} checks={fitChecks} count={count} styles={styles} /> : null}
          {segment === 'pieces' ? (
          <>
          {/* "To confirm · 2" (#117): the open questions in one quiet card on top, 3 at a time (#111), then at most one
              "How do your … fit?" (§18); no badge, no push. */}
          {queue.total > 0 || fit ? (
            <KCard>
              <KCardSection gap={12}>
                <TagLine left={t('closet.confirm.tag')} right={String(queue.total + (fit ? 1 : 0))} />
                {queue.shown.map(({ checkId, ask, photo, candidate, runnerUp }, i) => (
                  <View key={ask.obsId} style={{ gap: 12 }}>
                    {i > 0 ? <RowDivider /> : null}
                    <DuplicateQuestion ask={ask} photo={photo} candidate={candidate} runnerUp={runnerUp} onAnswer={(a) => void fitCheck.answerDuplicate(checkId, ask.obsId, a)} />
                  </View>
                ))}
                {fit ? (
                  <View style={{ gap: 12 }}>
                    {queue.shown.length > 0 ? <RowDivider /> : null}
                    <FitQuestion item={fit.item} doubt={fit.doubt} />
                  </View>
                ) : null}
              </KCardSection>
            </KCard>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {tile > 0 ? items.map((it) => (
              <PieceMenu key={it.id} item={it} size={tile} aspect={0.92} radius={radius.tile} preview={previews.get(it.id) ?? { kind: 'drawn' }} />
            )) : null}
          </View>
          </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
