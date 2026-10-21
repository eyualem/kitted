// The next best buy's data (09-ui-review §14, #308), read from the store: shared by the Outfits card and the C7 sheet.
import { store } from '@/data/db';
import { nextBestBuy } from '@/features/finish/gains';
import { getStarterMarks } from '@/features/finish/service';
import { t } from '@/i18n/en';

export async function loadNextBuy() {
  const closet = await store.closet.all();
  const nb = nextBestBuy({
    closet, checks: await store.fitChecks.all(), styles: (await store.profile.get('me'))?.styles ?? null, marks: await getStarterMarks(store),
  });
  return nb ? { ...nb, closet } : null;
}

/** "+12 outfits with what you own". */
export const gainLine = (n: number) => (n === 1 ? t('ask.card.buy.gainOne') : t('ask.card.buy.gain', { n }));
