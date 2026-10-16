// Live reads without a state library: load once, then re-load when a watched table changes.
// Several changes in one tick become one reload; a stale load never overwrites a newer one.
import { useEffect, useState, type DependencyList } from 'react';
import { onChange, type Topic } from './changes';

/**
 * Calls `reload` once per burst of changes to `topics` (changes in the same tick become one call). The hook's wiring,
 * apart so tests can count reloads (09-ui-review §9 U4). Returns the unsubscribe.
 */
export function watchChanges(topics: readonly Topic[], reload: () => void, key?: string | null): () => void {
  let alive = true;
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    void Promise.resolve().then(() => {
      scheduled = false;
      if (alive) reload();
    });
  };
  const off = onChange(topics, schedule, key);
  return () => {
    alive = false;
    off();
  };
}

export function useLive<T>(topics: readonly Topic[], load: () => Promise<T>, deps: DependencyList, key?: string | null): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    let seq = 0;
    const run = () => {
      const mine = ++seq;
      load()
        .then((v) => {
          if (alive && mine === seq) setValue(v);
        })
        .catch((e: unknown) => console.error('useLive load failed', e));
    };
    run();
    const off = watchChanges(topics, () => {
      if (alive) run();
    }, key);
    return () => {
      alive = false;
      off();
    };
    // `load` and `topics` are re-created each render; callers list what they depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, key, topics.join()]);
  return value;
}
