// WEB PREVIEW ONLY: a stand-in for the iOS 26 tab bar, drawn to the mockup's numbers
// (62 pt capsule, 21 pt from the sides and bottom, ink text on surface2 when selected; ink, not copper, #276).
// Never shipped to iOS, where NativeTabs draws the real one (05 T21: judge it on the Simulator).
import { StyleSheet, View } from 'react-native';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, KText, useTheme } from '@/design-system';
import type { SymKey } from '@/design-system/symbols';
import { t, type StringKey } from '@/i18n/en';

type TabHref = '/stylist' | '/closet' | '/lookbook' | '/you';

const TABS: readonly { name: string; href: TabHref; label: StringKey; icon: SymKey }[] = [
  { name: 'stylist', href: '/stylist', label: 'tab.stylist', icon: 'tabStylist' },
  { name: 'closet', href: '/closet', label: 'tab.closet', icon: 'tabCloset' },
  { name: 'lookbook', href: '/lookbook', label: 'tab.lookbook', icon: 'tabLookbook' },
  { name: 'you', href: '/you', label: 'tab.you', icon: 'tabYou' },
];

export default function WebTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom - 13, 8); // the mockup's bar sits 21 pt above the bottom on a 34 pt inset
  return (
    <Tabs>
      <TabSlot />
      <TabList style={[styles.bar, { bottom, backgroundColor: colors.surface, borderColor: colors.line }]}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <WebTab label={t(tab.label)} icon={tab.icon} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

function WebTab({ label, icon, isFocused, ...props }: TabTriggerSlotProps & { label: string; icon: SymKey }) {
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
      <Icon name={icon} size="large" color={color} />
      <KText variant="caption" weight="600" color={color}>
        {label}
      </KText>
    </View>
  );
}

const styles = StyleSheet.create({
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
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 27, gap: 1 },
});
