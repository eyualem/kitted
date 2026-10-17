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

/** `gap`: the room above the row, in pt (0 on the first row). */
export type ThreadItem =
  | { type: 'stamp'; key: string; text: string; gap: number }
  | { type: 'msg'; key: string; message: ChatMessage; showWho: boolean; answer: boolean; newest: boolean; gap: number };

const GAP_MS = 60 * 60_000;

/**
 * The thread's rhythm (07 §17, U7): one speaker's lines sit close, a change of speaker gets room, and the most room
 * goes above the stylist's reply to him (look C's 20 pt). Before, every row was 16 pt apart and read as a list.
 */
export const RHYTHM = {
  /** His bubbles in a row. */
  mine: 4,
  /** The stylist's lines in a row (a line and the next line). */
  stylistLines: 8,
  /** The stylist's lines in a row when a card is one of them. */
  stylistCards: 12,
  /** His line → the stylist's reply. */
  reply: 20,
  /** The stylist → his line. */
  toMine: 16,
  /** Above a day stamp, and below it. */
  aboveStamp: 20,
  belowStamp: 8,
} as const;

/**
 * Cards that are the stylist talking (a line of text with buttons under it): they carry the mark like his text lines
 * and continue his run (U5). The outfit, check and support cards are things he shows, not lines.
 */
export function isStylistLine(m: ChatMessage | null): boolean {
  if (!m || m.role !== 'stylist') return false;
  if (m.kind === 'text') return true;
  if (m.kind !== 'card') return false;
  return (
    m.cardType === 'limit' ||
    m.cardType === 'account' ||
    // S26 (G23): Kit's line with the card under it.
    m.cardType === 'turnOnChecks' ||
    (m.cardType === 'question' && m.payload.question === 'notify') ||
    (m.cardType === 'held' && m.payload.ready === true)
  );
}

/** The room above `m`, after `prev` (null: the first row). */
export function rowGap(prev: ChatMessage | null, m: ChatMessage, afterStamp: boolean): number {
  if (afterStamp) return RHYTHM.belowStamp;
  if (!prev) return 0;
  const mine = (x: ChatMessage) => x.role === 'user';
  if (mine(prev) && mine(m)) return RHYTHM.mine;
  if (mine(prev)) return RHYTHM.reply;
  if (mine(m)) return RHYTHM.toMine;
  return isStylistLine(prev) && isStylistLine(m) ? RHYTHM.stylistLines : RHYTHM.stylistCards;
}

/** The live answer's room above it, after the thread's last message (his question, as a rule). */
export function liveGap(last: ChatMessage | null): number {
  if (!last) return 0;
  return last.role === 'user' ? RHYTHM.reply : isStylistLine(last) ? RHYTHM.stylistLines : RHYTHM.stylistCards;
}

/** Lines that aren't a reply's move: the failed line (Retry), the paused line and a refusal stay plain (U6). */
function notAnAnswer(m: ChatMessage): boolean {
  return typeof m.payload.askRetry === 'string' || m.payload.askPaused === true || m.payload.askRefused === true;
}

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
    if (stamped) out.push({ type: 'stamp', key: `stamp-${m.id}`, text: stampText(m.createdAt, nowMs, zone), gap: out.length ? RHYTHM.aboveStamp : 0 });
    const isText = (x: ChatMessage | null) => !!x && x.kind === 'text';
    const stylistText = m.role === 'stylist' && m.kind === 'text';
    const showWho = isStylistLine(m) && (stamped || !isStylistLine(prev));
    const answer =
      stylistText && !notAnAnswer(m) && (typeof m.payload.answerTo === 'string' || (!stamped && !!prev && prev.role === 'user' && isText(prev)));
    out.push({ type: 'msg', key: m.id, message: m, showWho, answer, newest: i === sorted.length - 1, gap: rowGap(prev, m, stamped && out.length > 0) });
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
