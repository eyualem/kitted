// Which of Kit's messages move in when they land in the Stylist thread (founder, Nov 12: "just like any other chat
// interface... not over the top, but some movement so the eye gets directed there"; he picked fade and rise).
// Pure: the screen asks `arrivals.plan(...)` while it draws, then `arrivals.delayOf(id)` per row.
//
// A row moves only if it is Kit's, he hasn't seen it, and it hasn't been drawn already this launch:
//   - "seen until" (kv `stylist.seenUntil`, this phone's, written when the thread loses focus or the app goes to the
//     background): a message made after that time is new to him. Older ones draw still, so reopening the app or
//     coming back to the tab shows the thread as he left it.
//   - the answer is decided once per message id for the life of the app, and a row moves once: the screen says which
//     rows it has drawn (`drawn`), and from then on a re-render or the screen mounting again never replays it. A
//     message the live answer already moved in (`skip`) doesn't move a second time when the stored row replaces it.
//     The screen holds a new row of Kit's back (`isNew`) while the thread is out of sight (he is on another tab, or
//     setup is still on top: it is mounted behind it), so the row mounts, and moves, when he is looking at it.
// Several rows landing together are staggered from the oldest, capped so a long backlog doesn't wait.
import type { ChatMessage } from '@/data/types';

/** The look: fade in while rising a little. Reduce Motion keeps the fade and drops the rise. */
export const ARRIVE = {
  riseMs: 250, risePt: 8, staggerMs: 100, maxSteps: 4,
  /** After the screen mounts, new rows wait this long: it mounts as the stack slides it in (setup's end), and a row that
   *  moved during the slide was never seen (found on the Simulator). */
  settleMs: 500,
} as const;

/** kv: when he last had the thread in front of him (String(epoch ms)); per device (sync/schema.ts KV_LOCAL). */
export const SEEN_UNTIL_KEY = 'stylist.seenUntil';

export function parseSeenUntil(raw: string | null | undefined): number | null {
  const n = Number(raw);
  return raw && Number.isFinite(n) ? n : null;
}

type Row = Pick<ChatMessage, 'id' | 'role' | 'createdAt'>;

export function createArrivals() {
  /** id → delay in ms (it moves), or null (it never will). */
  const decided = new Map<string, number | null>();
  const played = new Set<string>();
  return {
    /**
     * Decides every row not decided before. `seenUntil` is when he last saw the thread; `skip` are ids that must not
     * move (the live answer's finished row). Safe to call on every render: a row's answer never changes.
     */
    plan(rows: readonly Row[], seenUntil: number, skip: Iterable<string> = []): void {
      for (const id of skip) if (!decided.has(id)) decided.set(id, null);
      const fresh = rows.filter((m) => !decided.has(m.id)).sort((a, b) => a.createdAt - b.createdAt);
      let step = 0;
      for (const m of fresh) {
        if (m.role === 'stylist' && m.createdAt > seenUntil) {
          decided.set(m.id, Math.min(step, ARRIVE.maxSteps) * ARRIVE.staggerMs);
          step += 1;
        } else {
          decided.set(m.id, null);
        }
      }
    },
    /** Kit's row he hasn't seen and nothing has decided yet: it will move once the thread is in front of him. */
    isNew(m: Row, seenUntil: number): boolean {
      return !decided.has(m.id) && m.role === 'stylist' && m.createdAt > seenUntil;
    },
    /** The delay before this row moves in, or null when it stays put. */
    delayOf(id: string): number | null {
      return played.has(id) ? null : decided.get(id) ?? null;
    },
    /** The screen has put these rows on screen (call after drawing, not while): they never move again. */
    drawn(ids: Iterable<string>): void {
      for (const id of ids) played.add(id);
    },
    /** A wipe or a test: forget everything. */
    reset(): void {
      decided.clear();
      played.clear();
    },
  };
}

/** The app's one (the Stylist thread; Past chats never ask). */
export const arrivals = createArrivals();
