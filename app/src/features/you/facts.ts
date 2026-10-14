// "What your stylist knows" (02 D17, Y3; revised #246): the facts he can see, edit and delete, in the second
// person ("You wear tees untucked"). A guess is asked, never stated: Yes makes it something he told me, Not really
// forgets it. Deleting is soft (`isDeleted`): the row stays as a tombstone so it's never learned again, and Undo
// brings it back. Pure apart from the toast helper; the store is passed in so tests use the memory store.
import { localParts, type ZoneOffset } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { FactRow } from '@/data/types';
import { longDate } from '@/i18n/format';
import { t } from '@/i18n/en';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';

/** Y1 shows the 4 most recent; "See all" opens Y3. */
export const FACTS_ON_YOU = 4;
/** What he can type into one fact. */
export const FACT_MAX_CHARS = 120;

/** The facts still in use, newest first (ties by id, so the order never jumps). */
export function liveFacts(rows: readonly FactRow[]): FactRow[] {
  return rows.filter((f) => !f.isDeleted).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
}

/** "Oct 12" (no Intl: Hermes on iOS lacks parts of it). */
export function shortDate(ms: number, zone: ZoneOffset): string {
  const p = localParts(ms, zone);
  return t('fmt.longDate', { month: t('fmt.months').split(',')[p.m - 1] ?? '', day: p.d });
}

/** The line under a fact: "You told me · Oct 12", "From a fit check · Oct 8", "My guess from your fits". */
export function sourceLine(f: Pick<FactRow, 'source' | 'createdAt'>, zone: ZoneOffset): string {
  if (f.source === 'guess') return t('you.guess.source');
  const date = shortDate(f.createdAt, zone);
  return f.source === 'fitCheck' ? t('fact.source.fitCheck', { date }) : t('fact.source.told', { date });
}

/** A guess asked as a question. Guesses are stored in the second person ("You like muted colors…"), so
 *  "You " becomes "Do you …?"; anything else is asked as written ("Boldness: a little?"). */
export function guessQuestion(value: string): string {
  const fact = value.trim().replace(/[.?!]+$/, '');
  const m = /^you (.+)$/i.exec(fact);
  return m ? t('you.guess.doYou', { rest: m[1]! }) : t('you.guess.q', { fact });
}

/** What a row shows as its title: the fact, or for a guess the question. */
export function factTitle(f: Pick<FactRow, 'source' | 'value'>): string {
  return f.source === 'guess' ? guessQuestion(f.value) : f.value;
}

/** VoiceOver: "You like straight-leg pants. From a fit check, October 12." */
export function factSpoken(f: Pick<FactRow, 'source' | 'createdAt' | 'value'>, zone: ZoneOffset): string {
  if (f.source === 'guess') return t('you.a11y.guessQ', { question: guessQuestion(f.value) });
  const date = longDate(f.createdAt, zone);
  const source = f.source === 'fitCheck' ? t('you.a11y.fromCheck', { date }) : t('you.a11y.told', { date });
  return t('you.a11y.fact', { fact: f.value.trim().replace(/[.]+$/, ''), source });
}

/** "Yes" / "That's right": the guess becomes something he told me, dated now. */
export async function confirmGuess(store: KittedStore, id: string, nowMs: number): Promise<FactRow | null> {
  const f = await store.facts.get(id);
  if (!f || f.isDeleted || f.source !== 'guess') return f;
  return store.facts.patch(id, { source: 'told', createdAt: nowMs });
}

/** "Not really", Delete, a swipe: soft delete. Returns the row as it was, for Undo. */
export async function forgetFact(store: KittedStore, id: string): Promise<FactRow | null> {
  const f = await store.facts.get(id);
  if (!f || f.isDeleted) return null;
  await store.facts.patch(id, { isDeleted: true });
  return f;
}

/** Undo: the fact exactly as it was before the delete. */
export async function restoreFact(store: KittedStore, before: FactRow): Promise<void> {
  await store.facts.put({ ...before, isDeleted: false });
}

/** His own words for a fact (Edit, Change it): trimmed and capped; empty keeps the old text. It's now something he
 *  told me, dated now. */
export async function editFact(store: KittedStore, id: string, typed: string, nowMs: number): Promise<FactRow | null> {
  const text = typed.replace(/\s+/g, ' ').trim().slice(0, FACT_MAX_CHARS);
  const f = await store.facts.get(id);
  if (!f || f.isDeleted || !text) return f;
  if (text === f.value && f.source !== 'guess') return f;
  return store.facts.patch(id, { value: text, source: 'told', createdAt: nowMs });
}

/** Delete with the "Forgot it." toast and its Undo (Y3). */
export async function forgetWithUndo(store: KittedStore, id: string): Promise<void> {
  const before = await forgetFact(store, id);
  if (before) showToast(t('toast.forgot'), () => restoreFact(store, before), { ms: TOAST_MS_REMOVAL });
}
