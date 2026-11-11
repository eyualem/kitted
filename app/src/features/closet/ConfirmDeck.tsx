// Closet's To confirm deck (specs/closet-beta.md CB2; DECISIONS-LOG #412): one card at a time, "2 of 5" in its tag
// line. Skip and a sideways swipe show the next card (a swipe right the previous one), wrapping, saving nothing; an
// answer gets a light haptic on the tap and the card moves on once the store drops the question (an answer that didn't
// land leaves it where it is); Undo brings it back as the card on screen. The cards slide 16 pt apart over 240 ms and
// the height eases with them; with Reduce Motion every change is a 150 ms cross-fade and heights jump. VoiceOver never
// needs the swipe: focus moves to the new question after each change (after an answer, once the toast's line is read).
// The swipe is React Native's PanResponder (the app has no gesture-handler root): it claims the touch after 12 pt
// sideways, never after 10 pt up or down first, and the screen stops scrolling while it holds.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import {
  AccessibilityInfo, Animated, Easing, findNodeHandle, PanResponder, Platform, Pressable, View, useWindowDimensions,
  type GestureResponderEvent, type LayoutChangeEvent, type PanResponderGestureState,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, KCard, KCardSection, TagLine, space, useTheme } from '@/design-system';
import {
  cardMotion, confirmRowA11y, deckA11y, deckCount, deckTag, DECK_MOTION, followsFinger, markAnswered, reconcileDeck, showsSkip, startDeck, stepDeck,
  swipeStart, swipeStep, type DeckCard, type DeckMove, type DeckState,
} from './toConfirm';

/** What each card gets from the deck. */
export interface DeckSlot {
  /** This card's place now. */
  n: number;
  total: number;
  /** "Question 2 of 5." */
  a11yPrefix: string;
  showSkip: boolean;
  /** A question's Skip and its VoiceOver "Skip": the next card, nothing saved, no haptic. */
  next(): void;
  /** An answer chip asks first: false for a second tap on the same card within a second (ignored). */
  willAnswer(): boolean;
  /** The card's question element, for VoiceOver focus. */
  focusRef(node: View | null): void;
}

export interface ConfirmDeckProps<Q extends { ask: { obsId: string } }, F extends { item: { id: string } }> {
  cards: readonly DeckCard<Q, F>[];
  /** The tag line's left words ("To confirm"). */
  tag: string;
  renderCard(card: DeckCard<Q, F>, slot: DeckSlot): ReactNode;
  /** True while a swipe holds the touch (the screen stops scrolling). */
  onSwipingChange?(swiping: boolean): void;
  /** Once, when the deck goes from 1+ cards to none. */
  onEmptied?(): void;
  /** Folds the card back to its one-line row (CB2 "Folded"): a tap on the tag line, or VoiceOver's fold button. */
  onFold?(): void;
  /** Folded: the deck stays mounted (it keeps its card) but draws out of sight. */
  folded?: boolean;
}

/** A second answer tap on the same card within this long is ignored (the card stays until the store drops it). */
const DOUBLE_TAP_MS = 1000;
/** After an answer, focus waits for the toast's announcement at most this long. */
const ANNOUNCE_CAP_MS = 1500;

type Card<Q, F> = DeckCard<Q, F>;

/** One change of card: what leaves, how, and where focus goes when it's done. */
interface Transition<Q, F> {
  seq: number;
  move: Exclude<DeckMove, 'none'>;
  /** The card leaving (forward, back, empty), with the place it had. */
  from: { card: Card<Q, F>; n: number; total: number } | null;
  kind: 'slide' | 'fade';
  /** Where the slide starts (0–1): a swipe hands over the part it already moved. */
  p0: number;
  /** The animation's length, and the whole change's (the height's 240 ms on appear/empty). */
  animMs: number;
  totalMs: number;
  /** The card's width plus the 16 pt between cards. */
  span: number;
  /** The section's height eases from this height (null: it jumps, as with Reduce Motion). */
  heightFrom: number | null;
  focus: 'now' | 'afterAnnouncement' | 'none';
}

interface Deck<Q, F> {
  state: DeckState;
  keys: string[];
  sig: string;
  cards: readonly Card<Q, F>[];
  tr: Transition<Q, F> | null;
  /** The last transition whose motion has ended. */
  settled: number;
  /** The last answer tap (the double-tap guard). */
  last: { key: string; at: number } | null;
}

const noop = () => {};
const never = () => false;

function changeOf<Q, F>(
  prev: Deck<Q, F>, move: Exclude<DeckMove, 'none'>, o: { reduce: boolean; width: number; height: number; fromX?: number; focus: Transition<Q, F>['focus'] },
): Transition<Q, F> {
  const key = prev.state.key;
  const card = move === 'appear' || !key ? undefined : prev.cards.find((c) => c.key === key);
  const span = o.width + DECK_MOTION.gap;
  const motion = cardMotion(o.reduce);
  const sideways = move === 'forward' || move === 'back';
  const slide = sideways && motion.kind === 'slide';
  const p0 = slide && o.fromX ? Math.min(0.95, Math.abs(o.fromX) / span) : 0;
  const animMs = slide ? Math.max(80, Math.round(motion.ms * (1 - p0))) : DECK_MOTION.fadeMs;
  const totalMs = o.reduce || sideways ? animMs : DECK_MOTION.slideMs;
  return {
    seq: (prev.tr?.seq ?? 0) + 1,
    move,
    from: card && key ? { card, ...deckCount(prev.keys, key) } : null,
    kind: slide ? 'slide' : 'fade',
    p0,
    animMs,
    totalMs,
    span,
    heightFrom: o.reduce ? null : move === 'appear' ? 0 : o.height > 0 ? o.height : null,
    focus: o.focus,
  };
}

/** The deck after Skip or a committed swipe: the next (1) or previous (-1) card, nothing saved. */
function stepped<Q, F>(d: Deck<Q, F>, dir: 1 | -1, o: { reduce: boolean; width: number; height: number; fromX: number }): Deck<Q, F> {
  const key = d.state.key;
  if (!key || d.keys.length < 2) return d;
  const tr = changeOf(d, dir === 1 ? 'forward' : 'back', { ...o, focus: 'now' });
  return { ...d, state: { ...d.state, key: stepDeck(d.keys, key, dir) }, tr };
}

export function ConfirmDeck<Q extends { ask: { obsId: string } }, F extends { item: { id: string } }>({
  cards, tag, renderCard, onSwipingChange, onEmptied, onFold, folded,
}: ConfirmDeckProps<Q, F>): ReactElement | null {
  const theme = useTheme();
  // Optional: a test's stand-in theme may have no a11y settings.
  const reduce = (theme.a11y as { reduceMotion?: boolean } | undefined)?.reduceMotion === true;
  const window = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const width = measured > 0 ? measured : Math.max(0, window.width - 2 * space.gutter);
  const keys = cards.map((c) => c.key);
  const sig = keys.join('\n');
  const [deck, setDeck] = useState<Deck<Q, F>>(() => ({ state: startDeck(keys), keys, sig, cards, tr: null, settled: 0, last: null }));
  const [drag, setDrag] = useState<-1 | 0 | 1>(0);
  const [dragX] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(1));
  const [height] = useState(() => new Animated.Value(0));
  const [cardHeight, setCardHeight] = useState(0);
  // The shown card's question element (its ref callback), and the latest of it and onEmptied for the timers below.
  const [focusNode, setFocusNode] = useState<View | null>(null);
  const latest = useRef<{ node: View | null; onEmptied?: () => void }>({ node: null, onEmptied });
  const heightGoal = useRef<{ seq: number; endAt: number } | null>(null);

  // The store's questions changed: an answer landed, Undo, a fit Skip, answered elsewhere, or a new one arrived.
  if (deck.cards !== cards) {
    if (deck.sig !== sig) {
      const r = reconcileDeck(deck.state, deck.keys, keys);
      const prevKey = deck.state.key;
      const answered = prevKey !== null && deck.state.undoKey === prevKey && !keys.includes(prevKey);
      let tr = deck.tr;
      if (r.move !== 'none') {
        const focus: Transition<Q, F>['focus'] =
          r.move === 'appear' ? (deck.state.undoKey && r.state.key === deck.state.undoKey ? 'now' : 'none') : answered ? 'afterAnnouncement' : 'now';
        tr = changeOf(deck, r.move, { reduce, width, height: cardHeight, focus });
      }
      setDeck({ ...deck, state: r.state, keys, sig, cards, tr });
    } else {
      setDeck({ ...deck, cards });
    }
  }

  useEffect(() => {
    latest.current = { node: focusNode, onEmptied };
  });

  const active = deck.tr !== null && deck.settled !== deck.tr.seq ? deck.tr : null;

  // Each change runs once: its motion, then focus (after an answer, once the toast is read), or onEmptied.
  const tr = deck.tr;
  useLayoutEffect(() => {
    if (!tr) return;
    progress.setValue(tr.p0);
    Animated.timing(progress, { toValue: 1, duration: tr.animMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    if (tr.heightFrom !== null) {
      height.setValue(tr.heightFrom);
      heightGoal.current = { seq: tr.seq, endAt: Date.now() + DECK_MOTION.slideMs };
      if (tr.move === 'empty') Animated.timing(height, { toValue: 0, duration: DECK_MOTION.slideMs, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    } else {
      heightGoal.current = null;
    }
    let moved = false;
    let heard = tr.focus !== 'afterAnnouncement';
    let done = false;
    const land = () => {
      if (done || !moved || !heard) return;
      done = true;
      if (tr.move === 'empty') {
        latest.current.onEmptied?.();
        return;
      }
      if (tr.focus === 'none') return;
      const node = latest.current.node;
      const tagId = node ? findNodeHandle(node) : null;
      if (tagId != null) AccessibilityInfo.setAccessibilityFocus(tagId);
    };
    const end = setTimeout(() => {
      moved = true;
      heightGoal.current = null;
      setDeck((d) => (d.tr === tr ? { ...d, settled: tr.seq } : d));
      land();
    }, tr.totalMs);
    let cap: ReturnType<typeof setTimeout> | null = null;
    let sub: { remove(): void } | null = null;
    if (!heard) {
      const hear = () => {
        heard = true;
        land();
      };
      try {
        sub = AccessibilityInfo.addEventListener('announcementFinished', hear);
      } catch {
        sub = null;
      }
      cap = setTimeout(hear, ANNOUNCE_CAP_MS);
    }
    return () => {
      clearTimeout(end);
      if (cap) clearTimeout(cap);
      sub?.remove();
    };
  }, [tr, progress, height]);

  const count = keys.length;
  const skipOn = () => setDeck((d) => stepped(d, 1, { reduce, width, height: cardHeight, fromX: 0 }));

  // The swipe. Made again only when what it reads changes (never mid-drag: a drag changes none of these).
  const pan = useMemo(() => {
    const touch = { failed: false };
    const follow = followsFinger(reduce);
    const end = (g: PanResponderGestureState, commit: boolean) => {
      onSwipingChange?.(false);
      const dir = commit ? swipeStep(g.dx, g.vx * 1000, width, count) : 0;
      if (dir === 0) {
        if (follow) {
          Animated.timing(dragX, { toValue: 0, duration: DECK_MOTION.springMs, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start(() => setDrag(0));
        } else setDrag(0);
        return;
      }
      dragX.setValue(0);
      setDrag(0);
      const fromX = follow ? g.dx : 0;
      setDeck((d) => stepped(d, dir, { reduce, width, height: cardHeight, fromX }));
    };
    const claims = (_e: GestureResponderEvent, g: PanResponderGestureState) => {
      if (touch.failed) return false;
      const s = swipeStart(g.dx, g.dy);
      if (s === 'fail') touch.failed = true;
      return s === 'claim';
    };
    return PanResponder.create({
      // A new touch starts fresh; a drag that went up or down first stays Closet's scroll until the finger lifts.
      onStartShouldSetPanResponderCapture: () => {
        touch.failed = false;
        return false;
      },
      onMoveShouldSetPanResponderCapture: claims,
      onMoveShouldSetPanResponder: claims,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragX.stopAnimation();
        dragX.setValue(0);
        onSwipingChange?.(true);
      },
      onPanResponderMove: (_e, g) => {
        if (!follow) return;
        dragX.setValue(g.dx);
        if (count < 2) return;
        const side = g.dx < 0 ? 1 : g.dx > 0 ? -1 : 0;
        setDrag((d) => (d === side ? d : side));
      },
      onPanResponderRelease: (_e, g) => end(g, true),
      onPanResponderTerminate: (_e, g) => end(g, false),
    });
  }, [reduce, width, cardHeight, count, dragX, onSwipingChange]);

  const current = deck.state.key ? cards.find((c) => c.key === deck.state.key) ?? null : null;
  if (!current && !active?.from) return null;

  const total = count;
  const skip = showsSkip(cards);
  const slotFor = (card: Card<Q, F>, shown: boolean, place?: { n: number; total: number }): DeckSlot => {
    const { n, total: tot } = place ?? deckCount(keys, card.key);
    if (!shown) return { n, total: tot, a11yPrefix: deckA11y(n, tot), showSkip: skip, next: noop, willAnswer: never, focusRef: noop };
    return {
      n, total: tot, a11yPrefix: deckA11y(n, tot), showSkip: skip,
      next: skipOn,
      willAnswer: () => {
        const now = Date.now();
        const last = deck.last;
        if (last && last.key === card.key && now - last.at < DOUBLE_TAP_MS) return false;
        if (Platform.OS === 'ios') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setDeck((d) => ({ ...d, state: markAnswered(d.state, card.key), last: { key: card.key, at: now } }));
        return true;
      },
      focusRef: setFocusNode,
    };
  };
  const face = (card: Card<Q, F>, slot: DeckSlot, shown: boolean) => (
    <KCard>
      <KCardSection gap={12}>
        {/* Open (CB2 "Folded", Nov 10): a tap on the tag line folds the card, its chevron turned up. Hidden from
            VoiceOver like the tag (the question comes first); VoiceOver has its own fold button after the answers. */}
        <Pressable
          onPress={onFold}
          disabled={!onFold || !shown}
          hitSlop={{ top: 10, bottom: 10 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: onFold ? 24 : undefined }}
        >
          <View testID={shown ? 'closet-confirm-tag' : undefined} style={{ flex: 1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <TagLine left={tag} right={deckTag(slot.n, slot.total)} />
          </View>
          {onFold ? (
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon name="chevronDown" size={10} weight="semibold" color="ink2" scalesWithText />
            </View>
          ) : null}
        </Pressable>
        {renderCard(card, slot)}
        {/* VoiceOver's fold, after the question and its answers (the question stays first), over the tag line. */}
        {shown && onFold ? (
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={confirmRowA11y(tag, slot.total)}
            accessibilityState={{ expanded: true }}
            onAccessibilityTap={onFold}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44 }}
          />
        ) : null}
      </KCardSection>
    </KCard>
  );

  const onCardLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (h !== cardHeight) setCardHeight(h);
    if (w > 0 && w !== measured) setMeasured(w);
    const goal = heightGoal.current;
    if (goal) Animated.timing(height, { toValue: h, duration: Math.max(60, goal.endAt - Date.now()), easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  };

  // Where each card sits: while a change runs, the slide (or the fade); otherwise the finger.
  const span = active?.span ?? width + DECK_MOTION.gap;
  const dir = active?.move === 'back' ? -1 : 1;
  const sliding = active?.kind === 'slide';
  const inStyle = active
    ? sliding
      ? { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [dir * span, 0] }) }] }
      : { opacity: progress }
    : followsFinger(reduce)
      ? { transform: [{ translateX: dragX }] }
      : null;
  const outStyle = active
    ? sliding
      ? { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -dir * span] }) }] }
      : { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }
    : null;
  const neighbour = !active && drag !== 0 && current && followsFinger(reduce) && keys.length > 1
    ? cards.find((c) => c.key === stepDeck(keys, current.key, drag))
    : undefined;
  const locked = active !== null && active.heightFrom !== null;
  const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, pointerEvents: 'none' as const };
  const over = { position: 'absolute' as const, top: 0, left: 0, right: 0 };

  return (
    <Animated.View
      testID="closet-confirm-deck"
      style={[
        locked ? { height, marginBottom: height.interpolate({ inputRange: [0, space.stack], outputRange: [-space.stack, 0], extrapolate: 'clamp' }) } : null,
        folded ? { display: 'none' } : null,
      ]}
    >
      {active?.from ? (
        <Animated.View {...hidden} style={[over, outStyle]}>
          {face(active.from.card, slotFor(active.from.card, false, active.from), false)}
        </Animated.View>
      ) : null}
      {current ? (
        <Animated.View key={current.key} testID="closet-confirm-card" onLayout={onCardLayout} style={inStyle} {...pan.panHandlers}>
          {face(current, slotFor(current, true, { n: deckCount(keys, current.key).n, total }), true)}
        </Animated.View>
      ) : null}
      {neighbour ? (
        <Animated.View {...hidden} style={[over, { transform: [{ translateX: Animated.add(dragX, drag * span) }] }]}>
          {face(neighbour, slotFor(neighbour, false), false)}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/** Folded (CB2 "Folded", Nov 10): one row, "To confirm", the number waiting, a chevron; a tap opens the card. */
export function ConfirmFoldRow({ tag, total, onOpen }: { tag: string; total: number; onOpen(): void }): ReactElement | null {
  if (total === 0) return null;
  return (
    <KCard>
      <Pressable
        testID="closet-confirm-folded"
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={confirmRowA11y(tag, total)}
        accessibilityState={{ expanded: false }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: 44, paddingHorizontal: space.rowX, paddingVertical: space.s }}
      >
        <View style={{ flex: 1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <TagLine left={tag} right={String(total)} />
        </View>
        <Icon name="chevronDown" size={10} weight="semibold" color="ink2" scalesWithText />
      </Pressable>
    </KCard>
  );
}
