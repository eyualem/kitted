// Removing a photo from a piece, or a piece from the Closet, deletes its pictures from the phone once Undo is over
// (#276; 09-ui-review §3 "What each removal does"): each affected sighting's cut-out and fingerprint
// (Documents/closet/<sha>-<key>.png / .print). Never the kept photo: it belongs to the check (the Lookbook look, the
// chat card). The sightings themselves stay (wears, matching and every score are unchanged).
//
// Robust to the app closing during the Undo window: a removal is written to a small pending list first (kv), and
// the list is processed after the window (a timer while the app is open, and at every launch and foreground). Each
// entry is checked against the data at that moment: an Undo (the photo shown again, the piece back) simply means
// there's nothing to delete, so nothing can go missing that he kept. A file another live sighting still names is
// kept.
import type { KittedStore } from '@/data/store';
import { TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { printFileOf } from '@/services/measure/garments';
import { profileOfItem } from './profile';

export const PENDING_DELETES_KV = 'closet.pendingDeletes';

export type PendingDelete = { kind: 'photo'; itemId: string; obsId: string; at: number } | { kind: 'piece'; itemId: string; at: number };

/** After the removal toast is gone even with VoiceOver on (its time doubles, toast.ts), plus a margin. */
export const DELETE_AFTER_MS = 2 * TOAST_MS_REMOVAL + 4_000;

export interface CleanupDeps {
  store: KittedStore;
  now: () => number;
  /** Deletes stored closet paths (privacy/files deleteClosetFiles); returns how many were deleted. */
  deleteFiles: (stored: string[]) => number;
}

function parse(raw: string | null): PendingDelete[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((p): p is PendingDelete => {
      if (!p || typeof p !== 'object') return false;
      const o = p as Record<string, unknown>;
      if (typeof o.itemId !== 'string' || typeof o.at !== 'number') return false;
      return o.kind === 'piece' || (o.kind === 'photo' && typeof o.obsId === 'string');
    });
  } catch {
    return [];
  }
}

export function createClosetCleanup(deps: CleanupDeps) {
  const { store } = deps;
  let chain: Promise<unknown> = Promise.resolve();
  const queued = <T,>(fn: () => Promise<T>): Promise<T> => {
    const p = chain.then(fn, fn);
    chain = p.catch(() => {});
    return p;
  };
  const read = async () => parse(await store.getKv(PENDING_DELETES_KV));
  const write = async (list: readonly PendingDelete[]) =>
    list.length > 0 ? store.setKv(PENDING_DELETES_KV, JSON.stringify(list)) : store.deleteKv(PENDING_DELETES_KV);

  async function process(): Promise<number> {
    const list = await read();
    const now = deps.now();
    const due = list.filter((p) => p.at <= now);
    if (due.length === 0) return 0;
    const items = new Map((await store.closet.all()).map((c) => [c.id, c]));
    const obs = await store.closetObs.all();
    const hashOf = new Map((await store.fitChecks.all()).map((r) => [r.id, r.imageHash]));
    const doomed = new Set<string>();
    for (const p of due) {
      const it = items.get(p.itemId);
      if (!it) continue;
      if (p.kind === 'piece') {
        // Still removed (not undone, not folded into another piece by a "Yes, same one")
        if (!it.isDeleted || it.mergedInto) continue;
        for (const o of obs) if (o.itemId === it.id) doomed.add(o.id);
      } else {
        const hidden = profileOfItem(it).hiddenObsIds ?? [];
        const o = obs.find((x) => x.id === p.obsId);
        if (!o || !hidden.includes(o.id) || o.itemId !== it.id) continue;
        // the same photo re-checked went with it (it shows once on the piece page)
        const hash = o.fitCheckId ? hashOf.get(o.fitCheckId) : undefined;
        for (const x of obs) if (x.itemId === it.id && (x.id === o.id || (!!hash && x.fitCheckId && hashOf.get(x.fitCheckId) === hash))) doomed.add(x.id);
      }
    }
    const keep = new Set(obs.filter((o) => !doomed.has(o.id) && o.cropFile).map((o) => o.cropFile!));
    const paths: string[] = [];
    const cleared: string[] = [];
    for (const o of obs) {
      if (!doomed.has(o.id) || !o.cropFile) continue;
      cleared.push(o.id);
      if (keep.has(o.cropFile)) continue;
      paths.push(o.cropFile);
      const print = printFileOf(o.cropFile);
      if (print) paths.push(print);
    }
    const n = paths.length > 0 ? deps.deleteFiles(paths) : 0;
    for (const id of cleared) await store.closetObs.patch(id, { cropFile: null });
    await write((await read()).filter((p) => p.at > now));
    return n;
  }

  return {
    /** Writes a removal down; its pictures go once Undo is over (DELETE_AFTER_MS), unless it was undone. */
    schedule: (p: { kind: 'photo'; itemId: string; obsId: string } | { kind: 'piece'; itemId: string }) =>
      queued(async () => {
        const list = await read();
        await write([...list, { ...p, at: deps.now() + DELETE_AFTER_MS } as PendingDelete]);
      }),
    /** Deletes what's due and still removed; drops entries that were undone. Returns how many files went. */
    run: () => queued(process),
    /** The pending list (tests, debugging). */
    pending: () => queued(read),
  };
}

export type ClosetCleanup = ReturnType<typeof createClosetCleanup>;
