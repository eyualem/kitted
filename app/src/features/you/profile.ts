// Y1's style card and Y2's editor (02 D17, Y2; revised #246): his looks in pick order, his basics in one quiet line,
// and the draft Y2 edits. Pure. His picks never change a score (rubric v4+, #211); the editor writes them exactly the
// way onboarding does (looks.picksToStyles), and keeps the stored pairs untouched when the picks didn't change.
import type { Styles } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { normStyleKey, type ProfileRow, type StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import {
  BUILDS, buildLabel, FITS, fitLabel, heightLabel, heightSpoken, inchesToCm, type Build, type FitPref,
} from '@/features/onboarding/basics';
import { MAX_PICKS, picksToStyles } from '@/features/onboarding/looks';
import { t, type StringKey } from '@/i18n/en';

/** His looks in the order he picked them (the first breaks ties, #86). */
export function picksOf(styles: Styles | null | undefined): StyleKey[] {
  const out: StyleKey[] = [];
  for (const [s] of styles ?? []) {
    const k = normStyleKey(s);
    if (k && !out.includes(k)) out.push(k);
  }
  return out.slice(0, MAX_PICKS);
}

/** What Y2 saves: the stored pairs as they are when the picks didn't change, else onboarding's weights. */
export function stylesToSave(original: Styles, picks: readonly StyleKey[]): Styles {
  const before = picksOf(original);
  const same = before.length === picks.length && before.every((s, i) => s === picks[i]);
  return same ? original : picksToStyles(picks);
}

export function heightInOf(cm: number | null): number | null {
  return cm === null ? null : Math.round(cm / 2.54);
}

/** null = he didn't give it ('' since #276): shown and sent only when he tapped one. */
const asBuild = (b: string): Build | null => (BUILDS.includes(b as Build) ? (b as Build) : null);
const asFit = (f: string): FitPref | null => (FITS.includes(f as FitPref) ? (f as FitPref) : null);

/** "5′ 10″" or, in metric, "178 cm". */
export function heightText(inches: number, units: ProfileRow['units']): string {
  return units === 'metric' ? t('you.heightCm', { n: inchesToCm(inches) }) : heightLabel(inches);
}

type Basics = Pick<ProfileRow, 'heightCm' | 'build' | 'fitPreference' | 'units'>;

/** "5′ 10″ · Average build · Regular fit"; whatever he didn't give is left out (#246, #276); '' when none. */
export function basicsLine(p: Basics): string {
  const h = heightInOf(p.heightCm);
  const build = asBuild(p.build);
  const fit = asFit(p.fitPreference);
  return [
    h !== null ? heightText(h, p.units) : null,
    build ? t('you.basics.build', { build: buildLabel(build) }) : null,
    fit ? t('you.basics.fit', { fit: fitLabel(fit) }) : null,
  ].filter((x): x is string => x !== null).join(' · ');
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** VoiceOver for the style card, as one element: "Your style: Streetwear, first pick; Minimal; Workwear. 5 feet
 *  10 inches, average build, regular fit. Edit." */
export function styleCardSpoken(p: Basics & Pick<ProfileRow, 'styles'>): string {
  const picks = picksOf(p.styles);
  const styles = picks.length
    ? picks.map((s, i) => (i === 0 && picks.length > 1 ? t('you.a11y.firstPick', { style: styleLabel(s) }) : styleLabel(s))).join('; ')
    : t('you.style.none');
  const h = heightInOf(p.heightCm);
  const build = asBuild(p.build);
  const fit = asFit(p.fitPreference);
  const parts = [
    h !== null ? (p.units === 'metric' ? t('you.heightCm', { n: inchesToCm(h) }) : heightSpoken(h)) : null,
    build ? t('you.basics.build', { build: lower(buildLabel(build)) }) : null,
    fit ? t('you.basics.fit', { fit: lower(fitLabel(fit)) }) : null,
  ].filter((x): x is string => x !== null);
  return parts.length ? t('you.a11y.styleCard', { styles, basics: parts.join(', ') }) : t('you.a11y.styleCardNoBasics', { styles });
}

/** Budget per piece (Y2): only ever asked, never guessed (#246). `prefer_not` = he chose not to say. */
export const BUDGETS = ['under_30', '30_60', '60_100', '100_plus', 'prefer_not'] as const;
export type Budget = (typeof BUDGETS)[number];
const BUDGET_KEYS: Record<Budget, StringKey> = {
  under_30: 'budget.under30', '30_60': 'budget.30to60', '60_100': 'budget.60to100', '100_plus': 'budget.over100', prefer_not: 'profile.budgetSkip',
};
export const budgetLabel = (b: Budget) => t(BUDGET_KEYS[b]);
export const asBudget = (b: string | null): Budget | null => (b !== null && (BUDGETS as readonly string[]).includes(b) ? (b as Budget) : null);

export interface ProfileDraft {
  heightIn: number | null;
  build: Build | null;
  fit: FitPref | null;
  picks: StyleKey[];
  budget: Budget | null;
}

export function draftOf(p: ProfileRow): ProfileDraft {
  return { heightIn: heightInOf(p.heightCm), build: asBuild(p.build), fit: asFit(p.fitPreference), picks: picksOf(p.styles), budget: asBudget(p.budget) };
}

export function isDirty(p: ProfileRow, d: ProfileDraft): boolean {
  const o = draftOf(p);
  return o.heightIn !== d.heightIn || o.build !== d.build || o.fit !== d.fit || o.budget !== d.budget || o.picks.join() !== d.picks.join();
}

/** The row Y2 saves. Untouched fields keep their stored values exactly (height in cm, the style pairs); birth year,
 *  boldness, consent and the rest are never changed here. */
export function applyDraft(p: ProfileRow, d: ProfileDraft): ProfileRow {
  const o = draftOf(p);
  return {
    ...p,
    heightCm: d.heightIn === o.heightIn ? p.heightCm : d.heightIn === null ? null : inchesToCm(d.heightIn),
    build: d.build === o.build ? p.build : (d.build ?? ''),
    fitPreference: d.fit === o.fit ? p.fitPreference : (d.fit ?? ''),
    styles: stylesToSave(p.styles, d.picks),
    budget: d.budget === o.budget ? p.budget : d.budget,
  };
}

/** Writes his draft when it differs from the stored profile (Save, and leaving the screen: 09-ui-review §12). True when
 *  it wrote. */
export async function saveDraft(store: Pick<KittedStore, 'profile'>, d: ProfileDraft): Promise<boolean> {
  const fresh = await store.profile.get('me');
  if (!fresh || !isDirty(fresh, d)) return false;
  await store.profile.put(applyDraft(fresh, d));
  return true;
}
