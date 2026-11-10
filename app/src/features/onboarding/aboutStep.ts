// T39 stub (tasks/T39/IMPLEMENTATION.md → Interfaces): the About you step's choices, the name rule, the draft, the band
// from a birth year and the end of setup. Written by the test writer so the tests fail on missing behaviour, not on a
// missing import. The implementer replaces every body.
import type { KittedStore } from '@/data/store';
import type { AgeBand, ProfileRow } from '@/data/types';

const notBuilt = (): never => {
  throw new Error('T39: not built');
};

export type AgeChoice = 'under18' | AgeBand;
/** In the order shown. */
export const AGE_CHOICES: readonly AgeChoice[] = ['under18', '18-21', '22-25', '26-30', '31+'];
export function isAgeBand(_x: unknown): _x is AgeBand {
  return notBuilt();
}
export function ageChoiceLabel(_c: AgeChoice): string {
  return notBuilt();
}
export function ageChoiceSpoken(_c: AgeChoice): string {
  return notBuilt();
}
export function ageChoiceTestID(_c: AgeChoice): string {
  return notBuilt();
}

export const NAME_MAX = 30;
export function cleanName(_raw: string | null | undefined): string | null {
  return notBuilt();
}

export const ABOUT_KEY = 'onboarding.about';
export interface AboutDraft { age: AgeChoice | null; name: string }
export const EMPTY_ABOUT: AboutDraft = { age: null, name: '' };
export function parseAbout(_raw: string | null): AboutDraft {
  return notBuilt();
}
export async function saveAbout(_store: Pick<KittedStore, 'setKv'>, _d: AboutDraft): Promise<void> {
  notBuilt();
}

export function bandFromBirthYear(_birthYear: number, _currentYear: number): AgeChoice {
  return notBuilt();
}
export function profileAgeBand(_p: Pick<ProfileRow, 'ageBand' | 'birthYear'>, _currentYear: number): AgeBand | null {
  return notBuilt();
}

export async function finishSetup(_store: KittedStore, _nowMs: number, _ids: (prefix: string) => string): Promise<void> {
  notBuilt();
}
