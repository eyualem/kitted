# Round 2: Common ground (rules every style shares, and the full conflict list)

*Common-ground member, Oct 7, 2026. Built from all eight round-1 files. I re-ran the key claims with `rubric.py` v3.1 and the members' own detectors (the four in this folder plus the smart-casual, minimal, prep and outdoor detectors in the shared scratchpad). My scripts are in the scratchpad under `common_ground/`:*
- *`cofire.py`: all 7 detectors on the same readings*
- *`lookalikes.py`: 25 look-alike outfits*
- *`r4.py`: one garment, one credit*
- *`lounge.py`: the loungewear proposals side by side*

*Members are abbreviated SC (smart casual), MIN, PREP, WW (workwear), ST (streetwear), VS (vintage sport), OUT (outdoor) and CAL (calibration). Points are what the final score moves.*

## The short version
- **Everyone agrees on the hard floor.**
  - No style excuses stains, strain, wrinkles, worn clothes or real pooling on trousers (8 of 8 members).
  - Detection is computed in code from slots, anchors and vetoes (all 7 advocates).
  - A detected style should only widen what's allowed, never add a penalty (6 of 7; streetwear's own anchor breaks this, conflict 2).
- **The detectors rarely collide.**
  - On the 52 saved photos, 29 read as no style.
  - Smart casual and minimal fire together on 8 photos; smart casual and prep on 3.
  - The set of styles detected changes between runs on only 2 photos (m10 and s10, where minimal flickers).
  - Vintage sport and outdoor fire on no saved photo, so their detectors are untested on real outfits.
- **The biggest fights:**
  - Loungewear: three different models.
  - Whether one garment can earn two credits. This decides whether pure streetwear, workwear and vintage outfits can reach 9.5.
  - Whether his picks still unlock anything.
  - Three photos that members score 1.0–1.5 apart: s21, s02 and s06.

---

## 1. The universal core

### 1a. Always a mistake, whatever the style
| Rule | Support | Note |
|---|---|---|
| `F7` stains (−1.2) | **8/8** | WW: distressed-by-design should excuse only wear, never a stain or wrinkle (moves 0 saved scores) |
| `F10` visible strain (−0.6) | **8/8** | CAL: "clear" readings only, and never ask (it risks judging the body) |
| `F7` wrinkles on smooth fabric (−0.4) | **8/8** | Quilting and cord get misread as wrinkles (phone4). That needs a prompt line, not an excuse (WW, CAL) |
| `F7` pilling and wear on clothes | **8/8** | PREP rejects "patina"; VS: a stretched collar is wear, a faded print isn't |
| `F4` pooling on trousers and chinos (−0.8) | **8/8** | The disagreement is only about loose jeans, cargos and sweats, which is a stacking question (M7) |
| `F6` collared shirt past the crotch (−0.8) | **8/8** | ST excuses only hoodies, tees and sweatshirts in a streetwear outfit |
| `F9` sleeves over the hands (−0.4) | 7/8 | ST keeps today's −0.2 on streetwear hoodies |
| `O1` too casual at work, interviews and events | 6 explicit, 0 against | — |
| `S1` chunky shoe with slim legs; `S2` sneakers under a suit; `L1`; `T1`; `C4a` | 2–5 explicit each, 0 against | CAL wants a ramp on S2 (R9); SC wants T1 to skip unstructured blazers at Everyday |

### 1b. Never a mistake, for anyone
- Tonal, all-black and all-neutral outfits.
- Mixing styles (SC, PREP, OUT). A hoodie under a blazer just falls back to the general standard.
- Double denim (WW). Whether it ever costs points is conflict 22.
- Big logos and graphic prints outside work and interviews: a tip only.
- Fades and rips that are by design.
- A half tuck, and an untucked tee ending at mid-fly.
- Anything outside the photo; fabric, brand, face and body (8/8).
- **"Reads as <style>" earns 0 points by itself** (MIN, WW, PREP, SC). A head-to-toe costume gets a tip, never points (PREP, WW, OUT). VS is the exception (conflict 23).

### 1c. Rules members want applied the same to everyone (by garment, not by style)
1. A **`stacked` hem value** with one hem table for all (8/8).
2. **Joggers, and the proposed track pants, count as loungewear** (CAL R7, VS, ST). A joggers/sweatpants flip shouldn't swing 0.6.
3. **A layer is a layer, whichever category the model picks.**
   - An open overshirt or flannel over a top (CAL R8), and any fleece or vest (OUT), earns K1.
   - Today that one call swings about 1.0: p06 8.5 → 6.5, m10 9.0 → 7.5, a fleece 7.0 vs 8.0.
4. **A garment with a care fault earns no credit.** This merges WW (a stained piece earns nothing) and OUT (a pilled piece earns no K3). It moves 0 saved scores.
5. **One garment counts once** in the focal-point and point-of-interest counts (PREP; VS for hero pieces). A striped red rugby swings 0.5 today on red vs. multicolor.
6. **Muted accents are read from `saturation`** (research #2).
7. **Merge Preppy and Old money** into one band, 2–3 and slim → relaxed (PREP).

---

## 2. Shared mechanics proposed independently

| # | Mechanic | Who | How the versions differ | Cleanest single version |
|---|---|---|---|---|
| M1 | **One garment, one credit** | SC, CAL (R4); MIN and PREP flagged the same over-scores | SC: a fixed order (K1 the layer, K4 the shoes, K2 a third piece). CAL: the best assignment. PREP: "fix it globally, not by style" | CAL's best assignment: each credit from a different garment, chosen to maximize the total. **Side effect I measured:** without a second dressiness-3 piece, an outfit tops out at **9.0**. That hits WW's chore coat + flannel + black jeans + boots, ST's chore coat + red hoodie + chunky sneakers, and VS's jersey + blazer + jeans + Sambas. SC's, PREP's and OUT's 9.5 anchors stay at 9.5 (conflict 3) |
| M2 | **Detection from slots, anchors and vetoes** | all 7 advocates | points and thresholds | §3 template |
| M3 | **A detected style only widens** | WW, OUT, MIN, VS, SC, PREP | WW and OUT take the union of bands; MIN takes the more forgiving band | Band = the union of the default band (or his picks) and every detected style's band. Detection never adds a penalty |
| M4 | **Allowances come from detection, not his picks** | ST, VS | WW and MIN keep some pick-based unlocks | Conflict 1 |
| M5 | **Each allowance names its garment** | ST, SC, VS, PREP, OUT; research | — | Required. It's what makes combining two styles' allowances safe |
| M6 | **Loungewear decided by signs of intent** | VS, ST, CAL | very different | Conflicts 6–7 |
| M7 | **The stacked hem** | all 8 | ST: a stack needs a shoe to rest on. SC, PREP and research: stacked trousers still cost | Stacked loose jeans, cargos or sweats = 0. Stacked trousers or chinos = −0.4. Pooling = −0.8 everywhere. Slides are conflict 11 |
| M8 | **A denim wear field** | MIN, WW; SC ignores today's flag on dark jeans | names only | **`denim_wear` (new field):** none / faded / ripped / not_visible, for denim only. Faded is free. Ripped lowers dressiness and rules out minimal and prep. Today's yes/no flag reads true on 33 of 46 saved jeans readings and flips between runs (m10 15/42) |
| M9 | **Caps on one fact** | CAL R1 (−1.0 per garment for fit and proportion), ST (−2.0 total for a loungewear outfit), VS (O1 stops charging for the pants) | which rules each cap covers | Conflict 7 |
| M10 | **The quick tap** | CAL, ST, VS, MIN, OUT, WW | threshold; which pairs | CAL's closed list of look-alike pairs, re-scored in code. If he skips, score the more generous reading. The threshold is conflict 25 |
| M11 | **One shared wide-trouser allowance** | SC (SC-A1), PREP, MIN | MIN includes chinos | Wide or barrel trousers or drawstring trousers with non-athletic shoes: no P1. Write it once. It raises m02 8.5 → 9.0 (Claude's estimate 8.5) |
| M12 | **Flip-safe new values** | WW (OUT and VS in effect) | — | A new value gets the dressiness of its likeliest look-alike (§5) |

---

## 3. A shared detection framework

**One template for all 7.**
- **Inputs:** main garments not marked "unsure"; hidden slots dropped; accessories ignored.
- **Slots:** upper (top and outer layer; the best piece counts), bottom, shoes.
- **Each style gets a table of:**
  - anchors (2 points)
  - home pieces (1 point)
  - pieces against it (−1)
  - vetoes
  - one optional gate
- **A style is detected when:**
  - no veto fires
  - there's at least 1 anchor
  - its points come from at least 2 slots
  - the total is ≥3 (≥2 when only 2 slots are visible)
  - the gate passes

The round-1 gates fit this template:
- **Minimal:** the palette (neutral, no mid- or light-wash denim, at most 3 color families).
- **Streetwear:** volume (a loose leg, a top at volume 4+, or the techwear path).
- **Vintage sport:** one of its 4 paths.
- **Classic prep:** at least one strong piece.
- **Smart casual:** a smart upper piece, or chinos or trousers.
- Workwear and outdoor already match the template as written.

**Tie-break order for the card label** (my proposal):
1. Vintage sport (a hero piece)
2. Outdoor (a technical piece outermost, or trail shoes)
3. Workwear
4. Streetwear
5. Classic prep
6. Minimal
7. Smart casual (SC asked to lose every tie)

The more specific anchor wins; his picks break any tie that's left.

**When two styles both qualify:** apply both styles' allowances, taking the more forgiving amount per rule. MIN, PREP, OUT, VS and ST all call this safe, because each allowance names its garment. The order above sets only the label and the suggestions.

**When none qualifies:** the general standard applies, with no exemptions. That's the default band, widened by his picks only if conflict 1 allows it. "Leans <style>" (OUT's term) only steers suggestions.

**Where detectors fire together (measured):**
- **Saved photos, run 1:**
  - SC 15, MIN 9, PREP 4, ST 4 (p02 ×2, s21, m01), WW 2, VS 0, OUT 0
  - **SC + MIN on 8:** p01 ×2, p03-after, p06 ×2, s03, s25, and m10/s10 in some runs
  - **SC + PREP on 3:** m02, m08, s22, plus the sport-coat phone check
  - The founder's outfit read as jeans fires streetwear only; as misread, nothing.
- **Look-alike outfits:**

| Outfit | Fires | Members' tie-breakers |
|---|---|---|
| Polo + chinos + loafer | SC, MIN, PREP | All say prep. MIN shouldn't fire: collared tops and stripes pass its vetoes |
| **Rugby + chinos + low-profile sneaker** | MIN, PREP, VS | **Contradiction:** PREP goes by the chinos; VS by the Samba |
| Chore coat + tee + wide jeans + work boot | WW, ST | Both say workwear |
| **Black shell + tee + black cargos + trail shoe** | MIN, ST, OUT | **Contradiction:** ST says all-dark means streetwear; OUT says trail shoes mean outdoor. MIN shouldn't fire on cargos with trail shoes |
| **Field jacket + tee + cargos + trail shoe** | WW, OUT | **Contradiction:** each hands it to the other. WW says a technical piece means outdoor; OUT says a field jacket means workwear |
| Jersey + wide jeans + chunky sneakers, or + low-profile | ST, VS | VS: the shoe decides. ST: vintage needs a straight leg |
| **Flannel + wide jeans + chunky sneakers** (grunge) | **none** | A gap: ST claims grunge but has no flannel signal, and WW's chunky shoe counts −1 |
| s21: rain shell + track pants + runners | ST (techwear path) | VS: training kit. OUT: vetoed. Conflict 9 |

---

## 4. The complete conflict list

*The tags in brackets map to C1–C12 in `ROUND2.md`.*

| # | Conflict | Side A (evidence) | Side B (evidence) | Effect |
|---|---|---|---|---|
| 1 | **Do picks unlock anything?** | ST, VS: a pick alone waives nothing (founder rule 1) | WW: "reads as **or** picked." MIN: a Minimal pick widens its band. OUT and MIN mix the detected band with his picks | Today a pick alone takes s21 from 7.0 to 8.0 |
| 2 | **Widen only** [C4] | WW, OUT, MIN, VS, SC, PREP | ST's 5.5 anchor charges slim jeans −0.45 through the streetwear band. SC §8 says detection should "replace" the default band | That anchor rises about 0.5 under widen-only |
| 3 | **One garment, one credit** [C1] | SC and CAL. CAL: mirror error 0.75 → 0.54 with R4 + R5. SC: bias +0.58 → +0.47 | VS needs blazer = K1 + K2 to reach 9.5. ST's and WW's 9.5 anchors also double-dip | Pure street, workwear and vintage outfits cap at 9.0 (measured). Also open: should K2 need a top or bottom? s05 earns K2 from white leather sneakers alone |
| 4 | **K4 for more shoes** [C1] | WW: work boot dressiness 2.5. ST: chunky, basketball or canvas shoes under loose jeans or cargos earn K4, for everyone. SC: retro runner 2.5? | OUT: K4 for trail shoes would be inflation, "and boots face the same question" | Tee + jeans + boots 7.0 → 7.5; graphic tee + wide jeans + basketball shoes 7.0 → 7.5 |
| 5 | **Technical layers earn K1 at 0.5** [C2] | OUT; CAL notes s21's rain jacket offsets the loungewear rule | Nobody objects; ST treats puffers as core street layers | A shell over basics 8.0 → 7.5 |
| 6 | **The loungewear model** [C3] | VS: a ladder over 2 signs of intent (a dressed upper half, a real shoe): −1.2 / −0.6 / 0 | ST: one anchor (an outer layer, or a street shoe) → −0.3, else −0.6, with a −2.0 cap. CAL: keep O1 + O4 (about −2) and guard misreads with R1–R3 | The two "intent" lists disagree on shells and puffers, and on whether one signal is enough |
| 7 | **One penalty for the sweats** [C11] | VS: at Everyday, athletic bottoms count as dressiness 2 in O1 | CAL: merging O1 + O4 makes a real sweatsuit 6.0, which is too lenient (wants 5.0). ST: the −2.0 cap | All three land the founder's misread at 5.0 |
| 8 | **A 5.0 floor** (R3) [C8] | CAL: phone1 3.5 → 5.0 | No advocate tested it | — |
| 9 | **What s21 is** | ST: techwear, measured 7.5 | VS: training kit, 6.5. OUT: vetoed. CAL estimate: 6.0 | 1.5 spread |
| 10 | **s02 and p02** | CAL: s02 is a clean summer street look, 7.0 | ST and VS prototypes give s02 6.0. p02 (hoodie + sweats + chunky): ST 6.5, VS 7.0 | — |
| 11 | **Slides under jeans** [C9] | ST: S3 −0.3 (low confidence), and a stack over slides −0.4. CAL: the slides are why the founder's outfit is 6.0 | ST cites Highsnobiety 2025 against itself: socks and sandals as a go-to. Others count slides only as a lost credit | Founder 6.0 vs 6.5 |
| 12 | **Half price for worn shoes** | WW, ST: keep it. VS: only retro sneakers in a vintage outfit | MIN: full price when the outfit reads minimal. OUT: full price for muddy trail shoes | — |
| 13 | **F4 excused by style, or by the hem field** | ST: 0 for loose jeans, cargos or sweats with a stack-holding shoe. VS: −0.4 for athletic bottoms | SC, MIN, PREP, WW, OUT: no style excuse; `stacked` handles it for everyone | Moot once `stacked` holds up in the re-run |
| 14 | **Black and charcoal jeans** [C6] | WW: undistressed black = 2.5, never charcoal (charcoal widens m10's work score to 7.0–8.5) | SC's detector counts both | — |
| 15 | **Halving the bright clash** | PREP: C3 −0.3 for prep brights. ST: keep its existing half | MIN, OUT, VS: two brights stay a clash | Pink oxford + green shorts 6.5 → 7.0 |
| 16 | **K3 from small patterns** [C8] | CAL R5: patterns count only at medium or large scale (11 readings −0.5) | SC's and PREP's 9.5 anchors get K3 from a small-stripe oxford, and drop to 9.0 under R5. MIN wants a "clean palette" K3 | — |
| 17 | **A stricter K3** | ST: no K3 when a color mistake fired | Overlaps R5; unopposed | — |
| 18 | **Who owns the wide-trouser allowance** | SC, PREP and MIN each propose it | SC: "should exist once" | m02 8.5 → 9.0 |
| 19 | **S1 with cinched joggers** | OUT: skip it (s06 7.0 → 7.5) | CAL: s06 is over-scored (estimate 6.0). VS prototype gives 6.5 | s06 moves in opposite directions |
| 20 | **Occasion beats style** [C5] | SC: at work and interviews, the O4 and O3 exemptions turn off | Unopposed. Open: does stacking stay allowed at interviews? | — |
| 21 | **Joggers vs. tech pants** | OUT: ask "Joggers or hiking pants?" | VS: track pants join the lounge group | 7.5 vs 6.0 at a date (OUT) |
| 22 | **Denim near-match** | Research: −0.3 after the gold set | WW: a tip forever (the light/mid wash call flips 10–18%) | — |
| 23 | **Costume = tip only** | PREP, WW, OUT; research | VS: a full kit costs −1.2 through O4 | — |
| 24 | **Shell over suit trousers** | Research: a fault | OUT: not a fault | — |
| 25 | **When to ask the tap** [C8] | CAL: ≥1.0 plus a doubt signal (4–5% of checks); MIN: ≥1.0 | ST, VS: ≥0.5 | How often he's asked |
| 26 | **Rugby** [C7] | PREP: the bottom decides | VS: a Samba decides | Rugby + chinos + Samba |
| 27 | **Outdoor vs. streetwear** [C7] | OUT: a technical piece outermost, or trail shoes | ST: all-dark goes to streetwear | The label and the logo tip |
| 28 | **Outdoor vs. workwear** [C7] | WW: a technical piece means outdoor | OUT: a field jacket means workwear | Field jacket + cargos + trail shoes |
| 29 | **Mid-wash denim is never minimal** [C7] | MIN | Unopposed | Label only |
| 30 | **Rounding x.75 up** | PREP, WW: 8.75 → 9.0 is too generous | CAL: fine if 9+ stays at or under 5% of checks | — |
| 31 | **Prep or smart casual label** | SC: smart casual always loses | PREP: show both labels | Wording only |
| 32 | **The founder's outfit read correctly** [C12] | CAL 6.0; VS 6.0–6.5; SC 6.0 (pooling) to 6.5 | ST 6.5; MIN 6.5–7.0 | **Consensus: 6.0–6.5 as jeans, 5.0 as misread; the tap decides.** No one goes above 7.0 or accepts 3.5 |

**Unopposed single-member proposals that still need a ruling:**
- VS: jersey dressiness 2; a matched tracksuit isn't a layer.
- SC: T1 skips unstructured blazers at Everyday.
- MIN: P3 skipped for a top that ends at the belt, or over pressed trousers; a "vary texture" tip instead of "add color."
- PREP: three prompt lines.
- CAL: R2 (a ramp on O1), R6 (no partial scale-up), R9 (a ramp on S2).
- OUT: no big-logo tip on technical pieces.

---

## 5. Proposed new fields and garment types

**Each one adds a run-to-run flip risk and needs the extraction re-run.**
- **The re-run:** 40 stock + 12 mirror photos, about $1.35, and it must keep at least 90% score consistency.
- **Why it matters:** the shorter v4.1 answer format alone changed 5 readings.
- **Hem is already the least stable field:** 16 of 52 photos flip between runs, so `stacked` is the riskiest addition.
- **Every field must allow "not visible,"** and unknown must mean no penalty. Gemini Flash's "can't tell" F1 is 22% (arXiv 2601.15711).

| Field or value | Who needs it | Dressiness; flip-safe? | Reliability |
|---|---|---|---|
| hem `stacked` **(new value)** | all 8 | — | Moderate; untested |
| `denim_wear` none / faded / ripped / not_visible **(new field)** | MIN, WW (SC, PREP, ST indirectly) | ripped lowers jeans' dressiness | Likely better than today's mixed flag |
| `shoe_profile` sleek / regular / chunky / not_visible **(new field)** | research, SC, ST | — | Moderate; worse in partial photos |
| `lightness` light / mid / dark **(new field)** | research, MIN (a note only) | — | Likely high (relative call) |
| `waistband` belt_or_loops / elastic_drawstring / not_visible **(new field)** | ST (tap trigger) | — | Often hidden under the top. Doubt signal only |
| `vest` **(new value)** | SC (2.5), OUT (2, K1 at 0.5) | **Members disagree.** 2 matches puffer (flip-safe) | Fairly good (sleeves visible) |
| `trail_shoe` (and OUT's `hiking_boot`) **(new value)** | OUT; VS and ST care | 2 = performance runner, safe | Moderate; mirror shots weak |
| `technical_pants` **(new value)** | OUT | 2 vs joggers at 1: not safe (by design) | Low; needs the tap |
| `track_jacket` **(new value)** | VS, ST | 2 = hoodie, safe | Untested; a fabric call |
| `track_pants` **(new value)** | VS | 1.5 vs sweatpants at 1: not safe | Fabric call; fails toward the stricter score |
| `work_pants` **(new value)** | WW | 2 = cargos, safe | Untested |
| `denim_shirt` **(new value)** | WW | 3 = oxford, safe | m02's denim shirt read as oxford |

**Also in the same re-run:**
- **Dressiness changes:**
  - work boot 2.5 (WW)
  - jersey 2 (VS)
  - retro runner 2.5 (SC, undecided)
  - undistressed black jeans 2.5 (WW)
- **Prompt-only lines:**
  - PREP's three lines
  - VS's jersey and track definitions, and "an elastic cuff is cuffed, not pooling"
  - WW's "raw indigo is `denim_dark`" and "texture isn't wrinkles"
  - OUT's ask to define shells, fleece, puffers and cargos, none of which the prompt defines today

**My recommendation:**
- **Ship first:** `stacked` and `denim_wear`. Every style's allowances lean on them.
- **Collect quietly for one test cycle before they score:** `shoe_profile`, `lightness`, `vest` and `trail_shoe`.
- **Defer:** the track values, `technical_pants` and `waistband`. The saved sets have 0 jerseys and 0 outdoor outfits to test them on.
