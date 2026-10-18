// Lookbook: native stack with a large title (02 §1.1).
import { Stack } from 'expo-router';
import { t } from '@/i18n/en';

export default function LookbookStack() {
  return (
    // No hairline under pushed nav bars (#276), like Stylist's own header.
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('tab.lookbook'), headerLargeTitleEnabled: true }} />
      <Stack.Screen name="look/[id]" options={{ title: '' }} />
    </Stack>
  );
}
