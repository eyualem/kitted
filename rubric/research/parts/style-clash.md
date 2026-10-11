# Parts engine v5: a piece from another look (Oct 11, 2026)

*Claude (subagent), DECISIONS-LOG #214. The founder (Oct 11): "oversized shirts and graphics are good in streetwear, but in minimal or classy they wouldn't stand." No API calls, no money. **Status: built and live.** v5 is the parts engine's default in Python and in the app. v4 stays reachable with `engine="v4"`.*

**Files:**
- Engine: `extraction-test/rubrics/parts_proto.py`: `TUNE["v5"]` and `_style_clash()`.
- Test: `extraction-test/parts5_test.py` (`/usr/bin/python3 parts5_test.py`, run from `extraction-test/`).
- Numbers: `extraction-test/results/parts5/analysis.txt` and `analysis.json`.
- Port: `app/packages/kitted-core/src/parts.ts` (`styleClash`), data `handoff/fixtures/parts.json` 1.2.0.
- New fixes: `handoff/fixtures/fixes.json` "parts" 1.2.0 (`top_plain_tee`, `top_regular_fit`), with copy in `app/src/i18n/en.ts` `pfix.*`.

**Who is in the photos (rule 7):**
- The founder: profile pending (no birth year or picked looks yet).
- His friends: profile unknown.
- 703a8b and ebe23f: unknown. **Please tell me who they are.**
- Web and stock photos: profile unknown.
- The style council's outfits and the "crossing" outfits below: made-up readings with no person in them. Council cases use the picks written in each case; crossing outfits use no picks.

All real photos were scored with **one test profile**: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. Picks and age never move a number (a test checks this again), so results can't be split by age band or picked look.

## The short version
1. **The gap was real.** v4 had no fault for a piece that breaks the rules of the look the *rest* of the outfit belongs to. Its "piece from another world" check (H3) only catches a tailored jacket over loose or washed jeans, and formality gaps of 2.5 levels or more. A graphic tee (dressiness 2) next to trousers (4) is a gap of only 2. v4.1's style bands never carried over into the parts engine.
2. **The new rule, SX1 "a piece from another look"** (on Style), is built from the style council's own tables, so it isn't new taste:
   - **It fires on a top** that is a graphic tee, or any top at volume 4 or more.
   - **The rest of the outfit** has at least two dressy pieces: trousers or chinos, loafers / derbies / dress shoes, a collared prep top, or tailoring.
   - **The rest reads as** minimal, smart casual or classic prep, and the top breaks every one of those looks.
   - **Its size is −3.0 on Style.** It replaces "reads as …" and is never added on top of H3.
3. **Your three outfits go from 7.0 to 6.5 ("Getting there"):**
   - the oversized graphic tee + pleated trousers + loafers
   - the oversized hoodie + slim chinos + loafers
   - the oversized plain tee + slim chinos + loafers

   Each card now offers the swap that fixes it, worth +0.5 each: "Swap the graphic tee for a plain tee", "Swap the hoodie for a regular fit", or "Swap the loafers for white leather sneakers".
4. **Nothing else moves:**
   - 0 of the 78 real photos
   - 0 of the 49 steadiness photos (still 49/49)
   - 0 of the council's 57 rated outfits and 39 other cases
   - the panel numbers and the held-out half are unchanged, and 8+ stays at 6%

   Every keep-target is met.
5. **Your calls:**
   - **The size.** Within Style alone, 6.5 is as low as these outfits go unless Style drops to its floor. The middle of your 5.5–6 needs a second lever. Options are below.
   - **Two of the exemptions:** an oversized graphic tee under a blazer, and a graphic tee with only one dressy piece.

## 1. Why the existing −1.5 can't do it
Style carries 15% of the average. A −1.5 Style fault moves the total by 0.225, so a 7.075 outfit lands at 6.85 and still shows **7.0**.

The size sweep (`results/parts5`, section 8):

| SX1 size | Your three outfits | Anything else |
|---|---|---|
| −1.5 (the jacket rule's size) | 7.0, 7.0, 7.0 | no change |
| −2.0 | 7.0, 7.0, 7.0 | no change |
| −2.5 | 6.5, 6.5, 6.5 | no change |
| **−3.0 (built)** | **6.5, 6.5, 6.5** | no change |
| −4.0 (the spread rule's big size) | 6.5, 6.5, 6.5 | no change |

- **Why −3.0:** twice the jacket rule, and one step clear of the rounding line. −2.5 lands at 6.70, just under the 6.75 that would round back up to 7.0. A 1-in-12 color or condition read could push that back over.
- **Why not lower:** reaching 6.0 inside Style would take −6, which puts Style at its floor of 1.

**Options for 5.5–6 (your call; Claude's default is to keep 6.5 until the gold set):**
- **(a) Also charge the shape** on the two oversized-over-slim outfits: a roomy top over slim pants at −1.0 to −1.5 on Proportions, which takes those two to 6.0.
  - The evidence for slim legs is thin. Every 2023+ source names skinny legs; Put This On and H&M allow a short, rounded top over a slimmer leg.
  - The graphic tee over straight trousers would stay at 6.5.
- **(b) Weight Style at 20%.** That changes every score and needs the gold set.
- **(c) Hold the score under a ceiling,** like Occasion does. That mixes up what the parts and the occasion each do.

## 2. The rule, and where each piece of it comes from

| Condition | From the council (RULEBOOK Part 4) | Reading it uses, and how steady it is |
|---|---|---|
| The top is a **graphic tee** | Smart casual vetoes it; prep vetoes it without a tailored jacket; minimal vetoes graphics | The subcategory `graphic_tee`, never `pattern` (graphic vs plain flips on 4 of 12 photos). A graphic tee whose print reads as solid still fires |
| …or **any top at volume 4+** | Prep vetoes any boxy top; smart casual's band stops at 3; streetwear "never excuses an oversized top over a slim leg" | Volume ≥4: 97–100% steady |
| **Two or more dressy pieces** in the rest | Streetwear's vetoes (trousers, suit pieces, dress shirt, tailoring, overcoat; dress shoes, derbies, loafers; a prep top without a jacket) plus chinos, its one "against" piece | Garment type: 100% |
| **The rest reads as minimal, smart casual or classic prep** | `detect_styles` on the outfit with the top taken out, no picks | Detection; it flips on about 10% of multi-run photos, but **SX1 fired on 0 of them** |
| **The top breaks every one of those looks** | A graphic tee breaks all three. A roomy top breaks a look when the whole outfit no longer reads as it, or when its volume is above that look's band: smart casual and prep stop at 3, minimal at 4 | Same |
| **The top isn't the look's own piece** | No look the whole outfit reads as counts it as an anchor or home piece | Same |

- **Size:** −3.0 on Style. The line reads "the graphic tee and the dressier pieces with it come from different looks", or "the oversized hoodie …".
- **When SX1 fires, "reads as …" (H1/H2) doesn't.** An outfit with a piece from another look doesn't cleanly read as that look.
- **H3 and SX1 never stack:** the larger one counts. A tank top with suit trousers keeps H3's −4.0.

### Exemptions, and the calls flagged for you
| Case | v5 | Why | Flag |
|---|---|---|---|
| A tee or hoodie under a blazer or topcoat; a graphic tee under a chore coat or leather jacket | **no fault** | A layer that belongs to the quiet look bridges the two (an anchor or home piece in its table). Sources: cohesion.md H3b; v5-tailoring "hoodie: works with conditions" (FashionBeans 2025, Mr Porter, Ape) | **The hoodie under a topcoat** (your "debatable" case) is kept as no fault |
| An **oversized graphic tee under a blazer** | **no fault** | Same bridge | **Your call.** FashionBeans 2025 says no oversized fits or cartoon graphics under a blazer. The bridge treats every top the same; the gold set should test it |
| A graphic tee under a **bomber**, a denim jacket or a puffer, with trousers and loafers | **fault** (7.5 → 7.0) | A street layer doesn't bridge into the dressy look | — |
| **A graphic tee with only one dressy piece** (with chinos or trousers and white leather sneakers) | a tip, no points (`SX1_tip`) | A very common outfit. Your words were "minimal or classy", and this one is in between | **Your call:** make it a fault? A sweep shows it would move nothing else |
| **Loafers with a graphic tee and wide jeans** (only one dressy piece) | no fault | Loafers with wide legs are endorsed (RMRS 2026, `notes/proportions.md`). Shoes are never the odd piece here: Shoes already charges a much-too-dressy shoe (SD3) | — |
| **A regular hoodie or sweatshirt** with chinos and loafers | no fault | A grey crewneck with chinos and loafers is classic Ivy (the council's own `edge-tap-sweater`, 7.5). Hoodie vs sweatshirt flips between runs, so neither can be street-coded by type alone | — |
| **An oversized top over straight or wide trousers** with loafers | no fault | The rest reads minimal, whose band allows volume 4 (the city-boy shape) | — |
| **A roomy knit, or an oversized oxford,** with chinos and loafers | no fault | It's the look's own piece | — |
| Sweats or joggers with tailoring | unchanged | The occasion ladder owns athletic bottoms (one fact, one owner) | — |

**This partly reverses a council ruling.** RULEBOOK Part 3 says "mixing styles" is never a mistake, and ruling 2 says detection never adds a penalty. Your Oct 11 words override that for this one narrow case: a street-coded top against a quiet look, with two dressy pieces and no bridging layer. Every other mix is still never a fault.

## 3. Results

### The crossing outfits (made-up readings, no person, Everyday)
| Outfit | v4 | v5 | Style |
|---|---|---|---|
| **Oversized graphic tee + pleated trousers + loafers** (your case 1) | 7.0 | **6.5** | 4 |
| **Oversized hoodie + slim chinos + loafers** (your case 2) | 7.0 | **6.5** | 4 |
| **Oversized plain tee + slim chinos + loafers** (your case 3) | 7.0 | **6.5** | 4 |
| Regular graphic tee + trousers + loafers; + wide trousers; + chinos and derbies; + suit trousers and dress shoes | 7.0 | 6.5 | 4 |
| The same with the print read as solid | 7.0 | 6.5 | 4 |
| Graphic tee under a bomber + trousers + loafers | 7.5 | 7.0 | 4 |
| Oversized sweatshirt + slim chinos + loafers | 7.0 | 6.5 | 4 |
| Tee under an unstructured blazer + trousers + loafers | 7.0 | 7.0 | 8.5 |
| Hoodie under a topcoat + trousers + loafers | 7.0 | 7.0 | 7.5 |
| Oversized graphic tee under a blazer + trousers + loafers | 7.0 | 7.0 | 7 |
| Grey sweatshirt + navy chinos + loafers | 7.0 | 7.0 | 7.5 |
| Boxy tee at the belt + wide trousers + loafers (city boy) | 8.0 | 8.0 | 7.5 |
| Oversized sweatshirt + straight chinos + loafers | 7.0 | 7.0 | 7.5 |
| Graphic tee + khaki chinos + white leather sneakers (tip only) | 7.0 | 7.0 | 7 |
| Oversized graphic tee + wide jeans + chunky sneakers (streetwear done right) | 8.0 | 8.0 | 8.5 |
| Jersey under an unstructured blazer + dark jeans + low-profile sneakers | 7.5 | 7.5 | 7.5 |

All 29 crossing outfits behave as intended (10 faults, 2 tips, 17 unchanged). The full list is in `analysis.txt` section 1.

### The council's outfits, by style (before → after)
**No change in any style:** 0 of the 57 rated outfits moved, and 0 of the 39 others (your group and the edge cases). None of the council's outfits wears a street-coded top against a quiet look without a bridging layer. The per-style numbers are identical under v4 and v5:

| Style | n | Mean error | (a) plain at 6.5–7.5 | (b) deliberate reaches 8 | (c) mistakes ≤6 | Best |
|---|---|---|---|---|---|---|
| Streetwear | 5 | +0.40 | 0/1 | 2/2 | 1/2 | 8.0 |
| Workwear | 8 | −0.06 | 3/3 | 2/3 | 1/2 | 8.0 |
| Vintage sport | 11 | −0.25 | 3/4 | 2/5 | 2/2 | 8.0 |
| Outdoor | 7 | −0.18 | 2/2 | 0/3 | 2/2 | 7.5 |
| Minimal | 8 | −0.38 | 3/3 | 0/3 | 1/2 | 7.0 |
| Classic prep | 11 | −0.25 | 3/4 | 1/5 | 1/2 | 8.0 |
| Smart casual | 7 | −0.32 | 2/2 | 1/3 | 2/2 | 8.0 |

Each style's deliberate 8s are still 8 (8 of 8). Its plain fits still sit at 6.5–7.5. The jersey-under-blazer anchor (vs-9) stays at 7.5.

### The keep-targets (all met)
| Target | v5 |
|---|---|
| Your friend's blazer (d1967f) at 7 or below | 7.0 |
| The chore coat (e438d4, f4870b, fb0b17) at 7–7.5 | 7.0, 7.0, 7.0 |
| Your gingham fits as now (5a9049, 7f14a4, f07193) | unchanged |
| Your tee + wide jeans (8ad378, 403ade) at 7 | 7.0, 7.0 |
| Plain fits at 7; each style's deliberate 8s still 8 | yes (above) |
| Batch 1 arm A steadiness | 49/49 (zoom1 66/66; with lightness 49/49; no run differs from v4) |
| Panel gap within ±0.2 | +0.01 (same as v4) |
| Held-out half | within 0.5: 26 → 26; MAE 0.43 → 0.43 |
| 8+ at 5–12% on the real photos | 6% (5 of 78) |
| Picks never change a score | 0 of 141 readings × 9 picks sets move; parity checks it on every reading |

### Why no real photo moves
- Of the 78 photos, 11 have a street-coded top, and none has two dressy pieces with it. Most are worn with jeans, shorts or sweats; stock s25's roomy camp shirt is with drawstring trousers and Chelsea boots (neither counts as dressy).
- Your tees at volume 4 are over wide jeans with white leather sneakers. Your roomy sweatshirt (968016) is over jeans.
- The only graphic tee with chinos (stock s23) has its shoes out of view, so the rest has one dressy piece.

### Steadiness of the readings it uses
On the multi-run sets, a street-coded top appears in 2–7 photos per set. It flips between runs here and there: the graphic tee on 0–2 photos per set, volume ≥4 on 0–2. SX1 itself fired on 0 photos in every set, so it adds no wobble today.

The real risk is a future photo that sits on the edge, for example a graphic tee over trousers and loafers whose tee reads plain in one run. There, a flip moves Style by 3 points and the total by about 0.45, which can move the score a half point. The gold set should include those outfits.

## 4. The fixes
- **New lines** (one fix engine; a line shows only when the rounded score really rises):
  - "Swap the {name} for a plain tee": a graphic tee becomes a plain, regular tee (group color, after "a solid color").
  - "Swap the {name} for a regular fit": a top at volume 4+ goes to 3 (group fit, after "a better fit").
- **"Swap the loafers for clean sneakers"** is the existing "Swap the {name} for white leather sneakers" line. It now fires here because one dressy piece is no longer enough for SX1.
- **What your three cards show** (empty closet, no picks):

| Outfit | Score | Fixes shown |
|---|---|---|
| Oversized graphic tee + pleated trousers + loafers | 6.5 | "Tuck in your graphic tee" → 7.0 · "Swap the graphic tee for a plain tee" → 7.0 · "Swap the loafers for white leather sneakers" → 7.0 |
| Oversized hoodie + slim chinos + loafers | 6.5 | "Swap the chinos for navy chinos" → 7.0 · "Swap the hoodie for a regular fit" → 7.0 · "Swap the loafers for white leather sneakers" → 7.0 |
| Oversized plain tee + slim chinos + loafers | 6.5 | the same three, with "Swap the tee for a regular fit" |

- **Odd but true:** "Swap the chinos for navy chinos" leads on the two slim-chino cards. The engine's chino swap also sets a straight leg, and straight chinos let the rest read minimal, whose band allows the roomy top. "Swap to straight-leg chinos" says the real move and gives the same +0.5, but loses the tie on raw gain. That's a wording question in the shared fix engine, left for the founder's copy skim.
- **No real card changes:** 0 of the 2,788 real-reading cases. 128 hand-written edge cases change.

## 5. What shipped, and the parity
- **Defaults:** `parts_proto.py` defaults to `engine="v5"`; parts data 1.2.0 (`make_parts_json.py`); fix catalog 1.2.0.
- **Stored version:** the app stores `rubricVersion: "parts-1.2.0"` on new checks. An older parts check edited later (a correction, or the occasion) is re-scored by v5. No saved reading changes under v5, so nothing visible moves.
- **Parity, `parts_parity.json`: 13,027 cases.**
  - New: 17 SX1 edge readings; v4 as a tune variant; a v5 what-if (SX1 at −1.5 with one dressy piece).
  - `v5_vs_v4`: 39 cases changed. All are hand-written edge or fuzz readings; none is a real reading.
  - The generator asserts SX1 and its tip both fire, and that picks never move a score.
- **Parity, `parts_fixes.json`: 18,131 cases** (3 clash fix edges added). The generator asserts both new lines appear.
- **TypeScript:** equal on every case of both files. `npm run check` is green (one vitest timing test flaked under machine load and passed on rerun).

## 6. What the gold set needs (for this rule)
Pairs that change one fact:
- the same graphic tee with pleated trousers + loafers, vs with wide jeans + chunky sneakers;
- the same oversized tee over slim chinos vs straight or wide trousers, with loafers;
- an oversized graphic tee with trousers and loafers, with and without a blazer over it;
- a graphic tee with khaki chinos and white sneakers (the tip case);
- a hoodie under a topcoat vs the same hoodie with trousers and loafers.

For each friend, note their birth year and 3 picked looks (rule 7).
