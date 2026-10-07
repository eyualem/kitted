// The propped-camera rhythm (02 D5, ruling 14): the guide must read "good" steadily for 0.5 s,
// then 3 → 2 → 1 (1 s each) → capture. Leaving "good" during the count cancels it. Pure (timers
// injected), so it's tested without a camera.
export type Phase = { kind: 'waiting' } | { kind: 'counting'; n: 3 | 2 | 1 } | { kind: 'done' };

export interface AutoCaptureOptions {
  steadyMs?: number;
  tickMs?: number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (h: unknown) => void;
  onPhase: (p: Phase) => void;
  onCapture: () => void;
}

export function createAutoCapture(o: AutoCaptureOptions) {
  const steadyMs = o.steadyMs ?? 500;
  const tickMs = o.tickMs ?? 1000;
  let phase: Phase = { kind: 'waiting' };
  let steady: unknown = null;
  let tick: unknown = null;
  const set = (p: Phase) => {
    phase = p;
    o.onPhase(p);
  };
  const clear = () => {
    if (steady !== null) o.clearTimer(steady);
    if (tick !== null) o.clearTimer(tick);
    steady = tick = null;
  };
  const count = (n: 3 | 2 | 1) => {
    set({ kind: 'counting', n });
    tick = o.setTimer(() => {
      tick = null;
      if (n > 1) count((n - 1) as 2 | 1);
      else {
        set({ kind: 'done' });
        o.onCapture();
      }
    }, tickMs);
  };
  return {
    get phase() {
      return phase;
    },
    /** Feed every guide update. */
    feed(good: boolean) {
      if (phase.kind === 'done') return;
      if (!good) {
        if (phase.kind === 'counting' || steady !== null) {
          clear();
          if (phase.kind === 'counting') set({ kind: 'waiting' });
        }
        return;
      }
      if (phase.kind === 'waiting' && steady === null) {
        steady = o.setTimer(() => {
          steady = null;
          count(3);
        }, steadyMs);
      }
    },
    /** Start the 3-2-1 now (Mirror mode's timer, or a test). */
    startCount() {
      if (phase.kind !== 'waiting') return;
      clear();
      count(3);
    },
    reset() {
      clear();
      set({ kind: 'waiting' });
    },
    dispose: clear,
  };
}
