// The live state of the reading card (02 D6), as a pure reducer with an explicit state union
// (05 §3.2). The service feeds it reading events and timer ticks; the skeleton card renders it.
// Everything durable (score, fixes, failures) lives in the fit_checks row, not here.

import type { Garment } from '@kitted/core';
import type { OccasionKey } from '@/data/types';
import type { ReadingEvent, SlotKind } from '@/services/readingSource/types';

export type CheckMode = 'check' | 'recheck' | 'shoeSnap';
export type ReadingStage = 'pieces' | 'fit' | 'color' | 'fixes';

export interface SlotPill {
  slot: SlotKind | 'footwear' | 'bottom';
  garment: Garment | null;
  state: 'found' | 'missing';
}

export type SessionState =
  | { kind: 'idle' }
  | {
      kind: 'reading';
      checkId: string;
      mode: CheckMode;
      attempt: number;
      stage: ReadingStage;
      slots: SlotPill[];
      /** Slots this reading should find (3, or 4 with a layer). */
      expected: number;
      /** 9 s: "Taking longer than usual" (ruling 19). */
      slow: boolean;
      /** 5 s without a first slot: the hedge request was sent (once). */
      hedged: boolean;
      occasion: OccasionKey;
      /** He tapped an occasion chip (the hint hides, B13). */
      occasionTouched: boolean;
    };

export type SessionEvent =
  | { t: 'start'; checkId: string; mode: CheckMode; occasion: OccasionKey; attempt: number }
  | { t: 'read'; attempt: number; e: ReadingEvent }
  | { t: 'tick'; attempt: number; which: 'hedge' | 'slow' }
  | { t: 'occasion'; occasion: OccasionKey }
  | { t: 'scored'; attempt: number }
  | { t: 'end' };

export const IDLE: SessionState = { kind: 'idle' };

export function reduce(s: SessionState, ev: SessionEvent): SessionState {
  switch (ev.t) {
    case 'start':
      return {
        kind: 'reading', checkId: ev.checkId, mode: ev.mode, attempt: ev.attempt, stage: 'pieces', slots: [], expected: 4,
        slow: false, hedged: false, occasion: ev.occasion, occasionTouched: false,
      };
    case 'end':
      return IDLE;
    default:
      break;
  }
  if (s.kind !== 'reading') return s;
  switch (ev.t) {
    case 'occasion':
      // A re-check keeps the first check's occasion (02 D10), so taps are ignored there.
      return s.mode === 'recheck' ? s : { ...s, occasion: ev.occasion, occasionTouched: true };
    case 'tick':
      if (ev.attempt !== s.attempt) return s; // a stale timer from an earlier attempt
      if (ev.which === 'slow') return s.slow ? s : { ...s, slow: true };
      return s.hedged || s.slots.some((x) => x.state === 'found') ? s : { ...s, hedged: true };
    case 'scored':
      return ev.attempt === s.attempt ? { ...s, stage: 'fixes' } : s;
    case 'read': {
      if (ev.attempt !== s.attempt) return s;
      const e = ev.e;
      switch (e.type) {
        case 'stage':
          if (e.stage === 'sending' && e.expectedSlots) return { ...s, expected: e.expectedSlots };
          if (e.stage === 'fit') return { ...s, stage: 'fit' };
          if (e.stage === 'color') return { ...s, stage: 'color' };
          return s;
        case 'slotFound':
          return { ...s, slots: [...s.slots, { slot: e.slot, garment: e.garment, state: 'found' }] };
        case 'slotMissing':
          return { ...s, slots: [...s.slots, { slot: e.slot, garment: null, state: 'missing' }] };
        default:
          return s;
      }
    }
  }
}

/** "3 of 4" for the first stage row. */
export function piecesCount(s: Extract<SessionState, { kind: 'reading' }>): { found: number; total: number } {
  return { found: s.slots.filter((x) => x.state === 'found').length, total: s.expected };
}

/** The four rows' states for StageList. */
export function stageStates(stage: ReadingStage): ('done' | 'now' | 'pending')[] {
  const order: ReadingStage[] = ['pieces', 'fit', 'color', 'fixes'];
  const i = order.indexOf(stage);
  return order.map((_, k) => (k < i ? 'done' : k === i ? 'now' : 'pending'));
}

/** Which pending pill to show next ("Shoes…") until every expected slot has reported. */
export function pendingSlots(s: Extract<SessionState, { kind: 'reading' }>): ('top' | 'bottom' | 'footwear')[] {
  const seen = new Set(s.slots.map((x) => (x.slot === 'held' || x.slot === 'outerwear' ? 'layer' : x.slot)));
  return (['top', 'bottom', 'footwear'] as const).filter((k) => !seen.has(k));
}
