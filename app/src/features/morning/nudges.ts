// The daily nudge's pure rules (specs/notifications.md NT2–NT4): when the 7 nudges land, which line each day gets, the
// answered lines on Kit's cards, and what You → Notifications' switches show. No store, no clock: the nudge service
// (nudgeService.ts) and the cards call these.
import { localParts, wallToUtc, type ZoneOffset } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { ideaTimeLabel, parseIdeaSwitch, parseReadySwitch } from '@/features/settings/prefs';
import { t } from '@/i18n/en';
import type { NotifyPermission } from '@/services/notifications';

/** Seven days ahead, replaced on every open, return and leave. */
export const NUDGE_DAYS = 7;
/** The nudge lands this long before he gets dressed. */
export const NUDGE_LEAD_MIN = 15;

/** The nudge service's own keys (local to this lane; "Delete all my data" clears every kv). */
export const NOTIFY_KV = {
  /** The id of Kit's ask message, by any route (setup, catch-up, T57's Later). */
  asked: 'notify.asked',
  /** ms of the last scheduled nudge; unset when nothing is scheduled. */
  through: 'notify.through',
  /** '1' while the comeback question is unanswered. */
  paused: 'notify.paused',
  /** The `through` of the lapse the comeback was posted for. */
  comebackFor: 'notify.comebackFor',
  /** ms of the scheduled "big enough" nudge. */
  bigEnoughAt: 'notify.bigEnoughAt',
  /** '1' once it was delivered. */
  bigEnoughDone: 'notify.bigEnoughDone',
} as const;

/** NT2.6 (the founder, Nov 10): the "big enough" line comes only after a "Check today's fit." nudge was delivered.
 *  The first check nudge in the schedule, and whether one ever went out, kept beside NOTIFY_KV. */
export const CHECK_NUDGE_KV = {
  /** ms of the first scheduled "Check today's fit." nudge; unset when none is scheduled. */
  checkAt: 'notify.checkAt',
  /** '1' once one was delivered. */
  checkDone: 'notify.checkDone',
} as const;

/** Every key above: all under `notify.`, which sync keeps on this phone (sync/schema.ts KV_LOCAL_PREFIXES). */
export type NotifyKey = (typeof NOTIFY_KV)[keyof typeof NOTIFY_KV] | (typeof CHECK_NUDGE_KV)[keyof typeof CHECK_NUDGE_KV];

/** Writes one of the keys above. */
export function setNotifyKv(store: Pick<KittedStore, 'setKv'>, k: NotifyKey, value: string): Promise<void> {
  return store.setKv(k, value);
}

const DAY_MIN = 24 * 60;
const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
const minutes = (hhmm: string): number => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 8 * 60;
};

/** His get-dressed time minus 15 minutes: '08:00' → '07:45'. */
export function nudgeHHMM(ideaTime: string): string {
  const m = (minutes(ideaTime) - NUDGE_LEAD_MIN + DAY_MIN) % DAY_MIN;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** '08:00' → '7:45 am'. */
export function nudgeLabel(ideaTime: string): string {
  return ideaTimeLabel(nudgeHHMM(ideaTime));
}

/** The nudge instant on the local calendar date `y-m-d` (+ `plusDays`), at its wall time in `zone`. */
function nudgeOn(y: number, m: number, d: number, plusDays: number, ideaTime: string, zone: ZoneOffset): number {
  const wall = Date.UTC(y, m - 1, d + plusDays) + minutes(nudgeHHMM(ideaTime)) * 60_000;
  return wallToUtc(wall, zone);
}

/** The next 7 nudge instants: one per local calendar date, each at the nudge time in `zone`, the first strictly after
 *  `nowMs`. Wall time stays put across a DST change. */
export function nudgeTimes(nowMs: number, ideaTime: string, zone: ZoneOffset): number[] {
  const p = localParts(nowMs, zone);
  const first = nudgeOn(p.y, p.m, p.d, 0, ideaTime, zone) > nowMs ? 0 : 1;
  return Array.from({ length: NUDGE_DAYS }, (_, i) => nudgeOn(p.y, p.m, p.d, first + i, ideaTime, zone));
}

/** Today's nudge (the local calendar date, not the 4 am day key) is still ahead. */
export function landsToday(nowMs: number, ideaTime: string, zone: ZoneOffset): boolean {
  const p = localParts(nowMs, zone);
  return nudgeOn(p.y, p.m, p.d, 0, ideaTime, zone) > nowMs;
}

export type NudgeLine = 'check' | 'bigEnough' | 'idea';

/** Per day: 'check' while it can't suggest; the first day it can, 'bigEnough' unless `bigEnoughDone`; then 'idea'.
 *  `checkBefore` (default true): a "Check today's fit." nudge was delivered before this list. When false, only a check
 *  day earlier in this same list earns the big-enough line (someone who could suggest when he said yes never gets it). */
export function nudgeLines(canSuggest: readonly boolean[], bigEnoughDone: boolean, checkBefore = true): NudgeLine[] {
  let done = bigEnoughDone;
  let seenCheck = checkBefore;
  return canSuggest.map((can) => {
    if (!can) {
      seenCheck = true;
      return 'check';
    }
    if (!done && seenCheck) {
      done = true;
      return 'bigEnough';
    }
    return 'idea';
  });
}

const LINE_KEY = { check: 'push.nudge.check', bigEnough: 'push.nudge.bigEnough', idea: 'push.nudge.idea' } as const;

export function nudgeBody(line: NudgeLine): string {
  return t(LINE_KEY[line]);
}

/** Fit check ready: 2 → "…2 quick fixes inside.", 1 → "…1 quick fix inside.", 0 → "Your fit check is ready." Never the score. */
export function readyBody(fixCount: number): string {
  return fixCount > 0 ? t('push.ready', { n: fixCount }) : t('push.ready.none');
}

/** Kit's ask, allowed: "Done. Your first idea lands today / tomorrow at 7:45 am." (the nudge time, not his time). */
export function askDoneLine(when: 'today' | 'tomorrow', ideaTime: string): string {
  return t(when === 'today' ? 'notif.ask.doneToday' : 'notif.ask.done', { time: nudgeLabel(ideaTime) });
}

/** The comeback, back on: "Back on. Next one lands today / tomorrow at 7:45 am." */
export function backOnLine(when: 'today' | 'tomorrow', ideaTime: string): string {
  return t(when === 'today' ? 'comeback.backToday' : 'comeback.back', { time: nudgeLabel(ideaTime) });
}

export interface SwitchView {
  idea: boolean;
  timeRow: boolean;
  ready: boolean;
  offCard: boolean;
  greyed: boolean;
}

/** You → Notifications (DESIGN "What the switches show"). With iOS off for Kitted: the off card, and both switches
 *  greyed at their saved values. Otherwise the daily idea is on only when saved on, allowed and not paused; Fit check
 *  ready is on when allowed and not saved off. */
export function switchesShown(i: { ideaKv: string | null; readyKv: string | null; permission: NotifyPermission; paused: boolean }): SwitchView {
  if (i.permission === 'denied') {
    const idea = parseIdeaSwitch(i.ideaKv);
    return { idea, timeRow: idea, ready: parseReadySwitch(i.readyKv), offCard: true, greyed: true };
  }
  const idea = i.ideaKv === '1' && i.permission === 'granted' && !i.paused;
  return { idea, timeRow: idea, ready: i.permission === 'granted' && i.readyKv !== '0', offCard: false, greyed: false };
}
