// Exact TypeScript port of the parts engine, extraction-test/rubrics/parts_proto.py engine "v3" (parts-proto-3,
// DECISIONS-LOG #195-205). NOT wired into the app: rubric.ts (v4.1) stays the live score until the parts-aware fix
// engine and the Why sheet are built.
//
// "The AI sees, the code judges": it reads only the garment description (plus the optional second look's two yes/no
// answers). It never reads a face, body or skin, and never his profile (picks only choose the "Reads as" label).
//
// How a score is made: five PARTS (Proportions 30 · Fit 25 · Color 15 · Shoes 15 · Style 15), each 1-10 from its
// own checks, NA parts dropping out; their weighted average; the earned bonus; minus Condition; minus the occasion's
// small deduction, held under its ceiling; the 5.0 floor at ordinary occasions, the 3.0 floor; round to the half.
//
// Parity rules (verified against fixtures/parts_parity.json, every case, bit for bit):
//  - same operation order as Python wherever a float is summed or multiplied, and Python's round(x, n) (pyRound)
//    wherever parts_proto.py rounds, including the rounded values it feeds back into the arithmetic
//  - Python `x in (…)` on a missing key is `None in (…)`: undefined and null both mean None (nv)
//  - one garment, one credit: "already credited" is object identity on our own copies (Python's id(g))
//  - where Python would raise (a garment without a subcategory reaching a reason line), this throws the same error
// Numbers and tables come from PartsData (bundled partsData.ts = fixtures/parts.json, version 1.0.0); the v4.1
// helpers it shares (formality, colors, style detection, prepare/normalize) come from the rubric engine.

import { PARTS_DATA } from "./partsData";
import { defaultRubric, type RubricEngine } from "./rubric";
import type { DetectedStyle, Garment, NotRated, Reading, Scene, Styles } from "./types";
import { has, isNone, maxOf, minOf, or, pyMax, pyMin, pyRound, replaceAll, roundHalf, sum, truthy } from "./util";

// ================================================================= data and result types

export type PartName = "proportions" | "fit" | "color" | "shoes" | "cohesion";

/** The parts engine's TUNE block (parts_proto.TUNE[engine]): reward sizes and switches. */
export interface PartsTune {
  pr1: number;
  pr1_mirror_short: number;
  pr1b: number;
  pr2: number;
  pr3: number;
  prop_cap: number;
  h1: number;
  h2: number;
  h2_suit: number;
  h4: number;
  cp1: number;
  cp2: number;
  cp5: number;
  lightness: boolean;
  /** null = no cap (v1). */
  color_cap: number | null;
  suit_shoe: boolean;
  /** The bonus after the average; null = none (v1). */
  earned: { over: number; rate: number; cap: number; gate: [number, number] } | null;
  solid_line: boolean;
  pr4: number;
  pr4_shoes: string[];
  h4_graphic_street: boolean;
  sw2: number;
  pr4_legs: string[];
  pr4_signature_v3: boolean;
}

interface Range { points: number; from: number; to: number }

/** fixtures/parts.json (make_parts_json.py). */
export interface PartsData {
  version: string;
  /** "v3" for the bundled data; "v1" / "v2" reproduce the earlier prototypes. */
  engine: string;
  label: string;
  source: string;
  sourceSha256: string;
  rubricVersion: string;
  weights: Record<PartName, number>;
  partOrder: PartName[];
  partNames: Record<PartName, string>;
  base: number;
  partRange: { default: [number, number]; cohesion: [number, number] };
  tune: PartsTune;
  sets: Record<string, (string | null)[]>;
  boxyVolume: number;
  proportions: {
    bigTopSkinny: number;
    layerOverSkinny: number;
    peek: number;
    blockAt: number;
    tips: { longTopLoose: number; longTop: number; longLayerLooseLeg: number; heavyHemTailored: number; longShirtWideLeg: number; longShirtMaxVolume: number };
  };
  fit: {
    severity: { minor: number; moderate: number; clear: number; severe: number };
    pieceOthersRate: number;
    othersRate: number;
    tips: { fullBreakNarrow: number };
  };
  color: {
    accent: { full: number; half: number };
    tooManyAccents: { atLeast: number; points: number };
    busy: { familiesAtLeast: number; accentsAtLeast: number; points: number };
    brightClash: { boldOrStreet: number; points: number; familiesAtLeast: number };
    nearMatch: number;
    samePatternScale: number;
    samePattern: number;
    threePatterns: { atLeast: number; points: number };
    lightness: { tonalRange: number; tonalShoes: number; lightMidDark: number };
    tips: { doubleDenim: number };
  };
  shoes: {
    range: [number, number];
    slides: { tailored: number; points: number };
    hemDrags: number;
    dragHems: string[];
    runners: { tailored: number; points: number };
    chunkyUnderTailoring: number;
    tooCasual: Range[];
    tooDressy: Range;
    matches: { points: number; realFrom: number; realTo: number };
    window: { dressier: [number, number]; casual: [number, number] };
    chosen: number;
    chunkyNarrow: number;
    runnerNarrow: number;
    loudVsLoud: number;
    accent: number;
    worn: { points: number; half: number };
    tips: { daintyWide: number };
  };
  cohesion: {
    jacketJeans: number;
    spread: { atLeast: number; bigAtLeast: number; points: number; bigPoints: number };
    statements: {
      allowance: Record<string, number>;
      allowanceDefault: number;
      streetBonus: number;
      perExtra: number;
      max: number;
      bright: number;
      half: number;
      pattern: number;
    };
  };
  condition: {
    stain: number;
    wrinkled: number;
    wrinkledLinen: number;
    worn: number;
    cap: number;
    untuckedDressShirt: number;
    partRate: number;
    partFloor: number;
  };
  occasion: {
    o1Curve: [number, number][];
    casual: Range;
    overdressed: Range;
    loungeAsCasual: number;
    ceilings: { loungeDressy: number; loungeLadder: [number, number, number]; slidesDressy: number; sneakersBlazer: number; bigLogo: number };
    default: [number, number];
  };
  final: { floor: number; floorOccasions: string[]; min: number; max: number };
  copy: { lowestFallback: Record<PartName, string>; solidLine: string };
}

/** A check that moved a part. `points` is Python's round(delta, 3). */
export interface PartReason { check: string; points: number; line: string }
/** A check whose reading hasn't passed a steadiness test: reported, never moves the number. */
export interface PartTip { check: string; line: string; wouldCost: number | null }

export interface PartResult {
  /** round(part, 3) after the part's clamp; null when NA. */
  score: number | null;
  /** The part rounded to the half (what the card shows); null when NA. */
  display: number | null;
  /** Why the part isn't scored ("shoes not in the photo"), or null. */
  na: string | null;
  reasons: PartReason[];
  tips: PartTip[];
}

export interface PartsCondition {
  deduction: number;
  faults: string[];
  /** "clean", "couldn't check in this light", or the faults joined with "; ". */
  display: string;
  /** What Condition would show as a part (only when a care fault fired), or null. */
  part: number | null;
}

export interface PartsOccasion {
  deduction: number;
  ceiling: number | null;
  lines: string[];
  /** "right for it", the first line, or the ceiling's line ("…: held to 4.0"). */
  status: string;
  /** The clothes' mean dressiness (absent when nothing is in view, as in Python). */
  dressiness?: number;
}

/** The second look, normalized: the peek (a top shows below the outer piece) and "rests on the shoe". */
export interface SecondLook { peek: unknown; restsOnShoe: unknown }
/** Either the raw look answers or the reduced yes/no form (the same keys as parts_proto._second_look). */
export interface SecondLookInput {
  peek?: unknown;
  rests_on_shoe?: unknown;
  under_present?: unknown;
  under_shows?: unknown;
  covers_shoe?: unknown;
  [extra: string]: unknown;
}

export interface PartsOptions {
  occasion?: string;
  /** His picks as ordered [name, weight] pairs: like v4.1 they only pick the "Reads as" label, never a number. */
  styles?: Styles | null;
  boldness?: string;
  secondLook?: SecondLookInput | null;
}

export interface PartsLowest {
  /** The part the card leads with, or null when every part is solid (7). */
  part: PartName | null;
  score: number;
  line: string;
}

export interface PartsScored {
  overall: number;
  /** round(final before the half-rounding, 3). */
  rawScore: number;
  rawUnrounded: number;
  /** round(weighted average of the live parts, 3). */
  average: number;
  averageUnrounded: number;
  earnedBonus: number;
  version: string;
  engine: string;
  parts: Record<PartName, PartResult>;
  naParts: PartName[];
  weightsUsed: Partial<Record<PartName, number>>;
  condition: PartsCondition;
  occasion: PartsOccasion;
  floored: boolean;
  careOrStrain: boolean;
  lowest: PartsLowest;
  secondLook: SecondLook;
  detectedStyles: DetectedStyle[];
  styleLabel: DetectedStyle | null;
  notRated: NotRated[];
  partial: boolean;
}

export interface PartsUnscored {
  overall: null;
  reason: "not_fully_clothed" | "nothing_readable" | "no_part_readable";
  /** Empty for the first two reasons; every part (all NA) for no_part_readable. */
  parts: Partial<Record<PartName, PartResult>>;
  naParts: PartName[];
}

export type PartsResult = PartsScored | PartsUnscored;

export interface PartsEngine {
  readonly data: PartsData;
  scoreParts(reading: Reading, opts?: PartsOptions): PartsResult;
}

// ================================================================= small Python helpers

/** Python `None` for a missing key or JSON null. */
const nv = (v: unknown): unknown => (v === undefined ? null : v);
/** Python `s.replace("_", " ")` on a value read with .get(): None raises, as in parts_proto.py. */
function rep(s: unknown): string {
  if (isNone(s)) throw new TypeError("AttributeError: 'NoneType' object has no attribute 'replace'");
  return replaceAll(String(s), "_", " ");
}
/** Python str(float) for a half-rounded value: 4.0 -> "4.0", 5.5 -> "5.5". */
const pyFloat = (x: number): string => (Number.isInteger(x) ? x.toFixed(1) : String(x));
/** Python f"{x:g}" for a half-rounded value: 7.0 -> "7", 6.5 -> "6.5". */
const pyG = (x: number): string => String(x);
const clamp = (x: number, lo: number, hi: number): number => pyMax(lo, pyMin(hi, x));
const clamp01 = (x: number): number => Math.max(0.0, Math.min(1.0, x));
/** 0 at x <= a, 1 at x >= b, linear between (a < b). */
const ramp = (x: number, a: number, b: number): number => clamp01((x - a) / (b - a));

const SLOT: Readonly<Record<string, "upper" | "bottom" | "shoes">> = { top: "upper", outerwear: "upper", bottom: "bottom", footwear: "shoes" };
const UPPER_OR_BOTTOM: readonly unknown[] = ["top", "outerwear", "bottom"];
const LV: readonly unknown[] = ["light", "mid", "dark"];

/** One part's working state (parts_proto._Part). */
class Part {
  score: number;
  reasons: PartReason[] = [];
  tips: PartTip[] = [];
  na: string | null = null;

  constructor(base: number) {
    this.score = base;
  }

  add(delta: number, line: string, check: string): void {
    if (Math.abs(delta) < 1e-9) return;
    this.score += delta;
    this.reasons.push({ check, points: pyRound(delta, 3), line });
  }

  tip(line: string, check: string, would: number | null = null): void {
    this.tips.push({ check, line, wouldCost: would });
  }

  result(lo: number, hi: number): PartResult {
    if (truthy(this.na)) return { score: null, display: null, na: this.na, reasons: [], tips: this.tips };
    const s = clamp(this.score, lo, hi);
    return { score: pyRound(s, 3), display: roundHalf(s), na: null, reasons: this.reasons, tips: this.tips };
  }
}

/** parts_proto._outfit's dict. */
interface PartsOutfit {
  tops: Garment[];
  outers: Garment[];
  top: Garment | null;
  outer: Garment | null;
  bottom: Garment | null;
  shoes: Garment | null;
  main: Garment[];
  det: DetectedStyle[];
  label: DetectedStyle | null;
  detNoShoe: DetectedStyle[];
  slots: Set<string>;
  credited: Set<Garment>;
  colorFault: boolean;
  mirror: boolean;
}

// ================================================================= the engine

/** Build a parts engine from parts data (the bundled copy, or a tuned variant) on top of a v4.1 rubric engine. */
export function createParts(data: PartsData, rubric: RubricEngine = defaultRubric): PartsEngine {
  const RT = rubric.data.tables;
  const H = rubric.helpers;
  const STYLE_NAMES = rubric.data.styles.names;
  const tset = (xs: readonly (string | null)[]): Set<unknown> => new Set<unknown>(xs);
  const PS = (name: string): Set<unknown> => {
    const v = data.sets[name];
    if (!v) throw new Error(`parts.json: missing set ${name}`);
    return tset(v);
  };
  const t = data.tune;
  const BASE = data.base;
  const W = data.weights;
  const ORDER = data.partOrder;
  const BOXY = data.boxyVolume;

  const TAILORED = PS("TAILORED"), TAILORED_FIT = PS("TAILORED_FIT"), RIBBED = PS("RIBBED"), SHORT_SLEEVE_TYPES = PS("SHORT_SLEEVE_TYPES");
  const PRESSED = PS("PRESSED"), NARROW = PS("NARROW"), FULL_LEG = PS("FULL_LEG"), SHORT_LAYERS = PS("SHORT_LAYERS"), BULKY = PS("BULKY");
  const SUIT_SHOES = PS("SUIT_SHOES"), RUNNER = PS("RUNNER"), SLIDES = PS("SLIDES"), SHORTS = PS("SHORTS"), LOUNGE_OK = PS("LOUNGE_OK");
  const INTERVIEWISH = PS("INTERVIEWISH"), LINEN_LIKELY = PS("LINEN_LIKELY"), NO_TIE_IN = PS("NO_TIE_IN"), LOOSE = PS("LOOSE");
  const SHORT_TOP_LENGTHS = PS("SHORT_TOP_LENGTHS"), STREET_SHAPE_LENGTHS = PS("STREET_SHAPE_LENGTHS");
  const STREET_SHAPE_BOTTOMS = PS("STREET_SHAPE_BOTTOMS"), LOOSE_DENIM = PS("LOOSE_DENIM"), WORN_HALF_SHOES = PS("WORN_HALF_SHOES");
  const DAINTY_SHOES = PS("DAINTY_SHOES"), LONG_SHIRTS = PS("LONG_SHIRTS"), DRESSY_ROOM = PS("DRESSY_ROOM");
  const PR4_SHOES = tset(t.pr4_shoes), PR4_LEGS = tset(t.pr4_legs);

  const FAMILY = new Map<unknown, string>(Object.entries(RT.FAMILY));
  const NEUTRALS = tset(RT.NEUTRALS), LOUNGE_BOTTOMS = tset(RT.LOUNGE_BOTTOMS), SEPARATE_JACKETS = tset(RT.SEPARATE_JACKETS);
  const DARK_SUITING = tset(RT.DARK_SUITING), DRESSY_OCCASIONS = tset(RT.DRESSY_OCCASIONS), ATHLETIC_AS_CASUAL = tset(RT.ATHLETIC_AS_CASUAL);
  const DRESSED_OUTER = tset(RT.DRESSED_OUTER), DRESSED_TOPS = tset(RT.DRESSED_TOPS), NOT_REAL_SHOES = tset(RT.NOT_REAL_SHOES);
  const OCCASION_TARGET = new Map<unknown, number[]>(Object.entries(RT.OCCASION_TARGET));
  const COLLARED_PLUS = tset([...rubric.data.styles.sets["COLLARED"]!, "oxford_shirt", "dress_shirt"]);
  const ST_TOP_A = tset(rubric.data.styles.sets["ST_TOP_A"]!);
  const SNEAKERS = tset(rubric.data.tap.shoes.kinds.sneakers);
  const FLOOR_OCCASIONS = tset(data.final.floorOccasions);

  const formality = rubric.formality;
  const isBright = rubric.isBright;
  const vol3 = (g: Garment): number => or(g.volume, 3) as number;
  const fam = (g: Garment | null): unknown => {
    if (!g) return null;
    const c = nv(g.color_family);
    return FAMILY.has(c) ? FAMILY.get(c)! : c;
  };
  const tuckedNone = (g: Garment): boolean => isNone(g.tucked) || g.tucked === "none" || g.tucked === "na";

  /** "stained" (sure) or "worn" (not excused by a designed distress) or null. */
  function careFault(g: Garment): "stained" | "worn" | null {
    const c = g.condition;
    if (c === "stained" && g.certainty === "clear") return "stained";
    if (c === "pilled_or_worn" && !(truthy(g.distressed_by_design) && g.category !== "footwear")) return "worn";
    return null;
  }
  /** Ruling 46: a stained or worn piece earns no credit in any part. */
  const earns = (g: Garment | null): boolean => g !== null && careFault(g) === null;

  /** Copies; a tank top with a collared shirt is a sweater vest; a suit jacket without suit trousers is a blazer. */
  function refile(garments: readonly Garment[]): Garment[] {
    const gs = garments.map((g) => ({ ...g }));
    const subs = new Set<unknown>(gs.map((g) => nv(g.subcategory)));
    let collared = false;
    for (const s of subs) if (COLLARED_PLUS.has(s)) collared = true;
    for (const g of gs) {
      if (g.subcategory === "tank_top" && collared && (g.category === "top" || g.category === "outerwear")) {
        g.subcategory = "sweater";
        g["refiled"] = "tank_top->sweater (vest)";
      }
      if (g.subcategory === "suit_jacket" && !subs.has("suit_trousers")) {
        g.subcategory = "blazer";
        g["refiled"] = "suit_jacket->blazer (no suit trousers)";
      }
    }
    return gs;
  }

  function secondLook(sl: SecondLookInput | null | undefined): SecondLook {
    const out: SecondLook = { peek: null, restsOnShoe: null };
    if (!truthy(sl)) return out;
    const s = sl as SecondLookInput;
    if (has(s, "peek") || has(s, "rests_on_shoe")) {
      if (has(s, "peek")) out.peek = nv(s.peek);
      if (has(s, "rests_on_shoe")) out.restsOnShoe = nv(s.rests_on_shoe);
      return out;
    }
    if (has(s, "under_shows")) out.peek = s.under_present === "yes" && (s.under_shows === "a_little" || s.under_shows === "clearly");
    const cs = s.covers_shoe;
    if (cs === "partly" || cs === "mostly") out.restsOnShoe = true;
    else if (cs === "no") out.restsOnShoe = false;
    return out;
  }

  function outfit(gs: Garment[], picks: Styles | null | undefined): PartsOutfit {
    const tops = gs.filter((g) => g.category === "top");
    const outers = gs.filter((g) => g.category === "outerwear");
    const main = gs.filter((g) => has(SLOT, g.category as string));
    const d = rubric.detectStyles(gs, picks);
    const nd = rubric.detectStyles(gs.filter((g) => g.category !== "footwear"), picks);
    return {
      tops, outers, top: tops[0] ?? null, outer: outers[0] ?? null,
      bottom: gs.find((g) => g.category === "bottom") ?? null, shoes: gs.find((g) => g.category === "footwear") ?? null,
      main, det: d.detected, label: d.label, detNoShoe: nd.detected, slots: new Set(main.map((g) => SLOT[g.category as string]!)),
      credited: new Set(), colorFault: false, mirror: false,
    };
  }

  // ---------------------------------------------------------------- PROPORTIONS (30%)
  function proportions(o: PartsOutfit, sl: SecondLook): Part {
    const p = new Part(BASE);
    const D = data.proportions;
    const T = o.top, O = o.outer, B = o.bottom, S = o.shoes;
    if (B === null) {
      p.na = "legs not in the photo";
      return p;
    }
    if (SHORTS.has(nv(B.subcategory))) {
      p.na = "shorts (no shorts-length reading yet)";
      return p;
    }
    const leg = nv(B.leg_shape);
    const lounge = LOUNGE_BOTTOMS.has(nv(B.subcategory));
    const oSub = O ? nv(O.subcategory) : null;
    const oTailored = TAILORED.has(oSub);
    const bigTop = (T !== null && vol3(T) >= BOXY) || (O !== null && vol3(O) >= BOXY);

    // faults that move points today
    let faults = 0.0;
    if (bigTop && leg === "skinny") {
      p.add(-D.bigTopSkinny, "a roomy top over skinny legs", "PF5_big_top_skinny_leg");
      faults += D.bigTopSkinny;
    } else if (O !== null && leg === "skinny") {
      p.add(-D.layerOverSkinny, `the ${rep(oSub)} has nothing sturdy to sit on over skinny legs`, "PF6_layer_over_skinny");
      faults += D.layerOverSkinny;
    }
    if (truthy(sl.peek)) {
      p.add(-D.peek, "the top underneath shows below the outer piece", "PF10_peek");
      faults += D.peek;
    }

    // tips: real rules whose readings haven't passed (they never move the number)
    if (T !== null && O === null && tuckedNone(T) && T.length === "below_crotch") {
      p.tip("the top may run long, past the bottom of the fly", "PF2_long_top", LOOSE.has(leg) ? D.tips.longTopLoose : D.tips.longTop);
    }
    if (O !== null && !oTailored && O.length === "below_crotch" && LOOSE.has(leg)) {
      p.tip("a long loose layer over loose legs can shorten the line", "PF3_long_layer_loose_leg", D.tips.longLayerLooseLeg);
    }
    if (oTailored && (B.hem === "pooling" || B.hem === "full_break")) {
      p.tip("check the hem: trousers that bunch on the shoes fight a tailored jacket", "PF1_heavy_hem_tailored", D.tips.heavyHemTailored);
    }
    if (T !== null && O === null && LONG_SHIRTS.has(nv(T.subcategory)) && tuckedNone(T) && leg === "wide"
        && vol3(T) <= D.tips.longShirtMaxVolume) {
      p.tip("an untucked shirt over wide legs can hang long; a front tuck gives it shape", "PF4_long_shirt_wide_leg", D.tips.longShirtWideLeg);
    }

    // rewards: a deliberate shape, blocked by any fault of 1+, a pooling hem or loungewear
    const blocked = faults >= D.blockAt || B.hem === "pooling" || lounge;
    const full = FULL_LEG.has(leg);
    const rewards: [number, string, string][] = [];
    if (!blocked && full && T !== null) {
      const tuck = T.tucked === "full";
      const short = SHORT_TOP_LENGTHS.has(nv(T.length));
      const ribbedOk = !RIBBED.has(nv(T.subcategory)) || vol3(T) >= BOXY;
      if (O === null && earns(T) && (tuck || (short && ribbedOk))) {
        const pts = tuck || !o.mirror ? t.pr1 : t.pr1_mirror_short;
        rewards.push([pts, "a tucked or short top over a full leg gives it a waist", "PR1_waist_break"]);
      } else if (O === null && earns(T) && T.tucked === "half" && !RIBBED.has(nv(T.subcategory))) {
        rewards.push([t.pr1b, "the front tuck gives it a waist", "PR1b_half_tuck"]);
      }
    }
    // v3: the streetwear shape (PR4). Same top as the waist break, so it replaces PR1 when larger, never adds to it.
    const sSub = S !== null ? nv(S.subcategory) : null;
    const boxy = T !== null && (vol3(T) >= BOXY || (truthy(t.pr4_signature_v3) && ST_TOP_A.has(nv(T.subcategory)) && BULKY.has(sSub)));
    if (truthy(t.pr4) && !blocked && O === null && T !== null && earns(T) && boxy && tuckedNone(T)
        && STREET_SHAPE_LENGTHS.has(nv(T.length)) && PR4_LEGS.has(leg) && STREET_SHAPE_BOTTOMS.has(nv(B.subcategory))
        && o.det.includes("streetwear") && PR4_SHOES.has(sSub)) {
      const i = rewards.findIndex((x) => x[2] === "PR1_waist_break" || x[2] === "PR1b_half_tuck");
      if (i < 0 || rewards[i]![0] < t.pr4) {
        if (i >= 0) rewards.splice(i, 1);
        rewards.push([t.pr4, "a boxy top over wide legs, finished by street sneakers: the streetwear shape", "PR4_street_shape"]);
      }
    }
    if (!blocked && full && O !== null && SHORT_LAYERS.has(oSub) && earns(O) && !truthy(sl.peek)) {
      rewards.push([t.pr2, `a short ${rep(oSub)} over full legs: a clean, strong shape`, "PR2_short_layer"]);
    }
    if (!blocked && oTailored && T !== null && T.tucked === "full" && PRESSED.has(nv(B.subcategory)) && leg !== "skinny" && earns(O)) {
      rewards.push([t.pr3, "a complete tailored line", "PR3_tailored_line"]);
    }
    let total = 0.0;
    for (const [pts0, line, check] of rewards) {
      const pts = pyMin(pts0, t.prop_cap - total);
      if (pts > 0) {
        p.add(pts, line, check);
        total += pts;
      }
    }
    if (p.reasons.length === 0 && T !== null && O === null && !RIBBED.has(nv(T.subcategory))) {
      p.tip("a front tuck, or a jacket that ends at the hip, would give it more shape", "P_next_level");
    }
    return p;
  }

  // ---------------------------------------------------------------- FIT (25%)
  const SEV = data.fit.severity;

  function pieceFaults(g: Garment, o: PartsOutfit): [number, string, string][] {
    const cat = g.category;
    const sub = or(g.subcategory, "") as string;
    const out: [number, string, string][] = [];
    if (cat === "top" || cat === "outerwear") {
      if (g.sleeve_end === "covers_hand" && !SHORT_SLEEVE_TYPES.has(sub)) {
        const v = vol3(g);
        if (TAILORED_FIT.has(sub)) out.push([SEV.clear, `the ${rep(sub)}'s sleeves cover the hands`, "FF1_sleeves_tailored"]);
        else if (RIBBED.has(sub)) out.push([SEV.minor, `the ${rep(sub)} cuffs bunch over the hands`, "FF1_cuffs_ribbed"]);
        else if (v >= BOXY) out.push([SEV.clear, `the ${rep(sub)} looks a size big: roomy, sleeves over the hands`, "FF5_too_big"]);
        else out.push([SEV.moderate, `the ${rep(sub)}'s sleeves run past the wrists`, "FF1_sleeves_long"]);
      }
      if (g.strain === "clear") out.push([SEV.clear, `the ${rep(sub)} pulls`, "FF6_strain"]);
    } else if (cat === "bottom") {
      const leg = nv(g.leg_shape);
      const dragsOnSlides = LOOSE_DENIM.has(sub) && LOOSE.has(leg) && o.shoes !== null && SLIDES.has(nv(o.shoes.subcategory));
      if (g.hem === "pooling" && !dragsOnSlides) { // loose jeans on slides: Shoes owns that hem
        const sev = PRESSED.has(sub) ? SEV.clear : LOUNGE_BOTTOMS.has(sub) ? SEV.minor : SEV.moderate;
        out.push([sev, `the ${rep(sub)} pile up on the shoes`, "FF7_pooling"]);
      }
      if (g.strain === "clear") out.push([NARROW.has(leg) ? SEV.moderate : SEV.clear, `the ${rep(sub)} pull`, "FF6_strain"]);
    }
    return out;
  }

  function fit(o: PartsOutfit): Part {
    const p = new Part(BASE);
    const pieces = [...o.tops, ...o.outers, ...(o.bottom ? [o.bottom] : [])];
    if (pieces.length === 0) {
      p.na = "no clothes to check";
      return p;
    }
    const scored: [number, Garment, [number, string, string][]][] = [];
    for (const g of pieces) {
      const fs = pieceFaults(g, o).sort((a, b) => b[0] - a[0]); // stable, like Python's sorted(key=-severity)
      const drop = fs.length > 0 ? pyMin(SEV.severe, fs[0]![0] + data.fit.pieceOthersRate * sum(fs.slice(1).map((f) => f[0]))) : 0.0;
      scored.push([drop, g, fs]);
      if (g.category === "bottom" && g.hem === "full_break" && NARROW.has(nv(g.leg_shape)) && g.certainty === "clear") {
        p.tip("slim pants with a full break run a little long; a hem to just touch the shoe", "FF7b_full_break_narrow", data.fit.tips.fullBreakNarrow);
      }
    }
    scored.sort((a, b) => b[0] - a[0]);
    const worst = scored[0]![0];
    const others = sum(scored.slice(1).map((x) => x[0]));
    const total = worst + data.fit.othersRate * others;
    if (total > 0) {
      scored.forEach(([d, , fs], i) => {
        if (d <= 0) return;
        p.add(-(i === 0 ? d : data.fit.othersRate * d), fs[0]![1], fs[0]![2]);
      });
    }
    return p;
  }

  // ---------------------------------------------------------------- COLOR (15%)
  function color(o: PartsOutfit, boldness: string): Part {
    const p = new Part(BASE);
    const C = data.color;
    const main = o.main.filter((g) => UPPER_OR_BOTTOM.includes(g.category));
    if (main.length < 2) {
      p.na = "fewer than two pieces of clothing in view";
      return p;
    }
    const colored = main.filter((g) => truthy(g.color_family) && g.color_family !== "multicolor");
    const accents = new Map<unknown, number>();
    for (const g of colored) {
      if (NEUTRALS.has(g.color_family)) continue;
      const f = fam(g);
      accents.set(f, pyMax(accents.has(f) ? accents.get(f)! : 0, H.halfAccent(g) ? C.accent.half : C.accent.full));
    }
    const nAcc = sum(Array.from(accents.values()));
    const families = new Set<unknown>(colored.map(fam));
    const street = o.det.includes("streetwear");
    if (nAcc >= C.tooManyAccents.atLeast) p.add(-C.tooManyAccents.points, "too many colors competing", "CC1_too_many_accents");
    else if (families.size >= C.busy.familiesAtLeast && nAcc >= C.busy.accentsAtLeast) p.add(-C.busy.points, "a few too many colors", "CC1_busy");
    const bright = main.filter((g) => isBright(g));
    if (new Set(bright.map(fam)).size >= C.brightClash.familiesAtLeast) {
      p.add(boldness === "bold" || street ? -C.brightClash.boldOrStreet : -C.brightClash.points, "two bright colors fighting", "CC2_bright_clash");
    }
    const jacket = o.outers.find((x) => SEPARATE_JACKETS.has(x.subcategory)) ?? null;
    const B = o.bottom;
    if (jacket && B && (B.subcategory === "trousers" || B.subcategory === "chinos") && DARK_SUITING.has(jacket.color_family)
        && DARK_SUITING.has(B.color_family) && nv(jacket.color_family) !== nv(B.color_family)) {
      p.add(-C.nearMatch, "the dark jacket and trousers almost match", "CC4_near_match");
    }
    const pats = main.filter((g) => !isNone(g.pattern) && g.pattern !== "solid");
    const seen = new Map<string, { scale: unknown; n: number }>();
    for (const g of pats) {
      if (g.pattern === "graphic") continue;
      const k = JSON.stringify([nv(g.pattern), nv(g.pattern_scale)]);
      const e = seen.get(k);
      if (e) e.n += 1;
      else seen.set(k, { scale: nv(g.pattern_scale), n: 1 });
    }
    const entries = Array.from(seen.values());
    if (entries.some((e) => e.n >= 2 && e.scale !== null && e.scale !== "na")) {
      p.add(-C.samePatternScale, "two of the same pattern at the same size", "CC6_same_pattern_scale");
    } else if (entries.some((e) => e.n >= 2)) {
      p.add(-C.samePattern, "the same pattern twice", "CC6_same_pattern");
    }
    if (pats.length >= C.threePatterns.atLeast && !street) p.add(-C.threePatterns.points, "three patterns at once", "CC6_three_patterns");
    const fault = p.reasons.length > 0;
    if (families.size === 1) p.tip("all one color: a lighter or darker piece would add depth", "CP3_tonal_flat");
    if (main.filter((g) => H.isDenim(g)).length >= 2) p.tip("double denim: make the washes clearly different", "CC5_denim_near_match", C.tips.doubleDenim);
    if (fault) return p;

    // positives (only when no fault)
    const nonNeutral = colored.filter((g) => !NEUTRALS.has(g.color_family));
    const pos: [number, string, string][] = [];
    if (bright.length === 1 && nonNeutral.length === 1 && earns(bright[0]!)) {
      const g = bright[0]!;
      pos.push([t.cp1, `the ${rep(g.color_family)} ${rep(g.subcategory)} is the one standout`, "CP1_standout_color"]);
      o.credited.add(g);
    } else if (bright.length === 0 && nonNeutral.length === 1 && earns(nonNeutral[0]!)) {
      const g = nonNeutral[0]!;
      pos.push([t.cp2, `the ${rep(g.color_family)} ${rep(g.subcategory)} is a quiet accent`, "CP2_quiet_accent"]);
    }
    const S = o.shoes;
    const upper = main.filter((g) => g.category === "top" || g.category === "outerwear");
    if (S !== null && !NO_TIE_IN.has(fam(S)) && !isBright(S) && upper.some((g) => fam(g) === fam(S))) {
      pos.push([t.cp5, `the shoes pick up the ${rep(fam(S))} up top`, "CP5_tie_in"]);
    }
    // v2: the lightness credits, only when the reading carries `lightness` on every main piece
    if (truthy(t.lightness) && main.length > 0 && main.every((g) => LV.includes(g["lightness"]))) {
      const fams = new Set<unknown>(main.map(fam));
      const lv = new Set<unknown>(main.map((g) => g["lightness"]));
      const shoeL = S !== null && LV.includes(S["lightness"]) ? (S["lightness"] as string) : null;
      const only = fams.size === 1 ? fams.values().next().value : undefined;
      if (fams.size === 1 && only !== "black" && lv.size >= 2) {
        pos.push([C.lightness.tonalRange, `all ${rep(only)}, with a lighter and a darker piece for depth`, "CP3_tonal_range"]);
      } else {
        const tb = main.filter((g) => g.category === "top" || g.category === "bottom");
        if (shoeL && tb.length > 0 && new Set(tb.map(fam)).size === 1 && !tb.some((g) => g["lightness"] === shoeL)) {
          pos.push([C.lightness.tonalShoes, "one color top and bottom, anchored by the shoes", "CP4_tonal_shoes"]);
        }
      }
      const firstOf = (cat: string): unknown => {
        const g = main.find((x) => x.category === cat);
        return g ? nv(g["lightness"]) : null;
      };
      const upL = or(firstOf("top"), firstOf("outerwear"));
      const botL = firstOf("bottom");
      if (shoeL && truthy(upL) && truthy(botL) && new Set([upL, botL, shoeL]).size === 3) {
        pos.push([C.lightness.lightMidDark, "light, mid and dark from top to shoes", "CP6_light_mid_dark"]);
      }
    }
    let total = 0.0;
    const cap = t.color_cap !== null ? t.color_cap : 99.0;
    for (const [pts0, line, check] of pos) {
      const pts = pyMin(pts0, cap - total);
      if (pts > 0) {
        p.add(pts, line, check);
        total += pts;
      }
    }
    return p;
  }

  // ---------------------------------------------------------------- SHOES (15%)
  const SH = data.shoes;
  /** 1.0 across the flat middle (-1.5 dressier .. +0.75 more casual), fading out linearly past each end. */
  function matchWindow(gap: number): number {
    if (gap < -SH.window.dressier[0]) return 1.0 - ramp(-gap, SH.window.dressier[0], SH.window.dressier[1]);
    if (gap > SH.window.casual[0]) return 1.0 - ramp(gap, SH.window.casual[0], SH.window.casual[1]);
    return 1.0;
  }

  function shoes(o: PartsOutfit, occasion: string, sl: SecondLook): Part {
    const p = new Part(BASE);
    const S = o.shoes, B = o.bottom;
    if (S === null) {
      p.na = "shoes not in the photo";
      return p;
    }
    const sub = nv(S.subcategory);
    if (sub === "other") { // type lost: the app asks "Boots, sneakers or slides?"; on Skip, NA (#123)
      p.na = "shoe type unclear (ask: boots, sneakers or slides?)";
      return p;
    }
    const clothes = o.main.filter((g) => UPPER_OR_BOTTOM.includes(g.category));
    if (clothes.length === 0) {
      p.na = "shoes only";
      return p;
    }
    const fs = formality(S);
    const mean = sum(clothes.map((g) => formality(g))) / clothes.length;
    const gap = mean - fs;
    const tailored = o.outers.some((g) => TAILORED.has(g.subcategory));
    const loungeOk = LOUNGE_OK.has(occasion);
    const leg = B ? nv(B.leg_shape) : null;
    const looseDenim = B !== null && LOOSE_DENIM.has(nv(B.subcategory)) && LOOSE.has(leg);
    const athleticBottom = B !== null && LOUNGE_BOTTOMS.has(nv(B.subcategory));
    let up = 1.0;

    if (SLIDES.has(sub) && !loungeOk) {
      p.score = tailored ? SH.slides.tailored : SH.slides.points;
      p.reasons.push({ check: "SK1_slides_out", points: pyRound(p.score - BASE, 3), line: "slides read as staying in" + (tailored ? " under a tailored jacket" : "") });
      const drag = !isNone(sl.restsOnShoe) ? sl.restsOnShoe : B !== null && SH.dragHems.includes(B.hem as string);
      if (looseDenim && truthy(drag)) p.add(-SH.hemDrags, "the loose jeans drag on the slides: the hem has nothing to sit on", "SK1b_hem_drags");
      up = 0.0;
    } else if (RUNNER.has(sub) && !loungeOk && !o.det.includes("outdoor")) {
      p.score = tailored ? SH.runners.tailored : SH.runners.points;
      p.reasons.push({ check: "SK2_runners", points: pyRound(p.score - BASE, 3), line: "running shoes read gym" + (tailored ? " under a tailored jacket" : " with these clothes") });
      up = 0.0;
    } else {
      if (tailored && BULKY.has(sub)) p.add(-SH.chunkyUnderTailoring, "chunky sneakers fight a tailored jacket", "SD4_chunky_under_tailoring");
      // too casual for the clothes: ramps against the clothes' average dressiness
      let tooCasual = 0;
      for (const r of SH.tooCasual) tooCasual += r.points * ramp(gap, r.from, r.to);
      if (loungeOk && (SLIDES.has(sub) || RUNNER.has(sub))) tooCasual = 0.0; // at the gym or at home they're the right shoe
      p.add(-tooCasual, "the shoes are more casual than the clothes", "SD2_too_casual");
      // much dressier than the clothes: a ramp, and it fades the upward moves out
      const tooDressy = ramp(-gap, SH.tooDressy.from, SH.tooDressy.to);
      p.add(-SH.tooDressy.points * tooDressy, "the shoes are much dressier than the clothes", "SD3_too_dressy");
      up = 1.0 - tooDressy;
      // matches the clothes' dressiness (a real shoe; with sweats only a sneaker matches)
      let real = ramp(fs, SH.matches.realFrom, SH.matches.realTo);
      if (athleticBottom && !SNEAKERS.has(sub)) real = 0.0;
      p.add(SH.matches.points * up * real * matchWindow(gap), "the shoes match how dressed-up the clothes are", "SD1_matches");
      // chosen for this look: an anchor or home shoe of a style the clothes read as WITHOUT the shoe
      const c = H.outfit(o.main);
      const role = maxOf(o.detNoShoe.length > 0 ? o.detNoShoe.map((st) => H.role(st, S, c)[0]) : [0]);
      const subs = new Set<unknown>(o.main.map((g) => nv(g.subcategory)));
      const suit = subs.has("suit_jacket") && subs.has("suit_trousers");
      if (truthy(role) && earns(S)) {
        const d0 = o.detNoShoe[0]!;
        p.add(SH.chosen * up, o.detNoShoe.length === 1 ? `a ${STYLE_NAMES[d0]} shoe for a ${STYLE_NAMES[d0]} outfit` : "the shoes belong to the look", "SC_chosen_for_look");
      } else if (truthy(t.suit_shoe) && suit && SUIT_SHOES.has(sub) && earns(S)) {
        p.add(SH.chosen * up, "the right shoes for a suit", "SC_chosen_for_look");
      }
    }
    // shoe weight against the leg (Shoes owns both directions)
    if (BULKY.has(sub) && NARROW.has(leg)) p.add(-SH.chunkyNarrow, "chunky sneakers look heavy under narrow legs", "SW1_chunky_narrow");
    else if (RUNNER.has(sub) && NARROW.has(leg)) p.add(-SH.runnerNarrow, "runners look heavy under narrow legs", "SW1_runner_narrow");
    if (BULKY.has(sub) && looseDenim && o.det.includes("streetwear") && B!.hem !== "pooling" && up > 0) {
      p.add(t.sw2 * up, "chunky sneakers carry the wide jeans", "SW2_weight_carries_leg");
    }
    // color (not for slides: their stripes read multicolor in some runs)
    if (!SLIDES.has(sub)) {
      const loud = isBright(S) || S.color_family === "multicolor";
      const loudClothes = clothes.filter((g) => isBright(g) || (!isNone(g.pattern) && g.pattern !== "solid" && (
        g.pattern_scale === "medium" || g.pattern_scale === "large" || g.pattern === "graphic" || g.pattern === "camo" || g.pattern === "floral"))).length;
      if (loud && loudClothes >= 1) p.add(-SH.loudVsLoud, "a loud shoe competing with a loud piece", "SCol1_loud_vs_loud");
      else if (loud && loudClothes === 0 && up > 0 && p.score >= BASE) p.add(SH.accent * up, "the shoes are the one accent", "SCol2_shoe_accent");
    }
    // wear (Condition skips footwear): a flat cost, half for work boots and suede
    const cf = careFault(S);
    if (cf !== null) {
      const half = WORN_HALF_SHOES.has(sub);
      p.add(half ? -SH.worn.half : -SH.worn.points, cf === "worn" ? "the shoes look worn" : "the shoes look dirty", "SQ_worn");
    }
    p.score = clamp(p.score, SH.range[0], SH.range[1]);
    if (leg === "wide" && DAINTY_SHOES.has(sub)) {
      p.tip("check the shoe isn't swallowed by the wide legs (a slim shoe can look dainty)", "SW3_dainty_wide", SH.tips.daintyWide);
    }
    return p;
  }

  // ---------------------------------------------------------------- COHESION / STYLE (15%)
  function cohesion(o: PartsOutfit, boldness: string): Part {
    const p = new Part(BASE);
    const CO = data.cohesion;
    if (o.slots.size < 2) {
      p.na = "fewer than two of top, bottoms and shoes in view";
      return p;
    }
    const det = o.det, label = o.label;
    const subs = new Set<unknown>(o.main.map((g) => nv(g.subcategory)));
    const suit = subs.has("suit_jacket") && subs.has("suit_trousers");
    if (det.length > 0 || suit) p.add(t.h1, label ? `reads as ${STYLE_NAMES[label]}` : "a matching suit", "H1_reads_as_style");
    // H2: the label style has an anchor (role 2) in all three slots and nothing against it; or a suit over a top
    if (label && o.slots.size === 3) {
      const c = H.outfit(o.main);
      const best = new Map<string, number>();
      let against = 0;
      for (const g of o.main) {
        const [pos, neg] = H.role(label, g, c);
        const s = SLOT[g.category as string]!;
        best.set(s, pyMax(best.get(s) ?? 0, pos));
        against += neg;
      }
      if (["upper", "bottom", "shoes"].every((s) => (best.get(s) ?? 0) >= 2) && against === 0) {
        p.add(t.h2, `clearly ${STYLE_NAMES[label]} top to toe`, "H2_clear_top_to_toe");
      }
    } else if (suit && o.tops.length > 0) {
      p.add(t.h2_suit, "a suit worn properly over a top", "H2_suit");
    }
    // H3: a piece from another world (the larger of the jacket rule and the spread rule, never both)
    const B = o.bottom;
    let h3 = 0.0;
    let h3Line = "";
    if (o.outers.some((x) => TAILORED.has(x.subcategory)) && B && B.subcategory === "jeans" && (
      LOOSE.has(nv(B.leg_shape)) || B.color_family === "denim_light" || B.color_family === "denim_mid" || truthy(B.distressed_by_design))) {
      h3 = CO.jacketJeans;
      h3Line = "the tailored jacket and the loose or washed jeans come from different worlds";
    }
    const nonshoe = o.main.filter((g) => g.category !== "footwear" && !(g.category === "bottom" && LOUNGE_BOTTOMS.has(g.subcategory)));
    const f = nonshoe.map((g) => formality(g));
    if (f.length >= 2 && maxOf(f) - minOf(f) >= CO.spread.atLeast) {
      const inner = nonshoe.filter((g) => g.category !== "outerwear").map((g) => formality(g));
      const bridged = inner.length >= 1 && (inner.length >= 2 ? maxOf(inner) - minOf(inner) < CO.spread.atLeast : true);
      if (!bridged) { // an outer layer is the one place a high-low mix works
        const amt = maxOf(f) - minOf(f) >= CO.spread.bigAtLeast ? CO.spread.bigPoints : CO.spread.points;
        if (amt > h3) {
          h3 = amt;
          h3Line = "formal and very casual pieces fight";
        }
      }
    }
    if (truthy(h3)) p.add(-h3, h3Line, "H3_another_world");
    // H5: too many statements (v4 B1's focal count, his boldness allowance)
    const ST = CO.statements;
    let focal = 0.0;
    for (const g of o.main.filter((x) => UPPER_OR_BOTTOM.includes(x.category))) {
      focal += isBright(g) ? ST.bright : H.halfAccent(g) ? ST.half : 0;
      if (!isNone(g.pattern) && g.pattern !== "solid" && (g.pattern_scale === "large" || g.pattern === "graphic" || g.pattern === "camo" || g.pattern === "floral")) {
        focal += ST.pattern;
      }
    }
    const baseAllow = has(ST.allowance, boldness) ? ST.allowance[boldness]! : ST.allowanceDefault;
    const allow = baseAllow + (det.includes("streetwear") ? ST.streetBonus : 0);
    if (focal > allow) p.add(-pyMin(ST.max, ST.perExtra * Math.ceil(focal - allow)), "too many things compete for attention", "H5_too_many_statements");
    // H4: one standout piece by pattern (a bright color is Color's; one garment, one credit)
    if (!o.colorFault && focal <= baseAllow) {
      let pat = o.main.filter((g) => UPPER_OR_BOTTOM.includes(g.category)
        && !(isNone(g.pattern) || g.pattern === "solid" || g.pattern === "graphic" || g.pattern === "other")
        && !(isNone(g.pattern_scale) || g.pattern_scale === "small" || g.pattern_scale === "na"));
      if (truthy(t.h4_graphic_street) && pat.length === 0 && det.includes("streetwear") && o.shoes !== null && PR4_SHOES.has(nv(o.shoes.subcategory))) {
        // what-if (off in every engine): a graphic print as streetwear's one standout
        pat = o.main.filter((g) => (g.category === "top" || g.category === "outerwear") && g.pattern === "graphic");
      }
      if (pat.length === 1 && earns(pat[0]!) && !o.credited.has(pat[0]!)) {
        const g = pat[0]!;
        p.add(t.h4, `the ${rep(g.pattern)} ${rep(g.subcategory)} is the one standout`, "H4_standout_piece");
      }
    }
    return p;
  }

  // ---------------------------------------------------------------- CONDITION (after the average)
  function condition(o: PartsOutfit, scene: Scene, occasion: string): PartsCondition {
    const CD = data.condition;
    if (scene.lighting === "dim") return { deduction: 0.0, faults: [], display: "couldn't check in this light", part: null };
    let care = 0.0;
    const faults: string[] = [];
    for (const g of o.main) {
      if (g.category === "footwear") continue;
      const name = rep(or(g.subcategory, "piece"));
      const c = g.condition;
      if (c === "stained" && g.certainty === "clear") {
        care += CD.stain;
        faults.push(`a stain on the ${name}`);
      } else if (c === "wrinkled") {
        care += LINEN_LIKELY.has(nv(g.subcategory)) ? CD.wrinkledLinen : CD.wrinkled;
        faults.push(`the ${name} looks wrinkled`);
      } else if (c === "pilled_or_worn" && !truthy(g.distressed_by_design)) {
        care += CD.worn;
        faults.push(`the ${name} looks worn`);
      }
    }
    care = pyMin(care, CD.cap);
    const T = o.top;
    let t1 = 0.0;
    if (T !== null && T.subcategory === "dress_shirt" && (T.tucked === "none" || isNone(T.tucked)) && (
      o.outers.some((x) => TAILORED.has(x.subcategory))
      || (o.bottom !== null && (o.bottom.subcategory === "trousers" || o.bottom.subcategory === "suit_trousers"))
      || DRESSY_OCCASIONS.has(occasion))) {
      t1 = CD.untuckedDressShirt;
      faults.push("the dress shirt is untucked");
    }
    const ded = care + t1;
    const part = !truthy(care) ? null : roundHalf(pyMax(CD.partFloor, BASE - CD.partRate * care));
    return { deduction: pyRound(ded, 3), faults, display: faults.length === 0 ? "clean" : faults.join("; "), part };
  }

  // ---------------------------------------------------------------- OCCASION (after the average; only holds down)
  const OC = data.occasion;
  function o1Ceiling(gap: number): number | null {
    const curve = OC.o1Curve;
    if (gap <= curve[0]![0]) return null;
    for (let i = 0; i + 1 < curve.length; i++) {
      const [g0, c0] = curve[i]!, [g1, c1] = curve[i + 1]!;
      if (gap <= g1) return c0 + (c1 - c0) * (gap - g0) / (g1 - g0);
    }
    return curve[curve.length - 1]![1];
  }

  function occasionPart(o: PartsOutfit, occasion: string): PartsOccasion {
    const core = o.main.map((g) => {
      let f = formality(g);
      if (g.category === "bottom" && LOUNGE_BOTTOMS.has(g.subcategory) && ATHLETIC_AS_CASUAL.has(occasion)) f = pyMax(f, OC.loungeAsCasual);
      return f;
    });
    const out: PartsOccasion = { deduction: 0.0, ceiling: null, lines: [], status: "right for it" };
    if (core.length === 0) return out;
    const occName = rep(occasion);
    const avg = sum(core) / core.length;
    const target = OCCASION_TARGET.has(occasion) ? OCCASION_TARGET.get(occasion)! : OC.default;
    const lo = target[0]!, hi = target[1]!;
    const gap = lo - avg;
    let ded = OC.casual.points * ramp(gap, OC.casual.from, OC.casual.to);
    const ceilings: [number, string][] = [];
    const c1 = o1Ceiling(gap);
    if (c1 !== null) ceilings.push([c1, `too casual for ${occName}`]);
    else if (ded > 0) out.lines.push(`a bit casual for ${occName}`);
    const over = avg - hi;
    const od = OC.overdressed.points * ramp(over, OC.overdressed.from, OC.overdressed.to);
    if (od > ded) {
      ded = od;
      out.lines.push(`a bit dressy for ${occName}`);
    }
    const B = o.bottom, S = o.shoes;
    const dressyRoom = DRESSY_ROOM.has(occasion);
    const CE = OC.ceilings;
    if (B !== null && LOUNGE_BOTTOMS.has(B.subcategory) && !LOUNGE_OK.has(occasion)) {
      if (dressyRoom) {
        ceilings.push([CE.loungeDressy, "athletic bottoms at a dressy occasion"]);
      } else {
        const dressed = o.outers.some((x) => DRESSED_OUTER.has(x.subcategory)) || o.tops.some((x) => DRESSED_TOPS.has(x.subcategory));
        // shoes out of the photo count as a real shoe: what isn't in the photo never costs points
        const realShoe = S === null || !NOT_REAL_SHOES.has(S.subcategory);
        const kit = B.subcategory === "athletic_shorts" && o.tops.some((x) => x.subcategory === "jersey");
        const signs = kit ? 0 : (dressed ? 1 : 0) + (realShoe ? 1 : 0);
        const hero = signs === 2 && H.outfit(o.main).hero.length > 0;
        const gymShortsOk = B.subcategory === "athletic_shorts" && !kit && realShoe;
        if (!hero && !gymShortsOk) ceilings.push([CE.loungeLadder[signs]!, "loungewear out of the house"]);
      }
    }
    if (dressyRoom && S !== null && SLIDES.has(nv(S.subcategory))) ceilings.push([CE.slidesDressy, "slides at a dressy occasion"]);
    if (INTERVIEWISH.has(occasion) && S !== null && SNEAKERS.has(S.subcategory) && o.outers.some((x) => TAILORED.has(x.subcategory))) {
      ceilings.push([CE.sneakersBlazer, "sneakers under a blazer at an interview"]);
    }
    if (INTERVIEWISH.has(occasion) && o.main.some((g) => g.logo === "large" && g.certainty === "clear")) ceilings.push([CE.bigLogo, "a big logo at an interview"]);
    out.deduction = pyRound(ded, 3);
    if (ceilings.length > 0) {
      let m = ceilings[0]!;
      for (const x of ceilings) if (x[0] < m[0]) m = x; // min(): the first lowest
      out.ceiling = pyRound(m[0], 3);
      out.lines.push(`${m[1]}: held to ${pyFloat(roundHalf(m[0]))}`);
      out.status = out.lines[out.lines.length - 1]!;
    } else if (out.lines.length > 0) {
      out.status = out.lines[0]!;
    }
    out.dressiness = pyRound(avg, 3);
    return out;
  }

  // ---------------------------------------------------------------- the steps after the parts
  /** The bonus after the average: excellence in a second part adds up instead of being averaged away. */
  function earnedBonus(ps: Map<PartName, number>): number {
    const e = t.earned;
    if (!e || ps.size === 0) return 0.0;
    const vals = Array.from(ps.values());
    const ex = vals.map((v) => pyMax(0.0, v - e.over)).sort((a, b) => b - a);
    const raw = e.rate * sum(ex.slice(1));
    const gate = ramp(minOf(vals), e.gate[0], e.gate[1]);
    return pyRound(pyMin(e.cap, raw) * gate, 4);
  }

  function combine(ps: Map<PartName, number>, cond: PartsCondition, occ: PartsOccasion, occasion: string, careOrStrain: boolean) {
    let wsum = 0;
    for (const k of ps.keys()) wsum += W[k];
    let num = 0;
    for (const [k, v] of ps) num += W[k] * v;
    const avg = num / wsum;
    let x = avg + earnedBonus(ps) - cond.deduction - occ.deduction;
    if (occ.ceiling !== null) x = pyMin(x, occ.ceiling);
    let floored = false;
    if (FLOOR_OCCASIONS.has(occasion) && !careOrStrain && x < data.final.floor) {
      x = data.final.floor;
      floored = true;
    }
    return { avg, x: pyMax(data.final.min, pyMin(data.final.max, x)), floored, wsum };
  }

  // ---------------------------------------------------------------- the entry point
  function scoreParts(reading: Reading, opts: PartsOptions = {}): PartsResult {
    const occasion = opts.occasion ?? "everyday";
    const boldness = opts.boldness ?? "a_little";
    const picks = opts.styles ?? null;
    // picks reach detectStyles as ordered pairs (Python dict semantics) and only choose the label
    const sl = secondLook(opts.secondLook);
    const prep = H.prepare(reading);
    const scene = prep.scene;
    if (scene.clothed !== "fully") return { overall: null, reason: "not_fully_clothed", parts: {}, naParts: [...ORDER] };
    if (prep.garments.length === 0) return { overall: null, reason: "nothing_readable", parts: {}, naParts: [...ORDER] };
    const garments = refile(prep.garments);
    const o = outfit(garments, picks);
    o.mirror = truthy(scene.mirror_selfie);

    const col = color(o, boldness);
    o.colorFault = col.reasons.length > 0 && col.reasons.some((r) => r.points < 0);
    const parts: Record<PartName, Part> = {
      proportions: proportions(o, sl), fit: fit(o), color: col, shoes: shoes(o, occasion, sl), cohesion: cohesion(o, boldness),
    };
    const res = {} as Record<PartName, PartResult>;
    for (const k of ORDER) {
      const r = k === "cohesion" ? data.partRange.cohesion : data.partRange.default;
      res[k] = parts[k].result(r[0], r[1]);
    }
    const live = new Map<PartName, PartResult>();
    for (const k of ORDER) if (res[k].score !== null) live.set(k, res[k]);
    if (live.size === 0) return { overall: null, reason: "no_part_readable", parts: res, naParts: [...ORDER] };
    const cond = condition(o, scene, occasion);
    const occ = occasionPart(o, occasion);
    const careOrStrain = o.main.some((g) => careFault(g) !== null) || o.main.some((g) => g.strain === "clear");
    const ps = new Map<PartName, number>();
    for (const [k, r] of live) ps.set(k, r.score!);
    const { avg, x, floored, wsum } = combine(ps, cond, occ, occasion, careOrStrain);
    const bonus = earnedBonus(ps);

    // the lowest part leads the card, with its one-line reason (ties: the heavier part)
    let lowK: PartName | null = null;
    for (const k of live.keys()) {
      if (lowK === null) {
        lowK = k;
        continue;
      }
      const a = live.get(k)!.score!, b = live.get(lowK)!.score!;
      if (a < b || (a === b && -W[k] < -W[lowK])) lowK = k;
    }
    const lr = live.get(lowK!)!;
    const neg = lr.reasons.filter((r) => r.points < 0);
    const line = neg.length > 0 ? neg[0]!.line : lr.reasons.length > 0 ? lr.reasons[0]!.line : data.copy.lowestFallback[lowK!];
    let lowest: PartsLowest = { part: lowK, score: lr.display!, line: `${data.partNames[lowK!]} ${pyG(lr.display!)}: ${line}` };
    if (truthy(t.solid_line) && Array.from(live.values()).every((r) => r.display === BASE)) {
      // the founder's call (Oct 10): when every part is 7, don't name a "weakest" part
      lowest = { part: null, score: BASE, line: data.copy.solidLine };
    }
    const weightsUsed: Partial<Record<PartName, number>> = {};
    for (const k of live.keys()) weightsUsed[k] = pyRound(W[k] / wsum, 3);
    return {
      overall: roundHalf(x), rawScore: pyRound(x, 3), rawUnrounded: x, average: pyRound(avg, 3), averageUnrounded: avg, earnedBonus: bonus,
      version: data.label, engine: data.engine,
      parts: res, naParts: ORDER.filter((k) => res[k].score === null), weightsUsed,
      condition: cond, occasion: occ, floored, careOrStrain, lowest, secondLook: sl,
      detectedStyles: o.det, styleLabel: o.label, notRated: prep.notRated, partial: prep.notRated.length > 0,
    };
  }

  return { data, scoreParts };
}

/** The parts engine built from the bundled data (partsData.ts = fixtures/parts.json) on the bundled v4.1 rubric. */
export const defaultParts: PartsEngine = createParts(PARTS_DATA);

/** parts_proto.score_parts() (engine v3) with the bundled data. Never mutates `reading`. Not wired into the app yet. */
export function scoreParts(reading: Reading, opts: PartsOptions = {}): PartsResult {
  return defaultParts.scoreParts(reading, opts);
}

/** parts_proto.card_row: "Proportions 7 · Fit 5.5 · Color 7 · Shoes 7.5 · Style 7.5" (NA parts left out). */
export function partsCardRow(result: PartsResult, data: PartsData = PARTS_DATA): string {
  return data.partOrder
    .filter((k) => result.parts[k]?.display != null)
    .map((k) => `${data.partNames[k]} ${pyG(result.parts[k]!.display!)}`)
    .join(" · ");
}
