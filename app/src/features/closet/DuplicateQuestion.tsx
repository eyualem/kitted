// "Is this your grey Nike hoodie?" (#117; was "Same as your …?", 02 S11 / #91): asked on the score card right after
// the rating and in Closet's "To confirm". Picture first: this photo cropped to the piece (outlined, the rest dimmed)
// next to the piece in his closet (its best earlier photo, else its drawing), one plain reason, and on his first
// few questions "Your score stays the same either way." Yes, same one · No, a new one · It's my {runner-up}. Until
// he answers both stay separate pieces (a duplicate does less harm than a wrong merge). Answered: one line, "Change".
// In Closet's deck (`deck`, specs/closet-beta.md CB2): "Question 2 of 5." first for VoiceOver, 96 × 110 pictures, a
// guard against a double tap, and Skip › at the end of the answers' row (its own row with a third answer or at the
// largest sizes; none on a lone question). Without `deck` it is exactly the score card's and the Added sheet's.
import { useState } from 'react';
import { View } from 'react-native';
import { Chip, ChipFlow, KText, TextLink, useTheme } from '@/design-system';
import type { ClosetAsk, ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';
import { askQuestionText, askReasonText, isPluralPiece } from './askText';
import { SCORE_LINE_UNTIL, useAskEvidence, type Shot } from './askEvidence';
import { ClosetTile } from './ClosetTile';
import type { DeckSlot } from './ConfirmDeck';
import { SightingCrop } from './SightingCrop';

export interface DuplicateQuestionProps {
  ask: ClosetAsk;
  /** The piece as this photo shows it (the new, flagged item). */
  photo: ClosetItemRow;
  candidate: ClosetItemRow;
  runnerUp?: ClosetItemRow | null;
  onAnswer: (a: 'same' | 'new' | 'runnerUp') => void;
  /** On the score card: smaller pictures, so the card stays short. */
  compact?: boolean;
  /** In Closet's To confirm deck: its place, Skip and the answer guard (CB2). */
  deck?: DeckSlot;
}

/** The deck's pictures (CB2.7): 96 wide, 110 tall, at every text size. */
const DECK_W = 96;
const DECK_H = 110;

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

function Frame({ shot, item, w, h }: { shot: Shot | null; item: ClosetItemRow; w: number; h: number }) {
  if (shot) return <SightingCrop source={shot.photo.source} aspect={shot.photo.aspect} box={shot.box} top={shot.top} mirrored={shot.mirrored} width={w} height={h} radius={14} />;
  return <ClosetTile item={item} size={w} aspect={h / w} radius={14} scale={0.7} decorative />;
}

export function DuplicateQuestion({ ask, photo, candidate, runnerUp, onAnswer, compact, deck }: DuplicateQuestionProps) {
  const { isAccessibilitySize } = useTheme();
  const [changing, setChanging] = useState(false);
  const [width, setWidth] = useState(0);
  const ev = useAskEvidence(ask);
  const target = ask.answer === 'runnerUp' ? runnerUp ?? candidate : candidate;
  if (ask.answer && !changing) {
    const line = ask.answer === 'new' ? t('item.dup.saidNew') : t('item.dup.saidSame', { item: lower(target.name) });
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <KText variant="footnote" color="ink2" style={{ flexShrink: 1 }}>
          {line}
        </KText>
        <TextLink title={t('item.dup.change')} onPress={() => setChanging(true)} compact />
      </View>
    );
  }
  const item = lower(candidate.name);
  const question = askQuestionText(item, candidate.slot);
  const reason = askReasonText(ask, isPluralPiece(candidate.slot));
  const scoreLine = ev !== undefined && ev.answered < SCORE_LINE_UNTIL;
  const answer = (a: 'same' | 'new' | 'runnerUp') => {
    setChanging(false);
    onAnswer(a);
  };
  if (deck) {
    const pick = (a: 'same' | 'new' | 'runnerUp') => {
      if (!deck.willAnswer()) return;
      answer(a);
    };
    return (
      <DeckBody
        deck={deck} question={question} reason={reason} item={item} scoreLine={scoreLine} ev={ev} photo={photo} candidate={candidate}
        runnerUp={runnerUp ?? null} ax={isAccessibilitySize} onPick={pick}
      />
    );
  }
  // Two frames side by side (one per row at the largest text sizes), a touch taller than wide.
  const fw = width > 0 ? Math.min(compact ? 120 : 150, Math.floor(isAccessibilitySize ? width : (width - 12) / 2)) : 0;
  const fh = Math.round(fw * (compact ? 1 : 1.15));
  return (
    <View style={{ gap: 10 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ gap: 3 }}>
        <KText variant="subheadline" weight="600" accessibilityRole="header" accessibilityLabel={t('closet.q.a11y', { question, item, reason })}>
          {question}
        </KText>
        <KText variant="footnote" color="ink2">{reason}</KText>
        {scoreLine ? <KText variant="footnote" color="ink3">{t('closet.q.scoreSame')}</KText> : null}
      </View>
      {fw > 0 && ev !== undefined ? (
        <View style={isAccessibilitySize ? { gap: 10 } : { flexDirection: 'row', gap: 12 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {([[ev.thisPhoto, photo, t('item.dup.thisPhoto')], [ev.inCloset, candidate, t('item.dup.inCloset')]] as const).map(([shot, it, caption]) => (
            <View key={caption} style={{ gap: 4, width: fw }}>
              <Frame shot={shot} item={it} w={fw} h={fh} />
              <KText variant="caption" color="ink2" style={{ textAlign: 'center' }}>{caption}</KText>
            </View>
          ))}
        </View>
      ) : null}
      <ChipFlow accessibilityLabel={question}>
        <Chip title={t('item.dup.yes')} small onPress={() => answer('same')} state={ask.answer === 'same' ? 'selected' : 'normal'} />
        <Chip title={t('item.dup.no')} small onPress={() => answer('new')} state={ask.answer === 'new' ? 'selected' : 'normal'} />
        {runnerUp ? (
          <Chip title={t('item.dup.runnerUp', { item: lower(runnerUp.name) })} small onPress={() => answer('runnerUp')} state={ask.answer === 'runnerUp' ? 'selected' : 'normal'} />
        ) : null}
      </ChipFlow>
    </View>
  );
}

/** The deck's card body (CB2): the question and its reason as one VoiceOver element that starts "Question n of
 *  total.", the score line, the pictures, the answers and Skip. */
function DeckBody({ deck: { a11yPrefix, showSkip, next, focusRef }, question, reason, item, scoreLine, ev, photo, candidate, runnerUp, ax, onPick }: {
  deck: DeckSlot; question: string; reason: string; item: string; scoreLine: boolean; ev: ReturnType<typeof useAskEvidence>;
  photo: ClosetItemRow; candidate: ClosetItemRow; runnerUp: ClosetItemRow | null; ax: boolean; onPick: (a: 'same' | 'new' | 'runnerUp') => void;
}) {
  // Skip trails the Yes / No row and wraps by itself when it doesn't fit; with a third answer or at the largest sizes
  // it is its own row, its 44 pt target reaching into the card's bottom padding at the default sizes.
  const ownRow = !!runnerUp || ax;
  const skip = showSkip ? (
    <View
      testID="closet-confirm-skip"
      style={ownRow ? { minHeight: 44, justifyContent: 'center', alignItems: 'flex-end', marginBottom: ax ? 0 : -12 } : { minHeight: 44, justifyContent: 'center', marginLeft: 'auto' }}
    >
      <TextLink title={t('tap.skip')} trailingIcon="next" compact onPress={next} />
    </View>
  ) : null;
  return (
    <View>
      <View style={{ gap: 3 }}>
        <View
          ref={focusRef}
          testID="closet-confirm-question"
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${a11yPrefix} ${t('closet.q.a11y', { question, item, reason })}`}
          accessibilityActions={showSkip ? [{ name: 'skip', label: t('tap.skip') }] : undefined}
          onAccessibilityAction={showSkip ? (e) => { if (e.nativeEvent.actionName === 'skip') next(); } : undefined}
          style={{ gap: 3 }}
        >
          <KText variant="subheadline" weight="600">{question}</KText>
          <KText variant="footnote" color="ink2">{reason}</KText>
        </View>
        {scoreLine ? <KText variant="footnote" color="ink3">{t('closet.q.scoreSame')}</KText> : null}
      </View>
      {ev !== undefined ? (
        <View
          style={ax ? { marginTop: 10, gap: 10, alignItems: 'stretch' } : { marginTop: 10, flexDirection: 'row', gap: 12 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {([[ev.thisPhoto, photo, t('item.dup.thisPhoto'), 'closet-confirm-photo'], [ev.inCloset, candidate, t('item.dup.inCloset'), 'closet-confirm-incloset']] as const).map(
            ([shot, it, caption, id]) => (
              <View key={id} testID={id} style={ax ? { gap: 4, alignItems: 'flex-start' } : { gap: 4, width: DECK_W }}>
                <Frame shot={shot} item={it} w={DECK_W} h={DECK_H} />
                <KText variant="caption" color="ink2" style={ax ? { alignSelf: 'stretch', textAlign: 'left' } : { textAlign: 'center' }}>{caption}</KText>
              </View>
            ),
          )}
        </View>
      ) : null}
      <ChipFlow accessibilityLabel={question} style={{ marginTop: 4 }}>
        <Chip title={t('item.dup.yes')} small onPress={() => onPick('same')} />
        <Chip title={t('item.dup.no')} small onPress={() => onPick('new')} />
        {runnerUp ? <Chip title={t('item.dup.runnerUp', { item: lower(runnerUp.name) })} small onPress={() => onPick('runnerUp')} /> : null}
        {ownRow ? null : skip}
      </ChipFlow>
      {ownRow ? skip : null}
    </View>
  );
}
