// T65: the plain name of every rule the parts engine can charge or credit (specs/explain-rating.md, tasks/T65/TESTING.md ER1.6).
// A plain name is a lowercase noun phrase Kit can use mid-sentence ("the narrow leg is what holds it back"): at most five
// words, no digits, nothing about a face or a body, unique across the table. A known name (the trade's own word, such as
// "the rule of thirds") is added only where one really exists.
//
// Insertion order is the tie-break order (picks.ts): when two rules are the same size, the one earlier here is named.
// It follows rubric/v5-styles.md: Proportions, Fit, Color, Shoes, Style, then the condition, the occasion, the lifts, the
// dealbreakers, the taste rules and the warm-day heavy layer.
//
// The words are for the founder to approve (Y24): tasks/T65/names.md. A new engine rule needs an entry here; the
// coverage test in test/ruleNames.test.ts fails on any rule the engine fires that has none.
export interface RuleName { plain: string; known?: string }

export const RULE_NAMES: Readonly<Record<string, RuleName>> = {
  // Proportions
  PR1_waist_break: { plain: "the waist break", known: "the rule of thirds" },
  PR1b_half_tuck: { plain: "the front tuck" },
  PR2_short_layer: { plain: "the short jacket shape" },
  PR2b_short_layer_read: { plain: "the cropped layer shape" },
  PR2h_hoodie_layer: { plain: "the hoodie layer shape" },
  PR3_tailored_line: { plain: "the tailored line" },
  PR4_street_shape: { plain: "the streetwear shape" },
  PR5_workwear_shape: { plain: "the workwear shape" },
  PR6_outdoor_shape: { plain: "the outdoor shape" },
  PR7_sweatsuit_shape: { plain: "the matched set shape" },
  PS1_shorts_layer: { plain: "the short layer over shorts" },
  PS1_shorts_shape: { plain: "the roomy shorts shape" },
  PN1_narrow_leg: { plain: "the narrow leg" },
  PB1_roomier_than_look: { plain: "the too-roomy top" },
  PF5_big_top_skinny_leg: { plain: "big top, skinny legs" },
  PF6_layer_over_skinny: { plain: "a layer over skinny legs" },
  PS2_roomy_over_fitted: { plain: "roomy top, tight shorts" },
  PS3_fitted_shorts: { plain: "the undersized shorts" },
  PF10_peek: { plain: "the peeking top hem" },
  PB2_wide_leg_band: { plain: "wide legs swamping the top" },
  PF1_heavy_hem_tailored: { plain: "the bunched hem" },
  PF2_long_top: { plain: "the long top" },
  PF3_long_layer_loose_leg: { plain: "long layer, loose legs" },
  PF4_long_shirt_wide_leg: { plain: "long shirt, wide legs" },
  P_next_level: { plain: "the next-level shape" },

  // Fit
  FF1_cuffs_ribbed: { plain: "the bunched cuffs" },
  FF1_sleeves_long: { plain: "the sleeves running long" },
  FF1_sleeves_tailored: { plain: "the jacket sleeves covering hands" },
  FF5_roomy_sleeves: { plain: "the roomy sleeves" },
  FF5_too_big: { plain: "the oversized fit" },
  FF6_strain: { plain: "the pulling fabric" },
  FF7_pooling: { plain: "the pooling hem" },
  FF7b_full_break_narrow: { plain: "the full break on slims" },

  // Color
  CC1_busy: { plain: "the busy palette" },
  CC1_too_many_accents: { plain: "too many accent colors" },
  CC2_bright_clash: { plain: "the bright clash" },
  CC2s_shape_softens: { plain: "the shape softening the clash" },
  CC2_calmed: { plain: "the calmed brights" },
  CC4_near_match: { plain: "the almost-matching pieces" },
  CC5_same_wash_denim: { plain: "double denim, same wash" },
  CC5_denim_near_match: { plain: "double denim, close washes" },
  CC6_same_pattern: { plain: "the repeated pattern" },
  CC6_same_pattern_scale: { plain: "the repeated pattern size" },
  CC6_three_patterns: { plain: "the three-pattern mix" },
  CL1_loud_print: { plain: "the loud print" },
  CL2_light_on_light: { plain: "light on light" },
  CP1_toned_down: { plain: "the toned-down bright" },
  CP1_standout_color: { plain: "the standout color" },
  CP2_quiet_accent: { plain: "the quiet accent" },
  CP3_tonal_flat: { plain: "the flat tonal look" },
  CP3_tonal_range: { plain: "the tonal range", known: "a monochrome look" },
  CP4_tonal_shoes: { plain: "the anchoring shoes" },
  CP5_tie_in: { plain: "the shoe color tie-in" },
  CP6_light_mid_dark: { plain: "the light-to-dark range", known: "value contrast" },
  CP8_layer_tie_in: { plain: "the layer color tie-in" },

  // Shoes
  SD1_matches: { plain: "the shoes matching the clothes" },
  SD2_too_casual: { plain: "the too-casual shoes" },
  SD3_too_dressy: { plain: "the too-dressy shoes" },
  SD4_chunky_under_tailoring: { plain: "chunky shoes under tailoring" },
  SK1_slides_out: { plain: "the slides" },
  SK1b_hem_drags: { plain: "the hem dragging on slides" },
  SK1s_slides_soft: { plain: "the slides done right" },
  SK2_runners: { plain: "the running shoes" },
  SQ_worn: { plain: "the worn shoes" },
  SW1_chunky_narrow: { plain: "chunky shoes on narrow legs" },
  SW1_runner_narrow: { plain: "runners on narrow legs" },
  SW2_weight_carries_leg: { plain: "chunky shoes carrying wide legs" },
  SW3_dainty_wide: { plain: "dainty shoes under wide legs" },
  SC_chosen_for_look: { plain: "the on-theme shoe" },
  SCol1_loud_vs_loud: { plain: "the loud shoe clash" },
  SCol2_shoe_accent: { plain: "the shoe accent" },

  // Style
  H1_reads_as_style: { plain: "the clear style" },
  H2_clear_top_to_toe: { plain: "the top-to-toe look" },
  H2_suit: { plain: "the properly worn suit" },
  H3_another_world: { plain: "the pieces from different worlds" },
  H4_standout_piece: { plain: "the one standout piece" },
  H5_too_many_statements: { plain: "too many statement pieces" },
  H6_goes_together: { plain: "the pieces going together" },
  H7_tracksuit: { plain: "the matched tracksuit" },
  SX1_another_look: { plain: "the piece from another look" },
  SX1_tip: { plain: "the off-look piece" },
  GT1_graphic_under_tailoring: { plain: "the graphic tee under tailoring" },
  TK1_tank_alone: { plain: "the tank on its own" },
  X_knit_on_knit: { plain: "knit on knit" },
  X_S5: { plain: "the blazer with gym shorts" },
  X_S7: { plain: "leather jacket, gym shorts" },
  X_H6: { plain: "the blazer with shorts" },
  X_H5: { plain: "the leather jacket with shorts" },

  // Condition (a care fault, and the faults the photo is too unclear to count)
  condition: { plain: "the clothes' condition" },
  C_unsure_stain: { plain: "a possible stain" },
  C_unsure_worn: { plain: "possible wear" },
  C_unsure_wrinkled: { plain: "a possible wrinkle" },

  // Occasion
  occasion: { plain: "the occasion's dress code" },
  occasion_hold: { plain: "the occasion's limit" },
  occasion_loungewear: { plain: "loungewear out of the house" },

  // Lifts
  SIL: { plain: "the strong silhouette" },
  L1: { plain: "the deliberate shape" },
  L2: { plain: "the short layer, full leg" },
  L3: { plain: "the open layer" },
  L4s: { plain: "the light summer look" },
  L5: { plain: "the calm-base accent" },
  L6: { plain: "the color picked up" },
  L7: { plain: "one look top to toe" },
  L7b: { plain: "the one smart piece" },
  SL1: { plain: "the fitted-top summer shape" },

  // Dealbreakers (the caps that hold or sink a score)
  S1: { plain: "a hoodie over skinny legs" },
  S2: { plain: "oversized top, skinny legs" },
  S4: { plain: "three bright colors" },
  S5: { plain: "the blazer gym-shorts clash" },
  S6: { plain: "a blazer with sweatpants" },
  S7: { plain: "the leather jacket gym-shorts clash" },
  S8: { plain: "dress shoes with loungewear" },
  S9: { plain: "the stain" },
  H1: { plain: "oversized top, slim legs" },
  H3: { plain: "the two brights fighting" },
  H4: { plain: "skinny joggers" },
  H5: { plain: "the leather-and-shorts clash" },
  H6: { plain: "the blazer-and-shorts clash" },
  H7: { plain: "the hem over the shoes" },
  H8: { plain: "the too-tight top" },
  H9: { plain: "sleeves over the hands" },
  H10: { plain: "chunky sneakers, narrow legs" },
  H11: { plain: "heavy shoes with trousers" },

  // Taste rules
  T_leg: { plain: "the leg width" },
  T_long_top: { plain: "the top ending low" },
  T_shorts: { plain: "wearing shorts" },
  T_shorts_wide: { plain: "the roomy shorts" },
  T_shorts_above: { plain: "shorts above the knee" },
  T_hem: { plain: "the full hem" },
  T_color: { plain: "colors beside the neutrals" },

  // The warm-day heavy layer
  heavy_layer: { plain: "the heavy layer" },
};

/** Every rule id with a name, in tie-break order. */
export const RULE_IDS: readonly string[] = Object.keys(RULE_NAMES);

/** The plain (and, for a few, known) name of a rule. Throws on an id that is not a rule the engine can emit. */
export function ruleName(id: string): RuleName {
  const n = Object.prototype.hasOwnProperty.call(RULE_NAMES, id) ? RULE_NAMES[id] : undefined;
  if (n === undefined) throw new Error(`ruleName: unknown rule id "${id}"`);
  return n;
}
