// The morning card's words, from templates (02 "S1d"): the why line, the weather strip and the
// spoken summary. Pure, so they're tested without rendering.
import type { DayWeather, IdeaReason, MissingSlot } from '@kitted/core';
import type { CardOccasion, ClosetItemRow, StyleKey } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import { hourText } from '@/i18n/format';
import { occasionLabel } from '@/features/stylist/thread';

export function cardOccasionLabel(o: CardOccasion): string {
  return o === 'staying_in' ? t('occasion.stayingIn') : occasionLabel(o);
}

export function styleLabel(s: StyleKey | null): string {
  return s ? t(`style.${s}` as StringKey) : t('style.none');
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Up to two sentences naming the weather reason (#58), e.g. "Navy overshirt for the cold start; it comes off by afternoon." */
export function whyLine(reasons: readonly IdeaReason[], items: readonly ClosetItemRow[], occasion: CardOccasion): string {
  const name = (id?: string) => items.find((i) => i.id === id)?.name ?? '';
  return reasons
    .map((r) => {
      switch (r.key) {
        case 'layerOff':
          return t('why.idea.layerOff', { layer: upper(name(r.itemId)) });
        case 'layerWarm':
          return t('why.idea.layerWarm', { layer: upper(name(r.itemId)) });
        case 'layerLate':
          return t('why.idea.layerLate', { layer: lower(name(r.itemId)) });
        case 'wetShoes':
          return t('why.idea.wetShoes', { shoes: upper(name(r.itemId)) });
        case 'hotLight':
          return t('why.idea.hotLight');
        case 'needLayer':
          return t('why.idea.needLayer');
        case 'needCoat':
          return t('why.idea.needCoat');
        default:
          return t('why.idea.occasion', { occasion: t(`idea.for.${occasion}` as StringKey) });
      }
    })
    .join(' ');
}

export function missingLabel(m: MissingSlot): string {
  return t(`idea.need.${m}` as StringKey);
}

/** SF Symbol for the strip. */
export function weatherSymbol(w: DayWeather): string {
  if (w.condition === 'rain' || (w.precipChance >= 0.5 && w.condition !== 'snow')) return 'cloud.rain';
  if (w.condition === 'snow') return 'cloud.snow';
  if (w.condition === 'fog') return 'cloud.fog';
  if (w.condition === 'wind') return 'wind';
  if (w.condition === 'cloudy') return 'cloud';
  return w.window === 'evening' ? 'moon.stars' : 'sun.max';
}

export function stripLines(w: DayWeather, nowHour: number): { main: string; rain: string } {
  const main = w.window === 'evening'
    ? t('wx.strip.evening', { now: Math.round(w.nowF), late: Math.round(w.lateF ?? w.lowF) })
    : t('wx.strip.day', { now: Math.round(w.nowF), high: Math.round(w.highF) });
  const rain = w.precipChance >= 0.5
    ? w.precipFromHour !== null && w.precipFromHour > nowHour ? t('wx.strip.rainFrom', { time: hourText(w.precipFromHour) }) : t('wx.strip.rainAll')
    : w.window === 'evening' ? t('wx.strip.dryNight') : t('wx.strip.dry');
  return { main, rain };
}
