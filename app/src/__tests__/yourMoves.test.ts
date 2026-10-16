// L3 "Your moves" and the pinned rows (handoff/10-onboarding.md §9.9), checks Y1–Y5 as far as logic can prove them.
// The screens (Y6, Y7) were checked in the web preview.
import { createMemoryStore } from '@/data/memoryStore';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { buildMoves } from '@/features/finish/moves';
import { createFinishService, FINISH_KEY, getFinish, getStarterMarks, type FinishDeps } from '@/features/finish/service';
import { NO_FINISH, type FinishState } from '@/features/finish/sequence';
import { STARTER } from '@/features/finish/starter';
import { toggleStarter } from '@/features/finish/starterActions';
import { loadYourMoves, moveStart, movesDoneCount, movesSource, pinnedShows } from '@/features/finish/yourMoves';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { scriptedNotifications } from '@/services/notifications';

const T0 = Date.parse('2026-10-22T11:42:00Z');

const fix = (copy: string) =>
  ({ target: copy, tier: 'free', effort: 1, free: true, to: 7.5, toRaw: 7.5, gain: 0.5, rawGain: 0.5, edits: [], itemId: null, copy, tag: 'Free' }) as unknown as FitCheckRow['fixes'][number];

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 6.5, rawScore: 6.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [fix('Tuck in your tee')], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: true, readingId: null, parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

function piece(id: string, slot: string, subcategory: string, color: string): ClosetItemRow {
  return {
    id, name: id, slot, garment: { category: slot === 'shoes' ? 'footwear' : slot, subcategory, color_family: color, pattern: 'solid', leg_shape: slot === 'bottom' ? 'straight' : 'na' },
    confirmedFields: [], hex: '#888888', photoFile: null, demoPhotoId: null, isPhotographed: true, source: 'fitCheck', starterId: null, wornCount: 1,
    lastWornAt: null, addedAt: T0, isDeleted: false,
  } as ClosetItemRow;
}

async function storeWithFirstCheck() {
  const store = createMemoryStore();
  await store.init();
  await store.profile.put({
    id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
    lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: '08:00', units: 'imperial', createdAt: T0,
  });
  for (const p of [piece('T', 'top', 'tee', 'white'), piece('B', 'bottom', 'jeans', 'denim_dark'), piece('S', 'shoes', 'canvas_sneaker', 'white')]) await store.closet.put(p);
  await store.fitChecks.put(check('a', T0));
  return store;
}

/** The sequence posts its moves card the way the app does (Later on the first check). */
async function postMoves(store: Awaited<ReturnType<typeof storeWithFirstCheck>>) {
  const clock = manualClock(T0 + 60_000);
  const d: FinishDeps = {
    store, clock, ids: counterIds(), busy: () => false, paywallOn: () => false, isPro: () => false, notificationsOn: () => false,
    notifications: scriptedNotifications('allow'), stylistInFront: () => true, openPaywall: () => {}, later: () => {},
  };
  const s = createFinishService(d);
  await s.later('a');
  return clock;
}

const state = (o: Partial<FinishState>): FinishState => ({ ...NO_FINISH, checkId: 'a', movesMsgId: 'M-1', ...o });

describe('Y1 · the rows exist only once the moves card is posted', () => {
  it('reads the card at moves, paywall and done; never at waiting or skipped, or without the card', () => {
    expect(movesSource(state({ step: 'moves' }))).toEqual({ checkId: 'a', movesMsgId: 'M-1' });
    expect(movesSource(state({ step: 'paywall' }))).not.toBeNull();
    expect(movesSource(state({ step: 'done' }))).not.toBeNull();
    expect(movesSource(state({ step: 'waiting' }))).toBeNull();
    expect(movesSource(state({ step: 'skipped' }))).toBeNull();
    expect(movesSource(state({ step: 'done', movesMsgId: null }))).toBeNull();
    expect(movesSource(state({ step: 'moves', checkId: null }))).toBeNull();
  });

  it('a fresh phone, a skipped one (the founder\'s), and a first check that\'s gone: no plan, no row', async () => {
    const store = await storeWithFirstCheck();
    expect(await loadYourMoves(store)).toBeNull();
    expect(pinnedShows(await loadYourMoves(store))).toBe(false);
    await store.setKv(FINISH_KEY, JSON.stringify({ ...NO_FINISH, step: 'skipped' }));
    expect(await loadYourMoves(store)).toBeNull();
    await store.setKv(FINISH_KEY, JSON.stringify(state({ step: 'done', checkId: 'gone' })));
    expect(await loadYourMoves(store)).toBeNull();
  });

  it('after Later posts the card: a plan with a move left, so the row shows', async () => {
    const store = await storeWithFirstCheck();
    await postMoves(store);
    expect((await getFinish(store)).step).not.toBe('waiting');
    const plan = await loadYourMoves(store);
    expect(plan).not.toBeNull();
    expect(pinnedShows(plan)).toBe(true);
  });
});

describe('Y2 · the same 3 moves as the card', () => {
  it('uses the card\'s first check and its buyId, and follows a Starter mark at once', async () => {
    const store = await storeWithFirstCheck();
    const clock = await postMoves(store);
    const s = await getFinish(store);
    const card = (await store.chat.get(s.movesMsgId!))!;
    expect(card.cardType).toBe('plan');
    const buyId = card.payload.buyId as string;
    // What the chat card draws (useMoves), from the same rows.
    const cardPlan = buildMoves({ first: (await store.fitChecks.get('a'))!, recheck: null, closet: await store.closet.all(), styles: [['minimalist', 0.5]] as never, markedKv: await getStarterMarks(store), buyId });
    const plan = (await loadYourMoves(store))!;
    expect(plan).toEqual(cardPlan);
    expect(plan.moves.map((m) => m.kind)).toEqual(['basics', 'fix', 'buy']);
    expect(plan.moves[1]!.title).toBe('Tuck in your tee');

    // The card's buyId wins even when a different gap would be picked now.
    const other = STARTER.find((e) => e.pick && e.id !== buyId && e.slot === 'shoes')!;
    await store.chat.put({ ...card, payload: { ...card.payload, buyId: other.id } });
    expect((await loadYourMoves(store))!.moves[2]!.title).toBe(t('plan.move3', { item: other.pick!.phrase }));
    await store.chat.put(card);

    // Mark a basic: move 1 turns done.
    await toggleStarter(store, STARTER.find((e) => e.id === 's04')!, counterIds(), clock.nowMs());
    expect((await loadYourMoves(store))!.moves[0]!.done).toBe(true);
  });
});

describe('Y3–Y5 · the count, Start on each move left, all done', () => {
  it('counts done moves; every move not done has a Start, a done one none; all done hides the row', async () => {
    const store = await storeWithFirstCheck();
    const clock = await postMoves(store);
    const p0 = (await loadYourMoves(store))!;
    expect(movesDoneCount(p0)).toBe(0);
    expect(t('moves.done', { n: movesDoneCount(p0) })).toBe('0 of 3 done');
    expect(t('lookbook.movesCount', { n: movesDoneCount(p0) })).toBe('0 of 3');
    // Y4: all three can be started, in any order; where they go matches the card (M4).
    expect(p0.moves.map(moveStart)).toEqual(['starter', 'camera', 'starter']);

    // Move 2 done by the re-check, move 1 still open: Start on 1 and 3 only.
    await store.fitChecks.put(check('r', T0 + 120_000, {
      parentId: 'a', isFirstCheck: false,
      details: { recheck: { parentScore: 6.5, delta: 0.5, rawDelta: 0.5, notes: [], doneFixes: [{ copy: 'Tuck in your tee', earned: 0.5 }], newProblems: [], notSeen: false } },
    }));
    const p1 = (await loadYourMoves(store))!;
    expect(p1.moves.map(moveStart)).toEqual(['starter', null, 'starter']);
    expect(movesDoneCount(p1)).toBe(1);
    expect(pinnedShows(p1)).toBe(true);

    // Y5: the basics marked and the named piece added: all done, no Start, no pinned row.
    const s = await getFinish(store);
    const buyId = (await store.chat.get(s.movesMsgId!))!.payload.buyId as string;
    await toggleStarter(store, STARTER.find((e) => e.id === buyId)!, counterIds(), clock.nowMs());
    const p2 = (await loadYourMoves(store))!;
    expect(movesDoneCount(p2)).toBe(3);
    expect(p2.current).toBeNull();
    expect(p2.moves.map(moveStart)).toEqual([null, null, null]);
    expect(pinnedShows(p2)).toBe(false);
    expect(t('moves.allDone')).toBe('All 3 done. Nice work.');
  });
});

describe('Y7 · VoiceOver lines', () => {
  it('reads each move by number, done or not, and the row as one line', () => {
    expect(t('moves.a11y.row', { n: 2, title: 'Tuck in your tee', detail: 'Free' })).toBe('Move 2: Tuck in your tee. Free.');
    expect(t('moves.a11y.rowDone', { n: 1, title: 'Tap the basics you own' })).toBe('Move 1, done: Tap the basics you own.');
    expect(t('moves.a11y.pinned', { n: 1 })).toBe('Your moves, 1 of 3 done');
    expect(t('plan.startN', { n: 2 })).toBe('Start move 2');
  });
});
