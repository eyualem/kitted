// T113 · One card of the style game (specs/style-game.md SG1, SG7 FS1, SG9): the look's drawing, two dots for its two
// outfits, the Me / Not me stamps, the swipe, the tap for the other outfit, card 1's lean and VoiceOver's action.
//
// The swipe is React Native's PanResponder (the app has no gesture-handler root), as Closet's ConfirmDeck. The card
// claims the touch on start (a tap must reach it) and gives it to the scroll view when the finger went 10 pt up or down
// before 12 pt sideways (cardYields). On release: under 6 pt is a tap (the other outfit), past 90 pt an answer, between
// a spring back. An answer (swipe or the dock's buttons, through `ask`) flies the card off from where it is, or
// fades it under Reduce Motion, then the session moves on; a second answer while it leaves is ignored (a double tap).
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, PanResponder, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { KText, space, useTheme } from '@/design-system';
import { shadow } from '@/design-system/tokens';
import type { StyleKey } from '@/data/types';
import { t } from '@/i18n/en';
import { LOOKS } from './looks';
import { Outfit } from './LookTile';
import { cardExit, cardRelease, cardYields, descKey, shouldLean, swipeFeedback } from './styleGame';

export interface GameCardProps {
  look: StyleKey;
  /** 0-based card number. */
  index: number;
  peek: 0 | 1;
  /** Card 1 of this game has leaned (or been touched). */
  leaned: boolean;
  /** Demo only: drawn held at this offset. */
  dragDx?: number;
  width: number;
  /** An answer from the dock's buttons (a new `n` each press): the same exit as a swipe. */
  ask: { me: boolean; n: number } | null;
  onAnswer(me: boolean): void;
  onPeek(): void;
  onLeaned(): void;
  /** The dock's lit button follows the drag. */
  onLit(lit: 'me' | 'notMe' | null): void;
  /** VoiceOver moves to the new card after an answer (SG9). */
  focusOnMount?: boolean;
}

const LEAN_AFTER_MS = 1400;
const LEAN_PT = 18;

/** VoiceOver's words for a card: "Outfit 3 of 8, view 1 of 2. {description}" (founder question F2). */
export function cardLabel(look: StyleKey, index: number, peek: 0 | 1): string {
  return t('game.card.a11y', { n: index + 1, view: peek + 1, desc: t(descKey(look, peek)) });
}

type Callbacks = Pick<GameCardProps, 'onAnswer' | 'onPeek' | 'onLeaned' | 'onLit' | 'leaned' | 'width'> & { reduce: boolean; setStamp(s: 'me' | 'notMe'): void };

/** One card's touch and motion, made once per card (its timers and the pan handlers live here, not in render). */
class CardMotion {
  readonly x: Animated.Value;
  readonly fade = new Animated.Value(1);
  readonly pan: ReturnType<typeof PanResponder.create>;
  private cb: Callbacks | null = null;
  private leaving = false;
  private exitTimer: ReturnType<typeof setTimeout> | null = null;
  private leanTimer: ReturnType<typeof setTimeout> | null = null;
  private touch = { out: false, sideways: false, lit: null as 'me' | 'notMe' | null };

  constructor(dx: number) {
    this.x = new Animated.Value(dx);
    this.pan = PanResponder.create({
      onStartShouldSetPanResponder: () => !this.leaving,
      onMoveShouldSetPanResponder: () => !this.leaving,
      onPanResponderGrant: () => this.grant(),
      onPanResponderMove: (_e, g) => this.move(g.dx),
      onPanResponderTerminationRequest: (_e, g) => !this.touch.sideways && cardYields(g.dx, g.dy),
      onPanResponderTerminate: () => this.springBack(),
      onPanResponderRelease: (_e, g) => this.release(g.dx, g.dy),
    });
  }

  update(cb: Callbacks) {
    this.cb = cb;
  }

  /** An answer: the matching stamp, then the card flies off (or fades under Reduce Motion), then the session moves on.
   *  A second one while it leaves is ignored (a double tap). */
  leave(me: boolean) {
    const cb = this.cb;
    if (this.leaving || !cb) return;
    this.leaving = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb.setStamp(me ? 'me' : 'notMe');
    cb.onLit(null);
    const exit = cardExit(cb.reduce);
    if (exit.kind === 'fly') Animated.timing(this.x, { toValue: (me ? 1 : -1) * (cb.width + 240), duration: exit.ms, useNativeDriver: true }).start();
    else Animated.timing(this.fade, { toValue: 0, duration: exit.ms, useNativeDriver: true }).start();
    this.exitTimer = setTimeout(() => this.cb?.onAnswer(me), exit.ms);
  }

  /** SG1.3: the lean, 1.4 s after card 1 shows. Returns its cancel. */
  scheduleLean(): () => void {
    this.leanTimer = setTimeout(() => {
      this.leanTimer = null;
      this.cb?.onLeaned();
      Animated.sequence([
        Animated.timing(this.x, { toValue: LEAN_PT, duration: 280, useNativeDriver: true }),
        Animated.timing(this.x, { toValue: -LEAN_PT, duration: 380, useNativeDriver: true }),
        Animated.timing(this.x, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }, LEAN_AFTER_MS);
    return () => this.cancelLean();
  }

  dispose() {
    if (this.exitTimer) clearTimeout(this.exitTimer);
    this.cancelLean();
  }

  private cancelLean() {
    if (this.leanTimer) clearTimeout(this.leanTimer);
    this.leanTimer = null;
  }

  private grant() {
    // A touch first cancels the lean and counts as it.
    this.cancelLean();
    if (this.cb && !this.cb.leaned) this.cb.onLeaned();
    this.x.stopAnimation();
    this.x.setValue(0);
    this.touch = { out: false, sideways: false, lit: null };
  }

  private move(dx: number) {
    if (this.leaving) return;
    this.x.setValue(dx);
    if (Math.abs(dx) >= 12) this.touch.sideways = true;
    const fb = swipeFeedback(dx);
    const out = fb.lit !== null;
    // A tick each time it crosses the line outward.
    if (out && !this.touch.out) void Haptics.selectionAsync();
    this.touch.out = out;
    if (fb.lit !== this.touch.lit) {
      this.touch.lit = fb.lit;
      this.cb?.onLit(fb.lit);
    }
  }

  private springBack() {
    this.touch.lit = null;
    this.cb?.onLit(null);
    Animated.spring(this.x, { toValue: 0, useNativeDriver: true }).start();
  }

  private release(dx: number, dy: number) {
    if (this.leaving) return;
    const r = cardRelease(dx, dy);
    if (r === 'peek') {
      this.x.setValue(0);
      this.cb?.onPeek();
    } else if (r === 'spring') this.springBack();
    else this.leave(r === 'me');
  }
}

export function GameCard({ look, index, peek, leaned, dragDx, width, ask, onAnswer, onPeek, onLeaned, onLit, focusOnMount }: GameCardProps) {
  const { colors, a11y, scheme } = useTheme();
  const reduce = a11y.reduceMotion;
  const [motion] = useState(() => new CardMotion(dragDx ?? 0));
  const [stamp, setStamp] = useState<'me' | 'notMe' | null>(null);
  const x = motion.x;
  useEffect(() => {
    motion.update({ onAnswer, onPeek, onLeaned, onLit, leaned, width, reduce, setStamp });
  }, [motion, onAnswer, onPeek, onLeaned, onLit, leaned, width, reduce]);
  useEffect(() => () => motion.dispose(), [motion]);
  // The dock's Me / Not me: only presses made while this card is up (one made for an earlier card is spent).
  const [askedBefore] = useState(() => ask?.n ?? 0);
  useEffect(() => {
    if (ask && ask.n > askedBefore) motion.leave(ask.me);
  }, [ask, askedBefore, motion]);

  const node = useRef<View>(null);
  useEffect(() => {
    if (!focusOnMount) return;
    const id = setTimeout(() => {
      const tag = node.current ? findNodeHandle(node.current) : null;
      if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
    }, 100);
    return () => clearTimeout(id);
  }, [focusOnMount]);

  // SG1.3: card 1 leans right then left once, never under Reduce Motion.
  const lean = shouldLean(index, leaned, reduce) && dragDx === undefined;
  useEffect(() => (lean ? motion.scheduleLean() : undefined), [lean, motion]);

  const outfit = LOOKS.find((l) => l.style === look)!.outfits[peek];
  const meOpacity = stamp === 'me' ? 1 : stamp === 'notMe' ? 0 : x.interpolate({ inputRange: [0, 90], outputRange: [0, 1], extrapolate: 'clamp' });
  const notMeOpacity = stamp === 'notMe' ? 1 : stamp === 'me' ? 0 : x.interpolate({ inputRange: [-90, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const rotate = x.interpolate({ inputRange: [-220, 0, 220], outputRange: ['-10deg', '0deg', '10deg'] });
  const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  const drawW = Math.round(width * 0.57);

  return (
    <Animated.View
      ref={node}
      testID="game-card"
      {...motion.pan.panHandlers}
      accessible
      accessibilityLabel={cardLabel(look, index, peek)}
      accessibilityActions={[{ name: 'anotherOutfit', label: t('game.anotherOutfit') }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'anotherOutfit') onPeek();
      }}
      style={[
        styles.card,
        { width, backgroundColor: colors.surface, borderColor: colors.line, boxShadow: scheme === 'light' ? shadow.card : undefined },
        { opacity: motion.fade, transform: [{ translateX: x }, { rotate }] },
      ]}
    >
      <View style={[styles.art, { backgroundColor: colors.surface2 }]} {...hidden}>
        <Outfit outfit={outfit} w={drawW} />
      </View>
      <View style={styles.dots} {...hidden}>
        {([0, 1] as const).map((i) => (
          <View
            key={i}
            testID={`game-card-dot-${i}`}
            {...hidden}
            style={[styles.dot, { backgroundColor: i === peek ? colors.ink : colors.inkFaint, opacity: i === peek ? 0.85 : 0.5 }]}
          />
        ))}
      </View>
      <Animated.View testID="game-stamp-me" {...hidden} pointerEvents="none" style={[styles.stamp, styles.stampMe, { backgroundColor: colors.primary, opacity: meOpacity }]}>
        <KText variant="headline" weight="700" color="onPrimary" maxFontSizeMultiplier={1.4}>
          {t('game.me')}
        </KText>
      </Animated.View>
      <Animated.View testID="game-stamp-notme" {...hidden} pointerEvents="none" style={[styles.stamp, styles.stampNotMe, { borderColor: colors.ink, backgroundColor: colors.surface, opacity: notMeOpacity }]}>
        <KText variant="headline" weight="700" maxFontSizeMultiplier={1.4}>
          {t('game.notMe')}
        </KText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'center', borderWidth: 1, borderRadius: 18, borderCurve: 'continuous', padding: space.m, gap: space.m },
  art: { alignItems: 'center', borderRadius: 14, borderCurve: 'continuous', paddingVertical: space.l },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stamp: { position: 'absolute', top: space.xl, paddingHorizontal: space.m, paddingVertical: space.xs, borderRadius: 10 },
  stampMe: { left: space.l, transform: [{ rotate: '-10deg' }] },
  stampNotMe: { right: space.l, borderWidth: 2, transform: [{ rotate: '10deg' }] },
});
