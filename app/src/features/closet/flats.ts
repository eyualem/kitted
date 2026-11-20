// The closet's garment drawings (founder, Oct 8: DECISIONS-LOG #141): "technical flat" illustrations drawn by
// code from what the closet call read (type, fit, hem, details, color, pattern, a plain brand word), never from
// AI-generated images and never his photo. Ported from the prototype (`screenshots/closet-graphics/flats.js`)
// and extended to every type the reading can return. Pure: `renderFlat` returns an SVG string in a 200 × 200
// viewBox for react-native-svg's SvgXml. Only elements SvgXml supports (path, rect, circle, ellipse, text, g,
// defs, linear/radial gradients, pattern); no filters, masks or CSS. Deterministic: the same piece draws the
// same every time. The brand is a word in plain type, never a logo shape.

import { lightnessOf } from '@kitted/core';
import { lightColors } from '@/design-system/tokens';

export type FlatScheme = 'light' | 'dark';

export type TopType =
  | 'tee' | 'polo' | 'tank' | 'crew' | 'quarter_zip' | 'cardigan' | 'hoodie' | 'shirt' | 'overshirt'
  | 'denim_jacket' | 'bomber' | 'jacket' | 'puffer' | 'blazer' | 'coat';
export type BottomType = 'jeans' | 'chinos' | 'trousers' | 'cargos' | 'joggers' | 'shorts';
export type ShoeType = 'sneaker' | 'runner' | 'work_boot' | 'chukka' | 'chelsea' | 'loafer' | 'derby' | 'slides';

export interface FlatPattern {
  type: 'solid' | 'heather' | 'suede' | 'twill' | 'stripes' | 'gingham' | 'knit';
  /** The pattern's line color (stripes, checks). */
  line?: string;
  /** Repeat size in viewBox units. */
  scale?: number;
}

interface FlatBase {
  color: string;
  pattern?: FlatPattern;
  /** Plain brand word ("NIKE"), drawn as text. */
  brand?: string | null;
  stitch?: string;
  buttonColor?: string;
}

export interface TopFlat extends FlatBase {
  kind: 'top';
  type: TopType;
  /** oversized: dropped shoulders and a longer, wider body (#315, drawn apart from relaxed). */
  fit?: 'slim' | 'regular' | 'relaxed' | 'oversized';
  details?: {
    drawstrings?: boolean; pouch?: boolean; ribHem?: boolean; ribCuffs?: boolean; fullZip?: boolean;
    chestPockets?: 0 | 1 | 2; flaps?: boolean;
  };
  drawstringColor?: string;
  /** A printed graphic on the chest (graphic tees). */
  print?: boolean;
  /** Sleeve length (#359, #361): unset draws the type's usual (short on tees and polos, none on a tank, long otherwise);
   *  a tee, polo or jersey with long sleeves gets slimmer sleeves to the wrist and a plain hemmed cuff (§24, #359). */
  sleeves?: 'short' | 'long' | 'sleeveless';
  /** A henley's short button placket, or a turtleneck's rolled collar, in place of the crew neck (#361). */
  neck?: 'henley' | 'turtle';
}

export interface BottomFlat extends FlatBase {
  kind: 'bottom';
  type: BottomType;
  /** skinny: narrower than slim, close to the hem (#315). */
  fit?: 'skinny' | 'slim' | 'straight' | 'relaxed' | 'wide';
  hem?: 'no_break' | 'slight_break' | 'full_break' | 'cuffed';
  wash?: 'rinse' | 'washed' | 'faded';
  ripped?: boolean;
  sideStripe?: boolean;
  /** A printed graphic on the thigh (graphic jeans, sweatpants, shorts: T120). Drawn as the tee's chest mark, smaller. */
  print?: boolean;
}

export interface ShoeFlat extends FlatBase {
  kind: 'shoe';
  type: ShoeType;
  sole?: string;
  laceColor?: string;
  chunky?: boolean;
  /** Canvas sneakers: a rubber toe cap and a stripe along the sole (#315, drawn apart from leather). */
  canvas?: boolean;
}

export type AccessoryType = 'watch' | 'belt' | 'cap' | 'beanie';
export type WatchMetal = 'gold' | 'silver' | 'black';
export const WATCH_METALS: readonly WatchMetal[] = ['gold', 'silver', 'black'];
/** The case (and bracelet) fill for each tone. The drawing fills the case with exactly this hex. */
export const METAL_HEX: Readonly<Record<WatchMetal, string>> = { gold: '#C9A44C', silver: '#C5C9CF', black: '#2A2D34' };

export interface AccessoryFlat extends FlatBase {
  kind: 'accessory';
  type: AccessoryType;
  /** Watch only: the case's tone (and the bracelet's). Unset draws silver. Ignored on a belt, cap or beanie. */
  metal?: WatchMetal;
  /** Watch only: a metal bracelet in `metal`'s tone instead of a strap in `color`. */
  bracelet?: boolean;
  /** Watch only: 'digital' draws a dark display with lit digits (no text element); unset draws an analog dial. */
  face?: 'analog' | 'digital';
}

export type FlatSpec = TopFlat | BottomFlat | ShoeFlat | AccessoryFlat;

// ---------------------------------------------------------------- color helpers
const clamp = (v: number) => Math.max(0, Math.min(255, v));
function rgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s.slice(0, 6), 16);
  return Number.isFinite(n) ? [n >> 16, (n >> 8) & 255, n & 255] : [156, 160, 166];
}
function toHex([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((v) => Math.round(clamp(v!)).toString(16).padStart(2, '0')).join('').toUpperCase();
}
/** Mix toward black (a < 0) or white (a > 0), like the design system's shade(). */
export function mix(h: string, a: number): string {
  const t = a < 0 ? 0 : 255;
  const p = Math.abs(a);
  return toHex(rgb(h).map((v) => v + (t - v) * p));
}
export function lum(h: string): number {
  const l = (v: number) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb(h);
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
}
function edgeFor(c: string, scheme: FlatScheme): string {
  const y = lum(c);
  if (scheme === 'dark' && y < 0.05) return mix(c, 0.42); // a rim light so black reads on night
  if (y > 0.75) return mix(c, -0.36);
  return mix(c, -0.42);
}
/** Below this relative luminance a piece counts as "very dark" (black tee, black Chelsea boots). */
const HALO_LUM = 0.05;
/** Dark mode only (#231): a faint light rim outside a very dark piece's silhouette, so it doesn't vanish into
 *  a dark tile. Drawn before the fills: the fill hides the inner half of the 5-unit stroke, leaving about 2 units
 *  (≈1 pt on a 95 pt tile; the viewBox is 200) of white at 22%. Light mode and lighter pieces draw nothing. */
function halo(ctx: Ctx, c: string, paths: string[]): string {
  if (!paths.length) return '';
  if (ctx.rim) return rim(paths);
  if (ctx.scheme !== 'dark' || lum(c) >= HALO_LUM) return '';
  return `<g fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="5" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
}
/** At or above this CIE L* a piece counts as white or very light (white tee, cream knit, white sneakers). */
export const RIM_L = 90;
/** Light mode only (09-ui-review §7 C5): a thin outline in 12% ink around a white or very light piece, so it keeps an
 *  edge on the light tile (the dark-mode halo's counterpart). Drawn before the fills like the halo: the fill hides the
 *  inner half of the 2.4-unit stroke, leaving about 1.2 units (≈0.6 pt on a 95 pt tile) outside the silhouette. */
function rim(paths: string[]): string {
  return `<g fill="none" stroke="${lightColors.ink}" stroke-opacity=".12" stroke-width="2.4" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
}
/** A pattern line that reads on this base: darker on light pieces, lighter on dark ones. */
export function contrastLine(c: string): string {
  return lum(c) < 0.12 ? mix(c, 0.45) : mix(c, -0.5);
}
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const f = (n: number) => Math.round(n * 10) / 10;
const op = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- shared pieces
function patternDefs(id: string, p: FlatPattern | undefined, base: string): string {
  const kind = p?.type ?? 'solid';
  if (kind === 'stripes') {
    const w = p?.scale ?? 5;
    const line = p?.line ?? contrastLine(base);
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="10"><rect width="${w}" height="10" fill="${base}"/><rect x="0" width="${f(w * 0.17)}" height="10" fill="${line}"/><rect x="${f(w * 0.5)}" width="${f(w * 0.08)}" height="10" fill="${line}" opacity=".55"/></pattern>`;
  }
  if (kind === 'gingham') {
    const s = p?.scale ?? 6;
    const h = s / 2;
    const line = p?.line ?? contrastLine(base);
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${base}"/><rect width="${h}" height="${s}" fill="${line}" opacity=".46"/><rect width="${s}" height="${h}" fill="${line}" opacity=".46"/></pattern>`;
  }
  if (kind === 'heather' || kind === 'suede') {
    const r = lcg(kind === 'heather' ? 7 : 11);
    const n = kind === 'heather' ? 80 : 70;
    let dots = '';
    for (let i = 0; i < n; i++) {
      const light = r() > 0.5;
      dots += `<circle cx="${f(r() * 16)}" cy="${f(r() * 16)}" r="${f(0.18 + r() * (kind === 'heather' ? 0.3 : 0.28))}" fill="${light ? mix(base, 0.2) : mix(base, -0.18)}" opacity="${f(0.3 + r() * 0.35)}"/>`;
    }
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="${base}"/>${dots}</pattern>`;
  }
  if (kind === 'knit') {
    // ribs that read on a tile in any color: lighter lines on dark knits, darker on light ones
    const dark = lum(base) < 0.12;
    const line = mix(base, dark ? 0.2 : -0.16);
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="3.2" height="6"><rect width="3.2" height="6" fill="${base}"/><path d="M0.8,0 V6 M2.4,0 V6" stroke="${line}" stroke-width=".6" opacity=".85"/><path d="M0.8,1.5 l.8,1.5 l.8,-1.5 M0.8,4.5 l.8,1.5 l.8,-1.5" fill="none" stroke="${mix(base, 0.12)}" stroke-width=".35" opacity=".6"/></pattern>`;
  }
  if (kind === 'twill') {
    const line = mix(base, lum(base) < 0.05 ? 0.16 : -0.12);
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="3" height="3"><rect width="3" height="3" fill="${base}"/><path d="M-1,1 L1,-1 M0,3 L3,0 M2,4 L4,2" stroke="${line}" stroke-width=".55" opacity=".7"/></pattern>`;
  }
  return '';
}

/** Side shadows, a top light, a wash glow and the ground shadow. */
function shadeDefs(id: string, scheme: FlatScheme): string {
  const k = scheme === 'dark' ? 1.25 : 1;
  const side = op(0.16 * k);
  return (
    `<linearGradient id="${id}sx" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="${side}"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${side}"/></linearGradient>` +
    `<linearGradient id="${id}ty" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>` +
    `<radialGradient id="${id}wg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}gs" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity="${scheme === 'dark' ? 0.5 : 0.22}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`
  );
}

interface Ctx {
  id: string;
  scheme: FlatScheme;
  /** Fold strength (light pieces fold softer). */
  foldK: number;
  /** Light mode and a white or very light piece: its silhouette gets the thin ink outline (§7 C5). */
  rim: boolean;
}

/** A fold: a soft shadow stroke with a highlight beside it (the classic flat-illustration crease). */
function fold(ctx: Ctx, d: string, w = 2.4, o = 1): string {
  const k = o * ctx.foldK;
  return `<path d="${d}" fill="none" stroke="#000" stroke-opacity="${op(0.13 * k)}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity="${op(0.11 * k)}" stroke-width="${f(w * 0.45)}" stroke-linecap="round" transform="translate(1.3,0.4)"/>`;
}
const stitch = (c: string, w = 0.7) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="1.8 1.3" stroke-linecap="round"`;
const FONT = `font-family="System" font-weight="700"`;

function brandText(x: number, y: number, size: number, word: string, c: string): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" ${FONT} font-size="${size}" letter-spacing=".6" fill="${lum(c) < 0.3 ? mix(c, 0.62) : mix(c, -0.5)}">${escapeText(word)}</text>`;
}
function escapeText(s: string): string {
  return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
}
function zip(cx: number, y0: number, y1: number, c: string): string {
  const tape = lum(c) < 0.12 ? mix(c, 0.3) : mix(c, -0.35);
  return `<path d="M${cx},${y0} V${y1}" stroke="${tape}" stroke-width="2.2"/><path d="M${cx},${y0} V${y1}" stroke="#fff" stroke-opacity=".35" stroke-width=".6" stroke-dasharray=".8 .8"/><rect x="${cx - 2.2}" y="${y0}" width="4.4" height="7" rx="1.2" fill="${mix(tape, -0.2)}"/>`;
}

// ======================================================================== TOPS
/** The print mark (the picture-in-a-frame the graphic tee has always had), at any size: a frame and a peak, in the piece's
 *  contrast line. T120 uses it for the side placements on a placketed or zipped top and on a leg; the tee's own chest
 *  mark in top() is left as it was. */
function printMark(x: number, y: number, w: number, h: number, c: string): string {
  const pc = contrastLine(c);
  const px = (u: number) => f(x + u * w);
  const py = (v: number) => f(y + v * h);
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(Math.min(w, h) * 0.14)}" fill="${pc}" opacity=".5"/>`
    + `<path d="M${px(0.18)},${py(0.8)} L${px(0.42)},${py(0.34)} L${px(0.6)},${py(0.62)} L${px(0.72)},${py(0.48)} L${px(0.86)},${py(0.8)} Z" fill="${pc}" opacity=".7"/>`;
}

function top(s: TopFlat, ctx: Ctx): string {
  const { id } = ctx;
  const cx = 100;
  const t = s.type;
  const tee = t === 'tee' || t === 'polo' || t === 'tank';
  // the sleeves as asked (#361), else the type's usual; a tank has none
  const noSleeves = t === 'tank' || s.sleeves === 'sleeveless';
  const shortSl = s.sleeves ? s.sleeves === 'short' : tee;
  // a long-sleeve tee (§24, #359): slimmer sleeves than a sweatshirt's, finished with a stitched hem instead of a cuff
  const longTee = tee && !shortSl;
  // an oversized short-sleeve tee: dropped shoulders, a boxy body, a longer hem and longer, wider sleeves (oversized-tee)
  const bigTee = t === 'tee' && shortSl && !noSleeves && s.fit === 'oversized';
  const hood = t === 'hoodie';
  const shirt = t === 'shirt' || t === 'overshirt';
  const tailored = t === 'blazer' || t === 'coat';
  const jacket = t === 'denim_jacket' || t === 'bomber' || t === 'jacket' || t === 'puffer' || tailored;
  const collared = shirt || t === 'denim_jacket' || t === 'jacket' || t === 'polo';
  const hw = ({ slim: 37, regular: 41, relaxed: 46, oversized: 50 } as const)[s.fit ?? 'regular'] + (t === 'puffer' ? 5 : t === 'coat' ? 2 : 0);
  const hemY = (t === 'coat' ? 192 : t === 'blazer' ? 178 : t === 'denim_jacket' || t === 'bomber' ? 158 : t === 'puffer' || t === 'jacket' ? 166 : tee ? 166 : 176) + (s.fit === 'oversized' && t !== 'coat' ? 8 : 0);
  const nw = hood ? 19 : collared || tailored ? 14 : 16.5;
  const drop = s.fit === 'oversized' ? 8 : t === 'overshirt' || s.fit === 'relaxed' || t === 'puffer' ? 4 : 0; // a dropped shoulder
  // a tank's straps sit in from the shoulder, its armholes cut deep
  const S: [number, number] = t === 'tank' ? [nw + 9, 33] : [hw + 9 + drop, 45 + drop * 0.6];
  const A: [number, number] = t === 'tank' ? [hw, 88] : [hw, 82];
  const c = s.color;
  const edge = edgeFor(c, ctx.scheme);
  const patterned = !!s.pattern && s.pattern.type !== 'solid';
  const fill = patterned ? `url(#${id}p)` : c;
  const ribbed = !!s.details?.ribHem;
  const hemIn = ribbed ? 3 : 0;

  const bodyD = `M${cx - nw},31 Q${cx - nw - 10},34 ${cx - S[0]},${S[1]} L${cx - A[0]},${A[1]} Q${cx - hw - 1.5},${f((A[1] + hemY) / 2)} ${cx - hw + hemIn},${hemY} L${cx + hw - hemIn},${hemY} Q${cx + hw + 1.5},${f((A[1] + hemY) / 2)} ${cx + A[0]},${A[1]} L${cx + S[0]},${S[1]} Q${cx + nw + 10},34 ${cx + nw},31 Z`;
  interface Sleeve { d: string; cuff: string | null; co: number[]; ci: number[]; oPt: number[]; iPt: number[]; m: (x: number) => number }
  const sleeve = (side: number): Sleeve => {
    const m = (x: number) => cx + side * x;
    if (noSleeves) return { d: '', cuff: null, co: [], ci: [], oPt: [], iPt: [], m };
    if (shortSl && bigTee) {
      // an oversized tee's half sleeve (oversized-tee): it starts low on the arm, where the dropped shoulder seam lands, then
      // hangs wide and loose to about the elbow, ending in a level, hemmed opening instead of a short tee's slanted cut
      return { d: `M${m(S[0] - 1)},${S[1] - 1} Q${m(hw + 35)},64 ${m(hw + 45)},127 L${m(hw + 17)},140 Q${m(hw + 10)},110 ${m(A[0] - 0.5)},${A[1] + 4} Z`, cuff: null, co: [], ci: [], oPt: [], iPt: [], m };
    }
    if (shortSl) {
      return { d: `M${m(S[0] - 1)},${S[1] - 1} Q${m(hw + 24)},58 ${m(hw + 35)},79 Q${m(hw + 29)},88 ${m(hw + 21)},95 L${m(A[0] - 0.5)},${A[1] + 3} Z`, cuff: null, co: [], ci: [], oPt: [], iPt: [], m };
    }
    const wide = (s.fit === 'oversized' ? 7 : s.fit === 'relaxed' || t === 'overshirt' || t === 'puffer' || t === 'coat' ? 4 : 0) - (longTee ? 3 : 0);
    const co = [hw + 31 + wide, 164];
    const ci = [hw + 14 - wide * 0.5, 168];
    const d = `M${m(S[0] - 1)},${S[1] - 1} Q${m(hw + 27 + wide)},92 ${m(co[0]!)},${co[1]} L${m(ci[0]!)},${ci[1]} Q${m(hw + 9)},120 ${m(A[0] - 0.5)},${A[1] + 2} Z`;
    const oPt = [co[0]! - (co[0]! - (hw + 29 + wide)) * 0.1, co[1]! - (co[1]! - 92) * 0.09];
    const iPt = [ci[0]! + (A[0] - ci[0]!) * 0.08, ci[1]! - (ci[1]! - A[1]) * 0.1];
    const cuff = `M${m(oPt[0]!)},${f(oPt[1]!)} L${m(co[0]!)},${co[1]} L${m(ci[0]!)},${ci[1]} L${m(f(iPt[0]!))},${f(iPt[1]!)} Z`;
    return { d, cuff, co, ci, oPt, iPt, m };
  };
  const L = sleeve(-1);
  const R = sleeve(1);
  const sleeves = noSleeves ? [] : [L, R];

  let out = '';
  // ground shadow: an offset silhouette (no blur, so it maps 1:1 to react-native-svg)
  out += `<g transform="translate(1,2.5)" fill="#000" opacity="${ctx.scheme === 'dark' ? 0.2 : 0.07}">${sleeves.map((sl) => `<path d="${sl.d}"/>`).join('')}<path d="${bodyD}"/></g>`;
  out += halo(ctx, c, [...sleeves.map((sl) => sl.d), bodyD]);

  if (hood) {
    const hd = `M${cx - 30},50 C${cx - 38},22 ${cx - 24},6 ${cx},6 C${cx + 24},6 ${cx + 38},22 ${cx + 30},50 Z`;
    out += halo(ctx, c, [hd]);
    out += `<path d="${hd}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${hd}" fill="url(#${id}sx)"/>`;
  }
  // the inside of the back neck for collared and tailored pieces
  if (collared || tailored) {
    out += `<path d="M${cx - nw - 1},31 Q${cx},26.5 ${cx + nw + 1},31 L${cx + nw},35 Q${cx},31 ${cx - nw},35 Z" fill="${mix(c, -0.3)}" stroke="${edge}" stroke-width="1"/>`;
  }
  for (const sl of sleeves) out += `<path d="${sl.d}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${sl.d}" fill="url(#${id}ty)"/>`;
  for (const side of sleeves.length ? [-1, 1] : []) {
    const m = (x: number) => cx + side * x;
    if (shortSl && bigTee) {
      out += fold(ctx, `M${m(hw + 9)},84 Q${m(hw + 19)},102 ${m(hw + 23)},124`, 2.2, 0.8);
      // the sleeve hem's stitch line, just above its opening
      out += `<path d="M${m(hw + 43.4)},120 L${m(hw + 19.2)},131" ${stitch(s.stitch ?? mix(c, -0.3), 0.6)}/>`;
    }
    else if (shortSl) out += fold(ctx, `M${m(hw + 6)},70 Q${m(hw + 14)},74 ${m(hw + 20)},84`, 2, 0.8);
    else {
      out += `<path d="M${m(hw + 3)},90 Q${m(hw + 10)},126 ${m(hw + 15)},160" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="4" stroke-linecap="round"/>`;
      out += fold(ctx, `M${m(hw + 14)},118 Q${m(hw + 21)},116 ${m(hw + 27)},121`, 2.2);
      out += fold(ctx, `M${m(hw + 12)},128 Q${m(hw + 19)},127 ${m(hw + 25)},132`, 1.8, 0.8);
    }
  }
  // cuffs
  if (!shortSl) {
    for (const sl of sleeves) {
      if (longTee) {
        // the hem's stitch line, just above the sleeve's end
        out += `<path d="M${f(sl.m(sl.oPt[0]!))},${f(sl.oPt[1]!)} L${f(sl.m(sl.iPt[0]!))},${f(sl.iPt[1]!)}" ${stitch(s.stitch ?? mix(c, -0.3), 0.6)}/>`;
        continue;
      }
      const rib = !!s.details?.ribCuffs;
      out += `<path d="${sl.cuff}" fill="${rib ? mix(c, -0.05) : fill}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/><path d="${sl.cuff}" fill="#000" opacity="${rib ? 0.08 : 0.04}"/>`;
      if (rib) {
        for (let i = 1; i < 6; i++) {
          const k = i / 6;
          const ax = sl.oPt[0]! + (sl.iPt[0]! - sl.oPt[0]!) * k;
          const ay = sl.oPt[1]! + (sl.iPt[1]! - sl.oPt[1]!) * k;
          const bx = sl.co[0]! + (sl.ci[0]! - sl.co[0]!) * k;
          const by = sl.co[1]! + (sl.ci[1]! - sl.co[1]!) * k;
          out += `<path d="M${f(sl.m(ax))},${f(ay)} L${f(sl.m(bx))},${f(by)}" stroke="#000" stroke-opacity=".16" stroke-width=".6"/>`;
        }
      } else if (shirt) {
        const bx = (sl.co[0]! + sl.ci[0]!) / 2 + 0.5;
        const by = (sl.co[1]! + sl.ci[1]!) / 2 - 4;
        out += `<circle cx="${f(sl.m(bx))}" cy="${f(by)}" r="1.7" fill="${s.buttonColor ?? mix(c, -0.25)}" stroke="${edge}" stroke-width=".5"/>`;
      }
    }
  }
  // body
  out += `<path d="${bodyD}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${bodyD}" fill="url(#${id}sx)"/><path d="${bodyD}" fill="url(#${id}ty)"/>`;
  if (t === 'tank') {
    // armholes cut deep: draw them as the background-free inner edge
    for (const side of [-1, 1]) out += `<path d="M${cx + side * (nw + 8)},36 Q${cx + side * (nw + 9)},70 ${cx + side * (hw - 0.5)},86" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="3"/>`;
  }
  out += fold(ctx, `M${cx - hw + 3},86 Q${cx - hw + 7},100 ${cx - hw + 6},116`, 2.4, 0.9);
  out += fold(ctx, `M${cx + hw - 3},86 Q${cx + hw - 7},100 ${cx + hw - 6},116`, 2.4, 0.9);
  out += fold(ctx, `M${cx - 16},${hemY - 30} Q${cx - 12},${hemY - 16} ${cx - 14},${hemY - 4}`, 2, 0.6);
  out += fold(ctx, `M${cx + 20},${hemY - 34} Q${cx + 24},${hemY - 18} ${cx + 22},${hemY - 4}`, 2, 0.6);

  // puffer: quilted channels
  if (t === 'puffer') {
    for (let y = 62; y < hemY - 4; y += 17) {
      out += `<path d="M${cx - hw + 1},${y} Q${cx},${y + 2.5} ${cx + hw - 1},${y}" fill="none" stroke="${edge}" stroke-width=".9"/><path d="M${cx - hw + 1},${y - 6} Q${cx},${y - 3.5} ${cx + hw - 1},${y - 6}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="5"/>`;
    }
    for (const sl of sleeves) for (let k = 1; k < 5; k++) {
      const y = 82 + k * 18;
      out += `<path d="M${f(sl.m(hw + 4 + k * 0.6))},${y} L${f(sl.m(hw + 22 + k * 2.2))},${y - 3}" stroke="${edge}" stroke-width=".8"/>`;
    }
  }

  // ribbed hem band (hoodie, sweatshirt, bomber)
  if (ribbed) {
    const by = hemY - 12;
    const band = `M${cx - hw + 0.6},${by} L${cx + hw - 0.6},${by} L${cx + hw - hemIn},${hemY} L${cx - hw + hemIn},${hemY} Z`;
    out += `<path d="${band}" fill="${mix(c, -0.04)}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/><path d="${band}" fill="#000" opacity=".06"/>`;
    for (let x = cx - hw + 4; x < cx + hw - 2; x += 3) out += `<path d="M${f(x)},${by + 1} L${f(x + (x - cx) * 0.02)},${hemY - 1}" stroke="#000" stroke-opacity=".14" stroke-width=".55"/>`;
  }

  // crew neck rib with the inside of the back neck showing (ghost-mannequin depth)
  const crewNeck = !hood && !collared && !tailored && t !== 'cardigan' && s.neck !== 'turtle';
  if (crewNeck) {
    const depth = t === 'quarter_zip' ? 38 : 44;
    out += `<path d="M${cx - nw},31 Q${cx},23 ${cx + nw},31 Q${cx},${depth} ${cx - nw},31 Z" fill="${mix(c, lum(c) < 0.05 ? 0.12 : -0.32)}" stroke="${edge}" stroke-width="1"/>`;
    out += `<path d="M${cx - nw},31 Q${cx},${depth} ${cx + nw},31" fill="none" stroke="${mix(c, -0.04)}" stroke-width="4.2" stroke-linecap="round"/>`;
    out += `<path d="M${cx - nw},31 Q${cx},${depth} ${cx + nw},31" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="4.2" stroke-dasharray=".6 1.4"/>`;
    out += `<path d="M${cx - nw - 2.4},32.6 Q${cx},${depth + 4.6} ${cx + nw + 2.4},32.6" fill="none" stroke="${edge}" stroke-width=".9"/>`;
  }
  // henley: a short button placket below the crew neck
  if (crewNeck && s.neck === 'henley') {
    out += `<path d="M${cx - 4.5},37 L${cx + 4.5},37 L${cx + 4.5},66 L${cx - 4.5},66 Z" fill="${fill}" stroke="${edge}" stroke-width=".9"/>`;
    out += `<path d="M${cx + 4.5},38 V65" stroke="#000" stroke-opacity=".14" stroke-width="1.6" transform="translate(1,0)"/>`;
    for (const y of [44, 52, 60]) out += `<circle cx="${cx}" cy="${y}" r="1.8" fill="${s.buttonColor ?? mix(c, -0.25)}" stroke="${mix(c, -0.45)}" stroke-width=".5"/>`;
  }
  // turtleneck: a rolled collar standing up from the neck
  if (s.neck === 'turtle' && !hood && !collared && !tailored) {
    const tw = nw + 3;
    const roll = `M${cx - tw},34 L${cx - tw + 1},15 Q${cx},11 ${cx + tw - 1},15 L${cx + tw},34 Q${cx},39 ${cx - tw},34 Z`;
    out += halo(ctx, c, [roll]);
    out += `<path d="${roll}" fill="${mix(c, -0.04)}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/><path d="${roll}" fill="url(#${id}sx)"/>`;
    for (let x = cx - tw + 3; x < cx + tw - 1; x += 3) out += `<path d="M${f(x)},${f(16 + Math.abs(x - cx) * 0.02)} L${f(x)},${f(34 + (1 - Math.abs(x - cx) / tw) * 3)}" stroke="#000" stroke-opacity=".13" stroke-width=".55"/>`;
    out += `<path d="M${cx - tw + 1},15 Q${cx},19 ${cx + tw - 1},15" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="2"/>`;
  }
  if (t === 'quarter_zip' || t === 'bomber' || (t === 'hoodie' && s.details?.fullZip) || t === 'jacket' || t === 'puffer') {
    const y1 = t === 'quarter_zip' ? 84 : hemY - (ribbed ? 12 : 1);
    out += zip(cx, t === 'hoodie' ? 58 : 34, y1, c);
  }
  // cardigan: a V neck with a button band
  if (t === 'cardigan') {
    out += `<path d="M${cx - nw},31 L${cx},86 L${cx + nw},31 Q${cx},26 ${cx - nw},31 Z" fill="${mix(c, lum(c) < 0.05 ? 0.12 : -0.32)}" stroke="${edge}" stroke-width="1"/>`;
    out += `<path d="M${cx - nw},31 L${cx},86 L${cx},${hemY - 12} M${cx + nw},31 L${cx},86" fill="none" stroke="${mix(c, -0.06)}" stroke-width="4.5"/>`;
    for (let i = 0; i < 5; i++) out += `<circle cx="${cx}" cy="${f(94 + i * ((hemY - 112) / 4))}" r="2" fill="${s.buttonColor ?? mix(c, -0.3)}"/>`;
  }

  // hood opening (lining), crossover rims and drawstrings
  if (hood) {
    const lining = mix(c, lum(c) < 0.05 ? 0.1 : -0.35);
    out += `<path d="M${cx - 21},44 C${cx - 23},24 ${cx - 12},14 ${cx},14 C${cx + 12},14 ${cx + 23},24 ${cx + 21},44 L${cx + 3},60 L${cx - 3},60 Z" fill="${lining}"/>`;
    out += `<path d="M${cx - 21},44 C${cx - 23},24 ${cx - 12},14 ${cx},14 C${cx + 12},14 ${cx + 23},24 ${cx + 21},44" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="5"/>`;
    out += `<path d="M${cx + 21},40 C${cx + 23},26 ${cx + 13},15 ${cx},14 M${cx + 21},40 L${cx - 2},62" fill="none" stroke="${c}" stroke-width="6.5" stroke-linecap="round"/>`;
    out += `<path d="M${cx + 24},42 L${cx - 1},65" fill="none" stroke="${edge}" stroke-width="1"/>`;
    out += `<path d="M${cx - 21},40 C${cx - 23},26 ${cx - 13},15 ${cx},14 M${cx - 21},40 L${cx + 3},62" fill="none" stroke="${c}" stroke-width="6.5" stroke-linecap="round"/>`;
    out += `<path d="M${cx - 24.5},41 L${cx + 2},66 M${cx - 17.5},40 C${cx - 19},27 ${cx - 11},18 ${cx},17.5 C${cx + 11},18 ${cx + 19},27 ${cx + 17.5},40" fill="none" stroke="${edge}" stroke-width="1"/>`;
    out += `<path d="M${cx - 24.5},41 C${cx - 26.5},24 ${cx - 14},10.5 ${cx},10.5 C${cx + 14},10.5 ${cx + 26.5},24 ${cx + 24.5},41" fill="none" stroke="${edge}" stroke-width="1"/>`;
    out += `<path d="M${cx - 24.5},41 L${cx + 2},66" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2.5" transform="translate(0,2)"/>`;
    if (s.details?.drawstrings) {
      const dc = s.drawstringColor ?? mix(c, lum(c) < 0.2 ? 0.55 : 0.45);
      for (const [x0, x1, x2] of [[-8, -10, -9], [8, 11, 10]] as const) {
        out += `<circle cx="${cx + x0}" cy="52" r="1.6" fill="${mix(c, -0.35)}" stroke="${edge}" stroke-width=".5"/>`;
        out += `<path d="M${cx + x0},52 Q${cx + x1},72 ${cx + x2},92" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2.6" stroke-linecap="round" transform="translate(.8,.8)"/>`;
        out += `<path d="M${cx + x0},52 Q${cx + x1},72 ${cx + x2},92" fill="none" stroke="${dc}" stroke-width="2" stroke-linecap="round"/>`;
        out += `<rect x="${cx + x2 - 1.2}" y="91" width="2.4" height="5.5" rx="1" fill="${mix(dc, -0.25)}"/>`;
      }
    }
  }

  // blazer / coat: an open V over a shirt, lapels, two buttons, hip pockets
  if (tailored) {
    const vy = t === 'coat' ? 96 : 104;
    out += `<path d="M${cx - nw + 1},33 L${cx},${vy} L${cx + nw - 1},33 Z" fill="${ctx.scheme === 'dark' ? '#D9DCE2' : '#F4F3EF'}" stroke="${edge}" stroke-width=".8"/>`;
    out += `<path d="M${cx - 5},33 L${cx},44 L${cx + 5},33" fill="none" stroke="#B9BCC2" stroke-width=".9"/>`;
    for (const side of [-1, 1]) {
      const lapel = `M${cx + side * (nw + 1)},30 L${cx + side * (nw + 13)},50 L${cx + side * (nw + 6)},56 L${cx + side * 1},${vy} L${cx + side * (nw - 1)},34 Z`;
      out += `<path d="${lapel}" fill="#000" opacity=".16" transform="translate(${side * 0.8},1.8)"/><path d="${lapel}" fill="${fill}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/><path d="${lapel}" fill="#fff" opacity=".06"/>`;
    }
    out += `<path d="M${cx},${vy} V${hemY - 1}" stroke="${edge}" stroke-width=".9"/>`;
    for (const y of t === 'coat' ? [vy + 10, vy + 34, vy + 58] : [vy + 10, vy + 28]) out += `<circle cx="${cx + 3}" cy="${y}" r="2.4" fill="${s.buttonColor ?? mix(c, -0.32)}" stroke="${mix(c, -0.5)}" stroke-width=".5"/>`;
    for (const side of [-1, 1]) {
      const px = side < 0 ? cx - hw + 6 : cx + 12;
      const py = t === 'coat' ? 140 : 132;
      out += `<path d="M${px},${py} H${px + hw - 18}" stroke="${edge}" stroke-width="1"/><path d="M${px},${py} H${px + hw - 18} V${py + 5} H${px} Z" fill="#000" opacity=".06"/>`;
    }
  }

  // shirt / polo / jacket collar, placket and buttons
  if (collared) {
    const big = jacket ? 2 : 0;
    const polo = t === 'polo';
    const leafL = `M${cx - nw - 1},30 Q${cx - nw - 9 - big},38 ${cx - nw - 9 - big},${47 + big} L${cx - 9},${59 + big} L${cx - 1},45 Q${cx - 6},35 ${cx - nw - 1},30 Z`;
    const leafR = `M${cx + nw + 1},30 Q${cx + nw + 9 + big},38 ${cx + nw + 9 + big},${47 + big} L${cx + 9},${59 + big} L${cx + 1},45 Q${cx + 6},35 ${cx + nw + 1},30 Z`;
    const zipped = t === 'jacket';
    const pkEnd = polo ? 78 : hemY - (t === 'denim_jacket' ? 12 : 0);
    if (!zipped) {
      out += `<path d="M${cx - 5.5},44 L${cx + 5.5},44 L${cx + 5.5},${pkEnd} L${cx - 5.5},${pkEnd} Z" fill="${fill}" stroke="${edge}" stroke-width=".9"/>`;
      out += `<path d="M${cx - 3.8},46 V${pkEnd - 1} M${cx + 3.8},46 V${pkEnd - 1}" ${stitch(s.stitch ?? mix(c, -0.28), 0.6)}/>`;
      out += `<path d="M${cx + 5.5},46 V${pkEnd - 1}" stroke="#000" stroke-opacity=".14" stroke-width="2" transform="translate(1.2,0)"/>`;
    }
    for (const leaf of [leafL, leafR]) {
      out += `<path d="${leaf}" fill="#000" opacity=".16" transform="translate(.8,1.8)"/><path d="${leaf}" fill="${fill}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/><path d="${leaf}" fill="#fff" opacity=".06"/>`;
    }
    if (t === 'denim_jacket') {
      out += `<path d="M${cx - nw - 6 - big},${45 + big} L${cx - 9},${55.5 + big} M${cx + nw + 6 + big},${45 + big} L${cx + 9},${55.5 + big}" ${stitch(s.stitch ?? mix(c, -0.3), 0.6)}/>`;
    }
    if (!zipped) {
      const n = polo ? 2 : jacket ? 4 : 6;
      const y0 = polo ? 54 : jacket ? 66 : 54;
      const y1 = polo ? 70 : hemY - (jacket ? 22 : 14);
      for (let i = 0; i < n; i++) {
        const y = f(y0 + ((y1 - y0) * i) / Math.max(1, n - 1));
        const bc = s.buttonColor ?? mix(c, -0.22);
        out += `<circle cx="${cx}" cy="${y}" r="${jacket ? 2.6 : 2}" fill="${bc}" stroke="${mix(bc, -0.35)}" stroke-width=".5"/>`;
        out += jacket ? `<circle cx="${cx - 0.6}" cy="${y - 0.6}" r=".8" fill="#fff" opacity=".35"/>` : `<circle cx="${cx - 0.6}" cy="${y}" r=".35" fill="${mix(bc, -0.5)}"/><circle cx="${cx + 0.6}" cy="${y}" r=".35" fill="${mix(bc, -0.5)}"/>`;
      }
    }
  }

  // chest pockets, with flaps on overshirts and jackets
  const pockets = s.details?.chestPockets ?? 0;
  if (pockets) {
    for (const side of pockets === 2 ? [-1, 1] : [1]) {
      const pw = jacket ? 22 : 21;
      const ph = jacket ? 24 : 23;
      const y = jacket ? 66 : 70;
      const px = side < 0 ? cx - pw - 10 : cx + 10;
      const pocket = jacket ? `M${px},${y} L${px + pw},${y} L${px + pw},${y + ph - 3} L${px + pw / 2},${y + ph} L${px},${y + ph - 3} Z` : `M${px},${y} H${px + pw} V${y + ph} H${px} Z`;
      out += `<path d="${pocket}" fill="${fill}" stroke="${edge}" stroke-width=".9"/>`;
      out += `<path d="M${px + 1.6},${y + 2} V${y + ph - 1.6} H${px + pw - 1.6} V${y + 2}" ${stitch(s.stitch ?? mix(c, -0.28), 0.55)}/>`;
      if (s.details?.flaps) {
        const flap = jacket ? `M${px - 1},${y - 1} H${px + pw + 1} V${y + 6} L${px + pw / 2},${y + 11} L${px - 1},${y + 6} Z` : `M${px - 1},${y - 1} H${px + pw + 1} V${y + 7} H${px - 1} Z`;
        const bc = s.buttonColor ?? mix(c, -0.22);
        out += `<path d="${flap}" fill="#000" opacity=".16" transform="translate(0,1.6)"/><path d="${flap}" fill="${fill}" stroke="${edge}" stroke-width=".9" stroke-linejoin="round"/><path d="${flap}" fill="#fff" opacity=".07"/>`;
        out += `<circle cx="${px + pw / 2}" cy="${y + (jacket ? 6.5 : 4)}" r="${jacket ? 2.2 : 1.6}" fill="${bc}" stroke="${mix(bc, -0.35)}" stroke-width=".45"/>`;
      }
    }
  }
  // denim jacket: pleat seams, yoke, waistband and its buttons
  if (t === 'denim_jacket') {
    const st = s.stitch ?? '#C8925A';
    const bc = s.buttonColor ?? '#B87A45';
    for (const side of [-1, 1]) {
      const a = cx + side * 21;
      const b = cx + side * (hw - 9);
      out += `<path d="M${a},66 V${hemY - 12} M${b},66 V${hemY - 12}" stroke="${edge}" stroke-width=".8"/><path d="M${a + 1.6},66 V${hemY - 12} M${b + 1.6},66 V${hemY - 12}" ${stitch(st, 0.6)}/>`;
      out += `<path d="M${cx + side * (hw + 0.5)},60 Q${cx + side * 22},54 ${cx + side * 6},50" stroke="${edge}" stroke-width=".8" fill="none"/><path d="M${cx + side * (hw - 1)},62 Q${cx + side * 22},56.5 ${cx + side * 6},52.5" ${stitch(st, 0.6)}/>`;
    }
    const by = hemY - 12;
    out += `<path d="M${cx - hw + 0.5},${by} H${cx + hw - 0.5} V${hemY} H${cx - hw + 0.5} Z" fill="${fill}" stroke="${edge}" stroke-width="1"/>`;
    out += `<path d="M${cx - hw + 2},${by + 2} H${cx + hw - 2} M${cx - hw + 2},${hemY - 2} H${cx + hw - 2}" ${stitch(st, 0.6)}/>`;
    for (const side of [-1, 1]) out += `<circle cx="${cx + side * (hw - 8)}" cy="${by + 6}" r="2.4" fill="${bc}" stroke="${mix(bc, -0.35)}" stroke-width=".5"/>`;
  }
  // kangaroo pouch (split by a full zip)
  if (s.details?.pouch) {
    const py = hemY - 54;
    const pb = hemY - (ribbed ? 12 : 4);
    const pouch = `M${cx - 27},${py} L${cx + 27},${py} Q${cx + 30},${py + 16} ${cx + 39},${py + 28} L${cx + 39},${pb} L${cx - 39},${pb} L${cx - 39},${py + 28} Q${cx - 30},${py + 16} ${cx - 27},${py} Z`;
    out += `<path d="${pouch}" fill="#000" opacity=".1" transform="translate(0,1.4)"/><path d="${pouch}" fill="${fill}" stroke="${edge}" stroke-width="1"/><path d="${pouch}" fill="url(#${id}ty)" opacity=".6"/>`;
    out += `<path d="M${cx - 27},${py} Q${cx - 30},${py + 16} ${cx - 39},${py + 28} M${cx + 27},${py} Q${cx + 30},${py + 16} ${cx + 39},${py + 28}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="2.4" transform="translate(0,.6)"/>`;
    out += `<path d="M${cx - 25},${py + 2.2} H${cx + 25} M${cx - 24.5},${py + 4} Q${cx - 27.5},${py + 17} ${cx - 36},${py + 28} M${cx + 24.5},${py + 4} Q${cx + 27.5},${py + 17} ${cx + 36},${py + 28}" ${stitch(mix(c, -0.3), 0.55)}/>`;
    if (s.details.fullZip) out += zip(cx, py - 2, pb, c);
  }
  if (s.print && (jacket || collared || t === 'cardigan' || t === 'quarter_zip' || s.details?.fullZip)) {
    // a zip, placket, collar or pockets run down the middle: the mark sits low on the wearer's right side instead (T120)
    // inside the body edge for every fit; a denim jacket's is smaller, between its left pleat seam and the placket
    out += t === 'denim_jacket' ? printMark(cx - 19, 96, 12, 10.5, c) : printMark(cx - hw + 5, hood ? 84 : 96, 22, 19, c);
  } else if (s.print) {
    const pc = contrastLine(c);
    out += `<rect x="${cx - 19}" y="${hood ? 98 : 66}" width="38" height="34" rx="5" fill="${pc}" opacity=".5"/><path d="M${cx - 12},${hood ? 120 : 88} L${cx - 3},${hood ? 108 : 76} L${cx + 4},${hood ? 116 : 84} L${cx + 8},${hood ? 112 : 80} L${cx + 13},${hood ? 120 : 88} Z" fill="${pc}" opacity=".7"/>`;
  }
  if (s.brand) {
    const left = pockets === 2 || tailored || collared;
    out += left ? '' : brandText(cx + 22, hood ? 76 : 70, 6.2, s.brand, c);
  }
  return out;
}

// ======================================================================== BOTTOMS
function bottom(s: BottomFlat, ctx: Ctx): string {
  const { id } = ctx;
  const cx = 100;
  const t = s.type;
  const shorts = t === 'shorts';
  const jog = t === 'joggers';
  const fit = s.fit ?? 'straight';
  const legHalf = ({ skinny: 10.5, slim: 12.5, straight: 15.5, relaxed: 18, wide: 21.5 } as const)[fit] + (shorts ? 3 : 0);
  const g = ({ skinny: 6, slim: 5, straight: 4, relaxed: 3, wide: 1.5 } as const)[fit];
  const wH = 33;
  const hipH = 37.5;
  const top0 = 12;
  const hipY = 54;
  const crotchY = 74;
  const hemY = shorts ? 120 : 192;
  const oL = cx - g - legHalf * 2;
  const iL = cx - g;
  const iR = cx + g;
  const oR = cx + g + legHalf * 2;
  const c = s.color;
  const edge = edgeFor(c, ctx.scheme);
  const patterned = !!s.pattern && s.pattern.type !== 'solid';
  const fill = patterned ? `url(#${id}p)` : c;
  const jeans = t === 'jeans';
  const st = s.stitch ?? (jeans ? '#C8925A' : mix(c, -0.25));
  const breakAmt = jog || shorts ? 0 : s.hem === 'full_break' ? 2 : s.hem === 'slight_break' ? 1 : 0;
  const bow = fit === 'wide' ? 4 : fit === 'relaxed' ? 2.5 : 1;
  // joggers taper into a cuff; a skinny leg narrows toward the hem
  const taper = jog ? legHalf * 0.45 : fit === 'skinny' && !shorts ? legHalf * 0.3 : 0;
  const oLh = oL + taper;
  const oRh = oR - taper;
  const hemWave = (a: number, b: number) => (breakAmt ? `Q${f((a + b) / 2)},${hemY + 2 + breakAmt} ${b},${hemY}` : `L${b},${hemY}`);
  const d = `M${cx - wH},${top0} L${cx + wH},${top0} L${cx + hipH},${hipY} Q${f((cx + hipH + oRh) / 2 + bow)},${f((hipY + hemY) / 2)} ${oRh},${hemY} ${hemWave(oRh, iR)} L${cx},${crotchY} L${iL},${hemY} ${hemWave(iL, oLh)} Q${f((cx - hipH + oLh) / 2 - bow)},${f((hipY + hemY) / 2)} ${cx - hipH},${hipY} Z`;
  let out = '';
  out += `<path d="${d}" fill="#000" opacity="${ctx.scheme === 'dark' ? 0.2 : 0.07}" transform="translate(1,2.5)"/>`;
  out += halo(ctx, c, [d]);
  out += `<path d="${d}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${d}" fill="url(#${id}sx)"/><path d="${d}" fill="url(#${id}ty)"/>`;
  out += `<path d="M${cx},${crotchY} L${iL},${hemY} M${cx},${crotchY} L${iR},${hemY}" stroke="#000" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>`;
  // denim wash: lighter thighs and knees, whiskers
  if (jeans && s.wash !== 'rinse') {
    const wo = s.wash === 'faded' ? 0.2 : 0.11;
    for (const side of [-1, 1]) {
      const x = cx + side * (g + legHalf);
      out += `<ellipse cx="${f(x - side)}" cy="${f(hipY + 24)}" rx="${f(legHalf * 0.75)}" ry="30" fill="url(#${id}wg)" opacity="${f(wo * 5)}"/>`;
      if (!shorts) out += `<ellipse cx="${f(x)}" cy="${f(hipY + 66)}" rx="${f(legHalf * 0.6)}" ry="16" fill="url(#${id}wg)" opacity="${f(wo * 3)}"/>`;
      for (let k = 0; k < 3; k++) out += `<path d="M${f(cx + side * (g + 3))},${crotchY - 6 + k * 4} q${side * 8},-1 ${side * 14},2" fill="none" stroke="#fff" stroke-opacity="${op(wo * 0.9)}" stroke-width="1.1" stroke-linecap="round"/>`;
    }
  }
  if (s.ripped && !shorts) {
    for (const side of [-1, 1]) {
      const x = cx + side * (g + legHalf);
      out += `<path d="M${f(x - 6)},${hipY + 62} H${f(x + 6)} M${f(x - 4.5)},${hipY + 66} H${f(x + 5)} M${f(x - 5)},${hipY + 70} H${f(x + 4)}" stroke="#F2F0EA" stroke-width="1.4" stroke-linecap="round" opacity=".9"/>`;
    }
  }
  // pressed crease on chinos and trousers
  if (t === 'chinos' || t === 'trousers') {
    for (const side of [-1, 1]) {
      const x0 = cx + side * (hipH * 0.5);
      const x1 = cx + side * (g + legHalf);
      const [hi, lo] = t === 'trousers' ? ['.29', '.14'] : ['.16', '.08']; // trousers are pressed sharper
      out += `<path d="M${f(x0)},${hipY - 6} L${f(x1)},${hemY - 2}" stroke="#fff" stroke-opacity="${hi}" stroke-width="1.6"/><path d="M${f(x0 + 1.2)},${hipY - 6} L${f(x1 + 1.2)},${hemY - 2}" stroke="#000" stroke-opacity="${lo}" stroke-width="1.2"/>`;
    }
  }
  // drape: wide legs swing, slim legs bunch at the knee, a break stacks at the hem
  for (const side of [-1, 1]) {
    const x = cx + side * (g + legHalf);
    if (shorts) out += fold(ctx, `M${f(x - side * 6)},${hipY + 26} q${side * 6},-2 ${side * 11},1`, 1.6, 0.6);
    else if (fit === 'wide' || fit === 'relaxed' || jog) {
      out += fold(ctx, `M${f(x + side * 4)},${hipY + 34} Q${f(x + side * 7)},${hipY + 80} ${f(x + side * (legHalf * 0.7))},${hemY - 6}`, 2.4, 0.8);
      out += fold(ctx, `M${f(x - side * 6)},${hipY + 50} Q${f(x - side * 8)},${hipY + 96} ${f(x - side * 10)},${hemY - 4}`, 2, 0.6);
    } else {
      out += fold(ctx, `M${f(x - side * 7)},${hipY + 62} q${side * 7},-3 ${side * 13},1`, 1.8, 0.8);
      out += fold(ctx, `M${f(x - side * 6)},${hipY + 70} q${side * 6},-2 ${side * 11},1`, 1.6, 0.6);
    }
    for (let k = 0; k < breakAmt; k++) out += fold(ctx, `M${f(x - side * (legHalf - 2))},${hemY - 8 - k * 7} q${side * legHalf * 0.9},3 ${side * (legHalf * 1.8)},-1`, 2.2, 1);
  }
  // athletic side stripe
  if (s.sideStripe) {
    out += `<path d="M${cx - hipH + 1.5},${hipY - 30} Q${f((cx - hipH + oLh) / 2 - bow + 1.5)},${f((hipY + hemY) / 2)} ${oLh + 2},${hemY - 1} M${cx + hipH - 1.5},${hipY - 30} Q${f((cx + hipH + oRh) / 2 + bow - 1.5)},${f((hipY + hemY) / 2)} ${oRh - 2},${hemY - 1}" fill="none" stroke="${contrastLine(c)}" stroke-width="3"/>`;
  }
  // waistband: elastic with a drawstring on joggers, belt loops and a button otherwise
  const wb = `M${cx - wH},${top0} L${cx + wH},${top0} L${cx + wH + 1.1},${top0 + 10} L${cx - wH - 1.1},${top0 + 10} Z`;
  out += `<path d="${wb}" fill="${fill}" stroke="${edge}" stroke-width="1.1"/><path d="${wb}" fill="#000" opacity=".05"/>`;
  if (jog) {
    for (let x = cx - wH + 3; x < cx + wH - 1; x += 3) out += `<path d="M${x},${top0 + 1} V${top0 + 9}" stroke="#000" stroke-opacity=".12" stroke-width=".6"/>`;
    const dc = mix(c, lum(c) < 0.2 ? 0.55 : 0.45);
    out += `<path d="M${cx - 3},${top0 + 6} Q${cx - 6},${top0 + 18} ${cx - 4},${top0 + 26} M${cx + 3},${top0 + 6} Q${cx + 6},${top0 + 18} ${cx + 5},${top0 + 26}" fill="none" stroke="${dc}" stroke-width="1.8" stroke-linecap="round"/>`;
    // ankle cuffs
    for (const [a, b] of [[oLh, iL], [iR, oRh]] as const) {
      out += `<path d="M${a + 0.5},${hemY - 10} H${b - 0.5} V${hemY} H${a + 0.5} Z" fill="${mix(c, -0.05)}" stroke="${edge}" stroke-width="1"/>`;
      for (let x = a + 3; x < b - 1; x += 2.6) out += `<path d="M${f(x)},${hemY - 9} V${hemY - 1}" stroke="#000" stroke-opacity=".14" stroke-width=".55"/>`;
    }
  } else {
    out += `<path d="M${cx - wH + 1},${top0 + 2} H${cx + wH - 1} M${cx - wH},${top0 + 8} H${cx + wH}" ${stitch(st, 0.6)}/>`;
    for (const x of [cx - 29, cx - 13, cx + 13, cx + 29]) {
      out += `<rect x="${x - 1.8}" y="${top0 - 1.5}" width="3.6" height="13" rx=".8" fill="${fill}" stroke="${edge}" stroke-width=".8"/><rect x="${x - 1.8}" y="${top0 - 1.5}" width="3.6" height="13" rx=".8" fill="#000" opacity=".07"/>`;
    }
    const btn = s.buttonColor ?? (jeans ? '#A9A196' : mix(c, -0.2));
    out += `<circle cx="${cx}" cy="${top0 + 5}" r="2.6" fill="${btn}" stroke="${mix(btn, -0.4)}" stroke-width=".6"/><circle cx="${cx - 0.7}" cy="${top0 + 4.3}" r=".9" fill="#fff" opacity=".45"/>`;
    out += `<path d="M${cx},${top0 + 10} V${crotchY - 10}" stroke="${edge}" stroke-width=".9"/>`;
    out += `<path d="M${cx + 7},${top0 + 11} V${crotchY - 18} Q${cx + 7},${crotchY - 11} ${cx + 1},${crotchY - 9}" ${stitch(st, 0.65)}/>`;
    if (jeans) {
      for (const [x, y] of [[cx - 20, top0 + 11], [cx + 20, top0 + 11], [cx - hipH + 1.5, top0 + 34], [cx + hipH - 1.5, top0 + 34]] as const) out += `<circle cx="${x}" cy="${y}" r="1.1" fill="${btn}"/>`;
    }
  }
  // pockets
  for (const side of [-1, 1]) {
    if (jeans) {
      out += `<path d="M${cx + side * 20},${top0 + 10} Q${cx + side * 23},${top0 + 30} ${cx + side * (hipH - 1)},${top0 + 34}" fill="none" stroke="${edge}" stroke-width="1"/>`;
      out += `<path d="M${cx + side * 20},${top0 + 10} Q${cx + side * 23},${top0 + 30} ${cx + side * (hipH - 1)},${top0 + 34}" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="2.4" transform="translate(${side * 1.2},1)"/>`;
      out += `<path d="M${cx + side * 17.5},${top0 + 10} Q${cx + side * 20.5},${top0 + 32.5} ${cx + side * (hipH - 1.2)},${top0 + 37}" ${stitch(st, 0.6)}/>`;
    } else {
      out += `<path d="M${cx + side * 22},${top0 + 10} L${cx + side * (hipH - 1)},${top0 + 40}" stroke="${edge}" stroke-width="1"/>`;
      out += `<path d="M${cx + side * 22},${top0 + 10} L${cx + side * (hipH - 1)},${top0 + 40}" stroke="#000" stroke-opacity=".15" stroke-width="2.2" transform="translate(${side * 1.2},.6)"/>`;
    }
  }
  if (jeans) {
    out += `<path d="M${cx - 30},${top0 + 10} L${cx - 30},${top0 + 22} L${cx - 20},${top0 + 23} L${cx - 20},${top0 + 10}" fill="none" stroke="${edge}" stroke-width=".8"/>`;
    out += `<path d="M${cx - 28.5},${top0 + 12} L${cx - 28.5},${top0 + 20.5} L${cx - 21.5},${top0 + 21}" ${stitch(st, 0.55)}/>`;
    out += `<path d="M${cx - hipH + 2},${hipY} Q${f((cx - hipH + oL) / 2 - bow + 2)},${f((hipY + hemY) / 2)} ${oL + 2},${hemY - 1} M${cx + hipH - 2},${hipY} Q${f((cx + hipH + oR) / 2 + bow - 2)},${f((hipY + hemY) / 2)} ${oR - 2},${hemY - 1}" ${stitch(st, 0.6)}/>`;
  }
  // cargo pockets on the thighs
  if (t === 'cargos') {
    for (const side of [-1, 1]) {
      const x = side < 0 ? oL + 3 : oR - 3 - 22;
      const y = hipY + 34;
      out += `<path d="M${x},${y} H${x + 22} V${y + 30} H${x} Z" fill="#000" opacity=".12" transform="translate(.8,1.4)"/><path d="M${x},${y} H${x + 22} V${y + 30} H${x} Z" fill="${fill}" stroke="${edge}" stroke-width=".9"/>`;
      out += `<path d="M${x - 1},${y - 2} H${x + 23} V${y + 7} H${x - 1} Z" fill="${fill}" stroke="${edge}" stroke-width=".9"/><path d="M${x + 1.5},${y + 9} V${y + 28} H${x + 20.5} V${y + 9}" ${stitch(st, 0.55)}/>`;
    }
  }
  // a printed graphic on the wearer's right thigh (T120), below the cargo pocket on cargos
  if (s.print) {
    const w = Math.min(24, legHalf * 2 - 6);
    const h = w * 0.9;
    const cy = shorts ? hipY + 28 : t === 'cargos' ? hipY + 82 : hipY + 46;
    out += printMark(cx - g - legHalf - w / 2, cy - h / 2, w, h, c);
  }
  // hem: a turned-up cuff, or stitching
  if (s.hem === 'cuffed' && !jog) {
    for (const [a, b] of [[oL, iL], [iR, oR]] as const) out += `<path d="M${a + 0.4},${hemY - 9} H${b - 0.4} V${hemY} H${a + 0.4} Z" fill="${jeans ? mix(c, 0.18) : mix(c, -0.06)}" stroke="${edge}" stroke-width="1"/>`;
  } else if (!jog) {
    out += `<path d="M${oL + 1},${hemY - 3} L${iL - 1},${hemY - 3} M${iR + 1},${hemY - 3} L${oR - 1},${hemY - 3}" ${stitch(st, 0.6)}/>`;
  }
  return out;
}

// ======================================================================== SHOES (side profile, toe to the right)
function shoe(s: ShoeFlat, ctx: Ctx): string {
  const { id } = ctx;
  const t = s.type;
  const c = s.color;
  const edge = edgeFor(c, ctx.scheme);
  const patterned = !!s.pattern && s.pattern.type !== 'solid';
  const fill = patterned ? `url(#${id}p)` : c;
  const boot = t === 'work_boot' || t === 'chukka' || t === 'chelsea';
  const low = t === 'loafer' || t === 'derby';
  const sneaker = t === 'sneaker' || t === 'runner';
  const sole = s.sole ?? (sneaker ? '#F4F3EF' : t === 'slides' ? mix(c, -0.15) : t === 'work_boot' ? '#A59C92' : '#3A2C24');
  const soleEdge = mix(sole, -0.28);
  const sh = s.chunky ? 22 : t === 'work_boot' ? 15 : low ? 6 : t === 'slides' ? 14 : boot ? 10 : 12;
  const gy = 160;
  const ty = gy - sh;
  let out = `<ellipse cx="102" cy="${gy + 1}" rx="88" ry="7" fill="url(#${id}gs)"/>`;
  const lace = s.laceColor ?? (sneaker ? '#FAFAF7' : '#5A4636');
  const outsole = `M24,${ty + 1} L186,${ty + 1} Q190,${ty + 1} 190,${ty + 6} L190,${gy - 2} Q190,${gy} 187,${gy} L25,${gy} Q21,${gy} 21,${gy - 3} L21,${ty + 4} Q21,${ty + 1} 24,${ty + 1} Z`;
  if (!sneaker) out += halo(ctx, sole, [outsole]);

  if (sneaker) {
    const upper = `M28,${ty + 1} C24,${ty - 22} 24,${ty - 38} 30,${ty - 48} C34,${ty - 53} 43,${ty - 53} 49,${ty - 49} C60,${ty - 43} 70,${ty - 40} 80,${ty - 40} C97,${ty - 38} 113,${ty - 34} 129,${ty - 29} C152,${ty - 24} 172,${ty - 22} 181,${ty - 13} C186,${ty - 7} 185,${ty} 181,${ty + 1} Z`;
    const tongue = `M77,${ty - 38} C77,${ty - 50} 82,${ty - 57} 92,${ty - 57} C97,${ty - 57} 99,${ty - 53} 99,${ty - 49} L102,${ty - 34} Z`;
    const cup0 = `M22,${ty - 1} L184,${ty - 1} Q189,${ty - 1} 189,${ty + 5} L189,${gy - 4} Q189,${gy} 184,${gy} L27,${gy} Q20,${gy} 20,${gy - 5} L20,${ty + 3} Q20,${ty - 1} 22,${ty - 1} Z`;
    out += halo(ctx, sole, [cup0]) + halo(ctx, c, [tongue, upper]);
    out += `<path d="${tongue}" fill="${fill}" stroke="${edge}" stroke-width="1.1"/><path d="${tongue}" fill="#000" opacity=".08"/>`;
    out += `<path d="${upper}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${upper}" fill="url(#${id}ty)"/>`;
    out += `<path d="M30,${ty - 48} C34,${ty - 53} 43,${ty - 53} 49,${ty - 49} C60,${ty - 43} 70,${ty - 40} 80,${ty - 40}" fill="none" stroke="${mix(c, -0.3)}" stroke-width="2.6" stroke-linecap="round"/>`;
    const stay = `M80,${ty - 40} C97,${ty - 38} 113,${ty - 33} 129,${ty - 27} L125,${ty - 18} C110,${ty - 23} 96,${ty - 28} 84,${ty - 30} Z`;
    out += `<path d="${stay}" fill="${mix(c, lum(c) > 0.7 ? -0.04 : 0.06)}" stroke="${edge}" stroke-width=".9"/><path d="M83,${ty - 32} C96,${ty - 30} 110,${ty - 25} 124,${ty - 20}" ${stitch(mix(c, -0.3), 0.55)}/>`;
    for (let i = 0; i < 5; i++) {
      const x = 86 + i * 9;
      const y = ty - 38.5 + i * 2.7;
      out += `<path d="M${x},${y} l7,-4.5" stroke="#000" stroke-opacity=".2" stroke-width="2.6" stroke-linecap="round" transform="translate(.5,1)"/><path d="M${x},${y} l7,-4.5" stroke="${lace}" stroke-width="2.1" stroke-linecap="round"/><circle cx="${x}" cy="${y + 0.6}" r="1.2" fill="${mix(c, -0.45)}"/>`;
    }
    out += `<path d="M146,${ty - 25} C141,${ty - 16} 142,${ty - 6} 146,${ty + 1}" fill="none" stroke="${edge}" stroke-width=".9"/><path d="M143.5,${ty - 24} C138.5,${ty - 15} 139.5,${ty - 6} 143.5,${ty + 1}" ${stitch(mix(c, -0.3), 0.55)}/>`;
    out += `<path d="M58,${ty + 1} C60,${ty - 14} 68,${ty - 26} 84,${ty - 28}" fill="none" stroke="${edge}" stroke-width=".9"/><path d="M55.5,${ty + 1} C57.5,${ty - 15} 66,${ty - 28} 83,${ty - 31}" ${stitch(mix(c, -0.3), 0.55)}/>`;
    if (t === 'runner') out += `<path d="M62,${ty - 6} C80,${ty - 26} 104,${ty - 30} 128,${ty - 22}" fill="none" stroke="${contrastLine(c)}" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
    out += `<path d="M27,${ty - 30} C26,${ty - 40} 28,${ty - 47} 31,${ty - 50} L41,${ty - 51} C38,${ty - 44} 37,${ty - 36} 38,${ty - 28} Z" fill="${mix(c, -0.08)}" stroke="${edge}" stroke-width=".9"/>`;
    out += fold(ctx, `M98,${ty - 24} q10,4 18,3`, 1.6, 0.7);
    const cup = cup0;
    out += `<path d="${cup}" fill="${sole}" stroke="${soleEdge}" stroke-width="1.1"/><path d="M24,${ty + 4} H186" ${stitch(mix(sole, -0.35), 0.6)}/><path d="M21,${gy - 3.5} H188" stroke="${mix(sole, -0.12)}" stroke-width="3"/><path d="M22,${ty + 8} H187" stroke="#000" stroke-opacity=".05" stroke-width="5"/>`;
    if (s.canvas) {
      // a rubber toe cap and the foxing stripe of a canvas sneaker
      const cap = `M150,${ty + 1} C152,${ty - 14} 164,${ty - 20} 176,${ty - 15} C184,${ty - 11} 187,${ty - 4} 185,${ty + 1} Z`;
      out += `<path d="${cap}" fill="${sole}" stroke="${soleEdge}" stroke-width="1"/><path d="M155,${ty - 3} C158,${ty - 12} 168,${ty - 15} 177,${ty - 11}" ${stitch(mix(sole, -0.3), 0.5)}/>`;
      out += `<path d="M22,${ty + 9} H187" stroke="${mix(c, -0.15)}" stroke-width="1.6" opacity=".85"/>`;
    }
    if (s.brand) out += brandText(t === 'runner' ? 46 : 66, t === 'runner' ? ty - 24 : ty - 14, s.brand.length > 6 ? 5.2 : 7, s.brand, c);
    return out;
  }

  if (boot) {
    const shaftTop = t === 'chukka' ? ty - 66 : ty - 82;
    const shaft = `M30,${ty + 1} C24,${ty - 14} 24,${ty - 40} 29,${shaftTop + 12} C30,${shaftTop + 4} 33,${shaftTop} 40,${shaftTop} L80,${shaftTop} C85,${shaftTop} 87,${shaftTop + 3} 87,${shaftTop + 8} L95,${ty - 46} C112,${ty - 40} 138,${ty - 37} 160,${ty - 31} C176,${ty - 26} 185,${ty - 17} 185,${ty - 7} C185,${ty - 2} 184,${ty + 1} 180,${ty + 1} Z`;
    out += halo(ctx, c, [shaft]);
    if (t !== 'chelsea') {
      const tongue = `M77,${shaftTop + 1} C77,${shaftTop - 8} 83,${shaftTop - 12} 91,${shaftTop - 10} C95,${shaftTop - 8} 96,${shaftTop - 3} 94,${shaftTop + 4} L96,${ty - 56} Z`;
      out += halo(ctx, c, [tongue]) + `<path d="${tongue}" fill="${fill}" stroke="${edge}" stroke-width="1.1"/><path d="${tongue}" fill="#000" opacity=".14"/>`;
    }
    out += `<path d="${shaft}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${shaft}" fill="url(#${id}ty)"/><path d="${shaft}" fill="url(#${id}sx)" opacity=".7"/>`;
    out += `<ellipse cx="150" cy="${ty - 22}" rx="26" ry="9" fill="url(#${id}wg)" opacity=".8" transform="rotate(12 150 ${ty - 22})"/>`;
    out += `<path d="M29.5,${shaftTop + 9} C30,${shaftTop + 3} 33,${shaftTop} 40,${shaftTop} L80,${shaftTop}" fill="none" stroke="${mix(c, -0.22)}" stroke-width="3.2" stroke-linecap="round"/>`;
    out += `<path d="M32,${shaftTop + 1} C31,${shaftTop - 8} 34,${shaftTop - 11} 38,${shaftTop - 10} C41,${shaftTop - 9} 41,${shaftTop - 4} 40,${shaftTop}" fill="none" stroke="${mix(c, -0.3)}" stroke-width="2.4" stroke-linecap="round"/>`;
    out += `<path d="M28,${ty - 40} C40,${ty - 45} 54,${ty - 38} 58,${ty + 1}" fill="none" stroke="${edge}" stroke-width=".9"/><path d="M28,${ty - 37.5} C38.5,${ty - 42.5} 51.5,${ty - 36} 55.5,${ty + 1}" ${stitch(mix(c, -0.32), 0.55)}/>`;
    out += `<path d="M95,${ty - 46} C101,${ty - 32} 102,${ty - 14} 98,${ty + 1}" fill="none" stroke="${edge}" stroke-width=".9"/><path d="M92.5,${ty - 45} C98.5,${ty - 31} 99.5,${ty - 14} 95.5,${ty + 1}" ${stitch(mix(c, -0.32), 0.55)}/>`;
    if (t === 'chelsea') {
      // the elastic gore
      out += `<path d="M58,${shaftTop + 2} L74,${shaftTop + 2} L70,${ty - 40} Q66,${ty - 36} 62,${ty - 40} Z" fill="${mix(c, -0.35)}" stroke="${edge}" stroke-width=".9"/>`;
      for (let k = 1; k < 5; k++) out += `<path d="M${58 + k * 3.2},${shaftTop + 3} L${59 + k * 2.2},${ty - 41}" stroke="#000" stroke-opacity=".25" stroke-width=".6"/>`;
    } else {
      out += `<path d="M86,${shaftTop + 10} L93,${ty - 46}" ${stitch(mix(c, -0.32), 0.55)} transform="translate(-4,0)"/>`;
      const n = t === 'chukka' ? 3 : 5;
      for (let i = 0; i < n; i++) {
        const k = i / Math.max(1, n - 1);
        const x = 80.5 + k * 7.5;
        const y = shaftTop + 9 + k * (ty - 46 - shaftTop - 12);
        out += `<path d="M${f(x)},${f(y)} l7.5,-4" stroke="#000" stroke-opacity=".22" stroke-width="2.6" stroke-linecap="round" transform="translate(.5,1)"/><path d="M${f(x)},${f(y)} l7.5,-4" stroke="${lace}" stroke-width="2.1" stroke-linecap="round"/>`;
        out += `<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="#4A3F38" stroke="${mix(c, -0.5)}" stroke-width=".4"/><circle cx="${f(x - 0.4)}" cy="${f(y - 0.4)}" r=".5" fill="#fff" opacity=".4"/>`;
      }
      out += `<path d="M88,${shaftTop + 3} q-6,-7 -12,-6 M88,${shaftTop + 3} q3,-9 -2,-13" fill="none" stroke="${lace}" stroke-width="1.8" stroke-linecap="round"/>`;
    }
    out += fold(ctx, `M102,${ty - 39} q9,3 15,9`, 1.8, 0.9) + fold(ctx, `M111,${ty - 38} q8,3 12,8`, 1.4, 0.6) + fold(ctx, `M38,${ty - 64} q6,2 10,6`, 1.6, 0.5);
    out += `<path d="M26,${ty - 3} L185,${ty - 3} L186,${ty + 1} L25,${ty + 1} Z" fill="${mix(sole, -0.2)}" stroke="${soleEdge}" stroke-width=".8"/><path d="M28,${ty - 1} H184" ${stitch(mix(sole, 0.35), 0.6)}/>`;
  } else if (low) {
    // loafer and derby: a low upper, the opening, a saddle (loafer) or three lace pairs (derby)
    const upper = `M30,${ty + 1} C23,${ty - 14} 25,${ty - 36} 33,${ty - 46} C42,${ty - 51} 56,${ty - 47} 72,${ty - 42} C94,${ty - 41} 114,${ty - 39} 136,${ty - 32} C160,${ty - 25} 180,${ty - 17} 184,${ty - 8} C186,${ty - 2} 183,${ty + 1} 179,${ty + 1} Z`;
    out += halo(ctx, c, [upper]);
    out += `<path d="${upper}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${upper}" fill="url(#${id}ty)"/><path d="${upper}" fill="url(#${id}sx)" opacity=".6"/>`;
    out += `<ellipse cx="156" cy="${ty - 16}" rx="22" ry="7" fill="url(#${id}wg)" opacity=".9" transform="rotate(14 156 ${ty - 16})"/>`;
    // the opening, with the lining showing
    out += `<path d="M33,${ty - 46} C42,${ty - 51} 56,${ty - 47} 72,${ty - 42} C60,${ty - 40} 44,${ty - 41} 33,${ty - 46} Z" fill="${mix(c, lum(c) < 0.05 ? 0.2 : -0.4)}"/>`;
    out += `<path d="M33,${ty - 46} C42,${ty - 51} 56,${ty - 47} 72,${ty - 42}" fill="none" stroke="${edge}" stroke-width="1.2"/>`;
    if (t === 'loafer') {
      // the apron seam over the vamp and the saddle strap with its cut-out
      out += `<path d="M72,${ty - 41} C92,${ty - 46} 124,${ty - 42} 150,${ty - 26}" fill="none" stroke="${edge}" stroke-width="1"/><path d="M74,${ty - 38.5} C93,${ty - 43} 122,${ty - 39.5} 147,${ty - 24}" ${stitch(mix(c, -0.35), 0.55)}/>`;
      out += `<path d="M84,${ty - 39} C96,${ty - 42} 112,${ty - 41} 124,${ty - 35} L121,${ty - 27} C110,${ty - 32} 96,${ty - 33} 86,${ty - 31} Z" fill="${mix(c, -0.12)}" stroke="${edge}" stroke-width=".9"/>`;
      out += `<path d="M99,${ty - 34} q6,3 12,0" fill="none" stroke="${mix(c, -0.55)}" stroke-width="2" stroke-linecap="round"/>`;
    } else {
      // derby: open lacing over the instep, a toe seam
      out += `<path d="M72,${ty - 42} C86,${ty - 43} 100,${ty - 39} 110,${ty - 33} L104,${ty - 24} C94,${ty - 30} 84,${ty - 33} 76,${ty - 33} Z" fill="${mix(c, lum(c) < 0.05 ? 0.06 : -0.05)}" stroke="${edge}" stroke-width=".9"/>`;
      for (let i = 0; i < 4; i++) {
        const x = 78 + i * 7.5;
        const y = ty - 40 + i * 2.6;
        out += `<path d="M${x},${y} l6.5,-4" stroke="${lace}" stroke-width="1.9" stroke-linecap="round"/><circle cx="${x}" cy="${y + 0.5}" r="1.1" fill="${mix(c, -0.45)}"/>`;
      }
      out += `<path d="M150,${ty - 27} C146,${ty - 18} 147,${ty - 8} 150,${ty + 1}" fill="none" stroke="${edge}" stroke-width=".9"/>`;
    }
    out += `<path d="M58,${ty + 1} C60,${ty - 16} 64,${ty - 30} 74,${ty - 41}" fill="none" stroke="${edge}" stroke-width=".9"/>`;
    out += fold(ctx, `M110,${ty - 26} q10,3 18,3`, 1.4, 0.7);
  } else {
    // slides: a footbed and one wide strap
    const footbed = `M24,${ty - 4} C40,${ty - 9} 150,${ty - 9} 182,${ty - 4} L184,${ty + 1} L24,${ty + 1} Z`;
    const strap = `M92,${ty - 4} C94,${ty - 34} 150,${ty - 40} 166,${ty - 5} Z`;
    out += halo(ctx, c, [footbed, strap]);
    out += `<path d="${footbed}" fill="${mix(c, -0.1)}" stroke="${edge}" stroke-width="1"/>`;
    out += `<path d="${strap}" fill="#000" opacity=".14" transform="translate(1,2)"/><path d="${strap}" fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${strap}" fill="url(#${id}ty)"/>`;
    out += `<path d="M102,${ty - 8} C106,${ty - 28} 146,${ty - 32} 158,${ty - 8}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="5"/>`;
    if (s.brand) out += brandText(128, ty - 16, 8, s.brand, c);
  }
  // the outsole (crepe dots on boots); its path is built above, for the dark-mode halo
  out += `<path d="${outsole}" fill="${sole}" stroke="${soleEdge}" stroke-width="1.1"/>`;
  // a stacked heel block on loafers and derbies
  if (low) out += `<path d="M24,${ty - 1} H62 V${gy + 0.5} H25 Q21,${gy + 0.5} 21,${gy - 3} V${ty + 2} Q21,${ty - 1} 24,${ty - 1} Z" fill="${mix(sole, -0.12)}" stroke="${soleEdge}" stroke-width="1"/><path d="M24,${gy - 4} H61" stroke="${mix(sole, -0.35)}" stroke-width="1.6"/>`;
  if (t === 'work_boot' || s.chunky) {
    const r = lcg(3);
    for (let i = 0; i < 40; i++) out += `<circle cx="${f(26 + r() * 160)}" cy="${f(ty + 3 + r() * (sh - 5))}" r="${f(0.3 + r() * 0.5)}" fill="${mix(sole, -0.2)}" opacity=".5"/>`;
  }
  return out;
}


// ======================================================================== ACCESSORIES (T101)
// A watch, a belt, a cap and a beanie, drawn like the other flats: the same ground shadow, edge, fold and halo rules, the
// piece's color as a plain fill (strap, leather, cloth), never a brand word or any text. Added as their own functions;
// the top, bottom and shoe drawings above are untouched.
const rectD = (x: number, y: number, w: number, h: number) => `M${f(x)},${f(y)} h${f(w)} v${f(h)} h${f(-w)} Z`;

/** The ground shadow: an offset silhouette (no blur, so it maps 1:1 to react-native-svg). */
function groundShadow(ctx: Ctx, paths: string[]): string {
  return `<g transform="translate(1,2.5)" fill="#000" opacity="${ctx.scheme === 'dark' ? 0.2 : 0.07}">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
}

/** A lit seven-segment digit at (x, y), 8 wide and 14 tall: the segments named in `on`, as one path. */
function segments(x: number, y: number, on: string): string {
  const w = 8;
  const h = 14;
  const m = h / 2;
  const seg: Record<string, string> = {
    a: `M${x + 1},${y} H${x + w - 1}`, b: `M${x + w},${y + 1} V${y + m - 1}`, c: `M${x + w},${y + m + 1} V${y + h - 1}`,
    d: `M${x + 1},${y + h} H${x + w - 1}`, e: `M${x},${y + m + 1} V${y + h - 1}`, g: `M${x + 1},${y + m} H${x + w - 1}`,
    f: `M${x},${y + 1} V${y + m - 1}`,
  };
  return on.split('').map((k) => seg[k]).join(' ');
}

function watch(s: AccessoryFlat, ctx: Ctx): string {
  const { id } = ctx;
  const c = s.color;
  const metal = METAL_HEX[s.metal ?? 'silver'] ?? METAL_HEX.silver;
  const strapC = s.bracelet ? metal : c;
  const edge = edgeFor(strapC, ctx.scheme);
  const metalEdge = edgeFor(metal, ctx.scheme);
  const cx = 100;
  const cy = 100;
  const topStrap = 'M79,14 Q79,6 87,6 L113,6 Q121,6 121,14 L126,66 L74,66 Z';
  const botStrap = 'M74,134 L126,134 L121,186 Q121,194 113,194 L87,194 Q79,194 79,186 Z';
  const caseD = `M${cx - 38},${cy} a38,38 0 1,0 76,0 a38,38 0 1,0 -76,0 Z`;
  let out = groundShadow(ctx, [topStrap, botStrap, caseD]);
  out += halo(ctx, strapC, [topStrap, botStrap]) + halo(ctx, metal, [caseD]);

  // the crown, behind the case
  out += `<rect x="134" y="92" width="11" height="16" rx="3" fill="${mix(metal, -0.12)}" stroke="${metalEdge}" stroke-width="1"/><path d="M138,94 V106 M141,94 V106" stroke="#000" stroke-opacity=".22" stroke-width=".8"/>`;

  if (s.bracelet) {
    // linked segments in the metal's tone
    const link = (x: number, y: number, h: number) =>
      `<rect x="${x}" y="${f(y)}" width="46" height="${h}" rx="2.5" fill="${metal}" stroke="${metalEdge}" stroke-width=".9"/><rect x="${x + 9}" y="${f(y + 1.6)}" width="28" height="${f(h - 3.2)}" rx="1.5" fill="${mix(metal, 0.16)}" opacity=".75"/>`;
    for (let i = 0; i < 6; i++) out += link(77, 8 + i * 9.5, 8.2);
    for (let i = 0; i < 6; i++) out += link(77, 137 + i * 9.5, 8.2);
    out += `<path d="M100,10 V62 M100,138 V190" stroke="#000" stroke-opacity=".12" stroke-width=".7"/>`;
    out += `<path d="${topStrap}" fill="url(#${id}sx)"/><path d="${botStrap}" fill="url(#${id}sx)"/>`;
  } else {
    const st = lum(c) < 0.12 ? mix(c, 0.32) : mix(c, -0.3);
    out += `<path d="${topStrap}" fill="${c}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${topStrap}" fill="url(#${id}sx)"/><path d="${topStrap}" fill="url(#${id}ty)"/>`;
    out += `<path d="${botStrap}" fill="${c}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${botStrap}" fill="url(#${id}sx)"/><path d="${botStrap}" fill="url(#${id}ty)"/>`;
    out += `<path d="M84,13 L80.5,62 M116,13 L119.5,62 M80.5,138 L84,187 M119.5,138 L116,187" ${stitch(st, 0.7)}/>`;
    out += fold(ctx, 'M84,52 Q100,56 116,52', 2, 0.8);
    // the keeper loop and the buckle holes on the lower strap
    out += `<path d="${rectD(75, 143, 50, 7)}" fill="${mix(c, lum(c) < 0.12 ? 0.08 : -0.08)}" stroke="${edge}" stroke-width=".9"/>`;
    for (const y of [160, 170, 180]) out += `<circle cx="100" cy="${y}" r="2.3" fill="#000" opacity=".3"/><circle cx="100.5" cy="${y + 0.7}" r="1" fill="#fff" opacity=".12"/>`;
  }

  // the case: a metal ring around the dial
  out += `<path d="${caseD}" fill="${metal}" stroke="${metalEdge}" stroke-width="1.3"/><path d="${caseD}" fill="url(#${id}wg)"/>`;
  out += `<circle cx="${cx}" cy="${cy}" r="33" fill="${mix(metal, 0.2)}" stroke="${metalEdge}" stroke-width=".9"/>`;
  const dark = s.metal === 'black';
  if (s.face === 'digital') {
    out += `<circle cx="${cx}" cy="${cy}" r="29" fill="#16181D" stroke="#000" stroke-opacity=".5" stroke-width=".8"/>`;
    out += `<path d="${rectD(74, 88, 52, 24)}" fill="#0C0E11" stroke="#2C3036" stroke-width=".9"/>`;
    const lit = '#B7F0D2';
    const xs = [78, 90, 104, 116];
    const ghost = xs.map((x) => segments(x, 93, 'abcdefg')).join(' ');
    out += `<path d="${ghost}" fill="none" stroke="${lit}" stroke-opacity=".1" stroke-width="1.9" stroke-linecap="round"/>`;
    const on = `${segments(78, 93, 'bc')} ${segments(90, 93, 'abcdef')} ${segments(104, 93, 'abcdef')} ${segments(116, 93, 'abcdefg')}`;
    out += `<path d="${on}" fill="none" stroke="${lit}" stroke-width="1.9" stroke-linecap="round"/>`;
    out += `<circle cx="99" cy="97.5" r="1.1" fill="${lit}"/><circle cx="99" cy="103.5" r="1.1" fill="${lit}"/>`;
  } else {
    const face = dark ? '#1A1C22' : '#F6F5F1';
    const ink = dark ? '#E9E7E1' : '#2B2E36';
    out += `<circle cx="${cx}" cy="${cy}" r="29" fill="${face}" stroke="${metalEdge}" stroke-opacity=".6" stroke-width=".8"/>`;
    let big = '';
    let small = '';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const sin = Math.sin(a);
      const cos = Math.cos(a);
      const r0 = i % 3 === 0 ? 20.5 : 23.5;
      const seg = `M${f(cx + sin * r0)},${f(cy - cos * r0)} L${f(cx + sin * 26.5)},${f(cy - cos * 26.5)} `;
      if (i % 3 === 0) big += seg;
      else small += seg;
    }
    out += `<path d="${small}" stroke="${ink}" stroke-width="1" stroke-linecap="round" opacity=".7"/><path d="${big}" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
    // 10:10: the hour hand to ten, the minute hand to two
    out += `<polygon points="${cx},${cy - 2.4} ${f(cx - 13.4)},${f(cy - 8.6)} ${cx},${cy + 2.4}" fill="${ink}"/>`;
    out += `<polygon points="${cx},${cy - 2} ${f(cx + 17.7)},${f(cy - 10.2)} ${cx},${cy + 2}" fill="${ink}"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="2.8" fill="${ink}"/><circle cx="${cx}" cy="${cy}" r="1" fill="${metal}"/>`;
  }
  // a soft glare across the glass
  out += `<path d="M${cx - 24},${cy - 12} A26,26 0 0,1 ${cx + 4},${cy - 26} L${cx + 2},${cy - 14} Z" fill="#fff" opacity=".1"/>`;
  return out;
}

function belt(s: AccessoryFlat, ctx: Ctx): string {
  const { id } = ctx;
  const c = s.color;
  const edge = edgeFor(c, ctx.scheme);
  const st = lum(c) < 0.12 ? mix(c, 0.3) : mix(c, -0.3);
  const steel = '#B9BDC4';
  const steelEdge = '#6D7178';
  // a strap laid out in a gentle loop (an open ring), the buckle on the left, holes on the right half
  const ring = 'M22,100 a78,70 0 1,0 156,0 a78,70 0 1,0 -156,0 Z M44,100 a56,48 0 1,1 112,0 a56,48 0 1,1 -112,0 Z';
  const frame = 'M10,84 h46 v32 h-46 Z M18,91 v18 h30 v-18 Z';
  const g = 'transform="rotate(-8 100 100)"';
  let out = `<g ${g}>`;
  out += groundShadow(ctx, [ring, frame]);
  out += halo(ctx, c, [ring]) + halo(ctx, steel, [frame]);
  out += `<path d="${ring}" fill="${c}" fill-rule="evenodd" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/>`;
  out += `<path d="${ring}" fill="url(#${id}ty)" fill-rule="evenodd"/>`;
  out += `<path d="M33,100 a67,59 0 1,0 134,0 a67,59 0 1,0 -134,0 Z" ${stitch(st, 0.8)}/>`;
  out += `<path d="M28,100 a72,64 0 1,0 144,0 a72,64 0 1,0 -144,0 Z M39,100 a61,53 0 1,0 122,0 a61,53 0 1,0 -122,0 Z" fill="none" stroke="#000" stroke-opacity=".08" stroke-width=".8"/>`;
  // the holes along the strap's right side
  for (let i = 0; i < 5; i++) {
    const a = ((i - 2) * 17 * Math.PI) / 180;
    const hx = 100 + Math.cos(a) * 67;
    const hy = 100 + Math.sin(a) * 59;
    out += `<circle cx="${f(hx)}" cy="${f(hy)}" r="3.1" fill="#000" opacity=".34"/><circle cx="${f(hx + 0.5)}" cy="${f(hy + 0.8)}" r="1.3" fill="#fff" opacity=".12"/>`;
  }
  // the keeper loop under the buckle
  out += `<path d="${rectD(24, 126, 18, 10)}" fill="${mix(c, lum(c) < 0.12 ? 0.08 : -0.1)}" stroke="${edge}" stroke-width=".9"/>`;
  // the buckle: a steel frame across the strap and its prong
  out += `<path d="${frame}" fill="${steel}" fill-rule="evenodd" stroke="${steelEdge}" stroke-width="1.1" stroke-linejoin="round"/><path d="${frame}" fill="url(#${id}wg)" fill-rule="evenodd"/>`;
  out += `<path d="M33,86 V114" stroke="${steelEdge}" stroke-width="2.4" stroke-linecap="round"/><path d="M32.2,87 V113" stroke="#fff" stroke-opacity=".4" stroke-width=".7"/>`;
  out += `</g>`;
  return out;
}

function cap(s: AccessoryFlat, ctx: Ctx): string {
  const { id } = ctx;
  const c = s.color;
  const edge = edgeFor(c, ctx.scheme);
  const st = lum(c) < 0.12 ? mix(c, 0.3) : mix(c, -0.3);
  const seam = lum(c) < 0.12 ? mix(c, 0.2) : mix(c, -0.22);
  const btn = mix(c, lum(c) < 0.12 ? 0.1 : -0.08);
  // a baseball cap from the side, the brim to the right (the other flats' shoes face right too)
  const dome = 'M22,124 C18,64 52,32 96,32 C134,32 158,58 162,96 L164,124 Z';
  const band = 'M22,122 L164,122 L162,138 Q92,152 24,138 Z';
  const brim = 'M142,98 C170,92 198,106 198,124 C190,138 160,140 122,140 Z';
  let out = `<g transform="translate(0,12)">`;
  out += groundShadow(ctx, [dome, band, brim]);
  out += halo(ctx, c, [dome, band, brim]);
  out += `<path d="${band}" fill="${c}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${band}" fill="#000" opacity=".16"/>`;
  out += `<path d="${dome}" fill="${c}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${dome}" fill="url(#${id}sx)"/><path d="${dome}" fill="url(#${id}ty)"/>`;
  // six panels: seams from the button down to the band
  out += `<path d="M96,34 C84,62 78,94 78,122 M96,34 C112,60 124,92 130,122 M96,34 C62,46 44,84 40,120 M96,34 C132,40 154,64 160,98" fill="none" stroke="${seam}" stroke-width="1.5" stroke-linecap="round"/>`;
  out += `<path d="M100,36 C89,63 83,95 83,121 M92,36 C79,63 73,94 73,121 M101,37 C117,62 129,92 135,121" ${stitch(st, 0.55)}/>`;
  out += `<path d="M26,120 H162" stroke="${seam}" stroke-width="1.2"/>`;
  out += `<circle cx="96" cy="33" r="6" fill="${btn}" stroke="${edge}" stroke-width="1"/>`;
  out += `<circle cx="64" cy="64" r="1.6" fill="#000" opacity=".3"/><circle cx="128" cy="62" r="1.6" fill="#000" opacity=".3"/>`;
  // the brim, curved and stitched, over the dome's front
  out += `<path d="${brim}" fill="${c}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${brim}" fill="url(#${id}ty)"/><path d="${brim}" fill="#000" opacity=".12"/>`;
  out += `<path d="M148,104 C170,100 190,110 192,122" ${stitch(st, 0.55)}/><path d="M142,116 C162,112 180,118 186,128" ${stitch(st, 0.55)}/>`;
  out += fold(ctx, 'M56,100 Q60,112 58,120', 2, 0.6);
  out += `</g>`;
  return out;
}

function beanie(s: AccessoryFlat, ctx: Ctx): string {
  const { id } = ctx;
  const c = s.color;
  const edge = edgeFor(c, ctx.scheme);
  const rib = lum(c) < 0.12 ? mix(c, 0.22) : mix(c, -0.2);
  const dome = 'M34,112 C32,60 62,30 100,30 C138,30 168,60 166,112 Z';
  const cuff = 'M26,106 Q26,100 34,100 L166,100 Q174,100 174,106 L174,160 Q174,168 166,168 L34,168 Q26,168 26,160 Z';
  let out = groundShadow(ctx, [dome, cuff]);
  out += halo(ctx, c, [dome, cuff]);
  out += `<path d="${dome}" fill="${c}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/><path d="${dome}" fill="url(#${id}sx)"/><path d="${dome}" fill="url(#${id}ty)"/>`;
  // the knit: ribs running from the crown down to the cuff
  let ribs = '';
  for (let i = -4; i <= 4; i++) ribs += `M${f(100 + i * 1.5)},32 C${f(100 + i * 9)},60 ${f(100 + i * 15.5)},88 ${f(100 + i * 15.8)},108 `;
  out += `<path d="${ribs}" fill="none" stroke="${rib}" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`;
  // the folded cuff: a thicker, ribbed band
  out += `<path d="${cuff}" fill="${c}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round"/>`;
  let cr = '';
  for (let x = 36; x < 174; x += 7.2) cr += `M${f(x)},104 V164 `;
  out += `<path d="${cr}" fill="none" stroke="${rib}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`;
  out += `<path d="${cuff}" fill="url(#${id}sx)"/><path d="${cuff}" fill="url(#${id}ty)"/>`;
  out += `<path d="M28,103 H172" stroke="#000" stroke-opacity=".2" stroke-width="2.4" stroke-linecap="round"/><path d="M28,106.5 H172" stroke="#fff" stroke-opacity=".1" stroke-width="1" stroke-linecap="round"/>`;
  return out;
}

function accessory(s: AccessoryFlat, ctx: Ctx): string {
  return s.type === 'watch' ? watch(s, ctx) : s.type === 'belt' ? belt(s, ctx) : s.type === 'cap' ? cap(s, ctx) : beanie(s, ctx);
}

// ======================================================================== entry
/** The SVG for one piece: a 200 × 200 viewBox, transparent background. `id` keeps defs unique per instance. */
export function renderFlat(spec: FlatSpec, opts: { scheme?: FlatScheme; id?: string } = {}): string {
  const scheme = opts.scheme ?? 'light';
  const id = (opts.id ?? 'k').replace(/[^a-zA-Z0-9]/g, '') || 'k';
  const ctx: Ctx = { id, scheme, foldK: lum(spec.color) > 0.6 ? 0.5 : 1, rim: scheme === 'light' && (lightnessOf(spec.color) ?? 0) >= RIM_L };
  const defs = shadeDefs(id, scheme) + patternDefs(`${id}p`, spec.pattern, spec.color);
  const body = spec.kind === 'top' ? top(spec, ctx) : spec.kind === 'bottom' ? bottom(spec, ctx) : spec.kind === 'accessory' ? accessory(spec, ctx) : shoe(spec, ctx);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${defs}</defs>${body}</svg>`;
}
