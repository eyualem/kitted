# Retuning the parts engine against the gold-set panel (v8 candidate)

**Adopted by the founder Oct 12 and ported to the app the same day (DECISIONS-LOG #228): v8 is now the default in Python and `@kitted/core`.** Two small changes came with the port: the unused "stretch" switch was removed, and a tie for "the lowest part" now goes to the heavier part by v8's own weights (no score moved). One saved check missed by the table below: the founder's Oct 11 green zip hoodie (af7e93) goes 7.5 → 8.0 (the hoodie, read as a layer ending at the belt over wide jeans, earns the short-jacket shape).

*Oct 12, 2026. Claude. DECISIONS-LOG #227. Written as a paper test (no API calls, no money); at the time the app still scored with parts v7. Scripts `extraction-test/gold_tune.py` (split, metrics, dump) and `extraction-test/gold_features.py` (which reading facts the panel cares about); engine `extraction-test/rubrics/parts_proto.py`, `engine="v8"`; numbers `extraction-test/results/gold-tune/` (`v7_report.txt`, `v8_report.txt`, `saved_checks.txt`, `split.json`).*

## Bottom line

1. **v8 follows the panel about twice as well, on photos it was never tuned on.**
   - **Held-out test photos (91):** r **0.32 → 0.54**. Within half a point of the panel on 64 of 91 (was 55).
   - **Your 20 blind ratings:** r **−0.09 → 0.41**, within half a point on 12 of 20 (was 9). Not tuned on: they were always in the test half.
   - **Good vs bad:** on the test photos the panel's worst fits (5.5 or below) now average 6.36 from the app (was 6.71), its best (8–8.5) 7.43 (was 7.17). The gap between them grew from 0.46 to 1.07 points. The panel's gap is about 3 points, so the app is still too cautious.
2. **Nothing you trust moved.**
   - **Same photo, same score:** 49/49 and 66/66 on the 3-run sets (same as v7). Identical scores on every run drop a little (39 → 35 and 57 → 52): more rules give a flipped reading more chances to matter, but never by more than half a point.
   - **Your friends' fits:** all four stay 7.0 (blazer, chore coat ×3).
   - **Your saved checks:** one of 21 moves: 0d39d6 goes 6.5 → 7.0 (a short top over wide jeans now earns its shape credit despite the slides).
   - **8+ share:** 4% of your saved and stock photos (was 6%), 16% of the gold photos (was 13%; the panel puts 28% there).
3. **The readings can support more than this.** A statistical fit on every existing reading field (not usable as rules, just a ceiling) reaches r 0.63–0.66 on the same test photos. v8 gets 0.54 with plain rules. The rest of the gap is mostly things the reading doesn't describe: a jacket a size big, heavy rips vs light ones, a belt, a dated piece, a shirt that's too long.
4. **Recommendation: adopt v8, then port it to the app** (Python and `@kitted/core` in parity, the fix lines for the new rules, `rubric/v5-styles.md` rewritten). Two of its rules put new words on the card, so they're yours to OK first (below).

## What changes, in plain words

Every rule reads only fields the live reading already has. Nothing new is asked of the AI.

| What you'll see on a card | v7 | v8 | Why (tune half) |
|---|---|---|---|
| A boxy shirt, overshirt or bomber with long sleeves | "looks a size big" −2.0 Fit | "sleeves run past the wrists" −0.5 | The 6 photos it fired on: panel 7.8. Deliberately roomy pieces |
| Wide or baggy jeans or cargos that stack on the shoe | −1.5 Fit, blocks shape credits | nothing (−0.5 on loose trousers) | Your ruling #221; panel 7.3 on these. Closes known difference KD-2 |
| Skinny or slim jeans, chinos, cargos (not under a blazer, not suit trousers) | nothing | −1.0 Proportions (skinny −2.0, ripped −0.5 more): "the slim jeans read dated; a straight leg balances the outfit" | Panel 6.2 on narrow legs; the hardest thing you docked in your notes |
| A tucked or short top over wide legs | +1.5 (+0.5 in a mirror selfie) | +1.5, also in a mirror, also for knits ending at the belt | Panel 7.6–7.9: the shape the 8s share |
| A tucked top over straight legs | +1.5 | +0.5 | Panel 7.1: "plain office" |
| A jacket read as ending at the belt over wide legs (not a bomber/denim/leather, which already earn it) | nothing | +1.0 Proportions | The reading held on 42 of 46 jackets across runs |
| Loafers or derbies with jeans and a tee | "much dressier than the clothes" up to −0.5 | nothing; no "dainty under wide legs" tip | Panel 7.7–7.9 |
| Running shoes off the gym | Shoes 6.0 | Shoes 5.0 | Panel Shoes 4.8 |
| Slides with an otherwise clean outfit | Shoes 4.5 | 5.0 | Your notes and the panel: they cost, but less |
| One bright piece | +1.0 "the one standout" | nothing | Panel Color 6.7 where it fired, app 8.0 |
| A loud print: a bright graphic, a graphic tee with a big logo, a big plaid, check, floral or camo | +0.75 "the one standout" | −1.5 Color: "the big, loud check on the sweater takes over the outfit" | Panel 6.6 where the old credit fired; 4.5–6 on big prints |
| "Clearly X top to toe", "a suit worn properly" | +1.0 each | +0.5 each | Panel 7.4 where they fired; the prep uniforms reached 9.5 Style |
| A tank top on its own, out of the house | nothing | −2.0 Style: "reads gym or undershirt" | Panel 6.2, Style 5.3 |
| Sweats out of the house in an outfit that reads as a style | held to 6.5 (one dressed sign) | held to 7.0 | Your brief: softer under a deliberate outfit |
| Part weights | Proportions 30 · Fit 25 · Color 15 · Shoes 15 · Style 15 | 30 · **15** · **20** · 15 · **20** | Fit only finds faults, and most are misreads (r 0.2) |
| Several problems in different parts | averaged away | half of each extra part's shortfall under 6.5 comes off, up to −1.0 | The mirror of the earned bonus; panel's bad fits are bad everywhere |
| The 7.0 starting point | 7.0 | 7.0 | Fitted against the panel: 6.94–6.96 |

**Your calls (on the to-do list):**
1. **Adopt v8 and port it?** Default: yes.
2. **The two new card lines** (outward-facing): "the slim jeans read dated; a straight leg balances the outfit" and "the big, loud print on the tee takes over the outfit". Default: as written. "Dated" is blunt; "a straight leg would balance it" is the softer option.

## How it was done

- **Held-out split.** The 225 photos were split once (seed fixed, `split.json`): 133 to tune on, 92 to test on. An Instagram creator's series stays on one side, so no person's outfits sit on both. Your 20 were forced into the test half. Every rule and size was chosen on the tune half.
- **Honest disclosure on the test half:** it was opened once after freezing (test r 0.53, your 20 at 0.35). Three changes came after, none chosen from test numbers: (a) no narrow-leg charge under a tailored jacket, because a sport coat's trousers flipped between straight and slim across runs (a steadiness fix); (b) a big logo counts as loud only on a tee, because your own black graphic hoodie was charged with straight jeans but not with wide ones; (c) stacked baggy jeans cost nothing, from your ruling #221. Test r ended at 0.54, your 20 at 0.41 (the hoodie fix moved it from 0.35).
- **Finding the rules:** the 40 largest disagreements on the tune half with all five judges' reasons; each candidate fact's panel mean and gap against the app; each existing rule's firings against the panel; then one switch at a time (each moved tune r by at most ±0.01 around the final, so v8 isn't balanced on one rule).
- **Not used:** whether the photo is a mirror selfie (it predicts the panel only because Instagram creators shoot in mirrors; your users do too), and a stretch of every score away from 7 (no gain in r, and the 8+ share jumped to 27%).

## What v8 still gets wrong

- **Source is still most of the signal.** Inside one source the app follows the panel only moderately (Instagram r 0.51, Pinterest 0.26, Reddit −0.20 on the test half; Reddit is 9 photos). The new rules mostly separate the deliberate creator fits from the dated Pinterest ones: wide legs and short tops up, skinny jeans and loud prints down. That's 2026 taste and matches your notes, but it's a taste lean, and the gold set's own photos of you (one outfit changed on purpose) are the real test of it.
- **Size faults aren't built.** The reading can't tell "a size big" from "cut roomy on purpose": the old stand-in fired mostly on deliberate pieces the panel liked, so v8 eased it instead. The panel's worst size cases (pin-063's big blazer, pin-028's swamping shell) read as regular volume.
- **The mismatched near-suit stays a tip.** The one example (rd-010) is in the test half and no tune photo has the shape, so there was nothing to check a rule against.
- **"A shirt too long untucked"** stays a tip: the reading almost never says a top ends below the crotch.
- **Your 20, still off by a point or more:** pin-058 (a belt and how the shirt fits; app 7.0, you 5.0), pin-033 (a paisley shirt read as solid, plus its size; 7.0 vs 5.5), ig-061 (6.5 vs 8.0), rd-015 (shirt too long; 7.0 vs 6.0), pin-013 (now too harsh: 5.0 vs your 5.5).
- **The panel is five AI judges.** Your blind check agrees with it (r 0.69), which is why it's the target, but one rater's 20 photos isn't a human panel.

## Rule 7

Every gold photo is "profile unknown": the app side used one stated test profile (picks Minimal + Smart casual, 0.5 each; boldness "a little"; no age) at Everyday, as `gold_read.py` did. No split by age band or picked look is possible. Your saved checks: founder profile still pending; friends profile unknown. Picks and age move no number in v8 (v8 reads neither).

## Numbers (from `results/gold-tune/`)

| | v7 tune | v8 tune | v7 test | v8 test | v7 all | v8 all |
|---|---|---|---|---|---|---|
| r with the panel | 0.33 | 0.66 | 0.32 | **0.54** | 0.33 | 0.61 |
| rank correlation | 0.26 | 0.59 | 0.27 | 0.56 | 0.27 | 0.58 |
| mean app − panel | +0.02 | +0.01 | +0.04 | +0.07 | +0.03 | +0.04 |
| within 0.5 | 76/132 | 98/132 | 55/91 | 64/91 | 131/223 | 162/223 |
| app spread (panel's) | 0.55 (0.92) | 0.71 | 0.55 (1.03) | 0.73 | 0.55 (0.97) | 0.72 |
| 8+ share | 14% | 16% | 12% | 16% | 13% | 16% |
| 2 runs within 0.5 | 130/132 | 131/132 | 88/91 | 87/91 | 218/223 | 218/223 |
| your 20: r | | | −0.09 | **0.41** | | |

Parts against the panel's same part (all photos): Proportions 0.18 → 0.55, Fit 0.03 → 0.22, Color −0.18 → 0.34, Shoes 0.61 → 0.63, Style 0.26 → 0.41.

By source, mean app − panel (all photos): Instagram −0.51 → −0.27, Pinterest +0.88 → +0.51, Reddit +0.45 → +0.31.
