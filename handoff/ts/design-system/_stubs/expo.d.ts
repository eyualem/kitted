// TEMPORARY STUB — only so ts/design-system type-checks before the Expo packages are
// installed. Modelled on the Expo SDK 57 docs (docs.expo.dev, read Oct 6 2026):
//   expo-symbols  https://docs.expo.dev/versions/latest/sdk/symbols/
//   expo-glass-effect  https://docs.expo.dev/versions/latest/sdk/glass-effect/
//   expo-blur  https://docs.expo.dev/versions/latest/sdk/blur-view/
//   expo-font  https://docs.expo.dev/versions/latest/sdk/font/
// Real `SFSymbol` is a string-literal union of every SF Symbol name (sf-symbols-typescript);
// here it's `string`, so a misspelled name only fails once the real package is installed.
// DELETE THIS FOLDER (_stubs/) once the real packages are installed in the Expo app.

declare module 'expo-symbols' {
  import type { ReactElement, ReactNode } from 'react';
  import type { ColorValue, ViewProps } from 'react-native';

  export type SFSymbol = string;
  export type SymbolWeight =
    | 'unspecified'
    | 'ultraLight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';
  export type SymbolScale = 'default' | 'unspecified' | 'small' | 'medium' | 'large';
  export type SymbolType = 'monochrome' | 'hierarchical' | 'palette' | 'multicolor';

  export type SymbolViewProps = ViewProps & {
    name: SFSymbol | { ios: SFSymbol; android?: string; web?: string };
    size?: number;
    type?: SymbolType;
    tintColor?: ColorValue | null;
    weight?: SymbolWeight;
    scale?: SymbolScale;
    colors?: ColorValue | ColorValue[];
    fallback?: ReactNode;
  };
  export const SymbolView: (props: SymbolViewProps) => ReactElement | null;
}

declare module 'expo-glass-effect' {
  import type { ReactElement } from 'react';
  import type { ViewProps } from 'react-native';

  export type GlassStyle = 'clear' | 'regular' | 'none';
  export interface GlassEffectStyleConfig {
    style: GlassStyle;
    animate?: boolean;
    animationDuration?: number;
  }
  export type GlassViewProps = ViewProps & {
    glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
    tintColor?: string;
    isInteractive?: boolean;
    colorScheme?: 'auto' | 'light' | 'dark';
  };
  export const GlassView: (props: GlassViewProps) => ReactElement | null;
  export type GlassContainerProps = ViewProps & { spacing?: number };
  export const GlassContainer: (props: GlassContainerProps) => ReactElement | null;
  export function isLiquidGlassAvailable(): boolean;
  export function isGlassEffectAPIAvailable(): boolean;
}

declare module 'expo-blur' {
  import type { ReactElement } from 'react';
  import type { ViewProps } from 'react-native';

  export type BlurTint =
    | 'light'
    | 'dark'
    | 'default'
    | 'extraLight'
    | 'regular'
    | 'prominent'
    | 'systemUltraThinMaterial'
    | 'systemThinMaterial'
    | 'systemMaterial'
    | 'systemThickMaterial'
    | 'systemChromeMaterial';
  export type BlurViewProps = ViewProps & {
    intensity?: number;
    tint?: BlurTint;
  };
  export const BlurView: (props: BlurViewProps) => ReactElement | null;
}

declare module 'expo-font' {
  export type FontSource = string | number | { uri: string };
  export function useFonts(map: Record<string, FontSource>): [boolean, Error | null];
  export function getLoadedFonts(): string[];
  export function loadAsync(map: Record<string, FontSource>): Promise<void>;
}
