// Row types for the app's data. @kitted/core owns the value types (Reading, Garment, Fix,
// ClosetItem); these wrap them with what the app stores. Times are epoch ms.

import type {
  ClosetItem, ConfirmedFields, DetectedStyle, Fix, Garment, GoingForAdvice, PartName, PartResult, PartsCondition, PartsOccasion, Reading, Styles, TapOption, TapQuestion,
} from '@kitted/core';

export type Role = 'user' | 'stylist';
export type MessageKind = 'text' | 'photo' | 'card';
export type CardType =
  | 'fitCheck'
  | 'recheck'
  | 'outfitIdea'
  | 'morning'
  | 'turnOnChecks'
  | 'support'
  | 'limit'
  | 'held'
  | 'plan'
  | 'question'
  | 'item';

/** The seven occasion chips (02 D6); stored as rubric occasion ids. */
export type OccasionKey = 'everyday' | 'class' | 'date' | 'going_out' | 'interview' | 'event' | 'gym' | 'home';
export const OCCASIONS: readonly OccasionKey[] = ['everyday', 'class', 'date', 'going_out', 'interview', 'event', 'gym', 'home'];

/** The morning/evening card's occasion menu (02 "S1d"): no Gym/Home; `staying_in` is evening-only and never scored. */
export type CardOccasion = Exclude<OccasionKey, 'gym' | 'home'> | 'staying_in';
export const DAY_CARD_OCCASIONS: readonly CardOccasion[] = ['everyday', 'class', 'date', 'going_out', 'interview', 'event'];
export const EVENING_CARD_OCCASIONS: readonly CardOccasion[] = ['going_out', 'date', 'event', 'everyday', 'staying_in'];

/** One style per check or idea (DECISIONS-LOG #61): the 7 styles rubric v4 detects. Renamed in V5 (#85):
 *  preppy and old money became classic prep, gorpcore became outdoor. */
export type StyleKey = DetectedStyle;
export const STYLES: readonly StyleKey[] = ['streetwear', 'smart_casual', 'minimalist', 'workwear', 'classic_prep', 'vintage_sport', 'outdoor'];

/** Old keys (onboarding before V5, seed.json, kv) to today's: preppy / old_money -> classic_prep,
 *  gorpcore -> outdoor; anything unknown -> null. Use it wherever a style is read from storage or a route. */
export function normStyleKey(s: unknown): StyleKey | null {
  if (s === 'preppy' || s === 'old_money') return 'classic_prep';
  if (s === 'gorpcore') return 'outdoor';
  return typeof s === 'string' && (STYLES as readonly string[]).includes(s) ? (s as StyleKey) : null;
}

export type IdeaSlot = 'day' | 'evening';
export type IdeaState = 'idea' | 'wearing' | 'checked' | 'skipped' | 'stayingIn';

/** One posted morning/evening card (02 "S1d"): locked for its day key and slot (#58, #60). */
export interface DailyIdeaRow {
  /** `${dayKey}|${slot}` */
  id: string;
  dayKey: string;
  slot: IdeaSlot;
  occasion: CardOccasion;
  /** null = scored by the general standard (no style chosen). */
  style: StyleKey | null;
  /** The picked outfit (outfits row), or null when the closet is thin/empty. */
  outfitId: string | null;
  /** The DayWeather it was planned with, or null (no location: season only). */
  weather: Record<string, unknown> | null;
  messageId: string | null;
  state: IdeaState;
  /** The check that collapsed it (any check that day or slot). */
  fitCheckId: string | null;
  createdAt: number;
}

/** `asking`: read, waiting for the one quick tap (S5q); nothing counted or added yet. */
export type FitCheckStatus = 'scoring' | 'asking' | 'scored' | 'unreadable' | 'notClothed' | 'failed' | 'held';
export type ReadingSourceKind =
  | 'full'
  | 'lower'
  | 'recheckRaw'
  | 'recheckMerged'
  | 'corrected'
  | 'userConfirmed'
  | 'snapMerged'
  | 'closetPick'
  /** The one quick tap's answer (or a skip's default) applied to the full reading (derivedFrom = it). */
  | 'tapAnswer'
  /** The closet call's raw answer (V6, #91): `reading` holds a StoredClosetReading, not a v3 Reading. */
  | 'closet';
export type SnapState = 'none' | 'pending' | 'closetPick' | 'snapped' | 'skipped';

export interface ChatMessage {
  id: string;
  createdAt: number;
  role: Role;
  kind: MessageKind;
  text: string | null;
  cardType: CardType | null;
  fitCheckId: string | null;
  outfitId: string | null;
  itemId: string | null;
  /** Tap answers under a stylist question (shown only while it's the newest message). */
  chips: string[];
  /** Small extras: { stamp: true } forces a day stamp, { question: true } counts toward the limit, … */
  payload: Record<string, unknown>;
}

/** The one quick tap (02 "S5q", rubric v4 ask_question), as asked and answered. Stored on the check so the
 *  question survives the app closing, and so it's never asked twice. */
export interface TapState {
  /** "jeans/sweatpants" */
  pair: string;
  slot: TapQuestion['slot'];
  /** Index into the full reading's garments, and which piece of its slot it is (for a re-check's carry). */
  garmentIndex: number;
  ordinal: number;
  question: string;
  /** A pair: [as read, the look-alike]; the shoe question (tap v2, #120): one per kind, each with its `group`
   *  (boots / sneakers / slides) and the type code picked inside it. Each with the score it gives. */
  options: TapOption[];
  /** 'shoes' for "Boots, sneakers or slides?"; absent on the look-alike pairs (and on rows asked before #120). */
  kind?: 'shoes' | 'known';
  /** 'known' only (#126): the closet piece "Your {piece}?" asks about, and its name as asked. */
  knownId?: string;
  knownName?: string;
  /** The option values in the question's word order (the buttons). */
  order: string[];
  /** What a skip scores (the more generous reading). */
  default: string;
  swing: number;
  doubt: string;
  /** The occasion it was asked for (frozen on the question card). */
  occasion: OccasionKey;
  askedAt: number;
  /** The value scored: his answer, or the default after a skip. null while asking. */
  answer: string | null;
  skipped: boolean;
  answeredAt: number | null;
  /** The same photo was already scored once: the answer doesn't use a check. */
  free?: boolean;
}

/** What a check card needs beyond the score columns (fit_checks.details, V2). */
export interface CheckDetails {
  /** He removed this look from the Lookbook (#118): hidden there, and its pieces don't count it as a wear. The chat card stays. */
  removedFromLookbook?: number | null;
  /** Re-scored for another occasion or style after it landed (#62): what it was before. */
  rescoredFrom?: { score: number; occasion: OccasionKey; style: StyleKey | null };
  /** Closet ids matched by this photo, ids it added, and added ids he undid; since V6 also every garment's link
   *  and the open "Same as your …?" questions. Readers of matched/added/undone keep working without the rest. */
  closetSummary?: ClosetSummary;
  nextLevel?: string[];
  tips?: string[];
  /** No fix applies. */
  dialedIn?: boolean;
  /** Fix targets he said don't apply. */
  hiddenFixTargets?: string[];
  /** Scored on a warm day (its card's weather, else the month): no "add a layer" or boots fix (#160). */
  warm?: boolean;
  /** Re-check only. */
  recheck?: {
    parentScore: number; delta: number; rawDelta: number; notes: string[]; doneFixes: { copy: string; earned: number }[]; newProblems: string[]; notSeen: boolean;
    /** The same photo as an earlier check that day (#219): its reading reused, no new read, the re-check not used up. */
    samePhoto?: { checkId: string };
  };
  /** "Tell me": he confirmed the fix. */
  confirmed?: boolean;
  /** Partial: the remembered pair to offer and the weekday it was worn (0 = Sunday). */
  finish?: { suggestedItemId: string | null; weekday: number | null } | null;
  /** Why the card failed (S19); 'replaced' = a newer photo came in while it was asking. */
  failCode?: string;
  /** The one quick tap, when one was asked. */
  tap?: TapState;
  /** The look the outfit reads as (core styleLabel), on every re-score; null = none. Pre-v4 rows: absent. */
  readsAs?: StyleKey | null;
  /** The card's tip line under the fixes: "Next level" (default) or the parts engine's "Smaller step" (#209). */
  tipLead?: 'nextLevel' | 'smallerStep';
  /** Parts-scored checks only (rubricVersion "parts-…", #209): what the Why sheet shows. Older checks: absent. */
  parts?: StoredParts;
  /** "Going for" (#215): the look he's going for on this check, asked during the wait. Absent on older checks. */
  goingFor?: GoingForState;
  /** What the answer changes on the card (core goingForAdvice): a match, or the look it reads as with a piece and a
   *  move. null: Not sure, the gym or home. Advice only; it never changes the score. */
  goingForAdvice?: GoingForAdvice | null;
}

/** Where a pre-picked look came from (02 "Going for"): today's card, his last confirmed look (7 days), his first pick
 *  from setup, or none (Not sure). */
export type GoingForSource = 'card' | 'last' | 'setup' | 'none';

/** His answer as stored on the check. `style` mirrors the row's `style` (null = Not sure). */
export interface GoingForState {
  style: StyleKey | null;
  /** He tapped it (during the wait or with Change); false = the pre-pick stood. */
  confirmed: boolean;
  source: GoingForSource;
  /** The pre-pick and the occasion both came from the morning card ("Both from this morning's card."). */
  bothFromCard?: boolean;
  /** "Something else": his own words (trimmed, 80 max). No look is guessed from them; the advice runs as Not sure. */
  other?: string | null;
}

/** The parts engine's result as a check stores it (core PartsScored, trimmed) plus the part the card's move raises. */
export interface StoredParts {
  version: string;
  overall: number;
  average: number;
  averageUnrounded: number;
  rawUnrounded: number;
  earnedBonus: number;
  floored: boolean;
  parts: Record<PartName, PartResult>;
  naParts: PartName[];
  weightsUsed: Partial<Record<PartName, number>>;
  condition: PartsCondition;
  occasion: PartsOccasion;
  /** The part with the most to gain (copper in the strip): the top fix's first raised part, else the smaller step's, else
   *  the next level's, else the lowest part under 7; null when nothing stands out. */
  gainPart: PartName | null;
}

export interface FitCheckRow {
  id: string;
  createdAt: number;
  dayKey: string;
  photoFile: string | null;
  thumbFile: string | null;
  demoPhotoId: string | null;
  imageHash: string;
  occasion: OccasionKey;
  /** The one style it was scored for (#61); null = the general standard or a pre-V4 row. */
  style: StyleKey | null;
  status: FitCheckStatus;
  isPartial: boolean;
  notRated: string[];
  score: number | null;
  rawScore: number | null;
  subscores: Record<string, number>;
  occasionAdj: number;
  rulesFired: string[];
  credits: string[];
  advice: string[];
  fixes: Fix[];
  explanation: string | null;
  rubricVersion: string;
  isFavorite: boolean;
  snapState: SnapState;
  recheckUsed: boolean;
  isFirstCheck: boolean;
  readingId: string | null;
  parentId: string | null;
  itemIds: string[];
  details: CheckDetails;
}

export interface ReadingRow {
  id: string;
  imageHash: string;
  source: ReadingSourceKind;
  reading: Reading;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  latencyMs: number;
  createdAt: number;
  /** The reading this one was made from (corrections, merges). */
  derivedFrom: string | null;
}

/** One garment of a check and the closet item it went to (S11, corrections follow this link). */
export interface ClosetLink {
  origin: ObservationOrigin;
  /** Index into the reading's garments (origin garment / snap) or held_items (held). */
  index: number;
  itemId: string;
  obsId: string;
}

/** An open (or answered) "Same as your …?" question: the new piece (itemId) may be the candidate. */
export interface ClosetAsk {
  obsId: string;
  itemId: string;
  candidateId: string;
  runnerUpId?: string;
  /** null while open. */
  answer?: 'same' | 'new' | 'runnerUp' | null;
  /** What a "Yes" changed on the piece, so a changed answer can put it back: an alias it added, the type it replaced. */
  alias?: string | null;
  replacedSub?: string | null;
  /** Shape readings this "Yes" taught the piece (#115: leg / sleeve / shoe profile), removed again on a changed answer. */
  addedFieldAliases?: Record<string, string[]> | null;
  /** Later sightings that joined this open question (#116) and moved with its "Yes", so a changed answer moves them back. */
  riders?: string[] | null;
  /** Why it asks, for the card's one plain line (#117): set when the question is made. Missing on older rows. */
  reason?: AskReason | null;
  /** The word that line needs: the layer it was under ("overshirt"), or the type it read as ("sweatshirt"). */
  reasonWord?: string | null;
}

/** What removing a look changed, so Undo can put it back exactly (#118). */
export interface LookRemoval {
  checkIds: string[];
  /** Wears taken back per piece. */
  wears: Record<string, number>;
  /** Pieces only this look had, removed with it ("Remove look and its new pieces"). */
  removedItems: string[];
}

export type AskReason = 'halfSeen' | 'shoes' | 'logo' | 'logoDiffers' | 'fit' | 'type' | 'color' | 'similar';

export interface ClosetSummary {
  matched: string[];
  added: string[];
  undone: string[];
  links?: ClosetLink[];
  asks?: ClosetAsk[];
  /** pending: the closet call is still out (S11 rows say "Checking the details…"); done: written with it;
   *  fallback: written from the v3 fields alone (offline, failed, slow). Absent: before V6. */
  state?: 'pending' | 'done' | 'fallback';
  /** When the closet write started (pending → fallback after 12 s). */
  startedAt?: number;
  /** He answered, undid or split something in S11 for this check (a late closet answer then only enriches). */
  touched?: boolean;
  /** A late closet answer was folded in (catch-up or after a slow call). */
  enrichedAt?: number;
}

export type ClosetSource = 'fitCheck' | 'added' | 'chat' | 'seed';

/** The closet call's validated fields for one garment (services/closetSource/validate.ts). */
export interface ClosetFields {
  visible: boolean;
  /** [ymin, xmin, ymax, xmax] 0–1000, or [] when not visible. */
  box: number[];
  /** 1–3 cleaned words, never shown (parsed into a ShadeKey). */
  shade: string | null;
  lightness: 'light' | 'mid' | 'dark' | null;
  details: string[];
  /** Copied logo text, 'none' or 'unreadable' (cleaned; matched against a brand list, never shown raw). */
  logo_text: string | null;
  sleeve_length: 'short' | 'long' | 'sleeveless' | null;
  shoe_profile: 'sleek' | 'regular' | 'chunky' | null;
  denim_wear: 'none' | 'faded' | 'ripped' | null;
}

/** What the closet tile draws (features/closet/artSpec.ts reads it): settled by the drift guard. */
export interface ClosetArt {
  /** The color family shown (the garment's, unless 2 newer sightings or his confirmation moved it). */
  family: string | null;
  /** ShadeKey id ("grey|mid|-"), or null. */
  shade: string | null;
  details: string[];
  /** Brand id from core normalizeBrand (a listed brand only), or null. */
  brand: string | null;
  /** v3 pattern under the drift guard (#115: strong ones go in the name). Missing on art written before it. */
  pattern?: string | null;
  shoeProfile: 'sleek' | 'regular' | 'chunky' | null;
  denimWear: 'none' | 'faded' | 'ripped' | null;
}

/** closet_items.profile: what the matcher and the namer remember beyond the sightings. */
export interface ClosetProfile {
  /** Subcategories he confirmed are this item ("Yes, same one" on a sweatpants read of his jeans). */
  aliases: string[];
  /** Items he said are different pieces. */
  distinctFrom: string[];
  confirmed: ConfirmedFields;
  /** Shape readings he said belong to this piece (#115), per field: "Yes, same one" across a straight and a wide read. */
  fieldAliases?: Record<string, string[]>;
  /** He named it himself: never auto-renamed. */
  nameLocked?: boolean;
  /** The app named it (closet names, #91), so it may rename it when a detail is needed or the look settles. */
  autoName?: boolean;
  /** The detail word the name carries to tell it from another of his pieces ("zip"), sticky. */
  nameDetail?: string | null;
}

export type ObservationOrigin = 'garment' | 'held' | 'snap' | 'seed' | 'describe';
export type ObservationDecision = 'pending' | 'same' | 'new' | 'ask' | 'answeredSame' | 'answeredNew' | 'split' | 'undone';

/** One sighting of a closet piece (V6). */
export interface ClosetObservationRow {
  id: string;
  itemId: string;
  fitCheckId: string | null;
  /** The v3 reading the garment came from (after corrections / the tap answer). */
  readingId: string | null;
  closetReadingId: string | null;
  garmentIndex: number | null;
  origin: ObservationOrigin;
  /** The v3 garment after corrections and the tap answer (canonical, scored fields only). */
  garment: Garment;
  closet: ClosetFields | null;
  sampledHex: string | null;
  sampledL: number | null;
  cropFile: string | null;
  cropQuality: number | null;
  decision: ObservationDecision;
  identityScore: number | null;
  /** The items it was compared with (best first). */
  candidates: { id: string; score: number | null }[];
  /** decision ask: the item it may be. */
  askItemId: string | null;
  answeredAt: number | null;
  userConfirmed: ConfirmedFields | null;
  createdAt: number;
  isDeleted: boolean;
}

/** A closet item as stored. `garment`, `name`, `slot`, `confirmedFields` are core's ClosetItem. */
export interface ClosetItemRow extends ClosetItem {
  hex: string;
  confirmedFields: string[];
  photoFile: string | null;
  demoPhotoId: string | null;
  isPhotographed: boolean;
  source: ClosetSource;
  starterId: string | null;
  wornCount: number;
  lastWornAt: number | null;
  addedAt: number;
  /** Set by Undo on an auto-added item; the row stays so it can be added back. */
  isDeleted: boolean;
  /** V6 (#91). Display shade: a ShadeKey id ("grey|mid|-"), never the model's words. */
  shade?: string | null;
  profile?: ClosetProfile | null;
  /** Phase 3: a clean crop from his photo, and its quality. */
  cropFile?: string | null;
  cropScore?: number | null;
  art?: ClosetArt | null;
  /** "Yes, same one": this row was folded into that item (and is soft-deleted). */
  mergedInto?: string | null;
  /** Created while unsure: maybe the same piece as that item (an open "Same as your …?"). */
  maybeSameAs?: string | null;
  updatedAt?: number | null;
}

export interface UsageDay {
  dayKey: string;
  checks: number;
  rechecks: number;
  questions: number;
  items: number;
}

export interface ProfileRow {
  id: 'me';
  birthYear: number | null;
  heightCm: number | null;
  build: string;
  fitPreference: string;
  /** Ordered [style, weight] pairs, never an object (the score depends on order). */
  styles: Styles;
  boldness: string | null;
  budget: string | null;
  lastOccasion: OccasionKey;
  consentVersion: string | null;
  consentAt: number | null;
  onboardingDone: boolean;
  ideaTime: string | null;
  units: 'imperial' | 'metric';
  createdAt: number;
}

/** tapAnswer / tapSkip: the one quick tap (field subcategory; scoreBefore/After = the as-read and chosen option scores). */
export type CorrectionKind = 'wrongItem' | 'wrongDetail' | 'fixDoesntApply' | 'scoreOff' | 'fixConfirmed' | 'tapAnswer' | 'tapSkip';

export interface CorrectionRow {
  id: string;
  fitCheckId: string;
  kind: CorrectionKind;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  userScore: number | null;
  scoreBefore: number | null;
  scoreAfter: number | null;
  sentAt: number | null;
  createdAt: number;
}

export interface OutfitRow {
  id: string;
  itemIds: string[];
  occasion: string;
  /** "Sharp, not stiff" (hero ideas only). */
  title: string | null;
  summary: string;
  /** Predicted score for the occasion (hero ideas), the wearing state, … */
  details: { predictedScore?: number; wornAt?: number };
  source: 'idea' | 'fitCheck' | 'seed';
  isSaved: boolean;
  createdAt: number;
}

export interface WearLogRow {
  day: string;
  fitCheckId: string | null;
  outfitId: string | null;
  createdAt: number;
}

export interface FactRow {
  id: string;
  key: string;
  value: string;
  source: 'told' | 'fitCheck' | 'guess';
  createdAt: number;
  isDeleted: boolean;
}
