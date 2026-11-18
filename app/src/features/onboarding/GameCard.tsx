// T113 · One card of the style game (specs/style-game.md SG1, SG7 FS1, SG9): the look's drawing, two dots for its two
// outfits, the Me / Not me stamps, the swipe, the tap for the other outfit, card 1's lean and VoiceOver's action.
//
// The swipe is React Native's PanResponder (the app has no gesture-handler root), as Closet's ConfirmDeck. The card
// claims the touch on start (a tap must reach it) and gives it to the scroll view when the finger went 10 pt up or down
// before 12 pt sideways (cardYields). On release: under 6 pt is a tap (the other outfit), past 90 pt an answer, between
// a spring back. An answer (swipe or the dock's buttons, through `ref.leave`) flies the card off from where it is, or
// fades it under Reduce Motion, then the session moves on; a second answer while it leaves is ignored (a double tap).
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, PanResponder, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { KText, space, useTheme } from '@/design-system';
import { shadow } from '@/design-system/tokens';
import type { StyleKey } from '@/data/types';
import { t } from '@/i18n/en';
import { LOOKS } from './looks';
import { Outfit } from './LookTile';
import { cardExit, cardRelease, cardYields, descKey, shouldLean, swipeFeedback } from './styleGame';

export interface GameCardHandle {
  /** An answer from the dock's buttons: the same exit as a swipe. */
  leave(me: boolean): void;
}

export interface GameCardProps {
  look: StyleKey;
  /** 0-based card number. */
  index: number;
  peek: 0 | 1;
  /** Card 1 of this game hasn't leaned yet. */
  leaned: boolean;
  /** Demo only: drawn held at this offset. */
  dragDx?: number;
  width: number;
  onAnswer(me: boolean): void;
  onPeek(): void;
  onLeaned(): void;
  /** The dock's lit button follows the drag. */
  onLit(lit: 'me' | 'notMe' | null): void;
  /** VoiceOver moves to the new card after an answer (SG9). */
  focusOnMount?: boolean;
  ref?: Ref<GameCardHandle>;
}

const LEAN_AFTER_MS = 1400;
const LEAN_PT = 18;

/** VoiceOver's words for a card: "Outfit 3 of 8, view 1 of 2. {description}" (founder question F2). */
export function cardLabel(look: StyleKey, index: number, peek: 0 | 1): string {
  return t('game.card.a11y', { n: index + 1, view: peek + 1, desc: t(descKey(look, peek)) });
}

export function GameCard({ look, index, peek, leaned, dragDx, width, onAnswer, onPeek, onLeaned, onLit, focusOnMount, ref }: GameCardProps) {
  const { colors, a11y, scheme } = useTheme();
  const reduce = a11y.reduceMotion;
  const [x] = useState(() => new Animated.Value(dragDx ?? 0));
  const [fade] = useState(() => new Animated.Value(1));
  const [stamp, setStamp] = useState<'me' | 'notMe' | null>(null);
  const leaving = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest callbacks for the pan handlers, which are made once.
  const latest = useRef({ onAnswer, onPeek, onLeaned, onLit, leaned, reduce, width });
  useEffect(() => {
    latest.current = { onAnswer, onPeek, onLeaned, onLit, leaned, reduce, width };
  });

  const leave = (me: boolean) => {
    if (leaving.current) return;
    leaving.current = true;
    const l = latest.current;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStamp(me ? 'me' : 'notMe');
    l.onLit(null);
    const exit = cardExit(l.reduce);
    if (exit.kind === 'fly') Animated.timing(x, { toValue: (me ? 1 : -1) * (l.width + 240), duration: exit.ms, useNativeDriver: true }).start();
    else Animated.timing(fade, { toValue: 0, duration: exit.ms, useNativeDriver: true }).start();
    exitTimer.current = setTimeout(() => latest.current.onAnswer(me), exit.ms);
  };
  useImperativeHandle(ref, () => ({ leave }));
  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);
  const node = useRef<View>(null);
  useEffect(() => {
    if (!focusOnMount) return;
    const id = setTimeout(() => {
      const tag = node.current ? findNodeHandle(node.current) : null;
      if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
    }, 100);
    return () => clearTimeout(id);
  }, [focusOnMount]);

  // SG1.3: card 1 leans right then left once, 1.4 s after it shows, never under Reduce Motion. A touch first cancels it.
  const lean = shouldLean(index, leaned, reduce) && dragDx === undefined;
  useEffect(() => {
    if (!lean) return;
    const id = setTimeout(() => {
      leanTimer.current = null;
      latest.current.onLeaned();
      Animated.sequence([
        Animated.timing(x, { toValue: LEAN_PT, duration: 280, useNativeDriver: true }),
        Animated.timing(x, { toValue: -LEAN_PT, duration: 380, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }, LEAN_AFTER_MS);
    leanTimer.current = id;
    return () => {
      clearTimeout(id);
      leanTimer.current = null;
    };
  }, [lean, x]);

  const pan = useMemo(() => {
    const touch = { out: false, sideways: false, lit: null as 'me' | 'notMe' | null };
    const springBack = () => {
      latest.current.onLit(null);
      touch.lit = null;
      Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !leaving.current,
      onMoveShouldSetPanResponder: () => !leaving.current,
      onPanResponderGrant: () => {
        if (leanTimer.current) clearTimeout(leanTimer.current);
        leanTimer.current = null;
        if (!latest.current.leaned) latest.current.onLeaned();
        x.stopAnimation();
        x.setValue(0);
        touch.out = false;
        touch.sideways = false;
        touch.lit = null;
      },
      onPanResponderMove: (_e, g) => {
        if (leaving.current) return;
        x.setValue(g.dx);
        if (Math.abs(g.dx) >= 12) touch.sideways = true;
        const fb = swipeFeedback(g.dx);
        const out = fb.lit !== null;
        if (out && !touch.out) void Haptics.selectionAsync();
        touch.out = out;
        if (fb.lit !== touch.lit) {
          touch.lit = fb.lit;
          latest.current.onLit(fb.lit);
        }
      },
      onPanResponderTerminationRequest: (_e, g) => !touch.sideways && cardYields(g.dx, g.dy),
      onPanResponderTerminate: () => springBack(),
      onPanResponderRelease: (_e, g) => {
        if (leaving.current) return;
        const r = cardRelease(g.dx, g.dy);
        if (r === 'peek') {
          x.setValue(0);
          latest.current.onPeek();
        } else if (r === 'spring') springBack();
        else leave(r === 'me');
      },
    });
    // `leave` reads only refs and the stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x]);

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
      {...pan.panHandlers}
      accessible
      accessibilityLabel={cardLabel(look, index, peek)}
      accessibilityActions={[{ name: 'anotherOutfit', label: t('game.anotherOutfit') }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'anotherOutfit') onPeek();
      }}
      style={[
        styles.card,
        { width, backgroundColor: colors.surface, borderColor: colors.line, boxShadow: scheme === 'light' ? shadow.card : undefined },
        { opacity: fade, transform: [{ translateX: x }, { rotate }] },
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
