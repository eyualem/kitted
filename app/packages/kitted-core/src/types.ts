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
  /** T61: a costume or a uniform (the reader's yes/no); missing or false = scored as today. */
  costume_or_uniform?: boolean | null;
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
/** The 8 looks (v4's 7 plus Tailored, T94). Scoring reads only the 7 (`detectStyles`); Tailored is a name
 *  (`detectLooks`). Old onboarding keys still accepted as picks: preppy / old_money -> classic_prep, gorpcore -> outdoor. */
export type DetectedStyle =
  | "vintage_sport" | "outdoor" | "workwear" | "streetwear" | "tailored" | "classic_prep" | "minimalist" | "smart_casual";
export type StyleName = DetectedStyle | "old_money" | "preppy" | "gorpcore";
/** His picks: ORDERED [name, weight] pairs (the order he tapped them). Since rubric v4 they never change a score;
 *  they only choose the card label when two detected styles both fit. */
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
  | "F4_pooling" | "F4_hem_drags_over_slides" | "F4b_full_break_narrow_leg" | "F7_care" | "F6_top_too_long" | "F8_too_big"
  | "F9_sleeves_cover_hands" | "F10_visible_strain" | "T1_dress_shirt_untucked" | "P1_top_volume_vs_style"
  | "P1_leg_vs_style" | "P2_big_top_skinny_leg" | "P3_everything_oversized" | "L1_shirt_hangs_below_blazer"
  | "S1_bulky_shoe_narrow_leg" | "C1a_too_many_accent_colors" | "C1b_too_many_colors" | "C3_bright_clash"
  | "C4a_same_pattern_same_scale" | "C4a_same_pattern_type" | "C4b_three_plus_patterns"
  | "B1_too_many_focal_points" | "C5_near_match_jacket_trousers" | "O1_too_casual" | "O1_too_formal"
  | "O4_loungewear_out" | "S2_shoes_too_casual_for_outfit" | "O3_large_logo";
/** "shoes not rated" (T61, NR2): heels or traditional shoes, dropped like shoes out of the photo; it is not "shoes", so
 *  no shoe snap is offered. The old "traditional garment (not rated)" token is gone: a traditional piece blocks the score. */
export type NotRated = "shoes" | "bottom half" | "shoes not rated";

/** Why a fully clothed reading gets no score (T61, specs/not-rated.md NR1). */
export type BlockReason = "costume_or_uniform" | "traditional" | "womenswear" | "unreadable";
export type UnreadableSlot = "top" | "jacket" | "pants";

/** rubric.py's early return: nothing to score. */
export interface UnscoredResult {
  overall: null;
  reason: "not_fully_clothed" | "nothing_readable" | BlockReason;
  /** Only with reason "unreadable". */
  unreadableSlot?: UnreadableSlot;
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
  /** Styles the outfit reads as (detected from the garments, rubric v4), in the rubric's fixed order. */
  detectedStyles: DetectedStyle[];
  /** The one style the card names ("Reads as streetwear"), or null (the general standard applied). */
  styleLabel: DetectedStyle | null;
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
  /** Only when a top is (isn't) one of top_in (top_not_in), no bottom / shoe is in bottom_not_in / shoe_not_in,
   *  and (not_warm) the day isn't warm (#160). */
  when?: {
    leg_too_wide?: boolean; top_in?: string[]; top_not_in?: string[]; bottom_not_in?: string[]; shoe_not_in?: string[];
    not_warm?: boolean;
  };
  /** Overrides the tier's effort (adding a whole piece = 3, #160). */
  effort?: number;
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
    /** Score points per penalty unit, by sub-score (fit 0.8, color 0.6, proportion 0.6). */
    mult: Record<SubscoreName, number>;
    /** One garment's fit + proportion penalties cost at most this on the score. */
    garmentCap: number;
    /** The floor at FLOOR_OCCASIONS when no care or strain fault fired. */
    floor: number;
    /** Athletic bottoms count as this dressiness in "too casual" at ATHLETIC_AS_CASUAL occasions. */
    loungeAthleticAsCasual: number;
    [key: string]: unknown;
  };
  tables: {
    FORMALITY: Record<string, number>;
    DARK_JEANS: string[];
    TAILORED_OUTER: string[];
    SEPARATE_JACKETS: string[];
    DARK_SUITING: string[];
    OCCASION_TARGET: Record<string, number[]>;
    OCCASION_DEFAULT: number[];
    DRESSY_OCCASIONS: string[];
    OCCASION_FIRST: string[];
    FLOOR_OCCASIONS: string[];
    ATHLETIC_AS_CASUAL: string[];
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
    TECH_LAYERS: string[];
    LAYER_SHIRTS: string[];
    DRESSED_OUTER: string[];
    DRESSED_TOPS: string[];
    NOT_REAL_SHOES: string[];
    CREDITS: CreditConfig[];
  };
  /** Style detection (rubric v4): the fixed label order, card names, old pick keys and every set the detector reads. */
  styles: {
    order: DetectedStyle[];
    /** T94: the 8 looks' fixed order (the name only; `order` stays the 7 scoring looks). */
    lookOrder: DetectedStyle[];
    names: Record<DetectedStyle, string>;
    pickAlias: Record<string, string>;
    sets: Record<string, string[]>;
  };
  /** The one quick tap: the closed list of look-alike pairs per slot ([a, b, question]) and the button labels. */
  tap: {
    pairs: Record<string, [string, string, string][]>;
    labels: Record<string, string>;
    /** Tap v2 (#120): "Boots, sneakers or slides?" when the shoe type was lost. */
    shoes: {
      kinds: Record<ShoeKind, string[]>;
      order: ShoeKind[];
      question: string;
      labels: Record<ShoeKind, string>;
      /** Asked when the best answer would raise the score by this much or more. */
      lostSwing: number;
      /** Never asked at these occasions (gym, home). */
      skipOccasions: string[];
    };
  };
  rules: Record<string, RuleConfig>;
  advice: Record<"ruleOfThirds" | "tonal" | "nearMatch" | "bigLogo" | "belt" | "nextLevel" | "nextLevelMinimal", string>;
  fixes: FixCatalog;
}

/** A style band: volume (lo, hi) and leg-index (lo, hi), as rubric.band_index returns. */
export type Band = readonly [readonly [number, number], readonly [number, number]];

/** ask_question(): the one quick tap before the score (rubric v4, RULEBOOK Part 5). */
export type ShoeKind = "boots" | "sneakers" | "slides";
export interface TapOption {
  value: string;
  label: string;
  /** The displayed score if this is the right reading. */
  score: number;
  /** The shoe question only: the kind he taps; `value` is the type code picked inside it. */
  group?: ShoeKind;
  /** A known-piece question ("Your green work boots?") only: Yes = his piece's type, No = as read. */
  answer?: "yes" | "no";
}
export interface TapQuestion {
  /** "jeans/sweatpants" */
  pair: string;
  slot: "top" | "bottom" | "footwear";
  field: "subcategory";
  /** Index into reading.garments of the garment it asks about. */
  garmentIndex: number;
  question: string;
  /** A pair: [as read, the look-alike]. The shoe question: one per kind, in the question's order. */
  options: TapOption[];
  /** What a skip scores: the more generous reading. */
  default: string;
  /** A pair: options[1].score - options[0].score. The shoe question: the best option's score - the score as read. */
  swing: number;
  doubt: string;
  /** "shoes" for the shoe question (tap v2, #120); "known" for "Your {piece}?" (#126, askWithCloset); absent on the pairs. */
  kind?: "shoes" | "known";
  /** "known" only: the closet piece it asks about, and its name when asked. */
  knownId?: string;
  knownName?: string;
}
