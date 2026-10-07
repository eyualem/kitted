// G2 toasts (02 G2, 03 UndoToast): one at a time; a new one replaces the old. 5 s on screen
// (10 s with VoiceOver on, since RN can't pause on VoiceOver focus; DECISIONS-LOG #36).
import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  text: string;
  /** Shows a copper "Undo"; tapping it runs this and hides the toast. */
  undo?: () => void | Promise<void>;
}

export const TOAST_MS = 5_000;
export const TOAST_MS_VOICEOVER = 10_000;

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(text: string, undo?: Toast['undo']): number {
  current = { id: nextId++, text, undo };
  emit();
  return current.id;
}

/** Hide this toast (no-op if a newer one replaced it). */
export function hideToast(id: number) {
  if (current?.id !== id) return;
  current = null;
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getToast(): Toast | null {
  return current;
}

export function useToast(): Toast | null {
  return useSyncExternalStore(subscribe, getToast, getToast);
}

/** A screen with its own bottom dock (Stylist's composer) lifts toasts above it while in front. */
let floor = 0;
const floorListeners = new Set<() => void>();
export function setToastFloor(px: number) {
  if (px === floor) return;
  floor = px;
  floorListeners.forEach((l) => l());
}
export function useToastFloor(): number {
  return useSyncExternalStore(
    (cb) => {
      floorListeners.add(cb);
      return () => {
        floorListeners.delete(cb);
      };
    },
    () => floor,
    () => floor,
  );
}
