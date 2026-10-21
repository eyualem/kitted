// G2 toasts (02 G2, 03 UndoToast): one at a time; a new one replaces the old. 5 s on screen
// (10 s with VoiceOver on, since RN can't pause on VoiceOver focus; DECISIONS-LOG #36). An Undo toast shows its
// time left as a ring and can be held to pause, up to a hard stop (09-ui-review §21, #324).
import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  text: string;
  /** Shows "Undo" with its countdown ring; tapping it runs this and hides the toast. */
  undo?: () => void | Promise<void>;
  /** On screen this long (doubled with VoiceOver on); default TOAST_MS. */
  ms?: number;
  /** Wall clock (Date.now) when it was shown: the countdown runs on real time, across background (#324). */
  shownAt: number;
  /** Demo screens only: start held with this much time left, so a screenshot catches the ring mid-way. */
  demoHeldAtMs?: number;
}

export const TOAST_MS = 5_000;
export const TOAST_MS_VOICEOVER = 10_000;

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** A removal's Undo is the only way back, so it stays longer (#118). */
export const TOAST_MS_REMOVAL = 8_000;

export function showToast(text: string, undo?: Toast['undo'], o: { ms?: number; demoHeldAtMs?: number } = {}): number {
  current = { id: nextId++, text, undo, shownAt: Date.now(), ...(o.ms ? { ms: o.ms } : {}), ...(o.demoHeldAtMs ? { demoHeldAtMs: o.demoHeldAtMs } : {}) };
  emit();
  return current.id;
}

/** How long it shows: its window, doubled with VoiceOver on (at least TOAST_MS_VOICEOVER). */
export function toastWindowMs(toast: Pick<Toast, 'ms'>, voiceOver: boolean): number {
  const ms = toast.ms ?? TOAST_MS;
  return voiceOver ? toastHardStopMs(toast) : ms;
}

/** No hold keeps a toast past this (from when it showed): VoiceOver's window. A removal's pictures are deleted
 *  after DELETE_AFTER_MS (closet/fileCleanup), which must stay later than this. */
export function toastHardStopMs(toast: Pick<Toast, 'ms'>): number {
  return Math.max(TOAST_MS_VOICEOVER, (toast.ms ?? TOAST_MS) * 2);
}

/** The Undo countdown (#324), on wall-clock time. Pure: the host keeps one per toast. */
export interface Countdown {
  windowMs: number;
  /** When it runs out if nothing pauses it again. */
  endsAt: number;
  /** The hard stop: it hides here even while held. */
  stopAt: number;
  /** Set while held. */
  heldAt: number | null;
}

export function startCountdown(shownAt: number, windowMs: number, hardStopMs: number): Countdown {
  return { windowMs, endsAt: shownAt + windowMs, stopAt: shownAt + Math.max(windowMs, hardStopMs), heldAt: null };
}

export function holdCountdown(c: Countdown, now: number): Countdown {
  return c.heldAt !== null ? c : { ...c, heldAt: now };
}

export function releaseCountdown(c: Countdown, now: number): Countdown {
  if (c.heldAt === null) return c;
  return { ...c, endsAt: Math.min(c.stopAt, c.endsAt + Math.max(0, now - c.heldAt)), heldAt: null };
}

/** Time left on the ring (frozen while held, never past the hard stop). */
export function countdownLeftMs(c: Countdown, now: number): number {
  const left = c.heldAt !== null ? Math.min(c.endsAt - c.heldAt, c.stopAt - now) : Math.min(c.endsAt, c.stopAt) - now;
  return Math.max(0, Math.min(c.windowMs, left));
}

/** When the toast hides: the hard stop while held, else when the count runs out. */
export function countdownHidesAt(c: Countdown): number {
  return c.heldAt !== null ? c.stopAt : Math.min(c.endsAt, c.stopAt);
}

/** The number in the ring: whole seconds left, rounded up (5 at the start, 1 in the last second). */
export function countdownSeconds(leftMs: number): number {
  return Math.ceil(leftMs / 1000 - 1e-6);
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
