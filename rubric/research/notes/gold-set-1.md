# Gold set, first run: the app against a 5-judge panel on 225 public photos

*Oct 12, 2026. Claude. DECISIONS-LOG #224. Scripts `extraction-test/gold_read.py` (readings, results `extraction-test/results/gold1/`), `extraction-test/gold_compare.py` (`compare.txt`, `within_person.txt`). Judge brief `inputs/gold-judge/BRIEF.md` (v3); judge files `inputs/gold-judge/judge-*-b*.csv`; photos and judge files git-ignored.*

## Bottom line

1. **The panel works as a measuring stick.**
   - **Repeatable:** each judge gave the same photo, hidden under a second ID, the same score within 0.5 on 13–15 of 15 repeats.
   - **Uses the whole scale:** standard deviation 1.02, against the Oct 10 pilot's 0.62. The panel's spread: 27 at 5.5 or below, 49 at 6–6.5, 86 at 7–7.5, 62 at 8–8.5, 1 at 9+.
   - **Five models agree with each other** (r 0.92–0.96): Fable, two Opus judges, two Sonnet judges. That could mean the clothes are clear, or that AI models share a taste. A human check is still needed (below).
2. **The app barely tells a good fit from a bad one.**
   - **Overall:** correlation with the panel is **0.33**. The app's spread is 0.55 against the panel's 1.02, and 145 of 223 photos land at 7–7.5.
   - **By the panel's band:** the panel's worst fits (≤5.5) get **6.65** from the app on average; its 8–8.5 fits get **7.23**. The app's bands are 0.6 apart where the panel's are 3 points apart.
   - **By source:** on the Pinterest bad-fit folder the app runs **+0.88 too generous** (6.92 vs the panel's 6.05). On the Instagram creators it runs **−0.51 too harsh** (7.12 vs 7.62).
3. **Same person, different outfits** (13 Instagram series, 67 photos; body and room held fixed): the app still follows the panel only weakly (r 0.38). So the weak match isn't only body or setting.
4. **Part by part, only Shoes tracks the panel:**

| Part | Correlation with the panel | App spread vs panel spread |
|---|---|---|
| Shoes | **0.61** | 0.93 vs 1.08 |
| Cohesion / style | 0.21 | 0.64 vs 1.13 |
| Proportions | 0.18 | 0.66 vs 0.98 |
| Fit | **0.04** | 0.70 vs 0.92 |
| Color | **−0.18** | 0.37 vs 0.93 |

## What the panel sees that the app's rules don't

The AI reading usually names the garments right; the rules don't use what makes them good or bad. From the largest disagreements:
- **pin-033** (app 7.5, panel 5.0): a loud paisley shirt with pink cuffs, untucked, over pooling jeans. The app has no rule for a busy pattern that swamps the outfit, and no rule for a size problem.
- **pin-063** (7.0 vs 5.0): a blazer a size too big, an untucked shirt, baggy pooling jeans. The app read "blazer, oxford, jeans, dress shoes" and scored it like a clean smart-casual outfit.
- **pin-059** (7.0 vs 4.5): long jorts, a flannel over a camo shirt, sport sandals, "no shared idea". Cohesion doesn't catch pieces from different worlds.
- **rd-010** (8.0 vs 6.0): a cream pinstripe blazer over near-matching beige trousers reads as a mismatched suit. The app gave its top tailored credit.
- **ig-102** (6.0 vs 8.0) and **ig-016** (5.5 vs 7.5): a deliberate shape or a tonal lounge look worn with flip-flops or slippers. The app's slides and sweats rules sink these; the panel docks the shoes but credits the shape.

## What this means for the plan

- **The problem isn't measuring proportions** (#222–223). It's that the parts engine's rules (fit, color, cohesion) don't track what makes an outfit good. The next work is rules, tuned against this panel, not more phone scripts.
- **The order, by what the data says:**
  1. Fit: size faults (a jacket or shirt a size big).
  2. Color: busy or loud patterns.
  3. Cohesion: pieces from different worlds, a mismatched near-suit.
  4. Ease the slides and sweats penalties when the rest of the outfit is deliberate.
  5. The 7.0 starting point.
- **Before tuning on it,** a human should check the panel: the founder or a friend rates 20 photos (10 minutes). If they agree with the panel, the panel becomes the target. If not, we learn where AI taste drifts.

## Setup notes

- **Photos:** 226 of the founder's screenshots (131 Instagram, 74 Pinterest, 21 Reddit; public strangers, internal only). One second screenshot of the same photo is dropped. Photo prep refused one photo (two people), leaving 225.
- **Rule 7:** every photo is "profile unknown". The app side used one stated test profile at Everyday. No split by age band or picked look is possible.
- **App:**
  - **Engine and reading:** parts v7, with the live reading config (gemini-3.8-flash, close-ups on), 2 runs per photo.
  - **Steadiness:** 218 of 225 photos stayed within 0.5 across runs, and 177 were identical.
  - **Cost:** $2.69 (the founder approved $2–3).
- **Panel:**
  - **Judges:** 5 lenses on 3 models (streetwear: Fable; tailoring and workwear: Opus; minimal and peer: Sonnet).
  - **What they saw:** the face-hidden copies, under shuffled IDs, plus 15 hidden repeats. Each judge rated in batches of 40, so every photo was actually seen (a first single-batch attempt hit an image limit and was discarded).
  - **Panel score:** parts weighted 25/25/15/15/15/5, the median of the 5 judges.
- **Privacy findings:**
  - **ig-098:** the head runs off the top edge, and the mouth and chin were sent unhidden. The app does the same today. A fix task was offered.
  - **rd-021:** the blur covers most of the shirt.
