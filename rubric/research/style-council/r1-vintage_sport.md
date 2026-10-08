# Round 1: Vintage sport advocate

*Oct 7, 2026. Written for the style council. Prototype code: `r1-vintage_sport_proto.py` (a copy of `rubric.py` v3.1 with every proposal below patched in) and `r1-vintage_sport_check.py` (re-scores the saved readings and the anchors; run `/usr/bin/python3 rubric/research/style-council/r1-vintage_sport_check.py` from the repo root). Every score quoted below comes from those two files. Score effects are what the final number moves before half-rounding (occasion bucket ×1.2, fit ×0.8, color and proportion ×0.6).*

**The headline.** Vintage sport is the one style where athletic pieces are the point, so it has to hold the line on loungewear for everyone else. Today it does the reverse. Tapping "Vintage sport" switches off the loungewear rule for *any* outfit, so a rain jacket, sweatpants and running shoes for errands (s21) jumps from 7.0 to **8.0 "Sharp"** just because of the tap. My rule: **athletic pieces are a style when they come with one dressed piece and a real shoe. Without those, they're loungewear, whatever he picked.** In the 160 saved readings, zero outfits read as vintage sport. That's correct, because none has a jersey, rugby shirt or track top. It also means the positive side of this rulebook is tested only on made-up anchors.

---

## 1. Identity

**One line:** sport pieces worn as daywear. One "hero" sport piece (football shirt, rugby shirt, track jacket, track pants) goes with denim or a clean layer and a retro, low-profile sneaker.

**Absorbs:**
- Blokecore / terrace (football shirts, baggy Levi's, Sambas/Gazelles)
- Rugby shirts on the sporty side (with jeans or sweats; with chinos and loafers they belong to prep)
- Retro tracksuits (Firebird-style track tops and pants)
- Athleisure / "sport off duty" (sweatpants or track pants dressed up with a coat, knit or quarter-zip)
- Retro sport shorts (short nylon shorts with a real top and Sambas)
- Depop's "Romanticized Sports" (jerseys with tailoring)

**Who wears it (US, 18–30):** college guys who watch football (soccer), NBA and NFL fans moving into soccer shirts, gym-goers who want their sweats to look intentional, and TikTok/Pinterest trend followers. The 2026 World Cup in the US is the biggest driver.

**How big (no source gives a US 18–30 share; these are trend signals):**
- Pinterest's Summer 2026 report (global): "world cup shirt" searches up 840%, "jorts jersey outfit" up 130%, striped polos up 393% ([FashionUnited, May 26, 2026](https://fashionunited.com/news/fashion/pinterest-trend-report-sport-to-shape-summer-2026-far-beyond-the-playing-field/2026052672586)).
- "Vintage soccer jersey" queries up 200% year on year (Pinterest, via [The Spinoff, Jul 8, 2026](https://thespinoff.co.nz/sports/08-07-2026/are-football-jerseys-an-unkillable-fashion-trend)).
- Depop's 2026 report names "Romanticized Sports": sport moving into "a new form of playful, soft-edged athleticism" ([Depop, Dec 19, 2025](https://news.depop.com/company-news/depop-unveils-2026-fashion-trends-report-the-edited-self/)).
- **Counter-signal:** "Athletic wear in everyday life looks passe." ([Bloomberg Opinion via Qatar Tribune, Jan 26, 2026](https://www.qatar-tribune.com/article/216005/opinion/want-to-keep-your-job-buy-yourself-a-blazer)). The same piece says sweatpants are still America's fastest-growing clothing category (Circana), possibly driven by women.
- **Timing risk (my judgment):** Kitted launches about Nov 17, four months after the World Cup final. Jersey hype may be past its peak; sweats-dressed-up is the steadier half of this style.

## 2. Signals table

"Hero" = jersey, rugby_shirt, track_jacket. "Anchor bottom" = jeans, cargos, chinos, shorts, trousers, drawstring_trousers.

| Signal (schema terms) | Strength | Also a signal for | Note |
|---|---|---|---|
| `jersey` (top) | **strong** | streetwear (NBA/NFL jerseys) | The defining piece. Needs a prompt definition (below) |
| `track_jacket` **(new value)** in outerwear | **strong** | streetwear | Zip track top in tricot/nylon, often with sleeve stripes. Not a zip hoodie |
| `track_pants` **(new value)** in bottom | strong | streetwear, minimal (city boy wears track pants under coats) | Side-stripe or tricot sport pants. Not fleece |
| `rugby_shirt` | medium | **classic prep** (strong there) | Mine only with jeans, cargos, shorts or athletic bottoms, or with a retro shoe |
| `low_profile_sneaker` (Samba/Gazelle) | **strong** as support | minimal, smart casual, classic prep | The blokecore shoe. Can't detect the style alone |
| `retro_runner` | medium as support | streetwear, minimal | |
| `sweatpants`, `joggers` | weak (needs company) | streetwear, minimal | Loungewear unless dressed (see detection) |
| `athletic_shorts` | weak | streetwear, gym | Only with a dressed top + retro shoe |
| `hoodie`, `sweatshirt` | weak | streetwear, minimal, everyone | Fleece doesn't count as a "dressed upper" |
| `logo: large` on a hero piece | weak | streetwear, outdoor | Crests and sponsors come with the garment |
| Bright `saturation` on one hero piece | weak | streetwear | Team color as the point of interest |
| `leg_shape` relaxed/wide on jeans | weak | streetwear, workwear, minimal | Baggy Levi's are home |
| **Negative:** `performance_runner` with athletic bottoms | strong against | (gorpcore may object) | Reads as training kit |
| **Negative:** `slides_sandals` out of the house | strong against | — | Slides are a "home" shoe in every style here |
| **Negative:** `jersey` + `athletic_shorts` | **veto** | — | A full kit. Lyst: "no football socks, and no athletic shorts." ([Jun 10, 2026](https://www.lyst.co.uk/stories/how-to-style-football-shirts-mens/)) |
| **Negative:** `tank_top` as the only top | veto | gym | |
| **Negative:** `rugby_shirt` + chinos/trousers + loafer/derby | hands off to prep | classic prep | |

## 3. Detection rule

Computed in code from the garment fields. No AI style label. It's prototyped as `detect_vintage_sport()` and `intent_signals()` in `r1-vintage_sport_proto.py`.

**Two "intent signals" (used for every style's loungewear rule, section 4):**
1. **A dressed upper half:**
   - a structured layer: denim jacket, bomber, leather jacket, overcoat, chore coat, field jacket, overshirt, any blazer, or a track jacket;
   - or a non-fleece top: polo, knit polo, oxford, quarter-zip, sweater, cardigan, camp collar, flannel, rugby or jersey;
   - or a **matched set**: a hoodie, sweatshirt or track jacket in the same color family as long athletic bottoms.
2. **A real shoe:** any visible shoe except `performance_runner` and `slides_sandals`. Hidden shoes count as neither.

**Reads as vintage sport (any one path):**
- **Terrace:** a hero piece + an anchor bottom. High confidence with a retro shoe, medium otherwise. Also: a hero piece + a retro shoe.
- **Tracksuit:** a track jacket + track pants, sweatpants or joggers, and no gym shoe.
- **Sport off duty:** sweatpants, joggers or track pants + a non-fleece dressed upper + a real shoe.
- **Retro shorts:** athletic shorts + a dressed upper + a low-profile, retro or canvas shoe.

**Vetoes:**
- jersey + athletic shorts (a kit)
- a tank top with no layer over it
- a rugby shirt with chinos/trousers and a non-retro shoe (that's classic prep)

**What "reads as" changes:** only the allowances in section 4. His picks don't trigger it. They only break ties with look-alikes (section 7).

**How confident I am:**
- **Medium.** The terrace path rests on `jersey` and the new `track_jacket`. Both are visually loud, so the model should name them consistently, but neither is tested; the saved sets have zero jerseys.
- The sport-off-duty path rests on telling sweats from jeans or trousers, which **is known to fail**:
  - The founder's black wide jeans were read as `sweatpants` ("likely").
  - s06's cream trousers were read as pink `joggers` ("clear", 3 of 3 runs).
- Shoe type (performance runner vs retro runner vs low profile) is a coarse shape call; probably decent, but untested.

**Required companion: the one-tap question (founder decision 2).**
- **When to ask:** the bottom is sweatpants, joggers or track pants, **and** either:
  - certainty isn't "clear", or
  - it's dark (black, charcoal, navy) with a relaxed or wide leg.
- **And only if** re-scoring it as jeans moves the score by 0.5 or more. Then ask "Jeans or sweatpants?"
- **Founder's photo:** 5.0 as sweatpants vs 6.0–6.5 as jeans, so it asks.
- **s06** is read "clear", so it doesn't ask. That regression stays until the gold set (section 6).

## 4. What it excuses, and what it never excuses

Rule IDs are from `rubric.py`. Items marked **(all styles)** are loungewear fixes I'm proposing for everyone, because vintage sport is the style that defines where loungewear ends.

| Rule | Today | Proposed |
|---|---|---|
| **O4 loungewear out** | −0.6 for sweatpants or gym shorts outside Gym/Home; **fully waived if vintage sport or streetwear is ≥50% of his picks**. Joggers are exempt by accident | **(all styles)** A ladder over the 2 intent signals: **0 signals −1.2, 1 signal −0.6, 2 signals 0.** Reads as vintage sport: 0. **The pick alone waives nothing.** Joggers and track pants join sweatpants and gym shorts, because a joggers/sweatpants label flip shouldn't swing 0.6 |
| **O1 too casual** | Athletic bottoms count as dressiness 1, so O1 (−1.5) and O4 (−0.6) both charge for the same pants | **(all styles)** At Everyday/Class, athletic bottoms count as 2 in the average; O4 is their penalty. One fact, one penalty. Unchanged at Date, Work and dressier occasions |
| **F4 pooling** | −0.8 | Athletic bottoms: −0.4 for everyone (an elastic cuff gathering is by design; p02 got read as "pooling"); 0 when the outfit reads as vintage sport. The `stacked` hem value from the research report would replace this |
| **P1 leg vs style** | vintage band straight→relaxed | Band straight→**wide** (baggy Levi's are home). When the outfit reads as vintage sport, merge that band into his blend (widen only, never narrow) |
| **P3 everything oversized** (−0.3) | fires on a boxy jersey + wide jeans | Skipped when a hero top sits over wide legs. A fleece + sweats combo still gets it |
| **O3 large logo** (−1.3 at work) | exempt if vintage + streetwear ≥30% of picks | Exempt only when the outfit reads as vintage sport (crests come with the shirt). In practice a jersey at work fails O1 anyway |
| **B1 focal points / K3 point of interest** | a bright striped jersey counts as 2 focal points | A hero piece counts as at most 1 focal point and 1 point of interest. A **kit** earns no K3 from the shirt |
| **F7 worn shoes** | −0.2 instead of −0.4 if vintage ≥50% | Keep −0.2, but only for retro or low-profile sneakers on an outfit that reads as vintage sport |
| **K1 layered** (+0.75) | a track jacket over track pants counts | A **matched** track jacket + bottom isn't a layer (one garment, two halves). A track jacket over jeans counts |
| **Dressiness table** | jersey 1 | **jersey 2** (worn like a tee). New values: track_jacket 2, track_pants 1.5. Without the jersey change, jersey + jeans + Sambas can't earn K4 |

**Never excused:**
- F7 stains, wrinkles and pilling. A stretched collar on a thrifted shirt is still worn (−0.4). A faded or cracked print is `distressed_by_design` (prompt line below) and free.
- F10 strain.
- F6 / F8: a jersey or hoodie hanging past the crotch, outside streetwear.
- F9 track-jacket sleeves over the hands.
- C3 bright clash (two different team brights).
- S1 chunky runners with slim joggers.
- S2.
- O1 at work, interviews and events: sweats and jerseys are too casual there, however well styled.

**Prompt lines to add** (no new fields):
- "jersey = a sports team shirt (football/soccer, hockey, baseball, NFL); sleeveless basketball jerseys are tank_top"
- "track_jacket = zip sport jacket in tricot/nylon with a stand collar, often with stripes or piping; not a zip hoodie or fleece"
- "track_pants = sport trousers in tricot/nylon, often side-striped; fleece pants are sweatpants"
- "an elastic ankle cuff gathering on joggers or sweatpants is cuffed, not pooling"
- "a faded or cracked print on a jersey or graphic tee is distressed_by_design"

## 5. Style-specific mistakes and done-well signals

**New mistakes (no new point rules; they work through the exemptions above):**
- **Full kit** (jersey + gym shorts): no "reads as", 0 intent signals, so O4 costs −1.2, and the shirt earns no K3. Tip: "Swap the shorts for jeans; it's the classic way to wear a football shirt."
- **Training kit as an outfit** (athletic bottoms + gym runners or slides, nothing dressed): O4 −1.2. Tip: "Same sweats, better with Sambas or retro runners and a jacket."
- **Two hero pieces from different teams:** C3 handles a bright clash; otherwise a tip only.

**Done-well signals (all inside the existing 2.25 cap; I add no credit):**
- One hero piece + an anchor bottom + a retro shoe. K4 fires once a jersey counts as 2.
- The team color as the only bright: K3.
- A real layer (a track jacket over jeans, a coat over sweats): K1.
- A tailored layer over the shirt (Lyst's "technical meets tailoring"): K2. This is how vintage sport reaches 9.5.
- Without a K2 piece, vintage sport tops out at 9.0. That's deliberate.

**Calibration check (it's not inflation):**
- On the 160 saved readings with the default style mix, 18 change: 7 go up (p02's beige sweatsuit set, and the founder's misread photo, 3.5 → 5.0) and 11 go down (gym shorts, errand sweats, s06).
- Only one change lands closer to a blind estimate: m04 (tee + gym shorts) goes 6.5 → 6.0, which matches Claude's blind estimate of 6.0.
- With "Vintage sport" tapped, the inflation disappears: s21 drops 8.0 → 6.5, s24 7.0 → 6.0, s02 7.0 → 6.5.

## 6. Anchor outfits (Everyday; all checked in `r1-vintage_sport_check.py`)

| Target | Outfit (schema terms) | v3.1 now | Proto | Why |
|---|---|---|---|---|
| **4.0** | hoodie (grey, volume 4, pilled, sleeves over the hands) + sweatpants (grey, relaxed, pooling) + performance_runner (worn) | 3.5 | **4.0** | Care and fit faults on top of loungewear. The faults do the damage, not the style |
| **5.0** | hoodie (grey, small logo) + sweatpants (black, wide, pooling, "likely") + slides. *The founder's photo as misread* | 3.5 | **5.0** | Clean, but 0 intent signals: no dressed piece, home shoes. Today O1 and O4 both charge for it and F4 adds −0.8. As jeans (what he wore): 6.0–6.5, so the tap matters |
| **5.5** | jersey (red, bright, large logo) + athletic_shorts (black) + slides | 5.5 | 6.0 (raw 5.8) | A kit, not an outfit. The proto lands 0.2 above my target; leave it for calibration |
| **6.5** | jersey (navy) + joggers (black, straight, cuffed) + performance_runner | 5.5 | **6.5** | The hero piece is right; the gym shoe turns it into training kit (1 signal, −0.6) |
| **7.0** | sweatshirt (grey) + track_pants (black, straight) + low_profile_sneaker | n/a (new type) | **7.0** | A real shoe, but fleece on top. "Put together" at the floor. I'd accept 6.5 too |
| **7.5** | multicolor jersey (large logo, volume 4) + jeans (mid, relaxed) + low_profile_sneaker | 7.0 | **7.5** | Textbook blokecore, done plainly. K4 only |
| **7.5** | matched navy track_jacket + track_pants over a white tee + low_profile_sneaker | 8.5 | **7.5** | A tracksuit is one garment. Today it gets K1 for "layering" and scores Sharp |
| **8.0** | jersey (red, bright, volume 4) + jeans (light, wide) + low_profile_sneaker | 6.5 | **8.0** | The canonical look. Today P1 + P3 cost him 1.5 points for wearing it as intended |
| **8.5** | track_jacket (forest, muted) + white tee + dark straight jeans + low_profile_sneaker | 8.5 | **8.5** (raw 8.25) | A layer + a considered shoe |
| **8.5** | quarter_zip (navy) + overcoat (charcoal) + sweatpants (grey, straight) + retro_runner | 7.5 | **8.5** (raw 8.25) | The best-agreed way to wear sweats out: a coat and a knit (the older guides in section 9). My honest target is 8.0–8.5 |
| **9.5** | jersey (red, bright) + unstructured_blazer (navy) + dark straight jeans + low_profile_sneaker | 9.5 | **9.5** | Lyst's "technical meets tailoring" ([Jun 2026](https://www.lyst.co.uk/stories/how-to-style-football-shirts-mens/)). All 4 credits |
| **9.5** | rugby_shirt (red/navy stripes, bright) + overcoat (camel) + dark jeans + low_profile_sneaker | 9.0 | **9.5** | Same reason. Today the striped bright rugby counts as 2 focal points and loses K3 |
| *(look-alike)* | rugby_shirt (navy stripes) + chinos + loafer | 8.0 | 8.0, not vintage sport | Hands off to classic prep |

## 7. Look-alikes and tie-breakers

| Confused with | Shared pieces | Tie-breaker (in code) |
|---|---|---|
| **Streetwear** | hoodie, sweats, jerseys, big logos, wide jeans | **The shoe.** Low-profile or retro runner → vintage sport; chunky or basketball → streetwear. A jersey + baggy jeans + Dunks reads as both. Their allowances overlap (logos, wide legs), so applying both is safe. His picks break the tie for focal-point allowance |
| **Classic prep** | rugby_shirt, striped polo, quarter-zip | **The bottom and the shoe.** Chinos/trousers + loafer/derby → prep. Jeans or athletic bottoms, or a Samba → vintage sport |
| **Smart casual** | quarter-zip + sweats ("corporate casual" in Lululemon ABC pants) | Mine only for O4/F4/P1 on the athletic bottom. Their credits (K2) apply either way |
| **Minimal / city boy** | track pants under an overcoat; tonal sweatsuits | The matched set gets the O4 waiver from the shared ladder **without** reading as vintage sport. I don't claim Essentials-style tonal sets |
| **Outdoor** | shell or rain jacket + track pants + runners (s21) | I treat `performance_runner` with athletic bottoms as a gym shoe. Outdoor will argue it's a trail shoe; their tie-breaker should need a shell **and** cargos or hiking pants, not sweats |
| **Workwear** | almost none | — |

## 8. Fields the model can't read reliably that this style depends on

| Depends on | Problem | What to do instead |
|---|---|---|
| Jeans vs sweatpants vs trousers vs joggers | The founder's photo and s06 both misread | The one-tap question (section 3); joggers in O4 so a label flip between sweatpants and joggers can't swing 0.6 |
| Jersey vs graphic tee vs plain athletic tee | A sponsor print may be read as `graphic_tee` | Fail-safe: it's then scored as a graphic tee (no allowances, no harm). Add the prompt definition |
| Track jacket vs zip hoodie; track pants vs sweatpants (tricot vs fleece) | Fabric is weak in VLMs ([research report](../proportions-color-style.md)) | Both sit in the same groups for O4 and F4; only the K1 matched-set rule and the tracksuit path care, and both fail toward the stricter score |
| Real vintage vs replica; brand (three stripes, Sambas by name) | Not readable, not judged | Never score it. `low_profile_sneaker` stands in for Samba/Gazelle |
| Shorts length and fabric (nylon retro vs mesh basketball) | No field | Only the retro-shorts path uses shorts, and it needs a dressed top + retro shoe, which carry the evidence |
| "Faded print" vs "worn out" | Patina vs damage | Prompt line: a faded or cracked print is `distressed_by_design`; a stretched collar is `pilled_or_worn` |

## 9. Sources

2025 and later:
- Lyst, "How to Style: Football Shirts," Jun 10, 2026: https://www.lyst.co.uk/stories/how-to-style-football-shirts-mens/ ("no football socks, and no athletic shorts"; jersey + blazer + loafers; tonal color echo)
- TimesLive (Thango Ntwasa), Jun 12, 2026: https://www.timeslive.co.za/lifestyle/2026-06-12-soccer-fan-or-not-heres-how-you-can-get-the-blokecore-look/ (low-rise sneakers, blue denim or boxy shorts; chinos and loafers for dressier settings)
- FashionUnited on Pinterest's Summer 2026 report, May 26, 2026 (global): https://fashionunited.com/news/fashion/pinterest-trend-report-sport-to-shape-summer-2026-far-beyond-the-playing-field/2026052672586
- The Spinoff (Emma Gleason), Jul 8, 2026: https://thespinoff.co.nz/sports/08-07-2026/are-football-jerseys-an-unkillable-fashion-trend
- Depop 2026 trends report, Dec 19, 2025: https://news.depop.com/company-news/depop-unveils-2026-fashion-trends-report-the-edited-self/
- Bloomberg Opinion (Andrea Felsted), syndicated, Jan 26, 2026: https://www.qatar-tribune.com/article/216005/opinion/want-to-keep-your-job-buy-yourself-a-blazer
- Trendalytics, Aug 27, 2026 (track jackets, low-profile sneakers trending; no numbers given): https://blog.trendalytics.co/world-cup-2026-fashion-trends-retail-data
- Ape to Gentleman, "Best Rugby Shirt Brands," 2026 edition: https://www.apetogentleman.com/best-rugby-shirt-brands/ (rugby with denim, shorts, or sweatpants and sneakers; loved by "streetwear enthusiasts" and "lovers of classic prep")
- Stylight, "7 fashion aesthetics for men… 2025" (page undated): https://www.stylight.com/Magazine/Men/Fashion-Aesthetics-For-Men/ (jersey or track jacket + baggy Levi's; Sambas/Gazelles; track pants with a polo "to avoid looking too sporty")
- LuisaViaRoma, "Men's Shorts 2025" (snippet): https://www.luisaviaroma.com/en/lvr-magazine/trends/trending-mens-shorts-styles (retro short shorts with adidas sneakers)
- Exploding Topics, "straight leg sweatpants" (snippet; tracked since Nov 2025): https://explodingtopics.com/topic/straight-leg-sweatpants
- Hello! Magazine, Oct 6, 2025 (women's; tracksuit bottoms with blazers, denim jackets, Sambas): https://www.hellomagazine.com/hfm/wish-list/649053/how-to-style-tracksuit-pants
- Marie Claire, rugby shirts fall 2025 (snippet; women's): https://www.marieclaire.com/fashion/rugby-shirts-trend/

Older (labeled; they agree with each other and with the 2025+ pieces: structured layer + clean shoe = intentional, gym hoodie + slides = lazy):
- Ape to Gentleman, sweatpants, Aug 2021: https://apetogentleman.com/how-to-wear-joggers/ (avoid slides and gym shoes)
- Mensflair, Jul 2022: https://mensflair.com/sweatpants-outfits/
- Represent, Jan 2023: https://representclo.com/blogs/articles/how-to-style-joggers-for-men
- SANVT, May 2021: https://sanvt.com/journal/how-to-wear-sweatpants-for-men/

Internal: `rubric/research/notes/style_archetypes.md` (vintage-sport profile), `rubric/research/proportions-color-style.md` (the `stacked` hem, "style unlocks, garments confirm").

**My own judgment, not sourced:**
- every point value
- the 2-signal ladder and its −1.2 / −0.6 / 0 steps
- jersey at dressiness 2
- "a matched set isn't a layer"
- all anchor targets
