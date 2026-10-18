// The share card (02 D20, DECISIONS-LOG #346; checks SC1–SC10 in 02 D20): one overlay after Strava's share stickers,
// in two versions, transparent and with his photo. The cards are drawn from one read-only model
// (features/share/shareModel.ts); these tests hold it to the checks. The look on iOS (and the PNG's transparency on a
// real capture) is a Simulator check: demo screen 20.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { FitCheckRow } from '@/data/types';
import { en } from '@/i18n/en';
import { FORMAT_SIZE, PHOTO_OVERLAY_BOTTOM, SHARE_MIN_SCORE, buildShare, canShare, neckCrop, photoFor, shareA11y } from '@/features/share/shareModel';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const src = (p: string) => fs.readFileSync(path.resolve(p), 'utf8');

async function rows(): Promise<Map<string, FitCheckRow>> {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:21:00-04:00') });
  return new Map((await store.fitChecks.all()).map((r) => [r.id, r]));
}
const patch = (r: FitCheckRow, p: Partial<FitCheckRow>): FitCheckRow => ({ ...r, ...p, details: { ...r.details, ...(p.details ?? {}) } });

describe('SC1 · when a card is offered', () => {
  it('a full check at 7.0 or more; never below, a partial or an unscored check', async () => {
    const byId = await rows();
    const fc3 = byId.get('FC3')!;
    expect(SHARE_MIN_SCORE).toBe(7);
    expect(canShare(patch(fc3, { score: 7 }))).toBe(true);
    expect(canShare(patch(fc3, { score: 6.5 }))).toBe(false);
    expect(canShare(patch(fc3, { score: 8, isPartial: true }))).toBe(false);
    expect(canShare(patch(fc3, { status: 'scoring' }))).toBe(false);
    expect(canShare(byId.get('FC2')!)).toBe(false);
  });
  it('a re-check that went up, even below 7.0 (a low score only as the "before")', async () => {
    const byId = await rows();
    const re = byId.get('FC3R')!;
    const low = patch(re, { score: 6.5, details: { recheck: { ...re.details.recheck!, delta: 1 } } });
    const m = buildShare(low, patch(byId.get('FC3')!, { score: 5.5 }))!;
    expect(m.before?.scoreText).toBe('5.5');
  });
});

describe('SC2 · the three versions are the same overlay', () => {
  it('sizes: the transparent sticker and the solid card 1080 × 600, the photo card 1080 × 1920, all 3× their drawn size', () => {
    expect(FORMAT_SIZE.sticker.px).toEqual({ w: 1080, h: 600 });
    expect(FORMAT_SIZE.solid).toEqual(FORMAT_SIZE.sticker);
    expect(FORMAT_SIZE.photo.px).toEqual({ w: 1080, h: 1920 });
    for (const s of Object.values(FORMAT_SIZE)) expect([s.px.w / s.w, s.px.h / s.h]).toEqual([3, 3]);
  });
  it('all three draw the one Overlay; the sticker has no background, the solid card the indigo ground', () => {
    const card = src('src/features/share/ShareCard.tsx');
    expect(card.match(/<Overlay m=\{m\}/g)).toHaveLength(3);
    const solid = card.slice(card.indexOf("if (format === 'solid')"), card.indexOf("if (format === 'sticker')"));
    expect(solid).toMatch(/backgroundColor: SOLID_GROUND\[tone\]/);
    expect(src('src/features/share/ShareScreen.tsx')).toMatch(/value: 'sticker'[\s\S]*value: 'solid'[\s\S]*value: 'photo'/);
    const sticker = card.slice(card.indexOf("if (format === 'sticker')"), card.indexOf('return (\n    <FixedDark>\n      <View style={{ width: w, height: h, backgroundColor'));
    expect(sticker).not.toMatch(/backgroundColor/);
    expect(src('src/features/share/exportCard.ts')).toMatch(/format: 'png'/); // a PNG keeps the transparency
  });
});

describe('SC3 · what it says', () => {
  it('a single check: Score (with /10) and Rating', async () => {
    const byId = await rows();
    const m = buildShare(byId.get('FC3')!, null)!;
    expect(m.stats.map((s) => [s.label, s.value, s.unit ?? ''])).toEqual([['Score', '8.0', '/10'], ['Rating', 'Sharp', '']]);
  });
  it('a re-check win: Before, After, Change', async () => {
    const byId = await rows();
    const m = buildShare(byId.get('FC3R')!, byId.get('FC3')!)!;
    expect(m.stats.map((s) => [s.label, s.value])).toEqual([['Before', '8.0'], ['After', '9.0'], ['Change', '+1.0']]);
  });
  it('never the occasion, a fix, a date, a brand or Kit', () => {
    const card = src('src/features/share/ShareCard.tsx');
    expect(card).not.toMatch(/occasion|fixes|createdAt|\bKit\b/);
    const used = ['ShareCard.tsx', 'ShareScreen.tsx', 'shareModel.ts'].map((f) => src(`src/features/share/${f}`)).join('\n');
    const keys = [...new Set([...used.matchAll(/t\('(share\.[a-zA-Z.]+)'/g)].map((x) => x[1]!))];
    const deck = en as Record<string, string | undefined>;
    expect(keys.filter((k) => typeof deck[k] !== 'string')).toEqual([]);
    expect(keys.map((k) => deck[k]).join(' ')).not.toMatch(/\bKit\b|occasion|\{time\}|\{date\}/);
  });
  it('copper only on the score dot (the light solid card uses the light theme\'s copper)', () => {
    const card = src('src/features/share/ShareCard.tsx');
    expect(card.match(/fixed\.copper/g)).toHaveLength(1);
    expect(card).toMatch(/const WHITE_INK: Ink = \{ fg: fixed\.white, dot: fixed\.copper \}/);
    expect(card).toMatch(/const LIGHT_INK: Ink = \{ fg: '#121628', dot: '#9C5326' \}/);
    expect(card).toMatch(/<Circle cx=\{tapeX\(score\)\} cy=\{18\} r=\{5\} fill=\{ink\.dot\} \/>/);
  });
  it('the solid card comes light and dark, starting in the phone\'s appearance', () => {
    const card = src('src/features/share/ShareCard.tsx');
    expect(card).toMatch(/const SOLID_GROUND: Readonly<Record<SolidTone, string>> = \{ dark: fixed\.indigo, light: '#F3F4F6' \}/);
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).toMatch(/useState<SolidTone>\(system === 'light' \? 'light' : 'dark'\)/);
    expect(screen).toMatch(/value: 'light'[\s\S]*value: 'dark'/);
  });
});

describe('SC4 · his face: neck down by default, and only below a known line', () => {
  it('a demo photo crops at its chin line; "Full photo" is the whole picture', async () => {
    const byId = await rows();
    const m = buildShare(byId.get('FC3R')!, byId.get('FC3')!)!;
    expect(m.photo?.neck).toBeTruthy();
    expect(photoFor(m.photo, 'neck')?.crop).toEqual(m.photo!.neck);
    expect(photoFor(m.photo, 'full')?.crop).toBeUndefined();
  });
  it('a kept photo crops just under the lowest measured head; none measured or no size: no photo', () => {
    const photo = { id: 'x', source: 'file:///x.jpg', aspect: 0.75 };
    const row = (heads?: number[][]) => ({ details: { closetSummary: heads ? { matched: [], added: [], undone: [], heads } : undefined } }) as Pick<FitCheckRow, 'details'>;
    expect(neckCrop(row([[100, 400, 250, 600]]), photo)).toEqual({ neck: 0.265, foot: 1, cx: 0.5 });
    expect(neckCrop(row([]), photo)).toEqual({ neck: 0, foot: 1, cx: 0.5 });
    expect(neckCrop(row(undefined), photo)).toBeNull();
    expect(photoFor({ source: 'file:///x.jpg', aspect: undefined, neck: { neck: 0.3, foot: 1, cx: 0.5 } }, 'neck')).toBeNull();
    expect(photoFor({ source: 'file:///x.jpg', aspect: 0.75, neck: null }, 'neck')).toBeNull();
  });
  it('every open starts neck down on the photo version, and nothing stores the choice', () => {
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).toMatch(/useState<FaceChoice>\('neck'\)/);
    expect(screen).not.toMatch(/kv\.|store\.kv|setItem/);
  });
});

describe('SC5 · the photo card keeps the overlay above Instagram\'s bottom 20%', () => {
  it('its bottom edge sits at 132 of 640 pt or higher', () => {
    expect(PHOTO_OVERLAY_BOTTOM).toBeGreaterThanOrEqual(640 * 0.2);
  });
});

describe('SC6–SC7 · Share, Save and VoiceOver', () => {
  it('captures at the export size, shares a PNG, saves add-only', () => {
    const ex = src('src/features/share/exportCard.ts');
    // view-shot's width/height are points at the device's scale: px / pixel ratio gives exactly the export size.
    expect(ex).toMatch(/captureRef\(ref, \{ format: 'png', width: px\.w \/ r, height: px\.h \/ r, result: 'tmpfile' \}\)/);
    expect(ex).toMatch(/const r = PixelRatio\.get\(\)/);
    // Add-only access, and the PNG file itself goes into Photos (the legacy path re-encodes and can drop transparency).
    expect(ex).toMatch(/requestPermissionsAsync\(true\)/);
    expect(ex).toMatch(/await Asset\.create\(uri\)/);
    expect(ex).not.toMatch(/saveToLibraryAsync\(|from 'expo-media-library\/legacy'/);
    // The captured file is released after use.
    expect(ex).toMatch(/finally \{\n    release\(uri, RELEASE_AFTER_MS\);/);
    expect(ex).toMatch(/finally \{\n    if \(uri\) release\(uri\);/);
    expect(src('app.config.ts')).toMatch(/'expo-media-library', \{ photosPermission: false, savePhotosPermission: 'Save your Kitted card to Photos\.'/);
  });
  it('the native modules load only on a build that has them', () => {
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).not.toMatch(/^import (?!type )[^\n]*from '\.\/exportCard';/m);
    expect(screen).toMatch(/await import\('\.\/exportCard'\)/);
    expect(src('src/features/share/offer.ts')).toMatch(/shareNativeReady\(\)/);
  });
  it('the preview reads as one image with the score once', async () => {
    const byId = await rows();
    expect(shareA11y(buildShare(byId.get('FC3R')!, byId.get('FC3')!)!, 'photo')).toBe('Share card: 8 to 9 out of 10, Dialed in.');
    expect(shareA11y(buildShare(byId.get('FC3')!, null)!, 'sticker')).toBe('Share card: 8 out of 10, Sharp. Transparent sticker.');
  });
});
