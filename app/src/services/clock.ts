// Clock (05 §3.2): features never call `new Date()` or `Date.now()` directly.
// The demo clock starts at the scenario's `now` (America/New_York) and then ticks forward
// with real elapsed time; App Store builds use the system clock.

import { US_EASTERN, type ZoneOffset } from '@kitted/core';

export const APP_TIME_ZONE = 'America/New_York';

export interface Clock {
  /** Milliseconds since the epoch. */
  nowMs(): number;
  now(): Date;
  /** The local time zone's offset from UTC at an instant (for day keys and wall times). */
  offset: ZoneOffset;
}

/** The device's own zone (Date's local offset works on Hermes). */
const deviceZone: ZoneOffset = (utcMs) => -new Date(utcMs).getTimezoneOffset() * 60_000;

export const systemClock: Clock = {
  nowMs: () => Date.now(),
  now: () => new Date(),
  offset: deviceZone,
};

/** America/New_York's offset at `utcMs` (the US DST rule; lives in @kitted/core, no Intl). */
export const newYorkOffsetMs: ZoneOffset = US_EASTERN;

/** Offset of `timeZone` from UTC at the instant `utcMs`, in ms (e.g. −4 h for EDT). */
export function tzOffsetMs(utcMs: number, timeZone: string): number {
  if (timeZone === APP_TIME_ZONE) return newYorkOffsetMs(utcMs);
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
export function demoClock(startMs: number, real: Pick<Clock, 'nowMs'> = systemClock, offset: ZoneOffset = US_EASTERN): Clock {
  const base = real.nowMs();
  return {
    nowMs: () => startMs + (real.nowMs() - base),
    now: () => new Date(startMs + (real.nowMs() - base)),
    offset,
  };
}

/** A clock frozen at `ms` (tests, screenshots). Demo zone by default. */
export function fixedClock(ms: number, offset: ZoneOffset = US_EASTERN): Clock {
  return { nowMs: () => ms, now: () => new Date(ms), offset };
}

/** A clock whose time can be moved by tests (`advance`), in sync with fake timers. */
export function manualClock(startMs: number, offset: ZoneOffset = US_EASTERN): Clock & { advance(ms: number): void; set(ms: number): void } {
  let t = startMs;
  return {
    nowMs: () => t,
    now: () => new Date(t),
    offset,
    advance(ms) {
      t += ms;
    },
    set(ms) {
      t = ms;
    },
  };
}
