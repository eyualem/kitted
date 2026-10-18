// Expandable — a section that slides open and closed (#344: the score card folds to its rating and opens on a tap).
// The children stay mounted (the score reveal and the closet row keep running while folded); the section's height
// follows their measured height × an eased 0…1, with a fade, so the card grows smoothly instead of jumping. Reduce
// Motion: no slide, it just shows. Folded, the children are hidden from VoiceOver.
import { useEffect, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { t } from '@/i18n/en';
import { opacity as pressedOpacity } from '../tokens';
import { useTheme } from '../theme';
import { Icon } from './Icon';

/** iOS-like ease-out; long enough to follow, short enough not to wait on. */
export const EXPAND_MS = 320;
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

/** `grow`: where its height change goes each frame, so a list can scroll with it (the Stylist thread's threadGrow). */
export function Expandable({ open, children, grow }: { open: boolean; children: ReactNode; grow?: SharedValue<number> }) {
  const { a11y } = useTheme();
  const h = useSharedValue(0);
  const p = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    p.set(withTiming(open ? 1 : 0, { duration: a11y.reduceMotion ? 0 : EXPAND_MS, easing: EASE }));
  }, [open, p, a11y.reduceMotion]);
  const style = useAnimatedStyle(() => ({ height: h.value * p.value, opacity: p.value }));
  useAnimatedReaction(
    () => h.value * p.value,
    (now, before) => {
      if (grow && before !== null && now !== before) grow.set(grow.value + now - before);
    },
  );
  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'} accessibilityElementsHidden={!open}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }} onLayout={(e) => h.set(e.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  );
}

/** The fold's handle at the card's foot: ⌄ folded, ⌃ open, turning with the section. */
export function ExpandHandle({ open, onPress }: { open: boolean; onPress: () => void }) {
  const { a11y } = useTheme();
  const turn = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    turn.set(withTiming(open ? 1 : 0, { duration: a11y.reduceMotion ? 0 : EXPAND_MS, easing: EASE }));
  }, [open, turn, a11y.reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={open ? t('card.fold.less') : t('card.fold.more')}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => ({ alignItems: 'center', paddingTop: 2, paddingBottom: 10, opacity: pressed ? pressedOpacity.pressed : 1 })}
    >
      <Animated.View style={style}>
        <Icon name="chevron.down" size={13} color="ink3" weight="semibold" scalesWithText />
      </Animated.View>
    </Pressable>
  );
}
