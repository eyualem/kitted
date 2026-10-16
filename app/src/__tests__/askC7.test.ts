// The chat's polish, C7 (07 §14 P1–P4): what each card says to VoiceOver, the answer read once with its card, the
// paused state, and Past chats read-only.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { cardControls, cardSpoken, savedUndoShows, type AskCard } from '@/features/ask/cards';
import { liveAnswer } from '@/features/ask/live';
import { createAsk } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import { createDemoSource, seededAnswers, type AnswerSource } from '@/features/ask/source';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';

const NOW = Date.parse('2026-10-22T12:30:00-04:00');
const names: Record<string, string> = { a: 'Olive overshirt', b: 'White tee', c: 'Dark jeans', d: 'White sneakers' };
const words = { nameOf: (id: string) => names[id] ?? null };

beforeEach(() => liveAnswer.clear());

describe('P1 · VoiceOver reads each card as one thing', () => {
  it('outfit, buy, ask, link, check', () => {
    expect(cardSpoken({ type: 'outfit', itemIds: ['a', 'b', 'c', 'd'], occasion: 'everyday' }, words))
      .toBe('An outfit from your closet: olive overshirt, white tee, dark jeans, white sneakers.');
    expect(cardSpoken({ type: 'buy', starterId: 's02', gain: 12 }, words)).toBe('Next buy. Navy polo. +12 outfits with what you own. $30–40.');
    expect(cardSpoken({ type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Business casual', 'Not sure'] }, words))
      .toBe('Is it a suit-and-tie office? Yes, Business casual, Not sure.');
    expect(cardSpoken({ type: 'link', itemId: 'a' }, words)).toBe('Your olive overshirt');
    expect(cardSpoken({ type: 'link', itemId: 'zz' }, words)).toBe(t('ask.card.gone'));
    expect(cardSpoken({ type: 'check', occasion: 'date' }, words)).toBe('Start a fit check');
  });
  it('the ask card\'s pick is marked, the rest go quiet', () => {
    const card: AskCard = { type: 'ask', question: 'Q?', options: ['Yes', 'No', 'Not sure'] };
    expect(cardControls(card, { readOnly: false, tapped: null }).answers.every((a) => a.tappable && !a.picked)).toBe(true);
    const after = cardControls(card, { readOnly: false, tapped: 'No' }).answers;
    expect(after.map((a) => [a.option, a.picked, a.tappable])).toEqual([['Yes', false, false], ['No', true, false], ['Not sure', false, false]]);
  });
});

async function askWith(source: AnswerSource) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:04:00-04:00') });
  const quota = createQuota({ store, clock, isPro: () => true });
  const ids = counterIds();
  const spoken: string[] = [];
  const ask = createAsk({
    store, quota, clock, ids, source: () => source, prepare: createPrepare({ store, clock, ids }), consent: async () => true, openConsent: () => {},
    tryPro: () => false, onAnswered: (s) => spoken.push(s),
  });
  return { store, quota, ask, spoken };
}

describe('P2 · the answer is read once, complete, with its card', () => {
  it('an outfit answer and a saved fact', async () => {
    const answers = seededAnswers(seed as unknown as { scenarios: Record<string, unknown> });
    const { ask, spoken } = await askWith(createDemoSource({ answers, scheduler: { sleep: async () => {} }, timed: () => false }));
    for (const q of ['What goes with my olive overshirt?', "I'm a 32 waist."]) {
      const o = await ask.ask(q);
      if (o.kind !== 'sent') throw new Error(o.kind);
      await o.done;
    }
    expect(spoken).toHaveLength(2);
    expect(spoken[0]).toMatch(/^Your white tee and dark jeans.*light\. An outfit from your closet: olive overshirt, white tee, dark jeans, white sneakers\.$/);
    expect(spoken[1]).toBe("Got it. I'll keep that in mind when you ask about pants. Saved to what I know.");
  });
});

describe('P3 · paused', () => {
  it('the paused line, no Retry, nothing counted', async () => {
    const src: AnswerSource = { name: 'server', answer: async function* () { yield { type: 'failed', code: 'paused' }; } };
    const { ask, store, quota } = await askWith(src);
    const o = await ask.ask('What goes with my chinos?');
    if (o.kind !== 'sent') throw new Error(o.kind);
    expect(await o.done).toMatchObject({ kind: 'failed', code: 'paused' });
    const line = (await store.chat.all()).sort((a, b) => b.createdAt - a.createdAt)[0]!;
    expect(line.text).toBe('Questions are paused for a bit. Nothing was counted. Try again later.');
    expect(line.payload.askRetry).toBeUndefined();
    expect(line.payload.askPaused).toBe(true);
    expect((await quota.snapshot()).questionsUsed).toBe(0);
  });
});

describe('P4 · Past chats are read-only', () => {
  it('no Wear this, Check it, Undo or tap; the pick still shows', () => {
    const outfit: AskCard = { type: 'outfit', itemIds: ['a', 'b', 'c'], occasion: 'everyday' };
    expect(cardControls(outfit, { readOnly: true, tapped: null })).toMatchObject({ wear: false, checkIt: false });
    expect(cardControls({ type: 'check', occasion: 'date' }, { readOnly: true, tapped: null }).checkIt).toBe(false);
    const ask = cardControls({ type: 'ask', question: 'Q?', options: ['Yes', 'No', 'Not sure'] }, { readOnly: true, tapped: 'Yes' }).answers;
    expect(ask.some((a) => a.tappable)).toBe(false);
    expect(ask.find((a) => a.picked)?.option).toBe('Yes');
    expect(savedUndoShows(true)).toBe(false);
    // Today's chat keeps them.
    expect(cardControls(outfit, { readOnly: false, tapped: null })).toMatchObject({ wear: true, checkIt: true });
    expect(cardControls(outfit, { readOnly: false, tapped: null, gone: true })).toMatchObject({ wear: false, checkIt: false });
  });
});
