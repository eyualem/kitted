# Part: Cohesion and style

*Parts research, Oct 10, 2026 (brief: `parts/BRIEF.md`, DECISIONS-LOG #195). Claude. Builds on the style council (`style-council/RULEBOOK.md`), v4 credits K2 and K3 and rule B1 (`extraction-test/rubric.py`), the v5 "finished" credit (`v5-brief.md`), `notes/v5-editorial.md` §2, §4, §5 and `notes/style_archetypes.md` Q3. A scratch prototype (in this session's scratchpad, not committed; it imports `extraction-test/rubric.py`) was run on the judge pilot's saved readings: the stock and mirror photos' 3 saved runs each (`test3-stock-40-v3`, `test4-mirror-12-v3`) and the app's own reading for each phone check (`screenshots/phone/*/SQLite/kitted.db`). Profiles (rule 7): his photos are the founder's (profile pending), his friends' and every stock photo are "profile unknown"; the code and the judges used no profile, so no split by age band or picked look is possible. Under v5 rules a profile would only change the "Reads as" label on a tie, never this part's number.*


> **Update (Oct 11, DECISIONS-LOG #214): a style-crossing fault, SX1, now lives in this part.** A graphic tee or any top at volume 4+, worn with two dressy pieces in an outfit whose rest reads minimal, smart casual or classic prep, costs −3.0 here and replaces "reads as". It's built from the council's vetoes and bands. A dressy layer over the top bridges the two looks (H3b's idea). The larger of SX1 and H3 counts, never both. This narrows "mixing aesthetics is never a fault" (the table below) by one case, on the founder's word. Details: `style-clash.md`.
## The short answer: can cohesion be scored from facts, by code, without becoming "the AI's taste"?

**Yes, but only a narrow version, and it's our taste written down, not the AI's.**
- The AI only names garments (type, color, pattern, leg). Those are its most reliable fields: top type 100% and bottom type 100% with close-ups (#104). It is never asked "does this go together?" (v5/v5s failed the consistency bar, #63–64; AesRec's VLM put over 75% of outfits above 8, `v5-editorial.md` §5).
- Code turns the names into a cohesion score with **fixed, published tables**: the council's 7 style tables (anchors, home pieces, pieces against, vetoes), the existing formality number for each garment, and the focal-point count. Same photo, same score. Every point has a reason the card can print.
- **What stays out because facts can't carry it:** "is this mix deliberate?", "does it have a point of view?", "is it trying too hard?". These are the panel's main cohesion reasons ("no idea beyond comfort", P002, P037). No garment field encodes them, and guessing them would be the AI's taste again. So the part's range is small (about 5.5–9 today) and its weight should stay at 15% or less until people's ratings show they judge cohesion apart from everything else.
- **The judge pilot can't calibrate this part.** The panel's cohesion score correlates 0.96 with its own gut score and 0.88 with its shoes score (45 photos with every part scored). It was a halo of the overall impression, not a separate judgment. Use it only as a sanity check on direction.

---

## 1. The checks

| # | Check (plain words) | Evidence | How much it matters | How it's measured | Reliable today? | Needs |
|---|---|---|---|---|---|---|
| H1 | **Reads as a style.** The garments match one of the 7 styles (or a matching suit): +0.5 | Style council (Parts 2 and 4); Stitch Fix blends 5 of 7 types (`style_archetypes.md` Q3); Derek Guy: an outfit should express one idea (Put This On, Feb 2018, in `v5-editorial.md` §4) | Small. Reading as a style is the floor of "an idea", not an achievement | Code: `detect_styles()` on the AI's garment types. Matching suit = `suit_jacket` + `suit_trousers` | Garment types: high. The detected set flips between runs on 6 of 52 saved photos (RULEBOOK Part 4); in the pilot the part changed on 4 of 39 multi-run photos | Nothing (exists) |
| H2 | **The read is clear top to toe.** The label style has a signature (anchor) piece in all three slots (upper, bottom, shoes) and no piece against it: +0.5 more | Council tables; "commitment through a few signature pieces" (`style_archetypes.md` Q2) | Small | Code: the style's role table, anchors per slot, "against" count | As H1 | Nothing |
| H3 | **One piece from another world.** A tailored jacket over loose, light-wash or ripped jeans; more generally, non-shoe pieces 2.5+ formality levels apart with no bridge: −1.5 | FashionBeans high-low (Apr 2017, updated May 2024): the balance must "appear deliberate", bootcut jeans with dress shoes read as accidents; Ape to Gentleman: "Fit and material are what separate contemporary style from rebellious teen" (both opened in `v5-editorial.md` §1, §4); Derek Guy, one level of formality (PTO 2018); Permanent Style high/low: change the outer pieces, keep the ends close (search summary) | The biggest negative. It's the one cohesion fault people name in words | Code: `formality()` per piece (exists); the outlier test; for the jacket case, `distressed_by_design`, `color_family` (denim_light/mid) and `leg_shape` (relaxed/wide) on the jeans | Garment types: high. Leg shape: 40–53% (weak; the jacket rule also fires on wash or rips alone). Blazer vs suit jacket: shaky (P015's navy blazer read as `suit_jacket`), so an orphan suit jacket is judged as a blazer | Nothing |
| H3b | **The bridge.** A high-low is fine when exactly one piece is off and it's the outer layer (hoodie under an overcoat, blazer over a hoodie, puffer over suit trousers) | Ape to Gentleman (hoodie under a camel overcoat), Mr Porter (hoodie under a blazer, search summary), Permanent Style (outerwear is the place to mix) | Stops H3 penalizing a deliberate mix | Code: the outlier is `category == outerwear` | High | Nothing |
| H4 | **One standout, the rest quiet:** +0.5 (today's K3: a bright color or a medium/large pattern within his boldness, no color fault) | 4 sources, no dissent: Ape (one statement piece), Modest Man (the graphic tee is the statement), Highsnobiety (the jersey is the statement), Put This On ("point of distinction") (`v5-editorial.md` §5) | Small | Code: K3's test (exists) | Pattern and bright/neutral: fair. Fine stripes read as solid (R5) | Nothing |
| H5 | **Too many statements:** −0.5 per extra focal point, max −1.0 (today's B1) | Same 4 sources; Primer and Ape on one area in the lead (`v5-editorial.md` §2) | Small | Code: B1's focal count (exists) | As H4 | Later: big accessories join the count (A2) |
| H6 | **A finished touch** (future): one big, visible accessory that suits the style: a chunky chain over a plain casual top, a scarf or neck bandana, a crossbody bag in streetwear/outdoor, deliberate visible socks with shorts: +0.5, max one | 4 sources for chains, 3 for scarf/bandana, 2 shop roundups for bags, 4 for socks (`v5-editorial.md` §2, rules A3, A5, A6, A8) | Small; the only non-layer route to 9+ besides H4 | New AI fields: `neckwear` (none / scarf / bandana / chain_chunky / chain_thin), `bag` (none / crossbody / other), `socks_visible` | **Untested.** Chunky chains are about 3–5 px at full body and sit at the head blur's edge; thin chains, rings, bracelets and most watches can't be seen (`v5-editorial.md` visibility notes). The watch flipped between runs (Oct 6) | The flip test (≥90% same over 3 runs), then the gold set's accessory on/off pairs |
| H7 | **Costume** (head to toe one niche style): tip only, never points | RULEBOOK ruling 23; Ape gorpcore and corduroy guides, Highsnobiety blokecore (`v5-editorial.md` §4) | 0 points | Code: detection counts | — | — |
| — | **Never a fault:** mixing aesthetics by itself; tonal, all-black or all-neutral; double denim; logos outside work | `style_archetypes.md` Q3 (Depop 2026 "era mixing", ASOS, Mr Porter's anti-costume rule); RULEBOOK Part 3 | — | — | — | — |

### Two re-filing steps the prototype needed (code only)
- **A tank top worn with a collared shirt is a sweater vest.** P001 (a 70s knit vest over a dress shirt) was read as `tank_top` + `dress_shirt`, which looked like formality 1 next to 4. The schema has no knit-vest value (RULEBOOK says "knit sweater vests stay sweater").
- **A suit jacket without suit trousers is judged as a blazer.** The AI's blazer/suit-jacket call is shaky, and an orphan suit jacket isn't worse than a blazer on paper.

### What cohesion deliberately leaves to other parts (one fact, one penalty)
- **Shoes.** Slides, running shoes with a blazer, dainty shoes under wide legs: the shoes part. A signature shoe still helps H2 here (it completes the read), but a wrong shoe is charged only once, there. The panel put slides into cohesion too (P004, P016: 5.5), which is part of why its cohesion looks like its gut.
- **Loungewear.** Sweats, joggers and gym shorts out of the house: the occasion part's ladder, which already sizes them by signs of intent (−1.2 / −0.6 / −0.3 / 0, ruling 6). Cohesion skips the athletic bottom in H3. So "formal + gym" lands low through the occasion part, not twice.
- **Hue relationships** (clash, accent count, tie-ins, near-match): the color part. **Proposed split for the merge:** cohesion owns "how many things compete for attention" (H4, H5, H6); color owns which colors sit together. If the color part also claims K3 and B1, the merge gives them to one part only.
- **Length, volume, hem, tuck shape:** proportions and fit.

---

## 2. The part score

**Start at 7.0** ("the pieces go together fine, no clear idea"), then:

| Step | Change |
|---|---|
| H1 reads as a style (or a matching suit) | +0.5 |
| H2 clear top to toe (anchors in 3 slots, none against), or a suit worn with a top under it | +0.5 |
| H4 one standout | +0.5 |
| H6 one finished accessory (when the reading exists) | +0.5 |
| H3 one piece from another world (the larger of the jacket rule or the spread rule, never both) | −1.5 |
| H3 spread of 3.5+ levels (formal and very casual, lounge bottoms excluded) | −4.0 |
| H5 too many statements | −0.5 / −1.0 |

Clamp 1–10, round to the half. **Today's maximum is 8.5** (no accessory reading); with H6, 9.0; a 9.5–10 needs a clear read, a standout and a finished touch with nothing against (rare by design).

### Anchors
| Part score | What it looks like | Example from the cases or the pilot |
|---|---|---|
| 10 | (Future) a clear read top to toe, one standout, one finished touch, nothing off | Workwear: chore coat + flannel + raw denim + work boots + a neck bandana |
| 8–8.5 | Clearly one idea, or one idea plus a standout | P043 cream plaid overshirt + tee + wide trousers + gum-sole sneakers (8.0); P021 olive suit over a tonal knit (8.0) |
| 7–7.5 | Goes together fine; reads as a style at most loosely | P002 grey hoodie + wide black jeans + boots (7.5, reads as streetwear); P007 (7.0, no style) |
| 5–5.5 | One piece from another world | P015 navy blazer over light, ripped, relaxed jeans (6.0 today; 5.5 if the hem fault weren't the proportions part's) |
| 2–3 | Pieces fight: suit trousers with a tank top, a tailored jacket with a jersey and nothing to bridge them | Council anchors only; no pilot photo |

### Three worked examples (pilot photos, everyday)
| Photo | AI reading (garments) | Formula | Code | Panel cohesion (median of 5) | Why they differ |
|---|---|---|---|---|---|
| **P015** (his friend's phone check) | navy `suit_jacket`, black tee, `denim_mid` relaxed jeans with `distressed_by_design`, grey suede chukkas | Orphan suit jacket → blazer; reads as smart casual +0.5; tailored jacket over light, ripped, loose jeans −1.5 | **6.0** | **5.5** | Agree on the fault (every judge: the jeans "fight the blazer"). The rest of their drop is the bunched hem, which is the proportions part's |
| **P043** (stock s15) | tan tee, cream medium-plaid overshirt (layer), khaki wide trousers, white chunky sneakers | Reads as smart casual +0.5; medium plaid = one standout +0.5 | **8.0** | **8.0** | Same number. The judges call it "city boy" (minimal); minimal is vetoed by the plaid, so the label says smart casual. The label never moves points by itself |
| **P002** (his phone check) | grey hoodie, black relaxed jeans, grey boots read as "other" | Reads as streetwear +0.5; no anchor shoe, so not clear top to toe; no standout | **7.5** | **6.5** | The panel's reason is "no idea beyond comfort" plus faded, linty jeans. "No idea" isn't a fact the code can read; the fading and lint belong to condition. The fix the judges name (a chore coat or a bomber) would add a layer and an anchor, which the code would see |

### Over all 56 pilot photos with a reading
- Code vs panel: mean +0.50 (code higher), mean absolute gap 0.68, within 0.5 on 36 of 56, correlation 0.51 (0.54 without slides or loungewear photos, where the panel's cohesion carried the shoe and occasion faults).
- Code distribution: 7.0 ×20, 7.5 ×29, 8.0 ×6, 6.0 ×1. **Compressed by design:** facts can say "one idea", "a piece from another world" and "too loud", not much more. At 15% weight the part moves the total by at most about ±0.25 around 7.
- Stability: the part changed between runs on 4 of 39 photos with several runs (detection flips; ±0.5 on the part, about ±0.08 on the total).

---

## 3. When the part is NA
- Fewer than two of the three slots visible (upper only, a close crop): nothing to relate. P012 (top half only) is NA.
- Every piece "unsure", or traditional clothing (not rated).
- Shoes cut off: **not NA.** Cohesion is judged on what's visible; H2 needs 3 anchored slots, so a shoes-hidden photo can't get the "clear top to toe" half point (it can still reach 8.0 with a standout). That's the price of a partial photo here, and it's small; if the founder wants none, allow H2 with 2 slots when shoes are hidden.

## 4. Which v4 rules move here, and which go away
| v4 rule | Fate |
|---|---|
| Style detection, "Reads as" (worth 0 today) | **Moves here as H1/H2.** It now earns up to +1.0 on this part (about +0.15 on the total). Its allowances (bands, waivers) stay in fit and proportions. Picks still never change any number |
| K3 point of interest (+0.5 on the total) | **Moves here as H4** (+0.5 on the part). Its gates (no color fault, within his boldness) stay |
| B1 too many focal points (tagged color) | **Moves here as H5**, unless the merge gives it to color (one owner only) |
| K2 elevated piece (+0.5 for any piece of formality 3+) | **Goes away.** It paid for owning a chino or an overshirt, the "presence" credit v5 wants gone (#161). Its useful idea, a piece that commits to a style, is H2 |
| Costume (tip, ruling 23) | Stays a tip, shown with this part |
| Occasion beats style (ruling 20) | Unchanged; it's the occasion part's. Cohesion never excuses an occasion fault |
| v5 "finished" accessory credit | **Lives here as H6**, after its readings pass the flip test |

## 5. What the user sees
One line on the card, the number plus the reason, garment words only:
- "Cohesion 8: reads as workwear, and the plaid overshirt is your one standout."
- "Cohesion 7.5: reads as streetwear. One signature piece (a bomber, chunky sneakers) would make it clear."
- "Cohesion 7: the pieces go together; nothing ties them to one look yet."
- "Cohesion 6: the blazer and the light, loose jeans come from different worlds."
- "Cohesion 6.5: three things compete for attention. Let one lead."

**Fixes that raise it:** swap the odd piece ("Swap to dark, straight jeans under the blazer", +1.5 on the part), add one standout to a quiet outfit, add a signature piece of the style he's closest to (from his closet first), drop one statement, and later "add a chain or a scarf". The fix engine must price these in part points × the weight, so a cohesion fix doesn't outrank a fit fix that matters more (the #160 lesson).

## 6. Risks
- **It's still taste, ours.** The 7 tables decide what "belongs". They were built from sources and argued by the council, but a beginner mixing on purpose can be read as "no style" (7.0, not a penalty) and, rarely, as "another world" (−1.5). Keep the negatives to the two hard cases above.
- **Misread garments move it.** A knit vest read as a tank top (fixed by re-filing), a blazer read as a suit jacket (fixed), weak leg-shape reads feeding the jacket rule (40–53%), tee vs graphic tee flips. The detection flips change the part on about 10% of multi-run photos.
- **The AI can't see:** whether a mix is deliberate, fabric and texture (the strongest tonal and high-low signal, about 47% F1 in benchmarks, `scoring_evidence.md` §3), small accessories, anything on the head (hidden), metals.
- **The panel can't validate it** (halo r 0.96 with gut). Tuning to the pilot would teach the part to copy the overall score.
- **Double counting at the merge:** if shoes, occasion or color also price slides, loungewear or the focal count, the same fact costs twice. Each must have one owner.

## 7. Test plan
**Now, no new photos:**
1. Run the prototype on every saved reading (159 readings: 52 photos × 3 runs + his phone checks): distribution, share of photos whose part changes between runs (bar: ≤10% move by more than 0.5), and NA rate.
2. Run it on the council's 111 cases: each style anchor should land 7.5–8.5, the look-alike cases should agree with their labels, and the "careless" or "smart pieces with every fault" anchors should not gain cohesion points.
3. Break the halo: one fresh judge from a different model scores only cohesion, as pairs ("which pair of outfits belongs to one idea more?", same photos, no other parts), on the 20 photos where this code and the panel differ most. Compare ranks, not levels.
4. Check the re-filing rules (tank + collared shirt; orphan suit jacket) on all saved readings: list every reading they touch.

**With the gold set:**
1. Pairs that change one fact: the same blazer over dark straight jeans vs light baggy jeans; a hoodie under an overcoat vs a hoodie with suit trousers; a plain fit with and without one standout; accessory on/off pairs (H6); a full workwear costume vs the same with one piece swapped.
2. Pass bars (from `speed-and-detail-plan.md`): the raters' ranks agree with the part (ρ ≥ 0.6 on the pairs), and adding the part to the total doesn't lower the total's ρ. If raters don't separate cohesion from everything else, cut its weight to 10% and keep only H3 and H5.
3. Flip-test H6's readings first (`neckwear`, `bag`, `socks_visible`, ≥90% same over 3 runs, about $2), on face-hidden copies, and check that the head blur doesn't clip short chains.
