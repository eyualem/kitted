# Parts scoring: Color (Oct 10, 2026)

*Brief: `BRIEF.md` (DECISIONS-LOG #195). Builds on `notes/color.md` (Oct 7 research, all sources below come from it unless marked new), `proportions-color-style.md`, `rubric/v4.md`, `rubric.py` v4.1, the closet measuring build (#104–107) and the judge pilot (#192–194). No new web search: the gaps were measurement questions, so this round was a prototype on the saved photos instead.*

**Profiles (rule 7):** the stock and web photos are "profile unknown" and were scored with one test profile (boldness "a little", no picked looks; under v4 picks never move a score). His own photos: profile still pending (it's on his to-do list), so they're also scored with the test profile. His friends' photos: profile unknown. No split by age band or picked look is possible yet.

**The prototype** (scratch scripts, not in the repo, no app code changed): the app's own `KittedMeasure.swift` (via `kmeasure crops`) on every closet-call box in `extraction-test/results/closet1` (56 photos × 3 runs = 174 pieces per run), plus 4 lighting copies of each photo (−1 and +1 stop, warm and cool white balance), plus his and his friends' 14 phone checks from the Oct 9 pull, plus a box-free version that measures a torso band and a thigh band from the pose. About 600 measurements, all on the Mac, nothing sent anywhere.

## The short version
- **Color is mostly a 7.** On 69 saved photos the prototype part gives 7.0 to 49, 7.5 to 13, 8–8.5 to 5 and 5.5 to 2. That matches the panel (color median 7.0) and the anchor "safe neutrals, nothing wrong = 7". Most of his and his friends' fits are dark neutrals and land at 7. That's fair: their problems are proportion, hem and shoes, not color.
- **Keep the Oct 7 verdict.** No color wheel, no warm/cool rules. Nothing found here argues for them, and measured hue is the least trustworthy number the phone produces (below).
- **The measured numbers are good at two things:** which piece is lighter, and how far apart top and bottom are (robust to exposure and white balance), and as a check on "is this color actually bright?". They're bad at dark-on-dark, small shoes, pieces under a layer, and anything absolute.
- **Two problems must be fixed before any measured number feeds a score.** (1) **Skin gets into the garment colors:** a short-sleeve shirt's or ripped jeans' box includes his arms or knees, and in 5 of 83 neutral-colored tops and bottoms a skin-like cluster made up 13–38% of the "garment", moving its lightness by up to 12. Under "never skin" that can't touch a score. (2) **The closet's "drop the outer layer's colors" step is a cliff:** it removed colors from 20 of 56 bottoms, and switched on or off under a lighting change for 7% of pieces, moving a pair of jeans from L\* 46 to 34. Scoring needs its own measurement (below).
- **Timing is the real blocker.** Measuring needs the closet call's boxes, which arrive about 4 s after the score card. So the color part can only use measurement if (a) the scoring call returns lightness or boxes, (b) a box-free measurement runs in photo prep, or (c) the card waits. Recommendation in section 1.4.

## 1. What the part judges

### 1.1 The checks
"Units" are part points out of 10, starting from 7.0. The weight column says how much each moves the part, and why.

| # | Check (plain words) | Evidence (from `notes/color.md` unless marked) | Moves the part | Measured by | Reliable today? | Needs |
|---|---|---|---|---|---|---|
| C1 | **Too many accents.** A neutral base with at most one standout color. 3+ accent colors (muted counts half) = too many; 5+ color families with 2+ accents = a bit busy | Very high: every guide (Effortless Gent 2026, Outfit Narrative, TheVOU); Schloss & Palmer 2011 (similar hues and lower saturation read as harmonious; one saturated accent on a muted ground is preferred) | −2.5 (3+ accents); −1.0 (5+ families) | AI facts: `color_family`, `saturation` (v4 C1a/C1b) | color family 70–76% on his photos; the count is more forgiving than the family (a wrong family among neutrals usually doesn't change the count) | Measured chroma to fix "muted vs bright" (C2) |
| C2 | **Bright colors fight.** Two saturated colors on the main pieces (shoes count half) | High; Schloss & Palmer: contrasting hues judged "neither preferable nor harmonious" | −2.0; −1.0 when the outfit reads as streetwear or his boldness is "bold" | AI facts (v4 C3), **plus a measured-chroma check** | AI saturation is shaky: the red tee in s23 was read "muted" (measured chroma 37; the panel called it "bright red"); his brown plaid flannel was read "orange", a bright accent (measured L\* 20, chroma 4.5, so clearly not bright) | Chroma from a skin-free region, corrected by the photo's own neutrals (1.3) |
| C3 | **Muddy: top and bottom blur together.** Different colors at the same middle lightness. Never for tonal (same family), all-dark, black or white, or a denim bottom | Moderate-high: Effortless Gent; Ou & Luo 2006 (small lightness differences reduce harmony; search summary); O'Donovan & Agarwala 2011 (colors "should not be too similar"). The panel's anchor names it | −1.5 (to 5.5) | **Code from a measured gap** (upper piece vs bottom, \|ΔL\*\| < 10) gated by AI facts (different families, both middle by family name, both `mid` where the lightness word exists) | Fired on 1 of 56 photos with the denim exemption (s23), 3 without (s04, s12-under-lighting, s23). The order of top vs bottom is robust (1.2) | A skin-free, no-cliff measurement; the gold set to set the threshold. Denim exemption is my call (see 6) |
| C4 | **Near-match.** A dark separate jacket with different dark trousers (navy blazer, black trousers): match exactly or contrast clearly | High: Nathan Tailors (Aug 2026), Mr Porter | −1.5 | AI facts (v4 C5) | Fires rarely (1 of 56); dark families are the AI's weakest colors | Nothing new |
| C5 | **Denim washes almost match** (new). Denim shirt or jacket over jeans one wash apart | High among denim guides (Harry Rosen, Opumo, Mr Porter, Fashion Magazine) | −1.0, only when the measured gap is also < 15 | AI facts (`denim_light/mid/dark` on both) + measured gap as a veto | Untested on real double denim (one stock photo, s16, is a matched set and correctly doesn't fire) | A few double-denim shots in the gold set |
| C6 | **Pattern clash.** The same pattern twice at the same scale; the same pattern type twice; 3+ patterns (not in streetwear). Patterns live here because the eye reads them as color noise, like v4 | Moderate (guide consensus; no lab evidence) | −1.5 / −0.75 / −1.5 | AI facts (v4 C4a, C4b) | `pattern` reads are steady on solids; fine stripes vs solid flips (v4 already treats fine as solid) | Nothing new |
| C7 | **Too many loud pieces** for his boldness (bright colors and big patterns on the main pieces) | Guides' "one focal point"; S&P figure-ground | −1 per half-step over, max −2 | AI facts (v4 B1) + his boldness setting | As above | Nothing new |
| **Positives (only when no fault fired)** | | | | | | |
| P1 | **One standout piece:** one bright color or one medium/large pattern, every other main piece neutral | Very high (H1) | +1.0 | AI facts (v4 K3's color half) + measured chroma | As C2 | Same as C2 |
| P2 | **One quiet accent:** one muted color (sage, rust, teal, dusty pink) on an otherwise neutral fit | High; S&P (low saturation raises harmony); the panel praised "teal crew lifts black baggy jeans" (P042, 7.5) | +0.5 | AI facts (`saturation: muted` on one non-neutral) | Same as C1 | Nothing new |
| P3 | **Tonal with a range:** all main pieces in one color family (not all-black) with at least two lightness levels among them (cream knit, tan chinos; olive suit, dark olive knit) | Moderate + research: same-hue pairs are rated most harmonious (S&P); Outfit Narrative's light-mid-dark | +1.0 | AI facts: family + the **AI lightness word**, not measurement (measured L\* got the matched sweatsuit p02 wrong by 28 because of the drop-step cliff and leg shadows) | Lightness word 95% repeatable between runs (closet1) | The word in the scoring call (1.4) |
| P4 | **Tonal, anchored by the shoes:** one family on top and bottom, shoes at a different lightness (ivory set, black shoes) | Same | +0.5 | AI facts + lightness words | Same | Same |
| P5 | **Color tie-in:** the upper piece's color repeats on the shoes or a big accessory (not white, black, grey, navy or denim, which repeat by accident) | Low-moderate: Outfit Narrative's "sandwich", Effortless Gent; no research. The panel asked for it twice ("one brown shoe would tie into the belt", P001) | +0.5 | AI facts (`color_family` on two pieces) | Fired 0 times in the 69 photos: shoe colors are often `multicolor` or misread | v5's accessory reading (chain, cap, scarf colors) |
| P6 | **Light, mid and dark:** top, bottom and shoes each at a different lightness | Low-moderate (Outfit Narrative), mild research (lightness contrast raises preference) | +0.5 | AI lightness words on the three pieces | Words 95% repeatable | Same as P3 |

**Not in this part, on purpose:**
- **Color-wheel harmony** (complementary, triadic): no evidence it predicts liked combinations (O'Donovan & Agarwala 2011; Schloss & Palmer 2011). The useful bit of "complementary" (a warm accent on a cool base) is already P1/P2.
- **Warm/cool mixing:** one source (Permanent Style), and it would need measured hue, which white balance moves by up to 77° (1.2).
- **Skin-tone or "personal contrast" color rules:** out of bounds.
- **Retired clash rules** (navy + black casual, brown + black, belt must match shoes): 2026 sources call them outdated (Ape to Gentleman 2026). The v4 belt tip should go.
- **Overall darkness:** a study rated dark palettes poorly, but menswear accepts all-dark fits, and his whole wardrobe is black. All-black stays a 7, with the flat-tonal tip.
- **Big logos, fading, wrinkles:** they belong to occasion/cohesion and condition, not color.

### 1.2 What the phone measures today, exactly
From `KittedMeasure.swift` (`Measure.measure`, `Measure.run`):
1. **Which pixels belong to a piece:** the person mask (Vision person segmentation), inside the piece's box from the closet call. Where boxes overlap, the smallest box wins (ties: the outer layer). Every head region (grown 5%) is removed. Hands and the phone are removed from the color pixels (kept in the picture).
2. **Drop the outer layer's colors:** where an outer layer's box overlaps, the outer piece's main colors (clusters of 30%+, measured outside this box) are found, and this piece's clusters within ΔE 12 of them are removed, unless that removes more than 60%.
3. **Color:** k-means with 3 clusters in CIE L\*a\*b\* on up to 6,000 sampled pixels at 1024 px, started at fixed lightness quantiles, so it's deterministic. The app stores the **largest cluster's** hex and L\* (`sampled_hex`, `sampled_l`) plus all 3 clusters with their shares.
4. Also a crop quality, a cut-out and Apple's feature print, for the closet only. **No score uses any of it today.**

### 1.3 How stable and how right it is (the prototype)

| Question | Result | What it means |
|---|---|---|
| Same piece, slightly different boxes (3 closet runs, 174 pieces) | Largest-cluster L\* within 5 on 90%, but **jumps by 10–82 on 12 pieces (7%)**: two-tone sneakers, stripes, a cream striped shirt whose two clusters are 42% vs 41% | Score with the **share-weighted mean L\*** of the 3 clusters: within 5 on 91%, worst jump 21 |
| Same piece, different photos (his grey hoodie: alone, under a striped shirt, under the tan overshirt) | Weighted L\* **26 / 31 / 29** today; largest-cluster 15 / 33 / 31 in today's rerun (#106 logged 28 / 33 / 30: the "alone" photo has two near-equal clusters and flips). The closet call's words varied ("medium grey", "heather grey", "grey") | Measured lightness is steadier than the AI's words for the same piece, if you use the weighted value |
| Exposure −1 / +1 stop | Every piece's L\* moves **−10 / +12** (p10–p90 about ±19) | Absolute bands ("L\* 40–60 = mid") would misfire with the room light. Never use them |
| …but top vs bottom | **The order never flipped** when the gap was 8+ (0 of 56 at each setting); the gap itself moved 1–2 typically | Relative use (which is lighter, how close) is safe against exposure |
| White balance warm / cool | L\* unchanged (median 0), but hue swings (warm: p10 −77°) and chroma rises (median +6, p90 +22) | Measured hue and chroma need correcting; lightness doesn't |
| Correcting with the photo's own neutrals (pieces the AI calls white, grey or black) | Cuts the warm shift from 12.7 to 3.7 (median a\*b\* distance) and cool from 7.4 to 1.9: about 70% (in line with the reference-card finding in the colorimetry notes). 44 of 56 photos have such a piece | A built-in grey card. With none, or with a strongly tinted one (mirror light, tint above 10), skip the chroma check |
| Measured order vs the AI's lightness words (upper piece vs bottom) | The AI words **tie on 32 of 56** photos ("mid"/"mid", "dark"/"dark"); where they differ, the measurement agrees 22 of 24 | The measurement adds the "how close" the 3-step word can't give |
| Measured "bright" vs AI saturation | s23 red tee: AI "muted", measured chroma 37, panel "bright red". His brown flannel: AI "orange" (bright), measured chroma 4.5. Muted pink, yellow, purple read 5–29 | Measured chroma is a good **override at the extremes only** (35+ bright, 12 or less muted); in between, keep the AI |
| Dark on dark (his phone checks) | Black jeans L\* 1–5, black tees and hoodies 8–14, the navy chore coat 6–8, charcoal jeans 4–5; chroma 0–3 for all | **The AI wins.** Indoor phone light crushes darks; navy, charcoal and black can't be told apart by pixels. Muddy can't fire here anyway (dark is exempt) |
| Small shoes | Crop quality 0.22–0.50; black Chelsea boots measured L\* 29–80 (glare, sole, floor); his olive work boots measured grey-brown, chroma 1–10 (the AI also said grey) | **Neither works.** Shoes use the AI's word, never a measurement |
| A piece under a layer or next to a pattern | His grey tee under the brown gingham measured brown (chroma 19); the white tee under the navy chore coat had a largest cluster of L\* 7 in one photo and 69 in the other | **The AI wins** on inner layers. Use the measurement for the outer piece and the bottom only |
| The outer-color drop step | Removed colors from 20 of 56 bottoms (the top's box overlaps at the waist); switched on/off under a lighting change in 51 of 690 cases; s12's jeans: L\* 46 with the drop, 34 without | **A cliff.** Scoring must measure without it (1.4) |
| Skin inside garment boxes | 5 of 83 neutral-colored tops and bottoms carry a warm skin-like cluster of 13–38% (short sleeves, an open camp collar, ripped knees); s27's black camp shirt weighs in at L\* 27 instead of 15 | **Must be fixed before scoring** (risks, 6) |
| Box-free bands (torso between the shoulders, thighs between hips and knees; from the pose, in prep) | No pose on 10 of 70 photos (seated, cut off). Where both exist, the band gap is within 4 of the box gap (median), p90 20; order agrees 30 of 31 when the box gap is 10+. It measures what the eye sees in the torso, so an open jacket's shirt front mixes in (s09's suit: −2 by box, 38 by band) | Usable before the score card, as a veto; too rough to create a fault on its own |

### 1.4 What it would take to feed scoring
The order of calls today: photo prep (close-ups, ~0.25 s) → scoring call (6.6 s) → **score card** → closet call (boxes, ~4.3 s) → measuring (1.0–1.5 s). The color part has to be final when the card shows (same photo, same score; a score that changes on screen breaks trust).

| Option | What changes | Cost | Verdict |
|---|---|---|---|
| A. Add one field, `lightness` (light/mid/dark) per garment, to the scoring call | Prompt + schema | A flip test (~$1–2, the usual 3 runs); the v5 lesson is that extra fields can break consistency, but this one was 95% repeatable in the closet call | **Do first.** Unlocks P3, P4, P6 and the "both mid" gate of C3 from the AI alone |
| B. Box-free bands in photo prep, used only as a veto | New native code in `KittedMeasure` (pose and person mask already run there); ~0.1–0.3 s | Small; no cost per check | **Do second.** It can only stop C3 or C5 from firing (gap 15+ means "not muddy"), and can only switch a "bright" read off (chroma 12 or less on a corrected torso), never on. Works on 86% of saved photos; NA otherwise |
| C. Boxes in the scoring call (`box_2d`), then measure before the card | Prompt + schema + reorder | A bigger flip test; boxes are long outputs; +1 s for measuring before the card | Later, only if A + B leave real misses on the gold set. This is what lets measured lightness *create* a muddy fault and fix s23-type "muted" misreads |
| D. Hold the card until the closet call and measuring finish | Reorder only | +5–6 s on every check (6.6 → ~12 s) | No. Speed is part of the product |

**Whatever feeds scoring needs its own measurement, not the closet's.** For scoring:
- measure on the box area that no other box covers (no outer-color drop);
- use the share-weighted mean L\*;
- remove skin first (risks, 6);
- for chroma, correct by the photo's own neutral pieces, and skip when the tint is above 10;
- compare pieces only within one photo.

The closet keeps its current measurement.

## 2. The part score

**Formula:**
- Start at **7.0** (safe neutrals, nothing wrong).
- **Subtract** every fault that fires (C1–C7).
- **If no fault fired, add** the positives (P1–P6). P1 and P2 are either/or, and so are P3 and P4.
- Round to the nearest half. Floor 2.0, cap 9.5. A 10 stays out of reach until the gold set shows a color story people rate above everything else.

Faults block positives because the panel's anchors put "anything wrong" below 7 and only clean color stories above it.

| Score | What it looks like | Example from the saved photos |
|---|---|---|
| **9–9.5** (rare) | One family with real range, or one standout piece, plus a tie-in or a light-mid-dark spread | None in the 69 saved photos. It needs a tie-in, and P5 never fired |
| **8–8.5** | Tonal with a range; or one standout piece on neutrals with light, mid and dark | s07 olive suit + dark olive knit + black cap-toes (8.0; panel 8.5) · s15 cream plaid overshirt, mustard tee, taupe trousers (8.0; panel 8.0) |
| **7–7.5** | Safe neutrals (7); one quiet accent or a tonal set anchored by the shoes (7.5) | Most of his fits (black tee, black jeans, white sneakers: 7.0) · his friend's teal crew + black jeans + white sneakers (7.5; panel 7.5) |
| **5–5.5** | One fault: muddy, a near-match, two patterns at one scale, or 5+ colors | s23 red tee + blue-teal chinos at the same depth (5.5; panel 6.5) · m08 charcoal jacket + navy trousers (5.5) |
| **2–3** | Several faults: 3+ accents plus a bright clash, or bright clash + 3 patterns | Not in the saved photos |

**Against the panel (52 photos with both):** mean difference +0.01, mean absolute difference 0.36, within 0.5 on 44 of 52, correlation 0.46. Treat the agreement with care: the panel's color score tracks its overall gut score at r = 0.79 (and proportion 0.72), so it's mostly a halo, not a separate color judgment. Its 6.5s are largely photos with slides or long hems, not color problems.

**Stability:** the same part score in all 3 closet runs on 53 of 56 photos (the 3 flips are the AI's lightness word changing, e.g. s23's chinos "mid" → "dark"), and under the lighting copies on 55–56 of 56 (one flip: s10's burgundy crossing the chroma-35 line at +1 stop). The thresholds are cliffs, as expected; the gold set sets them.

### Three worked examples (judge pilot IDs)
1. **P053 (s23, web mirror selfie, profile unknown): red tee, blue-teal chinos. Panel 6.5 ("reads loud and primary").** The AI reads the tee as red but `muted` and the chinos as blue `muted`. Measured: tee L\* 30, chroma 37; chinos L\* 28, chroma 14; no neutral piece in the photo, so the tint can't be checked. Chroma 37 overrides "muted" → the tee is bright. Two different families, both `mid`, gap 3, no denim → **C3 muddy −1.5** → 5.5. No positives (a fault fired, and the bottom isn't neutral anyway). **Part 5.5 vs panel 6.5.** The panel's reason is loudness, mine is mud; both point at the same fix: swap the tee for navy, white or cream, which gives a light-or-dark top over mid chinos and one quiet accent → 7.5. Caveat: on closet run 1 the AI called the chinos `dark` and the fault didn't fire (7.0).
2. **P021 (s07, stock, profile unknown): olive suit, dark olive knit, black cap-toes. Panel 8.5.** All main pieces olive (one family). Lightness words: jacket mid, knit dark, trousers mid, shoes dark. No fault. **P3 tonal with a range +1.0** → **8.0**. P6 doesn't fire (only two levels). **Part 8.0 vs panel 8.5.** Measured, the jacket and trousers sit at 28 and 25 (the matched suit reads as matched); measured range alone (13) would have missed the tonal credit, which is why P3 uses the AI's words.
3. **P020 (his own Oct 8 phone check, profile pending): open cream striped shirt over the grey Nike hoodie, washed black wide jeans, olive work boots (read as grey). Panel 7.0.** Families: cream (white), grey, black, grey shoes. No accent, no bright, one small stripe. Measured: shirt L\* 67, jeans 2, gap 65: nothing muddy. Not tonal (3 families). The shoes' grey doesn't count as a tie-in. **Part 7.0 vs panel 7.0.** The panel's complaints on this photo (long, wrinkled shirt over wide jeans) belong to proportions and condition, which is where the part model should send them.

## 3. When the part is NA
- **Fewer than two main pieces visible** (a tight upper-body crop showing only a tee): there's no color story. The color part is NA and drops out of the average.
- **Traditional clothing:** the whole check is "not rated", as today.
- **Shoes not visible:** the part still counts. Only the shoe pieces of C2 (the half-bright shoe), P4, P5 and P6 drop out, and nothing is scaled up. A missing shoe never costs points.
- **Measurement can't run** (no person mask, no pose for bands, no boxes, a lighting check failed, or the photo's tint is above 10): the part still counts on AI facts alone. The measured vetoes and overrides simply don't apply. A measurement that's missing never costs points.
- **Very dark photos** (`lighting: poor`): the part counts on AI facts. Measured values are ignored (darks crush; 1.3).

## 4. v4 rules that move here, and what goes away

| v4 | In the color part | Note |
|---|---|---|
| C1a too many accent colors (1.5 units, about −0.9 overall) | C1 −2.5 | Muted counts half (v4.0 fix kept) |
| C1b too many colors (0.5) | C1 −1.0 | |
| C3 bright clash (1.0; 0.5 streetwear/bold) | C2 −2.0 / −1.0 | Adds the measured-chroma override |
| C4a same pattern same scale (1.0) / same type (0.5), C4b 3+ patterns (1.0) | C6 −1.5 / −0.75 / −1.5 | |
| B1 too many focal points | C7 | Logos still don't count as focal points (they flip between runs) |
| C5 navy-blazer near-match (0.85) | C4 −1.5 | Its tip stays as the fix line |
| K3 point of interest (+0.5 credit, color and pattern half) | P1 +1.0 | Leaves the overall credits. Whether a big accessory still earns "finished" is the v5/finishing part's call |
| The tonal tip | P3/P4, or the flat-tonal tip | |
| `next_level` / `next_level_minimal` tips | The color part's fix line (5) | Minimal keeps "vary texture or shade" |
| Minimal's tonal palette bonus | Stays in style detection only | Detection, not points |
| The `color` sub-score (weight 0.30 inside `base`, ×0.6 per unit) | **Goes away**; the part score replaces it | |
| The belt-match tip | **Goes away** | A retired rule (2026 sources) |
| — | New: C3 muddy, C5 denim near-match, P2 quiet accent, P3/P4 tonal, P5 tie-in, P6 light-mid-dark | C3 and C5 wait for the measurement fixes and the gold set; P2–P6 need only AI facts (P3/P4/P6 need the lightness word) |

**Weight in the total:** the judge pilot used 15%. Keep 15–20%. Because the part sits at 7 for most fits, a bigger weight mostly drags everything toward 7. At 15%, a bright clash (7 → 5) costs 0.3 overall, against 0.6 in v4. If the founder wants color faults to bite as hard as today, use 20% and a −2.5 clash. That's a calibration call for the gold set.

## 5. What he sees on the card
One line, the number and the reason, with the fix that raises it most. Fixes are swaps, not added pieces (this also helps the "Add a layer" bias, #160).

| Situation | Card line | Fix that raises it |
|---|---|---|
| Neutrals, nothing wrong | "Color 7: clean neutrals, nothing fighting." | "Add one color: a sage, rust or navy knit, or a colored cap" → 7.5–8 |
| Quiet accent | "Color 7.5: the teal crew is the one accent. Good call." | A tie-in (shoes or cap in the same color) → 8 |
| Tonal with a range | "Color 8: all olive, with a darker knit for depth." | (none needed) |
| Muddy | "Color 5.5: the red tee and blue chinos sit at the same depth and blur." | "Swap the tee for white, cream or navy" → 7.5 (from his closet when he has one, by lightness) |
| Bright clash | "Color 5: two bright colors fighting (red and green)." | "Swap one for a neutral" → 7–8 |
| Near-match | "Color 5.5: navy jacket and black trousers almost match." | "Grey, tan or olive trousers, or the matching suit trousers" → 7 |
| Pattern clash | "Color 5.5: two checks at the same size." | "Swap one for a solid" → 7–8 |
| Too many accents | "Color 4.5: four colors competing." | "Keep one color, make the rest neutral" → 7–8 |
| Flat tonal (tip, no points) | "Color 7: all one shade. A lighter or darker piece would add depth." | A piece one shade lighter or darker → 8 |

## 6. Risks
1. **Skin in the measurement (blocker for any measured input).** The garment box includes bare arms, an open collar or knees through rips. With "never skin", a color score must not move with skin tone. **Fix before use:** measure tops only on the torso core (inside the shoulders, below the collar, from the pose) and bottoms on the thigh core above the hem. Or exclude the elbow-to-wrist and knee regions where the sleeve or hem doesn't cover them (from the sleeve and hem readings). **Test:** the gold set's friends with a range of skin tones (already on the shoot list for the fit ruler), with each measured lightness unchanged when skin pixels are masked by hand. The same leak exists in today's closet colors (the |ΔL\*| ≥ 25 veto in matching). That's not a score, but the closet session should know.
2. **The outer-color drop cliff** (1.3). Scoring must not use the closet's drop step.
3. **Thresholds are cliffs:** chroma 35, gap 10, and the AI's mid/dark line each flipped one photo in the stability test. The gold set sets them. Keep the measured inputs as vetoes until it does.
4. **The AI's lightness word is absolute in the closet prompt** ("as if on a grey card, not relative") but relative in the rulebook's spec. Pick one before adding it to the scoring call. Recommended: **absolute**. The 95% repeatability was measured that way, and the measurement already supplies the relative part.
5. **The denim exemption on muddy is my judgment.** The research's own failing example was grey tee + grey-blue chinos, and the panel didn't object to a green hoodie on mid denim (s04, 7.0) or a grey hoodie on mid denim (s12, 7.0). Revisit with the gold set.
6. **Dark-on-dark wardrobes** (his): measurement can't separate navy, charcoal and black, and the AI is the only source. Navy over black reads as a near-match to the panel (s13, "black over navy reads as a near-miss", 6.5), but 2026 sources call navy + black fine when deliberate. No rule fires there, on purpose.
7. **Patterned and two-tone pieces:** the largest cluster flips; weighted L\* is a blend. Use weighted L\*, and skip C3 when either piece's pattern isn't solid or a fine pattern.
8. **Mirror selfies:** mirror tint and the phone's flash on glass. The in-photo neutral correction and the tint-above-10 skip cover most of it. Two web mirror photos had tints of 21 and 23 (s26, s28), so the skip fires in practice.
9. **What the AI can't see:** texture (the "tonal with texture" in the anchor), fabric sheen, how faded black really is (condition), and the colors of small accessories. P3 can't tell flat tonal from textured tonal. Texture stays a tip.
10. **The part sits at 7 for most fits.** That's honest, but it means color rarely explains a low score. That's fine: the parts model exists so proportions and shoes can say so.

## 7. Test plan

**Now, no new photos:**
1. **Measurement fixes on the Mac:** a scoring-only measurement in the harness (`extraction-test/vision`, no app change) with no drop step, weighted L\*, skin cores and neutral-corrected chroma. Rerun this prototype's three checks on the 56 closet1 photos × 3 runs × 5 lighting copies and the 14 phone checks. Bars: the top/bottom order never flips at a gap of 8+; L\* within 5 across box runs on 95%+; s12-type drop flips gone; zero skin-like clusters ≥ 10% in the cores.
2. **Flip test for `lightness` in the scoring call** (option A): 3 runs on the saved stock, mirror and phone photos (~$1–2). Bars: the usual consistency bar (≥ 90% of checks with the same score) and lightness agreement ≥ 90%.
3. **Port check:** compute the color part from the v4 fields on the 7,233 test cases. Every case where v4 fires a color mistake must land below 7; every clean case lands at 7–8.5; no case moves without a named check.
4. **Judge pilot sanity:** the 3 worked examples above stay within 1.0 of the panel. Don't tune to the panel beyond that: its color score is a halo of its gut score (r = 0.79).
5. **His phone pulls:** each new pull's all-dark checks should score color 7.0, with no measured fault and every measured value logged (`[measure]` lines) so thresholds can be read off real rooms.

**With the gold set:**
1. **Human lightness order:** for each photo, raters say whether the top is lighter, darker or about the same as the bottom. Bars: measured order ≥ 90% (the Oct 7 plan's bar), AI word ≥ 90%. Set the muddy gap threshold (10 is a guess) from the "about the same" answers.
2. **Pairs that isolate color:** the same outfit with one piece swapped. Muddy vs fixed (grey tee → white tee over mid chinos); a quiet accent on vs off; tonal with range vs flat; bright clash vs one bright; denim near-match vs a clear wash contrast; a tie-in on vs off (cap or shoes). Bar: the color part ranks the pair the way raters do in 80%+ of pairs, and the overall score moves the same way.
3. **Lighting set:** 5 outfits shot under a warm lamp, against a window, in shade and in a mirror. The color part must be identical across them, or NA for measurement, never different.
4. **Skin-tone check:** friends across a range of skin tones in short sleeves and shorts. The color part must not differ between skin-masked and unmasked measurement on any photo.
5. **Rule 7 split:** report color-part agreement by age band and by picked look. Expectation: no difference, because color rules don't depend on style except the streetwear clash allowance and boldness. If Streetwear pickers rate bright clashes higher, widen that allowance, not the base rule.
