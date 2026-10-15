// The scan inbox made visible (09-ui-review §6.2, #280; checks S1–S4 set before building). Closet shows one row while
// scans wait ("Waiting to be read · N photos"), the row opens a sheet listing each scan's thumbnail and date with the
// existing "Reading clothes from photos is coming soon." line, deleting a scan removes its entry and its three files
// (kept, thumbnail, face-hidden copy) and nothing outside scans/, and "Delete all photos" still empties the inbox.
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { addToInbox, deleteScan, inboxSheet, INBOX_KEY, parseInbox, SCAN_INBOX_HREF, waitingRow, type ScanEntry } from '@/features/scan/inbox';
import { deleteScanFiles, scanRelPath } from '@/features/privacy/files';
import { deleteAllPhotos } from '@/features/privacy/wipe';
import type { PrivacyFiles } from '@/features/privacy/files';
import { stampText } from '@/i18n/format';

// Node's fs and path, to check the sheet route is there (jest runs on Node; the app has no Node types).
declare const __dirname: string;
const { existsSync, readFileSync } = jest.requireActual<{ existsSync(p: string): boolean; readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

// A small disk: the files that exist, by file:// URL. Only read when a File is used (after the module loads).
const mockDisk = new Set<string>();
jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(base: { uri: string } | string, rel?: string) {
      const b = typeof base === 'string' ? base : base.uri;
      this.uri = rel ? `${b.replace(/\/?$/, '/')}${rel}` : b;
    }
    get exists() {
      return mockDisk.has(this.uri);
    }
    delete() {
      if (!mockDisk.has(this.uri)) throw new Error('no such file');
      mockDisk.delete(this.uri);
    }
  }
  class Directory {}
  return { File, Directory, Paths: { document: { uri: 'file:///App/Documents/' }, cache: { uri: 'file:///App/Library/Caches/' } } };
});

const DOCS = 'file:///App/Documents/';
const NOW = Date.parse('2026-10-22T12:20:00-04:00');
const entry = (sha: string, at: number, o: Partial<ScanEntry> = {}): ScanEntry => ({
  sha256: sha, keptPath: `scans/${sha}-photo.jpg`, thumbPath: `scans/${sha}-thumb.jpg`, sendPath: `scans/${sha}-send.jpg`,
  savedAt: at, source: 'camera', piecesSeen: 2, ...o,
});
const filesOf = (e: ScanEntry) => [e.keptPath, e.thumbPath, e.sendPath].map((p) => `${DOCS}${p}`);

async function storeWith(list: ScanEntry[]) {
  const store = createMemoryStore();
  await store.init();
  if (list.length > 0) await store.setKv(INBOX_KEY, JSON.stringify(list));
  return store;
}

beforeEach(() => mockDisk.clear());

test('S1: with 1 or more scans waiting, Closet shows one row "Waiting to be read · N photos" ("1 photo" for one); with none, no row', () => {
  expect(waitingRow([])).toBeNull();
  expect(waitingRow(parseInbox(null))).toBeNull();
  const one = waitingRow([entry('a', NOW - 1000)]);
  expect(one).not.toBeNull();
  expect(one!.title).toBe('Waiting to be read · 1 photo');
  const two = waitingRow(addToInbox([entry('a', NOW - 2000)], entry('b', NOW - 1000)));
  expect(two!.title).toBe('Waiting to be read · 2 photos');
  // The same photo scanned twice is one photo waiting.
  expect(waitingRow(addToInbox([entry('a', NOW - 2000)], entry('a', NOW - 1000)))!.title).toBe('Waiting to be read · 1 photo');
  // One row, and it opens the inbox sheet.
  expect(two!.href).toBe(SCAN_INBOX_HREF);
});

test('S2: tapping the row opens a sheet with each scan\'s thumbnail and date and the line "Reading clothes from photos is coming soon."', () => {
  // The row's link is a sheet route that exists and is registered as a sheet in the root stack.
  expect(SCAN_INBOX_HREF).toBe('/sheets/scan-inbox');
  const appDir = join(__dirname, '..', 'app');
  expect(existsSync(join(appDir, 'sheets', 'scan-inbox.tsx'))).toBe(true);
  expect(readFileSync(join(appDir, '_layout.tsx'), 'utf8')).toMatch(/name="sheets\/scan-inbox"\s+options=\{sheet\(/);

  const a = entry('a', NOW - 26 * 3_600_000);
  const b = entry('b', NOW - 600_000);
  const demo = entry('demo-1', NOW - 300_000, { keptPath: null, thumbPath: null, sendPath: null, demo: true });
  const sheet = inboxSheet([a, b, demo], NOW, US_EASTERN);
  expect(sheet.line).toContain('Reading clothes from photos is coming soon.');
  expect(sheet.title).toBe('Waiting to be read');
  // Newest first, one row per scan: its thumbnail and its date.
  expect(sheet.rows.map((r) => r.sha256)).toEqual(['demo-1', 'b', 'a']);
  expect(sheet.rows.find((r) => r.sha256 === 'a')).toMatchObject({ thumb: 'scans/a-thumb.jpg', date: stampText(a.savedAt, NOW, US_EASTERN), demo: false });
  expect(sheet.rows.find((r) => r.sha256 === 'b')).toMatchObject({ thumb: 'scans/b-thumb.jpg', date: stampText(b.savedAt, NOW, US_EASTERN) });
  // A Simulator scan has no file: its row draws the sample flat lay instead.
  expect(sheet.rows.find((r) => r.sha256 === 'demo-1')).toMatchObject({ thumb: null, demo: true });
  for (const r of sheet.rows) expect(r.date.length).toBeGreaterThan(0);
  // One scan: the singular line.
  expect(inboxSheet([a], NOW, US_EASTERN).line).toContain('Reading clothes from photos is coming soon.');
});

test('S3: deleting a scan removes its entry, and its kept, thumbnail and face-hidden files are gone from disk; the count updates', async () => {
  const a = entry('a', NOW - 2000);
  const b = entry('b', NOW - 1000);
  for (const f of [...filesOf(a), ...filesOf(b)]) mockDisk.add(f);
  // His kept fit-check photo and a closet cut-out sit next door; a scan never reaches them.
  const decoys = [`${DOCS}photos/x-photo.jpg`, `${DOCS}closet/x-garment-0.png`];
  for (const f of decoys) mockDisk.add(f);
  const store = await storeWith([a, b]);

  const left = await deleteScan(store, 'a', deleteScanFiles);

  for (const f of filesOf(a)) expect(mockDisk.has(f)).toBe(false);
  for (const f of filesOf(b)) expect(mockDisk.has(f)).toBe(true);
  for (const f of decoys) expect(mockDisk.has(f)).toBe(true);
  expect(left.map((e) => e.sha256)).toEqual(['b']);
  expect(parseInbox(await store.getKv(INBOX_KEY)).map((e) => e.sha256)).toEqual(['b']);
  expect(waitingRow(parseInbox(await store.getKv(INBOX_KEY)))!.title).toBe('Waiting to be read · 1 photo');

  // The last one: no entry, no files, no row.
  await deleteScan(store, 'b', deleteScanFiles);
  for (const f of filesOf(b)) expect(mockDisk.has(f)).toBe(false);
  expect(parseInbox(await store.getKv(INBOX_KEY))).toEqual([]);
  expect(waitingRow(parseInbox(await store.getKv(INBOX_KEY)))).toBeNull();
  for (const f of decoys) expect(mockDisk.has(f)).toBe(true);

  // A Simulator scan (no files) just leaves the list; an unknown scan changes nothing.
  const store2 = await storeWith([entry('demo-9', NOW, { keptPath: null, thumbPath: null, sendPath: null, demo: true })]);
  expect(await deleteScan(store2, 'nope', deleteScanFiles)).toHaveLength(1);
  expect(await deleteScan(store2, 'demo-9', deleteScanFiles)).toEqual([]);
});

test('S3: the scan file helper only ever deletes inside scans/', () => {
  mockDisk.add(`${DOCS}photos/x-photo.jpg`);
  mockDisk.add(`${DOCS}scans/a-photo.jpg`);
  expect(scanRelPath('scans/a-photo.jpg')).toBe('scans/a-photo.jpg');
  expect(scanRelPath(`${DOCS}scans/a-thumb.jpg`)).toBe('scans/a-thumb.jpg');
  expect(scanRelPath('scans/../photos/x-photo.jpg')).toBeNull();
  expect(scanRelPath('photos/x-photo.jpg')).toBeNull();
  expect(scanRelPath('closet/a.png')).toBeNull();
  expect(scanRelPath('https://example.com/scans/a-photo.jpg')).toBeNull();
  expect(scanRelPath(null)).toBeNull();
  expect(deleteScanFiles(['scans/../photos/x-photo.jpg', 'photos/x-photo.jpg', 'scans/a-photo.jpg', 'scans/missing.jpg'])).toBe(1);
  expect(mockDisk.has(`${DOCS}photos/x-photo.jpg`)).toBe(true);
  expect(mockDisk.has(`${DOCS}scans/a-photo.jpg`)).toBe(false);
});

test('S4: "Delete all photos" still empties the inbox, so the Closet row goes', async () => {
  const store = await storeWith([entry('a', NOW - 2000), entry('b', NOW - 1000)]);
  expect(waitingRow(parseInbox(await store.getKv(INBOX_KEY)))).not.toBeNull();
  const calls: string[] = [];
  const files: PrivacyFiles = { usage: () => ({ photos: 0, bytes: 0 }), lastSent: () => null, deletePhotos: () => void calls.push('photos'), deleteLogs: () => void calls.push('logs') };
  await deleteAllPhotos({ store, files });
  expect(calls).toEqual(['photos']);
  expect(await store.getKv(INBOX_KEY)).toBeNull();
  expect(waitingRow(parseInbox(await store.getKv(INBOX_KEY)))).toBeNull();
});
