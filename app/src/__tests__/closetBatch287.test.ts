// The closet batch of 09-ui-review §7 (#287): checks C1–C5 and C8, written and committed before the code; each test is
// named after its check. G2 (no score changes) is asserted where a change could reach a score. The new modules are
// loaded inside their tests, so a missing piece fails its own check, not the whole file.
import { displayHex, FAMILY_HEX, G, hexToLab, labToHex, lightnessOf, nearestFamily, parseShade, shadeFromId, shadeId, US_EASTERN, type Observation } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import { lightColors } from '@/design-system/tokens';
import { artSpec } from '@/features/closet/artSpec';
import { renderFlat, type FlatSpec } from '@/features/closet/flats';
import { mergeUndoTarget, notePieceBlur, notePieceFocus, runMerge, type MergeFlowDeps } from '@/features/closet/merge';
import { artOf, hexOfArt, isOwned } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import type { GarmentMeasurer, MeasuredPieces } from '@/services/measure/garments';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

// Node's fs, path and crypto (jest runs on Node; the app has no Node types).
declare const __dirname: string;
const { readFileSync, existsSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const { createHash } = jest.requireActual<{ createHash(a: string): { update(s: string): { digest(e: 'hex'): string } } }>('crypto');
const src = (...p: string[]) => readFileSync(join(__dirname, '..', ...p), 'utf8');

const at = (iso: string) => Date.parse(iso);
/** CIE76: the straight distance in L*a*b*. */
const deltaE76 = (x: string, y: string) => {
  const a = hexToLab(x)!, b = hexToLab(y)!;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};
const chroma = (hex: string) => {
  const l = hexToLab(hex)!;
  return Math.hypot(l[1], l[2]);
};

// ------------------------------------------------------------------ story setup (as the merge tests)
const measureWith = (hex: (key: string) => string | null): GarmentMeasurer => async (check, pieces) => {
  const out: MeasuredPieces = new Map(pieces.map((p) => {
    const h = hex(p.key);
    return [p.key, { sampledHex: h, sampledL: h ? lightnessOf(h) : null, cropFile: `closet/${check.imageHash.slice(0, 6)}-${p.key}.png`, cropQuality: 0.8 }];
  }));
  out.heads = [[120, 380, 300, 620]];
  return out;
};

async function setup(o: { measure?: GarmentMeasurer } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  for (const c of await store.closet.all()) if (!['T1', 'B1', 'S1'].includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource(), measure: o.measure ?? measureWith(() => null) });
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

/** p01b asks "Are these your khaki chinos?"; the p01a re-check sees them again; "No, a new one" keeps a duplicate. */
async function withDuplicate() {
  const env = await setup();
  const r = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
  await env.closet.settle();
  env.clock.advance(8 * 60_000);
  await env.svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: r.checkId });
  await env.closet.settle();
  const chinosAsk = (await env.closet.openAsks()).find((a) => a.ask.candidateId === 'B1');
  if (!chinosAsk) throw new Error('the story has no chinos question');
  await env.closet.answer(chinosAsk.checkId, chinosAsk.ask.obsId, 'new');
  const dup = (await env.store.closet.get(chinosAsk.ask.itemId))!;
  return { ...env, checkId: r.checkId, dup };
}

const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : 1));
const scores = async (store: KittedStore) => byId(await store.fitChecks.all()).map((c) => [c.id, c.score]);

// ================================================================== C1 · tiles in his measured color
const piece = (family: string, sub = 'hoodie', cat = 'top') => ({ garment: G(cat, sub, family), confirmedFields: [] as string[], profile: { aliases: [], distinctFrom: [], confirmed: {} } });
const seen = (family: string, sample: string | null, sub = 'hoodie', cat = 'top', shade?: string): Observation => ({
  ...G(cat, sub, family), ...(shade ? { shade } : {}), ...(sample ? { sampled_hex: sample, sampled_l: lightnessOf(sample)! } : {}),
});
/** What the tile draws for a piece with these sightings: the stored hex the service would write, then its flat's color. */
function drawn(family: string, sightings: Observation[], sub = 'hoodie', cat = 'top') {
  const it = piece(family, sub, cat);
  const art = artOf(it, sightings);
  const hex = hexOfArt(art, FAMILY_HEX[family]!);
  return { art, hex, flat: artSpec({ garment: it.garment, hex, art, name: 'x' }).flat };
}

describe('C1', () => {
  test('C1: a piece with a measured color from his photos draws in it', () => {
    // His grey hoodie measured a little darker and cooler than the swatch, the same in two photos.
    const d = drawn('grey', [seen('grey', '#8B8F96'), seen('grey', '#8D9197')]);
    expect(d.hex).not.toBe(FAMILY_HEX.grey);
    expect(deltaE76(d.hex, '#8C9096')).toBeLessThan(2);
    expect(d.flat.color).toBe(d.hex);
    // The same with a shade word on the reading: the measurement wins over the stepped swatch.
    const s = drawn('grey', [seen('grey', '#8B8F96', 'hoodie', 'top', 'medium grey')]);
    expect(deltaE76(s.hex, '#8B8F96')).toBeLessThan(2);
  });

  test('C1: the measured color is kept inside its color family (a grey hoodie never draws blue)', () => {
    // Bluish photos of a grey hoodie: a blue measurement is ignored, a blue-grey one is pulled to a neutral grey.
    for (const sample of ['#4F6FA8', '#8A9BB8', '#7E8DA6', '#93A3BD', '#A6B2C4']) {
      const d = drawn('grey', [seen('grey', sample)]);
      expect(nearestFamily(d.hex)).toBe('grey');
      expect(chroma(d.hex)).toBeLessThanOrEqual(10);
    }
    // Every family, a sweep of measured colors across L*a*b*: the drawing's nearest family is always the piece's own.
    const families = Object.keys(FAMILY_HEX).filter((f) => f !== 'multicolor');
    const samples: string[] = [];
    for (const L of [8, 20, 35, 50, 65, 80, 92]) for (const a of [-30, -15, 0, 15, 30]) for (const b of [-30, -15, 0, 15, 30]) samples.push(labToHex([L, a, b]));
    const misses: string[] = [];
    for (const fam of families) {
      const isJeans = fam.startsWith('denim');
      for (const sm of samples) {
        const d = isJeans ? drawn(fam, [seen(fam, sm, 'jeans', 'bottom')], 'jeans', 'bottom') : drawn(fam, [seen(fam, sm)]);
        if (nearestFamily(d.hex) !== fam) misses.push(`${fam} ${sm} -> ${d.hex} (${nearestFamily(d.hex)})`);
      }
    }
    expect(misses).toEqual([]);
  });

  test('C1: a piece without a measurement draws exactly as today', () => {
    const shades = [null, 'light grey', 'dark grey', 'heather grey', 'charcoal', 'light', 'dark'];
    for (const fam of Object.keys(FAMILY_HEX)) {
      for (const sh of shades) {
        const it = piece(fam);
        const art = artOf(it, [seen(fam, null, 'hoodie', 'top', sh ?? undefined)]);
        // Today's formula: the family swatch stepped by the shade (core displayHex, no sample).
        const today = art.family ? displayHex(art.family, art.shade ? shadeFromId(art.shade) : null) : '#123456';
        expect(hexOfArt(art, '#123456')).toBe(today);
        // The stored art doesn't grow a field for pieces that were never measured.
        expect(Object.keys(art)).not.toContain('measured');
      }
    }
    expect(shadeId(parseShade('dark grey'))).toBeTruthy();
  });

  test('C1: two pieces with the same color words but measured shades far apart draw visibly different (ΔE ≥ 10, CIE76)', () => {
    const light = drawn('grey', [seen('grey', '#B0B3B8', 'hoodie', 'top', 'grey')]);
    const dark = drawn('grey', [seen('grey', '#74777D', 'hoodie', 'top', 'grey')]);
    expect(light.art.family).toBe(dark.art.family);
    expect(light.art.shade).toBe(dark.art.shade);
    expect(deltaE76(light.flat.color, dark.flat.color)).toBeGreaterThanOrEqual(10);
    // And charcoal vs grey words still never cross: each stays in its own family.
    expect(nearestFamily(light.hex)).toBe('grey');
    expect(nearestFamily(dark.hex)).toBe('grey');
  });

  test('C1: pieces already in his closet pick up their measured color (the stored tile color), and no score changes (G2)', async () => {
    const env = await setup();
    const r = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    await env.closet.settle();
    const s0 = await scores(env.store);
    const before = byId(await env.store.closet.all());
    // Nothing measured: the refresh changes no row.
    await env.closet.refreshColors();
    expect(byId(await env.store.closet.all())).toEqual(before);

    // A measurement lands on one of this check's pieces (as an older build's sightings already carry them).
    const obs = (await env.store.closetObs.all()).filter((o) => o.fitCheckId === r.checkId && o.itemId);
    const target = obs.map((o) => ({ o, item: before.find((c) => c.id === o.itemId) })).find((x) => x.item && isOwned(x.item) && typeof x.item.art?.family === 'string');
    expect(target).toBeTruthy();
    const fam = target!.item!.art!.family!;
    const swatch = hexToLab(FAMILY_HEX[fam]!)!;
    const sample = labToHex([swatch[0] - 1.5, swatch[1], swatch[2]]);
    await env.store.closetObs.patch(target!.o.id, { sampledHex: sample, sampledL: lightnessOf(sample) });
    await env.closet.refreshColors();
    const after = (await env.store.closet.get(target!.item!.id))!;
    expect(deltaE76(after.hex, sample)).toBeLessThan(2);
    expect(artSpec(after).flat.color).toBe(after.hex);
    // The other pieces are untouched.
    for (const c of byId(await env.store.closet.all())) if (c.id !== after.id) expect(c).toEqual(before.find((b) => b.id === c.id));
    expect(await scores(env.store)).toEqual(s0);
  });

  test('C1 / G2: measured colors never move a fit check score', async () => {
    const plain = await setup();
    const measured = await setup({ measure: measureWith((k) => (k.endsWith('-0') ? '#8E9196' : k.endsWith('-1') ? '#C8BC9F' : '#F0EFEA')) });
    for (const env of [plain, measured]) {
      const r = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
      await env.closet.settle();
      env.clock.advance(8 * 60_000);
      await env.svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: r.checkId });
      await env.closet.settle();
      await env.closet.refreshColors();
    }
    expect(await scores(measured.store)).toEqual(await scores(plain.store));
  });
});

// ================================================================== C2 · "To confirm" holds every open question (CB2.1)
// Was "shows at most 3" (#111); specs/closet-beta.md CB2 (founder, Nov 8) replaced the 3-at-a-time card with one card
// at a time over every open question (T74). Same real five-question set-up.
describe('C2', () => {
  test('CB2.1 · C2: To confirm holds all 5 open questions in openAsks order, and answering one leaves the other 4 in order', async () => {
    const mod = jest.requireActual<Record<string, unknown>>('../features/closet/toConfirm');
    const toConfirm = mod.toConfirm as <Q extends { ask: { obsId: string } }, F extends { item: { id: string } }>(
      open: readonly Q[], fit: F | null,
    ) => ({ kind: 'dup'; key: string; q: Q } | { kind: 'fit'; key: string; fit: F })[];
    expect(Object.keys(mod)).not.toContain('TO_CONFIRM_MAX');

    // One real question from the story (p01b's chinos), then four more like it on the same check.
    const env = await setup();
    const r = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    await env.closet.settle();
    const first = (await env.closet.openAsks()).find((a) => a.checkId === r.checkId);
    expect(first).toBeTruthy();
    const flagged = (await env.store.closet.get(first!.ask.itemId))!;
    const obs = (await env.store.closetObs.get(first!.ask.obsId))!;
    const row = (await env.store.fitChecks.get(r.checkId))!;
    const asks = [...(row.details.closetSummary!.asks ?? [])];
    for (let i = 1; i <= 4; i++) {
      await env.store.closet.put({ ...flagged, id: `C-x${i}`, addedAt: flagged.addedAt + i });
      await env.store.closetObs.put({ ...obs, id: `O-x${i}`, itemId: `C-x${i}` });
      asks.push({ ...first!.ask, obsId: `O-x${i}`, itemId: `C-x${i}`, answer: null });
    }
    await env.store.fitChecks.patch(r.checkId, { details: { ...row.details, closetSummary: { ...row.details.closetSummary!, asks } } });

    const open = await env.closet.openAsks();
    expect(open).toHaveLength(5);
    const deck = toConfirm(open, null);
    expect(Array.isArray(deck)).toBe(true);
    expect(deck.map((c) => c.kind)).toEqual(['dup', 'dup', 'dup', 'dup', 'dup']);
    expect(deck.map((c) => c.key)).toEqual(open.map((o) => `dup:${o.ask.obsId}`));
    expect(deck.map((c) => (c.kind === 'dup' ? c.q : null))).toEqual(open);

    // He answers the second; the other four stay, in the same order.
    await env.closet.answer(open[1]!.checkId, open[1]!.ask.obsId, 'new');
    const open2 = await env.closet.openAsks();
    expect(open2).toHaveLength(4);
    expect(toConfirm(open2, null).map((c) => c.key)).toEqual(open.filter((_, i) => i !== 1).map((o) => `dup:${o.ask.obsId}`));

    // The Closet tab builds its deck from every open question and the fit question (no 3-at-a-time queue).
    const screen = src('app', '(tabs)', 'closet', 'index.tsx');
    expect(screen).toMatch(/toConfirm\(open, fit\)/);
    expect(screen).not.toMatch(/\.shown\.map\(/);
    expect(screen).not.toMatch(/\{open\.map\(/);
  });
});

// ================================================================== C3 · Undo after a merge returns the page
function flow(env: Awaited<ReturnType<typeof setup>>, returned: string[]) {
  const toasts: { undo: () => Promise<void> | void }[] = [];
  const deps: MergeFlowDeps = {
    confirm: async () => true,
    merge: (from, into) => env.closet.merge(from, into),
    unmerge: (u) => env.closet.unmerge(u),
    toast: (_text, undo) => void toasts.push({ undo }),
    returnTo: (id: string) => void returned.push(id),
  };
  return { deps, toasts };
}

describe('C3', () => {
  test('C3: when the piece page that ran the merge is still on screen, Undo puts it back on the restored piece', async () => {
    const env = await withDuplicate();
    const returned: string[] = [];
    const f = flow(env, returned);
    // The duplicate's page, then the picker over it, then the page moves to the kept piece.
    notePieceFocus({ key: 'page-a', pieceId: env.dup.id, mergedFrom: null });
    notePieceBlur('page-a');
    const undo = await runMerge(env.dup, (await env.store.closet.get('B1'))!, f.deps);
    expect(undo).not.toBeNull();
    notePieceFocus({ key: 'page-b', pieceId: 'B1', mergedFrom: env.dup.id });
    expect(mergeUndoTarget(undo!)).toBe(env.dup.id);
    await f.toasts[0]!.undo();
    expect(returned).toEqual([env.dup.id]);
    expect(isOwned((await env.store.closet.get(env.dup.id))!)).toBe(true);
    notePieceBlur('page-b');

    // The wiring: the page moves with the merged piece's id, tells the registry while it's focused, and the merge's
    // Undo replaces the page with the restored piece.
    const page = src('features', 'closet', 'PiecePage.tsx');
    expect(page).toMatch(/notePieceFocus\(/);
    expect(page).toMatch(/notePieceBlur\(/);
    expect(page).toMatch(/mergedFrom/);
    expect(src('app', '(tabs)', 'closet', 'item', '[id].tsx')).toMatch(/mergedFrom/);
    const actions = src('features', 'closet', 'pieceActions.ts');
    expect(actions).toMatch(/returnTo:/);
    expect(actions).toMatch(/router\.replace\(/);
  });

  test('C3: Undo from anywhere else changes no screen', async () => {
    const env = await withDuplicate();
    const b1 = (await env.store.closet.get('B1'))!;
    // He left the page (back to the grid, another tab) before tapping Undo.
    {
      const returned: string[] = [];
      const f = flow(env, returned);
      const undo = await runMerge(env.dup, b1, f.deps);
      notePieceFocus({ key: 'page-b', pieceId: 'B1', mergedFrom: env.dup.id });
      notePieceBlur('page-b');
      expect(mergeUndoTarget(undo!)).toBeNull();
      await f.toasts[0]!.undo();
      expect(returned).toEqual([]);
      expect(isOwned((await env.store.closet.get(env.dup.id))!)).toBe(true);
    }
    // The kept piece's page opened fresh from the grid (not the one that ran the merge), or another piece's page.
    for (const focus of [{ key: 'page-c', pieceId: 'B1', mergedFrom: null }, { key: 'page-d', pieceId: 'T1', mergedFrom: null }]) {
      const returned: string[] = [];
      const f = flow(env, returned);
      const undo = await runMerge((await env.store.closet.get(env.dup.id))!, (await env.store.closet.get('B1'))!, f.deps);
      expect(undo).not.toBeNull();
      notePieceFocus(focus);
      await f.toasts[0]!.undo();
      expect(returned).toEqual([]);
      notePieceBlur(focus.key);
    }
    // Nothing focused at all.
    const returned: string[] = [];
    const f = flow(env, returned);
    await runMerge((await env.store.closet.get(env.dup.id))!, (await env.store.closet.get('B1'))!, f.deps);
    await f.toasts[0]!.undo();
    expect(returned).toEqual([]);
  });
});

// ================================================================== C4 / C5 · the drawing in the tile
/** The drawing's own bounds in its 200 × 200 viewBox: every path's points (segment ends), shadows excluded. */
function bounds(svg: string) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  };
  // Drop the offset ground-shadow group (a copy of the silhouette, translated).
  const body = svg.replace(/<g transform="translate\(1,2\.5\)"[^>]*>.*?<\/g>/g, '');
  for (const m of body.matchAll(/<path d="([^"]+)"([^>]*)>/g)) {
    if (/transform=/.test(m[2]!)) continue;
    const toks = m[1]!.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
    let i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0;
    const num = () => Number(toks[i++]);
    const per: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, S: 4, T: 2, Z: 0 };
    while (i < toks.length) {
      if (/[a-zA-Z]/.test(toks[i]!)) cmd = toks[i++]!;
      const up = cmd.toUpperCase();
      const rel = cmd !== up;
      if (up === 'Z') { x = sx; y = sy; continue; }
      const n = per[up];
      if (n === undefined) throw new Error(`unknown path command ${cmd}`);
      const v = Array.from({ length: n }, num);
      if (up === 'H') x = rel ? x + v[0]! : v[0]!;
      else if (up === 'V') y = rel ? y + v[0]! : v[0]!;
      else { x = rel ? x + v[n - 2]! : v[n - 2]!; y = rel ? y + v[n - 1]! : v[n - 1]!; }
      if (up === 'M') { sx = x; sy = y; if (cmd === 'M') cmd = 'L'; else cmd = 'l'; }
      add(x, y);
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

const SHOES = ['white_leather_sneaker', 'retro_runner', 'chunky_sneaker', 'work_boot', 'suede_chukka', 'chelsea_boot', 'loafer', 'derby', 'slides_sandals'];
const TOPS = ['tee', 'hoodie', 'oxford_shirt', 'sweater', 'denim_jacket', 'blazer', 'overcoat'];
const BOTTOMS = ['jeans', 'chinos', 'sweatpants', 'shorts'];
const flatOf = (cat: string, sub: string, fam = 'brown') => artSpec({ garment: G(cat, sub, fam), hex: FAMILY_HEX[fam]!, art: null, name: 'x' });

describe('C4', () => {
  test('C4: in a tile, a drawn shoe spans at least 80% of the tile\'s drawing width, like a top or pants', () => {
    const { tileArtBox } = jest.requireActual<{ tileArtBox: (shape: 'top' | 'bottom' | 'shoe', w: number, h: number, scale?: number) => { size: number; dy: number } }>('../features/closet/tileArt');
    // The Closet grid's tiles (aspect 0.92) at phone widths, and a square tile.
    for (const [w, aspect] of [[110, 0.92], [118, 0.92], [160, 0.92], [96, 1]] as const) {
      const h = Math.round(w * aspect);
      for (const sub of SHOES) {
        const spec = flatOf('footwear', sub);
        const box = tileArtBox(spec.shape, w, h);
        const b = bounds(renderFlat(spec.flat));
        const span = (b.w / 200) * box.size;
        expect(span / w).toBeGreaterThanOrEqual(0.8);
        // The whole shoe stays inside the tile.
        const top = (h - box.size) / 2 + box.dy + (b.minY / 200) * box.size;
        const bottom = (h - box.size) / 2 + box.dy + (b.maxY / 200) * box.size;
        const left = (w - box.size) / 2 + (b.minX / 200) * box.size;
        const right = (w - box.size) / 2 + (b.maxX / 200) * box.size;
        expect(top).toBeGreaterThanOrEqual(0);
        expect(bottom).toBeLessThanOrEqual(h);
        expect(left).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThanOrEqual(w);
      }
      // Tops and pants keep today's size (0.8 of the tile's shorter side, centered); a shoe is now as large as them:
      // its longest side spans at least as much of the tile as theirs do.
      let smallestOther = Infinity;
      for (const [cat, subs] of [['top', TOPS], ['bottom', BOTTOMS]] as const) {
        for (const sub of subs) {
          const spec = flatOf(cat, sub);
          const box = tileArtBox(spec.shape, w, h);
          expect(box).toEqual({ size: Math.round(Math.min(w, h) * 0.8), dy: 0 });
          const b = bounds(renderFlat(spec.flat));
          smallestOther = Math.min(smallestOther, (Math.max(b.w, b.h) / 200) * box.size);
        }
      }
      for (const sub of SHOES) {
        const spec = flatOf('footwear', sub);
        const b = bounds(renderFlat(spec.flat));
        expect((Math.max(b.w, b.h) / 200) * tileArtBox('shoe', w, h).size).toBeGreaterThanOrEqual(smallestOther);
      }
    }
    // The tile draws with it.
    const tile = src('features', 'closet', 'ClosetTile.tsx');
    expect(tile).toMatch(/tileArtBox\(spec\.shape/);
  });
});

describe('C5', () => {
  const ALL = ['#F2F0EA', '#EDE6D6', '#FFFFFF', '#C9CCD1', '#9CA0A6', '#4A4D55', '#1E2026', '#2B3550', '#B98E62', '#5B6440'];
  const NOT_LIGHT = ALL.slice(3);
  const specsOf = (cs: string[]) => {
    const specs: FlatSpec[] = [];
    for (const c of cs) {
      for (const type of ['tee', 'hoodie', 'shirt', 'blazer', 'tank', 'puffer'] as const) specs.push({ kind: 'top', type, color: c });
      for (const type of ['jeans', 'chinos', 'joggers', 'shorts'] as const) specs.push({ kind: 'bottom', type, color: c });
      for (const type of ['sneaker', 'runner', 'work_boot', 'chukka', 'chelsea', 'loafer', 'derby', 'slides'] as const) specs.push({ kind: 'shoe', type, color: c });
    }
    return specs;
  };
  const hash = (specs: FlatSpec[], scheme: 'light' | 'dark') => createHash('sha1').update(specs.map((s) => renderFlat(s, { scheme, id: 't' })).join('\n')).digest('hex');
  const RIM = `stroke="${lightColors.ink}" stroke-opacity=".12"`;

  test('C5: a white or very light piece (lightness ≥ 90) gets a thin outline at about 12% ink in light mode', () => {
    expect(lightnessOf(FAMILY_HEX.white!)!).toBeGreaterThanOrEqual(90);
    for (const s of specsOf(ALL)) {
      const svg = renderFlat(s, { scheme: 'light', id: 't' });
      const light = lightnessOf(s.color)! >= 90;
      expect({ piece: `${s.kind} ${s.type} ${s.color}`, rim: svg.includes(RIM) }).toEqual({ piece: `${s.kind} ${s.type} ${s.color}`, rim: light });
      if (light) {
        const rim = /<g fill="none" stroke="#[0-9A-Fa-f]{6}" stroke-opacity="\.12" stroke-width="([\d.]+)"/.exec(svg);
        expect(rim).not.toBeNull();
        // Thin: drawn under the fill, so about half the stroke shows outside the silhouette (≈1 pt or less on a tile).
        expect(Number(rim![1])).toBeLessThanOrEqual(3);
      }
    }
    // A real white piece from his closet, as the tile draws it.
    expect(renderFlat(flatOf('top', 'tee', 'white').flat, { scheme: 'light' })).toContain(RIM);
  });

  test('C5: dark mode and other pieces are unchanged', () => {
    // Renders recorded before this change (09-ui-review §7 C5): every piece in dark mode, the rest in light mode.
    expect(hash(specsOf(ALL), 'dark')).toBe('15e79595db30957f5367cbce3483419c8a674af1');
    expect(hash(specsOf(NOT_LIGHT), 'light')).toBe('4fa6931c06470b5468f2c06eeb0b0e78e008aff0');
    for (const s of specsOf(ALL)) expect(renderFlat(s, { scheme: 'dark' })).not.toContain(RIM);
  });
});

// ================================================================== C8 · the Closet "+" is a pull-down menu
describe('C8', () => {
  test('C8: the Closet "+" opens the native pull-down menu from the button, with the same two actions, not an action sheet', () => {
    const { CLOSET_ADD_ACTIONS } = jest.requireActual<{ CLOSET_ADD_ACTIONS: readonly { label: string; href: string; systemImage: string }[] }>('../features/closet/addActions');
    // The same two actions as the old action sheet: Take photo → the scan camera, Choose photos → the library.
    expect(CLOSET_ADD_ACTIONS.map((a) => [a.label, a.href])).toEqual([['Take photo', '/scan'], ['Choose photos', '/scan?library=1']]);
    expect(CLOSET_ADD_ACTIONS.every((a) => a.systemImage.length > 0)).toBe(true);

    const layout = src('app', '(tabs)', 'closet', '_layout.tsx');
    expect(layout).not.toMatch(/ActionSheetIOS/);
    expect(layout).toMatch(/headerRight: \(\) => <AddMenu \/>/);
    // iOS: the native SwiftUI Menu, opened by a tap on the "+" itself (no primary action), one Button per action.
    const ios = src('features', 'closet', 'AddMenu.ios.tsx');
    expect(ios).toMatch(/import \{[^}]*\bMenu\b[^}]*\} from '@expo\/ui\/swift-ui'/);
    expect(ios).toMatch(/<Menu\b/);
    expect(ios).not.toMatch(/onPrimaryAction/);
    expect(ios).toMatch(/CLOSET_ADD_ACTIONS\.map/);
    expect(ios).toMatch(/systemName="plus"/);
    expect(ios).toMatch(/accessibilityLabel\(t\('closet\.add\.a11y'\)\)/);
    // Elsewhere (the web preview): the same actions, without the iOS-only action sheet.
    expect(existsSync(join(__dirname, '..', 'features', 'closet', 'AddMenu.tsx'))).toBe(true);
    const web = src('features', 'closet', 'AddMenu.tsx');
    expect(web).not.toMatch(/ActionSheetIOS/);
    expect(web).toMatch(/CLOSET_ADD_ACTIONS/);
  });
});
