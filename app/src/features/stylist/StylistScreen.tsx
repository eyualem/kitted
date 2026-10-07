// S1 Stylist (02 D12): the thread (newest at the bottom) and the composer.
// Not an inverted FlatList: on iOS 26 the scroll-edge fade under the bars is applied to the
// flipped list and washes out the whole thread (DECISIONS-LOG #25). A normal list that sticks
// to the bottom instead.
// No KeyboardAvoidingView: its padding stacked on the dock's fixed bottom and pushed the
// composer off-screen. The dock rides the keyboard directly, and the thread's footer grows by
// the same amount with the scroll offset following, so the newest message stays in view.
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { scrollTo, useAnimatedKeyboard, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useScrollOffset, useSharedValue } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { clearStylistAction, usePendingStylistAction } from '@/router/stylistAction';
import { sessionClock } from '@/state/session';
import { setToastFloor } from '@/features/toast/toast';
import { Composer } from './Composer';
import { COMPOSER_BOTTOM, DOCK_GAP, KEYBOARD_GAP, THREAD_PAD } from './layout';
import { ThreadRow } from './MessageView';
import { buildThreadItems } from './thread';

const EXCHANGE_MS = 10 * 60_000;
const SHEET_DISMISS_MS = 400;

export function StylistScreen() {
  const { colors } = useTheme();
  const loaded = useLive(['chat'], () => store.chat.all(), []);
  const messages = useMemo(() => loaded ?? [], [loaded]);
  const now = sessionClock.nowMs();
  const items = useMemo(() => buildThreadItems(messages, now, sessionClock.offset), [messages, now]);
  const lastUser = messages.filter((m) => m.role === 'user').reduce((a, m) => Math.max(a, m.createdAt), 0);
  const mode = now - lastUser < EXCHANGE_MS ? 'compact' : 'idle';
  const openSamples = () => router.push('/sheets/sample-photos?mode=check');

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
  const dockStyle = useAnimatedStyle(() => ({ bottom: COMPOSER_BOTTOM + lift.value }));
  // The dock's measured height: at large text sizes it's far taller than the mockup's, and a fixed
  // pad would leave the newest links under it for good. Never less than the mockup's pad.
  const dockH = useSharedValue(0);
  const footerStyle = useAnimatedStyle(() => ({ height: Math.max(THREAD_PAD[mode], COMPOSER_BOTTOM + dockH.value + DOCK_GAP) + lift.value }));
  const atBottom = useRef(true);
  const first = useRef(true);
  const onUserScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
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
        if (atBottom.current && !first.current) list.current?.scrollToEnd({ animated: true });
      }, SHEET_DISMISS_MS);
      return () => clearTimeout(timer);
    }, [list]),
  );

  const action = usePendingStylistAction();
  useEffect(() => {
    if (!action) return;
    clearStylistAction();
    if (action.kind === 'checkMyFit') openSamples();
  }, [action]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Animated.FlatList
        ref={list}
        data={items}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => <ThreadRow item={item} />}
        contentContainerStyle={styles.thread}
        // A footer, not paddingBottom: scrollToEnd measures rows and footers, not padding.
        ListFooterComponent={<Animated.View style={footerStyle} />}
        // Only his own scrolling decides whether the thread follows new messages; cards that
        // finish loading (content growing) keep it pinned to the newest message.
        onScrollEndDrag={onUserScroll}
        onMomentumScrollEnd={onUserScroll}
        onContentSizeChange={() => {
          if (atBottom.current) list.current?.scrollToEnd({ animated: !first.current });
        }}
        onLayout={() => {
          list.current?.scrollToEnd({ animated: false });
          first.current = false;
        }}
        ItemSeparatorComponent={Separator}
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
        <Composer mode={mode} onCamera={openSamples} />
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
