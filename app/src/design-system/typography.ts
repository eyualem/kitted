// typography.ts — iOS text styles, the role map and the three special faces (03 §3).
//
// Rules (03 §3.1):
// - SF Pro for all reading text. On iOS, leaving `fontFamily` unset (or 'System') gives SF Pro,
//   with Apple's optical sizing and tracking applied by the system font itself, so we never set
//   letterSpacing on SF text.
// - Dynamic Type: every SF text style is rendered through <KText>, which passes the matching
//   `dynamicTypeRamp` (iOS-only Text prop) so each style scales on Apple's own curve, the way
//   UIFontMetrics does natively. `allowFontScaling` stays true (RN's default).
// - No weight below 400. Mockup 550 → '500', 600–650 → '600', 700+ → '700'.
// - Tabular figures wherever numbers line up: fontVariant ['tabular-nums'].
// - Minimum 12 pt for mono labels, 11 pt for anything else.

import { Platform, type TextStyle } from 'react-native';
import type { ColorTokens } from './tokens';

/** RN's dynamicTypeRamp values (iOS). */
export type DynamicTypeRamp =
  | 'caption2'
  | 'caption1'
  | 'footnote'
  | 'subheadline'
  | 'callout'
  | 'body'
  | 'headline'
  | 'title3'
  | 'title2'
  | 'title1'
  | 'largeTitle';

/** The weights we use. All are valid RN `fontWeight` values. */
export type Weight = '400' | '500' | '600' | '700' | '800';

export type Variant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption'
  | 'caption2';

export interface TextStyleSpec {
  /** Size in pt at the default ("Large") text size. */
  fontSize: number;
  /** Apple's leading for this style at the default size. */
  lineHeight: number;
  fontWeight: Weight;
  ramp: DynamicTypeRamp;
}

/**
 * Apple's iOS text styles at the default size (HIG "Specifications › Typography", iOS).
 * largeTitle is 'bold' here because Kitted only ever uses it bold (03 §3.2); Apple's default is regular.
 */
export const textStyles: Record<Variant, TextStyleSpec> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', ramp: 'largeTitle' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '400', ramp: 'title1' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '400', ramp: 'title2' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '400', ramp: 'title3' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', ramp: 'headline' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', ramp: 'body' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', ramp: 'callout' },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400', ramp: 'subheadline' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', ramp: 'footnote' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', ramp: 'caption1' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400', ramp: 'caption2' },
};

/**
 * iOS Bold Text (Settings › Accessibility › Display & Text Size › Bold Text). RN doesn't
 * apply it to explicit weights, so <KText> bumps one step when
 * AccessibilityInfo.isBoldTextEnabled() is on. VERIFY on device that SF Pro doesn't double-bold.
 */
export function boldTextWeight(w: Weight): Weight {
  switch (w) {
    case '400':
      return '600';
    case '500':
      return '600';
    case '600':
      return '700';
    case '700':
      return '800';
    default:
      return w;
  }
}

/** Above this font scale we're in the accessibility sizes (AX1 = 1.786 in RN's iOS multiplier table). */
export const accessibilitySizeThreshold = 1.75;

// ---------------------------------------------------------------------------------------
// Font families

/**
 * PostScript names of the bundled static Archivo cuts (see fonts.ts for files, URLs, license).
 * VERIFY once in a dev build with expo-font's getLoadedFonts(): on iOS the family name comes
 * from the font file, not the filename.
 */
export const archivo = {
  /** Score + stat numerals (mockup: wdth 70, wght 640 → closest static cut wdth 75, wght 600). */
  score: 'ArchivoCondensed-SemiBold',
  /** The struck-through "was" numeral in a re-check (wght 500). */
  scoreLight: 'ArchivoCondensed-Medium',
  /** Wordmark + the stylist avatar "K" (mockup: wdth 125, wght 700 / 760). */
  wordmark: 'ArchivoExpanded-Bold',
} as const;

export type ArchivoFace = keyof typeof archivo;

/**
 * Mono labels: SF Mono through RN's `ui-monospace` system family (Fabric maps it to
 * UIFontDescriptorSystemDesignMonospaced; present in RN 0.86 and 0.87 source). Nothing to bundle.
 * Fallback if a device renders it as SF Pro: 'Menlo' (also built into iOS).
 */
// Web preview: Chrome has no `ui-monospace`, so give it a CSS stack (iOS takes one family name).
export const monoFamily = Platform.OS === 'web' ? 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace' : 'ui-monospace';

/** System condensed SF, the fallback for score numerals when Archivo isn't bundled yet. */
export const systemCondensedFamily = Platform.OS === 'web' ? '-apple-system, "SF Pro Display", system-ui, sans-serif' : 'SystemCondensed';

// ---------------------------------------------------------------------------------------
// Special faces (03 §3.3)

/** Mono label (`.tagline`, `.intent-l`): SF Mono 12 medium, scales, sentence case, ink3. */
export const monoLabel = { fontSize: 12, lineHeight: 16, fontWeight: '500' as Weight, ramp: 'caption1' as DynamicTypeRamp };
/** Mono numbers inside rows (gains, ledger amounts, "/10"). */
export const monoValue = { fontSize: 15, lineHeight: 20, fontWeight: '500' as Weight, ramp: 'subheadline' as DynamicTypeRamp };
/** Stage counts ("3 of 4"). */
export const monoSmall = { fontSize: 13, lineHeight: 18, fontWeight: '500' as Weight, ramp: 'footnote' as DynamicTypeRamp };

/**
 * DECIDED (founder, Oct 12, DECISIONS-LOG #231): spaced capitals on card labels ("FIT CHECK · FULL").
 * true = the mockup's uppercase + 1 pt tracking at normal sizes, display-only (VoiceOver gets
 * the sentence-case string via accessibilityLabel), and still sentence case at AX sizes
 * (KText checks theme.isAccessibilitySize). false = sentence case everywhere (ruling 29).
 */
export const MONO_UPPERCASE_AT_NORMAL_SIZES = true;

/**
 * FOUNDER DECIDES (README open decision #8). Default true: stat numerals (Rotation "37",
 * Lookbook "4 / 19", fits counts, camera countdown) use the Archivo score face. false = SF Pro
 * condensed semibold for those (prices and the height stepper are SF Pro either way).
 */
export const ARCHIVO_FOR_STAT_NUMERALS = true;

/**
 * Score numeral base sizes (pt at the default text size). Scaled ones follow the largeTitle
 * ramp and are capped at 1.6× (76 → ~122, so "9.5" never clips at AX5 on a 402 pt phone).
 */
export const numeralSizes = {
  hero: 76,
  welcomeMini: 52,
  ledgerTotal: 52,
  was: 44,
  rotation: 68,
  lookbook: 44,
  correctionPreview: 31,
  /** Fixed: the share card is an image. */
  shareCard: 73,
  /** Fixed: camera countdown (mockup wdth 75, wght 600 = ArchivoCondensed-SemiBold exactly). */
  countdown: 76,
} as const;

export const numeralMaxScale = 1.6;

/** Wordmark (`.woven`): fixed size, never scales (it's a logo). */
export const wordmark = {
  regular: { fontSize: 12, letterSpacingEm: 0.34 },
  /** Mockup .sm was 8.5; raised to the 11 pt floor. */
  small: { fontSize: 11, letterSpacingEm: 0.32 },
  /** The 18 pt chat avatar "K". */
  avatar: { fontSize: 10.5, letterSpacingEm: 0 },
} as const;

/**
 * Score numeral style. `available` = whether the Archivo files are registered
 * (see fonts.ts → isArchivoLoaded()). Falls back to SF condensed so the app looks close and
 * never breaks before the font is added.
 */
export function numeralStyle(
  fontSize: number,
  face: 'score' | 'scoreLight',
  available: boolean,
): TextStyle {
  const base: TextStyle = {
    fontSize,
    letterSpacing: -0.025 * fontSize,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  };
  if (available) return { ...base, fontFamily: archivo[face] };
  return { ...base, fontFamily: systemCondensedFamily, fontWeight: face === 'score' ? '600' : '500' };
}

export function wordmarkStyle(fontSize: number, letterSpacingEm: number, available: boolean): TextStyle {
  const base: TextStyle = { fontSize, letterSpacing: fontSize * letterSpacingEm, includeFontPadding: false };
  if (available) return { ...base, fontFamily: archivo.wordmark };
  // No expanded system width is addressable from RN; bold + the same tracking reads close enough.
  return { ...base, fontWeight: '700' };
}

// ---------------------------------------------------------------------------------------
// Role map (03 §3.2): mockup class → variant + weight + color. Use with <KText role="…">.

export type InkColor = keyof Pick<
  ColorTokens,
  'ink' | 'ink2' | 'ink3' | 'accent' | 'onPrimary' | 'onMe' | 'good' | 'caution' | 'danger' | 'surface'
>;

export interface TextRole {
  variant: Variant;
  weight?: Weight;
  color: InkColor;
  mono?: 'label' | 'value' | 'small';
  italic?: boolean;
  tabular?: boolean;
}

export const roles = {
  chatText: { variant: 'body', color: 'ink' },
  userBubbleText: { variant: 'body', color: 'onMe' },
  composerPlaceholder: { variant: 'body', color: 'ink3' },
  stylistWho: { variant: 'footnote', weight: '600', color: 'ink3' },
  /** Look C (#302): an answer's first sentence (the move), then the reason in grey. */
  answerLead: { variant: 'headline', color: 'ink' },
  answerRest: { variant: 'callout', color: 'ink2' },
  answerChip: { variant: 'callout', weight: '600', color: 'ink' },
  dayStamp: { variant: 'footnote', weight: '500', color: 'ink3' },
  photoCaption: { variant: 'footnote', color: 'onMe' },
  welcomeHero: { variant: 'largeTitle', weight: '700', color: 'ink' },
  paywallHeadline: { variant: 'largeTitle', weight: '700', color: 'ink' },
  sheetTitle: { variant: 'title2', weight: '700', color: 'ink' },
  sheetSubtitle: { variant: 'subheadline', color: 'ink2' },
  limitHeadline: { variant: 'title3', weight: '600', color: 'ink' },
  scoreWord: { variant: 'headline', color: 'ink' },
  verdict: { variant: 'subheadline', color: 'ink2' },
  cardSummary: { variant: 'callout', color: 'ink' },
  fixTitle: { variant: 'callout', weight: '600', color: 'ink' },
  fixDetail: { variant: 'footnote', color: 'ink2' },
  fixBadge: { variant: 'footnote', weight: '700', color: 'ink' },
  gain: { variant: 'subheadline', color: 'accent', mono: 'value', tabular: true },
  tipLine: { variant: 'footnote', color: 'ink2' },
  /** Ink semibold (#276): a tip never moves the score, and copper is only for score movement (#231). */
  tipLead: { variant: 'footnote', weight: '600', color: 'ink' },
  buttonLarge: { variant: 'headline', color: 'ink' },
  button: { variant: 'subheadline', weight: '600', color: 'ink' },
  /** Ink semibold (#231: copper is only for score movement). */
  textLink: { variant: 'subheadline', weight: '600', color: 'ink' },
  chip: { variant: 'subheadline', weight: '500', color: 'ink' },
  quickStart: { variant: 'subheadline', weight: '600', color: 'ink' },
  pill: { variant: 'footnote', weight: '600', color: 'ink2' },
  badge: { variant: 'caption', weight: '700', color: 'onPrimary' },
  addedRow: { variant: 'subheadline', color: 'ink2' },
  ledgerLabel: { variant: 'subheadline', color: 'ink2' },
  ledgerRule: { variant: 'subheadline', weight: '600', color: 'ink' },
  ledgerValue: { variant: 'subheadline', color: 'ink', mono: 'value', tabular: true },
  ledgerTotal: { variant: 'headline', color: 'ink' },
  stageRow: { variant: 'callout', color: 'ink3' },
  stageCount: { variant: 'footnote', color: 'ink3', mono: 'small', tabular: true },
  detectionTag: { variant: 'footnote', weight: '600', color: 'ink' },
  rowTitle: { variant: 'callout', weight: '600', color: 'ink' },
  rowSubtitle: { variant: 'footnote', color: 'ink2' },
  factSubtitle: { variant: 'footnote', color: 'ink3' },
  consentTitle: { variant: 'callout', weight: '600', color: 'ink' },
  consentBody: { variant: 'subheadline', color: 'ink2' },
  fieldLabel: { variant: 'footnote', weight: '600', color: 'ink2' },
  miniLabel: { variant: 'footnote', color: 'ink2' },
  calendarWeekday: { variant: 'caption', weight: '600', color: 'ink3' },
  calendarDay: { variant: 'footnote', color: 'ink2' },
  perk: { variant: 'callout', weight: '500', color: 'ink' },
  planName: { variant: 'headline', color: 'ink' },
  planSubline: { variant: 'footnote', color: 'ink2' },
  /** SF Pro, not Archivo (ruling 29). */
  planPrice: { variant: 'title2', weight: '700', color: 'ink', tabular: true },
  /** SF Pro, not Archivo (ruling 29). */
  stepperValue: { variant: 'title3', weight: '600', color: 'ink', tabular: true },
  finePrint: { variant: 'footnote', color: 'ink3' },
  monoLabel: { variant: 'caption', color: 'ink3', mono: 'label' },
  partialLabel: { variant: 'subheadline', weight: '600', color: 'ink' },
  factGuess: { variant: 'callout', weight: '500', color: 'ink2', italic: true },
} as const satisfies Record<string, TextRole>;

export type RoleName = keyof typeof roles;
