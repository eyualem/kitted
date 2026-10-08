// Web preview stand-in for the native pull-down (layout only; iOS is the truth): a pill that
// steps to the next option on each click.
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { opacity } from '../tokens';
import { Icon } from './Icon';
import { KText } from './KText';
import type { PullDownPillProps } from './PullDownPill';

export type { PullDownOption, PullDownPillProps } from './PullDownPill';

export function PullDownPill<T extends string>({ label, value, sections, onChange, accessibilityLabel }: PullDownPillProps<T>) {
  const { colors } = useTheme();
  const all = sections.flatMap((s) => s.options);
  const next = () => {
    const i = all.findIndex((o) => o.value === value);
    const o = all[(i + 1) % all.length];
    if (o) onChange(o.value);
  };
  return (
    <Pressable onPress={next} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surface2 }}>
        <KText variant="subheadline" weight="600">
          {label}
        </KText>
        <Icon name="chevronDown" size={10} color="ink2" />
      </View>
    </Pressable>
  );
}
