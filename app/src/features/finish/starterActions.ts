// "What you already own" (02 C5; 10-onboarding.md §9.3, §9.11, #342): a choice he picks becomes a not-photographed
// closet piece in that kind and color; picking again on a row he added changes that same piece; Remove deletes it.
// Each with Undo. The belt (no closet slot yet) is a kv mark. A piece seen in his checks isn't touched here (its own
// page does that).
import type { KittedStore } from '@/data/store';
import type { Styles } from '@kitted/core';
import { t } from '@/i18n/en';
import { getStarterMarks, STARTER_MARKS_KEY } from './service';
import { fitsGain, markedPiece, ownedGarment, ownership, type StarterEntry, type StarterOption } from './starter';
import { baseName } from '@/features/closet/itemName';
import { displayHex } from '@kitted/core';

export interface StarterToast {
  text: string;
  undo?: () => Promise<void>;
}

const saveMarks = (store: Pick<KittedStore, 'setKv'>, ids: string[]) => store.setKv(STARTER_MARKS_KEY, JSON.stringify(ids));

/** He picked `opt` on row `e`: a new piece, or (a row he already added from) the same piece changed. */
export async function pickStarter(store: KittedStore, e: StarterEntry, opt: StarterOption, ids: (p: string) => string, nowMs: number): Promise<StarterToast | null> {
  const [closet, marks, profile] = await Promise.all([store.closet.all(), getStarterMarks(store), store.profile.get('me')]);
  const own = ownership(closet, marks)[e.id];
  if (own?.owned && own.how === 'closet') return null;
  if (own?.owned && own.itemId) {
    const row = await store.closet.get(own.itemId);
    const garment = ownedGarment(e, opt);
    if (!row || !garment) return null;
    const name = baseName(garment, null);
    await store.closet.put({ ...row, garment, name, hex: displayHex(opt.color), art: null, updatedAt: nowMs });
    return { text: t('starter.addedToast', { item: name }), undo: async () => void (await store.closet.put(row)) };
  }
  const piece = markedPiece(e, opt, ids('I'), nowMs);
  if (!piece) return null;
  const styles: Styles | null = profile?.styles ?? null;
  const gain = fitsGain(closet, styles, piece.garment, String(piece.slot)) ?? 0;
  await store.closet.put(piece);
  const undo = async () => void (await store.closet.put({ ...piece, isDeleted: true, updatedAt: nowMs }));
  return { text: gain > 0 ? t('toast.fits', { n: gain }) : t('starter.addedToast', { item: piece.name }), undo };
}

/** Remove what he added from row `e` (a piece, or the belt's mark), with Undo. */
export async function removeStarter(store: KittedStore, e: StarterEntry, nowMs: number): Promise<StarterToast | null> {
  const [closet, marks] = await Promise.all([store.closet.all(), getStarterMarks(store)]);
  const own = ownership(closet, marks)[e.id];
  if (!own?.owned || own.how !== 'marked') return null;
  if (own.itemId) {
    const row = await store.closet.get(own.itemId);
    if (!row) return null;
    await store.closet.put({ ...row, isDeleted: true, updatedAt: nowMs });
    return { text: t('starter.removed', { item: row.name }), undo: async () => void (await store.closet.put({ ...row, isDeleted: false })) };
  }
  await saveMarks(store, marks.filter((x) => x !== e.id));
  return { text: t('starter.removed', { item: e.name }), undo: async () => saveMarks(store, [...(await getStarterMarks(store)), e.id]) };
}

/** The belt (no choices, no closet slot): a tap marks it; a second tap removes the mark. */
export async function toggleMarkOnly(store: KittedStore, e: StarterEntry, nowMs: number): Promise<StarterToast | null> {
  const marks = await getStarterMarks(store);
  if (marks.includes(e.id)) return removeStarter(store, e, nowMs);
  await saveMarks(store, [...marks, e.id]);
  return { text: t('starter.markedToast'), undo: async () => saveMarks(store, (await getStarterMarks(store)).filter((x) => x !== e.id)) };
}
