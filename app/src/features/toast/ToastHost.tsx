// The toast capsule (02 G2, 03 UndoToast): 16 from the sides, its bottom 100 pt up (just above
// the tab bar; above the composer on Stylist, DECISIONS-LOG #36), surface (surface2 in dark) with a 1 pt line border and the card shadow; message
// in subheadline ink, optional copper "Undo" (44 hit). Announced by VoiceOver; slides up (a
// fade under Reduce Motion).
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { KText, opacity, shadow, size, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { TOAST_MS, TOAST_MS_VOICEOVER, hideToast, useToast, useToastFloor } from './toast';

const BOTTOM = 100;
const ABOVE_DOCK = 8;

export function ToastHost() {
  const toast = useToast();
  const floor = useToastFloor();
  const { colors, scheme, a11y } = useTheme();
  const [voiceOver, setVoiceOver] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled?.().then(setVoiceOver).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('screenReaderChanged', setVoiceOver);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const label = toast.undo ? `${toast.text} ${t('common.undo')}` : toast.text;
    AccessibilityInfo.announceForAccessibility?.(label);
    const timer = setTimeout(() => hideToast(toast.id), voiceOver ? TOAST_MS_VOICEOVER : TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, voiceOver]);

  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(BOTTOM, floor + ABOVE_DOCK), alignItems: 'center' }}>
      <Animated.View
        key={toast.id}
        entering={a11y.reduceMotion ? FadeIn.duration(150) : FadeInDown.duration(220)}
        exiting={FadeOut.duration(150)}
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: size.hit, maxWidth: '100%',
          paddingLeft: 16, paddingRight: toast.undo ? 8 : 16, paddingVertical: 4, borderRadius: 999, borderCurve: 'continuous',
          backgroundColor: scheme === 'dark' ? colors.surface2 : colors.surface, borderWidth: 1, borderColor: colors.line, boxShadow: shadow.card,
        }}
      >
        <KText variant="subheadline" style={{ flexShrink: 1, paddingVertical: 8 }}>
          {toast.text}
        </KText>
        {toast.undo ? (
          <Pressable
            onPress={() => {
              hideToast(toast.id);
              void toast.undo?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('common.undo')}
            style={({ pressed }) => ({ minHeight: size.hit, paddingHorizontal: 8, justifyContent: 'center', opacity: pressed ? opacity.pressed : 1 })}
          >
            <KText variant="subheadline" weight="600" color="accent">
              {t('common.undo')}
            </KText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
