// T69 (parts engine v16) test helpers, shared by the T69 core tests (not a test file itself).
// The made-up readings come from app/src/__tests__/fixtures/t69-readings.json (built by the conformance helpers'
// shapes: rules_conformance.py G/top/bottom/shoe/outer/Rd, graded_look_check.py's TL1 cases, v16_paper.py's
// dealbreaker examples). They are inputs only: every expected number is written in the tests, from TESTING.md.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createParts, PARTS_DATA, partsDataFor, type PartsEngine, type PartsResult, type PartsScored, type PartsV16, type Reading, type SecondLookInput } from "../src/index";

const HERE = dirname(fileURLToPath(import.meta.url));

export interface T69Readings {
  readings: Record<"PLAIN" | "BOXY" | "TOP9" | "BRIGHTS" | "SKINNY" | "TANK" | "PUFFER" | "SHORTS" | "LONG", Reading>;
  tl1: { name: string; reading: Reading; tailored: boolean }[];
  dealbreakers: {
    sinks: { row: string; what: string; reading: Reading; second_look: SecondLookInput | null; cap: number }[];
    spared: { row: string; what: string; reading: Reading; second_look: SecondLookInput | null }[];
    depends: { row: string; what: string; base: Reading; weak: Reading; strong: Reading }[];
  };
}

export const T69: T69Readings = JSON.parse(readFileSync(join(HERE, "../../../src/__tests__/fixtures/t69-readings.json"), "utf8"));

/** A fresh copy of a named made-up reading (never the shared object). */
export const R = (k: keyof T69Readings["readings"]): Reading => JSON.parse(JSON.stringify(T69.readings[k])) as Reading;

/** v16: the bundled data (TESTING.md "Shared set-up"). */
export const v16Engine = (): PartsEngine => createParts(PARTS_DATA);
/** v15: v15's tune on the same tables (the third switch off). */
export const v15Engine = (): PartsEngine => createParts(partsDataFor(true, true, false));

export const scored = (r: PartsResult): PartsScored => {
  if (r.overall === null) throw new Error(`unscored: ${r.reason}`);
  return r as PartsScored;
};

/** TS v16 block -> parts_proto's result["v16"] (snake_case, tuples as lists). */
export function v16ToPy(v: PartsV16): Record<string, unknown> {
  return {
    season: v.season,
    lifts: v.lifts.map((l) => ({ id: l.id, size: l.size, line: l.line, layer: l.layer })),
    lift_sum: v.liftSum, minor: v.minor, fault_drop: v.faultDrop, heavy_layer: v.heavyLayer,
    caps: v.caps.map((c) => ({ cap: c.cap, id: c.id, kind: c.kind, line: c.line })),
    stack_ceiling: v.stackCeiling, one_look: v.oneLook, held_by: v.heldBy, raw: v.raw, raw_unclamped: v.rawUnclamped,
    cond_deduction: v.condDeduction, curved: v.curved, owned: v.owned, ceiling: v.ceiling, depends: v.depends,
    unread: v.unread, taste: v.taste.map((t) => ({ points: t.points, id: t.id, line: t.line })), graded_look: v.gradedLook,
  };
}

/** Canonical JSON: object keys sorted at every level (the baselines' hash input). */
export const canon = (x: unknown): string =>
  Array.isArray(x) ? `[${x.map(canon).join(",")}]`
    : x !== null && typeof x === "object"
      ? `{${Object.keys(x as object).sort().map((k) => `${JSON.stringify(k)}:${canon((x as Record<string, unknown>)[k])}`).join(",")}}`
      : JSON.stringify(x);
export const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");
/** Drops keys that only state a default (absent, null, or the given default value). */
export function stripDefaults<T extends Record<string, unknown>>(c: T, keys: [string, unknown?][]): Record<string, unknown> {
  const o: Record<string, unknown> = { ...c };
  for (const [k, d] of keys) if (o[k] === undefined || o[k] === null || (d !== undefined && o[k] === d)) delete o[k];
  return o;
}

/** The 9 graded looks (parts_proto.L5_BY_LOOK's keys). */
export const LOOKS = ["vintage_sport", "outdoor", "workwear", "streetwear", "tailored", "classic_prep", "minimalist", "smart_casual", "none"] as const;
export const KNEES = ["clings", "skims", "hangs_away", "not_visible"] as const;
export const OPENINGS = ["narrower", "about_the_same", "wider", "not_visible"] as const;
