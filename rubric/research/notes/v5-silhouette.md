# Silhouette: which shapes earn points, which block them

*Oct 9, 2026. Claude, web research for rubric v5 (`v5-brief.md`). Builds on `proportions-color-style.md`, `notes/proportions.md`, `notes/v5-fit.md`, `notes/v5-editorial.md`, `notes/style_archetypes.md` and RULEBOOK Parts 1 and 4. It doesn't repeat their sources unless a new page changes the verdict. Format follows `v5-fit.md`.*

## Checked by the main session (Oct 9)
The agent cited sources without links. Spot-checked the three claims the top rules rest on; all three match the pages:
- Mr Porter, "big pants, little shirt" (Ashley Ogawa Clarke): [wide-leg pants guide](https://www.mrporter.com/journal/fashion/wide-leg-pants-men-guide-25329258), confirmed via search summary.
- GQ, Rob Nowill, Apr 24 2025: [How to Style Wide-Leg Pants](https://www.gq.com/story/how-to-style-wide-leg-pants), opened in the browser pane: the "Keep It Tidy Up Top" section, the cropped jacket "right on the hip or just above", longer coats or oversized shapes "stumpifying", and "Pick Your Break" are all there.
- GQ, Tyler Watamanuk, Sep 2 2026: [The Pants You Should Be Wearing This Fall](https://www.gq.com/story/how-your-pants-should-fit-fall-2026), opened: "everyday center of gravity", "something sturdy to sit on", skinny legs "disproportionately small". Its subtitle also says the gigantic-trousers era is winding down (relevant to the wide-jeans decision: don't reward width for its own sake).
The rest is unchecked; treat single-source rows as weak until checked.

## How to read this

- **Labels.** [Editorial] = a magazine with no product of its own in the piece. [Affiliate] = editorial with shop links (GQ, FashionBeans and Highsnobiety all carry them). [Retailer] = a shop's own guide (Mr Porter, H&M, Charles Tyrwhitt and Proper Cloth sell what they recommend). [Blog] = small or low-authority site. **Snippet only** = I couldn't open the page and the claim comes from a search summary.
- **What I opened this session.** I opened 21 pages. The browser pane opened Mr Porter, GQ (US and UK), H&M and Permanent Style, which earlier notes couldn't reach. **Not opened:** Esquire (the browser pane refuses the domain), Business of Fashion (paywall), Die Workwear's X posts (snippet only), The Chic Tribe and a Club of Five TikTok (snippet only). LibKey wasn't used: no scholarly articles were needed here.
- **Dates.** Every source is 2023 or later except Put This On (Derek Guy, Aug 2018). I use it only for the principles of how silhouettes work, never for what's in style.
- **The body rule.** Every rule below compares **garments with each other**: top length against the leg, layer length against the tee, shoe bulk against the leg opening. Several sources frame advice by height or build (RMRS most of all, GQ 2023, Put This On 2018). I logged only the garment part and mark it "body-framed source".
- **Kitted fields** are from `extraction-test/schema.json`. Garment values: `length` (cropped / at_belt / mid_fly / below_crotch), `tucked`, `volume` 1–5, `leg_shape`, `hem`, `shows_below_outer`, `subcategory`. **NEW** marks a reading that doesn't exist yet.
- **Evidence vs judgment.** Facts come with a source. Lines starting with **Judgment:** are mine. No point values are proposed; sizes need the gold set.
- **v4 numbers in this file** come from `rubric.py` v4.0 run on **made-up readings**, not photos. No person is involved, so rule 7's profile doesn't apply. They were scored with no style picks, and under v4 picks never change a score. Script: scratchpad `sil.py` / `sil2.py` (not committed).

## Bottom line

1. **The sources agree on one principle: the shape needs a contrast or a clean middle, never "loose and long everywhere".** The textbook 2025–26 shapes are:
   - **(a) The relaxed-straight middle.** A regular top over straight or relaxed-straight legs. GQ calls it this fall's center of gravity.
   - **(b) "Big pants, little shirt".** A fitted, cropped or tucked top over wide legs (Mr Porter, GQ, H&M).
   - **(c) A short layer over a full leg.** A jacket ending at the hip or waist over baggy or wide legs (GQ, H&M, Mr Porter).

   The shape every source calls off is **a long, loose top or coat over wide legs** ("stumpifying", GQ; "swamps you", H&M).
2. **A chore coat or overshirt wants a straight or fuller leg in 2025–26, but slim isn't called a mistake.** 6 sources pair these layers with straight or relaxed legs. GQ (Sep 2026) says a relaxed-straight leg gives layers "something sturdy to sit on". RMRS calls a relaxed overshirt over skinny jeans "top-heavy". 3 sources allow slim: H&M, Charles Tyrwhitt (both retailers) and Put This On 2018. **No 2023+ source says slim jeans under a chore coat are wrong.** The fault the sources name is *skinny*. So the founder's 8.5 → ~7 call is **"this shape didn't earn the points"**, not "this shape is a mistake".
3. **Length is the most readable silhouette signal, and v4 barely uses it.** Where the top or layer ends (at the waist, at the hip, past the crotch) is a 15–20 cm difference in the photo. Slim vs straight is a 1–2 cm difference at the hem, and Kitted's `leg_shape` matched truth only 40–53% of the time. Rules built on length are safe to test. Rules built on slim vs straight are not, until a better reading exists.
4. **Shoe weight should match the leg, with one real split.** Everyone agrees on the two ends:
   - Dainty shoes under wide legs fail (GQ 2025, RMRS 2026).
   - Chunky shoes under narrow legs fail (Highsnobiety, RMRS, Put This On).

   They split on chunky shoes under wide legs:
   - **For:** GQ 2025, RMRS, Highsnobiety.
   - **Against:** Mr Porter (Sep 2025: "you need a slender shoe" like a loafer or GAT) and H&M ("Chunky runners fight the proportions").

   So v4's "chunky sneakers complement wide jeans" credit is right for streetwear only.
5. **A fitted top or jacket over wide pants is endorsed, not off.** GQ, Mr Porter, H&M and Proper Cloth all recommend a closer top over wide legs. Only RMRS dissents ("your shirt or sweater needs some volume too"). v4's −0.45 for wide legs outside a detected style hits exactly this shape.
6. **The classic middle shape is the default 7, not a fault.** Derek Guy (Put This On, 2018) calls it the one silhouette that suits everyone, "a bit generic" at times. That fits "every point earned": the middle shape costs nothing and earns nothing for shape. A deliberate shape (waist break, short layer over a full leg) is what could earn a credit.

---

## 1. Silhouette families for men's casual wear, 2023–2026

### What the sources describe as working

| Family | Conditions (Kitted terms) | Sources (opened) | Notes |
|---|---|---|---|
| **Relaxed-straight middle** ("classic") | Top `volume` 2–3, `length` at_belt–mid_fly or tucked; `leg_shape` straight/relaxed; `hem` no to slight break; most shoes | GQ, Watamanuk, Sep 2 2026 ("not too baggy, not too slim"; relaxed straight is "the everyday center of gravity"); GQ, Mar 19 2026 (straight-leg "Goldilocks territory"; a Mytheresa buyer hasn't seen slim return); Put This On, Derek Guy, Aug 2018 (the "classic silhouette… suit[s] everyone"); FashionBeans baggy-jeans guide, Sep 2026 (Levi's 569 loose-straight "not so snug… not so roomy") | Agreed by 4. The default every source falls back to |
| **Big pants, little shirt** | Leg wide/barrel (or relaxed trousers); top `volume` 1–2, or `length` cropped/at_belt, or `tucked` full; shoes regular or slender (loafer, derby, low-profile) | Mr Porter, Ashley Ogawa Clarke, Sep 8 2025 [Retailer] ("big pants, little shirt"; fitted tee or tank, or a slightly cropped shirt, sweater or jacket; boxy, not "long and drapey"); GQ, Rob Nowill, Apr 24 2025 [Affiliate] ("Keep It Tidy Up Top": fitted, tailored or slightly cropped; tuck a tee into pleats); H&M Fall 2026 editorial [Retailer] ("If the pants are wide, the top half must be close"); Proper Cloth 2025 trends [Retailer, weak] (wide trousers with a fitted top such as a knit polo) | 4 for, 1 against: RMRS (updated Jun 22 2026) says a wide leg needs a roomier top and calls a skin-tight top "costume". RMRS is a body-framed source |
| **Short layer over a full leg** | Outerwear at the hip or waist (bomber, trucker, Eisenhower, cropped leather) over relaxed/wide/baggy legs; tee under it | GQ Apr 2025 (a cropped jacket "should hit you right on the hip or just above"; a boxy bomber, Eisenhower or four-pocket jacket "looks killer" with roomier jeans); H&M Fall 2026 ("the fix is length rather than width… keep the top layer short"); Mr Porter Sep 2025 (jackets that hit just above the waist); Put This On 2018 (a shorter jacket "can also elongate your leg line") | 4 for, 0 against. The best-agreed "all loose" exception |
| **Boxy/cropped top + straight or loose leg** | Top `volume` 3–4 with `length` cropped/at_belt; leg straight/relaxed/wide | GQ, Max Berlinger, Jun 28 2023 (a cropped tee with "straight or loose" pants; the rule of thirds; Lyst searches for men's cropped shirts up 40% in six months; body-framed); Mr Porter Sep 2025; H&M (a cropped jacket over baggy jeans) | 3 for, 0 against. Same idea as the waist break |
| **Fuller top over slim trousers** ("mixed", "circle on a stick") | Short, rounded outer (bomber) or a full coat over a slim, tapered leg | Put This On 2018 ("It's easier to go top-heavy than bottom-heavy"; a "big, rounded bomber with slim jeans") | 1 source, 2018. 2026 sources run the other way (GQ Sep 2026: skinny legs under layers look "disproportionately small"). **Judgment:** legitimate when the top is *short and rounded*; weak support for a long boxy coat over slim legs |
| **Coherently full** (loose top + loose leg) | Both loose; works when the top is short, or in a matching set | H&M (a matching loose set reads "as a single silhouette"; otherwise "Doing both loose at once is the one way this goes wrong"); FashionBeans Sep 2026 (loose-straight jeans with an oversized tee or loose sweater); Put This On 2018 (a fuller parka with fuller chinos and heavy boots) | Split. GQ Apr 2025: super baggy up top too? "(Probably not)". **Judgment:** fine in streetwear when the top ends at the belt or hip (already v4's P3 exemption); off when the top is long |

### What the sources call off

| Shape | Conditions | Sources | Agreement |
|---|---|---|---|
| **Long, loose top or coat over wide legs** | Outer or top ending past the crotch (`length` below_crotch, or a mid-thigh coat) + leg relaxed/wide | GQ Apr 2025 ("avoid longer-length coats, or oversized shapes… stumpifying"); Mr Porter Sep 2025 (boxy, "rather than long and drapey"); H&M ("The same jeans under a long coat swamps you"); FashionBeans 2025 via `v5-fit.md` ("pick a lane") | 3 opened + 1 earlier, 0 against in 2023+ editorial. **Dissent from practice:** the city-boy / Auralee long-coat-over-wide-trouser look (`style_archetypes.md`, Yokogao; snippet-level) and RULEBOOK's 9.0 tonal anchor "overcoat + knit + wide trousers + loafers" |
| **Volume up top over skinny legs** | Layer or top at `volume` ≥3 over `leg_shape` skinny | GQ Sep 2026 ("If your pants skew too skinny… legs look disproportionately small"); RMRS overshirt, updated Oct 9 2026 (a relaxed overshirt over skinny jeans looks "top-heavy"); `proportions.md` (3/0) | Strong. Already in v4 (P1, P2) |
| **Chunky shoe under a narrow leg** | `BULKY_SHOES` + skinny/slim | Highsnobiety, Tom Barker, ~2023 [Affiliate] (chunky sneakers need wide legs to avoid "clown feet"); RMRS slim-vs-wide ladder (slim → sleek shoes); Put This On 2018 (visual weight) | Strong. Already v4 S1 |
| **Dainty shoe under a wide leg** | Wide/barrel leg + thin-soled minimal sneaker, skinny-soled loafer, narrow runner, pointy dress shoe | GQ Apr 2025 ("a skinny-soled loafer or narrow running shoe… make your feet look tiny"); RMRS shoes guide, Jun 18 2026 ("If your sneaker disappears under the hem…"); Opumo (snippet in `proportions.md`) | Strong. **Not dissented by Mr Porter or H&M**: their "slender" shoes (loafer, GAT, derby) are what RMRS also approves. Not in v4 |
| **Everything the same mid-volume with no shape** | All `volume` 3, straight leg, mid_fly untucked | Put This On 2018 ("a bit generic or boring") | **Not a fault in any source.** It's the default. Don't penalize |
| **Fitted jacket over baggy pants** (the founder's hypothesis) | Outer `volume` 2 over wide leg | GQ Apr 2025, Mr Porter, H&M all *recommend* close or cropped tops over wide legs | **Contradicted.** Don't build it |

---

## 2. Proportion as a reward, and the flaws that should block credits

### What makes proportions good (could earn a credit)
- **A waist break around a third / two-thirds.** Reached by a tuck, a cropped tee or knit, or a jacket ending at the hip or just above.
  - Sources: Mr Porter 2025 ("elongates the legs, looks intentional"), GQ 2025 (cropped jacket "defining your waist"; tuck the tee into pleats), GQ 2023 (rule of thirds via cropped tees; body-framed), Put This On 2018 (tuck and a higher rise create a waistline on "an otherwise… shapeless" outfit), H&M (a short top layer). Westwood Hart and A Well Styled Life in `proportions.md` add 2 more (snippets).
  - **6 opened + 2 earlier, 0 against.** It's the best-supported reward in this file and in the Oct 7 report (#9 there). The half tuck stays out: sources disagree on it (Oct 7 report).
- **Shoe weight matched to the leg opening.** Covered by v4's K4 street trigger and the proposed `shoe_profile`. See §1 for the split on chunky shoes under wide legs.
- **A clean, chosen hem.** GQ Apr 2025: "Pick Your Break, and Stick To It", cropped to the ankle or gently pooling. GQ Sep 2026: "gentle pooling, not bunching". Put This On 2018: baggy pants are easier with no break or a slight crop. **Dissent with v4:** GQ endorses gentle pooling on oversized pants, while v4 charges −0.4 for any pooling on loose jeans. That's the stacked/pooled problem the Oct 7 report already flagged. Nothing new to build until `stacked` exists.

### Flaws that should block other credits
Evidence first, then my judgment of what each blocks.

| Flaw | Evidence | Judgment: what it should block |
|---|---|---|
| A long loose layer over a loose leg | §1 (3+ sources) | The layer credit (K1). The layer is the piece that causes the problem |
| The tee or shirt clearly hanging below a hip-length layer | Charles Tyrwhitt [Retailer, undated]: if the tee "hangs noticeably below the overshirt", get a longer overshirt or a shorter tee. RMRS overshirt, Oct 2026: the outermost layer should be longer than the layers under it. Put This On 2013 and 2018: the innermost layer is usually the shortest. Harry Rosen (snippet, `v5-editorial.md`). **Dissent:** a small peek is fine (Menswear Online, Modest Man; `v5-editorial.md`), and Put This On 2018 praises deliberately stacked hemlines | K1, only when it's "clearly" (not "a little"), and only under hip-length layers (overshirt, chore coat, field jacket, shirt-jacket). **Judgment:** a tee showing under a cropped bomber or trucker is normal and is part of the "short layer over a full leg" shape |
| A boxy layer over skinny legs | §1 | Already a v4 penalty (P1). No extra block needed |
| A shoe fighting the leg (chunky under narrow; dainty under wide) | §1 | K4 ("shoes that complement"). S1 already penalizes chunky under narrow |
| A jacket that's too short for its type, or a coat shorter than the blazer under it | `proportions.md` (2/0, timeless) | Already v4 L1 for a shirt under a blazer; rare for this audience |

**Judgment on the founder's chore-coat case.** The layer earns +0.75 because it exists. Sources would credit the *shape* when the coat ends at the hip over a straight or fuller leg, and give no shape credit over slim jeans. The cleanest v5 design is: **K1 full only when the layer is the longest piece and the leg isn't narrower than straight; otherwise reduced** (size from the gold set). The alternative, a penalty for slim legs, has no source calling slim a mistake, and it would key on the least reliable reading.

---

## 3. Leg shape: straight vs slim, for 18–30 guys now

- **Straight / relaxed-straight is the 2025–26 default.**
  - GQ, Sep 2026: "straight, relaxed, and vaguely '90s".
  - GQ, Mar 2026: "Straight-Leg Supremacy". A Mytheresa buyer: "I expected to see a lot more slim silhouettes by now… I just haven't".
  - RMRS, Jun 2026: most men land in straight or relaxed-straight (body-framed).
  - Permanent Style, Simon Crompton, Jul 15 2026: wide legs are "tipping into the late majority". Teenagers wear "90s Levi's or Carhartt".
- **Slim (not skinny) is holding a niche, and skinny may come back later.**
  - InsideHook, Shelby Slauer, Jul 24 2025 [Affiliate]: Levi's slim-straight "back on trend… not to be confused with skinny".
  - GQ, Feb 4 2026: an "impending slimmification" and skinny jeans "coming back", though "it will take a while".
  - Permanent Style: Dior, Prada and Thom Browne showed skinny trousers in 2026, but it will take 10+ years to reach the mainstream.
  - **Trend risk:** a rule that prefers straight over slim is a 2025–28 rule, not a timeless one.
- **Chore coat, overshirt or work jacket over a tee.**
  - **Straight or fuller (6):**
    - GQ Sep 2026: layers including chore coats need "something sturdy to sit on".
    - RMRS overshirt, Oct 2026: "straight or slightly fuller"; skinny is "top-heavy".
    - Man of Many, Tanisha Angel, updated Aug 10 2023 [Affiliate]: "dark straight-leg jeans" with a chore coat.
    - Stridewise, Jacob Leckrone, updated Sep 7 2026 [Affiliate]: a relaxed fit in your jeans to balance the boxy coat.
    - Quietly Well Dressed, Jason Howard, Oct 5 2026 [Blog]: straight chinos with "enough room through the trouser leg".
    - GQ Apr 2025: wide dark denim, a chore jacket and chunky boots as the classic workwear look.
  - **Slim allowed (3):**
    - Charles Tyrwhitt [Retailer]: slim or straight chinos with an overshirt; with slim jeans, avoid an overly fitted overshirt.
    - H&M [Retailer]: a boxy overshirt "needs a narrower leg".
    - Put This On 2018: fuller top + slim trousers is the easier mix.
    - Snippet only, not counted: The Chic Tribe and a Club of Five TikTok also pair chore jackets with slim jeans.
  - **Calls slim a mistake: 0** (skinny: 2).
- **When slim is the better choice:**
  - Under a short, rounded jacket (bomber) in the "circle on a stick" shape (Put This On 2018).
  - With sleek shoes (RMRS ladder: slim → sleek leather, slim sneakers, Chelsea boots).
  - In a coherently slim outfit (slim jacket + slim trousers; Put This On 2018).
  - **Judgment:** slim + a chunky shoe or slim + a long boxy layer is where it goes wrong.
- **Readability (the real problem).** On the founder's photos `leg_shape` agreed with truth 40–53% of the time (`v5-fit.md`). 34% of the saved reads with an outer layer have slim or skinny legs (112 of 326 reads; 714 reads in all, stock + mirror + phone, 3 runs each). So the case is common, but the reading that decides it is a coin flip at the slim/straight line. **Judgment:** add a garment-relative cue the model can see in the lower close-up: **where the hem sits on the shoe** (narrower than the shoe and clear of it / about the shoe's width / wide enough to cover the laces). That's 2–4 cm at the hem in the close-up. It's untested, so it needs the flip test.

---

## 4. Layer proportions

- **Length vs the top underneath.** The convention is that the outer layer is the longest piece (RMRS Oct 2026; Charles Tyrwhitt; Put This On 2013 and 2018). A small peek is tolerated (Menswear Online, Modest Man). Deliberate stacking works "if precise" (Put This On). Charles Tyrwhitt adds that an overshirt's hem should "fall to the lower hip". RMRS says it should cover the belt and stop by the bottom of the fly.
- **Layer length vs the leg.** A short layer (at the hip or waist) suits full legs, and a long layer over full legs swamps (§1: GQ, H&M, Mr Porter). Long coats over slim legs are fine in the "coherent slim" family (a 3/4 topcoat with slim trousers; Put This On 2018).
- **Boxy vs fitted layers.**
  - Boxy is fine when it's short (GQ: bomber, Eisenhower, four-pocket jacket).
  - The layer must still fit over what's under it: shoulder seam on the edge for relaxed, "halfway down the arm" = oversized/borrowed (RMRS overshirt; already in `v5-fit.md`).
  - British GQ (Gerald Ortiz, Aug 20 2026) and Man of Many note chore coats come both boxy and slim. A chore coat's type alone doesn't say which.
- **Open vs closed.** Open is the casual default for an overshirt or chore coat (RMRS Oct 2026; Charles Tyrwhitt; Quietly Well Dressed). Buttoned reads neater and more structured (RMRS FAQ; Charles Tyrwhitt). **No source treats either as a fault.** Don't score it. A `worn_open` reading would only help the closet and the drawn tile.
- **Shoulders.** Covered by `v5-fit.md` (seam position). Nothing new on silhouette.
- **What v4 reads today.** `shows_below_outer` is true in only 4 of 326 reads with a layer. The prompt says `length` is "for untucked tops only", yet the model fills it on about half of outer layers anyway (100 mid_fly, 60 below_crotch, 2 at_belt, 164 na). Outer `volume` is 4+ in only 40 of 326 layer reads (it hugs 3), and top `volume` in 48 of 731 top reads. **So layer length is half-read without being asked, and layer boxiness is barely read at all.**

---

## 5. Per style: the defining silhouettes and the shape that breaks each

Evidence is thinner here: most per-style claims are retailer or affiliate pages, and vintage sport and outdoor have no 2023+ editorial source I could open. Bands are the RULEBOOK's.

| Style | 1–3 defining silhouettes | The shape that most breaks it | Evidence |
|---|---|---|---|
| **Streetwear** | (1) Boxy tee or hoodie + baggy/wide jeans stacked + chunky or basketball sneakers. (2) A cropped/boxy jacket (bomber, leather, trucker) over baggy jeans | A long, loose layer (overcoat, long parka) over baggy jeans ("swamps", H&M); or an oversized top over skinny jeans | Highsnobiety ~2023 (chunky + wide); H&M (cropped leather over loose denim "always long enough to stack"); GQ 2025 (boxy bomber + roomy jeans); FashionBeans 2026. Medium |
| **Workwear** | (1) Chore coat or trucker at the hip + tee + straight/relaxed dark jeans or double-knees, cuffed, boots. (2) Painter pants (roomy straight) + workshirt | A boxy coat over skinny or slim jeans (GQ Sep 2026, RMRS overshirt: skinny); chunky runners | GQ Apr 2025 (wide dark denim, chore jacket, chunky boots); GQ Sep 2026; Mr Porter 2025 (painter pants "roomy, straight-leg"); Stridewise; Man of Many. Medium–strong |
| **Vintage sport** | (1) Boxy jersey or rugby + straight or baggy jeans + low-profile sneakers (Samba type) | Chunky sneakers, or a full matching kit (already a tip) | Retailer pages and blogs only; a JD Sports "tight top, wide bottom" line is snippet-only in `v5-fit.md`. Weak |
| **Outdoor** | (1) Relaxed fleece or shell (layer-friendly) + straight or wide cargo/trail pants + trail shoes | A shell over skinny jeans (by the general rule) | Retailer search summaries only (`v5-fit.md`). Weak |
| **Minimal** | (1) Big pants, little shirt: a fitted or cropped knit or tee, tucked or short, + wide pleated trousers + loafers or GAT. (2) A boxy cropped top over full trousers (city boy). (3) A tonal relaxed-straight middle | A long, drapey top over wide trousers (Mr Porter); chunky runners (Mr Porter, H&M) | Mr Porter 2025; GQ 2025; H&M; city boy via `style_archetypes.md`. Medium–strong |
| **Classic prep** | (1) The classic silhouette: a regular oxford, polo or knit, natural shoulder, straight chinos ("Big Chino"-type fuller chinos are now accepted), no to slight break, loafers | An oversized or boxy top, a pooling hem, chunky sneakers | Put This On 2018 (classic); GQ Sep 2026 (Polo "Iconic Big Fit" chinos); Ivy sources snippet-only (`v5-fit.md`). Medium |
| **Smart casual** | (1) A quarter-zip, knit or overshirt over straight trousers or chinos. (2) A tee tucked into pleated trousers, with an unstructured jacket or open overshirt. (3) A soft, short-bodied unstructured blazer over cargos or wide chinos | A long untucked tee past the crotch (F6 exists); a long coat over wide trousers | GQ Apr 2025 ("Tuck Your Tee Into Pleats"; an unstructured blazer "that sits shorter through the body" with cargos); GQ Mar 2026 (pleats with narrow loafers). Medium |

**Judgment:** what all 7 share is length logic: short over full, or a middle top over a middle leg. That's why one length-based rule set can serve every style, with streetwear's extra room coming from its band (already v4).

---

## 6. The rules, one row each

Confidence: **strong** = 2+ independent outlets (counted by outlet, not by page) and no 2023+ dissent; **medium** = support with dissent or retailer-heavy; **weak** = one outlet or snippets. "Reading risk": big cues (length, tuck, a shoe's bulk) are fine; fine distinctions (slim vs straight, a slight drop) are hard.

| # | Rule in plain words | Kind | Conditions (Kitted fields) | Sources | Confidence | What the model must see; field status | Reading risk |
|---|---|---|---|---|---|---|---|
| S1 | A long, loose layer or top over a loose leg looks swamped | Blocks the layer credit (or a small penalty) | Outer or top `length` = below_crotch (or **NEW** outer length mid-thigh+), untucked; bottom `leg_shape` relaxed/wide/barrel. Exempt: a matching set (S10) | GQ Apr 2025; Mr Porter Sep 2025; H&M Fall 2026; FashionBeans 2025 (via `v5-fit.md`). Dissent: city-boy long coats, RULEBOOK's tonal 9.0 anchor | Strong (3 outlets, 1 a retailer) | Layer hem relative to the crotch. **Half-read today:** the model fills `length` on ~50% of outer layers although the prompt says "na". Needs a prompt line making it official | Low–moderate: a 15–20 cm cue. Open coats hang unevenly; one mirror arm raises a side |
| S2 | A waist break (tuck, cropped/at-belt top, or a layer ending at the hip) over a straight-to-wide leg is the best-proportioned shape | Reward (inside the cap) | `tucked` full, or top/outer `length` cropped/at_belt (outer: **NEW** "at_hip"); `leg_shape` straight/relaxed/wide/barrel | Mr Porter 2025; GQ Apr 2025; GQ Jun 2023; Put This On 2018; H&M 2026; Westwood Hart and A Well Styled Life (snippets, `proportions.md`) | Strong (5 outlets opened, 0 against) | Tuck and top length (have); leg straight or looser (have, shaky at slim/straight) | Low for tuck and length; moderate for the leg. Gate on leg ≥ straight, so a slim-vs-straight flip costs the reward, never a penalty |
| S3 | A dainty shoe under a wide leg makes the outfit bottom-light | Penalty (small) or blocks shoe credit | `leg_shape` wide/barrel (relaxed: tip only) + **NEW** `shoe_profile` = sleek (thin-soled minimal sneaker, narrow runner, skinny-soled or pointy dress shoe). Low-profile retro sneakers and loafers = "regular", fine | GQ Apr 2025; RMRS Jun 2026; Opumo (snippet). Mr Porter and H&M don't contradict (their slender picks are loafers, GATs, derbies) | Strong | Shoe sole thickness and toe shape in the lower close-up; **NEW** field (already proposed Oct 7) | Moderate; worse when the hem covers the shoe. Partial check: never |
| S4 | A chunky shoe under a narrow leg | Penalty (exists: S1, −0.45) | `BULKY_SHOES` + skinny/slim | Highsnobiety ~2023; RMRS; Put This On 2018; `proportions.md` | Strong | Have | Moderate (slim reads are shaky; it already ships) |
| S5 | Chunky sneakers under a wide leg complement it | Reward, **streetwear only** (as v4) | v4 K4 street trigger | For: GQ Apr 2025, RMRS, Highsnobiety. Against: Mr Porter Sep 2025 ("throwing in a big, chunky shoe… doesn't do that"), H&M ("Chunky runners fight the proportions") | Medium (split 3–2) | Have | Low. **Don't extend to minimal, smart casual or prep** |
| S6 | A fitted, cropped or tucked top over wide legs is right, never a fault | Removes a wrong penalty | Top `volume` ≤2, or `length` cropped/at_belt, or `tucked` full + leg wide → skip P1_leg_vs_style | GQ Apr 2025; Mr Porter 2025; H&M; Proper Cloth (weak). Dissent: RMRS (skin-tight top = "costume") | Strong for "close or cropped"; medium for skin-tight `volume` 1 | Have | Low |
| S7 | A chore coat, overshirt or work jacket wants a straight or fuller leg; over slim legs the layer earns less | Reduces the layer credit (no penalty) | Outer in {chore_coat, overshirt, field_jacket, flannel/denim shirt as layer} + `leg_shape` slim. Skinny is already a penalty | For straight+: GQ Sep 2026, RMRS Oct 2026, Man of Many 2023, Stridewise 2026, Quietly Well Dressed 2026, GQ Apr 2025. For slim: H&M, Charles Tyrwhitt, Put This On 2018. Slim called a mistake: 0 | Medium | `leg_shape` slim vs straight (have, 40–53% vs truth). Better: **NEW** hem position on the shoe (narrower than the shoe / at its width / covering the laces), read in the close-up | **High.** Slim vs straight is the hardest leg call. Don't let it move points until the new cue passes the flip test and the size ladder |
| S8 | The tee or shirt clearly hanging below a hip-length layer looks accidental | Blocks the layer credit | Outer in hip-length types (overshirt, chore coat, field jacket, shirt-jacket) + under-top hem **clearly** below it. Not for bombers, truckers or cropped jackets | Charles Tyrwhitt [Retailer]; RMRS Oct 2026; Put This On 2013/2018; Harry Rosen (snippet). Dissent: small peek fine (Menswear Online, Modest Man); deliberate stacks (Put This On) | Medium | `shows_below_outer` (have, boolean; true in only 4/326 layer reads). Upgrade to no / a_little / clearly (as `v5-editorial.md` L4) | Moderate: open jackets, arm position |
| S9 | Pick one break on loose pants: cropped to the ankle or gently pooled, not bunched | Already planned (`stacked`) | `hem` × `leg_shape` × garment | GQ Apr 2025; GQ Sep 2026 ("gentle pooling, not bunching"); Put This On 2018; RMRS ("One clean break") | Medium (GQ allows gentle pooling, RMRS doesn't) | `hem` + **NEW** `stacked` (Oct 7) | High (hem 40–53% vs truth) |
| S10 | A matching loose set (same color and fabric top and bottom) reads as one shape, so both-loose is fine | Exemption from S1 and P3 | Top and bottom same `color_family`, both loose | H&M only | Weak | Have (color family; fabric isn't readable) | Low, but rare |
| S11 | The relaxed-straight middle with a clean hem is the default: no shape credit, no penalty | Principle (keeps 7.0 honest) | Top `volume` 2–3, mid_fly or at_belt, leg straight/relaxed, clean hem | GQ Sep 2026; GQ Mar 2026; Put This On 2018 | Strong | Have | — |
| S12 | Open vs closed layer | Never scored | **NEW** `worn_open` (closet, drawn tile) | RMRS, Charles Tyrwhitt, Quietly Well Dressed: both fine | Strong (that it's neutral) | — | Low |

---

## Top 10 rules worth testing
Ranked by evidence strength × how often it matters for 18–30 guys × how readable it is from a phone photo. Ranks are my judgment.

1. **S2, waist-break reward** (tuck, cropped/at-belt top, or hip-length layer over straight-to-wide legs). Strong, common in the wide-leg era, readable from big cues. It's the cleanest "earned" credit for no-layer outfits too.
2. **S1, a long loose layer over a loose leg blocks the layer credit.** Strong, common in fall and winter, readable once outer `length` is official. It directly answers "a layer that just sits there earns little".
3. **S6, stop charging wide legs under a close, cropped or tucked top.** Strong, removes a wrong −0.45, no new reading. It's also the founder's open "Wide jeans" decision.
4. **S3, dainty shoe under wide legs.** Strong. Needs `shoe_profile`, already on the Oct 7 list.
5. **S8, the tee clearly below a hip-length layer blocks the layer credit.** Medium, moderately common, needs the 3-way `shows_below_outer`.
6. **S7, the chore coat or overshirt over slim legs earns a reduced layer credit.** This is the founder's case: medium evidence and very common (34% of layered reads). It ranks low only because the reading is a coin flip today. Test the hem-on-shoe cue first.
7. **S5, keep the chunky-sneaker credit under wide legs for streetwear only.** Medium (split). It's a guard, not a new rule.
8. **S4, chunky shoe under a narrow leg.** Strong and shipped. Keep it.
9. **S9, one chosen break on loose pants.** Medium. Rides with the `stacked` reading.
10. **S10, the matching-set exemption.** Weak and rare. Tip at most.

## Things v4 gets wrong today
All from `rubric.py` v4.0 on made-up readings (no person, no picks).

1. **Chore coat + white tee + slim dark jeans + low-profile sneakers = 8.5, exactly the same as straight jeans** (credits: Layered + Shoes). v4 can't tell the shapes apart. Under the default band, slim legs are fine whatever is on top. The founder and his friend put it near 7. Only skinny costs anything (8.0).
2. **A tee hanging below the chore coat costs nothing** if its own hem reads mid_fly (8.5 with `shows_below_outer` true). L1 only checks tailored jackets. It costs −0.8 only when the tee itself reads below_crotch (7.5), and then it's charged as "top too long", not as a layer problem.
3. **A long overcoat over a knit and wide trousers with loafers scores 9.0** ("Dialed in"; Layered + Elevated + Shoes). That's the shape GQ calls "stumpifying" and H&M says "swamps you". It's also a RULEBOOK 9.0 anchor, so the conflict should go to the council and the gold set. The same coat over a hoodie and wide jeans with chunky sneakers: 8.0. P3 ("everything oversized") only fires when the top reads volume 4+, which happens in under 7% of top reads (48 of 731). Outer layers read 4+ in 12% of reads, and P3 doesn't look at the outer layer at all.
4. **Tucked tee vs untucked tee over wide trousers with loafers: both 8.0.** The textbook "big pants, little shirt" earns nothing for its shape.
5. **A boxy cropped tee over wide jeans with low-profile sneakers = 7.5**, the same as a plain tee + straight jeans + white leather sneakers (7.5). The most-endorsed streetwear and minimal shape gets no reward.
6. **Navy blazer + tucked oxford + wide jeans + loafers loses 0.45 (P1_leg_vs_style)** because nothing detects a style that allows wide legs. GQ (an unstructured blazer with cargos) and Mr Porter (wide legs with an oxford or blazer) endorse it. It still lands at 8.5 on three credits, so the penalty is noise, not judgment.
7. **A fitted knit over wide trousers with a pointy dress shoe = 8.0.** Nothing sees the dainty shoe under the wide leg (S3 gap). The knit worn alone also earns "Layered" (a knit top counts as a layer), which `v5-editorial.md` already questions.
8. **The chunky-sneaker credit under wide jeans** (K4 street trigger) is right only for streetwear. Two of the newest sources (Mr Porter 2025, H&M 2026) say chunky runners fight wide trousers. Don't widen it.

## What I couldn't verify
- **Esquire** (the browser pane refuses the domain) and **Business of Fashion** (paywall). The BoF headline claim, "wider pants in the mass market up 17% in August 2025", is snippet only.
- **Die Workwear's** rule that a jacket should bisect you halfway from collar to floor: snippet only (X posts). The Put This On 2018 article by the same author says it about suit jackets.
- **Per-style silhouettes for vintage sport and outdoor:** no 2023+ editorial page opened; retailer and blog snippets only.
- **No study** tests whether ordinary raters prefer straight over slim under a layer, or reward a waist break. Every rule here is editorial opinion; only the gold set can size them. The founder's ~7 is one pair of raters.
- **The H&M page** has no visible author or date (its title says Fall 2026). It's also internally mixed: "both loose… goes wrong" next to "everything is loose, so the fix is length".
- **Whether the model can read** outer layer length, a 3-way `shows_below_outer`, `shoe_profile` or a hem-on-shoe position reliably: all untested. Each needs the 3-run flip test (≥90% the same) before it moves points.
- **Charles Tyrwhitt's guide** shows no date.
