// The phone's own checks on a question before anything is sent (07 §7.2, 02 S27). Two short lists, kept narrow on
// purpose: a miss here still reaches the model, which handles the subtler cases; a false alarm costs him an answer.
//   - Distress: phrases only (never a lone "die" or "dead": he dyes jeans and buys deadstock). Caught → the support
//     card, nothing sent, not counted, only the event name logged.
//   - Rating him, not the outfit: only when the whole message IS the ask ("Am I ugly?", "Rate my face"). A clothes
//     question with a body word in it ("Am I too skinny for oversized stuff?") goes to the model, which answers
//     the clothes part (07 §2.2).

/** Lowercase, straight apostrophes, no punctuation but the apostrophe, one space between words. */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Matched anywhere in the message, on word boundaries. */
const DISTRESS: readonly RegExp[] = [
  /\b(kill|killing|killed) myself\b/,
  /\bkms\b/,
  /\b(want|wanna|going|gonna|wish i could|need) to die\b/,
  /\bwanna die\b/,
  /\b(end|ending|take|taking) my (own )?life\b/,
  /\bsuicid(e|al)\b/,
  /\b(hurt|hurting|harm|harming|cut|cutting) myself\b/,
  /\bself ?harm/,
  /\bno (reason|point) (to live|in living)\b/,
  /\bbetter off dead\b/,
  /\b(don't|dont|do not) want to (be alive|live|exist)( anymore)?\b/,
  /\bnot want to (be alive|live)\b/,
];

/** The whole message, after an optional lead-in and before an optional tail. */
const LEAD = "(?:(?:be honest|honestly|real talk|ok|okay|so|yo|hey|bro|serious question|be real|tell me)\\s)*";
const TAIL = "(?:\\s(?:or not|be honest|honestly|lol|lmao|please|pls|bro|for real|fr|out of 10|1 to 10|from 1 to 10|1 10|on a scale of 1 to 10))*";
const BODY_WORDS = "(?:ugly|fat|too fat|hot|attractive|unattractive|good looking|handsome|cute|overweight|chubby|skinny|too skinny|too short|short|fit|ripped|muscular)";
const BODY_PARTS = "(?:face|body|looks|physique|jawline|appearance|smile|hair|skin|teeth|nose|eyes|build)";
const whole = (core: string) => new RegExp(`^${LEAD}(?:${core})${TAIL}$`);

const BODY_RATING: readonly RegExp[] = [
  whole(`(?:am i|do i look|would you say i'?m|would u say im|is my body) ${BODY_WORDS}`),
  whole(`(?:rate|judge|score) (?:my|me and my) ${BODY_PARTS}`),
  whole(`(?:how (?:would you rate|good is|bad is|ugly is|attractive is) my|what do you think (?:of|about) my|is my) ${BODY_PARTS}(?: good| bad| ok| okay| attractive| ugly)?`),
  whole(`(?:how ugly am i|how hot am i|how attractive am i|am i good looking|am i ugly or not)`),
];

export function isDistress(text: string): boolean {
  const n = normalizeQuestion(text);
  return DISTRESS.some((re) => re.test(n));
}

// He says he's under 18 (#311: told "I'm 16", six of seven models said "that's fine"; the app is 18+, CLAUDE.md).
// First person only, 10–17, and never a size or a height ("I'm 5'10", "I'm 16 in shoe size" isn't a thing, but
// "I'm a 32 waist" and "13 inch" are).
const UNDERAGE = /\b(?:i'?m|i am|im)(?: only| just)? (1[0-7])(?!['\d])(?! ?(?:ft|feet|foot|inch|inches|in|waist|length|cm|kg|lbs?|pounds|shoe|size|us|eu|uk))(?: years? old| yo| y o)?(?=$| )/;

export function isUnderage(text: string): boolean {
  return UNDERAGE.test(normalizeQuestion(text));
}

export function isBodyRating(text: string): boolean {
  const n = normalizeQuestion(text);
  return BODY_RATING.some((re) => re.test(n));
}
