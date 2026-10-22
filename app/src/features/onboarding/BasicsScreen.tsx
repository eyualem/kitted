// O3 · Basics (02 D3), since #369 the birth-year step: his looks echoed back, Kit's reply, then only the birth year
// (blank until he picks one on the O3w list; no −/+ on it, since one stray tap could turn 18 into 17, #276). Height,
// build and fit moved to Kit's "About you" card after the first score (10-onboarding.md §10). "Continue" is off until a
// year is picked; under 18 asks once ("Born in 2009?"), then sets the age flag and replaces everything with O4. The
// restore path (§4.4) shares the layout with its own line. Answers wait in kv until consent saves them.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KButton, KCard, KText, StylistMessage, UserBubble, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { StyleKey } from '@/data/types';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { setAgeBlocked } from '@/state/appGate';
import { EMPTY_BASICS, isUnderAge, loadDraft, looksEcho, looksReply, type BasicsDraft } from './basics';
import { OnboardingNav } from './OnboardingNav';
import { setResumeStep } from './resume';
import { parseRestoreParam } from '@/features/account/account';

export function BasicsScreen() {
  const { colors } = useTheme();
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
          <View style={styles.card}>
            <Field label={t('onb.basics.birthYear')}>
              <Pressable
                onPress={() => router.push(b.birthYear === null ? '/sheets/birth-year' : { pathname: '/sheets/birth-year', params: { year: String(b.birthYear) } })}
                accessibilityRole="button"
                accessibilityLabel={b.birthYear === null ? `${t('onb.basics.birthYear')}, not chosen` : `${t('onb.basics.birthYear')}, ${b.birthYear}`}
                style={[styles.year, { backgroundColor: colors.surface2 }]}
              >
                {b.birthYear === null ? (
                  <KText variant="subheadline" weight="500" color="ink3">{t('onb.basics.choose')}</KText>
                ) : (
                  <KText variant="title3" weight="600" tabular>{String(b.birthYear)}</KText>
                )}
              </Pressable>
            </Field>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  thread: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xl, gap: space.m },
  card: { paddingVertical: 14, paddingHorizontal: 16 },
  // minHeight, not height: at the largest text sizes the year grows and the row grows with it.
  year: { minHeight: 36, paddingVertical: 3, borderRadius: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.s },
});
