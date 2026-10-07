// MonoLabel (`.tagline` text, `.intent-l`, `.sub .k`) + TagLine (the card header row).
// SF Mono (RN 'ui-monospace') 12 pt medium, scales, SENTENCE CASE by default (ruling 29;
// typography.MONO_UPPERCASE_AT_NORMAL_SIZES brings back the mockup's uppercase), ink3.
// Nothing in mono is below 12 pt.

import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { KText } from './KText';
import type { InkColor } from '../typography';

export function MonoLabel({ children, color = 'ink3' }: { children: string; color?: InkColor | (string & {}) }) {
  return (
    <KText role="monoLabel" color={color}>
      {children}
    </KText>
  );
}

export interface TagLineProps {
  /** "Fit check · Full" */
  left: string;
  /** "Date" (ink2). */
  right?: string;
  /** Makes the right side a button (e.g. "Everyday ▾" opens the occasion picker). */
  onPressRight?: () => void;
  /** Spoken form, e.g. "Fit check, full. Occasion: Date. Double-tap to change." */
  accessibilityLabel?: string;
}

export function TagLine({ left, right, onPressRight, accessibilityLabel }: TagLineProps) {
  const { isAccessibilitySize } = useTheme();
  const spoken = accessibilityLabel ?? [left.replace(/ · /g, ', '), right].filter(Boolean).join('. ');
  const rightText = right ? <MonoLabel color="ink2">{right}</MonoLabel> : null;
  return (
    <View
      accessible={!onPressRight}
      accessibilityLabel={onPressRight ? undefined : spoken}
      style={
        isAccessibilitySize
          ? { flexDirection: 'column', gap: 2 }
          : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }
      }
    >
      <MonoLabel>{left}</MonoLabel>
      {onPressRight && rightText ? (
        <Pressable onPress={onPressRight} hitSlop={12} accessibilityRole="button" accessibilityLabel={spoken} accessibilityHint="Double-tap to change.">
          {rightText}
        </Pressable>
      ) : (
        rightText
      )}
    </View>
  );
}
