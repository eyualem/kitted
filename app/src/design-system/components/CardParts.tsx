// Card pieces P2 adds (02 D7, D10, D11, D12; design-spec.md A): AddedRow, DeltaRow,
// QuickStartChip, FinishTile. Measurements from the mockup CSS (1 CSS px = 1 pt).

import { Pressable, View } from 'react-native';
import { t } from '@/i18n/en';
import { useTheme } from '../theme';
import { opacity, size } from '../tokens';
import { displayScore } from '../score';
import { GarmentIcon, type GarmentIconType } from './GarmentIcon';
import { Icon } from './Icon';
import { TextLink } from './KButton';
import { KText } from './KText';
import { Numeral } from './Numeral';
import { Pill } from './Chip';
import type { SymKey } from '../symbols';

/** "Added 4 to Closet" (`.added`): up to 4 overlapping 28 pt thumbs, text, "Review" link. */
export function AddedRow({ items, count, onReview }: { items: { type: GarmentIconType; hex: string }[]; count: number; onReview?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {items.slice(0, 4).map((it, i) => (
          <View
            key={i}
            style={{
              width: 28, height: 28, borderRadius: 8, borderCurve: 'continuous', backgroundColor: colors.surface2, borderWidth: 1.5,
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
        <View style={{ marginLeft: 'auto' }}>
          <TextLink title={t('card.review')} onPress={onReview} compact />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Re-check delta (`.delta`): the old score (Archivo Medium 44, ink3, struck with a 1.5 pt bar),
 * a copper chevron, the new score (76) + "/10", and the "+1.0" pill pushed right.
 */
export function DeltaRow({ was, now }: { was: number; now: number }) {
  const { colors } = useTheme();
  const delta = now - was;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      <View style={{ marginBottom: 4 }}>
        <Numeral size={44} face="scoreLight" color={colors.ink3}>
          {displayScore(was)}
        </Numeral>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 12, height: 1.5, backgroundColor: colors.ink3 }} />
      </View>
      <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }}>
        <Icon name="next" size={20} color="accent" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Numeral size={76}>{displayScore(now)}</Numeral>
        <KText mono="value" variant="subheadline" color="ink3">
          {t('card.outOf')}
        </KText>
      </View>
      {delta > 0 ? (
        <View style={{ marginLeft: 'auto', marginBottom: 4 }}>
          <Pill title={`+${delta.toFixed(1)}`} tone="accent" />
        </View>
      ) : null}
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
        height: 34, paddingHorizontal: 13, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 8,
        opacity: pressed ? opacity.pressed : 1,
      })}
    >
      <Icon name={icon} size="regular" color="ink2" />
      <KText role="quickStart">{title}</KText>
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
        width: size.hit, height: size.hit, borderRadius: 12, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.line,
        backgroundColor: filled ? colors.surface2 : colors.surface, alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? opacity.pressed : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
