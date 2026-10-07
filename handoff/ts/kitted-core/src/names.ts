// Garment names and small reading helpers shared by the fix engine, re-check and Rotation
// (port of kitted_logic.py: SUB_NAME, name, G, idx, SLOT_TO_CLOSET, CORE).

import type { ClosetSlot, Garment, Reading } from "./types";

export const SUB_NAME: Readonly<Record<string, string>> = {
  white_leather_sneaker: "leather sneakers", low_profile_sneaker: "low-profile sneakers",
  canvas_sneaker: "canvas sneakers", retro_runner: "runners", performance_runner: "running shoes",
  chunky_sneaker: "chunky sneakers", basketball_sneaker: "high-tops", slides_sandals: "slides",
  chelsea_boot: "Chelsea boots", work_boot: "work boots", dress_shoe: "dress shoes", suede_chukka: "chukkas",
  loafer: "loafers", derby: "derbies", athletic_shorts: "gym shorts", drawstring_trousers: "drawstring trousers",
  suit_trousers: "suit trousers", oxford_shirt: "oxford", dress_shirt: "dress shirt", flannel_shirt: "flannel",
  graphic_tee: "graphic tee", quarter_zip: "quarter-zip", knit_polo: "knit polo", tank_top: "tank top",
  suit_jacket: "suit jacket", sport_coat: "sport coat", unstructured_blazer: "blazer", denim_jacket: "denim jacket",
  chore_coat: "chore coat", field_jacket: "field jacket", rain_jacket: "rain jacket", shell_jacket: "shell jacket",
  leather_jacket: "leather jacket", camp_collar_shirt: "camp shirt", rugby_shirt: "rugby shirt",
};

/** Plain garment name for copy lines: "leather sneakers", "chinos", "piece" when unknown. */
export function garmentName(g: Pick<Garment, "subcategory"> | null | undefined): string {
  const sub = g?.subcategory;
  if (typeof sub === "string" && Object.prototype.hasOwnProperty.call(SUB_NAME, sub)) return SUB_NAME[sub]!;
  return (typeof sub === "string" && sub !== "" ? sub : "piece").split("_").join(" ");
}

/** A generic, clean, clearly-read garment (kitted_logic.G). */
export function G(category: string, subcategory: string, color: string, extra: Partial<Garment> = {}): Garment {
  return {
    category, subcategory, color_family: color, pattern: "solid", logo: "none",
    volume: 3, leg_shape: "na", hem: "na", tucked: "na", condition: "clean", certainty: "clear",
    length: "na", pattern_scale: "na", saturation: "na", sleeve_end: "na", strain: "none",
    distressed_by_design: false, shows_below_outer: false,
    ...extra,
  };
}

/** Reading category -> closet slot. */
export const SLOT_TO_CLOSET: Readonly<Record<string, ClosetSlot>> = {
  top: "top", bottom: "bottom", footwear: "shoes", outerwear: "outer",
};

/** The four core categories, in the order the re-check merger walks them. */
export const CORE = ["top", "bottom", "footwear", "outerwear"] as const;

/** Index of the first garment of `category`, or -1. */
export function idx(reading: Reading, category: string): number {
  return reading.garments.findIndex((g) => g.category === category);
}
