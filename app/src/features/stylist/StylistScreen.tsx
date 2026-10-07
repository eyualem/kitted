// S1 Stylist (02 D12): the thread (newest at the bottom) and the composer.
// Not an inverted FlatList: on iOS 26 the scroll-edge fade under the bars is applied to the
// flipped list and washes out the whole thread (DECISIONS-LOG #25). A normal list that sticks
// to the bottom instead.
import { useEffect, useMemo, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { clearStylistAction, usePendingStylistAction } from '@/router/stylistAction';
import { sessionClock } from '@/state/session';
import { Composer } from './Composer';
import { COMPOSER_BOTTOM, THREAD_PAD } from './layout';
import { ThreadRow } from './MessageView';
import { buildThreadItems } from './thread';

const EXCHANGE_MS = 10 * 60_000;

export function StylistScreen() {
  const { colors } = useTheme();
  const loaded = useLive(['chat'], () => store.chat.all(), []);
  const messages = useMemo(() => loaded ?? [], [loaded]);
  const now = sessionClock.nowMs();
  const items = useMemo(() => buildThreadItems(messages, now, sessionClock.offset), [messages, now]);
  const lastUser = messages.filter((m) => m.role === 'user').reduce((a, m) => Math.max(a, m.createdAt), 0);
  const mode = now - lastUser < EXCHANGE_MS ? 'compact' : 'idle';
  const openSamples = () => router.push('/sheets/sample-photos?mode=check');

  const list = useRef<FlatList<(typeof items)[number]>>(null);
  const atBottom = useRef(true);
  const first = useRef(true);
  const onUserScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
  };

  const action = usePendingStylistAction();
  useEffect(() => {
    if (!action) return;
    clearStylistAction();
    if (action.kind === 'checkMyFit') openSamples();
  }, [action]);

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={list}
        data={items}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => <ThreadRow item={item} />}
        contentContainerStyle={styles.thread}
        // A footer, not paddingBottom: scrollToEnd measures rows and footers, not padding.
        ListFooterComponent={<View style={{ height: THREAD_PAD[mode] }} />}
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
      <View style={[styles.dock, { bottom: COMPOSER_BOTTOM }]} pointerEvents="box-none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: 0.94 }]} pointerEvents="none" />
        <Composer mode={mode} onCamera={openSamples} onLibrary={openSamples} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Separator() {
  return <View style={{ height: 12 }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  thread: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 4 },
  dock: { position: 'absolute', left: 0, right: 0, paddingBottom: 0 },
});
