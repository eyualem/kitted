# Judge pilot: 5 Claude judges, scored by parts (Oct 10, 2026; DECISIONS-LOG #192–194)

*59 saved photos: his and his friends' phone checks (12 with app scores), 6 web mirror selfies, and 33 stock photos. One photo was skipped (several people in it). Face-hidden copies were made with the #188 fix, shuffled, and shown under IDs only. The brief is `inputs/judge-pilot/BRIEF.md` (v2: six parts with anchors). Raw files: `inputs/judge-pilot/judge-*.csv` (git-ignored). The score is computed from the parts with weights fit 25, proportions 25, color 15, shoes 15, cohesion 15, condition 5, rounded to the half; the panel score is the median of the five judges. Profiles (rule 7): his photos are the founder (profile pending), his friends' and the stock photos are "profile unknown". The judges saw no profile, and no split by age or picked look is possible.*

## Results
| Check | Result |
|---|---|
| Panel scores | median 7.0; ≤5.5: 10%, 6–6.5: 27%, 7–7.5: 56%, 8+: 7%, 9+: 0% |
| App vs panel (51 photos with a reading) | app higher by **0.45** on average (**0.79** on his and his friends' photos, 0.38 stock, 0.17 web mirror); within 0.5 on 28 of 51; off by 1.5+ on 6; correlation 0.56 |
| Parts score vs the judges' own gut | parts higher by 0.37 on average, never more than 1 apart: the weights roughly match their overall impression |
| Do the 5 judges disagree? | **At most 0.5 apart on every photo.** They are one model five times, not five opinions |
| Spread | panel standard deviation 0.62 (app 0.81). Nothing above 8.5; below 5 only for slides outdoors |
| Before/after pairs (stock p01–p04) | barely separated: 7.0→7.0, 7.0→7.5, 7.75→7.5, 7.0→7.0 |

**His and his friends' fits:**
- Friend's navy blazer + light baggy jeans bunched on chukkas: panel **5.5** (app 8.5, founder ~7). The bunched hem under the blazer is the main reason.
- Chore coat + white tee + washed black jeans + Sambas: panel **7.5** (app 8.5, founder ~7). Faded jeans are the drag.
- His black tee + wide jeans + white sneakers: **7.0–7.25** (app 7.5). Lint and a slight puddle at the hem.
- His gingham shirt over wide jeans: **6.0** (app 7.5). The shirt hangs long and loose, and the sleeves run long.

**What the panel sees that the app's reading misses** (counted in reasons): lengths running long (23), fading (16), stacked or pooled hems (12 + 11), tuck and shape (13), skinny trousers (7), wrinkles and lint (13). Lowest part on average: shoes (6.6), then proportions (6.8).

## What it means
1. **Direction confirmed:** the app runs about half a point too generous overall, and most on the people the app is for. A 6.5 starting point (instead of 7.0) gives the app median 7.0 and 8+ at 8% on his saved fits, which lines up with the panel (median 7.0, 8+ 7%).
2. **One judge, not five.** Averaging five copies of the same model adds no reliability. The panel is one AI opinion with five accents.
3. **Compressed.** The panel stays between 6 and 7.5 for 83% of photos and barely separates before/after pairs, so it can't yet set fine differences or fix detection.
4. **It does name real faults** the reading can't see (condition, hem bunching, long sleeves, a long shirt over wide jeans). Those are leads for the rubric and the readings, not scores.

## Next, to make the judge usable
- **Different models per judge** (Opus, Sonnet, Haiku), so the panel is more than one opinion.
- **Ranking instead of absolute scores:** judges rank batches of ~10 photos and pairs ("which is better, A or B?"), and the ranks map onto the target curve. Models separate things far better by comparison than on an absolute scale. This is also how fix pairs are judged.
- **Anchor photos:** a fixed set of 6–8 photos with agreed scores shown with every batch, to stretch the scale.
- **Repeat test:** the same photos again in a new order, to check the panel gives the same scores.
- **A small human check:** the founder looks at the 10 photos where the panel and app disagree most.
