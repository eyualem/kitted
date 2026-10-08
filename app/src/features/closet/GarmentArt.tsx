// The detailed closet graphic (#91): the existing GarmentIcon, unchanged, in the piece's exact shade, with an
// overlay in the same 60 × 60 viewBox for what tells his pieces apart (artSpec.ts decides what's drawn).
// Glyph colors follow the fill (light marks on dark pieces, dark on light) so they read in both themes; the
// brand is a plain neutral mark or its word, never a logo shape. Decorative: the parent carries VoiceOver
// (spec.a11y).
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { GarmentIcon, shade } from '@/design-system';
import { garmentEdge, luminance } from '@/design-system/components/GarmentIcon';
import { useTheme } from '@/design-system/theme';
import type { ArtSpec, Glyph } from './artSpec';

const TEE = 'M21,9 L13,12 L5,20 L10,27 L16,24.5 L16,52 L44,52 L44,24.5 L50,27 L55,20 L47,12 L39,9 Q30,16 21,9 Z';
const LS = 'M21,9 L13,12 L9,20 L5,50 L12,51 L16,29 L16,53 L44,53 L44,29 L48,51 L55,50 L51,20 L47,12 L39,9 Q30,15 21,9 Z';
const PANTS = 'M17,6 L43,6 L45,55 L34,55 L30,21 L26,55 L15,55 Z';
const SNEAKER = 'M5,42 Q6,32 15,30 L27,27 Q31,33 41,35 Q53,37 55,43 L55,45 L5,45 Z';
const BOOT = 'M13,12 L30,12 L31,33 Q46,35 53,40 L54,45 L11,45 L11,30 Z';
const LOAFER = 'M5,41 Q8,32 20,32 L33,32 Q47,33 53,38 L55,45 L5,45 Z';

function silhouette(spec: ArtSpec): string {
  if (spec.shape === 'bottom') return PANTS;
  if (spec.shape === 'shoe') return spec.icon === 'boot' ? BOOT : spec.icon === 'loafer' ? LOAFER : SNEAKER;
  return spec.icon === 'tee' ? TEE : LS;
}

/** A fixed speckle (deterministic: the same tile every time). */
const SPECKLE: readonly [number, number][] = [
  [20, 16], [27, 14], [35, 17], [41, 21], [23, 23], [31, 25], [38, 28], [19, 31], [26, 33], [34, 35], [41, 38], [22, 41],
  [29, 43], [37, 46], [20, 48], [32, 50], [42, 48], [8, 40], [52, 38], [11, 30], [49, 29],
];

export function GarmentArt({ spec, size }: { spec: ArtSpec; size: number }) {
  const { scheme } = useTheme();
  const raw = useId();
  const clipId = `ga${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const c = spec.hex;
  const edge = garmentEdge(c, scheme);
  const dark = luminance(c) < 0.2;
  const mark = dark ? shade(c, 0.55) : shade(c, -0.45);
  const soft = shade(c, dark ? 0.12 : -0.08);
  const st = { stroke: edge, strokeWidth: 1, strokeLinejoin: 'round' as const, fill: 'none' };
  const top = spec.shape === 'top';
  const hood = spec.icon === 'hoodie';
  const glyph = (g: Glyph) => {
    switch (g) {
      case 'fullZip': {
        const y0 = hood ? 20 : 13;
        return (
          <G key={g}>
            <Path d={`M30,${y0} V53`} stroke={mark} strokeWidth={1.1} />
            <Rect x={28.9} y={y0} width={2.2} height={3.4} rx={0.6} fill={mark} />
          </G>
        );
      }
      case 'halfZip':
        return (
          <G key={g}>
            <Path d="M30,12 V27" stroke={mark} strokeWidth={1.1} />
            <Rect x={28.9} y={12.5} width={2.2} height={3.2} rx={0.6} fill={mark} />
          </G>
        );
      case 'pouch':
        return <Path key={g} d="M21,37 L39,37 L41,48 L19,48 Z" {...st} />;
      case 'drawstrings':
        return (
          <G key={g}>
            <Path d="M27.2,18 L27.6,27 M32.8,18 L32.4,27" stroke={mark} strokeWidth={0.9} strokeLinecap="round" />
            <Circle cx={27.6} cy={27.6} r={0.9} fill={mark} />
            <Circle cx={32.4} cy={27.6} r={0.9} fill={mark} />
          </G>
        );
      case 'chestPocket':
        return <Rect key={g} x={33.5} y={21} width={6.5} height={5.5} rx={0.6} fill={soft} stroke={edge} strokeWidth={0.9} />;
      case 'cuffs':
        return top
          ? <Path key={g} d="M5.5,47.6 L12.3,48.5 M54.5,47.6 L47.7,48.5 M16.4,50.6 H43.6" stroke={edge} strokeWidth={2} />
          : <Path key={g} d="M15.2,51.6 H26.4 M33.6,51.6 H44.8" stroke={edge} strokeWidth={2} />;
      case 'collarButtons':
        return (
          <G key={g}>
            <Path d="M23.5,10.5 L30,15.5 L36.5,10.5" {...st} strokeWidth={1.1} />
            {[22, 30, 38].map((y) => <Circle key={y} cx={30} cy={y} r={0.85} fill={mark} />)}
          </G>
        );
      case 'sideStripe':
        return top
          ? <Path key={g} d="M14.2,13.5 L7.6,48.6 M45.8,13.5 L52.4,48.6" stroke={mark} strokeWidth={1.5} />
          : <Path key={g} d="M17.6,11 L15.9,54.4 M42.4,11 L44.1,54.4" stroke={mark} strokeWidth={1.5} />;
      case 'beltLoops':
        return <Path key={g} d="M21,6 V10.5 M27,6 V10.5 M33,6 V10.5 M39,6 V10.5" stroke={edge} strokeWidth={1.3} />;
      case 'waistDrawstring':
        return (
          <G key={g}>
            <Path d="M29.2,10.5 L28.2,15.5 M30.8,10.5 L31.8,15.5" stroke={mark} strokeWidth={0.9} strokeLinecap="round" />
            <Circle cx={28.1} cy={16} r={0.8} fill={mark} />
            <Circle cx={31.9} cy={16} r={0.8} fill={mark} />
          </G>
        );
      case 'cargoPockets':
        return (
          <G key={g}>
            <Rect x={16.6} y={28} width={8} height={9} rx={1} fill={soft} stroke={edge} strokeWidth={0.9} />
            <Rect x={35.4} y={28} width={8} height={9} rx={1} fill={soft} stroke={edge} strokeWidth={0.9} />
          </G>
        );
      case 'rips':
        return <Path key={g} d="M18.6,33 H23 M19.2,35.6 H22.4 M37,33 H41.4 M37.6,35.6 H40.8" stroke="#F2F0EA" strokeWidth={1} strokeLinecap="round" opacity={0.9} />;
      case 'fade':
        return (
          <G key={g} opacity={0.22}>
            <Ellipse cx={22} cy={24} rx={3.6} ry={8} fill="#FFFFFF" />
            <Ellipse cx={38} cy={24} rx={3.6} ry={8} fill="#FFFFFF" />
          </G>
        );
      case 'graphic':
        return <Rect key={g} x={24} y={21} width={12} height={10} rx={1.6} fill={mark} opacity={0.55} />;
      case 'stripes':
        return <Path key={g} d="M4,20 H56 M4,26 H56 M4,32 H56 M4,38 H56 M4,44 H56" stroke={mark} strokeWidth={1.2} opacity={0.55} clipPath={`url(#${clipId})`} />;
      case 'checks':
        return <Path key={g} d="M22,4 V56 M30,4 V56 M38,4 V56 M12,4 V56 M48,4 V56 M4,22 H56 M4,32 H56 M4,42 H56" stroke={mark} strokeWidth={1} opacity={0.45} clipPath={`url(#${clipId})`} />;
      case 'chunkySole':
        return spec.icon === 'boot' || spec.icon === 'loafer'
          ? <Rect key={g} x={9.5} y={45} width={46} height={6.5} rx={1.5} fill="#2A1D14" />
          : <Rect key={g} x={3.5} y={45} width={53} height={6.5} rx={2.2} fill={spec.icon === 'runner' ? '#ECECE8' : '#FFFFFF'} stroke="#C9C9C4" strokeWidth={0.9} />;
    }
  };
  const brand = spec.brand;
  const brandPos = spec.shape === 'shoe' ? { x: 30, y: 39 } : spec.shape === 'bottom' ? { x: 37, y: 13.5 } : { x: 36.5, y: 19 };
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
      <GarmentIcon type={spec.icon} color={c} size={size} />
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <Svg width={size} height={size} viewBox="0 0 60 60">
          <Defs>
            <ClipPath id={clipId}>
              <Path d={silhouette(spec)} />
            </ClipPath>
          </Defs>
          {spec.fabric === 'heather' ? (
            <G clipPath={`url(#${clipId})`} opacity={0.4}>
              {SPECKLE.map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.38} fill={mark} />)}
            </G>
          ) : spec.fabric === 'twill' ? (
            <Path
              d="M10,20 L30,0 M10,28 L38,0 M10,36 L46,0 M10,44 L54,0 M10,52 L56,6 M14,56 L56,14 M22,56 L56,22 M30,56 L56,30 M38,56 L56,38 M46,56 L56,46"
              stroke={mark} strokeWidth={0.4} opacity={0.16} clipPath={`url(#${clipId})`}
            />
          ) : null}
          {spec.glyphs.map(glyph)}
          {brand ? (
            brand.mark === 'word' ? (
              <SvgText x={spec.shape === 'top' ? 30 : brandPos.x} y={spec.shape === 'top' ? 31 : brandPos.y + 1} fontSize={spec.shape === 'bottom' ? 2.4 : 3.4} fontWeight="600" fill={mark} textAnchor="middle">
                {brand.word}
              </SvgText>
            ) : (
              <Rect x={brandPos.x - 2} y={brandPos.y - 1.1} width={4} height={2.2} rx={1.1} fill={mark} opacity={0.8} />
            )
          ) : null}
        </Svg>
      </View>
    </View>
  );
}
