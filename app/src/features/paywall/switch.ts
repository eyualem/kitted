// The paywall's and the notification ask's switches, and the store and permission in use (10-onboarding.md §9.4–9.5).
// Off in real builds (PAYWALL_BUILT, NOTIFICATIONS_BUILT): his phone never shows a paywall that sells nothing or an
// ask that can't ask. A demo screen turns each on with a scripted outcome (demo/scenarios.ts `paywall`, `notify`).
// On the beta's rules (the server's tier `beta`, FP7) the paywall is off whatever turned it on: one gate for every entry.
import { useSyncExternalStore } from 'react';
import { NOTIFICATIONS_BUILT, PAYWALL_BUILT } from '@/config/features';
import { createMockStore, type PurchaseStore, type StoreScript } from '@/services/purchases';
import { scriptedNotifications, unbuiltNotifications, type NotificationPermissions } from '@/services/notifications';
import { onTierChange, tierNow } from '@/services/server/tier';

let storeScript: StoreScript | null = null;
let notifyScript: NotificationPermissions | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export function setDemoPaywall(script: StoreScript | null): void {
  storeScript = script;
  changed();
}

export function setDemoNotify(answer: 'allow' | 'deny' | null): void {
  notifyScript = answer ? scriptedNotifications(answer) : null;
  changed();
}

export const paywallOn = (): boolean => (PAYWALL_BUILT || storeScript !== null) && tierNow() !== 'beta';
export const notificationsOn = (): boolean => NOTIFICATIONS_BUILT || notifyScript !== null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The paywall's switch changes with the store script and with the tier. */
function subscribePaywall(cb: () => void) {
  const off = subscribe(cb);
  const offTier = onTierChange(cb);
  return () => {
    off();
    offTier();
  };
}

export function usePaywallOn(): boolean {
  return useSyncExternalStore(subscribePaywall, paywallOn, paywallOn);
}

/** The store in use: the mock until RevenueCat (05 S8). */
export const purchases: PurchaseStore = createMockStore({ script: () => storeScript ?? 'ok' });

/** The permission in use: scripted on a demo screen, else the unbuilt one (no package yet). */
export const notifications: NotificationPermissions = {
  permission: () => (notifyScript ?? unbuiltNotifications).permission(),
  request: () => (notifyScript ?? unbuiltNotifications).request(),
};
