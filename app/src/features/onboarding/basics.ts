// O3 Basics and O5 Consent logic (02 D3–D4), pure: the draft his answers wait in until consent saves the
// profile, the 18+ rule, and the echo lines. Since #373 O3 asks only the birth year; the fit he likes (optional, blank
// until he taps, #276) is asked by Kit after the first score (features/aboutYou) and edited in You. Height and build
// are no longer asked at all (#375).
import type { KittedStore } from '@/data/store';
import { normStyleKey, type StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { t, type StringKey } from '@/i18n/en';
import type { OnboardingAnswers } from './complete';
import { picksToStyles } from './looks';

export const LOOKS_KEY = 'onboarding.looks';
export const OTHER_STYLE_KEY = 'onboarding.otherStyle';
export const BASICS_KEY = 'onboarding.basics';

export type FitPref = 'fitted' | 'regular' | 'relaxed';
export const FITS: readonly FitPref[] = ['fitted', 'regular', 'relaxed'];

/** What O3 and the older Basics left in kv until consent. Height and build are no longer asked or kept (#375); an
 *  older draft's ones are ignored. */
export interface BasicsDraft {
  /** From an older draft only (O3 asks just the year since #373); saved when he gave it. */
  fit: FitPref | null;
  birthYear: number | null;
}

export const EMPTY_BASICS: BasicsDraft = { fit: null, birthYear: null };

/** config.minAge (ruling 3): the app is 18+. */
export const MIN_AGE = 18;

/** Under 18 by the year he picked (02 D3: currentYear − birthYear < minAge). */
export function isUnderAge(birthYear: number, currentYear: number): boolean {
  return currentYear - birthYear < MIN_AGE;
}

/** The years the wheel offers, newest first; it never preselects one. */
export function birthYears(currentYear: number): number[] {
  return Array.from({ length: 91 }, (_, i) => currentYear - 10 - i);
}

/** The year the list opens on when none is picked: a 22-year-old's (2004 in 2026), mid-audience, never selected. */
export function birthYearAnchor(currentYear: number): number {
  return currentYear - 22;
}

export function parseBasics(raw: string | null): BasicsDraft {
  if (!raw) return { ...EMPTY_BASICS };
  try {
    const v = JSON.parse(raw) as Partial<BasicsDraft>;
    return {
      fit: FITS.includes(v.fit as FitPref) ? (v.fit as FitPref) : null,
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

export const fitLabel = (f: FitPref) => t(`fitpref.${f}` as StringKey);

/** His echo bubble on O5: "Born in 2005" (since #373 O3 asks only the year; an older draft's other answers are still
 *  saved, answersFromDraft, but not echoed). */
export function basicsEcho(b: BasicsDraft): string {
  return b.birthYear !== null ? t('onb.basics.echoYear', { year: b.birthYear }) : '';
}

/** What Consent saves from the drafts (O5): the looks, the year, and an older draft's fit (never its height or build,
 *  #375). */
export function answersFromDraft(d: Awaited<ReturnType<typeof loadDraft>>, consent: boolean): OnboardingAnswers {
  return {
    styles: picksToStyles(d.looks),
    // '' = not given (#276): the You card and the chat leave it out.
    fitPreference: d.basics.fit ?? '',
    birthYear: d.basics.birthYear,
    consent,
  };
}
