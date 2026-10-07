// S1 Stylist (02 D12): the thread (inverted list, newest at the bottom) and the composer.
import { useEffect, useMemo } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
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

  const action = usePendingStylistAction();
  useEffect(() => {
    if (!action) return;
    clearStylistAction();
    if (action.kind === 'checkMyFit') openSamples();
  }, [action]);

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        inverted
        data={[...items].reverse()}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => <ThreadRow item={item} />}
        contentContainerStyle={[styles.thread, { paddingTop: THREAD_PAD[mode] }]}
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
  thread: { paddingHorizontal: 16, paddingBottom: 4 },
  dock: { position: 'absolute', left: 0, right: 0, paddingBottom: 0 },
});
