// T41b (SB9): "Delete account and all data", the order and what a failure leaves. STUB: runDeleteAccount throws.
export interface DeleteAccountDeps {
  provider: 'apple' | 'google';
  /** Apple only: Firebase's `revokeAccessToken` with a fresh authorization code from Apple's sheet. */
  revokeApple(): Promise<'ok' | 'cancelled' | 'offline' | 'failed'>;
  /** The server job `deleteAccount` (database, photos, the Auth user), once. */
  deleteServer(): Promise<'ok' | 'offline' | 'failed'>;
  /** "Delete all my data" on this phone (the age lock stays), signing out. */
  wipe(): Promise<void>;
}

export type DeleteAccountResult =
  | { kind: 'deleted' }
  /** `revokeApple` or `deleteServer` said offline. Nothing was deleted. Toast: `acct.delete.offline`. */
  | { kind: 'offline' }
  /** `revokeApple` or `deleteServer` failed. Nothing was deleted; the toast offers Try again, which runs the whole order again. */
  | { kind: 'failed' }
  /** Apple's sheet was closed. Nothing was deleted and the server was not called. */
  | { kind: 'cancelled' };

/** The order, each step at most once per call and only if the one before said ok: Apple → `revokeApple()`; then `deleteServer()`; then
 *  `wipe()`. Google skips the revoke. Any other answer stops the call: no later step runs, nothing on the phone changes. */
export async function runDeleteAccount(_d: DeleteAccountDeps): Promise<DeleteAccountResult> {
  throw new Error('T41b: not built');
}
