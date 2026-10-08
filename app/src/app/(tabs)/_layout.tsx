// The system tab bar (UITabBarController): iOS 26 draws the floating Liquid Glass capsule
// itself (02 §1.1, 05 S4). Labels always on, Stylist first, tint = accent. Don't hand-draw it.
// Outline symbols in both states, as the mockup draws them: `hanger` has no fill variant, so
// filled selections made Closet the odd one out (DECISIONS-LOG #56).
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/design-system';
import { sym } from '@/design-system/symbols';
import { t } from '@/i18n/en';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="stylist">
        <NativeTabs.Trigger.Label>{t('tab.stylist')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={sym.tabStylist} md="chat_bubble" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="closet">
        <NativeTabs.Trigger.Label>{t('tab.closet')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={sym.tabCloset} md="checkroom" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lookbook">
        <NativeTabs.Trigger.Label>{t('tab.lookbook')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={sym.tabLookbook} md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Label>{t('tab.you')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={sym.tabYou} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
