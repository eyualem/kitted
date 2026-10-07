// FixRow (`.fix`, `.fix.done`) + TipLine (`.tipline`) — 03 §5 "Cards and score".
// FixRow: 26 pt badge (1.3 pt ink ring, number footnote bold) | title (callout semibold) +
// detail (footnote ink2) | gain (mono, accent: "→ 9.0"). 10 pt vertical padding, 12 pt gap.
// Done: badge filled ink with a surface checkmark, title ink2 struck through in ink3, detail
// hidden, gain shows the raw delta ("+0.75"). AX sizes: gain moves under the text, badge to top.
// Rule (ruling 20): at least one free fix whenever any fix exists, and the free one comes first.

import { View } from 'react-native';
import { useTheme } from '../theme';
import { size } from '../tokens';
import { Icon } from './Icon';
import { KText } from './KText';

export interface FixRowProps {
  number: number;
  title: string;
  /** "Free · it's already in your hand" */
  detail?: string;
  /** "→ 9.0" (pending) or "+0.75" (done) */
  gain: string;
  done?: boolean;
}

export function FixRow({ number, title, detail, gain, done }: FixRowProps) {
  const { colors, isAccessibilitySize, fontScale } = useTheme();
  const badge = Math.round(size.fixBadge * Math.min(fontScale, 2));

  const spoken = done
    ? `Done: ${title}. Gained ${gain.replace('+', 'plus ')}.`
    : `Fix ${number}: ${title}.${detail ? ` ${detail.replace(/ · /g, ', ')}.` : ''} Score goes to ${gain.replace('→ ', '')}.`;

  const gainView = (
    <KText role="gain" numberOfLines={1}>
      {gain}
    </KText>
  );

  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{ flexDirection: 'row', alignItems: isAccessibilitySize ? 'flex-start' : 'center', gap: 12, paddingVertical: 10, minHeight: size.hit }}
    >
      <View
        style={{
          width: badge,
          height: badge,
          borderRadius: badge / 2,
          borderWidth: 1.3,
          borderColor: colors.ink,
          backgroundColor: done ? colors.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? <Icon name="check" size={13} weight="bold" color={colors.surface} scalesWithText /> : <KText role="fixBadge">{String(number)}</KText>}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <KText
          role="fixTitle"
          color={done ? 'ink2' : 'ink'}
          style={done ? { textDecorationLine: 'line-through', textDecorationColor: colors.ink3 } : undefined}
        >
          {title}
        </KText>
        {detail && !done ? <KText role="fixDetail">{detail}</KText> : null}
        {isAccessibilitySize ? gainView : null}
      </View>
      {isAccessibilitySize ? null : gainView}
    </View>
  );
}

/** TipLine: 1 pt line on top, footnote ink2 text with a copper semibold lead-in ("Next level"). */
export function TipLine({ lead, text }: { lead: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, paddingBottom: 6 }} accessible accessibilityLabel={`${lead}: ${text}`}>
      <KText role="tipLine">
        <KText role="tipLead">{lead}</KText>
        {` ${text}`}
      </KText>
    </View>
  );
}
