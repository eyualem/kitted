// Numeral — Archivo score/stat numerals (03 §3.3). Scaled sizes follow the largeTitle ramp and
// are capped at 1.6×; `fixedSize` turns scaling off (share card, countdown).
//
// Baseline trick: the CSS uses `line-height: .82` so the numeral's box ends at the baseline.
// RN has no "last text baseline" alignment, so we read the line's descender from onTextLayout
// and pull the box down by it (negative marginBottom). Rows then align with `flex-end` like
// the CSS `.score-row`. Before the first layout we estimate 0.2 em. VERIFY visually on device.

import { useState } from 'react';
import { Text, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import { ARCHIVO_FOR_STAT_NUMERALS, numeralMaxScale, numeralStyle } from '../typography';

export interface NumeralProps {
  children: string;
  /** Base size in pt (typography.numeralSizes). */
  size: number;
  face?: 'score' | 'scoreLight';
  color?: string;
  fixedSize?: boolean;
  /** Pull the box down to the baseline (default true). */
  trimDescender?: boolean;
  strikethrough?: boolean;
  /** Stat numerals (Rotation "37", Lookbook "4 / 19", fits counts, countdown): follow ARCHIVO_FOR_STAT_NUMERALS. */
  stat?: boolean;
  style?: StyleProp<TextStyle>;
  /** Numerals are usually inside a labelled group; hide them by default. */
  accessible?: boolean;
}

export function Numeral({ children, size, face = 'score', color, fixedSize, trimDescender = true, strikethrough, stat, style, accessible = false }: NumeralProps) {
  const theme = useTheme();
  const scale = fixedSize ? 1 : Math.min(theme.fontScale, numeralMaxScale);
  const [descender, setDescender] = useState<number | null>(null);
  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const line = e.nativeEvent.lines[0];
    if (line && line.descender !== descender) setDescender(line.descender);
  };
  const estimated = descender ?? size * scale * 0.2;
  return (
    <Text
      allowFontScaling={!fixedSize}
      maxFontSizeMultiplier={numeralMaxScale}
      dynamicTypeRamp="largeTitle"
      numberOfLines={1}
      onTextLayout={trimDescender ? onTextLayout : undefined}
      accessible={accessible}
      importantForAccessibility={accessible ? 'yes' : 'no'}
      style={[
        numeralStyle(size, face, theme.archivoLoaded && (!stat || ARCHIVO_FOR_STAT_NUMERALS)),
        { color: color ?? theme.colors.ink },
        trimDescender ? { marginBottom: -estimated } : null,
        strikethrough
          ? { textDecorationLine: 'line-through', textDecorationColor: theme.colors.ink3, textDecorationStyle: 'solid' }
          : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
