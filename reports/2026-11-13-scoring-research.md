# Why the score doesn't feel right, and what other rating apps do about it

Nov 13, 2026 · for Eyu Haile · cloud copy (editable): [Why the score doesn't feel right](https://claude.ai/artifact/Bi2G7SXhczTaGTgdY9oCfY)

You said the scoring is too generous, isn't rating things right, and you don't see anyone using the app. Four research passes looked at this: one measured where today's scores actually land ($0, using saved readings), and three studied how other products that rate things build a score people trust. They covered web-speed scores, wine and film ratings, credit scores, food scanners, chess game reviews, pronunciation apps, fitness trackers, Cal AI and face-rating apps (their mechanics only). Every outside claim below links to its source. The four I lean on most were re-checked against the page itself.

## The short version

- **The score isn't too high on average. It's squeezed together.** Weak outfits get pulled up to 6.5–7, great outfits never get past 8.0, and a third of your saved checks land on exactly 7.0. A number that's nearly always 7 tells him nothing, and then the fix doesn't matter either. That is most likely why it doesn't feel usable.
- **Your own blind ratings show it.** On 20 outfits you rated without seeing the app's score, you put a quarter at 5.5 or lower. The app put 5% that low. On the five you rated lowest, the app gave 5.0, 6.0, 6.5, 7.0 and 7.5.
- **The cause is how the score is built.** Every part starts at 7 ("nothing off"), and most rules rarely fire, so most parts never move. Fit stays at exactly 7 on 84% of outfits. "Nothing wrong found" is being scored as "good".
- **Lowering the starting 7 doesn't fix it.** It slides the whole pile down and wipes out every 8. The scale has to be pinned to real outfits instead, the way the trusted products below do it.
- **What works elsewhere:** the scale is tied to real examples, the top words are rare, one real fault can sink a score, the biggest point-loser is named first, the retry shows its payoff, and progress is measured against your own past.

## What we measured

Today's engine, run on saved readings. Gold set: 223 web photos, scored against a panel of five AI judges. Saved checks: 62 real checks from your phone (56 yours, 4 friends', 2 unknown).

| Word | App, gold set | AI panel, gold set | App, your saved checks |
| --- | --- | --- | --- |
| Needs a fix (5.5 or less) | 5% | 12% | 6% |
| Getting there (6–6.5) | 16% | 22% | 21% |
| Put together (7–7.5) | **60%** | 39% | **63%** |
| Sharp (8–8.5) | 19% | 28% | 10% |
| Dialed in (9+) | 0% | under 1% | 0% |
| Exactly 7.0 | 26% | | 34% |

- **Bad fits come out too high:** the panel's worst outfits (5.5 or less) get 6.37 from the app on average, and 10 of those 26 get 7.0 or more.
- **Great fits come out too low:** the panel's best (8+) get 7.49 on average. The app's highest score on the whole gold set is 8.0, and it never shows 8.5.
- **Agreement has improved but isn't there yet:** app vs panel r 0.56 (it was 0.33 in October); app vs you r 0.46; the panel vs you r 0.69.
- **The 5.0 floor isn't the cause.** It holds up only 1 of 223 photos.
- **What your phone showed at the time** (older engines): 8+ on 20% of checks, including one 9+. That is likely where "too generous" came from; today's engine gives 8+ on 10% of your checks.

**Limits.** The panel is AI judges (Claude), not people, and they may share one taste. Your 20 ratings are the only human check so far. The gold photos are "profile unknown", scored with one test profile, and their readings date from Oct 12. Ages were recorded only for you (22–25), so nothing could be split by age band. Script and full output: kept in this session's scratch folder, not the repo.

## What other rating apps do

**Pin the scale to real examples.**
- [Google Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) (web-page speed) fits its curve to millions of real sites: the 25th percentile scores 50 and the 8th percentile scores 90. If the whole web got faster, the bar would move up with it.
- [Photofeeler](https://photofeeler.com/help/results) (crowd ratings of dating photos) sets 5 as average for people of your gender and age, and says it rates "photos, not people".
- **Lesson:** "nothing off" should mean typical, not good.

**Make the top words rare.**
- [Vivino](https://www.vivino.com/en/wine-news/les-5-etoiles-vivino): the average wine is 3.6; only 15% beat 4.0 and 1% beat 4.5.
- Oura's crown shows only at 85+; Lighthouse is green only at 90+.
- When everything is good, nothing is: one study found perfect 5-star workers on an online marketplace went from 33% to 85% in six years ([NBER](https://www.nber.org/papers/w25857), [INFORMS](https://www.informs.org/News-Room/INFORMS-Releases/News-Releases/Five-Star-Rating-New-Research-Finds-It-May-Not-Reflect-What-Consumers-Receive)).

**Let one real fault sink the score.** [Yuka](https://help.yuka.io/l/en/article/ijzgfvi1jq), the food scanner, caps any product with a high-risk additive at 49 out of 100, however good the rest is. Kitted averages a real fault away: problems adding up take off at most 1.0.

**Name the biggest leak first.**
- Credit scores list reasons ranked by impact, and even high scorers get one ([myFICO](https://www.myfico.com/credit-education/blog/reason-codes)).
- [Arccos](https://au.arccosgolf.com/pages/arccos-just-dropped-its-biggest-app-update-ever-heres-whats-new) (golf stats) names the part of your game "costing you the most strokes right now".

**Show what's working and what isn't, honestly, then let him retry.**
- [Chess.com Game Review](https://www.chess.com/news/view/chesscom-releases-new-game-review) labels every move (Brilliant, Best, Mistake, Blunder), jumps to the key moments, and lets you retry them for "a new adjusted accuracy score". The Great and Brilliant labels are deliberately kinder to beginners.
- **The trap:** a player with no mistakes got 73% and was confused, because moves labelled "Excellent" still cost points ([forum](https://www.chess.com/forum/view/game-analysis/game-review-1-miss-means-73-accuracy)). Never praise a piece that's costing him points.

**Compare him with himself.**
- Oura and Whoop judge today's score against your own recent average ([Oura](https://support.ouraring.com/hc/en-us/articles/360025589793-Readiness-Score)). Strava's Relative Effort compares you with your own range, not with other athletes.
- That gives a reason to come back without a streak.

**Harsh works when it's fair, consistent and fixable.**
- Face-rating apps (mechanics only) show a low score next to a "potential" score, then a plan to close the gap. Reviewers call a low score "brutal but fair" and keep using the app ([App Store](https://apps.apple.com/us/app/maxxing-looksmaxxing-glow-up/id6502996574?see-all=reviews&platform=ipad)).
- What makes users angry is the same photo getting different scores ([Umax reviews](https://apps.apple.com/us/app/umax-become-hot/id6471026798)). Pronunciation apps lose trust the same way: inconsistent scores ([ELSA](https://makeheadway.com/blog/elsa-speak-review/)) and scores that are too lenient ([Speak](https://makeheadway.com/blog/speak-app-review/)).
- Across 607 measured effects, over a third of feedback made people do worse, mostly when it turned attention to the person instead of the task ([Kluger & DeNisi 1996](https://scholars.huji.ac.il/node/1802)). Rating the outfit, never him, is on the right side of that.

**The honest gap:** no app publishes whether a harsh first score keeps or loses users. Cal AI's founder said they don't have that data ([GetLatka](https://getlatka.com/interviews/cal-ai-zach-yadegari-2025)). The pattern above is consistent, but it comes from product pages and reviews, not experiments.

## What I recommend, in order

### The score (an engine change; needs your yes, built as a strict task)

1. **Build a human answer key first ($0, about 30 minutes of your time).** Rate 60 more gold-set photos blind, the same way you rated the 20. Right now the only human check is your 20, and tuning to the AI panel risks tuning to Claude's taste instead of yours. This doesn't replace the launch test with real people (Y6); it's what the tuning needs now.
2. **Make the parts see more.** Fit sitting at exactly 7 on 84% of outfits means the rules almost never find a size problem or credit a good fit. Add credits for what makes a fit good and charges for real faults, chosen where your ratings and the app disagree most (your 5.5s that the app scores 7.5, your 8s that it scores 6.5).
3. **One real fault caps the score** (Yuka's rule). For example, a clearly wrong-size piece, or pieces from different worlds, caps the outfit at 6.0, whatever the other parts say.
4. **A fixed curve from the engine's raw number to the score he sees**, fitted so each word gets a target share of real outfits (Lighthouse's method). Same photo, same score still holds, because the curve is code. Proposed targets:

   | Word | Target share |
   | --- | --- |
   | Needs a fix | 20% |
   | Getting there | 30% |
   | Put together | 30% |
   | Sharp | 15% |
   | Dialed in | 5% |

   - A test fails if any word drifts more than 5 points from its target, so the scale can't creep up again as rules change.
   - The curve comes after steps 2–3: stretching the scale alone doesn't fix which outfits rank higher (r barely moves).
5. **Raise the ceiling** so 8.5 and 9 can actually happen for a standout fit. Today nothing passes 8.0.

### The card and the reason to come back (spec changes; need your yes)

6. **Show what the fix is worth: "Swap to white sneakers: 7.5".**
   - The code can compute it exactly from the same reading, the way Credit Karma's simulator shows the score you'd get.
   - This reverses part of the approved card (F2.8 and the quieter card task, T66, which hide the gain), so it's your call.
   - The evidence is split. Chess, credit apps and face raters show the gap. The risk is a re-check photo that reads differently and misses the promised number.
   - **My call:** show it, and keep that promise by having the re-check change only the fixed piece and keep the rest of the first reading.
7. **Name what's working and the biggest point-loser,** one short tag per piece, chess-style, and never a kind word on a piece that costs points.
8. **Compare with his own past once he has 5 checks:** "Your best this month" or "Above your usual 6.5". No streaks.
9. **When sharing comes back after launch, share the jump, not the number:** "6.0 to 7.5 with one swap". It works like a glow-up post with no face or body in it.
10. **Say "Same photo, same score" in the app.** It's the opposite of what users of other rating apps complain about most.

**What not to copy:**
- Results blurred until he pays or invites friends.
- Weekly pricing or paying per scan.
- Ads that insult people's looks.
- Any "potential" about the person himself.
- Streak badges.
- Ranking him against other guys when his score is low (a percentile is fine only in his favor, if at all).

## On "I don't see a user using it"

Research can't settle that. Only people using it can. Two things will tell you more than any report:
- **Watch 3 beta friends do a check in person** and ask each one: "Did that score feel right?"
- **The 10 short talks** already on your list (Y12).

What research does say: a number that's nearly always 7 gives no reason to change anything or come back. That part is fixable, and steps 1–5 fix it.

**On the beta:** don't hold it. Friends forgive a rough first version, and what they say is the evidence you need. The new scoring goes in the next TestFlight build.

## Worth knowing (for interviews)

**Correlation and calibration are different things.** Correlation (r) asks whether the app puts outfits in the right order. Calibration asks whether the numbers mean the right thing: is a "7" really a 7? Kitted's problem is mostly calibration (the squeeze), with some ordering too (r 0.56).

Machine-learning systems hit the same split. A spam filter can rank emails well while its "90% sure" really means 60%. That's why teams fit a calibration curve after the model, the same idea as step 4. In an interview it often comes up as "how would you evaluate a model?", and naming both ordering and calibration is a strong answer.
