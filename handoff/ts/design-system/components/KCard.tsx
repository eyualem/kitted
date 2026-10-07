// KCard (`.card`) + KCardSection (`.card-pad`) — 03 §5 "Cards and score", §4.3, §4.4.
// Surface, radius 26 continuous, 1 pt line border (inside the shape), content clipped, the
// two-layer light-mode shadow (none in dark: the border + surface step do the work).
//
// Two views on purpose: the OUTER view draws the shadow (no overflow clipping), the INNER view
// clips content to the rounded shape. That's the reliable RN pattern for "shadow + clip".

import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle, type AccessibilityActionInfo, type AccessibilityActionEvent } from 'react-native';
import { useTheme } from '../theme';
import { radius as R, shadow, space } from '../tokens';

export interface KCardProps {
  children?: ReactNode;
  /** 26 default; 20 for the small/mini card. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * The fit-check card is ONE VoiceOver element with custom actions (03 §5 shared rules):
   * pass accessibilityLabel + accessibilityActions + onAccessibilityAction.
   */
  accessibilityLabel?: string;
  accessibilityActions?: ReadonlyArray<AccessibilityActionInfo>;
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}

export function KCard({ children, radius = R.card, style, accessibilityLabel, accessibilityActions, onAccessibilityAction }: KCardProps) {
  const { colors, scheme } = useTheme();
  const grouped = accessibilityLabel !== undefined;
  return (
    <View
      style={[{ borderRadius: radius, borderCurve: 'continuous' }, scheme === 'light' ? { boxShadow: shadow.card } : null, style]}
      accessible={grouped}
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: radius,
          borderCurve: 'continuous',
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export interface KCardSectionProps {
  children?: ReactNode;
  /** Gap between children (10 default). */
  gap?: number;
  paddingVertical?: number;
  style?: StyleProp<ViewStyle>;
}

export function KCardSection({ children, gap = 10, paddingVertical = space.cardPadV, style }: KCardSectionProps) {
  return <View style={[{ paddingHorizontal: space.cardPadH, paddingVertical, gap }, style]}>{children}</View>;
}
