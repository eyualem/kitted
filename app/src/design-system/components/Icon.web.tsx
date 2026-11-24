// WEB ONLY: Icon for the web demo (the showcase site, the layout preview). Never shipped to iOS, where Icon.tsx
// draws real SF Symbols through expo-symbols. SF Symbols exist only on Apple platforms and expo-symbols has no web
// renderer, so on the web every icon was an empty box. Here each symbol name maps to a small hand-drawn glyph,
// drawn on a 24-point grid with round caps and joins to sit near the SF look. A name with no glyph draws an empty box
// of the same size, like before (the web test checks that every canonical name has one).
// The props, sizes and exports match Icon.tsx exactly, so callers don't change.

import { View } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';
import { sym, type SymKey } from '../symbols';
import type { InkColor } from '../typography';

export type SymbolName = string;

export const iconSizes = { large: 26, regular: 20, small: 16 } as const;

export interface IconProps {
  /** A key of the canonical table (preferred) or a raw SF Symbol name. */
  name: SymKey | SymbolName;
  size?: keyof typeof iconSizes | number;
  color?: InkColor | (string & {});
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  scalesWithText?: boolean;
  /** Icons are decorative by default (the control or text next to them carries the label). */
  accessibilityLabel?: string;
}

// A glyph is a list of parts. A string is a stroked path; the objects are the other shapes.
type Part =
  | string
  | { circle: [number, number, number]; fill?: boolean; dash?: string }
  | { rect: [number, number, number, number, number]; dash?: string }
  | { dot: [number, number]; r?: number }
  | { fill: string }
  /** A solid shape with a path cut out of it (the filled circle symbols). */
  | { solid: { circle: [number, number, number] } | { path: string }; cut: string };

const gear = (): string => {
  // Eight teeth around a ring, joined with round corners.
  const pts: string[] = [];
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const w = Math.PI / teeth;
    const at = (r: number, ang: number) => `${(12 + r * Math.cos(ang)).toFixed(2)} ${(12 + r * Math.sin(ang)).toFixed(2)}`;
    pts.push(at(7.4, a - w * 0.9), at(9.6, a - w * 0.42), at(9.6, a + w * 0.42), at(7.4, a + w * 0.9));
  }
  return `M${pts.join('L')}Z`;
};

const rays = (cx: number, cy: number, r1: number, r2: number, n: number, start = 0): string =>
  Array.from({ length: n }, (_, i) => {
    const a = start + (i / n) * Math.PI * 2;
    const p = (r: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    return `M${p(r1)}L${p(r2)}`;
  }).join('');

const SHOE = 'M3 17.5V12c0-.6.4-1 1-1.1 2.6-.3 3.8-1.8 4.3-3.5l2.1 1.4c1 .7 2.2 1.1 3.4 1.3l3.6.6c2.1.4 3.6 1.5 3.6 3.3v3.5z';

export const glyphs: Record<string, readonly Part[]> = {
  'bubble.left': ['M6 4.5h12a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-6.5L7 20.5V17.5H6A2.5 2.5 0 0 1 3.5 15V7A2.5 2.5 0 0 1 6 4.5z'],
  hanger: ['M12 9.2V8a2.4 2.4 0 1 0-2.4-2.4', 'M12 9.2L3.2 16.2a1.5 1.5 0 0 0 .9 2.7h15.8a1.5 1.5 0 0 0 .9-2.7z'],
  'square.grid.2x2': [{ rect: [4, 4, 6.5, 6.5, 1.6] }, { rect: [13.5, 4, 6.5, 6.5, 1.6] }, { rect: [4, 13.5, 6.5, 6.5, 1.6] }, { rect: [13.5, 13.5, 6.5, 6.5, 1.6] }],
  person: [{ circle: [12, 8, 3.7] }, 'M4.8 20c.7-3.9 3.7-6 7.2-6s6.5 2.1 7.2 6'],
  camera: ['M3 9a2 2 0 0 1 2-2h2l1.4-2h7.2L17 7h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', { circle: [12, 13, 3.8] }],
  photo: [{ rect: [3, 4.5, 18, 15, 2.5] }, { circle: [8.5, 9.5, 1.6] }, 'M3.5 17l5-5 4 4 3-3 5 5'],
  xmark: ['M6 6l12 12M18 6L6 18'],
  'chevron.left': ['M15 5l-7 7 7 7'],
  'chevron.right': ['M9 5l7 7-7 7'],
  'chevron.down': ['M5 9l7 7 7-7'],
  'chevron.up': ['M5 15l7-7 7 7'],
  gearshape: [gear(), { circle: [12, 12, 3.1] }],
  checkmark: ['M5 12.5l4.5 4.5L19 7.5'],
  'checkmark.circle.fill': [{ solid: { circle: [12, 12, 10] }, cut: 'M7.5 12.5l3 3 6-6.5' }],
  circle: [{ circle: [12, 12, 8.5] }],
  tshirt: ['M8.7 4L3 6.7l2 4.6 2.5-1V20h9V10.3l2.5 1 2-4.6L15.3 4c-.4 1.6-1.8 2.5-3.3 2.5S9.1 5.6 8.7 4z'],
  bag: ['M5 8h14l1 12H4z', 'M9 8V7a3 3 0 0 1 6 0v1'],
  'questionmark.circle': [{ circle: [12, 12, 9] }, 'M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.2 1-1.2 1.9', { dot: [12, 16.8] }],
  'square.and.arrow.up': ['M12 14.5V3.5M8 7.2l4-3.7 4 3.7', 'M8 10H6.5A1.5 1.5 0 0 0 5 11.5v7A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 17.5 10H16'],
  'square.and.arrow.down': ['M12 3.5V14.5M8 10.8l4 3.7 4-3.7', 'M8 10H6.5A1.5 1.5 0 0 0 5 11.5v7A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 17.5 10H16'],
  'arrow.clockwise': ['M19.5 12a7.5 7.5 0 1 1-2.4-5.5', 'M19.8 4.2v4.3h-4.3'],
  'info.circle': [{ circle: [12, 12, 9] }, 'M12 11v5.5', { dot: [12, 7.8] }],
  pencil: ['M4 20l.9-4.3L16.2 4.4a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.3 19.1z', 'M14 6.6l3.4 3.4'],
  shoe: [SHOE, 'M3 17.5h18'],
  'shoe.2': ['M2.5 15.5V12c1.5-.2 2.4-1 2.9-2.2l1.4 1c.8.6 1.7.9 2.7 1l1.4.2c1.2.2 1.9.8 1.9 1.8v1.7z', 'M12.5 20.5v-3.4c1.5-.2 2.4-1 2.9-2.2l1.4 1c.8.6 1.7.9 2.7 1l1.4.2c1.2.2 1.9.8 1.9 1.8v1.6z'],
  lock: ['M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  bookmark: ['M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.3L6 21V4.5a1 1 0 0 1 1-1z'],
  'bookmark.fill': [{ fill: 'M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.3L6 21V4.5a1 1 0 0 1 1-1z' }],
  plus: ['M12 5v14M5 12h14'],
  'sun.max': [{ circle: [12, 12, 3.8] }, rays(12, 12, 6.8, 9.2, 8)],
  'face.dashed': [{ circle: [12, 12, 9], dash: '3.2 3' }, { dot: [9, 10.2] }, { dot: [15, 10.2] }, 'M8.8 14.6c1 1.1 2.2 1.7 3.2 1.7s2.2-.6 3.2-1.7'],
  'hand.raised': ['M8 13V6.2a1.5 1.5 0 0 1 3 0V11', 'M11 11V4.7a1.5 1.5 0 0 1 3 0V11', 'M14 11V6.2a1.5 1.5 0 0 1 3 0v8.3c0 3.6-2.3 6-5.5 6-2.2 0-3.7-1-4.7-2.6L4.6 13.2a1.5 1.5 0 0 1 2.4-1.8L8 13'],
  iphone: [{ rect: [6, 2.5, 12, 19, 2.6] }, 'M10.3 5.6h3.4'],
  trash: ['M4 6.5h16', 'M9.5 6.5V4.5h5v2', 'M6.4 6.5l.8 12.9a1.3 1.3 0 0 0 1.3 1.1h7a1.3 1.3 0 0 0 1.3-1.1l.8-12.9', 'M10 10.5v6M14 10.5v6'],
  'square.dashed': [{ rect: [4, 4, 16, 16, 3], dash: '3.4 3.2' }],
  bolt: ['M13.2 2.8L5.5 13.4h5.8l-.8 7.8 7.9-10.9h-5.9z'],
  'bolt.slash': ['M13.2 2.8L5.5 13.4h5.8l-.8 7.8 7.9-10.9h-5.9z', 'M4 4l16 16'],
  'camera.rotate': ['M3 9a2 2 0 0 1 2-2h2l1.4-2h7.2L17 7h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9.3 12.6a3 3 0 0 1 5-1.2M9.4 9.9v2.7h2.7', 'M14.7 14.1a3 3 0 0 1-5 1.2M14.6 16.8v-2.7h-2.7'],
  bell: ['M6 17v-6a6 6 0 0 1 12 0v6l1.5 1.5h-15z', 'M10 20.7a2.2 2.2 0 0 0 4 0'],
  calendar: ['M5.5 5.5h13A2 2 0 0 1 20.5 7.5v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z', 'M3.5 10h17M8 3.5v4M16 3.5v4'],
  'arrow.up.circle.fill': [{ solid: { circle: [12, 12, 10] }, cut: 'M12 17V8M8 11.8l4-4 4 4' }],
  'arrow.uturn.backward': ['M8.5 5.5l-4 4 4 4', 'M4.5 9.5H15a5 5 0 0 1 0 10h-3.5'],
  'exclamationmark.triangle': ['M12 4L2.9 19.4A1 1 0 0 0 3.8 21h16.4a1 1 0 0 0 .9-1.6z', 'M12 9.8v4.6', { dot: [12, 17.4] }],
  ellipsis: [{ dot: [5.5, 12], r: 1.7 }, { dot: [12, 12], r: 1.7 }, { dot: [18.5, 12], r: 1.7 }],
  timer: [{ circle: [12, 13.5, 7.5] }, 'M12 13.5V9.7M10 3h4M12 3v3'],
  'wifi.slash': ['M2.5 9.3a14 14 0 0 1 19 0M5.6 12.8a9.5 9.5 0 0 1 12.8 0M8.9 16.2a5 5 0 0 1 6.2 0', { dot: [12, 19.4], r: 1.3 }, 'M4 4l16 16'],
  'arrow.down': ['M12 4v16M6 14l6 6 6-6'],
  'arrow.up': ['M12 20V4M6 10l6-6 6 6'],
  'arrow.left': ['M20 12H4M10 6l-6 6 6 6'],
  'arrow.right': ['M4 12h16M14 6l6 6-6 6'],
  'clock.arrow.circlepath': ['M4 12a8 8 0 1 0 2.4-5.7', 'M4 4.4v4h4', 'M12 8v4.6l3 1.8'],
  checklist: ['M3.5 6.5l1.6 1.6 2.8-3.2M10.5 7h10', 'M3.5 14.5l1.6 1.6 2.8-3.2M10.5 15h10'],
  heart: ['M12 20s-8-4.7-8-10.6A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.4C20 15.3 12 20 12 20z'],
  'line.3.horizontal': ['M4 7h16M4 12h16M4 17h16'],
  'apple.logo': [
    { fill: 'M16.4 12.7c0-2.3 1.9-3.4 2-3.4-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85-.75 0-1.85-.8-3.05-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.35 1.15-.05 1.6-.75 3-.75s1.8.75 3 .7c1.25 0 2-1.15 2.8-2.25.9-1.3 1.25-2.55 1.3-2.6-.05 0-2.45-.95-2.5-3.75zM14.3 5.8c.65-.8 1.1-1.9.95-3-.95.05-2.1.65-2.8 1.45-.6.7-1.15 1.85-1 2.9 1.05.1 2.2-.55 2.85-1.35z' },
  ],
  mic: [{ rect: [9, 3, 6, 11, 3] }, 'M5.8 11.5a6.2 6.2 0 0 0 12.4 0M12 17.7V21'],
  tag: ['M3.5 11.6V5.5a2 2 0 0 1 2-2h6.1a2 2 0 0 1 1.4.6l7.4 7.4a2 2 0 0 1 0 2.8l-6.1 6.1a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1-.6-1.4z', { dot: [8, 8], r: 1.3 }],
  location: ['M20.5 3.5L3.5 10.8l7 2.7 2.7 7z'],
  cloud: ['M7 18.5a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 10.5a4 4 0 0 1-.5 8z'],
  'cloud.rain': ['M7 15.5a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8a4 4 0 0 1-.5 7.5z', 'M8.5 18.5l-1 2.2M12.5 18.5l-1 2.2M16.5 18.5l-1 2.2'],
  'cloud.snow': ['M7 15.5a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8a4 4 0 0 1-.5 7.5z', { dot: [8.5, 19], r: 1 }, { dot: [12.5, 20.2], r: 1 }, { dot: [16.5, 19], r: 1 }],
  'cloud.fog': ['M7 13.5a4.5 4.5 0 0 1-.5-8A6 6 0 0 1 18 6.5a4 4 0 0 1-.5 7z', 'M4 17h16M7 20.5h10'],
  wind: ['M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5', 'M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8', 'M3 16.5h6.5a2.2 2.2 0 1 1-2.2 2.2'],
  'moon.stars': ['M19 14.6A7.5 7.5 0 0 1 9.4 5a7.6 7.6 0 1 0 9.6 9.6z', 'M16.5 3.5v3M15 5h3'],
};

const WEIGHTS = { regular: 1.5, medium: 1.7, semibold: 2, bold: 2.3 } as const;

export function Icon({ name, size = 'regular', color = 'ink', weight = 'medium', scalesWithText, accessibilityLabel }: IconProps) {
  const theme = useTheme();
  const base = typeof size === 'number' ? size : iconSizes[size];
  const pt = scalesWithText ? Math.round(base * Math.min(theme.fontScale, 2)) : base;
  const tint = color in theme.colors ? theme.colors[color as InkColor] : color;
  const resolved = name in sym ? sym[name as SymKey] : name;
  const parts = glyphs[resolved];
  const sw = WEIGHTS[weight];
  const stroke = { stroke: tint, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const maskId = `ic-${resolved.replace(/\./g, '-')}`;
  return (
    <View
      style={{ width: pt, height: pt }}
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={accessibilityLabel === undefined}
      importantForAccessibility={accessibilityLabel === undefined ? 'no-hide-descendants' : 'yes'}
    >
      {parts ? (
        <Svg width={pt} height={pt} viewBox="0 0 24 24">
          {parts.map((p, i) => {
            if (typeof p === 'string') return <Path key={i} d={p} {...stroke} />;
            if ('circle' in p) return <Circle key={i} cx={p.circle[0]} cy={p.circle[1]} r={p.circle[2]} {...stroke} strokeDasharray={p.dash} fill={p.fill ? tint : 'none'} />;
            if ('rect' in p) return <Rect key={i} x={p.rect[0]} y={p.rect[1]} width={p.rect[2]} height={p.rect[3]} rx={p.rect[4]} {...stroke} strokeDasharray={p.dash} />;
            if ('dot' in p) return <Circle key={i} cx={p.dot[0]} cy={p.dot[1]} r={p.r ?? 1.15} fill={tint} />;
            if ('fill' in p) return <Path key={i} d={p.fill} fill={tint} stroke={tint} strokeWidth={0.6} strokeLinejoin="round" />;
            // A solid shape with its mark knocked out (a mask, so whatever is behind shows through).
            return (
              <G key={i}>
                <Defs>
                  <Mask id={maskId} x="0" y="0" width="24" height="24" maskUnits="userSpaceOnUse">
                    <Rect x="0" y="0" width="24" height="24" fill="white" />
                    <Path d={p.cut} stroke="black" strokeWidth={Math.max(sw, 1.9)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Mask>
                </Defs>
                {'circle' in p.solid ? (
                  <Circle cx={p.solid.circle[0]} cy={p.solid.circle[1]} r={p.solid.circle[2]} fill={tint} mask={`url(#${maskId})`} />
                ) : (
                  <Path d={p.solid.path} fill={tint} mask={`url(#${maskId})`} />
                )}
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
