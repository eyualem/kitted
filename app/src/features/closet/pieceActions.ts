// What a Closet piece's menus and its page do (founder, Oct 14; #118, #276): open its page, Rename, Remove from
// Closet with Undo; on the page, each photo's Use as cover, Open the look, Not this piece and Remove photo (with
// Undo). A removal's pictures are deleted from the phone once Undo is over (fileCleanup).
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { openLookPage } from '@/features/lookbook/lookPage';
import type { ClosetItemRow } from '@/data/types';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { fitCheck } from '@/features/fitcheck/session';
import { DELETE_AFTER_MS } from './fileCleanup';
import { runMerge } from './merge';
import { profileOfItem } from './profile';
import { closetCleanup, runClosetCleanup } from './session';
import { t } from '@/i18n/en';

/** An alert raised while a native menu closes is dropped; wait for it (CLAUDE.md lessons, lensUi). */
export const MENU_DISMISS_MS = 450;

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** The pending deletions run just after the Undo window (and again at the next launch, if the app closes first). */
function cleanupLater() {
  setTimeout(runClosetCleanup, DELETE_AFTER_MS + 500);
}

/** A tap on a tile: the piece's page (#276). */
export function openPiece(item: Pick<ClosetItemRow, 'id'>) {
  router.push(`/closet/item/${item.id}`);
}

/** "Remove from Closet": out of the grid, then a toast with Undo. Its cut-outs go once Undo is over. */
export function removePiece(item: Pick<ClosetItemRow, 'id'>, o: { onRemoved?: () => void } = {}) {
  void fitCheck.closet.removeItem(item.id).then(async (it) => {
    if (!it) return;
    showToast(t('closet.removed', { item: lower(it.name) }), () => fitCheck.closet.restoreItem(it.id), { ms: TOAST_MS_REMOVAL });
    o.onRemoved?.();
    await closetCleanup.schedule({ kind: 'piece', itemId: it.id });
    cleanupLater();
  });
}

/** Save what he typed; an empty name puts the original back. A toast says the name it has now. */
function save(item: Pick<ClosetItemRow, 'id' | 'name'>, typed: string) {
  void fitCheck.closet.renameItem(item.id, typed).then((it) => {
    if (it && it.name !== item.name) showToast(t('closet.renamed', { name: it.name }));
  });
}

/**
 * "Rename piece": the system text prompt, prefilled with the name. Save / Cancel, and "Reset to the original name"
 * once he has renamed it. `fromMenu`: raised from the native menu, so it waits for the menu to close.
 */
export function renamePiece(item: Pick<ClosetItemRow, 'id' | 'name' | 'profile'>, o: { fromMenu?: boolean } = {}) {
  if (Platform.OS !== 'ios') return; // Alert.prompt is iOS only; the app is iOS first
  const renamed = profileOfItem(item).nameLocked === true;
  const ask = () =>
    Alert.prompt(t('closet.rename.title'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      ...(renamed ? [{ text: t('closet.rename.reset'), onPress: () => save(item, '') }] : []),
      { text: t('common.save'), isPreferred: true, onPress: (v?: string) => save(item, v ?? '') },
    ], 'plain-text', item.name);
  if (o.fromMenu) setTimeout(ask, MENU_DISMISS_MS);
  else ask();
}

/** "Use as cover": the photo leads the piece's photos and its long-press preview. */
export function setAsCover(itemId: string, obsId: string) {
  void fitCheck.closet.setCover(itemId, obsId).then((it) => {
    if (it) showToast(t('closet.piece.coverSet'));
  });
}

/**
 * "Remove photo": gone from the piece (its page, cover and preview); the look keeps its photo. Undo brings it back.
 * Once Undo is over, that sighting's cut-out and fingerprint are deleted from the phone.
 */
export function removePhoto(itemId: string, obsId: string, o: { inLookbook: boolean }) {
  void fitCheck.closet.hidePhoto(itemId, obsId).then(async (r) => {
    if (!r) return;
    showToast(t(o.inLookbook ? 'closet.piece.photoRemoved' : 'closet.piece.photoRemovedOnly'), () => fitCheck.closet.unhidePhoto(itemId, obsId, r.wasCover), { ms: TOAST_MS_REMOVAL });
    await closetCleanup.schedule({ kind: 'photo', itemId, obsId });
    cleanupLater();
  });
}

/** "Not this piece": a correction; the photo's piece becomes its own (or his "Yes" is re-answered "No"). */
export function notThisPiece(obsId: string) {
  void fitCheck.closet.notThisPiece(obsId).then((it) => {
    if (it) showToast(t('closet.piece.splitOff', { item: lower(it.name) }));
  });
}

/** "Open the look": that look's page in the Lookbook (#282). */
export function openLook(checkId: string) {
  openLookPage(checkId);
}

/** A photo on the piece page: the full-screen viewer on that check. */
export function openPhoto(checkId: string) {
  router.push(`/photo/${checkId}`);
}

/**
 * "Same as another piece…" → a pick (#280): asks once ("Same as your khaki chinos?"), then folds `from` into `into`,
 * with a toast that can undo it. `onMerged` runs once it's done (the picker closes; the page moves to the kept piece).
 */
export async function mergePiece(
  from: Pick<ClosetItemRow, 'id' | 'name'>, into: Pick<ClosetItemRow, 'id' | 'name'>, o: { onMerged?: () => void } = {},
): Promise<void> {
  const done = await runMerge(from, into, {
    confirm: (title, body, yes) => new Promise<boolean>((resolve) => {
      Alert.alert(title, body, [
        { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: yes, isPreferred: true, onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) });
    }),
    merge: (a, b) => fitCheck.closet.merge(a, b),
    unmerge: (u) => fitCheck.closet.unmerge(u),
    toast: (text, undo) => void showToast(text, undo, { ms: TOAST_MS_REMOVAL }),
  });
  if (done) o.onMerged?.();
}
