// T94 · Tailored, the 8th look (specs/tailored.md; tasks/T94/TESTING.md): the same tests as
// extraction-test/tailored_test.py, on @kitted/core. What counts as Tailored (TL1), the name and its ties (TL2), every
// number staying what engine v15 gave before T94 (TL3: handoff/fixtures/tailored_base_v15.json, recorded by the test
// writer on the base engine), Going for (TL4.3) and the fix order (TL5). TL1.7 checks every reading here is the same
// reading Python tests, and that TS gives Python's looks (handoff/fixtures/tailored.json, written by tailored_test.py
// once every Python test passes).
//
// Rule 7: made-up readings with no person in them (no age, no picks unless a test says so; boldness "a little";
// everyday). The demo reading s09 is a stock photo, "profile unknown", run with no picks. No network, $0.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RUBRIC_DATA, defaultRubric, detectLooks, goingForAdvice, scoreParts, suggestPartsFixes,
  type DetectedStyle, type Garment, type PartsResult, type PartsScored, type Reading, type Styles,
} from "../src/index";
import { FIXTURES, loadJSON, loadReading } from "./helpers";

const TAILORED = "tailored" as DetectedStyle;
const SEVEN = ["vintage_sport", "outdoor", "workwear", "streetwear", "classic_prep", "minimalist", "smart_casual"];
const LOOK_ORDER = ["vintage_sport", "outdoor", "workwear", "streetwear", "tailored", "classic_prep", "minimalist", "smart_casual"];

// ── the readings: rules_conformance.py's helpers, line for line ───────────────────────────────────────────────────
type Kw = Record<string, unknown>;
function G(cat: string, sub: string, color = "black", vol = 3, leg = "na", hem = "na", tucked = "na", length = "na", pattern = "solid", kw: Kw = {}): Garment {
  return {
    category: cat, subcategory: sub, color_family: color, pattern, logo: "none", volume: vol, leg_shape: leg, hem, tucked,
    condition: "clean", certainty: "clear", length, pattern_scale: pattern === "solid" || pattern === "graphic" ? "na" : "medium",
    saturation: "na", sleeve_end: cat === "top" || cat === "outerwear" ? "at_wrist" : "na", strain: "none",
    distressed_by_design: false, shows_below_outer: false, ...kw,
  } as Garment;
}
function top(sub: string, color = "white", kw: Kw = {}): Garment {
  const { tucked = "none", length = "mid_fly", pattern = sub === "graphic_tee" ? "graphic" : "solid", ...rest } = kw;
  return G("top", sub, color, 3, "na", "na", tucked as string, length as string, pattern as string, rest);
}
function outer(sub: string, color = "black", kw: Kw = {}): Garment {
  const { length = "at_belt", ...rest } = kw;
  return G("outerwear", sub, color, 3, "na", "na", "na", length as string, "solid", rest);
}
const bottom = (sub: string, color: string, leg: string, hem = "slight_break"): Garment => G("bottom", sub, color, 3, leg, hem);
const shoe = (sub: string, color = "black"): Garment => G("footwear", sub, color);
function Rd(garments: Garment[], scene: Kw = {}): Reading {
  return {
    scene: { framing: "full_body", shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: "good", clothed: "fully", ...scene },
    garments,
  } as Reading;
}
const withScene = (r: Reading, scene: Kw): Reading => ({ ...r, scene: { ...r.scene, ...scene } } as Reading);

const SHIRT = top("dress_shirt", "white", { tucked: "full" });
const GREY_TROUSERS = bottom("trousers", "grey", "straight", "slight_break");
const LOAFER = shoe("loafer", "brown");
const SUIT = Rd([SHIRT, outer("suit_jacket", "charcoal"), bottom("suit_trousers", "charcoal", "straight", "no_break"), shoe("derby", "black")]);
const BLZ_WITH = (s: Garment) => Rd([SHIRT, outer("blazer", "navy"), GREY_TROUSERS, s]);
const BLZ = BLZ_WITH(LOAFER);
const PREP = Rd([top("oxford_shirt", "white"), outer("blazer", "navy"), bottom("chinos", "khaki_beige", "straight"), LOAFER]);
const KNIT = Rd([top("sweater", "grey"), bottom("trousers", "grey", "straight"), LOAFER]);
const DJ = Rd([top("tee", "white"), outer("blazer", "navy"), bottom("jeans", "denim_dark", "straight"), LOAFER]);
const SHOES: Record<string, Garment> = {
  white_leather_sneaker: shoe("white_leather_sneaker", "white"), low_profile_sneaker: shoe("low_profile_sneaker", "black"),
  chunky_sneaker: shoe("chunky_sneaker", "white"), performance_runner: shoe("performance_runner", "grey"),
  slides_sandals: shoe("slides_sandals", "black"), work_boot: shoe("work_boot", "brown"),
  basketball_sneaker: shoe("basketball_sneaker", "white"), canvas_sneaker: shoe("canvas_sneaker", "black"),
  retro_runner: shoe("retro_runner", "grey"),
};
const NEVER_BOTTOMS: Record<string, Garment> = {
  chinos: bottom("chinos", "khaki_beige", "straight"), cargos: bottom("cargos", "olive", "straight"),
  sweatpants: bottom("sweatpants", "grey", "straight"), joggers: bottom("joggers", "black", "slim", "cuffed"),
  shorts: bottom("shorts", "khaki_beige", "straight", "na"), athletic_shorts: bottom("athletic_shorts", "black", "straight", "na"),
};
const NEVER_TOPS: Record<string, Garment> = {
  hoodie: top("hoodie", "grey"), sweatshirt: top("sweatshirt", "grey"), graphic_tee: top("graphic_tee", "black"),
  tank_top: top("tank_top", "white"), jersey: top("jersey", "red"), fleece: top("fleece", "grey"),
};
const PICKS_TL21: Record<string, [string, number][]> = {
  none: [], sc: [["smart_casual", 1]], prep: [["classic_prep", 1]], "prep+sc": [["classic_prep", 0.5], ["smart_casual", 0.5]], tailored: [["tailored", 1]],
};
const PINK = Rd([top("oxford_shirt", "pink"), outer("blazer", "navy"), GREY_TROUSERS, LOAFER]);
const MIN_TIE = Rd([top("tee", "white"), outer("unstructured_blazer", "navy"), bottom("trousers", "black", "straight"), shoe("loafer", "black")]);
const SLEEVES = Rd([SHIRT, outer("blazer", "navy", { sleeve_end: "covers_hand" }), bottom("trousers", "grey", "straight", "no_break"), shoe("canvas_sneaker", "red")]);
const SLEEVES_WRINKLED = Rd([top("dress_shirt", "white", { tucked: "full", condition: "wrinkled" }), outer("blazer", "navy", { sleeve_end: "covers_hand" }), GREY_TROUSERS, LOAFER]);
const KNIT_SLEEVES = Rd([top("sweater", "grey", { sleeve_end: "covers_hand" }), bottom("trousers", "grey", "straight"), LOAFER]);
const COAT_SLEEVES = Rd([top("sweater", "grey"), outer("overcoat", "tan_camel", { sleeve_end: "covers_hand" }), bottom("trousers", "grey", "straight"), shoe("canvas_sneaker", "red")]);

interface Case { crit: string; reading: Reading; picks: [string, number][]; occasion: string }
const CASES = new Map<string, Case>();
const add = (id: string, crit: string, reading: Reading, picks: [string, number][] = []) => {
  if (CASES.has(id)) throw new Error(id);
  CASES.set(id, { crit, reading, picks, occasion: "everyday" });
};
add("suit", "TL1.1", SUIT);
add("suit-no-shoes", "TL1.1", withScene(SUIT, { shoes_visible: false }));
add("suit-upper-only", "TL1.1", withScene(SUIT, { framing: "upper_only" }));
add("blz", "TL1.2", BLZ);
add("suit-jacket-plain-trousers", "TL1.2", Rd([SHIRT, outer("suit_jacket", "navy"), GREY_TROUSERS, LOAFER]));
for (const [k, s] of Object.entries(SHOES)) add(`blz+${k}`, "TL1.3", BLZ_WITH(s));
["shirt", "blazer", "trousers", "loafers"].forEach((what, i) => {
  const gs = BLZ.garments.map((g) => ({ ...g }));
  gs[i] = { ...gs[i]!, volume: 5 };
  add(`blz-volume5-${what}`, "TL1.3", Rd(gs as Garment[]));
});
for (const [k, p] of Object.entries({ none: [], tailored: [["tailored", 1.0]], prep: [["classic_prep", 1]], sc: [["smart_casual", 1]], "tailored+sc": [["tailored", 0.5], ["smart_casual", 0.5]] } as Record<string, [string, number][]>))
  add(`prep@${k}`, "TL1.4", PREP, p);
add("knit", "TL1.5", KNIT);
add("knit+overcoat", "TL1.5", Rd([top("sweater", "grey"), outer("overcoat", "tan_camel"), bottom("trousers", "grey", "straight"), LOAFER]));
add("dj", "TL1.6", DJ);
for (const [k, b] of Object.entries(NEVER_BOTTOMS)) add(`dj-${k}`, "TL1.6", Rd([top("tee", "white"), outer("blazer", "navy"), b, LOAFER]));
for (const [k, t] of Object.entries(NEVER_TOPS)) add(`blz-under-${k}`, "TL1.6", Rd([t, outer("blazer", "navy"), GREY_TROUSERS, LOAFER]));
for (const [k, p] of Object.entries(PICKS_TL21)) {
  add(`blz@${k}`, "TL2.1", BLZ, p);
  add(`pink-oxford@${k}`, "TL2.1", PINK, p);
}
add("min-tie@none", "TL2.1", MIN_TIE);
add("min-tie@minimalist", "TL2.1", MIN_TIE, [["minimalist", 1]]);
add("s09", "TL2.2", loadReading("s09"));
add("suit+chunky", "TL2.2", Rd([SHIRT, outer("suit_jacket", "charcoal"), bottom("suit_trousers", "charcoal", "straight", "no_break"), shoe("chunky_sneaker", "white")]));
add("suit-over-graphic-tee", "TL2.2", Rd([top("graphic_tee", "black"), outer("suit_jacket", "charcoal"), bottom("suit_trousers", "charcoal", "straight", "no_break"), shoe("derby", "black")]));
for (const [k, p] of Object.entries({ none: [], tailored: [["tailored", 1]], "streetwear+tailored": [["streetwear", 0.5], ["tailored", 0.5]], sc: [["smart_casual", 1]] } as Record<string, [string, number][]>)) {
  add(`sleeves@${k}`, "TL5.1", SLEEVES, p);
  add(`sleeves-wrinkled@${k}`, "TL5.1", SLEEVES_WRINKLED, p);
  add(`knit-sleeves@${k}`, "TL5.1", KNIT_SLEEVES, p);
  add(`coat-sleeves@${k}`, "TL5.1", COAT_SLEEVES, p);
}

// ── running a case ──────────────────────────────────────────────────────────────────────────────────────────────
const C = (id: string): Case => {
  const c = CASES.get(id);
  if (!c) throw new Error(`no case ${id}`);
  return c;
};
const parts = (id: string): PartsScored => {
  const c = C(id);
  return scoreParts(c.reading, { occasion: c.occasion, styles: c.picks as Styles }) as PartsScored;
};
const scored = (id: string): Garment[] => defaultRubric.scoredGarments(C(id).reading);
const looks = (id: string, picks?: [string, number][]) => defaultRubric.detectLooks(scored(id), (picks ?? C(id).picks) as Styles);
const isTl = (id: string) => defaultRubric.isTailored(scored(id));
const fixes = (id: string) => {
  const c = C(id);
  return suggestPartsFixes(c.reading, { occasion: c.occasion, styles: c.picks as Styles });
};
const order = (id: string) => fixes(id).fixes.map((f) => f.id);

/** Every number of a parts result, in tailored_test.py's shape (never a line, never a look name). */
function numbers(r: PartsResult): unknown {
  if (r.overall === null) return { overall: null, reason: r.reason };
  return {
    overall: r.overall, raw_score: r.rawScore, average: r.average, earned_bonus: r.earnedBonus, piled_penalty: r.piledPenalty,
    floored: r.floored, condition: r.condition.deduction, occasion: [r.occasion.deduction, r.occasion.ceiling],
    parts: Object.fromEntries(Object.entries(r.parts).map(([k, v]) => [k, {
      score: v.score, display: v.display, reasons: v.reasons.map((x) => [x.check, x.points]), tips: v.tips.map((x) => x.check),
    }])),
  };
}
const fixNumbers = (f: ReturnType<typeof fixes>) => ({
  base_overall: f.baseOverall,
  fixes: f.fixes.map((x) => [x.id, x.to, x.gain, x.rawGain] as [string, number, number, number]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)),
});
const lines = (r: PartsScored) => Object.values(r.parts).flatMap((p) => [...p.reasons, ...p.tips].map((x) => x.line));
const h1 = (r: PartsScored) => r.parts.cohesion.reasons.filter((x) => x.check === "H1_reads_as_style").map((x) => [x.check, x.points, x.line]);
const cohesion = (r: PartsScored) => r.parts.cohesion.reasons.map((x) => [x.check, x.points, x.line]);

interface Pin { crit: string; reading: Reading; picks: [string, number][]; occasion: string; numbers: unknown; detected_styles: string[] | null; style_label: string | null; fixes: unknown; fix_order: string[] }
const PINS = loadJSON<{ cases: Record<string, Pin> }>("tailored_base_v15.json").cases;
const pin = (id: string): Pin => {
  const p = PINS[id];
  if (!p) throw new Error(`no pin for ${id}`);
  return p;
};
/** TL3: every number of the case equals engine v15's before T94. */
const sameNumbers = (id: string, r: PartsResult = parts(id)) => expect([id, numbers(r)]).toEqual([id, pin(id).numbers]);

// ── TL1 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
describe("TL1 · what counts as Tailored", () => {
  it("TL1.1 · a charcoal suit with black derbies reads as Tailored", () => {
    expect(looks("suit", [])).toEqual({ detected: ["tailored"], label: "tailored" });
    expect(detectLooks(SUIT, [])).toEqual({ detected: ["tailored"], label: "tailored" });
    const r = parts("suit");
    expect([r.styleLabel, r.detectedStyles]).toEqual(["tailored", ["tailored"]]);
    expect(isTl("suit")).toBe(true);
    // must not: the scoring detector stays the 7 looks
    expect(defaultRubric.detectStyles(scored("suit"), [])).toEqual({ detected: [], label: null });
    expect(RUBRIC_DATA.styles.order).toEqual(SEVEN);
    expect((RUBRIC_DATA.styles as unknown as { lookOrder: string[] }).lookOrder).toEqual(LOOK_ORDER);
    expect((RUBRIC_DATA.styles.names as Record<string, string>)["tailored"]).toBe("tailored");
    sameNumbers("suit", r);
  });

  it("TL1.1 · edges: no shoes in view still Tailored; the top half only isn't", () => {
    expect(looks("suit-no-shoes", [])).toEqual({ detected: ["tailored"], label: "tailored" });
    expect([isTl("suit-no-shoes"), parts("suit-no-shoes").styleLabel]).toEqual([true, "tailored"]);
    sameNumbers("suit-no-shoes");
    expect(looks("suit-upper-only", [])).toEqual({ detected: [], label: null });
    const r = parts("suit-upper-only");
    expect([isTl("suit-upper-only"), r.styleLabel, r.detectedStyles.includes(TAILORED)]).toEqual([false, null, false]);
    sameNumbers("suit-upper-only", r);
  });

  it("TL1.2 · navy blazer, white dress shirt, grey trousers, brown loafers reads as Tailored", () => {
    const r = parts("blz");
    expect([r.styleLabel, r.detectedStyles]).toEqual(["tailored", ["tailored", "classic_prep", "smart_casual"]]);
    expect(isTl("blz")).toBe(true);
    expect(cohesion(r)).toContainEqual(["H1_reads_as_style", 0.5, "reads as tailored"]);
    expect(lines(r).filter((l) => l.includes("reads as smart casual") || l.includes("reads as classic prep"))).toEqual([]);
    expect(defaultRubric.detectStyles(scored("blz"), []).detected).toEqual(["classic_prep", "smart_casual"]);
    sameNumbers("blz", r);
  });

  it("TL1.2 · edge: a suit jacket with plain trousers (re-filed as a blazer) reads as Tailored", () => {
    const r = parts("suit-jacket-plain-trousers");
    expect([r.styleLabel, r.detectedStyles.includes(TAILORED), isTl("suit-jacket-plain-trousers")]).toEqual(["tailored", true, true]);
    expect(h1(r)).toEqual([["H1_reads_as_style", 0.5, "reads as tailored"]]);
    sameNumbers("suit-jacket-plain-trousers", r);
  });

  it("TL1.3 · white leather sneakers keep it Tailored; chunky, running, slides, work boots don't", () => {
    for (const k of ["white_leather_sneaker", "low_profile_sneaker"]) {
      const r = parts(`blz+${k}`);
      expect([k, r.styleLabel, r.detectedStyles.includes(TAILORED), isTl(`blz+${k}`)]).toEqual([k, "tailored", true, true]);
      sameNumbers(`blz+${k}`, r);
    }
    for (const k of ["chunky_sneaker", "performance_runner", "slides_sandals", "work_boot", "basketball_sneaker"]) {
      const id = `blz+${k}`;
      const r = parts(id);
      expect([k, r.detectedStyles.includes(TAILORED), isTl(id), looks(id, []).detected.includes(TAILORED)]).toEqual([k, false, false, false]);
      expect([k, r.styleLabel, r.detectedStyles]).toEqual([k, pin(id).style_label, pin(id).detected_styles]);
      sameNumbers(id, r);
    }
  });

  it("TL1.3 · edges: canvas sneakers and retro runners stay Tailored; any piece at roominess 5 doesn't", () => {
    for (const k of ["canvas_sneaker", "retro_runner"]) {
      expect([k, parts(`blz+${k}`).styleLabel]).toEqual([k, "tailored"]);
      sameNumbers(`blz+${k}`);
    }
    for (const what of ["shirt", "blazer", "trousers", "loafers"]) {
      const id = `blz-volume5-${what}`;
      const r = parts(id);
      expect([id, r.detectedStyles.includes(TAILORED), isTl(id), r.styleLabel]).toEqual([id, false, false, pin(id).style_label]);
      sameNumbers(id, r);
    }
  });

  it("TL1.4 · blazer with khaki chinos and loafers stays classic prep", () => {
    for (const k of ["none", "tailored", "prep", "sc", "tailored+sc"]) {
      const id = `prep@${k}`;
      const r = parts(id);
      expect([id, r.detectedStyles, isTl(id), looks(id).detected.includes(TAILORED)]).toEqual([id, ["classic_prep", "smart_casual"], false, false]);
      expect([id, r.styleLabel]).toEqual([id, pin(id).style_label]);
      sameNumbers(id, r);
    }
    expect([parts("prep@none").styleLabel, parts("prep@tailored").styleLabel]).toEqual(["classic_prep", "classic_prep"]);
  });

  it("TL1.5 · a sweater with dress trousers and loafers isn't Tailored", () => {
    const r = parts("knit");
    expect([r.detectedStyles, r.styleLabel, isTl("knit")]).toEqual([["minimalist", "smart_casual"], "minimalist", false]);
    expect([pin("knit").detected_styles, pin("knit").style_label]).toEqual([["minimalist", "smart_casual"], "minimalist"]);
    sameNumbers("knit", r);
    const o = parts("knit+overcoat");
    expect([o.detectedStyles.includes(TAILORED), isTl("knit+overcoat"), o.styleLabel]).toEqual([false, false, pin("knit+overcoat").style_label]);
    sameNumbers("knit+overcoat", o);
  });

  it("TL1.6 · a blazer with dark jeans isn't Tailored", () => {
    const r = parts("dj");
    expect([r.detectedStyles.includes(TAILORED), r.styleLabel, isTl("dj")]).toEqual([false, "classic_prep", false]);
    sameNumbers("dj", r);
    for (const id of [...Object.keys(NEVER_BOTTOMS).map((k) => `dj-${k}`), ...Object.keys(NEVER_TOPS).map((k) => `blz-under-${k}`)]) {
      const x = parts(id);
      expect([id, x.detectedStyles.includes(TAILORED), isTl(id), looks(id, []).detected.includes(TAILORED)]).toEqual([id, false, false, false]);
      expect([id, x.styleLabel, x.detectedStyles]).toEqual([id, pin(id).style_label, pin(id).detected_styles]);
      sameNumbers(id, x);
    }
  });
});

// ── TL1.7 ───────────────────────────────────────────────────────────────────────────────────────────────────────
interface PyCase {
  id: string; crit: string; reading: Reading; picks: [string, number][]; occasion: string;
  python: { is_tailored: boolean; looks: unknown; looks_nopick: unknown; detected_styles: string[]; style_label: string | null;
    lines: Record<string, [string, number, string][]>; numbers: unknown; fix_order: string[] };
}
function pythonCases(): PyCase[] {
  if (!existsSync(join(FIXTURES, "tailored.json")))
    throw new Error("T94: not built (handoff/fixtures/tailored.json is written by extraction-test/tailored_test.py once every Python test passes)");
  return loadJSON<{ cases: PyCase[] }>("tailored.json").cases;
}

describe("TL1.7 · the same tests in Python and TypeScript", () => {
  it("TL1.7 · every TL1 reading gives the same looks in TS as in Python", () => {
    const py = pythonCases();
    // the case lists match: no case exists in one language only
    expect(py.map((c) => c.id)).toEqual([...CASES.keys()]);
    for (const p of py) {
      const c = C(p.id);
      expect([p.id, p.reading, p.picks, p.occasion]).toEqual([p.id, c.reading, c.picks, c.occasion]);
      const r = parts(p.id);
      expect([p.id, isTl(p.id), looks(p.id), looks(p.id, []), r.detectedStyles, r.styleLabel])
        .toEqual([p.id, p.python.is_tailored, p.python.looks, p.python.looks_nopick, p.python.detected_styles, p.python.style_label]);
      expect([p.id, Object.fromEntries(Object.entries(r.parts).map(([k, v]) => [k, v.reasons.map((x) => [x.check, x.points, x.line])]))])
        .toEqual([p.id, p.python.lines]);
      expect([p.id, numbers(r), order(p.id)]).toEqual([p.id, p.python.numbers, p.python.fix_order]);
    }
  });

  it("TL1.7 · the readings here are the readings Python pinned", () => {
    expect(Object.keys(PINS).sort()).toEqual([...CASES.keys()].sort());
    for (const [id, c] of CASES) expect([id, c.reading, c.picks, c.occasion]).toEqual([id, pin(id).reading, pin(id).picks, pin(id).occasion]);
    // and the pins are the base engine's: no Tailored anywhere in them
    for (const [id, p] of Object.entries(PINS)) expect([id, p.style_label === "tailored" || (p.detected_styles ?? []).includes("tailored")]).toEqual([id, false]);
  });

  it("TL1.7 · isTailored agrees with the framework on every parity reading", () => {
    const readings: Record<string, Reading> = {
      ...loadJSON<{ readings: Record<string, Reading> }>("rubric_parity.json").readings,
      ...loadJSON<{ readings: Record<string, Reading> }>("parts_parity.json").readings,
    };
    let yes = 0;
    const off: string[] = [];
    for (const [id, r] of Object.entries(readings)) {
      let gs: Garment[];
      try {
        gs = defaultRubric.scoredGarments(r);
      } catch {
        continue;
      }
      if (!gs.length) continue;
      const a = defaultRubric.isTailored(gs);
      const b = defaultRubric.detectLooks(gs, []).detected.includes(TAILORED);
      if (a !== b) off.push(`${id}: isTailored ${a}, detectLooks ${b}`);
      if (a) yes += 1;
    }
    expect(off).toEqual([]);
    expect(yes).toBeGreaterThan(0);
  });
});

// ── TL2 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
describe("TL2 · the name", () => {
  it("TL2.1 · Tailored wins over smart casual and prep whatever the picks", () => {
    for (const base of ["blz", "pink-oxford"]) {
      const first = numbers(parts(`${base}@none`));
      for (const k of Object.keys(PICKS_TL21)) {
        const id = `${base}@${k}`;
        const r = parts(id);
        expect([id, r.styleLabel, looks(id).label, h1(r)]).toEqual([id, "tailored", "tailored", [["H1_reads_as_style", 0.5, "reads as tailored"]]]);
        expect([id, numbers(r)]).toEqual([id, first]);
        sameNumbers(id, r);
      }
    }
    expect(pin("pink-oxford@none").style_label).toBe("classic_prep");
  });

  it("TL2.1 · a tie Tailored doesn't own goes to his picks, then the fixed order", () => {
    const d = looks("min-tie@none");
    expect([d.detected.includes(TAILORED), d.detected.includes("minimalist"), d.label]).toEqual([true, true, "tailored"]);
    expect(looks("min-tie@minimalist").label).toBe("minimalist");
    expect([parts("min-tie@none").styleLabel, parts("min-tie@minimalist").styleLabel]).toEqual(["tailored", "minimalist"]);
    expect(numbers(parts("min-tie@minimalist"))).toEqual(numbers(parts("min-tie@none")));
    sameNumbers("min-tie@none");
    sameNumbers("min-tie@minimalist");
  });

  it('TL2.2 · a suit that reads as Tailored never says "a matching suit"', () => {
    for (const id of ["suit", "suit-no-shoes", "s09"]) {
      const r = parts(id);
      expect([id, r.styleLabel, h1(r)]).toEqual([id, "tailored", [["H1_reads_as_style", 0.5, "reads as tailored"]]]);
      expect([id, lines(r).filter((l) => l.includes("matching suit"))]).toEqual([id, []]);
      sameNumbers(id, r);
    }
    for (const id of CASES.keys()) {
      const r = parts(id);
      if (r.overall !== null && r.styleLabel === TAILORED) expect([id, lines(r).filter((l) => l.includes("matching suit"))]).toEqual([id, []]);
    }
  });

  it('TL2.2 · across the regenerated parts parity, no Tailored card says "matching suit"', () => {
    const P = loadJSON<{ pool: { reasons?: { line: string }[]; tips?: { line: string }[] }[]; cases: { reading: string; occasion: string; styles: [string, number][]; expected: { style_label?: string | null; parts?: Record<string, number> } }[] }>("parts_parity.json");
    let tl = 0;
    const bad: string[] = [];
    for (const c of P.cases) {
      if (c.expected.style_label !== "tailored") continue;
      tl += 1;
      for (const [name, ix] of Object.entries(c.expected.parts ?? {})) {
        const p = P.pool[ix]!;
        for (const x of [...(p.reasons ?? []), ...(p.tips ?? [])]) if (x.line.includes("matching suit")) bad.push(`${c.reading}@${c.occasion} ${name}: ${x.line}`);
      }
    }
    expect(bad).toEqual([]);
    expect(tl).toBeGreaterThan(0);
  });

  it('TL2.2 · founder 1 (default): a suit that isn\'t Tailored keeps +0.5 and "a matching suit"', () => {
    for (const id of ["suit+chunky", "suit-over-graphic-tee"]) {
      const r = parts(id);
      expect([id, r.styleLabel, r.detectedStyles.includes(TAILORED), isTl(id), h1(r)])
        .toEqual([id, null, false, false, [["H1_reads_as_style", 0.5, "a matching suit"]]]);
      sameNumbers(id, r);
    }
  });
});

// ── TL3.2 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe("TL3.2 · the fixtures come from this branch's engine", () => {
  const ENGINE = join(FIXTURES, "..", "..", "extraction-test");
  const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

  it("TL3.2 · every fixture's sha256 is this branch's rubric.py, parts_proto.py and parts_fixes.py", () => {
    const rubric = sha(join(ENGINE, "rubric.py"));
    const proto = sha(join(ENGINE, "rubrics", "parts_proto.py"));
    const fixesPy = sha(join(FIXTURES, "parts_fixes.py"));
    const pp = loadJSON<{ parts_proto_sha256: string; rubric_sha256: string }>("parts_parity.json");
    const pf = loadJSON<{ parts_proto_sha256: string; parts_fixes_sha256: string }>("parts_fixes.json");
    const rp = loadJSON<{ rubric_sha256: string }>("rubric_parity.json");
    expect({ pp: [pp.parts_proto_sha256, pp.rubric_sha256], pf: [pf.parts_proto_sha256, pf.parts_fixes_sha256], rp: rp.rubric_sha256 })
      .toEqual({ pp: [proto, rubric], pf: [proto, fixesPy], rp: rubric });
  });

  it("TL3.2 · the regenerated parity and fix fixtures carry a Tailored picks variant", () => {
    const pp = loadJSON<{ cases: { styles: [string, number][] }[] }>("parts_parity.json");
    expect(pp.cases.some((c) => c.styles.some(([k]) => k === "tailored"))).toBe(true);
    const pf = loadJSON<{ cases: { styles?: [string, number][] }[] }>("parts_fixes.json");
    expect(pf.cases.some((c) => (c.styles ?? []).some(([k]) => k === "tailored"))).toBe(true);
  });
});

// ── TL4.3 ───────────────────────────────────────────────────────────────────────────────────────────────────────
describe("TL4.3 · Going for Tailored", () => {
  it("TL4.3 · Going for Tailored names the piece that keeps it from Tailored: a graphic tee under a blazer is the loud one", () => {
    // Verification round 1 (Nov 18): Going for reads the 8 looks (Interfaces: pullingPiece's `reads` uses detectLooks),
    // so the piece that pulls away from Tailored is found the way it is for every other look. A plain tee in its place
    // reads as Tailored (TL1: a tee is a home piece; a graphic tee is on the never-list).
    const GT = Rd([top("graphic_tee", "white"), outer("blazer", "navy"), GREY_TROUSERS, LOAFER]);
    const PLAIN = Rd([top("tee", "white"), outer("blazer", "navy"), GREY_TROUSERS, LOAFER]);
    expect(defaultRubric.isTailored(defaultRubric.scoredGarments(GT))).toBe(false);
    expect(defaultRubric.isTailored(defaultRubric.scoredGarments(PLAIN))).toBe(true);
    const a = goingForAdvice(GT, TAILORED, { occasion: "everyday" })!;
    expect([a.going, a.kind, a.readsAs]).toEqual(["tailored", "mismatch", "classic_prep"]);
    expect(a.piece).toEqual({ index: 0, name: "graphic tee", plural: false, why: "loud" });
    expect([a.move?.id, a.move?.copy]).toEqual(["top_plain_tee", "Swap the graphic tee for a plain tee"]);
    expect(goingForAdvice(PLAIN, TAILORED, { occasion: "everyday" })!.kind).toBe("match");
    // and it changes no number
    expect(numbers(scoreParts(GT, { occasion: "everyday", styles: [["tailored", 1]] }))).toEqual(numbers(scoreParts(GT, { occasion: "everyday" })));
  });

  it("TL4.3 · Going for Tailored: a match on a suit, a mismatch on a blazer with chinos, no score moves", () => {
    const blz = goingForAdvice(BLZ, TAILORED, { occasion: "everyday" })!;
    expect([blz.kind, blz.readsAs, blz.going]).toEqual(["match", "tailored", "tailored"]);
    expect([blz.piece, blz.move]).toEqual([null, null]);
    const suit = goingForAdvice(SUIT, TAILORED, { occasion: "everyday" })!;
    expect([suit.kind, suit.readsAs]).toEqual(["match", "tailored"]);
    const prep = goingForAdvice(PREP, TAILORED, { occasion: "everyday" })!;
    expect([prep.kind, prep.readsAs]).toEqual(["mismatch", "classic_prep"]);
    // the old looks' advice on a Tailored outfit is unchanged in kind: BLZ still reads as smart casual and prep
    expect(goingForAdvice(BLZ, "smart_casual", { occasion: "everyday" })!.kind).toBe("match");
    expect(goingForAdvice(BLZ, "classic_prep", { occasion: "everyday" })!.kind).toBe("match");
    // gym and home: no Going for
    expect(goingForAdvice(SUIT, TAILORED, { occasion: "gym" })).toBeNull();
    expect(goingForAdvice(SUIT, TAILORED, { occasion: "home" })).toBeNull();
    // choosing it changes no number
    expect(numbers(scoreParts(BLZ, { occasion: "everyday", styles: [["tailored", 1]] }))).toEqual(pin("blz").numbers);
    expect(numbers(scoreParts(PREP, { occasion: "everyday", styles: [["tailored", 1]] }))).toEqual(pin("prep@none").numbers);
  });
});

// ── TL5 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
describe("TL5 · the fix order", () => {
  const sameFixNumbers = (id: string) => {
    expect([id, fixNumbers(fixes(id))]).toEqual([id, pin(id).fixes]);
    sameNumbers(id);
  };

  it("TL5.1 · the sleeve fix leads with Tailored first; the score is the same", () => {
    expect(order("sleeves@none")).toEqual(["shoes_loafers", "fit_better"]);
    expect(pin("sleeves@none").fix_order).toEqual(["shoes_loafers", "fit_better"]);
    expect(fixes("sleeves@none").fixes.map((f) => f.to)).toEqual([7.5, 7.0]);
    expect(order("sleeves@tailored")).toEqual(["fit_better", "shoes_loafers"]);
    expect(order("sleeves@streetwear+tailored")).toEqual(["fit_better", "shoes_loafers"]);
    for (const k of ["none", "tailored", "streetwear+tailored", "sc"]) sameFixNumbers(`sleeves@${k}`);
    const by = (f: ReturnType<typeof fixes>) => Object.fromEntries(f.fixes.map((x) => [x.id, [x.to, x.gain, x.rawGain, x.toRaw]]));
    const a = fixes("sleeves@none"), b = fixes("sleeves@tailored");
    expect([by(b), b.baseOverall, b.baseRaw]).toEqual([by(a), a.baseOverall, a.baseRaw]);
    expect(numbers(parts("sleeves@tailored"))).toEqual(numbers(parts("sleeves@none")));
  });

  it("TL5.1 · no lead without Tailored, never across a class, never without a tailored jacket", () => {
    expect(order("sleeves@sc")).toEqual(["shoes_loafers", "fit_better"]);
    for (const k of ["none", "tailored", "streetwear+tailored", "sc"]) {
      expect([k, order(`sleeves-wrinkled@${k}`)]).toEqual([k, ["steam", "fit_better"]]);
      sameFixNumbers(`sleeves-wrinkled@${k}`);
      expect([k, order(`knit-sleeves@${k}`)]).toEqual([k, pin("knit-sleeves@none").fix_order]);
      sameFixNumbers(`knit-sleeves@${k}`);
      expect([k, order(`coat-sleeves@${k}`)]).toEqual([k, ["shoes_loafers", "fit_better"]]);
      sameFixNumbers(`coat-sleeves@${k}`);
    }
    // the output keeps its shape: no lead key on a fix
    for (const f of fixes("sleeves@tailored").fixes) expect(Object.keys(f).sort()).toEqual(Object.keys(fixes("sleeves@none").fixes[0]!).sort());
  });

  it("TL3.1 · every reading here keeps every number of engine v15 (the pins)", () => {
    for (const id of CASES.keys()) {
      sameNumbers(id);
      expect([id, fixNumbers(fixes(id))]).toEqual([id, pin(id).fixes]);
    }
  });
});
