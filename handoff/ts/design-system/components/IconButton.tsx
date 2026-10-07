// IconButton (`.circ`, `.btn.icon`, `.circ.glass`) — 03 §5, §4.5.
// solid: a circle on surface2 with an ink glyph at 42% of the diameter (44 nav circle; 36 in-card
//        Share/Save keep a 44 hit area via hitSlop).
// glass: CAMERA ONLY (and the share screen's X). iOS 26 Liquid Glass through expo-glass-effect's
//        GlassView, tinted black @ 30%, interactive. Keep the camera scrims (tokens.cameraScrims).
//        Fallbacks: Reduce Transparency → solid black @ 60%; no Liquid Glass (iOS < 26) →
//        expo-blur BlurView (dark) + the same 30% tint.
// The accessibility label is required.

import { Pressable, View } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme';
import { fixed, opacity, size } from '../tokens';
import type { SymKey } from '../symbols';
import { Icon, type SymbolName } from './Icon';

export interface IconButtonProps {
  icon: SymKey | SymbolName;
  /** VoiceOver label: "Share", "Close", "Switch camera", "Flash off". */
  label: string;
  variant?: 'solid' | 'glass';
  diameter?: number;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}

let glassAvailable: boolean | undefined;
function hasLiquidGlass(): boolean {
  if (glassAvailable === undefined) {
    try {
      glassAvailable = isLiquidGlassAvailable();
    } catch {
      glassAvailable = false;
    }
  }
  return glassAvailable;
}

export function IconButton({ icon, label, variant = 'solid', diameter = size.navCircle, onPress, disabled, accessibilityHint }: IconButtonProps) {
  const { colors, a11y } = useTheme();
  const slop = Math.max(0, (size.hit - diameter) / 2);
  const glyph = Math.round(diameter * 0.42);
  const glyphColor = variant === 'glass' ? fixed.white : colors.ink;
  const circle = { width: diameter, height: diameter, borderRadius: diameter / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } as const;

  const content = <Icon name={icon} size={glyph} color={glyphColor} />;

  let body;
  if (variant === 'solid') {
    body = <View style={[circle, { backgroundColor: colors.surface2 }]}>{content}</View>;
  } else if (a11y.reduceTransparency) {
    body = <View style={[circle, { backgroundColor: fixed.glassFallback }]}>{content}</View>;
  } else if (hasLiquidGlass()) {
    // VERIFY on device that GlassView takes its shape from borderRadius. Never animate its
    // (or a parent's) opacity to 0: Expo documents that the glass then stops rendering.
    body = (
      <GlassView glassEffectStyle="regular" tintColor={fixed.glassTint} isInteractive style={circle}>
        {content}
      </GlassView>
    );
  } else {
    body = (
      <View style={circle}>
        <BlurView intensity={40} tint="dark" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: fixed.glassTint }} />
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({ opacity: disabled ? opacity.disabled : pressed && variant === 'solid' ? opacity.pressed : 1 })}
    >
      {body}
    </Pressable>
  );
}
