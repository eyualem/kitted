// Closet: native stack with a large title (02 §1.1).
import { Stack } from 'expo-router';
import { t } from '@/i18n/en';

export default function ClosetStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('tab.closet'), headerLargeTitleEnabled: true }} />
      <Stack.Screen name="item/[id]" options={{ title: '' }} />
      <Stack.Screen name="starter" options={{ title: t('starter.title') }} />
    </Stack>
  );
}
