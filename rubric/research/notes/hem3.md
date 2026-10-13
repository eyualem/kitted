# The hem close-up test (hem3): can a tight crop of the hems and shoes answer plain yes/no questions steadily?

*Oct 13, 2026. Claude (subagent). **Built and ready to run; not run yet** (no API key in the build session). The founder approved about $0.50 (Oct 13). Code: `extraction-test/hem_test.py` (plan at the top), `prompt_hem3.txt`, `schema_hem3.json`; labels `extraction-test/hem3_labels.csv`; outputs `extraction-test/results/hem3/` (the crops are git-ignored). Nothing in the app changes.*

## Why

All four of the founder's taste-source creators say where the pants meet the shoes makes or breaks an outfit (`rubric/research/creators/creators-rules.md` A4, B1–B4). The engine can't use it yet: the scoring call's six-class `hem` is only 64–68% steady (KD-8), so heavy hems stay tips ([PRO-10], FF7b). Two earlier tries failed: the phone's hem probe (#190) and the second look's six-class `pant_end` (#199: 74% steady, 54% right). What passed in #199 was a plain yes/no: "the pants rest on the shoe", 97% right when it fires. This is step 3 of the v8 critique (#229).

## What it does

- **The image:** a tight crop of both hems and shoes, from half a shin above the higher ankle down to the floor. It's cut from the face-hidden lower close-up the app's own prep already made (b1 and gold1, the #188 fix), placed by the body joints (Apple Vision ankles and knees). 76 of 78 photos have ankle joints; the other 2 use the bottom 35% of the close-up. Nothing new is sent: every crop is part of an image that was already sent with faces hidden.
- **One call per crop, four questions,** each "yes", "no" or "can't see". They describe only; no judging words.
  - (a) Does the hem touch the shoe?
  - (b1) Does the fabric gather in folds above the shoe?
  - (b2) Does the hem reach the floor, fold under the heel, or hang over the back of the shoe?
  - (c) Does ankle or sock show between the hem and the shoe?
  - The brief's (b) ("piles or drags") is two questions here, because the creators treat them differently on a loose leg. The report also scores the combined (b).
- **The config:** the same as look1: gemini-3.8-flash, thinking off, temperature 0, 3 runs.

## The photos and labels: 78 photos

- **Who's in them** (rule 7):
  - 19 of the founder (profile pending)
  - 4 of his two friends (profile unknown)
  - 1 unknown person (his Oct 10 16:07 check; ask him)
  - 7 web mirror selfies, 22 stock photos and 25 public gold-set screenshots (all profile unknown)
- **How the gold photos were picked:** stratified on the 5 judges' written reasons (pooling or dragging, ankle or sock, or no hem words). A hem reading uses no profile.
- **Left out:** 31 photos (no shoes, shorts, feet cut off, seated or crouching, two people, too small), each with its reason in the CSV.
- **The splits:**
  - mirror selfie 44, propped or other 34. This comes from the existing readings' mirror flag; most of his phone checks read as mirror.
  - straight or slim legs 43, relaxed or wide 31, flares 4
  - dark pants on dark shoes 29
- **How the 312 answers were labelled:**
  - 130 were mapped from earlier labels (`hem_labels.csv`, `truth.csv`, `look_labels.csv`) where the mapping is clean, and checked by eye.
  - 182 were labelled by eye from the crops, blind to every AI hem answer. 13 of these overrode an earlier label: jogger cuffs, a sock showing, small folds.
  - "Unsure" leaves a photo out of that question's accuracy.
- **What the labels say:**

| Question | yes | no | unsure |
|---|---|---|---|
| Touches the shoe | 64 | 11 | 3 |
| Folds | 19 | 49 | 10 |
| Drags | 9 | 59 | 10 |
| Ankle or sock | 13 | 62 | 3 |

  With only 9 "drags" yeses, the accuracy for that question when it says yes rests on few photos.

## The pass bar (#187 / #199), per question

- Steady 90% or more: the same answer on all 3 runs.
- Right 85% or more when it answers (every run counts).
- "Can't see" on 30% of runs or fewer.
- Each is also split by shot, by leg shape and by dark on dark.

## Then, on paper only

For the questions that pass, `--report` shows what the creators' version would do. It uses today's readings and engine (v10, Everyday, the stated test profile) and changes nothing in the engine:

- **Dragging costs on every leg.** Today a stack on loose jeans or cargos is free.
- **Piling costs on a straight or slim leg.** This is today's [FIT-4] charge, fed by this test instead of the unsteady `hem`.
- **A false "pooling" is cleared** when both fold questions say no.
- **A soft stack on a relaxed or wide leg stays free.**
- **"Rests on the shoe"** feeds the slides drag.
- **Ankle showing under wide trousers is a tip only.**

The report counts how many of his saved checks, the other saved photos and the gold photos would move, and lists them.

## Cost and the command

- **Cost:** about 0.12¢ a call. In look1 an image cost a fixed ~1,085 tokens whatever its size, so a call here is ~1,374 tokens in and ~45 out. 78 photos × 3 runs = 234 calls ≈ **$0.28**.
- **The budget cap:** `--budget` defaults to $0.60 and stops new calls before the cap.

From `extraction-test/`:

```
read -s GEMINI_API_KEY && export GEMINI_API_KEY
/usr/bin/python3 hem_test.py --runs 1 --only phone-d1967f,stock-s10 --budget 0.02   # 2-call pilot
/usr/bin/python3 hem_test.py --runs 3 --budget 0.60                                  # the test (resumable)
/usr/bin/python3 hem_test.py --report                                                # re-analyze, no calls
```

`--prep-only` and `--dry-run` need no key. The results go in `results/hem3/report.md`, which this note should then summarize.

## Things to know

- **One labeller (Claude), as in the earlier hem tests.**
  - Jogger cuffs are "unsure" on folds: the gather sits above the cuff, not on the shoe.
  - Sandals are "unsure" on ankle.
- **His phone photos are mostly one pair of black wide jeans,** 14 of 22.
- **The crops use the close-ups that were already sent** (1024 px; close to the 2048 working size for most photos), not a fresh 2048 crop. `kmeasure` has no hem-crop mode, and adding one needs a Swift rebuild, which was skipped for memory. Image size doesn't change the cost.
- **A macOS `sips` quirk:** it silently skips some crops that end on the image's bottom edge. The script keeps 1 px off the edge and checks every crop's size.
