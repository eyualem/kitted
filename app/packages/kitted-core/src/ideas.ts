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
// Oct 24 (#379): slides are for home and the gym; anywhere else they're a last resort, like a
// wrong-weather piece. And the card's look (its style menu) picks among the outfits that read as
// it, ahead of rotation: picks never move a score, so ranking by score alone ignored the menu.
//
// Oct 24 (#380): the picker scores with the parts engine fit checks use (it ranked with the old v4
// rubric, which called his running shoes with jeans an 8.0 while a check of them gives 7.0); v4's
// hard rules still say what counts as an outfit, as in Closet's Outfits. Running shoes out of Home
// and Gym, unless the bottoms are athletic, join slides as a last resort. An outfit below Put together
// loses to one at 7+. And rotation may skip a credit but doesn't take on a fault: for the top it picks,
// an outfit loses to the same one with another pair of shoes, bottoms or layer that has fewer faults and
// scores higher, unless that one was already on a card this week (no exact outfit twice in 7 days).
//
// The predicted score only ranks candidates. It is never shown (#59): a number worked out from
// closet items can differ from what his photo scores.

import { defaultParts, type PartsEngine } from "./parts";
import { defaultRubric, type RubricEngine } from "./rubric";
import { outfitReading, outfitValid } from "./rotation";
import type { Boldness, ClosetItem, DetectedStyle, Loose, Styles } from "./types";
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
  /** The card's look (its style menu): outfits that read as it go first, when the closet has any. */
  look?: DetectedStyle | null;
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
const KEEP = { top: 6, bottom: 5, shoes: 8, outer: 4 } as const;
/**
 * Rotation. A top not seen for `topFresh` days or more counts as fresh (the score decides among
 * those); an exact outfit isn't shown again within `outfitDays`; bottoms, shoes and layers seen
 * within `mildDays` lose `W.recent` (a push, not a ban: guys own fewer of them).
 */
const ROTATE = { topFresh: 7, outfitDays: 7, mildDays: 2 } as const;
const W = { recent: 0.75, layerUnneeded: 0.75, layerSuggested: 0.25, wetBoot: 0.5, wetLight: 0.5, hotBoot: 0.75, hotShortSleeve: 0.5 } as const;
/** Tops that read cool on a hot day (the reading has no sleeve length; these are short-sleeved by type). */
const SHORT_SLEEVE: ReadonlySet<unknown> = new Set(["tee", "graphic_tee", "polo", "knit_polo", "tank_top", "camp_collar_shirt", "jersey"]);
/** Short-sleeved by type, unless the closet saw long sleeves on it (the app's art.sleeves: a long-sleeve tee, #359). */
const isShortSleeved = (it: ClosetItem): boolean =>
  SHORT_SLEEVE.has(it.garment.subcategory) && (it.art as { sleeves?: unknown } | null | undefined)?.sleeves !== "long";
/** Shoes for home and the gym only (#379): out of the house they're a last resort, never the pick. */
const HOME_SHOES: ReadonlySet<unknown> = new Set(["slides_sandals"]);
const HOME_OCCASIONS: ReadonlySet<string> = new Set(["home", "gym"]);
/** Running shoes (#380): fine with athletic bottoms (the rubric's ATHLETIC_BOTTOMS, #333) and at home or the gym; with
 *  jeans or chinos they cost 2 on Shoes, so out of the house they're a last resort too. Retro runners are a look's shoe. */
const RUNNERS: ReadonlySet<unknown> = new Set(["performance_runner"]);
const ATHLETIC_BOTTOMS: ReadonlySet<unknown> = new Set(["athletic_shorts", "joggers", "sweatpants", "track_pants"]);
/** 1 for shoes that are wrong for the occasion with these bottoms (or, before the outfit is known, any he owns). */
const wrongOccasion = (it: ClosetItem, occasion: string, bottoms: readonly ClosetItem[]): number => {
  if (it.slot !== "shoes" || HOME_OCCASIONS.has(occasion)) return 0;
  if (HOME_SHOES.has(it.garment.subcategory)) return 1;
  return RUNNERS.has(it.garment.subcategory) && !bottoms.some((b) => ATHLETIC_BOTTOMS.has(b.garment.subcategory)) ? 1 : 0;
};
/** Put together (02 score words): the card never plans below it while the closet can make one at it (#380). */
const PUT_TOGETHER = 7;
/** The rotation order of slots, which the scoring reading follows (layer last). */
const SLOT_ORDER = ["top", "bottom", "shoes", "outer"];

/** The parts engine's score (the one fit checks use) of these pieces as a full-body photo, or null when unscored. */
function scoreOutfit(items: readonly ClosetItem[], occasion: string, styles: Styles | null, boldness: Loose<Boldness>, parts: PartsEngine) {
  const r = parts.scoreParts(outfitReading(items), { occasion, styles, boldness });
  return r.overall === null ? null : r;
}

/** What the scoring held against these pieces, as a negative number (0 = no fault): the parts' deductions, "problems add
 *  up" and condition. A missing credit isn't a fault: a plain 7.0 has none. */
function faultsOf(sc: NonNullable<ReturnType<typeof scoreOutfit>>): number {
  let f = -Math.abs(sc.piledPenalty) - Math.abs(sc.condition.deduction);
  for (const part of Object.values(sc.parts)) for (const x of part?.reasons ?? []) if (x.points < 0) f += x.points;
  return f;
}

/** Pieces that are wrong for today's weather (kept as a last resort, never preferred). */
function wrongWeatherOf(it: ClosetItem, needs: WeatherNeeds | null): number {
  if (!needs) return 0;
  if (it.slot === "shoes") return (needs.hot && isBoot(it.garment)) || (needs.wet && isFairWeatherShoe(it.garment)) ? 1 : 0;
  if (it.slot === "top" && needs.hot && !isShortSleeved(it)) return 1;
  return 0;
}

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

export function pickOutfit(input: PickInput, engine: RubricEngine = defaultRubric, parts: PartsEngine = defaultParts): IdeaResult {
  const { occasion, styles = null, boldness = "a_little", needs = null, evening = false, seed, look = null } = input;
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
    if (needs?.hot && it.slot === "top" && isShortSleeved(it)) b += W.hotShortSleeve;
    return b;
  };
  const wrongWeather = (it: ClosetItem): number => wrongWeatherOf(it, needs);
  /** Days since this top was last on a card or worn, capped: past a week every top is equally fresh. */
  const topFreshness = (it: ClosetItem): number => Math.min(ago(it.id), ROTATE.topFresh);
  const ownBottoms = bySlot(closet, "bottom");
  const shortlist = (slot: keyof typeof KEEP, keep: number = KEEP[slot]): ClosetItem[] => {
    if (pinned && pinned.slot === slot) return [pinned];
    return bySlot(closet, slot)
      .filter((it) => itemAllowed(it, needs, occasion))
      .map((it) => ({ it, wrong: wrongWeather(it) + wrongOccasion(it, occasion, ownBottoms), fresh: slot === "top" ? topFreshness(it) : 0, rank: itemBonus(it), tie: hash(`${seed}|${it.id}`) }))
      .sort((a, b) => a.wrong - b.wrong || b.fresh - a.fresh || b.rank - a.rank || a.tie - b.tie)
      .slice(0, keep)
      .map((x) => x.it);
  };
  const heavyOwned = input.closet.some((c) => isHeavyOuter(c.garment));
  const warmOwned = input.closet.some((c) => isWarmLayer(c.garment));
  // A pinned layer is always worn, hot day or not: "no layer" would drop the piece he asked about (#358).
  const layersOf = (outer: ClosetItem[]): (ClosetItem | null)[] => (pinned?.slot === "outer" ? [pinned] : needs?.hot ? [null] : [null, ...outer]);

  type Candidate = {
    items: ClosetItem[]; layer: ClosetItem | null; wrong: number; low: number; offLook: number; beaten: number;
    repeat: number; fresh: number; predicted: number; faults: number; value: number; tie: number;
  };
  /**
   * Weather and occasion first, then Put together, then the card's look, then a new outfit, then the top he's gone longest
   * without, then "no other piece in its place drops a fault and scores higher", then the score with rotation's push.
   */
  const better = (a: Candidate, b: Candidate): boolean =>
    a.wrong !== b.wrong ? a.wrong < b.wrong
    : a.low !== b.low ? a.low < b.low
    : a.offLook !== b.offLook ? a.offLook < b.offLook
    : a.repeat !== b.repeat ? a.repeat < b.repeat
    : a.fresh !== b.fresh ? a.fresh > b.fresh
    : a.beaten !== b.beaten ? a.beaten < b.beaten
    : a.value !== b.value ? a.value > b.value
    : a.tie < b.tie;
  const search = (keep?: number): Candidate | null => {
    const tops = shortlist("top", keep), bottoms = shortlist("bottom", keep), shoes = shortlist("shoes", keep);
    const layerChoices = layersOf(shortlist("outer", keep));
    const all: Candidate[] = [];
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
            const sc = scoreOutfit(items, occasion, styles, boldness, parts);
            if (!sc) continue;
            let value = sc.overall + items.reduce((a, i) => a + itemBonus(i), 0);
            let wrong = items.reduce((a, i) => a + wrongWeather(i) + wrongOccasion(i, occasion, [b]), 0);
            if (needs?.layer === "none" && warm) {
              value -= W.layerUnneeded; // a sweater at 75° is as wrong as a jacket
              wrong += 1;
            }
            if (needs?.layer === "suggested" && warm) value += W.layerSuggested;
            const key = outfitKey(items);
            const repeat = key !== null && (seenOutfits.get(key) ?? Infinity) < ROTATE.outfitDays ? 1 : 0;
            const tie = hash(`${seed}|${items.map((i) => i.id).join("+")}`);
            const offLook = look && !sc.detectedStyles.includes(look) ? 1 : 0;
            all.push({ items, layer: l, wrong, low: 0, offLook, beaten: 0, repeat, fresh: topFreshness(t), predicted: sc.overall, faults: faultsOf(sc), value, tie });
          }
    // Put together counts only when the closet can make it under the same weather and occasion rules.
    const floorOk = all.some((c) => c.predicted >= PUT_TOGETHER && c.wrong === 0);
    for (const c of all) c.low = floorOk && c.predicted < PUT_TOGETHER ? 1 : 0;
    // Beaten: another pair of shoes, bottoms or layer (none included) with everything else the same has fewer faults, scores
    // higher and is no worse on weather, occasion, Put together or the look. Rotation picks among the rest: it may skip a
    // credit, but takes on a fault (slim chinos at −1 on Proportions) only when every fault-free version was shown this week.
    const groups = new Map<string, Candidate[]>();
    const keysOf = (c: Candidate) => {
      const id = (slot: string) => c.items.find((i) => i.slot === slot)?.id ?? "-";
      return ["bottom", "shoes", "outer"].map((slot) => `${slot}|${SLOT_ORDER.filter((x) => x !== slot).map(id).join("+")}`);
    };
    for (const c of all)
      for (const k of keysOf(c)) {
        const g = groups.get(k);
        if (g) g.push(c);
        else groups.set(k, [c]);
      }
    for (const c of all)
      c.beaten = keysOf(c).some((k) => groups.get(k)!.some((o) => o.predicted > c.predicted && o.faults > c.faults && o.wrong <= c.wrong && o.low <= c.low && o.offLook <= c.offLook)) ? 1 : 0;
    let best: Candidate | null = null;
    for (const c of all) if (!best || better(c, best)) best = c;
    return best;
  };
  let best = search();
  // The shortlists are cut by rotation, which can drop every piece the card's look needs: look again across the whole closet.
  if (look && best?.offLook) {
    const wide = search(Infinity);
    if (wide && better(wide, best)) best = wide;
  }
  // Weather filtered out every outfit (say his only shoes are suede on a wet day): pick without it.
  if (!best) return needs ? pickOutfit({ ...input, needs: null }, engine, parts) : { state: "thin", outfit: null, known: [], missingSlots: [] };

  return { state: "enough", outfit: describeOutfit(best.items, best.layer, best.predicted, needs, evening, heavyOwned), known: [], missingSlots: [] };
}

/** The picked pieces as the card saves them: shown layer first, what's missing for the weather, and the reason lines. */
function describeOutfit(
  items: readonly ClosetItem[], layer: ClosetItem | null, predicted: number, needs: WeatherNeeds | null, evening: boolean, heavyOwned: boolean,
): PickedOutfit {
  const warm = items.some((i) => isWarmLayer(i.garment));
  let missing: MissingSlot | null = null;
  if (needs && (needs.layer === "required" || needs.layer === "outer") && !warm) missing = "layer";
  else if (needs?.layer === "outer" && !heavyOwned) missing = "coat";

  const reasons: IdeaReason[] = [];
  const layerItem = layer ?? items.find((i) => isWarmLayer(i.garment)) ?? null;
  if (needs?.hot) reasons.push({ key: "hotLight" });
  else if (missing === "layer") reasons.push({ key: "needLayer" });
  else if (layerItem && needs && needs.layer !== "none") {
    reasons.push({ key: evening ? "layerLate" : needs.removable && layer ? "layerOff" : "layerWarm", itemId: layerItem.id });
  }
  if (missing === "coat") reasons.push({ key: "needCoat" });
  const shoe = items.find((i) => i.slot === "shoes");
  if (needs?.wet && shoe && !isFairWeatherShoe(shoe.garment)) reasons.push({ key: "wetShoes", itemId: shoe.id });
  if (reasons.length === 0) reasons.push({ key: "occasion" });

  const shown = layer ? [layer, ...items.filter((i) => i !== layer)] : items;
  return { itemIds: shown.map((i) => i.id), missing, reasons: reasons.slice(0, 2), predicted };
}

/** One piece he could swap in (S28): the piece, and the whole outfit with it, as the card would save it. */
export interface SwapOption {
  itemId: string;
  outfit: PickedOutfit;
}

/**
 * Swap one (02 S28, 09-ui-review §28, #377): the closet's pieces that could take `out`'s place in `outfit` and still pass
 * the picker's rules: allowed for the occasion and weather, the weather's layer rule kept, `outfitValid`, and a score of
 * at least Put together (or the outfit's own score, when that's lower). Pieces already in the outfit and `exclude` (what
 * he swapped away from this card) are never offered. Right for the weather first, then the score, then a stable tie-break.
 */
export function swapOptions(
  input: PickInput & { outfit: readonly string[]; out: string }, engine: RubricEngine = defaultRubric, parts: PartsEngine = defaultParts,
): SwapOption[] {
  const { occasion, styles = null, boldness = "a_little", needs = null, evening = false, seed } = input;
  const byId = new Map(input.closet.map((c) => [c.id, c]));
  const current = input.outfit.map((id) => byId.get(id)).filter((c): c is ClosetItem => !!c);
  const outItem = current.find((c) => c.id === input.out);
  if (!outItem) return [];
  const exclude = input.exclude ?? new Set<string>();
  const heavyOwned = input.closet.some((c) => isHeavyOuter(c.garment));
  const warmOwned = input.closet.some((c) => isWarmLayer(c.garment));
  // Scored in rotation's order (layer last), as the picker does.
  const ordered = (items: ClosetItem[]) => [...items].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  const scoreOf = (items: ClosetItem[]) => scoreOutfit(items, occasion, styles, boldness, parts)?.overall ?? null;
  const base = scoreOf(ordered(current));
  const floor = Math.min(7, base ?? 7);
  const inOutfit = new Set(input.outfit);

  const options: { option: SwapOption; wrong: number; predicted: number; tie: number }[] = [];
  for (const it of input.closet) {
    if (it.slot !== outItem.slot || inOutfit.has(it.id) || exclude.has(it.id) || !itemAllowed(it, needs, occasion)) continue;
    const items = ordered(current.map((c) => (c.id === outItem.id ? it : c)));
    const warm = items.some((i) => isWarmLayer(i.garment));
    const layer = items.find((i) => i.slot === "outer") ?? null;
    if (needs && (needs.layer === "required" || needs.layer === "outer") && warmOwned && !warm) continue;
    if (needs?.layer === "outer" && heavyOwned && !(layer && isHeavyOuter(layer.garment))) continue;
    if (!outfitValid(items, styles, boldness, engine)) continue;
    const predicted = scoreOf(items);
    if (predicted === null || predicted < floor) continue;
    const bottoms = items.filter((i) => i.slot === "bottom");
    let wrong = items.reduce((a, i) => a + wrongWeatherOf(i, needs) + wrongOccasion(i, occasion, bottoms), 0); // slides and runners out of the house go last (#379, #380)
    if (needs?.layer === "none" && warm) wrong += 1;
    options.push({
      option: { itemId: it.id, outfit: describeOutfit(items, layer, predicted, needs, evening, heavyOwned) },
      wrong, predicted, tie: hash(`${seed}|swap|${it.id}`),
    });
  }
  return options
    .sort((a, b) => a.wrong - b.wrong || b.predicted - a.predicted || a.tie - b.tie)
    .map((o) => o.option);
}
