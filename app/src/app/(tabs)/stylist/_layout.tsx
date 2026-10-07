// Stylist: one native stack, inline title (02 §1.1). The "Re-check included" subtitle is a
// custom headerTitle (05 T25), added in P2 with the thread.
import { Stack } from 'expo-router';
import { t } from '@/i18n/en';
import { StylistHeaderTitle } from '@/features/stylist/HeaderTitle';

export default function StylistStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('tab.stylist'), headerTitle: () => <StylistHeaderTitle />, headerTitleAlign: 'center' }} />
    </Stack>
  );
}
