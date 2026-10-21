// The share card's step 2 and 4 checks (handoff/14-share-card.md §4, A1–A8; #352): the ready gate, one press at a
// time, the captured file released, Open Settings, the Lookbook look page's button, and the crop never above a head.
// The native modules are mocked; what these hold is behavior, not how the code is written (14 §4).
import { US_EASTERN } from '@kitted/core';
import { PixelRatio } from 'react-native';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { FitCheckRow } from '@/data/types';
import { loadLook } from '@/features/lookbook/lookPage';
import { READY_WAIT_MS, createGate } from '@/features/share/readyGate';
import { captureCard, saveCard, shareCard } from '@/features/share/exportCard';
import { buildShare, imagesToLoad, neckCrop, type ShareModel } from '@/features/share/shareModel';

const mockCapture = jest.fn();
const mockRelease = jest.fn();
const mockShare = jest.fn();
const mockAvailable = jest.fn();
const mockPerm = jest.fn();
const mockCreate = jest.fn();
jest.mock('react-native-view-shot', () => ({ captureRef: (...a: unknown[]) => mockCapture(...a), releaseCapture: (...a: unknown[]) => mockRelease(...a) }));
jest.mock('expo-sharing', () => ({ shareAsync: (...a: unknown[]) => mockShare(...a), isAvailableAsync: () => mockAvailable() }));
jest.mock('expo-media-library', () => ({ requestPermissionsAsync: (...a: unknown[]) => mockPerm(...a), Asset: { create: (...a: unknown[]) => mockCreate(...a) } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('@/data/db', () => ({ store: { chat: { all: async () => [] } } }));

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const src = (p: string) => fs.readFileSync(path.resolve(p), 'utf8');

async function seeded() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:21:00-04:00') });
  return store;
}

describe('A1–A2 · the ready gate', () => {
  it('opens at once when the copy has no images (Transparent, Solid)', async () => {
    const g = createGate(0);
    expect(g.isOpen()).toBe(true);
    await expect(g.wait(10)).resolves.toBe(true);
  });
  it('waits for every image, then lets a waiting press through', async () => {
    jest.useFakeTimers();
    const g = createGate(2);
    const p = g.wait(READY_WAIT_MS);
    g.loaded();
    expect(g.isOpen()).toBe(false);
    g.loaded();
    expect(g.isOpen()).toBe(true);
    await expect(p).resolves.toBe(true);
    jest.useRealTimers();
  });
  it('gives up after 4 s, and a shut font never opens it', async () => {
    jest.useFakeTimers();
    const g = createGate(Infinity);
    const p = g.wait(READY_WAIT_MS);
    g.loaded();
    jest.advanceTimersByTime(READY_WAIT_MS);
    await expect(p).resolves.toBe(false);
    expect(g.isOpen()).toBe(false);
    jest.useRealTimers();
  });
  it('each version counts its own images', async () => {
    const store = await seeded();
    const re = (await store.fitChecks.get('FC3R'))!;
    const m = buildShare(re, (await store.fitChecks.get('FC3'))!, 0.67)!;
    expect(imagesToLoad(m, 'sticker', 'neck')).toBe(0);
    expect(imagesToLoad(m, 'solid', 'full')).toBe(0);
    expect(imagesToLoad(m, 'photo', 'neck')).toBe(1);
    // Full photo: a usual 3:4 or 2:3 photo is wider than the 9:16 card and fills it (one image); a very tall one is
    // fitted by height with the blurred copy beside it (two).
    expect(imagesToLoad(m, 'photo', 'full')).toBe(1);
    const tall: ShareModel = { ...m, photo: { ...m.photo!, aspect: 0.5 } };
    expect(imagesToLoad(tall, 'photo', 'full')).toBe(2);
    expect(imagesToLoad({ ...m, photo: null }, 'photo', 'neck')).toBe(0);
  });
  it('the screen makes a new gate and remounts the copy whenever what it draws changes', () => {
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).toMatch(/useMemo\(\(\) => createGate\(archivoLoaded \? imagesToLoad\(m, format, face\) : Infinity\), \[m, format, face, archivoLoaded\]\)/);
    expect(screen).toMatch(/<ShareCard key=\{copyKey\}[^>]*onImageLoad=\{gate\.loaded\}/);
    expect(screen).toMatch(/if \(!\(await gate\.wait\(READY_WAIT_MS\)\)\) return say\('failed'\)/);
  });
});

describe('A3–A5 · pressing Share and Save', () => {
  it('one press at a time, and the switches lock while it runs', () => {
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).toMatch(/if \(running\.current\) return;\n    running\.current = true;/);
    expect(screen).toMatch(/pointerEvents=\{locked \? 'none' : 'auto'\}/);
    expect(screen).toMatch(/disabled=\{locked && busy !== 'share'\}/);
    expect(screen).toMatch(/disabled=\{locked && busy !== 'save'\}/);
  });
  it('Photos denied offers Open Settings', () => {
    const screen = src('src/features/share/ShareScreen.tsx');
    expect(screen).toMatch(/settings: r === 'denied'/);
    expect(screen).toMatch(/status\?\.settings \? \([\s\S]*Linking\.openSettings\(\)/);
  });
});

describe('A4 · every captured file is released', () => {
  const ref = { current: null };
  beforeEach(() => {
    jest.useFakeTimers();
    for (const f of [mockCapture, mockRelease, mockShare, mockAvailable, mockPerm, mockCreate]) f.mockReset();
    mockCapture.mockResolvedValue('/tmp/ReactNative/x.png');
    mockAvailable.mockResolvedValue(true);
  });
  afterEach(() => jest.useRealTimers());

  it('captures at the export size in px, whatever the pixel ratio', async () => {
    await captureCard(ref, 'photo');
    const r = PixelRatio.get();
    expect(mockCapture.mock.calls[0][1]).toMatchObject({ format: 'png', width: 1080 / r, height: 1920 / r });
  });
  it('after a save, at once', async () => {
    mockPerm.mockResolvedValue({ granted: true });
    mockCreate.mockResolvedValue({});
    await expect(saveCard(ref, 'sticker')).resolves.toBe('saved');
    expect(mockCreate).toHaveBeenCalledWith('/tmp/ReactNative/x.png');
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
  it('after a failed save, at once; denied captures nothing', async () => {
    mockPerm.mockResolvedValue({ granted: true });
    mockCreate.mockRejectedValue(new Error('disk'));
    await expect(saveCard(ref, 'solid')).resolves.toBe('failed');
    expect(mockRelease).toHaveBeenCalledTimes(1);
    mockRelease.mockReset();
    mockCapture.mockClear();
    mockPerm.mockResolvedValue({ granted: false });
    await expect(saveCard(ref, 'solid')).resolves.toBe('denied');
    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockRelease).not.toHaveBeenCalled();
  });
  it('30 s after the share sheet closes, done or cancelled', async () => {
    mockShare.mockResolvedValue(undefined);
    await expect(shareCard(ref, 'photo')).resolves.toBe('shared');
    expect(mockRelease).not.toHaveBeenCalled();
    jest.advanceTimersByTime(30_000);
    expect(mockRelease).toHaveBeenCalledTimes(1);
    mockShare.mockRejectedValue(new Error('dismissed'));
    await expect(shareCard(ref, 'photo')).resolves.toBe('cancelled');
    jest.advanceTimersByTime(30_000);
    expect(mockRelease).toHaveBeenCalledTimes(2);
  });
});

describe('A6–A7 · the Lookbook look page', () => {
  it('shares a re-checked look on its re-check, a plain look on its own check, never a partial or a low score', async () => {
    const store = await seeded();
    const win = await loadLook(store, 'FC3', { zone: US_EASTERN });
    expect(win?.shareId).toBe('FC3R');
    const plain = await loadLook(store, 'FC0', { zone: US_EASTERN });
    expect(plain?.shareId).toBe('FC0');
    const partial = await loadLook(store, 'FC2', { zone: US_EASTERN });
    expect(partial?.shareId).toBeNull();
    const fc0 = (await store.fitChecks.get('FC0'))!;
    await store.fitChecks.put({ ...fc0, score: 6.5 } as FitCheckRow);
    expect((await loadLook(store, 'FC0', { zone: US_EASTERN }))?.shareId).toBeNull();
  });
  it('the header button only on a build that can make the image', () => {
    const page = src('src/features/lookbook/LookPageScreen.tsx');
    expect(page).toMatch(/look\.shareId && shareNativeReady\(\) \?/);
    expect(page).toMatch(/router\.push\(`\/share\/\$\{look\.shareId\}`\)/);
  });
});

describe('A8 · the neck-down crop never shows a head', () => {
  it('500 seeded random sets of head boxes', () => {
    let seedN = 7;
    const rand = () => ((seedN = (seedN * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const photo = { id: 'x', source: 'file:///x.jpg', aspect: 0.75 };
    for (let i = 0; i < 500; i++) {
      const heads = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => {
        const y0 = Math.floor(rand() * 600), x0 = Math.floor(rand() * 800);
        return [y0, x0, y0 + 20 + Math.floor(rand() * 300), x0 + 20 + Math.floor(rand() * 200)];
      });
      const crop = neckCrop({ details: { closetSummary: { matched: [], added: [], undone: [], heads } } } as Pick<FitCheckRow, 'details'>, photo);
      const lowest = Math.max(...heads.map((h) => h[2]!));
      if (crop) expect(crop.neck * 1000).toBeGreaterThanOrEqual(lowest + 15 - 1e-9);
      else expect(lowest + 15).toBeGreaterThanOrEqual(900);
    }
  });
});
