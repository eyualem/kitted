// The onboarding nav (02 D2 §1): a Back circle, the 6-step progress bar, and a matching spacer.
import { StyleSheet, View } from 'react-native';
import { IconButton, useTheme } from '@/design-system';
import { size } from '@/design-system/tokens';
import { t } from '@/i18n/en';

export const ONBOARDING_STEPS = 6;

export function OnboardingNav({ step, onBack }: { step: number; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <IconButton icon="back" label={t('common.back')} variant="solid" onPress={onBack} />
      <View style={styles.bar} accessible accessibilityRole="progressbar" accessibilityLabel={t('onb.progress.a11y', { n: step })}>
        {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < step ? colors.ink : colors.line }]} />
        ))}
      </View>
      <View style={{ width: size.navCircle }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  bar: { flex: 1, flexDirection: 'row', gap: 5, marginHorizontal: 18 },
  seg: { flex: 1, height: 4, borderRadius: 2.5 },
});
