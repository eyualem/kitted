# Reading batch 1: flip test (Oct 10, 2026)

**Verdict: the batch FAILS as a whole.** `lightness` and `scene.pose` pass on their own; the other four fields fail, and adding all six made the score less steady. Spent **$1.834** of the $2.00 budget (300 calls, 0 errors). Nothing in the app, the live prompt or schema, `rubric.py` or the fixtures changed. (The subagent's text, saved by the main session.)

## Setup
- **Arms:** A = the live prompt and schema. B1 = `prompt_b1.txt` + `schema_b1.json`: the live text plus 183 words, with these new fields: `hem_at`, `under_shows`, `scene.pose`, `lightness`, `shoulder_seam`, and three new `sleeve_end` values.
- **Config:** gemini-3.8-flash, thinking off, temperature 0, close-ups on. The two arms were interleaved in the same half hour.
- **Images:** prepared by the app's Swift (`kmeasure zoom`, rebuilt with the #188 fix). Every face in the 100 full and upper images was pixelated.
- **Photos:** 50 of the 78 labeled ones, chosen to fit the budget: all 23 phone checks (incl. the 3 from `20261010-185554`), 4 from Oct 7, 8 mirror selfies, 15 stock.
- **Labels:** `extraction-test/b1_labels.csv`, written blind before any B1 output was read.
- **Scoring:** v4.1 at Everyday, with the test profile Minimal + Smart casual.
- **Rule 7:**
  - founder: 21 photos, profile pending
  - chore-coat friend: 3 (f4870b, fb0b17, e438d4)
  - navy-blazer friend: 1 (d1967f)
  - **ask the founder who's in 703a8b (navy polo) and ebe23f (quilted jacket)**
  - web and stock: profile unknown
  - no age or look split is possible

## Old fields (3-run agreement, A → B1)
| Field | A | B1 |
|---|---|---|
| Footwear type | 80% | 76% (−4.4, fail) |
| Volume | 88% | 85% (−3.0) |
| Leg shape | 78% | 76% |
| Length | 79% | 76% |
| Hem | 64% | 70% |
| **Pooled** | 90% | 90% |

Accuracy also fell (every run, against the labels):

| Field | A | B1 |
|---|---|---|
| Top length | 67% | 59% |
| Hem | 54% | 50% |
| Leg shape | 67% | 62% |
| Sleeve end | 88% | 86% |

`covers_hand` reads rose from 7 to 18 (right 3 of 14). The `stacked_at_cuff` line seems to cause it.

## Score steadiness
| | A | B1 |
|---|---|---|
| All 3 runs within 0.5 | 47/49 (96%) | 42/49 (86%) |
| Exactly the same | 63% | 53% |
| Mean spread | 0.21 | 0.36 (worst 2.0) |

5 photos were steady only in A, 0 only in B1 (p = 0.06). Main cause: `K4_shoes_complement` switching on and off (12 photos vs 2), driven by his grey suede boots reading as chukka, derby or work boot across the formality-average line. It's the same failure as v5 and v5s (#63–64).

## New fields
Bars: ≥90% the same, ≥85% right when it fires.

| Field | Same | Right when it fires | Verdict |
|---|---|---|---|
| lightness | 95% | dark 98%, mid 95%, light 94% | **PASS** |
| scene.pose | 100% | seated 6/6 (2 photos) | **PASS** (small n) |
| hem_at | 74% | crotch 61%, waistband 74% | FAIL: flips on hip↔waistband and hip↔crotch |
| under_shows | 96% | a_little 45% | FAIL. A hoodie over a tee reads as a top, not a layer, so it misses 7 of 10 peeks |
| shoulder_seam | 78% | on_edge 63%, down_arm 76% | FAIL |
| sleeve_end, new values | 71% | short_sleeve 24/24, pushed_up 7/7 | FAIL (the covers_hand rise) |

## Speed and cost
| | A | B1 |
|---|---|---|
| Median latency | 5.17 s | 6.05 s (+0.88 s; bar +0.5 s: fail) |
| Cost per check | 0.571¢ | 0.652¢ |

## Recommendation
- Don't ship batch 1.
- Test `lightness` + `scene.pose` alone (about $1.80), or put `lightness` in the closet call, where it already passed.
- Move `hem_at`, `shoulder_seam` and `under_shows` to a narrow second look at the close-up, off the score's path.
- Drop `stacked_at_cuff`.
- For the parts engine: avoid K4's hard 0.75 formality line.

Files: `prompt_b1.txt`, `schema_b1.json`, `b1_test.py`, `b1_analyze.py`, `b1_labels.csv`, `results/b1/` (raw.json, analysis.*, run.log, manifest.json; images git-ignored).
