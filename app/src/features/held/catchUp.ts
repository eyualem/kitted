// S17h: after 4 am, opening Kitted asks "Ready to score last night's photo?": once at launch and on every return to the
// foreground (#280, #281). The run itself (fitCheck.onAppOpen → offerHeld) decides what's due; nothing is sent until he
// taps Score it.

type Run = () => Promise<unknown>;
type Subscribe = (onChange: (state: string) => void) => unknown;

/** Runs `run` now and whenever the app becomes active. Never throws (a failed run waits for the next foreground). */
export function createHeldCatchUp(run: Run, subscribe: Subscribe): void {
  const fail = (e: unknown) => console.log('[held] catch-up failed', String(e));
  const go = () => {
    try {
      void run().catch(fail);
    } catch (e) {
      fail(e);
    }
  };
  go();
  // Never throws, the subscription included (a runtime without AppState listeners, e.g. a test's stub, just skips it).
  try {
    subscribe((s) => {
      if (s === 'active') go();
    });
  } catch (e) {
    fail(e);
  }
}
