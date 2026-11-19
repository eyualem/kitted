// The router (07 §5.1, check R1): plain code on the phone, no AI. Which kind of question it is, which of his
// pieces and which check it names, and the occasion if one is said. The evidence step (evidence.ts) computes only
// what that kind needs. When it can't tell (`sure: false`), the model gets the pack alone and may ask for one lookup.
import type { ClosetItemRow, FitCheckRow, OccasionKey } from '@/data/types';
import { displayScore } from '@/design-system/score';
import type { StylistContext } from './context';
import { pieceWordsOf } from './memory';
import type { AskKind } from './prompt';

export interface Route {
  kind: AskKind;
  /** Piece handles named in the question, in the order they appear ("P7"). */
  pieces: string[];
  /** The check it's about ("FC1"), when the kind needs one. */
  check: string | null;
  occasion: OccasionKey | null;
  /** false: the router guessed; the model may ask for one lookup (R3). */
  sure: boolean;
  /** T106 (KC4): he said he owns a piece (`mention`) or asked to add it (`ask`); what his words say of its kind and color. */
  add?: AddRead | null;
}

export interface AddRead {
  mode: 'mention' | 'ask';
  /** A closet subcategory ('tee', 'work_boot'), or null when his words name no kind of piece. */
  kind: string | null;
  color: string | null;
}

// Lower case, quotes straightened, punctuation gone (a "." stays only inside a number like 6.5).
const norm = (s: string) => ` ${s.toLowerCase().replace(/[’']/g, "'").replace(/\.(?!\d)/g, ' ').replace(/[^a-z0-9.' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;

/** First match wins, in this order: the specific asks before the broad ones. */
const KINDS: readonly [AskKind, RegExp][] = [
  // "I'm not wearing slides in that picture" / "you mixed up the checks": a push-back on a wrong read pins the check too.
  ['feedback', / (wrong|unfair|should (be|have been|get) (a )?higher|too (low|harsh|strict)|robbed|deserve(d)? (more|better|higher)|that'?s not right|not a (5|6|7)|(i'?m|i am|i was) not wearing|i (didn'?t|did not) wear|mixed (it |them |that )?up|not (my|the right) (photo|picture|pic|outfit|fit|check)) /],
  ['remember', /^ (i'?m a |i am a |i wear a |i'?m an? \d|my (waist|inseam|size|shoe size|budget|work|job|office|school|dress code) |i (hate|love|don'?t like|can'?t stand|prefer|never wear|always wear|own|have|got|bought) |remember (that|i)|i work |i go to |i'?m in (college|school|uni)|i have (a|an) (wedding|interview|date|event))/],
  ['whatIf', / (what if|if i (swap|swapped|switch|switched|wore|wear|change|changed|tuck|tucked|roll|rolled|cuff|cuffed|add|added|take off|took off|lose|lost)|would (it|that|this|my score) (be|go|get) (higher|better|up)|instead of the) /],
  ['explain', / (why (did|do|is|was|only|didn'?t|not)|why (only )?(a|an|the|that|this) \d(\.\d)?|how come|explain|what (brought|kept|pulled) .*(down|back)|my (score|\d(\.\d)?)|(only|just) (got|get) an? \d|what'?s (wrong|off) with (my|today'?s|this) (fit|outfit|check)|is (my|this|today'?s) (fit|outfit|look)( today)? (good|ok|okay|fine|alright|decent|bad|any good)|how (does|is) (my|today'?s) (fit|outfit) (look|looking|doing)) /],
  ['canIWear', /^ (can|could|should) i wear | is it (ok|okay|fine|alright|allowed) (to|if)? | (does|do|will|would) .* (work|look (ok|okay|good|fine)) (with|for|to) |^ (can|could) .* go (with|to) | too (casual|dressy|formal) (for|to) /],
  ['goesWith', / (goes? with|go with|wear (it )?with|pair (it )?with|match(es)?|matching|what to wear with|style (it|my|the)) /],
  ['whatToWear', / (what (should|do|can|could) i wear|what to wear|outfit (for|idea|tonight|tomorrow)|(tonight|tomorrow|today)'?s? (outfit|fit)|what (fit|outfit) (for|should)|dress for|wear (to|for) (a|an|my|the)? ?(date|interview|wedding|class|work|party|event|dinner|concert|club)) /],
  ['buyNext', / (buy|purchase|invest in|missing|next piece|add to my (closet|wardrobe)|first piece|should i get|worth (getting|buying)|what (do|should) i (get|need)) /],
  ['shape', / (too (long|short|baggy|big|tight|wide)|bunch(es|ing)?( up)?|stack(s|ing)?|the break|tuck(ed|ing)?|crop(ped)?|proportion(s)?|silhouette|how should .* sit|look(s)? off|boxy|sits (right|wrong)|hang(s)? (low|long)) /],
  ['fitHowTo', / (how (should|do|does|to|can|tight|loose|long)|fit|fitted|sizing|size up|size down|hem(med)?|cuff|roll|tailor(ed|ing)?|shrink|iron|wash|care for|steam|break in|lace) /],
];

/** "Add it", "can you add that to my closet", "add my white tee to my closet": he asks for the add (KC4.5). */
const ADD_ASK = / (?:add|save|put|log) (?:it|that|this|these|those|them) | (?:add|save|put) [a-z0-9' -]{0,60} (?:to|in|into) (?:my|the) (?:closet|wardrobe) /;
/** "I have…", "I own…", "I got…", "I bought…" (KC4.1): a plain mention, never an ask. */
const OWN_MENTION = /(?:^| (?:and|but|so|also|then)|[.!?,;]) (?:i have|i'?ve got|i own|i got|i bought|i just (?:got|bought)|i also (?:have|own|got|bought)) ([^.!?]*)/;
const NOT_ADD = / (?:(?:don'?t|do not|never|no need to|not|should i|would it be worth) (?:add|save|put)|(?:should|would) i (?:even )?add) /;

/** What his words say about adding a piece (KC4.1, KC4.5): an ask beats a mention. Null when it is neither. */
export function readAdd(question: string): AddRead | null {
  const q = norm(question);
  if (NOT_ADD.test(q)) return null;
  if (ADD_ASK.test(q)) return { mode: 'ask', ...pieceWordsOf(q) };
  const own = OWN_MENTION.exec(q);
  if (own) {
    const w = pieceWordsOf(own[1]!);
    return w.kind ? { mode: 'mention', ...w } : null;
  }
  return null;
}

/** The occasion a question names, in the app's 8 (a wedding is an event; work has no key of its own: everyday). */
const OCCASIONS: readonly [OccasionKey, RegExp][] = [
  ['interview', / (interview|career fair) /], ['date', / (date|dinner date) /], ['class', / (class|lecture|campus) /],
  ['going_out', / (party|going out|bar|club|concert|night out) /],
  ['event', / (event|wedding|funeral|graduation|church|gala) /], ['gym', / (gym|workout) /], ['home', / (at home|lounge|lounging|staying in) /],
  ['everyday', / (work|office|internship|errands|everyday) /],
];

/** Words that name a kind of piece, and the subcategory words they stand for. */
const KIND_WORDS: Readonly<Record<string, readonly string[]>> = {
  jeans: ['jeans'], chinos: ['chinos'], trousers: ['trousers', 'pants', 'slacks'], cargos: ['cargo', 'cargos'], shorts: ['shorts'],
  joggers: ['joggers', 'sweatpants', 'sweats'], tee: ['tee', 't shirt', 'tshirt'], hoodie: ['hoodie'], sweatshirt: ['sweatshirt', 'crewneck'],
  sweater: ['sweater', 'knit', 'jumper'], overshirt: ['overshirt', 'shacket'], shirt: ['shirt', 'button up', 'button down', 'oxford'],
  polo: ['polo'], jacket: ['jacket'], blazer: ['blazer', 'sport coat'], coat: ['coat', 'topcoat', 'overcoat'],
  sneakers: ['sneakers', 'trainers', 'kicks'], boots: ['boots'], loafers: ['loafers'], slides: ['slides', 'sandals'],
};

interface PieceRef {
  handle: string;
  item: ClosetItemRow;
}

/** How well a piece is named at `at`: 3 its whole name, 2 its color + kind, 1 its kind alone. */
function mentionScore(q: string, item: ClosetItemRow): { score: number; at: number } {
  const name = norm(item.name).trim();
  let i = name ? q.indexOf(` ${name} `) : -1;
  if (i < 0 && name.split(' ').length > 1) {
    // "my olive overshirt" for "Olive cotton overshirt": the first and the last word of its name.
    const w = name.split(' ');
    const pair = ` ${w[0]} ${w[w.length - 1]} `;
    i = q.indexOf(pair);
    if (i >= 0) return { score: 2, at: i };
  } else if (i >= 0) return { score: 3, at: i };
  const words = name.split(' ');
  const last = words[words.length - 1] ?? '';
  for (const [, alts] of Object.entries(KIND_WORDS)) {
    if (!alts.some((a) => a === last || a === `${last}s` || `${a}s` === last)) continue;
    for (const a of alts) {
      const j = q.indexOf(` ${a} `) >= 0 ? q.indexOf(` ${a} `) : q.indexOf(` ${a}s `);
      if (j >= 0) return { score: 1, at: j };
    }
  }
  const aliases = (item.profile?.aliases ?? []).map((a) => norm(a.replace(/_/g, ' ')).trim()).filter(Boolean);
  for (const a of aliases) {
    const j = q.indexOf(` ${a} `);
    if (j >= 0) return { score: 1, at: j };
  }
  return { score: 0, at: -1 };
}

/** Two pieces of the same kind (the last word of their names, plural or not: "overshirt", "chinos"). */
function sameKind(a: ClosetItemRow, b: ClosetItemRow): boolean {
  const last = (c: ClosetItemRow) => (norm(c.name).trim().split(' ').pop() ?? '').replace(/s$/, '');
  return last(a) !== '' && last(a) === last(b);
}

/** The pieces a question names: whole names and color + kind always; a kind word alone only when one piece fits it. */
export function namedPieces(question: string, refs: readonly PieceRef[]): string[] {
  const q = norm(question);
  const hits = refs.map((r) => ({ r, ...mentionScore(q, r.item) })).filter((h) => h.score > 0);
  const out: { handle: string; at: number }[] = [];
  for (const h of hits) {
    // A kind word alone ("the jeans", "my overshirt") names a piece only when it's his only one of that kind.
    if (h.score === 1 && refs.filter((r) => r !== h.r && sameKind(r.item, h.r.item)).length > 0) continue;
    // A weaker hit at the same words as a stronger one is the same mention.
    if (hits.some((x) => x !== h && x.at === h.at && x.score > h.score)) continue;
    out.push({ handle: h.r.handle, at: h.at });
  }
  return out.sort((a, b) => a.at - b.at || a.handle.localeCompare(b.handle, 'en', { numeric: true })).map((x) => x.handle);
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** The check a question names: a number ("my 7", "the 6.5"), a weekday, "today"/"this"/"last"; else the newest. */
export function namedCheck(question: string, checks: readonly { handle: string; row: FitCheckRow; dow: number; today: boolean }[]): string | null {
  if (checks.length === 0) return null;
  const q = norm(question);
  const newestFirst = [...checks].sort((a, b) => b.row.createdAt - a.row.createdAt);
  const num = / (?:my|the|a|an|that|this|only (?:got )?an?|get an?|got an?) (10|\d)(?:\.(\d))? /.exec(q);
  if (num) {
    const want = displayScore(Number(`${num[1]}.${num[2] ?? '0'}`));
    const hit = newestFirst.find((c) => c.row.score !== null && displayScore(c.row.score) === want);
    if (hit) return hit.handle;
  }
  const day = WEEKDAYS.findIndex((d) => q.includes(` ${d}`));
  if (day >= 0) {
    const hit = newestFirst.find((c) => c.dow === day && !c.today) ?? newestFirst.find((c) => c.dow === day);
    if (hit) return hit.handle;
  }
  if (/ yesterday/.test(q)) {
    const hit = newestFirst.find((c) => !c.today);
    if (hit) return hit.handle;
  }
  return newestFirst[0]!.handle;
}

export function occasionOf(question: string): OccasionKey | null {
  const q = norm(question);
  return OCCASIONS.find(([, re]) => re.test(q))?.[0] ?? null;
}

/** Kinds that need a check, and kinds that need a piece, to be sure. */
const NEEDS_CHECK: ReadonlySet<AskKind> = new Set(['explain', 'whatIf', 'feedback']);

export interface RouteInput {
  closet: readonly ClosetItemRow[];
  checks: readonly FitCheckRow[];
  /** The pack built for this question: its handles are the ones the model sees. */
  context: Pick<StylistContext, 'handles'>;
  /** Weekday (0 Sunday) and "is today" of a check, in his time zone. */
  dayOf: (c: FitCheckRow) => { dow: number; today: boolean };
}

export function routeQuestion(question: string, input: RouteInput): Route {
  const q = norm(question);
  const add = readAdd(question);
  // "Can you add that to my closet?" is not a buy question ("add to my closet" is in buyNext's words); with an add read,
  // the kind is the plain one, so Kit gets no buy evidence and the code's add card does the work.
  const kind = add?.mode === 'ask' ? 'remember' : (KINDS.find(([, re]) => re.test(q))?.[0] ?? 'general');
  const byId = new Map(input.closet.map((c) => [c.id, c]));
  const refs: PieceRef[] = [];
  const checks: { handle: string; row: FitCheckRow; dow: number; today: boolean }[] = [];
  const checkById = new Map(input.checks.map((c) => [c.id, c]));
  for (const [handle, id] of Object.entries(input.context.handles)) {
    if (/^P\d+$/.test(handle)) {
      const item = byId.get(id);
      if (item) refs.push({ handle, item });
    } else if (/^FC\d+$/.test(handle)) {
      const row = checkById.get(id);
      if (row) checks.push({ handle, row, ...input.dayOf(row) });
    }
  }
  const pieces = namedPieces(question, refs);
  const check = NEEDS_CHECK.has(kind) ? namedCheck(question, checks) : null;
  const occasion = occasionOf(question);
  const sure = kind !== 'general'
    && !(NEEDS_CHECK.has(kind) && !check)
    && !(kind === 'goesWith' && pieces.length === 0);
  return { kind, pieces, check, occasion, sure, add };
}
