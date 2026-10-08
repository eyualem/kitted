# Color theory for men's outfits (casual to smart casual, 18–30), scoreable from one photo

Researched Oct 7, 2026. Scope: rules stylists use, the color-science evidence behind them, and what photo signal each needs. Skin-tone, "personal contrast" (hair vs skin) and seasonal color analysis are **excluded** by Kitted's hard rule; where a source mixes them in, that part is noted as excluded and not used.

Access notes: Permanent Style and Mr Porter returned HTTP 403 to the fetch tool, and the Fashion and Textiles (2025) paper is behind a Springer cookie wall. For those, findings come from search-result summaries of the pages and are labelled "(search summary)". Schloss & Palmer (2011) and O'Donovan & Agarwala (2011) were read in full text.

Current Kitted color logic (from `extraction-test/rubric.py` v3.1, for reference): counts accents over a neutral set; bright vs muted; pattern rules; focal points vs boldness; tonal = tip only; and **already has one near-match rule** (`C5_near_match_jacket_trousers`: separate dark jacket + different dark trousers, e.g. navy blazer + black trousers). It has no lightness, harmony or temperature signal.

## 1. Value (light/dark) contrast between top, bottom and shoes

### Takeaway
"Separate top from bottom by lightness" is the most commonly stated casual color rule in 2023–2026 menswear guides, and lab research agrees that pairs too close in lightness (but not identical) read as less harmonious. But sources disagree on shoes (darker than trousers vs contrasting the trousers), and tonal outfits are explicitly allowed by other sources, so it should be scored narrowly (penalize "muddy/almost-same" value, never penalize deliberate tonal), and it needs a per-garment lightness signal that color_family alone only roughly gives.

### Cited Findings
- Effortless Gent (Barron Cuadro; published Jan 19, 2023, updated May 31, 2026) gives a contrast formula: "Light top, dark bottom, light shoes. Dark top, light bottom, dark shoes." It also says avoid outfits where all three pieces are the same color or similar value. It names khaki chinos, grey chinos and dark denim as safe bases. — [Effortless Gent, "What Color Clothes Go Together?"](https://effortlessgent.com/clothing-color-combos/)
  - Same page advises avoiding tops that match your skin tone. **Excluded** (skin tone).
- Outfit Narrative (author "Suzan", dated "Mar 2", year not shown) lists a "light-medium-dark" rule: one light, one medium and one dark piece, even within one color (three shades of brown/grey/navy); fail = only one or two values. Also a "monochrome base + contrasting jacket" rule (light base + dark jacket, or the reverse; fail = jacket in the same shade as the base). — [Outfit Narrative, "Simple Color Rules for Casual Outfits"](http://www.outfitnarrative.com/menswear/menswear-basics/simple-color-rules-for-casual-outfits)
- Permanent Style (Simon Crompton, 2010) classic tailoring rule: shoes darker than the trousers. Charcoal trousers take black or very dark brown shoes, mid-grey takes dark or mid brown, and only very light grey or cream trousers take tan. Even with pale trousers, a dark top calls for a mid/dark brown shoe, not tan (search summary). — [Permanent Style, "The rules and how to break them 8: tan shoes with pale trousers"](https://www.permanentstyle.com/2010/03/the-rules-and-how-to-break-them-8-tan-shoes-with-pale-trousers)
- Permanent Style also has a piece titled "A contrasting view: Mixing dark trousers with light tops" (content not retrievable, 403). — [Permanent Style](https://www.permanentstyle.com/?p=99331)
- Gentleman's Gazette's formality scale: brighter colors are more casual than somber ones (mid-blue suit less formal than navy or charcoal); light colors (beige, white, light blue) read casual in any season; brown is more casual than navy/grey; smoother/shinier fabric is more formal, visible texture is less formal (search summary). — [Gentleman's Gazette, "The Formality Scale"](https://gentlemansgazette.com/the-formality-scale-how)
- Ou & Luo (2006) two-colour harmony model (Color Research & Application 31(3):191–204): harmony depends on hue, lightness and chroma; the higher the lightness of both colours, the more harmonious; **small lightness differences (under ~15 CIELAB units) reduce harmony**; blue is the hue most likely to harmonise, red the least (search summary of the model; paper itself not opened). — [Ou & Luo model, as summarized via search; bibliographic record](https://ntust.academia.edu/LichenOu)
- Schloss & Palmer (2011) report that Chuang & Ou found pairs differing in luminance judged more harmonious than pairs similar in luminance; in their own data, pair **preference** depends on lightness contrast more than harmony does, and color **similarity** falls as lightness contrast rises (r = −.23) while harmony rises slightly with lightness contrast (r = +.10). — [Schloss & Palmer, "Aesthetic response to color combinations," Atten Percept Psychophys 73:551–571 (2011)](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- Schloss & Palmer (2011): in figure-ground pairs, lighter figures on darker grounds were rated more harmonious (r = +.13) and more preferred (r = +.14). — [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- O'Donovan & Agarwala (SIGGRAPH 2011; 327,381 ratings from 22,376 users on COLOURLovers plus Kuler and MTurk datasets): "lightness features are important"; dark themes are poorly rated; light-to-dark gradients are preferred; theme colours "should not be too similar to each other." — [O'Donovan & Agarwala, "Color Compatibility From Large Datasets" (2011)](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)
- A widely repeated "personal contrast" theory (match clothing contrast to your hair/skin contrast) appears on Real Men Real Style and similar sites. **Excluded** (depends on skin and hair). — [Real Men Real Style](https://www.realmenrealstyle.com/?p=1602)

### Inferences
- **Rule V1 "Top and bottom need clear separation, unless deliberately tonal."** Agreement: moderate-high among guides; supported by Ou & Luo (small ΔL reduces harmony) and O'Donovan ("not too similar"). Pass: white oxford + navy chinos; grey tee + dark denim; tonal: cream knit + beige chinos + brown suede (deliberate, light/medium/dark). Fail: mid-grey tee + mid-grey-blue chinos (different hues, same value: reads muddy). Signal: per-garment lightness. From color_family alone: only roughly (see proxy below); failing case is mostly a "different family, same value" case that families can't detect reliably. **Needs a new field.** Suggested scoring: a small mistake (≈ −0.3) or a tip only, firing when top and bottom differ in family but are within 1 lightness step and neither is black/white. Never fire on same-family tonal looks.
- **Rule V2 "Shoes anchor: don't let shoes almost-match the trousers."** Agreement: low for casual. Tailoring says shoes darker than trousers (Permanent Style); casual guides say light shoes with dark bottoms (Effortless Gent's white-sneaker-with-dark-jeans formula). They agree only that shoes should contrast or deliberately match, not nearly match. Recommend advice-only, not a score rule.
- **Contrast and formality.** Sources tie darkness and sobriety to formality (Gentleman's Gazette) but I found no menswear source that states "higher top/bottom contrast = more formal" as a rule; the white-shirt/dark-suit convention implies it. Don't score contrast against occasion.
- **Lightness proxy from current color_family names (inference, not sourced):** 5 = white, off_white_cream; 4 = light_grey, light_blue, khaki_beige, denim_light, yellow, pink, sage; 3 = grey, tan_camel, denim_mid, red, orange, blue, green; 2 = olive, brown, burgundy, purple, denim_dark; 1 = charcoal, navy, black. The proxy is weakest for brown, olive, green, blue and red, which each span light to dark in real garments; that is exactly where "same value, different hue" mistakes happen. A model-read `lightness` field (1–5) per garment is the cheapest fix.

### Gaps
- No 2025–2026 menswear source found that quantifies how much contrast is "enough".
- Permanent Style's "A contrasting view" article content could not be read (403).
- No study found that measured top/bottom lightness contrast against rated "put-togetherness" on real outfit photos.

## 2. Harmony schemes, reliable pairings and clashes

### Takeaway
Menswear guides overwhelmingly teach "neutral base + at most one accent" and a short list of reliable pairings (navy/grey/white, navy/tan/brown, olive/cream/denim, earth tones). Color-wheel schemes (complementary, triadic) are taught but lab research finds no evidence that complementary or template-matching combinations are rated more harmonious; similar hue and lower saturation are what raise harmony. Old "clash" taboos (navy + black, brown + black) are now considered outdated in 2026 sources, except the near-match case.

### Cited Findings
- Reliable pairings named by guides (search summaries): navy + grey + white ("navy anchors, charcoal refines, white creates clarity"); olive + stone/warm grey + mid denim; navy + beige + brown "the simplest timeless combination"; olive + white/cream "one of the strongest pairings for warmer months". Beige, brown, cream, taupe and often navy treated as neutrals. — [Westwood Hart color combinations guide](https://westwoodhart.com/blogs/westwood-hart/mens-fashion-color-combinations-guide-pairing-colours); [Westwood Hart wardrobe palette](https://westwoodhart.com/blogs/westwood-hart/best-clothing-colors-for-men-wardrobe-palette); [Real Men Real Style](https://www.realmenrealstyle.com/?p=45663)
- Outfit Narrative rules: "Earth tones" (olive trousers + beige sweater + brown suede boots; fail = earth tones with no texture variation); "One-color highlight" (ecru trousers + navy jacket + one yellow sweater or socks; fail = several bright accents). — [Outfit Narrative](http://www.outfitnarrative.com/menswear/menswear-basics/simple-color-rules-for-casual-outfits)
- Colour-wheel teaching in menswear (FashionBeans "Introduction to Colour", 2011, and similar): analogous colours (navy jacket, dark blue tie, light blue shirt) give low contrast and a restrained look; complementary colours are "the hardest to pair"; worn at full strength they're too much; one should dominate and the other accent (search summary). — [FashionBeans, Men's Fashion Basics Part 41 (2011)](https://www.fashionbeans.com/2011/mens-fashion-basics-part-41-an-introduction-to-colour/); [TheVOU, "The 7 Colour Schemes"](https://thevou.com/blog/7-colour-schemes-men/)
- Navy + black: Ape to Gentleman (Josh Sims, 2026) lists "never mix black and navy" as an outdated rule and calls the pairing "one of the easiest ways to look quietly put together". — [Ape to Gentleman, "12 Outdated Men's Fashion Rules You Can Break In 2026"](https://www.apetogentleman.com/fashion-rules-men-should-break/)
- Mr Porter: it must look deliberate; avoid black suit trousers with a navy blazer, which can look like you "got dressed in the dark"; differentiate with texture; casual example: navy polo + black jeans + white trainers (search summary; page 403, date not confirmed). — [Mr Porter, "You Asked: Can You Wear Black And Navy Together?"](https://www.mrporter.com/en-es/journal/fashion/you-asked-can-you-wear-black-and-navy-together-762234)
- FashionBeans (2017) also lists navy + black as a rule you can break (search summary). — [FashionBeans, "11 Outdated Style Rules You Should Break"](https://www.fashionbeans.com/article/outdated-style-rules-should-break/)
- Brown + black: Ape to Gentleman (2026) retires "no brown in town"; belt and shoes no longer need to match exactly, tonal shades are fine. FashionBeans guide on brown shoes with black trousers: darker browns pair more formally with black; lighter browns are for casual/daytime (search summary). — [Ape to Gentleman 2026](https://www.apetogentleman.com/fashion-rules-men-should-break/); [FashionBeans, "How to wear brown shoes with black trousers"](https://fashionbeans.com/article/how-to-wear-brown-shoes-black-trousers/)
- Navy blazer pairings (Nathan Tailors blog, Aug 31, 2026, no named author): recommended trousers are mid-grey (first choice), charcoal, light grey, stone/khaki/olive chinos, tobacco/olive/grey corduroy, dark denim with conditions. — [Nathan Tailors, "What trousers to wear with a blazer"](https://www.nathantailors.com/en/blog/what-trousers-to-wear-with-a-blazer)
- Schloss & Palmer (2011; 48 participants judging pairs of colours; full text): pair preference and harmony **both increase as hue similarity increases**; "pairs with highly contrastive hues are generally judged to be neither preferable nor harmonious"; they found "virtually no evidence" for Chevreul's claim that contrasting hues are harmonious. Harmony residuals were explained by greater hue similarity (13.7% of variance) and lower overall saturation (6.4%); pair preference + hue similarity + low saturation explained 82.4% of harmony ratings. — [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- Schloss & Palmer (2011), the "accent" finding: when one colour is a small figure on a large ground, preference for the figure colour **rises** as its hue contrasts more with the ground; warm figures on cool grounds and cool figures on warm grounds were preferred; saturated figures on desaturated grounds were preferred. — [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- O'Donovan & Agarwala (2011): hue templates (Matsuda's, complementary, triad, etc.) were tested on large rating datasets; "no evidence is found that they predict compatible colors"; users prefer themes neither monochromatic nor more than 2–3 distinct hues. They note that earlier lab studies (Ou & Luo 2006, 17 participants; Szabó et al. 2010, 9 participants) also did not find complementary or triadic templates harmonious. — [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)
- O'Donovan & Agarwala summarise the lab literature: colours harmonise if they have the same hue, equal or similar saturation, and contrasting lightness. — [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)

### Inferences
- **Rule H1 "Neutral base + one accent" (already scored).** Agreement: very high (every guide). The current accent count and the +0.5 standout credit already encode it. The research supports it in two ways: low-saturation, similar-hue bases are rated harmonious, and a single saturated accent against a muted ground is preferred (Schloss & Palmer figure-ground). Computable from color_family + saturation. No change needed.
- **Rule H2 "Don't reward color-wheel schemes."** Complementary/triadic credit is not supported by evidence (Schloss & Palmer; O'Donovan; Ou & Luo per O'Donovan). The useful part of "complementary" (navy + tan/rust, a warm accent on a cool base) is already a neutral + accent outfit under H1. Recommend: no complementary credit; keep the bright-clash mistake for two saturated hues on main pieces.
- **Rule H3 "Tonal with a value range" (possible small credit).** Agreement: moderate (Outfit Narrative's light-medium-dark; Effortless Gent warns against flat tonal; Gentleman's Gazette writes on monochromatic outfits). Evidence: same-hue pairs are the most harmonious (Schloss & Palmer; Chuang & Ou via S&P). Pass: cream tee + tan chinos + brown boots (3 values, one hue family). Fail: beige top + beige chinos + beige sneakers (one value: flat). Signal: hue family + lightness spread. Partly computable from families (tan family: khaki_beige/tan_camel/brown are distinct names), but a lightness field makes it robust. Today this is tip-only; could become +0.25 credit or stay a tip. Founder taste call.
- **Rule H4 "Earth-tone palette" (no new rule needed).** Olive, tan, brown, cream, rust are all neutrals or muted accents already, so earth-tone outfits score clean. The only earth-tone fail cited is no texture variation, which the photo model can't judge reliably (gap).
- **Clash taboos to NOT score:** navy + black in general, brown shoes + black trousers, belt not matching shoes. 2026 sources call these outdated. Keep only the near-match case (section 5).
- **Reliable-pair list as a "known good" credit:** possible but weakly justified. Every named pair is already neutral + neutral or neutral + one accent, so it would double-count H1.

### Gaps
- No empirical study found specifically on menswear casual outfits rating named pairs (navy + olive, brown + blue, etc.); guide pairings are expert opinion.
- Texture variation can't be confirmed from these sources as reliably visible in a phone photo.

## 3. Warm vs cool temperature mixing: real rule or myth?

### Takeaway
It's a real but niche idea, mainly from Permanent Style (Simon Crompton), framed as "warm/rural" colours (brown, burgundy, forest green) vs "cold/city" colours (grey, black, charcoal, cream). It's guidance for coherence, not a stated mistake, and mainstream guides don't use it. The research mildly supports warm accents on cool bases. Not worth a score penalty; at most a tip.

### Cited Findings
- Permanent Style (Crompton; articles dated 2016–2018, search summary): with more rural colours like burgundy, forest green or a warmer brown, light grey pieces can look too smart and cold. A cooler, less saturated brown doesn't go well with navy, but a warmer, more saturated brown in a coarse cloth (e.g. Harris Tweed) works with a navy roll-neck. Brown trousers work with both cold and warm colours on top. — [Permanent Style, "Wearing warm and cold colours" (2018)](https://www.permanentstyle.com/2018/04/wearing-warm-and-cold-colours.html); [Permanent Style, "What shoes should I wear with brown trousers?" (2022)](https://www.permanentstyle.com/2022/05/what-shoes-should-i-wear-with-brown-trousers.html)
- Permanent Style "The cold-colour capsule" (Dec 2020): a wardrobe built on brown, black, grey and cream (search summary). — [Permanent Style, "The cold-colour capsule"](https://www.permanentstyle.com/2020/12/the-cold-colour-capsule.html)
- Schloss & Palmer (2011): warm figure colours (red, orange, yellow) were preferred on cool grounds (blue, cyan, green) over warm grounds; residual pattern: warmer hues preferred on cooler backgrounds and vice versa. — [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- Ou et al. cross-cultural study (2012, 8 countries): only warm/cool, heavy/light and active/passive judgements of two-colour combinations were consistent across cultures; like/dislike was not (search summary). — [Ou et al., "A cross-cultural comparison of colour emotion for two-colour combinations"](https://research.chalmers.se/en/publication/154421)

### Inferences
- **Rule T1 "Warm accent on a cool base reads well" (advice-only).** Agreement: low among menswear guides (one strong source); mild research support. Pass: navy knit + tan chinos + brown boots; grey suit + rust tie. Fail (Crompton's example): light grey trousers + burgundy cord jacket + forest-green knit (too "city" a trouser for a "country" top). Signal: hue temperature per garment. Computable from color_family alone (warm: tan_camel, khaki_beige, brown, olive, burgundy, red, orange, yellow, rust; cool: navy, grey family, black, light_blue, blue, denim; white/cream neutral). Recommend no score impact.
- Temperature can't distinguish "warm grey" vs "cool grey" or "cool brown" vs "warm brown" from names; that would need measured hue, which phone photos make unreliable (section 7).

### Gaps
- Could not read the Permanent Style articles directly (403); quotes are from search summaries.
- No 2025–2026 mainstream source found that presents warm/cool mixing as a rule.

## 4. Saturation matching, repeating a color, and 60-30-10

### Takeaway
"Muted with muted, one bright with neutrals" is implicit in every one-accent guide and well supported by research (lower saturation raises harmony; a saturated accent on a muted ground is preferred). "Repeat a colour" (sandwich rule) and 60-30-10 appear in guides but are weakly sourced, borrowed from interiors, and hard to measure from one photo.

### Cited Findings
- Schloss & Palmer (2011): lower overall saturation raised harmony (6.4% residual variance); saturated figures on desaturated grounds were preferred; colours on saturated grounds were least preferred. — [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- O'Donovan & Agarwala (2011): lab literature trend is that colours harmonise with equal or similar saturation. — [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)
- Sandwich rule (Outfit Narrative): repeat a colour top and bottom with a different one between (pass: navy polo, white trousers, navy sneakers; fail: bold colours repeated). Effortless Gent's search summary also mentions it. — [Outfit Narrative](http://www.outfitnarrative.com/menswear/menswear-basics/simple-color-rules-for-casual-outfits); [Effortless Gent](https://effortlessgent.com/clothing-color-combos/)
- 60-30-10 (TheVOU, date not shown, search summary): borrowed from interior design; dominant 60% (suit or trousers), secondary 30% (shirt, knit), accent 10% (tie, pocket square, socks). It counts shades of one family as one colour, and neutrals like black, white, grey and brown "do not count" toward the three-colour limit. — [TheVOU, "The 3 Colour Rule in Menswear"](https://thevou.com/blog/three-colour-rule-style-guide-men/); [TheVOU, "Golden rule of colour"](https://thevou.com/blog/golden-rule-of-colour-men/)
- Ape to Gentleman (2026): belt and shoes needn't match exactly; "points of difference" make outfits interesting. — [Ape to Gentleman 2026](https://www.apetogentleman.com/fashion-rules-men-should-break/)

### Inferences
- **Rule S1 "Brights go with neutrals, not with other brights" (already scored as C3).** Agreement: high; research support. Computable from color_family + saturation.
- **Rule S2 "Muted accent + bright accent" mixed saturation**, e.g. a sage overshirt with a bright orange beanie. No menswear source states it as a mistake; skip.
- **Rule S3 "Echo / sandwich" (advice or tiny credit).** Agreement: low-moderate, no empirical support found. Pass: navy knit + white chinos + navy suede sneakers. Signal: color_family match between the top/outerwear and the shoes or accessory, excluding white and black (or a white tee + white sneakers would trigger it trivially). Computable from color_family alone. Risk: rewards coincidence; recommend tip-only ("your shoes echo your jacket").
- **60-30-10:** needs garment area share (pixels per garment). Little menswear adoption beyond TheVOU; Kitted's accent count + focal-point allowance already approximates "one small accent". Don't build.

### Gaps
- No empirical study found on "colour echo" or proportion rules in clothing.

## 5. The near-match problem

### Takeaway
"Clearly different or genuinely identical, never nearly" is one of the most consistent rules across sources, and it has support in research (small lightness differences between colours reduce harmony). It covers dark-jacket/dark-trouser near-matches (already scored), denim-on-denim washes and suit separates. Two whites/creams near-matching is mentioned less often.

### Cited Findings
- Nathan Tailors (Aug 31, 2026): "The only reliable failure is trousers that are almost... the same shade as the jacket"; navy jacket with slightly different navy trousers "reads as a suit that has gone wrong"; the rule is clearly different or genuinely identical. — [Nathan Tailors](https://www.nathantailors.com/en/blog/what-trousers-to-wear-with-a-blazer)
- Mr Porter: avoid black suit trousers with a navy blazer (search summary). — [Mr Porter](https://www.mrporter.com/en-es/journal/fashion/you-asked-can-you-wear-black-and-navy-together-762234)
- Permanent Style on navy trousers as separates (Dec 2019, title only reviewed). — [Permanent Style, "Wearing navy trousers as separates"](https://www.permanentstyle.com/2019/12/wearing-navy-trousers-as-separates.html)
- Double denim (search summaries, 2024–2025 guides): unless wash and colour are an exact match, contrast them (light jeans + dark jacket or vice versa) rather than two similar-but-different blues; don't pair two light blues; for beginners, darker on the bottom and lighter on top or the reverse; white jeans + blue trucker also works. — [Fashion Magazine, all-over denim style panel](https://fashionmagazine.com/style/all-over-denim-style-panel/); [Harry Rosen, "How to pull off a Canadian tuxedo"](https://www.harryrosen.com/en/editorial/how-to-pull-off-a-canadian-tuxedo); [Opumo, "Double denim"](https://www.opumo.com/magazine/double-denim-how-to-wear/); [Mr Porter, "Double denim done right"](https://www.mrporter.com/en-ie/journal/fashion/double-denim-jeans-25228706)
- Research link: Ou & Luo: lightness differences under about 15 CIELAB units reduce harmony (search summary); O'Donovan: theme colours should not be too similar. — [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)

### Inferences
- **Rule N1 (exists): dark separate jacket + different dark trousers.** Keep.
- **Rule N2 "Denim near-match" (new, computable now).** Agreement: high among denim guides. Pass: denim_light jacket/shirt + denim_dark jeans (two steps apart); same wash both pieces (deliberate "Canadian tuxedo"); denim shirt + white/black/khaki trousers. Fail: denim_mid shirt + denim_mid or denim_dark jeans that look close but not the same; two light washes. Signal: denim_light/mid/dark on the top and bottom. Computable from existing color_family (adjacent wash = fire; same wash = ambiguous, see gap). Suggested weight like C5 (about −0.5).
- **Rule N3 "Same-family near-match on main pieces" (needs lightness).** E.g. charcoal knit + black trousers + black jacket is fine (tonal), but a navy overshirt + navy-ish chinos in a slightly different navy reads like a mismatch. From names alone: same name = treated as "match", so it can't fire. Needs either a model field like `matches_piece: same|near|different` or measured lightness. Lower priority.
- **Two whites (white tee + cream trousers):** sourcing is thin; don't score.

### Gaps
- Can't tell an exact denim match from a near-match using only color_family (both "denim_mid"); needs the model to judge "same fabric/wash" or a pixel comparison.
- No source found quantifying near-match thresholds for clothing specifically.

## 6. Empirical research on color harmony: what's measurable

### Takeaway
Across 15 years of lab and large-sample studies, the measurable predictors of liked/harmonious colour combinations are: similar hue, lower and similar saturation, clear (not tiny) lightness differences, lighter overall palettes, and few distinct hues (2–3). Classic colour-wheel templates (complementary, triadic, Matsuda) don't predict ratings. Models applied to apparel images predict human harmony ratings only moderately (r ≈ 0.5–0.65).

### Cited Findings
- Schloss & Palmer (2011): preference and harmony both rise with hue similarity; preference leans more on liking the individual colours and on lightness contrast; average harmony vs average preference r = +.79; hue similarity, low saturation and pair preference explain 82.4% of harmony ratings. Figure (accent) colours are preferred when they contrast with the ground in hue and lightness. — [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- O'Donovan & Agarwala (2011; 327k+ ratings): no evidence that hue templates predict compatible colours; preferred themes are neither monochromatic nor more than 2–3 hues; lightness features most predictive; dark themes rated poorly; colours shouldn't be too similar. — [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)
- Ou & Luo (2006): four factors (chromatic difference, lightness sum, lightness difference, hue effect); higher lightness = more harmonious; small lightness differences reduce harmony; blue most, red least harmonious (search-result summary only; the paper wasn't opened, and the link below confirms only that the model exists and was tested on apparel, not these details). — [Kuo et al. 2012, which tests the Ou model](https://www.scientific.net/AMR.627.524)
- Kuo, Wei, Lin & Lee (2012), 162 fashion apparel images (141 two-colour, 21 three-colour): the Ou model predicted visual harmony with r = 0.50 (two-colour) and 0.65 (three-colour), vs Szabó model 0.48 and 0.50. — [Kuo et al., Advanced Materials Research 627 (2012)](https://www.scientific.net/AMR.627.524)
- Fashion and Textiles (2025): a psychophysical experiment on clothing colour combinations found modern perceptions of colour harmony "differed significantly from previous theories"; the authors built a rule-based model over nine classic harmony theories plus perception-based ML models (reported 0.98–0.99 accuracy on their own data) (search summary; paper not opened). — [Fashion and Textiles, "Establishing colour harmony evaluation and recommendation model for clothing colour matching" (2025)](https://fashionandtextiles.springeropen.com/articles/10.1186/s40691-025-00433-y)
- O'Donovan & Agarwala on older theories: Munsell and Ostwald systems treat colours as harmonious if one dimension varies while others stay fixed (e.g. same hue and value, varying saturation). — [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf)

### Inferences
- What maps onto Kitted's photo-to-fields pipeline:
  - **Hue similarity / few hue families**: computable from color_family (family count is already used).
  - **Saturation**: already a field (muted/bright).
  - **Lightness differences**: not available; this is the single biggest missing signal and the one research and guides agree on most.
  - **Overall lightness ("dark themes rated poorly")**: conflicts with menswear practice (all-black/dark outfits are accepted and Kitted never penalises tonal/all-black). Don't use.
- The 0.98 accuracies of the 2025 paper are on its own dataset; treat them as unproven for Kitted's photos. The 2012 r = 0.50–0.65 numbers are the more sober benchmark for formula-based harmony scoring of real apparel.

### Gaps
- Could not open Ou & Luo (2006) or the 2025 Fashion and Textiles paper to verify formulas, thresholds or which classic theories failed.
- No study found on men's casual outfits specifically, or on raters aged 18–30.

## 7. Can a vision model or pixel sampling read garment lightness and hue reliably from a phone photo?

### Takeaway
Coarse colour names on prototypical colours are reliable; fine shades, lightness modifiers and colour under unusual lighting are not. Absolute pixel colour from a phone varies by about 4–10 ΔE with lighting, the same size as the ~15-unit "too close" threshold, so absolute measured colour shouldn't drive a score. Relative judgements within one photo (which piece is lighter, same light source) are the more robust signal.

### Cited Findings
- "Color Names in Vision-Language Models" (arXiv 2509.22524, Sep 26, 2025; five VLMs): high accuracy (94–98%) on prototypical colours, dropping to 70–83% on the full 330-chip Munsell set; hue is "the primary driver" of colour naming, and some models rarely use lightness modifiers (search summary + abstract). — [arXiv 2509.22524](https://arxiv.org/abs/2509.22524)
- "Probing Perceptual Constancy in Large Vision Language Models" (arXiv 2502.10273, Feb 14, 2025; 33 VLMs): models do worst on colour constancy (the true colour of an object under different light); accuracy clusters around 40–50% and 70–80%; humans beat all models; bigger models do better. — [arXiv 2502.10273](https://arxiv.org/html/2502.10273v1)
- Smartphone colorimetry (Sensors, Jun 2023 and related, search summary): sensor repeatability is high (ΔE < 0.5), but lighting and viewing angle add large bias (up to 64% more ΔE at oblique angles); external factors cause 4–10 ΔE variation; a reference card cuts device/lighting variation 65–70%. — [Smartphone-Enabled Colorimetry (PMC10304433)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10304433/); [Sensors 23:5559 PDF](https://mdpi-res.com/d_attachment/sensors/sensors-23-05559/article_deploy/sensors-23-05559.pdf)

### Inferences
- **Recommended new field (cheapest, most robust): `lightness` 1–5 per garment, read by the model**, with a prompt asking it to rank pieces against each other in the same photo (e.g. "relative to the other pieces"). It's a relative judgement under one light source, which avoids most of the constancy problem. Same-photo-same-score holds because readings are cached.
- **Pixel sampling (L\* from the garment mask)** could back up or replace the model field for lightness ordering (relative L\* between top and bottom in the same photo), but absolute thresholds (e.g. "ΔL < 15 = near-match") would misfire across warm indoor light, shade and phone tone mapping. Use it only for ordering, not thresholds, if at all.
- **Don't use measured hue** for warm/cool or harmony; colour names are good enough for the rules worth scoring.
- Validate on the gold set: check that the model's lightness ranking matches human ranking for top vs bottom in ≥90% of photos before scoring any lightness rule (proposal, not sourced).

### Gaps
- No study found testing Gemini specifically on clothing colour or lightness under phone lighting.
- Could not open the PMC colorimetry article directly (redirect/404); figures come from search summaries.

## 8. Rule shortlist for Kitted (pulls the sections together)

### Takeaway
Most of the colour theory worth scoring is already in v3.1 (neutral base + one accent, bright clash, pattern rules, navy/black near-match). The real gaps are (a) lightness: separation between top and bottom, and tonal outfits with a value range; (b) denim wash near-matches. (b) can ship with today's fields; (a) needs one new field (lightness 1–5). Colour-wheel harmony, warm/cool and 60-30-10 shouldn't become score rules.

### Cited Findings
- Accent/neutral consensus: [Outfit Narrative](http://www.outfitnarrative.com/menswear/menswear-basics/simple-color-rules-for-casual-outfits); [TheVOU](https://thevou.com/blog/three-colour-rule-style-guide-men/); [Effortless Gent](https://effortlessgent.com/clothing-color-combos/)
- Lightness separation: [Effortless Gent](https://effortlessgent.com/clothing-color-combos/); [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf); [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- Near-match: [Nathan Tailors 2026](https://www.nathantailors.com/en/blog/what-trousers-to-wear-with-a-blazer); [Fashion Magazine](https://fashionmagazine.com/style/all-over-denim-style-panel/)
- Templates don't predict harmony: [O'Donovan & Agarwala 2011](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf); [Schloss & Palmer 2011](https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf)
- Old clash rules retired: [Ape to Gentleman 2026](https://www.apetogentleman.com/fashion-rules-men-should-break/)

### Inferences
| Rule | Plain words | Agreement | Pass / fail | Signal | Fields today? | Recommendation |
|---|---|---|---|---|---|---|
| H1 one accent | Neutral base, at most one standout colour | Very high + research | Navy/grey/white + rust beanie / red tee + green chinos + yellow shoes | family, saturation | Yes | Keep (exists) |
| S1 bright clash | Two brights on main pieces fight | High + research | One bright + neutrals / orange top + purple trousers | family, saturation | Yes | Keep (exists) |
| N1 dark near-match | Dark blazer with different dark trousers | High | Navy blazer + grey / navy blazer + black trousers | family, subcategory | Yes | Keep (exists) |
| **N2 denim near-match** | Denim on denim: same wash or clearly different | High (denim guides) | Light jacket + dark jeans / mid shirt + mid-dark jeans | denim_light/mid/dark on top + bottom | **Yes** | **Add, about −0.5**; leave exact-same-wash alone |
| **V1 top/bottom separation** | Different colours need different lightness | Moderate-high + research | White tee + navy chinos / mid-grey tee + mid-blue-grey chinos | lightness per garment | **No: needs `lightness` 1–5** | Add as small mistake (≈ −0.3) or tip; never on same-family tonal |
| H3 tonal with range | Tonal works with light, mid and dark pieces | Moderate + research (hue similarity) | Cream + tan + brown / beige + beige + beige | family + lightness spread | Partly | Tip today; optional +0.25 credit once lightness exists (taste call) |
| V2 shoe anchor | Shoes contrast or match trousers, not nearly | Low (sources conflict) | — | lightness | No | Advice only |
| S3 echo | Repeat a colour top and shoes | Low-moderate, no research | Navy knit + white chinos + navy sneakers | family | Yes | Tip only (exclude white/black) |
| T1 warm/cool | Warm accent on cool base | Low (one source) + mild research | Navy + tan / light grey trousers + rustic warm top | family → temperature | Yes | Advice only |
| H2 colour wheel | Complementary/triad schemes | Taught, not supported | — | hue | — | Don't score |
| 60-30-10 | Area proportions | Low, borrowed from interiors | — | garment area | No | Don't build |
| Clash taboos | Navy + black, brown + black, belt ≠ shoes | Retired in 2026 sources | — | — | — | Don't score |
| Excluded | Skin-tone, hair/skin "personal contrast", seasonal analysis | — | — | — | — | Out of scope by hard rule |

### Gaps
- Weights are proposals scaled to existing rules, not calibrated; they need checking against the gold set and human ratings.
- None of the guides were tested on real users; agreement levels reflect how many independent expert sources repeat a rule, not measured outcomes.
