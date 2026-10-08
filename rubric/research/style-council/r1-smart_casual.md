# Round 1: Smart casual (incl. the quarter-zip / "corporate casual" look)

*Smart casual advocate, Oct 7, 2026. Tested against `extraction-test/rubric.py` v3.1 and the 156 saved readings (52 photos × 3 runs) plus the 4 phone checks. Scratch code: `/private/tmp/.../scratchpad/smart_casual/` (`sc_detect.py`, `overlap_test.py`, `sc_anchors.py`). Point values are what the score moves before half-rounding (fit ×0.8, color/proportion ×0.6, occasion ×1.2).*

**My position in one paragraph.** Smart casual is not a style that needs exemptions. It is the yardstick that v3.1 was already built on. The dressiness ladder, K2 "elevated piece", K4 "shoes that complement", the default band and the big-logo tip all encode smart-casual taste. So smart casual should claim almost **no allowances** (one narrow one, below). Its real jobs are to be the **fallback lens** when no other style is detected, to keep work and interview checks honest, and to admit where its own taste is hard-coded into rules that other styles should not be judged by. My testing also turned up the place where smart-casual outfits are **over-scored today**: one garment can earn two credits.

## 1. Identity

**One line:** "Dressed on purpose, not dressed up." That means collared or zip-neck knit tops, chinos or trousers, leather shoes or clean minimal sneakers, a muted palette and few logos.

- **Absorbs:**
  - the 2025–26 **quarter-zip / "corporate casual"** look: quarter-zips, loafers, relaxed tailoring, gilets, overshirts, muted colors, minimal logos ([CNN via KRDO, Jan 15 2026](https://krdo.com/news/2026/01/15/a-new-generation-of-men-are-dressing-for-success-and-the-quarter-zip-was-just-the-beginning/))
  - business casual done without a suit
  - the "soft blazer + straight trouser" relaxed-tailoring look ([FashionBeans, Apr 7 2026](https://www.fashionbeans.com/article/new-smart-casual-outfits-men-2026))
- **Who wears it (US, 18–30):**
  - college seniors and first-job guys, interviews and dates
  - the quarter-zip wave started with two 21–22-year-olds from the Bronx in a viral TikTok on Nov 5, 2025 ([Complex, Nov 21 2025](https://www.complex.com/style/a/mike-destefano/quarter-zip-viral-fashion-trend-explained))
  - Fortune frames it as Gen Z men rejecting Nike Tech for a "professional" signal in a weak entry-level job market ([Fortune, Nov 20 2025](https://www.fortune.com/2025/11/20/what-is-quarter-zip-trend-matcha-glasses-nike-tech-gen-z))
  - Glossy notes strong uptake among young men of color ([Glossy, Dec 11 2025](https://www.glossy.co/fashion/fashion-briefing-how-fashion-brands-and-non-fashion-brands-are-jumping-on-the-quarter-zip-trend/))
- **How big:**
  - Lyst: quarter-zip demand +31% in Q4 2025 (CNN, above)
  - Google searches for "quarter zips for men" +300%; M&S quarter-zip sales +38% year over year ([M&S press release, Jan 13 2026](https://corporate.marksandspencer.com/newsroom/press-releases/finance-bro-knit-taking-over-2026-introducing-quarter-zip))
  - Glossy cites Google Trends +2,000% over 12 months
  - **Caveat:** no survey gives the share of US men 18–30 who dress this way. These are demand spikes. My judgment: smart casual is the most common *aspiration* among Kitted's target users (interviews, first jobs, dates), even if streetwear basics are what they wear most days.

## 2. Signals table

"Main pieces" means top/outer, bottom and shoes. Accessories are ignored, because watch and belt readings flip between runs (v3 lesson).

| Signal (schema terms) | Strength | Also a signal for | Note |
|---|---|---|---|
| top/outer `quarter_zip`, `knit_polo`, `polo`, `oxford_shirt`, `cardigan` | strong | classic prep (all), minimal (oxford) | The core. Flips seen in the runs stay inside this set |
| outer `unstructured_blazer`, `sport_coat`, `blazer`, `overshirt` | strong | prep (blazer), workwear and minimal (overshirt) | |
| top `sweater`, `dress_shirt`, `camp_collar_shirt`; outer `chore_coat`, `field_jacket`, `overcoat`, `leather_jacket` | medium | minimal, workwear, prep | Shared pieces. They never decide a style alone |
| top `tee`, plain, logo ≤ small | neutral (0) | minimal, everything | A tee + chinos + loafers can still read smart casual through the other two slots |
| bottom `chinos`, `trousers` | strong | prep, minimal | `chinos` ↔ `trousers` and `trousers` ↔ `suit_trousers` flips are harmless here |
| bottom `drawstring_trousers` | medium | minimal | Summer smart casual ([FashionBeans 2026](https://www.fashionbeans.com/article/new-smart-casual-outfits-men-2026)) |
| bottom `jeans` in `denim_dark` / `black` / `charcoal` | medium | minimal, workwear | **Ignore `distressed_by_design` here.** It reads true on faded black/charcoal jeans (s10 all 3 runs; m10 in 2 of 3) |
| shoes `loafer`, `derby`, `chelsea_boot`, `suede_chukka`, `white_leather_sneaker` | strong | prep, minimal | |
| shoes `low_profile_sneaker`, `dress_shoe` | medium | vintage sport (Samba), tailoring | |
| (new field value) `vest_gilet` in subcategory | medium | prep, outdoor | CNN names gilets as a core piece. Today the model has to pick `puffer`, `fleece` or `other` |
| **Negative:** top `hoodie`, `sweatshirt`, `graphic_tee`, `jersey`, `rugby_shirt`, `flannel_shirt`, `fleece`; outer `puffer`, `shell_jacket`, `rain_jacket` | strong veto | streetwear, vintage sport, outdoor, workwear | "Hoodies… strictly for the weekend" sums up the guides (vendor guides, weak) |
| **Negative:** bottom `sweatpants`, `joggers`, `athletic_shorts`, `cargos` | strong veto | vintage sport, streetwear, outdoor | `sweatpants` ↔ `jeans` is the founder's misread. Vetoing on it is safe because the tap question (decision 2) resolves it first |
| **Negative:** shoes `slides_sandals` | veto | lounge | |
| **Negative:** any main piece `logo: large` (clear), `pattern: camo`, or `volume` 5 | veto | streetwear | |
| **Negative:** matching `suit_jacket` + `suit_trousers`/`trousers` (same color) | redirects | tailoring | A suit is the general lens, not smart casual |
| **Weak negative:** shoes `performance_runner`, `chunky_sneaker`, `basketball_sneaker`, `retro_runner`, `canvas_sneaker` | 0 points, no veto | streetwear, vintage sport | Oxford + chinos + gym runners is the classic smart-casual *near miss*. It should be scored as one, not given a different style |
| **Weak negative:** leg `wide` on chinos, `denim_light`/`denim_mid` jeans | 0 points | streetwear, minimal | "A chino that is too wide reads as casual" ([Menswear Online, undated "June 10"](https://www.menswearonline.co.uk/?p=348618)) |

## 3. Detection rule

Computed in code from one reading. There is no second AI call.

```
veto  = any main piece in the negative/veto rows above
        (tank_top vetoes only when there is no outer layer)
suit  = suit_jacket + (suit_trousers | trousers) in the same color  -> not smart casual (general lens)
up    = max over tops/outer: 2 strong, 1 medium, 0 otherwise
bot   = 2 chinos/trousers/suit_trousers · 1 drawstring or dark/black/charcoal jeans · 0 otherwise
shoe  = 2 strong · 1 medium · 0 otherwise (shoes hidden: slot absent)
reads_smart_casual = not veto and not suit
                     and at least 2 slots > 0
                     and (up > 0 or bot == 2)
                     and up + bot + shoe >= 4 (shoes visible) or >= 3 (shoes hidden)
confidence = high if total >= 5, else medium
```

**Tested on saved readings:**
- **15 of 52 photos** read as smart casual, with **0 flips across the 3 runs** (156 readings).
  - A first version that vetoed distressed jeans and needed both suit pieces flipped 1 photo (p03: `trousers` vs `suit_trousers` under a suit jacket). Matching on suit jacket + same-color trousers fixed it.
- **The 15 photos:**
  - m02, m05, m08, m10
  - p01 ×2, p03-after, p05-before, p06 ×2
  - s03, s10, s15, s22, s25
- **Correctly kept out:**
  - every hoodie, sweatshirt, graphic-tee, jogger, shorts and slides look
  - all 6 suits
  - the camp shirt + chinos + retro runners (m03, which totals 3 with shoes visible)
- **Phone checks:**
  - the sport coat + striped shirt + navy trousers + loafers reads **high**
  - the striped shirt + navy suit trousers (shoes hidden) reads **medium**
  - the founder's hoodie outfit is **vetoed** (hoodie, slides)
  - the field jacket + tee + charcoal jeans (total 2) is **not smart casual**; that one belongs to the workwear and minimal advocates
- **Why it's stable:** the model's confusions mostly stay *inside* the set (oxford ↔ dress shirt, chinos ↔ trousers, loafer ↔ dress shoe, white leather ↔ low-profile sneaker). The risky ones cross it:
  - `sweatpants` ↔ `jeans` (resolved by the tap question)
  - `white_leather_sneaker` ↔ `retro_runner` (seen once). This flips the shoe slot 2 → 0 *and* K4 (±0.5 on the score). It is the most dangerous home-piece confusion for smart casual.
- **Doubtful calls:**
  - s15 (plaid overshirt, tucked tee, wide khaki trousers, chunky sneakers) and s03 (all-black sweater, trousers, dress shoes) read medium. Both are honestly closer to minimal/city boy. See look-alikes.
  - s25 (camp collar + drawstring + Chelsea) is resort-minimal. Medium is fine.

## 4. What smart casual excuses, and what it never excuses

**It excuses one thing, narrowly:**
- **SC-A1, relaxed tailoring.** In an outfit that reads as smart casual, with `bottom = trousers` or `drawstring_trousers`, `leg_shape = wide` (or barrel), and smart-casual shoes (or shoes hidden), `P1_leg_vs_style` does not fire.
- **What it's worth:** it removes −0.45 (a full step).
- **The evidence:**
  - 2026 sources describe fuller trousers and relaxed tailoring as the new smart casual ([FashionBeans, Apr 2026](https://www.fashionbeans.com/article/new-smart-casual-outfits-men-2026); CNN, Jan 2026)
  - the sources warn against wide *chinos* (Menswear Online), so chinos and jeans are excluded
- **Test results:**
  - a knit polo + wide brown trousers + loafers goes from 7.5 to 8.0
  - on saved readings it moves only m02 (8.5 → 9.0, Claude's blind estimate 8.5), so it adds about +0.04 to mirror bias
  - s15 is untouched because its chunky sneakers aren't smart-casual shoes
- **Expected overlap:** the minimalist advocate will claim the same allowance. Fine. It should exist once.

**It never excuses:**
- Fit and care: F4 pooling (−0.8; "No stack. No floor-sweep." [RMRS, Jun 2026](https://www.realmenrealstyle.com/slim-vs-wide-trousers/)), F6, F7, F8, F9, F10, L1.
- T1 untucked dress shirt.
- C5 near-match blazer and trousers.
- O1 and S2.
- **I also argue smart casual should *add no penalties by being detected*.** Detection may only grant allowances (decision 1). An outfit that half-reads as smart casual must not be judged more harshly than the general standard.

**Occasion beats style (my strongest structural claim):** at `work`, `work_casual` and every `interview` occasion, the smart-casual lens applies whatever style is detected:
- the *loungewear* (O4) and *big logo* (O3) exemptions of streetwear and vintage sport switch off there
- proportion allowances (oversize, stacking on jeans) stay

That's my judgment, not sourced. It follows the brief's "judge the fit by what it's going for": at an interview, what he's going for is professional.

## 5. Style-specific mistakes and done-well signals

**No new mistakes.** I checked the candidates and dropped them:
- **Athletic shoes with tailoring:**
  - already costs him K4 (0.5), and S1 (−0.45) if the legs are slim
  - oxford + slim chinos + gym runners = **7.0**; with straight chinos = **7.5**
  - that is honest for a near miss, so a new rule would double-punish
- **Quarter-zip over a collared shirt:**
  - Permanent Style (May 2026, snippet) says the collars clash and the knit is best over a T-shirt ([Permanent Style](https://www.permanentstyle.com/2026/05/the-problem-with-quarter-zips.html))
  - Fortune and the trend's own creators treat a button-down underneath as the signature
  - sources split, so no rule and no tip
- **Hoodie under a blazer:**
  - smart-casual guides say no
  - MR PORTER (summary, undated) calls it a reliable way to make streetwear smart
  - it's a mix, and mixing is never penalized; it simply doesn't read as smart casual
- **Distressed jeans with a blazer:** guides say no ([Ape to Gentleman, page dated May 2024, older](https://www.apetogentleman.com/mens-modern-smart-casual/)), but the distressed flag is unreliable on dark denim. Tip at most.

**Done-well signals already have credits:** a collared or zip-neck knit (K1/K2), leather shoes or clean sneakers (K4), a muted palette with one point of interest (K3). Smart casual needs nothing new.

**A credit fix instead: "one garment, one credit."** Today a single quarter-zip earns K1 (knit) *and* K2 (dressiness 3). A single white leather sneaker earns K2 *and* K4. The only blazer earns K1 *and* K2. The proposed rule:
- K1 claims the layer (or the knit top)
- K4 claims the shoes
- K2 needs a *different* piece at dressiness 3 or above

This is a fix inside the cap, not a new credit. Tested (everyday, 50/50 minimal + smart casual, the v3 test mix):
- **Saved readings:** 14 of 156 readings move, every one by −0.5: p06-before, s26, m07, m10, m12.
- **Mirror set vs Claude's blind estimates:**
  - mean bias drops from **+0.58 to +0.47**
  - mean absolute error drops from **0.67 to 0.56**
  - with SC-A1 included: about 0.60 error and +0.51 bias
- **Anchor effects:**
  - navy quarter-zip + dark jeans + white leather sneakers: 9.0 → **8.5**
  - tee + dark jeans + white leather sneakers: 8.0 → **7.5**
  - blazer + tee + dark jeans + white leather sneakers: 9.0 → 8.5
  - the full blazer + oxford + chinos + chukkas look keeps **9.5**
- **Caveats:**
  - the estimates are Claude's and the set is the one v3 was tuned on
  - **p06-before** loses K2 only because its chinos are hidden (upper-only framing), which widens a before/after gap. The calibration member should weigh that.

## 6. Anchor outfits (everyday, no style picked)

Each anchor shows today's score / the score under "one garment, one credit," checked with `rubric.py`.

| Band | Outfit (schema terms) | Today / 1-credit | Why |
|---|---|---|---|
| **~4** | `dress_shirt` white, volume 4, untucked `below_crotch`, `covers_hand`, **stained**; `chinos` khaki slim **pooling**; `chunky_sneaker` | 4.0 / 4.0 | Stain, too big, sleeves, pooling, chunky shoe on a slim leg. Smart pieces, every fit and care fault. "Needs a fix" is right |
| **~5.5** | navy `blazer`; white `dress_shirt` untucked, `shows_below_outer`; black `trousers` straight **pooling**; black `performance_runner` | 5.5 / 5.5 | The classic "smart casual done wrong": shirt tail under the blazer, untucked dress shirt, near-match navy/black, pooling. Layers earn credit, and the faults outweigh it |
| **~6.5** | light-blue `oxford_shirt` untucked `below_crotch`; khaki `chinos` slim **pooling**; brown `loafer` | 6.5 / 6.5 | The right pieces with two visible fit faults (shirt too long, pooling). "Getting there" |
| **~7.5** | white `tee`; `jeans` `denim_dark` straight `slight_break`; `white_leather_sneaker` | 8.0 / **7.5** | Clean basics plus one considered shoe. Today the sneaker is counted twice (K2 + K4). 7.5 "Put together" is honest |
| **~8.5** | navy `quarter_zip` (small logo); `jeans` `denim_dark` straight; `white_leather_sneaker` | 9.0 / **8.5** | The trend uniform done right: a layer and a matched shoe, but plain and no point of interest. "Sharp," not "Dialed in" |
| **~9.5** | navy `unstructured_blazer`; light-blue `oxford_shirt`, small stripes, tucked; khaki `chinos` straight `slight_break`; brown `suede_chukka` | 9.5 / 9.5 | Layer, elevated pieces, one pattern as the point of interest, shoes matched to the outfit. The top of the scale today |

Extra calibration points:
- grey quarter-zip + navy chinos + loafers: 9.0 both ways (raw 8.75 rounds up). I'd accept 8.5–9.0.
- tee + chinos + white leather sneakers: 8.0 both ways. **I'd put it at 7.5**, so the calibration member should check whether chinos alone earning K2 is too cheap.

**The founder's outfit through my lens** (grey hoodie, black wide jeans with a belt, black slides with socks; corrected reading):
- It does **not** read as smart casual (hoodie and slides veto it), and the smart-casual lens should not judge it.
- General lens: 6.0 with the hem read as `pooling`, 6.5 as `full_break`. With streetwear allowances: 7.0. Nothing in the photo earns a credit.
- My own estimate is **6.5**. Hoodie + wide jeans is a valid relaxed base. The slides (dressiness 1) are the weakest link, and no style's allowance should fix that.
- Not a 3, not a 9: the founder's instinct holds.

## 7. Look-alikes and tie-breakers

**Rule of thumb:** smart casual grants almost nothing, so losing a tie costs a smart-casual outfit nothing. **Smart casual should lose every tie it's in.** It is the fallback label.

- **Classic prep** (the biggest overlap: polo, oxford, chinos, loafers, quarter-zip).
  - Prep wins when there's a prep-only signal: `rugby_shirt`, `shorts` with a polo or oxford, a stripe or plaid on a collared top *plus* a second classic pattern, or a navy `blazer` + light chinos.
  - Otherwise label it smart casual. The score is identical either way.
- **Minimalist.**
  - Minimal wins when every main piece is neutral and solid, no logos show, and there's no collared or zip-neck top (tee/sweater + trousers + white sneaker/loafer).
  - It also wins when the top is `volume` 4+ or the legs are wide with a non-smart shoe (s15, s03).
- **Workwear.**
  - Workwear wins when the bottom is `jeans`/`cargos` *and* the shoes are `work_boot`, or when the outer layer is `chore_coat`/`field_jacket`/`denim_jacket` over a non-collared top.
  - An overshirt + chinos + loafers stays smart casual.
- **Tailoring / suits.** A matching suit is not smart casual. It gets the general lens plus the occasion rules (O1 too formal at everyday already exists).
- **Streetwear "smartened"** (hoodie under a blazer): streetwear or a mix, never smart casual. No penalty for the mix.

## 8. Fields the model can't read reliably, and what to do

| Smart casual depends on | Problem | Do instead |
|---|---|---|
| Fabric (merino vs acrylic, piqué, polyester golf quarter-zips) | Not readable; a shiny performance quarter-zip reads as `quarter_zip` | Accept it. Never score fabric. Tips only |
| Jean wash (`denim_dark` vs `denim_mid`) | Changes dressiness 2.5 ↔ 2 and my bottom slot | The detector gives dark jeans only 1 point, so a flip rarely changes the label |
| `distressed_by_design` on dark jeans | Reads true on faded black/charcoal (s10, m10) | Ignore it for smart-casual detection; keep its current care-rule use |
| `white_leather_sneaker` vs `retro_runner` / `low_profile_sneaker` | One run flipped WLS → retro runner; K4 swings ±0.5 | Back the report's `shoe_profile` (sleek / regular / chunky / not visible) as the stabilizer; consider dressiness 2.5 for `retro_runner` (calibration call) |
| `oxford_shirt` vs `dress_shirt` | Both count, but `dress_shirt` turns on T1 (untucked, −0.6) under any blazer | Let T1 skip `unstructured_blazer` unless the occasion is dressy (my judgment) |
| Tuck under a quarter-zip or sweater | Invisible | Never score it (already true) |
| Gilets / vests | No subcategory | **(new field value)** `vest_gilet` in `subcategory`: counts as a layer for K1, dressiness 2.5 |
| Brand ("finance bro" Patagonia vest, polo pony) | Not readable | Never. Logo size only, and only as a tip outside work |

## Where smart casual should NOT be the default lens

These rules carry smart-casual taste into every style. Each style's advocate should claim its own counterpart; the cap stays at 2.25.

1. **K2 "elevated piece"** means dressiness 3+, the smart-casual ladder.
   - Streetwear, vintage sport and outdoor home pieces sit at 1–2, so they can never earn it.
   - The best streetwear outfit I could build (boxy hoodie, bomber, wide cargos, chunky sneakers, one red piece) scores **6.5** with no style picked and **8.5** with streetwear. A smart-casual outfit of the same quality scores 9.5.
2. **K4 "shoes that complement"** needs a shoe at 2.5+. So a work boot under a chore coat, or a chunky sneaker matched to wide cargos, can never "complement."
3. **The default band** (top 2–3.5, slim → relaxed) is effectively the smart-casual band. Detected styles should replace it, not just nudge it.
4. **F6 and F8** (long and oversized tops) are smart-casual fit rules. They are right for collared shirts and wrong for an intentionally boxy tee or hoodie.
5. **But not at work or interviews.** There, smart casual *should* be the lens (section 4).

## 9. Sources

| Source | Date | Used for | Quote (under 15 words) |
|---|---|---|---|
| [CNN (Steve Salter) via KRDO](https://krdo.com/news/2026/01/15/a-new-generation-of-men-are-dressing-for-success-and-the-quarter-zip-was-just-the-beginning/) | Jan 15, 2026 | Pieces of the look; Lyst +31% | "When you put it on, you feel more professional." (Richard Minor) |
| [Fortune (Nick Lichtenberg)](https://www.fortune.com/2025/11/20/what-is-quarter-zip-trend-matcha-glasses-nike-tech-gen-z) | Nov 20, 2025 | Gen Z, quarter-zip vs Nike Tech, button-down under | "This is not a trend, this is not a challenge, this is a movement." |
| [Complex (Mike DeStefano)](https://www.complex.com/style/a/mike-destefano/quarter-zip-viral-fashion-trend-explained) | Nov 21, 2025 | Origin (Nov 5 TikTok), part-satire | "I just wanted to wear something that didn't feel like I was overdressing." |
| [Glossy (Danny Parisi)](https://www.glossy.co/fashion/fashion-briefing-how-fashion-brands-and-non-fashion-brands-are-jumping-on-the-quarter-zip-trend/) | Dec 11, 2025 | Google Trends +2,000%; who wears it | — |
| [M&S press release](https://corporate.marksandspencer.com/newsroom/press-releases/finance-bro-knit-taking-over-2026-introducing-quarter-zip) | Jan 13, 2026 | Searches +300%, sales +38% (UK retailer; global search) | — |
| [Permanent Style](https://www.permanentstyle.com/2026/05/the-problem-with-quarter-zips.html) (snippet; 403 on fetch) | May 2026 | Quarter-zip + shirt collar clash | — |
| [FashionBeans](https://www.fashionbeans.com/article/new-smart-casual-outfits-men-2026) | Apr 7, 2026 | Relaxed tailoring; straight/relaxed replace slim | "Looking more put together is not about doing more…" |
| [Real Men Real Style (Antonio Centeno)](https://www.realmenrealstyle.com/slim-vs-wide-trousers/) | updated Jun 22, 2026 | Relaxed-straight sweet spot; no stack on trousers | "No stack. No floor-sweep." |
| [Menswear Online, "The Smart Casual Guide"](https://www.menswearonline.co.uk/?p=348618) | "June 10" (year not shown; likely 2025) | Excludes hoodies and trainers; wide chinos read casual | "A chino that is too wide reads as casual" |
| [Ape to Gentleman (Paddy Maddison)](https://www.apetogentleman.com/mens-modern-smart-casual/) | page dated May 2024 (**older**) | No graphics or distressing; balance | "Keep smarter pieces relaxed and more relaxed pieces smart." |
| Vendor guides (Taelor, StudioSuits; search snippets, undated) | — | Running and chunky sneakers off-balance (weak) | — |
| MR PORTER "make streetwear smart" (summary via `notes/style_archetypes.md`, undated) | — | Hoodie under a blazer is legitimate | — |

**My own judgment, not sourced:** the detector's weights and thresholds, the veto list, "occasion beats style," "smart casual loses every tie," every anchor score, and the founder-outfit estimate. All point values remain guesses until the gold set's pairwise rankings exist.
