// FramingOverlay (02 D5, 03 camera): a head ellipse + body outline over the detected body box,
// white 2 pt; dashed 7/5 while searching, solid when good. Shoe snap: a dashed rectangle over
// the lower part of the preview, labeled. Decorative (the tip pill carries the words).
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import { KText, fixed } from '@/design-system';
import type { ViewBox } from '../../../modules/kitted-vision';

export function BodyOutline({ box, solid, width, height }: { box: ViewBox; solid: boolean; width: number; height: number }) {
  const dash = solid ? undefined : '7 5';
  // Mockup 5: a tall head oval (≈ 1.55 : 1) over a narrow, rounded body outline.
  const headW = box.width * 0.33;
  const headH = Math.min(box.height * 0.16, headW * 1.55);
  const bodyTop = box.y + headH * 1.05;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} style={{ shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } }}>
        <Ellipse cx={box.x + box.width / 2} cy={box.y + headH / 2} rx={headW / 2} ry={headH / 2} stroke={fixed.white} strokeWidth={2} fill="none" />
        {/* Keyed by state: react-native-svg keeps an old dash pattern when the prop is removed. */}
        <Rect
          key={solid ? 'solid' : 'dashed'}
          x={box.x}
          y={bodyTop}
          width={box.width}
          height={Math.max(0, box.y + box.height - bodyTop)}
          rx={box.width * 0.22}
          stroke={fixed.white}
          strokeWidth={2}
          strokeDasharray={dash}
          fill="none"
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
