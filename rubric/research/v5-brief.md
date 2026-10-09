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
