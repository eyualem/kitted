# Waistline from the body: desk research (Oct 14, 2026)

For the "waistline and proportions from the body" chat (CLAUDE.md, "Next steps"). The body here is **only a ruler** for placing garment edges. It is never scored, shown or stored.

**How this was read.** Open web only; the LibKey connector isn't in this session.
- **Read in full:**
  - the ANSUR II summary report (text extracted from the PDF);
  - Needham et al. 2021 (PMC full text);
  - the COCO keypoint-evaluation page and its source code;
  - the Fashionpedia ECCV paper (text extracted);
  - the Fashionpedia val annotation file already in `inputs/fashionpedia/raw/`;
  - Proper Cloth, The Modest Man, Real Men Real Style (2 pages), Black Lapel;
  - the Almeida et al. 2025 abstract;
  - the KAKEN grant record.
- **Abstract or search snippet only:** Krishnan et al. 2005, Sorokowski & Pawlowski 2008, Kwon et al. 2012, Permanent Style (the site blocked our fetch), Drillis & Contini 1966 (the original report wasn't found online).
- **Not sourced:** anything marked "our calculation" is our own pinhole-camera arithmetic, not a published figure.

---

## 1. Anatomical landmarks from pose joints

### 1a. ANSUR II men (US Army 2012, n = 4,082, ages 17–58)
Source: [Gordon et al., ANSUR II Methods and Summary Statistics, NATICK/TR-15/007 (PDF via Penn State OpenLab)](http://tools.openlab.psu.edu/publicData/ANSURII-TR15-007.pdf). Report page numbers in brackets. The landmark definitions are on pp. 21–25: omphalion is the level of the navel's center; trochanterion is the top of the greater trochanter; iliocristale is the highest point of the iliac crest.

| Height above floor (men) | Mean ± SD, cm | ÷ stature |
|---|---|---|
| Stature [194] | 175.62 ± 6.86 | 1.000 |
| Acromial (shoulder tip) [48] | 144.07 ± 6.33 | 0.820 |
| Tenth rib [198] | 112.07 ± 5.36 | 0.638 |
| Iliocristale (top of hip bone) [148] | 106.16 ± 5.20 | 0.604 |
| Waist height, omphalion (navel) [224] | 105.65 ± 5.22 | 0.602 |
| Trochanterion [210] | 90.09 ± 4.92 | 0.513 |
| Buttock height [80] | 88.79 ± 4.99 | 0.506 |
| Crotch height [98] | 84.59 ± 4.65 | 0.482 |
| Lateral femoral epicondyle (knee) [160] | 49.17 ± 2.66 | 0.280 |
| Tibiale (knee) [206] | 46.82 ± 2.66 | 0.267 |
| Lateral malleolus (ankle) [162] | 7.29 ± 0.57 | 0.042 |

**Per-person spread of the gaps**, which is what a ruler needs. These are ANSUR II derived dimensions, so each SD is across people, not a difference of means:
- **Tenth rib to iliac crest** ("abdominal link"): 5.90 ± 1.71 cm [234].
- **Iliac crest to trochanterion** ("pelvic link"): 16.07 ± 2.23 cm [276].
- **Navel to crotch** ("rise"): 21.06 ± 2.13 cm [278].
- **Acromion to navel:** 38.43 ± 2.85 cm [280].
- **Trochanterion to knee epicondyle** ("thigh link"): 40.93 ± 2.84 cm [290].
- **Waist depth:** 23.78 ± 3.47 cm [220].

**Not in ANSUR II:** "waist height, natural indentation". It was measured in the 1988 ANSUR (measure 118, defined as the natural indentation of the right waist; [1988 summary report p. 44](http://tools.openlab.psu.edu/publicData/ANSUR-TR89-027.pdf)). That scanned report holds only the descriptions, though, so its mean is **unverified**. As a stand-in we use the WHO-style waist, midway between the lowest rib and the iliac crest: about 109.1 cm (tenth rib and iliocristale averaged).

**Drillis & Contini 1966** (the fractions reproduced in Winter's textbook): hip 0.530 H, knee 0.285 H, shoulder 0.818 H, ankle 0.039 H. These are **unverified**: we found no primary copy. ANSUR II agrees closely (0.513 / 0.280 / 0.820 / 0.042 above). A 2025 validation abstract notes the model's authors allow deviations of up to 2 cm per segment ([Almeida et al. 2025](https://cnb2025.tecnico.ulisboa.pt/prog_cnb2025_web/abstracts_cnb225/ID_387_794_Resumo%20CNB2025%20-%20Drillis%20%20Contini_Final.pdf)). ANSUR II is the better ruler because it gives per-person spreads.

### 1b. From the trochanter to the hip joint center, and then to the pose "hip"
- **Trochanter to joint center:** the tip of the greater trochanter sits on average about 8 mm above the femoral head center (100 pelvic X-rays; [Krishnan et al. 2005, abstract](https://boneandjoint.org.uk/Article/10.1302/0301-620X.87BSUPP_III.0870354a)). So we take the hip joint center (HJC) as about 89.3 cm.
- **Knee joint center:** taken as halfway between the epicondyle and tibiale heights, about 48.0 cm (our assumption).
- **Pose models put the hip lower than the true joint.** OpenPose and AlphaPose placed the hip about 29–36 mm from the motion-capture joint center (DeepLabCut 43–53 mm). The direction was more lateral and inferior, with a random SD of 9–14 mm. The knee came out about 20–30 mm low. ([Needham et al. 2021, Sci Rep, Table 1 and Discussion](https://pmc.ncbi.nlm.nih.gov/articles/PMC8526586/).) The authors blame mislabelled hips in training sets. Note this was lab video from many cameras with tight clothing, so a single phone photo of a clothed person will do worse.
- **People disagree most about hips.** COCO measured how far annotators' clicks spread on 5,000 images labelled more than once. The spread, relative to √(person area), was 0.107 for hips, 0.079 for shoulders, 0.087 for knees and 0.025 for eyes ([COCO keypoint evaluation](https://raw.githubusercontent.com/cocodataset/cocodataset.github.io/master/dataset/keypoints-eval.htm); [cocoeval.py](https://raw.githubusercontent.com/cocodataset/cocoapi/master/PythonAPI/pycocotools/cocoeval.py)). So the hip is the least certain body keypoint, about 35% worse than the shoulder.
  - For a full-length standing man, √(area) is roughly 0.7 m (our assumption). That puts the hip spread at about 7 cm in 2D, or about 5 cm vertically.
  - That is probably an upper bound, because COCO is dominated by small, low-resolution people.
- **Apple's definitions:** Vision's `root` is the point between the hips. Apple doesn't say what anatomical point `leftHip`/`rightHip` stand for (**unverified**; we read only the docs' title page). We found no published accuracy test of Vision's hip or knee against motion capture.
- **Shoulders:** a pose model's "shoulder" sits nearer the shoulder joint than the acromion tip (**unverified**). In a mirror selfie, the raised arm lifts that shoulder (direction from anatomy; no figure found). So shoulder-based rulers are weak for selfies.

### 1c. Where the waist lands on a joint ruler
Our calculation from the ANSUR II means. **u** = position along hip joint → knee: u = 0 at the hip joint, u = 1 at the knee, and negative means above the hip joint. Thigh segment = 41.3 cm; hip joint to acromion = 54.8 cm.

| Landmark | cm above hip joint | u (thigh lengths) | Fraction of hip→shoulder | Person-to-person SD, cm |
|---|---|---|---|---|
| Tenth rib | +22.8 | −0.55 | 0.42 | ~2.6 (est.) |
| WHO waist (rib to crest midpoint) | +19.8 | −0.48 | 0.36 | ~2.4 (est.) |
| Iliac crest | +16.9 | −0.41 | 0.31 | 2.2 (published pelvic link) |
| Navel (omphalion) | +16.4 | −0.40 | 0.30 | ~2.2 (est.) |
| Buttock point | −0.5 | +0.01 | −0.01 | – |
| Crotch | −4.7 | +0.11 | −0.09 | ~1.5 (est.) |

- **In plain terms:** the navel and the top of the hip bone sit about **0.40 ± 0.06 thigh-lengths** above the hip joint, or **0.30 ± 0.04 torso-lengths**. The natural waist sits about **0.48 ± 0.06 thigh-lengths** above it.
- **The crotch** sits about **0.11 ± 0.04 thigh-lengths** below the hip joint.
- **How the SDs were estimated:**
  - They assume the gap and the thigh length vary independently.
  - The navel's SD borrows the pelvic link's correlation.
  - The crotch's SD assumes r ≈ 0.95 between crotch and trochanter heights. The person-level CSV would settle these exactly; we didn't download it.
- **Navel and hip bone are at the same height** on average (105.7 vs 106.2 cm). So in men, "at the navel" and "at the hip bones" are nearly the same line.
- **Garment rise isn't body rise.** The 10–12 in "rise" that style guides quote is measured along the trouser seam, a surface length. It can't be compared with the 21 cm vertical body rise above.

## 2. The visual waistline in menswear

- **Untucked shirt, front:** the hem should end about halfway down the fly. **Back:** about the middle of the seat. The sides curve up about 2 in from center. ([Proper Cloth](https://propercloth.com/reference/how-long-should-the-shirt-length-be/))
- **T-shirt:** the hem ends about 2 in below the waistband or belt, "right around mid-fly". Reaching the bottom of the fly is too long and makes you look shorter; stopping above mid-fly is too short. ([The Modest Man](https://www.themodestman.com/t-shirt-fit-guide/))
- **Real Men Real Style:**
  - **Length:** an untucked shirt must reach at least the belt and should land around mid-fly. If it reaches the crotch, it's too long; tuck any hem that goes past the fly. ([tucking rules](https://www.realmenrealstyle.com/rules-tucking-shirt/))
  - **For a long torso:** wear high-rise trousers (10–12 in, at the natural waist) with the shirt tucked, and jackets ending at or just above the hip. Low rise makes the torso look longer and the legs shorter. ([long torso, short legs](https://www.realmenrealstyle.com/long-torso-short-legs/))
- **Tailored jackets:** cover at least ¾ of the seat; the hem should reach the thumb's lower knuckle ([Black Lapel](https://blacklapel.com/blogs/the-compass/how-long-should-a-suit-jacket-be)). Permanent Style calls seat coverage the most basic check, and says a higher trouser waist lengthens the leg (search snippet only; [jackets](https://www.permanentstyle.com/2020/03/video-how-long-should-a-jacket-be.html), [rise](https://www.permanentstyle.com/2020/08/what-are-low-medium-and-high-rise-trousers.html)).
- **"Rule of thirds" (1:2 or 2:1):** a styling convention from blogs (e.g. [Ashlee Jaine](https://ashleejaine.substack.com/p/how-to-create-well-balanced-outfit), [A Well Styled Life](https://awellstyledlife.com/the-rule-of-thirds-for-outfits/)). They don't even agree on where the split is measured (belt, hem or shoulders). We found **no experiment** backing the 1:2 ratio or the golden ratio for outfits; treat both as weak evidence.
- **Research that does exist:**
  - **Tucking:** Morikawa's lab (Osaka) measured clothing illusions. Their talk title says tucking in makes the body look slimmer and the legs longer. The effect size isn't on the record we read ([KAKEN 18K03175](https://kaken.nii.ac.jp/grant/KAKENHI-PROJECT-18K03175)).
  - **Skirts:** a higher waistline increased perceived leg length and stature (women's high-waist skirts; [Kwon, Uh & Suh 2012](https://www.koreascience.or.kr/article/JAKO201222653561623.page), abstract).
  - **Leg length and attractiveness:** silhouettes with legs 5% longer than average were rated more attractive; longer than that hurt ([Sorokowski & Pawlowski 2008](https://stafforini.com/works/sorokowski-2008-adaptive-preferences-leg/), abstract). This is about bodies, so it can only justify "a higher visual waistline reads better". It must never become a body rule.
- **On the ruler (our mapping, assuming a mid-rise waistband near navel / hip-bone height, u ≈ −0.40):**
  - **At the belt:** about −0.40.
  - **Mid-fly** (about 5 cm lower): about −0.28.
  - **Bottom of the fly / too long:** about +0.05 to +0.11, near crotch level.
  - **Jacket covering the seat:** about +0.1 or lower.
  - **Caveat:** where the waistband actually sits depends on the trousers' rise, so the waistband edge is the reference that matters, not the body.

## 3. Mirror selfies vs a propped phone

**Published work.** Photography guides show that shooting from above shortens the legs, while a waist-height camera leaves them unchanged ([The Slanted Lens](https://theslantedlens.com/how-camera-angle-affects-body-shape-a-video-lighting-tutorial/)). A forensic study found the bias in body measurements from images depends on camera viewpoint and the person's stance (Hoogeboom et al. 2009, cited via [OJP abstract](https://ojp.gov/ncjrs/virtual-library/abstracts/body-height-measurement-images), **unverified**). We found **no study that quantifies this for outfit photos**, so the numbers below are **our calculation**.

**Setup:** a pinhole camera, the body as a flat plane, ANSUR II mean heights, and the camera tilted so the whole body fits in the frame.

| Shot | Leg ÷ torso in image (true 1.50) | Navel's u shift | Front hem shift vs hip joint (hem at 98 cm, 12 cm in front of the joint plane) |
|---|---|---|---|
| Propped, waist height, 2.5 m | −2% | +0.2 cm | ~0 cm |
| Propped, chest height, 2.5 m | −9% | +0.6 cm | −1.7 cm (looks lower) |
| Mirror, phone at chest, ~1.3 m effective | −22% | +1.8 cm | −3.4 cm |
| Mirror, phone at face, ~1.3 m effective | −29% | +2.5 cm | −6.0 cm |

**What drives it:**
- **Tilt:** pointing the camera down compresses the lower legs.
- **Depth:** the front of the waist is about 12 cm nearer the camera than the hip joints (half the 23.8 cm waist depth). When the camera sits above the hem, that pushes a front hem *down* the image relative to the joints.

**What survives:**
- **The crotch's place on the thigh ruler barely moves** (≤0.4 cm in every case).
- **Waist-level positions measured from the hip joint drift by 2–6 cm in selfies,** the same size as the at-belt vs mid-fly gap.
- **A raised arm hikes the shirt hem on that side** (observed, not measured), and it moves the shoulder keypoint.

**So:** judge selfies from side-specific or lower-arm-side cues, and from garment-to-garment edges.

## 4. Published hem and waistline detectors

- **DeepFashion landmarks** (collar, sleeve, waistline and hem, left and right; the "waistline" points are the trouser waistband corners):
  - **FashionNet (2016):** normalized error about 0.085 for waistline and 0.082 for hem.
  - **Later methods:** about 0.034 on average.
  - **On consumer photos (FFLD):** FashionNet rises to about 0.20.
  - Sources: ["Fashion Landmark Detection and Category Classification for Robotics" (2020), results table](https://arxiv.org/pdf/2003.11827); ["A Global-Local Embedding Module for Fashion Landmark Detection" (2019)](https://arxiv.org/pdf/1908.10548v1.pdf); ["Layout-Graph Reasoning for Fashion Landmark Detection" (2019)](https://arxiv.org/pdf/1910.01923). The FashionNet numbers are as reproduced there; its 2016 paper wasn't read.
  - **In real terms:** the error is a fraction of the image size. 0.034 of a garment-cropped image is about 2–3 cm on a 70 cm top, but about 6 cm if the frame holds the whole 1.75 m body (our arithmetic).
  - **License:** DeepFashion is research-only.
- **Fashionpedia:** its labels are attributes on each garment's outline, not lines.
  - **Waistline values:** empire, dropped, high waist, normal waist, low waist, basque, no waistline.
  - **Length values:** above-the-hip, hip, micro, mini, above-the-knee, … floor.
  - These are from the local `instances_attributes_val2020.json`, ids 139–155.
  - **Experts were often unsure:** most "not sure" answers came from the Waistline, Opening Type and one other group ([Jia et al. 2020, ECCV, dataset section, p. 9](https://www.ecva.net/papers/eccv_2020/papers_ECCV/papers/123460307.pdf)).
  - **Attributes are hard to predict:** box AP drops from 48.7 to 35.7 once attributes must also be right (Table 3).
  - **Usefulness for us:** they give coarse labels at best, not a position.

## What this means for a joint-based ruler

- **Spread across men:** placing the natural waist or the navel/hip-bone line from the hip joint carries about **2.2–2.5 cm** of person-to-person spread (about 0.06 thigh-lengths). The crotch carries about **1.5 cm** (0.04).
- **Keypoint error:** add the hip keypoint's own error, about **3 cm** systematic (calibratable) and an unknown random part, likely **2–4 cm** vertically for one photo of a clothed person (Needham's lab value is 1 cm; COCO's annotator spread implies up to ~5 cm).
- **Propped photo, total (1 SD): about 3–4.5 cm**, or **0.07–0.11 thigh-lengths**, for the waist; about 2.5–3.5 cm for the crotch.
- **Mirror selfie:** add 2–6 cm of perspective shift at waist level. **Total about 5–7 cm.**
- **At belt vs mid-fly** (about 5 cm apart), with a midpoint cut-off: about **80% correct** at SD 3 cm, **74%** at 3.8 cm, **69%** at 5 cm, **66%** at 6 cm. The earlier fit ruler's 63–71% (#170) sits right in this range.
- **So the two can't be told apart reliably from joints alone,** least of all in selfies.
- **Use joints as a window, not as the measurement.**
  - Search for the waistband, belt or tuck edge inside u ≈ −0.6 to −0.1 (and the crotch near +0.1).
  - Measure the hem against that **garment edge** (waistband to hem, as a fraction of the thigh).
  - Let the joint estimate only veto impossible answers, such as a "tuck line" below the crotch.
  - "Past the crotch / covers the seat" vs "above the belt" (≥10 cm apart) *is* separable from joints, at about 95% with SD 3 cm (about 87% with SD 4.5 cm).
- **Calibrate first:** fix the systematic hip offset on the labelled phone photos before trusting any number above.
