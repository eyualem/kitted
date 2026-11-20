// T115b: a rule the score doesn't charge never shows as a cost. v16 drops two kinds of charge from the number: the
// "unsteady" rules (the reader isn't steady enough on them yet: pants piling on the shoes, long sleeves, ribbed cuffs, a
// roomy sleeve) and the waived ones (a rule his taste replaced: slides, runners, the narrow leg). Core still lists them
// in the part's reasons with their old minus ("pooling −1.5") because the engine's parts are the reading, not the bill.
// So what a person reads (Why's part rows and numbers, Kit's context, a re-check's "New: …") counts only the reasons the
// score took, and a part's number is rebuilt without the others. Display only: no score moves, core is untouched.
// A charge a dealbreaker owns (a clash, too many accents) stays: that cap is the cost, and Why names it in its own row.
import { PARTS_DATA, roundHalf, type PartName, type PartResult, type PartsV16 } from '@kitted/core';

/** The checks in this outfit that v16's score doesn't charge (empty on a check scored before v16). */
export function unchargedChecks(v16: Pick<PartsV16, 'owned' | 'caps'> | undefined): ReadonlySet<string> {
  const out = new Set<string>();
  if (!v16 || v16.owned.length === 0) return out;
  const owns = PARTS_DATA.v16?.owns ?? {};
  const byCap = new Set<string>();
  for (const c of v16.caps) if (c.kind !== 'clash') for (const x of owns[c.id] ?? []) byCap.add(x);
  for (const x of v16.owned) if (!byCap.has(x)) out.add(x);
  return out;
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;

/** One part without the charges the score didn't take: those reasons leave, and the number is rebuilt (as the engine
 *  clamps it, then rounded to the half). A part with nothing to drop comes back as it is. */
export function chargedPart(k: PartName, p: PartResult | undefined, uncharged: ReadonlySet<string>): PartResult | undefined {
  if (!p || p.score === null || uncharged.size === 0) return p;
  const dropped = p.reasons.filter((r) => r.points < 0 && uncharged.has(r.check));
  if (dropped.length === 0) return p;
  const range = (PARTS_DATA.partRange as Record<string, [number, number]>)[k] ?? (PARTS_DATA.partRange as Record<string, [number, number]>).default!;
  const score = r3(Math.min(range[1], Math.max(range[0], p.score - dropped.reduce((s, r) => s + r.points, 0))));
  return { ...p, score, display: roundHalf(score), reasons: p.reasons.filter((r) => !dropped.includes(r)) };
}

/** A parts result as the score took it: every part rebuilt without the charges v16 didn't take. */
export function chargedParts<T extends { parts: Partial<Record<PartName, PartResult>>; v16?: PartsV16 }>(res: T): T {
  const uncharged = unchargedChecks(res.v16);
  if (uncharged.size === 0) return res;
  const parts: Partial<Record<PartName, PartResult>> = {};
  for (const k of Object.keys(res.parts) as PartName[]) parts[k] = chargedPart(k, res.parts[k], uncharged);
  return { ...res, parts };
}
