// The onboarding nav (02 D2 §1): a Back circle, the progress bar, and a matching spacer. The bar counts the steps
// that exist today (Welcome, Looks, Basics, Consent), so it fills on the last one; 02's 6 come back with the example
// check and the first-3-moves card (#276: with 6 it never filled and jumped straight into Stylist).
import { StyleSheet, View } from 'react-native';
import { IconButton, useTheme } from '@/design-system';
import { size } from '@/design-system/tokens';
import { t } from '@/i18n/en';

import { ONBOARDING_STEPS } from './resume';

export { ONBOARDING_STEPS };

/** `step` undefined: Back only (O1e, the example check, isn't a step). */
export function OnboardingNav({ step, onBack }: { step?: number; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <IconButton icon="back" label={t('common.back')} variant="solid" onPress={onBack} />
      {step === undefined ? (
        <View style={styles.bar} />
      ) : (
        <View style={styles.bar} accessible accessibilityRole="progressbar" accessibilityLabel={t('onb.progress.a11y', { n: step, total: ONBOARDING_STEPS })}>
          {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
            <View key={i} style={[styles.seg, { backgroundColor: i < step ? colors.ink : colors.line }]} />
          ))}
        </View>
      )}
      <View style={{ width: size.navCircle }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  bar: { flex: 1, flexDirection: 'row', gap: 5, marginHorizontal: 18 },
  seg: { flex: 1, height: 4, borderRadius: 2.5 },
});
