// Runs a fit check end to end on the interfaces (ReadingSource, ImagePrep, QuotaService, Clock,
// Scheduler): posts the photo and the card, streams the reading into the session reducer, scores
// with @kitted/core and writes the row. Readings are never edited: corrections, merges and snaps
// insert new ones. Failures never use quota. Same photo (same SHA) = same reading, no quota.

import {
  applyCorrection, applyFix, closetPlan, dayKey, fixTargets, garmentName, matchClosetItem, mergeShoeSnap, pickShoesFromCloset, recheckMerge,
  recheckOutcome, removeGarment, SLOT_TO_CLOSET, weekdayOf, type ClosetItem, type Garment, type Reading, type Styles,
} from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';
import type { ChatMessage, CheckDetails, ClosetItemRow, FitCheckRow, OccasionKey, ReadingRow, ReadingSourceKind } from '@/data/types';
import { t } from '@/i18n/en';
import type { Clock } from '@/services/clock';
import type { ImagePrep } from '@/services/imagePrep/demo';
import type { QuotaService } from '@/services/quota';
import type { FailCode, PreparedImage, ReadingSource, ReadKind } from '@/services/readingSource/types';
import type { Scheduler } from '@/services/scheduler';
import { garmentHex, garmentLabel } from './labels';
import { IDLE, reduce, type CheckMode, type SessionEvent, type SessionState } from './machine';
import { evaluateCheck } from './scoring';

export interface TimerConfig {
  /** Off for screen 6's frozen state (headless Chrome's virtual time would fire them). */
  enabled: boolean;
  hedgeMs: number;
  slowMs: number;
  abortMs: number;
  /** "Same photo, same reading" pause (≤ 0.3 s; 0 for screenshots). */
  cacheHitMs: number;
}

export const DEFAULT_TIMERS: TimerConfig = { enabled: true, hedgeMs: 5_000, slowMs: 9_000, abortMs: 14_000, cacheHitMs: 300 };

export interface ServiceDeps {
  store: KittedStore;
  source: ReadingSource;
  prep: ImagePrep;
  quota: QuotaService;
  clock: Clock;
  scheduler: Scheduler;
  ids: (prefix: string) => string;
  timers: () => TimerConfig;
}

export interface CheckRequest {
  mode: CheckMode;
  photoId: string;
  /** Re-check and shoe snap: the check they belong to. */
  parentCheckId?: string;
  occasion?: OccasionKey;
  /** A fixed id (demo story: "story-first", "story-recheck"); otherwise one is made. */
  checkId?: string;
}

export type StartOutcome =
  | { outcome: 'scored' | 'failed' | 'notScored'; checkId: string }
  | { outcome: 'limit' | 'unknownPhoto' | 'notImplemented' | 'noParent' };

export interface CorrectionDraft {
  garmentIndex: number;
  field: keyof Garment & string;
  value: Garment[keyof Garment];
}

type Profile = { styles: Styles; boldness: string | null };

const emptyRow = (over: Partial<FitCheckRow> & Pick<FitCheckRow, 'id' | 'createdAt' | 'dayKey' | 'occasion'>): FitCheckRow => ({
  photoFile: null, thumbFile: null, demoPhotoId: null, imageHash: '', status: 'scoring', isPartial: false, notRated: [], score: null,
  rawScore: null, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [], fixes: [], explanation: null,
  rubricVersion: '3.1.0', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
  parentId: null, itemIds: [], details: {}, ...over,
});

export function createFitCheckService(deps: ServiceDeps) {
  const { store, clock } = deps;
  let state: SessionState = IDLE;
  let attempt = 0;
  let undoQueue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const dispatch = (ev: SessionEvent) => {
    const next = reduce(state, ev);
    if (next !== state) {
      state = next;
      listeners.forEach((l) => l());
    }
  };
  let current: { abort: AbortController; done: Promise<unknown> } | null = null;

  const profile = async (): Promise<Profile> => {
    const p = await store.profile.get('me');
    return { styles: p?.styles ?? [], boldness: p?.boldness ?? null };
  };

  /** The closet a check's fixes may use: not undone, and not the pieces this same photo added. */
  const closetFor = async (row?: FitCheckRow | null): Promise<ClosetItem[]> => {
    const exclude = new Set(row?.details.closetSummary?.added ?? []);
    return (await store.closet.all()).filter((c) => !c.isDeleted && !exclude.has(c.id));
  };

  const message = async (m: Omit<ChatMessage, 'id' | 'chips' | 'payload' | 'text' | 'cardType' | 'outfitId' | 'itemId' | 'fitCheckId'> & Partial<ChatMessage>) =>
    store.chat.put({
      id: deps.ids('M'), text: null, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {}, ...m,
    } as ChatMessage);

  const insertReading = async (reading: Reading, source: ReadingSourceKind, imageHash: string, derivedFrom: string | null, latencyMs = 0) => {
    const row: ReadingRow = {
      id: deps.ids('R'), imageHash, source, reading, model: 'demo-bundled', promptVersion: 'v3', schemaVersion: 'v3',
      latencyMs, createdAt: clock.nowMs(), derivedFrom,
    };
    await store.readings.put(row);
    return row;
  };

  const readingOf = async (row: FitCheckRow): Promise<Reading | null> => (row.readingId ? (await store.readings.get(row.readingId))?.reading ?? null : null);

  /** Re-scores a row from a (possibly new) reading, keeping its closet summary and finish row. */
  const rescore = async (row: FitCheckRow, reading: Reading, patch: Partial<FitCheckRow> = {}) => {
    const p = await profile();
    const occasion = patch.occasion ?? row.occasion;
    const details = { ...row.details, ...(patch.details ?? {}) };
    const ev = evaluateCheck({
      reading, occasion, styles: p.styles, boldness: p.boldness, closet: await closetFor(row), firstCheck: row.isFirstCheck,
      hiddenFixTargets: details.hiddenFixTargets ?? [],
    });
    const next = await store.fitChecks.patch(row.id, {
      ...ev.row, ...patch, details: { ...details, ...ev.row.details, hiddenFixTargets: details.hiddenFixTargets ?? [] },
    });
    return { ev, row: next! };
  };

  /** "Same shoes as Monday?": the shoes from the last logged day before this check. */
  const rememberedShoes = async (row: FitCheckRow): Promise<CheckDetails['finish']> => {
    const closet = await store.closet.all();
    const log = (await store.wearLog.all()).filter((w) => w.day < row.dayKey).sort((a, b) => (a.day < b.day ? 1 : -1));
    for (const w of log) {
      const ids = w.outfitId ? (await store.outfits.get(w.outfitId))?.itemIds ?? [] : w.fitCheckId ? (await store.fitChecks.get(w.fitCheckId))?.itemIds ?? [] : [];
      const shoe = closet.find((c) => ids.includes(c.id) && c.slot === 'shoes' && !c.isDeleted);
      if (shoe) return { suggestedItemId: shoe.id, weekday: weekdayOf(w.day) };
    }
    return { suggestedItemId: null, weekday: null };
  };

  async function finalizeCheck(row: FitCheckRow, reading: Reading, readingRow: ReadingRow, cached: boolean) {
    const closet = await closetFor();
    const plan = closetPlan(reading, closet);
    const added: string[] = [];
    for (const a of plan.toAdd) {
      const slot = typeof a.garment.category === 'string' ? SLOT_TO_CLOSET[a.garment.category] : undefined;
      if (!slot) continue;
      const item: ClosetItemRow = {
        id: deps.ids('C'), name: garmentLabel(a.garment), slot, garment: a.garment, confirmedFields: [], hex: garmentHex(a.garment),
        photoFile: null, demoPhotoId: row.demoPhotoId, isPhotographed: true, source: 'fitCheck', starterId: null, wornCount: 1,
        lastWornAt: row.createdAt, addedAt: clock.nowMs(), isDeleted: false,
      };
      await store.closet.put(item);
      added.push(item.id);
    }
    const matched = plan.matched.map((m) => m.itemId);
    const base = await store.fitChecks.patch(row.id, {
      readingId: readingRow.id, itemIds: [...matched, ...added],
      details: { ...row.details, closetSummary: { matched, added, undone: [] } },
    });
    const { ev, row: scored } = await rescore(base!, reading);
    if (ev.status !== 'scored') return scored;
    const finish = ev.partial === 'shoes' ? await rememberedShoes(scored) : null;
    await store.fitChecks.patch(row.id, { snapState: ev.partial ? 'pending' : 'none', details: { ...scored.details, finish } });
    if (!cached) await deps.quota.consumeCheck();
    await store.setKv(KV.lastOccasion, row.occasion);
    const p = await store.profile.get('me');
    if (p) await store.profile.patch('me', { lastOccasion: row.occasion });
    return scored;
  }

  async function finalizeRecheck(row: FitCheckRow, parent: FitCheckRow, next: Reading, image: PreparedImage) {
    const parentReading = await readingOf(parent);
    if (!parentReading) throw new Error(`re-check parent ${parent.id} has no reading`);
    const p = await profile();
    const opts = { occasion: parent.occasion, styles: p.styles, boldness: p.boldness ?? 'a_little' };
    const raw = await insertReading(next, 'recheckRaw', image.sha256, null);
    const { merged, notes } = recheckMerge(parentReading, next, fixTargets(parent.fixes), opts);
    const mergedRow = await insertReading(merged, 'recheckMerged', image.sha256, parent.readingId);
    const outcome = recheckOutcome(parentReading, parent.fixes, merged, opts);
    await store.fitChecks.patch(row.id, { readingId: mergedRow.id, itemIds: parent.itemIds, details: { ...row.details, closetSummary: parent.details.closetSummary } });
    const fresh = (await store.fitChecks.get(row.id))!;
    const { row: scored } = await rescore(fresh, merged, {
      details: {
        recheck: outcome
          ? {
              parentScore: outcome.before, delta: outcome.delta, rawDelta: outcome.rawDelta, notes,
              doneFixes: outcome.doneFixes.map((f) => ({ copy: f.copy, earned: f.earned })), newProblems: outcome.newProblems, notSeen: outcome.notSeen,
            }
          : undefined,
      },
    });
    void raw;
    await store.fitChecks.patch(parent.id, { recheckUsed: true });
    await deps.quota.consumeRecheck();
    return scored;
  }

  async function finalizeSnap(parent: FitCheckRow, snap: Reading, image: PreparedImage) {
    const parentReading = await readingOf(parent);
    if (!parentReading) return parent;
    await insertReading(snap, 'lower', image.sha256, null);
    const merged = mergeShoeSnap(parentReading, snap);
    const mergedRow = await insertReading(merged, 'snapMerged', parent.imageHash, parent.readingId);
    const { row } = await rescore(parent, merged, { readingId: mergedRow.id, snapState: 'snapped', details: { ...parent.details, finish: null } });
    return row;
  }

  /** Streams one read into the session, with the ruling 19 timers. */
  async function runRead(checkId: string, image: PreparedImage, kind: ReadKind, mode: CheckMode, occasion: OccasionKey) {
    attempt += 1;
    const my = attempt;
    dispatch({ t: 'start', checkId, mode, occasion, attempt: my });
    const abort = new AbortController();
    const cfg = deps.timers();
    const handles: unknown[] = [];
    let timedOut = false;
    let gotSlot = false;
    if (cfg.enabled) {
      handles.push(
        deps.scheduler.setTimer(() => {
          if (!gotSlot) {
            dispatch({ t: 'tick', attempt: my, which: 'hedge' });
            deps.source.hedge?.();
          }
        }, cfg.hedgeMs),
        deps.scheduler.setTimer(() => dispatch({ t: 'tick', attempt: my, which: 'slow' }), cfg.slowMs),
        deps.scheduler.setTimer(() => {
          timedOut = true;
          abort.abort();
        }, cfg.abortMs),
      );
    }
    let reading: Reading | null = null;
    let fail: FailCode | null = null;
    const work = (async () => {
      for await (const e of deps.source.read(image, kind, { signal: abort.signal })) {
        if (timedOut) break;
        if (e.type === 'slotFound') gotSlot = true;
        if (e.type === 'reading') reading = e.reading;
        if (e.type === 'failed') fail = e.code;
        dispatch({ t: 'read', attempt: my, e });
      }
    })();
    current = { abort, done: work };
    try {
      await work;
    } finally {
      handles.forEach((h) => deps.scheduler.clearTimer(h));
      if (current?.abort === abort) current = null;
    }
    if (timedOut) return { reading: null, fail: 'timeout' as FailCode, attempt: my };
    if (abort.signal.aborted) return { reading: null, fail: null, attempt: my, cancelled: true };
    return { reading: reading as Reading | null, fail: fail as FailCode | null, attempt: my };
  }

  async function failRow(checkId: string, code: FailCode) {
    const row = await store.fitChecks.get(checkId);
    if (row) await store.fitChecks.patch(checkId, { status: 'failed', details: { ...row.details, failCode: code } });
    dispatch({ t: 'end' });
  }

  async function start(req: CheckRequest): Promise<StartOutcome> {
    const now = clock.nowMs();
    const parent = req.parentCheckId ? await store.fitChecks.get(req.parentCheckId) : null;
    if ((req.mode === 'recheck' || req.mode === 'shoeSnap') && !parent) return { outcome: 'noParent' };
    if (req.mode === 'check' && !(await deps.quota.canStartCheck())) return { outcome: 'limit' };
    const prep = await deps.prep.prepare({ kind: 'demo', photoId: req.photoId });
    if (prep.status !== 'ok') return { outcome: prep.status === 'unknownPhoto' ? 'unknownPhoto' : 'notImplemented' };
    const image = prep.image;
    const lastOccasion = ((await store.getKv(KV.lastOccasion)) as OccasionKey | null) ?? 'everyday';
    const occasion: OccasionKey = req.mode !== 'check' && parent ? parent.occasion : req.occasion ?? lastOccasion;

    if (req.mode === 'shoeSnap' && parent) {
      await message({ createdAt: now, role: 'user', kind: 'photo', fitCheckId: parent.id, payload: { photoId: req.photoId, snap: true } });
      const r = await runRead(parent.id, image, 'shoeSnap', 'shoeSnap', occasion);
      dispatch({ t: 'end' });
      if (!r.reading) return { outcome: 'failed', checkId: parent.id };
      await finalizeSnap(parent, r.reading, image);
      return { outcome: 'scored', checkId: parent.id };
    }

    const priorChecks = (await store.fitChecks.all()).filter((c) => !c.parentId && c.status === 'scored');
    const checkId = req.checkId ?? deps.ids('FC');
    const row = emptyRow({
      id: checkId, createdAt: now, dayKey: dayKey(now, clock.offset), occasion, demoPhotoId: image.photoId, imageHash: image.sha256,
      parentId: parent?.id ?? null, isFirstCheck: req.mode === 'check' && priorChecks.length === 0,
    });
    await store.fitChecks.put(row);
    await message({ createdAt: now, role: 'user', kind: 'photo', fitCheckId: checkId, payload: { photoId: req.photoId } });
    await message({ createdAt: now + 1, role: 'stylist', kind: 'card', cardType: req.mode === 'recheck' ? 'recheck' : 'fitCheck', fitCheckId: checkId });

    if (req.mode === 'check') {
      const cached = (await store.readings.all())
        .filter((r) => r.imageHash === image.sha256 && r.source === 'full')
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      if (cached) {
        const ms = deps.timers().cacheHitMs;
        if (ms > 0) await deps.scheduler.sleep(ms);
        const done = await finalizeCheck(row, cached.reading, cached, true);
        return { outcome: done.status === 'scored' ? 'scored' : 'notScored', checkId };
      }
    }

    const r = await runRead(checkId, image, req.mode === 'recheck' ? 'recheck' : 'full', req.mode, occasion);
    if ('cancelled' in r && r.cancelled) return { outcome: 'failed', checkId };
    if (!r.reading) {
      await failRow(checkId, r.fail ?? 'ai');
      return { outcome: 'failed', checkId };
    }
    // The occasion he tapped while it read (ignored for re-checks).
    const chosen = state.kind === 'reading' && state.checkId === checkId ? state.occasion : occasion;
    if (chosen !== occasion) await store.fitChecks.patch(checkId, { occasion: chosen });
    dispatch({ t: 'scored', attempt: r.attempt });
    const fresh = (await store.fitChecks.get(checkId))!;
    let done: FitCheckRow;
    if (req.mode === 'recheck' && parent) {
      done = await finalizeRecheck(fresh, parent, r.reading, image);
    } else {
      const readingRow = await insertReading(r.reading, 'full', image.sha256, null);
      done = await finalizeCheck(fresh, r.reading, readingRow, false);
    }
    dispatch({ t: 'end' });
    return { outcome: done.status === 'scored' ? 'scored' : 'notScored', checkId };
  }

  return {
    getState: () => state,
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    start,
    /** Occasion tap while reading (stored; no new reading). */
    selectOccasion(occasion: OccasionKey) {
      dispatch({ t: 'occasion', occasion });
    },
    /** Stop the current read (screen changes, demo resets). */
    async cancel() {
      const c = current;
      if (c) {
        c.abort.abort();
        await c.done.catch(() => {});
      }
      dispatch({ t: 'end' });
    },
    /** S19 "Try again": re-reads the same photo; nothing was counted the first time. */
    async retry(checkId: string): Promise<StartOutcome> {
      const row = await store.fitChecks.get(checkId);
      if (!row || row.status !== 'failed' || !row.demoPhotoId) return { outcome: 'noParent' };
      await store.fitChecks.patch(checkId, { status: 'scoring', details: { ...row.details, failCode: undefined } });
      const prep = await deps.prep.prepare({ kind: 'demo', photoId: row.demoPhotoId });
      if (prep.status !== 'ok') return { outcome: 'unknownPhoto' };
      const parent = row.parentId ? await store.fitChecks.get(row.parentId) : null;
      const r = await runRead(checkId, prep.image, parent ? 'recheck' : 'full', parent ? 'recheck' : 'check', row.occasion);
      if (!r.reading) {
        await failRow(checkId, r.fail ?? 'ai');
        return { outcome: 'failed', checkId };
      }
      dispatch({ t: 'scored', attempt: r.attempt });
      const fresh = (await store.fitChecks.get(checkId))!;
      if (parent) await finalizeRecheck(fresh, parent, r.reading, prep.image);
      else await finalizeCheck(fresh, r.reading, await insertReading(r.reading, 'full', prep.image.sha256, null), false);
      dispatch({ t: 'end' });
      return { outcome: 'scored', checkId };
    },
    /** The card's occasion chip: instant re-score in code, no new reading (02 D7). */
    async changeOccasion(checkId: string, occasion: OccasionKey) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading || row.parentId) return null;
      const { row: next } = await rescore(row, reading, { occasion });
      await store.setKv(KV.lastOccasion, occasion);
      return next;
    },
    /** "Not quite right?" → Save correction: a NEW reading with the field changed (04 §7). */
    async saveCorrection(checkId: string, d: CorrectionDraft | { garmentIndex: number; remove: true }) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading) return null;
      const before = row.score;
      const original = reading.garments[d.garmentIndex];
      const next = 'remove' in d ? removeGarment(reading, d.garmentIndex) : applyCorrection(reading, d.garmentIndex, d.field, d.value);
      const nr = await insertReading(next, 'corrected', row.imageHash, row.readingId);
      const { row: after } = await rescore(row, next, { readingId: nr.id });
      let itemName: string | null = null;
      if (original && !('remove' in d)) {
        const hit = matchClosetItem(original, (await store.closet.all()).filter((c) => !c.isDeleted));
        if (hit) {
          const item = (await store.closet.get(hit.id))!;
          const confirmed = item.confirmedFields.includes(d.field) ? item.confirmedFields : [...item.confirmedFields, d.field];
          await store.closet.patch(hit.id, { garment: { ...item.garment, [d.field]: d.value }, confirmedFields: confirmed });
          itemName = item.name;
        }
      }
      await store.corrections.put({
        id: deps.ids('CR'), fitCheckId: checkId, kind: 'remove' in d ? 'wrongItem' : 'wrongDetail',
        field: 'remove' in d ? null : d.field, oldValue: original && !('remove' in d) ? String(original[d.field] ?? '') : null,
        newValue: 'remove' in d ? null : String(d.value ?? ''), userScore: null, scoreBefore: before, scoreAfter: after.score,
        sentAt: null, createdAt: clock.nowMs(),
      });
      return { before, after: after.score, itemName };
    },
    /** "Fix doesn't apply": hide that fix; the next candidate shows. */
    async hideFix(checkId: string, target: string) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading) return null;
      const hidden = Array.from(new Set([...(row.details.hiddenFixTargets ?? []), target]));
      await store.corrections.put({
        id: deps.ids('CR'), fitCheckId: checkId, kind: 'fixDoesntApply', field: target, oldValue: null, newValue: null, userScore: null,
        scoreBefore: row.score, scoreAfter: row.score, sentAt: null, createdAt: clock.nowMs(),
      });
      return (await rescore(row, reading, { details: { ...row.details, hiddenFixTargets: hidden } })).row;
    },
    /** "Score feels off": stored as feedback; the reading and score don't change. */
    async scoreFeedback(checkId: string, direction: 'higher' | 'lower', userScore: number | null = null) {
      const row = await store.fitChecks.get(checkId);
      if (!row) return null;
      await store.corrections.put({
        id: deps.ids('CR'), fitCheckId: checkId, kind: 'scoreOff', field: null, oldValue: null, newValue: direction, userScore,
        scoreBefore: row.score, scoreAfter: row.score, sentAt: null, createdAt: clock.nowMs(),
      });
      return row;
    },
    /** Partial check → pick the shoes from the closet (S10). */
    async pickShoes(checkId: string, itemId: string) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      const item = await store.closet.get(itemId);
      if (!row || !reading || !item) return null;
      const merged = pickShoesFromCloset(reading, item);
      const nr = await insertReading(merged, 'closetPick', row.imageHash, row.readingId);
      return (await rescore(row, merged, { readingId: nr.id, snapState: 'closetPick', details: { ...row.details, finish: null } })).row;
    },
    /** Skip finishing: never asked again for this check. */
    async skipFinish(checkId: string) {
      const row = await store.fitChecks.get(checkId);
      if (!row) return null;
      return store.fitChecks.patch(checkId, { snapState: 'skipped', details: { ...row.details, finish: null } });
    },
    /** Undo / add back an auto-added closet item (the score never changes). Queued: two quick
     *  taps in S11 would otherwise both read the same row and the second write would drop the first. */
    setItemUndone(checkId: string, itemId: string, undone: boolean) {
      const run = undoQueue.then(async () => {
        const row = await store.fitChecks.get(checkId);
        if (!row) return null;
        await store.closet.patch(itemId, { isDeleted: undone });
        const cs = row.details.closetSummary ?? { matched: [], added: [], undone: [] };
        const list = undone ? Array.from(new Set([...cs.undone, itemId])) : cs.undone.filter((x) => x !== itemId);
        return store.fitChecks.patch(checkId, { details: { ...row.details, closetSummary: { ...cs, undone: list } } });
      });
      undoQueue = run.catch(() => null);
      return run;
    },
    /** S21 "Tell me": he did the fix; apply it to the first reading (source userConfirmed). */
    async confirmFixes(recheckId: string) {
      const row = await store.fitChecks.get(recheckId);
      const parent = row?.parentId ? await store.fitChecks.get(row.parentId) : null;
      const first = parent && (await readingOf(parent));
      if (!row || !parent || !first) return null;
      let reading: Reading | null = first;
      for (const f of parent.fixes) reading = reading ? applyFix(reading, f, { closet: await closetFor(parent), occasion: parent.occasion }) : null;
      if (!reading) return null;
      const p = await profile();
      const opts = { occasion: parent.occasion, styles: p.styles, boldness: p.boldness ?? 'a_little' };
      const nr = await insertReading(reading, 'userConfirmed', row.imageHash, parent.readingId);
      const outcome = recheckOutcome(first, parent.fixes, reading, opts);
      await store.corrections.put({
        id: deps.ids('CR'), fitCheckId: recheckId, kind: 'fixConfirmed', field: null, oldValue: null, newValue: null, userScore: null,
        scoreBefore: row.score, scoreAfter: outcome?.after ?? null, sentAt: null, createdAt: clock.nowMs(),
      });
      return (await rescore(row, reading, {
        readingId: nr.id,
        details: {
          ...row.details,
          confirmed: true,
          recheck: outcome
            ? {
                parentScore: outcome.before, delta: outcome.delta, rawDelta: outcome.rawDelta, notes: row.details.recheck?.notes ?? [],
                doneFixes: outcome.doneFixes.map((f) => ({ copy: f.copy, earned: f.earned })), newProblems: outcome.newProblems, notSeen: false,
              }
            : row.details.recheck,
        },
      })).row;
    },
    /** "Overshirt on? Send it. I'll only re-read the layer." (02 D10). */
    async postRecheckPrompt(checkId: string) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading) return null;
      const top = row.fixes[0];
      const held = top?.edits.some((e) => e.op === 'add_held') ? (reading.held_items ?? []).find((g) => g.category === 'outerwear') : undefined;
      const heldName = held ? garmentName(held) : '';
      const fixQuestion = held ? t('recheck.q.held', { held: heldName.charAt(0).toUpperCase() + heldName.slice(1) }) : t('recheck.q.generic');
      const cat = top ? fixTargets([top])[0]?.split('.')[0] ?? '' : '';
      const slotKey = (['outerwear', 'top', 'bottom', 'footwear'].includes(cat) ? `recheck.slot.${cat}` : 'recheck.slot.any') as
        'recheck.slot.outerwear' | 'recheck.slot.top' | 'recheck.slot.bottom' | 'recheck.slot.footwear' | 'recheck.slot.any';
      return message({ createdAt: clock.nowMs(), role: 'stylist', kind: 'text', text: t('recheck.prompt', { fixQuestion, slotWord: t(slotKey) }) });
    },
  };
}

export type FitCheckService = ReturnType<typeof createFitCheckService>;
