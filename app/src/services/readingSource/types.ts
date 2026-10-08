// The vision step behind one interface (05 §3.2). Demo: MockReadingSource replays bundled
// readings with the real timing. Later: DirectGemini (dev only) and the proxy (M4).
import type { Garment, Reading } from '@kitted/core';

export type ReadKind = 'full' | 'recheck' | 'shoeSnap' | 'bottomSnap';

/** What ImagePrep hands the source: the processed copy (faces blurred, metadata stripped) and its hash. */
export interface PreparedImage {
  /** Bundled demo photo id, when it is one (the lookup's first key). */
  photoId: string | null;
  /** SHA-256 of the ORIGINAL bytes (the cache key, "same photo, same score"). */
  sha256: string;
  uploadUri: string | null;
  /** The upload JPEG as base64 (real photos; the live source sends it). */
  uploadBase64?: string;
  /** Face-hidden close-ups cut from the same photo (#104): upper and lower body, or one of the whole person. Sent
   *  with the upload in the same scoring call. Absent for demo photos and native builds from before #104. */
  zoomBase64?: string[];
  /** Kept on the phone only: his photo (unblurred, no metadata) and its thumbnail (real photos only). */
  keptUri?: string;
  thumbUri?: string;
  /** width / height of the kept copy. */
  aspect?: number;
}

export type SlotKind = 'top' | 'outerwear' | 'held' | 'bottom' | 'footwear';
export type FailCode = 'timeout' | 'ai' | 'offline' | 'paused' | 'cantFrame' | 'unreadable' | 'unknownPhoto';

export type ReadingEvent =
  | { type: 'stage'; stage: 'photoOK' | 'sending' | 'fit' | 'color'; expectedSlots?: number }
  | { type: 'slotFound'; slot: SlotKind; garment: Garment }
  | { type: 'slotMissing'; slot: 'footwear' | 'bottom' }
  | { type: 'reading'; reading: Reading; model: string; promptVersion: string }
  | { type: 'meta'; latencySeconds: number }
  | { type: 'failed'; code: FailCode; counted: false };

export interface ReadingSource {
  read(image: PreparedImage, kind: ReadKind, opts?: { signal?: AbortSignal }): AsyncIterable<ReadingEvent>;
  /** Send a hedge request (live source only; the mock records the call). */
  hedge?(): void;
}

/** Debug toggles (04 §11) for the demo: `fault=unreadable|notClothed|offline|ai|paused`. */
export type { DemoFault } from '@/demo/demoArgs';
