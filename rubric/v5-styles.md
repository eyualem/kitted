# Kitted's style rules, as the app applies them (parts engine v6)

*Oct 11, 2026. DECISIONS-LOG #216; v6's three fixes #217. The founder: "be sure the app is following streetwear rules, smart casual rules and so on… it should follow the rules that are listed, it shouldn't just guess."*

This is the rulebook the app **actually follows today** on every new fit check. It was written from the engine's code and data (`extraction-test/rubrics/parts_proto.py`, engine v6, and its TypeScript twin in the app, parts data 1.3.0), not from the research. Where the research says something the engine doesn't do, or the other way round, it's listed at the end under **Known differences**.

**Every rule has an ID in brackets, like [STR-5].** Each ID has one or more made-up test outfits that must behave exactly as the line says: 290 outfits for 128 rules. They run in Python (`extraction-test/rules_conformance.py`) and in the app's tests (`rulesConformance.test.ts`), and a test's name starts with its rule ID. So if a change ever breaks a rule written here, the test named after that rule fails.

**The AI never judges.** It only names each piece (what it is, its color, pattern, how roomy it is, the leg shape, the hem, whether it's tucked and where it ends, its condition). Everything below is code applied to those names. The same photo always gets the same score. Faces, bodies, weight and skin are never rated, and his age and picked styles never change a number.

**Contents:** how a score is made · the rules for every style (Proportions, Fit, Color, Shoes, Style, Condition, Occasion, Loungewear) · the seven styles · no clear style · Known differences.

---

## How a score is made

- **[SCO-1] Five parts, each starting at 7** ("fine, nothing off"): Proportions 30%, Fit 25%, Color 15%, Shoes 15%, Style 15%. The score is the weighted average, rounded to the nearest half. A part that can't be seen (shoes out of the photo, say) drops out, and the other parts' shares grow to fill the gap. A plain white tee, dark straight jeans and white leather sneakers scores **7.0 "Put together"**.
  - *How much a point is worth:* one point on Proportions moves the score by 0.3; on Fit by 0.25; on Color, Shoes or Style by 0.15. So a +1.0 Style credit alone often isn't enough to move the rounded score.
- **[SCO-2] A small bonus for being strong in more than one place:** +0.25 when a second part reaches 8 and no part is below 7 (it fades out as the weakest part drops from 7 to 6.5).
- **[SCO-3] A floor of 5.0** at Everyday, Class, Gym and Home, so one bad day doesn't sink a clean outfit. It doesn't apply when a piece is stained, worn or clearly strained, and never at a date, going out, an interview or an event. Nothing goes below 3.0.
- **[SCO-4] His picked styles never move a number.** They only choose which name "Reads as" shows when two looks fit equally (and they order the fixes). A sweater over wide trousers with loafers reads as minimal with no picks and as smart casual with Smart casual picked; every part and the score are identical.
- **[SCO-5] A photo where he isn't fully clothed isn't scored.**
- **[SCO-6] Accessories and anything the AI isn't sure of are left out.** A belt, a watch or an "unsure" piece changes nothing. (Traditional clothing is left out too and the card says "not rated".)

Score words: 5.5 or less "Needs a fix" · 6–6.5 "Getting there" · 7–7.5 "Put together" · 8–8.5 "Sharp" · 9–9.5 "Dialed in".

---

## The rules for every style

These apply to everyone. Each style below only adds to them (what it recognizes, rewards, allows and marks down).

### Proportions (30%): the shape of the outfit
- **[PRO-1]** Not scored with **shorts** (no shorts-length reading yet) or when the legs aren't in the photo.
- **[PRO-2]** A roomy top or jacket (roominess 4 or 5 of 5) over **skinny** legs: **−1.5**.
- **[PRO-3]** Any jacket over skinny legs ("nothing sturdy to sit on"): **−0.5** (when [PRO-2] didn't already charge).
- **[PRO-4] The waist break, +1.5:** a fully tucked top, or a top that ends at the belt or is cropped, worn with no jacket over straight, relaxed or wide legs. In a mirror selfie an *untucked* short top earns only +0.5 (holding the phone up lifts the hem); a full tuck keeps +1.5. Knits, hoodies, sweatshirts and fleeces only count as "short" when they're roomy (their ribbed hem sits at the belt by design). Over skinny or slim legs it earns nothing.
- **[PRO-5] A front tuck, +0.5** (not on hoodies, sweatshirts or knits).
- **[PRO-6] A short jacket over full legs, +1.5:** a bomber, a denim jacket or a leather jacket over straight, relaxed or wide legs. An overshirt, chore coat or field jacket isn't a short jacket.
- **[PRO-7] The tailored line, +1.0:** a blazer, sport coat or suit jacket, a fully tucked top, and trousers or chinos (not skinny).
- **[PRO-8] One shape credit per outfit, and a clean finish:** a tucked tee under a bomber earns the short-jacket credit, not the waist break as well. Pants that pile on the shoes ("pooling"), or sweatpants, joggers and gym shorts, block every shape credit.
- **[PRO-9] A shirt showing below the jacket, −0.5,** and no jacket shape credit. This comes from a separate second look at the photo; the app doesn't run that look yet, so today it never fires on a real check (Known differences, KD-15).
- **[PRO-10] Tips only, never points** (their readings aren't steady enough yet): a top that may run past the fly; a long loose jacket over loose legs; a heavy hem under a blazer; an untucked shirt hanging over wide legs.
- **[PRO-11] Roomier than the look, −1.5** (new in v6: the style council's per-style bands, back). Each look has a range of roominess and leg it calls for; a **roomy top** (roominess 4 or 5) worn on its own is charged when no look the outfit reads as holds it:
  - over **straight, relaxed or wide** legs it's held by streetwear, minimal, workwear, vintage sport and outdoor (their range reaches roomy), not by smart casual, classic prep or no clear style;
  - over **slim** legs only outdoor holds it (its legs run slim to wide); the others' roomy looks start at straight ("an oversized top wants a fuller leg").
  - **Never charged:** a roomy top that's fully tucked or ends at the belt over a full leg (a deliberate waist); over straight or wide trousers or chinos ("city boy"); under a jacket or overshirt (the layer sets the line); over sweats or joggers (the loungewear rules own them); over skinny legs ([PRO-2] charges it); when Fit already calls it a size big ([FIT-2]); when it's charged as a piece from another look ([STY-5]): one fact, one charge.
  - *Why these readings:* only roomy (4–5) against regular or close (3 and under), and slim-or-skinny against straight-or-fuller, held steady across repeat photos; 4 against 5, and slim against straight on their own, didn't. So there's one step, worth what one step cost in the old rubric (0.45 on the score). His picks never hold the room: only the look the clothes read as does.
  - An oversized tee over dark straight jeans with white leather sneakers (no look) scores **6.5 "Getting there"**; over wide black jeans it reads as streetwear and stays 7.0; tucked in, it earns the waist break (7.5).
- **[PRO-12] Legs wider than the look, a tip only:** wide trousers or chinos under a regular untucked top, when the outfit reads as smart casual, classic prep or no clear style (their legs stop at relaxed). Wide against relaxed isn't a steady reading, so it never costs points. Wide jeans and cargos, a close, short or tucked top, and minimal, streetwear, workwear, vintage sport and outdoor outfits never get it.

### Fit (25%): is each piece his size
- **[FIT-1] Fit can only find faults.** No reading can show a great fit yet, so a clean outfit stops at Fit 7, even a sharp tailored one.
- **[FIT-2] Sleeves over the hands:** a blazer, suit jacket or overcoat **−2.0**; hoodie, sweatshirt, knit or fleece cuffs **−0.5**; a roomy shirt or jacket "a size big" **−2.0**; any other top **−1.5**. A tee read as covering the hands is a misread and ignored.
- **[FIT-3] A piece that clearly pulls:** a top **−2.0**; slim or skinny pants **−1.5**; other pants **−2.0**. "Some" strain never counts.
- **[FIT-4] Pants piling on the shoes:** trousers or chinos **−2.0**; jeans, cargos and others **−1.5**; sweats and joggers **−0.5**. Loose jeans or cargos dragging over slides are charged on Shoes instead ([SHO-2]).
- **[FIT-5] The worst piece counts in full, every other faulted piece half.** One piece's own faults add the same way (worst in full, the rest half), up to −4 per piece. Blazer sleeves over the hands plus pooling trousers: Fit 4.0.
- **[FIT-6] Tip only:** slim pants with a full break run a little long.

### Color (15%): the clothes' colors and patterns (the shoes' color belongs to Shoes)
*Neutrals:* white, cream, light grey, grey, charcoal, black, navy, khaki, tan, brown, light blue, olive and every denim wash. *Bright:* red, orange, yellow, pink and purple (unless read muted), and green or blue only when read bright. Everything else is an accent.
- **[COL-1] Too many colors:** three or more accent colors **−2.5**; five or more color families with two or more accents **−1.0**. A muted accent (or burgundy, or sage) counts half.
- **[COL-2] Two bright colors fighting: −2.0** (−1.0 in a streetwear outfit or for a man who likes bold color).
- **[COL-3] A dark blazer with dark trousers that almost match** (navy with charcoal, say): **−1.5**.
- **[COL-4] Patterns:** the same pattern twice at the same size **−1.5** (−0.75 when the size wasn't read); three patterns at once **−1.5** (not in streetwear).
- **[COL-5] Rewards, only when there's no color fault, up to +2.0 in all:** one bright piece as the only accent, **+1.0**; otherwise one quiet accent, **+0.5**; shoes that pick up a color from the top or jacket (not white, black, grey, navy or denim), **+0.5**. A stained or worn piece earns nothing ([CON-4]).
- **[COL-6]** Not scored with fewer than two pieces of clothing in view.
- **[COL-7] Tips only:** an outfit all in one color family ("a lighter or darker piece would add depth"); double denim ("make the washes clearly different").

### Shoes (15%): the right shoes for these clothes
*Dressiness levels:* 1 athletic (slides, gym shorts, sweats, joggers, tank tops) · 2 casual (tees, hoodies, jeans, cargos, most sneakers) · 2.5 (work boots, low-profile sneakers, leather jackets, dark undistressed jeans) · 3 smart casual (polos, oxfords, knits, chinos, chore coats, white leather sneakers, suede chukkas) · 3.5 (knit polos, loafers, Chelsea boots, unstructured blazers) · 4 business casual (dress shirts, trousers, blazers, overcoats, derbies) · 5 formal (suits, dress shoes).
- **[SHO-1] Not scored** when the shoes aren't in the photo, or when the AI lost the shoe type (the app asks "Boots, sneakers or slides?").
- **[SHO-2] Slides out of the house:** Shoes drops to **4.5** (2.5 under a blazer), loose jeans or cargos dragging on them cost **0.5** more, and nothing can lift it. At the gym or at home they're fine.
- **[SHO-3] Running shoes:** Shoes **6.0** (4.5 under a blazer), nothing can lift it. Fine at the gym or at home, and in an outdoor outfit ([OUT-3]).
- **[SHO-4] Shoes that match the clothes' dressiness, +0.5:** from up to 1.5 levels dressier to 0.75 more casual, fading out beyond. It needs a shoe of level 2.5 or more for the full half point (plain canvas, chunky, retro and running sneakers earn nothing), and with sweats only a sneaker matches.
- **[SHO-5] Shoes too casual for the clothes:** a ramp that starts one level under the clothes, reaches **−1.5** at two levels and **−2.5** at three.
- **[SHO-6] Shoes much dressier than the clothes** (dress shoes with a hoodie): from two levels dressier, up to **−0.5** at two and a half, and the shoe's other credits fade out with it.
- **[SHO-7] The look's own shoe, +0.5:** a shoe that belongs to a style the clothes read as *without the shoes* (so a shoe can't reward itself), or dress shoes, derbies, loafers or Chelsea boots under a matching suit. A worn shoe doesn't earn it.
- **[SHO-8] Chunky sneakers under a blazer: −2.0.**
- **[SHO-9] Shoe weight against the leg:** chunky or basketball sneakers under slim or skinny legs **−1.5**; running shoes under them **−0.5**.
- **[SHO-10] Shoe color:** a loud shoe (bright or multicolor) with a loud piece (a bright piece, a big pattern, a graphic, camo, floral) **−0.75**; a loud shoe as the outfit's one accent **+0.5**.
- **[SHO-11] Worn or dirty shoes: −1.0** (work boots and suede chukkas **−0.5**: patina and nap read as wear).
- **[SHO-12] Tip only:** loafers, derbies or dress shoes under wide legs ("check the shoe isn't swallowed").
- Shoes never goes above 9.5 or below 2.

### Style (15%): does it hang together
- **[STY-1] Reads as a style, +0.5** (one of the seven below, or a matching suit). No style is never a charge.
- **[STY-2] Clearly that style top to toe, +1.0:** **any** style the outfit reads as (never his picks) has one of its signature pieces in the top or jacket, the bottoms *and* the shoes, and nothing against it. Since v6 it's judged on every look the outfit reads as, not only the one the card names, so the name never costs the credit: a black cardigan over wide black trousers with loafers is named minimal and still earns smart casual's top to toe. A matching suit over a shirt gets the same +1.0. *Only streetwear's, smart casual's and a suit's signature pieces can reach all three slots today; see KD-4.*
- **[STY-3] A tailored jacket with jeans from another world, −1.5:** a blazer, sport coat or suit jacket with relaxed or wide jeans, light or mid-wash jeans, or distressed jeans. Dark straight jeans are fine.
- **[STY-4] Formal and very casual pieces fight:** clothes 2.5 or more levels apart (shoes and sweats left out) **−1.5**; 3.5 or more **−4.0**. Not when a jacket is the dressy piece and what's under it is close in level (a jacket is the one place a high-low mix works). Only the larger of [STY-3] and [STY-4] counts.
- **[STY-5] A piece from another look, −3.0** (new in v5, the founder's Oct 11 call). It fires on a top that's a graphic tee, or any top at roominess 4 or more, when the rest of the outfit (without that top) has **two or more dressy pieces** (trousers or chinos; loafers, derbies or dress shoes; a collared prep top; tailoring), the rest **reads as minimal, smart casual or classic prep**, and the top breaks every one of those looks. It replaces "reads as" ([STY-1], [STY-2]) and takes the larger of itself and [STY-3]/[STY-4]. The founder's three outfits (oversized graphic tee + pleated trousers + loafers; oversized hoodie + slim chinos + loafers; oversized plain tee + slim chinos + loafers) land at **6.5 "Getting there"** with Style 4.
  - **Not charged:** a tee or hoodie under a blazer or overcoat, a graphic tee under a chore coat or leather jacket (a jacket that belongs to the quiet look bridges the two); a regular sweatshirt or hoodie with chinos and loafers (Ivy); a boxy top over straight or wide trousers (minimal's own shape, "city boy"); a roomy knit or oxford (the look's own piece); any streetwear outfit.
  - **Still charged:** a graphic tee under a bomber, denim jacket or puffer (a street jacket doesn't bridge); a graphic tee whose print reads as plain (the type is what counts).
  - **A tip, no points:** a graphic tee with only one dressy piece in a minimal outfit (graphic tee + chinos + white sneakers).
- **[STY-6] Too many statements:** each bright piece counts 1, each muted accent half, each big pattern, graphic, camo or floral 1. Allowed: 1.5 ("a little bold", everyone today), 1 for "subtle", 2.5 for "bold", plus 1 in streetwear. Up to one over: **−0.5**; more: **−1.0**.
- **[STY-7] One standout pattern, +0.75:** a single striped, checked, camo or floral piece at medium or large size, when nothing else competes and Color hasn't already credited it. A graphic print never counts as the standout.
- **[STY-8]** Not scored with fewer than two of top, bottoms and shoes in view. Style never goes below 1.

### Condition (taken off after the average)
- **[CON-1] Faults only:** a stain the AI is sure of **−1.2**; wrinkles **−0.4** (−0.2 on pull-on trousers and camp shirts, likely linen); pilling or wear **−0.4** (not on pieces distressed by design); **−1.6 at most**. Shoes aren't counted here (Shoes owns them).
- **[CON-2] Not checked in a dim photo.**
- **[CON-3] An untucked dress shirt, −0.6,** under a blazer, with dress trousers, or at a dressy occasion. With jeans on an everyday day it's fine.
- **[CON-4] A stained or worn piece earns no credit in any part** (a stained red sweater loses its standout too).

### Occasion (it can only hold a score down; it never changes a part)
The app's occasions and the dressiness each expects (the average over every visible piece, shoes included): Everyday and Class 2–3 · Date and Going out 2.5–3.5 · Event 3–4 · Interview 3.5–4.5 · Gym 1–2 · Home 1–2.5.
- **[OCC-1] Too casual:** a deduction that grows to **−0.5** as the outfit goes from a quarter to three quarters of a level under the occasion; past three quarters there's also a ceiling that falls from **7.0** (three quarters of a level under) to **6.0** (one level), **5.0** (1.5), **4.0** (2) and **3.5** (2.5 or more). A hoodie, dark jeans and white sneakers is right for Everyday and held to 6.0 at an interview. The five parts are the same at every occasion.
- **[OCC-2] Overdressed:** up to **−0.5** when the outfit is more than 1.5 levels over the occasion (a full suit with dress shoes at Everyday: −0.25).
- **[OCC-3] Slides at an interview or event: held to 4.0.**
- **[OCC-4] Sneakers under a blazer at an interview: held to 7.0.**
- **[OCC-5] A big logo the AI is sure of, at an interview: held to 6.5.**
- **[OCC-6] Event is softer than an interview** (new in v6; the founder's #197): career fairs and parties expect 3–4, the casual wedding's band, half a level under an interview. Only the "too casual" deduction and ceiling ([OCC-1]) move, by half a level: no deduction from an average of 2.75 up (was 3.25), the full −0.5 from 2.25 down (was 2.75), and the ceiling starts below 2.25 (7.0) and falls to 6.0 at 2.0, 5.0 at 1.5, 4.0 at 1.0 and 3.5 at 0.5 (was 6.0 at 2.5, 5.0 at 2.0, 4.0 at 1.5, 3.5 at 1.0). A hoodie, dark jeans and white sneakers at an event goes from held to 6.0 to **7.0** (a bit casual, −0.25); an oxford, chinos and loafers is right for it. Unchanged at Event: slides and loungewear are held to 4.0 ([OCC-3], [LNG-1]), an untucked dress shirt costs 0.6 ([CON-3]), and there's no 5.0 floor.

### Loungewear (sweatpants, joggers, gym shorts)
- **[LNG-1] At an interview or event: held to 4.0.**
- **[LNG-2] Anywhere else out of the house: held to 5.5, 6.5 or 7.5** by how many of two signs of intent he shows (none, one, both): a dressed upper half (a collared shirt, a knit, a jersey or rugby, a flannel or overshirt, or a jacket other than a puffer, shell or fleece) and a real shoe (not slides or running shoes). Shoes out of the photo count as a real shoe.
- **[LNG-3] Not held:** a vintage sport hero piece (a jersey, or a rugby shirt with sweats) with both signs; gym shorts with a real shoe.
- **[LNG-4] A full kit** (a jersey with gym shorts) counts no signs: held to 5.5.
- **[LNG-5] At the gym or at home: no hold,** and slides and running shoes aren't charged.
- **[LNG-6] At Everyday and Class, sweats count as casual (level 2)** in the occasion check, so the loungewear hold is their one charge, not a "too casual" ceiling as well. (They also block the shape credits, [PRO-8].)

---

## The seven styles

How a style is recognized, for all seven: each piece in the outfit can be one of the style's **signature pieces** (2 points), a **home piece** (1 point) or a piece **against** it (−1). Each of top-and-jacket, bottoms and shoes counts its best piece. A style is recognized when nothing rules it out, it has at least one signature piece, points come from at least two of the three, and the total reaches 3 (2 when only two are in view), plus any extra condition listed. When several styles fit, the card names one: the look-alike rules below first, then his picks, then the fixed order vintage sport, outdoor, workwear, streetwear, classic prep, minimal, smart casual.

### Streetwear (14 rules)
**How the app recognizes it**
- **[STR-1] Signature pieces:** a hoodie, sweatshirt or graphic tee; a bomber or puffer (or a dark shell over cargos in an all-dark outfit); relaxed or wide jeans or cargos; chunky or basketball sneakers. Grey hoodie + wide jeans + chunky sneakers reads as streetwear.
- **[STR-2] Home pieces:** a tee, tank, jersey or flannel over loose jeans or cargos; any tee at roominess 4+; a fleece; a denim jacket, leather jacket, shell or rain jacket, or any roomy jacket (not a chore coat, field jacket, overshirt or overcoat); cargos in any leg; loose shorts; sweats, joggers or gym shorts only with a street shoe; canvas, retro, low-profile, white leather or running sneakers and work boots. Chinos count against it. A plain tee over wide jeans with white leather sneakers reads as streetwear.
- **[STR-3] Never streetwear with:** a blazer, sport coat, suit piece or overcoat; dress trousers or a dress shirt; loafers, derbies or dress shoes; skinny legs; a polo, oxford, knit polo, cardigan or rugby shirt with no jacket.
- **[STR-4] It also needs volume on purpose** (loose legs, a roomy top or jacket, or the all-dark technical look), **a street piece up top, and a total of 4.** A regular hoodie over straight jeans isn't streetwear; nor is a sweater over wide jeans. When outdoor also fits, chunky or basketball sneakers make it streetwear (a trail shoe or any other shoe makes it outdoor).

**What it rewards**
- **[STR-5] The streetwear shape, +1.0 Proportions (about +0.3):** a roomy top (4+), untucked, ending at the belt to mid-fly, over relaxed or wide jeans or cargos, no jacket, in chunky, basketball, canvas, retro or low-profile sneakers. White leather sneakers don't count here (the founder's "clean but plain" call). An oversized graphic tee + wide jeans + chunky sneakers scores **8.0 "Sharp"**; with white leather sneakers, 7.0. A tuck takes the waist break instead (+1.5), a bomber the short-jacket credit; never two.
- **[STR-6] Chunky sneakers carry wide jeans, +0.5 Shoes:** chunky or basketball sneakers under relaxed or wide jeans or cargos, in a streetwear outfit, when the hem isn't piling.
- **[STR-7] Reads as streetwear +0.5, and top to toe +1.0 Style** with a signature top, signature bottoms and signature shoes ([STY-1], [STY-2]). Canvas sneakers are only a home shoe, so they get the first but not the second. The look's own shoe ([SHO-7]) adds +0.5 on Shoes.

**What it allows that other styles don't**
- **[STR-8] Two bright colors cost half** (−1.0, not −2.0).
- **[STR-9] Three patterns at once aren't charged.**
- **[STR-10] One more statement piece is allowed** before "too many things compete" ([STY-6]).
- **[STR-11] Oversized tops over straight or wider legs cost nothing** (its range runs to the roomiest). Over **slim** legs they do: streetwear's room needs a fuller leg ([PRO-11], −1.5; with chunky sneakers, [SHO-9] adds its own −1.5 on Shoes).

**What it marks down**
- **[STR-12] Piling jeans:** a hem read as pooling costs **−1.5 Fit** and switches off the shape and the carry credits. The reading has no "stacked" hem yet, so a deliberate stack can be charged as pooling (KD-2). Cuffed, cropped or lightly breaking hems cost nothing.
- **[STR-13] Its own pieces in another look:** the same oversized graphic tee that earns the streetwear shape loses 3 on Style with pleated trousers and loafers ([STY-5]): 8.0 → 6.5.
- Never excused, as for everyone: chunky sneakers under slim legs ([SHO-9]), a roomy top over skinny legs ([PRO-2]), stains and wear, every occasion rule.

**What it can't see yet**
- **[STR-14]** A hoodie the AI calls regular (most do) doesn't earn the shape, even over wide jeans and chunky sneakers (KD-1). A graphic print is never the "one standout". A puffer earns no short-jacket credit (its length can't be read). Also unseen: which sneaker exactly, chains and other finishing touches, and fading or wash.

### Workwear (10 rules)
**How the app recognizes it**
- **[WRK-1] Signature pieces:** a chore coat; work boots; a field or denim jacket in an earth tone, navy or a denim wash; a flannel with jeans or cargos. **Home pieces:** jeans (not skinny), cargos, an overshirt, suede chukkas, a leather jacket, a flannel without denim, a field or denim jacket in black or charcoal. A tan chore coat over a white tee with dark jeans and work boots reads as workwear; an overshirt with jeans and white sneakers doesn't (home pieces only).
- **[WRK-2] Against it (−1 each):** a graphic tee, chunky, basketball or running sneakers, a puffer, shell, rain jacket or fleece, a blazer or sport coat, any big logo, any piece at roominess 5. A chore coat over a graphic tee with chunky sneakers isn't workwear.
- **[WRK-3] Never workwear with:** sweats, joggers or gym shorts, a jersey, a tank top, suit pieces, dress shoes, slides, or two bright pieces.

**What it rewards**
- **[WRK-4] The workwear shape, +1.0 Proportions:** a chore coat over straight, relaxed or wide jeans or cargos, finished by boots of any kind (work boots, suede chukkas, Chelsea boots), in a workwear outfit. The chore coat outfit above scores **8.0 "Sharp"**; with low-profile sneakers 7.0; over chinos it doesn't count.
- **[WRK-5] A denim jacket (the trucker) is a short jacket,** +1.5 Proportions ([PRO-6]).
- **[WRK-6] Work boots are the look's own shoe,** +0.5 Shoes ([SHO-7]).

**What it allows**
- **[WRK-7] Worn work boots and suede chukkas cost half** (−0.5, not −1.0). But a worn boot still earns nothing, so the workwear shape and the look's-shoe credit go.
- **[WRK-10] Relaxed fits:** a roomy top over straight or wider legs is within workwear's range (a roomy flannel with dark jeans and boots costs nothing). Its legs start at straight, so over slim jeans the room is charged ([PRO-11]).

**What it marks down**
- **[WRK-8] A chore coat over skinny jeans: −0.5** ([PRO-3]). Otherwise the shared rules.

**What it can't see yet**
- **[WRK-9] No top-to-toe credit:** work pants aren't in the reading, and jeans are only a home piece, so workwear can never be "clearly workwear top to toe" (KD-4). Also unseen: fading, patina, raw denim, the exact boot.

### Vintage sport (8 rules)
**How the app recognizes it**
- **[VSP-1] It needs a hero piece:** a football or basketball jersey, or a rugby shirt with jeans, cargos or sweats. **Home pieces:** low-profile and retro sneakers; jeans, cargos, chinos, shorts, trousers, pull-on trousers, sweats and joggers (not skinny). A green jersey + dark straight jeans + retro runners reads as vintage sport; the same jeans and runners with a plain tee don't.
- **[VSP-2] Against it:** chunky or basketball sneakers, slides, running shoes with sweats. A jersey with straight jeans and chunky sneakers isn't vintage sport.
- **[VSP-3] Never vintage sport:** a full kit (a jersey with gym shorts), or only tank tops with no jacket.
- **[VSP-4] The bottoms decide a rugby shirt:** with chinos, trousers or shorts it's classic prep, not vintage sport.

**What it rewards**
- **[VSP-5] Reads as vintage sport +0.5 Style, and retro or low-profile sneakers are the look's own shoe, +0.5 Shoes.** It can never be "top to toe" (its shoes and bottoms are only home pieces; KD-4).

**What it allows that other styles don't**
- **[VSP-6] Sweats with a hero piece:** a jersey with joggers and retro runners isn't held down as loungewear ([LNG-3]); the same joggers with a plain tee are held to 6.5.

**What it marks down**
- **[VSP-8] A roomy top over slim legs, −1.5** ([PRO-11]): vintage sport's range starts at straight. A roomy jersey over dark straight jeans costs nothing.

**What it can't see yet**
- **[VSP-7] Track jackets and track pants aren't in the reading.** The engine already counts a track jacket as a short jacket over full legs (+1.5 Proportions), so vintage sport's best shape will work once the reading can name it. Also unseen: crests and team graphics.

### Outdoor (7 rules)
**How the app recognizes it**
- **[OUT-1] Signature pieces:** a shell, rain jacket or fleece (later: a vest, trail shoes). **Home piece:** cargos. **Against it:** work boots, a chore coat, a denim jacket. An orange shell over a tee with olive cargos and low-profile sneakers reads as outdoor; a fleece with dark jeans and work boots doesn't.
- **[OUT-2] Never outdoor with:** tailoring, a dress shirt, dress trousers, dress shoes, derbies or loafers, sweats or gym shorts, a jersey.

**What it rewards and allows**
- **[OUT-3] Running shoes aren't charged as gym shoes** in an outdoor outfit ([SHO-3] skips it).
- **[OUT-4] The outdoor shape, +0.5 Proportions:** a fleece, shell or rain jacket over full legs with trail shoes, in an outdoor outfit. Trail shoes aren't in the reading yet, so this can't fire on a real check (KD-7).
- **[OUT-5] Reads as outdoor +0.5 Style; never top to toe** (cargos are only a home piece; KD-4).
- **[OUT-6] Look-alikes:** when workwear also fits, a technical jacket or trail shoes make it outdoor (a flannel under a shell with cargos and chukkas reads as outdoor).
- **[OUT-7] A roomy top over slim legs is allowed:** outdoor's range runs slim to wide, the only look that holds that shape ([PRO-11]). A roomy fleece over slim cargos costs nothing; over slim jeans the outfit doesn't read as outdoor, so it's charged.

**What it can't see yet:** trail shoes, vests, technical pants. Outdoor has **no path to 8** on a real check today (KD-7).

### Minimal (8 rules)
**How the app recognizes it**
- **[MIN-1] The palette comes first:** every piece in white, cream, light grey, grey, charcoal, black, navy, khaki, tan, brown, olive, light blue, dark denim, burgundy or sage; at most three color families; nothing bright; at most one burgundy or sage piece. Mid- and light-wash denim never passes.
- **[MIN-2] Signature pieces:** relaxed or wide legs with a clean hem (no break, slight break, cropped, cuffed); a straight leg on trousers, chinos or pull-on trousers; a roomy top that ends at the belt or is cropped. **Home pieces:** a sweater, cardigan, knit polo, oxford, overshirt, overcoat, unstructured blazer, leather jacket; trousers, chinos, pull-on trousers; white leather or low-profile sneakers, loafers, Chelsea boots, derbies. A tonal outfit (two color families or fewer) counts as one more point. **Against it:** chunky, basketball or running sneakers, slides, multicolor shoes, a small logo, an odd pattern. Black sweater + charcoal wide trousers + black loafers reads as minimal; with chunky sneakers it doesn't.
- **[MIN-3] Never minimal with:** a graphic, camo, floral or plaid piece; a big logo; a bright piece; sweats; a blazer, sport coat or suit jacket; a distressed piece that isn't denim; or a regular collared or zip-neck top over slim or straight legs (that's smart casual's).

**What it rewards**
- **[MIN-4] Its path to 8 is the waist break:** the black sweater tucked into wide trousers with loafers scores **8.0 "Sharp"** ([PRO-4]).
- **[MIN-5] Reads as minimal +0.5 Style; loafers, Chelsea boots and white leather sneakers are the look's own shoe, +0.5 Shoes.** Never top to toe on minimal's own pieces (no minimal shoe is a signature piece; KD-4), though a minimal outfit made of smart casual's signature pieces earns smart casual's ([STY-2]).

**What it allows that other styles don't**
- **[MIN-6] An oversized top over straight or wide trousers** (the "city boy" shape): not a piece from another look, never "roomier than the look" ([PRO-11]), and a boxy tee at the belt also earns the waist break (8.0).

**What it marks down**
- **[MIN-7] A graphic tee with two dressy pieces** (wide trousers and loafers): **−3.0 Style** ([STY-5]). With only one (chinos and white sneakers) it's a tip, no points.

**What it can't see yet**
- **[MIN-8] Shade and texture.** An all-black minimal outfit earns nothing for being tonal (a tip only): the light/mid/dark reading that would reward tonal depth isn't in the live reading (KD-6). Fabric, drape and sheen aren't read at all.

### Classic prep (5 rules)
**How the app recognizes it**
- **[PRP-1] Signature pieces (top or jacket):** an oxford, polo, knit polo, cardigan, blazer, sport coat or unstructured blazer; a rugby shirt with chinos, trousers or shorts. **Home pieces:** a sweater, quarter-zip, overcoat, field jacket; chinos, trousers, shorts; loafers, suede chukkas, white leather sneakers, derbies. **The card says "classic prep" only with a prep marker** (a rugby shirt or cardigan; a collared top with shorts; a collared top in a color or a medium or large stripe or check; a blazer with chinos or jeans). Without one, the same outfit is named smart casual. Navy cardigan over a white oxford + khaki chinos + loafers reads as classic prep.
- **[PRP-2] Never prep with:** sweats, joggers, gym shorts or cargos; chunky, basketball or running sneakers, slides or work boots; a hoodie, sweatshirt, graphic tee, tank, jersey or fleece with no blazer over it; any roomy top; relaxed, wide or distressed jeans. (A hoodie under a blazer is prep again.)

**What it rewards**
- **[PRP-3] The tailored line, +1.0 Proportions:** a blazer over a tucked shirt with trousers or chinos ([PRO-7]). Prep also earns the shared waist break, standout pattern and color credits.
- **[PRP-4] Reads as prep +0.5 Style, and top to toe +1.0 when its pieces are smart casual's signature pieces** (fixed in v6). Prep's own bottoms and shoes are only home pieces, but "top to toe" is judged on every look the outfit reads as ([STY-2]), so a prep marker never costs it: the cardigan over an oxford with chinos and loafers gets Style 8.5 and 7.5, exactly as the plain oxford outfit (named smart casual) does; a pink oxford with chinos and loafers also earns the standout color and scores 8.0 "Sharp".

**What it marks down**
- **[PRP-5] A roomy or street top with two dressy pieces** (an oversized hoodie with slim chinos and loafers): **−3.0 Style** ([STY-5]). A blazer with light-wash jeans: **−1.5** ([STY-3]).

**What it can't see yet:** where a jacket's shoulder seam sits, a shirt hanging below the blazer, the hem under trousers (a tip only).

### Smart casual (6 rules)
**How the app recognizes it** (the general look; it loses every tie)
- **[SMC-1] Signature pieces:** a quarter-zip, knit polo, polo, oxford, cardigan, overshirt, blazer, sport coat or unstructured blazer; chinos, trousers or suit trousers; loafers, derbies, Chelsea boots, suede chukkas, white leather sneakers. **Home pieces:** a sweater, dress shirt, camp shirt, chore coat, field jacket, overcoat, leather jacket; pull-on trousers, dark, black or charcoal jeans; low-profile sneakers, dress shoes. It needs a piece up top or chinos/trousers, and a total of 4 (3 with the shoes out of view). An overshirt over a tee with dark jeans and white leather sneakers reads as smart casual.
- **[SMC-2] Never smart casual with:** a hoodie, sweatshirt, graphic tee, jersey, rugby, flannel, fleece, puffer, shell or rain jacket; sweats, joggers, gym shorts or cargos; slides; a big logo, camo or any piece at roominess 5; a tank with no jacket; a matching suit (judged as a suit).
- **[SMC-3] It loses every tie:** a sweater over wide trousers with loafers fits both minimal and smart casual and is named minimal (unless he picked smart casual; [SCO-4]).

**What it rewards**
- **[SMC-4] Top to toe, +1.0 Style:** a navy polo with chinos and white leather sneakers is smart casual top to toe (Style 8.5, score 7.5); tucked in, it also earns the waist break and scores **8.0 "Sharp"**.

**What it marks down**
- **[SMC-6] A roomy top over slim legs, −1.5** ([PRO-11]): smart casual's range stops at regular. An oversized oxford over slim chinos with loafers goes 7.5 → 7.0; over straight chinos (full-leg pressed trousers) it costs nothing.
- **[SMC-5] A graphic tee with chinos and derbies: −3.0 Style** ([STY-5]). White sneakers under a blazer at an interview: held to 7.0 ([OCC-4]).

**What it can't see yet:** the shoulder seam, a shirt hanging below the jacket, the hem under a blazer.

---

## No clear style (the general standard; 3 rules)
- **[GEN-1] When no style fits, the outfit is judged by the shared rules alone:** no "reads as" credit, no style allowance, and no charge for having no style. A grey sweater, wide light-wash jeans and white leather sneakers reads as nothing and scores 7.0.
- **[GEN-2] Wide legs are never charged by themselves; a roomy top is charged when no look holds it** ([PRO-11]). The general range is a regular top over any leg: a grey sweater over wide light-wash jeans costs nothing, an oversized tee over slim jeans costs 1.5 on Proportions (6.5), and the same tee over wide jeans reads as streetwear and costs nothing.
- **[GEN-3] The shape credits are for everyone:** a leather jacket over a sweater with light-wash straight jeans earns the short-jacket +1.5 with no style at all.

---

## Rule count
Shared rules 67 (How a score is made 6, Proportions 12, Fit 6, Color 7, Shoes 12, Style 8, Condition 4, Occasion 6, Loungewear 6) · Streetwear 14 · Workwear 10 · Vintage sport 8 · Outdoor 7 · Minimal 8 · Classic prep 5 · Smart casual 6 · No clear style 3. **128 rules, 290 test outfits.**

---

## Known differences (research vs. engine)
Each is either a researched rule the engine doesn't apply, or something the engine does that the research doesn't say; each needs the gold set, a new reading, or a founder call. KD-3 (the bands), KD-5 (a prep marker costing top to toe) and KD-16 (Event on the interview band) were fixed in v6 (#217, `rubric/research/parts/v6.md`); what's left of the bands is KD-17.

1. **KD-1: Boxy hoodies.** The research names a boxy hoodie or tee over baggy jeans with chunky sneakers as streetwear's defining shape. The engine only gives the shape to tops the AI reads at roominess 4+, and it reads almost every hoodie as 3 (48 of 731 top reads are 4+). Reason: no steady "boxy" reading yet; counting regular hoodies would lift plain hoodie fits to 8 (`parts/streetwear-pass.md`). [STR-14]
2. **KD-2: A deliberate stack reads as pooling.** The research treats stacked baggy jeans as right for streetwear; the live reading has no "stacked" hem, so a stack read as pooling costs −1.5 Fit and the shape credit. Reason: `stacked` is in an untested reading batch. [STR-12]
3. **KD-4: "Top to toe" is reachable only through streetwear's, smart casual's and a suit's pieces.** The credit needs a signature piece in the bottoms and the shoes, and in the council's tables workwear (work pants), vintage sport, outdoor, minimal and classic prep have no signature bottoms or shoes the live reading can name. Since v6 a prep- or minimal-named outfit made of smart casual's signature pieces earns it ([STY-2]), but a workwear, vintage sport or outdoor outfit still can't. Not a research rule either way, but it gives some looks a +1.0 Style path the others don't have (worth +0.15 on the score). [WRK-9, VSP-5, OUT-5, MIN-5]
4. **KD-6: Tonal outfits earn nothing.** The color research rewards tonal outfits with a range of shade (+1.0) and light-mid-dark (+0.5). The engine has both credits, but they need the light/mid/dark reading, which isn't in the live reading (it passed alone in batch 1, but adding fields to the scoring call shook other readings, #198). Minimal's best tonal outfits stay at 7. [MIN-8, COL-7]
5. **KD-7: Outdoor has no path to 8 on a real check.** Its shape needs trail shoes, which the reading can't name, and even then it's +0.5 (weak evidence). Same for vintage sport's track jacket. [OUT-4, VSP-7]
6. **KD-8: Researched faults that are tips only:** a top running past the fly, a long loose layer over loose legs, a shirt hanging below a blazer, a heavy hem under tailoring, an untucked shirt over wide legs, a full break on slim pants, a dainty shoe under wide legs, double denim, flat tonal color. Reason: their readings failed the 3-run steadiness test (top length 74%, hem 64–68%). So every style over-scores these mistakes by about a point. [PRO-10, FIT-6, SHO-12, COL-7]
7. **KD-9: An oversized graphic tee under a blazer isn't charged.** FashionBeans 2025 says no oversized fits or cartoon graphics under a blazer; the engine treats a blazer as bridging any top. Founder call (open). [STY-5]
8. **KD-10: A graphic tee with only one dressy piece is a tip.** The founder's words ("in minimal or classy they wouldn't stand") could cover it; it's a very common outfit, so it waits for the gold set. Founder call (open). [STY-5, MIN-7]
9. **KD-11: [STY-5] partly reverses the style council** (RULEBOOK Part 3, "mixing styles is never a mistake"; ruling 2, "detection never adds a penalty"), on the founder's Oct 11 word. Every other mix still costs nothing.
10. **KD-12: Shoe wear is a flat −1.0, not the research's cap at 6.0.** The worn read flips between runs on about half the photos where it fires, and reads suede nap as wear, so a cap turned one shaky read into a 1.5–2 point drop (`parts/prototype-results.md`). [SHO-11]
11. **KD-13: Fit can't go above 7.** The fit research rewards a good fit (shoulder seam on the shoulder, clean sleeve length); the shoulder-seam reading failed (78%), so Fit only finds faults. [FIT-1]
12. **KD-14: Accessories aren't scored.** The cohesion research names chains, crossbody bags and visible socks as streetwear's finishing touches; there's no reading for them, and anything on the head is never scored (the upload hides the head). [SCO-6]
13. **KD-15: The second look isn't sent by the app.** The engine can charge a shirt showing below a jacket and can tell when loose jeans rest on slides; the app doesn't run that second look yet, so the first never fires and the second falls back to the hem reading. [PRO-9, SHO-2]
14. **KD-17: What's left of the style bands after v6.** [PRO-11] brings back the council's bands only where the readings are steady (roomy against regular, slim-or-skinny against straight-or-fuller). Still not applied: roominess 4 against 5 (minimal, workwear, vintage sport and outdoor stop at 4 in the council's tables; the reading can't tell 4 from 5 steadily); a too-close top (roominess 1; 1 against 2 isn't steady either, and Fit's "pulls" covers a too-small top); legs too wide for smart casual, prep and no clear style (wide against relaxed isn't steady: [PRO-12] is a tip); the council's streetwear discount on hoodie cuffs over the hands (−0.2; the parts engine charges −0.5 in every style, [FIT-2]); a roomy jacket or coat against the leg (only skinny legs, [PRO-2]; slim against straight under a chore coat is the founder's friend's case and has no source calling it a mistake); a half tuck doesn't excuse a roomy top (the half-tuck reading was never steadiness-tested). [PRO-11, PRO-12, FIT-2]
