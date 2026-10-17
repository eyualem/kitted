// Runs a fit check end to end on the interfaces (ReadingSource, ImagePrep, QuotaService, Clock,
// Scheduler): posts the photo and the card, streams the reading into the session reducer, scores
// with @kitted/core and writes the row. Readings are never edited: corrections, merges and snaps
// insert new ones. Failures never use quota. Same photo (same SHA) = same reading, no quota.
// The closet is the closet service's (features/closet/service.ts, #91): it's written after the score, never
// before, and this file never writes a check's closetSummary or itemIds (patchRow keeps them).

import {
  applyCorrection, applyFix, applyPartsFix, applyTapAnswer, askWithCloset, askWithClosetParts, cardFixTargets, carryTapAnswer, dayKey, garmentName, isPartsFix,
  localParts, mergeBottomSnap, mergeShoeSnap, PARTS_RUBRIC_VERSION, partsRecheckOutcome, pickShoesFromCloset, RUBRIC_DATA, recheckMerge, recheckOutcome, removeGarment,
  seasonNeeds, tapOrder, tapOrdinal, weatherNeeds, weekdayOf, type ClosetItem, type DayWeather, type Fix, type Garment, type Reading,
  type Styles,
} from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';
import {
  normStyleKey, type ChatMessage, type CheckDetails, type FitCheckRow, type GoingForSource, type GoingForState, type OccasionKey, type ReadingRow, type ReadingSourceKind,
  type StoredSecondLook, type StyleKey, type TapState,
} from '@/data/types';
import { t } from '@/i18n/en';
import type { Clock } from '@/services/clock';
import type { ImagePrep, PersonBox } from '@/services/imagePrep/demo';
import { isRecheckOpen, recheckDeadline, type QuotaService } from '@/services/quota';
import type { FailCode, PreparedImage, ReadingSource, ReadKind, SecondLookCall } from '@/services/readingSource/types';
import type { Scheduler } from '@/services/scheduler';
import { patchCheckKeepCloset } from '@/features/closet/checkWrites';
import { isOwned } from '@/features/closet/profile';
import { createClosetService, type ClosetService, type DuplicateAnswer } from '@/features/closet/service';
import { IDLE, reduce, type CheckMode, type SessionEvent, type SessionState } from './machine';
import { snapPart } from './finish';
import { firstStyle, stylesFor } from './lens';
import { ideaId, slotAt } from '@/features/morning/service';
import { evaluateCheck, scoreOptions, scoringEngine, type CheckScoreOptions, type ScoringEngine } from './scoring';
import { anchorRecheckLook, copiedLook, hasLook, LOOK_GRACE_MS, lookInput, settledLine, settleSecondLook } from './secondLook';
import { dropWhichOne, whichOneOf, type WhichOnePayload } from './whichOne';
export { failInterruptedChecks } from './interrupted';

/** The engine a stored check is scored with (#209): the one its rubricVersion names, so editing an old check (a
 *  correction, the occasion, its re-check) never moves it to another engine. New rows take the switch's. */
export function engineOf(row: Pick<FitCheckRow, 'rubricVersion'>): ScoringEngine {
  return row.rubricVersion.startsWith('parts-') ? 'parts' : 'v4';
}
const versionFor = (e: ScoringEngine) => (e === 'parts' ? PARTS_RUBRIC_VERSION : RUBRIC_DATA.version);

/** "Going for" (#215): his last confirmed look ({ style, at }), the pre-pick for 7 days after he chose it. */
export const GOING_FOR_LAST_KV = 'goingFor.last';
export const LAST_LOOK_MS = 7 * 24 * 3600 * 1000;


/** The re-check card's numbers, with the engine the first check was scored with. `opts` carry the first check's second
 *  look; `mergedLook` is the re-check's own (anchored, secondLook.anchorRecheckLook), so each side scores as its card did. */
function outcomeFor(engine: ScoringEngine, first: Reading, fixes: readonly Fix[], merged: Reading, opts: CheckScoreOptions, mergedLook?: StoredSecondLook | null) {
  if (engine !== 'parts') return recheckOutcome(first, fixes, merged, opts);
  const { secondLook: _first, ...rest } = opts;
  void _first;
  const sl = lookInput(mergedLook);
  return partsRecheckOutcome(first, fixes, merged, opts, sl ? { ...rest, secondLook: sl } : rest);
}

export interface TimerConfig {
  /** Off for screen 6's frozen state (headless Chrome's virtual time would fire them). */
  enabled: boolean;
  hedgeMs: number;
  slowMs: number;
  abortMs: number;
  /** "Same photo, same reading" pause (≤ 0.3 s; 0 for screenshots). */
  cacheHitMs: number;
  /** How long after the reading the card waits for the second look (#199); default LOOK_GRACE_MS (1.5 s). */
  lookGraceMs?: number;
  /** The longest one check may hold the one-check slot (prep, the read, the score, the writes); past it the slot is
   *  freed and a check still reading fails with Try again, so no step that never settles can block every later photo.
   *  Default SLOT_MS. */
  slotMs?: number;
}

/** The slot's cap: well past the read's own 14 s give-up, the 1.5 s look grace and photo prep. */
export const SLOT_MS = 40_000;

export const DEFAULT_TIMERS: TimerConfig = { enabled: true, hedgeMs: 5_000, slowMs: 9_000, abortMs: 14_000, cacheHitMs: 300, lookGraceMs: LOOK_GRACE_MS, slotMs: SLOT_MS };

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
  /** Deletes a temporary original that will never be prepped ("Which one is you?" cancelled or replaced). */
  discardPhoto?: (uri: string) => void;
  /** Whether his own photo may be prepped and sent (Y7 "Score my fits", 02 D4). Checked before every real photo's prep
   *  and Try again; false = 'noConsent', nothing prepped, sent or counted. Bundled demo photos never leave the phone.
   *  Default: allowed (tests). The app passes privacy/wipe.ts mayUpload. */
  consent?: () => Promise<boolean>;
  /** "Don't score it" on a held photo (02 S17h, #280): deletes his kept copy and thumb (it was never sent). The app
   *  passes features/held/files.ts deleteHeldPhoto; default: nothing on disk (tests, the web preview). */
  deleteHeldFiles?: (row: Pick<FitCheckRow, 'photoFile' | 'thumbFile' | 'imageHash'>) => void;
  /** The phone's connection (services/connectivity.ts, 09 §20.8 G18): a read that failed for no connection checks it
   *  before the card says "You're offline" (else it's the plain failure); a score that lands reports online.
   *  Default: no check (tests keep the code they're given). */
  net?: { confirmOffline: () => Promise<boolean>; reportOnline: () => void };
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
  /** "Which one is you?" (02 S23): the person he tapped; everyone else is covered in what's sent. */
  person?: PersonBox;
}

export type StartOutcome =
  /** 'error': something threw mid-check (prep, a write); the row, if any, is failed with Try again, nothing counted. */
  | { outcome: 'scored' | 'failed' | 'notScored' | 'error'; checkId: string }
  /** Read; the one quick tap is waiting (nothing counted yet). */
  | { outcome: 'asking'; checkId: string }
  /** The free check (and its re-check) is used (02 D19 S17, #280): the photo is kept and held, nothing read or counted;
   *  the Limit card is in the thread. After 4 am he's asked "Ready to score last night's photo?" (offerHeld); only his
   *  "Score it" sends it (scoreHeldNow, ruling 27). */
  | { outcome: 'held'; checkId: string }
  /** 'busy': another check is still being read (one at a time); 'error': it threw before a card was posted. */
  /** 'noConsent': "Score my fits" is off (Y7) or he never agreed; nothing was prepped, sent or counted. */
  | { outcome: 'limit' | 'unknownPhoto' | 'notImplemented' | 'noParent' | 'busy' | 'error' | 'noConsent' }
  /** 02 S3: nothing was sent and nothing counts. */
  | { outcome: 'photoProblem'; reason: 'noPerson' | 'multiplePeople' | 'couldNotFrame' }
  /** 02 S23: two people of comparable size; the "Which one is you?" card is in the thread. Nothing sent or counted. */
  | { outcome: 'whichOne'; messageId: string };

export interface CorrectionDraft {
  garmentIndex: number;
  field: keyof Garment & string;
  value: Garment[keyof Garment];
}

type Profile = { styles: Styles; boldness: string | null };
/** One check in the slot: its row once posted, and whether the slot's cap already gave it up (freeSlot). */
type CheckCtx = { checkId: string | null; abandoned: boolean };

/** What a row is scored with: its occasion and one style, his boldness (#61), and its stored second look (#199). The
 *  one builder for both the card (evaluateCheck) and the one quick tap (askQuestion), so the tap's scores are the card's. */
export function lensInput(occasion: OccasionKey, style: StyleKey | null, p: Profile, look?: StoredSecondLook | null) {
  return { occasion, styles: stylesFor(style, p.styles), boldness: p.boldness, secondLook: lookInput(look) };
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
  /** The one check (start or Try again) in flight: a second waits its turn by being refused ('busy'). */
  let running: Promise<unknown> | null = null;
  /** cancel() arrived before the in-flight check reached its read: that read is aborted as it starts. */
  let cancelPending = false;
  /** "Which one is you?" questions he just answered (a double tap starts one check). */
  const picking = new Set<string>();

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

  /** What rescore would score, without saving: the one evaluation both rescore and the "Not quite right?" preview
   *  run, so the preview's number is the saved one (#276). */
  const evaluateRow = async (row: FitCheckRow, reading: Reading, patch: Partial<FitCheckRow> = {}) => {
    const p = await profile();
    const occasion = patch.occasion ?? row.occasion;
    const details = { ...row.details, ...(patch.details ?? {}) };
    const style = patch.style !== undefined ? patch.style : row.style;
    const ev = evaluateCheck({
      reading, ...lensInput(occasion, style, p, details.secondLook), closet: await closetFor(row), firstCheck: row.isFirstCheck,
      hiddenFixTargets: details.hiddenFixTargets ?? [], warm: await warmFor(row), engine: engineOf(row),
      goingFor: details.goingFor ? details.goingFor.style : undefined,
    });
    return { ev, details };
  };

  /** Re-scores a row from a (possibly new) reading, keeping its closet summary and finish row. */
  const rescore = async (row: FitCheckRow, reading: Reading, patch: Partial<FitCheckRow> = {}) => {
    const { ev, details } = await evaluateRow(row, reading, patch);
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
    const opts = scoreOptions(lensInput(parent.occasion, parent.style, await profile(), parent.details.secondLook));
    const seen = await readingOf(row);
    const engine = engineOf(parent);
    const look = row.details.secondLook;
    const caught = new Set(seen ? (outcomeFor(engine, first, parent.fixes, seen, opts, look)?.doneFixes ?? []).map((f) => f.target) : []);
    const closet = await closetFor(parent);
    let reading: Reading | null = first;
    for (const f of parent.fixes.filter((x) => !targets || targets.includes(x.target) || caught.has(x.target))) {
      reading = reading ? (isPartsFix(f) ? applyPartsFix(reading, f, { closet }) : applyFix(reading, f, { closet, occasion: parent.occasion })) : null;
    }
    if (!reading) return null;
    return { row, parent, reading, outcome: outcomeFor(engine, first, parent.fixes, reading, opts, look) };
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
    if (!cached) await deps.quota.consumeCheck(scored.details.chargeDay ?? row.dayKey);
    if (!cached) deps.net?.reportOnline();
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
    const tapOpts = scoreOptions(lensInput(row.occasion, row.style, await profile(), row.details.secondLook));
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

  /** The check a re-check's photo already belongs to (#219): its first check's own photo, else any check that day with
   *  the same image hash and a reading. Same photo, same reading, same score. */
  async function samePhotoAs(row: FitCheckRow, parent: FitCheckRow): Promise<FitCheckRow | null> {
    if (!row.imageHash) return null;
    if (parent.imageHash === row.imageHash && parent.readingId) return parent;
    return (await store.fitChecks.all())
      .filter((c) => c.id !== row.id && c.imageHash === row.imageHash && c.dayKey === row.dayKey && c.status === 'scored' && c.readingId)
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  }

  /** A re-check of a photo already scored today: no read, its reading reused (so the score is the same), nothing
   *  counted (the re-check stays open, the closet gets no new sighting), and the card says it's the same photo. */
  async function finalizeSamePhoto(row: FitCheckRow, parent: FitCheckRow, match: FitCheckRow): Promise<FitCheckRow> {
    const ms = deps.timers().cacheHitMs;
    if (ms > 0) await deps.scheduler.sleep(ms);
    const reading = (await store.readings.get(match.readingId!))?.reading;
    if (!reading) return row;
    // ...and its second look (#199), so nothing about the score can move.
    const sl = copiedLook(match);
    const base = (await patchRow(row.id, { readingId: match.readingId, ...(sl !== undefined ? { details: { ...row.details, secondLook: sl } } : {}) }))!;
    const { row: scored } = await rescore(base, reading);
    const before = parent.score ?? scored.score ?? 0;
    const now = scored.score ?? before;
    await patchRow(row.id, {
      details: {
        ...scored.details,
        recheck: {
          parentScore: before, delta: now - before, rawDelta: (scored.rawScore ?? 0) - (parent.rawScore ?? 0), notes: [], doneFixes: [],
          newProblems: [], notSeen: false, samePhoto: { checkId: match.id },
        },
      },
    });
    return (await store.fitChecks.get(row.id)) ?? scored;
  }

  async function finalizeRecheck(
    row: FitCheckRow, parent: FitCheckRow, next: Reading, image: PreparedImage, model?: string, promptVersion?: string, latencyMs = 0,
    ownLook: StoredSecondLook | null = null,
  ) {
    const parentReading = await readingOf(parent);
    if (!parentReading) throw new Error(`re-check parent ${parent.id} has no reading`);
    const opts = scoreOptions(lensInput(parent.occasion, parent.style, await profile(), parent.details.secondLook));
    // The re-check's second look, anchored to the first check's (#199): only the arms the first check had.
    const look = anchorRecheckLook(ownLook, parent.details.secondLook, parent.id);
    const raw = await insertReading(next, 'recheckRaw', image.sha256, null, latencyMs, model, promptVersion);
    // His answer to the one quick tap holds on the re-check (a second misread can't undo it), unless a fix
    // replaces that whole piece. Re-checks never ask.
    const tap = parent.details.tap;
    const targets = cardFixTargets(parent.fixes);
    const carried = tap?.answer ? carryTapAnswer(parentReading, tap, next, targets) : next;
    // The anchored merge is engine-free except its "new problem" test, which still asks v4.1's rules (#209).
    const { merged, notes } = recheckMerge(parentReading, carried, targets, opts);
    const mergedRow = await insertReading(merged, 'recheckMerged', image.sha256, parent.readingId);
    const outcome = outcomeFor(engineOf(parent), parentReading, parent.fixes, merged, opts, look);
    await patchRow(row.id, { readingId: mergedRow.id });
    const fresh = (await store.fitChecks.get(row.id))!;
    const { row: scored } = await rescore(fresh, merged, {
      details: {
        ...(hasLook(parent.details.secondLook) ? { secondLook: look } : {}),
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

  /** A snap finishes a partial check (02 D11): a top-only check takes the snap's pants and shoes and becomes a full
   *  body (mergeBottomSnap, #313); a shoes-only check takes its shoes (mergeShoeSnap). */
  async function finalizeSnap(parent: FitCheckRow, snap: Reading, image: PreparedImage, part: 'bottom' | 'shoes') {
    const parentReading = await readingOf(parent);
    if (!parentReading) return parent;
    const snapRow = await insertReading(snap, 'lower', image.sha256, null);
    const merged = part === 'bottom' ? mergeBottomSnap(parentReading, snap) : mergeShoeSnap(parentReading, snap);
    const mergedRow = await insertReading(merged, 'snapMerged', parent.imageHash, parent.readingId);
    const { row } = await rescore(parent, merged, { readingId: mergedRow.id, snapState: 'snapped', details: { ...parent.details, finish: null } });
    // The snapped pieces join the closet (the pants and shoes, or the shoes only), linked to the first check.
    await closet.afterSnap(parent.id, snapRow.id, image, part === 'bottom' ? 'bottomSnap' : 'shoeSnap');
    return (await store.fitChecks.get(parent.id)) ?? row;
  }

  /** Streams one read into the session, with the ruling 19 timers. `withLook`: also run the second look (#199) next
   *  to it; `secondLook` in the result is then what the check stores (null = nothing back in time), else undefined. */
  async function runRead(
    checkId: string, image: PreparedImage, kind: ReadKind, mode: CheckMode, occasion: OccasionKey,
    look?: { style: StyleKey | null; source: GoingForSource; bothFromCard?: boolean }, withLook = false,
  ) {
    attempt += 1;
    const my = attempt;
    dispatch({ t: 'start', checkId, mode, occasion, attempt: my, ...(look ? { look } : {}) });
    const abort = new AbortController();
    if (cancelPending) {
      cancelPending = false;
      abort.abort();
    }
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
    // The second look starts with the read, in parallel (#199). It can never fail or hold up the check: a throw here
    // just means no second look.
    const lookAbort = new AbortController();
    if (abort.signal.aborted) lookAbort.abort();
    else abort.signal.addEventListener('abort', () => lookAbort.abort(), { once: true });
    let lookCall: SecondLookCall | null = null;
    if (withLook) {
      try {
        lookCall = deps.source.secondLook?.(image, kind, { signal: lookAbort.signal }) ?? null;
      } catch (e: unknown) {
        console.log('[look] could not start', e);
      }
    }
    // The read is stepped by hand so its abort (the 14 s timer, cancel) always ends the wait, even when the source
    // ignores the signal (a stalled stream that never sees it): a read that never settles would hold the one-check
    // slot, and every later photo and re-check would be refused as "busy" until the app restarts (Oct 14).
    const stopped = new Promise<'stopped'>((resolve) => {
      if (abort.signal.aborted) resolve('stopped');
      else abort.signal.addEventListener('abort', () => resolve('stopped'), { once: true });
    });
    const work = (async () => {
      const it = deps.source.read(image, kind, { signal: abort.signal })[Symbol.asyncIterator]();
      for (;;) {
        const step = await Promise.race([it.next(), stopped]);
        if (step === 'stopped') {
          // Ask the source to stop too, without waiting for it (a stuck one never answers).
          try {
            void Promise.resolve(it.return?.()).catch(() => {});
          } catch {
            // nothing more to stop
          }
          break;
        }
        if (step.done) break;
        const e = step.value;
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
    const got = reading as Reading | null; // set inside the loop above
    if (timedOut || abort.signal.aborted || !got) lookAbort.abort();
    if (timedOut) {
      console.log(`[check] the read took longer than ${Math.round(cfg.abortMs / 1000)} s: stopped (nothing counted)`);
      return { reading: null, fail: 'timeout' as FailCode, attempt: my, model, promptVersion, latencyMs };
    }
    if (abort.signal.aborted) return { reading: null, fail: null, attempt: my, cancelled: true, model, promptVersion, latencyMs };
    // The reading is in: each look arm gets the rest of the grace, then the card is scored with what came back.
    let secondLook: StoredSecondLook | null | undefined;
    if (lookCall && got) {
      const settled = await settleSecondLook(lookCall, deps.timers().lookGraceMs ?? LOOK_GRACE_MS, deps.scheduler);
      lookAbort.abort();
      console.log(settledLine(settled));
      secondLook = settled.look;
    }
    return { reading: got, fail: fail as FailCode | null, attempt: my, model, promptVersion, latencyMs, secondLook };
  }

  async function failRow(checkId: string, code: FailCode, attemptNo?: number) {
    if (code === 'offline' && deps.net && !(await deps.net.confirmOffline().catch(() => true))) code = 'ai';
    const row = await store.fitChecks.get(checkId);
    if (row) await patchRow(checkId, { status: 'failed', details: { ...row.details, failCode: code } });
    dispatch({ t: 'end', attempt: attemptNo });
  }

  /** One check at a time, and nothing it throws is lost: the row (if one was posted) becomes a failed check with Try
   *  again, the reading card ends, and the caller gets 'error' (its toast says it didn't count). */
  async function exclusive(run: (ctx: CheckCtx) => Promise<StartOutcome>): Promise<StartOutcome> {
    if (running) return { outcome: 'busy' };
    const ctx: CheckCtx = { checkId: null, abandoned: false };
    const job = (async (): Promise<StartOutcome> => {
      try {
        return await run(ctx);
      } catch (e: unknown) {
        console.error('[check] failed with an error', e);
        const id = ctx.checkId;
        if (id) {
          try {
            const row = await store.fitChecks.get(id);
            if (row?.status === 'scoring') await patchRow(id, { status: 'failed', details: { ...row.details, failCode: 'ai' } });
          } catch (e2: unknown) {
            console.error('[check] could not mark the check failed', e2);
          }
        }
        // A check whose slot was already freed (freeSlot) leaves the reading card of the next one alone.
        if (!ctx.abandoned) dispatch({ t: 'end' });
        return id ? { outcome: 'error', checkId: id } : { outcome: 'error' };
      }
    })();
    running = job;
    // The cap (TimerConfig.slotMs): a finished check always frees the slot; one that hangs frees it here.
    const cfg = deps.timers();
    const capMs = cfg.slotMs ?? SLOT_MS;
    let cap: unknown = null;
    const capped = cfg.enabled && capMs > 0
      ? new Promise<StartOutcome>((resolve) => {
          cap = deps.scheduler.setTimer(() => resolve(freeSlot(job, ctx, capMs)), capMs);
        })
      : null;
    try {
      return await (capped ? Promise.race([job, capped]) : job);
    } finally {
      if (cap !== null) deps.scheduler.clearTimer(cap);
      if (running === job) {
        running = null;
        cancelPending = false;
      }
    }
  }

  /** A check that held the slot past its cap: stop its read, free the slot, end the reading card, and fail its row
   *  (Try again; nothing counted) if it never got a score. Whatever it still finishes later lands on its own row. */
  async function freeSlot(job: Promise<StartOutcome>, ctx: CheckCtx, capMs: number): Promise<StartOutcome> {
    console.log(`[check] still not finished after ${Math.round(capMs / 1000)} s: freed the slot for the next photo`);
    ctx.abandoned = true;
    current?.abort.abort();
    if (running === job) {
      running = null;
      cancelPending = false;
    }
    const id = ctx.checkId;
    if (state.kind === 'reading' && (!id || state.checkId === id)) dispatch({ t: 'end' });
    if (!id) return { outcome: 'error' };
    const row = await store.fitChecks.get(id).catch(() => null);
    if (row && row.status !== 'scoring') return outcomeOf(row); // its score is in; only a later step hung
    // Queued behind the closet's writes (patchRow), so it isn't awaited: the slot is already free.
    void patchRow(id, { status: 'failed', details: { ...(row?.details ?? {}), failCode: 'timeout' } })
      .catch((e: unknown) => console.error('[check] could not mark the check failed', e));
    return { outcome: 'failed', checkId: id };
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

  /** "Try another photo" after a re-check that didn't see the change doesn't use another re-check (02 "Change not
   *  seen"), once: every try is a paid read. True when the only re-check so far missed the change. */
  async function triesAfterNotSeen(parentId: string): Promise<boolean> {
    const kids = (await store.fitChecks.all()).filter((c) => c.parentId === parentId && c.status === 'scored');
    return kids.length === 1 && kids[0]!.details.recheck?.notSeen === true;
  }

  function start(req: CheckRequest): Promise<StartOutcome> {
    return exclusive((ctx) => startInner(req, ctx));
  }

  async function startInner(req: CheckRequest, ctx: CheckCtx): Promise<StartOutcome> {
    const now = clock.nowMs();
    const parent = req.parentCheckId ? await store.fitChecks.get(req.parentCheckId) : null;
    if ((req.mode === 'recheck' || req.mode === 'shoeSnap') && !parent) return { outcome: 'noParent' };
    // His own photo is never prepped without his consent (it's read and sent right after): checked first, every time.
    if (req.photoUri && deps.consent && !(await deps.consent())) return { outcome: 'noConsent' };
    // Over the daily limit: a free user's photo is kept and held for tomorrow (S17), never read; Pro's cap is a plain no.
    const hold = req.mode === 'check' && !(await deps.quota.canStartCheck());
    if (hold && (await deps.quota.snapshot()).pro) return { outcome: 'limit' };
    // One re-check per check, while its window is open (05 §3.1, ruling 22): each one is a paid read.
    if (req.mode === 'recheck' && parent && !isRecheckOpen(parent, now, clock) && !(now < recheckDeadline(parent, clock) && (await triesAfterNotSeen(parent.id)))) return { outcome: 'limit' };
    // A new photo replaces a "Which one is you?" still waiting (never its own photo, which is being prepped now).
    if (req.photoUri && !req.person) await dropWhichOne(store, (uri) => uri !== req.photoUri && deps.discardPhoto?.(uri), { onlyOpen: true });
    const prep = await deps.prep.prepare(
      req.photoUri
        ? { kind: 'file', uri: req.photoUri, ...(req.person ? { person: req.person } : {}), ...(req.mode === 'shoeSnap' ? { snap: true } : {}) }
        : { kind: 'demo', photoId: req.photoId ?? '' },
    );
    // Two people of comparable size (02 S23): ask which one is him; nothing is sent until he taps.
    if (prep.status === 'multiplePeople' && prep.people && prep.people.length >= 2 && req.photoUri && !req.person && !ctx.abandoned) {
      const payload: WhichOnePayload = {
        question: 'whichOne', state: 'open', photoUri: req.photoUri, aspect: prep.aspect ?? null, people: prep.people, mode: req.mode,
        parentCheckId: req.parentCheckId ?? null, ...(req.occasion ? { occasion: req.occasion } : {}), ...(req.style !== undefined ? { style: req.style } : {}),
      };
      const m = await message({ createdAt: now, role: 'stylist', kind: 'card', cardType: 'question', payload: payload as unknown as Record<string, unknown> });
      return { outcome: 'whichOne', messageId: m.id };
    }
    if (prep.status === 'noPerson' || prep.status === 'multiplePeople' || prep.status === 'couldNotFrame') return { outcome: 'photoProblem', reason: prep.status };
    if (prep.status !== 'ok') return { outcome: prep.status === 'unknownPhoto' ? 'unknownPhoto' : 'notImplemented' };
    // Prep outlived the slot's cap: the slot went to a newer photo, so this one posts nothing.
    if (ctx.abandoned) return { outcome: 'error' };
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
      const part = snapPart(parent);
      await message({ createdAt: now, role: 'user', kind: 'photo', fitCheckId: parent.id, payload: { ...photoPayload, snap: true, ...(part === 'bottom' ? { snapPart: 'bottom' } : {}) } });
      const r = await runRead(parent.id, image, part === 'bottom' ? 'bottomSnap' : 'shoeSnap', 'shoeSnap', occasion);
      dispatch({ t: 'end', attempt: r.attempt });
      if (!r.reading) return { outcome: 'failed', checkId: parent.id };
      await finalizeSnap(parent, r.reading, image, part);
      return { outcome: 'scored', checkId: parent.id };
    }

    const checkId = req.checkId ?? deps.ids('FC');
    if (hold) return holdPhoto(checkId, now, image, photoPayload, occasion, style, going);
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
    ctx.checkId = checkId;
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
        const others = (await store.fitChecks.all()).filter((c) => c.id !== checkId && c.imageHash === image.sha256 && !c.parentId);
        const free = others.some((c) => c.status === 'scored');
        // ...and the second look the photo was scored with (#199): never asked again (none then = none now).
        const prior = others.filter((c) => c.readingId).sort((a, b) => b.createdAt - a.createdAt)[0];
        const sl = prior ? copiedLook(prior) : undefined;
        const base = sl !== undefined ? (await patchRow(row.id, { details: { ...row.details, secondLook: sl } }))! : row;
        // Scored before without a question (none qualified, or his closet agreed): score it the same way again, so
        // a closet that changed since can't make the same photo ask, or score, differently (#126).
        const done = answered ? await finalizeCheck(base, answered.reading, answered, free)
          : free ? await finalizeCheck(base, cached.reading, cached, free)
          : await afterRead(base, cached.reading, cached, free);
        return outcomeOf(done);
      }
    }
    // A re-check of the same photo (#219): the reading is reused, never re-read, so the score can't move by itself.
    if (req.mode === 'recheck' && parent) {
      const match = await samePhotoAs(row, parent);
      if (match) return outcomeOf(await finalizeSamePhoto(row, parent, match));
    }

    // The second look (#199): on every new parts check; on a re-check only when its first check had one.
    const withLook = req.mode === 'recheck' && parent ? hasLook(parent.details.secondLook) : engineOf(row) === 'parts';
    const r = await runRead(checkId, image, req.mode === 'recheck' ? 'recheck' : 'full', req.mode, occasion, going ?? undefined, withLook);
    if ('cancelled' in r && r.cancelled) {
      // Stopped (a screen change, a demo reset): the card shows Try again rather than nothing.
      await failRow(checkId, 'ai', r.attempt);
      return { outcome: 'failed', checkId };
    }
    if (!r.reading) {
      await failRow(checkId, r.fail ?? 'ai', r.attempt);
      return { outcome: 'failed', checkId };
    }
    // The occasion he tapped while it read (ignored for re-checks), and the look (#215).
    const live = state.kind === 'reading' && state.checkId === checkId ? state : null;
    const chosen = live ? live.occasion : occasion;
    if (chosen !== occasion) await patchRow(checkId, { occasion: chosen });
    if (going && live?.lookTouched) await saveLookAnswer(checkId, live.look, live.lookOther);
    if (req.mode !== 'recheck') await storeLook(checkId, r.secondLook);
    dispatch({ t: 'scored', attempt: r.attempt });
    const fresh = (await store.fitChecks.get(checkId))!;
    let done: FitCheckRow;
    if (req.mode === 'recheck' && parent) {
      done = await finalizeRecheck(fresh, parent, r.reading, image, r.model, r.promptVersion, r.latencyMs, r.secondLook ?? null);
    } else {
      const readingRow = await insertReading(r.reading, 'full', image.sha256, null, r.latencyMs, r.model, r.promptVersion);
      done = await afterRead(fresh, r.reading, readingRow, false);
    }
    dispatch({ t: 'end', attempt: r.attempt });
    return outcomeOf(done);
  }

  /** S17: his photo is kept on the phone (prep made his copy and the face-hidden send copy; nothing left the phone) and
   *  held: the photo in the thread and the Limit card under it. Nothing is read or counted. */
  async function holdPhoto(
    checkId: string, now: number, image: PreparedImage, photoPayload: Record<string, unknown>, occasion: OccasionKey,
    style: StyleKey | null, going: GoingForState | null,
  ): Promise<StartOutcome> {
    const row = emptyRow({
      id: checkId, createdAt: now, dayKey: dayKey(now, clock.offset), occasion, style, demoPhotoId: image.photoId, imageHash: image.sha256,
      status: 'held', photoFile: image.keptUri ?? null, thumbFile: image.thumbUri ?? null,
      details: { ...(going ? { goingFor: going } : {}), held: { saved: false, takenAt: now } },
    });
    await store.fitChecks.put(row);
    await message({ createdAt: now, role: 'user', kind: 'photo', fitCheckId: checkId, payload: photoPayload });
    await message({ createdAt: now + 1, role: 'stylist', kind: 'card', cardType: 'held', fitCheckId: checkId });
    return { outcome: 'held', checkId };
  }

  /** "Score it" on a held photo (scoreHeldNow): scored like a new check made now, on today's free check. The row, its
   *  photo and its card move to now, so the score lands in today's thread (the card becomes the fit-check card) and the
   *  "Ready to score" question goes; when he took it stays in details.held.takenAt. */
  async function scoreHeldInner(checkId: string, ctx: CheckCtx): Promise<StartOutcome> {
    const row = await store.fitChecks.get(checkId);
    if (!row || row.status !== 'held') return { outcome: 'noParent' };
    if (!row.demoPhotoId && deps.consent && !(await deps.consent())) return { outcome: 'noConsent' };
    if (!(await deps.quota.canStartCheck())) return { outcome: 'limit' };
    // A check waiting on the one quick tap hasn't counted yet: scoring this too could go past what today allows.
    if ((await store.fitChecks.all()).some((c) => c.id !== checkId && c.status === 'asking')) return { outcome: 'busy' };
    const prep = await deps.prep.prepare(
      row.demoPhotoId ? { kind: 'demo', photoId: row.demoPhotoId } : { kind: 'retry', sha256: row.imageHash, keptUri: row.photoFile, thumbUri: row.thumbFile },
    );
    if (ctx.abandoned) return { outcome: 'error' };
    const now = clock.nowMs();
    const priorChecks = (await store.fitChecks.all()).filter((c) => c.id !== checkId && !c.parentId && c.status === 'scored');
    const held = { ...(row.details.held ?? { saved: false, takenAt: row.createdAt }), scoredAt: now };
    const moved = await patchRow(checkId, {
      status: 'scoring', createdAt: now, dayKey: dayKey(now, clock.offset), isFirstCheck: priorChecks.length === 0, details: { ...row.details, held },
    });
    for (const m of (await store.chat.all()).filter((x) => x.fitCheckId === checkId)) {
      if (m.payload.ready === true) await store.chat.delete(m.id);
      else await store.chat.patch(m.id, m.kind === 'card' ? { createdAt: now + 1, cardType: 'fitCheck' } : { createdAt: now });
    }
    ctx.checkId = checkId;
    if (prep.status !== 'ok') {
      // Its face-hidden copy is gone (iOS cleared Caches): the card says it couldn't score it; his photo stays.
      await patchRow(checkId, { status: 'failed', details: { ...moved!.details, failCode: 'ai' } });
      return { outcome: 'failed', checkId };
    }
    images.set(checkId, prep.image);
    const gf = moved!.details.goingFor;
    const r = await runRead(checkId, prep.image, 'full', 'check', moved!.occasion, gf ? { ...gf } : undefined, engineOf(moved!) === 'parts');
    if (!r.reading) {
      await failRow(checkId, r.fail ?? 'ai', r.attempt);
      return { outcome: 'failed', checkId };
    }
    if (gf && state.kind === 'reading' && state.checkId === checkId && state.lookTouched) await saveLookAnswer(checkId, state.look, state.lookOther);
    await storeLook(checkId, r.secondLook);
    dispatch({ t: 'scored', attempt: r.attempt });
    const fresh = (await store.fitChecks.get(checkId))!;
    const done = await afterRead(fresh, r.reading, await insertReading(r.reading, 'full', prep.image.sha256, null, r.latencyMs, r.model, r.promptVersion), false);
    dispatch({ t: 'end', attempt: r.attempt });
    return outcomeOf(done);
  }

  /** The "Ready to score" run in flight: a launch and a foreground at once post one question. */
  let heldOffer: Promise<string | null> | null = null;
  /** Held photos whose "Score it" is running: a double tap scores once. */
  const scoringHeld = new Set<string>();

  /** S19 "Try again": re-reads the same photo; nothing was counted the first time. It's a new read, so it uses
   *  today's check (or the first check's re-check) like any other, and its score is charged to today. */
  async function retryInner(checkId: string, ctx: CheckCtx): Promise<StartOutcome> {
    const row = await store.fitChecks.get(checkId);
    if (!row || row.status !== 'failed' || (!row.demoPhotoId && !row.photoFile)) return { outcome: 'noParent' };
    if (!row.demoPhotoId && deps.consent && !(await deps.consent())) return { outcome: 'noConsent' };
    const now = clock.nowMs();
    const parent = row.parentId ? await store.fitChecks.get(row.parentId) : null;
    if (row.parentId && !parent) return { outcome: 'noParent' };
    if (parent ? !isRecheckOpen(parent, now, clock) : !(await deps.quota.canStartCheck())) return { outcome: 'limit' };
    // The photo first: if its copy is gone the row stays failed, so the card stays on screen.
    const prep = await deps.prep.prepare(
      row.demoPhotoId ? { kind: 'demo', photoId: row.demoPhotoId } : { kind: 'retry', sha256: row.imageHash, keptUri: row.photoFile, thumbUri: row.thumbFile },
    );
    if (prep.status !== 'ok') return { outcome: 'unknownPhoto' };
    if (ctx.abandoned) return { outcome: 'error' };
    const today = dayKey(now, clock.offset);
    const details = { ...row.details, failCode: undefined, ...(row.dayKey !== today ? { chargeDay: today } : {}) };
    await patchRow(checkId, { status: 'scoring', details });
    ctx.checkId = checkId;
    images.set(checkId, prep.image);
    const gf = !parent ? row.details.goingFor : undefined;
    const withLook = parent ? hasLook(parent.details.secondLook) : engineOf(row) === 'parts';
    const r = await runRead(checkId, prep.image, parent ? 'recheck' : 'full', parent ? 'recheck' : 'check', row.occasion, gf ? { ...gf } : undefined, withLook);
    if (!r.reading) {
      await failRow(checkId, r.fail ?? 'ai', r.attempt);
      return { outcome: 'failed', checkId };
    }
    if (gf && state.kind === 'reading' && state.checkId === checkId && state.lookTouched) await saveLookAnswer(checkId, state.look, state.lookOther);
    if (!parent) await storeLook(checkId, r.secondLook);
    dispatch({ t: 'scored', attempt: r.attempt });
    const fresh = (await store.fitChecks.get(checkId))!;
    const done = parent
      ? await finalizeRecheck(fresh, parent, r.reading, prep.image, r.model, r.promptVersion, r.latencyMs, r.secondLook ?? null)
      : await afterRead(fresh, r.reading, await insertReading(r.reading, 'full', prep.image.sha256, null, r.latencyMs, r.model, r.promptVersion), false);
    dispatch({ t: 'end', attempt: r.attempt });
    return outcomeOf(done);
  }

  /** The second look this read came back with, on the row before it's scored or asks (#199). Undefined = it didn't run
   *  (nothing stored, so the check scores without, like every check before it). */
  async function storeLook(checkId: string, sl: StoredSecondLook | null | undefined) {
    if (sl === undefined) return;
    const row = await store.fitChecks.get(checkId);
    if (row) await patchRow(checkId, { details: { ...row.details, secondLook: sl } });
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
        reading, ...lensInput(row.occasion, style, p, row.details.secondLook), closet: await closetFor(row), firstCheck: row.isFirstCheck,
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
    /** "Which one is you?" (02 S23): he tapped `people[index]`. The check runs as the mode it was asked in (a re-check
     *  keeps its first check and its re-check rules), with everyone else covered in what's sent. The question goes once
     *  the check has started; a busy slot (another photo still reading) leaves it waiting. null when it isn't open. */
    async pickPerson(messageId: string, index: number): Promise<StartOutcome | null> {
      // Claimed before the first await, so a second tap can't slip in while the first reads the question.
      if (picking.has(messageId)) return null;
      picking.add(messageId);
      try {
        const m = await store.chat.get(messageId);
        const q = whichOneOf(m);
        const person = q?.people[index];
        if (!m || !q || q.state !== 'open' || !person) return null;
        await store.chat.patch(messageId, { payload: { ...m.payload, state: 'picked' } });
        const r = await start({
          mode: q.mode, ...(q.photoId ? { photoId: q.photoId } : { photoUri: q.photoUri, person }), ...(q.parentCheckId ? { parentCheckId: q.parentCheckId } : {}),
          ...(q.occasion ? { occasion: q.occasion } : {}), ...(q.style !== undefined ? { style: q.style } : {}),
        });
        if (r.outcome === 'busy') {
          await store.chat.patch(messageId, { payload: { ...m.payload, state: 'open' } });
          return r;
        }
        await store.chat.delete(messageId);
        // Photo prep deletes the photo once it's used; when it never got that far (the limit, can't frame him), now.
        if (!('checkId' in r) && !q.photoId) deps.discardPhoto?.(q.photoUri);
        return r;
      } finally {
        picking.delete(messageId);
      }
    },
    /** "Which one is you?" → Cancel: the question goes, its photo is deleted, nothing was sent or counted. */
    async dismissWhichOne(messageId: string): Promise<boolean> {
      const q = whichOneOf(await store.chat.get(messageId));
      if (!q || q.state !== 'open' || picking.has(messageId)) return false;
      await store.chat.delete(messageId);
      if (!q.photoId) deps.discardPhoto?.(q.photoUri);
      return true;
    },
    /** Stop the current read (screen changes, demo resets). */
    async cancel() {
      const c = current;
      if (c) c.abort.abort();
      else if (running) cancelPending = true; // still preparing: its read stops as it starts
      if (c) await c.done.catch(() => {});
      // Wait for the check itself to settle (its row marked), so a demo reset can't race its last writes.
      const job = running;
      if (job) await job.catch(() => {});
      dispatch({ t: 'end' });
    },
    /** S17h, at launch and on every return to the foreground (features/held/catchUp.ts): when today's check is free and
     *  a photo is held from an earlier day (any day for Pro), the stylist asks "Ready to score last night's photo?" with
     *  Score it / Not this one, once. Nothing is read or sent until he taps (ruling 27). One photo at a time, oldest
     *  first; a question he left on an earlier day moves to today (one per photo, never a second). Returns the check
     *  asked about, or null. */
    offerHeld(): Promise<string | null> {
      heldOffer ??= (async () => {
        const s = await deps.quota.snapshot();
        if (s.checksUsed >= s.checkLimit) return null;
        const all = await store.fitChecks.all();
        const due = all.filter((c) => c.status === 'held' && (s.pro || c.dayKey < s.dayKey)).sort((a, b) => a.createdAt - b.createdAt);
        if (due.some((c) => c.details.held?.offeredAt !== undefined && dayKey(c.details.held.offeredAt, clock.offset) === s.dayKey)) return null;
        const next = due[0];
        if (!next) return null;
        const now = clock.nowMs();
        const asked = (await store.chat.all()).filter((m) => m.fitCheckId === next.id && m.payload.ready === true);
        if (asked[0]) await store.chat.patch(asked[0].id, { createdAt: now });
        else await message({ createdAt: now, role: 'stylist', kind: 'card', cardType: 'held', fitCheckId: next.id, payload: { ready: true } });
        await patchRow(next.id, { details: { ...next.details, held: { ...(next.details.held ?? { saved: false, takenAt: next.createdAt }), offeredAt: now } } });
        return next.id;
      })().finally(() => {
        heldOffer = null;
      });
      return heldOffer;
    },
    /** What launch and every return to the foreground run for held photos (features/held/catchUp.ts). */
    onAppOpen(): Promise<unknown> {
      return api.offerHeld();
    },
    /** S17h "Score it": that held photo, read and scored once, on today's free check (refused past what today allows). */
    async scoreHeldNow(checkId: string): Promise<StartOutcome> {
      if (scoringHeld.has(checkId)) return { outcome: 'busy' };
      scoringHeld.add(checkId);
      try {
        return await exclusive((ctx) => scoreHeldInner(checkId, ctx));
      } finally {
        scoringHeld.delete(checkId);
      }
    },
    /** S17 "Save for tomorrow": the card becomes S17h. The photo is held either way. */
    async saveHeld(checkId: string) {
      const row = await store.fitChecks.get(checkId);
      if (!row || row.status !== 'held') return null;
      return patchRow(checkId, { details: { ...row.details, held: { ...(row.details.held ?? { takenAt: row.createdAt }), saved: true } } });
    },
    /** S17h "Don't score it" and "Not this one": the photo is deleted (it was never sent), with its card, its question
     *  and its row. Never scored, never asked about. */
    async dropHeld(checkId: string): Promise<boolean> {
      const row = await store.fitChecks.get(checkId);
      if (!row || row.status !== 'held') return false;
      for (const m of (await store.chat.all()).filter((x) => x.fitCheckId === checkId)) await store.chat.delete(m.id);
      await store.fitChecks.delete(checkId);
      // His files go, unless another check holds the same photo (same SHA, same files).
      const shared = (await store.fitChecks.all()).some((c) => c.imageHash === row.imageHash || (!!row.photoFile && c.photoFile === row.photoFile));
      if (!row.demoPhotoId && !shared) deps.deleteHeldFiles?.(row);
      return true;
    },
    /** S19 "Try again" (retryInner): one at a time with any other check, limited like a new read. */
    retry(checkId: string): Promise<StartOutcome> {
      return exclusive((ctx) => retryInner(checkId, ctx));
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
        warm: await warmFor(row), engine: engineOf(row), secondLook: lookInput(row.details.secondLook),
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
    /** "Not quite right?" live preview (S8): what Save would give, from the same evaluation saveCorrection and hideFix
     *  run (the check's own engine), so "before → after" and the next fix are the saved ones (#276). Saves nothing. */
    async previewCorrection(checkId: string, change: { draft?: CorrectionDraft | { garmentIndex: number; remove: true }; hideTarget?: string }) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading) return null;
      const d = change.draft;
      const next = !d ? reading : 'remove' in d ? removeGarment(reading, d.garmentIndex) : applyCorrection(reading, d.garmentIndex, d.field, d.value);
      const hidden = change.hideTarget ? Array.from(new Set([...(row.details.hiddenFixTargets ?? []), change.hideTarget])) : row.details.hiddenFixTargets ?? [];
      const { ev } = await evaluateRow(row, next, { details: { ...row.details, hiddenFixTargets: hidden } });
      return { before: row.score, after: ev.row.score ?? null, nextFix: ev.row.fixes[0] ?? null };
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
    /** Undo on that answer's toast: the question is open again (#323). */
    unanswerDuplicate(checkId: string, obsId: string) {
      return closet.unanswer(checkId, obsId);
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
    /** Every slot a re-check of this check reads again, top to toe: each piece any of the card's fixes touches
     *  (recheckMerge re-reads all of cardFixTargets, not just the first fix's). null when a fix touches every piece
     *  ("*.sleeve_end") or the card has no fix: the camera then says "what you changed". */
    async recheckSlots(checkId: string): Promise<RecheckSlot[] | null> {
      const row = await store.fitChecks.get(checkId);
      const cats = new Set(cardFixTargets(row?.fixes ?? []).map((x) => x.split('.')[0] ?? ''));
      if (cats.has('*')) return null;
      const slots = RECHECK_SLOTS.filter((c) => cats.has(c));
      return slots.length > 0 ? slots : null;
    },
    /** The one slot a re-check reads again, or null when it's several or none (the old chat line names one). */
    async recheckFocus(checkId: string): Promise<RecheckSlot | null> {
      const slots = await api.recheckSlots(checkId);
      return slots?.length === 1 ? slots[0]! : null;
    },
    /** The old chat line ("Overshirt on? Send it. I'll only re-read the layer.", 02 D10). Not posted since Oct 14: the
     *  camera carries it. Kept for older demo stories. */
    async postRecheckPrompt(checkId: string) {
      const row = await store.fitChecks.get(checkId);
      const reading = row && (await readingOf(row));
      if (!row || !reading) return null;
      const top = row.fixes[0];
      const held = top?.edits.some((e) => e.op === 'add_held') ? (reading.held_items ?? []).find((g) => g.category === 'outerwear') : undefined;
      const heldName = held ? garmentName(held) : '';
      const fixQuestion = held ? t('recheck.q.held', { held: heldName.charAt(0).toUpperCase() + heldName.slice(1) }) : t('recheck.q.generic');
      const cat = await api.recheckFocus(checkId);
      const slotKey = (cat ? `recheck.slot.${cat}` : 'recheck.slot.any') as
        'recheck.slot.outerwear' | 'recheck.slot.top' | 'recheck.slot.bottom' | 'recheck.slot.footwear' | 'recheck.slot.any';
      return message({ createdAt: clock.nowMs(), role: 'stylist', kind: 'text', text: t('recheck.prompt', { fixQuestion, slotWord: t(slotKey) }) });
    },
  };
  return api;
}

export type FitCheckService = ReturnType<typeof createFitCheckService>;

/** The pieces a re-check can name, top to toe (the camera lists them in this order). */
export const RECHECK_SLOTS = ['outerwear', 'top', 'bottom', 'footwear'] as const;
export type RecheckSlot = (typeof RECHECK_SLOTS)[number];
