// O3 · Basics (02 D3): his looks echoed back, the stylist's reply, then height, build and fit (all optional, all
// blank until he taps) and birth year (blank until he picks one on the O3w list; no −/+ on it, since one stray tap
// could turn 18 into 17, #276). "Looks right" is off until a year is picked; under 18 asks once ("Born in 2009?"),
// then sets the age flag and replaces everything with O4. Answers wait in kv until consent saves them.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KButton, KCard, KText, StylistMessage, TextLink, UserBubble, space, useTheme } from '@/design-system';
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
import { setResumeStep } from './resume';
import { parseRestoreParam } from '@/features/account/account';
import { Silhouette } from './Silhouette';

export function BasicsScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const insets = useSafeAreaInsets();
  const [looks, setLooks] = useState<StyleKey[]>([]);
  const [b, setB] = useState<BasicsDraft>(EMPTY_BASICS);
  // Signed in from Welcome to an account that has his fits (10-onboarding.md §4.4): only this step, then A4.
  const { restore } = useLocalSearchParams<{ restore?: string }>();
  const restoring = parseRestoreParam(restore);

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
      // The block is for good (it outlives "Delete all my data"), so a mis-pick gets one chance to change (#276).
      const block = async () => {
        await setAgeBlocked(true);
        // The gate swaps the stacks; "/" sends him through it to O4.
        router.replace('/');
      };
      Alert.alert(t('onb.age.confirm.title', { year: b.birthYear }), t('onb.age.title'), [
        { text: t('onb.age.confirm.change'), style: 'cancel' },
        { text: t('onb.age.confirm.yes'), style: 'destructive', onPress: () => void block() },
      ]);
      return;
    }
    if (restoring) {
      router.replace({ pathname: '/onboarding/restore', params: { fits: restoring.fits, pieces: restoring.pieces, chats: restoring.chats } });
      return;
    }
    await setResumeStep(store, 'consent');
    router.push('/onboarding/consent');
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace(restoring ? '/onboarding/welcome' : '/onboarding/looks'));

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <OnboardingNav step={restoring ? undefined : 3} onBack={back} />
      <ScrollView contentContainerStyle={styles.thread}>
        {restoring ? (
          <StylistMessage showHeader>{t('acct.restore.basics')}</StylistMessage>
        ) : (
          <>
            <UserBubble onPress={back}>{looksEcho(looks)}</UserBubble>
            <StylistMessage showHeader>{looksReply(looks)}</StylistMessage>
          </>
        )}
        <KCard>
          {/* AX sizes: the fields take the full width and the figure moves under them. */}
          <View style={[styles.grid, styles.card, isAccessibilitySize && { flexDirection: 'column' }]}>
            <View style={styles.fields}>
              {/* Restoring: height, build and fit come back with his account; only the birth year is asked here. */}
              {restoring ? null : (<>
              <Field
                label={t('onb.basics.height')}
                // Height is optional: once set it can be taken back out (09 UI review).
                trailing={b.heightIn !== null ? <TextLink title={t('onb.basics.heightClear')} color="ink2" compact accessibilityHint={t('onb.basics.heightClear.a11y')} onPress={() => update({ heightIn: null })} /> : null}
              >
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
              </>)}
              <Field label={t('onb.basics.birthYear')}>
                <Pressable
                  onPress={() => router.push(b.birthYear === null ? '/sheets/birth-year' : { pathname: '/sheets/birth-year', params: { year: String(b.birthYear) } })}
                  accessibilityRole="button"
                  accessibilityLabel={b.birthYear === null ? `${t('onb.basics.birthYear')}, not chosen` : `${t('onb.basics.birthYear')}, ${b.birthYear}`}
                  style={[styles.stepper, { backgroundColor: colors.surface2, justifyContent: 'center' }]}
                >
                  {b.birthYear === null ? (
                    <KText variant="subheadline" weight="500" color="ink3">{t('onb.basics.choose')}</KText>
                  ) : (
                    <KText variant="title3" weight="600" tabular>{String(b.birthYear)}</KText>
                  )}
                </Pressable>
              </Field>
            </View>
            {restoring ? null : <View style={[styles.silCol, isAccessibilitySize && { alignSelf: 'center' }]}>
              <Silhouette basics={b} width={75.5} />
            </View>}
          </View>
        </KCard>
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: 4 }}>
          {t('onb.basics.never')}
        </KText>
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.l) }]}>
        {/* Why the button is off (09 UI review): the one answer it waits for. */}
        {b.birthYear === null ? (
          <KText variant="footnote" color="ink2" style={{ textAlign: 'center' }}>
            {t('onb.basics.yearHint')}
          </KText>
        ) : null}
        <KButton title={t('onb.basics.cta')} disabled={b.birthYear === null} onPress={() => void done()} />
      </View>
    </View>
  );
}

function Field({ label, trailing, children }: { label: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6.5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 18 }}>
        <KText variant="footnote" weight="600" color="ink2" accessibilityElementsHidden importantForAccessibility="no">
          {label}
        </KText>
        {trailing}
      </View>
      {children}
    </View>
  );
}

function Stepper({ value, placeholder, label, spoken, onStep }: { value: string | null; placeholder?: string; label: string; spoken: string; onStep: (d: 1 | -1) => void }) {
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
      <View style={{ flex: 1, alignItems: 'center' }}>
        <KText variant="title3" weight={value ? '600' : '500'} color={value ? 'ink' : 'ink3'} tabular>
          {value ?? placeholder ?? ''}
        </KText>
      </View>
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
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.s },
});
