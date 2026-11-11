import { SPLASH_FLOOR_MS, splashHoldLeft } from '@/state/splashHold';

describe('splashHoldLeft (the launch screen holds at most a short floor, never longer)', () => {
  it('holds the rest of the floor when boot finishes early', () => {
    expect(splashHoldLeft(1000, 1100)).toBe(SPLASH_FLOOR_MS - 100);
  });
  it('holds the whole floor when boot finishes at once', () => {
    expect(splashHoldLeft(1000, 1000)).toBe(SPLASH_FLOOR_MS);
  });
  it('adds nothing when boot already took longer than the floor', () => {
    expect(splashHoldLeft(1000, 1000 + SPLASH_FLOOR_MS)).toBe(0);
    expect(splashHoldLeft(1000, 5000)).toBe(0);
  });
  it('never holds longer than the floor, even if the clock moves back', () => {
    expect(splashHoldLeft(1000, 200)).toBe(SPLASH_FLOOR_MS);
  });
  it('stays at or under half a second with the default floor', () => {
    expect(SPLASH_FLOOR_MS).toBeLessThanOrEqual(500);
  });
});
