// The outfit picker behind the morning/evening card (02 "S1d", DECISIONS-LOG #58–61).
// Code picks, templates explain: no AI call, free, instant, offline. Same inputs → same outfit
// (ties break on a hash of the day key), so the card and the morning notification always agree.
//
// Rotation (Oct 14): the card mustn't show the same top day after day. It is fed what he was
// shown on earlier cards and what he wore, with how many days ago. Among the outfits that pass
// the weather, occasion and layer rules, the order is: no wrong-weather piece first, then an
// outfit he hasn't seen in 7 days, then the top he has gone longest without (least recently
// shown or worn), then the predicted score. Bottoms, shoes and layers only get a mild push.
//
// The predicted score only ranks candidates. It is never shown (#59): a number worked out from
// closet items can differ from what his photo scores.

import { defaultRubric, isScored, type RubricEngine } from "./rubric";
import { outfitReading, outfitValid } from "./rotation";
import type { Boldness, ClosetItem, Loose, Styles } from "./types";
import { isBoot, isFairWeatherShoe, isHeavyOuter, isWarmLayer, itemAllowed, type WeatherNeeds } from "./weather";

export type ClosetState = "empty" | "thin" | "enough";
export type MissingSlot = "top" | "bottom" | "shoes" | "layer" | "coat";

export type IdeaReasonKey = "layerOff" | "layerWarm" | "layerLate" | "wetShoes" | "hotLight" | "needLayer" | "needCoat" | "occasion";
export interface IdeaReason {
  key: IdeaReasonKey;
  /** The closet item the sentence names (the layer, the shoes), if any. */
  itemId?: string;
}

export interface PickInput {
  closet: readonly ClosetItem[];
  occasion: string;
  styles?: Styles | null;
  boldness?: Loose<Boldness>;
  /** null = no weather and no season rule. */
  needs?: WeatherNeeds | null;
  /** Evening card: the reasons talk about tonight. */
  evening?: boolean;
  /** What he was shown on earlier cards or wore lately (build it with `pickHistory`). */
  history?: PickHistory | null;
  /** Day key + slot: varies the pick from day to day, fixed within a day. */
  seed: string;
  /** Swap one: items he doesn't want this time. */
  exclude?: ReadonlySet<string>;
  /** "Style this": an item that must be in the outfit. */
  pin?: string;
}

export interface PickedOutfit {
  /** Display order: layer, top, bottom, shoes. */
  itemIds: string[];
  /** A slot the closet can't fill for this weather (a dashed "You'd need" tile). */
  missing: MissingSlot | null;
  reasons: IdeaReason[];
  /** Ranking only; never shown. */
  predicted: number;
}

/** What he saw or wore lately, by days ago (0 = earlier today, 1 = yesterday). */
export interface PickHistory {
  /** Item id → days since it was last on a card or worn. */
  items: ReadonlyMap<string, number>;
  /** `outfitKey` → days since that exact top + bottom + shoes was last on a card or worn. */
  outfits: ReadonlyMap<string, number>;
}

/** One earlier card or one day's wear: its items and how many days ago. */
export interface PastUse {
  daysAgo: number;
  itemIds: readonly string[];
}

export interface IdeaResult {
  state: ClosetState;
  outfit: PickedOutfit | null;
  /** Thin closet: the pieces he has (one per slot) and the slots he still needs. */
  known: string[];
  missingSlots: MissingSlot[];
}

/** Candidates kept per slot before combining (keeps a 40-item closet well under 50 ms). */
const KEEP = { top: 6, bottom: 5, shoes: 4, outer: 4 } as const;
/**
 * Rotation. A top not seen for `topFresh` days or more counts as fresh (the score decides among
 * those); an exact outfit isn't shown again within `outfitDays`; bottoms, shoes and layers seen
 * within `mildDays` lose `W.recent` (a push, not a ban: guys own fewer of them).
 */
const ROTATE = { topFresh: 7, outfitDays: 7, mildDays: 2 } as const;
const W = { recent: 0.75, layerUnneeded: 0.75, layerSuggested: 0.25, wetBoot: 0.5, wetLight: 0.5, hotBoot: 0.75, hotShortSleeve: 0.5 } as const;
/** Tops that read cool on a hot day (the reading has no sleeve length; these are short-sleeved by type). */
const SHORT_SLEEVE: ReadonlySet<unknown> = new Set(["tee", "graphic_tee", "polo", "knit_polo", "tank_top", "camp_collar_shirt", "jersey"]);

/** FNV-1a, for deterministic tie-breaks. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const bySlot = (closet: readonly ClosetItem[], slot: string) => closet.filter((c) => c.slot === slot);

/** The top + bottom + shoes that make an outfit "the same one" (layers left out); null if one is missing. */
export function outfitKey(items: readonly Pick<ClosetItem, "id" | "slot">[]): string | null {
  const core = items.filter((i) => i.slot === "top" || i.slot === "bottom" || i.slot === "shoes");
  if (!["top", "bottom", "shoes"].every((slot) => core.some((i) => i.slot === slot))) return null;
  return core.map((i) => i.id).sort().join("+");
}

/** Folds earlier cards and wears into the picker's history (the most recent use of each wins). */
export function pickHistory(uses: readonly PastUse[], closet: readonly Pick<ClosetItem, "id" | "slot">[]): PickHistory {
  const byId = new Map(closet.map((c) => [c.id, c]));
  const items = new Map<string, number>();
  const outfits = new Map<string, number>();
  const keep = (m: Map<string, number>, k: string, d: number) => m.set(k, Math.min(m.get(k) ?? Infinity, d));
  for (const u of uses) {
    if (!(u.daysAgo >= 0)) continue; // a later day (or NaN) isn't history
    for (const id of u.itemIds) keep(items, id, u.daysAgo);
    const key = outfitKey(u.itemIds.flatMap((id) => byId.get(id) ?? []));
    if (key) keep(outfits, key, u.daysAgo);
  }
  return { items, outfits };
}

export function closetState(closet: readonly ClosetItem[], styles?: Styles | null, boldness: Loose<Boldness> = "a_little", engine: RubricEngine = defaultRubric): ClosetState {
  if (closet.length === 0) return "empty";
  for (const t of bySlot(closet, "top"))
    for (const b of bySlot(closet, "bottom"))
      for (const s of bySlot(closet, "shoes")) if (outfitValid([t, b, s], styles, boldness, engine)) return "enough";
  return "thin";
}

export function pickOutfit(input: PickInput, engine: RubricEngine = defaultRubric): IdeaResult {
  const { occasion, styles = null, boldness = "a_little", needs = null, evening = false, seed } = input;
  const seenItems = input.history?.items ?? new Map<string, number>();
  const seenOutfits = input.history?.outfits ?? new Map<string, number>();
  const ago = (id: string) => seenItems.get(id) ?? Infinity;
  const exclude = input.exclude ?? new Set<string>();
  const closet = input.closet.filter((c) => !exclude.has(c.id) || c.id === input.pin);
  const state = closetState(input.closet, styles, boldness, engine);
  if (state !== "enough") {
    const known: string[] = [];
    const missingSlots: MissingSlot[] = [];
    for (const slot of ["outer", "top", "bottom", "shoes"] as const) {
      const first = bySlot(input.closet, slot)[0];
      if (first) known.push(first.id);
      else if (slot !== "outer") missingSlots.push(slot);
    }
    return { state, outfit: null, known, missingSlots };
  }

  const pinned = input.pin ? closet.find((c) => c.id === input.pin) : undefined;
  const itemBonus = (it: ClosetItem): number => {
    let b = it.slot !== "top" && ago(it.id) <= ROTATE.mildDays ? -W.recent : 0;
    if (needs?.wet && it.slot === "shoes") b += isBoot(it.garment) ? W.wetBoot : isFairWeatherShoe(it.garment) ? -W.wetLight : 0;
    if (needs?.hot && it.slot === "shoes" && isBoot(it.garment)) b -= W.hotBoot;
    if (needs?.hot && it.slot === "top" && SHORT_SLEEVE.has(it.garment.subcategory)) b += W.hotShortSleeve;
    return b;
  };
  /** Pieces that are wrong for today's weather (kept as a last resort, never preferred). */
  const wrongWeather = (it: ClosetItem): number => {
    if (!needs) return 0;
    if (it.slot === "shoes") return (needs.hot && isBoot(it.garment)) || (needs.wet && isFairWeatherShoe(it.garment)) ? 1 : 0;
    if (it.slot === "top" && needs.hot && !SHORT_SLEEVE.has(it.garment.subcategory)) return 1;
    return 0;
  };
  /** Days since this top was last on a card or worn, capped: past a week every top is equally fresh. */
  const topFreshness = (it: ClosetItem): number => Math.min(ago(it.id), ROTATE.topFresh);
  const shortlist = (slot: keyof typeof KEEP): ClosetItem[] => {
    if (pinned && pinned.slot === slot) return [pinned];
    return bySlot(closet, slot)
      .filter((it) => itemAllowed(it, needs, occasion))
      .map((it) => ({ it, wrong: wrongWeather(it), fresh: slot === "top" ? topFreshness(it) : 0, rank: itemBonus(it), tie: hash(`${seed}|${it.id}`) }))
      .sort((a, b) => a.wrong - b.wrong || b.fresh - a.fresh || b.rank - a.rank || a.tie - b.tie)
      .slice(0, KEEP[slot])
      .map((x) => x.it);
  };
  const tops = shortlist("top");
  const bottoms = shortlist("bottom");
  const shoes = shortlist("shoes");
  const outerAll = shortlist("outer");
  const heavyOwned = input.closet.some((c) => isHeavyOuter(c.garment));
  const warmOwned = input.closet.some((c) => isWarmLayer(c.garment));
  // A pinned layer is always worn, hot day or not: "no layer" would drop the piece he asked about (#358).
  const layerChoices: (ClosetItem | null)[] = pinned?.slot === "outer" ? [pinned] : needs?.hot ? [null] : [null, ...outerAll];

  type Candidate = { items: ClosetItem[]; layer: ClosetItem | null; wrong: number; repeat: number; fresh: number; value: number; predicted: number; tie: number };
  /** Weather first, then a new outfit, then the top he's gone longest without, then the score. */
  const better = (a: Candidate, b: Candidate): boolean =>
    a.wrong !== b.wrong ? a.wrong < b.wrong
    : a.repeat !== b.repeat ? a.repeat < b.repeat
    : a.fresh !== b.fresh ? a.fresh > b.fresh
    : a.value !== b.value ? a.value > b.value
    : a.tie < b.tie;
  let best: Candidate | null = null;
  for (const t of tops)
    for (const b of bottoms)
      for (const s of shoes)
        for (const l of layerChoices) {
          // Scored in rotation's order (layer last); shown layer first.
          const items = l ? [t, b, s, l] : [t, b, s];
          const warm = items.some((i) => isWarmLayer(i.garment));
          if (needs && (needs.layer === "required" || needs.layer === "outer") && warmOwned && !warm) continue;
          if (needs?.layer === "outer" && heavyOwned && !(l && isHeavyOuter(l.garment))) continue;
          if (!outfitValid(items, styles, boldness, engine)) continue;
          const sc = engine.score(outfitReading(items), { occasion, styles, boldness });
          if (!isScored(sc)) continue;
          let value = sc.overall + items.reduce((a, i) => a + itemBonus(i), 0);
          let wrong = items.reduce((a, i) => a + wrongWeather(i), 0);
          if (needs?.layer === "none" && warm) {
            value -= W.layerUnneeded; // a sweater at 75° is as wrong as a jacket
            wrong += 1;
          }
          if (needs?.layer === "suggested" && warm) value += W.layerSuggested;
          const key = outfitKey(items);
          const repeat = key !== null && (seenOutfits.get(key) ?? Infinity) < ROTATE.outfitDays ? 1 : 0;
          const tie = hash(`${seed}|${items.map((i) => i.id).join("+")}`);
          const cand: Candidate = { items, layer: l, wrong, repeat, fresh: topFreshness(t), value, predicted: sc.overall, tie };
          if (!best || better(cand, best)) best = cand;
        }
  // Weather filtered out every outfit (say his only shoes are suede on a wet day): pick without it.
  if (!best) return needs ? pickOutfit({ ...input, needs: null }, engine) : { state: "thin", outfit: null, known: [], missingSlots: [] };

  const warm = best.items.some((i) => isWarmLayer(i.garment));
  let missing: MissingSlot | null = null;
  if (needs && (needs.layer === "required" || needs.layer === "outer") && !warm) missing = "layer";
  else if (needs?.layer === "outer" && !heavyOwned) missing = "coat";

  const reasons: IdeaReason[] = [];
  const layerItem = best.layer ?? best.items.find((i) => isWarmLayer(i.garment)) ?? null;
  if (needs?.hot) reasons.push({ key: "hotLight" });
  else if (missing === "layer") reasons.push({ key: "needLayer" });
  else if (layerItem && needs && needs.layer !== "none") {
    reasons.push({ key: evening ? "layerLate" : needs.removable && best.layer ? "layerOff" : "layerWarm", itemId: layerItem.id });
  }
  if (missing === "coat") reasons.push({ key: "needCoat" });
  const shoe = best.items.find((i) => i.slot === "shoes");
  if (needs?.wet && shoe && !isFairWeatherShoe(shoe.garment)) reasons.push({ key: "wetShoes", itemId: shoe.id });
  if (reasons.length === 0) reasons.push({ key: "occasion" });

  const shown = best.layer ? [best.layer, ...best.items.filter((i) => i !== best!.layer)] : best.items;
  return { state: "enough", outfit: { itemIds: shown.map((i) => i.id), missing, reasons: reasons.slice(0, 2), predicted: best.predicted }, known: [], missingSlots: [] };
}
