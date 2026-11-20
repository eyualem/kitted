# T61 · The scoring's "not rated": no made-up number for clothes the rules weren't built for

**Size:** strict · **From:** `plan.md` → T61 · **Spec:** `specs/not-rated.md` (approved Nov 20) · **Lane:** Fit check and scoring

## What changes
- **Goal:** a reading with a dress or skirt, a traditional main piece, a costume or uniform, or an unsure top, jacket or pants gets no score and says why; heels and traditional shoes are scored like a photo with no shoes. The AI gets the names to say so. The card's words, not counting, Closet's skip on the app side and Kit are T119, not this task.
- **Files:**
  - Python first: `extraction-test/rubric.py` (`_prepare` and `score`: the reasons), `extraction-test/rubrics/parts_proto.py` (`score`: the same reasons), their tests; the parity fixture generators in `handoff/fixtures/` (new cases, generated, never hand-written), and the regenerated fixtures.
  - Core: `app/packages/kitted-core/src/{types,rubric,parts,partial}.ts` (the `reason` union gains `costume_or_uniform`, `traditional`, `womenswear`, `unreadable`; an `unreadableSlot` of `top` / `jacket` / `pants`; `NotRated` gains `shoes not rated`; `partialLabel` returns `Partial check: shoes not rated`), and Closet's keep in core (`closetIdentity.ts` / `closetMatch.ts`: never keep `dress`, `skirt`, `heels`, `traditional_shoe`, as traditional pieces are skipped today).
  - The reader: `app/assets/gemini/schema-v3.json` and `prompt-v3.json` (subcategories `dress`, `skirt`, `heels`, `traditional_shoe`; a scene boolean `costume_or_uniform`; one prompt line for each), the Python reader's twin prompt and schema in `extraction-test/` if the parity or reader tooling reads them, and any validator that checks the reading's names (`app/src/services/closetSource/validate.ts`, the reading source).
  - `rubric/v5-styles.md` [SCO-6] (one paragraph: what's not rated and why).
- **The rules, exactly** (spec NR1, NR2):
  - The shoes and framing filters run first, as today (shoes out of the photo, top-only). Then, in this order, the first that applies is the reason:
    1. `scene.costume_or_uniform === true` → `costume_or_uniform`;
    2. any non-accessory piece of category `traditional` whose subcategory isn't `traditional_shoe` → `traditional`;
    3. any piece with subcategory `dress` or `skirt` → `womenswear`;
    4. any piece of category `top`, `outerwear` or `bottom` marked `unsure` (after the filters) → `unreadable`, with the slot `top`, `jacket` (outerwear) or `pants` (bottom); the first such piece in reading order.
  - Not "unsure"-filtered for rules 2–3: a dress or traditional piece blocks the score whatever its certainty.
  - Shoes: footwear with subcategory `heels` or `traditional_shoe` (or category `traditional` with subcategory `traditional_shoe`) is dropped like shoes out of the photo; `notRated` gains `shoes not rated` (not `shoes`, so the app doesn't offer a shoe snap). Every part, score and fix then equals the same reading with `shoes_visible: false`, except that one `notRated` token.
  - The old `traditional garment (not rated)` token is no longer produced.
- **Done means:** NR1.1–NR1.7, NR2.1–NR2.3, NR8.1, NR8.2, NR9.1 (the schema and prompt only), and the core half of NR5.1 (Closet's keep), as in TESTING.md.
- **Must not break:** every existing parity case and stored reading without these triggers keeps every part, score and fix (parity 100%); the unsure-accessory, shoes-out and top-only behaviour; same reading, same result. Until T119 lands, the app shows its existing "unreadable" card for the new reasons (`app/src/features/fitcheck/scoring.ts` maps any null score that isn't `not_fully_clothed` to `unreadable`), which is safe and never counted.
- **Not in this task:** the AI's accuracy on real photos (Y55, paid, his OK); any live AI call (Gemini billing is down; $0 only).
- **Branch note:** built on `claude/not-rated-spec-14cefb` together with the T60 spec, in one PR. T69 (PR #149) and T94 (PR #145) also touch `parts.ts` and `parts_proto.py`; keep the change to `_prepare` / `prepare` and the result's reason so a rebase stays small.

## Built
- **Changed:**
- **Tests added:**
- **Stored readings that change (NR8.2):** `tasks/T61/changed-readings.md`
- **Not done or not checked:**

## Disputes

## Review
