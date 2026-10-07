// KText — the only way to put SF Pro / SF Mono text on screen.
// Applies the iOS text style (size, leading, weight), the matching dynamicTypeRamp so it scales
// on Apple's curve, Bold Text, the role's color, and the mono / tabular options.
//
// Font-scaling policy (03 §3.1, principle 3):
// - Reading text and control labels: allowFontScaling (default), NO maxFontSizeMultiplier cap,
//   so everything reaches AX5. Layouts must reflow (use theme.isAccessibilitySize).
// - Score numerals: <Numeral> caps at 1.6×. Wordmark, share card, countdown: no scaling.

import type { ReactNode } from 'react';
import { Text, type AccessibilityRole, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import {
  boldTextWeight,
  MONO_UPPERCASE_AT_NORMAL_SIZES,
  monoFamily,
  monoLabel,
  monoSmall,
  monoValue,
  roles,
  textStyles,
  type InkColor,
  type RoleName,
  type TextRole,
  type Variant,
  type Weight,
} from '../typography';

export interface KTextProps {
  children?: ReactNode;
  /** A role from the 03 §3.2 role map. Explicit props below override it. */
  role?: RoleName;
  variant?: Variant;
  weight?: Weight;
  /** A token name, or a literal color (fixed-dark surfaces). */
  color?: InkColor | (string & {});
  mono?: TextRole['mono'];
  tabular?: boolean;
  italic?: boolean;
  /** Mono labels only: honours MONO_UPPERCASE_AT_NORMAL_SIZES. */
  monoCase?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessible?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityElementsHidden?: boolean;
  onPress?: () => void;
}

export function KText(props: KTextProps) {
  const theme = useTheme();
  const role: TextRole | undefined = props.role ? roles[props.role] : undefined;
  const variant = props.variant ?? role?.variant ?? 'body';
  const spec = textStyles[variant];
  const mono = props.mono ?? role?.mono;
  const monoSpec = mono === 'label' ? monoLabel : mono === 'value' ? monoValue : mono === 'small' ? monoSmall : undefined;

  const baseWeight: Weight = props.weight ?? role?.weight ?? monoSpec?.fontWeight ?? spec.fontWeight;
  const weight = theme.a11y.boldText ? boldTextWeight(baseWeight) : baseWeight;

  const colorKey = props.color ?? role?.color ?? 'ink';
  const color = colorKey in theme.colors ? theme.colors[colorKey as InkColor] : colorKey;

  const upper =
    mono === 'label' && props.monoCase !== false && MONO_UPPERCASE_AT_NORMAL_SIZES && !theme.isAccessibilitySize;

  const style: TextStyle = {
    color,
    fontSize: monoSpec?.fontSize ?? spec.fontSize,
    lineHeight: monoSpec?.lineHeight ?? spec.lineHeight,
    fontWeight: weight,
    ...(monoSpec ? { fontFamily: monoFamily } : null),
    ...((props.tabular ?? role?.tabular) ? { fontVariant: ['tabular-nums'] } : null),
    ...((props.italic ?? role?.italic) ? { fontStyle: 'italic' } : null),
    ...(upper ? { textTransform: 'uppercase', letterSpacing: 1 } : null),
  };

  // Uppercase is display-only: VoiceOver reads the sentence-case string.
  const a11yLabel =
    props.accessibilityLabel ?? (upper && typeof props.children === 'string' ? props.children : undefined);

  return (
    <Text
      style={[style, props.style]}
      dynamicTypeRamp={monoSpec?.ramp ?? spec.ramp}
      allowFontScaling={props.allowFontScaling ?? true}
      maxFontSizeMultiplier={props.maxFontSizeMultiplier}
      numberOfLines={props.numberOfLines}
      accessibilityRole={props.accessibilityRole}
      accessibilityLabel={a11yLabel}
      accessible={props.accessible}
      importantForAccessibility={props.importantForAccessibility}
      accessibilityElementsHidden={props.accessibilityElementsHidden}
      onPress={props.onPress}
    >
      {props.children}
    </Text>
  );
}
