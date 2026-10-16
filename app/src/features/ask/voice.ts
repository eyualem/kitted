// The stylist's voice, checked by code (07 §15.5, K3; the spec is rubric/stylist-guide.md §0, voice 1 "the friend
// who's good at clothes", founder Oct 16). Used by the tests on every demo answer and prompt example, and by the live
// test (E1) as its code-side voice check. It never changes what he sees: the gate (gate.ts) does that.
import { sentences } from './gate';
import { splitLead } from './answerText';

export type VoiceProblem = 'leadLong' | 'tooLong' | 'tooManySentences' | 'internal' | 'list' | 'question';

export const VOICE_LIMITS = { leadWords: 20, words: 70, sentences: 3 } as const;

// Words from inside the app that must never reach him: our own names for things.
const INTERNAL = /\bStarter 12\b|\bparts engine\b|\brubric\b|\b(?:P|FC)\d+\b|<\/?(?:pack|evidence|guide)>|\b[A-Z]{3}-\d+\b|\bclosing block\b|\bevidence\b/;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** What's off about an answer's voice; empty when it reads like the spec. */
export function voiceProblems(answer: string): VoiceProblem[] {
  const out: VoiceProblem[] = [];
  const text = answer.trim();
  const ss = sentences(text);
  if (words(splitLead(text).lead) > VOICE_LIMITS.leadWords) out.push('leadLong');
  if (words(text) > VOICE_LIMITS.words) out.push('tooLong');
  if (ss.length > VOICE_LIMITS.sentences) out.push('tooManySentences');
  if (INTERNAL.test(text)) out.push('internal');
  if (/(^|\n)\s*(?:[-*•]|\d+[.)])\s/.test(text)) out.push('list');
  // At most one question back to him, and only as the last sentence (a fork belongs in a tap card).
  const asks = ss.filter((s) => s.endsWith('?'));
  if (asks.length > 1 || (asks.length === 1 && !ss[ss.length - 1]!.endsWith('?'))) out.push('question');
  return out;
}
