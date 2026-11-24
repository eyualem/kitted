// The Closet "+" outside iOS (the web preview, Android later): the same two actions in a system alert. The native
// pull-down menu is AddMenu.ios.tsx (09-ui-review §7 C8).
import { Alert, Platform, Pressable } from 'react-native';
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
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={t('closet.add.a11y')} hitSlop={8} style={({ pressed }) => [{ opacity: pressed ? opacity.pressed : 1, paddingHorizontal: 6 }, Platform.OS === 'web' ? webCircle(colors.surface) : null]}>
      <Icon name="plus" size="regular" color={colors.ink} />
    </Pressable>
  );
}

// On iOS the system draws a Liquid Glass circle behind a header button; on the web preview that's this white circle.
const webCircle = (backgroundColor: string) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginHorizontal: 10 }) as const;
