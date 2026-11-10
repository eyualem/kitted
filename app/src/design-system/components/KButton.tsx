// KButton (`.btn`, `.btn.p`, `.btn.lg`, `.btn.out`, `.btn.ghost`) + TextLink (`.links a`).
// 03 §5 "Chips, pills and buttons".
// Capsules. Large = 50 pt, full width, headline. Regular = 36 pt visual with a 44 pt hit area
// (4 pt layout padding above and below), 16 pt side padding, subheadline semibold.
// Kinds: primary (primary/onPrimary), secondary (surface2/ink), outline (clear + 1 pt line),
// ghost (clear, ink2). Pressed 82%, disabled 40%, loading = spinner at a fixed width.
// AX sizes: minHeight grows, the label wraps. At most one primary per card. Never glass,
// except over the camera (build that one with GlassView directly).

import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { CONTROL_TEXT_MAX_SCALE, opacity, size } from '../tokens';
import type { SymKey } from '../symbols';
import { Icon, type SymbolName } from './Icon';
import { KText } from './KText';

export type ButtonKind = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'large' | 'regular';

export interface KButtonProps {
  title: string;
  onPress?: () => void;
  kind?: ButtonKind;
  size?: ButtonSize;
  /** Default: true for large, false for regular. */
  fullWidth?: boolean;
  icon?: SymKey | SymbolName;
  disabled?: boolean;
  loading?: boolean;
  /** Paywall "Continue free": ghost with ink text. */
  inkLabel?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function KButton({
  title,
  onPress,
  kind = 'primary',
  size: sz = 'large',
  fullWidth,
  icon,
  disabled,
  loading,
  inkLabel,
  accessibilityLabel,
  accessibilityHint,
  style,
}: KButtonProps) {
  const { colors, isAccessibilitySize } = useTheme();
  const [lockedWidth, setLockedWidth] = useState<number | undefined>(undefined);
  const large = sz === 'large';
  const height = large ? size.buttonLarge : size.button;
  const full = fullWidth ?? large;
  const fg = kind === 'primary' ? colors.onPrimary : kind === 'ghost' && !inkLabel ? colors.ink2 : colors.ink;
  const bg = kind === 'primary' ? colors.primary : kind === 'secondary' ? colors.surface2 : 'transparent';

  const onLayout = (e: LayoutChangeEvent) => {
    if (!loading) setLockedWidth(e.nativeEvent.layout.width);
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        {
          paddingVertical: large ? 0 : (size.hit - size.button) / 2,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : 1,
        },
        style,
      ]}
    >
      <View
        onLayout={onLayout}
        style={{
          minHeight: height,
          width: loading ? lockedWidth : undefined,
          paddingHorizontal: large ? 20 : 16,
          paddingVertical: 6,
          borderRadius: height / 2,
          borderCurve: 'continuous',
          backgroundColor: bg,
          borderWidth: kind === 'outline' ? 1 : 0,
          borderColor: colors.line,
          // AX sizes: a column (icon above) and the label stretched to the full width. Labels stop
          // growing at 2×: at AX5 a 3-line label was measured at one width and drawn at another,
          // which clipped it ("Share the before and af…", DECISIONS-LOG #39).
          flexDirection: isAccessibilitySize ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon ? <Icon name={icon} size="small" color={fg} scalesWithText /> : null}
            <KText
              role={large ? 'buttonLarge' : 'button'}
              color={fg}
              maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
              // AX sizes: up to 2 lines, then shrink to fit. A button sharing its row (the card's
              // "Re-check after fixing" + share) was still measured too wide and clipped ("…fixi").
              numberOfLines={isAccessibilitySize ? 2 : undefined}
              adjustsFontSizeToFit={isAccessibilitySize}
              minimumFontScale={0.7}
              style={[{ textAlign: 'center' }, isAccessibilitySize ? { alignSelf: 'stretch' } : { flexShrink: 1 }]}
            >
              {title}
            </KText>
          </>
        )}
      </View>
    </Pressable>
  );
}

export interface TextLinkProps {
  title: string;
  onPress?: () => void;
  accessibilityHint?: string;
  /** When the spoken name differs from the title (a trailing "›"). */
  accessibilityLabel?: string;
  /** Inside cards: no 44 pt layout height (hitSlop reaches 44 instead), so rows keep the mockup's spacing. */
  compact?: boolean;
  /** "Later" is ink2; everything else ink. `accent` stays for score movement only (#231). */
  color?: 'ink' | 'ink2' | 'accent';
  /** T74 stub: a chevron after the title (Skip ›). Not built: ignored until T74. */
  trailingIcon?: SymKey;
}

/** T74 stub: the trailing icon's size and gap at a font scale. */
export function trailingIconMetrics(fontScale: number): { size: number; gap: number } {
  void fontScale;
  throw new Error('T74: not built');
}

/** Ink semibold text link ("Why 8.0?", "Not quite right?", "Review"): copper is kept for score
 *  movement only (founder, Oct 12, DECISIONS-LOG #231). 44 pt hit target; 24 pt between links. */
export function TextLink({ title, onPress, accessibilityHint, accessibilityLabel, compact, color = 'ink' }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      hitSlop={compact ? { top: 12, bottom: 12, left: 8, right: 8 } : undefined}
      style={({ pressed }) => ({ minHeight: compact ? undefined : size.hit, justifyContent: 'center', opacity: pressed ? opacity.pressed : 1 })}
    >
      <KText role="textLink" color={color}>
        {title}
      </KText>
    </Pressable>
  );
}

/** A row of TextLinks, 24 pt apart; wraps (and stacks at AX sizes). */
export function TextLinkRow({ children, justify = 'flex-start' }: { children?: ReactNode; justify?: 'flex-start' | 'center' }) {
  const { isAccessibilitySize } = useTheme();
  return (
    <View
      style={
        isAccessibilitySize
          ? { flexDirection: 'column', alignItems: justify }
          : { flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 8, justifyContent: justify }
      }
    >
      {children}
    </View>
  );
}
