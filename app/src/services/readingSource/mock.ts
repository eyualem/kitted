// MockReadingSource (04 §11): replays a bundled reading with the real timing. No network.
// Events at fractions of the total time T (default 6.6 s; 0 = instant for screenshots):
//   photoOK .03 (≤ 0.15 s) · sending .06 · top .40 · outer or held .52 · bottom .64 ·
//   shoes (or "not in photo") .78 · checking fit .85 · colors .92 · reading 1.0 · meta
// `holdAt` (0–1) stops after the events up to that fraction and waits for the abort signal:
// screen 6 freezes mid-reading this way. Lookup: demo photo id, then SHA-256, else unknownPhoto.

import { clone, type Garment, type Reading } from '@kitted/core';
import { AbortError, realScheduler, type Scheduler } from '../scheduler';
import { BOTTOM_SNAP_READING, demoLatency, demoReadingById, demoReadingBySha, SHOE_SNAP_READING } from './demoReadings';
import type { DemoFault, PreparedImage, ReadingEvent, ReadingSource, ReadKind, SlotKind } from './types';

export interface MockOptions {
  /** Seconds, or 'real' (the photo's own measured latency). */
  latency: () => number | 'real';
  fault?: () => DemoFault | null;
  scheduler?: Scheduler;
}

interface Step {
  at: number;
  event: ReadingEvent;
}

const MODEL = 'demo-bundled';
const PROMPT = 'v3';

function firstOf(r: Reading, category: string): Garment | undefined {
  return r.garments.find((g) => g.category === category && g.certainty !== 'unsure');
}

/** The event schedule for one reading (fractions of T). Exported for tests. */
export function scheduleFor(reading: Reading): Step[] {
  const top = firstOf(reading, 'top');
  const outer = firstOf(reading, 'outerwear');
  const held = (reading.held_items ?? []).find((g) => g.category === 'outerwear');
  const bottom = firstOf(reading, 'bottom');
  const shoes = firstOf(reading, 'footwear');
  const shoesVisible = reading.scene?.shoes_visible !== false && reading.scene?.framing !== 'upper_only';
  const bottomVisible = reading.scene?.framing !== 'upper_only';
  const expectedSlots = 3 + (outer || held ? 1 : 0);

  const steps: Step[] = [
    { at: 0.03, event: { type: 'stage', stage: 'photoOK' } },
    { at: 0.06, event: { type: 'stage', stage: 'sending', expectedSlots } },
  ];
  const found = (at: number, slot: SlotKind, garment: Garment | undefined) => {
    if (garment) steps.push({ at, event: { type: 'slotFound', slot, garment: clone(garment) } });
  };
  found(0.4, 'top', top);
  if (outer) found(0.52, 'outerwear', outer);
  else if (held) found(0.52, 'held', held);
  if (bottomVisible) found(0.64, 'bottom', bottom);
  else steps.push({ at: 0.64, event: { type: 'slotMissing', slot: 'bottom' } });
  if (shoesVisible && shoes) found(0.78, 'footwear', shoes);
  else steps.push({ at: 0.78, event: { type: 'slotMissing', slot: 'footwear' } });
  steps.push({ at: 0.85, event: { type: 'stage', stage: 'fit' } });
  steps.push({ at: 0.92, event: { type: 'stage', stage: 'color' } });
  steps.push({ at: 1, event: { type: 'reading', reading: clone(reading), model: MODEL, promptVersion: PROMPT } });
  return steps;
}

function lookup(image: PreparedImage, kind: ReadKind): { id: string; reading: Reading } | null {
  if (kind === 'shoeSnap') return { id: 's24_shoe_snap', reading: clone(SHOE_SNAP_READING) };
  if (kind === 'bottomSnap') return { id: 'p01b_bottom_snap', reading: clone(BOTTOM_SNAP_READING) };
  if (image.photoId) {
    const r = demoReadingById(image.photoId);
    if (r) return { id: image.photoId, reading: clone(r) };
  }
  const bySha = demoReadingBySha(image.sha256);
  return bySha ? { id: bySha.id, reading: clone(bySha.reading) } : null;
}

export function createMockReadingSource(opts: MockOptions): ReadingSource & { hedgeCalls: number; holdAt: number | null } {
  const scheduler = opts.scheduler ?? realScheduler;
  const source = {
    hedgeCalls: 0,
    /** Set by the demo for screen 6: stop after this fraction and wait. */
    holdAt: null as number | null,
    hedge() {
      source.hedgeCalls += 1;
    },
    async *read(image: PreparedImage, kind: ReadKind, o?: { signal?: AbortSignal }): AsyncGenerator<ReadingEvent> {
      const signal = o?.signal;
      const fault = opts.fault?.() ?? null;
      const hit = lookup(image, kind);
      if (!hit) {
        yield { type: 'failed', code: 'unknownPhoto', counted: false };
        return;
      }
      const lat = opts.latency();
      const T = (lat === 'real' ? demoLatency(hit.id) ?? 6.6 : lat) * 1000;
      if (fault === 'offline' || fault === 'paused') {
        yield { type: 'failed', code: fault, counted: false };
        return;
      }
      let reading = hit.reading;
      if (fault === 'notClothed') reading = { ...reading, scene: { ...(reading.scene ?? {}), clothed: 'partial' } };
      const steps = scheduleFor(reading);
      const hold = source.holdAt;
      let t = 0;
      try {
        for (const step of steps) {
          if (hold !== null && step.at > hold) {
            // Frozen mid-reading (screen 6): wait until the caller aborts.
            await new Promise<void>((_, reject) => {
              if (signal?.aborted) reject(new AbortError());
              signal?.addEventListener('abort', () => reject(new AbortError()), { once: true });
            });
          }
          const target = step.event.type === 'stage' && step.event.stage === 'photoOK' ? Math.min(step.at * T, 150) : step.at * T;
          if (target > t) {
            await scheduler.sleep(target - t, signal);
            t = target;
          }
          if (signal?.aborted) return;
          if (step.event.type === 'reading' && (fault === 'unreadable' || fault === 'ai')) {
            yield { type: 'failed', code: fault, counted: false };
            return;
          }
          yield step.event;
        }
        yield { type: 'meta', latencySeconds: T / 1000 };
      } catch (e) {
        if (e instanceof AbortError) return;
        throw e;
      }
    },
  };
  return source;
}
