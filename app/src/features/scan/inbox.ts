// The scan inbox (DECISIONS-LOG #100): clothes-scan photos saved on the phone until the item
// reading exists (#88; the style-council session owns that reading, the Closet tab and the C4
// "+" menu). Each scan is prepped on the phone first (any face hidden; a person whose face can't
// be found is refused, ruling 10). The list lives in the key-value store under `scan.inbox`, so
// no table or migration is needed; the reading's session takes the photos from here.
import type { KittedStore } from '@/data/store';
import { toStoredPath } from '@/services/photoFiles';
import { prepareItems } from '../../../modules/kitted-vision';

export const INBOX_KEY = 'scan.inbox';

export interface ScanEntry {
  sha256: string;
  /** Relative to Documents ("scans/<sha>-photo.jpg"): his photo as taken, no metadata. */
  keptPath: string | null;
  thumbPath: string | null;
  /** Every face hidden: the copy the item reading will send. */
  sendPath: string | null;
  savedAt: number;
  source: 'camera' | 'library';
  /** Pieces the camera outlined when he shot it (a hint, not a reading). */
  piecesSeen: number | null;
  /** DEMO: a Simulator scan of the sample flat lay (no file). */
  demo?: true;
}

export function parseInbox(raw: string | null): ScanEntry[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as ScanEntry[]) : [];
  } catch {
    return [];
  }
}

/** Adds a scan; the same photo twice keeps one entry (the newest). */
export function addToInbox(list: readonly ScanEntry[], entry: ScanEntry): ScanEntry[] {
  return [...list.filter((e) => e.sha256 !== entry.sha256), entry];
}

export type SaveOutcome = { status: 'saved'; entry: ScanEntry } | { status: 'cantHide' } | { status: 'failed' };

/** Preps one photo for the inbox and records it. */
export async function saveScan(store: Pick<KittedStore, 'getKv' | 'setKv'>, uri: string, source: ScanEntry['source'], piecesSeen: number | null, now: number): Promise<SaveOutcome> {
  const r = await prepareItems(uri);
  if (r.status === 'couldNotFrame') return { status: 'cantHide' };
  if (r.status !== 'ok') return { status: 'failed' };
  const entry: ScanEntry = {
    sha256: r.sha256, keptPath: toStoredPath(r.keptUri), thumbPath: toStoredPath(r.thumbUri), sendPath: toStoredPath(r.sendUri),
    savedAt: now, source, piecesSeen,
  };
  await store.setKv(INBOX_KEY, JSON.stringify(addToInbox(parseInbox(await store.getKv(INBOX_KEY)), entry)));
  return { status: 'saved', entry };
}

/** DEMO: the Simulator's sample flat lay "saved" (there is no file to prep). */
export async function saveDemoScan(store: Pick<KittedStore, 'getKv' | 'setKv'>, now: number): Promise<void> {
  const entry: ScanEntry = { sha256: `demo-${now}`, keptPath: null, thumbPath: null, sendPath: null, savedAt: now, source: 'camera', piecesSeen: 3, demo: true };
  await store.setKv(INBOX_KEY, JSON.stringify(addToInbox(parseInbox(await store.getKv(INBOX_KEY)), entry)));
}
