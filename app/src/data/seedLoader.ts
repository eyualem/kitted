// Loads a demo scenario from seed.json into a store (04 §10). The seed is our own bundled,
// generated file (make_seed.py asserts its numbers), so parsing is shape-light: we read the
// fields we need and map them to row types. Seed fixes use rubric.py's snake_case.
//
// `asOf` drops everything created after that instant, so a screen can show the thread as it
// was at 08:01 (screen 12). Usage is then derived from the rows, not copied.

import { dayKey, type Fix, type Reading, type Styles, type ZoneOffset } from '@kitted/core';
import type { KittedStore } from './store';
import type {
  ChatMessage, CheckDetails, ClosetItemRow, ClosetSource, FactRow, FitCheckRow, OccasionKey, OutfitRow, ProfileRow,
  ReadingRow, ReadingSourceKind, SnapState, WearLogRow,
} from './types';

export type ScenarioName = 'firstRun' | 'full';

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const numOr = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);
const ms = (iso: unknown): number => {
  const t = typeof iso === 'string' ? Date.parse(iso.length === 10 ? `${iso}T12:00:00-04:00` : iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** rubric.py's snake_case fix → the core's camelCase Fix (the reverse of the core tests' fixToPy). */
export function fixFromSeed(f: unknown): Fix {
  const o = obj(f);
  return {
    target: String(o.target), tier: o.tier as Fix['tier'], effort: numOr(o.effort, 1), free: o.free === true,
    to: numOr(o.to, 0), toRaw: numOr(o.to_raw, 0), gain: numOr(o.gain, 0), rawGain: numOr(o.raw_gain, 0),
    edits: arr(o.edits) as Fix['edits'], itemId: str(o.item_id), copy: String(o.copy ?? ''), tag: String(o.tag ?? ''),
  };
}

const SOURCE_MAP: Record<string, ReadingSourceKind> = {
  full: 'full', recheckMerged: 'recheckMerged', corrected: 'corrected', userConfirmed: 'userConfirmed', lower: 'lower',
};

export interface SeedSummary {
  scenario: ScenarioName;
  nowMs: number;
  counts: Record<string, number>;
}

export interface LoadOptions {
  scenario: ScenarioName;
  /** Drop rows created after this instant (defaults to the scenario's `now`). */
  asOfMs?: number;
  zone: ZoneOffset;
}

/** The scenario's `now` (epoch ms) from seed.json. */
export function scenarioNow(seed: unknown, scenario: ScenarioName): number {
  return ms(obj(obj(obj(seed).scenarios)[scenario]).now);
}

/** Photo id → SHA-256 of the bundled bytes. */
function photoHashes(seed: unknown): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of arr(obj(seed).photos)) {
    const o = obj(p);
    if (typeof o.id === 'string' && typeof o.sha256 === 'string') m.set(o.id, o.sha256);
  }
  return m;
}

export async function loadScenario(store: KittedStore, seed: unknown, opts: LoadOptions): Promise<SeedSummary> {
  const sc = obj(obj(obj(seed).scenarios)[opts.scenario]);
  const nowMs = ms(sc.now);
  const asOf = opts.asOfMs ?? nowMs;
  const keep = (t: number) => t <= asOf;
  const hashes = photoHashes(seed);
  const counts: Record<string, number> = {};
  const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1);

  // Profile + the AI note at the top of the history (D12, ruling 17).
  const p = obj(sc.profile);
  if (Object.keys(p).length > 0) {
    const consentAt = sc.profile ? ms(p.consentAt) : null;
    const profile: ProfileRow = {
      id: 'me', birthYear: typeof p.birthYear === 'number' ? p.birthYear : null, heightCm: typeof p.heightCm === 'number' ? p.heightCm : null,
      build: String(p.build ?? ''), fitPreference: String(p.fitPreference ?? ''), styles: arr(p.styles) as unknown as Styles,
      boldness: str(p.boldness), budget: str(p.budget), lastOccasion: (str(p.lastOccasion) ?? 'everyday') as OccasionKey,
      consentVersion: p.consentVersion === undefined || p.consentVersion === null ? null : String(p.consentVersion),
      consentAt, onboardingDone: true, ideaTime: str(p.ideaTime), units: p.units === 'metric' ? 'metric' : 'imperial',
      createdAt: consentAt ?? nowMs,
    };
    await store.profile.put(profile);
    if (consentAt !== null && keep(consentAt)) {
      await store.chat.put(textMessage('M00', consentAt, 'stylist', null, { aiNote: true }));
      bump('chat');
    }
  }

  for (const c of arr(sc.closet)) {
    const o = obj(c);
    const added = ms(o.createdAt);
    if (!keep(added)) continue;
    const item: ClosetItemRow = {
      id: String(o.id), name: String(o.name), slot: String(o.slot), garment: obj(o.garment),
      confirmedFields: arr(o.confirmedFields).map(String), hex: String(o.colorHex ?? '#ECEEF1'), photoFile: null,
      demoPhotoId: null, isPhotographed: o.isPhotographed !== false, source: (str(o.source) ?? 'seed') as ClosetSource,
      starterId: str(o.starterID), wornCount: numOr(o.wornCount, 0), lastWornAt: o.lastWornAt ? ms(o.lastWornAt) : null,
      addedAt: added, isDeleted: false,
    };
    await store.closet.put(item);
    bump('closet');
  }

  for (const f of arr(sc.fitChecks)) {
    const o = obj(f);
    const created = ms(o.createdAt);
    if (!keep(created)) continue;
    const id = String(o.id);
    const photoId = str(o.photoID);
    const hash = (photoId && hashes.get(photoId)) || '';
    const readingId = `R-${id}`;
    const source = SOURCE_MAP[String(o.readingSource ?? 'full')] ?? 'full';
    const reading: ReadingRow = {
      id: readingId, imageHash: hash, source, reading: obj(o.reading) as unknown as Reading, model: 'seed', promptVersion: 'v3',
      schemaVersion: 'v3', latencyMs: 0, createdAt: created, derivedFrom: null,
    };
    await store.readings.put(reading);
    const cs = obj(o.closetSummary);
    const details: CheckDetails = {
      closetSummary: { matched: arr(cs.matched).map(String), added: arr(cs.added).map(String), undone: [] },
      nextLevel: arr(o.nextLevel).map(String),
      tips: [],
      dialedIn: arr(o.fixes).length === 0,
    };
    if (o.parentID) {
      const done = arr(o.doneFixes).map((d) => ({ copy: String(obj(d).copy), earned: numOr(obj(d).rawGain, 0) }));
      const parent = arr(sc.fitChecks).map(obj).find((x) => x.id === o.parentID);
      const before = numOr(parent?.score, 0);
      details.recheck = {
        parentScore: before, delta: numOr(o.score, 0) - before, rawDelta: numOr(o.rawScore, 0) - numOr(parent?.rawScore, 0),
        notes: arr(o.recheckNotes).map(String), doneFixes: done, newProblems: [], notSeen: done.length === 0,
      };
    }
    const fin = obj(o.finishRow);
    if (fin.suggestedItemID) details.finish = { suggestedItemId: String(fin.suggestedItemID), weekday: null };
    const row: FitCheckRow = {
      id, createdAt: created, dayKey: dayKey(created, opts.zone), photoFile: null, thumbFile: null, demoPhotoId: photoId,
      imageHash: hash, occasion: (str(o.occasion) ?? 'everyday') as OccasionKey, style: null, status: 'scored', isPartial: o.isPartial === true,
      notRated: arr(o.notRated).map(String), score: numOr(o.score, 0), rawScore: numOr(o.rawScore, 0),
      subscores: obj(o.subscores) as Record<string, number>, occasionAdj: numOr(o.occasionAdj, 0), rulesFired: arr(o.rulesFired).map(String),
      credits: arr(o.credits).map(String), advice: arr(o.advice).map(String), fixes: arr(o.fixes).map(fixFromSeed),
      explanation: str(o.summary) ?? str(o.verdict), rubricVersion: String(o.rubricVersion ?? '4.0.0'), isFavorite: o.isFavorite === true,
      snapState: (str(o.snapState) ?? 'none') as SnapState, recheckUsed: o.recheckUsed === true, isFirstCheck: id === 'FC0',
      readingId, parentId: str(o.parentID), itemIds: [...arr(cs.matched).map(String), ...arr(cs.added).map(String)], details,
    };
    await store.fitChecks.put(row);
    bump('fitChecks');
  }

  for (const f of arr(sc.outfits)) {
    const o = obj(f);
    const created = ms(o.createdAt);
    if (!keep(created)) continue;
    const row: OutfitRow = {
      id: String(o.id), itemIds: arr(o.itemIDs).map(String), occasion: String(o.occasion ?? 'everyday'), title: str(o.title),
      summary: String(o.summary ?? ''), details: typeof o.predictedScore === 'number' ? { predictedScore: o.predictedScore } : {},
      source: o.source === 'fitCheck' ? 'fitCheck' : 'idea', isSaved: o.isSaved === true, createdAt: created,
    };
    await store.outfits.put(row);
    bump('outfits');
  }

  const asOfDay = dayKey(asOf, opts.zone);
  for (const w of arr(sc.wearLog)) {
    const o = obj(w);
    const day = String(o.day);
    if (day > asOfDay) continue;
    const row: WearLogRow = {
      day, fitCheckId: o.kind === 'fitCheck' ? String(o.ref) : null, outfitId: o.kind === 'outfit' ? String(o.ref) : null,
      createdAt: ms(`${day}T12:00:00-04:00`),
    };
    await store.wearLog.put(row);
    bump('wearLog');
  }

  for (const f of arr(sc.facts)) {
    const o = obj(f);
    const created = ms(o.createdAt);
    if (o.createdAt && !keep(created)) continue;
    const row: FactRow = {
      id: String(o.id), key: String(o.key ?? ''), value: String(o.text ?? o.value ?? ''),
      source: (o.source === 'fitCheck' || o.source === 'guess' ? o.source : 'told') as FactRow['source'],
      createdAt: created, isDeleted: o.isDeleted === true,
    };
    await store.facts.put(row);
    bump('facts');
  }

  for (const m of arr(sc.chatThread)) {
    const o = obj(m);
    const created = ms(o.createdAt);
    if (!keep(created)) continue;
    const payload: Record<string, unknown> = {};
    if (o.stamp) payload.stamp = true;
    if (o.countsAsQuestion) payload.question = true;
    if (o.photoID) payload.photoId = o.photoID;
    const msg: ChatMessage = {
      id: String(o.id), createdAt: created, role: o.role === 'user' ? 'user' : 'stylist',
      kind: o.kind === 'photo' ? 'photo' : o.kind === 'card' ? 'card' : 'text', text: str(o.text),
      cardType: (str(o.cardType) as ChatMessage['cardType']) ?? null, fitCheckId: str(o.fitCheckID), outfitId: str(o.outfitID),
      itemId: null, chips: arr(o.chips).map(String), payload,
    };
    await store.chat.put(msg);
    bump('chat');
  }

  // Usage for the as-of day, from the rows (so `asOf` can't disagree with the thread).
  const checks = (await store.fitChecks.all()).filter((c) => c.dayKey === asOfDay && c.status === 'scored');
  const questions = (await store.chat.all()).filter((c) => c.payload.question === true && dayKey(c.createdAt, opts.zone) === asOfDay);
  await store.usage.put({
    dayKey: asOfDay,
    checks: checks.filter((c) => !c.parentId).length,
    rechecks: checks.filter((c) => c.parentId).length,
    questions: questions.length,
    items: 0,
  });

  return { scenario: opts.scenario, nowMs, counts };
}

export function textMessage(id: string, createdAt: number, role: ChatMessage['role'], text: string | null, payload: Record<string, unknown> = {}): ChatMessage {
  return { id, createdAt, role, kind: 'text', text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload };
}
