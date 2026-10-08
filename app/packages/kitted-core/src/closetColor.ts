// Closet colors: how far apart two color families are, and the one hex the app shows for a piece.
// Pure and deterministic. The matcher's rule (closetIdentity.ts): distance 0 = same color, 1 = a near
// neighbor (lighting or the model can tip one into the other: ask), 2 = clearly different (never the same item).
// The old closet match compared the rubric's FAMILY groups, so light grey, grey and charcoal all merged; this
// graph is what replaces it.

/** The neighbor graph. Everything not joined here is distance 2 ("2 or more"). */
export const COLOR_EDGES: readonly (readonly [string, string])[] = [
  ["light_grey", "grey"], ["grey", "charcoal"], ["charcoal", "black"], ["black", "navy"], ["navy", "blue"],
  ["blue", "light_blue"], ["white", "off_white_cream"], ["off_white_cream", "khaki_beige"],
  ["khaki_beige", "tan_camel"], ["tan_camel", "brown"], ["brown", "burgundy"], ["burgundy", "red"],
  ["denim_light", "denim_mid"], ["denim_mid", "denim_dark"], ["denim_dark", "navy"],
  ["olive", "green"], ["sage", "olive"], ["sage", "green"],
];
/** Only for jeans: very dark denim reads as black (black jeans are denim). */
export const JEANS_ONLY_EDGES: readonly (readonly [string, string])[] = [["denim_dark", "black"]];

function edgeIn(list: readonly (readonly [string, string])[], a: string, b: string): boolean {
  return list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export type ColorDistance = 0 | 1 | 2;

/**
 * 0 exact, 1 neighbors, 2 = "2 or more" (or unknown / different). `jeans` turns on denim_dark-black.
 * Missing colors are distance 2 here; the matcher checks for missing colors itself before calling this.
 */
export function colorDistance(a: unknown, b: unknown, opts: { jeans?: boolean } = {}): ColorDistance {
  if (typeof a !== "string" || typeof b !== "string" || a === "" || b === "") return 2;
  if (a === b) return 0;
  if (a === "multicolor" || b === "multicolor") return 2;
  if (edgeIn(COLOR_EDGES, a, b)) return 1;
  if (opts.jeans && edgeIn(JEANS_ONLY_EDGES, a, b)) return 1;
  return 2;
}

/** Families one step away (both edge lists, so display bands respect every neighbor). */
export function colorNeighbors(family: string): string[] {
  const out: string[] = [];
  for (const [x, y] of [...COLOR_EDGES, ...JEANS_ONLY_EDGES]) {
    if (x === family && !out.includes(y)) out.push(y);
    if (y === family && !out.includes(x)) out.push(x);
  }
  return out.sort();
}

/** The app's swatch per family (same values as app/src/features/fitcheck/labels.ts garmentHex). */
export const FAMILY_HEX: Readonly<Record<string, string>> = {
  white: "#F2F0EA", off_white_cream: "#EDE6D6", light_grey: "#C9CCD1", grey: "#9CA0A6", charcoal: "#4A4D55", black: "#1E2026",
  navy: "#2B3550", light_blue: "#AFC6DE", blue: "#4F6FA8", denim_light: "#8FA7C4", denim_mid: "#5D7393", denim_dark: "#26324F",
  olive: "#5B6440", green: "#4C7A55", sage: "#A3B09A", khaki_beige: "#D8CDB8", tan_camel: "#B98E62", brown: "#5A3522",
  burgundy: "#6B2B34", red: "#B23A3A", orange: "#D2773A", yellow: "#E1C04A", pink: "#E3A7B5", purple: "#6E4E8C", multicolor: "#9CA0A6",
};
/** garmentHex's fallback for an unknown family. */
export const UNKNOWN_HEX = "#ECEEF1";

// ---------------------------------------------------------------- sRGB <-> CIE L*a*b* (D65)
export type Lab = readonly [number, number, number];

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toLin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const fromLin = (v: number) => {
  const s = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(s * 255)));
};
const D = 6 / 29;
const f = (t: number) => (t > D * D * D ? Math.cbrt(t) : t / (3 * D * D) + 4 / 29);
const finv = (t: number) => (t > D ? t * t * t : 3 * D * D * (t - 4 / 29));
const XN = 0.95047, ZN = 1.08883;

export function hexToLab(hex: string): Lab | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(toLin) as [number, number, number];
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const fy = f(y);
  return [116 * fy - 16, 500 * (f(x / XN) - fy), 200 * (fy - f(z / ZN))];
}

export function labToHex([L, a, b]: Lab): string {
  const fy = (L + 16) / 116;
  const x = XN * finv(fy + a / 500), y = finv(fy), z = ZN * finv(fy - b / 200);
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return "#" + [r, g, bl].map((v) => fromLin(Math.max(0, v)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** CIE L* (0 black ... 100 white) of a hex, or null when it isn't a #RRGGBB. */
export function lightnessOf(hex: string): number | null {
  return hexToLab(hex)?.[0] ?? null;
}

/** The family whose swatch is nearest (CIE76) to this hex; multicolor never wins. Ties: name ascending. */
export function nearestFamily(hex: string): string | null {
  const lab = hexToLab(hex);
  if (!lab) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const fam of Object.keys(FAMILY_HEX).sort()) {
    if (fam === "multicolor") continue;
    const o = hexToLab(FAMILY_HEX[fam]!)!;
    const d = Math.hypot(lab[0] - o[0], lab[1] - o[1], lab[2] - o[2]);
    if (d < bestD) { bestD = d; best = fam; }
  }
  return best;
}

/**
 * A family's lightness band: its own L* and the midpoints toward its nearest lighter and darker neighbors
 * (graph neighbors only). No neighbor on a side = the band runs to 98 (lighter) or 4 (darker).
 */
export function familyBand(family: string): { L: number; lo: number; hi: number } | null {
  const hex = FAMILY_HEX[family];
  if (!hex || family === "multicolor") return null;
  const L = lightnessOf(hex)!;
  let lighter = Infinity, darker = -Infinity;
  for (const n of colorNeighbors(family)) {
    const nh = FAMILY_HEX[n];
    if (!nh) continue;
    const nl = lightnessOf(nh)!;
    if (nl > L && nl < lighter) lighter = nl;
    if (nl < L && nl > darker) darker = nl;
  }
  return { L, lo: darker === -Infinity ? 4 : (L + darker) / 2, hi: lighter === Infinity ? 98 : (L + lighter) / 2 };
}

/** The shade step, as far as display goes. */
export type ShadeStep = "light" | "mid" | "dark";
const STEP_L = 10;
/** A stepped color moves at most this share of the way to the band edge, so it can never cross it. */
const STEP_SHARE = 0.6;
/** A sampled color is pulled at least this far inside the band edge. */
const SAMPLE_MARGIN = 1;

function withL(hex: string, L: number): string {
  const lab = hexToLab(hex)!;
  return labToHex([L, lab[1], lab[2]]);
}

/**
 * The hex the app shows for a closet piece. Always inside the reading's family band, so a dark grey hoodie
 * can never be drawn as light grey and a "light charcoal" stays darker than the grey/charcoal midpoint.
 *  - sampledHex (a color picked from his photo) is used only when its nearest family is the reading's family or a
 *    neighbor of it; its L* is then clamped inside the band.
 *  - otherwise the family swatch, stepped lighter / darker by the shade (a key whose family is a lighter or darker
 *    neighbor counts as that step: color grey + "dark grey" -> the dark step of grey).
 *  - no shade, no usable sample: exactly FAMILY_HEX (what the app shows today).
 */
export function displayHex(
  colorFamily: unknown,
  shade?: { family?: string | null; step?: ShadeStep | null } | null,
  sampledHex?: string | null,
): string {
  const fam = typeof colorFamily === "string" ? colorFamily : "";
  const base = FAMILY_HEX[fam];
  if (!base) return UNKNOWN_HEX;
  const band = familyBand(fam);
  if (!band) return base;

  if (typeof sampledHex === "string") {
    const near = nearestFamily(sampledHex);
    if (near !== null && (near === fam || colorDistance(near, fam, { jeans: true }) === 1)) {
      const L = lightnessOf(sampledHex)!;
      const clamped = Math.min(band.hi - SAMPLE_MARGIN, Math.max(band.lo + SAMPLE_MARGIN, L));
      return clamped === L ? "#" + sampledHex.trim().replace(/^#/, "").toUpperCase() : withL(sampledHex, clamped);
    }
  }

  let step: ShadeStep | null = shade?.step ?? null;
  if (step === null && shade?.family && shade.family !== fam && colorDistance(shade.family, fam, { jeans: true }) === 1) {
    const sh = FAMILY_HEX[shade.family];
    const sl = sh ? lightnessOf(sh) : null;
    if (sl !== null) step = sl > band.L ? "light" : sl < band.L ? "dark" : null;
  }
  if (step === "light") return withL(base, band.L + Math.min(STEP_L, STEP_SHARE * (band.hi - band.L)));
  if (step === "dark") return withL(base, band.L - Math.min(STEP_L, STEP_SHARE * (band.L - band.lo)));
  return base;
}
