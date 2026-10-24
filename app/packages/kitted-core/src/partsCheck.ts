// The parts engine in the app's check flow (DECISIONS-LOG #209). Not part of the parity port: parts.ts and
// partsFixes.ts stay exact ports of parts_proto.py / parts_fixes.py; this file adapts their output to what the
// app already stores and shows (a card Fix row, re-check targets, "What changed?" and the re-check outcome).
//
//  - partsFixAsFix: a PartsFix as the card's Fix row (engine "parts", target = the candidate id, edits = its catalog
//    edits). The detail line names the parts it raises ("Raises Style and Proportions · free if you own one").
//  - partsFixTargets / cardFixTargets: the reading fields a card's fixes touch, for the anchored re-check merge.
//  - applyPartsFix: one fix's edits on a reading (S21 "What changed?"), the first state the fix engine tries.
//  - partsRecheckOutcome: recheckOutcome with the parts engine: before/after are parts scores.

import { G, SLOT_TO_CLOSET } from "./names";
import { fixTargets, type Fix } from "./fixes";
import { CASUAL_FITS_V14, partsDataFor, scoreParts, type PartName, type PartsOptions, type PartsScored, type SecondLookInput } from "./parts";
import { PARTS_FIXES_DATA } from "./partsFixesData";
import { defaultRubric } from "./rubric";
import type { PartsFix, PartsFixEdit } from "./partsFixes";
import type { RecheckOutcome } from "./recheck";
import type { ClosetItem, FixEdit, FixTier, Garment, Reading, RuleId } from "./types";
import { clone, has } from "./util";

/** The rubricVersion a parts-scored check stores ("parts-1.0.0"). */
export const PARTS_RUBRIC_VERSION = `parts-${partsDataFor(CASUAL_FITS_V14).version}`;

const TIER: Record<PartsFix["class"], FixTier> = { free: "adjust", closet: "swapFromCloset", own: "changeInto", tailor: "tailor" };
const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export const isPartsFix = (f: Pick<Fix, "engine">): boolean => f.engine === "parts";
const partsEdits = (f: Pick<Fix, "edits">): PartsFixEdit[] => f.edits as unknown as PartsFixEdit[];

/** A parts fix as the card's fix row. */
export function partsFixAsFix(pf: PartsFix): Fix {
  return {
    target: pf.id, tier: TIER[pf.class], effort: pf.effort, free: pf.free, to: pf.to, toRaw: pf.toRaw, gain: pf.gain, rawGain: pf.rawGain,
    edits: clone(pf.edits) as unknown as FixEdit[], itemId: pf.itemId, copy: pf.copy,
    tag: pf.raisesLine ? `${pf.raisesLine} · ${lowerFirst(pf.tag)}` : pf.tag,
    engine: "parts", raisesLine: pf.raisesLine,
  };
}

/** Reading fields a parts fix touches, in fixTargets' form ("category", "category.field", "*.field"). Sorted. */
export function partsFixTargets(fixes: readonly Pick<Fix, "edits">[]): string[] {
  const t = new Set<string>();
  for (const f of fixes) {
    for (const op of partsEdits(f)) {
      switch (op.op) {
        case "set":
          for (const x of Object.keys(op.fields)) t.add(`${op.slot}.${x}`);
          break;
        case "set_where":
        case "set_visible_layer":
          for (const x of Object.keys(op.fields)) t.add(`*.${x}`);
          break;
        case "fit_culprit":
          ["*.sleeve_end", "*.strain", "*.volume"].forEach((x) => t.add(x));
          break;
        case "neutral_color":
        case "plain_pattern":
          ["top", "outerwear", "bottom"].forEach((x) => t.add(x));
          break;
        case "swap_closet":
        case "add_closet":
          t.add(op.slot);
          break;
        case "add_held":
          t.add(op.category || "outerwear");
          break;
        case "add":
          t.add(op.garments[0]?.category || "outerwear");
          break;
      }
    }
  }
  return [...t].sort();
}

/** fixTargets for a card's fixes from either engine (a stored check keeps the fixes it was scored with). */
export function cardFixTargets(fixes: readonly Fix[]): string[] {
  const parts = fixes.filter(isPartsFix);
  const v4 = fixes.filter((f) => !isPartsFix(f));
  return [...new Set([...fixTargets(v4), ...partsFixTargets(parts)])].sort();
}

const firstIndex = (r: Reading, cat: string) => r.garments.findIndex((g) => g.category === cat);
const matches = (g: Garment, where: Record<string, unknown>): boolean =>
  Object.entries(where).every(([k, v]) => {
    if (k.endsWith("_not_in")) return !(v as unknown[]).includes(g[k.slice(0, -7)] ?? null);
    if (k.endsWith("_in")) return (v as unknown[]).includes(g[k.slice(0, -3)] ?? null);
    return (g[k] ?? null) === v;
  });

/** One parts fix's edits on a reading (the first state the fix engine tries; for a closet move, its own piece).
 *  null when an edit has nothing to act on. Never mutates `reading`. */
export function applyPartsFix(reading: Reading, fix: Pick<Fix, "edits" | "itemId">, opts: { closet?: readonly ClosetItem[] } = {}): Reading | null {
  const rules = PARTS_FIXES_DATA.rules;
  const closet = opts.closet ?? [];
  const r = clone(reading);
  for (const op of partsEdits(fix)) {
    switch (op.op) {
      case "set": {
        const i = firstIndex(r, op.slot);
        if (i < 0) return null;
        Object.assign(r.garments[i]!, clone(op.fields));
        break;
      }
      case "set_where": {
        const hits = r.garments.filter((g) => matches(g, op.where));
        if (hits.length === 0) return null;
        hits.forEach((g) => Object.assign(g, clone(op.fields)));
        break;
      }
      case "set_visible_layer": {
        let i = firstIndex(r, "outerwear");
        if (i < 0) i = firstIndex(r, "top");
        if (i < 0) return null;
        Object.assign(r.garments[i]!, clone(op.fields));
        break;
      }
      case "fit_culprit": {
        const g = r.garments.find((x) => ["top", "outerwear", "bottom"].includes(String(x.category))
          && ((x.category !== "bottom" && x.sleeve_end === "covers_hand" && !rules.shortSleeve.includes(String(x.subcategory))) || x.strain === "clear"));
        if (!g) return null;
        if (g.category !== "bottom" && g.sleeve_end === "covers_hand") {
          g.sleeve_end = "at_wrist";
          if ((typeof g.volume === "number" ? g.volume : 3) >= 4 && !rules.keepVolume.includes(String(g.subcategory))) g.volume = 3;
        }
        if (g.strain === "clear") g.strain = "none";
        break;
      }
      case "neutral_color": {
        const g = r.garments.find((x) => typeof x.category === "string" && has(rules.neutralFor, x.category)
          && x.color_family !== null && x.color_family !== undefined && !defaultRubric.neutrals.has(x.color_family));
        if (!g) return null;
        Object.assign(g, { color_family: rules.neutralFor[String(g.category)], saturation: "na" });
        break;
      }
      case "plain_pattern": {
        const g = r.garments.find((x) => ["top", "outerwear", "bottom"].includes(String(x.category)) && ![null, undefined, "solid"].includes(x.pattern as string));
        if (!g) return null;
        Object.assign(g, { pattern: "solid", pattern_scale: "na" });
        break;
      }
      case "swap_closet":
      case "add_closet": {
        const want = SLOT_TO_CLOSET[op.slot];
        const it = closet.find((c) => (fix.itemId ? c.id === fix.itemId : c.slot === want));
        if (!it) return null;
        const g = clone(it.garment);
        if (op.op === "swap_closet") {
          const i = firstIndex(r, op.slot);
          if (i < 0) return null;
          const cur = r.garments[i]!;
          for (const k of rules.keepOnSwap) if (has(cur, k) && g.category === cur.category) g[k] = cur[k];
          for (const k of rules.ownOnSwap) if (has(cur, k) && g.category === cur.category && [null, "na"].includes((g[k] ?? null) as string | null)) g[k] = cur[k];
          r.garments[i] = g;
        } else {
          r.garments.push(g);
        }
        break;
      }
      case "add_held": {
        const all = r.held_items ?? [];
        const held = all.find((h) => h.category === op.category);
        if (!held) return null;
        r.garments.splice(1, 0, clone(held));
        r.held_items = all.filter((h) => h !== held);
        break;
      }
      case "add": {
        const gg = op.garments[0];
        if (!gg) return null;
        r.garments.push(G(gg.category, gg.subcategory, gg.color_family));
        break;
      }
    }
  }
  return r;
}

function slotJson(r: Reading, cat: string): string {
  return JSON.stringify(r.garments.filter((g) => g.category === cat));
}
function fieldChanged(first: Reading, merged: Reading, cat: string, field: string): boolean {
  const pick = (r: Reading) => r.garments.filter((g) => cat === "*" || g.category === cat).map((g) => g[field] ?? null);
  return JSON.stringify(pick(first)) !== JSON.stringify(pick(merged));
}
/** A closet swap counts as done only when its slot now holds that piece (its kind or its color), not when the piece he
 *  kept on is just read differently: his grey suede shoes read as grey work boots, then as tan chukkas, and the re-check
 *  said he'd swapped to his cream chunky sneakers (#372). Without the closet (or the piece), any change counts. */
function swapLanded(fix: Fix, merged: Reading, closet: readonly ClosetItem[] | undefined): boolean {
  const slots = partsEdits(fix).flatMap((op) => (op.op === "swap_closet" ? [op.slot] : []));
  const it = closet && fix.itemId ? closet.find((c) => c.id === fix.itemId) : undefined;
  if (slots.length === 0 || !it) return true;
  const fam = (c: unknown) => defaultRubric.fam(c ?? null);
  return slots.every((slot) => {
    const g = merged.garments.find((x) => x.category === slot);
    return !!g && ((g.subcategory ?? null) === (it.garment.subcategory ?? null) || fam(g.color_family) === fam(it.garment.color_family));
  });
}
function partsFixDone(fix: Fix, first: Reading, merged: Reading, closet?: readonly ClosetItem[]): boolean {
  return partsFixTargets([fix]).some((t) => {
    const dot = t.indexOf(".");
    if (dot < 0) return slotJson(first, t) !== slotJson(merged, t);
    return fieldChanged(first, merged, t.slice(0, dot), t.slice(dot + 1));
  }) && swapLanded(fix, merged, closet);
}

/** The first reading with only `targets` (partsFixTargets' form) taken from the re-check's merged reading: what the
 *  first check would read with the fixes made and nothing else re-read. A whole slot ("footwear") takes the merged
 *  pieces in that slot; a field ("top.tucked", "*.sleeve_end") takes that field from the merged piece in the same place. */
function withTargets(first: Reading, merged: Reading, targets: readonly string[]): Reading {
  const r = clone(first);
  for (const t of targets) {
    const dot = t.indexOf(".");
    if (dot < 0) {
      const at = r.garments.findIndex((g) => g.category === t);
      const keep = r.garments.filter((g) => g.category !== t);
      const put = clone(merged.garments.filter((g) => g.category === t));
      r.garments = at < 0 ? [...keep, ...put] : [...keep.slice(0, at), ...put, ...keep.slice(at)];
      continue;
    }
    const cat = t.slice(0, dot), field = t.slice(dot + 1);
    const cats = cat === "*" ? [...new Set(r.garments.map((g) => String(g.category)))] : [cat];
    for (const c of cats) {
      const mine = r.garments.filter((g) => g.category === c);
      const theirs = merged.garments.filter((g) => g.category === c);
      mine.forEach((g, k) => {
        const m = theirs[k];
        if (m && has(m, field)) g[field] = clone(m[field]) as never;
        else if (m) delete g[field];
      });
    }
  }
  return r;
}

const LOOK_U = ["under_present", "under_shows", "peek"];
const LOOK_L = ["covers_shoe", "rests_on_shoe"];
/** The look for "the fixes made, nothing re-read": the first check's, with an arm from the re-check's own look where
 *  a fix changed what that arm sees (U: the top or the layer over it; L: the pants or the shoes). */
function lookWith(first: SecondLookInput | null | undefined, merged: SecondLookInput | null | undefined, targets: readonly string[]): SecondLookInput | null {
  const touches = (cats: readonly string[]) => targets.some((t) => t.startsWith("*.") || cats.includes(t.split(".")[0]!));
  const out: SecondLookInput = { ...(first ?? {}) };
  const take = (keys: readonly string[]) => {
    for (const k of keys) delete out[k];
    for (const k of keys) if (merged && has(merged, k)) out[k] = merged[k];
  };
  if (touches(["top", "outerwear"])) take(LOOK_U);
  if (touches(["bottom", "footwear"])) take(LOOK_L);
  return Object.keys(out).length > 0 ? out : null;
}

/** recheckOutcome with the parts engine. `merged` comes from recheckMerge(first, next, cardFixTargets(fixes)).
 *  newProblems: the parts checks that cost points now and didn't before ("cohesion:ST2", "condition").
 *  `mergedOpts`: the options for the merged side when they differ from the first's (the app: the re-check photo's own
 *  second look); default `opts`, so both sides score alike. `closet`: the pieces the card's closet swaps named, so a swap
 *  counts only when that piece is in the photo. */
export function partsRecheckOutcome(
  first: Reading, fixes: readonly Fix[], merged: Reading, opts: PartsOptions = {}, mergedOpts?: PartsOptions, closet?: readonly ClosetItem[],
): RecheckOutcome | null {
  const a = scoreParts(first, opts);
  const b = scoreParts(merged, mergedOpts ?? opts);
  if (a.overall === null || b.overall === null) return null;
  const A = a as PartsScored;
  const B = b as PartsScored;
  const rawDelta = Math.round((B.rawUnrounded - A.rawUnrounded) * 1e6) / 1e6;
  const done = fixes.filter((f) => partsFixDone(f, first, merged, closet));
  // What the fixes did (#380): the first reading with only their slots or fields from the re-check, scored with the
  // first check's look (the re-check's for an arm a fix touched). The rest of the move is the photo read differently:
  // his Oct 24 sneakers earned +0.5, and the shirt over the hoodie read as peeking "a little" instead of "clearly".
  const targets = partsFixTargets(done);
  const mOpts = mergedOpts ?? opts;
  const cf = done.length > 0
    ? scoreParts(withTargets(first, merged, targets), { ...opts, secondLook: lookWith(opts.secondLook, mOpts.secondLook, targets) })
    : null;
  const C = cf && cf.overall !== null ? (cf as PartsScored) : null;
  const fixRaw = C ? Math.round((C.rawUnrounded - A.rawUnrounded) * 1e6) / 1e6 : rawDelta;
  const doneFixes = done.map((f) => ({ ...clone(f), earned: done.length === 1 ? fixRaw : f.rawGain }));
  const readParts = C && C.overall !== B.overall
    ? (Object.keys(B.parts) as PartName[]).filter((k) => C.parts[k] && B.parts[k].score !== C.parts[k].score)
    : [];
  const faults = (s: PartsScored): Set<string> => {
    const out = new Set<string>();
    for (const k of Object.keys(s.parts) as PartName[]) for (const r of s.parts[k].reasons) if (r.points < 0) out.add(`${k}:${r.check}`);
    for (const f of s.condition.faults) out.add(`condition:${f}`);
    return out;
  };
  const before = faults(A);
  const delta = B.overall - A.overall;
  return {
    before: A.overall, after: B.overall, delta, rawDelta, doneFixes,
    newProblems: [...faults(B)].filter((x) => !before.has(x)) as unknown as RuleId[],
    notSeen: doneFixes.length === 0 && delta === 0,
    ...(C ? { fixTo: C.overall, ...(readParts.length > 0 ? { readParts } : {}) } : {}),
  };
}
