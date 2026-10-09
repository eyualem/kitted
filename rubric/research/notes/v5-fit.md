# Fit by garment: what "fits", what's "oversized on purpose", what's "too big" or "too tight"


*Spot-check (main session, Oct 9): RMRS overshirt guide confirmed (Antonio Centeno, updated Oct 9 2026: seam on the shoulder edge = relaxed, "halfway down your arm" = oversized, "borrowed it from a bigger guy"). FashionBeans oversized guide (Nov 25 2025) confirmed, with two corrections: "where it counts" is a paraphrase (the page says oversized "in the correct places, like the shoulders and the waist"), and "sleeves above the wrist bone" is from its oversized-suit section.*
*Oct 9, 2026. Claude, web research only. Builds on `notes/proportions.md` §1 and §6 (shoulder seam, sleeve, top-and-leg volume) and `notes/scoring_evidence.md` §3 (what a VLM reads), and doesn't repeat their sources. Format follows `notes/v5-editorial.md`.*

## How to read this

- **Labels.** [Study] = peer-reviewed or academic. [Editorial] = a magazine or blog with no product of its own in the piece. [Affiliate] = editorial with shop links. [Retailer] = a shop's own guide or blog. Retailers gain when you buy, and brand fit guides describe their own cuts.
- **"Search summary"** means I couldn't open the page and the claim comes from the search engine's summary. Treat it as unverified.
- **Pages I couldn't open:** GQ and Esquire block this tool (no searches or fetches). Mr Porter (Journal and the Derek Guy oversized piece), COS's fit guide and Carhartt's fit page returned 403; their claims are search summaries. The Howlett 2013 repository pages loaded without the abstract, so its numbers are a search summary. I found no Heddels fit guide and no Hypebeast fit piece. LibKey wasn't available in this session; study links are publisher or open-access URLs.
- **The body rule.** Every checkpoint below is a position or a fold *on the garment*: where a seam, a sleeve end or a hem lands, and whether fabric pulls or bunches. None needs a judgment about the body. Section 5 flags the measurements that would sneak body size back in.
- **Pixel arithmetic** (mine, not measured): in the 768×1024 upload a 1.8 m man is about 850 px tall, so about **0.47 px per mm** (same basis as `v5-editorial.md`). 1 cm ≈ 5 px. The upper and lower close-ups (#104) roughly double that, depending on the crop.
- **Kitted's own reads** (local, Oct 8): `sleeve_end` agreed with truth 70–76% of the time; `hem` and `leg_shape` 40–53% in every arm (`extraction-test/results/INDEX.md`; truth in `inputs/phone-oct8/truth.csv`). Leg shape from the body outline overlapped too much on 50 stock photos (DECISIONS-LOG, the measure session).

## Bottom line

1. **Shoulder seam, sleeve end and hem are the core fit checkpoints for every top.** They're the most-agreed rules (5+ sources each) and they're positions, so they need no body judgment.
2. **"Oversized on purpose" and "too big" differ in three visible ways.** A designed oversized top has a seam just past the shoulder, a body that is wide but *short* (often with a ribbed hem), and sleeves that end at the wrist. A regular top sized up has a seam far down the arm, a body that is *long*, and sleeves over the hands or bunched. Length is the strongest single tell, and today's `length` field already reads it.
3. **Too tight shows as pulling, never as "fitted".** The tells are X-creases at buttons, a gaping placket, tension lines across the chest, the seam riding toward the neck, the hem riding up, and whiskers at the crotch. Most are a few pixels wide at 1024 px; they need the close-ups.
4. **Style changes the targets, mostly for length and volume, not for the shoulder rule.** Streetwear, minimal and outdoor allow boxy and wide. Smart casual and classic prep want regular tops and straight or tapered legs. "One loose piece, one controlled piece" is the durable rule. "Both loose" works only when the top is short (streetwear and minimal).
5. **The phone can measure three things safely, as positions along his own limbs:** pant hem against the ankle and shoe top, shorts hem against the knee, and top hem against the hip-to-knee span. Sleeve end against the wrist is possible on the hanging arm only. **Any width measurement (garment against shoulders, hips or thighs) measures his body too, so it's unsafe.**
6. **No benchmark measures VLM accuracy on "tight / regular / loose / too big" in real photos.** Google's FIT paper (Apr 2026) found VLM-predicted measurements insufficient for fit. So fit should be built from coarse positions and fold cues, judged in code, not asked as "does this fit?".

---

## 1. Per-garment checkpoints: regular/fitted vs. oversized/relaxed

### Tee
- **Shoulder seam (regular):** on the edge of the shoulder bone, where the arm begins. A seam on the upper arm means too big; a seam toward the neck means too small. [Retailer] SANVT, Sep 2019 ([link](https://sanvt.com/journal/how-should-a-t-shirt-fit/)); [Affiliate] The Modest Man, Brock McGoff, updated Apr 18 2025 ([link](https://www.themodestman.com/t-shirt-fit-guide/)); [Affiliate] Primer, Andrew Snavely, Mar 25 2026 ([link](https://www.primermagazine.com/2019/learn/untucked-shirt-should-fit)). **3 opened + 2 in `proportions.md`; 0 dissent for regular cuts.**
- **Sleeve end (regular):** halfway between armpit and elbow (SANVT; Modest Man). Primer allows mid to three-quarters down the bicep, "preferably toward the higher end". Sleeves should sit close to the arm, not tent away (Modest Man). **3 sources.**
- **Body (regular):** hangs straight, doesn't cling. Modest Man's pinch test: about 2–3 in each side; past 3 in "moves into boxy territory". SANVT: 2.5–5 cm each side. (Pinch tests can't be seen in a photo; what shows is cling vs. tenting.)
- **Hem (regular, untucked):** about mid-fly, roughly 5 cm below the belt (SANVT; Modest Man "right around mid-fly"). The bottom of the fly or lower is too long (Modest Man). **3+ sources** (plus 2 in `proportions.md`).
- **Oversized on purpose:** seam slightly past the shoulder, sleeves a few inches past the bicep but above the elbow, the body roomy; a long tee shouldn't "swallow your frame". [Affiliate] OPUMO, undated ([link](https://www.opumo.com/magazine/oversized-t-shirts-for-men)). COS calls its relaxed cut "subtly dropped shoulders" and its oversized cut "generous… elongated" (search summary; page 403) [Retailer] ([link](https://www.cos.com/en-us/fit-guide/men/t-shirt-fit-guide)). Uniqlo U's oversized tee: "dropped shoulders", half-length sleeves (search summary) [Retailer] ([link](https://www.uniqlo.com/us/en/products/E465185-000/00)). nss magazine (2021, old) describes Uniqlo's oversized tee as wide and short (60 cm long, 55 cm wide) [Editorial] ([link](https://www.nssmag.com/en/fashion/26537/uniqlo-tshirt-fit)).
  - **Dissent on length:** COS says "elongated", OPUMO allows "just above mid-thigh" (and `proportions.md` cites Menswear Online at mid-thigh). Uniqlo and the boxy-cropped trend say short. **The length of an oversized tee is not settled; the boxy-short version is the safer "intentional" signal.**

### Hoodie / sweatshirt
- **Shoulder seam (regular):** on the shoulder bone. Too high cuts into the armpit; on the upper arm looks too big. [Retailer] SANVT sweatshirt, Feb 14 2020 ([link](https://sanvt.com/journal/how-should-a-mens-sweatshirt-fit/)).
- **Sleeves and cuffs:** reach the wrist, cover a watch with arms straight; cuffs "finish just above the wrists but not cut in"; loose enough that bending doesn't shorten them (SANVT).
- **Body and hem:** the waistband snug at the hip, the body loose (3–6 cm each side); the hem about mid-fly and "definitely not" over the seat (SANVT). Retail guides put a regular hoodie hem at or just below the waistband (search summary; weak retailer pages).
- **Oversized on purpose:** Ape to Gentleman's oversized-hoodie guide says it should still fit "in the body and arms"; a regular hoodie several sizes up ends up "hanging off you awkwardly". Its example of a designed oversized cut (Camber): dropped shoulders, slightly cropped body, tightly ribbed hems. [Affiliate] Ape to Gentleman, undated ([link](https://www.apetogentleman.com/best-oversized-hoodie-brands-men/)). Ape's 2026 oversized roundup: tight ribbing at hem and cuffs "stops the garment from swamping you" [Affiliate] ([link](https://www.apetogentleman.com/best-oversized-clothing-men/)). A retailer hoodie guide says sizing up a regular hoodie puts fabric "in the wrong places" and makes sleeves long (search summary, weak).
  - **Dissent:** designer cuts go further: Acne Studios drops the seam to the elbows with long sleeves (Ape). Those are rare in a beginner's closet but would read as "too big" under a strict rule.
- **Oversized hoodie pairing:** RMRS (Jul 14 2025) pairs it with slim-fit trousers or joggers [Editorial] ([link](https://www.realmenrealstyle.com/hoodies-for-men/)).

### Button-up shirt / overshirt
- **Shoulder seam:** on the shoulder bone; past it is too big. [Affiliate] The Modest Man button-up guide, McGoff, updated Apr 21 2026 ([link](https://www.themodestman.com/button-up-shirt-fit/)); Primer 2026 ("edge of the shoulder bone, not the deltoid"). **2 opened + the tee sources.**
- **Sleeve end:** the cuff around the wrist bone (Modest Man); the base of the thumb (Primer). Short sleeves stay close to the arm, not flaring (Primer).
- **Hem untucked:** between mid-fly and the bottom of the fly; the tail never fully covers the seat (Primer; Modest Man). Past the bottom of the fly is too long (Modest Man).
- **Chest:** slim fit pinches about 1 in each side; more than 2 in both sides is baggy (Modest Man). Too-big tell: "pirate shirt" billowing sleeves (Modest Man).
- **Overshirt:** seam on the shoulder edge; the hem covers the belt and stops by the bottom of the fly; the outer layer longer than what's under it. **Relaxed** = seam on the shoulder edge and sleeves at the wrist; **oversized** = seam halfway down the arm and sleeves past the knuckles, which "looks like you borrowed it from a bigger guy". [Editorial] RMRS overshirt guide, Antonio Centeno, updated Oct 9 2026 ([link](https://www.realmenrealstyle.com/how-wear-overshirt/)).

### Knit sweater
- **Shoulder seam:** where the shoulder bone ends; it can't be tailored on knitwear, so it matters most. Raglan sleeves have no seam, so check for fabric hanging off the shoulder. [Retailer] Gentleman's Gazette sweater guide, Jack Collins, Dec 14 2022 ([link](https://www.gentlemansgazette.com/the-sweater-guide/)); search summaries of The Modest Man and RMRS sweater pages agree (seam "coming down your bicep" = too big).
- **Body:** a little extra material. "Rolls or billows" at the hem = too large; shirt seams showing through = too tight (GG).
- **Hem:** overlaps the waistband or just below; mid-fly is the common target (GG; Modest Man search summary). A shirt showing below it = too short (GG).
- **Sleeves:** the base of the thumb worn alone, about ½ in shorter over a shirt; long cuffs can be turned back (GG).
- **Oversized on purpose:** Derek Guy (Mr Porter) calls knitwear the easiest entry to oversized and says to watch where hems and shoulder seams land. His example: an oversized sweatshirt with long sleeves that stack at the wrist works because it is slightly cropped (search summary; page 403) [Retailer] ([link](https://www.mrporter.com/en-gr/journal/fashion/dieworkwear-how-to-experiment-with-oversized-24929938)). Chunky knits should fit closer, since bulk magnifies poor fit (RMRS chunky-knit page, search summary).

### Jacket / coat
- **Shoulder seam:** at the point of the shoulder; on the bicep = too big, toward the neck = too small. [Editorial/affiliate] The Essential Man denim jacket guide, Peter Nguyen, undated ([link](https://www.theessentialman.com/blog/denim-jacket-fit-guide-men)). Tailored shoulders should follow the natural line; ripples or pulling around the shoulder = poor fit [Editorial] Put This On, Jesse Thorn, 2011 (old, on principle) ([link](https://putthison.com/?p=20095)).
- **Sleeves:** at the wrist; more than about ½ in off "will look off" (Essential Man).
- **Length:** denim jacket at or just below the waist (Essential Man); bomber around the hip (search summary, weak); overcoat just below the knee, covering what's under it [Retailer] Black Lapel, Nov 13 2023 ([link](https://blacklapel.com/thecompass/how-should-an-overcoat-fit/)); a casual topcoat can be mid-thigh (search summary).
- **Room for layers:** it must button over what's under it; X-creases across the torso when buttoned = too tight (overcoat search summary).
- **Oversized on purpose:** a boxy chore coat can still be close through the body (Man of Many, search summary, [link](https://manofmany.com/style/best-mens-chore-coats-tips-on-how-to-wear-them)). FashionBeans (Nov 25 2025): an oversized jacket's sleeves still end above the wrist bone; oversizing goes "where it counts" (shoulders, waist) [Editorial] ([link](https://www.fashionbeans.com/article/how-to-wear-oversized-trend-men/)). Mr Porter's wide-trouser guide favors boxy, cropped-to-the-waist jackets and knits over long, drapey ones (search summary) ([link](https://www.mrporter.com/en-us/journal/fashion/wide-leg-pants-men-guide-25329258)).

### Jeans / chinos / trousers
- **Waist and rise:** chinos sit a little higher than jeans; a waist that needs a belt to stay up is too big; a waistband that leaves marks is too tight. [Retailer] Black Lapel chinos, Nov 13 2023 ([link](https://blacklapel.com/blogs/the-compass/how-chinos-should-fit)). Too-low rise shows as the waistband sliding down and the shirt billowing over it [Affiliate] Primer, Snavely, Apr 23 2026 ([link](https://www.primermagazine.com/2025/learn/3-fixes-if-you-hate-the-way-your-pants-fit-that-have-nothing-to-do-with-your-waist-size)). **Rise is mostly hidden by an untucked top** (`scoring_evidence.md` §3).
- **Seat and thigh:** sagging or bunching under the seat = too big (Primer); diagonal whiskers from the crotch = tight in the thigh (Primer; Bustle search summary). The seat is behind him, so a front photo can't show it.
- **Leg (regular):** a slim-straight line where "you should be able to see the silhouette of your legs"; creases around the quads and calves and a boot-cut look = too big (Black Lapel).
- **Break:** hem touching the shoe top without bunching (Black Lapel); no break to slight break is the clean modern look (search summaries of SANVT and Peter Manning chinos guides). `proportions.md` already covers pooling.
- **Relaxed / wide on purpose:** Carhartt's relaxed fit has more seat and thigh room with a straight leg that fits over boots; loose fit is wider and straight (search summary; page 403) [Retailer] ([link](https://www.carhartt.com/c/mens-fit)). Levi's 501/505 straight vs 550/559/568 progressively roomier (FashionBeans Levi's guide, search summary, [link](https://www.fashionbeans.com/article/levis-fits-explained/)). FashionBeans baggy-jeans guide (Kelly Larson, Sep 17 2026): "Loose but not too loose. Relaxed but not slouchy"; some pairs "balloon out" and need runway streetwear to carry them [Affiliate] ([link](https://www.fashionbeans.com/article/best-mens-baggy-jeans/)).
- **Stack vs pool:** intentional stacking works on narrower openings and heavier denim; a loose leg lets fabric float and bunch higher, which reads as puddled (low-quality pages and a Superfuture forum thread, search summaries; **weak evidence**). `proportions.md` covers the 2025 baggy-and-stacked norm.

### Shorts
- **Length:** about 1–3 in above the knee; "never go past the knees"; 7 in inseam is "universally flattering". [Editorial/affiliate] The Essential Man shorts guide, Peter Nguyen, undated ([link](https://www.theessentialman.com/blog/shorts-fit-guide-men)). Mizzen+Main (7–9 in, just above the kneecap) and Mott & Bow (mid-thigh to just above the knee, never at or below) agree [Retailer] (search summaries: [Mizzen+Main](https://www.mizzenandmain.com/blog/how-long-should-mens-shorts-be), [Mott & Bow](https://www.mottandbow.com/blogs/all-projects/draft-how-long-should-mens-shorts-be-the-simple-rule-that-makes-every-outfit-work)).
- **Width:** like trousers; "too long, too wide" is the classic bad fit (Essential Man).
- **Dissent:** Stitch Fix and Effortless Gent accept a 9–10 in inseam at or just below the knee (search summaries). Jorts and blokecore "oversized jorts" go past the knee on purpose (blokecore search summaries). **So "past the knee" is a fault for chino shorts, not for streetwear jorts.**

---

## 2. Oversized on purpose vs. simply too big

| Tell | Designed oversized | Regular cut sized up | Sources |
|---|---|---|---|
| Shoulder seam | Just past the shoulder (a few cm) | Far down the upper arm, toward mid-bicep | OPUMO; COS (search summary); RMRS overshirt ("halfway down the arm"); a search summary saying a seam "halfway down your upper arm" means too large (exact page unclear; American Apparel AU was among the results, [link](https://www.americanapparel.com.au/blogs/news/oversized-t-shirts-how-big-is-too-big)) |
| Body length | Wide but **short or at the belt**, often a ribbed hem | **Long**: past the bottom of the fly, toward the seat | Ape (Camber "slightly cropped", ribbed hems); Mr Porter (boxy, cropped to the waist, search summary); Derek Guy (cropped = intentional, search summary); nss/Uniqlo (wide and short). Dissent: COS "elongated", OPUMO "mid-thigh" |
| Sleeves | Tee: past the bicep, above the elbow. Long sleeve: at the wrist, or stacked at a ribbed cuff | Over the hands or bunched loosely; tee sleeves at or past the elbow | OPUMO; RMRS overshirt (past the knuckles = oversized/borrowed); FashionBeans (jacket sleeves above the wrist bone) |
| Hems and cuffs | Ribbed, snug: the volume is "held" | Loose hem hanging away; billowing at the hem | Ape 2026; GG sweater ("rolls or billows" = too large) |
| Drape | Holds its shape; heavier fabric | Shapeless, collapses | OPUMO ("still maintain a shape"); Ape 2026 ("less baggy and more loose"); FashionBeans (structure) |
| Where the volume is | Shoulders and body | Everywhere, including length and sleeves | FashionBeans (stylist Sarah-Ann Murray: oversized "where it counts") |

- **Gentleman's Gazette (Kyle Thibodeaux, Mar 4 2024)** names the too-big tells: seams past the shoulders, armholes and sleeves that don't fill out, sleeves past the wrist, a look of "someone else's clothing". It accepts oversized when it's deliberate. [Retailer] ([link](https://www.gentlemansgazette.com/oversized-clothes/))
- **Put This On (Derek Guy, 2019, on tailoring):** an extended shoulder works only with structure; without it "the excess cloth… would just collapse". [Editorial, old] ([link](https://www.putthison.com/you-should-wear-an-extended-shoulder/))
- **Count:** "seam far down the arm on a regular cut = too big": 7 (SANVT ×2, Modest Man ×2, Primer, Essential Man, RMRS, GG). "Designed oversized is short or ribbed": 5 (Ape ×2, Mr Porter, Derek Guy, nss). Dissent on length: 2 (COS, OPUMO).
- **The circularity risk** (`proportions.md` §6) stays real. If the model calls every dropped-shoulder top "volume 5", a sized-up regular tee looks "designed". The fix is to read the separate cues (seam position, body length, sleeve end, hem type) and let code decide, rather than ask the model "is this oversized on purpose?".

## 3. Too tight: the tells

| Tell | Garments | Sources |
|---|---|---|
| X-shaped creases radiating from each button | Shirts, jackets, coats | Dappered, Sep 2019 [Affiliate] ([link](https://dappered.com/2019/09/20-signs-your-clothes-are-too-tight/amp)); overcoat guides (search summary); Modest Man tee FAQ ("x-shaped wrinkles") |
| Buttons pulled away; a gap in the placket | Button-ups | Modest Man button-up ("way too tight"); Primer ("you need a bigger shirt. Period.") |
| Tension lines across the chest or from the underarm | Tees, knits, shirts | SANVT tee; Modest Man tee ("between the pecs"); search summaries |
| Shoulder seam riding toward the neck | All tops, jackets | Dappered; SANVT sweatshirt; Essential Man denim jacket |
| Hem riding up (above the belt when arms move) | Tees, overshirts, sweaters | RMRS overshirt (raise arms; hem above the belt = size up); Primer (hem rising more than an inch = low armholes) |
| Sleeves squashed around the arm; sleeves riding up when the arm bends | Tees, sweatshirts | SANVT tee and sweatshirt |
| Shirt seams showing through a knit | Sweaters | GG sweater guide |
| Collar or cuffs digging in | Sweatshirts | SANVT sweatshirt |
| Whiskers from the crotch; strained thigh and seat seams; flaring pockets | Trousers, jeans | Primer 2026; Dappered; Bustle (search summary) |
| Jacket that won't close over its layer | Jackets, coats | RMRS overshirt; overcoat search summaries |

- **Count:** each row has 2–4 sources; "pulling at buttons / placket gap" and "X-creases" are the best supported (4 each). No source disputes any tell; they differ only on how much is acceptable.
- **A caution for Kitted:** tightness tells correlate with bigger or more muscular builds even though the cue is on the garment. The copy must name the garment ("This shirt pulls at the buttons; try a size up") and never the body. Strain is already in v4; these are finer versions of it.

## 4. Fit norms by style (2024–2026)

*Trend = could flip in 1–3 years. Durable = has held for decades.*

- **Streetwear.** Boxy and oversized tops, baggy or wide jeans, stacked hems OK. "Both loose" is legitimate here: the SS25 Vetements runway paired a boxy tee with baggy, pooling denim (Now Fashion, search summary, [link](https://nowfashion.com/media/vetements-ready-to-wear-spring-summer-2025-paris-fashion-week-runway-015)); Mr Porter pairs wide trousers with boxy, cropped tops (search summary). **Trend direction:** the extreme pooling jean is cooling, toward "relaxed, controlled" baggy (FashionBeans Sep 2026; The Blueprint spring 2026, search summary, [link](https://theblueprint.ru/fashion/shopping/mens-jeans-26)). Denimology's Aug 2026 "baggy is cooling" piece is about **women's** denim (opened; tagged women), so it's weak for men ([link](https://denimology.com/?p=19468)). Durable: the shoulder and sleeve rules still apply to the top's *design*.
- **Smart casual.** Regular or slim-straight tops with the seam on the shoulder; tapered or straight trousers; no to slight break (Black Lapel; Primer; Modest Man). Relaxed tailoring and wide trousers are a 2025–26 trend (Proper Cloth, a retailer, search summary, [link](https://propercloth.com/reference/the-return-of-wide-leg-trousers-why-relaxed-tailoring-is-back-in-menswear/); Mr Porter "the dominant silhouette", search summary). Durable: shoulders and sleeve length.
- **Workwear.** Boxy chore coats at the hip, relaxed straight trousers that sit over boots (Carhartt, search summary; Man of Many). Workwear sits closer to the body than the "relaxed" label suggests: Carhartt describes relaxed as roomier "without going baggy" (search summary). Durable.
- **Minimal.** COS-style relaxed and oversized tops, boxy tees, wide trousers, tonal colors. A cropped boxy jacket over full, floor-grazing trousers is the minimal-runway proportion (Auralee SS25, Now Fashion, search summary, [link](https://nowfashion.com/auralee-menswear-spring-summer-2025-paris)). Trend-ish; the "short top over a full leg" logic is durable.
- **Classic prep.** Natural shoulder, a regular (not slim) oxford, flat-front chinos; "full-cut" trousers are a modern reading, since mid-century Ivy trousers were slim (search summary of Ivy-Style and the Wikipedia Ivy League page; [link](https://www.ivy-style.com/the-natural-shoulder.html)). Kamakura's Vintage Ivy OCBD is "regular fit with a box pleat" [Retailer] (search summary). Durable.
- **Vintage sport (blokecore and similar).** Boxy jerseys or track tops with baggy jeans or track pants; one stylist rule quoted is "tight top, wide bottom" (JD Sports blog and others, retailer search summaries, [link](https://blog.jdsports.co.uk/?p=56508)). nss magazine headlined "Goodbye Bloke Core" for 2025 (search summary, [link](https://nssmag.com/en/fashion/38636/2025-fashion-trends-top-10-styles)). **Trend, likely fading.**
- **Outdoor.** Relaxed, layer-friendly tops (fleece under a shell), wide or straight trail pants (retailer guides: Revolution Race, Printful; search summaries, [link](https://www.revolutionrace.co.uk/campsite/gorpcore)). Durable as function; the wide-pant styling is trend.

### Which combinations read as intentional
- **"One loose piece, one controlled piece."** FashionBeans 2025 ("balance the volume with a slimmer piece"; avoid super-skinny under oversized), Mr Porter wide-trouser guide (fitted or cropped top over wide trousers, search summary), Ape 2026 (keep the rest streamlined), RMRS hoodie (oversized hoodie with slim trousers). **4 sources.**
- **Oversized top + skinny pants: off.** FashionBeans says the contrast "looks odd" with super-skinny; `proportions.md` had 3/0. **Slim (not skinny) under an oversized hoodie is endorsed** by RMRS, so v4's −0.3 should key on skinny more than slim. (2 vs 1 on slim.)
- **Both loose: fine when the top is short.** Mr Porter (boxy, cropped to the waist, search summary), the H&M snippet in `proportions.md`, Vetements and Auralee runways. v4 already skips "everything oversized" for streetwear, outdoor and a top ending at the belt. **Supported.**
- **Long and loose on top over a wide leg, outside streetwear: off.** Mr Porter warns against long, drapey tops with wide trousers (search summary); FashionBeans says pick a lane.

## 5. What a 1024 px phone photo can show, and what the phone can measure

### Visible in the full photo vs. needs the close-up
- **Clearly visible (≥ 40 px differences):** a seam far down the arm (12–15 cm ≈ 55–70 px), a tee sleeve at the elbow vs mid-bicep (≈ 10–12 cm ≈ 50 px), a top hem at the belt vs below the crotch (≈ 15–20 cm), shorts above vs below the knee, a sleeve covering the hand, a jacket longer or shorter than what's under it, pooling over the shoe.
- **Borderline (10–25 px):** a designed "slight" shoulder drop (2–5 cm ≈ 10–24 px), mid-fly vs bottom of the fly (≈ 5 cm ≈ 23 px), a slight vs full break (2–3 cm), a ribbed vs open hem. Usable in the close-ups; in the full photo only with good light and contrast. Kitted's hem reads were 40–53% right, which fits this.
- **Close-up only (≤ 7 px):** a placket gap (5–15 mm ≈ 2–7 px), X-creases at buttons, tension lines, whiskers, collar fit. They're low-contrast folds that depend on light; a dark garment can hide them. Treat as tips unless a run-to-run flip test passes.
- **Not visible from the front:** seat sag, back strain, rise under an untucked top.
- **Mirror-selfie traps:**
  - The arm holding the phone is bent. Bending shortens a sleeve (SANVT says a good sleeve stays put when the arm bends, so a tight one won't). **Read sleeve length only on the hanging arm.**
  - A raised arm lifts the hem on that side (Primer's armhole test; RMRS's raise-your-arms test). **Read the top hem on the lower-arm side, or skip "too short" in mirror shots.**
  - A pushed-up sleeve is styling, not fit. It must not read as "short sleeves" or "sleeves too short".
  - The phone and hand cover part of the chest, often where the placket is.

### What the phone can measure (positions only)

*Tested Oct 9 (`fit-ruler.md`, DECISIONS-LOG #170): "safe" below means safe for privacy and fairness, not accurate. Built from these walks, the ruler lost to the AI on sleeve end and hem and tied on top length, and said "unsure" on 30–54% of photos.*
Apple Vision's body pose gives 19 points: nose, eyes, ears, neck, shoulders, elbows, wrists, root (waist), hips, knees and ankles ([Apple JointName docs](https://developer.apple.com/documentation/vision/vnhumanbodyposeobservation/jointname.md)). Kitted's prep already stores 14 of them (`KittedPrep.swift`) plus the person outline and each piece's box. A **position along his own limb** (for example "the sleeve ends 40% of the way from shoulder to elbow") doesn't depend on his height or width, because it's a ratio of his own segment.

| Measure | How | Safe? | Caveats |
|---|---|---|---|
| Pant hem vs ankle and shoe top | The bottom piece's lowest edge vs the ankle joints and the shoe box top | **Safe** | Wide legs hide the ankle joint; gate on joint confidence |
| Shorts hem vs knee | Shorts box bottom as a fraction of hip → knee → ankle | **Safe** | Knee point is fairly stable (COCO annotator spread 0.087 vs 0.107 at the hip) |
| Top / jacket hem vs hip and knee | The top's box bottom as a fraction of root → knee | **Safe, noisy** | The hip is the least certain joint (COCO sigma 0.107, the largest; [LearnOpenCV, 2023](https://learnopencv.com/object-keypoint-similarity/)); a loose top hides the hips; the raised-arm side is biased |
| Outer layer longer than the under layer | Two boxes' bottoms compared | **Safe** | Open jackets hang unevenly |
| Tee sleeve end vs shoulder → elbow | A color step along the upper arm (fabric → skin) as a fraction of the segment | **Safe in principle** | Needs a new color-step test along the limb; fails on skin-toned fabric; hanging arm only |
| Long sleeve vs wrist (over the hands) | A color step along elbow → wrist → hand (hand pose is already used for hiding hands) | **Safe in principle** | Hanging arm only; gloves and dark skin-like fabrics confuse it |
| Shoulder seam vs shoulder joint | — | **Not feasible now** | The shoulder joint is a skeletal centre, not the seam's edge; seams aren't segmented |
| Garment width vs shoulder or hip span ("ease") | Outline width ÷ joint span | **UNSAFE** | Measures his body as much as the garment |
| Leg width ÷ hip span (today's `Measure.legShape` probe) | Outline width at the knee ÷ hip span | **UNSAFE** | Confounded with thigh size; also overlapped on 50 stock photos |
| Cling vs tent (outline hugging the torso) | Outline smoothness | **UNSAFE** | It's body shape |

- **Pose under loose clothing is less reliable.** A 2024 gait study saw MediaPipe landmarks degrade in loose clothing ([arXiv 2412.03498](https://arxiv.org/pdf/2412.03498), qualitative); a ski-wear study notes no one has verified pose accuracy in loose clothes ([arXiv 2212.04820](https://arxiv.org/pdf/2212.04820)). [Study] So hip and knee positions under baggy clothes need a confidence gate.
- **Even safe position measures can touch the body.** A front hem can ride up over a stomach. That is still a garment position (the shirt is short there), but the copy should say "this tee runs short" and the rule should tolerate a few cm.

### What the evidence says about VLMs judging fit
- **Google/UW FIT (Karras et al., arXiv 2604.08526, Apr 9 2026):** real photos with "measurements predicted by VLM alone are insufficient for learning accurate fit"; Nano Banana Pro produced "overly loose or tight" results without measurement grounding. [Study] ([link](https://arxiv.org/html/2604.08526v1))
- **FitVTON (Ning et al., arXiv 2606.12012, Jun 10 2026):** GPT-5.2 used as a fit judge, five repeated runs, temperature 0: the tight/loose score varied by SD 0.08–0.12 on a 1–5 scale. That's repeatability, not accuracy; no correlation with people is reported, only a 20-person preference study. [Study] ([link](https://arxiv.org/html/2606.12012))
- **No benchmark** of Gemini or GPT on "tight / regular / loose / too big" labels in real photos was found. The DeepFashion VLM benchmark (`scoring_evidence.md` §3) has shape as the strongest group and sleeve length around 60% F1.

### Fit perception studies
- **Howlett, Pine, Orakçıoğlu & Fletcher 2013** (J. Fashion Marketing & Management 17(1)): 274 online raters, faces hidden, at most 5 s per image. The same man in a made-to-measure suit was rated higher than in a nearly identical off-the-peg suit on confidence, success, salary and flexibility, though not on trust. (Search summary; the repository page didn't load the abstract.) [Study] ([Herts repository](https://uhra.herts.ac.uk/id/eprint/3441/); [DOI](https://www.emeraldinsight.com/doi/abs/10.1108/13612021311305128)) **It's the only controlled study I found that isolates fit.** It's tailoring, not casualwear.
- **Shin & Damhorst 2014** (ITAA): college students judge fit on physical, aesthetic, functional and social dimensions (search summary). [Study] ([link](https://www.iastatedigitalpress.com/itaa/article/id/2749/)) It's self-perception, not observer ratings.
- **No study** compares observers' reactions to "oversized on purpose" vs "too big" casualwear. The gold set is the only way to test that.

---

## Final table

*Sources: count of independent sources, abbreviated. SV = SANVT [Retailer]; MM = The Modest Man [Affiliate]; PR = Primer [Affiliate]; EM = The Essential Man; RM = RMRS [Editorial]; GG = Gentleman's Gazette [Retailer]; FB = FashionBeans; APE = Ape to Gentleman [Affiliate]; OP = OPUMO; BL = Black Lapel [Retailer]; DP = Dappered; MRP = Mr Porter (search summary); COS/UQ/CH = brand pages (search summary). "1024 px": Y = full photo; C = close-up needed; N = not visible from the front. "Phone": positions only; UNSAFE = would confound with body size.*

| Garment | Checkpoint | Fitted/regular target | Oversized target | Too-big tell | Too-tight tell | Sources | Visible at 1024 px? | Measurable on phone? |
|---|---|---|---|---|---|---|---|---|
| Tee | Shoulder seam | On the shoulder edge | A few cm past it (dropped by design) | Halfway down the upper arm | Toward the neck | SV, MM, PR, OP, COS (5) | Far drop Y; slight drop C | No (seam not segmented) |
| Tee | Sleeve end | Mid-bicep | Past the bicep, above the elbow | At or past the elbow | Squashed, rides up | SV, MM, PR, OP (4) | Y (hanging arm) | Yes, fraction along shoulder→elbow; hanging arm only |
| Tee | Body | Straight, no cling | Wide, holds its shape | Shapeless, tenting | Tension lines, clinging | SV, MM, OP, APE (4) | Tent Y; tension lines C | UNSAFE (width) |
| Tee | Hem (untucked) | Mid-fly | At the belt or just below (boxy); dissent: longer | Bottom of the fly or past the crotch | Above the belt, rides up | SV, MM, PR, nss; dissent COS, OP (4 v 2) | Y (lower-arm side) | Yes, fraction root→knee; noisy |
| Hoodie / sweatshirt | Shoulder seam | On the bone | Dropped by design | On the upper arm, no other design cues | Near the neck, cuts the armpit | SV, APE, retail (2+) | Far drop Y | No |
| Hoodie / sweatshirt | Sleeves / cuffs | At the wrist, cuff snug | Stacked at a ribbed cuff | Loose over the hands | Rides up when the arm bends; cuff digs in | SV, APE (2) | Y (hanging arm) | Yes, wrist vs color step; hanging arm |
| Hoodie / sweatshirt | Hem | Mid-fly, ribbed band snug | Slightly cropped, ribbed | Long, over the seat, loose band | Taut band, bulk above it | SV, APE ×2 (3) | Length Y; ribbing C | Yes (hem vs root→knee) |
| Button-up / overshirt | Shoulder seam | On the bone | Relaxed: still on the edge | Halfway down the arm ("borrowed") | Toward the neck | MM, PR, RM (3) | Far drop Y | No |
| Button-up / overshirt | Placket / chest | Lies flat | Lies flat, roomy | Billowing "pirate" sleeves | Buttons pull, gap, X-creases | MM, PR, DP (3) | C | No |
| Button-up / overshirt | Sleeve end | Wrist bone to thumb base | At the wrist (relaxed) | Past the knuckles | Rides up the forearm | MM, PR, RM (3) | Y (hanging arm) | Yes, hanging arm |
| Button-up / overshirt | Hem untucked | Mid-fly to bottom of fly; outer layer longest | — | Past the bottom of the fly; covers the seat | Above the belt when the arms rise | MM, PR, RM (3) | Y | Yes; two-box comparison for layers |
| Knit sweater | Shoulder seam | Where the bone ends (raglan: no hang) | Dropped, best when cropped | Down the bicep | High, restricts | GG, MM, RM (3) | Far drop Y | No |
| Knit sweater | Body / hem | A little extra; mid-fly | Cropped boxy reads intentional | Rolls or billows at the hem | Shirt seams show through | GG, MRP (2) | Billow Y; seams C | Hem yes; body UNSAFE |
| Knit sweater | Sleeves | Thumb base (½ in shorter over a shirt) | Stacked at the cuff | Over the hands | Short of the wrist | GG, MRP (2) | Y (hanging arm) | Yes, hanging arm |
| Jacket / coat | Shoulder | Follows the natural shoulder | Boxy, may extend with structure | On the bicep; ripples | Toward the neck; pulling | EM, PTO, BL (3) | Far drop Y | No |
| Jacket / coat | Sleeves | At the wrist; covers shirt cuff | Above the wrist bone still | Over the hands | Shirt cuff overshoots a lot | EM, FB, BL (3) | Y (hanging arm) | Yes, hanging arm |
| Jacket / coat | Length | Denim: waist; bomber: hip; overcoat: about the knee; longer than the layer under it | Boxy, cropped to the waist | Hem far below the type's norm | X-creases when buttoned; won't close | EM, BL, MRP (3) | Y | Yes (hem vs joints; two-box) |
| Jeans / chinos / trousers | Waist / rise | At or near the natural waist | Relaxed rise | Gapes, slides down, shirt billows over | Marks, rolls, pockets flare | BL, PR, DP (3) | Mostly N (untucked top) | No |
| Jeans / chinos / trousers | Thigh / seat | Slim-straight, legs' line visible | Roomy, straight (relaxed, loose) | Seat sags (rear), quad creases, boot-cut | Whiskers, strained seams | BL, PR, DP, CH (4) | Whiskers C; seat N | UNSAFE (width) |
| Jeans / chinos / trousers | Break | No to slight break | Stacked on purpose: narrow opening, heavy denim | Pooling, puddle over the shoe | High-water when not cropped on purpose | BL, SV/PM summaries, weak stack pages (2+) | Pool Y; slight vs full break C | **Yes**: hem edge vs ankle and shoe top (safe) |
| Shorts | Length | 1–3 in above the knee | Jorts past the knee (streetwear) | Past the knee on chino shorts; too wide | Very short and riding up | EM, Mizzen+Main, Mott & Bow; dissent Stitch Fix, Effortless Gent (3 v 2) | Y | **Yes**: hem vs knee (safe) |
| All tops | Strain / pulling | None | None | — | Any pulling fold | All of §3 (4+) | C | No (folds are image texture) |
</content>
</invoke>
