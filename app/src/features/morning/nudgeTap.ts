// T53 stub (written by the test writer): what a notification tap opens. The implementer replaces it.
import type { KittedStore } from '@/data/store';
import type { StylistAction } from '@/router/stylistAction';
import type { Clock } from '@/services/clock';
import type { NotificationData } from '@/services/notifications';

export interface TapDeps {
  store: KittedStore;
  clock: Clock;
  ensureTodaysCard: () => Promise<unknown>;
  navigate: () => void;
  setAction: (a: StylistAction) => void;
}
export function openFromNotification(_data: NotificationData, _d: TapDeps): Promise<void> {
  throw new Error('T53: not built');
}
