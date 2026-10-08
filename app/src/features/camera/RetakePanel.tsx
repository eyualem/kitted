// S3 · the quick check's panel (02 S3; DECISIONS-LOG #100), inside a camera cover, over the
// frozen photo: an icon, a title saying what's wrong in plain words, a short body, then the
// buttons stacked. Shared by the fit-check camera and the clothes scan (and its "Saved" state).
import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTROL_TEXT_MAX_SCALE, Icon, KText, fixed, opacity, size } from '@/design-system';

export interface PanelAction {
  title: string;
  onPress: () => void;
  icon?: 'flash' | 'camera' | 'photo';
}

export function RetakePanel({
  title, body, primary, secondary, tertiary, tone = 'warning', children,
}: {
  title: string;
  body?: string;
  primary: PanelAction;
  secondary?: PanelAction;
  tertiary?: PanelAction;
  tone?: 'warning' | 'done';
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(title);
  }, [title]);
  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(160)} style={[styles.panel, { bottom: Math.max(insets.bottom, 8) }]}>
      <Icon name={tone === 'done' ? 'checkFilled' : 'warning'} size={26} color={tone === 'done' ? '#5BC08A' : fixed.white} />
      <KText variant="headline" color={fixed.white} accessibilityRole="header">
        {title}
      </KText>
      {body ? (
        <KText variant="subheadline" color="rgba(255,255,255,0.75)">
          {body}
        </KText>
      ) : null}
      {children}
      <View style={styles.buttons}>
        <PanelButton action={primary} bg={fixed.white} fg={fixed.indigo} />
        {secondary ? <PanelButton action={secondary} bg="rgba(255,255,255,0.16)" fg={fixed.white} /> : null}
        {tertiary ? <PanelButton action={tertiary} bg="transparent" fg="rgba(255,255,255,0.85)" /> : null}
      </View>
    </Animated.View>
  );
}

/** S3's large buttons on the fixed-dark panel (white fill / white 16%), whatever the app theme. */
function PanelButton({ action, bg, fg }: { action: PanelAction; bg: string; fg: string }) {
  return (
    <Pressable
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={action.title}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: pressed ? opacity.pressed : 1 }]}
    >
      {action.icon ? <Icon name={action.icon} size="small" color={fg} /> : null}
      <KText variant="headline" color={fg} maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE} style={{ textAlign: 'center', flexShrink: 1 }}>
        {action.title}
      </KText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 8, right: 8, backgroundColor: '#171A23', borderRadius: 38, padding: 20, gap: 12 },
  buttons: { gap: 10, marginTop: 4 },
  button: {
    minHeight: size.buttonLarge, borderRadius: size.buttonLarge / 2, paddingHorizontal: 20, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
});
