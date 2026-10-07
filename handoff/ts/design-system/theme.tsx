// theme.tsx — ThemeProvider + useTheme() (03 §9 dark mode, §5 accessibility rules).
//
// - Follows the system appearance via useColorScheme(). The in-app Appearance setting
//   (You › Settings › Appearance: System / Light / Dark) should call setAppAppearance() below,
//   which uses Appearance.setColorScheme so native chrome (tab bar, sheets, glass, alerts)
//   switches too, and useColorScheme() then reports the override.
// - Increase Contrast = AccessibilityInfo "darker system colors" → tokens' high-contrast set.
// - Reduce Motion / Reduce Transparency / Bold Text are tracked here once at the root and
//   shared with nested providers (no duplicate listeners).
// - Font scale comes from useWindowDimensions().fontScale (reactive; PixelRatio.getFontScale()
//   is the same number but doesn't re-render on change).
// - <FixedDark> forces the dark tokens for the camera, share card and lock-screen previews.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Appearance, useColorScheme, useWindowDimensions } from 'react-native';
import { fixed, resolveColors, type ColorScheme, type ColorTokens } from './tokens';
import { accessibilitySizeThreshold } from './typography';
import { isArchivoLoaded } from './fonts';

export interface A11ySettings {
  reduceMotion: boolean;
  reduceTransparency: boolean;
  boldText: boolean;
  /** iOS Increase Contrast. */
  highContrast: boolean;
}

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  fixed: typeof fixed;
  a11y: A11ySettings;
  /** RN font-scale multiplier (1 at the default size; AX1 ≈ 1.79, AX5 ≈ 3.57). */
  fontScale: number;
  /** SwiftUI's dynamicTypeSize.isAccessibilitySize: rows become stacks. */
  isAccessibilitySize: boolean;
  /** Whether the three Archivo faces are registered (typography falls back if not). */
  archivoLoaded: boolean;
  /** True inside <FixedDark>. */
  isFixedDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

const defaultA11y: A11ySettings = {
  reduceMotion: false,
  reduceTransparency: false,
  boldText: false,
  highContrast: false,
};

/** Subscribes to the four iOS accessibility toggles. Use once (ThemeProvider does). */
function useA11ySettings(enabled: boolean): A11ySettings {
  const [state, setState] = useState<A11ySettings>(defaultA11y);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const set = (patch: Partial<A11ySettings>) => {
      if (alive) setState((s) => ({ ...s, ...patch }));
    };
    Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      AccessibilityInfo.isReduceTransparencyEnabled(),
      AccessibilityInfo.isBoldTextEnabled(),
      AccessibilityInfo.isDarkerSystemColorsEnabled(),
    ])
      .then(([reduceMotion, reduceTransparency, boldText, highContrast]) =>
        set({ reduceMotion, reduceTransparency, boldText, highContrast }),
      )
      .catch(() => {});

    const subs = [
      AccessibilityInfo.addEventListener('reduceMotionChanged', (v: boolean) => set({ reduceMotion: v })),
      AccessibilityInfo.addEventListener('reduceTransparencyChanged', (v: boolean) => set({ reduceTransparency: v })),
      AccessibilityInfo.addEventListener('boldTextChanged', (v: boolean) => set({ boldText: v })),
      AccessibilityInfo.addEventListener('darkerSystemColorsChanged', (v: boolean) => set({ highContrast: v })),
    ];
    return () => {
      alive = false;
      subs.forEach((s) => s.remove());
    };
  }, [enabled]);

  return state;
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Force a scheme for this subtree (use <FixedDark> for the always-dark surfaces). */
  scheme?: ColorScheme;
}

export function ThemeProvider({ children, scheme: forced }: ThemeProviderProps) {
  const parent = useContext(ThemeContext);
  const systemScheme = useColorScheme();
  const ownA11y = useA11ySettings(parent === null);
  const { fontScale } = useWindowDimensions();

  const a11y = parent ? parent.a11y : ownA11y;
  const scheme: ColorScheme = forced ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const archivoLoaded = parent ? parent.archivoLoaded || isArchivoLoaded() : isArchivoLoaded();

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: resolveColors(scheme, a11y.highContrast),
      fixed,
      a11y,
      fontScale,
      isAccessibilitySize: fontScale >= accessibilitySizeThreshold,
      archivoLoaded,
      isFixedDark: forced === 'dark' || (parent?.isFixedDark ?? false),
    }),
    [scheme, a11y, fontScale, archivoLoaded, forced, parent],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Always-dark subtree: camera, share card + share screen, lock-screen previews (03 §2.3, §9). */
export function FixedDark({ children }: { children: ReactNode }) {
  return <ThemeProvider scheme="dark">{children}</ThemeProvider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme() must be used inside <ThemeProvider> (wrap the root layout).');
  return t;
}

export type AppAppearance = 'system' | 'light' | 'dark';

/**
 * You › Settings › Appearance. Persist the choice yourself (e.g. expo-sqlite/kv-store or
 * AsyncStorage) and call this at launch. VERIFY: on recent RN the "follow system" value is
 * 'unspecified' (older versions took null).
 */
export function setAppAppearance(choice: AppAppearance): void {
  Appearance.setColorScheme(choice === 'system' ? 'unspecified' : choice);
}
