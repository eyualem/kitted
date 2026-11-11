// Demo screens 284–291 (T53; DESIGN phones 8–14): You → Notifications in each permission state, and the comeback
// question with its answers. Scripts iOS's answer (switch.ts), writes the switches and the schedule's state into the
// fresh store, and plays the taps through the same code the app runs. Demo screens never schedule a real notification
// (nudgeSession.ts records instead).
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';
import type { ScreenScenario } from '@/demo/scenarios';
import { setDemoNotify } from '@/features/paywall/switch';
import { saveIdeaTime } from '@/features/settings/prefs';
import type { NotifyPermission } from '@/services/notifications';
import { NOTIFY_KV, setNotifyKv } from './nudges';
import { nudges } from './nudgeSession';

export interface NotifyDemo {
  permission: NotifyPermission;
  /** Apple's prompt's answer when a switch asks (default allow). */
  answer?: 'allow' | 'deny' | 'pending';
  idea?: '1' | '0';
  ready?: '1' | '0';
  ideaTime?: string;
  /** A schedule that ran out 1+ day ago (notify.through in the past): the next open asks the comeback question. */
  lapse?: boolean;
  paused?: boolean;
  steps?: ('comebackOn' | 'comebackTime' | 'comebackNo')[];
}

const DAY = 86_400_000;

export async function prepareNudgeDemo(store: KittedStore, sc: ScreenScenario, nowMs: number): Promise<void> {
  const n = sc.notify;
  if (!n) return;
  setDemoNotify(n.answer ?? 'allow', n.permission);
  if (n.idea) await store.setKv(KV.notifyIdea, n.idea);
  if (n.ready) await store.setKv(KV.notifyReady, n.ready);
  if (n.ideaTime) await saveIdeaTime(store, n.ideaTime);
  if (n.paused) await setNotifyKv(store, NOTIFY_KV.paused, '1');
  if (!n.lapse) return;
  await setNotifyKv(store, NOTIFY_KV.through, String(nowMs - DAY));
  const res = await nudges.reschedule('open');
  if (res.kind !== 'comeback') return;
  for (const step of n.steps ?? []) {
    if (step === 'comebackOn') await nudges.comebackOn(res.messageId);
    else if (step === 'comebackTime') await nudges.comebackShowTime(res.messageId);
    else await nudges.comebackNo(res.messageId);
  }
}
