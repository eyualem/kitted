// Ledger rows for "Why this score" (`.ledger`, sheet 8) — 03 §5.
// Row: label (subheadline ink2, rule name ink semibold: "Elevated piece · tan chinos") | value
// (mono, trailing). 9 pt vertical padding, 1 pt line bottom border. First row: "Everyone starts
// at 7.0". Values: "+0.5" good, "−0.5" accent (copper, never red), "+0"/"±0" ink.
// Total: "Your score" (headline) + footnote ink3 note | 52 pt Archivo numeral + "/10".
// VoiceOver speaks the sign ("plus 0.5"), so color is never the only cue.

import { View } from 'react-native';
import { useTheme } from '../theme';
import { displayScore, scoreWord, spokenScore } from '../score';
import { numeralSizes } from '../typography';
import { KText } from './KText';
import { Numeral } from './Numeral';

export interface LedgerRowProps {
  /** "Elevated piece" (ink semibold). */
  rule: string;
  /** "tan chinos" (ink2). Optional. */
  item?: string;
  /** Signed amount as a number (+0.5, -0.5, 0). Rendered "+0.5", "−0.5", "±0". */
  amount?: number;
  /** Literal value text instead of `amount` (e.g. "7.0" on the first row). */
  valueText?: string;
}

function formatAmount(n: number): string {
  if (n === 0) return '±0';
  const abs = Math.abs(n);
  const s = Number.isInteger(abs) ? abs.toFixed(0) : String(abs);
  return n > 0 ? `+${s}` : `−${s}`; // U+2212 minus sign, like the mockup
}

function spokenAmount(n: number): string {
  if (n === 0) return 'no change';
  return `${n > 0 ? 'plus' : 'minus'} ${Math.abs(n)}`;
}

export function LedgerRow({ rule, item, amount, valueText }: LedgerRowProps) {
  const { colors, isAccessibilitySize } = useTheme();
  const value = valueText ?? (amount !== undefined ? formatAmount(amount) : '');
  const valueColor = amount === undefined || amount === 0 ? 'ink' : amount > 0 ? 'good' : 'accent';
  const spoken = [rule, item, valueText ?? (amount !== undefined ? spokenAmount(amount) : undefined)].filter(Boolean).join(', ') + '.';
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{
        flexDirection: isAccessibilitySize ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isAccessibilitySize ? 'flex-start' : 'center',
        gap: isAccessibilitySize ? 2 : 13,
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <KText role="ledgerLabel" style={{ flexShrink: 1 }}>
        <KText role="ledgerRule">{rule}</KText>
        {item ? ` · ${item}` : ''}
      </KText>
      <KText role="ledgerValue" color={valueColor} numberOfLines={1}>
        {value}
      </KText>
    </View>
  );
}

export interface LedgerTotalProps {
  score: number;
  /** "No mistakes found" */
  note?: string;
}

export function LedgerTotal({ score, note }: LedgerTotalProps) {
  const { isAccessibilitySize } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Your score: ${spokenScore(score)} out of 10, ${scoreWord(score)}.${note ? ` ${note}.` : ''}`}
      style={{
        flexDirection: isAccessibilitySize ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isAccessibilitySize ? 'flex-start' : 'flex-end',
        gap: 8,
        paddingTop: 13,
      }}
    >
      <View style={{ flexShrink: 1, gap: 2 }}>
        <KText role="ledgerTotal">Your score</KText>
        {note ? <KText role="finePrint">{note}</KText> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Numeral size={numeralSizes.ledgerTotal}>{displayScore(score)}</Numeral>
        <KText mono="value" variant="subheadline" color="ink3">
          /10
        </KText>
      </View>
    </View>
  );
}
