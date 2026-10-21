// G1 · Offline banner (02 G1; 09 §20.8 G18.2): a capsule at the top of Stylist while the phone is offline, "Offline.
// Your closet and lookbook still work.", then "Back online." for 3 s. It takes no touches (never covers a button) and
// VoiceOver hears each change once.
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Icon, KText, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { useNet } from '@/services/connectivity';

/** The banner's text stops growing here (it's a status overlay, not reading text). */
const BANNER_MAX_SCALE = 1.5;

export function OfflineBanner({ top }: { top: number }) {
  const { colors } = useTheme();
  const net = useNet();
  const text = !net.online ? t('banner.offline') : net.backOnline ? t('banner.online') : null;
  const said = useRef<string | null>(null);
  useEffect(() => {
    if (text && text !== said.current) AccessibilityInfo.announceForAccessibility?.(text);
    said.current = text;
  }, [text]);
  if (!text) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top }]}>
      <View
        accessible
        accessibilityLabel={text}
        style={[styles.capsule, { backgroundColor: colors.surface2, borderColor: colors.line }]}
      >
        {!net.online ? <Icon name="offline" size={13} color="ink2" weight="semibold" scalesWithText /> : null}
        {/* Capped at 1.5× (an overlay; VoiceOver reads it whole): at the largest sizes it ran to three lines over the
            thread. */}
        <KText variant="footnote" weight="600" color="ink2" style={{ flexShrink: 1 }} maxFontSizeMultiplier={BANNER_MAX_SCALE}>
          {text}
        </KText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  capsule: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth, maxWidth: '100%',
  },
});
