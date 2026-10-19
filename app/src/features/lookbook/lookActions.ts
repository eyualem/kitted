// What a look can do from the Lookbook and its page (02 L1, L2; 09-ui-review §20.8 G22): remove it from the Lookbook
// (#118, the long-press's flow, with Undo), and delete its photo (L2's ⋯, a confirm, no Undo: the files are gone).
import { ActionSheetIOS, Alert } from 'react-native';
import { store } from '@/data/db';
import { fitCheck } from '@/features/fitcheck/session';
import { deleteHeldPhoto } from '@/features/held/files';
import { deleteClosetFiles } from '@/features/privacy/files';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { deleteLookPhotos } from './deletePhoto';

/**
 * "Remove from Lookbook", and when the look added pieces no other check has seen (a fitting-room try-on), "Remove look
 * and its new pieces". Its chat card stays; a toast offers Undo. `after` runs once it's removed (the look page goes back).
 */
export async function removeLookMenu(checkId: string, title: string, after?: () => void): Promise<void> {
  const extra = (await fitCheck.closet.onlyInLook(checkId)).length;
  const options = [
    t('lookbook.remove.action'),
    ...(extra > 0 ? [extra === 1 ? t('lookbook.remove.withPiece') : t('lookbook.remove.withPieces', { n: extra })] : []),
    t('common.cancel'),
  ];
  ActionSheetIOS.showActionSheetWithOptions(
    { title, message: t('lookbook.remove.note'), options, destructiveButtonIndex: extra > 0 ? [0, 1] : 0, cancelButtonIndex: options.length - 1 },
    (i) => {
      if (i === options.length - 1) return;
      const withPieces = i === 1 && extra > 0;
      void fitCheck.closet.removeLook(checkId, withPieces).then((r) => {
        if (!r) return;
        after?.();
        const n = r.removedItems.length;
        showToast(n === 0 ? t('lookbook.removed') : n === 1 ? t('lookbook.removed1') : t('lookbook.removedN', { n }), () => fitCheck.closet.restoreLook(r), { ms: TOAST_MS_REMOVAL });
      });
    },
  );
}

/** "Delete photo" on a look with one photo, "Delete photos" on a re-checked one (every check's photo, §22.7 F4). */
export const deletePhotoLabel = (n: number): string => t(n > 1 ? 'look.deletePhotos' : 'look.deletePhoto');

/** "Delete this photo?" (or "Delete these photos?") / "The score stays in your Lookbook." (02 L2), then the look's
 *  photos leave the phone. */
export function confirmDeletePhoto(checkIds: readonly string[]): void {
  Alert.alert(t(checkIds.length > 1 ? 'look.delete.titleN' : 'look.delete.title'), t('look.delete.msg'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: deletePhotoLabel(checkIds.length),
      style: 'destructive',
      onPress: () => {
        void deleteLookPhotos({ store, deleteKept: deleteHeldPhoto, deleteClosetFiles }, checkIds).catch((e: unknown) => console.error('[look] delete photo failed', e));
      },
    },
  ]);
}
