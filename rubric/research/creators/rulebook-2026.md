# The creators' rulebook (2026)

*Nov 14, 2026 · T95 · DECISIONS-LOG #464 (the plan) and the T95 entry. Research only: nothing here is in the engine, and no score has changed. The rescoring on paper (T68) and the build (T69) are tuned on it, after the founder's marks.*

**What this is.** How the founder's four creators judge an outfit, written as rules the app can test: Tim Dessaint, Wanhee Kim (완희), Jaye Alexander and Frugal Aesthetic, from their videos uploaded since Jan 1, 2023. They are the yardstick. A few current outside channels fill the gaps (suits first, then summer and layering), and lose any clash with the four. Silhouette and proportions come first, then color and contrast, then layering, shoes, condition and season, then style worlds and the ladder, then the **interactions** (how the parts change each other), which is what the founder cares about most.

**How it was built.**
- **Transcripts:** every clothing-relevant upload from the four since 2023, read from YouTube's own transcript panel in the app's built-in browser (`inputs/youtube/clean/<id>.txt`, git-ignored): **118 videos from the four + 11 outsiders = 129 read**, about 300,000 words. The full list, with what was skipped and why, is at the end ("Video list").
- **Reading:** 16 readers (Claude subagents) read every transcript in full under one brief (`notes/2026/BRIEF.md`), and one re-read October's 32 videos for what October skimmed (color, contrast, interactions, season). Their notes are in `notes/2026/` (about 830 rule blocks). Five synthesizers merged them by part under `notes/2026/SYNTH.md` into the sections below (157 rules and 38 interactions, 195 entries). A concept study (`notes/2026/concepts.md`) pinned down the ideas named in passing (the rule of thirds, the waist break, visual weight, value contrast, tonal vs same-depth color, the three-color count).
- **Every rule** carries a creator, a 2023+ video id, a `[mm:ss]` timestamp, a quote of 12 words or fewer, and a frame path or the reason there is none. Rule ids are lowercase with a dot (`prop.3`, `color.6`) so they never clash with the engine's bracketed ids (`[PRO-4]`, from `rubric/v5-styles.md`).
- **Checks** (`notes/2026/synth/spotcheck.md`): all **1,371 quotes** were found in their transcript within 40 seconds of their stamp, by script; **38 of the 195 entries** (1 in 5.1) were read against the transcript by Claude: 32 hold as written, 3 hold with a note on which source anchors them, 3 were changed (two sources that crossed the body or attractiveness line were removed, one rule was reworded to match its own sources). No rule's core claim was wrong.
- **Frames** (`inputs/youtube/shots/<id>/`, git-ignored, internal only): 655 stills near the transcript stamps plus 60 recaptured anchors. A 40-still check found only **35% of the near-stamp stills show the outfit the verdict is about** (the stamps come in 30-second blocks), so every frame path below says whether it was looked at; "(unverified)" means it wasn't. The **60 anchors** for the ladder were recaptured as bursts and picked by eye: **50 verified, 10 partly** (table near the end).
- **Hard lines kept:** nothing about faces, bodies, skin, hair or weight; where a creator framed a point around the body, the rule is restated as where hems, waistbands and widths sit, or left out.

**Who's in the mix.**
| Channel | Read | Why |
|---|---|---|
| Tim Dessaint | 33 | The yardstick; the proportion and smart/casual voice |
| Frugal Aesthetic | 55 | The yardstick; the silhouette, shoe and style-world voice, and the only one who uses the whole ladder |
| Jaye Alexander | 16 | The yardstick; layering, accessories and the "levels" |
| Wanhee Kim | 14 | The yardstick; color (shades of one color, the "point") and proportion; 6 more of his videos were skipped as body or fitness talk |
| The Armoury · GQ (2 tailor videos) · Justin Kwan (2) | 5 | **Outsiders, suits:** the four barely cover suit fit (shoulder, sleeve, rise, break); kept only where they agree with the four, and 7 tips that clashed were dropped |
| Damien Broderick | 1 | **Outsider, suits worn as separates now:** the outsiders above were thin on casual tailoring |
| Brandon Balfour · Harry Has · James Leung | 3 | **Outsiders, summer:** the four say little about what lifts a hot-weather outfit with no layers; 2 tips that clashed with the four were dropped |
| Drew Joiner · Daniel Simmons | 2 | **Outsiders, layering and winter:** Joiner adds "windows" into layers; Simmons was read and added nothing the four hadn't said |

Not used: old-guard channels (Teaching Men's Fashion, Alex Costa, Real Men Real Style, Gentleman's Gazette, The Modest Man) and outfit raters out of 10. Outside color videos were looked at and skipped because they are built on skin tone.

---

## The short version

### 10 things the four agree on about silhouette and proportions
1. **Shape comes before color.** What an outfit is "about" is how the pieces sit against each other; the same palette goes from bad to great on shape alone (sil.1, ix.1; all four).
2. **The hem against the shoe can sink an outfit.** Trousers should reach the shoe with no break or one clean break; dragging or flapping short ruins an outfit whose top half is right (prop.1; Tim "make or break", Frugal "the whole thing is trash", Wanhee "it just all falls apart").
3. **Split the outfit unequally, about a third over two thirds, not in half** (prop.2, the rule of thirds; all four).
4. **Make a waist break:** a tuck, a top that ends at the belt, a slight crop, or a jacket that stops where the trousers start; strongest over a fuller leg (prop.3; all four, who differ only on how much crop).
5. **One loose half, one fitted half:** a fitted or short top over a fuller leg is the reliable great shape (sil.2; Tim, Frugal, Jaye; Wanhee agrees on the fuller leg).
6. **Don't let the top outweigh the legs:** the top no wider than the widest part of the trousers; a big top or jacket over skinny legs is the classic bad shape (sil.3).
7. **Oversized means width and sleeve, not length:** a body so long it covers the waist and hangs toward the thigh is the fault (prop.6, fit.5; all four).
8. **In one color, the outline is the whole outfit:** all black or tonal makes a good shape look better and a bad one worse (sil.7, ix.3; all four).
9. **Match the shoe's weight to the leg:** a chunky shoe wants a generous or cinched leg, a slim low shoe wants a full, long leg over it, boots carry flares (prop.10, prop.11, shoe.2, ix.11).
10. **Fit is the floor:** nothing skin-tight, nothing sagging or swamping, and no jacket or loud shoe covers a bad pair of trousers (fit.1–fit.3, ix.17; all four).

**Where they split:** how much crop (Frugal and Jaye like it; Wanhee and Tim want the belt line or a tuck), stacking (Tim calls it sloppy except on wide casual legs; Frugal likes a soft stack), slim legs (two prefer straight, two are fine with slim; skinny is out for three), and a wide top over a slim leg (a fault for Frugal, a choice for Tim and Jaye).

### Color and contrast: the nuances
- **A neutral base is the floor, not a lift:** it prevents color faults but doesn't make an outfit good (color.1).
- **One accent on a quiet base lifts it** (Wanhee's "point"); a second matching accent reads try-hard; several cancel out (color.2, world.1).
- **Shades of one color is the easiest reliable win**, as long as the shades actually differ (navy with light blue; black, charcoal and grey); flat all-navy is "basic and predictable" (color.8, ix.8). All black needs a faded piece, a dark grey or a texture change (color.9, layer.1).
- **About three colors at most,** with black and white counting half and shades of one color counting less (color.4). Muted, deeper colors read more premium; bright reads young, which is not wrong (color.7).
- **When a risky pair works** (the founder's red shirt over blue pants): one of the two is muted or dark; or both are strong on purpose at the same strength; the rest is dark or neutral around it; one color clearly leads by area; and the shape is right. **What makes it worse:** a strong color next to a pale one, a loud print on top of the clash, a third bright, or echoing the risky color again (color.6, "When a risky color works", ix.2, ix.4–ix.5).
- **Contrast between pieces:** one traditionally smart piece with casual ones is a lift (Tim's tee tucked into tailored trousers), across two levels of dressiness, never three (contrast.1–contrast.3, world.5); neighbouring pieces should differ in texture (knit over knit blurs; contrast.5, layer.5).
- **Light tonal summer outfits** (cream or white relaxed jeans with a white tee) are praised by Tim; the engine's [COL-12] charges them today (color.11, season.3).

### Suits and tailoring
- **Relaxed is current:** a suit no longer needs to be slim; a slightly relaxed or boxy jacket is fine; skin-tight ruins it, and so does oversized everything (suit.1).
- **The shape comes from the shoulder and chest,** not a waist taken in tight; nothing pulls (no X-creases at the button) (suit.2, suit.4).
- **The trouser touches the shoe with no break or one clean break,** sits higher with a fuller, straight leg; pleats and a pressed crease are welcome (suit.3, suit.5).
- **No fixed jacket length:** a short or boxy jacket over full trousers is fine; one so long it swallows the legs is a fault (suit.6).
- **Worn casually is the current way:** a tee, tank or polo under the jacket, no tie, an open blazer, a tucked tee with loafers; clean low sneakers work under tailoring, chunky or running ones don't (suit.8, suit.10). A blazer with jeans is a good separate, the "cool professor" (suit.9), which the engine's [STY-3] charges today.
- **Separates replace the suit most days** (smart trousers and loafers with a polo, an oxford, a sport coat, a long coat) and **a full suit for an errand overdresses** (suit.11, suit.14).
- **Outsider tips dropped for clashing with the four:** "black suits only for weddings and funerals", "flat fronts over pleats", "a boxy jacket looks too big", "the jacket must cover the seat", "a short jacket splits the outfit in half", "cut trousers purposely shorter", "the shirt seam must sit at the shoulder" (all 7 in `notes/2026/suits.md`).

### The season
In heat, the trousers' shape, the waist, light fabric and a light tonal palette carry a layerless outfit, and a missing layer is not a fault; in mild weather one light layer that shows the base; in the cold, texture and two or three layers under one structured coat, never bare ankles. The engine has no season input today, so a summer fit has fewer ways above 7 than a layered fall one (season table in the season section).

### What the engine and the reader can't do yet
- **Biggest engine gaps:** no ceiling when the trousers and shoes fail (ix.10); no trade where good shape softens a risky color (ix.2); nothing for one-color outfits (ix.3); no lift for a focal point beyond +0.5, a statement jacket, or a deliberate smart/casual cross (world.1, world.5); no season input.
- **Biggest reading gaps:** the hem (a weak read), top length past the fly (`below_crotch` almost never fires), volume 4–5, slim vs straight, and things not read at all: light vs dark value, fabric and texture, rise, socks. The cheapest fix with the most reach is a light/mid/dark value per piece (a lookup from `color_family` would be a free stopgap; concepts.md §6).
- **The dealbreakers sheet** (`rubric/research/dealbreakers.md`) now has a "Creators say (T95)" column on all 32 rows: 12 rows marked **Change**, one **Add**, the rest agree.

### Contents
1. Shape: silhouette (sil), proportions (prop), fit (fit), suits and tailoring (suit)
2. Color (color), contrast between pieces (contrast), pattern and print (pattern)
3. Layering and texture (layer), shoes against the outfit (shoe), condition and finishing (cond), occasion and season (season)
4. Cohesion and style worlds (world), the ladder (ladder)
5. Interactions (ix)
6. The 60 anchor outfits (verified stills); the full catalogue of 458 judged outfits is `notes/2026/synth/6-examples.md`
7. Video list

---

## 1. Shape: silhouette, proportions, fit, suits and tailoring
Synthesized Nov 14, 2026 for T95 (plus one late outsider for the suit section, Damien Broderick `4jnsdw7aT5U`, 2025-10-23) from `by-part/rules-silhouette.md`, `rules-proportion.md`, `rules-fit.md`, `rules-tailoring.md`, `concepts.md` §1–5 and §13, and `suits.md` ("The four on suits and blazers", "Against specs/tailored.md"). Every quote was checked word for word against `inputs/youtube/clean/<id>.txt` (12 words or fewer; `[music]` tags dropped). Clothes only: wherever a creator talks about bodies ("long legs", "your frame"), the rule is restated in terms of where hems, waistbands and widths sit.

**In plain words.** All four put shape ahead of color: what an outfit is "about" is how the pieces sit against each other, not which pieces they are. They agree on four things. (1) The hem against the shoe can sink an otherwise good outfit. (2) An unequal split beats a 50/50 one, and a waist break (a tuck, a short top or a jacket ending where the trousers start) is how you get it. (3) One half should answer the other: a fitted or short top over a fuller leg is the safe great shape; big on big works when both halves carry it on purpose; a big top over a narrow leg mostly fails. (4) Fit is the floor: nothing skin-tight, nothing sagging, and no jacket or loud shoe can cover a bad pair of trousers. The main disagreements are how much crop (Frugal and Jaye like cropped pieces; Wanhee and Tim want a hem at the belt or a tuck), stacking (Tim calls it sloppy except on wide casual legs; Frugal likes a soft stack), slim legs (two prefer straight, two are fine with slim; skinny is out for three), and whether a wide top over a slim leg is a fault (Frugal) or a style choice (Tim, Jaye). On suits, the four want them relaxed, worn casually (a tee or tank under, no tie, sometimes sneakers), fitted by the shoulder rather than a tight waist, with the hem touching the shoe.

**How to read the ids.** `sil.`, `prop.`, `fit.`, `suit.` are this file's rules; `[PRO-4]`-style ids are today's engine (`rubric/v5-styles.md`). "Tim's guest" is the guest Harry in Tim's video OqoUgLxknJc; outsiders (The Armoury, GQ's tailor, Justin Kwan, Damien Broderick) are marked and only fill gaps in the suit section.

---

### Silhouette (sil.*)

#### sil.1. Shape comes before color: judge how the pieces sit against each other, not the pieces themselves.
- **Strength:** nuance (it sets the weights: proportion and silhouette should count for more than color or style). **Holds when:** always; strongest when the palette is plain (sil.7). **Doesn't:** it never makes a shape fault free because the colors are good.
- **Interacts with:** color (a good shape can carry a riskier color pair; that trade belongs to the interactions part, `ix.*`), style (the same white tee reads cool or plain depending on what surrounds it).
- **Sources:** Tim · `0ilmLux6mPg` · [08:15] · "Your preferred silhouette is arguably more important"; Tim · `0ilmLux6mPg` · [07:11] · "the relationship between each piece"; Wanhee · `ew3gCk1zkso` · [10:42] · "you want to see almost like the shape like not the color"; Wanhee · `tNVdA_arEa8` · [05:09] · "if you were to take all the color out of it"; Wanhee · `mpv9WWHDZio` · [04:29] · "Maybe it's the proportion. Maybe it's the silhouette."; Jaye · `UcLBvcmnnus` · [06:39] · "your own proportion, your own silhouettes"; Frugal · `njD_txmWPt4` · [00:00] · "playing with shapes and Silhouettes"; Tim · `vQd36IKIkOg` · [03:25] · "take inspiration from the overall silhouette"
- **The four:** all agree.
- **Engine today:** has it differently [SCO-1]: Proportions is the largest part (30%), but Color and Style together weigh 40% and nothing lets a good shape soften a color fault.
- **AI can see it:** weakly (it is the sum of `volume`, `leg_shape`, `length`, `tucked`; the weak reads at volume 4–5 and slim vs straight blur exactly this).
- **Frame:** pending (`inputs/youtube/shots/0ilmLux6mPg/f-07-16.jpg` checked: it shows Tim talking, not the three white tees)

#### sil.2. One loose half, one fitted half: a fitted or short top over a fuller leg is the classic great shape.
- **Strength:** lift. **Holds when:** the top is fitted, cropped, boxy-and-short or tucked, over straight, relaxed, wide, barrel or pleated "balloon" legs; Tim's version is a boxy jacket whose hem ends where the trousers start. **Doesn't:** when the top is long and loose (prop.6); Frugal's 2026 bulky-sneaker template wants a slightly oversized top of "neutral to longer length", nothing cropped (prop.4).
- **How to see it in a photo (the classic silhouettes):** trace the outer edge of the clothes from collar to shoe and name the letter. **A** (narrow top, wide bottom: today's "big pants, small top"), **H** (even column: straight top, straight leg, or a long straight coat), **X** (full top, defined at the waistband, wide or flared hem), **V** (wide top over a narrow leg), **O** (volume in the middle: city-boy layering, balloon trousers). Then check two things that matter more than the letter: is every piece supporting the shape, and do the shoes match it (chunky under A and X, slim under H). Most good everyday outfits are a soft A or H.
- **Interacts with:** prop.2 (the waist break makes the A or X readable), prop.10–prop.11 (the shoe has to match the leg's volume), color (in all black the contrast comes from shape alone, sil.7).
- **Sources:** Frugal · `Vn6KlXkU2xA` · [10:19] · "fairly fitted top with a relaxed bottom this just creates good contrast"; Frugal · `xL1NeaA9D-Y` · [04:18] · "the big pants, small top ensemble, just polarization"; Frugal · `XtcY-zmoS-E` · [04:07] · "just tight waist wide legs"; Frugal · `XtcY-zmoS-E` · [03:37] · "this wide bottom would look really good paired with a tight top"; Tim · `vziGl_FxQb0` · [04:18] · "the boxy, cropped top, baggy bottom look"; Tim · `0ilmLux6mPg` · [07:42] · "broad shoulders and a straight cut at the hem"; Jaye · `Pxeeh-caTJg` · [22:13] · "So, this creates an hourglass silhouette."
- **The four:** Frugal, Tim and Jaye agree; Wanhee agrees on the fuller leg but not on the short top (he wants a tee that ends at the belt, "not too cropped like those fashion influencers", `Mr-GzwGQ1qY` [06:04]; see prop.4).
- **Engine today:** has it differently [PRO-4], [PRO-6], [PRO-14], [STR-5]: it pays for the waist break or a short jacket, not for the volume contrast itself, so a fitted untucked tee ending at mid-fly over wide jeans earns nothing.
- **AI can see it:** weakly (`volume` top vs `leg_shape`, `length`, `tucked`; "fitted" vs regular is roominess 1–2 vs 3, which isn't steady).
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-10-24.jpg` (checked: the "fitted top + relaxed bottom" card)

#### sil.3. Don't let the top outweigh the legs: the top should be no wider than the widest part of the trousers, and a heavy top half over thin legs needs weight added below.
- **Strength:** fault. **Holds when:** a roomy top, a bulky scarf or chunky knit, or a big jacket sits over slim or skinny legs, especially with light or flimsy bottoms. **Doesn't:** when the legs carry matching volume (sil.4), when a chunky shoe or darker, wider leg adds weight below, or in Tim's long-coat column (sil.5).
- **How to see it in a photo (top-heavy vs bottom-heavy):** compare the width of the top at its widest with the width of the trousers at their widest (Frugal's test). Then compare how dark and busy each half is. Then check the shoes: chunky shoes add weight below, slim ones don't. All the width, darkness or busyness up top over narrow legs is top-heavy; a small top over wide, dark trousers and heavy shoes is bottom-heavy, which right now mostly reads as good (sil.2).
- **How to see it in a photo (visual weight):** squint until the details blur. What stays visible longest is heaviest: the biggest, darkest, brightest, busiest or chunkiest piece. Note which half holds most of it. A heavy piece is fine as a deliberate focal point; trouble is two heavy things competing, or the weight piled at one end.
- **Interacts with:** shoes (a chunky shoe can rescue a top-heavy outfit, prop.10), color (a dark top over light trousers is top-heavy even when the widths match; the color part owns value), layering (each added top layer adds top weight).
- **Sources:** Frugal · `XtcY-zmoS-E` · [02:04] · "make sure your top is the same width if not Slimmer"; Tim · `wIib9hzVUuw` · [05:36] · "it's quite a topheavy outfit with the chunky oversized scarf"; Tim · `0ilmLux6mPg` · [08:51] · "visual weight on the upper body or the lower body"; Tim · `-e9Is50-fn0` · [08:16] · "heavyweight chunky knitwear adds that lovely texture and weight"; Jaye · `Jz9QVWgBbOg` · [13:41] · "Oversized jackets, they need balance."; Wanhee · `tNVdA_arEa8` · [05:40] · "a tight muscle t-shirt" (his example of the wrong silhouette, with skinny jeans)
- **The four:** Frugal agrees as a rule; Tim fixes top-heavy outfits by moving weight down but says the direction is a preference ("There is no universally correct answer.", `0ilmLux6mPg` [08:51]); Jaye says skinny jeans with big runners and a boxy tee is "nothing wrong with that style" yet tells viewers to let it go (`sOfjDjtjBWM` [08:48]); Wanhee rejects the tight version.
- **Engine today:** has it [PRO-2] (roomy top over skinny −1.5), [PRO-11] (roomy top over slim −1.5 unless outdoor), [PRO-3], [SHO-9]; lacks the weight side (a chunky scarf or heavy knit over slim legs, and a heavy shoe rescuing it).
- **AI can see it:** weakly (`volume` top vs `leg_shape`; volume 4–5 and slim vs straight are both weak reads; darkness and texture aren't read; shoe bulk only via `subcategory`).
- **Frame:** pending (no still 0–20 s after [05:36]; `inputs/youtube/shots/wIib9hzVUuw/o2-before-05-30.png`, 6 s earlier, checked: the scarf-and-cardigan outfit)

#### sil.4. Big on big is a valid shape when both halves carry the volume on purpose and the hems are controlled.
- **Strength:** nuance (no charge; lift when it's clearly deliberate). **Holds when:** an oversized tee or boxy top over wide trousers, often under a big coat; a relaxed jacket sized up to match wide trousers. **Doesn't:** when one half is big and the other merely regular, when the hems pool on a straight leg, or when it tips into "swollen" size-as-a-shortcut (fit.3).
- **Interacts with:** sil.3 (both halves big keeps it balanced), prop.9 (stacking on a wide leg is part of the look), shoes (a generous leg wants a substantial shoe).
- **Sources:** Tim · `vQd36IKIkOg` · [02:53] · "rocking an oversized tea, some widelegg trousers, and a big overcoat"; Tim · `2KblatXQTGs` · [02:08] · "a bit looser to go with the wide fit of the pants"; Frugal · `xL1NeaA9D-Y` · [04:18] · "this obviously works really well with other oversized wardrobes"; Frugal · `2gSj7T37RkQ` · [02:07] · "fundamentally these pieces actually look pretty good together"; Wanhee · `rNCrnP-os0U` · [08:12] · "then you're entering another territory which can look good"
- **The four:** Tim and Frugal agree; Wanhee allows it as "another territory" beyond his own normal-to-slightly-loose default; Jaye only asks for balance.
- **Engine today:** has it [STR-5], [PRO-11] (roomy over full legs is held by streetwear, minimal and the others); dealbreakers N1 leaves it to normal scoring.
- **AI can see it:** weakly (`volume` 4–5 is rarely read, KD-1).
- **Frame:** `inputs/youtube/shots/vQd36IKIkOg/f-02-58.jpg` (checked: a long black coat over wide light trousers)

#### sil.5. The outer layer sets the outline: its length decides the read, and it needs room for what's under it.
- **Strength:** fault (a tight or slim outer layer over a bulky one) / nuance (length). **Holds when:** a short jacket shows the legs and makes two blocks; a long coat makes one continuous shape (both fine); the coat has room for a knit or hoodie underneath. **Doesn't:** a slim puffer or a close overshirt over an oversized hoodie or chunky knit (bunching); a bulky shirt under a bulky jacket.
- **Interacts with:** sil.3 (the outer layer is most of the visual area, so its shape weighs most), prop.5 (the short jacket credit), fit.4 (snug inner layers, roomy outer ones), layering.
- **Sources:** Jaye · `RIuzSb8OLMM` · [10:11] · "the outer layer defines silhouette and the tone of the fit"; Frugal · `RlcdMBj5Z2E` · [06:25] · "it holds the biggest amount of visual real estate on a fit"; Tim · `0ilmLux6mPg` · [08:51] · "A short jacket can emphasize the legs"; Tim · `0ilmLux6mPg` · [08:51] · "one continuous controlled shape"; Tim · `FUWET2HH-us` · [02:10] · "provided you don't wear anything too oversized underneath"; Tim · `wIib9hzVUuw` · [09:10] · "not enough room for the layer underneath"; Jaye · `Jz9QVWgBbOg` · [23:19] · "your shirt too bulky, your jacket too bulky"; Frugal · `Jh8dz-KZcfY` · [02:08] · "fitted shirt and an oversiz shirt with the exact same jacket"
- **The four:** Tim, Jaye and Frugal agree; Wanhee adds that an off-size piece works when placed (a too-small tee inside a looser jacket, fit.5).
- **Engine today:** has it differently [PRO-6], [PRO-14] (a short jacket earns credit; a long coat neither earns nor costs, which matches Tim); lacks the outer-vs-inner room check ([PRO-11] never charges a roomy top under a jacket).
- **AI can see it:** weakly (`volume` per garment and the jacket's `length`; an inner layer's volume is often hidden; `shows_below_outer` helps).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-09-15.jpg` (checked: a collage of outfits; which one is the tight overshirt is unclear)

#### sil.6. A big coat, ideally with broad, structured shoulders, lifts a plain outfit.
- **Strength:** lift. **Holds when:** cold weather, smart or casual; the coat has structure at the shoulder and room under it. **Doesn't:** a tight coat over a knit (sil.5).
- **Interacts with:** sil.3 (structured shoulders move weight up, so the leg must carry it), suit.2 (the same shoulder logic in tailoring), season.
- **Sources:** Tim · `XIYvycsZxDk` · [05:08] · "a nice coat just makes everything look better"; Tim · `-e9Is50-fn0` · [04:26] · "will improve any cold weather outfit, smart or casual alike"; Tim · `-e9Is50-fn0` · [08:46] · "royal power silhouette like you mean business"; Tim · `XSF9AOx7sdU` · [00:34] · "try jackets that have more structure around the shoulders"; Frugal · `JY_zrt43cbU` · [04:53] · "its commanding shape and yearround use case" (the bomber)
- **The four:** Tim (most); Frugal agrees for the bomber's shape; others silent.
- **Engine today:** lacks it (an overcoat earns no shape credit; [PRO-6] excludes it).
- **AI can see it:** weakly (`subcategory` overcoat; shoulder structure isn't read).
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-05-13.jpg` (checked: a long black coat over straight blue jeans)

#### sil.7. In one color (or an all-neutral palette), the outline is the whole outfit: a bad shape shows more, a deliberate strong shape reads better.
- **Strength:** nuance (it scales the shape rules up). **Holds when:** all black, all white, or a quiet neutral palette (city boy, quiet luxury); Frugal says you can push proportions further here "as long as you're deliberate". **Doesn't:** texture and tone contrast bring some piece edges back.
- **Interacts with:** color (one color hides the waist break and hem lines, so the outer outline is what's left), prop.2 (the thirds matter less when the line is invisible), layering-texture (all black needs texture; that part owns it).
- **Sources:** Frugal · `Vn6KlXkU2xA` · [09:16] · "your whole fit is one color your entire silhouette is completely exaggerated"; Frugal · `Vn6KlXkU2xA` · [09:46] · "you can't even tell where the pieces end and start"; Frugal · `Vn6KlXkU2xA` · [10:51] · "Min maxing the proportions slider usually will work pretty well"; Frugal · `9GFKiZx89oM` · [07:11] · "the absence of color leaves more room in the mix"; Wanhee · `ew3gCk1zkso` · [10:42] · "a little bit more elongated"; Wanhee · `B9PIhkSQKuw` · [04:20] · "it's very based on a silhouette"; Jaye · `7K2qRZaXX3w` · [03:41] · "wear black but wear some flare pants or wear a black coat"; Frugal · `EnLlL2XKRCA` · [10:03] · "relying on the crutch of graphics and over accessorizing"
- **The four:** all agree.
- **Engine today:** lacks it (one-color outfits get only the [COL-7] tip; shape rules weigh the same).
- **AI can see it:** yes for one color (`color_family` across pieces); weakly for the shape itself, and piece boundaries in all black may be hard for the reader too.
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-09-51.jpg` (checked: two all-black silhouettes)

#### sil.8. The 2026 leg is straight to relaxed (Tim) or barrel (Frugal); a straight leg is the one that works with every shoe.
- **Strength:** nuance (trend; no charge between straight, relaxed, wide and barrel). **Holds when:** jeans and casual trousers in 2026; Tim's wide pleated trousers look better cut straight than tapered. **Doesn't:** the very wide, "stepping on the pant" extreme is passing for Tim; skinny is handled by fit.6.
- **Interacts with:** shoes (a straight leg lets sneakers lead and suits low and high tops alike), prop.9 (a wide leg changes the right hem).
- **Sources:** Tim · `30L-EHe4WAQ` · [00:00] · "the inevitable pendulum swing back towards more balanced, straighter"; Frugal · `TUYSTimnDJg` · [00:00] · "agreeing on barrel-legged genes" (caption: jeans); Wanhee · `ew3gCk1zkso` · [03:47] · "just a straight fit relaxed straight fit jeans slacks chinos"; Tim · `FUWET2HH-us` · [01:38] · "which I think gives them a much better silhouette"; Frugal · `WDsQRHa8jBY` · [09:12] · "maybe you want a neutral straight fit to let the shoes shine"; Frugal · `WDsQRHa8jBY` · [09:12] · "if this pants silhouette works with both low tops and high tops"
- **The four:** Tim, Wanhee and Frugal agree on straight as the safe default; Tim (straighter) and Frugal (barrel, fuller through the knee) differ on direction, both in 2026; Jaye silent.
- **Engine today:** has it [PRO-13] (only slim and skinny cost; straight, relaxed, wide and barrel are equal).
- **AI can see it:** yes (`leg_shape` has straight, relaxed, wide and barrel), weakly at slim vs straight.
- **Frame:** none (described only; `inputs/youtube/shots/TUYSTimnDJg/f-00-05.jpg` checked: a title collage, no barrel jean)

#### sil.9. Flares or bootcuts over boots make the hourglass (X) shape, if the flare lands on the shoe.
- **Strength:** lift. **Holds when:** a flare or bootcut long enough to sit over a boot or heavy shoe, often under a fitted or open top. **Doesn't:** a flare that stops short or doesn't sit on the shoe "loses the point"; Frugal calls flares hard to pull off.
- **Interacts with:** prop.1 (length is the whole rule for a flare), shoes (boots), sil.2.
- **Sources:** Jaye · `Pxeeh-caTJg` · [22:13] · "So, this creates an hourglass silhouette."; Frugal · `WDsQRHa8jBY` · [09:12] · "I really like the way flared pants look on boots"; Frugal · `xL1NeaA9D-Y` · [05:27] · "being deliberate with how the flare sits is really the key"; Frugal · `4hwelpjhDTM` · [09:48] · "it's kind of hard to pull off pants sometimes"; Jaye · `7K2qRZaXX3w` · [03:41] · "wear black but wear some flare pants or wear a black coat"
- **The four:** Jaye and Frugal agree (others silent).
- **Engine today:** lacks it (`flare_bootcut` earns nothing on its own).
- **AI can see it:** yes (`leg_shape` flare_bootcut, shoe `subcategory`), weakly for whether it lands (`hem`).
- **Frame:** `inputs/youtube/shots/Pxeeh-caTJg/perfect-all-black-19-38.png` (checked: the all-black outfit; no still after [22:13])

#### sil.10. Relaxed or fitted is a choice; what fails is a shape that isn't deliberate.
- **Strength:** nuance. **Holds when:** within one style world, a relaxed jean and a fitted tapered one are both right; a slim Italian suit is as valid a silhouette as a flowing or O-shaped one. **Doesn't:** skin-tight (fit.2) and swamping (fit.3) are outside the range; skinny is mostly out (fit.6).
- **Interacts with:** fit.6 (the engine charges slim; this rule is why that is a founder call, not a creator consensus), style worlds.
- **Sources:** Tim's guest · `OqoUgLxknJc` · [18:15] · "go for the more relaxed and I'm a bit more fitted"; Tim · `wIib9hzVUuw` · [01:01] · "there isn't one specific way every piece of clothing has to fit"; Tim · `jaOSdGqtgYY` · [12:25] · "remix them in my own way with roomier Silhouettes"; Wanhee · `ew3gCk1zkso` · [11:15] · "really Slim like put together Italian guy in a suit"; Frugal · `FlQ3WZ-H2Ik` · [03:50] · "multiple ways you would want a shirt to fit on you"; Frugal · `8rmkOpCbFTM` · [11:39] · "Good styling and proper pairing can make any proportion look good"; Jaye · `sOfjDjtjBWM` · [11:53] · "they're pretty much equal if you're wisdom K"
- **The four:** all agree.
- **Engine today:** has it differently [PRO-13] (slim −1.0 everywhere but tailoring, the founder's Oct 14 call) and [PRO-11] (per-look roominess bands).
- **AI can see it:** weakly ("deliberate" isn't a field; it shows only as every piece agreeing).
- **Frame:** none (described only)

#### sil.11. A jacket over shorts can work when the silhouette is right.
- **Strength:** nuance. **Holds when:** a boxy jacket over shorts with a clean palette (Tim's example: black and brown). **Doesn't:** blazers or leather jackets over athletic shorts are a separate question (dealbreakers S5, S7; not covered by these notes).
- **Interacts with:** prop.15 (shorts proportions), season.
- **Sources:** Tim · `YGm7JMniGVc` · [01:10] · "you could pull this off in shorts but I've been proven wrong"
- **The four:** only Tim (others silent).
- **Engine today:** has it [PRO-15] (a short jacket over loose shorts +1.0).
- **AI can see it:** yes (`subcategory`, `length` of the jacket, shorts `leg_shape`).
- **Frame:** pending (`inputs/youtube/shots/YGm7JMniGVc/f-01-12.jpg` checked: Tim in a jacket, not the shorts outfit)

---

### Proportions (prop.*)

#### prop.1. The hem against the shoe makes or breaks the outfit: trousers should reach the shoe, with no break or one clean break; dragging or flapping short ruins it.
- **Strength:** dealbreaker for clearly too long on a straight, slim or smart leg (fabric piling or dragging) and for a clear gap above the shoe on a full leg; fault for a heavier-than-ideal break. **Holds when:** jeans, chinos and trousers, every look; Frugal says 90% of an outfit can be right and the hem still makes "the whole thing" trash. **Doesn't:** a soft stack on a wide or relaxed leg over a chunky shoe (prop.9); a deliberate crop on a wide leg with loafers (prop.12); cinched or elastic hems (prop.10); Wanhee's 2026 street exception for dragging jeans (prop.16).
- **How to see it in a photo (the break):** look at the bottom 15 cm of the trouser against the shoe. Count the folds: none (no break, hem just reaches the shoe top), one small fold (slight break), one clear fold resting on the shoe (full break), several gathered folds (stack), fabric dragging on or past the heel (pooling), or a gap of sock or ankle (cropped). Then judge it against the leg width: slim plus many folds is too long; wide plus ending above the shoe is too short unless it's a deliberate wide crop; wide plus soft gathers over a chunky sneaker is a deliberate stack.
- **Interacts with:** prop.2 (a pooled hem shortens the long lower block), shoes (the shoe sets the right length, prop.10–prop.11), sil.9 (flares need length), color (trousers matching the shoe keep the eye up, Tim `wIib9hzVUuw` [08:07]).
- **Sources:** Tim · `SNjfZ5NKndc` · [00:00] · "Pant break will quite literally make or break your outfit."; Tim · `SNjfZ5NKndc` · [00:00] · "Too short and it will ruin your silhouette"; Tim · `SNjfZ5NKndc` · [00:00] · "Too long and it'll look sloppy"; Tim · `wIib9hzVUuw` · [10:40] · "Enough room in the thighs, straight cut, one break on the shoe"; Tim · `K2HS3_8cTx8` · [03:15] · "not too short not too long barely touching the shoe"; Tim · `zJ5LCenTcf8` · [01:10] · "fit you perfectly at the waist but just seemed way too long"; Frugal · `XtcY-zmoS-E` · [05:08] · "the silent killer of most people's outfits"; Frugal · `XtcY-zmoS-E` · [05:38] · "90% of the time it is a length problem"; Frugal · `XtcY-zmoS-E` · [06:38] · "as soon as the pants and the shoes don't work together"; Frugal · `8rmkOpCbFTM` · [10:27] · "shoe pants pairing is where it matters the most"; Wanhee · `ew3gCk1zkso` · [02:06] · "that goes all the way to your shoes normal"; Wanhee · `tNVdA_arEa8` · [03:36] · "it just all falls apart" (a bit of ankle in the loose style)
- **The four:** Tim, Frugal and Wanhee agree; Jaye silent here (he wears flares long). Frugal's own 2026 note that the lower legs sit outside the eye line (`RlcdMBj5Z2E` [06:25]) is weaker than his repeated "silent killer" and is set aside.
- **Engine today:** has it differently [FIT-4] (piling on a straight or narrow leg −1.5 to −2.0 on Fit, worth 0.15 a point), [PRO-8] (pooling blocks shape credits), [SHO-2]; no cap (dealbreakers H7 proposes one), no charge for too short, no credit for a clean break.
- **AI can see it:** weakly (`hem` is a known weak read, 64–68% steady); the shoe close-up (look L, "covers the shoe mostly", 97%) reads piling well; deliberate stack vs pooling share one value.
- **Frame:** `inputs/youtube/shots/XtcY-zmoS-E/f-06-43.jpg` (checked: trousers piling on the shoe, "too long i think")

#### prop.2. Split the outfit unequally (about one third and two thirds), not in half.
- **Strength:** lift (a clear thirds split) / fault (the 50/50 "cut in half" look). **Holds when:** usually a short top block over long legs; the reverse (a long coat or long top over a short visible bottom) works too. **Doesn't:** Wanhee shows a low, long split that "doesn't look that bad" when committed to (prop.16); Frugal calls the thirds a guide, not the whole answer; in tonal or all-black outfits the line is hidden, so the outline takes over (sil.7). Jaye's "rule of thirds" is mostly about framing photos, not outfits.
- **How to see it in a photo (the rule of thirds):** ignore the person and measure the clothes. Top block: from the collar to the lowest visible hem of the top layer (or the tuck line). Bottom block: from there to where the trousers end on the shoe. About 1:2 (or 2:1 with a long coat) passes; a top ending about halfway between collar and trouser hem (a long untucked tee, a hip-length jacket over low-rise trousers) is the "cut in half" look. With an open jacket there are two lines; the jacket's hem matters most when it is closed.
- **Interacts with:** prop.3 (the waist break is how you get it), prop.8 (rise moves the line), prop.1 (a pooled hem shortens the bottom block), color (the split only shows if top and bottom differ in lightness).
- **Sources:** Wanhee · `RtxJqd5Drps` · [01:04] · "a third top, 2/3 at the bottom"; Wanhee · `RtxJqd5Drps` · [01:04] · "So, I kind of cut my body in half." (trousers worn low under an untucked tee); Wanhee · `RtxJqd5Drps` · [01:40] · "It's about the proportions that you're creating."; Wanhee · `ew3gCk1zkso` · [11:15] · "one third top and then two thirds"; Frugal · `k6Gig6r7BSQ` · [05:44] · "give things more room to breathe"; Frugal · `If6OJBbi_-8` · [17:04] · "a good visual guide to fit building content creator copout"; Tim · `0ilmLux6mPg` · [08:51] · "Where should your tops end?"; Jaye · `23ZCHsp9AZU` · [05:04] · "I would recommend using the rule of thirds right"
- **The four:** all agree on an unequal split; Wanhee (2026) and Tim say the short-top version isn't the only right one; nobody gives numbers.
- **Engine today:** has it differently [PRO-4] pays for the short-top side; the 50/50 fault is only a tip ([PRO-10], KD-8).
- **AI can see it:** weakly (`length` + `tucked` give where the top ends; rise isn't read; `below_crotch` almost never fires).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-01-09.jpg` (checked: an outfit with the thirds marked)

#### prop.3. Make a waist break: a tuck, a top ending at the belt, a crop, or a jacket that stops where the trousers start; strongest over a fuller leg.
- **Strength:** lift (a big one). **Holds when:** the trouser waistband (or a tuck line) is visible or the top's hem is within a hand's width of it; over relaxed, wide or pleated legs it is the look; with high-waisted trousers it rebalances the outfit. **Doesn't:** over skinny or slim legs it does little; a tuck into sweatpants or under a street cap can read odd (prop.7); a cinched hoodie over a long base layer can make the line instead.
- **How to see it in a photo (the waist break):** find the trouser waistband. Can you see it, a belt or a tuck line? Does the top end at it, or within a hand's width? Or does the top hang to mid-fly or below and hide it? With an open jacket, check the inner top. Same-color top and trousers make the line soft; contrast makes it sharp.
- **Interacts with:** prop.2 (it creates the thirds), sil.2 (it makes the A or X readable), prop.8 (high rise plus tuck), color.
- **Sources:** Frugal · `k6Gig6r7BSQ` · [06:14] · "creates more space between your top and your pants"; Frugal · `XtcY-zmoS-E` · [04:38] · "hourglass situation creates separation from my top and my bottom"; Frugal · `TnNv7Zvui6E` · [01:03] · "great for creating separation from your top and and your bottom"; Tim · `-V2bE8nDsdo` · [04:37] · "oversized t-shirt tucked into the tailored trousers"; Tim · `0ilmLux6mPg` · [08:15] · "the jacket cuts abruptly where the trouser starts"; Tim · `XSF9AOx7sdU` · [00:00] · "try tucking in your top into some high-waisted trousers"; Wanhee · `RtxJqd5Drps` · [01:40] · "Top 1/3, 2/3 at the bottom."; Jaye · `Jz9QVWgBbOg` · [23:49] · "A crop t-shirt is probably going to look better."
- **The four:** all agree; they split only on how much crop (prop.4).
- **Engine today:** has it [PRO-4] (+1.5 over a loose leg, +0.5 over straight, nothing over slim), [PRO-5], [PRO-14], [PRO-17]; dealbreakers L1.
- **AI can see it:** yes for the tuck (`tucked`), weakly for "ends at the belt" (`length` at_belt vs mid_fly is the reader's most common length mistake); half tuck and belt not read.
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-12.jpg` (checked: a white tee tucked into black trousers)

#### prop.4. How much crop: a little goes a long way; most people wear tops too long, but a super-cropped boxy tee is its own trend look.
- **Strength:** nuance. **Holds when:** a top ending at or just above the belt is safe for all four; a fitted crop over wide legs is Frugal's favorite. **Doesn't:** Wanhee and Tim stop at the belt or tuck instead; Frugal's 2026 bulky-sneaker template wants "Neutral to longer length" and "Nothing too cropped. Nothing boxy." (the heavy shoe changes the right top length).
- **Interacts with:** shoes (bulky sneakers favor a neutral length), prop.3, prop.6.
- **Sources:** Frugal · `k6Gig6r7BSQ` · [10:22] · "you have been wearing shirts longer than they're supposed to be"; Frugal · `8rmkOpCbFTM` · [09:22] · "Slightly oversized top. Neutral to longer length."; Frugal · `8rmkOpCbFTM` · [09:54] · "Nothing too cropped. Nothing boxy."; Tim · `vziGl_FxQb0` · [03:48] · "It has a boxy modern fit, slightly cropped"; Tim's guest · `OqoUgLxknJc` · [03:51] · "so it adds a nice shape to the outfit"; Wanhee · `Mr-GzwGQ1qY` · [06:04] · "not too cropped like those fashion influencers"; Wanhee · `Mr-GzwGQ1qY` · [03:32] · "the length of it is a little long for me"; Jaye · `Jz9QVWgBbOg` · [23:49] · "A crop t-shirt is probably going to look better." (under a leather jacket)
- **The four:** Frugal and Jaye like crop; Tim likes "slightly cropped" knits and jackets and the tuck; Wanhee rejects the super-cropped look but also faults a tee that runs long. Frugal's 2026 bulky-shoe exception contradicts his own 2023 crop video; newest wins only for bulky shoes.
- **Engine today:** has it [PRO-4] (cropped and at_belt count the same; no extra for crop, no charge for super-cropped).
- **AI can see it:** yes (`length` cropped / at_belt), weakly between them.
- **Frame:** pending (`inputs/youtube/shots/FlQ3WZ-H2Ik/f-07-04.jpg` checked: a text card)

#### prop.5. A short jacket over full legs adds interest and shows the legs, even on a plain monochrome outfit.
- **Strength:** lift. **Holds when:** a bomber, trucker, leather or slightly cropped jacket (a jacket ends at the hip or above) over straight, relaxed or wide legs. **Doesn't:** over skinny legs; the outsiders' "a short jacket splits you in half" is dropped (the four read that line as a deliberate waist break).
- **Interacts with:** sil.5, prop.3, color (on a monochrome outfit the hem line does what color can't).
- **Sources:** Tim · `XIYvycsZxDk` · [03:25] · "adds some visual interest to this otherwise plain monochrome outfit"; Tim · `wIib9hzVUuw` · [04:35] · "slightly cropped jacket"; Tim · `0ilmLux6mPg` · [08:51] · "A short jacket can emphasize the legs"; Frugal · `4hwelpjhDTM` · [09:48] · "a nice contrast with how popular oversized jackets have been"; Frugal · `jD6X3-yQDFw` · [10:34] · "all short outer garments usually laying around hip level or above"
- **The four:** Tim and Frugal agree; Jaye uses short outer layers as the easy option (`RIuzSb8OLMM` [10:11]); Wanhee silent.
- **Engine today:** has it [PRO-6] (+1.5 by jacket type), [PRO-14] (+1.0 for any layer read at the belt over a loose leg); dealbreakers L2.
- **AI can see it:** yes (`subcategory`, jacket `length`).
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-03-30.jpg` (checked: a short tan jacket over full grey trousers)

#### prop.6. An oversized top should be big in width and sleeve, not in length: a long body that covers the waist and hangs toward the thigh is the fault.
- **Strength:** fault (Tim's "biggest pet peeve"). **Holds when:** an oversized tee long in the body with regular-length sleeves; a long untucked flannel down the thigh; a tee long enough to "look like a dress". **Doesn't:** a long coat or a deliberate long-and-low look (prop.16); Frugal's neutral-to-longer top with bulky sneakers (prop.4) is not this long.
- **Interacts with:** prop.2 (a long body kills the thirds), fit.5 (oversized done right), sil.2.
- **Sources:** Tim · `a7FgCE9NPmw` · [02:15] · "too long in the body with regular length sleeves"; Tim · `a7FgCE9NPmw` · [02:15] · "more oversized in the width of the body and the sleeve length"; Frugal · `FlQ3WZ-H2Ik` · [09:37] · "creates a completely different shape without it looking like a dress"; Wanhee · `ew3gCk1zkso` · [11:47] · "long vintage like flannel shirts that go way down to your thigh"; Jaye · `Jz9QVWgBbOg` · [23:49] · "there's no reason you should have a extremely long white t-shirt"
- **The four:** all agree.
- **Engine today:** lacks it (only the [PRO-10] tip "a top that may run past the fly"; dealbreakers S3 and H2 propose caps).
- **AI can see it:** weakly (`length` below_crotch almost never fires; long reads as mid_fly about a quarter of the time).
- **Frame:** `inputs/youtube/shots/a7FgCE9NPmw/f-02-55.jpg` (checked: an oversized tee with a shorter body, the right version; no still 0–20 s after [02:15])

#### prop.7. Tucking is a tool, not a rule: it smartens a simple outfit, but untucked is often the more balanced choice.
- **Strength:** nuance. **Holds when:** a tee tucked into trousers reads smarter (dinner, darker pieces); a high rise invites a tuck for "that classic look"; a shirt tucked under a hoodie keeps the layers from bunching. **Doesn't:** untucked is never a fault on a casual outfit; a dress shirt untucked under a blazer is ([CON-3], suit.8); a tuck into sweatpants or with a streetwear cap can look wrong.
- **Interacts with:** prop.3, prop.8 (needs a defined, higher waist), formality.
- **Sources:** Tim · `XSF9AOx7sdU` · [00:34] · "it could look better to not tuck in your top"; Tim's guest · `OqoUgLxknJc` · [08:07] · "just tucked in the t-shirts"; Frugal · `xL1NeaA9D-Y` · [08:07] · "you can tuck your shirt if you really like that classic look"; Frugal · `Jh8dz-KZcfY` · [05:56] · "just tucking the shirt to leave room for the hoodie"; Wanhee · `RtxJqd5Drps` · [01:04] · "So, I kind of cut my body in half." (untucked over low trousers)
- **The four:** Tim, Frugal and Wanhee agree; Jaye adds that a high rise with a tuck or crop is "harder to pull off" (`RIuzSb8OLMM` [14:14]).
- **Engine today:** has it [PRO-4] (tuck credit), [PRO-8] (sweats block it), [CON-3] (untucked dress shirt under a blazer −0.6); untucked is never charged.
- **AI can see it:** yes (`tucked` none/half/full; half is untested).
- **Frame:** pending (`inputs/youtube/shots/OqoUgLxknJc/f-08-12.jpg` checked: outfit 1, untucked tees)

#### prop.8. Rise is a lever: a high rise with a tuck or a jacket lengthens the leg line, low rise under an untucked top cuts the outfit in half, mid rise is the safe everyday choice.
- **Strength:** lift (high rise with a tuck or a jacket) / fault (low rise under a jacket or long top). **Holds when:** visible only when the top is tucked, cropped or the jacket is open. **Doesn't:** low-rise jeans worn casually are not a fault on their own; Jaye says high rise is hard to pull off.
- **Interacts with:** prop.2, prop.3, suit.5.
- **Sources:** Jaye · `RIuzSb8OLMM` · [13:43] · "Low rise cuts your" (proportions, [14:14]); Jaye · `RIuzSb8OLMM` · [14:14] · "Mid rise is easily the safest option"; Jaye · `RIuzSb8OLMM` · [14:14] · "High rise on the other end, it elongates your legs."; Wanhee · `RtxJqd5Drps` · [01:04] · "So, I kind of cut my body in half."; Frugal · `xL1NeaA9D-Y` · [06:33] · "how long are your pants, how do your pants stack"; Frugal · `XtcY-zmoS-E` · [03:06] · "they really open up what I can wear up top"; Tim · `0ilmLux6mPg` · [09:21] · "high-rise jeans with just a little more room in the leg"; Tim · `vziGl_FxQb0` · [05:56] · "a voluminous wide straight cut with a high-rise"
- **The four:** all agree.
- **Engine today:** lacks it.
- **AI can see it:** no (rise isn't read; a tuck or open jacket shows it only to a person).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-01-09.jpg` (checked: the thirds diagram; the rise itself isn't shown)

#### prop.9. A soft stack is part of the shape on a wide or relaxed leg over a substantial shoe; the many-fold stack on a skinny jean is dated.
- **Strength:** nuance (no charge) / lift in a relaxed, deliberate look. **Holds when:** generous trousers stacking a little over chunky sneakers or slim sneakers with the toe showing; wide parachute trousers worn long. **Doesn't:** on smart trousers Tim calls more than one break "stacking territory" (sloppier); the 2016 skinny-jean "how many stacks" look; a straight or slim leg piling up (prop.1).
- **Interacts with:** prop.1, sil.4, prop.10, color (Tim's stack works because the palette is minimal).
- **Sources:** Frugal · `8rmkOpCbFTM` · [04:58] · "a nice generous pair of pants stacking over top"; Frugal · `8rmkOpCbFTM` · [06:37] · "a nice organic looking cozy little bit of stack"; Frugal · `8rmkOpCbFTM` · [06:37] · "It was like how many stacks" (the dated version); Tim · `XIYvycsZxDk` · [01:07] · "nicely stacking on top of these Salamon sneakers"; Tim · `o5RnTT2oafg` · [01:09] · "rock them long and stacking a bit on the shoe"; Tim · `SNjfZ5NKndc` · [00:30] · "Anything more than one break goes into stacking territory"; Frugal · `JY_zrt43cbU` · [06:31] · "I want to be stepping on the pant" (today's extreme cargo, said half mocking)
- **The four:** Tim and Frugal agree on the soft stack over wide legs and against the skinny stack; Jaye lists "stacking pants" as something beginners copy without understanding (`UcLBvcmnnus` [02:10], from `concepts.md`); Wanhee (2026) allows dragging in street looks (prop.16).
- **Engine today:** has it [FIT-4] (no charge for jeans and cargos on a loose leg; −0.5 for trousers), [STR-12], [PRO-8].
- **AI can see it:** weakly (`hem` pooling serves both the stack and the drag; look L says how much of the shoe is covered, not how deliberate it is).
- **Frame:** pending (`inputs/youtube/shots/XIYvycsZxDk/f-01-12.jpg` checked: a title card)

#### prop.10. A bulky shoe needs a generous leg; a slightly higher hem or a cinched hem is fine over it.
- **Strength:** lift (generous leg over a chunky shoe) / fault (a chunky shoe under slim or skinny legs). **Holds when:** chunky runners, trail and dad shoes, boots; the leg "doesn't have to be baggy" but needs some shape; cinched joggers or cargos make a narrow point that sets off the shoe. **Doesn't:** Frugal's own note that a chunky designer sneaker under very wide jeans didn't help (frugal-3 R1).
- **Interacts with:** sil.3 (a chunky shoe adds weight below), prop.1 (the hem may sit higher here), shoes.
- **Sources:** Frugal · `8rmkOpCbFTM` · [09:22] · "a more generous pair of pants does these shoes justice"; Frugal · `8rmkOpCbFTM` · [09:54] · "Doesn't have to be baggy."; Frugal · `8rmkOpCbFTM` · [11:02] · "the contrast between your big shoes and your pants always works"; Frugal · `8rmkOpCbFTM` · [09:22] · "anything that you can kind of cinch at the bottom"; Frugal · `FFDYIGhiIk8` · [13:24] · "these work really well with bag your pants" (caption: baggier)
- **The four:** Frugal (most), Tim (cargos stacking on Salomons, prop.9) and Jaye (heavy boots under flares and wide pants) agree; Wanhee's "a bit of ankle falls apart" (`tNVdA_arEa8` [03:36]) is against the higher hem, in the loose style.
- **Engine today:** has it [SHO-9] (chunky under slim or skinny −1.5), [STR-6] (+0.5 chunky under wide in streetwear); lacks the higher-hem allowance.
- **AI can see it:** yes (`subcategory` chunky/basketball/running, `leg_shape`), weakly at slim vs straight; dealbreakers H10.
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-11-07.jpg` (checked: "for bulky sneakers: all big pants work")

#### prop.11. A slim, low-profile shoe under a full leg is a great contrast, if the trousers are long enough to cover most of it.
- **Strength:** lift / fault (a cropped or skinny leg over a slim sneaker). **Holds when:** a Samba-type sneaker, loafer or derby under straight, wide or generous trousers with a long or medium inseam, just the toe showing. **Doesn't:** a short hem over a slim sneaker exposes it and loses the contrast; the cropped-wide-leg-with-loafers exception (prop.12).
- **Interacts with:** prop.1, prop.9, shoes.
- **Sources:** Frugal · `8rmkOpCbFTM` · [04:58] · "a nice generous pair of pants stacking over top"; Frugal · `8rmkOpCbFTM` · [10:27] · "I suggest a long or medium inseam"; Tim · `0ilmLux6mPg` · [08:15] · "barely breaking on the shoes" (pleated trousers over loafers)
- **The four:** Frugal and Tim agree; Wanhee's trousers falling on the laces fit; Jaye silent.
- **Engine today:** has it differently [SHO-12] (dress shoes under wide legs: nothing, not even a tip); lacks the contrast credit and the cropped-over-slim-sneaker fault.
- **AI can see it:** yes (`subcategory`, `leg_shape`), weakly for `hem`.
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-05-03.jpg` (checked: the slim sneakers alone, not under trousers)

#### prop.12. A deliberate crop on a wide leg, with loafers and visible socks, is a current look, not a short hem.
- **Strength:** nuance (an exception to prop.1). **Holds when:** a clearly cropped wide or baggy leg, a slim dress shoe, socks showing. **Doesn't:** a straight or slim leg that just stops short; Tim phased out his deeper crops and wants the hem "barely touching the shoe"; Wanhee says a bit of ankle makes the loose style fall apart.
- **Interacts with:** prop.1, prop.11, season (a crop is a warm-weather choice; bare ankles in winter are Tim's "cardinal sin", the season part).
- **Sources:** Frugal · `xL1NeaA9D-Y` · [04:18] · "Like this is a very big combo right now."; Tim · `K2HS3_8cTx8` · [03:15] · "not too short not too long barely touching the shoe"; Wanhee · `tNVdA_arEa8` · [03:36] · "it just all falls apart"
- **The four:** only Frugal for; Tim and Wanhee lean against; Jaye silent.
- **Engine today:** lacks it (a cropped hem is neither credited nor charged).
- **AI can see it:** weakly (`hem` cropped); no (socks aren't read).
- **Frame:** pending (`inputs/youtube/shots/xL1NeaA9D-Y/f-04-23.jpg` checked: baggy jeans over chunky shoes, not the cropped loafer look)

#### prop.13. A peek of the under-layer lifts; a long hang below the jacket costs. Layer lengths are part of the composition.
- **Strength:** lift (a small peek, a cropped hoodie under a bomber) / fault (a long tee hanging well below a short jacket). **Holds when:** a shirt edge or a thin band showing below or at the opening of a jacket. **Doesn't:** in a casual outfit a tee showing below a cropped jumper is fine; tuck it for a neater finish.
- **Interacts with:** prop.6, sil.5, layering.
- **Sources:** Frugal · `Jh8dz-KZcfY` · [05:22] · "a shirt just peeking through a jacket can completely change a look"; Frugal · `Jh8dz-KZcfY` · [02:08] · "I like playing with a cropped hoodie to play with a composition"; Jaye · `Jz9QVWgBbOg` · [23:49] · "there's no reason you should have a extremely long white t-shirt"; Tim's guest · `OqoUgLxknJc` · [13:26] · "because this outfit's so casual you can have it hanging out"
- **The four:** Frugal and Jaye agree (the line between them is how much shows); Tim's guest allows it in casual; Wanhee silent.
- **Engine today:** has it [PRO-9] ("clearly" −0.5 and no shape credit; "a little" free).
- **AI can see it:** yes (`shows_below_outer` and look U; "a little" is the weaker answer, 71–82%).
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-05-27.jpg` (checked: a layered coat, denim jacket and tee; the peek is small)

#### prop.14. The break follows the formality: a slight break is the classic office finish; a full break needs a fashion-forward rest of the outfit.
- **Strength:** nuance. **Holds when:** the same smart trouser can go either way. **Doesn't:** jeans and casual trousers follow prop.1 and prop.9.
- **Interacts with:** suit.3, occasion.
- **Sources:** Tim · `FUWET2HH-us` · [01:38] · "take more risk with a full brake" (caption: break)
- **The four:** only Tim (others silent).
- **Engine today:** has it differently [FIT-6] (a full break on slim pants is a tip); no difference by formality.
- **AI can see it:** weakly (`hem` slight_break vs full_break).
- **Frame:** none (described only)

#### prop.15. Shorts and cuffs: big shorts work with slim or bulky shoes; a cuffed jean adds a small detail, edgier over boots, but pulls the eye down over a contrasting sneaker.
- **Strength:** lift (small) / nuance. **Holds when:** wide shorts with any real shoe; cuffed light jeans over boots on a plain outfit. **Doesn't:** Tim avoids cuffs over a different-colored sneaker because the eye goes to the feet.
- **Interacts with:** sil.11, shoes, color.
- **Sources:** Frugal · `8rmkOpCbFTM` · [11:02] · "big shorts I feel works well with both slim and bulky profile"; Tim's guest · `OqoUgLxknJc` · [09:12] · "cuffed up make it look a little bit edgier"; Tim · `wIib9hzVUuw` · [08:07] · "especially if the jeans are cuffed like in the original outfit"
- **The four:** Frugal and Tim (with his guest) agree; others silent.
- **Engine today:** has it [PRO-15], [PRO-16] for shorts; cuffed hems cost nothing; lacks the cuff-over-contrasting-sneaker read.
- **AI can see it:** yes (`hem` cuffed, shorts `leg_shape`), weakly for cuffs.
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-09-17.jpg` (checked: cuffed light jeans over black boots)

#### prop.16. There is no single right proportion: the proportions you create are the look, and a committed long, low or dragging street proportion can work.
- **Strength:** nuance (it limits how hard the other prop rules should bite). **Holds when:** the whole outfit commits to the shape (very baggy, low, long in a street look). **Doesn't:** Frugal (dragging hems ruin it) and Jaye ("flailing" baggiest jeans) disagree, and so did Wanhee in 2023.
- **Interacts with:** prop.1, prop.2, style worlds.
- **Sources:** Wanhee · `RtxJqd5Drps` · [00:33] · "There's not necessarily a right or wrong proportion"; Wanhee · `RtxJqd5Drps` · [01:40] · "It doesn't look that bad."; Frugal · `env4ZvWzcd4` · [01:02] · "entirely dependent on the styling"; Tim · `0ilmLux6mPg` · [08:51] · "There is no universally correct answer."
- **The four:** Wanhee (2026) and Tim agree in principle; Frugal and Jaye differ on dragging hems (prop.1; Jaye `7K2qRZaXX3w` [06:53], "flailing everywhere in the wind").
- **Engine today:** has it differently (fixed credits and charges; [FIT-4] already frees a stack on loose jeans).
- **AI can see it:** no ("committed" isn't readable; only every piece agreeing).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-00-05.jpg` (checked: the two-picture comparison at [00:00])

---

### Fit (fit.*)

#### fit.1. Fit is the floor: without it nothing else works, and adding pieces (a jacket, a loud shoe) can't cover a fit fault. Trousers matter most because nothing hides them.
- **Strength:** dealbreaker (a clear fit fault on a main piece, especially the trousers, caps the outfit whatever else is right). **Holds when:** the faults are visible: pulling (fit.2), swamping or sagging (fit.3), piling (prop.1), sleeves over the hands (fit.9, suit.7). **Doesn't:** a tee hidden under a jacket matters less ("you can't cheat pants" cuts one way only).
- **Interacts with:** every part; layering and shoes must not be allowed to buy back a fit fault underneath.
- **Sources:** Jaye · `7K2qRZaXX3w` · [06:53] · "the whole operation cannot work if you don't got that"; Frugal · `WDsQRHa8jBY` · [07:29] · "fit is the bottleneck of all things especially" (pants); Frugal · `WDsQRHa8jBY` · [06:23] · "a slight miscalculation in this could be catastrophic" (pant shape); Frugal · `4Jrq_F1Ayp8` · [12:55] · "but you can't cheat pants"; Frugal · `WMwH8xtSOWA` · [05:30] · "compensate a lack of chemistry between pieces by adding more material"; Frugal · `4DHGKfe-Vho` · [01:03] · "especially when it doesn't fit can be very revealing"; Tim · `XSF9AOx7sdU` · [01:37] · "build a wardrobe of good Basics that fit you perfectly"; Tim · `IUMqpLeCT-E` · [01:40] · "great Staples that fit you well"; GQ (outsider) · `4fb4GyOylK8` · [15:51] · "The most important thing of any suit is the fit"
- **The four:** all agree.
- **Engine today:** has it differently [FIT-1]–[FIT-5]: Fit is 15% and only finds faults, so a fit fault moves the score a few tenths and never caps it; [FIT-5] weighs the worst piece, not trousers over tops.
- **AI can see it:** weakly (`strain` and `hem` are weak reads; `sleeve_end` fair).
- **Frame:** none (described only)

#### fit.2. Nothing skin-tight: trousers tapering tight from hip to ankle, a second-skin or muscle tee, a shirt straining at the buttons.
- **Strength:** fault. **Holds when:** fabric pulls, creases radiate, the leg hugs. **Doesn't:** a fitted thermal or base layer worn alone in spring looks clean (fitted, not tight); a too-small tee as an inner layer under a looser jacket (fit.4).
- **Interacts with:** fit.6 (skinny), sil.3, prop.1 (Tim's sarcastic "how to look bad" pairs tight legs with a bare ankle).
- **Sources:** Tim · `zJ5LCenTcf8` · [00:00] · "your pants should taper down from your hip to your ankle" (sarcastic, as how to look bad); Tim · `wIib9hzVUuw` · [09:10] · "The fabric is even pulling at the thighs"; Wanhee · `RtxJqd5Drps` · [00:33] · "you wear really tight clothes. Don't do that."; Jaye · `Jz9QVWgBbOg` · [13:11] · "you getting these skin tight jackets"; Tim · `vQ6_okzfNSs` · [00:32] · "just don't go too tight on the shirt"; Tim · `K2HS3_8cTx8` · [01:42] · "wear the top by itself in spring with some nice trousers" (the fitted thermal); GQ (outsider) · `bLcGL6rKBBg` · [13:00] · "you need a little space through the chest"
- **The four:** all agree.
- **Engine today:** has it [FIT-3] (clearly pulls: top −2.0, slim pants −1.5, others −2.0), [PRO-16]; dealbreakers H8.
- **AI can see it:** weakly (`strain` is a weak read; "some" strain never counts).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-09-15.jpg` (checked: a collage of outfits; which one is the tight one is unclear)

#### fit.3. Too big fails when it sags, flaps or swamps; size as a shortcut (the biggest, boxiest tee) isn't a silhouette.
- **Strength:** fault. **Holds when:** wide trousers that slump instead of holding their shape, thin trousers flapping, a close-fit jacket (a biker) a size too big, an oversized hoodie that looks "swollen". **Doesn't:** baggy jeans, where "too big" is the point (Frugal); a deliberately boxy or oversized piece with the right details (fit.5).
- **Interacts with:** fit.4, fit.5, sil.4.
- **Sources:** Tim · `vziGl_FxQb0` · [03:15] · "the word baggy has a sort of sagging connotation"; Jaye · `7K2qRZaXX3w` · [06:53] · "pants that are flailing everywhere in the wind"; Jaye · `Jz9QVWgBbOg` · [13:11] · "You getting oversized everything"; Frugal · `4DHGKfe-Vho` · [14:23] · "No, it's too big. It's too big."; Frugal · `ove4zof6W2k` · [00:00] · "default to like something really big or cropped or flashy"; Frugal · `xL1NeaA9D-Y` · [04:51] · "too big is kind of the goal here anyway" (baggy jeans, the exception)
- **The four:** all agree against sagging and swamping; Frugal exempts baggy jeans, which Jaye's "flailing" partly contradicts.
- **Engine today:** lacks it (a size big can't be told from cut roomy, KD-19; roominess 5 only blocks looks).
- **AI can see it:** weakly (`volume` 5 is rarely read; nothing reads sagging or flapping).
- **Frame:** pending (`inputs/youtube/shots/4DHGKfe-Vho/f-14-28.jpg` checked: a different outfit, not the biker jacket)

#### fit.4. Size is a tool: sizing up or down on purpose works when the piece is placed right, and small fit differences change the mood.
- **Strength:** nuance. **Holds when:** a too-small tee inside a looser leather jacket, a too-big shirt over a hoodie, snug base layers under roomy outer ones, a looser denim shirt over jeans. **Doesn't:** the same tight tee worn alone (fit.2).
- **Interacts with:** sil.5 (inner snug, outer roomy), layering.
- **Sources:** Wanhee · `RtxJqd5Drps` · [06:38] · "They will intentionally buy few sizes up, few sizes down."; Frugal · `FlQ3WZ-H2Ik` · [07:29] · "one size away one crop away one Whatever away"; Tim · `FUWET2HH-us` · [03:14] · "they fit snug so you can easily layer on top"; Tim · `vQ6_okzfNSs` · [00:32] · "just don't go too tight on the shirt" (double denim); Tim · `wIib9hzVUuw` · [01:01] · "there isn't one specific way every piece of clothing has to fit"
- **The four:** Wanhee, Frugal and Tim agree; Jaye's fit-first view is compatible (neither skin-tight nor flapping).
- **Engine today:** has it differently [FIT-2] (a roomy piece's long sleeves cost −0.5 as the cut, not a size fault), [PRO-11] bands, [STY-5].
- **AI can see it:** weakly (`volume` per piece; "on purpose" isn't readable).
- **Frame:** none (described only)

#### fit.5. Oversized done right is precise: room in width, a drop shoulder, sleeves at or just below the elbow, a body that isn't too long, drape rather than stiffness.
- **Strength:** lift. **Holds when:** oversized tees and hoodies (wide sleeves are what make a hoodie); the piece hangs off the shoulders and flows. **Doesn't:** a stiff, crisp, heavy tee that holds its own shape ("you're just in it"); a long body (prop.6).
- **Interacts with:** prop.6, sil.4, layering-texture (drape is fabric, which the reader can't see).
- **Sources:** Tim · `DwolmJNAw_k` · [03:26] · "The fit is oversized but precise"; Tim · `DwolmJNAw_k` · [03:26] · "It hangs cleanly off the shoulders and flows naturally with the body"; Tim · `_6-4CHHXg3c` · [03:18] · "a little boxy with drop shoulders"; Frugal · `ove4zof6W2k` · [12:34] · "the width not the length you know the width"; Frugal · `FlQ3WZ-H2Ik` · [11:43] · "you're just going to be in it" (stiff tees); Frugal · `FlQ3WZ-H2Ik` · [09:06] · "it's all deliberate to create a nice silhouette"; Wanhee · `rNCrnP-os0U` · [08:12] · "a loose elegant graceful silhouette" (a drop shoulder); Wanhee · `B9PIhkSQKuw` · [02:10] · "everything's different the silhouette the way it fits the way it lasts" (quality fabric)
- **The four:** Tim, Frugal and Wanhee agree; Jaye silent. Frugal calls a structured, stiff drop shoulder a taste he doesn't share, not a fault (`ove4zof6W2k` [14:12]).
- **Engine today:** lacks it (no credit for a good oversize; [FIT-2] charges roomy sleeves past the wrist −0.5; [PRO-11] charges roomy tops no look holds).
- **AI can see it:** weakly (`volume` 4–5 weak, `sleeve_end`); no for drape and stiffness.
- **Frame:** `inputs/youtube/shots/DwolmJNAw_k/f-03-30.jpg` (checked: the tee's fabric close up, not the fit worn)

#### fit.6. Skinny is out; slim is contested. A narrow leg is unforgiving: it needs everything else to work.
- **Strength:** fault (skinny) / nuance (slim). **Holds when:** skinny jeans, skinny joggers, tight tapered trousers. **Doesn't:** slim under tailoring; Jaye (2025) says for a skilled dresser skinny and baggy are about equal; Frugal says good styling can make any proportion work.
- **Interacts with:** sil.3 (a roomy top over a narrow leg), prop.10 (chunky shoes under it), prop.9 (the dated skinny stack).
- **Sources:** Tim · `wIib9hzVUuw` · [10:10] · "Those are three words that should never be in the same sentence." (skinny, leather, joggers); Tim · `wIib9hzVUuw` · [03:33] · "a precise taper rather than being slim all over"; Wanhee · `rNCrnP-os0U` · [02:03] · "not super wide, not super skinny"; Frugal · `xL1NeaA9D-Y` · [09:11] · "With other cuts, I feel like it's more forgiving."; Frugal · `JY_zrt43cbU` · [02:10] · "going from a trend to a red flag" (skinny jeans' arc); Jaye · `sOfjDjtjBWM` · [08:48] · "there's nothing wrong with that style"
- **The four:** Tim, Wanhee and Frugal reject skinny; on slim, Tim and Wanhee prefer straight, Frugal and Jaye are fine with it (`creators-rules.md`, KD-20).
- **Engine today:** has it [PRO-13] (slim −1.0, skinny −2.0; a straight read at roominess 2 or less counts as slim); dealbreakers S1, S2, N2.
- **AI can see it:** yes for slim-or-skinny vs straight-or-fuller (94% steady); weakly for slim vs straight alone.
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/o5-before-10-18.png` (checked: a black sweater over narrow dark trousers)

#### fit.7. The right trouser cut has room through the seat and thigh and a gentle taper from the knee: not slim all over, not flaring at the hem.
- **Strength:** lift / fault (tight thighs with a normal hem, or a hem too wide for the leg). **Holds when:** relaxed jeans, wide jeans, smart trousers, wide sweatpants (open hem, high rise). **Doesn't:** Tim prefers straight on wide pleated trousers (sil.8); a barrel leg narrows at the hem by design.
- **Interacts with:** prop.1 (a too-wide hem swamps the shoe), fit.6.
- **Sources:** Tim · `vziGl_FxQb0` · [07:34] · "the perfect ratio between the width at the thighs, knees, and hem"; Tim · `CJv4TGLrdig` · [05:12] · "relaxed fit throughout the leg with a subtle taper from the knee"; Tim · `2KblatXQTGs` · [03:14] · "starts out looser around the seats and thighs and progressively tapers in"; Tim · `K2HS3_8cTx8` · [03:48] · "nice and wide through the seat and leg with a gentle taper"; Tim · `wIib9hzVUuw` · [10:40] · "Enough room in the thighs, straight cut, one break on the shoe"; Wanhee · `ew3gCk1zkso` · [02:06] · "that goes all the way to your shoes normal" (straight, not tight on the thighs); The Armoury (outsider) · `z_acMbzNfoQ` · [02:45] · "I don't like having overly narrow legs"
- **The four:** Tim (most) and Wanhee agree; Frugal's "tight waist wide legs" fits; Jaye silent.
- **Engine today:** has it differently [PRO-13] (only slim and skinny); taper and thigh room aren't scored.
- **AI can see it:** weakly (`leg_shape` has no taper; tight thighs only through `strain`).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-10-45.jpg` (checked: straight leather trousers)

#### fit.8. Basics that fit are "put together", not special: a well-fitting tee and jeans is the base every other rule builds on.
- **Strength:** nuance (it sets the 7.0 base; fit alone doesn't lift above it). **Holds when:** a plain tee, straight jeans, clean shoes; "letting the fit do the talking". **Doesn't:** Frugal calls the perfect blank a false goal: it adds no interest, so a lift has to come from elsewhere.
- **Interacts with:** fit.1 (the base must be right before anything lifts it), everything that lifts.
- **Sources:** Frugal · `WMwH8xtSOWA` · [04:56] · "if you get this part right, everything else will only elevate it"; Frugal · `xL1NeaA9D-Y` · [01:35] · "one of the easiest to just throw on and get all right"; Frugal · `CsbsHWEBwy0` · [10:39] · "mid but mid in like a Lexus sedan kind of way"; Frugal · `JY_zrt43cbU` · [02:10] · "A good fitting pair of blue jeans will always be an asset"; Tim's guest · `OqoUgLxknJc` · [17:13] · "very simple pieces but letting the fit do the talking"
- **The four:** all agree (Tim's staples, Jaye's foundation, Wanhee's white tee and 501 "dressed well").
- **Engine today:** has it [SCO-1] (the plain tee, dark jeans and white sneakers score 7.0), [FIT-1], [STY-12].
- **AI can see it:** yes (`subcategory`, `leg_shape`, `volume`, `condition`).
- **Frame:** `inputs/youtube/shots/xL1NeaA9D-Y/f-01-40.jpg` (checked: one straight-jean outfit)

#### fit.9. Small edges count: sleeves end where they're meant to (a long-sleeve below the wrist, above the fingers), and a neckline or collar sits neat.
- **Strength:** nuance (fault when a sleeve swallows the hand, suit.7). **Holds when:** long-sleeve tees, knits, turtlenecks that stand up without folding, shirt collars that hold. **Doesn't:** a roomy piece cut long in the sleeve on purpose (fit.4).
- **Interacts with:** suit.7, fit.5.
- **Sources:** Tim · `a7FgCE9NPmw` · [06:09] · "longer sleeves meant to end below your wrist and above your fingers"; Tim · `a7FgCE9NPmw` · [02:51] · "The neckline is also extremely important"; Tim · `OqoUgLxknJc` · [10:17] · "it's not too high where you have to fold it over"
- **The four:** only Tim (others silent).
- **Engine today:** has it [FIT-2] for sleeves over the hands; lacks the neckline.
- **AI can see it:** weakly (`sleeve_end` 70–76%, a bent arm fools it); no for collars.
- **Frame:** pending (`inputs/youtube/shots/OqoUgLxknJc/f-10-22.jpg` checked: a check shirt, not the turtleneck)

---

### Suits and tailoring (suit.*)

**How suits are worn casually now (the four, 2023–2026).** The outsiders say almost nothing past "a navy jacket with jeans". The current casual suit comes from the four: a wider-fitting two-piece over a plain tee or tank (Tim); crisp tailoring with no tie, even no dress shirt, a polo or tee under it (Tim); a tee tucked into tailored trousers under a blazer with loafers (Tim); a blazer with jeans by day (Tim); sneakers with formal wear and a design shirt under a black blazer, kept from "try hard" (Wanhee); an open blazer, an open white shirt instead of a buttoned one and a tie, a suit worn with flared denim (Jaye). Against that, black tie "sticks to the rules", and a suit everywhere (the gas-station run) overdresses (Jaye 2026, Tim). One outsider adds the most on this: Damien Broderick (2025) says most men don't need a suit at all and builds the same elegance from separates (smart trousers, loafers, a polo or oxford, a sports coat, a long coat), suit.11; his line that loafers rule out sweatpants clashes with Tim and is dropped there.

**How this fits `specs/tailored.md`.** TL1's home pieces (a plain tee or knit under the jacket, clean white leather sneakers) are backed by the four (suit.8, suit.10), not by the outsiders. TL1's "never with jeans" is right as a name rule: a blazer with jeans is a good separate (suit.9), so it must never be charged as a clash either. TL5's fixes in order of creator support: the hem under the trousers (suit.3), sleeves over the hands, softer on a relaxed blazer (suit.7), pulling across a buttoned jacket (suit.4), a loud oversized graphic tee under tailoring (suit.13). The spec's "Later" credits: a clean hem touching the shoe under a suit is the strongest candidate (suit.3); a high rise under the jacket second (suit.5, unreadable today). A short or boxy tailored jacket must not be charged (suit.1, suit.6).

#### suit.1. Relaxed is current: a suit no longer needs to be slim; a slightly relaxed or boxy jacket is fine; skin-tight ruins it, and so does oversized everything.
- **Strength:** lift (a relaxed suit that still fits) / fault (skin-tight, or swamping). **Holds when:** smart casual and everyday tailoring, a two-piece or a blazer; boxy on purpose. **Doesn't:** black tie stays slim and by the rules; Wanhee's "really slim Italian guy in a suit" is still a valid choice (slim is never charged unless it pulls).
- **Interacts with:** suit.4 (relaxed is not pulling), suit.7 (a relaxed blazer's sleeve can run a bit long), occasion.
- **Sources:** Tim · `vQ6_okzfNSs` · [04:16] · "the two-piece suits no longer needs to be a slim fit"; Tim · `vQ6_okzfNSs` · [04:16] · "explore some wider fitting suits"; Tim · `-V2bE8nDsdo` · [01:31] · "a slightly relaxed fit, which I prefer in a blazer"; Tim · `OqoUgLxknJc` · [08:40] · "not like incredibly baggy or anything"; Tim · `vziGl_FxQb0` · [07:02] · "a more modern take on tailoring" (a slightly boxy double-breasted suit); Jaye · `Jz9QVWgBbOg` · [13:11] · "Nothing wrong with a boxy suit if that's what you're going for"; Jaye · `Jz9QVWgBbOg` · [13:11] · "you getting these skin tight jackets"; Wanhee · `ew3gCk1zkso` · [11:15] · "really Slim like put together Italian guy in a suit"; Tim's guest · `OqoUgLxknJc` · [12:55] · "stick to the rules of tailoring" (black tie); Justin Kwan (outsider) · `pQctf3wAlpI` · [01:41] · "slim fit equals slimmer looking, but it's a lie"
- **The four:** Tim and Jaye agree; Wanhee allows slim as a choice; Frugal silent on suits. GQ's "a too-big waist looks boxy" is dropped (the four win).
- **Engine today:** has it differently [FIT-3] (pulling costs) but [FIT-2] charges a blazer's sleeves over the hands −2.0, which hits relaxed blazers Tim likes; nothing rewards the relaxed cut.
- **AI can see it:** weakly (`volume` on a blazer, `strain`).
- **Frame:** pending (`inputs/youtube/shots/vQ6_okzfNSs/f-04-21.jpg` checked: a shirt-and-shorts set, not the suit)

#### suit.2. A suit wins on fit: the shape comes from the shoulder and chest (a shoulder slightly past the natural one, a little drape), not from a waist taken in tight.
- **Strength:** lift. **Holds when:** jackets and coats; Tim's "slightly wider with enough structure" and broad, straight-hemmed boxy jackets. **Doesn't:** a jacket "hanging off" the shoulder a size too big (fit.3).
- **Interacts with:** sil.6 (the same shoulder logic in coats), suit.1, suit.4.
- **Sources:** Jaye · `Jz9QVWgBbOg` · [13:11] · "what makes your suit better is the tailoring"; Tim · `UNkA9HhbjXY` · [08:38] · "it fits you really well" (his praise of a custom suit); Tim · `wIib9hzVUuw` · [03:33] · "slightly wider with enough structure"; Tim · `0ilmLux6mPg` · [07:42] · "broad shoulders and a straight cut at the hem"; The Armoury (outsider) · `z_acMbzNfoQ` · [01:08] · "my jacket extends a little bit further"; The Armoury (outsider) · `z_acMbzNfoQ` · [02:11] · "give you the illusion of a waist"
- **The four:** Tim and Jaye agree; Wanhee and Frugal silent.
- **Engine today:** has it differently [FIT-1] (Fit stops at 7 even on a sharp tailored outfit; no shoulder read, KD-13).
- **AI can see it:** no (shoulder position and structure aren't read; the shoulder-seam read failed at 78%).
- **Frame:** `inputs/youtube/shots/0ilmLux6mPg/f-08-20.jpg` (checked: the boxy beige jacket over pleated trousers described at [07:42]–[08:15]; `f-07-47.jpg` shows Tim talking)

#### suit.3. The suit trouser touches the shoe with no break or one clean break; too long bunches, deliberately short is out.
- **Strength:** lift (a clean hem) / fault (bunching on the shoe). **Holds when:** suit and dress trousers over loafers, derbies or clean sneakers. **Doesn't:** the outsiders split on no break (The Armoury) vs one break (GQ); the four only need the hem to touch the shoe, so neither is scored. GQ's "cut them shorter for a cleaner look" is dropped (Tim: too short ruins the silhouette).
- **Interacts with:** prop.1, prop.14, suit.5 (a fuller leg falls straighter).
- **Sources:** Tim · `0ilmLux6mPg` · [08:15] · "barely breaking on the shoes"; Tim · `SNjfZ5NKndc` · [00:00] · "Too short and it will ruin your silhouette"; Tim · `wIib9hzVUuw` · [08:07] · "having the trousers meet the shoe seamlessly"; The Armoury (outsider) · `z_acMbzNfoQ` · [03:17] · "the trouser is just barely touching the shoe"; GQ (outsider) · `bLcGL6rKBBg` · [10:52] · "a classic length would be to have a single break"
- **The four:** Tim agrees (strongly); Frugal and Wanhee agree through prop.1; Jaye silent on suit hems.
- **Engine today:** has it differently [FIT-4] (trousers piling on a straight leg −2.0); no credit for a clean break (the Tailored spec's "Later" list).
- **AI can see it:** weakly (`hem`); look L reads covering the shoe well.
- **Frame:** `inputs/youtube/shots/0ilmLux6mPg/f-08-20.jpg` (checked: pleated trousers barely breaking on the shoe)

#### suit.4. Nothing pulls: no X-creases at the button, no lapels bowing off the chest, no gaping trouser pockets, no straining shirt.
- **Strength:** fault. **Holds when:** visible from the front, mostly with the jacket buttoned. **Doesn't:** a relaxed or boxy jacket with room isn't this (suit.1).
- **Interacts with:** suit.1, fit.2.
- **Sources:** Tim · `wIib9hzVUuw` · [09:10] · "The fabric is even pulling at the thighs"; Jaye · `Jz9QVWgBbOg` · [13:11] · "you getting these skin tight jackets"; GQ (outsider) · `bLcGL6rKBBg` · [07:32] · "horizontal lines and creases across the front of the jacket"; GQ (outsider) · `bLcGL6rKBBg` · [02:38] · "hug the body without being too tight or too loose"; GQ (outsider) · `bLcGL6rKBBg` · [09:48] · "a telltale sign that the trousers are too tight"
- **The four:** Tim and Jaye agree (others silent on suits).
- **Engine today:** has it [FIT-3].
- **AI can see it:** weakly (`strain`).
- **Frame:** `inputs/youtube/shots/bLcGL6rKBBg/f-07-37.jpg` (checked: a buttoned jacket with the waist marked)

#### suit.5. Suit trousers sit higher and fuller: a high rise under the jacket makes one silhouette and a long leg line; a fuller leg falls straight; pleats and a pressed crease are welcome.
- **Strength:** lift (high rise, pleats, crease, a straight-falling fuller leg) / fault (low rise under a jacket). **Holds when:** a jacket over trousers, worn open or with a tuck so the waistband shows. **Doesn't:** jeans are allowed lower; GQ's flat-front preference is dropped (Tim likes pleats).
- **Interacts with:** prop.8, prop.3, suit.3.
- **Sources:** Wanhee · `RtxJqd5Drps` · [01:40] · "a lot of like formal wear will be like this" (a blazer with trousers worn high); Jaye · `RIuzSb8OLMM` · [14:14] · "High rise on the other end, it elongates your legs."; Tim · `0JtnbgtbQfE` · [01:07] · "ideally something with a center press crease"; Tim · `0JtnbgtbQfE` · [01:07] · "usually I like them with the pleat"; Tim · `_6-4CHHXg3c` · [00:35] · "cut generously throughout the leg with a slight taper"; Tim · `2KblatXQTGs` · [03:14] · "they still feel like a smart trouser thanks to the center crease"; GQ (outsider) · `bLcGL6rKBBg` · [08:44] · "doesn't pair well with a jacket" (low rise); Justin Kwan (outsider) · `skd8U8dmIP4` · [02:42] · "Low-rise cuts your body in half"
- **The four:** Wanhee, Jaye and Tim agree; Frugal's "wide high-waisted trousers" fit.
- **Engine today:** has it differently [PRO-13] (exempts suit trousers and trousers under a blazer from the slim charge); [PRO-7] (the tailored line, +1.0, needs a tucked top); rise, pleats and crease: lacks.
- **AI can see it:** no (rise, pleats and crease aren't read).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-01-45.jpg` (checked: a jacket over dark trousers; the rise isn't visible)

#### suit.6. Jacket length: no fixed rule; a short or boxy jacket over full trousers is fine, but a jacket cut so long it swallows the legs is a fault.
- **Strength:** fault (too long) / nuance. **Holds when:** a suit or sport jacket over trousers. **Doesn't:** GQ and Kwan's "too short shows the seat / splits you in half" is dropped: the four read a jacket ending where the trousers start as a deliberate break (prop.3).
- **Interacts with:** prop.2, prop.3, suit.7 (too-long sleeves make the jacket look longer).
- **Sources:** Tim · `0ilmLux6mPg` · [08:15] · "the jacket cuts abruptly where the trouser starts"; GQ (outsider) · `bLcGL6rKBBg` · [08:11] · "it's gonna swallow the legs up"
- **The four:** Tim for the short jacket; the "too long" half comes from GQ, consistent with the four's prop.6; others silent.
- **Engine today:** lacks it.
- **AI can see it:** weakly (`length` on the jacket).
- **Frame:** `inputs/youtube/shots/0ilmLux6mPg/f-08-20.jpg` (checked: the jacket ending where the trousers start; `bLcGL6rKBBg/f-08-16.jpg` shows the tailor talking)

#### suit.7. The sleeve ends at the wrist and must not swallow the hand; the exact shirt cuff isn't scored, and a relaxed blazer may run a little long.
- **Strength:** fault (sleeve over the hand), softer on a deliberately relaxed blazer. **Holds when:** blazers, suit jackets, overcoats. **Doesn't:** the outsiders' 1–2 cm of shirt cuff is what Tim calls the surface-level checklist.
- **Interacts with:** suit.1, suit.6, fit.9.
- **Sources:** Tim · `wIib9hzVUuw` · [01:01] · "exactly 1 in of your shirt cuff underneath a blazer" (as the surface level); Tim · `-V2bE8nDsdo` · [01:31] · "a slightly relaxed fit, which I prefer in a blazer"; GQ (outsider) · `bLcGL6rKBBg` · [05:15] · "it will start swallowing up the hand"
- **The four:** Tim softens it; others silent. Kept from the outsiders only as "don't swallow the hand".
- **Engine today:** has it [FIT-2] (−2.0 on a blazer, suit jacket or overcoat); dealbreakers H9 proposes a hold with a relaxed-blazer exception.
- **AI can see it:** weakly (`sleeve_end` 70–76%; a bent arm fools it).
- **Frame:** `inputs/youtube/shots/bLcGL6rKBBg/f-05-20.jpg` (checked: a sleeve showing the shirt cuff)

#### suit.8. Tailoring worn casually is the current way: a tee, tank or polo under the jacket, no tie, a tucked tee with loafers, an open blazer.
- **Strength:** lift. **Holds when:** the tailoring is crisp and the casual layer under it is plain; smart casual, dates, a creative office. **Doesn't:** at a strict corporate office or black tie; a loud oversized graphic under it (suit.13); an untucked dress shirt under a blazer ([CON-3]).
- **Interacts with:** occasion, style (the high-low mix is the point), suit.10.
- **Sources:** Tim · `vQ6_okzfNSs` · [04:16] · "a simple t-shirt or tank top underneath for an elegant smart casual"; Tim · `jaOSdGqtgYY` · [06:59] · "crisp tailoring especially when worn casually without a tie"; Tim · `-V2bE8nDsdo` · [04:37] · "oversized t-shirt tucked into the tailored trousers"; Tim · `-V2bE8nDsdo` · [02:34] · "by swapping the sneakers for loafers and adding a blazer"; Jaye · `23ZCHsp9AZU` · [01:32] · "most people will tie and button it up" (he wears the shirt open); Jaye · `Pxeeh-caTJg` · [21:42] · "this fit has a open blazer"; Jaye · `VUEaMYx10mM` · [12:28] · "But what if my suit and tie has flared denim?"; Wanhee · `tNVdA_arEa8` · [02:36] · "going against the expectation"
- **The four:** Tim, Jaye and Wanhee agree; Frugal silent.
- **Engine today:** has it differently [STY-4] (since v11 a tee or tank under a suit isn't charged), [STY-1]/[STY-2] (a matching suit's credits), TL1's home pieces; no credit for the casual mix itself.
- **AI can see it:** yes (`subcategory` of the inner top and jacket, `tucked`).
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-12.jpg` (checked: the tee tucked into tailored trousers; the blazer is out of frame)

#### suit.9. A blazer with jeans is a good separate ("cool professor"), best with a softer jacket.
- **Strength:** lift. **Holds when:** a blazer or unstructured jacket with jeans by day, tee or flannel under it, loafers or sneakers. **Doesn't:** it isn't Tailored by name (TL1); the engine's charge on light, mid or relaxed jeans is not what the four say.
- **Interacts with:** suit.8, style worlds (prep or smart casual).
- **Sources:** Tim · `-V2bE8nDsdo` · [04:07] · "effortless, cool professor vibe"; Jaye · `VUEaMYx10mM` · [12:28] · "But what if my suit and tie has flared denim?"; GQ (outsider) · `4fb4GyOylK8` · [12:41] · "pair that with more casual trousers or a pair of jeans"
- **The four:** Tim and Jaye agree; others silent.
- **Engine today:** has it differently [STY-3] (a tailored jacket with relaxed, wide, light, mid-wash or distressed jeans −1.5; dark straight jeans free). The four would charge none of it; a founder call.
- **AI can see it:** yes (`subcategory`, `color_family` denim washes, `leg_shape`).
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-42.jpg` (checked: a brown blazer over a flannel with light jeans)

#### suit.10. Clean, low sneakers work under tailoring; chunky or running sneakers don't.
- **Strength:** nuance (clean sneakers) / fault (chunky under a blazer). **Holds when:** white leather or plain low sneakers under a suit or blazer, kept from "try hard". **Doesn't:** at an interview the engine holds sneakers under a blazer to 7.0 ([OCC-4]); no creator line here names chunky sneakers under suit trousers directly.
- **Interacts with:** shoes, prop.10 (a chunky shoe wants a generous leg, which suit trousers rarely are), suit.8.
- **Sources:** Wanhee · `tNVdA_arEa8` · [02:36] · "wearing sneakers with Formal Wear"; Wanhee · `tNVdA_arEa8` · [02:36] · "then it just looks try hard" (when overdone); Tim · `-V2bE8nDsdo` · [04:37] · "the sneakers and cap for that touch of street wear" (flannel under a blazer, jeans)
- **The four:** Wanhee and Tim agree; others silent.
- **Engine today:** has it [SHO-8] (chunky under a blazer −2.0), [SHO-3] (running shoes 4.5 under a blazer), [OCC-4]; TL1 makes clean sneakers a home piece.
- **AI can see it:** yes (shoe `subcategory`).
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-42.jpg` (checked: the blazer and jeans; the sneakers are out of frame)

#### suit.11. Tailored separates replace the suit for most days: smart trousers (pleated, creased) and loafers with a polo, then an oxford, then a sports coat, then a long coat over it; the same trousers dress up or down.
- **Strength:** nuance (lift for the piece). **Holds when:** a pleated, center-creased wide trouser with a shirt over a tank for smart, a tee and cap for casual; pleated track pants read slightly tailored; a camel overcoat goes over jeans and a polo as easily as over a suit. **Doesn't:** relaxed tailoring with no jacket stays minimal or smart casual by name (`specs/tailored.md` Out). Dropped: Broderick's "you can no longer wear sweats" once the shoe is a loafer (`4jnsdw7aT5U` [06:52]) clashes with Tim, who wears sweatpants with minimal loafers ("Sweatpants with loafers can be a risky move", then "I feel like it actually works surprisingly well", `-V2bE8nDsdo` [03:04]–[03:34]); the four win.
- **Interacts with:** suit.5, style worlds (minimal, smart casual).
- **Sources:** Tim · `vQ6_okzfNSs` · [03:12] · "you can wear this just as easily in a sophisticated"; Damien Broderick (outsider) · `4jnsdw7aT5U` · [13:25] · "A smart pair of trousers, a pair of loafers, and a polo"; Damien Broderick (outsider) · `4jnsdw7aT5U` · [13:56] · "Throw a sports coat over it."; Damien Broderick (outsider) · `4jnsdw7aT5U` · [12:22] · "capable of going over a classic pair of jeans and a polo" (the camel overcoat); Tim · `o5RnTT2oafg` · [04:27] · "paired with a shirt long sleeve or short sleeve over a vest"; Tim · `vziGl_FxQb0` · [02:45] · "the comfort of a jogger, but with a sharper silhouette"; Tim · `2KblatXQTGs` · [03:14] · "they still feel like a smart trouser thanks to the center crease"
- **The four:** only Tim (others silent); Broderick (outsider) agrees on the ladder.
- **Engine today:** has it differently (trousers sit at dressiness 4, pull-on trousers lower; pleats and crease aren't scored; pleated track pants read as sweats or pull-on).
- **AI can see it:** weakly (`subcategory` trousers vs pull-on trousers); no for pleats and crease.
- **Frame:** `inputs/youtube/shots/vQ6_okzfNSs/f-03-17.jpg` (checked: the white trouser-and-shirt set)

#### suit.12. Statement tailoring details: a double-breasted jacket carries more style (and should be worn buttoned); collarless or lapel-less jackets and a three-button cut are subtle twists.
- **Strength:** lift (small). **Holds when:** double-breasted, ideally with wide lapels; a blazer with no lapels; a three-button jacket that reads more like outerwear. **Doesn't:** an open double-breasted jacket hangs wide (GQ; the four silent).
- **Interacts with:** suit.1 (a boxy DB suit is Tim's modern take), sil.6.
- **Sources:** Tim · `-e9Is50-fn0` · [00:31] · "is at least double the style points"; Tim · `-e9Is50-fn0` · [03:21] · "They make a statement kind of by not making one" (collarless); Tim · `SNjfZ5NKndc` · [02:01] · "a blazer with no lapels"; Tim · `30L-EHe4WAQ` · [04:55] · "makes it feel a little more like a jacket"; GQ (outsider) · `4fb4GyOylK8` · [09:58] · "you really need to wear it done up"
- **The four:** only Tim (others silent).
- **Engine today:** lacks it.
- **AI can see it:** no (no double-breasted, lapel or button read; `subcategory` only names the jacket).
- **Frame:** `inputs/youtube/shots/-e9Is50-fn0/f-00-36.jpg` (checked: a double-breasted jacket)

#### suit.13. A loud or oversized graphic tee fights tailoring; a muted design shirt under a dark blazer is wit.
- **Strength:** fault (oversized or loud graphic under a jacket) / lift (a quiet twist). **Holds when:** a blazer or suit jacket over a graphic tee. **Doesn't:** a plain or fitted tee (suit.8); a design shirt toned down by a black blazer and black trousers.
- **Interacts with:** suit.8, color (a dark jacket tones a busy piece down), pattern.
- **Sources:** Wanhee · `tNVdA_arEa8` · [02:36] · "going against the expectation"; Wanhee · `tNVdA_arEa8` · [02:36] · "then it just looks try hard"
- **The four:** only Wanhee (others silent); the engine's charge comes from FashionBeans, not the four.
- **Engine today:** has it [STY-10] (an oversized graphic tee under tailoring −1.5; a regular one free).
- **AI can see it:** yes (`subcategory` graphic_tee, `volume`, `pattern`, `pattern_scale`).
- **Frame:** `inputs/youtube/shots/tNVdA_arEa8/f-02-11.jpg` (checked: a black blazer over a white tee)

#### suit.14. Dress for the room: a full suit for an errand overdresses, and wearing one everywhere kills its effect.
- **Strength:** nuance (occasion). **Holds when:** a full suit and dress shoes at an everyday or casual setting. **Doesn't:** where a blazer or suit is expected, lean smarter (Tim); Jaye's 2025 "always overdress" is his older view.
- **Interacts with:** occasion (that part owns the numbers), suit.8 (casual tailoring is the middle path).
- **Sources:** Jaye · `Jz9QVWgBbOg` · [11:10] · "If you wear a suit jacket everywhere to every occasion"; Tim · `IUMqpLeCT-E` · [00:33] · "three-piece suit to a casual family Barbecue"; Damien Broderick (outsider) · `4jnsdw7aT5U` · [03:21] · "that is dramatically overdressed for the situation you are now in" (a full navy suit and tie for date night); Damien Broderick (outsider) · `4jnsdw7aT5U` · [04:30] · "It looks like you're trying too hard." (the same at the pub); Damien Broderick (outsider) · `4jnsdw7aT5U` · [00:36] · "Most men don't need a suit at all."
- **The four:** Jaye (2026) and Tim agree; Jaye (2025, `7K2qRZaXX3w`) differs; newest wins. Broderick (outsider) agrees.
- **Engine today:** has it [OCC-2] (a full suit at Everyday −0.25); the Tailored spec keeps it.
- **AI can see it:** yes (`subcategory`, occasion from the user).
- **Frame:** none (described only)

---

### Not scorable from a photo
- Intent and copying: whether an outfit was "copied from the internet" or chosen with intent (Jaye `UcLBvcmnnus` [06:39]); only its result (every piece agreeing) is visible.
- Size labels drifting larger; judge the fit, not the tag (Frugal `JY_zrt43cbU`).
- Stretch content in trousers (Frugal `WDsQRHa8jBY` [04:43]: invisible unless skin-tight).
- Buying and tailoring advice: start from the closest size, buy a jacket by the chest, get things hemmed (The Armoury, GQ, Frugal, Jaye); for Kit, not the score.
- "Automatic pants" and the perfect vintage tee found by luck; origin and price don't show.
- Fabric quality and construction (quiet luxury's "exceptional materials", Japanese denim) except as the shape they produce.
- Back and side views: collar gap, collar roll, diagonal back creases, sleeve-back creases, a low armhole, back-of-thigh folds (GQ, The Armoury, Kwan); the app sees the front.
- Sleeve buttons, lapel gorge and button stance, turn-ups (the outsiders split), the exact 1–2 cm of shirt cuff.
- Belts and chains as waist markers or proportion tools (Tim `30L-EHe4WAQ` [05:58], Frugal `4hwelpjhDTM`): accessories never count.
- Socks: loose, scrunched, "teased" high socks with slim shoes and shorts (Frugal `8rmkOpCbFTM` [06:06]–[07:09]): a real visual rule, but socks aren't read.
- Wanhee's "too many fits" (`Uw-vpUq8Ewg` [04:58]): meaning unclear in the caption.
- Trend history (the Fear of God era, the 2024 "TikTok fit" with its tote and headphones) and statement pleated pants as photo-only pieces (Frugal's daily-wear taste).
- Comfort and how clothes feel ("feels so much better", constant sleeve-adjusting as a tell).


*(This part's notes for the dealbreakers sheet are in the "Creators say (T95)" column of `rubric/research/dealbreakers.md`.)*

---

## 2. Color, contrast between pieces, pattern
Nov 14, 2026. Synthesized from `by-part/rules-color.md`, `by-part/rules-contrast.md`, `by-part/rules-pattern.md` and `concepts.md` §6–12; every quote below was re-checked against `inputs/youtube/clean/` (stamp = the transcript chunk the quote starts in). Engine = parts v15 (`rubric/v5-styles.md`).

**Summary.** All four build on a neutral base and treat it as the floor, not a lift: neutrals stop color faults but don't make an outfit good. All four like **one** accent on a quiet base, and all four like shades of one color, as long as something (a step in shade, a fade, a texture, a light touch) keeps it from going flat. Too many colors or too many brights is the one color fault everyone names; Tim and Wanhee put the line at about three colors. No one trusts the color wheel alone: whether a "clash" works depends on saturation, matched strength, what surrounds it, how much area it covers and whether anything else competes, which is the founder's red-with-blue nuance (see "When a risky color works"). Formality contrast (a smart piece against a casual one) is a lift for Tim, who supplies almost all of it, and the others agree in spirit. Patterns: one loud piece is fine, several loud pieces is the fault. **The main disagreements:** how loud the accent may be (Tim and Wanhee muted; Jaye and Frugal bolder), how to count colors (Wanhee counts every neutral; Tim lets an all-neutral outfit carry four), and Tim's blazer-with-light-jeans looks against the engine's [STY-3]. **The biggest engine gaps:** no light/dark value read and no texture read, so tonal outfits (the creators' easiest win) earn nothing and [COL-12] charges light tonal looks the creators praise.

**Naming warning (tonal).** Wanhee's Korean labels swap between videos: in 2024 "tone in tone" is one hue at several depths and "tone on tone" is several hues at one depth (e2MgmGDLV9Q [00:00]–[01:04], tNVdA_arEa8 [04:06]); in 2023 he uses them the other way round and says "I don't actually know which one's which" (ew3gCk1zkso [08:35]). This file names the ideas by what they do: **shades of one color**, **same depth, different colors**, **one color head to toe**.

---

### Color

#### color.1. A neutral base (black, white, grey, navy, beige, brown, olive, classic blue denim) is the floor: any two or three neutrals work, but neutrals alone don't make an outfit good.
- **Strength:** nuance. **Holds when:** the palette is mostly neutrals; it prevents color faults. **Doesn't:** earn a high score by itself: Wanhee's all-fundamentals outfit "looks fine" but isn't fashionable; Tim says a good palette can't save a bad outfit.
- **Interacts with:** proportion and fit outrank it (the same neutral outfit swings from bad to great on shape); it is the stage that makes one accent (color.2) read as deliberate.
- **Sources:** Tim · `wIib9hzVUuw` · [02:32] · "Neutrals play a crucial role to anchor a look."; Tim · `0JtnbgtbQfE` · [04:20] · "you can pretty much combine any two or three colors together"; Tim · `SNjfZ5NKndc` · [03:02] · "a good color palette alone won't make a bad outfit good"; Wanhee · `RtxJqd5Drps` · [03:19] · "The base is black. The base is good"; Wanhee · `uBsIrt-zU0I` · [02:52] · "Is it the most fashionable thing? No."; Jaye · `Pxeeh-caTJg` · [22:43] · "I would say stick to neutrals"; Frugal · `EWD0eRHHXgk` · [03:59] · "neutral and basic isn't timeless"
- **The four:** all agree.
- **Engine today:** has it (Color starts at 7 and the neutral list is never charged; [COL-1] counts only accent colors).
- **AI can see it:** yes (`color_family`).
- **Frame:** `inputs/youtube/shots/0JtnbgtbQfE/f-03-52.jpg` (Tim's all-neutral montage); `inputs/youtube/shots/uBsIrt-zU0I/f-02-57.jpg`; `inputs/youtube/shots/RtxJqd5Drps/f-03-24.jpg`

#### color.2. One accent on a quiet base (Wanhee's "point") lifts the outfit; a second matching accent reads try-hard, and several accents lose the effect.
- **Strength:** lift (one accent) · fault, mild (the accent doubled, or three or more). **Holds when:** the base is calm (all black, all neutral, tonal) and the accent is one piece, ideally small. Anything can be the point, a color, a texture or a formality break. **Doesn't:** with two copies of the accent (orange socks plus orange cap) or several competing points; and Tim keeps it muted and small (a burgundy or red accessory), where Jaye and Frugal accept a bright one.
- **Interacts with:** color.3 (dark pieces around it make it read controlled), color.12 (area: a small piece is a point, a jacket is a statement), color.13 (a quiet echo elsewhere is fine; an obvious double is not), pattern.1 (a loud print is an accent too and counts against the limit).
- **Sources:** Wanhee · `e2MgmGDLV9Q` · [01:34] · "the point is basically an accent a little cherry on top"; Wanhee · `1wUp3RSAEqI` · [01:01] · "maybe your white socks could become the point"; Wanhee · `uBsIrt-zU0I` · [05:06] · "If you dress all black and then you throw in any color"; Wanhee · `e2MgmGDLV9Q` · [02:36] · "if you have too many then it loses its power"; Wanhee · `e2MgmGDLV9Q` · [04:08] · "it just looks a bit try hard"; Frugal · `Jh8dz-KZcfY` · [03:47] · "it almost glues everything together with a nice focal point"; Tim · `IUMqpLeCT-E` · [01:09] · "a statement color in a monochrome outfit"; Tim · `UNkA9HhbjXY` · [02:40] · "I like the pop of red with the outfit"; Tim · `_6-4CHHXg3c` · [07:35] · "with a mostly neutral color outfits especially darker tones"; Jaye · `ws2jf0Yp_4c` · [07:31] · "find something bright"; guest Harry in Tim · `OqoUgLxknJc` · [14:26] · "the shirt for a pop of color"
- **The four:** all agree on one accent; they differ on how loud (Tim muted and small: `0JtnbgtbQfE` [03:47] "it will be far easier to stay away from the louder colors"; Jaye, 2026: "a wardrobe without bright accents is a boring wardrobe", `ws2jf0Yp_4c` [06:01]).
- **Engine today:** has it differently [COL-11], [COL-5], [STY-6]: +0.5 for one bright piece only on a **dark** base (not on a light or beige base), +0.5 for one quiet accent; the creators' favorite accents (socks, bag, scarf, cap, jewelry) never count ([SCO-6]); the doubled accent is not charged (two pieces of one bright color are one family).
- **AI can see it:** weakly (`saturation`, `color_family`, `category` find a clothing accent and where it sits; socks are not read and accessories never count).
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-03-52.jpg` (the still shows a bright orange scarf on a dark coat over light jeans, not the red bag he names); `inputs/youtube/shots/IUMqpLeCT-E/f-01-14.jpg`; `inputs/youtube/shots/UNkA9HhbjXY/f-02-45.jpg` (interview close-up; the red piece isn't identifiable); `inputs/youtube/shots/_6-4CHHXg3c/f-07-40.jpg`; `OqoUgLxknJc/f-14-31.jpg`

#### color.3. Tone down a bright piece (or a big design) by putting dark or neutral pieces around or over it; black shoes and a black cap "contain" a bright outfit.
- **Strength:** lift. **Holds when:** the surround is black, dark brown or dark navy (Wanhee), or a calm neutral such as beige (Tim); a dark layer over a bright shirt is the textbook case. **Doesn't:** when the bright pieces outnumber the calm ones (color.5).
- **Interacts with:** color.2 (this is what makes an accent read deliberate), pattern.4 (the same move tones down a big print), contrast.1 (a design shirt under a black blazer is toned down and witty at once).
- **Sources:** Wanhee · `tNVdA_arEa8` · [00:31] · "surround it with black or dark brown or dark Navy"; Wanhee · `tNVdA_arEa8` · [01:02] · "much more toned down much more Compact and trustworthy"; Wanhee · `rNCrnP-os0U` · [06:10] · "use Caps or hats and shoes as a way to contain"; Tim · `RrGbfY6NTZI` · [07:33] · "a great anchor to an outfit comprised of multiple colors" (beige with purple or yellow); Tim · `_6-4CHHXg3c` · [07:35] · "with a mostly neutral color outfits especially darker tones"; Frugal · `Jh8dz-KZcfY` · [03:47] (the red bag on all black, as in color.2)
- **The four:** Wanhee and Tim say it; Frugal agrees by example; Jaye agrees in effect (a bright piece on his all-black base, `Pxeeh-caTJg` [20:41]).
- **Engine today:** has it differently [COL-11]: the credit needs a dark neutral **piece of clothing** (black, charcoal, navy, dark denim); dark brown is missing from the list, shoes don't count (Wanhee's containing shoes), and a beige anchor earns nothing.
- **AI can see it:** yes (`color_family`, `saturation`, `category`); hats are blurred and never count.
- **Frame:** `inputs/youtube/shots/tNVdA_arEa8/f-00-36.jpg` (a bright purple shirt under a dark coat, labelled "dark coat" and "bright purple"); `inputs/youtube/shots/tNVdA_arEa8/f-01-07.jpg`; `inputs/youtube/shots/RrGbfY6NTZI/f-07-38.jpg`

#### color.4. Keep to about three colors; black and white count as half, shades of one color count less, and an all-neutral outfit can carry more.
- **Strength:** fault (over three). **Holds when:** counting every visible piece; Wanhee says two is better and three only "unless you know what you're doing". **Doesn't:** Tim lets four neutrals work (blue jeans, cream hoodie, black shoes, brown jacket) and counts shades as half; Wanhee would count that same outfit at 3.5.
- **Interacts with:** color.8 (shades of one color barely use the count), color.2 (the accent costs one of the three), pattern.1 (a multicolor piece adds several colors at once: Tim's multicolor scarf was "a bit too distracting", `wIib9hzVUuw` [06:07]).
- **Sources:** Tim · `IUMqpLeCT-E` · [01:40] · "you shall not use colors in excess of three"; Tim · `IUMqpLeCT-E` · [02:11] · "you could count each of those Shades as half colors"; Tim · `XIYvycsZxDk` · [01:45] · "many different colors but because they're all neutrals the combo still works"; Wanhee · `e2MgmGDLV9Q` · [06:15] · "as a fashion newbie you should never dress more than three colors"; Wanhee · `ew3gCk1zkso` · [04:19] · "black and white count as 0.5"; Wanhee · `e2MgmGDLV9Q` · [06:45] · "people that wear Too Many Colors they just look disjointed"; Wanhee · `Uw-vpUq8Ewg` · [04:58] · "if you wear Too Many Colors it looks wrong it looks disjointed"
- **The four:** Tim and Wanhee agree on three; they differ on counting (Tim: neutrals can exceed it, `XIYvycsZxDk` [01:45]); Jaye and Frugal give no count but both keep a narrow palette.
- **Engine today:** has it differently [COL-1]: counts only **accent** (non-neutral) colors, 3+ accents −2.5, five families with two accents −1.0, muted accents half. That is Tim's version (neutrals free), looser than Wanhee's.
- **AI can see it:** yes (`color_family` per piece); the colors inside a pattern are not read, so a multicolor print is under-counted; socks not read.
- **Frame:** `inputs/youtube/shots/e2MgmGDLV9Q/f-06-20.jpg` (Wanhee in black and grey, "1.5 colors"); `inputs/youtube/shots/ew3gCk1zkso/f-04-24.jpg`; `inputs/youtube/shots/XIYvycsZxDk/f-01-50.jpg`

#### color.5. Many brights at once, or bright head to toe, is the fault everyone names; three bright wheel colors together are the worst case.
- **Strength:** fault. **Holds when:** several saturated colors, or one bright color over the whole body, or bold colors plus striking patterns "clashed" to stand out. **Doesn't:** fixed by removing color, but by toning down (color.3); styles that live on brights (Y2K, loud streetwear) are "not beginner friendly" for Jaye, not wrong.
- **Interacts with:** pattern.1 (bright plus loud print stacks the cost), color.6 (two brights is the edge case).
- **Sources:** Wanhee · `rNCrnP-os0U` · [05:07] · "like I'm a fairy in a mermaid movie"; Tim · `zJ5LCenTcf8` · [00:37] · "think bold colors striking patterns and make sure you Clash them" (mocking it); Tim · `wIib9hzVUuw` · [02:32] · "color combos that look good on paper" (his old red, yellow and blue outfits); Jaye · `Pxeeh-caTJg` · [22:43] · "a all yellow, orange, and red wardrobe"
- **The four:** Tim, Wanhee and Jaye agree; Frugal shows a famous outfit of off-palette brights saved by composition (`N8RAKkiqe1w` [09:03], not menswear) as the exception.
- **Engine today:** has it [COL-1], [COL-2], [STY-6] (and the dealbreaker draft S4).
- **AI can see it:** yes (`saturation`, `color_family`); "bright" itself is untested for steadiness.
- **Frame:** `inputs/youtube/shots/zJ5LCenTcf8/f-00-42.jpg`; `rNCrnP-os0U`: none (described only); `inputs/youtube/shots/wIib9hzVUuw/f-03-38.jpg` is the nearest still but outside the window: none (described only).

#### color.6. Two strong non-neutral colors can work when they are at the same strength, one leads and the rest is calm; a strong color next to a pale one looks unbalanced.
- **Strength:** nuance (a clean, matched pair) · fault (strength mismatch). **Holds when:** both colors have "the same kind of force" (strong blue with strong brown, beige or yellow), the outfit around them is quiet, and nothing else competes. Wanhee calls it the hard, "fashion icon" look. **Doesn't:** a "really saturated blue" with a "really pale pink"; one tone "a little off" unbalances the whole outfit.
- **Interacts with:** color.3 (a neutral or dark surround), color.12 (one big, one small), shape (the founder's red shirt over somewhat baggy blue pants "might be a 7.8… or an 8" only because the proportions are good); see "When a risky color works".
- **Sources:** Wanhee · `ew3gCk1zkso` · [09:06] · "you want to get them in the same like strength of color"; Wanhee · `ew3gCk1zkso` · [09:39] · "yellow shirt with a purple jacket"; Wanhee · `e2MgmGDLV9Q` · [01:34] · "it can kind of just look really unbalanced"; Wanhee · `tNVdA_arEa8` · [04:06] · "it's that tiny detail that's going to completely unbalance your outfit"; Wanhee · `RtxJqd5Drps` · [13:00] · "He combined blue and yellow"; Tim · `FUWET2HH-us` · [02:43] · "the orange can look quite cool as well" (an orange parka worn as the statement, against a contrasting green, caption unclear); Frugal · `TQi2YaZ5yNY` · [02:36] · "they're still good contrast but it's not so jarring"
- **The four:** Wanhee states it; Tim and Frugal agree by example; Jaye silent. Tim's default is still to avoid louder colors (`0JtnbgtbQfE` [03:47]).
- **Engine today:** has it differently [COL-2]: two bright pieces always cost −2.0 (−1.0 in streetwear), which is exactly Wanhee's **matched** case; his failure case (bright with a pale or muted piece) costs nothing ([COL-1] counts the muted one as half).
- **AI can see it:** weakly (`saturation` has two levels, so "pale" and "dusty" are both "muted"; no value read to tell strong-and-dark from strong-and-light).
- **Frame:** `inputs/youtube/shots/TQi2YaZ5yNY/f-02-41.jpg` (a muted peach sweatshirt next to a mint hoodie, both over dark indigo jeans: soft contrast, not jarring); `inputs/youtube/shots/FUWET2HH-us/f-02-48.jpg` (the still shows the black colorway, not the orange parka); `ew3gCk1zkso` [09:06]: none (described only)

#### color.7. Muted, deeper versions of a color read more grown-up and premium; bright ones read young and playful, which is not wrong.
- **Strength:** nuance (a small lift for muted). **Holds when:** the same hue is available both ways: burgundy over bold red, muted olive over bright green, a deep true black over a washed-out one. **Doesn't:** a bright piece is not a fault on its own; Jaye wants bright accents in a wardrobe.
- **Interacts with:** color.6 (muted makes a complementary pair wearable), color.9 (fading is wanted in denim and all black, against Tim's "deep black" point).
- **Sources:** Tim · `SNjfZ5NKndc` · [02:32] · "a muted olive green will feel more premium and elevated"; Tim · `SNjfZ5NKndc` · [03:02] · "less saturated, darker versions of your favorite colors"; Tim · `RrGbfY6NTZI` · [04:50] · "saturated shades of pink are perceived as energetic and vibrant"; Tim · `YGm7JMniGVc` · [03:47] · "gives the Garment a more elevated premium feel" (deep black); Wanhee · `tNVdA_arEa8` · [03:06] · "the more understated and muted it is the better"; Frugal · `TQi2YaZ5yNY` · [04:42] · "earthy you know washed out colors"
- **The four:** Tim, Wanhee, Frugal agree; Jaye differs (`ws2jf0Yp_4c` [06:01] "a wardrobe without bright accents is a boring wardrobe").
- **Engine today:** has it differently [COL-1], [COL-2]: muted accents count half and only brights can "fight"; no credit for choosing muted.
- **AI can see it:** yes (`saturation` muted/bright).
- **Frame:** `inputs/youtube/shots/SNjfZ5NKndc/f-02-37.jpg` (the hue/brightness/saturation palette board); `inputs/youtube/shots/SNjfZ5NKndc/f-03-07.jpg`; `inputs/youtube/shots/YGm7JMniGVc/f-03-50.jpg`

#### color.8. Shades of one color (navy with light blue, black with charcoal and grey, an all-grey or all-green outfit) is the easiest reliable win, when the shades actually differ.
- **Strength:** lift. **Holds when:** there is a visible step in lightness (indigo jeans with a light-blue shirt; grey trousers with a charcoal top) or a texture change; one bold color head to toe also works (Tim's all-green, Frugal's pastel-pink set). **Doesn't:** one identical shade and one texture (color.9).
- **Interacts with:** color.4 (shades count once or half, so it never breaks the count), contrast.5 (texture is what makes it rich), color.2 (the best stage for a single accent).
- **Sources:** Wanhee · `e2MgmGDLV9Q` · [00:00] · "tone in tone is when you match the same color but in" (his 2024 label); Wanhee · `uBsIrt-zU0I` · [03:57] · "Shades of blue is the easiest way to dress."; Wanhee · `uBsIrt-zU0I` · [05:06] · "if you're wearing gray, charcoal, black, or charcoal and black"; Tim · `OqoUgLxknJc` · [10:17] · "simple monochromatic all gray outfit"; Tim · `-e9Is50-fn0` · [02:44] · "Especially when you incorporate different textures."; Tim · `YGm7JMniGVc` · [01:10] · "killing it in this monochromatic green outfit"; Frugal · `Jh8dz-KZcfY` · [04:50] · "layered together with all the different shades and textures"; Frugal · `ieMBSpSiv3E` · [06:05] · "the Shameless and Powerful high sock" (the matched pastel set); Jaye · `Ulx1vjAREu0` · [14:19] · "black will never fail you" (his monochrome)
- **The four:** all agree.
- **Engine today:** lacks it: [COL-7] is a tip only, KD-6 (the tonal credits wait for a light/dark read); [COL-13] pays +0.5 only when a layer matches the pants with a different top between; [MIN-2] counts tonal as one recognition point.
- **AI can see it:** weakly (`color_family` has depth pairs: denim_light/mid/dark, black/charcoal/grey, cream/white; no value field, no texture).
- **Frame:** `inputs/youtube/shots/uBsIrt-zU0I/f-04-02.jpg` (navy top and lighter jeans, held up); `inputs/youtube/shots/OqoUgLxknJc/f-10-22.jpg`; `inputs/youtube/shots/YGm7JMniGVc/f-01-12.jpg`; `inputs/youtube/shots/Jh8dz-KZcfY/f-04-55.jpg`; `inputs/youtube/shots/ieMBSpSiv3E/f-06-10.jpg`

#### color.9. All black is the safe default, but one flat, identical black (or grey) with no shade, fade or texture change reads like a uniform; fix it with a faded or dark-grey piece, a texture, or a light touch.
- **Strength:** fault, mild (flat) · nuance (all black done right is a floor). **Holds when:** every piece is the same jet black and the same surface ("restaurant host"); all-grey with only grey "can feel cold". **Doesn't:** when blacks differ (a faded tee with new black jeans), textures differ, or a white or bright touch breaks it.
- **Interacts with:** contrast.5 (texture), color.10 (a light inner layer), color.2 (one point), condition (fading is wanted here, unlike wear).
- **Sources:** Frugal · `Vn6KlXkU2xA` · [00:00] · "the easiest color to build a complete wardrobe around"; Frugal · `Vn6KlXkU2xA` · [02:08] · "you have to play with the tones and shades of your pieces"; Frugal · `Vn6KlXkU2xA` · [03:11] · "a new black shirt with a pair of just faded black jeans"; Tim · `XSF9AOx7sdU` · [04:44] · "when in doubt wear black"; Tim · `-e9Is50-fn0` · [08:46] · "So simple yet so powerful. It's foolproof."; Tim · `RrGbfY6NTZI` · [05:55] · "consider breaking up your black outfits with some lighter colors like white"; Tim · `RrGbfY6NTZI` · [08:04] · "consider balancing it with other colors even if it's just other neutrals" (grey); Jaye · `23ZCHsp9AZU` · [02:32] · "without the jewelry the outfit has no character"; Wanhee · `uBsIrt-zU0I` · [05:06] (shades of black, color.8)
- **The four:** all call all black safe; Frugal and Jaye add the condition; Tim's newest view (2025, "foolproof") drops his 2023 condition, so date says all black is fine, but Frugal's flat-black fault stands for the identical-shade case.
- **Engine today:** has it differently [COL-7], [MIN-8]: all black costs nothing and earns nothing; flatness is a tip only, and the rescue (texture, shade) can't be seen.
- **AI can see it:** weakly (black vs charcoal is read; fade, sheen and texture are not; jewelry never counts).
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-00-05.jpg` (the flat all-black look); `inputs/youtube/shots/Vn6KlXkU2xA/f-03-16.jpg`; `inputs/youtube/shots/-e9Is50-fn0/f-08-51.jpg`; `inputs/youtube/shots/RrGbfY6NTZI/f-06-00.jpg`

#### color.10. Value placement: a light touch balances a dark outfit, lighter layers usually sit inside darker ones, and light or bright areas pull the eye (bright shoes pull it down).
- **Strength:** lift (a light touch on a dark outfit; a light inner layer) · nuance (where the eye goes). **Holds when:** a white tee inside, a white tank under a dark flannel, a colorful hood under a black jacket, white sneakers or a white peek in a tonal grey outfit. **Doesn't:** "not the case 100% of the time" (Tim); a contrasting shoe is a choice: Tim avoids it when he wants the eye up, Wanhee and Frugal like color at the feet.
- **Interacts with:** shoes (Tim's matched shoe vs Wanhee's brighter sneaker), layering (shows_below_outer), color.2 (an accent pops by value as much as by hue).
- **Sources:** Wanhee · `rNCrnP-os0U` · [05:39] · "the darker color is balanced by the light color"; Tim · `wIib9hzVUuw` · [08:38] · "lighter colors closer to the body"; Tim · `vQ6_okzfNSs` · [01:38] · "little touches of white with a t-shirt peeking out of the hoodie"; Frugal · `Jh8dz-KZcfY` · [06:29] · "I like the colorful hood on the black jacket"; Frugal · `Jh8dz-KZcfY` · [05:56] · "color sock pop coming through my pants"; Tim · `XSF9AOx7sdU` · [00:34] · "brighter lighter colors will draw more attention to that area"; Tim · `wIib9hzVUuw` · [08:07] · "I don't really want the eye to be drawn towards the feet"; Jaye · `1nntxNqbmk8` · [06:03] · "if you have bright shoes, your eyes are directed downward"
- **The four:** all agree on the light touch and on light drawing the eye; they differ on whether the eye at the feet is wanted (Tim no; Wanhee, Frugal yes; Jaye neutral).
- **Engine today:** lacks it (no value read; a white inner layer or white shoe earns nothing on Color; [SHO-10] pays a loud shoe as the one accent +0.5, the nearest rule).
- **AI can see it:** weakly (`color_family` per layer and `shows_below_outer` find a light inner layer; no value field; socks not read).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-08-43.jpg`; `inputs/youtube/shots/wIib9hzVUuw/f-08-12.jpg`; `inputs/youtube/shots/Jh8dz-KZcfY/f-06-34.jpg`; `inputs/youtube/shots/vQ6_okzfNSs/f-01-43.jpg` (the still shows his tan-jacket outfit, not the grey one); `inputs/youtube/shots/XSF9AOx7sdU/f-00-39.jpg`

#### color.11. A light tonal outfit (white on off-white, cream or white relaxed jeans with a white tee) looks clean, especially in summer.
- **Strength:** lift. **Holds when:** the lights are close but not identical (Tim separates white, off-white and cream), shape is right; sneakers or loafers both work. **Doesn't:** said for summer and warm weather; Tim also wears white trousers in fall.
- **Interacts with:** color.8 (the light end of shades of one color), season.
- **Sources:** Tim · `o5RnTT2oafg` · [03:54] · "I think it looks really nice in a light tonal outfit"; Tim · `2KblatXQTGs` · [01:37] · "a simple oversized white tee and sneakers or even loafers"; Tim · `YGm7JMniGVc` · [03:14] · "the tonal white look very clean"; Tim · `a7FgCE9NPmw` · [05:39] · "White, not cream or like a vintage white"; guest Harry in Tim · `OqoUgLxknJc` · [02:48] · "white can sometimes be a bit too bright"
- **The four:** only Tim (others silent on light-on-light); Wanhee's shades-of-one-color praise (color.8) supports it in principle.
- **Engine today:** has it the other way [COL-12]: white or cream top over white or cream bottoms with no dark piece costs −1.0 (the founder's taste call, "cream on cream is awkward"). The creators side against it; it needs the founder's call, not a quiet change.
- **AI can see it:** weakly (`color_family` has white and cream; khaki/tan and light grey flip between runs; no value read).
- **Frame:** `inputs/youtube/shots/o5RnTT2oafg/f-03-59.jpg`; `inputs/youtube/shots/2KblatXQTGs/f-01-40.jpg`; `inputs/youtube/shots/YGm7JMniGVc/f-03-19.jpg`; `inputs/youtube/shots/a7FgCE9NPmw/f-05-44.jpg`

#### color.12. Color impact grows with area: a bright color on a jacket or hoodie becomes the statement, on a small piece it is a point; bring loud colors in small first.
- **Strength:** nuance. **Holds when:** a well-colored hoodie or bomber "does damage" (Frugal); Tim's green leather jacket and orange parka are statements; burgundy belongs on accessories or statement pieces, "not on basics". **Doesn't:** a loud main piece is "quite the risky jump" before the eye is used to it; a loud shape (a chunky runner) wants a calm color.
- **Interacts with:** color.2 (small = point), color.6 (one leads by area), shoes (shape and color share visual weight).
- **Sources:** Frugal · `TnNv7Zvui6E` · [03:05] · "there's a lot of visual real estate here on your outfit"; Frugal · `RlcdMBj5Z2E` · [07:30] · "a cool colored bomber jacket would really do some damage"; Frugal · `4hwelpjhDTM` · [06:30] · "accessories and subtle layering are good starts"; Frugal · `FFDYIGhiIk8` · [13:24] · "get something Calm before you get into the more pronounced colorways"; Tim · `-e9Is50-fn0` · [01:39] · "rather than on your wardrobe basics like t-shirt or trousers"; Tim · `UNkA9HhbjXY` · [14:46] · "it's a cool piece man" (green leather jacket)
- **The four:** Frugal and Tim agree; Wanhee and Jaye silent on area as such.
- **Engine today:** lacks it ([COL-11] treats a bright sock-sized piece and a bright coat the same; accessories never count).
- **AI can see it:** yes (`category`, `subcategory` give the piece's size class; accessories not read).
- **Frame:** `inputs/youtube/shots/TnNv7Zvui6E/f-03-10.jpg`; `inputs/youtube/shots/RlcdMBj5Z2E/f-07-35.jpg`; `inputs/youtube/shots/4hwelpjhDTM/f-06-35.jpg`; `inputs/youtube/shots/FFDYIGhiIk8/f-13-29.jpg`; `inputs/youtube/shots/UNkA9HhbjXY/f-14-51.jpg`

#### color.13. A color repeated subtly across pieces ties the outfit together; matching it obviously, or matching everything to the shoe, looks formulaic.
- **Strength:** lift, small (subtle) · fault, mild (obvious). **Holds when:** a little navy in the top echoes navy pants; a black cap ties to black pieces; a cream cap picks up the jeans; the sneaker repeats the tee's red. **Doesn't:** "here's a green here's a green" (Wanhee); Frugal's red-and-white jacket over red-and-white shoes "solves" it but boxes you in (he says those outfits still look good).
- **Interacts with:** color.2 (an obvious double of the accent is the try-hard case), shoes ([COL-5]'s shoe tie-in).
- **Sources:** Wanhee · `rNCrnP-os0U` · [06:41] · "so the subtler you do it the better"; Tim · `wIib9hzVUuw` · [05:06] · "This black cap will tie in with the rest of the black pieces"; Tim · `wIib9hzVUuw` · [05:36] · "a little pop of color that ties back in"; Jaye · `ctdMGExbNws` · [08:41] · "matching colors subtly"; guest in Tim · `UNkA9HhbjXY` · [07:01] · "matching with the red on the top"; Frugal · `TQi2YaZ5yNY` · [10:04] · "when you put like the square through the square hole"; Frugal · `TQi2YaZ5yNY` · [10:34] · "obviously my jacket has to be red and white"
- **The four:** all agree the echo must be subtle.
- **Engine today:** has it differently [COL-5], [COL-13]: +0.5 when shoes pick up a top color and +0.5 when a layer matches the pants, but never for white, black, grey, navy or denim (Tim's black cap and Wanhee's navy thread are exactly those), and nothing checks subtle vs obvious.
- **AI can see it:** yes (`color_family` across pieces); how big the echo is, weakly (by `category` only).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-05-11.jpg`; `inputs/youtube/shots/UNkA9HhbjXY/f-07-06.jpg`; `inputs/youtube/shots/TQi2YaZ5yNY/f-10-09.jpg`; `inputs/youtube/shots/TQi2YaZ5yNY/f-10-39.jpg`; `rNCrnP-os0U`: none (described only)

#### color.14. The color wheel is a guide, not a verdict; the pairs the creators name are mostly a neutral with a neutral or one color: navy or blue with brown, navy with black, black with brown, beige with grey, light blue with beige, blue with off-white, navy with khaki and brown, brown with green, red with grey.
- **Strength:** nuance. **Holds when:** judging a pairing on the actual outfit; a wheel-correct outfit can "hurt my eyes", a wheel-wrong one can work. **Doesn't:** Frugal's 2023 tip teaches complementary pairs as "naturally satisfying"; his 2024 video and Tim's 2025–2026 videos move past it (date wins).
- **Interacts with:** color.6 and color.7 (saturation and strength decide a pair, not hue), color.1.
- **Sources:** Frugal · `TQi2YaZ5yNY` · [02:05] · "it really only matters what looks good in practice in context"; Frugal · `TQi2YaZ5yNY` · [03:09] · "it hurts my eyes but it makes sense though"; Frugal · `TQi2YaZ5yNY` · [06:51] · "doesn't mean you have to wear an orange hoodie"; Frugal (2023) · `fZ2Jc3gOZMI` · [00:00] · "very naturally satisfying to the eye especially when paired together"; Tim · `vQd36IKIkOg` · [06:06] · "rules can be broken and color combination guides"; Tim · `vQd36IKIkOg` · [06:06] · "I think those two colors go beautifully together" (navy and black); Tim · `RrGbfY6NTZI` · [07:01] · "blue naturally looks good with brown"; Tim · `RrGbfY6NTZI` · [07:01] · "green is also a natural fit with brown"; Tim · `YGm7JMniGVc` · [01:10] · "the black and brown combo is clean"; Tim · `XIYvycsZxDk` · [03:25] · "two soft neutral colors that complement each other seamlessly"; Tim · `_6-4CHHXg3c` · [04:22] · "I love the light blue and beige color combo"; Tim · `2KblatXQTGs` · [01:37] · "I love the blue and off-white color combo"; Tim · `RrGbfY6NTZI` · [08:37] · "you can wear red and gray together"; Wanhee · `uBsIrt-zU0I` · [05:37] · "it's navy, khaki, and brown."; Wanhee · `ew3gCk1zkso` · [10:11] · "khaki and brown they tend to go well"
- **The four:** all agree the wheel is not enough (Frugal's 2023 view is superseded by his 2024 one); Wanhee and Jaye never use it.
- **Engine today:** has it (no hue or wheel rule exists; all named pairs are free). One edge: [COL-3] charges a dark blazer with dark trousers that almost match (navy with charcoal), a tailoring rule from outside the four; Tim's navy-with-black praise is about separates, so no clash.
- **AI can see it:** yes (`color_family`; hue derivable).
- **Frame:** `inputs/youtube/shots/TQi2YaZ5yNY/f-03-14.jpg`; `inputs/youtube/shots/vQd36IKIkOg/f-06-11.jpg`; `inputs/youtube/shots/RrGbfY6NTZI/f-07-06.jpg`; `inputs/youtube/shots/uBsIrt-zU0I/f-05-42.jpg`; `inputs/youtube/shots/XIYvycsZxDk/f-03-30.jpg`; `inputs/youtube/shots/_6-4CHHXg3c/f-04-27.jpg`; `fZ2Jc3gOZMI`: pending

#### color.15. Denim: classic blue is a neutral; two denim pieces look better in clearly different washes; a slight fade or a blended wash pairs more easily, while unusual washes count as colors.
- **Strength:** nuance (a same-wash double is a mild fault). **Holds when:** a dark-grey or black jacket over relaxed blue jeans (Tim's fix); faded blue "goes with everything"; a mottled grey wash reads edgier. **Doesn't:** Tim (Mar 2025) also allows the same wash top and bottom "when done right"; his newer video (Sep 2025) prefers different washes; Jaye calls badly faded jeans "disgusting", which is condition, not a wash choice.
- **Interacts with:** shape (solid, saturated denim shows the cut sharply, so the fit must be right), condition.
- **Sources:** Tim · `wIib9hzVUuw` · [04:35] · "going for slightly different washes looks better"; Tim · `-e9Is50-fn0` · [00:31] · "same wash top and bottom or for a contrasted wash"; Tim · `0JtnbgtbQfE` · [04:20] · "considered a neutral if it's in a classic blue wash"; Tim · `K2HS3_8cTx8` · [03:48] · "it's not one homogeneous color there's a nice blend"; Frugal · `TnNv7Zvui6E` · [11:16] · "fading and texture fuses the piece just a bit"; Frugal · `TnNv7Zvui6E` · [10:45] · "a more solid color creates a more defined shape"; Frugal · `WDsQRHa8jBY` · [06:23] · "when in doubt just get a faded blue that goes with everything"; Jaye · `CI-wkEOHRAg` · [03:05] · "the fade on them is disgusting"
- **The four:** Tim and Frugal agree; Tim's two 2025 videos differ (newest: different washes); Jaye on bad fades only; Wanhee silent.
- **Engine today:** has it [COL-10] (same light or mid wash −1.0; dark on dark, black denim and different washes free); every denim wash counts as neutral; fade and blend unread.
- **AI can see it:** yes for wash (`denim_light/mid/dark`); no for fade or blend.
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-04-40.jpg`; `inputs/youtube/shots/-e9Is50-fn0/f-00-36.jpg`; `inputs/youtube/shots/K2HS3_8cTx8/f-03-53.jpg`; `inputs/youtube/shots/TnNv7Zvui6E/f-11-21.jpg`; `inputs/youtube/shots/WDsQRHa8jBY/f-05-54.jpg`

#### color.16. Warm and cool, and mood: keep the palette's temperature mostly together or use one warm accent in a cool outfit; colors carry a mood (black grounded, lots of bright festive) that should suit the occasion.
- **Strength:** nuance (low priority). **Holds when:** earth tones as one warm family; burgundy as the warm accent on cool colors; dark brown gloves with earth tones. **Doesn't:** no creator teaches temperature as a rule; mood is an occasion fit, not a fault in itself.
- **Interacts with:** color.2, occasion (yellow "not so serious").
- **Sources:** Tim · `CJv4TGLrdig` · [04:06] · "burgundy is a great little accent piece in cooler tone outfits"; Tim · `jaOSdGqtgYY` · [12:25] · "I do very much resonate with the use of warm neutrals"; Tim · `-e9Is50-fn0` · [07:07] · "deep, rich, and warmer than its counterparts" (chocolate brown); Jaye · `5Dfr0PXTTpM` · [02:34] · "Earth tones is more about like very soft colors."; Wanhee · `tNVdA_arEa8` · [06:10] · "blacks usually will make you look more grounded and serious"; Tim · `RrGbfY6NTZI` · [02:39] · "be careful with where and when you wear yellow"; Jaye · `VUEaMYx10mM` · [09:54] · "colors can also display emotion like black can display mysterious"
- **The four:** Tim and Jaye on warm families; Wanhee, Tim, Jaye on mood; Frugal silent.
- **Engine today:** lacks it (no temperature or mood rule; occasion uses dressiness only).
- **AI can see it:** yes, derivable (`color_family` to warm/cool/neutral with a fixed table).
- **Frame:** `inputs/youtube/shots/CJv4TGLrdig/f-04-11.jpg`; `inputs/youtube/shots/5Dfr0PXTTpM/f-02-39.jpg`; `inputs/youtube/shots/-e9Is50-fn0/f-07-12.jpg`; `tNVdA_arEa8` [06:10]: none (described only)

#### color.17. A head-to-toe single earth tone (a tan or brown matched sweatsuit) read as a cliché to Frugal in 2023; the same clothes in black felt newer.
- **Strength:** nuance (trend, dated by 2023). **Holds when:** the matched cappuccino set, an ambitious outfit. **Doesn't:** "if you're not trying to say much" it is fine; Tim still keeps warm neutrals (2023) and earth-tone accents (2026). Recommend no points: it is fatigue, not a mistake.
- **Interacts with:** color.8 (tonal itself is praised).
- **Sources:** Frugal · `9GFKiZx89oM` · [00:33] · "earth tone palette over the past seven years has gone completely stale"; Frugal · `9GFKiZx89oM` · [05:36] · "it's the color palette and not necessarily the clothes"
- **The four:** only Frugal; Tim differs (`jaOSdGqtgYY` [12:25]).
- **Engine today:** lacks it (correctly).
- **AI can see it:** yes (`color_family`, matched set via [LNG-9]).
- **Frame:** `inputs/youtube/shots/9GFKiZx89oM/f-05-41.jpg` (all-black vs earth-tone looks side by side)

### When a risky color works

The founder's case: red sounds like it clashes with blue, but a red shirt with good proportions over somewhat baggy blue pants "might be a 7.8… or an 8". The four agree with him, under conditions. Read together, a risky pair (two non-neutrals, two brights, an off-palette color, a near-complementary pair) works when:

1. **One of them is muted or darker.** Tim's dusty red-and-navy jeans "pair well with darker khaki greens" (red and green, both muted: `vQ6_okzfNSs` [01:38]); burgundy over bold red, muted olive over bright green (`SNjfZ5NKndc` [02:32]–[03:02], `inputs/youtube/shots/SNjfZ5NKndc/f-02-37.jpg`); Frugal's soft peach next to mint, "still good contrast but it's not so jarring" (`TQi2YaZ5yNY` [02:36], `inputs/youtube/shots/TQi2YaZ5yNY/f-02-41.jpg`). Navy with brown, the one complementary pair everyone praises, is the muted version of blue with orange.
2. **Or both are strong on purpose, at the same strength.** Strong blue with strong yellow or brown; a yellow shirt with a purple jacket is the "fashion icon" look (Wanhee `ew3gCk1zkso` [09:06]–[09:39], described only); a stranger who "combined blue and yellow" (`RtxJqd5Drps` [13:00], described only).
3. **The rest is calm and dark or neutral around it.** A bright purple shirt under a dark coat (`tNVdA_arEa8` [00:31], `inputs/youtube/shots/tNVdA_arEa8/f-00-36.jpg`); purple or yellow anchored by beige (`RrGbfY6NTZI` [07:33], `inputs/youtube/shots/RrGbfY6NTZI/f-07-38.jpg`); black cap and shoes "contain" a bright outfit (`rNCrnP-os0U` [06:10]).
4. **One color clearly leads by area, the other is small.** Tim's orange parka as the one statement against green (`FUWET2HH-us` [02:43], `inputs/youtube/shots/FUWET2HH-us/f-02-48.jpg`, a different colorway on the still); start loud colors on a beanie or a subtle layer (`4hwelpjhDTM` [06:30]); a bright orange scarf on a dark coat (`inputs/youtube/shots/Jh8dz-KZcfY/f-03-52.jpg`).
5. **Each color has a job inside one palette.** Frugal's red-and-white sneakers under a sage hoodie, white tee and dark wide jeans: "a little structure to what each color is doing" (`TQi2YaZ5yNY` [11:05], `inputs/youtube/shots/TQi2YaZ5yNY/f-11-10.jpg`); an outfit of off-palette brights that are "acquired taste" one by one but "a cultural reset" together (`N8RAKkiqe1w` [09:03], `inputs/youtube/shots/N8RAKkiqe1w/f-09-08.jpg`; not menswear, evidence only).
6. **The shape is right.** The founder's own condition; Tim: a palette alone "won't make a bad outfit good" (`SNjfZ5NKndc` [03:02]); Frugal: solid saturated color "creates a more defined shape", so the cut must be good (`TnNv7Zvui6E` [10:45]).

**What makes it worse:**
- Both bright **and** both big, or a third bright (color.5): "like I'm a fairy in a mermaid movie" (`rNCrnP-os0U` [05:07]); his old red, yellow and blue outfits (`wIib9hzVUuw` [02:32]).
- Strength mismatch: "really saturated blue" with "really pale pink" (`ew3gCk1zkso` [09:39]); "a little off" unbalances everything (`tNVdA_arEa8` [04:06]).
- A loud pattern on top of the clash: "bold colors striking patterns and make sure you Clash them" (`zJ5LCenTcf8` [00:37], `inputs/youtube/shots/zJ5LCenTcf8/f-00-42.jpg`).
- Echoing the risky color again (orange socks plus orange cap, `e2MgmGDLV9Q` [04:08]) or adding more points (`e2MgmGDLV9Q` [02:36]).
- The piece bought alone, with no plan around it: a fluorescent polo "sticks out like a sore thumb" (`ew3gCk1zkso` [03:15]); an outfit built from the orange Jordans outward (`ew3gCk1zkso` [13:52]).
- Bad proportions: the founder's 7.8 depends on them.

**For scoring (a reading, not yet a rule).** Today [COL-2] charges two bright pieces −2.0 whatever surrounds them, and the founder's red shirt over blue jeans costs nothing (denim is neutral) but red over bright blue chinos costs 2 Color points. A creator-faithful version: keep [COL-2] for two brights with no dark or neutral piece beside them, or with a loud print, or with a third color; halve it (as streetwear already does) when the two are the only colors, at least one other piece is a dark neutral, nothing is patterned, and Proportions has no fault. The reading can't see "same strength" beyond bright/muted, so the strength-mismatch fault waits for a value read.

---

### Contrast between pieces (formality, structure, texture)

Color and value contrast between pieces are in color.6, color.8–color.10 and color.15.

#### contrast.1. Tension between two opposed elements raises a good outfit: tailored against relaxed, elegant against utilitarian or streetwear, a statement color in a monochrome outfit.
- **Strength:** lift. **Holds when:** the two elements are clear and the outfit is otherwise controlled; one experimental piece in a clean wardrobe. **Doesn't:** "not every outfit you put on needs to have that tension"; past a point "a little too experimental" (Tim); screaming "look how different I am" is try-hard (Wanhee).
- **Interacts with:** contrast.2–3 (the formality version), color.2 (the color version), pattern.4 (a design under a dark blazer).
- **Sources:** Tim · `IUMqpLeCT-E` · [01:09] · "found at the jux depos between two contrasting elements" (caption for "juxtaposition"); Tim · `0ilmLux6mPg` · [07:11] · "the contrast between the structured jacket and the relaxed trousers"; Tim · `0ilmLux6mPg` · [11:02] · "something tailored yet relaxed"; Tim · `XIYvycsZxDk` · [03:25] · "I love the contrast between an elegant piece" (pleated trousers with a varsity jacket); Tim · `dk1efCZqwos` · [11:00] · "fabric combinations that shouldn't work but somehow still do"; Wanhee · `tNVdA_arEa8` · [02:36] · "going against the expectation" (his "wit"); Frugal · `Jh8dz-KZcfY` · [02:43] · "sometimes oppos Vibes can create pretty interesting composition"
- **The four:** Tim, Wanhee, Frugal agree; Jaye silent in these notes.
- **Engine today:** has it differently [STY-4], [STY-5], [STY-3]: mixes are mostly free or charged; no credit for deliberate tension (the shape credits [PRO-6], [PRO-7] reward structure, not the contrast).
- **AI can see it:** weakly (formality from `category`/`subcategory` and the dressiness levels; structure only through `volume`; "elegant" vs "utilitarian" through piece type).
- **Frame:** `inputs/youtube/shots/0ilmLux6mPg/f-07-16.jpg`; `inputs/youtube/shots/XIYvycsZxDk/f-03-30.jpg`; `inputs/youtube/shots/IUMqpLeCT-E/f-01-14.jpg`; `inputs/youtube/shots/Jh8dz-KZcfY/f-02-48.jpg`; `inputs/youtube/shots/dk1efCZqwos/f-11-38.jpg` (the experimental flannel; none in the window after [11:00])

#### contrast.2. Smart casual is one traditionally smart piece with a casual one: a blazer with jeans and a tank, a suit with a turtleneck and sneakers, a tank under a summer suit, knitwear with smart trousers, a tailored coat over light denim tied by a leather shoe.
- **Strength:** lift. **Holds when:** the cut is relaxed enough to make the mix believable; a bridging piece (the leather shoe) helps; "when unsure, lean smarter". **Doesn't:** with a graphic tee (pattern.2) or three formality tiers (contrast.3).
- **Interacts with:** shoes (the shoe sets where the mix lands), tailoring (fit of the blazer), season (the tank-under-suit is a summer swap).
- **Sources:** Tim · `vQd36IKIkOg` · [07:14] · "pairing a traditionally smarter piece like a blazer with a traditionally casual"; Tim · `OqoUgLxknJc` · [10:47] · "wear the Blazer a lot more casual" (grey blazer, light jeans, white tank, black Chelsea boots); Tim · `OqoUgLxknJc` · [12:24] · "sneakers to make it it's a bit a bit more casual" (grey suit, turtleneck, white sneakers); Tim · `2KblatXQTGs` · [00:34] · "wear it with a suit for a different take on smart casual"; Tim · `jaOSdGqtgYY` · [06:59] · "knitwear and smart trousers this combo is the go-to casual attire"; Tim · `vQ6_okzfNSs` · [01:05] · "works beautifully when tied together with the leather shoe"; guest Harry in Tim · `OqoUgLxknJc` · [16:36] · "I've really dressed them down"; GQ (outsider) · `4fb4GyOylK8` · [07:45] · "I could wear it as a jacket with a pair of jeans"
- **The four:** Tim states it repeatedly; the October notes record all four praising a deliberate smart/casual mix (creators-rules A9); Wanhee's "sneakers with Formal Wear" as wit (`tNVdA_arEa8` [02:36]) agrees.
- **Engine today:** has it differently [STY-3], [STY-4]: the tank or tee under a layer is now judged by the layer (v11, good), but [STY-3] charges a blazer over light or mid-wash, relaxed or wide jeans −1.5, which is Tim's own outfit at [10:47]; the suit with sneakers is free on Style but [SHO-8] charges chunky sneakers under a blazer (white leather sneakers are fine).
- **AI can see it:** yes (`category`, `subcategory`, `color_family` wash, `leg_shape`).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-10-52.jpg` (the still shows the guest seated, not the outfit); `inputs/youtube/shots/OqoUgLxknJc/f-12-29.jpg`; `inputs/youtube/shots/OqoUgLxknJc/f-16-41.jpg`; `inputs/youtube/shots/vQ6_okzfNSs/f-01-10.jpg`; `inputs/youtube/shots/vQd36IKIkOg/f-07-19.jpg`; `inputs/youtube/shots/jaOSdGqtgYY/f-07-04.jpg`; `inputs/youtube/shots/4fb4GyOylK8/f-07-50.jpg`

#### contrast.3. Mix two formality tiers, never three; on a casual base, one smart piece is the recipe (sweatpants with a shirt or an overcoat).
- **Strength:** lift (two tiers, one smart element) · fault (three tiers, or several smart pieces fighting a casual base). **Holds when:** Tim's three tiers are casual, daily and smart: a daily knit with casual sweatpants; daily jeans with a smart shirt worn open over a tank. **Doesn't:** "not mandatory at all"; more than one smart element on sweatpants is not his recipe.
- **Interacts with:** contrast.2, loungewear (sweats with a dressed upper half).
- **Sources:** Tim · `0JtnbgtbQfE` · [06:36] · "the key though is to only ever mix two of these categories"; Tim · `-e9Is50-fn0` · [07:39] · "this works best when there's just one smarter element"
- **The four:** only Tim (others silent on tiers).
- **Engine today:** has it differently [STY-4], [LNG-2]: a gap of 2.5+ dressiness levels costs −1.5 (3.5+ −4.0), excused when a jacket is the dressy piece; sweats are held to 5.5/6.5/7.5 by signs of intent, so sweats with an overcoat reach 6.5–7.5 at most.
- **AI can see it:** yes (dressiness levels from `category`/`subcategory`).
- **Frame:** `inputs/youtube/shots/-e9Is50-fn0/f-07-44.jpg`; `0JtnbgtbQfE` [06:36]: none in the window (nearest `inputs/youtube/shots/0JtnbgtbQfE/f-06-07.jpg`, before the stamp)

#### contrast.4. The shoe and the top tilt the same trousers smart or casual, and many pieces live in two worlds; to raise an outfit, swap a piece for its smarter cousin.
- **Strength:** nuance. **Holds when:** jeans with boots and a knit lean smart, with sneakers and a hoodie casual; grey trousers swing elegant (leather boots, smart jacket) or casual (sneakers, tee); a utility jacket goes over denim or smart trousers; a trail sneaker matches techwear or contrasts with denim; the turtleneck is the hoodie's smarter cousin. **Doesn't:** gives no score on its own; it decides which world the outfit reads as.
- **Interacts with:** shoes ([SHO-4] the match window), cohesion (which look it reads as).
- **Sources:** Tim · `0JtnbgtbQfE` · [02:12] · "if I want to lean more smart I'll go for the boots"; Tim · `XIYvycsZxDk` · [02:17] · "the turtleneck is essentially the hoodie's more sophisticated cousin"; Tim · `2KblatXQTGs` · [03:45] · "the gray also feels a bit smarter"; Tim · `2KblatXQTGs` · [01:37] · "you can also wear it separately with denim or even smart trousers"; Tim · `uGregWdLahU` · [05:27] · "in contrast with the more standard Men's Wear Staples like denim"; Frugal · `FPHnmY5FTaI` · [04:48] · "living in a world between formal and casual"
- **The four:** Tim and Frugal agree; Wanhee and Jaye silent here.
- **Engine today:** has it ([SHO-4], [SHO-5] dressiness levels; the look detector reads the same piece into different styles by its partners).
- **AI can see it:** yes (`category`, `subcategory`).
- **Frame:** `inputs/youtube/shots/0JtnbgtbQfE/f-02-17.jpg`; `inputs/youtube/shots/XIYvycsZxDk/f-02-22.jpg`; `inputs/youtube/shots/2KblatXQTGs/f-03-50.jpg`; `inputs/youtube/shots/FPHnmY5FTaI/f-04-53.jpg`; `inputs/youtube/shots/uGregWdLahU/f-05-32.jpg`

#### contrast.5. Contrast the textures of neighbouring pieces: the same texture stacked blurs (a knit cardigan on a knit sweater), a different surface adds depth, and a clash of fabric moods spoils even matched colors.
- **Strength:** nuance (lift when it rescues a tonal outfit). **Holds when:** tonal and all-black outfits (texture does the work color can't); a nylon piece in an all-cotton outfit can be the point. **Doesn't:** Wanhee's merino knit with nylon shorts "feel off" even if the colors match (contrast must still share a mood).
- **Interacts with:** color.8, color.9 (texture rescues low color contrast), layering (thin to thick; owned by `layer.*`).
- **Sources:** Tim · `wIib9hzVUuw` · [05:06] · "it would have been better to contrast the textures"; Tim · `SNjfZ5NKndc` · [03:32] · "the right texture will add depth to your outfit"; Tim · `-e9Is50-fn0` · [02:44] · "Especially when you incorporate different textures."; Wanhee · `1wUp3RSAEqI` · [01:31] · "something nylon"; Wanhee · `ew3gCk1zkso` · [06:27] · "these Fabrics don't really match"; Frugal · `Jh8dz-KZcfY` · [04:50] · "layered together with all the different shades and textures"
- **The four:** all agree (Jaye: different materials on every black, in `layer.*` notes).
- **Engine today:** has it differently [STY-11]: knit over knit is a tip only; nothing else.
- **AI can see it:** no (fabric and texture are not read).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-05-11.jpg`; `inputs/youtube/shots/SNjfZ5NKndc/f-03-37.jpg`; `inputs/youtube/shots/-e9Is50-fn0/f-02-49.jpg`; `inputs/youtube/shots/1wUp3RSAEqI/f-01-06.jpg` (just before the stamp; none in the window)

---

### Pattern and print

#### pattern.1. Several loud pieces at once (bold colors with striking patterns, a huge graphic with ripped patched jeans and statement sneakers, florals with leather and logos, the e-boy pile) look bad; one loud piece is enough.
- **Strength:** fault. **Holds when:** two or more loud elements compete (prints, graphics, distressing, stacked jewelry, bright color). **Doesn't:** one statement on a plain base is the creators' recipe (pattern.5, color.2); Frugal doesn't fault any one part of the e-boy look alone.
- **Interacts with:** color.4 (a multicolor print adds colors to the count), color.5, cohesion (`world.*`, "leave space").
- **Sources:** Tim · `zJ5LCenTcf8` · [00:37] · "think bold colors striking patterns and make sure you Clash them"; Tim · `wIib9hzVUuw` · [06:07] · "a bit too distracting" (a multicolor chunky scarf on a busy outfit); Wanhee · `ew3gCk1zkso` · [02:06] · "then you just look like some Patchwork"; Wanhee · `B9PIhkSQKuw` · [05:57] · "let me add red and green and flower and leather"; Wanhee · `e2MgmGDLV9Q` · [02:36] · "if you have too many then it loses its power"; Frugal · `TUYSTimnDJg` · [05:57] · "this doesn't make any sense"
- **The four:** Tim, Wanhee, Frugal agree; Jaye's "one or two details" restraint agrees in spirit (cohesion notes).
- **Engine today:** has it [STY-6] (too many statements), [COL-4] (three patterns, or one pattern twice at one size, −1.5), [COL-8] (a loud print −1.5).
- **AI can see it:** yes (`pattern`, `pattern_scale`, `logo`, `saturation`, `condition` for distressing); jewelry never counts.
- **Frame:** `inputs/youtube/shots/zJ5LCenTcf8/f-00-42.jpg`; `inputs/youtube/shots/wIib9hzVUuw/f-06-12.jpg`; `inputs/youtube/shots/TUYSTimnDJg/f-05-30.jpg`; `ew3gCk1zkso` [02:06] and `B9PIhkSQKuw` [05:57]: none (described only)

#### pattern.2. A graphic tee adds needed fun to a casual outfit and has a higher ceiling than a blank, but it belongs at the casual end (wide shorts, baggy jeans).
- **Strength:** lift (casual) · fault (with smart pieces). **Holds when:** the rest is casual; Frugal adds that obscure, personal graphics beat generic ones and that a plain blank earns almost nothing by itself ("one point to the shirt"). **Doesn't:** with smart trousers or tailoring; anime tees read only as "an anime tee" (Frugal: nothing wrong, no extra angle).
- **Interacts with:** contrast.2 (a graphic is the one piece Tim keeps out of smart casual), pattern.1, fit.
- **Sources:** Tim · `o5RnTT2oafg` · [02:15] · "a much needed Touch of fun and playfulness to a casual outfit"; Tim · `o5RnTT2oafg` · [03:19] · "you have to stick to the more casual end of the spectrum"; Tim · `_6-4CHHXg3c` · [03:18] · "it can bring something cool and fun to a look"; Tim · `vQd36IKIkOg` · [04:28] · "even graphic TE's can be pulled off in a tasteful way"; Tim · `30L-EHe4WAQ` · [05:26] · "creative quirky designs when done sparingly"; Frugal · `env4ZvWzcd4` · [08:28] · "the ceiling for that is so much higher"; Frugal · `env4ZvWzcd4` · [01:37] · "the shirt being a plain color is pretty nice, I guess"; Frugal · `env4ZvWzcd4` · [03:47] · "all of the above, except anime t-shirts"
- **The four:** Tim and Frugal agree; Wanhee warns only against the huge graphic in a pile (pattern.1); Jaye's "one statement makes a basic fit not basic" agrees.
- **Engine today:** has it differently [STY-5], [STY-10], [COL-8], [MIN-3]: a graphic tee with two dressy pieces −3.0, an oversized one under tailoring −1.5, a bright medium or large print −1.5; a graphic never earns a lift (no "one standout" since v8, [STY-7]).
- **AI can see it:** weakly (`subcategory` graphic tee, `pattern_scale`, `logo`; what the graphic means or depicts is not read).
- **Frame:** `inputs/youtube/shots/o5RnTT2oafg/f-02-20.jpg`; `inputs/youtube/shots/o5RnTT2oafg/f-03-24.jpg`; `inputs/youtube/shots/env4ZvWzcd4/f-08-33.jpg`; `inputs/youtube/shots/_6-4CHHXg3c/f-03-23.jpg`

#### pattern.3. Stacked or showy logos look bad; obvious branding is the opposite of a quiet look.
- **Strength:** fault. **Holds when:** logo top plus logo bottoms plus logo hat; a designer logo worn to show off "even if it actually looks good". **Doesn't:** a streetwear hoodie's big logo is that world's own piece (the engine already spares it); Jaye's guests praise a bold green designer bag (accessory, `cwLasFLe-DY` [14:32]).
- **Interacts with:** cohesion (quiet luxury, minimal), occasion (an interview).
- **Sources:** Tim · `zJ5LCenTcf8` · [02:13] · "the more logos the better" (mocking it); Tim · `jaOSdGqtgYY` · [00:34] · "it's the opposite of obvious logos and branding"; Wanhee · `ew3gCk1zkso` · [17:11] · "look at my designer logo"; Wanhee · `dKl6pohkzoA` · [02:34] · "focus on shape and texture more than color and Logo"
- **The four:** Tim and Wanhee agree; Jaye differs on a showpiece accessory; Frugal silent.
- **Engine today:** has it differently [COL-8], [MIN-3], [WRK-2], [OCC-5]: a large logo on a tee is a loud print; minimal and workwear rule big logos out; no charge for logos on several pieces at once.
- **AI can see it:** yes (`logo` per garment, with size).
- **Frame:** `inputs/youtube/shots/zJ5LCenTcf8/f-02-18.jpg`; `inputs/youtube/shots/jaOSdGqtgYY/f-00-39.jpg`; `ew3gCk1zkso` [17:11]: none (described only)

#### pattern.4. A big design or bright print is toned down by darker colors around or over it (a design shirt under a black blazer).
- **Strength:** lift. **Holds when:** the dark layer covers part of the design; Wanhee calls it toning down and wit at once. **Doesn't:** "if it's just screaming" it looks try-hard.
- **Interacts with:** color.3 (same mechanism), contrast.1.
- **Sources:** Wanhee · `tNVdA_arEa8` · [01:02] · "if you have Reds pinks or big designs"; Wanhee · `tNVdA_arEa8` · [02:36] · "toning down a flamboyant design by wearing darker colors on top"
- **The four:** only Wanhee (Tim's lighter-inside, darker-outside layering, color.10, agrees in mechanism).
- **Engine today:** has it differently [COL-8], [STY-10]: a loud print on a top is charged whether or not a dark layer covers it, and an oversized graphic tee under tailoring costs −1.5 more.
- **AI can see it:** yes (`pattern`, `pattern_scale`, the outer layer's `color_family`); how much of the print shows, weakly.
- **Frame:** `inputs/youtube/shots/tNVdA_arEa8/f-01-07.jpg`; `tNVdA_arEa8` [02:36]: none in the window (nearest `inputs/youtube/shots/tNVdA_arEa8/f-02-11.jpg`, before the stamp)

#### pattern.5. One patterned or imperfect piece (a red check flannel, a quilted bandana scarf) works on an otherwise clean, minimal base.
- **Strength:** nuance. **Holds when:** the rest is plain; prints done "in a fresh, unique way". **Doesn't:** as soon as a second loud piece joins (pattern.1); Tim keeps it to his 10% of experimental pieces.
- **Interacts with:** color.2 (a pattern can be the point), pattern.1.
- **Sources:** Tim · `dk1efCZqwos` · [03:15] · "patterns in a fresh, unique way"; Tim · `dk1efCZqwos` · [11:34] · "red checkered flannel"
- **The four:** only Tim; Wanhee's "point" (any item) agrees in principle.
- **Engine today:** has it differently [STY-7], [COL-8], [COL-9]: one standout pattern earns nothing; a large check costs −1.5 unless the outfit reads as workwear, streetwear, vintage sport or outdoor and the piece isn't bright (a red check flannel on a minimal base would be charged).
- **AI can see it:** yes (`pattern`, `pattern_scale`, `saturation`).
- **Frame:** `inputs/youtube/shots/dk1efCZqwos/f-03-20.jpg`; `inputs/youtube/shots/dk1efCZqwos/f-11-38.jpg`

---

### Not scorable from a photo
- A personal palette or "muse" as the reason for the colors (Frugal `TQi2YaZ5yNY` [03:41]); only the result is visible.
- Whether a color is "seasoned" in a way he can't name (Frugal `UidnEGXwZRk` [10:10]).
- "Timeless" claims about neutrals or a green jacket (Tim `poTk87gGHtg`, Frugal `EWD0eRHHXgk`).
- What a graphic means, how obscure it is, or whether the liking is performative (Frugal `env4ZvWzcd4`).
- Mixing silver and gold, jewelry, bags, scarves, eyewear lens tints (accessories never count; the head area is blurred).
- Suit linings (GQ, outsider).
- Brand prestige of a logo (Gucci polos, Brunello cashmere).
- Trend calls that date: earth-tone fatigue (2023), argyle and "grandpa" dressing (Tim `30L-EHe4WAQ` [07:01]), retro earth-tone lenses.
- Color mood words ("trustworthy", "mysterious") beyond what occasion already checks.
- Color "theory" reasons (symmetry in the brain, Frugal `k6Gig6r7BSQ` [06:45]).
- Sock color (scorable if the sock read is added; not read today).


*(This part's notes for the dealbreakers sheet are in the "Creators say (T95)" column of `rubric/research/dealbreakers.md`.)*

---

## 3. Layering and texture, shoes, condition, occasion and season
Nov 14, 2026 (T95). Built from `by-part/rules-layering-texture.md`, `rules-shoes.md`, `rules-condition.md`, `rules-occasion-season.md`, `season.md` and `concepts.md` §14. Quotes were checked against `inputs/youtube/clean/<id>.txt`. Engine IDs come from `rubric/v5-styles.md` (parts engine v15). Outsiders appear only where the four are thin, and are marked. Of the six outsider transcripts added mid-task, I read four in full (Brandon Balfour 4IAFUIAi2vs, Harry Has h4-sPhUHwLY, James Leung w-mXLoLOU4w, Drew Joiner DWmnbUo8dlA) and skimmed Daniel Simmons ZbypE0XzIxM. The four already cover winter well, so Simmons adds nothing new.

**Summary.**
- **Texture is the one thing all four call underrated.** It carries an all-black or tonal outfit (layer.1), and the app can't see it at all.
- **They agree layers should show and should be few.** An open layer, or a small peek of a contrasting inner layer, adds depth. Two or three layers is the ceiling.
- **Shoes are judged against the pants, not on their own.** The shoe's weight should match the leg's volume, and chunky shoes stay in casual outfits.
- **Condition splits worn-in from worn-out.** Stains and neglect cost. Real fade and patina on denim and leather add character, but the reading counts them as wear today.
- **Season is the biggest gap in the engine.** In heat, the trousers' shape, the waist, the fabric and a light open shirt carry the outfit. The engine has no season input, so a no-layer summer fit has fewer ways above 7 than a layered fall one.
- **Main disagreement: overdress or underplay.** Jaye said "always overdress" in Feb 2025. By 2026 he says a suit everywhere loses its meaning, which brings him close to Wanhee (look like you didn't try), Tim (match the room, lean a little smarter at a smart-casual code) and Frugal (head-to-toe designer at 2:30 p.m. is too much). The newer, majority view wins.

---

### Layering and texture (layer.*)

#### layer.1. In a one-color outfit (all black, tonal), varying the fabrics is what gives it depth.
- **Strength:** lift. **Holds when:** the surfaces clearly differ: leather against denim, shiny nylon against cotton, wool against cashmere. It needs some light to show. **Doesn't:** one fabric head to toe in one color, which reads flat ("boring", Tim) and at best "okay".
- **Interacts with:** color (texture stands in for color and light-dark contrast, and it's what separates a deep tonal outfit from a flat one, [COL-7]); shoes (a leather boot against a fabric pant, shoe.12); layering (each layer adds one more surface).
- **Sources:** Frugal · `Vn6KlXkU2xA` · [05:56] · "just the way light hits a piece you're wearing"; Frugal · `Vn6KlXkU2xA` · [07:35] · "creates that gap between casuals and true hobbyists"; Tim · `XSF9AOx7sdU` · [05:17] · "mix in some texture using different Fabrics like wool leather or canvas"; Tim · `XIYvycsZxDk` · [00:33] · "this outfit is all about texture"; Tim · `SNjfZ5NKndc` · [03:32] · "the right texture will add depth to your outfit"; Wanhee · `dKl6pohkzoA` · [02:34] · "focus on shape and texture more than color and Logo"; Jaye · `CI-wkEOHRAg` · [03:36] · "the fabric and the texture of your clothes. It matters drastically"
- **The four:** all agree.
- **Engine today:** lacks it. An all-black minimal outfit earns nothing for its texture ([MIN-8], KD-6); one color family is only a tip ([COL-7]).
- **AI can see it:** no (fabric and texture aren't read, and neither is light vs dark).
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-06-01.jpg` (checked: a black leather jacket, black denim, black boots and a nylon jacket side by side)

#### layer.2. Let the layers show: an open layer over the base adds depth; a layer closed over everything flattens it.
- **Strength:** lift. **Holds when:** an open jacket, overshirt or chore coat over a tee, or a shirt open over a tank, so the base shows at the front. **Doesn't:** when the layer shown doesn't go with the base ("integrity", Drew Joiner, outsider), or past three layers (layer.7).
- **Interacts with:** color (the open front shows the base's color, so the inner piece can carry the accent or the light shade); proportion (an open layer draws a vertical line, and its length decides the shape credit); season (season.4, season.8).
- **Sources:** Tim · `zJ5LCenTcf8` · [01:40] · "simply add a layer that will entirely cover your base layer" (mocking the advice); Frugal · `Jh8dz-KZcfY` · [00:00] · "the dimension the contrast the composition it's all in the layering"; Frugal · `Jh8dz-KZcfY` · [01:36] · "magic that comes with layering a bunch of rather simple pieces"; Jaye · `RIuzSb8OLMM` · [09:41] · "This is really where structure and contrast come in."; Drew Joiner (outsider) · `DWmnbUo8dlA` · [01:51] · "what is seen can be appreciated"
- **The four:** Tim, Frugal and Jaye agree; Wanhee is silent on layering (to him, one texture can be a plain outfit's "point").
- **Engine today:** has it differently. Only certain layer shapes earn anything: a short jacket +1.5 ([PRO-6]), a belt-length layer over a loose leg +1.0 ([PRO-14]), a hoodie over a tee +1.5 ([PRO-17]). An open overshirt, chore coat or cardigan over a tee with straight legs earns nothing (dealbreakers L3 proposes it).
- **AI can see it:** weakly (garments are counted and the top under the layer is named; open vs closed isn't read).
- **Frame:** pending (`zJ5LCenTcf8` [01:40] is likely on screen; the nearest still, f-02-18, is 38 s later)

#### layer.3. A small peek of a contrasting inner layer adds contrast: a white tank or tee showing at the neck or hem, a hood out of a jacket, a graphic framed by an open jacket.
- **Strength:** lift. **Holds when:** only a little shows: a white tank under a black shirt, a V-neck sweater that isn't too low over a white tee, a tank under an oversized hoodie, a white tee under a wider-neck tee (outsider), a hood out of a jacket. **Doesn't:** a long shirt hanging well below the outer piece ([PRO-9]); a deep-V tee (Tim's taste: "never been a fan").
- **Interacts with:** color (light against dark at the neck); pattern (an open jacket turns a graphic into a framed detail); proportion (below the hem, only a thin band works).
- **Sources:** Harry (Tim's guest, Tim agrees) · `OqoUgLxknJc` · [17:44] · "that vest poking out a little bit just adds some nice contrast"; Tim · `30L-EHe4WAQ` · [01:38] · "a good V-neck sweater that's not too low"; Frugal · `2gSj7T37RkQ` · [09:09] · "it'll just be good contrast with an oversized hoodie"; Frugal · `Jh8dz-KZcfY` · [05:56] · "a little cute little Hood peeking through the jacket"; Frugal · `Jh8dz-KZcfY` · [05:56] · "strategically picking a graphic to sneak through the opening of your jacket"; Harry Has (outsider) · `h4-sPhUHwLY` · [06:34] · "That bit of white sticking out"
- **The four:** Tim and Frugal agree; Wanhee and Jaye are silent.
- **Engine today:** has it differently [PRO-9]. Since v14 a top showing "a little" below the outer piece costs nothing (and keeps its credits), and "clearly" costs −0.5. The peek earns nothing, and nothing looks at the neckline.
- **AI can see it:** weakly (look U's "a little" is its least reliable answer, 71–82%; nothing reads a top showing at the neck, or a hood).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-17-49.jpg` (checked: a white tank showing under an open black shirt, grey jacket over it)

#### layer.4. Layer from thin to thick: the thinnest piece goes closest to the body, and each layer is heavier going out.
- **Strength:** fault (mild; Tim says it "doesn't work 100% of the time"). **Holds when:** tee, then a chunkier sweater, then a heavier coat. A thin outer layer over a sweater feels "off". **Doesn't:** a light shirt-jacket over a chunky knit is a known style; a sweater worn as a scarf is a deliberate thick-over-thin (outsider).
- **Interacts with:** visual weight (the outer layer should carry the most); volume (a base that's too baggy or thick bunches up under the rest).
- **Sources:** Tim · `IUMqpLeCT-E` · [03:15] · "the layer closest to your body should be the thinnest"; Tim · `IUMqpLeCT-E` · [03:47] · "this rule doesn't work 100% of the time"; Jaye · `RIuzSb8OLMM` · [09:41] · "If your base is too baggy, too thick, or maybe too thin"; Drew Joiner (outsider) · `DWmnbUo8dlA` · [07:24] · "You wouldn't put a t shirt on over a puffer jacket."
- **The four:** Tim and Jaye agree; Frugal and Wanhee are silent.
- **Engine today:** lacks it.
- **AI can see it:** no (fabric weight isn't read; volume per layer only roughly).
- **Frame:** `inputs/youtube/shots/IUMqpLeCT-E/f-03-20.jpg` (unverified)

#### layer.5. Contrast the textures between layers: knit over knit blurs.
- **Strength:** fault (small). **Holds when:** a knitted cardigan over a knitted sweater, or two pieces of the same surface stacked. **Doesn't:** when the weights clearly differ; a smooth layer over the knit is the fix.
- **Interacts with:** layer.1 (each layer should add a new surface); pattern (a patterned or textured layer reads best with another layer between it and the next one, outsider).
- **Sources:** Tim · `wIib9hzVUuw` · [05:06] · "it would have been better to contrast the textures"; Drew Joiner (outsider) · `DWmnbUo8dlA` · [03:00] · "you need to use different textures for different layers"
- **The four:** only Tim (the others are silent on knit over knit; Frugal's and Jaye's texture mixing points the same way).
- **Engine today:** has it [STY-11] (a tip only, no points).
- **AI can see it:** weakly (the knits are named by subcategory: cardigan, sweater, quarter-zip, knit polo; their surface isn't).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-05-11.jpg` (checked: this still shows the previous before/after outfit, a denim jacket, not the knit-over-knit look; `o2-before-05-30.png` in the same folder is the likely match, unverified)

#### layer.6. Fabrics must belong to the same mood: a rich knit with shiny sporty nylon looks off even when the colors match, and too many materials cost.
- **Strength:** fault. **Holds when:** a merino knit with nylon shorts (dressy against sporty), or many different materials at once. **Doesn't:** a mix of surfaces in one mood (wool, leather, canvas; workwear fabrics) is a lift (layer.1). Linen with linen, cotton with cotton, cotton with wool all work.
- **Interacts with:** color (a fabric clash outweighs a color match); cohesion (fabric mood is part of the style world: nylon sporty, wool rich, linen summery, season.5).
- **Sources:** Wanhee · `ew3gCk1zkso` · [06:27] · "these Fabrics don't really match"; Wanhee · `Uw-vpUq8Ewg` · [05:31] · "materials cut it all down apply minimalism"; Tim's guest (Tim agrees) · `UNkA9HhbjXY` · [14:11] · "different material fabrics and styles"
- **The four:** Wanhee for; Tim (through his guest), Frugal and Jaye treat mixing materials as a lift. Read together, the fault is a clash of mood or too many materials, not contrast of surface.
- **Engine today:** lacks it.
- **AI can see it:** no (fabric isn't read).
- **Frame:** none (described only)

#### layer.7. Two to three visible layers is enough; stacking without purpose, heavy accessorizing and props read try-hard.
- **Strength:** nuance (Frugal says these fits aren't ugly; for scoring, a high score shouldn't depend on them, and a fourth layer earns nothing). **Holds when:** more than three visible layers, or pieces stacked until they look bulky. **Doesn't:** cold weather adds a coat, still within three.
- **Interacts with:** cohesion (one focal point); season.2 (try-hard vs overdressed); layer.15.
- **Sources:** Jaye · `RIuzSb8OLMM` · [10:11] · "But two to three layers is enough."; Jaye · `Jz9QVWgBbOg` · [21:49] · "they stack pieces without purpose"; Frugal · `LkN3yI1-TB4` · [07:06] · "over layering hyper accessorizing just random eclectic props cost maxing"; Tim · `vQd36IKIkOg` · [09:26] · "we far too often make the mistake of cosplaying"; Wanhee · `uBsIrt-zU0I` · [13:22] · "the whole outfit will fall apart"
- **The four:** all agree (Jaye's 2025 "always overdress" aside, season.2).
- **Engine today:** lacks it (no cap on layers; [STY-6] counts loud statements, not layers).
- **AI can see it:** yes (garment count and category); no for "purpose".
- **Frame:** `inputs/youtube/shots/RIuzSb8OLMM/f-10-16.jpg` (unverified)

#### layer.8. Sometimes the fix for a flat outfit is one more piece, not a different one.
- **Strength:** nuance (Frugal treats the unfinished outfit as a fault). **Holds when:** a plain two-piece outfit in cool weather feels unfinished, or all black with nothing over it. **Doesn't:** in heat (season.8), or when the outfit already reads complete (Wanhee's underplay).
- **Interacts with:** layer.2 (the added piece should show the base); season.
- **Sources:** Frugal · `Jh8dz-KZcfY` · [03:15] · "maybe your layering sucks cuz you don't have enough layers"; Jaye · `7K2qRZaXX3w` · [05:50] · "you got a all black fit on throw some jewelry on that"
- **The four:** Frugal and Jaye agree; Wanhee differs (wear the lavish piece "like slippers", underplay it: `RtxJqd5Drps` [11:22]); Tim is silent (his two-piece outfits get one black outer layer in the cold, `0JtnbgtbQfE`).
- **Engine today:** has it differently (a layer earns only through the shape credits; there's no fault for a missing layer, which is right in heat).
- **AI can see it:** yes for the count; "unfinished" is a judgment no field gives.
- **Frame:** none (described only)

#### layer.9. The outer layer sets the formality: a structured coat lifts the whole outfit; a black overcoat and a leather jacket cover most cold-weather outfits.
- **Strength:** lift. **Holds when:** a structured tailored coat (overcoat, car coat, trench) over the outfit; a leather jacket ("timeless"); quality outerwear in any cut. **Doesn't:** a coat that's "too much of a statement" works with few outfits. A puffer goes best over a simple one-color base (Tim 2023; he no longer wears puffers by 2026, `0ilmLux6mPg`, which is taste, not a rule).
- **Interacts with:** formality (the coat can sit above the outfit: Tim's overcoat over sweatpants, "sweatpants dressed up", `-e9Is50-fn0`, tim.md R49); silhouette (the outer layer sets the outline); occasion (a trench over an interview suit).
- **Sources:** Tim · `XIYvycsZxDk` · [02:17] · "the more structured tailored coat elevates the whole outfit"; Tim · `0JtnbgtbQfE` · [03:17] · "a black overcoat as a smarter piece"; Tim · `CJv4TGLrdig` · [01:11] · "if your coat is too much of a statement"; Frugal · `RlcdMBj5Z2E` · [06:58] · "a leather jacket you know nothing you can't go wrong Timeless"; Frugal · `FPHnmY5FTaI` · [04:18] · "all of this works so well together dressed up and down"; Jaye · `RIuzSb8OLMM` · [10:11] · "Now the outer layer defines silhouette and the tone of the fit"; Jaye · `7K2qRZaXX3w` · [03:09] · "always do a little above what the expectation is"
- **The four:** Tim, Frugal and Jaye agree; Wanhee is silent.
- **Engine today:** has it differently. An overcoat is a business-casual piece (level 4) that stands for the top half in [STY-4], and a jacket is the one place a high-low mix is excused. A leather jacket earns +1.5 over full legs ([PRO-6]). An overcoat earns no shape credit and no Style credit of its own.
- **AI can see it:** yes (overcoat, leather jacket and blazer subcategories); no for structure.
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-02-22.jpg` (unverified)

#### layer.10. A tank or tee under an open shirt or light jacket works only if the outer piece is casual.
- **Strength:** nuance. **Holds when:** an oversized casual shirt, or a casual jacket that isn't bulky (denim, leather), over a slim tank; a short-sleeve shirt over a tank with pleated trousers. **Doesn't:** a formal dress shirt open over a tank; a bulky jacket over a tank.
- **Interacts with:** formality (the outer piece sets the level); volume (an oversized shirt helps the relaxed read); season.4.
- **Sources:** Tim · `2KblatXQTGs` · [00:34] · "just make sure the shirt is not too formal"; Tim · `2KblatXQTGs` · [01:05] · "on the more casual side and ideally not too bulky"; Tim · `vziGl_FxQb0` · [04:49] · "a base layer underneath a casual shirt, blazer, or lightweight jacket"; Jaye · `5Dfr0PXTTpM` · [06:40] · "a calm button up beach style"
- **The four:** Tim and Jaye agree; the others are silent.
- **Engine today:** has it [STY-4] (since v11 a tank or tee under an open shirt or jacket is judged by the layer) and [STY-9] (a tank on its own −2.0). It has the dress-shirt case differently: an open dress shirt over a tank isn't charged.
- **AI can see it:** weakly (the tank and the dress shirt vs oxford or camp shirt are named; open vs buttoned and bulk aren't).
- **Frame:** none (described only)

#### layer.11. Drape: soft fabric that falls well flatters every cut; the right weight holds its shape and still drapes.
- **Strength:** lift (Frugal: "make or break"). **Holds when:** a heavyweight tee that still drapes; a drapey dropped shoulder; a vintage tee softened by age; a jacket with "just the right amount of structure". **Doesn't:** stiff, boxy fabric (cond.4). Drape is hard to judge before buying, and in a still photo.
- **Interacts with:** silhouette (drape decides how an oversized or dropped-shoulder top falls); condition (age adds drape, cond.3); season.3 (linen looks flat without some structure, outsider).
- **Sources:** Frugal · `FlQ3WZ-H2Ik` · [11:12] · "softer drapier Fabrics are always the ones that come across more flattering"; Frugal · `ove4zof6W2k` · [08:41] · "for me it is a make or break"; Frugal · `ove4zof6W2k` · [13:38] · "where the drop shoulder is placed but rather it is the fabric"; Tim · `a7FgCE9NPmw` · [02:15] · "enough to maintain good structure when worn"; Tim · `vziGl_FxQb0` · [02:13] · "just the right amount of structure"
- **The four:** Frugal and Tim agree; Wanhee agrees (a drapey dropped-shoulder top reads cozy, wanhee-jaye R24); Jaye is silent.
- **Engine today:** lacks it.
- **AI can see it:** no (weight and drape aren't read; only roominess).
- **Frame:** `inputs/youtube/shots/FlQ3WZ-H2Ik/f-11-17.jpg` (unverified)

#### layer.12. Chunky, heavyweight knitwear adds texture in the cold; quality knit details (ribbing, a dense stitch) show up close.
- **Strength:** lift (fall and winter). **Holds when:** a chunky or cable knit, 2x2 ribbing, a dense stitch, real weight. **Doesn't:** thin knitwear "defeats the point"; the fine details don't show at a distance.
- **Interacts with:** layer.4 (the knit sits between the base and the coat); season.6; photo distance (ribbing only shows in a close photo).
- **Sources:** Tim · `-e9Is50-fn0` · [08:16] · "chunky knitwear adds that lovely texture and"; Tim · `CJv4TGLrdig` · [02:25] · "Something with proper weight."; Tim · `jaOSdGqtgYY` · [09:44] · "it's subtle yet distinctive and intentional in the design"; Tim · `TxQUqvHXyJA` · [05:57] · "the double layered collar or the 2x two ribbing on the cuffs"
- **The four:** only Tim (Frugal wears a fisherman sweater on camera without a rule; the others are silent).
- **Engine today:** lacks it.
- **AI can see it:** no (a sweater is named; chunky vs fine isn't).
- **Frame:** pending (`-e9Is50-fn0` [08:16] is likely on screen; the nearest still, f-08-51, is 35 s later)

#### layer.13. Texture rescues a plain or slim piece.
- **Strength:** lift. **Holds when:** a ribbed slim tee reads elevated; a textured green sweater as the inner layer stays "subtle but texturally very interesting"; plain long sleeves become favorites through fabric. In summer: seersucker, a textured or embroidered linen shirt, a crochet or bouclé knit polo (outsider, season.3). **Doesn't:** a plain slim cotton tee isn't what Tim is praising.
- **Interacts with:** fit (texture offsets a slimmer cut; Tim's ribbed slim tee isn't skin-tight); color (a textured inner piece in a quiet color).
- **Sources:** Tim · `vziGl_FxQb0` · [01:40] · "The rib texture makes it feel more elevated"; Frugal · `Jh8dz-KZcfY` · [03:47] · "patterns and textures could add so much Dimension to your fit"; Frugal · `UidnEGXwZRk` · [11:14] · "minor tweaks to things such as color fit Fabric"
- **The four:** Tim and Frugal agree; Wanhee agrees in spirit (`dKl6pohkzoA` [02:34], layer.1); Jaye is silent.
- **Engine today:** lacks it.
- **AI can see it:** no (texture isn't read).
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-03-52.jpg` (unverified)

#### layer.14. Same fabric, same tone: a jacket and trousers in one fabric read as one deliberate look.
- **Strength:** lift. **Holds when:** a jacket and trousers in the same linen blend; a half-zip in a full tonal outfit (quiet luxury). **Doesn't:** a matched sweatsuit (loungewear's own rule, [LNG-9]).
- **Interacts with:** color (tonal); season (linen is summer, season.5).
- **Sources:** Tim · `2KblatXQTGs` · [01:37] · "made from the same breathable linen blend as the pants"; Tim · `YGm7JMniGVc` · [04:18] · "go for that quiet luxury aesthetic and a full tonal look"
- **The four:** only Tim (Wanhee's "linen with linen" agreement, `ew3gCk1zkso` [06:27], points the same way).
- **Engine today:** has it differently. A layer in the pants' color earns +0.5, but never in white, black, grey or navy ([COL-13]). A matched jacket and trousers that isn't a suit has no rule (a suit reads as one look, [STY-1]).
- **AI can see it:** weakly (color family yes; fabric and shade no).
- **Frame:** pending (`2KblatXQTGs` likely on screen; no stills folder)

#### layer.15. Accessories (a bag, jewelry, a big scarf, gloves) finish a fit and rarely lead it; a single bright bag on all black can be the one point (Frugal `Jh8dz-KZcfY` [03:47]).
- **Strength:** nuance (never scored). **Holds when:** one or two details supporting the focal point: a tasteful bag, jewelry on all black, a big plain scarf. **Doesn't:** heavy accessorizing (layer.7); a chunky scarf on an already big top is top-heavy (Tim, `wIib9hzVUuw` [05:36]); showing a piece off reads insecure (Wanhee).
- **Interacts with:** cohesion (focal point); layer.8 (an accessory can be the missing piece).
- **Sources:** Frugal · `Jh8dz-KZcfY` · [02:43] · "genuinely I feel like a bag does so much to an outfit"; Frugal · `Jh8dz-KZcfY` · [07:01] · "is never the focal point but a lot of those add up"; Tim · `-e9Is50-fn0` · [02:11] · "The bigger the better."; Tim · `wIib9hzVUuw` · [05:36] · "it's quite a topheavy outfit with the chunky oversized scarf"; Frugal · `4hwelpjhDTM` · [04:50] · "a nice set of stones can complement the hardware perfectly"; Wanhee · `RtxJqd5Drps` · [11:22] · "you want to wear it like slippers"
- **The four:** Frugal, Tim and Jaye agree; Wanhee differs on showing them off.
- **Engine today:** lacks it by design ([SCO-6], KD-14: accessories never count).
- **AI can see it:** no (accessories aren't read).
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-02-48.jpg` (unverified)

---

### Shoes against the outfit (shoe.*)

#### shoe.1. The shoe is judged together with the pants, as an equal partner, not as the centerpiece.
- **Strength:** nuance (how to judge, not a points rule). **Holds when:** always. Frugal now says the pants' shape should follow the shoes you wear most; Tim matches loafers to trousers so they "meet the shoe seamlessly". **Doesn't:** the 2016 way, where one hyped shoe carries any outfit.
- **Interacts with:** proportion (leg width and hem decide how much shoe shows); shoe.2, shoe.3.
- **Sources:** Frugal · `8rmkOpCbFTM` · [01:09] · "The shoe pants relationship is a lot more equal"; Frugal · `WDsQRHa8jBY` · [08:39] · "the secret to pants shape is your shoes"; Frugal · `FFDYIGhiIk8` · [07:25] · "as opposed to just styling around the shoe"; Tim · `wIib9hzVUuw` · [08:07] · "having the trousers meet the shoe seamlessly"; Frugal (older, 2023) · `K45OlNNhY8g` · [00:00] · "shoe selection is the most important part of any outfit"
- **The four:** Frugal (2026) and Tim agree; Wanhee agrees (don't build the outfit around the cool shoe, wanhee-jaye R60); per the notes Jaye agrees ("pants should connect your top half to your shoes"; not checked here). Frugal's 2023 "most important part" gives way to his 2026 "equal partners".
- **Engine today:** has it differently. Shoes is its own part (15%); the links to the leg are [SHO-9] (weight), [SHO-2] (pants dragging on slides) and [STR-6]. The hem meeting the shoe is a weak reading ([FIT-4], KD-8).
- **AI can see it:** weakly (shoe subcategory and leg shape yes; hem weak; look L on pants resting on the shoe).
- **Frame:** none (described only)

#### shoe.2. A narrow leg can't carry a bulky shoe.
- **Strength:** fault. **Holds when:** skinny or slim jeans over chunky, basketball or other bulky sneakers. **Doesn't:** the reverse, a slim shoe under generous pants, is fine (shoe.3).
- **Interacts with:** proportion (too little leg over too much shoe makes the outfit bottom-heavy at the foot); [PRO-13] (the narrow leg already costs on its own).
- **Sources:** Frugal · `8rmkOpCbFTM` · [09:22] · "You don't know how to handle all that."; Tim · `_6-4CHHXg3c` · [02:45] · "a perfect Middle Ground between a slim profile sneaker"
- **The four:** Frugal and Tim agree; Jaye agrees (skinny jeans with chunky runners is his dated formula, `sOfjDjtjBWM` [08:48], per notes); Wanhee is silent.
- **Engine today:** has it [SHO-9] (−1.5; running shoes −0.5). Dealbreakers H10 proposes a 6.5 cap.
- **AI can see it:** yes (chunky and basketball subcategories; leg shape slim or skinny), though slim vs straight is weak ([PRO-13]'s "straight at roominess 2 or less counts as slim" helps).
- **Frame:** none (described only)

#### shoe.3. A bulky shoe earns its place under volume; boots go under flares and baggy legs; a soft suede moc under looser denim.
- **Strength:** lift. **Holds when:** chunky sneakers or runners under wide shorts, cargos, sweats or baggy jeans, often with a soft stack of pant or sock over them; boots under flares; Wallabee-type mocs with slightly looser denim. **Doesn't:** a huge designer sneaker under huge jeans doesn't fix anything (Frugal, `b1S3XoaRa3k` [02:10]); the loud shape is the fault there, not big with big. Pants piling on a straight leg (H7).
- **Interacts with:** proportion (a gathered hem or more volume above the shoe); condition (socks as a deliberate finishing piece, not read).
- **Sources:** Frugal · `8rmkOpCbFTM` · [08:49] · "all of these are great with a good sock stack combo"; Frugal · `8rmkOpCbFTM` · [04:58] · "a nice generous pair of pants stacking over top"; Tim · `XIYvycsZxDk` · [01:07] · "nicely stacking on top of these Salamon sneakers"; Frugal · `xL1NeaA9D-Y` · [05:27] · "a good flare works especially well with boots"; Tim · `_6-4CHHXg3c` · [09:14] · "they Shine the most when paired with slightly looser fitting Denim"
- **The four:** Frugal and Tim agree; Jaye agrees (flares long over heavy boots is his own look, per notes); Wanhee is silent.
- **Engine today:** has it in part. Chunky sneakers under relaxed or wide jeans earn +0.5 in a streetwear outfit when the hem isn't piling ([STR-6]), and a stack on a loose leg costs nothing ([FIT-4], [STR-12]). Boots under flares, and mocs under looser denim, earn nothing. A slim shoe under wide legs is neutral ([SHO-12]).
- **AI can see it:** yes (shoe subcategory; leg shape including flare_bootcut); the hem is weak.
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-08-54.jpg` (unverified)

#### shoe.4. Chunky sneakers and runners belong to casual outfits only.
- **Strength:** fault (in a smart outfit). **Holds when:** a chunky runner, retro runner or basketball sneaker with a blazer, a suit, or dress trousers. **Doesn't:** clean slim leather sneakers under smart trousers are fine (shoe.7); retro runners with sweats are Tim's go-to casual.
- **Interacts with:** formality (the shoe sets the outfit's level, season.15).
- **Sources:** Tim · `uGregWdLahU` · [05:58] · "I would definitely keep them for the more casual"; Tim · `_6-4CHHXg3c` · [01:39] · "a go-to casual shoe with a pair of sweats"
- **The four:** Tim; Frugal agrees (basic sneakers have "a very low" ceiling, shoe.8); Wanhee agrees (his white or black "whatever shoe" goes with everything except very formal outfits, `uBsIrt-zU0I` [08:00]); Jaye is silent.
- **Engine today:** has it: chunky under a blazer −2.0 ([SHO-8]), running shoes held to 5.0 ([SHO-3]), too-casual shoes ramp ([SHO-5]), sneakers under a blazer at an interview held to 7.0 ([OCC-4]). Dealbreakers H11 proposes a cap for suit or dress trousers.
- **AI can see it:** yes (shoe subcategory; tailoring named).
- **Frame:** pending (`uGregWdLahU` likely on screen; no stills folder)

#### shoe.5. The shoe has to belong to the outfit's world: an "ugly" technical or dad shoe on a plain neutral outfit drags it down; in an outfit built for it, it fits.
- **Strength:** nuance (a fault or a lift depending on the base). **Holds when:** hiking or approach shoes in an outdoorsy or techwear outfit; a canvas classic in a casual one; one streetwear-leaning sneaker on purpose to tilt a clean outfit. **Doesn't:** hiking shoes with a plain city outfit, or a 990 or Salomon thrown onto a "safe neutral plain" base.
- **Interacts with:** cohesion (theme); color (the plain neutral base is what makes the ugly shoe fail); shoe.9.
- **Sources:** Frugal · `8rmkOpCbFTM` · [01:09] · "theme and silhouette are the two biggest factors" ([music] tag dropped); Frugal · `N8RAKkiqe1w` · [11:15] · "they're going to make your other pieces look ugly"; Tim · `30L-EHe4WAQ` · [02:08] · "people who have never hiked in their life wearing hiking shoes"; Tim · `uGregWdLahU` · [01:05] · "its design fits better with more casual outfits"; Tim · `uGregWdLahU` · [04:50] · "want to give a touch of street wear to an outfit"; Tim · `OqoUgLxknJc` · [14:26] · "for my personal style I probably would have gone through the converse"
- **The four:** Frugal and Tim agree; Wanhee agrees (think of the whole mood first, wanhee-jaye R60); Jaye is silent here.
- **Engine today:** has it differently. The look's own shoe earns +0.5 ([SHO-7]), and shoes count for or against a look ([MIN-2], [WRK-2]). An ugly shoe on a plain base has no charge, and trail shoes aren't in the reading ([OUT-4], KD-7).
- **AI can see it:** weakly (chunky, retro, running, canvas, low-profile, basketball and boots are named; trail, hiking and "dad" shoes aren't).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-14-31.jpg` (unverified)

#### shoe.6. Black boots, loafers and derbies dress an outfit up a step and still go with casual clothes.
- **Strength:** lift. **Holds when:** jeans, a tee or even sweats with loafers or black Chelsea boots; smart trousers with loafers; a black derby as a lasting classic. **Doesn't:** engineer boots look "a little overkill" for everyday; on an already perfect, curated outfit Wanhee would pick the plain shoe (shoe.9).
- **Interacts with:** formality (the shoe bridges smart and casual); shoe.10 (color repeat).
- **Sources:** Tim · `OqoUgLxknJc` · [05:27] · "whenever I want to look more elegant a bit more Chic"; Tim · `-e9Is50-fn0` · [04:26] · "that sweet middle ground between a dress shoe and a casual shoe"; Tim · `30L-EHe4WAQ` · [08:08] · "Black derbies have and will continue to be a classic"; Tim · `30L-EHe4WAQ` · [04:21] · "They look a little overkill for everyday wear"; Frugal · `UidnEGXwZRk` · [04:48] · "nowadays we're seeing the rise of like loafers"
- **The four:** Tim and Frugal agree; Wanhee differs (a fancy shoe on a perfect outfit, `uBsIrt-zU0I` [08:31]); Jaye is silent.
- **Engine today:** has it differently. Loafers and Chelsea boots are level 3.5, derbies 4. [SHO-4] rewards the match window, not the dressier shoe, and [SHO-6] doesn't charge loafers or derbies with jeans and a tee. A dressier shoe isn't rewarded for itself (the founder: points come from how pieces come together).
- **AI can see it:** yes (loafer, Chelsea boot and derby subcategories; color family).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-05-32.jpg` (unverified)

#### shoe.7. Clean white sneakers are the most versatile default: a high floor and a low ceiling; minimal white leather is the sleek end.
- **Strength:** nuance. **Holds when:** almost any casual or smart-casual outfit; they "dress down a smart outfit"; a white sneaker anchors a heavy grey outfit. **Doesn't:** in an all-black outfit Tim finds them only "okay" and prefers a black sneaker with light details (shoe.11); Frugal says they never play to a sneaker's strengths.
- **Interacts with:** color (a light end point under a heavy tonal top); cohesion (the clean minimal look).
- **Sources:** Tim · `OqoUgLxknJc` · [05:58] · "white sneakers of course the most versatile shoe"; Tim · `uGregWdLahU` · [00:00] · "dress down a smart outfit compliment a casual one"; Tim · `uGregWdLahU` · [03:13] · "the Pinnacle of minimal white sneakers"; Tim · `XIYvycsZxDk` · [00:33] · "the white sneakers help anchor down this Hefty cluster of gray"; Frugal · `8rmkOpCbFTM` · [01:42] · "there's nothing wrong with them"; Wanhee · `uBsIrt-zU0I` · [08:00] · "It just works better if they're all white or all black."
- **The four:** all agree.
- **Engine today:** has it. White leather sneakers are level 3: a signature shoe in smart casual ([SMC-1]), minimal's own shoe ([MIN-5]), a home shoe in prep. [STR-5] keeps the streetwear shape from them (the founder's "clean but plain").
- **AI can see it:** yes (white leather sneaker subcategory, color family).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-06-03.jpg` (unverified)

#### shoe.8. A popular or "basic" shoe is no fault, but basics cap the outfit, and a premium or collab version reads the same.
- **Strength:** nuance (a ceiling, not a cost). **Holds when:** AF1s, Dunks, Jordans, 550s, Sambas: reliable, easy, well received. **Doesn't:** fatigue from seeing a shoe everywhere is a personal reason, not a flaw in the outfit.
- **Interacts with:** shoe.14 (dated is different from popular); cohesion.
- **Sources:** Frugal · `WP5sWeQRSNA` · [04:21] · "if you look good in the shoes you look good"; Frugal · `5gKnDwVm_Eg` · [08:13] · "because we see them so much and we're fatigued"; Frugal · `FFDYIGhiIk8` · [06:23] · "the door is very big but the ceiling is very low"; Frugal · `b1S3XoaRa3k` · [13:08] · "what is the point of any of these being a collab"; Frugal · `K45OlNNhY8g` · [01:10] · "this shoe looks good either way"
- **The four:** only Frugal (the others are silent).
- **Engine today:** has it (only the shoe type is read; brand never counts).
- **AI can see it:** no for model and brand; yes for type.
- **Frame:** `inputs/youtube/shots/FFDYIGhiIk8/f-06-28.jpg` (unverified)

#### shoe.9. One statement: a plain shoe lets a curated outfit stand out, and a loud personal shoe works on a quiet outfit, not both at once.
- **Strength:** nuance (a fault when a fancy shoe tops an already perfect outfit). **Holds when:** Wanhee: the rest is already "really perfect", so the plain shoe underplays it. Frugal: a loud personal sneaker brings "hits of personality" to a plain outfit and adds flavor without taking over. **Doesn't:** a loud shoe with another loud piece.
- **Interacts with:** cohesion (one focal point); color (the shoe as the accent); season.2 (underplay).
- **Sources:** Wanhee · `uBsIrt-zU0I` · [08:31] · "it can kind of look like you just curated it too much"; Frugal · `8rmkOpCbFTM` · [18:09] · "They are the hits of personality"; Frugal · `FFDYIGhiIk8` · [06:54] · "enough flavor to spice up your fit without being too aesthetically dominant"
- **The four:** Wanhee and Frugal split on whether the shoe should be the statement; Tim keeps the eye off the feet by matching shoe to trouser (`wIib9hzVUuw` [08:07]), on Wanhee's side; Jaye is silent here. Read together: one statement, and the shoe can be it only when the rest is quiet.
- **Engine today:** has it [SHO-10] (a loud shoe as the one accent +0.5; with a loud piece −0.75). Wanhee's "plain shoe on a curated outfit" isn't in it.
- **AI can see it:** yes (the shoe's color family, saturation, pattern).
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-18-14.jpg` (unverified)

#### shoe.10. A shoe that repeats a color from the outfit ties it together, black included; matching the shoe to the trouser keeps the eye up.
- **Strength:** lift. **Holds when:** black boots with a black shirt; black loafers with black trousers; a black sneaker in an all-black outfit; a color placed twice, shoe and belt (outsider). **Doesn't:** white sneakers under grey are the other good choice (shoe.7).
- **Interacts with:** color (repeat vs anchor); shoe.6.
- **Sources:** Tim · `OqoUgLxknJc` · [16:03] · "because of the black of the shirt"; Tim · `wIib9hzVUuw` · [08:07] · "matching the black loafers with the black trousers"; Tim · `wIib9hzVUuw` · [10:40] · "a black sneaker will make the whole look more visually pleasing"; Drew Joiner (outsider) · `DWmnbUo8dlA` · [06:21] · "I'll add red in two spots my belt and my shoes"
- **The four:** only Tim (the others are silent).
- **Engine today:** has it differently [COL-5]. Shoes picking up a color from the top earn +0.5, but never in white, black, grey, navy or denim, so Tim's black boots with a black shirt earn nothing (dealbreakers L6 proposes letting navy and grey count).
- **AI can see it:** yes (color family on shoes and clothes).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-16-08.jpg` (checked: a black square-toe Chelsea boot under light-wash jeans; the black shirt isn't in frame)

#### shoe.11. Few all-black sneakers look good to Tim; light details (a gum sole, off-white laces) save one.
- **Strength:** nuance (Tim's taste). **Holds when:** a black sneaker in an all-black outfit. **Doesn't:** Wanhee's all-black "whatever shoe" works with everything; Frugal picks black beaters on purpose for winter.
- **Interacts with:** color (light details break up an all-dark shoe).
- **Sources:** Tim · `_6-4CHHXg3c` · [06:30] · "there are not many black sneakers that I like the look of"; Tim · `wIib9hzVUuw` · [10:40] · "with beige detail and laces could work"; Wanhee · `uBsIrt-zU0I` · [08:00] · "It just works better if they're all white or all black."
- **The four:** Tim for; Wanhee differs; Frugal differs in practice (`zAeLpbxDmEo` [05:48]); Jaye is silent.
- **Engine today:** lacks it (and it should stay out: it's taste, and sole and lace colors aren't read).
- **AI can see it:** no (sole and lace colors aren't read).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-10-45.jpg` (unverified)

#### shoe.12. Leather at the foot against a fabric hem is texture contrast, even in one color.
- **Strength:** lift. **Holds when:** baggy black pants over black leather boots that just peek out; polished leather shoes with frayed denim hems. **Doesn't:** needs light on the leather; a full-coverage hem hides it.
- **Interacts with:** layer.1 (texture in a one-color outfit); proportion (how much boot shows); cond.6 (fraying on purpose).
- **Sources:** Frugal · `Vn6KlXkU2xA` · [06:28] · "a little bit of contrast even though they're both black"; Frugal · `FPHnmY5FTaI` · [04:48] · "leather married to the frayed hems"
- **The four:** only Frugal (Jaye's heavy boots under wide pants are similar, per notes).
- **Engine today:** lacks it.
- **AI can see it:** no (texture and frayed hems aren't read).
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-06-33.jpg` (checked: the same spread of black leather jacket, black jeans and black boots as layer.1, not the boot under the pant)

#### shoe.13. Even the most casual shoe should carry some style; the occasion picks which shoe.
- **Strength:** fault (a shoe with no style, which drags every lazy day down). **Holds when:** errands, the gym, a quick meal still want a shoe with "some style potential" (Sambas, AF1s, GATs, Birkenstocks); the main shoe for school and work; the statement shoe for dates and events. **Doesn't:** Frugal puts mules, slippers and slides inside one deliberate look; a matched slipper shoe or mule makes relaxed summer trousers drape better (outsider, season.3).
- **Interacts with:** occasion (season.1); shoe.8 (the basic's ceiling).
- **Sources:** Frugal · `_4g9z4ELSj0` · [07:04] · "get a sidearm that's going to have at least some style potentials"; Frugal · `_4g9z4ELSj0` · [12:54] · "date nights special events"; Frugal · `FPHnmY5FTaI` · [04:48] · "leather married to the frayed hems"
- **The four:** only Frugal (Wanhee's "whatever shoe" agrees on a plain clean default).
- **Engine today:** has it differently: slides out of the house are held to 4.5 ([SHO-2]) and running shoes to 5.0 ([SHO-3]); mules and slipper shoes aren't in the reading, so a deliberate slide look can't be told apart.
- **AI can see it:** yes (shoe subcategory); weakly for mules and slipper shoes.
- **Frame:** `inputs/youtube/shots/_4g9z4ELSj0/f-07-09.jpg` (unverified)

#### shoe.14. Shoes date a photo more than anything, but only a few have a fixed dated image; being popular isn't being dated.
- **Strength:** nuance (no engine charge recommended). **Holds when:** a shoe whose public image has set (the sock trainer, CDG heart Converse, tan suede Chelsea boots with skinny jeans); see the table below. **Doesn't:** fatigue alone doesn't expire a shoe (Frugal, 2024); combat boots never look dated.
- **Interacts with:** shoe.8; proportion (the dated part is often the pant: skinny jeans).
- **Sources:** Frugal · `oZYZ7AC_pZc` · [00:00] · "shoes are one of the biggest giveaways for a time period"; Frugal · `eAvgvOHKPPw` · [00:32] · "you will always be limited by the public perception of the shoe"; Frugal · `WP5sWeQRSNA` · [09:37] · "these things are not expiring as fast as you think"; Frugal · `eAvgvOHKPPw` · [08:06] · "just get a pair of leather Chelsea boots grow up"; Frugal · `JY_zrt43cbU` · [08:18] · "I don't think I've ever seen them as dated"
- **The four:** Frugal; Tim's 2026 trend list (table) agrees on the few he names; the others are silent.
- **Engine today:** lacks it.
- **AI can see it:** no (the shoe model isn't read).
- **Frame:** `inputs/youtube/shots/eAvgvOHKPPw/f-00-37.jpg` (unverified)

### Dated vs current shoe claims (trend notes, with the year said)

| Claim | Who · video | Said |
|---|---|---|
| CDG heart Converse "you can't wear these anymore" (peak about 2016) | Frugal · eAvgvOHKPPw | 2023 |
| Tan suede Chelsea boots with skinny jeans are the dated mid-2010s look; leather Chelsea boots survive | Frugal · eAvgvOHKPPw | 2023 |
| Boost runners (Ultraboosts) "fell off" as fashion | Frugal · eAvgvOHKPPw | 2023 |
| Sock trainers: public image set, no longer posted in fit pics | Frugal · eAvgvOHKPPw | 2023 |
| McQueen chunky sneakers the biggest red flag, fading by December | Frugal · K45OlNNhY8g, eAvgvOHKPPw | 2023 |
| Rick Owens Ramones took CDG Converse's place on the same outfits | Frugal · K45OlNNhY8g | 2023 |
| Sambas the "main character", Salomons the dark horse | Frugal · K45OlNNhY8g | 2023 |
| Vans Old Skool past its peak; Sk8-Hi a serious casual shoe | Frugal · K45OlNNhY8g | 2023 |
| Stan Smith a classic waiting for its comeback | Frugal · K45OlNNhY8g | 2023 |
| Platform and gimmick Converse worse than the plain one; collab Crocs "chaotic evil" | Frugal · K45OlNNhY8g | 2023 |
| Footwear going feminine: heeled boots, Tabis, dainty GATs | Frugal · 4hwelpjhDTM | 2023 |
| Sambas the year's meta shoe (after Old Skools, Dunks, 550s) | Frugal · oZYZ7AC_pZc | 2024 |
| Birkenstock clogs and mules now mainstream | Frugal · oZYZ7AC_pZc | 2024 |
| Popular shoes "not expiring as fast as you think" | Frugal · WP5sWeQRSNA | 2024 |
| Chunky designer sneakers (Balenciaga 3XL) don't help very wide jeans; Tabi boots cool, Tabi sneakers too far | Frugal · b1S3XoaRa3k | 2024 |
| Slim low sneakers (Sambas, Onitsuka Tigers, Gazelles, Speedcats, Blazers) the hottest silhouette | Frugal · FFDYIGhiIk8 | 2025 |
| Loafers and mules are back, where dad shoes were four years earlier | Frugal · UidnEGXwZRk | 2025 |
| The shoe as centerpiece is the about-2016 way; now shoe and pants are equal | Frugal · 8rmkOpCbFTM | 2026 |
| Combat boots never look dated | Frugal · JY_zrt43cbU | 2026 |
| New Balance 990s "controversial yet unthreatening" (about the 2018-19 era) | Frugal · TUYSTimnDJg | 2026 |
| Low-profile sneakers and pant shapes are live trends; sneakers "far from dead"; loafers and boots thrive; black derbies a lasting classic | Tim · 30L-EHe4WAQ | 2026 |
| Hiking shoes far from any trail: a trend he regrets | Tim · 30L-EHe4WAQ | 2026 |
| Engineer boots overkill for everyday; ballet flats for men: skip | Tim · 30L-EHe4WAQ | 2026 |
| Slim sneakers (Sambas, GATs, Mexico 66s) "still going strong" with short shorts (outsider: James Leung) | w-mXLoLOU4w | 2026 |

---

### Condition and finishing (cond.*)

#### cond.1. A visible stain ruins even the best outfit.
- **Strength:** dealbreaker (Tim: "even the best of outfits"). **Holds when:** any clear stain on a piece of clothing. **Doesn't:** wear and fade are a different thing (cond.3).
- **Interacts with:** every credit (a stained piece earns nothing anywhere); the floor.
- **Sources:** Tim · `IUMqpLeCT-E` · [00:33] · "even the best of outfits will instantly look 10 times worse"; Tim · `IUMqpLeCT-E` · [00:33] · "don't let a great outfit be overshadowed by a simple stain"
- **The four:** Tim says it outright; no one defends a stain (Wanhee's and Frugal's worn-in is about age, not dirt).
- **Engine today:** has it differently: −1.2 on Condition ([CON-1]), no credits ([CON-4]), the 5.0 floor lost ([SCO-3]), but no cap (dealbreakers S9 proposes 5.5).
- **AI can see it:** weakly (the condition read flips between runs and counts only when the AI is clear, [CON-5]).
- **Frame:** none (described only)

#### cond.2. Crisp where the look is crisp: creases cost on shirts, trousers and tailoring, and on a tee in a minimal outfit; soft rumple on a casual tee or hoodie doesn't.
- **Strength:** fault. **Holds when:** shirts not ironed, trousers not pressed, a creased blazer; fresh fold creases and stiff shoulders on a brand-new piece; linen that looks unironed after sitting down (outsider). **Doesn't:** a lived-in tee or hoodie in streetwear, workwear or a no-look casual outfit; vintage tees "season" a selection.
- **Interacts with:** style world (crisp minimal and smart casual vs lived-in streetwear and workwear); fabric (linen creases by nature but still reads creased); cond.3.
- **Sources:** Tim · `XSF9AOx7sdU` · [05:49] · "his shoes polished and his coats lint free"; Harry (Tim's guest) · `OqoUgLxknJc` · [14:26] · "forwarded my trousers down the crease" (caption unclear: pressed); Jaye · `Jz9QVWgBbOg` · [20:19] · "naturally knocking the wrinkles out my clothes"; Jaye · `CI-wkEOHRAg` · [05:37] · "You don't want to have no wrinkled"; Wanhee · `RtxJqd5Drps` · [09:48] · "New clothes are like a new haircut."; Frugal · `FlQ3WZ-H2Ik` · [14:21] · "I think vintage t-shirts are nice to season your selection"; Harry Has (outsider) · `h4-sPhUHwLY` · [01:37] · "it looks like you forgot to iron your clothes"
- **The four:** Tim and Jaye agree on creases; Wanhee faults brand-new stiffness, not soft wear; Frugal says crisp new is fine and stiff isn't.
- **Engine today:** has it: [CON-1] wrinkles −0.4, set by garment and look in [CON-6] (a knit top −0.2 only in minimal, smart casual or prep; free in the casual looks), [CON-5] clear reads only.
- **AI can see it:** weakly (one "wrinkled" value: soft rumple can't be told from fold creases, and it flips between runs).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-14-31.jpg` (unverified)

#### cond.3. Real age is character: fade on denim, patina on leather, a lived-in vintage jacket, a vintage tee softened by wear.
- **Strength:** lift. **Holds when:** leather, denim and vintage pieces, aged by use or by one owner over years. **Doesn't:** neglect (cond.4), stains (cond.1), or a smart outfit where Tim wants polish.
- **Interacts with:** layer.11 (age adds drape and changes the fit); cohesion (vintage and workwear worlds); color (faded black and faded blue pair more easily).
- **Sources:** Tim · `-e9Is50-fn0` · [09:54] · "look even better as they age"; Frugal · `RlcdMBj5Z2E` · [06:58] · "vintage if you want to really create some depth of character"; Frugal · `hk4KWJiETTw` · [09:04] · "proving its tenacity through aging and patina"; Frugal · `CsbsHWEBwy0` · [09:30] · "it's aging gracefully as I've been the only one"; Frugal · `hk4KWJiETTw` · [05:52] · "there's just something valuable about something looking old"; Frugal · `FlQ3WZ-H2Ik` · [10:40] · "the way this specific shirt's material broke down and aged"; Wanhee · `B9PIhkSQKuw` · [00:32] · "it looks like you lived your life with those clothes"
- **The four:** Tim, Frugal and Wanhee agree; Jaye: the October notes say he charges worn-out or faded pieces, but no such line turned up in his transcripts here (his condition lines are about wrinkles), so the clash is unconfirmed.
- **Engine today:** has it differently. Wear costs −0.4 except on pieces distressed by design ([CON-1]); worn shoes −1.0, work boots and suede chukkas −0.5 ([SHO-11], [WRK-7]). The engine reads patina and fade as wear, and can't tell them from damage.
- **AI can see it:** weakly ("worn" can't tell patina from damage; suede nap reads as wear, KD-12).
- **Frame:** `inputs/youtube/shots/hk4KWJiETTw/f-09-09.jpg` (checked: shows a black heavyweight tee product shot, not the leather jacket; no matching still)

#### cond.4. Worn-out isn't worn-in: a see-through or flimsy tee, a stiff one, a wavy or stretched collar, shape lost after washing, lint, pilling and broken stitching cost.
- **Strength:** fault. **Holds when:** the piece shows neglect or cheap make at the neck, the surface or the seams. **Doesn't:** a flaw noticed doesn't always sink a fit when color carries it (Jaye's guest still called the bag "fire"); Frugal accepts a very lightweight tee as "a completely different direction" (`env4ZvWzcd4` [07:53]).
- **Interacts with:** layer.11 (too thin or too stiff are the two ends of drape); silhouette (stiff fabric makes a boxy shape).
- **Sources:** Tim · `DwolmJNAw_k` · [00:40] · "Some were too thin or too see-through"; Tim · `DwolmJNAw_k` · [02:22] · "the collar being too flimsy or too wide or losing its shape"; Tim · `vziGl_FxQb0` · [05:25] · "The collar doesn't always hold up the best"; Tim · `a7FgCE9NPmw` · [01:42] · "that can lead to a stiff silhouette which just looks terrible"; Tim · `2KblatXQTGs` · [02:40] · "thick enough to not be transparent yet breathable"; Jaye's guest · `cwLasFLe-DY` · [13:25] · "The stitching is broken right here."
- **The four:** Tim; Jaye's guest agrees; Frugal mildly clashes on thin tees; Wanhee is silent.
- **Engine today:** has it in part: pilling or wear −0.4 ([CON-1]). Collar shape, see-through fabric, stiffness and lint aren't read.
- **AI can see it:** weakly (condition worn or pilled; collar shape and transparency no).
- **Frame:** pending (`cwLasFLe-DY` [13:25] is on screen; no stills folder)

#### cond.5. Shoe condition depends on the shoe: clean white sneakers and dress shoes need to look cared for; rugged leather boots and beaters wear well.
- **Strength:** nuance. **Holds when:** Tim: polished shoes; he won't wear white sneakers in rain. Frugal: his "absolutely destroyed" leather back-zip boots still go with everything; AF1s look good clean or dirty; good leather broken in over 100+ wears becomes the best shoe. **Doesn't:** dirt on a white sneaker is never patina.
- **Interacts with:** cond.3; season.10 (weather shoes).
- **Sources:** Tim · `XSF9AOx7sdU` · [05:49] · "his shoes polished and his coats lint free"; Tim · `XIYvycsZxDk` · [04:00] · "I don't want to ruin a perfectly good pair of white sneakers"; Frugal · `_4g9z4ELSj0` · [10:46] · "they go with everything styled up and down seamless"; Frugal · `K45OlNNhY8g` · [01:10] · "this shoe looks good either way"; Frugal · `4Jrq_F1Ayp8` · [04:24] · "at 100 plus Wares this piece will become fully charged"
- **The four:** Tim and Frugal split; read together, polish and break-in creases on good leather can coexist, while grime on a clean shoe can't.
- **Engine today:** has it differently: worn or dirty shoes −1.0, work boots and suede chukkas −0.5 ([SHO-11], [WRK-7]); a flat charge (KD-12).
- **AI can see it:** weakly (the worn read flips on about half the photos where it fires; nap reads as wear).
- **Frame:** `inputs/youtube/shots/_4g9z4ELSj0/f-10-50.jpg` (unverified)

#### cond.6. Deliberate distressing belongs to casual worlds, and authentic distressing beats fake.
- **Strength:** nuance (a fault in a smart outfit). **Holds when:** a heavily distressed hoodie in a very casual, streetwear-leaning outfit; lived-in-looking distressed denim in Japanese workwear or Americana; fraying on purpose at the hem. Fading reads better on blue than on grey or black. **Doesn't:** a distressed piece in a smart or minimal outfit.
- **Interacts with:** style world; color (fade on blue); shoe.12.
- **Sources:** Tim · `_6-4CHHXg3c` · [08:40] · "I would definitely only wear this with a very casual outfit"; Tim · `dk1efCZqwos` · [03:15] · "distressing denim in a way that felt so authentic"; Frugal · `TnNv7Zvui6E` · [11:16] · "fading and texture fuses the piece just a bit"; Frugal · `FPHnmY5FTaI` · [04:48] · "leather married to the frayed hems"
- **The four:** Tim and Frugal agree; Wanhee agrees in spirit; Jaye is silent.
- **Engine today:** has it: no wear charge on pieces distressed by design ([CON-1]); distressed jeans with a blazer −1.5 ([STY-3]); a distressed non-denim piece isn't minimal ([MIN-3]); ripped skinny or slim jeans −0.5 more ([PRO-13]).
- **AI can see it:** weakly (distressed by design is read; authentic vs fake isn't).
- **Frame:** `inputs/youtube/shots/TnNv7Zvui6E/f-11-21.jpg` (unverified)

---

### Occasion and season (season.*)

### Season at a glance (what the four say, in one place)

| | Hot weather, no layers | Mild (spring, early fall) | Cold (late fall, winter) |
|---|---|---|---|
| What carries the outfit | The trousers' shape and the waist (a fitted tee or tank over wide, high-waisted trousers, or tucked), light fabric (linen, seersucker), a light tonal palette, one textured top (season.3) | One light layer that shows the base: an overshirt or chore coat over a tee, a leather or work jacket (season.7) | Texture and two or three layers, thin to thick, under one structured coat (season.6, layer.4, layer.9) |
| What a layer adds | A light open shirt over a tank adds a layer without heat (season.4) | Depth and a vertical line (layer.2) | Depth, texture contrast, and the coat sets the formality |
| What a layer costs | A heavy layer looks wrong in heat, and nobody expects one: a no-layer outfit isn't missing anything (season.8) | Little; a bulky winter coat is "put away" | A fourth layer, purposeless stacking, knit over knit (layer.5, layer.7) |
| The one hard line | none | none | No bare ankles in winter (season.9) |
| Engine today | No season input; the waist break ([PRO-4]) and shorts shape ([PRO-15]) are the only ways up; [STY-9] charges a tank on its own; [COL-12] charges light on light | Layer credits apply | Layer credits apply; texture is unseen |

#### season.1. Dress for the occasion, in both directions: a good outfit in the wrong place is a bad outfit.
- **Strength:** fault. **Holds when:** a hoodie and jeans in a room of tailored suits, or a three-piece suit at a family barbecue; head-to-toe designer on a weekday afternoon. Unspoken dress codes count. **Doesn't:** when there's no dress code, the everyday level is the default.
- **Interacts with:** season.2 (which direction is worse); shoe.13; season.15.
- **Sources:** Tim · `IUMqpLeCT-E` · [00:00] · "a good outfit in the wrong place can be a bad outfit"; Tim · `XSF9AOx7sdU` · [02:39] · "that's not actually being well-dressed"; Tim · `0JtnbgtbQfE` · [02:46] · "it's all about outfit selection based on formality"; Wanhee · `tNVdA_arEa8` · [07:10] · "they dress for the occasion"; Frugal · `YFxXWWM5YRI` · [07:30] · "do you really have to be wearing that right now"; Frugal · `LkN3yI1-TB4` · [03:49] · "how are you just outside in full balenci at 2:30 p.m."
- **The four:** all agree on the rule; they differ on which direction is worse (season.2).
- **Engine today:** has it: too casual ([OCC-1], up to −0.5 and falling ceilings), overdressed ([OCC-2], up to −0.5 past 1.5 levels), and [OCC-3]–[OCC-7].
- **AI can see it:** yes (dressiness comes from the pieces; he picks the occasion).
- **Frame:** `inputs/youtube/shots/IUMqpLeCT-E/f-00-05.jpg` (unverified)

#### season.2. Match the room, at most a small step up: underdressing at a dressy occasion costs more than being a little overdressed, and everyday outfits gain nothing from going far above the room.
- **Strength:** nuance (it sets how [OCC-1] and [OCC-2] compare). **Holds when:** at an interview, event or smart-casual code, lean a half step smarter (Tim 2026; Jaye's trench over the interview suit). Everyday and dates: dressed well but understated (Wanhee). **Doesn't:** Jaye's 2025 rule, "never" be anything but overdressed, even on a store run, which he walked back in 2026.
- **Interacts with:** layer.7 (try-hard); shoe.9 (the plain shoe); cohesion (Wanhee's golden rule).
- **Sources:** Jaye (2025-02-08) · `7K2qRZaXX3w` · [00:00] · "never ever go to any occasion and not be overdressed ever"; Jaye (2025) · `7K2qRZaXX3w` · [02:38] · "whenever you think you're being extra you're probably not even doing enough"; Jaye (2026-02-09) · `Jz9QVWgBbOg` · [11:10] · "If you wear a suit jacket everywhere to every occasion"; Jaye (2026) · `Jz9QVWgBbOg` · [11:40] · "My flyness wasn't even fly no more."; Jaye (2026-05-30) · `UcLBvcmnnus` · [17:11] · "because they never tried to look better than everybody else"; Wanhee (2026-11-08) · `mpv9WWHDZio` · [00:36] · "the more you look like you've tried to look good"; Wanhee (2026) · `mpv9WWHDZio` · [08:14] · "He knows that he's just a dad going to a gallery."; Wanhee (2025) · `kAaM_zcxh_U` · [04:50] · "you're dressed well, but in an understated way"; Tim (2026-05-04) · `vQd36IKIkOg` · [08:18] · "preferably leaning towards the smarter side"; Frugal (2024) · `LkN3yI1-TB4` · [03:49] · "how are you just outside in full balenci at 2:30 p.m."
- **The four:** Tim, Wanhee and Frugal agree; Jaye 2025 differs (always overdress, 7K2qRZaXX3w [00:00]); Jaye 2026 moved toward the others: a suit everywhere lost its meaning, he wanted "a smooth" go-to jacket for casual days (Jz9QVWgBbOg [11:40]), and his top level never tried to look better than everybody else. The newer view wins.
- **Engine today:** has it: the too-casual side costs more (deduction plus ceilings, [OCC-1]) than the overdressed side (up to −0.5 only past 1.5 levels, [OCC-2]), which matches the majority. Wanhee's "underplay a curated outfit" isn't in it (shoe.9).
- **AI can see it:** yes (dressiness levels from the pieces).
- **Frame:** none (described only)

#### season.3. In hot weather with no layers, the trousers and the waist carry the outfit: a fitted tee or tank over wide, high-waisted, well-made trousers, light fabric, light tonal colors.
- **Strength:** lift. **Holds when:** a tight tee or tank over wide trousers ("tight waist wide legs"); a slim tee tucked into flowy linen trousers (outsider); loose tanks, linen pants and calm tonal colors (Jaye); lightweight trousers over shorts and beige or cream as the warm-weather neutral (Tim); relaxed pleated shorts (mid-thigh to knee) or a shorter tee over baggy shorts (outsiders); a textured top (seersucker, a textured linen shirt, a crochet or bouclé knit polo: outsiders). **Doesn't:** with slimmer trousers a wide or oversized top no longer works ("the box is smaller"); linen with no shape looks flat or sloppy, so pleats, a slightly relaxed fit or a cotton-linen blend help (outsider: Harry Has); tight shorts are "hardly ever" the way to go (outsider: James Leung). **Dropped (clash):** Harry Has's advice that a tank worn on its own should be "slightly looser" clashes with Frugal's tight tank over wide trousers, so it's left out. Brandon Balfour's "brighter colors or subtle patterns" for summer is left out too, since it leans against Tim's muted palette; only "subtle pattern on a camp-collar shirt" survives, under [COL-8]'s limits.
- **Interacts with:** proportion (top width against trouser width; the waist break); color (a light tonal summer outfit vs [COL-12]); shoes (a slim shoe, loafer, mule or slipper shoe lets relaxed trousers drape, outsider; shoe.13); condition (linen creases, cond.2).
- **Sources:** Frugal · `XtcY-zmoS-E` · [03:37] · "this is probably my bread and butter for the whole summer"; Frugal · `XtcY-zmoS-E` · [04:07] · "tight waist wide legs I feel like I can conquer the Earth"; Frugal · `XtcY-zmoS-E` · [04:07] · "the box is smaller"; Jaye · `5Dfr0PXTTpM` · [06:40] · "Loose tank tops, linen pants, oversized shorts, nice watches"; Tim · `o5RnTT2oafg` · [01:09] · "one of the most versatile neutral colors for warmer weather outfits"; Tim · `o5RnTT2oafg` · [03:54] · "I think it looks really nice in a light tonal outfit"; James Leung (outsider) · `w-mXLoLOU4w` · [06:34] · "a slim fit t-shirt preferably tucked in"; James Leung (outsider) · `w-mXLoLOU4w` · [02:09] · "Going for a shorter length t-shirt is important to balance out" ; James Leung (outsider) · `w-mXLoLOU4w` · [02:40] · "with shorts, tight is hardly ever the way to go"; Harry Has (outsider) · `h4-sPhUHwLY` · [00:35] · "they help the fabric drape in a much more intentional way"; Harry Has (outsider) · `h4-sPhUHwLY` · [01:06] · "The ripple texture not only gives the material more structure"; Brandon Balfour (outsider) · `4IAFUIAi2vs` · [02:46] · "the right t-shirt with the right fit and quality"
- **The four:** Frugal, Jaye and Tim agree that the trousers' shape and fabric carry a summer outfit; Wanhee is silent on summer (only that a thick tee isn't a summer tee). Within the four: Tim prefers lightweight trousers to shorts ("I usually just opt for lightweight trousers in summer", `o5RnTT2oafg` [01:42]), Frugal also wears jorts.
- **Engine today:** has it differently. A tucked or belt-length tee over a loose leg earns +1.5 ([PRO-4]), but Frugal's tight tee left untucked over wide trousers earns nothing unless it's read at the belt. Loose shorts under a roomy top earn +1.0 ([PRO-15]). A tank on its own out of the house costs −2.0 ([STY-9]), which hits Frugal's and Jaye's summer uniform. Light on light costs −1.0 ([COL-12]), which hits Tim's cream-on-cream summer outfit. Linen and texture earn nothing.
- **AI can see it:** weakly (roominess, leg shape, tucked and length are read, but "at the belt" is weak, and rise and fabric aren't read at all).
- **Frame:** `inputs/youtube/shots/XtcY-zmoS-E/f-03-42.jpg` (checked: a fitted black tee and a white tank, each over wide black trousers, captioned "classic small top big pant")

#### season.4. A light open layer adds a layer without heat: an open button-up or short-sleeve shirt over a tank, or a light casual jacket when the weather allows.
- **Strength:** lift. **Holds when:** a white rib tank under an open, slightly oversized casual shirt; a short-sleeve shirt over a tank with pleated trousers; a calm button-up over a tank with flowing trousers; a light summer jacket with shorts on a cool day; an open button-up over a tank with short sport shorts, a smart top over a sporty bottom (outsider: James Leung). **Doesn't:** a formal dress shirt (layer.10); a bulky jacket in heat.
- **Interacts with:** layer.2 (the open front); layer.10; formality (the shirt sets the level).
- **Sources:** Tim · `2KblatXQTGs` · [00:34] · "they're arguably the most versatile summer item you can wear"; Tim · `o5RnTT2oafg` · [04:27] · "paired with a shirt long sleeve or short sleeve over a vest"; Jaye · `5Dfr0PXTTpM` · [06:40] · "a calm button up beach style"; Tim · `2KblatXQTGs` · [01:05] · "like a denim jacket or a leather jacket if the weather allows"; James Leung (outsider) · `w-mXLoLOU4w` · [08:16] · "You could wear it open with a tank top underneath."
- **The four:** Tim and Jaye agree; Frugal's summer variations (a tank, the tuck, a light jacket, `5gKnDwVm_Eg`) agree; Wanhee is silent.
- **Engine today:** has it in part. A tank under an open shirt is judged by the shirt ([STY-4], [STY-9] don't charge it). An open shirt tucked in earns the waist break ([PRO-4], v14); untucked over straight legs it earns nothing, and over loose legs only if read at the belt ([PRO-14]).
- **AI can see it:** weakly (the tank is named; open vs buttoned isn't read).
- **Frame:** `inputs/youtube/shots/5Dfr0PXTTpM/f-06-45.jpg` (unverified)

#### season.5. Fabric follows the season: linen and breathable fabrics in heat, wool and cashmere in cold; a thick tee isn't a summer tee.
- **Strength:** nuance (mostly unseen in a photo). **Holds when:** linen in summer, cashmere or wool in winter; breathable trousers in spring; no heavy selvedge in summer heat; a heavyweight boxy tee for colder months. **Doesn't:** medium-weight pieces work all year (Tim's twill jacket, Wanhee's four-season tee).
- **Interacts with:** layer.6 (fabric mood: linen summery, wool rich); layer.14; cond.2 (linen creases).
- **Sources:** Tim · `jaOSdGqtgYY` · [07:32] · "anything Linen in summer anything cashmere in Winter"; Tim · `2KblatXQTGs` · [01:05] · "the key to dressing in hot weather is choosing the right Fabric"; Tim · `_6-4CHHXg3c` · [06:30] · "but not something for the summer"; Wanhee · `ew3gCk1zkso` · [06:58] · "linen is very summery and Airy"; Wanhee · `Mr-GzwGQ1qY` · [05:02] · "not going to be the one that I wear in the summer"; Frugal · `WDsQRHa8jBY` · [04:10] · "it can't have pants that are too stiff"; Jaye · `RIuzSb8OLMM` · [13:13] · "focus on breathable fabrics cuz we are in the spring"
- **The four:** all agree.
- **Engine today:** lacks it (no fabric; [CON-1] treats wrinkles on likely-linen pull-on trousers and camp shirts as −0.2).
- **AI can see it:** no (fabric and weight aren't read; linen is only guessed from the subcategory and wrinkles).
- **Frame:** `inputs/youtube/shots/Mr-GzwGQ1qY/f-05-07.jpg` (unverified)

#### season.6. In fall and winter, texture and layers carry the outfit.
- **Strength:** lift. **Holds when:** wool, cashmere, corduroy, velvet, suede, chunky knits; two or three layers thin to thick; a structured coat added as it gets colder; a winter base layer (a mock neck or thermal) under an overshirt or blazer. **Doesn't:** more than three layers (layer.7); all texture and no shape.
- **Interacts with:** layer.1, layer.4, layer.9, layer.12; season.9.
- **Sources:** Tim · `SNjfZ5NKndc` · [03:32] · "Especially in the colder temperatures"; Frugal · `Jh8dz-KZcfY` · [00:00] · "especially in the colder months"; Tim · `XIYvycsZxDk` · [00:33] · "if it gets colder I would add a structured coat on top"; Tim · `CJv4TGLrdig` · [02:25] · "Something with proper weight."; Tim · `FUWET2HH-us` · [00:00] · "this long sleeve makes for an excellent base layer for winter"; Jaye · `Jz9QVWgBbOg` · [21:49] · "hoodies under bombers if it's freezing outside"
- **The four:** all agree on cold-weather layering; Tim and Frugal lead on texture.
- **Engine today:** has it differently: the layer shape credits apply all year ([PRO-6], [PRO-14], [PRO-17]); texture isn't scored ([MIN-8]); no season input.
- **AI can see it:** weakly (layers and coats named; texture no; season only from approximate weather).
- **Frame:** `inputs/youtube/shots/SNjfZ5NKndc/f-03-37.jpg` (unverified)

#### season.7. Layering follows the temperature: one piece plays different roles as it gets colder.
- **Strength:** nuance. **Holds when:** an overshirt over a tee when mild, then under a coat when cold; a chore jacket for in-between seasons; spring as light layering (a leather or work jacket, a light long coat if it breathes); a mock-neck tee alone in summer and under a sweater in winter. **Doesn't:** a bulky winter coat in spring.
- **Interacts with:** layer.2, layer.4; season.6.
- **Sources:** Tim · `YGm7JMniGVc` · [02:44] · "layer it over a t-shirt when the temperatures are mild"; Frugal · `JY_zrt43cbU` · [02:44] · "it works very well layered"; Tim · `vQ6_okzfNSs` · [00:00] · "Light layering is the name of the game"; Tim · `vQ6_okzfNSs` · [01:05] · "still doable in Spring if it's light and breathable enough"; Tim · `K2HS3_8cTx8` · [00:31] · "as a standalone piece when I'm not wearing a sweater"; Jaye · `Pxeeh-caTJg` · [24:45] · "it's not always going to be hot outside"
- **The four:** Tim, Frugal and Jaye agree; Wanhee is silent.
- **Engine today:** has it differently: the same layer credits all year; an overshirt earns only at belt length over a loose leg ([PRO-14]).
- **AI can see it:** yes (overshirt, chore coat, coat subcategories), plus approximate weather if it were used.
- **Frame:** pending (`YGm7JMniGVc` [02:44] on screen; no stills folder)

#### season.8. In heat, a missing layer is not a fault: a plain, layerless summer outfit is normal, and a heavy layer looks wrong unless it comes off.
- **Strength:** nuance (a scoring principle). **Holds when:** a hot-weather photo of a tee or tank and trousers or shorts with nothing over it. **Doesn't:** cool summer days, nights out (Brandon Balfour, outsider: a light long-sleeve "for those late night shenanigans"); Jaye's concert trick, light underneath and something heavy over it to take off.
- **Interacts with:** season.3 (what lifts it instead); layer.8 (the "add one more piece" fix doesn't apply); the engine's layer credits.
- **Sources:** Frugal · `XtcY-zmoS-E` · [03:37] · "I don't want to put anything"; Frugal · `gKY1VMf4OGs` · [12:05] · "when it's hot outside, I'm like, I'm not going to try today"; Frugal · `5gKnDwVm_Eg` · [05:27] · "probably my most worn outfit of the Year"; Jaye · `7K2qRZaXX3w` · [03:09] · "pull up in something light that's under"; Tim · `2KblatXQTGs` · [01:05] · "if the weather allows"
- **The four:** Frugal, Tim and Jaye agree; Wanhee is silent.
- **Engine today:** lacks it. There's no season input, and the layer credits (up to +1.5) can't be reached in heat, so a hot-weather outfit's only ways above 7 are the waist break ([PRO-4]) and the shorts shape ([PRO-15]). A summer fit as well built as a fall one lands lower.
- **AI can see it:** weakly (the app knows approximate weather but the engine takes no weather input; the reading can't tell a hot photo from a cold one).
- **Frame:** none (described only)

#### season.9. Never bare ankles in winter.
- **Strength:** dealbreaker (Tim: "the one true cardinal sin"). **Holds when:** a winter outfit (sweater, jacket, scarf) with no-show socks and loafers or sneakers. **Doesn't:** high summer, where bare ankles and a sockless smart-casual look are fine (outsider: Harry Has); a crop is a warm-weather choice.
- **Interacts with:** hem (cropped); socks; season.6.
- **Sources:** Tim · `IUMqpLeCT-E` · [03:47] · "you shall never show your ankles in winter"; Tim · `IUMqpLeCT-E` · [03:47] · "this is the one true cardinal sin"; Harry Has (outsider) · `h4-sPhUHwLY` · [03:50] · "the sockless look can be a great option"
- **The four:** only Tim (Wanhee's loose trousers cover the ankle; the others are silent).
- **Engine today:** lacks it.
- **AI can see it:** no (socks aren't read, "cropped" is a weak hem read, and the season needs weather). Until socks are read, a dealbreaker here would only magnify misreads.
- **Frame:** `inputs/youtube/shots/IUMqpLeCT-E/f-03-52.jpg` (unverified)

#### season.10. Weather picks the shoe: waterproof boots in rain, a shearling-lined version of your usual shoe or a black beater in winter.
- **Strength:** nuance. **Holds when:** rain, snow or slush. **Doesn't:** clean white sneakers in rain (Tim won't).
- **Interacts with:** cond.5; shoe.11.
- **Sources:** Tim · `XIYvycsZxDk` · [04:00] · "I don't want to ruin a perfectly good pair of white sneakers"; Tim · `CJv4TGLrdig` · [04:42] · "a sheerling line version of whatever style of shoe" (caption: shearling-lined); Frugal · `zAeLpbxDmEo` · [05:48] · "black sneakers that I just wanted to beat up for daily use"
- **The four:** Tim and Frugal agree; the others are silent.
- **Engine today:** lacks it.
- **AI can see it:** weakly (boots are named; waterproof and shearling aren't).
- **Frame:** `inputs/youtube/shots/CJv4TGLrdig/f-04-47.jpg` (unverified)

#### season.11. Season signals can mix: shorts with a jacket, or odd-season pieces, can make sense in a composed outfit.
- **Strength:** nuance. **Holds when:** a boxy jacket with shorts; a light summer jacket with shorts on a cold day; ski gloves with a shirt and denim in a styled fit; a long-sleeve top with shorts for a more balanced shape (outsider: Harry Has). **Doesn't:** Frugal frames the ski gloves as a styled exception, not an everyday rule.
- **Interacts with:** cohesion; season.4.
- **Sources:** Frugal · `N8RAKkiqe1w` · [06:56] · "I feel like everything makes sense"; Tim · `YGm7JMniGVc` · [01:10] · "you could pull this off in shorts"; Tim's guest · `UNkA9HhbjXY` · [00:33] · "this little summer jacket got a waffle on it"; Harry Has (outsider) · `h4-sPhUHwLY` · [02:41] · "the contrast of a longer sleeve top with a pair of shorts"
- **The four:** Frugal and Tim agree; the others are silent.
- **Engine today:** has it in part: shorts are scored like pants and a short jacket over loose shorts earns +1.0 ([PRO-15]). Dealbreakers S7 and H5 propose caps on a leather jacket with shorts.
- **AI can see it:** yes (category and subcategory).
- **Frame:** pending (`N8RAKkiqe1w` [06:56] on screen; no stills folder)

#### season.12. Meet a dress code and still stand out: add a tailored layer in the code's own color.
- **Strength:** lift. **Holds when:** an all-white party in all white, plus a white blazer. **Doesn't:** a new color that breaks the code.
- **Interacts with:** color (one color, more depth); layer.9.
- **Sources:** Jaye · `7K2qRZaXX3w` · [03:09] · "pull up with a all white Blazer"; Jaye · `UcLBvcmnnus` · [11:50] · "You still pop out with a fit"
- **The four:** only Jaye (the others are silent).
- **Engine today:** lacks it (no dress-code color input).
- **AI can see it:** yes (color family, blazer).
- **Frame:** none (described only)

#### season.13. At a smart-casual code, mix at least one smart and one casual piece, leaning smarter; the shoe and one layer move the same core outfit up or down a level.
- **Strength:** nuance. **Holds when:** a tee and jeans swapped to loafers and a blazer for a night out; sweatpants with a shirt and loafers for errands; smart trousers with a tee and cap for a creative-industry meeting; winter trousers between casual and smart. **Doesn't:** a corporate setting needs more than a creative one.
- **Interacts with:** shoe.6 (the shoe moves the level); layer.9 (the coat moves it); season.2.
- **Sources:** Tim · `vQd36IKIkOg` · [08:18] · "some element of smart and casual combined in your outfit"; Tim · `-V2bE8nDsdo` · [02:34] · "Works great on a mild spring or summer day."; Tim · `-V2bE8nDsdo` · [04:07] · "I think this would work best as a daytime outfit."; Tim · `CJv4TGLrdig` · [05:12] · "not too casual, but not too smart either"; Frugal · `_4g9z4ELSj0` · [12:54] · "date nights special events"
- **The four:** Tim; Frugal agrees (the shoe roles by occasion); the others are silent.
- **Engine today:** has it: [STY-4] (a high-low mix is excused under a jacket, and a layer stands for what's under it) and the occasion bands ([OCC-1], [OCC-6]).
- **AI can see it:** yes (dressiness of each piece).
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-02-39.jpg` (unverified)

#### season.14. For night out, go darker; white sets are for daytime.
- **Strength:** nuance. **Holds when:** a going-out or night photo. **Doesn't:** said once, by Tim, as his preference.
- **Interacts with:** color (light vs dark).
- **Sources:** Tim · `vQ6_okzfNSs` · [03:12] · "for nighttime outings I would rather opt for darker colors"
- **The four:** only Tim (the others are silent).
- **Engine today:** lacks it (Going out has no color rule).
- **AI can see it:** weakly (color family; light vs dark only by lookup).
- **Frame:** `inputs/youtube/shots/vQ6_okzfNSs/f-03-17.jpg` (unverified)

---

### Not scorable from a photo
- Fiber content (natural fibers, a 1–2% stretch, wool-poly blends) and garment weight in grams (Tim XSF9AOx7sdU [02:07], TxQUqvHXyJA, a7FgCE9NPmw).
- Quiet-luxury make that only shows up close or by hand-feel; cheap fabric in "boring" cuts (Frugal 3RdxtHvsuxk; Tim jaOSdGqtgYY).
- A hand-me-down's story or sentiment (Frugal 4Jrq_F1Ayp8).
- Old tees proving quality by surviving 20–30 years (Frugal hk4KWJiETTw).
- Break-in comfort of leather shoes, and Boost comfort (Frugal 4Jrq_F1Ayp8, eAvgvOHKPPw).
- Collab, premium or designer versions of a plain shape; brand prestige (Frugal b1S3XoaRa3k, oZYZ7AC_pZc, FFDYIGhiIk8).
- Shoe-rotation shares (sidearm, main, statement percentages) (Frugal _4g9z4ELSj0).
- Overexposure fatigue as a personal reason to skip a shoe (Frugal WP5sWeQRSNA).
- "You never have to explain your clothes": a stance for Kit, not a rule (Frugal CsbsHWEBwy0).
- Thermals and warm base layers hidden under clothes (Tim CJv4TGLrdig, K2HS3_8cTx8; Daniel Simmons, outsider).
- Fabric moving as you walk with a bag (Frugal Jh8dz-KZcfY [06:29]).
- Swapping pieces of the same role inside one identity (Tim 63Fam1rwvk4).
- The beginner's experimenting stage (Jaye UcLBvcmnnus).
- A wardrobe with day and night sides, or one that covers every weather (Frugal YFxXWWM5YRI; Jaye Pxeeh-caTJg).
- Overdressing as confidence and mindset (Jaye 7K2qRZaXX3w).
- Taking a heavy layer off at the venue (only the arrival look shows) (Jaye 7K2qRZaXX3w).
- Linen's wrinkle-proof alternatives and travel (Brandon Balfour, outsider).


*(This part's notes for the dealbreakers sheet are in the "Creators say (T95)" column of `rubric/research/dealbreakers.md`.)*

---

## 4. Cohesion and style worlds, and the ladder
Nov 14, 2026. From `notes/2026/by-part/rules-cohesion.md` (read in full), `by-part/ladder.md` (in full), the style-world map at the top of `frugal-4-worlds.md`, the October notes where the 2026 notes are thin (`notes/jaye-alexander-b.md`, `notes/wanhee-kim.md`, `notes/tim-dessaint.md`; marked "Oct notes"), and the 458 worked examples in `synth/6-examples.md` (cited as ex.N). Every quote below was checked against `inputs/youtube/clean/<id>.txt`; stamps are the transcript's 30-second blocks. Engine IDs are from `rubric/v5-styles.md` (parts engine v15). All sources are 2023 or later.

**In plain words.** All four agree on the core of cohesion: **one point on a quiet base** beats a pile of statements, the pieces have to add up to one direction, and the more an outfit looks like it tried, the worse it reads. They also agree a deliberate smart/casual cross is a plus, as long as it stays muted and spans two levels of dressiness, not three. On the ladder they agree too: clean basics that fit are "okay", their 7, never a fault and never great; one or two deliberate moves make it good; great is the same competence with a little edge and no visible effort; "iconic" is beyond clothes. **The main disagreement** is whether the point should be a bold statement piece (Frugal's cool jacket, Jaye's statement piece) or a near-invisible detail (Tim's "3%" deviations, Wanhee's underplayed piece); the newest views from all four lean to subtle-but-visible. A second split: Frugal holds that safe, capsule, quiet-luxury outfits top out below great, while Tim praises the best quiet outfits as great. The engine already has most of the faults; what it lacks is the lifts (a focal point earns at most +0.5, a statement jacket earns nothing as a statement, a deliberate smart/casual cross earns nothing), which is why its best outfits stop near 8.0.

**Frames.** Stills in `inputs/youtube/shots/` are taken a few seconds after a 30-second stamp and often show a neighbouring outfit. A frame is called matching only where it was opened and looked at (9 were); every other path says "(unverified)".

---

### Part 1. Cohesion and style worlds (world.*)

### General rules

#### world.1. One focal point on a quiet base: a plain, well-fitted outfit plus one thing that stands out (a jacket, a knit, one accent color, a bag) beats the same outfit plain, and beats several statements.
- **Strength:** lift. **Holds when:** the base is plain and neutral and fits; the point is wearable and in the outfit's world (a cool jacket, a statement cardigan, one bright piece toned down by dark ones, a red bag on all black). **Doesn't:** when the point is a loud piece bought on its own with nothing pointing toward it (world.4); when there are two or more points (world.2); when the "point" is a famous hype piece everyone recognizes, which Frugal calls less personal (Frugal `3RdxtHvsuxk` [08:49] "not relying on a centerpiece that is very known to everybody").
- **Interacts with:** layering (a strong point needs fewer layers: Frugal Jh8dz-KZcfY [01:36]); color (a bright point needs dark neutrals around it, Wanhee's "tone down", [COL-11]); proportion (the founder's red shirt over somewhat baggy blue jeans is this rule plus a sound shape: the shape gets it to 7.5, the one point to about 8); the jacket carries the most area of any piece, so it is the easiest point (Jaye Jz9QVWgBbOg [00:00], Frugal RlcdMBj5Z2E [05:53]).
- **Sources:** Wanhee · `Uw-vpUq8Ewg` · [04:58] · "the way to dress well is to make it simpler"; Wanhee · `rNCrnP-os0U` · [09:15] · "have this minimal base and add a little pop" (Oct notes); Wanhee · `ew3gCk1zkso` · [08:03] · "add like a cheeky red hat or a cheeky whatever"; Frugal · `Jh8dz-KZcfY` · [01:36] · "adding too much will kind of take away from the whole thing"; Frugal · `RlcdMBj5Z2E` · [05:53] · "sometimes all it takes is a cool jacket"; Frugal · `RlcdMBj5Z2E` · [10:48] · "I'm not really wearing anything anyways"; Frugal · `Jh8dz-KZcfY` · [03:47] · "a nice focal point but it's not annoying"; Tim · `-e9Is50-fn0` · [07:07] · "make a simple outfit more visually striking"; Tim · `UNkA9HhbjXY` · [04:46] · "you got a really cool statement cardigan going on"; Tim · `XSF9AOx7sdU` · [02:39] · "still with a little Edge"; Jaye · `Pxeeh-caTJg` · [09:36] · "these will make the fit not basic" (Oct notes); Jaye · `Pxeeh-caTJg` · [08:36] · "it's the main focus of your outfit" (Oct notes); Jaye · `Jz9QVWgBbOg` · [00:00] · "it's not the pants or the shoes" (Oct notes). Worked examples: ex.35 (all black + red bag, great), ex.42 (one letterman jacket in a plain crowd, great), ex.264 (statement cardigan, good), ex.283 (orange parka as the statement, good), ex.438 (black and white plus a colored cap, good).
- **The four:** all agree on one point; they differ on how loud. Tim's 3% rule (`SNjfZ5NKndc` · [01:31] · "built on strong basics, but with one or two subtle deviations", 2025-07) wants a design detail more than a bold piece, and Wanhee underplays the best piece (`RtxJqd5Drps` [10:19], 2026); Frugal (cool jacket, 2024-10) and Jaye (statement piece, 2025-12) want a visible statement. Frugal 2023 (`N8RAKkiqe1w` [10:43]) says the norm is moving from "one statement on neutrals" to a system where every piece lifts the others; his 2024 jacket videos are newer and back the statement, so the statement version stands. Rule as written: one point, visible but not loud.
- **Engine today:** has it differently: one bright piece on a dark base +0.5 Color [COL-11]; one quiet accent +0.5 [COL-5]; a loud shoe as the one accent +0.5 Shoes [SHO-10]; one standout pattern earns nothing [STY-7]; a statement jacket earns only its shape credit ([PRO-6], [PRO-14]), never as the point; accessories (bag, chain, cap) never count [SCO-6]. Worth about +0.1 on the score today, against the creators' "good to great" step.
- **AI can see it:** weakly (color_family and saturation show a color point; pattern and logo show a print point; "statement" itself, a jacket being special, a design detail or a bag are not read; accessories never count).
- **Frame:** `inputs/youtube/shots/RlcdMBj5Z2E/f-04-54.jpg` (looked at: matches, one varsity jacket among plain dark outfits); `inputs/youtube/shots/Jh8dz-KZcfY/f-03-52.jpg` (looked at: a neighbouring example, an orange scarf on a black coat with light jeans, not the red bag; still one accent on a dark base); `inputs/youtube/shots/UNkA9HhbjXY/f-04-51.jpg` (looked at: does not match, it shows a scarf in a bag); `inputs/youtube/shots/-e9Is50-fn0/f-07-12.jpg` (unverified).

#### world.2. Too many statements at once (colors, prints, designed pieces, trend items, materials, designer worlds) turn an outfit into patchwork: try-hard and mediocre, whatever the pieces are worth.
- **Strength:** fault (strong when three or more statements compete). **Holds when:** several loud or designed pieces share one outfit: a huge graphic tee with ripped, patched jeans and statement sneakers; red and green and florals and leather; three designer labels at once; "design here, design there". **Doesn't:** for "a super Fashion Icon" (Wanhee `Uw-vpUq8Ewg` [04:22]); in streetwear one extra statement is tolerated (Jaye's bold mixing, [STR-10]); a composed outfit of odd pieces can be great (Frugal ex.183, ex.184), but he calls that rare.
- **Interacts with:** world.1 (the same pieces, cut down to one, become a lift); layering (Jaye: 2–3 layers at most); world.9 (too many things is how try-hard usually shows).
- **Sources:** Wanhee · `Uw-vpUq8Ewg` · [04:58] · "too many colors too many fits too many items too many Trends"; Wanhee · `ew3gCk1zkso` · [02:06] · "then you just look like some Patchwork"; Wanhee · `B9PIhkSQKuw` · [05:57] · "let me add red and green and flower and leather"; Wanhee · `kAaM_zcxh_U` · [04:19] · "design here, design there"; Wanhee · `tNVdA_arEa8` · [04:36] · "the more you add the more mistakes you can make" (Oct notes); Frugal · `Jh8dz-KZcfY` · [04:50] · "put too many things on and just look stupid"; Frugal · `FFDYIGhiIk8` · [10:13] · "you don't need that"; Frugal · `3RdxtHvsuxk` · [01:11] · "rather than just being a cohesive look"; Tim · `zJ5LCenTcf8` · [00:42] satire: bold colors and striking patterns clashed (ex.356), logo top, logo bottom and logo hat (ex.357); Jaye · `CI-wkEOHRAg` · [07:43] · "You should not be getting hella hella statement pieces" (Oct notes). Worked examples: ex.79 and ex.80 (designer pieces stacked, bad), ex.154 (the e-boy pile, "this doesn't make any sense", bad), ex.433 (red, green, florals and leather, too much).
- **The four:** all agree.
- **Engine today:** has it for colors and prints: [STY-6] too many statements (bright pieces, big patterns, graphics) −0.5/−1.0; [COL-1] too many colors; [COL-4] repeated or triple patterns. Lacks it for designed pieces, trend items, materials and stacked designer labels (none are read).
- **AI can see it:** weakly (color_family, saturation, pattern, pattern_scale and logo cover the color and print half; design details, materials, brands and "trend piece" are not read).
- **Frame:** `inputs/youtube/shots/FFDYIGhiIk8/f-10-40.jpg` (looked at: matches, a Balenciaga runner, black cargos, logo beanie, shades and zip hoodie stacked); `inputs/youtube/shots/FFDYIGhiIk8/f-09-45.jpg` (unverified).

#### world.3. The pieces have to add up to one direction; when they don't, nothing else (layering, details, good single pieces) saves the outfit.
- **Strength:** fault. **Holds when:** the top, bottoms and shoes point to different worlds or none, with no deliberate bridge (world.5 is the deliberate version). **Doesn't:** "one direction" is not "one world": all four allow pieces from two worlds merged on purpose (world.13). Judge the whole, not the average of the pieces: beautiful pieces can make an ugly fit, and ugly pieces a beautiful one.
- **Interacts with:** every lift in every part (Frugal: layering "doesn't even matter" without it); world.6 (the trouser and shoe set the direction); world.13.
- **Sources:** Frugal · `Jh8dz-KZcfY` · [03:15] · "your pieces just don't even compute to a cohesive Vision"; Frugal · `RlcdMBj5Z2E` · [09:43] · "everything in your outfit still has to work together"; Frugal · `N8RAKkiqe1w` · [12:21] · "there are beautiful fits composed of ugly pieces"; Frugal · `gKY1VMf4OGs` · [03:21] · "doesn't work well together" (caption unclear); Frugal · `JY_zrt43cbU` · [10:35] · "people who wear clothes and people who create looks"; Tim · `63Fam1rwvk4` · [02:09] · "what is the dominant color palette what are the key pieces"; Tim · `63Fam1rwvk4` · [06:01] · "does this align with my aesthetic"; Wanhee · `ew3gCk1zkso` · [13:52] · "construct an outfit in that holistic context"; Jaye · `RIuzSb8OLMM` · [08:40] random layering looks "bulky, messy, or just off" (Oct notes; quote 13 words, paraphrased). Worked examples: ex.26 (pieces that don't sit together, "does work... in a bad way"), ex.183 (odd pieces, "really well composed", great).
- **The four:** all agree.
- **Engine today:** has it differently: reading as a look +0.5 Style [STY-1], top to toe +0.5 [STY-2], "the pieces go together" +0.5 for no-look outfits [STY-12], and one fault, a street top among dressy pieces −3.0 [STY-5]. A plain incoherent outfit (say a puffer over chinos with chunky sneakers) costs nothing beyond missing the +0.5. Lacks a general "no direction" fault; dealbreakers row L7 proposes a larger cohesion lift instead.
- **AI can see it:** yes, for the app's looks (category, subcategory, color_family, leg_shape, volume feed look detection); no for worlds the app doesn't name.
- **Frame:** none (described only).

#### world.4. A loud or odd piece needs the outfit built around it; dropped alone onto a plain, unrelated outfit it sticks out and drags the rest down.
- **Strength:** fault. **Holds when:** the piece is loud or strange for its own sake (a fluorescent yellow polo with a rainbow stripe, orange Jordans as the starting point, a brand statement sneaker, a dad shoe or Salomon "on a safe neutral plain" wardrobe). **Doesn't:** when the outfit is built for it (a concept, a matching mood, a world that owns it); and not for a wearable point (world.1). The line between the two: a statement jacket or one toned-down bright color is a point; a piece that only makes sense inside its own world is a loud piece.
- **Interacts with:** world.1 (the opposite case); world.8 (the piece's world); color (a bright piece with dark neutrals around it passes, [COL-11]).
- **Sources:** Wanhee · `ew3gCk1zkso` · [03:15] · "it just sticks out like a sore thumb it never looks good"; Wanhee · `ew3gCk1zkso` · [13:52] · "construct an outfit in that holistic context"; Frugal · `_4g9z4ELSj0` · [14:01] · "they absolutely murder when they're paired with a specific concept"; Frugal · `FFDYIGhiIk8` · [08:29] · "the shoe just doesn't work too well out of that box"; Frugal · `N8RAKkiqe1w` · [10:43] · "ugly flourishes better in a system as opposed to when it's isolated"; Frugal · `b1S3XoaRa3k` · [02:10] · "it doesn't actually work in your outfit" (his chunky designer runners with very wide jeans, ex.70). Worked examples: ex.186 (an ugly shoe on a plain neutral wardrobe, bad), ex.437 (the fluorescent polo, never looks good).
- **The four:** Wanhee and Frugal agree; Tim and Jaye silent on the isolated case. In tension with Jaye's and Wanhee's own loud shoe as the one accent on a plain outfit (October notes) and with [SHO-10]: the creators accept a loud shoe when its color or energy is echoed or toned down, not when it is unrelated.
- **Engine today:** has it differently: [SHO-10] gives a loud shoe as the one accent +0.5, the opposite of this rule when the shoe has no tie to the rest; [SHO-10] charges a loud shoe with another loud piece −0.75. Lacks "a loud piece with no tie-in".
- **AI can see it:** weakly (saturation bright and pattern show loud; "odd", "ugly" or "designer" do not; a tie-in can be read only as a shared color_family).
- **Frame:** `inputs/youtube/shots/_4g9z4ELSj0/f-14-06.jpg` (unverified); `inputs/youtube/shots/N8RAKkiqe1w/f-04-24.jpg` (unverified).

#### world.5. Mixing smart and casual on purpose is a lift: a smart piece dressed down, or a casual piece dressed up, kept muted and spanning two levels of dressiness, never three.
- **Strength:** lift. **Holds when:** one smart and one casual element, deliberate and muted: an oversized tee tucked into tailored trousers, a tank under a suit, a turtleneck and sneakers with a suit, pleated trousers with a varsity jacket, a dress shirt and tie with jeans and a leather jacket, sneakers with tailoring. **Doesn't:** across three tiers at once (Tim); when the twist is loud enough to look like a costume (Wanhee: "the more understated and muted it is the better"); a graphic tee with tailoring (world.7). Lean smarter when unsure (Tim).
- **Interacts with:** world.6 (the trouser sets the tier); world.7; occasion (the venue decides which way it leans).
- **Sources:** Tim · `0JtnbgtbQfE` · [06:36] · "only ever mix two of these categories"; Tim · `vQd36IKIkOg` · [07:14] · "pairing a traditionally smarter piece like a blazer with a traditionally casual"; Tim · `vQd36IKIkOg` · [08:18] · "preferably leaning towards the smarter side"; Tim · `XIYvycsZxDk` · [03:25] · "I love the contrast between an elegant piece"; Tim · `IUMqpLeCT-E` · [01:09] · "elevate your outfits to that next level"; Tim · `OqoUgLxknJc` · [12:24] · "sneakers to make it it's a bit a bit more casual"; Tim · `2KblatXQTGs` · [00:34] · "wear it with a suit for a different take on smart casual"; Frugal · `EnLlL2XKRCA` · [03:47] · "pieces like button-down shirts, trousers, and even loafers" (smart streetwear); Wanhee · `tNVdA_arEa8` · [01:36] · "a playful reinterpretation" and [03:06] · "the more understated and muted it is the better" (Oct notes); Jaye · `Ulx1vjAREu0` · [05:37] · "it's like street wear and business together" (Oct notes); Justin Kwan (outsider) · `skd8U8dmIP4` · [01:05] · "mixing classical pieces with casual jeans". Worked examples: ex.372 (Issey pleats with a varsity jacket, good), ex.304 (tank under a suit, good), ex.282 (snap fleece with pleated trousers and white sneakers, good).
- **The four:** all agree.
- **Engine today:** has it differently: no lift for the mix. It only stops charging it: [STY-4] (a 2.5-level gap −1.5) is excused under a jacket and, since v11, when a tank or tee sits under a layer; [MIN-6] lets a boxy top over straight or wide trousers through; [STY-3] still charges a blazer with light or mid-wash jeans −1.5, against Tim's "cool professor" blazer with jeans (Oct notes, `-V2bE8nDsdo` [04:07]).
- **AI can see it:** yes (category and subcategory give each piece's dressiness level; tucked reads the tuck).
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-03-30.jpg` (looked at: a neighbouring outfit, a cropped beige jacket over a grey tee with grey sweats and white sneakers, ex.371, not the varsity pair); `inputs/youtube/shots/vQd36IKIkOg/f-07-51.jpg` (unverified); `inputs/youtube/shots/OqoUgLxknJc/f-12-29.jpg` (unverified).

#### world.6. The partners decide the world: build the outfit up from the trouser, and the same top or jacket moves between casual, street and smart by what it is worn with.
- **Strength:** nuance. **Holds when:** the trouser picks the tier (sweats casual, jeans daily, smart trousers smart, relative to the wearer); the shoe and top tilt it (sneakers and a hoodie lean casual, boots and a knit lean smart); a plain boxy jacket goes over loungewear, with loose denim and sneakers (street), or with tailored trousers and loafers (smart). **Doesn't:** Tim calls it a speed method that "does somewhat limit your creativity" [02:46].
- **Interacts with:** world.5 (two tiers at most); shoes (dressiness match).
- **Sources:** Tim · `0JtnbgtbQfE` · [00:00] · "categorize your pants into three categories casual daily and smart"; Tim · `0JtnbgtbQfE` · [02:12] · "if I want to lean more smart I'll go for the boots"; Tim · `YGm7JMniGVc` · [01:10] · "in a more streetwear outfit with some loose Denim and sneakers"; Tim · `FUWET2HH-us` · [01:05] · "it's perfect if you're into a more utilitarian style"; Tim · `_6-4CHHXg3c` · [08:08] · "I think it could also look great in a smarter outfit"; Tim · `2KblatXQTGs` · [03:45] (ex.310, ex.311: the same grey trousers with boots and a jacket, or sneakers and a tee). Wanhee · `RtxJqd5Drps` · [01:04] (the tuck "might look weird" with a streetwear cap: a classic proportion wants a classic outfit, interaction I1).
- **The four:** only Tim spells it out; Wanhee agrees by example; Frugal and Jaye silent.
- **Engine today:** has it: dressiness levels per piece and the shoe window ([SHO-4], [SHO-5]); look detection by pieces ([STR-1]…[SMC-1]), so the same jacket already reads as different looks with different partners.
- **AI can see it:** yes (category, subcategory, leg_shape).
- **Frame:** `inputs/youtube/shots/0JtnbgtbQfE/f-01-45.jpg` (unverified).

#### world.7. A graphic tee stays at the casual end: wide shorts or baggy jeans, not smart trousers or tailoring.
- **Strength:** fault (a graphic tee with smart pieces). **Holds when:** the tee carries a real graphic. **Doesn't:** a small, quiet graphic under an open casual layer; Frugal's smart streetwear puts graphics on a minimal base, but the graphic he names is on a hat (`EnLlL2XKRCA` [04:20]); Wanhee's wit is a print *shirt* under a black blazer, not a graphic tee.
- **Interacts with:** world.5 (the one mix that fails); pattern; volume (an oversized graphic tee under tailoring is worse).
- **Sources:** Tim · `o5RnTT2oafg` · [03:19] · "you have to stick to the more casual end of the spectrum"; Tim · `vQd36IKIkOg` · [04:28] · "even graphic TE's can be pulled off in a tasteful way" (in a casual outfit); Tim · `30L-EHe4WAQ` · [05:26] · "creative quirky designs when done sparingly"; Frugal · `env4ZvWzcd4` · [08:28] a personal graphic has "so much higher" a ceiling than a blank (pattern part). Worked example: ex.277 (oversized Street Fighter tee with wide shorts or baggy jeans, good when kept casual).
- **The four:** only Tim says it outright; none of the others puts a graphic tee with tailoring.
- **Engine today:** has it: [STY-5] (a graphic or roomy top with two dressy pieces, −3.0), [STY-10] (oversized graphic tee under tailoring, −1.5), [MIN-7]; with one dressy piece it's a tip only (KD-10). Tim's "you have to" supports turning KD-10 into points (founder call).
- **AI can see it:** yes (subcategory graphic tee, volume, pattern_scale).
- **Frame:** pending (no folder for `o5RnTT2oafg`).

#### world.8. Shoes and pieces belong to the outfit's world: trail and technical shoes with outdoor or techwear, activewear sneakers with cargos, canvas with vintage and Americana, minimal leather sneakers with minimal and Americana, brand statement sneakers inside their brand's language.
- **Strength:** nuance (a fault when a piece is plainly from another world with no bridge). **Holds when:** the shoe's world can be named from the rest of the outfit. **Doesn't:** a technical shoe can also work as contrast against plain menswear staples like denim (Tim); the "costume" charge (spotless trail shoes in a café, a style worn without the life) is about the person and can't be scored.
- **Interacts with:** world.3, world.4; condition (a pristine outdoor shoe reads as costume, but the app can't use that); proportion (chunky runners want baggier pants).
- **Sources:** Frugal · `8rmkOpCbFTM` · [17:36] · "so much of the activewear stuff in the activewear world" and "the elevated sneaker spread has never been more tasteful"; Frugal · `oZYZ7AC_pZc` · [10:25] · "best and widest selections of aesthetically accurate shoes"; Frugal · `FFDYIGhiIk8` · [10:47] · "the canvas material specifically just has its own Vibe"; Frugal · `FFDYIGhiIk8` · [08:29] · "the shoe just doesn't work too well out of that box"; Frugal · `b1S3XoaRa3k` · [08:17] · "trail shoes in a coffee shop where they do latte art"; Tim · `30L-EHe4WAQ` · [02:08] · "people who have never hiked in their life wearing hiking shoes"; Tim · `uGregWdLahU` · [05:27] · "in contrast with the more standard Men's Wear Staples like denim"; Frugal · `FFDYIGhiIk8` · [13:24] · "these work really well with bag your pants" (caption: baggier). Worked examples: ex.71 (spotless trail shoes as city costume, bad), ex.367 (brown cargos stacking on white Salomons with a lambswool knit, good: Tim's minimal palette).
- **The four:** Frugal and Tim agree; Wanhee and Jaye silent (Jaye only warns gorpcore is "very steep", `Ulx1vjAREu0` [06:42]).
- **Engine today:** has it: the look's own shoe +0.5 [SHO-7]; running shoes 5.0 outside outdoor [SHO-3] and free inside it [OUT-3]; chunky sneakers carry wide jeans +0.5 [STR-6]. Differs: trail shoes aren't read (KD-7), and Tim's good minimal outfit with Salomons (ex.367) would be read as running shoes and fall to Shoes 5.0, and [MIN-2] counts running sneakers against minimal.
- **AI can see it:** weakly (shoe subcategory separates canvas, chunky, running, white leather, boots; trail shoes are not a value; brand language and "pristine" can't be used).
- **Frame:** `inputs/youtube/shots/oZYZ7AC_pZc/f-10-30.jpg` (looked at: matches, a mood board of trail shoes); `inputs/youtube/shots/8rmkOpCbFTM/f-17-41.jpg` (unverified); `inputs/youtube/shots/b1S3XoaRa3k/f-08-52.jpg` (unverified); `inputs/youtube/shots/FFDYIGhiIk8/f-10-52.jpg` (unverified).

#### world.9. Visible effort reads worse: an outfit should look almost accidental. Everything matched head to toe, "glistening", or piled up to be noticed falls apart.
- **Strength:** fault (only for what a photo shows: over-matching and piling on). **Holds when:** shoes, top, hat and socks all match by formula; several attention pieces at once (world.2). **Doesn't:** effortless is built ("the effortlessness is achieved through effort"); a deliberate tonal outfit with a range of shade is not over-matching (color part).
- **Interacts with:** world.2; color (tonal outfits are fine when they range in shade; a flat one-shade match is not); world.1 (one point, not many).
- **Sources:** Wanhee · `mpv9WWHDZio` · [00:36] · "the more you look like you've tried to look good"; Wanhee · `uBsIrt-zU0I` · [09:05] · "look like it was almost an accident"; Wanhee · `uBsIrt-zU0I` · [13:22] · "you will look try hard and the whole outfit will fall apart"; Frugal · `Jh8dz-KZcfY` · [04:50] · "like you're trying too hard"; Frugal · `ove4zof6W2k` · [06:00] · "the effortlessness is achieved through effort"; Frugal · `FPHnmY5FTaI` · [02:09] · "supposed to look like you're not trying"; Tim · `0ilmLux6mPg` · [02:11] · "Their clothes don't feel like a performance."; Tim · `-e9Is50-fn0` · [10:25] · "pieces that don't try too hard but still make a subtle statement"; Jaye · `UcLBvcmnnus` · [17:11] · "they never tried to look better than everybody else". Worked examples: ex.6, ex.7 (head-to-toe one-color and shoe-matched-to-jacket outfits, "formulaic"), ex.115 (Dunks matched to the hat, mocked).
- **The four:** Wanhee, Frugal, Tim agree; Jaye differs in 2025 (`7K2qRZaXX3w` · [02:38] · "whenever you think you're being extra you're probably not even doing enough") and agrees in 2026 (`UcLBvcmnnus` [17:11]); the newer view stands.
- **Engine today:** lacks it: a flat one-family outfit is a tip only [COL-7]; a shoe that picks up the top's color is a +0.5 reward [COL-5], which is the formula Frugal mocks when everything repeats it. Too many statements is charged [STY-6].
- **AI can see it:** weakly (color_family shows repeated colors; socks and the hat are not read; "formula" vs "tie-in" needs a count of how many pieces share the color).
- **Frame:** `inputs/youtube/shots/FPHnmY5FTaI/f-02-14.jpg` (unverified); `inputs/youtube/shots/ove4zof6W2k/f-05-00.jpg` (unverified).

#### world.10. Simple is not basic. Plain basics that fit are a sound floor, never a fault; done with intent they are good; with nothing chosen they are forgettable.
- **Strength:** nuance (sets the 7 floor and the okay ceiling). **Holds when:** the tee-and-jeans or capsule outfit fits. **Doesn't:** "basic" becomes a fault only through "shortcomings" (poor fit, nothing chosen), which other parts charge.
- **Interacts with:** world.11 (what makes simple deliberate); the ladder (ladder.1).
- **Sources:** Frugal · `5gKnDwVm_Eg` · [03:43] · "being degraded as basic is intent"; Frugal · `2QZhiKgPceA` · [03:44] · "something has to be basic if we're going to have cool"; Frugal · `ASQGKf8ve5g` · [01:06] · "Just something so inoffensive that it becomes derogatory."; Frugal · `LkN3yI1-TB4` · [10:22] · "you can totally look good and not dress up"; Frugal · `EWD0eRHHXgk` · [01:10] · "It's bulletproof, though, like there's nothing bad about it."; Frugal · `zAeLpbxDmEo` · [04:44] · "your top 40 radio hits of clothes"; Tim · `OqoUgLxknJc` · [07:36] · "a very solid base on top of which you can"; Jaye · `UcLBvcmnnus` · [04:25] · "looking good isn't the same as having style"; Wanhee · `ew3gCk1zkso` · [01:02] · "Timeless pieces that do 80 of the work"; Wanhee · `kAaM_zcxh_U` · [04:19] · "neutral colors, simple, timeless pieces". Worked examples: ex.68 (black tee, blue jeans, white sneakers, "NPC", he calls the label "quite harsh"), ex.151 (the capsule, okay), ex.194 (off-white tee, light 501s, Chuck 70s, good "classic simple").
- **The four:** all agree.
- **Engine today:** has it: every part starts at 7 and a plain tee, dark straight jeans and white leather sneakers is 7.0 [SCO-1]; no charge for reading as no look [GEN-1]; [STY-12] +0.5 when plain pieces go together.
- **AI can see it:** yes (category, subcategory, color_family; fit through the fit fields).
- **Frame:** `inputs/youtube/shots/ASQGKf8ve5g/f-01-11.jpg` (looked at: matches in part, a black tee and blue jeans, shoes out of view); `inputs/youtube/shots/OqoUgLxknJc/f-07-41.jpg` (looked at: matches the lower half, light straight jeans with a raw hem over black Converse); `inputs/youtube/shots/5gKnDwVm_Eg/f-04-21.jpg` (unverified); `inputs/youtube/shots/LkN3yI1-TB4/f-11-00.jpg` (unverified).

#### world.11. What makes a simple outfit deliberate is one small, chosen move and nuance in cut, color and texture: a cuff, a tuck, a layer that peeks, the right shade, a subtle design detail, a basic "in quotes".
- **Strength:** lift. **Holds when:** the base already fits; the move is small and reads chosen. **Doesn't:** "if done properly", Frugal stresses twice; a move that piles on becomes world.2.
- **Interacts with:** proportion (the tuck and short-top credits are this rule's visible half); color (a quiet accent, a tie-in); layering-texture (texture is unread).
- **Sources:** Frugal · `5gKnDwVm_Eg` · [01:01] · "getting small things to go a long way if done properly"; Frugal · `UidnEGXwZRk` · [07:00] · "the magic of styling comes in nuance"; Frugal · `UidnEGXwZRk` · [08:02] · "separates the idea of crushingly mediocre from Tastefully effective"; Frugal · `bp1cUvVaRZc` · [09:13] · "it's very just basic pieces in quotes"; Frugal · `k9KCaUA1S08` · [04:52] · "there's a lot of magic in the small details"; Frugal · `JY_zrt43cbU` · [08:51] · "will always be honored if done tastefully"; Tim · `SNjfZ5NKndc` · [01:31] · "built on strong basics, but with one or two subtle deviations"; Tim · `OqoUgLxknJc` · [07:36] (ex.194: a cuff "would add a little more"); Wanhee · `ew3gCk1zkso` · [08:03] · "add like a cheeky red hat or a cheeky whatever"; Jaye · `Ulx1vjAREu0` · [09:45] · "the fit of them, the proportions of them, the clean cuts" (Oct notes). Worked examples: ex.167 (two plain jumpers, one "oddly a little bit better" for color and detail), ex.21 (the same simple format tucked, as a tank, with a light jacket, good).
- **The four:** all agree.
- **Engine today:** has it differently: only the visible moves pay: the tuck and waist break [PRO-4], [PRO-5], a short jacket [PRO-6], a quiet accent [COL-5], a layer echoing the pants [COL-13]. The cuff, the peek as a lift (a peek is only allowed, [PRO-9]), shade and texture don't (KD-6).
- **AI can see it:** weakly (tucked and sleeve fields yes; hem cuffed reads poorly; light vs dark value and fabric not read).
- **Frame:** `inputs/youtube/shots/bp1cUvVaRZc/f-09-18.jpg` (unverified); `inputs/youtube/shots/k9KCaUA1S08/f-05-10.jpg` (unverified).

#### world.12. Showing off reads badly: big designer logos worn to be seen, one brand head to toe, or a whole runway look copied onto one person reads as a flex or a costume.
- **Strength:** fault. **Holds when:** logos are big and the point of the outfit; every piece comes from one brand or one runway look; inside quiet worlds any loud branding breaks the look. **Doesn't:** a logo is not wrong by itself (Frugal: loud and hidden bragging are "equally as annoying"); streetwear owns the big-logo hoodie ([COL-8] exempts it); a whole look from one *world* is fine (world.3), only one *brand* is the fault.
- **Interacts with:** world.2; quiet luxury and minimal (logos break them); occasion (a big logo at an interview, [OCC-5]).
- **Sources:** Wanhee · `ew3gCk1zkso` · [17:11] · "look at my designer logo"; Wanhee · `RtxJqd5Drps` · [11:22] · "you want to wear it like slippers"; Wanhee · `mpv9WWHDZio` · [03:21] · "they're conscious, but it looks bad."; Tim · `jaOSdGqtgYY` · [00:34] · "it's the opposite of obvious logos and branding"; Tim · `dk1efCZqwos` · [08:45] · "Better fabric, better fit, better drape, without any logos"; Jaye · `CI-wkEOHRAg` · [13:17] · "all in one is is never good" (Oct notes); Frugal · `2gSj7T37RkQ` · [06:32] · "as opposed to just being forced to conform to a brand uniform"; Frugal · `4DHGKfe-Vho` · [08:21] · "when the outfit's rather ambitious"; Frugal · `TUYSTimnDJg` · [11:26] · "Both equally as annoying, but in the exact opposite ways." Worked examples: ex.402 (footballers in big flashy designer items, "incompetent"), ex.290 (logo polos as a flex), ex.357 (logo top, logo bottom, logo hat, bad).
- **The four:** all agree on show-off logos and one brand head to toe; Frugal alone faults hidden bragging too.
- **Engine today:** has it in part: a tee whose print is a large logo −1.5 [COL-8] (free on a hoodie or sweatshirt); a big logo rules out minimal [MIN-3], workwear counts it against [WRK-2], interview held to 6.5 [OCC-5]. Lacks one brand head to toe and the copied runway look.
- **AI can see it:** weakly (the logo field reads size; brand is read only from visible logo text; a runway look can't be identified).
- **Frame:** `inputs/youtube/shots/4DHGKfe-Vho/f-14-28.jpg` (unverified); `inputs/youtube/shots/2gSj7T37RkQ/f-06-37.jpg` (unverified); `inputs/youtube/shots/RtxJqd5Drps/f-11-27.jpg` (unverified).

#### world.13. No world is wrong in itself: judge an outfit inside its own world, not against a trend, an age or another world. Mixing worlds properly is allowed, and a rule broken on purpose isn't a fault.
- **Strength:** nuance. **Holds when:** always; the app should never charge for not being the current meta, for a popular piece, for an era look, or for a personal exclusion (Tim never wears navy). **Doesn't:** "properly" is the limit (world.3); a smart/casual cross is world.5.
- **Interacts with:** world.3, world.5; the eight looks below.
- **Sources:** Frugal · `TUYSTimnDJg` · [12:57] · "no true style meta, no singular style that defines what it is"; Frugal · `KCzadANGaI0` · [04:27] · "was never about the brand, never about the shoe"; Frugal · `hk4KWJiETTw` · [06:55] · "in time your opinions will change"; Tim · `vQd36IKIkOg` · [04:28] · "even graphic TE's can be pulled off in a tasteful way"; Tim · `vQd36IKIkOg` · [11:06] · "break them intentionally and tastefully"; Tim · `0ilmLux6mPg` · [12:07] · "I choose not to wear the color navy"; Jaye · `Ulx1vjAREu0` · [15:52] · "this isn't like a choose a Power Ranger type thing" (Oct notes); Wanhee · `RtxJqd5Drps` · [00:33] · "There's not necessarily a right or wrong proportion".
- **The four:** all agree.
- **Engine today:** has it: his picks never move a number [SCO-4]; no charge for no look [GEN-1]; worlds the app doesn't name fall back to the shared rules.
- **AI can see it:** yes (nothing extra is needed: it is a rule about what not to charge).
- **Frame:** `inputs/youtube/shots/TUYSTimnDJg/f-13-02.jpg` (unverified).

#### world.14. Accessories scale with the clothes: a minimal outfit takes one or two quiet pieces, a loud one can take more; none at all is a missed step for Jaye and Tim; thin and subtle beats chunky.
- **Strength:** nuance (the app never scores accessories). **Holds when:** the creators judge in person. **Doesn't:** in the app (accessories never count, and anything on the head is hidden).
- **Interacts with:** world.1 (an accessory is often the point: a bag, a ring, a cap); world.12 (a loud designer accessory is a flex).
- **Sources:** Tim · `0JtnbgtbQfE` · [05:29] · "the balance just wouldn't be right"; Tim · `-e9Is50-fn0` · [04:57] · "the less is more motto really applies well to"; Tim · `zJ5LCenTcf8` · [02:13] · "most of all never accessorize" (satire); Jaye · `7K2qRZaXX3w` · [07:25] · "the accessories is damn near is the icing on the cake"; Wanhee · `RtxJqd5Drps` · [10:19] · "Wear it like slippers"; guest in Tim · `UNkA9HhbjXY` · [16:58] · "it just changes the whole look brings it together nicely".
- **The four:** Tim, Jaye agree on "some"; Wanhee and Frugal (take one thing off, Oct notes) lean to fewer. No one says accessories should be louder than the clothes.
- **Engine today:** lacks it by design [SCO-6], KD-14.
- **AI can see it:** no (accessories aren't read and never count; head pieces are blurred out).
- **Frame:** `inputs/youtube/shots/0JtnbgtbQfE/f-05-34.jpg` (unverified).

### The app's eight looks, in the creators' words

Each look below is a world definition (strength: nuance). "Defined by" lists what the creators name; "done badly" is their failure case. The engine's seven looks have rules in `v5-styles.md`; the eighth, tailored, has no look of its own (a matching suit gets [STY-1]/[STY-2] and [PRO-7]).

#### world.15. Streetwear: sneakers, graphic tees and oversized proportions, now blended with layering, premium materials and accessories; bold pieces and bold color allowed; very baggy, even dragging jeans can be right. Done badly it is patchwork.
- **Strength:** nuance (a world definition). **Holds when:** volume is on purpose (a roomy top over loose legs, chunky or basketball sneakers). **Doesn't:** the patchwork version (world.2); a graphic tee or distressed hoodie leaving the casual end (world.7); the "TikTok fit" is streetwear done correctly with "no character" (okay, not bad).
- **Interacts with:** proportion (oversized is part of the definition); world.2; world.12 (logos are its own pieces).
- **Sources:** Frugal · `EnLlL2XKRCA` · [02:42] · "like sneakers, graphic TE's, and oversized proportions"; Frugal · `2QZhiKgPceA` · [03:10] · "what does this fit even say about you"; Frugal · `FFDYIGhiIk8` · [13:24] · "these work really well with bag your pants"; Tim · `uGregWdLahU` · [01:36] · "dominated the street wear scenes" (the Air Force 1); Tim · `YGm7JMniGVc` · [01:10] · "a more streetwear outfit with some loose Denim and sneakers"; Tim · `o5RnTT2oafg` · [03:19] · "you have to stick to the more casual end of the spectrum"; Tim · `_6-4CHHXg3c` · [08:40] · "I would definitely only wear this with a very casual outfit" (distressed hoodie); Jaye · `Ulx1vjAREu0` · [03:04] · "mixing and matching bold colors, bold things" (Oct notes); Wanhee · `RtxJqd5Drps` · [00:33] · "There's not necessarily a right or wrong proportion"; Wanhee · `ew3gCk1zkso` · [02:06] · "then you just look like some Patchwork". Worked example: ex.94 (TikTok fits, "nothing wrong", okay).
- **The four:** all agree on the pieces; Wanhee personally dislikes the super-cropped boxy "influencer" tee (Oct notes, his lane only).
- **Engine today:** has it: [STR-1]–[STR-14]; bold color cost halved [STR-8], one more statement allowed [STR-10], big logo on a hoodie free [COL-8]. Differs: a boxy hoodie read as regular earns no shape (KD-1); accessories and "premium materials" unseen (KD-14).
- **AI can see it:** yes (subcategory, volume, leg_shape, shoe subcategory, logo), weakly for volume 4–5.
- **Frame:** `inputs/youtube/shots/EnLlL2XKRCA/f-02-47.jpg` (unverified).

#### world.16. Minimal: making the most with less: a tasteful neutral palette, good piece pairing, an eye for proportion, quality and nuance; quiet luxury and stealth wealth are the same look made unbranded and finer ("minimal, elevated and comfortable" is Tim's own world).
- **Strength:** nuance (a world definition), and the base the creators praise most. **Holds when:** neutrals, few pieces, clean cuts, no visible branding; Tim's versions include a grey hoodie with black trousers and white sneakers (Scandi), a mock neck under an overshirt, cargos stacking on white Salomons with a knit. **Doesn't:** done as a formula it tops out (ladder.4); a cheap copy of the quiet look "just look[s] like fast fashion" (ex.100).
- **Interacts with:** color (palette first), proportion (Wanhee's city boy is "based on silhouette"), world.12 (logos break it), ladder.4.
- **Sources:** Frugal · `JY_zrt43cbU` · [08:51] · "will always be honored if done tastefully"; Frugal · `JY_zrt43cbU` · [09:58] · "An eye for proportion and pallet."; Frugal · `EnLlL2XKRCA` · [04:20] · "Good piece selection, very nuanced, very tasteful."; Frugal · `EnLlL2XKRCA` · [11:12] · "this is just minimalism with a cheeky little inside joke"; Frugal · `3RdxtHvsuxk` · [03:57] · "very subtle, unbranded, minimalist cuts and designs"; Tim · `63Fam1rwvk4` · [03:17] · "minimal elevated and comfortable"; Tim · `jaOSdGqtgYY` · [00:34] · "it's neutral colors smart tailoring clean cut lines and Elite craftsmanship"; Tim · `vQ6_okzfNSs` · [00:32] · "for a scandi minimalist approved outfits"; Wanhee · `B9PIhkSQKuw` · [03:43] "city boy" (minimal, silhouette-led); Wanhee · `kAaM_zcxh_U` · [04:19] · "neutral colors, simple, timeless pieces"; Jaye · `Ulx1vjAREu0` · [09:45] · "the fit of them, the proportions of them, the clean cuts" (sleek minimalism, Oct notes). Worked examples: ex.366 (grey trousers, grey knit, white sneakers, "classy muted cozy", good), ex.367, ex.389 (grey baggy jeans, grey hoodie, white tee peeking, good tonal).
- **The four:** all agree; Frugal alone caps it below great (ladder.4).
- **Engine today:** has it differently: [MIN-1]–[MIN-8] palette first, as the creators do. Differs: a hoodie is not a minimal piece, so Tim's Scandi outfit (grey hoodie, black trousers, white sneakers) reads as no look; running or trail sneakers count against minimal [MIN-2], so Tim's Salomon outfit fails it; tonal depth earns nothing (KD-6).
- **AI can see it:** yes for palette and pieces (color_family, subcategory, logo); no for quality, drape and shade.
- **Frame:** `inputs/youtube/shots/vQ6_okzfNSs/f-00-37.jpg` (unverified); `inputs/youtube/shots/XIYvycsZxDk/f-01-12.jpg` (unverified).

#### world.17. Workwear: wider than the chore coat and carpenter pants: plain jeans are workwear; the chore jacket layers well; military surplus (bomber, cargos, thermals, combat boots) is its "sister"; Tim admires workwear, military and Americana basics rebuilt with better fabric, fit and drape and no logos.
- **Strength:** nuance (a world definition). **Holds when:** function-born pieces (chore or work jacket, jeans, carpenter details, boots, cargos, corduroy) with plain tops. **Doesn't:** Frugal warns the world gets "mistakenly minimized" to the Carhartt look; plain workwear on famous eclectic dressers reads as a step down (ex.159, okay).
- **Interacts with:** condition (authentic distressing reads as craft, Tim `dk1efCZqwos` [03:15]); world.6 (Tim's utilitarian fleece goes workwear with cargos or cords, smart casual with smart trousers).
- **Sources:** Frugal · `JY_zrt43cbU` · [01:38] · "if you're even wearing just a pair of denim jeans"; Frugal · `JY_zrt43cbU` · [02:44] · "it works very well layered"; Frugal · `JY_zrt43cbU` · [03:15] · "sister to work wear"; Tim · `dk1efCZqwos` · [08:45] · "Better fabric, better fit, better drape, without any logos"; Tim · `vQ6_okzfNSs` · [00:00] · "a good work jacket like this with base chinos" (beige chinos, Chelsea boots); Tim · `FUWET2HH-us` · [01:05] · "it's perfect if you're into a more utilitarian style"; Tim · `_6-4CHHXg3c` · [04:54] · "a slight workware feel to your outfit" (carpenter jeans with plain tops, ex.337); Tim · `63Fam1rwvk4` names "the rugged utilitarian" world. Wanhee and Jaye only list workwear as history worth knowing (Oct notes).
- **The four:** Frugal and Tim agree; Wanhee and Jaye silent.
- **Engine today:** has it differently: [WRK-1]–[WRK-10]. Differs: Tim's work jacket with beige chinos and Chelsea boots earns no workwear shape ([WRK-4] needs jeans or cargos), and chinos aren't a workwear piece; military surplus has no look (the bomber reads streetwear); jeans are only a home piece, so no top to toe (KD-4).
- **AI can see it:** yes for chore coat, jeans, cargos, boots; no for carpenter details, corduroy, raw denim or fabric.
- **Frame:** `inputs/youtube/shots/JY_zrt43cbU/f-01-42.jpg` (unverified); `inputs/youtube/shots/vQ6_okzfNSs/f-00-05.jpg` (unverified).

#### world.18. Vintage sport: the creators' version is 2000s sportswear and its design language (Oakley, West Coast sportswear graphic tees), varsity and letterman jackets, retro runners, track pieces and hybrid trainers, not mainly the jersey.
- **Strength:** nuance (a world definition; thin evidence). **Holds when:** one sport piece on a plain base (a letterman over plain pieces, retro runners with sweats, a varsity jacket against elegant trousers). **Doesn't:** Frugal's own Chargers jersey he files as belonging, not style (ex.27, not judged).
- **Interacts with:** world.1 (the varsity or letterman jacket is the creators' favorite statement); world.5 (varsity with Issey pleats).
- **Sources:** Frugal · `JY_zrt43cbU` · [13:30] · "Oakley's design language from the 2000s is like perpetually referenced"; Frugal · `env4ZvWzcd4` · [10:05] · "I'm a big fan of 2000's West Coast sportsware" (ex.31, his favorites); Frugal · `RlcdMBj5Z2E` · [07:30] · "varsity jacket you know these always naturally come with some cool"; Frugal · `8rmkOpCbFTM` · [17:36] · "they work well in both contexts" (hybrid trainers); Tim · `_6-4CHHXg3c` · [01:39] · "a go-to casual shoe with a pair of sweats"; Tim · `uGregWdLahU` · [01:36] · "from casual wear to sporty Chic"; Tim · `vziGl_FxQb0` · [02:45] · "the comfort of a jogger, but with a sharper silhouette"; Jaye · `Ulx1vjAREu0` · [13:18] sports luxury: sleek sneakers, "track jackets, designer t-shirts" (Oct notes); Jaye · `Ulx1vjAREu0` · [08:13] · "vintage is something that will never go out of fashion" (Oct notes).
- **The four:** Frugal, Tim, Jaye touch it; Wanhee silent. No one gives a failure case beyond the full kit.
- **Engine today:** has it differently: [VSP-1] needs a jersey or rugby hero piece; varsity and letterman jackets, track pieces (unread, [VSP-7]) and sport graphics aren't hero pieces, so the creators' main examples don't read as vintage sport.
- **AI can see it:** weakly (jersey and rugby are read; varsity, letterman and track pieces aren't values; retro sneakers are).
- **Frame:** `inputs/youtube/shots/JY_zrt43cbU/f-13-35.jpg` (unverified); `inputs/youtube/shots/env4ZvWzcd4/f-10-40.jpg` (unverified).

#### world.19. Outdoor (gorpcore, techwear): technical jackets, fleece, cargos and trail shoes, the world with the most "aesthetically accurate" shoes; worn for a real purpose it is timeless, worn as a city costume it is a trend, but it can still look great.
- **Strength:** nuance (a world definition). **Holds when:** the technical pieces go together (fleece or shell, cargos, trail or activewear sneakers), or one technical piece contrasts plain denim. **Doesn't:** Jaye calls it "very steep" for beginners; the costume charge is about the person, not scorable.
- **Interacts with:** world.8 (its shoes); world.6 (a fleece goes outdoor or smart casual by its partners); Tim's tailoring crossed with outdoor (a mock neck under a blazer and parka with hiking shoes, ex.281, good).
- **Sources:** Frugal · `oZYZ7AC_pZc` · [10:25] · "best and widest selections of aesthetically accurate shoes"; Frugal · `JY_zrt43cbU` · [13:30] · "then getting dressed for the part. That's timeless."; Frugal · `b1S3XoaRa3k` · [08:17] · "trail shoes in a coffee shop where they do latte art"; Frugal · `njD_txmWPt4` · [08:03] Acronym as the best-constructed technical clothing (ex.117); Tim · `30L-EHe4WAQ` · [02:08] · "people who have never hiked in their life wearing hiking shoes"; Tim · `uGregWdLahU` · [05:27] · "in contrast with the more standard Men's Wear Staples like denim"; Jaye · `Ulx1vjAREu0` · [06:42] · "Gorcore is a very steep steep steep style" (Oct notes).
- **The four:** Frugal, Tim, Jaye agree it's a real world; Wanhee silent.
- **Engine today:** has it: [OUT-1]–[OUT-7]; no path to 8 because trail shoes aren't read (KD-7).
- **AI can see it:** weakly (shell, rain jacket, fleece, cargos read; trail shoes, vests and technical pants don't).
- **Frame:** `inputs/youtube/shots/oZYZ7AC_pZc/f-10-30.jpg` (looked at: matches, trail shoes mood board); `inputs/youtube/shots/30L-EHe4WAQ/f-02-13.jpg` (unverified).

#### world.20. Classic prep: the four barely define it. Tim names the Ivy League look and 80s pastel preppy as history, Frugal lists "Ivy Prep" among today's live worlds, Jaye files it under "old money"; the only styling notes are polos under crisp tailoring and Fair Isle or Aran knits as menswear classics.
- **Strength:** nuance (no rules to take). **Holds when:** n/a. **Doesn't:** n/a.
- **Interacts with:** minimal and quiet luxury (Tim's polos with tailoring, `jaOSdGqtgYY` [06:59]); smart casual.
- **Sources:** Tim · `jaOSdGqtgYY` · [02:40] · "the ivy league look in the 50s pastel preppy"; Frugal · `TUYSTimnDJg` · [13:28] · "Ivy Prep making a comeback somehow"; Jaye · `Ulx1vjAREu0` · [00:00] · "quiet luxury or old money" (Oct notes); Tim · `uGregWdLahU` · [01:05] lists "preppy" among styles a white Chuck suits; Tim · `TxQUqvHXyJA` · [05:20] Fair Isle and Aran knits as menswear history.
- **The four:** silent beyond naming it. Nothing in the engine's prep rules is contradicted.
- **Engine today:** has it: [PRP-1]–[PRP-5], from the earlier style council, not from the four.
- **AI can see it:** yes (oxford, polo, cardigan, rugby, blazer, chinos, loafers are values).
- **Frame:** none (described only).

#### world.21. Smart casual: one traditionally smart piece with one traditionally casual piece, leaning smarter when unsure (Tim's definition); Frugal's smart streetwear (a minimal, classic base with one street accent), Jaye's business core (dress shirt and tie with jeans and a leather jacket) and Wanhee's wit are the same move.
- **Strength:** nuance (a world definition), and world.5 is its lift. **Holds when:** Tim's on-screen list: smart trousers, tank and blazer; tee, cardigan and pleated trousers; jeans and blazer; shirt and tie with a leather jacket; crew-neck knit, trousers and loafers; a wider two-piece suit with a tee or tank. **Doesn't:** a graphic tee with tailoring (world.7); three tiers at once.
- **Interacts with:** world.5, world.6, occasion.
- **Sources:** Tim · `vQd36IKIkOg` · [07:14] · "pairing a traditionally smarter piece like a blazer with a traditionally casual"; Tim · `vQd36IKIkOg` · [08:18] · "preferably leaning towards the smarter side"; Tim · `FUWET2HH-us` · [01:05] · "a more minimal smart casual outfit like Victor is pulling off"; Tim · `vQ6_okzfNSs` · [04:16] · "the two-piece suits no longer needs to be a slim fit"; Frugal · `EnLlL2XKRCA` · [03:47] · "pieces like button-down shirts, trousers, and even loafers"; Frugal · `FPHnmY5FTaI` · [02:09] · "like that smart street wear thing going on"; Jaye · `Ulx1vjAREu0` · [05:37] · "it's like street wear and business together" (Oct notes); Wanhee · `tNVdA_arEa8` · [01:36] · "a playful reinterpretation" (Oct notes).
- **The four:** all agree.
- **Engine today:** has it differently: [SMC-1] defines smart casual as a set of mid-dressy pieces (polo, oxford, knit, overshirt, chinos, loafers, white leather sneakers) and rules out hoodies, flannels, cargos and graphic tees [SMC-2]; the creators define it as a cross between two tiers. Tim's tank under a blazer and Jaye's business core pass without charge but earn no lift; Tim's blazer with light jeans costs −1.5 [STY-3].
- **AI can see it:** yes (category and subcategory set each piece's tier).
- **Frame:** `inputs/youtube/shots/vQd36IKIkOg/f-07-51.jpg` (unverified); `inputs/youtube/shots/EnLlL2XKRCA/f-03-52.jpg` (unverified).

#### world.22. Tailored: the four's tailoring is relaxed and modern: a suit no longer has to be slim (slightly oversized, boxy double-breasted, wider legs), worn casually (no tie, a tee, tank, polo or turtleneck, even sneakers); a structured tailored coat lifts any outfit; Wanhee's formal proportion is one-third top, two-thirds legs.
- **Strength:** nuance (a world definition; the fit rules live in the suits part). **Holds when:** the tailoring is clean and the dress-down is one step (world.5). **Doesn't:** black tie stays slim and by the rules (Tim's guest, `OqoUgLxknJc` [12:55]); a strict corporate office.
- **Interacts with:** world.5; proportion (one-third/two-thirds, high rise); the suits part (outsiders fill the fit gap).
- **Sources:** Tim · `vQ6_okzfNSs` · [04:16] · "the two-piece suits no longer needs to be a slim fit"; Tim · `OqoUgLxknJc` · [02:48] · "a silhouette that I've been enjoying experimenting with"; Tim · `vziGl_FxQb0` · [07:02] · "a more modern take on tailoring"; Tim · `jaOSdGqtgYY` · [06:59] · "crisp tailoring especially when worn casually without a tie"; Tim · `XIYvycsZxDk` · [02:17] · "the more structured tailored coat elevates the whole outfit"; Tim · `OqoUgLxknJc` · [12:24] · "sneakers to make it it's a bit a bit more casual"; Wanhee · `RtxJqd5Drps` · [01:40] · "Top 1/3, 2/3 at the bottom."; Jaye · `5Dfr0PXTTpM` · [08:42] · "it's really all based on your tailoring" (Oct notes); Frugal · `JY_zrt43cbU` · [10:35] · "truly the gateway piece" (good trousers). Worked examples: ex.330 (boxy double-breasted suit, good), ex.370 (black textured suit with a thermal and a long coat, good), ex.378 (broad-shouldered jacket over pleated balloon trousers, great).
- **The four:** Tim leads; Wanhee and Jaye agree; Frugal only on trousers.
- **Engine today:** has it differently: no tailored look; a matching suit gets +0.5 [STY-1] and top to toe [STY-2], a blazer over a tucked shirt with trousers +1.0 [PRO-7]; sneakers under a blazer only cost at an interview [OCC-4], but chunky sneakers under a blazer −2.0 [SHO-8].
- **AI can see it:** yes (blazer, suit jacket, suit trousers, tucked); weakly (slim vs relaxed suit cut, shoulder).
- **Frame:** `inputs/youtube/shots/vQ6_okzfNSs/f-04-21.jpg` (unverified).

#### world.23. Worlds the app doesn't name (all-black darkwear and opium, avant-garde, Y2K, indie sleaze, earth tones, surfer, Americana, designer universes) are judged by the shared rules; the creators' only scorable notes on them are that all black is a recognized look, Y2K needs playfulness balanced with structure, and a designer world's loud piece only works inside it.
- **Strength:** nuance. **Holds when:** the outfit reads as none of the eight looks. **Doesn't:** n/a.
- **Interacts with:** world.13 (never charge for no look); world.4 (a designer piece outside its world).
- **Sources:** Tim · `UNkA9HhbjXY` · [11:27] · "I see you guys all rocking the all black look"; Jaye · `Ulx1vjAREu0` · [14:19] · "black will never fail you" (Oct notes); Frugal · `3RdxtHvsuxk` · [08:49] (opium: all black base, more personal without a famous centerpiece); Tim · `dk1efCZqwos` · [04:26] · "the neighborhood went dark, military, and motorcycle inspired"; Jaye · `5Dfr0PXTTpM` · [04:04] · "balancing the playfulness with the structure" (Oct notes); Frugal · `EnLlL2XKRCA` · [08:19] · "it's pink and small" (today's Y2K, no idea behind it). Worked examples: ex.101 (opium base model, "whole lot of mid", okay), ex.102 (top opium fit, great).
- **The four:** no conflict.
- **Engine today:** has it: [GEN-1]–[GEN-3]; all black passes minimal's palette when the pieces fit it.
- **AI can see it:** yes for the shared rules; no for leather, avant cuts or texture.
- **Frame:** none (described only).

---

### Part 2. The ladder (bad / okay / good / great)

**What the examples say first.** The 458 worked examples in `synth/6-examples.md` split good 176, unclear 150, bad 58, great 43, okay 31. Two cautions follow. (1) **Only Frugal uses the whole ladder:** he gives 27 of the 31 "okay" verdicts and 26 of the four's 38 "bad" ones; Tim calls 85 outfits good and 2 okay because he shows outfits he picked or street-styled guests, so his "good" is a weak signal and his "great" (8) is the strong one. (2) **About half of the "great" examples are not outfits:** single pieces (a worn calfskin jacket, a heavy tee, a cashmere knit) or history and fame (YSL at Dior's funeral, the 2009 Paris group, a "Flex" of rare sneakers); these can't anchor 9–9.5. Two rows look mislabeled (ex.401 and ex.437 are bad verdicts marked good). Every frame there is unverified.

#### ladder.1. Okay, their 7: clean basics that fit, nothing wrong and nothing chosen. Never a fault, never great.
- **Strength:** nuance (the anchor). **Holds when:** a tee and jeans, a capsule outfit, safe neutral picks, the TikTok template, fundamentals picked at random. **Doesn't:** once one move is chosen it is good (ladder.2); once something is off it drops (ladder.6).
- **Interacts with:** world.10, world.11.
- **Sources:** Frugal · `EWD0eRHHXgk` · [01:10] · "It's bulletproof, though, like there's nothing bad about it."; Frugal · `ASQGKf8ve5g` · [01:06] · "Just something so inoffensive that it becomes derogatory."; Frugal · `zAeLpbxDmEo` · [04:44] · "your top 40 radio hits of clothes"; Frugal · `3RdxtHvsuxk` · [08:13] · "whole lot of mid"; Tim · `OqoUgLxknJc` · [07:36] · "a very solid base on top of which you can"; Jaye · `UcLBvcmnnus` · [04:25] · "looking good isn't the same as having style"; Jaye · `cwLasFLe-DY` · [01:36] · "Your fit look all right."; Wanhee · `RtxJqd5Drps` · [02:44] · "it's not going to look amazing"; Wanhee · `uBsIrt-zU0I` · [02:52] · "It looks fine. Is it the most fashionable thing? No." Worked examples (okay): ex.68, ex.94, ex.103, ex.106, ex.107, ex.151, ex.170, ex.427.
- **The four:** all agree.
- **Engine today:** has it: every part starts at 7 and the plain tee, dark jeans and white sneakers is 7.0 "Put together" [SCO-1].
- **AI can see it:** yes (it is the absence of faults and credits).
- **Frame:** `inputs/youtube/shots/ASQGKf8ve5g/f-01-11.jpg` (looked at: matches in part, black tee and blue jeans); `inputs/youtube/shots/EWD0eRHHXgk/f-01-15.jpg` (unverified).

#### ladder.2. Good, their 8: the same fitted base with one or two deliberate moves: a chosen shape (a tuck or short top over a fuller leg, thirds), one point, a tonal or proven color combination, a layer, a cuff; it "clicks".
- **Strength:** lift. **Holds when:** the moves are visible and chosen and nothing is off. **Doesn't:** more moves that compete (world.2); competence that is the whole point (Wanhee level 3 "haven't got the X factor") stays good, not great.
- **Interacts with:** proportion (the shape credits), world.1, world.5, world.11.
- **Sources:** Tim · `OqoUgLxknJc` · [07:36] (the base plus a cuff, a jacket, a tuck or a pop, ex.194–208); Tim · `YGm7JMniGVc` · [03:14] · "the tonal white look very clean"; Jaye · `UcLBvcmnnus` · [07:15] · "the fly stage is when everything clicks"; Jaye · `7K2qRZaXX3w` one step above the expectation (a coat, a blazer, flares); Wanhee · `mpv9WWHDZio` · [05:01] · "it looks kind of good" (level 3: proportion, silhouette and color understood); Wanhee · `RtxJqd5Drps` · [01:40] · "Top 1/3, 2/3 at the bottom."; Wanhee · `uBsIrt-zU0I` (proven combinations: shades of blue, black with one pop, navy-khaki-brown, ex.425–428); Frugal · `UidnEGXwZRk` · [08:02] · "separates the idea of crushingly mediocre from Tastefully effective"; Frugal · `Jh8dz-KZcfY` (fundamentals played with: layer lengths, one color pop, texture in the under-layer); Frugal · `5gKnDwVm_Eg` · [03:43] simple = deliberate. Worked examples (good): ex.21, ex.32, ex.194, ex.206, ex.264, ex.282, ex.316, ex.366, ex.389, ex.438.
- **The four:** all agree.
- **Engine today:** has it differently: one shape credit gets a clean outfit to 7.5–8.0 ([PRO-4], [PRO-6], [PRO-14], [STR-5], [WRK-4]); a color point is worth about +0.1 ([COL-11]); the strength bonus is capped at +0.25 [SCO-2]. #464's stacking (one lift up to 8, two to 8.5) matches the creators: two moves is still "good".
- **AI can see it:** yes for shape moves (tucked, length, leg_shape, layers); weakly for color moves; no for cuffs (hem reads poorly) and texture.
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-07-41.jpg` (looked at: the base the moves are added to, light straight jeans over Converse).

#### ladder.3. Great, their 9+: everything good has, plus a little edge, a personal or unexpected pairing, and no visible effort; built around one mood and silhouette; the curation hidden.
- **Strength:** lift (the top of the scale). **Holds when:** a deliberate shape, one point and a whole-outfit mood together, looking almost accidental: Tim's "subtle yet distinctive and intentional", Wanhee's level 4, Frugal's "full look" that is "complex and detailed but... effortless", Jaye's student stage (deeper references, any style). **Doesn't:** when the extra is loud (world.2, world.9); when "great" means fame, history or a single piece (Part 2 caution).
- **Interacts with:** world.1, world.5, world.9, world.11; the season (Frugal's full look is layered, a cool-weather path).
- **Sources:** Tim · `XSF9AOx7sdU` · [02:39] · "dressed appropriately for the occasion but still with a little Edge"; Tim · `XSF9AOx7sdU` · [02:39] · "with class and effortlessness"; Tim · `jaOSdGqtgYY` · [09:44] · "subtle yet distinctive and intentional"; Tim · `-e9Is50-fn0` · [10:25] · "pieces that don't try too hard but still make a subtle statement"; Tim · `0ilmLux6mPg` · [02:11] · "Their clothes don't feel like a performance."; Tim · `YGm7JMniGVc` · [01:10] · "this guy right here is killing it"; Wanhee · `mpv9WWHDZio` · [05:31] · "the state of unconscious competence"; Wanhee · `uBsIrt-zU0I` · [09:05] · "look like it was almost an accident"; Frugal · `Jh8dz-KZcfY` · [07:35] · "look very complex and detailed but at the same time very effortless"; Frugal · `env4ZvWzcd4` · [08:28] · "a shirt that only you could like that much"; Frugal · `5gKnDwVm_Eg` · [10:57] · "you just have to find a reason to be memorable"; Frugal · `2gSj7T37RkQ` · [09:41] · "just pick a good template and then make it your own"; Frugal · `EWD0eRHHXgk` · [10:50] · "I would rather risk looking dumb"; Jaye · `UcLBvcmnnus` · [10:07] · "studying Japanese fashion, archive fashion"; Jaye · `7K2qRZaXX3w` · [04:13] · "you are the best dressed or the best looking". Worked examples (great, outfits only): ex.35 (all black + red bag), ex.42 (one letterman), ex.46 (slim shoe under a full stacking leg, "yin and yang"), ex.183 (odd pieces "really well composed"), ex.318 (monochrome green), ex.319 ("the silhouette of the outfit is on point"), ex.324 (turquoise fleece, black overcoat, cuffed mid jeans, Docs, "the best one yet"), ex.378 (broad jacket over pleated balloon trousers).
- **The four:** all agree on effortless and an edge; they word the edge differently (Tim subtle, Frugal risk, Jaye references, Wanhee nothing visible). Newest views (Wanhee 2026-11, Tim 2026-09, Jaye 2026-05) all stress "not a performance".
- **Engine today:** lacks it: nothing reaches 8.5 today (the dealbreakers sheet's "Stacking" note); #464 plans three lifts in one look for 9 and "a standout" for 9.5.
- **AI can see it:** weakly (the shape, the point and "one look" are readable; edge, mood, references and effortlessness are not, so 9–9.5 has to come from stacked readable lifts with nothing off).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-17-18.jpg` (looked at: Harry's outfit 9, a grey logo sweatshirt, black trousers and Converse, with Tim seated in a black shirt over a white tee, light jeans and black boots; which is "the classiest" isn't clear from the still); `inputs/youtube/shots/RlcdMBj5Z2E/f-04-54.jpg` (looked at: matches ex.42).

#### ladder.4. Safe, neutral, capsule and quiet outfits top out at good: "bulletproof" and "never in the goat conversation" unless something adds an edge.
- **Strength:** nuance (a ceiling, not a fault). **Holds when:** every piece is neutral, timeless and "optimized", nothing irrational or personal. **Doesn't:** Tim praises the best quiet-luxury pieces and outfits as great for their subtle detail (`jaOSdGqtgYY` [09:44]); Frugal himself calls quiet luxury's looks "great" and faults only the intent (`TUYSTimnDJg` [10:56]).
- **Interacts with:** world.16 (minimal), ladder.3 (the edge).
- **Sources:** Frugal · `YFxXWWM5YRI` · [08:34] · "you will never be in the goat conversation"; Frugal · `YFxXWWM5YRI` · [03:14] · "if you're too well-rounded I feel like you lose your Edge"; Frugal · `CsbsHWEBwy0` · [08:27] · "too safe to feel vulnerable, too dull to harm you"; Frugal · `EWD0eRHHXgk` · [01:10] · "It's bulletproof, though, like there's nothing bad about it."; Jaye · `UcLBvcmnnus` · [04:25] · "looking good isn't the same as having style"; Wanhee · `mpv9WWHDZio` · [05:01] · "they haven't got the X factor". Worked examples: ex.103, ex.106, ex.107, ex.151 (all okay).
- **The four:** Frugal and Jaye agree; Wanhee agrees for level 3; Tim differs (subtle quality reads great to him). Rule as written: a quiet outfit can reach 8–8.5 on readable moves; 9+ needs a visible point or pairing, which keeps Tim's best quiet outfits eligible when their detail shows.
- **Engine today:** lacks a ceiling; today nothing passes 8 anyway. Under #464 this is the rule that keeps a plain-but-perfect minimal outfit at 8.5, not 9.
- **AI can see it:** yes (all-neutral palette and no point are readable).
- **Frame:** `inputs/youtube/shots/EWD0eRHHXgk/f-01-15.jpg` (unverified).

#### ladder.5. Trying without understanding looks worse than not trying: copied looks and flashy branded pieces sit below the person in plain clothes.
- **Strength:** fault. **Holds when:** the visible signs of trying (big designer logos, a stack of statement pieces, a copied head-to-toe look). **Doesn't:** the "not trying" level 1 can still have faults of its own.
- **Interacts with:** world.2, world.9, world.12.
- **Sources:** Wanhee · `mpv9WWHDZio` · [00:36] · "ironically, this will make you look better than a lot of people"; Wanhee · `mpv9WWHDZio` · [03:21] · "they're conscious, but it looks bad."; Frugal · `k9KCaUA1S08` · [01:04] · "may construct the illusion of good things"; Frugal · `Jh8dz-KZcfY` · [04:50] · "put too many things on and just look stupid". Worked examples (bad): ex.79, ex.80, ex.154, ex.402.
- **The four:** Wanhee and Frugal say it; Tim's satire agrees (ex.357); Jaye 2025 leans the other way ("overdress"), Jaye 2026 agrees.
- **Engine today:** has it in part: [STY-6], [COL-8] can put a loud pile under a plain 7.0 outfit; stacked designer labels cost nothing.
- **AI can see it:** weakly (as world.2).
- **Frame:** none (described only).

#### ladder.6. Bad: one sinking fault ruins an outfit whatever else is right: pants that fit badly, a stain or crease, the wrong room; several faults or a pile with no direction make it a redo.
- **Strength:** dealbreaker (the creators' own words: "none of this matters", "even the best of outfits"). **Holds when:** as stated; the parts that own each fault (fit, condition, occasion) set the details. **Doesn't:** a single mild fault holds back rather than sinks (6–6.5).
- **Interacts with:** every part; world.3 (no direction).
- **Sources:** Frugal · `WDsQRHa8jBY` · [09:43] · "none of this matters if your pants suck anyways"; Tim · `IUMqpLeCT-E` · [00:33] · "even the best of outfits will instantly look 10 times worse"; Tim · `IUMqpLeCT-E` · [00:00] · "a good outfit in the wrong place can be a bad outfit"; Tim · `XSF9AOx7sdU` · [02:39] · "that's not actually being well-dressed" (wrong formality); Frugal · `Jh8dz-KZcfY` · [03:15] · "your pieces just don't even compute to a cohesive Vision"; Wanhee · `Uw-vpUq8Ewg` · [04:58] (too many of everything makes it "mediocre"). Worked examples (bad): ex.26, ex.355 (skin-tight trousers and a second-skin tee), ex.361 (wrong for the occasion), ex.450 (grey sweatpants on a store run, "regular").
- **The four:** all agree.
- **Engine today:** has it differently: faults subtract and add up to −1.0 [SCO-7]; a stain −1.2 [CON-1]; occasion ceilings [OCC-1]; a 5.0 floor at everyday occasions [SCO-3], which #464 removes. Caps (dealbreakers sheet) are planned, not built.
- **AI can see it:** yes for strain, pooling, stains (when clear), occasion; weakly for hem and strain.
- **Frame:** none (described only).

#### ladder.7. Iconic is beyond clothes: fame, history and the moment make a fit legendary, so no outfit photo earns a 10.
- **Strength:** nuance. **Holds when:** always. **Doesn't:** n/a.
- **Interacts with:** the 9.5 clamp (#464).
- **Sources:** Wanhee · `mpv9WWHDZio` · [09:22] · "not really for you. Not for me."; Frugal · `ieMBSpSiv3E` · [05:31] · "just the implications of this outfit are unparalleled"; Jaye · `UcLBvcmnnus` · [17:11] (legacy: "they never tried to look better than everybody else"). Worked examples: ex.139–ex.145 (great for history and fame, not styling).
- **The four:** Wanhee and Frugal say it; Jaye's legacy stage agrees; Tim silent.
- **Engine today:** has it as planned: 10 is never shown (#464).
- **AI can see it:** n/a.
- **Frame:** none (described only).

#### ladder.8. Kit's words should climb the way the creators' praise climbs, and great must never depend on looking "extra".
- **Strength:** nuance (copy, not points). **Holds when:** writing the card's word and line. Tim's praise rises from "solid picks" and "very clean" (good) to "on point", "killing it", "the best one yet" (great); Frugal separates looking good from looking "fire" and warns the online bar for fire is inflated (`LkN3yI1-TB4` [10:22]). **Doesn't:** the app's band words are already set (#464 for the redo band).
- **Interacts with:** ladder.3, world.9.
- **Sources:** Tim · `YGm7JMniGVc` · [01:10] · "the silhouette of the outfit is on point"; Tim · `YGm7JMniGVc` · [03:14] · "the tonal white look very clean"; Tim · `UNkA9HhbjXY` · [14:11] · "you've definitely mastered that"; Frugal · `LkN3yI1-TB4` · [10:22] · "you can totally look good and not dress up".
- **The four:** Tim and Frugal; others silent.
- **Engine today:** n/a (copy).
- **AI can see it:** n/a.
- **Frame:** none (described only).

### How the ladder maps onto the app's scale (DECISIONS-LOG #464)

| App band (#464 share) | Today's word | The creators' rung | What puts an outfit here, in their terms | Worked examples |
|---|---|---|---|---|
| **9–9.5** (5%) | Dialed in | great, their 9+ | good, plus one edge (a point or pairing you'd notice), one mood, nothing try-hard; 9.5 only with a real standout and nothing off | ex.35, ex.42, ex.46, ex.319, ex.324, ex.378 |
| **8–8.5** (15%) | Sharp | good, their 8 | one deliberate move (8) or two (8.5) on a fitted base; a quiet, perfect outfit tops out here (ladder.4) | ex.21, ex.194, ex.264, ex.282, ex.366, ex.389 |
| **7–7.5** (30%) | Put together | okay, their 7 | clean basics that fit, nothing chosen (7); one small right thing, like a quiet accent or a sound shape (7.5) | ex.68, ex.94, ex.151, ex.170, ex.427 |
| **6–6.5** (30%) | Getting there | below okay: "all right", "mid", "mediocre" | one fault that holds it back (a holding row), or basics with something off; a pile of okay pieces | ex.148 ("these jeans are mid"), ex.415 ("doesn't look that bad"), ex.225 |
| **5–5.5** (15%) | Needs a fix | bad, one fault | one sinking fault the creators say ruins the outfit: pants that fit badly, a stain, the wrong room, a loud pile, show-off logos | ex.26, ex.355, ex.357, ex.361, ex.450 |
| **3–4.5** (5%) | the new redo word | bad, everything at once | two or more sinking faults, or no direction at all (world.3) on top of a fault: Wanhee's level 2, Tim's satire, Frugal's "nothing burger" | ex.79, ex.80, ex.154, ex.402 |

Notes on the mapping:
- **Their 7 is the app's 7.0 exactly** (ladder.1). The creators' "okay" sits above the app's 6–6.5; they rarely name an in-between, so 6–6.5 is built from the app's holding faults, not from a creator rung.
- **Their "bad" spans three app bands.** The creators don't grade bad; the split by number of faults is the app's, and matches #464's stacking (one dealbreaker caps the score; several make it a redo).
- **The examples are thinner at the ends than the 5% / 15% / 5% shares suggest:** about 20 outfit-level greats and 38 bads from the four, many described only. Before any example anchors a band, its still has to be looked at (only 9 were here).
- **What the app can read decides how high it can go.** Great's ingredients that a photo shows (shape, one point, one look, nothing off) are readable; the rest (fabric, drape, edge, effortlessness) isn't, so 9 must come from three readable lifts in one look and 9.5 from a standout, exactly as #464 plans. Expect the app to under-score some outfits the creators call great for fabric or detail alone; that is honest, not a bug.

---

### Not scorable from a photo
- Intent and authenticity: whether a style is "you" or a costume (Frugal `EnLlL2XKRCA` [00:31], `JY_zrt43cbU` [13:30]; Tim `vQd36IKIkOg` [09:26]; Wanhee `mpv9WWHDZio` [05:31]).
- Whether an outfit is a template copied whole or "made your own" (Frugal `2gSj7T37RkQ` [02:07], `2QZhiKgPceA` [03:10]; Tim `zJ5LCenTcf8` [01:10]).
- A hype item's personal meaning (Labubu, the Supreme hat; Frugal `EnLlL2XKRCA` [02:42]).
- Price, real vs fake, and brand prestige (Tim `jaOSdGqtgYY` [08:03]; Jaye `7K2qRZaXX3w` [05:50], `cwLasFLe-DY` [22:31]).
- Popularity, overexposure and "meta" pieces (Frugal `KCzadANGaI0` [04:27], `bDcAzeTM4PA` [06:36]; Jaye `UcLBvcmnnus` [06:03]).
- A personal uniform, repeating outfits, a signature over time (Frugal `3RdxtHvsuxk` [11:04], `bDcAzeTM4PA` [01:11]; Tim `0ilmLux6mPg` [12:40]; Wanhee `uBsIrt-zU0I` [06:14]; Jaye `7K2qRZaXX3w` [06:53]).
- Wardrobe-level cohesion and capsule building (Tim `63Fam1rwvk4` [02:09]; Frugal `YFxXWWM5YRI` [09:40], `bDcAzeTM4PA` [10:55]).
- Taste as a reference index; knowing vs doing (Frugal `zAeLpbxDmEo` [07:23], [10:38]).
- Effort and experimenting as such (Frugal `YFxXWWM5YRI` [12:52]).
- Trend forecasts and "out" lists (Y2K, nonchalance, Prada sunglasses; Frugal `EnLlL2XKRCA` [14:01], `bDcAzeTM4PA` [08:13]).
- Iconic fit pics made by history or fame (Frugal `ieMBSpSiv3E`; Wanhee `mpv9WWHDZio` [09:22]).
- A fit that provokes a strong reaction (Frugal `k9KCaUA1S08` [06:31]).
- Kit's tone: don't make him justify his taste (Frugal `bDcAzeTM4PA` [09:49], `WGUih-S8HHY` [13:55]).
- Accessories, which the app never counts (world.14).


*(This part's notes for the dealbreakers sheet are in the "Creators say (T95)" column of `rubric/research/dealbreakers.md`.)*

---

## 5. Interactions: how the parts change each other
Synthesized Nov 14, 2026 for T95 from `by-part/interactions.md` (453 lines from 16 reader notes), cross-referenced to the rule ids in `synth/1-shape.md` (sil, prop, fit, suit), `synth/2-color.md` (color, contrast, pattern) and `synth/3-layers-shoes-season.md` (layer, shoe, cond, season). Every quote was checked word for word against `inputs/youtube/clean/<id>.txt` (12 words or fewer; caption tags such as "[music]" dropped). Clothes only: where a creator talks about bodies, the point is restated as where hems, waistbands and widths sit, or left out. Frames: "matching" or "partly" means the still was opened and looked at; "(unverified)" means it wasn't.

**In plain words: what moves a score most.**
1. **The trousers and the shoes decide whether anything else counts** (ix.10). All four say a bad hem on the shoe, or pants that are off, sink an outfit whose top half is great; no jacket or loud shoe buys it back (ix.17).
2. **Shape outranks color in both directions** (ix.1, ix.2). A palette they like fails on a bad fit; a risky color pair, the founder's red shirt over somewhat baggy blue pants, passes when the proportions are good, one color is muted or dark, and the rest is calm.
3. **In one color, the shape is the whole outfit** (ix.3). All black or tonal makes a good outline look better and a bad one worse, and it needs texture or a shade change to avoid looking flat (ix.31).
4. **The shoe's bulk sets the leg** (ix.11): chunky shoes want generous or cinched legs, boots want flares or baggy legs, slim shoes want a full, long leg over them; the same pairing also moves the right hem height (ix.13) and whether a stack reads current or dated (ix.12).
5. **What surrounds a color decides it** (ix.4, ix.5): one accent works because the rest is quiet; dark pieces around or over a bright piece "tone it down"; a second matching accent or a third loud thing reads try-hard (ix.23).
6. **Style world flips the verdict on the same piece** (ix.24, ix.25, ix.29): an ugly technical shoe drags a plain neutral outfit and shines in one built for it; wear is character on denim and leather in casual worlds and a fault in crisp ones.
7. **The engine mostly scores each part alone.** Its biggest gaps here: no ceiling for a bad pants-shoe meeting, no shape-softens-color trade, nothing for one-color outfits, and no fabric or season input.

---

### Shape changes color

This group also covers what the surround does to a color (ix.4 to ix.6): the pieces around a color are part of its shape on the page.

#### ix.1. Shape outranks the palette: a good palette fails on a bad fit, and can't rescue it
- **What changes what:** proportion and fit decide whether a palette reads at all. Tight, pulling trousers or a top-heavy split spoil a color combination the creator likes; the same colors with better proportions turn "night and day". The reverse doesn't hold: a good palette never lifts a bad shape. Copying the colors of a look without its structure doesn't recreate it.
- **The creators' own examples:**
  - Tim · `wIib9hzVUuw` · [09:10] · "I like the color palette, but I dislike the fit." (beige-and-white monochrome: tight beige trousers pulling at the thighs, a tight overshirt, white sneakers.) Fix: Tim · `wIib9hzVUuw` · [09:40] · "that's the power of good proportions" (wider-thigh beige smart trousers, loafers, a tucked tee, a relaxed short-sleeve shirt: same palette).
  - Tim · `wIib9hzVUuw` · [04:04] · "too extreme of a shift between the top and bottom half" (black and white he likes, but an oversized white tee and baggy denim jacket over the skinniest black jeans and boots); fixed with relaxed jeans and a dark grey cropped jacket, same colors.
  - Tim · `SNjfZ5NKndc` · [03:02] · "a good color palette alone won't make a bad outfit good"
  - Tim · `wIib9hzVUuw` · [03:02] · "I thought all I needed was any black turtleneck and black coat" (the coat's shoulders and sleeve room, and the trousers' thigh and taper, were what made the look).
  - Wanhee · `tNVdA_arEa8` · [05:09] · "if you were to take all the color out of it" (his test: the outfit should still work as shapes).
  - Jaye · `Pxeeh-caTJg` · [22:43] · "It is not the pieces of it" (his all-black blazer outfit works on silhouette, not on the pieces).
- **Rules it links:** sil.1, sil.3, fit.1, fit.2, prop.2, color.1.
- **Engine today:** has it differently [SCO-1]: Proportions is 30% and Fit 15%, but Color (20%) and Style (20%) earn their credits ([COL-5], [COL-11], [COL-13], [STY-1], [STY-2]) whatever the fit, so a pulling or top-heavy outfit still collects its palette points. [PRO-8] already blocks shape credits behind a Proportions fault; nothing blocks color credits.
- **AI can see it:** yes for the faults that trigger it ([PRO-2], [PRO-13], [FIT-3] from `volume`, `leg_shape`, `strain`), weakly for strain ("clearly" only).
- **Score effect suggested:** let a Proportions or Fit fault of 1 or more switch off Color's rewards (the quiet accent, the dark-base accent, the color echo) the way a color fault already does; never let a palette credit lift an outfit past a shape fault.
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-09-15.jpg` (matching: the tight beige "before" on the right half); `inputs/youtube/shots/wIib9hzVUuw/o4-after-10-02.png` (matching: the fixed outfit); `inputs/youtube/shots/wIib9hzVUuw/f-04-09.jpg` (matching: the top-heavy outfit 1).

#### ix.2. A good shape lets a risky color pair pass (the founder's red-over-blue case)
- **What changes what:** a risky pair (two non-neutrals, two brights, a near-complementary pair) is softened by good proportions plus any of: one color muted or darker, both at the same strength on purpose, calm dark or neutral pieces around them, one color clearly leading by area. It gets worse with a strength mismatch (strong next to pale), a loud print on top, a third color, or a bad shape. "Sounds like" a clash isn't the verdict; the whole outfit is.
- **The creators' own examples:**
  - Jaye · `5Dfr0PXTTpM` · [04:04] · "balancing the playfulness with the structure" and "the fit still got to look smooth" (Y2K: loud color held by a clean fit).
  - Wanhee · `ew3gCk1zkso` · [09:06] · "you want to get them in the same like strength of color"; [09:39] · "yellow shirt with a purple jacket" (the fashion-icon pair, described only); his caveat at [10:11] · "know what you're doing Vibe".
  - Frugal · `TQi2YaZ5yNY` · [02:36] · "they're still good contrast but it's not so jarring" (soft peach with mint, the softer contrast he prefers).
  - Tim · `wIib9hzVUuw` · [02:32] · "color combos that look good on paper" (his old outfits: they "feel too overbearing" worn).
  - Worse: Wanhee · `ew3gCk1zkso` · [09:39] · "really saturated blue and like a really pale pink"
- **Rules it links:** color.6, color.7, color.3, color.12, color.5, sil.1; and the "When a risky color works" section of `2-color.md`, which this entry turns into a shape condition.
- **Engine today:** has it differently [COL-2]: two bright pieces cost −2.0 (−1.0 in streetwear, [STR-8]) whatever the shape; [COL-1] counts muted accents half. The founder's red shirt over blue jeans already costs nothing (denim is neutral), but a red shirt over bright blue chinos loses 2 Color points even with a perfect shape. The strength-mismatch fault is missing.
- **AI can see it:** yes (`color_family`, `saturation`, `pattern`, plus the shape fields); "same strength" only as bright vs muted.
- **Score effect suggested:** halve [COL-2] when the two brights are the only colors, at least one other piece is a dark neutral, nothing is patterned, and Proportions has no fault (or has a shape credit); keep it in full otherwise. Charge a strength mismatch only once a value read exists.
- **Frame:** `inputs/youtube/shots/TQi2YaZ5yNY/f-02-41.jpg` (unverified); the founder's own case has no frame.

#### ix.3. In one color, the shape is the whole outfit: good shapes read better, bad shapes worse, and bolder proportions are allowed
- **What changes what:** removing color contrast hides where pieces end, so the outline carries everything. A fitted top over a relaxed bottom, a flare, an open blazer or a cropped jacket creates the contrast in place of color; a bad silhouette is exaggerated just as much. In all black a deliberate extreme proportion gets away with more.
- **The creators' own examples:**
  - Frugal · `Vn6KlXkU2xA` · [09:16] · "your whole fit is one color your entire silhouette is completely exaggerated"; same block: "get away with more things"
  - Frugal · `Vn6KlXkU2xA` · [10:19] · "fairly fitted top with a relaxed bottom this just creates good contrast" (black fitted tees and knits over wide black trousers).
  - Frugal · `Vn6KlXkU2xA` · [10:51] · "Min maxing the proportions slider usually will work pretty well"
  - Jaye · `Pxeeh-caTJg` · [22:13] · "So, this creates an hourglass silhouette." and "It's just black shoes, black pants, and a black blazer." (open black blazer, black flared trousers, heavy black boots).
  - Jaye · `7K2qRZaXX3w` · [03:41] · "wear black but wear some flare pants or wear a black coat" (at an all-black dress code).
  - Frugal · `9GFKiZx89oM` · [07:11] · "the absence of color leaves more room in the mix"
  - Tim · `XIYvycsZxDk` · [03:25] · "adds some visual interest to this otherwise plain monochrome outfit" (a slightly cropped camel jacket over grey sweats and a grey top, white sneakers).
- **Rules it links:** sil.7, sil.2, sil.9, prop.5, color.8, color.9, layer.1.
- **Engine today:** lacks it. One-color outfits get only a tip ([COL-7], [MIN-8]); shape credits and faults weigh the same as in any outfit.
- **AI can see it:** yes (`color_family` on every piece; shape fields), weakly where the shape credit depends on `length` or `volume` 4–5.
- **Score effect suggested:** in an outfit where every piece of clothing is in one color family (or black, charcoal and grey together), make Proportions credits and faults count about half again as much; a flare or wide leg under a short or open top in one color should be able to reach the 8s on shape alone.
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-10-24.jpg` (matching: four black fitted-top, wide-bottom looks, captioned "fitted top + relaxed bottom = good contrast"); `inputs/youtube/shots/XIYvycsZxDk/f-03-30.jpg` (matching: the cropped camel jacket over grey sweats).

#### ix.4. A quiet surround makes one accent work; a second matching accent or a third point kills it
- **What changes what:** the base decides whether a color is a point or noise. All black or plain neutrals make any one color "the point"; underplaying the rest ("kill" the other parts) is the method. Echoing the accent obviously, or adding a second or third point, reads try-hard or pointless.
- **The creators' own examples:**
  - Wanhee · `1wUp3RSAEqI` · [00:31] · "you kill other parts of your outfit"; [01:01] · "maybe your white socks could become the point" (in an all-black outfit).
  - Wanhee · `uBsIrt-zU0I` · [05:06] · "If you dress all black and then you throw in any color"
  - Wanhee · `Uw-vpUq8Ewg` · [00:34] · "the artwork shines more as a result" (his white-room picture of why simple works).
  - Frugal · `Jh8dz-KZcfY` · [03:47] · "it almost glues everything together with a nice focal point" (a red bag on an all-black outfit).
  - Tim · `UNkA9HhbjXY` · [02:40] · "I like the pop of red with the outfit" (a self-cropped tee, jeans draping onto brown loafers, one red piece).
  - Tim · `IUMqpLeCT-E` · [01:09] · "a statement color in a monochrome outfit" (his tension example).
  - Worse: Wanhee · `e2MgmGDLV9Q` · [04:08] · "it just looks a bit try hard" (orange socks matched with an orange cap on black); [02:36] · "if you have too many then it loses its power" (a design on the cap, the tee and the pants).
- **Rules it links:** color.2, color.13, color.1, contrast.1, shoe.9.
- **Engine today:** has it differently [COL-11] (+0.5 for one bright piece on a dark base), [COL-5] (+0.5 one quiet accent), [STY-6] (too many statements). The creators' favorite accents (socks, bag, cap, jewelry) never count ([SCO-6]); a light or beige base earns nothing; a second piece in the same bright color isn't charged.
- **AI can see it:** yes for clothes (`color_family`, `saturation`); no for socks, bags and caps.
- **Score effect suggested:** let [COL-11] fire on a light-neutral base too (white, cream, beige), at the same size; add a small charge (about a quarter of [COL-2]) when the one bright color appears on a second piece of clothing that isn't a matched set.
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-03-52.jpg` (partly: a bright orange scarf on a black coat with light jeans, captioned "color"; not the red bag); `inputs/youtube/shots/UNkA9HhbjXY/f-02-45.jpg` (checked: a talking head, wrong).

#### ix.5. Dark pieces around or over a bright one tone it down; black shoes and a black cap contain a bright outfit
- **What changes what:** a black, dark brown or navy layer, or dark pieces at the ends (cap, shoes), make a bright or busy piece read controlled; a beige or neutral anchor does the same for a several-color outfit. Without the dark surround the bright piece reads loud.
- **The creators' own examples:**
  - Wanhee · `tNVdA_arEa8` · [00:31] · "surround it with black or dark brown or dark Navy"; [01:02] · "much more toned down much more Compact and trustworthy" (a black blazer over a yellow piece, white shirt and light blue).
  - Wanhee · `tNVdA_arEa8` · [02:36] · "toning down a flamboyant design by wearing darker colors on top" (a design shirt under a black blazer).
  - Wanhee · `rNCrnP-os0U` · [06:10] · "use Caps or hats and shoes as a way to contain"
  - Tim · `RrGbfY6NTZI` · [07:33] · "a great anchor to an outfit comprised of multiple colors" (beige with purple or yellow).
  - Tim · `_6-4CHHXg3c` · [07:35] · "with a mostly neutral color outfits especially darker tones" (red only as a small accessory on dark neutrals).
  - Jaye · `Pxeeh-caTJg` · [22:43] · "then you add the things that pop" (neutrals first).
- **Rules it links:** color.3, pattern.4, color.2, suit.13.
- **Engine today:** has it differently [COL-11]: the credit needs a dark neutral piece of clothing (black, charcoal, navy, dark denim); dark brown is missing, shoes don't count, a beige anchor earns nothing. [COL-8] charges a loud print on a top whether or not a dark layer covers it.
- **AI can see it:** yes (`color_family`, `saturation`, `pattern`, the outer layer); "covers it" weakly (open vs closed isn't read).
- **Score effect suggested:** add dark brown to [COL-11]'s dark list and let black or dark shoes count as the dark piece when the clothes have one bright piece and nothing else; halve [COL-8] when a dark outer layer sits over the printed top.
- **Frame:** `inputs/youtube/shots/tNVdA_arEa8/f-00-36.jpg` (matching: a bright purple shirt under a dark coat, labelled "DARK COAT" and "BRIGHT PURPLE").

#### ix.6. The size of the piece decides whether a color is a point or the statement
- **What changes what:** the same bright color is a safe point on a small piece and the whole outfit's statement on a jacket or hoodie, because it covers the most "visual real estate". Bright colors go small first; a deep, premium color (burgundy) can go big on a jacket and should stay off basics.
- **The creators' own examples:**
  - Frugal · `4hwelpjhDTM` · [06:30] · "accessories and subtle layering are good starts" (a bright loud main piece is "risky").
  - Frugal · `RlcdMBj5Z2E` · [06:25] · "it holds the biggest amount of visual real estate on a fit"; [07:30] · "a cool colored bomber jacket would really do some damage"
  - Frugal · `TnNv7Zvui6E` · [03:05] · "there's a lot of visual real estate here on your outfit" (a colored hoodie).
  - Tim · `-e9Is50-fn0` · [01:39] · "rather than on your wardrobe basics like t-shirt or trousers" (burgundy on bags, gloves or a statement jacket).
  - Tim · `FUWET2HH-us` · [02:43] · "the orange can look quite cool as well" (a bright parka as the one color).
- **Rules it links:** color.12, color.2, color.6, color.7.
- **Engine today:** lacks it. [COL-11] treats a bright tee and a bright coat the same; accessories never count ([SCO-6]).
- **AI can see it:** yes (category of the bright piece; outer layer vs base).
- **Score effect suggested:** keep [COL-11] for a bright base piece or bottoms on a dark surround; when the bright piece is the outer layer, require the rest to be neutral for the credit and charge [COL-2] in full if any other bright piece appears.
- **Frame:** `inputs/youtube/shots/RlcdMBj5Z2E/f-07-35.jpg` (checked: a line-up of black leather jackets, wrong for this point); none matching.

#### ix.7. A quiet palette lets a bolder shape pass
- **What changes what:** the reverse of ix.2. A jacket over shorts, massive stacked cargos or big-on-big read as deliberate when the colors are two calm neutrals; the same shapes in a busy palette would compound.
- **The creators' own examples:**
  - Tim · `YGm7JMniGVc` · [01:10] · "you could pull this off in shorts but I've been proven wrong" and "the black and brown combo is clean and the silhouette" (a boxy jacket over shorts).
  - Tim · `XIYvycsZxDk` · [01:07] · "nicely stacking on top of these Salamon sneakers" (massive brown cargos, a lambswool knit and snood: a brown tonal outfit).
  - Frugal · `Vn6KlXkU2xA` · [09:16] · "get away with more things" (in all black; see ix.3).
- **Rules it links:** sil.11, sil.4, prop.9, season.11, color.1.
- **Engine today:** has it in part: [PRO-15] (a short jacket over loose shorts +1.0) and [FIT-4]/[STR-12] (a stack on loose jeans or cargos is free) don't look at color; the dealbreaker drafts S7 and H5 would cap a leather jacket with shorts whatever the palette.
- **AI can see it:** yes (`color_family`, `leg_shape`, `hem`, shorts as category).
- **Score effect suggested:** if S7 or H5 is adopted, waive it when the outfit has no color fault and two color families or fewer; no new credit.
- **Frame:** none matching (`inputs/youtube/shots/YGm7JMniGVc/f-01-12.jpg` and `f-01-28.jpg` checked: both show Tim talking); described only for the shorts outfit.

#### ix.8. A change in lightness is what makes the split and the layers read
- **What changes what:** a top and bottoms in one color family with no lightness change read "basic and predictable" even when the fit is fine, because the waist line and the layers blur; a lighter inner layer, a dark grey jacket over blue jeans, or a light touch on a dark outfit makes the structure visible. Bright and light areas pull the eye.
- **The creators' own examples:**
  - Tim · `wIib9hzVUuw` · [07:07] · "it's just a little basic and predictable" (navy jeans, a navy tee, a navy-and-brown check flannel, cuffed jeans, white sneakers).
  - Tim · `wIib9hzVUuw` · [04:35] · "I like the change of color" (a dark grey cropped denim jacket over relaxed blue jeans).
  - Tim · `wIib9hzVUuw` · [08:38] · "lighter colors closer to the body"
  - Tim · `XSF9AOx7sdU` · [00:34] · "brighter lighter colors will draw more attention to that area"
  - Wanhee · `rNCrnP-os0U` · [05:39] · "the darker color is balanced by the light color"
  - Frugal · `Vn6KlXkU2xA` · [09:46] · "you can't even tell where the pieces end and start" (all black: lightness gone, only the outline left).
- **Rules it links:** color.10, color.8, prop.2, prop.3, layer.3, color.15.
- **Engine today:** lacks it. There's no light/mid/dark read (KD-6); [PRO-4] pays the waist break whether or not top and bottom differ; [COL-10] charges same-wash double denim (the one place a lightness clash is scored).
- **AI can see it:** weakly (`color_family` separates white, cream, light grey from black, charcoal, navy, but not shades inside a family; value isn't read).
- **Score effect suggested:** wait for a value read before charging the flat version; meanwhile, when top and bottoms share one color family, let the short-jacket and peek credits (ix.20) count and treat the tuck credit as a tip-level line, since the tuck line doesn't show.
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-08-12.jpg` (matching: the navy-on-navy flannel outfit on the right half).

#### ix.9. Solid, saturated color sharpens the cut; fade and blended washes forgive it
- **What changes what:** a solid, deep color (raw indigo, flat black) draws the outline crisply, so the fit has to be right; a slight fade or blended wash softens the shape and pairs more easily.
- **The creators' own examples:**
  - Frugal · `TnNv7Zvui6E` · [10:45] · "a more solid color creates a more defined shape" and "a little bit of fading goes a long way"; [11:16] · "fading and texture fuses the piece just a bit"
  - Frugal · `WDsQRHa8jBY` · [06:23] · "when in doubt just get a faded blue that goes with everything"
  - Tim · `K2HS3_8cTx8` · [03:48] · "it's not one homogeneous color there's a nice blend" (a blended grey wash, "more cool more edgy").
- **Rules it links:** color.15, color.9, cond.3.
- **Engine today:** lacks it (washes are read as families; fade and blend aren't read, [STR-14], [WRK-9]).
- **AI can see it:** weakly (`denim_light`/`mid`/`dark` only).
- **Score effect suggested:** none now; a tip ("a faded wash forgives the fit") at most.
- **Frame:** `inputs/youtube/shots/TnNv7Zvui6E/f-10-50.jpg` (unverified).

---

### Shape changes shoes and hem

#### ix.10. Where the pants meet the shoes can sink everything above it
- **What changes what:** the trouser hem on the shoe is the one meeting point that overrides the rest. Trousers too long and bunching, flapping too short, or pants that are "off" in fit make a great top half fail; Frugal calls the result "trash" with "90% of the visual real estate" good.
- **The creators' own examples:**
  - Frugal · `XtcY-zmoS-E` · [06:38] · "90% of the visual real estate can be good" and "as soon as the pants and the shoes don't work together" and "the whole thing is trash" (trousers puddling on shoes; fixed by shortening).
  - Jaye · `RIuzSb8OLMM` · [13:13] · "if your pants are off, your whole fit just collapse"
  - Tim · `SNjfZ5NKndc` · [00:00] · "Pant break will quite literally make or break your outfit."
  - Wanhee · `tNVdA_arEa8` · [03:36] · "it just all falls apart" (trousers showing too much sock or a bit of ankle in a flowy style).
  - Jaye · `7K2qRZaXX3w` · [06:53] · "the whole operation cannot work if you don't got that" (pants too skinny, too baggy or "flailing").
  - Frugal · `8rmkOpCbFTM` · [10:27] · "shoe pants pairing is where it matters the most"
- **Rules it links:** prop.1, fit.1, shoe.1, suit.3, prop.14.
- **Engine today:** has it differently [FIT-4]: trousers piling on a straight or narrow leg cost −1.5 to −2.0 on Fit (worth 0.15 a point, so about −0.3 on the score) and block shape credits ([PRO-8]); there's no ceiling, no charge for too short, and no credit for a clean break. Dealbreakers H7 proposes a sink.
- **AI can see it:** weakly (`hem` reads 64–68% steady); better from the shoe close-up (look L, [SHO-2], KD-15).
- **Score effect suggested:** turn a clear pile on a straight or narrow leg (read from look L) into a hold on the whole score, as H7 proposes, rather than a Fit deduction; leave wide and relaxed legs to ix.12.
- **Frame:** `inputs/youtube/shots/XtcY-zmoS-E/f-06-43.jpg` (matching: black trousers bunching over black shoes, captioned "too long i think").

#### ix.11. The shoe's bulk sets the leg: chunky wants generous or cinched, boots want flares or baggy, slim wants a full leg over it
- **What changes what:** shoe and pants are equal partners. A bulky shoe needs a leg with enough width or a cinched hem to "handle" it; a narrow leg over a bulky shoe fails. A slim, low shoe under a generous leg is a strong contrast. Boots go under flares and baggy jeans; a straight leg suits low and high shoes alike.
- **The creators' own examples:**
  - Frugal · `8rmkOpCbFTM` · [09:22] · "a more generous pair of pants does these shoes justice" and, of skinny pants over bulky shoes, "You don't know how to handle all that."
  - Frugal · `8rmkOpCbFTM` · [04:58] · "a nice generous pair of pants stacking over top" (over a slim shoe).
  - Frugal · `8rmkOpCbFTM` · [01:09] · "The shoe pants relationship is a lot more equal"
  - Frugal · `FFDYIGhiIk8` · [13:24] · "these work really well with bag your pants" (chunky runners).
  - Tim · `uGregWdLahU` · [05:58] · "pairs really well with oversized sweats caros and baggie jeans" (a chunky 2000s runner).
  - Tim · `_6-4CHHXg3c` · [09:14] · "they Shine the most when paired with slightly looser fitting Denim" (Wallabees).
  - Frugal · `WDsQRHa8jBY` · [08:39] · "the secret to pants shape is your shoes"; [09:12] · "I really like the way flared pants look on boots"
  - Frugal · `xL1NeaA9D-Y` · [05:27] · "a good flare works especially well with boots"
- **Rules it links:** prop.10, prop.11, shoe.1, shoe.2, shoe.3, sil.8, sil.9.
- **Engine today:** has it in part: [SHO-9] (chunky under slim or skinny −1.5), [STR-6] (+0.5 chunky under relaxed or wide, streetwear only), [SHO-12] (dress shoes under wide legs: nothing). Lacks boots under flares (sil.9), the slim-shoe-under-full-leg contrast credit, and the chunky carry outside streetwear.
- **AI can see it:** yes (`leg_shape` incl. `flare_bootcut`, shoe subcategory); cinched weakly (`hem` cuffed or cropped).
- **Score effect suggested:** let [STR-6]'s +0.5 fire in any look when chunky sneakers sit under relaxed, wide or cinched legs; give the same +0.5 for boots under a flare or bootcut; keep [SHO-9] as is.
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-09-27.jpg` (matching: cinched black track pants and wide olive cargos over bulky runners).

#### ix.12. The leg's width decides whether a stack is current or dated
- **What changes what:** a soft, "organic" stack of a generous or wide leg over a substantial shoe is part of the shape; many folds on a skinny jean are 2016. On a straight or narrow leg, more than one break reads sloppy.
- **The creators' own examples:**
  - Frugal · `8rmkOpCbFTM` · [06:37] · "It was like how many stacks" (skinny stacked jeans, dated) against "a nice organic looking cozy little bit of stack"
  - Frugal · `JY_zrt43cbU` · [06:31] · "I want to be stepping on the pant" (huge cargos now, slim elastic-cuff cargos then).
  - Tim · `o5RnTT2oafg` · [01:09] · "rock them long and stacking a bit on the shoe" (wide trousers).
  - Tim · `SNjfZ5NKndc` · [00:30] · "Anything more than one break goes into stacking territory"; [00:00] · "Too long and it'll look sloppy"
  - Tim · `XIYvycsZxDk` · [01:07] · "nicely stacking on top of these Salamon sneakers" (massive cargos).
- **Rules it links:** prop.9, prop.1, fit.6, shoe.14.
- **Engine today:** has it [FIT-4], [STR-12], [PRO-8]: a stack on relaxed or wide jeans and cargos is free and keeps the shape credits; trousers on a loose leg −0.5; piling on a straight or narrow leg −1.5 to −2.0; the skinny stack is charged twice over ([PRO-13] and [FIT-4]).
- **AI can see it:** weakly (`hem` pooling vs full_break; look L).
- **Score effect suggested:** keep as is; the one gap is Tim's wide trousers (not jeans) stacking a bit, which [FIT-4] still charges −0.5: drop that charge when the trousers are wide and the shoe is substantial.
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-06-42.jpg` (unverified).

#### ix.13. The shoe and the leg together set the right hem height and even the right top length
- **What changes what:** over a slim shoe the hem should be medium to long with nothing cropped; over a bulky shoe a slightly higher or cinched hem is fine, and the top should be a neutral-to-longer easy fit, nothing cropped or boxy (a reversal of the usual crop advice). On a wide leg with loafers, a deliberate crop showing socks is a current look. A hem that rides up decides whether socks show.
- **The creators' own examples:**
  - Frugal · `8rmkOpCbFTM` · [09:22] · "anything that you can kind of cinch at the bottom" and "Slightly oversized top. Neutral to longer length."; [09:54] · "Nothing too cropped. Nothing boxy." (the bulky-shoe template).
  - Frugal · `8rmkOpCbFTM` · [10:27] · "I suggest a long or medium inseam" (over slim shoes).
  - Frugal · `xL1NeaA9D-Y` · [04:18] · "Like this is a very big combo right now." (a cropped wide leg with socks and loafers).
  - Frugal · `Jh8dz-KZcfY` · [06:29] · "I like how my socks get exposed when these jeans ride up"
  - Frugal · `TnNv7Zvui6E` · [10:45] · "your pants kind of go over the boot" ("not a bad look", against his usual small gap above boots).
  - Tim · `K2HS3_8cTx8` · [03:15] · "not too short not too long barely touching the shoe"
- **Rules it links:** prop.10, prop.11, prop.12, prop.4, prop.1, season.9.
- **Engine today:** lacks it: a cropped hem is neither credited nor charged; top length reads poorly (`below_crotch` almost never fires) so nothing ties top length to the shoe.
- **AI can see it:** weakly (`hem`, `length` both shaky); socks no.
- **Score effect suggested:** none on points until the hem read is steadier; a tip when a cropped hem sits over a slim sneaker on a straight leg ("a little longer would cover the shoe"). Never charge a crop on a wide leg over loafers.
- **Frame:** `inputs/youtube/shots/xL1NeaA9D-Y/f-04-23.jpg` (partly: his "extreme example", wide drawstring pants over chunky boots, not the cropped-with-loafers look).

#### ix.14. The shoe's color against the trouser moves the eye; a cuff adds to it
- **What changes what:** a shoe matched to the trouser color, meeting the hem cleanly, streamlines and keeps the eye up; a contrasting sneaker under cuffed jeans pulls it down. In all black, a dark sneaker with light details beats white. The other side: a light shoe can anchor a heavy tonal outfit, and Wanhee uses a light touch on dark outfits.
- **The creators' own examples:**
  - Tim · `wIib9hzVUuw` · [08:07] · "I don't really want the eye to be drawn towards the feet" and "especially if the jeans are cuffed like in the original outfit"; fix "matching the black loafers with the black trousers"
  - Jaye · `1nntxNqbmk8` · [06:03] · "if you have bright shoes, your eyes are directed downward"
  - Tim · `wIib9hzVUuw` · [10:40] · "a black sneaker will make the whole look more visually pleasing" (all black: white sneakers fine, a black sneaker with beige detail better).
  - Other side: Tim · `XIYvycsZxDk` · [00:33] · "the white sneakers help anchor down this Hefty cluster of gray"
  - Tim's capsule video (speaker unclear, guest outfit) · `OqoUgLxknJc` · [09:12] · "cuffed up make it look a little bit edgier" (cuffed trousers over boots).
- **Rules it links:** shoe.10, color.10, color.13, prop.15, shoe.11, shoe.7.
- **Engine today:** has it differently [COL-5] (shoes picking up a top color +0.5, never black, white, grey, navy or denim, so the matched black shoe earns nothing) and [SHO-10] (a loud shoe as the one accent +0.5). Cuffed hems cost nothing; nothing reads where the eye goes.
- **AI can see it:** yes (`color_family` of shoe and pants; `hem` cuffed weakly).
- **Score effect suggested:** let a shoe in the trouser's own dark family (black on black, brown on dark brown) count as [COL-5]'s tie-in (dealbreakers L6 points the same way); a cuffed hem over a contrasting sneaker stays a tip, never points.
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-08-12.jpg` (matching: cuffed navy jeans over white sneakers, the "before").

#### ix.15. The break follows the formality and the style
- **What changes what:** a slight break is the classic, office finish; a full break needs a fashion-forward rest of the outfit; in a loose, flowy style the trousers should rest on the laces and cover the ankle. The same trouser is right or wrong at the hem depending on what's above it.
- **The creators' own examples:**
  - Tim · `FUWET2HH-us` · [01:38] · "take more risk with a full brake" (against hemming to a slight break for the office), with "more fashion forward silhouette with the rest of your outfit" at [02:10].
  - Wanhee · `tNVdA_arEa8` · [03:36] · "you want your trousers to fall on top of the shoelace"
  - Tim · `0ilmLux6mPg` · [08:15] · "barely breaking on the shoes" (tailored trousers under a boxy jacket).
  - GQ (outsider) · `bLcGL6rKBBg` · [10:52] · "a classic length would be to have a single break"
- **Rules it links:** prop.14, suit.3, prop.1.
- **Engine today:** has it differently [FIT-6] (a full break on slim pants is a tip); no link to formality or look.
- **AI can see it:** weakly (`hem`).
- **Score effect suggested:** none on points; let the tip name the look ("a slight break suits the smart trousers").
- **Frame:** `inputs/youtube/shots/FUWET2HH-us/f-01-43.jpg` (unverified).

#### ix.16. Leather at the foot against a fabric hem adds texture contrast, even in one color
- **What changes what:** leather boots or shoes under denim or a baggy fabric hem add depth that color can't in an all-black or all-blue outfit; how much boot the hem lets show decides how much contrast there is. A polished shoe under a frayed hem is a formality and texture contrast in its own right.
- **The creators' own examples:**
  - Frugal · `Vn6KlXkU2xA` · [06:28] · "a pair of leather boots just kind of peeking through" and "a little bit of contrast even though they're both black"
  - Frugal · `FPHnmY5FTaI` · [04:48] · "leather married to the frayed hems"
- **Rules it links:** shoe.12, layer.1, cond.6, ix.31.
- **Engine today:** lacks it (fabric isn't read).
- **AI can see it:** weakly (shoe subcategory implies leather for boots, loafers, derbies; denim is a color family; the hem's fray isn't read).
- **Score effect suggested:** none now; when fabric is read, count leather shoes under denim or fabric trousers as one texture contrast toward the tonal-depth credit (ix.31).
- **Frame:** `inputs/youtube/shots/FPHnmY5FTaI/f-04-53.jpg` (matching: distressed wide jeans over black and brown leather shoes); `inputs/youtube/shots/Vn6KlXkU2xA/f-06-33.jpg` (partly: the black leather jacket, jeans and boots laid out, not worn).

---

### Layers change shape and season

#### ix.17. A layer can hide a top's fit, never the trousers'; adding pieces can't buy back a fit fault
- **What changes what:** a hoodie or jacket over a tee hides the tee's fit, and a tight tee can be right as the inner layer of a looser jacket; nothing hides the pants. Covering a bad pairing with more material, or cool shoes, works on the surface only ("it does kind of work").
- **The creators' own examples:**
  - Frugal · `4Jrq_F1Ayp8` · [12:55] · "you can kind of cheat it sometimes when you wear a hoodie" and "but you can't cheat pants"
  - Frugal · `WMwH8xtSOWA` · [05:30] · "compensate a lack of chemistry between pieces by adding more material"; [06:05] · "I have really cool shoes on" (of pants that don't sit well).
  - Wanhee · `RtxJqd5Drps` · [07:39] · "you might wear it on the inside" (a too-small tee under a looser leather jacket) and "you might wear it over a hoodie" (a too-big shirt as the outer layer).
  - Jaye · `7K2qRZaXX3w` · [06:53] · "pants that are flailing everywhere in the wind"
- **Rules it links:** fit.1, fit.4, sil.5, layer.4.
- **Engine today:** has it differently [FIT-5] (the worst piece in full, others half: trousers aren't weighed above tops); [PRO-11] never charges a roomy top under a jacket (right); [PRO-8] blocks layer credits behind pooling but not behind trousers that clearly pull ([FIT-3]).
- **AI can see it:** yes (`strain`, `volume` per garment, `shows_below_outer`), weakly for strain.
- **Score effect suggested:** let a clear trouser fault ([FIT-3] pulls, [FIT-4] piling) block every layer shape credit as [PRO-8] does for pooling; halve a base top's own fit charges when it sits under an outer layer; never discount a trouser fault.
- **Frame:** none (described only); `4Jrq_F1Ayp8` and `RtxJqd5Drps` have no still within 20 s of the stamps.

#### ix.18. The under-layer's length, bulk and fit change the same outer piece
- **What changes what:** under one jacket, a cropped hoodie and a regular one, or a fitted and an oversized shirt, make different outfits. An extra-long tee under a short jacket costs; a crop is better. The outer piece needs room for what's under it; a thinner or slimmer outer layer over a thicker or bigger one throws the balance off. Layers step up in thickness and volume from inside out.
- **The creators' own examples:**
  - Frugal · `Jh8dz-KZcfY` · [02:08] · "fitted shirt and an oversiz shirt with the exact same jacket" and "I like playing with a cropped hoodie to play with a composition"
  - Jaye · `Jz9QVWgBbOg` · [23:49] · "there's no reason you should have a extremely long white t-shirt" and "A crop t-shirt is probably going to look better." (under a leather jacket); [23:19] · "your shirt too bulky, your jacket too bulky"
  - Jaye · `RIuzSb8OLMM` · [09:41] · "If your base is too baggy, too thick, or maybe too thin"
  - Tim · `FUWET2HH-us` · [02:10] · "provided you don't wear anything too oversized underneath" (a slim parka).
  - Tim · `IUMqpLeCT-E` · [03:15] · "the layer closest to your body should be the thinnest"
  - Tim · `wIib9hzVUuw` · [09:10] · "not enough room for the layer underneath"; Tim · `-e9Is50-fn0` · [03:53] · "enough room to comfortably layer" (a big overcoat over a chunky knit).
- **Rules it links:** sil.5, prop.13, layer.4, fit.4, prop.6.
- **Engine today:** has it in part [PRO-9]: a top showing "clearly" below the outer piece −0.5 and no shape credit; "a little" free. Lacks the room check (a slim outer over a roomy inner) and thin-to-thick.
- **AI can see it:** weakly (`volume` per garment, 4–5 poorly; `shows_below_outer` from look U; thickness no).
- **Score effect suggested:** charge a roomy (4–5) base top under an outer layer read close or regular (not tailoring, which has its own rules) the same −0.5 as [PRO-9]'s "clearly"; nothing for thickness until fabric is read.
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-02-13.jpg` (partly: three layered looks, a puffer over a tee, a blazer over a knit, a bomber over a hoodie; not the cropped-vs-regular pair).

#### ix.19. The outer layer's volume has to answer the trousers
- **What changes what:** the jacket is most of the visual area, so its size decides the outfit. An oversized jacket needs weight below (a wide leg, a big shoe); a jacket that ends where the trousers start, or a cropped jacket over full legs, shows the legs; volume shared top and bottom (oversized tee, wide trousers, big overcoat) is balanced.
- **The creators' own examples:**
  - Jaye · `Jz9QVWgBbOg` · [13:41] · "Oversized jackets, they need balance."
  - Tim · `2KblatXQTGs` · [02:08] · "a bit looser to go with the wide fit of the pants" (a linen jacket chosen to match wide trousers).
  - Tim · `vQd36IKIkOg` · [02:53] · "rocking an oversized tea, some widelegg trousers, and a big overcoat"
  - Tim · `0ilmLux6mPg` · [08:15] · "the jacket cuts abruptly where the trouser starts"; [08:51] · "A short jacket can emphasize the legs"
  - Frugal · `4hwelpjhDTM` · [09:48] · "a nice contrast with how popular oversized jackets have been" (a cropped jacket).
- **Rules it links:** sil.3, sil.4, sil.5, prop.5, sil.6.
- **Engine today:** has it in part: [PRO-6] (a short jacket over full legs +1.5), [PRO-2]/[PRO-3] (a roomy or any jacket over skinny legs), [PRO-14]. A roomy outer layer over slim (not skinny) legs isn't charged ([PRO-11] covers a roomy top worn on its own only).
- **AI can see it:** yes (`volume`, `leg_shape`, `length` of the layer; volume 4–5 weakly).
- **Score effect suggested:** extend [PRO-11]'s −1.5 to a roomy outer layer (not tailoring, not an overcoat) over slim legs, held by the same looks; keep the short-jacket credit as is.
- **Frame:** `inputs/youtube/shots/vQd36IKIkOg/f-02-58.jpg` (unverified).

#### ix.20. An open layer and a small peek of a contrasting inner layer add depth; a layer closed over everything flattens it
- **What changes what:** an open jacket frames what's under it and decides how much of a graphic shows; a white tank or tee at the neck or hem, a hood out of a jacket, or a vest poking out adds contrast; closing a layer over the whole base hides the layering.
- **The creators' own examples:**
  - Tim · `zJ5LCenTcf8` · [01:40] · "simply add a layer that will entirely cover your base layer" (his sarcastic how-to-look-bad video).
  - Frugal · `Jh8dz-KZcfY` · [05:22] · "a shirt just peeking through a jacket can completely change a look"; [05:56] · "strategically picking a graphic to sneak through the opening of your jacket"
  - Frugal · `2gSj7T37RkQ` · [09:09] · "it'll just be good contrast with an oversized hoodie" (a tank under it).
  - Tim · `OqoUgLxknJc` · [17:44] · "that vest poking out a little bit just adds some nice contrast" (to a guest's black shirt outfit).
  - Tim · `vQ6_okzfNSs` · [01:38] · "little touches of white with a t-shirt peeking out of the hoodie"
  - Tim · `30L-EHe4WAQ` · [01:38] · "a good V-neck sweater that's not too low" (the white tee showing at the neck).
  - Jaye · `RIuzSb8OLMM` · [09:41] · "This is really where structure and contrast come in."
- **Rules it links:** layer.2, layer.3, prop.13, color.10, pattern.4.
- **Engine today:** has it differently [PRO-9] (a peek "a little" costs nothing and keeps credits; "clearly" −0.5); the peek earns nothing, an open overshirt or cardigan over a tee earns nothing unless it fits a shape credit; dealbreakers L3 proposes a credit.
- **AI can see it:** weakly (`shows_below_outer` from look U, right 71–82% on "a little"; open vs closed not read; the neckline peek not read).
- **Score effect suggested:** a small credit (+0.5 on Proportions or Style) when an outer layer has a base top in a clearly different color family showing "a little" below it (light under dark, or dark under light), as part of L3; no credit for the same family.
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-05-27.jpg` (unverified).

#### ix.21. A strong statement piece, or pieces with no shared vision, lower what layering adds
- **What changes what:** with a strong hero piece, more layers subtract; layering only helps when the pieces already "compute to a cohesive vision"; two to three visible layers is enough, and stacking without purpose reads try-hard. The other side: a flat outfit is sometimes missing one more piece.
- **The creators' own examples:**
  - Frugal · `Jh8dz-KZcfY` · [01:36] · "I don't need to layer much for that fit to bang" and "adding too much will kind of take away from the whole thing"
  - Frugal · `Jh8dz-KZcfY` · [03:15] · "your pieces just don't even compute to a cohesive Vision"; other side, same block: "maybe your layering sucks cuz you don't have enough layers"
  - Jaye · `Jz9QVWgBbOg` · [21:49] · "they stack pieces without purpose"
  - Jaye · `RIuzSb8OLMM` · [10:11] · "But two to three layers is enough."
  - Frugal · `LkN3yI1-TB4` · [07:06] · "over layering hyper accessorizing just random eclectic props cost maxing"
- **Rules it links:** layer.7, layer.8, layer.2, shoe.9.
- **Engine today:** has it differently: layers earn only through shape credits and only one per outfit ([PRO-8]), so stacking can't pile up credit; there's no charge for too many layers.
- **AI can see it:** weakly (number of garments, outer layer; "cohesive" no).
- **Score effect suggested:** keep one shape credit per outfit; no new charge (three or more visible layers is rare in a selfie, and the AI's layer count is shaky).
- **Frame:** none (described only); no still within 20 s of [01:36].

#### ix.22. The season changes what a layer and a hem are worth
- **What changes what:** in heat, no layer is needed and the waist and trousers carry the outfit (a fitted tee over wide trousers; a light open shirt over a tank if anything); in cold, texture and layers carry it and a bare ankle under a sweater and coat is the one "cardinal sin". A chore jacket's value is the in-between season. A light layer under a heavy one solves heat against dressing up.
- **The creators' own examples:**
  - Tim · `IUMqpLeCT-E` · [03:47] · "you shall never show your ankles in winter"; [04:18] · "leave the bare ankle look for high summer where it belongs"
  - Frugal · `XtcY-zmoS-E` · [03:37] · "I don't want to put anything"; [04:07] · "tight waist wide legs I feel like I can conquer the Earth"
  - Tim · `2KblatXQTGs` · [01:05] · "like a denim jacket or a leather jacket if the weather allows" (over a tank).
  - Jaye · `7K2qRZaXX3w` · [03:09] · "pull up in something light that's under"
  - Tim · `SNjfZ5NKndc` · [03:32] · "Especially in the colder temperatures" (texture).
  - Frugal · `JY_zrt43cbU` · [02:44] · "it works very well layered" (the chore jacket).
- **Rules it links:** season.3, season.4, season.6, season.8, season.9, season.7, prop.12.
- **Engine today:** lacks it: no season or weather input; the layer credits ([PRO-6], [PRO-14], [PRO-17], up to +1.5) apply all year, so a summer outfit's only ways above 7 are the waist break ([PRO-4]) and the shorts shape ([PRO-15]).
- **AI can see it:** no (season isn't in the reading; the app has approximate location for weather, never stored).
- **Score effect suggested:** if a weather input arrives, in heat let a fitted or tucked top over wide or relaxed trousers earn the full +1.5 even over a straight leg read at roominess 3, and in cold turn a cropped hem with low shoes under a coat into a tip; until then, nothing.
- **Frame:** `inputs/youtube/shots/IUMqpLeCT-E/f-03-52.jpg` (unverified).

---

### Style world changes the rules

#### ix.23. Loud parts add up: one statement at a time
- **What changes what:** each loud thing (a bright color, a big print, a graphic, a design detail, leather, logos, a fancy shoe) could pass alone; together they cancel and read as patchwork, a costume or try-hard. Space around one statement is what lets it read. Shape and color shouldn't both shout on one shoe either.
- **The creators' own examples:**
  - Wanhee · `B9PIhkSQKuw` · [05:57] · "let me add red and green and flower and leather" against "letting Blank Space just be there"
  - Wanhee · `ew3gCk1zkso` · [02:06] · "then you just look like some Patchwork"
  - Wanhee · `Uw-vpUq8Ewg` · [04:58] · "if you wear Too Many Colors it looks wrong it looks disjointed"
  - Wanhee · `kAaM_zcxh_U` · [04:19] · "design here, design there" (on a date: too much).
  - Wanhee · `uBsIrt-zU0I` · [08:31] · "it can kind of look like you just curated it too much" (a fancy shoe on a well put together outfit).
  - Tim · `zJ5LCenTcf8` · [00:37] · "think bold colors striking patterns and make sure you Clash them" (sarcastic).
  - Frugal · `TUYSTimnDJg` · [05:57] · "this doesn't make any sense" (the stacked e-boy look).
  - Frugal · `FFDYIGhiIk8` · [13:24] · "get something Calm before you get into the more pronounced colorways" (a loud-shaped shoe).
- **Rules it links:** pattern.1, color.5, color.4, shoe.9, layer.7, pattern.3.
- **Engine today:** has it [STY-6] (too many statements −0.5/−1.0, +1 allowed in streetwear), [COL-1], [COL-4], [COL-8], [SHO-10] (a loud shoe with a loud piece −0.75), [SCO-7] (problems add up). Wanhee's plain shoe on a curated outfit isn't in it (it can't tell a "fancy" shoe).
- **AI can see it:** yes (`saturation`, `pattern`, `pattern_scale`, `logo`, shoe color); design details and leather no.
- **Score effect suggested:** keep as is; count a large logo on a second piece as a statement in [STY-6].
- **Frame:** `inputs/youtube/shots/zJ5LCenTcf8/f-00-42.jpg` (unverified).

#### ix.24. The shoe has to belong to the outfit's world
- **What changes what:** an "ugly" technical runner, dad shoe or hiking shoe on a safe neutral outfit looks wrong and drags the other pieces down; in a wardrobe built for it (outdoor, techwear, streetwear) it beats pretty pieces. A sneaker's world (activewear, minimal leather, canvas) has to match the clothes'.
- **The creators' own examples:**
  - Frugal · `N8RAKkiqe1w` · [11:15] · "they're going to make your other pieces look ugly" against "in the right system these pieces can look better"
  - Frugal · `8rmkOpCbFTM` · [01:09] · "theme and silhouette are the two biggest factors"
  - Tim · `30L-EHe4WAQ` · [02:08] · "people who have never hiked in their life wearing hiking shoes"
  - Tim · `uGregWdLahU` · [04:50] · "want to give a touch of street wear to an outfit" (a bold-detail tennis shoe); [05:58] · "I would definitely keep them for the more casual"
  - Frugal · `FFDYIGhiIk8` · [07:25] · "as opposed to just styling around the shoe"
- **Rules it links:** shoe.5, shoe.4, shoe.9, shoe.13.
- **Engine today:** has it differently: the look's own shoe +0.5 ([SHO-7]); shoes count for or against a look ([MIN-2], [WRK-2], [VSP-2]); running shoes held to 5.0 outside the gym or an outdoor outfit ([SHO-3], [OUT-3]). A chunky or technical shoe on a plain outfit that reads as no look has no charge; trail shoes aren't in the reading (KD-7).
- **AI can see it:** weakly (shoe subcategory; trail shoes not named).
- **Score effect suggested:** founder call: a small Shoes charge (−0.5) for chunky or basketball sneakers when the clothes read as minimal, smart casual or classic prep and no look holds the shoe; nothing for no clear style.
- **Frame:** `inputs/youtube/shots/N8RAKkiqe1w/f-11-20.jpg` (partly: a Salomon runner shown alone, not on an outfit).

#### ix.25. The partners decide a piece's world
- **What changes what:** the same jacket, trouser, fleece or jeans reads loungewear, streetwear, minimal, utilitarian or smart depending on the shoe and the top around it. A piece's "sophisticated cousin" (a turtleneck for a hoodie) moves the whole outfit up a world.
- **The creators' own examples:**
  - Tim · `YGm7JMniGVc` · [01:10] · "you can style it in so many different ways" (a boxy jacket over loungewear, loose denim and sneakers, or tailored trousers and loafers).
  - Tim · `FUWET2HH-us` · [00:00] · "style this under an overshirt for a scandy minimal look" (or under a blazer and parka with hiking shoes).
  - Tim · `2KblatXQTGs` · [03:45] · "with leather boots and a smart jacket for a more elegant look" (grey trousers; casual with sneakers and a tee).
  - Tim · `0JtnbgtbQfE` · [02:12] · "if I want to lean more smart I'll go for the boots" (the same jeans).
  - Tim · `XIYvycsZxDk` · [02:17] · "the turtleneck is essentially the hoodie's more sophisticated cousin"
  - Frugal · `FPHnmY5FTaI` · [04:48] · "living in a world between formal and casual" (vintage denim to wool trousers, same outerwear and shoes).
- **Rules it links:** contrast.4, contrast.2, shoe.6, season.13.
- **Engine today:** has it: the look detector reads each piece by its partners (signature, home, against; [STR-1]–[SMC-3]), and [SHO-4]/[SHO-5] judge the shoe against the clothes' dressiness.
- **AI can see it:** yes (category, subcategory per piece).
- **Score effect suggested:** none; this is how the engine already works.
- **Frame:** `inputs/youtube/shots/2KblatXQTGs/f-03-50.jpg` (partly: the grey trousers with a burgundy smart jacket; shoes cropped out).

#### ix.26. Good execution with no point of interest caps the outfit
- **What changes what:** well-fitting neutral basics with standard denim and a basic shoe are "put together", not great; each piece is fine, and together, with nothing personal, they lock the outfit at okay. A good shape earns good; a personal twist earns great. The plain base is the floor every lift builds on.
- **The creators' own examples:**
  - Frugal · `YFxXWWM5YRI` · [03:14] · "if you're too well-rounded I feel like you lose your Edge"
  - Frugal · `EWD0eRHHXgk` · [03:59] · "neutral and basic isn't timeless"
  - Frugal · `CsbsHWEBwy0` · [10:39] · "mid but mid in like a Lexus sedan kind of way"
  - Frugal · `FFDYIGhiIk8` · [06:23] · "the door is very big but the ceiling is very low" (a basic shoe).
  - Frugal · `2gSj7T37RkQ` · [02:07] · "fundamentally these pieces actually look pretty good together" (the boxy-tee-over-baggy-pants template, basic for lack of anything personal).
  - Frugal · `WMwH8xtSOWA` · [04:56] · "if you get this part right, everything else will only elevate it"
  - Wanhee · `uBsIrt-zU0I` · [02:52] · "Is it the most fashionable thing? No." (navy, khaki and brown basics that look right).
- **Rules it links:** fit.8, color.1, shoe.8, shoe.7.
- **Engine today:** has it [SCO-1] (a plain tee, dark straight jeans and white leather sneakers score 7.0 "Put together"), [STY-12] (+0.5 when the pieces go together), and no credit for neutrals or a basic shoe themselves.
- **AI can see it:** yes (the absence of credits is what caps it).
- **Score effect suggested:** keep; don't add credits for neutrals, "timeless" basics or a premium version of a basic shoe.
- **Frame:** `inputs/youtube/shots/YFxXWWM5YRI/f-03-19.jpg` (unverified).

#### ix.27. The style world sets the proportion rule
- **What changes what:** a classic proportion (tucked tee, trousers pulled up) needs a classic outfit and "might look weird" under street pieces; the street world allows a long, low, dragging proportion that is a fault elsewhere, if committed. Untucked is often the balanced choice; a tuck is for the classic look.
- **The creators' own examples:**
  - Wanhee · `RtxJqd5Drps` · [01:04] · "I got this streetear cap on, so it might look weird" (of the tucked, pulled-up fix).
  - Wanhee · `RtxJqd5Drps` · [00:33] · "There's not necessarily a right or wrong proportion"; [01:40] · "It doesn't look that bad." (the low, long, committed half split).
  - Frugal · `xL1NeaA9D-Y` · [08:07] · "you can tuck your shirt if you really like that classic look"
  - Tim · `XSF9AOx7sdU` · [00:34] · "it could look better to not tuck in your top"
- **Rules it links:** prop.7, prop.16, prop.3, prop.9.
- **Engine today:** has it in part: a stack is free on loose legs in every look ([FIT-4], [STR-12]); the tuck earns [PRO-4] in any look (in streetwear it replaces the streetwear shape, [STR-5]); untucked is never charged. The cap that made Wanhee's tuck "weird" is on the head, which is never scored.
- **AI can see it:** yes (`tucked`, `hem`, look detection); headwear no.
- **Score effect suggested:** none; the engine's freedom here matches the creators.
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-01-09.jpg` (unverified).

#### ix.28. Composition can carry odd pieces (the expert exception)
- **What changes what:** pieces that are "acquired taste" one by one (off-palette brights, a sheer layer, dated loafers, printed jeans) can compose into an iconic outfit, and "good styling" can make any proportion work, skinny on skinny included. The creators frame this as the exception for people who know what they're doing, not a rule for everyone.
- **The creators' own examples:**
  - Frugal · `N8RAKkiqe1w` · [09:03] · "individually right this is definitely acquired taste" and "together right as the fit this was a cultural reset" (purple heels, orange shorts, a sheer top, a yellow bag: not menswear, evidence only).
  - Frugal · `N8RAKkiqe1w` · [06:56] · "I feel like everything makes sense" (printed denim, loud laces, a bright shirt, off-season gloves).
  - Frugal · `8rmkOpCbFTM` · [11:39] · "Good styling and proper pairing can make any proportion look good"
  - Tim · `dk1efCZqwos` · [11:00] · "fabric combinations that shouldn't work but somehow still do"
  - Wanhee · `ew3gCk1zkso` · [10:11] · "know what you're doing Vibe" (two strong colors at once).
- **Rules it links:** sil.10, prop.16, color.6, pattern.1, season.11.
- **Engine today:** lacks it by design; the nearest are streetwear's allowances ([STR-8], [STR-9], [STR-10]) and the cap on problems adding up ([SCO-7], at most −1.0).
- **AI can see it:** no ("composed" isn't a reading).
- **Score effect suggested:** keep the charges; don't turn the loud-piece faults (color.5, pattern.1) into dealbreaker caps, so a composed outlier can still land in the 6s or 7s rather than the 4s.
- **Frame:** `inputs/youtube/shots/N8RAKkiqe1w/f-09-08.jpg` (unverified).

---

### Condition and fabric change the read

#### ix.29. Wear is character on denim, leather and vintage in casual worlds, a fault on crisp looks, and a stain is a fault everywhere
- **What changes what:** fade, patina, heel bite and authentic distressing raise a piece in streetwear, workwear, Americana or a lived-in look, and matter most on the focal piece (an aged leather jacket); the same wear is wrong in a smart outfit. A stain overshadows even the best outfit in any world.
- **The creators' own examples:**
  - Tim · `-e9Is50-fn0` · [09:54] · "look even better as they age" (denim jeans).
  - Tim · `_6-4CHHXg3c` · [08:08] · "I think the faded effect works really well" (with the blue, not grey or black); [08:40] · "I would definitely only wear this with a very casual outfit" (a heavily distressed hoodie).
  - Tim · `dk1efCZqwos` · [03:15] · "distressing denim in a way that felt so authentic"
  - Frugal · `RlcdMBj5Z2E` · [06:58] · "vintage if you want to really create some depth of character"
  - Frugal · `FPHnmY5FTaI` · [02:42] · "the whole lived in and imperfect nature of the look"
  - Frugal · `CsbsHWEBwy0` · [09:30] · "it's aging gracefully as I've been the only one"; Frugal · `hk4KWJiETTw` · [09:04] · "proving its tenacity through aging and patina"
  - Wanhee · `B9PIhkSQKuw` · [00:32] · "it looks like you lived your life with those clothes"
  - Tim · `IUMqpLeCT-E` · [00:33] · "don't let a great outfit be overshadowed by a simple stain"
- **Rules it links:** cond.3, cond.6, cond.1, cond.5, color.15.
- **Engine today:** has it differently [CON-1] (wear −0.4 except on pieces distressed by design; a stain −1.2), [SHO-11] (worn shoes −1.0), [WRK-7] (worn work boots and chukkas −0.5), [STY-3] (distressed jeans with a blazer −1.5). The engine reads patina and fade as wear and can't tell them from damage.
- **AI can see it:** weakly (`condition` flips between runs; [CON-5] counts only clear reads); fade no.
- **Score effect suggested:** no wear charge on jeans, denim jackets, leather jackets or boots when the outfit reads as streetwear, workwear or vintage sport (as [CON-6] already does for wrinkles); keep the stain charge everywhere, and consider dealbreakers S9's cap.
- **Frame:** `inputs/youtube/shots/CsbsHWEBwy0/f-09-35.jpg` (unverified).

#### ix.30. Fabric weight and drape decide the silhouette
- **What changes what:** the same cut is flattering or not by its fabric. Too thin looks flimsy, too stiff makes a boxy, "terrible" silhouette; heavy and flowing is the goal; softer, drapier fabric flatters fitted, oversized and boxy cuts alike; wide legs that hold their shape read relaxed, sagging ones read "baggy". Stiff heavy fabric widens a drop shoulder; soft fabric lets it fall.
- **The creators' own examples:**
  - Tim · `a7FgCE9NPmw` · [01:42] · "that can lead to a stiff silhouette which just looks terrible"
  - Tim · `wIib9hzVUuw` · [02:32] · "not understanding the impact of materials on cut"
  - Tim · `DwolmJNAw_k` · [03:26] · "The fit is oversized but precise"
  - Frugal · `FlQ3WZ-H2Ik` · [11:12] · "softer drapier Fabrics are always the ones that come across more flattering"
  - Frugal · `ove4zof6W2k` · [13:38] · "where the drop shoulder is placed but rather it is the fabric"
  - Tim · `vziGl_FxQb0` · [03:15] · "the word baggy has a sort of sagging connotation"
  - Wanhee · `B9PIhkSQKuw` · [02:10] · "everything's different the silhouette the way it fits the way it lasts"
- **Rules it links:** layer.11, fit.5, cond.4, fit.3.
- **Engine today:** lacks it (no fabric reading; [FIT-1] can't reward a good fit).
- **AI can see it:** no (fabric, drape and weight aren't read; `volume` and `strain` see only the result).
- **Score effect suggested:** none now; this is the main reason a fabric read matters (with ix.31 to ix.33).
- **Frame:** `inputs/youtube/shots/DwolmJNAw_k/f-03-30.jpg` (unverified).

#### ix.31. Texture stands in for color contrast, and rescues a plain or slim piece
- **What changes what:** in a one-color outfit, different surfaces (wool, cashmere, leather, nylon, faded vs new black) give the depth that color can't; grey on grey works "especially" with different textures. A rib texture lifts a slim tee Tim would otherwise fault. Texture can even be the one "point" of a simple outfit.
- **The creators' own examples:**
  - Frugal · `Vn6KlXkU2xA` · [05:56] · "just the way light hits a piece you're wearing" (leather against cotton, nylon against denim in all black).
  - Tim · `-e9Is50-fn0` · [02:44] · "Especially when you incorporate different textures." (grey sweatpants with grey knitwear).
  - Frugal · `Jh8dz-KZcfY` · [04:50] · "layered together with all the different shades and textures"
  - Tim · `XIYvycsZxDk` · [00:33] · "this outfit is all about texture" (grey wool trousers, scarf, cashmere-blend knit, white sneakers).
  - Tim · `SNjfZ5NKndc` · [03:32] · "the right texture will add depth to your outfit"
  - Tim · `vziGl_FxQb0` · [01:40] · "The rib texture makes it feel more elevated" (a slim tee).
  - Wanhee · `1wUp3RSAEqI` · [01:01] · "Maybe the very texture of the thing" (as the point).
- **Rules it links:** layer.1, layer.13, color.8, color.9, contrast.5, layer.12.
- **Engine today:** lacks it [MIN-8], KD-6: an all-black or tonal outfit earns nothing for texture or shade; [COL-7] is a tip; [PRO-13] charges a slim leg and [FIT-3] a pulling top whatever the texture.
- **AI can see it:** no (fabric and texture aren't read).
- **Score effect suggested:** none now; when fabric is read, make two or more textures in a one-color outfit one route to the tonal-depth credit dealbreakers L4 and L8 propose.
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-00-38.jpg` (unverified).

#### ix.32. Material decides whether a plain, quiet outfit lifts or sinks
- **What changes what:** boring cuts and no logos are a lift with exceptional construction and fabric (quiet luxury, minimal) and a fault in cheap fast fashion: the same shape, opposite results. Small changes in color, fit and fabric turn a regular piece into a favorite.
- **The creators' own examples:**
  - Frugal · `EnLlL2XKRCA` · [10:03] · "exceptional construction and highquality materials"
  - Frugal · `3RdxtHvsuxk` · [05:34] · "ironically just ends up looking like fast fashion" (deliberately boring cuts).
  - Tim · `dk1efCZqwos` · [08:45] · "Better fabric, better fit, better drape, without any logos"
  - Frugal · `5gKnDwVm_Eg` · [06:33] · "the reason I think this works without being basic or boring" (fit, fabric and pairing on a plain tee and trousers).
  - Frugal · `UidnEGXwZRk` · [11:14] · "minor tweaks to things such as color fit Fabric"
- **Rules it links:** fit.8, layer.11, pattern.3, color.7.
- **Engine today:** lacks it (no fabric; minimal's plain outfits earn the same as any plain outfit, [MIN-8]).
- **AI can see it:** no (fabric quality isn't visible reliably in a phone photo, and price never counts).
- **Score effect suggested:** none; keep it in Kit's explanations, not the score.
- **Frame:** `inputs/youtube/shots/EnLlL2XKRCA/f-10-08.jpg` (unverified).

#### ix.33. A fabric clash spoils matched colors; neighbouring pieces should differ in texture
- **What changes what:** two fabrics from different moods (a rich merino knit with shiny nylon shorts) look off "even if the colors match"; the same texture stacked (knit over knit) blurs. A soft knit against crisp, pleated trousers is the good version of texture contrast.
- **The creators' own examples:**
  - Wanhee · `ew3gCk1zkso` · [06:27] · "these Fabrics don't really match" and "even if the colors match"
  - Tim · `wIib9hzVUuw` · [05:06] · "it would have been better to contrast the textures" (a cardigan over a knit, a chunky multicolor scarf, dark slim jeans).
  - Tim · `jaOSdGqtgYY` · [06:59] · "knitwear and smart trousers this combo is the go-to casual attire"
  - Wanhee · `Uw-vpUq8Ewg` · [05:31] · "materials cut it all down apply minimalism"
- **Rules it links:** layer.6, layer.5, contrast.5, contrast.2.
- **Engine today:** has it differently [STY-11]: knit over knit is a tip only; fabric clashes aren't read.
- **AI can see it:** weakly (knit vs woven from category; nylon, merino and sheen no).
- **Score effect suggested:** keep [STY-11] a tip; nothing more until fabric is read.
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/o2-before-05-30.png` (matching: the knit-on-knit "before", cardigan over a knit with a chunky check scarf and cuffed dark jeans).

#### ix.34. Wearing a piece in changes how its fit reads
- **What changes what:** a new piece in the right size can look off with its fold lines and stiff, "angular" shoulders; after a couple of weeks it softens to the body and looks like it fits, even a little over- or undersized. Wear also changes how a tee fits over time.
- **The creators' own examples:**
  - Wanhee · `RtxJqd5Drps` · [09:12] · "it looks like the clothes fit you well"; [09:48] · "New clothes are like a new haircut."
  - Frugal · `FlQ3WZ-H2Ik` · [10:40] · "the way this specific shirt's material broke down and aged"
- **Rules it links:** cond.2, cond.3, fit.4.
- **Engine today:** has it in part [CON-6]: a wrinkled knit top costs nothing in streetwear, workwear, vintage sport, outdoor or no clear style; the reading has one "wrinkled" value, so fresh packet folds can't be told from soft rumple.
- **AI can see it:** weakly (`condition` wrinkled; "new" no).
- **Score effect suggested:** none; keep [CON-6].
- **Frame:** none (described only).

#### ix.35. Crispness carries formality: a pressed crease lifts a soft trouser to smart
- **What changes what:** a center crease and stitched pleats keep an elastic-waist or track-style trouser reading as a smart trouser; losing the crease, or lint and unpolished shoes, drops the outfit a level.
- **The creators' own examples:**
  - Tim · `2KblatXQTGs` · [03:14] · "they still feel like a smart trouser thanks to the center crease"
  - Tim · `vziGl_FxQb0` · [02:45] · "the comfort of a jogger, but with a sharper silhouette" (stitched pleats, straight leg).
  - Tim · `0JtnbgtbQfE` · [01:07] · "ideally something with a center press crease"
  - Tim · `XSF9AOx7sdU` · [05:49] · "his shoes polished and his coats lint free"
- **Rules it links:** cond.2, suit.5, suit.11.
- **Engine today:** has it differently: pull-on trousers sit below trousers in dressiness, pleated track pants read as sweats or pull-on; wrinkles cost on trousers ([CON-1], [CON-6]); a crease isn't read.
- **AI can see it:** weakly (subcategory pull-on vs trousers; crease no).
- **Score effect suggested:** none; a tip at most.
- **Frame:** `inputs/youtube/shots/2KblatXQTGs/f-03-19.jpg` (unverified).

---

### Occasion changes everything

#### ix.36. The same outfit in the wrong place is a bad outfit, in both directions
- **What changes what:** an impressive head-to-toe designer outfit on a plain afternoon, a suit to a barbecue, or a suit jacket everywhere reads as too much; an understated outfit next to a dressed-up date is right; at a dress code, meeting it in its own color and still standing out is the move. Night pulls the palette darker. Jaye is the one voice for always being a little overdressed.
- **The creators' own examples:**
  - Tim · `IUMqpLeCT-E` · [00:00] · "a good outfit in the wrong place can be a bad outfit"
  - Frugal · `YFxXWWM5YRI` · [07:30] · "do you really have to be wearing that right now"
  - Frugal · `LkN3yI1-TB4` · [03:49] · "how are you just outside in full balenci at 2:30 p.m."
  - Wanhee · `kAaM_zcxh_U` · [04:50] · "you're dressed well, but in an understated way"
  - Wanhee · `mpv9WWHDZio` · [08:14] · "He knows that he's just a dad going to a gallery."
  - Jaye · `Jz9QVWgBbOg` · [11:10] · "If you wear a suit jacket everywhere to every occasion"; other side: Jaye · `7K2qRZaXX3w` · [00:00] · "never ever go to any occasion and not be overdressed ever"
  - Jaye · `UcLBvcmnnus` · [11:50] · "You still pop out with a fit" (an all-white code met).
  - Tim · `vQ6_okzfNSs` · [03:12] · "for nighttime outings I would rather opt for darker colors"
- **Rules it links:** season.1, season.2, season.12, season.14, suit.14, color.16.
- **Engine today:** has it [OCC-1] (too casual: up to −0.5 and falling ceilings), [OCC-2] (overdressed: up to −0.5 past 1.5 levels), [OCC-3]–[OCC-7]; no color by occasion (Going out has no darker-palette rule) and no dress-code color input.
- **AI can see it:** yes for dressiness (category per piece, with the occasion he picks); time of day no.
- **Score effect suggested:** keep; the four (Jaye aside) would allow at most a small step up from the room, which [OCC-2] already does. No color rule for night.
- **Frame:** `inputs/youtube/shots/LkN3yI1-TB4/f-03-54.jpg` (unverified).

#### ix.37. The shoe and one layer move the same core outfit up or down a level
- **What changes what:** the shoe and the outer layer are the dials: boots, loafers or a leather shoe dress jeans or a tailored coat over light denim up; white or chunky sneakers dress a smart outfit down; a tank or tee under a suit turns it summer smart casual; crisp tailoring worn without a tie reads quiet luxury. Smart casual should lean a little smarter.
- **The creators' own examples:**
  - Tim · `uGregWdLahU` · [00:00] · "dress down a smart outfit compliment a casual one" (white sneakers).
  - Tim · `vQ6_okzfNSs` · [01:05] · "works beautifully when tied together with the leather shoe" (a tailored coat over light denim).
  - Tim · `2KblatXQTGs` · [00:34] · "wear it with a suit for a different take on smart casual" (a tank) and "just make sure the shirt is not too formal"
  - Tim · `jaOSdGqtgYY` · [06:59] · "crisp tailoring especially when worn casually without a tie"
  - Tim · `vQd36IKIkOg` · [07:14] · "pairing a traditionally smarter piece like a blazer with a traditionally casual"; [08:18] · "preferably leaning towards the smarter side"
  - Tim · `-V2bE8nDsdo` · [03:04] · "the tank top dresses it down slightly" (under a blazer with smart trousers).
  - Wanhee · `tNVdA_arEa8` · [02:36] · "wearing sneakers with Formal Wear" (going against expectation; "if you do too much" it "just looks try hard").
- **Rules it links:** season.13, contrast.2, contrast.4, shoe.6, shoe.7, suit.8, suit.10, layer.9, layer.10.
- **Engine today:** has it [SHO-4]/[SHO-5] (the shoe judged against the clothes' dressiness), [STY-4] (a high-low mix excused under a jacket; a tank or tee under a layer judged by the layer), the occasion bands; has the blazer-with-relaxed-jeans case the other way ([STY-3] −1.5, which is Tim's own outfit).
- **AI can see it:** yes (category, subcategory, `color_family` for wash).
- **Score effect suggested:** keep; the open founder call is [STY-3] (the four would charge a blazer with relaxed or light jeans nothing, `1-shape.md` suit.9).
- **Frame:** `inputs/youtube/shots/vQ6_okzfNSs/f-01-10.jpg` (unverified).

#### ix.38. Mix two formality tiers, not three; on a casual base, one smart piece is the recipe
- **What changes what:** sweatpants with one smarter piece (a shirt, an overcoat, minimal loafers) look deliberately dressed up; more than one smart piece, or a third tier, breaks it. Minimal loafers are what make sweatpants with loafers work.
- **The creators' own examples:**
  - Tim · `0JtnbgtbQfE` · [06:36] · "the key though is to only ever mix two of these categories"
  - Tim · `-e9Is50-fn0` · [07:39] · "this works best when there's just one smarter element"
  - Tim · `-V2bE8nDsdo` · [03:04] · "Sweatpants with loafers can be a risky move" and "the design of these loafers is so minimal"
  - Tim · `IUMqpLeCT-E` · [01:09] · "a shirt and tie mixed in with street wear" (his tension example).
- **Rules it links:** contrast.3, contrast.1, shoe.6, season.13.
- **Engine today:** has it differently [STY-4] (a gap of 2.5+ dressiness levels −1.5, 3.5+ −4.0, excused under a jacket), [LNG-2] (sweats held to 5.5/6.5/7.5 by signs of intent, so sweats with an overcoat and a real shoe reach 7.5 at most), [SHO-6] (dress shoes with sweats up to −0.5). It counts levels, not tiers, and has no "one smart piece" credit.
- **AI can see it:** yes (category per piece; dressiness levels).
- **Score effect suggested:** let minimal loafers count as the "real shoe" sign of intent in [LNG-2] without [SHO-6]'s charge (dealbreakers S8's widening); otherwise keep.
- **Frame:** `inputs/youtube/shots/-e9Is50-fn0/f-07-44.jpg` (unverified).

---

### Not scorable from a photo
- Intent and effort: whether a different piece is real expression or "peacocking", and how visible the effort is (Wanhee `r3lqb8Nvf2g`, `mpv9WWHDZio`).
- Whether a hero piece is famous or unknown, and whether a luxury piece is "believed" on the wearer (Frugal `3RdxtHvsuxk`; Jaye `cwLasFLe-DY`).
- A personal story or originality behind a template outfit (Frugal `2QZhiKgPceA`).
- A piece's place in his wider wardrobe system (Frugal `N8RAKkiqe1w` [05:54]; Frugal `_4g9z4ELSj0`).
- Brand, price, collab status and overexposure of a piece (Frugal `bDcAzeTM4PA`, `b1S3XoaRa3k`; Jaye `7K2qRZaXX3w` [05:50]).
- Quality details that only show up close (ribbing, stitch density) in a full-length photo (Tim `jaOSdGqtgYY` [09:44]).
- Size labels against fit (Frugal `JY_zrt43cbU` [07:39]).
- Pose and manner (Wanhee `hrOwm3gASxc`): the app must not let pose move the score.
- Accessories as contrast or finishing (jewelry, headphones, a bag, socks): never counted ([SCO-6]).
- Time of day, and whether the outfit is worn at the wrong time beyond the occasion he picks.


*(This part's notes for the dealbreakers sheet are in the "Creators say (T95)" column of `rubric/research/dealbreakers.md`.)*

---

## 6. The 60 anchor outfits
The founder's ladder and the paper test (T68) are tuned on these. Each was recaptured as a burst of 11 stills across its 30-second block (every 3 s, contact sheet `inputs/youtube/shots/<id>/aNN-sheet.jpg`), and the still that shows the judged outfit was picked by eye. **50 verified, 10 partly** (a flat lay, a drawn figure, a collage, or an outfit not fully on yet; usable with care). Two Wanhee anchors (a25, a26) were swapped for the toning-down examples actually on screen in that segment. **Step** is a suggested place on the 3–9.5 ladder from the creator's verdict, for the founder to confirm; it is not a score.

| # | Kind | Video | At | Outfit | Verdict | Step | Still | Status |
|---|---|---|---|---|---|---|---|---|
| a01 | layered | `wIib9hzVUuw` | 04:04 | Tim BEFORE 1: oversized tee, baggy denim jacket, very skinny jeans, black boots | bad: top-heavy, "too extreme a shift" | 4.5 | `inputs/youtube/shots/wIib9hzVUuw/a01-04-10.jpg` | **verified** |
| a02 | layered | `wIib9hzVUuw` | 05:06 | Tim BEFORE 2: tan cap, tan knit, knit cardigan, multicolor chunky scarf, dark slim jeans, white sneakers | bad: knit on knit, top-heavy scarf | 5 | `inputs/youtube/shots/wIib9hzVUuw/a02-05-21.jpg` | **verified** |
| a03 | layered | `wIib9hzVUuw` | 09:10 | Tim BEFORE 4: tight beige pants, tight beige overshirt over a layer, sneakers | bad on fit: "pulling at the thighs" | 5 | `inputs/youtube/shots/wIib9hzVUuw/a03-09-16.jpg` | **verified** |
| a04 | plain | `wIib9hzVUuw` | 10:10 | Tim BEFORE 5: skinny leather joggers, white sneakers, top with yellow details | bad: "an abomination" | 4 | `inputs/youtube/shots/wIib9hzVUuw/a04-10-22.jpg` | **verified** |
| a05 | summer | `XtcY-zmoS-E` | 06:38 | Frugal: wide trousers too long, piling and dragging | bad: "the whole thing is trash" | 4.5 | `inputs/youtube/shots/XtcY-zmoS-E/a05-06-44.jpg` | **verified** |
| a06 | plain | `zJ5LCenTcf8` | 00:05 | Tim (satire): skin-tight tapered trousers showing ankle, second-skin tee | bad | 3.5 | `inputs/youtube/shots/zJ5LCenTcf8/a06-00-18.jpg` | **verified** |
| a07 | plain | `zJ5LCenTcf8` | 00:42 | Tim (satire): bold colors and striking patterns clashed | bad | 3.5 | `inputs/youtube/shots/zJ5LCenTcf8/a07-00-45.jpg` | **verified** |
| a08 | plain | `zJ5LCenTcf8` | 02:18 | Tim (satire): logo top, logo bottom, logo hat | bad | 4 | `inputs/youtube/shots/zJ5LCenTcf8/a08-02-36.jpg` | **verified** |
| a09 | plain | `Vn6KlXkU2xA` | 00:05 | Frugal: flat jet-black outfit, restaurant staff | bad: flat tones | 6 | `inputs/youtube/shots/Vn6KlXkU2xA/a09-00-30.jpg` | **partly**: drawn figure, flat all-black |
| a10 | layered | `FFDYIGhiIk8` | 09:10 | Frugal: Rick Owens sneakers, Amiri jeans, Balenciaga jacket | bad: three designer worlds | 5 | `inputs/youtube/shots/FFDYIGhiIk8/a10-08-55.jpg` | **partly**: a collage of the pieces, not worn |
| a11 | plain | `FFDYIGhiIk8` | 10:40 | Frugal: Triple S, cargos, vintage tee (label stacking) | bad: "you don't need that" | 5 | `inputs/youtube/shots/FFDYIGhiIk8/a11-10-40.jpg` | **partly**: a drawn figure wearing the stack |
| a12 | layered | `TUYSTimnDJg` | 05:30 | Frugal: the e-boy pile (graphics, striped long sleeve under a tee, chains, Old Skools) | bad: "doesn't make any sense" | 4.5 | `inputs/youtube/shots/TUYSTimnDJg/a12-05-57.jpg` | **verified** |
| a13 | plain | `eAvgvOHKPPw` | 06:30 | Frugal: tan suede Chelsea boots with skinny jeans | bad: dated | 5.5 | `inputs/youtube/shots/eAvgvOHKPPw/a13-06-35.jpg` | **verified** |
| a14 | plain | `b1S3XoaRa3k` | 02:12 | Frugal: chunky Balenciaga sneakers with very wide jeans | bad: "doesn't actually work in your outfit" | 5.5 | `inputs/youtube/shots/b1S3XoaRa3k/a14-02-15.jpg` | **partly**: a flat lay of the outfit, not worn |
| a15 | plain | `XtcY-zmoS-E` | 04:07 | Frugal: slim pants with a wide or oversized top | worse: "does not achieve the same results" | 5.5 | `inputs/youtube/shots/XtcY-zmoS-E/a15-04-28.jpg` | **verified** |
| a16 | layered | `WMwH8xtSOWA` | 05:35 | Frugal: ill-fitting shirt under a bomber, pants that don't sit well | bad: "does work… in a bad way" | 5 | `inputs/youtube/shots/WMwH8xtSOWA/a16-05-48.jpg` | **partly**: a drawn figure |
| a17 | layered | `wIib9hzVUuw` | 07:07 | Tim BEFORE 3: navy cuffed jeans, navy tee, navy check flannel, contrasting sneakers | okay: "basic and predictable" | 6.5 | `inputs/youtube/shots/wIib9hzVUuw/a17-07-25.jpg` | **verified** |
| a18 | plain | `ASQGKf8ve5g` | 01:11 | Frugal's skit: black tee, blue jeans, white sneakers | okay: the plain floor | 7 | `inputs/youtube/shots/ASQGKf8ve5g/a18-01-33.jpg` | **verified** |
| a19 | summer | `-V2bE8nDsdo` | 02:34 | Tim: straight blue jeans, oversized white tee, white sneakers | okay: "men's basics 101" | 7 | `inputs/youtube/shots/-V2bE8nDsdo/a19-02-37.jpg` | **verified** |
| a20 | plain | `tNVdA_arEa8` | 08:40 | Wanhee: the boyfriend look, plain white tee, black shoes | okay: safe, boring | 6.5 | `inputs/youtube/shots/tNVdA_arEa8/a20-09-07.jpg` | **partly**: a plain basic outfit (black tee, light trousers, white sneakers) shown for the boyfriend look |
| a21 | summer | `OqoUgLxknJc` | 07:41 | Tim's guest 1: off-white tee, light 501s, black Chuck 70s | okay-good: "classic simple" | 7 | `inputs/youtube/shots/OqoUgLxknJc/a21-07-44.jpg` | **verified** |
| a22 | summer | `OqoUgLxknJc` | 07:41 | Tim 1: light straight relaxed jeans, white oversized tee, white sneakers | okay: "a very solid base" | 7 | `inputs/youtube/shots/OqoUgLxknJc/a21-07-56.jpg` | **verified** |
| a23 | layered | `uBsIrt-zU0I` | 02:57 | Wanhee: fundamentals (khaki, brown, grey, navy) | okay: "It looks fine" | 7 | `inputs/youtube/shots/uBsIrt-zU0I/a23-03-02.jpg` | **verified** |
| a24 | layered | `2QZhiKgPceA` | 01:50 | Frugal: the TikTok fit (oversized hoodie, boxy tee, baggy pants) | okay: "nothing wrong with this style" | 7 | `inputs/youtube/shots/2QZhiKgPceA/a24-01-47.jpg` | **verified** |
| a25 | plain | `tNVdA_arEa8` | 00:31 | Wanhee: a bright purple shirt under a dark coat (toning down) | good: the dark coat tones the bright down | 8 | `inputs/youtube/shots/tNVdA_arEa8/a25-00-34.jpg` | **verified** |
| a26 | layered | `tNVdA_arEa8` | 01:02 | Wanhee: a bright red jacket over dark pants (toning down) | good: dark pants balance the bright jacket | 7.5 | `inputs/youtube/shots/tNVdA_arEa8/a26-01-23.jpg` | **verified** |
| a27 | layered | `wIib9hzVUuw` | 04:35 | Tim AFTER 1: oversized white tee, cropped grey denim jacket, relaxed jeans, black boots | good: "small changes" | 7.5 | `inputs/youtube/shots/wIib9hzVUuw/a27-04-59.jpg` | **verified** |
| a28 | layered | `wIib9hzVUuw` | 05:36 | Tim AFTER 2: off-white knit, cream cap, plain scarf, light relaxed jeans, white sneakers | good: "cleaner and a more balanced outfit" | 7.5 | `inputs/youtube/shots/wIib9hzVUuw/a28-06-00.jpg` | **verified** |
| a29 | summer | `wIib9hzVUuw` | 09:40 | Tim AFTER 4: beige wide smart trousers, tucked ribbed tee, relaxed short-sleeve shirt, loafers | good: "night and day difference" | 8.5 | `inputs/youtube/shots/wIib9hzVUuw/a29-10-04.jpg` | **verified** |
| a30 | layered | `wIib9hzVUuw` | 10:40 | Tim AFTER 5: straight leather trousers, oversized black tee, black sweater, black sneakers | good | 8 | `inputs/youtube/shots/wIib9hzVUuw/a30-11-01.jpg` | **verified** |
| a31 | summer | `XtcY-zmoS-E` | 03:37 | Frugal: tight tee or tank over wide high-waisted trousers | good: "my bread and butter for the whole summer" | 8 | `inputs/youtube/shots/XtcY-zmoS-E/a31-03-52.jpg` | **verified** |
| a32 | summer | `XtcY-zmoS-E` | 07:11 | Frugal: the same trousers hemmed | good: wears them "with like everything" | 7.5 | `inputs/youtube/shots/XtcY-zmoS-E/a32-07-14.jpg` | **verified** |
| a33 | summer | `Vn6KlXkU2xA` | 02:44 | Frugal: faded vintage black tee with new black pants | good: "one-two punch" | 7.5 | `inputs/youtube/shots/Vn6KlXkU2xA/a33-03-11.jpg` | **partly**: flat lay, not worn |
| a34 | layered | `Vn6KlXkU2xA` | 07:07 | Frugal: shiny black nylon bomber with black jeans | good: "like fries in a burger" | 7.5 | `inputs/youtube/shots/Vn6KlXkU2xA/a34-07-20.jpg` | **verified** |
| a35 | plain | `Vn6KlXkU2xA` | 06:33 | Frugal: fairly baggy black pants, black leather boots peeking out | good: his daily outfit | 8 | `inputs/youtube/shots/Vn6KlXkU2xA/a35-06-55.jpg` | **verified** |
| a36 | suit | `-V2bE8nDsdo` | 02:34 | Tim: jeans and tee plus a relaxed blazer and black loafers | good: "effortless smart casual" | 8 | `inputs/youtube/shots/-V2bE8nDsdo/a36-02-50.jpg` | **verified** |
| a37 | suit | `-V2bE8nDsdo` | 04:07 | Tim: blazer with jeans and a tee | good: "cool professor" | 8 | `inputs/youtube/shots/-V2bE8nDsdo/a37-04-34.jpg` | **verified** |
| a38 | layered | `-V2bE8nDsdo` | 03:04 | Tim: grey sweatpants, flannel, minimal black loafers | good: "sweet spot between laid-back and refined" | 7.5 | `inputs/youtube/shots/-V2bE8nDsdo/a38-03-28.jpg` | **verified** |
| a39 | layered | `OqoUgLxknJc` | 13:00 | Tim's guest 7: cropped grey sweatshirt, white tee hanging out, light Levi's, Converse | good: "good proportions" | 7.5 | `inputs/youtube/shots/OqoUgLxknJc/a39-13-27.jpg` | **verified** |
| a40 | suit | `OqoUgLxknJc` | 10:52 | Tim 5: grey blazer, light jeans, white tank, black Chelsea boots | good: the casual blazer | 8 | `inputs/youtube/shots/OqoUgLxknJc/a40-11-19.jpg` | **verified** |
| a41 | suit | `OqoUgLxknJc` | 11:58 | Tim 6: full grey suit, turtleneck, white sneakers | good: casual, every day | 8 | `inputs/youtube/shots/OqoUgLxknJc/a41-12-19.jpg` | **verified** |
| a42 | layered | `XIYvycsZxDk` | 00:38 | Tim: grey wool trousers, grey scarf, grey knit, white sneakers | good: "classy muted cozy" | 8.5 | `inputs/youtube/shots/XIYvycsZxDk/a42-00-45.jpg` | **verified** |
| a43 | suit | `XIYvycsZxDk` | 02:55 | Tim: black textured suit, thermal under, houndstooth long coat | good: winter suit | 8.5 | `inputs/youtube/shots/XIYvycsZxDk/a43-03-05.jpg` | **verified** |
| a44 | layered | `XIYvycsZxDk` | 01:50 | Tim: blue straight jeans, cream hoodie, black low-tops, brown wool jacket | good: many colors, all neutral | 7.5 | `inputs/youtube/shots/XIYvycsZxDk/a44-02-09.jpg` | **verified** |
| a45 | layered | `vQ6_okzfNSs` | 01:43 | Tim: grey baggy jeans, grey hoodie, white tee peeking, white sneakers | good: tonal | 8 | `inputs/youtube/shots/vQ6_okzfNSs/a45-01-53.jpg` | **verified** |
| a46 | summer | `2KblatXQTGs` | 01:40 | Tim: off-white cotton-linen wide work pants, oversized white tee | good: "effortless Chic" | 8 | `inputs/youtube/shots/2KblatXQTGs/a46-01-38.jpg` | **verified** |
| a47 | summer | `o5RnTT2oafg` | 04:30 | Tim: pleated wide trousers, shirt over a tank | good: "perfect for the smarter summer looks" | 8 | `inputs/youtube/shots/o5RnTT2oafg/a47-04-25.jpg` | **verified** |
| a48 | layered | `YGm7JMniGVc` | 00:40 | Tim (lookbook): mock-neck knit, white pleated trousers, derbies | good: "some clean styling" | 8 | `inputs/youtube/shots/YGm7JMniGVc/a48-00-47.jpg` | **verified** |
| a49 | summer | `uBsIrt-zU0I` | 02:21 | Wanhee: white tee, military-green pants, beige cap | good: works | 7.5 | `inputs/youtube/shots/uBsIrt-zU0I/a49-02-37.jpg` | **partly**: white tee and green pants, cap not on yet |
| a50 | suit | `7K2qRZaXX3w` | 03:14 | Jaye: interview suit and tie with a trench coat | good | 8 | `inputs/youtube/shots/7K2qRZaXX3w/a50-03-17.jpg` | **partly**: two suited figures side by side, the right one with a long coat |
| a51 | suit | `-V2bE8nDsdo` | 04:37 | Tim: oversized white tee tucked into tailored trousers | great: "my favorite kind of outfit" | 9 | `inputs/youtube/shots/-V2bE8nDsdo/a51-04-57.jpg` | **verified** |
| a52 | layered | `wIib9hzVUuw` | 07:37 | Tim AFTER 3: black flannel statement, white tank, double-pleated black trousers, minimal loafers | great: "a lot better" | 9 | `inputs/youtube/shots/wIib9hzVUuw/a52-08-35.jpg` | **partly**: base outfit without the flannel |
| a53 | layered | `0ilmLux6mPg` | 07:47 | Tim: beige broad-shouldered jacket, pleated balloon trousers barely breaking | great: the relationship between pieces | 9.5 | `inputs/youtube/shots/0ilmLux6mPg/a53-08-06.jpg` | **verified** |
| a54 | layered | `YGm7JMniGVc` | 03:50 | Tim (lookbook): turquoise fleece, black overcoat, cuffed mid-wash denim, Docs | great: "the best one yet" | 9 | `inputs/youtube/shots/YGm7JMniGVc/a54-03-45.jpg` | **verified** |
| a55 | summer | `YGm7JMniGVc` | 01:38 | Tim (lookbook): boxy utility jacket with shorts, black and brown | great: "silhouette of the outfit is on point" | 8.5 | `inputs/youtube/shots/YGm7JMniGVc/a55-01-39.jpg` | **verified** |
| a56 | plain | `XtcY-zmoS-E` | 04:38 | Frugal: his own jeans, waist taper, wide thigh, drape | great: "hourglass" | 8.5 | `inputs/youtube/shots/XtcY-zmoS-E/a56-04-53.jpg` | **verified** |
| a57 | plain | `8rmkOpCbFTM` | 05:03 | Frugal: slim sneakers under generous pants stacking, toe showing | great: "great contrast" | 8.5 | `inputs/youtube/shots/8rmkOpCbFTM/a57-05-16.jpg` | **verified** |
| a58 | plain | `WDsQRHa8jBY` | 09:17 | Frugal: flared pants over boots | great: his favorite pairing | 8.5 | `inputs/youtube/shots/WDsQRHa8jBY/a58-09-30.jpg` | **verified** |
| a59 | suit | `Pxeeh-caTJg` | 19:39 | Jaye: his "perfect" all-black (open blazer, flares, heavy boots) | great | 9 | `inputs/youtube/shots/Pxeeh-caTJg/a59-19-39.jpg` | **verified** |
| a60 | suit | `OqoUgLxknJc` | 17:18 | Tim 9: black shirt, white tank peeking, grey suit pieces, Chelsea boots | great: "the classiest" | 8.5 | `inputs/youtube/shots/OqoUgLxknJc/a60-17-33.jpg` | **verified** |

**Coverage by step:** 3.5: 2, 4: 2, 4.5: 3, 5: 5, 5.5: 3, 6: 1, 6.5: 2, 7: 6, 7.5: 10, 8: 13, 8.5: 8, 9: 4, 9.5: 1. **Thin:** 3.0 has none (no real outfit the four call that bad); 3.5–4.5 rests on Tim's satire video plus three real faults; 6–6.5 has only 3 (the creators rarely say "okay but flawed"); 9–9.5 has 5. 7–8.5 is well covered (37 of 60). The founder's blind ratings (Y32) and his own worst and best outfits are the way to fill both ends.

The full catalogue of all 458 judged outfits (verdicts, bands and near-stamp stills, most unverified) is `notes/2026/synth/6-examples.md`.

---

## 7. Video list
Every video below is from 2023 or later (upload dates from YouTube). "Read" means its transcript was read in full by a reader under `notes/2026/BRIEF.md` (or in October under `notes/BRIEF.md`); transcripts are in `inputs/youtube/clean/<id>.txt` (git-ignored), frames in `inputs/youtube/shots/<id>/`.

### Tim Dessaint: 33 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2023-02-13 | `XSF9AOx7sdU` | How To Always Be Well Dressed (even when in a rush) | read |
| 2023-02-23 | `K2HS3_8cTx8` | The BEST UNIQLO Essentials | read |
| 2023-03-27 | `RrGbfY6NTZI` | What The Colors You Wear Say About You | read |
| 2023-04-30 | `vQ6_okzfNSs` | 15 Spring Outfit Ideas | read |
| 2023-05-13 | `2KblatXQTGs` | Top 5 UNIQLO Summer Essentials | read |
| 2023-06-18 | `OqoUgLxknJc` | 9 Items, 9 Outfits (capsule wardrobe challenge) | read |
| 2023-07-23 | `jaOSdGqtgYY` | Why Quiet Luxury Became The Biggest Fashion Trend | read |
| 2023-09-12 | `YGm7JMniGVc` | The BEST UNIQLO Pieces / Fall 2023 | read |
| 2023-11-21 | `XIYvycsZxDk` | FALL/WINTER OUTFITS (minimalist/quiet luxury edition) | read |
| 2023-12-18 | `FUWET2HH-us` | UNIQLO Essentials For Winter | read |
| 2023-12-29 | `63Fam1rwvk4` | How To Find Your Style | read |
| 2024-03-11 | `uGregWdLahU` | The BEST White Sneakers Right Now | read |
| 2024-04-01 | `zJ5LCenTcf8` | How To Look Bad In Your Clothes | read |
| 2024-05-31 | `o5RnTT2oafg` | The BEST UNIQLO Summer Pieces (2024) | read |
| 2024-07-09 | `UNkA9HhbjXY` | What Are People Wearing in London (UK)? | read |
| 2024-08-18 | `0JtnbgtbQfE` | Never Struggle To Put An Outfit Together Again | read |
| 2024-09-23 | `_6-4CHHXg3c` | The BEST New Menswear Items Right Now | read |
| 2024-11-18 | `IUMqpLeCT-E` | The 10 Commandments Of Style | read |
| 2025-03-27 | `-e9Is50-fn0` | 25 Things I Find Effortlessly Stylish | read |
| 2025-04-17 | `DwolmJNAw_k` | I Spent 2 Years Making The Perfect White T-Shirt | read |
| 2025-06-26 | `-V2bE8nDsdo` | 10 ITEMS, 10 OUTFITS (minimal wardrobe challenge) | read |
| 2025-07-20 | `SNjfZ5NKndc` | How To Elevate Your Style | read |
| 2025-08-31 | `poTk87gGHtg` | The Lie of “Timeless” Fashion | read |
| 2025-09-28 | `wIib9hzVUuw` | Recreating & Improving My Old Outfits (style tips you can use) | read |
| 2025-10-16 | `vziGl_FxQb0` | 11 Affordable Menswear Pieces Worth Buying Right Now | read |
| 2025-11-30 | `TxQUqvHXyJA` | How Knitwear Went From Survival Gear to Luxury Fashion | read |
| 2025-12-16 | `f1Ub9Zku0lI` | How to Find Your Signature Style | read |
| 2026-02-03 | `CJv4TGLrdig` | 8 Winter Wardrobe Essentials You Actually Need | read |
| 2026-03-01 | `30L-EHe4WAQ` | 2026 fashion trends I’d actually wear (and the ones I’ll skip) | read |
| 2026-05-04 | `vQd36IKIkOg` | STOP following these “fashion rules” | read |
| 2026-06-07 | `dk1efCZqwos` | 6 Japanese fashion brands you should know about | read |
| 2026-06-15 | `a7FgCE9NPmw` | Attempting to create the best oversized T-shirts in the world | read |
| 2026-09-23 | `0ilmLux6mPg` | This is how you actually develop style | read |

### Wanhee Kim: 14 read, 6 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2023-07-27 | `ew3gCk1zkso` | How To Dress Well As An Average Guy - 10 Style Tips I Wish I Learned Sooner | read |
| 2023-10-15 | `r_xTEgMysu4` | 8 BEST Purchases To Become Aesthetic In 2023 | skipped: gym and grooming purchases (no clothing rules) |
| 2024-07-21 | `e2MgmGDLV9Q` | Why Koreans Dress Better (6 Fashion Tips) | read |
| 2024-08-04 | `Uw-vpUq8Ewg` | Minimalism is making me limitless | read |
| 2024-11-24 | `tNVdA_arEa8` | Why Koreans Dress Better Pt.2 (8 Fashion Tips) | read |
| 2024-12-29 | `rNCrnP-os0U` | How to unf＊ck your style in 2025 (8 fashion tips) | read |
| 2025-01-26 | `B9PIhkSQKuw` | Why Japanese People Dress Better (5 Fashion Tips) | read |
| 2025-02-23 | `dKl6pohkzoA` | 7 Secrets To Dressing Well That NOBODY Tells You | read |
| 2025-04-07 | `qG4WE83aKtM` | 'Body vs Style' Graph | skipped: about bodies (body fat vs style) |
| 2025-06-08 | `kAaM_zcxh_U` | How To Glow Up In 2025 (For Guys) | read |
| 2026-03-15 | `r3lqb8Nvf2g` | Why Do Some People Just Look So Cool? | skipped: character and carriage, not clothes (97% skipped by the reader) |
| 2026-04-05 | `52A8D55bqL8` | The Art of Dressing Well | read |
| 2026-05-10 | `uBsIrt-zU0I` | The Laziest Way To Dress Well (Without Overthinking) | read |
| 2026-05-17 | `qR__VvMFfHY` | If You're Lazy But Want To Look Good, Watch This. | skipped: training, diet and grooming (no clothing rules) |
| 2026-06-14 | `Mr-GzwGQ1qY` | I'm Making The 'Perfect' White Tee | read |
| 2026-06-21 | `1wUp3RSAEqI` | 10 Fashion Tips I Wish I Knew Sooner | read |
| 2026-06-28 | `hrOwm3gASxc` | Why Do Some People Just Look So Good? | skipped: expression, posture, voice (no clothing rules) |
| 2026-07-05 | `RtxJqd5Drps` | Dress Better Without Trying | read |
| 2026-07-12 | `hSOQ7K4RVvQ` | It took me 9 years to learn what I'll teach you in 9 minutes | skipped: fitness and coaching (no clothing rules) |
| 2026-11-08 | `mpv9WWHDZio` | 5 Levels of Style | read |

### Jaye Alexander: 16 read, 12 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2024-12-23 | `4mxP8JPR1RQ` | Its Deeper Than Fashion. | skipped: mindset talk (0.5%) |
| 2024-12-30 | `23ZCHsp9AZU` | How To Get Into Fashion in 2025 | read |
| 2025-02-08 | `7K2qRZaXX3w` | Why YOU Should Always Overdress | read |
| 2025-02-15 | `sOfjDjtjBWM` | Baggy Jeans Or Skinny Jeans？ ｜ JA ANSWERS PART 1 | read |
| 2025-02-24 | `mGCJqaxlDno` | How To TRANSFORM Yourself ( EVERYONE will notice) | skipped: self-improvement talk (0.3%) |
| 2025-03-11 | `CI-wkEOHRAg` | This Video Will INSTANTLY Improve YOUR Fashion | read |
| 2025-04-19 | `VUEaMYx10mM` | How To Master Style | read |
| 2025-06-09 | `Ulx1vjAREu0` | 10 Style Aesthetics Explained | read |
| 2025-06-30 | `7NA_DuKMhaU` | This Video Will INSTANTLY Improve Your Confidence | skipped: confidence talk (0.1%) |
| 2025-07-31 | `N0nN17cwVqo` | How To Take FIRE Pictures Of Yourself | skipped: taking photos of yourself (camera tips, not judging); kept aside for the camera guidance |
| 2025-09-16 | `5Dfr0PXTTpM` | 10 Mens Style Aesthetics Explained (Part 2) | read |
| 2025-09-29 | `ctdMGExbNws` | How To MASTER Accessorizing IN LITERALLY 20 MINUTES | read |
| 2025-10-25 | `IFqAT-at9i4` | This Is The ONLY VIDEO You Need On Hair (Hair Guide) | skipped: hair |
| 2025-11-13 | `rSgyKJ9F6eg` | How to Get Clear Skin For Guys ASAP (from a model) | skipped: skin care |
| 2025-11-18 | `E_G76yxQgfU` | What You ACTUALLY Need to Make Clothes #promo #vevor | skipped: sewing-gear promo |
| 2025-12-02 | `daeLn_qLeew` | JA AUTHENIC-MAS Trailer ｜ Giveaway, Marathon | skipped: trailer |
| 2025-12-08 | `Pxeeh-caTJg` | How To Build A FIRE Wardrobe Properly (Essentials ⧸Grails) | read |
| 2025-12-23 | `AadxlP3kEmI` | The Formula To Dress FIRE | read |
| 2026-02-08 | `cXX8cHqR-gk` | 70,000 Subscribers Later.. | skipped: channel update |
| 2026-02-09 | `Jz9QVWgBbOg` | The ULTIMATE Jacket Wardrobe Guide (buying, layering, styling) | read |
| 2026-03-24 | `YOBU2_ldXI0` | How to Be Attractive so Fast it Feels UNFAIR | skipped: attractiveness, not clothes (0.3% clothing words) |
| 2026-05-09 | `RIuzSb8OLMM` | How To Build The TUFFEST Spring Wardrobe | read |
| 2026-05-30 | `UcLBvcmnnus` | 7 Levels Of Fashion Explained ( %99 Stuck At Level 3) | read |
| 2026-07-05 | `X1shQbDvEtg` | The ULTIMATE 10 Tips To Look 10X More ATTRACTIVE (Even If Your Average) | skipped: attractiveness, not clothes (0.1%) |
| 2026-07-19 | `1nntxNqbmk8` | How To Dress To Get EVERY Girl (Science Based , Swag Guide) | read |
| 2026-08-12 | `ws2jf0Yp_4c` | How To Build The PERFECT Back To School Wardrobe | read |
| 2026-09-08 | `7ylZRyj3iKY` | Give Me 23 Minutes And I'lL Make You Extremely Confident | skipped: confidence talk (0.3%) |
| 2026-11-12 | `cwLasFLe-DY` | I Investigated the biggest "FAKE Street"... | read |

### Frugal Aesthetic: 55 read, 1 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2023-02-26 | `fZ2Jc3gOZMI` | 10 FASHION TIPS I WISH I KNEW EARLIER | read |
| 2023-02-28 | `njD_txmWPt4` | FASHION MAIN CHARACTERS | read |
| 2023-03-30 | `RL0KBggASgM` | WHAT YOUR COLOR PALETTE SAYS ABOUT YOU | skipped: no captions on YouTube (no transcript panel) |
| 2023-04-01 | `4hwelpjhDTM` | THE RISE OF FEMININITY IN FASHION | read |
| 2023-04-16 | `ieMBSpSiv3E` | THE MOST ICONIC FIT PICS OF ALL TIME | read |
| 2023-06-18 | `3RdxtHvsuxk` | WHAT YOUR STYLE SAYS ABOUT YOU IN 2023 | read |
| 2023-07-01 | `fCl-ixtBu1Q` | WHY YOUR WARDROBE BASICS SUCK | read |
| 2023-07-16 | `WDsQRHa8jBY` | THE "BEST" PANTS IN FASHION | read |
| 2023-08-18 | `K45OlNNhY8g` | THE SNEAKER ALIGNMENT CHART | read |
| 2023-09-01 | `9GFKiZx89oM` | THE DEATH OF EARTH TONES IN FASHION | read |
| 2023-09-17 | `N8RAKkiqe1w` | THE RISE OF UGLY CLOTHES | read |
| 2023-10-26 | `If6OJBbi_-8` | THE FASHION ADVICE TIER LIST | read |
| 2023-12-03 | `eAvgvOHKPPw` | YOU CANT WEAR THESE SHOES ANYMORE | read |
| 2023-12-17 | `k6Gig6r7BSQ` | WHY CROPPED CLOTHES LOOK BETTER ON YOU | read |
| 2023-12-31 | `YFxXWWM5YRI` | WHAT IS YOUR FASHION ZODIAC? | read |
| 2024-01-31 | `Vn6KlXkU2xA` | WHY YOU LOOK BAD IN ALL BLACK CLOTHES | read |
| 2024-02-29 | `ove4zof6W2k` | THE LOST ART OF HOODYING | read |
| 2024-03-03 | `LkN3yI1-TB4` | THE RISE OF FASHION TRYHARDS | read |
| 2024-03-26 | `XHFHUyJ_jO0` | WHY YOUR STYLE DECISIONS SUCK | read |
| 2024-04-18 | `_4g9z4ELSj0` | THE BEST SHOE ROTATION IN FASHION | read |
| 2024-04-30 | `oZYZ7AC_pZc` | WHAT YOUR SHOES SAY ABOUT YOU IN 2024 | read |
| 2024-05-27 | `FlQ3WZ-H2Ik` | THE BEST T SHIRT IN FASHION | read |
| 2024-07-11 | `5gKnDwVm_Eg` | SIMPLE VS BASIC IN FASHION | read |
| 2024-07-21 | `XtcY-zmoS-E` | WHY YOU ALWAYS LOOK BAD IN PANTS | read |
| 2024-07-27 | `2QZhiKgPceA` | WHAT YOUR STYLE SAYS ABOUT YOU IN 2024 | read |
| 2024-08-10 | `2gSj7T37RkQ` | THE RISE OF THE "TIKTOK FIT" | read |
| 2024-08-31 | `TnNv7Zvui6E` | WARDROBE ESSENTIALS EXPLAINED IN 12 MINUTES | read |
| 2024-09-05 | `WP5sWeQRSNA` | THE "POPULAR SHOE" PROBLEM IN FASHION | read |
| 2024-09-17 | `k9KCaUA1S08` | WHY YOU DON'T HAVE A "STYLE" | read |
| 2024-09-28 | `hk4KWJiETTw` | WHY OLD CLOTHES ARE SUPERIOR | read |
| 2024-10-03 | `RlcdMBj5Z2E` | THE "COOL JACKET" THEORY | read |
| 2024-10-16 | `TQi2YaZ5yNY` | THE LAST FASHION COLOR THEORY VIDEO YOU'LL EVER WATCH | read |
| 2024-10-28 | `4Jrq_F1Ayp8` | THE GOAT TIER CLOTHING LIST | read |
| 2024-11-27 | `b1S3XoaRa3k` | TOP 5 SHOES I WOULD BEAT UP | read |
| 2024-12-01 | `Jh8dz-KZcfY` | THE LAST FASHION LAYERING VIDEO YOULL EVER WATCH | read |
| 2024-12-21 | `WGUih-S8HHY` | FASHION, FOR THE BOYS | read |
| 2024-12-31 | `zAeLpbxDmEo` | YOU'RE NOT BASIC, YOU'RE JUST UNAWARE | read |
| 2025-01-18 | `UidnEGXwZRk` | WHY “TIMELESS FASHION” IS BORING | read |
| 2025-01-28 | `FFDYIGhiIk8` | MODERN SNEAKERS EXPLAINED IN 15 MINUTES | read |
| 2025-02-01 | `bDcAzeTM4PA` | FASHION INS AND OUTS 2025 | read |
| 2025-06-03 | `WMwH8xtSOWA` | THIS IS THE ULTIMATE OUTFIT TEMPLATE | read |
| 2025-07-15 | `jD6X3-yQDFw` | THE "BOMBER" JACKET | read |
| 2025-08-14 | `EnLlL2XKRCA` | MODERN AESTHETICS EXPLAINED IN 15 MINUTES | read |
| 2025-10-02 | `xL1NeaA9D-Y` | MODERN JEANS EXPLAINED IN 12 MINUTES | read |
| 2025-11-08 | `gKY1VMf4OGs` | FASHION HELL | read |
| 2025-11-28 | `bp1cUvVaRZc` | THE UNIFORM PROBLEM IN FASHION | read |
| 2025-12-20 | `KCzadANGaI0` | THE QUARTER ZIP EFFECT | read |
| 2026-01-30 | `FPHnmY5FTaI` | PERFORMATIVE MALE FASHION EXPLAINED | read |
| 2026-02-28 | `JY_zrt43cbU` | TIMELESS AESTHETICS EXPLAINED IN 16 MINUTES | read |
| 2026-04-26 | `8rmkOpCbFTM` | YOU'RE STYLING SNEAKERS WRONG | read |
| 2026-06-01 | `TUYSTimnDJg` | 10 YEARS OF FASHION IN 17 MINUTES | read |
| 2026-06-12 | `EWD0eRHHXgk` | THE CAPSULE WARDROBE EPIDEMIC | read |
| 2026-07-30 | `env4ZvWzcd4` | WHY PLAIN T-SHIRTS DON'T WORK ON YOU | read |
| 2026-08-09 | `ASQGKf8ve5g` | THE PROBLEM WITH THIS OUTFIT | read |
| 2026-08-31 | `CsbsHWEBwy0` | THE PHASE OF FASHION EVERYONE IS STUCK IN | read |
| 2026-11-12 | `4DHGKfe-Vho` | WHY NOTHING LOOKS RIGHT ON YOU | read |

### Brandon Balfour (outsider): 1 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2025-05-18 | `4IAFUIAi2vs` | Don’t Buy Summer Clothes Until You Watch This… | read |

### Damien Broderick (outsider): 1 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2025-10-23 | `4jnsdw7aT5U` | YOU DONT NEED A SUIT IN 2025 | read |

### Daniel Simmons (outsider): 1 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2025-12-28 | `ZbypE0XzIxM` | What I’m wearing this winter / 15 outfits | read |

### Drew Joiner (outsider): 1 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2024-12-20 | `DWmnbUo8dlA` | Why Great Outfits Understand Layering | read |

### GQ (outsider): 2 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2025-01-22 | `4fb4GyOylK8` | A Master Tailor's Guide To The Perfect Suit | read |
| 2025-09-23 | `bLcGL6rKBBg` | Master Tailor Reveals The Most Common Suit Mistakes—And How To Fix Them | read |

### Harry Has (outsider): 1 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2026-05-24 | `h4-sPhUHwLY` | How To Look Instantly More Stylish This Summer | read |

### James Leung (outsider): 1 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2026-07-19 | `w-mXLoLOU4w` | Outfits You Should Copy This Summer (and where to get them) | read |

### Justin Kwan (outsider): 2 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2024-10-12 | `pQctf3wAlpI` | Jacket Fit - Myth Busting Slim Fit + 6 Point fit Check | read |
| 2025-08-02 | `skd8U8dmIP4` | 3 Secrets to A Perfect Fit (Hint: It's in the Proportions) | read |

### The Armoury (outsider): 1 read, 0 skipped

| Uploaded | Video | Title | Read? |
|---|---|---|---|
| 2025-03-04 | `z_acMbzNfoQ` | The Armoury's Guide to How A Suit Should Fit | read |
### Opened, then dropped as older than 2023 (date checked on the video page)
Frugal: `OalnLOdauMw` This is where your outfit goes wrong (2022-11-30), `DBHGyMjf13Q` There are levels to fashion (2022-11-22), `sjlmsruEcwk` The rise of fashion NPCs (2022-12-23), `PVtOxXc0-Eo` This is why your accessories suck (2022-12-20). Tim: `4oemhv7WfL0` 20 winter outfits (2022-12-20), `DTbu9xDNnjs` Winter fashion essentials (2022-12-31), `GuBsaIgjpi0` Taking my dream outfit photo (2022-11-26). No transcript on YouTube: Frugal `RL0KBggASgM` What your color palette says about you (2023-03-30).

### 2023+ uploads not fetched, and why (titles from each channel's Videos page; dates there are relative, so only the year is given)
- **Bodies, faces, skin, hair, fitness or grooming (a hard line):** Tim `jFtgTD4vd_w` Things to avoid wearing if you have short legs, `3L7ioS-ZcYM` beard, `SbefqE4HQ8I` hair transformation, `uHANFRlfWZ4` grooming tips; Frugal `XWU79TSQ0k0` shaving heads, `uBtVDwuebqI` what girls like; Wanhee's channel since 2023 is about 190 fitness, diet and body videos (all skipped by title), plus `om18CcEUO9o` looking good in photos and `cjxjn8GJAIo` charisma; Jaye `ocoHrztB4qA` aura.
- **Mindset, life or channel talk, no outfit judging:** Tim `loWLXv83E9M` habits, `ZLlaodyBIOg` things I wish I knew in my 20s, `gy35TU1x3rg` thank you, `rleRvPXVtME` selling my wardrobe, `AuKhv_C0zy0` and `_nD7AOiCzck` little luxuries; Frugal `aNofEUQOVCA` performative everything, `pEtepNpTz6A` hobby vs lifestyle, `PhySym4HOA4` fashion makes you feel worse, `0WMZBv6tgLQ` they're just clothes, `xx63BjBFnQs` social experiment, `8xmcvRBi3w4` toxic hobby, `hQ08dODzW8A` optimize your style, `4MiAxI7bVuY` never know what to buy, `TyDhmc_qJZA` the fashion anti-hero.
- **Price, quality, brand or business stories (no fit or styling rules):** Tim `q7XDiHT35hM` expensive vs cheap quality, `iU1T8DyYt98` $100 vs $5 tee, `fIAv2xOcDug` first luxury watch, `j1EGqBGzVoA` how Aimé Leon Dore became cool, `xhv4JySL75Y`, `QgGaf6wGnEk` and `1rMKMZAckqo` brand lists, `p8YjFCTw0K0` his collection trailer; Frugal `moNR_EfY4Gc` good fast fashion, `RTAQsyI01jY` costmaxxing, `7xzz3bZnWxQ` hoodie price ranges, `wVHLA94p1Wk` death of fast fashion, `C2vX1aFlr5Q` AI fashion.
- **Fashion history or internet culture, covered by `TUYSTimnDJg` (10 years of fashion):** Frugal `PL5wYnAHOIM` swag era, `nURQXgQyOTs` 2016 retrospective, `nwtmGF0pyGo` the greatest era, `7W3DTVwgiNg` algorithm fashion, `7VqcBOLiUzw` hats backwards, `13KzASHSKNg` the fit pic.
- **Jaye, dropped in October and still dropped:** the 12 rows marked "no" in the table above (confidence, attractiveness, skin, hair, photos, promo).
