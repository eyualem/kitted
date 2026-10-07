// Clock (05 §3.2): features never call `new Date()` or `Date.now()` directly.
// The demo clock starts at the scenario's `now` (America/New_York) and then ticks forward
// with real elapsed time; App Store builds use the system clock.

export const APP_TIME_ZONE = 'America/New_York';

export interface Clock {
  /** Milliseconds since the epoch. */
  nowMs(): number;
  now(): Date;
}

export const systemClock: Clock = {
  nowMs: () => Date.now(),
  now: () => new Date(),
};

/** Offset of `timeZone` from UTC at the instant `utcMs`, in ms (e.g. −4 h for EDT). */
export function tzOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(
    parts.year ?? 1970,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;

/**
 * Parses an ISO time. With an offset or Z it is absolute; without one it is a wall-clock time
 * in `timeZone` (05 §5.2: "read in America/New_York when no offset"). Returns null if invalid.
 */
export function parseZonedIso(iso: string, timeZone: string = APP_TIME_ZONE): number | null {
  const m = LOCAL.exec(iso);
  if (!m) {
    const t = Date.parse(iso);
    return Number.isNaN(t) ? null : t;
  }
  const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  // Two passes settle the offset across a DST change.
  let utc = wall - tzOffsetMs(wall, timeZone);
  utc = wall - tzOffsetMs(utc, timeZone);
  return utc;
}

/** A clock that reads `startMs` now and ticks forward with the real clock. */
export function demoClock(startMs: number, real: Clock = systemClock): Clock {
  const base = real.nowMs();
  return {
    nowMs: () => startMs + (real.nowMs() - base),
    now: () => new Date(startMs + (real.nowMs() - base)),
  };
}

/** A clock frozen at `ms` (tests, screenshots). */
export function fixedClock(ms: number): Clock {
  return { nowMs: () => ms, now: () => new Date(ms) };
}
