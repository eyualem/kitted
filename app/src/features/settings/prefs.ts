// You › Settings and Notifications (02 Y4, Y6): the preferences these screens keep. Appearance and the three
// notification switches live in the store's key-value list (KV); units and the outfit-idea time live on the
// profile row. Pure helpers plus small store reads and writes, so tests run them on the memory store.
import { Platform } from 'react-native';
import { setAppAppearance, type AppAppearance } from '@/design-system/theme';
import { KV, type KittedStore } from '@/data/store';
import type { ProfileRow } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';

// Appearance ---------------------------------------------------------------------------------------------------

export const APPEARANCES: readonly AppAppearance[] = ['system', 'light', 'dark'];
const APPEARANCE_LABEL: Record<AppAppearance, StringKey> = { system: 'appearance.system', light: 'appearance.light', dark: 'appearance.dark' };
export const appearanceLabel = (a: AppAppearance): string => t(APPEARANCE_LABEL[a]);

export function parseAppearance(raw: string | null): AppAppearance {
  return raw === 'light' || raw === 'dark' ? raw : 'system';
}

export async function loadAppearance(store: KittedStore): Promise<AppAppearance> {
  return parseAppearance(await store.getKv(KV.appearance));
}

/** Native chrome (tab bar, sheets, alerts) follows too. The web preview follows the browser only. */
function apply(choice: AppAppearance): void {
  if (Platform.OS !== 'web') setAppAppearance(choice);
}

export async function saveAppearance(store: KittedStore, choice: AppAppearance): Promise<void> {
  await store.setKv(KV.appearance, choice);
  apply(choice);
}

/** At launch (boot), unless a demo theme is forced. */
export async function applySavedAppearance(store: KittedStore): Promise<AppAppearance> {
  const choice = await loadAppearance(store);
  if (choice !== 'system') apply(choice);
  return choice;
}

// Units ----------------------------------------------------------------------------------------------------------

export type Units = ProfileRow['units'];
export const UNITS: readonly Units[] = ['imperial', 'metric'];
export const unitsLabel = (u: Units): string => t(u === 'metric' ? 'units.metric' : 'units.us');

/** Writes the profile's units; false when there's no profile yet (before onboarding). */
export async function saveUnits(store: KittedStore, units: Units): Promise<boolean> {
  return (await store.profile.patch('me', { units })) !== null;
}

// The daily outfit idea's time -----------------------------------------------------------------------------------

export const DEFAULT_IDEA_TIME = '08:00';

/** Half-hour steps from 5:00 to 11:00 am: a morning card, not an alarm clock. */
export const IDEA_TIMES: readonly string[] = Array.from({ length: 13 }, (_, i) => {
  const mins = 5 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}`;
});

/** "HH:MM" (24 h) or the default. A stored time outside the list is kept as is (it was his choice). */
export function parseIdeaTime(raw: string | null | undefined): string {
  return raw && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : DEFAULT_IDEA_TIME;
}

/** "08:00" → "8:00 am", "13:30" → "1:30 pm" (no Intl, Hermes). */
export function ideaTimeLabel(hhmm: string): string {
  const [h, m] = parseIdeaTime(hhmm).split(':').map(Number) as [number, number];
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m < 10 ? `0${m}` : m} ${h < 12 ? t('fmt.am') : t('fmt.pm')}`;
}

/** The time choices shown, with his stored one included if it's off the half-hour list. */
export function ideaTimeOptions(current: string): string[] {
  return IDEA_TIMES.includes(current) ? [...IDEA_TIMES] : [...IDEA_TIMES, current].sort();
}

export async function saveIdeaTime(store: KittedStore, hhmm: string): Promise<boolean> {
  return (await store.profile.patch('me', { ideaTime: parseIdeaTime(hhmm) })) !== null;
}

// Notifications (02 Y6) ------------------------------------------------------------------------------------------
// The only three kinds Kitted sends, all local (CLAUDE.md "Notifications"). expo-notifications isn't installed yet:
// P6 reads these switches (loadNotificationPrefs) when it schedules the daily idea and posts "fit check ready" and
// "trial ending". Until then they're stored and shown, nothing is sent. Unset means on.

export type NotificationKind = 'idea' | 'ready' | 'trial';
export type NotificationPrefs = Record<NotificationKind, boolean>;
export const NOTIFICATION_KINDS: readonly NotificationKind[] = ['idea', 'ready', 'trial'];
const NOTIFY_KEY: Record<NotificationKind, string> = { idea: KV.notifyIdea, ready: KV.notifyReady, trial: KV.notifyTrial };

export const parseSwitch = (raw: string | null): boolean => raw !== '0';

export async function loadNotificationPrefs(store: KittedStore): Promise<NotificationPrefs> {
  const [idea, ready, trial] = await Promise.all(NOTIFICATION_KINDS.map((k) => store.getKv(NOTIFY_KEY[k])));
  return { idea: parseSwitch(idea ?? null), ready: parseSwitch(ready ?? null), trial: parseSwitch(trial ?? null) };
}

export async function setNotificationPref(store: KittedStore, kind: NotificationKind, on: boolean): Promise<void> {
  await store.setKv(NOTIFY_KEY[kind], on ? '1' : '0');
}
