// Swap one (02 "S1d"): the native action sheet lists the outfit's pieces; picking one re-picks
// the card without it. (S28's full sheet comes later; this is the iOS-standard minimum.)
import { ActionSheetIOS } from 'react-native';
import type { ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';

export function pickSwap(items: readonly ClosetItemRow[], onPick: (itemId: string) => void): void {
  const labels = items.map((i) => t('idea.swap.item', { item: i.name.toLowerCase() }));
  ActionSheetIOS.showActionSheetWithOptions(
    { options: [...labels, t('common.cancel')], cancelButtonIndex: labels.length, title: t('idea.swap.title') },
    (i) => {
      const it = items[i];
      if (it) onPick(it.id);
    },
  );
}
