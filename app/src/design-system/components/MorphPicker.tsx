// MorphPicker: the pill itself grows into the menu (founder, Oct 8: "an extension of the
// component", not a stock Apple dropdown or a separate tray; DECISIONS-LOG #69).
//
// Tap the pill and the same capsule expands, in place and floating over the card, into a panel:
// its top row is still the pill ("Smart casual ⌃"), the choices list under it. Pick one, tap
// outside or tap the top row, and it shrinks back into the pill. It's drawn in a transparent
// Modal at the pill's measured spot, so nothing in the thread clips it or sits on top of it.
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { opacity, shadow } from '../tokens';
import { Icon } from './Icon';
import { KText } from './KText';

export interface MorphOption<T extends string> {
  value: T;
  label: string;
}

export interface MorphSection<T extends string> {
  /** "Your styles" / "More styles"; omit for one untitled group. */
  title?: string;
  options: readonly MorphOption<T>[];
}

export interface MorphPickerProps<T extends string> {
  /** The current choice, shown on the pill and as the panel's top row. */
  label: string;
  value: T;
  sections: readonly MorphSection<T>[];
  onPick: (value: T) => void;
  accessibilityLabel: string;
  /** Plain mono text with a chevron (the result card's tagline) instead of the capsule. */
  plain?: boolean;
  /** Plain subheadline text with a chevron (the morning card's context line, #70). */
  inline?: boolean;
  /** A quiet lead-in before the label, both in one 44 pt row ("Headed: **Everyday** ⌄", the Going-for inset, #215).
   *  Implies the inline look, with the label in ink and semibold. */
  prefix?: string;
}

const ROW = 44;
const SECTION = 26;
const PAD = 6;
const MIN_W = 220;
const MS_OPEN = 260;
const PLAIN_ROW = 36;
const PLAIN_PAD = 8;
const MS_CLOSE = 190;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function MorphPicker<T extends string>({ label, value, sections, onPick, accessibilityLabel, plain: mono, inline: inlineProp, prefix }: MorphPickerProps<T>) {
  const inline = inlineProp || prefix !== undefined;
  const plain = mono || inline;
  const { colors, scheme, a11y } = useTheme();
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const anchor = useRef<View>(null);
  const [from, setFrom] = useState<Rect | null>(null);
  const p = useSharedValue(0);

  // The panel: as wide as the pill or MIN_W, kept on screen; it grows down, or up if there's no room.
  const contentH = PAD * 2 + sections.reduce((a, s) => a + (s.title ? SECTION : 0) + s.options.length * ROW, 0);
  const to: Rect | null = from
    ? (() => {
        const w = Math.max(from.w, MIN_W);
        const x = Math.min(Math.max(16, from.x), win.width - 16 - w);
        const maxH = win.height - insets.top - insets.bottom - 32;
        const h = Math.min(from.h + contentH, maxH);
        const below = from.y + h <= win.height - insets.bottom - 16;
        const y = below ? from.y : Math.max(insets.top + 16, from.y + from.h - h);
        return { x, y, w, h };
      })()
    : null;

  const open = () => {
    anchor.current?.measureInWindow((x, y, w, h) => {
      // Plain text grows a row around itself (8 pt each side, 36 tall) so the label stays put.
      setFrom(plain ? { x: x - PLAIN_PAD, y: y - (PLAIN_ROW - h) / 2, w: w + PLAIN_PAD * 2, h: PLAIN_ROW } : { x, y, w, h });
      p.set(0);
      p.set(withTiming(1, { duration: a11y.reduceMotion ? 0 : MS_OPEN, easing: Easing.out(Easing.cubic) }));
    });
  };
  const finish = () => setFrom(null);
  const close = (picked?: T) => {
    p.set(
      withTiming(0, { duration: a11y.reduceMotion ? 0 : MS_CLOSE, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(finish)();
      }),
    );
    if (picked !== undefined && picked !== value) onPick(picked);
  };

  const panel = useAnimatedStyle(() => {
    if (!from || !to) return {};
    return {
      left: interpolate(p.value, [0, 1], [from.x, to.x]),
      top: interpolate(p.value, [0, 1], [from.y, to.y]),
      width: interpolate(p.value, [0, 1], [from.w, to.w]),
      height: interpolate(p.value, [0, 1], [from.h, to.h]),
      borderRadius: interpolate(p.value, [0, 1], [from.h / 2, 18]),
    };
  });
  const list = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0.35, 1], [0, 1], 'clamp') }));
  const scrim = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 1], [0, 1]) }));

  const top = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: plain ? 3 : 5, height: from?.h ?? 32, paddingHorizontal: plain ? PLAIN_PAD - 1 : 11 }}>
      {prefix !== undefined ? (
        <KText variant="callout" color="ink2" numberOfLines={1}>
          {`${prefix} `}
          <KText variant="callout" weight="600" color="ink">
            {label}
          </KText>
        </KText>
      ) : inline ? (
        <KText variant="subheadline" weight="500" color="ink" numberOfLines={1}>
          {label}
        </KText>
      ) : plain ? (
        <KText variant="footnote" color="ink" mono="label" numberOfLines={1}>
          {label}
        </KText>
      ) : (
        <KText variant="subheadline" weight="600" numberOfLines={1}>
          {label}
        </KText>
      )}
      <Icon name="chevron.up" size={plain ? 10 : 11} color={plain ? 'ink' : 'ink2'} weight="semibold" />
    </View>
  );

  return (
    <>
      <Pressable
        ref={anchor}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: !!from }}
        hitSlop={plain ? { top: 10, bottom: 10, left: 6, right: 6 } : { top: 6, bottom: 6 }}
        style={({ pressed }) => ({ opacity: from ? 0 : pressed ? opacity.pressed : 1 })}
      >
        {prefix !== undefined ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', alignContent: 'center', flexWrap: 'wrap', columnGap: 6, minHeight: 44 }}>
            <KText variant="callout" color="ink2">
              {prefix}
            </KText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <KText variant="callout" weight="600" color="ink">
                {label}
              </KText>
              <Icon name="chevronDown" size={11} color="ink" weight="semibold" scalesWithText />
            </View>
          </View>
        ) : plain ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            {inline ? (
              <KText variant="subheadline" weight="500" color="ink2" numberOfLines={1}>
                {label}
              </KText>
            ) : (
              <KText variant="footnote" color="ink2" mono="label" numberOfLines={1}>
                {label}
              </KText>
            )}
            <Icon name="chevronDown" size={10} color="ink2" weight="semibold" />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32, paddingHorizontal: 12, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.surface2 }}>
            <KText variant="subheadline" weight="600" numberOfLines={1}>
              {label}
            </KText>
            <Icon name="chevronDown" size={11} color="ink2" weight="semibold" />
          </View>
        )}
      </Pressable>
      {from ? (
        <Modal transparent visible animationType="none" onRequestClose={() => close()} statusBarTranslucent>
          <Pressable style={{ flex: 1 }} onPress={() => close()} accessibilityLabel={accessibilityLabel} accessibilityRole="button">
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, backgroundColor: scheme === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(18,22,40,0.06)' }, scrim]} />
          </Pressable>
          <Animated.View
            style={[
              {
                position: 'absolute', overflow: 'hidden', borderCurve: 'continuous', backgroundColor: plain ? colors.surface : colors.surface2,
                borderWidth: 1, borderColor: colors.line, boxShadow: scheme === 'dark' ? '0px 12px 32px rgba(0,0,0,0.45)' : shadow.card,
              },
              panel,
            ]}
            accessibilityViewIsModal
          >
            <Pressable onPress={() => close()} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ expanded: true }}>
              {top}
            </Pressable>
            <Animated.View style={[{ flex: 1 }, list]}>
              <View style={{ height: 1, marginHorizontal: 12, backgroundColor: colors.line }} />
              <ScrollView bounces={false} contentContainerStyle={{ paddingVertical: PAD - 1 }}>
                {sections.map((s, i) => (
                  <View key={s.title ?? `s${i}`}>
                    {s.title ? (
                      <KText variant="footnote" color="ink3" mono="label" style={{ height: SECTION, paddingTop: 8, paddingHorizontal: 14 }}>
                        {s.title}
                      </KText>
                    ) : null}
                    {s.options.map((o) => {
                      const on = o.value === value;
                      return (
                        <Pressable
                          key={o.value}
                          onPress={() => close(o.value)}
                          accessibilityRole="button"
                          accessibilityLabel={o.label}
                          accessibilityState={{ selected: on }}
                          style={({ pressed }) => ({
                            height: ROW, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
                            backgroundColor: pressed ? colors.line : 'transparent',
                          })}
                        >
                          <KText variant="body" weight={on ? '600' : '400'} color={on ? 'ink' : 'ink2'} style={{ flex: 1 }} numberOfLines={1}>
                            {o.label}
                          </KText>
                          {on ? <Icon name="check" size="small" color="ink" weight="semibold" /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      ) : null}
    </>
  );
}
