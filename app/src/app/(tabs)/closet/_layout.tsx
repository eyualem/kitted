// Closet: native stack with a large title (02 §1.1). The "+" (C4) opens the clothes scan (DECISIONS-LOG #88, #100):
// Take photo / Choose photos, in the native pull-down menu from the button on iOS (AddMenu, 09-ui-review §7 C8).
// Describe it (C4d) joins the list when it's built (the style-council session owns the Closet tab and the full C4 menu).
import { Stack } from 'expo-router';
import { AddMenu } from '@/features/closet/AddMenu';
import { t } from '@/i18n/en';

export default function ClosetStack() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('tab.closet'), headerLargeTitleEnabled: true, headerRight: () => <AddMenu /> }} />
      <Stack.Screen name="item/[id]" options={{ title: '' }} />
      <Stack.Screen name="starter" options={{ title: t('starter.title') }} />
    </Stack>
  );
}
