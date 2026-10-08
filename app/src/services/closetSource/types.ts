// The closet call (DECISIONS-LOG #90-91): a second, separate Gemini call made after the score card shows. It gets
// the photo and a list of the pieces the scoring call already found (enum values only, never free text) and
// describes each one for the closet: shade words, lightness, details, logo text, sleeve / shoe / denim shape and a
// box. It never changes the score. Behind one interface: the mock replays bundled closet readings for the demo
// photos; the live source (DEV + key only) calls Gemini with the same face-hidden upload.
import type { ClosetFields } from '@/data/types';
import type { PreparedImage } from '@/services/readingSource/types';

export const CLOSET_PROMPT_VERSION = 'closet1' as const;

/** One line of the stub list: "[0] top · hoodie · grey". Enum values from the scoring reading only. */
export interface ClosetStub {
  i: number;
  category: string;
  subcategory: string;
  color_family: string;
}

export type ClosetKind = 'full' | 'recheck' | 'shoeSnap';

/** A validated closet answer: one entry per stub index it described (missing = not seen). */
export interface ClosetReading {
  garments: (ClosetFields & { i: number })[];
}

/** What the readings table keeps for a closet call (source 'closet'): the stubs it was asked with, and the answer. */
export interface StoredClosetReading extends ClosetReading {
  stubs: ClosetStub[];
  kind: ClosetKind;
}

export type ClosetFail = 'timeout' | 'offline' | 'ai' | 'invalid' | 'noConsent' | 'unknownPhoto' | 'noUpload';

export type ClosetResult =
  | { reading: ClosetReading; model: string; promptVersion: typeof CLOSET_PROMPT_VERSION; latencyMs: number; usage?: Record<string, number> }
  | { fail: ClosetFail };

export interface ClosetSource {
  read(image: PreparedImage, stubs: readonly ClosetStub[], kind: ClosetKind, opts?: { signal?: AbortSignal }): Promise<ClosetResult>;
}
