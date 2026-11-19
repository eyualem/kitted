// A "You'd need" tile's menu (KC2.10): the native iOS action sheet, titled with the piece, its rows from
// `needMenuRows` and Cancel. The mockup draws a popover; an anchored popover needs a new package, the action sheet
// doesn't, and it gives the same two choices in the same words (T104, logged).
import { ActionSheetIOS } from 'react-native';
import { t } from '@/i18n/en';
import { needLabel, type NeedChoice } from './needChoices';

export function openNeedMenu(title: string, rows: readonly NeedChoice[], onPick: (c: NeedChoice) => void): void {
  if (rows.length === 0) return;
  ActionSheetIOS.showActionSheetWithOptions(
    { title, options: [...rows.map(needLabel), t('common.cancel')], cancelButtonIndex: rows.length },
    (i) => {
      const c = rows[i];
      if (c) onPick(c);
    },
  );
}
