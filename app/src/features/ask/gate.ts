// The sentence gate (07 §7.3, checks A4–A5): every sentence of an answer is checked on the phone before it shows.
// A sentence that breaks a rule is dropped (the rest of the answer stays); drops are logged by rule name only, never
// the text. Rules: an emoji · "unlimited" · "AI stylist" · a brand or shop · a creator's name · a body word aimed at
// him · his build or height said back to him · a score-like number the evidence doesn't hold.
// The stream is cut into sentences as it arrives (SentenceStream), so the live row only ever shows checked sentences.

export type GateRule = 'emoji' | 'unlimited' | 'aiStylist' | 'brand' | 'creator' | 'body' | 'build' | 'height' | 'score';

export interface GateContext {
  /** Every score that may be said: the one-decimal numbers in the pack and the evidence ("7.0", "7.5"). */
  allowedScores: ReadonlySet<string>;
  /** He gave a height or a build (so saying it back is possible; the rule runs either way). */
  hasBody?: boolean;
}

/** One-decimal form of a score: "7" → "7.0", "7.50" → "7.5". */
export const scoreKey = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);

/** The scores a text holds, for allowedScores: every 0–10 number with one decimal ("Today · 7.0", "→ 7.5"). */
export function scoresIn(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of allMatches(/(?:^|[^\d.])(10|\d)\.(\d)(?!\d)/g, text)) out.add(`${m[1]}.${m[2]}`);
  return out;
}

/** Every match of a /g regex (no matchAll or lookbehind: kept to what Hermes surely runs). */
function allMatches(re: RegExp, text: string): RegExpExecArray[] {
  const out: RegExpExecArray[] = [];
  re.lastIndex = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    out.push(m);
    if (m[0] === '') re.lastIndex++;
  }
  return out;
}

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/u;

// Brands and shops, as whole words. The closet's brand list (core closetIdentity) has common words in it ("guess",
// "gap", "boss", "essentials", "champion"), which would drop "I guess…" or "the gap above the shoe"; this list keeps
// only names that aren't everyday words.
const BRANDS = [
  'nike', 'jordans?', 'air jordan', 'adidas', 'puma', 'new balance', 'under armou?r', 'north face', 'patagonia', 'carhartt',
  'ralph lauren', 'lacoste', 'tommy hilfiger', 'hilfiger', 'calvin klein', "levi'?s?", 'uniqlo', 'h&m', 'zara', 'stussy',
  'fear of god', 'vans', 'converse', 'chuck taylors?', 'reebok', 'asics', "arc'?teryx", 'lululemon', 'gymshark',
  'abercrombie', 'american eagle', 'hollister', 'hugo boss', 'timberlands?', "dr\\.? martens", 'doc martens', 'new era',
  'kith', 'dickies', 'red wing', 'clarks', 'allen edmonds', 'cole haan', 'blundstones?', 'birkenstocks?', 'crocs',
  'common projects', 'everlane', 'j\\.? ?crew', 'banana republic', 'old navy', 'massimo dutti', 'asos', 'shein', 'temu',
  'amazon', 'walmart', 'nordstrom', "macy'?s", 'target\\.com', 'gucci', 'prada', 'louis vuitton', 'balenciaga', 'supreme',
];
const BRAND = new RegExp(`(?:^|[^\\w'])(?:${BRANDS.join('|')})(?![\\w'])`, 'i');
const CREATOR = /\b(?:tim dessaint|dessaint|wanhee(?: kim)?|jaye alexander|frugal aesthetic)\b/i;
const UNLIMITED = /\bunlimited\b/i;
const AI_STYLIST = /\bai[-\s]+stylist\b/i;

// A body word aimed at him: "your face", "you're too skinny", "your weight". Clothes words ("skinny jeans", "a slim
// fit", "the shoulders") are fine: the rule needs "you/your" and a body word that isn't about a garment.
const YOUR_BODY = /\byour\s+(?:body|build|frame|figure|physique|height|weight|face|skin|hair|belly|stomach|gut|chest|arms|legs|waist(?!band| size)|hips|muscles|shape)\b/i;
const YOU_ARE_BODY = /\byou(?:'re|\s+are|\s+look|\s+seem)\s+(?:(?:a\s+bit|kind\s+of|quite|really|very|so|too|pretty)\s+)?(?:fat|overweight|chubby|heavy|big|bigger|skinny|thin|slim|scrawny|lanky|tall|short|small|muscular|athletic|broad|stocky|ugly|handsome|attractive|good[-\s]looking)\b/i;
const BODY_WORD = /\b(?:fat|overweight|chubby|obese|belly|beer gut|love handles|scrawny|lanky|ugly|handsome|attractive|physique|body type|pounds|lbs|kilos)\b/i;
const MENTIONS_HIM = /\b(?:you|your|you're|yourself)\b/i;
// His build or height said back ("for your build", "since you're tall", "at 6'1", "as a bigger guy").
const BUILD_BACK = /\b(?:since|because|as|if)\s+you(?:'re|\s+are)\s+(?:so\s+|pretty\s+|really\s+|quite\s+)?(?:slim|athletic|broad|bigger|big|tall|short|small|stocky|lean|skinny|thin|heavy)\b|\b(?:for|with|given|since)\s+(?:your|a|an)\s+(?:slim|average|athletic|broad|bigger|big|tall|short|small|stocky|lean)?\s*(?:build|frame|guy|body|height)\b|\bas\s+a\s+(?:slim|athletic|broad|bigger|big|tall|short|small|stocky|lean)\s+(?:guy|man|dude)\b|\b(?:slim|athletic|broad|bigger|tall|short)\s+guys?\s+like\s+you\b/i;
const HEIGHT = /\b\d\s*(?:'|’|ft|foot|feet)\s*\d{0,2}\s*(?:"|”|in\b|inches)?|\b1\d{2}\s?cm\b|\b(?:1|2)\.\d{1,2}\s?m\b/i;

// Score-like numbers: "8/10", "7.5 out of 10", "a 7", "an 8.5", "to 8.0", any 0–10 number with one decimal.
const SCORE_PATTERNS: readonly RegExp[] = [
  /(?:^|[^\d.$])(10|\d)(?:\.(\d))?\s*(?:\/|out of)\s*10\b/gi,
  /(?:^|[^\d.$])(10|\d)\.(\d)(?![\d%])(?!\s*(?:cm|mm|in\b|inch|inches|"|”|oz|lbs?|kg|m\b|feet|ft|percent))/g,
  /\b(?:an?|to|at|of|got|get|gets|scored?|scores?)\s+(10|[1-9])(?:\.(\d))?(?=\s*(?:[.,!?;:)]|$|instead|or|and|with|→))/gi,
];

function scoresSaid(sentence: string): string[] {
  const out: string[] = [];
  for (const re of SCORE_PATTERNS) {
    for (const m of allMatches(re, sentence)) out.push(scoreKey(Number(`${m[1]}.${m[2] ?? '0'}`)));
  }
  return out;
}

/** The first rule a sentence breaks, or null when it may show. */
export function checkSentence(sentence: string, ctx: GateContext): GateRule | null {
  if (EMOJI.test(sentence)) return 'emoji';
  if (UNLIMITED.test(sentence)) return 'unlimited';
  if (AI_STYLIST.test(sentence)) return 'aiStylist';
  if (CREATOR.test(sentence)) return 'creator';
  if (BRAND.test(sentence)) return 'brand';
  if (BUILD_BACK.test(sentence)) return 'build';
  if (YOUR_BODY.test(sentence) || YOU_ARE_BODY.test(sentence) || (MENTIONS_HIM.test(sentence) && BODY_WORD.test(sentence))) return 'body';
  if (HEIGHT.test(sentence)) return 'height';
  if (scoresSaid(sentence).some((s) => !ctx.allowedScores.has(s))) return 'score';
  return null;
}

/**
 * The end of the next sentence in `text` from `from`, or -1 while it may still grow: a . ! or ? (with any closing
 * quote or bracket) followed by whitespace, or a line break. "7.5" and "e.g." mid-word never end one.
 */
function sentenceEnd(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    const c = text[i]!;
    if (c === '\n') return i + 1;
    if (c !== '.' && c !== '!' && c !== '?') continue;
    let j = i + 1;
    while (j < text.length && /["'”’)\]]/.test(text[j]!)) j++;
    if (j >= text.length) return -1; // may be "7." of "7.5", or more punctuation: wait
    if (/\s/.test(text[j]!)) return j;
  }
  return -1;
}

/**
 * Cuts a stream into sentences and checks each before it's let through. `push` takes more text and returns what may
 * show now; `end` returns the checked rest. `dropped` lists the rules that dropped sentences (for the log).
 */
export function createSentenceStream(ctx: GateContext) {
  let buf = '';
  let shown = '';
  const dropped: GateRule[] = [];
  const pass = (sentence: string): string => {
    const rule = sentence.trim() ? checkSentence(sentence, ctx) : null;
    if (rule) {
      dropped.push(rule);
      return '';
    }
    // A dropped sentence must not leave a gap: the next one starts where the last shown one ended.
    const out = shown === '' ? sentence.replace(/^\s+/, '') : sentence;
    shown += out;
    return out;
  };
  return {
    push(text: string): string {
      buf += text;
      let out = '';
      for (;;) {
        const end = sentenceEnd(buf, 0);
        if (end < 0) break;
        // Keep the whitespace after a sentence with the next one, so a dropped sentence takes its own space along.
        let k = end;
        while (k < buf.length && /[ \t]/.test(buf[k]!)) k++;
        out += pass(buf.slice(0, end));
        buf = buf.slice(end);
        if (k > end) {
          const space = buf.slice(0, k - end);
          buf = buf.slice(k - end);
          if (shown !== '' && !shown.endsWith(' ') && !shown.endsWith('\n')) {
            shown += space;
            out += space;
          }
        }
      }
      return out;
    },
    end(): string {
      const rest = buf;
      buf = '';
      return rest.trim() ? pass(rest) : '';
    },
    get text(): string {
      return shown.trim();
    },
    dropped,
  };
}
