// O3 Basics and O5 Consent logic (02 D3–D4), pure: the draft his answers wait in until consent saves the
// profile, the 18+ rule, and the echo lines. Height is optional and starts blank (02 D3 "differs from mockup").
import type { KittedStore } from '@/data/store';
import { normStyleKey, type StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { t, type StringKey } from '@/i18n/en';

export const LOOKS_KEY = 'onboarding.looks';
export const OTHER_STYLE_KEY = 'onboarding.otherStyle';
export const BASICS_KEY = 'onboarding.basics';

export type Build = 'slim' | 'average' | 'broad';
export type FitPref = 'fitted' | 'regular' | 'relaxed';
export const BUILDS: readonly Build[] = ['slim', 'average', 'broad'];
export const FITS: readonly FitPref[] = ['fitted', 'regular', 'relaxed'];

export interface BasicsDraft {
  /** Total inches; null until the first − / + tap (which seeds 5′10″). */
  heightIn: number | null;
  build: Build;
  fit: FitPref;
  birthYear: number | null;
}

export const EMPTY_BASICS: BasicsDraft = { heightIn: null, build: 'average', fit: 'regular', birthYear: null };

/** 02 D3: 4′10″–7′0″, the first tap seeds 5′10″. */
export const HEIGHT_MIN_IN = 58, HEIGHT_MAX_IN = 84, HEIGHT_SEED_IN = 70;
/** config.minAge (ruling 3): the app is 18+. */
export const MIN_AGE = 18;

export function stepHeight(h: number | null, delta: 1 | -1): number {
  if (h === null) return HEIGHT_SEED_IN;
  return Math.min(HEIGHT_MAX_IN, Math.max(HEIGHT_MIN_IN, h + delta));
}

export function heightLabel(inches: number): string {
  return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
}

/** VoiceOver: "5 feet 10 inches". */
export function heightSpoken(inches: number): string {
  return `${Math.floor(inches / 12)} feet ${inches % 12} inches`;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}

/** Under 18 by the year he picked (02 D3: currentYear − birthYear < minAge). */
export function isUnderAge(birthYear: number, currentYear: number): boolean {
  return currentYear - birthYear < MIN_AGE;
}

/** The years the wheel offers, newest first; it never preselects one. */
export function birthYears(currentYear: number): number[] {
  return Array.from({ length: 91 }, (_, i) => currentYear - 10 - i);
}

export function parseBasics(raw: string | null): BasicsDraft {
  if (!raw) return { ...EMPTY_BASICS };
  try {
    const v = JSON.parse(raw) as Partial<BasicsDraft>;
    return {
      heightIn: typeof v.heightIn === 'number' ? v.heightIn : null,
      build: BUILDS.includes(v.build as Build) ? (v.build as Build) : 'average',
      fit: FITS.includes(v.fit as FitPref) ? (v.fit as FitPref) : 'regular',
      birthYear: typeof v.birthYear === 'number' ? v.birthYear : null,
    };
  } catch {
    return { ...EMPTY_BASICS };
  }
}

export function parseLooks(raw: string | null): StyleKey[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(normStyleKey).filter((s): s is StyleKey => s !== null).slice(0, 3) : [];
  } catch {
    return [];
  }
}

export async function loadDraft(store: Pick<KittedStore, 'getKv'>) {
  return {
    looks: parseLooks(await store.getKv(LOOKS_KEY)),
    otherStyle: await store.getKv(OTHER_STYLE_KEY),
    basics: parseBasics(await store.getKv(BASICS_KEY)),
  };
}

/** His echo bubble on O3: the looks he picked ("Streetwear · Workwear"), or "Not sure yet". */
export function looksEcho(looks: readonly StyleKey[]): string {
  return looks.length ? looks.map(styleLabel).join(' · ') : t('onb.basics.echoNotSure');
}

/** The stylist's reply on O3 (02 D3 template). With 3 picks it names the first two, like the mockup's pair. */
export function looksReply(looks: readonly StyleKey[]): string {
  if (looks.length === 0) return t('onb.basics.replyNone');
  if (looks.length === 1) return t('onb.basics.replyOne', { style1: styleLabel(looks[0]!) });
  return t('onb.basics.replyTwo', { style1: styleLabel(looks[0]!), style2: styleLabel(looks[1]!).toLowerCase() });
}

export const buildLabel = (b: Build) => t(`build.${b}` as StringKey);
export const fitLabel = (f: FitPref) => t(`fitpref.${f}` as StringKey);

/** His echo bubble on O5: "5′ 10″ · Average · Regular · 2005" (height left out when blank). */
export function basicsEcho(b: BasicsDraft): string {
  const parts = [b.heightIn !== null ? heightLabel(b.heightIn) : null, buildLabel(b.build), fitLabel(b.fit), b.birthYear !== null ? String(b.birthYear) : null];
  return parts.filter((p): p is string => p !== null).join(' · ');
}
