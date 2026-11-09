// You › Plan & usage (02 Y5) and Settings' subscription rows: what plan he's on, today's usage lines, Restore
// purchases and the version footer. Pure where it can be; the screens pass in the quota snapshot and the clock.
//
// Mocked until P6: there is no StoreKit or RevenueCat yet. The plan comes from the demo entitlement (`pro=1`), the
// period and renewal date aren't known (so the card says "Kitted Pro" and the Pro line), and a trial exists only
// on demo screens (`demoPlan=trial`). Restore asks the same demo entitlement. On the beta's rules (the server's tier
// `beta`, FP7) the plan is "Kitted beta": its day, and no button.
import Constants from 'expo-constants';
import { PARTS_RUBRIC_VERSION, RUBRIC_DATA, type ZoneOffset } from '@kitted/core';
import { scoringEngine } from '@/features/fitcheck/scoring';
import { longDate } from '@/i18n/format';
import { t } from '@/i18n/en';
import { LIMITS, type QuotaSnapshot } from '@/services/quota';
import type { ServerTier } from '@/services/server/tier';

export type PlanInfo =
  | { kind: 'free' }
  | { kind: 'beta' }
  | { kind: 'pro'; period: 'yearly' | 'monthly' | null; renewsAtMs: number | null }
  | { kind: 'trial'; endsAtMs: number };

const DAY_MS = 24 * 3_600_000;

/** Today's plan. `demoPlan` (demo builds only): 'trial' (ends in 7 days), 'yearly' or 'monthly' (renews in 30). A
 *  purchase is Pro; else the server's `beta` is the beta plan. The server's `pro` alone never makes him "Kitted Pro". */
export function currentPlan(isPro: boolean, nowMs: number, demoPlan?: string | null, tier?: ServerTier): PlanInfo {
  if (demoPlan === 'trial') return { kind: 'trial', endsAtMs: nowMs + 7 * DAY_MS };
  if (demoPlan === 'yearly' || demoPlan === 'monthly') return { kind: 'pro', period: demoPlan, renewsAtMs: nowMs + 30 * DAY_MS };
  if (isPro) return { kind: 'pro', period: null, renewsAtMs: null };
  return tier === 'beta' ? { kind: 'beta' } : { kind: 'free' };
}

export const hasPro = (p: PlanInfo): boolean => p.kind === 'pro' || p.kind === 'trial';

/** The status card: "Free plan" / "Kitted Pro · Yearly" / "Pro trial", and its detail line. Free says what a day
 *  holds (the Today list under it already says "Resets at 4 am."). */
export function planStatus(p: PlanInfo, zone: ZoneOffset): { title: string; detail: string } {
  switch (p.kind) {
    case 'free':
      return { title: t('you.plan.free'), detail: t('usage.freeLine', { questions: LIMITS.freeQuestions }) };
    case 'beta':
      return { title: t('you.plan.beta'), detail: t('you.plan.betaLine', { checks: LIMITS.betaChecks, questions: LIMITS.betaQuestions }) };
    case 'trial':
      return { title: t('you.plan.trial'), detail: t('usage.trialEnds', { date: longDate(p.endsAtMs, zone) }) };
    case 'pro': {
      const title = p.period ? t('usage.proPeriod', { period: t(p.period === 'yearly' ? 'usage.yearly' : 'usage.monthly') }) : t('you.plan.pro');
      const detail = p.renewsAtMs !== null ? t('usage.renews', { date: longDate(p.renewsAtMs, zone) }) : t('you.plan.proLine');
      return { title, detail };
    }
  }
}

/** Settings' Plan & usage row value: "Free plan" / "Kitted beta" / "Kitted Pro" / "Pro trial". */
export const planShortName = (p: PlanInfo): string =>
  t(p.kind === 'free' ? 'you.plan.free' : p.kind === 'beta' ? 'you.plan.beta' : p.kind === 'trial' ? 'you.plan.trial' : 'you.plan.pro');

export interface UsageLine {
  key: 'checks' | 'recheck' | 'questions';
  label: string;
  value: string;
  /** What VoiceOver reads for the whole row. */
  spoken: string;
}

/**
 * The Today list. `rechecksUsed`: re-checks counted today (usage table). The re-check comes with today's check:
 * "1 left" while it can still be used (or before the first check), "Used" once used, "Closed" when its window
 * passed unused.
 */
export function usageLines(s: Pick<QuotaSnapshot, 'checksUsed' | 'checkLimit' | 'questionsUsed' | 'questionLimit' | 'recheckOpen'>, rechecksUsed: number): UsageLine[] {
  const checks = t('usage.of', { used: Math.min(s.checksUsed, s.checkLimit), limit: s.checkLimit });
  const questions = t('usage.of', { used: Math.min(s.questionsUsed, s.questionLimit), limit: s.questionLimit });
  const recheck = s.recheckOpen || (rechecksUsed === 0 && s.checksUsed === 0)
    ? t('usage.recheckLeft')
    : rechecksUsed > 0
      ? t('usage.used')
      : t('usage.recheckClosed');
  const ofSpoken = (used: number, limit: number) => t('usage.a11y.of', { used: Math.min(used, limit), limit });
  return [
    { key: 'checks', label: t('usage.checks'), value: checks, spoken: t('settings.a11y.value', { label: t('usage.checks'), value: ofSpoken(s.checksUsed, s.checkLimit) }) },
    { key: 'recheck', label: t('usage.recheck'), value: recheck, spoken: t('settings.a11y.value', { label: t('usage.recheck'), value: recheck }) },
    { key: 'questions', label: t('usage.questions'), value: questions, spoken: t('settings.a11y.value', { label: t('usage.questions'), value: ofSpoken(s.questionsUsed, s.questionLimit) }) },
  ];
}

export type RestoreResult = 'restored' | 'none' | 'failed';

/** Restore purchases. P6: RevenueCat's restorePurchases() behind the same result. Today: the demo entitlement. */
export async function restorePurchases(isPro: () => boolean): Promise<RestoreResult> {
  try {
    return isPro() ? 'restored' : 'none';
  } catch {
    return 'failed';
  }
}

export const restoreToast = (r: RestoreResult): string =>
  t(r === 'restored' ? 'settings.restore.done' : r === 'none' ? 'settings.restore.none' : 'settings.restore.failed');

/** The scoring rules' version new checks use: the parts engine's "1.8.0", or rubric v4's. */
export function scoringVersion(engine: 'parts' | 'v4' = scoringEngine()): string {
  return engine === 'parts' ? PARTS_RUBRIC_VERSION.replace(/^parts-/, '') : RUBRIC_DATA.version;
}

export interface AppVersion {
  version: string;
  build: string;
}

/** From app.config.ts (version, ios.buildNumber) via expo-constants. */
export function appVersion(): AppVersion {
  const cfg = Constants.expoConfig;
  return { version: cfg?.version ?? '0.0.0', build: cfg?.ios?.buildNumber ?? '0' };
}

/** "Kitted 0.1.0 (1) · Scoring v1.8.0" */
export function versionLine(v: AppVersion = appVersion(), scoring: string = scoringVersion()): string {
  return t('settings.versionLine', { version: v.version, build: v.build, n: scoring });
}
