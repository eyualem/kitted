// A tiny change bus: stores emit the table that changed; screens re-read (useLive). Same on
// SQLite and memory, which is why it's ours and not expo-sqlite's change listener (06 §6).
import type { TableName } from './tables';

export type Topic = TableName | 'kv';
type Listener = (topic: Topic, key: string | null) => void;

const listeners = new Set<Listener>();

export function emitChange(topic: Topic, key: string | null = null): void {
  listeners.forEach((l) => l(topic, key));
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
