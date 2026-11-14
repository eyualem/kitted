# The rulebook, part 1: shape (silhouette, proportions, fit, suits and tailoring)

Synthesized Nov 14, 2026 for T95 from `by-part/rules-silhouette.md`, `rules-proportion.md`, `rules-fit.md`, `rules-tailoring.md`, `concepts.md` §1–5 and §13, and `suits.md` ("The four on suits and blazers", "Against specs/tailored.md"). Every quote was checked word for word against `inputs/youtube/clean/<id>.txt` (12 words or fewer; `[music]` tags dropped). Clothes only: wherever a creator talks about bodies ("long legs", "your frame"), the rule is restated in terms of where hems, waistbands and widths sit.

**In plain words.** All four put shape ahead of color: what an outfit is "about" is how the pieces sit against each other, not which pieces they are. They agree on four things. (1) The hem against the shoe can sink an otherwise good outfit. (2) An unequal split beats a 50/50 one, and a waist break (a tuck, a short top or a jacket ending where the trousers start) is how you get it. (3) One half should answer the other: a fitted or short top over a fuller leg is the safe great shape; big on big works when both halves carry it on purpose; a big top over a narrow leg mostly fails. (4) Fit is the floor: nothing skin-tight, nothing sagging, and no jacket or loud shoe can cover a bad pair of trousers. The main disagreements are how much crop (Frugal and Jaye like cropped pieces; Wanhee and Tim want a hem at the belt or a tuck), stacking (Tim calls it sloppy except on wide casual legs; Frugal likes a soft stack), slim legs (two prefer straight, two are fine with slim; skinny is out for three), and whether a wide top over a slim leg is a fault (Frugal) or a style choice (Tim, Jaye). On suits, the four want them relaxed, worn casually (a tee or tank under, no tie, sometimes sneakers), fitted by the shoulder rather than a tight waist, with the hem touching the shoe.

**How to read the ids.** `sil.`, `prop.`, `fit.`, `suit.` are this file's rules; `[PRO-4]`-style ids are today's engine (`rubric/v5-styles.md`). "Tim's guest" is the guest Harry in Tim's video OqoUgLxknJc; outsiders (The Armoury, GQ's tailor, Justin Kwan) are marked and only fill gaps in the suit section.

---

## Silhouette (sil.*)

#### sil.1. Shape comes before color: judge how the pieces sit against each other, not the pieces themselves.
- **Strength:** nuance (it sets the weights: proportion and silhouette should count for more than color or style). **Holds when:** always; strongest when the palette is plain (sil.7). **Doesn't:** it never makes a shape fault free because the colors are good.
- **Interacts with:** color (a good shape can carry a riskier color pair; that trade belongs to the interactions part, `ix.*`), style (the same white tee reads cool or plain depending on what surrounds it).
- **Sources:** Tim · `0ilmLux6mPg` · [08:15] · "Your preferred silhouette is arguably more important"; Tim · `0ilmLux6mPg` · [07:11] · "the relationship between each piece"; Wanhee · `ew3gCk1zkso` · [10:42] · "you want to see almost like the shape like not the color"; Wanhee · `tNVdA_arEa8` · [05:09] · "if you were to take all the color out of it"; Wanhee · `mpv9WWHDZio` · [04:29] · "Maybe it's the proportion. Maybe it's the silhouette."; Jaye · `UcLBvcmnnus` · [06:39] · "your own proportion, your own silhouettes"; Frugal · `njD_txmWPt4` · [00:00] · "playing with shapes and Silhouettes"; Tim · `vQd36IKIkOg` · [03:25] · "take inspiration from the overall silhouette"
- **The four:** all agree.
- **Engine today:** has it differently [SCO-1]: Proportions is the largest part (30%), but Color and Style together weigh 40% and nothing lets a good shape soften a color fault.
- **AI can see it:** weakly (it is the sum of `volume`, `leg_shape`, `length`, `tucked`; the weak reads at volume 4–5 and slim vs straight blur exactly this).
- **Frame:** `inputs/youtube/shots/0ilmLux6mPg/f-07-16.jpg`

#### sil.2. One loose half, one fitted half: a fitted or short top over a fuller leg is the classic great shape.
- **Strength:** lift. **Holds when:** the top is fitted, cropped, boxy-and-short or tucked, over straight, relaxed, wide, barrel or pleated "balloon" legs; Tim's version is a boxy jacket whose hem ends where the trousers start. **Doesn't:** when the top is long and loose (prop.6); Frugal's 2026 bulky-sneaker template wants a slightly oversized top of "neutral to longer length", nothing cropped (prop.4).
- **How to see it in a photo (the classic silhouettes):** trace the outer edge of the clothes from collar to shoe and name the letter. **A** (narrow top, wide bottom: today's "big pants, small top"), **H** (even column: straight top, straight leg, or a long straight coat), **X** (full top, defined at the waistband, wide or flared hem), **V** (wide top over a narrow leg), **O** (volume in the middle: city-boy layering, balloon trousers). Then check two things that matter more than the letter: is every piece supporting the shape, and do the shoes match it (chunky under A and X, slim under H). Most good everyday outfits are a soft A or H.
- **Interacts with:** prop.2 (the waist break makes the A or X readable), prop.10–prop.11 (the shoe has to match the leg's volume), color (in all black the contrast comes from shape alone, sil.7).
- **Sources:** Frugal · `Vn6KlXkU2xA` · [10:19] · "fairly fitted top with a relaxed bottom this just creates good contrast"; Frugal · `xL1NeaA9D-Y` · [04:18] · "the big pants, small top ensemble, just polarization"; Frugal · `XtcY-zmoS-E` · [04:07] · "just tight waist wide legs"; Frugal · `XtcY-zmoS-E` · [03:37] · "this wide bottom would look really good paired with a tight top"; Tim · `vziGl_FxQb0` · [04:18] · "the boxy, cropped top, baggy bottom look"; Tim · `0ilmLux6mPg` · [07:42] · "broad shoulders and a straight cut at the hem"; Jaye · `Pxeeh-caTJg` · [22:13] · "So, this creates an hourglass silhouette."
- **The four:** Frugal, Tim and Jaye agree; Wanhee agrees on the fuller leg but not on the short top (he wants a tee that ends at the belt, "not too cropped like those fashion influencers", `Mr-GzwGQ1qY` [06:04]; see prop.4).
- **Engine today:** has it differently [PRO-4], [PRO-6], [PRO-14], [STR-5]: it pays for the waist break or a short jacket, not for the volume contrast itself, so a fitted untucked tee ending at mid-fly over wide jeans earns nothing.
- **AI can see it:** weakly (`volume` top vs `leg_shape`, `length`, `tucked`; "fitted" vs regular is roominess 1–2 vs 3, which isn't steady).
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-10-24.jpg`

#### sil.3. Don't let the top outweigh the legs: the top should be no wider than the widest part of the trousers, and a heavy top half over thin legs needs weight added below.
- **Strength:** fault. **Holds when:** a roomy top, a bulky scarf or chunky knit, or a big jacket sits over slim or skinny legs, especially with light or flimsy bottoms. **Doesn't:** when the legs carry matching volume (sil.4), when a chunky shoe or darker, wider leg adds weight below, or in Tim's long-coat column (sil.5).
- **How to see it in a photo (top-heavy vs bottom-heavy):** compare the width of the top at its widest with the width of the trousers at their widest (Frugal's test). Then compare how dark and busy each half is. Then check the shoes: chunky shoes add weight below, slim ones don't. All the width, darkness or busyness up top over narrow legs is top-heavy; a small top over wide, dark trousers and heavy shoes is bottom-heavy, which right now mostly reads as good (sil.2).
- **How to see it in a photo (visual weight):** squint until the details blur. What stays visible longest is heaviest: the biggest, darkest, brightest, busiest or chunkiest piece. Note which half holds most of it. A heavy piece is fine as a deliberate focal point; trouble is two heavy things competing, or the weight piled at one end.
- **Interacts with:** shoes (a chunky shoe can rescue a top-heavy outfit, prop.10), color (a dark top over light trousers is top-heavy even when the widths match; the color part owns value), layering (each added top layer adds top weight).
- **Sources:** Frugal · `XtcY-zmoS-E` · [02:04] · "make sure your top is the same width if not Slimmer"; Tim · `wIib9hzVUuw` · [05:36] · "it's quite a topheavy outfit with the chunky oversized scarf"; Tim · `0ilmLux6mPg` · [08:51] · "visual weight on the upper body or the lower body"; Tim · `-e9Is50-fn0` · [08:16] · "heavyweight chunky knitwear adds that lovely texture and weight"; Jaye · `Jz9QVWgBbOg` · [13:41] · "Oversized jackets, they need balance."; Wanhee · `tNVdA_arEa8` · [05:40] · "a tight muscle t-shirt" (his example of the wrong silhouette, with skinny jeans)
- **The four:** Frugal agrees as a rule; Tim fixes top-heavy outfits by moving weight down but says the direction is a preference ("There is no universally correct answer.", `0ilmLux6mPg` [08:51]); Jaye says skinny jeans with big runners and a boxy tee is "nothing wrong with that style" yet tells viewers to let it go (`sOfjDjtjBWM` [08:48]); Wanhee rejects the tight version.
- **Engine today:** has it [PRO-2] (roomy top over skinny −1.5), [PRO-11] (roomy top over slim −1.5 unless outdoor), [PRO-3], [SHO-9]; lacks the weight side (a chunky scarf or heavy knit over slim legs, and a heavy shoe rescuing it).
- **AI can see it:** weakly (`volume` top vs `leg_shape`; volume 4–5 and slim vs straight are both weak reads; darkness and texture aren't read; shoe bulk only via `subcategory`).
- **Frame:** pending (no still 0–20 s after [05:36]; `inputs/youtube/shots/wIib9hzVUuw/o2-before-05-30.png` shows the same outfit 6 s before)

#### sil.4. Big on big is a valid shape when both halves carry the volume on purpose and the hems are controlled.
- **Strength:** nuance (no charge; lift when it's clearly deliberate). **Holds when:** an oversized tee or boxy top over wide trousers, often under a big coat; a relaxed jacket sized up to match wide trousers. **Doesn't:** when one half is big and the other merely regular, when the hems pool on a straight leg, or when it tips into "swollen" size-as-a-shortcut (fit.3).
- **Interacts with:** sil.3 (both halves big keeps it balanced), prop.9 (stacking on a wide leg is part of the look), shoes (a generous leg wants a substantial shoe).
- **Sources:** Tim · `vQd36IKIkOg` · [02:53] · "rocking an oversized tea, some widelegg trousers, and a big overcoat"; Tim · `2KblatXQTGs` · [02:08] · "a bit looser to go with the wide fit of the pants"; Frugal · `xL1NeaA9D-Y` · [04:18] · "this obviously works really well with other oversized wardrobes"; Frugal · `2gSj7T37RkQ` · [02:07] · "fundamentally these pieces actually look pretty good together"; Wanhee · `rNCrnP-os0U` · [08:12] · "then you're entering another territory which can look good"
- **The four:** Tim and Frugal agree; Wanhee allows it as "another territory" beyond his own normal-to-slightly-loose default; Jaye only asks for balance.
- **Engine today:** has it [STR-5], [PRO-11] (roomy over full legs is held by streetwear, minimal and the others); dealbreakers N1 leaves it to normal scoring.
- **AI can see it:** weakly (`volume` 4–5 is rarely read, KD-1).
- **Frame:** `inputs/youtube/shots/vQd36IKIkOg/f-02-58.jpg`

#### sil.5. The outer layer sets the outline: its length decides the read, and it needs room for what's under it.
- **Strength:** fault (a tight or slim outer layer over a bulky one) / nuance (length). **Holds when:** a short jacket shows the legs and makes two blocks; a long coat makes one continuous shape (both fine); the coat has room for a knit or hoodie underneath. **Doesn't:** a slim puffer or a close overshirt over an oversized hoodie or chunky knit (bunching); a bulky shirt under a bulky jacket.
- **Interacts with:** sil.3 (the outer layer is most of the visual area, so its shape weighs most), prop.5 (the short jacket credit), fit.4 (snug inner layers, roomy outer ones), layering.
- **Sources:** Jaye · `RIuzSb8OLMM` · [10:11] · "the outer layer defines silhouette and the tone of the fit"; Frugal · `RlcdMBj5Z2E` · [06:25] · "it holds the biggest amount of visual real estate on a fit"; Tim · `0ilmLux6mPg` · [08:51] · "A short jacket can emphasize the legs"; Tim · `0ilmLux6mPg` · [08:51] · "one continuous controlled shape"; Tim · `FUWET2HH-us` · [02:10] · "provided you don't wear anything too oversized underneath"; Tim · `wIib9hzVUuw` · [09:10] · "not enough room for the layer underneath"; Jaye · `Jz9QVWgBbOg` · [23:19] · "your shirt too bulky, your jacket too bulky"; Frugal · `Jh8dz-KZcfY` · [02:08] · "fitted shirt and an oversiz shirt with the exact same jacket"
- **The four:** Tim, Jaye and Frugal agree; Wanhee adds that an off-size piece works when placed (a too-small tee inside a looser jacket, fit.5).
- **Engine today:** has it differently [PRO-6], [PRO-14] (a short jacket earns credit; a long coat neither earns nor costs, which matches Tim); lacks the outer-vs-inner room check ([PRO-11] never charges a roomy top under a jacket).
- **AI can see it:** weakly (`volume` per garment and the jacket's `length`; an inner layer's volume is often hidden; `shows_below_outer` helps).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-09-15.jpg`

#### sil.6. A big coat, ideally with broad, structured shoulders, lifts a plain outfit.
- **Strength:** lift. **Holds when:** cold weather, smart or casual; the coat has structure at the shoulder and room under it. **Doesn't:** a tight coat over a knit (sil.5).
- **Interacts with:** sil.3 (structured shoulders move weight up, so the leg must carry it), suit.3 (the same shoulder logic in tailoring), season.
- **Sources:** Tim · `XIYvycsZxDk` · [05:08] · "a nice coat just makes everything look better"; Tim · `-e9Is50-fn0` · [04:26] · "will improve any cold weather outfit, smart or casual alike"; Tim · `-e9Is50-fn0` · [08:46] · "royal power silhouette like you mean business"; Tim · `XSF9AOx7sdU` · [00:34] · "try jackets that have more structure around the shoulders"; Frugal · `JY_zrt43cbU` · [05:27] · bomber's "commanding shape" (paraphrase; quote not checked, so not used as a source line)
- **The four:** only Tim (others silent).
- **Engine today:** lacks it (an overcoat earns no shape credit; [PRO-6] excludes it).
- **AI can see it:** weakly (`subcategory` overcoat; shoulder structure isn't read).
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-05-13.jpg`

#### sil.7. In one color (or an all-neutral palette), the outline is the whole outfit: a bad shape shows more, a deliberate strong shape reads better.
- **Strength:** nuance (it scales the shape rules up). **Holds when:** all black, all white, or a quiet neutral palette (city boy, quiet luxury); Frugal says you can push proportions further here "as long as you're deliberate". **Doesn't:** texture and tone contrast bring some piece edges back.
- **Interacts with:** color (one color hides the waist break and hem lines, so the outer outline is what's left), prop.2 (the thirds matter less when the line is invisible), layering-texture (all black needs texture; that part owns it).
- **Sources:** Frugal · `Vn6KlXkU2xA` · [09:16] · "your whole fit is one color your entire silhouette is completely exaggerated"; Frugal · `Vn6KlXkU2xA` · [09:46] · "you can't even tell where the pieces end and start"; Frugal · `Vn6KlXkU2xA` · [10:51] · "Min maxing the proportions slider usually will work pretty well"; Frugal · `9GFKiZx89oM` · [07:11] · "the absence of color leaves more room in the mix"; Wanhee · `ew3gCk1zkso` · [10:42] · "a little bit more elongated"; Wanhee · `B9PIhkSQKuw` · [04:20] · "it's very based on a silhouette"; Jaye · `7K2qRZaXX3w` · [03:41] · "wear black but wear some flare pants or wear a black coat"; Frugal · `EnLlL2XKRCA` · [10:03] · "relying on the crutch of graphics and over accessorizing"
- **The four:** all agree.
- **Engine today:** lacks it (one-color outfits get only the [COL-7] tip; shape rules weigh the same).
- **AI can see it:** yes for one color (`color_family` across pieces); weakly for the shape itself, and piece boundaries in all black may be hard for the reader too.
- **Frame:** `inputs/youtube/shots/Vn6KlXkU2xA/f-09-51.jpg`

#### sil.8. The 2026 leg is straight to relaxed (Tim) or barrel (Frugal); a straight leg is the one that works with every shoe.
- **Strength:** nuance (trend; no charge between straight, relaxed, wide and barrel). **Holds when:** jeans and casual trousers in 2026; Tim's wide pleated trousers look better cut straight than tapered. **Doesn't:** the very wide, "stepping on the pant" extreme is passing for Tim; skinny is handled by fit.6.
- **Interacts with:** shoes (a straight leg lets sneakers lead and suits low and high tops alike), prop.9 (a wide leg changes the right hem).
- **Sources:** Tim · `30L-EHe4WAQ` · [00:00] · "the inevitable pendulum swing back towards more balanced, straighter"; Frugal · `TUYSTimnDJg` · [00:00] · "agreeing on barrel-legged genes" (caption: jeans); Wanhee · `ew3gCk1zkso` · [03:47] · "just a straight fit relaxed straight fit jeans slacks chinos"; Tim · `FUWET2HH-us` · [01:38] · "which I think gives them a much better silhouette"; Frugal · `WDsQRHa8jBY` · [09:12] · "maybe you want a neutral straight fit to let the shoes shine"; Frugal · `WDsQRHa8jBY` · [09:12] · "if this pants silhouette works with both low tops and high tops"
- **The four:** Tim, Wanhee and Frugal agree on straight as the safe default; Tim (straighter) and Frugal (barrel, fuller through the knee) differ on direction, both in 2026; Jaye silent.
- **Engine today:** has it [PRO-13] (only slim and skinny cost; straight, relaxed, wide and barrel are equal).
- **AI can see it:** yes (`leg_shape` has straight, relaxed, wide and barrel), weakly at slim vs straight.
- **Frame:** `inputs/youtube/shots/TUYSTimnDJg/f-00-05.jpg`

#### sil.9. Flares or bootcuts over boots make the hourglass (X) shape, if the flare lands on the shoe.
- **Strength:** lift. **Holds when:** a flare or bootcut long enough to sit over a boot or heavy shoe, often under a fitted or open top. **Doesn't:** a flare that stops short or doesn't sit on the shoe "loses the point"; Frugal calls flares hard to pull off.
- **Interacts with:** prop.1 (length is the whole rule for a flare), shoes (boots), sil.2.
- **Sources:** Jaye · `Pxeeh-caTJg` · [22:13] · "So, this creates an hourglass silhouette."; Frugal · `WDsQRHa8jBY` · [09:12] · "I really like the way flared pants look on boots"; Frugal · `xL1NeaA9D-Y` · [05:27] · "being deliberate with how the flare sits is really the key"; Frugal · `4hwelpjhDTM` · [09:48] · "it's kind of hard to pull off pants sometimes"; Jaye · `7K2qRZaXX3w` · [03:41] · "wear black but wear some flare pants or wear a black coat"
- **The four:** Jaye and Frugal agree (others silent).
- **Engine today:** lacks it (`flare_bootcut` earns nothing on its own).
- **AI can see it:** yes (`leg_shape` flare_bootcut, shoe `subcategory`), weakly for whether it lands (`hem`).
- **Frame:** `inputs/youtube/shots/Pxeeh-caTJg/perfect-all-black-19-38.png` (the same outfit; no still after [22:13])

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
- **Frame:** `inputs/youtube/shots/YGm7JMniGVc/f-01-12.jpg`

---

## Proportions (prop.*)

#### prop.1. The hem against the shoe makes or breaks the outfit: trousers should reach the shoe, with no break or one clean break; dragging or flapping short ruins it.
- **Strength:** dealbreaker for clearly too long on a straight, slim or smart leg (fabric piling or dragging) and for a clear gap above the shoe on a full leg; fault for a heavier-than-ideal break. **Holds when:** jeans, chinos and trousers, every look; Frugal says 90% of an outfit can be right and the hem still makes "the whole thing" trash. **Doesn't:** a soft stack on a wide or relaxed leg over a chunky shoe (prop.9); a deliberate crop on a wide leg with loafers (prop.12); cinched or elastic hems (prop.10); Wanhee's 2026 street exception for dragging jeans (prop.16).
- **How to see it in a photo (the break):** look at the bottom 15 cm of the trouser against the shoe. Count the folds: none (no break, hem just reaches the shoe top), one small fold (slight break), one clear fold resting on the shoe (full break), several gathered folds (stack), fabric dragging on or past the heel (pooling), or a gap of sock or ankle (cropped). Then judge it against the leg width: slim plus many folds is too long; wide plus ending above the shoe is too short unless it's a deliberate wide crop; wide plus soft gathers over a chunky sneaker is a deliberate stack.
- **Interacts with:** prop.2 (a pooled hem shortens the long lower block), shoes (the shoe sets the right length, prop.10–prop.11), sil.9 (flares need length), color (trousers matching the shoe keep the eye up, Tim `wIib9hzVUuw` [08:07]).
- **Sources:** Tim · `SNjfZ5NKndc` · [00:00] · "Pant break will quite literally make or break your outfit."; Tim · `SNjfZ5NKndc` · [00:00] · "Too short and it will ruin your silhouette"; Tim · `SNjfZ5NKndc` · [00:00] · "Too long and it'll look sloppy"; Tim · `wIib9hzVUuw` · [10:40] · "Enough room in the thighs, straight cut, one break on the shoe"; Tim · `K2HS3_8cTx8` · [03:15] · "not too short not too long barely touching the shoe"; Tim · `zJ5LCenTcf8` · [01:10] · "fit you perfectly at the waist but just seemed way too long"; Frugal · `XtcY-zmoS-E` · [05:08] · "the silent killer of most people's outfits"; Frugal · `XtcY-zmoS-E` · [05:38] · "90% of the time it is a length problem"; Frugal · `XtcY-zmoS-E` · [06:38] · "as soon as the pants and the shoes don't work together"; Frugal · `8rmkOpCbFTM` · [10:27] · "shoe pants pairing is where it matters the most"; Wanhee · `ew3gCk1zkso` · [02:06] · "that goes all the way to your shoes normal"; Wanhee · `tNVdA_arEa8` · [03:36] · "it just all falls apart" (a bit of ankle in the loose style)
- **The four:** Tim, Frugal and Wanhee agree; Jaye silent here (he wears flares long). Frugal's own 2026 note that the lower legs sit outside the eye line (`RlcdMBj5Z2E` [06:25]) is weaker than his repeated "silent killer" and is set aside.
- **Engine today:** has it differently [FIT-4] (piling on a straight or narrow leg −1.5 to −2.0 on Fit, worth 0.15 a point), [PRO-8] (pooling blocks shape credits), [SHO-2]; no cap (dealbreakers H7 proposes one), no charge for too short, no credit for a clean break.
- **AI can see it:** weakly (`hem` is a known weak read, 64–68% steady); the shoe close-up (look L, "covers the shoe mostly", 97%) reads piling well; deliberate stack vs pooling share one value.
- **Frame:** `inputs/youtube/shots/XtcY-zmoS-E/f-06-43.jpg`

#### prop.2. Split the outfit unequally (about one third and two thirds), not in half.
- **Strength:** lift (a clear thirds split) / fault (the 50/50 "cut in half" look). **Holds when:** usually a short top block over long legs; the reverse (a long coat or long top over a short visible bottom) works too. **Doesn't:** Wanhee shows a low, long split that "doesn't look that bad" when committed to (prop.16); Frugal calls the thirds a guide, not the whole answer; in tonal or all-black outfits the line is hidden, so the outline takes over (sil.7). Jaye's "rule of thirds" is mostly about framing photos, not outfits.
- **How to see it in a photo (the rule of thirds):** ignore the person and measure the clothes. Top block: from the collar to the lowest visible hem of the top layer (or the tuck line). Bottom block: from there to where the trousers end on the shoe. About 1:2 (or 2:1 with a long coat) passes; a top ending about halfway between collar and trouser hem (a long untucked tee, a hip-length jacket over low-rise trousers) is the "cut in half" look. With an open jacket there are two lines; the jacket's hem matters most when it is closed.
- **Interacts with:** prop.3 (the waist break is how you get it), prop.8 (rise moves the line), prop.1 (a pooled hem shortens the bottom block), color (the split only shows if top and bottom differ in lightness).
- **Sources:** Wanhee · `RtxJqd5Drps` · [01:04] · "a third top, 2/3 at the bottom"; Wanhee · `RtxJqd5Drps` · [01:04] · "So, I kind of cut my body in half." (trousers worn low under an untucked tee); Wanhee · `RtxJqd5Drps` · [01:40] · "It's about the proportions that you're creating."; Wanhee · `ew3gCk1zkso` · [11:15] · "one third top and then two thirds"; Frugal · `k6Gig6r7BSQ` · [05:44] · "give things more room to breathe"; Frugal · `If6OJBbi_-8` · [17:04] · "a good visual guide to fit building content creator copout"; Tim · `0ilmLux6mPg` · [08:51] · "Where should your tops end?"; Jaye · `23ZCHsp9AZU` · [05:04] · "I would recommend using the rule of thirds right"
- **The four:** all agree on an unequal split; Wanhee (2026) and Tim say the short-top version isn't the only right one; nobody gives numbers.
- **Engine today:** has it differently [PRO-4] pays for the short-top side; the 50/50 fault is only a tip ([PRO-10], KD-8).
- **AI can see it:** weakly (`length` + `tucked` give where the top ends; rise isn't read; `below_crotch` almost never fires).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-01-09.jpg`

#### prop.3. Make a waist break: a tuck, a top ending at the belt, a crop, or a jacket that stops where the trousers start; strongest over a fuller leg.
- **Strength:** lift (a big one). **Holds when:** the trouser waistband (or a tuck line) is visible or the top's hem is within a hand's width of it; over relaxed, wide or pleated legs it is the look; with high-waisted trousers it rebalances the outfit. **Doesn't:** over skinny or slim legs it does little; a tuck into sweatpants or under a street cap can read odd (prop.7); a cinched hoodie over a long base layer can make the line instead.
- **How to see it in a photo (the waist break):** find the trouser waistband. Can you see it, a belt or a tuck line? Does the top end at it, or within a hand's width? Or does the top hang to mid-fly or below and hide it? With an open jacket, check the inner top. Same-color top and trousers make the line soft; contrast makes it sharp.
- **Interacts with:** prop.2 (it creates the thirds), sil.2 (it makes the A or X readable), prop.8 (high rise plus tuck), color.
- **Sources:** Frugal · `k6Gig6r7BSQ` · [06:14] · "creates more space between your top and your pants"; Frugal · `XtcY-zmoS-E` · [04:38] · "hourglass situation creates separation from my top and my bottom"; Frugal · `TnNv7Zvui6E` · [01:03] · "great for creating separation from your top and and your bottom"; Tim · `-V2bE8nDsdo` · [04:37] · "oversized t-shirt tucked into the tailored trousers"; Tim · `0ilmLux6mPg` · [08:15] · "the jacket cuts abruptly where the trouser starts"; Tim · `XSF9AOx7sdU` · [00:00] · "try tucking in your top into some high-waisted trousers"; Wanhee · `RtxJqd5Drps` · [01:40] · "Top 1/3, 2/3 at the bottom."; Jaye · `Jz9QVWgBbOg` · [23:49] · "A crop t-shirt is probably going to look better."
- **The four:** all agree; they split only on how much crop (prop.4).
- **Engine today:** has it [PRO-4] (+1.5 over a loose leg, +0.5 over straight, nothing over slim), [PRO-5], [PRO-14], [PRO-17]; dealbreakers L1.
- **AI can see it:** yes for the tuck (`tucked`), weakly for "ends at the belt" (`length` at_belt vs mid_fly is the reader's most common length mistake); half tuck and belt not read.
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-42.jpg`

#### prop.4. How much crop: a little goes a long way; most people wear tops too long, but a super-cropped boxy tee is its own trend look.
- **Strength:** nuance. **Holds when:** a top ending at or just above the belt is safe for all four; a fitted crop over wide legs is Frugal's favorite. **Doesn't:** Wanhee and Tim stop at the belt or tuck instead; Frugal's 2026 bulky-sneaker template wants "Neutral to longer length" and "Nothing too cropped. Nothing boxy." (the heavy shoe changes the right top length).
- **Interacts with:** shoes (bulky sneakers favor a neutral length), prop.3, prop.6.
- **Sources:** Frugal · `FlQ3WZ-H2Ik` · [06:59] · "my biggest Discovery was just a nice fitted crop shirt"; Frugal · `k6Gig6r7BSQ` · [10:22] · "you have been wearing shirts longer than they're supposed to be"; Frugal · `8rmkOpCbFTM` · [09:22] · "Slightly oversized top. Neutral to longer length."; Frugal · `8rmkOpCbFTM` · [09:54] · "Nothing too cropped. Nothing boxy."; Tim · `vziGl_FxQb0` · [03:48] · "It has a boxy modern fit, slightly cropped"; Tim's guest · `OqoUgLxknJc` · [03:51] · "so it adds a nice shape to the outfit"; Wanhee · `Mr-GzwGQ1qY` · [06:04] · "not too cropped like those fashion influencers"; Wanhee · `Mr-GzwGQ1qY` · [03:32] · "the length of it is a little long for me"; Jaye · `Jz9QVWgBbOg` · [23:49] · "A crop t-shirt is probably going to look better." (under a leather jacket)
- **The four:** Frugal and Jaye like crop; Tim likes "slightly cropped" knits and jackets and the tuck; Wanhee rejects the super-cropped look but also faults a tee that runs long. Frugal's 2026 bulky-shoe exception contradicts his own 2023 crop video; newest wins only for bulky shoes.
- **Engine today:** has it [PRO-4] (cropped and at_belt count the same; no extra for crop, no charge for super-cropped).
- **AI can see it:** yes (`length` cropped / at_belt), weakly between them.
- **Frame:** `inputs/youtube/shots/FlQ3WZ-H2Ik/f-07-04.jpg`

#### prop.5. A short jacket over full legs adds interest and shows the legs, even on a plain monochrome outfit.
- **Strength:** lift. **Holds when:** a bomber, trucker, leather or slightly cropped jacket (a jacket ends at the hip or above) over straight, relaxed or wide legs. **Doesn't:** over skinny legs; the outsiders' "a short jacket splits you in half" is dropped (the four read that line as a deliberate waist break).
- **Interacts with:** sil.5, prop.3, color (on a monochrome outfit the hem line does what color can't).
- **Sources:** Tim · `XIYvycsZxDk` · [03:25] · "adds some visual interest to this otherwise plain monochrome outfit"; Tim · `wIib9hzVUuw` · [04:35] · "slightly cropped jacket"; Tim · `0ilmLux6mPg` · [08:51] · "A short jacket can emphasize the legs"; Frugal · `4hwelpjhDTM` · [09:48] · "a nice contrast with how popular oversized jackets have been"; Frugal · `jD6X3-yQDFw` · [10:34] · "all short outer garments usually laying around hip level or above"
- **The four:** Tim and Frugal agree; Jaye uses short outer layers as the easy option (`RIuzSb8OLMM` [10:11]); Wanhee silent.
- **Engine today:** has it [PRO-6] (+1.5 by jacket type), [PRO-14] (+1.0 for any layer read at the belt over a loose leg); dealbreakers L2.
- **AI can see it:** yes (`subcategory`, jacket `length`).
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-03-30.jpg`

#### prop.6. An oversized top should be big in width and sleeve, not in length: a long body that covers the waist and hangs toward the thigh is the fault.
- **Strength:** fault (Tim's "biggest pet peeve"). **Holds when:** an oversized tee long in the body with regular-length sleeves; a long untucked flannel down the thigh; a tee long enough to "look like a dress". **Doesn't:** a long coat or a deliberate long-and-low look (prop.16); Frugal's neutral-to-longer top with bulky sneakers (prop.4) is not this long.
- **Interacts with:** prop.2 (a long body kills the thirds), fit.5 (oversized done right), sil.2.
- **Sources:** Tim · `a7FgCE9NPmw` · [02:15] · "too long in the body with regular length sleeves"; Tim · `a7FgCE9NPmw` · [02:15] · "more oversized in the width of the body and the sleeve length"; Frugal · `FlQ3WZ-H2Ik` · [09:37] · "creates a completely different shape without it looking like a dress"; Wanhee · `ew3gCk1zkso` · [11:47] · "long vintage like flannel shirts that go way down to your thigh"; Jaye · `Jz9QVWgBbOg` · [23:49] · "there's no reason you should have a extremely long white t-shirt"
- **The four:** all agree.
- **Engine today:** lacks it (only the [PRO-10] tip "a top that may run past the fly"; dealbreakers S3 and H2 propose caps).
- **AI can see it:** weakly (`length` below_crotch almost never fires; long reads as mid_fly about a quarter of the time).
- **Frame:** `inputs/youtube/shots/a7FgCE9NPmw/f-02-55.jpg`

#### prop.7. Tucking is a tool, not a rule: it smartens a simple outfit, but untucked is often the more balanced choice.
- **Strength:** nuance. **Holds when:** a tee tucked into trousers reads smarter (dinner, darker pieces); a high rise invites a tuck for "that classic look"; a shirt tucked under a hoodie keeps the layers from bunching. **Doesn't:** untucked is never a fault on a casual outfit; a dress shirt untucked under a blazer is (suit.10); a tuck into sweatpants or with a streetwear cap can look wrong.
- **Interacts with:** prop.3, prop.8 (needs a defined, higher waist), formality.
- **Sources:** Tim · `XSF9AOx7sdU` · [00:34] · "it could look better to not tuck in your top"; Tim's guest · `OqoUgLxknJc` · [08:07] · "just tucked in the t-shirts"; Frugal · `xL1NeaA9D-Y` · [08:07] · "you can tuck your shirt if you really like that classic look"; Frugal · `Jh8dz-KZcfY` · [05:56] · "just tucking the shirt to leave room for the hoodie"; Wanhee · `RtxJqd5Drps` · [01:04] · "So, I kind of cut my body in half." (untucked over low trousers)
- **The four:** Tim, Frugal and Wanhee agree; Jaye adds that a high rise with a tuck or crop is "harder to pull off" (`RIuzSb8OLMM` [14:14]).
- **Engine today:** has it [PRO-4] (tuck credit), [PRO-8] (sweats block it), [CON-3] (untucked dress shirt under a blazer −0.6); untucked is never charged.
- **AI can see it:** yes (`tucked` none/half/full; half is untested).
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-08-12.jpg`

#### prop.8. Rise is a lever: a high rise with a tuck or a jacket lengthens the leg line, low rise under an untucked top cuts the outfit in half, mid rise is the safe everyday choice.
- **Strength:** lift (high rise with a tuck or a jacket) / fault (low rise under a jacket or long top). **Holds when:** visible only when the top is tucked, cropped or the jacket is open. **Doesn't:** low-rise jeans worn casually are not a fault on their own; Jaye says high rise is hard to pull off.
- **Interacts with:** prop.2, prop.3, suit.6.
- **Sources:** Jaye · `RIuzSb8OLMM` · [13:43] · "Low rise cuts your" (proportions, [14:14]); Jaye · `RIuzSb8OLMM` · [14:14] · "Mid rise is easily the safest option"; Jaye · `RIuzSb8OLMM` · [14:14] · "High rise on the other end, it elongates your legs."; Wanhee · `RtxJqd5Drps` · [01:04] · "So, I kind of cut my body in half."; Frugal · `xL1NeaA9D-Y` · [06:33] · "how long are your pants, how do your pants stack"; Frugal · `XtcY-zmoS-E` · [03:06] · "they really open up what I can wear up top"; Tim · `0ilmLux6mPg` · [09:21] · "high-rise jeans with just a little more room in the leg"; Tim · `vziGl_FxQb0` · [05:56] · "a voluminous wide straight cut with a high-rise"
- **The four:** all agree.
- **Engine today:** lacks it.
- **AI can see it:** no (rise isn't read; a tuck or open jacket shows it only to a person).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-01-09.jpg`

#### prop.9. A soft stack is part of the shape on a wide or relaxed leg over a substantial shoe; the many-fold stack on a skinny jean is dated.
- **Strength:** nuance (no charge) / lift in a relaxed, deliberate look. **Holds when:** generous trousers stacking a little over chunky sneakers or slim sneakers with the toe showing; wide parachute trousers worn long. **Doesn't:** on smart trousers Tim calls more than one break "stacking territory" (sloppier); the 2016 skinny-jean "how many stacks" look; a straight or slim leg piling up (prop.1).
- **Interacts with:** prop.1, sil.4, prop.10, color (Tim's stack works because the palette is minimal).
- **Sources:** Frugal · `8rmkOpCbFTM` · [04:58] · "a nice generous pair of pants stacking over top"; Frugal · `8rmkOpCbFTM` · [06:37] · "a nice organic looking cozy little bit of stack"; Frugal · `8rmkOpCbFTM` · [06:37] · "It was like how many stacks" (the dated version); Tim · `XIYvycsZxDk` · [01:07] · "nicely stacking on top of these Salamon sneakers"; Tim · `o5RnTT2oafg` · [01:09] · "rock them long and stacking a bit on the shoe"; Tim · `SNjfZ5NKndc` · [00:30] · "Anything more than one break goes into stacking territory"; Frugal · `JY_zrt43cbU` · [06:31] · "I want to be stepping on the pant" (today's extreme cargo, said half mocking)
- **The four:** Tim and Frugal agree on the soft stack over wide legs and against the skinny stack; Jaye lists "stacking pants" as something beginners copy without understanding (`UcLBvcmnnus` [02:10], from `concepts.md`); Wanhee (2026) allows dragging in street looks (prop.16).
- **Engine today:** has it [FIT-4] (no charge for jeans and cargos on a loose leg; −0.5 for trousers), [STR-12], [PRO-8].
- **AI can see it:** weakly (`hem` pooling serves both the stack and the drag; look L says how much of the shoe is covered, not how deliberate it is).
- **Frame:** `inputs/youtube/shots/XIYvycsZxDk/f-01-12.jpg`

#### prop.10. A bulky shoe needs a generous leg; a slightly higher hem or a cinched hem is fine over it.
- **Strength:** lift (generous leg over a chunky shoe) / fault (a chunky shoe under slim or skinny legs). **Holds when:** chunky runners, trail and dad shoes, boots; the leg "doesn't have to be baggy" but needs some shape; cinched joggers or cargos make a narrow point that sets off the shoe. **Doesn't:** Frugal's own note that a chunky designer sneaker under very wide jeans didn't help (frugal-3 R1).
- **Interacts with:** sil.3 (a chunky shoe adds weight below), prop.1 (the hem may sit higher here), shoes.
- **Sources:** Frugal · `8rmkOpCbFTM` · [09:22] · "a more generous pair of pants does these shoes justice"; Frugal · `8rmkOpCbFTM` · [09:54] · "Doesn't have to be baggy."; Frugal · `8rmkOpCbFTM` · [11:02] · "the contrast between your big shoes and your pants always works"; Frugal · `8rmkOpCbFTM` · [09:22] · "anything that you can kind of cinch at the bottom"; Frugal · `FFDYIGhiIk8` · [13:24] · "these work really well with bag your pants" (caption: baggier)
- **The four:** Frugal (most), Tim (cargos stacking on Salomons, prop.9) and Jaye (heavy boots under flares and wide pants) agree; Wanhee's "a bit of ankle falls apart" (`tNVdA_arEa8` [03:36]) is against the higher hem, in the loose style.
- **Engine today:** has it [SHO-9] (chunky under slim or skinny −1.5), [STR-6] (+0.5 chunky under wide in streetwear); lacks the higher-hem allowance.
- **AI can see it:** yes (`subcategory` chunky/basketball/running, `leg_shape`), weakly at slim vs straight; dealbreakers H10.
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-11-07.jpg`

#### prop.11. A slim, low-profile shoe under a full leg is a great contrast, if the trousers are long enough to cover most of it.
- **Strength:** lift / fault (a cropped or skinny leg over a slim sneaker). **Holds when:** a Samba-type sneaker, loafer or derby under straight, wide or generous trousers with a long or medium inseam, just the toe showing. **Doesn't:** a short hem over a slim sneaker exposes it and loses the contrast; the cropped-wide-leg-with-loafers exception (prop.12).
- **Interacts with:** prop.1, prop.9, shoes.
- **Sources:** Frugal · `8rmkOpCbFTM` · [04:58] · "a nice generous pair of pants stacking over top"; Frugal · `8rmkOpCbFTM` · [10:27] · "I suggest a long or medium inseam"; Tim · `0ilmLux6mPg` · [08:15] · "barely breaking on the shoes" (pleated trousers over loafers)
- **The four:** Frugal and Tim agree; Wanhee's trousers falling on the laces fit; Jaye silent.
- **Engine today:** has it differently [SHO-12] (dress shoes under wide legs: nothing, not even a tip); lacks the contrast credit and the cropped-over-slim-sneaker fault.
- **AI can see it:** yes (`subcategory`, `leg_shape`), weakly for `hem`.
- **Frame:** `inputs/youtube/shots/8rmkOpCbFTM/f-05-03.jpg`

#### prop.12. A deliberate crop on a wide leg, with loafers and visible socks, is a current look, not a short hem.
- **Strength:** nuance (an exception to prop.1). **Holds when:** a clearly cropped wide or baggy leg, a slim dress shoe, socks showing. **Doesn't:** a straight or slim leg that just stops short; Tim phased out his deeper crops and wants the hem "barely touching the shoe"; Wanhee says a bit of ankle makes the loose style fall apart.
- **Interacts with:** prop.1, prop.11, season (a crop is a warm-weather choice; bare ankles in winter are Tim's "cardinal sin", the season part).
- **Sources:** Frugal · `xL1NeaA9D-Y` · [04:18] · "Like this is a very big combo right now."; Tim · `K2HS3_8cTx8` · [03:15] · "not too short not too long barely touching the shoe"; Wanhee · `tNVdA_arEa8` · [03:36] · "it just all falls apart"
- **The four:** only Frugal for; Tim and Wanhee lean against; Jaye silent.
- **Engine today:** lacks it (a cropped hem is neither credited nor charged).
- **AI can see it:** weakly (`hem` cropped); no (socks aren't read).
- **Frame:** `inputs/youtube/shots/xL1NeaA9D-Y/f-04-23.jpg`

#### prop.13. A peek of the under-layer lifts; a long hang below the jacket costs. Layer lengths are part of the composition.
- **Strength:** lift (a small peek, a cropped hoodie under a bomber) / fault (a long tee hanging well below a short jacket). **Holds when:** a shirt edge or a thin band showing below or at the opening of a jacket. **Doesn't:** in a casual outfit a tee showing below a cropped jumper is fine; tuck it for a neater finish.
- **Interacts with:** prop.6, sil.5, layering.
- **Sources:** Frugal · `Jh8dz-KZcfY` · [05:22] · "a shirt just peeking through a jacket can completely change a look"; Frugal · `Jh8dz-KZcfY` · [02:08] · "I like playing with a cropped hoodie to play with a composition"; Jaye · `Jz9QVWgBbOg` · [23:49] · "there's no reason you should have a extremely long white t-shirt"; Tim's guest · `OqoUgLxknJc` · [13:26] · "because this outfit's so casual you can have it hanging out"
- **The four:** Frugal and Jaye agree (the line between them is how much shows); Tim's guest allows it in casual; Wanhee silent.
- **Engine today:** has it [PRO-9] ("clearly" −0.5 and no shape credit; "a little" free).
- **AI can see it:** yes (`shows_below_outer` and look U; "a little" is the weaker answer, 71–82%).
- **Frame:** `inputs/youtube/shots/Jh8dz-KZcfY/f-05-27.jpg`

#### prop.14. The break follows the formality: a slight break is the classic office finish; a full break needs a fashion-forward rest of the outfit.
- **Strength:** nuance. **Holds when:** the same smart trouser can go either way. **Doesn't:** jeans and casual trousers follow prop.1 and prop.9.
- **Interacts with:** suit.5, occasion.
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
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-09-17.jpg`

#### prop.16. There is no single right proportion: the proportions you create are the look, and a committed long, low or dragging street proportion can work.
- **Strength:** nuance (it limits how hard the other prop rules should bite). **Holds when:** the whole outfit commits to the shape (very baggy, low, long in a street look). **Doesn't:** Frugal (dragging hems ruin it) and Jaye ("flailing" baggiest jeans) disagree, and so did Wanhee in 2023.
- **Interacts with:** prop.1, prop.2, style worlds.
- **Sources:** Wanhee · `RtxJqd5Drps` · [00:33] · "There's not necessarily a right or wrong proportion"; Wanhee · `RtxJqd5Drps` · [01:40] · "It doesn't look that bad."; Frugal · `env4ZvWzcd4` · [01:02] · "entirely dependent on the styling"; Tim · `0ilmLux6mPg` · [08:51] · "There is no universally correct answer."
- **The four:** Wanhee (2026) and Tim agree in principle; Frugal and Jaye differ on dragging hems (prop.1; Jaye `7K2qRZaXX3w` [06:53], "flailing everywhere in the wind").
- **Engine today:** has it differently (fixed credits and charges; [FIT-4] already frees a stack on loose jeans).
- **AI can see it:** no ("committed" isn't readable; only every piece agreeing).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-00-05.jpg` (the two-picture comparison at [00:00])

---

## Fit (fit.*)

#### fit.1. Fit is the floor: without it nothing else works, and adding pieces (a jacket, a loud shoe) can't cover a fit fault. Trousers matter most because nothing hides them.
- **Strength:** dealbreaker (a clear fit fault on a main piece, especially the trousers, caps the outfit whatever else is right). **Holds when:** the faults are visible: pulling (fit.2), swamping or sagging (fit.3), piling (prop.1), sleeves over the hands (fit.8, suit.9). **Doesn't:** a tee hidden under a jacket matters less ("you can't cheat pants" cuts one way only).
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
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-09-15.jpg`

#### fit.3. Too big fails when it sags, flaps or swamps; size as a shortcut (the biggest, boxiest tee) isn't a silhouette.
- **Strength:** fault. **Holds when:** wide trousers that slump instead of holding their shape, thin trousers flapping, a close-fit jacket (a biker) a size too big, an oversized hoodie that looks "swollen". **Doesn't:** baggy jeans, where "too big" is the point (Frugal); a deliberately boxy or oversized piece with the right details (fit.5).
- **Interacts with:** fit.4, fit.5, sil.4.
- **Sources:** Tim · `vziGl_FxQb0` · [03:15] · "the word baggy has a sort of sagging connotation"; Jaye · `7K2qRZaXX3w` · [06:53] · "the thinnest goddamn pair of pants that are flailing everywhere" (trimmed: "flailing everywhere in the wind"); Jaye · `Jz9QVWgBbOg` · [13:11] · "You getting oversized everything"; Frugal · `4DHGKfe-Vho` · [14:23] · "No, it's too big. It's too big."; Frugal · `ove4zof6W2k` · [00:00] · "default to like something really big or cropped or flashy"; Frugal · `xL1NeaA9D-Y` · [04:51] · "too big is kind of the goal here anyway" (baggy jeans, the exception)
- **The four:** all agree against sagging and swamping; Frugal exempts baggy jeans, which Jaye's "flailing" partly contradicts.
- **Engine today:** lacks it (a size big can't be told from cut roomy, KD-19; roominess 5 only blocks looks).
- **AI can see it:** weakly (`volume` 5 is rarely read; nothing reads sagging or flapping).
- **Frame:** `inputs/youtube/shots/4DHGKfe-Vho/f-14-28.jpg`

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
- **Frame:** `inputs/youtube/shots/DwolmJNAw_k/f-03-30.jpg`

#### fit.6. Skinny is out; slim is contested. A narrow leg is unforgiving: it needs everything else to work.
- **Strength:** fault (skinny) / nuance (slim). **Holds when:** skinny jeans, skinny joggers, tight tapered trousers. **Doesn't:** slim under tailoring; Jaye (2025) says for a skilled dresser skinny and baggy are about equal; Frugal says good styling can make any proportion work.
- **Interacts with:** sil.3 (a roomy top over a narrow leg), prop.10 (chunky shoes under it), prop.9 (the dated skinny stack).
- **Sources:** Tim · `wIib9hzVUuw` · [10:10] · "Those are three words that should never be in the same sentence." (skinny, leather, joggers); Tim · `wIib9hzVUuw` · [03:33] · "a precise taper rather than being slim all over"; Wanhee · `rNCrnP-os0U` · [02:03] · "not super wide, not super skinny"; Frugal · `xL1NeaA9D-Y` · [09:11] · "With other cuts, I feel like it's more forgiving."; Frugal · `JY_zrt43cbU` · [02:10] · "going from a trend to a red flag" (skinny jeans' arc); Jaye · `sOfjDjtjBWM` · [08:48] · "there's nothing wrong with that style"
- **The four:** Tim, Wanhee and Frugal reject skinny; on slim, Tim and Wanhee prefer straight, Frugal and Jaye are fine with it (`creators-rules.md`, KD-20).
- **Engine today:** has it [PRO-13] (slim −1.0, skinny −2.0; a straight read at roominess 2 or less counts as slim); dealbreakers S1, S2, N2.
- **AI can see it:** yes for slim-or-skinny vs straight-or-fuller (94% steady); weakly for slim vs straight alone.
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/o5-before-10-18.png`

#### fit.7. The right trouser cut has room through the seat and thigh and a gentle taper from the knee: not slim all over, not flaring at the hem.
- **Strength:** lift / fault (tight thighs with a normal hem, or a hem too wide for the leg). **Holds when:** relaxed jeans, wide jeans, smart trousers, wide sweatpants (open hem, high rise). **Doesn't:** Tim prefers straight on wide pleated trousers (sil.8); a barrel leg narrows at the hem by design.
- **Interacts with:** prop.1 (a too-wide hem swamps the shoe), fit.6.
- **Sources:** Tim · `vziGl_FxQb0` · [07:34] · "the perfect ratio between the width at the thighs, knees, and hem"; Tim · `CJv4TGLrdig` · [05:12] · "relaxed fit throughout the leg with a subtle taper from the knee"; Tim · `2KblatXQTGs` · [03:14] · "starts out looser around the seats and thighs and progressively tapers in"; Tim · `K2HS3_8cTx8` · [03:48] · "nice and wide through the seat and leg with a gentle taper"; Tim · `wIib9hzVUuw` · [10:40] · "Enough room in the thighs, straight cut, one break on the shoe"; Wanhee · `ew3gCk1zkso` · [02:06] · "that goes all the way to your shoes normal" (straight, not tight on the thighs); The Armoury (outsider) · `z_acMbzNfoQ` · [02:45] · "I don't like having overly narrow legs"
- **The four:** Tim (most) and Wanhee agree; Frugal's "tight waist wide legs" fits; Jaye silent.
- **Engine today:** has it differently [PRO-13] (only slim and skinny); taper and thigh room aren't scored.
- **AI can see it:** weakly (`leg_shape` has no taper; tight thighs only through `strain`).
- **Frame:** `inputs/youtube/shots/wIib9hzVUuw/f-10-45.jpg`

#### fit.8. Basics that fit are "put together", not special: a well-fitting tee and jeans is the base every other rule builds on.
- **Strength:** nuance (it sets the 7.0 base; fit alone doesn't lift above it). **Holds when:** a plain tee, straight jeans, clean shoes; "letting the fit do the talking". **Doesn't:** Frugal calls the perfect blank a false goal: it adds no interest, so a lift has to come from elsewhere.
- **Interacts with:** fit.1 (the base must be right before anything lifts it), everything that lifts.
- **Sources:** Frugal · `WMwH8xtSOWA` · [00:00] · "a nice good fitting t-shirt and good fitting jeans"; Frugal · `WMwH8xtSOWA` · [04:56] · "if you get this part right, everything else will only elevate it"; Frugal · `xL1NeaA9D-Y` · [01:35] · "one of the easiest to just throw on and get all right"; Frugal · `CsbsHWEBwy0` · [10:39] · "mid but mid in like a Lexus sedan kind of way"; Frugal · `JY_zrt43cbU` · [02:10] · "A good fitting pair of blue jeans will always be an asset"; Tim's guest · `OqoUgLxknJc` · [17:13] · "very simple pieces but letting the fit do the talking"
- **The four:** all agree (Tim's staples, Jaye's foundation, Wanhee's white tee and 501 "dressed well").
- **Engine today:** has it [SCO-1] (the plain tee, dark jeans and white sneakers score 7.0), [FIT-1], [STY-12].
- **AI can see it:** yes (`subcategory`, `leg_shape`, `volume`, `condition`).
- **Frame:** `inputs/youtube/shots/xL1NeaA9D-Y/f-01-40.jpg`

#### fit.9. Small edges count: sleeves end where they're meant to (a long-sleeve below the wrist, above the fingers), and a neckline or collar sits neat.
- **Strength:** nuance (fault when a sleeve swallows the hand, suit.9). **Holds when:** long-sleeve tees, knits, turtlenecks that stand up without folding, shirt collars that hold. **Doesn't:** a roomy piece cut long in the sleeve on purpose (fit.4).
- **Interacts with:** suit.9, fit.5.
- **Sources:** Tim · `a7FgCE9NPmw` · [06:09] · "longer sleeves meant to end below your wrist and above your fingers"; Tim · `a7FgCE9NPmw` · [02:51] · "The neckline is also extremely important"; Tim · `OqoUgLxknJc` · [10:17] · "it's not too high where you have to fold it over"
- **The four:** only Tim (others silent).
- **Engine today:** has it [FIT-2] for sleeves over the hands; lacks the neckline.
- **AI can see it:** weakly (`sleeve_end` 70–76%, a bent arm fools it); no for collars.
- **Frame:** `inputs/youtube/shots/OqoUgLxknJc/f-10-22.jpg`

---

## Suits and tailoring (suit.*)

**How suits are worn casually now (the four, 2023–2026).** The outsiders say almost nothing past "a navy jacket with jeans". The current casual suit comes from the four: a wider-fitting two-piece over a plain tee or tank (Tim); crisp tailoring with no tie, even no dress shirt, a polo or tee under it (Tim); a tee tucked into tailored trousers under a blazer with loafers (Tim); a blazer with jeans by day (Tim); sneakers with formal wear and a design shirt under a black blazer, kept from "try hard" (Wanhee); an open blazer, an open white shirt instead of a buttoned one and a tie, a suit worn with flared denim (Jaye). Against that, black tie "sticks to the rules", and a suit everywhere (the gas-station run) overdresses (Jaye 2026, Tim).

**How this fits `specs/tailored.md`.** TL1's home pieces (a plain tee or knit under the jacket, clean white leather sneakers) are backed by the four (suit.10, suit.12), not by the outsiders. TL1's "never with jeans" is right as a name rule: a blazer with jeans is a good separate (suit.11), so it must never be charged as a clash either. TL5's fixes in order of creator support: the hem under the trousers (suit.5), sleeves over the hands, softer on a relaxed blazer (suit.9), pulling across a buttoned jacket (suit.4), a loud oversized graphic tee under tailoring (suit.13). The spec's "Later" credits: a clean hem touching the shoe under a suit is the strongest candidate (suit.5); a high rise under the jacket second (suit.6, unreadable today). A short or boxy tailored jacket must not be charged (suit.2, suit.8).

#### suit.1. Relaxed is current: a suit no longer needs to be slim; a slightly relaxed or boxy jacket is fine; skin-tight ruins it, and so does oversized everything.
- **Strength:** lift (a relaxed suit that still fits) / fault (skin-tight, or swamping). **Holds when:** smart casual and everyday tailoring, a two-piece or a blazer; boxy on purpose. **Doesn't:** black tie stays slim and by the rules; Wanhee's "really slim Italian guy in a suit" is still a valid choice (slim is never charged unless it pulls).
- **Interacts with:** suit.4 (relaxed is not pulling), suit.9 (a relaxed blazer's sleeve can run a bit long), occasion.
- **Sources:** Tim · `vQ6_okzfNSs` · [04:16] · "the two-piece suits no longer needs to be a slim fit"; Tim · `vQ6_okzfNSs` · [04:16] · "explore some wider fitting suits"; Tim · `-V2bE8nDsdo` · [01:31] · "a slightly relaxed fit, which I prefer in a blazer"; Tim · `OqoUgLxknJc` · [08:40] · "not like incredibly baggy or anything"; Tim · `vziGl_FxQb0` · [07:02] · "a more modern take on tailoring" (a slightly boxy double-breasted suit); Jaye · `Jz9QVWgBbOg` · [13:11] · "Nothing wrong with a boxy suit if that's what you're going for"; Jaye · `Jz9QVWgBbOg` · [13:11] · "you getting these skin tight jackets"; Wanhee · `ew3gCk1zkso` · [11:15] · "really Slim like put together Italian guy in a suit"; Tim's guest · `OqoUgLxknJc` · [12:55] · "stick to the rules of tailoring" (black tie); Justin Kwan (outsider) · `pQctf3wAlpI` · [01:41] · "slim fit equals slimmer looking, but it's a lie"
- **The four:** Tim and Jaye agree; Wanhee allows slim as a choice; Frugal silent on suits. GQ's "a too-big waist looks boxy" is dropped (the four win).
- **Engine today:** has it differently [FIT-3] (pulling costs) but [FIT-2] charges a blazer's sleeves over the hands −2.0, which hits relaxed blazers Tim likes; nothing rewards the relaxed cut.
- **AI can see it:** weakly (`volume` on a blazer, `strain`).
- **Frame:** `inputs/youtube/shots/vQ6_okzfNSs/f-04-21.jpg`

#### suit.2. A suit wins on fit: the shape comes from the shoulder and chest (a shoulder slightly past the natural one, a little drape), not from a waist taken in tight.
- **Strength:** lift. **Holds when:** jackets and coats; Tim's "slightly wider with enough structure" and broad, straight-hemmed boxy jackets. **Doesn't:** a jacket "hanging off" the shoulder a size too big (fit.3).
- **Interacts with:** sil.6 (the same shoulder logic in coats), suit.1, suit.4.
- **Sources:** Jaye · `Jz9QVWgBbOg` · [13:11] · "what makes your suit better is the tailoring"; Tim · `UNkA9HhbjXY` · [08:38] · "it fits you really well" (his praise of a custom suit); Tim · `wIib9hzVUuw` · [03:33] · "slightly wider with enough structure"; Tim · `0ilmLux6mPg` · [07:42] · "broad shoulders and a straight cut at the hem"; The Armoury (outsider) · `z_acMbzNfoQ` · [01:08] · "my jacket extends a little bit further"; The Armoury (outsider) · `z_acMbzNfoQ` · [02:11] · "give you the illusion of a waist"
- **The four:** Tim and Jaye agree; Wanhee and Frugal silent.
- **Engine today:** has it differently [FIT-1] (Fit stops at 7 even on a sharp tailored outfit; no shoulder read, KD-13).
- **AI can see it:** no (shoulder position and structure aren't read; the shoulder-seam read failed at 78%).
- **Frame:** `inputs/youtube/shots/0ilmLux6mPg/f-07-47.jpg`

#### suit.3. The suit trouser touches the shoe with no break or one clean break; too long bunches, deliberately short is out.
- **Strength:** lift (a clean hem) / fault (bunching on the shoe). **Holds when:** suit and dress trousers over loafers, derbies or clean sneakers. **Doesn't:** the outsiders split on no break (The Armoury) vs one break (GQ); the four only need the hem to touch the shoe, so neither is scored. GQ's "cut them shorter for a cleaner look" is dropped (Tim: too short ruins the silhouette).
- **Interacts with:** prop.1, prop.14, suit.5 (a fuller leg falls straighter).
- **Sources:** Tim · `0ilmLux6mPg` · [08:15] · "barely breaking on the shoes"; Tim · `SNjfZ5NKndc` · [00:00] · "Too short and it will ruin your silhouette"; Tim · `wIib9hzVUuw` · [08:07] · "having the trousers meet the shoe seamlessly"; The Armoury (outsider) · `z_acMbzNfoQ` · [03:17] · "the trouser is just barely touching the shoe"; GQ (outsider) · `bLcGL6rKBBg` · [10:52] · "a classic length would be to have a single break"
- **The four:** Tim agrees (strongly); Frugal and Wanhee agree through prop.1; Jaye silent on suit hems.
- **Engine today:** has it differently [FIT-4] (trousers piling on a straight leg −2.0); no credit for a clean break (the Tailored spec's "Later" list).
- **AI can see it:** weakly (`hem`); look L reads covering the shoe well.
- **Frame:** `inputs/youtube/shots/0ilmLux6mPg/f-08-20.jpg`

#### suit.4. Nothing pulls: no X-creases at the button, no lapels bowing off the chest, no gaping trouser pockets, no straining shirt.
- **Strength:** fault. **Holds when:** visible from the front, mostly with the jacket buttoned. **Doesn't:** a relaxed or boxy jacket with room isn't this (suit.1).
- **Interacts with:** suit.1, fit.2.
- **Sources:** Tim · `wIib9hzVUuw` · [09:10] · "The fabric is even pulling at the thighs"; Jaye · `Jz9QVWgBbOg` · [13:11] · "you getting these skin tight jackets"; GQ (outsider) · `bLcGL6rKBBg` · [07:32] · "horizontal lines and creases across the front of the jacket"; GQ (outsider) · `bLcGL6rKBBg` · [02:38] · "hug the body without being too tight or too loose"; GQ (outsider) · `bLcGL6rKBBg` · [09:48] · "a telltale sign that the trousers are too tight"
- **The four:** Tim and Jaye agree (others silent on suits).
- **Engine today:** has it [FIT-3].
- **AI can see it:** weakly (`strain`).
- **Frame:** `inputs/youtube/shots/bLcGL6rKBBg/f-07-37.jpg`

#### suit.5. Suit trousers sit higher and fuller: a high rise under the jacket makes one silhouette and a long leg line; a fuller leg falls straight; pleats and a pressed crease are welcome.
- **Strength:** lift (high rise, pleats, crease, a straight-falling fuller leg) / fault (low rise under a jacket). **Holds when:** a jacket over trousers, worn open or with a tuck so the waistband shows. **Doesn't:** jeans are allowed lower; GQ's flat-front preference is dropped (Tim likes pleats).
- **Interacts with:** prop.8, prop.3, suit.3.
- **Sources:** Wanhee · `RtxJqd5Drps` · [01:40] · "a lot of like formal wear will be like this" (a blazer with trousers worn high); Jaye · `RIuzSb8OLMM` · [14:14] · "High rise on the other end, it elongates your legs."; Tim · `0JtnbgtbQfE` · [01:07] · "ideally something with a center press crease"; Tim · `0JtnbgtbQfE` · [01:07] · "usually I like them with the pleat"; Tim · `_6-4CHHXg3c` · [00:35] · "cut generously throughout the leg with a slight taper"; Tim · `2KblatXQTGs` · [03:14] · "they still feel like a smart trouser thanks to the center crease"; GQ (outsider) · `bLcGL6rKBBg` · [08:44] · "doesn't pair well with a jacket" (low rise); Justin Kwan (outsider) · `skd8U8dmIP4` · [02:42] · "Low-rise cuts your body in half"
- **The four:** Wanhee, Jaye and Tim agree; Frugal's "wide high-waisted trousers" fit.
- **Engine today:** has it differently [PRO-13] (exempts suit trousers and trousers under a blazer from the slim charge); [PRO-7] (the tailored line, +1.0, needs a tucked top); rise, pleats and crease: lacks.
- **AI can see it:** no (rise, pleats and crease aren't read).
- **Frame:** `inputs/youtube/shots/RtxJqd5Drps/f-01-45.jpg`

#### suit.6. Jacket length: no fixed rule; a short or boxy jacket over full trousers is fine, but a jacket cut so long it swallows the legs is a fault.
- **Strength:** fault (too long) / nuance. **Holds when:** a suit or sport jacket over trousers. **Doesn't:** GQ and Kwan's "too short shows the seat / splits you in half" is dropped: the four read a jacket ending where the trousers start as a deliberate break (prop.3).
- **Interacts with:** prop.2, prop.3, suit.9 (too-long sleeves make the jacket look longer).
- **Sources:** Tim · `0ilmLux6mPg` · [08:15] · "the jacket cuts abruptly where the trouser starts"; GQ (outsider) · `bLcGL6rKBBg` · [08:11] · "it's gonna swallow the legs up"
- **The four:** Tim for the short jacket; the "too long" half comes from GQ, consistent with the four's prop.6; others silent.
- **Engine today:** lacks it.
- **AI can see it:** weakly (`length` on the jacket).
- **Frame:** `inputs/youtube/shots/bLcGL6rKBBg/f-08-16.jpg`

#### suit.7. The sleeve ends at the wrist and must not swallow the hand; the exact shirt cuff isn't scored, and a relaxed blazer may run a little long.
- **Strength:** fault (sleeve over the hand), softer on a deliberately relaxed blazer. **Holds when:** blazers, suit jackets, overcoats. **Doesn't:** the outsiders' 1–2 cm of shirt cuff is what Tim calls the surface-level checklist.
- **Interacts with:** suit.1, suit.6, fit.9.
- **Sources:** Tim · `wIib9hzVUuw` · [01:01] · "exactly 1 in of your shirt cuff underneath a blazer" (as the surface level); Tim · `-V2bE8nDsdo` · [01:31] · "a slightly relaxed fit, which I prefer in a blazer"; GQ (outsider) · `bLcGL6rKBBg` · [05:15] · "it will start swallowing up the hand"
- **The four:** Tim softens it; others silent. Kept from the outsiders only as "don't swallow the hand".
- **Engine today:** has it [FIT-2] (−2.0 on a blazer, suit jacket or overcoat); dealbreakers H9 proposes a hold with a relaxed-blazer exception.
- **AI can see it:** weakly (`sleeve_end` 70–76%; a bent arm fools it).
- **Frame:** `inputs/youtube/shots/bLcGL6rKBBg/f-05-20.jpg`

#### suit.8. Tailoring worn casually is the current way: a tee, tank or polo under the jacket, no tie, a tucked tee with loafers, an open blazer.
- **Strength:** lift. **Holds when:** the tailoring is crisp and the casual layer under it is plain; smart casual, dates, a creative office. **Doesn't:** at a strict corporate office or black tie; a loud oversized graphic under it (suit.13); an untucked dress shirt under a blazer ([CON-3]).
- **Interacts with:** occasion, style (the high-low mix is the point), suit.12.
- **Sources:** Tim · `vQ6_okzfNSs` · [04:16] · "a simple t-shirt or tank top underneath for an elegant smart casual"; Tim · `jaOSdGqtgYY` · [06:59] · "crisp tailoring especially when worn casually without a tie"; Tim · `-V2bE8nDsdo` · [04:37] · "oversized t-shirt tucked into the tailored trousers"; Tim · `-V2bE8nDsdo` · [02:34] · "by swapping the sneakers for loafers and adding a blazer"; Jaye · `23ZCHsp9AZU` · [01:32] · "most people will tie and button it up" (he wears the shirt open); Jaye · `Pxeeh-caTJg` · [21:42] · "this fit has a open blazer"; Jaye · `VUEaMYx10mM` · [12:28] · "But what if my suit and tie has flared denim?"; Wanhee · `tNVdA_arEa8` · [02:36] · "going against the expectation"
- **The four:** Tim, Jaye and Wanhee agree; Frugal silent.
- **Engine today:** has it differently [STY-4] (since v11 a tee or tank under a suit isn't charged), [STY-1]/[STY-2] (a matching suit's credits), TL1's home pieces; no credit for the casual mix itself.
- **AI can see it:** yes (`subcategory` of the inner top and jacket, `tucked`).
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-42.jpg`

#### suit.9. A blazer with jeans is a good separate ("cool professor"), best with a softer jacket.
- **Strength:** lift. **Holds when:** a blazer or unstructured jacket with jeans by day, tee or flannel under it, loafers or sneakers. **Doesn't:** it isn't Tailored by name (TL1); the engine's charge on light, mid or relaxed jeans is not what the four say.
- **Interacts with:** suit.8, style worlds (prep or smart casual).
- **Sources:** Tim · `-V2bE8nDsdo` · [04:07] · "effortless, cool professor vibe"; Jaye · `VUEaMYx10mM` · [12:28] · "But what if my suit and tie has flared denim?"; GQ (outsider) · `4fb4GyOylK8` · [12:41] · "pair that with more casual trousers or a pair of jeans"
- **The four:** Tim and Jaye agree; others silent.
- **Engine today:** has it differently [STY-3] (a tailored jacket with relaxed, wide, light, mid-wash or distressed jeans −1.5; dark straight jeans free). The four would charge none of it; a founder call.
- **AI can see it:** yes (`subcategory`, `color_family` denim washes, `leg_shape`).
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-12.jpg`

#### suit.10. Clean, low sneakers work under tailoring; chunky or running sneakers don't.
- **Strength:** nuance (clean sneakers) / fault (chunky under a blazer). **Holds when:** white leather or plain low sneakers under a suit or blazer, kept from "try hard". **Doesn't:** at an interview the engine holds sneakers under a blazer to 7.0 ([OCC-4]); no creator line here names chunky sneakers under suit trousers directly.
- **Interacts with:** shoes, prop.10 (a chunky shoe wants a generous leg, which suit trousers rarely are), suit.8.
- **Sources:** Wanhee · `tNVdA_arEa8` · [02:36] · "wearing sneakers with Formal Wear"; Wanhee · `tNVdA_arEa8` · [02:36] · "then it just looks try hard" (when overdone); Tim · `-V2bE8nDsdo` · [04:37] · flannel under a blazer with jeans and sneakers (no checked quote, described)
- **The four:** Wanhee and Tim agree; others silent.
- **Engine today:** has it [SHO-8] (chunky under a blazer −2.0), [SHO-3] (running shoes 4.5 under a blazer), [OCC-4]; TL1 makes clean sneakers a home piece.
- **AI can see it:** yes (shoe `subcategory`).
- **Frame:** `inputs/youtube/shots/-V2bE8nDsdo/f-04-42.jpg`

#### suit.11. Smart trousers carry tailoring without a jacket: pleated, creased trousers dress up or down, and even pleated track pants read slightly tailored.
- **Strength:** nuance (lift for the piece). **Holds when:** a pleated, center-creased wide trouser with a shirt over a tank for smart, a tee and cap for casual. **Doesn't:** relaxed tailoring with no jacket stays minimal or smart casual by name (`specs/tailored.md` Out).
- **Interacts with:** suit.5, style worlds (minimal, smart casual).
- **Sources:** Tim · `vQ6_okzfNSs` · [03:12] · "you can wear this just as easily in a sophisticated"; Tim · `o5RnTT2oafg` · [04:27] · "paired with a shirt long sleeve or short sleeve over a vest"; Tim · `vziGl_FxQb0` · [02:45] · "the comfort of a jogger, but with a sharper silhouette"; Tim · `2KblatXQTGs` · [03:14] · "they still feel like a smart trouser thanks to the center crease"
- **The four:** only Tim (others silent).
- **Engine today:** has it differently (trousers sit at dressiness 4, pull-on trousers lower; pleats and crease aren't scored; pleated track pants read as sweats or pull-on).
- **AI can see it:** weakly (`subcategory` trousers vs pull-on trousers); no for pleats and crease.
- **Frame:** `inputs/youtube/shots/vQ6_okzfNSs/f-03-17.jpg`

#### suit.12. Statement tailoring details: a double-breasted jacket carries more style (and should be worn buttoned); collarless or lapel-less jackets and a three-button cut are subtle twists.
- **Strength:** lift (small). **Holds when:** double-breasted, ideally with wide lapels; a blazer with no lapels; a three-button jacket that reads more like outerwear. **Doesn't:** an open double-breasted jacket hangs wide (GQ; the four silent).
- **Interacts with:** suit.1 (a boxy DB suit is Tim's modern take), sil.6.
- **Sources:** Tim · `-e9Is50-fn0` · [00:31] · "is at least double the style points"; Tim · `-e9Is50-fn0` · [03:21] · "They make a statement kind of by not making one" (collarless); Tim · `SNjfZ5NKndc` · [02:01] · "a blazer with no lapels"; Tim · `30L-EHe4WAQ` · [04:55] · "makes it feel a little more like a jacket"; GQ (outsider) · `4fb4GyOylK8` · [09:58] · "you really need to wear it done up"
- **The four:** only Tim (others silent).
- **Engine today:** lacks it.
- **AI can see it:** no (no double-breasted, lapel or button read; `subcategory` only names the jacket).
- **Frame:** `inputs/youtube/shots/-e9Is50-fn0/f-00-36.jpg`

#### suit.13. A loud or oversized graphic tee fights tailoring; a muted design shirt under a dark blazer is wit.
- **Strength:** fault (oversized or loud graphic under a jacket) / lift (a quiet twist). **Holds when:** a blazer or suit jacket over a graphic tee. **Doesn't:** a plain or fitted tee (suit.8); a design shirt toned down by a black blazer and black trousers.
- **Interacts with:** suit.8, color (a dark jacket tones a busy piece down), pattern.
- **Sources:** Wanhee · `tNVdA_arEa8` · [02:36] · "going against the expectation"; Wanhee · `tNVdA_arEa8` · [02:36] · "then it just looks try hard"
- **The four:** only Wanhee (others silent); the engine's charge comes from FashionBeans, not the four.
- **Engine today:** has it [STY-10] (an oversized graphic tee under tailoring −1.5; a regular one free).
- **AI can see it:** yes (`subcategory` graphic_tee, `volume`, `pattern`, `pattern_scale`).
- **Frame:** `inputs/youtube/shots/tNVdA_arEa8/f-02-11.jpg`

#### suit.14. Dress for the room: a full suit for an errand overdresses, and wearing one everywhere kills its effect.
- **Strength:** nuance (occasion). **Holds when:** a full suit and dress shoes at an everyday or casual setting. **Doesn't:** where a blazer or suit is expected, lean smarter (Tim); Jaye's 2025 "always overdress" is his older view.
- **Interacts with:** occasion (that part owns the numbers), suit.8 (casual tailoring is the middle path).
- **Sources:** Jaye · `Jz9QVWgBbOg` · [11:10] · "If you wear a suit jacket everywhere to every occasion"; Tim · `IUMqpLeCT-E` · [00:33] · "three-piece suit to a casual family Barbecue"
- **The four:** Jaye (2026) and Tim agree; Jaye (2025, `7K2qRZaXX3w`) differs; newest wins.
- **Engine today:** has it [OCC-2] (a full suit at Everyday −0.25); the Tailored spec keeps it.
- **AI can see it:** yes (`subcategory`, occasion from the user).
- **Frame:** none (described only)

---

## Not scorable from a photo
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

## For the dealbreakers sheet
- S1 (hoodie or sweatshirt over skinny jeans): creators agree (sil.3, fit.6).
- S2 (oversized top over skinny jeans): creators agree; Jaye calls the skinny-jeans-big-runners-boxy-tee look valid but one to move on from (sil.3, fit.6).
- S3 (a top past the crotch): creators say change: a hold (6.5) fits their words better than a sink (Tim's "pet peeve", Wanhee's "cut in half"); spare long coats and a committed long-and-low look (prop.6, prop.2, sil.5, prop.16).
- H1 (oversized top over slim jeans): creators say change: only Frugal treats it as a fault; Tim and Jaye call the direction a choice and two of four are fine with slim, so keep it a parts charge, not a cap (sil.3, fit.6, sil.10).
- H2 (regular or long tee over baggy pants): creators say change: cap only a tee long in the body (past the fly); a roomy tee of neutral length over wide pants is Frugal's 2024 and 2026 template (prop.6, prop.4, sil.4).
- H7 (straight or slim pants pooling over the shoe): creators agree, and more strongly: Frugal's "the whole thing is trash" and Tim's "make or break" support a sink, not a hold, once the read is the shoe close-up (prop.1).
- H8 (a top that clearly pulls): creators agree (fit.2, suit.4).
- H9 (sleeves covering the hands): creators say change: exempt a deliberately relaxed blazer and roomy pieces cut long (suit.7, fit.4).
- H10 (chunky sneakers under slim or skinny jeans): creators agree (prop.10).
- H11 (suit or dress trousers with chunky or running sneakers): creators agree on the exception (clean low sneakers are fine); no creator quote names chunky sneakers under suit trousers directly (suit.10).
- N1 (big on top and big on the bottom): creators agree: leave to normal scoring (sil.4).
- N2 (skinny jeans with a fitted tee): creators agree it's a fault (Wanhee's "tight muscle t-shirt", Tim's skin-tight), and the parts charges already carry it; no cap (fit.2, fit.6).
- N4 (shorts with boots or a puffer): creators agree: not wrong; Tim's jacket over shorts "proven wrong" (sil.11).
- L1 (a waist break over wide pants): creators agree; keep it big (prop.3); Wanhee and Tim prefer at-belt or a tuck to a true crop (prop.4).
- L2 (a short jacket over wide pants): creators agree (prop.5).
