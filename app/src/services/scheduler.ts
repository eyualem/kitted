// Timers behind an interface so the fit-check machine and the mock source run on fake time in
// Jest (jest.useFakeTimers drives these the same way).

export interface Scheduler {
  /** Resolves after `ms`; rejects with an AbortError if the signal fires first. */
  sleep(ms: number, signal?: AbortSignal): Promise<void>;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
}

export class AbortError extends Error {
  constructor() {
    super('Aborted');
    this.name = 'AbortError';
  }
}

export const realScheduler: Scheduler = {
  sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new AbortError());
      const h = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(h);
        reject(new AbortError());
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  },
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};
