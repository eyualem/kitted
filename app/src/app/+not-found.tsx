// A link to a screen that doesn't exist (an old or mistyped kitted:// link): the same "This isn't here anymore." as a
// deleted record, with a way back through the gate (09 §20.7 R11, #323). Was Expo's "Unmatched Route".
import { router } from 'expo-router';
import { KButton } from '@/design-system';
import { GonePage } from '@/features/gone/Gone';
import { t } from '@/i18n/en';

export default function NotFound() {
  return (
    <GonePage>
      <KButton title={t('gone.home')} size="regular" style={{ alignSelf: 'center' }} onPress={() => router.replace('/')} />
    </GonePage>
  );
}
