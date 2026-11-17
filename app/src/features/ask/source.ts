// Where an answer comes from (07 §5, 02 S25): one interface, an async stream of events, so the pipeline, the thread
// and the counting don't care whether it's the real model (C2, later), the demo's seeded answers, or today's
// "coming soon" line.
//   delta  · more words of the answer (appended in order)
//   done   · the answer is complete; `card` / `remember` / `need` are the model's closing block (07 §5.2; built and
//            checked by code: cards.ts, memory.ts, evidence.ts), `refused` = it declined (never counted),
//            `uncounted` = a placeholder that isn't an answer (never counted)
//   failed · nothing usable came back; the pipeline shows fail.ask with Retry and counts nothing
import { t } from '@/i18n/en';
import type { Scheduler } from '@/services/scheduler';
import { normalizeQuestion } from './guards';

export type AnswerEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; card?: unknown; remember?: unknown; need?: unknown; refused?: boolean; uncounted?: boolean; verdict?: 'yes' | 'no' | 'depends' | null; blockFound?: boolean; followUps?: unknown }
  | { type: 'failed'; code: string };

export interface AnswerRequest {
  question: string;
  signal?: AbortSignal;
  /** What the real model is sent (prompt.ts); the demo and "coming soon" ignore it. */
  prompt?: { system: string; user: string };
  /** The second call after a lookup (R3): the demo answers it from its follow-up line. */
  followUp?: boolean;
  /** His tap on the stylist's own question (never counted): the server's free taps (X-Kitted-Free: tap). */
  tap?: boolean;
}

export interface AnswerSource {
  /** For logs only ("demo", "comingSoon"). */
  readonly name: string;
  answer(req: AnswerRequest): AsyncGenerator<AnswerEvent, void, void>;
}

/** Real builds until C2 (#70): the honest line, at once. Not an answer, so it never counts. */
export const comingSoonSource: AnswerSource = {
  name: 'comingSoon',
  async *answer() {
    yield { type: 'delta', text: t('ask.comingSoon') };
    yield { type: 'done', uncounted: true };
  },
};

export interface SeededAnswer {
  question: string;
  answer: string;
  /** The closing block, naming pieces by their closet name; the demo source turns names into the pack's handles. */
  card?: Record<string, unknown>;
  remember?: { key: string; value: string };
}

/**
 * The demo's answers with an attachment (07 §1's examples on the full scenario's closet; demo screens 167–173, R9).
 * Pieces are named, not handled: "P3" changes per question, a name doesn't.
 */
export const DEMO_CARD_ANSWERS: readonly SeededAnswer[] = [
  {
    question: 'What goes with my olive overshirt?',
    answer: 'Wear it open over your white tee and dark jeans. Finish with the white sneakers: olive and denim always get along, and the white keeps it light.',
    card: { type: 'outfit', pieces: ['Olive overshirt', 'White tee', 'Dark jeans', 'White sneakers'], occasion: 'everyday' },
  },
  {
    question: 'What would this outfit score?',
    answer: "Send me a photo and I'll score it. I only score what I can see.",
    card: { type: 'check', occasion: 'everyday' },
  },
  {
    question: 'What should I wear to work?',
    answer: 'Depends on the office. One quick question first.',
    card: { type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Business casual', 'Jeans are fine'] },
  },
  {
    question: 'Business casual',
    answer: "Then the khaki chinos and the light-blue oxford, with the brown loafers. Add the navy overshirt if it's cold out.",
  },
  {
    question: 'What should I buy next?',
    // The demo profile picks smart casual and workwear, so its list has work boots (#364): the Closet's next best buy.
    answer: 'Get brown work boots next. They go with your jeans and your overshirt, and workwear is one of your looks.',
    card: { type: 'buy', kind: 'work boots', shade: 'brown' },
  },
  {
    question: 'Which shoes are my dressiest?',
    answer: "Your brown loafers. They'd dress up the chinos for a dinner or an interview.",
    card: { type: 'link', to: 'piece:Brown loafers' },
  },
  {
    // "That score is wrong" (09 §20.8 G19): the Not quite right? card comes from code, not from this answer.
    question: 'That score is wrong.',
    answer: "Fair to push back. If I read a piece wrong, fix it below and I'll score the check again from that.",
  },
  {
    question: "I'm a 32 waist.",
    answer: "Got it. I'll keep that in mind when you ask about pants.",
    remember: { key: 'waist_size', value: '32' },
  },
  {
    question: 'I also have a grey hoodie.',
    answer: "Got it. I'll use your grey hoodie in outfit ideas. Wear it in a fit check and I'll add its photo.",
    remember: { key: 'owns_unphotographed', value: 'grey hoodie' },
  },
];

/** "P3" for a piece the pack lists as "P3 · Olive overshirt · …" (the demo names pieces; the pack has the handles). */
export function handleIn(pack: string, name: string): string | null {
  const want = name.trim().toLowerCase();
  for (const line of pack.split('\n')) {
    const m = /^(P\d+) · ([^·]+?) · /.exec(line.trim());
    if (m && m[2]!.trim().toLowerCase() === want) return m[1]!;
  }
  return null;
}

/** A demo closing block with its names turned into this question's handles (null when a piece isn't in the pack). */
function demoBlock(a: SeededAnswer, pack: string): { card: unknown; remember: unknown } {
  let card: unknown = a.card ?? null;
  const c = a.card;
  if (c && Array.isArray(c.pieces)) {
    const hs = (c.pieces as string[]).map((n) => handleIn(pack, n));
    card = hs.every((h) => !!h) ? { ...c, pieces: hs } : null;
  } else if (c && typeof c.to === 'string' && c.to.startsWith('piece:')) {
    const h = handleIn(pack, c.to.slice(6));
    card = h ? { ...c, to: `piece:${h}` } : null;
  }
  return { card, remember: a.remember ?? null };
}

/** The seed's Q&A pairs (seed.json → scenarios.*.chatThread): a counted question and the stylist text after it. */
export function seededAnswers(seed: { scenarios: Record<string, unknown> }): SeededAnswer[] {
  const out: SeededAnswer[] = [];
  for (const sc of Object.values(seed.scenarios)) {
    const thread = (sc as { chatThread?: unknown }).chatThread;
    if (!Array.isArray(thread)) continue;
    thread.forEach((m: Record<string, unknown>, i) => {
      if (m.role !== 'user' || m.countsAsQuestion !== true || typeof m.text !== 'string') return;
      const next = thread.slice(i + 1).find((x: Record<string, unknown>) => x.role === 'stylist' && x.kind === 'text' && typeof x.text === 'string');
      if (next) out.push({ question: m.text, answer: String(next.text) });
    });
  }
  return out;
}

/** Edits between two strings (small inputs only: questions are a sentence). */
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length]!;
}

/** The seeded answer for a question typed the same way, give or take case, punctuation and a typo or two. */
export function matchSeeded(question: string, answers: readonly SeededAnswer[]): SeededAnswer | null {
  const q = normalizeQuestion(question);
  if (!q) return null;
  let best: { a: SeededAnswer; d: number } | null = null;
  for (const a of answers) {
    const s = normalizeQuestion(a.question);
    const d = editDistance(q, s);
    if (d <= Math.max(2, Math.floor(s.length * 0.08)) && (!best || d < best.d)) best = { a, d };
  }
  return best?.a ?? null;
}

/** "Yes. Olive and navy…" → small word chunks, the way a streamed answer arrives. */
export function chunksOf(text: string, wordsPer = 3): string[] {
  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  const out: string[] = [];
  let cur = '';
  let n = 0;
  for (const w of words) {
    cur += w;
    if (!/^\s+$/.test(w) && ++n >= wordsPer) {
      out.push(cur);
      cur = '';
      n = 0;
    }
  }
  if (cur) out.push(cur);
  return out;
}

export interface DemoSourceDeps {
  answers: readonly SeededAnswer[];
  scheduler: Pick<Scheduler, 'sleep'>;
  /** false = no waits (demo screens are prepared at latency 0, and tests). */
  timed: () => boolean;
}

/** Wait before the first words, then between chunks (a fixed pattern: same question, same rhythm). */
const FIRST_MS = 1100;
const CHUNK_MS = [70, 55, 90, 60, 80];

/** Demo builds (02 S25): the seeded answers for the seeded questions, streamed; anything else gets the honest
 *  ask.demoOnly line. Both count toward the 5 a day, so the quota states can be shown. */
export function createDemoSource(deps: DemoSourceDeps): AnswerSource {
  return {
    name: 'demo',
    async *answer(req) {
      const hit = matchSeeded(req.question, [...deps.answers, ...DEMO_CARD_ANSWERS]);
      const text = hit ? hit.answer : t('ask.demoOnly');
      const block = hit && req.prompt ? demoBlock(hit, req.prompt.user) : { card: null, remember: null };
      const timed = deps.timed();
      if (timed) await deps.scheduler.sleep(hit ? FIRST_MS : FIRST_MS / 2, req.signal);
      const chunks = chunksOf(text);
      for (const [i, c] of chunks.entries()) {
        if (timed && i > 0) await deps.scheduler.sleep(CHUNK_MS[i % CHUNK_MS.length]!, req.signal);
        yield { type: 'delta', text: c };
      }
      yield { type: 'done', ...(block.card ? { card: block.card } : {}), ...(block.remember ? { remember: block.remember } : {}) };
    },
  };
}
