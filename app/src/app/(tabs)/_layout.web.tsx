// WEB PREVIEW ONLY: a stand-in for the iOS 26 tab bar, drawn to the mockup's numbers
// (62 pt capsule, 21 pt from the sides and bottom, ink text on surface2 when selected; ink, not copper, #276).
// Never shipped to iOS, where NativeTabs draws the real one (05 T21: judge it on the Simulator).
import { StyleSheet, View } from 'react-native';
import { useSegments } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, KText, useTheme } from '@/design-system';
import type { SymKey } from '@/design-system/symbols';
import { t, type StringKey } from '@/i18n/en';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { badgeColor, badgeCount, LAST_OPENED_KEY, parseLastOpened } from '@/features/closet/arrivals';
import { useHeldChecks } from '@/features/closet/slide';

type TabHref = '/stylist' | '/closet' | '/lookbook' | '/you';

const TABS: readonly { name: string; href: TabHref; label: StringKey; icon: SymKey }[] = [
  { name: 'stylist', href: '/stylist', label: 'tab.stylist', icon: 'tabStylist' },
  { name: 'closet', href: '/closet', label: 'tab.closet', icon: 'tabCloset' },
  { name: 'lookbook', href: '/lookbook', label: 'tab.lookbook', icon: 'tabLookbook' },
  { name: 'you', href: '/you', label: 'tab.you', icon: 'tabYou' },
];

export default function WebTabsLayout() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  // Closet's badge, like the iOS bar's (_layout.tsx): the pieces checks added since he last opened it, navy. Read only:
  // useClosetArrivals (what the iOS bar runs) also starts Closet's first-visit slide, whose animations don't run on the web.
  const segments = useSegments() as string[];
  const added = useClosetBadge(segments[0] === '(tabs)' ? segments[1] : undefined);
  const badge = badgeColor(colors, scheme);
  const bottom = Math.max(insets.bottom - 13, 8); // the mockup's bar sits 21 pt above the bottom on a 34 pt inset
  return (
    <Tabs>
      <TabSlot />
      {/* iOS lenses what scrolls under its glass bar; here the thread, a card or a photo showed in the margin around the
          capsule. A flat strip in the page color hides it (taps pass through). */}
      <View style={[styles.backdrop, { height: bottom + 62 + 8, backgroundColor: colors.bg, pointerEvents: 'none' }]} />
      <TabList style={[styles.bar, { bottom, backgroundColor: colors.surface, borderColor: colors.line }]}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <WebTab label={t(tab.label)} icon={tab.icon} badge={tab.name === 'closet' && added > 0 ? { count: added, color: badge } : undefined} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

function useClosetBadge(tab: string | undefined): number {
  const lastOpened = parseLastOpened(useLive(['kv'], () => store.getKv(LAST_OPENED_KEY), [], LAST_OPENED_KEY));
  const held = useHeldChecks();
  const heldKey = [...held].sort().join();
  const count = useLive(['closet', 'fitChecks'], async () => badgeCount(await store.closet.all(), await store.fitChecks.all(), lastOpened, held), [lastOpened, heldKey]);
  return tab === 'closet' ? 0 : count ?? 0;
}

function WebTab({ label, icon, badge, isFocused, ...props }: TabTriggerSlotProps & { label: string; icon: SymKey; badge?: { count: number; color: string } }) {
  const { colors } = useTheme();
  const color = isFocused ? 'ink' : 'ink2';
  return (
    <View
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={[styles.tab, isFocused && { backgroundColor: colors.surface2 }]}
    >
      <View>
        <Icon name={icon} size="large" color={color} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <KText variant="caption" weight="600" color="onPrimary" style={{ color: '#FFFFFF', lineHeight: 16 }}>
              {String(badge.count)}
            </KText>
          </View>
        ) : null}
      </View>
      <KText variant="caption" weight="600" color={color}>
        {label}
      </KText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    position: 'absolute',
    left: 21,
    right: 21,
    height: 62,
    borderRadius: 31,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 4,
    gap: 2,
  },
  badge: { position: 'absolute', top: -6, left: 17, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 27, gap: 1 },
});
