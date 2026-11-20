// T41b (SB6, SB7): what an account holds (read from the server before the age question), the real fit ids for "Use the
// account's", and the restore itself. STUBS: every function throws until the implementer writes it.
import type { KittedStore } from '@/data/store';
import type { RemoteStore, FileTransport } from '@/sync/remote';
import type { AuthService, AccountHoldings } from './auth';

/** SB6.1a: read-only. `fits`: docs of `fitChecks` that are not tombstones, `status === 'scored'` and `parentId === null` (re-checks
 *  are not counted). `pieces`: `closetItems` docs that are not tombstones and not `isDeleted`. `profile`: a `profile` doc that is not a
 *  tombstone and holds at least one look (`styles` is a non-empty JSON array). Rejects with RemoteUnavailable when offline. */
export async function readAccountHoldings(_remote: Pick<RemoteStore, 'changesSince' | 'get'>): Promise<Required<AccountHoldings>> {
  throw new Error('T41b: not built');
}

export type AccountChoice =
  /** `inAccount`: the ids of the account's scored full checks, exactly (the sheet passes them to resolveChoice). */
  | { ready: true; inAccount: string[] }
  /** The ids could not be fetched: the sheet does not offer "Use the account's", and nothing is deleted. */
  | { ready: false; why: 'offline' | 'failed' };

/** SB7.1: the read-only fetch run before the "This account already has fits" choice is shown. Never writes. */
export async function accountChoice(_remote: Pick<RemoteStore, 'changesSince' | 'get'>): Promise<AccountChoice> {
  throw new Error('T41b: not built');
}

export interface RestoreDeps {
  /** This phone's inner (untracked) store: the rows land here. */
  store: KittedStore;
  remote: RemoteStore;
  files?: FileTransport;
  deviceId: string;
  nowMs(): number;
  ids(prefix: string): string;
  /** The auth service (its signOut) for the under-18 stop. */
  auth: Pick<AuthService, 'signOut'>;
  /** The Keychain's under-18 lock (data/secure setAgeBlocked). */
  setAgeBlocked(blocked: boolean): Promise<void>;
  /** The counts, each time rows land. */
  onProgress?(c: { fits: number; pieces: number }): void;
}

export type RestoreResult =
  /** The age he picked is under 18: nothing was pulled or written, he is signed out (`signOut(store, auth)`) and the lock is set. */
  | { kind: 'underage' }
  /** Done: onboarding complete. `fits` = scored full checks now on the phone, `pieces` = live closet pieces. */
  | { kind: 'fits'; fits: number; pieces: number }
  /** Done, the account held no fits but a saved style profile: no counts. */
  | { kind: 'profile' }
  /** The server could not be reached: nothing marked done, his drafts are still there; he may retry. */
  | { kind: 'retry' };

/** SB6.1b/c. Reads his age from the About you draft (kv `onboarding.about`): no age picked → rejects, pulling nothing; under 18 →
 *  `{kind:'underage'}` (no remote call at all, no row written, signed out, `setAgeBlocked(true)`); else pulls the account's rows
 *  (calling `onProgress` as they land, never with a count lower than the one before), then completes setup on this phone: the
 *  profile row keeps the account's looks and fit and gets this phone's `ageBand` (with `ageBandAt = nowMs()`) and the draft's name
 *  (`cleanName`), `birthYear` stays null, `consentVersion` and `consentAt` are null (the agreement shows on the camera's first
 *  open), `onboardingDone` is true; the setup drafts and resume step (`onboarding.about/basics/looks/step`) are deleted. */
export async function restoreAccount(_d: RestoreDeps): Promise<RestoreResult> {
  throw new Error('T41b: not built');
}
