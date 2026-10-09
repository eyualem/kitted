// Whether the Stylist's typing composer is open (founder, Oct 9). At rest the "Ask your stylist…"
// bar lives in the tab bar's bottom accessory (StylistBar), so it can tuck in beside the shrunk
// bar as he scrolls. Tapping it opens the real composer, which rides the keyboard; it closes again
// once the field is empty and the keyboard is down. The accessory and the screen are separate
// React trees, hence a tiny shared store.
import { useSyncExternalStore } from 'react';

export type ComposerOpen = null | 'type' | 'voice';

let open: ComposerOpen = null;
const listeners = new Set<() => void>();

function set(next: ComposerOpen) {
  if (next === open) return;
  open = next;
  listeners.forEach((l) => l());
}

export const composerState = {
  get: (): ComposerOpen => open,
  open: (mode: 'type' | 'voice') => set(mode),
  close: () => set(null),
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useComposerOpen(): ComposerOpen {
  return useSyncExternalStore(composerState.subscribe, composerState.get, composerState.get);
}
