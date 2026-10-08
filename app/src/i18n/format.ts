// Dates and times without Intl (Hermes on iOS lacks parts of it). Wall time comes from the
// clock's zone (America/New_York in the demo).
import { localParts, type ZoneOffset } from '@kitted/core';
import { t } from './en';

const list = (key: 'fmt.weekdays' | 'fmt.months' | 'fmt.monthsLong') => t(key).split(',');

export function weekdayName(dow: number): string {
  return list('fmt.weekdays')[dow] ?? '';
}

/** "7:42" (12-hour, no am/pm): the photo caption and the share card. */
export function clockTime(utcMs: number, zone: ZoneOffset): string {
  const p = localParts(utcMs, zone);
  const h = p.hh % 12 === 0 ? 12 : p.hh % 12;
  return `${h}:${p.mm < 10 ? `0${p.mm}` : p.mm}`;
}

/** Day stamp (02 D12): "Thursday 8:00 am" within 6 days of now, else "Oct 14, 8:00 am". */
export function stampText(utcMs: number, nowMs: number, zone: ZoneOffset): string {
  const p = localParts(utcMs, zone);
  const time = clockTime(utcMs, zone);
  const ampm = p.hh < 12 ? t('fmt.am') : t('fmt.pm');
  const recent = nowMs - utcMs < 6 * 24 * 3_600_000;
  return recent
    ? t('fmt.stampRecent', { weekday: weekdayName(p.dow), time, ampm })
    : t('fmt.stampOlder', { month: list('fmt.months')[p.m - 1] ?? '', day: p.d, time, ampm });
}

/** "October 22" (the photo viewer's caption, 02 S13). */
export function longDate(utcMs: number, zone: ZoneOffset): string {
  const p = localParts(utcMs, zone);
  return t('fmt.longDate', { month: list('fmt.monthsLong')[p.m - 1] ?? '', day: p.d });
}

/** "+0.5", "−0.5" (U+2212), "+0" / "±0" for zero. Trailing zeros dropped (0.75, 0.6). */
export function signed(n: number, zero: '+0' | '±0' = '+0'): string {
  if (Math.abs(n) < 1e-9) return zero;
  const abs = Math.round(Math.abs(n) * 100) / 100;
  return `${n > 0 ? '+' : '−'}${abs}`;
}

/** "5 pm" (a local hour 0–23; the weather lines). */
export function hourText(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  return `${hh % 12 === 0 ? 12 : hh % 12} ${hh < 12 ? t('fmt.am') : t('fmt.pm')}`;
}

/** "October" (1–12). */
export function monthName(m: number): string {
  return list('fmt.monthsLong')[m - 1] ?? '';
}
