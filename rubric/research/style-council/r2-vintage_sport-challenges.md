# Round 2: Vintage sport challenges

*Oct 7, 2026. I read all 7 other round-1 files. Every number here was re-run, with no style picked and an Everyday occasion unless noted:*
- *`rubric.py` v3.1*
- *the streetwear proto*
- *my r1 proto*
- *`r2-vintage_sport_package.py` (this folder): every proposal I vote for below that is computable today, combined*

*`r2-vintage_sport_net.py` reproduces the net-inflation numbers.*

## 1. Challenges

**Streetwear: the techwear path and "any outer layer is an anchor" let errand sweats score Sharp-adjacent.**
- s21 is a black rain jacket, charcoal Puma track pants and knit running shoes. The streetwear proto detects it as techwear in all 3 runs, keeps K1 and charges only −0.3 for loungewear: **7.5**.
- For comparison: v3.1 gives 7.0, calibration estimates 6.0, and outdoor and I both class it as training kit.
- The same "any outer layer" rule scores a puffer over a hoodie, sweatpants and slides at **7.0**.
- A technical shell over sweats isn't the "structured anchor" streetwear's own one-sentence definition describes.
- **Fix:**
  - technical layers (shell, rain jacket, puffer, fleece) don't count as anchors for lounge bottoms;
  - over 0-signal loungewear they earn no K1.
  - That puts s21 at **6.0** and the puffer case at 6.0.

**Calibration: s02 shouldn't go to 7.0.**
- s02 is an oversized black tee, black athletic shorts and Jordan 1s. Calibration wants it at "baseline put together."
- The model can't tell retro nylon shorts from mesh gym shorts. Lyst's football-shirt guide says flatly "no athletic shorts" ([Jun 10, 2026](https://www.lyst.co.uk/stories/how-to-style-football-shirts-mens/)).
- It has a real shoe and nothing dressed on top: one intent signal, −0.6. That's today's value: **6.0–6.5, unchanged**.
- If the gold set ranks it with tee + jeans + sneakers, I'll move.

**Calibration's case against merging O1 and O4 doesn't hit my design.**
- Calibration rejected "the larger of O1 and O4" because it lifts a true hoodie + sweatpants + slides to 6.0, where it should be about 5.0.
- My version is "one fact, one penalty" plus a heavier O4: athletic bottoms count as dressiness 2 in O1 at Everyday/Class, and O4 costs −1.2 with no intent signals.
- It keeps that outfit at **5.0** (raw 5.0 with the founder's misread fields) while ending the double charge. It passes calibration's own test.

**Outdoor: the cinched-hem S1 exemption should not be global.**
- Applied to everyone, it lifts s06 (light-blue oxford, "pink joggers", grey runners) from 7.0 to 7.5.
- Calibration flags s06 as over-scored (estimate 6.0). The joggers are a misread of cream trousers anyway.
- **Amend:** skip S1 for cinched joggers or tech pants only when the outfit reads as outdoor (shell or trail shoe present).

**Classic prep vs me on the rugby shirt: one boundary case.**
- Rugby + chinos + Sambas: my r1 rule (retro shoe → vintage sport) and prep's rule (chinos → prep) disagree.
- **I concede:** for a rugby shirt, the bottom alone decides.
  - chinos, trousers or non-athletic shorts → prep
  - jeans, cargos or athletic bottoms → vintage sport
  - The shoe is ignored.
- One field, fewer flips, and both styles' allowances barely differ there anyway.
- Jerseys and track pieces stay vintage sport.

**Streetwear's signals table lists `basketball_sneaker` as a vintage-sport signal.** It isn't one; I don't claim it. Basketball and chunky sneakers are streetwear's tie-breaker over me.

## 2. Concessions and changes to my round-1 numbers
- **Dropped:** the "matched set" intent signal (a fleece top plus same-color sweats).
  - Calibration puts a grey hoodie + grey sweats + slides at 5.0; with the signal it would be about 6.0.
  - p02's beige set now scores **6.0** (boots, after) and **6.0** (chunky sneakers, before), instead of my r1 6.5 / 7.0.
  - Streetwear's 6.5 target is within half a point.
- **Tap threshold:** I adopt calibration's trigger (a closed list of look-alike pairs, a swing of 1.0 or more, plus a doubt signal) instead of my 0.5 swing. The founder's photo still asks (5.0 as sweats vs 6.0–6.5 as jeans).
- **One garment, one credit costs vintage sport its 9.5.**
  - A blazer or overcoat over a jersey can no longer earn both Layered and Elevated, so both my 9.5 anchors land at **9.0** (raw 8.75).
  - I accept this. The style tops out at 9.0 unless a second dressy piece (chinos, loafers) is present.
- **`trail_shoe` (outdoor's new value) counts as a real shoe** in the loungewear ladder. Only `performance_runner` and slides are gym or home shoes.
- **Unchanged:**
  - My other anchors: full kit 6.0, jersey + joggers + gym runners 6.5, jersey + jeans + Sambas 7.5–8.0, track jacket + jeans 8.5.
  - The founder misread: 5.0.

## 3. Votes

| # | Vote | Why |
|---|---|---|
| C1 | **For** | Fixes the biggest over-score source (calibration D7–D9). Shoes only ever claim K4, so the work boot at 2.5 and the street-sneaker trigger don't collide with it. Amend the street trigger: no K4 over a pooling hem, and never with sweats |
| C2 | **For, amended** | Also: no K1 from a technical layer over 0-signal loungewear (s21 7.0 → 6.0). A track jacket is not technical (it stays 0.75 over jeans; a matched tracksuit earns 0) |
| C3 | **For my ladder** (0 / 1 / 2 signals → −1.2 / −0.6 / 0), **without the matched set, and picks alone waive nothing** | Streetwear's anchor is the right idea, but "any outer layer" is too loose (s21 7.5). Both signals are coarse type reads, already in the schema |
| C4 | **For** | My proto already merges the vintage band into his blend (widen only) |
| C5 | **For** | Sweats and jerseys at work or interviews fail O1 anyway. Switching off O4 and O3 exemptions there costs vintage sport nothing it should keep |
| C6 | **For** | Also covers faded or cracked prints on vintage jerseys (`faded` = by design), replacing my prompt line |
| C7 | **Rugby: amend** (the bottom decides, as above). **Shell + cargos + trail shoe → outdoor: for.** **Chore coat over a hoodie: either** (union the allowances; label by shoe: work boot → workwear, chunky → streetwear). **Mid-wash never minimal: for** | Each tie-break uses one reliable field |
| C8 | **For R1–R6**; target spread for | R4 and R5 move my saved readings the right way. Even the full package leaves 41% at 8+ (section 4), so the target needs the gold set and probably a credit trim, not more rules |
| C9 | **Amend: −0.3** for slides with long non-athletic pants outside Home, **gated on the gold set** | Slides are already "no real shoe" in my ladder, so no double charge with sweats. Sources lean against penalizing (Highsnobiety on socks and sandals), hence the gate |
| C10 | **Against for launch** (gate it) | It fires 0 times on the saved set; its own author says wait for the gold set |
| C11 | **Amend:** one fact, one penalty for O1 + O4 (above); keep R1's per-garment cap as the backstop for fit and proportion stacking | A flat −2.0 cap lets loungewear plus a fit fault cost the same as loungewear alone |
| C12 | **6.5** | Tap → jeans; hem resting or `stacked` → no F4. Path A: streetwear detects (wide jeans, hoodie), P1 is removed, slides −0.3 → raw 6.7 → **6.5**. Path B: no detection, P1 −0.45 → raw 6.55 → **6.5**. Both land at 6.5, so the detector isn't load-bearing here. Today the same reading gives 6.0 (pooling) or 6.5 |

## 4. Net inflation check

**What it covers.** `r2-vintage_sport_package.py` combines:
- my r1 proposals minus the matched set
- R2, R3, R4, R5, R6
- C2 (with the loungewear amendment)
- R8 (open overshirt)
- workwear A and B
- one focal point per garment
- the amended street-sneaker K4 trigger

It leaves out R1 and the other styles' detection allowances.

**Results** (159 saved readings, no style picked, Everyday):

| | v3.1 | My r1 proto | r2 package |
|---|---|---|---|
| 8+ ("Sharp" or better) | 53% | 53% | **41%** |
| 9+ | 6% | 6% | **3%** |
| Mean | 7.69 | 7.70 | **7.52** |
| First run per photo, 8+ | 54% | 54% | **44%** |

**10 readings go up:**
- the founder's misread, 3.5 → 5.0
- p02 after, 5.5 → 6.0
- s11 and s20, about +0.5 each (the work boot and focal-point fixes)

**63 go down.** Nearly all are −0.5 from one credit per garment or pinstripes no longer counting (m10, m12, s15, p04–p06, the phone checks). The loungewear cuts:
- s21: 7.0 → 6.0
- s24, m04: 6.5 → 6.0
- s06: 7.0 → 6.5

**Not modeled:** the minimal, prep, smart casual and streetwear detection allowances. They mainly remove the wide-leg P1 hit and would lift about 5–8 readings by 0.5 (m02, s15, s25, m03, m01).

**Net:** clearly down, and in the direction calibration wants. It's still about twice the 20–25% target at 8+, so the remaining gap is a level problem (the 7.0 baseline or the credit sizes) for the gold set to settle. More rules won't close it.
