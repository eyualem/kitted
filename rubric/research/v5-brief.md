# Rubric v5 research brief: make the score earn every point

*Oct 9, 2026. Founder: "The rating is our selling point. It has to be meticulous." Status and next steps live in CLAUDE.md; decisions in DECISIONS-LOG #160–161. This file holds the research questions and the prompts for Codex and Gemini.*

## The problem in one line
Today a credit is earned by **having** something (any layer +0.75, any dressy piece +0.5), not by it **working**. So a layer pushes an outfit toward 8.5 whether or not it looks good, and outfits without one stall at 7.0–7.5 (#160: 45/45 each way on 90 clean outfits).

## What "meticulous" means here (and its honest limits)
- **Every point has a reason he can read.** No credit for presence alone. The Why sheet says what earned it: "Layered: the olive fleece adds a second texture and picks up your boots."
- **The order matches people's.** If a panel ranks fit A above fit B, so does the app. Pooled human raters agree only moderately (split-half ρ about 0.72–0.82, ZOZO 2024; expert vs. model off by about 0.65 points on 10, AesRec 2026; both in `notes/scoring_evidence.md`). So the target is "within about half a point of a panel's average and in the same order", not "exactly what one stylist would say". More precise than that is false precision.
- **The limit is what the AI can see reliably, not how many rules we write.** v5 and v5s failed the consistency bar because they read too many new details (#63–64). Every new detail must pass a run-to-run test before it can move a score, and a detail that flips stays a tip.
- **What the AI can't see can't be scored.** The upload hides the whole head (1.6 × 1.9 the face box, #54). So **glasses, sunglasses, earrings and anything worn on the head are invisible to it.** Glasses are also mostly prescription and sit on the face, so they stay out of the score for good. Caps and beanies are partly covered; a bandana counts only at the neck, wrist or pocket.

## The plan
| Step | What | Who | When |
|---|---|---|---|
| 0 | **Fix-engine bias (#160), code only, no score change:** shoe and top swaps get a fair shot, a swap beats adding a piece on a tie, the layer line fits what's underneath, no layer tip on warm days | Claude | now, ~1 day |
| 1 | **Research, in parallel:** R1 Reddit rated fits (Codex) · R2 TikTok fit ratings (Codex) · R3 YouTube stylists + accessories (Gemini) · R4 editorial and academic sources (Claude) · export the old Gemini creator sheet (founder) | Founder runs R1–R3; Claude R4 | Oct 9–15 |
| 2 | **Verify what comes back:** open 1 in 5 links, check quotes and numbers, drop anything older than 2024 or not men 18–30 | Claude | as it lands |
| 3 | **Rules ledger:** every candidate rule with its sources (count and agreement), the styles it applies to, the reading it needs, how reliably the AI sees that, and a proposed size. Then an adversarial council pass (one reviewer per style, as in Oct 7) | Claude | Oct 15–17 |
| 4 | **Paper calibration:** turn the rated outfits from R1–R3 into readings by hand, score them with the current and proposed rules, and compare with the people's numbers (order and level). Cheap, no photos, a few hundred fits | Claude | Oct 16–18 |
| 5 | **New readings, one at a time:** accessories (chain, bracelet, watch, belt, scarf, neck bandana, cap or beanie, bag) and any detail the ledger needs. 3 runs × the 52 real photos + your phone checks; keep a detail only if ≥ 90% of photos read the same every run (about $2) | Claude | Oct 17–20 |
| 6 | **Gold set, updated for this:** add "layered but not an 8" outfits, accessory on/off pairs, and strong no-layer streetwear fits; friends rate blind, plus pairwise "which is better" picks | Founder + friends | by Oct 22 |
| 7 | **Calibrate and lock v5:** set the starting point and credit sizes on the tuning photos, check on the sealed ones (bars in `speed-and-detail-plan.md`), port to the app with full parity | Claude | Oct 23–27 |
| 8 | **Beta signal:** a one-tap "Does this score feel right? Too low · About right · Too high" on each card, logged for tuning | Claude builds; founder OKs the copy | in the TestFlight build |

**Fallback if the gold set slips:** new rules ship as tips (no points), and the score stays v4 until people's ratings exist. Same rule as before: no score change without evidence.

## What the score is likely to become (to be confirmed by the research, not decided)
- **Credits earned on quality, not presence.** "Layered" when the layer adds contrast (lightness or texture) or ties to another piece, fits the outfit's style, and sits right (length, not the same shade as the top). A layer that just sits there earns little or nothing.
- **A "finished" credit that isn't only a layer:** a chain over a tee, a belt that matches the shoes, a scarf, a cap on a streetwear fit, a tie-in color between top and shoes. Only big, easy-to-see pieces count, inside the existing cap, so scores don't inflate. Having no accessories never costs points, and too many counts against "too many focal points".
- **9+ needs something standout** (RULEBOOK Part 10), and the level question (7.0 start vs. 6.75) is settled on people's ratings.

## Research questions (what every source should help answer)
1. **What separates a 7 from an 8 from a 9?** In raters' own words, for clean basic outfits, layered outfits and streetwear fits without a layer.
2. **Layers:** when do raters praise a layer, and when do they call it unnecessary, bulky, clashing or "trying too hard"? Overshirts over hoodies specifically.
3. **Accessories by style:** which ones raters notice and credit (chain, bracelet, rings, watch, belt, bandana, scarf, cap or beanie, bag, socks), how many is right, metal mixing, and when they hurt.
4. **Color:** repeating a color between pieces (a "tie-in"), contrast between top and bottom, tonal outfits, how many colors.
5. **Cohesion:** mixing styles and formality levels; when a mix reads as intentional.
6. **The scale itself:** what share of fits serious raters put at 8+ and at 9+.

## Prompts (paste as is)

### R1 · Codex · Reddit fits with number ratings
> Research task for a men's outfit-rating app. Use Chrome to read Reddit. **Do not download or save any images; record text only.** Skip any post that rates faces or bodies, any poster who says they are under 18, and anything posted before January 2024.
>
> **Goal:** a table of real men's outfits that other people rated with a number, with their reasons, so we can test our scoring rules against human judgment.
>
> **Where:** r/streetwear, r/malefashionadvice, r/mensfashion, r/OUTFITS, r/fashionadvice, and any similar active subreddit where men post "rate my fit" and commenters reply with numbers out of 10.
>
> **How many:** 120 outfits. Rough mix: 40 streetwear, 30 smart casual or classic, 20 workwear, vintage or outdoor, 30 everyday basics. At least 30 should have a jacket, overshirt or knit layer, at least 20 should be strong fits with no layer, and at least 30 should show accessories below the neck (chain, bracelet, rings, watch, belt, bandana, scarf, bag).
>
> **For each outfit, one row:** url · date · subreddit · post upvotes · each piece in plain words (e.g. "grey hoodie, black wide-leg jeans, olive suede work boots"), the more specific the better (leg shape, how the hem sits, layer open or closed) · accessories you can see below the neck · headwear (yes/no, what) · photo type (mirror selfie, outdoor, flat lay) · every number commenters gave and the median · the top 3 reasons people gave for the score, as short quotes (12 words max each) · what they said would raise it · anything said about the layer (praised, unnecessary, too bulky, clashing) · anything said about accessories · anything said about colors.
>
> **Then a summary (1–2 pages):** what separates a 6–7 from an 8 from a 9+ in these comments; when a layer helped and when it didn't; which accessories earned praise in which style and when they hurt; the 10 most repeated rules, each with the number of outfits that support it; and the share of outfits whose median was 8+ and 9+.
>
> **Save as:** `inputs/rubric-research/reddit-rated-fits.csv` and `inputs/rubric-research/reddit-summary.md`.

### R2 · Codex · TikTok fit ratings
> Research task for a men's outfit-rating app. Use Chrome to read TikTok. **Do not download videos or save images; record text only.** Only videos from January 2024 or later, rating men who look 18 or older. Skip anything that rates faces or bodies.
>
> **Goal:** how fit-rating creators score men's outfits and why.
>
> **Find:** at least 8 creators who rate men's outfits with numbers out of 10 (street-interview "rate my fit", "rating your fits", stylist reaction videos). Prefer creators with 50k+ followers who rate many outfits per video.
>
> **For each creator:** handle · follower count · style focus · harsh or generous (their typical range) · 2–3 example video links.
>
> **For 60+ rated outfits (spread across creators), one row:** video url · date · creator · timestamp · each piece in plain words (be specific: leg shape, how the hem sits, layer open or closed) · accessories below the neck · headwear · the score · the reasons, as short quotes (12 words max) · what they said would raise it · comments about the layer, accessories and colors.
>
> **Then a short summary:** what reliably earns an 8+ from these creators, what they knock points for, how they treat layers and accessories, and how their scale compares with Reddit's (if you also ran the Reddit task). Note where creators seem to score for entertainment rather than honesty.
>
> **Save as:** `inputs/rubric-research/tiktok-rated-fits.csv` and `inputs/rubric-research/tiktok-summary.md`.

### R3 · Gemini · YouTube stylists: rated outfits and accessory rules
> Research task for a men's outfit-rating app, using YouTube transcripts. Only videos from January 2024 or later, from channels with 100k+ subscribers focused on men's style. Skip anything that rates faces or bodies.
>
> **Part A, rated outfits:** find videos where a menswear creator rates real people's outfits with a number or a clear verdict (subscriber fit reviews, street-style ratings, "rating your outfits"). For 60+ outfits, one row each: video url · channel · date · timestamp · each piece in plain words (specific: leg shape, how the hem sits, layer open or closed) · accessories below the neck · headwear · score or verdict · the reasons (short quotes, 12 words max) · what would raise it · comments on the layer, accessories and colors.
>
> **Part B, accessory rules:** from 2024+ videos about men's accessories (chains and necklaces, bracelets, rings, watches, belts, bandanas, scarves, caps and beanies, bags, socks), list each rule a creator states, with the video, timestamp and style it applies to (streetwear, smart casual, workwear, minimal, classic, vintage sport, outdoor). Cover: how many pieces is right, size and thickness, mixing metals, matching belt and shoes, when an accessory looks cheap or like too much, and which accessories suit which style. Mark each rule as stated by 1, 2, or 3+ different channels.
>
> **Part C, layering and color rules:** the same for layering (when a layer helps, overshirts over hoodies, jacket length vs. the top, layer colors) and color (repeating a color between pieces, contrast between top and bottom, tonal outfits, how many colors).
>
> **Output:** a Google Sheet with three tabs (Rated outfits, Accessory rules, Layering and color rules), exported as `.xlsx`, saved to `inputs/rubric-research/youtube-stylists.xlsx`, plus a one-page summary of the rules that 3+ channels agree on.

## How Claude checks what comes back
- Open at least 1 in 5 links and confirm the date, the number and the quote. If more than 1 in 10 are wrong, redo that batch.
- Count a rule as supported only when 3+ independent sources agree (different subreddits or channels), and record dissent.
- Creator numbers (TikTok, YouTube) inform the **order** of fits more than the **level**; entertainment scoring runs harsh or generous.
- Popularity (likes, upvotes) is never a quality signal (ZOZO 2024: popularity vs. human rankings ρ −0.36 to 0.27).

## Re-runs after the Oct 9 check (`notes/v5-r1-r2-check.md`)
Gemini made up its TikTok rows, and Codex couldn't reach Reddit. These two prompts replace R3 and widen R2. Both start with the same honesty rules.

### R3b · Gemini · YouTube stylists (with honesty rules)
> **Honesty rules, read first:** Only record what you actually opened and read. Never generate, template, estimate or "fill in" rows, and never write a script that makes rows. Every row must have a real YouTube URL (11-character video ID after `watch?v=`) and a timestamp you saw in the transcript. If you find fewer than the target, stop and say how many you found; 15 real rows beat 60 invented ones. Mark anything you're unsure of as "unsure". Save files exactly where asked.
>
> Research task for a men's outfit-rating app, using YouTube transcripts. Only videos from January 2024 or later, from channels with 100k+ subscribers focused on men's style. Skip anything that rates faces or bodies.
>
> **Part A, rated outfits:** videos where a menswear creator rates real people's outfits with a number or a clear verdict (subscriber fit reviews, street-style ratings, "rating your outfits"). Target 40 outfits from at least 4 channels. One row each: video url · channel · subscriber count · date · timestamp · each piece in plain words (specific: leg shape, how the hem sits, layer open or closed) · accessories below the neck · headwear · score or verdict · the reasons (short quotes, 12 words max, from the transcript) · what would raise it · comments on the layer, accessories and colors.
>
> **Part B, accessory rules:** from 2024+ videos about men's accessories (chains, bracelets, rings, watches, belts, bandanas, scarves, caps and beanies, bags, socks), each rule a creator states, with the video URL, timestamp and the style it applies to. Mark each rule as stated by 1, 2, or 3+ different channels.
>
> **Part C, layering and color rules:** the same for layering (when a layer helps, overshirts over hoodies, jacket length vs. the top, layer colors) and color (repeating a color between pieces, contrast between top and bottom, tonal outfits, how many colors).
>
> **Save in this exact folder:** `/Users/eyu/Desktop/files/Kitted/inputs/rubric-research/` as `youtube-rated-fits.csv`, `youtube-rules.csv` (Parts B and C) and `youtube-summary.md`. At the end, list every video you opened.

### R2b · Codex · more TikTok creators (the embed pages worked)
> **Honesty rules, read first:** Only record what you actually opened and read. Never generate or template rows. Every row needs a real TikTok URL (19-digit ID). If you find fewer than the target, stop and say so. Do not download videos or save images.
>
> Continue the TikTok fit-rating research in `/Users/eyu/Desktop/files/Kitted/inputs/rubric-research/tiktok-rated-fits.csv` (keep the existing @lo2trimm rows and the same columns). Using TikTok embed pages (`https://www.tiktok.com/embed/v2/<id>`), which worked last time, add **at least 4 more creators** who rate men's outfits with numbers out of 10, preferring 10k+ followers, posted January 2024 or later, men who look 18+, nothing that rates faces or bodies. Aim for 10 rated outfits per creator, with a mix of styles (not only streetwear: some smart casual, workwear and plain everyday fits). **Include plain basic outfits** (hoodie or tee + jeans + sneakers) and **outfits with a jacket or overshirt**, because those are the cases we're testing. Fill the same columns, and for accessories and headwear only write what you actually saw (never infer from words in captions). Update `tiktok-summary.md` with a creator table and how each creator's scale compares (harsh, generous, typical range).

## Fit, piece by piece (founder, Oct 9: "know the distinction between oversized, fitted, tight… judge the fit… and log it in the closet")

### What we read today, and why it isn't enough
| Reading | Values | Same across 3 runs (his photos / stock) | Accuracy vs. truth | Problem |
|---|---|---|---|---|
| `volume` | 1 fitted … 5 very oversized | 34/39 · 49/55 | not labeled yet | **Hugs the middle:** on his photos 91 of 117 top reads were 3 ("regular"), 6 were 4, **never 5**, hoodies included. One number mixes two things: how the piece is cut and whether it's his size |
| `strain` | none / some / clear | 63/66 · 84/94 | not labeled | Only catches "too tight" when it's obvious |
| `sleeve_end` | above / at wrist / covers hand | 36/39 · 49/55 | 70–76% | The phone hand bends one arm in every mirror selfie |
| `length` (top hem) | cropped / at belt / mid fly / below crotch | 21/27 · 32/37 | not labeled | — |
| `leg_shape` | skinny … wide, barrel | 19/27 · 34/39 | 40–53% | Weak, and it drives several rules |
| `hem` (break) | pooling … cropped | 18/27 · 28/39 | 40–53% | Weak; can't tell stacked-on-purpose from pooling |

v4 judges fit with these: "too big" = volume 4+ with sleeves over hands or a hem below the crotch; "everything oversized"; top and leg against the style's bands; strain. So "intentionally oversized" and "a size too big" are the same thing to it.

### The design: the AI names the cut and the cue, the phone measures positions, the code judges
1. **Two answers per piece instead of one number** (replaces `volume`, so the answer doesn't get longer; the v5 lesson, #63–64):
   - `cut`, how it's designed: `fitted` · `regular` · `relaxed` · `oversized` (boxy, dropped shoulders, made big on purpose).
   - `size_fit`, how it fits him: `too_tight` · `right` · `too_big` · `unsure`.
   - `fit_cue`, the one visible reason when it isn't `right`: `seam_down_arm` · `sleeves_past_hand` · `long_body` · `bunching_at_waist` · `pulling_creases` · `placket_gaping` · `riding_up` · `sleeves_short`. Every cue is on the garment, never the body.
2. **Checkpoints per garment type** (the prompt gives the AI a short checklist; the fit research in `notes/v5-fit.md` fills in the targets):
   - **Tee:** shoulder seam on the shoulder (regular) or dropped (oversized); sleeve mid-bicep vs. elbow; hem at the belt to mid-fly; pulling across the chest.
   - **Hoodie / sweatshirt:** seam position; cuffs at the wrist vs. bunched over the hand; hem band at the hips vs. hanging past the crotch.
   - **Button-up / overshirt:** placket pulling or gaping; sleeve to the wrist; length (tucked or not); as a layer, open over a top.
   - **Knit:** same as the hoodie plus cling.
   - **Jacket / coat:** shoulder edge; sleeve covers the shirt cuff or not; length vs. the top underneath (`shows_below_outer`).
   - **Pants:** thigh pulling; leg shape; break; stacked on purpose vs. pooling.
   - **Shorts:** length vs. the knee; leg opening.
3. **The phone measures positions from body-pose joints, never widths.** Sleeve end vs. the wrist joint, top hem vs. the hip joints, pant hem vs. the ankle and the shoe top, from the joints Apple Vision already finds (prep, camera guide) and the closet call's boxes. These replace the AI's guess for `sleeve_end`, `length` and `hem` when the joints are clearly visible. **No garment-width-vs-body measurement, ever:** it would grow with body size and end up rating bodies (and the Oct 8 leg-shape-from-outline try was too rough anyway, #106). Width and cut stay the AI's description of the garment.
4. **The code judges, by garment type and the detected style:**
   - `too_big` and `too_tight` are size faults for every style (sized from the cue; sleeves past the hand are milder than a seam halfway down the arm).
   - `oversized` + `right` is a style choice, judged only by proportion (top vs. leg, the style's bands), never as "too big".
   - Fixes name the garment, never the body: "Try a size down in the tee", "Tailor the sleeves", "Roll the cuffs once", "A boxier tee would suit the wide jeans".
   - The copy checks gain a banned-words test for body words (body, weight, belly, skinny as a person word…).
5. **The closet keeps each piece's fit:**
   - Stored per piece: `cut` and `size_fit` (the clearest sighting wins; a half-seen read never overwrites a clear one), plus the measured sleeve and length positions.
   - Uses: **matching** (a boxy grey tee and a fitted grey tee are different pieces); the **drawn tile** (width and length follow the cut); the **piece page** ("Boxy oversized · fits well" or "Runs big on you"); **fixes** ("Swap to your fitted white tee"); the **morning card** (an oversized top goes with a straight or wide leg, per the style's bands).
   - A "This fits differently" correction on the piece page, which teaches the piece like the closet questions do.
6. **How we'll know it works:**
   - **Size-ladder shoot (founder + friends, about 45 min):** the same tee, hoodie and jeans in 2–3 sizes each (trade clothes), plus one designed-oversized piece, mirror and propped. The size is known, so the truth is free: about 30 photos.
   - **3-run flip test:** `cut` and `size_fit` must read the same on ≥ 90% of photos.
   - **Accuracy on the size ladder:** ≥ 80% per field, or it stays a tip with no points.
   - **Measured positions vs. the AI:** on the gold set's labels.
   - **Safety:** every fit line in the copy deck passes the body-words test, and no rule reads a width.
7. **Order:** fit research (running) → prompt and schema change (`cut`/`size_fit`/`fit_cue` in place of `volume`), flip test (about $2) → phone position measures (Swift, in the measure layer) → size-ladder shoot → rules in the v5 ledger → closet fields (a migration) and the piece page → port with parity. Rides with v5; nothing changes scores before the shoot.

### R3c · Gemini · YouTube fit guides (optional, same honesty rules as R3b)
> **Honesty rules, read first:** Only record what you actually opened and read. Never generate, template or "fill in" rows, and never write a script that makes rows. Every row needs a real YouTube URL (11-character video ID) and a timestamp from the transcript. Fewer real rows beat more invented ones. Save files exactly where asked.
>
> From 2024+ YouTube videos by men's style channels with 100k+ subscribers, collect how each garment should fit: tees, hoodies and sweatshirts, button-ups and overshirts, knits, jackets, jeans and trousers, shorts. For each rule: video URL · channel · date · timestamp · garment · the checkpoint (shoulder seam, sleeve length, body length, width, break, rise…) · the target for a regular cut · the target for an intentionally oversized cut · how to tell "oversized on purpose" from "a size too big" · signs of too tight · the style it applies to · a short quote (12 words max). Mark each rule as stated by 1, 2, or 3+ channels. Only rules about the clothes, never about body types.
>
> Save as `/Users/eyu/Desktop/files/Kitted/inputs/rubric-research/youtube-fit-rules.csv` and `youtube-fit-summary.md`.
