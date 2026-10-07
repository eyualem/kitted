// Pro or not, behind an interface (05 §3.2). Demo: a local flag (`pro=1`, the demo store in P6).
// v1: RevenueCat (founder decision S8) behind the same interface.
import { useSyncExternalStore } from 'react';

export interface Entitlements {
  isPro(): boolean;
  subscribe(cb: () => void): () => void;
}

let pro = false;
const listeners = new Set<() => void>();

export const demoEntitlements: Entitlements & { setPro(v: boolean): void } = {
  isPro: () => pro,
  subscribe(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  setPro(v) {
    pro = v;
    listeners.forEach((l) => l());
  },
};

export function useIsPro(): boolean {
  return useSyncExternalStore(demoEntitlements.subscribe, demoEntitlements.isPro, demoEntitlements.isPro);
}
