// T53 · what a notification tap opens (NT2.4, NT6.4): `openFromNotification` on the memory store, with recording
// stand-ins for the router, the morning card's ensureCard and setStylistAction. The contract: tasks/T53/TESTING.md.
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, DailyIdeaRow } from '@/data/types';
import { openFromNotification, type TapDeps } from '@/features/morning/nudgeTap';
import type { StylistAction } from '@/router/stylistAction';
import { manualClock } from '@/services/clock';

const at = (iso: string) => Date.parse(iso);
const T0 = at('2026-10-22T11:47:00Z'); // 7:47 am EDT, two minutes after the 7:45 nudge

const msg = (id: string, createdAt: number, o: Partial<ChatMessage> = {}): ChatMessage => ({
  id, createdAt, role: 'stylist', kind: 'card', text: null, cardType: 'morning', fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {}, ...o,
});
const idea = (day: string, slot: 'day' | 'evening', messageId: string | null): DailyIdeaRow =>
  ({ id: `${day}|${slot}`, dayKey: day, slot, occasion: 'everyday', style: null, outfitId: null, weather: null, messageId, state: 'open', fitCheckId: null, createdAt: T0 }) as unknown as DailyIdeaRow;

async function rig(o: { now?: number; posts?: boolean } = {}) {
  const store: KittedStore = createMemoryStore();
  await store.init();
  const clock = manualClock(o.now ?? T0);
  const order: string[] = [];
  const actions: StylistAction[] = [];
  const deps: TapDeps = {
    store, clock,
    navigate: () => void order.push('navigate'),
    setAction: (a) => {
      order.push('setAction');
      actions.push(a);
    },
    // The morning card's ensureCard: a tick later, today's window card is in the thread (unless fit checks are off).
    ensureTodaysCard: async () => {
      order.push('ensure:start');
      await new Promise((r) => setTimeout(r, 0));
      if (o.posts !== false) {
        const h = new Date(clock.nowMs() - 4 * 3_600_000).getUTCHours(); // EDT
        const slot = h >= 4 && h < 17 ? 'day' : 'evening';
        const id = `2026-10-22|${slot}`;
        if (!(await store.dailyIdeas.get(id))) {
          await store.chat.put(msg(`M-${slot}`, clock.nowMs()));
          await store.dailyIdeas.put(idea('2026-10-22', slot, `M-${slot}`));
        }
      }
      order.push('ensure:done');
      return null;
    },
  };
  return { store, clock, order, actions, deps };
}

describe('NT2.4 · a nudge tap', () => {
  it("NT2.4 · a nudge tap opens Stylist and scrolls to today's card, posting it if needed", async () => {
    const r = await rig();
    await openFromNotification({ kind: 'nudge' }, r.deps);
    expect(r.order).toEqual(['navigate', 'ensure:start', 'ensure:done', 'setAction']);
    expect(r.actions).toEqual([{ kind: 'scrollTo', messageId: 'M-day' }]);
    // Already posted: the same card.
    const p = await rig();
    await p.store.chat.put(msg('M-posted', T0 - 60_000));
    await p.store.dailyIdeas.put(idea('2026-10-22', 'day', 'M-posted'));
    await openFromNotification({ kind: 'nudge' }, p.deps);
    expect(p.actions).toEqual([{ kind: 'scrollTo', messageId: 'M-posted' }]);
    expect(p.order.filter((x) => x === 'navigate')).toHaveLength(1);
  });

  it("NT2.4 · an older day's nudge opens today's card", async () => {
    const r = await rig();
    await r.store.chat.put(msg('M-yesterday', T0 - 86_400_000));
    await r.store.dailyIdeas.put(idea('2026-10-21', 'day', 'M-yesterday'));
    await r.store.chat.put(msg('M-last-night', T0 - 12 * 3_600_000));
    await r.store.dailyIdeas.put(idea('2026-10-21', 'evening', 'M-last-night'));
    await openFromNotification({ kind: 'nudge' }, r.deps);
    expect(r.actions).toEqual([{ kind: 'scrollTo', messageId: 'M-day' }]);
    // After 5 pm, the evening card.
    const e = await rig({ now: at('2026-10-22T22:30:00Z') }); // 6:30 pm EDT
    await e.store.chat.put(msg('M-morning', T0));
    await e.store.dailyIdeas.put(idea('2026-10-22', 'day', 'M-morning'));
    await openFromNotification({ kind: 'nudge' }, e.deps);
    expect(e.actions).toEqual([{ kind: 'scrollTo', messageId: 'M-evening' }]);
    expect(US_EASTERN(e.clock.nowMs())).toBe(-4 * 3_600_000);
  });

  it('NT2.4 · no card (fit checks declined): Stylist, no scroll', async () => {
    const r = await rig({ posts: false });
    await openFromNotification({ kind: 'nudge' }, r.deps);
    expect(r.order).toEqual(['navigate', 'ensure:start', 'ensure:done']);
    expect(r.actions).toEqual([]);
  });
});

describe('NT6.4 · a Fit check ready tap', () => {
  it("NT6.4 · a ready tap scrolls to that check's card", async () => {
    const r = await rig();
    await r.store.chat.put(msg('M-photo-c1', T0 - 30_000, { role: 'user', kind: 'photo', cardType: null, fitCheckId: 'c1' }));
    await r.store.chat.put(msg('M-c1', T0 - 20_000, { cardType: 'fitCheck', fitCheckId: 'c1' }));
    await r.store.chat.put(msg('M-c2', T0 - 10_000, { cardType: 'fitCheck', fitCheckId: 'c2' }));
    await r.store.chat.put(msg('M-today', T0, { cardType: 'morning' }));
    await r.store.dailyIdeas.put(idea('2026-10-22', 'day', 'M-today'));
    await openFromNotification({ kind: 'ready', checkId: 'c1' }, r.deps);
    expect(r.actions).toEqual([{ kind: 'scrollTo', messageId: 'M-c1' }]);
    expect(r.order).toEqual(['navigate', 'setAction']);
    // Never the camera, never another check.
    const all = [...r.actions];
    await openFromNotification({ kind: 'ready', checkId: 'c2' }, r.deps);
    expect([...all, ...r.actions.slice(1)]).toEqual([{ kind: 'scrollTo', messageId: 'M-c1' }, { kind: 'scrollTo', messageId: 'M-c2' }]);
    expect(r.actions.some((a) => a.kind === 'checkMyFit')).toBe(false);
  });
});
