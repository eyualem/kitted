// The answer while it streams (07 §6.1): held in memory and drawn by the thread as its last stylist row, so the
// chat table isn't written (and fully reloaded by useLive) on every chunk. The chat_messages row is written once,
// when the answer is done; until the thread has loaded that row, the live row keeps showing it (no flicker).
import { useSyncExternalStore } from 'react';

export type LiveAnswer =
  /** Sent; no words yet (the three dots). */
  | { phase: 'waiting'; questionId: string; replaces: string | null }
  | { phase: 'streaming'; questionId: string; replaces: string | null; text: string }
  /** Written as `messageId`; the thread drops this row once it shows that message. */
  | { phase: 'done'; questionId: string; replaces: string | null; text: string; messageId: string };

let live: LiveAnswer | null = null;
const listeners = new Set<() => void>();

function set(next: LiveAnswer | null) {
  live = next;
  listeners.forEach((l) => l());
}

export const liveAnswer = {
  get: (): LiveAnswer | null => live,
  /** A question in flight (waiting or streaming): send waits (one at a time, 07 §6.1). */
  inFlight: (): boolean => live !== null && live.phase !== 'done',
  start: (questionId: string, replaces: string | null = null) => set({ phase: 'waiting', questionId, replaces }),
  append(text: string) {
    if (!live || live.phase === 'done') return;
    set({ phase: 'streaming', questionId: live.questionId, replaces: live.replaces, text: (live.phase === 'streaming' ? live.text : '') + text });
  },
  finish(messageId: string, text: string) {
    if (!live) return;
    set({ phase: 'done', questionId: live.questionId, replaces: live.replaces, text, messageId });
  },
  /** Failed, or a demo screen resets: nothing left to draw. */
  clear: () => {
    if (live !== null) set(null);
  },
  /** Demo screens 90–91: hold a state as it is (nothing is streaming behind it). */
  hold: (state: LiveAnswer) => set(state),
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useLiveAnswer(): LiveAnswer | null {
  return useSyncExternalStore(liveAnswer.subscribe, liveAnswer.get, liveAnswer.get);
}

export function useAskInFlight(): boolean {
  return useSyncExternalStore(liveAnswer.subscribe, liveAnswer.inFlight, liveAnswer.inFlight);
}
