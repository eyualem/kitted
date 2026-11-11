// Notifications behind interfaces (specs/notifications.md; T53). Everything here is pure and safe in Jest: the
// permission and the scheduler as interfaces, what iOS is handed for each notification, and the stand-ins demo screens
// use (a scripted permission, a scheduler that only records). The real ones, over expo-notifications, live in
// notificationsNative.ts, the only file that imports the package. Nothing here talks to a server: every notification
// is scheduled on the phone (no push token is ever asked for).

export type NotifyPermission = 'undetermined' | 'granted' | 'denied';

export interface NotificationPermissions {
  /** What iOS says now, without asking. */
  permission(): Promise<NotifyPermission>;
  /** Apple's prompt, only when never asked; otherwise the current answer. */
  request(): Promise<NotifyPermission>;
}

/** What a tap carries back to the app. */
export type NotificationData = { kind: 'nudge' } | { kind: 'ready'; checkId: string };

export interface LocalNotification {
  /** 'nudge|YYYY-MM-DD' (the local calendar date) or 'ready|<checkId>'. */
  id: string;
  /** The one line. There is no title: iOS shows "Kitted" above it. */
  body: string;
  /** When it fires; null = now (Fit check ready). */
  atMs: number | null;
  data: NotificationData;
}

export interface NotificationScheduler {
  /** Cancels every scheduled one, then schedules `list`. */
  replaceNudges(list: readonly LocalNotification[]): Promise<void>;
  cancelAll(): Promise<void>;
  presentNow(n: LocalNotification): Promise<void>;
  /** What is scheduled now. */
  pending(): Promise<LocalNotification[]>;
}

export type SchedulerCall =
  | { op: 'replaceNudges'; list: LocalNotification[] }
  | { op: 'cancelAll' }
  | { op: 'presentNow'; n: LocalNotification };

/** iOS's extra time to finish work after the app leaves the screen (the fit check in flight, NT6). */
export interface BackgroundWork {
  /** An id to end it with; null when the build can't ask. */
  begin(): Promise<string | null>;
  end(id: string): void;
}

/** A build without the native module (the web preview, an older phone build): never asked, and asking does nothing. */
export const unbuiltNotifications: NotificationPermissions = {
  permission: async () => 'undetermined',
  request: async () => 'undetermined',
};

/** A demo screen's iOS: starts at `start`; Apple's "prompt" (request() while undetermined) answers allow → granted,
 *  deny → denied, pending → never answers (the prompt stays up). `requests` counts request() calls. */
export function scriptedNotifications(answer: 'allow' | 'deny' | 'pending', start: NotifyPermission = 'undetermined'): NotificationPermissions & { requests: number } {
  let now: NotifyPermission = start;
  const s = {
    requests: 0,
    permission: async () => now,
    request: (): Promise<NotifyPermission> => {
      s.requests += 1;
      if (now !== 'undetermined') return Promise.resolve(now);
      if (answer === 'pending') return new Promise<NotifyPermission>(() => {});
      now = answer === 'allow' ? 'granted' : 'denied';
      return Promise.resolve(now);
    },
  };
  return s;
}

/** Demo screens' scheduler: keeps every call in order and schedules nothing real. `pending()` is the last
 *  replaceNudges list, [] after cancelAll. */
export function recordingScheduler(): NotificationScheduler & { calls: SchedulerCall[] } {
  let pending: LocalNotification[] = [];
  const calls: SchedulerCall[] = [];
  return {
    calls,
    replaceNudges: async (list) => {
      calls.push({ op: 'replaceNudges', list: [...list] });
      pending = [...list];
    },
    cancelAll: async () => {
      calls.push({ op: 'cancelAll' });
      pending = [];
    },
    presentNow: async (n) => {
      calls.push({ op: 'presentNow', n });
    },
    pending: async () => [...pending],
  };
}

/** What iOS gets for `n`: the body alone (no title), the default sound, no badge. */
export function notificationContent(n: LocalNotification): { body: string; sound: 'default'; data: NotificationData } {
  return { body: n.body, sound: 'default', data: n.data };
}

/** When: a date trigger, or null for now. */
export function notificationTrigger(n: LocalNotification): { type: 'date'; date: number } | null {
  return n.atMs === null ? null : { type: 'date', date: n.atMs };
}

/** Builds that can't ask iOS for extra time. */
export const noBackgroundWork: BackgroundWork = {
  begin: async () => null,
  end: () => {},
};
