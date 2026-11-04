// A1 · Sign in (10-onboarding.md §4.1–§4.2): one sheet for every way in (Welcome, the save offer, You → Settings).
// Apple, Google and email, the same size, with a line that says it's optional. Email swaps the sheet's body in place:
// the address, then the 6-digit code. What a sign-in leads to (restore, set up, which fits to keep, the age stop) is
// decided by afterSignIn; this screen only shows it.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { KButton, KText, TextLink, space, useTheme } from '@/design-system';
import { CONTROL_TEXT_MAX_SCALE, size } from '@/design-system/tokens';
import { textStyles } from '@/design-system/typography';
import { store } from '@/data/db';
import { PRIVACY_URL, TERMS_URL } from '@/config/links';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { showToast } from '@/features/toast/toast';
import { setResumeStep } from '@/features/onboarding/resume';
import { t } from '@/i18n/en';
import { afterSignIn, auth, liveProviders, restoreParam, saveAccount, type SignInFrom } from './account';
import type { AuthProvider, SignInResult } from './auth';
import { cleanCode, cleanEmail, countdown, isCompleteCode, isValidEmail, resendLeft, CODE_LENGTH } from './email';
import { ProviderButton } from './ProviderButton';

type View_ = 'options' | 'email' | 'code';
type Problem = { kind: 'failed'; provider: AuthProvider } | { kind: 'offline' } | { kind: 'wrongCode' } | { kind: 'expired' } | null;

const providerName = (p: AuthProvider) => t(`acct.provider.${p}`);
/** The resend countdown runs on the wall clock (not the demo clock): it's about real seconds. */
const wallNow = () => Date.now();

export function SignInSheet() {
  const { colors } = useTheme();
  // `step` and `email` open the email steps directly (demo screens 134–135).
  const params = useLocalSearchParams<{ from?: string; step?: string; email?: string }>();
  const from: SignInFrom = params.from === 'welcome' || params.from === 'offer' ? params.from : 'settings';
  const live = liveProviders();
  const [view, setView] = useState<View_>(params.step === 'email' ? 'email' : params.step === 'code' && params.email ? 'code' : 'options');
  const [busy, setBusy] = useState<AuthProvider | 'send' | 'verify' | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(() => (params.step === 'code' ? wallNow() : null));
  const [now, setNow] = useState(() => wallNow());
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);
  // The resend countdown ticks only while the code step is open.
  useEffect(() => {
    if (view !== 'code') return;
    const h = setInterval(() => setNow(wallNow()), 1000);
    return () => clearInterval(h);
  }, [view]);

  const title = view === 'email' ? t('acct.email.title') : view === 'code' ? t('acct.code.title') : t(from === 'welcome' ? 'acct.sheet.welcome.title' : from === 'offer' ? 'acct.sheet.offer.title' : 'acct.sheet.settings.title');

  /** A finished sign-in: close the sheet and go where afterSignIn says. */
  const finish = async (provider: AuthProvider, r: Extract<SignInResult, { kind: 'ok' }>) => {
    const next = await afterSignIn(store, from, r);
    if (!alive.current) return;
    const done = () => {
      router.back();
      showToast(t('acct.signedIn', { provider: providerName(provider) }));
    };
    switch (next.next) {
      case 'restore':
        // His birth year first: it never syncs, so every new phone asks (the age gate), then A4 brings his fits back.
        await setResumeStep(store, 'basics');
        router.back();
        setTimeout(() => router.push({ pathname: '/onboarding/basics', params: { restore: restoreParam(next.holdings) } }), 350);
        return;
      case 'setup':
        await setResumeStep(store, 'looks');
        router.back();
        showToast(t('onb.setup.newAccount'));
        setTimeout(() => router.push('/onboarding/looks'), 350);
        return;
      case 'choose': {
        const keep = async (mode: 'merge' | 'replace') => {
          // The backup reads the choice when it joins the account (#386): Use the account's deletes this phone's own
          // rows before the account's come down. On the stand-in it's never read.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          await (require('@/sync/appBackup') as typeof import('@/sync/appBackup')).backup.setJoinMode(mode);
          await saveAccount(store, next.user);
          done();
        };
        // A5: nothing is deleted without a second yes.
        Alert.alert(
          t('acct.choose.title'),
          t('acct.choose.body', { provider: providerName(provider), fits: next.holdings.fits, local: next.localFits }),
          [
            { text: t('acct.choose.keepBoth'), style: 'default', onPress: () => void keep('merge') },
            {
              text: t('acct.choose.useAccount'),
              onPress: () =>
                Alert.alert(t('acct.choose.confirmTitle'), t('acct.choose.confirmBody', { local: next.localFits }), [
                  { text: t('common.cancel'), style: 'cancel', onPress: () => setBusy(null) },
                  { text: t('acct.choose.confirmYes'), style: 'destructive', onPress: () => void keep('replace') },
                ]),
            },
            { text: t('common.cancel'), style: 'cancel', onPress: () => setBusy(null) },
          ],
        );
        return;
      }
      case 'done':
        done();
    }
  };

  /** Shared by every way in: cancelled is silent, a failure or no connection says one plain line. */
  const settle = async (provider: AuthProvider, r: SignInResult | { kind: 'wrongCode' } | { kind: 'expired' }) => {
    if (!alive.current) return;
    if (r.kind === 'ok') return finish(provider, r);
    setBusy(null);
    if (r.kind === 'cancelled') return;
    if (r.kind === 'failed') setProblem({ kind: 'failed', provider });
    else if (r.kind === 'offline') setProblem({ kind: 'offline' });
    else if (r.kind === 'wrongCode') {
      // Cleared for the next try (keeping it meant deleting six digits first).
      setProblem({ kind: 'wrongCode' });
      setCode('');
    }
    else if (r.kind === 'expired') {
      setProblem({ kind: 'expired' });
      setCode('');
      setSentAt(wallNow());
      void auth.sendEmailCode(cleanEmail(email));
    }
  };

  const withProvider = async (provider: 'apple' | 'google') => {
    if (busy) return;
    setBusy(provider);
    setProblem(null);
    const r = await auth.signIn(provider);
    // A finished sign-in keeps its spinner until the sheet closes or the A5 question is answered.
    if (r.kind === 'ok') return void finish(provider, r);
    await settle(provider, r);
  };

  const sendCode = async (again = false) => {
    if (busy || !isValidEmail(email)) return;
    setBusy('send');
    setProblem(null);
    const r = await auth.sendEmailCode(cleanEmail(email));
    if (!alive.current) return;
    setBusy(null);
    if (r.kind === 'sent') {
      setSentAt(wallNow());
      setNow(wallNow());
      setCode('');
      setView('code');
      if (again) showToast(t('acct.code.resent'));
    } else setProblem(r.kind === 'offline' ? { kind: 'offline' } : { kind: 'failed', provider: 'email' });
  };

  const verify = async (value: string) => {
    if (busy || !isCompleteCode(value)) return;
    setBusy('verify');
    setProblem(null);
    const r = await auth.verifyEmailCode(cleanEmail(email), value);
    if (r.kind === 'ok') return void finish('email', r);
    await settle('email', r);
  };

  const problemLine = problem ? (
    <KText variant="footnote" color="ink" accessibilityRole="alert" style={{ paddingHorizontal: 4 }}>
      {problem.kind === 'failed' ? t('acct.failed', { provider: providerName(problem.provider) }) : problem.kind === 'offline' ? t('acct.offline') : problem.kind === 'wrongCode' ? t('acct.code.wrong') : t('acct.code.expired')}
    </KText>
  ) : null;

  const inputStyle = {
    borderWidth: 1, borderColor: colors.line, borderRadius: 22, borderCurve: 'continuous' as const, minHeight: size.buttonLarge,
    paddingHorizontal: space.l, paddingVertical: space.s, fontSize: textStyles.body.fontSize, color: colors.ink, backgroundColor: colors.surface,
  };

  if (view === 'email') {
    return (
      <SheetScaffold title={title} onClose={() => router.back()}>
        <View style={{ gap: space.m }}>
          <TextInput
            autoFocus
            value={email}
            onChangeText={(v) => { setEmail(v); setProblem(null); }}
            placeholder={t('acct.email.placeholder')}
            placeholderTextColor={colors.ink3}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="send"
            onSubmitEditing={() => void sendCode()}
            accessibilityLabel={t('acct.email.label')}
            maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
            style={inputStyle}
          />
          <KText variant="footnote" color="ink2" style={{ paddingHorizontal: 4 }}>
            {t('acct.email.hint')}
          </KText>
          {problemLine}
          <KButton title={t('acct.email.send')} onPress={() => void sendCode()} disabled={!isValidEmail(email)} loading={busy === 'send'} />
          <View style={{ alignItems: 'center' }}>
            <TextLink title={t('acct.email.otherWays')} color="ink2" onPress={() => { setProblem(null); setView('options'); }} />
          </View>
        </View>
      </SheetScaffold>
    );
  }

  if (view === 'code') {
    const left = resendLeft(sentAt, now);
    return (
      <SheetScaffold title={title} onClose={() => router.back()}>
        <View style={{ gap: space.m }}>
          <KText variant="body" color="ink2">
            {t('acct.code.body', { email: cleanEmail(email) })}
          </KText>
          <TextInput
            autoFocus
            value={code}
            onChangeText={(v) => {
              const c = cleanCode(v);
              setCode(c);
              if (c.length > 0 && (problem?.kind === 'wrongCode' || problem?.kind === 'expired')) setProblem(null);
              if (isCompleteCode(c)) void verify(c);
            }}
            placeholder={'•'.repeat(CODE_LENGTH)}
            placeholderTextColor={colors.inkFaint}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH + 4}
            editable={busy !== 'verify'}
            accessibilityLabel={t('acct.code.label')}
            maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
            style={[inputStyle, { fontSize: textStyles.title2.fontSize, letterSpacing: 8, textAlign: 'center', fontVariant: ['tabular-nums'] }]}
          />
          {busy === 'verify' ? (
            <KText variant="footnote" color="ink2" style={{ textAlign: 'center' }}>
              {t('acct.code.checking')}
            </KText>
          ) : null}
          {problemLine}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.m }}>
            <TextLink
              title={left > 0 ? t('acct.code.resendIn', { time: countdown(left) }) : t('acct.code.resend')}
              color={left > 0 ? 'ink2' : 'ink'}
              onPress={left > 0 || busy ? undefined : () => void sendCode(true)}
            />
            <TextLink title={t('acct.code.otherEmail')} color="ink2" onPress={() => { setProblem(null); setCode(''); setView('email'); }} />
          </View>
        </View>
      </SheetScaffold>
    );
  }

  const legal = TERMS_URL && PRIVACY_URL;
  return (
    <SheetScaffold title={title} onClose={() => router.back()}>
      <View style={{ gap: space.m }}>
        <KText variant="body" color="ink2">
          {t(from === 'welcome' ? 'acct.sheet.welcome.body' : 'acct.sheet.save.body')}
        </KText>
        {problemLine}
        <View style={{ gap: 10 }}>
          {(['apple', 'google'] as const).filter((p) => live.includes(p)).map((p) => (
            <ProviderButton key={p} provider={p} busy={busy === p} disabled={busy !== null} onPress={() => void withProvider(p)} />
          ))}
          {live.includes('email') && <ProviderButton provider="email" busy={false} disabled={busy !== null} onPress={() => { setProblem(null); setView('email'); }} />}
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
        {from === 'welcome' ? (
          <View style={{ alignItems: 'center' }}>
            <TextLink title={t('acct.imNew')} color="ink2" onPress={() => router.back()} />
          </View>
        ) : null}
      </View>
    </SheetScaffold>
  );
}
