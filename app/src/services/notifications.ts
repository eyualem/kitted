// The notification permission behind an interface (02 S15, Y6; 10-onboarding.md §9.5). expo-notifications is a new
// package (the founder's OK, on his list), so nothing here can show the system prompt yet: the real build has no ask
// (NOTIFICATIONS_BUILT = false) and nothing is scheduled. Demo screens script the answer. When the package is in, an
// `expoNotifications` implementing the same interface replaces `unbuiltNotifications`, and the S15 card is unchanged.
import type { NotifyPermission } from '@/features/finish/sequence';
export type { NotifyPermission };

export interface NotificationPermissions {
  /** What the system says now, without asking. */
  permission(): Promise<NotifyPermission>;
  /** Shows the system prompt (only when never asked) and returns the answer. */
  request(): Promise<NotifyPermission>;
}

/** No package yet: never asked, and asking does nothing. Only reachable if the ask were shown (it isn't, §9.5). */
export const unbuiltNotifications: NotificationPermissions = {
  permission: async () => 'undetermined',
  request: async () => 'undetermined',
};

/** A demo screen's scripted permission: the prompt "answers" allow or deny once, then stays that way. */
export function scriptedNotifications(answer: 'allow' | 'deny' | 'pending', start: NotifyPermission = 'undetermined'): NotificationPermissions & { requests: number } {
  // T53 stub (test writer): 'pending' and `requests` are not built yet.
  if (answer === 'pending') throw new Error('T53: not built');
  let now: NotifyPermission = start;
  return {
    permission: async () => now,
    request: async () => {
      if (now === 'undetermined') now = answer === 'allow' ? 'granted' : 'denied';
      return now;
    },
    get requests(): number {
      throw new Error('T53: not built');
    },
  };
}

// ── T53 stubs (written by the test writer; the implementer replaces them) ─────────────────────────────────────────
export type NotificationData = { kind: 'nudge' } | { kind: 'ready'; checkId: string };
export interface LocalNotification {
  id: string;
  body: string;
  atMs: number | null;
  data: NotificationData;
}
export interface NotificationScheduler {
  replaceNudges(list: readonly LocalNotification[]): Promise<void>;
  cancelAll(): Promise<void>;
  presentNow(n: LocalNotification): Promise<void>;
  pending(): Promise<LocalNotification[]>;
}
export type SchedulerCall =
  | { op: 'replaceNudges'; list: LocalNotification[] }
  | { op: 'cancelAll' }
  | { op: 'presentNow'; n: LocalNotification };
export function recordingScheduler(): NotificationScheduler & { calls: SchedulerCall[] } {
  throw new Error('T53: not built');
}
export function notificationContent(_n: LocalNotification): { body: string; sound: 'default'; data: NotificationData } {
  throw new Error('T53: not built');
}
export function notificationTrigger(_n: LocalNotification): { type: 'date'; date: number } | null {
  throw new Error('T53: not built');
}
export interface BackgroundWork {
  begin(): Promise<string | null>;
  end(id: string): void;
}
export const noBackgroundWork: BackgroundWork = {
  begin: () => {
    throw new Error('T53: not built');
  },
  end: () => {
    throw new Error('T53: not built');
  },
};
