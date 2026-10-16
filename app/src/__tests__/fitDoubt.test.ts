// How baggy a piece is, Group 1 (09-ui-review §18, #315; checks BG1–BG5 set before building). A piece seen in 3+
// checks whose readings fall in different groups the scores use shows "Not sure" on its Fit or Leg row, and Closet's
// To confirm holds at most one "How do your … fit?" card. A pick settles it the way §17's pick does; no score moves.
import { US_EASTERN, type Garment } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow, ClosetObservationRow } from '@/data/types';
import { checkSentence } from '@/features/ask/gate';
import {
  doubtLine, doubtQuestion, DOUBT_MIN_CHECKS, FIT_SKIP_KEY, fitCard, fitDoubt, parseSkips, withSkip,
} from '@/features/closet/fitDoubt';
import { editOptions, editPlan, editRows } from '@/features/closet/pieceEdit';
import { observationOfRow, sightingsOf } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import { en, t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { realScheduler } from '@/services/scheduler';
import { kvPolicy } from '@/sync/schema';

declare const __dirname: string;
const fs = jest.requireActual('fs') as {
  readFileSync(p: string, e: string): string;
  readdirSync(p: string): string[];
  statSync(p: string): { isDirectory(): boolean };
};
const path = jest.requireActual('path') as { join(...p: string[]): string; relative(a: string, b: string): string };

const at = (iso: string) => Date.parse(iso);
const T0 = at('2026-10-10T08:00:00-04:00');
const DAY = 86_400_000;

/** A piece as stored (only what fitDoubt reads matters). */
function item(id: string, slot: string, garment: Garment, o: Partial<ClosetItemRow> = {}): ClosetItemRow {
  return {
    id, name: 'Mid-wash jeans', slot, garment, confirmedFields: [], hex: '#556677', photoFile: null, demoPhotoId: null, isPhotographed: true,
    source: 'fitCheck', starterId: null, wornCount: 0, lastWornAt: null, addedAt: T0, isDeleted: false, mergedInto: null, maybeSameAs: null,
    cropFile: null, cropScore: null, updatedAt: T0, profile: { aliases: [], distinctFrom: [], confirmed: {} }, ...o,
  } as ClosetItemRow;
}
/** One sighting of a piece in check `check`, `day` days after T0. */
function sighting(itemId: string, check: string, day: number, g: Garment, o: Partial<ClosetObservationRow> = {}): ClosetObservationRow {
  return {
    id: `O-${itemId}-${check}-${day}`, itemId, fitCheckId: check, readingId: null, closetReadingId: null, garmentIndex: 1, origin: 'garment',
    garment: g, closet: null, sampledHex: null, sampledL: null, cropFile: null, cropQuality: null, decision: 'same', identityScore: null,
    candidates: [], askItemId: null, answeredAt: null, userConfirmed: null, createdAt: T0 + day * DAY, isDeleted: false, ...o,
  };
}
const jeans = (leg: string, volume = 3): Garment => ({ category: 'bottom', subcategory: 'jeans', color_family: 'denim_mid', leg_shape: leg, volume });
const tee = (volume: number): Garment => ({ category: 'top', subcategory: 'tee', color_family: 'black', volume, leg_shape: 'na' });
const legs = (id: string, ls: string[]) => ls.map((l, i) => sighting(id, `FC-${i}`, i, jeans(l)));
const vols = (id: string, vs: number[]) => vs.map((v, i) => sighting(id, `FC-${i}`, i, tee(v)));

// ---------------------------------------------------------------- BG1 when "Not sure" shows
describe('BG1 "Not sure" shows exactly when its own photos disagree', () => {
  const B = item('B', 'bottom', jeans('slim'));
  const T = item('T', 'top', tee(3), { name: 'Black tee' });

  it('a leg seen as narrow and loose across 3+ checks is Not sure, named in narrow-to-loose order', () => {
    // his mid-wash jeans (§18.2): slim 3, straight 2, relaxed 1, wide 3
    const d = fitDoubt(B, legs('B', ['relaxed', 'straight', 'straight', 'slim', 'wide', 'wide', 'slim', 'slim', 'wide']));
    expect(d).toMatchObject({ field: 'leg', a: 'slim', b: 'wide', checks: 9 });
    expect(doubtLine(d!)).toBe('Seen as slim and as wide. Which is it?');
  });

  it('spans of 2+ leg groups count; one group does not, however its words differ', () => {
    expect(fitDoubt(B, legs('B', ['slim', 'slim', 'straight']))).not.toBeNull();       // narrow + straight
    expect(fitDoubt(B, legs('B', ['straight', 'relaxed', 'straight']))).not.toBeNull(); // straight + loose
    expect(fitDoubt(B, legs('B', ['skinny', 'slim', 'slim']))).toBeNull();              // all narrow
    expect(fitDoubt(B, legs('B', ['relaxed', 'wide', 'barrel', 'wide']))).toBeNull();   // all loose
    expect(fitDoubt(B, legs('B', ['straight', 'flare_bootcut', 'straight']))).toBeNull(); // flare is the straight group
  });

  it('a Fit is Not sure only across roomy (4–5) and not (3 or less)', () => {
    // his black tee (§18.2): roomy in 4 checks, fitted in one
    const d = fitDoubt(T, vols('T', [4, 4, 2, 4, 4]));
    expect(d).toMatchObject({ field: 'fit', a: 'slim', b: 'relaxed', checks: 5 });
    expect(fitDoubt(T, vols('T', [2, 3, 3, 1]))).toBeNull();   // 1–3: never roomy
    expect(fitDoubt(T, vols('T', [4, 5, 5]))).toBeNull();      // 4 vs 5 never moves a score
    expect(fitDoubt(T, vols('T', [3, 3, 4]))).not.toBeNull();
  });

  it('never with 2 checks or fewer; a re-check of the same photo counts once; seed and undone sightings never count', () => {
    expect(DOUBT_MIN_CHECKS).toBe(3);
    expect(fitDoubt(B, legs('B', ['slim', 'wide']))).toBeNull();
    const same = [sighting('B', 'FC-0', 0, jeans('slim')), sighting('B', 'FC-0', 0.1, jeans('wide')), sighting('B', 'FC-1', 1, jeans('slim'))];
    expect(fitDoubt(B, same)).toBeNull();
    const extra = [sighting('B', 'S', 0, jeans('wide'), { origin: 'seed', fitCheckId: null }), sighting('B', 'U', 0, jeans('wide'), { decision: 'undone' }), sighting('B', 'D', 0, jeans('wide'), { isDeleted: true })];
    expect(fitDoubt(B, [...legs('B', ['slim', 'slim']), ...extra])).toBeNull();
    // another piece's sightings are never his
    expect(fitDoubt(B, legs('X', ['slim', 'wide', 'wide']))).toBeNull();
  });

  it('never once he has set it (the piece page or "Not quite right?"), and never on shoes or shorts', () => {
    const disagree = legs('B', ['slim', 'wide', 'wide']);
    expect(fitDoubt({ ...B, confirmedFields: ['leg_shape'] }, disagree)).toBeNull();
    expect(fitDoubt({ ...B, profile: { aliases: [], distinctFrom: [], confirmed: { leg_shape: 'wide' } } }, disagree)).toBeNull();
    expect(fitDoubt({ ...T, confirmedFields: ['volume'] }, vols('T', [4, 4, 2]))).toBeNull();
    const shorts = item('SH', 'bottom', { ...jeans('slim'), subcategory: 'shorts' });
    expect(fitDoubt(shorts, legs('SH', ['slim', 'wide', 'wide']))).toBeNull();
    const shoe = item('S', 'shoes', { category: 'footwear', subcategory: 'chelsea_boot', volume: 3 });
    expect(fitDoubt(shoe, [3, 5, 5].map((v, i) => sighting('S', `FC-${i}`, i, { category: 'footwear', subcategory: 'chelsea_boot', volume: v })))).toBeNull();
  });

  it('the row reads "Not sure" with the line; nothing is ringed in its sheet; the other rows are unchanged', () => {
    const d = fitDoubt(B, legs('B', ['slim', 'wide', 'wide']))!;
    const plain = editRows(B);
    const rows = editRows(B, d);
    expect(rows.find((r) => r.field === 'leg')).toEqual({ field: 'leg', label: 'Leg', value: 'Not sure', detail: 'Seen as slim and as wide. Which is it?' });
    expect(rows.filter((r) => r.field !== 'leg')).toEqual(plain.filter((r) => r.field !== 'leg'));
    expect(editOptions(B, 'leg', { unsure: true }).main.every((o) => !o.current)).toBe(true);
    expect(editOptions(B, 'leg').main.filter((o) => o.current).map((o) => o.value)).toEqual(['slim']);
  });
});

// ---------------------------------------------------------------- BG2 the one To confirm card
describe('BG2 Closet asks about one piece at a time', () => {
  const B = item('B', 'bottom', jeans('slim'));
  const C = item('C', 'bottom', { ...jeans('straight'), color_family: 'black' }, { name: 'Black jeans' });
  const T = item('T', 'top', tee(3), { name: 'Black tee' });
  const obs = [...legs('B', ['slim', 'wide', 'wide']), ...legs('C', ['straight', 'wide', 'slim', 'wide']), ...vols('T', [4, 4, 2])];

  it('at most one card: the doubtful piece seen in the most checks', () => {
    expect(fitCard([B, C, T], obs, {})?.item.id).toBe('C');
    // a tie on checks: the newest photo first, then the id
    expect(fitCard([B, T], obs, {})?.item.id).toBe('B');
    const later = [...legs('B', ['slim', 'wide', 'wide']), ...vols('T', [4, 4, 2]).map((o) => ({ ...o, createdAt: o.createdAt + 5 * DAY }))];
    expect(fitCard([B, T], later, {})?.item.id).toBe('T');
    expect(fitCard([item('Z', 'bottom', jeans('slim'))], obs, {})).toBeNull();
  });

  it('the question names the piece: "do" for a pair, "does" for a top', () => {
    expect(doubtQuestion(fitDoubt(B, obs)!, 'Mid-wash jeans')).toBe('How do your mid-wash jeans fit?');
    expect(doubtQuestion(fitDoubt(T, obs)!, 'Black tee')).toBe('How does your black tee fit?');
  });

  it('Skip hides it, and the next piece comes in; a newer photo that disagrees brings it back', () => {
    const d = fitDoubt(C, obs)!;
    const skipAt = T0 + 10 * DAY;
    const skips = parseSkips(withSkip({}, 'C', d, skipAt));
    expect(skips).toEqual({ C: { at: skipAt, group: 'loose' } });
    expect(fitCard([B, C], obs, skips)?.item.id).toBe('B');
    // a newer photo that agrees with what it was seen as most (loose): still quiet
    const agree = [...obs, sighting('C', 'FC-9', 11, jeans('relaxed'))];
    expect(fitCard([C], agree, skips)).toBeNull();
    // a newer photo that disagrees: back
    const disagree = [...obs, sighting('C', 'FC-9', 11, jeans('slim'))];
    expect(fitCard([C], disagree, skips)?.item.id).toBe('C');
    // an old photo never brings it back
    expect(fitCard([C], [...obs, sighting('C', 'FC-8', 5, jeans('slim'))], skips)).toBeNull();
  });

  it('bad skip data reads as none; the skips stay on this phone', () => {
    expect(parseSkips('nope')).toEqual({});
    expect(parseSkips('[1]')).toEqual({});
    expect(parseSkips(JSON.stringify({ C: { at: 'x' } }))).toEqual({});
    expect(kvPolicy(FIT_SKIP_KEY)).toBe('local');
  });

  it('never on a score card: only the Closet screen and its card use the card', () => {
    const root = path.join(__dirname, '..');
    const users: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) { if (f !== '__tests__') walk(p); continue; }
        if (/\.tsx?$/.test(f) && /\bFitQuestion\b|\bfitCard\(/.test(fs.readFileSync(p, 'utf8'))) users.push(path.relative(root, p));
      }
    };
    walk(root);
    expect(users.sort()).toEqual(['app/(tabs)/closet/index.tsx', 'features/closet/FitQuestion.tsx', 'features/closet/fitDoubt.ts']);
  });
});

// ---------------------------------------------------------------- BG3 a pick settles it, no score moves
async function setup() {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids: counterIds(), source: createMockClosetSource(), measure: async () => new Map() });
  return { store, closet };
}
const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : 1));
async function untouchable(store: KittedStore) {
  const checks = byId(await store.fitChecks.all()).map((c) => [c.id, c.score, c.rawScore, c.subscores, c.readingId, c.itemIds, c.details.closetSummary ?? null]);
  return { checks, readings: byId(await store.readings.all()), obs: byId(await store.closetObs.all()) };
}

describe('BG3 a pick from the row or the card writes what §17 writes and moves no score', () => {
  it('the value it read most settles the Leg too (the row was Not sure), and Not sure goes', async () => {
    const { store, closet } = await setup();
    for (const o of legs('B3', ['slim', 'wide', 'wide'])) await store.closetObs.put(o);
    const before = await untouchable(store);
    const it0 = (await store.closet.get('B3'))!;
    expect(fitDoubt(it0, await store.closetObs.all())).not.toBeNull();
    const want = editPlan(it0, 'leg', 'slim', sightingsOf('B3', await store.closetObs.all()).map(observationOfRow)).patch;
    const r = await closet.editPiece('B3', 'leg', 'slim'); // its current value: written, since the row was Not sure
    expect(r).not.toBeNull();
    const after = (await store.closet.get('B3'))!;
    expect({ garment: after.garment, confirmedFields: after.confirmedFields, starterId: after.starterId }).toEqual({ garment: want.garment, confirmedFields: want.confirmedFields, starterId: want.starterId });
    expect(after.profile?.confirmed?.leg_shape).toBe('slim');
    expect(after.profile?.fieldAliases?.leg_shape).toEqual(['slim', 'wide']); // the reads he corrected away from, taught
    expect(fitDoubt(after, await store.closetObs.all())).toBeNull();
    expect(await untouchable(store)).toEqual(before);
    await closet.restoreEdit(r!.undo);
    expect(await store.closet.get('B3')).toEqual(it0);
    expect(fitDoubt(it0, await store.closetObs.all())).not.toBeNull();
    expect(await untouchable(store)).toEqual(before);
  });

  it('a Fit pick lists volume as his (as "Not quite right?" does), and Not sure goes for good', async () => {
    const { store, closet } = await setup();
    for (const o of vols('T5', [4, 4, 2])) await store.closetObs.put(o);
    const before = await untouchable(store);
    const r = await closet.editPiece('T5', 'fit', 4);
    expect(r).not.toBeNull();
    const after = (await store.closet.get('T5'))!;
    expect(after.garment.volume).toBe(4);
    expect(after.confirmedFields).toContain('volume');
    expect(fitDoubt(after, [...(await store.closetObs.all()), sighting('T5', 'FC-7', 30, tee(2))])).toBeNull();
    expect(await untouchable(store)).toEqual(before);
  });

  it('a piece that is not Not sure still ignores a pick of its current value (§17 X12)', async () => {
    const { closet } = await setup();
    expect(await closet.editPiece('B3', 'leg', 'slim')).toBeNull();
  });
});

// ---------------------------------------------------------------- BG4 no numbers in the Fit and Leg sheets
describe('BG4 the Fit and Leg sheets show no score, number or "+N"', () => {
  it('no digit or "+" in any option, subtitle or Not sure line', () => {
    const B = item('B', 'bottom', jeans('slim'));
    const T = item('T', 'top', tee(3));
    const d = fitDoubt(B, legs('B', ['slim', 'wide', 'wide']))!;
    const words = [
      ...editOptions(B, 'leg').main.map((o) => o.label), ...editOptions(T, 'fit').main.map((o) => o.label),
      t('closet.edit.sub'), doubtLine(d), doubtLine(fitDoubt(T, vols('T', [4, 4, 2]))!),
    ];
    for (const w of words) expect(w).not.toMatch(/[0-9+]/);
  });
  it('the sheet draws no score: EditSheet uses no Numeral, score or outfit count', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'features', 'closet', 'EditSheet.tsx'), 'utf8');
    expect(src).not.toMatch(/Numeral|\.score\b|outfitCount|outfitGain|\+\{/);
  });
});

// ---------------------------------------------------------------- BG5 words
describe('BG5 the new words', () => {
  const KEYS = ['closet.unsure.value', 'closet.unsure.seen', 'closet.unsure.which', 'closet.unsure.askLeg', 'closet.unsure.askFit', 'closet.unsure.a11y.hint'] as const;
  it('are the ones he OK\'d, and pass the gate and the body-words rule', () => {
    expect(KEYS.map((k) => en[k])).toEqual([
      'Not sure', 'Seen as {a} and as {b}.', 'Which is it?', 'How do your {item} fit?', 'How does your {item} fit?', 'Opens the choices. Your scores stay the same.',
    ]);
    const filled = [
      'Not sure', 'Seen as slim and as wide.', 'Which is it?', 'How do your mid-wash jeans fit?', 'How does your black tee fit?',
      'Opens the choices. Your scores stay the same.',
    ];
    for (const s of filled) {
      expect(checkSentence(s, { allowedScores: new Set() })).toBeNull();
      expect(s).not.toMatch(/\b(on you|your body|frame|big on you|weight|belly|build)\b|[\u{1F300}-\u{1FAFF}]/iu);
    }
  });
});
