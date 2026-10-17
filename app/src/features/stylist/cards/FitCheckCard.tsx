// The fit-check card in the thread (02 D6 → D7 / D11 / S19 / S22 / S23). One slot that shows the
// live reading, then the result, from the same fit_checks row. One VoiceOver element with
// custom actions; the buttons inside are also there for touch.
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActionSheetIOS, Platform, Pressable, View } from 'react-native';
import {
  FinishTile, FixRow, Icon, IconButton, KButton, KCard, KCardSection, KText, MonoLabel, PartialLabel, RowDivider, ScoreBlock, Seam,
  MorphPicker, RevealStepView, TagLine, TextLink, TextLinkRow, TipLine, displayScore, opacity, size, space, spokenScore, useTheme,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { store } from '@/data/db';
import { OCCASIONS, type ClosetItemRow, type FitCheckRow, type StyleKey } from '@/data/types';
import { useLive } from '@/data/useLive';
import { fitCheck, useFitCheckSession } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { finishInfo, type FinishInfo } from '@/features/fitcheck/finish';
import { isRecheckOpen, recheckDeadline } from '@/services/quota';
import { retryCheck } from '@/features/camera/startCheck';
import { sessionClock } from '@/state/session';
import { setStylistAction } from '@/router/stylistAction';
import { pickOccasion } from '../occasionPicker';
import { occasionLabel } from '../thread';
import { ReadingCard, useInsetShown } from './ReadingCard';
import { adviceA11y, GoingForAdviceBlock, GoingForInset, GoingForLine } from './GoingFor';
import { arriveAnnouncement, lineA11y, lookTiles, picksOf } from '@/features/fitcheck/goingFor';
import type { SessionState } from '@/features/fitcheck/machine';
import { useWeatherTip } from '@/features/morning/weatherTip';
import { styleLabel } from '@/features/morning/copy';
import { confirmLens } from '@/features/fitcheck/lensUi';
import { tipLeadText } from '@/features/fitcheck/scoring';
import { justAnswered, TapCard, tapChoice } from '@/features/tap/TapCard';
import { ClosetSummaryRow } from '@/features/closet/ClosetSummaryRow';
import { DoubtLine } from '@/features/closet/DoubtLine';
import { closetSummaryText, openAsks } from '@/features/closet/summaryText';
import { DuplicateQuestion } from '@/features/closet/DuplicateQuestion';
import { askQuestionText, askReasonText, isPluralPiece } from '@/features/closet/askText';
import { PieceArt } from '@/features/closet/GarmentArt';
import { noteLive } from '@/features/fitcheck/reveal';
import { useCheckReveal } from './useReveal';
import { useLaterShows } from '@/features/finish/hooks';
import { finish as finishSequence } from '@/features/finish/session';
import { SHARE_CARD_BUILT } from '@/config/features';

// The share card's switch lives in config/features.ts (the root layout guards its route by it, #323).
export { SHARE_CARD_BUILT };
/** "Save this look" at 9+ has nowhere to save to yet (Lookbook saves come later): hidden until it does something. */
export const SAVE_LOOK_BUILT = false;

function useCheck(checkId: string) {
  return useLive(['fitChecks'], () => store.fitChecks.get(checkId), [checkId], checkId);
}

function useCloset() {
  return useLive(['closet'], () => store.closet.all(), []);
}

/** His picks from setup (the Going-for tiles). */
function usePicks(): StyleKey[] {
  const p = useLive(['profile'], () => store.profile.get('me'), []);
  return picksOf(p?.styles);
}

/** The reading card with the Going-for question inside it (#215). Full checks only: a re-check keeps its first look. */
function ReadingWithQuestion({ s }: { s: Extract<SessionState, { kind: 'reading' }> }) {
  const picks = usePicks();
  const shown = useInsetShown(s, s.mode === 'check');
  const said = useRef<number | null>(null);
  useEffect(() => {
    if (!shown || said.current === s.attempt) return;
    said.current = s.attempt;
    AccessibilityInfo.announceForAccessibility?.(arriveAnnouncement(s.look, s.lookSource));
  }, [shown, s.attempt, s.look, s.lookSource]);
  return (
    <ReadingCard
      s={s}
      inset={shown ? (
        <GoingForInset
          where="wait" look={s.look} touched={s.lookTouched} source={s.lookSource} bothFromCard={s.bothFromCard} other={s.lookOther}
          occasion={s.occasion} picks={picks} onLook={(st, o) => fitCheck.selectLook(st, o)} onOccasion={(o) => fitCheck.selectOccasion(o)}
        />
      ) : undefined}
    />
  );
}

/** VoiceOver's way to change the look (the result card is one element): the looks as an action sheet. */
function pickLook(picks: readonly StyleKey[], current: StyleKey | null, onPick: (s: StyleKey | null) => void) {
  if (Platform.OS !== 'ios') return;
  const { tiles, more } = lookTiles(picks);
  const looks: (StyleKey | null)[] = [...tiles, ...more, null];
  const labels = looks.map((l) => (l ? styleLabel(l) : t('gf.notSure')));
  ActionSheetIOS.showActionSheetWithOptions({ options: [...labels, t('common.cancel')], cancelButtonIndex: labels.length, title: t('gf.q') }, (i) => {
    if (i < looks.length && looks[i] !== current) onPick(looks[i]!);
  });
}

/** `readOnly`: an earlier day's card in Past chats (#276). It shows what happened and keeps Why and the photo, but can't
 *  change the occasion or Going for, answer a closet question, correct a detail, finish a partial check or re-check. */
export function FitCheckCard({ checkId, readOnly = false }: { checkId: string; readOnly?: boolean }) {
  const row = useCheck(checkId);
  const wxTip = useWeatherTip(row);
  const asked = useTapGarment(row);
  const session = useFitCheckSession();
  // Seen still reading (or asking the quick tap): its result will be new to him, so the score reveal may play once.
  const status = row?.status;
  useEffect(() => {
    if (status === 'scoring' || status === 'asking') noteLive(checkId);
  }, [status, checkId]);
  if (!row) return null;
  if (row.status === 'scoring') {
    if (session.kind === 'reading' && session.checkId === checkId) {
      return <ReadingWithQuestion s={session} />;
    }
    return null; // a read that never finished (app closed mid-read): nothing to show yet
  }
  // Read, waiting for the one quick tap (02 "S5q"). From the row, so it survives the app closing.
  if (row.status === 'asking' && row.details.tap) return <TapCard row={row} />;
  if (row.status === 'failed') return <FailureCard row={row} />;
  if (row.status === 'notClothed' || row.status === 'unreadable') {
    // Not a dead end: the camera is one tap away (for VoiceOver too, as the card's action).
    const retake = () => router.push({ pathname: '/camera', params: { occasion: row.occasion } });
    return <StatusCard text={t(row.status === 'notClothed' ? 'notClothed.text' : 'unreadable.text')} action={{ title: t('recheck.samePhoto.button'), onPress: retake }} />;
  }
  return <ScoredCard row={row} wxTip={wxTip} asked={asked} readOnly={readOnly} />;
}

/** Where the one quick tap's garment is in the CURRENT reading (a correction makes a new one), and its type now. */
interface AskedGarment {
  index: number;
  value: string | null;
}

function useTapGarment(row: FitCheckRow | null | undefined): AskedGarment | null {
  const tap = row?.details.tap;
  return useLive(
    ['readings'],
    async () => {
      if (!tap || !row?.readingId) return null;
      const r = (await store.readings.get(row.readingId))?.reading;
      if (!r) return null;
      const at = r.garments.map((g, i) => [g, i] as const).filter(([g]) => g.category === tap.slot)[tap.ordinal];
      return at ? { index: at[1], value: typeof at[0].subcategory === 'string' ? at[0].subcategory : null } : null;
    },
    [row?.readingId, tap?.slot, tap?.ordinal],
  ) ?? null;
}

export function StatusCard({ text, action }: { text: string; action?: { title: string; onPress: () => void } }) {
  return (
    <KCard
      accessibilityLabel={text}
      accessibilityActions={action ? [{ name: 'act', label: action.title }] : undefined}
      onAccessibilityAction={action ? () => action.onPress() : undefined}
    >
      <KCardSection gap={action ? 6 : undefined}>
        <KText role="cardSummary">{text}</KText>
        {action ? <KButton title={action.title} icon="camera" size="regular" kind="secondary" onPress={action.onPress} /> : null}
      </KCardSection>
    </KCard>
  );
}

function FailureCard({ row }: { row: FitCheckRow }) {
  const code = row.details.failCode ?? 'ai';
  const key = code === 'timeout' ? 'fail.timeout' : code === 'offline' ? 'fail.offline' : code === 'paused' ? 'fail.paused' : code === 'limit' ? 'fail.limit' : code === 'unknownPhoto' ? 'demo.unknownPhoto'
    : code === 'replaced' ? 'fail.replaced' : 'fail.ai';
  return (
    <KCard accessibilityLabel={t(key)}>
      <KCardSection gap={6}>
        <KText role="cardSummary">{t(key)}</KText>
        {code !== 'unknownPhoto' && code !== 'replaced' ? <KButton title={t('common.tryAgain')} size="regular" kind="secondary" onPress={() => void retryCheck(row.id)} /> : null}
      </KCardSection>
    </KCard>
  );
}

function ScoredCard({ row, wxTip, asked, readOnly }: { row: FitCheckRow; wxTip: string | null; asked: AskedGarment | null; readOnly: boolean }) {
  const closet = useCloset() ?? [];
  const picks = usePicks();
  const later = useLaterShows(row, readOnly);
  // "Going for" (#215): the folded line at the top; Change grows it back into the question, in place.
  const gf = row.details.goingFor;
  const advice = row.details.goingForAdvice ?? null;
  const [changing, setChanging] = useState(false);
  const [flash, setFlash] = useState(0);
  // The Re-check button goes when its window closes (30 min, or 4 am after the first check), not at the next re-render:
  // a button left on screen past it only led to the "Check used today" toast (Oct 14).
  const [, setWindowTick] = useState(0);
  const answeredAt = row.details.tap?.answeredAt;
  useEffect(() => {
    if (row.recheckUsed || row.status !== 'scored' || row.parentId) return;
    const left = recheckDeadline(row, sessionClock) - sessionClock.nowMs();
    if (left <= 0) return;
    const h = setTimeout(() => setWindowTick((n) => n + 1), Math.min(left + 50, 2_000_000_000));
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id, row.recheckUsed, row.status, row.parentId, row.createdAt, row.isFirstCheck, answeredAt]);
  const changeLook = async (style: StyleKey | null, other?: string | null) => {
    if (!gf) return;
    const same = style === gf.style && (other ?? null) === (gf.other ?? null);
    setTimeout(() => setChanging(false), 400); // the check shows, then it folds
    if (same && gf.confirmed) return;
    await fitCheck.changeGoingFor(row.id, style, other);
    if (!same) setFlash((n) => n + 1);
  };
  const tap = row.details.tap;
  // After the one quick tap: S8 prefilled with the other answer (the pair's other half; for the shoe question, the
  // next kind in the question's order, and the sheet lists every shoe type).
  const otherAnswer = tap?.answer ? tap.order.find((v) => v !== tap.answer) : undefined;
  const changeAnswer = !readOnly && tap?.answer && asked && asked.value === tap.answer && otherAnswer
    ? () => router.push(`/sheets/correct/${row.id}?reason=item&garment=${asked.index}&field=subcategory&value=${otherAnswer}`)
    : null;
  // "Scored as jeans. Not right? Tap." only after a Skip, while the piece still has the value it was scored as.
  const skippedAs = tap?.skipped && changeAnswer ? tapChoice(tap, tap.answer!) : null;
  const score = row.score ?? 0;
  const partial = row.isPartial;
  const finished = !partial && (row.snapState === 'snapped' || row.snapState === 'closetPick');
  const partialText = finished
    ? t(row.snapState === 'closetPick' ? 'partial.fullCloset' : 'partial.full')
    : row.notRated.includes('bottom half') ? t('partial.label.topOnly') : t('partial.label.shoes');
  // Two rule targets can land on the same move ("Swap to your Navy crewneck" fixes both "top too
  // big" and "top vs your style"); rubric.py lists it twice, the card shows it once (#42).
  const fixes = row.fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i);
  const top = fixes[0];
  const dialed = fixes.length === 0;
  const nextLevel = row.details.nextLevel?.[0];
  // The fix area skips its "No quick fixes" row whenever the summary already says it (#183); with no tip and no
  // Going-for line either, the whole section and its seam go, so the card never says it twice (v8 makes that common).
  const quietNoFix = score < 9 && !!row.explanation?.includes(t('sum.noQuickFix'));
  const recheckOpen = !readOnly && isRecheckOpen(row, sessionClock.nowMs(), sessionClock);
  // "Added 3 to Closet · 1 question" / "Checking the details…" (#91): from the closet summary.
  const closetLine = closetSummaryText(row.details.closetSummary, sessionClock.nowMs());
  const addedItems = (closetLine?.itemIds ?? []).map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
  const showCloset = !!closetLine && (closetLine.pending || addedItems.length > 0) && !partial;
  // The closet question rides on the card right after the score (#117): the check's first question (answered: its
  // one line and Change); any others wait in Closet's "To confirm".
  const cs = row.details.closetSummary;
  const firstAsk = showCloset && !readOnly && !closetLine?.pending ? (cs?.asks ?? []).find((a) => !(cs?.undone ?? []).includes(a.itemId)) : undefined;
  const askPhoto = firstAsk ? closet.find((c) => c.id === firstAsk.itemId) : undefined;
  const askCandidate = firstAsk ? closet.find((c) => c.id === firstAsk.candidateId) : undefined;
  const askRunnerUp = firstAsk?.runnerUpId ? closet.find((c) => c.id === firstAsk.runnerUpId) ?? null : null;
  const moreAsks = firstAsk ? openAsks(cs).filter((a) => a.obsId !== firstAsk.obsId).length : 0;
  const finishing = !readOnly && partial && row.snapState === 'pending' && row.details.finish !== undefined;
  const finish = finishing ? finishInfo(row, closet) : null;
  // The closet question, for VoiceOver (the card is one element): the question and reason in the label, the answers as actions.
  const askItem = askCandidate ? lowerFirst(askCandidate.name) : '';
  const askLine = firstAsk && askPhoto && askCandidate
    ? firstAsk.answer
      ? firstAsk.answer === 'new' ? t('item.dup.saidNew') : t('item.dup.saidSame', { item: firstAsk.answer === 'runnerUp' && askRunnerUp ? lowerFirst(askRunnerUp.name) : askItem })
      : `${askQuestionText(askItem, askCandidate.slot)} ${askReasonText(firstAsk, isPluralPiece(askCandidate.slot))}`
    : '';
  const answerAsk = (a: 'same' | 'new' | 'runnerUp') => { if (firstAsk) void fitCheck.answerDuplicate(row.id, firstAsk.obsId, a); };
  const scoreText = displayScore(score);
  // The Going-for move is already a fix on the card: say so instead of drawing it twice.
  const moveFix = advice?.move ? fixes.findIndex((f) => f.copy === advice.move!.copy) : -1;
  const moveIsFix = moveFix >= 0 ? moveFix + 1 : null;
  // The score reveal (#242, #246 (16)): once per new check; the quick tap's own announcement already says the score.
  const [viaTap] = useState(() => justAnswered.has(row.id));
  const { t: revealT, plan, values: tapeVals, attachScore, onScoreLayout, touch } = useCheckReveal(row, dialed ? 0 : fixes.length, { announce: !viaTap });
  const rt = plan ? revealT : undefined;
  const afterFixes = plan ? plan.fixes[plan.fixes.length - 1] ?? plan.summary : null;
  const blockReveal = plan
    ? { t: revealT, values: tapeVals, tape: plan.tape, swap: plan.swap, lock: plan.lock, blankStart: plan.blankStart, word: plan.word, summary: plan.summary }
    : undefined;

  const actions = readOnly ? [{ name: 'why', label: t('card.why', { score: scoreText }) }] : [
    { name: 'why', label: t('card.why', { score: scoreText }) },
    { name: 'nqr', label: t('card.nqr') },
    ...(recheckOpen && !dialed ? [{ name: 'recheck', label: t('card.recheck') }] : []),
    ...(later ? [{ name: 'later', label: t('card.later') }] : []),
    ...(SHARE_CARD_BUILT ? [{ name: 'share', label: t('card.share.a11y') }] : []),
    ...(showCloset ? [{ name: 'review', label: t('card.a11y.review') }] : []),
    { name: 'occasion', label: t('card.a11y.changeOccasion') },
    ...(gf ? [{ name: 'look', label: t('card.a11y.changeLook') }] : []),
    ...(changeAnswer ? [{ name: 'changeAnswer', label: t('tap.a11y.change') }] : []),
    ...(askLine ? [
      { name: 'askSame', label: t('item.dup.yes') },
      { name: 'askNew', label: t('item.dup.no') },
      ...(askRunnerUp ? [{ name: 'askRunnerUp', label: t('item.dup.runnerUp', { item: lowerFirst(askRunnerUp.name) }) }] : []),
      ...(moreAsks > 0 ? [{ name: 'moreAsks', label: moreAsks === 1 ? t('closet.q.more1') : t('closet.q.more', { n: moreAsks }) }] : []),
    ] : []),
    ...(finish ? [
      ...(finish.remembered ? [{ name: 'finishSame', label: finish.remembered.label }] : finish.hasShoes ? [{ name: 'finishPick', label: t('partial.a11y.pick') }] : []),
      { name: 'finishSnap', label: finish.snapLabel },
      { name: 'finishSkip', label: t('partial.a11y.skip') },
    ] : []),
  ];
  const go = {
    why: () => router.push(`/sheets/why/${row.id}`),
    nqr: () => router.push(`/sheets/correct/${row.id}`),
    // The re-check's "only the pants are read again" lives in the camera now, not as a chat line (founder, Oct 14).
    recheck: () => router.push(`/camera?mode=recheck&parent=${row.id}`),
    share: () => router.push(`/share/${row.id}`),
    later: () => void finishSequence.later(row.id),
    review: () => router.push(`/sheets/added/${row.id}`),
    occasion: () => pickOccasion(row.occasion, (o) => void confirmLens(row, { occasion: o })),
    look: () => pickLook(picks, gf?.style ?? null, (st) => void changeLook(st)),
    changeAnswer: () => changeAnswer?.(),
    askSame: () => answerAsk('same'),
    askNew: () => answerAsk('new'),
    askRunnerUp: () => answerAsk('runnerUp'),
    moreAsks: () => router.navigate('/closet'),
    finishSame: () => { if (finish?.remembered) void fitCheck.pickShoes(row.id, finish.remembered.item.id); },
    finishPick: () => router.push(`/sheets/pick-shoes/${row.id}`),
    finishSnap: () => { if (finish) router.push(finish.snapHref as Href); },
    finishSkip: () => void fitCheck.skipFinish(row.id),
  };
  const spokenHead = {
    occasion: occasionLabel(row.occasion),
    score: spokenScore(score),
    word: scoreWordLabel(score),
    partial: partial || finished ? `${partialText}. ` : '',
    summary: row.explanation ?? '',
  };
  // No fix: the summary already says so, so there's no "Top fix: …" clause (#276; it read "Top fix: No quick fixes
  // for this one, .").
  const spokenCard = top
    ? t('card.a11y.fitCheck', { ...spokenHead, fix: top.copy, tag: top.tag ?? '' }).replace(', .', '.')
    : t('card.a11y.fitCheckNoFix', spokenHead);
  const label = [spokenCard, skippedAs ? t('tap.skipped', { choice: skippedAs }) : '', gf ? lineA11y(gf, occasionLabel(row.occasion)) : '', adviceA11y(advice, moveIsFix),
    askLine, finish ? `${t('partial.finish.title')}. ${finish.second}` : ''].filter(Boolean).join(' ');

  // Just answered the one quick tap here: say the score, then put VoiceOver on the result.
  const focusRef = useRef<View>(null);
  useEffect(() => {
    if (!justAnswered.has(row.id)) return;
    const h = setTimeout(() => {
      justAnswered.delete(row.id);
      AccessibilityInfo.announceForAccessibility?.(t('a11y.score', { score: spokenScore(score), word: scoreWordLabel(score) }));
      if (focusRef.current) AccessibilityInfo.sendAccessibilityEvent?.(focusRef.current, 'focus');
    }, 350);
    return () => clearTimeout(h);
  }, [row.id, score]);

  return (
    <View ref={focusRef} collapsable={false} onTouchStart={touch.onTouchStart} onTouchEnd={touch.onTouchEnd}>
      <KCard
        // While Change is open the card isn't one VoiceOver element, so the looks can be reached one by one.
        accessibilityLabel={changing ? undefined : label}
        accessibilityActions={changing ? undefined : actions}
        onAccessibilityAction={(e) => void go[e.nativeEvent.actionName as keyof typeof go]?.()}
      >
        {gf ? (
          changing ? (
            <GoingForInset
              where="result" look={gf.style} touched={gf.confirmed} source={gf.source} other={gf.other} occasion={row.occasion} picks={picks}
              onLook={(st, o) => void changeLook(st, o)}
              onOccasion={(o) => {
                setChanging(false);
                void confirmLens(row, { occasion: o });
              }}
            />
          ) : (
            <GoingForLine g={gf} occasion={row.occasion} onChange={readOnly ? undefined : () => {
              setChanging(true);
              // It grows in place: keep the card's top in view (the thread otherwise stays pinned to the bottom).
              void store.chat.all().then((ms) => {
                const m = ms.find((x) => x.kind === 'card' && x.fitCheckId === row.id);
                if (m) setStylistAction({ kind: 'scrollTo', messageId: m.id });
              });
            }} />
          )
        ) : null}
        <KCardSection>
          <LensTagline row={row} left={t(partial ? 'card.tag.partial' : 'card.tag.full')} occasionHere={!gf} readOnly={readOnly} />
          {partial || finished ? (
            <>
              <View ref={attachScore} onLayout={onScoreLayout} collapsable={false}>
                <ScoreBlock score={score} partialLabel={partialText} partialDone={finished} onPress={go.why} reveal={blockReveal} />
              </View>
              {row.explanation ? (
                <RevealStepView t={rt} step={plan?.summary}>
                  <KText variant="subheadline" color="ink2">{row.explanation}</KText>
                </RevealStepView>
              ) : null}
            </>
          ) : (
            <View ref={attachScore} onLayout={onScoreLayout} collapsable={false}>
              <ScoreBlock score={score} verdict={row.explanation ?? undefined} onPress={go.why} reveal={blockReveal} />
            </View>
          )}
          {/* "Reads as …" moved into the Why sheet (#205, #209). */}
          {skippedAs && changeAnswer ? (
            <RevealStepView t={rt} step={plan?.summary}>
              <SkippedLine choice={skippedAs} onPress={changeAnswer} />
            </RevealStepView>
          ) : null}
        </KCardSection>
        {dialed && quietNoFix && !advice && !nextLevel && !wxTip ? null : (<>
        <Seam />
        <KCardSection paddingVertical={4} gap={0}>
          {advice ? (
            <RevealStepView t={rt} step={plan ? plan.fixes[0] ?? plan.summary : null}>
              <GoingForAdviceBlock advice={advice} flash={flash} moveIsFix={moveIsFix} />
            </RevealStepView>
          ) : null}
          {advice && !(dialed && quietNoFix) ? <RowDivider /> : null}
          {/* Below 9 with no fixes the summary already says "No quick fixes for this one."; don't say it twice (#183). */}
          {dialed && quietNoFix ? null : dialed ? (
            <RevealStepView t={rt} step={plan?.summary} style={{ paddingVertical: space.fixRowV }}>
              <KText role="fixTitle">{score >= 9 ? t('dialed.title') : t('card.noFixes')}</KText>
            </RevealStepView>
          ) : (
            fixes.map((f, i) => (
              <RevealStepView key={f.target + i} t={rt} step={plan?.fixes[i]} style={{}}>
                {i > 0 ? <RowDivider /> : null}
                <FixRow
                  number={i + 1} title={f.copy} detail={f.tag} gain={t('card.gainTo', { score: displayScore(f.to) })}
                  reveal={plan && i === 0 ? { t: revealT, gain: plan.gain } : undefined}
                />
              </RevealStepView>
            ))
          )}
          {nextLevel ? (
            <RevealStepView t={rt} step={afterFixes}>
              <TipLine lead={tipLeadText(row.details.tipLead) ?? t('card.nextLevel')} text={nextLevel} first={dialed && quietNoFix && !advice} />
            </RevealStepView>
          ) : null}
          {wxTip ? (
            <RevealStepView t={rt} step={afterFixes}>
              <TipLine lead={t('tip.wx.lead')} text={wxTip} first={dialed && quietNoFix && !nextLevel && !advice} />
            </RevealStepView>
          ) : null}
        </KCardSection>
        </>)}
        <Seam />
        <RevealStepView t={rt} step={afterFixes}>
        <KCardSection gap={6}>
          {showCloset && closetLine ? <ClosetSummaryRow items={addedItems} text={closetLine.text} onReview={readOnly ? undefined : go.review} /> : null}
          {firstAsk && askPhoto && askCandidate ? (
            <View style={{ paddingTop: 6, paddingBottom: 4, gap: 8 }}>
              <DuplicateQuestion ask={firstAsk} photo={askPhoto} candidate={askCandidate} runnerUp={askRunnerUp} compact onAnswer={answerAsk} />
              {moreAsks > 0 ? (
                <TextLink title={moreAsks === 1 ? t('closet.q.more1') : t('closet.q.more', { n: moreAsks })} onPress={() => router.navigate('/closet')} compact />
              ) : null}
            </View>
          ) : null}
          {finish ? <FinishRow row={row} info={finish} /> : null}
          {/* "Re-check after fixing" only when there's a fix to make: under "No quick fixes" it had nothing to check. */}
          {(SAVE_LOOK_BUILT && dialed && score >= 9) || (recheckOpen && !dialed) || SHARE_CARD_BUILT ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: recheckOpen || dialed ? 'flex-start' : 'flex-end' }}>
              {SAVE_LOOK_BUILT && dialed && score >= 9 ? (
                <KButton title={t('dialed.save')} icon="bookmark" size="regular" style={{ flex: 1 }} />
              ) : recheckOpen && !dialed ? (
                <KButton title={t('card.recheck')} icon="recheck" size="regular" style={{ flex: 1 }} onPress={() => void go.recheck()} />
              ) : null}
              {SHARE_CARD_BUILT ? <IconButton icon="share" diameter={36} label={t('card.share.a11y')} onPress={go.share} /> : null}
            </View>
          ) : null}
          {/* "Not sure about your mid-wash jeans' leg? Tap." (§19, #322): a statement, never a question before the score. */}
          <DoubtLine row={row} readOnly={readOnly} />
          <TextLinkRow>
            <TextLink title={t('card.why', { score: scoreText })} onPress={go.why} compact />
            {readOnly ? null : <TextLink title={t('card.nqr')} onPress={go.nqr} compact />}
            {/* `Later` (ruling 23, #291): his first-ever check only; the first 3 moves follow at once. */}
            {later ? <TextLink title={t('card.later')} onPress={() => void finishSequence.later(row.id)} compact accessibilityHint={t('card.a11y.laterHint')} /> : null}
          </TextLinkRow>
          {row.details.rescoredFrom ? (
            <KText variant="footnote" color="ink3">
              {t('rescore.footnote', {
                score: displayScore(row.details.rescoredFrom.score),
                // A new look never re-scores (#215), so on a Going-for check the footnote is always about the occasion.
                lens: row.details.rescoredFrom.style !== row.style && !gf
                  ? styleLabel(row.details.rescoredFrom.style).toLowerCase()
                  : occasionLabel(row.details.rescoredFrom.occasion).toLowerCase(),
              })}
            </KText>
          ) : null}
        </KCardSection>
        </RevealStepView>
      </KCard>
    </View>
  );
}

/** "Fit check · Full" + the occasion (02 "S6s"). The occasion opens an in-card tray (a change asks first,
 *  #62). No style here: a style never changes the score (rubric v4); the card says "Reads as …" (#85). On a check with
 *  the Going-for line (#215) the occasion lives in that line instead, so it's in one place. */
function LensTagline({ row, left, occasionHere = true, readOnly = false }: { row: FitCheckRow; left: string; occasionHere?: boolean; readOnly?: boolean }) {
  if (!occasionHere) return <MonoLabel>{left}</MonoLabel>;
  // Past chats: the occasion it was scored for, as a plain label (no tray, so an old check can't be re-scored).
  if (readOnly) return <TagLine left={left} right={occasionLabel(row.occasion)} />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
      <MonoLabel>{left}</MonoLabel>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MorphPicker
          plain
          label={occasionLabel(row.occasion)}
          value={row.occasion}
          sections={[{ options: OCCASIONS.map((o) => ({ value: o, label: occasionLabel(o) })) }]}
          onPick={(o) => void confirmLens(row, { occasion: o })}
          accessibilityLabel={t('card.a11y.changeOccasion')}
        />
      </View>
    </View>
  );
}

/** After a Skip: "Scored as jeans. Not right? Tap." The whole inset opens S8 with the other answer picked. */
function SkippedLine({ choice, onPress }: { choice: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('tap.skipped', { choice })} ${t('tap.a11y.change')}`}
      style={({ pressed }) => ({
        minHeight: size.hit, justifyContent: 'center', backgroundColor: colors.surface2, borderRadius: 12, borderCurve: 'continuous',
        paddingVertical: 8, paddingHorizontal: 12, opacity: pressed ? opacity.pressed : 1,
      })}
    >
      <KText variant="footnote" color="ink2">
        {`${t('tap.skipped', { choice })} `}
        {/* Ink, like every text link now (#231): copper is only for score movement. */}
        <KText variant="footnote" weight="600" color="ink">
          {t('tap.skipped.fix')}
        </KText>
      </KText>
    </Pressable>
  );
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** "Finish the check · Same shoes as Monday?" + the remembered pair, the camera, Skip (02 D11). */
function FinishRow({ row, info }: { row: FitCheckRow; info: FinishInfo }) {
  const { colors, isAccessibilitySize } = useTheme();
  const { remembered, hasShoes, second } = info;
  return (
    // AX sizes: the text on its own line, the controls in a row under it (p2-design-spec 11 §5).
    <View style={isAccessibilitySize ? { gap: 8 } : { flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <KText variant="subheadline" color="ink2" style={{ flexShrink: 1 }}>
        <KText variant="subheadline" weight="600" color="ink">
          {t('partial.finish.title')}
        </KText>
        {`\n${second}`}
      </KText>
      <View style={{ marginLeft: isAccessibilitySize ? 0 : 'auto', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {remembered ? (
          <FinishTile
            filled
            label={remembered.label}
            onPress={() => void fitCheck.pickShoes(row.id, remembered.item.id)}
          >
            <PieceArt item={remembered.item} size={40} />
          </FinishTile>
        ) : hasShoes ? (
          <FinishTile filled label={t('partial.a11y.pick')} onPress={() => router.push(`/sheets/pick-shoes/${row.id}`)}>
            <Icon name="shoes" size="regular" color={colors.ink} />
          </FinishTile>
        ) : null}
        <FinishTile label={info.snapLabel} onPress={() => router.push(info.snapHref as Href)}>
          <Icon name="camera" size="regular" color={colors.ink} />
        </FinishTile>
        <TextLink title={t('common.skip')} color="ink2" compact onPress={() => void fitCheck.skipFinish(row.id)} />
      </View>
    </View>
  );
}

export { PartialLabel };
