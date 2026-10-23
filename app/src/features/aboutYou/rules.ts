// When Kit asks for height, build and fit (10-onboarding.md §10.2, #370), pure. Never before a scored fit, never while a
// check is busy, never once one of the three is given, at most twice (the second 7 days after a Not now), and one ask
// per visit with the end-of-onboarding sequence and the save offer. First under an answer that would use them (T1),
// else on a later visit once the sequence is over (T2).
import type { AskKind } from '@/features/ask/prompt';
import type { FinishStep } from '@/features/finish/sequence';
import { BUILDS, FITS, type Build, type FitPref } from '@/features/onboarding/basics';
import { t } from '@/i18n/en';

export const ABOUT_YOU_KEY = 'aboutYou.offer';
export const MAX_POSTS = 2;
export const AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
/** The answers whose advice height, build or fit would change (the router's kinds). */
export const ABOUT_YOU_KINDS: readonly AskKind[] = ['fitHowTo', 'shape', 'buyNext'];

export interface AboutYouState {
  posts: number;
  lastPostAt: number | null;
  /** His last Not now (the second post waits AGAIN_AFTER_MS from it). */
  declinedAt: number | null;
}

export const NO_ABOUT_YOU: AboutYouState = { posts: 0, lastPostAt: null, declinedAt: null };

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function parseAboutYou(raw: string | null): AboutYouState {
  if (!raw) return { ...NO_ABOUT_YOU };
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    return { posts: Math.max(0, Math.floor(num(v.posts) ?? 0)), lastPostAt: num(v.lastPostAt), declinedAt: num(v.declinedAt) };
  } catch {
    return { ...NO_ABOUT_YOU };
  }
}

/** Any of the three given (a junk or old word isn't an answer). */
export function basicsGiven(p: { heightCm: number | null; build: string; fitPreference: string } | null | undefined): boolean {
  if (!p) return false;
  return p.heightCm !== null || (BUILDS as readonly string[]).includes(p.build) || (FITS as readonly string[]).includes(p.fitPreference);
}

export interface AboutYouCheck {
  createdAt: number;
  status: string;
  recheck: boolean;
}

/** answerKind: the router's kind for the answer (prepare's `kind`, a string; null when it had none). */
export type AboutYouTrigger = { kind: 'answer'; answerKind: string | null } | { kind: 'visit' };

export interface AboutYouInput {
  trigger: AboutYouTrigger;
  state: AboutYouState;
  basicsGiven: boolean;
  checks: readonly AboutYouCheck[];
  /** A check is reading, asking or revealing. */
  busy: boolean;
  /** Another ask is due, under way or already posted this visit (the sequence, the save offer). */
  held: boolean;
  finishStep: FinishStep;
  visitStartMs: number;
  nowMs: number;
}

export type AboutYouVariant = 'answer' | 'visit';
export type AboutYouDecision = { kind: 'no' } | { kind: 'post'; variant: AboutYouVariant };

const NO: AboutYouDecision = { kind: 'no' };

export function aboutYouDue(i: AboutYouInput): AboutYouDecision {
  if (i.basicsGiven || i.busy || i.held || i.state.posts >= MAX_POSTS) return NO;
  if (i.state.posts > 0 && (i.state.declinedAt === null || i.nowMs - i.state.declinedAt < AGAIN_AFTER_MS)) return NO;
  const full = i.checks.filter((c) => c.status === 'scored' && !c.recheck);
  if (full.length === 0) return NO;
  if (i.trigger.kind === 'answer') {
    return i.trigger.answerKind !== null && (ABOUT_YOU_KINDS as readonly string[]).includes(i.trigger.answerKind) ? { kind: 'post', variant: 'answer' } : NO;
  }
  if (i.finishStep !== 'done' && i.finishStep !== 'skipped') return NO;
  const firstAt = Math.min(...full.map((c) => c.createdAt));
  return firstAt < i.visitStartMs ? { kind: 'post', variant: 'visit' } : NO;
}

/** The sheet's Save: on once one of the three is set. */
export function canSave(v: { heightIn: number | null; build: Build | null; fit: FitPref | null }): boolean {
  return v.heightIn !== null || v.build !== null || v.fit !== null;
}

export type AboutYouCardState = 'open' | 'declined' | 'saved';

export interface AboutYouCardView {
  tagLeft: string;
  tagRight: string;
  title: string;
  body: string;
  /** Shown instead of the card: after Save (or given elsewhere since) and after Not now. */
  line: string | null;
  buttons: boolean;
}

/** What the card shows (Past chats: read-only, no buttons). */
export function aboutYouCardView(p: { variant: AboutYouVariant; state: AboutYouCardState }, given: boolean, readOnly: boolean): AboutYouCardView {
  const line = p.state === 'declined' ? t('about.declined') : p.state === 'saved' || given ? t('about.saved') : null;
  return {
    tagLeft: t('about.tag'),
    tagRight: t('about.tagRight'),
    title: t('about.title'),
    body: t(p.variant === 'answer' ? 'about.bodyAnswer' : 'about.body'),
    line,
    buttons: !readOnly && line === null,
  };
}
