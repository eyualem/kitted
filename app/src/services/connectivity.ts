// Is the phone online? (09 §20.8 G18; 02 G1, 07 §6.4.) No package: the app has no NetInfo, so it learns from its own
// calls and one tiny check.
//   - A fit check or question that fails for no connection asks the check before saying "offline" (one flaky call isn't
//     a lost connection); any score or answer that arrives says "online".
//   - The check is Apple's own captive-portal page, the one iOS loads itself whenever it joins a network: a HEAD request
//     that carries nothing about him (no IDs, no photo, no words). It runs at launch, on each return to the foreground,
//     and every 10 s while offline and in the foreground. The web preview reads navigator.onLine instead.
//   - Coming back shows "Back online." for 3 s (`backOnline`), then nothing.
// Demo screens pin the state (force), so screenshots don't depend on the Mac's Wi-Fi.
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { realScheduler, type Scheduler } from './scheduler';

export interface NetState {
  online: boolean;
  /** "Back online." is showing (3 s after the connection returns). */
  backOnline: boolean;
}

export interface ConnectivityDeps {
  /** True when a connection works. Never throws (a throw counts as offline). */
  probe: () => Promise<boolean>;
  scheduler: Pick<Scheduler, 'setTimer' | 'clearTimer'>;
  /** The app is in the foreground (the 10 s re-check waits otherwise). */
  active: () => boolean;
  log?: (line: string) => void;
}

export const RECHECK_MS = 10_000;
export const BACK_ONLINE_MS = 3_000;

const ONLINE: NetState = { online: true, backOnline: false };
const OFFLINE: NetState = { online: false, backOnline: false };
const BACK: NetState = { online: true, backOnline: true };

export function createConnectivity(deps: ConnectivityDeps) {
  const { scheduler } = deps;
  const log = deps.log ?? (() => {});
  let state: NetState = ONLINE;
  let forced = false;
  let recheck: unknown = null;
  let back: unknown = null;
  let probing: Promise<boolean> | null = null;
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((f) => f());

  const clear = (h: unknown) => {
    if (h !== null) scheduler.clearTimer(h);
  };

  function armRecheck() {
    if (recheck !== null || forced) return;
    recheck = scheduler.setTimer(() => {
      recheck = null;
      // In the background it waits: the return to the foreground checks again.
      if (!state.online && deps.active()) void check();
    }, RECHECK_MS);
  }

  function set(online: boolean) {
    if (forced || online === state.online) return;
    if (online) {
      clear(recheck);
      recheck = null;
      state = BACK;
      back = scheduler.setTimer(() => {
        back = null;
        if (state === BACK) {
          state = ONLINE;
          emit();
        }
      }, BACK_ONLINE_MS);
      log('online');
    } else {
      clear(back);
      back = null;
      state = OFFLINE;
      armRecheck();
      log('offline');
    }
    emit();
  }

  /** Runs the check (one at a time) and sets the state from it. Resolves true when online. */
  function check(): Promise<boolean> {
    if (forced) return Promise.resolve(state.online);
    if (probing) return probing;
    probing = deps.probe().catch(() => false).then((ok) => {
      probing = null;
      set(ok);
      if (!ok) armRecheck();
      return ok;
    });
    return probing;
  }

  return {
    /** A stable object per state (useSyncExternalStore). */
    get: (): NetState => state,
    isOnline: (): boolean => state.online,
    subscribe(fn: () => void): () => void {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
    /** A call failed for no connection: checks before saying so. Resolves true when the phone is really offline. */
    async reportOffline(): Promise<boolean> {
      return !(await check());
    },
    /** A score or an answer arrived: the phone is online. */
    reportOnline(): void {
      set(true);
    },
    check,
    /** Demo screens: pin online or offline (null lets it follow the phone again). */
    force(online: boolean | null): void {
      clear(recheck);
      clear(back);
      recheck = null;
      back = null;
      forced = online !== null;
      state = online === false ? OFFLINE : ONLINE;
      emit();
    },
  };
}

export type Connectivity = ReturnType<typeof createConnectivity>;

const PROBE_URL = 'https://captive.apple.com/hotspot-detect.html';
const PROBE_TIMEOUT_MS = 5_000;

async function probe(): Promise<boolean> {
  if (Platform.OS === 'web') return typeof navigator === 'undefined' || navigator.onLine !== false;
  const ctrl = new AbortController();
  const h = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    // Any answer at all means there's a connection (a captive portal's page too: it's for the phone to sort out).
    await fetch(PROBE_URL, { method: 'HEAD', cache: 'no-store', signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(h);
  }
}

export const connectivity = createConnectivity({
  probe,
  scheduler: realScheduler,
  active: () => AppState.currentState === 'active',
  log: (l) => {
    if (__DEV__) console.log(`[net] ${l}`);
  },
});

// Not under Jest (timers and fetch would outlive the test). At launch, then on every return to the foreground.
const UNDER_TEST = typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined;
let started = false;
export function startConnectivity(): void {
  if (started || UNDER_TEST) return;
  started = true;
  void connectivity.check();
  AppState.addEventListener('change', (s) => {
    if (s === 'active') void connectivity.check();
  });
}

export function useNet(): NetState {
  return useSyncExternalStore(connectivity.subscribe, connectivity.get, connectivity.get);
}
