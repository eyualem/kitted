# Which model should read the outfit? Gemini vs OpenAI, and multi-call systems

*Oct 15, 2026. Claude. DECISIONS-LOG #278. The founder's OK and his own OpenAI key (limited balance, expiring; stored
only in the git-ignored `app/.env.development.local`). Spent about $3.33 in all: OpenAI ~$1.4, Gemini Flash-Lite
~$1.85. Code: `extraction-test/openai_read.py` (the OpenAI call; the app's schema converted to OpenAI's strict
format), `model_test.py` (the runs), `model_report.py` (the report), `waist_specialist.py`, `hem_models.py`.
Results: `extraction-test/results/models1/report.md`, `results/waist-specialist/report.md`,
`results/hem-models/report.md`; the blind name check in `extraction-test/waist_labels/names/`. Nothing in the app
changed.*

## Bottom line

1. **GPT-6 Luna scores outfits about as well as today's Gemini, at about 1/11 of the cost.**
   - It agrees with the 5-judge panel as well (r 0.59 vs 0.58 on all 223 gold photos; 0.60 vs 0.49 on the held-out half).
   - It agrees better with the founder's 20 blind ratings (r 0.61 vs 0.46; 16 vs 13 within 0.5).
   - It's about as steady (the same photo within 0.5 on 96% vs 98%).
   - It's a bit faster (5.4 s vs 6.8 s median) and costs 0.054¢ a read instead of 0.59¢.
2. **But it names the clothes worse.** In a blind check of 60 gold photos, garment types were right 75% vs 85%, with 10 clear errors vs 3. Shoes: 69% vs 83%. Tops: 72% vs 83%. Colors are equal (87% vs 86%).
   - On his own photos it calls his hoodies "sweatshirt" (3 of 3).
   - It reads "the waist shows" right 72% of the time vs 88%.
   - Names show up on the card ("Swap the hoodie…") and in the closet, so this matters even where the score doesn't move.
3. **Gemini 3.5 Flash-Lite loses on every count except speed.** It matches the panel worse (0.51), and the founder's 20 much worse (0.29). It rarely gives an 8 (4%) and reads leg shape and the waist worse. It costs about half of today's read, not a quarter. Drop it.
4. **Several cheap calls don't buy quality.** Voting 3 reads, a cascade (a third read only when two disagree) and a waist specialist each cost more and none matched the judges better. Voting barely helps because the same model makes the same mistakes. The specialist read the waist as well as Gemini (87%, scored with the labels' own definition, chosen after seeing its answers), but scores built on it matched the judges worse (0.55 vs 0.59). Being right by our labels isn't the same as scoring the way the judges do (the waistline work found the same, #264).
5. **The hem specialist doesn't help either.** On Luna, "fabric piles above the shoe" is right 57% of the time, below Gemini's 69%.

## The test

- **The same request for every model:**
  - the app's instruction (`prompt.txt` + the close-up line);
  - the face-hidden full photo plus the upper and lower close-ups (from the app's own Swift prep);
  - the v3 answer format (for OpenAI, converted to its strict schema: every key required, optional keys nullable).
- **Photos:**
  - the 225 gold-set screenshots, with the panel (profile unknown);
  - his 27 photos, with hand-checked truth for 10 (`inputs/phone-oct8/truth.csv`; his profile is pending);
  - 39 stock photos (profile unknown).
  - Rule 7: every score uses the one stated test profile (Minimal + Smart casual, boldness "a little"), at Everyday, on engine v13.
- **The arms:**

| Arm | Model | Settings | Runs |
|---|---|---|---|
| gem38 | gemini-3.8-flash | thinking off; the live config (the existing gold1 / zoom1 readings, no new spend) | as already run |
| luna | gpt-6-luna | reasoning none, temperature 0 | 6 runs on gold, 3 elsewhere |
| luna_low | gpt-6-luna | reasoning low | 2 |
| fl35 | gemini-3.5-flash-lite | thinking "minimal" (it refuses "off") | 2 |

- **Truth:**
  - the gold panel, with gold_tune's tune/test split (test scored once);
  - his truth.csv;
  - the waist labels both blind passes agree on (168 photos);
  - the pass-1 leg labels;
  - a new blind check of names and colors: 60 gold photos, both readings shown as A and B with the model hidden, three reviewers (`waist_labels/names/`).

## Results

| System | ¢ a read | Median s | Same photo within 0.5 | Panel r, all · test | Proportions r, test | Founder's 20 | 8+ share |
|---|---|---|---|---|---|---|---|
| Gemini 3.8 Flash (today) | 0.59 | 6.8 | 284/289 (98%) | 0.58 · 0.49 | 0.50 | 0.46 (13/20) | 15% |
| Gemini 3.5 Flash-Lite | 0.32 | 3.2 | 283/288 | 0.51 · 0.50 | 0.46 | 0.29 (12/20) | 4% |
| **GPT-6 Luna** | **0.054** | 5.4 | 279/290 (96%) | **0.59 · 0.60** | 0.57 | **0.61 (16/20)** | 8% |
| GPT-6 Luna, low reasoning | 0.068 | 7.5 | 275/288 | 0.57 · 0.58 | 0.59 | 0.65 (16/20) | 12% |
| Luna, 3 reads, the medoid | 0.16 | 5.4 | 216/224 | 0.55 · 0.58 | 0.51 | 0.69 (17/20) | 12% |
| Luna cascade (2.3 reads) | 0.13 | 5.4 | 216/224 | 0.55 · 0.57 | 0.49 | 0.67 (17/20) | 10% |
| Luna + waist specialist | 0.075 | 5.4 | 281/290 | 0.55 · 0.53 | 0.48 | 0.54 (16/20) | 5% |

| Truth | Gemini 3.8 | Flash-Lite | Luna | Luna low |
|---|---|---|---|---|
| His tops (truth.csv) | 100% | 100% | 70% (hoodie → sweatshirt) | 70% |
| His bottoms | 100% | 100% | 90% | 85% |
| His shoes | 53% | 40% | 43% | 30% |
| His colors | 73% | 61% | 62% | 63% |
| His leg shape | 43% | 25% | 80% | 45% |
| "The waist shows" (agreed labels) | 88% | 75% | 72% | 80% |
| Leg shape (labels, all sets) | 82% | 77% | 86% | 83% |
| Blind check: garment type right | 85% | – | 75% | – |
| Blind check: color right | 86% | – | 87% | – |

- **Caveats:**
  - The founder's 20 and his truth.csv photos are small: 20 photos and 10 photos.
  - The panel's r has a standard error of about 0.08 on the 91 test photos, so 0.60 vs 0.49 is suggestive, not proven. On all 223 photos the two are equal.
  - The rules were tuned on Gemini's readings of the tune half, which favors Gemini there. Luna still matched them on the test half.
  - The panel is itself AI judges (5 Claude subagents, #192), which the founder's own ratings agree with (r 0.69, #225).
- **Prices are list prices** (Luna $0.10 / $0.50 per million tokens, from the Oct 6 research). They're confirmed by the usage counts (about 3,300 tokens in and 400 out per read), not by a bill.

## What it would mean for the bill (market/ai-costs.md)

- **A whole check today** is 1.08¢: the read 0.60, the second look 0.23, the closet call 0.25. That's 2.16¢ from January.
- **With Luna for the read alone:** about 0.53¢.
- **With Luna for all three calls:** about 0.15¢. That's an estimate: the second look and the closet call weren't tested on Luna.

## Options, ranked (Claude's recommendation first)

1. **Test one stronger OpenAI model before deciding** (~$1–2 of the same test). OpenAI's larger 2026 models (`gpt-6-sol`, `gpt-6-astra`, both on his key) may close the naming gap at a few times Luna's price, still far under Gemini. The shoe and top naming is the bar to clear: ≥ 83% right in the blind check, with panel agreement no worse.
2. **Luna for the scoring read, Gemini kept for the closet call.** The card's names and the closet's pieces come from the closet call's names and the read. This halves the bill but leaves the card's garment words on Luna, so it's worse than option 1 if a stronger model works.
3. **All Luna now.** The cheapest by far, and the scores are as good, but about 1 garment in 20 would be named wrong, against about 1 in 65 today. "Not quite right?" can fix those, but every wrong name costs trust.
4. **Keep Gemini 3.8** and solve the bill elsewhere (#270's other levers).

Not recommended:
- **Flash-Lite:** worse scores.
- **Different models for free and Pro:** the same photo could score differently by tier, which breaks "same photo, same score".
- **Voting or cascades:** cost without gain.

Switching providers is outward-facing: the consent screen names Google today (Apple 5.1.2(i)) and would have to name OpenAI. OpenAI keeps API data up to 30 days for abuse checks, against Gemini's 55, and doesn't train on it. That's the founder's call once the model is chosen.
