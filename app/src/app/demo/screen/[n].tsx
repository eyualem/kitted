// /demo/screen/<n> (and kitted://demo/screen/<n>): sets up screen n's scenario, clock and
// state (04 §10.3), then navigates there with the same routes the real UI uses (05 §5.2).
// Any other demo keys in the query (theme, latency, now, freeChecksUsed…) win.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { KText, useTheme } from '@/design-system';
import { applyDemoScreen, type DemoTarget } from '@/demo/applyDemoScreen';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { t } from '@/i18n/en';

export default function DemoScreenRoute() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { colors } = useTheme();
  const [missing, setMissing] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    applyDemoScreen(params).then((target) => {
      if (!alive) return;
      if (!target) return setMissing(params.n ?? '');
      if (target.toast) setTimeout(() => demoToast(target.toast!), 900);
      if (!target.under) return router.replace(target.href);
      // Present sheets and covers over the screen beneath them, as the real flow does.
      router.replace(target.under);
      setTimeout(() => router.push(target.href), 350);
    });
    return () => {
      alive = false;
    };
    // Re-run only when the link changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {missing !== null ? <KText variant="body">{t('demo.unknownScreen', { n: missing })}</KText> : null}
    </View>
  );
}

/** Screens 204–205: an Undo toast over the screen, for the countdown ring (#324). Its Undo does nothing. */
function demoToast(o: NonNullable<DemoTarget['toast']>) {
  const text = o.text === 'removed' ? t('closet.removed', { item: 'grey hoodie' }) : t('toast.logged');
  showToast(text, () => {}, { ...(o.removal ? { ms: TOAST_MS_REMOVAL } : {}), ...(o.heldAtMs ? { demoHeldAtMs: o.heldAtMs } : {}) });
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
