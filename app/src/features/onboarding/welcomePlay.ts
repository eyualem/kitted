// Welcome's one play (10-onboarding.md §14, #388): the example check, beat by beat, the first time Welcome shows in a
// launch. The timeline is ms from the start; past END every piece sits where the resting card draws it, and the card
// is laid out at its final size from the first frame (only opacity and transforms move), like the score reveal.
import type { RevealStep } from '@/design-system';

export interface WelcomePlan {
  /** "Your fit" on the drawing. */
  chip: RevealStep;
  /** The card itself, with "Reading your fit". */
  card: RevealStep;
  /** "Reading your fit" fades as the tape starts. */
  readingOut: RevealStep;
  /** The score tape slides, then locks. */
  tape: RevealStep;
  lock: RevealStep;
  /** The score word and the occasion. */
  word: RevealStep;
  /** The one fix and its "→ 7.5". */
  fix: RevealStep;
  /** "Added 3 to your closet". */
  closet: RevealStep;
}

export const WELCOME_PLAN: WelcomePlan = {
  chip: { at: 200, ms: 350, rise: 8 },
  card: { at: 650, ms: 350, rise: 10 },
  readingOut: { at: 1050, ms: 150 },
  tape: { at: 1050, ms: 700 },
  lock: { at: 1750, ms: 150 },
  word: { at: 1850, ms: 250, rise: 6 },
  fix: { at: 2350, ms: 350, rise: 8 },
  closet: { at: 2950, ms: 300, rise: 6 },
};

/** The whole play, in ms (about 3 s). */
export const WELCOME_PLAY_MS = 3300;

let shown = false;

/** Whether this showing of Welcome plays: once per launch, never under Reduce Motion or VoiceOver (the resting card,
 *  read as one line, says it all; Apple: motion is never the only way to say something). */
export function welcomePlays(c: { reduceMotion: boolean; voiceOver: boolean }): boolean {
  return !shown && !c.reduceMotion && !c.voiceOver;
}

/** Welcome has shown in this launch (played or not): a later visit (Back from Looks) rests. */
export function noteWelcomeShown(): void {
  shown = true;
}

/** Tests only. */
export function resetWelcomeShown(): void {
  shown = false;
}

/** The fix line for VoiceOver: "Swap the running shoes…" read mid-sentence. */
export function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}
