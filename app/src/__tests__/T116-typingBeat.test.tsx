// T116 · Kit types before it speaks (specs/setup-and-you.md SY2.12–SY2.18; the founder's yes Nov 18). The rules
// (arrival.ts) and the hook's timing (useTypingBeat), with fake timers. Words are not tested here: nothing about them changed.
//
// Profile (CLAUDE.md rule 6): no photo is scored; the rows are the setup's end of the stated draft profile, born 2005
// (18–21), minimalist, and the moves line after a first check.
import { act, cleanup, renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';
import { textMessage } from '@/data/seedLoader';
import type { ChatMessage } from '@/data/types';
import { arrivals, beatKindOf, BEAT, createArrivals } from '@/features/stylist/arrival';
import { useTypingBeat } from '@/features/stylist/useTypingBeat';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Soft: 'soft', Rigid: 'rigid' },
}));

type Result = ReturnType<typeof useTypingBeat>;
const SEEN = 1_000;
const hello = (at = 2_000): ChatMessage => textMessage('hello', at, 'stylist', null, { aiNote: true });
const offer = (at = 2_001): ChatMessage => ({ ...textMessage('offer', at, 'stylist', null), kind: 'card', cardType: 'firstCheckOffer' });
const intro = (at = 3_000): ChatMessage => textMessage('intro', at, 'stylist', 'x', { beat: 'moves' });
const plan = (at = 3_001): ChatMessage => ({ ...textMessage('plan', at, 'stylist', null), kind: 'card', cardType: 'plan' });
const answer = (at = 2_500): ChatMessage => textMessage('ans', at, 'stylist', 'Wear the grey tee.');
const morning = (at = 2_002): ChatMessage => ({ ...textMessage('morning', at, 'stylist', null), kind: 'card', cardType: 'morning' });

beforeEach(() => {
  jest.useFakeTimers();
  arrivals.reset();
  jest.mocked(Haptics.impactAsync).mockClear();
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('which lines get a typing beat (SY2.15)', () => {
  it('the hello and the moves line only; normal answers and the morning card never', async () => {
    expect(beatKindOf(hello())).toBe('hello');
    expect(beatKindOf(intro())).toBe('moves');
    expect(beatKindOf(answer())).toBeNull();
    expect(beatKindOf(morning())).toBeNull();
  });

  it('finds the hello with its offer card, and ignores a morning card posted beside it', async () => {
    const a = createArrivals();
    expect(a.findBeat([hello(), offer(), morning()], SEEN)).toEqual({ kind: 'hello', leadId: 'hello', followerIds: ['offer'] });
  });

  it('a hello he already saw (an install from before, reopening the app) has no beat (SY2.14)', async () => {
    const a = createArrivals();
    expect(a.findBeat([hello(500), offer(501)], SEEN)).toBeNull();
  });

  it('a beat never starts twice for one line, and not once the line is decided (SY2.14)', async () => {
    const a = createArrivals();
    const b = a.findBeat([hello(), offer()], SEEN)!;
    a.beatBegan(b.leadId);
    expect(a.findBeat([hello(), offer()], SEEN)).toBeNull();
    const c = createArrivals();
    c.plan([hello()], SEEN);
    expect(c.findBeat([hello()], SEEN)).toBeNull();
  });
});

describe('the timing (SY2.12, SY2.13)', () => {
  it('after setup: dots, then the hello at 0.9 s, then the offer card 0.6 s later with one soft tap', async () => {
    const rows = [hello(), offer()];
    const { result } = await renderHook(() => useTypingBeat(rows, SEEN, true));
    expect(result.current.typing).toBe(true);
    expect([...result.current.held].sort()).toEqual(['hello', 'offer']);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith('Kit is writing');
    await act(async () => { jest.advanceTimersByTime(BEAT.typingMs - 1); });
    expect(result.current.typing).toBe(true);
    await act(async () => { jest.advanceTimersByTime(1); });
    expect(result.current.typing).toBe(false);
    expect([...result.current.held]).toEqual(['offer']);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith("I'm Kit, your stylist.");
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(BEAT.cardGapMs); });
    expect(result.current.held.size).toBe(0);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('soft');
  });

  it('after his first score: the same dots and pause, no tap', async () => {
    const rows = [intro(), plan()];
    const { result } = await renderHook(() => useTypingBeat(rows, SEEN, true));
    expect(result.current.typing).toBe(true);
    await act(async () => { jest.advanceTimersByTime(BEAT.typingMs + BEAT.cardGapMs); });
    expect(result.current.held.size).toBe(0);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('waits for the thread to be in front of him: no dots and no timers before then', async () => {
    const rows = [hello(), offer()];
    const { result, rerender } = await renderHook<Result, { f: boolean }>(({ f }) => useTypingBeat(rows, SEEN, f), { initialProps: { f: false } });
    expect(result.current.typing).toBe(false);
    await act(async () => { jest.advanceTimersByTime(5_000); });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    await rerender({ f: true });
    expect(result.current.typing).toBe(true);
  });
});

describe('once, and never on anything else (SY2.14, SY2.15)', () => {
  it('plays once: a remount, a re-render or a later render with the same rows shows no dots', async () => {
    const rows = [hello(), offer()];
    const first = await renderHook(() => useTypingBeat(rows, SEEN, true));
    await act(async () => { jest.advanceTimersByTime(BEAT.typingMs + BEAT.cardGapMs); });
    expect(first.result.current.typing).toBe(false);
    await first.rerender({});
    expect(first.result.current.typing).toBe(false);
    await first.unmount();
    const again = await renderHook(() => useTypingBeat(rows, SEEN, true));
    expect(again.result.current.typing).toBe(false);
    expect(again.result.current.held.size).toBe(0);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('a normal answer or the morning card alone: nothing held, no tap', async () => {
    const { result } = await renderHook(() => useTypingBeat([answer(), morning()], SEEN, true));
    expect(result.current.typing).toBe(false);
    expect(result.current.held.size).toBe(0);
    await act(async () => { jest.advanceTimersByTime(5_000); });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('the second moment plays on its own after the first has finished', async () => {
    const { result, rerender } = await renderHook<Result, { rows: ChatMessage[] }>(({ rows }) => useTypingBeat(rows, SEEN, true), { initialProps: { rows: [hello(), offer()] } });
    await act(async () => { jest.advanceTimersByTime(BEAT.typingMs + BEAT.cardGapMs); });
    await rerender({ rows: [hello(), offer(), intro(), plan()] });
    expect(result.current.typing).toBe(true);
    expect([...result.current.held].sort()).toEqual(['intro', 'plan']);
  });
});

describe('a card written a moment after the lead line (review round)', () => {
  it('is held too: it never shows during the dots above the line', async () => {
    const { result, rerender } = await renderHook<Result, { rows: ChatMessage[] }>(({ rows }) => useTypingBeat(rows, SEEN, true), { initialProps: { rows: [intro()] } });
    expect([...result.current.held]).toEqual(['intro']);
    await rerender({ rows: [intro(), plan()] });
    expect([...result.current.held].sort()).toEqual(['intro', 'plan']);
    await act(async () => { jest.advanceTimersByTime(BEAT.typingMs); });
    expect([...result.current.held]).toEqual(['plan']);
  });
});
