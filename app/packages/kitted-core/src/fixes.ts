// Fix engine (spec 04 §5; exact port of kitted_logic.suggest_fixes / apply_fix / fix_targets).
// The AI never picks fixes. Code picks them from the rules that fired, and every predicted score is the rubric's
// own number: apply the fix's edit to a COPY of the reading and re-score it. Never hand-write a gain.

import { garmentName, G, idx, SLOT_TO_CLOSET } from "./names";
import { defaultRubric, type RubricEngine } from "./rubric";
import type {
  Band, ClosetItem, FixCatalog, FixEdit, FixMatch, FixOption, FixTier, Garment, Reading, ScoredResult, ScoreOptions, Styles,
} from "./types";
import { clone, has, isNone, nearest, pyMax, pyMin, pyRound, replaceAll, truthy } from "./util";

export interface Fix {
  target: string;
  tier: FixTier;
  effort: number;
  free: boolean;
  /** Predicted display score after the fix (the rubric's own number). */
  to: number;
  /** Predicted raw score, Python round(x, 6). */
  toRaw: number;
  /** Display gain (to - base overall). */
  gain: number;
  /** Raw gain, Python round(x, 6). */
  rawGain: number;
  edits: FixEdit[];
  /** Closet item the fix uses ("Swap to your Khaki chinos"), else null. */
  itemId: string | null;
  copy: string;
  tag: string;
  /** Set on a parts-engine fix shown on the card (partsCheck.ts): its `edits` are then parts edits (PartsFixEdit),
   *  `target` is the parts candidate id, and only partsFixTargets / applyPartsFix may read them. */
  engine?: "parts";
  /** Parts fixes: "Raises Style to 7.5", "Clears the condition point", … ("" if none). */
  raisesLine?: string;
}

export interface FixSuggestions {
  baseOverall: number | null;
  baseRaw: number | null;
  fixes: Fix[];
  nextLevel: string[];
  tips: string[];
  /** Present only when no fix applies. */
  dialedIn?: string;
}

export interface FixOptions extends ScoreOptions {
  closet?: readonly ClosetItem[];
  /** The first check ever (onboarding): adjust tier only, else one "free if you own one". */
  firstCheck?: boolean;
  /** Targets he said don't apply ("Not quite right? → Fix doesn't apply"): skipped, next candidate shows. */
  excludeTargets?: readonly string[];
  /** A warm day (weather band "none", else the season): no "add a layer" and no boots fix (#160). */
  warm?: boolean;
}

interface FixInfo {
  name?: string;
  item?: string;
  item_id?: string;
  target?: string;
  alternatives?: boolean;
}

type Expanded =
  | { kind: "one"; reading: Reading; info: FixInfo }
  | { kind: "alts"; readings: Reading[]; info: FixInfo };

const NEUTRAL_FOR: Readonly<Record<string, string>> = { top: "white", outerwear: "navy", bottom: "navy", footwear: "white" };
const VOLUME_WORD: Readonly<Record<string, string>> = { 1: "fitted", 2: "slim-fit", 3: "regular-fit", 4: "relaxed", 5: "oversized" };

function catalogOf(engine: RubricEngine): FixCatalog {
  return engine.data.fixes;
}

function scoreWith(engine: RubricEngine, r: Reading, occasion: string, styles: Styles | null | undefined, boldness: string) {
  return engine.score(r, { occasion, styles, boldness });
}

/** Python `g.get(k)` normalized so a missing key and JSON null compare the same (both None). */
function getv(g: Garment, k: string): unknown {
  const v = g[k];
  return v === undefined ? null : v;
}

/** In any accepted band (v4: the default band or a detected style's band). which 0 = volume, 1 = leg index. */
function inBand(v: number, bands: readonly Band[], which: 0 | 1): boolean {
  return bands.some((b) => b[which][0] <= v && v <= b[which][1]);
}

/** kitted_logic._band_target: the in-band whole step nearest to v; ties go to the earlier band (default first). */
function bandTarget(v: number, bands: readonly Band[], which: 0 | 1): number {
  let best: number | null = null;
  for (const b of bands) {
    const lo = Math.ceil(b[which][0]);
    const hi = Math.floor(b[which][1]);
    const t = lo <= hi ? pyMin(pyMax(v, lo), hi) : nearest((b[which][0] + b[which][1]) / 2);
    if (best === null || Math.abs(t - v) < Math.abs(best - v)) best = t;
  }
  return best!;
}

function closetMatches(
  engine: RubricEngine, closet: readonly ClosetItem[], slot: string, match: FixMatch | undefined,
  current: Garment | null, bands: readonly Band[],
): ClosetItem[] {
  const out: ClosetItem[] = [];
  const want = has(SLOT_TO_CLOSET, slot) ? SLOT_TO_CLOSET[slot] : undefined;
  for (const it of closet) {
    if (it.slot !== want) continue;
    const g = it.garment;
    if (current !== null && g.subcategory === getv(current, "subcategory")
        && engine.fam(g.color_family) === engine.fam(getv(current, "color_family"))) {
      continue; // that's the piece he's already wearing
    }
    const m: FixMatch = match ?? {};
    const vol = (truthy(g.volume) ? g.volume : 3) as number;
    if (has(m, "volume_max") && vol > m.volume_max!) continue;
    if (truthy(m.volume_in_band) && !inBand(vol, bands, 0)) continue;
    if (truthy(m.leg_in_band)) {
      const li = engine.legIndex(g.leg_shape);
      if (li < 0 || !inBand(li, bands, 1)) continue;
    }
    if (has(m, "leg_in") && !m.leg_in!.includes(g.leg_shape as string)) continue;
    if (has(m, "not_subcategory") && m.not_subcategory!.includes(g.subcategory as string)) continue;
    if (has(m, "color_not_in") && m.color_not_in!.includes(g.color_family as string)) continue;
    if (has(m, "formality_min") && engine.formality(g) < m.formality_min!) continue;
    out.push(it);
  }
  return out;
}

/** One edit op -> the list of modified readings it can produce (kitted_logic._expand). */
function expand(
  engine: RubricEngine, op: FixEdit, r0: Reading, closet: readonly ClosetItem[], occasion: string,
  styles: Styles | null | undefined,
): Expanded[] {
  const res: Expanded[] = [];
  switch (op.op) {
    case "set": {
      const i = idx(r0, op.slot);
      if (i < 0) return [];
      const r = clone(r0);
      Object.assign(r.garments[i]!, clone(op.fields));
      return [{ kind: "one", reading: r, info: { name: garmentName(r0.garments[i]) } }];
    }
    case "set_where": {
      const hits: number[] = [];
      r0.garments.forEach((g, i) => {
        if (Object.keys(op.where).every((k) => getv(g, k) === (op.where as Record<string, unknown>)[k])) hits.push(i);
      });
      if (hits.length === 0) return [];
      const r = clone(r0);
      for (const i of hits) Object.assign(r.garments[i]!, clone(op.fields));
      return [{ kind: "one", reading: r, info: { name: garmentName(r0.garments[hits[0]!]) } }];
    }
    case "alternatives": {
      const i = idx(r0, op.slot);
      if (i < 0) return [];
      const alts = op.each.map((fields) => {
        const r = clone(r0);
        Object.assign(r.garments[i]!, clone(fields));
        return r;
      });
      return [{ kind: "alts", readings: alts, info: { name: garmentName(r0.garments[i]) } }];
    }
    case "set_band": {
      const i = idx(r0, op.slot);
      if (i < 0) return [];
      const bands = engine.bandsFor(r0);
      const g = r0.garments[i]!;
      const r = clone(r0);
      if (op.field === "volume") {
        const v = (truthy(g.volume) ? g.volume : 3) as number;
        const t = bandTarget(v, bands, 0);
        r.garments[i]!.volume = t;
        const word = has(VOLUME_WORD, String(t)) ? VOLUME_WORD[String(t)]! : "regular-fit";
        return [{ kind: "one", reading: r, info: { name: garmentName(g), target: word } }];
      }
      const li = engine.legIndex(g.leg_shape);
      if (li < 0) return [];
      const t = bandTarget(li, bands, 1);
      const leg = engine.legOrder[t]!;
      r.garments[i]!.leg_shape = leg;
      return [{ kind: "one", reading: r, info: { name: garmentName(g), target: leg } }];
    }
    case "swap_closet":
    case "add_closet": {
      const swap = op.op === "swap_closet";
      const slots = op.slot === "any_core" ? ["top", "bottom", "footwear"].filter((s) => idx(r0, s) >= 0) : [op.slot];
      for (const s of slots) {
        const i = idx(r0, s);
        if (swap && i < 0) continue;
        const cur = i >= 0 ? r0.garments[i]! : null;
        for (const it of closetMatches(engine, closet, s, op.match, swap ? cur : null, engine.bandsFor(r0))) {
          const r = clone(r0);
          const g = clone(it.garment);
          if (swap && cur) {
            // keep how he wears it (state fields) from the photo, take the item's identity
            for (const k of ["hem", "tucked", "length", "sleeve_end"]) {
              if (has(cur, k) && getv(g, "category") === getv(cur, "category")) g[k] = cur[k];
            }
            r.garments[i] = g;
          } else {
            r.garments.push(g);
          }
          res.push({ kind: "one", reading: r, info: { name: garmentName(g), item: it.name, item_id: it.id } });
        }
      }
      return res;
    }
    case "add_held": {
      const all = r0.held_items ?? [];
      const held = all.filter((h) => h.category === op.category);
      if (held.length === 0) return [];
      const r = clone(r0);
      r.garments.splice(1, 0, clone(held[0]!));
      r.held_items = all.filter((h) => h !== held[0]).map((h) => clone(h));
      return [{ kind: "one", reading: r, info: { name: garmentName(held[0]) } }];
    }
    case "add": {
      const gg = op.garment;
      const r = clone(r0);
      r.garments.push(G(gg.category, gg.subcategory, gg.color_family));
      return [{ kind: "one", reading: r, info: { name: garmentName(gg) } }];
    }
    case "neutralize_culprit": {
      r0.garments.forEach((g, i) => {
        const c = g.category;
        if (typeof c !== "string" || !has(NEUTRAL_FOR, c)) return;
        if (engine.neutrals.has(g.color_family) && (isNone(g.pattern) || g.pattern === "solid")) return;
        const r = clone(r0);
        Object.assign(r.garments[i]!, { color_family: NEUTRAL_FOR[c], saturation: "na", pattern: "solid", pattern_scale: "na" });
        res.push({ kind: "one", reading: r, info: { name: garmentName(g) } });
      });
      return res;
    }
    case "upgrade_culprit": {
      const core: [number, number][] = [];
      r0.garments.forEach((g, i) => {
        if (g.category === "top" || g.category === "bottom" || g.category === "footwear") core.push([engine.formality(g), i]);
      });
      if (core.length === 0) return [];
      let fmin = core[0]![0];
      for (const [f] of core) if (f < fmin) fmin = f;
      const lo = engine.occasionTarget(occasion)[0];
      for (const [f, i] of core) {
        if (f !== fmin) continue;
        const g = r0.garments[i]!;
        const c = g.category as string;
        if (truthy(op.from_closet)) {
          for (const it of closetMatches(engine, closet, c, { formality_min: f + 0.5 }, g, engine.bandsFor(r0))) {
            const r = clone(r0);
            r.garments[i] = clone(it.garment);
            res.push({ kind: "one", reading: r, info: { name: garmentName(g), item: it.name, item_id: it.id } });
          }
        } else {
          const up = c === "top" ? "oxford_shirt" : c === "bottom" ? "chinos" : lo >= 3.5 ? "loafer" : "white_leather_sneaker";
          const r = clone(r0);
          const rg = r.garments[i]!;
          rg.subcategory = up;
          if (c === "bottom" && (isNone(rg.leg_shape) || rg.leg_shape === "na")) rg.leg_shape = "straight";
          res.push({ kind: "one", reading: r, info: { name: garmentName(g) } });
        }
      }
      return res;
    }
    case "remove_most_formal_outer": {
      // Python max(outs) over (formality, index) tuples: highest formality, ties -> highest index
      let best: [number, number] | null = null;
      r0.garments.forEach((g, i) => {
        if (g.category !== "outerwear") return;
        const f = engine.formality(g);
        if (best === null || f > best[0] || (f === best[0] && i > best[1])) best = [f, i];
      });
      if (best === null) return [];
      const r = clone(r0);
      const [g] = r.garments.splice((best as [number, number])[1], 1);
      return [{ kind: "one", reading: r, info: { name: garmentName(g) } }];
    }
    default: {
      const never: never = op;
      throw new Error(`unknown fix op ${JSON.stringify(never)}`);
    }
  }
}

interface Evaluated {
  result: ScoredResult;
  reading: Reading;
  info: FixInfo;
}

/** Apply an option's edits (chained) and score the outcome; null when it doesn't apply (kitted_logic._evaluate). */
function evaluate(
  engine: RubricEngine, option: FixOption, reading: Reading, closet: readonly ClosetItem[], occasion: string,
  styles: Styles | null | undefined, boldness: string, warm = false,
): Evaluated | null {
  const cr = option.closet_requires;
  if (cr) {
    const want = has(SLOT_TO_CLOSET, cr.slot) ? SLOT_TO_CLOSET[cr.slot] : undefined;
    if (!closet.some((it) => it.slot === want && cr.subcategory_in.includes(it.garment.subcategory as string))) return null;
  }
  if (option.when?.leg_too_wide) {
    const i = idx(reading, "bottom");
    const lhi = Math.max(...engine.bandsFor(reading).map((b) => b[1][1]));
    const li = i >= 0 ? engine.legIndex(reading.garments[i]!.leg_shape) : -1;
    if (i < 0 || li < 0 || li <= lhi) return null;
  }
  const when = option.when;
  if (when) {
    const subs = (c: string) => reading.garments.filter((g) => g.category === c).map((g) => g.subcategory as string);
    const tops = subs("top");
    if (when.top_in && !tops.some((s) => when.top_in!.includes(s))) return null;
    if (when.top_not_in && tops.some((s) => when.top_not_in!.includes(s))) return null;
    if (when.bottom_not_in && subs("bottom").some((s) => when.bottom_not_in!.includes(s))) return null;
    if (when.shoe_not_in && subs("footwear").some((s) => when.shoe_not_in!.includes(s))) return null;
    if (when.not_warm && warm) return null;
  }
  let states: Expanded[] = [{ kind: "one", reading, info: {} }];
  for (const op of option.edits) {
    const nxt: Expanded[] = [];
    for (const st of states) {
      if (st.kind === "alts") throw new Error("an 'alternatives' edit must be the last edit of an option");
      for (const out of expand(engine, op, st.reading, closet, occasion, styles)) {
        if (out.kind === "alts") nxt.push({ kind: "alts", readings: out.readings, info: { ...st.info, ...out.info, alternatives: true } });
        else nxt.push({ kind: "one", reading: out.reading, info: { ...st.info, ...out.info } });
      }
    }
    states = nxt;
    if (states.length === 0) return null;
  }
  let best: Evaluated | null = null;
  for (const st of states) {
    let sc: ScoredResult | null = null;
    let rr: Reading;
    if (st.kind === "alts") {
      // conservative: the prediction is the WORST alternative, never over-promise (first minimum wins)
      let worst: { sc: ScoredResult; r: Reading } | null = null;
      for (const a of st.readings) {
        const s = scoreWith(engine, a, occasion, styles, boldness);
        if (s.overall === null) continue;
        if (worst === null || s.rawUnrounded < worst.sc.rawUnrounded) worst = { sc: s, r: a };
      }
      if (worst === null) continue;
      sc = worst.sc;
      rr = worst.r;
    } else {
      const s = scoreWith(engine, st.reading, occasion, styles, boldness);
      rr = st.reading;
      if (s.overall === null) continue;
      sc = s;
    }
    if (best === null || sc.rawUnrounded > best.result.rawUnrounded) best = { result: sc, reading: rr, info: st.info };
  }
  return best;
}

function copyLine(option: FixOption, info: FixInfo): [string, string] {
  const s = replaceAll(replaceAll(replaceAll(option.copy, "{name}", info.name ?? "piece"), "{item}", info.item ?? ""),
    "{target}", info.target ?? "");
  const d = replaceAll(option.detail ?? "", "{target}", info.target ?? "");
  const tags: Record<FixTier, string> = {
    adjust: "Free" + (d ? ` · ${d}` : ""),
    swapFromCloset: "Free · from your closet",
    changeInto: "Free if you own one",
    tailor: "Tailor" + (d ? ` · ${d}` : " ~$15"),
    buy: "Buy",
  };
  return [s, tags[option.tier]];
}

type Candidate = Fix & { order: number; shift: number };

/** Python tuple comparison (a1, a2, a3) > (b1, b2, b3). */
function tupleGt(a: [number, number, number], b: [number, number, number]): boolean {
  return a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] > b[2])));
}

/** How far a shoe swap moves the shoes' dressiness; on a tie the smallest change wins (#160). 0 for other fixes. */
function shoeShift(engine: RubricEngine, option: FixOption, reading: Reading): number {
  const i = idx(reading, "footwear");
  for (const op of option.edits) {
    if (op.op === "set" && op.slot === "footwear" && has(op.fields, "subcategory") && i >= 0) {
      return Math.abs(engine.formality({ subcategory: op.fields.subcategory } as Garment) - engine.formality(reading.garments[i]!));
    }
  }
  return 0;
}

/** Lexicographic comparator over number tuples (Python sort key). */
function byKey<T>(key: (x: T) => number[]): (a: T, b: T) => number {
  return (a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i]! < kb[i]!) return -1;
      if (ka[i]! > kb[i]!) return 1;
    }
    return 0;
  };
}

/** Up to 3 fixes for a reading (spec 04 §5.4). Never mutates `reading` or `closet`. */
export function suggestFixes(reading: Reading, opts: FixOptions = {}, engine: RubricEngine = defaultRubric): FixSuggestions {
  const occasion: string = opts.occasion ?? "everyday";
  const boldness: string = opts.boldness ?? "a_little";
  const styles = opts.styles;
  const closet = opts.closet ?? [];
  const catalog = catalogOf(engine);
  const base = scoreWith(engine, reading, occasion, styles, boldness);
  const out: FixSuggestions = {
    baseOverall: base.overall, baseRaw: base.overall === null ? null : base.rawUnrounded, fixes: [], nextLevel: [], tips: [],
  };
  if (base.overall === null) return out;
  for (const a of base.advice) {
    if (a.startsWith("next level:")) out.nextLevel.push(has(catalog.next_level, a) ? catalog.next_level[a]! : a);
    else out.tips.push(has(catalog.tips, a) ? catalog.tips[a]! : a);
  }
  const fired = Array.from(new Set(base.rulesFired));
  let targets: string[];
  if (fired.length > 0) {
    targets = fired;
  } else {
    // clean outfit: credit fixes only (K3 is never a fix, it's the "Next level" tip)
    targets = ["K1_layered", "K2_elevated_piece", "K4_shoes_complement"].filter((k) => !(base.credits as string[]).includes(k));
    if (engine.loungeOk.has(occasion)) targets = []; // at the gym or home, a clean outfit has nothing to fix
    if (base.notRated.includes("shoes") || base.notRated.includes("bottom half") || base.notRated.includes("shoes not rated")) targets = targets.filter((t) => t !== "K4_shoes_complement");
  }
  if (opts.warm) targets = targets.filter((t) => t !== "K1_layered");
  if (opts.excludeTargets && opts.excludeTargets.length > 0) {
    const skip = new Set(opts.excludeTargets);
    targets = targets.filter((t) => !skip.has(t));
  }
  const tiers = catalog.tiers;

  const candidates = (allowed: ReadonlySet<string>): Candidate[] => {
    const cands: Candidate[] = [];
    targets.forEach((t, order) => {
      let best: Candidate | null = null;
      for (const opt of has(catalog.targets, t) ? catalog.targets[t]! : []) {
        if (!allowed.has(opt.tier)) continue;
        const ev = evaluate(engine, opt, reading, closet, occasion, styles, boldness, opts.warm ?? false);
        if (!ev) continue;
        const sc = ev.result;
        const gain = sc.overall - base.overall;
        const rawGain = sc.rawUnrounded - base.rawUnrounded;
        if (gain < 0.5) continue;
        const eff = opt.effort ?? tiers[opt.tier].effort; // adding a whole piece costs 3 (#160)
        const [copy, tag] = copyLine(opt, ev.info);
        const c: Candidate = {
          target: t, tier: opt.tier, effort: eff, free: tiers[opt.tier].free,
          to: sc.overall, toRaw: pyRound(sc.rawUnrounded, 6), gain, rawGain: pyRound(rawGain, 6),
          edits: clone(opt.edits), itemId: ev.info.item_id ?? null, copy, tag, order, shift: shoeShift(engine, opt, reading),
        };
        // NOTE: Python compares this option's UNROUNDED raw gain against the best's ROUNDED one. Kept on purpose.
        if (best === null || tupleGt([rawGain / eff, -eff, -c.shift], [best.rawGain / best.effort, -best.effort, -best.shift])) best = c;
      }
      if (best) cands.push(best);
    });
    return cands;
  };

  const rank = (c: Candidate): number[] => [-c.rawGain / c.effort, c.effort, c.order];
  const allowed = new Set<string>(opts.firstCheck ? ["adjust"] : Object.keys(tiers));
  let cands = candidates(allowed);
  // at least one free fix whenever any fix exists: the best-ranked one (#160)
  if (opts.firstCheck && cands.length === 0) cands = candidates(new Set(["adjust", "changeInto"])).sort(byKey(rank)).slice(0, 1);
  cands.sort(byKey(rank)); // stable, like Python
  const freeTos = cands.filter((c) => c.free).map((c) => c.to);
  const bestFree = freeTos.length ? freeTos.reduce((m, x) => (x > m ? x : m)) : null;
  let picked: Candidate[] = [];
  for (const c of cands) {
    if (picked.length === 3) break;
    if (c.tier === "buy" && (picked.some((p) => p.tier === "buy") || (bestFree !== null && bestFree >= 7.0))) continue;
    picked.push(c);
  }
  if (cands.length > 0 && !picked.some((p) => p.free) && cands.some((c) => c.free)) {
    const f = cands.find((c) => c.free)!;
    picked = picked.length === 3 ? [...picked.slice(0, 2), f] : [...picked, f];
  }
  picked.sort(byKey((c: Candidate) => [c.free ? 0 : 1, ...rank(c)])); // rank order, free first (#160; was by rounded gain)
  out.fixes = picked.map(({ order: _order, shift: _shift, ...fix }) => fix);
  if (out.fixes.length === 0) out.dialedIn = "This is dialed in. Nothing to fix.";
  return out;
}

/** "Didn't catch the change? Tell me": apply the fix's edits to the FIRST reading (source userConfirmed). */
export function applyFix(
  reading: Reading, fix: Pick<Fix, "edits"> & { itemId?: string | null },
  opts: { closet?: readonly ClosetItem[]; occasion?: string; styles?: Styles | null } = {},
  engine: RubricEngine = defaultRubric,
): Reading | null {
  const closet = opts.closet ?? [];
  const occasion = opts.occasion ?? "everyday";
  let states: Reading[] = [reading];
  for (const op of fix.edits) {
    const nxt: Reading[] = [];
    for (const r of states) {
      for (const out of expand(engine, op, r, closet, occasion, opts.styles)) {
        if (out.kind === "alts") {
          nxt.push(out.readings[0]!);
        } else {
          const id = out.info.item_id;
          if (fix.itemId && !(id === undefined || id === null || id === fix.itemId)) continue;
          nxt.push(out.reading);
        }
      }
    }
    states = nxt;
  }
  return states[0] ?? null;
}

/** Reading fields a card's fixes touch: "category" = whole slot, "category.field" = one field, "*" = any. Sorted. */
export function fixTargets(fixes: readonly Pick<Fix, "edits">[]): string[] {
  const t = new Set<string>();
  for (const f of fixes) {
    for (const op of f.edits) {
      switch (op.op) {
        case "set":
          for (const x of Object.keys(op.fields)) t.add(`${op.slot}.${x}`);
          break;
        case "set_where":
          for (const x of Object.keys(op.fields)) t.add(`*.${x}`);
          break;
        case "swap_closet":
        case "alternatives":
          t.add(op.slot ?? "*");
          break;
        case "upgrade_culprit":
          t.add("*");
          break;
        case "add_held":
          t.add(op.category || "outerwear");
          break;
        case "add_closet":
          t.add(op.slot || "outerwear");
          break;
        case "add":
          t.add(op.garment?.category || "outerwear");
          break;
        case "remove_most_formal_outer":
          t.add("outerwear");
          break;
        case "set_band":
          t.add(`${op.slot}.${op.field}`);
          break;
        case "neutralize_culprit":
          for (const x of ["*.color_family", "*.pattern", "*.pattern_scale", "*.saturation"]) t.add(x);
          break;
      }
    }
  }
  return Array.from(t).sort();
}
