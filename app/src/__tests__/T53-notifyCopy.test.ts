// T53 · NT5.3: every notification string, word for word as specs/notifications.md and IMPLEMENTATION → Copy keys say,
// read through t() (so the plural form is the one the app shows), and generated from the copy deck (en.generated.ts).
// The contract: tasks/T53/TESTING.md.
import { en, t, type StringKey } from '@/i18n/en';
import { enGenerated } from '@/i18n/en.generated';

const k = (key: string) => key as StringKey;

/** [key, params, the exact text]. */
const COPY: [string, Record<string, string | number> | undefined, string][] = [
  ['notif.ask', undefined, "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before."],
  ['notif.ask.label', undefined, 'I get dressed at'],
  ['notif.ask.yes', undefined, 'Send me ideas'],
  ['notif.ask.no', undefined, 'No thanks'],
  ['notif.ask.done', { time: '7:45 am' }, 'Done. Your first idea lands tomorrow at 7:45 am.'],
  ['notif.ask.doneToday', { time: '7:45 am' }, 'Done. Your first idea lands today at 7:45 am.'],
  ['notif.ask.later', undefined, 'No problem. You can turn it on later in You → Notifications.'],
  ['comeback.q', undefined, 'I paused your daily ideas after a week without a visit. Want them back?'],
  ['comeback.on', undefined, 'Turn them back on'],
  ['comeback.time', undefined, 'Change the time'],
  ['comeback.no', undefined, 'No thanks'],
  ['comeback.back', { time: '7:45 am' }, 'Back on. Next one lands tomorrow at 7:45 am.'],
  ['comeback.backToday', { time: '7:45 am' }, 'Back on. Next one lands today at 7:45 am.'],
  ['comeback.done', undefined, 'Done. You can turn them on in You → Notifications.'],
  ['push.nudge.check', undefined, "Check today's fit. Each one teaches me your closet."],
  ['push.nudge.idea', undefined, "Today's outfit idea is ready."],
  ['push.nudge.bigEnough', undefined, "Your closet's big enough now: here's today's idea."],
  ['push.ready', { n: 2 }, 'Your fit check is ready. 2 quick fixes inside.'],
  ['push.ready', { n: 1 }, 'Your fit check is ready. 1 quick fix inside.'],
  ['push.ready.none', undefined, 'Your fit check is ready.'],
  ['notifs.header', undefined, "An outfit idea once a day, and a heads-up when a fit check finishes after you leave. That's all I send."],
  ['notifs.time', undefined, 'I get dressed at'],
  // Kept as they are.
  ['notifs.title', undefined, 'Notifications'],
  ['notifs.idea', undefined, 'Daily outfit idea'],
  ['notifs.ready', undefined, 'Fit check ready'],
  ['notifs.off', undefined, 'Notifications are off for Kitted.'],
  ['common.openSettings', undefined, 'Open Settings'],
  ['settings.a11y.value', { label: 'I get dressed at', value: '8:00 am' }, 'I get dressed at, 8:00 am'],
];

describe('NT5.3 · the words', () => {
  it('NT5.3 · every notification string, word for word, from the deck', () => {
    for (const [key, params, text] of COPY) {
      expect({ key, params, text: t(k(key), params) }).toEqual({ key, params, text });
      // From the deck (en.generated.ts), except the plural's one form, which en.ts adds. The kept VoiceOver pattern
      // (settings.a11y.value) was added in the build (en.ts) and stays there.
      if (key !== 'settings.a11y.value') expect({ key, inDeck: key in enGenerated }).toEqual({ key, inDeck: true });
      const filled = t(k(key), params);
      expect(filled).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(filled).not.toMatch(/AI stylist/i);
      expect(filled).not.toMatch(/\bunlimited\b/i);
      expect(filled).not.toMatch(/streak|\bday \d|\d+ days?\b/i);
      expect(filled).not.toMatch(/[{}]/);
    }
    // The deck's own text for the counted line is the "other" form.
    expect((enGenerated as Record<string, string>)['push.ready']).toBe('Your fit check is ready. {n} quick fixes inside.');
  });

  it('NT5.3 · the removed strings are gone', () => {
    const keys = Object.keys(en);
    for (const gone of ['notif.ask.set', 'notifs.trial', 'push.trial', 'push.idea', 'unopened.q', 'unopened.keep', 'unopened.time', 'unopened.stop', 'notifs.a11y.time']) {
      expect({ gone, present: keys.includes(gone) }).toEqual({ gone, present: false });
    }
    const all = Object.values(en).join('\n');
    for (const words of ['Yes, pick a time', 'Daily idea at', 'Keep them coming', 'Stop for now', "I've sent 3 ideas", 'You → Settings → Notifications', 'No reminders to open the app']) {
      expect({ words, present: all.includes(words) }).toEqual({ words, present: false });
    }
  });
});
