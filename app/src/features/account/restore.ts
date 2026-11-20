// A new phone (specs/sign-in-and-backup.md SB6, SB7): what an account holds (read from the server before the age question),
// the real fit ids for "Use the account's", and the restore itself. The rows come down through the sync engine, the same
// pull the backup runs; nothing here sends a row up.
import type { KittedStore } from '@/data/store';
import { ABOUT_KEY, BASICS_KEY, GAME_DRAFT_KEY, isAgeBand, LOOKS_KEY, loadDraft, parseAbout } from '@/features/onboarding/basics';
import { cleanName } from '@/features/onboarding/aboutStep';
import { completeOnboarding } from '@/features/onboarding/complete';
import { picksToStyles } from '@/features/onboarding/looks';
import { clearResumeStep } from '@/features/onboarding/resume';
import { createSyncEngine } from '@/sync/engine';
import { RemoteUnavailable, type FileTransport, type RemoteStore } from '@/sync/remote';
import type { StoredDoc } from '@/sync/types';
import { getAccount, signOut } from './account';
import type { AccountHoldings, AuthService } from './auth';

const PAGE = 500;

/** Every doc of a collection on the server, oldest first (read-only). */
async function allDocs(remote: Pick<RemoteStore, 'changesSince'>, coll: string): Promise<StoredDoc[]> {
  const out: StoredDoc[] = [];
  let cursor: { at: number; id: string } | null = null;
  for (;;) {
    const page = await remote.changesSince(coll, cursor, PAGE);
    out.push(...page);
    const last = page[page.length - 1];
    if (!last || page.length < PAGE) return out;
    cursor = { at: last.serverAt, id: last.id };
  }
}

/** A scored full check (not a re-check, not a failed read) that is not deleted. */
const isFitDoc = (d: StoredDoc) => !d.deleted && !!d.data && d.data.status === 'scored' && (d.data.parentId ?? null) === null;
const isPieceDoc = (d: StoredDoc) => !d.deleted && !!d.data && d.data.isDeleted !== true;

function hasLooks(d: StoredDoc | null): boolean {
  if (!d || d.deleted || !d.data) return false;
  try {
    const v = JSON.parse(String(d.data.styles ?? '[]')) as unknown;
    return Array.isArray(v) && v.length > 0;
  } catch {
    return false;
  }
}

/** SB6.1a: read-only. `fits`: docs of `fitChecks` that are not tombstones, `status === 'scored'` and `parentId === null` (re-checks
 *  are not counted). `pieces`: `closetItems` docs that are not tombstones and not `isDeleted`. `profile`: a `profile` doc that is not a
 *  tombstone and holds at least one look (`styles` is a non-empty JSON array). Rejects with RemoteUnavailable when offline. */
export async function readAccountHoldings(remote: Pick<RemoteStore, 'changesSince' | 'get'>): Promise<Required<AccountHoldings>> {
  const fits = (await allDocs(remote, 'fitChecks')).filter(isFitDoc).length;
  const pieces = (await allDocs(remote, 'closetItems')).filter(isPieceDoc).length;
  const profile = hasLooks(await remote.get('profile', 'me'));
  return { fits, pieces, profile };
}

export type AccountChoice =
  /** `inAccount`: the ids of the account's scored full checks, exactly (the sheet passes them to resolveChoice). */
  | { ready: true; inAccount: string[] }
  /** The ids could not be fetched: the sheet does not offer "Use the account's", and nothing is deleted. */
  | { ready: false; why: 'offline' | 'failed' };

/** SB7.1: the read-only fetch run before the "This account already has fits" choice is shown. Never writes. */
export async function accountChoice(remote: Pick<RemoteStore, 'changesSince' | 'get'>): Promise<AccountChoice> {
  try {
    return { ready: true, inAccount: (await allDocs(remote, 'fitChecks')).filter(isFitDoc).map((d) => d.id) };
  } catch (e: unknown) {
    return { ready: false, why: e instanceof RemoteUnavailable ? 'offline' : 'failed' };
  }
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

/** What is on this phone now: scored full checks and live pieces. */
export async function localHoldings(store: Pick<KittedStore, 'fitChecks' | 'closet'>): Promise<{ fits: number; pieces: number }> {
  const fits = (await store.fitChecks.all()).filter((c) => c.status === 'scored' && c.parentId === null).length;
  const pieces = (await store.closet.all()).filter((c) => !c.isDeleted).length;
  return { fits, pieces };
}

/** SB6.1b/c. Reads his age from the About you draft (kv `onboarding.about`): no age picked → rejects, pulling nothing; under 18 →
 *  `{kind:'underage'}` (no remote call at all, no row written, signed out, `setAgeBlocked(true)`); else pulls the account's rows
 *  (calling `onProgress` as they land, never with a count lower than the one before), then completes setup on this phone: the
 *  profile row keeps the account's looks and fit and gets this phone's `ageBand` (with `ageBandAt = nowMs()`) and the draft's name
 *  (`cleanName`), `birthYear` stays null, `consentVersion` and `consentAt` are null (the agreement shows on the camera's first
 *  open), `onboardingDone` is true; the setup drafts and resume step (`onboarding.about/basics/looks/step`) are deleted. */
export async function restoreAccount(d: RestoreDeps): Promise<RestoreResult> {
  const { store } = d;
  const about = parseAbout(await store.getKv(ABOUT_KEY));
  if (about.age === null) throw new Error('restoreAccount: no age picked');
  if (!isAgeBand(about.age)) {
    // Under 18: nothing is asked of the server and nothing lands on the phone (SB6.1b).
    await signOut(store, d.auth);
    await d.setAgeBlocked(true);
    return { kind: 'underage' };
  }
  const age = about.age;

  // The rows come down by the engine's own pull. Photos follow with the backup, not here (backUpPhotos off: no file is queued).
  let shown = { fits: 0, pieces: 0 };
  const engine = createSyncEngine({
    store, remote: d.remote, deviceId: d.deviceId, nowMs: d.nowMs, enabled: () => true, backUpPhotos: () => false,
    onPage: async () => {
      const c = await localHoldings(store);
      shown = { fits: Math.max(shown.fits, c.fits), pieces: Math.max(shown.pieces, c.pieces) };
      d.onProgress?.(shown);
    },
  });
  try {
    await engine.pull();
  } catch (e: unknown) {
    if (!(e instanceof RemoteUnavailable)) console.warn('[restore] pull failed', e);
    return { kind: 'retry' };
  }

  const counts = await localHoldings(store);
  shown = { fits: Math.max(shown.fits, counts.fits), pieces: Math.max(shown.pieces, counts.pieces) };
  d.onProgress?.(shown);

  // Setup is done on this phone: the account's looks and fit, this phone's age band and name, no agreement.
  const pulled = await store.profile.get('me');
  const draft = await loadDraft(store);
  const styles = pulled && pulled.styles.length > 0 ? pulled.styles : picksToStyles(draft.looks);
  await completeOnboarding(
    store,
    {
      styles, fitPreference: pulled?.fitPreference || (draft.basics.fit ?? ''), birthYear: null, ageBand: age, name: cleanName(about.name), consent: 'later',
    },
    d.nowMs(),
    d.ids,
  );
  if (pulled) {
    const made = (await store.profile.get('me'))!;
    await store.profile.put({ ...made, boldness: pulled.boldness, budget: pulled.budget, lastOccasion: pulled.lastOccasion, ideaTime: pulled.ideaTime, units: pulled.units });
  }
  for (const k of [LOOKS_KEY, BASICS_KEY, ABOUT_KEY, GAME_DRAFT_KEY]) await store.deleteKv(k);
  await clearResumeStep(store);
  // This phone now belongs to the account: later changes are recorded and go up with the next round (sync/backup.ts).
  const account = await getAccount(store);
  if (account) await store.setKv('sync.uid', account.uid); // SYNC_UID_KEY

  const looks = !!pulled && pulled.styles.length > 0;
  if (counts.fits === 0 && looks) return { kind: 'profile' };
  return { kind: 'fits', fits: counts.fits, pieces: counts.pieces };
}
