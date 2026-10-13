// Past chats (founder, Oct 9): every earlier day of the Stylist thread as its own page, so today's
// thread stays short. The list shows each day's best look and what happened; a day opens read-only
// (no composer; its cards still open their sheets, as in the thread).
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { dayKey } from '@kitted/core';
import { EmptyState, Icon, KCard, KText, NeckDownPhoto, RowDivider, displayScore, opacity, radius, scoreWordLabel, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage, FitCheckRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { shownPhoto } from '@/demo/demoPhotos';
import { t } from '@/i18n/en';
import { chatDayTitle } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { ThreadRow } from './MessageView';
import { buildThreadItems, chatDays, type ChatDay } from './thread';

interface DayRow {
  day: ChatDay;
  title: string;
  subtitle: string;
  best: FitCheckRow | null;
}

function summarize(day: ChatDay, checks: readonly FitCheckRow[], now: number): DayRow {
  const zone = sessionClock.offset;
  const scored = checks.filter((c) => c.status === 'scored' && c.score !== null && dayKey(c.createdAt, zone) === day.key);
  const firsts = scored.filter((c) => !c.parentId).length;
  const best = scored.reduce<FitCheckRow | null>((a, c) => (!a || (c.score ?? 0) > (a.score ?? 0) ? c : a), null);
  let subtitle: string;
  if (best && best.score !== null) {
    const v = { score: displayScore(best.score), word: scoreWordLabel(best.score) };
    subtitle = firsts > 1 ? t('history.checkN', { n: firsts, ...v }) : t('history.check1', v);
  } else if (day.messages.some((m) => m.cardType === 'morning' || m.cardType === 'outfitIdea')) {
    subtitle = t('history.idea');
  } else {
    subtitle = t('history.messages', { n: day.messages.length });
  }
  return { day, title: chatDayTitle(day.firstAt, now, zone), subtitle, best };
}

function usePastDays(): DayRow[] | undefined {
  const data = useLive(['chat', 'fitChecks'], async () => ({ chat: await store.chat.all(), checks: await store.fitChecks.all() }), []);
  return useMemo(() => {
    if (!data) return undefined;
    const now = sessionClock.nowMs();
    const today = dayKey(now, sessionClock.offset);
    return chatDays(data.chat, sessionClock.offset)
      .filter((d) => d.key !== today)
      .map((d) => summarize(d, data.checks, now));
  }, [data]);
}

export function PastChatsScreen() {
  const { colors } = useTheme();
  const days = usePastDays();
  if (!days) return null;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.stack }}>
      {days.length === 0 ? (
        <EmptyState art={<Icon name="tabStylist" size={44} color="inkFaint" />} body={t('history.empty')} />
      ) : (
        <KCard>
          {days.map((d, i) => (
            <View key={d.day.key}>
              {i > 0 ? <RowDivider /> : null}
              <PastDayRow row={d} />
            </View>
          ))}
        </KCard>
      )}
    </ScrollView>
  );
}

function PastDayRow({ row: { day, title, subtitle, best } }: { row: DayRow }) {
  const { colors } = useTheme();
  const photo = best ? shownPhoto(best.demoPhotoId, best.photoFile, undefined) : undefined;
  return (
    <Pressable
      onPress={() => router.push(`/stylist/day/${day.key}`)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}.`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.m, paddingHorizontal: space.l, opacity: pressed ? opacity.pressed : 1 })}
    >
      {photo ? (
        <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={44} height={55} borderRadii={{ tl: radius.thumb, tr: radius.thumb, br: radius.thumb, bl: radius.thumb }} />
      ) : (
        <View style={{ width: 44, height: 55, borderRadius: radius.thumb, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="tabStylist" color="ink3" size="small" />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="subheadline" weight="600">
          {title}
        </KText>
        <KText variant="footnote" color="ink2" numberOfLines={2}>
          {subtitle}
        </KText>
      </View>
      <Icon name="next" size={13} color="ink3" weight="semibold" />
    </Pressable>
  );
}

/** One earlier day, oldest message first, opened at the top. */
export function PastDayScreen({ dayKey: key }: { dayKey: string }) {
  const { colors } = useTheme();
  const loaded = useLive(['chat'], () => store.chat.all(), []);
  const day = useMemo(() => (loaded ? chatDays(loaded, sessionClock.offset).find((d) => d.key === key) : undefined), [loaded, key]);
  const now = sessionClock.nowMs();
  const items = useMemo(
    // Tap answers only ever show under today's newest message.
    () => (day ? buildThreadItems(day.messages as ChatMessage[], now, sessionClock.offset).map((i) => (i.type === 'msg' ? { ...i, newest: false } : i)) : []),
    [day, now],
  );
  const title = day ? chatDayTitle(day.firstAt, now, sessionClock.offset) : '';
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xxxl }}>
      <Stack.Screen options={{ title }} />
      {items.map((item, i) => (
        <View key={item.key} style={i > 0 ? { marginTop: space.stack } : undefined}>
          <ThreadRow item={item} />
        </View>
      ))}
    </ScrollView>
  );
}
