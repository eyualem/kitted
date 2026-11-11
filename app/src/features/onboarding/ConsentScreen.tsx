// The agreement (02 D4; text from inputs/app-store-and-age-rules.md §3, ruling 16). Two ways in: inside the camera,
// the first time he opens it without having agreed ("Agree" turns the same screen into the camera); and as a sheet
// with an X (You › Privacy, the "Turn on fit checks" card, or a photo that was held back). Nothing is pre-checked: only
// "Agree" counts, and "Not now" is the same size. The privacy-policy link waits for PRIVACY_URL (config/links.ts)
// rather than leading nowhere. Since T39 (specs/onboarding-screens.md OS3) setup has no agreement step, the intro is
// plain text (no Kit bubble), and in the camera "Not now" or the X after a new setup posts "Turn on fit checks" once
// (declineAgreement); the camera's words stay today's (DECISIONS-LOG #426).
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, KButton, KCard, KText, TextLink, space, useTheme } from '@/design-system';
import * as WebBrowser from 'expo-web-browser';
import { PRIVACY_URL } from '@/config/links';
import { store } from '@/data/db';
import { t, type StringKey } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { dropAfterConsent, resumeAfterConsent } from '@/features/camera/startCheck';
import { giveConsent } from './complete';
import { declineAgreement } from './firstCheckOffer';

type Row = { icon: string; title: StringKey; body?: StringKey; bullets?: StringKey[] };
const ROWS: Row[] = [
  { icon: 'face.dashed', title: 'onb.consent.sentTitle', body: 'onb.consent.sentBody', bullets: ['onb.consent.sent1', 'onb.consent.sent2', 'onb.consent.sent3'] },
  { icon: 'hand.raised', title: 'onb.consent.notTitle', body: 'onb.consent.notBody' },
  { icon: 'iphone', title: 'onb.consent.keptTitle', bullets: ['onb.consent.kept1', 'onb.consent.kept2', 'onb.consent.kept3'] },
  { icon: 'info.circle', title: 'onb.consent.aiTitle', body: 'onb.consent.aiBody' },
];

/** After "Agree" (sheet only): 'camera' opens it; 'close' just closes (You › Privacy); 'resume' closes and scores the
 *  photo that was waiting for the agreement (startCheck). In the camera (`onAgreed`), the camera takes over in place. */
export type AfterAgree = 'camera' | 'close' | 'resume';

export function ConsentScreen({ mode, after = 'camera', onAgreed }: { mode: 'sheet' | 'camera'; after?: AfterAgree; onAgreed?: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const provider = t('config.providerDefault');
  // A photo held for the agreement is dropped however the sheet closes without "Agree" (X, Not now, a swipe down).
  useEffect(() => (after === 'resume' ? dropAfterConsent : undefined), [after]);

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
    if (mode === 'camera') {
      if (!consent) return decline();
      await giveConsent(store, now);
      return onAgreed?.();
    }
    if (consent) await giveConsent(store, now);
    router.back();
    if (consent && after === 'resume') resumeAfterConsent();
    if (consent && after === 'camera') setTimeout(() => router.push('/camera'), 350);
  };

  // Not now or the X in the camera: after a new setup, Stylist says how to turn fit checks on (once); then close.
  const decline = async () => {
    try {
      await declineAgreement(store, sessionClock.nowMs(), newId);
    } catch (e: unknown) {
      console.error('Consent decline failed', e);
    }
    router.back();
  };
  const close = () => {
    if (mode === 'camera') {
      if (busy) return;
      setBusy(true);
      void decline().finally(() => setBusy(false));
      return;
    }
    router.back();
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
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: mode === 'sheet' ? space.l : insets.top }]}>
      <View style={styles.closeRow}>
        <IconButton icon="close" label={t('common.close')} onPress={close} />
      </View>
      <ScrollView contentContainerStyle={styles.thread}>
        {/* Plain text, no Kit bubble (T39, OS3). */}
        <KText testID="consent-intro" variant="body" color="ink">
          {t('onb.consent.introLater')}
        </KText>
        {rows}
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: 4 }}>
          {t('onb.consent.footerPath')}
        </KText>
        {PRIVACY_URL ? (
          <View style={styles.links}>
            <TextLink title={t('acct.privacy')} color="ink2" onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL!)} />
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.l), borderTopColor: colors.line }]}>
        <KButton title={t('onb.consent.agreeLater')} onPress={() => void finish(true)} disabled={busy} />
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
  // A hairline over the dock so the scrolling text doesn't end in a hard cut under the buttons (09 UI review).
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingHorizontal: 4 },
});
