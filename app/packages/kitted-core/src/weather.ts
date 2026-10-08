// Weather → what an outfit needs (02 "S1d", DECISIONS-LOG #58–60). Pure rules, no I/O: the app's
// WeatherSource fills DayWeather (Apple WeatherKit later, demo weather until then).
//
// Weather NEVER changes a score (#59): same photo, same score on any day. It only steers which
// outfit the morning/evening card picks and adds one advice line under a result (weatherTip).
// The band numbers are first values for the founder's rubric review.

import type { ClosetItem, Garment, Reading } from "./types";

export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "fog" | "wind";
export type WeatherWindow = "day" | "evening";

/** The weather over the part of the day the card plans for (8 am–8 pm, or 6 pm–midnight). °F. */
export interface DayWeather {
  window: WeatherWindow;
  /** Now (day card) or at 8 pm (evening card). */
  nowF: number;
  highF: number;
  lowF: number;
  /** Coldest / warmest feels-like inside the window. */
  feelsLowF: number;
  feelsHighF: number;
  /** Highest chance of rain or snow inside the window, 0…1. */
  precipChance: number;
  /** Local hour (0–23) when that chance first reaches 50%, or null. */
  precipFromHour: number | null;
  condition: WeatherCondition;
  /** The evening card's late reading (midnight). */
  lateF?: number;
}

export type LayerNeed = "none" | "suggested" | "required" | "outer";

export interface WeatherNeeds {
  layer: LayerNeed;
  /** Shorts are fine (Everyday only; the rubric still judges the occasion). */
  shortsOk: boolean;
  /** Rain or snow is likely: no suede, and boots / dark shoes beat white sneakers. */
  wet: boolean;
  /** A big swing over the window: a layer he can take off. */
  removable: boolean;
  /** Hot enough that a layer is a mistake outdoors. */
  hot: boolean;
}

export const WEATHER_BANDS = {
  /** Feels-like at or above → no layer, shorts allowed (with feelsLow ≥ shortsMinLow). */
  hot: 80,
  shortsMinLow: 68,
  /** ≥ noLayer and < hot → no layer needed. */
  noLayer: 65,
  /** ≥ suggested and < noLayer → a light layer is suggested. */
  suggested: 50,
  /** ≥ required and < suggested → a layer is required. Below → an outer layer is required. */
  required: 35,
  wetChance: 0.5,
  swing: 15,
} as const;

export function weatherNeeds(w: DayWeather): WeatherNeeds {
  const B = WEATHER_BANDS;
  const cold = w.feelsLowF;
  const layer: LayerNeed = cold >= B.noLayer ? "none" : cold >= B.suggested ? "suggested" : cold >= B.required ? "required" : "outer";
  const hot = w.feelsHighF >= B.hot && cold >= B.noLayer;
  return {
    layer,
    shortsOk: w.feelsHighF >= B.hot && cold >= B.shortsMinLow,
    wet: w.precipChance >= B.wetChance,
    removable: layer !== "none" && w.feelsHighF - w.feelsLowF >= B.swing,
    hot,
  };
}

/** No weather (location declined or not asked): only what the month makes safe to say, northern US. */
export function seasonNeeds(month: number): WeatherNeeds {
  const base = { shortsOk: false, wet: false, removable: false, hot: false };
  if (month === 12 || month <= 2) return { ...base, layer: "required" };
  if (month === 3 || month === 11 || month === 10 || month === 4) return { ...base, layer: "suggested" };
  return { ...base, layer: "none" };
}

// ---------------------------------------------------------------- garment groups
const WARM_TOPS: ReadonlySet<unknown> = new Set(["sweater", "sweatshirt", "hoodie", "cardigan", "quarter_zip", "fleece"]);
const HEAVY_OUTER: ReadonlySet<unknown> = new Set(["puffer", "overcoat", "field_jacket", "leather_jacket", "bomber", "chore_coat"]);
const BOOTS: ReadonlySet<unknown> = new Set(["chelsea_boot", "work_boot"]);
const SHORTS: ReadonlySet<unknown> = new Set(["shorts", "athletic_shorts"]);

/** Gives warmth: anything worn over the top, or a knit/fleece top. */
export function isWarmLayer(g: Garment): boolean {
  return g.category === "outerwear" || WARM_TOPS.has(g.subcategory);
}
export function isHeavyOuter(g: Garment): boolean {
  return g.category === "outerwear" && HEAVY_OUTER.has(g.subcategory);
}
export function isShorts(g: Garment): boolean {
  return SHORTS.has(g.subcategory);
}
export function isSuede(g: Garment): boolean {
  return g.subcategory === "suede_chukka";
}
export function isBoot(g: Garment): boolean {
  return BOOTS.has(g.subcategory);
}
/** Light shoes that show rain and slush: white/cream sneakers and canvas. */
export function isFairWeatherShoe(g: Garment): boolean {
  return g.category === "footwear" && (g.subcategory === "canvas_sneaker" || g.color_family === "white" || g.color_family === "off_white_cream");
}

/** Hard filters for one item under these needs (true = may be picked). */
export function itemAllowed(it: ClosetItem, needs: WeatherNeeds | null, occasion: string): boolean {
  const g = it.garment;
  if (!needs) return true;
  if (isShorts(g) && !(needs.shortsOk && (occasion === "everyday" || occasion === "gym"))) return false;
  if (needs.wet && isSuede(g)) return false;
  if (needs.hot && isWarmLayer(g)) return false; // no jacket, and no sweater or hoodie either
  return true;
}

// ---------------------------------------------------------------- the advice line under a result
export type WeatherTipKey = "wetSuede" | "wetLight" | "coldNoLayer" | "coldNoCoat" | "hotLayer";
export interface WeatherTip {
  key: WeatherTipKey;
  /** The hour the rain starts (wet tips), or null for "all day". */
  fromHour: number | null;
}

/** One advice line for a scored reading under today's weather, or null. Never touches the score. */
export function weatherTip(reading: Reading, w: DayWeather | null): WeatherTip | null {
  if (!w) return null;
  const needs = weatherNeeds(w);
  const gs = reading.garments ?? [];
  const shoes = gs.find((g) => g.category === "footwear");
  if (needs.wet && shoes && isSuede(shoes)) return { key: "wetSuede", fromHour: w.precipFromHour };
  if (needs.wet && shoes && isFairWeatherShoe(shoes)) return { key: "wetLight", fromHour: w.precipFromHour };
  const warm = gs.some(isWarmLayer);
  if ((needs.layer === "required" || needs.layer === "outer") && !warm) return { key: "coldNoLayer", fromHour: null };
  if (needs.layer === "outer" && !gs.some(isHeavyOuter)) return { key: "coldNoCoat", fromHour: null };
  if (needs.hot && gs.some((g) => g.category === "outerwear")) return { key: "hotLayer", fromHour: null };
  return null;
}
