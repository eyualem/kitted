// GarmentIcon: the mockup's flat garment drawings (`gi(t, c)` in kitted-mockups.html), ported
// path for path to react-native-svg. viewBox 60 × 60; strokes are the fill darkened 30%,
// highlights lightened 20%. Always decorative (the parent carries the VoiceOver label).
// Contrast fix (DECISIONS-LOG #56): on dark tiles a navy or black garment's darkened edge
// vanished, so very dark fills get a lightened rim in dark mode; near-white fills get a deeper
// edge on light tiles.

import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';
/** The mockup's gi() set. */
export type GarmentIconType =
  | 'tee' | 'oxford' | 'overshirt' | 'jacket' | 'sweater' | 'hoodie' | 'chino' | 'jeans' | 'trouser' | 'cargo'
  | 'sneaker' | 'runner' | 'boot' | 'loafer';

/** The mockup's shade(): mix toward black (a < 0) or white (a > 0). */
export function shade(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = a < 0 ? 0 : 255;
  const p = Math.abs(a);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const LS = 'M21,9 L13,12 L9,20 L5,50 L12,51 L16,29 L16,53 L44,53 L44,29 L48,51 L55,50 L51,20 L47,12 L39,9 Q30,15 21,9 Z';
const STITCH = '#C98A4A';

/** Relative luminance (0 black … 1 white) of a #rrggbb color. */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** The outline color: the mockup's darkened edge, except where it would disappear into the tile. */
export function garmentEdge(hex: string, scheme: 'light' | 'dark'): string {
  const y = luminance(hex);
  if (scheme === 'dark' && y < 0.06) return shade(hex, 0.45);
  if (scheme === 'light' && y > 0.8) return shade(hex, -0.42);
  return shade(hex, -0.3);
}

/** Very dark fills (black tee, black boots) also get a faint light halo outside the silhouette in dark mode (#231). */
const HALO_LUM = 0.05;

/** The outer outline of each drawing (the same paths as below), for the halo. */
function silhouette(t: GarmentIconType): string[] {
  switch (t) {
    case 'tee':
      return ['M21,9 L13,12 L5,20 L10,27 L16,24.5 L16,52 L44,52 L44,24.5 L50,27 L55,20 L47,12 L39,9 Q30,16 21,9 Z'];
    case 'hoodie':
      return [LS, 'M22,11 Q30,22 38,11 Q37,3 30,3 Q23,3 22,11 Z'];
    case 'oxford':
    case 'overshirt':
    case 'jacket':
    case 'sweater':
      return [LS];
    case 'chino':
    case 'jeans':
    case 'trouser':
    case 'cargo':
      return ['M17,6 L43,6 L45,55 L34,55 L30,21 L26,55 L15,55 Z'];
    case 'sneaker':
    case 'runner':
      return ['M5,42 Q6,32 15,30 L27,27 Q31,33 41,35 Q53,37 55,43 L55,45 L5,45 Z'];
    case 'boot':
      return ['M13,12 L30,12 L31,33 Q46,35 53,40 L54,45 L11,45 L11,30 Z', 'M10,45 H55 V49.5 H10 Z'];
    default:
      return ['M5,41 Q8,32 20,32 L33,32 Q47,33 53,38 L55,45 L5,45 Z', 'M4,45 H56 V47.5 H4 Z'];
  }
}

export interface GarmentIconProps {
  type: GarmentIconType;
  color: string;
  size: number;
}

export function GarmentIcon({ type: t, color: c, size }: GarmentIconProps) {
  const { scheme } = useTheme();
  const d = garmentEdge(c, scheme);
  const l = shade(c, 0.2);
  const st = { stroke: d, strokeWidth: 1.1, strokeLinejoin: 'round' as const };
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
    <Svg width={size} height={size} viewBox="0 0 60 60">
      {/* Halo first: the fill hides its inner half, leaving ~1.25 units (≈1 pt at 44 pt) of white at 22% outside the edge. */}
      {scheme === 'dark' && luminance(c) < HALO_LUM
        ? silhouette(t).map((p) => <Path key={p} d={p} fill="none" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={3.6} strokeLinejoin="round" />)
        : null}
      {t === 'tee' ? (
        <>
          <Path d="M21,9 L13,12 L5,20 L10,27 L16,24.5 L16,52 L44,52 L44,24.5 L50,27 L55,20 L47,12 L39,9 Q30,16 21,9 Z" fill={c} {...st} />
          <Path d="M21,9 Q30,16 39,9" fill="none" stroke={d} strokeWidth={1.7} />
        </>
      ) : t === 'oxford' ? (
        <>
          <Path d={LS} fill={c} {...st} />
          <Path d="M21,9 L30,14 L26,21 L18.5,13 Z M39,9 L30,14 L34,21 L41.5,13 Z" fill={l} {...st} />
          <Path d="M30,14 V53" stroke={d} strokeWidth={1} />
          {[24, 32, 40, 48].map((y) => (
            <Circle key={y} cx={31.6} cy={y} r={0.9} fill={d} />
          ))}
        </>
      ) : t === 'overshirt' || t === 'jacket' ? (
        <>
          <Path d={LS} fill={c} {...st} />
          <Path d="M21,9 L30,15 L25,23 L17,13 Z M39,9 L30,15 L35,23 L43,13 Z" fill={shade(c, -0.12)} {...st} />
          <Path d="M30,15 V53" stroke={d} strokeWidth={1.4} />
          <Rect x={19} y={24} width={8} height={7} rx={1} fill={l} {...st} />
          <Rect x={33} y={24} width={8} height={7} rx={1} fill={l} {...st} />
          {t === 'jacket' ? <Path d="M17,40 H43" stroke={STITCH} strokeWidth={0.8} strokeDasharray="1.6 1.4" /> : null}
        </>
      ) : t === 'sweater' ? (
        <>
          <Path d={LS} fill={c} {...st} />
          <Path d="M21,9 Q30,17 39,9" fill="none" stroke={d} strokeWidth={2.6} />
          <Path d="M16.5,49.5 H43.5 M5.6,46.5 L12.3,47.4 M54.4,46.5 L47.7,47.4" stroke={d} strokeWidth={2} />
        </>
      ) : t === 'hoodie' ? (
        <>
          <Path d={LS} fill={c} {...st} />
          <Path d="M22,11 Q30,22 38,11 Q37,3 30,3 Q23,3 22,11 Z" fill={shade(c, -0.15)} {...st} />
          <Path d="M21,37 L39,37 L41,48 L19,48 Z" fill="none" {...st} />
        </>
      ) : t === 'chino' || t === 'jeans' || t === 'trouser' || t === 'cargo' ? (
        <>
          <Path d="M17,6 L43,6 L45,55 L34,55 L30,21 L26,55 L15,55 Z" fill={c} {...st} />
          <Path d="M17,10.5 H43" stroke={d} strokeWidth={1} />
          {t === 'jeans' ? (
            <Path
              d="M18,11 Q22,18 27,11 M42,11 Q38,18 33,11 M17.6,14 L16,54 M42.4,14 L44,54"
              stroke={STITCH}
              strokeWidth={0.8}
              fill="none"
              strokeDasharray="1.6 1.3"
            />
          ) : (
            <Path d="M19,11 L23,19 M41,11 L37,19" stroke={d} strokeWidth={1} />
          )}
        </>
      ) : t === 'sneaker' || t === 'runner' ? (
        <>
          <Path d="M5,42 Q6,32 15,30 L27,27 Q31,33 41,35 Q53,37 55,43 L55,45 L5,45 Z" fill={c} {...st} />
          <Path d="M4,45 L56,45 L56,48.5 Q30,50.5 4,48.5 Z" fill={t === 'runner' ? '#ECECE8' : '#FFFFFF'} stroke="#C9C9C4" strokeWidth={0.9} />
          <Path d="M24,30 L27,35 M28.5,29 L31.5,34" stroke={d} strokeWidth={1} />
          {t === 'runner' ? <Path d="M12,40 Q26,34 44,40" stroke="#D9733A" strokeWidth={2} fill="none" strokeLinecap="round" /> : null}
        </>
      ) : t === 'boot' ? (
        <>
          <Path d="M13,12 L30,12 L31,33 Q46,35 53,40 L54,45 L11,45 L11,30 Z" fill={c} {...st} />
          <Path d="M10,45 H55 V49.5 H10 Z" fill="#2A1D14" />
          <Path d="M13,18 H30" stroke={d} strokeWidth={1} />
        </>
      ) : (
        <>
          <Path d="M5,41 Q8,32 20,32 L33,32 Q47,33 53,38 L55,45 L5,45 Z" fill={c} {...st} />
          <Path d="M4,45 H56 V47.5 H4 Z" fill={shade(c, -0.5)} />
          <Path d="M26,33.5 Q33,38 42,35.5" stroke={d} strokeWidth={1.3} fill="none" />
        </>
      )}
    </Svg>
    </View>
  );
}
