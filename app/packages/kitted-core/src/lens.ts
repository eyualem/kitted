// What a style changed in a score (02 "S6s", DECISIONS-LOG #61). The card says "Scored for
// streetwear: …" only when this list is non-empty, so it never claims the style mattered when it
// didn't. Each check is scored for ONE style; "without" is the general standard (no style).

import { explainScore, type LedgerRule } from "./ledger";
import { defaultRubric, type RubricEngine } from "./rubric";
import type { Boldness, Loose, Occasion, Reading, RuleId } from "./types";

export interface StyleEffect {
  id: RuleId;
  /** Index into reading.garments of the piece it's about. */
  culpritIndex: number | null;
  /** Score points the rule removes when scored for the style (0 = not counted). */
  withStyle: number;
  /** …and by the general standard. */
  general: number;
}

export interface StyleLens {
  effects: StyleEffect[];
  /** The overall score for the style and by the general standard. */
  overall: number | null;
  overallGeneral: number | null;
}

const NONE: StyleLens = { effects: [], overall: null, overallGeneral: null };

export function styleEffects(
  reading: Reading,
  opts: { occasion: Loose<Occasion>; style: string | null; boldness?: Loose<Boldness> | null },
  engine: RubricEngine = defaultRubric,
): StyleLens {
  if (!opts.style) return NONE;
  const base = { occasion: opts.occasion, boldness: opts.boldness ?? "a_little" };
  const a = explainScore(reading, { ...base, styles: [[opts.style, 1]] }, engine).ledger;
  const b = explainScore(reading, { ...base, styles: null }, engine).ledger;
  if (!a || !b) return NONE;
  const total = (rules: LedgerRule[], id: RuleId) => rules.filter((r) => r.id === id).reduce((s, r) => s + r.impact, 0);
  const ids = Array.from(new Set([...a.rules, ...b.rules].map((r) => r.id)));
  const effects = ids
    .map((id): StyleEffect => ({
      id,
      culpritIndex: (a.rules.find((r) => r.id === id) ?? b.rules.find((r) => r.id === id))?.culpritIndex ?? null,
      withStyle: total(a.rules, id),
      general: total(b.rules, id),
    }))
    .filter((e) => Math.abs(e.withStyle - e.general) > 1e-9);
  return { effects, overall: a.overall, overallGeneral: b.overall };
}
