// The Outfits switch (specs/closet-beta.md CB1): Outfits, Next best buy and Goes with are off for the beta
// (OUTFITS_BUILT). A demo screen that shows them (demo/scenarios.ts `outfits`) turns them on for itself; every other
// demo screen turns them back off, so leaving 182 for 15 drops the Pieces | Outfits switch again. Modelled on the
// accounts switch (features/account/account.ts).
import { useSyncExternalStore } from 'react';
import { OUTFITS_BUILT } from '@/config/features';
import type { ScreenScenario } from '@/demo/scenarios';

let demoOn = false;
const listeners = new Set<() => void>();

/** Outfits are on: in a build that has them, or on a demo screen that shows them. */
export function outfitsOn(): boolean {
  return OUTFITS_BUILT || demoOn;
}

/** A demo screen turns Outfits on or off for itself (and tests reset it). Redraws every screen that reads the switch. */
export function setDemoOutfits(on: boolean): void {
  if (demoOn === on) return;
  demoOn = on;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** `outfitsOn()` as a hook: re-renders when a demo screen flips it. */
export function useOutfitsOn(): boolean {
  return useSyncExternalStore(subscribe, outfitsOn, outfitsOn);
}

/** Every demo screen calls this: on only where the screen says so. */
export function prepareOutfitsDemo(sc: Pick<ScreenScenario, 'outfits'>): void {
  setDemoOutfits(sc.outfits === true);
}
