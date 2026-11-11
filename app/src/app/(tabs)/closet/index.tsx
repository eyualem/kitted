// C1 · Closet (02 D15). Until P5 builds the full screen (Rotation, Starter essentials, filters),
// it shows what the closet really holds: the C1e empty state, or a grid of his pieces drawn with their
// details (#91), with the "Is this your …?" questions the stylist still has on top, one card at a time (specs/
// closet-beta.md CB2: "2 of 5", Skip or a sideways swipe to move on, the fit question last). A tap on a piece
// opens its page (#276); a long-press is the shortcut menu. While clothes scans wait to be read, one row on top
// ("Waiting to be read · 2 photos", #280) opens the scan inbox.
// Pieces | Outfits (09-ui-review §13, #307; #84, #87): opens on Outfits once he can make 3+, else Pieces, then
// remembers his tap. Off for the beta behind the Outfits switch (OUTFITS_BUILT, specs/closet-beta.md CB1): Closet is the
// pieces, with no switcher and nothing from Outfits, and his saved tap is never followed or written; demo screens turn
// it on.
// Pieces runs head to toe (founder, Oct 28; #384): Jackets and layers · Tops · Bottoms · Shoes, each under a quiet title
// with its count, on the same scroll; a thin closet (under 4 pieces, or one section) is one plain grid.
// His first visit after his first adding check (SY2.8): that check's pieces come first, under "From your first check",
// each marked New; the visit is kept by the tab bar (features/closet/useArrivals.ts).
// No dev placeholder text in a tab (DECISIONS-LOG #56). The ScrollView stays the first child (tab bar
// minimize behavior).
import { useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, findNodeHandle, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { EmptyState, KButton, KCard, KCardSection, KText, TagLine, radius, space, useTheme } from '@/design-system';
import type { ClosetItemRow } from '@/data/types';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { PieceMenu } from '@/features/closet/PieceMenu';
import { piecePreviewSource } from '@/features/closet/piecePreview';
import { livePhotoDeps, loadPhotoChecks } from '@/features/closet/photoChecks';
import { DuplicateQuestion } from '@/features/closet/DuplicateQuestion';
import { FitQuestion } from '@/features/closet/FitQuestion';
import { doubtQuestion, FIT_SKIP_KEY, fitCard, parseSkips } from '@/features/closet/fitDoubt';
import { askQuestionText } from '@/features/closet/askText';
import { closetGridItems, closetSections, pieceSectionLabel, type PieceSection } from '@/features/closet/merge';
import { firstVisitPieces } from '@/features/closet/arrivals';
import { useFirstVisitCheck } from '@/features/closet/useArrivals';
import type { PiecePreview } from '@/features/closet/piecePreview';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { ConfirmDeck, ConfirmFoldRow, type ConfirmPreview } from '@/features/closet/ConfirmDeck';
import { CONFIRM_OPEN_KEY, confirmOpen, confirmOpenValue, toConfirm } from '@/features/closet/toConfirm';
import { answerWithUndo, type AnswerToastDeps } from '@/features/closet/answerToast';
import { showToast } from '@/features/toast/toast';
import { INBOX_KEY, parseInbox, waitingRow } from '@/features/scan/inbox';
import { LinkRow, Section } from '@/features/settings/SettingsList';
import { fitCheck } from '@/features/fitcheck/session';
import { goToStylist } from '@/router/stylistAction';
import { OutfitsView } from '@/features/closet/OutfitsView';
import { closetView, outfitCount, SEGMENT_KEY } from '@/features/closet/outfits';
import { useOutfitsOn } from '@/features/closet/outfitsSwitch';
import { Segmented } from '@/features/onboarding/Segmented';
import { t } from '@/i18n/en';

/** A "To confirm" answer leaves the card: a toast says it, with Undo (09 §20.7 R10, #323). */
const answerDeps: AnswerToastDeps = {
  answer: (c, o, a) => fitCheck.answerDuplicate(c, o, a),
  unanswer: (c, o) => fitCheck.unanswerDuplicate(c, o),
  toast: (text, undo) => void showToast(text, undo),
};


const GAP = 10;
/** The section title's look (#384): the card-header tag in spaced capitals with its count (as Outfits' "Try next"), or
 *  'title', a semibold headline with the count beside it in ink2. */
const PIECE_HEADER: 'tag' | 'title' = 'tag';

export default function ClosetScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const on = useOutfitsOn();
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
    // The outfit count only matters while Outfits are on (it picks the opening segment).
    const count = on ? outfitCount(all, fitChecks, styles) : 0;
    return { items, byId, previews, asks: await fitCheck.closet.openAsks(), all, fitChecks, styles, count, fit };
  }, [fitSkips, on]);
  const remembered = useLive(['kv'], () => store.getKv(SEGMENT_KEY), [], SEGMENT_KEY);
  // To confirm folded or open, as he left it (CB2 "Folded"); nothing saved yet means folded.
  const confirmSaved = useLive(['kv'], () => store.getKv(CONFIRM_OPEN_KEY), [], CONFIRM_OPEN_KEY);
  // Clothes scans waiting to be read (#280): one row on top while any wait.
  const inbox = useLive(['kv'], async () => waitingRow(parseInbox(await store.getKv(INBOX_KEY))), [], INBOX_KEY);
  const [width, setWidth] = useState(0);
  // After the last question leaves, VoiceOver goes to the first section title, where the card was (CB2.6).
  const firstTitle = useRef<View | null>(null);
  const focusFirstSection = () => {
    const tag = firstTitle.current ? findNodeHandle(firstTitle.current) : null;
    if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
  };
  const firstVisit = useFirstVisitCheck();
  if (!data) return null;
  const { items, byId, previews, asks, all, fitChecks, styles, count, fit } = data;
  // His first visit (SY2.8): that check's pieces first, out of the sections below.
  const fresh = firstVisitPieces(firstVisit ? fitChecks.find((c) => c.id === firstVisit) : undefined, items);
  const freshIds = new Set(fresh.map((c) => c.id));
  const rest = fresh.length > 0 ? items.filter((c) => !freshIds.has(c.id)) : items;
  const view = closetView(on, count, remembered ?? null);
  const segment = view.segment;
  const pick = (v: 'pieces' | 'outfits') => void store.setKv(SEGMENT_KEY, v);
  const open = asks.flatMap(({ checkId, ask }) => {
    const photo = byId.get(ask.itemId), candidate = byId.get(ask.candidateId);
    if (!photo || !candidate) return [];
    return [{ checkId, ask, photo, candidate, runnerUp: ask.runnerUpId ? byId.get(ask.runnerUpId) ?? null : null }];
  });
  // One card at a time (CB2): every open question, newest first, then the fit question; no cap.
  const deck = toConfirm(open, fit);
  const unfolded = confirmOpen(confirmSaved);
  // The folded row shows the first waiting question: its piece's drawing and its words, as the card would ask them.
  const first = deck[0];
  const preview: ConfirmPreview | null = !first ? null : first.kind === 'fit'
    ? { item: first.fit.item, question: doubtQuestion(first.fit.doubt, first.fit.item.name) }
    : { item: first.q.candidate, question: askQuestionText(first.q.candidate.name.charAt(0).toLowerCase() + first.q.candidate.name.slice(1), first.q.candidate.slot) };
  const setConfirmOpen = (v: boolean) => void store.setKv(CONFIRM_OPEN_KEY, confirmOpenValue(v));
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
          {/* The basics he owns, without a photo (02 C1e; 09-ui-review §20.8 G24): Starter essentials. */}
          <KButton title={t('closet.empty.basics')} kind="secondary" size="regular" style={{ alignSelf: 'center' }} onPress={() => router.push('/closet/starter' as Href)} />
        </EmptyState>
      ) : (
        <>
          {view.switcher ? (
            <Segmented<'pieces' | 'outfits'>
              label={t('closet.title')}
              shrinkToFit={false}
              value={segment}
              onChange={pick}
              options={[{ value: 'pieces', label: t('closet.seg.pieces') }, { value: 'outfits', label: t('closet.seg.outfits') }]}
            />
          ) : null}
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
          {/* "To confirm · 2 of 5" (#117, CB2): one question per card, the fit question last; no badge, no push. It
              stays mounted with no cards (it draws nothing), so Undo after the last answer brings the card back. */}
          {!unfolded ? <ConfirmFoldRow tag={t('closet.confirm.tag')} total={deck.length} preview={preview} onOpen={() => setConfirmOpen(true)} /> : null}
          {/* Folded, the deck stays mounted but out of sight, so it opens again on the card he was on. */}
          <ConfirmDeck
            folded={!unfolded}
            cards={deck}
            tag={t('closet.confirm.tag')}
            onFold={() => setConfirmOpen(false)}
            onEmptied={focusFirstSection}
            renderCard={(card, slot) => {
              if (card.kind === 'fit') return <FitQuestion item={card.fit.item} doubt={card.fit.doubt} deck={slot} />;
              const { checkId, ask, photo, candidate, runnerUp } = card.q;
              return <DuplicateQuestion ask={ask} photo={photo} candidate={candidate} runnerUp={runnerUp} deck={slot} onAnswer={(a) => void answerWithUndo(answerDeps, checkId, ask, a, candidate, runnerUp)} />;
            }}
          />
          <View style={{ gap: space.xxl }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {tile > 0 && fresh.length > 0 ? <FirstCheckSection items={fresh} tile={tile} previews={previews} firstTitle={firstTitle} /> : null}
            {tile > 0 && rest.length > 0 ? <PieceSections items={rest} tile={tile} previews={previews} firstTitle={fresh.length > 0 ? undefined : firstTitle} /> : null}
          </View>
          </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

/** The Pieces grid, head to toe (#384): a title per section once the closet has more than one, else one plain grid. */
function PieceSections({ items, tile, previews, firstTitle }: {
  items: readonly ClosetItemRow[]; tile: number; previews: Map<string, PiecePreview>; firstTitle?: RefObject<View | null>;
}) {
  const { titled, sections } = closetSections(items);
  const grid = (list: readonly ClosetItemRow[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP }}>
      {list.map((it) => (
        <PieceMenu key={it.id} item={it} size={tile} aspect={0.92} radius={radius.tile} preview={previews.get(it.id) ?? { kind: 'drawn' }} />
      ))}
    </View>
  );
  if (!titled) return grid(sections.flatMap((s) => s.items));
  return sections.map((s, i) => (
    <View key={s.slot} style={{ gap: PIECE_HEADER === 'tag' ? space.s : space.m }}>
      <PieceSectionTitle section={s} titleRef={i === 0 ? firstTitle : undefined} />
      {grid(s.items)}
    </View>
  ));
}

/** "From your first check" (SY2.8): the section title's look, each piece marked New (tasks/T36 phone 2). */
function FirstCheckSection({ items, tile, previews, firstTitle }: {
  items: ClosetItemRow[]; tile: number; previews: Map<string, PiecePreview>; firstTitle: RefObject<View | null>;
}) {
  const section = { title: t('closet.firstCheck'), items };
  return (
    <View style={{ gap: PIECE_HEADER === 'tag' ? space.s : space.m }}>
      <PieceSectionTitle section={section} titleRef={firstTitle} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP }}>
        {items.map((it) => (
          <PieceMenu key={it.id} item={it} size={tile} aspect={0.92} radius={radius.tile} preview={previews.get(it.id) ?? { kind: 'drawn' }} isNew />
        ))}
      </View>
    </View>
  );
}

function PieceSectionTitle({ section, titleRef }: { section: Pick<PieceSection, 'title' | 'items'>; titleRef?: RefObject<View | null> }) {
  const n = String(section.items.length);
  return (
    <View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel={pieceSectionLabel(section)}>
      {PIECE_HEADER === 'tag' ? (
        <TagLine left={section.title} right={n} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: space.s }}>
          <KText variant="headline" color="ink">{section.title}</KText>
          <KText variant="subheadline" color="ink2" tabular>{n}</KText>
        </View>
      )}
    </View>
  );
}
