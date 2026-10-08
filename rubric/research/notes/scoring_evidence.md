# Scoring evidence: what predicts outfit ratings, how competitors score, and what a VLM can read reliably

Researched Oct 7, 2026. Scope: academic/industry work on outfit aesthetics, human rating agreement, VLM fashion-attribute reliability, competing fit-rating apps, deterministic vs. model-judged scoring. Reddit skipped per instructions. Note: several sources are company blogs that rank their own app first; flagged inline.

## 1. What features predict human outfit ratings (academic and industry research)

### Takeaway
Large-scale "fashionability" studies built on likes/votes mostly measure social reach and the wearer's looks, not the clothes. The garment-level signals with real evidence behind them are fit and cut (shape) and color relationships between pieces. Color alone predicts outfit compatibility about as well as full image features. Small changes in fit visibly shift how people judge a man. No study isolates "proportions" or "personal style type" as rating drivers for menswear.

### Cited Findings
- **Simo-Serra et al., "Neuroaesthetics in Fashion", CVPR 2015.** 144,169 posts from chictopia.com (only 5% male). "Fashionability" is log-normalized votes binned 1–10. The best model (deep net) reached only 30.4% accuracy on the 10-class task, against a 16.3% majority-class baseline. — [CVF open access](https://openaccess.thecvf.com/content_cvpr_2015/html/Simo-Serra_Neuroaesthetics_in_Fashion_2015_CVPR_paper.html); [PDF](https://www.cs.utoronto.ca/~fidler/papers/fashionCVPR15.pdf)
  - Per-feature analysis (Table 7, logistic regression): the strongest single features were Comments (19.7%) and Fans (18.9%), which are social signals. Garment tags alone scored 16.2% and colour tags 15.9%, both at or below the 16.3% baseline. The authors note features were weak individually but complementary. — same PDF
  - Younger and more "beautiful" users (face-attribute estimates) were rated more fashionable, and users from richer countries scored higher. — same PDF
  - Their model suggests changing scenery as well as garments, so vote-based "fashionability" mixes photo setting with clothing. — same PDF
- **Fashion++ (Hsiao, Katsman, Wu, Parikh, Grauman), ICCV 2019.** The model splits each garment into shape (fit, cut, how it's worn, e.g. rolled sleeves or baggier pants) and texture (color, pattern, material), and proposes minimal edits. — [arXiv 1904.09261](https://arxiv.org/abs/1904.09261); [project page](https://vision.cs.utexas.edu/projects/FashionPlus/)
  - MTurk study: 100 unfashionable outfits, 7 judges each, 282 workers. With the largest edits, 92% of changed outfits were judged more fashionable. No single edit size dominated: the top choice, K=2, was preferred only 18% of the time. 72% of edits were judged "actionable" (clarity 4.16/5). Applied to already-fashionable outfits, 84% stayed similar or better. — [arXiv PDF](https://arxiv.org/pdf/1904.09261)
  - "Fashionability" here is learned from popular web photos (Chictopia), i.e. trend-defined. — same
- **Color alone (Zhang et al., "Learning Color Compatibility in Fashion Outfits", arXiv Jul 2020).** A color-palette-only graph model reached compatibility performance "comparable to previous methods that use deep image features" (Polyvore-style compatibility). — [arXiv 2007.02388](https://arxiv.org/abs/2007.02388)
- **Color harmony rules applied to clothing (Journal *Fashion and Textiles*, 2025).** Rule-based models of 9 classical harmony theories, plus perception-based ML models. Reported findings: same-hue or same-chroma combinations read as harmonious; slight brightness (lightness) variations can reduce harmony; higher lightness correlates with more harmony. (Full text was paywalled; this comes from the search abstract.) — [Springer, s40691-025-00433-y](https://link.springer.com/article/10.1186/s40691-025-00433-y)
- **Human hue-pair preference (arXiv Aug 2025, "Harmonious Color Pairings").** Controlled HSL palettes. Preferences are strongly hue-dependent, which challenges classical color-wheel harmony rules (complementary, triadic). — [arXiv 2508.15777](https://arxiv.org/html/2508.15777)
- **Fit changes perception (menswear, faces pixelated).** 274 participants saw a man in a bespoke vs. an off-the-peg suit (same color and fabric) for 3–5 seconds. The tailored suit was rated more confident, successful, flexible and higher-earning. Trustworthiness did not differ significantly in one account. (Secondary coverage; original is Howlett et al., *J. Fashion Marketing & Management* 2013.) — [Emerald abstract](https://www.emeraldinsight.com/doi/abs/10.1108/13612021311305128); [Irish Times coverage](https://www.irishtimes.com/life-and-style/people/why-you-should-never-judge-a-man-in-an-ill-fitting-cardigan-1.2798690)
- **Hester & Hehman, "Dress is a Fundamental Component of Person Perception", *PSPR* 27(4), 2023.** Perceivers use dress for four inference types: social categories, cognitive states, status and aesthetics. It is a theory review, not a ranking of features. — [PMC10559650](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10559650/)
- **Proportions (body, not clothes).** In a 27-nation study of 3,103 people, male silhouettes with short or excessively long legs were rated less attractive. The optimum depends on image format: slightly below average in silhouettes, about +0.5 SD in detailed CG figures. This is body leg-to-body ratio, not clothing-created proportion. — [PMC5666244](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5666244/)
- **AesRec (Ye et al., arXiv Feb 3, 2026).** Scores outfits on item-level dimensions (silhouette, chromaticity, materiality, craftsmanship, wearability, impression) plus outfit-level ones (stylistic synergy, visual harmony, outfit impression), using Qwen-VL-Max on a 1.0–10.0 scale. Across 27,694 outfits, scores clustered at 8.0–8.5, a sign of compression. The paper does not report which dimensions predict human ratings. — [arXiv 2602.03416](https://arxiv.org/html/2602.03416v1)

### Inferences
- Rating datasets built on likes reward the wearer's attractiveness, age, follower count and scenery. Kitted's rule against rating faces and bodies means it deliberately leaves out signals that "popularity" models lean on. That is the right call, but it also means public fashionability benchmarks are poor calibration targets for Kitted.
- The garment-level evidence supports Kitted's existing emphasis on fit/volume, hem/break and sleeve end (shape) and on color relationships. It supports adding a **lightness/value contrast** signal more than an exact-hue color-wheel signal: the hue-preference study undercuts classical wheel rules, and the 2025 clothing study found lightness matters.
- Fashion++'s shape/texture split matches how fixes feel to users: change the fit or how it's worn, or change the color/pattern. Both produce "actionable" edits.
- None of the academic sources validates "personal style type" labels as a driver of rating. Style labels show up in recommender research and in competitor UX, not as predictors of quality.

### Gaps
- No menswear-specific study ranking fit vs. color vs. coherence vs. proportion as predictors of rating was found.
- No study tests "clothing proportion rules" (e.g. thirds, top length vs. leg line, rise) against human ratings.
- The 2025 Springer color-harmony paper's effect sizes are unknown (paywalled).
- IQON and iFashion are mostly recommender/compatibility datasets (co-occurrence, clicks), not quality ratings. Their feature-importance findings were not pursued in detail.

## 2. Human agreement on outfit ratings (inter-rater reliability)

### Takeaway
People agree moderately to well on *rankings* when many raters are pooled: split-half Spearman ρ of about 0.72–0.82 in the best-controlled study (ZOZO 2024). Individual taste varies a lot, and absolute scores compress at the top. A score is only defensible as an aggregate or a rule-based judgment, not as "what one expert would say."

### Cited Findings
- **ZOZO Research (Hirakawa et al.), "An Empirical Analysis of GPT-4V's Performance on Fashion Aesthetic Evaluation", SIGGRAPH Asia Technical Communications, Dec 2024 (arXiv Oct 31, 2024).** — [arXiv 2410.23730](https://arxiv.org/pdf/2410.23730)
  - Pairwise "which suits her better" judgments on snapshots of 3 women from the WEAR app, aggregated with OpenSkill. Sbj-3 used 765 female annotators in their 30s on 999 images.
  - Split-half inter-rater Spearman ρ was 0.716, 0.815 and 0.715 for the three subjects; 0.711–0.791 on the sbj-3 subsets.
  - Popularity proxies (views, likes, likes/view) correlated poorly with the human rankings: ρ from −0.36 to 0.27.
  - Biased sample: Japanese women's fashion only, raters all women in their 30s.
- **Polyvore fill-in-the-blank.** Failure cases include cases where more than one candidate seems right, which the authors call evidence of task subjectivity. — [OutfitTransformer, arXiv 2204.04812](https://arxiv.org/pdf/2204.04812)
- **AesRec (2026).** On 100 outfits, VLM scores vs. 3 expert annotators gave Pearson r 0.812 (Qwen-VL-Max) and 0.793 (Gemini-3-pro), with MAE about 0.63–0.69 on a 10-point scale. Only 3 experts, 100 samples. — [arXiv 2602.03416](https://arxiv.org/html/2602.03416v1)
- **Fashion++ (2019).** When judges picked the "best balance" edit, no option exceeded 18% preference, which shows wide individual variation. — [arXiv 1904.09261](https://arxiv.org/pdf/1904.09261)

### Inferences
- A 10-point scale reported in half steps implies more precision than human consensus supports. AesRec's expert-vs-model MAE of about 0.65 suggests that even good agreement means ±0.5–1 point. Kitted's half-point rounding is about at the limit of what agreement supports; finer granularity would be false precision.
- Calibration should use pooled raters and **rank correlation** (does the code order photos the way a panel does?) rather than exact-score match. The ZOZO method (pairwise comparisons, then OpenSkill/TrueSkill, then a split-half ρ ceiling) is a ready template for the planned gold set (~80 photos, 3+ friends). With only 3–5 raters, expect a noisy ceiling.
- Likes and views are not valid proxies for quality. Don't calibrate against TikTok/IG engagement.

### Gaps
- No inter-rater study specific to menswear or to US men aged 18–30 was found.
- No published ICC or kappa for absolute 1–10 outfit scores (as opposed to rankings) was found.

## 3. VLM reliability on the needed garment attributes (and the candidate new attributes)

### Takeaway
Current VLMs, Gemini Flash included, are good at garment category and coarse shape (sleeve length, garment type), moderate at broad color names, and poor at exact shade/hex, color proportions, fabric/material, and saying "not visible." Ranked by reliability: category > coarse shape/length > broad color family > pattern > fabric/texture > exact hue/values > fine fit measurements. Kitted's own Oct 6 tests show high *repeatability* (90%+ per field, 92–100% score consistency), but repeatability is not accuracy against ground truth.

### Cited Findings
- **Gemini 2.5 Flash / GPT-5 on DeepFashion-MultiModal (arXiv Jan 22, 2026; WACV 2026 Workshops).** 5,000 images, 18 attributes, 9 VLMs. — [arXiv 2601.15711](https://arxiv.org/html/2601.15711); [CSDL](https://www.computer.org/csdl/proceedings-article/wacvw/2026/914900b565/2iG0EYHUtJS)
  - Zero-shot VLMs reach 64.0% macro-F1 overall.
  - Difficulty runs shape >> pattern >> fabric; fabric is hardest (upper_fabric 46.9% even for the top model).
  - "False visibility" is the main failure mode: predicting an attribute that isn't visible. NA-detection F1 was 34.1% on average and 22.0% for Gemini 2.5 Flash, the worst of the flagship/efficient tiers. Gemini 2.5 Flash had the best classification when the attribute was visible (Tier-3 F1 70.8%).
  - Efficient models get over 90% of flagship performance.
- **GPT-4o-mini vs. Gemini 2.0 Flash on DeepFashion-MultiModal (Shukla & Sonalkar, arXiv Jul 30, 2025).** 1,000 images at temperature 0. — [arXiv 2507.09950](https://arxiv.org/html/2507.09950v2)
  - Macro-F1: Gemini 56.8%, GPT-4o-mini 43.3%.
  - Best attributes: hat (~70%), sleeve length (58.5–61.7%), wrist wear.
  - Worst: neckline (15–48%), waist accessories (26–32%).
  - Conclusion: not yet a replacement for fine-tuned systems.
- **Fashion Florence (Berlia, arXiv May 11, 2026).** On 461 iMaterialist held-out images, Gemini 2.5 Flash reached 87.4% category accuracy and style-tag F1 0.612; GPT-4o-mini scored 89.3% category and 43.3% material. A fine-tuned 0.77B model got 63.0% material. Material is the hardest field. — [arXiv 2605.09827](https://arxiv.org/abs/2605.09827)
- **ColorBench (NeurIPS 2025 Datasets & Benchmarks).** Not fashion-specific. — [arXiv 2504.10514](https://arxiv.org/html/2504.10514v3); [NeurIPS](https://proceedings.nips.cc/paper_files/paper/2025/hash/d34497330b1fd6530f7afd86d0df9f76-Abstract-Datasets_and_Benchmarks_Track.html)
  - Gemini-2-flash: color recognition 80.3%, color *extraction* (exact values) 52.1%, color proportion 46.9%, robustness to color transformations 70.7%.
  - GPT-4o: 76.3%, 40.6%, 38.3% and 46.2% respectively.
  - Color proportion is near chance for top models, color counting tops out at 43.1%, humans beat all models, and chain-of-thought helps.
- **FG-BMK (arXiv v3, Apr 2026; ICLR 2026).** Across attribute types, only a few attributes exceed 70% accuracy and some are about 10%. Shape was the weakest category for InternVL3 (31%), with color 47%, length 71%, pattern 50%. These numbers are on **birds (CUB-200), not clothing**, so they are directional only. — [arXiv 2504.14988](https://arxiv.org/html/2504.14988v3)
- **Fit/measurements.** Google/UW's FIT paper (Apr 9, 2026) found that VLM-predicted garment measurements from real photos were "insufficient for learning accurate fit." Their VLM-measurement variant got size-aware IoU 0.844 vs. 0.955 with true measurements. — [arXiv 2604.08526](https://arxiv.org/html/2604.08526v1)
- **ChatGarment (arXiv Dec 2024).** Notes that LLMs struggle to predict continuous, precise numeric values such as garment length without special training. — [arXiv 2412.17811](https://arxiv.org/html/2412.17811)
- **Skin-tone / seasonal color analysis from photos.** A retailer test (conflict of interest: it sells color analysis) reports that Style DNA and ChatGPT both classed a warm-autumn subject as "Summer," even under daylight-mimicking studio light. — [Kettlewell Colours](https://kettlewellcolours.com/blogs/the-colour-blog/does-ai-colour-analysis-work)
- **App Store complaint about color misreads.** A "Rate My Outfit" reviewer said navy shorts were identified as black (review dated Feb 21; the app has 13 ratings). — [App Store reviews](https://apps.apple.com/us/app/rate-my-outfit/id6470764044?see-all=reviews&platform=iphone)
- **Kitted's own extraction test (Oct 6, 2026).** gemini-3.8-flash, thinking off:
  - Score consistency 92–100% across runs on 40 stock photos and 12 mirror selfies.
  - "Every garment detail agreed 90%+ across runs."
  - Fix detection 67–83% on 6 pairs (sleeve "above wrist" flipped between runs).
  - This measures repeatability, not correctness vs. labels. — `extraction-test/results/INDEX.md` (local)

### Candidate attribute reliability (inferences from the above; not directly benchmarked unless noted)

| Candidate attribute | Expected VLM reliability from a phone photo | Basis |
|---|---|---|
| Garment lightness/value (light / mid / dark per piece) | **Likely high** if kept to 3 coarse buckets; contrast between top and bottom is a relative judgment within one image, so it survives lighting shifts better | ColorBench: recognition ~80% vs. extraction ~52%; coarse beats exact |
| Exact hue / named shade (e.g. "olive" vs. "khaki") | **Low–moderate**; lighting and white-balance sensitive; navy/black confusion is documented | ColorBench extraction 40–52%; App Store review; Kettlewell test |
| Color harmony (computed) | Don't ask the VLM; **compute in code** from per-garment color family + lightness + muted/bright | Color-only models match deep features (Zhang 2020); VLM color proportion near chance |
| Silhouette shape (e.g. slim top + wide bottom) | **Moderate–high** if derived in code from existing per-garment volume 1–5 + leg shape | Shape is the strongest attribute group in the DeepFashion VLM benchmark |
| Rise (low/mid/high) | **Low** when the top is untucked (waistband hidden); a high false-visibility risk | NA detection F1 22% for Gemini 2.5 Flash |
| Jacket/top length vs. hips | **Moderate**; it is a coarse length category like sleeve length (~60% F1); must allow "can't tell" | Sleeve length F1 58–62%; length 71% in FG-BMK (birds) |
| Texture/fabric (denim, knit, wool, linen) | **Low**; hardest attribute group across studies (~43–63%) | Fabric 46.9% top model; material 43–63% |
| Shoe bulk (sleek / standard / chunky) | Unknown; probably **moderate** as a 3-way shape call when shoes are fully visible; high risk of "not visible" errors on partial photos | Shape >> fabric; NA detection weak |
| Style label (minimal, streetwear, prep, etc.) | **Moderate** (style-tag F1 0.61 for Gemini 2.5 Flash), and labels are subjective and overlapping | Fashion Florence |

### Inferences
- Gemini Flash's weakest documented skill is "this attribute isn't visible." It is directly relevant to Kitted's partial-check rule (what isn't in the photo never costs points). Any new field (rise, shoe bulk, jacket length) needs an explicit `not_visible` option, and the code should treat low-confidence or hidden values as no-penalty.
- To keep "same photo, same score," new fields should be coarse ordinal buckets (3–5 levels), not exact values or hex codes. Color theory should be computed by code from the existing color family plus a new lightness bucket, never asked of the VLM as "do these colors harmonize?"
- Kitted's 90%+ run-to-run agreement does not show the readings are *right* (e.g. navy read as black every time would be consistent and wrong). The gold set needs truth labels per field, not just score labels.

### Gaps
- No benchmark measures VLM accuracy on worn men's casualwear phone photos specifically, or on rise, trouser break, tuck, shoe bulk, or lightness buckets.
- No Gemini 3.x-generation fashion-attribute benchmark was found. The newest are Gemini 2.5 Flash and Gemini-3-pro (AesRec scoring only).
- No study quantifies how mirror-selfie lighting or phone white balance shifts VLM color naming on clothing.

## 4. Competitor AI fit-rating apps (2025–2026): what they score and how they're received

### Takeaway
The "rate my outfit" category is crowded with small, recent apps. They score out of 10 or 100 with LLM-generated subscores (color harmony, fit, proportion/silhouette, cohesion, occasion, trend). Several bolt on style profiles, roast/persona modes and XP or streak mechanics. The big-funded players (Alta, Doji, Daydream, Gensmo) focus on closets, try-on and shopping, not scoring. Recurring criticisms: scores run high regardless of the outfit, opaque scoring, generic advice, color misreads, and paywalls. One app sells inconsistency as a feature (different personas give different scores).

### Cited Findings
- **Fashion Score: Outfit Rater** (released Jan 7, 2026). Rates fit, color coordination and style out of 10, with occasion modes (Casual, Date, School, Work), celebrity comparisons and a "Roast Mode." $4.99/mo or $29.99. One rating. — [App Store](https://apps.apple.com/us/app/fashion-score-outfit-rater/id6757362426)
- **Mirror: Rate My Outfit** (Avery Intelligence). Style Score 1–100 with cohesiveness, fit and style match; style profiles (Minimalist, Streetwear, Quiet Luxury, Gorpcore); color palette suggestions; daily rating tracking. $4.99/week (3-day trial) or $39.99/yr. One rating. — [App Store](https://apps.apple.com/us/app/mirror-rate-my-outfit/id6673901973)
- **Fit Score! AI Outfit Rating.** Score out of 10 across 6 style categories, with breakdowns for color harmony, silhouette balance, detail impact and first impression. XP/badges, style ranks, daily missions. Up to £5.99/week or £59.99/yr. — [App Store UK](https://apps.apple.com/gb/app/fit-score-ai-outfit-rating/id6758554007)
- **Looksee AI – Outfit Rater.** 11+ rater personas (The Roast, Fashion Editor, Hype Man…) and openly markets "same outfit, wildly different takes." 5.0 from 6 ratings. — [App Store](https://apps.apple.com/us/app/looksee-ai-outfit-rater/id6757265239)
- **Rate My Outfit** (iOS). Rates each piece and gives improvement paragraphs; 4.4 from 13 ratings. Complaints: forced payment (Mar 28, 2025) and a navy/black color misread. — [App Store reviews](https://apps.apple.com/us/app/rate-my-outfit/id6470764044?see-all=reviews&platform=iphone)
- **Outfit Rater AI** scores out of 10 "across multiple style dimensions" with tips. — [App Store](https://apps.apple.com/us/app/outfit-rater-ai/id6759444006)
- **Competitor-authored roundups (biased: each ranks its own app first):**
  - StylePal blog (Mar 13, 2026): OutfitScore (0–100 on color, coordination, proportion) "scores tend to run high regardless of the actual outfit"; FashionAdvice.ai scores color harmony, coordination, symmetry/proportion and trend; Rate My Outfit (Play) has opaque scoring; most apps rate a single photo in isolation. — [StylePal](https://www.stylepal.app/news/best-outfit-rating-app)
  - Beauty AI blog (Sep 3, 2026): Twirl scores occasion, fit, skin tone, color, trendiness, "spice level" and boldness; Fitcheck scores fit, proportion, cohesiveness, color and trend; Stylee scores fit, color and overall style. Common weakness: "generic fashion feedback" and no wardrobe memory. — [Beauty AI](https://beautyai.app/blog/best-outfit-rating-apps-2026)
  - A third vendor page notes a 94 "every single time tells you nothing." — [StylePal](https://www.stylepal.app/news/best-outfit-rating-app) (also surfaced in search; treat as marketing)
- **Alta Daily (closet + AI stylist):** 4.9 stars from about 16K ratings. It generates outfits by occasion and weather from your closet, with an avatar try-on, but no fit score. One reviewer said they had to do heavy lifting to match their own style. — [App Store](https://apps.apple.com/us/app/alta-daily-digital-ai-closet/id6481705400); [Style Within Grace review](https://stylewithingrace.com/alta-review-and-challenge-best-closet-app/)
- **Style DNA:** AI color analysis from face, skin, hair and eyes, plus body type. About 4.2/5 from 11K+ ratings, with heavy complaints about billing and generic or inaccurate analysis (aggregator summary). A retailer test found its season wrong. — [TechCrunch Jun 21, 2024](https://techcrunch.com/2024/06/21/style-dna-generative-ai-fashion-stylist-app); [Kettlewell](https://kettlewellcolours.com/blogs/the-colour-blog/does-ai-colour-analysis-work)
- **Gensmo** (Serendipity One): AI stylist and try-on with 500K+ registered users, 70%+ Gen Z / young millennial. Reviewers say it misses face and body type. Removed from Google Play Aug 11, 2026 (per AppBrain). — [WWD](https://wwd.com/business-news/technology/gensmo-feature-1238057347/); [AppBrain](https://www.appbrain.com/app/gensmo-your-ai-fashion-agent/one.srp.gensmo.app); [App Store reviews](https://apps.apple.com/us/app/gensmo-ai-stylist-try-on/id6636520663?see-all=reviews)
- **Doji:** avatar try-on, $14M seed (May 2025), no scoring. — [UrbanGeekz](https://urbangeekz.com/2025/05/doji-14m-ai-fashion-avatars/)
- **Daydream:** shopping discovery, now using Apple Intelligence on camera-roll outfits (Sep 14, 2026), no scoring. — [TechCrunch](https://techcrunch.com/2026/09/14/fashion-discovery-app-daydream-uses-apple-intelligence-to-help-you-shop-the-outfits-saved-in-your-camera-roll/)

### Inferences
- The common competitor subscores are color harmony, fit, proportion/silhouette, cohesion, occasion and trend. Kitted already covers fit, occasion and partly color. Adding proportion/silhouette and color-contrast reasons would match category expectations, but as *reasons inside the ledger*, not as separate LLM subscores.
- Kitted's real differentiation against this field is that scores are reproducible, explained ("Why 8.0" adds up) and not inflated. Competitors are criticized (even by rivals) for inflated, opaque, generic scores, and one markets randomness as entertainment.
- Style profiles (Minimalist, Streetwear, Quiet Luxury, Gorpcore) are common UX in competitor apps. No evidence was found that they improve score validity. They work better as "what you like" context (already captured in onboarding "Looks you like") than as a scoring input.
- Skin-tone/season color analysis is a documented accuracy and trust problem, and it conflicts with Kitted's "never rate skin" rule. Avoid it.

### Gaps
- Most scoring apps have 1–13 App Store ratings, so there is little review evidence on consistency. No large-sample review corpus mentioning "different score for the same photo" was found. Acloset, Whering, Indyx, Klozu, Clovio and StyleCloset were not reviewed in depth; available evidence suggests they are closet/outfit-planning apps without a fit score.
- No competitor discloses its scoring method (all appear to be end-to-end LLM judgments; this is inference, not confirmed).

## 5. Deterministic rules vs. end-to-end model judgment for consistency

### Takeaway
End-to-end VLM judges of fashion are measurably unstable. In ZOZO's GPT-4o study, simply swapping image order changed the verdict in 57–74% of pairs. LLM-judge research finds temperature 0 is not enough for repeatability. Decomposing the judgment into per-criterion reads with explicit code aggregation is the documented remedy, which is Kitted's current architecture.

### Cited Findings
- **ZOZO 2024, position bias.** GPT-4o (gpt-4o-2024-05-13, temperature 0) changed its pairwise fashion verdict when the image order was swapped. "Conflict rates" were 0.716, 0.573, 0.741 and 0.658 (plus 0.578) across datasets. Accuracy on the order-consistent subset rose substantially (up to about 0.85). — [arXiv 2410.23730](https://arxiv.org/pdf/2410.23730)
  - GPT-4o's ranking correlation with humans was ρ 0.12–0.52 against a human ceiling of 0.71–0.82. It struggled most on a dataset of outfits in similar colors (ρ 0.117). — same
- **Temperature 0 isn't deterministic.** Flip rates at t=0 were 2.8% (GPT-4o-mini) and 7.9% (GPT-4.1-mini); one question flipped 50% of the time. This is attributed to API-level nondeterminism (batching, floating point). — [ResearchGate: "Same Input, Different Scores"](https://www.researchgate.net/publication/401599267_Same_Input_Different_Scores_A_Multi_Model_Study_on_the_Inconsistency_of_LLM_Judge); [MLflow article](https://mlflow.org/articles/judge-consistency-llm/)
- **Holistic vs. decomposed scoring.** Holistic scores into a single number "limit reproducibility" and hide the reasoning. Decomposing into per-criterion verdicts with explicit aggregation improves repeatability; form-filling structure helps. A caveat: holistic judges with detailed rubrics can beat atomic judges on completeness. — [arXiv 2606.08625](https://arxiv.org/html/2606.08625v2); [autorubric best-practices report](https://github.com/delip/autorubric/blob/main/llm_judge_rubrics_best_practices_report.md)
- **Kitted's own data.** Code-judged scoring on Gemini readings gave 92–100% score consistency across 3–5 runs (Oct 6, 2026). The residual flips trace to single field reads (e.g. barefoot m10: 9.5/8.5/8.5; sleeve "above wrist"). — `extraction-test/results/INDEX.md` (local)

### Inferences
- "The AI sees, the code judges" is consistent with the best available evidence. Every new attribute adds a new chance for a field to flip, so new fields should be added only when (a) the VLM can read them at high repeatability, (b) they change the score for many outfits, and (c) a hidden/uncertain value defaults to no penalty.
- Asking the VLM for any comparative or aesthetic verdict ("do these colors go together?", "which style is this?") imports the order and holistic-judgment instability documented above. Keep those judgments in code, derived from coarse per-garment fields.
- The completeness caveat argues for keeping a small set of outfit-level code rules (e.g. a contrast/cohesion rule computed from all garments) rather than only per-garment penalties.

### Gaps
- No published head-to-head of "VLM extracts attributes + rules score" vs. "VLM scores directly" on outfit ratings specifically was found. The evidence comes from general LLM-judge literature plus Kitted's own tests.
