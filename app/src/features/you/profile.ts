// Y1's style card and Y2's editor (02 D17, Y2; revised #246): his looks in pick order, his basics in one quiet line,
// and the draft Y2 edits. Pure. His picks never change a score (rubric v4+, #211); the editor writes them exactly the
// way onboarding does (looks.picksToStyles), and keeps the stored pairs untouched when the picks didn't change.
import type { Styles } from '@kitted/core';
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

const asBuild = (b: string): Build => (BUILDS.includes(b as Build) ? (b as Build) : 'average');
const asFit = (f: string): FitPref => (FITS.includes(f as FitPref) ? (f as FitPref) : 'regular');

/** "5′ 10″" or, in metric, "178 cm". */
export function heightText(inches: number, units: ProfileRow['units']): string {
  return units === 'metric' ? t('you.heightCm', { n: inchesToCm(inches) }) : heightLabel(inches);
}

type Basics = Pick<ProfileRow, 'heightCm' | 'build' | 'fitPreference' | 'units'>;

/** "5′ 10″ · Average build · Regular fit"; height left out when he didn't give it (#246). */
export function basicsLine(p: Basics): string {
  const h = heightInOf(p.heightCm);
  const build = buildLabel(asBuild(p.build));
  const fit = fitLabel(asFit(p.fitPreference));
  return h === null ? t('you.basics.noHeight', { build, fit }) : t('you.basics.height', { height: heightText(h, p.units), build, fit });
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
  const rest = t('you.a11y.basics', { build: lower(buildLabel(asBuild(p.build))), fit: lower(fitLabel(asFit(p.fitPreference))) });
  const basics = h === null ? rest : `${p.units === 'metric' ? t('you.heightCm', { n: inchesToCm(h) }) : heightSpoken(h)}, ${rest}`;
  return t('you.a11y.styleCard', { styles, basics });
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
  build: Build;
  fit: FitPref;
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
    build: d.build === o.build ? p.build : d.build,
    fitPreference: d.fit === o.fit ? p.fitPreference : d.fit,
    styles: stylesToSave(p.styles, d.picks),
    budget: d.budget === o.budget ? p.budget : d.budget,
  };
}
