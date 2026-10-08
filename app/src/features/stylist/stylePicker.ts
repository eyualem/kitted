// VoiceOver path to the result card's style (the native pull-down lives inside the grouped card):
// the iOS action sheet, like the occasion picker (02 D7).
import { ActionSheetIOS } from 'react-native';
import { STYLES, type StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { t } from '@/i18n/en';

export function pickStyle(current: StyleKey | null, onPick: (s: StyleKey) => void): void {
  const labels = STYLES.map(styleLabel);
  ActionSheetIOS.showActionSheetWithOptions(
    { options: [...labels, t('common.cancel')], cancelButtonIndex: labels.length, title: t('style.pick.title') },
    (i) => {
      const s = STYLES[i];
      if (s && s !== current) onPick(s);
    },
  );
}
