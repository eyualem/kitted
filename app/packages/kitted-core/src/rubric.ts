// Exact TypeScript port of extraction-test/rubric.py (rubric v3.1), the source of truth for scores.
// "The AI sees, the code judges": this only reads the garment description. It never reads a face, body or skin.
//
// Parity rules (verified against fixtures/rubric_parity.json, 5,694 cases, bit for bit):
//  - same operation order as Python everywhere a float is summed or multiplied
//  - styles are ORDERED [name, weight] pairs, folded into a Map with Python-dict semantics
//  - the caller's reading is never mutated (rubric.py mutates; we score a deep copy)
//  - fire() skips amounts <= 0, so a zero-amount rule is never listed
// Numbers and tables come from RubricData (bundled rubricData.ts, or a remote rubric.json with engine == 3).

import { RUBRIC_DATA } from "./rubricData";
import type {
  Band, CreditId, Garment, NotRated, Reading, RubricData, RubricResult, RuleConfig, RuleId, Scene, ScoreOptions,
  Styles, SubscoreName,
} from "./types";
import { clone, has, isNone, maxOf, nearest, or, pyMax, pyRound, roundHalf, sum, truthy } from "./util";

/** Why a credit wasn't earned (for the "Why this score" ledger). */
export type CreditReason =
  | "heldNotWorn" | "noLayer" | "noElevated" | "allNeutral" | "tooMuchInterest" | "shoesHidden" | "shoesOff";

/**
 * What score() did, step by step, when a trace is passed. Recording never changes the arithmetic.
 * Indices point into the ORIGINAL reading's `garments` (or `held_items` for heldNotWorn).
 */
export interface ScoreTrace {
  rules: { id: RuleId; sub: SubscoreName | "occasion"; amount: number; culpritIndex: number | null }[];
  /** Every credit, in rubric (CREDITS) order. */
  credits: { id: CreditId; earned: boolean; points: number; evidenceIndex: number | null; reason: CreditReason | null; heldIndex: number | null }[];
  /** Earned credit sum × this = creditPts (1 for a full check; > 1 when parts are hidden, v3.1 R4). */
  creditFactor: number;
}

/** The engine version this code implements. Only load a remote rubric.json whose `engine` equals this. */
export const ENGINE_VERSION = 3;

const CORE_CATEGORIES: readonly unknown[] = ["top", "bottom", "footwear", "outerwear"];
const MAIN_CATEGORIES: readonly unknown[] = ["top", "bottom", "outerwear"];

export interface RubricEngine {
  readonly data: RubricData;
  score(reading: Reading, opts?: ScoreOptions, trace?: ScoreTrace): RubricResult;
  formality(g: Garment): number;
  fam(color: unknown): unknown;
  isBright(g: Garment): boolean;
  blendedBand(styles?: Styles | null): Band;
  /** Index in LEG_ORDER, or -1 when the value isn't a leg shape (e.g. "na", an alias, null). */
  legIndex(leg: unknown): number;
  readonly legOrder: readonly string[];
  occasionTarget(occasion: string): readonly [number, number];
  readonly neutrals: ReadonlySet<unknown>;
  readonly loungeOk: ReadonlySet<unknown>;
}

/** Python `dict(pairs)`: later duplicates overwrite the value but keep the first position. */
export function stylesMap(styles?: Styles | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const [name, w] of styles ?? []) m.set(name, w);
  return m;
}

function num(rule: RuleConfig, key: string): number {
  const v = rule[key];
  if (typeof v !== "number") throw new Error(`rubric.json: rule ${String(key)} is not a number`);
  return v;
}
function list(rule: RuleConfig, key: string): readonly unknown[] {
  const v = rule[key];
  if (!Array.isArray(v)) throw new Error(`rubric.json: rule ${String(key)} is not a list`);
  return v;
}

/** Build an engine from rubric data (the bundled copy, or a validated remote rubric.json). */
export function createRubric(data: RubricData): RubricEngine {
  if (data.engine !== ENGINE_VERSION) throw new Error(`rubric engine ${data.engine} != ${ENGINE_VERSION}`);
  const T = data.tables;
  const S = data.scoring;
  const A = data.advice;
  const rules = data.rules;
  const rule = (id: RuleId): RuleConfig => {
    const r = rules[id];
    if (!r) throw new Error(`rubric.json: missing rule ${id}`);
    return r;
  };

  const FORMALITY = new Map<unknown, number>(Object.entries(T.FORMALITY));
  const TAILORED_OUTER = new Set<unknown>(T.TAILORED_OUTER);
  const SEPARATE_JACKETS = new Set<unknown>(T.SEPARATE_JACKETS);
  const DARK_SUITING = new Set<unknown>(T.DARK_SUITING);
  const OCCASION_TARGET = new Map<unknown, number[]>(Object.entries(T.OCCASION_TARGET));
  const OCCASION_DEFAULT = T.OCCASION_DEFAULT;
  const DRESSY = new Set<unknown>(T.DRESSY_OCCASIONS);
  const LEG_ORDER = T.LEG_ORDER;
  const LEG_ALIAS = new Map<unknown, string>(Object.entries(T.LEG_ALIAS));
  const STYLE_BANDS = new Map(Object.entries(T.STYLE_BANDS));
  const DEFAULT_BAND = T.DEFAULT_BAND;
  const NEUTRALS = new Set<unknown>(T.NEUTRALS);
  const MUTED = new Set<unknown>(T.MUTED);
  const ALWAYS_BRIGHT = new Set<unknown>(T.ALWAYS_BRIGHT);
  const HUE_DEPENDS = new Set<unknown>(T.HUE_DEPENDS);
  const FAMILY = new Map<unknown, string>(Object.entries(T.FAMILY));
  const LOUNGE_BOTTOMS = new Set<unknown>(T.LOUNGE_BOTTOMS);
  const LOUNGE_OK = new Set<unknown>(T.LOUNGE_OK);
  const KNIT_TOPS = new Set<unknown>(T.KNIT_TOPS);
  const CREDITS = T.CREDITS;
  const CREDIT_MAX = S.creditMax;
  const credit = (id: CreditId): number => {
    const c = CREDITS.find((x) => x.id === id);
    if (!c) throw new Error(`rubric.json: missing credit ${id}`);
    return c.points;
  };

  const R = {
    F4: rule("F4_pooling"), F4b: rule("F4b_full_break_narrow_leg"), F7: rule("F7_care"), F6: rule("F6_top_too_long"),
    F8: rule("F8_too_big"), F9: rule("F9_sleeves_cover_hands"), F10: rule("F10_visible_strain"),
    T1: rule("T1_dress_shirt_untucked"), P1t: rule("P1_top_volume_vs_style"), P1l: rule("P1_leg_vs_style"),
    P2: rule("P2_big_top_skinny_leg"), P3: rule("P3_everything_oversized"), L1: rule("L1_shirt_hangs_below_blazer"),
    S1: rule("S1_bulky_shoe_narrow_leg"), C1a: rule("C1a_too_many_accent_colors"), C1b: rule("C1b_too_many_colors"),
    C3: rule("C3_bright_clash"), C4aS: rule("C4a_same_pattern_same_scale"), C4aT: rule("C4a_same_pattern_type"),
    C4b: rule("C4b_three_plus_patterns"), B1: rule("B1_too_many_focal_points"), C5: rule("C5_near_match_jacket_trousers"),
    O1c: rule("O1_too_casual"), O1f: rule("O1_too_formal"), O4: rule("O4_loungewear_out"),
    S2: rule("S2_shoes_too_casual_for_outfit"), O3: rule("O3_large_logo"),
  };
  const B1_ALLOWANCE = R.B1["allowance"] as Record<string, number>;

  const legIndex = (leg: unknown): number => LEG_ORDER.indexOf(leg as string);
  const fam = (c: unknown): unknown => (FAMILY.has(c) ? FAMILY.get(c) : c);

  function blendedBand(styles?: Styles | null): Band {
    const known: [string, number][] = [];
    for (const [s, w] of stylesMap(styles)) if (STYLE_BANDS.has(s) && w > 0) known.push([s, w]);
    if (known.length === 0) {
      return [
        [DEFAULT_BAND.volume[0]!, DEFAULT_BAND.volume[1]!],
        [legIndex(DEFAULT_BAND.leg[0]), legIndex(DEFAULT_BAND.leg[1])],
      ];
    }
    const tot = sum(known.map(([, w]) => w));
    const band = (s: string) => STYLE_BANDS.get(s)!;
    const vlo = sum(known.map(([s, w]) => band(s).volume[0]! * w)) / tot;
    const vhi = sum(known.map(([s, w]) => band(s).volume[1]! * w)) / tot;
    const llo = sum(known.map(([s, w]) => legIndex(band(s).leg[0]) * w)) / tot;
    const lhi = sum(known.map(([s, w]) => legIndex(band(s).leg[1]) * w)) / tot;
    return [[vlo, vhi], [llo, lhi]];
  }

  function isBright(g: Garment): boolean {
    const c = g.color_family;
    if (ALWAYS_BRIGHT.has(c)) return g.saturation !== "muted";
    if (HUE_DEPENDS.has(c)) return g.saturation === "bright";
    return false;
  }

  function formality(g: Garment): number {
    let f = FORMALITY.has(g.subcategory) ? FORMALITY.get(g.subcategory)! : S.formalityDefault;
    if (g.subcategory === "jeans" && g.color_family === "denim_dark" && !truthy(g.distressed_by_design)) {
      f = S.darkUndistressedJeans;
    }
    return f;
  }

  function occasionTarget(occasion: string): readonly [number, number] {
    const t = OCCASION_TARGET.has(occasion) ? OCCASION_TARGET.get(occasion)! : OCCASION_DEFAULT;
    return [t[0]!, t[1]!];
  }

  function score(reading: Reading, opts: ScoreOptions = {}, trace?: ScoreTrace): RubricResult {
    const occasion: string = opts.occasion ?? "everyday";
    const boldness: string = opts.boldness ?? "a_little";
    const styles = stylesMap(opts.styles);
    const ext = clone(reading); // rubric.py mutates its input (leg aliases); never touch the caller's reading
    const scene: Scene = (truthy(ext.scene) ? ext.scene : {}) as Scene;
    if (scene.clothed !== "fully") {
      return { overall: null, reason: "not_fully_clothed", partial: false, rulesFired: [] };
    }
    // Original positions survive the filters (same objects), for the ledger's evidence indices.
    const origIndex = new Map<Garment, number>();
    (ext.garments ?? []).forEach((g, i) => origIndex.set(g, i));
    const at = (g: Garment | undefined | null): number | null => (g ? (origIndex.get(g) ?? null) : null);
    let garments: Garment[] = (ext.garments ?? []).filter((g) => g.certainty !== "unsure" && g.category !== "accessory");
    const notRated: NotRated[] = [];
    if (!truthy(has(scene, "shoes_visible") ? scene.shoes_visible : true)) {
      garments = garments.filter((g) => g.category !== "footwear");
      notRated.push("shoes");
    }
    if (scene.framing === "upper_only") {
      garments = garments.filter((g) => g.category !== "bottom" && g.category !== "footwear");
      notRated.push("bottom half");
    }
    if (garments.some((g) => g.category === "traditional")) notRated.push("traditional garment (not rated)");
    garments = garments.filter((g) => g.category !== "traditional");
    if (garments.length === 0) {
      return { overall: null, reason: "nothing_readable", partial: true, rulesFired: [] };
    }
    for (const g of garments) {
      if (LEG_ALIAS.has(g.leg_shape)) {
        g.leg_shape_raw = g.leg_shape as string;
        g.leg_shape = LEG_ALIAS.get(g.leg_shape)!;
      }
    }

    const pen: Record<SubscoreName, number> = { fit: 0.0, color: 0.0, proportion: 0.0 };
    let occAdj = 0.0;
    const fired: RuleId[] = [];
    const advice: string[] = [];
    const fire = (id: RuleId, sub: SubscoreName | "occasion", amount: number, culprit?: Garment | null): void => {
      if (amount <= 0) return;
      if (rules[id]?.enabled === false) return; // remote kill switch; every rule is enabled in v3.1
      if (sub === "occasion") occAdj += amount;
      else pen[sub] += amount;
      fired.push(id);
      trace?.rules.push({ id, sub, amount, culpritIndex: at(culprit) });
    };

    const totSum = sum(Array.from(styles.values()));
    const totW = truthy(totSum) ? totSum : 1;
    const w = (s: string): number => (styles.has(s) ? styles.get(s)! : 0) / totW;
    const street = w("streetwear");
    const gorp = w("gorpcore");
    const vintage = w("vintage_sport");
    const workwear = w("workwear");
    const tops = garments.filter((g) => g.category === "top");
    const top: Garment | undefined = tops[0];
    const bottom = garments.find((g) => g.category === "bottom");
    const shoes = garments.find((g) => g.category === "footwear");
    const outer = garments.filter((g) => g.category === "outerwear");
    const [[vlo, vhi], [llo, lhi]] = blendedBand(opts.styles);

    // ================= FIT =================
    if (bottom && bottom.hem === "pooling") {
      if (street >= num(R.F4, "streetThreshold")) {
        fire("F4_pooling", "fit",
          bottom.leg_shape === "relaxed" || bottom.leg_shape === "wide" ? num(R.F4, "streetRelaxedOrWide") : num(R.F4, "streetSlim"), bottom);
      } else {
        fire("F4_pooling", "fit", num(R.F4, "amount"), bottom);
      }
    }
    if (bottom && bottom.hem === "full_break" && list(R.F4b, "legs").includes(bottom.leg_shape) && bottom.certainty === R.F4b["needsCertainty"]) {
      fire("F4b_full_break_narrow_leg", "fit", num(R.F4b, "amount"), bottom);
    }
    let care = 0.0;
    let careCulprit: Garment | null = null;
    for (const g of garments) {
      if (truthy(g.distressed_by_design)) continue;
      const c = g.condition;
      if (careCulprit === null && (c === "wrinkled" || (c === "stained" && g.certainty === "clear") || c === "pilled_or_worn")) careCulprit = g;
      if (c === "wrinkled") {
        care += num(R.F7, "wrinkled");
      } else if (c === "stained" && g.certainty === "clear") {
        care += num(R.F7, "stainedClear");
      } else if (c === "pilled_or_worn") {
        const half = g.category === "footwear" && street + workwear + vintage >= num(R.F7, "streetishThreshold");
        care += half ? num(R.F7, "pilledFootwearStreetish") : num(R.F7, "pilledOrWorn");
      }
    }
    if (truthy(care)) fire("F7_care", "fit", Math.min(care, num(R.F7, "cap")), careCulprit);
    if (top && (isNone(top.tucked) || top.tucked === "none" || top.tucked === "na") && top.length === "below_crotch"
        && (or(top.volume, num(R.F6, "volumeDefault")) as number) < num(R.F6, "volumeBelow") && street < num(R.F6, "streetBelow")) {
      fire("F6_top_too_long", "fit", num(R.F6, "amount"), top);
    }
    if (top && (or(top.volume, num(R.F8, "volumeDefault")) as number) >= num(R.F8, "volumeAtLeast") && street < num(R.F8, "streetBelow")
        && (top.sleeve_end === "covers_hand" || top.length === "below_crotch")) {
      fire("F8_too_big", "fit", num(R.F8, "amount"), top);
    }
    for (const g of [...tops, ...outer]) {
      if (g.sleeve_end === "covers_hand") {
        const casualKnit = list(R.F9, "casualKnits").includes(g.subcategory) && street >= 0.5;
        fire("F9_sleeves_cover_hands", "fit", casualKnit ? num(R.F9, "streetCasualKnit") : num(R.F9, "amount"), g);
        break;
      }
    }
    if (garments.some((g) => g.strain === "clear")) fire("F10_visible_strain", "fit", num(R.F10, "amount"), garments.find((g) => g.strain === "clear"));

    // ================= TUCK =================
    if (top && top.subcategory === "dress_shirt" && (top.tucked === "none" || isNone(top.tucked)) && (
      outer.some((o) => TAILORED_OUTER.has(o.subcategory))
      || (bottom !== undefined && (bottom.subcategory === "trousers" || bottom.subcategory === "suit_trousers"))
      || DRESSY.has(occasion))) {
      fire("T1_dress_shirt_untucked", "occasion", num(R.T1, "amount"), top);
    }

    // ================= PROPORTION =================
    if (top && truthy(top.volume)) {
      const vol = top.volume as number;
      const steps = pyMax(0, vlo - vol, vol - vhi);
      fire("P1_top_volume_vs_style", "proportion", num(R.P1t, "perStep") * steps, top);
    }
    if (bottom && legIndex(bottom.leg_shape) >= 0) {
      const li = legIndex(bottom.leg_shape);
      const steps = pyMax(0, llo - li, li - lhi);
      fire("P1_leg_vs_style", "proportion", num(R.P1l, "perStep") * steps, bottom);
    }
    if (top && bottom && (or(top.volume, 0) as number) >= 4 && bottom.leg_shape === "skinny") {
      fire("P2_big_top_skinny_leg", "proportion", num(R.P2, "amount"), bottom);
    }
    if (top && bottom && (or(top.volume, 0) as number) >= 4 && bottom.leg_shape === "wide" && street + gorp < num(R.P3, "streetPlusGorpBelow")) {
      fire("P3_everything_oversized", "proportion", num(R.P3, "amount"), bottom);
    }
    if (top && truthy(top.shows_below_outer) && outer.some((o) => TAILORED_OUTER.has(o.subcategory))) {
      fire("L1_shirt_hangs_below_blazer", "fit", num(R.L1, "amount"), top);
    }
    if (shoes && bottom && list(R.S1, "shoes").includes(shoes.subcategory) && list(R.S1, "legs").includes(bottom.leg_shape)) {
      fire("S1_bulky_shoe_narrow_leg", "proportion", num(R.S1, "amount"), shoes);
    }
    if (top && outer.length === 0 && (top.tucked === "none" || isNone(top.tucked)) && top.length === "mid_fly" && bottom) {
      advice.push(A.ruleOfThirds);
    }

    // ================= COLOR =================
    const colored = garments.filter((g) => truthy(g.color_family) && g.color_family !== "multicolor");
    const accents = new Map<unknown, number>();
    for (const g of colored) {
      const c = g.color_family;
      if (NEUTRALS.has(c)) continue;
      const f = fam(c);
      accents.set(f, pyMax(accents.has(f) ? accents.get(f)! : 0, MUTED.has(c) ? 0.5 : 1.0));
    }
    const nAccents = sum(Array.from(accents.values()));
    const families = new Set(colored.map((g) => fam(g.color_family)));
    if (nAccents >= num(R.C1a, "accentsAtLeast")) {
      fire("C1a_too_many_accent_colors", "color", num(R.C1a, "amount"));
    } else if (families.size >= num(R.C1b, "familiesAtLeast") && nAccents >= num(R.C1b, "accentsAtLeast")) {
      fire("C1b_too_many_colors", "color", num(R.C1b, "amount"));
    }
    const main = colored.filter((g) => MAIN_CATEGORIES.includes(g.category));
    const brightFams = new Set(main.filter((g) => isBright(g)).map((g) => fam(g.color_family)));
    const shoeBright = shoes && isBright(shoes) && !brightFams.has(fam(shoes.color_family)) ? num(R.C3, "shoeCountsAs") : 0;
    if (brightFams.size + shoeBright >= num(R.C3, "threshold")) {
      fire("C3_bright_clash", "color", boldness === "bold" || street >= 0.5 ? num(R.C3, "boldOrStreet") : num(R.C3, "amount"));
    }
    const pats = garments.filter((g) => !isNone(g.pattern) && g.pattern !== "solid");
    const nonGraphic = pats.filter((g) => g.pattern !== "graphic");
    const seen = new Map<string, { scale: unknown; n: number }>();
    for (const g of nonGraphic) {
      const key = JSON.stringify([g.pattern ?? null, g.pattern_scale ?? null]);
      const e = seen.get(key);
      if (e) e.n += 1;
      else seen.set(key, { scale: g.pattern_scale ?? null, n: 1 });
    }
    const entries = Array.from(seen.values());
    if (entries.some((e) => e.n >= 2 && !isNone(e.scale) && e.scale !== "na")) {
      fire("C4a_same_pattern_same_scale", "color", num(R.C4aS, "amount"));
    } else if (entries.some((e) => e.n >= 2)) {
      fire("C4a_same_pattern_type", "color", num(R.C4aT, "amount"));
    }
    if (pats.length >= num(R.C4b, "patternsAtLeast") && street < num(R.C4b, "streetBelow")) {
      fire("C4b_three_plus_patterns", "color", num(R.C4b, "amount"));
    }
    let focal = 0.0;
    for (const g of main) {
      if (isBright(g)) focal += 1;
      else if (MUTED.has(g.color_family)) focal += 0.5;
      if (!isNone(g.pattern) && g.pattern !== "solid"
          && (g.pattern_scale === "large" || g.pattern === "graphic" || g.pattern === "camo" || g.pattern === "floral")) {
        focal += 1;
      }
    }
    // v3: logos no longer count as focal points
    const allowance = (has(B1_ALLOWANCE, boldness) ? B1_ALLOWANCE[boldness]! : num(R.B1, "allowanceDefault"))
      + (street >= 0.5 ? num(R.B1, "streetBonus") : 0);
    if (focal > allowance) {
      fire("B1_too_many_focal_points", "color", Math.min(num(R.B1, "max"), num(R.B1, "perExtra") * Math.ceil(focal - allowance)));
    }
    if (families.size === 1) advice.push(A.tonal);
    const jacket = outer.find((o) => SEPARATE_JACKETS.has(o.subcategory));
    if (jacket && bottom && list(R.C5, "bottoms").includes(bottom.subcategory)
        && DARK_SUITING.has(jacket.color_family) && DARK_SUITING.has(bottom.color_family)
        && jacket.color_family !== bottom.color_family) {
      // v3.1 (R3): navy blazer + black trousers reads like a mismatched suit
      fire("C5_near_match_jacket_trousers", "color", num(R.C5, "amount"), jacket);
      advice.push(A.nearMatch);
    }

    // ================= OCCASION =================
    const core = garments.filter((g) => CORE_CATEGORIES.includes(g.category)).map(formality);
    if (core.length > 0) {
      const f = sum(core) / core.length;
      const [lo, hi] = occasionTarget(occasion);
      if (f < lo - num(R.O1c, "margin")) {
        fire("O1_too_casual", "occasion", Math.min(num(R.O1c, "max"), num(R.O1c, "perLevel") * nearest(lo - f)));
      } else if (f > hi + num(R.O1f, "margin")) {
        fire("O1_too_formal", "occasion", num(R.O1f, "amount"));
      }
    }
    if (bottom && LOUNGE_BOTTOMS.has(bottom.subcategory) && !LOUNGE_OK.has(occasion) && street + vintage < num(R.O4, "streetPlusVintageBelow")) {
      fire("O4_loungewear_out", "occasion", num(R.O4, "amount"), bottom); // v3: gym shorts / sweats as a day outfit
    }
    if (shoes) {
      const others = garments.filter((g) => MAIN_CATEGORIES.includes(g.category)).map(formality);
      if (others.length > 0 && maxOf(others) - formality(shoes) >= num(R.S2, "gapAtLeast") && !list(R.S2, "exempt").includes(shoes.subcategory)) {
        fire("S2_shoes_too_casual_for_outfit", "occasion", num(R.S2, "amount"), shoes);
      }
    }
    const bigLogo = garments.filter((g) => g.logo === "large");
    if (bigLogo.length > 0 && street + vintage < num(R.O3, "streetPlusVintageBelow")) {
      const prefixes = list(R.O3, "occasionPrefixes") as string[];
      if (prefixes.some((p) => occasion.startsWith(p)) && bigLogo.some((g) => g.certainty === R.O3["needsCertainty"])) {
        fire("O3_large_logo", "occasion", num(R.O3, "amount"), bigLogo.find((g) => g.certainty === R.O3["needsCertainty"]));
      } else {
        advice.push(A.bigLogo);
      }
    }
    if (DRESSY.has(occasion) && shoes
        && (shoes.subcategory === "loafer" || shoes.subcategory === "derby" || shoes.subcategory === "dress_shoe" || shoes.subcategory === "chelsea_boot")) {
      advice.push(A.belt);
    }
    // "Next level" idea only when the outfit is already clean and has no focal point
    if (fired.length === 0 && focal === 0 && boldness !== "subtle") advice.push(A.nextLevel);

    // ================= CREDITS (v3) =================
    const hidden = new Set<string>(notRated.includes("shoes") || notRated.includes("bottom half") ? ["shoes"] : []);
    const earned: [CreditId, number][] = [];
    if (outer.length > 0 || (top && KNIT_TOPS.has(top.subcategory))) earned.push(["K1_layered", credit("K1_layered")]);
    if (garments.some((g) => CORE_CATEGORIES.includes(g.category) && formality(g) >= 3)) {
      earned.push(["K2_elevated_piece", credit("K2_elevated_piece")]);
    }
    // graphic prints don't count: "graphic tee" vs "plain tee" flips between runs
    let interest = sum(main.map((g) => (isBright(g) ? 1 : MUTED.has(g.color_family) ? 0.5 : 0)));
    interest += sum(main.filter((g) => !isNone(g.pattern) && g.pattern !== "solid" && g.pattern !== "graphic" && g.pattern !== "other").map(() => 1));
    if (1 <= interest && interest <= allowance) earned.push(["K3_point_of_interest", credit("K3_point_of_interest")]);
    if (shoes && bottom) {
      const others = garments.filter((g) => MAIN_CATEGORIES.includes(g.category)).map(formality);
      if (formality(shoes) >= 2.5 && others.length > 0 && Math.abs(formality(shoes) - sum(others) / others.length) <= 0.75) {
        earned.push(["K4_shoes_complement", credit("K4_shoes_complement")]);
      }
    }
    // Score out of what's visible: credits that need hidden parts are scaled up halfway (v3.1 R4), never lost
    const visibleMax = sum(CREDITS.filter((c) => !c.needs.some((n) => hidden.has(n))).map((c) => c.points));
    const creditPts = sum(earned.map(([, p]) => p)) * (1 + CREDIT_MAX / visibleMax) / 2;
    if (trace) {
      const got = new Set(earned.map(([id]) => id));
      const held = ext.held_items ?? [];
      const heldLayer = held.findIndex((g) => g.category === "outerwear");
      const why = (id: CreditId): CreditReason => {
        switch (id) {
          case "K1_layered": return heldLayer >= 0 ? "heldNotWorn" : "noLayer";
          case "K2_elevated_piece": return "noElevated";
          case "K3_point_of_interest": return interest < 1 ? "allNeutral" : "tooMuchInterest";
          default: return !shoes ? "shoesHidden" : "shoesOff";
        }
      };
      const evidence = (id: CreditId): Garment | undefined => {
        switch (id) {
          case "K1_layered": return outer[0] ?? top;
          case "K2_elevated_piece": return garments.find((g) => CORE_CATEGORIES.includes(g.category) && formality(g) >= 3);
          case "K3_point_of_interest": return main.find((g) => isBright(g) || MUTED.has(g.color_family) || (!isNone(g.pattern) && g.pattern !== "solid" && g.pattern !== "graphic" && g.pattern !== "other"));
          default: return shoes;
        }
      };
      for (const c of CREDITS) {
        const id = c.id as CreditId;
        const ok = got.has(id);
        const reason = ok ? null : why(id);
        trace.credits.push({
          id, earned: ok, points: c.points, evidenceIndex: ok ? at(evidence(id)) : null, reason,
          heldIndex: reason === "heldNotWorn" ? heldLayer : null,
        });
      }
      trace.creditFactor = (1 + CREDIT_MAX / visibleMax) / 2;
    }

    const W = S.weights;
    const clampSub = (v: number) => Math.max(S.subMin, Math.min(S.subMax, 10.0 - v));
    const sub: Record<SubscoreName, number> = { fit: clampSub(pen.fit), color: clampSub(pen.color), proportion: clampSub(pen.proportion) };
    const base = W.fit * sub.fit + W.color * sub.color + W.proportion * sub.proportion;
    const mistakes = S.mistakeMultiplier * (10.0 - base) + S.occasionMultiplier * occAdj;
    const raw = Math.max(S.rawMin, Math.min(S.rawMax, S.baseline + creditPts - mistakes));
    return {
      overall: roundHalf(raw),
      rawScore: pyRound(raw, 3),
      rawUnrounded: raw,
      subscores: { fit: roundHalf(sub.fit), color: roundHalf(sub.color), proportion: roundHalf(sub.proportion) },
      occasionAdj: -occAdj,
      credits: earned.map(([id]) => id),
      creditPoints: pyRound(creditPts, 2),
      creditUnrounded: creditPts,
      mistakePoints: pyRound(mistakes, 2),
      mistakesUnrounded: mistakes,
      rulesFired: fired,
      advice,
      partial: notRated.length > 0,
      notRated,
    };
  }

  return {
    data, score, formality, fam, isBright, blendedBand, legIndex, legOrder: LEG_ORDER, occasionTarget,
    neutrals: NEUTRALS, loungeOk: LOUNGE_OK,
  };
}

/** The engine built from the bundled rubric (rubricData.ts = fixtures/rubric.json). */
export const defaultRubric: RubricEngine = createRubric(RUBRIC_DATA);

/** rubric.score() with the bundled rubric. Never mutates `reading`. */
export function score(reading: Reading, opts: ScoreOptions = {}): RubricResult {
  return defaultRubric.score(reading, opts);
}

export function isScored(r: RubricResult): r is import("./types").ScoredResult {
  return r.overall !== null;
}

export { roundHalf, nearest, pyRound } from "./util";
