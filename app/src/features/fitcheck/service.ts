// Runs a fit check end to end on the interfaces (ReadingSource, ImagePrep, QuotaService, Clock,
// Scheduler): posts the photo and the card, streams the reading into the session reducer, scores
// with @kitted/core and writes the row. Readings are never edited: corrections, merges and snaps
// insert new ones. Failures never use quota. Same photo (same SHA) = same reading, no quota.
// The closet is the closet service's (features/closet/service.ts, #91): it's written after the score, never
// before, and this file never writes a check's closetSummary or itemIds (patchRow keeps them).

import {
  applyCorrection, applyFix, applyPartsFix, applyTapAnswer, askWithCloset, askWithClosetParts, cardFixTargets, carryTapAnswer, dayKey, garmentName, isPartsFix,
  localParts, mergeShoeSnap, PARTS_RUBRIC_VERSION, partsRecheckOutcome, pickShoesFromCloset, RUBRIC_DATA, recheckMerge, recheckOutcome, removeGarment,
  seasonNeeds, tapOrder, tapOrdinal, weatherNeeds, weekdayOf, type ClosetItem, type DayWeather, type Fix, type Garment, type Reading,
  type ScoreOptions, type Styles,
} from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';
import { normStyleKey, type ChatMessage, type CheckDetails, type FitCheckRow, type GoingForSource, type GoingForState, type OccasionKey, type ReadingRow, type ReadingSourceKind, type StyleKey, type TapState } from '@/data/types';
import { t } from '@/i18n/en';
import type { Clock } from '@/services/clock';
import type { ImagePrep } from '@/services/imagePrep/demo';
import type { QuotaService } from '@/services/quota';
import type { FailCode, PreparedImage, ReadingSource, ReadKind } from '@/services/readingSource/types';
import type { Scheduler } from '@/services/scheduler';
import { patchCheckKeepCloset } from '@/features/closet/checkWrites';
import { isOwned } from '@/features/closet/profile';
import { createClosetService, type ClosetService, type DuplicateAnswer } from '@/features/closet/service';
import { IDLE, reduce, type CheckMode, type SessionEvent, type SessionState } from './machine';
import { firstStyle, stylesFor } from './lens';
import { ideaId, slotAt } from '@/features/morning/service';
import { evaluateCheck, scoreOptions, scoringEngine, type ScoringEngine } from './scoring';

/** The engine a stored check is scored with (#209): the one its rubricVersion names, so editing an old check (a
 *  correction, the occasion, its re-check) never moves it to another engine. New rows take the switch's. */
export function engineOf(row: Pick<FitCheckRow, 'rubricVersion'>): ScoringEngine {
  return row.rubricVersion.startsWith('parts-') ? 'parts' : 'v4';
}
const versionFor = (e: ScoringEngine) => (e === 'parts' ? PARTS_RUBRIC_VERSION : RUBRIC_DATA.version);

/** "Going for" (#215): his last confirmed look ({ style, at }), the pre-pick for 7 days after he chose it. */
export const GOING_FOR_LAST_KV = 'goingFor.last';
export const LAST_LOOK_MS = 7 * 24 * 3600 * 1000;


/** The re-check card's numbers, with the engine the first check was scored with. */
function outcomeFor(engine: ScoringEngine, first: Reading, fixes: readonly Fix[], merged: Reading, opts: ScoreOptions) {
  return engine === 'parts' ? partsRecheckOutcome(first, fixes, merged, opts) : recheckOutcome(first, fixes, merged, opts);
}

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
  /** The one quick tap (02 "S5q"): ask before the score when the reading is unsure about a look-alike. */
  tap?: () => boolean;
  /** The closet write path (#91). Default: no closet call (written from the v3 fields). */
  closet?: ClosetService;
}

export interface CheckRequest {
  mode: CheckMode;
  /** A bundled demo photo… */
  photoId?: string;
  /** …or a real photo (picker / camera file), prepped on the phone before anything is sent. */
  photoUri?: string;
  /** Re-check and shoe snap: the check they belong to. */
  parentCheckId?: string;
  occasion?: OccasionKey;
  /** The one style to score for (#61); omitted = his first onboarding style. */
  style?: StyleKey | null;
  /** A fixed id (demo story: "story-first", "story-recheck"); otherwise one is made. */
  checkId?: string;
}

export type StartOutcome =
  | { outcome: 'scored' | 'failed' | 'notScored'; checkId: string }
  /** Read; the one quick tap is waiting (nothing counted yet). */
  | { outcome: 'asking'; checkId: string }
  | { outcome: 'limit' | 'unknownPhoto' | 'notImplemented' | 'noParent' }
  /** 02 S3: nothing was sent and nothing counts. */
  | { outcome: 'photoProblem'; reason: 'noPerson' | 'multiplePeople' | 'couldNotFrame' };

export interface CorrectionDraft {
  garmentIndex: number;
  field: keyof Garment & string;
  value: Garment[keyof Garment];
}

type Profile = { styles: Styles; boldness: string | null };

/** What a row is scored with: its occasion and one style, his boldness (#61). The one builder for both the
 *  card (evaluateCheck) and the one quick tap (askQuestion), so the tap's scores are the card's. */
export function lensInput(occasion: OccasionKey, style: StyleKey | null, p: Profile) {
  return { occasion, styles: stylesFor(style, p.styles), boldness: p.boldness };
}

/** The answer to the one quick tap: one of its two values, or a skip (scores the default). */
export type TapAnswer = string | 'skip';

const emptyRow = (over: Partial<FitCheckRow> & Pick<FitCheckRow, 'id' | 'createdAt' | 'dayKey' | 'occasion'>): FitCheckRow => ({
  photoFile: null, thumbFile: null, demoPhotoId: null, imageHash: '', status: 'scoring', isPartial: false, notRated: [], score: null,
  rawScore: null, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [], fixes: [], explanation: null,
  rubricVersion: versionFor(scoringEngine()), isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
  parentId: null, itemIds: [], details: {}, style: null, ...over,
});

export function createFitCheckService(deps: ServiceDeps) {
  const { store, clock } = deps;
  const closet = deps.closet ?? createClosetService({ store, clock, scheduler: deps.scheduler, ids: deps.ids, source: null });
  /** Every fit-check write here keeps the closet's part of the row (closetSummary, itemIds) as stored. */
  const patchRow = (id: string, patch: Partial<FitCheckRow>) => patchCheckKeepCloset(store, id, patch);
  /** The prepared photo per check, for its closet call (the tap answer comes later). */
  const images = new Map<string, PreparedImage>();
  const imageOf = (row: FitCheckRow): PreparedImage => images.get(row.id) ?? { photoId: row.demoPhotoId, sha256: row.imageHash, uploadUri: null };
  let state: SessionState = IDLE;
  let attempt = 0;
  let tapQueue: Promise<unknown> = Promise.resolve();
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

  /** The closet a check's fixes may use: not undone or merged away, and not the pieces this photo (or, for a
   *  re-check, its first photo) added. So the closet written after a score can never change that score. */
  const closetFor = async (row?: FitCheckRow | null): Promise<ClosetItem[]> => {
    const parent = row?.parentId ? await store.fitChecks.get(row.parentId) : null;
    const exclude = new Set([...(row?.details.closetSummary?.added ?? []), ...(parent?.details.closetSummary?.added ?? [])]);
    return (await store.closet.all()).filter((c) => isOwned(c) && !exclude.has(c.id));
  };

  /** A warm day for this check (its card's weather, else the month): no "add a layer" or boots fix (#160). */
  const warmFor = async (row: FitCheckRow): Promise<boolean> => {
    const { day, slot } = slotAt(row.createdAt, clock.offset);
    const w = (await store.dailyIdeas.get(ideaId(day, slot)))?.weather as unknown as DayWeather | null | undefined;
    return (w ? weatherNeeds(w) : seasonNeeds(localParts(row.createdAt, clock.offset).m)).layer === 'none';
  };

  const message = async (m: Omit<ChatMessage, 'id' | 'chips' | 'payload' | 'text' | 'cardType' | 'outfitId' | 'itemId' | 'fitCheckId'> & Partial<ChatMessage>) =>
    store.chat.put({
      id: deps.ids('M'), text: null, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {}, ...m,
    } as ChatMessage);

  const insertReading = async (
    reading: Reading, source: ReadingSourceKind, imageHash: string, derivedFrom: string | null, latencyMs = 0, model?: string, promptVersion?: string,
  ) => {
    // A derived reading (tap answer, correction, merge) keeps the model of the reading it came from, so a real
    // Gemini read isn't logged as 'demo-bundled' once he answers or corrects it.
    const parent = derivedFrom && (model === undefined || promptVersion === undefined) ? await store.readings.get(derivedFrom) : null;
    model ??= parent?.model ?? 'demo-bundled';
    promptVersion ??= parent?.promptVersion ?? 'v3';
    const row: ReadingRow = {
      id: deps.ids('R'), imageHash, source, reading, model, promptVersion, schemaVersion: 'v3',
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
    const style = patch.style !== undefined ? patch.style : row.style;
    const ev = evaluateCheck({
      reading, ...lensInput(occasion, style, p), closet: await closetFor(row), firstCheck: row.isFirstCheck,
      hiddenFixTargets: details.hiddenFixTargets ?? [], warm: await warmFor(row), engine: engineOf(row),
      goingFor: details.goingFor ? details.goingFor.style : undefined,
    });
    const next = await patchRow(row.id, {
      ...ev.row, ...patch, details: { ...details, ...ev.row.details, hiddenFixTargets: details.hiddenFixTargets ?? [] },
    });
    return { ev, row: next! };
  };

  /** S21: the first check's reading with the fixes done applied: the ones he ticks plus the ones
   *  the re-check already saw. From the FIRST reading, because a re-check re-reads only the changed
   *  layer (a held overshirt isn't in it, so "wear it open" can't apply there). */
  const confirmDraft = async (recheckId: string, targets?: readonly string[]) => {
    const row = await store.fitChecks.get(recheckId);
    const parent = row?.parentId ? await store.fitChecks.get(row.parentId) : null;
    const first = parent && (await readingOf(parent));
    if (!row || !parent || !first) return null;
    const opts = scoreOptions(lensInput(parent.occasion, parent.style, await profile()));
    const seen = await readingOf(row);
    const engine = engineOf(parent);
    const caught = new Set(seen ? (outcomeFor(engine, first, parent.fixes, seen, opts)?.doneFixes ?? []).map((f) => f.target) : []);
    const closet = await closetFor(parent);
    let reading: Reading | null = first;
    for (const f of parent.fixes.filter((x) => !targets || targets.includes(x.target) || caught.has(x.target))) {
      reading = reading ? (isPartsFix(f) ? applyPartsFix(reading, f, { closet }) : applyFix(reading, f, { closet, occasion: parent.occasion })) : null;
    }
    if (!reading) return null;
    return { row, parent, reading, outcome: outcomeFor(engine, first, parent.fixes, reading, opts) };
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
    const base = await patchRow(row.id, { readingId: readingRow.id });
    const { ev, row: scored } = await rescore(base!, reading);
    if (ev.status !== 'scored') return scored;
    const finish = ev.partial === 'shoes' ? await rememberedShoes(scored) : null;
    await patchRow(row.id, { snapState: ev.partial ? 'pending' : 'none', details: { ...scored.details, finish } });
    if (!cached) await deps.quota.consumeCheck(row.dayKey);
    await store.setKv(KV.lastOccasion, row.occasion);
    const p = await store.profile.get('me');
    if (p) await store.profile.patch('me', { lastOccasion: row.occasion });
    // The score is in: now the closet (the closet call runs in the background; S11 shows it landing).
    await closet.afterCheck(row.id, imageOf(scored));
    return (await store.fitChecks.get(row.id)) ?? scored;
  }

  /** A full check's reading is in: ask the one quick tap first, or score it now. The question is stored on the
   *  row (status 'asking') before the reading card ends, so the slot never goes blank. */
  async function afterRead(row: FitCheckRow, reading: Reading, readingRow: ReadingRow, cached: boolean): Promise<FitCheckRow> {
    // With what he owned before this photo (#126): "Your green work boots?" about a piece he confirmed, or none when
    // his closet agrees with the read. The question (and so the snapshot's effect) is stored on the row.
    const tapOpts = scoreOptions(lensInput(row.occasion, row.style, await profile()));
    // Parts checks pick the question with the parts score's swing (#212; same rules and bars as v4), so the options'
    // scores are what the card then shows. v4 checks keep v4.1's question (parity-tested against rubric.py).
    const ask = engineOf(row) === 'parts' ? askWithClosetParts : askWithCloset;
    const q = deps.tap?.() && !row.details.tap ? ask(reading, tapOpts, await closet.knownPieces([row.id])) : null;
    if (!q) return finalizeCheck(row, reading, readingRow, cached);
    const tap: TapState = {
      pair: q.pair, slot: q.slot, garmentIndex: q.garmentIndex, ordinal: tapOrdinal(reading, q.garmentIndex), question: q.question,
      options: q.options.map((o) => ({ ...o })), order: tapOrder(q).map((o) => o.value), default: q.default, swing: q.swing, doubt: q.doubt,
      occasion: row.occasion, askedAt: clock.nowMs(), answer: null, skipped: false, answeredAt: null, ...(cached ? { free: true } : {}),
      ...(q.kind ? { kind: q.kind } : {}),
      ...(q.knownId ? { knownId: q.knownId, knownName: q.knownName } : {}),
    };
    return (await patchRow(row.id, { status: 'asking', readingId: readingRow.id, details: { ...row.details, tap } }))!;
  }

  /** His answer (or Skip): a derived reading with the type set, then the normal finish (closet, quota, score). */
  async function answer(checkId: string, a: TapAnswer): Promise<FitCheckRow | null> {
    const row = await store.fitChecks.get(checkId);
    const tap = row?.details.tap;
    if (!row || row.status !== 'asking' || !tap || tap.answer !== null) return null;
    const raw = row.readingId ? await store.readings.get(row.readingId) : null;
    if (!raw) return null;
    const skipped = a === 'skip';
    const value = skipped ? tap.default : a;
    const chosen = tap.options.find((o) => o.value === value);
    if (!chosen) return null;
    const reading = applyTapAnswer(raw.reading, { garmentIndex: tap.garmentIndex, field: 'subcategory' }, value);
    const answered = await insertReading(reading, 'tapAnswer', row.imageHash, raw.id);
    const now = clock.nowMs();
    const next = (await patchRow(checkId, { details: { ...row.details, tap: { ...tap, answer: value, skipped, answeredAt: now } } }))!;
    await store.corrections.put({
      id: deps.ids('CR'), fitCheckId: checkId, kind: skipped ? 'tapSkip' : 'tapAnswer', field: 'subcategory',
      oldValue: String(raw.reading.garments[tap.garmentIndex]?.subcategory ?? ''), newValue: value, userScore: null,
      scoreBefore: tap.options[0]?.score ?? null, scoreAfter: chosen.score, sentAt: null, createdAt: now,
    });
    // He told us what it is: the closet write gives that piece's sighting (and a new piece) the confirmed type, so
    // the "Wrong item" sheet won't second-guess it. A Skip learns nothing.
    const done = await finalizeCheck(next, reading, answered, tap.free === true);
    return (await store.fitChecks.get(checkId)) ?? done;
  }

  async function finalizeRecheck(row: FitCheckRow, parent: FitCheckRow, next: Reading, image: PreparedImage) {
    const parentReading = await readingOf(parent);
    if (!parentReading) throw new Error(`re-check parent ${parent.id} has no reading`);
    const opts = scoreOptions(lensInput(parent.occasion, parent.style, await profile()));
    const raw = await insertReading(next, 'recheckRaw', image.sha256, null);
    // His answer to the one quick tap holds on the re-check (a second misread can't undo it), unless a fix
    // replaces that whole piece. Re-checks never ask.
    const tap = parent.details.tap;
    const targets = cardFixTargets(parent.fixes);
    const carried = tap?.answer ? carryTapAnswer(parentReading, tap, next, targets) : next;
    // The anchored merge is engine-free except its "new problem" test, which still asks v4.1's rules (#209).
    const { merged, notes } = recheckMerge(parentReading, carried, targets, opts);
    const mergedRow = await insertReading(merged, 'recheckMerged', image.sha256, parent.readingId);
    const outcome = outcomeFor(engineOf(parent), parentReading, parent.fixes, merged, opts);
    await patchRow(row.id, { readingId: mergedRow.id });
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
    await patchRow(parent.id, { recheckUsed: true });
    await deps.quota.consumeRecheck();
    // Changed pieces (the fix) go through the closet engine; the rest are another sighting of the first check's.
    await closet.afterRecheck(row.id, image);
    return (await store.fitChecks.get(row.id)) ?? scored;
  }

  async function finalizeSnap(parent: FitCheckRow, snap: Reading, image: PreparedImage) {
    const parentReading = await readingOf(parent);
    if (!parentReading) return parent;
    const snapRow = await insertReading(snap, 'lower', image.sha256, null);
    const merged = mergeShoeSnap(parentReading, snap);
    const mergedRow = await insertReading(merged, 'snapMerged', parent.imageHash, parent.readingId);
    const { row } = await rescore(parent, merged, { readingId: mergedRow.id, snapState: 'snapped', details: { ...parent.details, finish: null } });
    // The snapped shoes join the closet (footwear only), linked to the first check.
    await closet.afterSnap(parent.id, snapRow.id, image);
    return (await store.fitChecks.get(parent.id)) ?? row;
  }

  /** Streams one read into the session, with the ruling 19 timers. */
  async function runRead(
    checkId: string, image: PreparedImage, kind: ReadKind, mode: CheckMode, occasion: OccasionKey,
    look?: { style: StyleKey | null; source: GoingForSource; bothFromCard?: boolean },
  ) {
    attempt += 1;
    const my = attempt;
    dispatch({ t: 'start', checkId, mode, occasion, attempt: my, ...(look ? { look } : {}) });
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
    let model = 'demo-bundled';
    let promptVersion = 'v3';
    let latencyMs = 0;
    const work = (async () => {
      for await (const e of deps.source.read(image, kind, { signal: abort.signal })) {
        if (timedOut) break;
        if (e.type === 'slotFound') gotSlot = true;
        if (e.type === 'reading') {
          reading = e.reading;
          model = e.model;
          promptVersion = e.promptVersion;
        }
        if (e.type === 'meta') latencyMs = Math.round(e.latencySeconds * 1000);
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
    if (timedOut) return { reading: null, fail: 'timeout' as FailCode, attempt: my, model, promptVersion, latencyMs };
    if (abort.signal.aborted) return { reading: null, fail: null, attempt: my, cancelled: true, model, promptVersion, latencyMs };
    return { reading: reading as Reading | null, fail: fail as FailCode | null, attempt: my, model, promptVersion, latencyMs };
  }

  async function failRow(checkId: string, code: FailCode) {
    const row = await store.fitChecks.get(checkId);
    if (row) await patchRow(checkId, { status: 'failed', details: { ...row.details, failCode: code } });
    dispatch({ t: 'end' });
  }

  /** The wait's pre-pick (02 "Going for"): the morning card's look when he opened the camera from it, else his last
   *  confirmed look (within 7 days), else his first pick from setup, else Not sure. */
  async function prePick(req: CheckRequest, now: number): Promise<GoingForState> {
    if (req.style !== undefined) return { style: req.style, confirmed: false, source: 'card', bothFromCard: req.occasion !== undefined };
    try {
      const raw = await store.getKv(GOING_FOR_LAST_KV);
      const last = raw ? (JSON.parse(raw) as { style?: unknown; at?: unknown }) : null;
      const style = normStyleKey(last?.style);
      if (style && typeof last?.at === 'number' && now - last.at <= LAST_LOOK_MS && now >= last.at) return { style, confirmed: false, source: 'last' };
    } catch {
      // a damaged value: fall through to his first pick
    }
    const first = firstStyle((await profile()).styles);
    return first ? { style: first, confirmed: false, source: 'setup' } : { style: null, confirmed: false, source: 'none' };
  }

  /** He chose a look (not Not sure): it's the pre-pick for the next 7 days. */
  async function rememberLook(style: StyleKey | null) {
    if (style) await store.setKv(GOING_FOR_LAST_KV, JSON.stringify({ style, at: clock.nowMs() }));
  }

  async function start(req: CheckRequest): Promise<StartOutcome> {
    const now = clock.nowMs();
    const parent = req.parentCheckId ? await store.fitChecks.get(req.parentCheckId) : null;
    if ((req.mode === 'recheck' || req.mode === 'shoeSnap') && !parent) return { outcome: 'noParent' };
    if (req.mode === 'check' && !(await deps.quota.canStartCheck())) return { outcome: 'limit' };
    const prep = await deps.prep.prepare(req.photoUri ? { kind: 'file', uri: req.photoUri } : { kind: 'demo', photoId: req.photoId ?? '' });
    if (prep.status === 'noPerson' || prep.status === 'multiplePeople' || prep.status === 'couldNotFrame') return { outcome: 'photoProblem', reason: prep.status };
    if (prep.status !== 'ok') return { outcome: prep.status === 'unknownPhoto' ? 'unknownPhoto' : 'notImplemented' };
    const image = prep.image;
    // His photo in the thread: the bundled id, or his own copy kept on the phone (unblurred; only the upload is blurred).
    const photoPayload = image.photoId ? { photoId: image.photoId } : { photoUri: image.keptUri ?? null, aspect: image.aspect ?? null };
    const lastOccasion = ((await store.getKv(KV.lastOccasion)) as OccasionKey | null) ?? 'everyday';
    const occasion: OccasionKey = req.mode !== 'check' && parent ? parent.occasion : req.occasion ?? lastOccasion;
    // One look per check (#61), now the "Going for" answer (#215): pre-picked, and he can change it during the wait. A
    // re-check or a shoe snap keeps its first check's. It shapes the advice only; the score never reads it.
    const going = req.mode === 'check' ? await prePick(req, now) : null;
    const style: StyleKey | null = req.mode !== 'check' && parent ? parent.style : going!.style;

    if (req.mode === 'shoeSnap' && parent) {
      await message({ createdAt: now, role: 'user', kind: 'photo', fitCheckId: parent.id, payload: { ...photoPayload, snap: true } });
      const r = await runRead(parent.id, image, 'shoeSnap', 'shoeSnap', occasion);
      dispatch({ t: 'end' });
      if (!r.reading) return { outcome: 'failed', checkId: parent.id };
      await finalizeSnap(parent, r.reading, image);
      return { outcome: 'scored', checkId: parent.id };
    }

    const checkId = req.checkId ?? deps.ids('FC');
    if (req.mode === 'check') await replaceAsking(checkId);
    const priorChecks = (await store.fitChecks.all()).filter((c) => !c.parentId && c.status === 'scored');
    const row = emptyRow({
      id: checkId, createdAt: now, dayKey: dayKey(now, clock.offset), occasion, style, demoPhotoId: image.photoId, imageHash: image.sha256,
      details: going ? { goingFor: going } : req.mode === 'recheck' && parent?.details.goingFor ? { goingFor: { ...parent.details.goingFor } } : {},
      photoFile: image.keptUri ?? null, thumbFile: image.thumbUri ?? null,
      parentId: parent?.id ?? null, isFirstCheck: req.mode === 'check' && priorChecks.length === 0,
      // A re-check is scored like its first check, so the two numbers compare (#209).
      ...(req.mode === 'recheck' && parent ? { rubricVersion: parent.rubricVersion } : {}),
    });
    await store.fitChecks.put(row);
    images.set(checkId, image);
    await message({ createdAt: now, role: 'user', kind: 'photo', fitCheckId: checkId, payload: photoPayload });
    await message({ createdAt: now + 1, role: 'stylist', kind: 'card', cardType: req.mode === 'recheck' ? 'recheck' : 'fitCheck', fitCheckId: checkId });

    if (req.mode === 'check') {
      const readings = await store.readings.all();
      const cached = readings
        .filter((r) => r.imageHash === image.sha256 && r.source === 'full')
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      if (cached) {
        const ms = deps.timers().cacheHitMs;
        if (ms > 0) await deps.scheduler.sleep(ms);
        // Same photo, same score: his earlier answer to the one quick tap is reused, never asked again. Free only
        // if that photo was scored before (one replaced while asking never counted, so this one does).
        const answered = readings.filter((r) => r.source === 'tapAnswer' && r.derivedFrom === cached.id).sort((a, b) => b.createdAt - a.createdAt)[0];
        const free = (await store.fitChecks.all()).some((c) => c.id !== checkId && c.imageHash === image.sha256 && !c.parentId && c.status === 'scored');
        // Scored before without a question (none qualified, or his closet agreed): score it the same way again, so
        // a closet that changed since can't make the same photo ask, or score, differently (#126).
        const done = answered ? await finalizeCheck(row, answered.reading, answered, free)
          : free ? await finalizeCheck(row, cached.reading, cached, free)
          : await afterRead(row, cached.reading, cached, free);
        return outcomeOf(done);
      }
    }

    const r = await runRead(checkId, image, req.mode === 'recheck' ? 'recheck' : 'full', req.mode, occasion, going ?? undefined);
    if ('cancelled' in r && r.cancelled) return { outcome: 'failed', checkId };
    if (!r.reading) {
      await failRow(checkId, r.fail ?? 'ai');
      return { outcome: 'failed', checkId };
    }
    // The occasion he tapped while it read (ignored for re-checks), and the look (#215).
    const live = state.kind === 'reading' && state.checkId === checkId ? state : null;
    const chosen = live ? live.occasion : occasion;
    if (chosen !== occasion) await patchRow(checkId, { occasion: chosen });
    if (going && live?.lookTouched) await saveLookAnswer(checkId, live.look, live.lookOther);
    dispatch({ t: 'scored', attempt: r.attempt });
    const fresh = (await store.fitChecks.get(checkId))!;
    let done: FitCheckRow;
    if (req.mode === 'recheck' && parent) {
      done = await finalizeRecheck(fresh, parent, r.reading, image);
    } else {
      const readingRow = await insertReading(r.reading, 'full', image.sha256, null, r.latencyMs, r.model, r.promptVersion);
      done = await afterRead(fresh, r.reading, readingRow, false);
    }
    dispatch({ t: 'end' });
    return outcomeOf(done);
  }

  /** His answer during the wait: on the row (style + goingFor, confirmed) before it's scored. */
  async function saveLookAnswer(checkId: string, style: StyleKey | null, other: string | null) {
    const row = await store.fitChecks.get(checkId);
    if (!row?.details.goingFor) return;
    await patchRow(checkId, { style, details: { ...row.details, goingFor: { ...row.details.goingFor, style, confirmed: true, other: other ?? null } } });
    await rememberLook(style);
  }

  function outcomeOf(done: FitCheckRow): StartOutcome {
    return { outcome: done.status === 'scored' ? 'scored' : done.status === 'asking' ? 'asking' : 'notScored', checkId: done.id };
  }

  /** A new photo while a question is open: the open one is set aside (never counted; nothing was added). */
  async function replaceAsking(exceptId: string) {
    for (const c of await store.fitChecks.all()) {
      if (c.status === 'asking' && c.id !== exceptId) await patchRow(c.id, { status: 'failed', details: { ...c.details, failCode: 'replaced' } });
    }
  }

  const api = {
    getState: () => state,
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    start,
    /** The one quick tap (02 "S5q"): his answer or 'skip'. Queued, and a no-op unless the check is still asking
     *  and unanswered, so a double tap (or a second device) can't score it twice. */
    answerTap(checkId: string, a: TapAnswer): Promise<FitCheckRow | null> {
      const run = tapQueue.then(() => answer(checkId, a));
      tapQueue = run.catch(() => null);
      return run;
    },
    /** Occasion tap while reading (stored; no new reading). */
    selectOccasion(occasion: OccasionKey) {
      dispatch({ t: 'occasion', occasion });
    },
    /** "Going for" tap while reading (#215): saved when the score lands; the score never waits for it. */
    selectLook(style: StyleKey | null, other?: string | null) {
      dispatch({ t: 'look', style, other: other ?? null });
    },
    /** "Going for" changed after the score (Change): the advice is rewritten, the score columns are never touched
     *  (the number, the word, the parts and the Why rows stay as stored). Free, no new check, no confirm. */
    async changeGoingFor(checkId: string, style: StyleKey | null, other?: string | null) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading || row.parentId || row.status !== 'scored' || !row.details.goingFor) return null;
      const p = await profile();
      const ev = evaluateCheck({
        reading, ...lensInput(row.occasion, style, p), closet: await closetFor(row), firstCheck: row.isFirstCheck,
        hiddenFixTargets: row.details.hiddenFixTargets ?? [], warm: await warmFor(row), engine: engineOf(row), goingFor: style,
      });
      const d = ev.row.details;
      const next = await patchRow(checkId, {
        style, fixes: ev.row.fixes, explanation: ev.row.explanation,
        details: {
          ...row.details, nextLevel: d.nextLevel, tips: d.tips, dialedIn: d.dialedIn, tipLead: d.tipLead,
          ...(row.details.parts && d.parts ? { parts: { ...row.details.parts, gainPart: d.parts.gainPart } } : {}),
          goingFor: { ...row.details.goingFor, style, confirmed: true, other: other ?? null },
          goingForAdvice: d.goingForAdvice ?? null,
        },
      });
      await rememberLook(style);
      return next;
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
      if (!row || row.status !== 'failed' || (!row.demoPhotoId && !row.photoFile)) return { outcome: 'noParent' };
      await patchRow(checkId, { status: 'scoring', details: { ...row.details, failCode: undefined } });
      const prep = await deps.prep.prepare(
        row.demoPhotoId ? { kind: 'demo', photoId: row.demoPhotoId } : { kind: 'retry', sha256: row.imageHash, keptUri: row.photoFile, thumbUri: row.thumbFile },
      );
      if (prep.status !== 'ok') return { outcome: 'unknownPhoto' };
      images.set(checkId, prep.image);
      const parent = row.parentId ? await store.fitChecks.get(row.parentId) : null;
      const gf = !parent ? row.details.goingFor : undefined;
      const r = await runRead(checkId, prep.image, parent ? 'recheck' : 'full', parent ? 'recheck' : 'check', row.occasion, gf ? { ...gf } : undefined);
      if (!r.reading) {
        await failRow(checkId, r.fail ?? 'ai');
        return { outcome: 'failed', checkId };
      }
      if (gf && state.kind === 'reading' && state.checkId === checkId && state.lookTouched) await saveLookAnswer(checkId, state.look, state.lookOther);
      dispatch({ t: 'scored', attempt: r.attempt });
      const fresh = (await store.fitChecks.get(checkId))!;
      const done = parent
        ? await finalizeRecheck(fresh, parent, r.reading, prep.image)
        : await afterRead(fresh, r.reading, await insertReading(r.reading, 'full', prep.image.sha256, null, r.latencyMs, r.model, r.promptVersion), false);
      dispatch({ t: 'end' });
      return outcomeOf(done);
    },
    /** What the card would score for another occasion or style, without saving (the confirm alert's preview, #62). */
    async previewLens(checkId: string, lens: { occasion?: OccasionKey; style?: StyleKey | null }) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading || row.parentId || row.status === 'asking') return null;
      const p = await profile();
      const ev = evaluateCheck({
        reading, occasion: lens.occasion ?? row.occasion, styles: stylesFor(lens.style !== undefined ? lens.style : row.style, p.styles),
        boldness: p.boldness, closet: await closetFor(row), firstCheck: row.isFirstCheck, hiddenFixTargets: row.details.hiddenFixTargets ?? [],
        warm: await warmFor(row), engine: engineOf(row),
      });
      return { before: row.score, after: ev.row.score ?? null };
    },
    /** He confirmed: re-score the same card in place, in code, no new reading or check (02 D7, #62). */
    async changeLens(checkId: string, lens: { occasion?: OccasionKey; style?: StyleKey | null }) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading || row.parentId || row.status === 'asking') return null;
      const rescoredFrom = { score: row.score ?? 0, occasion: row.occasion, style: row.style };
      const patch: Partial<FitCheckRow> = { details: { ...row.details, rescoredFrom } };
      if (lens.occasion) patch.occasion = lens.occasion;
      if (lens.style !== undefined) patch.style = lens.style;
      const { row: next } = await rescore(row, reading, patch);
      if (lens.occasion) await store.setKv(KV.lastOccasion, lens.occasion);
      return next;
    },
    /** The occasion chip before the score lands (S5 chips): instant, no confirm. */
    async changeOccasion(checkId: string, occasion: OccasionKey) {
      return api.changeLens(checkId, { occasion });
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
      // The closet follows the stored garment → item link (never a re-match, which could recolor the wrong piece).
      const { itemName } = await closet.correction(
        checkId, 'remove' in d ? { garmentIndex: d.garmentIndex, remove: true } : { garmentIndex: d.garmentIndex, field: d.field, value: d.value }, next, nr.id,
      );
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
      return patchRow(checkId, { snapState: 'skipped', details: { ...row.details, finish: null } });
    },
    /** Undo / add back an auto-added closet item (the score never changes). Queued (with every closet write),
     *  so two quick taps in S11 both land. */
    setItemUndone(checkId: string, itemId: string, undone: boolean) {
      return closet.setUndone(checkId, itemId, undone);
    },
    /** "Same as your khaki chinos?": Yes (merge), No (a new piece), or "It's my {runner-up}". Re-answerable. */
    answerDuplicate(checkId: string, obsId: string, a: DuplicateAnswer) {
      return closet.answer(checkId, obsId, a);
    },
    /** "Not the same": a matched piece was a different one; it becomes its own item. */
    splitItem(checkId: string, obsId: string) {
      return closet.split(checkId, obsId);
    },
    /** The closet service (catch-up on foreground, settle for demo screens and tests). */
    closet,
    /** S21 "What changed?": the score if he did these fixes (all the first check's fixes by default). */
    async previewConfirm(recheckId: string, targets?: readonly string[]) {
      const d = await confirmDraft(recheckId, targets);
      return d ? { before: d.row.score, after: d.outcome?.after ?? d.row.score } : null;
    },
    /** S21: he did the fix. Apply it to what the re-check read (source userConfirmed), so a change
     *  the re-check did catch is kept, and re-score against the first check. */
    async confirmFixes(recheckId: string, targets?: readonly string[]) {
      const d = await confirmDraft(recheckId, targets);
      if (!d) return null;
      const { row, parent, reading, outcome } = d;
      const nr = await insertReading(reading, 'userConfirmed', row.imageHash, parent.readingId);
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
      const cat = top ? cardFixTargets([top])[0]?.split('.')[0] ?? '' : '';
      const slotKey = (['outerwear', 'top', 'bottom', 'footwear'].includes(cat) ? `recheck.slot.${cat}` : 'recheck.slot.any') as
        'recheck.slot.outerwear' | 'recheck.slot.top' | 'recheck.slot.bottom' | 'recheck.slot.footwear' | 'recheck.slot.any';
      return message({ createdAt: clock.nowMs(), role: 'stylist', kind: 'text', text: t('recheck.prompt', { fixQuestion, slotWord: t(slotKey) }) });
    },
  };
  return api;
}

export type FitCheckService = ReturnType<typeof createFitCheckService>;
