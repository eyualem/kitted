// Screen → scenario map for /demo/screen/<n> and -demoScreen <n> (04 §10.3, 05 §5.2).
// P0 sets the gate, clock and route; the per-screen thread/story state is filled in by the
// phase that builds each screen (P2 Stylist cards, P5 tabs, P6 paywall/limit/share).

export type ScenarioName = 'firstRun' | 'full';

export interface ScreenScenario {
  n: number;
  /** Mockup screen name (05 §2 table). */
  name: string;
  /** 02 screen ID. */
  id: string;
  scenario: ScenarioName;
  /** Whether onboarding counts as done for this screen. */
  onboarded: boolean;
  /** Demo clock start (America/New_York wall time). */
  now: string;
  freeChecksUsed?: number;
  /** Where to land, using the same routes the real UI uses. */
  href: string;
}

const FIRST_RUN_NOW = '2026-10-22T07:38:00';
const FULL_NOW = '2026-10-22T12:20:00';

/** The scripted first-run story's check ids (seed.json's story has none; these are ours). */
export const STORY_FIRST_CHECK = 'story-first';
export const STORY_RECHECK = 'story-recheck';

export const SCREENS: readonly ScreenScenario[] = [
  { n: 1, name: 'Welcome', id: 'O1', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/welcome' },
  { n: 2, name: 'Pick looks', id: 'O2', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/looks' },
  { n: 3, name: 'Basics', id: 'O3', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/basics' },
  { n: 4, name: 'Consent', id: 'O5', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/consent' },
  { n: 5, name: 'Camera', id: 'S2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera' },
  { n: 6, name: 'Reading', id: 'S5', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:42:00', href: '/stylist' },
  { n: 7, name: 'Result', id: 'S6', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 8, name: 'Why this score', id: 'S7', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: `/sheets/why/${STORY_FIRST_CHECK}` },
  { n: 9, name: 'Not quite right?', id: 'S8', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:44:00', href: `/sheets/correct/${STORY_FIRST_CHECK}` },
  { n: 10, name: 'Re-check', id: 'S6r', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:50:00', href: '/stylist' },
  { n: 11, name: 'Partial check', id: 'S6p', scenario: 'full', onboarded: true, now: '2026-10-20T08:11:00', href: '/stylist' },
  { n: 12, name: 'Stylist home', id: 'S1', scenario: 'full', onboarded: true, now: '2026-10-22T08:01:00', freeChecksUsed: 0, href: '/stylist' },
  { n: 13, name: 'Outfit idea', id: 'S20', scenario: 'full', onboarded: true, now: '2026-10-22T08:05:00', href: '/stylist' },
  { n: 14, name: 'Notifications', id: 'N1–N3', scenario: 'full', onboarded: true, now: '2026-10-22T08:00:00', href: '/demo/lockscreen' },
  { n: 15, name: 'Closet', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet' },
  { n: 16, name: 'Lookbook', id: 'L1', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/lookbook' },
  { n: 17, name: 'You', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you' },
  { n: 18, name: 'Paywall', id: 'P1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T09:44:00', href: '/paywall' },
  { n: 19, name: 'Limit reached', id: 'S17', scenario: 'full', onboarded: true, now: '2026-10-22T21:12:00', freeChecksUsed: 1, href: '/stylist' },
  { n: 20, name: 'Share card', id: 'S12', scenario: 'full', onboarded: true, now: '2026-10-22T07:51:00', href: '/share/FC3R' },
];

export function screenScenario(n: number): ScreenScenario | undefined {
  return SCREENS.find((s) => s.n === n);
}
