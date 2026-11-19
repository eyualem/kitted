# Taste check: running shoes, loud prints, strong outlines, pooling, and a shoulder-line test plan (Nov 19)

Paper only: stored readings, no model calls, **$0 spent**, no scoring code changed. Engine v16 (`extraction-test/rubrics/parts_proto.py`) against the founder's 164 blind ratings. His ratings are gut taste, so these numbers give direction, not exact targets. Photos are named by file code only; the photos and his sheets stay in `inputs/` (git-ignored).

## The short answer

1. **On his 164 photos he does not rate runners or loud prints higher than v16. He rates them a little lower.** Nothing in the 164 supports softening either charge. The blue graphic tee is one photo where he disagrees with v16, and it points the other way from his own pattern.
2. **v16 is already slightly generous overall:** it averages 7.12 against his 6.92, within 1 point on 134 of 164 (82%), r 0.64.
3. **The puffer's pooling charge costs no points.** The card shows "FF7 pooling -1.5", but v16 ignores that charge in the score everywhere, whatever style is detected. The waiver is not tied to style, so nothing is missing from it. The card line is the real gap (see Part 1, group 4).
4. **Recommendation on the softenings: (c), no change.** If he still wants the blue tee to reach 8, option (b) is the safe choice. It moved 0 of his 164 and nothing else on the gold set.
5. **The shoulder-line test costs about 66¢ expected (300 calls), capped at 75¢.** It needs his OK and about 15 minutes of his labeling.

## Part 1: does he rate these higher or lower than v16?

Base: his 164 rated photos that have a stored reading (his first 20, the gold photos on sheet 1, sheet 2, and the 20 new photos from Nov 16), scored by v16 with no second looks, Everyday, the test profile, a warm day only for shorts. Gap = v16 minus his.

| Group | n | His mean | v16 mean | Gap | Within 1 |
|---|---|---|---|---|---|
| Everything he rated | 164 | 6.92 | 7.12 | +0.20 | 134 (82%) |
| 1a. Running shoes, any kind (SK2 fires or runner footwear) | 17 | 6.76 | 7.09 | +0.32 | 16 (94%) |
| 1b. Retro runners (SK2 does not fire on these) | 13 | 6.92 | 7.42 | +0.50 | 12 (92%) |
| 1c. Performance runners (SK2 fires, shoes set to 5.0) | 4 | 6.25 | 6.00 | -0.25 | 4 (100%) |
| 2. Big bright graphic (CL1 fires, -1.5 on Color) | 8 | 5.81 | 6.06 | +0.25 | 8 (100%) |
| 3. Proportions 8 or more and one part 5.5 or less | 2 | 6.50 | 6.75 | +0.25 | 2 (100%) |
| 4. Pooling (FF7), no style detected | 3 | 6.67 | 7.00 | +0.33 | 1 (33%) |
| 4. Pooling (FF7), a named style | 0 | none in his ratings | | | |

How to read it:

- **Retro runners.** SK2 fires only on performance runners, so retro runners are not charged. v16 scores them 0.5 above him, so there is no under-scoring. Named examples: C128 (sage bomber, tan sweater, sage cargos, cream retro runners: his 6.5, v16 8), pin-006 (light-blue camp shirt, mid wide jeans, white retro runners: his 6, v16 7), pin-039 (grey graphic tee, straight jeans, white retro runners: his 6, v16 7).
- **Performance runners.** Only 4 photos. v16 is within 0.25 of him on average: C126 (white sweatshirt, white slim jeans: his 6, v16 6), pin-015 (white graphic tee, skinny jeans: his 5.5, v16 5.5), pin-038 (white graphic tee, wide athletic shorts: his 6, v16 6). The one miss is C020 (black jersey, wide charcoal shorts), where he is 1 point higher (7.5 against 6.5). Four photos can't carry a rule change either way.
- **Loud prints.** All 8 are within 1 point, and v16 sits 0.25 above him. pin-070 (red graphic tee, red jeans, red sneakers): his 5, v16 6, so he is harsher there. pin-013 (black graphic tee, skinny jeans, red basketball sneakers): his 5.5, v16 5, the one case where v16 is lower.
- **Strong outline with one weak piece.** Only 2 photos meet the bar, which is too few to answer "does v16 under-score these". ig-097 (charcoal tee, wide black chinos, slides; Shoes 5.0): his 7, v16 6.5. pin-006 (Color 5.5): his 6, v16 7. They split, so there is no consistent under-scoring. Photos with Proportions 8 or more (47) track him well: his 7.85, v16 7.81.
- **Where he and v16 disagree most is elsewhere:** very dressy outfits he loves (ig-059, a black suit: his 9.5, v16 7.5) and smart-casual photos he finds ordinary (rd-017, C052, rd-010: v16 7 to 8, him 5.5 to 6). His scale also runs wider than v16's: 8.5% of his ratings are 9 or higher, and v16 gives none.

### Today's three photos (his words from `inputs/gold-judge/nov19-founder/notes.md`)

These have no stored readings. The scores are the paper readings in his notes (median of 9 to 11 readings).

| Photo | App on his phone | v16 on paper | His rating | What he said |
|---|---|---|---|---|
| 01-layered-tee (slate pocket tee over a beige long sleeve, light wide jeans pooling, cream sneakers) | 8 | 8.0 | 8 | "agrees" |
| 02-blue-graphic-tee (bright blue conference tee, black wide jeans, belt, black running shoes) | 7 | 7.0 (CL1 -1.5, SK2 -2.0) | 8 | the color charge and the runner charge "aren't really valid"; proportions should carry it |
| 03-black-puffer (cut for a much smaller frame, light straight jeans, shoes out of frame) | 7.5 | 7.0 (FF7 on the card; no lift) | lower than 7.5 | the jacket's shoulders slope down hard; the body is short, the collar bunched, the sleeves just short; friends chuckled |

Photo 02 is the only one of the three that points toward softening, and the 164 ratings go the other way for the same two features. Photo 03 shows the opposite problem, an outfit that is too generous. See Part 2.

### 4. Pooling: the waiver, and why the puffer's "-1.5" costs nothing

His Nov 17 call (log #470, `tasks/T68/TASK.md`) was that pooling stops costing points until it reads steadily. What the code does:

- `extraction-test/rubrics/parts_proto.py:1810` lists `FF7_pooling` in `V16_UNSTEADY`. Line 2191 (`owned |= V16_UNSTEADY | waived`) then drops it from the fault total and from the "fit or shape fault" ceiling, so it moves no points in v16. The app mirrors this (`app/packages/kitted-core/src/parts.ts:1698` and `:2107`).
- The waiver is **not tied to the detected style**. It applies with no style, a named style, loose legs, straight legs, everywhere.
- Pooling now costs points only through the shoe close-up cap H7 (line 1849). It fires when the second look says the hem "mostly" covers the shoe and the leg is not loose.
- **Check:** I changed the hem from "pooling" to a clean hem on all 3 photos in his ratings where FF7 fires (all with no style detected) and on all 4 gold photos where it fires. **The final score changed on none of the 7**, and neither did the Proportions part. I also built a puffer-style reading (black puffer, tee, light straight jeans pooling). It shows "FF7 -1.5" on the Fit card and the score is 7.0, "nothing off, nothing chosen".

So "FF7 cost 1.5 on the puffer" was the card, not the score. The 7.0 is the plain baseline: no charge and no lift. The real gap is that **the card still shows a -1.5 line that moves no points**. A user who reads the card would think the score dropped for pooling. That is a words and display question, not a scoring one, so it goes to him and the screen-copy work. I did not fix it.

## Simulated softenings

`score_parts(..., tune=...)` with the two knobs. Halving means `sk2_runner` 5.0 to 6.0 and `cl1` 1.5 to 0.75. I added (d), neither charged, as a ceiling. "(b)" applies the halving only when the photo's Proportions part scores 8 or more. Gold is the 223 photos, first reading, cool day, the test profile, as in `v16_paper.py`.

| Option | His 164: within 1 | r with him | Photos moved of 164 | Gold: steady (215 base) | Gold: steady with leg look (218 base) |
|---|---|---|---|---|---|
| (c) no change | 134 (81.7%) | 0.640 | 0 | 215/223 | 218/223 |
| (a) both halved | 133 (81.1%) | 0.636 | 1 | 215/223 | 217/223 |
| (b) both halved if Proportions 8+ | 134 (81.7%) | 0.640 | 0 | 215/223 | 218/223 |
| (d) neither charged | 132 (80.5%) | 0.631 | 8 | 215/223 | 217/223 |

Band shares on gold (target: 5% / 15% / 30% / 30% / 15% / 5%). v16's worst gap is 19.5 points in all four, because the top two bands are far from target (8 to 8.5 is 34.5%, 9 to 9.5 is 0%). No softening changes this:

| Option | 3-4.5 | 5-5.5 | 6-6.5 | 7-7.5 | 8-8.5 | 9-9.5 |
|---|---|---|---|---|---|---|
| Target | 5.0 | 15.0 | 30.0 | 30.0 | 15.0 | 5.0 |
| (c) none | 0.4 | 7.2 | 16.1 | 41.7 | 34.5 | 0.0 |
| (a) halved | 0.4 | 7.2 | 14.8 | 43.0 | 34.5 | 0.0 |
| (b) halved, Proportions 8+ | 0.4 | 7.2 | 15.7 | 42.2 | 34.5 | 0.0 |
| (d) neither | 0.4 | 6.7 | 14.8 | 43.5 | 34.5 | 0.0 |

On his 164, (a) moves only pin-070 (6.0 to 6.5, his 5, so it moves away from him). (d) moves 8 photos, and 7 of them move away from him. Only pin-013 (5.0 to 5.5, his 5.5) moves toward him.

### Named outfits, before and after

| Outfit | (c) none | (a) halved | (b) halved if Proportions 8+ | (d) neither | His rating |
|---|---|---|---|---|---|
| 02-blue-graphic-tee, his real photo (paper numbers from the notes) | 7.0 | 7.5 | 7.5 only if v16 gives Proportions 8+ there (the notes don't store the part score), else 7.0 | 8.0 | 8 |
| Same outfit as a made-up reading (bright blue graphic tee, black wide jeans, black performance runners), for a check | 7.0 | 7.5 | 7.0 (Proportions 7.0) | 7.5 | not rated |
| pin-070 (red tee, red jeans, red sneakers) | 6.0 | 6.5 | 6.0 (Proportions 7.0) | 6.5 | 5 |
| pin-006 (light-blue camp shirt, wide jeans, white retro runners) | 7.0 | 7.0 | 7.0 | 7.5 | 6 |
| pin-013 (black graphic tee, skinny jeans, red basketball sneakers) | 5.0 | 5.0 | 5.0 | 5.5 | 5.5 |
| 01-layered-tee and 03-black-puffer | unchanged by any option (neither charge fires) | | | | 8 and "lower than 7.5" |

The made-up reading shows 7.5 in (d), not 8.0. It has no lifts, so it is held at 7.5. His real photo reaches 8.0 on the notes' numbers. I could not re-score that photo here because there is no stored reading for it.

### Which one I'd recommend

**(c), no change.** The reasons:

1. Across the 164, runners and loud prints are not under-scored. v16 is a quarter point to half a point above him on them.
2. The two charges fire on 4 and 8 of the 164, so softening them changes at most 1 of 164 (a) or 8 (d). The tests can't tell good from bad on that few.
3. One photo he disagrees with is a taste signal, not a pattern. His own memo says to use his ratings for direction.

If he decides the blue tee should reach 8 anyway, **(b)** is the safest version: it matches today's numbers everywhere on his 164 and the gold set, and keeps steadiness at 215 and 218. It needs his yes and a strict build, since it touches scoring. I did not touch any code.

## Part 2: a narrow shoulder-line read for outer layers (plan only, nothing run, $0 so far)

**Why a new test.** The shoulder-seam read failed at 78% (KD-13 / FIT-1 in `rubric/v5-styles.md`). Today's puffer shows what that left out: a jacket that is too small for the wearer, with the shoulder sloping down, a short wide body, a bunched collar or hood, and sleeves just short, scored 7.0 to 7.5 where he says lower. I'm describing the garment only, never the person who wears it.

**The question.** A second look in the style of `extraction-test/prompt_look_w.txt` and `schema_look_w.json`. It is one call on the face-hidden outer-layer crop, only on photos with an outer layer (jacket, coat, puffer, bomber, overshirt, cardigan, blazer). It asks about the garment only:

- `shoulder_line`: the top edge of the jacket from neck to sleeve is `squared` (runs out level, the seam at the edge of the shoulder), `natural` (a gentle slope), `sloping_down` (drops steeply to the sleeve), `not_visible`.
- `body_length`: the jacket's body from collar to hem looks `short_and_wide`, `typical`, `long`, `not_visible`.
- `neck_bunch`: the collar or hood `sits_high_and_bunched`, `sits_normally`, `not_visible`.
- `sleeve_end`: `just_short_of_wrist`, `at_wrist`, `past_wrist`, `not_visible`.

The combined flag ("two or more signs, so the piece reads too small") is computed **by the code, not the model**: it is true when `sloping_down` plus at least one other sign (`short_and_wide`, `sits_high_and_bunched`, `just_short_of_wrist`) are present, or when any three of the four are present. That keeps "the AI sees, the code judges". Same settings as the other looks (gemini-3.8-flash, temperature 0, schema enforced, the same thinking setting as the leg-width look).

**The labeled set (about 100 photos).**

- **Who:** the founder labels, blind, on the same kind of sheet as his 164 ratings (one photo at a time, with the photo ids shuffled and the key kept apart). No labels from the model. I can't be an independent judge, because I read the same photos the test runs on.
- **Which photos:** the 69 of his 164 rated photos that have an outer layer, plus about 31 more gold photos with outer layers (78 on the gold set, which overlap). Include every puffer, every outer layer the readings call oversized (volume 4 or more), and some structured jackets as clear "not too small" cases. 03-black-puffer joins the set as a known "too small" case.
- **What he labels, per photo, four short questions about the jacket:** shoulder line (squared, natural, sloping), body (short and wide, typical, long), collar or hood (bunched high, normal), sleeves (just short, at the wrist, past it), then one overall: "reads too small / reads fine / reads too big". About 10 to 12 minutes.
- **His consistency check:** 20 photos shown again at the end, in a new order. If he agrees with himself on fewer than 16 of the 20, the labels are taste, not fact, and the test measures direction only.
- **Where it lives:** `inputs/` only, git-ignored.

**The bars (3 repeats of every photo).**

- **Steadiness (B6 style):** at least 90% of photos give the same `shoulder_line` answer on all 3 repeats, and the combined flag is identical on all 3 for at least 90%. A field below 80% steady is dropped, as the unsteady reads were in T68.
- **Accuracy against him:** `shoulder_line` agrees with his label on at least 80% of photos, and "sloping_down" has at least 80% precision (a false "too small" would insult a good jacket).
- **The combined flag:** catches at least 70% of the jackets he calls "too small", and fires on at most 5% of the jackets he calls "reads fine".
- Missing the bar means the flag stays off and nothing changes in the engine. Whether a passing test becomes a cap or a lift is a separate decision for him, then a strict build.

**Price, from `extraction-test/` data.** The leg-width look is the closest cousin (a close-up, a short enum answer, the same model). It ran 475 calls for $0.9652, averaging 1,330 input tokens, 14 output and 262 thinking tokens, which is 0.203¢ per call at Google's price through Dec 31 2026 ($0.75 in and $3.75 out per million, `compare.py`), with a worst call of 0.56¢. The shoulder look adds about 150 prompt tokens and about 20 output tokens (four fields), so I'd plan for 0.22¢ a call.

| Item | Calls | Cents |
|---|---|---|
| 100 photos x 3 repeats | 300 | about 66¢ (300 x 0.22) |
| Cap, set in the script as a hard stop | | 75¢ |
| Worst case if every call cost the leg look's worst (0.56¢) | 300 | 168¢, so the script stops at 75¢ before it gets there |

If it hits the cap early, it reports how many photos it finished and stops, with nothing run past the cap. It needs the founder's yes to spend, relayed by the parent session. The labeling sheet can be built now at $0.

## What I did not do

- No scoring code, spec, tests or fixtures were touched.
- The blue tee's and puffer's stored readings do not exist, so the "his real photo" numbers come from his notes, not a fresh run.
- Group 3 is 2 photos and group 4 is 3 photos, so those rows are anecdotes, not evidence.
- His ratings fluctuate; a 0.5 to 1 point disagreement on one photo is within his own noise.

## Where this lives

The script that produced the tables is not committed (it reads git-ignored data). The numbers match `extraction-test/results/v16/report.txt`'s 215/223 and 218/223 steadiness baseline, which I used to check it.
