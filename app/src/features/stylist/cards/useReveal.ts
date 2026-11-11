// Runs the score reveal / re-check win for one card (the plans and rules: features/fitcheck/reveal.ts).
// The card decides once, on mount, whether this check's result is new to him; if so it starts in the waiting state
// (sizes final, only opacity/transforms move), waits until the score row has settled on screen, then plays once.
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Dimensions, Platform, type GestureResponderEvent, type View } from 'react-native';
import { cancelAnimation, Easing, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { REVEAL_END, useTheme } from '@/design-system';
import { spokenScoreLine } from '@/design-system/score';
import { store } from '@/data/db';
import type { FitCheckRow } from '@/data/types';
import { sessionClock } from '@/state/session';
import {
  checkPlan, fullShownCount, isRevealEligible, noteRevealed, persistRevealed, revealMode, revealSlow, screenReaderOn, tapeValues, watchScreenReader,
  winMode, winPlan, type CheckPlan, type RevealMode, type WinMode, type WinPlan,
} from '@/features/fitcheck/reveal';

watchScreenReader();

/** The list scrolls the new card into view first: wait this long after the score row's layout. */
const SETTLE_MS = 300;
/** Give up waiting for the row to be on screen after this (then play anyway). */
const VISIBLE_WAIT_MS = 3000;
/** The dock (composer + tab bar) covers about this much of the screen's bottom. */
const BOTTOM_COVER = 110;

type Phase = 'wait' | 'run' | 'done';

interface Common {
  /** The timeline (ms); REVEAL_END when nothing plays. */
  t: SharedValue<number>;
  /** True while this mount draws the animated tree (from the first frame until unmount). */
  active: boolean;
  /** A callback ref for the score row (the reveal waits until it's on screen). */
  attachScore: (node: View | null) => void;
  onScoreLayout: () => void;
  /** Tap the card to skip to the final state. */
  touch: { onTouchStart: (e: GestureResponderEvent) => void; onTouchEnd: (e: GestureResponderEvent) => void };
  /** The reveal is over, or never ran: the card is in its final state (the slide into Closet waits for it, SY2.2). */
  done: boolean;
}

export interface CheckReveal extends Common {
  plan: CheckPlan | null;
  values: number[];
}

export interface WinReveal extends Common {
  plan: WinPlan | null;
  values: number[];
  pill: SharedValue<number>;
}

/** The provisional mode on mount (VoiceOver and the full-show count are settled just before it plays). */
function provisionalCheck(row: FitCheckRow, reduceMotion: boolean): RevealMode {
  const eligible = isRevealEligible(row.id, row.details.revealedAt);
  return revealMode(row.score ?? 0, { eligible, revealedAt: row.details.revealedAt, reduceMotion, voiceOver: screenReaderOn(), fullShown: 0 });
}

export function useCheckReveal(row: FitCheckRow, fixCount: number, opts: { announce: boolean }): CheckReveal {
  const { a11y } = useTheme();
  const score = row.score ?? 0;
  const [mode, setMode] = useState<RevealMode>(() => provisionalCheck(row, a11y.reduceMotion));
  const [active] = useState(() => mode !== 'none' && mode !== 'voiceOver');
  // Once the animated tree is up it stays (a switch back would re-measure the numeral); VoiceOver turning on before it
  // plays just jumps the timeline to the end.
  const plan = useMemo(() => (active ? checkPlan(mode === 'none' || mode === 'voiceOver' ? 'full' : mode, fixCount) : null), [mode, fixCount, active]);
  const values = useMemo(() => tapeValues(score), [score]);
  const run = useRunner({
    row, active: mode !== 'none' && (active || mode === 'voiceOver'), total: plan?.total ?? 0, lockAt: plan?.lock.at ?? 0,
    haptic: () => { if (plan?.haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); },
    announceText: () => spokenNew(row),
    announce: opts.announce,
    decide: async () => {
      if (screenReaderOn()) return { mode: 'voiceOver' as const, full: false };
      if (mode === 'full' || mode === 'short') {
        const next = revealMode(score, { eligible: true, reduceMotion: a11y.reduceMotion, voiceOver: false, fullShown: await fullShownCount(store) });
        if (next !== mode) setMode(next);
        return { mode: next, full: next === 'full' };
      }
      return { mode, full: false };
    },
    onVoiceOver: () => setMode('voiceOver'),
  });
  return { ...run, active, plan, values };
}

/** `enabled: false` for the re-check cards that show no change (the same photo, the change not seen): nothing plays. */
export function useWinReveal(row: FitCheckRow, was: number, opts: { announce: boolean; enabled: boolean }): WinReveal {
  const { a11y } = useTheme();
  const now = row.score ?? 0;
  const [mode, setMode] = useState<WinMode>(() => {
    const eligible = opts.enabled && isRevealEligible(row.id, row.details.revealedAt);
    return winMode(was, now, { eligible, revealedAt: row.details.revealedAt, reduceMotion: a11y.reduceMotion, voiceOver: screenReaderOn() });
  });
  // An eligible re-check that didn't go up plays nothing but is still marked, so it never plays later.
  const [eligibleFlat] = useState(() => mode === 'none' && opts.enabled && isRevealEligible(row.id, row.details.revealedAt));
  const [active] = useState(() => mode === 'win' || mode === 'reduced');
  const plan = useMemo(() => (active ? winPlan(mode === 'reduced' ? 'reduced' : 'win') : null), [mode, active]);
  const values = useMemo(() => tapeValues(now, was), [now, was]);
  const pill = useSharedValue(active && plan?.pillSpring ? 0 : 1);
  useEffect(() => {
    if (eligibleFlat) {
      noteRevealed(row.id);
      void persistRevealed(store, row.id, sessionClock.nowMs(), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const run = useRunner({
    row, active: active || mode === 'voiceOver', total: plan?.total ?? 0, lockAt: plan?.lock.at ?? 0,
    haptic: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), // the only Success haptic in the app
    onLock: () => { if (plan?.pillSpring) pill.set(withSpring(1, { dampingRatio: 0.7, duration: 450 })); },
    onSkip: () => { cancelAnimation(pill); pill.set(1); },
    announceText: () => spokenChange(row, was),
    announce: opts.announce,
    decide: async () => (screenReaderOn() ? { mode: 'voiceOver' as const, full: false } : { mode, full: false }),
    onVoiceOver: () => setMode('voiceOver'),
  });
  return { ...run, active, plan, values, pill };
}

// Spoken lines (once: at the lock, or at once under VoiceOver).
const spokenNew = (row: FitCheckRow) => spokenScoreLine(row.score ?? 0);
const spokenChange = (row: FitCheckRow, was: number) => spokenScoreLine(row.score ?? 0, was);

interface RunnerOpts {
  row: FitCheckRow;
  /** Something to do on this mount (an animation, or the VoiceOver announcement). */
  active: boolean;
  total: number;
  lockAt: number;
  haptic: () => void;
  onLock?: () => void;
  onSkip?: () => void;
  announceText: () => string;
  announce: boolean;
  /** Just before it plays: the final mode, and whether it counts as one of the full shows. */
  decide: () => Promise<{ mode: string; full: boolean }>;
  onVoiceOver: () => void;
}

function useRunner(o: RunnerOpts): Omit<Common, 'active'> {
  const t = useSharedValue(o.active ? 0 : REVEAL_END);
  const node = useRef<View | null>(null);
  const attachScore = useCallback((v: View | null) => {
    node.current = v;
  }, []);
  const [laidOut, setLaidOut] = useState(false);
  const [phase, setPhase] = useState<Phase>(o.active ? 'wait' : 'done');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ref = useRef(o);
  useLayoutEffect(() => {
    ref.current = o;
  });
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const finish = useCallback(() => {
    clear();
    cancelAnimation(t);
    t.set(REVEAL_END);
    ref.current.onSkip?.();
    setPhase('done');
  }, [t]);

  // Wait: the score row laid out, a settle, then on screen (or give up waiting), then decide and play.
  useEffect(() => {
    if (phase !== 'wait' || !laidOut) return;
    let alive = true;
    const started = Date.now();
    const check = () => {
      if (!alive) return;
      const v = node.current;
      const go = () => void start();
      if (!v || Date.now() - started > VISIBLE_WAIT_MS) return go();
      v.measureInWindow((_x, y, _w, h) => {
        if (!alive) return;
        const H = Dimensions.get('window').height;
        const onScreen = h > 0 && y >= 40 && y + h <= H - BOTTOM_COVER && AppState.currentState === 'active';
        if (onScreen) go();
        else timers.current.push(setTimeout(check, 120));
      });
    };
    const start = async () => {
      if (!alive) return;
      const { row } = ref.current;
      noteRevealed(row.id);
      const d = await ref.current.decide();
      if (!alive) return;
      void persistRevealed(store, row.id, sessionClock.nowMs(), d.full);
      if (d.mode === 'voiceOver') {
        // No animation: the final card at once and one announcement.
        ref.current.onVoiceOver();
        t.set(REVEAL_END);
        if (ref.current.announce) AccessibilityInfo.announceForAccessibility?.(ref.current.announceText());
        setPhase('done');
        return;
      }
      setPhase('run');
    };
    timers.current.push(setTimeout(check, SETTLE_MS));
    return () => {
      alive = false;
      clear();
    };
  }, [phase, laidOut, t]);

  // Run (a render after `decide`, so the styles use the final plan).
  useEffect(() => {
    if (phase !== 'run') return;
    const slow = revealSlow();
    const { total, lockAt } = ref.current;
    t.set(0);
    t.set(withTiming(total, { duration: total * slow, easing: Easing.linear }));
    timers.current.push(setTimeout(() => {
      if (Platform.OS === 'ios') ref.current.haptic();
      ref.current.onLock?.();
      if (ref.current.announce && screenReaderOn()) AccessibilityInfo.announceForAccessibility?.(ref.current.announceText());
    }, lockAt * slow));
    timers.current.push(setTimeout(() => setPhase('done'), total * slow + 50));
    return clear;
  }, [phase, t]);

  useEffect(() => () => clear(), []);

  // Tap the card (a tap, not a scroll) to skip to the end.
  const down = useRef<{ x: number; y: number; at: number } | null>(null);
  const touch = useMemo(() => ({
    onTouchStart: (e: GestureResponderEvent) => {
      down.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, at: Date.now() };
    },
    onTouchEnd: (e: GestureResponderEvent) => {
      const d = down.current;
      down.current = null;
      if (!d || phase === 'done') return;
      const moved = Math.hypot(e.nativeEvent.pageX - d.x, e.nativeEvent.pageY - d.y);
      if (moved < 10 && Date.now() - d.at < 500) {
        if (phase === 'wait') {
          noteRevealed(ref.current.row.id);
          void persistRevealed(store, ref.current.row.id, sessionClock.nowMs(), false);
        }
        finish();
      }
    },
  }), [phase, finish]);

  const waiting = phase === 'wait';
  const onScoreLayout = useCallback(() => {
    if (waiting) setLaidOut(true);
  }, [waiting]);
  return { t, attachScore, onScoreLayout, touch, done: phase === 'done' };
}
