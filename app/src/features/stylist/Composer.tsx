// The Stylist composer: ONE capsule holding the camera, the field and the mic (founder, Oct 8;
// DECISIONS-LOG #70). Liquid Glass where available, to sit with the tab bar.
//   idle     (📷) Ask your stylist…                       (🎙)
//   typing   What goes with tan chinos?|                 (↑)    camera hides (#28), mic → send
//   voice    (✕) ▁▃▅▇ "what shoes go with…"              (■)    stop drops the words in the field; so does leaving
// Never sends by itself: he reads what was heard, then taps send.
// On iOS it opens from the tab bar's "Ask your stylist…" accessory (StylistBar) and tells the
// screen when it's done (empty, unfocused, not listening), so the accessory shows again.
// The draft lives in composerState (07 §6.1): closing the composer keeps his words; only a question that made it
// into the thread clears them. While an answer streams he can type on, but send waits (one question at a time).
// VoiceOver (07 §18): the three slots are fixed, keyed children (composerSlots), so the trailing button stays the same
// view across ↑ → 🎙 → ■ → ↑ and the cursor stays on it; with VoiceOver on it never closes itself (the escape gesture
// does), and where the pressed control goes away the cursor moves to the field.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Chip, ChipFlow, CONTROL_TEXT_MAX_SCALE, Icon, KText, opacity, space, textStyles, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { QUESTION_MAX_CHARS } from '@/features/ask/pipeline';
import { useDictation } from './useDictation';
import { composerState, useComposerDraft } from './composerState';
import { composerSlots, cursorToField, goesIdle } from './composerSlots';

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

// Web preview only (undefined on iOS): the browser's textarea is two rows tall by default and sits under the capsule's
// absolutely positioned background, which hid the placeholder. One row, and drawn above the background.
const webField = Platform.OS === 'web' ? ({ props: { numberOfLines: 1 }, style: { position: 'relative' } } as const) : null;

const H = 52;
const BTN = 40;
/** The field's own top + bottom padding, and the most text it shows before it scrolls inside (about 4½ body lines). */
const INPUT_PAD = 9;
const INPUT_MAX_TEXT = 102;
/** After the accessory's exit animation has started; well before he could reach for a key. */
const AUTOFOCUS_RETRY_MS = 350;

export function Composer({ mode, onCamera, onSend, sendDisabled, autoFocus, startVoice, onIdle, chips = [] }: ComposerProps) {
  const { colors, scheme, a11y, isAccessibilitySize, fontScale } = useTheme();
  // The field grows with what he types, up to the same number of lines at every text size (07 §20): its text scales
  // with Dynamic Type up to the controls' 2× cap, so its max height does too.
  const inputMax = INPUT_PAD * 2 + INPUT_MAX_TEXT * Math.min(Math.max(fontScale, 1), CONTROL_TEXT_MAX_SCALE);
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
  const mic = useDictation((heard, how) => {
    composerState.appendHeard(heard);
    // iOS ignores live regions: say the final words once (never each partial while he talks). Not when he left
    // mid-dictation: the words wait in the draft, and the bar reads them (07 §18, L1).
    if (how !== 'left') AccessibilityInfo.announceForAccessibility?.(t('mic.a11yHeard', { text: heard }));
  });
  const screenReader = useScreenReader();
  const typing = focused || text.length > 0;
  const recording = mic.state !== 'idle';
  const idle = mode === 'idle' && !typing;
  const { lead, trail } = composerSlots({ recording, typing, hasText: text.trim().length > 0, micAvailable: mic.available });
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
    else if (goesIdle({ used: used.current, stopping: stopping.current, focused, recording, empty: text.length === 0, screenReader })) onIdle?.();
  }, [focused, recording, text, onIdle, screenReader]);

  // VoiceOver's cursor to the field once it's drawn (after ✕ it comes back where the waveform was), F4.
  const field = useRef<TextInput>(null);
  // Opened from the bar's field: autoFocus asks once, as the field reaches the window, while the tab bar takes its
  // accessory away (07 §19). If that one ask was refused (seen on the Simulator with a hardware keyboard), ask again.
  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => {
      if (!used.current && field.current && !field.current.isFocused()) field.current.focus();
    }, AUTOFOCUS_RETRY_MS);
    return () => clearTimeout(id);
    // Mount only, like autoFocus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cursorNext = useRef(false);
  useEffect(() => {
    if (!cursorNext.current || recording || !field.current) return;
    cursorNext.current = false;
    AccessibilityInfo.sendAccessibilityEvent?.(field.current, 'focus');
  });

  const send = async () => {
    const v = text.trim();
    if (!v || sendDisabled) return;
    if (await onSend?.(v)) {
      composerState.clearDraftIf(v);
      const after = composerSlots({ recording: false, typing: focused, hasText: composerState.draft().trim().length > 0, micAvailable: mic.available }).trail;
      if (screenReader && cursorToField('send', after)) cursorNext.current = true;
    }
  };
  const cancelMic = async () => {
    if (screenReader && cursorToField('cancel', null)) cursorNext.current = true;
    await mic.cancel();
  };
  const stopMic = async () => {
    stopping.current = true;
    const heard = await mic.stop(); // the words land through useDictation's onHeard
    stopping.current = false;
    if (!heard && goesIdle({ used: true, stopping: false, focused, recording: false, empty: !composerState.draft(), screenReader })) onIdle?.();
  };
  // VoiceOver's escape (two-finger scrub): put it away; words he said or typed wait in the draft (F3).
  const escape = () => {
    void (async () => {
      if (recording) await mic.stop();
      Keyboard.dismiss();
      onIdle?.();
    })();
  };

  // A light wash of the surface color over the clear glass, so the words keep their contrast over photos in the thread.
  const glassTint = /^#[0-9a-f]{6}$/i.test(colors.surface) ? `${colors.surface}59` : undefined;
  const shell = { borderRadius: H / 2, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: colors.line };
  const background =
    hasGlass() && !a11y.reduceTransparency ? (
      <GlassView key="bg" glassEffectStyle="regular" tintColor={glassTint} style={[StyleSheet.absoluteFill, { borderRadius: H / 2 }]} />
    ) : (
      <View key="bg" style={[StyleSheet.absoluteFill, { borderRadius: H / 2, backgroundColor: scheme === 'dark' ? colors.surface : colors.surface }]} />
    );

  // The camera is always the icon: the card above always carries the labelled camera action ("Check my fit",
  // "Check it on" or the link), so a labelled pill here said it twice (#70). VoiceOver: "Check my fit".
  const leadButton =
    lead === 'camera' ? (
      <Circle key="lead" onPress={onCamera} label={t('composer.a11y.camera')} filled color={colors.primary}>
        <Icon name="camera" size={22} color={colors.onPrimary} />
      </Circle>
    ) : lead === 'cancel' ? (
      <Circle key="lead" onPress={() => void cancelMic()} label={t('mic.a11yCancel')} color={colors.surface2}>
        <Icon name="close" size={18} color="ink" weight="semibold" />
      </Circle>
    ) : null;
  // One trailing button: the same view whatever it does, so VoiceOver's cursor stays on it (F2).
  const trailButton =
    trail === 'send' ? (
      <Circle key="trail" onPress={() => void send()} label={t('composer.a11y.send')} filled color={colors.primary} disabled={sendDisabled}>
        <Icon name="arrow.up" size={18} color={colors.onPrimary} weight="bold" />
      </Circle>
    ) : trail === 'mic' ? (
      <Circle key="trail" onPress={() => void mic.start()} label={t('mic.a11y')} color="transparent">
        <Icon name="mic" size={22} color="ink2" />
      </Circle>
    ) : trail === 'stop' ? (
      <Circle key="trail" onPress={() => void stopMic()} label={t('mic.a11yStop')} filled color={colors.primary}>
        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.onPrimary }} />
      </Circle>
    ) : null;

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
      <View style={[styles.capsule, shell]} onAccessibilityEscape={escape}>
        {background}
        {leadButton}
        {recording ? (
          <View key="voice" style={styles.voice}>
            <Waveform level={mic.level} color={colors.ink} />
            {/* Every word he's said so far, wrapping (was one line cut to the last 33 characters, #302). */}
            <KText variant="body" color={mic.text ? 'ink' : 'ink3'} numberOfLines={4} style={{ flex: 1 }}>
              {mic.text ? mic.text : mic.state === 'preparing' ? t('mic.preparing') : t('mic.listening')}
            </KText>
          </View>
        ) : (
          <TextInput
            key="field"
            ref={field}
            value={text}
            onChangeText={setText}
            maxLength={QUESTION_MAX_CHARS}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus={autoFocus}
            placeholder={idle ? t('composer.placeholderIdle') : t('composer.placeholder')}
            placeholderTextColor={colors.ink2}
            accessibilityLabel={t('composer.a11y.field')}
            // No numberOfLines: on iOS it caps the measured height at that many lines, so a wrapped line was cut off
            // inside the capsule instead of growing it (07 §20).
            multiline
            // The body style's size and leading, scaling with Dynamic Type up to the controls' 2× cap
            // (TextInput takes no dynamicTypeRamp, so it scales linearly like the other controls).
            allowFontScaling
            maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
            {...webField?.props}
            style={[styles.input, webField?.style, { color: colors.ink, paddingLeft: leadButton ? 4 : 12, maxHeight: inputMax }]}
          />
        )}
        {trailButton}
      </View>
    </View>
  );
}

/** VoiceOver on (the composer never closes itself then, 07 §18 F3). */
function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled?.()
      .then((v) => {
        if (alive) setOn(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('screenReaderChanged', (v: boolean) => setOn(v));
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);
  return on;
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
  input: { flex: 1, fontSize: textStyles.body.fontSize, lineHeight: textStyles.body.lineHeight, paddingTop: INPUT_PAD, paddingBottom: INPUT_PAD, paddingRight: space.xs },
  voice: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.s },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
});
