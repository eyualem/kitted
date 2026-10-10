# Part: Shoes (research for parts scoring, Oct 10, 2026; DECISIONS-LOG #195)

*Brief: `parts/BRIEF.md`. This part asks one question: **are these the right shoes for these clothes?** It covers how dressy they are next to the clothes, whether their weight suits the leg, their color, and their condition. Whether the outfit suits the occasion he picked is a different question, answered in `occasion.md`. Shoes reads the occasion in one place only: slides and running shoes are the right shoe at Gym and Home. On the other six occasions this part gives the same number whatever he picks.*

*Profiles (rule 7): the founder's photos are "profile pending" (his profile isn't in yet), and his friends' and the stock photos are "profile unknown". The formula never reads age or picked looks, and the panel saw no profile, so I can't split the results by age band or by picked look. That waits for the gold set.*

## The short version
- **Base 7.0 means "fine, generic"**: a clean everyday shoe with everyday clothes. Points go up when the shoes are clearly chosen for the outfit, and down for a wrong kind, wrong weight, a loud shoe fighting a loud top, or wear.
- **On the 44 judge-pilot photos with visible shoes**, my formula, run on the saved readings, against the panel's shoes score: correlation **0.85**, bias **+0.2**, within 0.5 on **34 of 44**, off by 1.5 or more on 4. NA matches exactly: the 14 photos with no shoes are NA both ways. **Caveat:** I tuned it on these same photos, and the panel is one model (#194). Treat this as a sanity check, not validation.
- **What's biggest on his photos:** slides out of the house (6 of his 19 pilot photos), and his boots hidden under wide jeans. The panel docks those a point. We can't read that yet, and it explains most of my +0.5 bias on his photos.
- **Reliability today:** the shoe *kind* (boots, sneakers or slides) is right 77% of the time with close-ups (23 of 30 reads of his Oct 8 boots and slides); the exact *type* only 53% (16 of 30). Across 3 runs the type changes on 10 of 46 photos, and the part score on 14 of 46 (on 5 of them by 1.0 or more). At a 15% weight, a 0.5 swing in the part moves the outfit by 0.08, so it rarely changes the rounded score.

## 1. What the part judges

Each check moves the part from its 7.0 base. The table gives the move, the evidence, how it's measured and how reliable that is.

| # | Check (plain words) | Move | Evidence | Measured by | Reliable today? | Needs |
|---|---|---|---|---|---|---|
| **S-K1** | **Slides out of the house** read as staying in | Sets the part to **4.5**; **2.5** under a blazer or suit; and **−0.5** more when relaxed or wide jeans/cargos drag on the floor over them (v4 F4 "the hem has nothing to sit on") | Mixed. For: RMRS wide-leg shoe guide (2026) lists flip-flops and slides among shoes to avoid with wide legs (via `notes/proportions.md`); the style council: "slides are a home shoe in every style" (`r1-vintage_sport.md`), with every style except streetwear listing them as against or a veto; **the panel: 4.0 from all five judges on all 6 slides photos.** Against: RULEBOOK ruling 11 ("sources lean against penalizing slides themselves", Highsnobiety on socks and sandals); MEL Magazine (Joseph Longo, Aug 30 2019, opened) treats socks with sandals as a skater-menswear look, but that's older than the 2024+ window. **So I set 4.5, not the panel's 4.0, and the gold set decides** | AI `subcategory` = slides_sandals; `hem`, `leg_shape` | **High for slides read `clear`** (all 18 of his slides reads were slides). The misread runs the other way: his boots were read as slides 9 times in 30 without close-ups and 0 times with them (#104) | — |
| **S-K2** | **Running shoes** with non-sport clothes read as gym kit | Sets the part to **6.0**; **4.5** under tailoring. Not at Gym, Home, or in an outfit detected as outdoor | Medium, with dissent. For: the creator research consensus lists "athletic running shoes with casual outfits" as a mistake (`research-context.md`, unverified); The Rake (Mar 2022) and Ape to Gentleman say no sporty shoes with tailoring (via `v5-tailoring.md` TJ4, strong). **Against, for casual clothes:** FashionBeans, "Fall 2025 footwear trends" (Oct 1 2025, opened): "performance sneakers now belong on front rows as much as on tracks". So it's a mild drop (−1), not a cliff. The panel: 5.0–6.0 on runners with linen, track pants and shorts; 7.0 on knit runners with black jeans | AI `subcategory` = performance_runner (trail_shoe once that value exists) | Runner vs retro runner is a known confusion (RULEBOOK r1-smart_casual). On stock P013 it read retro runner and the panel saw "black runners": a 1.5 miss | `shoe_profile`; the M3 probe |
| **S-D1** | **Dressiness matches the clothes:** the shoe is at most 1 level more casual, or at most 1.5 levels dressier, than the clothes' average, and is a real shoe (dressiness 2.5+) | **+0.5** | v4 K4 (the RULEBOOK's "considered shoes matching the outfit's dressiness"); `v5-editorial.md` H1 (4 sources: one off piece can be a valid high-low; a bigger spread costs points). With sweats, only a sneaker counts as a match (panel P046: "white sneakers suit the set better" than boots) | Code: `FORMALITY` of the shoe vs the mean of top, layers and bottom | As good as the type. Work boot 2.5 / chukka 3 / Chelsea 3.5 / derby 4: a type flip inside "boots" moves the shoe's dressiness by up to 1.5 levels (his boots read as work boot, chukka and derby in the same week) | — |
| **S-D2** | **Too casual for the clothes:** the shoe is more than 1 level below the clothes' average | A ramp: −1.5 at 2 levels, −2.5 at 3+ | v4 S2 (ramp, RULEBOOK ruling 41); tailoring sources (`v5-tailoring.md`). **One change from v4: compared with the average, not the dressiest piece.** Against the dressiest piece, low-profile sneakers with trousers lost points (panel P011, P043: 6.5–7.5, endorsed by Westwood Hart 2026 and RMRS 2026). Tailoring is handled by S-D4 | Code, as S-D1 | As S-D1 | — |
| **S-D3** | **Much dressier than the clothes** (2+ levels: dress shoes with a hoodie and jeans) | −0.5, and no upward moves | Put This On 2017 and Westwood Hart 2026: formal dress shoes and black oxfords with jeans are out (via `v5-tailoring.md`). Chelsea boots, loafers and chukkas with jeans are endorsed (same sources), so they stay inside S-D1's window | Code | As S-D1 | — |
| **S-D4** | **Sneakers under tailoring:** chunky or basketball sneakers under a blazer or suit | −2.0 (running shoes: S-K2's 4.5) | The Rake 2022; Ape ("chunky sneakers only with boxy, unstructured suits"); `v5-tailoring.md` TJ4, SU3: clean canvas, low-profile, retro and white leather sneakers with tailoring are fine at casual occasions, so those aren't charged here | AI `subcategory` + a tailored layer | High for chunky shoes and blazers | The "boxy suit" exception needs a reliable read of the jacket's looseness (TF3) |
| **S-C** | **Chosen for this look:** the shoe is an anchor or home shoe of a style the outfit is detected as (chunky sneakers with streetwear, chukkas or work boots with workwear, loafers or derbies with prep and smart casual, Sambas-type sneakers with vintage sport) | **+0.5** | The style council's shoe roles (RULEBOOK Part 4, `rubric.py` `STYLES`), built from `style_archetypes.md` | Code: the detected styles' role function for the shoe | **Circular risk:** the shoe helps decide the style. **Fix in the build:** detect the styles without the shoe, then ask whether the shoe belongs | — |
| **S-W1** | **A chunky shoe under a narrow leg** ("clown feet") | −1.5 for chunky or basketball sneakers under skinny or slim legs; −0.5 for running shoes (many modern runners are slim knit) | Strong: Highsnobiety ~2023, RMRS, Put This On 2018 (`v5-silhouette.md` S4, v4 S1) | AI `subcategory` + `leg_shape` | **Low on the leg:** leg shape is right 40–53% on his photos, and the leg probe didn't help (#189). It's been in v4 since v3 | Leg reading (gold set + size ladder) |
| **S-W2** | **A chunky shoe under a wide leg in streetwear** carries the leg | +0.5 (relaxed or wide jeans/cargos, hem not pooling, streetwear detected) | Split, 3–2 (`v5-silhouette.md` S5): for, GQ Apr 2025, RMRS, Highsnobiety; against, Mr Porter Sep 2025 and H&M 2026. **So streetwear only**, as in v4's K4 street trigger | AI `subcategory`, `leg_shape`, `hem` | Leg 40–53%, hem 26–43% | — |
| **S-W3** | **A dainty shoe under a wide leg** (a pointed dress shoe or ultra-thin sneaker disappears) | **Tip only now**; −1.0 once `shoe_profile` passes | Strong: GQ Apr 2025, RMRS Jun 18 2026 ("If your sneaker disappears under the hem…", via notes), Opumo (snippet); Mr Porter and H&M don't disagree (`v5-silhouette.md` S3, `v5-tailoring.md` TS3) | **Planned** AI `shoe_profile` (sleek / regular / chunky / not visible), or the **M3 phone probe** (sole thickness ÷ shoe length, from the shoe box and his outline) | Untested; RULEBOOK: "moderate, worse in partial photos" | `shoe_profile` + a 3-run flip test of 90%+ |
| **S-W4** | **The hem swallows the shoe:** wide jeans covering a boot so only the toe shows | Not scored yet | The panel docks his boot photos (P025, P028, P037) about a point: "jeans slouch over the boots". RMRS (same "disappears" line) | Hem against the shoe in the lower close-up, the cue proposed in `v5-silhouette.md` (narrower than the shoe / about its width / covering the laces) | Untested. The hem probe's shin-position signal was 20 of 22 right but unsure 56% of the time (#190) | That cue, flip-tested |
| **S-Col1** | **A loud shoe fighting a loud top:** bright or multicolor shoes when the clothes already have a bright piece or a big pattern | −0.75 | `notes/color.md` H1 (one accent; very high agreement); v4 counts a bright shoe in C3. The panel: P001 (multicolor shoes with a lilac vest, "a third story") and P011 (leopard sneakers with an embroidered shirt): "two loud pieces compete" | AI `color_family`, `saturation`, `pattern` | Color family 70–76% on his photos; shoes are small (~30 px in the upload; the close-up helps) | The phone's measured shoe color (`KittedMeasure`), once it runs before the score |
| **S-Col2** | **The shoe is the one accent** in a neutral outfit | +0.5 | `v5-editorial.md`: a high-low mix "sits in one or two pieces (the shoes or the outer layer)"; the panel P051 (Air Max 95 "as the accent") and P047 (Jordan 1s): 7.5 | As S-Col1 | As S-Col1 | — |
| **S-Col3** | **The color ties in:** the shoe repeats a color (not white, black or grey) from the top or layer | +0.5 | `v5-editorial.md` C1 (4 editorial: GG, RMRS, Outfit Narrative, Effortless Gent); `color.md` S3 (low-moderate). The panel: P027 and P049 (navy sneakers under a navy chore coat) 7.5 | AI `color_family` (the family) | 70–76% | Measured color would make this robust |
| — | *Not scored:* the shoe's lightness against the trousers, belt matching the shoes, "no brown in town", sock rules | Tips at most | `color.md` V2 (low agreement: tailoring says shoes darker, casual guides say light shoes with dark jeans); `v5-editorial.md` A7 (belt: tip; the waist reads 26–32%); `color.md`: 2026 sources retire these taboos | — | — | `socks_visible` would be a new field |
| **S-Q** | **Worn or dirty shoes** (scuffed, dusty, beat-up) | The part is **capped at 6.0** (work boots 6.5, since patina is part of them), and no upward moves | v4 F7 (worn shoes −0.4, work boots half: RULEBOOK ruling 12); `v5-editorial.md` (FashionBeans: "battered trainers with a suit" read as an accident); creator consensus "impeccable care" (unverified). The panel: dirty Vans 6.5, dusty sneakers 5.5, worn chunky 7.0, worn work boots 6.5 | AI `condition` = pilled_or_worn / stained on the footwear | Shoes read worn at least once on 7 of 46 photos, flipping between runs on 3. Misses happen: stock P019's "dusty black sneakers" read clean every time (panel 5.5, mine 7.5) | Close-ups help; a "scuffed / dirty" shoe value would be more precise |

**One fact, one part.** The shoe's condition counts here and **Condition must skip footwear**. The bright-shoe term moves from Color's C3 into S-Col1, so **Color counts the clothes' accents only**. S1 (chunky shoe on a narrow leg) and F4 (hem over slides) live here; `fit.md` already sends F4 here, and lists S1 under "Proportions / Cohesion". **The merge has to give S1 to exactly one part: I recommend Shoes**, because the brief puts "weight vs the leg" here and the panel's shoe anchor names it. Shoes also never charges "too casual for the occasion" (that's Occasion's).

## 2. The part score

```
NA when there are no scorable shoes (see §3).
s = 7.0
Kind:  slides (not at Gym/Home)    → s = 4.5 (2.5 under tailoring); −0.5 if loose jeans/cargos drag on them; no upward moves
       running shoes (not Gym/Home/outdoor) → s = 6.0 (4.5 under tailoring); no upward moves
       type lost ("other")         → ask "Boots, sneakers or slides?" first (#123); on Skip, Shoes = NA
Otherwise:
       chunky/basketball under tailoring          −2.0
       gap = clothes' mean dressiness − shoe's
       gap > 1.0                                  −1.5 × ramp(1→2) − 1.0 × ramp(2→3)
       gap ≤ −2.0 (much dressier)                 −0.5, no upward moves
       −1.5 ≤ gap ≤ 1.0 and shoe ≥ 2.5            +0.5   (with sweats: sneakers only)
       an anchor/home shoe of a detected style    +0.5   (detected without the shoe)
Weight: chunky under skinny/slim −1.5 · runner under skinny/slim −0.5 · chunky under wide jeans/cargos in streetwear, hem not pooling +0.5
Color (not for slides):  loud shoe + a loud clothing piece −0.75 · loud shoe as the only accent +0.5 · shoe color repeats the top/layer's +0.5
Wear:   worn/dirty → min(s − 0.5, 6.0)   (work boots: min(s − 0.25, 6.5))
Round to the half; keep between 2.0 and 9.5.
```

**Anchors** (what each number looks like):

| Score | What it is | Example |
|---|---|---|
| 10 | Not reachable by the formula (as in the rest of the app, 10 stays out of reach) | — |
| 9–9.5 | Chosen for it on every count: the right dressiness, a home shoe of the look, weight right for the leg, and the color ties in or is the one deliberate accent; clean | Brown suede chukkas echoing a tan overshirt over straight dark jeans; chunky white sneakers carrying stacked baggy jeans, with the cream hoodie picking up the sole |
| 8 | Clearly chosen: the right dressiness and the look's own shoe, clean | Navy low-profile sneakers under a navy chore coat (P027, P049); chunky white sneakers with a boxy tee and wide jeans (P026, P033); black Chelsea boots under a black overcoat (P055) |
| 7–7.5 | Fine, generic: a clean everyday shoe that matches | White sneakers with a hoodie and slim jeans (P008); oxfords with a tucked knit and trousers (P035) |
| 6–6.5 | One small miss: running shoes with everyday clothes, worn or dirty, dressier than the clothes, or a loud shoe competing | Track pants and runners (P048); scuffed canvas sneakers (P041) |
| 4.5–5.5 | A wrong shoe for the clothes, or one miss plus wear: slides out of the house, a chunky shoe under slim jeans, runners under a narrow leg | Hoodie, joggers and slides (P024, P038, P040) |
| 2–3 | Clearly wrong: slides or running shoes under a blazer, or a worn-out pair under tailoring | — |

**On the pilot:** my scores run from 4.0 to 8.0 (median 7.5); the panel's run from 4.0 to 8.0 (median 7.0). The 9 is reachable (four +0.5 moves) but never happens on these 44 photos, which fits "9 is rare and earned".

### Three worked examples (judge pilot IDs; saved close-up readings, run 0 shown, everyday)
1. **P024, his hoodie + joggers + slides** (the photo reads `sweatpants`, cuffed, `slides_sandals` clear). Slides out of the house → **4.5**. The jogger cuffs don't drag, so no extra −0.5. **Panel 4.0** (all five judges: "Real sneakers would do the most"). v4 charges nothing to the shoes here (S2 needs a 2-level gap; slides are 1 against a hoodie's 2); the whole charge sits in loungewear (O4, −1.2). Off by 0.5, deliberately (see S-K1). P004 and P016, the same slides under wide jeans, land on 4.0 with the drag.
2. **P027, navy chore coat + white tee + charcoal straight jeans + navy low-profile sneakers** (a friend). Base 7 → dressiness matches (sneakers 2.5 vs clothes 2.5) **+0.5** → navy repeats the coat **+0.5** → **8.0**. **Panel 7.5** (the shoes aren't its complaint; the reason is "charcoal on near-black is flat"). Same on P049. This is the formula's typical miss in the generous direction: the color tie-in counts for more than the panel gives it.
3. **P013, light-blue oxford tucked into white shorts + black "runners"** (stock). The reading says `retro_runner` (likely) on all 3 runs → no rule fires → **7.0**. **Panel 5.5** ("black runners with black crew socks"). Had the reading said `performance_runner`, S-K2 would give 6.0. **This is a reading miss, not a formula miss:** runner vs retro runner is the costliest type confusion for this part, and socks aren't read at all.

All 44 photos are in the session's test output (the 4 misses of 1.5 or more: P013 runner read as retro, P019 dusty shoes read clean, P025 his boots under slouching wide jeans (S-W4), P023 knit runners under skinny jeans, where the panel gave 7.0 and I gave 5.5).

## 3. When the part is NA
- `scene.shoes_visible` is false, or framing is `upper_only` (shoes cut off), or the footwear was read `unsure` (`rubric.py` `_prepare` already drops these). The part drops out and the weights renormalize, so nothing hidden costs points. This replaces v4's halfway scale-up for the K4 credit.
- **The type was lost (`other`) and he skipped the shoe question:** NA. v4 skips to the most generous answer; under parts, NA is more honest (no free points, no lost ones). It differs from #123's Skip for `other` only, and needs logging.
- Shoes only (no clothes visible) or a "not rated" traditional outfit: NA.
- **Never NA just because the AI is "likely"** rather than "clear": a "likely" read counts.

## 4. Which v4 rules move here, and which go away
| v4 rule | Under parts |
|---|---|
| K4 Shoes that complement (+0.5) and its streetwear trigger | Becomes S-D1 + S-C + S-W2 (the part's upward moves) |
| S1 bulky shoe on a narrow leg (−0.45) | S-W1 (runners softened to −0.5 in part points) |
| S2 shoes too casual for the outfit (ramp to −1.8) | S-D2 (against the clothes' average, not the dressiest piece) + S-D4 (tailoring) + S-K2 |
| S2's interview floor (#186: sneakers under tailoring at an interview, −1.2) | **Moves to Occasion** (it's about the room, not the shoe) |
| S2's white-leather exemption (dead code, #186) | Gone. White leather sneakers are a sneaker like any other, dressiness 3, and fine under casual tailoring (SU3) |
| F4 hem drags over slides (−0.4) | Folded into S-K1 (−0.5 in part points) |
| F7 worn shoes (−0.4; work boots −0.2) | S-Q (Condition skips footwear) |
| C3's bright-shoe half count | S-Col1 / S-Col2 |
| Belt tip at dressy occasions | Stays a tip (no change) |
| The shoe question (#120–126), "Your grey work boots?" (#126) | Kept: they repair this part's inputs. The ask threshold ("moves the shown score by 0.5+") stays measured on the final score |
| Work boot dressiness 2.5, `FORMALITY` table | Kept |

## 5. What the user sees
One line on the card, with the number, naming the shoe and the reason, never the person:

| Part | Card line | Fixes that raise it |
|---|---|---|
| 8 | "Shoes 8: the navy sneakers pick up your coat." | — |
| 7 | "Shoes 7: clean and easy with this." | The next-level line: "Shoes that match your top's color would tie it together" (only when nothing else is wrong) |
| 6 | "Shoes 6: running shoes read gym with jeans." | "Swap the runners for low-profile or white leather sneakers" (#162's lines) |
| 6 | "Shoes 6: they look worn." | "Wipe them down or swap to a clean pair" (a closet pick when he has one) |
| 5.5 | "Shoes 5.5: chunky sneakers look heavy under slim jeans." | "Swap to low-profile sneakers", or "Try them with straight or relaxed jeans" |
| 4.5 | "Shoes 4.5: slides read as staying in." | "Swap the slides for chunky sneakers or boots" (sneakers when the leg is wide); with a dragging hem also "Cuff the jeans once" |
| — | "Shoes not in the photo." | The existing partial-check offer: a shoe snap, or "Pick from Closet" |

The fix engine already proposes generic shoe swaps (#162). Under parts it should rank them by the part points each swap gains, worked out in code by re-scoring with the swapped shoe (the way the tap computes its answers).

## 6. Risks: what will misfire, what the AI can't see
1. **The type reading.** Kind is right 77% (with close-ups), type 53%; the type flips between runs on 10 of 46 photos. Within boots, work boot vs chukka vs derby moves S-D1 and S-C. Mitigations exist (the shoe question, the known-piece question, close-ups). The M3 phone probe (shaft height, sole thickness) is the next real fix.
2. **Runner vs retro runner** (P013): a 1–1.5 swing in the part. Ask nothing about it (#122 ruled out "were they…" questions that pay); define it better in the prompt with the schema batch.
3. **The hem hiding the shoe** (S-W4) is invisible to the formula. It's why his own photos run about +0.5 over the panel (bias +0.53 on 19 of his and his friends' photos, against −0.04 on stock).
4. **Dirty shoes read clean** (P019), and black slides with white stripes read `multicolor` in some runs (the loud-shoe check skips slides for that reason).
5. **Style detection uses the shoe**, so S-C could reward the shoe for a style it created. Detect without the shoe.
6. **No socks, no laces, no sole color, no `shoe_profile`.** White socks with dress shoes, the "dainty shoe under wide legs" rule and gum soles can't be scored.
7. **Slides is a taste call wearing a rule's clothes.** Socks and slides are a real campus look, and for his audience a 4.5 may feel harsh. I recommend keeping 4.5 until the gold set's friends weigh in, then moving it.
8. **The formula was tuned on the panel it's compared with,** and that panel is one model. The 0.85 will drop on new photos.

## 7. Test plan
**Now, with no new photos:**
1. **Panel re-check, held out:** when the judge panel is re-run with different models and in ranking mode (#194's next steps), score the same 44 photos. Pass: correlation ≥ 0.7, |bias| ≤ 0.3, within 0.5 on ≥ 65%. Don't retune on that run.
2. **Stability:** all 46 saved photo-sets with shoes (close-up arm B of `zoom1` and `zoom1-stock`, 3 runs each) plus the Oct 9 phone readings. Today the part is identical across runs on 32 of 46 (70%) and within 0.5 on 41 of 46. Pass bar: ≥ 85% identical, and no 1.5+ swings. That bar needs the type reading to improve, not the formula.
3. **Truth swap on his 11 labeled Oct 8 checks** (`inputs/phone-oct8/truth.csv`): compute the part as read and with the truth shoe type; report how often a misread moves the part, and by how much.
4. **Parity sanity on the 7,233 v4 cases:** every case where v4 fires S1, S2 or worn shoes must give Shoes ≤ 7.0; every case earning K4 must give ≥ 7.5. List the exceptions and review them by hand.
5. **Occasion invariance:** across the 6 occasions other than Gym and Home, the part must be identical on every case.

**With the gold set:**
6. **Shoe pairs:** the same outfit with 2–3 shoes (slides / sneakers / boots; runners / retro sneakers; clean / dirty; chunky under slim jeans / under wide), with his friends' ratings. Pass: the part orders each pair the way the raters do ≥ 80% of the time.
7. **`shoe_profile` and the hem-on-shoe cue:** 3-run flip test ≥ 90%, accuracy ≥ 85% against labels, then S-W3 and S-W4 turn on.
8. **Calibrate the sizes** (slides 4.5, runners 6.0, worn cap 6.0, the +0.5s) against the raters, **reported by age band and by picked look** (rule 7), and decide the part's weight (15% in the pilot).
