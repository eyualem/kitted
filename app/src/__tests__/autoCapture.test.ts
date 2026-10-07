import { createAutoCapture, type Phase } from '@/features/camera/autoCapture';

function setup() {
  jest.useFakeTimers();
  const phases: string[] = [];
  let captured = 0;
  const ac = createAutoCapture({
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    onPhase: (p: Phase) => phases.push(p.kind === 'counting' ? String(p.n) : p.kind),
    onCapture: () => (captured += 1),
  });
  return { ac, phases, captured: () => captured };
}

afterEach(() => jest.useRealTimers());

describe('auto-capture (ruling 14)', () => {
  it('good for 0.5 s → 3, 2, 1 → capture', () => {
    const { ac, phases, captured } = setup();
    ac.feed(true);
    jest.advanceTimersByTime(499);
    expect(phases).toEqual([]);
    ac.feed(true); // repeated good frames don't restart the steady timer
    jest.advanceTimersByTime(1);
    jest.advanceTimersByTime(3000);
    expect([phases, captured()]).toEqual([['3', '2', '1', 'done'], 1]);
  });

  it('a wobble before 0.5 s restarts the wait; stepping out mid-count cancels it', () => {
    const { ac, phases, captured } = setup();
    ac.feed(true);
    jest.advanceTimersByTime(300);
    ac.feed(false);
    jest.advanceTimersByTime(300);
    expect(phases).toEqual([]);
    ac.feed(true);
    jest.advanceTimersByTime(500 + 1000);
    ac.feed(false);
    jest.advanceTimersByTime(5000);
    expect([phases, captured()]).toEqual([['3', '2', 'waiting'], 0]);
  });

  it('Mirror timer: startCount runs the 3-2-1 without the guide', () => {
    const { ac, phases, captured } = setup();
    ac.startCount();
    jest.advanceTimersByTime(3000);
    expect([phases, captured()]).toEqual([['3', '2', '1', 'done'], 1]);
  });
});
