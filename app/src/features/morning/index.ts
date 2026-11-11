// The app's morning/evening card service, wired to the store, the session clock and the weather
// source. Demo screens that tell a fixed story (6–11, …) don't get a card posted into them.
import { store } from '@/data/db';
import { getDemoState } from '@/demo/demoState';
import { newId } from '@/services/ids';
import { weatherSource } from '@/services/weather';
import { getDemoArgs, sessionClock } from '@/state/session';
import { createMorningService } from './service';

/** Demo screens where the card belongs: Stylist home (12), the card's own screens (25–32; 39, 40 and 54, the card that
 * waits for two outfits), the beta morning card (259) and 290–291 (290: it must stay away, first check pending; 291: after it). */
export const MORNING_DEMO_SCREENS: ReadonlySet<number> = new Set([12, 25, 26, 27, 28, 29, 30, 31, 32, 39, 40, 54, 259, 290, 291]);

export const morning = createMorningService({
  store,
  clock: sessionClock,
  weather: weatherSource,
  ids: newId,
  enabled: () => {
    // The launch/link argument, set before the screen's data loads; Stylist is often already
    // mounted (and focused) while it does, so the demo state alone was read too late.
    const screen = getDemoArgs().demoScreen ?? getDemoState().screen;
    return screen === null || MORNING_DEMO_SCREENS.has(screen);
  },
});
