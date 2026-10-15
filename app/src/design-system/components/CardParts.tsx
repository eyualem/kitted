// Card pieces P2 adds (02 D7, D10, D11, D12; design-spec.md A): AddedRow, DeltaRow,
// QuickStartChip, FinishTile. Measurements from the mockup CSS (1 CSS px = 1 pt).

import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { t } from '@/i18n/en';
import { deltaPill } from '@/i18n/format';
import { useTheme } from '../theme';
import { CONTROL_TEXT_MAX_SCALE, opacity, radius, size } from '../tokens';
import { displayScore } from '../score';
import { GarmentIcon, type GarmentIconType } from './GarmentIcon';
import { Icon } from './Icon';
import { TextLink } from './KButton';
import { KText } from './KText';
import { Numeral } from './Numeral';
import { Pill } from './Chip';
import { stepP, TapeNumeral, useOutOfStyle, type RevealStep } from './ScoreReveal';
import type { SymKey } from '../symbols';

/** "Added 4 to Closet" (`.added`): up to 4 overlapping 28 pt thumbs, text, "Review" link. */
export function AddedRow({ items, count, onReview }: { items: { type: GarmentIconType; hex: string }[]; count: number; onReview?: () => void }) {
  const { colors, isAccessibilitySize } = useTheme();
  // AX sizes: thumbs, then the text, then Review, each on its own line (no mid-word breaks).
  return (
    <View style={isAccessibilitySize ? { gap: 6, alignItems: 'flex-start' } : { flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {items.slice(0, 4).map((it, i) => (
          <View
            key={i}
            style={{
              width: 28, height: 28, borderRadius: radius.thumb, borderCurve: 'continuous', backgroundColor: colors.surface2, borderWidth: 1.5,
              borderColor: colors.surface, marginLeft: i === 0 ? 0 : -8, zIndex: i, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <GarmentIcon type={it.type} color={it.hex} size={24} />
          </View>
        ))}
      </View>
      <KText role="addedRow" style={{ flexShrink: 1 }}>
        {t('card.added', { n: count })}
      </KText>
      {onReview ? (
        <View style={isAccessibilitySize ? undefined : { marginLeft: 'auto' }}>
          <TextLink title={t('card.review')} onPress={onReview} compact />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Re-check delta (`.delta`): the old score (Archivo Medium 44, ink3, struck with a 1.5 pt bar),
 * a copper arrow on a win (score movement, #231; a chevron read as "greater than"), the new score (76) + "/10", and the "+1.0"
 * pill pushed right. `reveal` plays the re-check win (ScoreReveal.tsx, features/fitcheck/reveal.ts winPlan): the old
 * score starts at the full numeral size in ink and shrinks into place, the arrow slides in, the new score arrives on
 * the tape, and the pill springs in. Past its end it is exactly the plain row. Copper only when the score went up
 * (#231, #276): a drop or a score that held gets an ink arrow and no pill, and a score that held isn't struck.
 */
export function DeltaRow({ was, now, reveal }: { was: number; now: number; reveal?: DeltaReveal }) {
  const { colors } = useTheme();
  const delta = now - was;
  const changed = delta !== 0;
  const rv = reveal;
  const arrowStyle = useAnimatedStyle(() => {
    if (!rv) return {};
    const p = stepP(rv.t.value, rv.arrow);
    return { opacity: p, transform: [{ translateX: rv.arrow.dx * (1 - p) }] };
  });
  const strikeStyle = useAnimatedStyle(() => (rv ? { opacity: stepP(rv.t.value, rv.strike) } : {}));
  const outOfStyle = useOutOfStyle(rv?.t, rv ? (rv.tape ? rv.lock : rv.swap ?? rv.lock) : null, 0);
  const pillStyle = useAnimatedStyle(() => {
    if (!rv) return {};
    if (!rv.pillSpring) return { opacity: stepP(rv.t.value, rv.swap ?? rv.lock) };
    const p = rv.pill.value;
    return { opacity: Math.min(1, Math.max(0, p * 2)), transform: [{ scale: 0.6 + 0.4 * p }] };
  });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      <View style={{ marginBottom: 4 }}>
        {rv?.shrink ? (
          <ShrinkingWas t={rv.t} step={rv.shrink} text={displayScore(was)} />
        ) : (
          <Numeral size={44} face="scoreLight" color={colors.ink3}>
            {displayScore(was)}
          </Numeral>
        )}
        {changed ? (
          <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 12, height: 1.5, backgroundColor: colors.ink3 }, rv ? strikeStyle : null]} />
        ) : null}
      </View>
      <Animated.View style={[{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }, rv ? arrowStyle : null]}>
        <Icon name="arrow.right" size={20} color={delta > 0 ? 'accent' : 'ink2'} weight="semibold" />
      </Animated.View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        {rv ? (
          <TapeNumeral t={rv.t} score={now} values={rv.values} size={76} tape={rv.tape} swap={rv.swap} lock={rv.lock} noDash />
        ) : (
          <Numeral size={76}>{displayScore(now)}</Numeral>
        )}
        {rv ? (
          <Animated.View style={outOfStyle}>
            <KText mono="value" variant="subheadline" color="ink3">
              {t('card.outOf')}
            </KText>
          </Animated.View>
        ) : (
          <KText mono="value" variant="subheadline" color="ink3">
            {t('card.outOf')}
          </KText>
        )}
      </View>
      {delta > 0 ? (
        <Animated.View style={[{ marginLeft: 'auto', marginBottom: 4 }, rv ? pillStyle : null]}>
          <Pill title={deltaPill(delta)} tone="accent" />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** The re-check win's timeline for DeltaRow (reveal.ts winPlan plus the tape's values and the pill's spring). */
export interface DeltaReveal {
  t: SharedValue<number>;
  values: readonly number[];
  shrink: RevealStep | null;
  strike: RevealStep;
  arrow: RevealStep & { dx: number };
  tape: RevealStep | null;
  swap: RevealStep | null;
  lock: RevealStep;
  pillSpring: boolean;
  /** 0 → 1 with a spring at the lock (the caller runs it). */
  pill: SharedValue<number>;
}

/** 44 / 76: the old score's final size against the full numeral. */
const WAS_SCALE = 44 / 76;

/** The old score: drawn at the full 76 pt (crisp) and scaled down into the 44 pt box from its bottom-left (its
 *  baseline stays put), ink fading to ink3; at the end the real 44 pt numeral takes over. The 76 pt copy gets its own
 *  width: inside the 44 pt box it would wrap ("8." with the 0 cut off). */
function ShrinkingWas({ t, step, text }: { t: SharedValue<number>; step: RevealStep; text: string }) {
  const { colors } = useTheme();
  const big = useAnimatedStyle(() => {
    const p = stepP(t.value, step);
    const e = 1 - (1 - p) * (1 - p) * (1 - p);
    return { opacity: p >= 1 ? 0 : 1, transform: [{ scale: 1 + (WAS_SCALE - 1) * e }] };
  });
  const ink = useAnimatedStyle(() => ({ opacity: 1 - stepP(t.value, step) }));
  const real = useAnimatedStyle(() => ({ opacity: stepP(t.value, step) >= 1 ? 1 : 0 }));
  return (
    <View>
      <Animated.View style={real}>
        <Numeral size={44} face="scoreLight" color={colors.ink3}>{text}</Numeral>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, bottom: 0, width: 200, transformOrigin: 'left bottom' }, big]}>
        <Numeral size={76} face="scoreLight" color={colors.ink3}>{text}</Numeral>
        <Animated.View style={[{ position: 'absolute', left: 0, bottom: 0 }, ink]}>
          <Numeral size={76} face="scoreLight" color={colors.ink}>{text}</Numeral>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Quick-start chip on Stylist home (`.qc`): 34 tall, icon 20 ink2, subheadline semibold. */
export function QuickStartChip({ title, icon, onPress }: { title: string; icon: SymKey; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={{ top: 5, bottom: 5 }}
      style={({ pressed }) => ({
        minHeight: 34, paddingHorizontal: 13, paddingVertical: 4, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 8,
        opacity: pressed ? opacity.pressed : 1,
      })}
    >
      <Icon name={icon} size="regular" color="ink2" />
      <KText role="quickStart" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>{title}</KText>
    </Pressable>
  );
}

/** A 44 pt tile button in the partial card's finish row (`.pk`). */
export function FinishTile({ children, label, onPress, filled }: { children: React.ReactNode; label: string; onPress?: () => void; filled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: size.hit, height: size.hit, borderRadius: radius.thumb, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.line,
        backgroundColor: filled ? colors.surface2 : colors.surface, alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? opacity.pressed : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
