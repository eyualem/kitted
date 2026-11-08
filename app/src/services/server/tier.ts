// The tier the server last answered with (x-kitted-tier, 13 §8, check A10). `beta` is the closed beta's day (specs/
// free-and-pro.md FP7): 3 fit checks and 20 questions, no paywall, no price, no "Pro". The phone's own limits follow
// the server's, so it never holds a photo or refuses a question the server would take. Kept in the key-value table so
// it holds across launches. It changes the limits only: the app never calls him Pro for it (the plan row, the paywall
// and "Try Pro" read the purchase).
//
// Before the server's first answer the phone uses the build's fallback (T14, T-2): `beta` while the paywall isn't
// built, `free` once it is, so the one launch switch flips both. `tierNow()` is the synchronous view the paywall switch
// and the plan row read; it follows the last tier read or recorded, and a demo screen's own tier wins over both.
import { PAYWALL_BUILT } from '@/config/features';
import type { KittedStore } from '@/data/store';

export const SERVER_TIER_KV = 'server.tier';

export type ServerTier = 'free' | 'pro' | 'beta';

/** The last tier read from the store or recorded from an answer; null before either. */
let known: ServerTier | null = null;
/** A demo screen's tier (demo/scenarios.ts `tier`); null on his phone. */
let demoTier: ServerTier | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

function setKnown(tier: ServerTier) {
  if (tier === known) return;
  known = tier;
  changed();
}

export function parseTier(v: unknown): ServerTier | null {
  return v === 'free' || v === 'pro' || v === 'beta' ? v : null;
}

export async function serverTier(store: Pick<KittedStore, 'getKv'>): Promise<ServerTier | null> {
  const v = parseTier(await store.getKv(SERVER_TIER_KV).catch(() => null));
  if (v) setKnown(v);
  return v;
}

/** The tier before any server answer: the build's. */
export function fallbackTier(): ServerTier {
  return PAYWALL_BUILT ? 'free' : 'beta';
}

/** The tier the app's limits follow: a demo screen's, else the server's, else the build's fallback. */
export async function appTier(store: Pick<KittedStore, 'getKv'>): Promise<ServerTier> {
  if (demoTier) return demoTier;
  return (await serverTier(store)) ?? fallbackTier();
}

/** The same, synchronously: the last tier known in memory. */
export function tierNow(): ServerTier {
  return demoTier ?? known ?? fallbackTier();
}

export function onTierChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setDemoTier(tier: ServerTier | null): void {
  if (tier === demoTier) return;
  demoTier = tier;
  changed();
}

/** Tests only: the module keeps state across tests in one file. */
export function resetTierForTests(): void {
  known = null;
  demoTier = null;
  changed();
}

/** Writes only on a change (every answer carries the header). */
export function tierRecorder(store: Pick<KittedStore, 'getKv' | 'setKv'>): (tier: ServerTier) => void {
  let last: ServerTier | null = null;
  return (tier) => {
    setKnown(tier);
    if (tier === last) return;
    last = tier;
    void store.setKv(SERVER_TIER_KV, tier).catch(() => {
      last = null;
    });
  };
}
