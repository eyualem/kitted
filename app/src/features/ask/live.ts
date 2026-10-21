// The answer while it streams (07 §6.1): held in memory and drawn by the thread as its last stylist row, so the
// chat table isn't written (and fully reloaded by useLive) on every chunk. The chat_messages row is written once,
// when the answer is done; until the thread has loaded that row, the live row keeps showing it (no flicker).
import { useSyncExternalStore } from 'react';
import { t } from '@/i18n/en';

export type LiveAnswer =
  /** Sent; no words yet (the three dots). */
  | { phase: 'waiting'; questionId: string; replaces: string | null; slow?: boolean }
  | { phase: 'streaming'; questionId: string; replaces: string | null; text: string }
  /** Written as `messageId` at `at`; the thread drops this row once it shows that message (`settle`). */
  | { phase: 'done'; questionId: string; replaces: string | null; text: string; messageId: string; at: number };

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
  /** No first word after 6 s (07 §6.4): the dots get "Taking longer…". */
  slow() {
    if (live?.phase === 'waiting' && !live.slow) set({ ...live, slow: true });
  },
  /** A lookup's second call (R3): the first call's line goes, the dots come back. */
  restart() {
    if (live && live.phase !== 'done') set({ phase: 'waiting', questionId: live.questionId, replaces: live.replaces });
  },
  /** `questionId`: words for a question that isn't the current one (a second send that slipped through) are dropped. */
  append(text: string, questionId?: string) {
    if (!live || live.phase === 'done' || (questionId !== undefined && questionId !== live.questionId)) return;
    set({ phase: 'streaming', questionId: live.questionId, replaces: live.replaces, text: (live.phase === 'streaming' ? live.text : '') + text });
  },
  finish(messageId: string, text: string, at: number, questionId?: string) {
    if (!live || (questionId !== undefined && questionId !== live.questionId)) return;
    set({ phase: 'done', questionId: live.questionId, replaces: live.replaces, text, messageId, at });
  },
  /**
   * The thread now shows the finished answer's own row: nothing left to draw. Without this the finished answer stayed
   * in memory for good and came back as a ghost the next morning or after a wipe (07 §17, U1).
   */
  settle(shownIds: ReadonlySet<string>) {
    if (live?.phase === 'done' && shownIds.has(live.messageId)) set(null);
  },
  /** Failed, a wipe, or a demo screen resets: nothing left to draw. */
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

/**
 * Whether the live row still has something to draw, given the ids the thread shows and today's day key. A finished
 * answer written on another day never draws in today's thread (U1).
 */
export function liveRowShows(live: LiveAnswer | null, shownIds: ReadonlySet<string>, sameDay: (at: number) => boolean = () => true): boolean {
  if (!live) return false;
  if (live.phase !== 'done') return true;
  return !shownIds.has(live.messageId) && sameDay(live.at);
}

/** What VoiceOver hears on the row while the answer is on its way (07 §17, U15); null once it's done. */
export function liveRowSpoken(live: LiveAnswer): string | null {
  if (live.phase === 'done') return null;
  return live.phase === 'waiting' && live.slow ? `${t('ask.a11yWriting')}. ${t('ask.slow')}` : t('ask.a11yWriting');
}
