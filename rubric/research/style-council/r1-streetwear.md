# Round 1: Streetwear (advocate)

*Oct 7, 2026. Absorbs skater, Y2K, grunge and techwear. Every score below comes from running `rubric.py` v3.1 and my patched copy, `r1-streetwear-proto.py` (this folder; switches are in `FLAGS`). Unless noted, scores are for everyday wear with no style picked. Anything marked "my judgment" is not sourced.*

**Bottom line.** Today's rubric under-scores real streetwear by 1.5 to 2.5 points unless he tapped Streetwear first. A boxy graphic tee, baggy jeans and Dunks scores 5.0 with no pick. On the same reading it scores 7.5 with streetwear allowances. It also over-punishes loungewear by stacking six rules on one pair of sweatpants. That is how the founder's outfit, misread as sweatpants, fell to 3.5.

**The line between streetwear and loungewear, in one sentence:** streetwear always has at least one structured anchor (denim or cargo pants, a real jacket, or a street sneaker or boot), its volume is on purpose and resolved (the shoe's weight matches the leg, and the hem rests on the shoe instead of dragging), and it is clean. Fleece-and-jersey pieces with house shoes are loungewear, whatever the logo says.

## 1. Identity
- **In one line:** relaxed, volume-forward casualwear built on hoodies, graphic tees, baggy denim or cargos and statement sneakers. Logos and graphics are part of the vocabulary, not a fault.
- **Absorbs:**
  - **Skater:** wide jeans or cargos and canvas skate shoes.
  - **Y2K:** baggy denim, loud graphics, retro runners.
  - **Grunge:** flannel over a tee, faded or distressed denim, boots.
  - **Techwear:** all-dark shells, cargos and joggers, technical runners.
- **Who wears it:** US men 18–30, mostly college age. It's the default "dressed" look for guys who don't think of themselves as dressing up. The founder is one of them.
- **How big it is (honest):** there is no clean US 18–30 share. Market-research figures for 2025 global streetwear disagree by almost 2× ($210B to $371B; [Mordor](https://www.mordorintelligence.com/industry-reports/streetwear-industry), [Fortune BI](https://www.fortunebusinessinsights.com/streetwear-market-110565)), so treat them as noise. Pinterest's Sept 9, 2026 Men's Trend Report has **no** streetwear or skater line at all; workwear dominates it ([Pinterest](https://newsroom.pinterest.com/news/men-trend-report-2026/)). Editorial signals are still strong:
  - Highsnobiety (2025): "Streetwear is getting loud again" ([Highsnobiety](https://www.highsnobiety.com/p/streetwear-graphics-2025/)).
  - Complex (Jul 17, 2026): "Exaggerated, barrel jeans are definitely a big trend right now" ([Complex](https://www.complex.com/style/a/mike-destefano/jeans-buyers-guide-2026)).
  - A counter-signal: Highsnobiety's 2025 trend piece says pant widths have "settled in the middle" ([Highsnobiety](https://www.highsnobiety.com/p/menswear-trends-2025/), about early 2025). Ultra-baggy is cooling for the mainstream, not for streetwear.

  My judgment: it's big enough to keep as an option. It is less dominant than it was in 2021–23, and its "grown-up" version is blending into workwear and minimal.

## 2. Signals table (schema terms)
"Upper," "bottom" and "shoes" are the three slots the detector reads.

| Signal | Strength | Also signals | Note |
|---|---|---|---|
| top `hoodie`, `sweatshirt`, `graphic_tee` | **strong** (upper) | vintage sport (sweatshirt) | The upper body must carry a street piece |
| outer `bomber`, `puffer`; any outer at `volume` ≥4 | **strong** (upper) | outdoor (puffer) | |
| outer `denim_jacket`, `leather_jacket`, `shell_jacket`, `rain_jacket`, `fleece` | medium | workwear, outdoor | |
| plain `tee`/`tank_top`/`jersey` over relaxed/wide jeans or cargos | medium | minimalist | Counted so the score doesn't hinge on `tee` vs `graphic_tee`, which flip between runs |
| bottom `jeans`/`cargos` with `leg_shape` relaxed/wide/barrel | **strong** | workwear, outdoor | The volume gate |
| bottom `sweatpants`/`joggers`/`athletic_shorts` | medium, **only with an anchor** | vintage sport, loungewear | Without an anchor, this is loungewear |
| bottom `shorts` relaxed/wide (jorts) | medium | vintage sport | |
| shoes `chunky_sneaker`, `basketball_sneaker`, `canvas_sneaker` | **strong** | vintage sport (basketball) | |
| shoes `retro_runner`, `performance_runner`, `work_boot`, `low_profile_sneaker` | medium | vintage sport, outdoor, workwear | |
| `pattern` graphic or camo, or `logo` large, on a main piece | medium | vintage sport, outdoor | |
| Techwear: shell/rain jacket + cargos/joggers/sweats, all main pieces black/charcoal/grey/navy/olive | strong (counts as upper) | outdoor | Palette is the tie-breaker |
| `distressed_by_design` denim | weak | workwear, vintage | Never penalized (exists) |
| **Negative:** any `blazer`, `sport_coat`, `suit_*`, `trousers`, `dress_shirt`, `overcoat`; `dress_shoe`/`derby`/`loafer` | **veto** | — | Tailoring means it's not streetwear |
| **Negative:** `leg_shape` skinny | **veto** | — | Skinny legs under a big top is the "done badly" sign |
| **Negative:** `polo`/`knit_polo`/`oxford_shirt`/`cardigan`/`rugby_shirt` as the top with no jacket | strong (−0.5, and blocks) | prep, smart casual | |
| **Negative:** `chinos` | weak (−0.5) | smart casual | |
| `slides_sandals` | neutral | loungewear | Not an anchor and not a veto (see §5) |

## 3. Detection rule (computed in code, no AI label)
**Reads as streetwear when all of these hold:**
1. **No veto:** no tailoring, no dress shoes, no skinny leg, and the top isn't a prep top worn without a jacket.
2. **Upper-body street piece** (upper slot scores ≥0.5).
3. **Volume on purpose:** a relaxed or wide leg, or a top or outer layer at `volume` ≥4, or the techwear pattern.
4. **Evidence of at least 2.0** (strong = 1, medium = 0.5, graphic/logo adds 0.5, negatives subtract), with **at least one strong signal**.

**Separately, the "anchor":** any outer layer, or shoes that are chunky, basketball, canvas, retro runner, low-profile, white leather or work boot. Sweats and gym shorts count toward streetwear only when an anchor is present.

**When it's right, and how stable it is** (tested on all 161 saved readings: 40 stock + 12 mirror photos × 3 runs, plus 4 phone checks):
- **What it detects:**
  - p02 (beige hoodie + sweats set, chunky sneakers or boots)
  - s21 (black shell + sweats + runners, the techwear path)
  - m01 (graphic tee + jeans + Dunks)
  - the founder's outfit with the pants read correctly as jeans
- **What it rejects:** s12/s04/s20 (hoodie or graphic tee with *straight* jeans). This is correct: nothing in them needs an allowance.
- **Stability:** 0 detection flip-flops across the 3 runs of any photo.
- **The fragile field is `leg_shape` straight vs relaxed.** In a sensitivity test (one field nudged one step), it flipped detection on s04/s12/s20/m07, usually moving the score 0–0.5 (s04: 6.5 → 7.5).
- **The single most damaging misread is jeans ↔ sweatpants.** It moves the founder's outfit 6.5 ↔ 5.0 and flips detection.
- **Confidence:** high for the vetoes and the sweats/anchor logic; medium for the volume gate.

## 4. What streetwear excuses, and what it never does
**The core change:** allowances switch on when the outfit *reads as* streetwear (founder rule 1), not when `streetwear` weight ≥0.5. A pick alone should no longer unlock anything.

| Rule | Today | Under streetwear |
|---|---|---|
| `F4_pooling` | −0.8 | 0 for relaxed/wide jeans, cargos or sweats **when the shoe can hold a stack** (sneaker or boot). **−0.4 with slides or sandals** (new: the hem drags on the floor). 0 if shoes are hidden |
| `F6_top_too_long`, `F8_too_big` | −0.8 / −0.6 | 0, but only for hoodies, tees and sweatshirts (garments confirm; never an oxford or flannel hanging long) |
| `F9_sleeves_cover_hands` | −0.4 | −0.2 for hoodies and sweatshirts (exists) |
| `P1` bands | default 2–3.5 / slim→relaxed | streetwear band: top 3–5, legs straight→wide |
| `P3_everything_oversized` | −0.3 | 0 (exists) |
| `C3_bright_clash` | −0.6 | −0.3 (exists) |
| `B1` focal points | allowance 1.5 | +1 (exists). But `K3` no longer pays out for loudness the style merely tolerates (§5) |
| `C4b` 3+ patterns | −0.6 | 0 (exists); see the new `C6` instead |
| `O4_loungewear_out` | −0.6, or 0 for streetwear | **−0.3 with an anchor; the full −0.6 without one.** Today's full exemption is too generous: p02's sweatsuit would score 7.0, and I'd put it at 6.5 |
| `O3_large_logo` | tip | tip (exists) |
| `F7` worn | −0.4 | scuffed sneakers −0.2 (exists); distressed denim 0 (exists) |

**Never excused:**
- Stains (−1.2) and wrinkles.
- Pilling and lint on clothes (shoe scuffs only).
- Visible strain.
- A hem dragging on the floor.
- Sleeves over the hands on anything but a hoodie or sweatshirt.
- Occasion gaps: a hoodie at an interview is still `O1`.
- `S2` (sneakers under a suit).
- A skinny leg under a huge top.

Brand, hype and price are never read and never scored.

## 5. Style-specific mistakes and done-well signals
**New mistakes:**
- **`C6` Competing statements (−0.3):** a graphic, camo or large-logo top **and** a loud bottom (camo, graphic, large pattern). "One graphic focal point" is the done-well rule (`notes/style_archetypes.md`). A graphic tee + camo cargos + multicolor Jordans goes from 8.0 to 7.0.
- **Stack needs a shoe (in `F4`, −0.4):** a vendor guide puts it as "a puddle is fabric lying flat on the ground" ([The Baggy Jeans, Aug 22, 2026](https://thebaggyjeans.com/blogs/news/baggy-jeans-stacked-hem), a vendor, so moderate weight). Counter-evidence: Complex (2021, older) says not to worry about baggy pants "draping over your sandals" ([Complex](https://www.complex.com/style/a/mike-destefano/how-to-wear-sandals-like-celebrities)).
- **`S3` Slides under jeans or cargos (−0.3), low confidence, my judgment.** The sources lean the other way: socks with sandals is "an absolute go-to in 2025" ([Highsnobiety](https://www.highsnobiety.com/p/socks-and-sandals-for-men/)). But "the right shoe saves the whole look" ([Man of Many, Jul 9, 2026](https://manofmany.com/style/mens-style-relaxed-fit-guide)), and I don't think slides under denim earn a 7.0 "Put together." Turn it on only if the gold-set panel agrees. Without it, the founder's outfit still scores 6.5 when the hem reads as pooling.
- **`K3` stricter (general):** no point-of-interest credit when a color mistake fired, or when focal points exceed his base boldness. Without this, red hoodie + cobalt cargos + yellow sneakers earned the credit; with it, it lands at 6.5, not 7.0. This changed **no** non-streetwear saved score.

**Done-well credit, a swap inside the 2.25 cap rather than a new credit:**
- **`K4` alternative trigger:** chunky, basketball or canvas sneakers under relaxed or wide **jeans or cargos** count as "shoes that complement." It applies to everyone, not only detected streetwear, so detection flips don't swing it.
- Why: today `K4` needs dressiness ≥2.5, so streetwear's home shoes can never earn it. That's a structural 0.5 handicap.
- Evidence: "Big and chunky sneakers have almost become the norm" with wide legs ([Highsnobiety sneakers guide](https://www.highsnobiety.com/p/sneakers-pants-styles-guide/), about 2023, older). The MR PORTER baggy-jeans guide (snippet) says chunkier shoes need straight or baggier legs. It's the mirror image of the report's "wide leg + sleek shoe" rule.
- Not credited: sweats (that's loungewear) and slides.

**General fix I need from common ground, the loungewear cap:** a loungewear outfit is one verdict. Loungewear here means a lounge bottom + a soft top (hoodie, sweatshirt, tee, tank, jersey), no layer and no anchor shoe, outside Gym/Home. Its overlapping hits (`O1` + `O4` + `P1` leg + `P3` + `F4`) are capped at **−2.0 total**. On the founder's misread these summed to −3.65. Care and fit faults still add on top.

## 6. Anchor outfits (everyday, no style picked; v3.1 → prototype)
| Target | Outfit (schema) | v3.1 | Proto | Why |
|---|---|---|---|---|
| ~4 | grey `hoodie` (vol 4, **stained**) + black `sweatpants` wide **pooling** + `slides_sandals` | 3.0 | 3.5 | Loungewear (no anchor), capped at −2.0, plus the stain −1.2. A stain is never excused. I'd accept 4.0 |
| ~5.5 | black `hoodie` vol 5, `below_crotch`, `covers_hand` + `jeans` **slim**, full break + `chunky_sneaker` | 4.5 | 5.5 | Reads as streetwear, done badly: slim leg vs the band −0.45, chunky shoe with a narrow leg −0.45, sleeves −0.2, full break −0.2 |
| ~6.5 | **Founder:** grey `hoodie` (small logo) + black `jeans` **wide**, pooling over `slides_sandals` (socks) | 6.0 (7.0 if Streetwear tapped first) | **6.5** | Coherent silhouette with a clean hoodie, but the stack has nothing to rest on and slides add nothing. Fix: chunky or skate sneakers → **7.5** |
| ~7.5 | white `graphic_tee` vol 4 + `jeans` denim_light **wide** + `basketball_sneaker` | 5.0 | 7.5 | Volume on purpose, shoe weight matches the leg (`K4`), one graphic |
| ~8.5 | black `bomber` + grey `hoodie` + `jeans` denim_dark wide, full break + white `chunky_sneaker` | 7.0 | 8.5 | Layer (`K1`) + resolved proportion (`K4`) |
| ~9.5 | olive `chore_coat` + **red** `hoodie` + dark wide `jeans` + `chunky_sneaker` | 8.0 | 9.5 | "Grown-up streetwear": one elevated piece (`K2`), one accent (`K3`), all four credits |

**The founder's photo, every reading:**

| Reading | v3.1 | Proto |
|---|---|---|
| As misread (sweatpants) | 3.5 | **5.0** (loungewear cap) |
| Read as jeans | 6.0 | **6.5** |
| Jeans + sneakers | 6.0 | 7.5 |
| Jeans + sneakers + a bomber | 7.0 | 8.5 |

His "not a 3, not a 9" fits 6.5. What I saw in the photo: the hoodie ends around mid-fly; the jeans stack over the slides and reach the floor at the heel; there are small lint specks on the jeans that the model read as "clean."

## 7. Look-alikes and tie-breakers
- **Vintage sport / athleisure:** they share sweatshirts, sweats, basketball and retro shoes.
  - Tie-breaker: a jersey, rugby or track piece with a straight leg and a low-profile or retro sneaker reads as vintage sport.
  - A hoodie, graphic tee or bomber with a wide denim or cargo leg and a chunky, basketball or skate shoe reads as streetwear.
  - I expect pushback here: I think vintage sport's **full** `O4` exemption is too generous for the same reason as above.
- **Workwear:** they share denim jackets, cargos, work boots and Carhartt. Tie-breaker: the upper piece (hoodie or graphic → street; chore coat, flannel or field jacket over a plain tee → workwear) and the shoe (work boot → workwear). My 9.5 anchor (a chore coat over a hoodie) sits on this line on purpose; either style should score it the same.
- **Outdoor / gorpcore:** they share shells, fleece, puffers and cargos. Tie-breaker: palette (all dark → techwear/street; earthy or bright → outdoor) and shoes (`performance_runner` is ambiguous until a trail-shoe type exists).
- **Minimalist / city boy:** they share a boxy black tee and wide legs. Tie-breaker: `trousers` veto streetwear, so a wide-trouser look goes to minimal; jeans or cargos + chunky sneakers go to street.
- **Loungewear (not a style):** the anchor rule above.
- **For the mediator:** detection only has to be right where it changes the score. A hoodie + straight jeans scores the same either way.

## 8. Fields the model can't read reliably
| Need | Problem | Instead |
|---|---|---|
| **Jeans vs sweatpants** on dark, solid, wide bottoms | Misread on the founder (`certainty: likely`); a 1.5-point swing | Founder rule 2's tap: "Jeans or sweatpants?" when the bottom is jeans, sweatpants, joggers or cargos, the color is black, charcoal or navy, certainty isn't `clear`, and swapping it changes the score by ≥0.5. **(new field) `waistband`**: belt_or_loops / elastic_drawstring / not_visible. It's coarse, it's often visible (he wore a belt), and it can trigger the tap when it conflicts with the subcategory |
| Stacked vs pooling | Untested; the report proposes a `stacked` hem value | Support `stacked`. In this proto it matters only with slides |
| `leg_shape` straight vs relaxed | Flips detection (sensitivity test) | Require two signals, never one field alone (already done) |
| `tee` vs `graphic_tee`; `volume` 3 vs 4 | Known flips | A plain tee over loose denim counts half; a big plain tee alone counts nothing |
| Fabric weight, drape, "heavyweight" hoodie | Unreadable; it is the core of the 2025 "grown-up" look ("fabrication... as critical, if not more so, than its branding," [Highsnobiety](https://www.highsnobiety.com/p/grown-up-streetwear/), about 2024) | Don't score it. Mention it as a tip at most |
| Brand, hype, sneaker model | Unreadable and unfair | Never score |
| Lint and small marks, sock color | Too small at phone resolution | Ignore |

## 9. Sources
- Man of Many, Ally Burnie, "How To Style The Relaxed Fit Trend Without Looking Messy," Jul 9, 2026. Quote: "When one part of your outfit is loose, another part needs to stay contained." https://manofmany.com/style/mens-style-relaxed-fit-guide
- Complex, Mike DeStefano, jeans buyer's guide, Jul 17, 2026. https://www.complex.com/style/a/mike-destefano/jeans-buyers-guide-2026
- Highsnobiety, Tayler Adigun, "Streetwear Clears Its Throat, Declares Graphics Back," about 2025. https://www.highsnobiety.com/p/streetwear-graphics-2025/
- Highsnobiety, Maximilian Migowski, "What Are Men Wearing in 2025?," about early 2025. https://www.highsnobiety.com/p/menswear-trends-2025/
- Highsnobiety, Adam Mark, socks-and-sandals guide, about 2025. https://www.highsnobiety.com/p/socks-and-sandals-for-men/
- Highsnobiety, Jake Silbert, "When Did Streetwear Get So Grown Up?," about 2024 (older). https://www.highsnobiety.com/p/grown-up-streetwear/
- Highsnobiety, Tom Barker, sneakers-and-pants guide, about 2023 (older). https://www.highsnobiety.com/p/sneakers-pants-styles-guide/
- The Baggy Jeans (a vendor), stacked-hem guide, Aug 22, 2026. https://thebaggyjeans.com/blogs/news/baggy-jeans-stacked-hem
- Complex, how celebrities wear sandals, Jul 16, 2021 (older; counter-evidence). https://www.complex.com/style/a/mike-destefano/how-to-wear-sandals-like-celebrities
- Pinterest 2026 Men's Trend Report, Sept 9, 2026 (no streetwear data). https://newsroom.pinterest.com/news/men-trend-report-2026/
- MR PORTER, "How To Style Baggy Jeans" (403; search snippet only, undated). https://www.mrporter.com/en-us/journal/fashion/how-to-style-baggy-jeans-straight-leg-trousers-10656296
- InsideHook, Josh Sims, sweatpants as the new jeans, Sep 12, 2024 (older). https://www.insidehook.com/style/sweatpants-became-jeans-21st-century
- Market-size reports (inconsistent; low weight): Mordor Intelligence, Fortune Business Insights (links in §1).
- Repo: `notes/style_archetypes.md` (the streetwear profile), `proportions-color-style.md` (the stacked, shoe-profile and "style unlocks, garments confirm" findings).
- GQ and Esquire were blocked for the fetcher and searcher; nothing here is quoted from them.
