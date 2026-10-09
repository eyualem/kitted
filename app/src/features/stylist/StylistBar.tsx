// The Stylist's "Ask your stylist…" bar, in the tab bar's bottom accessory (iOS 26; founder, Oct 9).
// The system draws the glass capsule and moves it: above the tab bar normally ("regular"), beside
// the shrunk tab bar once he scrolls down the thread ("inline"), the way Music and Safari do.
//   regular  (📷) Ask your stylist…                      (🎙)
//   inline   📷  Ask…
// It's a launcher, not a text field: the accessory can't follow the keyboard, so a tap opens the
// real composer (StylistScreen's dock), which rides the keyboard. Only shown on the Stylist tab.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { CONTROL_TEXT_MAX_SCALE, Icon, KText, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { dictationAvailable, dictationSupported } from '../../../modules/kitted-vision';
import { composerState, useComposerOpen } from './composerState';

export function StylistBar() {
  const { colors } = useTheme();
  const inline = NativeTabs.BottomAccessory.usePlacement() === 'inline';
  const open = useComposerOpen();
  const [mic, setMic] = useState(false);
  useEffect(() => {
    let live = true;
    if (dictationAvailable) void dictationSupported().then((ok) => live && setMic(ok));
    return () => {
      live = false;
    };
  }, []);

  // While the composer is open it sits right over this capsule; hide ours so the words don't show
  // through its glass twice.
  return (
    <View style={[styles.row, inline && styles.rowInline, { opacity: open ? 0 : 1 }]} pointerEvents={open ? 'none' : 'auto'}>
      <Pressable
        onPress={() => router.push('/camera')}
        accessibilityRole="button"
        accessibilityLabel={t('composer.a11y.camera')}
        hitSlop={4}
        style={({ pressed }) => [inline ? styles.cameraInline : [styles.camera, { backgroundColor: colors.primary }], { opacity: pressed ? opacity.pressed : 1 }]}
      >
        <Icon name="camera" size={inline ? 20 : 19} color={inline ? colors.ink : colors.onPrimary} />
      </Pressable>
      <Pressable
        onPress={() => composerState.open('type')}
        accessibilityRole="button"
        accessibilityLabel={t('composer.a11y.field')}
        accessibilityHint={t('composer.a11y.fieldHint')}
        style={styles.field}
      >
        <KText variant="body" color="ink3" numberOfLines={1} maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>
          {inline ? t('composer.placeholderIdle') : t('composer.placeholder')}
        </KText>
      </Pressable>
      {mic && !inline ? (
        <Pressable onPress={() => composerState.open('voice')} accessibilityRole="button" accessibilityLabel={t('mic.a11y')} hitSlop={4} style={({ pressed }) => [styles.mic, { opacity: pressed ? opacity.pressed : 1 }]}>
          <Icon name="mic" size={21} color="ink2" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 7, paddingRight: 8 },
  rowInline: { gap: 6, paddingLeft: 12 },
  camera: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  cameraInline: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  field: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  mic: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
