// The tier the server last answered with (x-kitted-tier, 13 §8, check A10). During the beta every account gets Pro's
// limits on the server (server/config `tier: pro`); the phone's own limits follow, so it never holds a photo or
// refuses a question the server would take. Kept in the key-value table so it holds across launches. It changes the
// limits only: the app never calls him Pro for it (the plan row, the paywall and "Try Pro" read the purchase).
import type { KittedStore } from '@/data/store';

export const SERVER_TIER_KV = 'server.tier';

export type ServerTier = 'free' | 'pro';

export async function serverTier(store: Pick<KittedStore, 'getKv'>): Promise<ServerTier | null> {
  const v = await store.getKv(SERVER_TIER_KV).catch(() => null);
  return v === 'pro' || v === 'free' ? v : null;
}

/** Writes only on a change (every answer carries the header). */
export function tierRecorder(store: Pick<KittedStore, 'getKv' | 'setKv'>): (tier: ServerTier) => void {
  let last: ServerTier | null = null;
  return (tier) => {
    if (tier === last) return;
    last = tier;
    void store.setKv(SERVER_TIER_KV, tier).catch(() => {
      last = null;
    });
  };
}
