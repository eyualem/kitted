// The paywall's and the notification ask's switches, and the store and permission in use (10-onboarding.md §9.4–9.5).
// The paywall is off in real builds (PAYWALL_BUILT): his phone never shows a paywall that sells nothing. Notifications
// are on where the build has expo-notifications' native module (NOTIFICATIONS_BUILT and nativeAvailable): a build
// without it shows no ask that can't ask. A demo screen turns each on with a scripted outcome (demo/scenarios.ts
// `paywall`, `notify`), and never touches the real permission.
// On the beta's rules (the server's tier `beta`, FP7) the paywall is off whatever turned it on: one gate for every entry.
import { useSyncExternalStore } from 'react';
import { NOTIFICATIONS_BUILT, PAYWALL_BUILT } from '@/config/features';
import { createMockStore, type PurchaseStore, type StoreScript } from '@/services/purchases';
import { scriptedNotifications, unbuiltNotifications, type NotificationPermissions, type NotifyPermission } from '@/services/notifications';
import { nativeAvailable, nativePermissions } from '@/services/notificationsNative';
import { onTierChange, tierNow } from '@/services/server/tier';

let storeScript: StoreScript | null = null;
let notifyScript: NotificationPermissions | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export function setDemoPaywall(script: StoreScript | null): void {
  storeScript = script;
  changed();
}

/** A demo screen's iOS: Apple's prompt answers allow, deny, or stays up (pending), from `start`. */
export function setDemoNotify(answer: 'allow' | 'deny' | 'pending' | null, start?: NotifyPermission): void {
  notifyScript = answer ? scriptedNotifications(answer, start) : null;
  changed();
}

/** A demo script is in use (demo screens never schedule real notifications). */
export const notifyScripted = (): boolean => notifyScript !== null;

export const paywallOn = (): boolean => (PAYWALL_BUILT || storeScript !== null) && tierNow() !== 'beta';
export const notificationsOn = (): boolean => (NOTIFICATIONS_BUILT && nativeAvailable) || notifyScript !== null;

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

const realPermissions: NotificationPermissions = nativeAvailable ? nativePermissions : unbuiltNotifications;

/** The permission in use: scripted on a demo screen, else iOS's (or the unbuilt one on a build without the module). */
export const notifications: NotificationPermissions = {
  permission: () => (notifyScript ?? realPermissions).permission(),
  request: () => (notifyScript ?? realPermissions).request(),
};
