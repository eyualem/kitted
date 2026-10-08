// The closet call for the bundled demo photos: replays the real closet1 answers in
// assets/demo-closet/closet-readings.json (no network, nothing sent; see scripts/make-demo-closet.mjs), matched to
// the stubs it's asked about by category + type (else category), validated like a live answer. ~4.3 s like the
// real call, or instant at demo latency 0. An unknown photo fails (the app then writes the closet from v3 fields).
import data from '../../../assets/demo-closet/closet-readings.json';
import { demoPhoto } from '@/demo/demoPhotos';
import { realScheduler, type Scheduler } from '../scheduler';
import { validateClosetReading } from './validate';
import { CLOSET_PROMPT_VERSION, type ClosetFail, type ClosetResult, type ClosetSource, type ClosetStub } from './types';

type Entry = { stubs: ClosetStub[]; answer: { garments: Record<string, unknown>[] } };
const PHOTOS = (data as unknown as { photos: Record<string, Entry> }).photos;
/** The closet call's measured median (results/closet1). */
export const CLOSET_DEMO_SECONDS = 4.3;

function byHash(sha: string): string | null {
  for (const id of Object.keys(PHOTOS)) if (demoPhoto(id)?.sha256 === sha) return id;
  return null;
}

/** The stored answer re-indexed to `stubs` (null: not a bundled photo). */
export function demoClosetAnswer(photoId: string | null, sha: string, stubs: readonly ClosetStub[]): { garments: Record<string, unknown>[] } | null {
  const id = photoId && PHOTOS[photoId] ? photoId : byHash(sha);
  const e = id ? PHOTOS[id] : undefined;
  if (!e) return null;
  const used = new Set<number>();
  const garments: Record<string, unknown>[] = [];
  for (const s of stubs) {
    const hit = e.stubs.find((t) => !used.has(t.i) && t.category === s.category && t.subcategory === s.subcategory)
      ?? e.stubs.find((t) => !used.has(t.i) && t.category === s.category);
    if (!hit) continue;
    used.add(hit.i);
    const g = e.answer.garments.find((x) => x.i === hit.i);
    if (g) garments.push({ ...g, i: s.i });
  }
  return { garments };
}

export interface MockClosetOptions {
  /** Seconds (the demo latency arg: 0 = instant), or 'real'. */
  latency?: () => number | 'real';
  fault?: () => ClosetFail | null;
  scheduler?: Scheduler;
}

export function createMockClosetSource(o: MockClosetOptions = {}): ClosetSource & { calls: number } {
  const scheduler = o.scheduler ?? realScheduler;
  const src = {
    calls: 0,
    async read(image: Parameters<ClosetSource["read"]>[0], stubs: readonly ClosetStub[], _kind: Parameters<ClosetSource["read"]>[2], opts?: { signal?: AbortSignal }): Promise<ClosetResult> {
      void _kind;
      src.calls += 1;
      const lat = o.latency?.() ?? 0;
      const seconds = lat === 'real' ? CLOSET_DEMO_SECONDS : lat === 0 ? 0 : CLOSET_DEMO_SECONDS * (lat / 6.6);
      try {
        if (seconds > 0) await scheduler.sleep(seconds * 1000, opts?.signal);
      } catch {
        return { fail: 'timeout' as const };
      }
      const fault = o.fault?.();
      if (fault) return { fail: fault };
      const answer = demoClosetAnswer(image.photoId, image.sha256, stubs);
      if (!answer) return { fail: 'unknownPhoto' as const };
      const reading = validateClosetReading(answer, stubs.length);
      if (!reading) return { fail: 'invalid' as const };
      return { reading, model: 'demo-closet1', promptVersion: CLOSET_PROMPT_VERSION, latencyMs: Math.round(seconds * 1000) };
    },
  };
  return src;
}
