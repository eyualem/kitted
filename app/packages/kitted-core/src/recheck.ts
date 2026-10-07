// Anchored re-check (spec 04 §6; exact port of kitted_logic.recheck_merge).
// The new photo's reading is merged onto the FIRST reading; it is never scored alone. Identity fields never change
// between two photos minutes apart, so the score can't drop from noise, only from a clearly read new problem.

import { CORE, garmentName } from "./names";
import { defaultRubric, type RubricEngine } from "./rubric";
import type { Garment, Reading, RuleId, ScoreOptions, Scene } from "./types";
import { fixTargets, type Fix } from "./fixes";
import { clone, has, pyRound } from "./util";

/** Python str() for the scalar field values that can appear in a note. */
function pyStr(v: unknown): string {
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null || v === undefined) return "None";
  return String(v);
}

export const STATE_FIELDS = ["hem", "tucked", "length", "sleeve_end", "condition", "strain", "shows_below_outer"] as const;

export interface RecheckMerge {
  merged: Reading;
  /** "changed: outerwear", "swapped: tee -> polo", "new item: ...", "shoes now in the photo", "new problem: ..." */
  notes: string[];
}

/**
 * @param first    the first check's reading
 * @param next     the re-check photo's reading
 * @param targets  fields the card's fixes touch (fixTargets()), e.g. ["outerwear"], ["bottom.hem"], ["*.sleeve_end"]
 */
export function recheckMerge(
  first: Reading, next: Reading, targets: Iterable<string>, opts: ScoreOptions = {},
  engine: RubricEngine = defaultRubric,
): RecheckMerge {
  const T = new Set(targets);
  const notes: string[] = [];
  let merged: Reading = { scene: clone(first.scene) as Scene, garments: [] };
  const newScene: Scene = next.scene ?? {};
  const firstScene: Scene = first.scene ?? {};
  const shoesVisible = (s: Scene) => (has(s, "shoes_visible") ? s.shoes_visible : true);

  const isTarget = (cat: string, field?: string): boolean => {
    if (T.has(cat) || T.has("*")) return true;
    return field !== undefined && (T.has(`${cat}.${field}`) || T.has(`*.${field}`));
  };
  const hiddenInNew = (cat: string): boolean => {
    if (cat === "footwear" && !shoesVisible(newScene)) return true;
    return (cat === "bottom" || cat === "footwear") && newScene.framing === "upper_only";
  };
  const byCat = (r: Reading, c: string) => r.garments.filter((g) => g.category === c);
  const pending: [string, number, string, unknown][] = [];

  for (const g of first.garments) {
    if (!(CORE as readonly unknown[]).includes(g.category)) merged.garments.push(clone(g));
  }
  for (const c of CORE) {
    const F = byCat(first, c);
    const N = byCat(next, c);
    if (isTarget(c) && !(hiddenInNew(c) && N.length === 0)) {
      merged.garments.push(...clone(N));
      const fs = F.map((x) => x.subcategory ?? null);
      const ns = N.map((x) => x.subcategory ?? null);
      if (fs.length !== ns.length || fs.some((s, i) => s !== ns[i])) notes.push(`changed: ${c}`);
      continue;
    }
    F.forEach((f, i) => {
      const n: Garment | undefined = N[i];
      if (n === undefined) {
        merged.garments.push(clone(f)); // missed or hidden: keep the first reading
        return;
      }
      if ((n.subcategory ?? null) !== (f.subcategory ?? null) || engine.fam(n.color_family ?? null) !== engine.fam(f.color_family ?? null)) {
        merged.garments.push(clone(n));
        notes.push(`swapped: ${garmentName(f)} -> ${garmentName(n)}`);
        return;
      }
      const g = clone(f);
      for (const k of STATE_FIELDS) {
        if (isTarget(c, k) && has(n, k)) {
          g[k] = n[k] as never;
        } else if ((n[k] ?? null) !== (f[k] ?? null) && n.certainty === "clear") {
          pending.push([c, i, k, n[k]]);
        }
      }
      merged.garments.push(g);
    });
    for (const n of N.slice(F.length)) {
      if (n.certainty === "clear") {
        merged.garments.push(clone(n));
        notes.push(`new item: ${garmentName(n)}`);
      }
    }
    if (c === "footwear" && !shoesVisible(firstScene) && shoesVisible(newScene) && N.length > 0) {
      (merged.scene as Scene).shoes_visible = true;
      if (F.length === 0) notes.push("shoes now in the photo");
    }
  }
  // a non-target state change counts only if the new reading is sure AND it is a new problem
  let base = engine.score(merged, opts);
  for (const [c, i, k, v] of pending) {
    const trial = clone(merged);
    const positions: number[] = [];
    trial.garments.forEach((g, j) => {
      if (g.category === c) positions.push(j);
    });
    const gi = positions[i];
    if (gi === undefined) continue;
    trial.garments[gi]![k] = v;
    const sc = engine.score(trial, opts);
    const before = base.rulesFired as RuleId[];
    const newRules = sc.rulesFired.filter((r) => !before.includes(r));
    if (newRules.length > 0) {
      merged = trial;
      base = sc;
      notes.push(`new problem: ${c}.${k} = ${pyStr(v)} (${newRules.join(", ")})`);
    }
  }
  return { merged, notes };
}

export interface RecheckOutcome {
  before: number;
  after: number;
  /** Display delta (after − before), e.g. 1.0. Never negative from noise (the merge anchors identity). */
  delta: number;
  /** Raw delta, Python round(x, 6), e.g. 0.75. */
  rawDelta: number;
  /** The first card's fixes the new photo shows done, each with the raw points it earned. */
  doneFixes: (Fix & { earned: number })[];
  /** Rules that fire now and didn't before ("New: …"). */
  newProblems: RuleId[];
  /** S21 "change not seen": nothing done and the score didn't move. */
  notSeen: boolean;
}

function slotJson(r: Reading, cat: string): string {
  return JSON.stringify(r.garments.filter((g) => g.category === cat));
}

function fieldChanged(first: Reading, merged: Reading, cat: string, field: string): boolean {
  const pick = (r: Reading) => r.garments.filter((g) => cat === "*" || g.category === cat).map((g) => g[field] ?? null);
  return JSON.stringify(pick(first)) !== JSON.stringify(pick(merged));
}

/** True when any of the fix's target slots or fields differ between the two readings. */
function fixDone(fix: Pick<Fix, "edits">, first: Reading, merged: Reading): boolean {
  return fixTargets([fix]).some((t) => {
    const dot = t.indexOf(".");
    if (t === "*") return JSON.stringify(first.garments) !== JSON.stringify(merged.garments);
    if (dot < 0) return slotJson(first, t) !== slotJson(merged, t);
    return fieldChanged(first, merged, t.slice(0, dot), t.slice(dot + 1));
  });
}

/**
 * The re-check card's numbers (02 D10, S21). `merged` comes from recheckMerge(first, next, fixTargets(firstFixes)).
 * A done fix earns the whole raw delta when it's the only one; otherwise its own predicted raw gain.
 */
export function recheckOutcome(
  first: Reading, firstFixes: readonly Fix[], merged: Reading, opts: ScoreOptions = {}, engine: RubricEngine = defaultRubric,
): RecheckOutcome | null {
  const a = engine.score(first, opts);
  const b = engine.score(merged, opts);
  if (a.overall === null || b.overall === null) return null;
  const rawDelta = pyRound(b.rawUnrounded - a.rawUnrounded, 6);
  const done = firstFixes.filter((f) => fixDone(f, first, merged));
  const doneFixes = done.map((f) => ({ ...clone(f), earned: done.length === 1 ? rawDelta : f.rawGain }));
  const before = new Set(a.rulesFired);
  const delta = b.overall - a.overall;
  return {
    before: a.overall,
    after: b.overall,
    delta,
    rawDelta,
    doneFixes,
    newProblems: b.rulesFired.filter((r) => !before.has(r)),
    notSeen: doneFixes.length === 0 && delta === 0,
  };
}
