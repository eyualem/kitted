# Round 1: Workwear advocate

*Oct 7, 2026. Absorbs Americana, Japanese amekaji and light western. Tested against the saved readings with `rubric.py` (v3.1). Detector: `r1-workwear_detect.py`; every number below re-runs with `r1-workwear_check.py` (from `extraction-test/`) on `extraction-test/results/test3-stock-40-v3` and `test4-mirror-12-v3`.*

## 1. Identity
**One line:** hard-wearing work and heritage pieces (chore coat, field or denim jacket, flannel, jeans or work pants, work boots), in earth tones and indigo, worn with plain basics.

- **Absorbs:**
  - Americana (denim jackets, flannels, double denim)
  - Japanese amekaji: the same pieces in wider, straighter cuts. Strum describes a "wide straight silhouette" ([Strum, older, undated](https://strum.jp/en/blogs/styling/coordinate-2021-8-1)).
  - Light western: snap shirts and bootcut jeans. There is no subcategory for cowboy boots, so a full western look can't be detected.
- **Who wears it:** US college guys and young professionals in a Carhartt WIP or Dickies phase, thrift-store barn jacket buyers, and denim fans.
- **How big:**
  - It has the strongest search signal of any style. On Pinterest, "workwear outfit men" is up 314%, "vintage workwear outfit men" +442%, M-65 field jacket +148% and French chore coat +41%. Gen Z makes up 62% of male searches. The data is global, not US-only. ([FashionUnited on Pinterest, Sept 2026](https://fashionunited.com/news/fashion/pinterest-mens-trend-report-2026-workwear-leather-and-pink-define-the-look/2026090974520))
  - Chore coats "lead" fall/winter 2026 outerwear, mostly in olive, brown, navy and off-white ([Apparel Resources, Aug 31, 2026](https://apparelresources.com/fashion-news/trends/chore-coats-lead-workwear-inspired-outerwear-fall-winter-2026/)).
  - Real Men Real Style's fall 2026 forecast is led by heritage workwear ([RMRS, Sept 29, 2026](https://www.realmenrealstyle.com/mens-fall-2026-trend-forecast/)).
  - Lyst ranked the Carhartt Detroit jacket a top-5 product, with searches +410% (Q1 2024; older, search snippet).

## 2. Signals
Strength means how much a piece says "workwear" on its own. **"Readable"** means how well the model reads it, judged from the saved runs (see §8).

| Signal (schema terms) | Strength | Also signals | Readable | Note |
|---|---|---|---|---|
| `chore_coat` (outerwear) | strong | smart casual, minimal | good, but rare in tests | Only appeared in the Oct 7 phone test. Dressiness 3 |
| `work_boot` (footwear) | strong | streetwear (Timberlands), outdoor | good (s20, p02 stable) | Wear on the boot flips (s20: 1 of 3 runs read it worn) |
| `field_jacket` in brown, tan, khaki, olive, cream or navy | strong | outdoor, prep (barn jacket) | medium | Oct 7: a quilted brown jacket read as field jacket, "wrinkled", pattern "other" |
| `denim_jacket` in a denim wash | strong | streetwear, vintage | good for light/mid (s16 34/34) | Black or charcoal denim (s10, s14) reads rock or minimal, so it counts as a medium signal only |
| `flannel_shirt` worn with `jeans` or `cargos` | strong as a pair | streetwear, grunge | good (s11 34/34) | A flannel on its own is medium |
| `jeans`, not skinny | weak | everyone | type often misread (§8) | Supporting only |
| `cargos` | weak | streetwear, outdoor | medium | Carpenter and double-knee pants land here or in chinos today |
| `overshirt`, `suede_chukka`, `leather_jacket` | weak | smart casual, minimal, prep | good | Supporting only |
| `canvas_sneaker` | weak | streetwear, skater | good | Converse is a normal amekaji shoe, but it says nothing about style alone |
| Palette mostly earth tones plus indigo (brown, tan, khaki, olive, cream, navy, denim) | medium | minimal, outdoor | good | Rust or mustard reads as orange or yellow with `saturation: muted` |
| `hem: cuffed` on jeans | weak | prep, streetwear | good | Raw denim is usually cuffed or stacked |
| **(new value)** `work_pants`: carpenter, double-knee, painter, duck canvas | strong | streetwear | untested | §8 |
| **(new value)** `denim_shirt`: chambray, western snap | medium | vintage, western | untested | m02's denim shirt was read as `oxford_shirt` / light_blue |
| **Against:** `sweatpants`, `joggers`, `athletic_shorts`, `jersey`, `tank_top`, `slides_sandals` | veto | vintage sport, streetwear | jeans vs sweatpants is a known misread | |
| **Against:** `suit_jacket`, `suit_trousers`, `dress_shoe` | veto | tailoring | good | Workwear + tailoring is a real mix, but code can't tell it from a mismatch, so it falls back to the general standard |
| **Against:** `graphic_tee`, `logo: large`, top `volume` 5, `chunky_sneaker`, `basketball_sneaker`, `performance_runner` | −1 each | streetwear | good | |
| **Against:** `puffer`, `shell_jacket`, `rain_jacket`, `fleece` | −1 each | outdoor | good | These pick outdoor over workwear |
| **Against:** `blazer`, `sport_coat` | −1 each | smart casual | good | |
| **Against:** 2+ bright main pieces | veto | streetwear | good | |

## 3. Detection rule
This is computed in code from the garment list. It ignores garments marked `unsure`, accessories, and shoes when they're hidden.

- **Points:**
  - **Anchor (2 points):**
    - `chore_coat`
    - `work_boot`
    - `field_jacket` or `denim_jacket` in a denim wash, brown, tan, khaki, olive, cream or navy
    - `flannel_shirt` when the bottom is `jeans` or `cargos`
    - *(new)* `work_pants`
  - **Support (1 point):**
    - non-skinny `jeans`
    - `cargos`
    - `overshirt`
    - `suede_chukka`
    - `leather_jacket`
    - a flannel without denim or cargos
    - a field or denim jacket in black or charcoal
  - **Minus 1:** each piece in the "against −1" rows above.
- **Vetoes:** any veto piece, or 2+ bright main pieces.
- **The outfit reads as workwear when all of these hold:**
  1. at least 1 anchor
  2. home pieces in at least 2 different slots (outer, top, bottom, shoes)
  3. a total of at least 3 points
  4. no veto

**Tested on all 52 saved photos × 3 runs:**
- **It fires on 3 photos, the same in every run:**
  - s11 (red plaid flannel + jeans)
  - s16 (light double denim, with a tie and loafers)
  - the Oct 7 phone check FC-f6ed (brown quilted jacket + light-blue tee + charcoal jeans)
- **It correctly stays off for:**
  - s10 (black double denim + Chelsea boots, which reads as rock or minimal)
  - m02 (denim jacket + wide trousers + loafers, which is smart casual)
  - m10 and s26 (overshirt + jeans, supporting pieces only)
  - s20 (work boots, but a large-logo graphic tee)
  - p02 (work boots with sweats: veto)
  - the founder's hoodie check. It is vetoed either way: on sweatpants as the model misread them, and on the slides even if the jeans are read correctly.
- **Confidence: medium.** The anchors are pieces the model names reliably. The weak link is the bottom, where both "jeans" and the jeans' wash are shaky (§8). That is why jeans never count as more than support.

## 4. What workwear excuses, and what it never excuses
**Excuses (applied when the outfit reads as workwear, or when he picked it):**

| Rule | Today | Proposal |
|---|---|---|
| `F7_care`: scuffed or worn **shoes** | Half cost (0.25 internal, about −0.2) when the streetwear + workwear + vintage weights add up to ≥0.5 | **Keep.** Broken-in boots are the point of the style ("Wear it into the ground", [RMRS, Sept 2026](https://www.realmenrealstyle.com/mens-fall-2026-trend-forecast/)). The model can't tell broken-in from neglected, so half is the right hedge |
| `F7_care` on distressed-by-design items | Skips **all** care faults, including `stained` and `wrinkled` | **Narrow it for everyone:** distressed-by-design excuses only `pilled_or_worn` (fades, rips, intended wear). A stain on raw denim is still a stain. Denimhunters' line between fading and dirt is "greasy stains or brown streaks" ([updated Oct 5, 2026](https://denimhunters.com/raw-denim-fading-and-washing-guide/)). No saved reading has a stained or wrinkled distressed item, so this moves 0 scores today |
| `P1` top band | 3–4 | **2–4.** Heritage workwear wears trim henleys and tees under a boxy coat, and the code reads the *inner* top, so a regular-fit tee under a chore coat shouldn't cost −0.45 |
| `P1` leg band | straight → relaxed | **straight → wide.** Wide carpenters, double-knees and amekaji wide-straight jeans are home pieces. Sources pair chore coats with relaxed jeans and chunky boots ([Stridewise, search snippet](https://stridewise.com/how-to-style-a-chore-coat/)) |
| How the band applies | Weighted blend of his picks | **A detected style can only widen the band** (the union with his picks or the default), never narrow it. Otherwise "reads as workwear" would start charging slim jeans that the default band allows |
| `P3` everything oversized | Fires outside streetwear and outdoor | No workwear exemption. Support the report's cropped / at-belt exemption, which covers the boxy-flannel-over-double-knees look |

**Never excuses:**
- stains (`stained`, −1.2)
- wrinkles on smooth fabrics
- visible strain
- sleeves over the hands
- untucked tops below the crotch
- **pooling.** Raw-denim stacking belongs in the proposed `stacked` hem value (0 for jeans for everyone), not in a workwear exemption.
- Workwear needs no logo exemption: Carhartt and Dickies patches read as `small`.
- **Double denim gets nothing to excuse,** because I argue below that it should never cost points.

## 5. Style-specific mistakes and done-well signals
**No new point-costing mistakes.**
- **Costume** (chore coat or field jacket + work pants or cargos in the same color family + work boots) gets a tip only: "swap one piece for a basic." RMRS's 2026 advice is to "Buy one piece. Wear it into the ground."
- **Double denim:**
  - Sources split on matching washes:
    - "at least two shades different" ([FashionBeans, updated Jan 16, 2025](https://www.fashionbeans.com/article/the-new-rules-of-double-denim/))
    - "almost the same or a clear contrast" ([He Spoke Style, 2022, older](https://hespokestyle.com/canadian-tuxedo-trend/))
    - SS27 runways showed denim jackets with "matching wide-leg denim jeans" ([FashionUnited, Aug 2026](https://fashionunited.com/news/fashion/ss27-mens-double-denim-trend-prada-sacai-saul-nash-and-more/2026080873864))
  - Only "close but not equal" has no defenders, and that is the boundary the model reads worst. The light/mid wash call flips 18% of the time on s12 (6/34) and 10% on m06 (4/42). The dark end is a mush of black, charcoal and denim_dark (s10 jacket: 18 / 12 / 4 readings).
  - The model also reads denim *shirts* as oxford shirts (m02), so it can't see double denim with a shirt at all.
  - **Recommendation:** the denim near-match (report change #5) stays **a tip forever**, firing only on denim_light + denim_mid. Never give it points.

**Done-well signals** come through the existing credits, with no new credit:
- one anchor piece plus plain basics → `K1_layered` (chore coat or jacket)
- `K2_elevated_piece` (chore coat or field jacket at dressiness 3)
- boots → `K4_shoes_complement` (after fix A below)
- a plaid flannel → `K3_point_of_interest`
- The card can say "Reads as workwear" at no points, as the report already recommends.

**Four general fixes I'm asking for.** They help workwear most but apply to everyone:
- **A. `work_boot` dressiness 2 → 2.5.**
  - Today workwear's signature shoe can never earn the shoe credit, while a Samba (2.5) can. So the textbook outfit (chore coat + tee + raw denim + brown work boots) scores **8.5**, while its smart-casual twin (overshirt + tee + chinos + white leather sneakers) scores **9.0** today.
  - With the fix, both are 9.0. If that is too high, it is a rubric-wide rounding problem for the calibration member, not a reason to keep boots out.
  - Saved-data effect: only s20 moves, from 7.0/6.5/7.0 to 7.5/7.0/7.5 (graphic tee + black jeans + black boots). Consistency doesn't change.
- **B. Undistressed `black` jeans count as dark jeans (2.5), like `denim_dark`.**
  - The model reads dark raw indigo as `black` (m07, 30 of 30 runs). `denim_dark` appears in only 12 of about 560 saved jeans readings, and in **0** of the locked v3 runs, so today's dark-jeans rule almost never fires.
  - Effect: no everyday score moves. At business-casual work and tech interviews, m07 moves from 5.5 to 7.0, stably. The size of that jump is `O1`'s rounding step, which is worth a look.
  - **Don't include `charcoal`.** m10's charcoal jeans flip their distressed flag (15/42 runs), which would widen its work score from 7.0–7.5 to 7.0–8.5.
  - Better: fix the prompt (§8) so raw denim reads as `denim_dark`, and keep B as the fallback.
- **C.** The narrower distressed-by-design scope (§4).
- **D. A piece read as `stained` earns no credit.**
  - A stained chore coat today still earns "Layered" and "Elevated piece". That kept my 4-level test outfit at 5.0; with the fix it scores 4.0.
  - It moves 0 saved scores, because the 156 saved readings contain no stains.

## 6. Anchor outfits (occasion everyday, no style picked)
"Now" is `rubric.py` v3.1. "Proposed" adds fixes A–D. The raw score is in brackets.

| Band | Outfit (schema terms) | Now | Proposed | Why this score is honest |
|---|---|---|---|---|
| ~4 | `chore_coat` tan **stained** · `flannel_shirt` red plaid (bright, medium scale) **wrinkled**, untucked, `below_crotch` · `cargos` olive relaxed **pooling** · `canvas_sneaker` white **worn** | 5.0 (5.05) | **4.0** (3.8) | Four care and fit faults. The style is right; the execution is careless. Today the stained coat's credits hide that |
| ~5.5 | `flannel_shirt` red plaid **wrinkled**, untucked, `below_crotch` · `cargos` olive relaxed **pooling** · `work_boot` brown clean | 5.0 (5.0) | **5.5** (5.5) | Good boots, but a shirt too long, wrinkled, and pants dragging. "Needs a fix" is fair |
| ~6.5 | `flannel_shirt` red plaid medium **wrinkled**, `mid_fly` · `jeans` mid relaxed **pooling** · `work_boot` brown | 6.0 (5.8) | **6.5** (6.3) | A right-idea outfit with two fixable faults. "Getting there" |
| ~7.5 | `tee` white `at_belt` · `jeans` mid straight `cuffed` · `work_boot` brown | 7.0 (7.0) | **7.5** (7.5) | Clean basics plus one considered shoe, the same as tee + jeans + Sambas today |
| ~8.5 | `chore_coat` olive (volume 4) · `tee` white · `jeans` **black** (raw denim, as the model reads it) straight `cuffed` · `canvas_sneaker` cream | 8.5 (8.25) | **8.5** (8.25) | The textbook look with a casual shoe. "Sharp" |
| ~9.5 | `chore_coat` tan (volume 4) · `flannel_shirt` olive plaid (medium) `at_belt` · `jeans` black straight `cuffed` · `work_boot` brown | 9.0 (8.75) | **9.5** (9.25) | All four credits, every piece home, and no fault. I'd honestly call this 9.0. The 9.5 comes from rounding 9.25 up, which is a calibration question |

**Check cases:**
- Chore coat + ripped black **skinny** jeans + white chunky sneakers: 7.0 now and proposed. It doesn't read as workwear, because skinny jeans aren't support and the chunky shoe is −1. **I'd score it 6.5.** The coat's +1.25 in credits outweighs about −1.1 in proportion faults. I'm flagging the gap for calibration rather than adding a rule.
- Double denim, same light wash + white tee + brown boots: 8.0 → 8.5. Mid jacket over light jeans: the same 8.0 → 8.5. That's intended: no points either way.

## 7. Look-alikes and tie-breakers
| Confused with | Shared pieces | Tie-breaker (code) |
|---|---|---|
| Outdoor / gorpcore | `field_jacket`, `cargos`, boots | Any `shell_jacket`, `rain_jacket`, `fleece`, `puffer` or `performance_runner` → outdoor. Canvas, denim, flannel or `work_boot` with none of those → workwear |
| Streetwear (Carhartt WIP is both) | hoodie, `cargos`, `work_boot`, `denim_jacket` | `graphic_tee`, a large logo, top volume 5, or a chunky or basketball sneaker → streetwear. A hoodie is neutral, not a workwear piece |
| Grunge-leaning streetwear | red flannel + ripped jeans (s11) | With a skate or chunky shoe → streetwear. With boots or a low sneaker → workwear. s11 (low-profile sneaker) stays workwear |
| Classic prep | barn jacket (`field_jacket`), chinos, suede chukkas | `oxford_shirt`, `polo`, `chinos` or `loafer` make up the majority → prep. Jeans or boots → workwear |
| Smart casual | `overshirt`, `suede_chukka`, chore coat with chinos | An overshirt is support only. A chore coat + chinos + loafers lands under smart casual unless boots or jeans are present |
| Minimal | black or charcoal double denim + Chelsea boots (s10) | A black denim jacket counts as support only, so s10 doesn't read as workwear |
| Vintage / western | denim jacket + jeans, snap shirts | No western-specific pieces exist in the schema, so western is a flavor of workwear by default |

## 8. What the model can't read reliably, and what to do instead
| Workwear depends on | Evidence it's unreliable | Do this instead |
|---|---|---|
| **Raw vs washed denim** | m07's dark raw indigo is `black` in 30 of 30 runs. `denim_dark` appears in 0 locked v3 runs | Never score rawness. Prompt line: "Dark, rigid or raw indigo jeans are `denim_dark`, not black, unless clearly black dye." Re-run m07. Fix B is the code fallback |
| **Fades vs distressing** (`distressed_by_design`) | Flips on the same photo: m01 13/42, m10 15/42, s19 21/34 vs 13/34, s26 14/34. The prompt lumps "raw denim fades" with rips | **(new field) `wear_look`: none / faded / ripped / not_visible**, replacing the yes/no flag. Only `ripped` lowers jeans' dressiness, and both `faded` and `ripped` excuse wear. A fade-vs-plain flip then changes nothing |
| **Fabric** (canvas, duck, chambray, corduroy, waxed cotton) | Fabric is the weakest attribute group for Gemini 2.5 Flash (52%), "shape >> pattern >> fabric" ([arXiv 2601.15711, Jan 2026](https://arxiv.org/html/2601.15711)). Gemini 2.0 Flash gets 34% F1 on lower-body fabric ([arXiv 2507.09950, Jul 2025](https://arxiv.org/html/2507.09950v2)), which is also the jeans/sweatpants failure | Fabric never carries points. Use garment *type* only. For jeans vs sweatpants or chinos vs work pants, use founder rule 2 (one tap) when the score depends on it |
| **Patina vs dirt** (boots, waxed jackets) | s20's boots read worn in 1 of 3 runs | Keep worn shoes at half cost for workwear, and charge stains in full. Never reward patina |
| **Textured fabric read as wrinkles** | Oct 7: the quilted barn-style jacket read `wrinkled` plus pattern `other` | Prompt line: "Quilting, cord wales, canvas texture, and whiskers or honeycombs on jeans are texture, not wrinkles." No code excuse: founder rule 4 stands for real wrinkles |
| **Denim shirts, carpenter pants** | m02's denim shirt read `oxford_shirt`. Work pants have no value, so they land in `cargos` or `chinos` | **(new values)** `denim_shirt`, `work_pants`, each **flip-safe**: given the same dressiness as its likeliest confusion (`denim_shirt` = 3 like oxford, `work_pants` = 2 like cargos). Collect quietly, check on 10 phone shots, then let detection use them |
| **Brand** (Carhartt, Red Wing, Filson) | Never visible reliably, and off-limits anyway | Never used |
| **Cowboy boots, trucker caps** | No subcategory; hats are ignored | Leave out. Western stays a flavor |

## 9. Sources
- FashionUnited, Pinterest men's trend report 2026 (Sept 9, 2026): https://fashionunited.com/news/fashion/pinterest-mens-trend-report-2026-workwear-leather-and-pink-define-the-look/2026090974520
- Apparel Resources, chore coats lead FW26 outerwear (Aug 31, 2026): https://apparelresources.com/fashion-news/trends/chore-coats-lead-workwear-inspired-outerwear-fall-winter-2026/
- Real Men Real Style, fall 2026 forecast (Antonio Centeno, Sept 29, 2026): https://www.realmenrealstyle.com/mens-fall-2026-trend-forecast/ ("Buy one piece. Wear it into the ground")
- FashionUnited, SS27 men's double denim (Aug 2026, date from the URL): https://fashionunited.com/news/fashion/ss27-mens-double-denim-trend-prada-sacai-saul-nash-and-more/2026080873864
- FashionBeans, new rules of double denim (Luke Sampson, updated Jan 16, 2025): https://www.fashionbeans.com/article/the-new-rules-of-double-denim/ ("Avoid the denim onesie effect")
- He Spoke Style, Canadian tuxedo (Apr 13, 2022; older): https://hespokestyle.com/canadian-tuxedo-trend/
- Denimhunters, raw denim washing and fading (updated Oct 5, 2026): https://denimhunters.com/raw-denim-fading-and-washing-guide/
- Stridewise, how to style a chore coat (search snippet, undated): https://stridewise.com/how-to-style-a-chore-coat/
- Strum, amekaji style (older, undated): https://strum.jp/en/blogs/styling/coordinate-2021-8-1
- Zero-shot product attribute labeling with VLMs (arXiv 2601.15711, Jan 2026): https://arxiv.org/html/2601.15711
- GPT-4o mini and Gemini 2.0 Flash on fashion attributes (arXiv 2507.09950, Jul 2025): https://arxiv.org/html/2507.09950v2
- Lyst Detroit jacket figure (Q1 2024; older, search snippet via Highsnobiety): https://www.highsnobiety.com/p/barn-jacket-barbour-trend
- **Own judgment, not sourced:**
  - the detection point weights
  - band widths
  - every score in §6
  - the flip-safe dressiness picks
  - that 8.75 rounding to 9.0 is too generous
