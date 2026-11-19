// The second look in a fit check (#199): the card never waits long for it, and once stored it is the check's for good.
// Pure apart from the scheduler: the service starts the calls next to the read (ReadingSource.secondLook), then
// settleSecondLook gives each arm (U, L, and W, the leg width, for pants) until the reading is in plus a 1.5 s grace. An arm that is back by then is stored
// with the check; one that is late or failed is left out (that arm scores as if it never ran), and the check never
// fails, waits longer or costs anything because of it.
import type { SecondLookInput } from '@kitted/core';
import type { LookAnswerL, LookAnswerU, LookAnswerW, LookArm, StoredSecondLook } from '@/data/types';
import type { LookResult, SecondLookCall } from '@/services/readingSource/types';
import type { Scheduler } from '@/services/scheduler';
import { legOf, LOOK_VERSION, peekOf, restsOf } from '@/services/readingSource/secondLook';

/** How long after the reading is in the card waits for the second look (the founder's brief, Oct 13). */
export const LOOK_GRACE_MS = 1_500;

export interface SettledLook {
  /** What the check stores: null when no arm answered in time. */
  look: StoredSecondLook | null;
  late: LookArm[];
  failed: LookArm[];
}

const failedResult = { ok: false as const, fail: 'ai' as const, ms: 0 };

/** Waits for the arms, but no longer than `graceMs` from now (the reading is already in). Never rejects. `w`: the
 *  leg-width look, when the service started it (pants); it gets the same grace, and late or failed means `w: null`. */
export async function settleSecondLook(
  call: SecondLookCall | null, graceMs: number, scheduler: Scheduler, w?: Promise<LookResult<LookAnswerW>> | null,
): Promise<SettledLook> {
  let handle: unknown = null;
  const LATE = Symbol('late');
  const grace = new Promise<typeof LATE>((resolve) => {
    handle = scheduler.setTimer(() => resolve(LATE), Math.max(0, graceMs));
  });
  const safe = <A>(p: Promise<LookResult<A>> | undefined): Promise<LookResult<A>> =>
    Promise.resolve(p ?? failedResult).catch(() => failedResult);
  try {
    const [u, l, wr] = await Promise.all([
      call ? Promise.race([safe(call.u), grace]) : Promise.resolve(null), call ? Promise.race([safe(call.l), grace]) : Promise.resolve(null),
      w ? Promise.race([safe(w), grace]) : Promise.resolve(null),
    ]);
    const late: LookArm[] = [];
    const failed: LookArm[] = [];
    const take = <A>(arm: LookArm, r: LookResult<A> | typeof LATE | null): A | null => {
      if (r === null) return null;
      if (r === LATE) late.push(arm);
      else if (!r.ok) failed.push(arm);
      else return r.answer;
      return null;
    };
    const ua = take<LookAnswerU>('U', u as LookResult<LookAnswerU> | typeof LATE | null);
    const la = take<LookAnswerL>('L', l as LookResult<LookAnswerL> | typeof LATE | null);
    const wa = take<LookAnswerW>('W', wr as LookResult<LookAnswerW> | typeof LATE | null);
    return { look: ua || la || wa ? { version: LOOK_VERSION, u: ua, l: la, ...(w ? { w: wa } : {}) } : null, late, failed };
  } catch {
    return { look: null, late: [], failed: ['U', 'L'] };
  } finally {
    if (handle !== null) scheduler.clearTimer(handle);
  }
}

/** The engine's input from a stored look (the raw answers, read by core exactly like parts_proto._second_look):
 *  only the arms that answered. null = score without. */
export function lookInput(sl: StoredSecondLook | null | undefined): SecondLookInput | null {
  if (!hasLook(sl)) return null;
  return {
    ...(sl.u ? { under_present: sl.u.under_present, under_shows: sl.u.under_shows } : {}),
    ...(sl.l ? { covers_shoe: sl.l.covers_shoe } : {}),
    ...(sl.w ? { knee: sl.w.knee, opening: sl.w.opening } : {}),
  };
}

/** Does this stored look have any arm? (A re-check only asks for the arms its first check has.) */
export const hasLook = (sl: StoredSecondLook | null | undefined): sl is StoredSecondLook => !!sl && (!!sl.u || !!sl.l || !!sl.w);

/** A re-check is scored like its first check, so the two numbers compare: it uses an arm only if the first check had
 *  it, from the re-check photo when that arm came back in time, else the first check's answer (anchored, like the
 *  reading's merge). A first check without a second look gives a re-check without one. */
export function anchorRecheckLook(own: StoredSecondLook | null, parent: StoredSecondLook | null | undefined, parentId: string): StoredSecondLook | null {
  if (!hasLook(parent)) return null;
  const carried: LookArm[] = [];
  const u = parent.u ? own?.u ?? (carried.push('U'), parent.u) : null;
  const l = parent.l ? own?.l ?? (carried.push('L'), parent.l) : null;
  const w = parent.w ? own?.w ?? (carried.push('W'), parent.w) : null;
  return { version: own?.version ?? parent.version, u, l, ...(parent.w ? { w } : {}), ...(carried.length ? { copied: { from: parentId, why: 'firstCheck' as const, arms: carried } } : {}) };
}

/** The look a same-photo check takes from the earlier check of that photo (undefined there = none here). */
export function copiedLook(from: { id: string; details: { secondLook?: StoredSecondLook | null } }): StoredSecondLook | null | undefined {
  const sl = from.details.secondLook;
  if (sl === undefined) return undefined;
  if (!hasLook(sl)) return null;
  return { ...sl, copied: { from: from.id, why: 'samePhoto', arms: [...(sl.u ? ['U' as const] : []), ...(sl.l ? ['L' as const] : []), ...(sl.w ? ['W' as const] : [])] } };
}

/** The look a new check takes from a re-check of the same photo (#342): only the arms read from that photo, never the
 *  ones it carried from its first check's photo (undefined there = none here). */
export function ownLookOf(from: { id: string; details: { secondLook?: StoredSecondLook | null } }): StoredSecondLook | null | undefined {
  const sl = from.details.secondLook;
  if (sl === undefined) return undefined;
  const carried = sl?.copied?.why === 'firstCheck' ? sl.copied.arms : [];
  const u = sl?.u && !carried.includes('U') ? sl.u : null;
  const l = sl?.l && !carried.includes('L') ? sl.l : null;
  const w = sl?.w && !carried.includes('W') ? sl.w : null;
  if (!sl || (!u && !l && !w)) return null;
  return { version: sl.version, u, l, ...(w ? { w } : {}), copied: { from: from.id, why: 'samePhoto', arms: [...(u ? ['U' as const] : []), ...(l ? ['L' as const] : []), ...(w ? ['W' as const] : [])] } };
}

const yn = (b: boolean | null) => (b === null ? 'unknown' : b ? 'yes' : 'no');

/** The service's line once the card is scored: "[look] scored with U, L · peek yes · rests no" or "[look] late, scored
 *  without" (each call's own line, with its ms and cost, is printed by the source). */
export function settledLine(s: SettledLook): string {
  const used = [s.look?.u ? 'U' : null, s.look?.l ? 'L' : null, s.look?.w ? 'W' : null].filter(Boolean).join(', ');
  const late = s.late.length ? `${s.late.join(', ')} late` : '';
  const failed = s.failed.length ? `${s.failed.join(', ')} failed` : '';
  if (!s.look) return `[look] ${[late, failed].filter(Boolean).join(', ') || 'none'}, scored without`;
  const parts = [`scored with ${used}`];
  if (s.look.u) parts.push(`peek ${yn(peekOf(s.look.u))}`);
  if (s.look.l) parts.push(`rests ${yn(restsOf(s.look.l))}`);
  if (s.look.w) parts.push(`leg ${legOf(s.look.w)}`);
  if (late || failed) parts.push(`${[late, failed].filter(Boolean).join(', ')}, scored without it`);
  return `[look] ${parts.join(' · ')}`;
}
