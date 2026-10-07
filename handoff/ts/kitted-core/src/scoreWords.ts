// Score words (ruling 24): <=5.5 Needs a fix · 6-6.5 Getting there · 7-7.5 Put together · 8-8.5 Sharp · 9-9.5 Dialed in.
// Port of kitted_logic.score_word. Display scores are always multiples of 0.5.

export type ScoreWord = "Needs a fix" | "Getting there" | "Put together" | "Sharp" | "Dialed in";

export const SCORE_WORDS: readonly { min?: number; max?: number; word: ScoreWord }[] = [
  { max: 5.5, word: "Needs a fix" },
  { min: 6.0, max: 6.5, word: "Getting there" },
  { min: 7.0, max: 7.5, word: "Put together" },
  { min: 8.0, max: 8.5, word: "Sharp" },
  { min: 9.0, word: "Dialed in" },
];

export function scoreWord(x: number | null | undefined): ScoreWord | null {
  if (x === null || x === undefined) return null;
  if (x <= 5.5) return "Needs a fix";
  if (x <= 6.5) return "Getting there";
  if (x <= 7.5) return "Put together";
  if (x <= 8.5) return "Sharp";
  return "Dialed in";
}
