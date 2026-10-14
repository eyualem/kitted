// You: native stack with a large title (02 §1.1). The gear (top right, ink, #231) opens Settings (Y4, #246).
import { Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Icon, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

function SettingsButton() {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/you/settings')}
      accessibilityRole="button"
      accessibilityLabel={t('settings.title')}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1, paddingHorizontal: 6, minHeight: 28, justifyContent: 'center' })}
    >
      <Icon name="settings" size="regular" color={colors.ink} />
    </Pressable>
  );
}

export default function YouStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('tab.you'), headerLargeTitleEnabled: true, headerRight: () => <SettingsButton /> }} />
      <Stack.Screen name="profile" options={{ title: t('profile.title') }} />
      <Stack.Screen name="knows" options={{ title: t('knows.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      <Stack.Screen name="plan" options={{ title: t('usage.title') }} />
      <Stack.Screen name="notifications" options={{ title: t('notifs.title') }} />
      <Stack.Screen name="acknowledgements" options={{ title: t('settings.acknowledgements') }} />
      <Stack.Screen name="privacy" options={{ title: t('privacy.title') }} />
    </Stack>
  );
}
