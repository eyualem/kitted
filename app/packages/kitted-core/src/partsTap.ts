// The one quick tap for parts-scored checks (DECISIONS-LOG #212). Not part of the parity port: rubric.askQuestion and
// known.askWithCloset stay exactly as they are for v4 checks. This file asks the same questions by the same rules
// (the look-alike pairs and their doubt test, the shoe question when the type is lost, never at Gym/Home, a
// question that could raise beats one that could lower, then the bigger swing), but every swing and every option
// score is the PARTS engine's rounded score, with v4's bars:
//   - a look-alike pair: the other answer moves the parts score by ≥ +1.0 and the read had a doubt, or by ≤ −1.0
//     and the read wasn't "clear";
//   - the shoe question: the best kind raises the parts score by ≥ SHOES.lostSwing (0.5);
//   - "Your grey work boots?": Yes vs No differ by ≥ KNOWN_SWING (0.5).
// Skip keeps what was read (a lost shoe type: the highest-scoring kind; a lost known shoe: his piece), as in v4.

import { type KnownPiece } from "./closetIdentity";
import { askWithClosetBy } from "./known";
import { defaultParts, type PartsEngine, type PartsOptions } from "./parts";
import { defaultRubric } from "./rubric";
import { RUBRIC_DATA } from "./rubricData";
import { applyTapAnswer } from "./tap";
import type { Reading, Scene, ShoeKind, TapOption, TapQuestion } from "./types";
import { has, truthy } from "./util";

const TAP = RUBRIC_DATA.tap;
const SHOES = TAP.shoes;
const H = defaultRubric.helpers;
const kindOf = (sub: unknown): ShoeKind | null => SHOES.order.find((k) => SHOES.kinds[k].includes(sub as string)) ?? null;

/** The parts engine's rounded score for a reading (null when it can't be scored). */
/** `engine` defaults to the switch's (a stored check passes its own, partsEngineFor). */
export const partsOverall = (reading: Reading, opts: PartsOptions = {}, engine: PartsEngine = defaultParts): number | null =>
  engine.scoreParts(reading, opts).overall;

const at = (i: number) => ({ garmentIndex: i, field: "subcategory" as const });

function shoeQuestion(reading: Reading, i: number, base: number, opts: PartsOptions, engine: PartsEngine): TapQuestion | null {
  const g = reading.garments[i]!;
  const sub = g.subcategory as string;
  const cert = g.certainty;
  const lost = sub === "other" || cert === "unsure" || (sub === "slides_sandals" && cert !== "clear");
  const mine = kindOf(sub);
  if (sub !== "other" && mine === null) return null;
  if (!lost) return null;
  const kinds = SHOES.order;
  const options: TapOption[] = [];
  for (const k of kinds) {
    const v = H.kindPick(reading, i, k);
    const s = partsOverall(applyTapAnswer(reading, at(i), v), opts, engine);
    if (s === null) return null;
    options.push({ value: v, label: SHOES.labels[k], score: s, group: k });
  }
  const top = Math.max(...options.map((o) => o.score));
  const swing = top - base;
  if (swing < SHOES.lostSwing) return null;
  const def = mine !== null && kinds.includes(mine)
    ? options.find((o) => o.group === mine)!
    : [...options].sort((x, y) => y.score - x.score || kinds.indexOf(x.group!) - kinds.indexOf(y.group!))[0]!;
  return {
    pair: kinds.join("/"), slot: "footwear", field: "subcategory", garmentIndex: i, question: SHOES.question,
    options, default: def.value, swing, doubt: "shoe type lost", kind: "shoes",
  };
}

/** rubric.askQuestion with the parts engine's swing. Same candidates, order and Skip; the option scores are parts scores. */
export function askQuestionParts(reading: Reading, opts: PartsOptions = {}, engine: PartsEngine = defaultParts): TapQuestion | null {
  const base = partsOverall(reading, opts, engine);
  if (base === null) return null;
  const scene: Scene = (truthy(reading.scene) ? reading.scene : {}) as Scene;
  const shoesVisible = truthy(has(scene, "shoes_visible") ? scene.shoes_visible : true);
  const occ = opts.occasion ?? "everyday";
  let best: TapQuestion | null = null;
  const better = (q: TapQuestion): boolean => {
    if (best === null) return true;
    if (q.swing > 0 !== best.swing > 0) return q.swing > 0;
    return Math.abs(q.swing) > Math.abs(best.swing);
  };
  (reading.garments ?? []).forEach((g, i) => {
    const cat = g.category as string;
    const pairsOk = g.certainty !== "unsure" && has(TAP.pairs, cat) && !(cat === "footwear" && !shoesVisible)
      && !((cat === "bottom" || cat === "footwear") && scene.framing === "upper_only");
    if (pairsOk) {
      for (const [a, b, q] of TAP.pairs[cat]!) {
        if (g.subcategory === "jeans" && (a === "jeans" || b === "jeans") && String(g.color_family ?? "").startsWith("denim")) continue;
        if (g.subcategory !== a && g.subcategory !== b) continue;
        const other = g.subcategory === a ? b : a;
        const sAlt = partsOverall(applyTapAnswer(reading, at(i), other), opts, engine);
        if (sAlt === null) continue;
        const swing = sAlt - base;
        const doubt = H.tapDoubt(reading, g, a, b);
        if ((swing >= 1.0 && doubt !== null) || (swing <= -1.0 && g.certainty !== "clear")) {
          const cur = g.subcategory as string;
          const cand: TapQuestion = {
            pair: `${a}/${b}`, slot: cat as TapQuestion["slot"], field: "subcategory", garmentIndex: i, question: q,
            options: [
              { value: cur, label: has(TAP.labels, cur) ? TAP.labels[cur]! : cur, score: base },
              { value: other, label: has(TAP.labels, other) ? TAP.labels[other]! : other, score: sAlt },
            ],
            default: cur, swing, doubt: doubt ?? "model not sure",
          };
          if (better(cand)) best = cand;
        }
      }
    }
    if (cat === "footwear" && shoesVisible && scene.framing !== "upper_only" && !SHOES.skipOccasions.includes(occ)) {
      const q = shoeQuestion(reading, i, base, opts, engine);
      if (q && better(q)) best = q;
    }
  });
  return best;
}

/** askWithCloset for a parts-scored check: the parts question above, or "Your {piece}?" judged by the parts swing. */
export function askWithClosetParts(reading: Reading, opts: PartsOptions = {}, known: readonly KnownPiece[] = [], engine: PartsEngine = defaultParts): TapQuestion | null {
  return askWithClosetBy(reading, opts, known, (r, o) => askQuestionParts(r, o, engine), (r, o) => partsOverall(r, o, engine));
}
