// Exact TypeScript port of extraction-test/rubric.py (rubric v4.0), the source of truth for scores.
// "The AI sees, the code judges": this only reads the garment description. It never reads a face, body or skin.
//
// Parity rules (verified against fixtures/rubric_parity.json bit for bit, incl. ask_question for every case):
//  - same operation order as Python everywhere a float is summed or multiplied
//  - his picks are ORDERED [name, weight] pairs, folded into a Map with Python-dict semantics. Since v4 they never
//    change a score: they only choose the card label when two detected styles both fit
//  - the caller's reading is never mutated (we score a deep copy)
//  - fire() skips amounts <= 0, so a zero-amount rule is never listed
//  - Python `x in (…)` on a missing key is `None in (…)`: undefined and null both mean None here
// Numbers and tables come from RubricData (bundled rubricData.ts, or a remote rubric.json with engine == 4).

import { RUBRIC_DATA } from "./rubricData";
import type {
  Band, CreditId, DetectedStyle, Garment, NotRated, Reading, RubricData, RubricResult, RuleConfig, RuleId, Scene,
  ScoreOptions, ShoeKind, Styles, SubscoreName, TapOption, TapQuestion,
} from "./types";
import { clone, has, isNone, maxOf, or, pyMax, pyMin, pyRound, roundHalf, sum, truthy } from "./util";

/** Why a credit wasn't earned (for the "Why this score" ledger). */
export type CreditReason =
  | "heldNotWorn" | "noLayer" | "noElevated" | "allNeutral" | "tooMuchInterest" | "shoesHidden" | "shoesOff"
  /** v4: its piece already earned another credit (one garment, one credit). */
  | "usedByOther"
  /** v4: the piece that would earn it is stained or worn. */
  | "notClean";

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
  /** Score points the per-garment cap gave back (v4 R1: one garment's fit + proportion faults cost at most 1.0). */
  capReturned?: number;
  /** Points the 5.0 floor added at an ordinary occasion (v4 R3); 0 when it didn't apply. */
  floorLift?: number;
}

/** The engine version this code implements. Only load a remote rubric.json whose `engine` equals this. */
export const ENGINE_VERSION = 5;

const CORE_CATEGORIES: readonly unknown[] = ["top", "bottom", "footwear", "outerwear"];
const MAIN_CATEGORIES: readonly unknown[] = ["top", "bottom", "outerwear"];
const CREDIT_ORDER: readonly CreditId[] = ["K1_layered", "K2_elevated_piece", "K3_point_of_interest", "K4_shoes_complement"];
const SLOT: Readonly<Record<string, "upper" | "bottom" | "shoes">> = { top: "upper", outerwear: "upper", bottom: "bottom", footwear: "shoes" };
const LOOSE: readonly unknown[] = ["relaxed", "wide"];
const CLEAN_HEMS: readonly unknown[] = ["no_break", "slight_break", "cropped", "cuffed", "stacked"];
const AT_BELT: readonly unknown[] = ["at_belt", "cropped"];

export interface DetectedStyles {
  /** Styles the outfit reads as, in the rubric's fixed order. */
  detected: DetectedStyle[];
  /** The card label (look-alike rules, then his picks, then the fixed order), or null. */
  label: DetectedStyle | null;
}

export interface RubricEngine {
  readonly data: RubricData;
  score(reading: Reading, opts?: ScoreOptions, trace?: ScoreTrace): RubricResult;
  /** The one quick tap (rubric.ask_question): null, or the look-alike question to ask before the score. */
  askQuestion(reading: Reading, opts?: ScoreOptions, shoes?: boolean): TapQuestion | null;
  /** rubric.detect_styles on already-scored garments (see scoredGarments). */
  detectStyles(garments: readonly Garment[], picks?: Styles | null): DetectedStyles;
  /** The garments score() judges: filtered, leg aliases normalized, open shirts over a top re-filed as layers. */
  scoredGarments(reading: Reading): Garment[];
  /** rubric.bands_for: the default band first, then each detected style's band (leg as LEG_ORDER indices). */
  bandsFor(reading: Reading): Band[];
  /** rubric.band_steps: steps outside the nearest accepted band. which 0 = top volume, 1 = leg index. */
  bandSteps(value: number, bands: readonly Band[], which: 0 | 1): number;
  formality(g: Garment): number;
  fam(color: unknown): unknown;
  isBright(g: Garment): boolean;
  /** Index in LEG_ORDER, or -1 when the value isn't a leg shape (e.g. "na", an alias, null). */
  legIndex(leg: unknown): number;
  readonly legOrder: readonly string[];
  occasionTarget(occasion: string): readonly [number, number];
  readonly neutrals: ReadonlySet<unknown>;
  readonly loungeOk: ReadonlySet<unknown>;
  /** v4.1's shared helpers, for the parts engine (parts.ts). score() doesn't go through these; exposing them changes nothing. */
  readonly helpers: RubricHelpers;
}

/** The v4.1 helpers the parts engine reuses (parts_proto.py imports them from rubric.py). */
export interface RubricHelpers {
  /** rubric._prepare + rubric._normalize on a deep copy: the scene, the scored garments (our own copies), what isn't rated. */
  prepare(reading: Reading): { scene: Scene; garments: Garment[]; notRated: NotRated[] };
  /** rubric.Outfit(garments). */
  outfit(garments: readonly Garment[]): Outfit;
  /** rubric.STYLES[style][0](g, c): (positive, negative) for one garment. */
  role(style: DetectedStyle, g: Garment, c: Outfit): readonly [number, number];
  halfAccent(g: Garment): boolean;
  isDenim(g: Garment): boolean;
  /** The one quick tap's doubt test (rubric._doubt) for a look-alike pair: why the read may be wrong, or null. For partsTap.ts. */
  tapDoubt(reading: Reading, g: Garment, a: string, b: string): string | null;
  /** rubric._kind_pick: the type a shoe-kind answer scores as. For partsTap.ts. */
  kindPick(reading: Reading, i: number, kind: ShoeKind): string;
  /** rubric.leg_excused (v4.1, #186): wide legs that aren't "too wide". For parts v6's PB2 tip. */
  legExcused(bottom: Garment, top: Garment | undefined, outer: readonly Garment[]): boolean;
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
/** Python `None` for a missing key or JSON null, so equality between two reads matches `==`. */
const nv = (v: unknown): unknown => (v === undefined ? null : v);
const clamp01 = (x: number): number => Math.max(0.0, Math.min(1.0, x));
const pyStr = (v: unknown): string => (isNone(v) ? "None" : v === true ? "True" : v === false ? "False" : String(v));

/** The scored garments, split into slots, with the facts the style tables share (rubric.Outfit). */
export interface Outfit {
  tops: Garment[];
  outer: Garment[];
  bottom: Garment | undefined;
  shoes: Garment | undefined;
  main: Garment[];
  subs: Set<unknown>;
  bsub: unknown;
  leg: unknown;
  shoe: unknown;
  looseStreetBottom: boolean;
  techwear: boolean;
  visibleSlots: Set<string>;
  hero: Garment[];
}

type Role = (g: Garment, c: Outfit) => readonly [number, number];
type Veto = (c: Outfit) => boolean;
type Gate = (c: Outfit, slots: Map<string, number>, total: number) => boolean;

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
  const tset = (xs: readonly string[]): Set<unknown> => new Set<unknown>(xs);

  const FORMALITY = new Map<unknown, number>(Object.entries(T.FORMALITY));
  const DARK_JEANS = tset(T.DARK_JEANS);
  const TAILORED_OUTER = tset(T.TAILORED_OUTER);
  const SEPARATE_JACKETS = tset(T.SEPARATE_JACKETS);
  const DARK_SUITING = tset(T.DARK_SUITING);
  const OCCASION_TARGET = new Map<unknown, number[]>(Object.entries(T.OCCASION_TARGET));
  const OCCASION_DEFAULT = T.OCCASION_DEFAULT;
  const DRESSY = tset(T.DRESSY_OCCASIONS);
  const OCCASION_FIRST = tset(T.OCCASION_FIRST);
  const FLOOR_OCCASIONS = tset(T.FLOOR_OCCASIONS);
  const ATHLETIC_AS_CASUAL = tset(T.ATHLETIC_AS_CASUAL);
  const LEG_ORDER = T.LEG_ORDER;
  const LEG_ALIAS = new Map<unknown, string>(Object.entries(T.LEG_ALIAS));
  const STYLE_BANDS = new Map(Object.entries(T.STYLE_BANDS));
  const DEFAULT_BAND = T.DEFAULT_BAND;
  const NEUTRALS = tset(T.NEUTRALS);
  const MUTED = tset(T.MUTED);
  const ALWAYS_BRIGHT = tset(T.ALWAYS_BRIGHT);
  const HUE_DEPENDS = tset(T.HUE_DEPENDS);
  const FAMILY = new Map<unknown, string>(Object.entries(T.FAMILY));
  const LOUNGE_BOTTOMS = tset(T.LOUNGE_BOTTOMS);
  const LOUNGE_OK = tset(T.LOUNGE_OK);
  const KNIT_TOPS = tset(T.KNIT_TOPS);
  const TECH_LAYERS = tset(T.TECH_LAYERS);
  const LAYER_SHIRTS = tset(T.LAYER_SHIRTS);
  const DRESSED_OUTER = tset(T.DRESSED_OUTER);
  const DRESSED_TOPS = tset(T.DRESSED_TOPS);
  const NOT_REAL_SHOES = tset(T.NOT_REAL_SHOES);
  const CREDITS = T.CREDITS;
  const CREDIT_MAX = S.creditMax;
  const MULT = S.mult;
  const credit = (id: CreditId): number => {
    const c = CREDITS.find((x) => x.id === id);
    if (!c) throw new Error(`rubric.json: missing credit ${id}`);
    return c.points;
  };
  const D = (name: string): Set<unknown> => {
    const v = data.styles.sets[name];
    if (!v) throw new Error(`rubric.json: missing style set ${name}`);
    return tset(v);
  };
  const STYLE_ORDER = data.styles.order;
  const PICK_ALIAS = data.styles.pickAlias;
  const TAP_PAIRS = data.tap.pairs;
  const TAP_LABEL = data.tap.labels;

  const ATHLETIC_BOTTOMS = D("ATHLETIC_BOTTOMS"), DRESS_SHOES = D("DRESS_SHOES"), COLLARED = D("COLLARED"), DARK_TECH = D("DARK_TECH");
  const ST_TOP_A = D("ST_TOP_A"), ST_OUT_A = D("ST_OUT_A"), ST_OUT_H = D("ST_OUT_H"), ST_SHOE_A = D("ST_SHOE_A"), ST_SHOE_H = D("ST_SHOE_H");
  const ST_STREET_SHOES = D("ST_STREET_SHOES"), ST_VETO = D("ST_VETO"), PREP_TOPS = D("PREP_TOPS");
  const EARTH_OUTER = D("EARTH_OUTER"), WW_VETO = D("WW_VETO"), WW_NEG = D("WW_NEG");
  const RETRO_SHOES = D("RETRO_SHOES"), VS_BOTTOM_H = D("VS_BOTTOM_H");
  const OUT_A = D("OUT_A"), OUT_H = D("OUT_H"), OUT_VETO = D("OUT_VETO");
  const NEUT_MIN = D("NEUT_MIN"), MIN_HOME_UP = D("MIN_HOME_UP"), MIN_HOME_BOTTOM = D("MIN_HOME_BOTTOM"), MIN_HOME_SHOES = D("MIN_HOME_SHOES");
  const MIN_AGAINST_SHOES = D("MIN_AGAINST_SHOES"), PRESSED = D("PRESSED");
  const PREP_ANCHOR_UP = D("PREP_ANCHOR_UP"), PREP_HOME_UP = D("PREP_HOME_UP"), PREP_HOME_BOTTOM = D("PREP_HOME_BOTTOM");
  const PREP_HOME_SHOES = D("PREP_HOME_SHOES"), PREP_VETO = D("PREP_VETO"), PREP_CASUAL_TOPS = D("PREP_CASUAL_TOPS");
  const SC_ANCHOR_UP = D("SC_ANCHOR_UP"), SC_HOME_UP = D("SC_HOME_UP"), SC_ANCHOR_SHOES = D("SC_ANCHOR_SHOES"), SC_VETO = D("SC_VETO");
  const JEANS_FAMILY = D("JEANS_FAMILY"), DARK_NONDENIM = D("DARK_NONDENIM");

  const R = {
    F4: rule("F4_pooling"), F4d: rule("F4_hem_drags_over_slides"), F4b: rule("F4b_full_break_narrow_leg"), F7: rule("F7_care"),
    F6: rule("F6_top_too_long"), F8: rule("F8_too_big"), F9: rule("F9_sleeves_cover_hands"), F10: rule("F10_visible_strain"),
    T1: rule("T1_dress_shirt_untucked"), P1t: rule("P1_top_volume_vs_style"), P1l: rule("P1_leg_vs_style"),
    P2: rule("P2_big_top_skinny_leg"), P3: rule("P3_everything_oversized"), L1: rule("L1_shirt_hangs_below_blazer"),
    S1: rule("S1_bulky_shoe_narrow_leg"), C1a: rule("C1a_too_many_accent_colors"), C1b: rule("C1b_too_many_colors"),
    C3: rule("C3_bright_clash"), C4aS: rule("C4a_same_pattern_same_scale"), C4aT: rule("C4a_same_pattern_type"),
    C4b: rule("C4b_three_plus_patterns"), B1: rule("B1_too_many_focal_points"), C5: rule("C5_near_match_jacket_trousers"),
    O1c: rule("O1_too_casual"), O1f: rule("O1_too_formal"), O4: rule("O4_loungewear_out"),
    S2: rule("S2_shoes_too_casual_for_outfit"), O3: rule("O3_large_logo"),
  };
  const B1_ALLOWANCE = R.B1["allowance"] as Record<string, number>;
  const O1_STARTS = list(R.O1c, "levelStarts") as number[];
  const LADDER = list(R.O4, "ladder") as number[];

  const legIndex = (leg: unknown): number => LEG_ORDER.indexOf(leg as string);
  const fam = (c: unknown): unknown => (FAMILY.has(c) ? FAMILY.get(c) : c);
  const sub = (g: Garment | undefined | null): unknown => (g ? nv(g.subcategory) : null);
  const anyIn = (xs: Set<unknown>, ys: Set<unknown>): boolean => {
    for (const x of xs) if (ys.has(x)) return true;
    return false;
  };

  function bandIndex(b: { volume: number[]; leg: string[] }): Band {
    return [[b.volume[0]!, b.volume[1]!], [legIndex(b.leg[0]), legIndex(b.leg[1])]];
  }

  function bandSteps(value: number, bands: readonly Band[], which: 0 | 1): number {
    return Math.min(...bands.map((b) => pyMax(0, b[which][0] - value, value - b[which][1])));
  }

  function isBright(g: Garment): boolean {
    const c = g.color_family;
    if (ALWAYS_BRIGHT.has(c)) return g.saturation !== "muted";
    if (HUE_DEPENDS.has(c)) return g.saturation === "bright";
    return false;
  }

  /** Half an accent in the penalty counts: burgundy/sage, or any non-neutral read as muted. */
  function halfAccent(g: Garment): boolean {
    const c = g.color_family;
    if (MUTED.has(c)) return true;
    return !NEUTRALS.has(c) && c !== "multicolor" && g.saturation === "muted" && !isBright(g);
  }

  const isDenim = (g: Garment): boolean =>
    g.subcategory === "jeans" || g.subcategory === "denim_jacket" || g.subcategory === "denim_shirt"
    || String(g.color_family ?? "").startsWith("denim");

  function formality(g: Garment): number {
    let f = FORMALITY.has(g.subcategory) ? FORMALITY.get(g.subcategory)! : S.formalityDefault;
    if (g.subcategory === "jeans" && DARK_JEANS.has(g.color_family) && !truthy(g.distressed_by_design)) {
      f = S.darkUndistressedJeans;
    }
    return f;
  }

  function occasionTarget(occasion: string): readonly [number, number] {
    const t = OCCASION_TARGET.has(occasion) ? OCCASION_TARGET.get(occasion)! : OCCASION_DEFAULT;
    return [t[0]!, t[1]!];
  }

  // ================= STYLE DETECTION =================
  function outfitOf(gs: readonly Garment[]): Outfit {
    const tops = gs.filter((g) => g.category === "top");
    const outer = gs.filter((g) => g.category === "outerwear");
    const bottom = gs.find((g) => g.category === "bottom");
    const shoes = gs.find((g) => g.category === "footwear");
    const main = gs.filter((g) => has(SLOT, g.category as string));
    const bsub = sub(bottom);
    const leg = bottom ? nv(bottom.leg_shape) : null;
    const shoe = sub(shoes);
    const nonshoe = main.filter((g) => g.category !== "footwear");
    const c: Outfit = {
      tops, outer, bottom, shoes, main, subs: new Set(main.map((g) => nv(g.subcategory))), bsub, leg, shoe,
      looseStreetBottom: (bsub === "jeans" || bsub === "cargos" || bsub === "work_pants") && LOOSE.includes(leg),
      techwear: outer.some((o) => o.subcategory === "shell_jacket" || o.subcategory === "rain_jacket")
        && (bsub === "cargos" || bsub === "technical_pants") && nonshoe.every((g) => DARK_TECH.has(g.color_family)),
      visibleSlots: new Set(main.map((g) => SLOT[g.category as string]!)),
      hero: [],
    };
    for (const g of main) {
      const s = g.subcategory;
      if (s === "jersey" && g.category === "top") c.hero.push(g);
      else if (s === "rugby_shirt" && (bsub === "jeans" || bsub === "cargos" || ATHLETIC_BOTTOMS.has(bsub)
        || (bsub === null && RETRO_SHOES.has(shoe)))) c.hero.push(g); // ruling 26: the bottom decides
      else if (s === "track_jacket" || s === "track_pants") c.hero.push(g);
    }
    return c;
  }
  const isHero = (c: Outfit, g: Garment): boolean => c.hero.includes(g);
  const families = (gs: readonly Garment[]): Set<unknown> =>
    new Set(gs.filter((g) => truthy(g.color_family) && g.color_family !== "multicolor").map((g) => fam(g.color_family)));
  const vol = (g: Garment, d: number): number => or(g.volume, d) as number;

  const roleStreet: Role = (g, c) => {
    const s = g.subcategory, cat = g.category, v = vol(g, 3);
    if (cat === "top") {
      if (ST_TOP_A.has(s)) return [2, 0];
      if ((s === "tee" || s === "tank_top" || s === "jersey" || s === "flannel_shirt") && c.looseStreetBottom) return [1, 0];
      if (s === "tee" && v >= 4) return [1, 0];
      if (s === "fleece") return [1, 0];
      return [0, 0];
    }
    if (cat === "outerwear") {
      if (ST_OUT_A.has(s)) return [2, 0];
      if ((s === "shell_jacket" || s === "rain_jacket") && c.techwear) return [2, 0];
      if (ST_OUT_H.has(s)) return [1, 0];
      if (v >= 4 && s !== "chore_coat" && s !== "field_jacket" && s !== "overshirt" && s !== "overcoat") return [1, 0];
      return [0, 0];
    }
    if (cat === "bottom") {
      if ((s === "jeans" || s === "cargos" || s === "work_pants") && LOOSE.includes(g.leg_shape)) return [2, 0];
      if (s === "cargos") return [1, 0];
      if (s === "shorts" && LOOSE.includes(g.leg_shape)) return [1, 0];
      if (ATHLETIC_BOTTOMS.has(s) && ST_STREET_SHOES.has(c.shoe)) return [1, 0]; // sweats count only with a street shoe
      if (s === "chinos") return [0, -1];
      return [0, 0];
    }
    if (ST_SHOE_A.has(s)) return [2, 0];
    if (ST_SHOE_H.has(s)) return [1, 0];
    return [0, 0];
  };
  const vetoStreet: Veto = (c) => anyIn(c.subs, ST_VETO) || DRESS_SHOES.has(c.shoe) || c.leg === "skinny"
    || (c.tops.length > 0 && PREP_TOPS.has(c.tops[0]!.subcategory) && c.outer.length === 0);
  const gateStreet: Gate = (c, slots, total) => {
    const volume = LOOSE.includes(c.leg) || c.techwear || [...c.tops, ...c.outer].some((g) => vol(g, 0) >= 4);
    return volume && (slots.get("upper") ?? 0) > 0 && total >= 4;
  };

  const roleWork: Role = (g, c) => {
    const s = g.subcategory, col = g.color_family;
    const neg = (WW_NEG.has(s) ? -1 : 0) + (g.logo === "large" ? -1 : 0) + (vol(g, 3) >= 5 ? -1 : 0);
    let pos = 0;
    if (s === "chore_coat" || s === "work_boot" || s === "work_pants") pos = 2;
    else if ((s === "field_jacket" || s === "denim_jacket") && EARTH_OUTER.has(col)) pos = 2;
    else if (s === "flannel_shirt" && (c.bsub === "jeans" || c.bsub === "cargos" || c.bsub === "work_pants")) pos = 2;
    else if (s === "field_jacket" || s === "denim_jacket" || s === "overshirt" || s === "flannel_shirt" || s === "suede_chukka"
      || s === "cargos" || s === "leather_jacket" || s === "denim_shirt") pos = 1;
    else if (s === "jeans" && g.leg_shape !== "skinny") pos = 1;
    return [pos, neg];
  };
  const vetoWork: Veto = (c) => anyIn(c.subs, WW_VETO) || c.main.filter((g) => g.category !== "footwear" && isBright(g)).length >= 2;

  const roleVintage: Role = (g, c) => {
    const s = g.subcategory, cat = g.category;
    if (isHero(c, g)) return [2, 0];
    if (cat === "footwear") {
      if (RETRO_SHOES.has(s)) return [1, 0];
      if (ST_SHOE_A.has(s) || s === "slides_sandals") return [0, -1];
      if (s === "performance_runner" && ATHLETIC_BOTTOMS.has(c.bsub)) return [0, -1]; // training kit
      return [0, 0];
    }
    if (cat === "bottom" && VS_BOTTOM_H.has(s) && g.leg_shape !== "skinny") return [1, 0];
    return [0, 0];
  };
  const vetoVintage: Veto = (c) => (c.bsub === "athletic_shorts" && c.tops.some((t) => t.subcategory === "jersey"))
    || (c.tops.length > 0 && c.tops.every((t) => t.subcategory === "tank_top") && c.outer.length === 0);
  const gateVintage: Gate = (c) => c.hero.length > 0;

  const roleOutdoor: Role = (g) => {
    const s = g.subcategory;
    if (OUT_A.has(s)) return [2, 0];
    if (OUT_H.has(s)) return [1, 0];
    if (s === "work_boot" || s === "chore_coat" || s === "denim_jacket") return [0, -1];
    return [0, 0];
  };
  const vetoOutdoor: Veto = (c) => anyIn(c.subs, OUT_VETO);

  function paletteMin(c: Outfit): boolean {
    for (const g of c.main) {
      const col = g.color_family;
      if (g.category === "footwear" && col === "multicolor") continue; // counted as "against" instead
      if (!NEUT_MIN.has(col)) return false;
    }
    if (c.main.some((g) => isBright(g))) return false;
    if (c.main.filter((g) => !NEUTRALS.has(g.color_family) && g.color_family !== "multicolor").length >= 2) return false;
    return families(c.main).size <= 3;
  }
  const roleMin: Role = (g) => {
    const s = g.subcategory, cat = g.category;
    if (cat === "footwear") {
      const neg = 0 - ((MIN_AGAINST_SHOES.has(s) ? 1 : 0) + (g.color_family === "multicolor" ? 1 : 0));
      return [MIN_HOME_SHOES.has(s) ? 1 : 0, neg];
    }
    const neg = 0 - ((g.logo === "small" ? 1 : 0) + (g.pattern === "other" ? 1 : 0));
    if (cat === "bottom") {
      if (LOOSE.includes(g.leg_shape) && CLEAN_HEMS.includes(g.hem)) return [2, neg];
      if (g.leg_shape === "straight" && PRESSED.has(s)) return [2, neg];
      return [MIN_HOME_BOTTOM.has(s) ? 1 : 0, neg];
    }
    if (vol(g, 3) >= 4 && AT_BELT.includes(g.length)) return [2, neg]; // boxy, cropped top
    return [MIN_HOME_UP.has(s) ? 1 : 0, neg];
  };
  const vetoMin: Veto = (c) => {
    for (const g of c.main) {
      const p = g.pattern;
      if (p === "graphic" || p === "camo" || p === "floral" || p === "checks_plaid") return true;
      if (g.logo === "large") return true;
      if (g.color_family === "denim_mid" || g.color_family === "denim_light") return true;
      if (g.category !== "footwear" && !isDenim(g) && truthy(g.distressed_by_design)) return true;
    }
    if (ATHLETIC_BOTTOMS.has(c.bsub)) return true;
    if (c.subs.has("suit_jacket") || c.subs.has("blazer") || c.subs.has("sport_coat")) return true;
    if (!paletteMin(c)) return true;
    const t0 = c.tops[0];
    return t0 !== undefined && (COLLARED.has(t0.subcategory) || t0.subcategory === "quarter_zip") && vol(t0, 3) < 4
      && (c.leg === "skinny" || c.leg === "slim" || c.leg === "straight");
  };
  const bonusMin = (c: Outfit): readonly [number, boolean] => (families(c.main).size <= 2 ? [1, true] : [0, false]);

  const rolePrep: Role = (g, c) => {
    const s = g.subcategory, cat = g.category;
    if (cat === "top" || cat === "outerwear") {
      if (PREP_ANCHOR_UP.has(s)) return [2, 0];
      if (s === "rugby_shirt" && !isHero(c, g)) return [2, 0];
      if (PREP_HOME_UP.has(s)) return [1, 0];
      return [0, 0];
    }
    if (cat === "bottom") return [PREP_HOME_BOTTOM.has(s) ? 1 : 0, 0];
    return [PREP_HOME_SHOES.has(s) ? 1 : 0, 0];
  };
  const vetoPrep: Veto = (c) => {
    if (anyIn(c.subs, PREP_VETO)) return true;
    const tailored = c.outer.some((o) => SEPARATE_JACKETS.has(o.subcategory));
    if (!tailored && c.tops.some((t) => PREP_CASUAL_TOPS.has(t.subcategory))) return true;
    if (c.tops.some((t) => vol(t, 3) >= 4)) return true;
    if (c.bottom && ((c.bsub === "jeans" && LOOSE.includes(c.leg)) || truthy(c.bottom.distressed_by_design))) return true;
    return c.hero.length > 0 && c.hero.every((h) => h.subcategory === "rugby_shirt");
  };

  const roleSc: Role = (g) => {
    const s = g.subcategory, cat = g.category, col = g.color_family;
    if (cat === "top" || cat === "outerwear") return [SC_ANCHOR_UP.has(s) ? 2 : SC_HOME_UP.has(s) ? 1 : 0, 0];
    if (cat === "bottom") {
      if (s === "chinos" || s === "trousers" || s === "suit_trousers") return [2, 0];
      if (s === "drawstring_trousers" || (s === "jeans" && (col === "denim_dark" || col === "black" || col === "charcoal"))) return [1, 0];
      return [0, 0];
    }
    return [SC_ANCHOR_SHOES.has(s) ? 2 : s === "low_profile_sneaker" || s === "dress_shoe" ? 1 : 0, 0];
  };
  const vetoSc: Veto = (c) => {
    if (anyIn(c.subs, SC_VETO)) return true;
    if (c.main.some((g) => g.logo === "large" || g.pattern === "camo" || vol(g, 3) >= 5)) return true;
    if (c.subs.has("tank_top") && c.outer.length === 0) return true;
    const sj = c.outer.filter((g) => g.subcategory === "suit_jacket");
    return sj.length > 0 && c.bottom !== undefined && (c.bsub === "suit_trousers" || c.bsub === "trousers")
      && nv(c.bottom.color_family) === nv(sj[0]!.color_family);
  };
  const gateSc: Gate = (c, slots, total) =>
    ((slots.get("upper") ?? 0) > 0 || (slots.get("bottom") ?? 0) === 2) && total >= (c.shoes ? 4 : 3);

  const STYLES: Record<DetectedStyle, { role: Role; veto: Veto; gate?: Gate; bonus?: (c: Outfit) => readonly [number, boolean] }> = {
    streetwear: { role: roleStreet, veto: vetoStreet, gate: gateStreet },
    workwear: { role: roleWork, veto: vetoWork },
    vintage_sport: { role: roleVintage, veto: vetoVintage, gate: gateVintage },
    outdoor: { role: roleOutdoor, veto: vetoOutdoor },
    minimalist: { role: roleMin, veto: vetoMin, bonus: bonusMin },
    classic_prep: { role: rolePrep, veto: vetoPrep },
    smart_casual: { role: roleSc, veto: vetoSc, gate: gateSc },
  };

  function evaluate(style: DetectedStyle, c: Outfit): boolean {
    const st = STYLES[style];
    if (!st) return false;
    if (st.veto(c)) return false;
    const slots = new Map<string, number>();
    let neg = 0;
    let anchors = 0;
    for (const g of c.main) {
      const [p, n] = st.role(g, c);
      const sl = SLOT[g.category as string]!;
      if (p > 0) {
        slots.set(sl, Math.max(slots.get(sl) ?? 0, p));
        if (p === 2) anchors += 1;
      }
      if (n < 0) neg += n;
    }
    const [b, bSlot] = st.bonus ? st.bonus(c) : [0, false];
    const total = sum(Array.from(slots.values())) + neg + b;
    const nslots = slots.size + (bSlot && b > 0 ? 1 : 0);
    const need = c.visibleSlots.size >= 3 ? 3 : 2;
    return anchors >= 1 && nslots >= 2 && total >= need && (st.gate ? st.gate(c, slots, total) : true);
  }

  function prepMarker(c: Outfit): boolean {
    if (c.subs.has("rugby_shirt") || c.subs.has("cardigan")) return true;
    const collared = [...c.tops, ...c.outer].filter((g) => COLLARED.has(g.subcategory));
    if (collared.length > 0 && c.bsub === "shorts") return true;
    for (const g of [...collared, ...(c.bsub === "shorts" && c.bottom ? [c.bottom] : [])]) {
      if ((g.pattern === "stripes" || g.pattern === "checks_plaid") && (g.pattern_scale === "medium" || g.pattern_scale === "large")) return true;
      if (!NEUTRALS.has(g.color_family) && g.color_family !== "multicolor") return true;
    }
    return c.outer.some((o) => SEPARATE_JACKETS.has(o.subcategory)) && (c.bsub === "chinos" || c.bsub === "jeans");
  }

  function label(detected: readonly DetectedStyle[], c: Outfit, picks: Map<string, number>): DetectedStyle | null {
    const cs = new Set<DetectedStyle>(detected);
    const drop = (loser: DetectedStyle, winner: DetectedStyle) => {
      if (cs.has(loser) && cs.has(winner)) cs.delete(loser);
    };
    const technicalOuter = c.outer.some((o) => TECH_LAYERS.has(o.subcategory) && o.subcategory !== "puffer");
    if (cs.has("outdoor") && cs.has("streetwear")) { // ruling 27
      if (c.shoe === "trail_shoe" || !ST_SHOE_A.has(c.shoe)) drop("streetwear", "outdoor");
      else drop("outdoor", "streetwear");
    }
    if (cs.has("outdoor") && cs.has("workwear")) { // ruling 28
      if (c.shoe === "trail_shoe" || technicalOuter) drop("workwear", "outdoor");
      else drop("outdoor", "workwear");
    }
    if (cs.has("workwear") && cs.has("streetwear")) { // chore coat over a hoodie: the shoe decides
      const streetUpper = c.tops.some((t) => ST_TOP_A.has(t.subcategory)) || c.outer.some((o) => ST_OUT_A.has(o.subcategory));
      if (streetUpper && (ST_SHOE_A.has(c.shoe) || c.shoe === "canvas_sneaker")) drop("workwear", "streetwear");
      else drop("streetwear", "workwear");
    }
    if (cs.has("classic_prep") && cs.has("smart_casual")) { // ruling 31
      if (prepMarker(c)) drop("smart_casual", "classic_prep");
      else drop("classic_prep", "smart_casual");
    }
    if (cs.has("minimalist") && cs.has("classic_prep") && families(c.main).size <= 2 && LOOSE.includes(c.leg)) {
      drop("classic_prep", "minimalist");
    }
    const ranked = STYLE_ORDER.filter((s) => cs.has(s));
    if (ranked.length > 1 && picks.size > 0) {
      const pw = new Map<string, number>();
      for (const [k0, v] of picks) {
        const k = has(PICK_ALIAS, k0) ? PICK_ALIAS[k0]! : k0;
        pw.set(k, (pw.get(k) ?? 0) + v);
      }
      const picked = ranked.filter((s) => (pw.get(s) ?? 0) > 0);
      if (picked.length > 0) {
        let best = picked[0]!;
        for (const s of picked) if (pw.get(s)! > pw.get(best)!) best = s; // ties: the earlier in the fixed order
        return best;
      }
    }
    return ranked[0] ?? null;
  }

  function detectWith(c: Outfit, picks: Map<string, number>): DetectedStyles {
    const detected = STYLE_ORDER.filter((s) => evaluate(s, c));
    return { detected, label: label(detected, c, picks) };
  }

  function detectStyles(garments: readonly Garment[], picks?: Styles | null): DetectedStyles {
    return detectWith(outfitOf(garments), stylesMap(picks));
  }

  /** v4.1 (#186): wide legs aren't "too wide" when they're jeans or cargos, or when the top half is close or short
   * ("big pants, little shirt"). Under a layer, the layer decides; never for loungewear bottoms. */
  function legExcused(bottom: Garment, top: Garment | undefined, outer: readonly Garment[]): boolean {
    if (!LOOSE.includes(bottom.leg_shape)) return false;
    if (list(R.P1l, "freeLoose").includes(bottom.subcategory)) return true;
    if (LOUNGE_BOTTOMS.has(bottom.subcategory)) return false;
    const short = list(R.P1l, "shortLengths"), maxVol = num(R.P1l, "closeTopMaxVolume");
    const o = outer[0];
    if (o) return vol(o, 3) <= maxVol || short.includes(o.length);
    return !!top && (vol(top, 3) <= maxVol || short.includes(top.length) || top.tucked === "full");
  }

  // ================= PREPARE =================
  function prepare(ext: Reading): { scene: Scene; garments: Garment[]; notRated: NotRated[] } {
    const scene: Scene = (truthy(ext.scene) ? ext.scene : {}) as Scene;
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
    return { scene, garments, notRated };
  }

  /** In place on our own copy: leg aliases; an open shirt/fleece worn over another top is a layer (ruling 43). */
  function normalize(garments: Garment[]): void {
    for (const g of garments) {
      if (LEG_ALIAS.has(g.leg_shape)) {
        g.leg_shape_raw = g.leg_shape as string;
        g.leg_shape = LEG_ALIAS.get(g.leg_shape)!;
      }
    }
    const tops = garments.filter((g) => g.category === "top");
    if (tops.length >= 2) {
      const inner = tops.find((g) => !LAYER_SHIRTS.has(g.subcategory)) ?? tops[tops.length - 1]!;
      for (const g of tops) {
        if (g !== inner && LAYER_SHIRTS.has(g.subcategory)) {
          g.category = "outerwear";
          g["recategorized"] = "top->outerwear";
        }
      }
    }
  }

  function scoredGarments(reading: Reading): Garment[] {
    const { scene, garments } = prepare(clone(reading));
    if (scene.clothed !== "fully" || garments.length === 0) return [];
    normalize(garments);
    return garments;
  }

  function bandsFor(reading: Reading): Band[] {
    const det = detectStyles(scoredGarments(reading)).detected;
    return [bandIndex(DEFAULT_BAND), ...det.map((s) => bandIndex(STYLE_BANDS.get(s)!))];
  }

  // ================= SCORE =================
  function score(reading: Reading, opts: ScoreOptions = {}, trace?: ScoreTrace): RubricResult {
    const occasion: string = opts.occasion ?? "everyday";
    const boldness: string = opts.boldness ?? "a_little";
    const picks = stylesMap(opts.styles);
    const ext = clone(reading); // never touch the caller's reading
    // Original positions survive the filters (same objects), for the ledger's evidence indices.
    const origIndex = new Map<Garment, number>();
    (ext.garments ?? []).forEach((g, i) => origIndex.set(g, i));
    const at = (g: Garment | undefined | null): number | null => (g ? (origIndex.get(g) ?? null) : null);
    const { scene, garments, notRated } = prepare(ext);
    if (scene.clothed !== "fully") {
      return { overall: null, reason: "not_fully_clothed", partial: false, rulesFired: [] };
    }
    if (garments.length === 0) {
      return { overall: null, reason: "nothing_readable", partial: true, rulesFired: [] };
    }
    normalize(garments);

    const pen: Record<SubscoreName, number> = { fit: 0.0, color: 0.0, proportion: 0.0 };
    let occAdj = 0.0;
    const fired: RuleId[] = [];
    const advice: string[] = [];
    const traced: [SubscoreName | "occasion", number, string | null][] = [];
    /** capKey: the slot ("top", "bottom", "shoes") a fit/proportion penalty is traced to, for the per-garment cap. */
    const fire = (id: RuleId, s: SubscoreName | "occasion", amount: number, culprit: Garment | null | undefined, capKey: string | null): void => {
      if (amount <= 0) return;
      if (rules[id]?.enabled === false) return; // remote kill switch; every rule is enabled in v4.0
      if (s === "occasion") occAdj += amount;
      else pen[s] += amount;
      fired.push(id);
      traced.push([s, amount, capKey]);
      trace?.rules.push({ id, sub: s, amount, culpritIndex: at(culprit) });
    };

    const tops = garments.filter((g) => g.category === "top");
    const top: Garment | undefined = tops[0];
    const bottom = garments.find((g) => g.category === "bottom");
    const shoes = garments.find((g) => g.category === "footwear");
    const outer = garments.filter((g) => g.category === "outerwear");

    // ---- what the outfit is going for (detected in code; widens what's allowed, never adds a penalty)
    const outfit = outfitOf(garments);
    const { detected: det, label: styleLabel } = detectWith(outfit, picks);
    const occFirst = OCCASION_FIRST.has(occasion);
    const street = det.includes("streetwear");
    const vintage = det.includes("vintage_sport");
    const minimal = det.includes("minimalist");
    const outdoor = det.includes("outdoor");
    const athletic = !!bottom && LOUNGE_BOTTOMS.has(bottom.subcategory);
    const looseDenim = !!bottom && (bottom.subcategory === "jeans" || bottom.subcategory === "cargos" || bottom.subcategory === "work_pants")
      && LOOSE.includes(bottom.leg_shape);

    // ================= FIT =================
    if (bottom) {
      const hem = bottom.hem;
      const slides = !!shoes && list(R.F4d, "shoes").includes(shoes.subcategory);
      if (looseDenim && slides && list(R.F4d, "hems").includes(hem)) {
        fire("F4_hem_drags_over_slides", "fit", num(R.F4d, "amount"), bottom, "bottom"); // the hem has nothing to sit on
      } else if (hem === "pooling") {
        fire("F4_pooling", "fit", athletic || looseDenim ? num(R.F4, "looseOrAthletic") : num(R.F4, "amount"), bottom, "bottom");
      }
    }
    if (bottom && bottom.hem === "full_break" && list(R.F4b, "legs").includes(bottom.leg_shape) && bottom.certainty === R.F4b["needsCertainty"]) {
      fire("F4b_full_break_narrow_leg", "fit", num(R.F4b, "amount"), bottom, "bottom");
    }
    let care = 0.0;
    let careCulprit: Garment | null = null;
    const careSet = new Set<Garment>();
    for (const g of garments) {
      const c = g.condition;
      if (truthy(g.distressed_by_design) && c === "pilled_or_worn") continue; // by design excuses wear, never stains or wrinkles
      if (careCulprit === null && (c === "wrinkled" || (c === "stained" && g.certainty === "clear") || c === "pilled_or_worn")) careCulprit = g;
      if (c === "wrinkled") {
        care += num(R.F7, "wrinkled");
      } else if (c === "stained" && g.certainty === "clear") {
        care += num(R.F7, "stainedClear");
        careSet.add(g);
      } else if (c === "pilled_or_worn") {
        const boot = g.category === "footwear" && g.subcategory === "work_boot"; // broken-in boots: half price
        care += boot ? num(R.F7, "wornWorkBoot") : num(R.F7, "pilledOrWorn");
        careSet.add(g);
      }
    }
    if (truthy(care)) fire("F7_care", "fit", Math.min(care, num(R.F7, "cap")), careCulprit, null);
    const streetTopOverLoose = street && !!top && list(R.F8, "streetTops").includes(top.subcategory) && bottom !== undefined
      && LOOSE.includes(bottom.leg_shape);
    if (top && (isNone(top.tucked) || top.tucked === "none" || top.tucked === "na") && top.length === "below_crotch"
        && vol(top, num(R.F6, "volumeDefault")) < num(R.F6, "volumeBelow")) {
      fire("F6_top_too_long", "fit", num(R.F6, "amount"), top, "top");
    }
    if (top && vol(top, num(R.F8, "volumeDefault")) >= num(R.F8, "volumeAtLeast") && !streetTopOverLoose
        && (top.sleeve_end === "covers_hand" || top.length === "below_crotch")) {
      fire("F8_too_big", "fit", num(R.F8, "amount"), top, "top");
    }
    for (const g of [...tops, ...outer]) {
      if (g.sleeve_end === "covers_hand") {
        const casualKnit = list(R.F9, "casualKnits").includes(g.subcategory) && street;
        fire("F9_sleeves_cover_hands", "fit", casualKnit ? num(R.F9, "streetCasualKnit") : num(R.F9, "amount"), g, "top");
        break;
      }
    }
    if (garments.some((g) => g.strain === "clear")) {
      fire("F10_visible_strain", "fit", num(R.F10, "amount"), garments.find((g) => g.strain === "clear"), null);
    }

    // ================= TUCK =================
    if (top && top.subcategory === "dress_shirt" && (top.tucked === "none" || isNone(top.tucked)) && (
      outer.some((o) => TAILORED_OUTER.has(o.subcategory))
      || (bottom !== undefined && (bottom.subcategory === "trousers" || bottom.subcategory === "suit_trousers"))
      || DRESSY.has(occasion))) {
      fire("T1_dress_shirt_untucked", "occasion", num(R.T1, "amount"), top, "top");
    }

    // ================= PROPORTION =================
    const bands: Band[] = [bandIndex(DEFAULT_BAND), ...det.map((s) => bandIndex(STYLE_BANDS.get(s)!))]; // widen only
    if (top && truthy(top.volume)) {
      fire("P1_top_volume_vs_style", "proportion", num(R.P1t, "perStep") * bandSteps(top.volume as number, bands, 0), top, "top");
    }
    if (bottom && legIndex(bottom.leg_shape) >= 0 && !legExcused(bottom, top, outer)) {
      fire("P1_leg_vs_style", "proportion", num(R.P1l, "perStep") * bandSteps(legIndex(bottom.leg_shape), bands, 1), bottom, "bottom");
    }
    if (top && bottom && vol(top, 0) >= 4 && bottom.leg_shape === "skinny") {
      fire("P2_big_top_skinny_leg", "proportion", num(R.P2, "amount"), bottom, "top");
    }
    const p3Skip = street || outdoor || (vintage && top !== undefined && isHero(outfit, top))
      || (minimal && ((!!top && AT_BELT.includes(top.length)) || (!!bottom && PRESSED.has(bottom.subcategory))))
      || (!!top && AT_BELT.includes(top.length));
    if (top && bottom && vol(top, 0) >= 4 && bottom.leg_shape === "wide" && !p3Skip) {
      fire("P3_everything_oversized", "proportion", num(R.P3, "amount"), bottom, null);
    }
    if (top && truthy(top.shows_below_outer) && outer.some((o) => TAILORED_OUTER.has(o.subcategory))) {
      fire("L1_shirt_hangs_below_blazer", "fit", num(R.L1, "amount"), top, "top");
    }
    if (shoes && bottom && list(R.S1, "shoes").includes(shoes.subcategory) && list(R.S1, "legs").includes(bottom.leg_shape)) {
      fire("S1_bulky_shoe_narrow_leg", "proportion", num(R.S1, "amount"), shoes, "shoes");
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
      accents.set(f, pyMax(accents.has(f) ? accents.get(f)! : 0, halfAccent(g) ? 0.5 : 1.0));
    }
    const nAccents = sum(Array.from(accents.values()));
    const fams = new Set(colored.map((g) => fam(g.color_family)));
    if (nAccents >= num(R.C1a, "accentsAtLeast")) {
      fire("C1a_too_many_accent_colors", "color", num(R.C1a, "amount"), null, null);
    } else if (fams.size >= num(R.C1b, "familiesAtLeast") && nAccents >= num(R.C1b, "accentsAtLeast")) {
      fire("C1b_too_many_colors", "color", num(R.C1b, "amount"), null, null);
    }
    const main = colored.filter((g) => MAIN_CATEGORIES.includes(g.category));
    const brightFams = new Set(main.filter((g) => isBright(g)).map((g) => fam(g.color_family)));
    const shoeBright = shoes && isBright(shoes) && !brightFams.has(fam(shoes.color_family)) ? num(R.C3, "shoeCountsAs") : 0;
    if (brightFams.size + shoeBright >= num(R.C3, "threshold")) {
      fire("C3_bright_clash", "color", boldness === "bold" || street ? num(R.C3, "boldOrStreet") : num(R.C3, "amount"), null, null);
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
      fire("C4a_same_pattern_same_scale", "color", num(R.C4aS, "amount"), null, null);
    } else if (entries.some((e) => e.n >= 2)) {
      fire("C4a_same_pattern_type", "color", num(R.C4aT, "amount"), null, null);
    }
    if (pats.length >= num(R.C4b, "patternsAtLeast") && !street) {
      fire("C4b_three_plus_patterns", "color", num(R.C4b, "amount"), null, null);
    }
    let focal = 0.0;
    for (const g of main) {
      if (isBright(g)) focal += 1;
      else if (halfAccent(g)) focal += 0.5;
      if (!isNone(g.pattern) && g.pattern !== "solid"
          && (g.pattern_scale === "large" || g.pattern === "graphic" || g.pattern === "camo" || g.pattern === "floral")) {
        focal += 1;
      }
    }
    // logos don't count as focal points
    const baseAllow = has(B1_ALLOWANCE, boldness) ? B1_ALLOWANCE[boldness]! : num(R.B1, "allowanceDefault");
    const allowance = baseAllow + (street ? num(R.B1, "streetBonus") : 0);
    if (focal > allowance) {
      fire("B1_too_many_focal_points", "color", Math.min(num(R.B1, "max"), num(R.B1, "perExtra") * Math.ceil(focal - allowance)), null, null);
    }
    if (fams.size === 1) advice.push(A.tonal);
    const jacket = outer.find((o) => SEPARATE_JACKETS.has(o.subcategory));
    if (jacket && bottom && list(R.C5, "bottoms").includes(bottom.subcategory)
        && DARK_SUITING.has(jacket.color_family) && DARK_SUITING.has(bottom.color_family)
        && jacket.color_family !== bottom.color_family) {
      // navy blazer + black trousers reads like a mismatched suit
      fire("C5_near_match_jacket_trousers", "color", num(R.C5, "amount"), jacket, null);
      advice.push(A.nearMatch);
    }
    const colorFault = fired.some((r) => r.startsWith("C1") || r.startsWith("C3") || r.startsWith("C4") || r.startsWith("B1") || r.startsWith("C5"));

    // ================= OCCASION =================
    const dressiness = (g: Garment): number => {
      let f = formality(g);
      if (g.category === "bottom" && LOUNGE_BOTTOMS.has(g.subcategory) && ATHLETIC_AS_CASUAL.has(occasion)) {
        f = pyMax(f, S.loungeAthleticAsCasual); // the loungewear ladder is their one penalty here
      }
      return f;
    };
    const core = garments.filter((g) => CORE_CATEGORIES.includes(g.category)).map(dressiness);
    if (core.length > 0) {
      const f = sum(core) / core.length;
      const [lo, hi] = occasionTarget(occasion);
      const gap = lo - f; // each level phases in between a gap of (level - 0.75) and (level - 0.25); max 2 levels
      const per = num(R.O1c, "perLevel");
      const w = num(R.O1c, "rampWidth");
      fire("O1_too_casual", "occasion", per * clamp01((gap - O1_STARTS[0]!) / w) + per * clamp01((gap - O1_STARTS[1]!) / w), null, null);
      if (f > hi + num(R.O1f, "margin")) fire("O1_too_formal", "occasion", num(R.O1f, "amount"), null, null);
    }
    if (bottom && !LOUNGE_OK.has(occasion) && athletic) {
      const dressed = outer.some((o) => DRESSED_OUTER.has(o.subcategory)) || tops.some((t) => DRESSED_TOPS.has(t.subcategory));
      const realShoe = !!shoes && !NOT_REAL_SHOES.has(shoes.subcategory);
      const kit = bottom.subcategory === "athletic_shorts" && tops.some((t) => t.subcategory === "jersey");
      const signs = kit ? 0 : (dressed ? 1 : 0) + (realShoe ? 1 : 0); // a full kit is not an outfit
      let a = LADDER[signs]!;
      if (signs === 2 && outfit.hero.length > 0 && !occFirst) a = num(R.O4, "heroBothSigns"); // a sport hero piece makes it the look
      if (bottom.subcategory === "athletic_shorts" && !kit) a = pyMin(a, num(R.O4, "gymShortsMax")); // shorts/athletic-shorts flip guard
      fire("O4_loungewear_out", "occasion", a, bottom, "bottom");
    }
    if (shoes) {
      const others = garments.filter((g) => MAIN_CATEGORIES.includes(g.category)).map(formality);
      // v4.1 (#186): any sneaker under a tailored jacket at an interview costs at least `tailoredFloor` (white leather included).
      const floor = list(R.S2, "tailoredFloorOccasions").includes(occasion) && list(R.S2, "tailoredFloorShoes").includes(shoes.subcategory)
        && outer.some((o) => TAILORED_OUTER.has(o.subcategory));
      if (others.length > 0 && (!list(R.S2, "exempt").includes(shoes.subcategory) || floor)) {
        const gap = maxOf(others) - formality(shoes);
        const amt = num(R.S2, "amount") * clamp01(gap - num(R.S2, "rampFrom"));
        fire("S2_shoes_too_casual_for_outfit", "occasion", floor ? pyMax(amt, num(R.S2, "tailoredFloor")) : amt, shoes, "shoes");
      }
    }
    const bigLogo = garments.filter((g) => g.logo === "large");
    if (bigLogo.length > 0) {
      const prefixes = list(R.O3, "occasionPrefixes") as string[];
      if (prefixes.some((p) => occasion.startsWith(p)) && bigLogo.some((g) => g.certainty === R.O3["needsCertainty"])) {
        fire("O3_large_logo", "occasion", num(R.O3, "amount"), bigLogo.find((g) => g.certainty === R.O3["needsCertainty"]), null);
      } else {
        const quiet = street || vintage || (outdoor && bigLogo.every((g) => TECH_LAYERS.has(g.subcategory) || g.subcategory === "trail_shoe"));
        if (!quiet) advice.push(A.bigLogo);
      }
    }
    if (DRESSY.has(occasion) && shoes
        && (shoes.subcategory === "loafer" || shoes.subcategory === "derby" || shoes.subcategory === "dress_shoe" || shoes.subcategory === "chelsea_boot")) {
      advice.push(A.belt);
    }
    // "Next level" idea only when the outfit is already clean and has no focal point (minimal: texture, not color)
    if (fired.length === 0 && focal === 0 && boldness !== "subtle") advice.push(minimal ? A.nextLevelMinimal : A.nextLevel);

    // ================= CREDITS: one garment, one credit =================
    const hidden = new Set<string>(notRated.includes("shoes") || notRated.includes("bottom half") ? ["shoes"] : []);
    const cg = garments.filter((g) => CORE_CATEGORIES.includes(g.category));
    const mg = cg.filter((g) => MAIN_CATEGORIES.includes(g.category));
    const earns = (g: Garment): boolean => !careSet.has(g); // a stained or worn piece earns no credit
    const layerPoints = (g: Garment): number => {
      const cat = g.category, s = g.subcategory;
      if (!(cat === "outerwear" || (cat === "top" && KNIT_TOPS.has(s)) || s === "fleece" || s === "vest")) return 0;
      return TECH_LAYERS.has(s) ? S.k1TechLayer as number : credit("K1_layered");
    };
    const interestOf = (g: Garment): number => {
      // muted counts half only for burgundy/sage here: two muted pieces are not "one standout color"
      const col = isBright(g) ? 1 : MUTED.has(g.color_family) ? 0.5 : 0;
      const p = g.pattern;
      const pat = !isNone(p) && p !== "solid" && p !== "graphic" && p !== "other" && g.pattern_scale !== "small";
      return col + (pat ? 1 : 0);
    };
    type Cand = { g: Garment; pts: number };
    const cand: Record<CreditId, Cand[]> = {
      K1_layered: cg.filter((g) => layerPoints(g) > 0 && earns(g)).map((g) => ({ g, pts: layerPoints(g) })),
      K2_elevated_piece: mg.filter((g) => formality(g) >= 3 && earns(g)).map((g) => ({ g, pts: credit("K2_elevated_piece") })),
      K3_point_of_interest: [],
      K4_shoes_complement: [],
    };
    const k3Pool = main.filter(earns);
    const interest = sum(k3Pool.map(interestOf));
    const k3Ok = 1 <= interest && interest <= allowance && !(colorFault || focal > baseAllow || interest > baseAllow);
    if (k3Ok) cand.K3_point_of_interest = k3Pool.filter((g) => interestOf(g) > 0).map((g) => ({ g, pts: credit("K3_point_of_interest") }));
    if (shoes && bottom && earns(shoes)) {
      const others = garments.filter((g) => MAIN_CATEGORIES.includes(g.category)).map(formality);
      const fs = formality(shoes);
      if (fs >= 2.5 && others.length > 0 && Math.abs(fs - sum(others) / others.length) <= 0.75) {
        cand.K4_shoes_complement = [{ g: shoes, pts: credit("K4_shoes_complement") }];
      }
      if (ST_SHOE_A.has(shoes.subcategory) && looseDenim && bottom.hem !== "pooling" && shoes.condition === "clean") {
        cand.K4_shoes_complement = [{ g: shoes, pts: credit("K4_shoes_complement") }]; // the shoe's weight matches the leg
      }
    }
    // best assignment: each credit from a different garment, maximizing the total (first best found wins ties)
    const ks = CREDIT_ORDER.filter((k) => cand[k].length > 0);
    let bestV = 0;
    let earned: [CreditId, number, Garment][] = [];
    for (let r = ks.length; r >= 1; r--) {
      for (const combo of combinations(ks, r)) {
        for (const pick of product(combo.map((k) => cand[k]))) {
          if (new Set(pick.map((p) => p.g)).size !== pick.length) continue;
          const v = sum(pick.map((p) => p.pts));
          if (v > bestV + 1e-9) {
            bestV = v;
            earned = combo.map((k, i): [CreditId, number, Garment] => [k, pick[i]!.pts, pick[i]!.g]);
          }
        }
      }
    }
    // Score out of what's visible: credits that need hidden parts are scaled up halfway, never lost
    const visibleMax = sum(CREDITS.filter((c) => !c.needs.some((n) => hidden.has(n))).map((c) => c.points));
    const scale = (1 + CREDIT_MAX / visibleMax) / 2;
    const creditPts = sum(earned.map(([, p]) => p)) * scale;

    const W = S.weights;
    const clampSub = (v: number) => Math.max(S.subMin, Math.min(S.subMax, 10.0 - v));
    const subs: Record<SubscoreName, number> = { fit: clampSub(pen.fit), color: clampSub(pen.color), proportion: clampSub(pen.proportion) };
    const base = W.fit * subs.fit + W.color * subs.color + W.proportion * subs.proportion;
    let mistakes = S.mistakeMultiplier * (10.0 - base) + S.occasionMultiplier * occAdj;
    // one garment's fit + proportion penalties cost at most garmentCap on the score
    const perGarment = new Map<string, number>();
    for (const [bucket, amt, key] of traced) {
      if (key !== null && bucket !== "occasion" && bucket !== "color") {
        perGarment.set(key, (perGarment.has(key) ? perGarment.get(key)! : 0.0) + MULT[bucket] * amt);
      }
    }
    let capped = 0.0;
    for (const t of perGarment.values()) if (t > S.garmentCap) capped += t - S.garmentCap;
    mistakes -= capped;
    let raw = Math.max(S.rawMin, Math.min(S.rawMax, S.baseline + creditPts - mistakes));
    let floorLift = 0;
    if (FLOOR_OCCASIONS.has(occasion) && !fired.includes("F7_care") && !fired.includes("F10_visible_strain") && raw < S.floor) {
      floorLift = S.floor - raw;
      raw = S.floor; // a misread or a style choice never produces a 3 on an ordinary day
    }

    if (trace) {
      const got = new Map(earned.map(([id, , g]) => [id, g] as const));
      const held = ext.held_items ?? [];
      const heldLayer = held.findIndex((g) => g.category === "outerwear");
      const why = (id: CreditId): CreditReason => {
        if (cand[id].length > 0) return "usedByOther";
        switch (id) {
          case "K1_layered":
            if (heldLayer >= 0) return "heldNotWorn";
            return cg.some((g) => layerPoints(g) > 0) ? "notClean" : "noLayer";
          case "K2_elevated_piece": return mg.some((g) => formality(g) >= 3) ? "notClean" : "noElevated";
          case "K3_point_of_interest": return interest < 1 ? "allNeutral" : "tooMuchInterest";
          default: return !shoes ? "shoesHidden" : careSet.has(shoes) ? "notClean" : "shoesOff";
        }
      };
      for (const c of CREDITS) {
        const id = c.id as CreditId;
        const ok = got.has(id);
        const reason = ok ? null : why(id);
        trace.credits.push({
          id, earned: ok, points: c.points, evidenceIndex: ok ? at(got.get(id)) : null, reason,
          heldIndex: reason === "heldNotWorn" ? heldLayer : null,
        });
      }
      trace.creditFactor = scale;
      trace.capReturned = capped;
      trace.floorLift = floorLift;
    }

    return {
      overall: roundHalf(raw),
      rawScore: pyRound(raw, 3),
      rawUnrounded: raw,
      subscores: { fit: roundHalf(subs.fit), color: roundHalf(subs.color), proportion: roundHalf(subs.proportion) },
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
      detectedStyles: det,
      styleLabel,
    };
  }

  // ================= THE ONE QUICK TAP =================
  function doubtOf(reading: Reading, scene: Scene, g: Garment, a: string, b: string): string | null {
    if (g.certainty !== "clear") return "certainty " + pyStr(g.certainty);
    if (scene.lighting === "dim") return "dim light";
    if (JEANS_FAMILY.has(a) && JEANS_FAMILY.has(b) && JEANS_FAMILY.has(g.subcategory) && DARK_NONDENIM.has(g.color_family)) {
      return "dark non-denim color";
    }
    if ((g.subcategory === "sweatpants" || g.subcategory === "joggers") && (reading.garments ?? []).some((x) => x.subcategory === "belt")) {
      return "a belt is visible"; // sweatpants don't take belts
    }
    return null;
  }

  /** rubric._with: one garment's field set to his answer; an "unsure" garment becomes "likely" (never "clear"). */
  function withAnswer(reading: Reading, i: number, field: "subcategory", value: string): Reading {
    const alt = clone(reading);
    const g = alt.garments[i]!;
    g[field] = value;
    if (g.certainty === "unsure") g.certainty = "likely";
    return alt;
  }

  // Tap v2 (#120): the shoe question.
  const SHOES = data.tap.shoes;
  const kindOf = (sub: unknown): ShoeKind | null => SHOES.order.find((k) => SHOES.kinds[k].includes(sub as string)) ?? null;

  /** rubric._kind_pick: the type a kind answer scores as. */
  function kindPick(reading: Reading, i: number, kind: ShoeKind): string {
    const cur = reading.garments[i]!.subcategory as string;
    if (SHOES.kinds[kind].includes(cur)) return cur;
    if (kind !== "boots") return SHOES.kinds[kind][0]!;
    const rest = (reading.garments ?? [])
      .filter((g, j) => j !== i && (g.category === "top" || g.category === "bottom" || g.category === "outerwear"))
      .map((g) => formality(g));
    let sum = 0;
    for (const f of rest) sum += f;
    const avg = rest.length ? sum / rest.length : 2.5;
    return avg <= 2.75 ? "work_boot" : avg <= 3.25 ? "suede_chukka" : "chelsea_boot";
  }

  /** rubric._shoe_question: upward only. */
  function shoeQuestion(reading: Reading, i: number, g: Garment, base: number, opts: ScoreOptions): TapQuestion | null {
    const sub = g.subcategory as string;
    const cert = g.certainty;
    const lost = sub === "other" || cert === "unsure" || (sub === "slides_sandals" && cert !== "clear");
    const mine = kindOf(sub);
    if (sub !== "other" && mine === null) return null;
    if (!lost) return null;
    const kinds = SHOES.order;
    const options: TapOption[] = [];
    for (const k of kinds) {
      const v = kindPick(reading, i, k);
      const s = score(withAnswer(reading, i, "subcategory", v), opts).overall;
      if (s === null) return null;
      options.push({ value: v, label: SHOES.labels[k], score: s, group: k });
    }
    let top = options[0]!.score;
    for (const o of options) if (o.score > top) top = o.score;
    const swing = top - base;
    if (swing < SHOES.lostSwing) return null;
    // Skip keeps the kind the model named; only a lost type ("other") gets the highest score (ties: question order).
    const def = mine !== null && kinds.includes(mine)
      ? options.find((o) => o.group === mine)!
      : [...options].sort((x, y) => y.score - x.score || kinds.indexOf(x.group!) - kinds.indexOf(y.group!))[0]!;
    return {
      pair: kinds.join("/"), slot: "footwear", field: "subcategory", garmentIndex: i, question: SHOES.question,
      options, default: def.value, swing, doubt: "shoe type lost", kind: "shoes",
    };
  }

  function askQuestion(reading: Reading, opts: ScoreOptions = {}, shoes = true): TapQuestion | null {
    const base = score(reading, opts).overall;
    if (base === null) return null;
    const scene: Scene = (truthy(reading.scene) ? reading.scene : {}) as Scene;
    const shoesVisible = truthy(has(scene, "shoes_visible") ? scene.shoes_visible : true);
    const occ: string = opts.occasion ?? "everyday";
    let best: TapQuestion | null = null;
    // v2: upward first, then the bigger swing; ties keep the earlier question.
    const better = (q: TapQuestion): boolean => {
      if (best === null) return true;
      if (shoes && q.swing > 0 !== best.swing > 0) return q.swing > 0;
      return Math.abs(q.swing) > Math.abs(best.swing);
    };
    (reading.garments ?? []).forEach((g, i) => {
      const cat = g.category as string;
      const pairsOk = g.certainty !== "unsure" && has(TAP_PAIRS, cat) && !(cat === "footwear" && !shoesVisible)
        && !((cat === "bottom" || cat === "footwear") && scene.framing === "upper_only");
      if (pairsOk) {
        for (const [a, b, q] of TAP_PAIRS[cat]!) {
          if (g.subcategory === "jeans" && (a === "jeans" || b === "jeans") && String(g.color_family ?? "").startsWith("denim")) continue;
          if (g.subcategory !== a && g.subcategory !== b) continue;
          const other = g.subcategory === a ? b : a;
          const sAlt = score(withAnswer(reading, i, "subcategory", other), opts).overall;
          if (sAlt === null) continue;
          const swing = sAlt - base;
          const doubt = doubtOf(reading, scene, g, a, b);
          if ((swing >= 1.0 && doubt !== null) || (swing <= -1.0 && g.certainty !== "clear")) {
            const cur = g.subcategory as string;
            const cand: TapQuestion = {
              pair: `${a}/${b}`, slot: cat as TapQuestion["slot"], field: "subcategory", garmentIndex: i, question: q,
              options: [
                { value: cur, label: has(TAP_LABEL, cur) ? TAP_LABEL[cur]! : cur, score: base },
                { value: other, label: has(TAP_LABEL, other) ? TAP_LABEL[other]! : other, score: sAlt },
              ],
              // v2 (#125): Skip keeps what was read; v4.0 skipped to the more generous reading
              default: shoes || base >= sAlt ? cur : other, swing, doubt: doubt ?? "model not sure",
            };
            if (better(cand)) best = cand;
          }
        }
      }
      if (shoes && cat === "footwear" && shoesVisible && scene.framing !== "upper_only" && !SHOES.skipOccasions.includes(occ)) {
        const q = shoeQuestion(reading, i, g, base, opts);
        if (q && better(q)) best = q;
      }
    });
    return best;
  }

  const helpers: RubricHelpers = {
    prepare(reading) {
      const p = prepare(clone(reading));
      normalize(p.garments);
      return p;
    },
    outfit: outfitOf,
    role: (style, g, c) => STYLES[style].role(g, c),
    tapDoubt: (reading, g, a, b) => doubtOf(reading, (truthy(reading.scene) ? reading.scene : {}) as Scene, g, a, b),
    kindPick,
    legExcused,
    halfAccent,
    isDenim,
  };

  return {
    data, score, askQuestion, detectStyles, scoredGarments, bandsFor, bandSteps, formality, fam, isBright, legIndex,
    legOrder: LEG_ORDER, occasionTarget, neutrals: NEUTRALS, loungeOk: LOUNGE_OK, helpers,
  };
}

/** itertools.combinations(xs, r): index-lexicographic order. */
function* combinations<T>(xs: readonly T[], r: number): Generator<T[]> {
  const n = xs.length;
  if (r > n) return;
  const idx = Array.from({ length: r }, (_, i) => i);
  yield idx.map((i) => xs[i]!);
  for (;;) {
    let i = r - 1;
    while (i >= 0 && idx[i] === i + n - r) i--;
    if (i < 0) return;
    idx[i]! += 1;
    for (let j = i + 1; j < r; j++) idx[j] = idx[j - 1]! + 1;
    yield idx.map((k) => xs[k]!);
  }
}

/** itertools.product(*lists): the last list varies fastest. */
function* product<T>(lists: readonly (readonly T[])[]): Generator<T[]> {
  if (lists.some((l) => l.length === 0)) return;
  const idx = lists.map(() => 0);
  for (;;) {
    yield idx.map((k, i) => lists[i]![k]!);
    let i = lists.length - 1;
    while (i >= 0) {
      idx[i]! += 1;
      if (idx[i]! < lists[i]!.length) break;
      idx[i] = 0;
      i--;
    }
    if (i < 0) return;
  }
}

/** The engine built from the bundled rubric (rubricData.ts = fixtures/rubric.json). */
export const defaultRubric: RubricEngine = createRubric(RUBRIC_DATA);

/** rubric.score() with the bundled rubric. Never mutates `reading`. */
export function score(reading: Reading, opts: ScoreOptions = {}): RubricResult {
  return defaultRubric.score(reading, opts);
}

/** rubric.ask_question() with the bundled rubric: the one quick tap, or null. */
export function askQuestion(reading: Reading, opts: ScoreOptions = {}, shoes = true): TapQuestion | null {
  return defaultRubric.askQuestion(reading, opts, shoes);
}

/** rubric.detect_styles() on a reading: what it reads as, and the card label (null = the general standard). */
export function detectStyles(reading: Reading, picks?: Styles | null): DetectedStyles {
  return defaultRubric.detectStyles(defaultRubric.scoredGarments(reading), picks);
}

export function isScored(r: RubricResult): r is import("./types").ScoredResult {
  return r.overall !== null;
}

export { roundHalf, nearest, pyRound } from "./util";
