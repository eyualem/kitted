// Screen → scenario map for /demo/screen/<n> and -demoScreen <n> (04 §10.3, 05 §5.2).
// P0 sets the gate, clock and route; the per-screen thread/story state is filled in by the
// phase that builds each screen (P2 Stylist cards, P5 tabs, P6 paywall/limit/share).

import type { AboutYouDemo } from '@/features/aboutYou/demo';
import type { StyleGameDemo } from '@/features/onboarding/styleGameSession';
import type { ProfileRow, StyleKey } from '@/data/types';
import type { AboutDraft } from '@/features/onboarding/basics';
import type { AuthProvider, MockScript } from '@/features/account/auth';
import type { FinishDemo } from '@/features/finish/demo';
import type { Styles } from '@kitted/core';
import type { ServerTier } from '@/services/server/tier';

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
  /** Today's fit checks used. On a free screen it pins the count (nothing more counts); on a beta screen it is written
   *  as today's real count, so the screen's next photos count (T14's flow takes 4 photos on 252). */
  freeChecksUsed?: number;
  /** The rules the screen is on (services/server/tier.ts): `free` unless it says so, so every older screen looks as it
   *  always did; `beta` is the closed beta's day (FP7: 3 fit checks, 20 questions, nothing to buy). */
  tier?: ServerTier;
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
  /** The phone is offline on this screen (09-ui-review §20.8 G18): the banner, send disabled. Others are pinned online. */
  offline?: boolean;
  /** Onboarding ended with "Not now" on consent (S26, G23). */
  consent?: false;
  /** An Undo toast shown once the screen is up (09-ui-review §21, #324): `heldAtMs` starts it held with that much
   *  time left, so a screenshot catches the ring mid-way; without it, it counts down live. Undo does nothing here. */
  toast?: { text: 'removed' | 'logged'; removal?: boolean; heldAtMs?: number };
  /** Starter basics by look (#364): his picks for this screen, in place of the scenario's (smart casual + workwear). */
  looks?: Styles;
  /** Kit's "About you" card (#373, 10-onboarding.md §10): posted under an answer or on a later visit, then folded. */
  aboutYou?: AboutYouDemo;
  /** Outfits on for this screen (specs/closet-beta.md CB1): the Pieces | Outfits switch, Next best buy and Goes with, as
   *  before the beta. Every other screen has them off, as his phone does (features/closet/outfitsSwitch.ts). */
  outfits?: true;
  /** About you's draft (T39): his pick and name waiting in kv, as if he'd tapped them before a close. */
  about?: AboutDraft;
  /** Kit's first-check offer (T39, OS5): setup finished through About you (no agreement), then the card as is, after
   *  Later, after Not now on the camera's agreement, or after the agreement and one scored check. */
  offer?: 'open' | 'later' | 'notNow' | 'checked';
  /** The style game in setup (T113): the session as set by seedStyleGameForDemo (a fixed deal, his answers, his changes). */
  styleGame?: StyleGameDemo;
  /** Fields written over the scenario's profile (T39: his name and age band on Style profile). */
  profilePatch?: Partial<Pick<ProfileRow, 'name' | 'ageBand' | 'ageBandAt'>>;
}

const FIRST_RUN_NOW = '2026-10-22T07:38:00';
const FULL_NOW = '2026-10-22T12:20:00';
/** The end of onboarding's screens (150–162): a minute after his first check. */
const FIRST_CHECK_NOW = '2026-10-22T07:43:00';
/** After the first check's re-check (7:50). */
const ALL_DONE_NOW = '2026-10-22T07:55:00';

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
/** Screens 201–203: a check whose jeans are "Not sure" (09-ui-review §19). */
export const STORY_DOUBT = 'story-doubt';

// The style game's states (T113, specs/style-game.md; the task's UI inventory), all on seed 42 (Workwear, Classic prep,
// Streetwear, Minimal, Tailored, Outdoor, Vintage sport, Smart casual).
const SV: StyleKey[] = ['workwear', 'streetwear', 'outdoor', 'vintage_sport'];
const SV_PREFER: StyleKey[] = ['streetwear', 'vintage_sport', 'outdoor', 'workwear'];
const G300: StyleGameDemo = { seed: 42, me: ['workwear'], cards: 2 };
const G303: StyleGameDemo = { seed: 42, me: SV, rounds: 0 };
const G304: StyleGameDemo = { seed: 42, me: SV, prefer: SV_PREFER };
const G305: StyleGameDemo = { seed: 42, me: ['minimalist'] };
const G310: StyleGameDemo = { seed: 42, me: [] };
const game = (n: number, name: string, styleGame: StyleGameDemo, more: Partial<ScreenScenario> = {}): ScreenScenario => ({
  n, name, id: 'O2', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/looks', styleGame, ...more,
});
const STYLE_GAME_SCREENS: ScreenScenario[] = [
  game(300, 'Style game · card 3', G300),
  game(301, 'Style game · the other outfit', { ...G300, peek: 1 }),
  game(302, 'Style game · swiped past the line', { ...G300, dragDx: 120 }),
  game(303, 'Style game · put them in order', G303),
  game(304, "Here's your style · three looks", G304),
  game(305, "Here's your style · one look", G305),
  game(306, "Here's your style · removed, Undo", { ...G304, then: [{ remove: 1 }], toast: true }),
  game(307, "Here's your style · in and out, Undo", { seed: 42, me: ['outdoor', 'vintage_sport', 'workwear'], prefer: ['outdoor', 'vintage_sport', 'workwear'], then: [{ add: 'streetwear' }], toast: true }),
  game(308, "Here's your style · typing his words", { ...G304, editingWords: true, words: 'skater but clean' }),
  game(309, "Here's your style · his words saved", { ...G304, words: 'all black' }),
  game(310, 'Nothing clicked yet', G310),
  game(311, 'Nothing clicked yet · his words', { ...G310, words: 'all black' }),
  game(312, 'Add a look', { ...G305, then: [{ add: 'workwear' }] }, { href: '/onboarding/add-look', under: '/onboarding/looks' }),
  game(313, "Here's your style · every look removed", { ...G305, then: [{ remove: 0 }] }),
];

export const SCREENS: readonly ScreenScenario[] = [
  { n: 1, name: 'Welcome', id: 'O1', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/welcome' },
  // Looks is the style game since T113 (specs/style-game.md): a fixed deal (seed 42: card 1 is Workwear) so shots repeat.
  { n: 2, name: 'Style game · card 1', id: 'O2', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/looks', styleGame: { seed: 42, me: [], cards: 0 } },
  { n: 3, name: 'About you', id: 'O3', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/basics' },
  // Was the agreement step (O5), removed by T39: setup ends on About you; this is that step with an age picked.
  { n: 4, name: 'About you · ready', id: 'O3', scenario: 'firstRun', onboarded: false, now: FIRST_RUN_NOW, href: '/onboarding/basics', about: { age: '22-25', name: 'Alex' } },
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
  // The card waits for two outfits (F6.2, T55): three pieces that make one outfit, then a checked card that suggested nothing.
  { n: 39, name: 'Morning card · three pieces', id: 'S1d', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:40:00', href: '/stylist', weather: 'mild', weatherAllowed: true },
  { n: 40, name: 'Morning card · checked, nothing suggested', id: 'S1d', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:43:00', href: '/stylist', weather: 'mild', weatherAllowed: true },
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
  { n: 54, name: 'Evening card · checked, nothing suggested', id: 'S1d', scenario: 'firstRun', onboarded: true, now: '2026-10-22T18:33:00', href: '/stylist', weather: 'mild', weatherAllowed: true },
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
  { n: 81, name: 'What your stylist knows', id: 'Y3', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/knows', under: '/you/privacy' },
  { n: 82, name: 'Fact sheet · a guess', id: 'Y3f', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/sheets/fact/F9', under: '/you/knows' },
  // You tab (Oct 14; T34): You at its settings rows, Plan & usage (one check used) and Notifications during a Pro trial.
  { n: 84, name: 'You · settings rows', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you?at=settings' },
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
  // A photo on the wrong card (#289): the white tee with two photos and the grey tee beside it; long-press a photo.
  { n: 114, name: 'Closet · a photo on the wrong card', id: 'C2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:52:00', href: '/closet/item/T1', under: '/closet' },
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
  { n: 141, name: 'You · Account, signed out', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you?at=settings', accounts: { script: 'ok' } },
  { n: 142, name: 'You · Account, signed in', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you?at=settings', accounts: { script: 'ok', signedIn: 'apple' } },
  { n: 143, name: 'Privacy · delete account', id: 'Y7a', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/privacy', under: '/you', accounts: { script: 'ok', signedIn: 'apple' } },
  // The end of onboarding (#291, 10-onboarding.md §9; numbered from 150). The story: his first check, the Welcome photo
  // (s14, 7.5 with a fix), at 7:42; the store is the mock one (it sells nothing) and the notification answer is scripted.
  { n: 150, name: 'First check · Later', id: 'S6', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: {} },
  { n: 151, name: 'Optional: tap what you own', id: 'S14', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { steps: ['later'] } },
  { n: 152, name: 'Paywall · after the optional step', id: 'P1', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall?from=onboarding', under: '/stylist', finish: { paywall: 'ok', steps: ['later', 'paywallShown'] } },
  { n: 153, name: 'Paywall · the plan', id: 'P1b', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans?from=onboarding', under: '/paywall?from=onboarding', finish: { paywall: 'ok', steps: ['later', 'paywallShown'] } },
  { n: 154, name: 'Paywall · the plan, trial used', id: 'P1b', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans', under: '/paywall', finish: { paywall: 'noTrial' } },
  { n: 155, name: 'Paywall · plans didn\'t load', id: 'P1s', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans', under: '/paywall', finish: { paywall: 'loadFailed' } },
  { n: 156, name: 'Paywall · offline', id: 'P1s', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall/plans', under: '/paywall', finish: { paywall: 'offline' } },
  { n: 157, name: 'Paywall · already Pro', id: 'P1s', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/paywall', under: '/stylist', finish: { paywall: 'ok', pro: true } },
  { n: 158, name: 'Notification ask', id: 'S15', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { notify: 'allow', steps: ['later'] } },
  { n: 159, name: 'Notification ask · pick a time', id: 'S15', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { notify: 'allow', steps: ['later', 'notifyYes'] } },
  { n: 160, name: 'Notification ask · done', id: 'S15', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { notify: 'allow', steps: ['later', 'notifyAllow'] } },
  { n: 161, name: 'What you already own', id: 'C5', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/closet/starter', under: '/closet', finish: { steps: ['later'] } },
  { n: 162, name: 'Optional step · added', id: 'S14', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { steps: ['later', { mark: 's12' }] } },
  // The optional step skipped, and the tabs with no pinned row (#343 replaced #292's Your moves rows and page).
  { n: 163, name: 'Lookbook · no pinned row', id: 'L1', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/lookbook', finish: { steps: ['later'] } },
  { n: 164, name: 'Optional step · skipped', id: 'S14', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', finish: { steps: ['later', 'skipInvite'] } },
  { n: 165, name: 'You · no pinned row', id: 'Y1', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/you', finish: { steps: ['later', { mark: 's12' }] } },
  { n: 167, name: 'Ask · an outfit from his closet', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 168, name: 'Ask · start a fit check', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 169, name: 'Ask · one tap question', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 170, name: 'Ask · the tap answered', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 171, name: 'Ask · a buy suggestion', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 172, name: 'Ask · a link to a piece', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 173, name: 'Ask · saved to what I know', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 174, name: 'Ask · a piece from chat', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist' },
  { n: 175, name: 'Past chats · yesterday\'s answers, read-only', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:10:00', href: '/stylist/day/2026-10-21', under: '/stylist' },
  // Two pieces added from the list (#343): the belt and a tee (its first choice, black), the next morning.
  { n: 180, name: 'What you already own · two added', id: 'C5', scenario: 'firstRun', onboarded: true, now: ALL_DONE_NOW, href: '/closet/starter', under: '/closet', finish: { steps: ['later', { mark: 's12' }, { mark: 's01' }] } },
  { n: 181, name: 'Lookbook · the re-check story', id: 'L1', scenario: 'firstRun', onboarded: true, now: ALL_DONE_NOW, href: '/lookbook', finish: { steps: ['later', { mark: 's12' }, { mark: 's01' }] } },
  { n: 182, name: 'Closet · Outfits', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet', outfits: true },
  { n: 183, name: 'Closet · No outfits yet', id: 'C1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:45:00', href: '/closet', outfits: true },
  { n: 184, name: 'Closet · a piece and what goes with it', id: 'C2', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet/item/B1', under: '/closet', outfits: true },
  // The two-shot check, step 0 (#313, 12-two-shot-check.md §10): a short mirror's top-only check, finished by a photo of
  // the pants and shoes; the bottom snap's camera; the short-mirror tip in Mirror.
  { n: 185, name: 'Partial check · top only', id: 'S6p', scenario: 'full', onboarded: true, now: '2026-10-20T08:11:00', href: '/stylist' },
  { n: 186, name: 'Partial check · finished with pants and shoes', id: 'S6p', scenario: 'full', onboarded: true, now: '2026-10-20T08:13:00', href: '/stylist' },
  { n: 187, name: 'Camera · pants and shoes snap', id: 'S9', scenario: 'full', onboarded: true, now: '2026-10-20T08:11:00', href: `/camera?mode=shoeSnap&parent=${STORY_PARTIAL}&part=bottom`, under: '/stylist' },
  { n: 188, name: 'Camera · short mirror', id: 'S2', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/camera?guide=shortMirror&camMode=mirror', under: '/stylist' },
  // Starter basics by look (#364, 09-ui-review §16): Closet's next best buy for a streetwear pick (190–192, the
  // Starter list for other picks, were dropped at the merge: "What you already own" keeps one list, #343).
  { n: 193, name: 'Closet · Outfits · streetwear pick', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet', looks: [['streetwear', 0.5]], outfits: true },
  // How baggy a piece is (09-ui-review §18, #316): the dark jeans' photos disagree (194–196: PR #7 holds 190–193, the piece-edit screens 197–200).
  { n: 194, name: 'Closet · How do your dark jeans fit?', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet' },
  { n: 195, name: 'Closet · Leg, Not sure', id: 'C2', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet/item/B3', under: '/closet' },
  { n: 196, name: 'What it is · Leg, Not sure', id: 'C3', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/sheets/edit-item/B3?field=leg', under: '/closet/item/B3' },
  // Fix what a piece is (09-ui-review §17, #315): "What it is" on the dark jeans' page and its pickers (197–200: the two-shot check took
  // 185–188, PR #7 holds 190–193, the bagginess rows 194–196).
  { n: 197, name: 'Closet · What it is', id: 'C2', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet/item/B3', under: '/closet' },
  { n: 198, name: 'What it is · Leg', id: 'C3', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/sheets/edit-item/B3?field=leg', under: '/closet/item/B3' },
  { n: 199, name: 'What it is · Kind', id: 'C3', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/sheets/edit-item/T6?field=kind', under: '/closet/item/T6' },
  { n: 200, name: 'What it is · Color', id: 'C3', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/sheets/edit-item/B3?field=color', under: '/closet/item/B3' },
  // Bagginess on the fit-check card (09-ui-review §19, #322): s12's jeans are Not sure (201–203).
  { n: 201, name: 'Fit check · Not sure about your jeans', id: 'S6', scenario: 'full', onboarded: true, now: '2026-10-22T12:20:00', freeChecksUsed: 0, href: '/stylist' },
  { n: 202, name: 'Closet · Outfits with the fit card', id: 'C1', scenario: 'full', onboarded: true, now: '2026-10-22T12:20:00', freeChecksUsed: 0, href: '/closet', outfits: true },
  { n: 203, name: 'Not quite right? · from the line', id: 'S8', scenario: 'full', onboarded: true, now: '2026-10-22T12:20:00', freeChecksUsed: 0, href: `/sheets/correct/${STORY_DOUBT}?reason=detail&garment=1&only=slim,straight,wide`, under: '/stylist' },
  // The Undo countdown ring (09-ui-review §21, #324): a removal toast held mid-way, and a 5 s one counting live.
  { n: 204, name: 'Undo toast · held, 5 of 8 s left', id: 'G2', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet', toast: { text: 'removed', removal: true, heldAtMs: 4_200 } },
  { n: 205, name: 'Undo toast · live, 5 s', id: 'G2', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet', toast: { text: 'logged' } },
  // Step 4's code-only batch (09-ui-review §20.8; 206–209 left for the Undo ring's session): offline, "That score is
  // wrong", the S26 card after Not now and its example sheet, the empty Closet, a re-check that moved (215; screen 10's lands as
  // "not seen" now). The look page's ⋯ is on screen 97.
  { n: 210, name: 'Stylist · offline', id: 'G1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:46:00', href: '/stylist', offline: true },
  { n: 211, name: 'Ask · that score is wrong', id: 'S25', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:46:00', href: '/stylist' },
  { n: 212, name: 'Turn on fit checks', id: 'S26', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/stylist', consent: false },
  { n: 213, name: 'Example check · as a sheet', id: 'O1e', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/sheets/example', under: '/stylist', consent: false },
  { n: 214, name: 'Closet · empty', id: 'C1e', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/closet' },
  { n: 215, name: 'Re-check · Why and Not quite right?', id: 'S6r', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:51:00', href: '/stylist' },
  // The share card on a single check (#347): Score · Rating; screen 20 is the re-check win (Before · After · Change).
  { n: 230, name: 'Share card · single check', id: 'S12', scenario: 'full', onboarded: true, now: '2026-10-22T07:51:00', href: '/share/FC3', under: '/stylist' },
  // Onboarding down to the birth year (#373, 10-onboarding.md §10): Kit's "About you" card and its sheet. Screens 3
  // (Basics, now only the birth year), 4 (Consent's "Born in …") and 136 (the restore path) show the step itself.
  { n: 240, name: 'About you · under an answer', id: 'S1y', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/stylist', aboutYou: 'answer' },
  { n: 241, name: 'About you · a later visit', id: 'S1y', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/stylist', aboutYou: 'visit' },
  { n: 243, name: 'About you · Not now', id: 'S1y', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/stylist', aboutYou: 'declined' },
  { n: 244, name: 'About you · saved', id: 'S1y', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/stylist', aboutYou: 'saved' },
  { n: 250, name: 'Closet · Pieces, thin (no titles)', id: 'C1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:45:00', href: '/closet' },
  { n: 251, name: 'Closet · Pieces, small (titled)', id: 'C1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:45:00', href: '/closet' },
  // The beta's day (T14, specs/free-and-pro.md FP7): 3 fit checks and 20 questions, no paywall, no price, no "Pro".
  { n: 252, name: 'Beta · Stylist home', id: 'S1', scenario: 'full', onboarded: true, now: '2026-10-22T08:01:00', freeChecksUsed: 0, href: '/stylist', tier: 'beta' },
  { n: 253, name: 'Beta · Limit card', id: 'S17', scenario: 'full', onboarded: true, now: '2026-10-22T21:12:00', freeChecksUsed: 3, href: '/stylist', tier: 'beta' },
  { n: 254, name: 'Beta · Limit card, saved for tomorrow', id: 'S17h', scenario: 'full', onboarded: true, now: '2026-10-22T21:13:00', freeChecksUsed: 3, href: '/stylist', tier: 'beta' },
  { n: 255, name: 'Beta · Questions used up', id: 'S25', scenario: 'full', onboarded: true, now: '2026-10-22T12:21:00', href: '/stylist', tier: 'beta' },
  { n: 256, name: 'Beta · Plan & usage', id: 'Y5', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', freeChecksUsed: 1, href: '/you/plan', under: '/you', tier: 'beta' },
  { n: 257, name: 'Beta · You', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', freeChecksUsed: 0, href: '/you', tier: 'beta' },
  { n: 258, name: 'Beta · You, settings rows', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you?at=settings', tier: 'beta' },
  { n: 259, name: 'Beta · Morning card, checks used', id: 'S1d', scenario: 'full', onboarded: true, now: '2026-10-22T07:40:00', freeChecksUsed: 3, href: '/stylist', weather: 'coldRain', weatherAllowed: true, tier: 'beta' },
  // Closet for the beta (specs/closet-beta.md CB1): Outfits off, as on his phone. 260 has Outfits saved as his last tap
  // on a closet that makes 3+ outfits (it opens on the pieces anyway); 261 is screen 184's piece without Goes with.
  { n: 260, name: 'Closet · beta, Outfits remembered', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet' },
  { n: 261, name: 'Closet · a piece, beta', id: 'C2', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet/item/B1', under: '/closet' },
  // To confirm, one card at a time (specs/closet-beta.md CB2): four real "Is this your …?" questions and the fit
  // question (262, "1 of 5"), the fit question alone (263), and one question with no Skip (264, screen 38's story).
  { n: 262, name: 'Closet · To confirm, 5 questions', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet' },
  { n: 263, name: 'Closet · To confirm, the fit question only', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet' },
  { n: 264, name: 'Closet · To confirm, one question', id: 'C1', scenario: 'full', onboarded: true, now: '2026-10-22T07:45:00', href: '/closet' },
  { n: 265, name: 'Closet · To confirm, folded', id: 'C1', scenario: 'full', onboarded: true, now: FULL_NOW, href: '/closet' },
  // You as the settings home (T34, specs/setup-and-you.md SY1): Pro bought with the paywall on, at the rows and at the top.
  { n: 270, name: 'You · Pro, settings rows', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you?at=settings', finish: { paywall: 'ok', pro: true } },
  { n: 271, name: 'You · Pro', id: 'Y1', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you', finish: { paywall: 'ok', pro: true } },
  // Setup as plain screens (T39, specs/onboarding-screens.md OS4–OS5; T34 holds 270–271): Stylist right after About
  // you with Kit's first-check offer, after Later, after Not now on the camera's agreement, after a scored check; and
  // Style profile's Name and Age. Demo screens open the camera without the agreement (app/camera.tsx).
  { n: 280, name: 'Stylist · Kit\'s offer', id: 'S1o', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/stylist', offer: 'open' },
  { n: 281, name: 'Stylist · after Later', id: 'S1o', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/stylist', offer: 'later' },
  { n: 282, name: 'Stylist · after Not now', id: 'S1o', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:00', href: '/stylist', offer: 'notNow' },
  { n: 283, name: 'Stylist · after a scored check', id: 'S1o', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', offer: 'checked' },
  { n: 284, name: 'Style profile · Name and Age', id: 'Y2', scenario: 'full', onboarded: true, now: '2026-10-22T12:22:00', href: '/you/profile', under: '/you', profilePatch: { name: 'Alex', ageBand: '22-25', ageBandAt: Date.parse('2026-09-24T19:05:00-04:00') } },
  // The first-run intro (T35, specs/setup-and-you.md SY2.8): Closet after 283's first check, on its first visit
  // ("From your first check", each piece New), and Closet once that visit is over.
  { n: 285, name: 'Closet · first visit', id: 'C1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:44:00', href: '/closet', offer: 'checked' },
  { n: 286, name: 'Closet · after the first visit', id: 'C1', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:46:00', href: '/closet', offer: 'checked' },
  // The morning card waits for his first check (founder, Nov 11): Stylist after Agree on the camera, check not done yet, with the morning
  // card allowed (index.ts): Kit's offer is the only card.
  { n: 290, name: 'Stylist · agreed, no check yet', id: 'S1o', scenario: 'firstRun', onboarded: true, now: '2026-10-22T07:41:30', href: '/stylist', offer: 'checked' },
  { n: 291, name: 'Stylist · first check done, morning card allowed', id: 'S1o', scenario: 'firstRun', onboarded: true, now: FIRST_CHECK_NOW, href: '/stylist', offer: 'checked' },
  ...STYLE_GAME_SCREENS,
];

export function screenScenario(n: number): ScreenScenario | undefined {
  return SCREENS.find((s) => s.n === n);
}
