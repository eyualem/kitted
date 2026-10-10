# Part: Proportions and silhouette

*Oct 10, 2026. Claude (subagent), for the parts-scoring brief (`parts/BRIEF.md`, DECISIONS-LOG #195). Builds on `notes/v5-silhouette.md` (the shape families, the waist break, a long loose layer over a loose leg, shoe weight against the leg), `notes/v5-tailoring.md` (the hem under tailoring), `notes/proportions.md`, `proportions-color-style.md`, `notes/leg-probe.md`, `notes/hem-probe.md`, `notes/fit-ruler.md` and the judge pilot (`notes/judge-pilot.md`).*

**How this was made.** I opened no new web pages. Every source below is cited from those notes, which already mark what was opened, what was a search snippet, and what the main session spot-checked. No gap needed new research: the open questions for this part are about readings, not about style advice. Every number here comes from saved readings run through a prototype on the Mac: the zoom1 / zoom1-stock arm B runs (the app's config, 3 runs each, 66 photos) and his phone's own readings for the Oct 9 checks. The prototype and its helper scripts are in the session scratchpad and aren't committed. No API calls, and no photos were opened or sent anywhere.

**Who is in the photos (rule 7).** The judge-pilot photos are the founder (profile pending: he hasn't given his birth year or picked looks), two friends (profile unknown), and web and stock photos (profile unknown). The part uses no profile: age and picked looks never change it. So no split by age band or picked look is possible yet. The AI readings were made under the old invented "Minimal + Smart casual" test profile, which doesn't affect any field used here.

## Bottom line

1. **The shape rules are well agreed. The readings they need are not.** The sources agree on one idea: contrast or a clean middle, never "long and loose everywhere". So the part checks length against length (top against leg, layer against what's under it, hem against shoe) and weight against weight (shoe against leg opening). It never compares a width with his body.
2. **I measured how trustworthy each field is today,** both run to run and against Claude's blind labels, using the coarse groupings the rules need (table in §1). Three fields can move points today:
   - **Tuck:** 97% the same on every run.
   - **"Short top, no layer":** when the AI says the top is tucked or ends at the belt, it's right 45 times out of 45. It misses about 3 in 10.
   - **"Narrow leg vs straight-or-fuller":** 94% the same run to run; "narrow" is right 94% of the time.

   The fields that can't move points yet:
   - **Top "below the crotch":** said on 2 of 192 runs, wrong both times.
   - **`shows_below_outer`:** none of the 5 labelled peeks found.
   - **Outer-layer length:** 63% the same run to run, and it reads short jackets as "na".
   - **Hem, 6 classes:** 68% the same. "Heavy" is right 88% of the time, but it finds only 45% of heavy hems.
3. **Design rule: points move only on readings that are right when they fire.** A miss leaves the part at 7, which costs some accuracy but never gives a wrong fault or a wrong reward. Faults that rest on the weak fields ship as tips until a new field passes the flip test.
4. **The part score:** start at 7 (the balanced middle). Add up to +2 for a deliberate shape; it's blocked when anything is off or the hem is heavy. Subtract each fault, with a floor of 2. With today's fields, 8.5 is the most a fit can get. 9 needs a hem reading we trust. 10 isn't reachable in v1.
5. **Against the 5-judge panel (one model, compressed; 54 photos):**
   - **Today's fields:** mean error 0.48, against 0.58 for "always 7". Correlation 0.47. The part is the same on all 3 runs for 48 of 50 photos.
   - **The part sits at 7 on 42 of 54 photos.** On his and his friends' photos it runs **+0.61 too high**: the faults the panel names there (bunched hems, a long shirt over wide jeans, a tee peeking out) are exactly what today's fields miss.
   - **With Claude's blind labels standing in for the proposed fields,** correlation rises to 0.55 and the friend's blazer photo lands on the panel's 5.0. That's an upper bound for what better fields could add, not a test result.
6. **Six reading changes, in two flip-test batches (§7):**
   - **Batch 1 (the length cues):** `hem_at` on every top and layer, a 3-way `under_shows`, `scene.pose`.
   - **Batch 2 (the lower close-up):** `hem` + `stacked`, `hem_on_shoe`, `shoe_profile`. `leg_opening` is a later candidate.
   - **Each must pass:** ≥90% the same over 3 runs and ≥85% right when it fires, and it mustn't make the old fields less steady (v5 and v5s failed on that, #63–64).

---

## 1. What the AI can be trusted with today

Measured on the zoom1 + zoom1-stock arm B readings (66 photos × 3 runs). "Same on 3 runs" counts photos where all three runs agree. "Right when it fires" and "found" compare every run with Claude's blind labels: `ruler_labels.csv` for length and peeks, `leg_labels.csv` and `hem_labels.csv`. All the labels were written before the probes ran, and they're one labeller's work, not ground truth.

| Reading, in the grouping the rules use | Same on 3 runs (all · his photos) | Right when it fires | Found (recall) | Verdict |
|---|---|---|---|---|
| Full tuck yes/no | 97% · 100% | Matches the labels' notes wherever they describe a tuck (a ratio isn't computable: the labels record the outermost layer) | — | **Use** |
| Top short (tucked / at the belt / cropped), **no layer** | 83% for the 3-way length (67% on his) | **45/45 (100%)** | 45/63 (71%) | **Use for rewards.** It misses his at-the-belt hoodies (calls them "mid fly", as the fit ruler found) |
| Top long (below the crotch, untucked) | 98% (it almost never says it) | 0/2 | 0/6 clear labels | **Can't use.** Needs `hem_at` |
| Top volume ≥4 | 100% | untested (rare: 7% of top reads) | — | Use only at the extreme |
| Outer volume ≥4 | 97% | untested | — | Use only at the extreme |
| Outer layer present | 100% | — | — | Use |
| Outer length, as it's read today | **63%** (50% on his) | Short jackets come back "na" (every denim jacket); his at-the-belt overshirt reads "mid fly" | — | **Can't use.** Make it official (`hem_at`) |
| Leg narrow (skinny/slim) vs straight-or-fuller | **94%** · 87% | narrow 94%, full 85% | narrow 72%, full 96% | **Use** (the leg probe: AI ~89–90% here too) |
| Leg skinny | — | 9/9 | 9/18 | Use (misses are safe) |
| Leg loose (relaxed/wide) vs not | wide yes/no 97% | 85% overall, 73% on his | — | Use only to block, or with a second cue |
| Leg shape, 5 classes | 80% · 67% | 40–53% on his photos (brief) | — | **Don't use** |
| Hem heavy (pooling/full break) vs light | 83% · 80% | heavy **88%** | heavy **45%** | Use only to **block** a reward |
| Hem, 6 classes | **68%** · 53% | 26–43% (brief) | — | **Don't use** |
| Pooling yes/no | 98% | untested (no clear pooling label) | — | Rare; leave to Fit |
| `shows_below_outer` | 93% · 67% | 0/2 | **0/5** labelled peeks | **Can't use.** Needs `under_shows` |
| Shoe bulky (chunky / runner / basketball) | 98% | untested; footwear type is 30–53% on his photos | — | Use: boots were the big misread and close-ups fixed it (#104) |
| Shoe sleek (dress shoe / loafer / derby) | 98% | untested | — | Don't use as "dainty": loafers aren't dainty (needs `shoe_profile`) |

**What this says.** Vertical cues (a tuck, a top ending at the belt) and coarse leg cues (narrow or not) hold up. Fine leg shape, fine hem, layer length and peeks don't. The leg and hem probes didn't change that (leg 54% vs the AI's 64%; hem heavy/light 65% vs 75%; `notes/leg-probe.md`, `notes/hem-probe.md`), so nothing from the phone joins this part in v1.

---

## 2. The checks

Each fault or reward below is one row. **Points** are the part points (out of 10, before the part is weighted into the final score); the gold set sets the final sizes. **Ships** says whether it moves points now ("**today**"), only after a new field passes the flip test ("**after flip**"), or only as a tip until the gold set sizes it ("**tip**").

### Rewards: a deliberate shape (only when no fault ≥1 fired and the hem doesn't read heavy)

| # | Rule in plain words | Evidence (from the notes) | Points | How it's measured | Reliable today? | Ships |
|---|---|---|---|---|---|---|
| R1 | **A waist break over a full leg:** a fully tucked top, or a short top (cropped / at the belt) worn alone over a straight, relaxed, wide or flared leg. Ribbed-hem tops (hoodie, sweatshirt, quarter-zip, fleece) count only when they're boxy (volume ≥4): they end at the belt by design, so it isn't a choice | Strong: 6 opened + 2 snippets, 0 against (Mr Porter 2025, GQ Apr 2025, GQ Jun 2023, Put This On 2018, H&M Fall 2026; Westwood Hart, A Well Styled Life snippets). `v5-silhouette` S2 | +1.0 | AI facts: `tucked`, top `length`, top `volume`, `subcategory`; leg not narrow | Yes: short-top precision 100% with no layer; tuck 97% steady; leg narrow/full 94% | **today** |
| R1b | **Half (front) tuck** over a full leg (not on ribbed tops) | Medium: the newest source endorses the front tuck (Menswear Online 2025, in `proportions-color-style.md`), and the waist-break principle carries it. The Oct 7 report kept it out of the credit; **I disagree**, because the fix engine already suggests a front tuck, and a fix that can't raise the part is a broken promise | +0.5 | `tucked` = half | tucked 97% steady; accuracy of half vs none untested | **today**, flagged for the gold set |
| R2 | **A short layer over a full leg:** a jacket ending at the waist or hip (bomber, trucker / denim jacket, cropped leather, or any layer read as cropped / at the belt) over a straight-or-fuller leg, with nothing clearly hanging below it | Strong: 4 for, 0 against (GQ Apr 2025, H&M 2026, Mr Porter 2025, Put This On 2018). `v5-silhouette` S2, family (c) | +1.0 | Today: the layer's **type** (bomber, denim jacket, leather jacket) as a stand-in, because their length reads "na". After the flip test: `hem_at` ≤ waistband/hip | Type: yes. Length: no (63%) | **today** by type; by length **after flip** |
| R3 | **A complete tailored line:** a tailored jacket, tucked top, pressed trousers (suit trousers, trousers or chinos), a leg that isn't skinny, and a light hem | Strong on each piece: the jacket covers the seat, no-to-one break, the shirt tucked under the jacket (5–6 sources each, `v5-tailoring` §1, §4, TJ1) | +0.5 | AI facts: jacket type, `tucked`, bottom type, leg ≠ skinny, hem not heavy | Yes, except that "not heavy" misses half of heavy hems, so it can over-reward a stacked suit trouser | **today** |
| R4 | **Shoe weight carries a wide leg:** chunky or basketball sneakers, or work boots, under a wide or barrel leg (not loungewear), with the hem not heavy | Medium: split 3–2 (for: GQ 2025, RMRS, Highsnobiety; against: Mr Porter 2025, H&M 2026). Already v4's K4 street trigger. `v5-silhouette` S5 | +0.5 | AI facts: shoe type, leg = wide/barrel | Shoe bulky 98% steady; "wide" 97% steady but 73% right on his photos | **today** (as v4). Don't widen it to minimal / smart casual / prep |
| R5 | **A clean, chosen hem:** cropped to the ankle or no-to-slight break on a straight leg, or stacked on purpose on a loose jean in a street outfit (no tailored jacket) | Medium: GQ Apr 2025 "Pick your break"; GQ Sep 2026 "gentle pooling, not bunching"; RMRS "one clean break". `v5-silhouette` S9 | +0.5 | Needs `stacked` + `hem_on_shoe` | **No** (hem 68% steady) | **after flip** |

**Reward cap: +2.0.** So 9 needs a waist break (or the tailored line) plus two of R3, R4 and R5. Since R5 waits for the hem field, **8.5 is the most a fit can get with today's fields.**

### Faults

| # | Rule in plain words | Evidence | Points | How it's measured | Reliable today? | Ships |
|---|---|---|---|---|---|---|
| F1 | **Heavy hem under a tailored jacket:** jeans or trousers that stack or pool under a blazer or suit jacket. Streetwear's "stacked is fine" doesn't apply once there's tailoring | Strong: 6 sources, 0 against for tailoring (Westwood Hart 2026, Nathan Tailors 2026, RMRS 2026 (spot-checked), NYT/Gallagher 2026 (spot-checked), FashionBeans 2025, Ape). `v5-tailoring` TJ1 | −2.0 | Jacket type (reliable) + hem heavy/stacked | **No:** the friend's photo reads "slight break". Heavy is right 88% of the time it fires, but it's only 83% steady and finds 45% | **after flip** (`stacked`, `hem_on_shoe`). Tip before then |
| F2 | **A long top over the leg:** an untucked top reaching the crotch or lower, worn alone (no layer) | Strong: v4 F6 for everyone; rule of thirds (4 sources); "long and drapey" off over wide (Mr Porter, GQ) | −1.5, or −2.0 over a loose leg | `hem_at` ≥ crotch on the top | **No** (today's `below_crotch` fired on 2 of 192 runs, both wrong) | **after flip** |
| F3 | **A long loose layer over a loose leg:** an untucked overshirt, chore coat or coat reaching the crotch or lower, over a relaxed or wide leg. Tailored jackets are exempt, because covering the seat is their correct length | Strong: GQ Apr 2025 "stumpifying" (opened); Mr Porter 2025; H&M 2026; FashionBeans 2025. **Dissent:** the city-boy long coat over wide trousers, and RULEBOOK's 9.0 tonal anchor | −1.5 (council: halve it when the outfit reads minimal?) | `hem_at` ≥ crotch on the layer + leg loose | **No** (outer length 63%) | **after flip** |
| F4 | **A shirt that runs long over wide legs:** an untucked woven shirt (oxford, flannel, gingham, camp collar) that covers the waistband and reaches the hip or lower, not boxy, over a wide or barrel leg. Hoodies, sweatshirts and boxy tees are exempt: that's the defining street shape | Medium, by inference from "big pants, little shirt" (GQ 2025 "keep it tidy up top", Mr Porter 2025, H&M 2026: "If the pants are wide, the top half must be close"); RMRS dissents. **My rule, not a named source rule** | −1.0 | Shirt type (reliable), `hem_at` = hip or lower, volume ≤3, leg wide | Partly. The founder's gingham reads "mid fly", which would fire | **tip** until the gold set |
| F5 | **A big top over skinny legs:** a top or layer at volume ≥4 over a skinny leg | Strong: v4 P2; GQ Sep 2026; RMRS overshirt 2026; tailoring TF2 (Westwood Hart 2026) | −1.5 | volume ≥4 + leg = skinny | Yes (100% steady; skinny 9/9 when it fires) | **today** |
| F6 | **Any layer over skinny legs:** a layer needs "something sturdy to sit on" | Medium, and a trend (2025–28): GQ Sep 2026 (opened), RMRS. The panel docked skinny trousers under jackets in 4 of 4 cases | −0.5 | layer present + skinny | Yes | **today**, marked as a trend rule to review in 2028 |
| F7 | **A chunky shoe under a narrow leg** | Strong: Highsnobiety ~2023, RMRS, Put This On 2018. v4 S1 | −1.0 | shoe bulky + leg narrow | Yes (98% and 94% steady; narrow right 94%) | **today** |
| F8 | **Loose jeans dragging on slides:** relaxed or wide jeans or cargos (not sweats) whose hem rests on a slide | v4 `F4_hem_drags_over_slides`; GQ Sep 2026 "something sturdy to sit on" | −1.0 | slides + loose leg + any break (I also count "slight break", because the AI calls his full breaks "slight") | Slides are clear in the close-ups; loose 85% right | **today** |
| F9 | **A dainty shoe under a wide leg:** a thin-soled minimal sneaker, a narrow runner, or a skinny-soled or pointy dress shoe under a wide or barrel leg. Low-profile retro sneakers and loafers are fine. Flares are exempt (the hem covers the shoe by design) | Strong: GQ Apr 2025, RMRS Jun 2026, Opumo (snippet); not contradicted by Mr Porter or H&M. `v5-silhouette` S3 | −1.0 | Needs `shoe_profile` = sleek | **No field** | **after flip** |
| F10 | **The top under a layer clearly hangs below it.** Under a hip-length layer (overshirt, chore coat, field jacket, shirt-jacket); under a tailored jacket it's heavier. Never under a cropped bomber or trucker | Medium: Charles Tyrwhitt, RMRS Oct 2026, Put This On 2013/2018; dissent: a small peek is fine (Menswear Online, Modest Man). Tailored: strong (L1) | −1.0 (hip layer), −1.5 (tailored). A little peek: tip only | 3-way `under_shows` = clearly | **No** (0 of 5 peeks found) | **after flip** |
| F11 | **A tee clearly hanging below a hoodie or sweater** (top under top) | Same sources as F10, weaker (casual knits). The panel named it on 3 of his photos and on P041 | tip; −0.5 after the gold set | `under_shows` on the top | **No field** | **tip** |

**How faults add up:** each fault costs its points; the part stops at 2. One fault of 1.0 or more also blocks every reward.

### Checks deliberately left out

| Check | Why it's out |
|---|---|
| Slim vs straight under a chore coat or overshirt (S7, the founder's case) | No 2023+ source calls slim a mistake (0 of 9). It rests on the AI's weakest call (slim vs straight 75–77%), and the leg probe's better result stands on 4 straight-leg photos. The shape just doesn't earn R2. Re-test on the gold set with `leg_opening` |
| A heavy hem on loose jeans with no tailoring or slides | Sources split (GQ allows gentle pooling, RMRS doesn't) and the field misses half of heavy hems. It only blocks the reward. The panel disagrees (it docked his wide jeans for running long): log it for the gold set |
| Single-piece volume against a style band (v4 P1) | Volume on its own is Fit's call (too big vs oversized on purpose, #164). The relations that matter are F3–F5 |
| Open vs closed layer, a matching loose set | Neutral in every source (open/closed), or weak (a set: H&M only) |
| Shorts length | No field; the fit ruler had 3 shorts photos. The part is NA for shorts in v1 (§4) |
| Rise, inseam, anything about his height or build | Not readable, or against the body rule |

---

## 3. The part score

```
part = 7.0
faults  = sum of fired faults (rows marked "today", or "after flip" once passed)
rewards = R1 or R1b or R2 (one waist break, the biggest), + R3, + R4, + R5 (once passed); capped at +2.0
if faults >= 1.0 or hem reads heavy: rewards = 0       # a deliberate shape needs a clean finish
part = clamp(7.0 + rewards − faults, 2, 10), rounded to the nearest half (x.25 rounds up)
a check fires only when the garments it reads are certainty "clear" or "likely"; "unsure" skips the check
```

**Anchors:**

| Part | What it looks like | Example |
|---|---|---|
| **10** | Not given by v1. It would need a proven "exaggerated on purpose" signal: a cropped sculpted jacket over long flares (P010, panel 9.0; the AI reads the jacket as "other", length "na") | — |
| **9** | A waist break **plus** two of: a complete tailored line, shoe weight matched to a wide leg, a clean chosen hem. **Needs the hem field.** | A boxy cropped tee over wide jeans stacked on purpose over chunky sneakers; a tucked knit, wide pleated trousers, one clean break, substantial loafers |
| **8–8.5** | One deliberate shape, nothing off | Tucked shirt over flares (P001); a denim jacket over straight jeans (P044); a tee tucked into wide trousers |
| **7** | The balanced middle: a regular top at mid-fly over straight or relaxed legs, a light hem. Also anything the readings can't judge | Most of the 59 pilot photos (42 of 54 in the prototype) |
| **6** | One smaller fault: a chunky shoe under slim jeans, loose jeans dragging on slides, a tee clearly below an overshirt | Dad sneakers under slim jeans; his wide jeans on slides (P004, P016) |
| **5–5.5** | One clear major fault: a heavy stack under a blazer, a long loose top over wide legs, a boxy layer over skinny legs | The friend's blazer over bunched jeans (P015, with the hem field) |
| **2–4** | The shape fights itself in several places | A long loose overshirt over wide jeans dragging on slides (−1.5 −1 = 4.5), plus a tee clearly hanging below it (−1 = 3.5) |

**Weight in the final score:** keep the pilot's 25% for now. A 7 here never pulls a good fit down much, and because rewards are hard to earn, an honest 8 in this part means something.

### Three worked examples from the judge pilot

| Photo | What it is (from the panel's reasons) | Today's readings (3 runs unless noted) | Formula today | With the proposed fields | Panel |
|---|---|---|---|---|---|
| **P015** · friend (profile unknown) | Navy blazer, plain tee, light-wash baggy jeans bunching on suede chukkas | Suit jacket below the crotch; tee fully tucked; jeans relaxed, **slight break** (1 phone reading) | **7.0**: no fault fires (the stack reads as a slight break); no reward (no waist-break rule for tailored jeans) | **5.0**: F1, heavy hem under a tailored jacket, −2 (Claude's label: stacked or full break) | **5.0** |
| **P057** · the founder (profile pending) | Gingham shirt untucked over wide black jeans, work boots | Flannel/oxford shirt, mid fly, untucked, volume 3; jeans wide, slight break; work boots on 2 of 3 runs | **7.5** (7.0 on one run): R4, boots carry the wide leg, +0.5 | **6.0** if F4 (a shirt that runs long over wide legs, −1) is adopted; that also blocks R4. Labels alone give 7.0: the label says "full break", which blocks R4 | **5.5** |
| **P001** · stock (profile unknown) | A belted knit vest over a tucked shirt, flared houndstooth trousers, mismatched statement shoes | Dress shirt fully tucked; trousers flared, slight break; dress shoes (the vest isn't read: there's no vest type) | **8.0**: R1, a waist break over a full leg | 8.0 (8.5 if R5 confirms the clean break) | **8.5** |

**Two misses worth knowing:**
- **P041** (a green sweat at the belt over cropped raw-hem jeans, panel 7.5) gets 7.0. A ribbed sweatshirt at volume 3 doesn't count as a waist break, on purpose: counting it put his hoodie-over-sweats checks at 8 (P024, P046, P056) where the panel gave 6–6.5.
- **P010** (panel 9.0) gets 7.0, because no field reads a cropped sculpted jacket.

---

## 4. When the part is NA

The part drops out of the average when:
- **no bottoms are visible**, or the framing is upper body only;
- **the bottoms are shorts** (no shorts-length field yet; in v1, shorts outfits get no proportions part rather than a fake 7);
- **he's seated** (the proposed `scene.pose`; the panel flagged seated photos as unreadable, P003 and P023);
- **the outfit is traditional clothing** (the whole check is "not rated").

**Partly visible:**
- **Shoes cut off:** the part still counts, but the shoe checks (R4, F7–F9) and the hem checks (R5, F1, F8) are skipped. Missing shoes never cost points or block a reward.
- **Legs cut off above the hem:** the hem checks are skipped.
- **A check whose garment reads "unsure":** that check is skipped. If every check is skipped this way, the part is NA rather than a default 7.

---

## 5. Which v4 rules move here, and which go away

| v4 rule | Where it goes in the parts scheme |
|---|---|
| `F6_top_too_long` (fit bucket today) | **Moves here as F2**, on the new `hem_at` field. Length against the leg is proportion, not size |
| `L1_shirt_hangs_below_blazer` (fit bucket today) | **Moves here as F10** (tailored, −1.5), widened to hip-length layers on the 3-way `under_shows` |
| `P2_big_top_skinny_leg` | **Moves here as F5**, extended to the outer layer's volume (TF2) |
| `S1_bulky_shoe_narrow_leg` | **Moves here as F7** |
| `F4_hem_drags_over_slides` | **Moves here as F8** (and counts a slight break too, see the row) |
| `P3_everything_oversized` | **Goes away.** It fires only when the top reads volume ≥4 (under 7% of reads) and ignores the layer. Replaced by the length-based F2 and F3, which is what the sources describe |
| `P1_top_volume_vs_style` | **Goes away here.** One piece's volume belongs to Fit (#164: too big vs oversized on purpose). The style bands live on only in Fit, if it wants them |
| `P1_leg_vs_style` and the v4.1 `leg_excused` | **Goes away.** v4.1 already excuses jeans and cargos; a wide trouser under a close top is endorsed (S6, TS2). What's left is the long-top-over-wide case, covered by F2–F4 |
| `K4_shoes_complement`, street trigger (chunky under loose jeans) | **Moves here as R4** (shoe weight against the leg). The dressiness half of K4 goes to the Shoes part |
| `K1_layered` | **No layer credit here.** A layer earns proportion points only by its length (R2) and loses them by it (F3, F10). Whether a layer "earns" anything else is Cohesion's call |
| `F4_pooling` (chinos/trousers −0.8, loose jeans −0.4), `F4b_full_break_narrow_leg` | **Stay in Fit** ("the pants are too long"), matching the pilot brief's Fit anchor. Here a heavy hem only blocks rewards, and under tailoring it's F1. **One fact, one charge:** when Fit charges pooling, F1 isn't charged again for the same hem; the bigger one wins |
| The `thirds` tip (front tuck when the top ends mid-fly) | **Stays as this part's tip,** and is fixed: never suggest tucking a hoodie, sweatshirt or fleece (the #150 bug) |
| `T1_dress_shirt_untucked` | Stays with Occasion/Cohesion (a dress-code rule, not a shape rule) |

**Where I disagree with earlier notes:**
1. **`proportions-color-style.md` said don't add `outer_length`** (rare; "NA-detection F1 22%"). That was wrong on frequency: 46% of saved reads have a layer (`v5-silhouette` §4, 326 of 714), and the model already fills the length on about half of them without being asked. The layer rules (R2, F3, F10) can't work without it.
2. **The half tuck:** credit it at half (R1b), as argued above.
3. **RULEBOOK ruling 13 (stacked loose jeans cost 0):** keep it, except under a tailored jacket (F1), as `v5-tailoring` argued.

---

## 6. What the user sees

The part line on the card names the garments, never his body. Positions are given against the clothes (the waistband, the pockets, the shoe).

| Part | Card line | Fixes offered (with the part they'd reach) |
|---|---|---|
| 8 | "Proportions 8: a short top over full jeans gives it a clear shape." | Next level (tip): "Jeans that just touch the shoe would sharpen it." |
| 7 | "Proportions 7: a balanced, classic shape." | Tip: "A front tuck, or a jacket that ends at the hip, would give it more shape." (Not offered for hoodies) |
| 6 | "Proportions 6: chunky sneakers look heavy under slim jeans." | "Swap to low-profile sneakers" (→ 7); "Straight-leg jeans would carry them" (→ 7) |
| 6 | "Proportions 6: the jeans drag on your slides." | "Cuff the jeans once" (→ 7); "Chunky sneakers or boots give the hem something to sit on" (→ 7.5) |
| 5 | "Proportions 5: the jeans bunch on the shoes under the blazer." | "Hem or cuff the jeans so they just touch the shoe" (→ 7); "Dark straight jeans would match the jacket" (→ 7) |
| 5.5 | "Proportions 5.5: a big top over skinny jeans." | "Straight-leg jeans" (→ 7); "A closer-fitting top" (→ 7) |
| After flip | "Proportions 5.5: the shirt hangs past the pockets over wide jeans." | "Front-tuck it" (→ 7.5); "Wear it open over a tee" (→ 7); "A shorter, boxier shirt" (→ 8) |
| After flip | "Proportions 6: the tee hangs below the overshirt." | "A shorter tee, or tuck it" (→ 7–8) |
| NA | "Proportions not scored: your legs aren't in the photo." / "…you're sitting down." | — |

Each fix's "→" number comes from re-running the part with the changed fact, as the fix engine already does for scores. Fix detection on real re-checks is still unproven (67–83%, CLAUDE.md), so the card should promise "should raise it", never a number, until fix pairs are tested.

---

## 7. New and changed reading fields, and how to test them

### The fields (exact proposals)

| Field | Values | Prompt line (draft) | Feeds | Why this cue |
|---|---|---|---|---|
| **`hem_at`** on every top **and every outerwear**, replacing `length` (old values map across) | `tucked` · `cropped` (above the waistband) · `waistband` (ends on the belt or waistband) · `hip` (covers the waistband, ends above the bottom of the fly) · `crotch` (reaches the bottom of the fly or past it) · `thigh` · `knee_or_lower` | "For every top and every jacket or coat, even when worn open: where the front hem ends against the pants (the waistband, the bottom of the fly). A hoodie or sweatshirt whose ribbed hem sits on the waistband is `waistband`. If the two sides differ (an arm lifts one), use the lower side." | R1, R2, F2, F3, F4 | A 15–20 cm difference, judged against garment landmarks. Today's prompt says "untucked tops only", so layers get "na"; and the "mid_fly" wording pulls his at-the-belt hoodies to mid-fly |
| **`under_shows`** on every top and outerwear, replacing the boolean `shows_below_outer` | `no` · `a_little` (a sliver at the hem) · `clearly` (a band of the piece underneath hangs below) | "Does the piece worn under this one show below its hem?" | F10, F11 | Today's boolean found 0 of 5 peeks; the 3-way split matches the sources (a small peek is fine) |
| **`scene.pose`** | `standing` · `seated` · `moving` | "How the person is posed." | NA | Seated legs are foreshortened; both seated pilot photos were flagged "unsure" |
| **`hem`** + `stacked` (Oct 7 plan), and pooling tightened | add `stacked` = "soft folds piled above the shoe, the hem not on the ground"; `pooling` = "fabric drags on the ground over or behind the shoe" | (two lines) | F1, R5, F8 | The model has nowhere to put a deliberate stack, so it says slight or full break |
| **`hem_on_shoe`** on bottoms | `clear` (the ankle or sock shows) · `touches` · `covers_laces` · `covers_most` (only the toe shows) · `not_visible` | "In the lower close-up: how much of the shoe the pants cover." | F1, R5, F8 | The AI version of the hem probe's one promising cue (the hem position), measured against the shoe, not the body. Coarser than `hem` |
| **`shoe_profile`** (Oct 7 plan) | `sleek` · `regular` · `chunky` · `not_visible`; Samba-type sneakers and loafers are `regular` | (as in `proportions-color-style.md`) | F9, R4 | Sole thickness and toe shape in the lower close-up |
| *Later:* **`leg_opening`** | `narrower_than_shoe` · `about_shoe` · `wider_than_shoe` · `not_visible` | — | the S7 question | The leg probe's clearest single measure (opening ÷ shoe, cut ≈0.93), but loafers vs slides change it. Only after the gold set |

### The flip test (no new photos)

**Photos:** the 75 photos the leg and hem probes used. They already have blind labels for leg, hem and top length, and they cover his 20 phone checks, the 4 Oct 7 photos, 12 web mirror selfies and 39 stock photos. Add blind labels for `hem_at` (top and layer separately), `under_shows`, `pose` and `hem_on_shoe`, written **before** the run.

**Two batches,** so one bad field doesn't sink the rest:
- **Batch 1:** `hem_at`, `under_shows`, `pose`.
- **Batch 2:** `stacked`, `hem_on_shoe`, `shoe_profile`.

Each batch is v3 + those fields, gemini-3.8-flash, thinking off, close-ups on (the app's arm B), 3 runs.

**Cost:** about 75 × 3 × 0.57¢ ≈ $1.30 per batch, with billing on. That's spending, so it needs the founder's OK.

**Pass bars, per field, in the grouping the rules use:**
1. The same answer on all 3 runs for **≥90%** of photos.
2. **≥85% right when it fires**, for each value that moves points (for example, `hem_at` ≥ crotch, `under_shows` = clearly, `stacked`, `sleek`).
3. The old fields stay as steady as before: no field drops more than 5 points in 3-run agreement, and score consistency holds at ≥64/66, the zoom1 bar. **v5 and v5s failed exactly here (#63–64).**
4. No more than +0.5 s of median latency.

**Known limit:** the rare values (5 peeks, 1 clear stack, 0 clear pooling, 6 long tops) are too few to prove 85% on these photos. They pass "steady" here and "right" only on the gold set. Until then, those rules stay tips.

### Paper tests on saved readings (no new photos, no API)
1. **Port the prototype** next to `rubric.py` as a parts function and run it on every saved reading (zoom1, zoom1-stock, the phone pulls). Report:
   - **the spread:** today 126 of 198 runs at 7, 23 at 7.5, 16 at 8, 18 at 5.5–6.5, 15 NA;
   - **3-run steadiness:** today 48 of 50 photos, bar ≥90%;
   - **the error against the panel:** 0.48, against 0.58 for "always 7".
2. **The label ceiling:** swap Claude's blind labels in for the proposed fields. Today that gives correlation 0.55 and the right 5.0 on P015. This is the most a perfect field could add on these photos.
3. **Fix pairs on paper:** edit one fact in a reading (tucked, swapped shoes, a shorter layer) and check each fix line raises the part as the card says.
4. **The v4 cross-check:** run the 7,233 parity cases. List the outfits where the proportions part and v4's proportion subscore disagree by a point or more, and read 20 of them by hand.

### On the gold set (#191)
- **Shoot pairs for this part** (from his own one-outfit variants and the friend shoots):
  - the same tee untucked, front-tucked and fully tucked over wide jeans;
  - an overshirt vs a short jacket over the same wide jeans;
  - the friend's blazer outfit with the jeans stacked vs cuffed to a clean break;
  - chunky vs low-profile sneakers under slim jeans and under wide jeans;
  - a tee peeking a little vs clearly below an overshirt;
  - a long coat vs a short jacket over wide trousers (the city-boy dissent);
  - one seated shot (NA);
  - one dark-on-dark outfit.

  For each person, record their birth year (age band) and their 3 picked looks in order (rule 7).
- **Measure:**
  - pairwise agreement between the part and the raters' choice on these pairs (bar ≥75%);
  - rank correlation with the raters' proportion ratings;
  - fault sizes fit to the pairs;
  - whether F3's long-coat dissent holds;
  - whether F4 and the tips in F11 should carry points.
- **Report:** split by age band and by picked look. Age and picked looks still change nothing (v4 rule), unless raters clearly judge by them, and then it's the founder's call.
- **Re-run the leg probe and hem probe** there (the slim/straight cut, the hem position) as shadow logs, as their notes say.

---

## 8. Risks

1. **The part mostly says 7.** Today it's exactly 7 on 42 of 54 pilot photos, so it can't yet tell his everyday fits apart. That's the honest result of only firing on trusted readings. The averaging stays fair (a 7 is the middle), but most of the gap between the app and the panel on his photos (+0.61 here) stays until batch 1 and 2 pass.
2. **False waist breaks in mirror selfies.** A raised phone arm lifts one side of the top, so it reads shorter. `hem_at` asks for the lower side; until then, R1 can over-reward a mirror shot.
3. **The ribbed-top exclusion is a judgment call.** It stops false 8s on hoodies over sweats, but it misses real boxy-sweat shapes (P041). Revisit on the gold set.
4. **Heavy hems are half invisible.** Black denim shows no folds (hem probe: L\* 2–8), and dark on dark has no edge. So F1 and R5 will under-fire on exactly his kind of jeans, even after `stacked`. `hem_on_shoe` is the hedge.
5. **Some rules follow trends.** F6 (layers over skinny legs) and R4 (chunky shoes carrying wide legs) are 2025–28 rules (GQ Feb 2026 sees slimmer legs coming back). Review them each year.
6. **What the AI can't see:** the rise (where the waist sits), the back of the leg (the friend's stack was on the back leg), how fabric drapes, and anything compared with his body, which is excluded on purpose (#164).
7. **The panel is one model, and compressed** (judge pilot). The prototype was checked against it, not tuned to fit it. Don't fit the part to the panel any further, because it docks loungewear and slides under "proportions" when those belong to Cohesion and Shoes.
8. **Overlap with other parts.** The hem, shoe weight and layers touch Fit, Shoes and Cohesion. The boundary proposed in §5 needs those parts' authors to agree, so that no single fact is charged twice.

**Privacy:** nothing here needs a face, body measure or skin value. Every check reads garments against garments. I opened no photos for this work, and no profile data was used.
