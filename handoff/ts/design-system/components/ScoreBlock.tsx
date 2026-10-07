// ScoreBlock (`.score-row`, `.score`, `.verdict`) + PartialLabel (`.partial-l`) + ScoreWordText.
// 03 §5 "Cards and score", §6. The numeral is always ink: never red/green, never color-only,
// and the word always shows next to it (and in the VoiceOver label).
// Layout: numeral + "/10" | 16 gap | word + verdict-or-partial. At AX sizes they stack.

import { View } from 'react-native';
import { useTheme } from '../theme';
import { displayScore, scoreWord, spokenScore } from '../score';
import { numeralSizes } from '../typography';
import { Icon } from './Icon';
import { KText } from './KText';
import { Numeral } from './Numeral';

export interface ScoreBlockProps {
  score: number;
  /** One-line verdict ("Clean base. The overshirt in your hand finishes it."). */
  verdict?: string;
  /** e.g. "shoes not included" → "Partial check: shoes not included" (replaces the verdict). */
  partialMissing?: string;
  /** false for the "Not quite right?" preview variant. */
  showOutOf?: boolean;
  /** Override the derived word (normally leave it). */
  word?: string;
  numeralSize?: number;
}

export function ScoreBlock({ score, verdict, partialMissing, showOutOf = true, word, numeralSize = numeralSizes.hero }: ScoreBlockProps) {
  const { isAccessibilitySize } = useTheme();
  const resolvedWord = word ?? scoreWord(score);

  let label = `Score ${spokenScore(score)} out of 10, ${resolvedWord}.`;
  if (partialMissing) label += ` Partial check: ${partialMissing}.`;
  else if (verdict) label += ` ${verdict}`;

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={
        isAccessibilitySize
          ? { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }
          : { flexDirection: 'row', alignItems: 'flex-end', gap: 16 }
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Numeral size={numeralSize}>{displayScore(score)}</Numeral>
        {showOutOf ? (
          <KText mono="value" variant="subheadline" color="ink3">
            /10
          </KText>
        ) : null}
      </View>
      <View style={{ flexShrink: 1, gap: 4, paddingBottom: isAccessibilitySize ? 0 : 4 }}>
        <KText role="scoreWord">{resolvedWord}</KText>
        {partialMissing ? (
          <PartialLabel missing={partialMissing} />
        ) : verdict ? (
          <KText role="verdict">{verdict}</KText>
        ) : null}
      </View>
    </View>
  );
}

/** "Partial check: shoes not included" with the dashed-square symbol. Always words, never just the icon. */
export function PartialLabel({ missing }: { missing: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name="partial" size="small" color="ink" scalesWithText />
      <KText role="partialLabel" style={{ flexShrink: 1 }}>{`Partial check: ${missing}`}</KText>
    </View>
  );
}

/** Just the word, for rows and the share card. */
export function ScoreWordText({ score, color }: { score: number; color?: string }) {
  return <KText role="scoreWord" color={color}>{scoreWord(score)}</KText>;
}
