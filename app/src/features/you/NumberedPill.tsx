// A look he picked, numbered in pick order (#246 mockup `.pill` + `.num1`): 30 pt capsule, 1 pt line border, 14 pt
// medium label, an 18 pt number disc. `filled` = ink fill (his first pick on Y1; every pick in Y2's chips).
// Ink only: copper is for score movement (#231). `shake` bumped = a 4th pick was refused: one side-to-side shake
// (a dim and back with Reduce Motion), as onboarding's LookTile.
import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { CONTROL_TEXT_MAX_SCALE, KText, opacity, size, useTheme } from '@/design-system';

export function NumberedPill({ n, title, filled, onPress, accessibilityLabel, shake = 0 }: { n?: number; title: string; filled?: boolean; onPress?: () => void; accessibilityLabel?: string; shake?: number }) {
  const { colors, isAccessibilitySize, a11y } = useTheme();
  const [x] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const reduceMotion = a11y.reduceMotion;
  useEffect(() => {
    if (!shake) return;
    if (reduceMotion) {
      Animated.sequence([0.55, 1].map((v) => Animated.timing(fade, { toValue: v, duration: 120, useNativeDriver: true }))).start();
      return;
    }
    Animated.sequence([6, -6, 4, -4, 0].map((v) => Animated.timing(x, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  }, [shake, x, fade, reduceMotion]);
  const body = (
    <View
      style={{
        minHeight: 30, paddingHorizontal: 12, paddingVertical: isAccessibilitySize ? 4 : 0, borderRadius: 15, borderCurve: 'continuous',
        borderWidth: 1, borderColor: filled ? colors.ink : colors.line, backgroundColor: filled ? colors.ink : colors.surface,
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, maxWidth: '100%',
      }}
    >
      {n !== undefined ? (
        <View style={{ minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? colors.bg : colors.surface2 }}>
          <KText variant="caption" weight="700" color="ink" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE} tabular>
            {String(n)}
          </KText>
        </View>
      ) : null}
      <KText variant="subheadline" weight="500" color={filled ? 'surface' : 'ink'} numberOfLines={isAccessibilitySize ? 0 : 1} style={{ flexShrink: 1 }}>
        {title}
      </KText>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected: !!filled }}
      // 30 pt visual, 44 pt hit: the padding is part of the layout (like Chip), so rows keep their spacing.
      style={({ pressed }) => ({ paddingVertical: (size.hit - 30) / 2, opacity: pressed ? opacity.pressed : 1, maxWidth: '100%' })}
    >
      <Animated.View style={{ transform: [{ translateX: x }], opacity: fade }}>{body}</Animated.View>
    </Pressable>
  );
}
