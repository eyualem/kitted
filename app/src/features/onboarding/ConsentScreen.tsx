// O5 · Consent (02 D4; text from inputs/app-store-and-age-rules.md §3, ruling 16). Two ways in: step 4 of
// onboarding, and later as a sheet with an X (from the camera when he said "Not now"). Nothing is pre-checked:
// only "Agree" counts, and "Not now" is the same size. The example and privacy-policy links aren't shown yet
// (O1e and the policy page aren't built), rather than leading nowhere.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, KButton, KCard, KText, StylistMessage, UserBubble, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { t, type StringKey } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { setOnboarded } from '@/state/appGate';
import { basicsEcho, BASICS_KEY, EMPTY_BASICS, inchesToCm, loadDraft, LOOKS_KEY, type BasicsDraft } from './basics';
import { completeOnboarding, giveConsent } from './complete';
import { picksToStyles } from './looks';
import { OnboardingNav } from './OnboardingNav';

type Row = { icon: string; title: StringKey; body?: StringKey; bullets?: StringKey[] };
const ROWS: Row[] = [
  { icon: 'face.dashed', title: 'onb.consent.sentTitle', body: 'onb.consent.sentBody', bullets: ['onb.consent.sent1', 'onb.consent.sent2', 'onb.consent.sent3'] },
  { icon: 'hand.raised', title: 'onb.consent.notTitle', body: 'onb.consent.notBody' },
  { icon: 'iphone', title: 'onb.consent.keptTitle', bullets: ['onb.consent.kept1', 'onb.consent.kept2', 'onb.consent.kept3'] },
  { icon: 'info.circle', title: 'onb.consent.aiTitle', body: 'onb.consent.aiBody' },
];

export function ConsentScreen({ mode }: { mode: 'onboarding' | 'sheet' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [basics, setBasics] = useState<BasicsDraft>(EMPTY_BASICS);
  const [busy, setBusy] = useState(false);
  const provider = t('config.providerDefault');

  useEffect(() => {
    if (mode === 'onboarding') void loadDraft(store).then((d) => setBasics(d.basics));
  }, [mode]);

  const finish = async (consent: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await save(consent);
    } catch (e: unknown) {
      // A failed save leaves him on this screen with both buttons working again (the gate opens only after every write).
      console.error('Consent save failed', e);
    } finally {
      setBusy(false);
    }
  };

  const save = async (consent: boolean) => {
    const now = sessionClock.nowMs();
    if (mode === 'sheet') {
      if (consent) await giveConsent(store, now);
      router.back();
      if (consent) setTimeout(() => router.push('/camera'), 350);
      return;
    }
    const d = await loadDraft(store);
    await completeOnboarding(store, {
      styles: picksToStyles(d.looks),
      heightCm: d.basics.heightIn !== null ? inchesToCm(d.basics.heightIn) : null,
      build: d.basics.build,
      fitPreference: d.basics.fit,
      birthYear: d.basics.birthYear,
      consent,
    }, now, newId);
    // His own words from "Something else?" stay in kv for later; the step drafts are done.
    await store.deleteKv(LOOKS_KEY);
    await store.deleteKv(BASICS_KEY);
    await setOnboarded(true);
    // The gate swaps the onboarding stack for the tabs; "/" sends him through it to Stylist.
    router.replace('/');
    if (consent) setTimeout(() => router.push('/camera'), 600);
  };

  const rows = (
    <KCard>
      <KText variant="headline" accessibilityRole="header" style={styles.cardHeader}>
        {t('onb.consent.header')}
      </KText>
      {ROWS.map((r, i) => (
        <View
          key={r.title}
          style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
          accessible
          accessibilityLabel={[t(r.title), r.body ? t(r.body, { provider }) : '', ...(r.bullets ?? []).map((b) => t(b))].filter(Boolean).join(' ')}
        >
          <View style={{ width: 23.5, paddingTop: 1 }}>
            <Icon name={r.icon as never} size={19.5} color="accent" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <KText variant="subheadline" weight="600">{t(r.title)}</KText>
            {r.body ? <KText variant="footnote" color="ink2">{t(r.body, { provider })}</KText> : null}
            {(r.bullets ?? []).map((b) => (
              <View key={b} style={{ flexDirection: 'row', gap: 6 }}>
                <KText variant="footnote" color="ink2">•</KText>
                <KText variant="footnote" color="ink2" style={{ flex: 1 }}>{t(b)}</KText>
              </View>
            ))}
          </View>
        </View>
      ))}
    </KCard>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: mode === 'onboarding' ? insets.top : space.l }]}>
      {mode === 'onboarding' ? (
        <OnboardingNav step={4} onBack={() => (router.canGoBack() ? router.back() : router.replace('/onboarding/basics'))} />
      ) : (
        <View style={styles.closeRow}>
          <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.thread}>
        {mode === 'onboarding' ? <UserBubble>{basicsEcho(basics)}</UserBubble> : null}
        <StylistMessage>{t('onb.consent.intro')}</StylistMessage>
        {rows}
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: 4 }}>
          {t('onb.consent.footer')}
        </KText>
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.l) }]}>
        <KButton title={t('onb.consent.agree')} onPress={() => void finish(true)} disabled={busy} />
        <KButton title={t('onb.consent.notNow')} kind="secondary" onPress={() => void finish(false)} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.gutter },
  thread: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xl, gap: space.m },
  cardHeader: { paddingTop: 13, paddingHorizontal: 17 },
  row: { flexDirection: 'row', gap: 13, paddingVertical: 13, paddingHorizontal: 17 },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: 5 },
});
