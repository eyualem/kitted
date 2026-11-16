# T68 · Rescoring v16 on paper

*Session rescoring-v16, Nov 14, 2026. Budget $0: stored readings and made-up readings only, no API calls. Plan: DECISIONS-LOG #464; rules: #462, #465, #466 and the founder's marks on the sheet (L1–L8 marked Yes there, L9 the stacking rule left blank, so #464's default stands). Yardstick: the creators' rulebook (PR #123, not merged).*

## What gets built

Engine `v16` in `extraction-test/rubrics/parts_proto.py`, beside v15 (v15 and every older engine score exactly as before). Script `extraction-test/v16_paper.py`, results in `extraction-test/results/v16/`. Nothing in `@kitted/core` or the app (that is T69, after his yes).

1. **The scale:** no 5.0 floor; the score is clamped to 3.0–9.5; 10 is never given.
2. **Faults stop averaging away:** each part's charges count at half their size on the score for the worst part and a quarter for the rest (v15 multiplied them by 15–30%).
3. **Dealbreaker caps** from #466 (sinks 5.5, three or more brights 4.5, holds 6.5, chunky sneakers under narrow legs 6.0; two sinks make a redo at 4.5), on reliable reads only. The "depends" rows (a blazer or leather jacket with gym shorts, a blazer with plain shorts) are a Style charge that grows with a weak color or shape and shrinks with a strong one.
4. **Lifts and stacking** (L1–L7, the creators' versions): with nothing else, the best an outfit can reach is 7.5 with no lift, 8 with one, 8.5 with two, 9 with three in one look, and 9.5 with four in one look and nothing off. L4 (tonal range) and L8 (texture) need reads the scoring call doesn't have: listed, not faked.
5. **The season:** a temperature band input (`warm`, or `cool` for mild and cold days, the default). Layering lifts count on cool days; on warm days only a light open shirt counts, summer has its own lifts (a fitted top over loose trousers, a light tonal outfit) and a heavy layer costs. Every photo is scored for both.
6. **Nuance (rulebook §5):** two brights are charged only with no dark or neutral piece beside them, a loud print or a third color, and a strong shape halves the charge; a blazer with loose or washed jeans is no longer charged (suit.9, "cool professor").
7. **A curve:** a fixed, monotone two-slope map from the raw score to the shown score, anchored so plain basics stay 7, fitted once on the gold set to the target shares, then checked on his saved checks.

## The bars (written Nov 14 before the first v16 run; never loosened)

| # | Bar | Pass when |
|---|---|---|
| B1 | His blind ratings | v16 within 1 point of his score on at least 8 in 10 photos, and r with him at least 0.69 (the panel's r with him), or a plain reason why not. Today: his 20. When his 60 (Y32) arrive as `~/Downloads/ratings.csv`, the same bar on all 80; until then this bar is only partly checked. |
| B2 | The creators' pairs | All 6 stored before/after pairs (`results/creators1`, median of the 3 readings): the after scores higher than the before. |
| B3 | The creators' anchors with stored readings | Each lands on the right side of the creator's step (median of its readings): step 5.5 or lower → v16 6.0 or lower; step 6–7.5 → v16 6.0–8.0; step 8 or higher → v16 7.5 or higher. Every one passes. |
| B4 | The dealbreaker examples | Each sheet row with a reliable read, on a made-up clean example (Everyday, no picks, as `rules_conformance.py`), lands exactly at its cap; the "depends" rows land between 5.5 and 7.0, and lower with a weak color than with a strong one. Rows that can't fire are listed, with the read they need. |
| B5 | Band shares | On the gold set (all photos, first reading, cool day) and on his 62 saved checks (his profile, their own occasion, cool day), every band within 5 points of its target: 3–4.5 5%, 5–5.5 15%, 6–6.5 30%, 7–7.5 30%, 8–8.5 15%, 9–9.5 5%. |
| B6 | Steadiness | At least 218 of 223 gold photos within 0.5 between their two stored readings (cool day). If the set holds a different count, the same share: at most 5 photos off. |
| B7 | v15 untouched | `rules_conformance.py` and `hoodie_layer_paper.py` still pass, and v15 scores every gold photo exactly as before. |

The curve (point 7) is fitted on the gold set, so B5 on gold is partly by construction; his saved checks are the honest test of it.

## Results (Nov 14; `extraction-test/results/v16/report.txt`, $0, no API calls)

Run: `KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 extraction-test/v16_paper.py` (exits 1: bars fail).

| # | Bar | Result |
|---|---|---|
| B1 | His blind ratings | **FAIL.** His 20: within 1 point 15/20 (v15 17/20), r 0.33 (v15 0.46; the panel 0.69). Y32's 60 aren't in yet, so this is 20 of 80. |
| B2 | Creators' pairs | **PASS**, 6/6 (v15: 5/6 and a tie). |
| B3 | Anchors | **FAIL**, 13/18 (v15 passes 10/18 on the same bar). |
| B4 | Dealbreaker examples | **PASS**, every capped row at its cap, every spared case uncapped, the three "depends" rows 5.5–7.0 and lower with a loud print. |
| B5 | Band shares | **FAIL** on both. Gold: worst band 17.7 points off (v15 29.6). His 62 checks: 26.5 off (v15 32.9). |
| B6 | Steadiness | **PASS**, 218/223 (cool), 219/223 (warm); v15 218/223. |
| B7 | v15 untouched | **PASS**: `rules_conformance.py` 501/501, `hoodie_layer_paper.py` all pass, and v15, v14, v8, v1 give identical full results to the pre-T68 engine on all 2,048 gold and saved-check scorings. |

**Band shares** (first reading, cool day):

| | 3–4.5 | 5–5.5 | 6–6.5 | 7–7.5 | 8–8.5 | 9–9.5 |
|---|---|---|---|---|---|---|
| Target | 5% | 15% | 30% | 30% | 15% | 5% |
| Gold, v15 | 0.4 | 4.9 | 16.1 | 59.6 | 18.8 | 0 |
| Gold, v16 | 0 | 6.7 | 15.2 | 45.3 | 32.7 | 0 |
| Gold, v16 warm | 0 | 7.6 | 13.9 | 57.0 | 21.5 | 0 |
| His checks, v15 | 0 | 6.5 | 21.0 | 62.9 | 9.7 | 0 |
| His checks, v16 | 0 | 8.1 | 24.2 | 56.5 | 11.3 | 0 |
| The AI panel on gold | 1.8 | 10.2 | 21.8 | 38.2 | 27.6 | 0.4 |

### Why the bars that fail fail

- **B5, the shares.** 46% of the gold set (a curated set) has nothing the reader can fault or strongly credit, so it lands at 7–7.5 under any curve that keeps "nothing off, nothing chosen" at 7. The panel itself puts only 34% of gold at 6.5 or under. Reaching 30% at 6–6.5 needs either faults the reader can't see yet (fabric, light vs dark, top length, the hem) or plain basics shown at 6.5. The curve that hits the gold shares (anchor at 7.78) puts a plain tee and jeans at 6.5, which contradicts his own #462 example (a hoodie with straight jeans "7.0"), breaks 3 dealbreaker examples and 6 anchors, and still misses his checks by 14 points. Fitted only to the shares with the anchor at 7, the curve (1.5, 0.7) closes gold to 16.2 points but drops steadiness to 211/223. So the curve in the engine, (1.0, 0.8), is the closest to the shares that keeps B6. His saved checks are mostly plain basics at home in slides, so they stay bunched at 7.
- **B1, his ratings.** The rules see the clothes, not what he sees: a pink graphic tee with jorts (he gave 5), a blue camp shirt with dark jeans and loafers (5.5) read as fine with an accent. He rated both slides outfits 7, while v16 charges slides out of the house at full strength. And a blue sweatshirt over a tee with wide cargos and derbies (he gave 8) earns no lift, because the reader files the sweatshirt as a second top, not a layer. With 20 photos r is very noisy (roughly ±0.4); his 60 more will say more.
- **B3, the anchors that fail:** a04 skinny joggers (Tim's "abomination", step 4) stays at 6.5 because his H4 mark holds it at 6.5; a02 knit on knit (step 5) lands 6.5; a03 tight beige (step 5) 6.5, since "pulling at the thighs" isn't read; a26 Wanhee's red bomber (step 7.5) 8.5, two lifts; a59 Jaye's all-black (step 9) 7.0, since the reader sees a plain black suit with dress shoes, not flares and boots.

### What else the run showed
- **Lifts line up with the AI panel:** no lift 6.5 on average, one 7.1, two 7.6, three 7.9. One accent on a calm base (L5) is the exception: the panel rates those photos at the average (7.04).
- **Faults are rare but strong:** a loud print averages 5.5 with the panel, too many statements 5.8, running shoes 5.9.
- **Unsteady reads:** sleeves past the hands flip between readings on 67–71% of the photos where they fire, and the main read's pooling hem on 50%. In v16 they move no points (and H9 isn't a cap).
- **The season** (cool to warm): gold 12 up, 47 down; his checks 1 up, 8 down. Warm days lose the layer lifts (33 photos) and charge a heavy layer (16); they gain the light tonal lift (6) and summer's shape (4), and drop the light-on-light and tank-alone charges (7).
- **Nothing real reaches 9.** 9 needs three lifts in one look, and with the lifts compressed by the curve the best stored reading is 8.5; the panel puts 1 of 225 at 9+.
- **Can't fire for lack of a read:** S3 and H2 (top length, #465), H7 without the shoe close-up (all of gold), L4 tonal range, L8 texture, bare ankles in winter, summer fabric.

### Proposed rubric change
`tasks/T68/v5-styles-v16.diff` (not applied): [SCO-2], [SCO-3] and [SCO-7] rewritten, [SCO-8]–[SCO-10] new, the dealbreakers and lifts sections, [COL-2]'s nuance, [STY-3] removed, [STY-9] and [COL-12] off on warm days, [STY-13] knit on knit.

## Round 2: fresh second looks on the gold set (founder's OK for a small spend, cap $2.00, Nov 14)

The gold set's stored readings (Oct 12) carry no second looks, so v16's pooling cap (look L, "covers the shoe mostly") and the peek rule (look U) can't fire on gold. This round runs the app's two second looks on the gold set, nothing else: the same prompts and schemas the app ships (`app/assets/gemini/prompt-look-u.json`, `prompt-look-l.json`, identical to `extraction-test/prompt_look_*.txt`), gemini-3.8-flash, thinking off, temperature 0, on the face-hidden close-ups the gold set's reading used (upper for U, lower for L; the body crop where there's no split). The main readings stay the stored ones, so the before/after compares like with like.

**Estimate, written before any paid call.** From the 450 stored look1 calls' token counts, billing thinking tokens at the output price ($0.75 in, $3.75 out per million; #465): look U about 1,427 in + 50 out + 171 thinking = **0.19¢**, look L about 1,374 in + 17 out + 241 thinking = **0.20¢**; **0.39¢ a photo**. Gold set: 225 photos × 2 runs (one per stored reading, so steadiness compares two independent looks) = 900 calls ≈ **$1.76**, plus a 2-photo pilot ≈ 1¢. The script counts thinking tokens and stops before $1.85 in total, under the $2.00 cap. No other calls this round.

**Status:** run Nov 15, after the founder's own OK in this session. **Spent: $1.8424 in all** (thinking tokens counted), under the $1.85 stop and the $2.00 cap: a 4-call pilot $0.0185, the full run $1.6245 (100 calls lost to network errors, no answer and no charge), the 100 retried $0.1994. All 900 looks answered (225 photos × 2 runs × U and L); 223 photos have stored readings to pair with. Thinking ran 207 tokens a call on average (the estimate's 206), with one call at 2,666. Answers: `extraction-test/results/gold-looks1/raw.json`.

### Round 2 results (`results/v16/report.txt`, section "Round 2"; the bars above stay on the stored readings)

| | Stored readings | With the fresh looks |
|---|---|---|
| Gold shares, worst band gap | 17.7 | **15.7** (5–5.5 rises 6.7 → 10.3%) |
| r with the AI panel | 0.569 | 0.538 |
| B1, his 20: within 1 point, r | 15/20, 0.33 | **16/20, 0.45** |
| B6, steadiness (each reading with its own looks) | 218/223 PASS | **212/223, would FAIL** |

- **19 photos move, all down.** Two rules start firing: the pooling cap H7 (8 photos to 5.5) and the peek (a top clearly showing below the outer piece, 19 photos), which in v16 also cancels the layer lift L2.
- **The panel disagrees with both at their current size.** On the 8 H7 photos the panel averages 6.69, and only 1 is 5.5 or under. On the 19 peek photos it averages 7.32, above the gold average of 7.06. Most peeks are a white tee under an open bomber, denim or leather jacket.
- **H7 still helps with him.** It catches outfits he marked down: the blue camp shirt with loafers he gave 5.5 now lands 5.5. That is where B1's gain comes from.
- **Why steadiness drops.** Look L's "mostly covers the shoe" (H7's trigger) differs between the two runs on 19 of the 82 photos where either run says it, about 23%. A 5.5 sink on an answer that flips swings the score 1.5 to 2 points. The peek flips on 6 photos, and losing L2 swings the score 1.25.
- **Narrower versions, for his call** (paper only, $0):

| Version | Steady | Gold gap | r panel | His 20 |
|---|---|---|---|---|
| As built (his #466 marks) | 212 | 15.7 | 0.538 | 16/20, r 0.45 |
| H7 only when the hem reads "pooling" | 216 | 18.0 | 0.548 | 15/20, r 0.33 |
| No peek under a jacket or coat | 213 | 16.4 | 0.549 | 16/20, r 0.45 |
| Both | 217 | 16.4 | 0.559 | 15/20, r 0.33 |
| H7 a 6.5 hold, not a 5.5 sink | 215 | 15.7 | 0.557 | 16/20, r 0.40 |
| **H7 a 6.5 hold + no peek under a jacket** | **216** | 16.4 | **0.568** | 16/20, r 0.40 |

  - Recommendation: the last row, the best balance. It keeps most of the gain with him, matches the panel best, and comes 2 photos short of the steadiness bar (the bar is not loosened).
  - It reverses two of his marks, so it is his call (Y34): H7 as a 5.5 sink (#466), and the "clearly hangs below costs 0.5" peek (#367, which was about a zipped fleece, not an open jacket).
  - The engine keeps his marks (`v16_h7_cap=5.5`, a knob for the test only).

## His 150 blind ratings (Nov 16; `results/v16/report.txt`, "B1 on the full set" and "The Y34 taste calls"; $0)

He rated all 150 photos on the combined sheet (`inputs/gold-judge/founder4/`). The key was opened only after he finished. In his words, the ratings are taste and "may fluctuate", so they are used for direction (order, r, the big gaps), never to tune single photos, and the bar is not loosened. His spread across the bands (3–4.5 / 5–5.5 / 6–6.5 / 7–7.5 / 8–8.5 / 9–9.5) is 0 / 15 / 35 / 20 / 21 / 9%, with a mean of 6.95.

**Which photos can be checked:** 54 of the 150 are gold photos with stored readings (sheet 1). With his first 20, that makes 74. Sheet 2 (76) and the 20 new photos have no reading yet.

**B1 on all 74: FAIL** (bar: within 1 point on 8 in 10, and r 0.69 or more).

| | His first 20 | Sheet 1's 54 | All 74 |
|---|---|---|---|
| v15 | 17/20, r 0.46 | 41/54, r 0.62 | 58/74 (78%), r 0.60 |
| **v16** (stored readings) | 15/20, r 0.33 | 42/54, r 0.64 | **57/74 (77%), r 0.61** |
| v16 with the looks (his marks) | 16/20, r 0.45 | 41/54, r 0.58 | 57/74, r 0.58 |
| v16 with the looks, H7 a hold + peek under a jacket free | 16/20, r 0.40 | 41/54, r 0.62 | 57/74, r 0.60 |
| The AI panel | 16/20, r 0.69 | 47/54, r 0.81 | 63/74 (85%), r 0.80 |

- **v16 is as close to him as v15 overall, and closer on the new 54.** Both fall short of the bar: 3 photos short of 8 in 10, and r 0.61 against 0.69.
- **The AI panel reads his taste better than the rules do** (r 0.80). The gap is what the rules can't see. His notes name it: "tights for jeans", "shirt way too long", "pants too tight and high on the ankle", "shirt too bulky", "shorts are not it". Top length, tightness and bulk are exactly the reads the scoring call doesn't have (#465).
- **The looks don't help on the bigger set** (r 0.58). The first-20 gain came mostly from one photo, the camp shirt with loafers.

**The five Y34 calls against his ratings** (74 photos; small groups, so direction only):

1. **Plain basics 7 or 6.5:** on the 9 photos where v16 sees nothing off and nothing chosen, he averages **7.39**, with 5 at 7 or more. *Keep 7* (unchanged).
2. **Slides out of the house:** his 4 with readings average **6.12**, and v16 gives 5.88. The 2 slides outfits on sheet 2 (by description) both got 6. *Keep the charge*: his two 7s in the first 20 were the exception (changed: this was open).
3. **One accent (L5) as a lift:** his 8 photos where L5 is the only lift average **6.12**, *lower* than his photos with no lift (6.60); v16 gives them 6.88 and the panel 6.31. *Drop L5 as a lift* (changed: the data now says no).
4. **Pants pile on the shoe:** his 3 average **6.83**, and v16 with the looks puts them at 5.5. *A 6.5 hold, not a 5.5 sink* (unchanged; 3 photos is thin).
5. **A top clearly showing below the outer piece:** his 5 average **7.50**, above his mean of 7.20, so it isn't a fault to him on these. But his C013 note, "the inner layer sitting higher would have given it a better rating", says a long inner layer can cost. *Keep his Oct 21 rule's 0.5, but don't let the peek also cancel the layer lift.* That double hit is what swings scores and breaks steadiness (changed: was "free under a jacket"; the one jacket case has n = 1).

**The 96 photos with no reading, for his OK (not run; the earlier $2 is spent).** The estimate counts thinking tokens:
- **The scoring call:** 4,030 in, 788 out and about 300 thinking (#465) = **0.71¢**.
- **The two looks:** **0.41¢**, measured Nov 15 ($1.8424 over 450 photo-runs).
- **One run:** 96 × 1.12¢ ≈ **$1.08**; stop at $1.25.
- **Two runs:** ≈ $2.15; this only adds steadiness, which 223 gold photos already measure.
- **Recommendation: one run.** B1 uses the first reading.
- **Prep comes first:** face-hidden copies and close-ups made on the Mac with the app's own prep, $0. Photos the prep refuses are not read.

**The read of the unread rated photos (Nov 16; script `extraction-test/rated_read.py`).** The app's own prep ran on his sheet's face-hidden copies, since the originals were deleted after face hiding: 90 of the 96 are ready, about $1.01 for one run (stop at $1.25). **Six are left out of the read and of B1: C001, C013, C032, C064, C071, C140.** Each head is already covered by a big mosaic block (likely from when the rating sheet was built), so the app finds no head and sends nothing. That is the privacy rule working as intended, not a print on the clothes fooling it; the face-hiding session checked each by eye and with main's prep. B1's full set is therefore at most 144 of his 150 (74 checked so far). **Status:** not run, $0 spent. The paid call was blocked by this session's permission check (the OK reached this session through the coordinating session); it waits on the founder's OK typed here.

**Done (Nov 16): the read ran in the coordinating session after the founder's OK there ("you have my okay").** **Spent: $0.9013** (thinking tokens counted), under the $1.25 stop: a 2-photo pilot of 2.06¢, then the rest. All 270 calls answered (90 photos × the scoring call + two looks), 0 errors. Answers: `extraction-test/results/rated1/raw.json`. Thinking averaged 5 tokens on the scoring call and 253–272 on the looks.

## B1 and the Y34 calls on everything he rated (Nov 16; `results/v16/report.txt`; $0 beyond the read)

Ratings checked: 144 of the 150 with a reading (the six with covered heads left out), plus his first 20, **164 in all**. Gold photos use their stored Oct 12 readings; sheet 2 and the new photos use the Nov 16 reading. Each photo is read once, on a cool day, at Everyday, with the test profile.

**B1: FAIL.**

| Group | v15 | **v16** | v16 + the looks | The AI panel |
|---|---|---|---|---|
| His first 20 | 17/20, r 0.46 | 15/20, r 0.33 | 16/20, r 0.45 | 16/20, r 0.69 |
| Sheet 1 (gold, 54) | 41/54, r 0.62 | 42/54, r 0.64 | 41/54, r 0.58 | 47/54, r 0.81 |
| Sheet 2 (71) | 53/71, r 0.46 | 50/71, r 0.31 | 50/71, r 0.21 | n/a |
| The new 20 (19 read) | 13/19, r 0.21 | 13/19, r 0.23 | 13/19, r 0.23 | n/a |
| **All 164** | 124/164 (76%), r 0.51 | **120/164 (73%), r 0.48** | 120/164, r 0.42 | 63/74, r 0.80 |

- **On the full set, v16 is slightly further from him than v15** (73% vs 76% within a point, r 0.48 vs 0.51). It is ahead only on the gold photos.
- **v16 runs high on the photos read Nov 16.** On the new 20 it averages 7.45 against his 6.58.
- **Adding the second looks makes it worse** (r 0.42).
- **The AI panel is still the closest to him** (r 0.80 on the 74 it judged).
- His notes point at what neither engine reads: tight legs, long or bulky tops, shorts. That missing information is the gap, not the curve or the caps.

**The five Y34 calls, on all 164** (his mean 6.92):

1. **Plain basics:** 27 photos where v16 sees nothing off and nothing chosen. He averages **7.46**, with 19 of 27 at 7 or more. *Keep 7* (holds; if anything he rates these a bit higher).
2. **Slides out of the house:** 8 photos. He averages **6.38**, and v16 gives 5.94. *Keep a charge, about half a point smaller* (changed: v16 is a little harsher than him).
3. **One accent (L5) as the only lift:** 18 photos. He averages **6.11**, *below* his no-lift photos (6.77); v16 gives them 7.00. *Drop L5 as a lift* (holds, more strongly).
   - A single lift of any other kind (6.79) also scores no higher with him than no lift.
   - Only two or more lifts track him (7.68).
4. **Pants pile on the shoe:** H7 fires on 5 photos. He averages **7.40**, and v16 caps them at 5.5. On all 26 photos where the look says the hem mostly covers the shoe, he averages **7.96**. *Make H7 a tip with no points until a steadier read exists* (changed: was "a 6.5 hold"; his ratings don't support any cost).
5. **A top below the outer piece:**
   - **Clearly:** 8 photos, he averages **7.31**, above his mean.
   - **Under a jacket:** 4 photos, 6.88.
   - **Showing a little** (free today): 16 photos, 7.66.
   - *Make the peek a tip, no points, and never cancel the layering lift* (changed: was "keep your 0.5"). His C013 note ("the inner layer sitting higher would have given it a better rating") was on a photo the prep couldn't read, so it is a single word against 8 photos.

All five stay his calls; the engine keeps his marks until he answers.

## Round 3: his taste patterns and his own consistency (Nov 16, $0; `extraction-test/taste_patterns.py`, `results/taste1/patterns.txt`)

The founder (Nov 16): "Fix my scores... Detect patterns and refactor my scores. Let them stay consistent with my taste... Add those new rules to the [rater], and then we can run the test again."

The data: 164 rated photos with a reading, his 13 notes, and the reading's facts (pieces, fits, colors, shoes, the second looks). For each pattern: how many photos, his average with and without it, and a confidence (Welch's t: high is |t| ≥ 3 with 10+ photos, medium is |t| ≥ 2 with 5+). Many patterns travel together (wide legs come with trousers, longer hems and dressier shoes), so each was also checked **within one leg shape**. Only what survives that is listed as his.

**What drives his scores, strongest first:**

1. **How wide the legs are, by far the biggest thing.**
   - Average by leg: slim or skinny 6.00 (40 photos), straight 6.69 (54), wide or relaxed 7.63 (64). That is a 1.6-point spread. *High confidence.*
   - Today's rules miss half of it: v16 under-scores wide legs and over-scores straight ones by about 0.3–0.7.
   - Skinny alone: 5.41 (11).
2. **Pants that pull** (the reading's "strain" on the pants): 5.62 (17) vs 7.07.
   - Even among slim legs, pulling costs more: 5.62 vs 6.28.
   - His notes say it in words: "tights for jeans", "too tight and high on the ankle". *High.*
3. **A long hem that covers the shoe is a plus to him, not a fault.**
   - Wide legs: 8.10 with the hem over the shoe (21) vs 7.41 without. Straight legs: 7.62 (4) vs 6.61.
   - This is the opposite of the pooling cap (H7). *High.*
4. **Dressy shoes** (loafers, derbies, dress shoes): higher at every leg shape (+0.5 to +0.9). Today's rules already give most of it. *High.*
5. **Trousers over jeans:** +0.4 to +0.7 at every leg shape. *Medium.*
6. **Two or more lifts**: 7.68 vs 6.69. *High.*
   - **A single lift isn't worth anything to him.** One lift scores *lower* than none on straight and wide legs.
   - By lift, measured against his average for that leg shape:

   | Lift | Photos | Against his leg average |
   |---|---|---|
   | One look top to toe (L7) | 16 | +0.75 |
   | A deliberate shape (L1) | 40 | +0.49 |
   | A short layer over a full leg (L2) | 17 | +0.27 |
   | A color picked up (L6) | 10 | +0.11 |
   | One smart piece with casual ones (L7b) | 27 | +0.04 |
   | One accent (L5) | 33 | −0.18 |
   | **An open layer over a tee (L3)** | 8 | **−0.76** |

7. **Neutral palettes:** all neutrals (and denim) score +0.5 to +0.8 over outfits with a color, on straight and wide legs. A second color isn't common enough to measure. His C006 note: "maybe a bit too many colors". *Medium.*
8. **A long top** (the reading says below the crotch): 6.00 (8) vs 6.96; on wide legs 6.50 (3) vs 7.69. His C042 note: "shirt way too long". *Medium; the read is unproven (#465).*
9. **Layering is not a plus to him:** with wide legs, layered 7.26 (19) vs 7.79 (45). v16 over-credits it by about 0.6. *Medium.*
10. **Shorts cost a little:** with wide legs, 7.30 (20) vs 7.78. Twice in his notes: "shorts are not it". *Low to medium.*
11. **Low clean sneakers:** 6.48 (21) vs 6.98, but within each leg shape there is no difference. *Not a pattern of its own; the leg shape explains it.*
12. **Big, roomy tops are fine on wide legs** (8.07, 7 photos). "Too bulky" in his notes is about a specific boxy shirt or hoodie, not volume in general. *Low; not a rule.*
13. **Not about the outfit:** mirror selfies score +0.4 to +0.7 at every leg shape. That is a bias in how he rates photos, so no rule. Streetwear-plus-minimal shows up only in one note (C032, which the prep refused), so there's too little to test.

**What this means for the rules (proposed; built only after he confirms):**
- leg width as a main driver (wide up, slim down, skinny and pulling further down);
- no cost for a long hem over the shoe; H7 becomes a tip;
- lifts reweighted: L7, L1 and L2 count; L5 and L7b don't; L3 doesn't count;
- a single lift adds little, two or more add the real step;
- layering on its own no longer lifts;
- a small charge for shorts and for a second color;
- a long top costs, waiting on a steady read;
- tightness from "strain" (a read to verify).

### His own consistency: the re-rate sheet

- **Near-identical outfits he scored 1.5+ apart: 4 pairs, 6 photos.**
  - A white oxford, straight light jeans and brown chukkas at 8.5 vs a light-blue oxford, straight dark jeans and brown chukkas at 6.
  - A black suit, white shirt and black shoes at 9.5 vs three near-identical black suits at 7, 7.5 and 7.5.
- **Scores 2+ points from his 6 most similar outfits: 4 photos**, including a graphic tee, relaxed shorts and loafers at 8.5 (his similar outfits average 6.2), and a tee, slim chinos and dress shoes at 5.5 (similar: 7.5).
- **The sheet** (`inputs/gold-judge/founder5/`, built by `extraction-test/rerate_sheet.py`, seed 20261116) has **19 photos**:
  - the 9 flagged;
  - 10 unflagged repeats, 2 from each score band, to measure his own noise.
  - Shuffled so no two from one flag sit side by side. He isn't told which is which.
  - Same server as founder4: every tap saves to `founder5/ratings.csv`, port 8766. Tested: a rating saved to disk, a wrong id refused, the key not served; the test rating was deleted.
- **The consistent key** = his re-rated score where he re-rated, his original elsewhere. His earlier `ratings.csv` files are never written, and nothing is smoothed toward any engine.

**Next, once he has rated and confirmed the patterns:** the new rules in v16, fitted on a random half of the photos and tested on the other half (the held-out half is the honest number). Then every bar re-run on the raw ratings and on the consistent key, with v15 alongside. Rules that need a read the AI doesn't give yet (tight legs, top length, bulk) go in as waiting on a read.

**His clarification (Nov 16):** "When I say "fix my scores," by the way, the low ones should still stay low, and the high ones should still stay high. I just want consistency."

How the pass keeps that:
- **Flags come from disagreement, never extremeness.** A pair is flagged because two near-identical outfits disagree, and a single photo because it sits 2+ points from his own most similar outfits. The 9 flagged span his range (5.5, 5.5, 6, 7, 7.5, 7.5, 8.5, 8.5, 9.5), high and low alike.
- **A flag only puts a photo on the sheet.** His blind re-rate decides the score; nothing is averaged or pulled toward the middle.
- **The check** (`extraction-test/consistent_key.py`, results `results/taste1/key_report.txt`): the key's band shares sit beside his raw ones. Every band must stay within 3 points, or the key isn't used until he has seen it. Today his raw shares (164 photos) are 0 / 15.9 / 33.5 / 22.6 / 19.5 / 8.5%, range 5–9.5.
- **His 10 repeats measure his own drift on a second look.** That includes whether high and low scores drift toward the middle, so a move inside his noise isn't called a fix.

### The taste rules, wired and switched off (Nov 16, $0; a dry run, not his confirmed rules)

**Built so the re-run is ready the moment he confirms:**
- **The engine:** `_v16_taste` in `extraction-test/rubrics/parts_proto.py`, switched on by `tune={"taste": {...}}`. Off by default, so v16 and every older engine score exactly as before: `results/v16/` is unchanged and conformance passes 501/501. The rules:
  - leg width, graded (skinny, slim, wide);
  - shorts, with roomy shorts (volume 4–5) winning some back;
  - each color beyond neutrals, up to two;
  - a hem over the shoe as a plus (look L);
  - the long top, from the Mac's body ruler (T98, PR #126, read from its branch until it merges) and else the reading; half a point at most, never a cap;
  - lifts L3, L5 and L7b off;
  - a single lift at a fraction;
  - the pooling cap as a tip.
  - A dealbreaker cap owns the taste charges, as it owns its part charges, so a capped outfit lands at its cap.
- **The harness:** `extraction-test/taste_rules.py` (`--key consistent` once his re-rate is in; `--seed` for other splits). It fits the sizes on a random half of the 164 (seed 20261116), tests on the other half, and drops each rule in turn on the held-out half. The sizes and the split go to `results/taste1/fitted_taste_raw.json`.
- **Every bar with the rules on:** `v16_paper.py --taste results/taste1/fitted_taste_raw.json`, which writes `results/v16-taste/`.

**Dry run on his raw ratings.** Fitted: wide legs +0.5, a single lift at half, a hem over the shoe +0.5, roomy shorts +0.5, colors −0.5 each. Skinny, slim and shorts came out 0, since v16's existing charges and caps already carry them.

| | Within 1 point | r |
|---|---|---|
| Held-out half, the main split | 69/82 (84%) | 0.665 (v16 with the looks 79%, 0.585; v15 80%, 0.569) |
| Held-out half, 8 other splits | **78% on average** (73–85%) | **0.62** (0.57–0.68) |
| Same halves, v15 | about 76% | 0.53 |
| Same halves, v16 | about 73% | 0.45 |

- **The honest number is the 8-split average.** It beats both engines but stays short of the bar (80%, r 0.69). The main split's 84% is on the lucky end.
- **I changed the engine after seeing the main held-out half.** The cap now owns the taste charges, a fix driven by the dealbreaker bar, but it moved the held-out number from 78% to 84%. That's why the 8 other splits are the number to trust.

**Every bar with the dry-run rules** (`results/v16-taste/report.txt`):

| Bar | With the dry-run rules | v16 without them |
|---|---|---|
| B1, all 164 | 136/164 (83%), r 0.62: FAIL on r. Half the photos tuned it, so this is not the honest number | 120/164 (73%), r 0.48 |
| B2, the creators' pairs | 6/6 | 6/6 |
| B3, the anchors | 12/18 | 13/18 |
| B4, the dealbreaker examples | 2 miss | all pass |
| B5, band shares, worst gap | gold 21.1, his checks 28.1 | gold 17.7, his checks 26.5 |
| B6, steadiness | 219/223 | 218/223 |

- **The two B4 misses:**
  - H7, by design: the pooling cap becomes a tip, which is his call. If he says yes, the H7 example row goes with his own rule change, not because a bar was loosened.
  - S5 (a blazer with gym shorts), where the color charge drops the quiet-accent case to 5.5.

**Waiting on:** his re-rate (Y38) and his yes on the patterns. Then the fit runs again on the raw ratings and on the consistent key, and every bar re-runs with v15 alongside. The shorts-length look (T98's 56¢ round) is not in.
