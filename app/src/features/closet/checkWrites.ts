// One queue for every write that touches a check's closet part (fit_checks.details.closetSummary + itemIds) and
// the closet tables. The closet call lands seconds after the score card, while he may be tapping Undo or fixing a
// detail; without the queue a fit-check patch built from an older copy of the row would put back a stale summary.
//
// Undo goes first (09-ui-review §9, #296): an `urgent` job runs as soon as the job running now is done, ahead of the
// jobs still waiting (a late closet answer, the launch catch-up, the color refresh), so Undo shows at once. It never
// interleaves with another write, and every job reads the rows when it starts, so a job that waited behind an Undo
// sees the restored rows. Each job's change notices go out together when it ends (data/changes holdChanges), so the
// screens re-read once per job instead of once per row.
import type { KittedStore } from '@/data/store';
import type { FitCheckRow } from '@/data/types';
import { holdChanges } from '@/data/changes';

export interface SerialOptions {
  /** Shown in the [closet] log lines. */
  label?: string;
  /** An Undo: runs ahead of every waiting job that isn't urgent (urgent jobs keep their order among themselves). */
  urgent?: boolean;
}

interface Job {
  label: string;
  urgent: boolean;
  queuedAt: number;
  run: () => Promise<void>;
}

/** A queued job that runs this long gets a "[closet] slow …" line. */
export const SLOW_JOB_MS = 250;

const UNDER_TEST = typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined;
const now = () => Date.now();
const lines: string[] = [];
function log(line: string) {
  lines.push(line);
  if (lines.length > 50) lines.shift();
  if (!UNDER_TEST) console.log(`[closet] ${line}`);
}

const waiting: Job[] = [];
let running: Job | null = null;
let pumpScheduled = false;

function pump() {
  pumpScheduled = false;
  if (running) return;
  const next = waiting.shift();
  if (!next) return;
  running = next;
  void next.run().finally(() => {
    running = null;
    pump();
  });
}

/**
 * Runs `fn` after the job running now and every earlier queued job (an `urgent` one: after the running job and earlier
 * urgent ones only). Never call serial() from inside a queued fn: it would wait forever.
 */
export function serial<T>(fn: () => Promise<T>, o: SerialOptions = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const job: Job = {
      label: o.label ?? 'write',
      urgent: o.urgent === true,
      queuedAt: now(),
      run: async () => {
        const started = now();
        if (job.urgent) log(`${job.label} started +${started - job.queuedAt} ms`);
        const release = holdChanges();
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          release();
          const ran = now() - started;
          if (job.urgent) log(`${job.label} done +${now() - job.queuedAt} ms (ran ${ran} ms)`);
          else if (ran >= SLOW_JOB_MS) log(`slow ${job.label} ${ran} ms`);
        }
      },
    };
    if (job.urgent) {
      const at = waiting.findIndex((j) => !j.urgent);
      const jumped = at < 0 ? 0 : waiting.length - at;
      waiting.splice(at < 0 ? waiting.length : at, 0, job);
      log(`${job.label} queued · behind ${running ? running.label : 'nothing'}${jumped > 0 ? ` · ahead of ${jumped} waiting` : ''}`);
    } else {
      waiting.push(job);
    }
    // Like the promise chain it replaced, a job never starts inside the serial() call itself.
    if (!running && !pumpScheduled) {
      pumpScheduled = true;
      void Promise.resolve().then(pump);
    }
  });
}

/** The latest [closet] queue lines (tests, debugging). */
export function queueLog(): readonly string[] {
  return lines;
}

/**
 * A fit-check patch that never overwrites the closet's part of the row: closetSummary and itemIds always come
 * from the stored row (the closet service owns them). Everything else in the patch lands as given.
 */
export function patchCheckKeepCloset(store: KittedStore, id: string, patch: Partial<FitCheckRow>): Promise<FitCheckRow | null> {
  return serial(async () => {
    const cur = await store.fitChecks.get(id);
    if (!cur) return null;
    const { itemIds: _ignored, ...rest } = patch;
    void _ignored;
    const next: Partial<FitCheckRow> = { ...rest };
    if (rest.details) {
      const details = { ...rest.details };
      if (cur.details.closetSummary !== undefined) details.closetSummary = cur.details.closetSummary;
      else delete details.closetSummary;
      next.details = details;
    }
    return store.fitChecks.patch(id, next);
  }, { label: 'patchCheck' });
}
