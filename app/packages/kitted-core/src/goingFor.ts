// "Going for" (founder, Oct 11; DECISIONS-LOG #213, #215): the look he says he's aiming at changes the ADVICE, never
// the score. This file answers the two questions the card asks of it, from the rules the engine already runs:
//
//  1. Does the outfit read as that look? (rubric detectStyles, the same detector behind "Reads as", with no picks)
//  2. If not, which piece pulls the other way, and what one move would make it read that way?
//
// A piece is named only when a written rule says it's against the look, never just because the outfit falls short:
//  - SX1, "a piece from another look" (parts v5): the clashing top, for the quiet look the rest reads as;
//  - the look's own table counts the piece against it (rubric role(), the negative side);
//  - the same piece made plain (no graphic, logo, pattern or wear; a neutral color; a regular cut) makes the whole
//    outfit read as the look: so its loudness is what the look's rules turn away (minimal's graphic veto, …).
// Otherwise no piece is named ("Reads as streetwear." alone).
//
// The move comes from the parts fix catalog (fixes.json → "parts"), the same edits the card's fixes use, applied
// with applyPartsFix and judged by the parts engine: the edited outfit must read as the look and must not score lower.
// No number is shown for it. Pure; no picks reach a score here (every scoreParts call passes styles: []).

import { garmentName } from "./names";
import { defaultParts, type PartsEngine, type PartsScored, type SecondLookInput } from "./parts";
import { applyPartsFix } from "./partsCheck";
import { PARTS_FIXES_DATA } from "./partsFixesData";
import type { PartsFixCandidate, PartsFixCatalog, PartsFixEdit } from "./partsFixes";
import { defaultRubric, type RubricEngine } from "./rubric";
import type { ClosetItem, DetectedStyle, Garment, Reading } from "./types";
import { clone, has } from "./util";

export interface GoingForMove {
  /** The catalog candidate's id ("top_plain_tee"). */
  id: string;
  /** The catalog's own words, filled ("Swap the graphic tee for a plain tee", "Swap to your Grey tee"). */
  copy: string;
  /** The closet piece it uses, else null. */
  itemId: string | null;
  /** The piece after the move, for its drawing. */
  garment: Garment;
}

export interface GoingForAdvice {
  going: DetectedStyle;
  /** match: the outfit reads as `going` (among the looks it reads as). mismatch: it doesn't. */
  kind: "match" | "mismatch";
  /** What the outfit reads as with no picks; null = no one look. */
  readsAs: DetectedStyle | null;
  /** Mismatch only: the piece a rule turns away from the look (index into reading.garments), else null. */
  piece: { index: number; name: string; plural: boolean; why: "clash" | "against" | "loud" } | null;
  /** Mismatch only: one move toward the look, else null. */
  move: GoingForMove | null;
}

export interface GoingForOptions {
  occasion?: string;
  boldness?: string;
  secondLook?: SecondLookInput | null;
  /** His owned pieces (the fix engine's closet): closet swaps are moves too. */
  closet?: readonly ClosetItem[];
  /** A warm day: no added layer and no boots (#162). */
  warm?: boolean;
}

export interface GoingForEngines {
  parts?: PartsEngine;
  rubric?: RubricEngine;
  catalog?: PartsFixCatalog;
}

/** The quiet looks SX1 protects (parts v5). */
const SX_QUIET: ReadonlySet<string> = new Set(["minimalist", "smart_casual", "classic_prep"]);
const MAIN: readonly string[] = ["top", "outerwear", "bottom", "footwear"];
/** The class ranks a move may come from: never the tailor (a move toward a look isn't worth $15 of hemming). */
const MOVE_CLASSES: ReadonlySet<string> = new Set(["free", "closet", "own"]);

const nv = (v: unknown): unknown => (v === undefined ? null : v);
const inList = (v: unknown, xs: readonly unknown[]): boolean => xs.includes(nv(v));
const firstOf = (r: Reading, cat: string): Garment | null => r.garments.find((g) => g.category === cat) ?? null;

/** What "Going for {going}" means for this reading, or null: Not sure, the gym or home (no look to aim at), or an
 *  outfit the engine can't score. */
export function goingForAdvice(reading: Reading, going: DetectedStyle | null, opts: GoingForOptions = {}, engines: GoingForEngines = {}): GoingForAdvice | null {
  if (!going) return null;
  const PE = engines.parts ?? defaultParts;
  const RE = engines.rubric ?? defaultRubric;
  const CAT = engines.catalog ?? PARTS_FIXES_DATA;
  const occasion = opts.occasion ?? "everyday";
  if (CAT.rules.loungeOccasions.includes(occasion)) return null;
  const score = (r: Reading) => PE.scoreParts(r, { occasion, boldness: opts.boldness ?? "a_little", styles: [], secondLook: opts.secondLook ?? null });
  const b = score(reading);
  if (b.overall === null) return null;
  const base = b as PartsScored;
  if (base.detectedStyles.includes(going)) return { going, kind: "match", readsAs: base.styleLabel, piece: null, move: null };

  const piece = pullingPiece(reading, going, base, RE, CAT);
  const move = towardMove(reading, going, base, piece?.index ?? null, opts, score, RE, CAT);
  return { going, kind: "mismatch", readsAs: base.styleLabel, piece, move };
}

/** A type the reading couldn't name ("other") can't be named on the card either. */
const nameable = (g: Pick<Garment, "subcategory">): boolean => typeof g.subcategory === "string" && g.subcategory !== "" && g.subcategory !== "other";

/** The piece a written rule turns away from `going` (the first that can be named), else null. */
function pullingPiece(reading: Reading, going: DetectedStyle, base: PartsScored, RE: RubricEngine, CAT: PartsFixCatalog): GoingForAdvice["piece"] {
  const scored = RE.scoredGarments(reading);
  const main = scored.filter((g) => inList(g.category, MAIN));
  if (main.length === 0) return null;
  const outfit = RE.helpers.outfit(main);
  const reads = (gs: readonly Garment[]) => RE.detectStyles(gs, []).detected.includes(going);
  // Where a scored garment sits in the reading (prepare() drops unsure pieces and may re-file an open shirt as a layer).
  const indexOf = (g: Garment): number => reading.garments.findIndex((x) => nv(x.subcategory) === nv(g.subcategory)
    && nv(x.color_family) === nv(g.color_family) && (x.category === g.category || has(g, "recategorized")));
  const named = (g: Garment, why: "clash" | "against" | "loud") => {
    const index = nameable(g) ? indexOf(g) : -1;
    return index < 0 ? null : { index, name: garmentName(g), plural: g.category === "bottom" || g.category === "footwear", why };
  };
  type Hit = NonNullable<GoingForAdvice["piece"]>;

  // 1. SX1 fired (or its tip): the clashing top, when the look he's going for is one of the quiet looks it breaks.
  const style = base.parts.cohesion;
  const sx = style.reasons.some((x) => x.check === "SX1_another_look") || style.tips.some((x) => x.check === "SX1_tip");
  if (sx && SX_QUIET.has(going)) {
    for (const t of main.filter((g) => g.category === "top")) {
      if (t.subcategory === "graphic_tee" || (typeof t.volume === "number" && t.volume >= 4)) {
        const rest = main.filter((g) => g !== t);
        const hit = reads(rest) ? named(t, "clash") : null;
        if (hit) return hit;
      }
    }
  }
  // 2. The look's own table counts it against the look, and the outfit reads that way without it.
  for (const g of main) {
    const hit: Hit | null = RE.helpers.role(going, g, outfit)[1] < 0 && reads(main.filter((x) => x !== g)) ? named(g, "against") : null;
    if (hit) return hit;
  }
  // 3. The same piece, plain, makes the whole outfit read as the look (same slots, so the bar doesn't move).
  for (const g of main) {
    const twin = plainTwin(g, RE, CAT);
    if (!twin) continue;
    const hit = reads(main.map((x) => (x === g ? twin : x))) ? named(g, "loud") : null;
    if (hit) return hit;
  }
  return null;
}

/** The piece with its loud details removed, or null when it has none: no graphic, logo, pattern or designed wear, a
 *  neutral color (the catalog's neutral for its slot), a regular cut for a roomy top. */
function plainTwin(g: Garment, RE: RubricEngine, CAT: PartsFixCatalog): Garment | null {
  const t = clone(g);
  let changed = false;
  const set = (k: string, v: unknown) => {
    if (nv(t[k]) !== v) {
      t[k] = v;
      changed = true;
    }
  };
  if (t.subcategory === "graphic_tee") set("subcategory", "tee");
  if (!inList(t.pattern, [null, "solid"])) {
    set("pattern", "solid");
    set("pattern_scale", "na");
  }
  if (!inList(t.logo, [null, "none"])) set("logo", "none");
  if (t.distressed_by_design === true) set("distressed_by_design", false);
  const cat = String(t.category);
  if (has(CAT.rules.neutralFor, cat) && t.color_family !== null && t.color_family !== undefined && !RE.neutrals.has(t.color_family)
    && !String(t.color_family).startsWith("denim")) {
    set("color_family", CAT.rules.neutralFor[cat]);
    set("saturation", "na");
  }
  if ((cat === "top" || cat === "outerwear") && typeof t.volume === "number" && t.volume >= 4 && !inList(t.subcategory, CAT.rules.keepVolume)) set("volume", 3);
  return changed ? t : null;
}

/** parts_fixes' `when` conditions (the subset the catalog uses), on the reading as he wore it. */
function whenOk(when: Record<string, unknown> | undefined, r: Reading, occasion: string, warm: boolean, RE: RubricEngine): boolean {
  for (const [k, v] of Object.entries(when ?? {})) {
    if (k === "not_warm") {
      if (v === true && warm) return false;
    } else if (k === "no_outer") {
      if (v === true && firstOf(r, "outerwear") !== null) return false;
    } else if (k === "occasion_in") {
      if (!(v as unknown[]).includes(occasion)) return false;
    } else if (k === "quiet") {
      if (v === true) {
        const main = r.garments.filter((g) => inList(g.category, ["top", "outerwear", "bottom"]));
        const loud = main.some((g) => RE.isBright(g) || !inList(g.pattern, [null, "solid"])
          || (!RE.neutrals.has(nv(g.color_family)) && g.color_family !== null && g.color_family !== "multicolor" && !String(g.color_family).startsWith("denim")));
        if (main.length === 0 || loud) return false;
      }
    } else {
      const dot = k.indexOf(".");
      const g = firstOf(r, k.slice(0, dot));
      const cond = k.slice(dot + 1);
      if (cond.endsWith("_not_in")) {
        if (inList(g ? g[cond.slice(0, -7)] : null, v as unknown[])) return false;
      } else if (cond.endsWith("_in")) {
        if (!inList(g ? g[cond.slice(0, -3)] : null, v as unknown[])) return false;
      } else {
        return false; // a condition this file doesn't know: never offer the move
      }
    }
  }
  return true;
}

/** #162's hard rules on an edited reading (as the fix engine has them). */
function blocked(before: Reading, after: Reading, warm: boolean, CAT: PartsFixCatalog): boolean {
  const outers = (r: Reading) => r.garments.filter((g) => g.category === "outerwear").length;
  if (warm && outers(after) > outers(before)) return true;
  const s0 = firstOf(before, "footwear");
  const s1 = firstOf(after, "footwear");
  if (s1 !== null && (s0 === null || nv(s1.subcategory) !== nv(s0.subcategory))) {
    if (inList(s1.subcategory, CAT.rules.boots)) {
      const bt = firstOf(after, "bottom");
      if (warm || (bt !== null && inList(bt.subcategory, CAT.rules.shorts))) return true;
    }
    if (s0 !== null && inList(s0.subcategory, CAT.rules.everydaySneakers) && inList(s1.subcategory, CAT.rules.everydaySneakers)) return true;
  }
  return false;
}

/** The garment a move changed or added: [its index in the edited reading, its index in the original, or -1 if new]. */
function changedPiece(before: Reading, after: Reading): [number, number] | null {
  const json = (g: Garment | undefined) => JSON.stringify(g);
  if (after.garments.length === before.garments.length) {
    const i = after.garments.findIndex((g, k) => json(g) !== json(before.garments[k]));
    return i < 0 ? null : [i, i];
  }
  const seen = new Set(before.garments.map(json));
  const i = after.garments.findIndex((g) => !seen.has(json(g)));
  return i < 0 ? null : [i, -1];
}

type Tried = { cand: PartsFixCandidate; itemId: string | null; item: string | null; edited: Reading; res: PartsScored; order: number };

function towardMove(
  reading: Reading, going: DetectedStyle, base: PartsScored, pieceIndex: number | null, opts: GoingForOptions,
  score: (r: Reading) => ReturnType<PartsEngine["scoreParts"]>, RE: RubricEngine, CAT: PartsFixCatalog,
): GoingForMove | null {
  const occasion = opts.occasion ?? "everyday";
  const warm = opts.warm ?? false;
  const closet = (opts.closet ?? []).filter((c) => !inList(c.garment.subcategory, CAT.rules.closetSkip));
  const tried: Tried[] = [];
  const attempt = (cand: PartsFixCandidate, order: number, edits: PartsFixEdit[], itemId: string | null, item: string | null) => {
    const edited = applyPartsFix(reading, { edits: edits as never, itemId }, { closet });
    if (!edited || blocked(reading, edited, warm, CAT)) return;
    const r = score(edited);
    if (r.overall === null) return;
    const res = r as PartsScored;
    // toward the look, and never a move that costs points
    if (!res.detectedStyles.includes(going) || res.rawUnrounded < base.rawUnrounded - 1e-9) return;
    tried.push({ cand, itemId, item, edited, res, order });
  };
  CAT.candidates.forEach((cand, order) => {
    if (!MOVE_CLASSES.has(cand.class) || !whenOk(cand.when, reading, occasion, warm, RE)) return;
    const closetOp = cand.edits.find((e) => e.op === "swap_closet" || e.op === "add_closet") as { op: string; slot: string } | undefined;
    if (closetOp) {
      const want = ({ top: "top", bottom: "bottom", footwear: "shoes", outerwear: "outer" } as Record<string, string>)[closetOp.slot];
      for (const it of closet) if (it.slot === want) attempt(cand, order, cand.edits, it.id, it.name);
      return;
    }
    // An "add one of these" edit ("a bomber or a denim jacket") must work for every one it names.
    const add = cand.edits.find((e) => e.op === "add") as Extract<PartsFixEdit, { op: "add" }> | undefined;
    if (add && add.garments.length > 1) {
      const n = tried.length;
      for (const gg of add.garments) attempt(cand, order, cand.edits.map((e) => (e === add ? { ...add, garments: [gg] } : e)), null, null);
      if (tried.length - n !== add.garments.length) tried.splice(n);
      else tried.splice(n + 1); // keep the first alternative as the drawing
      return;
    }
    attempt(cand, order, cand.edits, null, null);
  });
  const rank = (x: Tried) => CAT.classes[x.cand.class].rank;
  const onPiece = (x: Tried) => {
    if (pieceIndex === null) return 1;
    const ch = changedPiece(reading, x.edited);
    return ch && ch[1] === pieceIndex ? 0 : 1;
  };
  // The catalog's own line for this type of piece ("top.subcategory_in": ["graphic_tee"] → "for a plain tee") first.
  const madeFor = (x: Tried) => {
    const ch = changedPiece(reading, x.edited);
    const sub = ch && ch[1] >= 0 ? nv(reading.garments[ch[1]]!.subcategory) : null;
    return Object.entries(x.cand.when ?? {}).some(([k, v]) => k.endsWith(".subcategory_in") && (v as unknown[]).includes(sub)) ? 0 : 1;
  };
  // A move whose words would name a piece the reading couldn't ("Swap the other for …") is never offered.
  const usable = tried.filter((x) => {
    const ch = changedPiece(reading, x.edited);
    if (!ch) return false;
    return !x.cand.copy.includes("{name}") || (ch[1] >= 0 && nameable(reading.garments[ch[1]]!));
  });
  if (usable.length === 0) return null;
  usable.sort((a, b) => onPiece(a) - onPiece(b) || madeFor(a) - madeFor(b) || rank(a) - rank(b) || b.res.rawUnrounded - a.res.rawUnrounded || a.order - b.order);
  const best = usable[0]!;
  const ch = changedPiece(reading, best.edited)!;
  const before = ch[1] >= 0 ? reading.garments[ch[1]] : null;
  const copy = best.cand.copy.split("{name}").join(garmentName(before ?? best.edited.garments[ch[0]])).split("{item}").join(best.item ?? "");
  return { id: best.cand.id, copy, itemId: best.itemId, garment: clone(best.edited.garments[ch[0]]!) };
}
