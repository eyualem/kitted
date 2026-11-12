// Kit's messages fade and rise in (founder, Nov 12): only Kit's, only unseen, once per launch.
import { ARRIVE, createArrivals, parseSeenUntil } from '@/features/stylist/arrival';

const kit = (id: string, createdAt: number) => ({ id, role: 'stylist' as const, createdAt });
const him = (id: string, createdAt: number) => ({ id, role: 'user' as const, createdAt });

describe('which rows move in', () => {
  it('moves Kit’s message made after he last saw the thread', () => {
    const a = createArrivals();
    a.plan([kit('k1', 200)], 100);
    expect(a.delayOf('k1')).toBe(0);
  });

  it('leaves what he already saw: reopening the app shows old messages still', () => {
    const a = createArrivals();
    a.plan([kit('old', 50), kit('edge', 100)], 100);
    expect(a.delayOf('old')).toBeNull();
    expect(a.delayOf('edge')).toBeNull();
  });

  it('never moves his own messages or photos, even brand new ones', () => {
    const a = createArrivals();
    a.plan([him('u1', 500), { ...him('u2', 501) }], 100);
    expect(a.delayOf('u1')).toBeNull();
    expect(a.delayOf('u2')).toBeNull();
  });

  it('staggers several landing together from the oldest, 100 ms apart', () => {
    const a = createArrivals();
    a.plan([kit('b', 300), kit('a', 200), him('u', 250), kit('c', 400)], 100);
    expect([a.delayOf('a'), a.delayOf('b'), a.delayOf('c')]).toEqual([0, 100, 200]);
  });

  it('caps the stagger so a long backlog does not wait', () => {
    const a = createArrivals();
    const rows = Array.from({ length: 10 }, (_, i) => kit(`k${i}`, 200 + i));
    a.plan(rows, 100);
    expect(a.delayOf('k9')).toBe(ARRIVE.maxSteps * ARRIVE.staggerMs);
  });
});

describe('once per launch', () => {
  it('answers the same on every later draw, even if "seen until" moves past it', () => {
    const a = createArrivals();
    a.plan([kit('k1', 200)], 100);
    a.plan([kit('k1', 200)], 1_000);
    expect(a.delayOf('k1')).toBe(0);
  });

  it('a row first drawn as seen never moves later', () => {
    const a = createArrivals();
    a.plan([kit('old', 50)], 100);
    a.plan([kit('old', 50)], 0);
    expect(a.delayOf('old')).toBeNull();
  });

  it('only the new row moves when one more lands; the others keep their answers', () => {
    const a = createArrivals();
    a.plan([kit('k1', 200)], 100);
    a.plan([kit('k1', 200), kit('k2', 300)], 100);
    expect(a.delayOf('k1')).toBe(0);
    expect(a.delayOf('k2')).toBe(0); // its own batch of one, not staggered behind k1
  });

  it('the finished answer replacing the live row does not move a second time', () => {
    const a = createArrivals();
    // The live answer is on screen and says which stored row will replace it.
    a.plan([him('q', 150)], 100, ['answer-1']);
    a.plan([him('q', 150), kit('answer-1', 400)], 100, ['answer-1']);
    expect(a.delayOf('answer-1')).toBeNull();
  });

  it('a row decided in an earlier screen is still decided when the screen mounts again', () => {
    const a = createArrivals();
    a.plan([kit('k1', 200)], 100);
    // Back on the tab: "seen until" was saved when he left, after k1 landed.
    a.plan([kit('k1', 200)], 900);
    expect(a.delayOf('k1')).toBe(0);
    a.plan([kit('k0', 50)], 900);
    expect(a.delayOf('k0')).toBeNull();
  });

  it('reset forgets everything (a wipe)', () => {
    const a = createArrivals();
    a.plan([kit('k1', 200)], 100);
    a.reset();
    expect(a.delayOf('k1')).toBeNull();
  });
});

describe('the saved "seen until"', () => {
  it('reads a time', () => expect(parseSeenUntil('1700000000000')).toBe(1700000000000));
  it('reads nothing as never saved', () => {
    expect(parseSeenUntil(null)).toBeNull();
    expect(parseSeenUntil(undefined)).toBeNull();
    expect(parseSeenUntil('')).toBeNull();
    expect(parseSeenUntil('soon')).toBeNull();
  });
});
