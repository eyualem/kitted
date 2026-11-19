// The rows of a "You'd need" tile's menu (KC2.10), shared by the iOS sheet and the web preview.
import { t } from '@/i18n/en';

export type NeedChoice = 'haveOne' | 'nextBuy';

/** The sheet's rows in order (I have one, then Next buy), only the ones offered. */
export function needMenuRows(c: { haveOne: boolean; nextBuy: string | null }): NeedChoice[] {
  return [...(c.haveOne ? (['haveOne'] as const) : []), ...(c.nextBuy ? (['nextBuy'] as const) : [])];
}

export const needLabel = (c: NeedChoice) => (c === 'haveOne' ? t('ask.card.haveOne') : t('ask.card.nextBuy'));
