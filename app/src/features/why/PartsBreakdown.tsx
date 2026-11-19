// The parts in "Why 7.0" (#205, #209; mockups/parts-card.html option 1): the five-part strip (label over the number,
// hairlines between, the part with the most to gain marked in ink: an up arrow and a raised cell, never copper, which
// is only for a score that moves, #231, #276), then one group per part and the rows after the
// parts, ending in the score. At accessibility sizes the strip becomes a list (label leading, number trailing).
import { View } from 'react-native';
import { Icon, KText, LedgerRow, LedgerTotal, Numeral, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { partText, type PartGroup, type StripCell, type WhyParts } from './partsRows';

const STRIP_NUMERAL = 26;
const GROUP_NUMERAL = 24;

/** The most-to-gain part: a small ink up arrow by its label (the strip's VoiceOver label says it in words). */
function GainMark({ size }: { size: number }) {
  const { colors } = useTheme();
  return <Icon name="arrow.up" size={size} color={colors.ink} weight="bold" scalesWithText />;
}

export function PartsBreakdown({ parts, score }: { parts: WhyParts; score: number }) {
  return (
    <View style={{ gap: 16 }}>
      <PartsStrip cells={parts.strip} label={parts.stripLabel} />
      <View style={{ gap: 18 }}>
        {parts.groups.map((g) => (
          <Group key={g.part} g={g} />
        ))}
      </View>
      <View>
        {parts.start ? (
          <LedgerRow testID="why-row-start" rule={parts.start.rule} valueText={parts.start.valueText} />
        ) : (
          <LedgerRow rule={t('pwhy.average')} valueText={parts.average.toFixed(1)} />
        )}
        {parts.after.map((r) => (
          <LedgerRow key={r.key} testID={`why-row-${r.key}`} rule={r.rule} item={r.item} amount={r.amount} valueText={r.valueText} zero={r.zero} />
        ))}
        <LedgerTotal score={score} note={t('why.rounded')} />
      </View>
    </View>
  );
}

function PartsStrip({ cells, label }: { cells: StripCell[]; label: string }) {
  const { colors, isAccessibilitySize } = useTheme();
  if (isAccessibilitySize) {
    return (
      <View accessible accessibilityLabel={label} style={{ borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surface2, paddingHorizontal: 14 }}>
        {cells.map((c, i) => (
          <View
            key={c.part}
            style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <KText variant="body" weight="600" color="ink" style={{ flexShrink: 1 }}>
                {c.label}
              </KText>
              {c.gain ? <GainMark size={14} /> : null}
            </View>
            <Numeral size={STRIP_NUMERAL} color={c.display === null ? colors.ink3 : undefined}>{partText(c.display)}</Numeral>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{ flexDirection: 'row', borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surface2, paddingVertical: 10 }}
    >
      {cells.map((c, i) => (
        <View
          key={c.part}
          style={{
            // 6 pt each side so the longest label ("Proportions") shrinks to fit instead of touching the hairline.
            flex: 1, minWidth: 0, alignItems: 'center', gap: 4, paddingHorizontal: 6,
            borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: colors.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, maxWidth: '100%' }}>
            <KText variant="caption" weight="600" color={c.gain ? 'ink' : 'ink2'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flexShrink: 1 }}>
              {c.label}
            </KText>
            {c.gain ? <GainMark size={10} /> : null}
          </View>
          <View style={c.gain ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 5 } : { paddingHorizontal: 6 }}>
            <Numeral size={STRIP_NUMERAL} color={c.display === null ? colors.ink3 : undefined}>{partText(c.display)}</Numeral>
          </View>
        </View>
      ))}
    </View>
  );
}

function Group({ g }: { g: PartGroup }) {
  const { colors } = useTheme();
  const spoken = g.display === null
    ? `${g.label}, ${t('pwhy.naShort')}${g.na ? `: ${g.na}` : ''}.`
    : `${g.label}, ${g.weight}, ${partText(g.display)}.`;
  return (
    <View>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={spoken}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.line }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1, flexWrap: 'wrap' }}>
          <KText variant="headline">{g.label}</KText>
          <KText variant="footnote" color="ink3" mono="small">
            {g.weight}
          </KText>
        </View>
        <Numeral size={GROUP_NUMERAL} color={g.display === null ? colors.ink3 : undefined}>{partText(g.display)}</Numeral>
      </View>
      {g.display === null ? (
        <KText role="ledgerLabel" style={{ paddingVertical: 9 }}>
          {t('pwhy.na', { reason: g.na ?? '' })}
        </KText>
      ) : (
        g.rows.map((r) => <LedgerRow key={r.key} rule={r.rule} item={r.item} amount={r.amount} valueText={r.valueText} zero={r.zero} plain />)
      )}
      {g.note ? (
        <KText role="finePrint" style={{ paddingTop: 6 }}>
          {g.note}
        </KText>
      ) : null}
    </View>
  );
}
