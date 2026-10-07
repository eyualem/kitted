// You: native stack with a large title (02 §1.1).
import { Stack } from 'expo-router';
import { t } from '@/i18n/en';

export default function YouStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('tab.you'), headerLargeTitleEnabled: true }} />
      <Stack.Screen name="profile" options={{ title: t('profile.title') }} />
      <Stack.Screen name="knows" options={{ title: t('knows.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      <Stack.Screen name="plan" options={{ title: t('usage.title') }} />
      <Stack.Screen name="notifications" options={{ title: t('notifs.title') }} />
      <Stack.Screen name="privacy" options={{ title: t('privacy.title') }} />
    </Stack>
  );
}
