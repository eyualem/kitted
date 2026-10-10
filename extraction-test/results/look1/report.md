# Second look (look1): narrow close-up calls next to the scoring call (Oct 10, 2026)

*The subagent's report, saved by the main session. Spent $0.561 (459 calls, 0 errors); the founder's ~$4 now stands at about $2.39 spent. Nothing live changed.*

**Verdict: three plain questions pass; the detailed ones fail.**
- **Pass:**
  - `under_present` (100% the same across runs, 98% right)
  - the peek as yes/no (`under_shows` reduced): 100% the same, right 86% when it fires
  - "the pant fabric rests on the shoe" as yes/no (`covers_shoe` reduced): 94% the same, right 97% when it fires
- **Fail:**
  - `outer_hem_at` (74% the same; "long" right only 70%)
  - `pant_end`, including the stack (74% the same, 54% right; it calls most full breaks "slight")
  - `shoulder_seam` (78% the same, 73% right; it also made the other answers worse, so it's dropped)

**Setup:** gemini-3.8-flash, thinking off, temperature 0. One close-up per call, a 210–300-word prompt and a tiny schema. The images are batch 1's 50 face-hidden photos (#188 fix), 3 runs per arm. Arms:
- **U:** the upper close-up
- **US:** U plus the shoulder seam
- **L:** the lower close-up

Labels are in `look_labels.csv` (blind; one labeller). Rule 7:
- the founder: 21 photos, profile pending
- the friends: profile unknown
- 703a8b and ebe23f: unknown, ask the founder
- web and stock: profile unknown

**Peeks:** Look U caught all 5 definite peeks on 3 of 3 runs (his hoodie over a white tee ×3, stock s04, s24), naming the hoodie as the outer piece. Batch 1 found 3 of 10. The one false peek is his b0f0c8: a dark band under the hoodie that could be a tee or the waistband.

**The blazer stack (d1967f): not seen** (slight / no / slight break). His wide jeans resting on boots or slides are mostly called slight or no break, the same failure as the scoring call.

**Speed and cost:**

| Arm | Median | p90 | Within 5 s | Cost per call |
|---|---|---|---|---|
| U | 2.7 s | 5.2 s | 88% | 0.126¢ |
| L | 2.6 s | 5.7 s | 85% | 0.110¢ |

U + L together add 0.236¢ per check (+41%), almost all image tokens. About 1 call in 8 finishes after the scoring call, so the card would fill in late.

**Ship as the second look (when the parts engine lands):**
- **U without the seam:** `under_present` + peek yes/no. It feeds "tee below the layer" as a tip, or −0.5 at most, until the gold set.
- **L:** "rests on the shoe" yes/no, for loose jeans dragging on slides and as a block on the hem reward.
- **Not for points:** `outer_hem_at` and `pant_end`. The stack under a blazer needs another approach: a tight hem-and-shoe crop at higher resolution, or a single "folds above the shoe?" question, to be tested on the gold set's stacked and pooled photos.

Files (in `extraction-test/`): `prompt_look_u/us/l.txt`, `schema_look_u/us/l.json`, `look_test.py`, `look_analyze.py`, `look_labels_make.py`, `look_labels.csv`, and the raw outputs in `results/look1/`.
