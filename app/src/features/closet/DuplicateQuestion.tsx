// "Same as your khaki chinos?" (02 S11, #91): the piece from this photo next to the one in his closet, and
// Yes, same one · No, a new one · It's my {runner-up}. Until he answers, both stay as separate pieces (a
// duplicate does less harm than a wrong merge). Answered: one line and "Change" (re-answerable).
import { useState } from 'react';
import { View } from 'react-native';
import { Chip, ChipFlow, KText, TextLink, useTheme } from '@/design-system';
import type { ClosetAsk, ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';
import { artSpec } from './artSpec';
import { ClosetTile } from './ClosetTile';

export interface DuplicateQuestionProps {
  ask: ClosetAsk;
  /** The piece as this photo shows it (the new, flagged item). */
  photo: ClosetItemRow;
  candidate: ClosetItemRow;
  runnerUp?: ClosetItemRow | null;
  onAnswer: (a: 'same' | 'new' | 'runnerUp') => void;
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export function DuplicateQuestion({ ask, photo, candidate, runnerUp, onAnswer }: DuplicateQuestionProps) {
  const { isAccessibilitySize } = useTheme();
  const [changing, setChanging] = useState(false);
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
  const tile = isAccessibilitySize ? 88 : 64;
  const question = t('item.q.duplicate', { item: lower(candidate.name) });
  const answer = (a: 'same' | 'new' | 'runnerUp') => {
    setChanging(false);
    onAnswer(a);
  };
  return (
    <View style={{ gap: 10 }}>
      <KText variant="subheadline" weight="600" accessibilityRole="header"
        accessibilityLabel={t('item.dup.a11y', { item: lower(candidate.name), photo: artSpec(photo).a11y, closet: artSpec(candidate).a11y })}>
        {question}
      </KText>
      {/* Side by side; at the largest text sizes each tile gets its own row with the caption beside it. */}
      <View style={isAccessibilitySize ? { gap: 10 } : { flexDirection: 'row', gap: 12 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {([[photo, t('item.dup.thisPhoto')], [candidate, t('item.dup.inCloset')]] as const).map(([it, caption]) => (
          <View key={caption} style={isAccessibilitySize ? { flexDirection: 'row', alignItems: 'center', gap: 12 } : { alignItems: 'center', gap: 4, width: Math.max(tile, 84) }}>
            <ClosetTile item={it} size={tile} radius={14} scale={0.78} decorative />
            <KText variant="caption" color="ink2" style={isAccessibilitySize ? { flex: 1 } : { textAlign: 'center' }}>{caption}</KText>
          </View>
        ))}
      </View>
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
