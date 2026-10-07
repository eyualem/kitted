// Day keys and the 4 am rollover (rubric config `dayRollsOverAt`), pure arithmetic.
// No Date.now (time comes in as an argument) and no Intl (Hermes on iOS has gaps in Intl time
// zones). A "zone" is a function from a UTC instant to that zone's offset in milliseconds.

import { RUBRIC_DATA } from "./rubricData";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Offset of a time zone from UTC at a UTC instant, in ms (EDT = −4 h). */
export type ZoneOffset = (utcMs: number) => number;

/**
 * America/New_York, from the US rule in force since 2007: EDT (−4 h) from 2 am EST on the
 * second Sunday of March to 2 am EDT on the first Sunday of November, otherwise EST (−5 h).
 */
export const US_EASTERN: ZoneOffset = (utcMs) => {
  const year = new Date(utcMs).getUTCFullYear();
  const nthSunday = (month: number, n: number) => {
    const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    return 1 + ((7 - firstDow) % 7) + 7 * (n - 1);
  };
  const dstStart = Date.UTC(year, 2, nthSunday(2, 2), 2 + 5); // 2:00 EST = 07:00 UTC
  const dstEnd = Date.UTC(year, 10, nthSunday(10, 1), 2 + 4); // 2:00 EDT = 06:00 UTC
  return utcMs >= dstStart && utcMs < dstEnd ? -4 * HOUR : -5 * HOUR;
};

/** A fixed offset (tests, or a device clock that reports one). */
export function fixedZone(offsetMs: number): ZoneOffset {
  return () => offsetMs;
}

export interface LocalParts {
  y: number;
  /** 1–12 */
  m: number;
  d: number;
  hh: number;
  mm: number;
  /** 0 = Sunday … 6 = Saturday */
  dow: number;
}

/** Wall-clock parts of a UTC instant in a zone. */
export function localParts(utcMs: number, off: ZoneOffset): LocalParts {
  const t = new Date(utcMs + off(utcMs));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes(), dow: t.getUTCDay() };
}

/** "04:00" → 240 (minutes after midnight). */
export function parseRollover(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Bad rollover time: ${hhmm}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`Bad rollover time: ${hhmm}`);
  return h * 60 + min;
}

/** The rubric's rollover ("04:00"), from rubric.json → config. */
export const DEFAULT_ROLLOVER: string = typeof RUBRIC_DATA.config["dayRollsOverAt"] === "string" ? (RUBRIC_DATA.config["dayRollsOverAt"] as string) : "04:00";

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

function keyFromUtcDate(t: Date): string {
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/**
 * The usage day an instant belongs to: the local date of (wall time − rollover). 03:59 on
 * Oct 23 belongs to Oct 22; 04:00 starts Oct 23. Works across DST because it reads the wall time.
 */
export function dayKey(utcMs: number, off: ZoneOffset, rollover: string = DEFAULT_ROLLOVER): string {
  const wall = utcMs + off(utcMs);
  return keyFromUtcDate(new Date(wall - parseRollover(rollover) * MIN));
}

/** "2026-10-22" → epoch ms of that date at 00:00 UTC (a calendar handle, not an instant). */
function keyToUtc(key: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`Bad day key: ${key}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Calendar arithmetic on day keys. */
export function addDays(key: string, n: number): string {
  return keyFromUtcDate(new Date(keyToUtc(key) + n * DAY));
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: string): number {
  return new Date(keyToUtc(key)).getUTCDay();
}

/** Whole days from `a` to `b` (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((keyToUtc(b) - keyToUtc(a)) / DAY);
}

/** The UTC instant of a wall-clock time in a zone (two passes settle the offset across DST). */
export function wallToUtc(wallMs: number, off: ZoneOffset): number {
  let utc = wallMs - off(wallMs);
  utc = wallMs - off(utc);
  return utc;
}

/**
 * The next rollover strictly after `utcMs`: the start of the next usage day. From
 * Oct 31 23:00 EDT this is Nov 1 04:00 EST (09:00Z), 6 h later on the clock but 5 h on the wall.
 */
export function nextRolloverMs(utcMs: number, off: ZoneOffset, rollover: string = DEFAULT_ROLLOVER): number {
  const next = addDays(dayKey(utcMs, off, rollover), 1);
  return wallToUtc(keyToUtc(next) + parseRollover(rollover) * MIN, off);
}
