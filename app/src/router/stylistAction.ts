// Cross-tab jumps (02 §1.4, 06 §8): a button in Closet, Lookbook or You sets the action and
// switches to Stylist; the Stylist screen consumes it in an effect and clears it.
// Not a route param: params stick to the screen and fire again on re-render or back.
import { useSyncExternalStore } from 'react';
import { router } from 'expo-router';

export type StylistAction =
  | { kind: 'checkMyFit' }
  | { kind: 'styleItem'; itemId: string }
  | { kind: 'wearAgain'; lookId: string }
  | { kind: 'recheck'; lookId: string }
  | { kind: 'scrollTo'; messageId: string }
  | { kind: 'startMove'; moveId: string }
  | { kind: 'openCard'; messageId: string };

let pending: StylistAction | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setStylistAction(action: StylistAction | null): void {
  pending = action;
  emit();
}

export function getStylistAction(): StylistAction | null {
  return pending;
}

/** Sets the action and switches to the Stylist tab (the other tabs keep their stacks). */
export function goToStylist(action: StylistAction): void {
  setStylistAction(action);
  router.navigate('/stylist');
}

export function clearStylistAction(): void {
  setStylistAction(null);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function usePendingStylistAction(): StylistAction | null {
  return useSyncExternalStore(subscribe, getStylistAction, getStylistAction);
}
