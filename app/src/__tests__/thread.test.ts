import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { buildThreadItems, chatDays, splitToday } from '@/features/stylist/thread';
import { chatDayTitle, clockTime, signed, stampText } from '@/i18n/format';

const at = (iso: string) => Date.parse(iso);

describe('thread rows', () => {
  it('full thread at 12:20: stamps, the who header, the newest message', async () => {
    const s = createMemoryStore();
    await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
    const items = buildThreadItems(await s.chat.all(), at('2026-10-22T12:20:00-04:00'), US_EASTERN);
    const stamps = items.filter((i) => i.type === 'stamp').map((i) => (i.type === 'stamp' ? i.text : ''));
    expect(stamps).toEqual(['Sep 24, 7:05 pm', 'Tuesday 8:10 am', 'Thursday 7:42 am', 'Thursday 8:00 am', 'Thursday 12:05 pm']);
    const who = items.filter((i) => i.type === 'msg' && i.showWho).map((i) => (i.type === 'msg' ? i.message.id : ''));
    // Look C (#302): the mark on the first stylist line of every run (after his message, a card or a stamp).
    expect(who).toEqual(['M00', 'M05', 'M08', 'M11', 'M13', 'M16', 'M18']);
    const answers = items.filter((i) => i.type === 'msg' && i.answer).map((i) => (i.type === 'msg' ? i.message.id : ''));
    expect(answers).toEqual(['M11', 'M13', 'M16', 'M18']); // a line right after his typed message
    const last = items[items.length - 1]!;
    expect(last.type === 'msg' && [last.message.id, last.newest]).toEqual(['M18', true]);
  });
});

describe('chats by day (founder, Oct 9)', () => {
  it('splits the full thread into days, newest first, and keeps only today on Stylist', async () => {
    const s = createMemoryStore();
    await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
    const all = await s.chat.all();
    const days = chatDays(all, US_EASTERN);
    expect(days.map((d) => d.key)).toEqual(['2026-10-22', '2026-10-20', '2026-09-24']);
    expect(days.reduce((n, d) => n + d.messages.length, 0)).toBe(all.length);
    const now = at('2026-10-22T12:20:00-04:00');
    const { today, hasEarlier } = splitToday(all, now, US_EASTERN);
    expect(hasEarlier).toBe(true);
    expect(today.map((m) => m.id)).toEqual(days[0]!.messages.map((m) => m.id));
    // 2 am still belongs to yesterday's chat (4 am rollover).
    expect(splitToday(all, at('2026-10-23T02:00:00-04:00'), US_EASTERN).today.length).toBe(today.length);
  });

  it('titles past days', () => {
    const now = at('2026-10-22T12:20:00-04:00');
    expect(chatDayTitle(at('2026-10-21T09:00:00-04:00'), now, US_EASTERN)).toBe('Yesterday');
    expect(chatDayTitle(at('2026-10-20T08:10:00-04:00'), now, US_EASTERN)).toBe('Tuesday');
    expect(chatDayTitle(at('2026-09-24T19:05:00-04:00'), now, US_EASTERN)).toBe('Sep 24');
  });
});

describe('formats (no Intl)', () => {
  it('clock time, stamps and signed numbers', () => {
    expect(clockTime(at('2026-10-22T07:42:00-04:00'), US_EASTERN)).toBe('7:42');
    expect(clockTime(at('2026-10-22T12:05:00-04:00'), US_EASTERN)).toBe('12:05');
    expect(stampText(at('2026-10-22T08:00:00-04:00'), at('2026-10-22T08:01:00-04:00'), US_EASTERN)).toBe('Thursday 8:00 am');
    expect(stampText(at('2026-10-14T20:00:00-04:00'), at('2026-10-22T08:01:00-04:00'), US_EASTERN)).toBe('Oct 14, 8:00 pm');
    expect([signed(0.5), signed(-0.6), signed(0), signed(0, '±0'), signed(0.75)]).toEqual(['+0.5', '−0.6', '+0', '±0', '+0.75']);
  });
});
