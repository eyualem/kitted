// "Ask your stylist" plumbing (07 C0): the preflight order, what counts, streaming into the live row with one write,
// Retry, the demo's seeded answers, the questions-left subtitle, and the composer's draft.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { onChange } from '@/data/changes';
import { loadScenario } from '@/data/seedLoader';
import type { ChatMessage } from '@/data/types';
import { liveAnswer } from '@/features/ask/live';
import { createAsk, keepsDraft, type AskDeps } from '@/features/ask/pipeline';
import { chunksOf, comingSoonSource, createDemoSource, matchSeeded, seededAnswers, type AnswerEvent, type AnswerSource } from '@/features/ask/source';
import { composerState } from '@/features/stylist/composerState';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota, LIMITS, stylistSubtitle } from '@/services/quota';

const at = (iso: string) => Date.parse(iso);
const NOW = at('2026-10-22T12:30:00-04:00');
const SEEDED = seededAnswers(seed as unknown as { scenarios: Record<string, unknown> });
const OLIVE = 'Can I wear the olive overshirt with the navy chinos?';

/** A source that plays back a fixed script. */
function scripted(events: AnswerEvent[], name = 'script'): AnswerSource {
  return {
    name,
    async *answer() {
      for (const e of events) yield e;
    },
  };
}

async function setup(opts: Partial<Omit<AskDeps, 'consent'>> & { pro?: boolean; consent?: boolean; used?: number } = {}) {
  const { pro, consent, used: usedBefore, ...over } = opts;
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  const quota = createQuota({ store, clock, isPro: () => pro ?? false });
  for (let i = 0; i < (usedBefore ?? 0); i++) await quota.consumeQuestion();
  const events: string[] = [];
  const opened = { consent: 0 };
  const ask = createAsk({
    store,
    quota,
    clock,
    ids: counterIds(),
    source: () => createDemoSource({ answers: SEEDED, scheduler: { sleep: async () => {} }, timed: () => false }),
    consent: async () => consent ?? true,
    openConsent: () => {
      opened.consent++;
    },
    tryPro: () => false,
    log: (e) => events.push(e),
    ...over,
  });
  const chat = async () => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const used = async () => (await quota.snapshot()).questionsUsed;
  return { store, clock, quota, ask, events, opened, chat, used };
}

const texts = (ms: ChatMessage[]) => ms.map((m) => [m.role, m.cardType ?? m.kind, m.text]);

beforeEach(() => liveAnswer.clear());

describe('preflight, in order', () => {
  it('an empty question does nothing', async () => {
    const s = await setup();
    expect((await s.ask.ask('   ')).kind).toBe('empty');
    expect(await s.chat()).toEqual([]);
  });

  it('distress comes first: the support card even with no consent and no questions left; nothing sent or counted', async () => {
    let asked = 0;
    const s = await setup({ consent: false, used: LIMITS.freeQuestions, source: () => ({ name: 'x', async *answer() { asked++; yield { type: 'done' }; } }) });
    const o = await s.ask.ask("I don't want to be alive anymore");
    expect(o.kind).toBe('support');
    expect(asked).toBe(0);
    expect(s.opened.consent).toBe(0);
    const ms = await s.chat();
    expect(texts(ms)).toEqual([['user', 'text', "I don't want to be alive anymore"], ['stylist', 'support', t('support.text')]]);
    expect(await s.used()).toBe(LIMITS.freeQuestions);
    // Only the event name is logged, never his words.
    expect(s.events).toEqual(['support']);
  });

  it('a message that only rates him gets the refusal line, before the gates, not counted', async () => {
    const s = await setup({ consent: false });
    expect((await s.ask.ask('Am I ugly?')).kind).toBe('refused');
    expect(texts(await s.chat()).at(-1)).toEqual(['stylist', 'text', t('ask.refuseFace')]);
    expect(s.opened.consent).toBe(0);
    expect(await s.used()).toBe(0);
  });

  it('no consent: the agreement opens, nothing is written, the draft stays', async () => {
    const s = await setup({ consent: false });
    const o = await s.ask.ask(OLIVE);
    expect(o.kind).toBe('consent');
    expect(keepsDraft(o)).toBe(true);
    expect(s.opened.consent).toBe(1);
    expect(await s.chat()).toEqual([]);
  });

  it('offline: nothing is written, the draft stays (checked after consent)', async () => {
    const s = await setup({ online: () => false });
    const o = await s.ask.ask(OLIVE);
    expect([o.kind, keepsDraft(o)]).toEqual(['offline', true]);
    expect(await s.chat()).toEqual([]);
    const s2 = await setup({ online: () => false, consent: false });
    expect((await s2.ask.ask(OLIVE)).kind).toBe('consent');
  });

  it('at the free limit: his bubble and the S25 line, no Try Pro until the paywall exists; nothing counted', async () => {
    const s = await setup({ used: LIMITS.freeQuestions });
    const o = await s.ask.ask(OLIVE);
    expect(o.kind).toBe('limit');
    const ms = await s.chat();
    expect(texts(ms)).toEqual([['user', 'text', OLIVE], ['stylist', 'limit', t('ask.limit.free')]]);
    expect(ms[1]!.payload.tryPro).toBe(false);
    expect(await s.used()).toBe(LIMITS.freeQuestions);
  });

  it('Try Pro shows on the free limit line once the paywall exists; Pro gets the Pro line, never Try Pro', async () => {
    const free = await setup({ used: LIMITS.freeQuestions, tryPro: () => true });
    await free.ask.ask(OLIVE);
    expect((await free.chat())[1]!.payload.tryPro).toBe(true);
    const pro = await setup({ pro: true, used: LIMITS.proQuestions, tryPro: () => true });
    await pro.ask.ask(OLIVE);
    const line = (await pro.chat())[1]!;
    expect([line.text, line.payload.tryPro]).toEqual([t('ask.limit.pro'), false]);
  });

  it('one question at a time: a second send while one streams is held, draft kept', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const s = await setup({
      source: () => ({ name: 'slow', async *answer() { await gate; yield { type: 'delta', text: 'Yes.' }; yield { type: 'done' }; } }),
    });
    const first = await s.ask.ask(OLIVE);
    expect(liveAnswer.inFlight()).toBe(true);
    const second = await s.ask.ask('What belt goes with brown loafers?');
    expect([second.kind, keepsDraft(second)]).toEqual(['busy', true]);
    release();
    if (first.kind === 'sent') await first.done;
    expect(liveAnswer.inFlight()).toBe(false);
    expect((await s.ask.ask('What belt goes with brown loafers?')).kind).toBe('sent');
  });
});

describe('what counts (07 §6.2)', () => {
  it('a demo answer counts, and its question is flagged payload.counts', async () => {
    const s = await setup();
    const o = await s.ask.ask(OLIVE);
    expect(o.kind).toBe('sent');
    const r = o.kind === 'sent' ? await o.done : null;
    expect(r).toMatchObject({ kind: 'answered', counted: true });
    const ms = await s.chat();
    expect(texts(ms)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', SEEDED.find((a) => a.question === OLIVE)!.answer]]);
    expect(ms[0]!.payload.counts).toBe(true);
    expect(ms[1]!.payload.answerTo).toBe(ms[0]!.id);
    expect(await s.used()).toBe(1);
  });

  it("the demo's honest line for a new question counts too (02 S25: the quota states can be shown)", async () => {
    const s = await setup();
    const o = await s.ask.ask('Do white socks work with loafers?');
    if (o.kind === 'sent') await o.done;
    expect((await s.chat()).at(-1)!.text).toBe(t('ask.demoOnly'));
    expect(await s.used()).toBe(1);
  });

  it('"coming soon" (real builds until C2) is not counted', async () => {
    const s = await setup({ source: () => comingSoonSource });
    const o = await s.ask.ask(OLIVE);
    const r = o.kind === 'sent' ? await o.done : null;
    expect(r).toMatchObject({ kind: 'answered', counted: false });
    expect((await s.chat()).at(-1)!.text).toBe(t('ask.comingSoon'));
    expect((await s.chat())[0]!.payload.counts).toBeUndefined();
    expect(await s.used()).toBe(0);
  });

  it("the model's refusal is not counted", async () => {
    const s = await setup({ source: () => scripted([{ type: 'delta', text: 'I rate outfits, never people.' }, { type: 'done', refused: true }]) });
    const o = await s.ask.ask('Do I look fat in this?');
    if (o.kind === 'sent') await o.done;
    expect((await s.chat()).at(-1)!.payload.askRefused).toBe(true);
    expect(await s.used()).toBe(0);
  });

  it.each([
    ['a failed event', [{ type: 'delta', text: 'Half an' }, { type: 'failed', code: 'http' }]],
    ['no done', [{ type: 'delta', text: 'Half an' }]],
    ['an empty answer', [{ type: 'delta', text: '  ' }, { type: 'done' }]],
  ] as [string, AnswerEvent[]][])('%s writes fail.ask with Retry and counts nothing', async (_name, evs) => {
    const s = await setup({ source: () => scripted(evs) });
    const o = await s.ask.ask(OLIVE);
    const r = o.kind === 'sent' ? await o.done : null;
    expect(r?.kind).toBe('failed');
    const last = (await s.chat()).at(-1)!;
    expect([last.text, last.payload.askRetry]).toEqual([t('fail.ask'), (await s.chat())[0]!.id]);
    expect(await s.used()).toBe(0);
    expect(liveAnswer.get()).toBeNull();
  });

  it('a source that throws is a failure, not a crash', async () => {
    const s = await setup({ source: () => ({ name: 'boom', async *answer() { throw new Error('x'); } }) });
    const o = await s.ask.ask(OLIVE);
    expect(o.kind === 'sent' ? (await o.done).kind : null).toBe('failed');
  });
});

describe('streaming: the live row, then one write', () => {
  it('the chat table is written once for the answer, however many chunks', async () => {
    const s = await setup();
    const o = await s.ask.ask(OLIVE);
    // His bubble is in; the answer isn't written while it streams.
    let writes = 0;
    const off = onChange(['chat'], () => writes++);
    if (o.kind === 'sent') await o.done;
    off();
    // The answer row, and the counted flag on his bubble.
    expect(writes).toBeLessThanOrEqual(2);
    expect(chunksOf(SEEDED.find((a) => a.question === OLIVE)!.answer).length).toBeGreaterThan(3);
  });

  it('the live row goes waiting → streaming → done with the written id', async () => {
    const seen: string[] = [];
    const off = liveAnswer.subscribe(() => seen.push(liveAnswer.get()?.phase ?? 'none'));
    const s = await setup();
    const o = await s.ask.ask(OLIVE);
    if (o.kind === 'sent') await o.done;
    off();
    expect(seen[0]).toBe('waiting');
    expect(seen).toContain('streaming');
    expect(seen.at(-1)).toBe('done');
    const live = liveAnswer.get();
    const last = (await s.chat()).at(-1)!;
    expect(live?.phase === 'done' && live.messageId).toBe(last.id);
    expect(live?.phase === 'done' && live.text).toBe(last.text);
  });

  it('Retry asks the same question into the failed line\'s place and counts once it answers', async () => {
    let n = 0;
    const s = await setup({
      source: () => (n++ === 0 ? scripted([{ type: 'failed', code: 'http' }]) : scripted([{ type: 'delta', text: 'Yes, wear it open.' }, { type: 'done' }])),
    });
    const o = await s.ask.ask(OLIVE);
    const failed = o.kind === 'sent' ? await o.done : null;
    const before = await s.chat();
    const r = await s.ask.retry(failed!.messageId);
    if (r?.kind === 'sent') await r.done;
    const after = await s.chat();
    expect(texts(after)).toEqual([['user', 'text', OLIVE], ['stylist', 'text', 'Yes, wear it open.']]);
    expect(after[1]!.createdAt).toBe(before[1]!.createdAt);
    expect(await s.used()).toBe(1);
    expect(await s.ask.retry('nope')).toBeNull();
  });
});

describe('the demo source', () => {
  it('reads the seeded Q&A (M15–M18)', () => {
    expect(SEEDED.map((a) => a.question)).toEqual([OLIVE, 'What belt goes with brown loafers?']);
  });
  it('matches the same question typed a little differently, not a different one', () => {
    expect(matchSeeded('can i wear the olive overshirt with the navy chinos', SEEDED)?.question).toBe(OLIVE);
    expect(matchSeeded('Can I wear the olive overshirt w/ the navy chinos?', SEEDED)?.question).toBe(OLIVE);
    expect(matchSeeded('what belt goes with brown lofers?', SEEDED)?.question).toBe('What belt goes with brown loafers?');
    expect(matchSeeded('Can I wear the olive overshirt with black jeans?', SEEDED)).toBeNull();
    expect(matchSeeded('', SEEDED)).toBeNull();
  });
  it('streams in small chunks that add up to the answer, with waits when timed', async () => {
    const waits: number[] = [];
    const src = createDemoSource({ answers: SEEDED, scheduler: { sleep: async (ms) => void waits.push(ms) }, timed: () => true });
    let text = '';
    for await (const e of src.answer({ question: OLIVE })) if (e.type === 'delta') text += e.text;
    expect(text).toBe(SEEDED[0]!.answer);
    expect(waits[0]).toBeGreaterThanOrEqual(1000);
    expect(waits.length).toBe(chunksOf(SEEDED[0]!.answer).length);
  });
});

describe('the seed loads the counter as payload.counts', () => {
  it('two counted questions in the full scenario, usage 2', async () => {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN });
    const chat = await store.chat.all();
    expect(chat.filter((m) => m.payload.counts === true).map((m) => m.id).sort()).toEqual(['M15', 'M17']);
    expect((await store.usage.get('2026-10-22'))!.questions).toBe(2);
  });
});

describe('questions left in the subtitle (02 S25)', () => {
  it('shows at 3 or fewer left, otherwise the check line; a held photo first', async () => {
    const s = await setup();
    expect(stylistSubtitle(await s.quota.snapshot())).toEqual({ key: 'stylist.quota.free' });
    await s.quota.consumeQuestion();
    expect(stylistSubtitle(await s.quota.snapshot())).toEqual({ key: 'stylist.quota.free' });
    await s.quota.consumeQuestion();
    expect(stylistSubtitle(await s.quota.snapshot())).toEqual({ key: 'stylist.quota.questions', n: 3 });
    expect(t('stylist.quota.questions', { n: 3 })).toBe('3 questions left today');
    expect(t('stylist.quota.questions', { n: 1 })).toBe('1 question left today');
    for (let i = 0; i < 3; i++) await s.quota.consumeQuestion();
    expect(stylistSubtitle(await s.quota.snapshot())).toEqual({ key: 'stylist.quota.questions', n: 0 });
    expect(await s.quota.canAskQuestion()).toBe(false);
  });
  it('Pro sees nothing until 3 of 50 are left', async () => {
    const s = await setup({ pro: true, used: 46 });
    expect(stylistSubtitle(await s.quota.snapshot())).toBeNull();
    await s.quota.consumeQuestion();
    expect(stylistSubtitle(await s.quota.snapshot())).toEqual({ key: 'stylist.quota.questions', n: 3 });
  });
});

describe('the composer draft (07 §6.1)', () => {
  beforeEach(() => composerState.setDraft(''));
  it('survives the composer closing', () => {
    composerState.open('type');
    composerState.setDraft('What goes with my olive');
    composerState.close();
    expect(composerState.draft()).toBe('What goes with my olive');
  });
  it('is cleared after a send only if it is still the words that were sent', () => {
    composerState.setDraft('Can I wear boots?');
    composerState.clearDraftIf('Can I wear boots?');
    expect(composerState.draft()).toBe('');
    composerState.setDraft('Can I wear boots? And with chinos');
    composerState.clearDraftIf('Can I wear boots?');
    expect(composerState.draft()).toBe('Can I wear boots? And with chinos');
  });
});
