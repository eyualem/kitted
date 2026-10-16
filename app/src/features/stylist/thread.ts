// The Stylist thread's rows (02 D12), pure: day stamps and the "Your stylist" header.
// Chats are kept by day (founder, Oct 9): Stylist shows today's (the 4 am day key), and each
// earlier day is its own page under "Past chats".
// A stamp goes before the first message of a day, after a 60-minute gap, or where the message
// asks for one (seed M08). Look C (#302): the stylist's mark shows on the first stylist line of a run (after his
// message, a card, a photo or a stamp); `answer` marks a stylist line that answers his typed question (its first
// sentence is drawn as the lead).
import { dayKey, type ZoneOffset } from '@kitted/core';
import type { ChatMessage, OccasionKey } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import { stampText } from '@/i18n/format';

export type ThreadItem =
  | { type: 'stamp'; key: string; text: string }
  | { type: 'msg'; key: string; message: ChatMessage; showWho: boolean; answer: boolean; newest: boolean };

const GAP_MS = 60 * 60_000;

export function sortMessages(ms: readonly ChatMessage[]): ChatMessage[] {
  return [...ms].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function buildThreadItems(messages: readonly ChatMessage[], nowMs: number, zone: ZoneOffset): ThreadItem[] {
  const out: ThreadItem[] = [];
  const sorted = sortMessages(messages);
  let prev: ChatMessage | null = null;
  sorted.forEach((m, i) => {
    const newDay = !prev || dayKey(prev.createdAt, zone) !== dayKey(m.createdAt, zone);
    const gap = !!prev && m.createdAt - prev.createdAt >= GAP_MS;
    const stamped = newDay || gap || m.payload.stamp === true;
    if (stamped) out.push({ type: 'stamp', key: `stamp-${m.id}`, text: stampText(m.createdAt, nowMs, zone) });
    const isText = (x: ChatMessage | null) => !!x && x.kind === 'text';
    const stylistText = m.role === 'stylist' && m.kind === 'text';
    const showWho = stylistText && (stamped || !(prev && prev.role === 'stylist' && isText(prev)));
    const answer = stylistText && (typeof m.payload.answerTo === 'string' || (!stamped && !!prev && prev.role === 'user' && isText(prev)));
    out.push({ type: 'msg', key: m.id, message: m, showWho, answer, newest: i === sorted.length - 1 });
    prev = m;
  });
  return out;
}

export interface ChatDay {
  /** The 4 am day key, "2026-10-22". */
  key: string;
  messages: ChatMessage[];
  firstAt: number;
  lastAt: number;
}

/** His chat split by day, newest day first; each day's messages oldest first. */
export function chatDays(messages: readonly ChatMessage[], zone: ZoneOffset): ChatDay[] {
  const days = new Map<string, ChatMessage[]>();
  for (const m of sortMessages(messages)) {
    const k = dayKey(m.createdAt, zone);
    const list = days.get(k);
    if (list) list.push(m);
    else days.set(k, [m]);
  }
  return [...days.entries()]
    .map(([key, ms]) => ({ key, messages: ms, firstAt: ms[0]!.createdAt, lastAt: ms[ms.length - 1]!.createdAt }))
    .sort((a, b) => b.lastAt - a.lastAt);
}

/** Today's messages, and whether there's anything on an earlier day. */
export function splitToday(messages: readonly ChatMessage[], nowMs: number, zone: ZoneOffset): { today: ChatMessage[]; hasEarlier: boolean } {
  const key = dayKey(nowMs, zone);
  const today = messages.filter((m) => dayKey(m.createdAt, zone) === key);
  return { today, hasEarlier: today.length < messages.length };
}

const OCCASION_KEY: Record<OccasionKey, StringKey> = {
  everyday: 'occasion.everyday', class: 'occasion.classWork', date: 'occasion.date', interview: 'occasion.interview',
  event: 'occasion.event', gym: 'occasion.gym', home: 'occasion.home', going_out: 'occasion.goingOut',
};

export function occasionLabel(o: OccasionKey): string {
  return t(OCCASION_KEY[o] ?? 'occasion.everyday');
}
