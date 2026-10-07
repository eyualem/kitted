// The Stylist thread's rows (02 D12), pure: day stamps and the "Your stylist" header.
// A stamp goes before the first message of a day, after a 60-minute gap, or where the message
// asks for one (seed M08). The header shows on the first stylist message after a stamp.
import { dayKey, type ZoneOffset } from '@kitted/core';
import type { ChatMessage, OccasionKey } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import { stampText } from '@/i18n/format';

export type ThreadItem =
  | { type: 'stamp'; key: string; text: string }
  | { type: 'msg'; key: string; message: ChatMessage; showWho: boolean; newest: boolean };

const GAP_MS = 60 * 60_000;

export function sortMessages(ms: readonly ChatMessage[]): ChatMessage[] {
  return [...ms].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function buildThreadItems(messages: readonly ChatMessage[], nowMs: number, zone: ZoneOffset): ThreadItem[] {
  const out: ThreadItem[] = [];
  const sorted = sortMessages(messages);
  let prev: ChatMessage | null = null;
  let afterStamp = false;
  sorted.forEach((m, i) => {
    const newDay = !prev || dayKey(prev.createdAt, zone) !== dayKey(m.createdAt, zone);
    const gap = !!prev && m.createdAt - prev.createdAt >= GAP_MS;
    if (newDay || gap || m.payload.stamp === true) {
      out.push({ type: 'stamp', key: `stamp-${m.id}`, text: stampText(m.createdAt, nowMs, zone) });
      afterStamp = true;
    }
    const showWho = m.role === 'stylist' && m.kind === 'text' && afterStamp;
    if (m.role === 'stylist' && m.kind === 'text') afterStamp = false;
    if (m.role === 'user') afterStamp = false;
    out.push({ type: 'msg', key: m.id, message: m, showWho, newest: i === sorted.length - 1 });
    prev = m;
  });
  return out;
}

const OCCASION_KEY: Record<OccasionKey, StringKey> = {
  everyday: 'occasion.everyday', class: 'occasion.classWork', date: 'occasion.date', interview: 'occasion.interview',
  event: 'occasion.event', gym: 'occasion.gym', home: 'occasion.home',
};

export function occasionLabel(o: OccasionKey): string {
  return t(OCCASION_KEY[o] ?? 'occasion.everyday');
}
