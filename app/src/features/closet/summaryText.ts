// What a check says about the closet (the card's row and S11), from fit_checks.details.closetSummary (#91):
// "Added 3 to Closet · 1 question", "2 already in your closet", or "Checking the details…" while the closet
// call is out (at most 12 s; then the closet is written from the v3 fields anyway). Pure.
import type { ClosetAsk, ClosetSummary } from '@/data/types';
import { t } from '@/i18n/en';
import { CLOSET_DEADLINE_MS } from './service';

/** Still waiting on the closet call (a pending row older than the deadline isn't: it falls back). */
export function isPending(cs: ClosetSummary | undefined, now: number, deadlineMs = CLOSET_DEADLINE_MS): boolean {
  return cs?.state === 'pending' && now - (cs.startedAt ?? 0) < deadlineMs;
}

/** Questions still waiting on him (not answered, the new piece not undone). */
export function openAsks(cs: ClosetSummary | undefined): ClosetAsk[] {
  return (cs?.asks ?? []).filter((a) => !a.answer && !(cs?.undone ?? []).includes(a.itemId));
}

export function addedIds(cs: ClosetSummary | undefined): string[] {
  return (cs?.added ?? []).filter((id) => !(cs?.undone ?? []).includes(id));
}

export interface SummaryLine {
  text: string;
  pending: boolean;
  /** Pieces the thumbs show (added, else matched). */
  itemIds: string[];
}

export function closetSummaryText(cs: ClosetSummary | undefined, now: number): SummaryLine | null {
  if (!cs) return null;
  if (isPending(cs, now)) return { text: t('closet.summary.pending'), pending: true, itemIds: [] };
  const added = addedIds(cs);
  const asks = openAsks(cs).length;
  const q = asks === 1 ? t('closet.summary.oneQuestion') : asks > 1 ? t('closet.summary.questions', { n: asks }) : null;
  if (added.length > 0) return { text: [t('card.added', { n: added.length }), q].filter(Boolean).join(' · '), pending: false, itemIds: added };
  const matched = [...new Set(cs.matched)];
  if (matched.length > 0) return { text: [t('closet.summary.inCloset', { n: matched.length }), q].filter(Boolean).join(' · '), pending: false, itemIds: matched };
  return null;
}
