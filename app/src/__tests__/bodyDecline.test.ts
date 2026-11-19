// T115 · KC11.2 "nothing about his body": a reply the body rules empty shows "I rate outfits, never people." (stored
// like the phone's own refusal: no Retry, not counted, no follow-up taps), never "I couldn't answer that" with Retry.
// A reply emptied by other rules only keeps today's fail line. Written before the code (tasks/T115/TESTING.md).
// The model is a script (as in askPipeline.test.ts); nothing is sent anywhere.
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage } from '@/data/types';
import { liveAnswer } from '@/features/ask/live';
import { createAsk, latestFollowUps, type AskDeps } from '@/features/ask/pipeline';
import type { AnswerEvent, AnswerSource } from '@/features/ask/source';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';

const NOW = Date.parse('2026-10-22T12:30:00-04:00');
const OLIVE = 'Can I wear the olive overshirt with the navy chinos?';
const TAPS = ['Show me tall boots', 'Add a watch'];

/** A source that plays back a fixed script. */
function scripted(events: AnswerEvent[]): AnswerSource {
  return {
    name: 'script',
    async *answer() {
      for (const e of events) yield e;
    },
  };
}

/** The model answers `text` in one piece, with two clean follow-up taps. */
const answers = (text: string): AnswerEvent[] => [{ type: 'delta', text }, { type: 'done', followUps: TAPS }];

async function setup(source: AskDeps['source']) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  const quota = createQuota({ store, clock, isPro: () => false });
  const ask = createAsk({
    store,
    quota,
    clock,
    ids: counterIds(),
    source,
    consent: async () => true,
    openConsent: () => {},
    tryPro: () => false,
  });
  const chat = async () => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const used = async () => (await quota.snapshot()).questionsUsed;
  return { ask, chat, used };
}

const texts = (ms: ChatMessage[]) => ms.map((m) => [m.role, m.kind, m.text]);

beforeEach(() => liveAnswer.clear());

/** Every sentence dropped, at least one by the body, build or height rule. */
const BODY_EMPTIED: [string, string][] = [
  ['two body sentences', 'You look old. It hides the gut.'],
  ['a build sentence and a body sentence', "Since you're tall, go long. You look thin."],
  ['a build sentence alone', "Since you're tall, go long."],
  ['a height sentence alone', "At 6'1, go long."],
];

describe('KC11.2-D1 · a reply the body rules empty shows the decline, uncounted', () => {
  it.each(BODY_EMPTIED)('KC11.2-D1 · %s: the decline, askRefused, no Retry, not counted, no taps', async (_name, answer) => {
    const s = await setup(() => scripted(answers(answer)));
    const o = await s.ask.ask(OLIVE);
    expect(o.kind).toBe('sent');
    const r = o.kind === 'sent' ? await o.done : null;
    const ms = await s.chat();
    // One stylist row, the decline; never the fail line.
    expect(texts(ms)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', t('ask.refuseFace')]]);
    expect(t('ask.refuseFace')).toBe('I rate outfits, never people.');
    const line = ms[1]!;
    expect(line.payload.askRefused).toBe(true);
    expect(line.payload.askRetry).toBeUndefined();
    expect(line.payload.followUps).toBeUndefined();
    expect(latestFollowUps(ms)).toBeNull();
    expect(r?.messageId).toBe(line.id);
    if (r?.kind === 'answered') expect(r.counted).toBe(false);
    // Not counted: the day's count unchanged and his bubble not flagged.
    expect(await s.used()).toBe(0);
    expect(ms[0]!.payload.counts).toBeUndefined();
    // No Retry on the decline.
    expect(await s.ask.retry(line.id)).toBeNull();
  });

  it('KC11.2-D1 · on a Retry the decline takes the failed line\'s place: one stylist row, not two, not counted', async () => {
    let n = 0;
    const s = await setup(() => (n++ === 0 ? scripted([{ type: 'failed', code: 'http' }]) : scripted(answers("Since you're tall, go long. You look thin."))));
    const o = await s.ask.ask(OLIVE);
    const failed = o.kind === 'sent' ? await o.done : null;
    expect(failed?.kind).toBe('failed');
    const before = await s.chat();
    expect(texts(before)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', t('fail.ask')]]);
    const r = await s.ask.retry(failed!.messageId);
    expect(r?.kind).toBe('sent');
    const done = r?.kind === 'sent' ? await r.done : null;
    const after = await s.chat();
    expect(texts(after)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', t('ask.refuseFace')]]);
    const line = after[1]!;
    expect(line.createdAt).toBe(before[1]!.createdAt);
    expect(line.payload.askRefused).toBe(true);
    expect(line.payload.askRetry).toBeUndefined();
    expect(line.payload.followUps).toBeUndefined();
    expect(done?.messageId).toBe(line.id);
    if (done?.kind === 'answered') expect(done.counted).toBe(false);
    expect(await s.used()).toBe(0);
    expect(after[0]!.payload.counts).toBeUndefined();
    expect(await s.ask.retry(line.id)).toBeNull();
  });
});

describe("KC11.2-D2 · other emptied replies keep today's fail line", () => {
  it.each([
    ['a brand sentence alone', 'Get the Nike ones.'],
    ['a banned word alone', 'That fit has real drip.'],
    ['a score the evidence does not hold', 'It is a 9 out of 10.'],
  ])('KC11.2-D2 · %s: fail.ask with Retry to the question, not counted, no decline', async (_name, answer) => {
    const s = await setup(() => scripted(answers(answer)));
    const o = await s.ask.ask(OLIVE);
    const r = o.kind === 'sent' ? await o.done : null;
    expect(r?.kind).toBe('failed');
    const ms = await s.chat();
    expect(texts(ms)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', t('fail.ask')]]);
    expect(ms[1]!.payload.askRetry).toBe(ms[0]!.id);
    expect(ms[1]!.payload.askRefused).toBeUndefined();
    expect(await s.used()).toBe(0);
    expect(ms[0]!.payload.counts).toBeUndefined();
  });

  it('KC11.2-D2 · a brand sentence and a body sentence, both dropped: the decline, as in D1', async () => {
    const s = await setup(() => scripted(answers('Get the Nike ones. You look thin.')));
    const o = await s.ask.ask(OLIVE);
    const r = o.kind === 'sent' ? await o.done : null;
    const ms = await s.chat();
    expect(texts(ms)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', t('ask.refuseFace')]]);
    expect(ms[1]!.payload.askRefused).toBe(true);
    expect(ms[1]!.payload.askRetry).toBeUndefined();
    expect(ms[1]!.payload.followUps).toBeUndefined();
    if (r?.kind === 'answered') expect(r.counted).toBe(false);
    expect(await s.used()).toBe(0);
  });

  it('KC11.2-D2 · one body sentence dropped, one clean sentence kept: the clean sentence shows, counted as today', async () => {
    const s = await setup(() => scripted(answers('You look thin. Navy chinos work with it.')));
    const o = await s.ask.ask(OLIVE);
    const r = o.kind === 'sent' ? await o.done : null;
    expect(r).toEqual({ kind: 'answered', messageId: expect.any(String), counted: true });
    const ms = await s.chat();
    expect(texts(ms)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', 'Navy chinos work with it.']]);
    expect(ms[1]!.payload.answerTo).toBe(ms[0]!.id);
    expect(ms[1]!.payload.askRefused).toBeUndefined();
    expect(ms[1]!.payload.askRetry).toBeUndefined();
    expect(await s.used()).toBe(1);
    expect(ms[0]!.payload.counts).toBe(true);
  });
});
