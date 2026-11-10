// T53 stub (written by the test writer): the daily nudge's pure rules. The implementer replaces every function here.
import type { ZoneOffset } from '@kitted/core';
import type { NotifyPermission } from '@/services/notifications';

const notBuilt = (): never => {
  throw new Error('T53: not built');
};

export const NUDGE_DAYS = 7;
export const NUDGE_LEAD_MIN = 15;
export const NOTIFY_KV = {
  asked: 'notify.asked',
  through: 'notify.through',
  paused: 'notify.paused',
  comebackFor: 'notify.comebackFor',
  bigEnoughAt: 'notify.bigEnoughAt',
  bigEnoughDone: 'notify.bigEnoughDone',
} as const;

export function nudgeHHMM(_ideaTime: string): string {
  return notBuilt();
}
export function nudgeLabel(_ideaTime: string): string {
  return notBuilt();
}
export function nudgeTimes(_nowMs: number, _ideaTime: string, _zone: ZoneOffset): number[] {
  return notBuilt();
}
export function landsToday(_nowMs: number, _ideaTime: string, _zone: ZoneOffset): boolean {
  return notBuilt();
}
export type NudgeLine = 'check' | 'bigEnough' | 'idea';
export function nudgeLines(_canSuggest: readonly boolean[], _bigEnoughDone: boolean): NudgeLine[] {
  return notBuilt();
}
export function nudgeBody(_line: NudgeLine): string {
  return notBuilt();
}
export function readyBody(_fixCount: number): string {
  return notBuilt();
}
export function askDoneLine(_when: 'today' | 'tomorrow', _ideaTime: string): string {
  return notBuilt();
}
export function backOnLine(_when: 'today' | 'tomorrow', _ideaTime: string): string {
  return notBuilt();
}
export interface SwitchView {
  idea: boolean;
  timeRow: boolean;
  ready: boolean;
  offCard: boolean;
  greyed: boolean;
}
export function switchesShown(_i: { ideaKv: string | null; readyKv: string | null; permission: NotifyPermission; paused: boolean }): SwitchView {
  return notBuilt();
}
