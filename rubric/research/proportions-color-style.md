# Three new readings close most rubric gaps

*Research report, Oct 7, 2026. Built from the four notes in `rubric/research/notes/`, checked line by line against `extraction-test/rubric.py` (v3.1), `rubric/v3.md`, `extraction-test/schema.json` and `prompt.txt`.*

Rubric v3.1 already scores most of what the research recommends. It covers pooling hems, untucked tops that hang past the crotch, an oversized top over skinny pants, chunky shoes with narrow pants, "neutral base plus one accent," the bright clash, the pattern rules, the navy-blazer near-match and the style bands. A rewrite would be wasted work. The research points to **three real gaps worth points**. First, baggy jeans that *stack* on purpose get read as "pooling" and cost anyone who didn't tap Streetwear first about −0.8. Second, a thin, dainty shoe under a wide leg looks wrong to 3 sources with 0 against, and nothing catches it. Third, and the strongest color finding, top and bottom in different colors but the same middle lightness look muddy. Each gap needs one new, coarse reading from the vision model: a `stacked` hem value, a `shoe_profile`, and a `lightness` bucket per garment. Reading the code also turned up **two bugs worth fixing before the Nov 3 beta**. Style exemptions only switch on for a style weighted ≥0.5, which in practice means **only his first-tapped style**. And "muted" colors count as half an accent only when they are burgundy or sage, even though the model already reports `saturation`. On style types, keep the current design (a general standard, with his styles widening what's allowed). Merge Preppy and Old money into one option, add a "Reads as workwear"-type label with no points, and never penalize mixing styles. Be clear about the evidence: almost every proportion rule here is editorial opinion. **No study ranks proportion faults by how much ordinary viewers notice them**, so every point value below is a guess until the gold set is ranked by humans. And because v3 already scores the mirror photos about 0.6 above Claude's blind estimates (`extraction-test/results/INDEX.md`), new rules should mostly be mistakes or swaps inside the existing 2.25 credit cap, not new bonus points.

**How to read the point values.** Points below are what the score moves before half-rounding. The code multiplies its internal values: fit penalties ×0.8, color and proportion ×0.6, occasion ×1.2. So "−0.3 color" is `0.5` in the `color` bucket of `rubric.py`.

### The ten changes, ranked by impact vs. risk

| # | Change | Kind | Score effect | When | Impact | Risk |
|---|---|---|---|---|---|---|
| 1 | Style exemptions switch on for **any** picked style, but only when the garment fits that style | Code fix | Removes wrong −0.4 to −0.8 hits | Before beta | High | Low |
| 2 | Muted accents counted from the `saturation` field, not a 2-name list | Code fix | Fixes 3-accent false alarms | Before beta | Medium | Low |
| 3 | Merge Preppy + Old money; widen Minimal's leg band to wide (barrel) | Code + copy | Removes −0.45 on barrel trousers | Before P4 onboarding | Medium | Low |
| 4 | "Everything oversized" skipped when the top is cropped or ends at the belt | Code | Removes a −0.3 | Before beta | Low–med | Low |
| 5 | Denim near-match (adjacent washes on top and bottom) | Code | −0.3 | Tip before beta, points after the gold set | Medium | Medium |
| 6 | `stacked` hem value + a hem-by-leg-shape table | New reading | Wide jeans stacked 0; trousers stacked −0.4 | Reading before beta, points after checking | High | Medium |
| 7 | Wide leg + sleek shoe | New reading (`shoe_profile`) | −0.3 | Collect quietly, then score | Med–high | Medium |
| 8 | "Muddy middle": different colors, both mid lightness | New reading (`lightness`) | −0.3 | Collect quietly, then score | Med–high | Medium |
| 9 | Waist-break credit (full tuck, or a cropped/at-belt top over straight-to-wide legs) | Code | +0.25 inside the 2.25 cap | After the gold set | Low–med | Medium |
| 10 | Shoulder-seam tip; shorts length | New readings | Tip; −0.3 later | After launch | Low–med | Medium |

## v3.1 already covers the well-supported rules; four gaps remain

The proportion notes list pooling hems and untucked tops below the crotch as missing. They are not missing. `F4_pooling` (−0.8) and `F6_top_too_long` (−0.8) handle both, and the research backs each with 3 and 2 sources and none against ([RMRS, slim vs wide trousers, 2026](https://www.realmenrealstyle.com/slim-vs-wide-trousers/); [Menswear Online, 2025](https://www.menswearonline.co.uk/?p=305195)). The table below is the honest coverage map. "Covered" means the rule fires in `rubric.py` today. "On paper" means `v3.md` mentions it but no reading exists to trigger it.

| What the research recommends | v3.1 today | Verdict |
|---|---|---|
| Pooling on trousers is a fault; stacking on baggy jeans is intended | `F4_pooling` −0.8; exempt only for streetwear ≥0.5 weight with relaxed/wide legs | **Covered, needs refinement**: add a separate `stacked` value |
| Untucked regular top ending below the crotch | `F6_top_too_long` −0.8 | Covered |
| Mid-fly is the *correct* untucked tee length ([SANVT](https://sanvt.com/journal/how-should-a-t-shirt-fit/)) | Never penalized; triggers the rule-of-thirds tip | Covered. The tip should read as "next level," not as a fix |
| Oversized top + skinny pants | `P2` −0.3 (skinny only) | Covered. Slim is caught indirectly by `P1` leg-vs-style |
| Everything oversized, outside streetwear | `P3` −0.3, exempt for streetwear/outdoor | Covered; add a cropped-top exemption |
| Chunky shoe + skinny/slim pants | `S1` −0.45 | Covered |
| Thin/pointy shoe under a wide leg | Nothing | **Gap** (needs `shoe_profile`) |
| Shirt tail below a blazer | `L1` −0.6 | Covered |
| Hoodie under an overcoat is fine | `L1` fires only under tailored jackets | Covered (correctly neutral) |
| Sleeves past the knuckles | `F9` −0.4 | Covered |
| Shoulder seam on the shoulder for regular tees | "Advice only" in `v3.md`, but no reading exists | **On paper only** |
| Shorts end above the knee | Nothing | **Gap** (low priority until spring) |
| Waist break / rule of thirds | Tip only | Gap for a credit; tip covered |
| Neutral base + one accent; bright clash; pattern rules | `C1a`, `C3`, `C4a/b`, `K3` | Covered |
| "Clearly different or identical, never nearly" for dark jacket + trousers | `C5` −0.5 | Covered |
| Same rule for denim washes | Nothing | **Gap** (computable now) |
| Lightness separation between top and bottom | Nothing | **Gap** (needs `lightness`) |
| Muted accents count half | Only burgundy and sage | **Bug-level gap** |
| Retired taboos (navy + black, brown + black) | Not scored (C5 is only the tailored case) | Correct as is |
| Two classic patterns for prep (stripe oxford + argyle) | `C4a` fires only on the same pattern type | Already allowed |

Two smaller inconsistencies should be cleaned up while editing. First, `v3.md` says a half tuck is "never suggested," yet the code's rule-of-thirds tip suggests "a front tuck." The newest source endorses the front tuck ([Menswear Online, 2025](https://www.menswearonline.co.uk/?p=305195)), so keep the tip and fix the doc. Second, `v3.md` lists shoulder-seam advice that can never fire.

## Proportions: stacking and shoe weight are the real gaps

**The `stacked` hem value matters most, because the wide-leg era made it common.** Retail 2025 baggy denim is cut to "stack at the ankle" by design ([The Fashionisto on H&M Fall 2025](https://www.thefashionisto.com/?p=1510441)). For tailored trousers the same 2026 source that blesses wide legs says "No stack. No floor-sweep" ([RMRS, 2026](https://www.realmenrealstyle.com/slim-vs-wide-trousers/)). The current prompt defines pooling as fabric that "bunches heavily," so the model has nowhere to put intended stacking except `pooling` or `full_break`. The style exemption has its own bug (next section), so a guy who tapped Smart casual first and Streetwear second loses 0.8 for wearing baggy jeans the way they're designed. **Recommendation:** add `stacked` (folds sitting above the shoe, hem not dragging) to the `hem` field and score by garment and leg shape. Relaxed/wide jeans or cargos that are stacked: 0 for everyone. The same pants pooling: −0.4 (fit 0.5) unless streetwear applies, then 0. Trousers or chinos stacked: −0.4. Trousers or chinos pooling: −0.8 as today. This halves the cost of a stacked/pooling flip on baggy jeans, which matters because a flip between those two values is the most likely new source of score wobble. It needs checking before it carries points (see the plan).

**Wide leg + sleek shoe is the best-agreed rule v3.1 lacks** (3 supporting, 0 against). RMRS says "If your sneaker disappears under the hem, it's the wrong sneaker" and lists pointy dress shoes and ultra-thin minimalist sneakers as the failures ([RMRS, best shoes for wide-leg trousers, 2026](https://www.realmenrealstyle.com/best-shoes-wide-leg-trousers-men/)). Opumo backs it ([Opumo](https://www.opumo.com/magazine/what-shoes-to-wear-with-wide-leg-pants-men/)). One catch keeps this narrow: the same RMRS guide counts low-profile Samba/Gazelle sneakers and penny loafers as *right* with wide legs. So the fault is a very thin or pointy shoe, not merely a non-chunky one. Current shoe types can't express that. `white_leather_sneaker` covers both clunky and razor-thin pairs, and `dress_shoe` may or may not be pointy. **Recommendation:** add `shoe_profile` (sleek / regular / chunky / not_visible), with Samba-type shoes and loafers defined as "regular" in the prompt. Fire −0.3 (proportion 0.5) for a wide or barrel leg with a sleek shoe, never in a partial check. Keep `S1` as is. The notes suggest softening it for slim legs, but the −0.45 has no source either way, so wait for the gold set.

**The cheap code-only fix is the cropped-top exemption to "everything oversized."** The best available source says all-loose works when "the fix is length rather than width," for example a boxy top that ends at the hip over baggy jeans ([H&M Fall 2026 editorial, search snippet only](https://www2.hm.com/en_us/editorial/inspiration/men-autumn-trends.html)). That is one unconfirmed snippet. But the change only *removes* a −0.3, and it fits the Japanese city-boy look already folded into Minimal ([Yokogao](https://www.yokogaomag.com/editorial/the-rise-of-the-city-boy)). Skip `P3` when the top's `length` is `cropped` or `at_belt`.

**The waist-break credit is real advice but risky as points.** The "about a third / two-thirds" split is the most-cited proportion idea (4 sources, 0 against), reached by tucking, a higher rise, or a cropped top ([Westwood Hart, 2026](https://westwoodhart.com/blogs/westwood-hart/natural-waist-trousers-rise-fit-proportions-men)). No study shows ordinary viewers reward it, and it adds credit to a rubric that already runs high. **Recommendation:** after the gold set, add +0.25 for a full tuck, or a cropped/at-belt untucked top over straight, relaxed or wide legs, with total credit still capped at 2.25 so 9.5 stays the ceiling. Leave the half tuck out of the credit because the sources disagree on it.

**What to skip.** A skin-tight top over a wide leg: sources split 1–1 (RMRS says the top needs volume; the H&M snippet says the top should be close), so no rule. Rise: a `rise` field would usually be hidden under an untucked top. Gemini Flash is the worst flagship model at saying "not visible" (NA-detection F1 22%) ([arXiv 2601.15711](https://arxiv.org/html/2601.15711)), so a rise field would mostly produce confident guesses. Coat length and "coat shorter than the blazer": rare for this audience and timeless-tailoring lore. Extending `P2` to slim legs: already covered, because a very oversized top pushes `P1` for most style mixes, and slim legs push `P1` for streetwear. Shorts: wait. Depop reports JNCO jorts searches rising ([Depop 2026 report](https://news.depop.com/company-news/depop-unveils-2026-fashion-trends-report-the-edited-self/)), so penalizing below-knee shorts without the TikTok check below would punish a live trend. Spring is also the first season it matters after a November launch. The shoulder seam is worth a reading eventually, since it is the most common beginner fit fault a photo shows (4 sources, 0 against) ([Menswear Online, 2025](https://www.menswearonline.co.uk/?p=305195)). But it is muddled with `volume`, because the model may call any dropped-shoulder tee "oversized." Launch it as a tip only.

## Color: lightness is the one missing signal, and the color wheel is a dead end

**Lightness separation is where the menswear guides and the lab research agree most, and v3.1 cannot see it.** Effortless Gent's core formula is light top + dark bottom or the reverse, avoiding "similar value" across pieces ([Effortless Gent, updated May 2026](https://effortlessgent.com/clothing-color-combos/)). On the science side, a study of 327,381 ratings found lightness features the most predictive and that palette colors "should not be too similar" ([O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)). The Ou & Luo model holds that small lightness differences reduce harmony (as summarized in the notes; the paper itself was not opened), and that model predicts harmony on real apparel images only moderately, r = 0.50–0.65 ([Kuo et al. 2012](https://www.scientific.net/AMR.627.524)). `color_family` can't stand in for lightness, because brown, olive, green, blue and red each run from light to dark, and that is exactly where muddy outfits happen. **Recommendation:** add a per-garment `lightness` with three buckets (light / mid / dark), read relative to the other pieces in the same photo. Fire a "muddy middle" −0.3 (color 0.5) only when every visible upper piece and the bottom are `mid`, the upper pieces' color families differ from the bottom's, and none is white or black. Never fire it on same-family tonal looks or all-dark outfits: Kitted's rule against penalizing tonal and all-black stands, and menswear accepts dark palettes even though the 2011 color study rated dark themes poorly. Three buckets, not five: Gemini 2 Flash recognizes colors 80% of the time but extracts exact values only 52% of the time ([ColorBench, NeurIPS 2025](https://arxiv.org/html/2504.10514v3)), so coarse beats fine. Comparing pieces inside one photo also sidesteps most of the lighting problem. Absolute phone color drifts 4–10 ΔE with light ([Smartphone colorimetry, PMC10304433](https://pmc.ncbi.nlm.nih.gov/articles/PMC10304433/)), roughly the size of the threshold you'd want to measure.

**The denim near-match is the cheapest new rule, because today's readings already support it.** Double-denim guides converge on "same wash or clearly different, never close" ([Harry Rosen](https://www.harryrosen.com/en/editorial/how-to-pull-off-a-canadian-tuxedo); [Opumo](https://www.opumo.com/magazine/double-denim-how-to-wear/)). It is the same logic as the existing `C5` and the "almost the same shade" warning ([Nathan Tailors, Aug 2026](https://www.nathantailors.com/en/blog/what-trousers-to-wear-with-a-blazer)). The rule: a denim top or outer layer and denim bottoms one wash apart (light/mid or mid/dark). Two washes apart is fine. The same wash is left alone, because the model can't tell an exact match from a near one. Be honest about the weakness: the rule fires right on the light/mid/dark boundary, which is where wash readings are most likely to flip between runs. **Ship it as a tip before beta and give it −0.3 only after double-denim photos show the wash reading holds across runs.**

**Muted accents need a consistency fix, not a new theory.** In `rubric.py` (lines 61–62, 236–242, 325), "muted, half an accent" applies only to the names burgundy and sage. A dusty-pink shirt marked `saturation: muted` counts as a *full* accent toward the 3-accent mistake but *zero* toward the point-of-interest credit. Muted pink is a 2026 signal (Pinterest "dusty pink shirt outfit men" +283%) ([FashionUnited on Pinterest's 2026 report](https://fashionunited.com/news/fashion/pinterest-mens-trend-report-2026-workwear-leather-and-pink-define-the-look/2026090974520)), and lower saturation raises rated harmony ([Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)). **Recommendation:** any non-neutral color with `saturation: muted` counts 0.5 in the accent count, the focal-point count and the point-of-interest credit, the way burgundy and sage already do. A single muted accent still won't trigger the credit (it needs 1.0), so this adds no score inflation.

**Leave these as tips or skip them.** A tonal outfit with a light-mid-dark range (cream, tan, brown) is the most harmonious kind by the lab evidence ([Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)). Once `lightness` exists, upgrade the current flat-tonal tip into a positive "nice tonal range" note, but don't give it points. Color "echo" (shoes repeating the jacket) has no research behind it and rewards coincidence: a tip at most. Warm/cool temperature mixing rests on one source, Permanent Style: skip it. Shoes darker than or contrasting with the trousers splits classic tailoring advice from casual advice: skip it.

## Style types: seven options, one standard, and "style unlocks, garments confirm"

**Keep scoring against a general "put together" standard, with his styles as modifiers. That is what v3.1 already does, and the evidence supports it.** No academic source treats "style type" as something that drives ratings, and the sources that blend styles show even professionals expect mixes. Stitch Fix assigns each man up to 5 of 7 types ([Stitch Fix, 2024](https://www.stitchfix.com/men/blog/?p=14103)). The app that scores against a style picked per photo, fitd. ([App Store](https://apps.apple.com/us/app/-/id6744093706)), invites gaming and breaks "same photo, same score." Mixing aesthetics is how 2026 dressing works ([Depop 2026 report](https://news.depop.com/company-news/depop-unveils-2026-fashion-trends-report-the-edited-self/)). What reads as wrong is a formality gap, a silhouette clash or a head-to-toe costume, and v3.1 already handles the first two.

**The real style problem is in the code, and it is the highest-impact fix in this report.** Onboarding saves the first pick at weight 0.5 and splits the rest (`handoff/02-screens.md` line 308). Every style exemption in `rubric.py` checks a weight threshold: streetwear ≥0.5 for pooling, long tops, oversized tops, hoodie sleeves, extra focal points and the halved bright clash (lines 177, 197–199, 203, 253, 264, 275). So **whether his baggy jeans get the streetwear exemption depends on the order he tapped the styles in.** Picked third, streetwear unlocks nothing. **Recommendation:** an exemption applies when the style is *any* of his picks **and** the garment involved is one of that style's home pieces. Examples: the long-top exemption for a tee or hoodie, not an oxford; the pooling/stacking exemption for jeans or cargos, not trousers. The bands keep their weighted blend. This rule ("style unlocks, garments confirm") is more forgiving where it should be and stricter where it should be. It changes scores on existing test cases, so the parity fixtures need regenerating from `rubric.py`.

**The option list should drop from 8 to 7 by merging Preppy and Old money.** They share garments and fit bands. "Old money" search interest peaked in 2023 with *Succession* ([TheVou, secondary](https://thevou.com/blog/modern-old-money-style-aesthetic/)), and 2026 retail describes "Preppy Americana" instead ([ASOS, Jan 2026, snippet](https://www.asos.com/men/fashion-feed/2026_01_02-fri/2026-fashion-trends)). Workwear has the strongest 2025–26 signal by far: Pinterest reports "workwear outfit men" +314%, and Gen Z makes up 62% of male searches ([FashionUnited, Sept 2026](https://fashionunited.com/news/fashion/pinterest-mens-trend-report-2026-workwear-leather-and-pink-define-the-look/2026090974520)). Smart casual should explicitly absorb the US-born, young-male "quarter-zip" look; Lyst quarter-zip demand rose 31% in Q4 2025 ([CNN via KRDO, Jan 2026](https://krdo.com/news/2026/01/15/a-new-generation-of-men-are-dressing-for-success-and-the-quarter-zip-was-just-the-beginning/)). One weakness runs through all of this: **no survey gives the share of US men 18–30 per aesthetic**. Pinterest is global and Depop/Lyst are platform-wide, so the list is a judgment from trend signals. The Codex prompt below gets a US relative-size check. The merged name is a taste call; "Classic prep" is my recommendation. P4 onboarding isn't built yet, so this costs almost nothing now and a migration later.

**Per-style profiles.** "Exists" means already in `rubric.py`; "new" means proposed here. Home pieces use existing schema types.

| Option (absorbs) | Top / legs | Palette | Unlocks | Still wrong | Home pieces (for "Reads as") |
|---|---|---|---|---|---|
| **Smart casual** (corporate casual, quarter-zip) | 2–3 / slim→relaxed | Muted neutrals + one muted accent | Nothing extra; this is the standard | Athletic shoes with trousers (S2 exists), pooling, big logos at work | quarter_zip, knit_polo, polo, oxford_shirt, overshirt, chinos, trousers, loafer, derby, chelsea_boot, unstructured_blazer |
| **Minimal** (Scandi, Korean, city boy, modern uniform) | 2–4 / straight→**wide** (new; barrel is a 2025 minimal staple per [Stylight](https://www.stylight.com/Magazine/Men/Fashion-Aesthetics-For-Men/)) | Neutral, tonal, all-black | Tonal/all-black never penalized (exists); boxy cropped top over wide legs (new P3 exemption) | Two brights, loud graphics (tip), visible wear | tee, sweater, oxford_shirt, overshirt, trousers, chinos, white_leather_sneaker, loafer, overcoat |
| **Classic prep** (Preppy + Old money) | 2–3 / slim→relaxed (union of both) | Navy, cream, white, tan, green, burgundy; stripes, plaid | Two classic patterns (already allowed) | Big logos (tip), pooling, chunky sneakers with slim legs (S1) | oxford_shirt, polo, rugby_shirt, sweater, cardigan, quarter_zip, chinos, shorts, blazer, loafer, white_leather_sneaker |
| **Workwear** (Americana, amekaji, western) | 3–4 / straight→relaxed | Earth tones, indigo | Scuffed boots cost half (exists); double denim with clearly different washes (new N2 leaves it alone) | Skinny jeans under a boxy coat (P1); matching canvas head to toe (costume tip) | chore_coat, field_jacket, denim_jacket, flannel_shirt, overshirt, jeans, cargos, work_boot, suede_chukka |
| **Streetwear** (skater, Y2K, grunge, techwear) | 3–5 / straight→wide | Neutral or black base + 1–2 bold, or all-dark | Stacking, long tees, oversized, 3+ patterns, halved bright clash, +1 focal point, logos (exist, with the new trigger) | Sleek shoe under very wide pants (new); skinny legs under a huge top (P1) | graphic_tee, hoodie, sweatshirt, bomber, cargos, jeans, chunky_sneaker, basketball_sneaker, canvas_sneaker |
| **Vintage sport** (blokecore, rugby, athleisure) | 3–4 / straight→relaxed | Team colors on one piece + denim/neutrals | Sweats and gym shorts out of the house, crests and logos (exist) | Full matching kit (costume tip); jersey with trousers and loafers | jersey, rugby_shirt, polo, sweatshirt, jeans, sweatpants, low_profile_sneaker, retro_runner |
| **Outdoor** (gorpcore) | 3–4 / straight→wide | Earthy/tonal or one bright technical color | All-oversized exemption, bright shell as the point of interest (exist); add to the big-logo-tip exemption (new) | Full hiking kit in town (costume tip); shell over suit trousers | fleece, shell_jacket, rain_jacket, puffer, cargos |

**Add a "Reads as workwear" label, not a credit.** When 2 or more main pieces (top or outer layer, bottom, shoes) are home pieces of one style, the card can say so. It's shareable, it explains the score, and it's computed in code from readings the app already has. The notes suggest a +0.25 to +0.5 "committed look" credit. Hold off: there is no evidence it tracks quality, and it would add inflation. Revisit after the gold set. A costume guard (4 of 4 main pieces from one list) should produce a tip, "swap one piece for a basic," never a deduction ([MR PORTER workwear guide, summary only](https://www.mrporter.com/en-gb/journal/fashion/the-men-who-wear-workwear-well-914020)).

## Five proposed readings and how far to trust each

Each new field must allow "not visible," and the code must treat unknown as no penalty. Gemini Flash's documented weak spot is claiming something is visible when it isn't ([arXiv 2601.15711](https://arxiv.org/html/2601.15711)). Every added field is also one more thing that can flip between runs, and the shorter v4.1 answer format already showed a format change can alter 5 readings (`extraction-test/results/INDEX.md`).

| Reading | Values | Used by | Expected reliability | Basis | When |
|---|---|---|---|---|---|
| `hem` + `stacked` | adds `stacked` to the existing list | Hem table (#6) | **Moderate**; stacked vs pooling is subtle and untested | Shape attributes are VLMs' strongest group ([arXiv 2601.15711](https://arxiv.org/html/2601.15711)) | Add before beta if the re-run holds |
| `lightness` (per garment) | light / mid / dark | Muddy middle (#8), tonal-range note | **Likely high** as a relative call within one photo | Color recognition 80% vs exact values 52% ([ColorBench](https://arxiv.org/html/2504.10514v3)) | Add before beta, collect quietly |
| `shoe_profile` | sleek / regular / chunky / not_visible | Wide + sleek (#7) | **Moderate**, worse in partial photos | Coarse shape call; not benchmarked | Add before beta, collect quietly |
| `shoulder_seam` (tops) | on_shoulder / dropped / not_visible | Tip only | **Moderate–low**; muddled with `volume` | Not benchmarked | After launch |
| `shorts_end` | above_knee / at_knee / below_knee / not_visible | Shorts rule | **Moderate**, like sleeve length (58–62% F1) | [arXiv 2507.09950](https://arxiv.org/html/2507.09950v2) | Spring, after the TikTok check |
| ~~`rise`~~, ~~`outer_length`~~ | — | — | Low / rare | NA-detection F1 22% | Don't add |

## What not to build

**Don't score color-wheel harmony.** Large-sample and lab studies found "no evidence" that complementary, triadic or other hue templates predict liked combinations ([O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)). Contrasting hues were judged "neither preferable nor harmonious" ([Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)). **Don't cite the golden ratio**: a review of the paired-comparison studies finds group preference for it weak and possibly nonexistent ([Frontiers 2016, PMC4937063](https://pmc.ncbi.nlm.nih.gov/articles/PMC4937063)). Say "about a third" instead. **Don't let the model judge harmony, style or "balance."** Simply swapping image order flipped GPT-4o's fashion verdicts in 57–74% of pairs, and its rank correlation with humans was 0.12–0.52 against a human ceiling of 0.71–0.82 ([ZOZO, arXiv 2410.23730](https://arxiv.org/pdf/2410.23730)). Even temperature 0 doesn't make LLM judges repeatable ([MLflow](https://mlflow.org/articles/judge-consistency-llm/)). **Don't use measured pixel color for thresholds**, for the lighting-drift reason above. **Don't add skin-tone or seasonal color analysis**: it is out of bounds, and it fails in practice ([Kettlewell test](https://kettlewellcolours.com/blogs/the-colour-blog/does-ai-colour-analysis-work)). **Don't revive retired clash rules** (navy + black, brown + black, belt must match shoes), which 2026 sources call outdated ([Ape to Gentleman, 2026](https://www.apetogentleman.com/fashion-rules-men-should-break/)). **Don't penalize mixing styles**, and **don't add a per-photo style picker.** **Don't calibrate against likes or views**: they correlated with pooled human rankings at only ρ −0.36 to 0.27 ([ZOZO](https://arxiv.org/pdf/2410.23730)), and vote-based "fashionability" mostly tracks followers, the wearer's looks and scenery ([Simo-Serra et al., CVPR 2015](https://openaccess.thecvf.com/content_cvpr_2015/html/Simo-Serra_Neuroaesthetics_in_Fashion_2015_CVPR_paper.html)). **Don't add net credit.** Rivals are already mocked because their "scores tend to run high regardless of the actual outfit" ([StylePal, a rival's own blog](https://www.stylepal.app/news/best-outfit-rating-app)). Kitted's edge is that its scores repeat, add up and aren't inflated.

## The plan: ship code-only fixes before Nov 3, then earn the rest on the gold set

Every rubric change follows the same path: edit `rubric.py` first (it wins on scoring), update `v3.md`, regenerate the parity fixtures, port to `@kitted/core`, and run `npm run check` before committing. Any prompt or schema change also re-runs the locked extraction test (40 stock + 12 mirror photos, about $1.35) and must keep ≥90% score consistency and a median near 6.6 s. "After the gold set" means the 80-photo set with **truth labels for every reading**, plus **pairwise human rankings**. Being consistent is not the same as being right: reading navy as black every time is 100% consistent and still wrong. Use the ZOZO method: friends answer "which looks more put together?" on pairs, the answers become a ranking (OpenSkill or TrueSkill), and the split-half correlation shows how much raters agree ([ZOZO](https://arxiv.org/pdf/2410.23730)). A change earns points only if it keeps or improves the rank correlation between Kitted's scores and the panel's. The thresholds below are my proposals, not sourced.

| Step | What | Gate | When |
|---|---|---|---|
| 1 | Style exemptions: any pick + home garment (#1); muted accents (#2); P3 cropped exemption (#4) | Regenerate parity; re-score saved readings (free) and review every score that moves | This week |
| 2 | Merge Preppy + Old money, Minimal → wide (#3) | Founder OKs the name "Classic prep"; update copy deck and `STYLE_BANDS` | Before P4 onboarding |
| 3 | Denim near-match as a tip (#5); fix the half-tuck wording in `v3.md` | None (tips don't move scores) | With step 1 |
| 4 | Add `stacked`, `lightness`, `shoe_profile` to the schema and prompt in one batch; the code reads them but scores nothing new except the stacked-jeans "0" | Extraction re-run ≥90% consistent, no speed loss; add 10 hem shots (stacked vs pooled baggy jeans) to the phone test | Before Nov 3, or drop the batch |
| 5 | Gold set: 80 photos, truth labels per reading, about 400 pairwise judgments from 5+ friends | Lightness top-vs-bottom order matches humans ≥90%; stacked vs pooling ≥85%; shoe_profile ≥85% | November |
| 6 | Turn on points one at a time: hem table, muddy middle −0.3, wide + sleek −0.3, denim −0.3, waist-break +0.25 (inside cap) | Each keeps consistency ≥90% and doesn't lower rank correlation | Before or just after launch |
| 7 | "Reads as" label, costume tip, shoulder-seam tip | Copy review | v1.1 (December) |
| 8 | Shorts length rule | Codex jorts check says below-knee is not a live trend for his audience | Spring 2027 |

## Prompts for Gemini and Codex

Save each answer at the path in its prompt. Create `inputs/rubric-research/` if it doesn't exist.

**1. Gemini: proportion rules from YouTube (2025+)**
```
I'm building a men's outfit-scoring app for US men 18-30 (casual to smart casual). I need proportion and fit rules from credible menswear YouTube creators. Use video transcripts only. Date window: videos published January 1, 2025 or later; skip older videos even if popular. No Reddit, no TikTok.

Search these channels first, confirm each exists, and give its subscriber count: Real Men Real Style (Antonio Centeno), Gentleman's Gazette, The Modest Man (Brock McGillis), Alex Costa, Teaching Men's Fashion (Jose Zuniga), He Spoke Style (Brian Sacawa), Ashley Weston, Tim Dessaint. You may add up to 4 other menswear channels with 100k+ subscribers if they cover a topic better (especially streetwear/baggy denim); say why you added each.

Topics. For each, find what each creator says, with timestamps:
1. Baggy or wide jeans: when fabric stacking at the ankle is intended vs when it is "pooling" (a mistake). Is it different for jeans/cargos vs chinos/trousers?
2. Shoe weight vs pant width: which shoes look wrong under wide-leg pants (thin minimalist sneakers? pointy dress shoes? Sambas? loafers?) and chunky shoes under slim pants.
3. Untucked top length (where a tee/shirt hem should end), front tuck vs full tuck, boxy cropped tops with wide pants, "rule of thirds".
4. Oversized top with slim/skinny pants; oversized top with wide pants ("everything oversized").
5. Shorts length in 2025-26, including long baggy shorts/jorts at or below the knee: deliberate trend or mistake?
6. Shoulder seam position and short-sleeve length on regular vs oversized tees.
Exclude advice that depends on height, body type, weight, face or skin tone. If a creator ties a rule to body type, mark it "body-based" and log only the garment part.

Output: one markdown table, one row per claim:
| topic # | rule in plain words | creator | channel | video title | URL with &t= timestamp | publish date | timestamp | exact quote (max 15 words) | stance (mistake / fine / depends) | conditions or exceptions |
Then, per topic: number of distinct creators who agree vs disagree, and the strongest disagreement in one sentence.
Rules: log a claim only if you read it in the transcript; never invent or paraphrase inside the quote column; list videos you couldn't get transcripts for under "Not transcribed". Aim for 25+ rows.

Output file (I will save it): /Users/eyu/Desktop/files/Kitted/inputs/rubric-research/gemini-proportions-2025.md
```

**2. Gemini: color rules from YouTube (2025+)**
```
Research color-combination rules for men's casual and smart-casual outfits from menswear YouTube transcripts. Date window: published January 1, 2025 or later. No Reddit, no TikTok.

Start with: Real Men Real Style, Gentleman's Gazette, The Modest Man, Alex Costa, Teaching Men's Fashion, He Spoke Style, Ashley Weston, Tim Dessaint (confirm each exists; give subscriber counts). Add up to 4 other menswear channels with 100k+ subscribers if needed, saying why.

Topics:
1. Light/dark (value) contrast between top, pants and shoes: is "light top, dark bottom" a rule? When do two pieces look "muddy" or too similar?
2. Near-matches: navy jacket with slightly different navy pants, two denim pieces in close-but-different washes (denim on denim), grey on grey. "Match exactly or contrast clearly"?
3. Muted vs bright accents: how many accent colors; do dusty/muted colors (dusty pink, sage, rust, forest green) count like bright ones?
4. Tonal/monochrome outfits: when they look good vs flat (light-medium-dark range? texture?).
5. Old "clash" rules: navy with black, brown shoes with black pants, belt matching shoes. Still rules in 2025-26 or outdated?
6. Color-wheel advice (complementary, analogous): do these creators actually use it, and how?
EXCLUDE anything based on skin tone, hair/skin "personal contrast", or seasonal color analysis. Do not log those claims at all.

Output: one markdown table:
| topic # | rule in plain words | creator | channel | video title | URL with &t= timestamp | publish date | timestamp | exact quote (max 15 words) | stance (rule / fine / depends) | example outfit given |
Then per topic: agree vs disagree counts (distinct creators) and the strongest disagreement.
Only log claims you read in a transcript; list untranscribed videos separately. Aim for 25+ rows.

Output file (I will save it): /Users/eyu/Desktop/files/Kitted/inputs/rubric-research/gemini-color-2025.md
```

**3. Gemini: each style done well vs badly (2025+)**
```
For a men's outfit app (US, ages 18-30), I need how menswear YouTubers describe each of these 7 styles done WELL vs done BADLY. Use transcripts of videos published January 1, 2025 or later only. No Reddit, no TikTok.

The 7 styles: (1) Smart casual / "corporate casual" / quarter-zip look; (2) Minimal (incl. Scandinavian, Korean minimal, Japanese "city boy"); (3) Classic prep / old money; (4) Workwear / Americana (incl. amekaji, western); (5) Streetwear / skater (incl. Y2K, grunge, techwear); (6) Vintage sport (blokecore, rugby shirts, track tops, athleisure); (7) Outdoor / gorpcore.

Channels: start with Real Men Real Style, Gentleman's Gazette, The Modest Man, Alex Costa, Teaching Men's Fashion, He Spoke Style, Tim Dessaint. For styles they don't cover (streetwear, gorpcore, blokecore, workwear, city boy), find channels with 100k+ subscribers that focus on that style; give channel name, subscriber count and why you trust it.

For each style collect:
- signature pieces ("home" garments) and shoes
- silhouette: how loose the top is, pant leg shape (skinny/slim/straight/relaxed/wide), how pants should end at the shoe
- palette
- which usual "mistakes" are fine in this style (logos, pooling/stacking, oversized, worn/faded items, bright colors, multiple patterns)
- signs it's done badly, especially "costume" (too literal head to toe) and mixing with the wrong formality
Exclude anything about body type, face, skin or weight.

Output: one markdown table per style:
| aspect (pieces / silhouette / palette / allowed rule-break / done badly) | claim in plain words | creator | channel | video title | URL with &t= timestamp | publish date | timestamp | exact quote (max 15 words) |
Then a 3-line summary per style: the 3 points most creators agree on, and one disagreement.
Only log claims you read in a transcript. At least 2 distinct creators per style if they exist; say so if you couldn't find 2.

Output file (I will save it): /Users/eyu/Desktop/files/Kitted/inputs/rubric-research/gemini-style-profiles-2025.md
```

**4. Codex: how big each style is in the US, plus the jorts check (TikTok + Google Trends)**
```
Use Chrome. No Reddit. Record the date you captured every number.

PART A: Relative size of men's style aesthetics, US, 2025-2026.
1. Google Trends, United States, custom range 2025-01-01 to today, Web Search. Compare terms in groups of 5, and put the SAME anchor term "workwear outfit men" in every group so groups are comparable. Terms: "workwear outfit men", "old money outfit men", "preppy outfit men", "quarter zip outfit men", "minimalist outfit men", "streetwear outfit men", "blokecore", "gorpcore", "city boy outfit", "techwear", "vintage sport outfit men", "skater style men". Record the average interest over the period and the direction (rising/flat/falling over the last 6 months) for each. Screenshot each comparison.
2. TikTok: for each hashtag record total views or post count as shown, and the view counts of the top 5 videos posted in 2025 or later: #workwearmen #mensworkwear #oldmoneyaesthetic #oldmoneystyle #preppymen #quarterzip #corporatecasual #minimalistmen #mensstreetwear #blokecore #gorpcore #cityboy #techwear #skaterstyle. If TikTok hides totals, say so; don't estimate.
Output A: a markdown table | term or hashtag | source (Trends/TikTok) | metric | value | capture date | URL | notes |, then a ranking of the 7 groups I care about: smart casual/quarter-zip, minimal/city boy, classic prep/old money, workwear, streetwear/skater/techwear, vintage sport/blokecore, outdoor/gorpcore.

PART B: Are long baggy shorts/jorts at or below the knee a real trend for US men 18-30 in 2025-2026?
Search TikTok for "jorts outfit men", "baggy jorts", "long shorts men", "how long should men's shorts be". Take the 30 most-viewed videos posted 2025 or later. For each record: URL, creator, post date, views, where the shorts end (above knee / at knee / below knee), and whether the video presents that length as good or as a mistake. For the 10 most-viewed, read the top 10 comments and count positive vs negative reactions to the length.
Output B: a table | URL | creator | date | views | shorts end | creator's stance | comments +/- |, then 3 sentences: is below-knee a deliberate look, for which style, and is "shorts must end above the knee" still a safe rule?

Output file: /Users/eyu/Desktop/files/Kitted/inputs/rubric-research/codex-style-size-and-jorts.md
```

**5. Codex: competitor reviews and the blocked editorial pages**
```
Use Chrome. No Reddit. Two parts.

PART A: US App Store reviews of outfit-rating apps, 2025 or later. For each app read every review you can reach (open "See All" and scroll): Fashion Score: Outfit Rater (apps.apple.com/us/app/id6757362426), Mirror: Rate My Outfit (id6673901973), Fit Score! AI Outfit Rating (id6758554007), Looksee AI (id6757265239), Rate My Outfit (id6470764044), Outfit Rater AI (id6759444006), fitd. (id6744093706), Alta Daily (id6481705400). Also search the App Store for "outfit rating" and "fit check" and add any app with 50+ ratings.
Log only reviews that mention: score consistency (same outfit, different score), scores too high or always the same, wrong colors or garments, style mismatch ("doesn't get my style"), proportions or fit advice, fairness/body/face judgments, or paywall complaints.
Output A: | app | rating count | review date | stars | theme | exact quote (max 15 words) | URL |, then the top 5 themes with counts.

PART B: Read these pages directly (my fetch tool was blocked). For each give: URL, publish date, author, a 2-3 sentence summary, and whether it CONFIRMS or CONTRADICTS the claim in brackets, with one exact quote (max 15 words).
1. https://www2.hm.com/en_us/editorial/inspiration/men-autumn-trends.html  [confirm the exact wording "One loose piece, one fitted piece is the rule", "the fix is length rather than width", and whether it is really H&M's page]
2. Mr Porter "How To Get Wide-Leg Trousers Right" (search mrporter.com)  [shoes and hem rules for wide trousers]
3. https://www.mrporter.com/en-es/journal/fashion/you-asked-can-you-wear-black-and-navy-together-762234  [navy + black OK casually; avoid navy blazer + black trousers]
4. https://www.mrporter.com/en-ie/journal/fashion/double-denim-jeans-25228706  [same wash or clearly different washes]
5. https://www.mrporter.com/en-gb/journal/fashion/the-men-who-wear-workwear-well-914020  [avoid head-to-toe workwear "costume"]
6. https://www.permanentstyle.com/2018/04/wearing-warm-and-cold-colours.html and https://www.permanentstyle.com/?p=99331  [warm/cold colors; dark trousers with light tops]
7. https://harryrosen.com/en/editorial/how-long-should-your-winter-coat-be  [coat shouldn't end at the widest part of the calf]
8. GQ (gq.com): find 2025-2026 articles on wide-leg/baggy pants with shoes, and on baggy jeans stacking vs pooling. Summarize the 2 most relevant.
9. https://www.axios.com/2025/08/03/pinterest-men-trends-pilates-parenting  [Pinterest: "older brother core" +95%, "vintage grunge" +50%]
Output B: | # | URL | date | author | summary | confirms/contradicts | quote |

Output file: /Users/eyu/Desktop/files/Kitted/inputs/rubric-research/codex-competitors-and-blocked-pages.md
```

## Conclusion

The research shifts the job from "add color theory and proportion theory" to "add three coarse readings and fix two bugs." The rules with real backing are narrow and concrete: lightness separation, stacked versus pooled hems, shoe weight against leg width, and "match exactly or contrast clearly." The grand frameworks (color wheels, golden ratios, warm and cool) fail either the evidence test or the "same photo, same score" test. The biggest risk to how users perceive the scores right now isn't a missing rule. It's that the order he tapped his styles in decides whether his baggy jeans are "wrong." Fixing that is free.

The deeper implication is that Kitted's moat and its calibration problem are the same thing. Competitors can't explain or repeat their scores, and Kitted can, but every point value in v3.1, and every one proposed here, is still an informed guess. The pairwise human ranking on the gold set is what turns these guesses into a defensible rubric. Until it exists, the safest changes are the ones that only remove wrong penalties.
