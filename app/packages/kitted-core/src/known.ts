// "Your green work boots?" (workstream A, DECISIONS-LOG #122.3, #126): the one quick tap, asked about a piece he
// already owns. Built on the rubric's own question (askQuestion, parity-tested against rubric.py) and its scores; the
// closet only decides WHICH question to ask, never a score. Same rules as the tap: at most one question per check,
// before the score, nothing about fit or the body, and the snapshot of what he owned is stored with the question.
//
//   - A garment matches exactly one known piece (closetIdentity.knownMatches: same slot; shoes by kind; others by
//     colour family exact or neighbour) and that piece's type differs from the read type:
//       ask "Your {piece}?" when the read wasn't sure (not "clear", or "other") and Yes moves the score by ≥ 0.5.
//       Yes = his piece's type; No = as read. Skip keeps what was read, except a lost shoe ("other"): his piece.
//   - His piece agrees with the read type: the question about that garment is dropped (he already told us).
//   - Otherwise the rubric's question stands. Between candidates, one that could raise the score wins, then the
//     bigger swing; a known-piece question beats the rubric's on the same garment.

import { knownMatches, type KnownPiece } from "./closetIdentity";
import { RUBRIC_DATA } from "./rubricData";
import { askQuestion, score } from "./rubric";
import { applyTapAnswer } from "./tap";
import type { Reading, Scene, ScoreOptions, ShoeKind, TapQuestion } from "./types";

/** A known piece's question needs the answer to move the shown score by at least this much. */
export const KNOWN_SWING = 0.5;
const SHOES = RUBRIC_DATA.tap.shoes;
const ASKABLE = new Set(["top", "bottom", "footwear", "outerwear"]);

/** The type "Yes" scores as: the piece's own type, or for shoes he only named the kind of, that kind's first type. */
function yesType(p: KnownPiece): string | null {
  if (typeof p.subcategory === "string" && p.subcategory !== "other") return p.subcategory;
  return p.shoeKind ? SHOES.kinds[p.shoeKind as ShoeKind][0] ?? null : null;
}

const better = (q: TapQuestion, best: TapQuestion | null): boolean => {
  if (best === null) return true;
  if (q.swing > 0 !== best.swing > 0) return q.swing > 0;
  return Math.abs(q.swing) > Math.abs(best.swing);
};

/**
 * The one quick tap with his closet: the rubric's question, a "Your {piece}?" question about a piece he owns, or
 * none. `known` is the closet BEFORE this photo (the app's knownPieces, this check excluded). Pure; the app stores
 * the result on the check so the same photo never gets a different question later.
 */
export function askWithCloset(reading: Reading, opts: ScoreOptions = {}, known: readonly KnownPiece[] = []): TapQuestion | null {
  return askWithClosetBy(reading, opts, known, askQuestion, (r, o) => score(r, o).overall);
}

/** askWithCloset with a given engine: `ask` is that engine's own question, `overall` its rounded score. v4 passes
 *  rubric.askQuestion + score (unchanged behaviour); parts checks pass partsTap's (#212). */
export function askWithClosetBy<O extends ScoreOptions>(
  reading: Reading, opts: O, known: readonly KnownPiece[],
  ask: (r: Reading, o: O) => TapQuestion | null, overall: (r: Reading, o: O) => number | null,
): TapQuestion | null {
  const q = ask(reading, opts);
  if (known.length === 0) return q;
  const scene: Scene = (reading.scene ?? {}) as Scene;
  const occ = opts.occasion ?? "everyday";
  const agreed = new Set<number>();
  const candidates: TapQuestion[] = [];
  (reading.garments ?? []).forEach((g, i) => {
    const cat = String(g.category);
    if (!ASKABLE.has(cat)) return;
    if (cat === "footwear" && (scene.shoes_visible === false || SHOES.skipOccasions.includes(occ))) return;
    if ((cat === "footwear" || cat === "bottom") && scene.framing === "upper_only") return;
    const m = knownMatches(known, g);
    if (m.length !== 1) return;
    const p = m[0]!;
    const yes = yesType(p);
    const read = typeof g.subcategory === "string" ? g.subcategory : null;
    if (yes === null || read === null) return;
    if (yes === read) {
      agreed.add(i);
      return;
    }
    if (g.certainty === "clear" && read !== "other") return; // a sure read that disagrees: trust the photo
    const at = { garmentIndex: i, field: "subcategory" as const };
    const sYes = overall(applyTapAnswer(reading, at, yes), opts);
    const sNo = overall(applyTapAnswer(reading, at, read), opts);
    if (sYes === null || sNo === null || Math.abs(sYes - sNo) < KNOWN_SWING) return;
    const lost = read === "other";
    candidates.push({
      // The carry's span: for shoes every kind (his boots read "slides" again stay his boots); else the two types.
      pair: cat === "footwear" ? SHOES.order.join("/") : `${read}/${yes}`,
      slot: cat as TapQuestion["slot"], field: "subcategory", garmentIndex: i, question: `Your ${p.name}?`,
      options: [
        { value: yes, label: "Yes", score: sYes, answer: "yes" },
        { value: read, label: "No", score: sNo, answer: "no" },
      ],
      default: lost ? yes : read, swing: sYes - sNo, doubt: lost ? "shoe type lost" : "closet: " + p.id,
      kind: "known", knownId: p.id, knownName: p.name,
    });
  });
  let best: TapQuestion | null = q && !agreed.has(q.garmentIndex) ? q : null;
  for (const c of candidates) {
    if (best && best.kind !== "known" && best.garmentIndex === c.garmentIndex) best = null; // his piece replaces it
    if (better(c, best) || (best && best.swing === c.swing && best.kind !== "known")) best = c;
  }
  return best;
}
