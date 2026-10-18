// The share card (02 D20, DECISIONS-LOG #341; checks SC1–SC13 set before the build, results in 02 D20). The cards are
// drawn from one read-only model (features/share/shareModel.ts); these tests hold it to the checks. The look of each
// card (light and dark, the safe zones on a real capture) is a Simulator check: demo screen 20.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { en } from '@/i18n/en';
import {
  FORMAT_SIZE, SAFE, SHARE_MIN_SCORE, buildShare, canShare, neckCrop, photoFor, shareA11y, shareName,
} from '@/features/share/shareModel';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const src = (p: string) => fs.readFileSync(path.resolve(p), 'utf8');

const zone = US_EASTERN;
async function seeded(): Promise<KittedStore> {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone, asOfMs: Date.parse('2026-10-22T12:21:00-04:00') });
  return store;
}
async function rows(store: KittedStore) {
  const all = await store.fitChecks.all();
  const byId = new Map(all.map((r) => [r.id, r]));
  return { byId, closet: await store.closet.all() };
}
const withScore = (r: FitCheckRow, patch: Partial<FitCheckRow>): FitCheckRow => ({ ...r, ...patch, details: { ...r.details, ...(patch.details ?? {}) } });

describe('SC1 · when a card is offered', () => {
  it('a full check at 7.0 or more; not below; never a partial or an unscored check', async () => {
    const { byId } = await rows(await seeded());
    const fc3 = byId.get('FC3')!;
    expect(SHARE_MIN_SCORE).toBe(7);
    expect(canShare(withScore(fc3, { score: 7 }))).toBe(true);
    expect(canShare(withScore(fc3, { score: 6.5 }))).toBe(false);
    expect(canShare(withScore(fc3, { score: 8, isPartial: true }))).toBe(false);
    expect(canShare(withScore(fc3, { status: 'scoring' }))).toBe(false);
    expect(canShare(byId.get('FC2')!)).toBe(false); // the seed's partial 6.5
  });
  it('a re-check that went up, even below 7.0 (a low score only as the "before")', async () => {
    const { byId, closet } = await rows(await seeded());
    const parent = withScore(byId.get('FC3')!, { score: 5.5 });
    const re = withScore(byId.get('FC3R')!, { score: 6.5, details: { recheck: { ...byId.get('FC3R')!.details.recheck!, delta: 1 } } });
    expect(canShare(re)).toBe(true);
    const m = buildShare(re, parent, closet)!;
    expect(m.formats).toEqual(['beforeAfter']);
  });
});

describe('SC2 · the cards a check can make', () => {
  it('a re-check win: Story, TikTok, Before → after, Beat my score', async () => {
    const { byId, closet } = await rows(await seeded());
    const m = buildShare(byId.get('FC3R')!, byId.get('FC3')!, closet)!;
    expect(m.formats).toEqual(['story', 'tiktok', 'beforeAfter', 'beat']);
  });
  it('a single check: no before → after', async () => {
    const { byId, closet } = await rows(await seeded());
    expect(buildShare(byId.get('FC3')!, null, closet)!.formats).toEqual(['story', 'tiktok', 'beat']);
  });
  it('export sizes: 9 : 16 at 1080 × 1920, the DM card 4 : 5 at 1080 × 1350, each 3× its drawn size', () => {
    for (const f of ['story', 'tiktok', 'beforeAfter'] as const) expect(FORMAT_SIZE[f].px).toEqual({ w: 1080, h: 1920 });
    expect(FORMAT_SIZE.beat.px).toEqual({ w: 1080, h: 1350 });
    for (const s of Object.values(FORMAT_SIZE)) expect([s.px.w / s.w, s.px.h / s.h]).toEqual([3, 3]);
  });
});

describe('SC3–SC4 · his face: neck down by default, and only below a known line', () => {
  it('a demo photo crops at its chin line; "Full photo" is the whole picture', async () => {
    const { byId, closet } = await rows(await seeded());
    const m = buildShare(byId.get('FC3R')!, byId.get('FC3')!, closet)!;
    expect(m.photo?.neck).toBeTruthy();
    expect(photoFor(m.photo, 'neck')?.crop).toEqual(m.photo!.neck);
    expect(photoFor(m.photo, 'full')?.crop).toBeUndefined();
  });
  it('a kept photo crops just under the lowest head the phone measured; none measured: no neck-down photo', () => {
    const photo = { id: 'x', source: 'file:///x.jpg', aspect: 0.75 };
    const row = (heads?: number[][]) => ({ details: { closetSummary: heads ? { matched: [], added: [], undone: [], heads } : undefined } }) as Pick<FitCheckRow, 'details'>;
    expect(neckCrop(row([[100, 400, 250, 600]]), photo)).toEqual({ neck: 0.265, foot: 1, cx: 0.5 });
    expect(neckCrop(row([[100, 400, 250, 600], [80, 100, 300, 200]]), photo)!.neck).toBeCloseTo(0.315);
    expect(neckCrop(row([]), photo)).toEqual({ neck: 0, foot: 1, cx: 0.5 });
    expect(neckCrop(row(undefined), photo)).toBeNull();
    // A crop with no image size can't be placed, so no photo rather than one that might show the face.
    expect(photoFor({ source: 'file:///x.jpg', aspect: undefined, neck: { neck: 0.3, foot: 1, cx: 0.5 } }, 'neck')).toBeNull();
    expect(photoFor({ source: 'file:///x.jpg', aspect: 0.75, neck: null }, 'neck')).toBeNull();
  });
  it('every open starts neck down, and nothing stores the choice', () => {
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).toMatch(/useState<FaceChoice>\('neck'\)/);
    expect(screen).not.toMatch(/kv\.|store\.kv|setItem/);
  });
});

describe('SC6 · what a card says', () => {
  it('the lockup and brand-free pieces; never the occasion, an open fix, a date or Kit', async () => {
    const { byId, closet } = await rows(await seeded());
    const m = buildShare(byId.get('FC3R')!, byId.get('FC3')!, closet)!;
    expect(m.scoreText).toBe('9.0');
    expect(m.word).toBe('Dialed in');
    expect(m.pieces.length).toBeGreaterThan(0);
    expect(m.pieces.length).toBeLessThanOrEqual(4);
    const words = JSON.stringify({ ...m, pieces: m.pieces.map((p) => p.name), photo: null, before: { ...m.before, photo: null } });
    for (const o of ['Date', 'Everyday', 'Interview', 'Class', 'Work']) expect(words).not.toContain(`"${o}`);
    expect(words).not.toMatch(/\bKit\b/);
    // The strings the share feature uses (the copy deck's older share.* keys, like "{occasion} · Full check", are unused).
    const used = ['ShareCard.tsx', 'ShareScreen.tsx', 'shareModel.ts'].map((f) => src(`src/features/share/${f}`)).join('\n');
    const keys = [...new Set([...used.matchAll(/t\('(share\.[a-zA-Z.]+)'/g)].map((x) => x[1]!).concat(['share.fmt.story', 'share.fmt.tiktok', 'share.fmt.beforeAfter']))];
    const deck = en as Record<string, string | undefined>;
    expect(keys.every((k) => typeof deck[k] === 'string')).toBe(true);
    const strings = keys.map((k) => deck[k]).join(' ');
    expect(strings).not.toMatch(/\bKit\b|occasion|\{occasion\}|\{time\}|\{date\}/);
    expect(en['share.signoff']).toBe('Score your fit · trykitted.com');
  });
  it('a piece name never carries a brand', () => {
    const item = { garment: { category: 'top', subcategory: 'hoodie', color_family: 'grey' }, art: { brand: 'nike', family: 'grey', shade: null, pattern: 'solid', details: [] } } as unknown as ClosetItemRow;
    const n = shareName(item);
    expect(n).not.toMatch(/nike/i);
    expect(n.toLowerCase()).toContain('hoodie');
  });
});

describe('SC7 · before → after', () => {
  it('the first score, the delta, and only the fix the re-check caught', async () => {
    const { byId, closet } = await rows(await seeded());
    const re = byId.get('FC3R')!;
    const m = buildShare(re, byId.get('FC3')!, closet)!;
    expect(m.before!.scoreText).toBe('8.0');
    expect(m.before!.delta).toBe('+1.0');
    expect(m.before!.fix).toBe(re.details.recheck?.doneFixes?.[0]?.copy ?? null);
  });
});

describe('SC8 · safe zones', () => {
  it('Stories 14% / 20%; TikTok 14% / 30% and a 12% right rail', () => {
    expect(SAFE.story).toEqual({ top: 0.14, bottom: 0.2, right: 0 });
    expect(SAFE.tiktok).toEqual({ top: 0.14, bottom: 0.3, right: 0.12 });
  });
  it('the cards keep their words inside them (layout numbers in ShareCard.tsx)', () => {
    const card = src('src/features/share/ShareCard.tsx');
    // Story: photo to 400 pt of 640, then the sign-off and lockup (about 110 pt): ends above 512 (80%).
    expect(card).toMatch(/function StoryCard[\s\S]*?const photoH = 400;/);
    // TikTok: the panel ends at the 70% line, left of the rail.
    expect(card).toMatch(/const bottom = Math\.round\(H \* \(1 - safe\.bottom\)\)/);
    expect(card).toMatch(/right: right/);
  });
});

describe('SC9–SC10 · Share, Save and VoiceOver', () => {
  it('captures at the export size, shares a PNG, saves add-only', () => {
    const ex = src('src/features/share/exportCard.ts');
    expect(ex).toMatch(/captureRef\(ref, \{ format: 'png', width: px\.w, height: px\.h, result: 'tmpfile' \}\)/);
    expect(ex).toMatch(/requestPermissionsAsync\(true\)/);
    expect(src('app.config.ts')).toMatch(/'expo-media-library', \{ photosPermission: false, savePhotosPermission: 'Save your Kitted card to Photos\.'/);
  });
  it('the native modules load only on a build that has them', () => {
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).not.toMatch(/^import (?!type )[^\n]*from '\.\/exportCard';/m);
    expect(screen).toMatch(/await import\('\.\/exportCard'\)/);
    expect(src('src/features/share/offer.ts')).toMatch(/shareNativeReady\(\)/);
  });
  it('the preview reads as one image with the score once', async () => {
    const { byId, closet } = await rows(await seeded());
    const m = buildShare(byId.get('FC3R')!, byId.get('FC3')!, closet)!;
    expect(shareA11y(m, 'beforeAfter')).toMatch(/^Share card: 8 to 9 out of 10, Dialed in\./);
    expect(shareA11y(m, 'story')).toMatch(/^Share card: 9 out of 10, Dialed in\./);
  });
});
