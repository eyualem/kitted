// O3 · Basics (02 D3): his looks echoed back, the stylist's reply, then height (optional, starts blank), build,
// fit and birth year (blank until he picks one on the O3w wheel). "Looks right" is off until a year is picked;
// under 18 sets the age flag and replaces everything with O4. Answers wait in kv until consent saves them.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KButton, KCard, KText, StylistMessage, UserBubble, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { StyleKey } from '@/data/types';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { setAgeBlocked } from '@/state/appGate';
import {
  BASICS_KEY, BUILDS, buildLabel, EMPTY_BASICS, FITS, fitLabel, heightLabel, heightSpoken, isUnderAge, loadDraft, looksEcho, looksReply,
  stepHeight, type BasicsDraft, type Build, type FitPref,
} from './basics';
import { OnboardingNav } from './OnboardingNav';
import { Segmented } from './Segmented';
import { Silhouette } from './Silhouette';

export function BasicsScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const insets = useSafeAreaInsets();
  const [looks, setLooks] = useState<StyleKey[]>([]);
  const [b, setB] = useState<BasicsDraft>(EMPTY_BASICS);

  // Re-read on focus: the birth-year sheet writes the draft and closes.
  useFocusEffect(
    useCallback(() => {
      void loadDraft(store).then((d) => {
        setLooks(d.looks);
        setB(d.basics);
      });
    }, []),
  );

  const update = (patch: Partial<BasicsDraft>) => {
    setB((prev) => {
      const next = { ...prev, ...patch };
      void store.setKv(BASICS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const done = async () => {
    if (b.birthYear === null) return;
    const year = sessionClock.now().getFullYear();
    if (isUnderAge(b.birthYear, year)) {
      await setAgeBlocked(true);
      // The gate swaps the stacks; "/" sends him through it to O4.
      router.replace('/');
      return;
    }
    router.push('/onboarding/consent');
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/onboarding/looks'));

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <OnboardingNav step={3} onBack={back} />
      <ScrollView contentContainerStyle={styles.thread}>
        <UserBubble onPress={back}>{looksEcho(looks)}</UserBubble>
        <StylistMessage showHeader>{looksReply(looks)}</StylistMessage>
        <KCard>
          {/* AX sizes: the fields take the full width and the figure moves under them. */}
          <View style={[styles.grid, styles.card, isAccessibilitySize && { flexDirection: 'column' }]}>
            <View style={styles.fields}>
              <Field label={t('onb.basics.height')}>
                <Stepper
                  value={b.heightIn !== null ? heightLabel(b.heightIn) : null}
                  placeholder={t('onb.basics.heightAdd')}
                  label={t('onb.basics.height')}
                  spoken={b.heightIn !== null ? heightSpoken(b.heightIn) : t('onb.basics.heightAdd')}
                  onStep={(d) => update({ heightIn: stepHeight(b.heightIn, d) })}
                />
              </Field>
              <Field label={t('onb.basics.build')}>
                <Segmented<Build> label={t('onb.basics.build')} value={b.build} onChange={(v) => update({ build: v })} options={BUILDS.map((v) => ({ value: v, label: buildLabel(v) }))} />
              </Field>
              <Field label={t('onb.basics.fit')}>
                <Segmented<FitPref> label={t('onb.basics.fit')} value={b.fit} onChange={(v) => update({ fit: v })} options={FITS.map((v) => ({ value: v, label: fitLabel(v) }))} />
              </Field>
              <Field label={t('onb.basics.birthYear')}>
                {b.birthYear === null ? (
                  <Pressable
                    onPress={() => router.push('/sheets/birth-year')}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('onb.basics.birthYear')}, not chosen`}
                    style={[styles.stepper, { backgroundColor: colors.surface2, justifyContent: 'center' }]}
                  >
                    <KText variant="subheadline" weight="500" color="ink3">{t('onb.basics.choose')}</KText>
                  </Pressable>
                ) : (
                  <Stepper
                    value={String(b.birthYear)}
                    label={t('onb.basics.birthYear')}
                    spoken={String(b.birthYear)}
                    onStep={(d) => update({ birthYear: (b.birthYear ?? 0) + d })}
                    onPressValue={() => router.push('/sheets/birth-year')}
                  />
                )}
              </Field>
            </View>
            <View style={[styles.silCol, isAccessibilitySize && { alignSelf: 'center' }]}>
              <Silhouette basics={b} width={75.5} />
            </View>
          </View>
        </KCard>
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.l) }]}>
        <KButton title={t('onb.basics.cta')} disabled={b.birthYear === null} onPress={() => void done()} />
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6.5 }}>
      <KText variant="footnote" weight="600" color="ink2" accessibilityElementsHidden importantForAccessibility="no">
        {label}
      </KText>
      {children}
    </View>
  );
}

function Stepper({ value, placeholder, label, spoken, onStep, onPressValue }: { value: string | null; placeholder?: string; label: string; spoken: string; onStep: (d: 1 | -1) => void; onPressValue?: () => void }) {
  const { colors } = useTheme();
  const circle = (d: 1 | -1) => (
    <Pressable onPress={() => onStep(d)} hitSlop={6} style={[styles.circle, { backgroundColor: colors.surface }]} accessibilityElementsHidden importantForAccessibility="no">
      <KText variant="title3" weight="500">{d === 1 ? '+' : '−'}</KText>
    </Pressable>
  );
  return (
    <View
      style={[styles.stepper, { backgroundColor: colors.surface2 }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      {circle(-1)}
      <Pressable onPress={onPressValue} disabled={!onPressValue} style={{ flex: 1, alignItems: 'center' }}>
        <KText variant="title3" weight={value ? '600' : '500'} color={value ? 'ink' : 'ink3'} tabular>
          {value ?? placeholder ?? ''}
        </KText>
      </Pressable>
      {circle(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  thread: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xl, gap: space.m },
  card: { paddingVertical: 14, paddingHorizontal: 16 },
  grid: { flexDirection: 'row', gap: 13 },
  fields: { flex: 1, gap: 13 },
  silCol: { width: 75.5, justifyContent: 'center' },
  // minHeight, not height: at the largest text sizes the value grows and the stepper grows with it.
  stepper: { minHeight: 36, paddingVertical: 3, borderRadius: 18, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center' },
  circle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s },
});
