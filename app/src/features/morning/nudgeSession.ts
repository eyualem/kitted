// The app's notification services (specs/notifications.md; T53): the nudge service and the Fit check ready watch,
// wired to the store, the session clock, the morning card and iOS; and the hook Stylist calls once to run them on
// open, on every return and leave, on every check change and on a tap. A demo screen never schedules a real
// notification: its scheduler only records, its iOS is switch.ts's scripted one, and it asks for no background time.
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { onChange } from '@/data/changes';
import { store } from '@/data/db';
import { getAgeBlocked } from '@/data/secure';
import { notifications, notificationsOn, notifyScripted } from '@/features/paywall/switch';
import { setStylistAction } from '@/router/stylistAction';
import { newId } from '@/services/ids';
import { noBackgroundWork, recordingScheduler, type BackgroundWork, type NotificationData, type NotificationScheduler } from '@/services/notifications';
import { lastTap, nativeBackgroundWork, nativeScheduler, onNotificationTap } from '@/services/notificationsNative';
import { getDemoArgs, sessionClock } from '@/state/session';
import { morning } from './index';
import { createNudgeService } from './nudgeService';
import { openFromNotification } from './nudgeTap';
import { createReadyWatch } from './readyWatch';

const onDemo = (): boolean => getDemoArgs().demoScreen !== null;
/** On a demo screen only its own script turns notifications on (never the Simulator's real permission). */
const built = (): boolean => (onDemo() ? notifyScripted() : notificationsOn());

/** Demo screens' scheduler: what the app would have scheduled, recorded and never sent. */
export const demoScheduler = recordingScheduler();

const scheduler: NotificationScheduler = {
  replaceNudges: (list) => (onDemo() ? demoScheduler : nativeScheduler).replaceNudges(list),
  cancelAll: () => (onDemo() ? demoScheduler : nativeScheduler).cancelAll(),
  presentNow: (n) => (onDemo() ? demoScheduler : nativeScheduler).presentNow(n),
  pending: () => (onDemo() ? demoScheduler : nativeScheduler).pending(),
};

const background: BackgroundWork = {
  begin: () => (onDemo() ? noBackgroundWork : nativeBackgroundWork).begin(),
  end: (id) => (onDemo() ? noBackgroundWork : nativeBackgroundWork).end(id),
};

const ageBlocked = () => getAgeBlocked().catch(() => false);

export const nudges = createNudgeService({
  store,
  clock: sessionClock,
  ids: newId,
  built,
  permissions: notifications,
  scheduler,
  canSuggest: (atMs) => morning.canSuggest(atMs),
  ageBlocked,
  afterTodaysCard: () => morning.ensureCard().then(
    () => {},
    () => {},
  ),
});

export const readyWatch = createReadyWatch({ store, built, permissions: notifications, scheduler, background, ageBlocked });

function openTap(data: NotificationData): void {
  void openFromNotification(data, {
    store,
    clock: sessionClock,
    ensureTodaysCard: () => morning.ensureCard().catch(() => null),
    navigate: () => router.navigate('/stylist'),
    setAction: setStylistAction,
  }).catch((e: unknown) => console.warn('[notify] tap', e));
}

let started = false;

/** Once per process, from Stylist (the app's home): the first schedule, a cold-start tap, and the app-wide listeners. */
function start(): void {
  if (started) return;
  started = true;
  void nudges.reschedule('open').catch((e: unknown) => console.warn('[notify] open', e));
  void lastTap()
    .then((data) => data && openTap(data))
    .catch(() => {});
  AppState.addEventListener('change', (st) => {
    if (st === 'active') void nudges.reschedule('foreground').catch(() => {});
    if (st === 'background') void nudges.reschedule('background').catch(() => {});
    if (st === 'active' || st === 'background' || st === 'inactive') void readyWatch.appState(st).catch(() => {});
  });
  onChange(['fitChecks'], () => void readyWatch.checksChanged().catch(() => {}));
  onNotificationTap(openTap);
}

export function useNotifications(): void {
  useEffect(() => {
    start();
  }, []);
}
