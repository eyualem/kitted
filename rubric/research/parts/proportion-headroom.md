# Proportion headroom: which facts are worth a measuring script?

*Oct 12, 2026. Paper test only: no AI calls, no money, nothing in the app or the engine changed. Script `extraction-test/headroom_test.py`, output `extraction-test/results/headroom1/` (`analysis.txt`, `analysis.json`, `moves.csv`).*

**The question.** Before building phone-side scripts that measure proportion (the next step in CLAUDE.md), find out which facts can actually change the score a man sees. A script that measures something perfectly is worth nothing if the rules never use that fact, or if the AI already gets it right.

**How.** On the 79 real saved photos (the same set as the agreement test: 22 of the founder's, 4 of his friends', 2 unknown, 12 web mirror selfies, 39 stock; 74 have a Proportions part), with today's engine (parts v7):
1. **One-step flip:** move each fact one step each way (at the belt ↔ mid fly, slim ↔ straight, slight ↔ full break, and so on) and count the photos whose **shown score** (rounded to the half) moves. This shows how *sensitive* the rules are to that fact. It isn't evidence the AI is wrong.
2. **Label swap:** where Claude's blind labels exist, put the label in place of the AI's answer and re-score. This shows what a *perfect* reader would change today.
3. **Disagreement:** how often the AI's answer falls outside the label.

The labels are one labeller's blind work (Claude subagents, Oct 8–10), not ground truth. **Rule 7:** the founder's profile is still pending, his friends' and the two unknowns' profiles are unknown, and the stock and web photos have no profile. Everything is scored with one stated test profile (picks Minimal + Smart casual, no age), each photo at its own occasion (everyday or class). Picks never change a number, so the results can't be split by age band or picked look.

---

## Which rules read each fact

| Fact | Rules that read it (and the values they care about) |
|---|---|
| **Top length** | Waist break +1.5, at the belt or cropped [PRO-4]; streetwear shape, up to mid fly [STR-5]; "roomier than the look" excused at the belt [PRO-11]; minimal's boxy top [MIN-2]; past the fly is a tip only [PRO-10] |
| **Tuck** | Waist break, full [PRO-4]; front tuck +0.5, half [PRO-5]; tailored line, full [PRO-7]; [PRO-11] excuse; streetwear shape needs untucked [STR-5]; untucked dress shirt −0.6 [CON-3] |
| **Outer layer length** | A tip only (a long loose layer over loose legs) [PRO-10]: **no points** |
| **Leg shape** | Skinny faults [PRO-2, PRO-3]; every shape credit needs straight or fuller [PRO-4, 6, 7]; slim vs full [PRO-11]; [STR-5]; [WRK-4]; chunky sneakers on slim legs −1.5 [SHO-9]; [STR-6]; [STY-3]; style detection |
| **Hem** | Only **pooling** costs: −1.5/−2.0 on Fit [FIT-4] and it blocks every shape credit [PRO-8, STR-12]; slight vs full break moves nothing (full break only feeds a tip and the slides fallback [SHO-2]); minimal's clean hem [MIN-2] |
| **Sleeve end** | Only **over the hands** costs: −0.5 to −2.0 on Fit [FIT-2] |
| **Roominess of the top** | Roomy (4+) over skinny [PRO-2]; roomier than the look −1.5 [PRO-11]; streetwear shape [STR-5]; a hoodie or knit earns the waist break only when roomy [PRO-4]; a size big [FIT-2]; a piece from another look −3.0 Style [STY-5] |
| **Roominess of the outer layer** | Roomy jacket over skinny [PRO-2]; [FIT-2]; style detection |
| **Shirt showing below the layer** (second look) | −0.5 and no jacket shape credit [PRO-9]. The app doesn't send the second look, so it never fires today |
| **Pant rests on the shoe** (second look) | Loose jeans dragging on slides −0.5 on Shoes [SHO-2], and only there |

---

## Results

| Fact | Photos with it | Shown score moves, one-step flip (either way) | of them his, friends', unknown | AI outside the label | Shown score moves, label swap |
|---|---|---|---|---|---|
| **Leg shape** | 77 | **20** (13 down when narrower, 8 up when wider) | 2 | 14/63 (22%) | 1 (of 14 swapped) |
| **Sleeve end, outer layer** | 33 | **20** (19 down when "over the hands") | 7 | 3/26 (12%) | 1 (of 3) |
| **Tuck** | 76 | **14** (8 down untucked, 6 up tucked) | 5 | 2/58 (3%) | 1 (of 2) |
| **Sleeve end, top** | 43 | **13** (all down, "over the hands") | 4 | 0/38 (0%) | 0 |
| **Hem** | 69 | **10** (9 down when heavier: all are the step to pooling) | 4 | 23/59 (39%) | 1 (of 23) |
| **Roominess of the top** | 76 | **9** (6 down, 3 up, all when roomier) | 3 | no labels | – |
| **Top length** | 53 | **8** (7 up when shorter) | 4 | 11/44 (25%) | 0 (of 11) |
| **Shirt showing below the layer** | 39 | **5** (all down) | 1 | 0/28 (the second look agrees with the labels) | 0 (of 2) |
| **Outer layer length** | 24 | 0 | 0 | 1/16 (6%) | 0 |
| **Pant rests on the shoe** | 57 | 0 | 0 | 13/53 (25%), the hem fallback | 0 (of 13) |
| **Roominess of the outer layer** | 36 | 0 | 0 | no labels | – |

Every move is ±0.5 or ±1.0. **Putting every label in at once moves 4 of 79 shown scores**: one unknown photo 7.5 → 7.0 (703a8b: AI says fully tucked, the label says untucked), one web photo 8.0 → 7.0 (m05: straight legs labelled slim lose the waist break), one stock photo 6.5 → 7.0 (s26: "pooling" labelled a full break), and **one of the founder's, 6.5 → 7.0** (f07193: the AI says the jacket sleeves cover his hands, the ruler label says they end at the wrist; the batch-1 label says "at the wrist, maybe over the hands").

### What the numbers mean in plain words
- **Where the AI is most often wrong, the rules don't care.** The hem is wrong 39% of the time, but almost always slight break vs full break (11 of the 23 are the founder's and 1 a friend's). That step moves no points, and since #221 a stack or full break on loose jeans must never cost. Top length is wrong 25% of the time, always "mid fly" where the label says "at the belt" (9 of 11 on the founder's photos), but those are hoodies the AI calls regular (roominess 3), and a hoodie only earns the waist break when it's roomy, so nothing moves. "Rests on the shoe" is wrong 25% of the time, but it only counts with slides.
- **Where the rules are most sensitive, the AI is mostly right.** Sleeves "over the hands" would cost points on 33 photos, but the AI says it on only 2 (the founder's f07193 jacket and stock p01, which has no sleeve label), and no label firmly says it. On f07193 the ruler label says the sleeves end at the wrist, and the batch-1 label leaves "over the hands" open, so it's a likely false alarm (−0.5). Tuck is sensitive (14 photos) but wrong on only 2 of 58. Pooling is sensitive (9 photos) and the AI says it twice, both wrong per the labels (one of them moves a score).
- **Leg shape is the one fact that is both sensitive and wrong at a line the rules use.** 8 of its 14 disagreements cross a line the rules use: 6 at slim vs straight-or-fuller and 2 at skinny vs slim. Today only one of them moves a shown score (3 move Proportions).
- **Roominess may be the hidden one.** Making a top one step roomier moves 9 scores (3 the founder's: two lose half a point for "roomier than the look", 0d39d6 gains the waist break, 6.5 → 7.0). There are no roominess labels, so nobody knows how often the AI is wrong. The style rules already note that it reads almost every hoodie as regular (KD-1).

---

## Conclusion: what a measuring script should target first

With today's rules, a better reader alone has little to change: a perfect labeller moves 4 of 79 shown scores, and only one of the founder's. So the first script should go where the rules are sensitive *and* the AI misses at a line the rules use. **(1) Leg shape at slim vs straight-or-fuller** (with skinny vs slim). It's the most sensitive fact (20 of 77 photos move under a one-step flip), it feeds five Proportions rules plus shoe weight, and the AI crosses that line wrongly on 8 of 63 labelled photos. The leg probe (#189) already found slim vs straight promising; it needs the gold set and the size ladder for truth. **(2) A "boxy, short top" measure: roominess of the top together with where it ends.** It's the only way the founder's hoodies (labelled at the belt, read as mid fly and regular) could ever earn the waist break. Top length's 11 misreads move nothing today because roominess gates them, and roominess has no labels at all. So the first step is labelling roominess on the gold set; the fit ruler's top length, already better on his photos (71% vs 43%, #170), is the starting point. **(3) Optional and cheap: veto-only guards** for the two fault values that cost the most per false alarm, "pooling" and "sleeves over the hands". The AI rarely says either, but when it's wrong it costs half a point (the founder's f07193, stock s26). A script there may only remove a fault, never add one. **Not worth a script under today's rules:** outer layer length, rests on the shoe and outer-layer roominess (no shown score moves under any change), tuck (the AI is already right 97% of the time), and the shirt peeking below a layer (5 sensitive photos, the second look already agrees with the labels, and the app doesn't send it). If the founder later lets the hem or top length cost points beyond today's rules, rerun this test: their headroom depends entirely on those rules.

*Limits:* 79 photos, 51 of them stock or web; one labeller; one test profile; the flips are "what if", not errors. Rerun with `/usr/bin/python3 extraction-test/headroom_test.py` once the gold set and its labels exist.
