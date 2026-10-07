// Seam (`.seam`) — the dashed "stitching" divider between card SECTIONS (03 §1, §4.3).
// 1 pt, 5 on / 4 off, inkFaint @ 45%, inset 18. Hairlines (1 pt `line`) separate rows WITHIN
// a section; seams separate sections.
//
// Why dash segments instead of borderStyle: 'dashed': RN's dashed borders don't let you set
// the dash/gap lengths, and single-side dashed borders render inconsistently on iOS. ~40 tiny
// views per seam is cheap. Decorative, so hidden from VoiceOver.

import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme';
import { seam, size } from '../tokens';

export interface SeamProps {
  inset?: number;
  /** Default inkFaint; the share card's band uses fixed.copper. */
  color?: string;
  /** Set false on the share band, which draws the seam at full opacity. */
  faded?: boolean;
}

export function Seam({ inset = size.seamInset, color, faded = true }: SeamProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const count = width > 0 ? Math.floor((width + seam.gap) / (seam.dash + seam.gap)) : 0;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View
      onLayout={onLayout}
      style={{
        height: seam.thickness,
        marginHorizontal: inset,
        flexDirection: 'row',
        gap: seam.gap,
        overflow: 'hidden',
        opacity: faded ? seam.opacity : 1,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: seam.dash, height: seam.thickness, backgroundColor: color ?? colors.inkFaint }} />
      ))}
    </View>
  );
}

/** A plain 1 pt `line` rule between rows inside a section (03 §4.3). The mockup draws 1 pt, not a hairline. */
export function RowDivider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: 1, marginLeft: inset, backgroundColor: colors.line }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
