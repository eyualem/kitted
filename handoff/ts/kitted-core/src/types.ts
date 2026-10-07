// Types for @kitted/core. Spellings match extraction-test/schema.json and rubric.py exactly.
//
// Readings come from a vision model, so every field is optional and may hold a value outside the enum
// (the parity set has "kimono_wrap", "teal", missing keys and volume: null). `Loose<T>` keeps editor
// autocomplete for the known values while still accepting any string, so nothing is ever dropped.

export type Loose<T extends string> = T | (string & {});

// ---------------------------------------------------------------- schema.json enums
export type Framing = "full_body" | "three_quarter" | "upper_only";
export type Lighting = "good" | "dim" | "harsh";
export type Clothed = "fully" | "partial";

export type Category = "top" | "outerwear" | "bottom" | "footwear" | "accessory" | "traditional";

export type Subcategory =
  | "tee" | "graphic_tee" | "polo" | "knit_polo" | "oxford_shirt" | "dress_shirt" | "flannel_shirt" | "overshirt"
  | "sweater" | "hoodie" | "sweatshirt" | "quarter_zip" | "tank_top" | "jersey" | "blazer" | "suit_jacket"
  | "denim_jacket" | "bomber" | "chore_coat" | "field_jacket" | "puffer" | "overcoat" | "rain_jacket" | "jeans"
  | "chinos" | "trousers" | "drawstring_trousers" | "suit_trousers" | "cargos" | "joggers" | "sweatpants" | "shorts"
  | "athletic_shorts" | "white_leather_sneaker" | "canvas_sneaker" | "retro_runner" | "performance_runner"
  | "chunky_sneaker" | "basketball_sneaker" | "loafer" | "dress_shoe" | "chelsea_boot" | "work_boot"
  | "slides_sandals" | "belt" | "hat" | "bag" | "watch" | "low_profile_sneaker" | "unstructured_blazer"
  | "sport_coat" | "cardigan" | "suede_chukka" | "derby" | "leather_jacket" | "rugby_shirt" | "fleece"
  | "shell_jacket" | "camp_collar_shirt" | "other";

export type ColorFamily =
  | "white" | "off_white_cream" | "light_grey" | "grey" | "charcoal" | "black" | "navy" | "light_blue" | "blue"
  | "denim_light" | "denim_mid" | "denim_dark" | "olive" | "green" | "sage" | "khaki_beige" | "tan_camel" | "brown"
  | "burgundy" | "red" | "orange" | "yellow" | "pink" | "purple" | "multicolor";

export type Pattern = "solid" | "stripes" | "checks_plaid" | "graphic" | "camo" | "floral" | "other";
export type Logo = "none" | "small" | "large";
export type LegShape = "na" | "skinny" | "slim" | "straight" | "relaxed" | "wide" | "flare_bootcut" | "barrel";
export type Hem = "na" | "pooling" | "full_break" | "slight_break" | "no_break" | "cuffed" | "cropped";
export type Tucked = "na" | "none" | "half" | "full";
export type Condition = "clean" | "wrinkled" | "stained" | "pilled_or_worn";
export type Certainty = "clear" | "likely" | "unsure";
export type Length = "na" | "cropped" | "at_belt" | "mid_fly" | "below_crotch";
export type PatternScale = "na" | "small" | "medium" | "large";
export type Saturation = "na" | "muted" | "bright";
export type SleeveEnd = "na" | "above_wrist" | "at_wrist" | "covers_hand";
export type Strain = "none" | "some" | "clear";

/** One garment as the vision model reads it (schema.json v3). Every field optional; unknown keys allowed. */
export interface Garment {
  category?: Loose<Category> | null;
  subcategory?: Loose<Subcategory> | null;
  color_family?: Loose<ColorFamily> | null;
  pattern?: Loose<Pattern> | null;
  logo?: Loose<Logo> | null;
  /** 1 fitted ... 5 very oversized. */
  volume?: number | null;
  leg_shape?: Loose<LegShape> | null;
  /** Set by the rubric on its own copy when an alias (flare_bootcut, barrel) is normalized. */
  leg_shape_raw?: string | null;
  hem?: Loose<Hem> | null;
  tucked?: Loose<Tucked> | null;
  condition?: Loose<Condition> | null;
  certainty?: Loose<Certainty> | null;
  length?: Loose<Length> | null;
  pattern_scale?: Loose<PatternScale> | null;
  saturation?: Loose<Saturation> | null;
  sleeve_end?: Loose<SleeveEnd> | null;
  strain?: Loose<Strain> | null;
  distressed_by_design?: boolean | null;
  shows_below_outer?: boolean | null;
  [extra: string]: unknown;
}

export interface Scene {
  framing?: Loose<Framing> | null;
  /** Missing = true (rubric.py: scene.get("shoes_visible", True)). Present but null = hidden. */
  shoes_visible?: boolean | null;
  people_count?: number | null;
  mirror_selfie?: boolean | null;
  lighting?: Loose<Lighting> | null;
  clothed?: Loose<Clothed> | null;
  [extra: string]: unknown;
}

/** A vision reading. `held_items` is the demo extension (garments in the hand, not worn); the rubric ignores it. */
export interface Reading {
  scene?: Scene | null;
  garments: Garment[];
  held_items?: Garment[];
  [extra: string]: unknown;
}

// ---------------------------------------------------------------- profile inputs
export type StyleName =
  | "smart_casual" | "minimalist" | "old_money" | "workwear" | "vintage_sport" | "streetwear" | "preppy" | "gorpcore";
/** Styles are ORDERED [name, weight] pairs (the order he tapped them). Float sums depend on this order. */
export type StylePair = readonly [Loose<StyleName>, number];
export type Styles = readonly StylePair[];

export type Boldness = "subtle" | "a_little" | "bold";
export type Occasion =
  | "everyday" | "class" | "work_casual" | "work" | "date" | "going_out" | "interview" | "interview_corporate"
  | "interview_tech" | "event" | "wedding_formal" | "wedding_casual" | "gym" | "home";

export interface ScoreOptions {
  occasion?: Loose<Occasion>;
  styles?: Styles | null;
  boldness?: Loose<Boldness>;
}

// ---------------------------------------------------------------- rubric output
export type SubscoreName = "fit" | "color" | "proportion";
export type CreditId = "K1_layered" | "K2_elevated_piece" | "K3_point_of_interest" | "K4_shoes_complement";
export type RuleId =
  | "F4_pooling" | "F4b_full_break_narrow_leg" | "F7_care" | "F6_top_too_long" | "F8_too_big"
  | "F9_sleeves_cover_hands" | "F10_visible_strain" | "T1_dress_shirt_untucked" | "P1_top_volume_vs_style"
  | "P1_leg_vs_style" | "P2_big_top_skinny_leg" | "P3_everything_oversized" | "L1_shirt_hangs_below_blazer"
  | "S1_bulky_shoe_narrow_leg" | "C1a_too_many_accent_colors" | "C1b_too_many_colors" | "C3_bright_clash"
  | "C4a_same_pattern_same_scale" | "C4a_same_pattern_type" | "C4b_three_plus_patterns"
  | "B1_too_many_focal_points" | "C5_near_match_jacket_trousers" | "O1_too_casual" | "O1_too_formal"
  | "O4_loungewear_out" | "S2_shoes_too_casual_for_outfit" | "O3_large_logo";
export type NotRated = "shoes" | "bottom half" | "traditional garment (not rated)";

/** rubric.py's early return: nothing to score. */
export interface UnscoredResult {
  overall: null;
  reason: "not_fully_clothed" | "nothing_readable";
  partial: boolean;
  rulesFired: RuleId[];
}

/** rubric.py's full result. `*Unrounded` are the exact doubles; `rawScore` / `creditPoints` / `mistakePoints`
 *  are Python's round(x, 3 / 2 / 2) and only for display. */
export interface ScoredResult {
  overall: number;
  partial: boolean;
  rulesFired: RuleId[];
  rawScore: number;
  rawUnrounded: number;
  subscores: Record<SubscoreName, number>;
  /** -occasionPenalty. Python emits -0.0 when zero; -0 === 0 in JS. */
  occasionAdj: number;
  credits: CreditId[];
  creditPoints: number;
  creditUnrounded: number;
  mistakePoints: number;
  mistakesUnrounded: number;
  advice: string[];
  notRated: NotRated[];
}

export type RubricResult = UnscoredResult | ScoredResult;

// ---------------------------------------------------------------- closet
export type ClosetSlot = "top" | "bottom" | "shoes" | "outer";
/** The fields the core logic reads. Seed items carry more (colorHex, createdAt, ...); they pass through. */
export interface ClosetItem {
  id: string;
  name: string;
  slot: Loose<ClosetSlot>;
  garment: Garment;
  confirmedFields?: string[];
  createdAt?: string;
  [extra: string]: unknown;
}

// ---------------------------------------------------------------- rubric.json shape
export interface RuleConfig {
  enabled: boolean;
  sub: SubscoreName | "occasion";
  [key: string]: unknown;
}

export interface CreditConfig {
  id: CreditId;
  points: number;
  needs: string[];
}

export type FixTier = "adjust" | "swapFromCloset" | "changeInto" | "tailor" | "buy";

export interface FixMatch {
  volume_max?: number;
  volume_in_band?: boolean;
  leg_in_band?: boolean;
  leg_in?: string[];
  not_subcategory?: string[];
  color_not_in?: string[];
  formality_min?: number;
}

export type FixEdit =
  | { op: "set"; slot: string; fields: Partial<Garment> }
  | { op: "set_where"; where: Partial<Garment>; fields: Partial<Garment> }
  | { op: "alternatives"; slot: string; each: Partial<Garment>[] }
  | { op: "set_band"; slot: string; field: "volume" | "leg_shape" }
  | { op: "swap_closet"; slot: string; match?: FixMatch }
  | { op: "add_closet"; slot: string; match?: FixMatch }
  | { op: "add_held"; category: string }
  | { op: "add"; garment: { category: string; subcategory: string; color_family: string } }
  | { op: "neutralize_culprit" }
  | { op: "upgrade_culprit"; from_closet?: boolean }
  | { op: "remove_most_formal_outer" };

export interface FixOption {
  tier: FixTier;
  copy: string;
  detail?: string;
  edits: FixEdit[];
  closet_requires?: { slot: string; subcategory_in: string[] };
  when?: { leg_too_wide?: boolean };
}

export interface FixCatalog {
  _doc?: string;
  tiers: Record<FixTier, { effort: number; free: boolean; tag: string }>;
  targets: Record<string, FixOption[]>;
  next_level: Record<string, string>;
  tips: Record<string, string>;
}

export interface RubricData {
  version: string;
  engine: number;
  minAppBuild: number;
  source: string;
  rubricSha256: string;
  config: Record<string, unknown>;
  scoring: {
    baseline: number;
    weights: Record<SubscoreName, number>;
    mistakeMultiplier: number;
    occasionMultiplier: number;
    rawMin: number;
    rawMax: number;
    subMin: number;
    subMax: number;
    creditMax: number;
    formalityDefault: number;
    darkUndistressedJeans: number;
    [key: string]: unknown;
  };
  tables: {
    FORMALITY: Record<string, number>;
    TAILORED_OUTER: string[];
    SEPARATE_JACKETS: string[];
    DARK_SUITING: string[];
    OCCASION_TARGET: Record<string, number[]>;
    OCCASION_DEFAULT: number[];
    DRESSY_OCCASIONS: string[];
    LEG_ORDER: string[];
    LEG_ALIAS: Record<string, string>;
    STYLE_BANDS: Record<string, { volume: number[]; leg: string[] }>;
    DEFAULT_BAND: { volume: number[]; leg: string[] };
    NEUTRALS: string[];
    MUTED: string[];
    ALWAYS_BRIGHT: string[];
    HUE_DEPENDS: string[];
    FAMILY: Record<string, string>;
    LOUNGE_BOTTOMS: string[];
    LOUNGE_OK: string[];
    KNIT_TOPS: string[];
    CREDITS: CreditConfig[];
  };
  rules: Record<string, RuleConfig>;
  advice: Record<"ruleOfThirds" | "tonal" | "nearMatch" | "bigLogo" | "belt" | "nextLevel", string>;
  fixes: FixCatalog;
}

/** Blended style band: volume (lo, hi) and leg-index (lo, hi), as rubric.blended_band returns. */
export type Band = readonly [readonly [number, number], readonly [number, number]];
