// Lookbook: native stack with a large title (02 §1.1).
import { Stack } from 'expo-router';
import { t } from '@/i18n/en';

export default function LookbookStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('tab.lookbook'), headerLargeTitleEnabled: true }} />
      <Stack.Screen name="look/[id]" options={{ title: '' }} />
      <Stack.Screen name="moves" options={{ title: t('moves.title') }} />
    </Stack>
  );
}
