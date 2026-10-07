// Live reads without a state library: load once, then re-load when a watched table changes.
// Several changes in one tick become one reload; a stale load never overwrites a newer one.
import { useEffect, useState, type DependencyList } from 'react';
import { onChange, type Topic } from './changes';

export function useLive<T>(topics: readonly Topic[], load: () => Promise<T>, deps: DependencyList, key?: string | null): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    let seq = 0;
    let scheduled = false;
    const run = () => {
      const mine = ++seq;
      load()
        .then((v) => {
          if (alive && mine === seq) setValue(v);
        })
        .catch((e: unknown) => console.error('useLive load failed', e));
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      void Promise.resolve().then(() => {
        scheduled = false;
        if (alive) run();
      });
    };
    run();
    const off = onChange(topics, schedule, key);
    return () => {
      alive = false;
      off();
    };
    // `load` and `topics` are re-created each render; callers list what they depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, key, topics.join()]);
  return value;
}
