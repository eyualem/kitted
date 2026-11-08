// Free tier (05 §3.1): 1 fit check a day with one re-check, 5 questions; Pro: 10 and 50.
// Days roll over at 4 am (core dayKey). A re-check stays open 30 min, or until 4 am after the
// first-ever check (ruling 22). Failures never consume anything. The server is the source of
// truth from M4; this is the local mirror the UI reads.

import { dayKey, nextRolloverMs, RUBRIC_DATA } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { FitCheckRow, UsageDay } from '@/data/types';
import type { StringKey } from '@/i18n/en';
import type { Clock } from './clock';
import type { ServerTier } from './server/tier';

const cfg = RUBRIC_DATA.config as Record<string, number>;
export const LIMITS = {
  freeChecks: cfg.freeChecksPerDay ?? 1,
  freeQuestions: cfg.freeQuestionsPerDay ?? 5,
  proChecks: cfg.proChecksPerDay ?? 10,
  proQuestions: cfg.proQuestionsPerDay ?? 50,
};
export const RECHECK_WINDOW_MS = 30 * 60_000;

export interface QuotaSnapshot {
  dayKey: string;
  /** Pro's limits: a purchase, or the server's tier (every account during the beta, 13-server.md §8, A10). */
  pro: boolean;
  /** Bought Pro (the plan row and "Try Pro" read this; the server's beta tier never makes him "Pro"). */
  purchased: boolean;
  checksUsed: number;
  checkLimit: number;
  /** The re-check of today's check is still open. */
  recheckOpen: boolean;
  /** Which check that open re-check belongs to (the newest one still open), for You's Re-check button. */
  recheckId: string | null;
  questionsUsed: number;
  questionLimit: number;
  heldCount: number;
  nextResetMs: number;
}

type WindowCheck = Pick<FitCheckRow, 'createdAt' | 'isFirstCheck'> & { details?: Pick<FitCheckRow['details'], 'tap'> };

/** When a check's included re-check closes. It opens when the score lands: after the one quick tap, that's
 *  his answer, not the photo. */
export function recheckDeadline(check: WindowCheck, clock: Clock): number {
  const start = check.details?.tap?.answeredAt ?? check.createdAt;
  return check.isFirstCheck ? nextRolloverMs(start, clock.offset) : start + RECHECK_WINDOW_MS;
}

export function isRecheckOpen(check: WindowCheck & Pick<FitCheckRow, 'recheckUsed' | 'status' | 'parentId'>, nowMs: number, clock: Clock): boolean {
  if (check.recheckUsed || check.status !== 'scored' || check.parentId) return false;
  return nowMs < recheckDeadline(check, clock);
}

/** The newest of today's checks whose re-check is still open, or null. */
export function openRecheckId(checks: readonly FitCheckRow[], nowMs: number, clock: Clock): string | null {
  let best: FitCheckRow | null = null;
  for (const c of checks) if (isRecheckOpen(c, nowMs, clock) && (!best || c.createdAt > best.createdAt)) best = c;
  return best?.id ?? null;
}

/** The nav subtitle (02 D12), free tier only. */
export function quotaLine(s: QuotaSnapshot): StringKey | null {
  if (s.pro) return null;
  if (s.heldCount > 0) return 'stylist.quota.held';
  if (s.checksUsed < s.checkLimit) return 'stylist.quota.free';
  return s.recheckOpen ? 'stylist.quota.recheck' : 'stylist.quota.used';
}

/** Questions left today shows in the subtitle at this many or fewer (02 S25), free and Pro. */
export const QUESTIONS_SHOWN_AT = 3;

export const questionsLeft = (s: Pick<QuotaSnapshot, 'questionsUsed' | 'questionLimit'>): number => Math.max(0, s.questionLimit - s.questionsUsed);

/** The Stylist subtitle with its one argument: a photo waiting to score first (it's his), then "{n} questions left
 *  today" once 3 or fewer are left (07 §6.2), else the check line. One line: the nav title has room for one. */
export function stylistSubtitle(s: QuotaSnapshot): { key: StringKey; n?: number } | null {
  if (!s.pro && s.heldCount > 0) return { key: 'stylist.quota.held' };
  const left = questionsLeft(s);
  if (left <= QUESTIONS_SHOWN_AT) return { key: 'stylist.quota.questions', n: left };
  const line = quotaLine(s);
  return line ? { key: line } : null;
}

export interface QuotaDeps {
  store: KittedStore;
  clock: Clock;
  isPro: () => boolean;
  /** The tier the server last answered with (services/server/tier.ts); null before any server answer. */
  serverTier?: () => Promise<ServerTier | null>;
  /** Demo override: `freeChecksUsed=<n>`. */
  checksUsedOverride?: () => number | null;
}

export function createQuota(deps: QuotaDeps) {
  const { store, clock } = deps;
  const today = () => dayKey(clock.nowMs(), clock.offset);
  const usage = async (key: string): Promise<UsageDay> =>
    (await store.usage.get(key)) ?? { dayKey: key, checks: 0, rechecks: 0, questions: 0, items: 0 };

  async function snapshot(): Promise<QuotaSnapshot> {
    const now = clock.nowMs();
    const key = today();
    const u = await usage(key);
    const purchased = deps.isPro();
    const pro = purchased || (await deps.serverTier?.().catch(() => null)) === 'pro';
    const checks = await store.fitChecks.all();
    const todays = checks.filter((c) => c.dayKey === key && !c.parentId && c.status === 'scored');
    const override = deps.checksUsedOverride?.() ?? null;
    return {
      dayKey: key,
      pro,
      purchased,
      checksUsed: override ?? u.checks,
      checkLimit: pro ? LIMITS.proChecks : LIMITS.freeChecks,
      recheckOpen: todays.some((c) => isRecheckOpen(c, now, clock)),
      recheckId: openRecheckId(todays, now, clock),
      questionsUsed: u.questions,
      questionLimit: pro ? LIMITS.proQuestions : LIMITS.freeQuestions,
      heldCount: checks.filter((c) => c.status === 'held').length,
      nextResetMs: nextRolloverMs(now, clock.offset),
    };
  }

  const bump = async (field: 'checks' | 'rechecks' | 'questions' | 'items', key: string = today()) => {
    const u = await usage(key);
    await store.usage.put({ ...u, [field]: u[field] + 1 });
  };

  return {
    snapshot,
    async canStartCheck(): Promise<boolean> {
      const s = await snapshot();
      return s.checksUsed < s.checkLimit;
    },
    /** `day`: the check's own day key (an answer to the one quick tap after 4 am still counts for its day). */
    consumeCheck: (day?: string) => bump('checks', day),
    consumeRecheck: () => bump('rechecks'),
    /** A question may be sent (07 §6.2): one is counted only when its answer arrives (consumeQuestion). */
    async canAskQuestion(): Promise<boolean> {
      const s = await snapshot();
      return s.questionsUsed < s.questionLimit;
    },
    consumeQuestion: () => bump('questions'),
  };
}

export type QuotaService = ReturnType<typeof createQuota>;

// T14 stubs (tasks/T14/IMPLEMENTATION.md, Interfaces): written with the tests, built by the implementer.
export type PlanTier = ServerTier;

export function limitsFor(_tier: PlanTier): { checks: number; questions: number } {
  throw new Error('T14: not built');
}

export function questionLimitText(_s: { tier: PlanTier }): string {
  throw new Error('T14: not built');
}
