// FixRow (`.fix`, `.fix.done`) + TipLine (`.tipline`) — 03 §5 "Cards and score".
// FixRow: 26 pt badge (1.3 pt ink ring, number footnote bold) | title (callout semibold) +
// detail (footnote ink2) | gain (mono, accent: "→ 9.0"). space.fixRowV vertical padding, 12 pt gap.
// Done: badge filled ink with a surface checkmark, title ink2 (no strike-through: it read as cancelled, #246 (14)),
// detail hidden, gain shows the re-check's move ("+1.0", the pill's number) or nothing (#276). `reveal` (the score reveal, ScoreReveal.tsx) fades the gain in
// and, on a done row, fills the badge and draws its check; past its window the row is exactly the plain one. AX sizes: gain moves under the text, badge to top.
// Rule (ruling 20): at least one free fix whenever any fix exists, and the free one comes first.

import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { size, space } from '../tokens';
import { Icon } from './Icon';
import { KText } from './KText';
import { t } from '@/i18n/en';
import { stepP, type RevealStep } from './ScoreReveal';

export interface FixRowProps {
  number: number;
  title: string;
  /** "Free · it's already in your hand" */
  detail?: string;
  /** "→ 9.0" (pending) or "+1.0" (done); '' on a done row shows no number (the re-check's pill carries it, #276). */
  gain: string;
  done?: boolean;
  /** The score reveal's timeline: `gain` fades the gain text in; `badge` fills a done row's badge and draws its check. */
  reveal?: { t: SharedValue<number>; gain?: RevealStep | null; badge?: RevealStep | null };
}

export function FixRow({ number, title, detail, gain, done, reveal }: FixRowProps) {
  const { colors, isAccessibilitySize, fontScale } = useTheme();
  const badge = Math.round(size.fixBadge * Math.min(fontScale, 2));

  const spoken = done
    ? gain ? `${t('a11y.fixDone', { title })} ${t('a11y.plus', { n: gain.replace('+', '') })}.` : t('a11y.fixDone', { title })
    : `${t('a11y.fix', { n: number, title, detail: detail ? detail.replace(/ · /g, ', ') : '' }).replace(' .', '')}${gain ? ` ${t('a11y.fixGain', { score: gain.replace('→ ', '') })}` : ''}`;

  const gainText = gain ? (
    <KText role="gain" numberOfLines={1}>
      {gain}
    </KText>
  ) : null;
  const gainStep = reveal?.gain ?? (done ? reveal?.badge : null);
  const gainView = reveal && gainStep && gainText ? <FadeIn t={reveal.t} step={gainStep}>{gainText}</FadeIn> : gainText;

  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{ flexDirection: 'row', alignItems: isAccessibilitySize ? 'flex-start' : 'center', gap: 12, paddingVertical: space.fixRowV, minHeight: size.hit }}
    >
      {done && reveal?.badge ? (
        <DrawnBadge t={reveal.t} step={reveal.badge} badge={badge} />
      ) : (
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
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <KText role="fixTitle" color={done ? 'ink2' : 'ink'}>
          {title}
        </KText>
        {detail && !done ? <KText role="fixDetail">{detail}</KText> : null}
        {isAccessibilitySize ? gainView : null}
      </View>
      {isAccessibilitySize ? null : gainView}
    </View>
  );
}

function FadeIn({ t, step, children }: { t: SharedValue<number>; step: RevealStep; children: React.ReactNode }) {
  const a = useAnimatedStyle(() => ({ opacity: stepP(t.value, step) }));
  return <Animated.View style={a}>{children}</Animated.View>;
}

/** The done badge for the re-check win: the ink fill comes up, then the check is drawn left to right (a widening
 *  clip). At the end it is the plain done badge: an ink circle with the surface check. */
function DrawnBadge({ t, step, badge }: { t: SharedValue<number>; step: RevealStep; badge: number }) {
  const { colors } = useTheme();
  const fill = useAnimatedStyle(() => ({ opacity: stepP(t.value, { at: step.at, ms: step.ms * 0.4 }) }));
  const draw = useAnimatedStyle(() => ({ width: badge * stepP(t.value, { at: step.at + step.ms * 0.3, ms: step.ms * 0.7 }) }));
  return (
    <View style={{ width: badge, height: badge, borderRadius: badge / 2, borderWidth: 1.3, borderColor: colors.ink }}>
      <Animated.View style={[{ position: 'absolute', left: -1.3, top: -1.3, width: badge, height: badge, borderRadius: badge / 2, backgroundColor: colors.ink }, fill]} />
      <Animated.View style={[{ position: 'absolute', left: -1.3, top: -1.3, height: badge, overflow: 'hidden' }, draw]}>
        <View style={{ width: badge, height: badge, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={13} weight="bold" color={colors.surface} scalesWithText />
        </View>
      </Animated.View>
    </View>
  );
}

/** TipLine: 1 pt line on top (none when it opens its section), footnote ink2 text with an ink semibold lead-in ("Next level"; was copper until #276). */
export function TipLine({ lead, text, first }: { lead: string; text: string; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: colors.line, paddingTop: first ? 10 : 8, paddingBottom: 6 }} accessible accessibilityLabel={`${lead}: ${text}`}>
      <KText role="tipLine">
        <KText role="tipLead">{lead}</KText>
        {` ${text}`}
      </KText>
    </View>
  );
}
