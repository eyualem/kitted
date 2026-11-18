// T103 · KC3.3: which of the app's colors the scoring rules would not mark down on a piece.
// Contract: tasks/T103/TESTING.md. The expected lists were computed from the live engine (parts data 1.8.0, v15 switches on)
// and are written out as literals on purpose: a rules update that moves one is updated here in the same PR.
import { describe, expect, it } from "vitest";
import {
  CASUAL_FITS_V14, COLOR_CHOICES, FAMILY_HEX, PARTS_DATA, RUBRIC_DATA, allowedColors, defaultParts, outfitReading, scoreParts,
  setCasualFitsV14,
  type AllowedColorsInput, type ClosetItem, type ColorFamily, type Garment, type PartsEngine, type PartsOptions, type PartsResult, type Reading,
} from "../src/index";
import { loadReading, seedCloset } from "./helpers";

// Taken at load time, before any test (so before any allowedColors call), so guard G3 does not depend on test order:
// a write made by an earlier test is still a difference from these copies.
const RUBRIC_AT_LOAD = structuredClone(RUBRIC_DATA);
const PARTS_AT_LOAD = structuredClone(PARTS_DATA);

// ---------------------------------------------------------------- the lists (palette order)
const ALL24: ColorFamily[] = [
  "white", "off_white_cream", "light_grey", "grey", "charcoal", "black", "navy", "light_blue", "blue", "denim_light", "denim_mid",
  "denim_dark", "olive", "green", "sage", "khaki_beige", "tan_camel", "brown", "burgundy", "red", "orange", "yellow", "pink", "purple",
];
const BRIGHT5: ColorFamily[] = ["red", "orange", "yellow", "pink", "purple"];
const without = (list: readonly ColorFamily[], ...drop: ColorFamily[]): ColorFamily[] => list.filter((c) => !drop.includes(c));
const N19: ColorFamily[] = without(ALL24, ...BRIGHT5);

// ---------------------------------------------------------------- fixtures (plain objects)
const g = (o: Garment): Garment => ({ pattern: "solid", ...o });
const tee = (c: string, extra: Garment = {}) => g({ category: "top", subcategory: "tee", color_family: c, volume: 3, ...extra });
const graphicTee = (c: string) =>
  ({ category: "top", subcategory: "graphic_tee", color_family: c, pattern: "graphic", pattern_scale: "large", logo: "none", volume: 3 }) as Garment;
const oxford = (c: string) => g({ category: "top", subcategory: "oxford_shirt", color_family: c, volume: 3 });
const bottom = (sub: string) => (c: string) => g({ category: "bottom", subcategory: sub, color_family: c, leg_shape: "straight", volume: 3 });
const jeans = bottom("jeans"), chinos = bottom("chinos"), trousers = bottom("trousers");
const shoe = (sub: string) => (c: string) => g({ category: "footwear", subcategory: sub, color_family: c });
const sneakers = shoe("white_leather_sneaker"), loafers = shoe("loafer"), boots = shoe("work_boot");
const outer = (sub: string) => (c: string) => g({ category: "outerwear", subcategory: sub, color_family: c, volume: 3 });
const bomber = outer("bomber"), blazer = outer("blazer"), denimJacket = outer("denim_jacket");
const belt = g({ category: "accessory", subcategory: "belt" });
const watch = (c: string) => g({ category: "accessory", subcategory: "watch", color_family: c });

// ---------------------------------------------------------------- the inputs of cases a to p
const CASES: Record<string, { input: AllowedColorsInput; expect: ColorFamily[] }[]> = {
  a: [{ input: { others: [jeans("denim_dark"), sneakers("white")], piece: tee("black") }, expect: ALL24 }],
  b: [{ input: { others: [chinos("khaki_beige"), boots("brown")], piece: tee("black") }, expect: without(ALL24, "off_white_cream", "khaki_beige") }],
  c: [{ input: { others: [tee("red"), sneakers("white")], piece: jeans("black") }, expect: N19 }],
  d: [{ input: { others: [tee("red"), jeans("black")], piece: sneakers("white") }, expect: N19 }],
  e: [{ input: { others: [tee("olive"), jeans("black")], piece: sneakers("white") }, expect: ALL24 }],
  f: [{ input: { others: [blazer("navy"), oxford("white"), loafers("brown")], piece: trousers("black") }, expect: without(ALL24, "charcoal", "black") }],
  g: [
    { input: { others: [jeans("denim_mid")], piece: tee("white") }, expect: without(ALL24, "denim_mid") },
    { input: { others: [denimJacket("denim_mid"), tee("white"), sneakers("white")], piece: jeans("denim_dark") }, expect: without(ALL24, "denim_mid") },
  ],
  h: [{ input: { others: [jeans("denim_dark"), sneakers("white")], piece: graphicTee("black") }, expect: N19 }],
  i: [
    { input: { others: [chinos("orange"), sneakers("white")], piece: tee("black") }, expect: N19 },
    { input: { others: [chinos("orange"), sneakers("white")], piece: tee("black"), boldness: "bold" }, expect: [...N19, "orange"] },
  ],
  j: [{
    input: { others: [tee("red"), chinos("yellow"), sneakers("white")], piece: bomber("black") },
    expect: without(ALL24, "blue", "green", ...BRIGHT5),
  }],
  k: [{ input: { others: [blazer("navy"), trousers("black"), loafers("black")], piece: oxford("white") }, expect: ALL24 }],
  l: [
    { input: { others: [tee("red", { saturation: "muted" }), sneakers("white")], piece: jeans("black") }, expect: ALL24 },
    { input: { others: [tee("blue", { saturation: "bright" }), sneakers("white")], piece: jeans("black") }, expect: N19 },
  ],
  m: [
    { input: { others: [tee("red"), sneakers("white")], piece: { ...jeans("red"), saturation: "bright" } }, expect: N19 },
    { input: { others: [chinos("khaki_beige"), boots("brown")], piece: tee("khaki_beige") }, expect: without(ALL24, "off_white_cream", "khaki_beige") },
  ],
  n: [{ input: { others: [], piece: tee("black") }, expect: ALL24 }],
  o: [
    { input: { others: [tee("white"), jeans("denim_dark"), sneakers("white")], piece: belt }, expect: ALL24 },
    { input: { others: [tee("red"), sneakers("white"), watch("yellow")], piece: jeans("black") }, expect: N19 },
  ],
  p: [{
    input: { others: [tee("white"), jeans("denim_dark"), sneakers("white")], piece: { category: "traditional", subcategory: "other" } },
    expect: ALL24,
  }],
};
const CASE_IDS = Object.keys(CASES);
const NAMES: Record<string, string> = {
  a: "nothing in the outfit can mark a tee down",
  b: "light on light (white stays, cream and khaki go)",
  c: "a second bright piece (every part is counted)",
  d: "a loud shoe beside a bright piece",
  e: "shoes beside a quiet top",
  f: "near-match jacket and trousers (navy stays)",
  g: "double denim, both ways (other washes stay)",
  h: "the piece's own print counts",
  i: "boldness is passed on",
  j: "a pile-on: the others already clash",
  k: "a fault that isn't the piece's (never empty)",
  l: "the others' saturation is kept",
  m: "the piece's own color and saturation are ignored",
  n: "no outfit around the piece",
  o: "accessories never change a list",
  p: "a piece the rules don't rate gets all 24",
};

// ---------------------------------------------------------------- stand-in engine
type Reasons = Record<string, number[]>; // part -> reason points
interface Call { reading: Reading; opts: PartsOptions | undefined }
const lastColor = (r: Reading): string => String(r.garments[r.garments.length - 1]!.color_family);
function standIn(behave: (color: string) => Reasons | "unscored" | "throw") {
  const calls: Call[] = [];
  const engine: PartsEngine = {
    data: defaultParts.data,
    scoreParts(reading, opts) {
      calls.push({ reading, opts });
      const b = behave(lastColor(reading));
      if (b === "throw") throw new Error("stand-in: scoring failed");
      if (b === "unscored") return { overall: null, reason: "nothing_readable", parts: {}, naParts: [] } as unknown as PartsResult;
      const parts: Record<string, unknown> = {};
      for (const [k, pts] of Object.entries(b)) parts[k] = { reasons: pts.map((points, i) => ({ id: `r${i}`, points })) };
      return { overall: 7, parts } as unknown as PartsResult;
    },
  };
  return { engine, calls };
}
const SOME: AllowedColorsInput = { others: [jeans("denim_dark"), sneakers("white")], piece: tee("black") };

// ---------------------------------------------------------------- helpers
const deepFreeze = <T,>(o: T): T => {
  if (o && typeof o === "object") {
    for (const v of Object.values(o as object)) deepFreeze(v);
    Object.freeze(o);
  }
  return o;
};
const clonePlain = <T,>(o: T): T => structuredClone(o);
const inPaletteOrder = (list: readonly string[]) => list.every((c, i) => i === 0 || ALL24.indexOf(c as ColorFamily) > ALL24.indexOf(list[i - 1] as ColorFamily));

// ================================================================ KC3.3 · the real engine
describe("KC3.3 · allowedColors (real engine)", () => {
  for (const id of CASE_IDS) {
    it(`KC3.3 · ${id} · ${NAMES[id]}`, () => {
      for (const c of CASES[id]!) expect(allowedColors(c.input)).toEqual(c.expect);
    });
  }

  it("KC3.3 · i · boldness changes the list (the two calls differ)", () => {
    const [a, b] = CASES["i"]!;
    expect(allowedColors(a!.input)).not.toEqual(allowedColors(b!.input));
    expect(allowedColors(b!.input)).toContain("orange");
    expect(allowedColors(a!.input)).not.toContain("orange");
  });

  it("KC3.3 · m · the old color gives exactly the same list as no old color", () => {
    const withOld = allowedColors({ others: [tee("red"), sneakers("white")], piece: { ...jeans("red"), saturation: "bright" } });
    const { color_family: _c, ...bare } = jeans("red");
    const bareList = allowedColors({ others: [tee("red"), sneakers("white")], piece: bare });
    expect(withOld).toEqual(bareList);
    expect(bareList).toEqual(N19);
  });

  it("KC3.3 · b · white stays but cream and khaki do not (the rule's own exception)", () => {
    const list = allowedColors(CASES["b"]![0]!.input);
    expect(list).toContain("white");
    expect(list).not.toContain("off_white_cream");
    expect(list).not.toContain("khaki_beige");
    expect(list).toHaveLength(22);
  });

  it("KC3.3 · j · blue and green are out, burgundy and sage stay, and the list is never empty", () => {
    const list = allowedColors(CASES["j"]![0]!.input);
    expect(list).toHaveLength(17);
    expect(list).not.toContain("blue");
    expect(list).not.toContain("green");
    expect(list).toContain("burgundy");
    expect(list).toContain("sage");
  });

  it("KC3.3 · k · another piece's fault blames no color: the list is not empty", () => {
    expect(allowedColors(CASES["k"]![0]!.input)).toHaveLength(24);
  });
});

// ================================================================ properties
describe("KC3.3 · properties over many outfits", () => {
  it("KC3.3 · q · COLOR_CHOICES is the 24 palette families in order, without multicolor", () => {
    expect(COLOR_CHOICES).toEqual(ALL24);
    expect(COLOR_CHOICES).toHaveLength(24);
    expect(COLOR_CHOICES[0]).toBe("white");
    expect(COLOR_CHOICES[23]).toBe("purple");
    expect(COLOR_CHOICES).not.toContain("multicolor");
    expect([...COLOR_CHOICES]).toEqual(Object.keys(FAMILY_HEX).filter((f) => f !== "multicolor"));
  });

  it("KC3.3 · q · every answer of cases a to p and r is a non-empty, ordered, duplicate-free subset of COLOR_CHOICES", () => {
    let calls = 0;
    for (const id of CASE_IDS) {
      for (const c of CASES[id]!) {
        const list = allowedColors(c.input);
        calls++;
        expect(list.length).toBeGreaterThan(0);
        expect(new Set(list).size).toBe(list.length);
        expect(list.every((x) => ALL24.includes(x))).toBe(true);
        expect(list).not.toContain("multicolor");
        expect(inPaletteOrder(list)).toBe(true);
      }
    }
    // case r's asks (below) are checked for the same shape there
    expect(calls).toBe(Object.values(CASES).reduce((n, cs) => n + cs.length, 0));
  });

  it("KC3.3 · r · agrees with the engine's own numbers on 108 seed-closet asks, in both directions", () => {
    const closet = seedCloset();
    const tops = closet.filter((c) => c.slot === "top").slice(0, 4);
    const bottoms = closet.filter((c) => c.slot === "bottom").slice(0, 3);
    const shoes = closet.filter((c) => c.slot === "shoes").slice(0, 3);
    expect(tops).toHaveLength(4);
    expect(bottoms).toHaveLength(3);
    expect(shoes).toHaveLength(3);

    const own = (others: ClosetItem[], piece: ClosetItem): ColorFamily[] => {
      const cost = ALL24.map((c) => {
        const { saturation: _s, ...rest } = piece.garment;
        const cand: ClosetItem = { ...piece, garment: { ...rest, color_family: c } };
        const res = scoreParts(outfitReading([...others, cand]), { occasion: "everyday", boldness: "a_little" });
        if (res.overall === null) return 0;
        let sum = 0;
        for (const part of Object.values(res.parts)) {
          for (const r of part?.reasons ?? []) if (r.points < 0) sum += r.points;
        }
        return -sum;
      });
      const best = Math.min(...cost);
      return ALL24.filter((_, i) => cost[i]! <= best + 1e-9);
    };

    let asks = 0;
    let shorter = 0;
    for (const t of tops) {
      for (const b of bottoms) {
        for (const s of shoes) {
          for (const [piece, others] of [[t, [b, s]], [b, [t, s]], [s, [t, b]]] as const) {
            const got = allowedColors({ others: others.map((o) => o.garment), piece: piece.garment });
            const want = own([...others], piece);
            expect(got, `${t.id} ${b.id} ${s.id} asking ${piece.id}`).toEqual(want);
            asks++;
            if (want.length < 24) shorter++;
          }
        }
      }
    }
    expect(asks).toBe(108);
    // the seed closet really does have asks where the rules mark colors down (the test would be vacuous otherwise)
    expect(shorter).toBeGreaterThan(0);
  });
});

// ================================================================ stand-in engine
describe("KC3.3 · allowedColors (stand-in engine)", () => {
  it("KC3.3 · s1 · it follows the engine, not a copy of the rules", () => {
    const { engine } = standIn((c): Reasons => {
      if (c === "navy") return { color: [-1] };
      if (c === "black") return { shoes: [-0.5] };
      if (c === "red") return { cohesion: [-2] };
      if (c === "brown") return { color: [0.5] };
      return {};
    });
    expect(allowedColors(SOME, { parts: engine })).toEqual(without(ALL24, "navy", "black", "red"));
    expect(allowedColors(SOME, { parts: engine })).toContain("brown");
  });

  it("KC3.3 · s1 · a positive reason never lowers the best cost", () => {
    // brown carries +0.5 and -0.5 (cost 0.5), every other color -0.25 (cost 0.25): the line is 0.25, so brown is out.
    // If the +0.5 were netted against the -0.5, brown would cost 0, become the best, and be the only color listed.
    const { engine } = standIn((c) => (c === "brown" ? { color: [0.5, -0.5] } : { color: [-0.25] }));
    expect(allowedColors(SOME, { parts: engine })).toEqual(without(ALL24, "brown"));
  });

  it("KC3.3 · s2 · the best color sets the line", () => {
    const { engine } = standIn((c) => (c === "olive" || c === "sage" ? { color: [-0.5] } : { color: [-1] }));
    expect(allowedColors(SOME, { parts: engine })).toEqual(["olive", "sage"]);
  });

  it("KC3.3 · s3 · two costs that differ only by float error are equal", () => {
    const { engine } = standIn((c) => {
      if (c === "navy") return { color: [-0.1, -0.2] };
      if (c === "black") return { color: [-0.3] };
      return { color: [-1] };
    });
    expect(-(-0.1 + -0.2)).not.toBe(0.3); // the float trap the tolerance exists for
    expect(allowedColors(SOME, { parts: engine })).toEqual(["black", "navy"]);
  });

  it("KC3.3 · s4 · occasion and boldness reach the engine, and nothing else", () => {
    const given = standIn(() => ({}));
    allowedColors({ ...SOME, occasion: "interview", boldness: "bold" }, { parts: given.engine });
    expect(given.calls).toHaveLength(24);
    for (const c of given.calls) {
      expect(Object.keys(c.opts ?? {}).sort()).toEqual(["boldness", "occasion"]);
      expect(c.opts).toEqual({ occasion: "interview", boldness: "bold" });
    }
    const dflt = standIn(() => ({}));
    allowedColors(SOME, { parts: dflt.engine });
    expect(dflt.calls).toHaveLength(24);
    for (const c of dflt.calls) {
      expect(Object.keys(c.opts ?? {}).sort()).toEqual(["boldness", "occasion"]);
      expect(c.opts).toEqual({ occasion: "everyday", boldness: "a_little" });
    }
  });

  it("KC3.3 · s5 · what is sent for scoring: 24 candidates, last, with no old color or saturation", () => {
    const others = [tee("red", { saturation: "muted" }), jeans("black"), sneakers("white")];
    const piece: Garment = { ...bomber("navy"), saturation: "bright", pattern: "stripe", volume: 4 };
    const { engine, calls } = standIn(() => ({}));
    allowedColors({ others, piece }, { parts: engine });

    expect(calls).toHaveLength(24);
    expect(calls.map((c) => lastColor(c.reading))).toEqual(ALL24);
    expect(calls.map((c) => lastColor(c.reading))).not.toContain("multicolor");

    // outfitReading sets hem on bottoms and tucked/length on tops; everything else is as given
    const strip = (o: Garment) => {
      const { hem: _h, tucked: _t, length: _l, ...rest } = o;
      return rest;
    };
    for (const c of calls) {
      const gs = c.reading.garments;
      expect(gs).toHaveLength(4);
      const last = gs[3]!;
      expect(last.saturation).toBeUndefined();
      expect(last.category).toBe("outerwear");
      expect(last.subcategory).toBe("bomber");
      expect(last.pattern).toBe("stripe");
      expect(last.volume).toBe(4);
      expect(strip({ ...last, color_family: undefined })).toEqual(strip({ ...piece, color_family: undefined, saturation: undefined }));
      gs.slice(0, 3).forEach((got, i) => expect(strip(got)).toEqual(strip(others[i]!)));
      expect(gs[0]!.saturation).toBe("muted");
      expect(c.reading.scene?.framing).toBe("full_body");
      expect(c.reading.scene?.clothed).toBe("fully");
    }
  });

  it("KC3.3 · s6 · when scoring throws, the answer is empty and nothing is thrown", () => {
    const one = standIn((c) => (c === "navy" ? "throw" : {}));
    let got: ColorFamily[] | undefined;
    expect(() => { got = allowedColors(SOME, { parts: one.engine }); }).not.toThrow();
    expect(got).toEqual([]);

    const all = standIn(() => "throw");
    let gotAll: ColorFamily[] | undefined;
    expect(() => { gotAll = allowedColors(SOME, { parts: all.engine }); }).not.toThrow();
    expect(gotAll).toEqual([]);
  });

  it("KC3.3 · s7 · an unscored outfit is not a deduction", () => {
    const none = standIn(() => "unscored");
    expect(allowedColors(SOME, { parts: none.engine })).toEqual(ALL24);

    const redOnly = standIn((c) => (c === "red" ? "unscored" : { color: [-1] }));
    expect(allowedColors(SOME, { parts: redOnly.engine })).toEqual(["red"]);
  });
});

// ================================================================ guards
describe("KC3.3 · guards (no score moves)", () => {
  const run = (id: string) => {
    const reading = loadReading(id);
    const [piece, ...others] = reading.garments;
    return { reading, piece: piece!, others };
  };
  const READINGS = ["s05", "s12", "p01a"];

  it("KC3.3 · T103-G2 · scoring is unchanged by a call", () => {
    const ids = READINGS.map((id) => ({ id, ...run(id) }));
    // three different outfits
    expect(new Set(ids.map((r) => JSON.stringify(r.reading.garments.map((x) => x.subcategory)))).size).toBe(3);
    try {
      for (const on of [true, false]) {
        setCasualFitsV14(on);
        for (const r of ids) {
          const readingBefore = clonePlain(r.reading);
          const before = clonePlain(scoreParts(r.reading));
          const list = allowedColors({ others: r.others, piece: r.piece });
          expect(list.length).toBeGreaterThan(0);
          expect(scoreParts(r.reading), `${r.id} v14=${on}`).toEqual(before);
          expect(r.reading).toEqual(readingBefore);
        }
      }
    } finally {
      setCasualFitsV14(CASUAL_FITS_V14);
    }
  });

  it("KC3.3 · T103-G3 · engine data is not written", () => {
    let n = 0;
    for (const id of CASE_IDS) for (const c of CASES[id]!) { allowedColors(c.input); n++; }
    expect(n).toBe(Object.values(CASES).reduce((s, cs) => s + cs.length, 0));
    expect(RUBRIC_DATA).toEqual(RUBRIC_AT_LOAD);
    expect(PARTS_DATA).toEqual(PARTS_AT_LOAD);
  });

  it("KC3.3 · T103-G5 · an empty entry among the other pieces gives [] and does not throw", () => {
    const piece = tee("white");
    for (const bad of [undefined, null]) {
      let got: ColorFamily[] | undefined;
      expect(() => { got = allowedColors({ others: [bad as unknown as Garment, jeans("blue")], piece }); }).not.toThrow();
      expect(got).toEqual([]);
    }
  });

  it("KC3.3 · T103-G4 · inputs are not mutated (frozen inputs give the same lists)", () => {
    for (const id of ["b", "c", "j", "l"]) {
      for (const c of CASES[id]!) {
        const original = clonePlain(c.input);
        const frozen: AllowedColorsInput = deepFreeze(clonePlain(c.input));
        let got: ColorFamily[] | undefined;
        expect(() => { got = allowedColors(frozen); }, `case ${id}`).not.toThrow();
        expect(got, `case ${id}`).toEqual(c.expect);
        expect(frozen).toEqual(original);
      }
    }
  });
});
