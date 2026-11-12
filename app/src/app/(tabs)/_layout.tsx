// The system tab bar (UITabBarController): iOS 26 draws the floating Liquid Glass capsule
// itself (02 §1.1, 05 S4). Labels always on, Stylist first, tint = accent. Don't hand-draw it.
// Outline symbols in both states, as the mockup draws them: `hanger` has no fill variant, so
// filled selections made Closet the odd one out (DECISIONS-LOG #56).
import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/design-system';
import { sym } from '@/design-system/symbols';
import { t } from '@/i18n/en';
import { StylistBar } from '@/features/stylist/StylistBar';
import { useComposerOpen } from '@/features/stylist/composerState';
import { badgeColor } from '@/features/closet/arrivals';
import { closetBadge } from '@/features/closet/ClosetBadge';
import { useClosetArrivals } from '@/features/closet/useArrivals';

export default function TabsLayout() {
  const { colors, scheme } = useTheme();
  // The bar never shrinks (founder, Nov 12): the whole tab bar shows on every screen, however far he scrolls (iOS 26's
  // shrink-on-scroll left only the current tab's button, and a shrunk bar comes back only on a tap). On Stylist the
  // "Ask your stylist…" bar is the tab bar's bottom accessory (founder, Oct 9; only on the thread itself: not on Past
  // chats, and never on the other tabs).
  const segments = useSegments() as string[];
  const onThread = segments[segments.length - 1] === 'stylist' || (segments.includes('stylist') && segments[segments.length - 1] === 'index');
  // While the composer is open the accessory leaves the tab bar. The tab bar draws above the screen, so
  // its glass capsule (still there with its words faded) lensed the open composer resting under it: the
  // words, mic and send showed blurred, with bent copies above and below (07 §19, #319).
  const composerOpen = useComposerOpen() !== null;
  // Closet's badge (SY2.3): the pieces checks added since he last opened it. Navy, never Apple's red (SY2.7): `primary`
  // in light; in dark his chat bubbles' navy (`me`), since iOS always draws the number white and dark `primary` is near
  // white (founder, Nov 10, #439). Only Closet ever gets one (SY2.6).
  const tab = segments[0] === '(tabs)' ? segments[1] : undefined;
  const added = useClosetArrivals(tab);
  const badge = badgeColor(colors, scheme);
  return (
    // The selected tab is ink, not copper (founder, #276): copper is for score movement only.
    <NativeTabs tintColor={colors.ink} minimizeBehavior="never" badgeBackgroundColor={badge}>
      {onThread && !composerOpen ? (
        <NativeTabs.BottomAccessory>
          <StylistBar />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger name="stylist">
        <NativeTabs.Trigger.Label>{t('tab.stylist')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={sym.tabStylist} md="chat_bubble" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="closet">
        <NativeTabs.Trigger.Label>{t('tab.closet')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={sym.tabCloset} md="checkroom" />
        {closetBadge(added, badge)}
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
