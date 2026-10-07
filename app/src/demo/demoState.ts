// Which demo screen's state is loaded (null = normal use). Reactive so a demo link that
// arrives while the app is running updates the screens. The per-screen story state is
// added by P2 (Stylist cards), P5 (tabs) and P6 (paywall, limit, share).
import { useSyncExternalStore } from 'react';
import type { Theme } from './demoArgs';

export interface DemoState {
  screen: number | null;
  /** Forced appearance from `theme=` (web screenshots need it; headless Chrome reports light). */
  theme: Theme | null;
  /** Web only: fake iPhone 17 Pro safe areas (`frame=1`). */
  frame: boolean;
}

let state: DemoState = { screen: null, theme: null, frame: false };
const listeners = new Set<() => void>();

export function setDemoState(patch: Partial<DemoState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getDemoState(): DemoState {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getDemoState, getDemoState);
}
