// Icon — SF Symbols through expo-symbols' SymbolView (03 §7).
// Sizes follow the mockup's icon classes: .ic 26 → 'large', .ic.s 19.5 → 'regular' (20),
// .ic.xs 15.5 → 'small' (16). Weight 'medium' matches the mockup's 1.7 stroke.
// SymbolView takes a fixed point size, so icons that sit in text rows pass `scalesWithText`
// to grow with the font scale (capped at 2× so rows don't explode at AX5).
// Names are the same SF Symbol strings as the SwiftUI spec (symbols.ts).

import { View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useTheme } from '../theme';
import { sym, type SymKey } from '../symbols';
import type { InkColor } from '../typography';

export type SymbolName = Extract<SymbolViewProps['name'], string>;

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

export function Icon({ name, size = 'regular', color = 'ink', weight = 'medium', scalesWithText, accessibilityLabel }: IconProps) {
  const theme = useTheme();
  const base = typeof size === 'number' ? size : iconSizes[size];
  const pt = scalesWithText ? Math.round(base * Math.min(theme.fontScale, 2)) : base;
  const tint = color in theme.colors ? theme.colors[color as InkColor] : color;
  const resolved = (name in sym ? sym[name as SymKey] : name) as SymbolName;
  return (
    <SymbolView
      name={resolved}
      size={pt}
      weight={weight}
      tintColor={tint}
      type="monochrome"
      // SF Symbols exist only on Apple platforms. On the web preview (and Android) SymbolView
      // renders `fallback`; an empty box of the same size keeps layouts stable there.
      fallback={<View style={{ width: pt, height: pt }} />}
      style={{ width: pt, height: pt }}
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={accessibilityLabel === undefined}
      importantForAccessibility={accessibilityLabel === undefined ? 'no-hide-descendants' : 'yes'}
    />
  );
}
