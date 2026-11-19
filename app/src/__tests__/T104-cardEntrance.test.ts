// The card's own beat (the founder approved Nov 18, log #510): the card under a just-finished answer fades in while
// rising 12 pt, 120 ms after the words, then the follow-up taps fade in 50 ms apart. Once per new answer, never in
// Past chats or when the row is drawn again, and fades only under Reduce Motion.
// jest hoists the mocks below above these imports.
import { ARRIVE, ARRIVE_CARD, createArrivals } from '@/features/stylist/arrival';
import { cardEntering, tapEntering } from '@/features/stylist/arrivalMotion';
import { attachmentEnters, Enter } from '@/features/stylist/Enter';
import { render } from '@testing-library/react-native';
import { createElement, useEffect } from 'react';

jest.mock('react-native-reanimated', () => {
  const chain = (calls: string[]) => {
    const o: Record<string, unknown> = { calls };
    for (const k of ['duration', 'delay', 'reduceMotion']) o[k] = (v: unknown) => chain([...calls, `${k}:${String(v)}`]);
    return o;
  };
  const { View } = jest.requireActual('react-native');
  const seen: unknown[] = [];
  const AnimatedView = (props: { entering?: unknown; children?: unknown }) => {
    seen.push(props.entering);
    return jest.requireActual('react').createElement(View, null, props.children);
  };
  return {
    __esModule: true,
    default: { View: AnimatedView },
    __seen: seen,
    Easing: { out: (f: unknown) => f, cubic: 'cubic' },
    FadeIn: chain(['fadeIn']),
    ReduceMotion: { Never: 'never' },
    withDelay: (d: number, a: unknown) => ({ delay: d, a }),
    withTiming: (to: number, o: { duration: number }) => ({ to, duration: o.duration }),
  };
});


jest.mock('@/design-system', () => ({ useTheme: () => ({ a11y: { reduceMotion: false } }) }));

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const kit = (id: string, createdAt: number) => ({ id, role: 'stylist' as const, createdAt });
const him = (id: string, createdAt: number) => ({ id, role: 'user' as const, createdAt });

describe('the card enters once per new answer', () => {
  it('the answer that just streamed in: its card enters, its words stay still', () => {
    const a = createArrivals();
    a.plan([him('q', 150), kit('answer-1', 400)], 100, ['answer-1']);
    expect(a.delayOf('answer-1')).toBeNull();
    expect(a.cardEnters('answer-1')).toBe(true);
  });
  it('once drawn, never again: a re-render, a remount or scrolling back draws it still', () => {
    const a = createArrivals();
    a.plan([kit('answer-1', 400)], 100, ['answer-1']);
    a.drawn(['answer-1']);
    expect(a.cardEnters('answer-1')).toBe(false);
    a.plan([kit('answer-1', 400)], 100, ['answer-1']);
    expect(a.cardEnters('answer-1')).toBe(false);
  });
  it('a row that moved in whole, or one he already saw, has no separate card entrance', () => {
    const a = createArrivals();
    a.plan([kit('unseen', 200), kit('old', 50)], 100);
    expect(a.delayOf('unseen')).toBe(0);
    expect(a.cardEnters('unseen')).toBe(false);
    expect(a.cardEnters('old')).toBe(false);
  });
  it('the next answer gets its own beat; the earlier one stays still', () => {
    const a = createArrivals();
    a.plan([kit('a1', 400)], 100, ['a1']);
    a.drawn(['a1']);
    a.plan([kit('a1', 400), kit('a2', 900)], 100, ['a2']);
    expect([a.cardEnters('a1'), a.cardEnters('a2')]).toEqual([false, true]);
  });
});

describe('never in Past chats', () => {
  it('a read-only row never enters, even if asked to', () => {
    expect(attachmentEnters(true, true)).toBe(false);
    expect(attachmentEnters(true, false)).toBe(true);
    expect(attachmentEnters(undefined, false)).toBe(false);
  });
  it('Past chats never pass an entrance to its rows', () => {
    const src = readFileSync(join(__dirname, '..', 'features/stylist/PastChats.tsx'), 'utf8');
    expect(src).not.toMatch(/\benter=/);
    expect(src).not.toMatch(/cardEnters/);
  });
});

type Worklet = () => { initialValues: { opacity: number; transform: { translateY: number }[] }; animations: { opacity: { delay: number; a: { duration: number } } } };

describe('the look', () => {
  it('rises 12 pt over 280 ms, 120 ms after the words (4 pt more than a message)', () => {
    const w = (cardEntering(false) as unknown as Worklet)();
    expect(w.initialValues).toEqual({ opacity: 0, transform: [{ translateY: 12 }] });
    expect(w.animations.opacity.delay).toBe(120);
    expect(w.animations.opacity.a.duration).toBe(280);
    expect(ARRIVE_CARD.risePt - ARRIVE.risePt).toBe(4);
  });
  it('Reduce Motion: a fade only, no rise', () => {
    const e = cardEntering(true) as unknown as { calls: string[] };
    expect(e.calls).toEqual(['fadeIn', 'duration:200', 'delay:120', 'reduceMotion:never']);
    expect(typeof e).toBe('object');
  });
  it('the taps fade in last, 50 ms apart, after the card has settled', () => {
    const delays = [0, 1, 2].map((i) => (tapEntering(i, false) as unknown as { calls: string[] }).calls.find((c) => c.startsWith('delay:')));
    expect(delays).toEqual(['delay:400', 'delay:450', 'delay:500']);
    expect((tapEntering(0, true) as unknown as { calls: string[] }).calls).toContain('delay:320');
    expect((tapEntering(0, true) as unknown as { calls: string[] }).calls[0]).toBe('fadeIn');
  });
});

describe('a re-render never cuts the entrance short (review, round 2)', () => {
  it('the wrapper stays the same and the card is not mounted again when the row stops entering', async () => {
    let mounts = 0;
    const Card = () => {
      useEffect(() => {
        mounts += 1;
      }, []);
      return null;
    };
    const seen = jest.requireMock<{ __seen: unknown[] }>('react-native-reanimated').__seen;
    seen.length = 0;
    const r = await render(createElement(Enter, { on: true }, createElement(Card)));
    await r.rerender(createElement(Enter, { on: false }, createElement(Card)));
    expect(mounts).toBe(1);
    expect(seen).toHaveLength(2);
    expect(seen[1]).toBe(seen[0]);
    expect(seen[0]).toBeDefined();
  });
});
