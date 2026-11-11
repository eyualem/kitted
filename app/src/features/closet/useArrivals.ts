// Closet's badge and his first visit, kept by the tab bar (app/(tabs)/_layout.tsx; the rules: arrivals.ts). The tab
// bar is always there, so it sees every tab change: opening Closet clears the badge; leaving it (another tab, or the
// app going to the background) ends the first visit. A sheet or a piece's page opened from Closet is still Closet.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { store } from '@/data/db';
import { useLive, watchChanges } from '@/data/useLive';
import { sessionClock } from '@/state/session';
import { badgeCount, endFirstVisit, initArrivals, LAST_OPENED_KEY, noteFirstAddingCheck, openCloset, parseLastOpened, seeCloset } from './arrivals';
import { useHeldChecks } from './slide';

// The check whose pieces this Closet visit shows first (null: not the first visit). In memory: the mark on the phone is
// done as soon as he leaves or the app goes away, and a visit back from the background keeps what it showed.
let showing: string | null = null;
const listeners = new Set<() => void>();
function setShowing(v: string | null) {
  if (showing === v) return;
  showing = v;
  for (const l of listeners) l();
}

export function useFirstVisitCheck(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => showing,
    () => showing,
  );
}

/** The badge's number for the Closet tab (0: none). `tab` is the tab on screen, undefined over a root page. */
export function useClosetArrivals(tab: string | undefined): number {
  useEffect(() => {
    void initArrivals(store, sessionClock.nowMs());
    // His first adding check is recorded as soon as its pieces are in, whatever tab he's on.
    const note = () => void noteFirstAddingCheck(store);
    note();
    return watchChanges(['closet', 'fitChecks'], note);
  }, []);

  const current = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (tab === undefined) return; // a root page (a sheet, the camera) over the tabs: still the same tab
    const prev = current.current;
    current.current = tab;
    if (prev === tab) return;
    const now = sessionClock.nowMs();
    if (tab === 'closet') {
      void openCloset(store, now).then((id) => {
        if (current.current === 'closet') setShowing(id);
      });
    } else if (prev === 'closet') {
      void seeCloset(store, now);
      // Only a visit that showed it ends it (a first check that lands while he's on Closet waits for his next visit).
      if (showing) void endFirstVisit(store);
      setShowing(null);
    }
  }, [tab]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' && current.current === 'closet' && showing) void endFirstVisit(store);
    });
    return () => sub.remove();
  }, []);

  const lastOpened = parseLastOpened(useLive(['kv'], () => store.getKv(LAST_OPENED_KEY), [], LAST_OPENED_KEY));
  const held = useHeldChecks();
  const heldKey = [...held].sort().join();
  const count = useLive(['closet', 'fitChecks'], async () => badgeCount(await store.closet.all(), await store.fitChecks.all(), lastOpened, held), [lastOpened, heldKey]);
  return tab === 'closet' ? 0 : count ?? 0;
}
