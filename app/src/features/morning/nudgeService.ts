// T53 stub (written by the test writer): the nudge service. The implementer replaces it.
import type { KittedStore } from '@/data/store';
import type { Clock } from '@/services/clock';
import type { NotificationPermissions, NotificationScheduler, NotifyPermission } from '@/services/notifications';
import type { NudgeLine } from './nudges';

export interface NudgeDeps {
  store: KittedStore;
  clock: Clock;
  ids: (prefix: string) => string;
  built: () => boolean;
  permissions: NotificationPermissions;
  scheduler: NotificationScheduler;
  canSuggest: (atMs: number) => Promise<boolean>;
  ageBlocked: () => Promise<boolean>;
  afterTodaysCard: () => Promise<void>;
}
export type Trigger = 'open' | 'foreground' | 'background' | 'change';
export type RescheduleResult =
  | { kind: 'scheduled'; atMs: number[]; lines: NudgeLine[] }
  | { kind: 'cancelled'; why: 'unbuilt' | 'age' | 'permission' | 'off' }
  | { kind: 'paused' }
  | { kind: 'comeback'; messageId: string };

export function createNudgeService(_d: NudgeDeps): {
  reschedule(trigger: Trigger): Promise<RescheduleResult>;
  setIdea(on: boolean): Promise<NotifyPermission>;
  setReady(on: boolean): Promise<NotifyPermission>;
  setTime(hhmm: string): Promise<void>;
  comebackOn(messageId: string): Promise<void>;
  comebackShowTime(messageId: string): Promise<void>;
  comebackPickTime(messageId: string, hhmm: string): Promise<void>;
  comebackNo(messageId: string): Promise<void>;
  cancelAll(): Promise<void>;
  paused(): Promise<boolean>;
} {
  const notBuilt = (): never => {
    throw new Error('T53: not built');
  };
  return {
    reschedule: notBuilt, setIdea: notBuilt, setReady: notBuilt, setTime: notBuilt, comebackOn: notBuilt, comebackShowTime: notBuilt,
    comebackPickTime: notBuilt, comebackNo: notBuilt, cancelAll: notBuilt, paused: notBuilt,
  };
}
export type NudgeService = ReturnType<typeof createNudgeService>;
