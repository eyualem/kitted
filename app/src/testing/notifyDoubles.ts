// Test only, never imported by the app (T53's locked tests). The test writer's own doubles for iOS's notification
// permission, the scheduler and iOS's background time, so the oracle the T53 tests judge by is not the code under
// test (the app's own `scriptedNotifications` / `recordingScheduler` are checked separately, in T53-nudges).
// Never edit this to make a test pass.
import { localParts, type ZoneOffset } from '@kitted/core';
import type {
  BackgroundWork, LocalNotification, NotificationPermissions, NotificationScheduler, NotifyPermission, SchedulerCall,
} from '@/services/notifications';

export type IosDouble = NotificationPermissions & {
  /** Every request() call. */
  requests: number;
  /** Apple's prompt actually shown: a request() while undetermined. */
  prompts: number;
  /** iOS Settings changed behind the app's back. */
  set(p: NotifyPermission): void;
};

/** iOS's permission: starts at `start`; Apple's prompt (request() while undetermined) answers allow → granted, deny →
 *  denied, pending → never resolves. Outside undetermined, request() returns the current answer with no prompt. */
export function iosDouble(answer: 'allow' | 'deny' | 'pending' = 'allow', start: NotifyPermission = 'undetermined'): IosDouble {
  let now: NotifyPermission = start;
  const d: IosDouble = {
    requests: 0,
    prompts: 0,
    set: (p) => {
      now = p;
    },
    permission: async () => now,
    request: () => {
      d.requests += 1;
      if (now !== 'undetermined') return Promise.resolve(now);
      d.prompts += 1;
      if (answer === 'pending') return new Promise<NotifyPermission>(() => {});
      now = answer === 'allow' ? 'granted' : 'denied';
      return Promise.resolve(now);
    },
  };
  return d;
}

export type SchedulerDouble = NotificationScheduler & {
  calls: SchedulerCall[];
  /** `order` receives 'cancelAll' / 'replaceNudges' / 'presentNow' as they happen (shared with other recorders). */
  order: string[];
  /** Every list ever handed to replaceNudges, and every presentNow. */
  lists(): LocalNotification[][];
  presented(): LocalNotification[];
  last(): SchedulerCall | undefined;
};

/** A scheduler that keeps every call; what is pending is the last replaceNudges list, [] after cancelAll. */
export function schedulerDouble(order: string[] = []): SchedulerDouble {
  let pending: LocalNotification[] = [];
  const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  const d: SchedulerDouble = {
    calls: [],
    order,
    replaceNudges: async (list) => {
      d.calls.push({ op: 'replaceNudges', list: copy([...list]) });
      order.push('replaceNudges');
      pending = copy([...list]);
    },
    cancelAll: async () => {
      d.calls.push({ op: 'cancelAll' });
      order.push('cancelAll');
      pending = [];
    },
    presentNow: async (n) => {
      d.calls.push({ op: 'presentNow', n: copy(n) });
      order.push('presentNow');
    },
    pending: async () => copy(pending),
    lists: () => d.calls.flatMap((c) => (c.op === 'replaceNudges' ? [c.list] : [])),
    presented: () => d.calls.flatMap((c) => (c.op === 'presentNow' ? [c.n] : [])),
    last: () => d.calls[d.calls.length - 1],
  };
  return d;
}

/** iOS's extra background time: begin() hands out ids 'bg-1', 'bg-2', …; every begin/end is kept. */
export function backgroundDouble(): BackgroundWork & { begun: string[]; ended: string[] } {
  let n = 0;
  const d = {
    begun: [] as string[],
    ended: [] as string[],
    begin: async () => {
      n += 1;
      const id = `bg-${n}`;
      d.begun.push(id);
      return id;
    },
    end: (id: string) => {
      d.ended.push(id);
    },
  };
  return d;
}

/** The local calendar date of a notification's fire time (midnight to midnight, no 4 am rollover). */
export function localDate(ms: number, zone: ZoneOffset): string {
  const p = localParts(ms, zone);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** Every body a nudge or Fit check ready may ever carry (NT2, NT6). */
export const ALLOWED_BODIES = [
  "Check today's fit. Each one teaches me your closet.",
  "Your closet's big enough now: here's today's idea.",
  "Today's outfit idea is ready.",
  'Your fit check is ready. 1 quick fix inside.',
  'Your fit check is ready.',
] as const;
export const READY_N = /^Your fit check is ready\. ([2-9]|[1-9]\d+) quick fixes inside\.$/;

export const CHECK_LINE = "Check today's fit. Each one teaches me your closet.";
export const BIG_LINE = "Your closet's big enough now: here's today's idea.";
export const IDEA_LINE = "Today's outfit idea is ready.";
