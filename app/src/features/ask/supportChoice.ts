// S27's "Call or text 988": the native choice (Call 988 → tel:988, Text 988 → sms:988).
import { ActionSheetIOS, Linking } from 'react-native';
import { t } from '@/i18n/en';

export function chooseSupport(): void {
  const options = [t('support.call'), t('support.textOpt'), t('common.cancel')];
  ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, (i) => {
    if (i === 0) void Linking.openURL('tel:988');
    if (i === 1) void Linking.openURL('sms:988');
  });
}
