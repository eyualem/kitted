// Exact TypeScript port of the parts engine, extraction-test/rubrics/parts_proto.py engine "v11" (parts-proto-11, the
// default since Oct 13: v10 plus a covered base top judged by the layer over it and skinny joggers charged, rubric/research/parts/v11.md;
// v10: v9 plus the creators' rules, rubric/research/parts/v10.md; v9: v8 plus four consensus fixes, #232; v8: v7 retuned against the gold-set panel, #227-228, rubric/research/parts/gold-retune.md; v7 was the
// default from Oct 11; DECISIONS-LOG #195-219: v3 plus the workwear and outdoor shapes, the track jacket as a short
// layer, H2 judged on the pick-free label so picks never move a number (v4), SX1 "a piece from another look", the
// style-crossing fault on Style (v5), and v6: PB1 "roomier than the look" (the style council's per-style bands as one
// Proportions fault, with PB2 its leg-side tip), H2 judged on every style the outfit reads as, and Event's softer
// band), and v7: a condition read (wrinkled, worn, stained) moves points only on a garment read "clear"; on a
// "likely" one it is a no-points Condition tip (#219). The app scores new checks with it (features/fitcheck/scoring.ts).
//
// "The AI sees, the code judges": it reads only the garment description (plus the optional second look's two yes/no
// answers). It never reads a face, body or skin, and never his profile (picks only choose the "Reads as" label).
//
// How a score is made: five PARTS (v8: Proportions 30 · Fit 15 · Color 20 · Shoes 15 · Style 20), each 1-10 from
// its own checks, NA parts dropping out; their weighted average; the earned bonus; minus "problems add up" (v8); minus Condition; minus the occasion's
// small deduction, held under its ceiling; the 5.0 floor at ordinary occasions, the 3.0 floor; round to the half.
//
// Parity rules (verified against fixtures/parts_parity.json, every case, bit for bit):
//  - same operation order as Python wherever a float is summed or multiplied, and Python's round(x, n) (pyRound)
//    wherever parts_proto.py rounds, including the rounded values it feeds back into the arithmetic
//  - Python `x in (…)` on a missing key is `None in (…)`: undefined and null both mean None (nv)
//  - one garment, one credit: "already credited" is object identity on our own copies (Python's id(g))
//  - where Python would raise (a garment without a subcategory reaching a reason line), this throws the same error
// Numbers and tables come from PartsData (bundled partsData.ts = fixtures/parts.json, version 1.8.0); the v4.1
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
  /** v4: PR5 "the workwear shape" (0 = off in v1-v3) and what it needs. */
  pr5: number;
  pr5_layers: string[];
  pr5_bottoms: string[];
  pr5_shoes: string[];
  /** v4: PR6 "the outdoor shape" (0 = off in v1-v3) and what it needs. */
  pr6: number;
  pr6_layers: string[];
  pr6_shoes: string[];
  /** v4: layers that count as PR2's short layers on top of SHORT_LAYERS (the track jacket). */
  short_layers_extra: string[];
  /** What-if (off in every engine): "the look's own shoe" also for a style detected with the shoe. */
  sc_pair: boolean;
  /** v4: H2 reads the label the outfit gets with no picks, so picks never move a number. */
  h2_pick_free: boolean;
  /** v5: SX1 "a piece from another look" on Style (0 = off in v1-v4) and what it reads. */
  sx: number;
  /** Tops that are street-coded by type (the graphic tee); any top at boxyVolume+ is too. */
  sx_street_tops: string[];
  /** The dressy looks' pieces streetwear rules out (its vetoes plus chinos). */
  sx_dressy: string[];
  /** How many of them the rest of the outfit needs. */
  sx_min_dressy: number;
  /** The quiet looks and the top of each one's volume band. */
  sx_quiet: Record<string, number>;
  /** v6: PB1 "roomier than the look" on Proportions (0 = off in v1-v5; also gates PB2's tip). */
  pb: number;
  /** Styles whose (top, leg) band box holds a roomy top over a full leg. */
  pb_roomy_full: string[];
  /** Styles whose band box holds a roomy top over a slim leg (outdoor). */
  pb_roomy_narrow: string[];
  /** Styles whose leg band reaches wide (PB2's tip is for the others and for no style). */
  pb_wide_ok: string[];
  /** v6: H2 is judged on every style the outfit reads as, not only the label (KD-5). */
  h2_any: boolean;
  /** v6: occasion bands that replace the rubric's OCCASION_TARGET ({event: [3, 4]}). */
  occ_target: Record<string, [number, number]>;
  /** v7: a condition read moves points only on a garment read "clear"; otherwise a no-points Condition tip. */
  cond_clear_only: boolean;
  // ---- v8 (the gold-set retune, #227-228; every knob off / null in v1-v7)
  /** The part weights (null = PartsData.weights). Also break the "lowest part" tie and fill weightsUsed. */
  weights: Record<PartName, number> | null;
  /** "Problems add up": each part's shortfall under `under`, the largest dropped, `rate` of the rest off, at most `cap`. */
  penalty: { under: number; rate: number; cap: number } | null;
  /** A roomy non-tailored piece with long sleeves is the cut (minor), not "a size big". */
  ff5_roomy: boolean;
  /** Pooling on a loose leg: nothing on jeans / cargos, minor otherwise, and no block on the shape rewards. */
  ff7_loose: boolean;
  /** PN1 a narrow leg on Proportions, skinny extra, ripped jeans extra (not under tailoring, not suit trousers). */
  pn_narrow: number;
  pn_skinny: number;
  pn_rip: number;
  /** PR1 over a loose leg / over a straight one (null = v7's pr1 and mirror guard). */
  pr1_loose: number | null;
  pr1_straight: number | null;
  /** A knit (ribbed hem) at the belt over a loose leg earns PR1. */
  pr1_ribbed_loose: boolean;
  /** PR2b: a layer read ending at the belt over a loose leg (not a short layer by type). */
  pr2b: number;
  /** No "much dressier than the clothes" (except with sweats); no "dainty under wide legs" tip. */
  sd3_off: boolean;
  sw3_off: boolean;
  /** Running shoes off the gym (null = PartsData.shoes.runners.points). */
  sk2_runner: number | null;
  /** Slides cost this much less when no other part has a fault of 1 or more. */
  sk1_soft: number;
  /** CL1 a loud print on Color. */
  cl1: number;
  /** TK1 a tank top as the only top, out of the house, on Style. */
  tk1: number;
  /** The loungewear ceiling rises this much when the outfit reads as a style. */
  lounge_style: number;
  // ---- v9 (four consensus fixes, #232; off / null in v1-v8)
  /** An interview with no collared top, knit or jacket is held to int_top; a hoodie or sweatshirt to int_hoodie. */
  int_top: number | null;
  int_hoodie: number | null;
  /** Two denim pieces in the same light or mid wash cost this on Color. */
  dd_same: number;
  /** An oversized graphic tee under a tailored jacket costs this on Style. */
  gt1: number;
  /** CL1 skips a non-bright piece that is an anchor or home piece of a loud-native look the outfit reads as. */
  cl1_own: boolean;
  // ---- v10 (the creators' rules; off in v1-v9)
  /** PN1 on a slim (not skinny) leg says "would balance better with a straight leg" instead of "read dated". */
  pn_slim_soft: boolean;
  /** COL-11: one bright piece, the only accent, toned down by a dark neutral beside it, earns this on Color. */
  cp1_dark: number;
  // ---- v11 (two fixes from the creators' own outfits; off in v1-v10)
  /** STY-4 (H3's level gap) leaves out a base top (BASE_TOPS) worn under another top layer (COVER_TOPS or any outer). */
  h3_base_covered: boolean;
  /** PRO-13: skinny joggers or sweatpants cost this on Proportions out of the gym and home (on top of the loungewear holds). */
  pn_lounge_skinny: number;
  // ---- v12 (the founder's calls on his Oct 14 checks; off in v1-v11)
  /** COL-8: a bright graphic print is loud only at a medium or large print size, or with a large logo (also the COL-11 guard). */
  cl1_scale: boolean;
  /** PRO-13 and every rule that groups slim/skinny legs: a leg read straight at roominess <= this is judged slim (null: off). */
  pn_fitted_vol: number | null;
  /** COL-12: light on light (top or outer layer and bottoms in LIGHT_NEUTRALS, no LL_DARK piece) costs this on Color. */
  ll1: number;
  /** CON-6: the wrinkle charge by garment and look. */
  wr_look: boolean;
  // ---- v13 (wrinkled knit tops by look; v12's two fixed amounts became knobs: 0.2 in v12, 0 in v1-v11)
  /** CON-6: the half charge (casual wovens off a loud-native look, an oxford with jeans at Everyday or Class). */
  wr_half: number;
  /** CON-6: a tee or graphic tee under a tailored jacket. */
  wr_knit_tailored: number;
  /** CON-6: a knit top on a minimal, smart casual or classic prep look (none of the loud-native looks); 0 in v1-v12. */
  wr_knit_clean: number;
  // ---- v14 (casual and athletic fits, #331-#335; off / null in v1-v13)
  /** PRO-1, PRO-15, PRO-16: shorts get Proportions, judged like pants. */
  sh_prop: boolean;
  /** A roomy top worn alone over loose shorts / a short jacket over them (one credit, at most sh_cap). */
  sh_shape: number;
  sh_layer: number;
  sh_cap: number;
  /** A roomy top over short, fitted shorts; short, tight shorts (or shorts that pull) under any top. */
  sh_roomy_fitted: number;
  sh_fitted: number;
  /** SHO-4: any clean sneaker (not running shoes) or boot is a real shoe for "the shoes match". */
  sd1_any_sneaker: boolean;
  /** STY-12: "the pieces go together" on Style (no look, not a suit, every part >= 7, a shoe credit, no condition fault). */
  goes_together: number;
  /** VSP-9: a matched track jacket and track pants on Style. */
  tracksuit: number;
  /** LNG-8: gym shorts with running shoes aren't held at Everyday and Class. */
  gym_runner_unheld: boolean;
  /** LNG-9: a matched sweatsuit counts as the dressed upper half; in a relaxed shape with a clean sneaker, +this on Proportions. */
  sweatsuit_sign: boolean;
  sweatsuit_shape: number;
  /** LNG-2: at Everyday and Class reading as a look counts as the dressed upper half (instead of lounge_style). */
  look_sign: boolean;
  /** LNG-4: a full kit is held to kit_cap, minus kit_fit_rate x what Fit or Proportions lost (null: today's ladder). */
  kit_cap: number | null;
  kit_fit_rate: number;
  /** SHO-4, SHO-7, SHO-9: a shoe too heavy for the leg (chunky, basketball or running shoes under slim or skinny legs) earns
   *  neither "the shoes match" nor "the look's own shoe". */
  sw1_blocks_credit: boolean;
  /** PRO-4 (#336): a button-up worn open as the one layer and read fully tucked sets the waist like a tucked top. */
  pr1_tucked_layer: boolean;
  /** v14 (#367): only a top that "clearly" shows below the outer piece is a peek; "a little" is a deliberate layer. */
  peek_clearly_only: boolean;
  // ---- v15 (#385; 0 in v1-v14)
  /** PRO-17: a hoodie or sweatshirt worn as the one layer over a tee and full legs earns this on Proportions (in PR2b's place). */
  hl: number;
  /** COL-13: the one outer layer in the bottoms' color family (not NO_TIE_IN, not bright, not sweats or tailoring), with a top
   *  of another family between them, earns this on Color. */
  cp8: number;
}

interface Range { points: number; from: number; to: number }

/** fixtures/parts.json (make_parts_json.py). */
export interface PartsData {
  version: string;
  /** "v7" for the bundled data; "v1" - "v6" reproduce the earlier prototypes. */
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
  /** v14: what the switch (CASUAL_FITS_V14) rolls back to: the same tables with v13's engine, label, version and tune. */
  rollback?: { engine: string; label: string; version: string; tune: PartsTune };
  /** v15: what the second switch (HOODIE_LAYER_V15) rolls back to: v14's engine, label, version and tune. */
  rollback14?: { engine: string; label: string; version: string; tune: PartsTune };
  /** T69 (stub): what the third switch (RESCORE_V16) rolls back to: v15's engine, label, version and tune. */
  rollback15?: { engine: string; label: string; version: string; tune: PartsTune };
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
  /** v7: condition reads on garments that weren't "clear", not counted (no points). Empty in dim light and in v1-v6. */
  tips: PartTip[];
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
  /** T69 (stub, tasks/T69/IMPLEMENTATION.md → Interfaces): v16 only. */
  season?: Season;
  /** T69 (stub): v16 only, the look(s) the taste rules follow. */
  gradedLook?: string | readonly string[] | null;
}

/** T69 (stub): v16's temperature band: "warm", or cool as null/undefined. */
export type Season = "warm" | null;

/** T69 (stub): parts_proto's result["v16"], camelCased (tasks/T69/IMPLEMENTATION.md → Interfaces). */
export interface PartsV16 {
  season: "warm" | "cool";
  lifts: { id: string; size: number; line: string; layer: boolean }[];
  liftSum: number;
  minor: number;
  faultDrop: number;
  heavyLayer: [number, string] | null;
  caps: { cap: number; id: string; kind: "sink" | "hold" | "clash"; line: string }[];
  stackCeiling: number;
  oneLook: boolean;
  heldBy: string | null;
  raw: number;
  rawUnclamped: number;
  condDeduction: number;
  curved: number;
  owned: string[];
  ceiling: number;
  depends: [string, number, number] | null;
  unread: Record<string, string>;
  taste: { points: number; id: string; line: string }[];
  gradedLook: string[];
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
  /** v8: "problems add up" (0 in v1-v7), already inside rawScore. */
  piledPenalty: number;
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
  /** T69 (stub): present only when the engine is v16. */
  v16?: PartsV16;
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
  /** The label with no picks (v4's H2). */
  labelNoPick: DetectedStyle | null;
  detNoShoe: DetectedStyle[];
  slots: Set<string>;
  credited: Set<Garment>;
  colorFault: boolean;
  mirror: boolean;
  /** v5's SX1 result [points, line, tip], computed once (Style reads it; v6's PB1 stands down when it fires). */
  sx: [number, string | null, string | null];
  /** The occasion key (v8's TK1 reads it). */
  occasion: string;
  /** v14: the full kit's hold was set (scoreParts lowers it by what Fit or Proportions lost). */
  kitHold?: boolean;
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
  const LOUD_PATTERNS = PS("LOUD_PATTERNS"), LOUD_LOGO_TOPS = PS("LOUD_LOGO_TOPS");
  const INT_TOPS = PS("INT_TOPS"), INT_OUTERS = PS("INT_OUTERS"), HOODIES = PS("HOODIES"), LOUD_NATIVE = PS("LOUD_NATIVE");
  const DARK_NEUTRALS = PS("DARK_NEUTRALS");
  const BASE_TOPS = PS("BASE_TOPS"), COVER_TOPS = PS("COVER_TOPS"); // v11 STY-4: a base top under a layer
  const LIGHT_NEUTRALS = PS("LIGHT_NEUTRALS"), LL_DARK = PS("LL_DARK"); // v12 COL-12: light on light
  const WR_KNITS = PS("WR_KNITS"), WR_TEES = PS("WR_TEES"), WR_CASUAL = PS("WR_CASUAL"), WR_DRESSY_OCC = PS("WR_DRESSY_OCC"); // v12 CON-6
  const WR_CLEAN = PS("WR_CLEAN"); // v13 CON-6: looks where a crisp tee is part of the look
  const SPORT_SNEAKERS = PS("SPORT_SNEAKERS"), BOOTS = PS("BOOTS"); // v14 SHO-4: the clean sneakers and the boots
  const SWEAT_TOPS = PS("SWEAT_TOPS"), SWEAT_BOTTOMS = PS("SWEAT_BOTTOMS"); // v14 LNG-9: a matched sweatsuit
  const TUCKABLE_LAYERS = PS("TUCKABLE_LAYERS"); // v14 PRO-4 (#336): button-ups worn open
  const HL_LAYERS = PS("HL_LAYERS"), HL_TOPS = PS("HL_TOPS"); // v15 PRO-17: a hoodie layered over a tee
  /** v10 COL-11's guard (parts_proto._loud_print): a graphic print, or a large check, floral, camo or other print.
   *  v12 (cl1_scale): a graphic print only at a medium or large print size, or with a large logo. */
  const loudPrint = (g: Garment): boolean => {
    if (g.pattern === "graphic" && truthy(t.cl1_scale)) return g.pattern_scale === "medium" || g.pattern_scale === "large" || g.logo === "large";
    return g.pattern === "graphic" || (LOUD_PATTERNS.has(nv(g.pattern)) && g.pattern_scale === "large");
  };
  const WT: Record<PartName, number> = t.weights ?? W; // v8: the tuned weights (combine, weightsUsed, the lowest tie)
  const PR4_SHOES = tset(t.pr4_shoes), PR4_LEGS = tset(t.pr4_legs);
  const PR5_LAYERS = tset(t.pr5_layers), PR5_BOTTOMS = tset(t.pr5_bottoms), PR5_SHOES = tset(t.pr5_shoes);
  const PR6_LAYERS = tset(t.pr6_layers), PR6_SHOES = tset(t.pr6_shoes);
  const SHORT_LAYERS_ALL = new Set<unknown>([...SHORT_LAYERS, ...t.short_layers_extra]);
  const SX_STREET_TOPS = tset(t.sx_street_tops), SX_DRESSY = tset(t.sx_dressy);
  const SX_QUIET = new Map<unknown, number>(Object.entries(t.sx_quiet));
  const PB_ROOMY_FULL = tset(t.pb_roomy_full), PB_ROOMY_NARROW = tset(t.pb_roomy_narrow), PB_WIDE_OK = tset(t.pb_wide_ok);

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
  /** v12 (pn_fitted_vol; parts_proto._leg): the leg Proportions, Fit and Shoes judge. A leg read straight at roominess
   *  <= pn_fitted_vol is judged slim; not sweats or joggers, a suit's trousers, or under a tailored jacket. */
  const legOf = (B: Garment | null, o: PartsOutfit): unknown => {
    const leg = B ? nv(B.leg_shape) : null;
    const cut = t.pn_fitted_vol;
    if (B !== null && cut !== null && cut !== undefined && leg === "straight" && vol3(B) <= cut
        && !LOUNGE_BOTTOMS.has(nv(B.subcategory)) && B.subcategory !== "suit_trousers"
        && !(o.outer !== null && TAILORED.has(nv(o.outer.subcategory)))) return "slim";
    return leg;
  };
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
  /**
   * v7 (cond_clear_only): on the engine's own copies, a condition read on a garment that isn't "clear" becomes "clean"
   * (kept as condition_raw) and a no-points tip, in garment order. Clothes worn by design were already excused.
   */
  function unsureCare(garments: Garment[]): PartTip[] {
    const tips: PartTip[] = [];
    if (!truthy(t.cond_clear_only)) return tips;
    for (const g of garments) {
      const c = g.condition;
      if (!(c === "wrinkled" || c === "pilled_or_worn" || c === "stained") || g.certainty === "clear") continue;
      const foot = g.category === "footwear";
      if (c === "pilled_or_worn" && truthy(g.distressed_by_design) && !foot) continue;
      const name = foot ? "shoes" : rep(or(g.subcategory, "piece"));
      const what = c === "wrinkled" ? `the ${name} might be wrinkled` : c === "pilled_or_worn" ? `the ${name} might look worn` : `there might be a stain on the ${name}`;
      const check = c === "wrinkled" ? "C_unsure_wrinkled" : c === "pilled_or_worn" ? "C_unsure_worn" : "C_unsure_stain";
      tips.push({ check, line: `${what}; not counted, it isn't clear enough in the photo`, wouldCost: null });
      g["condition_raw"] = c;
      g.condition = "clean";
    }
    return tips;
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
    if (has(s, "under_shows")) out.peek = s.under_present === "yes" && (s.under_shows === "clearly" || (!truthy(t.peek_clearly_only) && s.under_shows === "a_little"));
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
    const d0 = picks && picks.length > 0 ? rubric.detectStyles(gs, []) : d;
    return {
      tops, outers, top: tops[0] ?? null, outer: outers[0] ?? null,
      bottom: gs.find((g) => g.category === "bottom") ?? null, shoes: gs.find((g) => g.category === "footwear") ?? null,
      main, det: d.detected, label: d.label, labelNoPick: d0.label, detNoShoe: nd.detected, slots: new Set(main.map((g) => SLOT[g.category as string]!)),
      credited: new Set(), colorFault: false, mirror: false, sx: [0.0, null, null], occasion: "everyday",
    };
  }

  /** v6's PB1: a roomy top worn on its own outside every (top, leg) band box the outfit reads as. [points, line] or null. */
  function bandFault(o: PartsOutfit): [number, string] | null {
    if (!truthy(t.pb)) return null;
    const T = o.top, O = o.outer, B = o.bottom;
    if (T === null || O !== null || B === null || vol3(T) < BOXY) return null;
    const leg = legOf(B, o), bsub = nv(B.subcategory), sub = or(T.subcategory, "") as string;
    const narrow = NARROW.has(leg) && leg !== "skinny", full = FULL_LEG.has(leg); // skinny: PF5 owns it
    if (!(narrow || full) || LOUNGE_BOTTOMS.has(bsub) || truthy(o.sx[0])) return null; // loungewear: its ladder; SX1: one fact, one charge
    if (T.sleeve_end === "covers_hand" && !SHORT_SLEEVE_TYPES.has(sub) && !TAILORED_FIT.has(sub) && !RIBBED.has(sub)) return null; // FF5 owns it
    if (full && (T.tucked === "full" || SHORT_TOP_LENGTHS.has(nv(T.length)) || PRESSED.has(bsub))) return null; // a waist; city boy
    const ok = narrow ? PB_ROOMY_NARROW : PB_ROOMY_FULL;
    if (o.det.some((s) => ok.has(s))) return null; // a look the outfit reads as holds it
    const what = rep(or(sub, "top"));
    if (narrow) return [t.pb, `a roomy ${what} over slim legs: an oversized top wants a fuller leg`];
    const look = o.label ? `a ${STYLE_NAMES[o.label]} outfit` : "the rest of the outfit";
    return [t.pb, `the roomy ${what} is roomier than ${look} calls for`];
  }

  /** v14: a hoodie or sweatshirt with sweatpants or joggers in the same colour family (parts_proto._sweatsuit). */
  function sweatsuit(o: PartsOutfit): boolean {
    const up = [...o.tops, ...o.outers].filter((g) => SWEAT_TOPS.has(nv(g.subcategory)));
    const B = o.bottom;
    return up.length > 0 && B !== null && SWEAT_BOTTOMS.has(nv(B.subcategory)) && up.some((g) => fam(g) === fam(B));
  }

  /** v14 (PRO-1, PRO-15, PRO-16; parts_proto._shorts_proportions): shorts judged like pants. */
  function shortsProportions(o: PartsOutfit): Part {
    const p = new Part(BASE);
    const T = o.top, O = o.outer, B = o.bottom!, S = o.shoes;
    const vol = vol3(B);
    const loose = LOOSE.has(nv(B.leg_shape)) || vol >= BOXY;
    const fitted = NARROW.has(nv(B.leg_shape)) || vol <= 2;
    const sSub = S !== null ? nv(S.subcategory) : null;
    const real = S !== null && !SLIDES.has(sSub) && (!RUNNER.has(sSub) || LOUNGE_OK.has(o.occasion));
    if (T !== null && O === null && vol3(T) >= BOXY && fitted && !loose) {
      p.add(-t.sh_roomy_fitted, "a roomy top over short, fitted shorts: it wants a fuller pair", "PS2_roomy_over_fitted");
      return p;
    }
    if (truthy(t.sh_fitted) && B.strain === "clear") {
      p.add(-t.sh_fitted, "the shorts pull: a size up would sit better", "PS3_fitted_shorts");
      return p;
    }
    if (truthy(t.sh_fitted) && fitted && !loose) {
      p.add(-t.sh_fitted, "the shorts look short and tight; a fuller pair balances the outfit", "PS3_fitted_shorts");
      return p;
    }
    let rewards: [number, string, string][] = [];
    if (loose && real) {
      const oSub = O !== null ? nv(O.subcategory) : null;
      if (O === null && T !== null && earns(T) && (isNone(T.tucked) || T.tucked === "none" || T.tucked === "na")
          && T.length !== "below_crotch" && vol3(T) >= BOXY) {
        rewards.push([t.sh_shape, `a roomy ${rep(or(T.subcategory, "top"))} over loose shorts: a deliberate shape`, "PS1_shorts_shape"]);
      }
      if (O !== null && earns(O) && !TAILORED.has(oSub)
          && (SHORT_LAYERS.has(oSub) || oSub === "track_jacket" || O.length === "cropped" || O.length === "at_belt")) {
        rewards.push([t.sh_layer, `a short ${rep(or(oSub, "layer"))} over loose shorts`, "PS1_shorts_layer"]);
      }
    }
    rewards = rewards.filter((x) => x[0] > 0);
    if (rewards.length > 0) {
      let best = rewards[0]!;
      for (const x of rewards) if (x[0] > best[0]) best = x; // Python max(): the first of the largest
      p.add(pyMin(best[0], t.sh_cap), best[1], best[2]);
    }
    return p;
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
      if (truthy(t.sh_prop)) return shortsProportions(o); // v14
      p.na = "shorts (no shorts-length reading yet)";
      return p;
    }
    const leg = legOf(B, o); // v12: a fitted "straight" leg is judged slim
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
    const pb = bandFault(o); // v6: PB1, the council's bands (null in v1-v5)
    if (pb !== null) {
      p.add(-pb[0], pb[1], "PB1_roomier_than_look");
      faults += pb[0];
    }
    // v8: PN1 a narrow leg (0 in v1-v7). Not a suit's trousers; loungewear has its own ladder; under a tailored
    // jacket a slim trouser is the norm.
    const bSub = nv(B.subcategory);
    if (truthy(t.pn_narrow) && NARROW.has(leg) && !LOUNGE_BOTTOMS.has(bSub) && bSub !== "suit_trousers" && !oTailored) {
      const what = rep(or(bSub, "pants"));
      const ripped = bSub === "jeans" && truthy(B.distressed_by_design);
      const pts = t.pn_narrow + (leg === "skinny" ? t.pn_skinny : 0.0) + (ripped ? t.pn_rip : 0.0);
      const subj = `the ${leg === "skinny" ? "skinny" : "slim"}${ripped ? " ripped" : ""} ${what}`;
      if (truthy(t.pn_slim_soft) && leg !== "skinny") p.add(-pts, `${subj} would balance better with a straight leg`, "PN1_narrow_leg"); // v10
      else p.add(-pts, `${subj} read dated; a straight leg balances the outfit`, "PN1_narrow_leg");
      faults += pts;
    }
    // v11: skinny joggers or sweatpants out of the gym and home (0 in v1-v10), on top of the loungewear holds
    if (truthy(t.pn_lounge_skinny) && leg === "skinny" && LOUNGE_BOTTOMS.has(bSub) && !LOUNGE_OK.has(o.occasion)) {
      p.add(-t.pn_lounge_skinny, `the skinny ${rep(bSub)} read dated; a relaxed leg balances the outfit`, "PN1_narrow_leg");
      faults += t.pn_lounge_skinny;
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
    let pf4 = false;
    if (T !== null && O === null && LONG_SHIRTS.has(nv(T.subcategory)) && tuckedNone(T) && leg === "wide"
        && vol3(T) <= D.tips.longShirtMaxVolume) {
      p.tip("an untucked shirt over wide legs can hang long; a front tuck gives it shape", "PF4_long_shirt_wide_leg", D.tips.longShirtWideLeg);
      pf4 = true;
    }
    // v6: PB2, the leg side of the bands that stop at relaxed (wide vs relaxed isn't steady: a tip)
    if (truthy(t.pb) && !pf4 && leg === "wide" && O === null && T !== null && !lounge && !H.legExcused(B, T, [])
        && !o.det.some((s) => PB_WIDE_OK.has(s))) {
      p.tip("wide trousers under a regular untucked top can swamp it; a tuck or a shorter top balances them", "PB2_wide_leg_band", -t.pb);
    }

    // rewards: a deliberate shape, blocked by any fault of 1+, a pooling hem or loungewear
    const blocked = faults >= D.blockAt || (B.hem === "pooling" && !(truthy(t.ff7_loose) && LOOSE.has(leg))) || lounge;
    const full = FULL_LEG.has(leg);
    const rewards: [number, string, string][] = [];
    // v14 (#336): a button-up worn open over a tee and tucked in sets the waist like a tucked top (the founder's pair)
    const tuckedLayer = truthy(t.pr1_tucked_layer) && O !== null && o.outers.length === 1
      && TUCKABLE_LAYERS.has(nv(O.subcategory)) && O.tucked === "full";
    const T1 = tuckedLayer ? O : T, O1 = tuckedLayer ? null : O;
    if (!blocked && full && T1 !== null) {
      const tuck = T1.tucked === "full";
      const short = SHORT_TOP_LENGTHS.has(nv(T1.length));
      const ribbedOk = !RIBBED.has(nv(T1.subcategory)) || vol3(T1) >= BOXY || (truthy(t.pr1_ribbed_loose) && LOOSE.has(leg));
      if (O1 === null && earns(T1) && (tuck || (short && ribbedOk))) {
        let pts = tuck || !o.mirror ? t.pr1 : t.pr1_mirror_short;
        if (t.pr1_loose !== null && t.pr1_loose !== undefined) { // v8: the leg sets the size, not the mirror
          pts = LOOSE.has(leg) ? t.pr1_loose : tuck || !o.mirror ? t.pr1_straight! : pyMin(t.pr1_straight!, t.pr1_mirror_short);
        }
        rewards.push([pts, "a tucked or short top over a full leg gives it a waist", "PR1_waist_break"]);
      } else if (O1 === null && earns(T1) && T1.tucked === "half" && !RIBBED.has(nv(T1.subcategory))) {
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
    // v4 (off in v1-v3): the workwear and outdoor shapes (PR5, PR6). Their layers are never PR2's short layers, so
    // one layer earns one shape credit. trail_shoe and track_jacket aren't values of the live v3 reading yet.
    if (!blocked && full && O !== null && !tuckedLayer && earns(O) && !truthy(sl.peek) && S !== null && earns(S)) {
      if (truthy(t.pr5) && PR5_LAYERS.has(oSub) && PR5_BOTTOMS.has(nv(B.subcategory)) && PR5_SHOES.has(sSub) && o.det.includes("workwear")) {
        rewards.push([t.pr5, `a ${rep(oSub)} over a sturdy leg, finished by boots: the workwear shape`, "PR5_workwear_shape"]);
      } else if (truthy(t.pr6) && PR6_LAYERS.has(oSub) && PR6_SHOES.has(sSub) && o.det.includes("outdoor")) {
        rewards.push([t.pr6, `a ${rep(oSub)} over a full leg, finished by trail shoes: the outdoor shape`, "PR6_outdoor_shape"]);
      }
    }
    if (!blocked && full && O !== null && SHORT_LAYERS_ALL.has(oSub) && earns(O) && !truthy(sl.peek)) {
      rewards.push([t.pr2, `a short ${rep(oSub)} over full legs: a clean, strong shape`, "PR2_short_layer"]);
    }
    // v15 (PRO-17, #385): a hoodie or sweatshirt layered over a tee, a ribbed-band layer like the track jacket
    if (truthy(t.hl) && !blocked && full && O !== null && o.outers.length === 1 && HL_LAYERS.has(oSub) && earns(O)
        && !truthy(sl.peek) && O.length !== "below_crotch" && o.tops.length > 0
        && o.tops.every((g) => HL_TOPS.has(nv(g.subcategory))) && !SLIDES.has(sSub)) {
      rewards.push([t.hl, `the ${rep(oSub)} layered over the ${rep(T!.subcategory)} gives it a clean shape`, "PR2h_hoodie_layer"]);
    }
    // v8: PR2b, a layer read ending at the belt over a loose leg (91% the same on 2 runs); one layer, one shape credit
    if (truthy(t.pr2b) && !blocked && LOOSE.has(leg) && O !== null && !tuckedLayer && !oTailored && !SHORT_LAYERS_ALL.has(oSub)
        && SHORT_TOP_LENGTHS.has(nv(O.length)) && earns(O) && !truthy(sl.peek)
        && !rewards.some((x) => x[2] === "PR5_workwear_shape" || x[2] === "PR6_outdoor_shape" || x[2] === "PR2h_hoodie_layer")) {
      rewards.push([t.pr2b, `a short ${rep(or(oSub, "layer"))} over a loose leg: a clean, strong shape`, "PR2b_short_layer_read"]);
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
    // v14 (LNG-9): a matched sweatsuit in a relaxed shape, finished by a clean sneaker (nothing on Proportions off)
    if (truthy(t.sweatsuit_shape) && SWEAT_BOTTOMS.has(nv(B.subcategory)) && sweatsuit(o) && !p.reasons.some((r) => r.points < 0)) {
      const top = [...o.tops, ...o.outers].find((g) => SWEAT_TOPS.has(nv(g.subcategory)))!;
      const good = !NARROW.has(nv(B.leg_shape)) && vol3(B) >= 3 && vol3(top) >= 3 && (vol3(top) >= BOXY || LOOSE.has(nv(B.leg_shape)));
      if (good && S !== null && SPORT_SNEAKERS.has(nv(S.subcategory)) && earns(S) && earns(top)) {
        p.add(t.sweatsuit_shape, "a matched set in a relaxed shape, finished by clean sneakers", "PR7_sweatsuit_shape");
      }
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
        else if (v >= BOXY && truthy(t.ff5_roomy)) out.push([SEV.minor, `the roomy ${rep(sub)}'s sleeves run past the wrists`, "FF5_roomy_sleeves"]); // v8: the cut
        else if (v >= BOXY) out.push([SEV.clear, `the ${rep(sub)} looks a size big: roomy, sleeves over the hands`, "FF5_too_big"]);
        else out.push([SEV.moderate, `the ${rep(sub)}'s sleeves run past the wrists`, "FF1_sleeves_long"]);
      }
      if (g.strain === "clear") out.push([SEV.clear, `the ${rep(sub)} pulls`, "FF6_strain"]);
    } else if (cat === "bottom") {
      const leg = legOf(g, o);
      const dragsOnSlides = LOOSE_DENIM.has(sub) && LOOSE.has(leg) && o.shoes !== null && SLIDES.has(nv(o.shoes.subcategory));
      if (g.hem === "pooling" && !dragsOnSlides) { // loose jeans on slides: Shoes owns that hem
        let sev = PRESSED.has(sub) ? SEV.clear : LOUNGE_BOTTOMS.has(sub) ? SEV.minor : SEV.moderate;
        if (truthy(t.ff7_loose) && LOOSE.has(leg)) sev = LOOSE_DENIM.has(sub) ? 0.0 : SEV.minor; // v8 (#221): a stack on a loose leg
        if (truthy(sev)) out.push([sev, `the ${rep(sub)} pile up on the shoes`, "FF7_pooling"]);
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
      if (g.category === "bottom" && g.hem === "full_break" && NARROW.has(legOf(g, o)) && g.certainty === "clear") {
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
    // v9: two denim pieces in the same light or mid wash (0 in v1-v8)
    const denims = main.filter((g) => H.isDenim(g));
    if (truthy(t.dd_same) && denims.some((g) => (g.color_family === "denim_light" || g.color_family === "denim_mid")
        && denims.filter((x) => nv(x.color_family) === nv(g.color_family)).length >= 2)) {
      p.add(-t.dd_same, "double denim in the same wash blurs together; make the washes clearly different", "CC5_same_wash_denim");
    }
    if (truthy(t.cl1)) { // v8: CL1 a loud print on a top or layer (0 in v1-v7)
      // v9: a loud-native look's own piece (not bright) isn't "loud"
      const co = truthy(t.cl1_own) ? H.outfit(o.main) : null;
      const own = (g: Garment): boolean => co !== null && !isBright(g) && o.det.some((st) => LOUD_NATIVE.has(st) && H.role(st, g, co)[0] >= 1);
      const loud = main.find((g) => (g.category === "top" || g.category === "outerwear") && (
        (g.pattern === "graphic" && ((isBright(g) && (!truthy(t.cl1_scale) || loudPrint(g))) || (g.logo === "large" && LOUD_LOGO_TOPS.has(nv(g.subcategory)))))
        || (LOUD_PATTERNS.has(nv(g.pattern)) && g.pattern_scale === "large")) && !own(g));
      if (loud !== undefined) {
        const what = rep(or(loud.subcategory, "piece"));
        const kind = loud.pattern === "graphic" ? "print" : replaceAll(rep(or(loud.pattern, "pattern")), "checks plaid", "check");
        p.add(-t.cl1, `the big, loud ${kind} on the ${what} takes over the outfit`, "CL1_loud_print");
      }
    }
    if (truthy(t.ll1)) { // v12 COL-12: light on light (0 in v1-v11)
      const up = o.outers.length > 0 ? o.outers[0]! : o.top;
      const Bc = o.bottom;
      if (up !== null && Bc !== null && LIGHT_NEUTRALS.has(nv(up.color_family)) && LIGHT_NEUTRALS.has(nv(Bc.color_family))
          && Bc.subcategory !== "suit_trousers" // a suit is one colour by design
          && !(up.color_family === "white" && Bc.color_family === "khaki_beige") // crisp white over khaki is contrast
          && !main.some((g) => LL_DARK.has(nv(g.color_family)))) {
        p.add(-t.ll1, "light on light washes out; a darker pant would anchor it", "CL2_light_on_light");
      }
    }
    const fault = p.reasons.length > 0;
    if (families.size === 1) p.tip("all one color: a lighter or darker piece would add depth", "CP3_tonal_flat");
    if (denims.length >= 2 && !truthy(t.dd_same)) p.tip("double denim: make the washes clearly different", "CC5_denim_near_match", C.tips.doubleDenim);
    if (fault) return p;

    // positives (only when no fault)
    const nonNeutral = colored.filter((g) => !NEUTRALS.has(g.color_family));
    const pos: [number, string, string][] = [];
    if (bright.length === 1 && nonNeutral.length === 1 && earns(bright[0]!) && truthy(t.cp1)) {
      const g = bright[0]!;
      pos.push([t.cp1, `the ${rep(or(g.color_family, "colour"))} ${rep(or(g.subcategory, "piece"))} is the one standout`, "CP1_standout_color"]);
      o.credited.add(g);
    } else if (truthy(t.cp1_dark) && bright.length === 1 && nonNeutral.length === 1 && earns(bright[0]!) && !loudPrint(bright[0]!)
        && main.some((x) => x !== bright[0] && DARK_NEUTRALS.has(x.color_family))) {
      const g = bright[0]!; // v10 COL-11: one accent toned down by the dark pieces around it
      pos.push([t.cp1_dark, `the ${rep(or(g.color_family, "colour"))} ${rep(or(g.subcategory, "piece"))} is the one accent, toned down by the dark pieces around it`, "CP1_toned_down"]);
      o.credited.add(g);
    } else if (bright.length === 0 && nonNeutral.length === 1 && earns(nonNeutral[0]!)) {
      const g = nonNeutral[0]!;
      pos.push([t.cp2, `the ${rep(or(g.color_family, "colour"))} ${rep(or(g.subcategory, "piece"))} is a quiet accent`, "CP2_quiet_accent"]);
    }
    const S = o.shoes;
    const upper = main.filter((g) => g.category === "top" || g.category === "outerwear");
    if (S !== null && !NO_TIE_IN.has(fam(S)) && !isBright(S) && upper.some((g) => fam(g) === fam(S))) {
      pos.push([t.cp5, `the shoes pick up the ${rep(fam(S))} up top`, "CP5_tie_in"]);
    }
    // v15 (COL-13, #385): the one outer layer picks up the bottoms' color family, with a top of another family between them
    const L = o.outers.length === 1 ? o.outers[0]! : null;
    if (truthy(t.cp8) && L !== null && B !== null && !NO_TIE_IN.has(fam(L)) && fam(L) === fam(B) && !isBright(L) && !isBright(B)
        && !LOUNGE_BOTTOMS.has(nv(B.subcategory)) && !TAILORED.has(nv(L.subcategory)) && earns(L) && earns(B)
        && o.tops.length > 0 && o.tops.every((g) => fam(g) !== fam(L))) {
      pos.push([t.cp8, `the ${rep(or(L.subcategory, "layer"))} picks up the ${rep(fam(L))} of the ${rep(or(B.subcategory, "pants"))}`, "CP8_layer_tie_in"]);
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
    const leg = B ? legOf(B, o) : null; // v12: a fitted "straight" leg is judged slim
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
      p.score = tailored ? SH.runners.tailored : t.sk2_runner !== null && t.sk2_runner !== undefined ? t.sk2_runner : SH.runners.points;
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
      let tooDressy = ramp(-gap, SH.tooDressy.from, SH.tooDressy.to);
      if (truthy(t.sd3_off) && !athleticBottom) tooDressy = 0.0; // v8: loafers or derbies with jeans and a tee
      p.add(-SH.tooDressy.points * tooDressy, "the shoes are much dressier than the clothes", "SD3_too_dressy");
      up = 1.0 - tooDressy;
      // matches the clothes' dressiness (a real shoe; with sweats only a sneaker matches)
      let real = ramp(fs, SH.matches.realFrom, SH.matches.realTo);
      if (athleticBottom && !SNEAKERS.has(sub)) real = 0.0;
      if (truthy(t.sd1_any_sneaker) && (SPORT_SNEAKERS.has(sub) || BOOTS.has(sub))) real = 1.0; // v14: the window decides
      // v14: a shoe too heavy for the leg (SW1 below) doesn't suit the outfit: no match and no "look's own shoe"
      const heavy = truthy(t.sw1_blocks_credit) && NARROW.has(leg) && (BULKY.has(sub) || RUNNER.has(sub));
      if (heavy) real = 0.0;
      p.add(SH.matches.points * up * real * matchWindow(gap), "the shoes match how dressed-up the clothes are", "SD1_matches");
      // chosen for this look: an anchor or home shoe of a style the clothes read as WITHOUT the shoe
      const c = H.outfit(o.main);
      const role = maxOf(o.detNoShoe.length > 0 ? o.detNoShoe.map((st) => H.role(st, S, c)[0]) : [0]);
      const subs = new Set<unknown>(o.main.map((g) => nv(g.subcategory)));
      const suit = subs.has("suit_jacket") && subs.has("suit_trousers");
      if (heavy) {
        // no "look's own shoe" either
      } else if (truthy(role) && earns(S)) {
        const d0 = o.detNoShoe[0]!;
        p.add(SH.chosen * up, o.detNoShoe.length === 1 ? `a ${STYLE_NAMES[d0]} shoe for a ${STYLE_NAMES[d0]} outfit` : "the shoes belong to the look", "SC_chosen_for_look");
      } else if (truthy(t.sc_pair) && earns(S) && o.det.some((st) => H.role(st, S, c)[0] >= 2
          && o.main.some((g) => g.category !== "footwear" && H.role(st, g, c)[0] >= 2))) {
        // v4 what-if (off): the look's anchor shoe with the look's anchor piece on the body (detected with the shoe)
        p.add(SH.chosen * up, "the shoes belong to the look", "SC_chosen_for_look");
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
    if (leg === "wide" && DAINTY_SHOES.has(sub) && !truthy(t.sw3_off)) {
      p.tip("check the shoe isn't swallowed by the wide legs (a slim shoe can look dainty)", "SW3_dainty_wide", SH.tips.daintyWide);
    }
    return p;
  }

  /** v5's SX1: a top (not under a dressy layer) that breaks the quiet look the rest of the outfit reads as.
   *  [points, line, tip]; points 0 when it doesn't fire; tip is the one-dressy-piece minimal case's line. */
  function styleClash(o: PartsOutfit): [number, string | null, string | null] {
    if (!truthy(t.sx)) return [0.0, null, null];
    let c: ReturnType<typeof H.outfit> | null = null;
    let tip: string | null = null;
    for (const T of o.tops) {
      const sub = nv(T.subcategory), vol = vol3(T);
      if (!(SX_STREET_TOPS.has(sub) || vol >= BOXY)) continue;
      const others = o.main.filter((g) => g !== T);
      const dressy = others.filter((g) => SX_DRESSY.has(nv(g.subcategory)));
      const rest = rubric.detectStyles(others, []).detected;
      const quiet = rest.filter((s) => SX_QUIET.has(s));
      if (quiet.length === 0) continue;
      if (o.outers.length > 0) {
        const co = H.outfit(others);
        if (o.outers.some((L) => quiet.some((s) => H.role(s, L, co)[0] >= 1))) continue; // a dressy layer bridges the two looks
      }
      // every quiet look vetoes the graphic tee; a roomy top breaks a look the whole outfit no longer reads as, or
      // whose volume band it's above
      if (!SX_STREET_TOPS.has(sub) && quiet.some((s) => o.det.includes(s) && vol <= SX_QUIET.get(s)!)) continue;
      if (c === null) c = H.outfit(o.main);
      const cc = c;
      if (o.det.some((st) => H.role(st, T, cc)[0] >= 1)) continue; // the top is the look's own piece
      const what = sub === "graphic_tee" ? "graphic tee" : `oversized ${rep(or(sub, "top"))}`;
      if (dressy.length >= t.sx_min_dressy) return [t.sx, `the ${what} and the dressier pieces with it come from different looks`, null];
      if (tip === null && quiet.includes("minimalist") && SX_STREET_TOPS.has(sub)) {
        tip = `the ${what} pulls against the quiet, minimal pieces with it; a plain tee keeps the look`;
      }
    }
    return [0.0, null, tip];
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
    const h2Label = truthy(t.h2_pick_free) ? o.labelNoPick : label; // v4: picks never move a number
    const subs = new Set<unknown>(o.main.map((g) => nv(g.subcategory)));
    const suit = subs.has("suit_jacket") && subs.has("suit_trousers");
    const [sx, sxLine, sxTip] = o.sx; // v5 (0 in v1-v4); computed once in scoreParts
    if ((det.length > 0 || suit) && !truthy(sx)) p.add(t.h1, label ? `reads as ${STYLE_NAMES[label]}` : "a matching suit", "H1_reads_as_style");
    // H2: the label style has an anchor (role 2) in all three slots and nothing against it; or a suit over a top
    if (truthy(sx)) {
      // v5: a piece from another look: no "reads as"
    } else if (h2Label && o.slots.size === 3) {
      // v6 (h2_any): judged on every style the outfit reads as, so the name a prep marker picks can't take the credit
      // away (KD-5); the line names the pick-free label
      const c = H.outfit(o.main);
      const cands = [h2Label, ...(truthy(t.h2_any) ? det.filter((s) => s !== h2Label) : [])];
      for (const st of cands) {
        const best = new Map<string, number>();
        let against = 0;
        for (const g of o.main) {
          const [pos, neg] = H.role(st, g, c);
          const s = SLOT[g.category as string]!;
          best.set(s, pyMax(best.get(s) ?? 0, pos));
          against += neg;
        }
        if (["upper", "bottom", "shoes"].every((s) => (best.get(s) ?? 0) >= 2) && against === 0) {
          p.add(t.h2, `clearly ${STYLE_NAMES[h2Label]} top to toe`, "H2_clear_top_to_toe");
          break;
        }
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
    let nonshoe = o.main.filter((g) => g.category !== "footwear" && !(g.category === "bottom" && LOUNGE_BOTTOMS.has(g.subcategory)));
    if (truthy(t.h3_base_covered) && (o.outers.length > 0 || o.tops.some((g) => COVER_TOPS.has(g.subcategory)))) {
      // v11: a tank or tee under another top layer is judged by the layer over it (0 in v1-v10)
      nonshoe = nonshoe.filter((g) => !(g.category === "top" && BASE_TOPS.has(g.subcategory)));
    }
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
    if (truthy(sx) && sx >= h3) p.add(-sx, sxLine!, "SX1_another_look"); // v5: the larger of SX1 and H3, never both
    else if (truthy(h3)) p.add(-h3, h3Line, "H3_another_world");
    if (sxTip !== null) p.tip(sxTip, "SX1_tip", -t.sx);
    // v9: GT1 an oversized graphic tee under a tailored jacket (0 in v1-v8; a fitted one stays free)
    if (truthy(t.gt1) && o.outers.some((x) => TAILORED.has(x.subcategory)) && o.tops.some((g) => g.subcategory === "graphic_tee" && vol3(g) >= BOXY)) {
      p.add(-t.gt1, "an oversized graphic tee fights the tailored jacket; a fitted plain tee works under it", "GT1_graphic_under_tailoring");
    }
    // v8: TK1 a tank top as the only top, out of the house (under a collared shirt it's refiled a vest)
    if (truthy(t.tk1) && o.outers.length === 0 && o.tops.length === 1 && o.tops[0]!.subcategory === "tank_top" && !LOUNGE_OK.has(o.occasion)) {
      p.add(-t.tk1, "a tank top on its own reads gym or undershirt", "TK1_tank_alone");
    }
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
        p.add(t.h4, `the ${rep(or(g.pattern, "patterned"))} ${rep(or(g.subcategory, "piece"))} is the one standout`, "H4_standout_piece");
      }
    }
    if (truthy(t.tracksuit)) { // v14 (VSP-9): a matched tracksuit
      const J = o.outers.filter((g) => g.subcategory === "track_jacket");
      const Bt = o.bottom;
      if (J.length > 0 && Bt !== null && Bt.subcategory === "track_pants" && fam(J[0]!) === fam(Bt)) {
        p.add(t.tracksuit, "a matched tracksuit, worn as one set", "H7_tracksuit");
      }
    }
    return p;
  }

  // ---------------------------------------------------------------- CONDITION (after the average)
  /** CON-1's wrinkle charge for one piece; v12 (wr_look, CON-6): by garment and look; v13: a knit top on a clean
   *  look (minimal, smart casual, classic prep) costs wr_knit_clean (parts_proto._wrinkle_cost). */
  function wrinkleCost(g: Garment, o: PartsOutfit, occasion: string): number {
    const CD = data.condition;
    const sub = nv(g.subcategory);
    const base = LINEN_LIKELY.has(sub) ? CD.wrinkledLinen : CD.wrinkled;
    if (!truthy(t.wr_look)) return base;
    const loud = o.det.some((st) => LOUD_NATIVE.has(st));
    if (WR_KNITS.has(sub)) {
      if (WR_TEES.has(sub) && o.outers.some((x) => TAILORED.has(nv(x.subcategory)))) return t.wr_knit_tailored;
      if (!loud && o.det.some((st) => WR_CLEAN.has(st))) return t.wr_knit_clean; // v13
      return 0.0;
    }
    if (WR_DRESSY_OCC.has(occasion)) return base;
    if (WR_CASUAL.has(sub)) return loud ? 0.0 : pyMin(base, t.wr_half);
    if (sub === "oxford_shirt" && o.bottom !== null && o.bottom.subcategory === "jeans" && (occasion === "everyday" || occasion === "class")) {
      return t.wr_half;
    }
    return base;
  }

  function condition(o: PartsOutfit, scene: Scene, occasion: string, tipsIn: readonly PartTip[]): PartsCondition {
    const CD = data.condition;
    let tips: readonly PartTip[] = tipsIn;
    if (truthy(t.wr_look)) { // v12 CON-6: a waived wrinkle shows no tip either
      const drop = new Set<string>(), keep = new Set<string>();
      for (const g of o.main) {
        if (g.category !== "footwear" && g["condition_raw"] === "wrinkled") {
          const line = `the ${rep(or(g.subcategory, "piece"))} might be wrinkled; not counted, it isn't clear enough in the photo`;
          (wrinkleCost(g, o, occasion) ? keep : drop).add(line);
        }
      }
      tips = tips.filter((x) => !(x.check === "C_unsure_wrinkled" && drop.has(x.line) && !keep.has(x.line)));
    }
    if (scene.lighting === "dim") return { deduction: 0.0, faults: [], display: "couldn't check in this light", part: null, tips: [] };
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
        const w = wrinkleCost(g, o, occasion); // v12 CON-6: by garment and look
        if (truthy(w)) {
          care += w;
          faults.push(`the ${name} looks wrinkled`);
        }
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
    return { deduction: pyRound(ded, 3), faults, display: faults.length === 0 ? "clean" : faults.join("; "), part, tips: [...tips] };
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
    // v6: Event's softer band replaces the rubric's (occ_target)
    const target = has(t.occ_target, occasion) && truthy(t.occ_target[occasion]) ? t.occ_target[occasion]!
      : OCCASION_TARGET.has(occasion) ? OCCASION_TARGET.get(occasion)! : OC.default;
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
        let dressed = o.outers.some((x) => DRESSED_OUTER.has(x.subcategory)) || o.tops.some((x) => DRESSED_TOPS.has(x.subcategory));
        if (truthy(t.sweatsuit_sign) && sweatsuit(o)) dressed = true; // v14 (LNG-9): a matched set is chosen on purpose
        let lookSign = false;
        if (truthy(t.look_sign) && !dressed && o.det.length > 0 && ATHLETIC_AS_CASUAL.has(occasion)) {
          dressed = true; // v14 (LNG-2): reading as a look is the sign
          lookSign = true;
        }
        // shoes out of the photo count as a real shoe: what isn't in the photo never costs points
        const realShoe = S === null || !NOT_REAL_SHOES.has(S.subcategory);
        const kit = B.subcategory === "athletic_shorts" && o.tops.some((x) => x.subcategory === "jersey");
        const signs = kit ? 0 : (dressed ? 1 : 0) + (realShoe ? 1 : 0);
        const hero = signs === 2 && H.outfit(o.main).hero.length > 0;
        let gymShortsOk = B.subcategory === "athletic_shorts" && !kit && realShoe;
        if (truthy(t.gym_runner_unheld) && B.subcategory === "athletic_shorts" && !kit && S !== null && RUNNER.has(nv(S.subcategory))
            && ATHLETIC_AS_CASUAL.has(occasion)) gymShortsOk = true; // v14 (LNG-8): the parts decide
        if (kit && t.kit_cap !== null && t.kit_cap !== undefined) { // v14 (LNG-4): the kit's hold follows its fit
          ceilings.push([t.kit_cap, "a full kit out of the game"]);
          o.kitHold = true;
        } else if (!hero && !gymShortsOk) {
          const lift = o.det.length > 0 && !lookSign ? t.lounge_style : 0.0; // v8: a clear style around the sweats
          ceilings.push([CE.loungeLadder[signs]! + lift, "loungewear out of the house"]);
        }
      }
    }
    if (dressyRoom && S !== null && SLIDES.has(nv(S.subcategory))) ceilings.push([CE.slidesDressy, "slides at a dressy occasion"]);
    if (INTERVIEWISH.has(occasion) && S !== null && SNEAKERS.has(S.subcategory) && o.outers.some((x) => TAILORED.has(x.subcategory))) {
      ceilings.push([CE.sneakersBlazer, "sneakers under a blazer at an interview"]);
    }
    if (t.int_top !== null && t.int_top !== undefined && INTERVIEWISH.has(occasion)) { // v9: a collar, a knit or a jacket
      const jacket = o.outers.some((x) => INT_OUTERS.has(x.subcategory));
      const dressedTop = o.tops.some((x) => INT_TOPS.has(x.subcategory));
      if (!jacket && !dressedTop) {
        if ([...o.tops, ...o.outers].some((x) => HOODIES.has(x.subcategory))) ceilings.push([t.int_hoodie!, "a hoodie at an interview"]);
        else ceilings.push([t.int_top, "an interview wants a collared shirt, a knit or a jacket"]);
      }
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

  /** v8: the mirror of the earned bonus. Separate problems in different parts add up instead of averaging away. */
  function piledPenalty(ps: Map<PartName, number>): number {
    const e = t.penalty;
    if (!e || ps.size === 0) return 0.0;
    const sh = Array.from(ps.values()).map((v) => pyMax(0.0, e.under - v)).sort((a, b) => b - a);
    return pyRound(pyMin(e.cap, e.rate * sum(sh.slice(1))), 4);
  }

  function combine(ps: Map<PartName, number>, cond: PartsCondition, occ: PartsOccasion, occasion: string, careOrStrain: boolean) {
    let wsum = 0;
    for (const k of ps.keys()) wsum += WT[k];
    let num = 0;
    for (const [k, v] of ps) num += WT[k] * v;
    const avg = num / wsum;
    let x = avg + earnedBonus(ps) - piledPenalty(ps) - cond.deduction - occ.deduction;
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
    const careTips = unsureCare(garments); // v7: condition reads count only when "clear"
    const o = outfit(garments, picks);
    o.mirror = truthy(scene.mirror_selfie);
    o.sx = styleClash(o); // v5's SX1, read by Style and (v6) Proportions
    o.occasion = occasion;

    const col = color(o, boldness);
    o.colorFault = col.reasons.length > 0 && col.reasons.some((r) => r.points < 0);
    const parts: Record<PartName, Part> = {
      proportions: proportions(o, sl), fit: fit(o), color: col, shoes: shoes(o, occasion, sl), cohesion: cohesion(o, boldness),
    };
    // v8: slides under an otherwise clean outfit (no other part has a fault of 1 or more) cost less
    if (truthy(t.sk1_soft) && parts.shoes.reasons.some((r) => r.check === "SK1_slides_out")
        && !ORDER.some((k) => k !== "shoes" && parts[k].reasons.some((r) => r.points <= -1.0))) {
      parts.shoes.add(t.sk1_soft, "the rest of the outfit is clean, so the slides cost less", "SK1s_slides_soft");
    }
    const res = {} as Record<PartName, PartResult>;
    for (const k of ORDER) {
      const r = k === "cohesion" ? data.partRange.cohesion : data.partRange.default;
      res[k] = parts[k].result(r[0], r[1]);
    }
    const live = new Map<PartName, PartResult>();
    for (const k of ORDER) if (res[k].score !== null) live.set(k, res[k]);
    if (live.size === 0) return { overall: null, reason: "no_part_readable", parts: res, naParts: [...ORDER] };
    const cond = condition(o, scene, occasion, careTips);
    if (truthy(t.goes_together) && live.has("cohesion")) { // v14 (STY-12): the pieces go together
      const subs = new Set<unknown>(o.main.map((g) => nv(g.subcategory)));
      const suit = subs.has("suit_jacket") && subs.has("suit_trousers");
      const shoesScore = live.get("shoes")?.score ?? 0;
      if (o.det.length === 0 && !suit && o.slots.size === 3 && shoesScore > BASE
          && Array.from(live.values()).every((r) => r.score! >= BASE) && cond.faults.length === 0) {
        parts.cohesion.add(t.goes_together, "the pieces go together: nothing off, and the shoes suit the clothes", "H6_goes_together");
        res.cohesion = parts.cohesion.result(data.partRange.cohesion[0], data.partRange.cohesion[1]);
        live.set("cohesion", res.cohesion);
      }
    }
    const occ = occasionPart(o, occasion);
    const careOrStrain = o.main.some((g) => careFault(g) !== null) || o.main.some((g) => g.strain === "clear");
    const ps = new Map<PartName, number>();
    for (const [k, r] of live) ps.set(k, r.score!);
    if (o.kitHold && occ.ceiling !== null && truthy(t.kit_fit_rate)) { // v14 (LNG-4): fit moves the kit's hold
      const worst = pyMin(ps.get("proportions") ?? BASE, ps.get("fit") ?? BASE);
      const cut = t.kit_fit_rate * pyMax(0.0, BASE - worst);
      if (cut > 0 && t.kit_cap! - cut < occ.ceiling) {
        occ.ceiling = pyRound(t.kit_cap! - cut, 3);
        occ.lines[occ.lines.length - 1] = `a full kit out of the game, and it doesn't fit cleanly: held to ${pyFloat(roundHalf(occ.ceiling))}`;
        occ.status = occ.lines[occ.lines.length - 1]!;
      }
    }
    const { avg, x, floored, wsum } = combine(ps, cond, occ, occasion, careOrStrain);
    const bonus = earnedBonus(ps);
    const penalty = piledPenalty(ps);

    // the lowest part leads the card, with its one-line reason (ties: the heavier part)
    let lowK: PartName | null = null;
    for (const k of live.keys()) {
      if (lowK === null) {
        lowK = k;
        continue;
      }
      const a = live.get(k)!.score!, b = live.get(lowK)!.score!;
      if (a < b || (a === b && -WT[k] < -WT[lowK])) lowK = k;
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
    for (const k of live.keys()) weightsUsed[k] = pyRound(WT[k] / wsum, 3);
    return {
      overall: roundHalf(x), rawScore: pyRound(x, 3), rawUnrounded: x, average: pyRound(avg, 3), averageUnrounded: avg, earnedBonus: bonus, piledPenalty: penalty,
      version: data.label, engine: data.engine,
      parts: res, naParts: ORDER.filter((k) => res[k].score === null), weightsUsed,
      condition: cond, occasion: occ, floored, careOrStrain, lowest, secondLook: sl,
      detectedStyles: o.det, styleLabel: o.label, notRated: prep.notRated, partial: prep.notRated.length > 0,
    };
  }

  return { data, scoreParts };
}

/** THE SWITCH for the casual-fits update (parts v14, #331-#335; rubric/research/parts/casual-athletic.md). true: new
 *  checks score with v14. false: the whole app (the card, its fixes, the one quick tap, Going for, the chat's outfit
 *  judge) rolls back to v13's numbers. A stored check keeps its score either way until it's changed, as with every
 *  earlier parts update. */
export const CASUAL_FITS_V14 = true;

/** THE SWITCH for the hoodie layer (parts v15, #385; PRO-17 in rubric/v5-styles.md). true: a hoodie or sweatshirt
 *  layered over a tee earns the short jacket's credit on new checks. false: the whole app goes back to v14's numbers.
 *  With CASUAL_FITS_V14 false, v13 wins (it never had the credit). Stored checks keep their scores until changed. */
export const HOODIE_LAYER_V15 = true;

/** The bundled data as the switches want it: v15 as generated, v14's tune (HOODIE_LAYER_V15 off), or v13's (CASUAL_FITS_V14 off). */
export function partsDataFor(v14: boolean, v15: boolean = HOODIE_LAYER_V15, _v16?: boolean): PartsData {
  const rb = !v14 ? PARTS_DATA.rollback : !v15 ? PARTS_DATA.rollback14 : undefined;
  if (!rb) return PARTS_DATA;
  return { ...PARTS_DATA, engine: rb.engine, label: rb.label, version: rb.version, tune: rb.tune };
}

let currentParts: PartsEngine = createParts(partsDataFor(CASUAL_FITS_V14, HOODIE_LAYER_V15));

/** The parts engine every default path uses (partsData.ts = fixtures/parts.json on the bundled v4.1 rubric), as the
 *  switch picks it. A stable object, so `engines.parts ?? defaultParts` callers follow the switch. */
export const defaultParts: PartsEngine = {
  get data() {
    return currentParts.data;
  },
  scoreParts: (reading: Reading, opts?: PartsOptions) => currentParts.scoreParts(reading, opts),
};

/** Tests only: flip the switches at run time (the app reads CASUAL_FITS_V14 and HOODIE_LAYER_V15). */
export function setCasualFitsV14(on: boolean, v15: boolean = HOODIE_LAYER_V15): void {
  currentParts = createParts(partsDataFor(on, v15));
}
export function setHoodieLayerV15(on: boolean): void {
  currentParts = createParts(partsDataFor(CASUAL_FITS_V14, on));
}

/** T69 (stub): THE SWITCH for the rescoring (parts v16, #484). Not built yet. */
export const RESCORE_V16: boolean = false;
/** T69 (stub): tests only. */
export function setRescoreV16(_on: boolean): void {
  throw new Error("T69: not built");
}
/** T69 (stub): the engine a stored parts check is scored with. */
export function partsEngineFor(_rubricVersion: string): PartsEngine {
  throw new Error("T69: not built");
}

/** parts_proto.score_parts() (engine v11) with the bundled data. Never mutates `reading`. */
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
