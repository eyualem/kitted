// Stylist: one native stack, inline title (02 §1.1). The "Re-check included" subtitle is a
// custom headerTitle (05 T25), added in P2 with the thread. No hairline under the bar (the mockup
// draws none).
// The clock at the top left opens Past chats: the thread is kept by day (founder, Oct 9).
import { Platform, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Icon, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { StylistHeaderTitle } from '@/features/stylist/HeaderTitle';

// On iOS the system draws a Liquid Glass circle behind a header button; on the web preview that's this white circle.
const webCircle = (backgroundColor: string) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginHorizontal: 10 }) as const;

function HistoryButton() {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => router.push('/stylist/history')} accessibilityRole="button" accessibilityLabel={t('history.open.a11y')} hitSlop={8} style={({ pressed }) => [{ opacity: pressed ? opacity.pressed : 1, paddingHorizontal: 6 }, Platform.OS === 'web' ? webCircle(colors.surface) : null]}>
      <Icon name="history" size="regular" color={colors.ink} />
    </Pressable>
  );
}

export default function StylistStack() {
  return (
    // No hairline under pushed nav bars (#276), like Stylist's own header.
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('tab.stylist'), headerTitle: () => <StylistHeaderTitle />, headerTitleAlign: 'center', headerShadowVisible: false, headerLeft: () => <HistoryButton /> }} />
      <Stack.Screen name="history" options={{ title: t('history.title'), headerLargeTitleEnabled: true }} />
      <Stack.Screen name="day/[key]" options={{ title: '' }} />
    </Stack>
  );
}
