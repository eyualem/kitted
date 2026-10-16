// The app's one end-of-onboarding sequence (10-onboarding.md §9), and the hook Stylist runs it from.
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';
import { store } from '@/data/db';
import { onChange } from '@/data/changes';
import { fitCheck } from '@/features/fitcheck/session';
import { isProNow } from '@/features/settings/usePlan';
import { notifications, notificationsOn, paywallOn } from '@/features/paywall/switch';
import { newId } from '@/services/ids';
import { getDemoArgs, sessionClock } from '@/state/session';
import { createFinishService } from './service';

let inFront = false;
/** Demo screens that aren't about this sequence leave it alone, so their stories and screenshots don't change. */
let demoAllows = false;

export function setDemoFinish(on: boolean): void {
  demoAllows = on;
}

/** Off on demo screens that aren't about this sequence (their stories and screenshots stay as they were). */
export const sequenceOn = (): boolean => getDemoArgs().demoScreen === null || demoAllows;

export const finish = createFinishService({
  store,
  clock: sessionClock,
  ids: newId,
  busy: () => fitCheck.getState().kind !== 'idle',
  enabled: () => sequenceOn(),
  paywallOn,
  isPro: isProNow,
  notificationsOn,
  notifications,
  stylistInFront: () => inFront,
  openPaywall: () => router.push({ pathname: '/paywall', params: { from: 'onboarding' } }),
  later: (fn, ms) => {
    setTimeout(fn, ms);
  },
});

export function useFinishSequence(): void {
  useFocusEffect(
    useCallback(() => {
      inFront = true;
      void finish.ensure();
      const off = onChange(['fitChecks'], () => {
        finish.checksChanged();
        void finish.ensure();
      });
      const sub = AppState.addEventListener('change', (st) => {
        if (st === 'background') finish.left();
        if (st === 'active') {
          finish.back();
          void finish.ensure();
        }
      });
      return () => {
        inFront = false;
        off();
        sub.remove();
      };
    }, []),
  );
}
