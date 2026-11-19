// The stylist's router, evidence and cards, C3 (07 §13 R1–R8), on the full scenario's closet (16 pieces) and checks.
// Nothing here calls Google: scripted sources stand in for the model.
import { dayKey, localParts, US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { FitCheckRow } from '@/data/types';
import { displayScore } from '@/design-system/score';
import { buildCard, outfitNow, storedCard, type AskCard } from '@/features/ask/cards';
import { starterChips } from '@/features/ask/chips';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence, parseLookup } from '@/features/ask/evidence';
import { liveAnswer } from '@/features/ask/live';
import { createAsk } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { createDemoSource, DEMO_CARD_ANSWERS, seededAnswers, type AnswerEvent, type AnswerSource } from '@/features/ask/source';
import { STARTER } from '@/features/finish/starter';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';

const NOW = Date.parse('2026-10-22T12:30:00-04:00');

async function setup() {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:04:00-04:00') });
  return { store, clock };
}

async function routeOf(store: KittedStore, clock: ReturnType<typeof manualClock>, q: string) {
  const snap = await loadStylistSnapshot(store, clock);
  const ctx = buildStylistContext(snap, q);
  const today = dayKey(snap.nowMs, snap.zone);
  const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: (c: FitCheckRow) => ({ dow: localParts(c.createdAt, snap.zone).dow, today: c.dayKey === today }) });
  const name = (h: string) => snap.closet.find((c) => c.id === ctx.handles[h])?.name;
  return { snap, ctx, route, name };
}

beforeEach(() => liveAnswer.clear());

describe('R1 · the router', () => {
  const CASES: Record<string, string[]> = {
    explain: ['Why did I only get a 7?', 'Why is my score so low?', 'How come today\'s check was an 8?', 'Explain my 9', 'What brought my outfit down?', 'Why a 6.5?', 'Why a 6.5', 'Why an 8?'],
    whatIf: ['What if I swap the jeans for the chinos?', 'If I wore the loafers would it be higher?', 'What if I tuck the tee in?', 'If I added the denim jacket would it be better?', 'What if I wore the Chelsea boots instead of the sneakers?'],
    goesWith: ['What goes with my olive overshirt?', 'What can I wear with khaki chinos?', 'What matches the navy crewneck?', 'What should I pair with my brown loafers?', 'How do I style my denim jacket?'],
    whatToWear: ['What should I wear today?', 'What should I wear to a date tonight?', 'Outfit for the career fair?', "What's tomorrow's outfit?", 'What do I wear to a wedding?'],
    canIWear: ['Can I wear white sneakers to an interview?', 'Is it ok to wear the overshirt open?', 'Can I wear the work boots to a date?', 'Does the navy crewneck work with the dark jeans?', 'Are the grey runners too casual for class?'],
    buyNext: ['What should I buy next?', 'What am I missing?', 'What should I get for fall?', 'Is a navy polo worth buying?', 'What should I buy first?'],
    fitHowTo: ['How should chinos fit?', 'How long should my jeans be?', 'How do I cuff my jeans?', 'Should I size up in hoodies?', 'How tight should a tee be?'],
    shape: ['Are my jeans too long?', 'Do my jeans bunch up at the shoe?', 'Is the overshirt too baggy?', 'Should it be tucked or cropped?', 'Does the silhouette look off?'],
    remember: ["I'm a 32 waist.", 'My budget is around $60.', 'I hate skinny jeans.', 'I have black Chelsea boots.', 'I work in an office.'],
    feedback: ['That score is wrong.', 'It should be higher.', 'That was unfair.', 'I deserved more than that.', "That's not right, it was clean.", 'Im not wearing slides in that picture', 'You mixed up the checks', "That's not my outfit", "I didn't wear boots"],
  };
  for (const [kind, qs] of Object.entries(CASES)) {
    it(`${kind}: ${qs.length} questions`, async () => {
      const { store, clock } = await setup();
      for (const q of qs) expect([q, (await routeOf(store, clock, q)).route.kind]).toEqual([q, kind]);
    });
  }

  it('names his pieces by their names, by color + kind, and by kind when only one piece fits', async () => {
    const { store, clock } = await setup();
    const r1 = await routeOf(store, clock, 'What goes with my olive overshirt?');
    expect(r1.route.pieces.map(r1.name)).toEqual(['Olive overshirt']);
    const r2 = await routeOf(store, clock, 'Can I wear the Chelsea boots with the khaki chinos?');
    expect(r2.route.pieces.map(r2.name)).toEqual(['Black Chelsea boots', 'Khaki chinos']);
    const r3 = await routeOf(store, clock, 'What goes with my chinos?'); // two pairs: ambiguous, no guess
    expect(r3.route.pieces).toEqual([]);
    expect(r3.route.sure).toBe(false);
  });

  // Oct 18, the founder's phone: the app's own chip "Why a 6.5?" fell through to "general", so no check was pinned and
  // the model explained an older 6.5 (with slides) instead of the one he'd just sent (#341).
  it('the "Why a {score}?" chip routes to explain and names the newest check with that score', async () => {
    const { store, clock } = await setup();
    const snap = await loadStylistSnapshot(store, clock);
    const scored = snap.checks.filter((c) => c.status === 'scored' && c.score !== null).sort((a, b) => b.createdAt - a.createdAt);
    const target = scored[0]!;
    const q = t('ask.chip.why', { score: displayScore(target.score!) });
    const { route, ctx } = await routeOf(store, clock, q);
    expect(route.kind).toBe('explain');
    expect(route.sure).toBe(true);
    const named = snap.checks.find((c) => c.id === ctx.handles[route.check!])!;
    expect(displayScore(named.score!)).toBe(displayScore(target.score!));
    const sameScore = scored.filter((c) => displayScore(c.score!) === displayScore(target.score!));
    expect(named.id).toBe(sameScore[0]!.id);
  });

  it('names the check: by its score, by weekday, and the newest otherwise', async () => {
    const { store, clock } = await setup();
    const byScore = await routeOf(store, clock, 'Why did I only get a 6.5?');
    expect(byScore.snap.checks.find((c) => c.id === byScore.ctx.handles[byScore.route.check!])?.score).toBe(6.5);
    const byDay = await routeOf(store, clock, 'Why was Tuesday only a 6.5?');
    expect(byDay.route.check).toBe(byScore.route.check);
    const newest = await routeOf(store, clock, 'Why is my score so low?');
    expect(newest.snap.checks.find((c) => c.id === newest.ctx.handles[newest.route.check!])?.dayKey).toBe(dayKey(NOW, US_EASTERN));
  });
});

describe('R2 · evidence is computed by code', () => {
  const deps = (store: KittedStore) => ({ readingOf: async (id: string | null) => (id ? (await store.readings.get(id))?.reading ?? null : null), starterMarks: [] as string[] });

  it('explain: the check in full, with its fixes and their targets', async () => {
    const { store, clock } = await setup();
    const r = await routeOf(store, clock, 'Why did I only get a 6.5?');
    const ev = await buildEvidence(r.route, r.snap, r.ctx, deps(store));
    expect(ev.text).toMatch(/The check he means: FC\d+/);
    expect(ev.text).toMatch(/6\.5 Getting there/);
  });

  it('what-if: the check\'s fixes with their stored targets, and a named swap re-scored by the parts engine', async () => {
    const { store, clock } = await setup();
    const r = await routeOf(store, clock, 'What if I wore the brown loafers instead?');
    const ev = await buildEvidence(r.route, r.snap, r.ctx, deps(store));
    const check = r.snap.checks.find((c) => c.id === r.ctx.handles[r.route.check!])!;
    for (const f of check.fixes) expect(ev.text).toContain(`: ${displayScore(f.to)} (the app's fix`);
    expect(ev.text).toMatch(/If he wears P\d+ Brown loafers instead: \d+\.\d/);
  });

  it('goes with: outfits that all include the piece, and no predicted score', async () => {
    const { store, clock } = await setup();
    const r = await routeOf(store, clock, 'What goes with my olive overshirt?');
    const ev = await buildEvidence(r.route, r.snap, r.ctx, deps(store));
    const lines = ev.text.split('\n').filter((l) => l.startsWith('- '));
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) {
      expect(l).toContain('Olive overshirt');
      expect(l).not.toMatch(/\d\.\d/);
    }
  });

  it('buy next: the Starter rows he lacks, "+N" from the Closet\'s count (#309), most first', async () => {
    const { store, clock } = await setup();
    const r = await routeOf(store, clock, 'What should I buy next?');
    const ev = await buildEvidence(r.route, r.snap, r.ctx, deps(store));
    expect(ev.text).toMatch(/s05 dark straight jeans · \+16 outfits/);
    expect(ev.text).toMatch(/s02 a navy polo · \+6 outfits/);
    expect(ev.text.indexOf('s05')).toBeLessThan(ev.text.indexOf('s02'));
  });

  it('kinds that need nothing get nothing', async () => {
    const { store, clock } = await setup();
    const r = await routeOf(store, clock, 'How should chinos fit?');
    expect((await buildEvidence(r.route, r.snap, r.ctx, deps(store))).text).toBe('');
  });
});

/** A source that answers from a script per call (the model's first and second reply). */
function scriptedCalls(calls: AnswerEvent[][], seen: { prompts: string[] }): AnswerSource {
  let i = 0;
  return {
    name: 'script',
    async *answer(req) {
      seen.prompts.push(req.prompt?.user ?? '');
      for (const e of calls[Math.min(i++, calls.length - 1)]!) yield e;
    },
  };
}

async function askWith(source: AnswerSource) {
  const { store, clock } = await setup();
  const quota = createQuota({ store, clock, isPro: () => true });
  const ids = counterIds();
  const ask = createAsk({
    store, quota, clock, ids, source: () => source, prepare: createPrepare({ store, clock, ids }), consent: async () => true, openConsent: () => {}, tryPro: () => false,
  });
  const run = async (q: string) => {
    const o = await ask.ask(q);
    if (o.kind !== 'sent') throw new Error(o.kind);
    const r = await o.done;
    if (r.kind !== 'answered') throw new Error(`failed ${r.code}`);
    return (await store.chat.get(r.messageId))!;
  };
  return { store, clock, quota, ask, run };
}

describe('R3 · one lookup at most', () => {
  it('a need makes exactly one second call with that evidence; a second need is ignored', async () => {
    const seen = { prompts: [] as string[] };
    const needOnce = { type: 'done', need: { lookup: 'buy_next' } } as const;
    const src = scriptedCalls([
      [{ type: 'delta', text: 'One moment.' }, needOnce],
      [{ type: 'delta', text: 'A navy polo. It goes with both chinos.' }, needOnce],
    ], seen);
    const { run } = await askWith(src);
    const m = await run('Anything I should pick up?');
    expect(seen.prompts).toHaveLength(2);
    expect(seen.prompts[0]).not.toContain('<evidence>');
    expect(seen.prompts[1]).toMatch(/<evidence>[\s\S]*navy polo · \+6 outfits/);
    expect(m.text).toBe('A navy polo. It goes with both chinos.');
  });

  it('a lookup naming a handle that isn\'t in the pack is no lookup', () => {
    expect(parseLookup({ lookup: 'goes_with', piece: 'P999' }, { P1: 'x' })).toBeNull();
    expect(parseLookup({ lookup: 'delete_everything' }, {})).toBeNull();
  });
});

describe('R4–R5 · cards are built by code', () => {
  async function inputs() {
    const { store, clock } = await setup();
    const snap = await loadStylistSnapshot(store, clock);
    const ctx = buildStylistContext(snap, 'q');
    const h = (name: string) => Object.entries(ctx.handles).find(([, id]) => snap.closet.find((c) => c.id === id)?.name === name)?.[0]!;
    const fc = Object.keys(ctx.handles).find((k) => k.startsWith('FC'))!;
    return { store, snap, ctx, h, fc, input: { handles: ctx.handles, closet: snap.closet, checks: snap.checks, styles: snap.profile?.styles ?? null, starterMarks: [], gate: { allowedScores: new Set<string>() } } };
  }

  it('an outfit only from his pieces that make a valid outfit', async () => {
    const { h, input } = await inputs();
    const ok = buildCard({ type: 'outfit', pieces: [h('Olive overshirt'), h('White tee'), h('Dark jeans'), h('White sneakers')] }, input);
    expect(ok).toMatchObject({ type: 'outfit', occasion: 'everyday' });
    expect(buildCard({ type: 'outfit', pieces: [h('White tee'), h('Dark jeans')] }, input)).toBeNull(); // no shoes
    expect(buildCard({ type: 'outfit', pieces: [h('White tee'), h('Dark jeans'), 'P999'] }, input)).toBeNull(); // unknown handle
    expect(buildCard({ type: 'outfit', pieces: [h('White tee'), h('White tee'), h('White sneakers')] }, input)).toBeNull();
  });

  it('a check card only with a real occasion', async () => {
    const { input } = await inputs();
    expect(buildCard({ type: 'check', occasion: 'interview' }, input)).toEqual({ type: 'check', occasion: 'interview' });
    expect(buildCard({ type: 'check' }, input)).toEqual({ type: 'check', occasion: 'everyday' });
    expect(buildCard({ type: 'check', occasion: 'moon landing' }, input)).toBeNull();
  });

  it('an ask card with 2–4 answers, then "Not sure"; its words pass the gate', async () => {
    const { input } = await inputs();
    expect(buildCard({ type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Business casual'] }, input))
      .toEqual({ type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Business casual', 'Not sure'] });
    expect(buildCard({ type: 'ask', question: 'Which?', options: ['Only one'] }, input)).toBeNull();
    expect(buildCard({ type: 'ask', question: 'Which?', options: ['a', 'b', 'c', 'd', 'e'] }, input)).toBeNull();
    expect(buildCard({ type: 'ask', question: 'Nike or Adidas?', options: ['Nike', 'Adidas'] }, input)).toBeNull();
  });

  it('a buy card names a Starter row he lacks; "+N" is the Closet\'s count, never the model\'s; no brand', async () => {
    const { input } = await inputs();
    const c = buildCard({ type: 'buy', kind: 'polo', shade: 'navy', plus: 99 }, input) as Extract<AskCard, { type: 'buy' }>;
    expect(c).toEqual({ type: 'buy', starterId: 's02', gain: 6 });
    expect(buildCard({ type: 'buy', kind: 'loafers' }, input)).toBeNull(); // he owns brown loafers
    expect(buildCard({ type: 'buy', kind: 'Nike Dunks' }, input)).toBeNull();
    expect(STARTER.find((e) => e.id === 's02')!.name).not.toMatch(/nike|adidas|uniqlo/i);
  });

  it('a link only to a scored check or a piece he owns', async () => {
    const { h, fc, ctx, input } = await inputs();
    expect(buildCard({ type: 'link', to: `check:${fc}` }, input)).toEqual({ type: 'link', checkId: ctx.handles[fc] });
    expect(buildCard({ type: 'link', to: `piece:${h('Brown loafers')}` }, input)).toEqual({ type: 'link', itemId: ctx.handles[h('Brown loafers')] });
    expect(buildCard({ type: 'link', to: 'https://shop.example' }, input)).toBeNull();
    expect(buildCard({ type: 'link', to: 'piece:P999' }, input)).toBeNull();
  });

  it('an unknown card drops the card and keeps the answer', async () => {
    const src = scriptedCalls([[{ type: 'delta', text: 'Wear the loafers.' }, { type: 'done', card: { type: 'outfit', pieces: ['P999', 'P1', 'P2'] } }]], { prompts: [] });
    const { run } = await askWith(src);
    const m = await run('Shoes for tonight?');
    expect(m.text).toBe('Wear the loafers.');
    expect(m.payload.askCard).toBeUndefined();
  });
});

describe('R6 · the cards work', () => {
  it('the demo\'s outfit, check, ask, buy and link answers come back with their cards', async () => {
    const answers = seededAnswers(seed as unknown as { scenarios: Record<string, unknown> });
    const { run } = await askWith(createDemoSource({ answers, scheduler: { sleep: async () => {} }, timed: () => false }));
    const types: (string | undefined)[] = [];
    for (const q of ['What goes with my olive overshirt?', 'What would this outfit score?', 'What should I wear to work?', 'What should I buy next?', 'Which shoes are my dressiest?']) {
      types.push(storedCard((await run(q)).payload.askCard)?.type);
    }
    expect(types).toEqual(['outfit', 'check', 'ask', 'buy', 'link']);
    expect(DEMO_CARD_ANSWERS.length).toBeGreaterThanOrEqual(6);
  });

  it('tapping an ask card\'s answer sends it as his reply, answered, never counted', async () => {
    const answers = seededAnswers(seed as unknown as { scenarios: Record<string, unknown> });
    const { ask, run, quota, store } = await askWith(createDemoSource({ answers, scheduler: { sleep: async () => {} }, timed: () => false }));
    const card = await run('What should I wear to work?');
    const used = (await quota.snapshot()).questionsUsed;
    const o = await ask.tap(card.id, 'Business casual');
    if (o.kind !== 'sent') throw new Error(o.kind);
    const r = await o.done;
    expect(r).toMatchObject({ kind: 'answered', counted: false });
    expect((await quota.snapshot()).questionsUsed).toBe(used);
    const rows = (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt);
    const reply = rows.find((m) => m.role === 'user' && m.text === 'Business casual')!;
    expect(reply.payload.tapOf).toBe(card.id);
    expect((await store.chat.get(card.id))!.payload.askTapped).toBe('Business casual');
    expect((await ask.tap(card.id, 'Yes')).kind).toBe('empty'); // answered once
  });
});

describe('R7 · starter chips', () => {
  it('at most 3, from his data: today\'s score, his most-worn piece, a learn line', async () => {
    const { store } = await setup();
    const chips = starterChips({ nowMs: NOW, zone: US_EASTERN, closet: await store.closet.all(), checks: await store.fitChecks.all() });
    expect(chips).toHaveLength(3);
    expect(chips[0]).toBe('Why a 9.0?');
    expect(chips[1]).toMatch(/^What goes with my /);
  });
  it('an empty closet gets learn lines and "What should I buy first?"', () => {
    const chips = starterChips({ nowMs: NOW, zone: US_EASTERN, closet: [], checks: [] });
    expect(chips).toHaveLength(3);
    expect(chips[2]).toBe('What should I buy first?');
  });
});

describe('R8 · Past chats', () => {
  it('a stored outfit card is drawn from ids; a piece removed since shows as gone', async () => {
    const { store, clock } = await setup();
    const snap = await loadStylistSnapshot(store, clock);
    const ids = snap.closet.filter((c) => ['White tee', 'Dark jeans', 'White sneakers'].includes(c.name)).map((c) => c.id);
    const card = storedCard({ type: 'outfit', itemIds: ids, occasion: 'everyday' }) as Extract<AskCard, { type: 'outfit' }>;
    expect(outfitNow(card, snap.closet)).toMatchObject({ gone: false });
    await store.closet.patch(ids[1]!, { isDeleted: true });
    const after = outfitNow(card, await store.closet.all());
    expect(after.gone).toBe(true);
    expect(after.items).toHaveLength(2);
  });
  it('anything else in a payload isn\'t a card', () => {
    expect(storedCard({ type: 'outfit', pieces: ['P1'] })).toBeNull();
    expect(storedCard('outfit')).toBeNull();
  });
});

describe('G4 · no score moves, a tap never counts', () => {
  it('asking every demo question leaves every check\'s score as it was', async () => {
    const answers = seededAnswers(seed as unknown as { scenarios: Record<string, unknown> });
    const { run, store } = await askWith(createDemoSource({ answers, scheduler: { sleep: async () => {} }, timed: () => false }));
    const scores = async () => (await store.fitChecks.all()).map((c) => [c.id, c.score, c.rawScore]).sort();
    const before = await scores();
    for (const a of DEMO_CARD_ANSWERS) await run(a.question);
    expect(await scores()).toEqual(before);
  });
});

