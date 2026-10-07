// The root gate (02 §1.1): age-blocked → age stop; onboarding not done → onboarding; else tabs.
// A ~30-line store on useSyncExternalStore (no state library, 05 §3.2).
import { useSyncExternalStore } from 'react';
import { KV } from '@/data/store';
import { store } from '@/data/db';
import { setAgeBlocked as persistAgeBlocked } from '@/data/secure';

export interface GateState {
  ready: boolean;
  ageBlocked: boolean;
  onboarded: boolean;
}

let state: GateState = { ready: false, ageBlocked: false, onboarded: false };
const listeners = new Set<() => void>();

function set(patch: Partial<GateState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getGate(): GateState {
  return state;
}

export function markGateReady(values: Omit<GateState, 'ready'>) {
  set({ ...values, ready: true });
}

export async function setOnboarded(done: boolean): Promise<void> {
  if (done) await store.setKv(KV.onboardingDone, '1');
  else await store.deleteKv(KV.onboardingDone);
  set({ onboarded: done });
}

export async function setAgeBlocked(blocked: boolean): Promise<void> {
  await persistAgeBlocked(blocked);
  set({ ageBlocked: blocked });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useGate(): GateState {
  return useSyncExternalStore(subscribe, getGate, getGate);
}
