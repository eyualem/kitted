// PullDownPill: a small capsule that opens Apple's native pull-down menu (SwiftUI Menu via
// @expo/ui; no new package). Used for the morning card's occasion and style (02 "S1d", #61).
// The web preview gets PullDownPill.web.tsx (a cycling pill), since @expo/ui has no web.
import { Host, Menu, Button, Section, HStack, Text, Image } from '@expo/ui/swift-ui';
import { accessibilityHint, accessibilityLabel, backgroundOverlay, clipShape, font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';

export interface PullDownOption<T extends string> {
  value: T;
  label: string;
}

export interface PullDownPillProps<T extends string> {
  /** The pill's text (the current choice). */
  label: string;
  value: T;
  /** One or more titled groups ("Your styles" / "More styles"); a single group can be untitled. */
  sections: readonly { title?: string; options: readonly PullDownOption<T>[] }[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export function PullDownPill<T extends string>({ label, value, sections, onChange, accessibilityLabel: a11y, accessibilityHint: hint }: PullDownPillProps<T>) {
  const { colors, scheme } = useTheme();
  const item = (o: PullDownOption<T>) => (
    <Button key={o.value} label={o.label} systemImage={o.value === value ? 'checkmark' : undefined} onPress={() => o.value !== value && onChange(o.value)} />
  );
  return (
    <Host matchContents colorScheme={scheme}>
      <Menu
        label={
          <HStack
            spacing={4}
            modifiers={[
              padding({ horizontal: 11, vertical: 6 }),
              backgroundOverlay({ color: colors.surface2 }),
              clipShape('capsule'),
              accessibilityLabel(a11y),
              ...(hint ? [accessibilityHint(hint)] : []),
            ]}
          >
            <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(colors.ink)]}>{label}</Text>
            <Image systemName="chevron.down" size={10} color={colors.ink2} />
          </HStack>
        }
      >
        {sections.map((s, i) =>
          s.title ? (
            <Section key={s.title} title={s.title}>
              {s.options.map(item)}
            </Section>
          ) : (
            <Section key={`s${i}`}>{s.options.map(item)}</Section>
          ),
        )}
      </Menu>
    </Host>
  );
}
