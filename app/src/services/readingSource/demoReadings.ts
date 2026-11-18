// The bundled v3 readings (handoff/fixtures/readings, copied into assets): one per demo photo,
// plus the variants the story uses (shoe snap, corrections, the real p01 reads).
import type { Reading } from '@kitted/core';
import { V16_SCREEN_READINGS } from '@/demo/v16Readings';
import index from '../../../assets/demo-readings/INDEX.json';
import p01a from '../../../assets/demo-readings/p01a.json';
import p01b from '../../../assets/demo-readings/p01b.json';
import s05 from '../../../assets/demo-readings/s05.json';
import s09 from '../../../assets/demo-readings/s09.json';
import s10 from '../../../assets/demo-readings/s10.json';
import s12 from '../../../assets/demo-readings/s12.json';
import s13 from '../../../assets/demo-readings/s13.json';
import s14 from '../../../assets/demo-readings/s14.json';
import s15 from '../../../assets/demo-readings/s15.json';
import s22 from '../../../assets/demo-readings/s22.json';
import s24 from '../../../assets/demo-readings/s24.json';
import s25 from '../../../assets/demo-readings/s25.json';
import shoeSnapRunners from '../../../assets/demo-readings/variants/s24_shoe_snap_runners.json';
// The founder's Oct 7 phone check (reading only; his photo is never bundled): black wide jeans read as sweatpants.
import ph1 from '../../../assets/demo-readings/variants/ph1_oct7_misread.json';
// The founder's Oct 8 phone check (reading only): his work boots read as slides (the shoe question, #120).
import ph8 from '../../../assets/demo-readings/variants/ph8_oct8_boots_as_slides.json';
// ...and his boots read as "other" (f07193): "Your grey work boots?" once he has confirmed them (#126).
import ph9 from '../../../assets/demo-readings/variants/ph9_oct8_boots_as_other.json';

/** The reading files carry provenance next to the reading; keep scene + garments + held_items only. */
function readingOf(file: unknown): Reading {
  const f = file as { reading?: Reading } & Reading;
  const r = (f.reading ?? f) as Reading;
  return { scene: r.scene, garments: r.garments, ...(r.held_items ? { held_items: r.held_items } : {}) };
}

/** "s14b": the Welcome photo's outfit after its top fix (#292, demo screen 180): the chunky sneakers swapped for white
 *  leather ones, so the re-check makes move 2's fix. */
function s14AfterFix(): Reading {
  const r = readingOf(s14);
  const swap = { subcategory: 'white_leather_sneaker', color_family: 'white', volume: 2, logo: 'none', condition: 'clean', distressed_by_design: false } as const;
  return { ...r, garments: r.garments.map((g) => (g.category === 'footwear' ? { ...g, ...swap } : g)) };
}

/** "p01t": p01b's outfit in a short mirror (#313, the two-shot check): read as top only, so no pants or shoes. */
function p01bTopOnly(): Reading {
  const r = readingOf(p01b);
  return {
    ...r, scene: { ...r.scene, framing: 'upper_only', shoes_visible: false },
    garments: r.garments.filter((g) => g.category !== 'bottom' && g.category !== 'footwear'),
  };
}

const BY_ID: Record<string, Reading> = {
  p01a: readingOf(p01a), p01b: readingOf(p01b), s05: readingOf(s05), s09: readingOf(s09), s10: readingOf(s10),
  s12: readingOf(s12), s13: readingOf(s13), s14: readingOf(s14), s15: readingOf(s15), s22: readingOf(s22),
  s24: readingOf(s24), s25: readingOf(s25),
  // A second shot of p01b's outfit (its own hash; demoPhotos.ts): S21's re-check that doesn't see the change (#219).
  p01b2: readingOf(p01b),
  s14b: s14AfterFix(),
  // The two-shot check's step 0 (#313): demo screen 185, a top-only check finished by a photo of the pants and shoes.
  p01t: p01bTopOnly(),
  // Demo screens 34–36 (the one quick tap): shown with s12's stand-in photo (demoPhotos.ts).
  ph1: readingOf(ph1),
  // Demo screens 60–62 (the shoe question): shown with s12's stand-in photo too.
  ph8: readingOf(ph8),
  ph9: readingOf(ph9),
  // Demo screens 300-310 (T69, the rescoring): made-up readings the engine scores live (demo/v16Readings.ts).
  ...V16_SCREEN_READINGS,
};

/**
 * The shoe snap's own reading (feet only): the runners from the variant file, in an
 * "upper_only"-style feet frame, exactly expected_scores.json → partials[1].snap_reading.
 * The variant file itself is the full s24 outfit with those runners (the merged result).
 */
export const SHOE_SNAP_READING: Reading = {
  scene: { framing: 'upper_only', shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: 'good', clothed: 'fully' },
  garments: readingOf(shoeSnapRunners).garments.filter((g) => g.category === 'footwear'),
};

/** The bottom snap's own reading (#313): p01b's pants and shoes, looked down at (no top in the frame). */
export const BOTTOM_SNAP_READING: Reading = {
  scene: { ...readingOf(p01b).scene, framing: 'full_body', shoes_visible: true, mirror_selfie: false },
  garments: readingOf(p01b).garments.filter((g) => g.category === 'bottom' || g.category === 'footwear'),
};

export function demoReadingById(id: string): Reading | null {
  return BY_ID[id] ?? null;
}

export function demoReadingBySha(sha: string): { id: string; reading: Reading } | null {
  const hit = index.photos.find((p) => p.photo_sha256 === sha);
  if (!hit) return null;
  const reading = BY_ID[hit.id];
  return reading ? { id: hit.id, reading } : null;
}

export function demoLatency(id: string): number | null {
  return index.photos.find((p) => p.id === id)?.latency_s ?? null;
}
