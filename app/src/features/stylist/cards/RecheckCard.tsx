// S6r Re-check card (02 D10) and S21 "change not seen". The delta is like for like: the new
// photo is merged onto the first reading at the first check's occasion. Honest about the direction (#276): only a win
// says "Nothing else changed." and gets copper; a drop shows was → now with an ink arrow and its new problems
// ("New: …"); "Didn't catch the change?" shows only when no fix was caught; "not seen" leads with "Try another photo".
// A piece the photo added that holds the score is named ("I see your green hoodie now.", #383), and "I did make the
// change" / "Tell me" offer only fixes the photo didn't clearly read otherwise; else "Not quite right?" (#383).
// A scored re-check has "Why X?" and "Not quite right?" like the first check's card (09 §20.8 G15).
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  DeltaRow, ExpandHandle, Expandable, FixRow, KButton, KCard, KCardSection, KText, RevealStepView, ScoreBlock, Seam, TagLine, TextLink, TextLinkRow, displayScore, spokenScore,
} from '@/design-system';
import { scoreWordLabel } from '@/design-system/score';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { addedLayerCredit, caughtFixGain, newProblemLines, notSeenProblem, recheckMove, recheckSeenLine, recheckSummary } from '@/features/fitcheck/explain';
import { fitCheck } from '@/features/fitcheck/session';
import { t } from '@/i18n/en';
import { occasionLabel } from '../thread';
import { threadGrow } from '../threadGrow';
import { FitCheckCard, useCardOpen } from './FitCheckCard';
import { shareOffered } from '@/features/share/offer';
import { useWinReveal } from './useReveal';
import type { FitCheckRow } from '@/data/types';
import { isOwned } from '@/features/closet/profile';
import { holdBadge, noSlide } from '@/features/closet/slide';
import { addedIds, isPending } from '@/features/closet/summaryText';
import { useSlideIntoCloset } from '@/features/closet/useSlide';
import { wasLive } from '@/features/fitcheck/reveal';
import { sessionClock } from '@/state/session';

/** `readOnly`: Past chats (#276): the result as it was, with no buttons (a new photo, "I did make the change", Tell me,
 *  Not quite right?); Why stays, as on the first check's card. */
export function RecheckCard({ checkId, readOnly = false }: { checkId: string; readOnly?: boolean }) {
  const row = useLive(['fitChecks'], () => store.fitChecks.get(checkId), [checkId], checkId);
  const parent = useLive(['fitChecks', 'readings'], async () => {
    const p = row?.parentId ? await store.fitChecks.get(row.parentId) : null;
    const reading = p?.readingId ? (await store.readings.get(p.readingId))?.reading ?? null : null;
    return p ? { row: p, reading } : null;
  }, [row?.parentId]);
  if (!row) return null;
  if (row.status !== 'scored' || !row.details.recheck) return <FitCheckCard checkId={checkId} readOnly={readOnly} />;
  return <ScoredRecheck row={row} parent={parent} readOnly={readOnly} />;
}

function ScoredRecheck({ row, parent, readOnly }: { row: FitCheckRow; parent: { row: FitCheckRow; reading: Parameters<typeof notSeenProblem>[0] | null } | null | undefined; readOnly: boolean }) {
  const rc = row.details.recheck!;
  const rowFill = { flexGrow: 1 } as const;
  // The re-check win (#242, #246 (16)): once, only when the score went up and the card shows the change (not the
  // "same photo" or "change not seen" cards, which land as they are).
  const { t: winT, plan, values: winValues, pill, attachScore, onScoreLayout, touch, done: revealDone } = useWinReveal(
    row, rc.parentScore, { announce: true, enabled: !rc.samePhoto && !(rc.notSeen && !row.details.confirmed) },
  );
  // The slide into Closet (SY2.2): this card has no `Added` row, so a fresh re-check's new pieces start from its bottom
  // edge; the badge leaves them out until they land, as on the first check's card.
  const [fresh] = useState(() => !readOnly && wasLive(row.id));
  const edge = useRef<View | null>(null);
  useEffect(() => {
    if (!fresh) return;
    holdBadge(row.id);
    return () => noSlide(row.id);
  }, [fresh, row.id]);
  const cs = row.details.closetSummary;
  const added = addedIds(cs);
  const closet = useLive(['closet'], () => store.closet.all(), []);
  const flying = added.map((id) => closet?.find((c) => c.id === id)).filter((c) => !!c && isOwned(c)).slice(0, 4) as NonNullable<typeof closet>;
  useSlideIntoCloset(
    fresh ? { checkId: row.id, fresh, ready: revealDone && !!closet, added, pending: !cs || isPending(cs, sessionClock.nowMs()), visible: false, edge } : undefined,
    flying,
  );
  // The first card's fixes he may still confirm (#383): none when the photo clearly read those pieces otherwise; then
  // "Not quite right?" stands in for "I did make the change" and "Tell me". undefined while it loads.
  const confirmable = useLive(['fitChecks', 'readings'], () => fitCheck.confirmableFixes(row.id), [row.id]);
  const canConfirm = (confirmable?.length ?? 0) > 0;
  const now = row.score ?? 0;
  const occasionWord = occasionLabel(row.occasion);
  // Folded to its rating like the first check's card (#344); the "change not seen" card keeps its two buttons in view.
  const [opened, setOpened] = useCardOpen(row.id);
  // The same photo again (#219): nothing was re-read or counted; say so and ask for a new photo after the fix.
  if (rc.samePhoto) {
    return (
      <KCard
        accessibilityLabel={t('card.a11y.recheckSame', { occasion: occasionWord, now: spokenScore(now), word: scoreWordLabel(now) })}
        // The card is one VoiceOver element: its button is an action, or VoiceOver can't reach it.
        accessibilityActions={readOnly ? undefined : [{ name: 'newPhoto', label: t('recheck.samePhoto.button') }]}
        onAccessibilityAction={() => router.push(`/camera?mode=recheck&parent=${row.parentId}`)}
      >
        <KCardSection gap={12}>
          <TagLine left={t('card.tag.recheck')} right={occasionWord} />
          <ScoreBlock score={now} />
          <KText role="cardSummary">{t('recheck.samePhoto')}</KText>
        </KCardSection>
        {readOnly ? null : (
          <KCardSection gap={4} style={{ paddingTop: 4 }}>
            <KButton
              title={t('recheck.samePhoto.button')} icon="camera" size="regular" fullWidth
              onPress={() => router.push(`/camera?mode=recheck&parent=${row.parentId}`)}
            />
          </KCardSection>
        )}
      </KCard>
    );
  }
  const notSeen = rc.notSeen && !row.details.confirmed;
  const open = notSeen || opened;
  const done = rc.doneFixes[0];
  const occasion = occasionLabel(row.occasion);
  const outcome = { after: now, doneFixes: rc.doneFixes.map((d) => ({ ...(parent?.row.fixes.find((f) => f.copy === d.copy) ?? { target: '' }), earned: d.earned })) };
  const move = recheckMove(rc.parentScore, now);
  const problems = newProblemLines(rc.newProblems ?? [], row.details);
  const summary = recheckSummary(outcome as never, move, problems, rc.doneFixes.length === 0 && addedLayerCredit(rc.seen, row.details));
  // A piece the photo added that holds the score: named after the word (#383), never "I still see the same outfit".
  const seenLine = move === 'same' && rc.doneFixes.length === 0 ? recheckSeenLine(rc.seen ?? []) : '';
  // One caught fix carries the whole move, so its row says the pill's number, as the pill prints it ("+1.0"); with
  // several or no win, the rows carry no number.
  const doneGain = caughtFixGain(rc, now);
  // "Didn't catch the change? Tell me" only when a fix wasn't caught (none were, or some of the card's weren't).
  const missed = canConfirm && (rc.doneFixes.length < (parent?.row.fixes.length ?? 0) || rc.doneFixes.length === 0);
  const problem = parent?.reading ? notSeenProblem(parent.reading, parent.row.fixes) : '';
  const iDidTitle = t('recheck.iDid', { fixPast: t(parent?.row.fixes.some((f) => f.edits.some((e) => e.op === 'add_held')) ? 'recheck.fixPast.held' : 'recheck.fixPast.generic') });
  const tryAnother = () => router.push(`/camera?mode=recheck&parent=${row.parentId}`);
  // One VoiceOver element: every button on it is also an action (the "not seen" card has its own two).
  const scoreText = displayScore(now);
  const why = { name: 'why', label: t('card.why', { score: scoreText }) };
  const fold = { name: 'fold', label: open ? t('card.fold.less') : t('card.fold.more') };
  const actions = notSeen
    ? readOnly ? [] : [canConfirm ? { name: 'iDid', label: iDidTitle } : { name: 'nqr', label: t('card.nqr') }, { name: 'tryAnother', label: t('recheck.tryAnother') }]
    : readOnly ? [fold, why] : [
        fold,
        ...(move === 'up' && shareOffered(row) ? [{ name: 'share', label: t('recheck.share') }] : []),
        why, { name: 'nqr', label: t('card.nqr') },
        ...(missed ? [{ name: 'tell', label: t('recheck.tellMe') }] : []),
      ];
  const go = {
    fold: () => setOpened(!opened),
    iDid: () => void fitCheck.confirmFixes(row.id),
    tryAnother,
    share: () => router.push(`/share/${row.id}`),
    why: () => router.push(`/sheets/why/${row.id}`),
    nqr: () => router.push(`/sheets/correct/${row.id}`),
    tell: () => router.push(`/sheets/tell-me/${row.id}`),
  };
  const newLines = problems.map((x) => t('recheck.newProblem', { problem: x }));
  const label = notSeen
    ? `${t('card.tag.recheck')}, ${occasion}. ${t('recheck.notSeen', { problem })} ${t('card.a11y.recheckHeld', { now: spokenScore(now) })}`
    : [
        move === 'up'
          ? t('card.a11y.recheck', { occasion, was: spokenScore(rc.parentScore), now: spokenScore(now), delta: (now - rc.parentScore).toFixed(1), word: scoreWordLabel(now), fix: done?.copy ?? '' })
          : move === 'down'
            ? t('card.a11y.recheckDown', { occasion, was: spokenScore(rc.parentScore), now: spokenScore(now), word: scoreWordLabel(now) })
            : t('card.a11y.recheckFlat', { occasion, now: spokenScore(now), word: scoreWordLabel(now) }),
        ...(seenLine ? [seenLine] : []),
        ...newLines.map((x) => `${x}.`),
      ].join(' ');
  return (
    <View collapsable={false} onTouchStart={touch.onTouchStart} onTouchEnd={touch.onTouchEnd}>
    <KCard
      accessibilityLabel={label}
      accessibilityActions={actions}
      onAccessibilityAction={(e) => go[e.nativeEvent.actionName as keyof typeof go]?.()}
    >
      <Pressable onPress={() => setOpened(true)} disabled={open} accessible={false}>
      <KCardSection gap={12}>
        <TagLine left={t('card.tag.recheck')} right={occasion} />
        {notSeen ? (
          <>
            {/* was → now, the same number: the old score shows, so it's plain nothing moved. */}
            <DeltaRow was={rc.parentScore} now={now} />
            <KText role="cardSummary">{t('recheck.notSeen', { problem })}</KText>
          </>
        ) : (
          <>
            <View ref={attachScore} onLayout={onScoreLayout} collapsable={false}>
              <DeltaRow
                was={rc.parentScore} now={now}
                reveal={plan ? {
                  t: winT, values: winValues, shrink: plan.shrink, strike: plan.strike, arrow: plan.arrow, tape: plan.tape, swap: plan.swap,
                  lock: plan.lock, pillSpring: plan.pillSpring, pill: pill,
                } : undefined}
              />
            </View>
            {/* The new word arrives with its line (it sits inside the sentence, so the line rises in, not the word alone). */}
            <RevealStepView t={plan ? winT : undefined} step={plan?.word}>
              <KText role="cardSummary">
                {summary.lead ? `${summary.lead} ` : ''}
                <KText role="cardSummary" weight="600">
                  {summary.word}
                </KText>
                {summary.tail ? ` ${summary.tail}` : ''}
                {seenLine ? ` ${seenLine}` : ''}
                {row.details.confirmed ? ` ${t('recheck.tell.confirmed')}` : ''}
              </KText>
              {newLines.map((x) => (
                <KText key={x} role="cardSummary">{x}</KText>
              ))}
            </RevealStepView>
          </>
        )}
      </KCardSection>
      </Pressable>
      <Expandable open={open} grow={readOnly ? undefined : threadGrow}>
      {!notSeen && rc.doneFixes.length > 0 ? (
        <>
          <Seam />
          <KCardSection paddingVertical={4} gap={0}>
            {rc.doneFixes.map((d, i) => (
              <FixRow key={i} number={i + 1} title={d.copy} gain={doneGain} done reveal={plan ? { t: winT, badge: plan.badge } : undefined} />
            ))}
          </KCardSection>
        </>
      ) : null}
      {readOnly ? null : (
      <KCardSection gap={4} style={{ paddingTop: 4 }}>
        {notSeen ? (
          <View style={{ gap: 8 }}>
            {/* A new photo first; his own word that he made the change second (#276), only for a fix the photo didn't
                clearly read otherwise (#383); else he corrects the reading, like any check. */}
            <KButton title={t('recheck.tryAnother')} icon="camera" size="regular" fullWidth onPress={tryAnother} />
            {confirmable === undefined ? null : canConfirm ? (
              <KButton title={iDidTitle} size="regular" kind="secondary" fullWidth onPress={go.iDid} />
            ) : (
              <KButton title={t('card.nqr')} size="regular" kind="secondary" fullWidth onPress={go.nqr} />
            )}
          </View>
        ) : (
          <>
            {move === 'up' && shareOffered(row) ? (
              <KButton title={t('recheck.share')} icon="share" size="regular" fullWidth onPress={() => router.push(`/share/${row.id}`)} />
            ) : null}
            {/* Why and Not quite right? are two secondary buttons side by side (the founder's pick A, Nov 18): after a drop he
                can see why and correct a misread. Larger text wraps them onto two lines. Tell me stays a quiet link under them. */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <KButton title={t('card.why', { score: scoreText })} kind="secondary" size="regular" style={rowFill} onPress={go.why} />
              <KButton title={t('card.nqr')} kind="secondary" size="regular" style={rowFill} onPress={go.nqr} />
            </View>
            {missed ? (
              <TextLinkRow>
                <TextLink title={t('recheck.tellMe')} compact onPress={go.tell} />
              </TextLinkRow>
            ) : null}
          </>
        )}
      </KCardSection>
      )}
      {/* Past chats keep Why (read-only), as FitCheckCard does. */}
      {readOnly && !notSeen ? (
        <KCardSection gap={4} style={{ paddingTop: 4 }}>
          <KButton title={t('card.why', { score: scoreText })} kind="secondary" size="regular" fullWidth onPress={go.why} />
        </KCardSection>
      ) : null}
      </Expandable>
      {/* The card's bottom edge: a fresh re-check's new pieces start their slide into Closet here (no `Added` row). */}
      <View ref={edge} collapsable={false}>
        {notSeen ? null : <ExpandHandle open={open} onPress={() => setOpened(!opened)} />}
      </View>
    </KCard>
    </View>
  );
}
