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

/** When he gets dressed to head out (specs/notifications.md): half-hour steps from 5:00 am to 1:00 pm, 17 choices. */
export const IDEA_TIMES: readonly string[] = Array.from({ length: 17 }, (_, i) => {
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

// Notifications (specs/notifications.md NT3) -------------------------------------------------------------------
// The two kinds Kitted sends, both scheduled on the phone (features/morning/nudgeService.ts, readyWatch.ts). The daily
// idea is on only after his yes ('1'; unset reads off, so a phone never asked never shows it on). Fit check ready is on
// unless he turned it off ('0'). There is no Trial ending notification.

export type NotificationKind = 'idea' | 'ready';
export type NotificationPrefs = Record<NotificationKind, boolean>;
const NOTIFY_KEY: Record<NotificationKind, string> = { idea: KV.notifyIdea, ready: KV.notifyReady };

/** The daily idea's switch: only '1' is on. */
export const parseIdeaSwitch = (raw: string | null): boolean => raw === '1';
/** Fit check ready's switch: on unless '0'. */
export const parseReadySwitch = (raw: string | null): boolean => raw !== '0';

export async function loadNotificationPrefs(store: KittedStore): Promise<NotificationPrefs> {
  const [idea, ready] = await Promise.all([store.getKv(NOTIFY_KEY.idea), store.getKv(NOTIFY_KEY.ready)]);
  return { idea: parseIdeaSwitch(idea ?? null), ready: parseReadySwitch(ready ?? null) };
}

export async function setNotificationPref(store: KittedStore, kind: NotificationKind, on: boolean): Promise<void> {
  await store.setKv(NOTIFY_KEY[kind], on ? '1' : '0');
}
