// WovenLabel (`.woven`) — the wordmark as a woven neck label (03 §1, §3.3).
// Archivo Expanded Bold, tracked 0.34 em, onDark on indigo #1B2340 (or onPrimary on copper for
// "KITTED PRO"), radius 2, a dashed vertical stitch 7 pt in from each end (5 pt small).
// `pro` (#246): You's plan row: the indigo label with copper stitches, so copper still means "score moved"
// everywhere else and Pro reads as status, not a score.
// It's a logo: fixed size (allowFontScaling false), and VoiceOver reads "Kitted", not letters.

import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme';
import { fixed, radius } from '../tokens';
import { wordmark, wordmarkStyle } from '../typography';

export interface WovenLabelProps {
  text?: string;
  size?: 'regular' | 'small';
  tone?: 'indigo' | 'copper' | 'pro';
  /** What VoiceOver says ("Kitted", "Kitted Pro"). */
  spokenLabel?: string;
}

export function WovenLabel({ text = 'KITTED', size = 'regular', tone = 'indigo', spokenLabel = 'Kitted' }: WovenLabelProps) {
  const { colors, archivoLoaded } = useTheme();
  const [height, setHeight] = useState(0);
  const spec = wordmark[size];
  const bg = tone === 'copper' ? colors.accent : fixed.label;
  const fg = tone === 'copper' ? colors.onPrimary : fixed.onDark;
  const stitchColor = tone === 'pro' ? fixed.copper : fg;
  const stitchWidth = tone === 'pro' ? 1.5 : 1;
  const stitchOpacity = tone === 'pro' ? 1 : 0.55;
  const stitchInset = size === 'regular' ? 7 : 5;
  const pad = size === 'regular' ? { paddingTop: 8, paddingBottom: 8, paddingLeft: 25, paddingRight: 22 } : { paddingTop: 6, paddingBottom: 6, paddingLeft: 18, paddingRight: 16 };
  const dashCount = height > 6 ? Math.floor((height - 6 + 2) / 4) : 0; // 2 on, 2 off, 3 pt in from top/bottom

  const stitch = (side: 'left' | 'right') => (
    <View style={[{ position: 'absolute', top: 3, bottom: 3, width: stitchWidth, gap: 2, overflow: 'hidden' }, side === 'left' ? { left: stitchInset } : { right: stitchInset }]}>
      {Array.from({ length: dashCount }, (_, i) => (
        <View key={i} style={{ width: stitchWidth, height: 2, backgroundColor: stitchColor, opacity: stitchOpacity }} />
      ))}
    </View>
  );

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
      style={[{ alignSelf: 'flex-start', backgroundColor: bg, borderRadius: radius.label, borderCurve: 'continuous' }, pad]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={spokenLabel}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        // Natural line height (the CSS uses line-height 1). Compare the total height with the
        // mockup (28 pt regular) on device and trim the vertical padding if it runs tall.
        style={[wordmarkStyle(spec.fontSize, spec.letterSpacingEm, archivoLoaded), { color: fg }]}
      >
        {text}
      </Text>
      {stitch('left')}
      {stitch('right')}
    </View>
  );
}
