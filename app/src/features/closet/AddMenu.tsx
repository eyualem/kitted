// The Closet "+" outside iOS (the web preview, Android later): the same two actions in a system alert. The native
// pull-down menu is AddMenu.ios.tsx (09-ui-review §7 C8).
import { Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Icon, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { CLOSET_ADD_ACTIONS } from './addActions';

export function AddMenu() {
  const { colors } = useTheme();
  const open = () =>
    Alert.alert(t('closet.add.a11y'), undefined, [
      ...CLOSET_ADD_ACTIONS.map((a) => ({ text: a.label, onPress: () => router.push(a.href) })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={t('closet.add.a11y')} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1, paddingHorizontal: 6 })}>
      <Icon name="plus" size="regular" color={colors.ink} />
    </Pressable>
  );
}
