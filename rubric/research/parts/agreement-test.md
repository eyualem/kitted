# Agreement test: trust a proportion fact only when independent readers agree

*Oct 11, 2026. Claude (subagent), for the founder's point "I think we have not put proportion into account". Paper test only: no API calls, no money, no app or engine changes. Script `extraction-test/agree_test.py`; numbers in `extraction-test/results/agree1/` (`analysis.txt`, `analysis.json`, `facts.json` = every reader's vote per photo and run, `phone_readers.json`).*

## Bottom line

1. **The idea doesn't work on today's readers. No proportion fact passes under "2 of 3 agree" or "all agree".** Agreement does push precision to 100% (heavy hem, long layer, rests on the shoe), but it cuts how often the fact fires by half or more, and it makes the fact *less* steady (76–84% the same over 3 runs, bar 90%). Each reader flips on different runs, so needing two of them multiplies the flips.
2. **The readers' problem is misses, not false alarms.** When the scoring call says "full break", it's right 30 of 30 times. It just says it on only 36% of heavy hems, and it flips between runs. A second reader that also misses can't fix a miss. On the cases that matter most, all three miss together: **the friend's blazer stack (d1967f) reads "not heavy" to the second look on 3 of 3 runs and to the phone.** The scoring call called it a full break on 2 of 3 batch 1 runs, but the reading the app actually stored says slight break.
3. **Two facts pass with a single reader, and agreement adds nothing to either:**
   - **"The fabric rests on the shoe"**, from the second look alone: right 97% of the time it fires (95% on firm labels), steady 92%, fires on 29 of 40 photos (20 of them his or his friends'). This repeats look1's result. One caveat: against the Oct 9 labels, which ask a slightly different question ("covers" vs "meets" the shoe), it's 77%.
   - **Heavy hem**, from the phone's hem probe alone, passes on the 38 photos it was measured on (94%, 92% steady). But its cut was fit on those photos, and on all 50 heavy/light-labelled photos it's 86%: it calls 3 light hems heavy. **Not trusted.**
4. **The bigger finding: even perfect facts would barely move Proportions under today's rules.** With Claude's blind labels in place of the readers (the "label ceiling"), Proportions moves on only 7 of 74 photos (exactly 7.0 goes from 57 to 54) and the shown score moves on 3. The rules that need these facts are narrow. A heavy hem only costs points under a blazer (RULEBOOK ruling 13 says stacked loose jeans cost 0). There is no labelled long top in the 50 photos at all. The long layers in the set are tailored, and tailored layers are exempt. And the peek costs −0.5 at most.
5. **What the judges dock on his photos is mostly the bunched hem on his wide jeans.** On his and his friends' photos, the app's Proportions runs **+0.72 above the judges' proportion score** (every one of them is a flat 7). The label ceiling closes that only to +0.55. A **what-if** rule closes it to **+0.10**: −1.0 for a heavy hem on loose jeans, with no tailoring and not on slides. It needs perfect facts to do that. On the scoring call's own hem reading, the gap is +0.53, the ranking gets worse (r −0.33) and steadiness drops (Proportions the same on 44/49 vs 48/49). So this is a taste call plus a reading problem, not a reading problem alone.
6. **Recommendation:** don't switch the second look on for scoring yet (+0.24¢ a check moves no shown score on 79 real photos). Turn on no new proportion rule. The score spread stays as it is. Two things would actually move it, in order: (a) the founder's call on whether a heavy hem on loose jeans should ever cost points (it overturns ruling 13; the sources are split); (b) the gold set's hem pairs, plus a tight hem-and-shoe crop test, to get a heavy-hem reading that finds more than half of them.

## Setup

**Photos:** the 50 batch 1 photos. Rule 7, as everywhere:
- 21 are the founder's (profile pending: no birth year or picked looks given yet).
- 4 are his friends' (profile unknown): the navy blazer d1967f and the chore coat e438d4 / f4870b / fb0b17.
- 2 are unknown: 703a8b and ebe23f. **Ask the founder who they are.**
- 23 are web and stock photos (profile unknown).

Everything is scored with one stated test profile (picks Minimal + Smart casual, 0.5 each; boldness "a little"; no age). Picks never move a number, so no split by age band or picked look is possible.

**The three readers:**
- **(a) The scoring call's own fields:** batch 1 arm A (the live prompt, 3 runs). For the corpus, the reading the app stored.
- **(b) The second look:** look1, U = the upper close-up, L = the lower close-up; 3 runs. For the corpus, the 2-of-3 majority.
- **(c) The phone, no AI:**
  - The fit ruler: the top stack's lower edge against the hip and knee joints, and the pant hem against the shoe.
  - For a heavy hem, the hem probe's "how much shoe shows below the hem" (`shoeVisToW` < 1.2, inside the probe's own leave-one-out range of 1.18–1.23).
  - The phone is deterministic, so its three "runs" are the base photo, the photo at 1600 px and a 3% crop.
  - I re-ran the ruler and the hem probe locally on the phone photos the Oct 9–10 runs didn't have (403ade, 703a8b, 8ad378, d1967f, e438d4, ebe23f and his Oct 11 af7e93). The runs are in `results/agree1/ruler2`, `hem2`, and they match the old runs exactly where both exist.

**Run i pairs up:** scoring call run i, second look run i and phone variant i.

**Labels:**
- `b1_labels.csv`: the top hem, the layer hem and the peek.
- `look_labels.csv`: "rests on the shoe".
- `hem_labels.csv`: heavy vs light.

All of them are one labeller's blind work (Claude subagents, Oct 9–10). A label like "hip|crotch" that falls on both sides of a fact counts as right (the house convention), and the firm-only precision is shown next to it.

**Bars:** ≥90% right when it fires; ≥90% steady in the grouping the rule uses (fires or not); fires on ≥3 photos.

## 1. Each fact, each reader, each rule

"Right" = the share of firing runs that the label backs (firm labels only in brackets). "Steady" = fires on all 3 runs or on none. "Fires on" = photos where 2 of 3 runs fire (in brackets: how many are his or his friends').

| Fact (labels yes · either · no) | (a) scoring call | (b) second look | (c) phone | 2 of 3 agree | All available agree (≥2) |
|---|---|---|---|---|---|
| **Top worn alone ends at the crotch or lower** (0 · 5 · 19) | never fires | 46% (0% firm), 83% steady, 5 photos | never fires | never fires | never fires |
| **Outer layer long** (4 · 10 · 10) | 100% (5/5), 88% steady, 3 photos (1); finds 1 of 4 | 81% (60% firm), 88% steady, 10 (4) | 25%, 1 photo | 100%, 88% steady, 3 (1): m10, ph3, s07 | 100%, 96% steady, **1** (s07) |
| **Under-top shows below** (5 · 5 · 40) | 75%, 0 photos | **86%** (83% firm), 100% steady, 7 (4); finds 5 of 5 | never fires | 100%, **0 photos** | 100%, **0 photos** |
| **Under-top clearly hangs below** (1 · 4 · 45) | 25% | 100%, 98% steady, 1 photo | never fires | never fires | never fires |
| **Heavy hem** (22 · 2 · 14) | **100%** (26/26), 74% steady, 10 (8); finds 36% | 76%, 76% steady, 11 (6) | 94%, 92% steady, 12 (9) **PASS on paper**; answers on 39% | 100%, 76% steady, 8 (7) | 100%, 79% steady, 4 (3) |
| **Fabric rests on the shoe** (21 · 7 · 12) | 100%, 70% steady, 10 (9); finds 38% | **97%** (95% firm), **92%** steady, **29 (20)**; finds 21 of 21. **PASS** | 70%, 7 (3) | 98%, 70% steady, 14 (11) | 100%, 75% steady, 8 (7) |

**The "no" side** (the fact is absent) is where the readers are good: "the top doesn't run long" is 100% right from (a), (c) and 2 of 3, and "no peek" is 100% from the second look. That only matters for rules that need a clean "no" to give a reward, and the existing rewards already work that way.

**On the wider labelled set** (every hem-labelled photo; (a) = zoom1 arm B where batch 1 has none):
- **Heavy hem, phone alone:** 86% (31/36). It fires on light hems in m05, p02 and s11. **Fails.**
- **Heavy hem, scoring call alone:** 94%, but 82% steady.
- **Rests on the shoe** against the Oct 9 "covers vs meets" labels: second look 77%, scoring call 75%, phone 48%.

**A rule that isn't agreement ("one says yes, none says no")** fires on more photos but brings wrong fires. Outside the labelled 50 it fired F3 (a long loose layer) on stock s16, which is a short denim jacket: the phone read the shirt tail under it as the layer's hem.

### Why agreement can't help here
- **(a) and (c) almost never fire on a peek or a long top.** "Agree" then means "only (b)", and (b) has no partner. The ruler's peek check needs two garment boxes; a hoodie over a tee comes back as one box, so the ruler abstains.
- **The phone answers on only about 40% of the photos** (dark-on-dark denim, hands in pockets, feet cut off). So "all available agree" usually means the two AI readers.
- **The AI readers share their blind spots.** Black-on-black hems, a stack on the back leg, his at-the-belt hoodies read as "mid fly": these are misses, and requiring agreement keeps every miss.

## 2. Rescoring the real corpus

The corpus is 79 photos: `parts1/corpus.json` plus the Oct 10 pull plus his Oct 11 check af7e93. **74 of them have a Proportions part.** The rescoring uses a scratch wrapper around parts v7 inside `agree_test.py`; `parts_proto.py` is unchanged.

**Rule sizes, from `proportions.md`:**
- **F1:** a heavy hem under a tailored jacket, −2.0.
- **F2:** a long top worn alone, −1.5 (−2.0 over a loose leg).
- **F3:** a long loose layer that isn't tailored, over a loose leg, −1.5.
- **F10:** a peek, −0.5 (the engine's existing size).
- **HB:** a heavy hem blocks the deliberate-shape rewards.
- **DRAG:** loose jeans dragging on slides, −0.5 in Shoes, fires only when "rests" is agreed.

| Set | Proportions exactly 7 | Proportions moves | Shown score moves | 8+ | Steady (within 0.5 · Proportions exact) | Panel gap, score (all · held-out within 0.5) | Proportions vs the judges' proportion (all · his photos) |
|---|---|---|---|---|---|---|---|
| **Today (the app: v7, no second look)** | **57/74 (77%)** | – | – | 6% | 49/49 · 48/49 | +0.02 · 26/29 | +0.36 · **+0.72** |
| v7 + second look alone (earlier paper tests) | 51/74 | 6 (all the −0.5 peek) | 0 | 6% | 49/49 · 48/49 | +0.02 · 26/29 | +0.31 · +0.62 |
| 2 of 3 agree, every rule | 57/74 | **0** | **0** | 6% | 49/49 · 46/49 | +0.02 · 26/29 | +0.36 · +0.72 |
| All agree, every rule | 57/74 | **0** | **0** | 6% | 49/49 · 47/49 | +0.02 · 26/29 | +0.36 · +0.72 |
| Each rule alone, all agree (F1, F2, F3, F10, HB, DRAG) | 57/74 | 0 each | 0 each | 6% | 49/49 | +0.02 | +0.36 |
| Passing readers only (heavy = hem probe, rests = second look) | 59/74 | 2 (m05 wrongly, s16) | 2 | 5% | 49/49 · 48/49 | +0.01 · 26/29 | +0.34 |
| **Label ceiling** (Claude's labels as the facts; the 50 only) | 54/74 | 7 | 3 | 5% | 49/49 · 48/49 | −0.01 · 26/29 | +0.24 · +0.55 |
| What-if: + heavy hem on loose jeans −1.0, label facts | 45/74 | 16 | 6 | 5% | 49/49 · 46/49 | −0.03 · 26/29 | +0.07 · **+0.10** |
| What-if: + heavy hem on loose jeans −1.0, scoring call's hem | 53/74 | 6 | 3 | 6% | 49/49 · **44/49** | 0.00 · 26/29 | +0.26 · +0.53 (r −0.33) |

**Spread of shown scores today** (79 photos): ≤5.5: 5 · 6–6.5: 13 · 7–7.5: 56 · 8: 5. No agreement set changes it.

**Every real check that moves under an agreement rule: none.** Under the label ceiling and the what-ifs (for reference only; these aren't proposed for shipping):
- **Friend, profile unknown:**
  - **d1967f (blazer over bunched jeans):** Proportions 7 → 5 and score 7.0 → 6.5 with label facts (F1). Under every reader rule it stays 7 / 7.0, because all three readers miss the stack.
- **The founder, profile pending:**
  - **a765e8, 7de605, 6b14db (a hoodie over a tee that shows):** Proportions 7 → 6.5 from the peek; the score holds at 5.5.
  - **The what-if heavy hem with label facts:**
    - Proportions 7 → 6 on 8bc29d, f07193 (score 6.5 → 6.0), d918c0 (7.5 → 7.0), 968016 (7.5 → 7.0), 403ade, 8ad378, b0f0c8, 5a9049 and 7f14a4.
    - With the scoring call's own hem instead of labels, it also takes his Oct 11 check af7e93 from 7.5 to 7.0.

**His friends' fits:**
- **The blazer (d1967f)** should drop toward the panel's 5.5. Under every reader rule it stays at 7.0; only perfect hem facts move it. Batch 1's three readings show the scoring call half-sees the stack (full break on 2 of 3 runs). The second look's "rests on the shoe" says yes on 3 of 3, and it says no on his clean-hemmed blazer photos ph3 and s07. That makes **"fabric rests on the shoe under a tailored jacket" the one candidate stand-in for F1.** It's right on 1 firm case plus 1 either-way case, far too few to pass, so it goes to the gold set's blazer stacked-vs-cuffed pair.
- **The chore coat (e438d4, f4870b, fb0b17)** stays at 7.0 everywhere, which is the right way (target 7–7.5). Its jeans are slim, so F3 (long layer over loose legs) can't apply, and its layer length is labelled "hip|crotch" either way.

## 3. What still can't be trusted, and what each fact needs

| Fact | Why not | What it needs |
|---|---|---|
| Top worn alone runs past the crotch | No firm long top among the 50 photos. Every reader is right on "no"; nothing can be tested on "yes" | Gold-set photos with long tees, long shirts and longline hoodies, each worn untucked and front-tucked |
| Outer layer long vs short | The scoring call is precise but answers on half the layers ("na") and finds 1 of 4; the second look's "long" is 60% on firm labels; the ruler measures the lowest edge of the stack, so a shirt tail under a jacket fools it | The gold set's long-coat vs short-jacket pair over wide trousers. The long layers here are tailored (exempt), so F3 has no test case yet |
| Under-top shows below | Only the second look sees it (86%, firm 83%), so there is no second reader to agree with. The ruler needs two boxes and a hoodie over a tee gives one | The gold set's "a little" vs "clearly" tee-under-overshirt pairs; a size for F11 (tee under a hoodie). The phone can't help without a two-layer box |
| Heavy hem (full break, stack, pool) | Every reader finds at most 46% of heavy hems and flips between runs. Black-on-black denim shows no folds. The hem probe's cut is fit in-sample and drops to 86% on all 50 | The size-ladder and gold-set hem pairs (the same jeans worn normally, cuffed, rolled and hitched); a tight high-resolution hem-and-shoe crop, or one "folds above the shoe?" question (look1's suggestion); then the founder's call on ruling 13 |
| Fabric rests on the shoe | Passes from the second look alone. Against labels written for a slightly different question it's 77% | Confirm on the gold set; then it can gate the slides drag and the clean-hem reward (R5) |

## 4. Recommendation

1. **The second look in the app (+0.24¢ a check, 0.57 → 0.81¢): not now.** On 79 real photos it moves the Proportions part on 6 (the −0.5 peek on his hoodie-over-tee checks) and the shown score on none. Its one passing fact ("rests on the shoe") only feeds the slides drag in Shoes (−0.5). The scoring call's own hem already sets that drag on his other slides photos; the second look adds it only on 1f1997 (Shoes 4.5 → 4.0, score unchanged). **It's your call;** Claude's default is off until the gold set gives it a rule that moves a score, most likely the stacked hem under a blazer.
2. **Rules to turn on: none.** No proportion fault passes under agreement. F1, F2, F3, F10 and HB stay tips (`v5-styles.md` [PRO-10], KD-8).
3. **The score spread doesn't change:** Proportions exactly 7 on 77% of photos; scores 71% at 7–7.5 and 6% at 8+.
4. **What would change it, in order:**
   - **(a) A taste call for the founder:** should a heavy or stacked hem on loose jeans (no blazer) ever cost points? Today it costs 0 (RULEBOOK ruling 13). The judges dock it, and that's most of his +0.72 Proportions gap. The sources are split (GQ allows gentle pooling, RMRS doesn't). Claude's default is no, until the gold set's hem pairs show raters dock it.
   - **(b) The gold set and the size ladder** (on the to-do list): the only way to get a heavy-hem reading that finds more than half the stacks and to test the rare facts (long tops, long loose layers, clear peeks).
   - **(c) Then re-run this script.** It re-reads everything from `results/` and `phone_readers.json`.

**Not changed:** `app/`, `parts_proto.py`, `rubric.py`, the fixtures, the live prompt.

## Files
- `extraction-test/agree_test.py`: `--collect` builds `phone_readers.json` from the ruler and hem-probe runs; the plain run writes the analysis.
- `extraction-test/results/agree1/`:
  - `analysis.txt` and `analysis.json`: every number above.
  - `facts.json`: every reader's vote per photo and run, plus the labels.
  - `phone_readers.json`.
  - `ruler2/` and `hem2/`: the local re-runs on the newer phone photos.
