// The score reveal and the re-check win (DECISIONS-LOG #242 "Signature moments", overridden by #246 point 16;
// mockups/theme-round2.html → "The share card and the score reveal"). This file is the logic: which version plays,
// the tape's values, the timelines, and the once-per-check bookkeeping. The drawing is ScoreReveal.tsx.
//
// - Once per check: a reveal plays only for a check that finished reading while this app run watched it (its card
//   showed the reading or the one quick tap), never one already revealed (details.revealedAt, kept on the row so no
//   migration). So scroll-back, a relaunch, Past chats and a re-score after an occasion change never replay it.
// - The full tape plays for his first FULL_SHOWS checks (KV `reveal.fullShown`) and every re-check win; after that a
//   0.5 s lock. Below 6.0: no tape, no haptic, the score and its fix land together in one fade. Reduce Motion: a
//   200 ms cross-fade, haptic kept. VoiceOver: the final state at once and one announcement.
//
// Demo / recording (launch arguments, read through demo/demoArgs.ts):
//   -demoReveal 1      demo screens 7 (the first result), 10 (the re-check), 11 (the partial check) and 12 (the seeded re-check win) play their
//                      reveal from fresh (nothing revealed, the full-show counter at 0), so the founder can record
//                      clean takes. Without it, demo screens open on the final card (screenshots stay stable).
//   -demoRevealSlow 4  every reveal timing × 4 (1–10), for checking it frame by frame.
//   e.g. xcrun simctl launch <udid> com.trykitted.kitted -demoScreen 7 -demoReveal 1 -demoRevealSlow 4
import { AccessibilityInfo } from 'react-native';
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';
import { roundedToHalf } from '@/design-system/score';
import { serial } from '@/features/closet/checkWrites';
import { getDemoArgs } from '@/state/session';
import { STORY_FIRST_CHECK, STORY_PARTIAL, STORY_RECHECK } from '@/demo/scenarios';

/** How many new checks get the full tape before it shortens to the 0.5 s lock. */
export const FULL_SHOWS = 5;
/** Below this the score lands quietly with its fix (no tape, no haptic). */
export const QUIET_BELOW = 6;

export type RevealMode = 'none' | 'full' | 'short' | 'quiet' | 'reduced' | 'voiceOver';
export type WinMode = 'none' | 'win' | 'reduced' | 'voiceOver';

export interface RevealContext {
  /** The check finished reading while this run watched it (and isn't a demo screen's prepared story). */
  eligible: boolean;
  revealedAt?: number | null;
  reduceMotion: boolean;
  voiceOver: boolean;
  /** Full shows so far (KV). */
  fullShown: number;
}

/** A new check's reveal. 'none' = the final card, nothing plays, no haptic, no announcement. */
export function revealMode(score: number, c: RevealContext): RevealMode {
  if (!c.eligible || c.revealedAt) return 'none';
  if (c.voiceOver) return 'voiceOver';
  if (roundedToHalf(score) < QUIET_BELOW) return 'quiet';
  if (c.reduceMotion) return 'reduced';
  return c.fullShown < FULL_SHOWS ? 'full' : 'short';
}

/** A re-check's reveal: only a higher score is a win; same or lower lands as the final card with no haptic. */
export function winMode(was: number, now: number, c: Omit<RevealContext, 'fullShown'>): WinMode {
  if (!c.eligible || c.revealedAt) return 'none';
  if (c.voiceOver) return 'voiceOver';
  if (!(roundedToHalf(now) > roundedToHalf(was))) return 'none';
  return c.reduceMotion ? 'reduced' : 'win';
}

/** The tape: half steps from `from` (default 2.0 below, never under 0) up to the score; always ends exactly on it. */
export function tapeValues(to: number, from?: number): number[] {
  const end = Math.round(roundedToHalf(to) * 2);
  const start = Math.max(0, Math.min(end, Math.round(roundedToHalf(from ?? to - 2) * 2)));
  const out: number[] = [];
  for (let h = start; h <= end; h++) out.push(h / 2);
  return out;
}

/** One element's window on the timeline (ms from the start, before the slow factor). `rise` in pt. */
export interface Step {
  at: number;
  ms: number;
  rise?: number;
}

export interface CheckPlan {
  /** "–.–" → the numeral without a tape (short, reduced, quiet). */
  swap: Step | null;
  /** The tape slides (full only). */
  tape: Step | null;
  /** Lock: the numeral turns ink, "/10" comes in; the haptic (if any) and the announcement fire here. */
  lock: Step;
  haptic: boolean;
  /** "–.–" hidden from the start (quiet: the score and its fix appear together). */
  blankStart: boolean;
  word: Step;
  summary: Step;
  fixes: Step[];
  /** The first fix's copper "→ x.x". */
  gain: Step;
  total: number;
}

export function checkPlan(mode: Exclude<RevealMode, 'none' | 'voiceOver'>, fixCount: number): CheckPlan {
  const n = Math.max(0, fixCount);
  if (mode === 'quiet') {
    const all: Step = { at: 0, ms: 200 };
    return { swap: all, tape: null, lock: all, haptic: false, blankStart: true, word: all, summary: all, fixes: Array.from({ length: n }, () => all), gain: all, total: 200 };
  }
  if (mode === 'reduced') {
    const later: Step = { at: 350, ms: 200 };
    return {
      swap: { at: 0, ms: 200 }, tape: null, lock: { at: 200, ms: 0 }, haptic: true, blankStart: false,
      word: later, summary: later, fixes: Array.from({ length: n }, () => later), gain: later, total: 550,
    };
  }
  const full = mode === 'full';
  const lockAt = full ? 900 : 350;
  const wordAt = full ? 1020 : 350;
  const summaryAt = wordAt + 80;
  const fixAt = summaryAt + 80;
  const fixes = Array.from({ length: n }, (_, i) => ({ at: fixAt + 60 * i, ms: 200, rise: 4 }));
  const gainAt = n > 0 ? fixes[n - 1]!.at + 200 : summaryAt + 220;
  return {
    swap: full ? null : { at: 200, ms: 150 },
    tape: full ? { at: 400, ms: 500 } : null,
    lock: { at: lockAt, ms: full ? 120 : 0 },
    haptic: true,
    blankStart: false,
    word: { at: wordAt, ms: 220, rise: 6 },
    summary: { at: summaryAt, ms: 220, rise: 6 },
    fixes,
    gain: { at: gainAt, ms: 160 },
    total: gainAt + 160,
  };
}

export interface WinPlan {
  /** The old score shrinks from the full numeral size to its final 44 pt and fades to ink3. */
  shrink: Step | null;
  /** The old score's strike bar. */
  strike: Step;
  arrow: Step & { dx: number };
  tape: Step | null;
  /** The new score without a tape (reduced). */
  swap: Step | null;
  lock: Step;
  /** The copper "+1.0" pill springs from 0.6 to 1 (reduced: fades). */
  pillSpring: boolean;
  badge: Step;
  /** The summary line with the new word rises in. */
  word: Step;
  total: number;
}

export function winPlan(mode: Exclude<WinMode, 'none' | 'voiceOver'>): WinPlan {
  if (mode === 'reduced') {
    const first: Step = { at: 0, ms: 200 };
    return {
      shrink: null, strike: { at: 0, ms: 0 }, arrow: { ...first, dx: 0 }, tape: null, swap: first, lock: { at: 200, ms: 0 }, pillSpring: false,
      badge: first, word: { at: 350, ms: 200 }, total: 550,
    };
  }
  return {
    shrink: { at: 300, ms: 320 },
    strike: { at: 620, ms: 100 },
    arrow: { at: 700, ms: 160, dx: -8 },
    tape: { at: 800, ms: 600 },
    swap: null,
    lock: { at: 1400, ms: 120 },
    pillSpring: true,
    badge: { at: 1500, ms: 250 },
    word: { at: 1750, ms: 220, rise: 6 },
    total: 1970,
  };
}

/** -demoRevealSlow: every timing × this (1 normally). */
export function revealSlow(): number {
  const s = getDemoArgs().revealSlow;
  return s >= 1 ? s : 1;
}

// --- Once per check -------------------------------------------------------------------------------------------

/** Checks whose card showed the reading or the quick tap in this run (so the result is new to him). */
const live = new Set<string>();
/** Checks revealed (or skipped past) in this run: never again, even if a later write drops revealedAt. */
const revealedThisRun = new Set<string>();
let preparingDemo = false;

/** The card showed this check still reading (or asking): its result will be new. Ignored while a demo screen's story
 *  is being played at latency 0 (those open on the final card unless -demoReveal arms them). */
export function noteLive(checkId: string): void {
  // Demo stories' checks ('story-…', demo/scenarios.ts) are armed only by armDemoReveal: a late render of their
  // reading card must not make a prepared screen replay.
  if (preparingDemo || checkId.startsWith(DEMO_STORY_PREFIX)) return;
  live.add(checkId);
}

const DEMO_STORY_PREFIX = 'story-';

export function isRevealEligible(checkId: string, revealedAt?: number | null): boolean {
  return live.has(checkId) && !revealedThisRun.has(checkId) && !revealedAt;
}

/** Mark it played (in memory now; on the row and the counter through `persistRevealed`). */
export function noteRevealed(checkId: string): void {
  revealedThisRun.add(checkId);
}

export const REVEAL_KV = KV.revealFullShown;

export async function fullShownCount(store: KittedStore): Promise<number> {
  const v = Number(await store.getKv(REVEAL_KV));
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/**
 * Writes details.revealedAt on the row (once; in the closet write queue so it never rebuilds the row from an old copy)
 * and, for a full show, adds one to the counter. Returns whether this call was the one that marked it.
 */
export function persistRevealed(store: KittedStore, checkId: string, nowMs: number, countsAsFull: boolean): Promise<boolean> {
  return serial(async () => {
    const cur = await store.fitChecks.get(checkId);
    if (!cur || cur.details.revealedAt) return false;
    await store.fitChecks.patch(checkId, { details: { ...cur.details, revealedAt: nowMs } });
    if (countsAsFull) await store.setKv(REVEAL_KV, String((await fullShownCount(store)) + 1));
    return true;
  });
}

// --- Demo screens -----------------------------------------------------------------------------------------------

/** The demo screens -demoReveal resets, and the check each one reveals. */
// 12: the seeded 8.0 → 9.0 re-check (FC3R in the full scenario), the only demo re-check that rises under today's
// scoring (screen 10's story re-check reads "change not seen").
export const DEMO_REVEAL_SCREENS: Readonly<Record<number, string>> = { 7: STORY_FIRST_CHECK, 10: STORY_RECHECK, 11: STORY_PARTIAL, 12: 'FC3R' };

export function setDemoPreparing(on: boolean): void {
  preparingDemo = on;
}

/** After a demo screen's story ran: with -demoReveal, its check plays from fresh (the counter reset too). */
export async function armDemoReveal(store: KittedStore, screen: number, on: boolean): Promise<void> {
  live.clear();
  revealedThisRun.clear();
  if (!on) return;
  const id = DEMO_REVEAL_SCREENS[screen];
  if (!id) return;
  await store.deleteKv(REVEAL_KV);
  live.add(id);
}

/** For tests. */
export function resetRevealRun(): void {
  live.clear();
  revealedThisRun.clear();
  preparingDemo = false;
}

// --- VoiceOver ----------------------------------------------------------------------------------------------------

let screenReader = false;
let watching = false;

/** Starts following VoiceOver once (the reveal waits ≥ 300 ms before it asks, so the first answer is in by then). */
export function watchScreenReader(): void {
  if (watching) return;
  watching = true;
  AccessibilityInfo.isScreenReaderEnabled?.().then((v) => { screenReader = v; }).catch(() => {});
  try {
    AccessibilityInfo.addEventListener?.('screenReaderChanged', (v: boolean) => { screenReader = v; });
  } catch {
    // web: not available
  }
}

export function screenReaderOn(): boolean {
  return screenReader;
}
