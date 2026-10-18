// The chat UI pass (07 §17, #314): the checks set before fixing. U1–U9, U12, U14, U15, U18 here; U10–U11, U13, U16–U17
// and U19 are read in code or seen on the Simulator (§17 results).
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, ClosetItemRow } from '@/data/types';
import { chipDisplay } from '@/features/ask/answerText';
import { linkedPiece } from '@/features/ask/cards';
import { liveAnswer, liveRowShows, liveRowSpoken } from '@/features/ask/live';
import { createAsk, type AskDeps } from '@/features/ask/pipeline';
import { createDemoSource, seededAnswers, type AnswerEvent, type AnswerSource } from '@/features/ask/source';
import { deleteAllData } from '@/features/privacy/wipe';
import { createDictationController, type DictationNative } from '@/features/stylist/dictation';
import { buildThreadItems, isStylistLine, liveGap, RHYTHM, rowGap, withoutCardGreetings } from '@/features/stylist/thread';
import { userBubbleMaxWidth } from '@/design-system/components/chatLayout';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const at = (iso: string) => Date.parse(iso);
const NOW = at('2026-10-22T12:30:00-04:00');
const SEEDED = seededAnswers(seed as unknown as { scenarios: Record<string, unknown> });
const OLIVE = 'Can I wear the olive overshirt with the navy chinos?';

function scripted(events: AnswerEvent[]): AnswerSource {
  return {
    name: 'script',
    async *answer() {
      for (const e of events) yield e;
    },
  };
}

async function setup(over: Partial<AskDeps> = {}) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  const quota = createQuota({ store, clock, isPro: () => false });
  const posted: string[] = [];
  const answered: string[] = [];
  const ask = createAsk({
    store,
    quota,
    clock,
    ids: counterIds(),
    source: () => createDemoSource({ answers: SEEDED, scheduler: { sleep: async () => {} }, timed: () => false }),
    consent: async () => true,
    openConsent: () => {},
    tryPro: () => false,
    onPosted: (x) => posted.push(x),
    onAnswered: (x) => answered.push(x),
    ...over,
  });
  const chat = async () => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const used = async () => (await quota.snapshot()).questionsUsed;
  return { store, clock, quota, ask, chat, used, posted, answered };
}

const msg = (id: string, role: ChatMessage['role'], o: Partial<ChatMessage> = {}, minute = 0): ChatMessage => ({
  id, createdAt: at('2026-10-22T12:05:00-04:00') + minute * 60_000, role, kind: 'text', text: 'x', cardType: null,
  fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {}, ...o,
});

beforeEach(() => liveAnswer.clear());

describe('U1 · no ghost answer', () => {
  it('a finished answer goes once the thread shows its row', async () => {
    const s = await setup();
    const o = await s.ask.ask(OLIVE);
    if (o.kind === 'sent') await o.done;
    const done = liveAnswer.get();
    expect(done?.phase).toBe('done');
    const ids = new Set((await s.chat()).map((m) => m.id));
    liveAnswer.settle(new Set());
    expect(liveAnswer.get()).not.toBeNull(); // not yet shown: it keeps drawing (no flicker)
    liveAnswer.settle(ids);
    expect(liveAnswer.get()).toBeNull();
  });

  it('a finished answer from another day never draws; nothing after a wipe', async () => {
    liveAnswer.hold({ phase: 'done', questionId: 'Q', replaces: null, text: 'Yes.', messageId: 'M9', at: at('2026-10-21T22:00:00-04:00') });
    const day = (x: number) => new Date(x - 4 * 3600_000).toISOString().slice(0, 10);
    expect(liveRowShows(liveAnswer.get(), new Set(), (x) => day(x) === '2026-10-22')).toBe(false);
    expect(liveRowShows(liveAnswer.get(), new Set(), () => true)).toBe(true);
    const store = createMemoryStore();
    await deleteAllData({ store, files: { deletePhotos: () => {}, deleteLogs: () => {} } as never, clearDeviceId: async () => {} });
    expect(liveAnswer.get()).toBeNull();
  });
});

describe('U2 · one send, however fast he taps', () => {
  it('two sends in the same tick: one bubble, one answer, one count', async () => {
    const s = await setup();
    const [a, b] = await Promise.all([s.ask.ask(OLIVE), s.ask.ask(OLIVE)]);
    expect([a.kind, b.kind].sort()).toEqual(['busy', 'sent']);
    const sent = a.kind === 'sent' ? a : b.kind === 'sent' ? b : null;
    await sent?.done;
    const rows = await s.chat();
    expect(rows.filter((m) => m.role === 'user')).toHaveLength(1);
    expect(rows.filter((m) => m.role === 'stylist')).toHaveLength(1);
    expect(await s.used()).toBe(1);
  });

  it('a double-tapped Retry answers once, in the failed line’s place', async () => {
    let calls = 0;
    const s = await setup({
      source: () => (calls++ === 0 ? scripted([{ type: 'failed', code: 'x' }]) : createDemoSource({ answers: SEEDED, scheduler: { sleep: async () => {} }, timed: () => false })),
    });
    const o = await s.ask.ask(OLIVE);
    const failed = o.kind === 'sent' ? await o.done : null;
    const [a, b] = await Promise.all([s.ask.retry(failed!.messageId), s.ask.retry(failed!.messageId)]);
    expect([a?.kind, b?.kind].sort()).toEqual(['busy', 'sent']);
    const sent = a?.kind === 'sent' ? a : b?.kind === 'sent' ? b : null;
    await sent?.done;
    const rows = await s.chat();
    expect(rows.filter((m) => m.role === 'stylist').map((m) => typeof m.payload.answerTo)).toEqual(['string']);
    expect(await s.used()).toBe(1);
  });

  it('a busy send never leaves the claim behind: the next one goes', async () => {
    const s = await setup({ consent: async () => false });
    expect((await s.ask.ask(OLIVE)).kind).toBe('consent');
    expect(s.ask.busy).toBe(false);
  });
});

describe('U3 · words for another question are dropped', () => {
  it('append and finish ignore a question that isn’t the current one', () => {
    liveAnswer.start('Q1');
    liveAnswer.append('Yes. ', 'Q2');
    expect(liveAnswer.get()?.phase).toBe('waiting');
    liveAnswer.append('Yes. ', 'Q1');
    liveAnswer.finish('M2', 'No.', NOW, 'Q2');
    expect(liveAnswer.get()).toMatchObject({ phase: 'streaming', text: 'Yes. ' });
  });
});

describe('U4 · leaving while voice gets ready', () => {
  function rig() {
    let release: (v: 'ready') => void = () => {};
    const calls: string[] = [];
    const toasts: string[] = [];
    const timers: (() => void)[] = [];
    const native: DictationNative = {
      requestMicrophone: async () => 'granted',
      prepare: () => new Promise((r) => (release = r)),
      start: async () => {
        calls.push('start');
      },
      stop: async () => {
        calls.push('stop');
        return null;
      },
      onEvent: () => () => {},
    };
    const ctl = createDictationController({
      native, now: () => 0, setTimer: (fn) => timers.push(fn), clearTimer: () => {}, words: () => [], onHeard: () => {}, onToast: (k) => toasts.push(k), onMicOff: () => {},
    });
    return { ctl, calls, toasts, timers, ready: () => release('ready') };
  }

  it('dispose while preparing: the mic never starts, no toast', async () => {
    const r = rig();
    const started = r.ctl.start();
    await new Promise((x) => setTimeout(x, 0));
    r.ctl.dispose();
    r.ready();
    await started;
    r.timers.forEach((f) => f());
    expect([r.calls, r.toasts]).toEqual([[], []]);
  });

  it('stop while preparing is a cancel', async () => {
    const r = rig();
    const started = r.ctl.start();
    await new Promise((x) => setTimeout(x, 0));
    expect(await r.ctl.stop()).toBe('');
    r.ready();
    await started;
    expect(r.calls).toEqual([]);
  });
});

describe('U5–U7 · the thread: marks, answers, rhythm', () => {
  it('stylist lines drawn as cards carry the mark and continue the run', () => {
    const limit = msg('L', 'stylist', { kind: 'card', cardType: 'limit' }, 1);
    const items = buildThreadItems([msg('Q', 'user'), limit, msg('S', 'stylist', {}, 2)], NOW, US_EASTERN);
    const who = items.flatMap((i) => (i.type === 'msg' && i.showWho ? [i.message.id] : []));
    expect(who).toEqual(['L']);
    for (const c of [
      { cardType: 'account' as const },
      { cardType: 'question' as const, payload: { question: 'notify' } },
      { cardType: 'held' as const, payload: { ready: true } },
    ]) expect(isStylistLine(msg('C', 'stylist', { kind: 'card', ...c }))).toBe(true);
    expect(isStylistLine(msg('C', 'stylist', { kind: 'card', cardType: 'fitCheck' }))).toBe(false);
    expect(isStylistLine(msg('C', 'stylist', { kind: 'card', cardType: 'support' }))).toBe(false);
  });

  it('the failed, paused and refused lines are not answers', () => {
    for (const payload of [{ askRetry: 'Q' }, { askPaused: true }, { askRefused: true, answerTo: 'Q' }]) {
      const items = buildThreadItems([msg('Q', 'user'), msg('S', 'stylist', { payload }, 1)], NOW, US_EASTERN);
      const s = items.find((i) => i.type === 'msg' && i.message.id === 'S');
      expect(s?.type === 'msg' && s.answer).toBe(false);
    }
    const items = buildThreadItems([msg('Q', 'user'), msg('S', 'stylist', { payload: { answerTo: 'Q' } }, 1)], NOW, US_EASTERN);
    expect(items.some((i) => i.type === 'msg' && i.answer)).toBe(true);
  });

  it('the rhythm', () => {
    const me = msg('a', 'user');
    const line = msg('b', 'stylist');
    const card = msg('c', 'stylist', { kind: 'card', cardType: 'outfitIdea' });
    expect(rowGap(me, msg('d', 'user'), false)).toBe(RHYTHM.mine);
    expect(rowGap(line, msg('d', 'stylist'), false)).toBe(RHYTHM.stylistLines);
    expect(rowGap(line, card, false)).toBe(RHYTHM.stylistCards);
    expect(rowGap(me, line, false)).toBe(RHYTHM.reply);
    expect(rowGap(line, me, false)).toBe(RHYTHM.toMine);
    expect(rowGap(line, me, true)).toBe(RHYTHM.belowStamp);
    expect([RHYTHM.mine, RHYTHM.stylistLines, RHYTHM.reply, RHYTHM.toMine, RHYTHM.aboveStamp, RHYTHM.belowStamp]).toEqual([4, 4, 20, 16, 20, 8]);
    expect(liveGap(me)).toBe(RHYTHM.reply);
    // A stamp after a 60-minute gap gets 20 above, the next row 8 below it; the first row nothing.
    const items = buildThreadItems([msg('Q', 'user'), msg('R', 'stylist', {}, 1), msg('Z', 'user', {}, 90)], NOW, US_EASTERN);
    expect(items.map((i) => [i.type, i.gap])).toEqual([['stamp', 0], ['msg', 8], ['msg', 20], ['stamp', 20], ['msg', 8]]);
  });
});

describe('U8 · Past chats: an old outfit idea is read-only', () => {
  it('the thread passes readOnly to the idea card, which then has no Wear this', () => {
    expect(src('features/stylist/MessageView.tsx')).toMatch(/<OutfitIdeaCard outfitId=\{m\.outfitId\} readOnly=\{readOnly\} \/>/);
    const card = src('features/stylist/cards/OutfitIdeaCard.tsx');
    expect(card).toMatch(/\{readOnly \? null : \(/);
    expect(card).toMatch(/accessibilityActions=\{readOnly \? undefined/);
  });
});

describe('U9 · a link card follows merges', () => {
  const p = (id: string, o: Partial<ClosetItemRow> = {}) => ({ id, isDeleted: false, mergedInto: null, ...o }) as ClosetItemRow;
  it('merged → the piece it lives on in; removed → nothing', () => {
    const closet = [p('A', { mergedInto: 'B' }), p('B'), p('C', { isDeleted: true }), p('D', { mergedInto: 'C' })];
    expect(linkedPiece('A', closet)?.id).toBe('B');
    expect(linkedPiece('B', closet)?.id).toBe('B');
    expect(linkedPiece('C', closet)).toBeNull();
    expect(linkedPiece('D', closet)).toBeNull();
    expect(linkedPiece('Z', closet)).toBeNull();
  });
});

describe('U12–U13 · chips and bubbles', () => {
  it('a chip’s hyphen never breaks', () => {
    expect(chipDisplay('light-blue oxford')).toBe('light‑blue oxford');
    expect(chipDisplay('dark jeans')).toBe('dark jeans');
  });
  it('his bubble widens at the accessibility sizes', () => {
    expect([userBubbleMaxWidth(false), userBubbleMaxWidth(true)]).toEqual(['78%', '88%']);
  });
});

describe('U14 · every stylist line is spoken once', () => {
  it('support, refusals, the limit, failed and paused lines', async () => {
    const a = await setup();
    await a.ask.ask("Honestly I don't want to be alive anymore.");
    await a.ask.ask('Rate my face');
    expect(a.posted).toEqual([t('support.text'), t('ask.refuseFace')]);

    const b = await setup({ source: () => scripted([{ type: 'failed', code: 'x' }]) });
    const o = await b.ask.ask(OLIVE);
    if (o.kind === 'sent') await o.done;
    const c = await setup({ source: () => scripted([{ type: 'failed', code: 'paused' }]) });
    const p = await c.ask.ask(OLIVE);
    if (p.kind === 'sent') await p.done;
    expect([b.posted, c.posted]).toEqual([[t('fail.ask')], [t('ask.paused')]]);

    const d = await setup();
    for (let i = 0; i < 5; i++) await d.quota.consumeQuestion();
    await d.ask.ask(OLIVE);
    expect(d.posted).toEqual([t('ask.limit.free')]);
    expect(d.answered).toEqual([]);
  });

  it('an answer is spoken through onAnswered only, queued on the phone', async () => {
    const s = await setup();
    const o = await s.ask.ask(OLIVE);
    if (o.kind === 'sent') await o.done;
    expect([s.answered.length, s.posted.length]).toEqual([1, 0]);
    expect(src('features/ask/session.ts')).toMatch(/announceForAccessibilityWithOptions\(text, \{ queue: true \}\)/);
  });
});

describe('U15 · the waiting row speaks', () => {
  it('"Your stylist is writing", with the slow line once it shows; nothing once done', () => {
    expect(liveRowSpoken({ phase: 'waiting', questionId: 'Q', replaces: null })).toBe(t('ask.a11yWriting'));
    expect(liveRowSpoken({ phase: 'waiting', questionId: 'Q', replaces: null, slow: true })).toBe(`${t('ask.a11yWriting')}. ${t('ask.slow')}`);
    expect(liveRowSpoken({ phase: 'streaming', questionId: 'Q', replaces: null, text: 'Yes, olive' })).toBe(t('ask.a11yWriting'));
    expect(liveRowSpoken({ phase: 'done', questionId: 'Q', replaces: null, text: 'Yes.', messageId: 'M', at: NOW })).toBeNull();
  });
});

describe('U18 · small VoiceOver fixes', () => {
  it('Earlier chats is spoken as shown; stamps are headers; the bar reads his draft', () => {
    // The thread's "Earlier chats" pill is gone (#338); the header's clock button is the way back, with its label.
    expect(src('features/stylist/StylistScreen.tsx')).not.toMatch(/history\.open/);
    expect(src('app/(tabs)/stylist/_layout.tsx')).toMatch(/accessibilityLabel=\{t\('history\.open\.a11y'\)\}/);
    expect(src('design-system/components/Chat.tsx')).toMatch(/accessibilityRole="header"/);
    expect(src('features/stylist/StylistBar.tsx')).toMatch(/accessibilityValue=\{draft \? \{ text: draft \} : undefined\}/);
  });
});

describe('#340: the card greeting line is hidden wherever it is still stored', () => {
  const m = (id: string, at: number, o: Partial<ChatMessage>): ChatMessage =>
    ({ id, createdAt: at, role: 'stylist', kind: 'text', text: 'x', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {}, ...o }) as ChatMessage;
  it('drops the line posted 1 ms before a morning card, and a marked seeded one; keeps other lines', () => {
    const posted = m('g1', 1000, { text: 'Morning. 46° now.' });
    const card = m('c1', 1001, { kind: 'card', cardType: 'morning', text: null, payload: { ideaId: 'x' } });
    const seeded = m('g2', 500, { text: 'Morning. An easy one…', payload: { greeting: true } });
    const answer = m('a1', 900, { text: 'A brown leather belt.' });
    expect(withoutCardGreetings([seeded, answer, posted, card]).map((x) => x.id)).toEqual(['a1', 'c1']);
  });
});

describe('#341: the score card folds to its rating and opens smoothly', () => {
  it('both score cards start folded, open on a tap, and fold back from the handle', () => {
    const check = src('features/stylist/cards/FitCheckCard.tsx');
    const recheck = src('features/stylist/cards/RecheckCard.tsx');
    expect(check).toMatch(/useState\(\(\) => openCards\.has\(id\)\)/);
    for (const s of [check, recheck]) {
      expect(s).toMatch(/<Expandable open=\{open\}/);
      expect(s).toMatch(/<ExpandHandle open=\{open\}/);
      expect(s).toMatch(/name: 'fold'/);
    }
    // The "change not seen" re-check keeps its buttons in view.
    expect(recheck).toMatch(/const open = notSeen \|\| opened;/);
  });

  it('the thread scrolls with the growth (not after it), and Reduce Motion skips the slide', () => {
    expect(src('features/stylist/StylistScreen.tsx')).toMatch(/threadGrow\.value/);
    expect(src('design-system/components/Expandable.tsx')).toMatch(/a11y\.reduceMotion \? 0 : EXPAND_MS/);
  });
});
