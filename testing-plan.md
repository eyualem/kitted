# Testing plan: the full process

*Standalone: paste this into any chat or prompt. Oct 6, 2026.*

## Context (for whoever reads this)
I'm building **Kitted** (working name), an iOS app for guys, core audience **18–30** (the app is 18+ only). It's a chat-first personal stylist. You send an outfit photo, get a **fit score out of 10** with 2–3 specific fixes, and the app learns your closet as you go.

**How scoring works:** "the AI sees, the code judges, the AI explains."
1. A vision model (Gemini Flash-class) describes the clothes in **fixed categories only**: garment type, color, pattern, fit, hem, tuck, condition, and so on. **It never gives a score.**
2. A rulebook in code (`extraction-test/rubric.py`, rubric v2, about 25 rules backed by 2025–26 sources) calculates the score.
3. A text model only writes the explanation.

**The whole app depends on one unproven assumption:** that a cheap AI model can describe outfits from phone photos **consistently** (the same photo gets the same score) and **notices when you fix something** (cuffing jeans should raise the score). If that fails, the plan changes. So we test it first, before writing any app code.

The tests below are listed in order of priority.

---

## TEST 1: Extraction test (most important; do it first)

> **Status (Oct 6): PASSED.**
> - **Stock photos (40):** consistency 95–97%. Fix detection is unproven: 67–83% across runs, swinging on 2 ambiguous stock pairs.
> - **Real mirror selfies (12):** consistency 92–100%.
> - **Rubric v3** fixed the too-generous scores.
>
> Full log: `extraction-test/results/INDEX.md`. Still to do: **Step 5** with your own photos (including deliberately bad outfits, real fix pairs and shoe snaps), plus a thinking-off run for speed and cost.

### Goal and pass bars
| Measure | Pass bar | What it means |
|---|---|---|
| Score consistency | **90%+** of photos have every run's score within **±0.5** of that photo's median (5 runs per photo) | Same photo → same score |
| Fix detection | **80%+** of "after fix" photos are recognized as fixed | The re-check moment works |
| Field reliability | Each garment detail agrees **80%+** across runs | Details below that become advice-only in v1 (no score impact) |
| Photo type | Compare studio / street / phone / mirror | Tells us if real phone photos hurt accuracy |

### What you need
- The `extraction-test/` folder: `run_test.py`, `rubric.py`, `schema.json`, `prompt.txt`, `README.md`.
- **40 free-license photos.** Codex collects them, so you don't have to model.
- A **Google AI Studio API key** (aistudio.google.com → "Get API key"). The free tier is fine for stock photos. **Never paste the key into any chat.**
- Python 3 on a Mac (the script uses the built-in `sips` to resize photos).

### Step 1: Collect the photos (Codex)
Give Codex this prompt:
```text
I need 40 free-license photos of men's outfits to test an AI outfit-reading system. Use Chrome to collect them from Pexels (pexels.com) and Unsplash (unsplash.com) only — free license photos, NOT "Unsplash+" or premium. Do not use Google Images results or any copyrighted/personal photos.

A) 28 SINGLE photos, each showing ONE man, FULL BODY (shoes visible unless noted), clothed normally. Mix: 8 "studio", 8 "street", 6 "phone" (everyday, imperfect), 6 "mirror" (mirror selfies). Vary outfits widely (hoodie + jeans, tee + chinos, button-up untucked/tucked, jacket over tee, suit/blazer, shorts, baggy streetwear, workwear, athleisure; sneakers, running shoes, boots, loafers). Vary skin tones, ages (~16–60 looking), body types. Include 2 dim-light photos and 2 with shoes cut off.
B) 6 PAIRS (12 photos): the SAME man in the SAME photo shoot where the outfit changes in ONE visible way — jacket on/off, tucked/untucked, different shoes, hoodie added/removed, sleeves rolled, pants cuffed.

SAVE in a folder "fitcheck-photos" in Downloads, one sub-folder per outfit:
  fitcheck-photos/s01/before_studio.jpg   (singles s01–s28; name = before_<studio|street|phone|mirror>.jpg)
  fitcheck-photos/p01/before_street.jpg and fitcheck-photos/p01/after_street.jpg   (pairs p01–p06)
Download "Large"/"Original" size (≥1000 px tall).

ALSO CREATE:
1) fitcheck-photos/metadata.csv: folder, file, source_site, page_url, photographer, license, capture_style, full_body (yes/no), shoes_visible (yes/no), lighting (good/dim), short_outfit_description
2) fitcheck-photos/fixes.csv: outfit_id, fix_type, occasion, notes — one row per PAIR. fix_type ∈ cuffed, tucked, removed_layer, added_layer, swapped_shoes, swapped_top, swapped_bottom (what changes from before → after). occasion: everyday unless obvious.

RULES: free license confirmed on the page; one man per photo; no children; no shirtless/underwear/swimwear; skip anything with an unclear license. Report final counts per category.
```

**Then:**
- Move the finished `fitcheck-photos` folder into the project's `inputs/` folder.
- Copy `fixes.csv` into `extraction-test/`, replacing the example file there.

### Step 2: Check the photos (5 minutes, by hand)
- Open 5–10 random photos. Each should show one man, full body, fully clothed, and match its folder name.
- In `fixes.csv`, make sure each pair's `fix_type` describes the change correctly. Wrong labels make fix detection look worse than it is.

### Step 3: Run it
1. Open Terminal in the `extraction-test` folder.
2. Type, without sharing the key anywhere else:
   ```
   read -s GEMINI_API_KEY && export GEMINI_API_KEY
   /usr/bin/python3 run_test.py --selftest
   /usr/bin/python3 run_test.py --photos ../inputs/fitcheck-photos --delay 1 --out results/test1-stock-40
   ```
   - Use **`/usr/bin/python3`**. The python.org Python on this Mac can't verify HTTPS certificates.
   - The self-test just confirms the code works (no API calls).
   - The real run makes 40 photos × 5 runs = **200 calls**, about **40 minutes**. **Turn billing on first:** the free tier allows only 20 calls per model per day. It costs about $1.85 on Gemini 3.8 Flash (twice that from Jan 2027).
   - **Options:**
     - `--model <name>` (default `gemini-3.8-flash`; 2.5 Flash is retired for new accounts)
     - `--runs 5` (3 is enough for quick tests)
     - `--occasion everyday`
     - styles via `TEST_STYLES="minimalist:0.5,smart_casual:0.5"`
3. Results go to the `--out` folder (`report.md` and `raw_results.json`). Log each test in `results/INDEX.md`. After a rubric change, re-judge saved answers for free with `rescore.py` (see `extraction-test/README.md`).

### Step 4: Read the results
Share `report.md` (never the key) with Claude and ask: *"Interpret this extraction test against the pass bars and tell me what changes in the app."* Then decide:

| Result | What we do |
|---|---|
| **Both pass** | Green light. Build v1 as planned, and add more labeled photos for calibration. |
| **Consistency passes, fix detection fails** | Keep scoring. Make re-checks "anchored": reuse the first reading and only re-check the changed detail. Re-test the pairs. |
| **Consistency fails on some fields only** | Make those fields advice-only. Re-run to confirm the rest passes. |
| **Mirror/phone much worse than studio/street** | Lead with the propped-camera mode and its live framing guide. Treat mirror photos as "partial check." |
| **Consistency fails broadly** (under ~75%) | Try a stronger model or a higher image resolution and compare the cost. If it still fails, pivot the core to "what should I wear from my closet" with correctable, coarse scoring. |

### Step 5: Confirm with real photos (later)
Stock photos are the **best case** (professional light, posed). Before launch, repeat with **20–30 real phone photos from consenting adult beta testers** (TestFlight). Use the same pass bars.

---

## TEST 2: Name poll (1 day; anytime)
**Goal:** confirm "Kitted" with real 18–25-year-olds before claiming handles and the domain.
1. Post an Instagram or TikTok **story poll**, or message **10+ guys aged 18–25**, with this exact question: *"Which app would you download to check your outfit?"* Options: **Kitted / Sartor / Tuck.**
2. **Say test:** say each name out loud to 3 people. Can they spell it after hearing it once?
3. **Pass:** Kitted wins or ties, and people can spell it.
4. **Then, the same day:**
   - claim **@kitted.app** on TikTok and Instagram (both showed free on Oct 6)
   - register **trykitted.com** (about $10–15/yr)
   - use trykitted.app as a backup
   - never use "getkitted" (taken by a small Australian menswear shop)
5. **Later:** if you launch in Australia, search search.ipaustralia.gov.au for "Kitted" first.

---

## TEST 3: "Do people trust our score more than free ChatGPT?" (week 2)
1. Make a mock fit-check card (score, sub-scores, 2 fixes) for 3 outfit photos, using the test results.
2. For the same photos, ask ChatGPT: *"Rate this outfit out of 10 and give fixes."*
3. Show 8–10 target users (ages 18–30) both versions without saying which is which. Ask: *"Which would you use tomorrow? Which feels more fair and useful?"*
4. **Pass:** 7 out of 10 pick our card, and they say it's because it's *consistent* or *specific*.

---

## TEST 4: Concierge test (weeks 2–4; tests the daily habit)
1. 10 friends (adults) text you a photo of their outfit when they get dressed.
2. You score it with the test script and text back the score and fixes. Each morning for 7 days, text **one outfit idea** built from clothes they've shown you.
3. **Pass:** at least 5 of 10 are still replying on day 7.

---

## TEST 5: Waitlist ("will adults pay?"; weeks 1–4)
1. A simple waitlist page (on trykitted.com) asks for **age range** (with "Kitted is for ages 18 and up"; under-18 entries aren't saved) and offers two buttons: "Join free" or "Lock the $19.99 founding price" (no charge; "we'll email you at launch").
2. Link it from your TikTok and Instagram bios. Keep the videos adult-facing (college, first job, interviews, dates).
3. **Pass:**
   - fewer than 10% of attempted signups are turned away as under 18 (if it's more, the content is reaching teens: adjust it)
   - 15%+ tap the founding price
   - 300+ signups by launch

---

## Order and timing
| When | Test |
|---|---|
| Now | **Test 1** (extraction) and **Test 2** (name poll) |
| Week 1 | Start posting videos + the **Test 5** waitlist |
| Week 2 | **Test 3** (ChatGPT comparison) and **Test 4** (concierge) |
| Before launch | Test 1, step 5 (real photos from beta testers) |
