// The occasion chip's menu (02 D7). iOS: the native action sheet (Cancel is the default).
import { ActionSheetIOS } from 'react-native';
import { OCCASIONS, type OccasionKey } from '@/data/types';
import { t } from '@/i18n/en';
import { occasionLabel } from './thread';

export function pickOccasion(current: OccasionKey, onPick: (o: OccasionKey) => void): void {
  const labels = OCCASIONS.map(occasionLabel);
  ActionSheetIOS.showActionSheetWithOptions(
    { options: [...labels, t('common.cancel')], cancelButtonIndex: labels.length, title: t('read.occasion.q') },
    (i) => {
      const o = OCCASIONS[i];
      if (o && o !== current) onPick(o);
    },
  );
}
