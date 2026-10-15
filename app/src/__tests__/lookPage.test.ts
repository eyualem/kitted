// The Lookbook look page (09-ui-review §6.4, checks K1–K5, set before the build; #280). The page is drawn from one
// read-only model (features/lookbook/lookPage.ts); these tests hold the model and the two screens' wiring to the checks.
// K6 (light and dark on a demo look) is a Simulator look: demo screens 97–98.
import { US_EASTERN } from '@kitted/core';
import { router } from 'expo-router';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import { shownPhoto } from '@/demo/demoPhotos';
import { displayScore, scoreWordLabel } from '@/design-system/score';
import { loadLook, lookHref, openLookPage, showInChat, type LookPageModel } from '@/features/lookbook/lookPage';
import { getStylistAction, clearStylistAction } from '@/router/stylistAction';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
// K7 loads the piece page's actions, which import the app's store; an empty chat stands in (no SQLite under jest).
jest.mock('@/data/db', () => ({ store: { chat: { all: async () => [] } } }));

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string; existsSync(p: string): boolean };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const src = (p: string) => fs.readFileSync(path.resolve(p), 'utf8');
const LOOKBOOK = 'src/app/(tabs)/lookbook/index.tsx';
const ROUTE = 'src/app/(tabs)/lookbook/look/[id].tsx';
const PAGE = 'src/features/lookbook/LookPageScreen.tsx';

const at = (iso: string) => Date.parse(iso);
const zone = US_EASTERN;

/** The look's page model; every look these tests open must have one. */
async function opened(store: KittedStore, id: string): Promise<LookPageModel> {
  const look = await loadLook(store, id, { zone });
  expect(look).not.toBeNull();
  return look!;
}

async function seeded(): Promise<KittedStore> {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone, asOfMs: at('2026-10-22T12:21:00-04:00') });
  return store;
}

beforeEach(() => {
  (router.push as jest.Mock).mockClear();
  (router.navigate as jest.Mock).mockClear();
  clearStylistAction();
});

test('K1: tapping a Lookbook row opens the look\'s page, not the bare photo viewer', () => {
  expect(lookHref('FC3')).toBe('/lookbook/look/FC3');
  openLookPage('FC3');
  expect(router.push).toHaveBeenCalledWith('/lookbook/look/FC3');
  expect((router.push as jest.Mock).mock.calls.flat().some((h) => String(h).startsWith('/photo/'))).toBe(false);
  // The row itself: it opens the look page, and the Lookbook list never links to the viewer (a no-photo look opened an
  // empty black viewer, §1 item 12).
  const list = src(LOOKBOOK);
  expect(list).toMatch(/onPress=\{\(\) => openLookPage\(check\.id\)\}/);
  expect(list).not.toMatch(/\/photo\//);
  // The route renders the page, not the placeholder.
  const route = src(ROUTE);
  expect(route).toMatch(/<LookPage /);
  expect(route).not.toMatch(/Placeholder/);
});

test('K2: the page shows the photo neck-down (tap → the full viewer), the score in Archivo with its word, the date and occasion, the stored fixes in the card\'s words, the pieces as drawn tiles that open their piece pages, and "Show in chat"', async () => {
  const store = await seeded();
  // A plain look with a fix (FC2, a partial check on s24).
  const fc2 = (await store.fitChecks.get('FC2'))!;
  const look = await opened(store, 'FC2');
  expect(look).not.toBeNull();
  // The photo, neck-down (its crop rides with it), and a tap opens the full viewer on that check.
  const photo = shownPhoto('s24', null, undefined)!;
  expect(look.photo).toMatchObject({ id: photo.id, source: photo.source, crop: photo.crop });
  expect(look.photo?.crop).toBeDefined();
  expect(look.photoHref).toBe('/photo/FC2');
  expect(look.actions).toContain('photo');
  // The score and its word; the date and occasion.
  expect(look.scoreText).toBe('6.5');
  expect(look.word).toBe('Getting there');
  expect(look.occasion).toBe('Everyday');
  expect(look.date).toBe('October 20');
  expect(look.title).toBe('Everyday · October 20');
  expect(look.partialLabel).toBe('Partial check: shoes not included');
  // The stored fixes, worded as the card words them: the copy, its tag, "→ 7.0".
  expect(fc2.fixes.length).toBeGreaterThan(0);
  expect(look.fixes).toEqual(fc2.fixes.map((f, i) => ({ number: i + 1, title: f.copy, detail: f.tag ?? undefined, gain: `→ ${displayScore(f.to)}`, done: false })));
  // Its pieces, as drawn tiles (the closet rows the tiles draw), each opening its piece page.
  const fc2Items = (await store.closet.all()).filter((c) => fc2.itemIds.includes(c.id) && !c.isDeleted);
  expect(fc2Items.length).toBeGreaterThan(0);
  expect(look.pieces.map((p: { id: string }) => p.id).sort()).toEqual(fc2Items.map((c) => c.id).sort());
  for (const p of look.pieces) {
    expect(p.href).toBe(`/closet/item/${p.id}`);
    expect(p.item).toMatchObject({ id: p.id, garment: expect.any(Object), hex: expect.any(String) });
  }
  expect(look.actions).toContain('piece');
  // "Show in chat": the check's card in the thread.
  expect(look.chatMessageId).toBe('M02');
  expect(look.actions).toContain('chat');
  showInChat(look);
  expect(getStylistAction()).toEqual({ kind: 'scrollTo', messageId: 'M02' });
  expect(router.navigate).toHaveBeenCalledWith('/stylist');

  // A re-checked look (FC3 → FC3R): the latest photo and score, the before, and the caught fix done.
  const fc3 = await opened(store, 'FC3');
  expect(fc3.photo?.id).toBe(shownPhoto('p01a', null, undefined)!.id);
  expect(fc3.photoHref).toBe('/photo/FC3R');
  expect(fc3.scoreText).toBe('9.0');
  expect(fc3.word).toBe('Dialed in');
  expect(fc3.before).toMatchObject({ scoreText: '8.0', href: '/photo/FC3' });
  expect(fc3.title).toBe('Date · October 22');
  expect(fc3.fixes).toEqual([{ number: 1, title: 'Wear the overshirt, open', detail: undefined, gain: '', done: true }]);
  expect(fc3.chatMessageId).toBe('M07');
  expect(fc3.pieces.map((p: { id: string }) => p.id).sort()).toEqual(['B1', 'S1', 'T1']);

  // The page draws it that way: the score through the Archivo numerals (ScoreBlock / DeltaRow use <Numeral>), the
  // photo through NeckDownPhoto, the pieces through ClosetTile, and the "Show in chat" button.
  const page = src(PAGE);
  expect(page).toMatch(/<ScoreBlock /);
  expect(page).toMatch(/<DeltaRow /);
  expect(page).toMatch(/<NeckDownPhoto /);
  expect(page).toMatch(/<ClosetTile /);
  expect(page).toMatch(/<FixRow /);
  expect(page).toMatch(/t\('look\.showInChat'\)/);
  expect(page).toMatch(/t\('look\.pieces'\)/);
});

test('K3: a look with no photo shows its drawn pieces and never opens the empty viewer', async () => {
  const store = await seeded();
  for (const id of ['FC0', 'FC1']) {
    const row = (await store.fitChecks.get(id))!;
    expect(row.photoFile).toBeNull();
    expect(row.demoPhotoId).toBeNull();
    const look = await opened(store, id);
    expect(look).not.toBeNull();
    expect(look.photo).toBeNull();
    expect(look.photoHref).toBeNull();
    expect(look.actions).not.toContain('photo');
    expect(look.pieces.length).toBeGreaterThan(0);
    expect(look.pieces.map((p: { id: string }) => p.id).sort()).toEqual([...row.itemIds].sort());
    expect(look.pieces.every((p: { href: string }) => p.href.startsWith('/closet/item/'))).toBe(true);
  }
  // The page only links the photo when there is one.
  expect(src(PAGE)).toMatch(/look\.photoHref \?/);
});

test('K4: the page is read-only: no re-score, no occasion change, no re-check', async () => {
  const store = await seeded();
  const before = JSON.stringify(await store.fitChecks.all());
  const chatBefore = (await store.chat.all()).length;
  const looks = (await store.fitChecks.all()).filter((c) => !c.parentId && c.status === 'scored');
  for (const c of looks) {
    const look = await opened(store, c.id);
    expect(look).not.toBeNull();
    for (const a of look.actions) expect(['photo', 'before', 'piece', 'chat']).toContain(a);
  }
  // Opening a look writes nothing.
  expect(JSON.stringify(await store.fitChecks.all())).toBe(before);
  expect((await store.chat.all()).length).toBe(chatBefore);
  // The page has no way to change a check: no occasion tray or picker, no lens change, no re-check or camera, no
  // "Not quite right?", no fit-check service writes.
  const page = src(PAGE) + src(ROUTE);
  for (const banned of ['MorphPicker', 'pickOccasion', 'confirmLens', '/camera', 'sheets/correct', "t('card.nqr')", "t('look.recheck')", "t('card.recheck')", 'fitCheck.', "kind: 'recheck'", 'rescore']) {
    expect(page).not.toContain(banned);
  }
});

test('K5: the score shown equals the stored check\'s score', async () => {
  const store = await seeded();
  const all = await store.fitChecks.all();
  const roots = all.filter((c) => !c.parentId && c.status === 'scored' && c.score !== null);
  expect(roots.length).toBeGreaterThanOrEqual(4);
  for (const c of roots) {
    const latest = all.filter((r) => r.parentId === c.id).sort((a, b) => b.createdAt - a.createdAt)[0] ?? c;
    const look = await opened(store, c.id);
    expect(look.score).toBe(latest.score);
    expect(look.scoreText).toBe(displayScore(latest.score!));
    expect(look.word).toBe(scoreWordLabel(latest.score!));
    if (latest !== c) expect(look.before?.score).toBe(c.score);
    else expect(look.before).toBeNull();
  }
  // Opened by the re-check's own id, it is the same look.
  const viaRecheck = await opened(store, 'FC3R');
  expect(viaRecheck.checkId).toBe('FC3');
  expect(viaRecheck.score).toBe((await store.fitChecks.get('FC3R'))!.score);
  // A check that isn't scored, or doesn't exist, has no page.
  expect(await loadLook(store, 'nope', { zone })).toBeNull();
});

test('K7: "Open the look" on a piece-page photo opens that look\'s page, not the chat card or the bare photo', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { openLook } = require('@/features/closet/pieceActions') as { openLook: (id: string) => void };
  openLook('FC3');
  expect(router.push).toHaveBeenCalledWith('/lookbook/look/FC3');
  expect((router.push as jest.Mock).mock.calls.flat().some((h) => String(h).startsWith('/photo/'))).toBe(false);
  expect(getStylistAction()).toBeNull();
});

test('K8: the read-only look page never shows a line asking him to do what the page can\'t do', async () => {
  const store = await seeded();
  // FC2's stored summary carries the card's "Headed there? Change the occasion." (the page has no occasion picker).
  expect((await store.fitChecks.get('FC2'))!.explanation).toMatch(/Change the occasion/);
  for (const c of await store.fitChecks.all()) {
    const look = await loadLook(store, c.id, { zone });
    if (!look) continue;
    expect(look.summary ?? '').not.toMatch(/Change the occasion/);
    expect(look.noFixLine ?? '').not.toMatch(/Change the occasion/);
  }
  // The rest of the line stays.
  expect((await opened(store, 'FC2')).summary).toMatch(/loungewear outside the gym\./);
});
