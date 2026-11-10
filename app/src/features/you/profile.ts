// Y1's style card and Y2's editor (02 D17, Y2; revised #246): his looks in pick order, his basics in one quiet line,
// and the draft Y2 edits. Pure. His picks never change a score (rubric v4+, #211); the editor writes them exactly the
// way onboarding does (looks.picksToStyles), and keeps the stored pairs untouched when the picks didn't change.
import type { Styles } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { normStyleKey, type ProfileRow, type StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { FITS, fitLabel, type FitPref } from '@/features/onboarding/basics';
import { ageChoiceLabel, ageChoiceSpoken, cleanName, profileAgeBand } from '@/features/onboarding/aboutStep';
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

/** null = he didn't give it ('' since #276): shown and sent only when he tapped one. */
const asFit = (f: string): FitPref | null => (FITS.includes(f as FitPref) ? (f as FitPref) : null);

type Basics = Pick<ProfileRow, 'fitPreference'>;

/** "Regular fit", or '' when he didn't give one. Height and build are no longer asked or shown (#375). */
export function basicsLine(p: Basics): string {
  const fit = asFit(p.fitPreference);
  return fit ? t('you.basics.fit', { fit: fitLabel(fit) }) : '';
}


/** VoiceOver for the style card, as one element: "Your style: Streetwear, first pick; Minimal; Workwear. Regular fit.
 *  Edit." */
export function styleCardSpoken(p: Basics & Pick<ProfileRow, 'styles'>): string {
  const picks = picksOf(p.styles);
  const styles = picks.length
    ? picks.map((s, i) => (i === 0 && picks.length > 1 ? t('you.a11y.firstPick', { style: styleLabel(s) }) : styleLabel(s))).join('; ')
    : t('you.style.none');
  const fit = asFit(p.fitPreference);
  return fit ? t('you.a11y.styleCard', { styles, basics: t('you.basics.fit', { fit: fitLabel(fit) }) }) : t('you.a11y.styleCardNoBasics', { styles });
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
  fit: FitPref | null;
  picks: StyleKey[];
  budget: Budget | null;
  /** SY4 (T39): the Name field as typed; saved through cleanName (trimmed, at most 30, blank → none). */
  name: string;
}

export function draftOf(p: ProfileRow): ProfileDraft {
  return { fit: asFit(p.fitPreference), picks: picksOf(p.styles), budget: asBudget(p.budget), name: p.name ?? '' };
}

const nameChanged = (p: ProfileRow, d: ProfileDraft) => cleanName(d.name) !== (p.name ?? null);

export function isDirty(p: ProfileRow, d: ProfileDraft): boolean {
  const o = draftOf(p);
  return o.fit !== d.fit || o.budget !== d.budget || o.picks.join() !== d.picks.join() || nameChanged(p, d);
}

/** The row Y2 saves. Untouched fields keep their stored values exactly (the style pairs); birth year, his age band and
 *  its time, boldness, consent and the rest are never changed here, and height and build aren't written at all (#375). */
export function applyDraft(p: ProfileRow, d: ProfileDraft): ProfileRow {
  const o = draftOf(p);
  return {
    ...p,
    fitPreference: d.fit === o.fit ? p.fitPreference : (d.fit ?? ''),
    styles: stylesToSave(p.styles, d.picks),
    budget: d.budget === o.budget ? p.budget : d.budget,
    // An unchanged name keeps the row as it was (an older row without the field stays without it).
    ...(nameChanged(p, d) ? { name: cleanName(d.name) } : {}),
  };
}

/** Style profile's Age row (OS4.6): his band, the band from an older profile's birth year, or "Not set". */
export function ageRowValue(p: Pick<ProfileRow, 'ageBand' | 'birthYear'>, currentYear: number): { shown: string; spoken: string } {
  const band = profileAgeBand(p, currentYear);
  const shown = band ? ageChoiceLabel(band) : t('profile.birthYearNone');
  const spoken = band ? ageChoiceSpoken(band) : t('profile.birthYearNone');
  return { shown, spoken: t('settings.a11y.value', { label: t('profile.age'), value: spoken }) };
}

/** The profile Y1 and Y2 show when none is stored (a dev or demo install that skipped onboarding, #370): no looks,
 *  no basics, no birth year and no consent. Saving an edit to it creates the row; nothing else changes. */
export function blankProfile(nowMs: number): ProfileRow {
  return {
    id: 'me', birthYear: null, heightCm: null, build: '', fitPreference: '', styles: [],
    boldness: null, budget: null, lastOccasion: 'everyday',
    consentVersion: null, consentAt: null, onboardingDone: true,
    ideaTime: null, units: 'imperial', createdAt: nowMs,
  };
}

/** Writes his draft when it differs from the stored profile (Done, and leaving the screen: 09-ui-review §12), or from
 *  a blank one when none is stored. True when it wrote. */
export async function saveDraft(store: Pick<KittedStore, 'profile'>, d: ProfileDraft, nowMs = Date.now()): Promise<boolean> {
  const fresh = (await store.profile.get('me')) ?? blankProfile(nowMs);
  if (!isDirty(fresh, d)) return false;
  await store.profile.put(applyDraft(fresh, d));
  return true;
}
