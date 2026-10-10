# Part: Condition and finishing

*Parts research, Oct 10, 2026 (brief: `parts/BRIEF.md`, DECISIONS-LOG #195). Claude. Builds on v4's F7 care rule and ruling 46 (`extraction-test/rubric.py`, `style-council/RULEBOOK.md` Part 3), the `condition` field (`extraction-test/schema.json`, `prompt.txt`), the close-up test (`extraction-test/results/zoom1/`, #104–105) and the judge pilot (`inputs/judge-pilot/judge-*.csv`, `manifest.json`). Counts below come from a scratch script (not committed) that joins each pilot photo to its saved readings: 3 runs each for stock and mirror photos (`test3-stock-40-v3`, `test4-mirror-12-v3`), the app's own reading for each phone check (`screenshots/phone/*/SQLite/kitted.db`). Profiles (rule 7): his photos are the founder's (profile pending), his friends' and every stock photo are "profile unknown"; nobody's profile was used, and none of this part's checks depend on one.*

## The headline: the AI's `condition` field almost never sees what the judges see

**What the five judges named** (counting a fault only when 2+ of the 5 named it on the same photo, from their reasons):

| Fault | Photos | Whose | What the AI's reading said on those photos |
|---|---|---|---|
| Faded (mostly black jeans gone grey) | 11 | 10 his or his friends', 1 web mirror | `clean` on all 11. On 3 (P015, P027, P049) it set `distressed_by_design` on the jeans, which v4 treats as **excusing** wear |
| Wrinkled or rumpled (overshirts, chinos, a cream shirt) | 5 | 4 stock/web, 1 his | Caught 1 (P020 overshirt `wrinkled`) |
| Stains, marks, dust, dirty shoes | 4 | 3 stock, 1 his | Caught 1 (P041 Vans `pilled_or_worn`, 3 of 3 runs) |
| Lint | 4 | all his (black tee and black jeans) | `clean` on all 4 |
| Scuffed or worn | 2 | stock, web | `clean`; on P058 the scuffed runners were `distressed_by_design` (excused) |
| **Any of these** | **19 photos** | | **A matching fault on 2 of 19.** On 4 more the faulted piece was flagged "distressed by design", which cancels the wear charge |

**Long sleeves are not the gap.** Judges named sleeves running long on P005 and P054 (and P057 by 1–2 judges). The AI read `covers_hand` on P005 and P057 (P054 has no saved reading). That's the fit part's F9 and it works.

**Tucks and cuffs in the reasons are mostly proportion fixes,** not finishing faults: 42 tuck mentions on 13 photos are almost all "tuck or front-tuck the long shirt" (F6, proportions), and 24 cuff/roll mentions on 15 photos are mostly "cuff or hem the jeans" (the hem rules). The only true finishing faults were cuffs left open and flapping (P005, P054) and a tee hem peeking under a sweatshirt (P024, P040, P041).

**Base rate:** over all saved readings, the AI marks a garment anything but `clean` on 8 of 457 stock garment reads (1.8%) and 1 of 137 mirror reads. With close-ups (zoom arm B, the app's setting since #108) it rises to 20 of 298 (6.7%) on his and the mirror photos: it then reads P005's and P020's overshirts as wrinkled in 3 of 3 runs, and P002's boots as worn in 3 of 3 (no judge named the boots). Run to run, the condition value changes on 4 of 87 garment slots with close-ups. So the field is **stable, but blind**: it says "clean" consistently.

**The panel can't calibrate this part either.** Where the code sees nothing (condition "clean"), the panel's condition median still ranges 5.5–8.5 (mean 6.9, 49% at 6.5 or below), and the panel's condition score correlates 0.85 with its fit score: partly halo, partly the real faults the AI misses. The code's condition score vs the panel's: correlation 0.05 on 57 photos.

---

## 1. The checks

| # | Check (plain words) | Evidence | How much it matters | How it's measured | Reliable today? | Needs |
|---|---|---|---|---|---|---|
| C1 | **Stain** on any piece (the AI sure): −1.2 | v4 F7 and the council (Part 3: stains cost the same in every style); "Nothing kills a look more than scuffs, smudges, wrinkles, and stains" (The Manual, black jeans guide, search summary; page wouldn't open) | Large: the one care fault everyone reads as careless | AI fact: `condition = stained`, `certainty = clear` | Caught 1 of 4 judge-named dirt/stain photos; never read on a saved stock photo as `stained` | A prompt line separating dust/dirt on shoes from stains on clothes |
| C2 | **Worn:** pilling, stretched neckline, scuffed or dirty shoes: −0.4 (worn work boots −0.2) | v4 F7, rulings 12, 45, 46; "pilling can make clothes look worn, even if they're relatively new" (search summary of a Steam-One care blog); Reader's Digest AU (Priscila Martinez, undated, opened): pilled sweaters and frayed edges read as messy, "even purposefully frayed edges need to be maintained" | Medium | AI fact: `condition = pilled_or_worn`; `distressed_by_design` excuses wear only (ruling 45) | 1 of 2 dirty-shoe photos caught (P041); P058's scuffed runners excused as "by design" | **Narrow `distressed_by_design` for shoes:** scuffs and dirt on sneakers are never "by design" (the council already limits the wear discount to work boots, ruling 12) |
| C3 | **Wrinkled** smooth fabric: −0.4; linen-likely pieces (drawstring trousers, camp-collar shirts) −0.2 | v4 F7; RMRS and other care guides (search summaries); linen creases are accepted in casual wear (weak blogs, search summaries: "the natural crease is the point"). Wrinkles are the most misread care value (ruling 46), so a wrinkled piece still earns its other credits | Medium | AI fact: `condition = wrinkled`, better with the upper close-up | Caught 1 of 5 in the pilot readings; with close-ups 2 of 2 of his overshirts (P005, P020), 3 of 3 runs. Stock studio overshirts (P003, P009, P012) read clean every run | A prompt line: "quilting, cord wales, canvas texture and whiskers are texture, not wrinkles" (already planned, RULEBOOK Part 6 D) |
| C4 | **Faded dark piece** (new): a black, charcoal or navy solid piece that has gone grey or patchy, when it isn't a designed wash: tip now, −0.4 only if the gold set agrees | The panel's most common condition reason (16 mentions, 11 photos, 10 of them his or his friends'). Levi's: machine washing is the quickest way to fade black jeans (care page, search summary). **Dissent:** fades are positive in workwear, skate and vintage (`style_archetypes.md` §Q2, Q5 #4), and "washed black" is a deliberate product. The panel docked washed black jeans even in a chore-coat outfit (P027, P049), which looks like one model's taste | **Contested.** It could be the biggest gap for his own photos, or a judge quirk | **Phone script (new):** compare the measured lightness of the dark piece with another piece the AI calls the same color in the same photo (e.g. a black tee over "black" jeans). Garment against garment, so the room's light cancels. The measure already exists per piece (`KittedMeasure.swift`: 3 Lab clusters per piece, #104–107). Also the spread between its clusters (patchy fading). Never on blue denim (fades there are design) | **Untested.** His hoodie measured the same lightness in 3 photos (#104), a good sign for repeatability. The AI's `denim_wear: faded` (planned, Part 6) is defined as *intentional* fading, so it can't do this job | A Mac-harness probe on his 11 faded-jeans photos plus his non-faded ones (labels first, blind) |
| C5 | **Lint** on dark fabric (new): tip only | 13 judge mentions, 4 photos, all his black pieces; Reader's Digest AU on lint from towels (opened) | Small; a lint roller fixes it | **Phone script (new, speculative):** small bright specks inside a dark piece's mask in the face-hidden 2048 px detail copy (#83). `lapVar` (sharpness per piece) exists but can't tell lint from twill or heather | **Untested,** probably weak (specks are a few pixels; texture fools it) | A probe; tip only even if it works |
| C6 | **Shirt untucked under tailoring** (today's T1): −0.6 when a dress shirt hangs untucked under a blazer or with trousers, or at a dressy occasion | v4 T1; tailoring sources in `notes/v5-tailoring.md` | Medium at dressy occasions | AI fact: `subcategory = dress_shirt`, `tucked = none` (exists) | Tuck: untested against truth; dress shirt vs oxford: fair | Nothing |
| C7 | **Open, flapping cuffs** on a long-sleeved shirt (new): tip only ("Button or roll the cuffs") | P005, P054 (4–5 judges each); sleeve-rolling guides (Art of Manliness, RMRS, Black Lapel: search summaries) | Small | Would need a new value (`cuffs: buttoned / rolled / open`) | **Untested;** a few pixels at 1024, likely only in the upper close-up | Flip test before even a tip |
| — | **Never judged here:** the fit of a sleeve (fit part, F9), the length of a shirt or the tuck as a shape (proportions, F6 and the rule-of-thirds tip), the hem (proportions), a tee peeking below a layer (proportions/fit, L1 and the planned L4), accessories (cohesion, H6) | | | | | |

---

## 2. The part score

### Why condition can't be a plain 5% part
The pilot weights give condition 5% of the average. A stain at condition 3 against a clean 7.5 would move the total by 0.05 × 4.5 = **0.2**. v4 charges a clear stain 1.2, and nobody would call a stained hoodie a 0.2-point problem. And the code can't tell "clean" (7) from "crisp" (8.5): the AI only reports faults. So the part can only ever pull down, and at 5% it would barely do that.

**Recommendation: condition is a fault part, applied after the average.**
- **Total = weighted average of the other parts − the condition deduction**, rounded to the half. The deduction is v4's own scale (F7 × 0.8): wrinkled −0.4, worn −0.4 (work boots −0.2), stain −1.2, linen-likely wrinkles −0.2, untucked dress shirt under tailoring −0.6 (C6), capped at −1.6 for C1–C3 together. A clean outfit loses nothing.
- **The card still shows it as a part**, so the beginner sees it next to the others: part = 7.0 − 2.5 × deduction for C1–C3, rounded to the half, floor 2 (wrinkled 6.0, stain 4.0, stain + wrinkle 3.0). When nothing is seen it reads "Condition: clean", with no number, because the code can't certify crisp.
- **It never adds points.** Finishing touches the AI can read today (a half tuck, a cuffed hem) are shapes, so they belong to proportions (the planned waist-break idea), and their readings are unreliable anyway (hem 26–43%).
- The v4 rules that depend on care stay: a stained or worn piece earns no credit in any other part (ruling 46), and the 5.0 floor doesn't apply when a care fault fired.

### Anchors
| Part | What it looks like | What the code can see today |
|---|---|---|
| 9–10 | Crisp; every detail done right | Can't be certified; shows "clean" |
| 7 ("clean") | Clean, nothing to note | `condition = clean` on every piece |
| 6 | One wrinkled or worn piece; dirty sneakers | `wrinkled` or `pilled_or_worn` on one piece |
| 5 | Two such faults, or an untucked dress shirt under a blazer plus one | Two faults |
| 3–4 | A clear stain, or stain plus another fault | `stained` (clear) |
| 2 | Stained and worn throughout | Cap reached |

### Three worked examples (pilot photos)
| Photo | AI reading | Code: part / effect on the total | Panel condition (median of 5) | Verdict |
|---|---|---|---|---|
| **P020** (his phone check: open striped shirt over a grey sweatshirt, wide black jeans) | overshirt `wrinkled` (clear); jeans `clean` | **6.0 / −0.4** | **6.0** ("press the shirt"; 3 judges also say the jeans are faded) | Agree. The fading isn't seen |
| **P041** (stock s04: green sweatshirt, raw-hem jeans, canvas Vans) | Vans `pilled_or_worn` (3 of 3 runs); jeans `distressed_by_design` | **6.0 / −0.4** | **6.5** ("dirty canvas Vans let it down") | Agree on the fault; the code is 0.5 harsher |
| **P042** (his phone check: teal crewneck, wide black jeans, white sneakers) | every piece `clean` | **clean / 0** | **6.5** (all 5 judges: lint; 2: faded jeans) | **Miss.** This is the gap C4 and C5 are for, and the reason they need a phone measure: the AI read this photo clean |

Across the 57 photos with a reading, the code flags 4 (P020, P032, P041, P056) and leaves 53 clean. Of those 4, the panel agrees on P020 and P041; P032 (chinos `wrinkled` in 2 of 3 runs) got 7.5 from the panel with one judge noting "a bit creased"; P056 (chunky sneakers `pilled_or_worn` in 2 of 3 runs) got 7.0 with no shoe-wear reason. So 2 of 4 flags match the panel, and 2 of 4 also flip between runs.

---

## 3. When the part is NA
- **Dim lighting** (`scene.lighting = dim`): "Condition: couldn't check in this light." Faults go unseen in the dark (his dark-on-dark photos are where lint and fading live), and a "clean" in the dark shouldn't read as a pass. No points either way.
- **No garment scored** (nothing readable, not fully clothed, traditional clothing).
- Pieces outside the photo are never checked; a partial photo checks what it shows.
- Otherwise it's never NA, but a clean outfit has no effect on the total (it's a fault part).

## 4. Which v4 rules move here, and which go away
| v4 rule | Fate |
|---|---|
| F7 care (stained −1.2, wrinkled −0.4, worn −0.4, work boots −0.2, cap −1.6, distressed excuses wear only) | **Moves here unchanged,** as C1–C3, plus the linen-likely half price for wrinkles |
| Ruling 46 (a stained or worn piece earns no credit) | Stays, applied by every other part |
| The 5.0 floor's care exception | Stays |
| T1 dress shirt untucked (tagged occasion) | **Moves here as C6** (it's finishing: "tuck done right"). If the shoes + occasion part keeps it, it stays there; one owner only |
| `distressed_by_design` on shoes | **Narrowed:** never excuses scuffs or dirt on sneakers (P058) |
| The prompt's lumping of lint into `pilled_or_worn` | Kept, but it doesn't work (0 of 4); lint moves to C5 as a tip |
| Nothing goes away | — |

## 5. What the user sees
- "Condition: clean." (most checks)
- "Condition 6: the overshirt looks wrinkled. A quick steam fixes it."
- "Condition 6: your Vans look dirty. Clean them or swap to a fresh pair."
- "Condition 4: there's a stain on the hoodie."
- "Condition: couldn't check in this light."
- Tips, no points: "Your black jeans look faded next to the black tee; a deeper black pair would sharpen it." · "There's lint on the black jeans; a lint roller fixes it." · "Button or roll the cuffs."

**Fixes that raise it** (each returns its deduction to the total): steam or press the piece, clean or swap the shoes, swap the stained piece (from his closet when he has one). These are cheap, honest fixes for a beginner, and they rank above buying anything.

**Wording rules:** garment words only ("the overshirt looks wrinkled"), never about him ("you look sloppy"), never about his body. "Looks" because the camera can be wrong; the "Not quite right?" sheet lets him clear a fault ("It's linen", "It's meant to be washed").

## 6. Risks
- **Blind field.** The AI marks almost everything clean (98% of stock reads). Most real condition faults (fading, lint, light wrinkles, dust) are a few pixels and low contrast at 1024 px.
- **False faults:** texture read as wrinkles (cord, quilting, canvas, slub), suede nap read as worn (P002's boots, 3 of 3 runs with close-ups), washed or garment-dyed pieces read as faded, designed distressing. Each costs 0.4, and the card says so in words, so a misread is visible and correctable.
- **"Distressed by design" swallows real wear** (P015, P027, P049 jeans; P058 runners). The flag is true on 33 of 46 jeans readings (RULEBOOK Part 6), so it excuses too much.
- **Fading is contested taste.** The pilot's evidence for it is one model five times; the style sources say fades are fine in workwear, skate and vintage. Points only after people's ratings.
- **Lighting:** dim rooms hide faults (NA), harsh light makes texture look like creases.
- **Never body:** a stretched neckline is a garment fact; "too tight" is fit's, and the copy test's body-word ban covers this part too.

## 7. Test plan
**Now, no new photos:**
1. Score every saved reading with C1–C3 and C6 and list every photo the part touches, with its reason, next to the panel's reasons (done for the pilot above: 4 flags, 2 match).
2. **Prompt-only flip test** (about $0.30–0.50 on billing; ask first): the 19 condition-flagged pilot photos plus 19 clean controls, 3 runs, close-ups on, with two prompt changes: split `pilled_or_worn` into `pilled_or_worn` and `dirty_or_scuffed_shoes`, and say "scuffs and dirt on shoes are never distressed by design". Pass: the value reads the same on ≥90% of slots and matches the judges on more than 2 of 19.
3. **C4 fading probe (Mac harness, no AI):** label his 11 faded photos and 10 non-faded dark-jeans photos blind (by eye from the face-hidden copies), then measure the lightness gap between the "black" jeans and the darkest other black piece, and the cluster spread inside the jeans. Takeover bar from #187 (≥10 points better than the AI, ≤30% unsure, repeatable, holds on mirror, propped and dark-on-dark). The AI's score on this today is 0 of 11, so any working measure beats it; the real bar is false alarms on washed-black jeans worn on purpose.
4. **C5 lint probe:** the 4 lint photos vs 10 clean dark photos on the 2048 detail copies. Expect a shadow log, not a takeover.

**With the gold set:**
1. Pairs that change one fact: the same overshirt pressed vs rumpled; the same black jeans fresh vs faded; lint-rolled vs not; clean vs dirty sneakers. The raters' ranking of each pair says whether the fault matters to people, and how much (in total-score points).
2. If raters dock faded black jeans in workwear and streetwear too, C4 gets −0.4 for everyone; if only in minimal and smart casual, it gets the style waiver the council refused for other care faults, and that's the founder's call.
3. If raters don't notice lint or light wrinkles at phone size, C3 and C5 stay tips and the deduction keeps only stains, worn pieces and dirty shoes.
