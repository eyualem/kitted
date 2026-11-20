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
- **Screenshots:** `tasks/T115/shots/01-before-why-top-light.png`, `02-before-why-bottom-light.png`, `03-after-why-top-light.png`, `04-after-why-bottom-light.png` (demo screen 305, Why 3.5: Fit 5.5 with "The jeans pile up on the shoes −1.5" before; Fit 7.0 with "Nothing moved it" after; the score, the Shoes slides row and every row after the parts are the same). Also dark and the largest text (demo screens 305 Why and 300 card): `05-after-why-top-dark.png`, `06-after-card-dark.png`, `07-after-why-largest-text-light.png`, `08-after-card-largest-text-light.png`, `09-after-why-largest-text-fit-light.png`; nothing breaks (the strip becomes a list at the largest size, as designed; the card is unchanged). No demo shows the double look row (T115 is covered by the test).
- **Not done or not checked:** The card's fix text "Raises Fit to 7" is core's and can lag a part number in rare cases (log #522). Dealbreaker-owned charges stay shown (his call).

## Disputes
- none

## Review

### Round 1 (normal)
- The look is named once in Why (v16 "Reads as" row only when the Style part has no "reads as" line; same test v15 used): **done** (partsRows.ts, T115 test over ~300 parity cases, T69 updated to the intended behaviour; both files pass, 8 tests).
- No unsteady or waived rule shows as a minus in Why's part rows or numbers, parts still add up: **done** (charged.ts rebuilds the part number clamped to the part's range and rounded to the half; screenshots 03/04 show Fit 7.0 "Nothing moved it" where 01/02 showed 5.5 with the pooling minus; the score 3.5, the Shoes row and every row after the parts are unchanged).
- Kit's context, the part with the most to gain, a re-check's "New: ..." read the same charged parts: **done** (context.ts, scoring.ts `gainPartOf`, explain.ts `newProblemLines`).
- No score moves, core untouched: **done** (`git diff main...HEAD -- app/packages` is empty; the new code only reads `v16.owned`/`caps` and `PARTS_DATA`; `whyParts` still returns `total: res.overall` and the after-rows are core's).
- A v15 check and a dealbreaker-owned charge unchanged: **done** (`unchargedChecks` returns empty without v16; cap-owned checks are removed from "uncharged"; the v15 test asserts identity).
- Dark theme and largest text: **can't tell** (not shot; no color or layout change, so low risk).

**Defects:** none open that blocks.

**Worth a later look (never blocks):**
- `app/src/features/ask/judge.ts` (lines ~45-50): Kit's judgement of a closet outfit with no photo still lists every negative reason as a "Problem:" (and counts a big minus toward the "no" verdict) from raw `scoreParts` parts, so an unsteady rule such as pooling can still reach him there as a problem. Same family as T115b; it reads the engine's parts, not a stored check. A one-line `chargedParts(res)` would cover it. Code.
- `T115-cardWording.test.ts`, the "no row, no number" test: the first `not.toContain(...)` compares a capitalised string with lower-cased rows, so it can never fail; only the second (`rule.toLowerCase()` vs the line) does the work. The part-adds-up check also tolerates 0.51. The real checks (pooling count over 5, charged parts rebuilt to 7.0, re-check) are sound. Test.
- `subscores` stored on the row (scoring.ts ~232) still holds core's part numbers, uncharged. Nothing reads them for display today; fix if something starts to.
- Screenshot 04: the Tools gear sits over the sheet's close button in the Simulator frame ; looks like the chat's Tools button drawn above the sheet, not from this change.
- The founder's open call: dealbreaker-owned charges stay shown (already logged in #522). A fix card's "Raises Fit to 7" is core's text and can lag a part number (logged).

**Verdict: Ready.** No strict-mode checks needed (normal). `npm run check` was left to the session.
