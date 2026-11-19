// A4 · Bringing back your fits (SB6): Welcome → sign in → an account that already holds his fits.
// No Back. About you asked his age first (it never syncs, so the age gate runs on every new phone); then the counts,
// then Stylist with the rest of setup skipped. The camera still asks for the agreement once on this phone (#252).
// Stand-in: the counts come from the mock account and no rows arrive; the sync engine (08 A2) fills this phone.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KText, WovenLabel, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { setOnboarded } from '@/state/appGate';
import { completeOnboarding } from '@/features/onboarding/complete';
import { clearResumeStep } from '@/features/onboarding/resume';
import { cleanName } from '@/features/onboarding/aboutStep';
import { ABOUT_KEY, BASICS_KEY, isAgeBand, loadDraft } from '@/features/onboarding/basics';
import { t } from '@/i18n/en';

const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : 0);

export function RestoreScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ fits?: string; pieces?: string }>();
  const counts = t('acct.restore.counts', { fits: num(p.fits), pieces: num(p.pieces) });
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.announceForAccessibility?.(t('acct.restore.a11y', { counts }));
    const h = setTimeout(() => {
      if (!alive) return;
      setArrived(true);
      void (async () => {
        // What About you asked on this phone: his age band, and Apple's first name if the sign-in left one in the draft
        // (SB6, SB10). His looks and the rest arrive with his synced profile (T41b); the agreement is asked on the
        // camera's first open on this phone (consent 'later').
        const d = await loadDraft(store);
        await completeOnboarding(store, {
          styles: [], fitPreference: d.basics.fit ?? '', birthYear: null,
          ageBand: isAgeBand(d.about.age) ? d.about.age : null, name: cleanName(d.about.name), consent: 'later',
        }, sessionClock.nowMs(), newId);
        await store.deleteKv(BASICS_KEY);
        await store.deleteKv(ABOUT_KEY);
        await clearResumeStep(store);
        await new Promise((r) => setTimeout(r, 900));
        if (!alive) return;
        await setOnboarded(true);
        router.replace('/');
      })();
    }, 1200);
    return () => {
      alive = false;
      clearTimeout(h);
    };
    // Runs once, when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.body} accessible accessibilityLabel={t('acct.restore.a11y', { counts })}>
        <View style={{ alignSelf: 'center' }}>
          <WovenLabel size="small" />
        </View>
        <KText variant="title2" weight="700" accessibilityRole="header" style={styles.center}>
          {arrived ? t('acct.restore.done') : t('acct.restore.title')}
        </KText>
        <KText variant="body" color="ink2" tabular style={styles.center}>
          {counts}
        </KText>
        {arrived ? null : <ActivityIndicator color={colors.ink2} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl, gap: space.l },
  center: { textAlign: 'center' },
});
