// T53 stub (written by the test writer): the app's wired nudge service and ready watch. The implementer replaces it.
import type { NudgeService } from './nudgeService';
import type { createReadyWatch } from './readyWatch';

const notBuilt = (): never => {
  throw new Error('T53: not built');
};

export const nudges: NudgeService = {
  reschedule: notBuilt, setIdea: notBuilt, setReady: notBuilt, setTime: notBuilt, comebackOn: notBuilt, comebackShowTime: notBuilt,
  comebackPickTime: notBuilt, comebackNo: notBuilt, cancelAll: notBuilt, paused: notBuilt,
};
export const readyWatch: ReturnType<typeof createReadyWatch> = { appState: notBuilt, checksChanged: notBuilt };
export function useNotifications(): void {}
