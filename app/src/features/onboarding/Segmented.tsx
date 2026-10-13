// A small segmented control (02 D3: surface2 track, radius 13, the selected segment on surface).
// Dark mode: surface (#171A23) is darker than the surface2 track, so the selected segment looked pressed in;
// it takes the selected-chip treatment instead (ink fill, onPrimary text, 16.6:1). 32 pt visual, 44 pt hit.
import { Pressable, StyleSheet, View } from 'react-native';
import { KText, useTheme } from '@/design-system';

export function Segmented<T extends string>({ options, value, label, onChange }: { options: readonly { value: T; label: string }[]; value: T; label: string; onChange: (v: T) => void }) {
  const { colors, scheme } = useTheme();
  const dark = scheme === 'dark';
  return (
    <View style={[styles.track, { backgroundColor: colors.surface2 }]} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[
              styles.seg,
              on && (dark ? { backgroundColor: colors.ink } : { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }),
            ]}
          >
            <KText variant="footnote" weight={on ? '600' : '400'} color={on && dark ? 'onPrimary' : 'ink'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {o.label}
            </KText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 13, padding: 2.5, gap: 2.5 },
  seg: { flex: 1, minHeight: 32, borderRadius: 10.5, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
