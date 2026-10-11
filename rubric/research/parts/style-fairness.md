# Parts engine: the style fairness pass (Oct 11, 2026)

> **Update (Oct 11, DECISIONS-LOG #NEXT): adopted.** v4 is now the parts engine's default (outdoor kept at +0.5), ported to `@kitted/core` with parity, and the picks proposal is built: a fix toward his earliest pick wins ties, and his first pick's path to 8 is the Next level line when there's nothing to fix. One change on the way: H2 ("clearly X top to toe") read the pick-chosen label, so a pick could add points (5 of 25,048 reading × pick runs); v4 judges H2 on the label with no picks. The workwear "swap to boots" line was dropped because v4's own boots fix already shows it with a number (+1.0 on a chore coat over sneakers).

*Claude (subagent). The founder (Oct 11): "I want the scoring to be very good, regardless of the style, and also based on the style that the user picks." No API calls, no money. Nothing in the app, `rubric.py`, the prompt or the fixtures changed.*

**Files:**
- Engine: `extraction-test/rubrics/parts_proto.py`, new **`engine="v4"`, opt-in**. **v3 stays the default.** The TS port's parity and the new fix engine (#208) are both built on v3, so I checked v1, v2 and v3 against the committed file: identical on all 15,705 results (1,047 readings × 5 occasions × 3 engines).
- Test: `extraction-test/parts4_test.py` (`/usr/bin/python3 parts4_test.py`, run from `extraction-test/`).
- Numbers: `extraction-test/results/parts4/analysis.txt` and `analysis.json`.

**Who is in the photos (rule 7):**
- The founder: profile pending (no birth year or picked looks yet).
- His friends: profile unknown.
- 703a8b and ebe23f: unknown. **Please tell me who they are.**
- Web and stock photos: profile unknown.
- The style council's outfits (`style-council/cases.json`): made-up readings with no person in them. Each one is scored with the picks and boldness written in the case.

All real photos were scored with **one test profile**: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. No engine lets age or picks change a number, so I can't split results by age band or picked look. Section 4 shows what the picks *do* change.

## The short version
1. **The audit.** I scored the council's 57 rated outfits by style:
   - Before this pass, three of the seven styles couldn't reach 8 at all: **workwear (best 7.5), outdoor (7.0) and minimal (7.0)**.
   - Vintage sport reached 8 only through streetwear's boxy shape.
   - The other three get there with a tuck, a short jacket or a tailored line.
   - Every style lands a plain fit at about 7, as it should.
   - Every style over-scores its mistakes by about a point, for the same reason in each: the "top runs long" reading failed its steadiness test (batch 1 `hem_at`: 74%), so it can only give a tip, and a clean outfit can't drop below 5.0 at Everyday.
2. **The changes (v4, opt-in).** One new reward per missing style, each built from its defining silhouette in the notes and sized by how strong the evidence is:
   - **"The workwear shape"** (+1.0 Proportions): a chore coat over straight-or-fuller jeans or cargos, with boots, in an outfit that reads as workwear.
   - **"The outdoor shape"** (+0.5): a fleece or shell over a full leg, with trail shoes.
   - **The track jacket counts as a short jacket**, like a bomber.
3. **The results:**
   - **Workwear now has its path:** the chore coat + jeans + boots outfit goes **7.0 → 8.0**, and the full chore coat + flannel + boots outfit goes 7.5 → 8.0.
   - **Your friend's chore coat over low-profile sneakers stays 7.0** (with boots, the same reading would be 8.0).
   - **No real photo moves**: 0 of 78 photos, 0 of 49 steadiness photos, 0 panel photos.
   - **Every keep-target is met** (below).
4. **Not fixed, and why:**
   - **Outdoor** still has no path to 8. Its trail shoe isn't a value in today's reading (trail shoes come back as runners or "other"), and the evidence for its silhouette is weak.
   - **Minimal** reaches 8 the way the sources describe it: a tucked or short knit over wide trousers. A tucked knit over wide trousers goes to 8.0. The council's untucked tonal 8.5–9 outfits stay at 7, because what makes them good is palette and texture, and today's reading can't see either.
5. **His picks:** I recommend no effect on the score, with one exception you may decide later. On the fix side, I recommend that a fix toward his look wins ties. I measured it: it changes the lead fix on 4 of 329 cards, and never against a bigger gain.

---

## 1. The audit: the council's outfits under v3, by style

**How to read the tables:**
- **adv** is the advocate's rating (RULEBOOK Part 7 bands; a range's middle). **target** is adv with 9+ held to 8.5. The parts engine makes 9 reachable only when every part is strong (SPEC "How high it can go"), and Fit tops out at 7 until the fit cues pass.
- Tiers: a **mistake** is ≤6, a **plain** fit is 6.5–7.5, a **deliberate** fit is 8+.
- **(a)** a plain fit lands at 6.5–7.5. **(b)** a deliberate fit reaches 8. **(c)** the mistakes land at 6.0 or lower.

| Style | n | Mean error | Deliberate fits' error | (a) plain at ~7 | (b) deliberate reaches 8 | (c) mistakes ≤6 | Best |
|---|---|---|---|---|---|---|---|
| Streetwear | 5 | +0.40 | −0.50 | 0/1 (the graphic tee + Dunks scores 8.0, rated 7.5) | **2/2** | 1/2 | 8.0 |
| Workwear | 8 | −0.25 | −1.17 | 3/3 | **0/3** | 1/2 | 7.5 |
| Vintage sport | 11 | −0.30 | −0.80 | 3/4 | 1/5 (only the boxy jersey over wide jeans) | 2/2 | 8.0 |
| Outdoor | 7 | −0.32 | −1.50 | 2/2 | **0/3** | 2/2 | 7.0 |
| Minimal | 8 | −0.38 | −1.42 | 3/3 | **0/3** | 1/2 | 7.0 |
| Classic prep | 11 | −0.25 | −0.90 | 3/4 | 1/5 (the tucked shirt under a blazer) | 1/2 | 8.0 |
| Smart casual | 7 | −0.32 | −0.92 | 2/2 | 1/3 (blazer + oxford + chinos + chukkas) | 2/2 | 8.0 |
| **All anchors** | 57 | −0.24 | spread across styles 1.00 | | | | |

**What the table says:**
- **(a) is fine everywhere.** Clean basics land at 6.5–7.5 in every style, which is the brand's "clean basics = 7". The one miss is the streetwear graphic tee + Dunks at 8.0, flagged in the streetwear pass (#203). It's the defining shape plus its own shoe, which earns what a tuck earns.
- **(b) is the unfair part.**
  - Streetwear has three routes to 8, and smart casual and prep have the tuck and the tailored line.
  - Workwear, outdoor and minimal had none, and vintage sport had only streetwear's shape.
  - **Why:** the parts engine credits a layer only by its *shape* (PR2: a short jacket over a full leg), and the short-jacket list holds only streetwear's jackets (bomber, trucker, leather). Every other style's "deliberate" fit is a different layer: a chore coat (workwear), a shell or fleece (outdoor), a track top (vintage sport). The other half of the gap is that "clearly that style top to toe" (H2) wants an anchor piece in every slot, while the notes define workwear, outdoor and vintage sport done well as "one hero piece + basics + its shoe" (`style_archetypes.md` Q2).
- **(c) is short by about a point in every style, for the same reasons in each.**
  - The council's mistakes are mostly a long top over the wrong leg, and "top below the crotch" is only a tip, because its reading failed (batch 1 `hem_at` 74% the same).
  - The 5.0 floor at Everyday holds a clean outfit up. That floor is a product rule (a clean fit is never below 5).
  - This isn't a style bias: it is the same in every style, so it isn't fixable here. It waits on the second look at the close-up (`hem_at` moved off the score's path, b1 report).

## 2. The changes (v4, opt-in)
Each reward follows PR4's pattern (the streetwear shape):
- the style's **defining silhouette**, from `notes/v5-silhouette.md` §5 and `notes/style_archetypes.md` Q2;
- built only from readings that passed: garment type 100%, leg full or narrow 94%, loose 97%, pooling 98%, shoe *kind* 77% with close-ups;
- gated on the style being detected and on its own shoe;
- **sized by the evidence**: medium to strong +1.0, weak +0.5. The waist break keeps +1.5 (6 sources, 0 against).

### PR5 "the workwear shape" (Proportions +1.0)
| Condition | Source | Steady? |
|---|---|---|
| A **chore coat** over the top | v5-silhouette §5 workwear (1): "chore coat or trucker at the hip + tee + straight/relaxed dark jeans or double-knees, cuffed, boots" (GQ Apr 2025, GQ Sep 2026, Mr Porter 2025, Stridewise 2026, Man of Many 2023: **medium–strong**). The trucker (denim jacket) already earns PR2 (+1.5) | Garment type 100% |
| **Straight, relaxed or wide** jeans or cargos (work pants once they're read); no pooling, no peek | §3: 6 sources pair a chore coat with a straight or fuller leg (GQ Sep 2026: "something sturdy to sit on"); 0 call slim a mistake, so slim earns nothing and loses nothing | Leg full/narrow 94%; pooling 98% |
| **Boots:** the whole boots kind (work boots, chukkas, Chelsea boots) | The notes ("boots"; archetypes: "work boots, moc-toe, chukka"). The whole kind, because the kind is the steady grouping and the exact type isn't (53%). Your grey suede boots read work boot, chukka and derby in one week | Boots kind: all runs held on 14 of 21 boot photos; the rest flip to derby, "other" (which asks "Boots, sneakers or slides?") or once canvas |
| The outfit **reads as workwear** | Keeps the reward inside the look | — |
| **Not over sneakers** | Your call on your friend's chore coat + jeans + low-profile sneakers was about 7 ("this shape didn't earn the points", v5-silhouette §2). With canvas or low-profile sneakers counted, that check would go to 7.5 and the panel gap gets worse (held-out +0.09 → +0.12) | — |

### PR6 "the outdoor shape" (Proportions +0.5)
- **What it needs:** a fleece, shell or rain jacket over a full leg, finished by **trail shoes**, in an outfit that reads as outdoor.
- **Source:** v5-silhouette §5 outdoor (1), "relaxed fleece or shell + straight or wide cargo/trail pants + trail shoes". That evidence is retailer summaries only, so it's **weak**: half of PR5. Also `style_archetypes` outdoor done well: "1–2 technical pieces + regular basics, trail shoe".
- **Why it's small:** the council itself calls the shell + cargos + trail shoes outfit a *plain* fit (RULEBOOK ruling 5).
- **It can't fire on a live reading yet.** `trail_shoe` isn't a value in `schema.json` (rubric.py says so too), so it's ready for the next reading batch.

### The track jacket is a short jacket (PR2's list)
A track jacket ends at the waist on a ribbed band, like a bomber. PR2 uses the layer's type as a stand-in for length, because layer length reads only 63%. Sources:
- v5-silhouette §1 family (c), "a short layer over a full leg" (4 for, 0 against);
- `style_archetypes` vintage sport done well, "one sport hero piece (jersey or track top) + denim".

Like the trail shoe, `track_jacket` isn't a live value yet.

### Tested and not adopted
| What-if | Result | Why not |
|---|---|---|
| PR5 +0.5 | Workwear drops back to no 8 (7.5) | +1.0 is the smallest step that gives the path, and it equals PR4's medium-evidence size |
| PR5 +1.5 | Nothing new reaches 8 | It would equal the waist break's stronger evidence |
| PR5 with field jacket or overshirt | No change anywhere today | Not in any source's workwear silhouette. A field jacket runs longer, and your overshirt checks aren't the chore-coat shape |
| PR5 with sneakers (low-profile, canvas) | Your friend's chore coat goes 7.0 → 7.5; panel held-out +0.09 → +0.12 | Your call (about 7); the sources name boots |
| PR5 with chinos | No change today | The sources pair it with denim, work pants and cargos |
| PR6 +1.0 | Outdoor reaches 8 once (the orange shell + cream knit + olive chinos + trail shoes); the plain uniform stays 7.5 | Weak evidence, and it can't fire live. **Your call, below** |
| PR6 with a vest; runners as a stand-in for trail shoes | No change anywhere | A runner is the gym shoe in every other style; the right fix is the `trail_shoe` value |
| "The look's own shoe" when a style is detected *with* the shoe (`sc_pair`) | The streetwear "done badly" outfit goes 6.5 → 7.0 (wrong direction); a boxy tee + chunky look-alike → 8.0 | It reopens the circular case the guard was built to stop (the shoe rewarding itself) |

## 3. The results
**The council's outfits (made-up readings, no person):**

| Outfit | adv | v3 | v4 |
|---|---|---|---|
| ww-8.5 chore coat + white tee + black straight jeans + work boots | 8.5 | 7.0 | **8.0** |
| ww-9 chore coat + plaid flannel + black jeans + work boots | 9.0 | 7.5 | **8.0** |
| look-alike: chore coat + tee + wide dark jeans + work boots | — | 7.0 | **8.0** |
| ww-8 chore coat + tee + black jeans + **canvas sneakers** | 8.0 | 7.0 | 7.0 (your sneaker call) |
| vs-8.5 track jacket + tee + straight dark jeans + low-profile sneakers | 8.5 | 7.5 | **8.0** |
| out-7.5 shell + tee + cargos + trail shoes (the uniform) | 7.5 | 7.0 | 7.5 |
| out-9 orange shell + cream knit + olive chinos + trail shoes | 9.0 | 7.0 | 7.5 |
| out-8.5 olive shell + cream knit + khaki chinos + trail shoes | 8.5 | 7.0 | 7.0 |

**Per style after v4:**
- **Workwear:** mean error −0.25 → −0.06; deliberate fits reaching 8: 0/3 → 2/3.
- **Vintage sport:** 1/5 → 2/5.
- **Outdoor:** best 7.0 → 7.5.
- **All anchors:** mean error −0.24 → −0.18; MAE 0.78 → 0.73.

The other 39 council cases (the founder group and the edge cases) don't move.

**Paths to 8 by style under v4** (the move the engine can see; the fix engine can name it):

| Style | Path to 8 | Status |
|---|---|---|
| Streetwear | A short jacket over full legs; or a boxy top + wide jeans + street sneakers; or a standout color with its signature pieces | Live |
| Workwear | **A chore coat + straight-or-fuller denim + boots** | **Live (new)** |
| Vintage sport | A boxy jersey + wide jeans + Sambas; **a track jacket over full legs** | Jersey live; track jacket waits for the value |
| Outdoor | None yet (best 7.5) | Waits for `trail_shoe` and the gold set |
| Minimal | A tucked or short top over wide or straight trousers (big pants, little shirt): the knit + wide trousers 7.0 → **8.0** tucked | Live (already in v3) |
| Classic prep | A tucked shirt under a blazer; a tucked sweater-and-oxford with loafers 7.5 → **8.0** | Live |
| Smart casual | A tucked quarter-zip or tee into trousers (7.0 → **8.0**); a blazer over a tucked shirt | Live |

**The keep-targets (all met):**

| Target | v4 |
|---|---|
| Your friend's blazer (d1967f) at 7 or below | 7.0 |
| The chore coat (e438d4, f4870b, fb0b17) at 7–7.5 | 7.0, 7.0, 7.0 |
| Your gingham fits as in v3 (5a9049, 7f14a4, f07193) | 7.0, 7.0, 6.5 (unchanged) |
| Your black tee + wide jeans + white leather sneakers (8ad378, 403ade) at 7 | 7.0, 7.0 |
| Batch 1 arm A steadiness ≥ 49/49 | 49/49 (zoom1 66/66, with lightness 49/49; no run differs from v3) |
| Panel gap within ±0.2 | +0.01 (same as v3) |
| No loss on the held-out half | Within 0.5: 26 → 26; MAE 0.43 → 0.43 |
| 8+ at 5–12% on the real photos | 6% (5 of 78, same as v3) |

**Why no real photo moves:**
- **PR5 fires on 0 readings** in any run of batch 1 (A, B1), zoom1 (A–D) or zoom1-stock (A, B). The saved photos hold no chore coat worn with boots.
- **Your friend's three chore-coat checks are over low-profile sneakers.** With boots on the same reading, each would be **8.0** (with chukkas too).
- **Your own workwear reads** are a field jacket with the shoes out of view (oct7-ph4), no layer (5a9049, 7f14a4, b0f0c8), or a fleece with chukkas (d918c0, 7.5).
- **What-ifs on your black tee + wide jeans (8ad378):**
  - adding an olive chore coat and work boots: **8.0**;
  - the chore coat with your white leather sneakers: **7.0**;
  - a green track jacket: 7.5 (Proportions 8.5).

So the gold set has to include these. See "What the gold set needs" below.

## 4. The style he picks: the proposal (not built into scores)
**What picks do today** (every engine, including v4):
- They never move a number.
- They break the tie for "Reads as" when two or more styles are detected (#86).
- On the real photos, 11 of 78 (14%) have 2+ detected styles. On 6 of those the label follows the pick, and the score is identical on 11 of 11.
- Among the council's outfits, 27 of 72 have 2+ styles.

**What I recommend:**
1. **The tie-break stays** as it is: his earliest pick that the outfit reads as names the look. If he picked none of the detected styles, it's the outfit's own first detected style, said plainly ("Reads as workwear"), never "not your style".
2. **Fixes: a move toward his look wins ties, never over a bigger gain.**
   - **How:** in the fix engine's sort key (`parts_fixes.py`), put "the fixed outfit reads as one of his picks (earliest pick first)" right after the shown gain and before the raw gain.
   - **Measured** with the v3 fix engine, each real reading run once per pick (7 styles): 329 (reading, pick) pairs have a fix. On 51, a shown fix makes the outfit read as the pick. **The lead fix changes on 4**, for example:
     - your slides check (oct7-ph1), Streetwear picked: chunky sneakers instead of navy chinos, both +1;
     - stock s05 and s16, Workwear picked: boots instead of navy chinos, both +0.5.

     So it's a light touch: it reorders equal choices only.
3. **The Next level line: his look's path.** When the card has nothing to fix, the line names his first pick's path from the table in §3, adapted to what he's wearing:
   - Workwear and a chore coat over sneakers: "Swap to boots for the full workwear shape."
   - Minimal: "Tuck the knit."
   - Outdoor: no line until it has a path.
4. **The wording** (outward-facing, so it's your call; drafts only):
   - The fix tag: "Toward your workwear".
   - "Reads as" stays as is.
   - Never "off-style" or "not your look".
5. **A score effect: not justified by the evidence today. It's your call, and I recommend no.**
   - `style_archetypes.md` Q4 recommends a general "put together" base with style as a modifier on what's *allowed*. Scoring against a chosen style punishes a normal tee-and-jeans day and breaks "same photo, same score".
   - The council ruled the same (picks never change a score, #59–61).
   - Nobody has shown raters judge an outfit by the style its wearer says he likes. The panel never saw the picks.
   - If you want to know, test it in the gold set like age (rule 7). Give raters the friend's 3 picks on half the photos and not on the other half. Allow a score effect only if the two halves differ by 0.5 or more. Even then, make it a small "toward your look" credit that never takes points away.

## 5. Calls for the founder
1. **Approve v4's three changes as the next engine** (the workwear shape, the outdoor shape at +0.5, the track jacket). Recommended: yes. They move no real photo today and they give workwear its 8. The TS port and the fix engine move to v4 in one step, with fixtures regenerated, once you OK it.
2. **Outdoor: +0.5 (sized by the evidence, no path to 8 yet) or +1.0** (the bright shell over basics with trail shoes reaches 8; the plain uniform stays 7.5)? Recommended: keep +0.5 until `trail_shoe` is in the reading and the gold set has outdoor fits. It can't fire before then either way.
3. **The picks proposal:** the tie-break for fixes, the Next level line toward his look, and no score effect. Recommended: yes to all three. The wording drafts above need your OK.

## 6. What the gold set needs (for these rules)
- **Pairs that change one fact:**
  - the same chore coat + jeans with **boots vs low-profile sneakers** (PR5 says 8 vs 7; your friend's checks are the "sneakers" half);
  - a chore coat over straight vs slim jeans;
  - the same tee + wide jeans with and without a chore coat.
- **Outdoor:** a shell or fleece over cargos with trail shoes (the uniform) vs over chinos with a sweater (the "mix"), with and without one bright piece.
- **Minimal:** a knit tucked vs untucked over wide trousers; a tonal outfit with a light-to-dark range vs a flat one (this tests the lightness credits, which need the `lightness` reading).
- **Each friend's birth year and 3 picked looks** (rule 7), so the picks test in §4 is possible.
