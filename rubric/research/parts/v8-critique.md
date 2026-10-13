# How outfits are scored today (parts v8): four critics, one verdict

*Oct 12, 2026. Claude, from four parallel critics (data, stylist, the advice on the card, the scoring model's design). DECISIONS-LOG #229. Paper only: no code changed, no API calls. Their scripts and full outputs: `scratchpad/critic-{data,stylist,fixes,design}/` (session scratchpad, not in git). Rule 7: gold photos are "profile unknown", scored with one test profile (Minimal + Smart casual, a little bold, Everyday); the stylist's 90 outfits are made up, with no person; the founder's profile is still pending.*

## Bottom line

1. **The app can't tell a great outfit from a good one.** Within Instagram, where the panel's 8s are, a panel 8 outscores a panel 7 only 50% of the time on the tuning half and 60% on the test half (n 38 vs 38, 23 vs 24; Claude re-checked both). A score of exactly 7.0 (a third of all photos) spans panel scores from 5.1 to 8.1. Every rule fires as often on the 8s as on the 7s.
2. **Correction to the v8 report (#227).** "v8 follows the panel about twice as well" is true overall (test r 0.32 → 0.54) but misleading. **Inside one source, on held-out photos, v8 is no better than v7: r 0.37 vs 0.38.** The whole gain is telling the sources apart: the source label alone (Instagram, Pinterest or Reddit) predicts the panel at r 0.71 on test, better than v8. Your 20 blind ratings also follow the source (r 0.82); within a source you agree with the panel at only 0.42. So the gold set rewards "2026 creator photo vs dated Pinterest photo", and v8's narrow-leg and waist-break rules partly learned that.
3. **v8 isn't wrong, it's unproven.** The stylist critic scored 90 everyday outfits by eye before seeing the engine: within half a point on 79 (88%), r 0.80. It backs the narrow-leg charge, the bigger waist break over wide legs, no credit for a lone bright piece, and "problems add up" as real menswear practice. Keep v8. **Stop tuning against this gold set**: re-weighting is used up (every knob moves r by ≤0.015), and refitting points overfits (tune 0.79 → test 0.35).
4. **The advice is the biggest thing a user feels, and it's fixable without touching scores.** 41% of gold cards say "No quick fixes", although judges name a clear fix on 89% of those. More than half of your saved checks land on exactly 7.0, none of yours reach 8, and on 56% the only way up is to buy or own something.

## What's wrong, ranked by how much it matters

### A. The target (the gold set) can't judge the top end. Fix this before any more tuning.
- Almost no bad fits from creators and no good fits from Pinterest, so source and quality are tangled.
- The five AI judges are effectively one rater: they agree with each other at r 0.94–0.96, and each judge's six part scores are one gut score (one factor explains 85–87%). "Fit r 0.22" against the judges' Fit doesn't measure Fit.
- **What fixes it (data, rough sizes):** your ~15 one-outfit variants, ideally 4 people × 15 = 60 (the only data that shows a rule's real effect with body, room and source held fixed); ~50 good fits from ordinary people and ~50 weak fits from current-looking photos; 3–5 guys 18–30 each ranking ~100 photos in pairs within one source (~30 min each). New headline measures: within-source r and "does an 8 beat a 7".

### B. What the reading misses (only new or better readings close the 7 vs 8 gap)
- **Hems:** where 3+ judges say the trousers pool or stack (28 photos), the reading says "pooling" on 4. Judges name the hem as the fix on 107 of 223 photos.
- **Length:** a cropped top read as "mid fly" switches off the shape credit (7 of the 24 under-scored 8s). "Shirt too long" is in 4 of your 20 notes, and the reading says mid fly on all four.
- **Size vs cut:** "a size big" can't be told from "roomy on purpose" (10 photos).
- **Dated pieces** (argyle, acid wash, bootcut, boat shoes; 11 photos), **condition the schema can't name** (store tags, lint), **shorts length** (Proportions isn't scored on shorts; the worst group on test).
- **Condition flips:** ig-061 (you 8, panel 8) reads "worn" on one run (6.5) and clean on the other (8.0).
- **The cheapest first test:** the focused lower close-up question from #190 (hem and length, ~$0.30–2, needs your OK).

### C. Rules that are wrong by broad consensus (the stylist critic; fixable now, no data needed)
1. **Interviews don't require a collared top or a jacket.** A boxy tee tucked into wide trousers with loafers scores 8.0 at an interview; a hoodie with dark jeans 6.0; a tee with chinos and loafers 7.0. Proposed: no collared top, knit or jacket at an interview → held to 6.0, a hoodie or sweatshirt → 5.0; a hoodie with nothing over it on a date → −0.5. "Is this OK for my interview?" is a core question for the app.
2. **Same-wash double denim** costs nothing (only a tip), although the reading gives the wash: −1.0 on Color.
3. **An oversized graphic tee under a blazer** is excused (KD-9): give it the style-crossing charge; a fitted tee stays free.
4. **The loud-print rule hits a look's own pieces** (a streetwear box-logo tee, a workwear buffalo flannel, a camo bomber). The score mostly holds, but Color becomes the card's headline: "the big, loud print takes over the outfit" on a textbook fit. Exempt each look's own loud pieces.
5. **Structured layers earn nothing over an untucked top** (blazer, overcoat or leather jacket over a tee or sweater): +0.5 to +1.0. Grown-up layered fits sit half a point low; streetwear reaches 8 more easily than smart casual.
6. **Smaller:** trail shoes read as running shoes (outdoor has no path to 8); double-knee work pants read as chinos; navy blazer with charcoal trousers costs −1.5 (taste: −0.5); the 5.0 floor holds up loungewear that fails two parts.

### D. The advice on the card (no score change; the fix engine and copy)
- **Hems:** judges name it on 107 photos, the app on 4. Since #221, stacked wide legs cost nothing, so cuff and hem fixes can't raise the score and never show. Show them as tips with no number (cuffing is free; hemming costs about $15 at a tailor). That alone fills 50 of the 82 "No quick fixes" cards.
- **The pant swap is wrong-headed:** "Swap … for navy chinos" leads on 26 gold cards; on 24 the judges say dark straight jeans. On your friend's navy suit jacket it makes a mismatched near-suit, the very fault judges dock.
- **The jacket default is back:** "Add a short jacket: a bomber or a denim jacket" shows on 22 of 78 saved checks (11 of 27 yours and your friends'); judges ask for a layer on 21 of 223. It's the #160 layer bias again, even over sweats and slides.
- **Contradictions and filler:**
  - "Boots lift Style to 7.5, but the score stays 7.5" (43 cards).
  - "One easy change gets you to 7.5" when the change is buying sneakers.
  - "No quick fixes" next to "Re-check after fixing".
  - The same "One quiet color" Next level line 35 times, while the per-style "path to 8" lines fired 0 times in 301 cards.
  - Reason lines naming the wrong part ("Swap the jeans for navy chinos · Raises Shoes to 8") or jargon ("Clears the condition point").
- **Trust:** "The score may not move yet" on every Next level line, and "Fit stops at 7" on every Why sheet, both read as "I can't reward you".
- **Suits:** "Swap the dress shoes for loafers" under a suit (the right shoe is the dress shoe).

### E. The scoring model's design (later, once A exists)
- Averaging five parts multiplies every rule by 0.15–0.30: 76% of rule firings move the total by under 0.25, so rounding hides them. A loud print costs the panel −1.85 but the app −0.30; running shoes −1.92 vs −0.30.
- Fit and Color sit at 7 on 84% and 73% of photos and carry 35% of the weight.
- The panel scores one gut number, not five parts, so tuning parts against judges' parts is tuning against the total.
- **The design that generalised best:** one additive scorecard. Named signals worth ±0.25 to ±0.5, steady facts only, fixed signs from a stylist's reason, each tagged with a part so the card still shows parts. Within-source test r 0.52 vs v8's 0.37; exactly the same score on both runs 87% vs 78%. It's still only an option: n 91, about ±0.13 of noise on any single r, and no model separates 8 from 7 yet.

## Recommended order
1. **Now, no data needed:** the advice fixes (D) and the consensus rules C1–C4. Scores move only where a rule is clearly wrong (interview, double denim, graphic tee under a blazer); the rest is wording and which fix leads.
2. **This week (yours):** the ~15 one-outfit variants already on your list. Add 2–3 friends doing the same if you can, plus a second human rater on ~40 photos within one source.
3. **Then:** the hem and length close-up reading test (B; ~$0.30–2, your OK), and only after the new target exists, the scorecard redesign (E), judged by within-source r and "an 8 beats a 7".

## What not to do
- Don't re-tune v8's weights or points on this gold set; it overfits.
- Don't use the photo source, the mirror flag or the room as signals.
- Don't add more credits for simply having a piece ("presence credits"): they fire on safe, dull fits just as often.
