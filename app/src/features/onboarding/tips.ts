// The feature guide (specs/setup-and-you.md SY2, SY3): Kit's hello at setup's end, then one short tip the first time he
// reaches his first score, Closet, Lookbook and You. A tip shows on every visit until Got it, then never again, unless
// "Show me around" (You → Help & about) brings them all back. The done marks live in kv on this iPhone only, so
// "Delete all my data" (store.wipe) clears them. Nothing shows before his first scored check (SY2.9).
import type { KittedStore } from '@/data/store';
import type { ChatMessage, FitCheckRow } from '@/data/types';
import { textMessage } from '@/data/seedLoader';

export type TabTip = 'closet' | 'lookbook' | 'you';
export type TipId = TabTip | 'firstScore';
export const TIP_IDS: readonly TipId[] = ['firstScore', 'closet', 'lookbook', 'you'];

export const tipKey = (id: TipId): string => `tip.${id}.done`;
/** When "Show me around" was tapped: the first-score tip then waits for a check scored after it (SY3.3). */
export const FIRST_SCORE_AFTER_KEY = 'tip.firstScore.after';

type TipStore = Pick<KittedStore, 'getKv' | 'setKv' | 'deleteKv'>;

/** The checks a tip counts: scored, with a score. */
function scored(checks: readonly FitCheckRow[]): FitCheckRow[] {
  return checks.filter((c) => c.status === 'scored' && c.score !== null);
}

/** The check the first-score tip belongs under: the earliest scored first check (not a re-check) made at or after
 *  `afterMs` (0 before any "Show me around"). Null once that fit has been re-checked (SY2.2), or if there's none. */
export function firstScoreTipCheck(checks: readonly FitCheckRow[], afterMs: number): string | null {
  const all = scored(checks);
  const target = all.filter((c) => !c.parentId && c.createdAt >= afterMs).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0];
  if (!target) return null;
  const rechecked = target.recheckUsed || checks.some((c) => c.parentId === target.id);
  return rechecked ? null : target.id;
}

/** Whether a tab's tip shows: not done, his first check is scored, and (Closet, Lookbook) the tab isn't empty. */
export function tabTipShows(done: boolean, hasScoredCheck: boolean, tabHasContent: boolean): boolean {
  return !done && hasScoredCheck && tabHasContent;
}

export function hasScoredCheck(checks: readonly FitCheckRow[]): boolean {
  return scored(checks).length > 0;
}

export async function isTipDone(store: TipStore, id: TipId): Promise<boolean> {
  return (await store.getKv(tipKey(id))) === '1';
}

export async function dismissTip(store: TipStore, id: TipId): Promise<void> {
  await store.setKv(tipKey(id), '1');
}

export async function firstScoreAfter(store: TipStore): Promise<number> {
  const v = Number(await store.getKv(FIRST_SCORE_AFTER_KEY));
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** Kit's hello (SY2): an ordinary Kit message, drawn from its key so the words stay the approved ones. No text of its
 *  own, so a question's history never carries it (ask/context.ts reads only text). */
export function kitHello(id: string, createdAt: number): ChatMessage {
  return textMessage(id, createdAt, 'stylist', null, { kitHello: true });
}

export function isKitHello(m: Pick<ChatMessage, 'payload'>): boolean {
  return m.payload.kitHello === true;
}

/** "Show me around" (SY3): every tip back, the first-score tip moved to the next check, and Kit's hello posted as the
 *  newest message unless it already is (SY3.2). The caller switches to Stylist. */
export async function showMeAround(store: Pick<KittedStore, 'getKv' | 'setKv' | 'deleteKv' | 'chat'>, nowMs: number, ids: (p: string) => string): Promise<void> {
  for (const id of TIP_IDS) await store.deleteKv(tipKey(id));
  await store.setKv(FIRST_SCORE_AFTER_KEY, String(nowMs));
  const newest = (await store.chat.all()).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))[0];
  if (newest && isKitHello(newest)) return;
  // After the newest message even if the clock reads earlier (a demo clock), so it's always last.
  await store.chat.put(kitHello(ids('M'), Math.max(nowMs, (newest?.createdAt ?? 0) + 1)));
}
