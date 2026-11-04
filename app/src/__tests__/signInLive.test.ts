// Continue with Apple and Google, real in Release (handoff/10-onboarding.md §12, checks SI1–SI5, SI7, SI8, SI10, SI11).
// Firebase and the providers' sheets are fakes here; firebase/tests/link.test.ts checks Firebase itself (SI6) and
// firebase/tests/functions.test.ts the server's deleteAccount (SI9).
import { ACCOUNTS_BUILT, SIGN_IN_LIVE, signInLive } from '@/config/features';
import { GOOGLE_IOS_CLIENT_ID } from '@/config/firebase';
import { availableProviders } from '@/features/account/account';
import { createSignIn, type AppleCredential, type Cred, type FbUser, type SignInDeps } from '@/features/account/signIn';

declare const __dirname: string;
declare const require: (id: string) => unknown;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const coded = (code: string) => Object.assign(new Error(code), { code });

/** A phone: Firebase's current user, the accounts Firebase knows (identity → uid), and every call made. */
function fakes(o: { user?: FbUser | null; known?: Record<string, string>; loadsLate?: boolean; apple?: Partial<AppleCredential> | Error; appleAvailable?: boolean; google?: { idToken: string | null; email: string | null } | null | Error; linkError?: Error; serverError?: Error } = {}) {
  let user: FbUser | null = o.loadsLate ? null : (o.user ?? null);
  const known: Record<string, string> = { ...(o.known ?? {}) };
  const calls: string[] = [];
  const nonces: { raw: string; hashed: string }[] = [];
  const creds: { providerId: string; idToken: string; rawNonce?: string }[] = [];
  let k = 0;
  const identity = (c: Cred) => `${c.providerId}:${(c as unknown as { idToken: string }).idToken}`;
  const deps: SignInDeps = {
    async ready() {
      calls.push('ready');
      if (o.loadsLate) user = o.user ?? null;
    },
    current: () => user,
    apple: {
      available: async () => o.appleAvailable ?? true,
      async signIn(hashed) {
        calls.push(`apple:${hashed}`);
        if (o.apple instanceof Error) throw o.apple;
        return { identityToken: 'apple-token', authorizationCode: 'apple-code', email: 'x@privaterelay.appleid.com', ...(o.apple ?? {}) };
      },
    },
    google: {
      async signIn() {
        calls.push('google');
        if (o.google instanceof Error) throw o.google;
        return o.google === undefined ? { idToken: 'google-token', email: 'him@gmail.com' } : o.google;
      },
      signOut: async () => void calls.push('google:signOut'),
      revoke: async () => void calls.push('google:revoke'),
    },
    async nonce() {
      const raw = `raw-${++k}`;
      const n = { raw, hashed: `sha256(${raw})` };
      nonces.push(n);
      return n;
    },
    appleCred: (idToken, rawNonce) => {
      const c = { providerId: 'apple.com', idToken, rawNonce };
      creds.push(c);
      return c;
    },
    googleCred: (idToken) => {
      const c = { providerId: 'google.com', idToken };
      creds.push(c);
      return c;
    },
    credFromError: (e) => ((e as { credential?: Cred }).credential ?? null),
    async link(c) {
      calls.push(`link:${c.providerId}`);
      if (o.linkError) throw o.linkError;
      const id = identity(c);
      if (known[id]) throw Object.assign(coded('auth/credential-already-in-use'), { credential: { ...c, fromError: true } });
      known[id] = user!.uid;
      user = { ...user!, isAnonymous: false, email: null };
      return user;
    },
    async signInWith(c) {
      calls.push(`signIn:${c.providerId}${(c as { fromError?: boolean }).fromError ? ':fromError' : ''}`);
      const id = identity(c);
      known[id] ??= `new-${id}`;
      user = { uid: known[id], email: 'him@gmail.com', isAnonymous: false };
      return user;
    },
    signOut: async () => {
      calls.push('signOut');
      user = null;
    },
    revokeApple: async (code) => void calls.push(`revokeApple:${code}`),
    async deleteOnServer() {
      calls.push('deleteOnServer');
      if (o.serverError) throw o.serverError;
    },
    holdingsOf: async () => null,
    now: () => 1000,
    log: () => {},
  };
  return { svc: createSignIn(deps), calls, nonces, creds, known, current: () => user };
}

const GUEST: FbUser = { uid: 'guest-1', email: null, isAnonymous: true };

describe('SI1 · one switch: Apple and Google together in Release', () => {
  it('Release: nothing until accounts are on and the team is paid; then Apple and Google; never Google alone; never email', () => {
    expect(signInLive({ accountsBuilt: false, applePaid: true, dev: false })).toEqual([]);
    expect(signInLive({ accountsBuilt: true, applePaid: false, dev: false })).toEqual([]);
    expect(signInLive({ accountsBuilt: true, applePaid: true, dev: false })).toEqual(['apple', 'google']);
    for (const accountsBuilt of [false, true]) {
      for (const applePaid of [false, true]) {
        const live = signInLive({ accountsBuilt, applePaid, dev: false });
        expect(live).not.toContain('email');
        if (live.includes('google')) expect(live).toContain('apple');
      }
    }
  });

  it('dev builds: Google, plus Apple once the team is paid; accounts stay off for his phone', () => {
    expect(signInLive({ accountsBuilt: false, applePaid: false, dev: true })).toEqual(['google']);
    expect(signInLive({ accountsBuilt: false, applePaid: true, dev: true })).toEqual(['apple', 'google']);
    expect(ACCOUNTS_BUILT).toBe(false);
    expect(src('config/features.ts')).toMatch(/export const SIGN_IN_LIVE = signInLive\(\{ accountsBuilt: ACCOUNTS_BUILT, applePaid: APPLE_PAID, dev: __DEV__ \}\);/);
    expect(SIGN_IN_LIVE).not.toContain('email');
  });

  it('a build without Apple\'s module, Google\'s client, the Firebase key or iOS offers only what can work (SI3)', () => {
    const base = { live: ['apple', 'google'] as const, ios: true, firebaseKey: true, googleClient: true, appleModule: true };
    expect(availableProviders(base)).toEqual(['apple', 'google']);
    expect(availableProviders({ ...base, appleModule: false })).toEqual(['google']);
    expect(availableProviders({ ...base, googleClient: false })).toEqual(['apple']);
    expect(availableProviders({ ...base, firebaseKey: false })).toEqual([]);
    expect(availableProviders({ ...base, ios: false })).toEqual([]);
  });
});

describe('SI2 · Apple\'s request', () => {
  it('a fresh nonce each try: Apple gets the hash, Firebase the raw one, under apple.com', async () => {
    const f = fakes({ user: GUEST });
    await f.svc.signIn('apple');
    await f.svc.signOut();
    await f.svc.signIn('apple');
    expect(f.nonces).toHaveLength(2);
    expect(f.nonces[0].raw).not.toBe(f.nonces[1].raw);
    expect(f.calls.filter((c) => c.startsWith('apple:'))).toEqual(f.nonces.map((n) => `apple:${n.hashed}`));
    expect(f.creds.filter((c) => c.providerId === 'apple.com').map((c) => c.rawNonce)).toEqual(f.nonces.map((n) => n.raw));
  });

  it('the real wiring: the email scope only, never his name; the nonce is SHA-256 from expo-crypto (SI11)', () => {
    const wiring = src('features/account/firebaseAuth.ts');
    expect(wiring).toMatch(/requestedScopes: \[AppleAuthentication\.AppleAuthenticationScope\.EMAIL\], nonce: hashedNonce/);
    expect(wiring).not.toMatch(/FULL_NAME/);
    expect(wiring).toMatch(/Crypto\.digestStringAsync\(Crypto\.CryptoDigestAlgorithm\.SHA256, raw\)/);
    expect(wiring).toMatch(/new OAuthProvider\('apple\.com'\)\.credential\(\{ idToken, rawNonce \}\)/);
    // The config plugin isn't used: the entitlement comes only from the paid-team switch.
    expect(src('../app.config.ts')).not.toMatch(/'expo-apple-authentication'/);
  });
});

describe('SI3 · Apple\'s and Google\'s outcomes', () => {
  it('a close is silent; no token fails; a network error is offline; Apple unavailable fails', async () => {
    expect(await fakes({ user: GUEST, apple: coded('ERR_REQUEST_CANCELED') }).svc.signIn('apple')).toEqual({ kind: 'cancelled' });
    expect(await fakes({ user: GUEST, apple: { identityToken: null } }).svc.signIn('apple')).toEqual({ kind: 'failed' });
    expect(await fakes({ user: GUEST, appleAvailable: false }).svc.signIn('apple')).toEqual({ kind: 'failed' });
    expect(await fakes({ user: GUEST, google: null }).svc.signIn('google')).toEqual({ kind: 'cancelled' });
    expect(await fakes({ user: GUEST, google: coded('kitted/cancelled') }).svc.signIn('google')).toEqual({ kind: 'cancelled' });
    expect(await fakes({ user: GUEST, google: { idToken: null, email: null } }).svc.signIn('google')).toEqual({ kind: 'failed' });
    expect(await fakes({ user: GUEST, linkError: coded('auth/network-request-failed') }).svc.signIn('google')).toEqual({ kind: 'offline' });
  });
});

describe('SI4 · the guest keeps its uid', () => {
  for (const p of ['apple', 'google'] as const) {
    it(`${p}: waits for the saved sign-in, links the guest, returns the guest's uid`, async () => {
      // The saved guest loads only after ready(): deciding before it would sign in fresh and orphan the guest.
      const f = fakes({ user: GUEST, loadsLate: true });
      const r = await f.svc.signIn(p);
      expect(r).toMatchObject({ kind: 'ok', user: { uid: 'guest-1', provider: p, signedInAt: 1000 }, holdings: null });
      expect(f.calls.indexOf('ready')).toBeLessThan(f.calls.indexOf(`link:${p}.com`));
      expect(f.calls.some((c) => c.startsWith('signIn:'))).toBe(false);
    });
  }

  it('the email falls back to the provider\'s when Firebase has none', async () => {
    const r = await fakes({ user: GUEST }).svc.signIn('google');
    expect(r).toMatchObject({ kind: 'ok', user: { email: 'him@gmail.com' } });
  });
});

describe('SI5 · a second phone', () => {
  it('the identity already has an account: signs in to it with the error\'s credential; the uid is the account\'s', async () => {
    const f = fakes({ user: { uid: 'guest-2', email: null, isAnonymous: true }, known: { 'apple.com:apple-token': 'account-1' } });
    const r = await f.svc.signIn('apple');
    expect(r).toMatchObject({ kind: 'ok', user: { uid: 'account-1', provider: 'apple' } });
    expect(f.calls).toContain('signIn:apple.com:fromError');
  });

  it('no guest yet: signs in; any other link error is reported and nothing is signed in', async () => {
    const f = fakes({ user: null });
    expect(await f.svc.signIn('google')).toMatchObject({ kind: 'ok', user: { uid: 'new-google.com:google-token' } });
    const g = fakes({ user: GUEST, linkError: coded('auth/internal-error') });
    expect(await g.svc.signIn('google')).toEqual({ kind: 'failed' });
    expect(g.current()).toEqual(GUEST);
  });
});

describe('SI7 · Sign out', () => {
  it('Google and Firebase sign out; a Google sign-out error doesn\'t stop Firebase\'s', async () => {
    const f = fakes({ user: GUEST });
    await f.svc.signIn('google');
    await f.svc.signOut();
    expect(f.calls.slice(-2)).toEqual(['google:signOut', 'signOut']);
    expect(f.current()).toBeNull();
  });

  it('the account row goes and the fits stay (AC4): account.ts signOut deletes only account.user', () => {
    expect(src('features/account/account.ts')).toMatch(/await service\.signOut\(\);\n {2}await store\.deleteKv\(ACCOUNT_KEY\);\n\}/);
  });
});

describe('SI8 · Delete account', () => {
  it('Apple: a fresh code is revoked, then the server deletes; then signed out', async () => {
    const f = fakes({ user: GUEST });
    await f.svc.signIn('apple');
    expect(await f.svc.deleteAccount('apple')).toEqual({ kind: 'ok' });
    const tail = f.calls.slice(f.calls.lastIndexOf('ready'));
    expect(tail).toEqual(['ready', expect.stringMatching(/^apple:/), 'revokeApple:apple-code', 'deleteOnServer', 'signOut']);
  });

  it('Google: access revoked, then the server', async () => {
    const f = fakes({ user: GUEST });
    await f.svc.signIn('google');
    expect(await f.svc.deleteAccount('google')).toEqual({ kind: 'ok' });
    expect(f.calls.slice(-3)).toEqual(['google:revoke', 'deleteOnServer', 'signOut']);
  });

  it('a closed Apple sheet or a server failure deletes nothing and fails; offline says so', async () => {
    const closed = fakes({ user: GUEST, apple: coded('ERR_REQUEST_CANCELED') });
    expect(await closed.svc.deleteAccount('apple')).toEqual({ kind: 'failed' });
    expect(closed.calls).not.toContain('deleteOnServer');
    const server = fakes({ user: { ...GUEST, isAnonymous: false }, serverError: coded('functions/internal') });
    expect(await server.svc.deleteAccount('google')).toEqual({ kind: 'failed' });
    expect(server.current()).not.toBeNull();
    const offline = fakes({ user: { ...GUEST, isAnonymous: false }, serverError: coded('functions/unavailable') });
    expect(await offline.svc.deleteAccount('google')).toEqual({ kind: 'offline' });
  });

  it('the phone is wiped only after the account is gone (actions.ts), with the provider he signed in with', () => {
    const a = src('features/account/actions.ts');
    expect(a).toMatch(/auth\.deleteAccount\(\(await getAccount\(store\)\)\?\.provider\)/);
    expect(a.indexOf("if (r.kind !== 'ok')")).toBeLessThan(a.indexOf('await runDeleteAllData()'));
    expect(src('features/account/firebaseAuth.ts')).toMatch(/httpsCallable\(fns, 'deleteAccount'\)/);
  });
});

describe('SI10 · Google in Release', () => {
  it('the URL scheme is the reversed iOS client ID, in the config and in check:app', () => {
    const reversed = `com.googleusercontent.apps.${GOOGLE_IOS_CLIENT_ID.replace('.apps.googleusercontent.com', '')}`;
    expect(src('../app.config.ts')).toContain(`['@react-native-google-signin/google-signin', { iosUrlScheme: '${reversed}' }]`);
    const { GOOGLE_URL_SCHEME, checkApp } = require('../../scripts/check-release-app.js') as { GOOGLE_URL_SCHEME: string; checkApp: (a: unknown) => string[] };
    expect(GOOGLE_URL_SCHEME).toBe(reversed);
    const problems = checkApp({ info: {}, privacy: null, entitlements: {}, paid: false });
    expect(problems.some((p) => /Google sign-in's URL scheme/.test(p))).toBe(true);
  });
});
