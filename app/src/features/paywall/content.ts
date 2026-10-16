// What the two paywall pages say (02 D18, P1b; 10-onboarding.md §9.4). Pure. The limits come from the quota's real
// numbers, never "unlimited"; the price and the trial come from the store's product, and the billed price is the
// biggest price on page 2 (App Review 3.1.2).
import { displayScore } from '@/design-system/score';
import type { FitCheckRow } from '@/data/types';
import { t } from '@/i18n/en';
import { LIMITS } from '@/services/quota';
import type { ProProduct } from '@/services/purchases';

export const paywallTitle = (): string => t('pay.title', { checks: LIMITS.proChecks });
export const paywallPerks = (): string[] => [t('pay.perk.checks', { n: LIMITS.proChecks }), t('pay.perk.questions', { n: LIMITS.proQuestions })];
export const plansReminder = (): string => t('pay.p2.reminder', { checks: LIMITS.proChecks, questions: LIMITS.proQuestions });

export interface TodayCard {
  title: string;
  detail: string | null;
  /** The check whose photo the card shows. */
  checkId: string;
}

type CardCheck = Pick<FitCheckRow, 'id' | 'score' | 'fixes' | 'status' | 'parentId' | 'dayKey' | 'details'>;

const unique = (fixes: FitCheckRow['fixes']) => fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i);

/**
 * D18's Today card: after a re-check `Today: 6.5 → 7.5` / `One free fix. Nothing new to buy.`; otherwise
 * `Today: 6.5` / `2 free fixes to 8.0.`; dialed in on the first check `Dialed in on your first check.`.
 * `check`: his latest full check (or the onboarding's first), `recheck`: its scored re-check. null when there's no
 * check from today (the card says "Today").
 */
export function todayCard(check: CardCheck | null, recheck: CardCheck | null, o: { todayKey: string; first: boolean }): TodayCard | null {
  if (!check || check.status !== 'scored' || check.score === null) return null;
  const re = recheck && recheck.status === 'scored' && recheck.score !== null ? recheck : null;
  if ((re ?? check).dayKey !== o.todayKey) return null;
  if (re) {
    const done = re.details.recheck?.doneFixes?.length ?? 0;
    const title = t('pay.today', { before: displayScore(check.score), after: displayScore(re.score!) });
    const detail = done === 1 ? t('pay.today.oneFix') : done > 1 ? t('pay.today.nFixes', { n: done }) : null;
    return { title, detail, checkId: re.id };
  }
  const title = t('pay.today.score', { score: displayScore(check.score) });
  const fixes = unique(check.fixes);
  const free = fixes.filter((f) => f.free);
  if (fixes.length === 0) return { title, detail: o.first && check.score >= 9 ? t('pay.today.dialed') : null, checkId: check.id };
  if (free.length === 0) return { title, detail: null, checkId: check.id };
  const target = Math.max(...free.map((f) => f.to));
  return { title, detail: t('pay.today.toTarget', { n: free.length, target: displayScore(target) }), checkId: check.id };
}

/** Page 2's plan card detail: "1 week free", or "No trial" when this Apple ID used it. */
export const planDetail = (p: ProProduct, trial: boolean): string => t(trial && p.trialDays > 0 ? 'pay.plan.monthlyDetail' : 'pay.plan.noTrial');
export const ctaTitle = (p: ProProduct, trial: boolean): string => (trial && p.trialDays > 0 ? t('pay.cta.trial') : t('pay.cta.monthly', { price: p.price }));
export const finePrint = (p: ProProduct, trial: boolean): string => t(trial && p.trialDays > 0 ? 'pay.fine.trial' : 'pay.fine.monthly', { price: p.price });
