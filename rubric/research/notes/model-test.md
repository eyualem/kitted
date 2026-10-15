# Which model should read the outfit? Gemini vs OpenAI, and multi-call systems

*Round 3 (Anthropic, #283) is first, then round 2 (more OpenAI models, #280), then round 1 (#278).*

*Oct 15, 2026. Claude. DECISIONS-LOG #278. The founder's OK and his own OpenAI key (limited balance, expiring; stored
only in the git-ignored `app/.env.development.local`). Spent about $3.33 in all: OpenAI ~$1.4, Gemini Flash-Lite
~$1.85. Code: `extraction-test/openai_read.py` (the OpenAI call; the app's schema converted to OpenAI's strict
format), `model_test.py` (the runs), `model_report.py` (the report), `waist_specialist.py`, `hem_models.py`.
Results: `extraction-test/results/models1/report.md`, `results/waist-specialist/report.md`,
`results/hem-models/report.md`; the blind name check in `extraction-test/waist_labels/names/`. Nothing in the app
changed.*

## Round 3 (Oct 15, #283): Anthropic's Claude Haiku 5.5 and Sonnet 5.5

**The founder's short-lived Anthropic key** (removed from the settings file afterwards). About $1.58: Haiku 5.5 on every photo twice ($0.50), Sonnet 5.5 on the 60 name-check photos once ($1.06; his "you can run the $1.00 one").
- **Thinking off:** "disabled" on Haiku; "between_tools" on Sonnet, which rejects "disabled".
- **Neither model takes temperature 0.**
- **Raw HTTP on the standard library** (`anthropic_read.py`), like the other callers, so no package was installed.
- **Claude counts the three photos as about 5,400 input tokens** (Gemini and OpenAI: about 3,300).

**Blind name check, four ways** (`waist_labels/names3/`, `results/models1/names3.txt`): 60 gold photos, Gemini and GPT-6 Sol included again as anchors.

| Model | Garment named right | Wrong / extra / missing | Tops | Bottoms | Shoes | Jackets | Colors right | ¢ a read | Median s |
|---|---|---|---|---|---|---|---|---|---|
| **Claude Sonnet 5.5** | **83%** | **3** | **86%** | 85% | **78%** | 83% | **87%** | 1.73 | 6.1 |
| Gemini 3.8 Flash (today) | 79% | 5 | 77% | 88% | 73% | 79% | 82% | 0.59 | 6.8 |
| GPT-6 Sol | 76% | 17 | 72% | 86% | 69% | 75% | 79% | 1.07 | 4.6 |
| Claude Haiku 5.5 | 64% | 19 | 45% | 83% | 62% | 70% | 80% | 0.086 | 3.0 |

The anchors came out close to round 2 (Gemini 82 → 79%, Sol 78 → 76%), so the reviewers are consistent, a few points stricter this time.

**Claude Haiku 5.5 in full** (every photo, twice):
- the fastest read so far (3.0 s);
- the least steady (272/289 within 0.5, vs Gemini 284/289);
- the weakest agreement with the panel (0.48 on all photos, 0.38 held out; Gemini 0.58 / 0.49), his 20 at 0.48;
- tops named right only 45% in the blind check. Out.

**Claude Sonnet 5.5** names clothes best of every model tested, but only a little better than Gemini (3 vs 5 errors on 60 photos, within the noise). It costs about 3× Gemini's read today and about 1.5× Gemini's from January.
- It wasn't run on the full gold set, so its steadiness and panel agreement are unknown.
- A full run would cost about $10.

**Verdict:**
- Gemini 3.8 Flash stays the best value.
- Claude Sonnet 5.5 is the one model that names clothes at least as well, at about 3× the read cost.
- The cheap models from every company (GPT-6 Luna, GPT-5.6 Luna, Claude Haiku 5.5, Gemini Flash-Lite) name clothes clearly worse.

## Round 2 (Oct 15, #280): GPT-6 Sol, GPT-5.6 Luna and GPT-5.4 mini

**The founder's OK; about $2.30 on his key** (≈ $3.76 in all on it). The same request as round 1, reasoning none and temperature 0.
- GPT-6.1 Sol refuses "none" and took 12 s at "low", so GPT-6 Sol (same price) stood in.
- GPT-5.6 Luna ran on every photo twice.
- Sol and 5.4 mini ran first on the 60 name-check photos plus his 27 (his twice). A full run was planned only for a model that named clothes as well as Gemini. None did, so it wasn't spent.

**The blind name check, five ways** (`waist_labels/names2/`): 60 gold photos, five readings each (A–E, models hidden, order shuffled per photo), four reviewers (`results/models1/names2.txt`).

| Model | Garment named right | Wrong / extra / missing | Tops | Bottoms | Shoes | Jackets | Colors right | ¢ a read | Median s |
|---|---|---|---|---|---|---|---|---|---|
| **Gemini 3.8 Flash (today)** | **82%** | **7** | 81% | 93% | 73% | 82% | 83% | 0.59 | 6.8 |
| GPT-6 Sol | 78% | 14 | 77% | 88% | 66% | 86% | 83% | 1.00 | 4.6 |
| GPT-6 Luna | 75% | 14 | 72% | 88% | 68% | 65% | 85% | 0.054 | 5.4 |
| GPT-5.6 Luna | 74% | 19 | 66% | 88% | 71% | 69% | 83% | 0.116 | 4.6 |
| GPT-5.4 mini | 71% | 15 | 71% | 86% | 61% | 60% | 80% | 0.41 | 2.9 |

The first check's Gemini and GPT-6 Luna came out the same here (85% → 82%, 75% → 75%), so the reviewers are consistent.

**GPT-5.6 Luna in full** (every photo, 2 runs):
- the same photo within 0.5: 284/290 (Gemini 284/289), identical 237 vs 228;
- panel r 0.57 on all photos (Gemini 0.58), 0.60 on the test half (0.49);
- his 20: 0.61; 8+ share 13% (Gemini 15%).
- It agrees with the judges and is as steady as Gemini, but names clothes like GPT-6 Luna, for twice its price.

**Sol and 5.4 mini** were read only on 60 gold photos, so their panel numbers aren't reliable. Sol's shoes (66%) and mini's bottoms and shoes are below Gemini.

**Verdict:** no OpenAI model names clothes as well as Gemini 3.8 Flash. The closest, GPT-6 Sol, costs 1.8× as much. The cheap ones (GPT-6 Luna, GPT-5.6 Luna) score outfits as well, at 1/11 to 1/5 of the cost, with about twice as many naming errors.

## Bottom line (round 1)

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

## Options, ranked (Claude's recommendation first; updated after round 2, #280)

1. **Stay on Gemini 3.8 Flash for the reading now.** It names clothes best, and the names are what he sees on the card and in his closet.
   - Keep GPT-6 Luna wired up as the fallback (`openai_read.py`; ready since round 1).
   - Revisit if the bill bites after the beta, or when a new OpenAI model appears. The same test reruns in minutes (`model_test.py`, `waist_labels/names2/`).
2. **If money has to win before then: GPT-6 Luna for the read** (0.054¢, 91% cheaper), accepting about 2× the naming errors (75% vs 82% right).
   - "Not quite right?" lets him fix a name.
   - GPT-5.6 Luna isn't better at names, for twice the price.
3. **Not:**
   - GPT-6 Sol: closest on names, but 1.8× Gemini;
   - GPT-5.4 mini;
   - Flash-Lite;
   - different models by tier;
   - voting or cascades.

*(Round 1's list, kept for the record:)*



1. **Test the mid-priced OpenAI models before deciding** (~$1.10; corrected Oct 15, #279).
   - GPT-5.6 Luna (0.12¢ a read) on every photo; GPT-5.4 mini (0.43¢) on ~100, including the 60 of the blind name check.
   - The bar: garment types ≥ 85% right in the blind check, panel agreement no worse, cost under Gemini's.
   - **Not Sol or Astra:** at OpenAI's list prices GPT-6 Sol is ≈1.07¢ a read (1.8× today's Gemini, about Gemini's Jan 2027 price) and Astra ≈5.35¢ (9×), so they're no cost fix. The price table is in `market/ai-costs.md` §4b.
2. **Luna for the scoring read, Gemini kept for the closet call.** The card's names and the closet's pieces come from the closet call's names and the read. This halves the bill but leaves the card's garment words on Luna, so it's worse than option 1 if a stronger model works.
3. **All Luna now.** The cheapest by far, and the scores are as good, but about 1 garment in 20 would be named wrong, against about 1 in 65 today. "Not quite right?" can fix those, but every wrong name costs trust.
4. **Keep Gemini 3.8** and solve the bill elsewhere (#270's other levers).

Not recommended:
- **Flash-Lite:** worse scores.
- **Different models for free and Pro:** the same photo could score differently by tier, which breaks "same photo, same score".
- **Voting or cascades:** cost without gain.

Switching providers is outward-facing: the consent screen names Google today (Apple 5.1.2(i)) and would have to name OpenAI. OpenAI keeps API data up to 30 days for abuse checks, against Gemini's 55, and doesn't train on it. That's the founder's call once the model is chosen.
