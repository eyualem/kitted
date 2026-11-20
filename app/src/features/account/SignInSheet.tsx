// A1 · Sign in (specs/sign-in-and-backup.md SB2): one sheet for every way in (Welcome's "I already have an account", the
// save card, You's account rows). Continue with Apple first, then Google, the same size, and a line that says it's
// optional. What a sign-in leads to (restore, set up, which fits to keep, the age stop) is decided by afterSignIn; this
// screen only shows it. Apple's first name goes to an empty name only (applyAppleFirstName, SB10). After a sign-in that keeps the
// account here, the last step offers photo backup once (SB4, PhotoStep); a restore offers it at its own end.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { KText, TextLink, space } from '@/design-system';
import { rawStore, store } from '@/data/db';
import { PRIVACY_URL, TERMS_URL } from '@/config/links';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { showToast } from '@/features/toast/toast';
import { setResumeStep } from '@/features/onboarding/resume';
import { t } from '@/i18n/en';
import { getDemoArgs } from '@/state/session';
import { photoStepFor } from '@/sync/photoBackup';
import { afterSignIn, liveProviders, resolveChoice, restoreParam, sheetProviders, auth, type SignInFrom } from './account';
import { accountRemote } from './accountRemote';
import { applyAppleFirstName } from './appleName';
import type { AuthProvider, SignInResult } from './auth';
import { PhotoStep } from './PhotoStep';
import { ProviderButton } from './ProviderButton';
import { accountChoice } from './restore';

type Problem = { kind: 'failed'; provider: AuthProvider } | { kind: 'offline' } | null;

const providerName = (p: AuthProvider) => t(`acct.provider.${p}`);

export function SignInSheet() {
  const params = useLocalSearchParams<{ from?: string; step?: string }>();
  const from: SignInFrom = params.from === 'welcome' || params.from === 'offer' ? params.from : 'settings';
  const providers = sheetProviders(liveProviders());
  const [busy, setBusy] = useState<AuthProvider | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  /** SB4's last step: shown in place of the buttons; `Back up photos too` or `Done` runs `next`. */
  // Demo screen 144 opens on it (`step=photos`); on his phone only a finished sign-in shows it.
  const [step, setStep] = useState<{ provider: AuthProvider; next: () => void } | null>(() =>
    params.step === 'photos' && getDemoArgs().demoScreen !== null ? { provider: 'apple', next: () => router.back() } : null,
  );
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const title = t(from === 'welcome' ? 'acct.sheet.welcome.title' : from === 'offer' ? 'acct.sheet.offer.title' : 'acct.sheet.settings.title');

  /** A finished sign-in: close the sheet and go where afterSignIn says. */
  const finish = async (provider: AuthProvider, r: Extract<SignInResult, { kind: 'ok' }>) => {
    const next = await afterSignIn(store, from, r);
    if (!alive.current) return;
    /** Apple's first name, once the account is kept (never for a cancelled choice). It goes nowhere but his own name. */
    const named = () => applyAppleFirstName(store, provider === 'apple' ? r.givenName : null);
    /** The photo step once (SB4), then `proceed`. Skipped when the account already has photo backup on or it was offered. */
    const afterPhotoStep = async (proceed: () => void) => {
      if (!alive.current) return;
      if ((await photoStepFor(rawStore)) === 'show') setStep({ provider, next: proceed });
      else proceed();
    };
    const done = async () => {
      await named();
      await afterPhotoStep(() => {
        router.back();
        showToast(t('acct.signedIn', { provider: providerName(provider) }));
      });
    };
    switch (next.next) {
      case 'restore':
        // His age first: it never syncs, so every new phone asks (the age gate), then A4 brings his fits back.
        await named();
        await setResumeStep(store, 'basics');
        router.back();
        setTimeout(() => router.push({ pathname: '/onboarding/basics', params: { restore: restoreParam(next.holdings) } }), 350);
        return;
      case 'setup':
        await named();
        await setResumeStep(store, 'looks');
        await afterPhotoStep(() => {
          router.back();
          showToast(t('onb.setup.newAccount'));
          setTimeout(() => router.push('/onboarding/looks'), 350);
        });
        return;
      case 'choose': {
        // A5 / SB7: nothing is deleted without a second yes. Which fits the account holds is read first (read-only), so "Use the
        // account's" deletes only this iPhone's fits that are not in it. If they can't be read, that choice isn't offered.
        const choice = await accountChoice(accountRemote(next.user.uid));
        if (!alive.current) return;
        const input = { user: next.user, inAccount: choice.ready ? choice.inAccount : [] };
        const stay = async () => {
          await resolveChoice(rawStore, 'cancel', input, auth);
          if (alive.current) setBusy(null);
        };
        // The choice's own writes go to the raw store: a fit removed here is the account's to keep, never a delete to send up.
        const keepBoth = async () => {
          await resolveChoice(rawStore, 'keepBoth', input, auth);
          await done();
        };
        const takeAccount = async () => {
          await resolveChoice(rawStore, 'useAccount', { ...input, confirmed: true }, auth);
          await done();
        };
        const useAccount = {
          text: t('acct.choose.useAccount'),
          onPress: () =>
            Alert.alert(t('acct.choose.confirmTitle'), t('acct.choose.confirmBody', { local: next.localFits }), [
              { text: t('common.cancel'), style: 'cancel' as const, onPress: () => void stay() },
              { text: t('acct.choose.confirmYes'), style: 'destructive' as const, onPress: () => void takeAccount() },
            ]),
        };
        Alert.alert(
          t('acct.choose.title'),
          t('acct.choose.body', { provider: providerName(provider), fits: next.holdings.fits, local: next.localFits }),
          [
            { text: t('acct.choose.keepBoth'), style: 'default', onPress: () => void keepBoth() },
            ...(choice.ready ? [useAccount] : []),
            { text: t('common.cancel'), style: 'cancel', onPress: () => void stay() },
          ],
        );
        return;
      }
      case 'done':
        await done();
    }
  };

  const withProvider = async (provider: AuthProvider) => {
    if (busy) return;
    setBusy(provider);
    setProblem(null);
    const r = await auth.signIn(provider);
    if (!alive.current) return;
    // A finished sign-in keeps its spinner until the sheet closes or the "both have fits" question is answered.
    if (r.kind === 'ok') return void finish(provider, r);
    setBusy(null);
    // Cancelled is silent; a failure or no connection says one plain line.
    if (r.kind === 'failed') setProblem({ kind: 'failed', provider });
    else if (r.kind === 'offline') setProblem({ kind: 'offline' });
  };

  const problemLine = problem ? (
    <KText variant="footnote" color="ink" accessibilityRole="alert" style={{ paddingHorizontal: 4 }}>
      {problem.kind === 'failed' ? t('acct.failed', { provider: providerName(problem.provider) }) : t('acct.offline')}
    </KText>
  ) : null;

  const legal = TERMS_URL && PRIVACY_URL;
  return (
    <SheetScaffold title={title} onClose={() => router.back()}>
      {step ? (
        <PhotoStep provider={step.provider} onDone={step.next} />
      ) : (
      <View style={{ gap: space.m }}>
        <KText variant="body" color="ink2">
          {t(from === 'welcome' ? 'acct.sheet.welcome.body' : 'acct.sheet.save.body')}
        </KText>
        {problemLine}
        <View style={{ gap: 10 }}>
          {providers.map((p) => (
            <ProviderButton key={p} provider={p} busy={busy === p} disabled={busy !== null} onPress={() => void withProvider(p)} />
          ))}
        </View>
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: 4 }}>
          {t('acct.optional')}
          {legal ? ` ${t('acct.legal')}` : ''}
        </KText>
        {legal ? (
          <View style={{ flexDirection: 'row', gap: 18, paddingHorizontal: 4 }}>
            <TextLink title={t('acct.terms')} color="ink2" compact onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL!)} />
            <TextLink title={t('acct.privacy')} color="ink2" compact onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL!)} />
          </View>
        ) : null}
      </View>
      )}
    </SheetScaffold>
  );
}
