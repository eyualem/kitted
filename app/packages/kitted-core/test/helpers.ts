// Shared fixture loading + TS-result -> rubric.py-dict mapping for the tests (not a test file itself).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deepEqual, type ClosetItem, type Fix, type FixSuggestions, type Reading, type RubricResult } from "../src/index";

/**
 * handoff/fixtures. Works from both places the package lives:
 *   handoff/ts/kitted-core/        → ../../fixtures           (this handoff folder)
 *   app/packages/kitted-core/      → ../../../handoff/fixtures (the Expo app's workspace, 05 §4.4)
 * The fixtures are never copied into the app (rubric_parity.json is 6.1 MB).
 */
const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_CANDIDATES = [join(PKG, "../../fixtures"), join(PKG, "../../../handoff/fixtures")];
export const FIXTURES: string = (() => {
  const hit = FIXTURE_CANDIDATES.find((d) => existsSync(join(d, "rubric_parity.json")));
  if (!hit) throw new Error(`handoff/fixtures not found; tried ${FIXTURE_CANDIDATES.join(", ")}`);
  return hit;
})();

export function loadJSON<T = any>(rel: string): T {
  return JSON.parse(readFileSync(join(FIXTURES, rel), "utf8")) as T;
}

/** A demo reading by id: readings/<id>.json, else readings/variants/<id>.json. */
export function loadReading(id: string): Reading {
  const main = join(FIXTURES, "readings", `${id}.json`);
  return loadJSON<Reading>(existsSync(main) ? `readings/${id}.json` : `readings/variants/${id}.json`);
}

export function seedCloset(): ClosetItem[] {
  return loadJSON("seed.json").scenarios.full.closet as ClosetItem[];
}

/** TS RubricResult -> the dict rubric.py / kitted_logic.score returns (fixture keys). */
export function toPy(r: RubricResult): Record<string, unknown> {
  if (r.overall === null) return { overall: null, reason: r.reason, partial: r.partial, rules_fired: r.rulesFired };
  return {
    overall: r.overall, raw_score: r.rawScore, subscores: r.subscores, occasion_adj: r.occasionAdj,
    credits: r.credits, credit_points: r.creditPoints, mistake_points: r.mistakePoints, rules_fired: r.rulesFired,
    advice: r.advice, partial: r.partial, not_rated: r.notRated,
    raw_unrounded: r.rawUnrounded, credit_unrounded: r.creditUnrounded, mistakes_unrounded: r.mistakesUnrounded,
  };
}

export function fixToPy(f: Fix): Record<string, unknown> {
  return {
    target: f.target, tier: f.tier, effort: f.effort, free: f.free, to: f.to, to_raw: f.toRaw, gain: f.gain,
    raw_gain: f.rawGain, edits: f.edits, item_id: f.itemId, copy: f.copy, tag: f.tag,
  };
}

export function suggestionsToPy(s: FixSuggestions): Record<string, unknown> {
  const o: Record<string, unknown> = {
    base_overall: s.baseOverall, base_raw: s.baseRaw, fixes: s.fixes.map(fixToPy), next_level: s.nextLevel, tips: s.tips,
  };
  if (s.dialedIn !== undefined) o["dialed_in"] = s.dialedIn;
  return o;
}

/**
 * Field-by-field exact comparison (numbers with ===, so unrounded doubles must match bit for bit; -0 === 0).
 * Returns human-readable mismatches; [] means equal. `skip` lists expected keys not produced by the score itself.
 */
export function diff(label: string, got: Record<string, unknown>, want: Record<string, unknown>, skip: string[] = []): string[] {
  const out: string[] = [];
  const wk = Object.keys(want).filter((k) => !skip.includes(k)).sort();
  const gk = Object.keys(got).filter((k) => !skip.includes(k)).sort();
  if (!deepEqual(gk, wk)) out.push(`${label}: keys ${JSON.stringify(gk)} != ${JSON.stringify(wk)}`);
  for (const k of wk) {
    if (!deepEqual(got[k], want[k])) out.push(`${label}: ${k} got ${JSON.stringify(got[k])} want ${JSON.stringify(want[k])}`);
  }
  return out;
}
