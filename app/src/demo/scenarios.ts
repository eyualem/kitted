// Screen → scenario map for /demo/screen/<n> and -demoScreen <n> (04 §10.3, 05 §5.2).
// P0 sets the gate, clock and route; the per-screen thread/story state is filled in by the
// phase that builds each screen (P2 Stylist cards, P5 tabs, P6 paywall/limit/share).

import type { AuthProvider, MockScript } from '@/features/account/auth';
import type { FinishDemo } from '@/features/finish/demo';

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
  /** For sheets and covers: the screen they're presented over (a sheet needs something beneath it). */
  under?: string;
  /** Morning/evening card screens: the sample weather, and whether he has allowed it (02 "S1d"). */
  weather?: 'coldRain' | 'mild' | 'hot' | 'freezing';
  weatherAllowed?: boolean;
  /** Account screens (10-onboarding.md, #289): turns them on with MockAuth's scripted outcome; `signedIn` starts signed
   *  in with that provider; `offer` posts "Keep your fits" (open, or after Not now). */
  accounts?: { script: MockScript; signedIn?: AuthProvider; offer?: 'open' | 'declined' };
  /** The end of onboarding (10-onboarding.md §9, #291): turns the sequence on, scripts the store and the notification
   *  answer, and plays its taps (features/finish/demo.ts). */
  finish?: FinishDemo;
}

const FIRST_RUN_NOW = '2026-10-22T07:38:00';
const FULL_NOW = '2026-10-22T12:20:00';
/** The end of onboarding's screens (150–162): a minute after his first check. */
const FIRST_CHECK_NOW = '2026-10-22T07:43:00';

/** The scripted first-run story's check ids (seed.json's story has none; these are ours). */
export const STORY_FIRST_CHECK = 'story-first';
export const STORY_RECHECK = 'story-recheck';
/** Screen 11's live partial check (s24) inside the full scenario. */
export const STORY_PARTIAL = 'story-partial';
/** Screens 34–36: the one quick tap on the founder's Oct 7 reading (ph1, on s12's stand-in photo). */
export const STORY_TAP = 'story-tap';
/** Screens 60–62: the shoe question on the founder's Oct 8 reading (ph8, his boots read as slides). */
export const STORY_SHOES = 'story-shoes';
/** Screens 63–64: "Your grey work boots?" (#126): ph8 answered Boots on Oct 21, then ph9 (boots read "other") on Oct 22. */
export const STORY_KNOWN = 'story-known';

export const SCREENS: readonly ScreenScenario[] = [
  { n: 1, name: 'Welcome', id: 'O1', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/welcome' },
  { n: 2, name: 'Pick looks', id: 'O2', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/looks' },
  { n: 3, name: 'Basics', id: 'O3', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/basics' },
  { n: 4, name: 'Consent', id: 'O5', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/consent' },
  { n: 5, name: 'Camera', id: 'S2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera?freeze=1', under: '/stylist' },
  { n: 6, name: 'Reading', id: 'S5', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:42:00', href: '/stylist' },
  { n: 7, name: 'Result', id: 'S6', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 8, name: 'Why this score', id: 'S7', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: `/sheets/why/${STORY_FIRST_CHECK}`, under: '/stylist' },
  { n: 9, name: 'Not quite right?', id: 'S8', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:44:00', href: `/sheets/correct/${STORY_FIRST_CHECK}?reason=detail&garment=1&field=leg_shape&value=slim`, under: '/stylist' },
  { n: 10, name: 'Re-check', id: 'S6r', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:50:00', href: '/stylist' },
  { n: 11, name: 'Partial check', id: 'S6p', scenario: 'full', onboarded: true, now: '2026-10-20T08:11:00', href: '/stylist' },
  { n: 12, name: 'Stylist home', id: 'S1', scenario: 'full', onboarded: true, now: '2026-10-22T08:01:00', freeChecksUsed: 0, href: '/stylist', weather: 'coldRain', weatherAllowed: true },
  { n: 13, name: 'Outfit idea', id: 'S20', scenario: 'full', onboarded: true, now: '2026-10-22T08:05:00', href: '/stylist' },
  { n: 14, name: 'Notifications', id: 'N1–N3', scenario: 'full', onboarded: true, now: '2026-10-22T08:00:00', href: '/demo/lockscreen', under: '/stylist' },
  { n: 15, name: 'Closet', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet' },
  { n: 16, name: 'Lookbook', id: 'L1', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/lookbook' },
  { n: 17, name: 'You', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you' },
  { n: 18, name: 'Paywall', id: 'P1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T09:44:00', href: '/paywall', under: '/stylist' },
  { n: 19, name: 'Limit reached', id: 'S17', scenario: 'full', onboarded: true, now: '2026-10-22T21:12:00', freeChecksUsed: 1, href: '/stylist' },
  { n: 20, name: 'Share card', id: 'S12', scenario: 'full', onboarded: true, now: '2026-10-22T07:51:00', href: '/share/FC3R', under: '/stylist' },
  // Not drawn in the mockups (21+): sheets and covers built from 02's text alone.
  { n: 21, name: 'Added to your closet', id: 'S11', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: `/sheets/added/${STORY_FIRST_CHECK}`, under: '/stylist' },
  { n: 22, name: 'Which shoes?', id: 'S10', scenario: 'full', onboarded: true, now: '2026-10-20T08:11:00', href: `/sheets/pick-shoes/${STORY_PARTIAL}`, under: '/stylist' },
  { n: 23, name: 'What changed?', id: 'S21', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:51:00', href: `/sheets/tell-me/${STORY_RECHECK}`, under: '/stylist' },
  { n: 24, name: 'Photo viewer', id: 'S13', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: `/photo/${STORY_FIRST_CHECK}`, under: '/stylist' },
  // The morning/evening card (02 "S1d", 05 §MC8). Sample weather, labelled as such on the card.
  { n: 25, name: 'Morning card', id: 'S1d', scenario: 'full', onboarded: true, now: '2026-10-22T07:40:00', freeChecksUsed: 0, href: '/stylist', weather: 'coldRain', weatherAllowed: true },
  { n: 26, name: 'Morning card · thin closet', id: 'S1d', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:40:00', href: '/stylist', weather: 'mild', weatherAllowed: true },
  { n: 27, name: 'Morning card · new user', id: 'S1d', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:40:00', href: '/stylist', weather: 'mild', weatherAllowed: true },
  { n: 28, name: 'Morning card · wearing it', id: 'S1d', scenario: 'full', onboarded: true, now: '2026-10-22T07:41:00', freeChecksUsed: 0, href: '/stylist', weather: 'coldRain', weatherAllowed: true },
  { n: 29, name: 'Morning card · after his own check', id: 'S1d', scenario: 'full', onboarded: true, now: '2026-10-22T07:46:00', href: '/stylist', weather: 'coldRain', weatherAllowed: true },
  { n: 30, name: 'Evening card', id: 'S1d', scenario: 'full', onboarded: true, now: '2026-10-22T18:30:00', freeChecksUsed: 0, href: '/stylist', weather: 'coldRain', weatherAllowed: true },
  { n: 31, name: 'Morning card · weather ask', id: 'S1d', scenario: 'full', onboarded: true, now: '2026-10-22T07:40:00', freeChecksUsed: 0, href: '/stylist', weather: 'coldRain', weatherAllowed: false },
  { n: 32, name: 'Morning card · hot day', id: 'S1d', scenario: 'full', onboarded: true, now: '2026-10-22T07:40:00', freeChecksUsed: 0, href: '/stylist', weather: 'hot', weatherAllowed: true },
  { n: 33, name: 'Reads as smart casual', id: 'S6s', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  // The one quick tap (02 "S5q", #85): asking, answered Jeans, skipped.
  { n: 34, name: 'One quick tap', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 35, name: 'One quick tap · answered', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 36, name: 'One quick tap · skipped', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  // Closet accuracy (#91): p01b against T1, B1, S1 from the seed: tee and sneakers matched, tan vs khaki chinos asked.
  { n: 37, name: 'Same as your khaki chinos?', id: 'S11', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: `/sheets/added/${STORY_FIRST_CHECK}`, under: '/stylist' },
  { n: 38, name: 'Closet · detailed graphics + one question', id: 'C1', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/closet' },
  // Camera guidance (#100; numbered from 41 so parallel sessions' screens don't collide): one tip held, or the after-shot panel.
  { n: 41, name: 'Camera · too dark (flash offer)', id: 'S2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera?guide=dark', under: '/stylist' },
  { n: 42, name: 'Camera · bright light behind you', id: 'S2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera?guide=backlit', under: '/stylist' },
  { n: 43, name: 'Camera · come a little closer', id: 'S2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera?guide=tooFar', under: '/stylist' },
  { n: 44, name: 'Camera · after the shot: too dark', id: 'S3', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera?review=dark', under: '/stylist' },
  { n: 45, name: "Camera · after the shot: can't find you", id: 'S3', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera?review=noPerson', under: '/stylist' },
  { n: 46, name: 'Scan · 3 pieces in view', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan', under: '/closet' },
  { n: 47, name: 'Scan · too dark (flash offer)', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan?guide=dark', under: '/closet' },
  { n: 48, name: 'Scan · a person in view', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan?guide=person', under: '/closet' },
  { n: 49, name: 'Scan · a piece cut off', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan?guide=cutOff', under: '/closet' },
  { n: 50, name: 'Scan · glare', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan?guide=glare', under: '/closet' },
  { n: 51, name: 'Scan · no clothes found', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan?guide=noClothes', under: '/closet' },
  { n: 52, name: 'Scan · after the shot: cut off', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan?review=cutOff', under: '/closet' },
  { n: 53, name: 'Scan · saved', id: 'C4', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/scan?saved=1', under: '/closet' },
  { n: 60, name: 'Shoe question', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 61, name: 'Shoe question · Boots', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 62, name: 'Shoe question · skipped', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 63, name: 'Your boots?', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 64, name: 'Your boots? · Yes', id: 'S5q', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  // The closet question on the score card (#117; B's block from 70): screen 37's story, left on Stylist.
  { n: 70, name: 'Score card · Are these your khaki chinos?', id: 'S6', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  // "Going for" (#215; mockups/going-for.html v2), numbered after 70. 71–72 hold the read mid-way; 78 is 71 for large text.
  { n: 71, name: 'Going for · the wait', id: 'S5g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:42:00', href: '/stylist' },
  { n: 72, name: 'Going for · tapped', id: 'S5g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:42:00', href: '/stylist' },
  { n: 73, name: 'Going for · the score first', id: 'S6g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 74, name: 'Going for · Change to a new look', id: 'S6g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:44:00', href: '/stylist' },
  { n: 75, name: 'Going for · re-scored for Interview', id: 'S6g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:44:00', href: '/stylist' },
  { n: 76, name: 'Going for · a match', id: 'S6g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 77, name: 'Going for · a mismatch', id: 'S6g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist' },
  { n: 78, name: 'Going for · the wait at large text', id: 'S5g', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:42:00', href: '/stylist' },
  // "Which one is you?" (02 S23, Oct 14): a bundled photo, with a second person's box drawn for the demo.
  { n: 79, name: 'Which one is you?', id: 'S23', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:42:00', href: '/stylist' },
  // You tab (Oct 14): Y2 Style profile, Y3 What your stylist knows, and the fact sheet on a guess (screen 17 is Y1).
  { n: 80, name: 'Style profile', id: 'Y2', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/profile', under: '/you' },
  { n: 81, name: 'What your stylist knows', id: 'Y3', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/knows', under: '/you' },
  { n: 82, name: 'Fact sheet · a guess', id: 'Y3f', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/sheets/fact/F9', under: '/you/knows' },
  // You tab (Oct 14): Settings, Plan & usage (one check used) and Notifications during a Pro trial (the demo plan link).
  { n: 84, name: 'Settings', id: 'Y4', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/settings', under: '/you' },
  { n: 85, name: 'Plan & usage', id: 'Y5', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', freeChecksUsed: 1, href: '/you/plan', under: '/you' },
  { n: 86, name: 'Notifications · Pro trial', id: 'Y6', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/notifications?demoPlan=trial', under: '/you' },
  // Y7 · Privacy & data (#246). The demo's photos are bundled (nothing is ever sent), so 89 shows "Nothing sent yet."
  { n: 87, name: 'Privacy & data', id: 'Y7', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/privacy', under: '/you' },
  { n: 88, name: 'Privacy & data · Pro warning', id: 'Y7', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/privacy?demoPlan=pro', under: '/you' },
  { n: 89, name: 'See what I send · nothing yet', id: 'Y7s', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/sent', under: '/you/privacy' },
  // Ask a question (02 S25–S27, 07; Oct 15): the seeded Q&A asked through the real pipeline and the demo answers.
  { n: 90, name: 'Ask · typing', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:05:00', href: '/stylist' },
  { n: 91, name: 'Ask · the answer streaming in', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:05:00', href: '/stylist' },
  { n: 92, name: 'Ask · two answers', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 93, name: 'Ask · questions used up', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/stylist' },
  { n: 94, name: 'Ask · support card', id: 'S27', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/stylist' },
  { n: 95, name: 'Ask · rating him, not the outfit', id: 'S27', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/stylist' },
  // The piece page (02 C2, #276): the seed's khaki chinos after p01b, its re-check p01a and "Yes, same one", so they
  // have 2 photos (outlined, cropped below the chin line). Pushed over the Closet grid.
  { n: 96, name: 'Closet · a piece and its photos', id: 'C2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:52:00', href: '/closet/item/B1', under: '/closet' },
  // The look page (02 L2, #280), pushed over the Lookbook: 97 the seed's re-checked date look (p01b 8.0 → p01a 9.0, the
  // caught fix done, its pieces, Show in chat); 98 the Sep 24 look whose photo was deleted (drawn pieces, no viewer).
  { n: 97, name: 'Lookbook · a look', id: 'L2', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/lookbook/look/FC3', under: '/lookbook' },
  { n: 98, name: 'Lookbook · a look, photo deleted', id: 'L2', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/lookbook/look/FC0', under: '/lookbook' },
  // The scan inbox made visible (#280): 110 Closet with two scans waiting ("Waiting to be read · 2 photos"), 111 its sheet.
  { n: 110, name: 'Closet · scans waiting', id: 'C1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:52:00', href: '/closet' },
  { n: 111, name: 'Scan inbox', id: 'C1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:52:00', href: '/sheets/scan-inbox', under: '/closet' },
  // Merging a duplicate (#280): the copy of the khaki chinos he kept with "No, a new one" ({dup}, filled in by the
  // story): 112 its page with "Same as another piece…", 113 the picker over it.
  { n: 112, name: 'Closet · a duplicate piece', id: 'C2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:52:00', href: '/closet/item/{dup}', under: '/closet' },
  { n: 113, name: 'Same as which piece?', id: 'C2m', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:52:00', href: '/sheets/merge/{dup}', under: '/closet/item/{dup}' },
  // S17h (#280; numbered from 120 so parallel sessions' screens don't collide): screen 19 after "Save for tomorrow".
  { n: 120, name: 'Limit card · saved for tomorrow', id: 'S17h', scenario: 'full', onboarded: true, now: '2026-10-22T21:13:00', freeChecksUsed: 1, href: '/stylist' },
  // S17h the next morning (#281): "Ready to score last night's photo?" with Score it / Not this one.
  { n: 121, name: 'Ready to score last night\'s photo?', id: 'S17h', scenario: 'full', onboarded: true, now: '2026-10-23T07:31:00', href: '/stylist' },
  // Onboarding and accounts (#289, handoff/10-onboarding.md; numbered from 130 so parallel sessions don't collide).
  // Sign-in runs on MockAuth: `accounts.script` picks the outcome; the email code it accepts is 123456 (000000 = expired).
  { n: 130, name: 'Welcome · with sign-in', id: 'O1', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/welcome', accounts: { script: 'ok' } },
  { n: 131, name: 'Example check', id: 'O1e', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/example', under: '/onboarding/welcome' },
  { n: 132, name: 'Sign in · from Welcome', id: 'A1', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/sheets/sign-in?from=welcome', under: '/onboarding/welcome', accounts: { script: 'existing' } },
  { n: 133, name: 'Sign in · it fails', id: 'A1', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/sheets/sign-in?from=welcome', under: '/onboarding/welcome', accounts: { script: 'error' } },
  { n: 134, name: 'Email · the address', id: 'A2', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/sheets/sign-in?from=welcome&step=email', under: '/onboarding/welcome', accounts: { script: 'ok' } },
  { n: 135, name: 'Email · the code', id: 'A2', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/sheets/sign-in?from=welcome&step=code&email=sam%40gmail.com', under: '/onboarding/welcome', accounts: { script: 'ok' } },
  { n: 136, name: 'Basics · welcome back', id: 'A4', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/basics?restore=214,38,61', accounts: { script: 'existing', signedIn: 'apple' } },
  { n: 137, name: 'Bringing back your fits', id: 'A4', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/restore?fits=214&pieces=38&chats=61', accounts: { script: 'existing', signedIn: 'apple' } },
  { n: 138, name: 'Keep your fits', id: 'A3', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/stylist', accounts: { script: 'ok', offer: 'open' } },
  { n: 139, name: 'Keep your fits · Not now', id: 'A3', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/stylist', accounts: { script: 'ok', offer: 'declined' } },
  { n: 140, name: 'Sign in · from the offer, fits on both', id: 'A5', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/sheets/sign-in?from=offer', under: '/stylist', accounts: { script: 'existing', offer: 'open' } },
  { n: 141, name: 'Settings · Account, signed out', id: 'Y4a', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/settings', under: '/you', accounts: { script: 'ok' } },
  { n: 142, name: 'Settings · Account, signed in', id: 'Y4a', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/settings', under: '/you', accounts: { script: 'ok', signedIn: 'apple' } },
  { n: 143, name: 'Privacy · delete account', id: 'Y7a', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/privacy', under: '/you', accounts: { script: 'ok', signedIn: 'apple' } },
  // The end of onboarding (#291, 10-onboarding.md §9; numbered from 150). The story: his first check, the Welcome photo
  // (s14, 7.5 with a fix), at 7:42; the store is the mock one (it sells nothing) and the notification answer is scripted.
  { n: 150, name: 'First check · Later', id: 'S6', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: {} },
  { n: 151, name: 'Your first 3 moves', id: 'S14', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { steps: ['later'] } },
  { n: 152, name: 'Paywall · after the moves', id: 'P1', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall?from=onboarding', under: '/stylist', finish: { paywall: 'ok', steps: ['later', 'paywallShown'] } },
  { n: 153, name: 'Paywall · the plan', id: 'P1b', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans?from=onboarding', under: '/paywall?from=onboarding', finish: { paywall: 'ok', steps: ['later', 'paywallShown'] } },
  { n: 154, name: 'Paywall · the plan, trial used', id: 'P1b', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans', under: '/paywall', finish: { paywall: 'noTrial' } },
  { n: 155, name: 'Paywall · plans didn\'t load', id: 'P1s', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans', under: '/paywall', finish: { paywall: 'loadFailed' } },
  { n: 156, name: 'Paywall · offline', id: 'P1s', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans', under: '/paywall', finish: { paywall: 'offline' } },
  { n: 157, name: 'Paywall · already Pro', id: 'P1s', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall', under: '/stylist', finish: { paywall: 'ok', pro: true } },
  { n: 158, name: 'Notification ask', id: 'S15', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { notify: 'allow', steps: ['later'] } },
  { n: 159, name: 'Notification ask · pick a time', id: 'S15', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { notify: 'allow', steps: ['later', 'notifyYes'] } },
  { n: 160, name: 'Notification ask · done', id: 'S15', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { notify: 'allow', steps: ['later', 'notifyAllow'] } },
  { n: 161, name: 'Starter essentials', id: 'C5', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/closet/starter', under: '/closet', finish: { steps: ['later'] } },
  { n: 162, name: 'Your first 3 moves · move 1 done', id: 'S14', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { steps: ['later', { mark: 's12' }] } },
];

export function screenScenario(n: number): ScreenScenario | undefined {
  return SCREENS.find((s) => s.n === n);
}
