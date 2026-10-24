// "Fit you like" (02 §3.6 Y2): the one fit control for You → Style profile, the same three choices Kit's "About you"
// card offers (#373). Height and build were here until #375: a blind test (#374) showed they didn't change Kit's
// advice, so they're no longer asked. Blank until he taps; it never moves a score.
import { View } from 'react-native';
import { KText, space, useTheme } from '@/design-system';
import { FITS, fitLabel, type FitPref } from '@/features/onboarding/basics';
import { Segmented } from '@/features/onboarding/Segmented';
import { t } from '@/i18n/en';

export interface BasicsValues {
  fit: FitPref | null;
}

export function BasicsFields({ value, onChange }: { value: BasicsValues; onChange: (patch: Partial<BasicsValues>) => void }) {
  return (
    <View style={{ paddingHorizontal: space.rowX, paddingVertical: space.m, gap: space.s }}>
      <KText variant="callout" weight="500" accessibilityElementsHidden importantForAccessibility="no">
        {t('onb.basics.fit')}
      </KText>
      <Segmented<FitPref> label={t('onb.basics.fit')} value={value.fit} onChange={(v) => onChange({ fit: v })} options={FITS.map((v) => ({ value: v, label: fitLabel(v) }))} />
    </View>
  );
}

/** A 52 pt row: label left, control right (stacked at accessibility sizes). `spoken` makes a read-only row one
 *  VoiceOver element ("Birth year, 2005"); a row holding a control lets the control speak. */
export function Row({ label, spoken, children }: { label: string; spoken?: string; children: React.ReactNode }) {
  const { isAccessibilitySize } = useTheme();
  return (
    <View
      accessible={!!spoken}
      accessibilityLabel={spoken}
      style={[
        { minHeight: 52, paddingHorizontal: space.rowX, paddingVertical: space.s },
        isAccessibilitySize ? { gap: space.xs } : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m },
      ]}
    >
      <KText variant="callout" weight="500" accessibilityElementsHidden importantForAccessibility="no">
        {label}
      </KText>
      {children}
    </View>
  );
}
