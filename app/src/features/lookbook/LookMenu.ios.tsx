// L2's ⋯ on iOS (02 L2; 09-ui-review §20.8 G22): the native pull-down menu from the header button, as Closet's "+"
// (AddMenu.ios.tsx). Delete photo (only while the look has one) and Remove from Lookbook. Save and Share wait for
// their builds (no dead items).
import { Button, Host, Image, Menu } from '@expo/ui/swift-ui';
import { accessibilityLabel, frame } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import type { LookMenuProps } from './LookMenu';

export function LookMenu({ hasPhoto, onDeletePhoto, onRemove }: LookMenuProps) {
  const { colors, scheme } = useTheme();
  return (
    <Host matchContents colorScheme={scheme}>
      <Menu
        label={<Image systemName="ellipsis" size={17} color={colors.ink} modifiers={[frame({ width: 28, height: 28 })]} />}
        modifiers={[accessibilityLabel(t('stylist.menu.a11y'))]}
      >
        {hasPhoto ? <Button label={t('look.deletePhoto')} systemImage="trash" role="destructive" onPress={onDeletePhoto} /> : null}
        <Button label={t('lookbook.remove.action')} systemImage="minus.circle" onPress={onRemove} />
      </Menu>
    </Host>
  );
}
