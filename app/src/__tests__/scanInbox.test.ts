// The scan inbox (#100): scans wait here, on the phone, until the item reading exists.
import { addToInbox, INBOX_KEY, parseInbox, saveDemoScan, type ScanEntry } from '@/features/scan/inbox';
import { createMemoryStore } from '@/data/memoryStore';

const entry = (sha: string, at: number): ScanEntry => ({ sha256: sha, keptPath: `scans/${sha}-photo.jpg`, thumbPath: null, sendPath: null, savedAt: at, source: 'camera', piecesSeen: 2 });

describe('scan inbox', () => {
  it('reads nothing, junk or a list', () => {
    expect(parseInbox(null)).toEqual([]);
    expect(parseInbox('{oops')).toEqual([]);
    expect(parseInbox(JSON.stringify([entry('a', 1)]))).toEqual([entry('a', 1)]);
  });

  it('the same photo twice keeps one entry, the newest', () => {
    const list = addToInbox(addToInbox([entry('a', 1), entry('b', 2)], entry('a', 3)), entry('c', 4));
    expect(list.map((e) => [e.sha256, e.savedAt])).toEqual([['b', 2], ['a', 3], ['c', 4]]);
  });

  it('a Simulator scan is saved as a demo entry with no file', async () => {
    const store = createMemoryStore();
    await store.init();
    await saveDemoScan(store, 1000);
    const list = parseInbox(await store.getKv(INBOX_KEY));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ demo: true, keptPath: null, piecesSeen: 3 });
  });
});
