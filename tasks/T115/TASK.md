# T115 · The card never shows a cost the score didn't take

**Size:** normal · **From:** `plan.md` → T115 and T115b · **Spec:** none needed (a bug against v16's own rules, log #498; the founder asked for both on Nov 20) · **Lane:** Fit check and scoring

## What changes
- **Goal:** How I scored names the look once, and a rule the score doesn't charge (pants piling on the shoes and the other unsteady or waived rules) never shows as a cost.
- **Files:** `app/src/features/why/partsRows.ts` (the Reads as row; Why reads the charged parts) · `app/src/features/why/charged.ts` (new: which checks the v16 score didn't charge, and a part rebuilt without them) · `app/src/features/ask/context.ts`, `app/src/features/fitcheck/explain.ts`, `app/src/features/fitcheck/scoring.ts` (Kit's context, a re-check's "New: …" problem, the part with the most to gain read the same parts) · tests: `T69-whyRows.test.ts` (updated), `T115-cardWording.test.ts` (new).
- **Done means:** the look is named once in Why; no unsteady or waived rule appears as a minus anywhere he reads, with the part numbers still adding up; no score moves.
- **Must not break:** every score and parity case (core untouched); a v15 check's rows; a dealbreaker's own row and the part rows of a charge a dealbreaker owns.

## Built
- **Changed:** see the decision, log #522. Core's `v16.owned` is every charge the score didn't take as points; minus the ones a dealbreaker cap owns, what is left is "not charged". Why now builds its part rows and numbers from the parts without them.
- **Tests added:** `T115-cardWording.test.ts` (5: the look once, no uncharged row or number across about 600 v16 parity cases with each part adding up, a part held down only by pooling reads 7.0, a v15 check unchanged, a re-check's New problem); `T69-whyRows` updated to the intended behaviour. Four of them fail with the fix switched off.
- **Screenshots:** `tasks/T115/shots/01-before-why-top-light.png`, `02-before-why-bottom-light.png`, `03-after-why-top-light.png`, `04-after-why-bottom-light.png` (demo screen 305, Why 3.5: Fit 5.5 with "The jeans pile up on the shoes −1.5" before; Fit 7.0 with "Nothing moved it" after; the score, the Shoes slides row and every row after the parts are the same). No demo shows the double look row (T115 is covered by the test).
- **Not done or not checked:** the dark theme and the largest text (no color or layout change). The card's fix text "Raises Fit to 7" is core's and can lag a part number in rare cases (log #522). Dealbreaker-owned charges stay shown (his call).

## Disputes
- none

## Review
Written by the reviewer.
