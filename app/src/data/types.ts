// Row types for the app's data. @kitted/core owns the value types (Reading, Garment, Fix,
// ClosetItem); these wrap them with what the app stores. Times are epoch ms.

import type { ClosetItem, Fix, Reading, Styles } from '@kitted/core';

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

/** One style per check or idea (DECISIONS-LOG #61): the rubric's style bands, with preppy merged into old money (#57). */
export type StyleKey = 'streetwear' | 'smart_casual' | 'minimalist' | 'workwear' | 'old_money' | 'vintage_sport' | 'gorpcore';
export const STYLES: readonly StyleKey[] = ['streetwear', 'smart_casual', 'minimalist', 'workwear', 'old_money', 'vintage_sport', 'gorpcore'];

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

export type FitCheckStatus = 'scoring' | 'scored' | 'unreadable' | 'notClothed' | 'failed' | 'held';
export type ReadingSourceKind =
  | 'full'
  | 'lower'
  | 'recheckRaw'
  | 'recheckMerged'
  | 'corrected'
  | 'userConfirmed'
  | 'snapMerged'
  | 'closetPick';
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

/** What a check card needs beyond the score columns (fit_checks.details, V2). */
export interface CheckDetails {
  /** Closet ids matched by this photo, ids it added, and added ids he undid. */
  closetSummary?: { matched: string[]; added: string[]; undone: string[] };
  nextLevel?: string[];
  tips?: string[];
  /** No fix applies. */
  dialedIn?: boolean;
  /** Fix targets he said don't apply. */
  hiddenFixTargets?: string[];
  /** Re-check only. */
  recheck?: { parentScore: number; delta: number; rawDelta: number; notes: string[]; doneFixes: { copy: string; earned: number }[]; newProblems: string[]; notSeen: boolean };
  /** "Tell me": he confirmed the fix. */
  confirmed?: boolean;
  /** Partial: the remembered pair to offer and the weekday it was worn (0 = Sunday). */
  finish?: { suggestedItemId: string | null; weekday: number | null } | null;
  /** Why the card failed (S19). */
  failCode?: string;
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

export type ClosetSource = 'fitCheck' | 'added' | 'chat' | 'seed';

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

export type CorrectionKind = 'wrongItem' | 'wrongDetail' | 'fixDoesntApply' | 'scoreOff' | 'fixConfirmed';

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
