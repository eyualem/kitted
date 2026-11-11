// T35 · The feature guide (specs/setup-and-you.md SY2, SY3): when each tip shows, that Got it ends it, the first-score
// tip's check, Kit's hello at setup's end, and Show me around. The words are checked against the approved lines.
import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow } from '@/data/types';
import { completeOnboarding } from '@/features/onboarding/complete';
import {
  FIRST_SCORE_AFTER_KEY, TIP_IDS, dismissTip, firstScoreAfter, firstScoreTipCheck, hasScoredCheck, isKitHello, isTipDone, showMeAround,
  tabTipShows, tipKey,
} from '@/features/onboarding/tips';
import { t } from '@/i18n/en';
import { counterIds } from '@/services/ids';

function check(id: string, createdAt: number, over: Partial<FitCheckRow> = {}): FitCheckRow {
  return { id, createdAt, status: 'scored', score: 7.5, parentId: null, recheckUsed: false, ...over } as FitCheckRow;
}

const answers = { styles: [] as never, fitPreference: '', birthYear: 2004 };

describe('SY2.1 · Kit\'s hello at setup\'s end', () => {
  it('posts the hello once, with no separate AI note, on Agree and on Not now', async () => {
    for (const consent of [true, false]) {
      const store = createMemoryStore();
      await completeOnboarding(store, { ...answers, consent }, 1000, counterIds());
      const ms = (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt);
      expect(ms.filter(isKitHello)).toHaveLength(1);
      expect(ms[0] && isKitHello(ms[0])).toBe(true);
      expect(ms.some((m) => m.payload.aiNote)).toBe(false);
    }
  });

  it('reads exactly the approved words, ending with the AI note word for word', () => {
    expect(t('stylist.hello')).toBe(
      "I'm Kit, your stylist. Here's how this works:\n· Send me a photo of your fit. I'll score it out of 10 and give you the fix that raises it.\n· Ask me anything about clothes, like what to wear to a career fair.\n· Every fit check adds your pieces to Closet, so my ideas get better.\nQuick note: I'm an AI. I read clothes, never faces, and I can get things wrong. Tap \"Not quite right?\" when I do.",
    );
    expect(t('stylist.hello').endsWith(t('stylist.aiNote').replace("I'm Kit, your stylist. ", ''))).toBe(true);
  });

  it('never reaches a question\'s history (it has no text of its own)', async () => {
    const store = createMemoryStore();
    await completeOnboarding(store, { ...answers, consent: true }, 1000, counterIds());
    const hello = (await store.chat.all()).find(isKitHello)!;
    // The question's history (ask/context.ts) keeps only messages with text, so a text-less hello is never sent.
    expect(hello.text).toBeNull();
  });
});

describe('SY2.2, SY2.9 · the first-score tip', () => {
  it('belongs to the first scored check only, never a re-check or an unscored one', () => {
    const checks = [check('C2', 200), check('C1', 100), check('C0', 50, { status: 'failed', score: null }), check('R1', 300, { parentId: 'C1' })];
    // C1 has a re-check (R1): the tip is gone, and it never moves to C2.
    expect(firstScoreTipCheck(checks, 0)).toBeNull();
    expect(firstScoreTipCheck([check('C2', 200), check('C1', 100), check('C0', 50, { status: 'scoring', score: null })], 0)).toBe('C1');
  });

  it('ends once the fit is re-checked (recheckUsed) as well', () => {
    expect(firstScoreTipCheck([check('C1', 100, { recheckUsed: true })], 0)).toBeNull();
  });

  it('shows nothing before his first scored check', () => {
    expect(firstScoreTipCheck([check('C1', 100, { status: 'scoring', score: null })], 0)).toBeNull();
    expect(hasScoredCheck([check('C1', 100, { status: 'unreadable', score: null })])).toBe(false);
  });
});

describe('SY2.3–SY2.5 · the tab tips', () => {
  it('show only while not done, after a scored check, and on a tab with something in it', () => {
    expect(tabTipShows(false, true, true)).toBe(true);
    expect(tabTipShows(true, true, true)).toBe(false);
    expect(tabTipShows(false, false, true)).toBe(false);
    expect(tabTipShows(false, true, false)).toBe(false);
  });

  it('Got it ends a tip for good, and only that one', async () => {
    const store = createMemoryStore();
    expect(await isTipDone(store, 'closet')).toBe(false);
    await dismissTip(store, 'closet');
    expect(await isTipDone(store, 'closet')).toBe(true);
    expect(await isTipDone(store, 'lookbook')).toBe(false);
    expect(await isTipDone(store, 'you')).toBe(false);
  });

  it('SY2.8 the approved words and button', () => {
    expect([t('tips.firstScore'), t('tips.closet'), t('tips.lookbook'), t('tips.you'), t('tips.gotIt'), t('settings.showMeAround')]).toEqual([
      "Do one of the fixes, then tap Re-check and I'll score it again.",
      'Every fit check adds its pieces here. Tap a piece to fix its name or color.',
      'Every fit you check lands here with its score and fixes. Tap one to see it again.',
      "Your style and what I've learned about you, plus your settings. Change your looks any time.",
      'Got it',
      'Show me around',
    ]);
  });
});

describe('SY2.6, SY2.7 · existing installs and the wipe', () => {
  it('an install that finished setup before this has no done marks, so its tips show; no hello is posted for it', async () => {
    const store = createMemoryStore();
    for (const id of TIP_IDS) expect(await isTipDone(store, id)).toBe(false);
    expect((await store.chat.all()).some(isKitHello)).toBe(false);
  });

  it('"Delete all my data" (store.wipe) clears every done mark and the Show me around time', async () => {
    const store = createMemoryStore();
    for (const id of TIP_IDS) await dismissTip(store, id);
    await store.setKv(FIRST_SCORE_AFTER_KEY, '5000');
    await store.wipe();
    for (const id of TIP_IDS) expect(await store.getKv(tipKey(id))).toBeNull();
    expect(await firstScoreAfter(store)).toBe(0);
  });
});

describe('SY3 · Show me around', () => {
  it('SY3.1 clears every done mark and posts Kit\'s hello as the newest message', async () => {
    const store = createMemoryStore();
    const ids = counterIds();
    await completeOnboarding(store, { ...answers, consent: true }, 1000, ids);
    await store.chat.put({ id: 'U1', createdAt: 5000, role: 'user', kind: 'text', text: 'hi', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {} });
    for (const id of TIP_IDS) await dismissTip(store, id);
    await showMeAround(store, 9000, ids);
    for (const id of TIP_IDS) expect(await isTipDone(store, id)).toBe(false);
    const ms = (await store.chat.all()).sort((a, b) => b.createdAt - a.createdAt);
    expect(isKitHello(ms[0]!)).toBe(true);
    expect(ms.filter(isKitHello)).toHaveLength(2);
  });

  it('SY3.2 a second tap while the hello is still newest posts no second copy', async () => {
    const store = createMemoryStore();
    const ids = counterIds();
    await showMeAround(store, 1000, ids);
    await showMeAround(store, 2000, ids);
    expect((await store.chat.all()).filter(isKitHello)).toHaveLength(1);
  });

  it('SY3.2 the hello lands last even when the clock reads earlier than the newest message', async () => {
    const store = createMemoryStore();
    await store.chat.put({ id: 'U1', createdAt: 9000, role: 'user', kind: 'text', text: 'hi', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {} });
    await showMeAround(store, 1000, counterIds());
    const newest = (await store.chat.all()).sort((a, b) => b.createdAt - a.createdAt)[0]!;
    expect(isKitHello(newest)).toBe(true);
  });

  it('SY3.3 afterwards the first-score tip waits for the next scored check, never an older one', async () => {
    const store = createMemoryStore();
    await showMeAround(store, 1000, counterIds());
    const after = await firstScoreAfter(store);
    expect(after).toBe(1000);
    expect(firstScoreTipCheck([check('OLD', 500)], after)).toBeNull();
    expect(firstScoreTipCheck([check('OLD', 500), check('NEXT', 1500), check('LATER', 2500)], after)).toBe('NEXT');
  });
});
