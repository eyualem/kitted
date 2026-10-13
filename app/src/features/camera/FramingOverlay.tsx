// FramingOverlay (02 D5, 03 camera): a head outline + body outline over the detected body box,
// white 2 pt; dashed 7/5 while searching, solid when good. The head is drawn exactly like the
// body (same stroke, same dash, no fill): Kitted never judges the face, so the guide mustn't
// spotlight it. The outline stays inside the band between the top bar and the bottom controls.
// Shoe snap: a dashed rectangle over the lower part of the preview, labeled. Decorative (the tip
// pill carries the words).
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import { KText, fixed } from '@/design-system';
import type { ViewBox } from '../../../modules/kitted-vision';

export function BodyOutline({
  box, solid, width, height, minY = 0, maxY = height,
}: { box: ViewBox; solid: boolean; width: number; height: number; minY?: number; maxY?: number }) {
  const dash = solid ? undefined : '7 5';
  // Clamp the detected box into the free band, so the guide never runs behind the controls.
  const y0 = Math.max(box.y, minY);
  const y1 = Math.max(y0, Math.min(box.y + box.height, maxY));
  const h = y1 - y0;
  // Mockup 5: a tall head oval (≈ 1.55 : 1) over a narrow, rounded body outline.
  const headW = box.width * 0.33;
  const headH = Math.min(h * 0.16, headW * 1.55);
  const bodyTop = y0 + headH * 1.05;
  const stroke = { stroke: fixed.white, strokeWidth: 2, strokeDasharray: dash, fill: 'none' } as const;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} style={{ shadowColor: fixed.black, shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } }}>
        {/* Keyed by state: react-native-svg keeps an old dash pattern when the prop is removed. */}
        <Ellipse key={solid ? 'head-solid' : 'head-dashed'} cx={box.x + box.width / 2} cy={y0 + headH / 2} rx={headW / 2} ry={headH / 2} {...stroke} />
        <Rect
          key={solid ? 'solid' : 'dashed'}
          x={box.x}
          y={bodyTop}
          width={box.width}
          height={Math.max(0, y1 - bodyTop)}
          rx={box.width * 0.22}
          {...stroke}
        />
      </Svg>
    </View>
  );
}

/** Shoe snap (S9): a dashed box across the lower `share` of the preview. */
export function LowerGuide({ share, label, width, height }: { share: number; label: string; width: number; height: number }) {
  const top = height * (1 - share) - 120;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Rect x={24} y={top} width={width - 48} height={height * share - 40} rx={24} stroke={fixed.white} strokeWidth={2} strokeDasharray="7 5" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', top: top + 14, left: 0, right: 0, alignItems: 'center' }}>
        <KText variant="footnote" weight="600" color={fixed.white}>
          {label}
        </KText>
      </View>
    </View>
  );
}
