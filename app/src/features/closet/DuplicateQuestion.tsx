// "Is this your grey Nike hoodie?" (#117; was "Same as your …?", 02 S11 / #91): asked on the score card right after
// the rating and in Closet's "To confirm". Picture first: this photo cropped to the piece (outlined, the rest dimmed)
// next to the piece in his closet (its best earlier photo, else its drawing), one plain reason, and on his first
// few questions "Your score stays the same either way." Yes, same one · No, a new one · It's my {runner-up}. Until
// he answers both stay separate pieces (a duplicate does less harm than a wrong merge). Answered: one line, "Change".
import { useState } from 'react';
import { View } from 'react-native';
import { Chip, ChipFlow, KText, TextLink, useTheme } from '@/design-system';
import type { ClosetAsk, ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';
import { askQuestionText, askReasonText, isPluralPiece } from './askText';
import { SCORE_LINE_UNTIL, useAskEvidence, type Shot } from './askEvidence';
import { ClosetTile } from './ClosetTile';
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
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

function Frame({ shot, item, w, h }: { shot: Shot | null; item: ClosetItemRow; w: number; h: number }) {
  if (shot) return <SightingCrop source={shot.photo.source} aspect={shot.photo.aspect} box={shot.box} top={shot.top} mirrored={shot.mirrored} width={w} height={h} radius={14} />;
  return <ClosetTile item={item} size={w} aspect={h / w} radius={14} scale={0.7} decorative />;
}

export function DuplicateQuestion({ ask, photo, candidate, runnerUp, onAnswer, compact }: DuplicateQuestionProps) {
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
