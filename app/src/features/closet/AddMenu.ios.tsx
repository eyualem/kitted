// The Closet "+" on iOS (09-ui-review §7 C8): the native SwiftUI pull-down menu, opened from the button itself (iOS 26
// header menus), with Take photo and Choose photos. A tap opens it; there's no separate primary action.
import { Button, Host, Image, Menu } from '@expo/ui/swift-ui';
import { accessibilityLabel, frame } from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import { useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { CLOSET_ADD_ACTIONS } from './addActions';

export function AddMenu() {
  const { colors, scheme } = useTheme();
  return (
    <Host matchContents colorScheme={scheme}>
      <Menu
        label={<Image systemName="plus" size={17} color={colors.ink} modifiers={[frame({ width: 28, height: 28 })]} />}
        modifiers={[accessibilityLabel(t('closet.add.a11y'))]}
      >
        {CLOSET_ADD_ACTIONS.map((a) => (
          <Button key={a.href} label={a.label} systemImage={a.systemImage} onPress={() => router.push(a.href)} />
        ))}
      </Menu>
    </Host>
  );
}
