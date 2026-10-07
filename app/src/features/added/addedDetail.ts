// S11 row detail: "Top · Regular fit", "Bottom · Straight leg", "Shoes" (no UI imports, so tests can use it).
import type { Garment } from '@kitted/core';
import type { ClosetItemRow } from '@/data/types';
import { volumeWord } from '@/features/correct/fields';
import { t, type StringKey } from '@/i18n/en';

const SLOT: Record<string, StringKey> = { top: 'added.slot.top', bottom: 'added.slot.bottom', shoes: 'added.slot.shoes', outer: 'added.slot.outer' };
const LEG: Record<string, StringKey> = {
  skinny: 'value.leg.skinny', slim: 'value.leg.slim', straight: 'value.leg.straight', relaxed: 'value.leg.relaxed', wide: 'value.leg.wide',
};

/** "Top · Regular fit", "Bottom · Straight leg", "Shoes". */
export function addedDetail(item: Pick<ClosetItemRow, 'slot' | 'garment'>): string {
  const slot = SLOT[item.slot] ? t(SLOT[item.slot]!) : '';
  const fit = fitWord(item.garment);
  return fit && slot ? t('added.detail', { slot, fit }) : slot || fit;
}

function fitWord(g: Garment): string {
  if (g.category === 'top' || g.category === 'outerwear') return t('added.topFit', { fit: volumeWord(g.volume) });
  const leg = g.category === 'bottom' && typeof g.leg_shape === 'string' ? LEG[g.leg_shape] : undefined;
  return leg ? t('added.legFit', { leg: t(leg) }) : '';
}
