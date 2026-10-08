// Free-text shade -> a fixed ShadeKey. The vision model may add a 1-3 word shade ("heather grey", "dark wash");
// run to run that text changes ~44% of the time, and it is untrusted. So the app never shows it and never compares
// it raw: it is cleaned, looked up word by word in a closed lexicon, and folded into a canonical key. Unknown words
// are ignored; text with no known word (or that fails the cleaning rules) gives null. Pure and deterministic.

import type { ShadeStep } from "./closetColor";

export type ShadeFinish = "heather" | "washed" | "faded" | "raw";
export interface ShadeKey {
  /** The color family the words name (after folding "dark grey" -> charcoal), or null when they name none. */
  family: string | null;
  step: ShadeStep | null;
  finish: ShadeFinish | null;
}

const COLOR_WORDS: Readonly<Record<string, string>> = {
  white: "white", snow: "white", optic: "white",
  "off-white": "off_white_cream", offwhite: "off_white_cream", cream: "off_white_cream", ivory: "off_white_cream",
  ecru: "off_white_cream", bone: "off_white_cream", oat: "off_white_cream", oatmeal: "off_white_cream", natural: "off_white_cream",
  grey: "grey", gray: "grey", silver: "grey", ash: "grey",
  charcoal: "charcoal", graphite: "charcoal", gunmetal: "charcoal", slate: "charcoal",
  black: "black", jet: "black", onyx: "black",
  navy: "navy", midnight: "navy",
  blue: "blue", cobalt: "blue", royal: "blue",
  sky: "light_blue", powder: "light_blue", baby: "light_blue",
  denim: "denim_mid", indigo: "denim_dark",
  olive: "olive", army: "olive", military: "olive",
  green: "green", forest: "green", hunter: "green", kelly: "green", emerald: "green",
  sage: "sage", mint: "sage",
  khaki: "khaki_beige", beige: "khaki_beige", sand: "khaki_beige", stone: "khaki_beige", taupe: "khaki_beige", putty: "khaki_beige",
  tan: "tan_camel", camel: "tan_camel", caramel: "tan_camel", cognac: "tan_camel", toffee: "tan_camel",
  brown: "brown", chocolate: "brown", espresso: "brown", mocha: "brown", coffee: "brown", walnut: "brown",
  burgundy: "burgundy", maroon: "burgundy", wine: "burgundy", oxblood: "burgundy",
  red: "red", crimson: "red", scarlet: "red", cherry: "red",
  orange: "orange", rust: "orange", burnt: "orange",
  yellow: "yellow", mustard: "yellow", gold: "yellow",
  pink: "pink", rose: "pink", blush: "pink",
  purple: "purple", lilac: "purple", lavender: "purple", plum: "purple",
};
const STEP_WORDS: Readonly<Record<string, ShadeStep>> = {
  light: "light", pale: "light", lt: "light",
  medium: "mid", mid: "mid", "mid-tone": "mid",
  dark: "dark", deep: "dark", dk: "dark",
};
const FINISH_WORDS: Readonly<Record<string, ShadeFinish>> = {
  heather: "heather", heathered: "heather", marl: "heather", melange: "heather", marled: "heather",
  washed: "washed", acid: "washed", stonewash: "washed", stonewashed: "washed", "stone-washed": "washed",
  faded: "faded", vintage: "faded", worn: "faded",
  raw: "raw", rigid: "raw", unwashed: "raw", selvedge: "raw",
};
/** Known words that carry nothing ("dark wash" = dark). */
const FILLER = new Set(["wash", "tone", "toned", "color", "colour", "shade", "and"]);

/** (family, step) -> the family that wording means: "light grey" is light_grey, "dark blue" is navy. */
const FOLD: Readonly<Record<string, Partial<Record<ShadeStep, string>>>> = {
  grey: { light: "light_grey", dark: "charcoal" },
  blue: { light: "light_blue", dark: "navy" },
  denim_mid: { light: "denim_light", mid: "denim_mid", dark: "denim_dark" },
};

/**
 * Untrusted text -> cleaned words, or null. Rules: lowercase; letters, spaces and hyphens only; at most 3 words and
 * 24 characters. Anything else is rejected (not trimmed into shape).
 */
export function cleanShadeText(text: unknown): string[] | null {
  if (typeof text !== "string") return null;
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (t === "" || t.length > 24 || !/^[a-z -]+$/.test(t)) return null;
  const words = t.split(" ");
  if (words.length > 3) return null;
  return words;
}

function lookup(word: string): { family?: string; step?: ShadeStep; finish?: ShadeFinish; known: boolean } {
  if (COLOR_WORDS[word]) return { family: COLOR_WORDS[word], known: true };
  if (STEP_WORDS[word]) return { step: STEP_WORDS[word], known: true };
  if (FINISH_WORDS[word]) return { finish: FINISH_WORDS[word], known: true };
  if (FILLER.has(word)) return { known: true };
  return { known: false };
}

/** Free text -> ShadeKey, or null when it isn't usable. "stone wash" is a finish, not a color. */
export function parseShade(text: unknown): ShadeKey | null {
  const words = cleanShadeText(text);
  if (!words) return null;
  const parts: string[] = [];
  for (const w of words) {
    if (lookup(w).known || !w.includes("-")) parts.push(w);
    else parts.push(...w.split("-").filter((p) => p !== ""));
  }
  const families: string[] = [];
  let step: ShadeStep | null = null;
  let finish: ShadeFinish | null = null;
  let recognized = false;
  for (let i = 0; i < parts.length; i++) {
    const w = parts[i]!;
    const next = parts[i + 1];
    if (w === "stone" && (next === "wash" || next === "washed")) { finish = "washed"; recognized = true; i++; continue; }
    const hit = lookup(w);
    if (!hit.known) continue;
    recognized = true;
    if (hit.family && !families.includes(hit.family)) families.push(hit.family);
    if (hit.step && step === null) step = hit.step;
    if (hit.finish && finish === null) finish = hit.finish;
  }
  if (!recognized) return null;
  let family: string | null = null;
  if (families.length === 1) family = families[0]!;
  else if (families.length === 2) family = related(families[0]!, families[1]!) ? families[0]! : null; // "navy blue" -> navy; "blue grey" -> none
  if (family !== null && step !== null) {
    const folded = FOLD[family]?.[step];
    if (folded) { family = folded; step = null; }
  }
  if (family === null && step === null && finish === null) return null;
  return { family, step, finish };
}

const RELATED: readonly (readonly [string, string])[] = [
  ["navy", "blue"], ["olive", "green"], ["sage", "green"], ["light_blue", "blue"], ["charcoal", "grey"],
  ["off_white_cream", "white"], ["tan_camel", "brown"], ["khaki_beige", "tan_camel"], ["burgundy", "red"],
  ["denim_dark", "denim_mid"], ["denim_dark", "blue"], ["denim_mid", "blue"], ["denim_mid", "navy"],
];
function related(a: string, b: string): boolean {
  return RELATED.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Stable string form for counting and equality ("grey|mid|-"). */
export function shadeId(k: ShadeKey | null | undefined): string | null {
  if (!k) return null;
  return `${k.family ?? "-"}|${k.step ?? "-"}|${k.finish ?? "-"}`;
}
export function shadeFromId(id: string): ShadeKey | null {
  const [fam, step, finish] = id.split("|");
  if (fam === undefined || step === undefined || finish === undefined) return null;
  const s = step === "-" ? null : step, fi = finish === "-" ? null : finish;
  if (s !== null && !["light", "mid", "dark"].includes(s)) return null;
  if (fi !== null && !["heather", "washed", "faded", "raw"].includes(fi)) return null;
  return { family: fam === "-" ? null : fam, step: s as ShadeStep | null, finish: fi as ShadeFinish | null };
}

/** The only words the app ever shows for a color (lowercase; the screen sets the case). */
export const FAMILY_WORD: Readonly<Record<string, string>> = {
  white: "white", off_white_cream: "cream", light_grey: "light grey", grey: "grey", charcoal: "charcoal", black: "black",
  navy: "navy", light_blue: "light blue", blue: "blue", denim_light: "light-wash denim", denim_mid: "mid-wash denim",
  denim_dark: "dark-wash denim", olive: "olive", green: "green", sage: "sage", khaki_beige: "khaki", tan_camel: "tan",
  brown: "brown", burgundy: "burgundy", red: "red", orange: "orange", yellow: "yellow", pink: "pink", purple: "purple",
  multicolor: "multicolor",
};
const ALREADY_LIGHT = new Set(["light_grey", "light_blue", "denim_light", "white"]);
const ALREADY_DARK = new Set(["charcoal", "navy", "denim_dark", "black"]);
const FINISH_WORD: Readonly<Record<ShadeFinish, string>> = { heather: "heather", washed: "washed", faded: "faded", raw: "raw" };

/**
 * Display words for a piece's color, built only from the fixed tables above. The reading's color family names
 * the color (the shade can't move it to another family); the shade adds a step and a finish.
 * shadeWords("grey", parseShade("medium grey")) -> "medium grey"; ("grey", "heather grey") -> "heather grey".
 */
export function shadeWords(colorFamily: unknown, key?: ShadeKey | null): string {
  const fam = typeof colorFamily === "string" ? colorFamily : "";
  const base = FAMILY_WORD[fam] ?? "";
  if (!key || base === "") return base;
  const words: string[] = [];
  if (key.finish) words.push(FINISH_WORD[key.finish]);
  const step = key.family === null || key.family === fam ? key.step : null;
  if (step === "light") words.push(ALREADY_LIGHT.has(fam) ? "pale" : "light");
  if (step === "dark") words.push(ALREADY_DARK.has(fam) ? "deep" : "dark");
  if (step === "mid" && !fam.startsWith("denim")) words.push("medium");
  words.push(base);
  return words.join(" ");
}
