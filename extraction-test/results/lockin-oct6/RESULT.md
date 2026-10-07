# Lock-in result (Oct 6)

Rules: `PREREGISTERED.md` (written before the run). Full numbers: `compare.md` (v4) and `compare-v4.1.md` (v4.1, re-checked from saved answers).

| Arm | Consistent | API median / p90 | Cost now / 2027 | Fixes | vs. today: moved ≥ 1.0 | Verdict |
|---|---|---|---|---|---|---|
| A: thinking default, v3 (today) | 98% | 15.5 / 19.8 s | 0.86¢ / 1.73¢ | 4/6 | — | control |
| **B: thinking off, v3** | **100%** | **6.6 / 8.7 s** | **0.42¢ / 0.83¢** | **5/6** | 4% | **LOCKED.** Passes every quality rule; misses only the 5 s speed bar |
| C: thinking off, v4 | 92% | 3.9 / 7.3 s | 0.23¢ / 0.46¢ | 4/6 | 14% | Fails L1, L2, L3. Cause: the new "wrinkled" flag flips the care rule (25 of 104 photo runs) |
| C v4.1 ("wrinkled" made a tip), same answers re-converted | 96% (repeat 98%) | 3.9 / 7.3 s | 0.23¢ / 0.46¢ | 4/6 | 10% | Still fails L2 and L3: it reads color brightness, top length, leg shape and the outer layer **systematically differently** (the A/A repeat agrees 97.6%, so it's a different reading, not noise) |

**Decision:** lock **gemini-3.8-flash, thinking off, v3 format, 1024 px, rubric v3.1** (`run_test.py` now defaults to thinking off).

**Next:** v4.1 goes into the gold-set test (X9), where truth labels decide whether its different readings are better or worse. The v4.1 fix was made after seeing this data, so it needs a fresh run to confirm before it counts.

**Caveat:** the AI provider itself is under review because of the Gemini API's 18+ terms. If we switch, this lock-in has to be re-run on the new model with the same rules.
