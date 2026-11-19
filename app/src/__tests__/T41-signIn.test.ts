// T41 · Continue with Apple and Google, the sign-in's own rules (specs/sign-in-and-backup.md SB2, SB8, SB10;
// tasks/T41/TESTING.md): createSignIn with fakes for Firebase, Apple and Google. No network, no real sign-in.
// Reuses the fakes of the unmerged PR #58's signInLive.test.ts, rewritten to the spec (Apple gives a first name; no
// delete or revoke here, that is T41b).
import { createSignIn, type AppleCredential, type Cred, type FbUser, type SignInDeps } from '@/features/account/signIn';

jest.mock('expo-apple-authentication', () => ({}), { virtual: true });

const coded = (code: string) => Object.assign(new Error(code), { code });

/** A phone: Firebase's current user, the accounts Firebase knows (identity → uid), and every call made. */
function fakes(
  o: {
    user?: FbUser | null;
    known?: Record<string, string>;
    loadsLate?: boolean;
    apple?: Partial<AppleCredential> | Error;
    appleAvailable?: boolean;
    google?: { idToken: string | null; email: string | null } | null | Error;
    linkError?: Error;
    googleSignOutError?: Error;
    holdings?: { fits: number; pieces: number } | null;
  } = {},
) {
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
        return { identityToken: 'apple-token', authorizationCode: 'apple-code', email: 'x@privaterelay.appleid.com', givenName: null, familyName: null, ...(o.apple ?? {}) };
      },
    },
    google: {
      async signIn() {
        calls.push('google');
        if (o.google instanceof Error) throw o.google;
        return o.google === undefined ? { idToken: 'google-token', email: 'him@gmail.com' } : o.google;
      },
      async signOut() {
        calls.push('google:signOut');
        if (o.googleSignOutError) throw o.googleSignOutError;
      },
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
    credFromError: (e) => (e as { credential?: Cred }).credential ?? null,
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
    holdingsOf: async () => o.holdings ?? null,
    now: () => 1000,
    log: () => {},
  };
  return { svc: createSignIn(deps), calls, nonces, creds, known, current: () => user };
}

const GUEST: FbUser = { uid: 'g1', email: null, isAnonymous: true };

describe('SB2.3 · after sign-in the account ID is the guest\'s', () => {
  for (const p of ['apple', 'google'] as const) {
    it(`SB2.3 · ${p}: waits for the saved sign-in, links the guest, returns the guest's uid, never signs in fresh`, async () => {
      // The saved guest loads only after ready(): deciding before it would sign in fresh and orphan the guest.
      const f = fakes({ user: GUEST, loadsLate: true });
      const r = await f.svc.signIn(p);
      expect(r).toMatchObject({ kind: 'ok', user: { uid: 'g1', provider: p, signedInAt: 1000 }, holdings: null });
      expect(f.calls.indexOf('ready')).toBeGreaterThanOrEqual(0);
      expect(f.calls.indexOf('ready')).toBeLessThan(f.calls.indexOf(`link:${p}.com`));
      expect(f.calls.filter((c) => c.startsWith('signIn:'))).toEqual([]);
      expect(f.calls.filter((c) => c.startsWith('link:'))).toEqual([`link:${p}.com`]);
      // The guest is now this identity's account.
      expect(f.current()).toMatchObject({ uid: 'g1', isAnonymous: false });
    });
  }

  it('SB2.3 · the identity already has an account (a second phone): signs in with the credential from the error; the uid is the account\'s', async () => {
    for (const [p, key] of [['apple', 'apple.com:apple-token'], ['google', 'google.com:google-token']] as const) {
      const f = fakes({ user: { uid: 'g2', email: null, isAnonymous: true }, known: { [key]: 'account-1' } });
      const r = await f.svc.signIn(p);
      expect(r).toMatchObject({ kind: 'ok', user: { uid: 'account-1', provider: p } });
      expect(f.calls).toContain(`signIn:${p}.com:fromError`);
      expect(f.calls.filter((c) => c.startsWith('link:'))).toEqual([`link:${p}.com`]);
    }
  });

  it('SB2.3 · with no guest (or a user who is not a guest) it signs in and never links; any other link error fails and signs nothing in', async () => {
    const none = fakes({ user: null });
    expect(await none.svc.signIn('google')).toMatchObject({ kind: 'ok', user: { uid: 'new-google.com:google-token' } });
    expect(none.calls.some((c) => c.startsWith('link:'))).toBe(false);
    expect(none.calls).toContain('ready');

    const notGuest = fakes({ user: { uid: 'u9', email: 'a@b.c', isAnonymous: false } });
    await notGuest.svc.signIn('apple');
    expect(notGuest.calls.some((c) => c.startsWith('link:'))).toBe(false);

    const g = fakes({ user: GUEST, linkError: coded('auth/internal-error') });
    expect(await g.svc.signIn('google')).toEqual({ kind: 'failed' });
    expect(g.calls.some((c) => c.startsWith('signIn:'))).toBe(false);
    expect(g.current()).toEqual(GUEST);
  });

  it('SB2.3 · the email falls back to the provider\'s when Firebase has none, and the holdings are the account\'s (null until T41b)', async () => {
    const r = await fakes({ user: GUEST }).svc.signIn('google');
    expect(r).toMatchObject({ kind: 'ok', user: { email: 'him@gmail.com' }, holdings: null });
    const h = await fakes({ user: GUEST, holdings: { fits: 3, pieces: 1 } }).svc.signIn('google');
    expect(h).toMatchObject({ kind: 'ok', holdings: { fits: 3, pieces: 1 } });
  });

  it('SB2.3 · Apple gets the hashed nonce and Firebase the raw one, a fresh one each try', async () => {
    const f = fakes({ user: GUEST });
    await f.svc.signIn('apple');
    await f.svc.signOut();
    await f.svc.signIn('apple');
    expect(f.nonces).toHaveLength(2);
    expect(f.nonces[0]!.raw).not.toBe(f.nonces[1]!.raw);
    expect(f.calls.filter((c) => c.startsWith('apple:'))).toEqual(f.nonces.map((n) => `apple:${n.hashed}`));
    expect(f.creds.filter((c) => c.providerId === 'apple.com').map((c) => c.rawNonce)).toEqual(f.nonces.map((n) => n.raw));
  });
});

describe('SB2.2 · cancelled, failed and offline, as the providers give them', () => {
  it('SB2.2 · a close is cancelled; no token or no Apple is failed; a network error is offline', async () => {
    expect(await fakes({ user: GUEST, apple: coded('ERR_REQUEST_CANCELED') }).svc.signIn('apple')).toEqual({ kind: 'cancelled' });
    expect(await fakes({ user: GUEST, apple: { identityToken: null } }).svc.signIn('apple')).toEqual({ kind: 'failed' });
    expect(await fakes({ user: GUEST, appleAvailable: false }).svc.signIn('apple')).toEqual({ kind: 'failed' });
    expect(await fakes({ user: GUEST, google: null }).svc.signIn('google')).toEqual({ kind: 'cancelled' });
    expect(await fakes({ user: GUEST, google: coded('kitted/cancelled') }).svc.signIn('google')).toEqual({ kind: 'cancelled' });
    expect(await fakes({ user: GUEST, google: { idToken: null, email: null } }).svc.signIn('google')).toEqual({ kind: 'failed' });
    expect(await fakes({ user: GUEST, linkError: coded('auth/network-request-failed') }).svc.signIn('google')).toEqual({ kind: 'offline' });
    expect(await fakes({ user: GUEST, apple: coded('auth/network-request-failed') }).svc.signIn('apple')).toEqual({ kind: 'offline' });
  });

  it('SB2.2 · a cancelled or failed try links and signs in nothing', async () => {
    const f = fakes({ user: GUEST, google: null });
    await f.svc.signIn('google');
    expect(f.calls.filter((c) => c.startsWith('link:') || c.startsWith('signIn:'))).toEqual([]);
    expect(f.current()).toEqual(GUEST);
  });
});

describe('SB2.1 · Apple and Google, nothing else', () => {
  it('SB2.1 · the sign-in has no email methods', () => {
    const svc = fakes({ user: GUEST }).svc as unknown as Record<string, unknown>;
    expect('sendEmailCode' in svc).toBe(false);
    expect('verifyEmailCode' in svc).toBe(false);
    expect(Object.keys(svc).sort()).toEqual(['signIn', 'signOut']);
  });
});

describe('SB10.1 · Apple\'s first name', () => {
  it('SB10.1 · Apple\'s givenName comes back with the result; the family name never does', async () => {
    const f = fakes({ user: GUEST, apple: { givenName: 'Sam', familyName: 'Zebulonski' } });
    const r = await f.svc.signIn('apple');
    expect(r).toMatchObject({ kind: 'ok', givenName: 'Sam' });
    expect(JSON.stringify(r)).not.toContain('Zebulonski');
    // The account row's shape carries no name at all.
    if (r.kind !== 'ok') throw new Error('expected ok');
    expect(Object.keys(r.user).sort()).toEqual(['email', 'provider', 'signedInAt', 'uid']);
  });

  it('SB10.1 · Apple gave no name (every sign-in after the first): null', async () => {
    const r = await fakes({ user: GUEST, apple: { givenName: null, familyName: null } }).svc.signIn('apple');
    expect(r).toMatchObject({ kind: 'ok', givenName: null });
  });

  it('SB10.1 · never a name for Google, even when Apple\'s sheet had one earlier', async () => {
    // Apple's credential in the fake carries a name; a Google sign-in must not pick it up or invent one.
    const r = await fakes({ user: GUEST, apple: { givenName: 'Sam', familyName: 'Lee' } }).svc.signIn('google');
    if (r.kind !== 'ok') throw new Error('expected ok');
    expect(r.givenName ?? null).toBeNull();
    expect(JSON.stringify(r)).not.toMatch(/Sam|Lee/);
  });

  it('SB10.1 · a cancelled or failed Apple try returns no name at all', async () => {
    const r = await fakes({ user: GUEST, apple: { identityToken: null, givenName: 'Sam' } }).svc.signIn('apple');
    expect(r).toEqual({ kind: 'failed' });
  });
});

describe('SB8.1 · sign out reaches both providers', () => {
  it('SB8.1 · Google, then Firebase; a Google sign-out error does not stop Firebase\'s', async () => {
    const f = fakes({ user: GUEST });
    await f.svc.signIn('google');
    await f.svc.signOut();
    expect(f.calls.slice(-2)).toEqual(['google:signOut', 'signOut']);
    expect(f.current()).toBeNull();

    const g = fakes({ user: GUEST, googleSignOutError: coded('google/oops') });
    await g.svc.signIn('apple');
    await g.svc.signOut();
    expect(g.calls.slice(-2)).toEqual(['google:signOut', 'signOut']);
    expect(g.current()).toBeNull();
  });
});
