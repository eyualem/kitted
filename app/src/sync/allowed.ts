// T41b (SB-GATE): the one place that decides whether backup may run on this phone at all. STUB.

/** `ACCOUNTS_BUILT && platformOS === 'ios' && demoScreen === null`. Reads `ACCOUNTS_BUILT` from '@/config/features' when it is
 *  called (the tests swap that module), and defaults `platformOS` to `Platform.OS` and `demoScreen` to `getDemoArgs().demoScreen`.
 *  There is no Jest check in here: the tests pass their own env. */
export function syncAllowed(_env?: { platformOS?: string; demoScreen?: number | null }): boolean {
  throw new Error('T41b: not built');
}
