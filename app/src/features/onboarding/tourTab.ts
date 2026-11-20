// Which tab the tab bar reports to Closet's arrivals while the app tour is up, and just after it (specs/app-tour.md AT6.1).
// The tour's visits to Closet and Lookbook are not "opening Closet", so the tab bar reports no tab during it. Skip or Done
// ends the tour a render before the route has moved on to Stylist, so the tab it ended on is ignored until the tab
// changes: otherwise that last render would count as opening Closet (closet.lastOpened written) when Skip is tapped on stop 1.
import { useState } from 'react';

/** `tab` is the tab on screen (undefined over a root page); `touring` is whether a tour stop is up. Returns the tab to
 *  report: undefined while it's blind. */
export function useTourBlindTab(tab: string | undefined, touring: boolean): string | undefined {
  const [held, setHeld] = useState<string | null>(null);
  const here = tab ?? null;
  // Set while touring (it follows the stop's tab); cleared once the tab has moved off the one the tour ended on.
  if (touring ? held !== here : held !== null && here !== held) setHeld(touring ? here : null);
  return touring || (held !== null && here === held) ? undefined : tab;
}
