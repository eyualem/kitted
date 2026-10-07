// Free tier (05 §3.1): 1 fit check a day with one re-check, 5 questions; Pro: 10 and 50.
// Days roll over at 4 am (core dayKey). A re-check stays open 30 min, or until 4 am after the
// first-ever check (ruling 22). Failures never consume anything. The server is the source of
// truth from M4; this is the local mirror the UI reads.

import { dayKey, nextRolloverMs, RUBRIC_DATA } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { FitCheckRow, UsageDay } from '@/data/types';
import type { StringKey } from '@/i18n/en';
import type { Clock } from './clock';

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
  pro: boolean;
  checksUsed: number;
  checkLimit: number;
  /** The re-check of today's check is still open. */
  recheckOpen: boolean;
  questionsUsed: number;
  questionLimit: number;
  heldCount: number;
  nextResetMs: number;
}

/** When a check's included re-check closes. */
export function recheckDeadline(check: Pick<FitCheckRow, 'createdAt' | 'isFirstCheck'>, clock: Clock): number {
  return check.isFirstCheck ? nextRolloverMs(check.createdAt, clock.offset) : check.createdAt + RECHECK_WINDOW_MS;
}

export function isRecheckOpen(check: Pick<FitCheckRow, 'createdAt' | 'isFirstCheck' | 'recheckUsed' | 'status' | 'parentId'>, nowMs: number, clock: Clock): boolean {
  if (check.recheckUsed || check.status !== 'scored' || check.parentId) return false;
  return nowMs < recheckDeadline(check, clock);
}

/** The nav subtitle (02 D12), free tier only. */
export function quotaLine(s: QuotaSnapshot): StringKey | null {
  if (s.pro) return null;
  if (s.heldCount > 0) return 'stylist.quota.held';
  if (s.checksUsed < s.checkLimit) return 'stylist.quota.free';
  return s.recheckOpen ? 'stylist.quota.recheck' : 'stylist.quota.used';
}

export interface QuotaDeps {
  store: KittedStore;
  clock: Clock;
  isPro: () => boolean;
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
    const pro = deps.isPro();
    const checks = await store.fitChecks.all();
    const todays = checks.filter((c) => c.dayKey === key && !c.parentId && c.status === 'scored');
    const override = deps.checksUsedOverride?.() ?? null;
    return {
      dayKey: key,
      pro,
      checksUsed: override ?? u.checks,
      checkLimit: pro ? LIMITS.proChecks : LIMITS.freeChecks,
      recheckOpen: todays.some((c) => isRecheckOpen(c, now, clock)),
      questionsUsed: u.questions,
      questionLimit: pro ? LIMITS.proQuestions : LIMITS.freeQuestions,
      heldCount: checks.filter((c) => c.status === 'held').length,
      nextResetMs: nextRolloverMs(now, clock.offset),
    };
  }

  const bump = async (field: 'checks' | 'rechecks' | 'questions' | 'items') => {
    const u = await usage(today());
    await store.usage.put({ ...u, [field]: u[field] + 1 });
  };

  return {
    snapshot,
    async canStartCheck(): Promise<boolean> {
      const s = await snapshot();
      return s.checksUsed < s.checkLimit;
    },
    consumeCheck: () => bump('checks'),
    consumeRecheck: () => bump('rechecks'),
    consumeQuestion: () => bump('questions'),
  };
}

export type QuotaService = ReturnType<typeof createQuota>;
