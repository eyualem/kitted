// Where an answer comes from (07 §5, 02 S25): one interface, an async stream of events, so the pipeline, the thread
// and the counting don't care whether it's the real model (C2, later), the demo's seeded answers, or today's
// "coming soon" line.
//   delta  · more words of the answer (appended in order)
//   done   · the answer is complete; `card` / `remember` are the model's closing block (C3 / C4, unused yet),
//            `refused` = it declined (never counted), `uncounted` = a placeholder that isn't an answer (never counted)
//   failed · nothing usable came back; the pipeline shows fail.ask with Retry and counts nothing
import { t } from '@/i18n/en';
import type { Scheduler } from '@/services/scheduler';
import { normalizeQuestion } from './guards';

export type AnswerEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; card?: unknown; remember?: unknown; refused?: boolean; uncounted?: boolean }
  | { type: 'failed'; code: string };

export interface AnswerRequest {
  question: string;
  signal?: AbortSignal;
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
      const hit = matchSeeded(req.question, deps.answers);
      const text = hit ? hit.answer : t('ask.demoOnly');
      const timed = deps.timed();
      if (timed) await deps.scheduler.sleep(hit ? FIRST_MS : FIRST_MS / 2, req.signal);
      const chunks = chunksOf(text);
      for (const [i, c] of chunks.entries()) {
        if (timed && i > 0) await deps.scheduler.sleep(CHUNK_MS[i % CHUNK_MS.length]!, req.signal);
        yield { type: 'delta', text: c };
      }
      yield { type: 'done' };
    },
  };
}
