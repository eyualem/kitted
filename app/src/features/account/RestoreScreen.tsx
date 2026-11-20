// A4 · Bringing back your fits (SB6): Welcome → sign in → an account that already holds his fits or a saved style profile.
// No Back. About you asked his age first (it never syncs, so the age gate runs on every new phone); then this screen pulls the
// account's rows (restoreAccount), the counts going up as they arrive, then `Your fits are back.` (or `Your style profile is
// back.` with no counts, for a profile-only account), then the photo step once if the account has it off, then Stylist with the
// rest of setup skipped. The camera still asks for the agreement once on this phone (#252). A pull that can't reach the server
// says so and offers Try again; nothing is marked done until it works.
// On a demo screen (no real account) the counts come from the route and no rows arrive.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KButton, KText, WovenLabel, space, useTheme } from '@/design-system';
import { store, tracking } from '@/data/db';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { setAgeBlocked, setOnboarded } from '@/state/appGate';
import { completeOnboarding } from '@/features/onboarding/complete';
import { clearResumeStep } from '@/features/onboarding/resume';
import { cleanName } from '@/features/onboarding/aboutStep';
import { ABOUT_KEY, BASICS_KEY, isAgeBand, loadDraft } from '@/features/onboarding/basics';
import { t } from '@/i18n/en';
import { syncAllowed } from '@/sync/allowed';
import { photoStepFor } from '@/sync/photoBackup';
import { accountRemote } from './accountRemote';
import { auth, getAccount } from './account';
import type { AuthProvider } from './auth';
import { PhotoStep } from './PhotoStep';
import { restoreAccount, type RestoreResult } from './restore';

const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : 0);

type Phase = 'running' | 'fits' | 'profile' | 'retry';

export function RestoreScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ fits?: string; pieces?: string; profile?: string; state?: string }>();
  // The account's own counts, read from the server before the age question, come in the route; rows landing only raise them.
  const [counts, setCounts] = useState({ fits: num(p.fits), pieces: num(p.pieces) });
  const [phase, setPhase] = useState<Phase>('running');
  const [photos, setPhotos] = useState<AuthProvider | null>(null);
  const alive = useRef(true);

  const line = t('acct.restore.counts', counts);
  const title = phase === 'fits' ? t('acct.restore.done') : phase === 'profile' ? t('acct.restore.profileDone') : phase === 'retry' ? t('acct.restore.retryBody') : t('acct.restore.title');

  /** Finished: the photo step once (SB4), then Stylist. */
  const leave = useCallback(async () => {
    await setOnboarded(true);
    router.replace('/');
  }, []);
  const finish = useCallback(
    async (kind: 'fits' | 'profile') => {
      if (!alive.current) return;
      setPhase(kind);
      await new Promise((r) => setTimeout(r, 900));
      if (!alive.current) return;
      const account = await getAccount(store);
      if (account && (await photoStepFor(store)) === 'show') setPhotos(account.provider);
      else await leave();
    },
    [leave],
  );

  /** The real restore: the account's rows come down onto this phone. */
  const restoreReal = useCallback(async (): Promise<RestoreResult> => {
    const account = await getAccount(store);
    if (!account) return { kind: 'retry' };
    return restoreAccount({
      store: store,
      remote: accountRemote(account.uid),
      deviceId: await tracking.deviceId(),
      nowMs: () => sessionClock.nowMs(),
      ids: newId,
      auth,
      setAgeBlocked,
      onProgress: (c) => alive.current && setCounts((was) => ({ fits: Math.max(was.fits, c.fits), pieces: Math.max(was.pieces, c.pieces) })),
    });
  }, []);

  /** A demo screen: no account, the route's counts, the profile as About you left it (the old stand-in). */
  const restoreDemo = useCallback(async (): Promise<RestoreResult> => {
    const fits = num(p.fits);
    const pieces = num(p.pieces);
    if (p.state === 'retry') return { kind: 'retry' };
    const d = await loadDraft(store);
    await completeOnboarding(store, {
      styles: [], fitPreference: d.basics.fit ?? '', birthYear: null,
      ageBand: isAgeBand(d.about.age) ? d.about.age : null, name: cleanName(d.about.name), consent: false,
    }, sessionClock.nowMs(), newId);
    await store.deleteKv(BASICS_KEY);
    await store.deleteKv(ABOUT_KEY);
    await clearResumeStep(store);
    return fits === 0 && p.profile === '1' ? { kind: 'profile' } : { kind: 'fits', fits, pieces };
  }, [p.fits, p.pieces, p.profile, p.state]);

  const run = useCallback(async () => {
    setPhase('running');
    let r: RestoreResult;
    try {
      r = syncAllowed() ? await restoreReal() : await restoreDemo();
    } catch (e: unknown) {
      console.warn('[restore] failed', e);
      r = { kind: 'retry' };
    }
    if (!alive.current) return;
    if (r.kind === 'retry') return setPhase('retry');
    if (r.kind === 'underage') return void router.replace('/'); // the lock is set: the gate shows the stop screen
    if (r.kind === 'fits') setCounts({ fits: r.fits, pieces: r.pieces });
    await finish(r.kind);
  }, [finish, restoreDemo, restoreReal]);

  useEffect(() => {
    alive.current = true;
    // A tick after the screen opens (a demo screen lingers on "Bringing back your fits…" a moment, as the real pull does).
    const h = setTimeout(() => void run(), syncAllowed() ? 0 : 1200);
    return () => {
      alive.current = false;
      clearTimeout(h);
    };
    // Runs once, when the screen opens (Try again calls it again).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(phase === 'fits' ? `${title}. ${line}.` : phase === 'running' ? t('acct.restore.a11y', { counts: line }) : title);
  }, [phase, title, line]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.body} accessible={photos === null} accessibilityLabel={phase === 'running' ? t('acct.restore.a11y', { counts: line }) : title}>
        <View style={{ alignSelf: 'center' }}>
          <WovenLabel size="small" />
        </View>
        <KText variant="title2" weight="700" accessibilityRole="header" style={styles.center}>
          {title}
        </KText>
        {phase === 'running' || phase === 'fits' ? (
          <KText variant="body" color="ink2" tabular style={styles.center}>
            {line}
          </KText>
        ) : null}
        {phase === 'running' ? <ActivityIndicator color={colors.ink2} /> : null}
        {phase === 'retry' ? <KButton title={t('acct.restore.retry')} size="regular" onPress={() => void run()} /> : null}
        {photos ? (
          <View style={{ alignSelf: 'stretch' }}>
            <PhotoStep provider={photos} showTitle={false} onDone={() => void leave()} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl, gap: space.l },
  center: { textAlign: 'center' },
});
