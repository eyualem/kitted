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

**Status:** not run. The paid call was blocked by this session's permission check (the OK reached this session through the coordinating session, not from the founder here). Spent: **$0.00**. The script is ready: `extraction-test/gold_looks.py` (pilot, then the full run, with the commands in its header).
