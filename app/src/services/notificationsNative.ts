// The real notifications, over expo-notifications (specs/notifications.md; T53). The only file that imports the package,
// and only when this build has its native module: a JS update that reaches a build without it (the founder's phone
// before its rebuild, the web preview) gets `nativeAvailable` false and the unbuilt stand-ins, never a crash.
// Local only: nothing here asks for a push token or talks to a server. No notification handler is set, so a nudge that
// fires while Kitted is in front isn't shown (iOS's default).
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { beginBackgroundWork, endBackgroundWork } from '../../modules/kitted-vision';
import {
  noBackgroundWork, notificationContent, notificationTrigger, unbuiltNotifications,
  type BackgroundWork, type LocalNotification, type NotificationData, type NotificationPermissions, type NotificationScheduler, type NotifyPermission,
} from './notifications';

type ExpoNotifications = typeof import('expo-notifications');

function load(): ExpoNotifications | null {
  if (Platform.OS !== 'ios') return null;
  if (!requireOptionalNativeModule('ExpoNotificationScheduler') || !requireOptionalNativeModule('ExpoNotificationPermissionsModule')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as ExpoNotifications;
  } catch {
    return null;
  }
}

const N = load();

/** False on web and on a build without the native module. */
export const nativeAvailable: boolean = N !== null;

function toPermission(s: Awaited<ReturnType<ExpoNotifications['getPermissionsAsync']>>): NotifyPermission {
  // Provisional (quiet) and ephemeral both deliver: count them as allowed.
  const ios = s.ios?.status;
  if (ios === 2 || ios === 3 || ios === 4) return 'granted';
  if (ios === 1) return 'denied';
  if (ios === 0) return 'undetermined';
  return s.granted ? 'granted' : s.canAskAgain ? 'undetermined' : 'denied';
}

export const nativePermissions: NotificationPermissions = N
  ? {
      permission: async () => toPermission(await N.getPermissionsAsync()),
      request: async () => toPermission(await N.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } })),
    }
  : unbuiltNotifications;

const isData = (v: unknown): v is NotificationData => {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return d.kind === 'nudge' || (d.kind === 'ready' && typeof d.checkId === 'string');
};

async function schedule(n: LocalNotification): Promise<void> {
  if (!N) return;
  const trigger = notificationTrigger(n);
  await N.scheduleNotificationAsync({
    identifier: n.id,
    content: notificationContent(n),
    trigger: trigger ? { type: N.SchedulableTriggerInputTypes.DATE, date: trigger.date } : null,
  });
}

export const nativeScheduler: NotificationScheduler = {
  async replaceNudges(list) {
    if (!N) return;
    await N.cancelAllScheduledNotificationsAsync();
    for (const n of list) await schedule(n);
  },
  async cancelAll() {
    if (N) await N.cancelAllScheduledNotificationsAsync();
  },
  presentNow: schedule,
  async pending() {
    if (!N) return [];
    const all = await N.getAllScheduledNotificationsAsync();
    return all.flatMap((r): LocalNotification[] => {
      const data = r.content.data;
      if (!isData(data)) return [];
      const t = r.trigger as { type?: string; date?: number | string; value?: number } | null;
      const at = t && t.type === 'date' ? Number(t.value ?? t.date) : null;
      return [{ id: r.identifier, body: r.content.body ?? '', atMs: Number.isFinite(at) ? at : null, data }];
    });
  },
};

/** iOS's extra time while a fit check finishes after he leaves (the app's own native module). */
export const nativeBackgroundWork: BackgroundWork = N ? { begin: beginBackgroundWork, end: endBackgroundWork } : noBackgroundWork;

/** A tap on a nudge or on Fit check ready while the app runs (or wakes from the background). */
export function onNotificationTap(cb: (data: NotificationData) => void): () => void {
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener((r) => {
    const data = r.notification.request.content.data;
    if (isData(data)) cb(data);
  });
  return () => sub.remove();
}

/** The tap that started the app from cold, once. */
export async function lastTap(): Promise<NotificationData | null> {
  if (!N) return null;
  const r = await N.getLastNotificationResponseAsync();
  if (!r) return null;
  await N.clearLastNotificationResponseAsync().catch(() => {});
  const data = r.notification.request.content.data;
  return isData(data) ? data : null;
}
