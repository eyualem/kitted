// tokens.ts — Kitted design tokens (React Native / Expo, iOS first).
//
// Spec:            /Users/eyu/Desktop/files/Kitted/handoff/03-design-system.md  (§2 colors, §4 spacing/radii, §6 score words)
// Visual source:   /Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html  (inside .phone, 1 CSS px = 1 pt)
//
// Every value here is copied from 03. The mockup values that failed WCAG contrast are
// already replaced with the FIXED values (ink3, accentSoft, the photo tags…). Don't
// "restore" them from the CSS. Colors are plain strings (hex or rgba) so they work in any
// style prop, in expo-symbols' tintColor and in expo-glass-effect's tintColor.

export type ColorScheme = 'light' | 'dark';

/** The app tokens that follow the system appearance (03 §2.1). Token names drop the Swift `k` prefix. */
export interface ColorTokens {
  /** Screen background: chalk / night. */
  bg: string;
  /** Cards, sheets, chips, composer field, plan rows. */
  surface: string;
  /** Secondary buttons, tiles, nav circles, stepper, bar tracks, empty slots. */
  surface2: string;
  /** Primary text, score numeral, selected chip fill, filled fix badge. */
  ink: string;
  /** Secondary text, verdict line, ledger labels, fix-row detail. */
  ink2: string;
  /** Tertiary text. FIXED (mockup #848A99 / #6E7484 failed 4.5:1). Text-safe on every surface. */
  ink3: string;
  /** The mockup's old ink-3. DECORATION ONLY (seams, ghost dashes, disabled glyphs). Never text. */
  inkFaint: string;
  /** Hairlines, card and chip borders. */
  line: string;
  /** Copper rivet: the one accent (principle 1). */
  accent: string;
  /** Tint behind accent text. FIXED light alpha 11% → 9%. */
  accentSoft: string;
  /** Primary button fill, composer camera circle, "Check my fit". */
  primary: string;
  /** Text and icons on `primary` AND on `accent`. */
  onPrimary: string;
  /** His chat bubble. */
  me: string;
  /** Text in his bubble. */
  onMe: string;
  /** Ledger "+", "Closet updated", camera OK. Always with "+" or an icon. */
  good: string;
  /** Warnings only, always with `exclamationmark.triangle`. */
  caution: string;
  /** Scrim behind custom overlays (system sheets bring their own). */
  dim: string;
}

export const lightColors: ColorTokens = {
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  surface2: '#ECEEF1',
  ink: '#121628',
  ink2: '#585E70',
  ink3: '#646A7A',
  inkFaint: '#848A99',
  line: '#E0E3E8',
  accent: '#9C5326',
  accentSoft: 'rgba(156, 83, 38, 0.09)',
  primary: '#121628',
  onPrimary: '#FFFFFF',
  me: '#1B2340',
  onMe: '#F2F3F7',
  good: '#2B7651',
  caution: '#8A5A00',
  dim: 'rgba(10, 12, 20, 0.42)',
};

export const darkColors: ColorTokens = {
  bg: '#0C0E14',
  surface: '#171A23',
  surface2: '#21252F',
  ink: '#ECEEF3',
  ink2: '#A1A7B5',
  ink3: '#9096A5',
  inkFaint: '#6E7484',
  line: '#2A2F3B',
  accent: '#DE9762',
  accentSoft: 'rgba(222, 151, 98, 0.15)',
  primary: '#ECEEF3',
  onPrimary: '#0C0E14',
  me: '#2A3150',
  onMe: '#EEF0F6',
  good: '#5DC08F',
  caution: '#E2B356',
  dim: 'rgba(0, 0, 0, 0.55)',
};

/**
 * Increase Contrast (iOS Settings › Accessibility › Display & Text Size › Increase Contrast).
 * React Native exposes it as "darker system colors": AccessibilityInfo.isDarkerSystemColorsEnabled()
 * and the 'darkerSystemColorsChanged' event. 03 §2.1: ink3 becomes ink2, line darkens.
 */
export const highContrastOverrides: Record<ColorScheme, Partial<ColorTokens>> = {
  light: { ink3: '#585E70', line: '#B9BEC8' },
  dark: { ink3: '#A1A7B5', line: '#474D5C' },
};

export function resolveColors(scheme: ColorScheme, highContrast: boolean): ColorTokens {
  const base = scheme === 'dark' ? darkColors : lightColors;
  return highContrast ? { ...base, ...highContrastOverrides[scheme] } : base;
}

/**
 * Always-dark palette (03 §2.3): camera, lock-screen previews, share card. Identical in both
 * appearances. Wrap those trees in <FixedDark> (theme.tsx) and use these for the photo-overlay bits.
 */
export const fixed = {
  /** Share screen background. */
  night: '#08090D',
  /** Share-card band; ink on white camera pills. */
  indigo: '#121628',
  /** Woven label, stylist avatar "K", app icon base. */
  label: '#1B2340',
  /** Woven-label text. */
  onDark: '#EEF0F5',
  /** Copper on dark: share-band delta, stitches, camera scan line. */
  copper: '#DE9762',
  /** Camera tip pill, "Only this is sent" (white @ 92%). */
  lightPill: 'rgba(255, 255, 255, 0.92)',
  /** FIXED: backing for text on photos (mockup .78 → .80). */
  photoTag: 'rgba(14, 17, 28, 0.80)',
  /** FIXED: pending detection-tag text ("Shoes…"), was white @ 75%. */
  photoTagDimText: '#C3C7D2',
  /** Share-card occasion pill backing, FIXED 55% → 80%. */
  sharePill: 'rgba(18, 22, 40, 0.80)',
  /** Countdown circle backing, FIXED 35% → 60% (plus blur). */
  countdownBacking: 'rgba(10, 12, 20, 0.60)',
  /** Camera mode-switch backing, FIXED 40% → 60%; label white @ 90%. */
  modeSwitchBacking: 'rgba(0, 0, 0, 0.60)',
  modeSwitchLabel: 'rgba(255, 255, 255, 0.90)',
  /** Glass tint on camera circles (expo-glass-effect tintColor). FIXED from white @ 16%. */
  glassTint: 'rgba(0, 0, 0, 0.30)',
  /** Reduce Transparency (or no Liquid Glass) replacement for camera glass. */
  glassFallback: 'rgba(0, 0, 0, 0.60)',
  /** Check icon on the white camera pill. */
  good: '#2B7651',
  /** Detection-tag border. */
  photoTagBorder: 'rgba(255, 255, 255, 0.18)',
  /** Share watermark (white @ 60%). */
  watermark: 'rgba(255, 255, 255, 0.60)',
  white: '#FFFFFF',
} as const;

/**
 * Camera scrims (03 §2.3). Every camera contrast number assumes these are drawn.
 * CSS gradient strings for RN's `experimental_backgroundImage` style (New Architecture; the
 * reactnative.dev example spells it `backgroundImage`, so VERIFY the prop name on your RN
 * version). `expo-linear-gradient` is the drop-in alternative if that prop misbehaves.
 */
export const cameraScrims = {
  /** Top: black 45% → clear over the top 22% of the screen. */
  top: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%)',
  /** Bottom: clear at 70% → black 70% at the bottom. */
  bottom: 'linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(0,0,0,0.70) 100%)',
} as const;

// ---------------------------------------------------------------------------------------
// Spacing, radii, sizes (03 §4; 4-pt grid; odd CSS values snapped)

export const space = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  /** Screen side margin (thread, tab pages, sheets). */
  gutter: 16,
  /** Welcome + paywall. */
  heroGutter: 24,
  /** .card-pad 14px 16px */
  cardPadH: 16,
  cardPadV: 14,
  /** Between cards / thread items. */
  stack: 12,
  /** Between chips, buttons, quick-starts. */
  rowGap: 8,
} as const;

/** Always pair a radius with `borderCurve: 'continuous'` (iOS squircle corners). */
export const radius = {
  card: 26,
  /** Small card, plan row, "today" row, read-row list frame. */
  cardSmall: 20,
  /** Closet/outfit tile, share card, quick card. */
  tile: 18,
  /** Next-buy tile (60 pt). */
  nextBuy: 16,
  look: 13,
  /** 44–62 pt thumbnails. */
  thumb: 12,
  calendarDay: 10,
  /** His bubble; the tail corner (bottom-trailing) is 6. */
  bubble: 24,
  bubbleTail: 6,
  photoBubble: 21,
  photoBubbleInner: 17,
  photoBubbleInnerTail: 4,
  avatar: 5,
  label: 2,
  notification: 26,
  /** Buttons, chips, pills, composer and fields are capsules: radius = height / 2. */
} as const;

export const size = {
  /** Minimum hit area, always. */
  hit: 44,
  buttonLarge: 50,
  /** Visual 36, hit area padded to 44. */
  button: 36,
  chip: 34,
  chipSmall: 32,
  pill: 26,
  pillInline: 22,
  composer: 40,
  navCircle: 44,
  fixBadge: 26,
  stageDot: 24,
  seamInset: 18,
  avatar: 18,
  detectionTag: 28,
  photoBubbleWidth: 135,
  photoBubbleHeight: 172,
} as const;

/** Card shadow, light mode only (03 §4.4). RN `boxShadow` takes the CSS string (New Architecture). */
export const shadow = {
  card: '0px 1px 2px rgba(18, 22, 40, 0.05), 0px 6px 18px rgba(18, 22, 40, 0.06)',
  sharePreview: '0px 20px 40px -12px rgba(0, 0, 0, 0.60)',
} as const;

/** Seam (dashed divider): 1 pt, 5 on / 4 off, inkFaint @ 45%, inset 18. */
export const seam = { dash: 5, gap: 4, thickness: 1, opacity: 0.45 } as const;

/** Pressed / disabled opacities (03 §5 buttons). */
export const opacity = { pressed: 0.82, disabled: 0.4 } as const;

// ---------------------------------------------------------------------------------------
// Score words (03 §6, ruling 24). Thresholds apply to the score ROUNDED to the nearest 0.5.

export type ScoreWord = 'Needs a fix' | 'Getting there' | 'Put together' | 'Sharp' | 'Dialed in';

/** Ascending. A rounded score gets the word of the last band whose `min` it reaches. */
export const scoreBands: readonly { min: number; word: ScoreWord; label: string }[] = [
  { min: -Infinity, word: 'Needs a fix', label: '5.5 and under' },
  { min: 6.0, word: 'Getting there', label: '6–6.5' },
  { min: 7.0, word: 'Put together', label: '7–7.5' },
  { min: 8.0, word: 'Sharp', label: '8–8.5' },
  { min: 9.0, word: 'Dialed in', label: '9–9.5' },
];

/** Rubric v3 max is 9.5. Never claim 10 in copy (README open decision #9). */
export const scoreMax = 9.5;
