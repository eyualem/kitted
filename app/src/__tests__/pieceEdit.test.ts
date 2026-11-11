// Fix what a piece is (09-ui-review §17, #315; checks X1–X14 set before building). On a piece's page, "What it is"
// shows Kind · Color · Leg or Fit · Pattern; a row opens pictures of the piece with that one thing changed, one tap
// picks: the piece's reading takes his value as confirmed, the matcher learns the read he corrected away from, the
// drawing and an app-made name follow, and Undo puts every row back. No fit check's score, reading or sighting moves.
import {
  FLIP_PAIRS, identity, knownMatches, profileFromClosetItem, RUBRIC_DATA, US_EASTERN, type Garment,
} from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow } from '@/data/types';
import { checkSentence } from '@/features/ask/gate';
import { buildStylistContext } from '@/features/ask/context';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { artSpec } from '@/features/closet/artSpec';
import { renderFlat } from '@/features/closet/flats';
import { outfitCount } from '@/features/closet/outfits';
import { nextBestBuy } from '@/features/finish/gains';
import {
  editOptions, editRows, editToast, KIND_MAIN, KIND_MORE, optionA11y, rowA11y, withEdit, type EditField,
} from '@/features/closet/pieceEdit';
import { isOwned, knownPieces, observationOfRow, profileOfItem, sightingsOf } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import { markedPiece, ownership, STARTER } from '@/features/finish/starter';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { en, t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import type { GarmentMeasurer, MeasuredPieces } from '@/services/measure/garments';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import { dataToRow, rowToData } from '@/sync/codec';
import { KV_LOCAL } from '@/sync/schema';

const at = (iso: string) => Date.parse(iso);

/** A cut-out per boxed piece, measured light grey, and a head where the phone found it (as wrongCard's tests). */
const measure: GarmentMeasurer = async (check, pieces) => {
  const out: MeasuredPieces = new Map(pieces.map((p) => [p.key, { sampledHex: '#9a9da3', sampledL: 65, cropFile: `closet/${check.imageHash.slice(0, 6)}-${p.key}.png`, cropQuality: 0.8 }]));
  out.heads = [[120, 380, 300, 620]];
  return out;
};

async function setup(o: { only?: string[] | 'all' } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  if (o.only !== 'all') {
    const only = o.only ?? [];
    for (const c of await store.closet.all()) if (!only.includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
  }
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource(), measure });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, clock, closet, svc, ids };
}
type Env = Awaited<ReturnType<typeof setup>>;

/** A check of a demo photo, its closet written. */
async function check(env: Env, photoId: string) {
  env.clock.advance(60 * 60_000);
  const r = (await env.svc.start({ mode: 'check', photoId, occasion: 'everyday' })) as { checkId: string };
  await env.closet.settle();
  return r.checkId;
}
/** s12 (a grey hoodie, mid-wash straight jeans, runners) on an empty closet: its hoodie and jeans become pieces. */
async function s12Pieces(env: Env) {
  const checkId = await check(env, 's12');
  const owned = (await env.store.closet.all()).filter(isOwned);
  const hoodie = owned.find((c) => c.garment.subcategory === 'hoodie');
  const jeans = owned.find((c) => c.garment.subcategory === 'jeans');
  if (!hoodie || !jeans) throw new Error('s12 made no hoodie or jeans piece');
  return { checkId, hoodie, jeans };
}

const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : 1));
async function tables(store: KittedStore) {
  return { closet: byId(await store.closet.all()), obs: byId(await store.closetObs.all()), checks: byId(await store.fitChecks.all()), readings: byId(await store.readings.all()) };
}
/** What must never move (X9): every check's scores and closet summary, every reading, every sighting. */
async function untouchable(store: KittedStore) {
  const t0 = await tables(store);
  return {
    checks: t0.checks.map((c) => [c.id, c.score, c.rawScore, c.subscores, c.readingId, c.itemIds, c.details.closetSummary ?? null]),
    readings: t0.readings, obs: t0.obs,
  };
}
const piece = async (store: KittedStore, id: string) => (await store.closet.get(id))!;
const draw = (it: Pick<ClosetItemRow, 'garment' | 'hex' | 'art' | 'name'>, scheme: 'light' | 'dark' = 'light') =>
  renderFlat(artSpec(it).flat, { scheme, id: 'x' });
const values = (field: EditField, it: ClosetItemRow) => {
  const o = editOptions(it, field);
  return { main: o.main.map((x) => x.value), more: o.more.map((x) => x.value) };
};
const lookAlikes = (sub: string, cat: string) => [
  ...FLIP_PAIRS.flatMap(([a, b]) => (a === sub ? [b] : b === sub ? [a] : [])),
  ...(RUBRIC_DATA.tap.pairs[cat] ?? []).flatMap(([a, b]) => (a === sub ? [b] : b === sub ? [a] : [])),
];

// ---------------------------------------------------------------- X1 the lists
describe('X1 the lists', () => {
  it('each slot offers exactly the first group and More kinds, never another slot', async () => {
    const env = await setup({ only: 'all' });
    const want: Record<string, string> = { top: 'T2', outer: 'L1', bottom: 'B1', shoes: 'S1' };
    const slotOf: Record<string, string[]> = { top: [...KIND_MAIN.top, ...KIND_MORE.top], outer: [...KIND_MAIN.outer, ...KIND_MORE.outer], bottom: [...KIND_MAIN.bottom, ...KIND_MORE.bottom], shoes: [...KIND_MAIN.shoes, ...KIND_MORE.shoes] };
    expect([...KIND_MAIN.top]).toEqual(['tee', 'long_sleeve_tee', 'graphic_tee', 'polo', 'button_up_shirt', 'short_sleeve_shirt', 'sweater', 'sweatshirt', 'hoodie']);
    expect([...KIND_MORE.top]).toEqual([
      'flannel_shirt', 'oxford_shirt', 'henley', 'turtleneck', 'tank_top', 'dress_shirt', 'camp_collar_shirt', 'knit_polo', 'quarter_zip', 'cardigan',
      'rugby_shirt', 'jersey', 'fleece', 'zip_hoodie', 'overshirt', 'denim_jacket', 'chore_coat',
    ]);
    expect([...KIND_MAIN.outer]).toEqual(['overshirt', 'denim_jacket', 'bomber', 'field_jacket', 'blazer', 'puffer', 'overcoat', 'hoodie', 'zip_hoodie']);
    expect([...KIND_MORE.outer]).toEqual([
      'chore_coat', 'sweatshirt', 'quarter_zip', 'cardigan', 'flannel_shirt', 'button_up_shirt', 'fleece', 'leather_jacket', 'rain_jacket', 'shell_jacket',
      'sport_coat', 'suit_jacket', 'camp_collar_shirt',
    ]);
    expect([...KIND_MAIN.bottom]).toEqual(['jeans', 'chinos', 'trousers', 'cargos', 'sweatpants', 'shorts', 'jorts']);
    expect([...KIND_MORE.bottom]).toEqual(['joggers', 'athletic_shorts', 'drawstring_trousers', 'suit_trousers']);
    expect([...KIND_MAIN.shoes]).toEqual(['white_leather_sneaker', 'canvas_sneaker', 'retro_runner', 'chunky_sneaker', 'work_boot', 'chelsea_boot', 'loafer', 'slides_sandals']);
    expect([...KIND_MORE.shoes]).toEqual(['low_profile_sneaker', 'basketball_sneaker', 'performance_runner', 'suede_chukka', 'derby', 'dress_shoe']);
    for (const [slot, id] of Object.entries(want)) {
      const it = await piece(env.store, id);
      const v = values('kind', it);
      const sub = String(it.garment.subcategory);
      const extra = [sub, ...lookAlikes(sub, String(it.garment.category))].filter((s) => !KIND_MAIN[slot as keyof typeof KIND_MAIN].includes(s));
      expect(v.main).toEqual([...KIND_MAIN[slot as keyof typeof KIND_MAIN], ...[...new Set(extra)]]);
      expect(v.more).toEqual(KIND_MORE[slot as keyof typeof KIND_MORE].filter((s) => !v.main.includes(s)));
      for (const s of [...v.main, ...v.more]) expect(slotOf[slot]).toContain(s);
    }
  });

  it('a piece whose kind is only in More, or a look-alike, shows in the first group', async () => {
    const env = await setup({ only: ['B3'] });
    await env.store.closet.patch('B3', { garment: { ...(await piece(env.store, 'B3')).garment, subcategory: 'joggers' } });
    const v = values('kind', await piece(env.store, 'B3'));
    expect(v.main).toContain('joggers');
    expect(v.main).toContain('jeans'); // joggers ↔ jeans look-alike
    expect(v.more).not.toContain('joggers');
  });

  it('Leg, Fit, Pattern and Color offer exactly their values', async () => {
    const env = await setup({ only: 'all' });
    expect(values('leg', await piece(env.store, 'B3')).main).toEqual(['skinny', 'slim', 'straight', 'relaxed', 'wide']);
    expect(values('fit', await piece(env.store, 'T2')).main).toEqual([2, 3, 4, 5]);
    expect(values('pattern', await piece(env.store, 'T2')).main).toEqual(['solid', 'stripes', 'checks_plaid', 'graphic']);
    const colors = editOptions(await piece(env.store, 'B3'), 'color');
    expect(colors.groups!.map((g) => g.title)).toEqual([t('closet.edit.color.blues'), t('closet.edit.color.neutrals'), t('closet.edit.color.earth'), t('closet.edit.color.colors')]);
    expect(colors.main.map((o) => o.value)).toEqual([
      'denim_light', 'denim_mid', 'denim_dark', 'navy', 'light_blue', 'blue',
      'white', 'off_white_cream', 'light_grey', 'grey', 'charcoal', 'black',
      'khaki_beige', 'tan_camel', 'brown', 'olive', 'sage',
      'green', 'burgundy', 'red', 'orange', 'yellow', 'pink', 'purple',
    ]);
    expect(colors.main.map((o) => o.value)).not.toContain('multicolor');
    // a camo piece shows its own pattern too
    const t2 = await piece(env.store, 'T2');
    expect(values('pattern', { ...t2, garment: { ...t2.garment, pattern: 'camo' } }).main).toEqual(['solid', 'stripes', 'checks_plaid', 'graphic', 'camo']);
  });

  it('no option label names a brand or a body', async () => {
    const env = await setup({ only: 'all' });
    for (const c of (await env.store.closet.all()).filter(isOwned)) {
      for (const r of editRows(c)) {
        const o = editOptions(c, r.field);
        for (const x of [...o.main, ...o.more]) {
          const rule = checkSentence(x.label, { allowedScores: new Set() });
          expect([x.label, rule]).not.toEqual([x.label, 'brand']);
          expect([x.label, rule]).not.toEqual([x.label, 'body']);
        }
      }
    }
  });
});

// ---------------------------------------------------------------- X2 the rows
describe('X2 the rows', () => {
  it('rows by slot, no Leg for shorts', async () => {
    const env = await setup({ only: 'all' });
    const fields = async (id: string) => editRows(await piece(env.store, id)).map((r) => r.field);
    expect(await fields('T2')).toEqual(['kind', 'color', 'fit', 'pattern']);
    expect(await fields('L1')).toEqual(['kind', 'color', 'fit', 'pattern']);
    expect(await fields('B3')).toEqual(['kind', 'color', 'leg']);
    expect(await fields('S1')).toEqual(['kind', 'color']);
    const b1 = await piece(env.store, 'B1');
    expect(editRows({ ...b1, garment: { ...b1.garment, subcategory: 'shorts' } }).map((r) => r.field)).toEqual(['kind', 'color']);
    expect(editRows({ ...b1, garment: { ...b1.garment, subcategory: 'athletic_shorts' } }).map((r) => r.field)).toEqual(['kind', 'color']);
    const row = editRows(await piece(env.store, 'B3'));
    expect(row.map((r) => [r.label, r.value])).toEqual([[t('closet.edit.kind'), 'Jeans'], [t('closet.edit.color'), 'Dark-wash denim'], [t('closet.edit.leg'), 'Slim']]);
  });

  it('denim washes only for jeans and denim jackets, or as the current value', async () => {
    const env = await setup({ only: 'all' });
    const denim = (it: ClosetItemRow) => editOptions(it, 'color').main.map((o) => o.value).filter((v) => String(v).startsWith('denim'));
    expect(denim(await piece(env.store, 'B3'))).toEqual(['denim_light', 'denim_mid', 'denim_dark']);
    expect(denim(await piece(env.store, 'L3'))).toEqual(['denim_light', 'denim_mid', 'denim_dark']);
    expect(denim(await piece(env.store, 'B1'))).toEqual([]);
    const b1 = await piece(env.store, 'B1');
    expect(denim({ ...b1, garment: { ...b1.garment, color_family: 'denim_mid' } })).toEqual(['denim_mid']);
  });
});

// ---------------------------------------------------------------- X3 what a pick writes
describe('X3 what a pick writes', () => {
  it('a leg pick writes the leg as his, the taught reads, the drawing and the time; nothing else', async () => {
    const env = await setup();
    const { jeans } = await s12Pieces(env);
    const before = await piece(env.store, jeans.id);
    env.clock.advance(5_000);
    const r = await env.closet.editPiece(jeans.id, 'leg', 'relaxed');
    expect(r).not.toBeNull();
    const after = await piece(env.store, jeans.id);
    expect(after.garment).toEqual({ ...before.garment, leg_shape: 'relaxed' });
    expect(after.confirmedFields).toEqual([...new Set([...before.confirmedFields, 'leg_shape'])]);
    const pb = profileOfItem(before), pa = profileOfItem(after);
    expect(pa.confirmed).toEqual({ ...pb.confirmed, leg_shape: 'relaxed' });
    expect(pa.fieldAliases?.leg_shape).toEqual(['relaxed', 'straight']);
    expect({ ...pa, confirmed: pb.confirmed, fieldAliases: pb.fieldAliases }).toEqual(pb);
    expect(after.updatedAt).toBe(env.clock.nowMs());
    const rest = (x: ClosetItemRow) => {
      const { garment: _g, confirmedFields: _c, profile: _p, art: _a, hex: _h, name: _n, shade: _s, updatedAt: _u, ...o } = x;
      return o;
    };
    expect(rest(after)).toEqual(rest(before));
  });

  it('a kind pick confirms the kind and teaches the old read as an alias', async () => {
    const env = await setup();
    const { hoodie } = await s12Pieces(env);
    await env.closet.editPiece(hoodie.id, 'kind', 'sweatshirt');
    const after = await piece(env.store, hoodie.id);
    expect(after.garment.subcategory).toBe('sweatshirt');
    expect(after.confirmedFields).toContain('subcategory');
    expect(profileOfItem(after).confirmed.subcategory).toBe('sweatshirt');
    expect(profileOfItem(after).aliases).toEqual(['hoodie']);
    expect(after.slot).toBe(hoodie.slot);
    expect(after.garment.category).toBe(hoodie.garment.category);
  });

  it('a fit pick writes the volume only', async () => {
    const env = await setup({ only: ['T2'] });
    const before = await piece(env.store, 'T2');
    await env.closet.editPiece('T2', 'fit', 5);
    const after = await piece(env.store, 'T2');
    expect(after.garment).toEqual({ ...before.garment, volume: 5 });
    // Amended by §18 (#316), openly: a Fit pick now lists 'volume' as his, as a "Not quite right?" fit correction
    // already did, so a "Not sure" Fit goes for good. Core reads only its matcher fields there (volume isn't one).
    expect(after.confirmedFields).toEqual([...before.confirmedFields, 'volume']);
  });
});

// ---------------------------------------------------------------- X4 the drawing follows
describe('X4 the drawing follows', () => {
  it('hoodie → sweatshirt draws a crew with no hood; straight → relaxed draws the relaxed leg', async () => {
    const env = await setup();
    const { hoodie, jeans } = await s12Pieces(env);
    expect(artSpec(hoodie).flat).toMatchObject({ kind: 'top', type: 'hoodie' });
    await env.closet.editPiece(hoodie.id, 'kind', 'sweatshirt');
    const h = artSpec(await piece(env.store, hoodie.id)).flat;
    expect(h).toMatchObject({ kind: 'top', type: 'crew' });
    expect((h as { details?: { drawstrings?: boolean; pouch?: boolean } }).details).toMatchObject({ drawstrings: false, pouch: false });
    await env.closet.editPiece(jeans.id, 'leg', 'relaxed');
    expect(artSpec(await piece(env.store, jeans.id)).flat).toMatchObject({ kind: 'bottom', fit: 'relaxed' });
  });

  it('a pattern pick beats what the photos read; a color pick from another family drops the measured color', async () => {
    const env = await setup();
    const { hoodie } = await s12Pieces(env);
    expect(hoodie.art?.measured).toBeTruthy();
    await env.closet.editPiece(hoodie.id, 'pattern', 'stripes');
    expect(artSpec(await piece(env.store, hoodie.id)).flat).toMatchObject({ pattern: { type: 'stripes' } });
    await env.closet.editPiece(hoodie.id, 'color', 'navy');
    const after = await piece(env.store, hoodie.id);
    expect(after.art?.family).toBe('navy');
    expect(after.art?.measured).toBeUndefined();
    const fresh = withEdit({ ...after, art: { ...after.art!, measured: undefined } }, 'color', 'navy');
    expect(after.hex).toBe(fresh.hex);
  });

  it('the picture of an option is the piece as it would be after that pick', async () => {
    const env = await setup();
    const { jeans } = await s12Pieces(env);
    const preview = withEdit(jeans, 'leg', 'wide');
    await env.closet.editPiece(jeans.id, 'leg', 'wide');
    expect(draw(await piece(env.store, jeans.id))).toBe(draw(preview));
  });
});

// ---------------------------------------------------------------- X5 the pictures differ
describe('X5 the pictures differ', () => {
  it('within each first group every option draws differently, light and dark', async () => {
    const env = await setup({ only: 'all' });
    const base: Record<string, string> = { top: 'T2', outer: 'L2', bottom: 'B3', shoes: 'S1' };
    for (const [slot, id] of Object.entries(base)) {
      const it = await piece(env.store, id);
      const group = KIND_MAIN[slot as keyof typeof KIND_MAIN];
      for (const scheme of ['light', 'dark'] as const) {
        const seen = new Map<string, string>();
        for (const v of group) {
          const svg = draw(withEdit(it, 'kind', v), scheme);
          expect([slot, v, seen.get(svg) ?? null]).toEqual([slot, v, null]);
          seen.set(svg, v);
        }
      }
    }
    for (const [field, id] of [['leg', 'B3'], ['fit', 'T2'], ['pattern', 'T2']] as const) {
      const it = await piece(env.store, id);
      for (const scheme of ['light', 'dark'] as const) {
        const svgs = editOptions(it, field).main.map((o) => draw(withEdit(it, field, o.value), scheme));
        expect(new Set(svgs).size).toBe(svgs.length);
      }
    }
  });
});

// ---------------------------------------------------------------- X6 the name
describe('X6 the name', () => {
  it('an app-made name follows the kind and the pattern; a leg pick leaves it; his own name stays', async () => {
    const env = await setup({ only: ['B3', 'T2'] });
    const { hoodie, jeans } = await s12Pieces(env);
    // the app named it from the closet call: shade, logo word, kind
    expect(hoodie.name).toBe('Heather grey Nike hoodie');
    await env.closet.editPiece(hoodie.id, 'kind', 'sweatshirt');
    expect((await piece(env.store, hoodie.id)).name).toBe('Heather grey Nike sweatshirt');
    await env.closet.editPiece('T2', 'pattern', 'stripes');
    expect((await piece(env.store, 'T2')).name).toMatch(/^(Heather )?[Gg]rey striped tee$/); // the seed's name was the app's: it follows
    const was = (await piece(env.store, 'B3')).name;
    await env.closet.editPiece('B3', 'leg', 'relaxed');
    expect((await piece(env.store, 'B3')).name).toBe(was);
    await env.closet.renameItem(jeans.id, 'My weekend jeans');
    await env.closet.editPiece(jeans.id, 'kind', 'chinos');
    await env.closet.editPiece(jeans.id, 'leg', 'wide');
    expect((await piece(env.store, jeans.id)).name).toBe('My weekend jeans');
  });
});

// ---------------------------------------------------------------- X7 it sticks
describe('X7 it sticks', () => {
  it('later photos that read the old kind and leg still find the piece and never flip it back', async () => {
    const env = await setup();
    const { hoodie, jeans } = await s12Pieces(env);
    const sightBefore = sightingsOf(hoodie.id, await env.store.closetObs.all()).map(observationOfRow);
    const scoreBefore = identity(sightBefore[0]!, profileFromClosetItem(hoodie as never, { sightings: sightBefore })).score;
    const legSightBefore = sightingsOf(jeans.id, await env.store.closetObs.all()).map(observationOfRow);
    const legScoreBefore = identity(legSightBefore[0]!, profileFromClosetItem(jeans as never, { sightings: legSightBefore })).score;
    await env.closet.editPiece(hoodie.id, 'kind', 'sweatshirt');
    await env.closet.editPiece(jeans.id, 'leg', 'relaxed');
    for (let i = 0; i < 3; i++) {
      const id = await check(env, 's12');
      const links = (await env.store.fitChecks.get(id))!.details.closetSummary!.links ?? [];
      expect(links.map((l) => l.itemId)).toEqual(expect.arrayContaining([hoodie.id, jeans.id]));
      const h = await piece(env.store, hoodie.id);
      const j = await piece(env.store, jeans.id);
      expect([h.garment.subcategory, h.art?.family, h.art?.pattern ?? 'solid']).toEqual(['sweatshirt', 'grey', 'solid']);
      expect(j.garment.leg_shape).toBe('relaxed');
      const hs = sightingsOf(h.id, await env.store.closetObs.all()).map(observationOfRow);
      const last = hs[hs.length - 1]!;
      const res = identity(last, profileFromClosetItem(h as never, { sightings: hs.slice(0, -1), ...profileExtra(h) }));
      expect(res.vetoes).toEqual([]);
      expect(res.score).toBeGreaterThanOrEqual(scoreBefore);
      const js = sightingsOf(j.id, await env.store.closetObs.all()).map(observationOfRow);
      const jr = identity(js[js.length - 1]!, profileFromClosetItem(j as never, { sightings: js.slice(0, -1), ...profileExtra(j) }));
      expect(jr.vetoes).toEqual([]);
      expect(jr.score).toBeGreaterThanOrEqual(legScoreBefore);
    }
    expect((await env.store.closet.all()).filter(isOwned).filter((c) => c.slot === 'top')).toHaveLength(1);
  });

  it('a piece he said is never the same stays apart after a pick', async () => {
    const env = await setup({ only: ['T2', 'T5'] });
    const t2 = await piece(env.store, 'T2');
    await env.store.closet.patch('T2', { profile: { ...profileOfItem(t2), distinctFrom: ['T5'] } });
    await env.closet.editPiece('T2', 'color', 'black');
    expect(profileOfItem(await piece(env.store, 'T2')).distinctFrom).toEqual(['T5']);
  });
});
const profileExtra = (it: ClosetItemRow) => {
  const p = profileOfItem(it);
  return { aliases: p.aliases, distinctFrom: p.distinctFrom, fieldAliases: p.fieldAliases ?? {}, confirmed: p.confirmed };
};

// ---------------------------------------------------------------- X8 known piece
describe('X8 known piece', () => {
  it('after a kind pick the piece is known, confirmed, with its new kind', async () => {
    const env = await setup();
    const { hoodie } = await s12Pieces(env);
    await env.closet.editPiece(hoodie.id, 'kind', 'sweatshirt');
    const known = knownPieces(await env.store.closet.all(), await env.store.closetObs.all());
    const k = known.find((x) => x.id === hoodie.id)!;
    expect(k).toMatchObject({ confirmed: true, subcategory: 'sweatshirt' });
    const read: Garment = { category: 'top', subcategory: 'hoodie', color_family: 'grey', pattern: 'solid', certainty: 'likely' };
    expect(knownMatches(known, read).map((x) => x.id)).toEqual([hoodie.id]);
  });
});

// ---------------------------------------------------------------- X9 no score moves
describe('X9 no score moves', () => {
  it('scores, readings, sightings and closet summaries are the same before, after and after Undo', async () => {
    const env = await setup({ only: 'all' });
    await check(env, 'p01b');
    await check(env, 's12');
    const before = await untouchable(env.store);
    const undos = [];
    for (const [id, field, value] of [['B3', 'leg', 'relaxed'], ['T6', 'kind', 'hoodie'], ['B1', 'color', 'olive'], ['T2', 'fit', 5], ['T1', 'pattern', 'stripes'], ['S1', 'kind', 'canvas_sneaker']] as const) {
      const r = await env.closet.editPiece(id, field, value);
      expect(r).not.toBeNull();
      undos.push(r!.undo);
      expect(await untouchable(env.store)).toEqual(before);
    }
    for (const u of undos.reverse()) await env.closet.restoreEdit(u);
    expect(await untouchable(env.store)).toEqual(before);
  });
});

// ---------------------------------------------------------------- X10 everything that reads the closet follows
describe('X10 everything that reads the closet follows', () => {
  it('Outfits, the next buy, Starter and the chat equal a closet that was read that way', async () => {
    const env = await setup({ only: 'all' });
    const checks = await env.store.fitChecks.all();
    const marks: string[] = [];
    await env.closet.editPiece('B3', 'leg', 'straight');
    const closet = await env.store.closet.all();
    // the same closet, with the jeans read straight from the start
    const b3 = closet.find((c) => c.id === 'B3')!;
    const asRead = closet.map((c) => (c.id === 'B3' ? { ...b3, garment: { ...b3.garment, leg_shape: 'straight' }, confirmedFields: [], profile: null } : c));
    expect(outfitCount(closet, checks, null)).toBe(outfitCount(asRead, checks, null));
    expect(nextBestBuy({ closet, checks, styles: null, marks })).toEqual(nextBestBuy({ closet: asRead, checks, styles: null, marks }));
    expect(ownership(closet, marks).s05).toMatchObject({ owned: true, how: 'closet', itemId: 'B3' });
    await env.closet.editPiece('B3', 'leg', 'relaxed');
    const snap = await loadStylistSnapshot(env.store, env.clock);
    const ctx = buildStylistContext(snap, 'What goes with my jeans?');
    expect(ctx.text).toMatch(/Dark jeans · bottom · [^\n]*relaxed leg/);
  });

  it('a piece added from the list stays marked through a leg or color fix, and a kind out of its row unmarks it, with Undo (#343)', async () => {
    const env = await setup({ only: [] });
    const s05 = STARTER.find((e) => e.id === 's05')!;
    const m = markedPiece(s05, s05.owns[0]!, 'C-mark', env.clock.nowMs())!;
    await env.store.closet.put(m);
    expect(ownership(await env.store.closet.all(), []).s05).toMatchObject({ owned: true });
    await env.closet.editPiece('C-mark', 'leg', 'slim');
    await env.closet.editPiece('C-mark', 'color', 'denim_light');
    expect((await piece(env.store, 'C-mark')).starterId).toBe('s05');
    const r = await env.closet.editPiece('C-mark', 'kind', 'chinos');
    expect((await piece(env.store, 'C-mark')).starterId).toBeNull();
    expect(ownership(await env.store.closet.all(), []).s05).toEqual({ owned: false });
    await env.closet.restoreEdit(r!.undo);
    expect((await piece(env.store, 'C-mark')).starterId).toBe('s05');
    expect(ownership(await env.store.closet.all(), []).s05).toMatchObject({ owned: true });
  });
});

// ---------------------------------------------------------------- X11 Undo
describe('X11 Undo', () => {
  it('puts back every row the pick changed, a renamed neighbor too', async () => {
    const env = await setup({ only: ['T6'] });
    await check(env, 's12'); // a grey hoodie made by the app
    const before = await tables(env.store);
    // T6 black sweatshirt → hoodie: another hoodie now; names may step around each other
    const r = await env.closet.editPiece('T6', 'kind', 'hoodie');
    expect(r).not.toBeNull();
    await env.closet.editPiece('T6', 'color', 'grey').then((x) => env.closet.restoreEdit(x!.undo));
    await env.closet.restoreEdit(r!.undo);
    expect(await tables(env.store)).toEqual(before);
  });
});

// ---------------------------------------------------------------- X12 edge cases
describe('X12 edge cases', () => {
  it('jeans → chinos in a denim wash moves to the nearest plain color, and the toast says so', async () => {
    const env = await setup({ only: ['B3', 'L3'] });
    const r = await env.closet.editPiece('B3', 'kind', 'chinos');
    expect(r!.remapped).toBe('navy');
    const b3 = await piece(env.store, 'B3');
    expect([b3.garment.subcategory, b3.garment.color_family, b3.art?.family]).toEqual(['chinos', 'navy', 'navy']);
    expect(b3.confirmedFields).toEqual(expect.arrayContaining(['subcategory', 'color_family']));
    expect(editToast('kind', b3, 'chinos', 'navy')).toBe('Changed to chinos, in navy. Your scores stay the same.');
    for (const [from, to] of [['denim_mid', 'blue'], ['denim_light', 'light_blue']] as const) {
      const it = await piece(env.store, 'L3');
      await env.store.closet.patch('L3', { garment: { ...it.garment, color_family: from } });
      const x = await env.closet.editPiece('L3', 'kind', 'bomber');
      expect(x!.remapped).toBe(to);
      await env.closet.restoreEdit(x!.undo);
    }
  });

  it('picking the current value writes nothing', async () => {
    const env = await setup({ only: ['B3'] });
    const before = await tables(env.store);
    expect(await env.closet.editPiece('B3', 'leg', 'slim')).toBeNull();
    expect(await tables(env.store)).toEqual(before);
  });

  it('no editor for a piece waiting on "Same as your …?"; chat, Starter and seed pieces edit the same way', async () => {
    const env = await setup({ only: ['B1'] });
    await check(env, 'p01b'); // its chinos ask "Are these your khaki chinos?"
    const waiting = (await env.store.closet.all()).find((c) => c.maybeSameAs === 'B1' && isOwned(c));
    expect(waiting).toBeTruthy();
    expect(await env.closet.editPiece(waiting!.id, 'leg', 'wide')).toBeNull();
    const chat: ClosetItemRow = { ...(await piece(env.store, 'B1')), id: 'C-chat', source: 'chat', isPhotographed: false, starterId: null, name: 'Grey hoodie', garment: { category: 'top', subcategory: 'hoodie', color_family: 'grey' }, slot: 'top', profile: { aliases: [], distinctFrom: [], confirmed: {}, autoName: true }, art: null };
    await env.store.closet.put(chat);
    expect(await env.closet.editPiece('C-chat', 'kind', 'sweatshirt')).not.toBeNull();
    expect((await piece(env.store, 'C-chat')).garment.subcategory).toBe('sweatshirt');
    expect(await env.closet.editPiece('B1', 'leg', 'relaxed')).not.toBeNull();
  });

  it('a pick made while the closet call is still out is kept when it lands', async () => {
    const env = await setup();
    const first = await s12Pieces(env);
    env.clock.advance(60 * 60_000);
    const started = env.svc.start({ mode: 'check', photoId: 's12', occasion: 'everyday' });
    await env.closet.editPiece(first.hoodie.id, 'kind', 'sweatshirt');
    await started;
    await env.closet.settle();
    expect((await piece(env.store, first.hoodie.id)).garment.subcategory).toBe('sweatshirt');
  });
});

// ---------------------------------------------------------------- X13 sync
describe('X13 sync', () => {
  it('an edited piece round-trips through the sync codec', async () => {
    const env = await setup();
    const { hoodie } = await s12Pieces(env);
    await env.closet.editPiece(hoodie.id, 'kind', 'sweatshirt');
    await env.closet.editPiece(hoodie.id, 'pattern', 'stripes');
    const row = await piece(env.store, hoodie.id);
    const back = dataToRow<ClosetItemRow>('closet', rowToData('closet', row), null);
    expect({ ...back, demoPhotoId: row.demoPhotoId }).toEqual(row);
    expect(KV_LOCAL.some((k) => k.startsWith('closet.edit'))).toBe(false);
  });
});

// ---------------------------------------------------------------- X14 words and VoiceOver
describe('X14 words and VoiceOver', () => {
  it('the new strings exist; rows and options read as planned', async () => {
    for (const k of ['closet.edit.title', 'closet.edit.kind', 'closet.edit.color', 'closet.edit.leg', 'closet.edit.fit', 'closet.edit.pattern', 'closet.edit.more', 'closet.edit.sub', 'closet.edit.foot', 'closet.edit.toast', 'closet.edit.toastRemap', 'closet.edit.a11y.rowHint', 'closet.edit.pattern.solid', 'closet.edit.pattern.stripes', 'closet.edit.pattern.checks_plaid', 'closet.edit.pattern.graphic', 'closet.edit.color.neutrals', 'closet.edit.color.blues', 'closet.edit.color.earth', 'closet.edit.color.colors']) {
      expect(Object.keys(en)).toContain(k);
    }
    expect(t('closet.edit.title')).toBe('What it is');
    // T73 (specs/closet-beta.md CB1.3): Outfits are off for the beta, so the note no longer promises "your outfits follow".
    expect(t('closet.edit.foot')).toBe('Got one wrong? Change it here. The drawing follows. Your scores stay the same.');
    expect(t('closet.edit.sub')).toBe('Pick what it really is.');
    expect(t('closet.edit.a11y.rowHint')).toBe('Double-tap to change.');
    const env = await setup({ only: 'all' });
    const b3 = await piece(env.store, 'B3');
    const leg = editRows(b3).find((r) => r.field === 'leg')!;
    expect(rowA11y(leg)).toBe('Leg, Slim');
    const opts = editOptions(b3, 'leg').main;
    expect(optionA11y('leg', opts.find((o) => o.value === 'relaxed')!)).toEqual({ label: 'Relaxed leg', selected: false });
    expect(optionA11y('leg', opts.find((o) => o.value === 'slim')!)).toEqual({ label: 'Slim leg', selected: true });
    expect(editToast('leg', b3, 'relaxed', null)).toBe('Changed to relaxed leg. Your scores stay the same.');
    const t6 = await piece(env.store, 'T6');
    expect(editToast('kind', t6, 'hoodie', null)).toBe('Changed to hoodie. Your scores stay the same.');
    expect(editToast('color', t6, 'navy', null)).toBe('Changed to navy. Your scores stay the same.');
    expect(editToast('fit', t6, 5, null)).toBe('Changed to oversized fit. Your scores stay the same.');
    expect(editToast('pattern', t6, 'stripes', null)).toBe('Changed to stripes. Your scores stay the same.');
    // the drawing's label names the kind and the leg or fit
    expect(artSpec(b3).a11y.startsWith('Dark jeans, slim leg')).toBe(true);
  });
});

// ---------------------------------------------------------------- X15 more kinds (#361)
// Founder, Oct 17: "the full sleeve shirt is not included … half sleeve button-ups are not included … add more options".
// Closet-only kinds (features/closet/kinds.ts): each keeps the reading's kind it scores and matches as, and draws and
// names as itself. Checks K1–K11 (09-ui-review §25).
describe('X15 more kinds (#361)', () => {
  const NEW: Record<string, [string, string]> = {
    long_sleeve_tee: ['tee', 'Long-sleeve tee'], henley: ['tee', 'Henley'], button_up_shirt: ['oxford_shirt', 'Button-up shirt'],
    short_sleeve_shirt: ['camp_collar_shirt', 'Short-sleeve shirt'], turtleneck: ['sweater', 'Turtleneck'], zip_hoodie: ['hoodie', 'Zip hoodie'],
    jorts: ['shorts', 'Jean shorts'],
  };

  it('K1 every new kind is offered in its slot, in plain words, never a brand', async () => {
    const env = await setup({ only: 'all' });
    const t2 = await piece(env.store, 'T2');
    const tops = editOptions(t2, 'kind');
    expect(tops.main.slice(0, 6).map((o) => o.label)).toEqual(['Tee', 'Long-sleeve tee', 'Graphic tee', 'Polo', 'Button-up shirt', 'Short-sleeve shirt']);
    expect(tops.more.map((o) => o.label)).toEqual(expect.arrayContaining(['Henley', 'Turtleneck', 'Zip hoodie', 'Flannel', 'Oxford']));
    expect(editOptions(await piece(env.store, 'L1'), 'kind').main.map((o) => o.value)).toContain('zip_hoodie');
    expect(editOptions(await piece(env.store, 'B3'), 'kind').main.map((o) => o.value)).toContain('jorts');
    for (const [v, [, label]] of Object.entries(NEW)) {
      const slot = v === 'jorts' ? 'B3' : 'T2';
      const o = [...editOptions(await piece(env.store, slot), 'kind').main, ...editOptions(await piece(env.store, slot), 'kind').more].find((x) => x.value === v)!;
      expect(o.label).toBe(label);
      expect(checkSentence(o.label, { allowedScores: new Set() })).toBeNull();
    }
  });

  it('K2 a pick keeps the reading kind, names and draws the new one, and says so', async () => {
    const env = await setup({ only: 'all' });
    const t2 = await piece(env.store, 'T2');
    const tee = draw(t2);
    const preview = withEdit(t2, 'kind', 'long_sleeve_tee');
    const r = await env.closet.editPiece('T2', 'kind', 'long_sleeve_tee');
    const after = await piece(env.store, 'T2');
    // a long-sleeve tee is a tee with his long sleeves (§24, #359), not a closet-only kind
    expect(after.garment.subcategory).toBe('tee');
    expect(after.profile?.kindVariant).toBeUndefined();
    expect(after.profile?.confirmed.sleeve_length).toBe('long');
    expect(after.art).toMatchObject({ sleeves: 'long' });
    expect(after.name).toMatch(/^(Heather )?[Gg]rey long-sleeve tee$/);
    expect(editRows(after).find((x) => x.field === 'kind')!.value).toBe('Long-sleeve tee');
    expect(editOptions(after, 'kind').main.find((o) => o.current)!.value).toBe('long_sleeve_tee');
    expect(draw(after)).toBe(draw(preview));
    expect(draw(after)).not.toBe(tee);
    expect(editToast('kind', t2, 'long_sleeve_tee', r!.remapped)).toBe('Changed to long-sleeve tee. Your scores stay the same.');
  });

  it('K3 scores, readings and sightings never move; Outfits count it as the kind it scores as', async () => {
    const env = await setup({ only: 'all' });
    const before = await untouchable(env.store);
    const checks = await env.store.fitChecks.all();
    const count0 = outfitCount(await env.store.closet.all(), checks, null);
    for (const [id, v] of [['T2', 'long_sleeve_tee'], ['T4', 'short_sleeve_shirt'], ['T3', 'turtleneck'], ['B3', 'jorts']] as const) await env.closet.editPiece(id, 'kind', v);
    expect(await untouchable(env.store)).toEqual(before);
    const closet = await env.store.closet.all();
    // the same closet with each piece as the reading kind it scores as (sleeves don't build outfits)
    const asRead = closet.map((c) => (c.profile?.kindVariant ? { ...c, profile: { ...c.profile, kindVariant: undefined } } : c));
    expect(outfitCount(closet, checks, null)).toBe(outfitCount(asRead, checks, null));
    // the tee and the sweater stay what they were; the oxford and the jeans are now a camp shirt and shorts
    expect(closet.find((c) => c.id === 'T2')!.garment.subcategory).toBe('tee');
    expect(closet.find((c) => c.id === 'T3')!.garment.subcategory).toBe('sweater');
    expect(closet.find((c) => c.id === 'T4')!.garment.subcategory).toBe('camp_collar_shirt');
    expect(outfitCount(closet, checks, null)).toBeLessThanOrEqual(count0);
  });

  it('K4 picking a plain kind takes the new one off, and the tee draws as it did', async () => {
    const env = await setup({ only: 'all' });
    const tee = draw(await piece(env.store, 'T2'));
    await env.closet.editPiece('T2', 'kind', 'long_sleeve_tee');
    await env.closet.editPiece('T2', 'kind', 'tee');
    const back = await piece(env.store, 'T2');
    expect(back.profile?.kindVariant).toBeUndefined();
    expect(back.art?.kind).toBeUndefined();
    expect(back.profile?.confirmed.sleeve_length).toBe('short');
    expect(back.name).toMatch(/^(Heather )?[Gg]rey tee$/);
    expect(draw(back)).toBe(tee);
  });

  it('K5 long and short button-ups: the right reading kind and different drawings', async () => {
    const env = await setup({ only: 'all' });
    const t4 = await piece(env.store, 'T4');
    expect(currentValueOf(t4)).toBe('oxford_shirt');
    const long = withEdit(t4, 'kind', 'button_up_shirt');
    const short = withEdit(t4, 'kind', 'short_sleeve_shirt');
    expect(long.garment.subcategory).toBe('oxford_shirt');
    expect(short.garment.subcategory).toBe('camp_collar_shirt');
    expect(artSpec(long).flat).toMatchObject({ type: 'shirt', sleeves: 'long' });
    expect(artSpec(short).flat).toMatchObject({ type: 'shirt', sleeves: 'short' });
    for (const scheme of ['light', 'dark'] as const) expect(draw(long, scheme)).not.toBe(draw(short, scheme));
    await env.closet.editPiece('T4', 'kind', 'short_sleeve_shirt');
    expect((await piece(env.store, 'T4')).name).toBe('Light-blue short-sleeve shirt');
  });

  it('K6 a camp shirt now draws short sleeves; henley, turtleneck and zip hoodie draw their own details', async () => {
    const env = await setup({ only: 'all' });
    const t2 = await piece(env.store, 'T2');
    expect(artSpec(withEdit(await piece(env.store, 'T4'), 'kind', 'camp_collar_shirt')).flat).toMatchObject({ sleeves: 'short' });
    // a henley takes the sleeves his photos show (T2 reads short), else it's drawn long
    expect(artSpec(withEdit(t2, 'kind', 'henley')).flat).toMatchObject({ type: 'tee', sleeves: t2.art?.sleeves === 'short' ? 'short' : 'long', neck: 'henley' });
    const unread = { ...t2, art: t2.art ? (({ sleeves: _s, ...rest }) => rest)(t2.art) : null };
    expect(artSpec(withEdit(unread, 'kind', 'henley')).flat).toMatchObject({ sleeves: 'long', neck: 'henley' });
    expect(artSpec(withEdit(await piece(env.store, 'T3'), 'kind', 'turtleneck')).flat).toMatchObject({ type: 'crew', neck: 'turtle' });
    const zip = artSpec(withEdit(t2, 'kind', 'zip_hoodie')).flat;
    expect(zip).toMatchObject({ type: 'hoodie', details: { fullZip: true, pouch: false } });
    const svgs = ['tee', 'long_sleeve_tee', 'henley', 'hoodie', 'zip_hoodie', 'sweater', 'turtleneck'].map((v) => draw(withEdit(t2, 'kind', v)));
    expect(new Set(svgs).size).toBe(svgs.length);
  });

  it('K7 a kind drawn with its usual sleeves draws exactly as before', () => {
    const types = ['tee', 'polo', 'tank', 'crew', 'quarter_zip', 'cardigan', 'hoodie', 'shirt', 'overshirt', 'denim_jacket', 'bomber', 'jacket', 'puffer', 'blazer', 'coat'] as const;
    for (const type of types) {
      const usual = type === 'tee' || type === 'polo' ? 'short' : type === 'tank' ? 'sleeveless' : 'long';
      for (const scheme of ['light', 'dark'] as const) {
        const flat = { kind: 'top' as const, type, color: '#7f8a99' };
        expect([type, renderFlat({ ...flat, sleeves: usual }, { scheme, id: 'x' })]).toEqual([type, renderFlat(flat, { scheme, id: 'x' })]);
      }
    }
  });

  it('K8 jean shorts keep the wash, draw jean stitching, and plain shorts move it to a color', async () => {
    const env = await setup({ only: 'all' });
    const b3 = await piece(env.store, 'B3');
    const r = await env.closet.editPiece('B3', 'kind', 'jorts');
    expect(r!.remapped).toBeNull();
    const j = await piece(env.store, 'B3');
    expect(j.garment).toMatchObject({ subcategory: 'shorts', color_family: 'denim_dark' });
    expect(j.name).toBe('Dark jean shorts');
    expect(editRows(j).map((x) => x.field)).toEqual(['kind', 'color']);
    expect(editOptions(j, 'color').main.map((o) => o.value)).toEqual(expect.arrayContaining(['denim_light', 'denim_mid', 'denim_dark']));
    expect((artSpec(j).flat as { stitch?: string }).stitch).toBeDefined();
    expect(draw(j)).not.toBe(draw(withEdit(b3, 'kind', 'shorts')));
    const s = await env.closet.editPiece('B3', 'kind', 'shorts');
    expect(s!.remapped).toBe('navy');
    expect((await piece(env.store, 'B3')).garment.color_family).toBe('navy');
  });

  it('K9 a later photo of the piece keeps its kind, name and drawing', async () => {
    const env = await setup({ only: [] });
    const { hoodie } = await s12Pieces(env);
    await env.closet.editPiece(hoodie.id, 'kind', 'zip_hoodie');
    const named = (await piece(env.store, hoodie.id)).name;
    expect(named).toMatch(/zip hoodie$/);
    expect(named).not.toMatch(/zip zip/);
    const drawn = draw(await piece(env.store, hoodie.id));
    await check(env, 's12');
    const after = await piece(env.store, hoodie.id);
    expect(after.wornCount).toBeGreaterThan(hoodie.wornCount);
    expect(after.name).toBe(named);
    expect(after.art?.kind).toBe('zip_hoodie');
    expect(draw(after)).toBe(drawn);
  });

  it('K10 a kind named by its sleeves confirms them; one that isn\'t leaves them as his photos show', async () => {
    const env = await setup({ only: 'all' });
    await env.closet.editPiece('T4', 'kind', 'short_sleeve_shirt');
    expect((await piece(env.store, 'T4')).profile?.confirmed.sleeve_length).toBe('short');
    await env.closet.editPiece('T4', 'kind', 'button_up_shirt');
    expect((await piece(env.store, 'T4')).profile?.confirmed.sleeve_length).toBe('long');
    const t3 = await piece(env.store, 'T3');
    await env.closet.editPiece('T3', 'kind', 'turtleneck');
    expect((await piece(env.store, 'T3')).profile?.confirmed.sleeve_length).toBe(t3.profile?.confirmed.sleeve_length);
  });

  it('K11 Undo puts the kind, the name and the drawing back', async () => {
    const env = await setup({ only: 'all' });
    const t2 = await piece(env.store, 'T2');
    const r = await env.closet.editPiece('T2', 'kind', 'henley');
    await env.closet.restoreEdit(r!.undo);
    const back = await piece(env.store, 'T2');
    expect(back.profile?.kindVariant).toBeUndefined();
    expect(back.name).toBe(t2.name);
    expect(draw(back)).toBe(draw(t2));
  });
});

const currentValueOf = (it: ClosetItemRow) => editOptions(it, 'kind').main.find((o) => o.current)?.value ?? null;
