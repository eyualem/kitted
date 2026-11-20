// The phone's device ID for X-Kitted-Device (T21a, F10.1): one random ID per phone, kept in the Keychain so it is the
// same after a sign-out (a new guest), made only when none exists. The server keeps only its sha256 and day counts.
// The raw ID is never logged. "Delete all my data" clears it (privacy/wipe.ts), so the phone then looks new.
import * as Crypto from 'expo-crypto';
import { getDeviceId, setDeviceId } from '@/data/secure';

let pending: Promise<string> | null = null;

async function load(): Promise<string> {
  const saved = await getDeviceId();
  if (saved) return saved;
  const made = newDeviceId();
  await setDeviceId(made);
  return made;
}

/** 36 characters of hex and dashes: the server's shape. expo-crypto on the phone; the fallback only runs where its
 *  native module is missing (the tests, the web preview), never on the phone. */
function newDeviceId(): string {
  try {
    const uuid: unknown = Crypto.randomUUID();
    if (typeof uuid === 'string' && uuid.length >= 16) return uuid;
  } catch {
    // fall through to the fallback
  }
  return Array.from({ length: 4 }, () => Math.random().toString(16).slice(2, 10).padEnd(8, '0')).join('-');
}

/** The phone's ID. Calls that start together share one lookup, so an empty Keychain gets one new ID, not several. */
export function deviceId(): Promise<string> {
  if (!pending) {
    pending = load().catch((e: unknown) => {
      pending = null; // a Keychain hiccup: try again on the next call
      throw e;
    });
  }
  return pending;
}
