# Casual and athletic fits: how Kitted should score what guys 18–22 actually wear

*Oct 17, 2026. Claude. A plan with its pass/fail checks written first, and a paper test of the candidate rules. No API calls, no money spent, nothing in the app or in `parts_proto.py` changed. Engine today: parts v13 (`extraction-test/rubrics/parts_proto.py`). The paper test: `extraction-test/casual_athletic_paper.py` (the candidate rules live there and are swapped in only for each score call), its output `extraction-test/results/casual-athletic/report.txt`. DECISIONS-LOG #331.*

**Rule 7.** The gold photos are "profile unknown", scored with one stated test profile (picks Minimal + Smart casual, 0.5 each; boldness "a little"; no age) at Everyday. The founder's saved phone checks are scored at their own occasion with no picks (his profile is still pending). The 20 test outfits are made-up readings with no person in them. Nothing here can be split by age band or picked look yet; the shoot in §6 is built to fix that.

## Bottom line

- **Today these fits aren't punished, they're flattened.** Any shorts fit skips Proportions, so a plain tee + gym shorts + Jordans and an oversized hoodie + gym shorts + Jordans both get **7.0**; the Jordans can't earn "the shoes match the clothes" because that credit needs a shoe dressier than a sneaker; running shoes or slides with gym shorts at Class are held to **5.5 "Needs a fix"**. Effort doesn't show in the number.
- **The gold set can't tell us what's right.** It has 1 photo with gym shorts, 0 tracksuits, and its 5 judges are AI personas. Even its "22-year-old peer" judge is *harsher* on shorts and sweats than the four stylists (−0.31 against them, vs −0.14 on everything else). The truth for this age group has to come from real guys rating real fits: the shoot in §6.
- **The recommended candidates (V2 in §5) separate deliberate from lazy by half a point and change nothing else.** An oversized hoodie over gym shorts with Jordans goes 7.0 → **7.5**; a plain tee with the same shorts stays **7.0**; an oversized graphic tee over wide jorts with chunky sneakers 7.0 → **7.5**; a matched grey sweatsuit with clean sneakers 6.5 → **7.0**; a roomy hoodie over short, fitted shorts 7.0 → **6.5**; running shoes with gym shorts at Class 5.5 → **6.0**. Slides, the jersey-and-gym-shorts kit, the interview and going-out holds stay where they are.
- **All checks pass:** 20/20 test outfits, the self-check (with the candidates off the engine is exactly v13 on all 449 conformance cases and every gold reading), and the gold guards: held-out r 0.49 → 0.48 (bar: no drop over 0.03), the founder's 20 blind ratings within 0.5: 13 → 14, both runs within 0.5 on every shorts and sweats photo (30/30), no photo outside shorts, sweats and track pieces moved, none of the 39 saved phone checks moved.
- **The reading test ran small (§7, 52¢ of your 75¢, #332):** a separate narrow look reads whether shorts end above the knee or at/below it (right 99%, steady 92%) and crew socks vs none (right 96%, steady 96%) on the 24 gold shorts photos; putting the same values into the scoring read failed (less steady, and it shook the other fields). Not proven: gym shorts (1 photo), low or tall socks, tracksuits (none in the set). Length and socks stay advice only until the shoot.
- **Round 2, your five answers (Oct 17, #333, §9): fit and context decide, not flat holds.** Running shoes with gym shorts at Class aren't held any more (5.5 → **6.5**, from the parts); short or tight shorts cost 1.0 on shape (a plain tee over them 7.0 → **6.5**); a full kit is held to **6.0** when it fits cleanly and **5.5** or lower when it doesn't; a matched sweatsuit in a relaxed shape with clean sneakers goes 6.5 → **7.5**, a slim one stays **7.0**. 36 of 37 test outfits pass; the miss (F5b) is an older streetwear rule, flagged in §9. Gold set and your 20: same as round 1. None of your saved checks moved.

## 1. What's true today (v13)

Each line is a made-up outfit from the paper test (`OUTFITS` in the script), scored by v13 at the occasion shown.

| | Outfit | v13 | Why |
|---|---|---|---|
| A1 | Plain white tee + black gym shorts + white Jordans, Class | **7.0** | Proportions skipped ([PRO-1]); every other part 7 |
| A2 | Oversized grey hoodie + the same shorts and Jordans, Class | **7.0** | Reads as streetwear (Style 7.5), but no shape credit exists for shorts |
| A4 | Plain tee + gym shorts + running shoes, Class | **5.5** | Running shoes aren't a "real shoe": no signs of intent, held to 5.5 ([LNG-2]); Shoes 5.0 ([SHO-3]) |
| A5 | Plain tee + gym shorts + slides, Class | **5.5** | Same hold; Shoes 5.0 |
| A6 | Oversized graphic tee + wide mid-wash jorts + chunky sneakers, Everyday | **7.0** | Same flattening as A2 |
| A11 | Grey hoodie + grey sweatpants (a set) + white leather sneakers, Everyday | **6.5** | One sign (the shoe), held to 6.5 |
| A13 | Navy track jacket + navy track pants + retro runners | **7.0** | Can't happen on a real check: the reading has no track pieces |
| A15 | Green jersey + gym shorts + Jordans, Everyday | **5.5** | "A full kit" counts no signs ([LNG-4]) |
| A19 | Oversized hoodie + gym shorts + Jordans, Going out | **6.5** | Too casual for going out |

Two engine facts behind the flattening:
- **[PRO-1]:** `_proportions` returns "not scored" for any shorts, so the heaviest part (30%) drops out and the rest are mostly 7.
- **[SHO-2]'s match credit (SD1)** needs a shoe at dressiness 2.5 or more. Basketball, chunky, canvas and retro sneakers are 2, so **Jordans never earn it anywhere**, with shorts or jeans. White leather sneakers (3) and low-profile sneakers (2.5) do.

## 2. Why the gold set can't settle this

- **Coverage:** 23 of 223 gold photos have shorts, 7 have sweats or joggers, **1 has gym shorts** (pin-038: logo tee + basketball shorts + runners; panel 5.0, app 5.0/5.5), none has a tracksuit, and none is a college student's everyday campus fit. Most shorts photos are Instagram creators in chino shorts and loafers.
- **The judges aren't this age group.** They're Claude fashion personas (`inputs/gold-judge/BRIEF.md`). The one meant as a young peer is *harder* on these fits: on the 32 shorts and sweats photos the peer judge sits 0.31 below the other four, against 0.14 below on the other 193. On pin-038 all five land 4.0–5.2 ("gym wear out of the house").
- **What young raters say, from the text we already have** (`inputs/rubric-research/tiktok-rated-fits.csv`, one creator's ratings, Oct 2026, not verified on photos): loose cargo shorts ending below the knee with white crew socks and skate sneakers 7.5–8/10; the same shape with a loud graphic or rhinestones 2–5/10. Brandon Balfour (YouTube) docks Nike crew socks and Air Force 1s under a polo and linen shorts ("almost there"). Small and second-hand, but it points the same way as the founder's hunch: the shape is fine, loudness and mismatched dressiness aren't.
- **So** the gold set is used here only as a guard (nothing else may get worse), never as the target. The target is the shoot (§6).

## 3. The pass/fail checks (written before the candidates ran)

| ID | Check | Result (V2) |
|---|---|---|
| P0 | With every candidate off, the engine equals v13 on all 449 conformance cases and every gold reading | PASS |
| A1 | Plain tee + gym shorts + Jordans stays Put together (7.0 or 7.5) | PASS 7.0 → 7.0 |
| A2 | Oversized hoodie version at least 0.5 above A1 | PASS 7.0 → 7.5 |
| A3 | Regular hoodie version equals A1 (a regular hoodie earns no shape, as with jeans, [STR-14]) | PASS 7.0 → 7.0 |
| A4 | Tee + gym shorts + running shoes at Class held to the candidate hold (6.0) | PASS 5.5 → 6.0 |
| A5 | Tee + gym shorts + slides at Class stays 5.5 | PASS 5.5 → 5.5 |
| A6 | Oversized graphic tee + wide jorts + chunky sneakers up at least 0.5 | PASS 7.0 → 7.5 |
| A7 | Plain tee + relaxed jorts + canvas sneakers stays Put together, no shape credit | PASS 7.0 → 7.0 |
| A8 | Boxy tee ending at the belt + wide khaki shorts + white leather sneakers up at least 0.5 | PASS 7.5 → 8.0 |
| A9 | Bomber over a tee + wide shorts + chunky sneakers not down | PASS 7.0 → 7.5 |
| A10 | Polo + straight chino shorts + white leather sneakers within 0.5 | PASS 7.5 → 7.5 |
| A11 | Matched grey sweatsuit + white leather sneakers up at least 0.5 | PASS 6.5 → 7.0 |
| A12 | Grey hoodie + black sweats + slides (his own Oct 8 outfit, made up here) stays 5.5 | PASS 5.5 → 5.5 |
| A13 | Matched navy tracksuit + retro runners reads as a look, 7.5+ *(future: track pieces)* | PASS 7.0 → 7.5 |
| A14 | Tracksuit + running shoes stays 7.0 or less *(future)* | PASS 7.0 → 7.0 |
| A15 | Jersey + gym shorts + Jordans (full kit) stays 5.5 | PASS 5.5 → 5.5 |
| A16 | Tank + gym shorts + runners at the Gym stays 7.0+ | PASS 7.0 → 7.0 |
| A17 | Oversized hoodie + short, fitted shorts + Jordans at least 1.0 below A2 | PASS 7.0 → 6.5 (A2 7.5) |
| A18 | Tee + gym shorts + Jordans at an Interview unchanged, held to 4.0 | PASS 4.0 → 4.0 |
| A19 | Oversized hoodie + gym shorts + Jordans going out stays 7.0 or less | PASS 6.5 → 6.5 |
| A20 | Control, tee + wide black jeans + Jordans: unchanged | PASS 7.0 → 7.0 |
| G1 | No gold photo outside shorts, sweats and track pieces moves | PASS (26 moved, all inside) |
| G2 | Held-out gold r doesn't drop by more than 0.03 | PASS 0.49 → 0.48 |
| G3 | The founder's 20 blind ratings: within 0.5 doesn't drop | PASS 13 → 14 (r 0.46 → 0.49) |
| G4 | Both runs within 0.5 on the shorts and sweats photos doesn't drop | PASS 30/30 → 30/30 |
| G5 | Report every saved phone check that moves | 0 of 39 moved |

*Round 2 (#333, your answers): A4's bar became "not held, 6.5" and A15's "a clean kit, 6.0"; both pass under V7. 17 new checks (F1a–F5b) were set before the run: 16 pass, F5b fails (§9). Full output: `extraction-test/results/casual-athletic/report.txt`.*

## 4. The candidate rules

Each reads only fields the live reading already has (except CA5, marked). Proposed IDs for `rubric/v5-styles.md` in brackets; nothing is in the engine or the doc yet.

**CA1, the shorts shape [PRO-1 changes, new PRO-15].** Shorts get a Proportions part, judged like pants: it starts at 7.
- **+1.0, the shorts shape:** a roomy top (roominess 4 or 5) worn on its own, untucked, over loose shorts (relaxed or wide, or roominess 4+). The streetwear and hooper shape: a big tee or hoodie over long loose shorts.
- **+1.0, a short jacket over loose shorts:** a bomber, denim, leather or track jacket, or any non-tailored layer read as ending at the belt.
- One shape credit, the larger. Either needs real shoes **in the photo** (not slides; running shoes only at the gym or home).
- **−1.5, a roomy top over short, fitted shorts** (slim or skinny, or roominess 2 or less), not under a jacket: the band fault's price ([PRO-11]).
- **Why +1.0, not pants' +1.5:** shorts already cut the leg line; the gold's two bomber-over-shorts photos (panel 7.5) land at 7.5 with +1.0.
- **Readings:** shorts' roominess 4+ held on 23 of 24 gold photos across two runs, loose or not on 22 of 24, the subcategory on 24 of 24; the top's roominess 4+ on 23 of 23. Two runs only; a 3-run check comes with the shoot.
- **Dropped after the first draft (V1):** "a tucked or short top over loose shorts gives it a waist". On the gold set it fired mostly on lazy fits (a pink graphic tee read as ending at the belt over denim shorts, panel 5.0, went 7.0 → 7.5) and cut the held-out r to 0.45.

**CA2, a sport sneaker matches athletic bottoms and shorts [SHO-14].** Under gym shorts, sweatpants, joggers, track pants or shorts, a basketball, chunky, retro, canvas, low-profile or white leather sneaker counts as the real shoe for "the shoes match how dressed-up the clothes are" (+0.5 on Shoes). Running shoes and slides don't. *Why:* with athletic clothes a clean sneaker is the matching shoe; today the credit can't fire on the most common shoe this age group wears. Jeans with Jordans aren't touched here (that's a separate question for the gold set).

**CA3, running shoes with gym shorts at Everyday and Class [LNG-8].** *Round 2 (your answer 1):* **not held at all**; the parts decide. A plain tee + gym shorts + runners lands at **6.5 "Getting there"** (Shoes 5.0 for the runners, [SHO-3]); at the Gym 7.0; going out 6.0 or less. Slides keep their 5.5 hold (not in your answer; ask if you want them treated the same). *Round 1 had it held to 6.0.*

**CA5, a matched tracksuit [VSP-9].** A track jacket and track pants in the same colour family: +0.5 on Style, "a matched tracksuit, worn as one set". It already reads as vintage sport and isn't held as loungewear with a real shoe. **Future:** the reading can't name `track_jacket` or `track_pants` yet (they're in §7's test). With running shoes it stays held to 7.0.

**CA6, a matched sweatsuit [LNG-9].** A hoodie or sweatshirt with sweatpants or joggers in the same colour family counts as the "dressed upper half" sign in the loungewear ladder: a set chosen on purpose. With a real shoe that's two signs (held to 7.5, or 8.0 when it reads as a style) instead of one. Mismatched sweats with slides (his own Oct 8 checks) don't change: 5.5.

**CA6b, the sweatsuit's shape (round 2, your answer 4).** A matched set earns **+1.0 on Proportions** when the shape is relaxed (a roomy hoodie, or a regular one over relaxed or wide sweats; never slim or skinny), the sneaker is clean (basketball, chunky, retro, canvas, low-profile or white leather) and nothing on Proportions is already off. Roomy or regular hoodie over relaxed sweats with white leather sneakers: 6.5 → **7.5**; over slim joggers: **7.0**; over skinny joggers: **6.5** or less (today's skinny charge); with slides: no credit, **6.5** or less. Sweats are otherwise still kept out of the shape credits ([PRO-8]).

**CA1b, undersized shorts (round 2, your answer 2).** Short, tight shorts (read slim or skinny, or at roominess 2 or less, and not loose) cost **1.0 on Proportions**, under any top; a roomy top over them keeps the bigger −1.5. Shorts that clearly pull cost the same 1.0 on Proportions, on top of Fit's charge for the pull: without it, the new Proportions part diluted the Fit charge and pulling shorts went *up* (6.5 → 7.0, check F2c). That's the one fact charged in two parts; it's deliberate and only for shorts. Length (high on the thigh) isn't in the reading, so "too short" can only show through roominess for now.

**CA7k, the kit follows fit (round 2, your answer 3).** A jersey with gym shorts out of the house (not at a dressy occasion) is held to **6.0**, minus half of whatever Fit or Proportions lost: a clean kit **6.0** (today 5.5), a kit in tight shorts **5.5**, a kit that pulls lower. At the Gym, no hold.

**Kept as they are:** the interview and event holds (4.0), going out in gym shorts (6.5 to 7.0), slides with anything out of the house. *(The full kit moved to CA7k in round 2.)*

## 5. Before and after

**The variants tried** (held-out r · all r · shorts and sweats r · within 0.5 on shorts and sweats · the founder's 20 within 0.5):

| | Held-out | All | Shorts/sweats | Within 0.5 | Founder's 20 | Test outfits |
|---|---|---|---|---|---|---|
| v13 today | 0.49 | 0.58 | 0.42 | 18/30 | 13/20 | (the "before") |
| V1 first draft (with the waist credit) | 0.45 | 0.56 | 0.29 | 17/30 | 14/20 | 20/20 |
| **V2 no waist credit, shoes in view (round 1's pick)** | **0.48** | **0.57** | **0.37** | **17/30** | **14/20** | **20/20** |
| V3 = V2, Proportions only when a credit or fault fires | 0.49 | 0.58 | 0.44 | 18/30 | 13/20 | 19/20 (A3: a regular hoodie lands 7.5 like the oversized one; raw 7.25 rounds up) |
| V2 without CA3, without CA2, or without CA1 | 0.48 / 0.48 / 0.49 | | | | | |
| **V7 your answers (round 2, now recommended)** | **0.48** | **0.57** | **0.37** | **17/30** | **14/20** | **36/37** (F5b, §9) |
| V7 without one answer each (fitted shorts; runners back at 6.0; kit flat 5.5; no sweatsuit shape) | 0.48 each | | | | | |

**Why V2 over V3:** V3 is neutral on the gold set because the plain fits keep Proportions out, but then the oversized and the regular hoodie both round to 7.5, so the shape you picked doesn't show; V2 keeps that half point (7.5 vs 7.0). V2's cost is on the gold set's lazy shorts fits: with Proportions back at 7, a weak outfit is pulled toward 7 the way a pants outfit already is (a purple pocket tee + wide shorts + slides 6.0 → 6.5, panel 5.5 but **you rated it 7.0**; layered shirts + jorts + runners 5.5 → 6.0, panel 4.5), and a fitted pair of shorts loses its edge (burgundy tee + slim cream shorts + low-profile sneakers 7.5 → 7.0, panel 7.5). The panel isn't the target for these fits (§2), so V2 is the default and V3 the cautious option.

**The gold photos that moved (V2, two runs each):** the bomber-over-wide-shorts pair ig-005 and ig-066 7.0 → **7.5** (panel 7.5 both); ig-065 6.0 → 6.5 (panel 5.5, founder 7.0); pin-038 gym shorts + runners 5.0/5.5 → 5.5/6.0 (panel 5.0); pin-059 5.5 → 6.0 (panel 4.5); ig-063 7.5/7.0 → 7.0/7.0 (panel 7.5); rd-005 7.5 → 7.0 (panel 7.5); pin-034 (yellow tee + shorts + dress shoes) 7.0/7.5 → 7.0/7.0 (panel 5.5). The other 18 moved only their raw score. Toward the panel: 3 of the 8 (ig-005, ig-066, pin-034); away from it: 5 (one of them, ig-065, toward your own rating). The 8+ share is unchanged (36 photos). Full table: `results/casual-athletic/report.txt`.

**The founder's saved checks:** 39 checks across every phone pull; 3 have sweats (grey or charcoal hoodie, black sweatpants, slides): **5.5 before and after**. None has shorts, so the shoot is also the first real test of these rules on him.

## 6. The shoot: 20 real athletic and casual fits (you and 2–3 friends, ~40 min)

**Why:** this is the truth the gold set lacks: real guys 18–22, real campus fits, rated by people their age.

**How to shoot each fit:**
- One **propped** full-body photo with the shins and socks in view (phone on the floor or a chair, 2–3 m away), plus a mirror selfie for half of them.
- Into `inputs/gold-set/athletic/`, named by fit number and person code (`a04-k.jpg`).
- Faces are hidden by the app's copy; these stay on the Mac.

**For each person (rule 7), in `inputs/gold-set/athletic/profiles.csv`:** a code, birth year (the age band comes from it), the 3 looks he'd pick in onboarding in order, height, build and fit if he wants, and his OK to use the photos internally.

**For each fit, in `inputs/gold-set/athletic/ratings.csv`, before anyone sees the app's score:**
- **Your blind rating** (1–10 by halves) and one line why.
- **A second rater's** blind rating, ideally a friend 18–22 who isn't into fashion. That's what separates your taste from the age group's.
- The occasion it's for (Class unless the list says otherwise), and the wearer's own answer to "would you wear this to class?" (yes / no).

**The 20 fits** (pairs change one thing, so the ratings show what matters):

| # | Fit | What it isolates |
|---|---|---|
| 1 | Plain tee + gym shorts + running shoes | The campus default (CA3) |
| 2 | Same + Jordans or other basketball sneakers | Runners vs Jordans (CA2) |
| 3 | Same + slides | Slides vs sneakers |
| 4 | Oversized hoodie + gym shorts + Jordans + white crew socks | The deliberate shape (CA1) |
| 5 | Same hoodie, same shoes, no-show socks | Socks (§7) |
| 6 | Regular-fit hoodie + gym shorts + Jordans | Roomy vs regular top |
| 7 | Oversized graphic tee + baggy jorts ending below the knee + crew socks + chunky or skate sneakers | Long jorts as a look |
| 8 | Same tee + shorts ending above the knee + same sneakers | Shorts length (§7) |
| 9 | Basketball jersey + gym shorts + Jordans | The full kit ([LNG-4]) |
| 10 | Same jersey over a white tee + baggy jeans + Jordans | A jersey as the one sport piece |
| 11 | Matching grey sweatsuit (hoodie + sweatpants) + clean sneakers | The sweatsuit (CA6) |
| 12 | Hoodie + sweatpants that don't match + slides | The lazy version |
| 13 | Matching tracksuit + retro sneakers (Sambas-type) | Tracksuits (CA5) |
| 14 | Track jacket + jeans + retro sneakers | The track jacket as a layer |
| 15 | Quarter-zip or crewneck + gym shorts + running shoes | Gym to class |
| 16 | Tank + gym shorts + runners, at the Gym | Control (should be fine) |
| 17 | Short jacket (bomber or zip) over a tee + loose shorts + sneakers | A layer over shorts |
| 18 | Polo + chino shorts above the knee + white leather sneakers | Classic control |
| 19 | Fit 7 again, for Going out | The occasion hold |
| 20 | Hoodie + compression tights under gym shorts + runners | A common gym fit the reading may misname |

**Then (Claude, free, no API):** the 5 AI judges rate the same 20 blind, so we see exactly where the personas and the age group disagree. The photos' readings come from §7's test.

**Pass bars for adopting the rules (set now):** on the 20, the candidate engine must agree with the human average better than v13 does (more within 0.5, and r not lower); fits 4 and 7 must score above fits 1 and 6; and no fit may move by more than 1.0 against both human raters. If your ratings and the second rater's differ by more than 1.0 on 5+ fits, the rules wait for more raters.

## 7. The reading test: shorts length, socks and track pieces (ran Oct 17 at 52¢, #332)

**What ran.** You OK'd it at a smaller budget ("about $0.75"), so it was cut to fit a hard stop at 75¢, counted from every call's real token usage. Only photos already on the Mac: the **24 gold-set photos whose reading has shorts** (public screenshots, profile unknown; your saved checks have no shorts). No shoot photos and no new screenshots. Script `extraction-test/shorts_read.py`, labels `extraction-test/shorts1_labels.csv`, report `extraction-test/results/shorts1/report.md`.
- **Truth:** Claude labelled all 24 from the close-ups before any answer existed: length 9 above the knee, 9 at it, 6 below it; socks 17 crew, 5 none showing, 1 low, 1 out of frame.
- **Arm C, a separate narrow look** (the lower close-up the read already sends, two questions), 3 runs: 72 calls, **7.7¢**.
- **Arm B, the scoring read with the new values** (`shorts_end`, `socks`, `track_jacket`, `track_pants`), 3 runs: 72 calls, **44.1¢**.
- **Arm A, the control:** the gold set's own two runs of the same read (Oct 12, same model, prompt and images), no new calls.
- **Spend: 51.9¢ of the 75¢ cap.**

**Results (bars from #198, set before the run):**

| | Steady on 3 runs (≥ 90%) | Right when it answers (≥ 85%) | Can't see (≤ 30%) | Passes |
|---|---|---|---|---|
| **C** length: above the knee vs at or below | 22/24 (92%) | 68/69 (99%) | 4% | **yes** |
| **C** socks: crew vs low or none | 23/24 (96%) | 66/69 (96%) | 4% | **yes** |
| B length | 18/24 (75%) | 65/70 (93%) | 3% | no (steady) |
| B socks | 21/24 (88%) | 62/66 (94%) | 8% | no (steady) |

- **Harmless? No:** inside the scoring read the new values shook the old ones a little. Scores within 0.5 between two runs: A 22/22, B 21/22; old fields the same between runs: A 93.8%, B 91.6% (bar: no more than 2 points lower). The one big jump was the gym-shorts photo (pin-038, 5.0 → 7.0 on one run, its running shoes read once as retro runners), the shoe-type wobble already known.
- **So, as in #199:** length and socks belong in a separate narrow look, never in the scoring read. In the app that's one extra call of ~0.11¢ (~1 s) on checks whose reading has shorts, or two questions added to the second look (untested: adding questions there could shake its own answers, the same lesson).
- **Only the two-way length is readable.** "At the knee" vs "below it" isn't: the narrow look called 7 of the 9 knee-length pairs "below the knee" (exact 3-way right 68%). That's enough for CA7's chino-shorts tip ("ending just above the knee" vs not); a rule needing "exactly at the knee" isn't possible.

**What this small test can't prove:**
- **Gym shorts:** only 1 of the 24 photos (pin-038). Shiny, loose basketball shorts may read differently from chino shorts and jorts.
- **Socks beyond crew vs none:** 1 low sock and no tall ones, so "low vs none" and "tall" are untested.
- **Track pieces:** none of the 24 has one. The read named no track piece on any of its 72 calls (no false alarms), but whether it names a real tracksuit right is unknown.
- **Mirror selfies and his own camera:** these are creator and Pinterest photos, mostly shot by someone else. One labeller (Claude), not you, and 24 photos.
- **Next:** the shoot (§6) fills every gap above; re-run arm C on its 20 photos (~2.5¢) when it exists.

## 8. Rules waiting on those readings (on paper only)

- **Length (CA7, tip first):** below-knee loose shorts in an outfit that reads as streetwear, vintage sport or no style, with sneakers, are part of the shorts shape (no charge). Chino shorts ending at or below the knee in a polo-and-loafers outfit (classic prep, smart casual) get a tip: "chino shorts look sharpest ending just above the knee" (5 sources for chino shorts above the knee, `rubric/research/notes/v5-fit.md`; jorts past the knee on purpose in the blokecore and streetwear summaries). Points only if the shoot's raters dock it.
  - *Test outfits:* oversized tee + wide jorts `below_knee` + chunky sneakers: no change from today; navy polo + khaki shorts `below_knee` + loafers: the tip, same score.
- **Socks (CA8, advice only):** never a point either way by default. Crew socks with gym shorts and basketball sneakers can be named as finishing the look in the chat; crew athletic socks under a smart top (polo, oxford) get a tip ("plain or no-show socks keep a smart top clean").
  - *Test outfits:* oversized hoodie + gym shorts + Jordans + `crew`: same score as `low`; polo + chino shorts + white leather sneakers + `crew`: the tip, same score.

## 9. Your calls: answered Oct 17 (round 2, #333)

**Your direction:** "fit and context should decide these scores, not flat holds." Your words, then what changed (on paper; nothing in the app):

| # | You said | What the plan does now | Test outfits (all set before the run) |
|---|---|---|---|
| 1 | "why is it a 5.5. it seems a bit too low… i think this is contextual" | The 5.5 was the loungewear hold, not fit: a plain tee isn't a "dressed upper half" and running shoes aren't a "real shoe", so it was capped however it fit. Now gym shorts with running shoes aren't held at Everyday or Class; the parts decide (**6.5**, the runners still cost on Shoes). Gym 7.0, going out 6.0. | A4, F1a–F1c pass; F1d (slides) keeps 5.5 |
| 2 | "it depends on the fit of the shorts. if the shorts are undersized, then it deserves a lower score" | Short or tight shorts cost 1.0 on shape (CA1b); a roomy shape over loose shorts keeps its +1.0. Plain tee over tight shorts **6.5** vs **7.0** over loose ones; shorts that pull **6.0**. | F2a–F2c, A2, A17 pass |
| 3 | "if it a person just wearing a full on soccer kit to go to school… lower score" | A kit is held to 6.0 minus half of what Fit or Proportions lost (CA7k): clean **6.0**, tight shorts **5.5**. Gym: no hold. | A15, F3a–F3c pass |
| 4 | "if the fit is nice, then even higher than that, if not, then lower or at 7 depending on the silhouette" | A matched set in a relaxed shape with clean sneakers earns +1.0 on shape (CA6b): **7.5**; slim joggers **7.0**; skinny **6.5**; with slides **6.5**. | F4a–F4e pass |
| 5 | "if the colors look good then i think it is good" | No new rule: long jorts never cost for their length, and their colors already count through Color. Sock color isn't read, so socks stay advice only. | F5a passes; **F5b fails** (below) |

**The one miss, F5b (answer 5):** an oversized red tee over wide purple jorts with chunky sneakers scores **7.5**, the same as the black version. In streetwear today's engine halves the "two bright colors fighting" charge ([COL-2], [STR-8]: −1.0 instead of −2.0, from the style research: loud mixes are part of the look), so Color drops only to 6 and the shape credit covers it. Changing that touches every streetwear outfit, not just shorts, so it isn't done here. **Your call (new):** keep it (default), or make two clashing brights cost the full −2.0 in streetwear too.

**What needs a new reading or your OK:**
- **Sock color** (answer 5): the narrow look (§7) reads sock height only. Adding sock color to it is about 2.5¢ to test on the 24 photos, and only worth it if crew socks should ever count through Color. Default: not yet.
- **"Too short"** (answer 2): high-on-the-thigh shorts aren't read; the narrow look tells above the knee from at or below it, not how far above. For now only "tight" (roominess) shows.
- **Slides with gym shorts** (answer 1 named runners only): still held to 5.5. Say if slides should be treated the same.
- **Sweats with running shoes** (your direction, not asked): joggers + a plain tee + runners at Class are still held to 5.5 by the same ladder. Default: leave until the shoot.

**On the gold set** round 2 changes nothing you'd see: held-out r 0.48 (round 1 0.48, today 0.49), your 20 within 0.5 14 (today 13), steadiness 30/30. The undersized charge fires on 2 gold photos (pin-035, panel 5.5; rd-005, panel 7.5) without moving their rounded scores; no gold photo has a kit, a matched sweatsuit or gym shorts with clean sneakers. **None of your 39 saved checks moved.** So the shoot (§6) is still what tells whether these numbers match how guys your age see the fits.

## 10. Order of work

1. You: the shoot and the ratings (§6). (The reading test ran small on Oct 17, §7.)
2. Claude: label the shoot's photos blind, re-run §7's arm C on them (~2.5¢), and the 5 judges on the 20.
3. Claude: the candidates against the shoot's ratings (§6's bars); report the before and after to you.
4. On your go: port to `parts_proto.py` as v14 and to `@kitted/core` with parity, write the rules and their conformance cases into `rubric/v5-styles.md` and `rules_conformance.py`, and the card's lines into `en.ts`.

## How to re-run

From `extraction-test/` (in a worktree, point it at the main checkout's git-ignored data):

```bash
KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 casual_athletic_paper.py
```

The candidates are the `CAND` dict and the `VARIANTS` in the script; `CAND_OFF` is v13 exactly (check P0).
