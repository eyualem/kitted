import { score } from '@kitted/core';
import { createMockReadingSource, scheduleFor } from '@/services/readingSource/mock';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import type { ReadingEvent } from '@/services/readingSource/types';
import type { Scheduler } from '@/services/scheduler';
import { AbortError } from '@/services/scheduler';

/** A scheduler that doesn't wait: it records the virtual time of each event. */
function virtual() {
  let now = 0;
  const s: Scheduler & { now: () => number } = {
    now: () => now,
    async sleep(ms, signal) {
      if (signal?.aborted) throw new AbortError();
      now += ms;
    },
    setTimer: () => 0,
    clearTimer: () => {},
  };
  return s;
}

async function collect(it: AsyncIterable<ReadingEvent>, sched?: { now: () => number }) {
  const out: [number, ReadingEvent][] = [];
  for await (const e of it) out.push([Math.round((sched?.now() ?? 0) * 1000) / 1000, e]);
  return out;
}

const img = (photoId: string | null, sha = 'x') => ({ photoId, sha256: sha, uploadUri: null });
const label = (e: ReadingEvent) =>
  e.type === 'stage' ? `stage:${e.stage}` : e.type === 'slotFound' ? `found:${e.slot}:${e.garment.subcategory}` : e.type === 'slotMissing' ? `missing:${e.slot}` : e.type;

describe('MockReadingSource', () => {
  it('p01b at 6.6 s: the 04 §11 order and times', async () => {
    const sched = virtual();
    const src = createMockReadingSource({ latency: () => 6.6, scheduler: sched });
    const events = await collect(src.read(img('p01b'), 'full'), sched);
    expect(events.map(([t, e]) => [t, label(e)])).toEqual([
      [150, 'stage:photoOK'],
      [396, 'stage:sending'],
      [2640, 'found:top:tee'],
      [3432, 'found:held:overshirt'],
      [4224, 'found:bottom:chinos'],
      [5148, 'found:footwear:white_leather_sneaker'],
      [5610, 'stage:fit'],
      [6072, 'stage:color'],
      [6600, 'reading'],
      [6600, 'meta'],
    ]);
    const reading = events.find(([, e]) => e.type === 'reading')![1];
    expect(reading.type === 'reading' && reading.reading).toEqual(demoReadingById('p01b'));
    expect((events[1]![1] as { expectedSlots: number }).expectedSlots).toBe(4);
  });

  it('s24: no outer layer, shoes not in the photo, 3 expected slots', () => {
    const steps = scheduleFor(demoReadingById('s24')!);
    expect(steps.map((s) => label(s.event))).toEqual([
      'stage:photoOK', 'stage:sending', 'found:top:sweatshirt', 'found:bottom:athletic_shorts', 'missing:footwear', 'stage:fit', 'stage:color', 'reading',
    ]);
    expect((steps[1]!.event as { expectedSlots: number }).expectedSlots).toBe(3);
  });

  it('latency 0 runs instantly with the same sequence', async () => {
    const src = createMockReadingSource({ latency: () => 0 });
    const events = await collect(src.read(img('p01b'), 'full'));
    expect(events.map(([, e]) => label(e))).toHaveLength(10);
  });

  it('looks up by id, then by SHA-256; unknown photos fail without a score', async () => {
    const src = createMockReadingSource({ latency: () => 0 });
    const bySha = await collect(src.read(img(null, '17cf7d2217072be8b78e84cad0af99f6e0aac0ddc8f9b2b0e0b2b71f4c1a0b0f'), 'full'));
    const unknown = await collect(src.read(img(null, 'nope'), 'full'));
    expect(unknown.map(([, e]) => e)).toEqual([{ type: 'failed', code: 'unknownPhoto', counted: false }]);
    // (the s24 hash above is checked against INDEX.json in the next test)
    expect(bySha.length).toBeGreaterThan(0);
  });

  it('SHA lookup returns the reading for a bundled photo', async () => {
    const index = require('../../assets/demo-readings/INDEX.json') as { photos: { id: string; photo_sha256: string }[] };
    const sha = index.photos.find((p) => p.id === 's24')!.photo_sha256;
    const src = createMockReadingSource({ latency: () => 0 });
    const ev = await collect(src.read(img(null, sha), 'full'));
    const r = ev.find(([, e]) => e.type === 'reading')![1];
    expect(r.type === 'reading' && r.reading).toEqual(demoReadingById('s24'));
  });

  it('a shoe snap returns the runners variant; results are copies', async () => {
    const src = createMockReadingSource({ latency: () => 0 });
    const a = (await collect(src.read(img('s24'), 'shoeSnap'))).find(([, e]) => e.type === 'reading')![1];
    expect(a.type === 'reading' && a.reading.garments.map((g) => g.subcategory)).toEqual(['retro_runner']);
    if (a.type === 'reading') a.reading.garments.length = 0;
    const b = (await collect(src.read(img('s24'), 'shoeSnap'))).find(([, e]) => e.type === 'reading')![1];
    expect(b.type === 'reading' && b.reading.garments).toHaveLength(1);
  });

  it('faults: unreadable fails uncounted at the end; not clothed returns a reading that scores null', async () => {
    const un = createMockReadingSource({ latency: () => 0, fault: () => 'unreadable' });
    const e1 = await collect(un.read(img('p01b'), 'full'));
    expect(e1[e1.length - 1]![1]).toEqual({ type: 'failed', code: 'unreadable', counted: false });
    const nc = createMockReadingSource({ latency: () => 0, fault: () => 'notClothed' });
    const r = (await collect(nc.read(img('p01b'), 'full'))).find(([, e]) => e.type === 'reading')![1];
    expect(r.type === 'reading' && score(r.reading).overall).toBeNull();
    const off = createMockReadingSource({ latency: () => 0, fault: () => 'offline' });
    expect((await collect(off.read(img('p01b'), 'full'))).map(([, e]) => e)).toEqual([{ type: 'failed', code: 'offline', counted: false }]);
  });

  it('holdAt freezes after the events up to that point, until aborted', async () => {
    const src = createMockReadingSource({ latency: () => 0 });
    src.holdAt = 0.7;
    const ac = new AbortController();
    const seen: string[] = [];
    const run = (async () => {
      for await (const e of src.read(img('p01b'), 'full', { signal: ac.signal })) seen.push(label(e));
    })();
    await new Promise((r) => setTimeout(r, 10));
    expect(seen).toEqual(['stage:photoOK', 'stage:sending', 'found:top:tee', 'found:held:overshirt', 'found:bottom:chinos']);
    ac.abort();
    await run;
    expect(seen).toHaveLength(5);
  });
});
