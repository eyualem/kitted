// The morning card's words, from templates (02 "S1d"): the why line, the weather strip and the
// spoken summary. Pure, so they're tested without rendering.
import { seasonNeeds, type DayWeather, type IdeaReason, type MissingSlot } from '@kitted/core';
import { normStyleKey, type CardOccasion, type ClosetItemRow, type OutfitRow, type StyleKey } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import { hourText, monthName } from '@/i18n/format';
import { occasionLabel } from '@/features/stylist/thread';

export function cardOccasionLabel(o: CardOccasion): string {
  return o === 'staying_in' ? t('occasion.stayingIn') : occasionLabel(o);
}

export function styleLabel(s: StyleKey | null): string {
  const k = normStyleKey(s);
  return k ? t(`style.${k}` as StringKey) : t('style.none');
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

/** The card's headline (#70): the first weather reason, else the occasion. */
export function ideaTitle(reasons: readonly IdeaReason[], occasion: CardOccasion): string {
  const first = reasons[0]?.key;
  if (first && first !== 'occasion') return t(`idea.title.${first}` as StringKey);
  return occasion === 'staying_in' ? t('idea.title.everyday') : t(`idea.title.${occasion}` as StringKey);
}

/** The glance badge: "46°→63°" by day, "52°→47°" in the evening (now → later). */
export function badgeTemps(w: DayWeather): { now: number; later: number } {
  return { now: Math.round(w.nowF), later: Math.round(w.window === 'evening' ? w.lateF ?? w.lowF : w.highF) };
}

/** What the card stores with its weather (#338): the hours the readings are for (live weather only) and when it was
 *  fetched, so the words follow the clock and a stale forecast is fetched again. */
export type CardWeather = DayWeather & { nowHour?: number; highHour?: number; lateHour?: number; fetchedAt?: number };

/** A high this much above now is worth saying. */
const HIGH_SAYS_F = 3;

/**
 * The card's one weather line, for the hour he reads it (#338): "46° now · 63° by 2 pm · rain after 5 pm" by day,
 * "52° at 8 pm · 47° by midnight · rain likely" before 8 pm, "50° now · 47° by midnight" after it, "45° now" after
 * midnight. A time that has passed is never said ("by 2 pm" at 3 pm, "rain after 5 pm" at 6).
 */
export function weatherLine(w: CardWeather, hourNow: number): string {
  // "5 pm" never splits across lines.
  const at = (h: number) => hourText(h).replace(' ', '\u00A0');
  const parts: string[] = [];
  const now = Math.round(w.nowF);
  const rainAt = w.precipFromHour;
  if (w.window === 'evening') {
    const afterMidnight = hourNow < 4;
    const readAt = w.nowHour ?? 20;
    parts.push(!afterMidnight && hourNow < readAt ? t('wx.card.at', { t: now, time: at(readAt) }) : t('wx.card.now', { t: now }));
    if (!afterMidnight) parts.push(t('wx.card.byMidnight', { t: Math.round(w.lateF ?? w.lowF) }));
    if (w.precipChance >= 0.5) {
      // Rain hours after midnight come as 0–3; the evening's own as 18–23.
      const rainLater = rainAt !== null && (afterMidnight ? rainAt > hourNow && rainAt < 4 : rainAt > hourNow || rainAt < 4);
      parts.push(rainLater ? t('wx.card.rainFrom', { time: at(rainAt) }) : t('wx.card.rainLikely'));
    }
  } else {
    parts.push(t('wx.card.now', { t: now }));
    const high = Math.round(w.highF);
    if (high - now >= HIGH_SAYS_F) {
      if (w.highHour === undefined) parts.push(t('wx.card.high', { t: high }));
      else if (w.highHour > hourNow) parts.push(t('wx.card.by', { t: high, time: at(w.highHour) }));
    }
    if (w.precipChance >= 0.5) parts.push(rainAt !== null && rainAt > hourNow ? t('wx.card.rainFrom', { time: at(rainAt) }) : t('wx.card.rainLikely'));
  }
  return parts.join(' · ');
}

/** The card's own hello (#340), for the hour he reads it: "Morning." / "Afternoon." / "Evening. Heading out?". */
export function cardGreeting(slot: 'day' | 'evening', hourNow: number): string {
  if (slot === 'evening') return t('greet.evening');
  return hourNow < 12 ? t('greet.morning') : t('greet.afternoon');
}

/** Without weather, the season says it under the hello ("October: bring a layer."), or nothing in a mild month. */
export function seasonLine(month: number): string | null {
  return seasonNeeds(month).layer === 'none' ? null : t('wx.line.season', { month: monthName(month) });
}

/** "Updated for your olive fleece.": the card re-planned after he corrected one of its pieces (09-ui-review §26, #364).
 *  Only while the piece is still his; none for a removed or merged one, or when nothing changed. */
export function updatedLine(outfit: Pick<OutfitRow, 'details'>, closet: readonly ClosetItemRow[]): string | null {
  const id = (outfit.details as { updatedFor?: string }).updatedFor;
  const it = id ? closet.find((c) => c.id === id && !c.isDeleted && !c.mergedInto) : undefined;
  if (!it?.name) return null;
  return t('idea.updatedFor', { item: it.name.charAt(0).toLowerCase() + it.name.slice(1) });
}

