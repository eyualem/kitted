// Puts the app in screen n's state (04 §10.3) by running the REAL code at latency 0:
// wipe → load the scenario (as of the screen's time) → play the story through the fit-check
// service → set the clock. So /demo/screen/7 shows what the code really produces.
import { dayKey, US_EASTERN, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { store } from '@/data/db';
import { KV } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import { fitCheck, readingSource, setTimerOverride } from '@/features/fitcheck/session';
import { morning } from '@/features/morning';
import { createMemoryStore } from '@/data/memoryStore';
import type { OccasionKey, StyleKey } from '@/data/types';
import { WEATHER_PERMISSION_KV } from '@/services/weather';
import { completeOnboarding } from '@/features/onboarding/complete';
import { picksToStyles } from '@/features/onboarding/looks';
import { newId } from '@/services/ids';
import { parseZonedIso } from '@/services/clock';
import { getDemoArgs, setDemoArgs, startClock } from '@/state/session';
import type { WhichOnePayload } from '@/features/fitcheck/whichOne';
import { armDemoReveal, setDemoPreparing } from '@/features/fitcheck/reveal';
import { askService } from '@/features/ask/session';
import { saveDemoScan } from '@/features/scan/inbox';
import { liveAnswer } from '@/features/ask/live';
import { connectivity } from '@/services/connectivity';
import { t } from '@/i18n/en';
import type { DemoFault } from './demoArgs';
import { STORY_DOUBT, STORY_FIRST_CHECK, STORY_KNOWN, STORY_PARTIAL, STORY_RECHECK, STORY_SHOES, STORY_TAP, type ScreenScenario } from './scenarios';

const at = (iso: string) => parseZonedIso(iso) ?? 0;

/** Story steps per screen (firstRun story; screen 11 runs s24 live inside `full`). */
type Step =
  | { at: string; do: 'check'; photoId: string; occasion: OccasionKey; hold?: number; checkId?: string; style?: StyleKey; tapLook?: StyleKey; fault?: DemoFault }
  /** A question that failed for no connection (09-ui-review §20.8 G18.4): his bubble and the offline line with Retry, as
   *  the pipeline writes them (askPipeline tests cover the path itself; the screen's own state is offline). */
  | { at: string; do: 'askOffline'; text: string }
  /** His picks from setup (the Going-for tiles, #215), in order. */
  | { at: string; do: 'looks'; styles: StyleKey[] }
  /** "Going for" changed after the score (Change → a look): advice only. */
  | { at: string; do: 'goingFor'; style: StyleKey | null; checkId?: string }
  /** The occasion re-scored after the score (he said Re-score to the #62 confirm). */
  | { at: string; do: 'rescore'; occasion: OccasionKey; checkId?: string }
  | { at: string; do: 'morning' }
  | { at: string; do: 'wear' }
  | { at: string; do: 'closet'; ids: string[] }
  /** "Yes, same one" to every open closet question (after the closet calls land). */
  | { at: string; do: 'closetYes' }
  /** "No, a new one" to every open closet question; the first piece kept that way is the `{dup}` in the screen's link (#280). */
  | { at: string; do: 'closetNo' }
  /** Clothes scans saved on the Simulator (the sample flat lay, no file), a minute apart (#280). */
  | { at: string; do: 'scans'; n: number }
  /** A photo taken after the free check was used (02 D19 S17, #280): held under the Limit card; `saved` taps "Save for
   *  tomorrow" (S17h). */
  | { at: string; do: 'hold'; photoId: string; saved?: boolean; spend?: boolean }
  /** The app opened after 4 am (#281): "Ready to score last night's photo?" for the held photo. */
  | { at: string; do: 'openApp' }
  | { at: string; do: 'recheckPrompt' }
  | { at: string; do: 'recheck'; photoId: string }
  /** The partial check's snap (S9): the shoes, or the pants and shoes on a top-only check (#313). */
  | { at: string; do: 'snap'; photoId: string }
  | { at: string; do: 'tap'; answer: 'jeans' | 'work_boot' | 'skip'; checkId?: string }
  /** "Which one is you?" (02 S23) on a bundled photo; the second person's box is drawn for the demo. */
  | { at: string; do: 'whichOne'; photoId: string }
  /** A question through the real ask pipeline (the demo source answers at latency 0). */
  | { at: string; do: 'ask'; text: string }
  /** Tap an answer on the newest ask card (07 §13 R6). */
  | { at: string; do: 'askTap'; option: string }
  /** A stored setting (Closet's remembered Pieces | Outfits tap, #307). */
  | { at: string; do: 'kv'; key: string; value: string }
  /** Earlier sightings of a closet piece, read with these legs or fits (09-ui-review §18): a day apart, no photo. The
   *  piece is `itemId`, or the `slot` piece a story check (`ofCheck`) linked (§19). */
  | { at: string; do: 'sightings'; itemId?: string; ofCheck?: string; slot?: string; legs?: string[]; volumes?: number[] }
  /** Questions already used today (the limit state without five demo answers in the thread). */
  | { at: string; do: 'askUsed'; n: number }
  /** His question in the thread, its answer held mid-way: the dots (no text) or the first words (07 §6.1). */
  | { at: string; do: 'askHold'; text: string; partial?: string };

/** Seeded questions (seed.json M15, M17), asked again through the pipeline. */
const ASK_OLIVE = 'Can I wear the olive overshirt with the navy chinos?';
const ASK_BELT = 'What belt goes with brown loafers?';
/** Before M15 (12:05), so the seeded Q&A isn't loaded and the pipeline writes it. */
const ASK_AS_OF = '2026-10-22T12:04:00';

const CLOSET_3: Step = { at: '2026-10-22T07:30:00', do: 'closet', ids: ['T1', 'B1', 'S1'] };
const DUP_STORY: Step[] = [
  CLOSET_3,
  { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
  { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
  { at: '2026-10-22T07:51:00', do: 'closetNo' },
];

/** §19's story (screens 201–203): a check of s12, then earlier photos of its jeans read slim, wide and wide. */
const DOUBT_STORY: Step[] = [
  { at: '2026-10-22T12:10:00', do: 'check', photoId: 's12', occasion: 'everyday', checkId: STORY_DOUBT },
  { at: '2026-10-22T12:11:00', do: 'sightings', ofCheck: STORY_DOUBT, slot: 'bottom', legs: ['slim', 'wide', 'wide'] },
];
const FIRST_CHECK: Step = { at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday' };

const GF_LOOKS: Step = { at: '2026-10-22T07:41:00', do: 'looks', styles: ['minimalist', 'streetwear', 'smart_casual'] };

const STORY: Record<number, { asOf?: string; steps: Step[] }> = {
  5: { steps: [] },
  6: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date', hold: 0.7 }] },
  7: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  8: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  9: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  // The optional correction is skipped: it would make the re-check 8.5 (PLAN.md decision 1).
  10: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
    ],
  },
  11: { asOf: '2026-10-20T08:09:00', steps: [{ at: '2026-10-20T08:10:00', do: 'check', photoId: 's24', occasion: 'everyday' }] },
  21: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  22: { asOf: '2026-10-20T08:09:00', steps: [{ at: '2026-10-20T08:10:00', do: 'check', photoId: 's24', occasion: 'everyday' }] },
  // The re-check that doesn't see the change (a new photo of the same outfit): S21's case. The identical photo again
  // reuses the reading and says so (#219).
  23: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01b2' },
    ],
  },
  24: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  13: { asOf: '2026-10-22T08:05:00', steps: [] },
  18: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
    ],
  },
  // The Limit card (02 D19 S17, #280): the free check is used (the screen's freeChecksUsed), so a 9:12 pm photo is held;
  // 120 is the same after "Save for tomorrow" (S17h).
  19: { asOf: '2026-10-22T21:12:00', steps: [{ at: '2026-10-22T21:12:00', do: 'hold', photoId: 's14' }] },
  120: { asOf: '2026-10-22T21:12:00', steps: [{ at: '2026-10-22T21:12:00', do: 'hold', photoId: 's14', saved: true }] },
  // The next morning (#281): the app opens at 7:30 and asks "Ready to score last night's photo?" (nothing sent yet).
  121: { asOf: '2026-10-22T21:12:00', steps: [{ at: '2026-10-22T21:12:00', do: 'hold', photoId: 's14', saved: true, spend: true }, { at: '2026-10-23T07:30:00', do: 'openApp' }] },
  // Morning/evening card: posted by the real service at the screen's time.
  12: { asOf: '2026-10-22T08:01:00', steps: [{ at: '2026-10-22T08:01:00', do: 'morning' }] },
  25: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  26: { steps: [{ at: '2026-10-22T07:39:00', do: 'closet', ids: ['T2', 'B1'] }, { at: '2026-10-22T07:40:00', do: 'morning' }] },
  27: { steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  28: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }, { at: '2026-10-22T07:41:00', do: 'wear' }] },
  29: {
    asOf: '2026-10-22T07:39:00',
    steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }, { at: '2026-10-22T07:45:00', do: 'check', photoId: 'p01b', occasion: 'class', checkId: STORY_PARTIAL }],
  },
  30: { asOf: '2026-10-22T18:29:00', steps: [{ at: '2026-10-22T18:30:00', do: 'morning' }] },
  31: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  32: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  // "Reads as" (02 "S6s", #85): s15 picked as streetwear still reads as smart casual (a pick never changes the score).
  33: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 's15', occasion: 'everyday', style: 'streetwear' }] },
  // The one quick tap (#85): ph1 asks "Jeans or sweatpants?"; Jeans → 6.5, reads as streetwear; Skip → 6.5 + the skip line.
  34: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph1', occasion: 'everyday', checkId: STORY_TAP }] },
  35: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph1', occasion: 'everyday', checkId: STORY_TAP }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'jeans' }] },
  36: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph1', occasion: 'everyday', checkId: STORY_TAP }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'skip' }] },
  // The shoe question (#120): ph8 asks "Boots, sneakers or slides?"; Boots → 8.5 (work boots); Skip keeps slides 7.5.
  60: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }] },
  61: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'work_boot', checkId: STORY_SHOES }] },
  62: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'skip', checkId: STORY_SHOES }] },
  // "Your grey work boots?" (#126): yesterday he answered Boots, so today's "other" read asks about his own boots.
  63: { steps: [
    { at: '2026-10-21T16:40:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }, { at: '2026-10-21T16:40:30', do: 'tap', answer: 'work_boot', checkId: STORY_SHOES },
    { at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph9', occasion: 'class', checkId: STORY_KNOWN },
  ] },
  64: { steps: [
    { at: '2026-10-21T16:40:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }, { at: '2026-10-21T16:40:30', do: 'tap', answer: 'work_boot', checkId: STORY_SHOES },
    { at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph9', occasion: 'class', checkId: STORY_KNOWN }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'work_boot', checkId: STORY_KNOWN },
  ] },
  // Closet accuracy (#91): the closet call's answer for p01b against seed pieces; B1 (khaki) vs tan chinos is asked.
  37: { steps: [{ at: '2026-10-22T07:30:00', do: 'closet', ids: ['T1', 'B1', 'S1'] }, { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  70: { steps: [{ at: '2026-10-22T07:30:00', do: 'closet', ids: ['T1', 'B1', 'S1'] }, { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  38: { asOf: '2026-10-22T07:41:00', steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  // "Going for" (#215; mockups/going-for.html v2). Test picks Minimal, Streetwear, Smart casual (the mockup's), stock photos.
  71: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday', hold: 0.86 }] },
  72: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday', hold: 0.93, tapLook: 'minimalist' }] },
  73: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday' }] },
  74: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday' }, { at: '2026-10-22T07:43:00', do: 'goingFor', style: 'smart_casual' }] },
  75: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday' }, { at: '2026-10-22T07:43:00', do: 'rescore', occasion: 'interview' }] },
  76: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }, { at: '2026-10-22T07:42:30', do: 'goingFor', style: 'minimalist' }] },
  77: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 's15', occasion: 'everyday' }, { at: '2026-10-22T07:42:30', do: 'goingFor', style: 'minimalist' }] },
  78: { steps: [GF_LOOKS, { at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday', hold: 0.86 }] },
  79: { steps: [{ at: '2026-10-22T07:42:00', do: 'whichOne', photoId: 'p01b' }] },
  90: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'askHold', text: ASK_OLIVE }] },
  91: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'askHold', text: ASK_OLIVE, partial: 'Yes, olive and navy get along easily. Wear the' }] },
  92: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: ASK_OLIVE }, { at: '2026-10-22T12:09:00', do: 'ask', text: ASK_BELT }] },
  // The seed's two questions plus three more used: the sixth gets the free limit line (no Try Pro until P6).
  93: { steps: [{ at: '2026-10-22T12:20:00', do: 'askUsed', n: 5 }, { at: '2026-10-22T12:21:00', do: 'ask', text: 'What shoes go with my khaki chinos?' }] },
  94: { steps: [{ at: '2026-10-22T12:21:00', do: 'ask', text: "Honestly I don't want to be alive anymore." }] },
  95: { steps: [{ at: '2026-10-22T12:21:00', do: 'ask', text: 'Rate my face' }] },
  // The piece page (#276): the seed's tee, chinos and sneakers; p01b's chinos ask "Are these your khaki chinos?", the
  // p01a re-check sees them again, and "Yes, same one" gives the khaki chinos both photos.
  96: {
    steps: [
      { at: '2026-10-22T07:30:00', do: 'closet', ids: ['T1', 'B1', 'S1'] },
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
      { at: '2026-10-22T07:51:00', do: 'closetYes' },
    ],
  },
  // The scan inbox made visible (#280): two clothes scans waiting, the Closet row and its sheet.
  110: { steps: [CLOSET_3, { at: '2026-10-22T07:44:00', do: 'scans', n: 2 }] },
  111: { steps: [CLOSET_3, { at: '2026-10-22T07:44:00', do: 'scans', n: 2 }] },
  // Merging a duplicate (#280): screen 96's story with "No, a new one", so the chinos are two pieces; the copy's page
  // offers "Same as another piece…", and its picker lists the khaki chinos.
  112: { steps: DUP_STORY },
  113: { steps: DUP_STORY },
  // A photo on the wrong card (#289, 09-ui-review §8 W7): screen 96's story with the grey tee in the closet too, so the
  // white tee's page has two photos (p01b, p01a) and another top; each photo's long-press offers Not this piece and
  // It's another piece… (its picker lists the grey tee).
  114: {
    steps: [
      { at: '2026-10-22T07:30:00', do: 'closet', ids: ['T1', 'T2', 'B1', 'S1'] },
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
      { at: '2026-10-22T07:51:00', do: 'closetYes' },
    ],
  },
  // The stylist's cards (07 §13 R9, #297): the demo's answers with an attachment, on the full scenario's closet.
  167: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: 'What goes with my olive overshirt?' }] },
  168: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: 'What would this outfit score?' }] },
  169: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: 'What should I wear to work?' }] },
  170: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: 'What should I wear to work?' }, { at: '2026-10-22T12:06:00', do: 'askTap', option: 'Business casual' }] },
  171: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: 'What should I buy next?' }] },
  172: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: 'Which shoes are my dressiest?' }] },
  173: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: "I'm a 32 waist." }] },
  174: { asOf: ASK_AS_OF, steps: [{ at: '2026-10-22T12:05:00', do: 'ask', text: 'I also have a grey hoodie.' }] },
  // The Closet's Outfits (09-ui-review §13, #307). Screen 15 keeps showing the Pieces grid it always did.
  15: { steps: [{ at: '2026-10-22T07:00:00', do: 'kv', key: 'closet.segment', value: 'pieces' }] },
  // How baggy a piece is (09-ui-review §18, #316): the dark jeans read slim, wide, wide and straight in four checks.
  194: { steps: [{ at: '2026-10-22T07:30:00', do: 'sightings', itemId: 'B3', legs: ['slim', 'wide', 'wide', 'straight'] }, { at: '2026-10-22T07:31:00', do: 'kv', key: 'closet.segment', value: 'pieces' }] },
  195: { steps: [{ at: '2026-10-22T07:30:00', do: 'sightings', itemId: 'B3', legs: ['slim', 'wide', 'wide', 'straight'] }] },
  196: { steps: [{ at: '2026-10-22T07:30:00', do: 'sightings', itemId: 'B3', legs: ['slim', 'wide', 'wide', 'straight'] }] },
  // Bagginess on the fit-check card (§19, #322): s12's mid-wash jeans, read slim, wide and wide in earlier photos.
  201: { steps: DOUBT_STORY },
  202: { steps: [...DOUBT_STORY, { at: '2026-10-22T12:12:00', do: 'kv', key: 'closet.segment', value: 'outfits' }] },
  203: { steps: DOUBT_STORY },
  // Step 4's code-only batch (09-ui-review §20.8): offline (210), "That score is wrong" (211), a re-check that moved (215).
  210: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 's14', occasion: 'everyday', fault: 'offline' }, { at: '2026-10-22T07:44:00', do: 'askOffline', text: 'What goes with my jeans?' }] },
  211: { steps: [FIRST_CHECK, { at: '2026-10-22T07:45:00', do: 'ask', text: 'That score is wrong.' }] },
  215: { steps: [FIRST_CHECK, { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 's14b' }] },
  183: { steps: [{ at: '2026-10-22T07:30:00', do: 'closet', ids: ['T1', 'T2', 'B1', 'B3'] }, { at: '2026-10-22T07:31:00', do: 'kv', key: 'closet.segment', value: 'outfits' }] },
  // Past chats (07 §14 P4): yesterday's answers with a buy card, an answered tap question and a saved fact, read-only
  // (the olive overshirt isn't in the demo closet until the 22nd, so its outfit card would rightly be dropped).
  175: { asOf: '2026-10-21T12:00:00', steps: [
    { at: '2026-10-21T12:05:00', do: 'ask', text: 'What should I buy next?' },
    { at: '2026-10-21T12:07:00', do: 'ask', text: 'What should I wear to work?' },
    { at: '2026-10-21T12:08:00', do: 'askTap', option: 'Business casual' },
    { at: '2026-10-21T12:09:00', do: 'ask', text: "I'm a 32 waist." },
  ] },
  // The end of onboarding (#291; L3 and the pinned rows 163–166, #292): his first check on the Welcome photo (7.5, with a
  // fix to re-check); the taps after it (Later, a Starter piece, the notification ask) are the screen's `finish` steps
  // (features/finish/demo.ts).
  // All 3 moves done (#292, §9.9 Y5): the re-check made move 2's fix, the first check's top fix (s14b wears the white leather sneakers).
  180: { steps: [FIRST_CHECK, { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 's14b' }] },
  181: { steps: [FIRST_CHECK, { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 's14b' }] },
  // The two-shot check, step 0 (#313): p01b's outfit read as top only (a short mirror), then its pants and shoes snapped.
  185: { asOf: '2026-10-20T08:09:00', steps: [{ at: '2026-10-20T08:10:00', do: 'check', photoId: 'p01t', occasion: 'everyday' }] },
  186: { asOf: '2026-10-20T08:09:00', steps: [{ at: '2026-10-20T08:10:00', do: 'check', photoId: 'p01t', occasion: 'everyday' }, { at: '2026-10-20T08:12:00', do: 'snap', photoId: 'p01b' }] },
  187: { asOf: '2026-10-20T08:09:00', steps: [{ at: '2026-10-20T08:10:00', do: 'check', photoId: 'p01t', occasion: 'everyday' }] },
  ...Object.fromEntries([150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166].map((n) => [n, { steps: [FIRST_CHECK] }])),
};

/** Ids a story made that its screen's link names (`{dup}`): applyDemoScreen fills them in (#280). */
export const demoLinkIds: Record<string, string> = {};

export async function prepareDemoScreen(sc: ScreenScenario): Promise<void> {
  // The story's checks open on their final card (stable screenshots); -demoReveal re-arms screens 7, 10 and 11's
  // reveal afterwards (features/fitcheck/reveal.ts).
  setDemoPreparing(true);
  try {
    await playStory(sc);
  } finally {
    setDemoPreparing(false);
  }
  await armDemoReveal(store, sc.n, getDemoArgs().reveal);
}

async function playStory(sc: ScreenScenario): Promise<void> {
  await fitCheck.cancel();
  await fitCheck.closet.settle();
  readingSource.holdAt = null;
  setTimerOverride({});
  liveAnswer.clear();
  await store.wipe();
  for (const k of Object.keys(demoLinkIds)) delete demoLinkIds[k];
  const story = STORY[sc.n] ?? { steps: [] };
  const args = getDemoArgs();
  setDemoArgs({ ...args, latency: 0 });
  // The connection is pinned (G18): online, or offline on the offline screens, whatever the Mac's Wi-Fi is doing.
  connectivity.force(!sc.offline);

  if (sc.scenario === 'full') {
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at(story.asOf ?? sc.now) });
  } else if (sc.onboarded) {
    const a = seed.scenarios.firstRun.onboardingAnswers;
    await completeOnboarding(
      store,
      { styles: a.styles as unknown as Styles, heightCm: a.heightCm, build: a.build, fitPreference: a.fitPreference, birthYear: a.birthYear, ...(sc.consent === false ? { consent: false } : {}) },
      at('2026-10-22T07:40:00'),
      newId,
    );
  }
  await store.setKv(KV.scenario, sc.scenario);
  await store.setKv(KV.seedLoaded, sc.scenario);
  if (sc.weather && sc.weatherAllowed) await store.setKv(WEATHER_PERMISSION_KV, 'granted');

  for (const step of story.steps) {
    startClock(step.at);
    if (step.do === 'morning') {
      await morning.ensureCard();
      continue;
    }
    if (step.do === 'wear') {
      const idea = (await store.dailyIdeas.all()).sort((a, b) => b.createdAt - a.createdAt)[0];
      if (idea) await morning.wear(idea.id);
      continue;
    }
    if (step.do === 'closet') {
      const full = seed.scenarios.full.closet as unknown as { id: string }[];
      const sub = { ...seed, scenarios: { ...seed.scenarios, full: { ...seed.scenarios.full, closet: full.filter((c) => step.ids.includes(c.id)) } } };
      const tmp = createMemoryStore();
      await loadScenario(tmp, sub, { scenario: 'full', zone: US_EASTERN });
      for (const c of await tmp.closet.all()) if (step.ids.includes(c.id)) await store.closet.put(c);
      for (const o of await tmp.closetObs.all()) if (step.ids.includes(o.itemId)) await store.closetObs.put(o);
      continue;
    }
    if (step.do === 'closetYes') {
      await fitCheck.closet.settle();
      for (const { checkId, ask } of await fitCheck.closet.openAsks()) await fitCheck.answerDuplicate(checkId, ask.obsId, 'same');
      continue;
    }
    if (step.do === 'closetNo') {
      await fitCheck.closet.settle();
      for (const { checkId, ask } of await fitCheck.closet.openAsks()) {
        await fitCheck.answerDuplicate(checkId, ask.obsId, 'new');
        demoLinkIds.dup ??= ask.itemId;
      }
      // The matcher may link the re-check's chinos on its own (no question to say No to): then the newest photo of a
      // piece seen in two checks is split off, as "Not this piece" on its page would, so the duplicate still exists.
      if (!demoLinkIds.dup) {
        const obs = (await store.closetObs.all()).filter((o) => o.fitCheckId).sort((a, b) => b.createdAt - a.createdAt);
        const twice = obs.find((o) => obs.some((x) => x.itemId === o.itemId && x.fitCheckId !== o.fitCheckId));
        const piece = twice ? await fitCheck.closet.notThisPiece(twice.id) : null;
        if (piece) demoLinkIds.dup = piece.id;
      }
      continue;
    }
    if (step.do === 'scans') {
      for (let i = 0; i < step.n; i++) await saveDemoScan(store, at(step.at) + i * 60_000);
      continue;
    }
    if (step.do === 'whichOne') {
      // Boxes on the card's neck-down frame of the bundled photo.
      const payload: WhichOnePayload = {
        question: 'whichOne', state: 'open', photoUri: '', photoId: step.photoId, aspect: null, mode: 'check', parentCheckId: null,
        people: [{ x: 0.2, y: 0.01, width: 0.6, height: 0.97 }, { x: 0.76, y: 0.12, width: 0.23, height: 0.66 }],
      };
      await store.chat.put({
        id: newId('M'), createdAt: at(step.at), role: 'stylist', kind: 'card', text: null, cardType: 'question', fitCheckId: null, outfitId: null, itemId: null,
        chips: [], payload: payload as unknown as Record<string, unknown>,
      });
      continue;
    }
    if (step.do === 'ask') {
      const o = await askService.ask(step.text);
      if (o.kind === 'sent') await o.done;
      continue;
    }
    if (step.do === 'askOffline') {
      const t0 = at(step.at);
      const q = newId('M');
      await store.chat.put({ id: q, createdAt: t0, role: 'user', kind: 'text', text: step.text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {} });
      await store.chat.put({
        id: newId('M'), createdAt: t0 + 1, role: 'stylist', kind: 'text', text: t('fail.askOffline'), cardType: null, fitCheckId: null, outfitId: null, itemId: null,
        chips: [], payload: { askRetry: q },
      });
      continue;
    }
    if (step.do === 'kv') {
      await store.setKv(step.key, step.value);
      continue;
    }
    if (step.do === 'sightings') {
      let itemId = step.itemId ?? null;
      if (step.ofCheck) {
        await fitCheck.closet.settle();
        const links = (await store.fitChecks.get(step.ofCheck))?.details.closetSummary?.links ?? [];
        const items = await Promise.all(links.map((l) => store.closet.get(l.itemId)));
        itemId = items.find((c) => c?.slot === step.slot)?.id ?? null;
      }
      const it = itemId ? await store.closet.get(itemId) : null;
      if (!it) continue;
      const reads: Partial<typeof it.garment>[] = [...(step.legs ?? []).map((l) => ({ leg_shape: l })), ...(step.volumes ?? []).map((v) => ({ volume: v }))];
      const t0 = at(step.at);
      for (const [i, r] of reads.entries()) {
        await store.closetObs.put({
          id: `O-demo-${it.id}-${i}`, itemId: it.id, fitCheckId: null, readingId: null, closetReadingId: null, garmentIndex: null,
          origin: 'garment', garment: { ...it.garment, ...r }, closet: null, sampledHex: null, sampledL: null, cropFile: null, cropQuality: null,
          decision: 'same', identityScore: null, candidates: [], askItemId: null, answeredAt: null, userConfirmed: null,
          createdAt: t0 - (reads.length - i) * 86_400_000, isDeleted: false,
        });
      }
      continue;
    }
    if (step.do === 'askTap') {
      const card = (await store.chat.all()).filter((m) => m.payload.askCard && (m.payload.askCard as { type?: string }).type === 'ask').sort((x, y) => y.createdAt - x.createdAt)[0];
      if (card) {
        const o = await askService.tap(card.id, step.option);
        if (o.kind === 'sent') await o.done;
      }
      continue;
    }
    if (step.do === 'askUsed') {
      const day = dayKey(at(step.at), US_EASTERN);
      const u = (await store.usage.get(day)) ?? { dayKey: day, checks: 0, rechecks: 0, questions: 0, items: 0 };
      await store.usage.put({ ...u, questions: step.n });
      continue;
    }
    if (step.do === 'askHold') {
      const id = newId('M');
      await store.chat.put({
        id, createdAt: at(step.at), role: 'user', kind: 'text', text: step.text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {},
      });
      liveAnswer.hold(step.partial ? { phase: 'streaming', questionId: id, replaces: null, text: step.partial } : { phase: 'waiting', questionId: id, replaces: null });
      continue;
    }
    if (step.do === 'hold') {
      // Without the screen's freeChecksUsed (it would hold the next day too), that day's free check is spent here.
      if (step.spend) {
        const day = dayKey(at(step.at), US_EASTERN);
        const u = (await store.usage.get(day)) ?? { dayKey: day, checks: 0, rechecks: 0, questions: 0, items: 0 };
        await store.usage.put({ ...u, checks: Math.max(u.checks, 1) });
      }
      // A dev build with a live key counts no checks (session.ts checksUsedOverride → 0), so a spent day is also spent
      // for that override, for this step only: the next morning stays free (screen 121, #281).
      const before = getDemoArgs();
      if (step.spend && before.freeChecksUsed === null) setDemoArgs({ ...before, freeChecksUsed: 1 });
      let r;
      try {
        r = await fitCheck.start({ mode: 'check', photoId: step.photoId, occasion: 'everyday', checkId: STORY_PARTIAL });
      } finally {
        if (step.spend && before.freeChecksUsed === null) setDemoArgs({ ...getDemoArgs(), freeChecksUsed: null });
      }
      if (step.saved && r.outcome === 'held') await fitCheck.saveHeld(r.checkId);
      continue;
    }
    if (step.do === 'openApp') {
      await fitCheck.onAppOpen();
      continue;
    }
    if (step.do === 'tap') {
      await fitCheck.answerTap(step.checkId ?? STORY_TAP, step.answer);
      continue;
    }
    if (step.do === 'looks') {
      await store.profile.patch('me', { styles: picksToStyles(step.styles) });
      continue;
    }
    if (step.do === 'goingFor') {
      await fitCheck.changeGoingFor(step.checkId ?? STORY_FIRST_CHECK, step.style);
      continue;
    }
    if (step.do === 'rescore') {
      await fitCheck.changeLens(step.checkId ?? STORY_FIRST_CHECK, { occasion: step.occasion });
      continue;
    }
    if (step.do === 'recheckPrompt') {
      // No chat line since Oct 14 (the camera says what a re-check reads); the step stays so old stories keep their timing.
    } else if (step.do === 'recheck') {
      await fitCheck.start({ mode: 'recheck', photoId: step.photoId, parentCheckId: STORY_FIRST_CHECK, checkId: STORY_RECHECK });
    } else if (step.do === 'snap') {
      await fitCheck.start({ mode: 'shoeSnap', photoId: step.photoId, parentCheckId: STORY_PARTIAL });
    } else if (step.hold !== undefined) {
      // Screen 6: freeze mid-reading with the timers off (headless Chrome's virtual time would fire them).
      readingSource.holdAt = step.hold;
      setTimerOverride({ enabled: false });
      void fitCheck.start({ mode: 'check', photoId: step.photoId, occasion: 'everyday', checkId: STORY_FIRST_CHECK });
      await new Promise((r) => setTimeout(r, 30));
      if (step.occasion !== 'everyday') fitCheck.selectOccasion(step.occasion);
      if (step.tapLook) fitCheck.selectLook(step.tapLook);
    } else {
      // A step's fault (G18: no connection) holds for that check only.
      if (step.fault) setDemoArgs({ ...getDemoArgs(), fault: step.fault });
      try {
        await fitCheck.start({
          mode: 'check', photoId: step.photoId, occasion: step.occasion, checkId: step.checkId ?? (sc.scenario === 'firstRun' ? STORY_FIRST_CHECK : STORY_PARTIAL),
          ...(step.style ? { style: step.style } : {}),
        });
      } finally {
        if (step.fault) setDemoArgs({ ...getDemoArgs(), fault: args.fault });
      }
    }
  }
  // The closet call lands after the score card: wait for it so the screen shows the written closet.
  await fitCheck.closet.settle();
  setDemoArgs({ ...getDemoArgs(), latency: args.latency });
  startClock(getDemoArgs().now ?? sc.now);
}
