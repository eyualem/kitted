// Bagginess on the fit-check card (09-ui-review §19, #322; checks BX1–BX10 set before building). A "Not sure" piece
// gets one quiet line on the card that opens "Not quite right?" on its row; that fix re-scores the check only and never
// sets the piece (the scored-fix rule); the line stops after a tap or 2 checks; every answer is logged on the phone.
import { US_EASTERN, type Garment } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetObservationRow } from '@/data/types';
import { checkSentence } from '@/features/ask/gate';
import { fitDoubt } from '@/features/closet/fitDoubt';
import { cardLine, FIT_LINE_KEY, LINE_MAX_SHOWN, lineAllowed, parseLineCap, withShown, withTapped, type LineCap } from '@/features/closet/fitLine';
import { FIT_LOG_KEY, FIT_LOG_MAX, logFitAnswer, parseFitLog } from '@/features/closet/fitLog';
import { isOwned } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import { fitField, limitTo } from '@/features/correct/fields';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { en } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import { kvPolicy } from '@/sync/schema';

declare const __dirname: string;
const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { join(...p: string[]): string };
const src = (...p: string[]) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');
const at = (iso: string) => Date.parse(iso);
const DAY = 86_400_000;

async function setup() {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  for (const c of await store.closet.all()) await store.closet.patch(c.id, { isDeleted: true });
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource(), measure: async () => new Map() });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, clock, closet, svc };
}
type Env = Awaited<ReturnType<typeof setup>>;

async function check(env: Env, photoId: string) {
  env.clock.advance(60 * 60_000);
  const r = (await env.svc.start({ mode: 'check', photoId, occasion: 'everyday' })) as { checkId: string };
  await env.closet.settle();
  return r.checkId;
}
/** Earlier photos of a piece, read with these legs (one check each, days before T). */
async function earlier(store: KittedStore, itemId: string, legs: string[]) {
  const it = (await store.closet.get(itemId))!;
  for (const [i, l] of legs.entries()) {
    const o: ClosetObservationRow = {
      id: `O-early-${itemId}-${i}`, itemId, fitCheckId: `FC-early-${i}`, readingId: null, closetReadingId: null, garmentIndex: 1, origin: 'garment',
      garment: { ...it.garment, leg_shape: l }, closet: null, sampledHex: null, sampledL: null, cropFile: null, cropQuality: null, decision: 'same',
      identityScore: null, candidates: [], askItemId: null, answeredAt: null, userConfirmed: null, createdAt: at('2026-10-10T08:00:00-04:00') + i * DAY, isDeleted: false,
    };
    await store.closetObs.put(o);
  }
}
/** s12 (a grey hoodie, mid-wash straight jeans, runners): its jeans, read slim, wide and wide before. */
async function doubtful(env: Env) {
  const checkId = await check(env, 's12');
  const owned = (await env.store.closet.all()).filter(isOwned);
  const jeans = owned.find((c) => c.garment.subcategory === 'jeans')!;
  const hoodie = owned.find((c) => c.garment.subcategory === 'hoodie')!;
  await earlier(env.store, jeans.id, ['slim', 'wide', 'wide']);
  const row = (await env.store.fitChecks.get(checkId))!;
  const garments = (await env.store.readings.get(row.readingId!))!.reading.garments;
  const jeansAt = garments.findIndex((g) => g.category === 'bottom');
  return { checkId, jeans, hoodie, jeansAt };
}
async function lineFor(env: Env, checkId: string, cap: LineCap = {}) {
  const row = (await env.store.fitChecks.get(checkId))!;
  const garments = (await env.store.readings.get(row.readingId!))!.reading.garments;
  return cardLine(row, garments, await env.store.closet.all(), await env.store.closetObs.all(), cap);
}
const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : 1));

// ---------------------------------------------------------------- BX1 the scored-fix rule
describe('BX1 a Fit or Leg fix re-scores its check only', () => {
  it('the check takes the new read; no piece changes, the sighting keeps it unconfirmed, nothing moves', async () => {
    const env = await setup();
    const other = await check(env, 'p01b');
    const { checkId, jeans, jeansAt } = await doubtful(env);
    const closetBefore = byId(await env.store.closet.all());
    const obsBefore = byId(await env.store.closetObs.all());
    const otherBefore = await env.store.fitChecks.get(other);
    const rowBefore = (await env.store.fitChecks.get(checkId))!;
    const r = await env.svc.saveCorrection(checkId, { garmentIndex: jeansAt, field: 'leg_shape', value: 'wide' });
    expect(r).not.toBeNull();
    expect(r!.itemName).toBeNull(); // "Correction saved.", never "Saved to your …"
    const rowAfter = (await env.store.fitChecks.get(checkId))!;
    expect(rowAfter.readingId).not.toBe(rowBefore.readingId);
    expect((await env.store.readings.get(rowAfter.readingId!))!.reading.garments[jeansAt]!.leg_shape).toBe('wide');
    expect(byId(await env.store.closet.all())).toEqual(closetBefore);
    const obsAfter = byId(await env.store.closetObs.all());
    expect(obsAfter.map((o) => [o.id, o.itemId])).toEqual(obsBefore.map((o) => [o.id, o.itemId])); // nothing moved piece
    const linkObs = rowAfter.details.closetSummary!.links!.find((l) => l.origin === 'garment' && l.index === jeansAt)!.obsId;
    const was = obsBefore.find((o) => o.id === linkObs)!;
    const now = obsAfter.find((o) => o.id === linkObs)!;
    expect(now.garment.leg_shape).toBe('wide');
    expect(now.userConfirmed).toEqual(was.userConfirmed);
    expect(obsAfter.filter((o) => o.id !== linkObs)).toEqual(obsBefore.filter((o) => o.id !== linkObs));
    expect(await env.store.fitChecks.get(other)).toEqual(otherBefore);
    expect(jeans.id).toBe(was.itemId);
  });

  it('a Fit fix on a top behaves the same; a Kind fix still sets the piece as today', async () => {
    const env = await setup();
    const { checkId, hoodie } = await doubtful(env);
    const garments = (await env.store.readings.get((await env.store.fitChecks.get(checkId))!.readingId!))!.reading.garments;
    const topAt = garments.findIndex((g) => g.category === 'top');
    const before = await env.store.closet.get(hoodie.id);
    expect((await env.svc.saveCorrection(checkId, { garmentIndex: topAt, field: 'volume', value: 5 }))!.itemName).toBeNull();
    expect(await env.store.closet.get(hoodie.id)).toEqual(before);
    const r = await env.svc.saveCorrection(checkId, { garmentIndex: topAt, field: 'subcategory', value: 'sweatshirt' });
    expect(r!.itemName).not.toBeNull();
    const after = (await env.store.closet.get(hoodie.id))!;
    expect(after.garment.subcategory).toBe('sweatshirt');
    expect(after.confirmedFields).toContain('subcategory');
  });
});

// ---------------------------------------------------------------- BX2 it doesn't settle
describe('BX2 a scored fix never settles the piece', () => {
  it('the jeans stay Not sure after the fix; a pick on the piece page settles them', async () => {
    const env = await setup();
    const { checkId, jeans, jeansAt } = await doubtful(env);
    expect(fitDoubt(jeans, await env.store.closetObs.all())).not.toBeNull();
    await env.svc.saveCorrection(checkId, { garmentIndex: jeansAt, field: 'leg_shape', value: 'slim' });
    expect(fitDoubt((await env.store.closet.get(jeans.id))!, await env.store.closetObs.all())).not.toBeNull();
    await env.closet.editPiece(jeans.id, 'leg', 'straight');
    expect(fitDoubt((await env.store.closet.get(jeans.id))!, await env.store.closetObs.all())).toBeNull();
  });
});

// ---------------------------------------------------------------- BX3, BX4 the line
describe('BX3 the line shows exactly for a Not sure piece in the check', () => {
  it('names the piece, and opens Not quite right? on its row with only the legs its photos showed', async () => {
    const env = await setup();
    const { checkId, jeans, jeansAt } = await doubtful(env);
    const line = (await lineFor(env, checkId))!;
    expect(line).toMatchObject({ itemId: jeans.id, garmentIndex: jeansAt, field: 'leg' });
    const owner = jeans.name.charAt(0).toLowerCase() + jeans.name.slice(1);
    expect(line.lead).toBe(`Not sure about your ${owner}${/s$/.test(owner) ? "'" : "'s"} leg?`);
    expect(line.action).toBe('Tap.');
    // BX4: this photo read straight; earlier ones slim, wide, wide
    expect(line.href).toBe(`/sheets/correct/${checkId}?reason=detail&garment=${jeansAt}&only=slim,straight,wide`);
  });

  it('none without a Not sure piece, on a row "Not quite right?" lacks, or once settled', async () => {
    const env = await setup();
    const plain = await check(env, 's12');
    expect(await lineFor(env, plain)).toBeNull(); // BX8: no Not sure piece, nothing new on the card
    const { checkId, jeans } = await doubtful(env);
    const row = (await env.store.fitChecks.get(checkId))!;
    const garments = (await env.store.readings.get(row.readingId!))!.reading.garments;
    const unsure = garments.map((g): Garment => (g.category === 'bottom' ? { ...g, certainty: 'unsure' } : g));
    expect(cardLine(row, unsure, await env.store.closet.all(), await env.store.closetObs.all(), {})).toBeNull();
    await env.closet.editPiece(jeans.id, 'leg', 'straight');
    expect(await lineFor(env, checkId)).toBeNull();
  });

  it('is a statement with no score in it, and never on a read-only card', () => {
    const fl = src('features', 'closet', 'fitLine.ts');
    expect(fl).not.toMatch(/previewCorrection|\.score\b|rescore/); // it never looks at what a fix would score
    expect(src('features', 'closet', 'DoubtLine.tsx')).toMatch(/!readOnly &&/);
    expect(src('features', 'stylist', 'cards', 'FitCheckCard.tsx')).toMatch(/<DoubtLine row=\{row\} readOnly=\{readOnly\} \/>/);
  });
});

describe('BX4 the sheet offers only those values', () => {
  it('limits the row\'s chips, in their usual order', () => {
    const jeans: Garment = { category: 'bottom', subcategory: 'jeans', leg_shape: 'straight' };
    const opts = fitField(jeans)!.options;
    expect(limitTo(opts, ['slim', 'straight', 'wide']).map((o) => o.value)).toEqual(['slim', 'straight', 'wide']);
    expect(limitTo(opts, null).map((o) => o.value)).toEqual(['skinny', 'slim', 'straight', 'relaxed', 'wide']);
    const tee: Garment = { category: 'top', subcategory: 'tee', volume: 3 };
    expect(limitTo(fitField(tee)!.options, ['2', '4']).map((o) => o.value)).toEqual([2, 4]);
    // Since #346 (09 §22.7 F3) the row's groups come from detailGroups, which limits the Fit or Leg group.
    const sheet = src('features', 'correct', 'CorrectSheet.tsx');
    expect(sheet).toMatch(/detailGroups\(g, String\(i\) === p\.garment \? only : null\)/);
    expect(sheet).toMatch(/options: limitTo\(fit\.options, only\)/);
  });
});

// ---------------------------------------------------------------- BX5 the cap
describe('BX5 the line stops after a tap or 2 checks', () => {
  it('a tap stops it; 2 untapped checks stop a 3rd; the same check never counts twice', async () => {
    expect(LINE_MAX_SHOWN).toBe(2);
    let cap: LineCap = {};
    expect(lineAllowed(cap, 'J', 'C1')).toBe(true);
    cap = withShown(cap, 'J', 'C1');
    expect(withShown(cap, 'J', 'C1')).toBe(cap);
    cap = withShown(cap, 'J', 'C2');
    expect(lineAllowed(cap, 'J', 'C1')).toBe(true); // a check it showed on keeps it
    expect(lineAllowed(cap, 'J', 'C3')).toBe(false);
    expect(lineAllowed(withTapped({}, 'J'), 'J', 'C1')).toBe(false);
    expect(parseLineCap(JSON.stringify(cap))).toEqual(cap);
    expect(parseLineCap('nope')).toEqual({});
    expect(kvPolicy(FIT_LINE_KEY)).toBe('local');
    const env = await setup();
    const { checkId, jeans } = await doubtful(env);
    expect(await lineFor(env, checkId, withTapped({}, jeans.id))).toBeNull();
    expect(await lineFor(env, checkId, { [jeans.id]: { checks: ['A', 'B'], tapped: false } })).toBeNull();
  });
});

// ---------------------------------------------------------------- BX6 the answer log
describe('BX6 every answer is logged on the phone', () => {
  it('a pick (with where), a line tap and a scored fix each add one entry with the photos\' reads', async () => {
    const env = await setup();
    const { checkId, jeans, jeansAt } = await doubtful(env);
    await env.svc.saveCorrection(checkId, { garmentIndex: jeansAt, field: 'leg_shape', value: 'slim' });
    await logFitAnswer(env.store, await env.store.closetObs.all(), { at: env.clock.nowMs(), kind: 'lineTap', itemId: jeans.id, field: 'leg', checkId, value: null });
    await env.closet.editPiece(jeans.id, 'leg', 'straight', { via: 'card' });
    const log = parseFitLog(await env.store.getKv(FIT_LOG_KEY));
    expect(log.map((e) => [e.kind, e.via ?? null, e.field, e.value])).toEqual([['scoredFix', null, 'leg', 'slim'], ['lineTap', null, 'leg', null], ['pick', 'card', 'leg', 'straight']]);
    expect(log[0]!.reads).toEqual(['slim', 'wide', 'wide', 'straight']); // before the fix: this photo read straight
    expect(log[0]!.checkId).toBe(checkId);
    expect(log[2]!.reads).toEqual(['slim', 'wide', 'wide', 'slim']);
    expect(kvPolicy(FIT_LOG_KEY)).toBe('local');
  });

  it('keeps the newest 300', async () => {
    const env = await setup();
    for (let i = 0; i < FIT_LOG_MAX + 5; i++) await logFitAnswer(env.store, [], { at: i, kind: 'lineTap', itemId: 'J', field: 'leg', value: null });
    const log = parseFitLog(await env.store.getKv(FIT_LOG_KEY));
    expect(log).toHaveLength(FIT_LOG_MAX);
    expect(log[0]!.at).toBe(5);
  });
});

// ---------------------------------------------------------------- BX7 Outfits
describe('BX7 the fit card on Outfits too', () => {
  it('Outfits draws the same one card; the "Same as your …?" questions stay on Pieces', () => {
    const closet = src('app', '(tabs)', 'closet', 'index.tsx');
    expect(closet).toMatch(/segment === 'outfits' && fit \? \([\s\S]*?<FitQuestion item=\{fit\.item\} doubt=\{fit\.doubt\} \/>/);
    expect((closet.match(/<DuplicateQuestion/g) ?? []).length).toBe(1);
    expect(closet.indexOf('<DuplicateQuestion')).toBeGreaterThan(closet.indexOf("segment === 'pieces'"));
  });
});

// ---------------------------------------------------------------- BX10 words
describe('BX10 the new words', () => {
  it('pass the gate and the body-words rule', () => {
    expect([en['closet.unsure.lineLeg'], en['closet.unsure.lineFit'], en['closet.unsure.lineTap'], en['closet.unsure.a11y.lineHint']]).toEqual([
      'Not sure about your {owner} leg?', 'Not sure about your {owner} fit?', 'Tap.', 'Opens Not quite right? for this piece.',
    ]);
    for (const s of ["Not sure about your mid-wash jeans' leg? Tap.", "Not sure about your black tee's fit? Tap.", 'Opens Not quite right? for this piece.']) {
      expect(checkSentence(s, { allowedScores: new Set() })).toBeNull();
      expect(s).not.toMatch(/\b(on you|your body|frame|big on you|weight|belly|build)\b/i);
    }
  });
});
