// A4 · Bringing back your fits (10-onboarding.md §4.4): Welcome → sign in → an account that already holds his fits.
// No Back. Basics asked his birth year first (it never syncs, so the age gate runs on every new phone); then the counts,
// then Stylist with the rest of setup skipped. The camera still asks for the agreement once on this phone (#252).
// Real (#386): the backup brings the account's rows onto this phone (photos follow in the background) and the counts
// are this phone's as they land; the birth year and the fit Basics asked then go onto the restored profile. Can't reach
// the account: Try again, or Continue for now (the fits arrive at the next sync). On a demo screen (MockAuth) it's the
// stand-in: the mock account's counts, no rows.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KButton, KText, TextLink, WovenLabel, space, useTheme } from '@/design-system';
import { onChange } from '@/data/changes';
import { store } from '@/data/db';
import { localHoldings } from '@/sync/backup';
import { finishRestore } from './restore';
import { sessionClock } from '@/state/session';
import { setOnboarded } from '@/state/appGate';
import { t } from '@/i18n/en';

const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : 0);

type Phase = 'bringing' | 'done' | 'failed';

export function RestoreScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ fits?: string; pieces?: string; chats?: string }>();
  const [counts, setCounts] = useState({ fits: num(p.fits), pieces: num(p.pieces), chats: num(p.chats) });
  const [phase, setPhase] = useState<Phase>('bringing');
  const alive = useRef(true);
  const line = t('acct.restore.counts', counts);

  const finish = useCallback(async () => {
    await finishRestore(store, sessionClock.nowMs());
    await new Promise((r) => setTimeout(r, 900));
    if (!alive.current) return;
    await setOnboarded(true);
    router.replace('/');
  }, []);

  const bring = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { backup } = require('@/sync/appBackup') as typeof import('@/sync/appBackup');
    // This phone's counts as the account's rows land.
    const recount = () => void localHoldings(store).then((h) => alive.current && h.fits + h.pieces + h.chats > 0 && setCounts(h));
    const stop = onChange(['fitChecks', 'closet', 'chat'], recount);
    const r = await backup.joinNow();
    stop();
    if (!alive.current) return;
    if (r === 'offline' || r === 'failed') {
      setPhase('failed');
      AccessibilityInfo.announceForAccessibility?.(t('acct.restore.failed'));
      return;
    }
    if (r === 'ok') recount();
    else await new Promise((res) => setTimeout(res, 1200)); // the stand-in (a demo screen): no rows arrive
    if (!alive.current) return;
    setPhase('done');
    await finish();
  }, [finish]);

  useEffect(() => {
    alive.current = true;
    AccessibilityInfo.announceForAccessibility?.(t('acct.restore.a11y', { counts: line }));
    const h = setTimeout(() => void bring(), 0);
    return () => {
      alive.current = false;
      clearTimeout(h);
    };
    // Runs once, when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.body} accessible={phase !== 'failed'} accessibilityLabel={t('acct.restore.a11y', { counts: line })}>
        <View style={{ alignSelf: 'center' }}>
          <WovenLabel size="small" />
        </View>
        <KText variant="title2" weight="700" accessibilityRole="header" style={styles.center}>
          {phase === 'done' ? t('acct.restore.done') : t('acct.restore.title')}
        </KText>
        {phase === 'failed' ? (
          <>
            <KText variant="body" color="ink2" style={styles.center}>
              {t('acct.restore.failed')}
            </KText>
            <KButton
              title={t('acct.restore.retry')}
              onPress={() => {
                setPhase('bringing');
                void bring();
              }}
            />
            <TextLink title={t('acct.restore.later')} accessibilityHint={t('acct.restore.laterNote')} onPress={() => void finish()} />
            <KText variant="footnote" color="ink2" style={styles.center}>
              {t('acct.restore.laterNote')}
            </KText>
          </>
        ) : (
          <>
            <KText variant="body" color="ink2" tabular style={styles.center}>
              {line}
            </KText>
            {phase === 'done' ? null : <ActivityIndicator color={colors.ink2} />}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl, gap: space.l },
  center: { textAlign: 'center' },
});
