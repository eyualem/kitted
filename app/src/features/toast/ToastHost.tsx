// The toast capsule (02 G2, 03 UndoToast): 16 from the sides, its bottom 100 pt up (just above
// the tab bar; above the composer on Stylist, DECISIONS-LOG #36), surface (surface2 in dark) with a 1 pt line border and the card shadow; message
// in subheadline ink, optional "Undo" (44 hit). Announced by VoiceOver; slides up (a
// fade under Reduce Motion).
// Undo carries a countdown ring with the seconds left (09-ui-review §21, #324): ink on a `line` track (copper is for the
// score, #231), draining over the real window on wall-clock time; a touch held on the toast pauses it up to the hard
// stop (toast.ts); whole-second steps under Reduce Motion; hidden from VoiceOver, which hears the time once.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeInDown, FadeOut, useAnimatedProps, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { CONTROL_TEXT_MAX_SCALE, KText, opacity, shadow, size, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import {
  countdownHidesAt,
  countdownLeftMs,
  countdownSeconds,
  holdCountdown,
  releaseCountdown,
  startCountdown,
  toastHardStopMs,
  toastWindowMs,
  hideToast,
  useToast,
  useToastFloor,
  type Countdown,
  type Toast,
} from './toast';

const BOTTOM = 100;
const ABOVE_DOCK = 8;
/** The ring at the default text size; it grows with the text up to CONTROL_TEXT_MAX_SCALE. */
export const UNDO_RING_PT = 22;
/** How often the number (and the stepped ring under Reduce Motion) is brought up to date. */
const TICK_MS = 200;
/** A demo toast that starts held stays this long, so a screenshot can't miss it. */
const DEMO_HOLD_STOP_MS = 60_000;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ToastHost() {
  const toast = useToast();
  const floor = useToastFloor();
  const [voiceOver, setVoiceOver] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled?.().then(setVoiceOver).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('screenReaderChanged', setVoiceOver);
    return () => sub?.remove();
  }, []);

  // The container stays mounted; only the capsule comes and goes. Unmounting the parent together with an exiting
  // capsule left later capsules' entering animation stuck invisible on iOS: only the first toast of a session showed (#118).
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(BOTTOM, floor + ABOVE_DOCK), alignItems: 'center' }}>
      {toast ? <ToastCapsule key={toast.id} toast={toast} voiceOver={voiceOver} /> : null}
    </View>
  );
}

function firstCountdown(toast: Toast, voiceOver: boolean): Countdown {
  const c = startCountdown(toast.shownAt, toastWindowMs(toast, voiceOver), toastHardStopMs(toast));
  if (!toast.demoHeldAtMs) return c;
  const now = Date.now();
  return { ...c, endsAt: now + Math.min(c.windowMs, toast.demoHeldAtMs), stopAt: now + DEMO_HOLD_STOP_MS, heldAt: now };
}

function ToastCapsule({ toast, voiceOver }: { toast: Toast; voiceOver: boolean }) {
  const { colors, scheme, a11y, isAccessibilitySize } = useTheme();
  // At accessibility sizes the message gets the full width and ring + Undo sit under it (side by side, the message
  // broke mid-word and the pill swelled into an oval).
  const stacked = isAccessibilitySize && !!toast.undo;
  const reduceMotion = a11y.reduceMotion;
  const [first] = useState(() => {
    const c = firstCountdown(toast, voiceOver);
    return { c, left: countdownLeftMs(c, Date.now()) };
  });
  const cd = useRef<Countdown>(first.c);
  const progress = useSharedValue(first.left / first.c.windowMs);
  const [seconds, setSeconds] = useState(() => countdownSeconds(first.left));
  const touch = useRef({ hold: () => {}, release: () => {} });

  useEffect(() => {
    const label = toast.undo ? t('toast.undoFor', { text: toast.text, n: Math.round(first.c.windowMs / 1000) }) : toast.text;
    AccessibilityInfo.announceForAccessibility?.(label);
    // Announced once: the number below is hidden from VoiceOver, so nothing ticks.
  }, [toast, first]);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    // One deadline drives everything: the hide, the number and the ring are all read from the countdown.
    function sync(restartRing: boolean) {
      const c = cd.current;
      const now = Date.now();
      if (countdownHidesAt(c) <= now) {
        hideToast(toast.id);
        return;
      }
      const left = countdownLeftMs(c, now);
      const secs = countdownSeconds(left);
      setSeconds(secs);
      if (reduceMotion) progress.set(Math.min(1, (secs * 1000) / c.windowMs));
      else if (restartRing) {
        cancelAnimation(progress);
        progress.set(left / c.windowMs);
        if (c.heldAt === null) progress.set(withTiming(0, { duration: left, easing: Easing.linear }));
      }
      if (restartRing) {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => sync(false), Math.max(0, countdownHidesAt(c) - now) + 16);
      }
    }
    touch.current = {
      hold: () => {
        cd.current = holdCountdown(cd.current, Date.now());
        sync(true);
      },
      release: () => {
        cd.current = releaseCountdown(cd.current, Date.now());
        sync(true);
      },
    };
    sync(true);
    const tick = setInterval(() => sync(false), TICK_MS);
    // Wall clock across background: on return it's either gone at once or the ring is put back where it belongs.
    // A hold can't outlast the app leaving the screen (no touch-up arrives then).
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && cd.current.heldAt !== null) cd.current = releaseCountdown(cd.current, Date.now());
      sync(true);
    });
    return () => {
      clearInterval(tick);
      if (hideTimer) clearTimeout(hideTimer);
      sub.remove();
      cancelAnimation(progress);
    };
  }, [toast.id, reduceMotion, progress]);

  const hold = () => touch.current.hold();
  const release = () => touch.current.release();

  return (
    <Animated.View
      entering={reduceMotion ? FadeIn.duration(150) : FadeInDown.duration(220)}
      exiting={FadeOut.duration(150)}
      accessibilityLiveRegion="polite"
      style={{
        maxWidth: '100%', borderRadius: stacked ? 24 : 999, borderCurve: 'continuous',
        backgroundColor: scheme === 'dark' ? colors.surface2 : colors.surface, borderWidth: 1, borderColor: colors.line, boxShadow: shadow.card,
      }}
    >
      {/* Holding anywhere on the toast pauses it. A touch watcher, not a Pressable: Undo is the toast's only
          control (no control nested in a control) and pauses it on its own press too. */}
      <View
        onTouchStart={hold}
        onTouchEnd={release}
        onTouchCancel={release}
        style={{
          flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: stacked ? 0 : 12, minHeight: size.hit,
          paddingLeft: 16, paddingRight: toast.undo && !stacked ? 8 : 16, paddingTop: stacked ? 8 : 4, paddingBottom: 4,
        }}
      >
        <KText variant="subheadline" style={{ flexShrink: 1, paddingVertical: 8 }}>
          {toast.text}
        </KText>
        {toast.undo ? (
          <Pressable
            onPressIn={hold}
            onPressOut={release}
            onPress={() => {
              hideToast(toast.id);
              void toast.undo?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('common.undo')}
            style={({ pressed }) => ({
              flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: size.hit, paddingHorizontal: 8,
              ...(stacked ? { alignSelf: 'flex-end' as const, marginRight: -8 } : {}),
              opacity: pressed ? opacity.pressed : 1,
            })}
          >
            <UndoRing progress={progress} seconds={seconds} />
            <KText role="textLink">{t('common.undo')}</KText>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** The ring and the whole seconds left inside it. Decoration for VoiceOver (the time was announced once). */
function UndoRing({ progress, seconds }: { progress: SharedValue<number>; seconds: number }) {
  const { colors, fontScale } = useTheme();
  const d = Math.round(UNDO_RING_PT * Math.min(Math.max(fontScale, 1), CONTROL_TEXT_MAX_SCALE));
  const stroke = d >= 36 ? 3 : 2;
  const r = (d - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const arc = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    // A round cap would leave a dot at empty.
    strokeOpacity: progress.value > 0.005 ? 1 : 0,
  }));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: d, height: d, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={d} height={d} style={StyleSheet.absoluteFill}>
        <Circle cx={d / 2} cy={d / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={d / 2}
          cy={d / 2}
          r={r}
          stroke={colors.ink}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={[circumference, circumference]}
          transform={`rotate(-90 ${d / 2} ${d / 2})`}
          animatedProps={arc}
        />
      </Svg>
      <KText variant="caption2" weight="600" tabular maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>
        {seconds}
      </KText>
    </View>
  );
}
