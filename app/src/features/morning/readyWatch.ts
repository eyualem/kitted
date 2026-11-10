// T53 stub (written by the test writer): Fit check ready. The implementer replaces it.
import type { KittedStore } from '@/data/store';
import type { BackgroundWork, NotificationPermissions, NotificationScheduler } from '@/services/notifications';

export interface ReadyDeps {
  store: KittedStore;
  built: () => boolean;
  permissions: NotificationPermissions;
  scheduler: NotificationScheduler;
  background: BackgroundWork;
  ageBlocked: () => Promise<boolean>;
}
export function createReadyWatch(_d: ReadyDeps): {
  appState(s: 'active' | 'background' | 'inactive'): Promise<void>;
  checksChanged(): Promise<void>;
} {
  const notBuilt = (): never => {
    throw new Error('T53: not built');
  };
  return { appState: notBuilt, checksChanged: notBuilt };
}
