// The closet write path (DECISIONS-LOG #91). After the score card shows, a separate closet call describes each
// piece (shade, details, logo text, shape); the identity engine (core closetPlan / reconcileReading) then decides
// per garment: the same piece he owns (link it, worn +1), a new one, or "not sure" (added as its own piece, flagged
// "maybe the same as" the candidate, and asked: a duplicate does less harm than a wrong merge). Every garment's
// sighting is stored with its link, so a later correction follows the link instead of re-matching.
//
// The score never depends on any of this: checks are scored before the closet is written, against the closet
// as it was (a check's own pieces are excluded from its fixes).
//
// Offline, failed or slower than 12 s: the closet is written from the v3 fields alone through the same engine
// (state 'fallback'); a late answer, or a one-time catch-up on the next foreground within 24 h, then enriches it
// (re-matches only if he hasn't touched S11 for that check).
import {
  closetPlan, fixTargets, identity, lessonsOfYes, profileFromClosetItem, SLOT_TO_CLOSET, type ClosetItem, type ConfirmedFields, type Garment, type KnownPiece, type Reading,
} from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type {
  ClosetAsk, ClosetFields, ClosetItemRow, ClosetLink, ClosetObservationRow, ClosetSummary, FitCheckRow, ObservationDecision, ObservationOrigin, ReadingRow,
} from '@/data/types';
import type { Clock } from '@/services/clock';
import type { Scheduler } from '@/services/scheduler';
import type { PreparedImage } from '@/services/readingSource/types';
import { buildStubs } from '@/services/closetSource/validate';
import type { ClosetKind, ClosetSource, StoredClosetReading } from '@/services/closetSource/types';
import type { GarmentMeasurer, Measured } from '@/services/measure/garments';
import { garmentHex } from '@/features/fitcheck/labels';
import { serial } from './checkWrites';
import { assignNames, baseName, isAutoNamed } from './itemName';
import { artOf, halfSeen, hexOfArt, isAwaitingAnswer, isHalfSeen, isLive, isOwned, knownPieces, observationOf, observationOfRow, profileOfItem, sightingsOf, storedProfiles } from './profile';

export const CLOSET_DEADLINE_MS = 12_000;
export const CATCH_UP_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface ClosetServiceDeps {
  store: KittedStore;
  clock: Clock;
  scheduler: Scheduler;
  ids: (prefix: string) => string;
  /** null: no closet call at all (the closet is written from the v3 fields, state 'fallback'). */
  source?: ClosetSource | null;
  /** How long S11 waits for the closet call before writing from the v3 fields. */
  deadlineMs?: number;
  catchUpWindowMs?: number;
  /** On-device measuring of each piece in his photo (#104): color, cut-out, quality. None: nothing measured. */
  measure?: GarmentMeasurer | null;
}

export type DuplicateAnswer = 'same' | 'new' | 'runnerUp';

const CLOSET_CATEGORIES: readonly string[] = ['top', 'outerwear', 'bottom', 'footwear'];
const CONFIRMABLE: readonly string[] = [
  'subcategory', 'color_family', 'pattern', 'logo', 'leg_shape', 'sleeve_length', 'lightness', 'shoe_profile', 'denim_wear',
];
const uniq = <T,>(xs: readonly T[]): T[] => [...new Set(xs)];

type FieldAliases = Readonly<Record<string, readonly string[]>> | null | undefined;
/** The values `next` has that `prev` didn't, per field (what one "Yes" taught). */
function addedAliases(prev: FieldAliases, next: FieldAliases): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [f, vals] of Object.entries(next ?? {})) {
    const fresh = vals.filter((v) => !(prev?.[f] ?? []).includes(v));
    if (fresh.length > 0) out[f] = [...fresh];
  }
  return out;
}
/** `cur` without what one answer added; a field left with fewer than 2 values teaches nothing and is dropped. */
function withoutAliases(cur: FieldAliases, added: FieldAliases): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [f, vals] of Object.entries(cur ?? {})) {
    const left = vals.filter((v) => !(added?.[f] ?? []).includes(v));
    if (left.length > 1) out[f] = left;
  }
  return out;
}
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function emptySummary(): ClosetSummary {
  return { matched: [], added: [], undone: [], links: [], asks: [] };
}
export function summaryOf(row: Pick<FitCheckRow, 'details'>): Required<Pick<ClosetSummary, 'matched' | 'added' | 'undone' | 'links' | 'asks'>> & ClosetSummary {
  const cs = row.details.closetSummary;
  return {
    ...emptySummary(), ...(cs ?? {}),
    matched: [...(cs?.matched ?? [])], added: [...(cs?.added ?? [])], undone: [...(cs?.undone ?? [])],
    links: [...(cs?.links ?? [])], asks: (cs?.asks ?? []).map((a) => ({ ...a })),
  };
}

/** Whole-piece fix targets ("outerwear", "*", "top.color_family") are changed pieces on a re-check; a field
 *  target ("bottom.hem": cuff them) is the same piece worn differently. */
export function changedCategories(targets: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const t of targets) {
    const [cat, field] = t.split('.');
    if (!cat) continue;
    if (field && !['color_family', 'pattern', 'subcategory'].includes(field)) continue;
    if (cat === '*') CLOSET_CATEGORIES.forEach((c) => out.add(c));
    else out.add(cat);
  }
  return out;
}

export function createClosetService(deps: ClosetServiceDeps) {
  const { store, clock, ids } = deps;
  const deadlineMs = deps.deadlineMs ?? CLOSET_DEADLINE_MS;
  const windowMs = deps.catchUpWindowMs ?? CATCH_UP_WINDOW_MS;
  const jobs = new Set<Promise<unknown>>();
  const attempted = new Set<string>();
  const track = <T,>(p: Promise<T>): Promise<T> => {
    jobs.add(p);
    void p.finally(() => jobs.delete(p)).catch(() => {});
    return p;
  };

  // ------------------------------------------------------------------ small store helpers (call inside serial)
  const readingOf = async (id: string | null): Promise<ReadingRow | null> => (id ? await store.readings.get(id) : null);

  async function saveSummary(checkId: string, cs: ClosetSummary) {
    const cur = await store.fitChecks.get(checkId);
    if (!cur) return null;
    return store.fitChecks.patch(checkId, { itemIds: uniq([...cs.matched, ...cs.added]), details: { ...cur.details, closetSummary: cs } });
  }

  function newObs(
    row: FitCheckRow, origin: ObservationOrigin, index: number, garment: Garment, fields: ClosetFields | null, decision: ObservationDecision,
    o: { itemId?: string; readingId?: string | null; closetReadingId?: string | null; userConfirmed?: ConfirmedFields | null; score?: number | null; candidates?: { id: string; score: number | null }[]; askItemId?: string | null; measured?: Measured | null } = {},
  ): ClosetObservationRow {
    const m = o.measured ?? null;
    return {
      id: ids('O'), itemId: o.itemId ?? '', fitCheckId: row.id, readingId: o.readingId ?? row.readingId, closetReadingId: o.closetReadingId ?? null,
      garmentIndex: index, origin, garment: clone(garment), closet: fields,
      sampledHex: m?.sampledHex ?? null, sampledL: m?.sampledL ?? null, cropFile: m?.cropFile ?? null, cropQuality: m?.cropQuality ?? null,
      decision, identityScore: o.score ?? null, candidates: o.candidates ?? [], askItemId: o.askItemId ?? null, answeredAt: null,
      userConfirmed: o.userConfirmed && Object.keys(o.userConfirmed).length > 0 ? o.userConfirmed : null, createdAt: clock.nowMs(), isDeleted: false,
    };
  }

  function newItem(row: FitCheckRow, g: Garment, obs: ClosetObservationRow, maybeSameAs: string | null): ClosetItemRow | null {
    const slot = typeof g.category === 'string' ? SLOT_TO_CLOSET[g.category] : undefined;
    if (!slot) return null;
    const now = clock.nowMs();
    const confirmedFields = Object.keys(obs.userConfirmed ?? {}).filter((f) => CONFIRMABLE.includes(f));
    const item: ClosetItemRow = {
      id: ids('C'), name: '', slot, garment: clone(g), confirmedFields, hex: garmentHex(g), photoFile: null, demoPhotoId: row.demoPhotoId,
      isPhotographed: true, source: 'fitCheck', starterId: null, wornCount: 1, lastWornAt: row.createdAt, addedAt: now, isDeleted: false,
      profile: { aliases: [], distinctFrom: [], confirmed: {}, autoName: true }, mergedInto: null, maybeSameAs, cropFile: null, cropScore: null,
      updatedAt: now,
    };
    item.art = artOf(item, [observationOfRow(obs)]);
    item.shade = item.art.shade;
    item.hex = hexOfArt(item.art, item.hex);
    item.name = baseName(item.garment, item.art);
    return item;
  }

  /** Re-derive what an item shows from its sightings (drift guard); the hex moves only when the look did. */
  async function refreshItem(itemId: string) {
    const item = await store.closet.get(itemId);
    if (!item) return;
    const sights = sightingsOf(itemId, await store.closetObs.all());
    const art = artOf(item, sights.map(observationOfRow));
    const before = item.art;
    const moved = !before || before.family !== art.family || before.shade !== art.shade;
    await store.closet.patch(itemId, {
      art, shade: art.shade, ...(moved && (item.source !== 'seed' || before) ? { hex: hexOfArt(art, item.hex) } : {}), updatedAt: clock.nowMs(),
    });
  }

  /** Every auto-named owned piece gets its current name (detail words only where two would clash). */
  async function renameAll() {
    const items = (await store.closet.all()).filter(isOwned);
    const names = assignNames(items);
    for (const it of items) {
      const n = names.get(it.id);
      if (!n) continue;
      const p = profileOfItem(it);
      if (n.name !== it.name || (p.nameDetail ?? null) !== n.nameDetail) {
        await store.closet.patch(it.id, { name: n.name, profile: { ...p, nameDetail: n.nameDetail } });
      }
    }
  }

  /** Closet-call fields per garment index of `garments` (stub i ↔ garment map[i]; a stub whose category moved is dropped). */
  function fieldsFor(garments: readonly Garment[], kind: ClosetKind, stored: StoredClosetReading | null): Map<number, ClosetFields> {
    const out = new Map<number, ClosetFields>();
    if (!stored) return out;
    const { stubs, map } = buildStubs(garments, kind);
    for (const e of stored.garments) {
      const now = stubs[e.i], then = stored.stubs[e.i];
      if (!now || !then || now.category !== then.category) continue;
      const { i: _i, ...f } = e;
      void _i;
      out.set(map[e.i]!, f);
    }
    return out;
  }

  /** What the tap answer (#85) told us about one garment of the check. A Skip learns nothing. */
  interface TapLesson { confirmed: ConfirmedFields | null; linkTo?: string; notItemIds?: string[] }
  function tapLessons(row: FitCheckRow): Map<number, TapLesson> {
    const m = new Map<number, TapLesson>();
    const tap = row.details.tap;
    if (!tap?.answer || tap.skipped) return m;
    const option = tap.options.find((o) => o.value === tap.answer);
    // The shoe tap ("Boots, sneakers or slides?") confirms the kind he named, not the subtype code picked inside it.
    if (tap.kind === 'shoes') {
      if (option?.group) m.set(tap.garmentIndex, { confirmed: { shoeKind: option.group } });
      return m;
    }
    // "Your grey work boots?" (#126): Yes is that piece (linked, no type claimed); No is "not that piece" (the No
    // value is only the read type, maybe "other").
    if (tap.kind === 'known') {
      if (tap.knownId && option?.answer === 'yes') m.set(tap.garmentIndex, { confirmed: null, linkTo: tap.knownId });
      else if (tap.knownId && option?.answer === 'no') m.set(tap.garmentIndex, { confirmed: null, notItemIds: [tap.knownId] });
      return m;
    }
    m.set(tap.garmentIndex, { confirmed: { subcategory: tap.answer } });
    return m;
  }

  // ------------------------------------------------------------------ the engine pass
  interface Piece {
    origin: ObservationOrigin; index: number; garment: Garment; fields: ClosetFields | null; confirmed: ConfirmedFields | null;
    /** Half seen in its reading (core halfSeen rules, #115); a low crop quality adds to it in matchPieces. */
    partial?: boolean;
    /** He said it's this piece ("Your grey work boots?" Yes): linked without the engine. */
    linkTo?: string;
    /** He said it's not these pieces (that question's No). */
    notItemIds?: string[];
  }

  /** Measures the worn pieces that have a closet box on this check's photo (#104); empty when it can't. */
  async function measurePieces(row: FitCheckRow, pieces: readonly Piece[]): Promise<Map<Piece, Measured>> {
    const out = new Map<Piece, Measured>();
    const measure = deps.measure;
    const boxed = pieces.filter((p) => p.origin === 'garment' && p.fields?.visible && p.fields.box.length === 4);
    if (!measure || boxed.length === 0) return out;
    const key = (p: Piece) => `${p.origin}-${p.index}`;
    // A mirror selfie's photo is the reflection: its cut-outs are flipped back to true view (#109).
    const mirrored = (await readingOf(row.readingId))?.reading.scene?.mirror_selfie === true;
    try {
      const got = await measure(
        { imageHash: row.imageHash, photoFile: row.photoFile, demoPhotoId: row.demoPhotoId, mirrored },
        boxed.map((p) => ({ key: key(p), category: String(p.garment.category), box: p.fields!.box })),
      );
      for (const p of boxed) {
        const m = got.get(key(p));
        if (m) out.set(p, m);
      }
    } catch (e) {
      console.log('[measure] failed', String(e));
    }
    return out;
  }

  /**
   * Runs the engine for `pieces` against his owned closet (minus `exclude`) and writes the result: sightings,
   * new items, worn counts, open questions. Returns the summary parts it produced.
   */
  async function matchPieces(
    row: FitCheckRow, allPieces: readonly Piece[], lighting: string | null, closetReadingId: string | null,
    o: { exclude?: ReadonlySet<string>; noWear?: ReadonlySet<string> } = {},
  ) {
    const owned = (await store.closet.all()).filter((c) => isOwned(c) && !o.exclude?.has(c.id));
    const obsAll = await store.closetObs.all();
    const measured = await measurePieces(row, allPieces);
    const out = { matched: [] as string[], added: [] as string[], links: [] as ClosetLink[], asks: [] as ClosetAsk[] };
    const touched = new Set<string>();
    // He already said which piece it is: link it, and keep that piece out of the engine's reach for this check.
    const linked = new Set<string>();
    const rest: Piece[] = [];
    for (const p of allPieces) {
      const target = p.linkTo ? owned.find((c) => c.id === p.linkTo && c.slot === SLOT_TO_CLOSET[String(p.garment.category)]) : undefined;
      if (!target || linked.has(target.id)) { rest.push(p); continue; }
      linked.add(target.id);
      const obs = newObs(row, p.origin, p.index, p.garment, p.fields, 'answeredSame', {
        readingId: row.readingId, closetReadingId, userConfirmed: p.confirmed, measured: measured.get(p) ?? null, itemId: target.id,
        candidates: [{ id: target.id, score: null }], askItemId: target.id,
      });
      obs.answeredAt = clock.nowMs();
      await store.closetObs.put(obs);
      if (!o.noWear?.has(target.id)) await store.closet.patch(target.id, { wornCount: target.wornCount + 1, lastWornAt: Math.max(target.lastWornAt ?? 0, row.createdAt) });
      touched.add(target.id);
      out.matched.push(target.id);
      out.links.push({ origin: p.origin, index: p.index, itemId: target.id, obsId: obs.id });
    }
    const pieces = rest;
    // A piece still waiting on his answer isn't matched as a piece of its own (#116): a later sighting of the same thing
    // joins that open question (below) instead of opening another one about the same piece.
    const awaiting = owned.filter((c) => isAwaitingAnswer(c, owned));
    const items = owned.filter((c) => !linked.has(c.id) && !awaiting.includes(c));
    const joined = new Set<string>();
    const reading: Reading = {
      scene: { lighting },
      garments: pieces.map((p) => observationOf(p.garment, p.fields, {
        lighting, userConfirmed: p.confirmed, sampledHex: measured.get(p)?.sampledHex, sampledL: measured.get(p)?.sampledL,
        partial: isHalfSeen(p, measured.get(p)), notItemIds: p.notItemIds,
      })),
    } as Reading;
    // Every piece is a worn garment for the engine (held pieces are matched the same way); index k = pieces[k].
    for (const g of reading.garments) if (g.certainty === 'unsure') g.certainty = 'likely';
    const plan = closetPlan(reading, items as ClosetItem[], storedProfiles(items, obsAll));
    for (const e of plan.entries) {
      const p = pieces[e.index];
      if (!p) continue;
      const base = { readingId: row.readingId, closetReadingId, userConfirmed: p.confirmed, score: e.score, measured: measured.get(p) ?? null };
      if (e.outcome === 'same' && e.itemId) {
        const obs = newObs(row, p.origin, p.index, p.garment, p.fields, 'same', { ...base, itemId: e.itemId, candidates: [{ id: e.itemId, score: e.score }] });
        await store.closetObs.put(obs);
        const item = (await store.closet.get(e.itemId))!;
        const confirmed = Object.keys(p.confirmed ?? {}).filter((f) => CONFIRMABLE.includes(f) && item.garment[f] === (p.confirmed as Record<string, unknown>)[f]);
        await store.closet.patch(e.itemId, {
          ...(o.noWear?.has(e.itemId) ? {} : { wornCount: item.wornCount + 1, lastWornAt: Math.max(item.lastWornAt ?? 0, row.createdAt) }),
          confirmedFields: uniq([...item.confirmedFields, ...confirmed]),
        });
        touched.add(e.itemId);
        out.matched.push(e.itemId);
        out.links.push({ origin: p.origin, index: p.index, itemId: e.itemId, obsId: obs.id });
        continue;
      }
      const ask = e.outcome === 'ask' && e.candidateId ? e.candidateId : null;
      const candidates = [
        ...(e.candidateId ? [{ id: e.candidateId, score: e.score }] : []),
        ...(e.runnerUpId ? [{ id: e.runnerUpId, score: null }] : []),
      ];
      const open = ask ? awaiting.find((f) => f.maybeSameAs === ask && f.slot === SLOT_TO_CLOSET[String(p.garment.category)] && !joined.has(f.id)) : undefined;
      if (open) {
        // Same question as one he hasn't answered yet: this sighting joins it; his one answer settles both.
        joined.add(open.id);
        const rider = newObs(row, p.origin, p.index, p.garment, p.fields, 'ask', { ...base, itemId: open.id, candidates, askItemId: ask });
        await store.closetObs.put(rider);
        if (!o.noWear?.has(open.id)) await store.closet.patch(open.id, { wornCount: open.wornCount + 1, lastWornAt: Math.max(open.lastWornAt ?? 0, row.createdAt) });
        touched.add(open.id);
        out.matched.push(open.id);
        out.links.push({ origin: p.origin, index: p.index, itemId: open.id, obsId: rider.id });
        continue;
      }
      const obs = newObs(row, p.origin, p.index, p.garment, p.fields, ask ? 'ask' : 'new', { ...base, candidates, askItemId: ask });
      const item = newItem(row, p.garment, obs, ask);
      if (!item) continue;
      obs.itemId = item.id;
      await store.closet.put(item);
      await store.closetObs.put(obs);
      out.added.push(item.id);
      out.links.push({ origin: p.origin, index: p.index, itemId: item.id, obsId: obs.id });
      if (ask) out.asks.push({ obsId: obs.id, itemId: item.id, candidateId: ask, ...(e.runnerUpId ? { runnerUpId: e.runnerUpId } : {}), answer: null });
    }
    for (const id of touched) await refreshItem(id);
    await renameAll();
    return out;
  }

  /** The pieces of a full check's reading the closet keeps (worn then held; not accessories, traditional or unsure). */
  function piecesOf(row: FitCheckRow, reading: Reading, stored: StoredClosetReading | null): Piece[] {
    const fields = fieldsFor(reading.garments, 'full', stored);
    const taps = tapLessons(row);
    const out: Piece[] = [];
    reading.garments.forEach((g, i) => {
      if (typeof g.category !== 'string' || !CLOSET_CATEGORIES.includes(g.category) || g.certainty === 'unsure') return;
      const t = taps.get(i);
      out.push({
        origin: 'garment', index: i, garment: g, fields: fields.get(i) ?? null, confirmed: t?.confirmed ?? null, partial: halfSeen(reading.garments, i),
        ...(t?.linkTo ? { linkTo: t.linkTo } : {}), ...(t?.notItemIds ? { notItemIds: t.notItemIds } : {}),
      });
    });
    (reading.held_items ?? []).forEach((g, i) => {
      if (typeof g.category !== 'string' || !CLOSET_CATEGORIES.includes(g.category) || g.certainty === 'unsure') return;
      out.push({ origin: 'held', index: i, garment: g, fields: null, confirmed: null });
    });
    return out;
  }

  // ------------------------------------------------------------------ writes per kind of check
  async function writeFull(checkId: string, stored: { row: ReadingRow; reading: StoredClosetReading } | null, state: 'done' | 'fallback') {
    const row = await store.fitChecks.get(checkId);
    if (!row) return;
    const prev = summaryOf(row);
    if (prev.state === 'done' || prev.state === 'fallback') return; // written already (a late answer enriches instead)
    const reading = (await readingOf(row.readingId))?.reading;
    if (!reading) return;
    const res = await matchPieces(row, piecesOf(row, reading, stored?.reading ?? null), reading.scene?.lighting ?? null, stored?.row.id ?? null);
    // A shoe snap can land while the closet call is still out: its link stays.
    const snaps = prev.links.filter((l) => l.origin === 'snap');
    const snapIds = new Set(snaps.map((l) => l.itemId));
    const cs: ClosetSummary = {
      matched: uniq([...res.matched, ...prev.matched.filter((id) => snapIds.has(id))]),
      added: uniq([...res.added, ...prev.added.filter((id) => snapIds.has(id))]),
      undone: prev.undone, links: [...res.links, ...snaps], asks: [...res.asks, ...prev.asks.filter((a) => snapIds.has(a.itemId))],
      state, startedAt: prev.startedAt ?? clock.nowMs(), touched: prev.touched ?? false,
    };
    await saveSummary(checkId, cs);
  }

  async function writeRecheck(recheckId: string, stored: { row: ReadingRow; reading: StoredClosetReading } | null, state: 'done' | 'fallback') {
    const row = await store.fitChecks.get(recheckId);
    const parent = row?.parentId ? await store.fitChecks.get(row.parentId) : null;
    if (!row || !parent) return;
    const prev = summaryOf(row);
    if (prev.state === 'done' || prev.state === 'fallback') return;
    const merged = (await readingOf(row.readingId))?.reading;
    const parentReading = (await readingOf(parent.readingId))?.reading;
    if (!merged) return;
    const fields = fieldsFor(merged.garments, 'recheck', stored?.reading ?? null);
    const changed = changedCategories(fixTargets(parent.fixes));
    const ps = summaryOf(parent);
    const used = new Set<string>();
    const sightings: ClosetLink[] = [];
    const changedPieces: Piece[] = [];
    const parentGarment = (l: ClosetLink) => (l.origin === 'held' ? parentReading?.held_items?.[l.index] : parentReading?.garments[l.index]);
    merged.garments.forEach((g, i) => {
      if (typeof g.category !== 'string' || !CLOSET_CATEGORIES.includes(g.category) || g.certainty === 'unsure') return;
      const piece: Piece = { origin: 'garment', index: i, garment: g, fields: fields.get(i) ?? null, confirmed: null, partial: halfSeen(merged.garments, i) };
      if (changed.has(g.category)) return void changedPieces.push(piece);
      // Unchanged: another sighting of the piece the first check linked (no extra wear: same outfit, same day).
      const link = ps.links.find((l) => !used.has(l.obsId) && l.origin !== 'snap' && parentGarment(l)?.category === g.category && parentGarment(l)?.subcategory === g.subcategory && !ps.undone.includes(l.itemId));
      if (!link) return void changedPieces.push(piece);
      used.add(link.obsId);
      sightings.push({ origin: 'garment', index: i, itemId: link.itemId, obsId: '' });
      void piece;
    });
    const links: ClosetLink[] = [];
    for (const s of sightings) {
      const g = merged.garments[s.index]!;
      const obs = newObs(row, 'garment', s.index, g, fields.get(s.index) ?? null, 'same', { itemId: s.itemId, closetReadingId: stored?.row.id ?? null });
      await store.closetObs.put(obs);
      links.push({ ...s, obsId: obs.id });
    }
    for (const s of sightings) await refreshItem(s.itemId);
    const res = await matchPieces(row, changedPieces, merged.scene?.lighting ?? null, stored?.row.id ?? null, { noWear: new Set(parent.itemIds) });
    const cs: ClosetSummary = {
      matched: uniq([...sightings.map((s) => s.itemId), ...res.matched]), added: res.added, undone: prev.undone,
      links: [...links, ...res.links], asks: res.asks, state, startedAt: prev.startedAt ?? clock.nowMs(), touched: prev.touched ?? false,
    };
    await saveSummary(recheckId, cs);
  }

  async function writeSnap(parentId: string, snapReadingId: string, stored: { row: ReadingRow; reading: StoredClosetReading } | null) {
    const parent = await store.fitChecks.get(parentId);
    const snap = (await readingOf(snapReadingId))?.reading;
    if (!parent || !snap) return;
    const fields = fieldsFor(snap.garments, 'shoeSnap', stored?.reading ?? null);
    const pieces: Piece[] = [];
    snap.garments.forEach((g, i) => {
      if (g.category !== 'footwear' || g.certainty === 'unsure') return;
      pieces.push({ origin: 'snap', index: i, garment: g, fields: fields.get(i) ?? null, confirmed: null, partial: halfSeen(snap.garments, i) });
    });
    const prev = summaryOf(parent);
    if (prev.links.some((l) => l.origin === 'snap')) return; // one snap per check
    const res = await matchPieces({ ...parent, readingId: snapReadingId }, pieces, snap.scene?.lighting ?? null, stored?.row.id ?? null, { exclude: new Set(prev.added) });
    const cur = summaryOf((await store.fitChecks.get(parentId))!);
    await saveSummary(parentId, {
      ...cur, matched: uniq([...cur.matched, ...res.matched]), added: uniq([...cur.added, ...res.added]), links: [...cur.links, ...res.links],
      asks: [...cur.asks, ...res.asks],
    });
  }

  // ------------------------------------------------------------------ the closet call
  async function storedCloset(imageHash: string, garments: readonly Garment[], kind: ClosetKind) {
    const { stubs } = buildStubs(garments, kind);
    const rows = (await store.readings.all())
      .filter((r) => r.source === 'closet' && r.imageHash === imageHash && r.imageHash !== '')
      .sort((a, b) => b.createdAt - a.createdAt);
    for (const r of rows) {
      const s = r.reading as unknown as StoredClosetReading;
      if (s.kind === kind && JSON.stringify(s.stubs) === JSON.stringify(stubs)) return { row: r, reading: s };
    }
    return null;
  }

  async function saveClosetReading(imageHash: string, derivedFrom: string | null, reading: StoredClosetReading, model: string, latencyMs: number) {
    const row: ReadingRow = {
      id: ids('R'), imageHash, source: 'closet', reading: reading as unknown as Reading, model, promptVersion: 'closet1', schemaVersion: 'closet1',
      latencyMs, createdAt: clock.nowMs(), derivedFrom,
    };
    await store.readings.put(row);
    return { row, reading };
  }

  /** Ask the closet call, with the 12 s S11 deadline: past it, `onLate` writes the fallback and the answer enriches. */
  async function call(image: PreparedImage, garments: readonly Garment[], kind: ClosetKind, derivedFrom: string | null) {
    const src = deps.source;
    if (!src) return null;
    const { stubs } = buildStubs(garments, kind);
    const r = await src.read(image, stubs, kind);
    if ('fail' in r) return null;
    return saveClosetReading(image.sha256, derivedFrom, { ...r.reading, stubs, kind }, r.model, r.latencyMs);
  }

  /** Pending → the call → done; or fallback at the deadline / on failure, then enrich when (if) it answers. */
  function runJob(
    checkId: string, image: PreparedImage, garments: readonly Garment[], kind: ClosetKind, derivedFrom: string | null,
    write: (stored: { row: ReadingRow; reading: StoredClosetReading } | null, state: 'done' | 'fallback') => Promise<void>,
  ): Promise<void> {
    let written = false;
    let fallbackDone: Promise<unknown> = Promise.resolve();
    const timer = deps.scheduler.setTimer(() => {
      if (written) return;
      written = true;
      fallbackDone = serial(() => write(null, 'fallback'));
    }, deadlineMs);
    return track((async () => {
      let stored: Awaited<ReturnType<typeof call>> = null;
      try {
        stored = await call(image, garments, kind, derivedFrom);
      } catch {
        stored = null;
      }
      deps.scheduler.clearTimer(timer);
      if (!written) {
        written = true;
        await serial(() => write(stored, stored ? 'done' : 'fallback'));
      } else {
        await fallbackDone;
        if (stored) await serial(() => enrich(checkId, stored!));
      }
    })());
  }

  // ------------------------------------------------------------------ enrich (late answer / catch-up)
  /** Fold a late closet answer into a check written from v3 fields: re-match if he hasn't touched S11 for it and
   *  nothing else has linked its new pieces since; otherwise only add the details to its sightings. */
  async function enrich(checkId: string, stored: { row: ReadingRow; reading: StoredClosetReading }) {
    const row = await store.fitChecks.get(checkId);
    if (!row) return;
    const cs = summaryOf(row);
    if (cs.state !== 'fallback') return;
    const obsAll = await store.closetObs.all();
    const mine = obsAll.filter((o) => o.fitCheckId === checkId && o.origin !== 'snap');
    const foreign = obsAll.some((o) => cs.added.includes(o.itemId) && o.fitCheckId !== checkId && !o.isDeleted);
    if (!cs.touched && !foreign && !row.parentId) {
      // Roll this check's writes back, then write it again with the details.
      for (const o of mine) {
        await store.closetObs.delete(o.id);
        if (o.decision === 'same') {
          const it = await store.closet.get(o.itemId);
          if (it) await store.closet.patch(it.id, { wornCount: Math.max(0, it.wornCount - 1) });
        }
      }
      for (const id of cs.added) if (!cs.links.some((l) => l.origin === 'snap' && l.itemId === id)) await store.closet.delete(id);
      const keepSnaps = cs.links.filter((l) => l.origin === 'snap');
      await saveSummary(checkId, {
        ...cs, matched: cs.matched.filter((id) => keepSnaps.some((l) => l.itemId === id)), added: cs.added.filter((id) => keepSnaps.some((l) => l.itemId === id)),
        links: keepSnaps, asks: cs.asks.filter((a) => keepSnaps.some((l) => l.itemId === a.itemId)), state: 'pending',
      });
      for (const o of mine) if (o.decision === 'same') await refreshItem(o.itemId);
      await writeFull(checkId, stored, 'done');
      const after = await store.fitChecks.get(checkId);
      if (after) await saveSummary(checkId, { ...summaryOf(after), enrichedAt: clock.nowMs() });
      return;
    }
    const reading = (await readingOf(row.readingId))?.reading;
    const fields = reading ? fieldsFor(reading.garments, row.parentId ? 'recheck' : 'full', stored.reading) : new Map<number, ClosetFields>();
    for (const l of cs.links) {
      if (l.origin !== 'garment') continue;
      const f = fields.get(l.index);
      const o = obsAll.find((x) => x.id === l.obsId);
      if (!f || !o) continue;
      await store.closetObs.patch(o.id, { closet: f, closetReadingId: stored.row.id });
      await refreshItem(o.itemId);
    }
    await renameAll();
    const cur = (await store.fitChecks.get(checkId))!;
    await saveSummary(checkId, { ...summaryOf(cur), state: 'done', enrichedAt: clock.nowMs() });
  }

  // ------------------------------------------------------------------ answers in S11 / Closet
  async function revertAnswer(cs: ReturnType<typeof summaryOf>, ask: ClosetAsk) {
    const now = clock.nowMs();
    if (ask.answer === 'same' || ask.answer === 'runnerUp') {
      const target = ask.answer === 'same' ? ask.candidateId : ask.runnerUpId!;
      const t = await store.closet.get(target);
      await store.closetObs.patch(ask.obsId, { itemId: ask.itemId, decision: 'ask', answeredAt: null });
      await store.closet.patch(ask.itemId, { isDeleted: false, mergedInto: null, maybeSameAs: ask.candidateId, updatedAt: now });
      const riders = ask.answer === 'same' ? ask.riders ?? [] : [];
      for (const id of riders) await store.closetObs.patch(id, { itemId: ask.itemId, decision: 'ask' });
      await moveRiderLinks(riders, target, ask.itemId);
      if (t) {
        const p = profileOfItem(t);
        const back: Partial<ClosetItemRow> = {
          wornCount: Math.max(0, t.wornCount - 1 - riders.length), updatedAt: now,
          profile: { ...p, aliases: p.aliases.filter((x) => x !== ask.alias), fieldAliases: withoutAliases(p.fieldAliases, ask.addedFieldAliases) },
        };
        if (ask.replacedSub) {
          back.garment = { ...t.garment, subcategory: ask.replacedSub };
          back.confirmedFields = t.confirmedFields.filter((f) => f !== 'subcategory');
        }
        await store.closet.patch(target, back);
        await refreshItem(target);
      }
      cs.matched = cs.matched.filter((id) => id !== target || cs.links.some((l) => l.itemId === id && l.obsId !== ask.obsId));
      cs.added = uniq([...cs.added, ask.itemId]);
      cs.links = cs.links.map((l) => (l.obsId === ask.obsId ? { ...l, itemId: ask.itemId } : l));
    } else if (ask.answer === 'new') {
      const f = await store.closet.get(ask.itemId);
      const c = await store.closet.get(ask.candidateId);
      if (f) await store.closet.patch(f.id, { maybeSameAs: ask.candidateId, profile: { ...profileOfItem(f), distinctFrom: profileOfItem(f).distinctFrom.filter((x) => x !== ask.candidateId) } });
      if (c) await store.closet.patch(c.id, { profile: { ...profileOfItem(c), distinctFrom: profileOfItem(c).distinctFrom.filter((x) => x !== ask.itemId) } });
      await store.closetObs.patch(ask.obsId, { decision: 'ask', answeredAt: null });
    }
    ask.answer = null;
    ask.alias = null;
    ask.replacedSub = null;
    ask.addedFieldAliases = null;
    ask.riders = null;
  }

  /** The other checks' cards follow their sightings when a "Yes" moves them (#116). */
  async function moveRiderLinks(obsIds: readonly string[], from: string, to: string) {
    if (obsIds.length === 0) return;
    const obs = (await store.closetObs.all()).filter((o) => obsIds.includes(o.id));
    for (const checkId of uniq(obs.map((o) => o.fitCheckId).filter((x): x is string => !!x))) {
      const row = await store.fitChecks.get(checkId);
      if (!row) continue;
      const cs = summaryOf(row);
      cs.links = cs.links.map((l) => (obsIds.includes(l.obsId) ? { ...l, itemId: to } : l));
      cs.matched = uniq(cs.matched.map((id) => (id === from && !cs.links.some((l) => l.itemId === from) ? to : id)));
      await saveSummary(checkId, cs);
    }
  }

  async function applyAnswer(checkId: string, obsId: string, a: DuplicateAnswer) {
    const row = await store.fitChecks.get(checkId);
    if (!row) return null;
    const cs = summaryOf(row);
    const ask = cs.asks.find((x) => x.obsId === obsId);
    if (!ask) return null;
    if (a === 'runnerUp' && !ask.runnerUpId) return null;
    if ((ask.answer ?? null) === a) return row;
    await revertAnswer(cs, ask);
    const now = clock.nowMs();
    const flagged = await store.closet.get(ask.itemId);
    const obs = await store.closetObs.get(obsId);
    if (!flagged || !obs) return null;
    if (a === 'same' || a === 'runnerUp') {
      const targetId = a === 'same' ? ask.candidateId : ask.runnerUpId!;
      const target = await store.closet.get(targetId);
      if (!target) return null;
      // He says it's the same piece: the sighting moves over, the flagged copy folds in (and is hidden).
      const p = profileOfItem(target);
      const sub = typeof obs.garment.subcategory === 'string' ? obs.garment.subcategory : null;
      const confirmedSub = obs.userConfirmed?.subcategory ?? null;
      let alias: string | null = null;
      let replacedSub: string | null = null;
      // Sightings that joined this open question from later checks (#116) are his answer too.
      const riders = a === 'same' ? (await store.closetObs.all()).filter((r) => r.itemId === flagged.id && r.id !== obsId && isLive(r)) : [];
      const patch: Partial<ClosetItemRow> = {
        wornCount: target.wornCount + 1 + riders.length, updatedAt: now,
        lastWornAt: Math.max(target.lastWornAt ?? 0, row.createdAt, ...riders.map((r) => r.createdAt)),
      };
      if (confirmedSub && target.garment.subcategory !== confirmedSub && !target.confirmedFields.includes('subcategory')) {
        // He told us what it is (the quick tap) and now that it's this piece: the piece takes his word.
        replacedSub = typeof target.garment.subcategory === 'string' ? target.garment.subcategory : null;
        patch.garment = { ...target.garment, subcategory: confirmedSub };
        patch.confirmedFields = uniq([...target.confirmedFields, 'subcategory']);
      } else if (sub && sub !== target.garment.subcategory && !p.aliases.includes(sub)) {
        alias = sub;
      }
      // What the Yes teaches (#115): the shape reads that differed (his wide jeans read straight) stop costing points.
      const lessons = lessonsOfYes(null, sightingsOf(targetId, await store.closetObs.all()).map(observationOfRow), observationOfRow(obs), { fieldAliases: p.fieldAliases });
      const addedFieldAliases = addedAliases(p.fieldAliases, lessons.fieldAliases);
      patch.profile = { ...p, aliases: alias ? uniq([...p.aliases, alias]).sort() : p.aliases, fieldAliases: lessons.fieldAliases };
      await store.closet.patch(targetId, patch);
      await store.closetObs.patch(obsId, { itemId: targetId, decision: 'answeredSame', answeredAt: now });
      for (const r of riders) await store.closetObs.patch(r.id, { itemId: targetId, decision: 'same' });
      await moveRiderLinks(riders.map((r) => r.id), flagged.id, targetId);
      await store.closet.patch(flagged.id, { isDeleted: true, mergedInto: targetId, maybeSameAs: null, updatedAt: now });
      cs.added = cs.added.filter((id) => id !== flagged.id);
      cs.matched = uniq([...cs.matched, targetId]);
      cs.links = cs.links.map((l) => (l.obsId === obsId ? { ...l, itemId: targetId } : l));
      ask.answer = a;
      ask.alias = alias;
      ask.replacedSub = replacedSub;
      ask.addedFieldAliases = Object.keys(addedFieldAliases).length > 0 ? addedFieldAliases : null;
      ask.riders = riders.length > 0 ? riders.map((r) => r.id) : null;
      await refreshItem(targetId);
    } else {
      // A different piece: never asked about these two again.
      const c = await store.closet.get(ask.candidateId);
      await store.closet.patch(flagged.id, {
        maybeSameAs: null, updatedAt: now, profile: { ...profileOfItem(flagged), distinctFrom: uniq([...profileOfItem(flagged).distinctFrom, ask.candidateId]) },
      });
      if (c) await store.closet.patch(c.id, { profile: { ...profileOfItem(c), distinctFrom: uniq([...profileOfItem(c).distinctFrom, flagged.id]) } });
      await store.closetObs.patch(obsId, { decision: 'answeredNew', answeredAt: now });
      ask.answer = 'new';
    }
    cs.touched = true;
    await renameAll();
    return saveSummary(checkId, cs);
  }

  async function applySplit(checkId: string, obsId: string) {
    const row = await store.fitChecks.get(checkId);
    const obs = await store.closetObs.get(obsId);
    if (!row || !obs || obs.decision !== 'same') return null;
    const cs = summaryOf(row);
    const link = cs.links.find((l) => l.obsId === obsId);
    const old = await store.closet.get(obs.itemId);
    if (!link || !old) return null;
    // "Not the same": this sighting becomes its own piece, and the two are never matched again.
    const item = newItem(row, obs.garment, obs, null);
    if (!item) return null;
    item.profile = { ...profileOfItem(item), distinctFrom: [old.id] };
    await store.closet.put(item);
    await store.closetObs.patch(obsId, { itemId: item.id, decision: 'split', answeredAt: clock.nowMs() });
    const parentItems = row.parentId ? (await store.fitChecks.get(row.parentId))?.itemIds ?? [] : [];
    await store.closet.patch(old.id, {
      ...(parentItems.includes(old.id) ? {} : { wornCount: Math.max(0, old.wornCount - 1) }),
      profile: { ...profileOfItem(old), distinctFrom: uniq([...profileOfItem(old).distinctFrom, item.id]) }, updatedAt: clock.nowMs(),
    });
    await refreshItem(old.id);
    cs.matched = cs.matched.filter((id) => id !== old.id || cs.links.some((l) => l.itemId === id && l.obsId !== obsId));
    cs.added = uniq([...cs.added, item.id]);
    cs.links = cs.links.map((l) => (l.obsId === obsId ? { ...l, itemId: item.id } : l));
    cs.touched = true;
    await renameAll();
    return saveSummary(checkId, cs);
  }

  async function applyUndone(checkId: string, itemId: string, undone: boolean) {
    const row = await store.fitChecks.get(checkId);
    if (!row) return null;
    await store.closet.patch(itemId, { isDeleted: undone, updatedAt: clock.nowMs() });
    const cs = summaryOf(row);
    const item = await store.closet.get(itemId);
    for (const l of cs.links.filter((x) => x.itemId === itemId)) {
      const o = await store.closetObs.get(l.obsId);
      if (!o) continue;
      const back: ObservationDecision = o.answeredAt ? 'answeredNew' : item?.maybeSameAs ? 'ask' : 'new';
      await store.closetObs.patch(o.id, { decision: undone ? 'undone' : back });
    }
    cs.undone = undone ? uniq([...cs.undone, itemId]) : cs.undone.filter((x) => x !== itemId);
    cs.touched = true;
    await renameAll();
    return saveSummary(checkId, cs);
  }

  /**
   * "Not quite right?" saved (04 §7): follow the stored garment → item link, never re-match.
   * - still fits the item → patch it (that field becomes confirmed);
   * - no longer fits an item seen 2+ times → this sighting moves (to a matching piece or a new one), the old item
   *   loses a wear and keeps its look;
   * - an item seen once → patched in place.
   * A removed garment's sighting is undone (and its piece, if this was its only sighting).
   */
  async function applyCorrection(
    checkId: string, d: { garmentIndex: number; field?: string; value?: unknown; remove?: boolean }, next: Reading, nextReadingId: string,
  ): Promise<{ itemName: string | null }> {
    const row = await store.fitChecks.get(checkId);
    if (!row) return { itemName: null };
    let cs = summaryOf(row);
    if (cs.state === 'pending') {
      // The closet call is still out: write from the v3 fields now so the correction has a piece to follow.
      await writeFull(checkId, null, 'fallback');
      cs = summaryOf((await store.fitChecks.get(checkId))!);
    }
    const link = cs.links.find((l) => l.origin === 'garment' && l.index === d.garmentIndex);
    if (d.remove) {
      if (link) {
        const o = await store.closetObs.get(link.obsId);
        if (o) await store.closetObs.patch(o.id, { decision: 'undone' });
        const left = sightingsOf(link.itemId, await store.closetObs.all());
        if (left.length === 0 && cs.added.includes(link.itemId)) {
          await store.closet.patch(link.itemId, { isDeleted: true });
          cs.undone = uniq([...cs.undone, link.itemId]);
        } else {
          const it = await store.closet.get(link.itemId);
          if (it && o?.decision === 'same') await store.closet.patch(it.id, { wornCount: Math.max(0, it.wornCount - 1) });
        }
      }
      // The reading lost that garment: later garments moved up one.
      cs.links = cs.links
        .filter((l) => !(l.origin === 'garment' && l.index === d.garmentIndex))
        .map((l) => (l.origin === 'garment' && l.index > d.garmentIndex ? { ...l, index: l.index - 1 } : l));
      cs.touched = true;
      await saveSummary(checkId, cs);
      return { itemName: null };
    }
    const g = next.garments[d.garmentIndex];
    if (!g || !d.field) return { itemName: null };
    if (!link) {
      // A check from before V6 (no links): only its own pieces may take the change.
      const own = (await store.closet.all()).filter((c) => row.itemIds.includes(c.id) && isOwned(c));
      const orig = (await readingOf(row.readingId))?.reading.garments[d.garmentIndex];
      const hit = orig ? own.find((c) => c.slot === SLOT_TO_CLOSET[String(orig.category)] && c.garment.subcategory === orig.subcategory && c.garment.color_family === orig.color_family) : undefined;
      if (!hit) return { itemName: null };
      await store.closet.patch(hit.id, { garment: { ...hit.garment, [d.field]: d.value }, confirmedFields: uniq([...hit.confirmedFields, d.field]) });
      return { itemName: hit.name };
    }
    const obs = await store.closetObs.get(link.obsId);
    const item = await store.closet.get(link.itemId);
    if (!obs || !item) return { itemName: null };
    const confirmed: ConfirmedFields = CONFIRMABLE.includes(d.field) && typeof d.value === 'string'
      ? { ...(obs.userConfirmed ?? {}), [d.field]: d.value } : (obs.userConfirmed ?? {});
    await store.closetObs.patch(obs.id, { garment: clone(g), userConfirmed: Object.keys(confirmed).length ? confirmed : null, readingId: nextReadingId });
    const fresh = (await store.closetObs.get(obs.id))!;
    const others = sightingsOf(item.id, await store.closetObs.all()).filter((o) => o.id !== obs.id);
    const fits = others.length === 0 || identity(observationOfRow(fresh), profileFromClosetItem(item, { sightings: others.map(observationOfRow) })).vetoes.length === 0;
    const patchItem = async () => {
      const it = (await store.closet.get(item.id))!;
      const was = it.name;
      await store.closet.patch(item.id, { garment: { ...it.garment, [d.field!]: d.value }, confirmedFields: uniq([...it.confirmedFields, d.field!]), updatedAt: clock.nowMs() });
      await refreshItem(item.id);
      // A confirmed type or color renames an auto-named piece ("Black sweatpants" → "Black jeans").
      if (['subcategory', 'color_family'].includes(d.field!) && isAutoNamed({ ...it, name: was })) {
        const p = profileOfItem(it);
        await store.closet.patch(item.id, { profile: { ...p, autoName: true } });
      }
      await renameAll();
      return (await store.closet.get(item.id))!.name;
    };
    if (fits || others.length === 0) {
      const name = await patchItem();
      cs.touched = true;
      await saveSummary(checkId, cs);
      return { itemName: name };
    }
    // It was never that piece: move the sighting, don't edit a piece seen in other photos.
    await store.closetObs.patch(obs.id, { decision: 'undone' });
    if (obs.decision === 'same' || obs.decision === 'answeredSame') await store.closet.patch(item.id, { wornCount: Math.max(0, item.wornCount - 1) });
    await refreshItem(item.id);
    cs.links = cs.links.filter((l) => l.obsId !== obs.id);
    cs.matched = cs.matched.filter((id) => id !== item.id || cs.links.some((l) => l.itemId === id));
    cs.added = cs.added.filter((id) => id !== item.id || cs.links.some((l) => l.itemId === id));
    const res = await matchPieces(row, [{ origin: 'garment', index: d.garmentIndex, garment: g, fields: obs.closet, confirmed, partial: halfSeen(next.garments, d.garmentIndex) }], next.scene?.lighting ?? null, obs.closetReadingId, { exclude: new Set([item.id]) });
    await store.closetObs.delete(obs.id);
    cs.matched = uniq([...cs.matched, ...res.matched]);
    cs.added = uniq([...cs.added, ...res.added]);
    cs.links = [...cs.links, ...res.links];
    cs.asks = [...cs.asks, ...res.asks];
    cs.touched = true;
    await saveSummary(checkId, cs);
    const now = res.links[0] ? await store.closet.get(res.links[0].itemId) : null;
    return { itemName: now?.name ?? null };
  }

  // ------------------------------------------------------------------ public API
  return {
    /** A full check was scored (the card is up): write its closet now (cached / no source) or start the call. */
    async afterCheck(checkId: string, image: PreparedImage | null): Promise<void> {
      const row = await store.fitChecks.get(checkId);
      const reading = row ? (await readingOf(row.readingId))?.reading : null;
      if (!row || !reading) return;
      const cached = await storedCloset(row.imageHash, reading.garments, 'full');
      if (cached || !deps.source || !image) {
        await serial(() => writeFull(checkId, cached, cached ? 'done' : 'fallback'));
        return;
      }
      await serial(async () => {
        const cur = await store.fitChecks.get(checkId);
        if (cur) await saveSummary(checkId, { ...emptySummary(), state: 'pending', startedAt: clock.nowMs() });
      });
      void runJob(checkId, image, reading.garments, 'full', row.readingId, (s, st) => writeFull(checkId, s, st));
    },
    /** A re-check was scored: changed pieces go through the engine, the rest add a sighting to the first check's pieces. */
    async afterRecheck(recheckId: string, image: PreparedImage | null): Promise<void> {
      const row = await store.fitChecks.get(recheckId);
      const merged = row ? (await readingOf(row.readingId))?.reading : null;
      if (!row || !merged) return;
      const cached = await storedCloset(row.imageHash, merged.garments, 'recheck');
      if (cached || !deps.source || !image) {
        await serial(() => writeRecheck(recheckId, cached, cached ? 'done' : 'fallback'));
        return;
      }
      await serial(() => saveSummary(recheckId, { ...emptySummary(), state: 'pending', startedAt: clock.nowMs() }));
      void runJob(recheckId, image, merged.garments, 'recheck', row.readingId, (s, st) => writeRecheck(recheckId, s, st));
    },
    /** A shoe snap finished a partial check: footwear only, into the first check's closet summary. */
    async afterSnap(parentId: string, snapReadingId: string, image: PreparedImage | null): Promise<void> {
      const snap = (await readingOf(snapReadingId))?.reading;
      if (!snap) return;
      const cached = image ? await storedCloset(image.sha256, snap.garments, 'shoeSnap') : null;
      if (cached || !deps.source || !image) {
        await serial(() => writeSnap(parentId, snapReadingId, cached));
        return;
      }
      void track((async () => {
        const stored = await call(image, snap.garments, 'shoeSnap', snapReadingId).catch(() => null);
        await serial(() => writeSnap(parentId, snapReadingId, stored));
      })());
    },
    answer: (checkId: string, obsId: string, a: DuplicateAnswer) => serial(() => applyAnswer(checkId, obsId, a)),
    split: (checkId: string, obsId: string) => serial(() => applySplit(checkId, obsId)),
    setUndone: (checkId: string, itemId: string, undone: boolean) => serial(() => applyUndone(checkId, itemId, undone)),
    correction: (checkId: string, d: { garmentIndex: number; field?: string; value?: unknown; remove?: boolean }, next: Reading, nextReadingId: string) =>
      serial(() => applyCorrection(checkId, d, next, nextReadingId)),
    /**
     * Next foreground: checks written from v3 fields in the last 24 h get one more closet call (once per launch),
     * if the face-hidden upload is still on the phone and consent is on (the routed source checks both).
     */
    async catchUp(): Promise<number> {
      if (!deps.source) return 0;
      const now = clock.nowMs();
      let n = 0;
      for (const row of await store.fitChecks.all()) {
        const cs = row.details.closetSummary;
        if (!cs || row.parentId || now - row.createdAt > windowMs || attempted.has(row.id)) continue;
        const stale = cs.state === 'pending' && now - (cs.startedAt ?? row.createdAt) > deadlineMs && ![...jobs].length;
        if (cs.state !== 'fallback' && !stale) continue;
        attempted.add(row.id);
        if (stale) await serial(() => writeFull(row.id, null, 'fallback'));
        const reading = (await readingOf(row.readingId))?.reading;
        if (!reading) continue;
        const image: PreparedImage = { photoId: row.demoPhotoId, sha256: row.imageHash, uploadUri: null };
        const stored = (await storedCloset(row.imageHash, reading.garments, 'full')) ?? (await track(call(image, reading.garments, 'full', row.readingId).catch(() => null)));
        if (!stored) continue;
        await serial(() => enrich(row.id, stored));
        n++;
      }
      return n;
    },
    /** Resolves when every closet call in flight has been written (demo screens, tests). */
    async settle(): Promise<void> {
      while (jobs.size > 0) await Promise.allSettled([...jobs]);
      await serial(async () => {});
    },
    /**
     * The pieces the app is sure he owns, before `excludeCheckIds` (the check being asked about, and a re-check's first
     * check): for the reading's "Your green work boots?" question (#122.3), which picks with core knownMatches().
     */
    async knownPieces(excludeCheckIds: readonly string[] = []): Promise<KnownPiece[]> {
      return knownPieces(await store.closet.all(), await store.closetObs.all(), { excludeCheckIds });
    },
    /** The open "Same as your …?" questions across his checks (newest first), for the Closet tab. */
    async openAsks(): Promise<{ checkId: string; ask: ClosetAsk }[]> {
      const items = new Map((await store.closet.all()).map((c) => [c.id, c]));
      const out: { checkId: string; ask: ClosetAsk; at: number }[] = [];
      for (const row of await store.fitChecks.all()) {
        for (const a of row.details.closetSummary?.asks ?? []) {
          const f = items.get(a.itemId), c = items.get(a.candidateId);
          if (a.answer || !f || !c || !isOwned(f) || !isOwned(c) || f.maybeSameAs !== a.candidateId) continue;
          out.push({ checkId: row.id, ask: a, at: row.createdAt });
        }
      }
      return out.sort((a, b) => b.at - a.at).map(({ checkId, ask }) => ({ checkId, ask }));
    },
  };
}

export type ClosetService = ReturnType<typeof createClosetService>;
export { isLive };
