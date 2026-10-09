// The Stylist composer: ONE capsule holding the camera, the field and the mic (founder, Oct 8;
// DECISIONS-LOG #70). Liquid Glass where available, to sit with the tab bar.
//   idle     (📷) Ask your stylist…                       (🎙)
//   typing   What goes with tan chinos?|                 (↑)    camera hides (#28), mic → send
//   voice    (✕) ▁▃▅▇ "what shoes go with…"              (■)    stop drops the words in the field
// Never sends by itself: he reads what was heard, then taps send.
// On iOS it opens from the tab bar's "Ask your stylist…" accessory (StylistBar) and tells the
// screen when it's done (empty, unfocused, not listening), so the accessory shows again.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { CONTROL_TEXT_MAX_SCALE, Icon, KText, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { useDictation } from './useDictation';

export interface ComposerProps {
  mode: 'compact' | 'idle';
  onCamera: () => void;
  onSend?: (text: string) => void;
  /** Focus the field on mount (opened from the accessory's field). */
  autoFocus?: boolean;
  /** Start listening on mount (opened from the accessory's mic). */
  startVoice?: boolean;
  /** Called once it's been used and is back to nothing: empty, keyboard down, mic off. */
  onIdle?: () => void;
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

export function Composer({ mode, onCamera, onSend, autoFocus, startVoice, onIdle }: ComposerProps) {
  const { colors, scheme, a11y } = useTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const mic = useDictation();
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

  const send = () => {
    const v = text.trim();
    if (!v) return;
    onSend?.(v);
    setText('');
  };
  const stopMic = async () => {
    stopping.current = true;
    const heard = await mic.stop();
    stopping.current = false;
    if (heard) setText((cur) => (cur ? `${cur} ${heard}` : heard));
    else if (!focused && !text) onIdle?.();
  };

  const shell = { borderRadius: H / 2, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: colors.line };
  const background =
    hasGlass() && !a11y.reduceTransparency ? (
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: H / 2 }]} />
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

  return (
    <View style={styles.wrap}>
      <View style={[styles.capsule, shell]}>
        {background}
        {recording ? (
          <>
            <Circle onPress={() => void mic.cancel()} label={t('mic.a11yCancel')} color={colors.surface2}>
              <Icon name="close" size={18} color="ink" weight="semibold" />
            </Circle>
            <View style={styles.voice} accessibilityLiveRegion="polite">
              <Waveform level={mic.level} color={colors.ink} />
              <KText variant="body" color={mic.text ? 'ink' : 'ink3'} numberOfLines={1} style={{ flex: 1 }}>
                {mic.text ? (mic.text.length > 34 ? `…${mic.text.slice(-33)}` : mic.text) : t('mic.listening')}
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
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus={autoFocus}
              placeholder={idle ? t('composer.placeholderIdle') : t('composer.placeholder')}
              placeholderTextColor={colors.ink3}
              accessibilityLabel={t('composer.a11y.field')}
              multiline
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
              style={[styles.input, { color: colors.ink, paddingLeft: camera ? 4 : 12 }]}
            />
            {text.trim().length > 0 ? (
              <Circle onPress={send} label={t('composer.a11y.send')} filled color={colors.primary}>
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

function Circle({ children, onPress, label, filled, color }: { children: React.ReactNode; onPress: () => void; label: string; filled?: boolean; color: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={2}
      style={({ pressed }) => [styles.circle, { backgroundColor: filled || color !== 'transparent' ? color : 'transparent', opacity: pressed ? opacity.pressed : 1 }]}
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
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  capsule: { minHeight: H, flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, overflow: 'hidden' },
  circle: { width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 17, lineHeight: 22, paddingTop: 9, paddingBottom: 9, paddingRight: 4, maxHeight: 120 },
  voice: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
});
