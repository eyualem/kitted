// The launch screen's floor. On a Release build the JS starts from the phone's own copy and boot() is a few local
// reads, so the screen could be gone before anyone has seen it. This keeps it up until `SPLASH_FLOOR_MS` have passed
// since the JS began (the time iOS spent starting the app before that already counted), and never longer than that:
// a slow boot adds nothing. The fade-out is the splash module's own (`SplashScreen.setOptions` in _layout.tsx).

/** Kept short on purpose: a launch screen is a courtesy, not a wait (the founder's ceiling is about half a second). */
export const SPLASH_FLOOR_MS = 400;
/** The cross-fade into the first screen. */
export const SPLASH_FADE_MS = 300;

/** How much longer to hold the screen, given when the JS started and what time it is now. Never negative. */
export function splashHoldLeft(startedAt: number, now: number, floorMs: number = SPLASH_FLOOR_MS): number {
  return Math.max(0, Math.min(floorMs, startedAt + floorMs - now));
}
