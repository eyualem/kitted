// L2's ⋯ outside iOS (the web preview, Android later): the same two actions in a system alert. The native pull-down
// menu is LookMenu.ios.tsx (09-ui-review §20.8 G22).
import { Alert, Pressable } from 'react-native';
import { Icon, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

export interface LookMenuProps {
  hasPhoto: boolean;
  onDeletePhoto: () => void;
  onRemove: () => void;
}

export function LookMenu({ hasPhoto, onDeletePhoto, onRemove }: LookMenuProps) {
  const { colors } = useTheme();
  const open = () =>
    Alert.alert(t('stylist.menu.a11y'), undefined, [
      ...(hasPhoto ? [{ text: t('look.deletePhoto'), style: 'destructive' as const, onPress: onDeletePhoto }] : []),
      { text: t('lookbook.remove.action'), onPress: onRemove },
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={t('stylist.menu.a11y')} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1, paddingHorizontal: 6 })}>
      <Icon name="more" size="regular" color={colors.ink} />
    </Pressable>
  );
}
