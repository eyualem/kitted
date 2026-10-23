// What You's Today card offers (#369): a check while one is left, else the open re-check of today's check, else
// nothing (the card says "next at 4 am").
import type { QuotaSnapshot } from '@/services/quota';

export type TodayAction = { kind: 'check' } | { kind: 'recheck'; checkId: string } | null;

export function todayAction(s: Pick<QuotaSnapshot, 'checksUsed' | 'checkLimit' | 'recheckId'>): TodayAction {
  if (s.checksUsed < s.checkLimit) return { kind: 'check' };
  return s.recheckId ? { kind: 'recheck', checkId: s.recheckId } : null;
}
