// The thin adapter between the store and the context pack (07 §3): reads what buildStylistContext may use, and only
// that. The profile is copied field by field, so his birth year and consent never enter the snapshot at all.
import type { KittedStore } from '@/data/store';
import { OTHER_STYLE_KEY } from '@/features/onboarding/basics';
import type { Clock } from '@/services/clock';
import type { StylistSnapshot } from './context';

export async function loadStylistSnapshot(store: KittedStore, clock: Clock): Promise<StylistSnapshot> {
  const [p, otherStyle, facts, closet, chat, checks, ideas, outfits, wears] = await Promise.all([
    store.profile.get('me'),
    store.getKv(OTHER_STYLE_KEY),
    store.facts.all(),
    store.closet.all(),
    store.chat.all(),
    store.fitChecks.all(),
    store.dailyIdeas.all(),
    store.outfits.all(),
    store.wearLog.all(),
  ]);
  return {
    nowMs: clock.nowMs(),
    zone: clock.offset,
    profile: p ? { styles: p.styles, fitPreference: p.fitPreference, heightCm: p.heightCm, build: p.build, budget: p.budget } : null,
    otherStyle,
    facts,
    closet,
    chat,
    checks,
    ideas,
    outfits,
    wears,
  };
}
