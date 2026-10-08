# Round 1: Classic prep (Preppy/Ivy + Old money/quiet luxury)

*Style council round 1, Oct 7, 2026. Advocate: classic prep. Every score below was computed with `extraction-test/rubric.py` (v3.1) or with a copy of it carrying the changes I propose. My test scripts are in the session scratchpad (`classic_prep/`), not in the repo.*

**My verdict on the merge: merge.** Use one option, "Classic prep," with one home-garment list, one fit band and one set of allowances. Keep the difference between the two looks as a palette **flavor** ("quiet" or "color") that code computes from colors and patterns. The flavor changes wording and suggestions only, never points. Old money/quiet luxury does differ from prep in palette, logos, fabric and fit (details in §1). But the parts that differ are either already handled by the general rules (tonal outfits are never penalized), unreadable from a phone photo (cashmere, flannel, logo-free versus a tiny logo), or better handled as one wider fit band (§4). A separate "old money" detector would end up as "neutral, collared, no pattern," which can't be told apart from Minimalist plus Smart casual.

---

## 1. Identity
**What it is:** collared tops, knits and chinos or tailored trousers, finished with leather shoes, in a classic palette.
- **Absorbs:** Ivy and preppy (OCBD, rugby, cable knit, chinos, loafers), old money and quiet luxury (tonal camel, cream and navy, soft tailoring, no logos), and "JFK Jr." Americana prep.
- **Who wears it (US 18–30):** college students (class, frat and sorority events, dates) and young professionals on casual Fridays. It is the look most guys mean by "dress nicer" without a suit.
- **How big it is:**
  - Pinterest's Fall 2025 report named a trend **"Classic Prep"**, with "male preppy outfits" searches up 3,973% (global; the base is unknown) ([Pinterest Newsroom, Aug 20, 2025](https://newsroom.pinterest.com/news/the-2025-pinterest-fall-trend-report/)).
  - The 2026 *Love Story* series drove a "JFK Jr. effect" among young men ([Boston Globe, Feb 27, 2026](https://www.bostonglobe.com/2026/02/27/lifestyle/love-story-jfk-jr-fashion/)).
  - Ralph Lauren revenue was reported up 10% year over year in a piece on Gen Z's "preppy comeback." This comes from a partisan outlet, so treat it as secondary ([Daily Wire, May 21, 2026](https://www.dailywire.com/news/the-preppy-comeback)).
  - The "old money" buzzword peaked in 2023 (TheVou, secondary, in `notes/style_archetypes.md`).
  - No source gives a US 18–30 share. The Codex size check is still pending.

**How the two halves really differ** (this is the case against merging, stated fairly):

| | Preppy / Ivy | Old money / quiet luxury |
|---|---|---|
| Palette | Navy, white, khaki **plus brights and pastels** (pink, kelly green, yellow); stripes, madras, argyle | Navy, charcoal, camel, cream, olive, brown; tonal. "No logos. No flash." ([RMRS, Sept 4, 2026](https://www.realmenrealstyle.com/quiet-luxury-for-men/)) |
| Logos | Small logos are part of the look (pony, croc) | "Own nothing with a visible logo." ([Luxe Digital, Sept 9, 2026](https://luxe.digital/style/men-old-money-style.md)) |
| Fabric | Oxford cloth, cotton cable knit, seersucker | Cashmere, flannel, suede, linen (RMRS 2026) |
| Fit | Trim chinos, shorter shorts | Relaxed, pleated, wider trousers ([Proper Cloth](https://propercloth.com/reference/the-return-of-wide-leg-trousers-why-relaxed-tailoring-is-back-in-menswear/), undated) |

The sources themselves treat the two as one family. One says preppy styles have "roots in old money culture" ([The Modest Man, updated May 7, 2026](https://www.themodestman.com/old-money-style-strategies/)). The 2026 coverage folds Kennedy-era quiet luxury into the "preppy comeback" (Daily Wire, Boston Globe). The garments are the same. What differs is palette and fabric.

## 2. Signals table

| Signal (schema terms) | Strength | Also a signal for | Note |
|---|---|---|---|
| `rugby_shirt` | strong | vintage_sport | Collared rugby with chinos or trousers = prep; with jeans and retro runners = vintage sport |
| `oxford_shirt` (any color; `stripes` small) | strong | smart_casual, minimalist | Reads reliably; light-blue denim shirts get read as oxford (m02) |
| `polo` / `knit_polo` | strong | smart_casual, vintage_sport | polo ↔ knit_polo flips are harmless: both are home pieces |
| `cardigan` | strong | minimalist | Rare in the test sets |
| `loafer` + (`chinos` / `trousers` / `shorts`) | strong | smart_casual, minimalist | "a soft, leather loafer is the epitome of preppy style" ([John Lewis, Feb 2025](https://www.johnlewis.com/content/fashion/men/preppy-style)). Boat shoes should be read as loafer (prompt line, §8) |
| `blazer` / `sport_coat` / `unstructured_blazer` | strong | smart_casual | Prep marker only when worn with chinos or jeans; with trousers it reads smart casual |
| `chinos`, `trousers`, non-athletic `shorts` | medium | smart_casual, minimalist | chinos ↔ trousers flips are harmless; chinos ↔ jeans flips (m03) are not |
| `sweater`, `quarter_zip` | medium | smart_casual, minimalist | Knit over a collared shirt is a prep marker |
| Collared top + `shorts` | medium (marker) | — | Summer prep; no other style claims it |
| `stripes` / `checks_plaid` on a collared top, chinos or shorts | medium (marker) | workwear (flannel) | Ribbed knits get read as stripes (s22): harmless |
| A non-neutral color (pink, green, yellow, red, light blue) on a collared top or the bottom | medium (marker) | vintage_sport, streetwear | Sets the "color" flavor |
| All neutral or burgundy/sage, solid or small pattern | flavor only | minimalist | Sets the "quiet" flavor. Not evidence of prep by itself |
| `white_leather_sneaker`, `suede_chukka`, `derby`, `canvas_sneaker` | weak | many | Accepted shoes, not evidence |
| `overcoat`, `field_jacket` | weak | minimalist, workwear, outdoor | Camel coat or Barbour-type jacket |
| Dark, undistressed `jeans` + tailored jacket | weak | smart_casual | Jeans count only with a blazer |
| **Negative:** `hoodie`, `sweatshirt`, `graphic_tee`, `tank_top`, `jersey`, `fleece` as the top (no tailored jacket) | veto | streetwear, vintage_sport, outdoor | |
| **Negative:** `sweatpants`, `joggers`, `athletic_shorts`, `cargos` | veto | | |
| **Negative:** `chunky_sneaker`, `basketball_sneaker`, `performance_runner`, `slides_sandals`, `work_boot` | veto | | "Chunky sneakers" is a classic prep fault (notes Q2) |
| **Negative:** top `volume` ≥ 4; relaxed/wide/barrel jeans; distressed bottoms | veto | streetwear, workwear | A distressed *jacket* is not a veto (see m02) |

## 3. Detection rule
Computed in code from one reading. Prototype: `classic_prep/prep_detect.py`.

1. **Points:**
   - strong top (oxford, polo, knit polo, rugby, cardigan): +2
   - medium top (sweater, quarter-zip): +1
   - tailored jacket: +1.5
   - overcoat or field jacket: +0.5
   - chinos, trousers or shorts: +1.5
   - loafer or suede chukka: +1 (a loafer worn with chinos, trousers or shorts also counts as a strong piece)
   - other accepted shoes: +0.5
2. **Reads as classic prep** when it has **≥ 3 points, ≥ 1 strong piece and no veto.** The shoe is optional, so partial checks still work.
3. **Label:**
   - If at least one prep marker is present (rugby, cardigan, collar + shorts, knit over a collar, a classic pattern, color on a prep piece, blazer over chinos or jeans), the card says "Reads as classic prep."
   - Otherwise it says "classic prep / smart casual." The two styles' allowances are almost the same, so the label doesn't matter for the score.
4. **Flavor:**
   - "quiet": every piece neutral (or burgundy/sage) and solid or small-pattern
   - "color": anything else

**Tested on the saved readings, all 3 runs each:**
- p05-after, s22 and FC-5cf71c83 (light-blue sport coat, striped shirt, navy trousers, loafers) read as classic prep.
- m02 and m08 read as "classic prep / smart casual."
- **The label never changed between runs.**
- The founder's hoodie outfit is vetoed three times over (hoodie, slides, and the misread sweatpants). It still fails on hoodie and slides even when the jeans are read correctly. Classic prep must never be the style that rescues that photo, and it isn't.
- **Honest limit:** only 3 of the 52 test photos are really prep, so this rule is barely tested. It needs 10+ prep photos in the gold set.

**Confidence:**
- High where the model's common flips stay inside the home list: polo ↔ knit polo, chinos ↔ trousers, slim ↔ straight.
- Low where a flip crosses the line: chinos ↔ jeans (m03), loafer ↔ dress shoe (s01), white leather sneaker ↔ retro runner (s05).
- Because the shoe is worth only +0.5 to +1, one shoe flip rarely changes the label.

## 4. What this style excuses, and what it never excuses
Founder rule 1 applies: these allowances switch on when the outfit **reads as** classic prep, even if he didn't pick it. Each one is also confirmed by the garment involved.

| Rule | Today | Classic prep | Why | Tested |
|---|---|---|---|---|
| Fit band (`P1`) | preppy (2–3, slim→straight); old_money (2–3, straight→relaxed) | **one band: 2–3, slim→relaxed** | The model flips slim ↔ straight between runs (p06, s12, s20). With two bands, that flip costs points in one style and nothing in the other | On 12 prep-adjacent saved readings, the separate Preppy band scored 0.5 lower on 4 photos and the Old money band on 3. The merged band was never lower than either |
| `P1_leg_vs_style` for wide legs | −0.45 | **0 when** the bottom is `trousers` / `suit_trousers` / `drawstring_trousers` with leather shoes (or shoes hidden) | Wide pleated trousers are the quiet-luxury look, tied to "old-money dressing" (Proper Cloth). Wide *jeans* stay streetwear's call | QL anchor 8.5 → **9.0**; m02 8.5 → **9.0** (Claude's estimate was 8.5; see the warning below) |
| `C3_bright_clash` | −0.6 | **−0.3** when every bright main piece is a prep home piece (pink oxford + kelly-green shorts) | Bright and pastel prep is intentional ("pastel as well as vibrant… pinks," search snippet, 2025 prep guides); same treatment as "bold" users | 6.5 → **7.0** |
| `B1` / `K3` (all styles, but prep is hit hardest) | A bright, large-striped rugby counts as **2** focal points (color + pattern) | **One garment counts at most 1**, and multicolor patterned pieces count for pattern | A rugby read "red" scores 7.5; the same shirt read "multicolor" scores 8.0. A **0.5 swing from a color flip on one classic shirt.** With the fix, both read 8.5 | Moved s11 (red plaid flannel) 7.5 → 8.0 and one m12 run 8.5 → 9.0; nothing else in 156 readings |

**Warning against my own case:** every allowance above *removes* a penalty or adds a credit. Scores already run about 0.6 high on mirror photos. m02 goes 0.5 above Claude's estimate. If Minimal's band widens to wide (report change #3), m02 rises anyway. The calibration member should net these against the baseline, not stack them.

**Never excused** (tested where marked):
- `F4_pooling` (−0.8). Prep's own rule is a clean, short break: "No puddling fabric" (RMRS, 2026).
- `F7_care`, including "patina." One old-money guide says the style "treats wear as evidence, not damage" (Luxe Digital, 2026). I reject that: the model can't tell a loved, frayed OCBD from a neglected one. A pilled OCBD + chinos + loafers stays 7.5 (−0.4).
- `F6_top_too_long`, `F8`, `F9`, `F10` strain, `L1` shirt below blazer, `T1` untucked dress shirt.
- `S1` chunky shoe + slim leg. Tested: polo + slim chinos + chunky sneakers = 7.0, and the veto drops the prep label.
- `O3` big logo at work (−1.3). Outside work, big logos stay a tip. The quiet flavor gets the wording "a logo-free version reads more classic." No points, because "large" flips between runs.
- `C4a` same pattern, same scale; `C4b` three or more patterns. Two *different* classic patterns are already allowed.

## 5. Style-specific mistakes and done-well signals
**No new mistakes and no new credits.** Prep is the style the current credits were built around:
- `K2` "elevated piece" is literally the prep list (polo, oxford, chinos, loafers).
- `K1` rewards the knit or blazer.
- `K4` rewards the loafer.

The danger with prep is **over-scoring**, not under-scoring. Measured:
- A navy polo + khaki chinos + white leather sneakers scores **8.0 "Sharp."** I'd call it 7.5: clean, but the default uniform. K2 and K4 both pay for the same "one notch dressier" choice.
- A navy crewneck over a solid OCBD + chinos + loafers comes out at raw 8.75, which displays as **9.0 "Dialed in."** I'd call it 8.5.
- The yacht-club costume (navy blazer, cream knit, cream trousers, loafers) also gets **9.0.** I'd call it 8.0–8.5.

I flag these for calibration rather than fix them by style, because a style should never lower a score. The lever is global: K2 and K4 overlap, and an x.75 raw score rounds up.

**Costume guard (tip only, per the research):** all 4 main pieces are home pieces, the outer layer is a tailored jacket, and the trousers are white or cream. Tip: "Swap one piece for something everyday (jeans or a plain sneaker)." I'd support −0.3 later only if gold-set raters mark the costume down.

**Done well (for card wording, not points):** a collared top or a knit over a collar; chinos or trousers with a clean short break; a leather loafer or clean leather sneaker; one point of interest (a stripe, a rugby, one color) in the color flavor, or a light-to-dark tonal range in the quiet flavor.

## 6. Anchor outfits (occasion: everyday; no style picked unless noted)

| Target | Garments (schema terms) | rubric.py now | With my changes | My honest score |
|---|---|---|---|---|
| ~4 | white `oxford_shirt` untucked `below_crotch`, **stained**; khaki `chinos` **skinny, pooling**; grey `chunky_sneaker` | **4.0** (F4, F7, F6, P1, S1) | 4.0 (vetoed, not prep) | 4.0–4.5 |
| ~5.5 | light-blue `oxford_shirt` untucked `below_crotch`; khaki `chinos` skinny, pooling; `performance_runner` | **5.0** | 5.0 | 5.0–5.5 |
| ~6.5 | navy `polo` with a **large** logo, **wrinkled**; khaki `chinos` straight, **pooling**; white `performance_runner` | **6.5** (F4, F7; logo = tip) | 6.5 | 6.5 |
| ~7.5 | navy `polo` (small logo); khaki `chinos` straight, slight break; white `canvas_sneaker` | **7.5** (K2) | 7.5 | 7.5 |
| ~7.5 (check) | same with `white_leather_sneaker` | **8.0** (K2 + K4) | 8.0 | **7.5: over by 0.5** |
| ~8.5 | navy `sweater` over light-blue `oxford_shirt`; khaki `chinos` straight; brown `loafer` | **9.0** (raw 8.75; K1, K2, K4) | 9.0 | **8.5: over by 0.5** |
| ~9 (quiet) | camel `overcoat`; cream `sweater`; brown `trousers` **wide**; brown `loafer` | **8.5** (P1 wide −0.45) | **9.0** | 9.0 |
| ~9.5 | navy `unstructured_blazer`; light-blue striped (small) `oxford_shirt` **tucked**; grey `trousers` straight, no break; brown `loafer` | **9.5** (all 4 credits) | 9.5 | 9.0–9.5 |

**Test cases for `cases.json`:**

| Case | Now | Proposed | Honest |
|---|---|---|---|
| Red rugby (bright, large stripes) + chinos + white leather sneakers | 7.5 | 8.5 | 8.0–8.5 |
| The same rugby read as "multicolor" | 8.0 | 8.5 | 8.0–8.5 |
| Pink oxford + kelly-green shorts + loafers, read bright | 6.5 | 7.0 | 7.0–7.5 |
| The same outfit read muted | 7.5 | 7.5 | 7.5 |
| Costume: navy blazer + cream knit + cream trousers + loafers | 9.0 | 9.0 | 8.0–8.5 |

Note the pink-and-green outfit swings 1.0 on the saturation reading today; my change halves that swing.

## 7. Look-alikes and tie-breakers

| Confused with | Shared pieces | Tie-breaker |
|---|---|---|
| **Smart casual** (most common) | oxford, polo, knit polo, quarter-zip, chinos, trousers, loafers, blazer | Prep markers (rugby, cardigan, collar + shorts, knit over collar, stripes/plaid or color on a prep piece, blazer over chinos/jeans) → classic prep. Otherwise label both. Allowances are nearly identical, so a wrong label costs ≈ 0 points (the C3 halving needs the prep reading; the wide-trouser rule may be shared with Minimal) |
| **Minimalist** (the quiet flavor) | sweater, oxford, trousers, overcoat, loafers, white leather sneakers | Collared or tailored top + chinos/trousers + loafer → prep. Plain tee, boxy top (volume 4), or wide trousers with sneakers → minimal. Both allow tonal looks; neither penalizes them |
| **Vintage sport** | rugby, polo | The shoes and bottom decide: loafers, white leather sneakers, chinos → prep. Jeans + retro runner or low-profile sneaker, or any jersey or track piece → vintage sport |
| **Workwear** | field jacket, chinos, suede chukka | Chore coat, denim jacket, flannel or work boots → workwear. m02 (faded denim jacket + oxford + pleated trousers + loafers) is a real mix; labeling both is fine |
| **Outdoor** | quarter-zip | A fleece top or vest is vetoed → outdoor or smart casual |

## 8. Fields the model can't read reliably, and what to do
I propose **no new fields.** Prep's signals live in garment type, color, pattern and leg shape, which already exist. Instead, three **prompt lines** (each needs the standard extraction re-run):
1. "Boat shoes, moccasins and driving shoes → `loafer`." Today they have no home and land in `other` or `dress_shoe`.
2. "A sweater tied or draped over the shoulders is an `accessory`." Otherwise it could be read as a top and earn K1 (+0.75) for a prop.
3. "For two-color stripes (rugby, Breton), set `color_family` to the stronger non-white color, not `multicolor`." `multicolor` pieces are skipped by every color rule, which causes the 0.5 rugby swing.

**Can't read, so don't score:**
- **Fabric** (cashmere vs. acrylic, flannel, seersucker, madras vs. tartan). Use `pattern` only.
- **Pleats.** Use the trousers type + wide leg instead.
- **Logo none vs. small.** The quiet flavor must not depend on it.
- **Cable-knit texture.** Not readable.
- **"Patina" vs. wear.** Treat as wear.
- **Rugby vs. polo vs. collared sweatshirt.** All home pieces except the sweatshirt. Watch it in the gold set.

## 9. Sources
- Pinterest Newsroom, "2025 Pinterest Fall Trend Report," Aug 20, 2025 (global): trend named "Classic Prep"; male preppy outfits +3,973%. https://newsroom.pinterest.com/news/the-2025-pinterest-fall-trend-report/
- Real Men Real Style (Antonio Centeno), "Quiet Luxury for Men," Sept 4, 2026: "No logos. No flash."; "No puddling fabric." https://www.realmenrealstyle.com/quiet-luxury-for-men/
- The Modest Man, "Old money style strategies," updated May 7, 2026: muted camel, cream, navy, olive; preppy has "roots in old money culture." https://www.themodestman.com/old-money-style-strategies/
- Luxe Digital, "Old Money Style for Men," Aug 11, 2026 (updated Sept 9, 2026): "Own nothing with a visible logo."; "treats wear as evidence, not damage"; "break once, lightly." https://luxe.digital/style/men-old-money-style.md
- John Lewis, "Preppy style: menswear essentials for 2025," about Feb 2025 (date taken from image file names): rugby, chinos, cardigans, cable knits; shorts in "navy, cream, dusky pink or camel." https://www.johnlewis.com/content/fashion/men/preppy-style
- Boston Globe, "Love Story / JFK Jr. fashion," Feb 27, 2026: "familiar, upscale menswear silhouettes with one or two quirky, often sporty, idiosyncrasies." https://www.bostonglobe.com/2026/02/27/lifestyle/love-story-jfk-jr-fashion/
- Daily Wire (Tim Rice), "The preppy comeback," May 21, 2026. A partisan outlet, used only for the Ralph Lauren +10% revenue figure and the Gen Z framing. https://www.dailywire.com/news/the-preppy-comeback
- Proper Cloth, "The Return of Wide-Leg Trousers," undated: "quiet luxury and old-money dressing have become popular"; pair with loafers, derbies, oxfords. https://propercloth.com/reference/the-return-of-wide-leg-trousers-why-relaxed-tailoring-is-back-in-menswear/
- Gentleman's Gazette (E.J. Daniels), "The Quiet Luxury Trend Will End," Apr 12, 2024 (**older**): quiet luxury's palette of "earth tones or subtle variations in muted primary colors." https://www.gentlemansgazette.com/quiet-luxury-trend-will-end/
- (snippet) 2025 prep guides (Harrods, fnl-guide, bowties.com, via search summary): brights and pastels; madras, seersucker, argyle. https://www.harrods.com/en-gb/c/stories/men/how-to-wear-preppy-trend
- (snippet) RMRS, "Fuller chinos vs slim fit," undated: straight has replaced slim as the default; slim chinos still work under a blazer. https://www.realmenrealstyle.com/fuller-chinos-vs-slim-fit/
- In the repo: `rubric/research/notes/style_archetypes.md` (TheVou 2023 old-money peak; ASOS Jan 2026 "Preppy Americana"; the Irreverent Gent costume and "new money" logo notes).
- **My own judgment, not sourced:** the honest scores in §6, the detection point values, the costume trigger, and the claim that a wrong prep/smart-casual label costs about 0 points.
