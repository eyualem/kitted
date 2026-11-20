// T41 · The sign-in screens, rendered (specs/sign-in-and-backup.md SB1.1, SB2.1–SB2.2, SB3.1, SB6.1, SB7.1, SB10.1;
// tasks/T41/TESTING.md): the sheet over a scripted fake sign-in, the "Keep your fits" card, Welcome's one account
// control, About you's restore (age only) and the Restore screen. On the memory store with the shared T39 mocks
// (src/testing/t39ScreenMocks.tsx): nothing may be sent, and no real Apple or Google is touched.
//
// Profile (CLAUDE.md rule 6): no photo is used. The age band is the one tapped (22–25, 18–21); the account is a fake one.
import {
  advance, allTexts, byId, flush, getId, mockT39, mount, press, setUpT39Tests, T0, textOf, type Node,
} from '@/testing/t39ScreenMocks';
import { screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import { getAgeBlocked } from '@/data/secure';
import type { ChatMessage, FitCheckRow, ProfileRow } from '@/data/types';
import { auth, getAccount, saveAccount, setDemoAccounts } from '@/features/account/account';
import type { AccountUser, SignInResult } from '@/features/account/auth';
import { AccountOfferCard } from '@/features/account/AccountOfferCard';
import { accountOffer } from '@/features/account/offerSession';
import { RestoreScreen } from '@/features/account/RestoreScreen';
import { SignInSheet } from '@/features/account/SignInSheet';
import { BasicsScreen } from '@/features/onboarding/BasicsScreen';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { showToast } from '@/features/toast/toast';

jest.mock('expo-apple-authentication', () => ({}), { virtual: true });
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn() }));
jest.mock('@/features/account/offerSession', () => ({ accountOffer: { decline: jest.fn(async () => {}), ensure: jest.fn(async () => null) }, useAccountOffer: jest.fn() }));

const life = setUpT39Tests();

const APPLE = 'Continue with Apple';
const GOOGLE = 'Continue with Google';
const BUSY = 'Signing in…';
const FAILED_APPLE = "Couldn't sign in with Apple. Try again, or use another way.";
const FAILED_GOOGLE = "Couldn't sign in with Google. Try again, or use another way.";
const OFFLINE = 'Signing in needs a connection. Your fits are safe on this iPhone.';
const EMPTY_ACCOUNT = "No fits saved to that account yet. Let's set you up.";

const user = (o: Partial<AccountUser> = {}): AccountUser => ({ uid: 'g1', provider: 'apple', email: 'k7p2xq9wmd@privaterelay.appleid.com', signedInAt: T0, ...o });
const okResult = (o: { holdings?: { fits: number; pieces: number } | null; givenName?: string | null; provider?: 'apple' | 'google' } = {}): SignInResult =>
  ({ kind: 'ok', user: user({ provider: o.provider ?? 'apple' }), holdings: (o.holdings ?? null) as never, givenName: o.givenName }) as SignInResult;

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const buttons = (): { label: string; disabled: boolean; node: Node }[] =>
  (screen.getAllByRole('button') as unknown as Node[])
    .map((n) => ({ label: String(n.props.accessibilityLabel ?? ''), disabled: (n.props.accessibilityState as { disabled?: boolean } | undefined)?.disabled === true || n.props['aria-disabled'] === true, node: n }))
    .filter((b) => b.label === APPLE || b.label === GOOGLE || b.label === BUSY);
const tap = (label: string) => press(buttons().find((b) => b.label === label)!.node);
const pushes = () => (router.push as jest.Mock).mock.calls.map((c) => c[0] as unknown);
const profile = async () => (await mockT39.store.profile.get('me')) as ProfileRow | null;

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
    parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

let signIn: jest.SpyInstance;
let signOutSpy: jest.SpyInstance;
beforeEach(() => {
  setDemoAccounts('ok');
  mockT39.accounts = true;
  mockT39.params = { from: 'settings' };
  signIn = jest.spyOn(auth, 'signIn');
  signOutSpy = jest.spyOn(auth, 'signOut').mockResolvedValue(undefined);
});
afterEach(() => {
  signIn.mockRestore();
  signOutSpy.mockRestore();
  setDemoAccounts(null);
});

// ── SB2.1 · Apple first, Google second ──────────────────────────────────────────────────────────────────────────────
describe('SB2.1 · the sheet', () => {
  it('SB2.1 · offers Continue with Apple, then Continue with Google, and nothing else', async () => {
    await mount(<SignInSheet />);
    expect(buttons().map((b) => [b.label, b.disabled])).toEqual([[APPLE, false], [GOOGLE, false]]);
    expect(allTexts().filter((x) => /email/i.test(x))).toEqual([]);
    for (const from of ['welcome', 'offer', 'settings']) {
      mockT39.params = { from };
      const r = await mount(<SignInSheet />);
      expect(buttons().map((b) => b.label)).toEqual([APPLE, GOOGLE]);
      await r.unmount();
    }
  });
});

// ── SB2.2 · signing in, cancelled, failed, offline; nothing taps twice ──────────────────────────────────────────────
describe('SB2.2 · the sheet\'s states', () => {
  it('SB2.2 · while one provider signs in, only that button says Signing in…, both are off, and a second tap on either calls signIn once in total', async () => {
    const d = deferred<SignInResult>();
    signIn.mockImplementation(() => d.promise);
    await mount(<SignInSheet />);
    await tap(APPLE);
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenLastCalledWith('apple');
    expect(buttons().map((b) => [b.label, b.disabled])).toEqual([[BUSY, true], [GOOGLE, true]]);
    await press(buttons()[1]!.node);
    await press(buttons()[0]!.node);
    await press(buttons()[1]!.node);
    expect(signIn).toHaveBeenCalledTimes(1);
    d.resolve({ kind: 'cancelled' });
    await flush();
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('SB2.2 · the same for Google: only Google says Signing in…', async () => {
    const d = deferred<SignInResult>();
    signIn.mockImplementation(() => d.promise);
    await mount(<SignInSheet />);
    await tap(GOOGLE);
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenLastCalledWith('google');
    expect(buttons().map((b) => [b.label, b.disabled])).toEqual([[APPLE, true], [BUSY, true]]);
    await press(buttons()[0]!.node);
    expect(signIn).toHaveBeenCalledTimes(1);
    d.resolve({ kind: 'cancelled' });
    await flush();
  });

  it('SB2.2 · cancelled: no problem line, the sheet is as it was, both buttons usable', async () => {
    signIn.mockResolvedValue({ kind: 'cancelled' });
    await mount(<SignInSheet />);
    const before = allTexts();
    await tap(APPLE);
    expect(allTexts()).toEqual(before);
    expect(buttons().map((b) => [b.label, b.disabled])).toEqual([[APPLE, false], [GOOGLE, false]]);
    expect(router.back).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    await tap(GOOGLE);
    expect(signIn).toHaveBeenCalledTimes(2);
  });

  it('SB2.2 · failed: one line for that provider (Apple\'s, then Google\'s), buttons usable to try again', async () => {
    signIn.mockResolvedValue({ kind: 'failed' });
    await mount(<SignInSheet />);
    await tap(APPLE);
    expect(allTexts().filter((x) => x === FAILED_APPLE)).toHaveLength(1);
    expect(allTexts().filter((x) => x === FAILED_GOOGLE)).toHaveLength(0);
    expect(buttons().map((b) => b.disabled)).toEqual([false, false]);
    await tap(GOOGLE);
    expect(allTexts().filter((x) => x === FAILED_GOOGLE)).toHaveLength(1);
    expect(allTexts().filter((x) => x === FAILED_APPLE)).toHaveLength(0);
    expect(buttons().map((b) => b.disabled)).toEqual([false, false]);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('SB2.2 · offline: the offline line, and the buttons stay on to retry', async () => {
    signIn.mockResolvedValue({ kind: 'offline' });
    await mount(<SignInSheet />);
    await tap(APPLE);
    expect(allTexts().filter((x) => x === OFFLINE)).toHaveLength(1);
    expect(allTexts().filter((x) => x === FAILED_APPLE)).toHaveLength(0);
    expect(buttons().map((b) => [b.label, b.disabled])).toEqual([[APPLE, false], [GOOGLE, false]]);
    await tap(APPLE);
    expect(signIn).toHaveBeenCalledTimes(2);
    expect(allTexts().filter((x) => x === OFFLINE)).toHaveLength(1);
  });

  it('SB2.2 · a try after a failure clears the old line while it signs in', async () => {
    signIn.mockResolvedValueOnce({ kind: 'failed' });
    await mount(<SignInSheet />);
    await tap(APPLE);
    expect(allTexts()).toContain(FAILED_APPLE);
    const d = deferred<SignInResult>();
    signIn.mockImplementationOnce(() => d.promise);
    await tap(APPLE);
    expect(allTexts()).not.toContain(FAILED_APPLE);
    d.resolve({ kind: 'cancelled' });
    await flush();
  });

  it('SB2.2 · done: the account is saved, the sheet closes, and the toast says Signed in with Apple.', async () => {
    signIn.mockResolvedValue(okResult({ holdings: null }));
    await mount(<SignInSheet />);
    await tap(APPLE);
    expect(await getAccount(mockT39.store)).toEqual(user());
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith('Signed in with Apple.');
  });
});

// ── SB6.1 · the sheet from Welcome ──────────────────────────────────────────────────────────────────────────────────
describe('SB6.1 · from Welcome', () => {
  it('SB6.1 · an account with fits goes on to About you with the counts (age only), not to Looks', async () => {
    mockT39.params = { from: 'welcome' };
    signIn.mockResolvedValue(okResult({ holdings: { fits: 214, pieces: 38 } }));
    await mount(<SignInSheet />);
    await tap(APPLE);
    expect(await getAccount(mockT39.store)).toEqual(user());
    expect(await mockT39.store.getKv('onboarding.step')).toBe('basics');
    await advance(500);
    expect(pushes()).toEqual([{ pathname: '/onboarding/basics', params: { restore: '214,38' } }]);
  });

  it('SB6.1 · an empty account says so and goes on to Looks, signed in', async () => {
    mockT39.params = { from: 'welcome' };
    signIn.mockResolvedValue(okResult({ holdings: null }));
    await mount(<SignInSheet />);
    await tap(GOOGLE);
    expect(await getAccount(mockT39.store)).toEqual(user());
    expect(await mockT39.store.getKv('onboarding.step')).toBe('looks');
    expect(showToast).toHaveBeenCalledWith(EMPTY_ACCOUNT);
    await advance(500);
    expect(pushes()).toEqual(['/onboarding/looks']);
  });

  it('SB6.1 · from the offer card or You, never a restore or a setup step', async () => {
    for (const from of ['offer', 'settings']) {
      mockT39.params = { from };
      signIn.mockResolvedValue(okResult({ holdings: { fits: 214, pieces: 38 } }));
      const r = await mount(<SignInSheet />);
      await tap(APPLE);
      await advance(500);
      expect([from, pushes()]).toEqual([from, []]);
      await mockT39.store.deleteKv('account.user');
      await r.unmount();
    }
  });
});

// ── SB7.1 · both have fits ──────────────────────────────────────────────────────────────────────────────────────────
describe('SB7.1 · the account and this phone both have fits', () => {
  type Button = { text: string; style?: string; onPress?: () => void };
  const lastAlert = () => life.alert.mock.calls.at(-1)! as [string, string, Button[]];
  const pick = (a: [string, string, Button[]], text: string) => a[2].find((b) => b.text === text)!;
  const seedLocal = async () => {
    for (let i = 1; i <= 3; i++) await mockT39.store.fitChecks.put(check(`FC${i}`, T0 - 60_000 * i));
  };
  const open = async () => {
    mockT39.params = { from: 'offer' };
    signIn.mockResolvedValue(okResult({ holdings: { fits: 214, pieces: 38 } }));
    await mount(<SignInSheet />);
    await tap(APPLE);
  };
  const fits = async () => (await mockT39.store.fitChecks.all()).map((c) => c.id).sort();

  it('SB7.1 · asks with three choices, saves nothing yet, and Keep both saves the account and deletes nothing', async () => {
    await seedLocal();
    await open();
    const a = lastAlert();
    expect(a[0]).toBe('This account already has fits');
    expect(a[1]).toBe("Your Apple account has 214 fits saved. This iPhone has 3 that aren't in it.");
    expect(a[2].map((b) => b.text)).toEqual(['Keep both', "Use the account's", 'Cancel']);
    expect(await getAccount(mockT39.store)).toBeNull();
    pick(a, 'Keep both').onPress!();
    await flush();
    expect(await getAccount(mockT39.store)).toEqual(user());
    expect(await fits()).toEqual(['FC1', 'FC2', 'FC3']);
  });

  it('SB7.1 · Cancel stays signed out: the sign-in is signed out again, no account saved, nothing deleted', async () => {
    await seedLocal();
    await open();
    pick(lastAlert(), 'Cancel').onPress!();
    await flush();
    expect(signOutSpy).toHaveBeenCalledTimes(1);
    expect(await getAccount(mockT39.store)).toBeNull();
    expect(await fits()).toEqual(['FC1', 'FC2', 'FC3']);
  });

  it('SB7.1 · Use the account\'s deletes nothing until the second confirm; the second one\'s Cancel deletes nothing', async () => {
    await seedLocal();
    await open();
    pick(lastAlert(), "Use the account's").onPress!();
    await flush();
    // The second confirm is up; nothing has been deleted or saved.
    expect(life.alert).toHaveBeenCalledTimes(2);
    expect(await fits()).toEqual(['FC1', 'FC2', 'FC3']);
    expect(await getAccount(mockT39.store)).toBeNull();
    const second = lastAlert();
    expect(second[2].map((b) => b.style)).toContain('destructive');
    pick(second, 'Cancel').onPress!();
    await flush();
    expect(await fits()).toEqual(['FC1', 'FC2', 'FC3']);
    expect(await getAccount(mockT39.store)).toBeNull();
  });

  it('SB7.1 · the second confirm deletes this iPhone\'s fits (the demo account holds none of them) and saves the account', async () => {
    await seedLocal();
    await open();
    pick(lastAlert(), "Use the account's").onPress!();
    await flush();
    const destructive = lastAlert()[2].find((b) => b.style === 'destructive')!;
    destructive.onPress!();
    await flush();
    expect(await fits()).toEqual([]);
    expect(await getAccount(mockT39.store)).toEqual(user());
  });
});

// ── SB10.1 · Apple's first name, from the sheet ─────────────────────────────────────────────────────────────────────
describe('SB10.1 · the sheet puts Apple\'s first name in an empty name only', () => {
  async function withProfile(name: string | null) {
    await mockT39.store.profile.put({
      id: 'me', birthYear: null, heightCm: null, build: '', fitPreference: '', styles: [], boldness: null, budget: null, lastOccasion: 'everyday',
      consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: T0, ageBand: '22-25', ageBandAt: T0, name,
    } as ProfileRow);
  }

  it('SB10.1 · an empty name becomes Sam; a typed one stays; no given name (Apple gives it once, Google never) changes nothing', async () => {
    await withProfile(null);
    signIn.mockResolvedValue(okResult({ givenName: 'Sam' }));
    const r = await mount(<SignInSheet />);
    await tap(APPLE);
    expect((await profile())?.name).toBe('Sam');
    await r.unmount();

    await mockT39.store.deleteKv('account.user');
    await withProfile('Alex');
    const r2 = await mount(<SignInSheet />);
    await tap(APPLE);
    expect((await profile())?.name).toBe('Alex');
    expect(await getAccount(mockT39.store)).toEqual(user());
    await r2.unmount();

    // Google gives no name: an empty name stays empty (and is not set to "null" or "").
    await mockT39.store.deleteKv('account.user');
    await withProfile(null);
    signIn.mockResolvedValue(okResult({ givenName: null, provider: 'google' }));
    await mount(<SignInSheet />);
    await tap(GOOGLE);
    expect((await profile())?.name).toBeNull();
    expect(await getAccount(mockT39.store)).toEqual(user({ provider: 'google' }));
  });

  it('SB10.1 · mid setup, from Welcome: the name waits in About you\'s draft, with no profile made', async () => {
    mockT39.params = { from: 'welcome' };
    signIn.mockResolvedValue(okResult({ givenName: 'Sam', holdings: null }));
    await mount(<SignInSheet />);
    await tap(APPLE);
    expect(JSON.parse((await mockT39.store.getKv('onboarding.about'))!)).toEqual({ age: null, name: 'Sam' });
    expect(await profile()).toBeNull();
  });
});

// ── SB3.1 · the card ────────────────────────────────────────────────────────────────────────────────────────────────
describe('SB3.1 · the "Keep your fits" card', () => {
  const msg = (payload: Record<string, unknown>): ChatMessage => ({
    id: 'M-9', createdAt: T0, role: 'stylist', kind: 'card', text: null, cardType: 'account', fitCheckId: null, outfitId: null, itemId: null, chips: [], payload,
  });
  const TAIL = ' Sign in to back them up and get them back on a new phone. Kitted works the same without it.';

  it('SB3.1 · open: the body by the numbers, Save my fits opens the sheet from the card, Not now declines it', async () => {
    await mount(<AccountOfferCard m={msg({ offer: 1, fits: 12, pieces: 4, state: 'open' })} />);
    const texts = allTexts();
    expect(texts).toContain(`Your 12 fits and the 4 pieces in your closet live only on this iPhone.${TAIL}`);
    expect(texts.filter((x) => /chats/.test(x))).toEqual([]);
    expect(texts).toContain('Keep your fits');
    await press(screen.getByText('Save my fits'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/sheets/sign-in', params: { from: 'offer' } });
    await press(screen.getByText('Not now'));
    expect(accountOffer.decline).toHaveBeenCalledWith('M-9');
  });

  it('SB3.1 · with no pieces the closet part is left out; with one fit it is "Your first fit"', async () => {
    const r = await mount(<AccountOfferCard m={msg({ offer: 1, fits: 12, pieces: 0, state: 'open' })} />);
    expect(allTexts()).toContain(`Your 12 fits live only on this iPhone.${TAIL}`);
    await r.unmount();
    await mount(<AccountOfferCard m={msg({ offer: 1, fits: 1, pieces: 4, state: 'open' })} />);
    expect(allTexts().some((x) => x.startsWith('Your first fit and the 4 pieces in your closet live only on this iPhone.'))).toBe(true);
  });

  it('SB3.1 · after Not now, one line: No problem. It\'s in You whenever you want it.', async () => {
    await mount(<AccountOfferCard m={msg({ offer: 1, fits: 12, pieces: 4, state: 'declined' })} />);
    expect(allTexts()).toEqual(["No problem. It's in You whenever you want it."]);
    expect(screen.queryByText('Save my fits')).toBeNull();
    expect(screen.queryByText('Not now')).toBeNull();
  });

  it('SB3.1 · signed in, one line: Signed in with Apple. Your fits are backed up. (Google the same)', async () => {
    for (const [provider, name] of [['apple', 'Apple'], ['google', 'Google']] as const) {
      await mockT39.store.wipe();
      await saveAccount(mockT39.store, user({ provider }));
      const r = await mount(<AccountOfferCard m={msg({ offer: 1, fits: 12, pieces: 4, state: 'open' })} />);
      expect(allTexts()).toEqual([`Signed in with ${name}. Your fits are backed up.`]);
      await r.unmount();
    }
  });
});

// ── SB1.1 · Welcome carries one account control ─────────────────────────────────────────────────────────────────────
describe('SB1.1 · Welcome', () => {
  it('SB1.1 · with accounts on, exactly one account control (I already have an account → the sheet from Welcome), and no Apple or Google button', async () => {
    mockT39.accounts = true;
    await mount(<WelcomeScreen />);
    const texts = allTexts();
    expect(texts.filter((x) => x === 'I already have an account')).toHaveLength(1);
    expect(texts.filter((x) => /Continue with|Apple|Google|Sign in|Keep your fits/i.test(x))).toEqual([]);
    expect(within(screen.root as never).queryAllByRole('button').filter((b) => /Apple|Google/.test(String((b.props as { accessibilityLabel?: string }).accessibilityLabel ?? '')))).toEqual([]);
    await press(screen.getByText('I already have an account'));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/sheets/sign-in', params: { from: 'welcome' } });
  });

  it('SB1.1 · with accounts off, no account control at all', async () => {
    mockT39.accounts = false;
    await mount(<WelcomeScreen />);
    expect(allTexts().filter((x) => /account|Apple|Google|Sign in/i.test(x))).toEqual([]);
  });
});

// ── SB6.1 · About you's restore, then the Restore screen ────────────────────────────────────────────────────────────
describe('SB6.1 · a new phone asks age only, then restores', () => {
  const continueBtn = () => within(getId('about-continue') as never).getByRole('button') as unknown as Node;
  type Button = { text: string; style: string; onPress?: () => void };

  it('SB6.1 · 18 or over: no setup is finished; it goes to Restore with the two counts', async () => {
    mockT39.params = { restore: '214,38' };
    await mount(<BasicsScreen />);
    expect(byId('about-name-input')).toBeNull();
    await press(getId('age-22-25'));
    await press(continueBtn());
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/onboarding/restore', params: { fits: 214, pieces: 38 } });
    // Nothing completes onboarding yet: the Restore screen does that.
    expect(await profile()).toBeNull();
    expect(await mockT39.store.getKv('onboarding.done')).toBeNull();
    expect(await getAgeBlocked()).toBe(false);
  });

  it('SB6.1 · under 18: the age stop, and no restore starts', async () => {
    mockT39.params = { restore: '214,38' };
    await mount(<BasicsScreen />);
    await press(getId('age-under18'));
    await press(continueBtn());
    // Restore asks the age only, so an age alone turns Continue on: it asks once, as setup does.
    expect(life.alert).toHaveBeenCalledTimes(1);
    const buttons = life.alert.mock.calls.at(-1)![2] as Button[];
    buttons.find((b) => b.style === 'destructive')!.onPress!();
    await flush();
    await advance(5000);
    expect(await getAgeBlocked()).toBe(true);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect((router.replace as jest.Mock).mock.calls.map((c) => c[0])).not.toContainEqual(expect.objectContaining({ pathname: '/onboarding/restore' }));
    expect(await profile()).toBeNull();
    expect(await mockT39.store.chat.all()).toEqual([]);
  });

  it('SB6.1 · Restore shows "214 fits · 38 pieces" (no chats), then "Your fits are back.", and completes setup with his age and Apple\'s name', async () => {
    mockT39.params = { fits: '214', pieces: '38' };
    // What About you and the sign-in left on this phone: his age pick, and Apple's first name waiting in the draft.
    await mockT39.store.setKv('onboarding.about', JSON.stringify({ age: '22-25', name: 'Sam' }));
    await mockT39.store.setKv('onboarding.step', 'basics');
    await mount(<RestoreScreen />);
    const first = allTexts();
    expect(first).toContain('Bringing back your fits…');
    expect(first).toContain('214 fits · 38 pieces');
    expect(first.filter((x) => /chats/.test(x))).toEqual([]);
    for (let i = 0; i < 8; i++) await advance(500);
    expect(allTexts()).toContain('Your fits are back.');
    expect(router.replace).toHaveBeenCalledWith('/');
    const p = (await profile())!;
    expect([p.onboardingDone, p.ageBand, p.name, p.consentVersion]).toEqual([true, '22-25', 'Sam', null]);
    expect(await mockT39.store.getKv('onboarding.step')).toBeNull();
    expect(await getAgeBlocked()).toBe(false);
  });
});
