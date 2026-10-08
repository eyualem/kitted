# Style council: shared brief (read this first)

*Oct 7, 2026. Every council member reads this whole file before starting. Folder: `rubric/research/style-council/`. Repo root: `/Users/eyu/Desktop/files/Kitted`.*

## What Kitted is
An iOS app that scores a man's outfit photo out of 10 (US men 18–30, beginners). **"The AI sees, the code judges, the AI explains."**
- The vision model (Gemini Flash) only **describes** garments into fixed fields (`extraction-test/schema.json`, instructions in `extraction-test/prompt.txt`).
- Deterministic code (`extraction-test/rubric.py`, v3.1; plain words in `rubric/v3.md`) turns that description into **score = 7.0 + credits − mistakes**, rounded to the nearest half. Best possible today: 9.5. Same photo → same score, always.
- Score words: ≤5.5 Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9–9.5 Dialed in.
- **Never judged:** face, body, weight, height, skin tone. Traditional/cultural clothing = "not rated". Nothing outside the photo costs points.
- Onboarding: he picks up to 3 "looks you like". Current style keys: `smart_casual, minimalist, old_money, workwear, vintage_sport, streetwear, preppy, gorpcore`. The research recommends 7 options (Preppy + Old money merged as "Classic prep").

## What the founder decided today (Oct 7) — these are fixed inputs, not up for debate
1. **Judge the fit by what it's going for.** If an outfit clearly reads as a style, it gets that style's allowances **even if he didn't pick that style**. His picks only break ties and steer suggestions.
2. **When the AI can't tell two items apart and it changes the score** (jeans vs sweatpants), the card asks him one quick tap before the score. At most once per check.
3. **The council writes the rulebook once (design time).** At runtime there is still one vision call and deterministic code. Nothing you design may require a second AI call per photo or an AI "style label" that can flip between runs. Style detection must be computed **in code from garment fields**.
4. Styles can excuse a style's *intentional* choices (stacking, oversize, sweats in vintage sport…). They never excuse care or fit faults (stains, visible strain, wrinkles) — argue if you disagree, but the default is no.
5. Scores must be "not too high, not too low." The founder's own outfit (grey Nike pullover hoodie, black wide-leg jeans with a belt, black slides with socks) got 3.5 because the model read the jeans as sweatpants; he says it's "definitely not a 3" and not a 9 either. Readings: `phone-checks-oct7.json` (photo paths inside; you may view the photos).

## Read before working (in this order)
1. `rubric/v3.md` and `extraction-test/rubric.py` — the current rules, rule IDs (F4, P1, C3, K1…), style bands, dressiness table.
2. `extraction-test/schema.json` — the ONLY fields that exist today. You may propose new fields, but each must be coarse, allow "not visible", and be something a vision model can read from one phone photo. Mark every proposed field **(new field)**.
3. `rubric/research/proportions-color-style.md` — today's research report (ranked changes, style profile table, what not to build). Notes behind it: `rubric/research/notes/` (especially `style_archetypes.md`).
4. Saved real readings to test ideas against: `extraction-test/results/test3-stock-40-v3/raw_results.json` and `extraction-test/results/test4-mirror-12-v3/raw_results.json` (lists of `{outfit, extraction, …}`), photo descriptions in `inputs/fitcheck-photos/metadata.csv` and `inputs/mirror-fit-check-1/metadata.csv` (photos in those folders; private test only). Run the rubric with `/usr/bin/python3` from `extraction-test/` (`from rubric import score`).

## Evidence rules
- Prefer sources from 2025 or later for style rules; label older ones. No Reddit or anonymous forums. Quotes under 15 words, each with URL and date. Say plainly when something is your own judgment rather than sourced.
- GQ, Esquire, Mr Porter and Permanent Style often block fetchers; search snippets are OK if labeled "(snippet)".
- Plain language. No emoji.

## Council structure
- **Round 1 (parallel):** 7 style advocates (`smart_casual`, `minimalist`, `classic_prep`, `workwear`, `streetwear`, `vintage_sport`, `outdoor`) each write `r1-<style>.md`. A calibration member writes `r1-calibration.md`.
- **Round 2:** every member reads all round-1 files and writes `r2-<name>-challenges.md`: pushback on other styles' claims (signals that aren't really theirs, over-excusing, look-alike confusions). A common-ground member writes `r2-common-ground.md`: rules every style shares, and the full list of conflicts.
- **Round 3:** the mediator reads everything and writes `RULEBOOK.md`, a prototype detector `style_detect_proto.py`, and test cases `cases.json`.

## Round-1 template for style advocates (`r1-<style>.md`, about 1,500–2,500 words)
1. **Identity:** one line; which sub-aesthetics it absorbs; who wears it (US 18–30); how big it is (cite).
2. **Signals table:** signal in schema terms (subcategory, leg_shape, volume, hem, color_family, saturation, pattern, logo, condition, distressed_by_design…, or a (new field)) · strength (strong / medium / weak) · also a signal for which other styles · note. Include **negative signals** (pieces that argue against this style).
3. **Detection rule:** the minimum evidence to say an outfit "reads as <style>", what vetoes it, and how confident that is. Remember it runs on the model's reading, which can be wrong (see the jeans/sweatpants case): say which signals are reliable to read and which aren't.
4. **What this style excuses** (by rule ID in `rubric.py`, with the amount) and **what it never excuses.**
5. **Style-specific mistakes** (new, if any) and **done-well signals**. Be stingy with credits: scores already run about 0.6 high on mirror photos; a new credit must replace or sit inside the existing 2.25 cap.
6. **Anchor outfits:** one concrete outfit (garment list in schema terms, occasion everyday) for each band: about 4, 5.5, 6.5, 7.5, 8.5, 9.5 — with the reason for each score. These are used to calibrate, so be honest, not generous.
7. **Look-alikes:** which styles it's confused with, and the tie-breaker.
8. **Fields the model can't read reliably** that this style depends on (fabric, raw denim, brand…), and what to do instead.
9. **Sources.**
