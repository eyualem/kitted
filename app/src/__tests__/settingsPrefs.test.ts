// You › Settings, Plan & usage and Notifications (02 Y4–Y6): the stored preferences and the plan and usage lines.
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { KV } from '@/data/store';
import type { ProfileRow } from '@/data/types';
import { mailtoUrl } from '@/features/settings/actions';
import { currentPlan, planShortName, planStatus, restorePurchases, restoreToast, scoringVersion, usageLines, versionLine } from '@/features/settings/plan';
import {
  DEFAULT_IDEA_TIME, IDEA_TIMES, ideaTimeLabel, ideaTimeOptions, loadAppearance, loadNotificationPrefs, parseAppearance, parseIdeaTime,
  saveAppearance, saveIdeaTime, saveUnits, setNotificationPref,
} from '@/features/settings/prefs';
import { parseZonedIso } from '@/services/clock';

const profile = (): ProfileRow => ({
  id: 'me', birthYear: 2003, heightCm: null, build: 'average', fitPreference: 'regular', styles: [], boldness: null, budget: null,
  lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: 0,
});

describe('appearance', () => {
  it('defaults to System and keeps a choice', async () => {
    const store = createMemoryStore();
    expect(await loadAppearance(store)).toBe('system');
    await saveAppearance(store, 'dark');
    expect(await store.getKv(KV.appearance)).toBe('dark');
    expect(await loadAppearance(store)).toBe('dark');
    expect(parseAppearance('sepia')).toBe('system');
  });
});

describe('units and the idea time live on the profile', () => {
  it('writes units and a valid time; nothing before onboarding', async () => {
    const store = createMemoryStore();
    expect(await saveUnits(store, 'metric')).toBe(false);
    await store.profile.put(profile());
    expect(await saveUnits(store, 'metric')).toBe(true);
    expect((await store.profile.get('me'))?.units).toBe('metric');
    await saveIdeaTime(store, '07:30');
    expect((await store.profile.get('me'))?.ideaTime).toBe('07:30');
    await saveIdeaTime(store, 'soon');
    expect((await store.profile.get('me'))?.ideaTime).toBe(DEFAULT_IDEA_TIME);
  });

  it('reads times as 12-hour text without Intl', () => {
    expect(ideaTimeLabel('08:00')).toBe('8:00 am');
    expect(ideaTimeLabel('00:05')).toBe('12:05 am');
    expect(ideaTimeLabel('13:30')).toBe('1:30 pm');
    expect(parseIdeaTime(null)).toBe('08:00');
    expect(IDEA_TIMES[0]).toBe('05:00');
    expect(IDEA_TIMES[IDEA_TIMES.length - 1]).toBe('11:00');
    expect(ideaTimeOptions('08:00')).toEqual([...IDEA_TIMES]);
    expect(ideaTimeOptions('12:15')).toContain('12:15');
  });
});

describe('notification switches (P6 reads them)', () => {
  it('are on until turned off, each on its own key', async () => {
    const store = createMemoryStore();
    expect(await loadNotificationPrefs(store)).toEqual({ idea: true, ready: true, trial: true });
    await setNotificationPref(store, 'ready', false);
    expect(await store.getKv(KV.notifyReady)).toBe('0');
    expect(await loadNotificationPrefs(store)).toEqual({ idea: true, ready: false, trial: true });
    await setNotificationPref(store, 'ready', true);
    expect((await loadNotificationPrefs(store)).ready).toBe(true);
  });
});

describe('plan and usage lines', () => {
  const now = parseZonedIso('2026-10-22T12:22:00')!;

  it('names the plan', () => {
    expect(planStatus(currentPlan(false, now), US_EASTERN)).toEqual({ title: 'Free plan', detail: 'A fit check with its re-check and 5 questions, every day' });
    expect(planStatus(currentPlan(true, now), US_EASTERN)).toEqual({ title: 'Kitted Pro', detail: 'Up to 10 fit checks and 50 questions a day' });
    expect(planStatus(currentPlan(false, now, 'yearly'), US_EASTERN)).toEqual({ title: 'Kitted Pro · Yearly', detail: 'Renews November 21' });
    expect(planStatus(currentPlan(false, now, 'trial'), US_EASTERN)).toEqual({ title: 'Pro trial', detail: "Trial ends October 29. I'll remind you 2 days before." });
    expect(planShortName(currentPlan(false, now, 'trial'))).toBe('Pro trial');
  });

  const snap = { checksUsed: 0, checkLimit: 1, questionsUsed: 3, questionLimit: 5, recheckOpen: false };
  const values = (s: typeof snap, rechecks: number) => usageLines(s, rechecks).map((l) => l.value);

  it('counts today, and says where the re-check stands', () => {
    expect(values(snap, 0)).toEqual(['0 of 1', '1 left', '3 of 5']);
    expect(values({ ...snap, checksUsed: 1, recheckOpen: true }, 0)).toEqual(['1 of 1', '1 left', '3 of 5']);
    expect(values({ ...snap, checksUsed: 1 }, 1)).toEqual(['1 of 1', 'Used', '3 of 5']);
    expect(values({ ...snap, checksUsed: 1 }, 0)).toEqual(['1 of 1', 'Closed', '3 of 5']);
    expect(values({ ...snap, checkLimit: 10, questionLimit: 50, checksUsed: 2 }, 0)[0]).toBe('2 of 10');
    // Never more than the limit (a demo override can say more).
    expect(values({ ...snap, questionsUsed: 9 }, 0)[2]).toBe('5 of 5');
  });

  it('reads each row as one sentence', () => {
    expect(usageLines(snap, 0).map((l) => l.spoken)).toEqual(['Fit checks, 0 of 1 used', 'Re-check, 1 left', 'Questions, 3 of 5 used']);
  });
});

describe('restore, mail and the version footer', () => {
  it('restores the demo entitlement', async () => {
    expect(restoreToast(await restorePurchases(() => true))).toBe('Restored. Kitted Pro is on.');
    expect(restoreToast(await restorePurchases(() => false))).toBe('No purchases to restore.');
    expect(
      restoreToast(
        await restorePurchases(() => {
          throw new Error('offline');
        }),
      ),
    ).toBe("Couldn't reach the App Store. Try again.");
  });

  it('puts only a subject in the mail link', () => {
    expect(mailtoUrl('help@example.com', 'A wrong score (Kitted 0.1.0)')).toBe('mailto:help@example.com?subject=A%20wrong%20score%20(Kitted%200.1.0)');
  });

  it('names the live scoring rules, not "Rules v3.1"', () => {
    expect(scoringVersion('parts')).toMatch(/^\d+\.\d+\.\d+$/);
    expect(versionLine({ version: '0.1.0', build: '1' }, '1.8.0')).toBe('Kitted 0.1.0 (1) · Scoring v1.8.0');
  });
});
