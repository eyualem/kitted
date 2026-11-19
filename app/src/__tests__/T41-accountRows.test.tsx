// T41 · You's account rows, with the real switch (specs/sign-in-and-backup.md SB1.4 (You), SB1.6, SB8.1;
// tasks/T41/TESTING.md). Unlike the other T41 screen tests this one does NOT stub the accounts switch: the rows read the
// real `useAccountsOn` / `settingsAccountOn` over the real ACCOUNTS_BUILT (false), so "off means nothing renders" is
// proved end to end. Only the list widgets, the router, the toast and the database are stand-ins.
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { ACCOUNTS_BUILT } from '@/config/features';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import { auth, getAccount, saveAccount, setDemoAccounts } from '@/features/account/account';
import type { AccountUser } from '@/features/account/auth';
import { AccountSection } from '@/features/account/AccountRows';
import { showToast } from '@/features/toast/toast';

jest.mock('expo-apple-authentication', () => ({}), { virtual: true });
const mockDb = { store: undefined as unknown as KittedStore };
jest.mock('@/data/db', () => ({
  get store() {
    return mockDb.store;
  },
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn() }));
jest.mock('@/features/settings/SettingsList', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return {
    Section: ({ label, children }: { label?: string; children?: unknown }) => (
      <View testID="account-section">
        {label ? <Text>{label}</Text> : null}
        {children as never}
      </View>
    ),
    LinkRow: ({ title, value, onPress }: { title: string; value?: string; onPress: () => void }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
        <Text>{title}</Text>
        {value ? <Text>{value}</Text> : null}
      </Pressable>
    ),
    ValueRow: ({ label, value }: { label: string; value: string }) => (
      <View>
        <Text>{label}</Text>
        {value ? <Text>{value}</Text> : null}
      </View>
    ),
  };
});

const T0 = Date.parse('2026-10-22T11:00:00Z');
const user = (o: Partial<AccountUser> = {}): AccountUser => ({ uid: 'g1', provider: 'apple', email: 'k7p2xq9wmd@privaterelay.appleid.com', signedInAt: T0, ...o });
const flush = () => act(async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); });
const texts = () => (screen.root ? (screen.queryAllByText(/.+/) as unknown as { children: unknown[] }[]).map((n) => n.children.join('')) : []);

let alert: jest.SpyInstance;
let signOutSpy: jest.SpyInstance;
beforeEach(async () => {
  jest.clearAllMocks();
  setDemoAccounts(null);
  mockDb.store = createMemoryStore();
  await mockDb.store.init();
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  signOutSpy = jest.spyOn(auth, 'signOut').mockResolvedValue(undefined);
});
afterEach(() => {
  alert.mockRestore();
  signOutSpy.mockRestore();
  setDemoAccounts(null);
});

describe('SB1.6 · with ACCOUNTS_BUILT off the account rows render nothing outside a demo screen', () => {
  it('SB1.6 · off: nothing, signed out or with an account row left on the phone; a demo script shows the rows, and clearing it hides them again', async () => {
    expect(ACCOUNTS_BUILT).toBe(false);
    await render(<AccountSection />);
    await flush();
    expect(screen.queryByTestId('account-section')).toBeNull();
    expect(texts()).toEqual([]);

    await saveAccount(mockDb.store, user());
    await act(async () => {});
    await flush();
    expect(screen.queryByTestId('account-section')).toBeNull();
    await mockDb.store.deleteKv('account.user');

    await act(async () => setDemoAccounts('ok'));
    await flush();
    expect(screen.queryByTestId('account-section')).not.toBeNull();
    await act(async () => setDemoAccounts(null));
    await flush();
    expect(screen.queryByTestId('account-section')).toBeNull();
  });
});

describe('SB1.6 · You: the account rows, with accounts on', () => {
  it('SB1.6 · signed out: Back up your fits, "Off · on this iPhone only", opens the sheet', async () => {
    setDemoAccounts('ok');
    await render(<AccountSection />);
    await flush();
    expect(texts()).toContain('Back up your fits');
    expect(texts()).toContain('Off · on this iPhone only');
    expect(texts().filter((x) => /email|Back up and sync/i.test(x))).toEqual([]);
    await fireEvent.press(screen.getByText('Back up your fits'));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/sheets/sign-in', params: { from: 'settings' } });
  });

  it('SB1.6 · signed in with Apple through a relay address: "Signed in with Apple", "Hidden email", and Sign out', async () => {
    setDemoAccounts('ok');
    await saveAccount(mockDb.store, user());
    await render(<AccountSection />);
    await flush();
    expect(texts()).toContain('Signed in with Apple');
    expect(texts()).toContain('Hidden email');
    expect(texts().join('|')).not.toContain('privaterelay');
    expect(texts()).toContain('Sign out');
    expect(texts()).not.toContain('Back up your fits');
  });

  it('SB1.6 · signed in with Google: his email as it is', async () => {
    setDemoAccounts('ok');
    await saveAccount(mockDb.store, user({ provider: 'google', email: 'sam.lee@gmail.com' }));
    await render(<AccountSection />);
    await flush();
    expect(texts()).toContain('Signed in with Google');
    expect(texts()).toContain('sam.lee@gmail.com');
    expect(texts()).not.toContain('Hidden email');
  });
});

describe('SB8.1 · Sign out from You keeps every fit', () => {
  it('SB8.1 · asks first (Cancel changes nothing); Sign out calls the provider\'s sign-out, drops the account, and fits, closet, outfits and chat stay byte for byte', async () => {
    setDemoAccounts('ok');
    await loadScenario(mockDb.store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T07:41:00-04:00') });
    await saveAccount(mockDb.store, user());
    const snap = async () => JSON.stringify([await mockDb.store.fitChecks.all(), await mockDb.store.closet.all(), await mockDb.store.outfits.all(), await mockDb.store.chat.all(), await mockDb.store.wearLog.all(), await mockDb.store.facts.all(), await mockDb.store.profile.all()]);
    const before = await snap();
    expect((await mockDb.store.fitChecks.all()).length).toBeGreaterThan(0);

    await render(<AccountSection />);
    await flush();
    await fireEvent.press(screen.getByText('Sign out'));
    expect(alert).toHaveBeenCalledTimes(1);
    const [title, body, buttons] = alert.mock.calls[0] as [string, string, { text: string; style?: string; onPress?: () => void }[]];
    expect([title, body]).toEqual(['Sign out?', 'Your fits stay on this iPhone, but stop backing up.']);
    expect(buttons.map((b) => b.text)).toEqual(['Cancel', 'Sign out']);

    // Cancel: nothing happens.
    buttons[0]!.onPress?.();
    await flush();
    expect(signOutSpy).not.toHaveBeenCalled();
    expect(await getAccount(mockDb.store)).toEqual(user());

    // Sign out.
    buttons[1]!.onPress!();
    await flush();
    expect(signOutSpy).toHaveBeenCalledTimes(1);
    expect(await getAccount(mockDb.store)).toBeNull();
    expect(await snap()).toBe(before);
    expect(showToast).toHaveBeenCalledTimes(1);
  });
});
