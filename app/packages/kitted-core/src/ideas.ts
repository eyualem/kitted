// The outfit picker behind the morning/evening card (02 "S1d", DECISIONS-LOG #58–61).
// Code picks, templates explain: no AI call, free, instant, offline. Same inputs → same outfit
// (ties break on a hash of the day key), so the card and the morning notification always agree.
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
  /** Items worn in the last 2 days (pushed down, not banned). */
  recentlyWorn?: ReadonlySet<string>;
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

export interface IdeaResult {
  state: ClosetState;
  outfit: PickedOutfit | null;
  /** Thin closet: the pieces he has (one per slot) and the slots he still needs. */
  known: string[];
  missingSlots: MissingSlot[];
}

/** Candidates kept per slot before combining (keeps a 40-item closet well under 50 ms). */
const KEEP = { top: 6, bottom: 5, shoes: 4, outer: 4 } as const;
const W = { recent: 0.75, layerUnneeded: 0.75, layerSuggested: 0.25, wetBoot: 0.5, wetLight: 0.5 } as const;

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

export function closetState(closet: readonly ClosetItem[], styles?: Styles | null, boldness: Loose<Boldness> = "a_little", engine: RubricEngine = defaultRubric): ClosetState {
  if (closet.length === 0) return "empty";
  for (const t of bySlot(closet, "top"))
    for (const b of bySlot(closet, "bottom"))
      for (const s of bySlot(closet, "shoes")) if (outfitValid([t, b, s], styles, boldness, engine)) return "enough";
  return "thin";
}

export function pickOutfit(input: PickInput, engine: RubricEngine = defaultRubric): IdeaResult {
  const { occasion, styles = null, boldness = "a_little", needs = null, evening = false, seed } = input;
  const recent = input.recentlyWorn ?? new Set<string>();
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
    let b = recent.has(it.id) ? -W.recent : 0;
    if (needs?.wet && it.slot === "shoes") b += isBoot(it.garment) ? W.wetBoot : isFairWeatherShoe(it.garment) ? -W.wetLight : 0;
    return b;
  };
  const shortlist = (slot: keyof typeof KEEP): ClosetItem[] => {
    if (pinned && pinned.slot === slot) return [pinned];
    return bySlot(closet, slot)
      .filter((it) => itemAllowed(it, needs, occasion))
      .map((it) => ({ it, rank: itemBonus(it), tie: hash(`${seed}|${it.id}`) }))
      .sort((a, b) => b.rank - a.rank || a.tie - b.tie)
      .slice(0, KEEP[slot])
      .map((x) => x.it);
  };
  const tops = shortlist("top");
  const bottoms = shortlist("bottom");
  const shoes = shortlist("shoes");
  const outerAll = shortlist("outer");
  const heavyOwned = input.closet.some((c) => isHeavyOuter(c.garment));
  const warmOwned = input.closet.some((c) => isWarmLayer(c.garment));
  const layerChoices: (ClosetItem | null)[] = needs?.hot ? [null] : [null, ...outerAll];

  let best: { items: ClosetItem[]; layer: ClosetItem | null; value: number; predicted: number; tie: number } | null = null;
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
          if (needs?.layer === "none" && warm) value -= W.layerUnneeded; // a sweater at 75° is as wrong as a jacket
          if (needs?.layer === "suggested" && warm) value += W.layerSuggested;
          const tie = hash(`${seed}|${items.map((i) => i.id).join("+")}`);
          if (!best || value > best.value || (value === best.value && tie < best.tie)) best = { items, layer: l, value, predicted: sc.overall, tie };
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
