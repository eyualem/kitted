// T69: the parts engine v16 in core (tasks/T69/TESTING.md F2.1a-c, T69-G6 engine, T69-G11). v16 is the bundled data
// (createParts(PARTS_DATA)); v15 is v15's tune on the same tables (partsDataFor(true, true, false)). Made-up readings
// only (no person, no photo): PLAIN, BOXY, TOP9, BRIGHTS, SKINNY from TESTING.md's shared set-up, TL1 from
// graded_look_check.py, and every v16 case reading of parts_parity.json. Every number is the Python engine's.
import { describe, expect, it } from "vitest";
import { PARTS_DATA, type PartsOptions, type PartsScored, type Reading, type SecondLookInput, type Styles } from "../src/index";
import { loadJSON } from "./helpers";
import { KNEES, OPENINGS, R, scored, T69, v15Engine, v16Engine } from "./t69";

interface ParityCase { src: string; reading: string; occasion: string; styles: [string, number][]; boldness: string;
  second_look: SecondLookInput | null; tune?: string; season?: "warm" | null; graded_look?: string | string[] | null }
const P = loadJSON<{ readings: Record<string, Reading>; cases: ParityCase[] }>("parts_parity.json");
const RP = loadJSON<{ readings: Record<string, Reading> }>("rubric_parity.json");
const readingOf = (id: string): Reading => P.readings[id] ?? RP.readings[id]!;

/** Every v16 case of the parity fixture as (reading, options), once each, cool and warm. */
function v16Inputs(): { label: string; reading: Reading; opts: PartsOptions }[] {
  const seen = new Set<string>();
  const out: { label: string; reading: Reading; opts: PartsOptions }[] = [];
  for (const c of P.cases) {
    if (c.tune !== "v16") continue;
    for (const season of [null, "warm"] as const) {
      const key = `${c.reading}|${c.occasion}|${c.boldness}|${JSON.stringify(c.second_look)}|${season}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label: `${c.src} ${c.reading}@${c.occasion} ${season ?? "cool"}`, reading: readingOf(c.reading),
        opts: { occasion: c.occasion, boldness: c.boldness, secondLook: c.second_look, season } });
    }
  }
  return out;
}

/** The made-up readings of TESTING.md plus two that exercise the copies (the steady-class rewrite, the leg tie-break). */
function madeUp(): { label: string; reading: Reading; opts: PartsOptions }[] {
  const oxford = R("PLAIN");
  oxford.garments[0] = { ...oxford.garments[0]!, subcategory: "oxford_shirt" };
  oxford.garments[2] = { ...oxford.garments[2]!, subcategory: "chelsea_boot", color_family: "brown" };
  const out: { label: string; reading: Reading; opts: PartsOptions }[] = [];
  for (const season of [null, "warm"] as const) {
    for (const k of ["PLAIN", "BOXY", "TOP9", "BRIGHTS", "SKINNY"] as const) out.push({ label: `${k} ${season ?? "cool"}`, reading: R(k), opts: { occasion: "everyday", season } });
    out.push({ label: `oxford + chelsea ${season ?? "cool"}`, reading: oxford, opts: { occasion: "everyday", season } });
    out.push({ label: `PLAIN + W ${season ?? "cool"}`, reading: R("PLAIN"), opts: { occasion: "everyday", season, secondLook: { knee: "hangs_away", opening: "wider" } } });
  }
  return out;
}

describe("v16: same photo, same score (F2.1)", () => {
  it("F2.1a · the same reading and options score the same, and the reading is untouched", () => {
    const eng = v16Engine();
    const inputs = [...madeUp(), ...v16Inputs()];
    expect(inputs.length).toBeGreaterThan(madeUp().length + 100); // the fixture's v16 cases are there
    const bad: string[] = [];
    for (const { label, reading, opts } of inputs) {
      const before = JSON.parse(JSON.stringify(reading));
      const lookBefore = JSON.parse(JSON.stringify(opts.secondLook ?? null));
      const a = eng.scoreParts(reading, opts);
      const b = eng.scoreParts(reading, opts);
      if (a.overall !== null && (a as PartsScored).v16 === undefined) bad.push(`${label}: no v16 block (engine ${(a as PartsScored).engine})`);
      if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${label}: two calls differ`);
      if (JSON.stringify(reading) !== JSON.stringify(before)) bad.push(`${label}: the reading changed`);
      if (JSON.stringify(opts.secondLook ?? null) !== JSON.stringify(lookBefore)) bad.push(`${label}: the second look changed`);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  }, 120_000);

  it("F2.1b · picks never move a v16 number or the graded look", () => {
    const eng = v16Engine();
    const PICKS: Styles[] = [[], [["streetwear", 1]], [["classic_prep", 1]], [["minimalist", 0.5], ["smart_casual", 0.5]]];
    // every number and the whole v16 block (lifts, taste, caps, gradedLook, heldBy); only the label may follow his picks
    const sig = (r: PartsScored) => JSON.stringify([r.overall, r.rawScore, r.rawUnrounded, r.average, r.averageUnrounded, r.parts,
      r.condition, r.occasion, r.v16]);
    const inputs = [...madeUp(), ...v16Inputs()];
    let n = 0;
    const bad: string[] = [];
    for (const { label, reading, opts } of inputs) {
      const base = eng.scoreParts(reading, { ...opts, styles: PICKS[0] });
      if (base.overall === null) continue;
      if (!(base as PartsScored).v16) { bad.push(`${label}: no v16 block`); break; }
      n++;
      for (const st of PICKS.slice(1)) {
        const r = scored(eng.scoreParts(reading, { ...opts, styles: st }));
        if (sig(r) !== sig(base as PartsScored)) bad.push(`${label} picks ${JSON.stringify(st)}: moved`);
      }
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
    expect(n).toBeGreaterThan(100);
    // the must-not, on the one example where it would show: BOXY reads minimal / smart casual, never his streetwear pick
    const boxy = scored(eng.scoreParts(R("BOXY"), { occasion: "everyday", styles: [["streetwear", 1]] }));
    expect(boxy.v16?.gradedLook).toEqual(["minimalist", "smart_casual"]);
    expect(boxy.overall).toBe(8.5);
  }, 180_000);

  it("F2.1c · graded look: default, explicit, a mix, and TL1", () => {
    const eng = v16Engine();
    const boxy = (gradedLook?: PartsOptions["gradedLook"]) => scored(eng.scoreParts(R("BOXY"), { occasion: "everyday", ...(gradedLook !== undefined ? { gradedLook } : {}) }));
    const def = boxy();
    expect(def.v16?.gradedLook).toEqual(["minimalist", "smart_casual"]);
    expect(def.overall).toBe(8.5);
    expect(boxy("streetwear").overall).toBe(8.5);
    expect(boxy("minimalist").overall).toBe(8.5);
    expect(boxy("tailored").overall).toBe(8.0);
    expect(boxy("none").overall).toBe(8.0);
    expect(boxy(["streetwear", "tailored"]).overall).toBe(8.5);
    expect(boxy("tailored").v16?.gradedLook).toEqual(["tailored"]);
    expect(boxy(["streetwear", "tailored"]).v16?.gradedLook).toEqual(["streetwear", "tailored"]);
    // a string and a one-item list are the same look; null, undefined and [] are the default
    expect(boxy(["tailored"])).toEqual(boxy("tailored"));
    expect(boxy(["streetwear"])).toEqual(boxy("streetwear"));
    expect(boxy(null)).toEqual(def);
    expect(boxy(undefined)).toEqual(def);
    expect(boxy([])).toEqual(def);
    // TL1 (specs/tailored.md, graded_look_check.py): Tailored by the outfit, and it stands for smart casual and prep
    expect(T69.tl1.length).toBe(10);
    for (const c of T69.tl1) {
      const g = scored(eng.scoreParts(c.reading, { occasion: "everyday" })).v16?.gradedLook ?? null;
      expect([c.name, g !== null && g.includes("tailored")]).toEqual([c.name, c.tailored]);
      if (g !== null && g.includes("tailored")) {
        expect([c.name, g.includes("smart_casual") || g.includes("classic_prep")]).toEqual([c.name, false]);
      }
    }
    // the must-not: v15 reads neither gradedLook nor season nor the leg-width look
    const v15 = v15Engine();
    const plain = v15.scoreParts(R("PLAIN"), { occasion: "everyday" });
    const loaded = v15.scoreParts(R("PLAIN"), { occasion: "everyday", gradedLook: "streetwear", season: "warm", secondLook: { knee: "hangs_away", opening: "wider" } });
    expect(loaded).toEqual(plain);
    expect((plain as PartsScored).engine).toBe("v15");
    expect((plain as PartsScored).v16).toBeUndefined();
  });
});

describe("the leg-width look in the engine (T69-G6)", () => {
  it("T69-G6 · the engine reads knee and opening as a tie-break", () => {
    const eng = v16Engine();
    const none = scored(eng.scoreParts(R("PLAIN"), { occasion: "everyday" }));
    expect(none.overall).toBe(7.0);
    expect(none.v16?.taste).toEqual([]);
    let wide = 0;
    for (const knee of KNEES) {
      for (const opening of OPENINGS) {
        const r = scored(eng.scoreParts(R("PLAIN"), { occasion: "everyday", secondLook: { knee, opening } }));
        const reads = `${knee}/${opening}`;
        if (knee === "hangs_away" || opening === "wider") {
          wide++;
          expect([reads, r.overall]).toEqual([reads, 8.0]);
          expect([reads, r.v16?.taste]).toEqual([reads, [{ points: 0.1875, id: "T_leg", line: expect.any(String) }]]);
          expect([reads, r.v16?.lifts.map((l) => l.id)]).toEqual([reads, ["SIL"]]);
        } else {
          expect([reads, r.overall]).toEqual([reads, 7.0]);
          expect([reads, r.v16?.taste]).toEqual([reads, []]);
          expect([reads, r.v16?.lifts]).toEqual([reads, []]);
        }
      }
    }
    expect(wide).toBe(7);
    // a stored wide, slim or skinny leg is kept whatever the look says (it only breaks the straight/relaxed tie)
    for (const [leg, want] of [["wide", 8.0], ["slim", 6.5], ["skinny", 5.5]] as const) {
      const rd = R("PLAIN");
      rd.garments[1] = { ...rd.garments[1]!, leg_shape: leg };
      const alone = scored(eng.scoreParts(rd, { occasion: "everyday" }));
      expect([leg, alone.overall]).toEqual([leg, want]);
      expect(alone.v16).toBeDefined();
      for (const knee of KNEES) for (const opening of OPENINGS) {
        const r = scored(eng.scoreParts(rd, { occasion: "everyday", secondLook: { knee, opening } }));
        expect([leg, knee, opening, JSON.stringify(r)]).toEqual([leg, knee, opening, JSON.stringify(alone)]);
      }
    }
    // on shorts the look changes nothing
    const shorts = scored(eng.scoreParts(R("SHORTS"), { occasion: "everyday" }));
    expect(shorts.v16).toBeDefined();
    for (const knee of KNEES) for (const opening of OPENINGS) {
      expect(eng.scoreParts(R("SHORTS"), { occasion: "everyday", secondLook: { knee, opening } })).toEqual(shorts);
    }
  });
});

describe("what never leaks in (T69-G11)", () => {
  it("T69-G11 · shorts_end and long_top move nothing unless present; L5_BY_LOOK and pn1_look are off", () => {
    const eng = v16Engine();
    // the shipped tune: v16 exactly as approved (#484, #487; the top stays 9.0 for now, #489)
    expect(PARTS_DATA.engine).toBe("v16");
    const taste = (PARTS_DATA.tune as unknown as Record<string, unknown>)["taste"] as Record<string, unknown> | null;
    expect(taste).not.toBeNull();
    for (const k of ["accent_by_look", "accent_agree", "pn1_look", "leg_look_global"]) expect([k, taste?.[k]]).toEqual([k, undefined]);
    expect(taste?.["leg_look_mode"]).toBe("tiebreak");
    expect(taste?.["long_top_read"]).toBe("reading");
    const tune = PARTS_DATA.tune as unknown as Record<string, unknown>;
    expect([tune["raw_cap"], tune["curve_knee"], tune["stack_clean"]]).toEqual([9.5, null, null]);
    expect(tune["curve"]).toEqual([1.1, 0.7, 7.0]);
    // long_top in the second look: the reading's own length is what counts ("reading"), so the look's key moves nothing
    for (const k of ["PLAIN", "BOXY", "LONG"] as const) {
      const a = scored(eng.scoreParts(R(k), { occasion: "everyday" }));
      expect(a.v16).toBeDefined();
      expect([k, eng.scoreParts(R(k), { occasion: "everyday", secondLook: { long_top: true } })]).toEqual([k, a]);
    }
    expect(scored(eng.scoreParts(R("LONG"), { occasion: "everyday" })).v16?.taste).toEqual([{ points: -0.25, id: "T_long_top", line: "the top ends low" }]);
    // shorts_end: the engine's own rule (kept, though no app look sends it) on shorts; nothing on pants
    const sh = scored(eng.scoreParts(R("SHORTS"), { occasion: "everyday" }));
    const above = scored(eng.scoreParts(R("SHORTS"), { occasion: "everyday", secondLook: { shorts_end: "above_knee" } }));
    expect(sh.v16?.caps).toEqual([]);
    expect(sh.v16?.taste).toEqual([]);
    expect(above.v16?.taste).toEqual([{ points: -0.5, id: "T_shorts_above", line: "shorts above the knee" }]);
    expect([sh.v16?.raw, above.v16?.raw]).toEqual([9.175, 8.675]);
    expect(eng.scoreParts(R("PLAIN"), { occasion: "everyday", secondLook: { shorts_end: "above_knee" } })).toEqual(eng.scoreParts(R("PLAIN"), { occasion: "everyday" }));
  });
});
