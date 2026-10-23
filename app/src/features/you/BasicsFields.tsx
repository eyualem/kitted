// Height, build and fit (02 §3.6 Y2): the one set of controls for You → Style profile and Kit's "About you" sheet
// (10-onboarding.md §10, #370), so the two can't drift. All three start blank until he taps; none moves a score.
import { Pressable, View } from 'react-native';
import { KText, RowDivider, opacity, space, useTheme } from '@/design-system';
import { BUILDS, buildLabel, FITS, fitLabel, heightSpoken, stepHeight, type Build, type FitPref } from '@/features/onboarding/basics';
import { Segmented } from '@/features/onboarding/Segmented';
import { t } from '@/i18n/en';
import { heightText } from './profile';

export interface BasicsValues {
  heightIn: number | null;
  build: Build | null;
  fit: FitPref | null;
}

export function BasicsFields({ value, units, onChange }: { value: BasicsValues; units: 'imperial' | 'metric'; onChange: (patch: Partial<BasicsValues>) => void }) {
  const h = value.heightIn;
  return (
    <>
      <Row label={t('onb.basics.height')}>
        <HeightStepper
          value={h !== null ? heightText(h, units) : null}
          spoken={h !== null ? (units === 'metric' ? heightText(h, units) : heightSpoken(h)) : t('onb.basics.heightAdd')}
          onStep={(d) => onChange({ heightIn: stepHeight(h, d) })}
        />
      </Row>
      <RowDivider inset={space.rowX} />
      <Field label={t('onb.basics.build')}>
        <Segmented<Build> label={t('onb.basics.build')} value={value.build} onChange={(v) => onChange({ build: v })} options={BUILDS.map((v) => ({ value: v, label: buildLabel(v) }))} />
      </Field>
      <RowDivider inset={space.rowX} />
      <Field label={t('onb.basics.fit')}>
        <Segmented<FitPref> label={t('onb.basics.fit')} value={value.fit} onChange={(v) => onChange({ fit: v })} options={FITS.map((v) => ({ value: v, label: fitLabel(v) }))} />
      </Field>
    </>
  );
}

/** A 52 pt row: label left, control right (stacked at accessibility sizes). */
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const { isAccessibilitySize } = useTheme();
  return (
    <View
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

/** A label above its full-width control (the segmented build and fit). */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: space.rowX, paddingVertical: space.m, gap: space.s }}>
      <KText variant="callout" weight="500" accessibilityElementsHidden importantForAccessibility="no">
        {label}
      </KText>
      {children}
    </View>
  );
}

function HeightStepper({ value, spoken, onStep }: { value: string | null; spoken: string; onStep: (d: 1 | -1) => void }) {
  const { colors } = useTheme();
  const circle = (d: 1 | -1) => (
    <Pressable
      onPress={() => onStep(d)}
      hitSlop={7}
      style={({ pressed }) => ({ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, opacity: pressed ? opacity.pressed : 1 })}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {/* Capped: the circle is a fixed 30 pt, and at the largest sizes the glyph outgrew it. VoiceOver adjusts the
          value instead (the stepper is one adjustable element). */}
      <KText variant="title3" weight="500" maxFontSizeMultiplier={1.3}>
        {d === 1 ? '+' : '−'}
      </KText>
    </Pressable>
  );
  return (
    <View
      style={{ minHeight: 36, minWidth: 150, paddingVertical: 3, paddingHorizontal: 4, borderRadius: 18, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: space.s, backgroundColor: colors.surface2 }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('onb.basics.height')}
      accessibilityValue={{ text: spoken }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      {circle(-1)}
      <KText variant="callout" weight={value ? '600' : '500'} color={value ? 'ink' : 'ink3'} tabular style={{ flex: 1, textAlign: 'center' }}>
        {value ?? t('onb.basics.heightAdd')}
      </KText>
      {circle(1)}
    </View>
  );
}
