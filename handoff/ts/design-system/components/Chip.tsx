// Chip (`.chip`, `.chip.on`, `.chip.ac`, `.chip.sm`) + ChipFlow (`.chips`) + Pill (`.pill`).
// 03 §5 "Chips, pills and buttons".
// Chip: 34 pt capsule (32 small), 14 pt side padding (10 small), subheadline medium, optional
// leading symbol, 6 pt gap. 5 pt of invisible padding above and below makes the 44 pt hit area
// part of the LAYOUT (like the SwiftUI version), so ChipFlow uses rowGap 0 and the visible
// gap between rows is 10. Selected = ink fill + "selected" state for VoiceOver (not color alone).

import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { opacity, size, space } from '../tokens';
import type { SymKey } from '../symbols';
import { Icon, type SymbolName } from './Icon';
import { KText } from './KText';

export type ChipState = 'normal' | 'selected' | 'accent';

export interface ChipProps {
  title: string;
  state?: ChipState;
  small?: boolean;
  icon?: SymKey | SymbolName;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
}

export function Chip({ title, state = 'normal', small, icon, disabled, onPress, accessibilityHint }: ChipProps) {
  const { colors } = useTheme();
  const h = small ? size.chipSmall : size.chip;
  const fg = state === 'selected' ? colors.surface : state === 'accent' ? colors.accent : colors.ink;
  const bg = state === 'selected' ? colors.ink : state === 'accent' ? colors.accentSoft : colors.surface;
  const border = state === 'selected' ? colors.ink : state === 'accent' ? colors.accent : colors.line;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: state === 'selected', disabled: !!disabled }}
      style={({ pressed }) => ({
        paddingVertical: (size.hit - h) / 2,
        opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : 1,
        maxWidth: '100%',
      })}
    >
      <View
        style={{
          minHeight: h,
          paddingHorizontal: small ? 10 : 14,
          borderRadius: h / 2,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {icon ? <Icon name={icon} size="small" color={fg} scalesWithText /> : null}
        <KText role="chip" variant={small ? 'subheadline' : undefined} weight={small ? '400' : undefined} color={fg} numberOfLines={1}>
          {title}
        </KText>
      </View>
    </Pressable>
  );
}

export interface ChipFlowProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for the group ("Occasion"). */
  accessibilityLabel?: string;
}

/**
 * Wrapping chip layout: flexWrap with an 8 pt column gap and 0 row gap (the chips carry their
 * own hit padding). At accessibility sizes it becomes a vertical stack (02 §4).
 * Horizontal scroll rows (Closet filter, quick-starts) use a horizontal ScrollView instead.
 */
export function ChipFlow({ children, style, accessibilityLabel }: ChipFlowProps) {
  const { isAccessibilitySize } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        isAccessibilitySize
          ? { flexDirection: 'column', alignItems: 'flex-start' }
          : { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.rowGap, rowGap: 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type PillTone = 'gray' | 'accent' | 'ok' | 'pending';

/** Pill: a 26 pt label capsule (22 inline). Labels, not buttons. `ok` always carries a checkmark. */
export function Pill({ title, tone = 'gray', inline }: { title: string; tone?: PillTone; inline?: boolean }) {
  const { colors } = useTheme();
  const h = inline ? size.pillInline : size.pill;
  const fg = tone === 'accent' ? colors.accent : tone === 'ok' ? colors.good : tone === 'pending' ? colors.ink3 : colors.ink2;
  const bg = tone === 'accent' ? colors.accentSoft : tone === 'ok' ? 'transparent' : colors.surface2;
  return (
    <View
      style={{
        minHeight: h,
        paddingHorizontal: 10,
        borderRadius: h / 2,
        borderCurve: 'continuous',
        backgroundColor: bg,
        borderWidth: tone === 'ok' ? 1 : 0,
        borderColor: colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
      }}
    >
      {tone === 'ok' ? <Icon name="check" size={13} color={fg} weight="semibold" scalesWithText /> : null}
      <KText role="pill" variant={inline ? 'caption' : 'footnote'} color={fg} numberOfLines={1}>
        {tone === 'pending' ? `${title}…` : title}
      </KText>
    </View>
  );
}
