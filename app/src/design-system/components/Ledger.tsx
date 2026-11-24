// Ledger rows for "Why this score" (`.ledger`, sheet 8) — 03 §5.
// Row: label (subheadline ink2, rule name ink semibold: "Elevated piece · tan chinos") | value
// (mono, trailing). 9 pt vertical padding, 1 pt line bottom border. First row: "Everyone starts
// at 7.0". Values: "+0.5" good, "−0.5" ink2 (the "−" carries it; copper is only score movement, #231;
// never red), "+0"/"±0" ink.
// Total: "Your score" (headline) + footnote ink3 note | 52 pt Archivo numeral + "/10".
// VoiceOver speaks the sign ("plus 0.5"), so color is never the only cue.

import { View } from 'react-native';
import { useTheme } from '../theme';
import { displayScore, spokenScore } from '../score';
import { t } from '@/i18n/en';
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
  /** Literal value text instead of `amount` (e.g. "7.0" on the first row, "—" not rated). */
  valueText?: string;
  /** How a 0 reads: "+0" for an unearned credit (default), "±0" for the occasion/partial rows. */
  zero?: 'plus' | 'plusMinus';
  /** For the UI inventory (the Why rows); no visual change. */
  testID?: string;
  /** A reason sentence (the parts groups): regular weight, not a rule name. */
  plain?: boolean;
}

function formatAmount(n: number, zero: 'plus' | 'plusMinus'): string {
  if (n === 0) return zero === 'plus' ? '+0' : '±0';
  const abs = Math.round(Math.abs(n) * 100) / 100; // 0.09999999999999964 → 0.1
  const s = Number.isInteger(abs) ? abs.toFixed(0) : String(abs);
  return n > 0 ? `+${s}` : `−${s}`; // U+2212 minus sign, like the mockup
}

function spokenAmount(n: number): string {
  if (n === 0) return t('a11y.noChange');
  return t(n > 0 ? 'a11y.plus' : 'a11y.minus', { n: Math.round(Math.abs(n) * 100) / 100 });
}

export function LedgerRow({ rule, item, amount, valueText, zero = 'plus', plain, testID }: LedgerRowProps) {
  const { colors, isAccessibilitySize } = useTheme();
  const value = valueText ?? (amount !== undefined ? formatAmount(amount, zero) : '');
  const valueColor = amount === undefined || amount === 0 ? 'ink' : amount > 0 ? 'good' : 'ink2';
  const said = valueText === '—' ? t('a11y.notRated') : (valueText ?? (amount !== undefined ? spokenAmount(amount) : undefined));
  const spoken = [rule, item, said].filter(Boolean).join(', ') + '.';
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      testID={testID}
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
        {plain ? <KText role="ledgerLabel" color="ink">{rule}</KText> : <KText role="ledgerRule">{rule}</KText>}
        {item ? ` · ${item}` : ''}
      </KText>
      <KText role="ledgerValue" color={valueColor} numberOfLines={1} style={{ flexShrink: 0 }}>
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
      accessibilityLabel={t('a11y.ledgerTotal', { score: spokenScore(score), note: note ? `${note}.` : '' }).trim()}
      style={{
        flexDirection: isAccessibilitySize ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isAccessibilitySize ? 'flex-start' : 'flex-end',
        gap: 8,
        paddingTop: 13,
      }}
    >
      <View style={{ flexShrink: 1, gap: 2 }}>
        <KText role="ledgerTotal">{t('why.total')}</KText>
        {note ? <KText role="finePrint">{note}</KText> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Numeral size={numeralSizes.ledgerTotal}>{displayScore(score)}</Numeral>
        <KText mono="value" variant="subheadline" color="ink3">
          {t('card.outOf')}
        </KText>
      </View>
    </View>
  );
}
