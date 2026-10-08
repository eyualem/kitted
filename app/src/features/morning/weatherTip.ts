// The one weather line under a fit-check result (02 "S1d", #59): advice only, never points.
// Uses the weather of the card in the check's own window, so it matches what he saw that day.
import { localParts, weatherTip, type DayWeather, type WeatherTip } from '@kitted/core';
import { store } from '@/data/db';
import type { FitCheckRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { t } from '@/i18n/en';
import { hourText } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { ideaId, slotAt } from './service';

/** `atHour`: the check's local hour; rain that already started reads "today", not "after 6 pm". */
export function weatherTipText(tip: WeatherTip, atHour: number): string {
  const when = tip.fromHour !== null && tip.fromHour > atHour ? t('tip.wx.after', { time: hourText(tip.fromHour) }) : t('tip.wx.today');
  switch (tip.key) {
    case 'wetSuede':
      return t('tip.wx.wetSuede', { when });
    case 'wetLight':
      return t('tip.wx.wetLight', { when });
    case 'coldNoLayer':
      return t('tip.wx.coldNoLayer');
    case 'coldNoCoat':
      return t('tip.wx.coldNoCoat');
    default:
      return t('tip.wx.hotLayer');
  }
}

export function useWeatherTip(row: FitCheckRow | null | undefined): string | null {
  const text = useLive(
    ['dailyIdeas', 'readings'],
    async () => {
      if (!row?.readingId || row.status !== 'scored') return null;
      const { day, slot } = slotAt(row.createdAt, sessionClock.offset);
      const w = (await store.dailyIdeas.get(ideaId(day, slot)))?.weather as unknown as DayWeather | null | undefined;
      if (!w) return null;
      const reading = (await store.readings.get(row.readingId))?.reading;
      const tip = reading ? weatherTip(reading, w) : null;
      return tip ? weatherTipText(tip, localParts(row.createdAt, sessionClock.offset).hh) : null;
    },
    [row?.id, row?.readingId, row?.status],
  );
  return text ?? null;
}
