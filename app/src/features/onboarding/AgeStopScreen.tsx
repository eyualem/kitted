// O4 · Age stop (02 §3, ruling 3): terminal. No Back, no retry hint, no way around it; the flag lives in the
// secure store, so it survives a relaunch.
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KText, WovenLabel, space, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

export function AgeStopScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.body}>
        <WovenLabel size="small" />
        <KText variant="title2" weight="700" accessibilityRole="header" style={styles.center}>
          {t('onb.age.title')}
        </KText>
        <KText variant="body" color="ink2" style={styles.center}>
          {t('onb.age.body')}
        </KText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl, gap: space.l },
  center: { textAlign: 'center' },
});
