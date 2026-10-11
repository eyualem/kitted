# Parts engine v3: the streetwear pass (Oct 10, 2026)

*Claude (subagent), after the founder approved this pass on Oct 10. No API calls, no money. Nothing in the app, `rubric.py`, the prompt or the fixtures changed, and nothing is committed. Files:*
- *Engine: `extraction-test/rubrics/parts_proto.py`. `engine="v3"` is the new default. `engine="v2"` and `engine="v1"` reproduce parts-proto-2 and parts-proto-1 exactly (checked: re-running `parts2_test.py` and `parts_test.py` gives the same results as the committed `results/parts2/` and `results/parts1/`, apart from new tuning keys that are off in those engines).*
- *This test: `extraction-test/parts3_test.py` (`/usr/bin/python3 parts3_test.py`, run from `extraction-test/`). Numbers: `extraction-test/results/parts3/analysis.txt` and `analysis.json`.*
- *The 78-reading corpus now lives in `extraction-test/results/parts1/corpus.json`, so the old warning about the scratchpad no longer applies.*

**Who is in the photos (rule 7):**
- The founder: profile pending (no birth year or picked looks yet).
- His friends: profile unknown.
- 703a8b (navy polo) and ebe23f (quilted jacket): unknown. **Please tell me who they are.**
- Web and stock photos: profile unknown.
- **New here:** the style council's outfits (`style-council/cases.json`). These are made-up readings with no person in them.

Everything was scored with **one test profile**: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. No engine lets age or picks change a number, so a split by age band or picked look isn't possible.

## The short version
- **One new reward, "the streetwear shape" (PR4).** It needs:
  - a boxy top (read as volume 4 or more), untucked, ending at the fly or higher;
  - relaxed or wide jeans or cargos, with no layer on top;
  - an outfit that reads as streetwear;
  - street sneakers: chunky, basketball, canvas, retro runner or low-profile.

  It's worth **+1.0 on Proportions** (the part goes to 8). Everything else is v2's.
- **Deliberate streetwear now reaches 8 the way a tuck does.** On the council's outfits (made-up readings, no person):
  - The graphic tee + wide jeans + Dunks goes **7.5 → 8.0**.
  - The two outfits that were already at 8 (a bomber over a hoodie; a red hoodie under a chore coat) stay at **8.0**.
  - A plain hoodie + wide jeans + chunky sneakers stays **7.5**.
  - Streetwear now has three ways to reach 8: a short jacket, the boxy shape, or a standout color with signature pieces.
- **No real photo changes.** PR4 fires on **0 of about 850 saved readings** (every photo, every run). The test photos hold no deliberate streetwear outfit the readings can see:
  - **Your streetwear checks** are in slides, white leather sneakers or boots, and your hoodies read as regular (volume 3).
  - **The stock streetwear photos** read as straight-leg.

  So every number below matches v2:
  - 8+ on 6% of photos;
  - batch 1 steady on 49/49;
  - the panel gap is +0.01 overall and +0.09 on the held-out half, with 26/29 within 0.5.

  **Streetwear is still absent from the 8s on real photos.** That's what the readings see, not something more tuning can fix.
- **Your fits:**
  - your black tee + wide jeans + white leather sneakers **stays 7.0** (both photos);
  - tucking the tee still lifts it to **7.5**;
  - swapping to chunky sneakers now lifts it to **7.5** (v2: no change);
  - a graphic tee **and** chunky sneakers would make it **8.0**.
- **Every "keep" target is met:**
  - the friend's blazer: 7.0;
  - the chore coat: 7.0 on all 3 photos;
  - your gingham fits: unchanged;
  - your black tee: 7.0.

---

## 1. What changed, and why

### The one change: PR4, "the streetwear shape" (Proportions, +1.0)
| Condition | Why | Steady? |
|---|---|---|
| Top `volume` ≥4, untucked, `length` cropped / at_belt / mid_fly | The boxy top is what makes the volume look deliberate. A long top (below the fly) is the shape every source calls off | Top volume ≥4: 97–100% across all photos. Among the 9 photos where any run read 4+, it flipped on 2 (m01 and m03 in batch 1) |
| Relaxed or wide jeans or cargos (not sweats); no pooling | The streetwear silhouette is defined over a baggy leg. A pooling hem blocks every shape reward, as in v2 | Loose leg yes/no: 97%. Pooling: 98% |
| No layer | With a layer the shape belongs to the layer: PR2 (short jacket) already credits it | Garment type: 100% |
| The outfit reads as streetwear | "Both loose" is split outside streetwear, so the reward stays inside it | Detection is the wobbliest fact (12/36). Given the other facts, though, it nearly always follows, and PR4 flips on 0 photos |
| Street sneakers: chunky, basketball, canvas, retro runner, low-profile (not white leather, boots, dress shoes or slides) | The streetwear silhouette is "finished" by its shoe | "Street shoe yes/no" held on 50 of 61 photos that read one in any run. The types flip mostly among themselves (canvas↔chunky, low-profile↔retro runner), and that doesn't change the reward |
| It takes the place of the waist break (PR1) when larger, and never adds to it | One top, one shape credit | — |

**Sources** (from the notes; nothing new was looked up):
- **The boxy or cropped top over a straight or loose leg** (`v5-silhouette.md` §1): 3 for, 0 against.
  - GQ, Max Berlinger, Jun 2023 (cropped tee with "straight or loose" pants; rule of thirds).
  - Mr Porter, Sep 2025.
  - H&M, Fall 2026 (a cropped jacket over baggy jeans).
- **Streetwear's defining silhouette**, "boxy tee or hoodie + baggy/wide jeans + chunky or basketball sneakers" (`v5-silhouette.md` §5; evidence rated medium). Highsnobiety (~2023), H&M ("always long enough to stack"), GQ Apr 2025 (a boxy bomber with roomier jeans), FashionBeans 2026.
- **`proportions.md` F4:** "Hoodies, sweatshirts and boxy tees are exempt: that's the defining street shape."
- **`style_archetypes.md`, streetwear "done well":** deliberate volume; "a chunky or skate shoe that matches the leg width". This is a synthesis, not sourced line by line.
- **Why it's gated on streetwear:**
  - The "both loose" family is split: for, FashionBeans 2026, Put This On 2018 and H&M's matching set; against, GQ Apr 2025 "(Probably not)" and H&M "doing both loose at once is the one way this goes wrong". The silhouette note's judgment is "fine in streetwear when the top ends at the belt or hip".
  - The chunky-shoe split is 3–2: for, GQ 2025, RMRS and Highsnobiety; against, Mr Porter 2025 ("you need a slender shoe") and H&M ("chunky runners fight the proportions"). So, like v2's SW2, it stays streetwear only.
- **Why +1.0 and not +1.5:** the waist break has 6 sources for and 0 against, so it keeps +1.5. The streetwear shape is medium evidence, so it gets a step less (part 8, "a good shape").
- **Why white leather sneakers don't count:**
  - It's the one sneaker every style shares (smart casual's anchor; a home shoe for minimal, prep and streetwear).
  - No source's streetwear silhouette names it. Rubric #183 added it to streetwear *detection* only, to stop a wrong penalty.
  - You called your black tee + wide jeans + white leather sneakers "clean but plain".
  - The test agrees (see §6): counting it moves your green sweatshirt to 8.0 against the panel's 7.0 and loses a held-out photo.

### The other candidates: already in v2, or tested and not adopted
| Candidate | Result | Why |
|---|---|---|
| **The look's own shoe for streetwear** | **Already there** (v2 SC +0.5) | It fires on 3 of the 5 streetwear anchors. The suit-shoe fix in v2 was needed only because suits have no style label; streetwear has one |
| **Signature pieces top to toe** | **Already there** (v2 H2 +1.0) | It fires for a hoodie, sweatshirt or graphic tee + loose jeans/cargos + chunky/basketball sneakers (the council's anchors, `RULEBOOK.md` streetwear table). Its size matches every other style's |
| **A street shoe that carries a wide leg** | **Kept at +0.5** (SW2) | Tested at +1.0: it lifts your black tee + chunky to 8.0, which is too much for a plain tee, and the evidence is split 3–2 |
| **A graphic print as streetwear's one standout** | **Not adopted** (switch `h4_graphic_street`, off) | `cohesion.md` H4 has the source (Modest Man: the graphic tee is the statement). But graphic vs plain flips on 4 of 12 photos where it's read (tee vs graphic tee too), so it fails "only steady facts". It moved no photo and no council outfit to a new rounded score |
| **A tonal streetwear fit** | **Not adopted** | `color.md`: all-black stays a 7 with the flat-tonal tip. "Tonal with a range" (+1.0) is already in v2 for every style, but it needs the `lightness` word, which isn't in the live reading. "All-dark is intentional" is a techwear inference in `style_archetypes.md`, not a source. Giving tonal points without lightness would also lift your black tee + black jeans |
| **A straight leg too** | **Not adopted** (`pr4_legs`) | A mid-length boxy top over straight legs is the relaxed-straight middle, the default 7 (`v5-silhouette` S11). It moves only web m01, 7.0 → 7.5 (see §5) |
| **A hoodie, sweatshirt or graphic tee read at volume 3** (with chunky or basketball sneakers) | **Not adopted** (`pr4_signature_v3`) | It would make your plain grey hoodie + wide jeans + chunky sneakers 8.0 (0d39d6 and 1f1997 with a shoe swap), and b0f0c8 too. A regular hoodie over baggy jeans is the streetwear uniform, not a deliberate shape |
| **PR4 at +0.5 or +1.5** | +1.0 kept | +0.5: the graphic-tee outfit still reaches 8, but the jersey look-alike and the plain blokecore jersey don't (the bonus and rounding carry the rest). +1.5: nothing new reaches 8, and it would equal the waist break's better evidence |
| **Only chunky and basketball count as street shoes** | Not adopted | Canvas (skate) and retro/low-profile sneakers are streetwear home shoes (`RULEBOOK.md`; `style_archetypes.md`). A narrower set adds a boundary inside "sneakers" where the types flip |

## 2. Which photos moved
- **Real photos: none.** 0 of 78 shown scores moved, and 0 raw scores. PR4 fires on 0 readings in any run of batch 1 (arms A and B1), zoom1 (arms A–D) or zoom1-stock (arms A and B).
- **The photos that read as streetwear, and what each lacks for PR4:**

| Photo | Who | v3 | Lacks |
|---|---|---|---|
| m01 | web (profile unknown) | 7.0 | leg read straight (its description says "relaxed jeans") |
| 0d39d6, 1f1997 | founder (profile pending) | 6.5 | hoodie read volume 3; slides |
| 403ade, 8ad378 | founder | 7.0 | white leather sneakers (by design) |
| 968016 | founder | 7.5 | white leather sneakers (by design) |
| 8bc29d, e026de | founder | 6.5 | an overshirt on top; hoodie volume 3; boots read "other" or slides |
| b0f0c8 | founder | 7.0 | hoodie volume 3; work boots |
| p02 before/after | stock (profile unknown) | 6.5 | sweatpants (loungewear) |

- **The council's outfits that moved** (made-up readings, no person):

| Outfit | Advocate (v4 scale, where plain was 7.5) | v2 → v3 |
|---|---|---|
| st-7.5 graphic tee (boxy) + wide light jeans + white Dunks | 7.5 | **7.5 → 8.0** |
| vs-8 red jersey (boxy) + wide jeans + Sambas | 8.0 | **7.5 → 8.0** |
| vs-7.5 multicolor jersey (boxy) + relaxed jeans + Sambas ("blokecore plain") | 7.5 | **7.0 → 8.0** |
| look-alike: red jersey (boxy) + wide jeans + chunky sneakers | — | **7.5 → 8.0** |
| look-alike: boxy cropped tee + wide jeans + chunky (mirror photo) | — | 7.5 → 7.5 (part 7.5 → 8) |

**An honest flag:** two outfits the advocates rated 7.5 (the graphic tee + Dunks, the plain blokecore jersey) now score 8.0.
- **Parity for:** they're the defining shape of their style plus their signature pieces and shoe, which is what a tucked shirt + straight trousers + chosen shoes earns (P001, panel 8.0).
- **Against:** on their advocates' own scale, they were "solid, nothing special".

The gold set should settle it: include a graphic tee + baggy jeans + Dunks, and the same tee on straight jeans.

## 3. The distribution by detected style

**Real photos (one reading per photo; v2 and v3 are identical):**

| Card label | n | Median | Best | 8+ |
|---|---|---|---|---|
| Smart casual | 15 | 7.0 | 8.0 | 3 (m02, m05, s01) |
| No style | 37 | 7.0 | 8.0 | 2 (m09, s07: suits) |
| Streetwear | 9 | 6.5 | 7.5 | 0 |
| Workwear | 9 | 7.0 | 7.5 | 0 |
| Minimal | 6 | 7.0 | 7.0 | 0 |
| Classic prep | 2 | 7.0 | 7.0 | 0 |
| (streetwear among the detected styles) | 11 | 6.5 | 7.5 | 0 |

**Does each style have a path to 8?** On the council's outfits (made-up readings, all marked mirror photos):

| Style | n | Best v2 → v3 | 8+ v2 → v3 | The path |
|---|---|---|---|---|
| **Streetwear** | 5 | 8.0 → 8.0 | 2 → **3** | Yes, three: a short jacket over wide jeans; **the boxy shape (new)**; a standout color with signature pieces |
| **Vintage sport** | 11 | 7.5 → **8.0** | 0 → **2** | **Yes, new:** a boxy jersey over wide jeans with Sambas also reads as streetwear, so PR4 fires. It's vintage sport's own defining silhouette (`v5-silhouette` §5; weak evidence) |
| Smart casual | 7 | 8.0 | 1 | Yes: the tailored line, a tuck |
| Classic prep | 11 | 8.0 | 1 | Yes: the tailored line, a tuck |
| Minimal | 8 | 7.0 | 0 | Only through a tuck or short top in a non-mirror photo (the boxy-tee look-alike reaches 8.0 when it isn't a mirror shot). Its tonal 8s need `lightness` |
| **Workwear** | 8 | 7.5 | 0 | **No.** A chore coat earns nothing by design, and its boots are already counted. Only a denim jacket or a tuck can lift it |
| **Outdoor** | 7 | 7.0 | 0 | **No.** No shape the readings credit fits a shell over chinos |

So streetwear is no longer the gap. **Workwear and outdoor are.** That's a separate pass, and it needs readings (a chore coat's length, `stacked` cuffs on raw denim), not resizing.

## 4. Steadiness, the panel, and the held-out half
| | v2 | **v3** |
|---|---|---|
| Batch 1 arm A, all 3 runs within 0.5 | 49/49 | **49/49** (exactly the same 41/49; 0 photos differ from v2) |
| zoom1 arm B (design set) | 66/66 | **66/66** |
| Batch 1 + lightness | 49/49 | **49/49** |
| Panel, all 59: mean diff / MAE / within 0.5 / r | +0.01 / 0.42 / 51 / 0.63 | **the same** |
| Tuning half (30) | −0.07 / 25 within 0.5 | **the same** |
| **Held-out half** (29, the same `split.json`, re-made and checked identical) | +0.09 / 26 within 0.5 / r 0.56 | **the same** |
| Overall 8+ | 5 (6%) | **5 (6%)** |

The panel can't judge this change: its photos have no outfit PR4 fires on. The 10 panel photos with streetwear among the detected styles (8 of yours, plus the stock sweatsuit pair) all stay put:
- b0f0c8: 7.0 (panel 6.5); 8bc29d: 6.5 (6.5);
- 0d39d6 and 1f1997: 6.5 (panel 5.5);
- 403ade: 7.0 (7.0);
- 8ad378: 7.0 (7.5);
- 968016: 7.5 (7.0);
- e026de: 6.5 (6.5);
- the p02 sweatsuit pair: 6.5 (7.0).

**The variant that counts white leather sneakers** is the only one that touches the panel:
- 968016: 7.5 → 8.0 (panel 7.0);
- 403ade: → 7.5 (panel 7.0);
- 8ad378: → 7.5 (panel 7.5).

It loses one held-out photo within 0.5 (26 → 25). That's the measured reason white leather sneakers stay out.

## 5. Your checks and your friends' (each at its own occasion)
All 27 are unchanged from v2. The ones this pass was about:

| Photo | Who | What's read | v2 → **v3** | Target |
|---|---|---|---|---|
| d1967f | friend (profile unknown) | blazer, tee, jeans, chukkas | 7.0 → **7.0** | ≤7 ✓ |
| e438d4, f4870b, fb0b17 | friend | chore coat, tee, jeans, low-profile sneakers | 7.0 → **7.0** | 7–7.5 ✓ (no PR4: there's a layer, and the jeans read straight) |
| 5a9049, 7f14a4 | founder (profile pending) | gingham shirt alone, wide jeans, boots | 7.0 → **7.0** | ≤ v2 ✓ |
| f07193 | founder | gingham overshirt | 6.5 → **6.5** | ≤ v2 ✓ |
| 8ad378, 403ade | founder | black tee (boxy, read volume 4, to the fly), black wide jeans, white leather sneakers | 7.0 → **7.0** | 7 ✓ |
| 968016 | founder | green sweatshirt (boxy), wide jeans, white leather sneakers | 7.5 → **7.5** | — |
| 703a8b, ebe23f | unknown (ask) | tucked polo; quilted jacket | 7.5, 7.0 → same | — |

**Your black tee outfit: what would lift it?** What-if edits of your own reading (8ad378 at Class; 403ade gives the same numbers):

| Edit | v2 | **v3** | Parts (v3) |
|---|---|---|---|
| As read | 7.0 | **7.0** | Prop 7 · Fit 7 · Color 7 · Shoes 7.5 · Style 7.5 |
| Tee tucked | 7.5 | **7.5** | Prop 8.5 (the waist break) |
| Shoes → white chunky sneakers | 7.0 | **7.5** | Prop 8 (the streetwear shape) · Shoes 7.5 |
| Shoes → basketball sneakers | 7.0 | **7.5** | same |
| Shoes → black canvas (skate) sneakers | 7.0 | **7.5** | Prop 8 · Shoes 7 |
| Tee → graphic tee (white leather sneakers kept) | 7.0 | **7.0** | Shoes 8, but no shape |
| **Graphic tee + chunky sneakers** | 7.5 | **8.0** | Prop 8 · Shoes 8 · Style 8.5 (signature pieces top to toe) |
| Tee read regular (volume 3) + chunky | 7.0 | 7.0 | no shape: the boxy read is what carries it |
| Tee read long + chunky | 7.0 | 7.0 | no shape |
| Jeans pooling + chunky | 6.5 | 6.5 | pooling blocks the shape and costs Fit |

So the ladder is **plain 7 → one deliberate thing 7.5 → the shape plus signature pieces 8**. That's the same ladder as tailoring:
- a plain shirt and chinos: 7–7.5;
- tucked: 7.5–8;
- tucked with a jacket and its shoes: 8.

**Web m01** (oversized white graphic tee, light relaxed jeans, Dunks, cap and chain; profile unknown; stylist estimate 7.5):
- As read it's 7.0, because the jeans read straight on 6 of 6 runs.
- With the relaxed leg its description gives, it would be **8.0**: the shape plus signature pieces. Its multicolor Dunks against the graphic tee cost Shoes 0.75.

This is the one real photo of deliberate streetwear in the sets, and the leg reading is what keeps it out.

## 6. The fix lifts
| Fix (the engine's own edit) | Applies to | Shown score up, v2 / v3 | Ever down? | Your and your friends' photos (v3) |
|---|---|---|---|---|
| Tuck the top | 30 | 11 / **11** | never | black tee 403ade and 8ad378 7.0 → **7.5** (still lifts); gingham shirt 7.0 → 7.5 |
| Slides → white leather sneakers | 9 | 9 / 9 | never | hoodie + jeans + slides 6.5 → 7.0 |
| **Slides → chunky sneakers** (new) | 9 | 9 / 9 | never | hoodie + wide jeans + slides 6.5 → **7.5** (0d39d6, 1f1997, e026de). Joggers + slides 5.5 → 6.5. The same in v2: your hoodies read volume 3, so PR4 doesn't fire |
| **White leather → chunky sneakers** (new) | 5 | 0 / **3** | never | black tee 8ad378 and 403ade 7.0 → **7.5**; green sweatshirt 968016 7.5 → **8.0**; ebe23f (quilted jacket) no change |
| A better-fitting piece | 2 | 2 / 2 | never | gingham overshirt 6.5 → 7.0 |
| Add a standout color | 39 | 18 / 18 | never | black tee, chore coat 7.0 → 7.5 |
| Add a standout pattern | 39 | 13 / 13 | never | black tee, chore coat 7.0 → 7.5 |

**No fix lowers a score in v2 or v3.** The new "swap to street sneakers" fix is the first one that lifts a streetwear outfit through its shape. The fix copy can say so, for example "Chunky or skate sneakers finish the shape of a boxy tee and wide jeans". **That's outward-facing copy, so it's a taste call for you.**

## 7. What still can't be seen for streetwear
1. **Boxiness on hoodies.**
   - Only 48 of 731 top reads are volume 4+ (`v5-silhouette` §4). All your hoodies read 3; only your black tee and green sweatshirt read 4.
   - The streetwear shape is real on many fits that the reading calls "regular".
   - A boxy/cropped reading needs its own flip test. That's the biggest unlock for streetwear.
2. **The stack on baggy jeans.**
   - A deliberate stack reads as "pooling". Pooling costs everyone −0.4 on loose jeans (RULEBOOK ruling 13) and blocks every shape reward, PR4 included.
   - `stacked` and `hem_on_shoe` (reading batch 2) are untested; the hem is 68% steady.
   - Until then, a well-stacked streetwear fit can lose its shape credit.
3. **Leg width.** "Wide" is 73% right on your photos; m01's relaxed jeans read straight 6 of 6 times.
4. **Which sneaker.** The exact type is right 53% of the time (the kind 77%). Dunks, AF1s, chunky runners and low-profiles blur, and white leather vs low-profile is the edge PR4 sits on (m03 flipped across it once).
5. **Graphics.** Whether there's a print flips on 4 of 12 photos, and what it is (a band tee, a logo, a small chest hit) isn't read. So "one graphic as the statement" can't move points.
6. **The finishing touches streetwear lives on.** Chains, crossbody bags and visible socks have no reading (`cohesion.md` H6, untested). Caps and beanies are never scored, because the head is hidden in the upload.
7. **Layer length.** Puffers aren't counted as short layers, because outer-layer length is 63% steady. A cropped puffer over wide jeans earns nothing for its shape.
8. **Fabric, wash, fading, distressing on purpose vs worn.** Not readable (as for every style).
9. **Whether the volume is chosen or just big.** No reading. The rule leans on the boxy cut and the street shoe as stand-ins.
10. **No real deliberate streetwear photo in the test sets.** Your streetwear checks are in slides, white leather sneakers or boots. **The gold set needs:**
    - streetwear fits in chunky, basketball and skate sneakers;
    - boxy tees and hoodies;
    - stacked baggy jeans;
    - one-change pairs: white leather vs chunky under the same outfit; boxy vs regular tee; stacked vs cropped hem.

## 8. What I recommend
1. **Take v3 as the parts engine's working settings.** It's v2 plus one reward, it changes no real photo, it keeps every target, and it gives streetwear (and vintage sport) the same "one deliberate shape" route to 8 that tailoring had.
2. **Log it in DECISIONS-LOG** (not done here; this session doesn't commit). Cover:
   - PR4 (+1.0; boxy top, loose jeans/cargos, no layer, streetwear read, street sneakers; replaces PR1 when larger);
   - why white leather sneakers are left out;
   - the five not-adopted variants and the measured reason for each.
3. **Next for streetwear, in order:**
   - a flip test of a boxy/cropped top reading on hoodies;
   - reading batch 2 (`stacked`, `hem_on_shoe`), so a deliberate stack stops reading as a fault;
   - streetwear fits in street sneakers in the gold set.
4. **Next for the engine:** workwear and outdoor have no path to 8 on the council's outfits. That's the bias to fix after this one.
