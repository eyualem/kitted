// The parts engine's fix engine: exact port of handoff/fixtures/parts_fixes.py (suggest_parts_fixes; DECISIONS-LOG
// #208). NOT wired into the app: fixes.ts (v4.1) still makes the card's fixes.
//
// "A fix row never shows a gain that doesn't happen" (#204). Every candidate in the catalog (fixes.json -> "parts",
// bundled as partsFixesData.ts) is an edit to a COPY of the scored garments, re-scored with the parts engine:
//  - the ROUNDED score rises -> a fix, with the engine's own number and the parts it raises;
//  - a part's half point rises but the rounded score doesn't (nothing drops) -> the "Smaller step" line, no number;
//  - no fix and no smaller step -> a "Next level" line when its edit would lift the named part.
// Order: free, closet, "free if you own one", tailor; the larger gain first inside a class; one fix per group (a later
// class shows only with a strictly larger gain); at most 3. #162's rules: no layer and no boots on a warm day, no
// boots with shorts, never one everyday sneaker for another; at the gym or home only the `lounge` free actions.
//
// Parity (fixtures/parts_fixes.json, every case exactly): the same candidate and state order as Python, Python's
// round(x, 6) (pyRound) on raw numbers, the half-point helpers for shown numbers, first-max / first-min ties.

import { garmentName, G, SLOT_TO_CLOSET } from "./names";
import { defaultParts, type PartName, type PartsEngine, type PartsScored, type SecondLookInput } from "./parts";
import { PARTS_FIXES_DATA } from "./partsFixesData";
import { defaultRubric, type RubricEngine } from "./rubric";
import type { ClosetItem, Garment, Reading, Styles } from "./types";
import { clone, deepEqual, has, isNone, pyRound, replaceAll, truthy } from "./util";

// ================================================================= catalog and result types

export type PartsFixClass = "free" | "closet" | "own" | "tailor";

export type PartsFixEdit =
  | { op: "set"; slot: string; fields: Record<string, unknown> }
  | { op: "set_where"; where: Record<string, unknown>; fields: Record<string, unknown> }
  | { op: "set_visible_layer"; fields: Record<string, unknown> }
  | { op: "fit_culprit" }
  | { op: "neutral_color" }
  | { op: "plain_pattern" }
  | { op: "swap_closet"; slot: string }
  | { op: "add_closet"; slot: string }
  | { op: "add_held"; category: string }
  | { op: "add"; garments: { category: string; subcategory: string; color_family: string }[] };

export interface PartsFixCandidate {
  id: string;
  class: PartsFixClass;
  group: string;
  effort: number;
  /** Allowed at the gym and at home. */
  lounge?: boolean;
  copy: string;
  detail: string;
  /** The Smaller-step subject, ending in its verb ("Dark straight jeans lift"). */
  step: string;
  when?: Record<string, unknown>;
  edits: PartsFixEdit[];
  /** Second-look overrides after the edit (a tuck hides a peek). */
  look?: Record<string, unknown>;
}

export interface PartsNextLevel {
  id: string;
  part: PartName;
  copy: string;
  when?: Record<string, unknown>;
  edits: PartsFixEdit[];
  /** His first pick's path to 8: tried first, only when this is his first pick and the edited outfit reads as it. */
  style?: string;
  /** With `style`: not shown when the Smaller step on the card is in this group (the same move said twice). */
  group?: string;
  /** Second-look overrides after the edit. */
  look?: Record<string, unknown>;
}

/** fixes.json -> "parts" (bundled as partsFixesData.ts). */
export interface PartsFixCatalog {
  _doc?: string;
  version: string;
  classes: Record<PartsFixClass, { rank: number; free: boolean; tag: string }>;
  rules: {
    boots: string[];
    shorts: string[];
    everydaySneakers: string[];
    loungeOccasions: string[];
    maxFixes: number;
    maxTailor: number;
    neutralFor: Record<string, string>;
    shortSleeve: string[];
    keepVolume: string[];
    keepOnSwap: string[];
    /** Closet pieces whose type was never read ("other") are never swapped in. */
    closetSkip: string[];
  };
  copy: {
    raisesOne: string;
    raisesOneSame: string;
    raisesTwo: string;
    raisesCondition: string;
    raisesOccasion: string;
    smallerStepLabel: string;
    smallerStep: string;
    nextLevelLabel: string;
    noFixes: string;
    dialedIn: string;
  };
  candidates: PartsFixCandidate[];
  nextLevel: PartsNextLevel[];
}

/** A part a fix raises: its half-point display before and after. */
export interface PartRaise { part: PartName; from: number; to: number }

export interface PartsFix {
  id: string;
  group: string;
  class: PartsFixClass;
  effort: number;
  free: boolean;
  /** The parts engine's own score after the fix (half points). */
  to: number;
  /** Python round(raw, 6). */
  toRaw: number;
  /** to - the score before (half points, >= 0.5). */
  gain: number;
  rawGain: number;
  /** The closet piece it uses ("Swap to your Khaki chinos"), else null. */
  itemId: string | null;
  copy: string;
  /** "Free", "Free · from your closet", "Free if you own one", "Tailor · ~$15 at a tailor". */
  tag: string;
  /** The parts whose score rose, largest weighted rise first. */
  raises: PartRaise[];
  /** "Raises Style to 7.5", "Raises Proportions and Style", "Clears the condition point", … ("" if none). */
  raisesLine: string;
  /** The catalog's edits (for re-check targeting later; not part of the parity fixture). */
  edits: PartsFixEdit[];
}

export interface PartsSmallerStep {
  id: string;
  class: PartsFixClass;
  itemId: string | null;
  part: PartName;
  from: number;
  to: number;
  rawGain: number;
  /** "Dark straight jeans lift Style to 7.5, but the score stays 7.0." */
  line: string;
}

export interface PartsFixSuggestions {
  baseOverall: number | null;
  baseRaw: number | null;
  fixes: PartsFix[];
  smallerStep: PartsSmallerStep | null;
  /** `style`: the pick whose path this line names (null for the generic lines). */
  nextLevel: { id: string; part: PartName; line: string; style: string | null } | null;
  /** When there's no fix: "No quick fixes for this one." (or "Dialed in. Nothing to fix." at 9+). */
  noneLine: string | null;
}

export interface PartsFixOptions {
  occasion?: string;
  styles?: Styles | null;
  boldness?: string;
  secondLook?: SecondLookInput | null;
  closet?: readonly ClosetItem[];
  /** A warm day (weather band "none", else May–September): no layer and no boots (#160/#162). */
  warm?: boolean;
  /** The first check ever: free actions only, else one "free if you own one". */
  firstCheck?: boolean;
  /** Candidate ids he said don't apply. */
  exclude?: readonly string[];
}

export interface PartsFixEngines {
  parts?: PartsEngine;
  rubric?: RubricEngine;
  catalog?: PartsFixCatalog;
}

// ================================================================= helpers

const nv = (v: unknown): unknown => (v === undefined ? null : v);
const inList = (v: unknown, xs: readonly unknown[]): boolean => xs.includes(nv(v));
/** Python f"{x:g}" for a half-point value. */
const pyG = (x: number): string => String(x);
const PART_KEYS: readonly PartName[] = ["proportions", "fit", "color", "shoes", "cohesion"];

interface Info { name?: string; item?: string; item_id?: string }
type Expanded = { kind: "one"; reading: Reading; info: Info } | { kind: "alts"; readings: Reading[]; info: Info };
interface Scored { res: PartsScored; reading: Reading; info: Info }
interface Cand {
  id: string; group: string; cls: PartsFixClass; rank: number; effort: number; free: boolean; to: number; toRaw: number;
  gain: number; rawGain: number; itemId: string | null; order: number; shift: number; pickRank: number; copy: string; tag: string;
  raises: PartRaise[]; raisesLine: string; step: string; drops: boolean; liftsDisplay: boolean; edits: PartsFixEdit[];
}

const first = (r: Reading, cat: string): Garment | null => r.garments.find((g) => g.category === cat) ?? null;
const index = (r: Reading, cat: string): number => r.garments.findIndex((g) => g.category === cat);

/** parts_fixes._match: "field": value, "field_in": [...], "field_not_in": [...]. */
function matches(g: Garment, where: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(where)) {
    if (k.endsWith("_not_in")) {
      if (inList(g[k.slice(0, -7)], v as unknown[])) return false;
    } else if (k.endsWith("_in")) {
      if (!inList(g[k.slice(0, -3)], v as unknown[])) return false;
    } else if (nv(g[k]) !== v) {
      return false;
    }
  }
  return true;
}

// ================================================================= the engine

/** Up to 3 parts-engine fixes for a reading, a Smaller step and a Next level line. Never mutates its inputs. */
export function suggestPartsFixes(reading: Reading, opts: PartsFixOptions = {}, engines: PartsFixEngines = {}): PartsFixSuggestions {
  const PE = engines.parts ?? defaultParts;
  const RE = engines.rubric ?? defaultRubric;
  const CAT = engines.catalog ?? PARTS_FIXES_DATA;
  const W = PE.data.weights;
  const NAMES = PE.data.partNames;
  const rules = CAT.rules;
  const occasion = opts.occasion ?? "everyday";
  const boldness = opts.boldness ?? "a_little";
  const styles = opts.styles ?? null;
  // his picks in order (the 1st pick first); a weight of 0 is not a pick. They shape the fixes, never the score.
  const picks = (styles ?? []).filter(([, wt]) => truthy(wt) && wt > 0).map(([st]) => st as string);
  const pickRank = (res: PartsScored): number => {
    const i = picks.findIndex((st) => (res.detectedStyles as readonly string[]).includes(st));
    return i < 0 ? picks.length : i;
  };
  const closet = opts.closet ?? [];
  const warm = opts.warm ?? false;
  const firstCheck = opts.firstCheck ?? false;
  const exclude = new Set(opts.exclude ?? []);

  const score = (r: Reading, sl: SecondLookInput | null | undefined) =>
    PE.scoreParts(r, { occasion, styles, boldness, secondLook: sl ?? null });

  const out: PartsFixSuggestions = { baseOverall: null, baseRaw: null, fixes: [], smallerStep: null, nextLevel: null, noneLine: null };
  const b = score(reading, opts.secondLook);
  if (b.overall === null) return out;
  const base = b as PartsScored;
  out.baseOverall = base.overall;
  out.baseRaw = pyRound(base.rawUnrounded, 6);

  // the scored garments as a reading (parts_fixes._working)
  const prep = RE.helpers.prepare(reading);
  const w: Reading = { scene: prep.scene, garments: prep.garments };
  if (truthy(reading.held_items)) w.held_items = clone(reading.held_items);
  const baseSl = { peek: base.secondLook.peek, rests_on_shoe: base.secondLook.restsOnShoe };
  const lounge = rules.loungeOccasions.includes(occasion);
  const allowed = new Set<string>(firstCheck ? ["free"] : Object.keys(CAT.classes));

  const quiet = (r: Reading): boolean => {
    const main = r.garments.filter((g) => inList(g.category, ["top", "outerwear", "bottom"]));
    if (main.length === 0) return false;
    for (const g of main) {
      const c = nv(g.color_family);
      if (RE.isBright(g) || (!RE.neutrals.has(c) && c !== null && c !== "multicolor" && !String(c).startsWith("denim"))) return false;
      if (!inList(g.pattern, [null, "solid"])) return false;
    }
    return true;
  };

  const whenOk = (when: Record<string, unknown> | undefined, r: Reading): boolean => {
    for (const [k, v] of Object.entries(when ?? {})) {
      if (k === "not_warm") {
        if (truthy(v) && warm) return false;
      } else if (k === "no_outer") {
        if (truthy(v) && first(r, "outerwear") !== null) return false;
      } else if (k === "occasion_in") {
        if (!(v as unknown[]).includes(occasion)) return false;
      } else if (k === "quiet") {
        if (truthy(v) && !quiet(r)) return false;
      } else {
        const dot = k.indexOf(".");
        const slot = k.slice(0, dot);
        const cond = k.slice(dot + 1);
        const g = first(r, slot);
        if (cond.endsWith("_not_in")) {
          if (inList(g ? g[cond.slice(0, -7)] : null, v as unknown[])) return false;
        } else if (cond.endsWith("_in")) {
          if (!inList(g ? g[cond.slice(0, -3)] : null, v as unknown[])) return false;
        } else {
          throw new Error(`parts fix catalog: unknown condition ${k}`);
        }
      }
    }
    return true;
  };

  const expand = (op: PartsFixEdit, r0: Reading): Expanded[] => {
    const res: Expanded[] = [];
    switch (op.op) {
      case "set": {
        const i = index(r0, op.slot);
        if (i < 0) return [];
        const r = clone(r0);
        Object.assign(r.garments[i]!, clone(op.fields));
        return [{ kind: "one", reading: r, info: { name: garmentName(r0.garments[i]) } }];
      }
      case "set_where": {
        const hits: number[] = [];
        r0.garments.forEach((g, i) => { if (matches(g, op.where)) hits.push(i); });
        if (hits.length === 0) return [];
        const r = clone(r0);
        for (const i of hits) Object.assign(r.garments[i]!, clone(op.fields));
        return [{ kind: "one", reading: r, info: { name: garmentName(r0.garments[hits[0]!]) } }];
      }
      case "set_visible_layer": {
        let i = index(r0, "outerwear");
        if (i < 0) i = index(r0, "top");
        if (i < 0) return [];
        const r = clone(r0);
        Object.assign(r.garments[i]!, clone(op.fields));
        return [{ kind: "one", reading: r, info: { name: garmentName(r0.garments[i]) } }];
      }
      case "fit_culprit": {
        r0.garments.forEach((g, i) => {
          const cat = g.category;
          if (!inList(cat, ["top", "outerwear", "bottom"])) return;
          const sleeves = cat !== "bottom" && g.sleeve_end === "covers_hand" && !inList(g.subcategory, rules.shortSleeve);
          const strain = g.strain === "clear";
          if (!(sleeves || strain)) return;
          const r = clone(r0);
          const h = r.garments[i]!;
          if (sleeves) {
            h.sleeve_end = "at_wrist";
            if ((truthy(h.volume) ? (h.volume as number) : 3) >= 4 && !inList(h.subcategory, rules.keepVolume)) h.volume = 3;
          }
          if (strain) h.strain = "none";
          res.push({ kind: "one", reading: r, info: { name: garmentName(g) } });
        });
        return res;
      }
      case "neutral_color": {
        r0.garments.forEach((g, i) => {
          const cat = g.category;
          if (typeof cat !== "string" || !has(rules.neutralFor, cat)) return;
          const c = nv(g.color_family);
          if (RE.neutrals.has(c) || c === null) return;
          const r = clone(r0);
          Object.assign(r.garments[i]!, { color_family: rules.neutralFor[cat], saturation: "na" });
          res.push({ kind: "one", reading: r, info: { name: garmentName(g) } });
        });
        return res;
      }
      case "plain_pattern": {
        r0.garments.forEach((g, i) => {
          if (!inList(g.category, ["top", "outerwear", "bottom"]) || inList(g.pattern, [null, "solid"])) return;
          const r = clone(r0);
          Object.assign(r.garments[i]!, { pattern: "solid", pattern_scale: "na" });
          res.push({ kind: "one", reading: r, info: { name: garmentName(g) } });
        });
        return res;
      }
      case "swap_closet":
      case "add_closet": {
        const swap = op.op === "swap_closet";
        const i = index(r0, op.slot);
        if (swap && i < 0) return [];
        const cur = i >= 0 ? r0.garments[i]! : null;
        const want = SLOT_TO_CLOSET[op.slot];
        for (const it of closet) {
          if (it.slot !== want || inList(it.garment.subcategory, rules.closetSkip)) continue; // a type never read can't promise a score
          const g = clone(it.garment);
          let r: Reading;
          if (swap) {
            if (nv(g.subcategory) === nv(cur!.subcategory) && RE.fam(nv(g.color_family)) === RE.fam(nv(cur!.color_family))) continue;
            for (const k of rules.keepOnSwap) {
              if (has(cur!, k) && nv(g.category) === nv(cur!.category)) g[k] = cur![k];
            }
            r = clone(r0);
            r.garments[i] = g;
          } else {
            r = clone(r0);
            r.garments.push(g);
          }
          res.push({ kind: "one", reading: r, info: { name: garmentName(g), item: it.name, item_id: it.id } });
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
        const alts = op.garments.map((gg) => {
          const r = clone(r0);
          r.garments.push(G(gg.category, gg.subcategory, gg.color_family));
          return r;
        });
        const info = { name: garmentName(op.garments[0]) };
        return alts.length === 1 ? [{ kind: "one", reading: alts[0]!, info }] : [{ kind: "alts", readings: alts, info }];
      }
      default: {
        const never: never = op;
        throw new Error(`unknown parts fix op ${JSON.stringify(never)}`);
      }
    }
  };

  const outerCount = (r: Reading) => r.garments.filter((g) => g.category === "outerwear").length;
  /** #162's hard rules on the edited reading. */
  const blocked = (r: Reading): boolean => {
    if (warm && outerCount(r) > outerCount(w)) return true;
    const s0 = first(w, "footwear");
    const s1 = first(r, "footwear");
    if (s1 !== null && (s0 === null || nv(s1.subcategory) !== nv(s0.subcategory))) {
      if (inList(s1.subcategory, rules.boots)) {
        const bt = first(r, "bottom");
        if (warm || (bt !== null && inList(bt.subcategory, rules.shorts))) return true;
      }
      if (s0 !== null && inList(s0.subcategory, rules.everydaySneakers) && inList(s1.subcategory, rules.everydaySneakers)) return true;
    }
    return false;
  };

  const lookFor = (over: Record<string, unknown> | undefined): SecondLookInput | null | undefined => {
    if (!truthy(over)) return opts.secondLook;
    return { ...baseSl, ...over };
  };

  const evaluate = (edits: PartsFixEdit[], look: Record<string, unknown> | undefined): Scored | null => {
    let states: Expanded[] = [{ kind: "one", reading: w, info: {} }];
    for (const op of edits) {
      const nxt: Expanded[] = [];
      for (const st of states) {
        if (st.kind === "alts") throw new Error("an alternatives edit must be the last edit of a candidate");
        for (const o of expand(op, st.reading)) {
          if (o.kind === "alts") nxt.push({ kind: "alts", readings: o.readings, info: { ...st.info, ...o.info } });
          else nxt.push({ kind: "one", reading: o.reading, info: { ...st.info, ...o.info } });
        }
      }
      states = nxt;
      if (states.length === 0) return null;
    }
    const sl = lookFor(look);
    let best: Scored | null = null;
    for (const st of states) {
      const alts = st.kind === "alts" ? st.readings : [st.reading];
      let worst: { res: PartsScored; reading: Reading } | null = null;
      for (const a of alts) {
        if (deepEqual(a.garments, w.garments) || blocked(a)) { worst = null; break; }
        const s = score(a, sl);
        if (s.overall === null) { worst = null; break; }
        const sc = s as PartsScored;
        if (worst === null || sc.rawUnrounded < worst.res.rawUnrounded) worst = { res: sc, reading: a };
      }
      if (worst === null) continue;
      if (best === null || worst.res.rawUnrounded > best.res.rawUnrounded) best = { res: worst.res, reading: worst.reading, info: st.info };
    }
    return best;
  };

  type Change = [PartName, number, number, number, number];
  const changes = (res: PartsScored): Change[] => {
    const outC: Change[] = [];
    for (const k of PART_KEYS) {
      const a = base.parts[k];
      const c = res.parts[k];
      if (!c || a.score === null || c.score === null) continue;
      outC.push([k, a.score, c.score, a.display!, c.display!]);
    }
    return outC;
  };

  const raisesOf = (res: PartsScored): PartRaise[] => {
    const ch = changes(res).filter(([, s0, s1]) => s1 > s0).map(([k, s0, s1, d0, d1]) => ({ k, c: W[k] * (s1 - s0), d0, d1 }));
    ch.sort((x, y) => (x.c !== y.c ? y.c - x.c : PART_KEYS.indexOf(x.k) - PART_KEYS.indexOf(y.k)));
    return ch.map((x) => ({ part: x.k, from: x.d0, to: x.d1 }));
  };

  const raisesLine = (res: PartsScored, raises: PartRaise[]): string => {
    const c = CAT.copy;
    if (raises.length >= 2) return replaceAll(replaceAll(c.raisesTwo, "{part}", NAMES[raises[0]!.part]), "{part2}", NAMES[raises[1]!.part]);
    if (raises.length === 1) {
      const x = raises[0]!;
      if (x.to > x.from) return replaceAll(replaceAll(c.raisesOne, "{part}", NAMES[x.part]), "{to}", pyG(x.to));
      return replaceAll(c.raisesOneSame, "{part}", NAMES[x.part]);
    }
    if (res.condition.deduction < base.condition.deduction) return c.raisesCondition;
    const o0 = base.occasion;
    const o1 = res.occasion;
    if (o1.deduction < o0.deduction || (o0.ceiling !== null && (o1.ceiling === null || o1.ceiling > o0.ceiling))) return c.raisesOccasion;
    return "";
  };

  const fill = (s: string, info: Info): string => replaceAll(replaceAll(s, "{name}", info.name ?? "piece"), "{item}", info.item ?? "");

  const shiftOf = (r: Reading): number => {
    const s0 = first(w, "footwear");
    const s1 = first(r, "footwear");
    if (s0 === null || s1 === null || nv(s0.subcategory) === nv(s1.subcategory)) return 0.0;
    return Math.abs(RE.formality(s1) - RE.formality(s0));
  };

  const cands: Cand[] = [];
  CAT.candidates.forEach((cand, order) => {
    if (exclude.has(cand.id)) return;
    if (lounge && !truthy(cand.lounge)) return;
    if (!whenOk(cand.when, w)) return;
    const ev = evaluate(cand.edits, cand.look);
    if (ev === null) return;
    const { res, reading: r, info } = ev;
    const cl = CAT.classes[cand.class];
    const ch = changes(res);
    const raises = raisesOf(res);
    cands.push({
      id: cand.id, group: cand.group, cls: cand.class, rank: cl.rank, effort: cand.effort, free: cl.free,
      to: res.overall, toRaw: pyRound(res.rawUnrounded, 6), gain: res.overall - base.overall,
      rawGain: pyRound(res.rawUnrounded - base.rawUnrounded, 6), itemId: info.item_id ?? null, order, shift: shiftOf(r), pickRank: pickRank(res),
      copy: fill(cand.copy, info), tag: cl.tag + (cand.detail ? ` · ${cand.detail}` : ""), raises, raisesLine: raisesLine(res, raises),
      step: fill(cand.step, info), drops: ch.some(([, , , d0, d1]) => d1 < d0), liftsDisplay: ch.some(([, , , d0, d1]) => d1 > d0),
      edits: clone(cand.edits),
    });
  });

  // on the same rounded gain, the fix that makes the outfit read as his earliest pick goes first
  const keyOf = (x: Cand): number[] => [x.rank, -x.gain, x.pickRank, -x.rawGain, x.effort, x.shift, x.order];
  const cmp = (a: number[], bb: number[]): number => {
    for (let i = 0; i < a.length; i++) if (a[i] !== bb[i]) return a[i]! < bb[i]! ? -1 : 1;
    return 0;
  };
  const byKey = (x: Cand, y: Cand) => cmp(keyOf(x), keyOf(y));

  const pick = (classes: ReadonlySet<string>): Cand[] => {
    const fixes = cands.filter((x) => x.gain >= 0.5 && classes.has(x.cls));
    const sorted = [...fixes].sort(byKey);
    const groups: string[] = [];
    for (const x of sorted) if (!groups.includes(x.group)) groups.push(x.group);
    const kept: Cand[] = [];
    for (const grp of groups) {
      let mx: number | null = null; // sorted by class first: a later entry is a later class or a smaller gain
      for (const x of sorted.filter((y) => y.group === grp)) {
        if (mx === null || x.gain > mx) {
          kept.push(x);
          mx = x.gain;
        }
      }
    }
    kept.sort(byKey);
    const picked: Cand[] = [];
    let tailor = 0;
    for (const x of kept) {
      if (picked.length === rules.maxFixes) break;
      if (x.cls === "tailor") {
        if (tailor >= rules.maxTailor) continue;
        tailor += 1;
      }
      picked.push(x);
    }
    return picked;
  };

  let picked = pick(allowed);
  if (firstCheck && picked.length === 0) picked = pick(new Set(["free", "own"])).slice(0, 1);
  const shown = new Set(picked.map((x) => x.id));

  const steps = cands.filter((x) => allowed.has(x.cls) && x.gain === 0 && x.rawGain > 0 && x.liftsDisplay && !x.drops && !shown.has(x.id));
  if (steps.length > 0) {
    // a smaller version of a shown move (same group) first, then the largest raw gain
    const groups = new Set(picked.map((x) => x.group));
    const sk = (x: Cand): number[] => [groups.has(x.group) ? 0 : 1, -x.rawGain, x.rank, x.effort, x.shift, x.order];
    const s = [...steps].sort((x, y) => cmp(sk(x), sk(y)))[0]!;
    const top = s.raises.find((p) => p.to > p.from)!;
    let line = replaceAll(CAT.copy.smallerStep, "{step}", s.step);
    line = replaceAll(line, "{part}", NAMES[top.part]);
    line = replaceAll(line, "{to}", pyG(top.to));
    line = replaceAll(line, "{score}", base.overall.toFixed(1));
    out.smallerStep = { id: s.id, class: s.cls, itemId: s.itemId, part: top.part, from: top.from, to: top.to, rawGain: s.rawGain, line };
  }

  if (picked.length === 0 && !lounge) {
    const step = out.smallerStep;
    const stepGroup = step ? (cands.find((x) => x.id === step.id)?.group ?? null) : null;
    for (const nl of CAT.nextLevel) {
      const st = nl.style ?? null;
      if (st !== null) {
        // his first pick's path to 8
        if (picks.length === 0 || st !== picks[0] || (nl.group ?? null) === stepGroup) continue;
      } else if (step !== null) {
        continue; // the generic lines: no fix and no Smaller step
      }
      if (!whenOk(nl.when, w)) continue;
      const ev = evaluate(nl.edits, nl.look);
      if (ev === null) continue;
      if (st !== null && !(ev.res.detectedStyles as readonly string[]).includes(st)) continue;
      const after = ev.res.parts[nl.part];
      const before = base.parts[nl.part];
      if (after && !isNone(after.display) && !isNone(before.display) && after.display! > before.display!) {
        out.nextLevel = { id: nl.id, part: nl.part, line: fill(nl.copy, ev.info), style: st };
        break;
      }
    }
  }

  out.fixes = picked.map((x) => ({
    id: x.id, group: x.group, class: x.cls, effort: x.effort, free: x.free, to: x.to, toRaw: x.toRaw, gain: x.gain, rawGain: x.rawGain,
    itemId: x.itemId, copy: x.copy, tag: x.tag, raises: x.raises, raisesLine: x.raisesLine, edits: x.edits,
  }));
  if (picked.length === 0) out.noneLine = base.overall >= 9.0 ? CAT.copy.dialedIn : CAT.copy.noFixes;
  return out;
}
