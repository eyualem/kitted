// The slide into Closet (specs/setup-and-you.md SY2): as a new check's card lands, small copies of the pictures in its
// `Added {n} to Closet` row slide into the Closet tab, then the tab's badge counts them. The iOS 26 tab bar draws above
// every screen, so the copies fly in a root-level layer (SlideHost, app/_layout.tsx), and the landing point is worked
// out from the bar's width: React Native can't ask UIKit where the Closet item is (tasks/T36/DESIGN.md → Risks).
// While a fresh card's pieces may still slide, its check is "held": the badge leaves them out until they land, or the
// card says there'll be no slide (off screen, Reduce Motion, nothing new), or it goes away.
import { useSyncExternalStore } from 'react';
import type { ClosetItemRow } from '@/data/types';

/** About 0.6 s in all (SY2.2): each copy's flight, and the gap between copies. */
export const FLIGHT_MS = 520;
export const STAGGER_MS = 40;
/** A card that never gets to its row (the closet call still out, then given up) stops holding the badge after this. */
export const HOLD_MAX_MS = 20_000;

export interface FlightPiece {
  item: Pick<ClosetItemRow, 'id' | 'garment' | 'hex' | 'art' | 'name' | 'isPhotographed'>;
  /** The thumb's place on screen (window points). */
  x: number;
  y: number;
  size: number;
}

export interface Flight {
  checkId: string;
  pieces: FlightPiece[];
}

let flights: readonly Flight[] = [];
let held: ReadonlySet<string> = new Set();
const slid = new Set<string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

/** Whether the pieces slide (SY2.2, SY2.4, SY2.5): only a check new to him in this run, on its own card (not Past
 *  chats), with pieces it added (not only ones he had), the row on screen as it lands, Reduce Motion off, and once. */
export function shouldSlide(o: { fresh: boolean; readOnly: boolean; reduceMotion: boolean; onScreen: boolean; pieces: number; checkId: string }): boolean {
  return o.fresh && !o.readOnly && !o.reduceMotion && o.onScreen && o.pieces > 0 && !slid.has(o.checkId);
}

/** Where the Closet tab's icon sits: the floating capsule spans the width less 22 pt each side, with 4 equal items
 *  (Stylist, Closet, Lookbook, You), and its icons sit about 61 pt above the screen's bottom (iPhone, portrait). */
export function closetTabPoint(width: number, height: number): { x: number; y: number } {
  const inset = 22;
  return { x: inset + ((width - inset * 2) * 1.5) / 4, y: height - 61 };
}

/** A fresh card's check: the badge leaves its pieces out until they land (or `release`). */
export function holdBadge(checkId: string): void {
  if (slid.has(checkId) || held.has(checkId)) return;
  held = new Set([...held, checkId]);
  timers.set(checkId, setTimeout(() => release(checkId), HOLD_MAX_MS));
  emit();
}

export function release(checkId: string): void {
  const t = timers.get(checkId);
  if (t) clearTimeout(t);
  timers.delete(checkId);
  if (!held.has(checkId)) return;
  const next = new Set(held);
  next.delete(checkId);
  held = next;
  emit();
}

/** Start the slide (the card already decided it should). The badge keeps holding them until `landed`. */
export function launch(flight: Flight): void {
  if (slid.has(flight.checkId)) return;
  slid.add(flight.checkId);
  const t = timers.get(flight.checkId);
  if (t) clearTimeout(t);
  timers.delete(flight.checkId);
  flights = [...flights, flight];
  emit();
}

/** The copies reached the tab: they go, and the badge counts them. */
export function landed(checkId: string): void {
  flights = flights.filter((f) => f.checkId !== checkId);
  release(checkId);
  emit();
}

/** The card decided there's no slide: mark it, so a remount (a scroll, a relaunch of the list) never plays it later. */
export function noSlide(checkId: string): void {
  slid.add(checkId);
  release(checkId);
}

export function useFlights(): readonly Flight[] {
  return useSyncExternalStore(subscribe, () => flights, () => flights);
}

/** The checks the badge leaves out right now. */
export function heldChecks(): ReadonlySet<string> {
  return held;
}

export function useHeldChecks(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, heldChecks, heldChecks);
}

/** Tests only. */
export function resetSlide(): void {
  flights = [];
  held = new Set();
  slid.clear();
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}
