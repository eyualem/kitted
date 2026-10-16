// A tiny change bus: stores emit the table that changed; screens re-read (useLive). Same on
// SQLite and memory, which is why it's ours and not expo-sqlite's change listener (06 §6).
//
// A closet write that changes many rows (an Undo, a merge) holds its notices and sends them together when it ends
// (holdChanges, #294), so every open screen re-reads once, not once per row. A hold never delays a notice by more than
// MAX_HOLD_MS: past it, what's held goes out and the rest keeps collecting.
import type { TableName } from './tables';

export type Topic = TableName | 'kv';
type Listener = (topic: Topic, key: string | null) => void;

const listeners = new Set<Listener>();

/** The longest a held notice waits (a slow job must not freeze another screen's update). */
export const MAX_HOLD_MS = 120;

let holds = 0;
const held = new Map<string, { topic: Topic; key: string | null }>();
let holdTimer: ReturnType<typeof setTimeout> | null = null;

function send(topic: Topic, key: string | null) {
  listeners.forEach((l) => l(topic, key));
}

function flush() {
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = null;
  const out = [...held.values()];
  held.clear();
  for (const c of out) send(c.topic, c.key);
}

export function emitChange(topic: Topic, key: string | null = null): void {
  if (holds === 0) {
    send(topic, key);
    return;
  }
  held.set(`${topic}\u0000${key ?? ''}`, { topic, key });
  if (!holdTimer) holdTimer = setTimeout(flush, MAX_HOLD_MS);
}

/** Holds change notices until the returned release (each hold released once; nested holds release with the last). */
export function holdChanges(): () => void {
  holds++;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    holds--;
    if (holds === 0) flush();
  };
}

/** Subscribe to some topics (and optionally one key). Returns the unsubscribe. */
export function onChange(topics: readonly Topic[], cb: () => void, key?: string | null): () => void {
  const set = new Set(topics);
  const l: Listener = (topic, k) => {
    if (!set.has(topic)) return;
    if (key && k && k !== key) return;
    cb();
  };
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
