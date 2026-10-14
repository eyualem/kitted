// The plan the You screens show: the demo entitlement (`pro=1`) until P6's store, and on demo screens a
// `demoPlan` link parameter ('trial', 'yearly', 'monthly').
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { DEMO_ENABLED } from '@/demo/config';
import { demoEntitlements, useIsPro } from '@/services/entitlements';
import { getDemoArgs, sessionClock } from '@/state/session';
import { currentPlan, type PlanInfo } from './plan';

export const isProNow = (): boolean => demoEntitlements.isPro() || getDemoArgs().pro;

export function usePlan(): PlanInfo {
  const { demoPlan } = useLocalSearchParams<{ demoPlan?: string }>();
  const pro = useIsPro() || getDemoArgs().pro;
  return useMemo(() => currentPlan(pro, sessionClock.nowMs(), DEMO_ENABLED ? (demoPlan ?? null) : null), [pro, demoPlan]);
}
