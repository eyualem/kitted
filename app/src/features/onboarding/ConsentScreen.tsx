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
import { IconButton, KButton, KText, TextLink, radius, space, useTheme } from '@/design-system';
import * as WebBrowser from 'expo-web-browser';
import { PRIVACY_URL } from '@/config/links';
import { store } from '@/data/db';
import { t, type StringKey } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { dropAfterConsent, resumeAfterConsent } from '@/features/camera/startCheck';
import { giveConsent } from './complete';
import { declineAgreement } from './firstCheckOffer';

type Clause = { title: StringKey; body?: StringKey; bullets?: StringKey[] };
const CLAUSES: Clause[] = [
  { title: 'onb.consent.sentTitle', body: 'onb.consent.sentBody', bullets: ['onb.consent.sent1', 'onb.consent.sent2', 'onb.consent.sent3'] },
  { title: 'onb.consent.notTitle', body: 'onb.consent.notBody' },
  { title: 'onb.consent.keptTitle', bullets: ['onb.consent.kept1', 'onb.consent.kept2', 'onb.consent.kept3'] },
  { title: 'onb.consent.aiTitle', body: 'onb.consent.aiBody' },
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

  const panel = (
    <View style={[styles.panel, { borderColor: colors.ink3, backgroundColor: colors.surface }]}>
      <View style={[styles.panelHeader, { backgroundColor: colors.surface2, borderBottomColor: colors.ink3 }]}>
        <KText variant="subheadline" weight="600" accessibilityRole="header">
          {t('onb.consent.panelHeader')}
        </KText>
      </View>
      {CLAUSES.map((c, i) => (
        <View
          key={c.title}
          style={[styles.clause, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
          accessible
          accessibilityLabel={[`${i + 1}.`, t(c.title), c.body ? t(c.body, { provider }) : '', ...(c.bullets ?? []).map((b) => t(b))].filter(Boolean).join(' ')}
        >
          <KText variant="subheadline" weight="700" style={styles.num}>{i + 1}</KText>
          <View style={{ flex: 1, gap: 4 }}>
            <KText variant="subheadline" weight="600">{t(c.title)}</KText>
            {c.body ? <KText variant="footnote" color="ink2">{t(c.body, { provider })}</KText> : null}
            {(c.bullets ?? []).map((b) => (
              <View key={b} style={{ flexDirection: 'row', gap: 6 }}>
                <KText variant="footnote" color="ink2">•</KText>
                <KText variant="footnote" color="ink2" style={{ flex: 1 }}>{t(b)}</KText>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: mode === 'sheet' ? space.l : insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.barSide} />
        <KText variant="headline" accessibilityRole="header" style={styles.barTitle}>
          {t('onb.consent.title')}
        </KText>
        <View style={[styles.barSide, { alignItems: 'flex-end' }]}>
          <IconButton icon="close" label={t('common.close')} onPress={close} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.thread}>
        {/* Plain text, no Kit bubble (T39, OS3). */}
        <KText testID="consent-intro" variant="subheadline" color="ink2" style={{ paddingHorizontal: 4 }}>
          {t('onb.consent.lead')}
        </KText>
        {panel}
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: 4 }}>
          {t('onb.consent.footerPath')}
        </KText>
        {PRIVACY_URL ? (
          <View style={styles.links}>
            <TextLink title={t('onb.consent.policy')} color="ink" onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL!)} />
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.l), borderTopColor: colors.line }]}>
        <KText testID="consent-agree-line" variant="footnote" color="ink3" style={styles.agreeLine}>
          {t('onb.consent.agreeLine')}
        </KText>
        <KButton title={t('onb.consent.agreeLater')} onPress={() => void finish(true)} disabled={busy} />
        <KButton title={t('onb.consent.notNow')} kind="secondary" onPress={() => void finish(false)} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, minHeight: 44 },
  barSide: { width: 44 },
  barTitle: { flex: 1, textAlign: 'center' },
  thread: { paddingHorizontal: space.gutter, paddingTop: space.m, paddingBottom: space.xl, gap: space.m },
  // A bordered page, like a document: a header strip and numbered clauses (Nov 19, SY5).
  panel: { borderWidth: 1.5, borderRadius: radius.thumb, overflow: 'hidden' },
  panelHeader: { paddingVertical: 9, paddingHorizontal: 14, borderBottomWidth: 1.5 },
  clause: { flexDirection: 'row', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  num: { width: 18 },
  // A hairline over the dock so the scrolling text doesn't end in a hard cut under the buttons (09 UI review).
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  agreeLine: { textAlign: 'center', paddingHorizontal: 6 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingHorizontal: 4 },
});
