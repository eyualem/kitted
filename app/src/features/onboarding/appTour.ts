// The app tour's state (specs/app-tour.md AT3, AT4, Data): two stops over the real Closet and Lookbook tabs, right after
// About you's Continue with an 18+ band. One kv key on this phone only (`appTour.state`, sync/schema.ts KV_LOCAL):
// `pending` from setup's end, `done` when Skip, Done or the app closing ends it; missing means done (a phone that
// finished setup before this update). "Delete all my data" empties the kv table, so the tour plays again after setup.
// The stop he is on lives in memory only: a relaunch never resumes it (AT4.2). The tour saves nothing else and sends
// nothing: no piece, no look, no fact, no event.
import { useSyncExternalStore } from 'react';
import type { KittedStore } from '@/data/store';
import { SEEN_UNTIL_KEY } from '@/features/stylist/arrival';

/** The kv key. Every call below writes it out (not TOUR_KEY) so the sync test's scan of kv literals can classify it. */
export const TOUR_KEY = 'appTour.state';

export type TourStop = 1 | 2;
export const TOUR_STOPS = 2;

let stop: TourStop | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setStop(next: TourStop | null) {
  if (stop === next) return;
  stop = next;
  emit();
}

/** The stop on screen, or null (no tour). */
export function getTourStop(): TourStop | null {
  return stop;
}

export function useTourStop(): TourStop | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => stop,
    () => stop,
  );
}

/** Setup's end (aboutStep.finishSetup, 18+ only; never Restore, never under 18): the tour is pending and stop 1 is up. */
export async function startTour(store: Pick<KittedStore, 'setKv'>): Promise<void> {
  await store.setKv('appTour.state', 'pending');
  setStop(1);
}

/** `Next` on stop 1. Does nothing anywhere else. */
export function nextStop(): void {
  if (stop === 1) setStop(2);
}

/** `Skip` (either stop) and `Done`: the tour is over for good, and the app moves to Stylist (TourHost). */
export async function endTour(store: Pick<KittedStore, 'setKv'>): Promise<void> {
  if (stop === null) return;
  setStop(null);
  await store.setKv('appTour.state', 'done');
}

/** At launch: a tour still `pending` means the app closed during it, which counts as seen (AT4.2). It ends, and Kit's
 *  hello is still new to him: the thread's "seen until" never moved past it, so it plays as AT3 says. Nothing when no
 *  tour is on screen and the key isn't `pending`. */
export async function settleTourAtLaunch(store: Pick<KittedStore, 'getKv' | 'setKv' | 'chat'>): Promise<void> {
  if (stop !== null) return;
  if ((await store.getKv('appTour.state')) !== 'pending') return;
  await store.setKv('appTour.state', 'done');
  const hello = (await store.chat.all()).filter((m) => m.role === 'stylist' && m.payload.aiNote === true).sort((a, b) => a.createdAt - b.createdAt)[0];
  if (!hello) return;
  // Never written (the first launch ever reads "what's made during this launch" as new, and the hello is from the last
  // one) or written past the hello: put it just before the hello.
  const raw = await store.getKv(SEEN_UNTIL_KEY);
  const seen = raw === null ? Number.NaN : Number(raw);
  if (!Number.isFinite(seen) || seen >= hello.createdAt) await store.setKv(SEEN_UNTIL_KEY, String(hello.createdAt - 1));
}

let settling: Promise<void> | null = null;

/** The launch settle, once per launch: the tab bar starts it and Stylist waits for it before it reads "seen until", so the
 *  corrected mark is always the one Stylist reads (whichever of them mounts first). */
export function settleTourOnce(store: Pick<KittedStore, 'getKv' | 'setKv' | 'chat'>): Promise<void> {
  return (settling ??= settleTourAtLaunch(store));
}

/** A demo screen or a test: forget the stop in memory (nothing is saved or navigated). */
export function resetTour(): void {
  stop = null;
  settling = null;
  emit();
}
