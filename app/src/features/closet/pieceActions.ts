// What a Closet piece's long-press menu does (founder, Oct 14; #118): Rename, and Remove from Closet with Undo.
import { Alert, Platform } from 'react-native';
import type { ClosetItemRow } from '@/data/types';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { fitCheck } from '@/features/fitcheck/session';
import { profileOfItem } from './profile';
import { t } from '@/i18n/en';

/** An alert raised while a native menu closes is dropped; wait for it (CLAUDE.md lessons, lensUi). */
export const MENU_DISMISS_MS = 450;

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** "Remove from Closet": out of the grid, then a toast with Undo. */
export function removePiece(item: Pick<ClosetItemRow, 'id'>) {
  void fitCheck.closet.removeItem(item.id).then((it) => {
    if (it) showToast(t('closet.removed', { item: lower(it.name) }), () => fitCheck.closet.restoreItem(it.id), { ms: TOAST_MS_REMOVAL });
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
