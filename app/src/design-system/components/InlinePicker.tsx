// InlinePicker: a pill that opens a tray of chips right under it, inside the card, instead of
// the system pull-down (founder, Oct 8: the menu should look like part of the component, not a
// default Apple dropdown; DECISIONS-LOG #68). One tray open at a time; picking a chip closes it.
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { opacity } from '../tokens';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { KText } from './KText';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
}

export interface PickerSection<T extends string> {
  /** "Your styles" / "More styles"; omit for a single untitled group. */
  title?: string;
  options: readonly PickerOption<T>[];
}

/** The capsule. Open: ink outline and the chevron flips, so it reads as the tray's handle. */
export function PickerPill({ label, open, onPress, accessibilityLabel }: { label: string; open: boolean; onPress: () => void; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
    >
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32, paddingHorizontal: 12, borderRadius: 16, borderCurve: 'continuous',
          backgroundColor: colors.surface2, borderWidth: 1, borderColor: open ? colors.ink : 'transparent',
        }}
      >
        <KText variant="subheadline" weight="600" numberOfLines={1}>
          {label}
        </KText>
        <Icon name={open ? 'chevron.up' : 'chevronDown'} size={11} color="ink2" weight="semibold" />
      </View>
    </Pressable>
  );
}

/** The tray under the pill row: the choices as chips, the current one filled. */
export function PickerTray<T extends string>({ sections, value, onPick }: { sections: readonly PickerSection<T>[]; value: T; onPick: (v: T) => void }) {
  const { colors, a11y } = useTheme();
  return (
    <Animated.View
      entering={a11y.reduceMotion ? undefined : FadeIn.duration(160)}
      exiting={a11y.reduceMotion ? undefined : FadeOut.duration(120)}
      style={{ backgroundColor: colors.surface2, borderRadius: 14, borderCurve: 'continuous', paddingHorizontal: 10, paddingVertical: 6, gap: 2 }}
    >
      {sections.map((s, i) => (
        <View key={s.title ?? `s${i}`} style={{ gap: 0 }}>
          {s.title ? (
            <KText variant="footnote" color="ink2" mono="label" style={{ paddingTop: 6, paddingHorizontal: 2 }}>
              {s.title}
            </KText>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 6 }}>
            {s.options.map((o) => (
              <Chip key={o.value} small title={o.label} state={o.value === value ? 'selected' : 'normal'} onPress={() => onPick(o.value)} />
            ))}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
