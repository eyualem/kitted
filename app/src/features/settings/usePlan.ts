// The plan the You screens show: the demo entitlement (`pro=1`) until P6's store, and on demo screens a
// `demoPlan` link parameter ('trial', 'yearly', 'monthly'). The server's tier makes it the beta plan (FP7).
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useSyncExternalStore } from 'react';
import { DEMO_ENABLED } from '@/demo/config';
import { demoEntitlements, useIsPro } from '@/services/entitlements';
import { onTierChange, tierNow } from '@/services/server/tier';
import { getDemoArgs, sessionClock } from '@/state/session';
import { currentPlan, type PlanInfo } from './plan';

export const isProNow = (): boolean => demoEntitlements.isPro() || getDemoArgs().pro;

export function usePlan(): PlanInfo {
  const { demoPlan } = useLocalSearchParams<{ demoPlan?: string }>();
  const pro = useIsPro() || getDemoArgs().pro;
  const tier = useSyncExternalStore(onTierChange, tierNow, tierNow);
  return useMemo(() => currentPlan(pro, sessionClock.nowMs(), DEMO_ENABLED ? (demoPlan ?? null) : null, tier), [pro, demoPlan, tier]);
}
