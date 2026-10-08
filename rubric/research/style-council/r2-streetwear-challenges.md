# Round 2: Streetwear advocate's challenges

*Oct 7, 2026. I read all 8 round-1 files and re-ran the claims below. Unless a line says otherwise, every number is for Everyday wear with no style picked. Three sources:*
- *`rubric.py` v3.1, "now" in the tables;*
- *`r1-vintage_sport_proto.py`;*
- *my round-2 package, `scratchpad/streetwear/rubric_r2.py`. It is my round-1 prototype plus the items I vote for below: R3 floor, R4 one credit per garment, R6 no partial scale-up, the vintage-sport ladder with my amendment, "one fact, one penalty" in `O1`, widen-only bands and `S3`. It leaves out R1, R2, R5, K1 tiering and the boot change.*

## 1. Challenges

**Vintage sport: a matched fleece set is not a dressed upper half.**
- Your ladder counts a hoodie in the same color as the sweatpants as "dressed." That puts p02-before (beige hoodie + beige sweats + chunky sneakers) at **0 loungewear cost: 6.0 → 7.0** in your prototype.
- It contradicts your own K1 rule ("a matched set isn't a layer; one garment, two halves"). A tonal sweatsuit is one choice, not two.
- With the matched-set clause removed, p02-before lands at **6.5**. Your tracksuit anchor (track jacket + track pants) still passes, because a track jacket is already on your structured list.
- Everything else in the ladder I support.

**Calibration: the founder's outfit read as jeans is 6.0 in your package only because nothing detects streetwear.** Under R1–R6, wide jeans still pay pooling and leg-vs-style (capped at −1.0). With streetwear detection:
- `F4` and `P1` go to 0, and the score becomes **7.0 when the hem reads `full_break`**.
- The hem is your own most unstable field (16 of 52 photos flip).
- So on one photo the founder would see 6.0 one day and 7.0 the next. My fix is `S3` (slides under jeans or cargos, −0.3), which replaces my round-1 "the hem drags over slides" `F4` charge. The score then reads **6.5 for both hem readings** (raw 6.7).
- Taken alone, your 6.0 is defensible. My objection is that it isn't stable.

**Calibration: s02 at 7.0 is too generous.**
- s02 is an oversized logo tee, nylon shorts read as `athletic_shorts`, and Jordans.
- My detector doesn't claim it: a plain tee plus shorts has no street bottom.
- Streetwear allowances shouldn't rescue gym shorts in town. Under the ladder it gets 1 signal (a real shoe): −0.6 → **6.0**. That is fair for "summer gym fit, good sneakers"; I'd accept 6.5.

**Outdoor: the cinched-hem `S1` exemption moves s06 the wrong way.**
- s06 is a light-blue oxford + pink joggers + running shoes. Your change takes it 7.0 → 7.5.
- Calibration rates it 6.0 and the vintage-sport ladder gives 6.5.
- Make the exemption cover `technical_pants` only, not joggers. Otherwise it rewards the oxford/joggers/runner clash that smart casual calls the classic near miss.

**Outdoor: "K4 for trail shoes would be inflation" shouldn't be generalized to boots and street sneakers.**
- Workwear's boot fix and my street-sneaker trigger aren't about how dressy the shoe is. They reward shoe weight that matches the leg width, the mirror image of the report's "wide leg + sleek shoe" fault.
- Measured on the saved readings, my trigger moves **0** scores outside p02 and the founder's photo; workwear's moves only s20.
- Smart casual's own test supports this: the best streetwear outfit it could build scored 6.5 with no pick, against 9.5 for a smart-casual outfit of equal quality.

**Workwear: "pooling is never excused" needs an interim clause.**
- I agree `stacked` should replace the streetwear pooling exemption. But until that reading exists, the model files intended stacking on wide jeans as `pooling` (the founder's photo).
- Until then, keep pooling = 0 for relaxed/wide **jeans or cargos** over a sneaker or boot, in a detected streetwear outfit only. Drop it the day `stacked` ships.

**Minimal and smart casual:** no challenges. Both decline to claim the founder's outfit, which is correct.

## 2. Concessions (my numbers change)
1. **s21 (black rain jacket + track pants + runners) is not techwear.** Calibration says 6.0 and vintage sport says 6.5. My round-1 techwear path took any athletic bottom, which gave it 7.5. I narrowed the path to **cargos only**: s21 is no longer detected and scores **6.5**.
2. **I withdraw my −2.0 loungewear cap (C11).** Vintage sport's "one fact, one penalty" plus calibration's R3 floor gets the founder's misread to **5.0** more cleanly, and that floor stays out of the way when a care fault is present.
   - Cost: my stained hoodie + sweats + slides anchor drops to **3.0**, not 3.5. Calibration's band definition ("care fault plus another fault") says that is acceptable. R1's per-garment cap would lift it to about 3.5.
3. **I also drop my `F4` "nothing to rest on" charge.** `S3` alone does that job, so one fact gets one penalty.
4. **R4 lowers my 9.5 anchor to 9.0.** The chore coat now claims Layered, and nothing else earns Elevated. Streetwear then tops out at 9.0 without a second elevated piece, the same as outdoor and vintage sport. I accept that.
5. **Widen-only bands raise my 5.5 anchor to 6.0** (huge hoodie past the crotch + slim jeans + chunky sneakers; raw 6.15), because slim jeans are in the default band. I accept this, plus one garment-level amendment (C4).

## 3. Votes
| # | Vote | Why |
|---|---|---|
| C1 | **For** | No double-dip with the shoe expansions: the street sneaker or boot claims K4 and sits below dressiness 3, so it can never also earn K2. Smart casual measured it at 14 of 156 saved readings down by 0.5 and none up |
| C2 | **For** | A puffer is a coat, not a styling choice. My bomber and denim-jacket anchors keep 0.75 |
| C3 | **Amend** | Use vintage sport's ladder (−1.2 / −0.6 / 0) for everyone, **minus the matched-set clause**. Picks alone waive nothing. A detected style doesn't waive it either. This replaces my "structured anchor" half-rate |
| C4 | **Amend** | Widen only. Add garment-level `P2`: a top at volume 5 over a **slim** leg costs −0.3 (today it fires only on skinny). Without it, widen-only loses the "huge hoodie, slim jeans" fault |
| C5 | **For** | At work and interviews the loungewear and logo waivers switch off; proportion allowances stay |
| C6 | **For** | `ripped` is the only denim value streetwear needs; faded vs plain should never move a score. Black jeans counting as dark changes nothing at Everyday |
| C7 | **For, with one note** | Rugby: the bottom and shoe decide. Shell + cargos + trail shoes → outdoor. All-dark shell + cargos + runners → streetwear (techwear). **Chore coat over a hoodie:** label by the shoe (work boot → workwear; chunky, basketball or canvas → streetwear). The allowances are unioned, so the score is the same. Mid-wash denim never counts as minimal |
| C8 | **For** R1–R6 and the spread targets | My package covers R3, R4 and R6. Under R5, camo counts like any other pattern, by its scale |
| C9 | **Amend** | One rule: `S3` −0.3 for slides under jeans, cargos or sweats outside Home/Gym. **Not** for drawstring/linen trousers or shorts, the resort case (m12). The extra −0.4 I proposed in round 1 is withdrawn. Vintage sport, workwear, minimal and smart casual all treat slides as a home shoe; the Highsnobiety socks-and-sandals piece is the only source against |
| C10 | **Against for launch** | It fires 0 times, and minimal's own advocate recommends waiting for the gold set. If it ships later, make it style-neutral (tonal + outer layer + clean + no logos) so an all-black techwear outfit can earn it too |
| C11 | **For "one fact, one penalty"; against my own cap** | See concession 2 |
| C12 | **6.5** | Hoodie (no credit, no fault). Streetwear detected: the wide leg and stacked/pooled jeans cost 0. `S3` −0.3. No credits. Raw 6.7 → **6.5 for both hem readings**. As misread (sweatpants): **5.0** (ladder 0 signals, `O1` counts the sweats as 2, R3 floor), so "Jeans or sweatpants?" asks: 5.0 vs 6.5 clears calibration's 1.0 gap. Fixes: sneakers → 7.5; plus a bomber → 8.5 |

## 4. Net inflation check
My round-2 package, run on all 162 readings: 156 saved, 4 phone checks, plus the founder's photo re-read as jeans with each hem reading. R1, R2, R5, K1 tiering and the boot change are left out.

**6 go up:**
- p02 × 4: 5.5 → 6.5 ×3, 6.0 → 6.5 ×1
- the founder's misread: 3.5 → 5.0
- the founder read as jeans, hem `pooling`: 6.0 → 6.5

**35 go down by 0.5:**
- m04 ×2, m07 ×3, m09 ×3, m10 ×3, m12 ×2
- p04 ×6, p06 ×3
- s06 ×3, s21 ×3, s24 ×3, s26 ×3
- phone3

**Score 8+: 85 → 76 of 162 (52% → 47%).**
- Every rise is a loungewear or misread case that today's rubric over-punishes.
- Every drop comes from the shared credit fixes.
- Adding R5 and K1 tiering would push the 8+ share lower, toward calibration's 20–25% target.
- The streetwear allowances themselves raise only outfits that don't exist in the saved set (baggy denim + chunky sneakers). **The gold set needs about 8 real streetwear photos before any of this is trusted:**
  - stacked vs pooled wide jeans
  - hoodie + cargos + skate shoes
  - graphic tee + baggy jeans + Dunks
  - a sweatsuit + sneakers
  - the founder's outfit with sneakers instead of slides
