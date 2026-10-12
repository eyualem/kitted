# The leg probe on public truth: slim vs straight on Fashionpedia

*Oct 12, 2026. Claude. DECISIONS-LOG #223. Mac harness only, not in the app, no API calls. Script `extraction-test/fp_leg_test.py`, results `extraction-test/results/fpleg1/` (`analysis.txt`, `standing.txt`, `selection.json`, per-photo runs; overlays git-ignored). Truth: Fashionpedia val 2020 labels (Jia et al., "Fashionpedia: Ontology, Segmentation, and an Attribute Localization Dataset", ECCV 2020; annotations CC BY 4.0). Photos keep their own licenses and stay on the Mac (`inputs/fashionpedia/`, git-ignored; founder OK'd the download Oct 12).*

## Bottom line

1. **The leg probe can't tell slim from straight.** On 90 independently labelled full-length pants (41 tight, 49 straight), hem ÷ knee with the cut fixed on our own photos first (0.765) is right on **56%** (29/51) and unsure on **43%**. Fitting the cut on Fashionpedia itself (leave-one-out) only reaches 68%. The AI was right 75–77% on our photos.
2. **Standing poses only** (both legs under 10–25° of bend): 58–61% with the frozen cut, 58–63% leave-one-out, and it answers on only 33–41 of 90 photos.
3. **Opening ÷ shoe is worse than a coin flip** (45% frozen).
4. **The signal is real but far too weak:** tight pants measure a median 0.69, straight 0.83, but the two spreads overlap almost completely.
5. **So #189's 92% on 12 photos was luck.** That was the one promising leg result. Drop the outline-width approach to leg shape for good; don't re-test it on the gold set.

## What was tested

- **Pants:** Fashionpedia val pants annotations that are full length (maxi / floor) and on a photo with exactly one pants annotation and a shoe. Left out: leggings, sweatpants, crop, capri, sailor, harem, peg (peg labels contradicted "straight" on the same pants, and jogger cuffs are a known failure), flare, bootcut and bell bottom.
- **Classes:** "tight (fit)" = slim; "straight" = straight; "wide leg" / "baggy" = wide (only 5, not scored). That gives 95 pants, 65 of them jeans.
- **Boxes:** Fashionpedia's own pants and shoe boxes, passed in the closet call's format. These are better boxes than the app gets.
- **Probe:** `kmeasure legs`, the #189 code unchanged, with its gates (bottoms box, not a side view).
- **Photo prep refused 13 photos:** 9 with two people and 4 where it couldn't find a face to hide. That's the app's own rule.
- **Who's in them (rule 7):** public photos, profile unknown; the probe uses no profile.
- **Men and women:** Fashionpedia has no gender field (about 20% men by the paper). The measure compares garment against garment, but "tight" here includes women's jeggings, which are narrower than the app's "slim". That makes slim vs straight easier than in the app, and it still fails.

## Why it fails

- **A tight leg tapers because the leg tapers,** and a straight leg's hem width depends on stance, the camera angle and the shoe.
- **The photos are small.** At 1024 px a shin is 20–40 px wide, so one pixel is several percent of the ratio.
- **Elastic, cuffed and rolled hems** move the hem sample.
- **Many public photos are walking, seated or angled.** Even standing-only, the spreads overlap.

## What this means

- **Leg shape stays the AI's reading.** The headroom test (#222) found it's the most score-sensitive proportion fact, so the work belongs on the AI side: the slim-vs-straight call through the closet's stored fit per piece (#164) once the size-ladder shoot exists, or the brand-named shop photos in the gold set (Levi's 511 vs 501).
- **The phone can't replace or veto it.**
