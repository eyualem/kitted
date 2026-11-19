// About you (T39, specs/onboarding-screens.md OS4, specs/setup-and-you.md SY4): the age choices and their words, the
// name rule, the step's draft, the band from an older profile's birth year, and the end of setup. Pure apart from the
// store calls. Named aboutStep, not aboutYou: features/aboutYou/ is Kit's "About you" card after the first score.
//
// Setup ends here (no agreement step since T39): the profile is saved with his looks, his name (if any) and his band,
// no birth year and no consent; then Kit's first-check offer goes under Kit's first message. Nothing is sent.
import type { KittedStore } from '@/data/store';
import type { AgeBand, ProfileRow } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import { ABOUT_KEY, BASICS_KEY, GAME_DRAFT_KEY, isAgeBand, isUnderAge, loadDraft, LOOKS_KEY, type AboutDraft, type AgeChoice } from './basics';
import { completeOnboarding } from './complete';
import { postFirstCheckOffer } from './firstCheckOffer';
import { picksToStyles } from './looks';
import { clearResumeStep } from './resume';
import { endStyleGame } from './styleGameSession';

export { ABOUT_KEY, AGE_CHOICES, EMPTY_ABOUT, isAgeBand, parseAbout, type AboutDraft, type AgeChoice } from './basics';

const LABEL_KEYS: Record<AgeChoice, StringKey> = {
  under18: 'onb.about.age.under18',
  '18-21': 'onb.about.age.18to21',
  '22-25': 'onb.about.age.22to25',
  '26-30': 'onb.about.age.26to30',
  '31+': 'onb.about.age.31plus',
};

/** "Under 18" · "18–21" · "22–25" · "26–30" · "31 or older" (en dashes). */
export function ageChoiceLabel(c: AgeChoice): string {
  return t(LABEL_KEYS[c]);
}

/** VoiceOver's label for a choice. It reads the visible words (founder question 1: the design's "18 to 21" isn't in
 *  the approved spec; iOS usually reads an en-dash range as "18 to 21" anyway). */
export function ageChoiceSpoken(c: AgeChoice): string {
  return ageChoiceLabel(c);
}

/** testID of a row: 'age-under18' · 'age-18-21' · 'age-22-25' · 'age-26-30' · 'age-31plus'. */
export function ageChoiceTestID(c: AgeChoice): string {
  return `age-${c === '31+' ? '31plus' : c}`;
}

/** SY4.2: at most 30 characters (code points). */
export const NAME_MAX = 30;

/** SY4.2: trimmed; cut to 30 code points (Array.from), then trimmed again; blank or spaces only → null. */
export function cleanName(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const cut = Array.from(raw.trim()).slice(0, NAME_MAX).join('').trim();
  return cut === '' ? null : cut;
}

export async function saveAbout(store: Pick<KittedStore, 'setKv'>, d: AboutDraft): Promise<void> {
  // The key is written out (not ABOUT_KEY) so the sync test's scan of setKv calls can classify it.
  await store.setKv('onboarding.about', JSON.stringify({ age: d.age, name: d.name }));
}

/** An older profile's band: age = currentYear − birthYear (the same rule as isUnderAge); under 18 → 'under18'. */
export function bandFromBirthYear(birthYear: number, currentYear: number): AgeChoice {
  if (isUnderAge(birthYear, currentYear)) return 'under18';
  const age = currentYear - birthYear;
  if (age <= 21) return '18-21';
  if (age <= 25) return '22-25';
  if (age <= 30) return '26-30';
  return '31+';
}

/** What Style profile shows: p.ageBand, else the band from p.birthYear, else null ("Not set"). Never 'under18'. */
export function profileAgeBand(p: Pick<ProfileRow, 'ageBand' | 'birthYear'>, currentYear: number): AgeBand | null {
  if (p.ageBand !== undefined && p.ageBand !== null) return isAgeBand(p.ageBand) ? p.ageBand : null;
  if (typeof p.birthYear === 'number') {
    const b = bandFromBirthYear(p.birthYear, currentYear);
    return isAgeBand(b) ? b : null;
  }
  return null;
}

/**
 * About you's Continue with an 18+ band (not restore): the profile (his looks, an older draft's fit, his band and
 * name, no birth year, no consent), then Kit's first-check offer, then the step drafts and the resume step go. His own
 * words from "Something else?" stay in kv, as before. Rejects, writing nothing, when no age is picked or it's under 18.
 * Sends nothing. The screen then calls setOnboarded(true) and router.replace('/').
 */
export async function finishSetup(store: KittedStore, nowMs: number, ids: (prefix: string) => string): Promise<void> {
  const d = await loadDraft(store);
  const age = d.about.age;
  if (!isAgeBand(age)) throw new Error(age === 'under18' ? 'finishSetup: under 18 has no setup' : 'finishSetup: no age picked');
  await completeOnboarding(
    store,
    {
      styles: picksToStyles(d.looks),
      // '' = not given (#276); only an older draft can hold one.
      fitPreference: d.basics.fit ?? '',
      birthYear: null,
      ageBand: age,
      name: cleanName(d.about.name),
      consent: 'later',
    },
    nowMs,
    ids,
  );
  await postFirstCheckOffer(store, nowMs, ids);
  await store.deleteKv(LOOKS_KEY);
  await store.deleteKv(BASICS_KEY);
  await store.deleteKv(ABOUT_KEY);
  // The style game's results draft and the game in memory go (T113); his Not me's (looks.notMe) stay with his profile.
  await store.deleteKv(GAME_DRAFT_KEY);
  endStyleGame();
  await clearResumeStep(store);
}
