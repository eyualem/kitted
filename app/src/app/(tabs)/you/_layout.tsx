// You: native stack with a large title (02 §1.1). No gear and no Settings page (SY1, #405): every setting is on You
// itself, so the header holds the title only. Pages pushed from You read "‹ You" on their back button.
import { Stack } from 'expo-router';
import { t } from '@/i18n/en';

export default function YouStack() {
  return (
    // No hairline under pushed nav bars (#276), like Stylist's own header.
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('tab.you'), headerLargeTitleEnabled: true }} />
      <Stack.Screen name="profile" options={{ title: t('profile.title') }} />
      <Stack.Screen name="knows" options={{ title: t('knows.title') }} />
      <Stack.Screen name="plan" options={{ title: t('usage.title') }} />
      <Stack.Screen name="notifications" options={{ title: t('notifs.title') }} />
      <Stack.Screen name="acknowledgements" options={{ title: t('settings.acknowledgements') }} />
      <Stack.Screen name="privacy" options={{ title: t('privacy.title') }} />
    </Stack>
  );
}
