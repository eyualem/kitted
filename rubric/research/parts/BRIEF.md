# Parts scoring: research brief (founder, Oct 10, 2026; DECISIONS-LOG #195)

## The founder's idea
Replace "7.0 + credits − mistakes" with a score built from **parts**. Each part gets 1–10 by its own method; the final score averages the parts (weighted); the card shows the parts. Example: color 10, proportions 2 → the outfit lands around 5–6, not 8. Each part is scored by whichever tool is best for it: **phone scripts** (pixels: measured color and lightness per piece already exist for the closet, see `app/modules/kitted-vision/ios/KittedMeasure.swift` and DECISIONS-LOG #104–107), **AI facts** (Gemini describes garments in fixed fields, `extraction-test/schema.json`, `extraction-test/prompt.txt`), and **code** that turns facts into a part score.

## The non-negotiables
- **The AI never scores.** It reports facts; code computes every part score. Same photo → same score (tested: letting the model judge failed consistency, #63–64).
- **Never faces, bodies, weight, skin.** Garments relative to each other, or positions along his own limbs; never a garment's width against his body (#164).
- **A part that isn't visible is NA** and drops out of the average (shoes cut off → no shoes part). What isn't in the photo never costs points.
- **Most everyday fits from this audience land 5–7.** 8 is sharp and deliberate. 9 is rare and earned. (Founder, Oct 10.)

## Read first (don't redo; build on it, and say where you disagree)
`CLAUDE.md` (product rules), `rubric/v4.md` (today's rules, each tagged fit/color/proportion/occasion), `extraction-test/rubric.py` (how they're computed today; subscores already exist: fit/color/proportion), `rubric/research/v5-brief.md`, `rubric/research/proportions-color-style.md`, `rubric/research/notes/` (silhouette, tailoring, fit, color, proportions, style archetypes, editorial, the fit ruler, leg and hem probes, the judge pilot), and `rubric/research/style-council/RULEBOOK.md`.
**Accuracy we've measured** (use these numbers): leg shape 40–53%, hem 26–43%, footwear type 30–53%, color family 70–76% on his photos; tops 100% and boots fixed by close-ups (#104); the fit ruler, leg probe and hem probe didn't beat the AI (#170, #189, #190). The judge pilot (`notes/judge-pilot.md`, raw part scores in `inputs/judge-pilot/judge-*.csv` with photo IDs; the ID→reading map is in `inputs/judge-pilot/manifest.json`) gives five judges' part scores on 59 photos: you may use it to sanity-check your part's anchors.

## Your deliverable: `rubric/research/parts/<your part>.md`
1. **What the part judges**, as a list of checks. For each check:
   - the rule in plain words
   - its evidence: reuse the existing notes' sources, and only search the web for real gaps; open what you cite, and mark snippets
   - how much it should matter
   - **how it's measured:** phone script / AI fact / code from existing fields, and which field or measurement
   - **how reliable that is today** (numbers above, or "untested")
   - what it needs that doesn't exist yet
2. **The part score:** how the checks turn into 1–10, with anchors (what a 10, 8, 7, 5 and 2–3 look like). Work through 3 examples from the judge pilot's photos (by ID) and say what your formula would give versus the panel's part score.
3. **When the part is NA.**
4. **Which v4 rules move into this part**, and which go away.
5. **What the user sees:** the part's one-line explanation on the card ("Proportions 5: the shirt hangs long over wide jeans") and which fixes raise it.
6. **Risks:** what will misfire, and what the AI can't see.
7. **A test plan** that needs no new photos (saved readings, judge pilot) and one that waits for the gold set.

Plain language, tables welcome. Don't edit anything else, don't commit, and send nothing outside this folder. If you notice a privacy problem, stop and report it.
