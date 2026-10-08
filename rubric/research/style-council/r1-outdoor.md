# Round 1: Outdoor (gorpcore)

*Outdoor advocate, Oct 7, 2026. Every score below comes from `extraction-test/rubric.py` v3.1, or from a patched copy that applies the proposals in section 4. The patched copy and test scripts are in the session scratchpad under `outdoor/` (`rubric_outdoor.py`, `outdoor_test.py`, `anchors2.py`, `regress.py`), not in the repo. Every number was re-run from that folder after the shared-scratchpad clash, and all of them matched. The detector rule is written out in section 3 so the mediator can rebuild it. Occasion is everyday unless stated. "v3.1 (no pick)" means `styles={}`.*

## 1. Identity

**One line:** technical outdoor gear worn in town, meaning shells, fleeces, vests, cargo or tech pants and trail shoes, worn either as a full outfit or as one technical piece mixed into a normal one.

- **Absorbs:** gorpcore, "tech shell + cargos + Salomons" city wear, and the outdoor end of techwear. All-black modular techwear stays with Streetwear, as the research report already says.
- **Who wears it (US 18–30):** guys in college towns and cities with real weather, plus the Arc'teryx/Salomon crowd who came to it through streetwear rather than hiking. Measure's behavioral panel shows the age skew: "Sixty-five percent of Arc'teryx's US audience falls in the 18–34 bracket", and men index at 161 ([Measure Protocol, Jun 22, 2026](https://www.measureprotocol.com/insights/arcteryx-luxury-outdoor-streetwear-crossover-2026)).
- **How big it is:**
  - **The gear is booming.** In FY2025, Amer Sports' Technical Apparel (Arc'teryx) grew 30% and Outdoor Performance (Salomon) grew 31% (Amer 6-K, Feb 24, 2026, snippet). Salomon grew 35% to more than $2B, and its "Sportstyle" line is described as resonating with younger buyers (Amer CEO letter 2025, snippet).
  - **The label is fading.** Search interest in "gorpcore" peaked in 2022–23 and has been falling since ([Sportsverse, May 29, 2025, snippet](https://sportsverse.substack.com/p/what-happened-to-gorpcore-brands)). Arc'teryx's audience index "cooled 44.6 points" from H2 2024 to H1 2025 (Measure, above). 2026 editors call the head-to-toe version dated: "unless you're actually scaling Everest, why are you dressed like you're about to?" ([The Modest Man, Apr 29, 2026](https://www.themodestman.com/outdated-looks-to-retire-2026/)). Ape to Gentleman says it's "high time to wave goodbye to" full gorpcore ([Ape to Gentleman, 2026](https://www.apetogentleman.com/fashion-trends-men-drop/)).
- **My honest read:** the pieces have gone mainstream while the style as an identity has shrunk. Lots of guys will wear a shell, a fleece or trail shoes. Far fewer would tap "Outdoor" as who they are.

**Verdict on whether it deserves an option:**
1. **As a detected profile in code: yes, required.** Some outfits that are clearly outdoor lose points today for things the style intends (section 4), and the shells and fleeces are everywhere. The founder's rule ("judge the fit by what it's going for") only works if the profile exists.
2. **As an onboarding option: marginal.** Keep it as the 7th and last option, named **"Outdoor"**, never "Gorpcore" (the word is dated). If the list has to shrink to 6, fold the onboarding option into Streetwear ("Streetwear / tech") and keep the detection profile separate. Folding the option costs little, because under the Oct 7 rule his picks only break ties and steer suggestions. Workwear is the worse fold: boots versus trail shoes, and canvas versus nylon.

## 2. Signals table

Schema today: `shell_jacket`, `rain_jacket`, `fleece`, `puffer` and `cargos` exist. The prompt defines none of them. **Missing: trail shoes, vests and technical pants.** Trail shoes currently get read as `performance_runner` or `chunky_sneaker`, and vests as `puffer` or `other`.

| Signal (schema terms) | Strength | Also a signal for | Note |
|---|---|---|---|
| `shell_jacket` / `rain_jacket` (treat as one group) | Strong | Minimalist (black shell), Streetwear | The model flips between them: s21 was read as `rain_jacket` in 2 runs and `shell_jacket` in 1. Never let the two score differently |
| `fleece` (top or outerwear) | Strong | Smart casual (quarter-zip fleece), Workwear | The pile texture is easy to see. The category flips top/outer (see section 4, change 1) |
| `vest` **(new field value)**: sleeveless insulated or fleece vest, category outerwear | Strong | Smart casual (the "Midtown vest" over an oxford) | Has no slot today |
| `trail_shoe` **(new field value)**: trail runners and hiking shoes/boots with lugged soles (XT-6, Speedgoat, Merrell type) | Strong | Vintage sport/athleisure, Streetwear | The single most recognizable outdoor marker in 2025–26 sources |
| `cargos` | Medium | Workwear, Streetwear | Too common to count alone |
| `technical_pants` **(new field value)**: woven nylon/ripstop hiking pants with a fly or belt loops, often a cinched hem | Medium | Techwear/Streetwear | Unreliable to read (section 8). Mainly exists so tech pants stop being read as joggers |
| `puffer` | Weak | Everyone in winter, Streetwear | A winter coat, not a style choice |
| `performance_runner` | Weak | Athleisure, Vintage sport | Road runners aren't outdoor |
| Palette: earthy/tonal, or **one** bright on the technical piece | Weak | Workwear (earthy), Minimalist (tonal) | Already handled by C1/C3/K3; not used for detection |
| `logo: large` on a shell, fleece or puffer | Weak | Streetwear | The reading flips between runs; never use it to detect |
| **Negative:** any tailored piece (`blazer`, `sport_coat`, `suit_jacket`, `unstructured_blazer`, `dress_shirt`, `trousers`, `suit_trousers`, `dress_shoe`, `derby`, `loafer`) | Veto | Smart casual, Classic prep | A shell over a suit is commuting in the rain, not a style |
| **Negative:** `sweatpants`, `athletic_shorts`, `jersey` | Veto | Vintage sport/athleisure | e.g. s21: rain shell + track pants + runners |
| **Negative:** `chore_coat`, `denim_jacket`, `field_jacket` with `work_boot` | Strong against | Workwear | |
| **Negative:** `graphic_tee` / `hoodie` as the outermost top with `basketball_sneaker` / `canvas_sneaker` | Medium against | Streetwear | |

## 3. Detection rule

Only garments read with certainty "clear" or "likely" count. There are three slots: upper (top/outerwear), bottom and feet.

- **Anchors:** shell or rain jacket, fleece, vest (new), trail shoe (new).
- **Support:** cargos, technical pants (new).
- **Weak:** puffer, performance runner.

**It reads as outdoor** when there is at least one anchor, and the anchors plus support cover **2 or more different slots**.
- **"Leans outdoor"** (1 anchor, plus a weak piece in another slot) only breaks ties and steers suggestions; it unlocks nothing.
- **Vetoes:** any tailored piece, or sweatpants, athletic shorts or a jersey.

```python
ANCHOR = {"shell_jacket","rain_jacket","fleece","vest","trail_shoe"}; SUPPORT = {"cargos","technical_pants"}
WEAK = {"puffer","performance_runner"}; VETO = TAILORED | {"sweatpants","athletic_shorts","jersey"}
slots = {slot(g) for g in gs if g.sub in ANCHOR | SUPPORT}            # upper / bottom / foot
outdoor = not (subs & VETO) and any(g.sub in ANCHOR for g in gs) and len(slots) >= 2
```

**Tested on the saved readings:**
- **Zero false positives:** 52 photos × 3 runs (156 readings), plus the 4 Oct 7 phone checks.
  - s21 (rain shell + "sweatpants" + runners) is vetoed to athleisure in all 3 runs, which is correct for the photo (Puma track pants).
  - The founder's hoodie, wide jeans and slides never trigger it.
- **Zero true positives either:** none of the test photos is an outdoor outfit, so the rule is **untested where it matters.** The gold set needs about 8 outdoor photos: shell + cargos + trail shoes; fleece + jeans + trail shoes; vest over a tee; a full kit; and a technical piece mixed with chinos.

**Confidence:** medium. Requiring two slots means one misread rarely flips the result. The likeliest flip is trail shoe ↔ chunky sneaker. When that happens, the same outfit (puffer + boxy tee + wide cargos) should get picked up by Streetwear, which grants the same silhouette allowances.
- **What a detection flip costs:** measured on my anchors (proposal rubric, detected vs. not), it is 0 to 0.5 on 4 of 5 outfits that move, and **1.0** on "big puffer + boxy tee + wide cargos" if no style catches it at all.
- **What the model reads well:** jacket type at the group level, fleece, cargos, and whether a vest has sleeves.
- **What it reads badly:** trail versus road runner (in mirror shots), and technical pants versus joggers or chinos.

## 4. What this style excuses, and what it never excuses

**Principle (applies to every style): detection may only widen.** A detected style's band is combined with his own picks or the default band, and can never replace them. Why this matters: with today's gorpcore band (straight→wide), slim jeans under a shell get *penalized* (P1 fires in the `trail_slim_jeans` and `vest_midtown` tests), even though slim jeans are fine in the default band.

**What outdoor excuses** (only when it reads as outdoor; garment-confirmed):
1. **Band:** top looseness 3–4 and legs **slim→wide**, combined with his picks. Slim is included because tapered, cinched tech pants read as "slim", and sources describe drawcords pulled tight at the ankle ([Ape to Gentleman, undated](https://www.apetogentleman.com/gorpcore-trend/)). This removes `P1` hits of about −0.2 to −0.45.
2. **`P3_everything_oversized` (−0.3):** skipped, as it already is for the gorpcore pick.
3. **Big-logo tip:** not shown for a large logo on a shell, fleece, puffer, vest or trail shoe (worth 0 points). `O3` at work and interviews still applies.
4. **Stacking:** relaxed or wide cargos and tech pants with the proposed `stacked` hem cost 0, as the research report proposes for every style. Real pooling still costs.
5. **`S1` (bulky shoe + narrow leg, −0.45):** not applied when the bottom is joggers or tech pants with a `cropped`/`cuffed` hem (cinched at the ankle). This is garment-level and applies to everyone. It moves s06 (pink joggers + runners) from 7.0 to 7.5, so Vintage sport should weigh in.

**Never excused:**
- **Care:** `F7` care faults, including muddy trail shoes. I don't ask for workwear's scuffed-shoe half; muddy shoes in town just look dirty.
- **`F9` (sleeves covering hands):** shell sleeves often run long. Reviewers list "Sleeves Slightly Long" as the Beta's main complaint ([FashionBeans, Nov 19, 2025](https://www.fashionbeans.com/article/arcteryx-beta-jacket-viral-2025/)), which means people notice it.
- **Other fit and color rules:** `F4` real pooling, `F6`, `F8`, `F10`, `C3` (two brights stay a clash), and `O4` sweatpants.
- **Occasion:** `O1` too casual. A trail-shoe outfit at a business-casual job is still underdressed.

**Two credit fixes. They are cross-style and lower scores; they don't raise them:**
1. **K1 shouldn't depend on whether the fleece is filed as a top or outerwear.** Today a fleece pullover over a tee scores **7.0** as a "top" and **8.0** as "outerwear", a full point swing on the same garment. Fix: any `fleece` or `vest` earns K1 whatever its category.
2. **Technical layers (`shell_jacket`, `rain_jacket`, `puffer`, `fleece`, `vest`) earn K1 at 0.5, not 0.75.** A winter coat over a hoodie shows less styling intent than an overshirt or a knit. Under v3.1, any one jacket over clean basics scores 7.75, which rounds to 8.0 ("Sharp"). The FashionBeans "modern uniform" (Beta, black cargos, Salomons, beanie) is competent but not Sharp. With this fix it lands on 7.5.
3. **Also:** a garment with a care fault (`stained`, or `pilled_or_worn` not by design) can't earn `K3`. A pilled red fleece isn't a "point of interest".
- **Regression on the saved readings:** 4 of 156 scores move. s06 ×3 goes up 0.5 (the S1 cinched-hem change). s08 run 0 goes from 8.5 to 8.0; that one is a white suit misread as a "puffer". The 4 phone checks don't move.

## 5. Style-specific mistakes and done-well signals

- **No new point-carrying mistakes.** Outdoor's real faults are already covered by fit, care and occasion rules.
- **The costume tip (no points):** shown when an outdoor outfit has technical pieces in all 3 slots **and** a second technical upper layer (fleece under shell, or a vest over a fleece). Text: "Swap one technical piece for a basic." Sources: Modest Man and Ape to Gentleman (2026), and Opumo's "It's not about looking as though you're ready for an alpine expedition" ([Opumo, updated 2025](https://www.opumo.com/magazine/what-is-gorpcore-men/)). A 3-piece city uniform doesn't get the tip.
- **I argue against the research table's "shell over suit trousers" as a fault.** FashionBeans says the Beta works "with cargos, tailoring, gym fits, or denim" (Nov 19, 2025, above). The veto simply hands that outfit to the general standard.
- **Done-well signals (for the explanation text, not credits):**
  - one technical piece mixed with a non-technical piece (the 2026 consensus)
  - an earthy or tonal palette, or one bright technical color (already K3)
  - a cinched hem that shows the shoe
  - clean shoes
- **No new credit.** A mixed outfit already earns K2, and a bright shell earns K3. I'm not asking for K4 for trail shoes (section 6, 9.5 anchor).

## 6. Anchor outfits (everyday)

| Target | Garments (schema terms) | v3.1 no pick | v3.1 gorp pick | Proposal (detected) | Why |
|---|---|---|---|---|---|
| ~4 | `fleece` red bright, volume 5, sleeves `covers_hand`, `pilled_or_worn` · `graphic_tee` grey, `below_crotch` untucked · `cargos` olive relaxed, `pooling`, `wrinkled` · `trail_shoe` multicolor, `pilled_or_worn` | 5.0 | 5.0 | **4.0** | Several fit and care faults at once. v3.1 still pays K3 for the pilled fleece |
| ~5.5 | `puffer` black, volume 5, `covers_hand` · `hoodie` grey, volume 4, `below_crotch` · `jeans` light, `skinny`, `full_break` · `trail_shoe` grey | 5.5 | 5.5 | **5.0** (leans outdoor) | Classic beginner volume clash. The new S1 for trail shoe + skinny costs 0.45; I accept 5.0 |
| ~6.5 | `shell_jacket` black, large logo · `hoodie` grey, `covers_hand` · `jeans` light, `slim` · `trail_shoe` multicolor | 7.5 | 7.0 | **6.5** | Busy shoe under a slim leg, sleeves over the hands. v3.1 misses the shoe/leg clash because the shoe has no type |
| ~7.5 | `shell_jacket` black, small logo · `tee` grey, `mid_fly` · `cargos` black, relaxed, `cuffed` · `trail_shoe` black | 8.0 | 8.0 | **7.5** | The 2025 city uniform: clean, intentional, nothing extra. "Put together", not "Sharp". Also 7.5 at Date |
| ~8.5 | `shell_jacket` olive · `sweater` cream · `chinos` khaki, straight, `slight_break` · `trail_shoe` grey | 8.5 | 8.5 | **8.5** | One technical piece over elevated basics (K1 + K2): the mix the 2026 sources recommend |
| ~9.5 | `shell_jacket` orange bright · `sweater` cream · `chinos` olive, relaxed · `suede_chukka` brown | 9.5 | 9.5 | **9.5** (not detected: one anchor) | Outdoor-led mix with every credit. The same outfit with `trail_shoe` scores **9.0** |

- **On the 9.5 row:** an outfit that is fully outdoor head to toe tops out at 9.0, because trail shoes (dressiness 2) can never earn K4. **I think that's right.** The 2026 sources say the best version mixes in one technical piece, and the rubric already rewards that mix with 9.5. Asking for K4 on trail shoes would be inflation; Workwear will face the same question about boots.
- **Other checks:**
  - "Fleece (top) + tee + jeans + trail shoe" goes from 7.0 to 7.5, and the same outfit with the fleece read as outerwear goes from 8.0 to 7.5, so the category flip disappears.
  - "Big puffer + boxy tee + wide cargos + trail shoes" scores 7.0 in v3.1 (no pick), 8.0 with the gorp pick, and **7.5** under the proposal.

## 7. Look-alikes and tie-breakers

- **Streetwear/techwear** (black shell + black cargos + trail shoes):
  - Their silhouette allowances nearly match, so the score barely depends on which one wins.
  - **Tie-break:** a technical anchor as the outermost layer, or `trail_shoe` → Outdoor. A `graphic_tee` or `hoodie` outermost with `basketball`/`canvas`/`chunky` sneakers → Streetwear.
  - If both qualify, apply each one's garment-confirmed allowances, and let his picks choose the label.
- **Workwear** (cargos, olive, field jacket, boots):
  - **Tie-break:** canvas or denim outer (`chore_coat`, `field_jacket`, `denim_jacket`) or `work_boot` → Workwear.
  - A fleece over a flannel with jeans and work boots → Workwear, since outdoor has only one anchor there.
- **Vintage sport/athleisure** (runners, track pants): any `sweatpants`, `athletic_shorts` or `jersey` vetoes Outdoor.
- **Smart casual** (vest or fleece quarter-zip over an oxford): the tailoring veto hands it to Smart casual. Note that `oxford_shirt` and `chinos` are *not* in the veto, so a fleece with chinos and trail shoes is still Outdoor.
- **Minimalist** (black shell over all-black): with trousers or leather sneakers → Minimal; with cargos or trail shoes → Outdoor. Tonal outfits are never penalized either way.

## 8. Fields the model can't read reliably, and what to do instead

- **Fabric** (Gore-Tex, nylon, ripstop, merino): VLMs are weakest here. Per the paper, "fabric attributes are most challenging", with F1 of 36–52% ([arXiv 2601.15711, Jan 22, 2026](https://arxiv.org/html/2601.15711)). **Never add a fabric field.** Use garment type as the stand-in: a shell is a shell.
- **Brand** (Arc'teryx, Salomon, TNF): never read, never scored.
- **Trail shoe vs road runner vs chunky sneaker:** medium. The lugs are visible only when the shoes are in frame and sharp. Define `trail_shoe` in the prompt by its lugged sole and technical upper. A miss falls back to `performance_runner`/`chunky_sneaker`, both dressiness 2, so the only loss is detection, which the two-slot rule protects.
- **Technical pants vs joggers:** low, and it matters. Joggers count as dressiness 1, so at a Date the "shell + tee + tapered tech pants + trail shoes" outfit scores **7.5** when read as technical pants and **6.0** when read as joggers. That is the outdoor version of the jeans/sweatpants miss. **Use the one-tap question:** "Joggers or hiking pants?", asked only when the answer changes the score (dressier occasions).
- **Vest vs puffer jacket:** fairly reliable, since sleeves are visible.
- **Shell vs rain jacket vs puffer:** they flip, so treat them as one group. Under the proposal they score the same.
- **Logo size:** flips between runs. Use it for the tip only.

## 9. Sources

- Measure Protocol, "Arc'teryx luxury outdoor / streetwear crossover", Jun 22, 2026 (behavioral panel): https://www.measureprotocol.com/insights/arcteryx-luxury-outdoor-streetwear-crossover-2026
- Amer Sports FY2025 results, SEC Form 6-K, Feb 24, 2026 (search snippet: Technical Apparel +30%, Outdoor Performance +31%): https://www.sec.gov/Archives/edgar/data/1988894/000198889426000002/pressreleaseq425.htm
- Amer Sports CEO letter to shareholders 2025 (search snippet: Salomon +35% to more than $2B; Sportstyle resonates with younger buyers): https://www.amersports.com/newsroom/ceo-letter-to-shareholders-2025/
- FashionBeans Editors, Arc'teryx Beta viral jacket, Nov 19, 2025: https://www.fashionbeans.com/article/arcteryx-beta-jacket-viral-2025/
- FashionBeans Editors, gorpcore style guide, Apr 29, 2025: https://www.fashionbeans.com/article/gorpcore-style
- Paddy Maddison, Opumo, "What is gorpcore", updated 2025: https://www.opumo.com/magazine/what-is-gorpcore-men/
- TMM Staff, The Modest Man, outdated looks to retire, Apr 29, 2026: https://www.themodestman.com/outdated-looks-to-retire-2026/
- Paddy Maddison, Ape to Gentleman, "13 men's fashion trends to leave behind in 2026": https://www.apetogentleman.com/fashion-trends-men-drop/
- Ape to Gentleman, gorpcore trend guide (undated): https://www.apetogentleman.com/gorpcore-trend/
- Daniel-Yaw Miller, Sportsverse, "What happened to gorpcore brands?", May 29, 2025 (paywalled; search snippet only): https://sportsverse.substack.com/p/what-happened-to-gorpcore-brands
- GQ's Noah Johnson, "RIP Gorpcore" (search snippet only; date and URL not confirmed, so weak)
- Stitch Fix, gorpcore guide, Feb 1, 2022 (older; used only for "tech pants instead of denim", which I don't adopt): https://www.stitchfix.com/men/blog/?p=12976
- Salomon, "XT-6: trail fashion icon" (brand marketing, undated): https://www.salomon.com/en-us/blog/XT6-trail-fashion-icon
- Zero-shot product attribute labeling with VLMs, arXiv 2601.15711, Jan 22, 2026: https://arxiv.org/html/2601.15711
- In-repo: `rubric/research/notes/style_archetypes.md` (the Altitude Sports profile), `proportions-color-style.md` (the `stacked` hem, "style unlocks, garments confirm").
- **My own judgment, not sourced:** all point values; K1 at 0.5 for technical layers; the two-slot detection threshold; the 9.0 ceiling for full outdoor outfits being correct; my target scores.
