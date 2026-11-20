// The sentence gate (07 §7.3, checks A4–A5): every sentence of an answer is checked on the phone before it shows.
// A sentence that breaks a rule is dropped (the rest of the answer stays); drops are logged by rule name only, never
// the text. Rules: an emoji · "unlimited" · "AI stylist" · a brand or shop · a creator's name · a body word aimed at
// him · his build or height said back to him · a score-like number the evidence doesn't hold.
// The stream is cut into sentences as it arrives (SentenceStream), so the live row only ever shows checked sentences.
// The voice (07 §15.5, K2): filler ("Great question!" alone, "Let me know if…", "Hope this helps") and the banned
// words ("elevate", "drip", "vibe") drop their sentence; an opener before a comma ("Absolutely, …") is cut off the first
// sentence. Markup (**, #, bullets, backticks) never shows: the answer's look is drawn by code (L3).

import { COLOR_CHOICES } from '@kitted/core';

export type GateRule = 'emoji' | 'unlimited' | 'aiStylist' | 'brand' | 'creator' | 'body' | 'build' | 'height' | 'score' | 'filler' | 'banned' | 'handle' | 'fact' | 'price' | 'color' | 'deny' | 'claim' | 'place';

export interface GateContext {
  /** Every score that may be said: the one-decimal numbers in the pack and the evidence ("7.0", "7.5"). */
  allowedScores: ReadonlySet<string>;
  /** His closet's piece names ("Navy overshirt"): mid-sentence they lose their capital ("your navy overshirt", #310). */
  pieceNames?: readonly string[];
  /** His owned pieces' facts, for the fact rule (#311): "your straight jeans" when his jeans are slim is dropped. */
  pieces?: readonly GatePiece[];
  /** T105 KC8.1: dollar amounts in the pack and the evidence ("115", "30", "60"); absent = none. */
  allowedPrices?: ReadonlySet<string>;
  /** T105 KC3.3: color families Kit may name; null, absent or empty = the sentence rule is off. */
  allowedColors?: ReadonlySet<string> | null;
  /** T105 KC3.3: families his sentences may name besides the list. */
  ownColors?: ReadonlySet<string>;
  /** T105 KC6.2: Closet's Outfits view is live (absent = false). */
  outfitsOn?: boolean;
  /** T105 KC1.4: the code added a piece before this answer (T106 sets it). */
  didAdd?: boolean;
  /** T105 KC1.4: the code changed a piece before this answer (T107 sets it). */
  didChange?: boolean;
}

export interface GatePiece {
  name: string;
  category: string;
  subcategory: string;
  color: string;
  leg: string;
}

// The fact rule (07 §16.3): "your/the <color or leg words> <kind of piece>" must fit one of his pieces of that kind.
const PIECE_NOUN = /\b(your|the|those|these|that)\s+((?:[a-z][a-z-]*\s+){1,3}?)(jeans|chinos|trousers|pants|cargos|joggers|sweatpants|tees?|t-shirts?|shirts?|oxfords?|crewnecks?|sweaters?|sweatshirts?|hoodies?|overshirts?|jackets?|coats?|sneakers|runners|loafers|boots|shoes)\b/gi;
const LEG_GROUP: Record<string, string> = { skinny: 'narrow', slim: 'narrow', tapered: 'narrow', straight: 'straight', wide: 'wide', baggy: 'wide', relaxed: 'wide', bootcut: 'bootcut' };
const COLOR_FAMILIES: Record<string, readonly string[]> = {
  black: ['black'], white: ['white', 'cream', 'off_white'], cream: ['cream', 'white', 'off_white'], grey: ['grey', 'gray', 'charcoal', 'light_grey'], gray: ['grey', 'gray', 'charcoal', 'light_grey'],
  charcoal: ['charcoal', 'grey'], navy: ['navy'], blue: ['blue', 'light_blue', 'navy', 'denim_mid', 'denim_light', 'denim_dark'], 'light-blue': ['light_blue', 'blue'],
  brown: ['brown', 'tan'], tan: ['tan', 'khaki_beige', 'brown', 'beige'], khaki: ['khaki_beige', 'tan', 'beige'], beige: ['khaki_beige', 'beige', 'tan'],
  olive: ['olive', 'green'], green: ['green', 'olive'], red: ['red', 'burgundy'], burgundy: ['burgundy', 'red'], orange: ['orange', 'rust'], rust: ['rust', 'orange'],
  yellow: ['yellow'], pink: ['pink'], purple: ['purple'], dark: ['denim_dark', 'black', 'navy', 'charcoal'], light: ['denim_light', 'light_blue', 'light_grey', 'white', 'cream', 'khaki_beige'],
};
const NOUN_KIND: Record<string, { category: string; sub?: RegExp }> = {
  jeans: { category: 'bottom', sub: /jean/ }, chinos: { category: 'bottom', sub: /chino/ }, trousers: { category: 'bottom' }, pants: { category: 'bottom' },
  cargos: { category: 'bottom', sub: /cargo/ }, joggers: { category: 'bottom', sub: /jogger|sweat/ }, sweatpants: { category: 'bottom', sub: /sweat|jogger/ },
  tee: { category: 'top', sub: /tee|t_shirt/ }, 't-shirt': { category: 'top', sub: /tee|t_shirt/ }, shirt: { category: 'top', sub: /shirt|oxford/ }, oxford: { category: 'top', sub: /oxford/ },
  crewneck: { category: 'top', sub: /sweater|crew/ }, sweater: { category: 'top', sub: /sweater|knit|crew/ }, sweatshirt: { category: 'top', sub: /sweatshirt/ }, hoodie: { category: 'top', sub: /hood/ },
  overshirt: { category: 'outerwear', sub: /overshirt/ }, jacket: { category: 'outerwear' }, coat: { category: 'outerwear' },
  sneakers: { category: 'footwear', sub: /sneaker|runner/ }, runners: { category: 'footwear', sub: /runner/ }, loafers: { category: 'footwear', sub: /loafer/ },
  boots: { category: 'footwear', sub: /boot/ }, shoes: { category: 'footwear' },
};
const FILLER_WORDS = new Set(['pair', 'of', 'leg', 'wash', 'denim', 'leather', 'suede']);

/** "your straight jeans" when none of his jeans is straight: a fact about his piece the closet contradicts (#311). */
export function pieceFactClash(sentence: string, pieces: readonly GatePiece[] = []): boolean {
  if (pieces.length === 0) return false;
  for (const m of allMatches(PIECE_NOUN, sentence)) {
    const words = m[2]!.toLowerCase().trim().split(/\s+/);
    const legs = words.filter((w) => LEG_GROUP[w]);
    const colors = words.filter((w) => COLOR_FAMILIES[w]);
    if (legs.length === 0 && colors.length === 0) continue;
    const mine = piecesOfKind(m[3]!, pieces);
    if (mine.length === 0) continue; // not a piece he owns: buying advice, or nothing to check against
    // Only describing words may sit between "your" and the noun ("the jeans with the boots" isn't one); a word of
    // the piece's own name ("work", "chelsea") describes it too (T105).
    const nameWords = nameWordsOf(mine);
    if (words.some((w) => !LEG_GROUP[w] && !COLOR_FAMILIES[w] && !FILLER_WORDS.has(w) && !nameWords.has(w))) continue;
    if (!mine.some((p) => fitsPiece(p, legs, colors))) return true;
  }
  return false;
}

/** His owned pieces a kind noun ("boots", "jeans") names. */
function piecesOfKind(rawNoun: string, pieces: readonly GatePiece[]): GatePiece[] {
  let noun = rawNoun.toLowerCase();
  if (!NOUN_KIND[noun]) noun = noun.replace(/s$/, '');
  const kind = NOUN_KIND[noun];
  if (!kind) return [];
  return pieces.filter((p) => p.category === kind.category && (!kind.sub || kind.sub.test(p.subcategory) || kind.sub.test(p.name.toLowerCase())));
}

const nameWordsOf = (mine: readonly GatePiece[]): Set<string> => {
  const out = new Set<string>();
  for (const p of mine) for (const w of p.name.toLowerCase().split(/[^a-z]+/)) if (w) out.add(w);
  return out;
};

/** Do the leg and color words fit this piece (its facts, or a word in its name)? */
function fitsPiece(p: GatePiece, legs: readonly string[], colors: readonly string[]): boolean {
  const name = p.name.toLowerCase();
  const legOk = legs.every((w) => LEG_GROUP[p.leg] === LEG_GROUP[w] || name.includes(w));
  const colorOk = colors.every((w) => COLOR_FAMILIES[w]!.includes(p.color) || name.includes(w));
  return legOk && colorOk;
}

/**
 * KC5.2: "your dark brown work boots" when his only boots are "Black work boots" → "your black work boots". Only a
 * wrong color is rewritten, and only when exactly one piece of that kind is his and the legs agree; anything else
 * (two pieces of the kind, a leg clash, a color that fits) is left for the `fact` rule.
 */
export function rewritePieceNames(sentence: string, pieces: readonly GatePiece[] = []): string {
  if (pieces.length === 0) return sentence;
  return sentence.replace(PIECE_NOUN, (match: string, det: string, rawWords: string, noun: string) => {
    // Only "your …" is his piece. "the/those/that white sneakers" is often one he'd buy ("Swap them for the white
    // sneakers"), so renaming it to his black pair would say nonsense (T105 review): the fact rule handles those.
    if (det.toLowerCase() !== 'your') return match;
    const words = rawWords.toLowerCase().trim().split(/\s+/);
    const legs = words.filter((w) => LEG_GROUP[w]);
    const colors = words.filter((w) => COLOR_FAMILIES[w]);
    if (colors.length === 0) return match;
    const mine = piecesOfKind(noun, pieces);
    if (mine.length !== 1) return match;
    const p = mine[0]!;
    const nameWords = nameWordsOf(mine);
    if (words.some((w) => !LEG_GROUP[w] && !COLOR_FAMILIES[w] && !FILLER_WORDS.has(w) && !nameWords.has(w))) return match;
    if (!fitsPiece(p, legs, [])) return match; // a leg clash is the fact rule's
    if (fitsPiece(p, legs, colors)) return match; // nothing is wrong
    return `${det} ${p.name.charAt(0).toLowerCase()}${p.name.slice(1)}`;
  });
}

/** The pack's handles never show ("your olive overshirt (P13)" → "your olive overshirt"; seen live, #310). */
export function stripHandles(sentence: string): string {
  return sentence.replace(/\s*[([](?:P|FC)\d+(?:\s*[,/]\s*(?:P|FC)\d+)*[)\]]/g, '');
}
/** A handle left in the words themselves ("Wear P7 with it") can't be cut cleanly: the sentence goes. */
const BARE_HANDLE = /\b(?:P|FC)\d+\b/;

/** "over your Navy overshirt" → "over your navy overshirt"; a name opening the sentence keeps its capital. */
export function lowerNames(sentence: string, names: readonly string[] = []): string {
  let out = sentence;
  for (const n of names) {
    if (!n || n.charAt(0) === n.charAt(0).toLowerCase()) continue;
    const low = n.charAt(0).toLowerCase() + n.slice(1);
    let from = 0;
    for (;;) {
      const i = out.indexOf(n, from);
      if (i < 0) break;
      const before = out.slice(0, i).trimEnd();
      if (before !== '' && !/[.!?:]$/.test(before)) out = out.slice(0, i) + low + out.slice(i + n.length);
      from = i + n.length;
    }
  }
  return out;
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
  // T105 KC8.1: more shops and common product brands.
  'etsy', 'ebay', 'depop', 'grailed', 'poshmark', 'thredup', 'mercari', 'urban outfitters', 'costco', "kohl'?s", 'jcpenney', 'dsw',
  'foot locker', 'ssense', 'farfetch', 'mr\\.? porter', 'todd snyder', 'buck mason', 'bonobos', 'suitsupply', 'casio', 'g-shock',
  'seiko', 'timex', 'ray-ban', 'oakley', 'burberry', 'dior', 'rolex', 'tiffany', 'cartier', 'brooks brothers', 'anthropologie', 'primark',
];
const BRAND = new RegExp(`(?:^|[^\\w'])(?:${BRANDS.join('|')})(?![\\w'])`, 'i');
// A link: a scheme, www., or a name ending in a web suffix.
const LINK = /https?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|net|org|co|shop|store)\b/i;
// Words that are also everyday words count only capitalised, after a pointing word ("try Target", "at Gap").
const AMBIGUOUS_SHOP = /\b(?:[Aa]t|[Ff]rom|[Tt]ry|[Oo]n|[Cc]heck|[Hh]ead\s+to|[Ss]hop\s+at)\s+(?:Target|Gap|Express|Guess|Champion|Boss)\b/;
const CREATOR = /\b(?:tim dessaint|dessaint|wanhee(?: kim)?|jaye alexander|frugal aesthetic)\b/i;
const UNLIMITED = /\bunlimited\b/i;
const AI_STYLIST = /\bai[-\s]+stylist\b/i;

// A body word aimed at him: "your face", "you're too skinny", "your weight". Clothes words ("skinny jeans", "a slim
// fit", "the shoulders") are fine: the rule needs "you/your" and a body word that isn't about a garment.
const YOUR_BODY = /\byour\s+(?:body|build|frame|figure|physique|height|weight|face|skin|hair|hairline|belly|stomach|gut|tummy|chest|arms|legs|thighs|calves|butt|neck|chin|jaw|jawline|waist(?!band| size)|hips|muscles|shape|age|coloring|colouring|complexion|undertones?|eyes?|eye\s+colou?r)\b/i;
// T105 KC3.5: color talk about him (skin tone, undertones, complexion, eye or hair color, brown eyes).
// ("my complexion" is his own word, in a follow-up tap the card check already drops; Kit's own sentence never says "my".)
const COLORING_BODY = /\b(?:skin\s+tones?|undertones?|(?:(?!my\b)[a-z']+\s+)complexion|eye\s+colou?r|hair\s+colou?r|(?:brown|blue|green|hazel|grey|gray)\s+eyes)\b/i;
// Said of him: size, build, age or looks, with up to three modifiers ("you're not too skinny", "it makes you look
// taller", "you look about 25", "you look older in the grey"). "You look good / great / sharp" are not in it.
const YOU_ARE_BODY = /\byou(?:'re|\s+are|\s+look|\s+seem|\s+appear)\s+(?:(?:not|a\s+bit|a\s+little|kind\s+of|quite|really|very|so|too|pretty|way|much|even|a\s+lot|about|around|like)\s+){0,3}(?:fat|fatter|overweight|chubby|heavy|heavier|big|bigger|skinny|skinnier|thin|thinner|slim|slimmer|scrawny|lanky|tall|taller|short|shorter|small|smaller|muscular|athletic|broad|broader|wide|wider|lean|leaner|stocky|ugly|handsome|attractive|good[-\s]looking|old(?![-\s](?:school|fashioned|money))|older|young|younger|boyish|mature|(?:1\d|[2-9]\d)(?!\d|[.,]\d|['’"”/]|\s*(?:%|percent|inch|inches|cm|mm|lbs?|kg|bucks|dollars|out\s+of|minutes?)))\b/i;
// What a cut does to a part of him: "it hides the gut", "it slims your belly", "a cap hides a receding hairline".
// Garment parts ("hides the belt", "hides the waistband") don't count.
const HIDES_BODY = /\b(?:hides?|hid|hiding|conceals?|concealing|disguises?|masks?|slims?|slimming|flatters?|flattering|minimi[sz]es?|camouflages?)\s+(?:the\s+|your\s+|a\s+|any\s+|that\s+|some\s+)?(?:(?!my\b)[a-z]+\s+)?(?:gut|belly|stomach|tummy|thighs?|hips|waist|arms|hairline|love\s+handles|muffin\s+top|butt|chin|double\s+chin|neck|frame|figure|build|body|weight|pounds|bald\s+spot)\b/i;
// Skin by its color: never about a garment, so no "you" needed ("Pale skin suits orange."; "pale blue" stays).
const SKIN_COLOR = /\b(?:pale|fair|dark|darker|light|lighter|olive|tan|tanned|brown|black|white|warm|cool|deep|medium|rosy|ruddy)[-\s]+(?:skin|skinned)\b/i;
// What girls or women like in a guy: Kit never speaks for who finds him attractive ("Women's sizes" is fine).
const GIRLS_LIKE = /\b(?:girls|women|ladies|chicks|a\s+girl|a\s+woman)\s+(?:(?:tend\s+to|usually|always|really|often|generally|will|would|do|all)\s+){0,2}(?:like|likes|love|loves|prefer|prefers|notice|notices|dig|digs|go\s+for|want|wants|are\s+into|find|finds|think|swoon|fall\s+for)\b/i;
// A number on him rather than the outfit: "You're a 7 on looks."
const LOOKS_NUMBER = /\b(?:10|\d)(?:\.\d)?\s*(?:\/\s*10\s*|out\s+of\s+10\s*)?(?:on|for|in)\s+(?:looks|attractiveness|your\s+looks|your\s+face|face|physique)\b/i;
const BODY_WORD = /\b(?:fat|overweight|chubby|obese|belly|beer gut|love handles|scrawny|lanky|ugly|handsome|attractive|physique|body type|pounds|lbs|kilos)\b/i;
const MENTIONS_HIM = /\b(?:you|your|you're|yourself)\b/i;
// His build or height said back ("for your build", "since you're tall", "at 6'1", "as a bigger guy").
const BUILD_BACK = /\b(?:since|because|as|if)\s+you(?:'re|\s+are)\s+(?:so\s+|pretty\s+|really\s+|quite\s+)?(?:slim|athletic|broad|bigger|big|tall|short|small|stocky|lean|skinny|thin|heavy)\b|\b(?:for|with|given|since)\s+(?:your|a|an)\s+(?:slim|average|athletic|broad|bigger|big|tall|short|small|stocky|lean)?\s*(?:build|frame|guy|body|height)\b|\bas\s+a\s+(?:slim|athletic|broad|bigger|big|tall|short|small|stocky|lean)\s+(?:guy|man|dude)\b|\b(?:slim|athletic|broad|bigger|tall|short)\s+guys?\s+like\s+you\b/i;
const HEIGHT = /\b\d\s*(?:'|’|ft|foot|feet)\s*\d{0,2}\s*(?:"|”|in\b|inches)?|\b1\d{2}\s?cm\b|\b(?:1|2)\.\d{1,2}\s?m\b/i;

// Score-like numbers: "8/10", "7.5 out of 10", "a 7", "an 8.5", "to 8.0", any 0–10 number with one decimal.
const SCORE_PATTERNS: readonly RegExp[] = [
  /(?:^|[^\d.$])(10|\d)(?:\.(\d))?\s*(?:\/|out of)\s*10\b/gi,
  /(?:^|[^\d.$])(10|\d)\.(\d)(?![\d%])(?!\s*(?:cm|mm|in\b|inch|inches|"|”|oz|lbs?|kg|m\b|feet|ft|percent))/g,
  // (?!\.\d): "score 7.5 on the photo" is a 7.5, never "score 7" followed by a full stop (a false 7.0, #311).
  /\b(?:an?|to|at|of|got|get|gets|scored?|scores?)\s+(10|[1-9])(?:\.(\d))?(?!\.?\d)(?=\s*(?:[.,!?;:)]|$|instead|or|and|with|→))/gi,
];

// A score in words ("a ten needs that layer", "gets you to an eight"): seen live from Flash-Lite (#311).
const WORD_SCORES: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const WORD_SCORE = /\b(?:an?|to an?|to|got an?|get an?|gets an?|scored an?|scores an?|score an?)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b(?![-\s]+(?:minutes?|seconds?|hours?|days?|weeks?|months?|years?|outfits?|pieces?|times?|inch(?:es)?|dollars?|bucks?|percent|pairs?|of|or|more|new|other|looks?|things?|ways?))(?=\s*(?:[.,!?;:)]|$|needs|takes|would|is|instead|with|on|for))/gi;

function scoresSaid(sentence: string): string[] {
  const out: string[] = [];
  for (const re of SCORE_PATTERNS) {
    for (const m of allMatches(re, sentence)) out.push(scoreKey(Number(`${m[1]}.${m[2] ?? '0'}`)));
  }
  for (const m of allMatches(WORD_SCORE, sentence)) out.push(scoreKey(WORD_SCORES[m[1]!.toLowerCase()]!));
  return out;
}

// The voice spec's never-list (rubric/stylist-guide.md §0). Whole words only.
const FILLER = /^\s*(?:let me know\b|hope (?:this|that) helps|feel free to\b|happy to help|(?:any|got any) (?:other|more) questions|if you have (?:any )?(?:other |more )?questions)/i;
const OPENER_ONLY = /^\s*(?:(?:great|good|nice|fair|love this|love that) question|absolutely|sure thing|sure|of course|certainly|definitely|totally|great|awesome|okay so|ok so)\s*[.!]+\s*$/i;
const OPENER_LEAD = /^\s*(?:(?:great|good|nice) question|absolutely|sure thing|sure|of course|certainly|definitely|totally)\s*[,!:—–-]\s+/i;
const BANNED = /\b(?:elevat(?:e|es|ed|ing)|drip|vibes?|vibey|game[-\s]?changers?|slay(?:s|ed)?|level(?:s|ed)? up|swag|fire fit|goes hard)\b/i;

/** Model markup never shows (the look is drawn by code): **bold**, __bold__, `code`, a heading's #, a bullet. */
export function stripMarkup(text: string): string {
  return text
    .replace(/\*\*|__|`+/g, '')
    .replace(/(^|\n)[ \t]*#{1,6}[ \t]+/g, '$1')
    .replace(/(^|\n)[ \t]*(?:[-*•]|\d+[.)])[ \t]+/g, '$1');
}

/** The first sentence without an opener: "Absolutely, olive works." → "Olive works." */
export function trimOpener(sentence: string): string {
  const m = OPENER_LEAD.exec(sentence);
  if (!m) return sentence;
  const rest = sentence.slice(m[0].length);
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** The first rule a sentence breaks, or null when it may show. */
export function checkSentence(sentence: string, ctx: GateContext): GateRule | null {
  if (EMOJI.test(sentence)) return 'emoji';
  if (FILLER.test(sentence) || OPENER_ONLY.test(sentence)) return 'filler';
  if (BANNED.test(sentence)) return 'banned';
  if (BARE_HANDLE.test(sentence)) return 'handle';
  if (UNLIMITED.test(sentence)) return 'unlimited';
  if (AI_STYLIST.test(sentence)) return 'aiStylist';
  if (CREATOR.test(sentence)) return 'creator';
  if (BRAND.test(sentence) || LINK.test(sentence) || AMBIGUOUS_SHOP.test(sentence)) return 'brand';
  if (DENY.test(sentence)) return 'deny';
  if (CLAIM_ADD.test(sentence) && !ctx.didAdd) return 'claim';
  if (CLAIM_CHANGE.test(sentence) && !ctx.didChange) return 'claim';
  if (PLACE_BUY.test(sentence) || (!ctx.outfitsOn && PLACE_OUTFITS.test(sentence))) return 'place';
  if (PRICE_PIECE.test(sentence)) {
    const allowed = ctx.allowedPrices;
    for (const p of pricesIn(sentence)) if (!allowed || !allowed.has(p)) return 'price';
  }
  if (ctx.allowedColors && ctx.allowedColors.size > 0) {
    for (const c of colorsNamed(sentence)) if (!ctx.allowedColors.has(c) && !ctx.ownColors?.has(c)) return 'color';
  }
  if (BUILD_BACK.test(sentence)) return 'build';
  if (YOUR_BODY.test(sentence) || YOU_ARE_BODY.test(sentence) || (MENTIONS_HIM.test(sentence) && BODY_WORD.test(sentence))) return 'body';
  if (COLORING_BODY.test(sentence) || HIDES_BODY.test(sentence) || SKIN_COLOR.test(sentence) || GIRLS_LIKE.test(sentence) || LOOKS_NUMBER.test(sentence)) return 'body';
  if (HEIGHT.test(sentence)) return 'height';
  if (scoresSaid(sentence).some((s) => !ctx.allowedScores.has(s))) return 'score';
  if (pieceFactClash(sentence, ctx.pieces)) return 'fact';
  return null;
}

/**
 * The end of the next sentence in `text` from `from`, or -1 while it may still grow: a . ! or ? (with any closing
 * quote or bracket) followed by whitespace, or a line break. "7.5" and "e.g." mid-word never end one.
 */
const ABBREV = /(?:^|[^\w])(?:vs|e\.g|i\.e|approx|incl|mr|dr)\.$/i;

function sentenceEnd(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    const c = text[i]!;
    if (c === '\n') return i + 1;
    if (c !== '.' && c !== '!' && c !== '?') continue;
    if (c === '.' && ABBREV.test(text.slice(Math.max(0, i - 6), i + 1))) continue;
    let j = i + 1;
    while (j < text.length && /["'”’)\]]/.test(text[j]!)) j++;
    if (j >= text.length) return -1; // may be "7." of "7.5", or more punctuation: wait
    if (/\s/.test(text[j]!)) return j;
  }
  return -1;
}

/** A finished text cut into sentences (each with its own trailing space trimmed), the way the stream cuts it. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  let rest = text;
  for (;;) {
    const end = sentenceEnd(rest, 0);
    if (end < 0) break;
    const s = rest.slice(0, end).trim();
    if (s) out.push(s);
    rest = rest.slice(end);
  }
  if (rest.trim()) out.push(rest.trim());
  return out;
}

/**
 * Cuts a stream into sentences and checks each before it's let through. `push` takes more text and returns what may
 * show now; `end` returns the checked rest. `dropped` lists the rules that dropped sentences (for the log).
 */
export function createSentenceStream(ctx: GateContext) {
  let buf = '';
  let shown = '';
  const dropped: GateRule[] = [];
  const pass = (raw: string): string => {
    let sentence = stripMarkup(raw);
    if (shown === '') sentence = trimOpener(sentence.replace(/^\s+/, ''));
    sentence = rewritePieceNames(lowerNames(stripHandles(sentence), ctx.pieceNames), ctx.pieces);
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

// ---------------------------------------------------------------- T105 (tasks/T105/IMPLEMENTATION.md)
/** The cards that count as "a card" for the 40-word limit: the ones that draw a picture or a piece (D1). */
export const DRAWN_CARD_TYPES: ReadonlySet<string> = new Set(['outfit', 'options', 'colors', 'add', 'changed', 'buy']);

/** Whitespace-separated tokens that hold a letter or a digit ("button-up" and "7.5" are one; a lone dash is none). */
export function wordCount(s: string): number {
  let n = 0;
  for (const w of s.split(/\s+/)) if (/[A-Za-z0-9\u00C0-\u024F]/.test(w)) n++;
  return n;
}

/**
 * KC1.1: the longest prefix of whole sentences that fits: with a drawn card two sentences and 40 words, without 60
 * words. The first sentence is always kept whole (the 15-word first line is asked of the model, never cut into).
 */
export function cutAnswer(text: string, withCard: boolean): string {
  const t = text.trim();
  const maxWords = withCard ? 40 : 60;
  const maxSentences = withCard ? 2 : Infinity;
  let kept = 0;
  let count = 0;
  let from = 0;
  while (from < t.length) {
    let end = sentenceEnd(t, from);
    if (end < 0) end = t.length;
    if (t.slice(from, end).trim() === '') { from = end; continue; } // a line break after a full stop
    const upto = t.slice(0, end).trimEnd();
    if (count > 0 && (count >= maxSentences || wordCount(upto) > maxWords)) break;
    kept = upto.length;
    count++;
    from = end;
  }
  return t.slice(0, kept);
}

/** Dollar amounts a text holds, as digits: "$115" → "115", "$30–60" → "30" and "60", "90 dollars", "90 bucks" → "90". */
export function pricesIn(text: string): Set<string> {
  const out = new Set<string>();
  const num = (raw: string) => raw.replace(/,/g, '').split('.')[0]!;
  for (const m of allMatches(/\$\s?(\d[\d,]*(?:\.\d+)?)(?:\s*[–—-]\s*\$?\s?(\d[\d,]*(?:\.\d+)?))?/g, text)) {
    out.add(num(m[1]!));
    if (m[2]) out.add(num(m[2]));
  }
  for (const m of allMatches(/\b(\d[\d,]*)\s*(?:dollars?|bucks?)\b/gi, text)) out.add(num(m[1]!));
  return out;
}

// Color words, multi-word first; each match is blanked so "light blue" is never also "blue". "denim", "gold" and
// "silver" are absent on purpose (a fabric and metals, KC9.2); the denim washes only as "light/mid/dark denim".
const COLOR_WORDS: readonly (readonly [RegExp, string])[] = [
  [/\boff[-\s]white\b/gi, 'off_white_cream'], [/\bcream\b/gi, 'off_white_cream'],
  [/\blight\s+gr[ae]y\b/gi, 'light_grey'], [/\bdark\s+gr[ae]y\b/gi, 'charcoal'], [/\bcharcoal\b/gi, 'charcoal'],
  [/\bnavy(?:\s+blue)?\b/gi, 'navy'], [/\bdark\s+blue\b/gi, 'navy'], [/\blight\s+blue\b/gi, 'light_blue'],
  [/\blight\s+denim\b/gi, 'denim_light'], [/\bmid\s+denim\b/gi, 'denim_mid'], [/\bdark\s+denim\b/gi, 'denim_dark'],
  [/\bgr[ae]y\b/gi, 'grey'], [/\bwhite\b/gi, 'white'], [/\bblack\b/gi, 'black'], [/\bblue\b/gi, 'blue'],
  [/\bolive\b/gi, 'olive'], [/\bgreen\b/gi, 'green'], [/\bsage\b/gi, 'sage'],
  [/\bkhaki\b/gi, 'khaki_beige'], [/\bbeige\b/gi, 'khaki_beige'], [/\btan\b/gi, 'tan_camel'], [/\bcamel\b/gi, 'tan_camel'],
  [/\bbrown\b/gi, 'brown'], [/\bburgundy\b/gi, 'burgundy'], [/\bred\b/gi, 'red'], [/\borange\b/gi, 'orange'],
  [/\byellow\b/gi, 'yellow'], [/\bpink\b/gi, 'pink'], [/\bpurple\b/gi, 'purple'],
];

/** The color families a sentence names, in palette order, no duplicates (KC3.3). */
export function colorsNamed(sentence: string): string[] {
  const found = new Set<string>();
  let rest = sentence;
  for (const [re, family] of COLOR_WORDS) {
    re.lastIndex = 0;
    if (re.test(rest)) found.add(family);
    re.lastIndex = 0;
    rest = rest.replace(re, ' ');
  }
  return COLOR_CHOICES.filter((c) => found.has(c));
}

// ---- the T105 sentence rules
const CAN_NOT = "(?:can['’]?t|cannot|won['’]t\\s+be\\s+able\\s+to|unable\\s+to|not\\s+able\\s+to)";
const DENY = new RegExp(
  `\\b${CAN_NOT}\\s+(?:\\w+\\s+){0,2}?(?:(?:add|save|put)\\b[^.!?]*\\b(?:closet|wardrobe|pieces?|items?)|(?:add|save)\\s+(?:that|it|this|them|these|those)\\b|(?:change|update|fix|rename|correct|edit)\\b[^.!?]*\\b(?:closet|pieces?|colou?rs?|names?)|show\\b[^.!?]*\\b(?:outfits?|examples?))\\b`, 'i');
const CLAIM_ADD = /\b(?:I(?:\s+have|['’]ve)?\s+(?:just\s+)?added|(?:it|that)(?:['’]s|\s+is)\s+(?:now\s+)?added)\b[^.!?]*\b(?:closet|wardrobe)\b|\b(?:done|all set)\b[^.!?]{0,40}\b(?:closet|wardrobe)\b|\b(?:it|that)(?:['’]s|\s+is)\s+now\s+in\s+your\s+(?:closet|wardrobe)\b/i;
const CLAIM_CHANGE = /\bI(?:\s+have|['’]ve)?\s+(?:just\s+)?(?:changed|updated|renamed|corrected|fixed|redrew)\s+(?:your|the|that|it)\b/i;
const PLACE_BUY = /\b(?:next[-\s]buy|buy[-\s]next|best[-\s]buy)\s+(?:section|tab|screen|page|list|view|menu)\b/i;
const PLACE_OUTFITS = /\boutfits?\s+(?:tab|view|section|screen|page)\b/i;
const PRICE_PIECE = /\b(?:jeans|chinos|trousers|pants|tees?|shirts?|sweaters?|hoodies?|jackets?|coats?|overshirts?|sneakers|boots|loafers|shoes|belts?|watch(?:es)?|caps?|beanies?|pairs?|pieces?)\b/i;
