// T21a F10.1·l: the app sends X-Kitted-Device on photo and ask calls. One ID per phone, made and saved to the Keychain
// only when none exists, the same on every call and after a sign-out (a new guest token, the same Keychain).
// Fake fetch and a fake Keychain (expo-secure-store): no network.
import type { AiFetch } from '@/services/server/transport';

const KEY = 'kitted.deviceId';
const mockKeychain = new Map<string, string>();
const mockSetItem = jest.fn(async (k: string, v: string) => {
  mockKeychain.set(k, v);
});

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  getItemAsync: jest.fn(async (k: string) => mockKeychain.get(k) ?? null),
  setItemAsync: (k: string, v: string) => mockSetItem(k, v),
  deleteItemAsync: jest.fn(async (k: string) => {
    mockKeychain.delete(k);
  }),
}));

let deviceId: () => Promise<string>;
let serverTransport: typeof import('@/services/server/transport').serverTransport;

const SHAPE = /^[A-Za-z0-9-]{16,64}$/;
const BASE = 'https://srv.test/api';

interface Sent {
  url: string;
  headers: Record<string, string>;
}

/** A server transport on a fake fetch; `token` stands for the guest account (a new one after a sign-out). */
function transportFor(sent: Sent[], token: string) {
  const fetch: AiFetch = async (url, init) => {
    sent.push({ url, headers: init.headers });
    return { ok: true, status: 200, body: null, text: async () => '{}', headers: { get: () => null } };
  };
  const options = { base: BASE, fetch, token: async () => token, tzMinutes: () => -240, device: deviceId };
  return serverTransport(options);
}

const photo = { route: 'read' as const, model: 'm', stream: false, body: '{}', tag: { checkId: 'C-1', kind: 'full' as const } };
const question = { route: 'ask' as const, model: 'm', stream: true, body: '{}' };

beforeEach(() => {
  // A fresh module each test, so an ID a build might remember in memory can't leak between tests.
  jest.resetModules();
  deviceId = require('@/services/server/deviceId').deviceId;
  serverTransport = require('@/services/server/transport').serverTransport;
  mockKeychain.clear();
  mockSetItem.mockClear();
});

describe('F10.1 the device ID', () => {
  it('F10.1 · the device ID is sent and stable across a sign-out', async () => {
    const sent: Sent[] = [];
    const guestA = transportFor(sent, 'token-guest-A');
    await guestA.send(photo);
    await guestA.send(question);
    await guestA.send({ ...photo, tag: { checkId: 'C-2', kind: 'recheck' } });
    const ids = sent.map((s) => s.headers['X-Kitted-Device']);
    expect(ids).toHaveLength(3);
    expect(ids[0]).toMatch(SHAPE); // the server's shape: 16-64 letters, digits, dashes
    expect(ids).toEqual([ids[0], ids[0], ids[0]]); // the same on every call
    // Made once, saved to the Keychain under the device ID's own key, and that is the ID that was sent.
    expect(mockSetItem).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith(KEY, ids[0]);
    expect(mockKeychain.get(KEY)).toBe(ids[0]);

    // Sign out: a new guest token (a new uid on the server), the same Keychain, a fresh transport: the same ID.
    const guestB = transportFor(sent, 'token-guest-B');
    await guestB.send(photo);
    await guestB.send(question);
    expect(sent.slice(3).map((s) => [s.headers.Authorization, s.headers['X-Kitted-Device']])).toEqual([
      ['Bearer token-guest-B', ids[0]],
      ['Bearer token-guest-B', ids[0]],
    ]);
    expect(mockSetItem).toHaveBeenCalledTimes(1); // no second ID made
  });

  it('F10.1 · a Keychain ID that already exists is used, and nothing is made or saved', async () => {
    mockKeychain.set(KEY, 'existing-phone-0001-abcd');
    const sent: Sent[] = [];
    await transportFor(sent, 'token-guest-A').send(photo);
    await transportFor(sent, 'token-guest-B').send(question);
    expect(sent.map((s) => s.headers['X-Kitted-Device'])).toEqual(['existing-phone-0001-abcd', 'existing-phone-0001-abcd']);
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('F10.1 · calls that start together on an empty Keychain share one new ID, and a new phone gets its own', async () => {
    const sent: Sent[] = [];
    const t = transportFor(sent, 'token-guest-A');
    await Promise.all([t.send(photo), t.send(question), t.send({ ...photo, tag: { checkId: 'C-2', kind: 'full' } })]);
    const ids = sent.map((s) => s.headers['X-Kitted-Device']);
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toMatch(SHAPE);
    expect(mockSetItem).toHaveBeenCalledTimes(1);
    // Another phone (an empty Keychain again) makes a different, random ID: not a constant.
    const first = ids[0];
    mockKeychain.clear();
    mockSetItem.mockClear();
    jest.resetModules(); // the app starts again on that phone
    deviceId = require('@/services/server/deviceId').deviceId;
    serverTransport = require('@/services/server/transport').serverTransport;
    const sent2: Sent[] = [];
    await transportFor(sent2, 'token-guest-C').send(photo);
    expect(sent2[0]!.headers['X-Kitted-Device']).toMatch(SHAPE);
    expect(sent2[0]!.headers['X-Kitted-Device']).not.toBe(first);
  });
});
