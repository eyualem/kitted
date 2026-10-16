// S1 Stylist (02 D12): today's thread (newest at the bottom) and the composer.
// Chats are kept by day (founder, Oct 9): this is today's (4 am day key); earlier days open from
// "Past chats". A day is a handful of rows, so a plain ScrollView, not a FlatList: it scrolls to
// its real end (FlatList's cached row heights stopped short as cards grew), and iOS 26 can shrink
// the tab bar on scroll only when the screen's first view is a ScrollView (FlatList unsupported).
// Not inverted: on iOS 26 the scroll-edge fade washes out a flipped list (DECISIONS-LOG #25).
// The "Ask your stylist…" bar is the tab bar's accessory (StylistBar); tapping it opens the dock
// here, which rides the keyboard. No KeyboardAvoidingView: its padding stacked on the dock's fixed
// bottom. The thread's footer grows with the dock instead, the scroll offset following, so the
// newest message stays in view.
// A question's answer streams into an in-memory row drawn after the thread (features/ask/live.ts), so the chat
// table is written once per answer, not per word.
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, Keyboard, Platform, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { scrollTo, useAnimatedKeyboard, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useScrollOffset, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { dayKey } from '@kitted/core';
import { Icon, KText, opacity, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { clearStylistAction, usePendingStylistAction } from '@/router/stylistAction';
import { sessionClock } from '@/state/session';
import { setToastFloor, useToast } from '@/features/toast/toast';
import { morning } from '@/features/morning';
import { useAskInFlight, useLiveAnswer } from '@/features/ask/live';
import { LiveAnswerRow, liveRowShows } from '@/features/ask/LiveAnswerRow';
import { Composer } from './Composer';
import { sendQuestion } from './ask';
import { ACCESSORY_H, COMPOSER_BOTTOM, DOCK_GAP, KEYBOARD_GAP, THREAD_PAD } from './layout';
import { ThreadRow } from './MessageView';
import { buildThreadItems, splitToday } from './thread';
import { composerState, useComposerOpen } from './composerState';
import { t } from '@/i18n/en';
import { useAccountOffer } from '@/features/account/offerSession';
import { useFinishSequence } from '@/features/finish/session';

/** No tab-bar accessory off iOS (the web preview): the composer stays docked. */
const DOCK_ALWAYS = Platform.OS !== 'ios';

const EXCHANGE_MS = 10 * 60_000;
const SHEET_DISMISS_MS = 400;
/** Room a toast takes above the dock (44 tall + 8 gap + a little air), DECISIONS-LOG #56. */
const TOAST_ROOM = 56;

export function StylistScreen() {
  const { colors } = useTheme();
  const loaded = useLive(['chat'], () => store.chat.all(), []);
  const all = useMemo(() => loaded ?? [], [loaded]);
  const now = sessionClock.nowMs();
  const { today: messages, hasEarlier } = useMemo(() => splitToday(all, now, sessionClock.offset), [all, now]);
  const live = useLiveAnswer();
  const askInFlight = useAskInFlight();
  // While Retry streams, the failed line it replaces steps aside for the live row.
  const replaced = live?.replaces ?? null;
  const shown = useMemo(() => (replaced ? messages.filter((m) => m.id !== replaced) : messages), [messages, replaced]);
  const items = useMemo(() => buildThreadItems(shown, now, sessionClock.offset), [shown, now]);
  const shownIds = useMemo(() => new Set(shown.map((m) => m.id)), [shown]);
  const showLive = liveRowShows(live, shownIds);
  const open = useComposerOpen();
  const docked = DOCK_ALWAYS || open !== null;
  // Leaving the tab closes an empty composer; the accessory comes back with the thread.
  useFocusEffect(useCallback(() => () => composerState.close(), []));
  const lastUser = messages.filter((m) => m.role === 'user').reduce((a, m) => Math.max(a, m.createdAt), 0);
  const mode = now - lastUser < EXCHANGE_MS ? 'compact' : 'idle';
  const openCamera = () => router.push('/camera');

  const list = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(list);
  const keyboard = useAnimatedKeyboard();
  // How far the dock rises above its resting spot (0 with the keyboard down).
  const lift = useDerivedValue(() => Math.max(0, keyboard.height.value + KEYBOARD_GAP - COMPOSER_BOTTOM));
  useAnimatedReaction(
    () => lift.value,
    (now, before) => {
      if (before === null || now === before) return;
      scrollTo(list, 0, Math.max(0, scrollY.value + now - before), false);
    },
  );
  // A toast sits just above the dock, which used to cover the newest card's buttons ("Logged for
  // today" over Wear this). While one shows, the thread makes room for it and, if he's at the
  // bottom, moves up with it, like the keyboard.
  const toast = useToast();
  const toastRoom = useSharedValue(0);
  const follow = useSharedValue(1);
  useEffect(() => {
    toastRoom.set(withTiming(toast ? TOAST_ROOM : 0, { duration: 220 }));
  }, [toast, toastRoom]);
  useAnimatedReaction(
    () => toastRoom.value,
    (now, before) => {
      if (before === null || now === before || !follow.value) return;
      scrollTo(list, 0, Math.max(0, scrollY.value + now - before), false);
    },
  );
  const dockStyle = useAnimatedStyle(() => ({ bottom: COMPOSER_BOTTOM + lift.value }));
  // The dock's measured height: at large text sizes it's far taller than the mockup's, and a fixed
  // pad would leave the newest links under it for good. Never less than the mockup's pad.
  const dockH = useSharedValue(DOCK_ALWAYS ? 0 : ACCESSORY_H);
  const footerStyle = useAnimatedStyle(() => ({ height: Math.max(THREAD_PAD[mode], COMPOSER_BOTTOM + dockH.value + DOCK_GAP) + lift.value + toastRoom.value }));
  const atBottom = useRef(true);
  // The real content and viewport heights. FlatList's scrollToEnd uses its cached row heights,
  // which lag behind a card that grows in stages (the morning card: data, then tiles, then the
  // native pills), so it stopped ~20 pt short. Scrolling to the measured height doesn't.
  const contentH = useRef(0);
  const viewH = useRef(0);
  const toEnd = useCallback(
    (animated: boolean) => {
      if (contentH.current > 0 && viewH.current > 0) list.current?.scrollTo({ y: Math.max(0, contentH.current - viewH.current), animated });
      else list.current?.scrollToEnd({ animated });
    },
    [list],
  );
  const first = useRef(true);
  // Only his finger decides whether the thread follows: the momentum end of our own animated
  // scrollToEnd (content still growing under it) used to read as "scrolled up" and stop it.
  const dragging = useRef(false);
  const onUserScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
    follow.set(atBottom.current ? 1 : 0);
  };
  const onDragEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onUserScroll(e);
    if (!e.nativeEvent.velocity?.y) dragging.current = false;
  };
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!dragging.current) return;
    dragging.current = false;
    onUserScroll(e);
  };

  // A card that changes from a sheet (S21 "Update score", S10 a pair of shoes) grows while the
  // sheet closes, and the dismissal swallows that scroll. Follow it again once the sheet is gone
  // (~350 ms on iOS 26; focus fires at the start of the dismissal). DECISIONS-LOG #34.
  const dockTop = useRef(COMPOSER_BOTTOM + ACCESSORY_H);
  useEffect(() => {
    if (docked) return;
    // Closed: toasts sit above the accessory's capsule.
    dockTop.current = COMPOSER_BOTTOM + ACCESSORY_H;
    setToastFloor(dockTop.current);
  }, [docked]);
  useFocusEffect(
    useCallback(() => {
      setToastFloor(dockTop.current);
      return () => setToastFloor(0);
    }, []),
  );
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (atBottom.current && !first.current) toEnd(true);
      }, SHEET_DISMISS_MS);
      return () => clearTimeout(timer);
    }, [toEnd]),
  );

  // The end of onboarding (ruling 23, #291): the first 3 moves, the paywall, the notification ask. It goes first; the
  // save offer waits for it (10-onboarding.md §9.1).
  useFinishSequence();
  // "Keep your fits" (A3, #289): the save offer, posted when offer.ts says it's due.
  useAccountOffer();

  // The morning/evening card (02 "S1d"): posted the first time Stylist is shown in its window,
  // including when the app comes back to the front the next morning (focus doesn't fire then).
  useFocusEffect(
    useCallback(() => {
      void morning.ensureCard();
      const sub = AppState.addEventListener('change', (st) => {
        if (st === 'active') void morning.ensureCard();
      });
      return () => sub.remove();
    }, []),
  );

  // A new check (his photo lands in the thread) or a question he sent always brings the thread down to it, even if
  // he'd scrolled up to an older card: from here it follows the reading, the score or the answer as they grow.
  // The first load only records where things stand; for a photo, the camera cover closes before we scroll.
  const newestMine =
    loaded === undefined
      ? undefined
      : messages.reduce<ChatMessage | null>((a, m) => (m.role === 'user' && (!a || m.createdAt >= a.createdAt) ? m : a), null) ?? null;
  const newestMineId = newestMine === undefined ? undefined : newestMine?.id ?? '';
  const newestMineIsPhoto = newestMine?.kind === 'photo';
  const seenMine = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (newestMineId === undefined) return;
    const before = seenMine.current;
    seenMine.current = newestMineId;
    if (before === undefined || before === newestMineId) return;
    atBottom.current = true;
    follow.set(1);
    const timer = setTimeout(() => toEnd(true), newestMineIsPhoto ? SHEET_DISMISS_MS : 50);
    return () => clearTimeout(timer);
  }, [newestMineId, newestMineIsPhoto, toEnd, follow]);

  // Each row's top, for "scroll to this card" (the morning card's one-line score).
  const rowY = useRef(new Map<string, number>());
  const action = usePendingStylistAction();
  useEffect(() => {
    if (!action) return;
    clearStylistAction();
    if (action.kind === 'checkMyFit') openCamera();
    if (action.kind === 'scrollTo') {
      const y = rowY.current.get(action.messageId);
      if (y !== undefined) {
        atBottom.current = false;
        follow.set(0);
        list.current?.scrollTo({ y: Math.max(0, y - viewH.current * 0.1), animated: true });
      } else {
        // On an earlier day: open that day's chat.
        const m = all.find((x) => x.id === action.messageId);
        if (m) router.push(`/stylist/day/${dayKey(m.createdAt, sessionClock.offset)}`);
      }
    }
  }, [action, all, list, follow]);

  // The first view must be the ScrollView itself (no wrapper) for the tab bar to shrink on scroll.
  return (
    <>
      <Animated.ScrollView
        ref={list}
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={styles.thread}
        // Only his own scrolling decides whether the thread follows new messages; cards that
        // finish loading (content growing) keep it pinned to the newest message.
        onScrollBeginDrag={() => {
          dragging.current = true;
          // Focused with no keyboard on screen (a hardware keyboard): scrolling puts the field away.
          if (!Keyboard.isVisible()) Keyboard.dismiss();
        }}
        onScrollEndDrag={onDragEnd}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        onContentSizeChange={(_w, h) => {
          contentH.current = h;
          if (atBottom.current) toEnd(!first.current);
        }}
        onLayout={(e) => {
          viewH.current = e.nativeEvent.layout.height;
          toEnd(false);
          first.current = false;
        }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        {hasEarlier ? <EarlierChats /> : null}
        {items.map((item, i) => (
          <View
            key={item.key}
            style={i > 0 ? { marginTop: space.stack } : undefined}
            onLayout={item.type === 'msg' ? (e) => rowY.current.set(item.message.id, e.nativeEvent.layout.y) : undefined}
          >
            <ThreadRow item={item} />
          </View>
        ))}
        {live && showLive ? (
          <View style={items.length > 0 ? { marginTop: space.stack } : undefined}>
            <LiveAnswerRow live={live} />
          </View>
        ) : null}
        {/* A footer, not paddingBottom: it animates with the dock and the keyboard. */}
        <Animated.View style={footerStyle} />
      </Animated.ScrollView>
      {/* The scroll-edge fade under the header (as Closet's native one): rows soften into the bar
          instead of being cut in half. A sibling after the ScrollView, so the tab bar still shrinks. */}
      <View pointerEvents="none" style={[styles.edgeFade, { experimental_backgroundImage: edgeFade(colors.bg) }]} />
      {docked ? (
        <Animated.View
          style={[styles.dock, dockStyle]}
          pointerEvents="box-none"
          onLayout={(e) => {
            // Toasts sit above the composer here (its top, measured from the screen bottom at rest).
            dockH.value = e.nativeEvent.layout.height;
            dockTop.current = COMPOSER_BOTTOM + e.nativeEvent.layout.height;
            setToastFloor(dockTop.current);
          }}
        >
          {DOCK_ALWAYS ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: 0.94 }]} pointerEvents="none" /> : null}
          <Composer
            mode={mode}
            onCamera={openCamera}
            onSend={sendQuestion}
            sendDisabled={askInFlight}
            autoFocus={open === 'type'}
            startVoice={open === 'voice'}
            onIdle={DOCK_ALWAYS ? undefined : composerState.close}
          />
        </Animated.View>
      ) : null}
    </>
  );
}

/** Top of today's thread: the way back to earlier days (also the header's clock button). */
function EarlierChats() {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/stylist/history')}
      accessibilityRole="button"
      accessibilityLabel={t('history.open.a11y')}
      // 30 pt pill; the slop makes the target 44 without making it look bigger.
      hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
      style={({ pressed }) => [styles.earlier, { backgroundColor: colors.surface2, opacity: pressed ? opacity.pressed : 1 }]}
    >
      <KText variant="footnote" weight="500" color="ink2">
        {t('history.open')}
      </KText>
      <Icon name="next" size={11} color="ink3" weight="semibold" />
    </Pressable>
  );
}

/** Height of the soft edge under the Stylist header (the thread's top padding matches it, so the
 *  first row isn't faded when the thread is scrolled all the way up). */
const EDGE_FADE = space.xl;

/** bg → clear, top to bottom. `bg` is a #RRGGBB token. */
function edgeFade(bg: string): string {
  const n = parseInt(bg.slice(1, 7), 16);
  const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  return `linear-gradient(180deg, rgba(${rgb}, 1) 0%, rgba(${rgb}, 0.85) 35%, rgba(${rgb}, 0) 100%)`;
}

const styles = StyleSheet.create({
  thread: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: space.gutter, paddingTop: EDGE_FADE },
  edgeFade: { position: 'absolute', top: 0, left: 0, right: 0, height: EDGE_FADE },
  dock: { position: 'absolute', left: 0, right: 0, paddingBottom: 0 },
  earlier: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, marginBottom: space.stack },
});
