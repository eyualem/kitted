// The Stylist composer: ONE capsule holding the camera, the field and the mic (founder, Oct 8;
// DECISIONS-LOG #70). Liquid Glass where available, to sit with the tab bar.
//   idle     (📷) Ask your stylist…                       (🎙)
//   typing   What goes with tan chinos?|                 (↑)    camera hides (#28), mic → send
//   voice    (✕) ▁▃▅▇ "what shoes go with…"              (■)    stop drops the words in the field
// Never sends by itself: he reads what was heard, then taps send.
// On iOS it opens from the tab bar's "Ask your stylist…" accessory (StylistBar) and tells the
// screen when it's done (empty, unfocused, not listening), so the accessory shows again.
// The draft lives in composerState (07 §6.1): closing the composer keeps his words; only a question that made it
// into the thread clears them. While an answer streams he can type on, but send waits (one question at a time).
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Chip, ChipFlow, CONTROL_TEXT_MAX_SCALE, Icon, KText, opacity, space, textStyles, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { useDictation } from './useDictation';
import { composerState, useComposerDraft } from './composerState';

export interface ComposerProps {
  mode: 'compact' | 'idle';
  onCamera: () => void;
  /** Resolves true when the question made it into the thread (the draft is cleared then). */
  onSend?: (text: string) => Promise<boolean> | boolean;
  /** An answer is still streaming: send waits. */
  sendDisabled?: boolean;
  /** Focus the field on mount (opened from the accessory's field). */
  autoFocus?: boolean;
  /** Start listening on mount (opened from the accessory's mic). */
  startVoice?: boolean;
  /** Called once it's been used and is back to nothing: empty, keyboard down, mic off. */
  onIdle?: () => void;
  /** Starter questions (07 §6.3): shown above the field while it's open and empty; a tap sends one. */
  chips?: readonly string[];
}

let glass: boolean | undefined;
function hasGlass(): boolean {
  if (glass === undefined) {
    try {
      glass = isLiquidGlassAvailable();
    } catch {
      glass = false;
    }
  }
  return glass;
}

const H = 52;
const BTN = 40;

export function Composer({ mode, onCamera, onSend, sendDisabled, autoFocus, startVoice, onIdle, chips = [] }: ComposerProps) {
  const { colors, scheme, a11y, isAccessibilitySize } = useTheme();
  const text = useComposerDraft();
  const setText = composerState.setDraft;
  const [focused, setFocused] = useState(false);
  // The chips stay a moment after the field blurs, so a tap on one (which blurs the field first) still lands.
  const [chipsUp, setChipsUp] = useState(false);
  const chipsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFocus = () => {
    if (chipsTimer.current) clearTimeout(chipsTimer.current);
    setFocused(true);
    setChipsUp(true);
  };
  const onBlur = () => {
    setFocused(false);
    chipsTimer.current = setTimeout(() => setChipsUp(false), 400);
  };
  useEffect(() => () => {
    if (chipsTimer.current) clearTimeout(chipsTimer.current);
  }, []);
  const mic = useDictation((heard) => {
    const cur = composerState.draft();
    setText(cur ? `${cur} ${heard}` : heard);
    // iOS ignores live regions: say the final words once (never each partial while he talks).
    AccessibilityInfo.announceForAccessibility?.(t('mic.a11yHeard', { text: heard }));
  });
  const typing = focused || text.length > 0;
  const recording = mic.state !== 'idle';
  const idle = mode === 'idle' && !typing;
  const used = useRef(false);
  // Between the mic going quiet and the words landing in the field it's briefly "empty": not idle.
  const stopping = useRef(false);
  useEffect(() => {
    if (startVoice) void mic.start();
    // Mount only: the accessory's mic opens it listening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (focused || recording) used.current = true;
    else if (used.current && !stopping.current && text.length === 0) onIdle?.();
  }, [focused, recording, text, onIdle]);

  const send = async () => {
    const v = text.trim();
    if (!v || sendDisabled) return;
    if (await onSend?.(v)) composerState.clearDraftIf(v);
  };
  const stopMic = async () => {
    stopping.current = true;
    const heard = await mic.stop(); // the words land through useDictation's onHeard
    stopping.current = false;
    if (!heard && !focused && !text) onIdle?.();
  };

  // A light wash of the surface color over the clear glass, so the words keep their contrast over photos in the thread.
  const glassTint = /^#[0-9a-f]{6}$/i.test(colors.surface) ? `${colors.surface}59` : undefined;
  const shell = { borderRadius: H / 2, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: colors.line };
  const background =
    hasGlass() && !a11y.reduceTransparency ? (
      <GlassView glassEffectStyle="regular" tintColor={glassTint} style={[StyleSheet.absoluteFill, { borderRadius: H / 2 }]} />
    ) : (
      <View style={[StyleSheet.absoluteFill, { borderRadius: H / 2, backgroundColor: scheme === 'dark' ? colors.surface : colors.surface }]} />
    );

  // Always the icon: the card above always carries the labelled camera action ("Check my fit",
  // "Check it on" or the link), so a labelled pill here said it twice (#70). VoiceOver: "Check my fit".
  const camera = typing || recording ? null : (
    <Circle onPress={onCamera} label={t('composer.a11y.camera')} filled color={colors.primary}>
      <Icon name="camera" size={22} color={colors.onPrimary} />
    </Circle>
  );

  const showChips = chips.length > 0 && text.length === 0 && !recording && chipsUp;
  return (
    <View style={styles.wrap}>
      {showChips ? (
        isAccessibilitySize ? (
          // At the accessibility sizes a wrapping flow stacked three tall chips over the field and the keyboard, off the
          // top of a short screen: one row that scrolls sideways instead (07 §17, U13).
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginHorizontal: -space.gutter, paddingBottom: space.s }} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: space.s }}>
            {chips.map((c) => (
              <Chip key={c} title={c} small disabled={sendDisabled} onPress={() => void onSend?.(c)} />
            ))}
          </ScrollView>
        ) : (
          <View style={{ paddingBottom: space.s }}>
            <ChipFlow>
              {chips.map((c) => (
                <Chip key={c} title={c} small disabled={sendDisabled} onPress={() => void onSend?.(c)} />
              ))}
            </ChipFlow>
          </View>
        )
      ) : null}
      <View style={[styles.capsule, shell]}>
        {background}
        {recording ? (
          <>
            <Circle onPress={() => void mic.cancel()} label={t('mic.a11yCancel')} color={colors.surface2}>
              <Icon name="close" size={18} color="ink" weight="semibold" />
            </Circle>
            <View style={styles.voice}>
              <Waveform level={mic.level} color={colors.ink} />
              {/* Every word he's said so far, wrapping (was one line cut to the last 33 characters, #302). */}
              <KText variant="body" color={mic.text ? 'ink' : 'ink3'} numberOfLines={4} style={{ flex: 1 }}>
                {mic.text ? mic.text : mic.state === 'preparing' ? t('mic.preparing') : t('mic.listening')}
              </KText>
            </View>
            <Circle onPress={() => void stopMic()} label={t('mic.a11yStop')} filled color={colors.primary}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.onPrimary }} />
            </Circle>
          </>
        ) : (
          <>
            {camera}
            <TextInput
              value={text}
              onChangeText={setText}
              onFocus={onFocus}
              onBlur={onBlur}
              autoFocus={autoFocus}
              placeholder={idle ? t('composer.placeholderIdle') : t('composer.placeholder')}
              placeholderTextColor={colors.ink2}
              accessibilityLabel={t('composer.a11y.field')}
              multiline
              numberOfLines={1}
              // The body style's size and leading, scaling with Dynamic Type up to the controls' 2× cap
              // (TextInput takes no dynamicTypeRamp, so it scales linearly like the other controls).
              allowFontScaling
              maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
              style={[styles.input, { color: colors.ink, paddingLeft: camera ? 4 : 12 }]}
            />
            {text.trim().length > 0 ? (
              <Circle onPress={() => void send()} label={t('composer.a11y.send')} filled color={colors.primary} disabled={sendDisabled}>
                <Icon name="arrow.up" size={18} color={colors.onPrimary} weight="bold" />
              </Circle>
            ) : mic.available ? (
              <Circle onPress={() => void mic.start()} label={t('mic.a11y')} color="transparent">
                <Icon name="mic" size={22} color="ink2" />
              </Circle>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function Circle({ children, onPress, label, filled, color, disabled }: { children: React.ReactNode; onPress: () => void; label: string; filled?: boolean; color: string; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled: true } : undefined}
      hitSlop={2}
      style={({ pressed }) => [styles.circle, { backgroundColor: filled || color !== 'transparent' ? color : 'transparent', opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : 1 }]}
    >
      {children}
    </Pressable>
  );
}

/** Five bars that follow his voice (ink, never copper: copper is for gains and links). */
function Waveform({ level, color }: { level: SharedValue<number>; color: string }) {
  return (
    <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0.55, 0.85, 1, 0.75, 0.5].map((k, i) => (
        <Bar key={i} k={k} level={level} color={color} />
      ))}
    </View>
  );
}

function Bar({ k, level, color }: { k: number; level: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({ height: 4 + Math.min(1, level.value) * 20 * k }));
  return <Animated.View style={[{ width: 3, borderRadius: 1.5, backgroundColor: color, opacity: 0.6 }, style]} />;
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.gutter, paddingTop: space.s },
  capsule: { minHeight: H, flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, overflow: 'hidden' },
  circle: { width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: textStyles.body.fontSize, lineHeight: textStyles.body.lineHeight, paddingTop: 9, paddingBottom: 9, paddingRight: space.xs, maxHeight: 120 },
  voice: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.s },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
});
