// C5's taps (02 C5 "Tap to own"; 10-onboarding.md §9.3): a row he owns becomes a not-photographed closet piece (the
// belt, with no closet slot yet, a kv mark); untapping one he marked removes it, with Undo. A piece seen in his checks
// isn't removed here (its own page does that).
import type { KittedStore } from '@/data/store';
import type { Styles } from '@kitted/core';
import { outfitGain } from '@/features/closet/outfits';
import { t } from '@/i18n/en';
import { getStarterMarks, STARTER_MARKS_KEY } from './service';
import { markedPiece, ownership, type StarterEntry } from './starter';

export interface StarterToast {
  text: string;
  undo?: () => Promise<void>;
}

const saveMarks = (store: Pick<KittedStore, 'setKv'>, ids: string[]) => store.setKv(STARTER_MARKS_KEY, JSON.stringify(ids));

export async function toggleStarter(store: KittedStore, e: StarterEntry, ids: (p: string) => string, nowMs: number): Promise<StarterToast | null> {
  const [closet, marks, profile] = await Promise.all([store.closet.all(), getStarterMarks(store), store.profile.get('me')]);
  const own = ownership(closet, marks)[e.id];
  const styles: Styles | null = profile?.styles ?? null;
  if (!own?.owned) {
    const piece = markedPiece(e, ids('I'), nowMs);
    if (!piece) {
      await saveMarks(store, [...marks, e.id]);
      return { text: t('starter.markedToast') };
    }
    const gain = outfitGain(closet, styles, piece);
    await store.closet.put(piece);
    return { text: gain > 0 ? t('toast.fits', { n: gain }) : t('starter.markedToast') };
  }
  if (own.how !== 'marked') return null;
  if (own.itemId) {
    const row = await store.closet.get(own.itemId);
    if (!row) return null;
    await store.closet.put({ ...row, isDeleted: true, updatedAt: nowMs });
    return { text: t('starter.removed', { item: e.name }), undo: async () => void (await store.closet.put({ ...row, isDeleted: false })) };
  }
  await saveMarks(store, marks.filter((x) => x !== e.id));
  return { text: t('starter.removed', { item: e.name }), undo: async () => saveMarks(store, [...(await getStarterMarks(store)), e.id]) };
}
