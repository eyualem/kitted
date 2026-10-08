# Round 1: Minimal (the minimalist advocate)

*Oct 7, 2026. Absorbs Scandinavian, Korean minimal, Japanese "city boy" and the "modern uniform." Tested against the saved readings (52 photos × 3 runs, plus the 4 phone checks) with a prototype detector and a patched copy of `rubric.py` kept in my scratchpad. No repo file outside this folder was changed.*

**My position in one paragraph.** Minimal is the style that asks the rubric for the *fewest* favors. It needs three allowances: wide or barrel legs, boxy tops, and boxy-over-wide. It does not need a single care or fit exemption. For a beginner it is also the easiest style to fake by accident. A plain tee, jeans and sneakers is "minimal" in the dictionary sense and "no style" in the photo. So detection has to require **palette discipline plus at least one deliberate choice**: a minimal silhouette or a minimal home piece. A neutral color count alone is not enough. **Mid- and light-wash blue denim never counts toward Minimal.** It is the single field value that best separates default basics from a committed minimal look. When the detector fires, the score changes only by removing wrong penalties. **"Reads as minimal" is worth zero points by itself.**

---

## 1. Identity

**One line:** few colors, clean surfaces, no loud graphics, and a deliberate silhouette (straight-to-wide legs, regular-to-boxy tops), where the cut does the work instead of a print.

**Absorbs:**
- **Scandinavian:** neutral, tonal, knit and coat-led.
- **Korean minimal:** boxy shirts, wide slacks, monochrome.
- **Japanese city boy:** a big top over relaxed pressed trousers, earthy muted colors, Vans or loafers.
- **"Modern uniform":** the same few staples on repeat, all-black or tonal.

**Who wears it (US 18–30):** college guys and young professionals who shop Uniqlo, COS, Everlane, Arket and Muji. Also the "I just want to look clean" beginner, which is a big share of Kitted's audience.

**How big it is.** There is no US share-by-aesthetic survey. This is my judgment from trend signals:
- Depop's 2026 report names "Modern Uniforms" a top trend: "Consistency becomes the new flex" ([Depop, Dec 20, 2025](https://news.depop.com/company-news/depop-unveils-2026-fashion-trends-report-the-edited-self/)).
- Lyst demand for pleated trousers is up 110% since 2025 ([FashionUnited, Jun 24, 2026](https://fashionunited.ca/news/fashion/menswear-trends-that-have-gone-from-catwalk-to-cart/2026062445661)). Pleated trousers are a city-boy and minimal staple.
- Uniqlo, the mass-market home of minimal basics, plans to grow from 76 US stores to about 200 by 2027 ([Inside Retail, Oct 8, 2025](https://insideretail.us/uniqlo-plots-out-an-aggressive-retail-growth-strategy-for-the-us-market-in-2026/)).
- Trendalytics reports rising searches for "simple outfits" and "neutral wardrobe pieces" (undated, 2026 forecast; [Trendalytics](https://trendalytics.co/trend-insights/return-of-minimalism-2026-wardrobe-forecast)).
- The research report ranks clean/minimal as the #2 signal after workwear (`notes/style_archetypes.md` Q1).

The Codex size check is still pending.

**Important for the bands:** "minimal" changed shape. The 2010s version was slim: FashionBeans still advises a "slim, tailored fit" ([FashionBeans, Nov 2024, older](https://www.fashionbeans.com/article/minimalist-style)). The 2025+ version is straight-to-wide: "wide straight-leg jeans or barrel-leg trousers" ([Stylight, 2025](https://www.stylight.com/Magazine/Men/Fashion-Aesthetics-For-Men/)). The band must cover the new shape and only lightly tax the old one.

---

## 2. Signals table

"Main pieces" means visible top, outer layer, bottom and shoes (not accessories, not `certainty: unsure`).

| Signal (schema terms) | Strength | Also a signal for | Note |
|---|---|---|---|
| **Palette discipline:** every main piece is in {white, off_white_cream, light_grey, grey, charcoal, black, navy, khaki_beige, tan_camel, brown, olive, light_blue, denim_dark} or muted (burgundy, sage), and there are ≤3 color families | **Required** (not enough alone) | Smart casual, classic prep, workwear (earth tones) | `denim_mid` and `denim_light` are left out on purpose (see §3) |
| **Tonal:** ≤2 color families across main pieces (all black; black + white; cream + tan) | Medium | Techwear-leaning streetwear (all black) | Flips at the black/charcoal boundary (s10 flipped between runs) |
| **Minimal silhouette:** a relaxed/wide/barrel leg with a clean hem (no_break, slight_break, cropped, cuffed, or the proposed `stacked`), or a *straight* leg on pressed trousers/chinos/drawstring trousers | Strong | Streetwear (wide), smart casual (straight trousers) | Straight *jeans* don't count: too common to show intent |
| **Boxy-cropped top:** top/outer `volume` ≥4 with `length` at_belt or cropped | Strong | Streetwear, city boy | Counts as the silhouette signal |
| **Home piece:** any of sweater, cardigan, knit_polo, oxford_shirt, overshirt, overcoat, unstructured_blazer, leather_jacket, trousers, drawstring_trousers, chinos, white_leather_sneaker, low_profile_sneaker, loafer, chelsea_boot, derby | Medium | Smart casual, prep (most of them) | Shared pieces, which is why the palette is required |
| Plain tee / plain hoodie / camp-collar shirt / jeans in black, dark or cream | Neutral | Everyone | Don't count for or against |
| **Against:** chunky_sneaker, basketball_sneaker, performance_runner, slides_sandals | Weak negative | Streetwear, vintage sport, outdoor | Subtracts 1 from strength |
| **Against:** `logo: small` on any clothing piece; multicolor shoes; `pattern: other` on clothing | Weak negative | Streetwear, outdoor | Subtracts 1 each |
| **Veto:** graphic, camo, floral or plaid pattern on any clothing piece; graphic/camo/floral shoes | Veto | Streetwear, workwear (plaid), prep (plaid) | Stripes are allowed (a breton or a fine stripe is a minimal point of interest) |
| **Veto:** `logo: large` anywhere | Veto | Streetwear, vintage sport, outdoor | — |
| **Veto:** any bright piece (`is_bright`), or 2+ non-neutral pieces | Veto | Streetwear, outdoor, prep | One muted accent is fine |
| **Veto:** sweatpants, joggers or athletic_shorts as the bottom | Veto | Vintage sport, streetwear | See the jeans/sweatpants note in §3 |
| **Veto:** a suit_jacket in the photo | Veto | (tailoring; judged by occasion) | Suits are not a style claim. Suit trousers worn alone are fine |
| **Veto:** `distressed_by_design` on non-denim pieces | Veto | Streetwear, workwear | **Not** on jeans or denim jackets: the flag is true on 33 of 46 saved jeans readings because "faded" and "ripped" share it |

---

## 3. Detection rule

```
main = visible top/outer/bottom/shoes, certainty != unsure
if fewer than 2 main pieces            -> not minimal
if any veto                            -> not minimal
P = palette discipline (required)
strength = [tonal] + [minimal silhouette] + [home piece] - (number of "against" signals)
reads_minimal = P and (silhouette or home piece) and strength >= 2
confidence: strength 3 = high, 2 = medium
```

**How it separates committed minimal from basics.** These are three outfits a beginner might all call "minimal":

| Outfit | Reads as minimal? | v3.1 (no style) | With detection |
|---|---|---|---|
| White tee + mid-wash jeans + white canvas sneakers | **No:** mid-wash denim fails the palette, and nothing is deliberate | 7.0 | 7.0 |
| White tee + mid-wash jeans + white leather sneakers | **No** (same reason) | 7.5 | 7.5 |
| Black tee + black straight jeans + white leather sneakers | **Yes, medium:** palette, tonal, home piece | 7.5 | 7.5 |
| Cream boxy tee (vol 4, at belt) + black wide trousers + black low-profile sneakers | **Yes, high** | 7.0 | **8.0** |

The first three score the same, and **I think that is correct.** At the tee-and-jeans level, the difference between "committed" and "default" is real but small. It belongs in the **card's words**: "Reads as minimal: tonal and clean" vs. "Clean basics, next step: one layer". It should not move points. Detection only pays off when the outfit makes a minimal choice that today's bands punish (the fourth row).

**Why mid-wash denim is the line.** Every minimal source lists black, white, grey, cream, brown and navy. None lists "blue jeans" as the minimal choice ([Stylight, 2025](https://www.stylight.com/Magazine/Men/Fashion-Aesthetics-For-Men/); [FashionBeans, Nov 2024, older](https://www.fashionbeans.com/article/minimalist-style)). That is my reading of the sources, not a quoted rule. The field is reliable: denim wash reads well, and `denim_dark` still counts. It turns the "everyone's default outfit" into a non-claim without any new reading. The cost: a guy in a well-cut mid-wash straight jean + cream knit + loafers doesn't get the Minimal label. He loses nothing, because smart casual or the default band covers him.

**Tested on saved readings** (52 photos, 3 runs each):
- **10 photos read as minimal.** They include:
  - p01/p06: beige overshirt, white tee, tan chinos
  - s03: black knit, black trousers, black shoes
  - p03 after: black overcoat over black, Chelsea boots
  - s25: cream camp shirt, drawstring trousers, Chelsea boots
  - m03: navy striped camp shirt, white wide chinos, cream runners
  - s10 and m10 in some runs
- **No false positive** on any graphic tee, sweats, suit, plaid or ripped-jeans look.
- **The label flipped between runs on 2 of 52 photos** (s10: black vs. charcoal; m10: plaid vs. solid overshirt). Both flips came from the reading, not the rule. Neither moved a score, because the allowances didn't apply to those outfits.
- **Score changes on the saved set** happen only where his picks were narrow:
  - s25, 7.0 → 7.5 for a smart-casual-only user (boxy camp shirt no longer taxed)
  - m03, 7.5 → 8.0 for a preppy-only user (wide chinos no longer taxed)
- **Under the test mix and with no style picked, no saved score moved.** That is the intended behavior: the rule removes wrong penalties and changes nothing else.

**Which signals are reliable to read:**
- **Reliable:** `leg_shape` (shape attributes are VLMs' strongest group, per the report), neutral vs. bright `color_family`, denim wash.
- **Moderate:**
  - black vs. charcoal (s10 flipped)
  - `volume` 3 vs. 4 (p01's tee read 2 and 3 in different runs)
  - `pattern` solid vs. plaid (m10 flipped)
- **Unreliable:** `logo` large, graphic vs. plain, `distressed_by_design`. Only the first two are used as vetoes. They veto toward the default score, so a wrong reading costs at most a removed allowance, never a new penalty.

**The founder's photo** (grey hoodie, black wide jeans with a belt, black slides with socks):
- **As read (sweatpants):** vetoed. The score stays 3.5.
- **Read as jeans, hem `pooling`:** not minimal, because slides and a small hoodie logo subtract from strength. Score 6.0.
- **Read as jeans with the proposed `stacked` hem:** palette + tonal + silhouette, minus 2 "against" signals = strength 1. Still not minimal. Score 6.5 with no style picked, 7.0 if streetwear applies.

**Minimal should not claim this outfit.** Hoodie + wide jeans + slides is streetwear's home. My honest score is **6.5–7.0**, which matches the founder's "not a 3, not a 9." The real fix is the shared one: a "Jeans or sweatpants?" tap when the bottom is `likely` sweatpants and the answer moves the score by a point or more (founder decision 2).

---

## 4. What Minimal excuses, and what it never excuses

**Excuses** (only when the outfit reads as minimal; the amounts are points off the final score):

| Rule | Allowance | Effect |
|---|---|---|
| `P1_leg_vs_style` | Minimal leg band becomes **straight → wide** (barrel = wide). Applied as the *more forgiving* of his blended band and the Minimal band | Removes −0.45 (no style / smart casual) to −0.9 (preppy) on wide or barrel legs |
| `P1_top_volume_vs_style` | Top band 2–4 (unchanged), used the same "more forgiving" way | Removes −0.2 to −0.45 on a boxy top |
| `P3_everything_oversized` | Skipped when the top is at_belt/cropped **or** the bottom is pressed trousers, chinos or drawstring trousers (the city-boy shape) | Removes −0.3 |
| `F6_top_too_long` | Already skipped for volume ≥4. No change | — |

Also, for the Minimal style key itself (when he *picked* Minimal), widen `STYLE_BANDS["minimalist"]` legs to `("straight", "wide")`, as the research report recommends. A slim leg is then one step outside: about −0.45 if Minimal is his only pick, and less when blended. That is the right light tax on the 2010s shape.

**Never excuses** (and I'd argue for full strength here, not merely "the default"):
- **Care (`F7_care`), full rate.** No half-rate for scuffed sneakers, even if a picked style would allow it, when the outfit reads as minimal. Minimal "shows flaws most" (`notes/style_archetypes.md` Q2): a dirty white sneaker under black trousers is the whole outfit's weak point. In code, `half` should require that the outfit does *not* read as minimal.
- **`F4_pooling` on trousers or chinos.** Wide trousers should "fall cleanly" ([FashionBeans on The Row, Jan 23, 2026](https://www.fashionbeans.com/article/why-the-row-so-expensive-menswear-2026)). Stacked wide *jeans* are the shared hem-table question, not a minimal exemption.
- `F9` sleeves, `F10` strain, `L1` shirt below blazer, `T1` untucked dress shirt.
- **All color rules.** Minimal never needs a color exemption, because its vetoes already exclude the outfits those rules catch.
- `O4_loungewear_out`: sweats are vetoed, so no exemption is needed.
- **Occasion rules** (`O1`, `S2`): Minimal is not a dress code.

---

## 5. Style-specific mistakes and done-well signals

**New mistakes: none with points.** The minimal failure modes already have rules: visible wear (`F7`), loud graphics and logos (the logo tip), and two brights (`C3`). Tips only:
- **Near-black mismatch tip:** black top or outer piece with a charcoal or faded-black bottom in an otherwise tonal look ("match your blacks or contrast clearly"). It stays a tip because the black/charcoal reading flipped on s10.
- **Small logos on 2+ pieces:** "one logo at most keeps it clean."
- **Swap the "next level: add one point of interest" tip.** For an outfit that reads as minimal, show "vary texture or shade" instead. Telling a minimal dresser to add color argues with what he's going for (founder decision 1).

**One proposed credit, inside the existing cap: "Clean palette" (M-K3).** v3.1's point-of-interest credit (`K3`, +0.5) needs a bright, muted or patterned piece. **So a perfect minimal outfit is structurally capped at 9.0**, while a colorful one can reach 9.5. I propose that K3's slot can also be earned when **all** of these hold:
- the outfit reads as minimal
- it is tonal (≤2 families)
- it has the minimal silhouette signal
- it has an outer layer (not just a knit)
- shoes are visible
- `logo: none` on every clothing piece
- every piece is clean

It never stacks with K3, and the 2.25 total cap is unchanged.

On the saved readings it fires **0 times**. A looser version (any knit, no silhouette requirement) fired on s03 and p03 and pushed all-black knit + trousers to 9.0–9.5, which is too generous. That's why it's this strict. **Recommendation:** ship detection and the band fixes now; turn M-K3 on only after the gold set confirms humans rank layered tonal outfits that high.

**Done-well signals** (for the card's wording, not points):
- tonal or ≤3 neutrals
- zero visible logos
- a clean hem on straight-to-wide legs
- one structured layer
- clean leather or low-profile shoes

"Pair fuller trousers with shorter jackets and tidy footwear" ([Opumo, Summer 2026 trends, Paddy Maddison](https://www.opumo.com/magazine/10-summer-2026-menswear-trends-worth-embracing/)) is the shape to praise.

---

## 6. Anchor outfits (everyday)

Scores below are from the patched rubric with detection, no style picked. Raw scores are in brackets.

| Band | Outfit (schema terms) | v3.1 → proto | My honest score and why |
|---|---|---|---|
| **~4** | tee/white vol 2, `strain: clear`, `condition: stained` · jeans/black skinny, hem pooling · white_leather_sneaker `pilled_or_worn` | 4.0 → 4.0 [4.05] | **4.0.** Minimal pieces, but every care and fit fault is visible: strain, a stain, puddled hems, dirty "clean" sneakers. Reading as minimal excuses none of it. Correctly no change |
| **~5.5** | tee/white vol 3 untucked, length below_crotch · jeans/black slim, hem pooling · white_leather_sneaker clean | 6.0 → 6.0 [5.9] | **5.5.** Two fit faults (tee past the crotch, pooling) on otherwise clean basics. v3.1 lands 0.4 high; I accept that as rounding noise |
| **~6.5** | tee/white below_crotch · jeans/black straight, slight break · white_leather_sneaker | 6.5 → 6.5 [6.7] | **6.5.** A committed minimal palette with one fit fault. The fix (a shorter or tucked tee) → 7.5 |
| **~7.5** | tee/black vol 3 · jeans/black straight · white_leather_sneaker. Reads as minimal (medium) | 7.5 → 7.5 | **7.5.** The minimal uniform done cleanly: "Put together," not "Sharp." Same score as white tee + mid-wash + white leather sneakers, by design. The label differs, the points don't |
| **~8.5** | sweater/off_white_cream vol 3 · trousers/black **wide**, no_break · low_profile_sneaker/black. Reads as minimal (high) | **8.0 → 8.5** [8.25] | **8.5.** Knit + wide pleated trousers + slim sneakers is the 2025–26 minimal outfit. v3.1 takes 0.45 for the wide leg; detection removes it |
| **~9.5** | overcoat/black · sweater/charcoal · trousers/charcoal **wide**, no_break · loafer/black, no logos, all clean. Reads as minimal (high) | **8.5 → 9.5** [9.25] (9.0 without M-K3) | **9.0–9.5.** As good as an everyday minimal photo gets: tonal, layered, clean hem, considered shoes. The 9.5 depends on the M-K3 credit; without it, minimal tops out at 9.0 |

**A calibration flag (not minimal-specific).** sweater/grey + jeans/black straight + white_leather_sneaker scores **9.0 under v3.1** today (K1 + K2 + K4 = 1.75). My honest score is 8.0. A plain crewneck earns the full "Layered" credit *and*, through its dressiness of 3, helps the shoe credit. I'm passing this to the calibration member. It inflates every style that uses knits, mine most.

**City-boy check:** oxford_shirt/light_blue **vol 4** · chinos/khaki_beige **wide**, no_break · canvas_sneaker/black (Vans-like). v3.1: **6.5** (half-step top penalty + wide-leg penalty + P3 everything-oversized). With detection: **7.5**, which is my honest score. This is the outfit today's rubric treats most unfairly. The Japanese source describes it as "polished, but never try-hard" ([Yokogao, Lach Thomson, July 7, year not shown](https://www.yokogaomag.com/editorial/the-rise-of-the-city-boy)).

---

## 7. Look-alikes and tie-breakers

The allowances are unioned, so a tie never changes the score. Tie-breakers only pick the **label** on the card and the next suggestion.

| Confused with | Why | Tie-breaker for the label |
|---|---|---|
| **No style (basics)** | Same tee/jeans/sneaker pieces | Mid/light denim or no deliberate choice → basics. That is the whole point of §3 |
| **Smart casual** | Shares knits, oxfords, trousers, loafers | Tonal **and** the minimal silhouette → Minimal. A collared/zip top (polo, oxford, knit_polo, quarter_zip) on a slim-straight leg → Smart casual. Otherwise his pick |
| **Streetwear** (tonal "Essentials" look) | All-black/grey, wide legs, boxy tops | Hoodie or sweatshirt + chunky/basketball sneakers or slides → Streetwear. Minimal needs a home piece or a clean-hem silhouette *without* those. The founder's photo goes to Streetwear |
| **Workwear** | Earth tones, overshirts, olive/brown tonal | chore_coat, field_jacket, denim_jacket, work_boot, cargos, flannel → Workwear |
| **Classic prep** | Navy/cream, oxfords, chinos, loafers | Stripes/plaid, a polo or rugby, slim-straight legs → Prep. Wide legs + tonal → Minimal |
| **Tailoring** | All-black suit and turtleneck | suit_jacket in the photo → no style claim; judge by occasion |

---

## 8. Fields the model can't read that Minimal depends on

Minimal is the style most dependent on what a phone photo can't show. That is the main argument for keeping its allowances small and giving it no bonus.

| Depends on | Readable? | What to do instead |
|---|---|---|
| Fabric and quality (heavyweight tee, merino, drape) | No. "Knitwear drapes instead of clinging" ([FashionBeans, Jan 23, 2026](https://www.fashionbeans.com/article/why-the-row-so-expensive-menswear-2026)) is invisible in a mirror selfie | Never score it. The card may say "minimal lives on fabric; a heavier tee reads cleaner" as a tip |
| Texture variety in tonal looks | No. The model has no texture field, and `pattern: other` mixes texture with prints | Tip only ("vary texture or shade"). Scandinavian AW25 dressing leans on "textured knits, quiet outerwear… subdued tones" ([Louis Copeland on Stenströms AW25, Jan 30, 2025, snippet](https://louiscopeland.com/blogs/news/stenstroms-aw25-texture-elegance-versatility-at-louis-copeland)) |
| Ripped vs. merely faded denim | No. One flag covers both (33/46 jeans readings true) | **(new field)** `denim_wear`: none / faded / ripped / not_visible. Only "ripped" vetoes Minimal; streetwear and workwear can use it too |
| Exact black match | Moderate. Black vs. charcoal flips | Tip only (§5) |
| Pressed crease and pleats | No | Use subcategory `trousers` as the proxy for "pressed," as above |
| Lightness range in tonal looks | Not today | The report's proposed `lightness` **(new field)** would let a cream → tan → brown tonal outfit get a positive note. Keep it a note, not points |
| Intended stacking on wide jeans | Not today | The report's `stacked` hem value **(new field)** is in my clean-hem list |

**One honest caveat about the whole style.** "Far too much enthusiasm for safe and snooze-worthy garments masquerading as minimalism" ([Highsnobiety, Jake Silbert, AURALEE FW26 review, about Jan 2026](https://www.highsnobiety.com/p/auralee-fw26/)). Even the style's own press says plain is not the same as good. That is why my detector demands a deliberate choice, and why "reads as minimal" earns nothing on its own.

---

## 9. Sources

2025+ unless marked. "Snippet" = search-result text only.

- Depop, "2026 Fashion Trends Report: The Edited Self" (Modern Uniforms), Dec 20, 2025: https://news.depop.com/company-news/depop-unveils-2026-fashion-trends-report-the-edited-self/
- FashionUnited (Alicia Reyes Sarmiento), "Menswear trends that have gone from catwalk to cart" (Lyst: pleated trousers +110%), Jun 24, 2026: https://fashionunited.ca/news/fashion/menswear-trends-that-have-gone-from-catwalk-to-cart/2026062445661
- Inside Retail US, Uniqlo US growth plan, Oct 8, 2025: https://insideretail.us/uniqlo-plots-out-an-aggressive-retail-growth-strategy-for-the-us-market-in-2026/
- Trendalytics / FashionTech Edit, "Return of minimalism: 2026 wardrobe forecast" (undated): https://trendalytics.co/trend-insights/return-of-minimalism-2026-wardrobe-forecast
- Stylight, "7 fashion aesthetics for men… 2025" (modern minimalism; undated, 2025 framing): https://www.stylight.com/Magazine/Men/Fashion-Aesthetics-For-Men/
- Highsnobiety (Jake Silbert), AURALEE FW26 review, about Jan 2026: https://www.highsnobiety.com/p/auralee-fw26/
- FashionBeans, "Why The Row is so expensive" (menswear), Jan 23, 2026: https://www.fashionbeans.com/article/why-the-row-so-expensive-menswear-2026
- FashionBeans, "Minimalist style" guide, Nov 10, 2024 (**older**; shows the slim 2010s shape): https://www.fashionbeans.com/article/minimalist-style
- Opumo (Paddy Maddison), "10 summer 2026 menswear trends worth embracing" (2026, exact date not shown): https://www.opumo.com/magazine/10-summer-2026-menswear-trends-worth-embracing/
- Yokogao (Lach Thomson), "The rise of the city boy" (July 7, year not shown): https://www.yokogaomag.com/editorial/the-rise-of-the-city-boy
- Highxtar (Mar Piera), "Basics: the new trend for 2025," Jan 13, 2025: https://highxtar.com/en/basics-the-new-trend-for-2025/ (basics as deliberate selection; supports "intent, not item count")
- Louis Copeland, Stenströms AW25, Jan 30, 2025 (**snippet**): https://louiscopeland.com/blogs/news/stenstroms-aw25-texture-elegance-versatility-at-louis-copeland
- nss magazine (Lorenzo Salamone), "Plain boy summer," Jun 28, 2024 (**older**; context only): https://www.nssmag.com/it/fashion/37229/minimal-estate-stile
- Korean minimal: no credible 2025+ English source found. Retailer blogs (e.g., https://blog.delivered.co.kr/k-fashion/10-trending-korean-mens-sweatpants-to-buy-at-musinsa-in-2026/, **weak**) describe wide slacks, wide track pants and monochrome. I treat Korean minimal's rules as identical to the general Minimal profile; that is my judgment.
- Internal: `rubric/research/proportions-color-style.md` and `notes/style_archetypes.md` (Oct 7, 2026); `extraction-test/results/test3-stock-40-v3` and `test4-mirror-12-v3` raw readings; `phone-checks-oct7.json`.

*Own judgment, not sourced:* the mid-wash-denim line, the strength arithmetic, the M-K3 gates, every point value, and all anchor scores.
