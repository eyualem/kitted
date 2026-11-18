# Niche menswear styles the scoring doesn't know yet (research, Nov 18)

**Status: research on paper, $0. No scoring code changed.** Nothing here is a decision: adding a look to the onboarding list (words users read) and every scoring change wait for the founder's yes. Log #489.

**Your ask (Nov 18):** "we have not accounted for niche styles like old money, sports wear, and so on."

**What was read, honestly:**
- **12 creator videos** (Tim Dessaint 3, Jaye Alexander 3, Frugal Aesthetic 5, Wanhee Kim 1), all uploaded 2023 or later, from the transcripts already in `inputs/youtube/clean/`. Each rule below has the video id, upload date and a quote of 12 words or fewer. Upload dates come from the transcript headers; Jaye's two aesthetics videos carry no header date, so theirs come from the creators' notes (`rubric/research/creators/notes/jaye-alexander-b.md`).
- **0 of the 10 Reddit threads: Reddit is blocked in the built-in browser** ("not allowed due to safety restrictions", both reddit.com and old.reddit.com), and Pinterest returned a blank page. I did not go around the block with another browser, and I did not fill the gap from memory. So **how many guys wear each style is not measured here**; the ranking below is a judgment from how much the four creators cover each style and whether they call it rising or fading. Y47 (below) is the way to close this.
- **The scoring:** about 45 made-up outfits through v16 (`TUNE["v16"]`, from branch `claude/rescoring-v16-58d34b`, run with `extraction-test/rules_conformance.py`'s builders), all at Everyday, a cool day, profile unknown. They are **described outfits mapped by hand to the reader's piece names, not photos**: where the reader has no name for a piece I used the nearest one and say so. Shown as "engine → what I think it should be". My "should be" is a proposal from the creators' rules, not a measurement, and your own ratings are gut taste (your words, Nov 16).

---

## 1. The one-screen summary

**What to do with each style** (ranked by how many users it likely touches):

| # | Style | Verdict | One line why |
|---|---|---|---|
| 1 | **Sportswear / athleisure** | **Widen Vintage sport into "Sportswear"** (recommended), plus two rule exceptions | The worst damage: a tee, joggers and retro sneakers is **8.4 raw, held to 6.5**; a runner under joggers or shorts costs 2.0 on Shoes. The track jacket and track pants aren't in the reader. |
| 2 | **Old money / quiet luxury** | **Fold in** (classic prep + smart casual + minimal); no new look, no rule exception | Its clothes are pieces the app already knows and it scores 7.0–8.5 today. What defines it (cashmere, drape, no logos) can't be seen in a photo. |
| 3 | **Smart streetwear** (not on your list; the research raised it) | **Add as a mix the card can name**, already proposed in `rules-by-style.md` §5 (decision 3) | Frugal named it one of the two big forms of streetwear now (Aug 2025). A blazer over a hoodie or with wide jeans can't be detected today. |
| 4 | Gorpcore / techwear | **Fold** into Outdoor (gorp) and Streetwear (all-dark tech) | Scores 7.5–8.0 today. Only vests and technical pants are unseen. |
| 5 | Japanese / Korean city boy, amekaji | **Fold** into Minimal (city boy) and Workwear (amekaji) | Already 7.5–8.5; Wanhee's city boy is Minimal's own "city boy" shape. |
| 6 | Skater | **Fold** into Streetwear | 7.5–8.0 today. |
| 7 | Grunge / Y2K | **No look, no exception** | Grunge's skinny jeans are charged on purpose (all four creators agree); Y2K's signature (tiny pink tops, metallics) can't be read, and Frugal says "short this". |
| 8 | Archive / avant-garde | **Drop** | Jaye: "I barely see anybody wearing this style"; Frugal's Dec 2025 video calls the Rick Owens wave over. Scores 7.0–7.5, no damage. |
| 9 | Western | **Drop** | Tiny; the reader can't name a cowboy boot (the shoe drops out of the score). |

**Which current rules hurt which style** (each was run, details in §3):

| Rule | Hurts | Evidence | The four creators say |
|---|---|---|---|
| Loungewear hold ([LNG-2]) | **Sportswear**: any outfit with joggers or sweats and no hoodie-matched set | tee + joggers + retro sneakers 8.4 raw → **6.5** | Silent on gym-to-street; Frugal (Feb 2026) calls sportswear a lasting influence. Your own call ([LNG-7]) already softened it by half a point for a deliberate outfit. |
| Running shoes charge ([SHO-3], `SK2_runners`, −2.0 Shoes) | **Sportswear** | shorts or joggers + running shoes: 7.0 and 6.5; the same shorts with retro runners: **8.0** | Silent. Frugal's 2023 sneaker chart treats the sneaker as part of the look. |
| No look recognized → no "reads as" credit, no top-to-toe credit | **Archive, western, old-money cashmere** | they sit at 7.0–7.5 and can't reach 8 | Fabric and drape are what they praise, and the reader can't see them. |
| Slim leg −1.0 outside a jacket ([PRO-13]) | Old money (slim chinos with a cardigan or quarter-zip) | 7.0 vs 7.5–8.0 with a straight leg | **Agrees with the engine** (all four lean straight or wide). Keep. |
| Big top over skinny legs −3.5 ([PRO-2], [PRO-13]) | Grunge | band tee + flannel + black skinny jeans **5.5** | **Agrees** (rulebook A3, all four). Keep. Jaye relaxed on skinny jeans in 2026, so watch it. |
| Smart + street veto (`ST_VETO`, tailored veto) | Smart streetwear | reads as no look | Frugal and Jaye both praise it (log #478 §4). |

**What you'd see change in the app if you say yes to the recommendations:**
- A tee, joggers and Sambas-type sneakers stops landing at "Getting there" 6.5 and lands near 7.0–7.5 when it's clean; a track jacket over track pants gets named, not ignored.
- Running shoes with shorts or joggers stop costing 2.0 on Shoes in a sportswear outfit.
- Nothing changes for old money, gorp, city boy, skater: they already score fairly; Kit's words for them stay the same.
- One new name on the card ("Sportswear", for Vintage sport widened), and one possible new setup tile or a rename: **your call**.

**Costs and unknowns:** whether the reader can tell a track jacket from a bomber and track pants from joggers is untested (needs a reader run on 20–30 photos, a few cents; asks your OK first). The Reddit evidence is missing (Y47).

---

## 2. Where the four creators stand on each style

(Quotes are 12 words or fewer, verbatim from the transcript. `id` is the YouTube id; a transcript time follows.)

| Style | Evidence | Direction |
|---|---|---|
| Old money / quiet luxury | Tim `jaOSdGqtgYY` 2023-07-23; Tim `XIYvycsZxDk` 2023-11-21; Jaye `Ulx1vjAREu0`; Frugal `EnLlL2XKRCA` 2025-08-14; Frugal `TUYSTimnDJg` 2026-06-01 | Peaked 2023–24 ("The era of quiet luxury and expensive taste", Frugal 2026). Its clothes live on in minimal and prep; "Ivy Prep making a comeback" (Frugal 2026). |
| Sportswear / athleisure | Frugal `JY_zrt43cbU` 2026-02-28; Frugal `TUYSTimnDJg` 2026-06-01; Jaye `Ulx1vjAREu0` (sports luxury); Frugal `K45OlNNhY8g` 2023-08-18 (Sambas) | Rising: "I can see becoming a perennial aspiration" (Frugal 2026). |
| Gorpcore / techwear | Jaye `Ulx1vjAREu0`; Frugal `TUYSTimnDJg`; Frugal `JY_zrt43cbU` | Steady niche; Jaye keeps away from gorp "until you really got money". |
| Smart streetwear | Frugal `EnLlL2XKRCA` 2025-08-14; Jaye `Ulx1vjAREu0` (business core) | Rising, but "buy in, but be careful" (Frugal). |
| Japanese / Korean | Wanhee `B9PIhkSQKuw` 2025-01-26; Jaye `5Dfr0PXTTpM` | Steady. |
| Y2K | Frugal `EnLlL2XKRCA`; Jaye `5Dfr0PXTTpM` | Fading ("Y2K definitely short this", Frugal 2025). |
| Archive / avant-garde | Jaye `5Dfr0PXTTpM`; Frugal `KCzadANGaI0` 2025-12-20; Jaye `RIuzSb8OLMM` 2026-05-09 | Niche and fading. |
| Skater, western | Tim `UNkA9HhbjXY` 2024-07-09 (one skater line); nothing for western | Too small to rank. |

---

## 3. One section per style

### 3.1 Sportswear / athleisure (the biggest gap)

**What it is.** Clothes made for training or running, worn in the street: track jackets and track pants, quarter-zips, joggers or sweats, gym shorts, Sambas and other retro or running sneakers, matched sets. Jaye calls the polished end "sports luxury": "track jackets, designer t-shirts" with "sleek sneakers" (`Ulx1vjAREu0`, [13:18]). Frugal's 2026 view: "Vintage sportsware and athleisure, tasteful minimalism" were what people wanted after 2020 (`TUYSTimnDJg`, [09:17]), and active wear is a lasting direction: "I can see becoming a perennial aspiration" (`JY_zrt43cbU`, [11:12], 2026-02-28). On the shoe: Sambas were "the current main character of the sneaker meta" (`K45OlNNhY8g`, [15:48], 2023-08-18).

**Pieces, in the reader's names.**
- Signature: quarter_zip, retro_runner (Sambas, Gazelles, New Balance), low_profile_sneaker, joggers, sweatpants, athletic_shorts, sweatshirt, hoodie as a matched set.
- Home: tee, performance_runner, white_leather_sneaker, relaxed or straight pants.
- Against: dress shoes, loafers, tailoring, slim skinny joggers.
- **Reader can't name yet:** track jacket, track pants (the reader's list has neither; `rubric.py` already lists both in its code, so only the reader's choices are missing), a zip-up "training top", sport socks, a headband or cap read as sport.

**Its rules** (from the four, thin: they speak about the look, not its rules): shoes matter most ("sleek sneakers", Jaye); the clothes are plain and the fit is the point; Jaye's point for plain casual clothes is that the logos aren't the power: the fit and the proportions are (`5Dfr0PXTTpM`, [04:35]).

**Where the engine marks it down** (v16, Everyday, cool day):

| Outfit (reader names) | Engine | Why | Should be |
|---|---|---|---|
| **SP1** white tee, black relaxed joggers cuffed, retro runners (Sambas) | **6.5**, raw 8.4 | [LNG-2] hold: only one sign of intent (a tee isn't a dressed upper half) | 7.0–7.5: a clean relaxed fit with the look's own shoe |
| **SP1c** same, straight joggers, low-profile white sneakers | **6.5** | same hold | 7.0 |
| **SP5** black roomy hoodie, black straight joggers, running shoes | **6.5**; Shoes −2.0 (`SK2_runners`) | hold, plus runner charge | 6.5–7.0 (a plain hoodie set is average, not a fault) |
| **SP4** white tee, black gym shorts, performance runners (warm day) | 7.0; Shoes −2.0 | runner charge | 7.5 |
| **SP4b** same, but the reader calls the shoe a retro runner | **8.0** | `retro_runner` is a credited shoe | the same 7.5: the shoe label alone swings 1.0 |
| **SP2** grey sweatshirt + matching relaxed sweatpants, white leather sneakers | 7.5 | [LNG-9] matched sweatsuit | 7.5 (already right) |
| **SP3** navy quarter-zip, black straight joggers, low-profile sneakers | 7.0 | quarter-zip counts as the dressed upper half | 7.0–7.5 (right) |
| **SP6** navy jersey, grey wide sweatpants, white sneakers | 8.0 | vintage sport hero piece | fine |

**What it shows.** The matched set and the quarter-zip already pass. What fails is the plain version most guys actually wear (tee + joggers + good sneakers), and the runner charge. One more trap: the **reader's choice of "retro runner" versus "performance runner" moves the score by a full point** on the same-looking shoe (SP4 vs SP4b).

**Recommendation: widen Vintage sport into "Sportswear" (fold, not a ninth look).**
- **Why fold:** Vintage sport already holds the machinery: sweats allowed with a hero piece ([VSP-6], [LNG-3]), retro and low-profile sneakers as its own shoe ([VSP-5]), a matched tracksuit credit that "can't fire on a real check yet" ([VSP-9]). It lacks only the new hero pieces (track jacket, track pants, quarter-zip with sweats) and the two exceptions below. A ninth look would split a tiny recognizer in two and make the look picker and the style game longer (it is built for 8, log #488).
- **Two rule exceptions** (proposed, strict-task size, parity with the Python engine first): (a) in a Sportswear outfit, the [LNG-2] hold counts the look itself as one sign of intent (as [LNG-7] already does at half a point); (b) the runner charge ([SHO-3]) is off in a Sportswear outfit, as it already is in Outdoor ([OUT-3]).
- **Cost in reader accuracy:** unknown until measured. The risk is real: a track jacket looks like a bomber or a windbreaker; track pants look like joggers. A wrong name changes which rules fire. Needs a test on 20–30 photos before building (T112, step 1).
- **The user-facing name** ("Sportswear" or keep "Vintage sport", and whether the setup tile changes) is your word to pick.

### 3.2 Old money / quiet luxury

**What it is.** Understated, expensive-looking clothes with no logos: knitwear over a collared shirt, polos, pleated trousers, loafers, an overcoat, neutral colors, a nice watch. Tim (`jaOSdGqtgYY`, 2023-07-23): "knitwear and smart trousers" is "the go-to casual attire"; "bonus points if the trousers are pleated" [07:07]; "loafers black or brown"; "crisp tailoring especially when worn casually without a tie". Colors: "white black Grays Tans cream tones Navy blues and Olive greens" [06:28]. Jaye (`Ulx1vjAREu0`, [00:30]): "there's no logos" and "the way that their clothes move when they walk are incredibly important." Old money is the generational one, quiet luxury the recent one; the clothes overlap.

**Pieces.** Signature: knit_polo, polo, sweater, cardigan, oxford_shirt, blazer or unstructured_blazer, trousers, chinos, loafer, overcoat. Home: quarter_zip, camp_collar_shirt (linen), white_leather_sneaker, suede_chukka. Against: logos, graphic tee, chunky sneakers, bright colors. **Not in the reader:** pleats on trousers (the closet reading has a `pleats` detail, the fit-check reading doesn't use it), cashmere versus cotton, linen, a watch's quality, "no logo" beyond the big-logo flag.

**Its rules.**
- **Silhouette:** Tim: quiet luxury clothing "lean[s] towards Slimmer tapered cuts", which he doesn't wear himself; he remixes it "with roomier Silhouettes" (`jaOSdGqtgYY`, [12:25]). His own quiet-luxury outfits are "quality Staples neutrals and relaxed Silhouettes" (`XIYvycsZxDk`, 2023-11-21, [00:00]).
- **Color:** neutrals, monochrome ("gray has got to be one of the best colors", Tim, same video).
- **Fit and shoes:** trousers "smart enough"; loafers; "crisp tailoring" without the tie.
- **Frugal's caution (2025-08-14, `EnLlL2XKRCA`):** the clothes have "exceptional construction and highquality materials", but the label is a "bit" and "quiet luxury definitely something that is a wild card".

**Where the engine marks it down** (all Everyday):

| Outfit | Engine | Should be | Note |
|---|---|---|---|
| **OM1** navy knit polo tucked, cream straight trousers, brown loafers | 7.5 (smart casual) | 7.5–8.0 | fine |
| **OM1b** same with wide cream trousers | **8.5** (minimal) | 8.0–8.5 | fine; reads minimal |
| **OM3** navy blazer, white oxford tucked, slim khaki chinos, loafers | 8.0 (classic prep) | 8.0 | the slim leg is free under a jacket |
| **OM8** camel cardigan over a white polo, grey straight trousers, loafers | 7.5 (classic prep) | 7.5–8.0 | fine |
| **OM2** cream sweater untucked, grey straight trousers, loafers | 7.0 (minimal) | 7.5 | the cashmere and drape that earn it the extra half point aren't visible |
| **OM4** navy cardigan over white oxford, slim chinos, loafers | 7.0 | 7.0 | Proportions −1.0 for the slim leg ([PRO-13]); creators agree |
| **OM7** grey quarter-zip over light-blue shirt, slim navy trousers, loafers | 7.0 | 7.0 | same slim charge |
| **OM5** camel overcoat, navy sweater, charcoal trousers, black loafers (cool) | 7.0 | 7.5 | no credit for the coat's line |
| **OM6** white polo, khaki shorts, loafers (warm) | 7.5 | 7.5 | fine |

**What it shows.** Old money is **not** marked down by a wrong rule. It averages about 7.5, climbs to 8.5 with a wide leg, and loses a point only for a slim leg, which the creators back. The honest gap is "can't see the fabric", which no rule change fixes.

**Recommendation: fold; no exception.** The look is Classic prep + Smart casual (+ Minimal when the trousers are wide). A tenth recognizer would pull the same outfits away from looks that already name them and could only be told apart by logos and fabric, which the reader doesn't read. **Cost in reader accuracy: none.** What it would cost to add: new recognizer rules plus a new tile for the same photos. Optional, your call: let Kit say "old money" in words for Classic prep or Smart casual outfits that fit it (words users read).

### 3.3 Smart streetwear (found, not on your list)

Frugal (`EnLlL2XKRCA`, 2025-08-14, [03:47]): "button-down shirts, trousers, and even loafers" with "graphics and hats" and, for the shoe, "some sambas". Jaye calls the same idea business core (`Ulx1vjAREu0`, [05:07]: a leather jacket with a dress shirt and a tie). This is already log #478 §4: today a blazer over a hoodie or with wide jeans reads as no look (`ST_VETO` and the tailored veto each turn the other away). **Recommendation: as already proposed, yes, as a mix the card can name, after Tailored (T94).** It needs its own short spec. The new Sportswear exceptions should be built first, because Sambas are its usual shoe.

### 3.4 Gorpcore and techwear

**What it is.** Gorp: technical outdoor pieces in the street (shells, fleeces, vests, trail shoes, cargos). Techwear: all-dark, many pockets, cargo and shell. Jaye (`Ulx1vjAREu0`, [07:13]): "taking things that are very practical like cargo pants"; Frugal (`TUYSTimnDJg`, [08:40]): "Gorp core. an instant reaction" to the pandemic, and (`JY_zrt43cbU`, [13:30]) outdoor brands "they've always had their place".

**Pieces.** Signature: shell_jacket, rain_jacket, fleece, vest, trail_shoe, cargos. The reader has `trail_shoe` and `vest` in the newest reading format (`schema_v5s`). **Can't name:** technical pants (they read as cargos or trousers), harnesses, straps, a balaclava.

**Engine:**

| Outfit | Engine | Should be |
|---|---|---|
| **GP1** orange shell, grey tee, relaxed olive cargos, trail shoes | 7.5 (outdoor) | 7.5–8.0 |
| **GP2** tan fleece, white tee, straight black cargos, trail shoes | 7.5 (outdoor) | 7.5 |
| **TW1** black shell (long), black tee, wide black cargos stacked, chunky sneakers | 8.0 (streetwear) | 7.5–8.0 |
| **TW2** black roomy hoodie (long), wide black cargos pooling, work boots | 7.5 (reads workwear) | 7.5 (the label is wrong, the score isn't) |

**Recommendation: fold.** Outdoor covers gorp; the all-dark technical outfit is already [STR-4]'s "all-dark technical look" in streetwear. A known gap stays: Outdoor has no path to 8 on a real check (KD-7). Not built here.

### 3.5 Japanese and Korean city boy, amekaji

**What it is.** City boy: "very minimal, very based on a silhouette", "basic stuff it's just basic colors neutral tones" (Wanhee, `B9PIhkSQKuw`, 2025-01-26, [04:20]). Amekaji: "the Japanese interpretation of American casual clothing" [04:53]: chore coats, denim, boots, flannel. Jaye (`5Dfr0PXTTpM`): "baggy cargos, layer hoodies".

**Engine:**

| Outfit | Engine | Should be |
|---|---|---|
| **CB1** grey roomy sweater, wide black trousers, black loafers | 8.0 (minimal) | 8.0 |
| **CB2** olive roomy overshirt over a white tee, wide khaki trousers, low-profile sneakers | 8.5 (minimal) | 8.0 |
| **AM1** khaki chore coat, light-blue oxford, dark straight jeans cuffed, brown work boots | 7.5 (workwear) | 7.5–8.0 |
| **AM2** red plaid flannel over a white tee, dark straight jeans, work boots | 7.5 (workwear) | 7.5 |

**Recommendation: fold.** City boy is Minimal's own shape ([MIN-6]); amekaji is Workwear. No rule is hurting it. Unseen: fabric quality and wear, which Wanhee puts first ("the way the denim ages").

### 3.6 Skater

**Evidence is the thinnest:** one line, a London street interview, "my primary influence skating culture" (Tim, `UNkA9HhbjXY`, 2024-07-09, [10:53]). The pieces are streetwear's own: oversized graphic tee, wide jeans, canvas sneakers.

| Outfit | Engine | Should be |
|---|---|---|
| **SK1** black graphic tee (very roomy, long), wide mid-wash jeans pooling, canvas sneakers | 7.5 | 7.5 |
| **SK2** grey roomy hoodie, wide dark jeans stacked, white canvas sneakers | 8.0 | 8.0 |

**Recommendation: fold into Streetwear. Nothing to change.**

### 3.7 Grunge and Y2K

**Grunge:** Jaye lists "Workwear boots, grunge boots, platform boots, Chelsea boots" (`RIuzSb8OLMM`, 2026-05-09, [03:33]). The classic fit is a band tee, a flannel, skinny black jeans, boots. **Y2K:** Jaye: "not beginner friendly" and "balancing the playfulness with the structure" (`5Dfr0PXTTpM`); Frugal: "Anything pink and small" and "Y2K definitely short this" (`EnLlL2XKRCA`).

| Outfit | Engine | Should be |
|---|---|---|
| **GR1** black band tee, red plaid flannel open, black skinny jeans, work boots | **5.5** | 5.5–6.0: all four call a big top over narrow legs the classic bad shape (rulebook A3) |
| **GR1b** same with slim jeans | 6.5 | 6.5 |
| **GR2** grey worn tee, dark straight ripped jeans, canvas sneakers | 6.5 | 6.5 |
| **Y2K1** white tee (cropped), light wide jeans pooling, chunky sneakers | 8.0 (streetwear) | 7.5–8.0 |

**Recommendation: no look, no exception.** The skinny charge is the creators' own rule. Jaye said "nobody dissing skinny jeans no more" in May 2026 (rulebook), the only dissent; if he moves the others, the rule moves with them. Y2K's signature (metallics, tiny pink tops, logos) isn't readable.

### 3.8 Archive / avant-garde

**What it is.** "Washed fabrics... damaged clothes, archive straps, muted colors, gritty textures" (Jaye, `5Dfr0PXTTpM`, [01:02]), all black, draped, long layers, Rick Owens. **Popularity:** Jaye: "I barely see anybody wearing this style"; Frugal's Dec 2025 video opens with "Wrap it up. The whole Rick Owens, Margela, Archive" (`KCzadANGaI0`).

| Outfit | Engine | Should be |
|---|---|---|
| **AR1** black roomy long tee, wide black trousers pooling, black work boots | 7.5, Fit −0.5 (`FF7_pooling`) | 7.0–7.5 |
| **AR2** black long leather jacket, black tank (long), wide black cargos pooling, black Chelsea boots | 7.5 | 7.5 |
| **AR3** charcoal roomy long overcoat, black sweater, black relaxed trousers, black work boots | 7.0 | 7.0 |

**What it shows.** Nothing is badly marked down; there's no look credit, so the ceiling is about 7.5. One rule to check, not traced here: the pooling charge fires on a wide black leg, where Frugal says a soft stack is "beautiful" (rulebook B2). **Recommendation: drop.** Tiny and fading, and the draped fabric that defines it can't be read.

### 3.9 Western

No creator covers it; the reader can't name a cowboy boot (a shoe it can't place is left out of the score, which hides a wrong read), a belt buckle or a hat. **WE1** denim jacket, white tee, dark straight jeans, brown Chelsea boots: 7.5 (workwear); **WE2** tan plaid flannel tucked, dark jeans, Chelsea boots: 7.0; with the boot read as "other" the shoes part is dropped. **Recommendation: drop.**

### 3.10 Other styles the research raised

- **Indie sleaze:** Frugal (2025-08-14, [11:46]): "the aesthetic in the middle of its biggest stride right now"; slim and skimpy clothes and leather jackets. Slim and skinny legs are charged, so it would score low; the creators back that. Watch item; Frugal says it will peak soon.
- **Ivy prep comeback:** "Ivy Prep making a comeback somehow" (Frugal, `TUYSTimnDJg`, [13:28]). Supports keeping Classic prep, which the creators barely define (rulebook world.20).
- **Earth tones:** Jaye (2025-09-16) "very calm"; Frugal (2023) "death of earth tones". Opposed; no look change (colors are in the shared rules).

---

## 4. What the paper run could not show

- These are made-up outfits, so they show **which rule fires**, not how often it fires on real photos.
- The score's **reading** is not tested here: track pieces and cowboy boots don't exist in the reader, so those outfits use nearest names.
- Frugal's "buy" and "short" calls are his taste in trends, not facts about what US guys 18–30 wear.
- No Reddit or Pinterest data (blocked).

## 5. The tasks and decisions

- **T112 (new, strict):** build the Sportswear widening and its two exceptions: reader names (track jacket, track pants) tested first, Python engine first, then `@kitted/core`, parity tests green. Needs your yes on the **look's user-facing name** (and on any change to the setup tile) and on **any scoring change**.
- **Y47 (your to-do, P2):** say yes or change the three recommendations (widen Vintage sport; fold old money, gorp, city boy, skater; drop archive and western), and, if you want the Reddit half, paste five or six r/malefashionadvice, r/streetwear or r/OldMoney threads you trust, or OK a different browser for it (5 min plus the paste) → T112 and the evidence for how common each style is.
- **Spend:** the reader test in T112 step 1 is a few cents on 20–30 photos; asking before running it.

## 6. Sources (all 12 videos; quotes above are verbatim)

| id | Creator | Uploaded | Title |
|---|---|---|---|
| `jaOSdGqtgYY` | Tim Dessaint | 2023-07-23 | Why Quiet Luxury Became The Biggest Fashion Trend |
| `XIYvycsZxDk` | Tim Dessaint | 2023-11-21 | Fall/Winter outfits (minimalist/quiet luxury edition) |
| `UNkA9HhbjXY` | Tim Dessaint | 2024-07-09 | What Are People Wearing in London (UK)? |
| `Ulx1vjAREu0` | Jaye Alexander | 2025-06-09 | 10 Style Aesthetics Explained |
| `5Dfr0PXTTpM` | Jaye Alexander | 2025-09-16 | 10 Mens Style Aesthetics Explained (Part 2) |
| `RIuzSb8OLMM` | Jaye Alexander | 2026-05-09 | How To Build The TUFFEST Spring Wardrobe |
| `K45OlNNhY8g` | Frugal Aesthetic | 2023-08-18 | The Sneaker Alignment Chart |
| `EnLlL2XKRCA` | Frugal Aesthetic | 2025-08-14 | Modern Aesthetics Explained In 15 Minutes |
| `KCzadANGaI0` | Frugal Aesthetic | 2025-12-20 | The Quarter Zip Effect |
| `JY_zrt43cbU` | Frugal Aesthetic | 2026-02-28 | Timeless Aesthetics Explained In 16 Minutes |
| `TUYSTimnDJg` | Frugal Aesthetic | 2026-06-01 | 10 Years Of Fashion In 17 Minutes |
| `B9PIhkSQKuw` | Wanhee Kim | 2025-01-26 | Why Japanese People Dress Better (5 Fashion Tips) |

The outfits are in `extraction-test/niche_styles_paper.py` (about 45, in the reader's piece names). Rerun: `V16=<a checkout of claude/rescoring-v16-58d34b> python3 -I extraction-test/niche_styles_paper.py` (v16 isn't on main yet; $0).
