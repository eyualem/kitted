// The scan inbox (DECISIONS-LOG #100): clothes-scan photos saved on the phone until the item
// reading exists (#88; the style-council session owns that reading, the Closet tab and the C4
// "+" menu). Each scan is prepped on the phone first (any face hidden; a person whose face can't
// be found is refused, ruling 10). The list lives in the key-value store under `scan.inbox`, so
// no table or migration is needed; the reading's session takes the photos from here.
import type { ZoneOffset } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { t } from '@/i18n/en';
import { stampText } from '@/i18n/format';
import { toStoredPath } from '@/services/photoFiles';
import { prepareItems } from '../../../modules/kitted-vision';

export const INBOX_KEY = 'scan.inbox';
/** The sheet the Closet row opens (09-ui-review §1 item 11, #280). */
export const SCAN_INBOX_HREF = '/sheets/scan-inbox';

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

// ------------------------------------------------------------------ made visible (#280)
/** Closet's row while scans wait, "Waiting to be read · 2 photos"; null when none wait. */
export function waitingRow(list: readonly ScanEntry[]): { title: string; href: string } | null {
  const n = new Set(list.map((e) => e.sha256)).size;
  if (n === 0) return null;
  return { title: n === 1 ? t('scan.inbox.row1') : t('scan.inbox.row', { n }), href: SCAN_INBOX_HREF };
}

export interface InboxSheetRow {
  sha256: string;
  /** The thumbnail's stored path (relative to Documents), or null (a Simulator scan, drawn instead). */
  thumb: string | null;
  demo: boolean;
  /** When it was saved: "Thursday 8:00 am", or "Oct 14, 8:00 am" further back. */
  date: string;
}

/** What the inbox sheet shows: its title, the existing "coming soon" line, and one row per scan, newest first. */
export function inboxSheet(list: readonly ScanEntry[], nowMs: number, zone: ZoneOffset): { title: string; line: string; rows: InboxSheetRow[] } {
  const rows = [...list].sort((a, b) => b.savedAt - a.savedAt || (a.sha256 < b.sha256 ? -1 : 1)).map((e) => ({
    sha256: e.sha256, thumb: e.thumbPath ?? e.keptPath ?? null, demo: e.demo === true, date: stampText(e.savedAt, nowMs, zone),
  }));
  return { title: t('scan.inbox.title'), line: rows.length === 1 ? t('scan.saved.body') : t('scan.saved.bodyMany'), rows };
}

/**
 * Deletes one scan: its entry, then its kept photo, thumbnail and face-hidden copy (`deleteFiles` is privacy/files
 * deleteScanFiles, which only ever touches Documents/scans). Returns the inbox as it is now.
 */
export async function deleteScan(
  store: Pick<KittedStore, 'getKv' | 'setKv' | 'deleteKv'>, sha256: string, deleteFiles: (stored: string[]) => number,
): Promise<ScanEntry[]> {
  const list = parseInbox(await store.getKv(INBOX_KEY));
  const gone = list.filter((e) => e.sha256 === sha256);
  if (gone.length === 0) return list;
  const left = list.filter((e) => e.sha256 !== sha256);
  if (left.length > 0) await store.setKv(INBOX_KEY, JSON.stringify(left));
  else await store.deleteKv(INBOX_KEY);
  const paths = gone.flatMap((e) => [e.keptPath, e.thumbPath, e.sendPath]).filter((p): p is string => !!p);
  if (paths.length > 0) deleteFiles(paths);
  return left;
}
