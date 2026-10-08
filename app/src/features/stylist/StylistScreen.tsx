// S1 Stylist (02 D12): the thread (newest at the bottom) and the composer.
// Not an inverted FlatList: on iOS 26 the scroll-edge fade under the bars is applied to the
// flipped list and washes out the whole thread (DECISIONS-LOG #25). A normal list that sticks
// to the bottom instead.
// No KeyboardAvoidingView: its padding stacked on the dock's fixed bottom and pushed the
// composer off-screen. The dock rides the keyboard directly, and the thread's footer grows by
// the same amount with the scroll offset following, so the newest message stays in view.
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { scrollTo, useAnimatedKeyboard, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useScrollOffset, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { clearStylistAction, usePendingStylistAction } from '@/router/stylistAction';
import { sessionClock } from '@/state/session';
import { setToastFloor, useToast } from '@/features/toast/toast';
import { morning } from '@/features/morning';
import { Composer } from './Composer';
import { COMPOSER_BOTTOM, DOCK_GAP, KEYBOARD_GAP, THREAD_PAD } from './layout';
import { ThreadRow } from './MessageView';
import { buildThreadItems } from './thread';

const EXCHANGE_MS = 10 * 60_000;
const SHEET_DISMISS_MS = 400;
/** Room a toast takes above the dock (44 tall + 8 gap + a little air), DECISIONS-LOG #56. */
const TOAST_ROOM = 56;

export function StylistScreen() {
  const { colors } = useTheme();
  const loaded = useLive(['chat'], () => store.chat.all(), []);
  const messages = useMemo(() => loaded ?? [], [loaded]);
  const now = sessionClock.nowMs();
  const items = useMemo(() => buildThreadItems(messages, now, sessionClock.offset), [messages, now]);
  const lastUser = messages.filter((m) => m.role === 'user').reduce((a, m) => Math.max(a, m.createdAt), 0);
  const mode = now - lastUser < EXCHANGE_MS ? 'compact' : 'idle';
  const openCamera = () => router.push('/camera');

  const list = useAnimatedRef<Animated.FlatList<(typeof items)[number]>>();
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
  const dockH = useSharedValue(0);
  const footerStyle = useAnimatedStyle(() => ({ height: Math.max(THREAD_PAD[mode], COMPOSER_BOTTOM + dockH.value + DOCK_GAP) + lift.value + toastRoom.value }));
  const atBottom = useRef(true);
  // The real content and viewport heights. FlatList's scrollToEnd uses its cached row heights,
  // which lag behind a card that grows in stages (the morning card: data, then tiles, then the
  // native pills), so it stopped ~20 pt short. Scrolling to the measured height doesn't.
  const contentH = useRef(0);
  const viewH = useRef(0);
  const toEnd = useCallback(
    (animated: boolean) => {
      if (contentH.current > 0 && viewH.current > 0) list.current?.scrollToOffset({ offset: Math.max(0, contentH.current - viewH.current), animated });
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
  const dockTop = useRef(0);
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

  const action = usePendingStylistAction();
  useEffect(() => {
    if (!action) return;
    clearStylistAction();
    if (action.kind === 'checkMyFit') openCamera();
    if (action.kind === 'scrollTo') {
      const index = items.findIndex((i) => i.type === 'msg' && i.message.id === action.messageId);
      if (index >= 0) {
        atBottom.current = false;
        follow.set(0);
        list.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
      }
    }
  }, [action, items, list, follow]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Animated.FlatList
        ref={list}
        data={items}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => <ThreadRow item={item} />}
        contentContainerStyle={styles.thread}
        // A footer, not paddingBottom: content height counts rows and footers, not padding.
        ListFooterComponent={<Animated.View style={footerStyle} />}
        // Only his own scrolling decides whether the thread follows new messages; cards that
        // finish loading (content growing) keep it pinned to the newest message.
        onScrollBeginDrag={() => (dragging.current = true)}
        onScrollEndDrag={onDragEnd}
        onMomentumScrollEnd={onMomentumEnd}
        onContentSizeChange={(_w, h) => {
          contentH.current = h;
          if (atBottom.current) toEnd(!first.current);
        }}
        onLayout={(e) => {
          viewH.current = e.nativeEvent.layout.height;
          toEnd(false);
          first.current = false;
        }}
        ItemSeparatorComponent={Separator}
        // Rows have no fixed height: if the target isn't measured yet, jump near it, then retry.
        onScrollToIndexFailed={(info) => {
          list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          setTimeout(() => list.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.1 }), 120);
        }}
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="never"
      />
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
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: 0.94 }]} pointerEvents="none" />
        <Composer mode={mode} onCamera={openCamera} />
      </Animated.View>
    </View>
  );
}

function Separator() {
  return <View style={{ height: space.stack }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  thread: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 4 },
  dock: { position: 'absolute', left: 0, right: 0, paddingBottom: 0 },
});
