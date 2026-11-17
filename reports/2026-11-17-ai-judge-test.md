# Could a reasoning AI rate the fit directly? The AI-judge test

*Nov 17, 2026. Your question: what if a stronger model (Sonnet, or a Google Pro-tier model) rated the outfit straight from the photo and the rules, instead of the code? A test on paper, and nothing in the app changed. Claude's part cost $0 (subscription subagents). The Gemini Pro part has **not** run: it's paid, and waits for your yes to the quote below. DECISIONS-LOG #485. Cloud copy: none yet.*

## The answer in one paragraph

Yes, it's a little closer to your taste, but not by enough to hand it the score on its own. On your 164 blind ratings, a Claude Sonnet judge with one look per photo lands **within a point of you 83% of the time with r 0.67**. v16, the engine you just approved, gets **82% and r 0.63**. The judge also uses the scale more like you do. But **it isn't steady enough**: two looks at the same photo agree within half a point on only 91–95% of photos (v16: 97.8%, the bar). It also misses 4 of the creators' 18 anchors (v16 misses 1), and it can't say which rule capped the score. **The best number in the test came from a hybrid:** v16's score and the AI's, blended about 60/40, with the code's dealbreaker caps on top. That reached **86% within a point and r 0.68**, the best of any arm, with v16 refitted fairly on each half (see the table). It is just under your 0.69 bar, and it stays as steady as v16. My recommendation: **ship v16 as approved (T69), then test the hybrid as an add-on.** It needs your yes on the hard line, a new privacy line if the provider is Claude, and one small paid check (below).

## What was tested

- **The photos:** everything you rated blind that v16 scores. That's 164 photos: your first 20, plus 144 of your 150. The 6 whose heads were already under a mosaic were left out, because the app's prep would send nothing for them. Your 19 re-rates are in as the "consistent key". Mixed in were the 20 creator stills v16 is checked against: 18 anchors and the before/after pairs, Frugal's included. Only the face-hidden copies were used.
- **The judges never saw** your ratings, v16's scores or the rules' point values. Each run renamed every photo to a random 5-letter id and reshuffled the order into 5 batches of about 37. So every photo got new neighbours and a new position in each run.
- **The brief** (`extraction-test/ai_judge/BRIEF.md`) was written and committed before any run. It holds:
  - the 3–9.5 scale with its words (Needs a fix → Dialed in) and target shares;
  - silhouette and proportions first;
  - the creators' rules and v16's rules in plain words;
  - the dealbreakers as "lands in Needs a fix" or "Getting there at most";
  - occasion everyday, with the day given per photo (shorts = warm, as v16 does);
  - "judge the look it's going for".

  Each answer: the look, a reason of 40 words or fewer, then the score.
- **The Claude runs** (Sonnet 5.5 subagents, $0):
  - 3 full runs of 184 photos;
  - a pair test, with 30 pairs each shown A/B and then B/A;
  - the dealbreaker examples written out as sentences, 3 runs;
  - one Haiku 5.5 run, as the "today's price" model.
- **Scored against v16's own bars** by `extraction-test/ai_judge/score_runs.py`. Aggregate numbers only are in `extraction-test/results/ai-judge1/`. Per-photo data stays in `inputs/ai-judge/`, git-ignored.

## The numbers, side by side

**"Held out"** means tested on photos the method wasn't tuned on. v16's taste rules were fitted on your ratings, so its honest number comes from fitting on one half and testing on the other, 8 times. The AI was tuned on nothing of yours, so every photo is held out for it. The blends fit the AI's weight on half A and are tested on half B, over the same 8 splits. Inside each blend, v16's taste sizes are also refitted on half A only (`refit_blend.py`). That refit reproduces T68's own held-out v16 exactly (82.0%, r 0.63).

*Correction, Nov 17:* the first version blended the AI with the full-fit v16, whose sizes had seen all 164 of your ratings, so it showed the hybrid at 85.8% and r 0.69. Refitted fairly, it's 86.0% and r 0.68. That's the same agreement, just under the r bar rather than on it.

| | v16 (approved) | AI judge, 1 call | AI judge, median of 3 calls | Hybrid: blend + caps | Bar |
|---|---|---|---|---|---|
| **Within 1 point of you** (held out) | 82.0% | **82.8%** | 84.3% | **86.0%** | 80% |
| **r with you** (held out) | 0.63 | 0.67 | 0.68 | **0.68** (just under) | 0.69 |
| Same, on your consistent key (all 164) | 80.5%, r 0.62 | 81–86%, r 0.64–0.69 | 84.8%, r 0.68 | (not split) | |
| **Creators' before/after pairs** the right way | 6/6 | 6/6 (median); one run each 6, 5, 5 | 6/6 | caps hold v16's | 6/6 |
| **Creators' anchors** in their band | 17/18 | **14/18** | 14/18 | (v16's caps; see below) | 18 |
| **Dealbreaker examples** at their caps | all but one (pooling, a tip by your call) | 26/29 (written) | | **all** (the code applies them) | all |
| **Band shares**, worst gap to the target / to yours | 16.1 / 16.5 points | 15.5 / **11.0** | 13.0 / 9.1 | | 5 |
| **Steadiness:** two looks within ½ point | **97.8%** (218/223) | **91–95%** | | ~100% from the AI's side; v16's reading noise still applies | 97.8% |
| Order swapped (pairs shown A/B then B/A) | n/a | verdict flips on **4/30 (13%)** | | | |
| **Extra cost a check** (today's is 1.08¢; 2.16¢ from Jan 1) | 0 | Sonnet ≈ 0.7–1.5¢; Haiku ≈ 0.05¢; Gemini Pro ≈ 2.6¢ | ×3 | same as 1 call | |
| **Extra wait** | 0 | not measured (see below) | | | |

### What's in those numbers

- **The AI uses the scale more like you do.** Its spread is 1.08 points against your 1.17; v16's is 0.88. It puts 13% of your photos at 5–5.5 (you: 16%, v16: 7%). **Nobody gives 9 or above:** not the AI, not v16, while you gave 9+ to 8.5% of them. So the top of the scale is still unreached.
- **The AI and v16 agree with each other at r 0.73, but they're wrong in different places.** That's why the blend beats both. A pure shift or stretch of v16 alone, fitted the same way, gets 81.4% and r 0.65, so it gains nothing. The AI is adding real information.
- **Where the AI helps most:** your first 20 (97% within a point, r 0.84, against v16's 80%, 0.61) and the gold photos on sheet 1 (86%, 0.81 vs 89%, 0.76). **Where it doesn't:** sheet 2 and the 20 new photos. It's at or below v16 there (78%, r 0.52 and 79%, r 0.44 against 82%, 0.57 and 63%, 0.36). Most of those are everyday mirror and phone-style photos, which is closer to what the app will see. So the AI's edge is smallest on the photos that matter most. That's a reason to test before switching, not after.
- **Its misses on the creators' anchors are the same kind of thing every time:**
  - knit over knit (Tim's a02), scored 7.5 against the creator's 5;
  - tight beige monochrome (a03), 7.5 against 5;
  - Wanhee's purple cardigan under a black bomber (a25), 6 against 8;
  - the black suit (a59), 7 against 9 (v16 also only gets it to 7.5).

  v16 catches the first two because they're rules ("knit on knit", the slim leg). The AI read them as fine. **Rules the code can see beat an AI's eye on exactly those facts.** That's the case for keeping the code's rules in charge.
- **The written dealbreakers** (3 runs, each identical: 5/5/5, 6/6/6). The AI respected the sinks and holds, with three misses:
  - three brights at 5 instead of 4.5 or under;
  - a calmed red-and-blue outfit at exactly 6.5 instead of above it;
  - a blazer with gym shorts and a loud graphic at 5, under the 5.5 floor.

  In a hybrid the code applies the caps, so these stop mattering.
- **Steadiness, honestly:**
  - the AI gives the exact same score twice on only 44–50% of photos;
  - it's within half a point on 91–95%, within a point on 99–100%, and never 2 points apart;
  - v16 is within half a point on 97.8%, because the same reading gives the same score; its wobble comes only from the reading itself.

  The pair test is far steadier than the ZOZO study's GPT-4o: our judge changed its pick on 13% of swapped pairs, against their 57–74%. It also picked A 28 times out of 60, so there was no first-photo bias.
- **The hard lines held.** In 552 reasons, the body filter flagged 16, and I read all 16 by hand. Every one is about the clothes: "shoe weight", "tall boots", a sweatshirt's "loose body is on purpose", a top that "sits close to the body". None is about the person. Kit's copy would still need "fits close" rather than "close to the body". The look it named was the same across all 3 runs on 65% of photos.

## What each choice does to the things you care about

| | Keep the code (v16) | AI judge alone | Hybrid (v16 + AI ≈ 60/40, code's caps on top) |
|---|---|---|---|
| **The hard line** ("the AI sees, the code judges, the AI explains") | Kept | **Broken:** the AI judges | **Bent:** the code still judges and caps; the AI becomes one input to the number. Needs your yes, and specs.md and CLAUDE.md changed after it |
| **Same photo, same score** | Yes (same reading → same score; a same-photo re-check copies it) | Only because the score is stored. A retake of a near-identical photo moves ½ point about half the time | Stored like today. A retake moves about as often as v16 today (the AI's share adds ≤ ½ point on ~1 photo in 160 between runs) |
| **The fix line** ("which piece caps it") | From the rules: exact and steady | From the AI's words: usually right but not tied to a rule, and it can name a different piece on the next look | From the rules, as today |
| **Why's rows add up** | Yes | **No:** there are no parts, just a number | Yes, with one extra row, e.g. "Kit's eye −0.5: the shape reads plainer than the rules can see". It moved v16's score on 32% of your photos (36 down ½, 4 down 1, 13 up ½) |
| **Privacy** | Google Gemini, as today | Gemini Pro: same provider, but a preview model; check its terms. Claude: **a new provider**, so a new consent line and specs privacy text | Same as the AI judge's provider |
| **Cost a check** | 1.08¢ now, 2.16¢ from Jan 1 (+0.21¢ / 0.42¢ for v16's leg-width look) | The reading stays (the closet needs it), so the judge is extra | Same as the AI judge: one extra call |
| **The wait** | Today's | One more call; it can run beside the reading, so the extra wait is only how much longer it takes. Not measured | Same |

**Cost, worked out** (per check; list prices; the judge sees the brief of about 1,900 tokens, one photo of about 700 tokens, and writes about 100–150 tokens plus its thinking):

| Judge model | Price per million (in / out) | ≈ a check | Notes |
|---|---|---|---|
| Claude Sonnet 5.5 | $2 / $10 | ~0.7¢ with the brief cached, ~1.5¢ without | This is the model that was tested |
| Claude Haiku 5.5 | $0.10 / $0.50 | ~0.05¢ | Within today's price range, but **not good enough**: one run scored 74% within a point of you, r 0.42 (below even today's v15, 76% and 0.51). It misses 5 of 18 anchors, and the blend gives it zero weight on 6 of 8 splits |
| Gemini 3.1 Pro (preview) | $2 / $12 (thinking billed as output) | ~2.6¢ (estimate before the pilot) | Prices are from a partly truncated pricing page: **re-check before any run**. Preview only; no stable Pro model is listed |

## Your call: the Gemini Pro run (paid, not run)

The script is ready and dry-runs clean: `extraction-test/ai_judge/gemini_judge.py`. It reads the dev key without printing it, makes one photo per call as the app would, and stops before its budget. It does a 5-photo pilot first, then records the real tokens, cents and seconds.

- **Pilot:** 5 photos, about **13¢, capped at 20¢**. It gives the real token count, the real price per check, and the **seconds per check**, which is the wait number nobody has yet.
- **Then, only if the pilot looks sane:**
  - one full run of 184 photos, ≈ **$4.70**;
  - a 60-photo second run for steadiness, ≈ **$1.55**;
  - in all ≈ **$6.30**, cap $7.

  I'd only do this if you want Gemini Pro as the provider (no new privacy line). If Claude is fine, the cheaper useful check is the one below.

**The check I'd actually recommend next, if you want to pursue the hybrid** (also paid; nothing runs without your yes). Claude subagents judged about 37 photos in one conversation. The app would send one photo per call, and seeing neighbours can quietly calibrate a judge. So the real test is the **same brief through the Claude API, one photo per call: Sonnet on all 184 photos, once.** That's about $1.30, cap $2. Haiku is already ruled out. It also measures the seconds. Until that runs, **"one call per photo works as well as these batches" is not verified.**

## Ranked recommendation

1. **Ship v16 now (T69), then test the hybrid as an add-on (recommended).** v16 is already approved, steady and explainable, and the hybrid is built on top of v16's score, so nothing is lost by shipping first. The hybrid has the best agreement of any arm: 86% within a point, r 0.68, against v16's 82% and 0.63. It's just under your 0.69 bar on r, a gap inside the split-to-split noise (0.64–0.70). It keeps the caps, the fix line and Why adding up, and it's as steady as v16. Before it goes in the app it needs:
   - your yes on bending the hard line;
   - the one-photo-per-call API check above (≈ $1.30, cap $2);
   - a privacy line if the provider is Claude;
   - a "Kit's eye" row in Why.
2. **Keep the code only.** Free, steady, and it explains itself. You'd be choosing to give up about 4 points of within-a-point agreement and 0.06 of r. It's a fine answer if the extra ~1¢ a check, or a second AI provider, isn't worth it to you. There's no cheap way around that ~1¢: the model in today's price range (Haiku) judged worse than the code.
3. **The AI judge alone: no.** It's only a hair better than v16 on agreement (83% vs 82%), and it fails steadiness (91–95% vs 97.8%). It also misses facts the code catches (knit on knit, the tight beige), can't make Why add up, breaks the hard line outright, and costs more.

## What's real, what isn't

- **Reproducing:** the scripts read v16 through `V16_DIR`, a checkout of `claude/rescoring-v16-58d34b` at commit `51f658df` (PR #124), plus that worktree's git-ignored reading results. They run from main only once #124 is merged (details at the top of `extraction-test/ai_judge/BRIEF.md`).
- **Real:** every number above comes from the runs on disk (`inputs/ai-judge/out/`, scored by `score_runs.py`; aggregates in `extraction-test/results/ai-judge1/report-claude.txt`). v16's numbers come from the approved engine on the v16 branch.
- **Not verified:**
  - one-photo-per-call behaviour;
  - the API's seconds per check;
  - Gemini Pro's quality and price;
  - how a hybrid's Why row would read to you.
- **Caveats:**
  - v16's per-photo scores here use one reading per photo, so the hybrid's steadiness excludes v16's own reading noise (v16 alone: 97.8%).
  - One run-2 judge mislabeled 5 photo ids and caught and fixed them itself before finishing. In a one-photo-per-call app that mix-up can't happen.
  - The creators' stills carry small, unblurred bystanders in the background, as they did in the Oct 13 reading run.
- **Never sent:** your ratings, v16's scores, unblurred photos. Nothing was published; photos and ratings stay in `inputs/`.

## Something to take to an interview

- **Held out vs in-sample.** v16's taste rules were fitted on your 164 ratings. Scoring it on those same photos ("in-sample") flatters it, so the honest number fits on half and tests on the other half. Interviewers ask "how do you know your model isn't just memorizing?"; this is the answer.
- **Why the blend wins (ensembling).** Two scorers that are each about 82% right but wrong in *different* places (r 0.73 between them, not 1.0) average out each other's mistakes. It's the same reason random forests beat single trees. The check that a plain shift of v16 doesn't do as well is the "is it really the second model, or just a bias fix?" control. It's worth naming when you explain any ensemble.
- **Try it yourself:** run `KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 extraction-test/ai_judge/score_runs.py` and change the blend's weight grid in `score_runs.py` to see where the held-out number peaks.
