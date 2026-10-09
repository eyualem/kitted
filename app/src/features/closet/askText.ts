// The closet question's one plain reason line (#117). Pure: no UI imports, so tests use it directly.
import type { ClosetAsk } from '@/data/types';
import { t } from '@/i18n/en';

/** The one plain line under the question. Pure. */
export function askReasonText(ask: Pick<ClosetAsk, 'reason' | 'reasonWord'>, plural = false): string {
  const w = ask.reasonWord ?? null;
  switch (ask.reason) {
    case 'halfSeen':
      if (plural) return w ? t('closet.q.why.halfSeenThem', { layer: w }) : t('closet.q.why.halfSeenNoLayerThem');
      return w ? t('closet.q.why.halfSeen', { layer: w }) : t('closet.q.why.halfSeenNoLayer');
    case 'shoes': return t('closet.q.why.shoes');
    case 'logo': return t('closet.q.why.logo');
    case 'logoDiffers': return t('closet.q.why.logoDiffers');
    case 'fit': return t('closet.q.why.fit');
    case 'type':
      if (!w) return t('closet.q.why.similar');
      return plural ? t('closet.q.why.typeThem', { type: w }) : t('closet.q.why.type', { article: /^[aeiou]/i.test(w) ? 'an' : 'a', type: w });
    case 'color': return t('closet.q.why.color');
    default: return t('closet.q.why.similar');
  }
}

/** Pants and shoes are "these" ("Are these your khaki chinos?"); everything else "this". */
export const isPluralPiece = (slot: unknown): boolean => slot === 'bottom' || slot === 'shoes';

/** The question line for a piece in his closet. */
export function askQuestionText(item: string, slot: unknown): string {
  return t(isPluralPiece(slot) ? 'closet.q.areThese' : 'closet.q.isThis', { item });
}
