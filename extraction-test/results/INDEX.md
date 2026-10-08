# Test results log

Every test gets its own folder here. Each folder has `report.md` (the summary) and `raw_results.json` (every AI answer). A `rescored-v3/` subfolder means the saved answers were re-judged with rubric v3 (free; no API calls), and it includes `comparison.md` with old vs. new scores.

Prices are the Gemini 3.8 Flash introductory rates ($0.75 per million tokens in, $3.75 per million out, from third-party listings; confirm on AI Studio). They double on Jan 1, 2027.

| Folder | Date | Photos | Model | Runs | Consistency | Fix detection | Cost |
|---|---|---|---|---|---|---|---|
| `test1-stock-40/` | Oct 6 | 40 stock photos (`inputs/fitcheck-photos`): 28 singles + 6 before/after pairs | gemini-3.8-flash | 5 | v2: **95%** (37/39) · v3: **95%** | v2: 67% (4/6) · v3 + fixed check: **83%** (5/6) | ~$1.85 |
| `test2-mirror-12/` | Oct 6 | 12 real mirror selfies, low-res web images (`inputs/mirror-fit-check-1`) | gemini-3.8-flash | 3 | v2: **92%** (11/12) · v3: **100%** | no pairs | ~$0.31 |
| `test2b-m12-new-schema/` | Oct 6 | m12 only, re-read after adding the `drawstring_trousers` type | gemini-3.8-flash | 3 | 100% (9.0 · 9.0 · 8.5) | — | ~$0.03 |
| `test3-stock-40-v3/` | Oct 6 | the same 40 stock photos, **fresh run** with rubric v3 + the new prompt | gemini-3.8-flash | 3 | **97%** (38/39) | 67% (4/6): p06 sleeves missed (subtle pair, see below) | ~$1.03 |
| `test4-mirror-12-v3/` | Oct 6 | the same 12 mirror selfies, **fresh run** with rubric v3 + the new prompt | gemini-3.8-flash | 3 | **92%** (11/12): m10 barefoot flipped 9.5/8.5/8.5 | no pairs | ~$0.31 |
| `probe-thinking-*/` (4 folders) | Oct 6 | 8 hard photos (`inputs/speed-probe-8`): thinking off / low at 1024 px, off at 768 and 512 px | gemini-3.8-flash | 3 | 6–8 of 8 (differences are noise: low = off on 3.8) | — | ~$0.30 |
| `lockin-oct6/` | Oct 6 | legacy 52 × 4 arms (A today, B thinking off, C/D thinking off + v4), pass rules written beforehand | gemini-3.8-flash | 3 | A 98% · **B 100%** · C 92% · v4.1 96–98% | A 4/6 · B 5/6 · C 4/6 | ~$2.70 |
| `selftest/` | — | fake data, no API calls (checks the code only) | — | — | ignore | ignore | $0 |
| `test5-*-v5/` | Oct 8 | v5 format (v3 + style-council fields) on stock 40, mirror 12, founder's 4 phone photos (+ phone 4 in v3, same hour) | gemini-3.8-flash | 3 | stock **82%** (v3 92%) · mirror 100% · phone 100% | — | ~$1.00 |
| `test5-*-v5s/` | Oct 8 | slim v5s (v3 + stacked hem + denim_wear + prompt lines) on stock 40, mirror 12, phone 4 (+ phone 4 v3 same hour, `test5-phone-4-v3b`) | gemini-3.8-flash | 3 | stock **85%** (v3 92%) · mirror 92% · phone 100%; all 52: **86.5%** vs 90.4% | — | ~$0.85 |
| `closet1/` | Oct 8 | closet call v1 (separate from scoring: shade, lightness, details, logo text, sleeve, shoe profile, denim wear, boxes) on 56 photos | gemini-3.8-flash | 3 | **all bars passed**: 0 index errors · lightness 95% · shade key 92% · details 0.94 · logo 98% · box IoU 0.98 · 4.3 s median | — | ~$0.55 |
| `zoom1/` + `zoom1-stock/` | Oct 8 | arms A (today) / B (+ upper and lower close-ups in the same call) / C (+ boot line) / D (both), the app's own face-hidden prep (`vision/bin/kmeasure zoom`); his 11 Oct 8 + 4 Oct 7 photos + 12 mirror (ABCD), stock 39 (AB) | gemini-3.8-flash | 3 | A 60/66 · **B 64/66** · C 24/27 · D 24/27 | stock pairs: B narrows "before" (fewer spurious "wrinkled"); still unproven | ~$2.70 |

## What we learned
- **The AI reads outfits consistently**, including real mirror selfies and tiny images (168×300 px). Every garment detail agreed 90%+ across runs.
- **Rubric v2 was too generous** (everything 7.0–9.0). Rubric v3 spreads scores to 5.5–9.0 and keeps consistency at 95–100%. Details: `../../rubric/v3.md`.
- **Unreliable details:** logo size, "graphic" vs. plain prints, and whether a watch is visible. They no longer move the score.
- **Speed:** about 16 s per call by default. **Thinking off cuts it to about 7 s** (probe) with no measurable loss of consistency; image size doesn't change tokens. Plan to reach ~4–5 s: `../../speed-and-detail-plan.md`.
- **Cost:** about 0.9¢ per check now, about 1.9¢ from January. About 85% of it is output, mostly hidden "thinking."
- **Fresh runs confirm the re-scores.** New readings judged by v3 landed on the same medians as the re-scored old readings (average difference 0.00 on 39 photos; only s02 moved by 1 point). The mirror set was off by 0.71 vs. Claude's estimates (0.75 re-scored), with scores still about +0.6 too high on average.
- **Fix detection is unproven either way.** It flips between 67% and 83% on one subtle pair (p06: the sleeves were already partly rolled in the "before" photo, and "above wrist" was read in 3 of 5 runs in Test 1 vs. 1 of 3 here). Six stock pairs are too few. Real staged fixes are needed.
- **Weak spot:** a partial check (shoes hidden) with a flipping detail moves more, because credits are scaled up (m10).

- **LOCKED (Oct 6): thinking off + the original v3 format.** 6.6 s median, 8.7 s p90, 0.42¢ per check (0.83¢ in 2027), 100% consistent. The short v4.1 format is 3.9 s and 0.23¢ but reads 5 details differently; truth labels decide. See `lockin-oct6/RESULT.md`.

## Still untested
- Your own photos in a real room, including deliberately bad outfits (does v3 score them low?)
- Real fix pairs (cuff, tuck, roll sleeves): does the score go up?
- The shoe snap (straight down vs. knee height)
- Thinking turned off (speed and cost)

- **Oct 8: v5 FAILED its pass bars** (`compare_v5.py`). Stock consistency 32/39 under the rulebook (bar 90%; locked v3 37/40). It's about 3 s slower than v3 in the same hour (15.1 vs 12.0 s on the phone set; 1,090 vs 765 output tokens). The longer answer destabilized core readings: shoe type, hem, leg shape. The closet fields read well (hoodie: medium grey, Nike swoosh, front pouch); `shade` is free text and differs between runs on 44% of garments. The founder's ph1 was read as sweatpants on all 6 v5 runs, and the tap fired every time. One stock run ended early on a network timeout (117 of 120 readings).
- **Oct 8: v5s also FAILED the consistency bar**, narrowly: 45/52 photos under the rulebook vs 47/52 for locked v3 (bar 90%). Speed is fine: 6.1 s vs 6.5 s median; same hour on the phone set, 5.0 vs 5.1 s. Only one wobble comes from the new values (s26 pooling/stacked); the rest are the usual wobblers (p06, s02, s09 wrinkled, p03). The founder's ph1 was still sweatpants, "clear", on all 3 runs; the tap fired every time. **The app stays on locked v3.**

- **Oct 8: close-ups in the scoring call PASSED; B adopted (DECISIONS-LOG #104–105).** Same call, v3 schema unchanged, one prompt line (`prompt_zoom.json`), images labelled "Image 1:" …. His boots: A read slides ×9 / chukka ×4 / other ×3 / retro_runner ×3 / work_boot ×1 of 21; B work_boot ×7 / chukka ×7 / derby ×4 / other ×2 / canvas ×1, **never slides**. Top type 80% → 100%. Consistency 60/66 → 64/66. Mean |score − truth score| on his Oct 8 reads 0.38 → 0.22 (accuracy session's re-score). Cost 0.39 → 0.57¢ (+47%), median 5.5 → 6.0 s. Sleeve_end 76 → 70%, outerwear type 12/12 → 11/12; hem and leg shape stay weak (40–53%) in every arm. The boot definition line alone did nothing (C) and with close-ups pulled his suede work boots to chukka (D): not adopted. Scores move +0.19 (phone/mirror) and +0.04 (stock) on average, mostly from fewer spurious "wrinkled" reads. Truth: `inputs/phone-oct8/truth.csv` (accuracy session).

