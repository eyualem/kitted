// The system tab bar (UITabBarController): iOS 26 draws the floating Liquid Glass capsule
// itself (02 §1.1, 05 S4). Labels always on, Stylist first, tint = accent. Don't hand-draw it.
// Outline symbols in both states, as the mockup draws them: `hanger` has no fill variant, so
// filled selections made Closet the odd one out (DECISIONS-LOG #56).
import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/design-system';
import { sym } from '@/design-system/symbols';
import { t } from '@/i18n/en';

export default function TabsLayout() {
  const { colors } = useTheme();
  // The bar shrinks as he scrolls down the browsing grids (Closet, Lookbook), the iOS 26 way.
  // Not on Stylist: a chat sits at the bottom, so "scrolling down" never happens there, and the
  // composer can't follow a shrunk bar; the keyboard already covers it while he types (#70).
  const segments = useSegments() as string[];
  const browsing = segments.includes('closet') || segments.includes('lookbook');
  return (
    <NativeTabs tintColor={colors.accent} minimizeBehavior={browsing ? 'onScrollDown' : 'never'}>
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
