// The app's morning/evening card service, wired to the store, the session clock and the weather
// source. Demo screens that tell a fixed story (6–11, …) don't get a card posted into them.
import { store } from '@/data/db';
import { getDemoState } from '@/demo/demoState';
import { newId } from '@/services/ids';
import { weatherSource } from '@/services/weather';
import { sessionClock } from '@/state/session';
import { createMorningService } from './service';

/** Demo screens where the card belongs: Stylist home (12) and the card's own screens (25–34). */
export const MORNING_DEMO_SCREENS: ReadonlySet<number> = new Set([12, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]);

export const morning = createMorningService({
  store,
  clock: sessionClock,
  weather: weatherSource,
  ids: newId,
  enabled: () => {
    const screen = getDemoState().screen;
    return screen === null || MORNING_DEMO_SCREENS.has(screen);
  },
});
