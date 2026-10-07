// MonoLabel (`.tagline` text, `.intent-l`, `.sub .k`) + TagLine (the card header row).
// SF Mono (RN 'ui-monospace') 12 pt medium, scales, SENTENCE CASE by default (ruling 29;
// typography.MONO_UPPERCASE_AT_NORMAL_SIZES brings back the mockup's uppercase), ink3.
// Nothing in mono is below 12 pt.

import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { KText } from './KText';
import { t } from '@/i18n/en';
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
  /** Makes the right side a button with a chevron.down (the occasion picker, 02 D7). */
  onPressRight?: () => void;
  /** Right side color: ink2 (occasion) or accent ("How I score ›" link). */
  rightColor?: 'ink2' | 'accent';
  /** Hint for the pressable right side. */
  rightHint?: string;
  /** Spoken form, e.g. "Fit check, full. Occasion: Date. Double-tap to change." */
  accessibilityLabel?: string;
}

export function TagLine({ left, right, onPressRight, rightColor = 'ink2', rightHint, accessibilityLabel }: TagLineProps) {
  const { isAccessibilitySize } = useTheme();
  const spoken = accessibilityLabel ?? [left.replace(/ · /g, ', '), right].filter(Boolean).join('. ');
  const chevron = onPressRight && rightColor === 'ink2';
  const rightText = right ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <MonoLabel color={rightColor}>{right}</MonoLabel>
      {chevron ? <Icon name="chevronDown" size={10} weight="semibold" color="ink2" scalesWithText /> : null}
    </View>
  ) : null;
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
        <Pressable
          onPress={onPressRight}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel={spoken}
          accessibilityHint={rightHint ?? (chevron ? t('a11y.changeOccasionHint') : undefined)}
        >
          {rightText}
        </Pressable>
      ) : (
        rightText
      )}
    </View>
  );
}
