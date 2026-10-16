// The notification permission behind an interface (02 S15, Y6; 10-onboarding.md §9.5). expo-notifications is a new
// package (the founder's OK, on his list), so nothing here can show the system prompt yet: the real build has no ask
// (NOTIFICATIONS_BUILT = false) and nothing is scheduled. Demo screens script the answer. When the package is in, an
// `expoNotifications` implementing the same interface replaces `unbuiltNotifications`, and the S15 card is unchanged.
import type { NotifyPermission } from '@/features/finish/sequence';

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
export function scriptedNotifications(answer: 'allow' | 'deny', start: NotifyPermission = 'undetermined'): NotificationPermissions {
  let now: NotifyPermission = start;
  return {
    permission: async () => now,
    request: async () => {
      if (now === 'undetermined') now = answer === 'allow' ? 'granted' : 'denied';
      return now;
    },
  };
}
