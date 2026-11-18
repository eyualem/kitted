// T69-G5: steadiness, the B6 bar (#484, #487): of the 223 gold photos with two stored readings that both score, at
// least 218 land within half a point across their two readings when each reading is scored with v16 and its own
// leg-width look (the fixture's profile, Everyday, a cool day). handoff/fixtures/parts_steadiness.json is written by
// make_parts_steadiness.py from the engine (steadiness.py, run for run); garment descriptions only, no photo.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PARTS_DATA, type Reading, type SecondLookInput, type Styles } from "../src/index";
import { FIXTURES } from "./helpers";
import { v16Engine } from "./t69";

interface Steadiness {
  parts_version: string; parts_proto_sha256: string; profile: [string, number][]; occasion: string; boldness: string; season: null;
  photos: { id: string; readings: [Reading, Reading]; leg: [SecondLookInput | null, SecondLookInput | null]; ul: [SecondLookInput | null, SecondLookInput | null] }[];
  python: { steady_leg: number; steady_none: number; steady_all: number; total: number; scores_leg: Record<string, [number, number]> };
}

describe("steadiness (B6)", () => {
  it("T69-G5 · B6: at least 218 of 223 gold photos within half a point, each reading with its own leg look", () => {
    const path = join(FIXTURES, "parts_steadiness.json");
    expect(existsSync(path)).toBe(true);
    const S = JSON.parse(readFileSync(path, "utf8")) as Steadiness;
    expect(S.parts_version).toBe(PARTS_DATA.version);
    expect(S.parts_proto_sha256).toBe(PARTS_DATA.sourceSha256);
    expect([S.occasion, S.boldness, S.season]).toEqual(["everyday", "a_little", null]);
    expect(S.profile).toEqual([["minimalist", 0.5], ["smart_casual", 0.5]]);
    const eng = v16Engine();
    const score = (rd: Reading, sl: SecondLookInput | null) =>
      eng.scoreParts(rd, { occasion: S.occasion, styles: S.profile as Styles, boldness: S.boldness, secondLook: sl, season: null }).overall;
    const count = (look: (p: Steadiness["photos"][number], i: 0 | 1) => SecondLookInput | null) => {
      let steady = 0;
      let total = 0;
      const scores: Record<string, [number, number]> = {};
      for (const p of S.photos) {
        const a = score(p.readings[0], look(p, 0));
        const b = score(p.readings[1], look(p, 1));
        if (a === null || b === null) continue;
        total++;
        scores[p.id] = [a, b];
        if (Math.abs(a - b) <= 0.5) steady++;
      }
      return { steady, total, scores };
    };
    const leg = count((p, i) => p.leg[i]);
    expect(leg.total).toBe(223);
    expect(S.python.total).toBe(223);
    expect(leg.steady).toBe(S.python.steady_leg);
    expect(leg.steady).toBeGreaterThanOrEqual(218);
    expect(S.python.steady_leg).toBe(218);
    expect(leg.scores).toEqual(S.python.scores_leg);
    // the leg look is what the count rests on: the same readings with no looks are less steady
    const none = count(() => null);
    expect(none.steady).toBe(S.python.steady_none);
    expect(S.python.steady_none).toBe(215);
    // information only (#487): with looks U and L as well
    const all = count((p, i) => (p.ul[i] || p.leg[i] ? { ...(p.ul[i] ?? {}), ...(p.leg[i] ?? {}) } : null));
    console.log(`[B6] own leg look ${leg.steady}/${leg.total} · no looks ${none.steady} · U, L and leg ${all.steady} (Python ${S.python.steady_all})`);
  }, 120_000);
});
