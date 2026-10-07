// Row types for the app's data. @kitted/core owns the value types (Reading, Garment, Fix,
// ClosetItem); these wrap them with what the app stores. Times are epoch ms.

import type { ClosetItem, Fix, Reading, Styles } from '@kitted/core';

export type Role = 'user' | 'stylist';
export type MessageKind = 'text' | 'photo' | 'card';
export type CardType =
  | 'fitCheck'
  | 'recheck'
  | 'outfitIdea'
  | 'turnOnChecks'
  | 'support'
  | 'limit'
  | 'held'
  | 'plan'
  | 'question'
  | 'item';

/** The seven occasion chips (02 D6); stored as rubric occasion ids. */
export type OccasionKey = 'everyday' | 'class' | 'date' | 'interview' | 'event' | 'gym' | 'home';
export const OCCASIONS: readonly OccasionKey[] = ['everyday', 'class', 'date', 'interview', 'event', 'gym', 'home'];

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
  summary: string;
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
