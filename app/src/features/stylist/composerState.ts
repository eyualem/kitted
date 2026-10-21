// Whether the Stylist's typing composer is open (founder, Oct 9). At rest the "Ask your stylist…"
// bar lives in the tab bar's bottom accessory (StylistBar), so it can tuck in beside the shrunk
// bar as he scrolls. Tapping it opens the real composer, which rides the keyboard; it closes again
// once the field is empty and the keyboard is down. The accessory and the screen are separate
// React trees, hence a tiny shared store.
// It also holds his draft (07 §6.1): the words survive the composer closing, unmounting or the app going to the
// background, and are cleared only once a question made it into the thread.
import { useSyncExternalStore } from 'react';

export type ComposerOpen = null | 'type' | 'voice';

let open: ComposerOpen = null;
let draft = '';
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

function set(next: ComposerOpen) {
  if (next === open) return;
  open = next;
  notify();
}

export const composerState = {
  get: (): ComposerOpen => open,
  open: (mode: 'type' | 'voice') => set(mode),
  close: () => set(null),
  draft: (): string => draft,
  setDraft(next: string) {
    if (next === draft) return;
    draft = next;
    notify();
  },
  /** Words from the mic join the draft after anything he typed (07 §18, L4). Never sends. */
  appendHeard(heard: string) {
    const h = heard.trim();
    if (!h) return;
    const cur = draft;
    composerState.setDraft(cur ? `${cur} ${h}` : h);
  },
  /** After a send: clears the draft only if it's still the words that were sent (he may have typed on meanwhile). */
  clearDraftIf(sent: string) {
    if (draft.trim() === sent.trim()) composerState.setDraft('');
  },
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

export function useComposerDraft(): string {
  return useSyncExternalStore(composerState.subscribe, composerState.draft, composerState.draft);
}
