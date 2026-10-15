// Closet: native stack with a large title (02 §1.1). The "+" (C4) opens the clothes scan
// (DECISIONS-LOG #88, #100): Take photo / Choose photos. Describe it (C4d) joins the list when
// it's built (the style-council session owns the Closet tab and the full C4 menu).
import { ActionSheetIOS, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Icon, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

function AddButton() {
  const { colors } = useTheme();
  const open = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [t('closet.add.menu.photo'), t('closet.add.menu.photos'), t('common.cancel')], cancelButtonIndex: 2 },
      (i) => {
        if (i === 0) router.push('/scan');
        if (i === 1) router.push('/scan?library=1');
      },
    );
  };
  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={t('closet.add.a11y')} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1, paddingHorizontal: 6 })}>
      <Icon name="plus" size="regular" color={colors.ink} />
    </Pressable>
  );
}

export default function ClosetStack() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('tab.closet'), headerLargeTitleEnabled: true, headerRight: () => <AddButton /> }} />
      <Stack.Screen name="item/[id]" options={{ title: '' }} />
      <Stack.Screen name="starter" options={{ title: t('starter.title') }} />
    </Stack>
  );
}
