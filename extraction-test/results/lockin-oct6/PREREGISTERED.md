# Lock-in test (Oct 6): pass rules written BEFORE the run

**Question:** can we lock the API settings at thinking off + answer format v4, without losing quality?

**Photos:** the legacy 52 (40 stock `inputs/fitcheck-photos` + 12 mirror `inputs/mirror-fit-check-1`), 3 runs each.

**Fixed for every arm:** gemini-3.8-flash, 1024 px, temperature 0, rubric v3.1, styles minimalist 0.5 / smart casual 0.5, occasion everyday. All arms run at the same time.

| Arm | Thinking | Format | Role |
|---|---|---|---|
| A | default | v3 | control (today) |
| B | off | v3 | thinking-off alone |
| C | off | v4 | **candidate** |
| D | off | v4 | identical repeat of C, to measure same-session noise (A/A) |

**Lock C if all of these hold** (stock + mirror pooled, scorable photos only):
- **L1 consistency:** C ≥ 90%, and at most 2 more inconsistent photos than A.
- **L2 score drift vs. A:**
  - the mean per-photo median difference is within ±0.25
  - photos whose median moves by 1.0 or more are ≤ 10%, and no more than D-vs-C plus 5 points
- **L3 readings vs. A:** field-mode agreement on the rubric's key fields ≥ 90% overall. No key field below 80% unless D-vs-C is also below 80% (that would mean the field is noise, not the format).
- **L4 fix detection:** C detects at least (A − 1) of the 6 pairs.
- **L5 speed:** C's API-only median ≤ 5.0 s and p90 ≤ 8.0 s; visible answer tokens p90 ≤ 500.
- **L6 failures:** ≤ 1% of C's calls return no reading.

**Fallbacks:**
- **C fails only L5:** lock C anyway, since it's still the fastest that holds quality, and note the gap.
- **C fails L2/L3/L4 but B passes them:** lock B (thinking off, v3 format) and fix v4 before retrying.
- **B fails too:** keep thinking on and investigate.

**Not decided by this test:** score calibration, issue flags (advice-only), the person crop, model choice beyond 3.8, and accuracy vs. truth labels. These all need the gold set.
