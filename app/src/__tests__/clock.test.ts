import { demoClock, fixedClock, newYorkOffsetMs, parseZonedIso } from '@/services/clock';

describe('clock', () => {
  it('reads a wall time without offset in America/New_York (EDT in October)', () => {
    expect(parseZonedIso('2026-10-22T07:38:00')).toBe(Date.parse('2026-10-22T07:38:00-04:00'));
  });

  it('switches to EST after the Nov 1 DST change', () => {
    expect(parseZonedIso('2026-11-01T12:00:00')).toBe(Date.parse('2026-11-01T12:00:00-05:00'));
    expect(parseZonedIso('2026-10-31T23:30:00')).toBe(Date.parse('2026-10-31T23:30:00-04:00'));
  });

  it('keeps an explicit offset', () => {
    expect(parseZonedIso('2026-10-22T12:20:00-04:00')).toBe(Date.parse('2026-10-22T16:20:00Z'));
  });

  it('rejects junk', () => {
    expect(parseZonedIso('soon')).toBeNull();
  });

  it('demo clock starts at the scenario time and ticks with the real clock', () => {
    let real = 1_000_000;
    const base = { nowMs: () => real, now: () => new Date(real) };
    const start = Date.parse('2026-10-22T11:38:00Z');
    const c = demoClock(start, base);
    expect(c.nowMs()).toBe(start);
    real += 90_000;
    expect(c.nowMs()).toBe(start + 90_000);
    expect(fixedClock(5).now().getTime()).toBe(5);
  });
});

describe('newYorkOffsetMs (the US rule, no Intl)', () => {
  const H = 3_600_000;
  it('matches Intl for every hour around both 2026 changes and a few other years', () => {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' });
    const intlOffset = (ms: number) => {
      const name = fmt.formatToParts(new Date(ms)).find((p) => p.type === 'timeZoneName')?.value ?? '';
      return Number(/GMT([+-]\d+)/.exec(name)?.[1] ?? 0) * H;
    };
    const starts = ['2026-03-07T00:00:00Z', '2026-10-30T00:00:00Z', '2027-03-13T00:00:00Z', '2030-11-02T00:00:00Z'];
    for (const s of starts) {
      for (let h = 0; h < 72; h++) {
        const ms = Date.parse(s) + h * H;
        expect(newYorkOffsetMs(ms)).toBe(intlOffset(ms));
      }
    }
  });
});
