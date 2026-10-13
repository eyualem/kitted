// ScoreBlock (`.score-row`, `.score`, `.verdict`) + PartialLabel (`.partial-l`) + ScoreWordText.
// 03 §5 "Cards and score", §6. The numeral is always ink: never red/green, never color-only,
// and the word always shows next to it (and in the VoiceOver label).
// Layout: numeral + "/10" | 16 gap | word + verdict-or-partial. At AX sizes they stack.

import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { displayScore, scoreWordLabel, spokenScore } from '../score';
import { t } from '@/i18n/en';
import { numeralSizes } from '../typography';
import { opacity } from '../tokens';
import { Icon } from './Icon';
import { KText } from './KText';
import { Numeral } from './Numeral';

export interface ScoreBlockProps {
  score: number;
  /** One-line verdict ("Clean base. The overshirt in your hand finishes it."). */
  verdict?: string;
  /** The full partial label, e.g. t('partial.label.shoes') (replaces the verdict). */
  partialLabel?: string;
  /** The partial check was finished (shoe snap or closet pick): a check mark instead of the dashed square. */
  partialDone?: boolean;
  /** false for the "Not quite right?" preview variant. */
  showOutOf?: boolean;
  /** Override the derived word (normally leave it). */
  word?: string;
  numeralSize?: number;
  /** The card's score opens "Why" (#205): the block becomes a button with a small chevron after "/10". */
  onPress?: () => void;
}

export function ScoreBlock({ score, verdict, partialLabel, partialDone, showOutOf = true, word, numeralSize = numeralSizes.hero, onPress }: ScoreBlockProps) {
  const { isAccessibilitySize } = useTheme();
  const resolvedWord = word ?? scoreWordLabel(score);

  let label = t('a11y.score', { score: spokenScore(score), word: resolvedWord });
  if (partialLabel) label += ` ${partialLabel}.`;
  else if (verdict) label += ` ${verdict}`;

  const layout = isAccessibilitySize
    ? ({ flexDirection: 'column', alignItems: 'flex-start', gap: 8 } as const)
    : ({ flexDirection: 'row', alignItems: 'flex-end', gap: 16 } as const);
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Numeral size={numeralSize}>{displayScore(score)}</Numeral>
        {/* The tap cue (#205) rides on the "/10" line, tight after it, so it reads as part of the score and not as a
            mark floating between the numeral and the word. The row's baseline comes from the "/10" text. */}
        {showOutOf || onPress ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {showOutOf ? (
              <KText mono="value" variant="subheadline" color="ink3">
                {t('card.outOf')}
              </KText>
            ) : null}
            {onPress ? <Icon name="next" size={12} color="ink3" weight="semibold" scalesWithText /> : null}
          </View>
        ) : null}
      </View>
      <View style={{ flexShrink: 1, gap: 4, paddingBottom: isAccessibilitySize ? 0 : 4 }}>
        <KText role="scoreWord">{resolvedWord}</KText>
        {partialLabel ? (
          <PartialLabel label={partialLabel} done={partialDone} />
        ) : verdict ? (
          <KText role="verdict">{verdict}</KText>
        ) : null}
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('card.score.a11y', { score: spokenScore(score), word: resolvedWord })}
        accessibilityHint={t('card.score.hint')}
        hitSlop={{ top: 6, bottom: 6 }}
        style={({ pressed }) => [layout, { opacity: pressed ? opacity.pressed : 1 }]}
      >
        {body}
      </Pressable>
    );
  }
  return (
    <View accessible accessibilityLabel={label} style={layout}>
      {body}
    </View>
  );
}

/** "Partial check: shoes not included" with the dashed-square symbol; once finished, "Full check
 *  (shoes from your closet)" with a check mark. Always words, never just the icon. */
export function PartialLabel({ label, done }: { label: string; done?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={done ? 'checkFilled' : 'partial'} size="small" color="ink" scalesWithText />
      <KText role="partialLabel" style={{ flexShrink: 1 }}>{label}</KText>
    </View>
  );
}

/** Just the word, for rows and the share card. */
export function ScoreWordText({ score, color }: { score: number; color?: string }) {
  return <KText role="scoreWord" color={color}>{scoreWordLabel(score)}</KText>;
}
