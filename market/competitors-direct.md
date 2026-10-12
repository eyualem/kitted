# Direct competitors: outfit-rating and fit-check apps (US App Store)

Researched Oct 12, 2026 for Kitted (beta Nov 3, launch ~Nov 17–20). Scope: iOS apps whose main job is rating or giving feedback on an outfit photo, plus looksmax apps where they touch outfits/style. Closet/planner apps appear only where they score outfits.

## How the numbers were gathered (read first)

- **Ratings counts, averages, release and update dates** come from Apple's public iTunes Search API (`itunes.apple.com/search?...&country=us`, queried Oct 12, 2026, 28 search terms, 2,334 unique apps), cross-checked against the App Store page itself (WebFetch, Oct 12, 2026) for every app in the table. Where both exist they agree (e.g. Umax: API 51,620, page "52K"; Fits: 5,596 vs "5.6K"; Style DNA: 7,501 vs "7.5K"). These are **US-store** counts.
- **Prices and in-app purchase lists** come from each App Store page's "In-App Purchases" section, seen Oct 12, 2026. Apple lists IAP names and prices but often not the period; where a period isn't in the name I say so.
- **Age ratings** are from the App Store page (Apple's newer 4+/9+/13+/16+/18+ labels). The API sometimes still returns older labels; I used the page.
- **"Men / women / both"** is my judgement from the listing text unless the listing states it. Most listings are gender-neutral, which I mark "unstated (neutral copy)".
- **Review themes** come from the reviews visible on the App Store page (a small sample, often only 1–5 reviews). Quotes are under 10 words.
- **Download/revenue estimates** are rare and low-quality for this niche. Every one is listed with its source and marked if I only saw it in a search snippet.
- **Limit:** the Search API returns at most 200 results per term, so this is a wide sweep but not a complete census of the niche.

## Summary table (sorted by US ratings, Oct 12, 2026)

### A. Apps that rate or give feedback on an outfit photo

| App | Developer | US ratings | Avg | Pricing (from App Store IAP list) | Men / women / both | Scores outfits? | Notes |
|---|---|---|---|---|---|---|---|
| Dressly: AI Outfit Maker | TIKVEX LIMITED | 31,865 | 4.4 | $7.99 or $11.99/wk · $24.99 or $34.99/mo · $55.99 or $79.99/yr · $9.99 color scanner | Unstated; onboarding reads women-leaning (my inference) | Yes: style, fit and color harmony (scale not stated) | Biggest app with an outfit score, but it's a side feature of a color-analysis/capsule app. #198 in Lifestyle on the page |
| Pureple: AI Outfit Planner | Iceclip | 6,118 | 3.9 | $6.99/wk · $14.99/mo · $89.99/yr (7-day trial), plus many other subs | Unstated | Scores looks you assemble from your closet, with tips | Closet app since 2013; scoring is of assembled outfits, not mainly photos |
| Fits – Outfit Planner & Closet | L. & J. Henne UG | 5,596 | 4.6 | "Fits Pro" $9.99 / $29.99 / $59.99 (periods not named); AI credits $1.99–$79.99 | Unstated (neutral) | Yes, a "Rate outfit" card in its AI stylist chat (per its help center; not on the store page) | Closet app; rating plus "tuck the shirt"-style fixes and swaps from your wardrobe |
| **GRWM - AI Stylist** | Aliaksei Karatkou | **1,866** | 4.6 | $3.99/wk · $6.99–$12.99/mo · $19.99–$39.99/yr | Unstated (neutral) | Yes: ratings + a "potential" score + tips; mirror photo + occasion | **Largest pure-play AI outfit rater found.** Tips/analysis need a subscription |
| Atricent: Your AI Stylist | Atricent, Inc. | 244 | 4.4 | "Atricent +" $7.99 and $69.99 | Unstated | Yes, "rate your outfit" (scale not stated) | Shopping + try-on + social; rating is one feature |
| Glam Guides | Readcore Lab LTD | 157 | 4.6 | $10.99/mo · $35.99/yr (promo $19.90) | Women ("designed for women"); men's content added in v1.2.16 | Feedback on a daily outfit photo, no number | |
| GRWM -AI Styling Glow Up | AlphaByte, Inc. | 109 | 4.2 | $5.99–$12.99 (periods not named) | Unstated | Yes, "AI-Style Check" score | Last update Jan 30, 2025 (looks dormant) |
| MogMax AI - LooksMax AI Rating | Applax Pte. Ltd. | 93 | 4.5 | $49.99/yr; packs $0.99–$99.99 | Unstated (looksmax framing) | Face score + an "Outfit Score" | Only looksmax app found that advertises an outfit score |
| FitMax: Rate Your Fit | Sahan Development LLC | 38 | 4.9 | $3.99–$7.99/wk · $14.99/mo · $29.99/6 mo · $39.99/yr | Unstated | Yes: overall score from visual impact, trend, color, cohesion | Released Dec 30, 2025 |
| Stylee - AI Fashion Scorer | SARAH Meacham | 36 | 5.0 | $9.99/mo · $29.99 (likely yearly) | Unstated | Yes, 1–10 with breakdown | Released Mar 26, 2026; all visible reviews same day (see notes) |
| fitd. - rate your outfits | Adventure Labs d.o.o. | 25 | 4.9 | 9 "Unlimited access" items, $3.99–$34.99 | Unstated | Feedback and tips; no number on the page | Analysis needs a subscription |
| Beauty AI: Personal Stylist | David Voskanyan | 17 | 4.6 | $4.99/wk · $9.99/mo · $49.99/yr | Both (page) | Yes (scale not stated) | Publishes many "best outfit rating apps" SEO posts ranking itself #1 |
| Rate My Outfit | Burak Akin | 13 | 4.4 | $4.99/wk · $9.99/mo | Unstated | Overall rating + per-piece feedback | Since Aug 2024 |
| Fit Score! AI Outfit Rating | Mustafa Anıl Kaya | 12 | 4.7 | $5.99/wk · $29.99/yr ("Unlimited Style Scores") · $59.99/yr · $17.99 add-on | Unstated | Yes, out of 10 across 6 categories | Released Mar 9, 2026 |
| Looksee - Outfit Check | Kevin MacDonald | 10 | 5.0 | $4.99/wk · $39.99/yr (72-hour trial) | Unstated | Verdict (Ready / Almost There / Needs a Change) + a score | **Closest positioning to Kitted** (see section). 18+ with Age Assurance |
| DRIP AI: Rate Your Fit | Ermal Nimani | 10 | 4.9 | $8.99/mo · $35.90/yr (3-day trial) | Unstated | Feedback on fit, colors, proportions; no number on page | Released Dec 23, 2025 |
| DRESSFIT: Outfit Rating & Tips | Avalanche Factory | 10 | 4.9 | (page not opened) | Unstated | Style score + tips | Last update Mar 28, 2025 (API) |
| Dripmax | Drip Max, Inc. | 9 | 5.0 | $3.99/wk · $9.99/mo · $39.99/yr | Unstated | Yes, out of 10 + fit/color analysis | Last update Dec 7, 2025 |
| Twirl - AI Outfit Rating | Rishi Gurjar | 8 | 4.9 | $59.00/yr | Unstated | Fit, color, trendiness, "spice", boldness | Last update Apr 9, 2025 |
| Fitcheck: Outfit Feedback | Arjun Mehta | 5 | 5.0 | Fitcheck Pro $2.99 | Unstated | Scores on fit/proportion, cohesion, color, trend | Last update Sep 6, 2024 |
| Style AI - Outfit Rating | Guy Haiby | 4 | 5.0 | $3.99/wk | Unstated | Out of 10 | Single version, Jul 15, 2025 |
| Mirror: Rate My Outfit | Avery Intelligence Inc | 1 | 5.0 | $4.99/wk (3-day trial) · $39.99/yr | Unstated | 1–100 + cohesion/fit/style-match | Last update Aug 26, 2025 |
| OuchFit: Outfit Rating, Roasts | Appside Limited | 1 | 5.0 | $6.99/wk · $49.99/yr | Unstated | "OuchFit Rating" + a roast | |
| Fashion Score: Outfit Rater | Arda Caglayan Ercan | 1 | 5.0 | $4.99/mo · $29.99 premium | Unstated | Out of 10 | Entertainment category |
| Rate My Outfit AI: DRPD | PhantomBuild OU | 0 shown | – | $3.99/wk · $29.99/yr (3-day trial) | Unstated | "Drip Score" out of 100 + one specific change, rescan to compare | Subtitle "Honest Score & Specific Fixes"; released Mar 7, 2026 |
| Endam: AI Outfit Rater | Voventech | 0 shown | – | $1.99/wk · $4.99/mo · $29.99/yr · $79.99 lifetime | Unstated | 0–100, by occasion | Released Jan 4, 2026 |
| Style Muse: Rate My Outfit | Burak Munteha Ellik | 0 shown | – | $4.99/wk · $14.99/mo · $99.99/yr | Unstated | 0–100 + 3 suggestions | Released Jun 14, 2026 |
| Outfit Score: Rate My Fit | Rafia Hossain Anika | 0 shown | – | $4.99/wk · $9.99/mo · $39.99/yr | Unstated | 0–100; A-vs-B "Fit Check"; "Roast Mode" | Released Aug 9, 2026 |
| Outfit Rating: AI Fit Check | Phuc Pham | 0 shown | – | $7.99/wk · $39.99/yr · $79.99 lifetime | Unstated | Overall + Fit, Color, Style, Vibe | Released Jun 13, 2026 |

"0 shown" = the page says "hasn't received enough ratings or reviews to display an overview."

### B. Men-specific style apps (none gives a numeric outfit score)

| App | Developer | US ratings | Avg | Pricing | Scores outfits? | Notes |
|---|---|---|---|---|---|---|
| Men's Outfit Planner - Suited | Richard Machemehl | 2 | 4.0 | $6.99/wk · $14.99/mo · $79.99/yr | "Quick Style Check" photo feedback, no number | Closet planner for men |
| Alice - AI Style for Men | Alice APP LLC | 1 | 1.0 | $27/mo · $77/yr | No | Outfits from your wardrobe; the one review says it "does nothing" |
| Styled — Men's AI Stylist | Jeremy Kirby | 1 | 5.0 | (page not opened) | No | One outfit at 7 am from calendar + weather (API description) |
| Olo (web, not App Store) | – | – | – | – | Outfit-photo feedback in chat | Men-only chat assistant; seen only in search snippets (Product Hunt, The Neuron newsletter Jun 8, 2026), unverified |

### C. Looksmax apps (big, male-skewed; they rate faces, not clothes)

| App | Developer | US ratings | Avg | Pricing | Rates outfits? | Notes |
|---|---|---|---|---|---|---|
| Umax - Become Hot | Improvement Tech | 51,620 | 4.6 | $3.99–$9.99/wk · $9.99–$24.99/mo · "You as a 10/10" $6.99 | No (face) | 18+. Last version Jun 28, 2024 |
| LooksMax AI | Mnkybrain Labs, Inc. | 42,720 | 4.5 | $3.99/wk · boosts $0.99–$5.99 | No (face) | Men ("Our focus is on aiding men"). Last version Apr 4, 2024 |
| LooksMax Face Rating AI－LooxUP | Look Style AI Studio | 36,902 | 4.5 | $1.99–$9.99/wk · up to $29.99 | Face only; "clothing style and accessories" as advice, no score | Both (women's version added v1.54) |
| UCHAD: See Your Potential | Promi LLC | 13,236 | 4.7 | $4.99–$9.99, $39.99; one-time unlock $9.99; gems | No (face, grooming, hair) | Male framing ("CHAD Mode"). Released Sep 11, 2025 |
| PSL - Looksmax & Ascend | IQ Labs LLC | 11,913 | 4.7 | $4.99/wk · $9.99/mo · $19.99–$29.99/yr · lifetime $39.99/$49.99 | No (face) | Released Nov 8, 2025 |

### D. Big style apps that do NOT score your outfit photo (for context)

| App | US ratings | Avg | What it does instead |
|---|---|---|---|
| Combyne | 87,677 | 4.8 | Build outfit collages, human likes/feedback (social) |
| Alta Daily: Digital AI Closet | 16,188 | 4.9 | AI outfits from your closet + avatar try-on; page describes no photo rating ("Best Dressed" feature unexplained); IAPs none listed |
| Whering | 11,882 | 4.7 | Digital closet, social styling |
| Style DNA: AI Stylist & Closet | 7,501 | 4.3 | Color/body/style profile from a selfie, daily outfits from closet, "Item match check" for shop items; no outfit-photo score |
| Acloset | 5,371 | 4.4 | Closet + AI chat ("does this match?", "Style Evaluation" in chat; no number shown) |
| Nines: Fit Checks | 71 | 4.6 | Free; people vote on each other's daily fits ("aura" points). Human, not AI |
| SLYDE - Rate Outfits | 92 | 3.6 | Human rating of outfits; last update Mar 2020 (dormant) |

Two pages returned 404 on Oct 12, 2026 (likely removed from the US store): **Fit Rate: AI Fashion Stylist** (id6746081861) and **Style AI - Style Scores & Tips** (id6740013981).

## The niche in numbers (from the Search API sweep, Oct 12, 2026)

- **107** apps whose name signals outfit rating ("rate", "score", "fit check", "drip", "roast", "judge"…), excluding face/hair/IV-drip apps.
- **64 of the 107 were released in 2026**, 27 in 2025, 13 in 2024.
- **58 of 107 show no US rating at all; 33 have 1–9; 12 have 10–49.** Only 4 have 50+, and none of those 4 is an AI rater (an outfit log, two human-voting apps, a shop-the-look finder).
- **1 of 107** mentions men in its description ("DripScore", 0 ratings).

## Per-app notes

### Dressly: AI Outfit Maker (TIKVEX LIMITED) — the biggest app with an outfit score
- URL: https://apps.apple.com/us/app/id6738174180 · released Nov 21, 2024 · v2.9.11 updated Oct 12, 2026 · 9+ · Lifestyle.
- What it does: selfie-based "find your colors" style profile, capsule wardrobe, try-on, shopping, and **Outfit Scoring** ("score it based on style, fit, and color harmony", API description).
- Target: not stated. ScreensDesign's walkthrough shows onboarding questions about body shape, petite fit, heels vs flats and dresses, so in my judgement it's women-leaning.
- Estimates: ScreensDesign lists **~$75k/month revenue, 45k installs** (no source or date given; https://screensdesign.com/apps/dressly-ai-outfit-stylist/, seen Oct 12, 2026). A search snippet claimed Lifestyle top-grossing #95 on Mar 12, 2026 (snippet, unverified).
- ScreensDesign also documents its funnel: long quiz → "Building Your Plan" → paywall with a free trial → account. This is the standard funnel in this category.
- Reviews: personal styling praised ("It's like going shopping", JessicaNC2020, Mar 13); **surprise charges** ("they will charge you again", Aydeno81, Feb 3; an add-on with "no indication of it being an add on", TerraCalaway, Jan 1).

### GRWM - AI Stylist (Aliaksei Karatkou) — the largest pure-play AI outfit rater
- URL: https://apps.apple.com/us/app/id6737596512 · released Nov 4, 2024 · v1.1.7 Aug 16, 2026 · 4+.
- Flow: mirror photo → pick what you're dressing for → ratings, a "potential" score and tips. **The page says tips and analysis need a subscription.**
- Pricing: 8 tiers, $3.99/wk up to $39.99/yr (Annual Premium mostly $29.99).
- Reviews: tips "feel super on-point" (Sarah_Miller05, 12/11/2024); subscription button bugs ("it wouldn't let me click it", David cobito, 08/03/2025); cost ("I can't afford that", Stars536, 05/02/2025).
- Estimates: none found.

### Fits – Outfit Planner & Closet (L. & J. Henne UG) — closet app with a "Rate outfit" chat
- URL: https://apps.apple.com/us/app/id6447482321 · released May 15, 2023 · v2.90.0 Oct 6, 2026 · 13+.
- Its help center says you tap "Rate outfit" under the AI stylist, send a selfie, and get a rating plus fixes "like tucking in a loose shirt" or swaps from your wardrobe (https://www.fits-app.com/knowledge/let-ai-rate-your-outfit). Its "Free vs paid" page says Pro includes "Unlimited AI styling chat"; whether free users can rate isn't stated. The store page doesn't mention rating.
- Estimates: Fits' own blog says Sensor Tower puts it at **~300k downloads/month (Sep 2026)** and the company claims 3M+ users and 20k+ App Store reviews worldwide (https://www.fits-app.com/posts/most-downloaded-closet-apps-in-2026; a vendor blog, treat with caution).
- Reviews: background removal praised; price ("I wish it was all free!", gabbie7906, 10/24/2025).
- Judgement: this is the closest big-app overlap with Kitted's "score + fixes from your closet" idea, but it needs you to digitise your closet first, and it's built for outfit logging, not beginner men.

### Pureple (Iceclip)
- URL: https://apps.apple.com/us/app/id628106373 · since 2013 · v6.0.23 updated about Oct 10, 2026 · 4+.
- The AI scores looks you assemble from your closet and gives "immediate, actionable tips." Most expensive yearly plan in the set ($89.99/yr).
- Reviews (old): suggestions "none of it goes together" (Kate The Squirrel, 2018); manual setup effort; ads.

### Looksee - Outfit Check (Kevin MacDonald) — closest positioning to Kitted
- URL: https://apps.apple.com/us/app/id6757265239 · released Jan 27, 2026 · v1.19 Sep 29, 2026 · **18+ with Age Assurance**.
- Full-body mirror photo (shoes in frame) → a verdict (Ready / Almost There / Needs a Change) and a score. **Premium unlocks "the First Fix"** (the one change that matters most), the full breakdown, follow-up chat and unlimited reads. "Feedback stays focused on the clothes." Completed looks stay on the phone.
- $4.99/wk or $39.99/yr, 72-hour trial. 10 ratings.
- Judgement: same pitch as Kitted (honest verdict + a fix, clothes not bodies, 18+), but it paywalls the fix and has no closet memory. Watch it.

### Rate My Outfit AI: DRPD (PhantomBuild OU)
- URL: https://apps.apple.com/us/app/rate-my-outfit-ai-drpd/id6759729079 · released Mar 7, 2026 · v1.5 Sep 5, 2026 · 4+.
- Drip Score out of 100, strongest category, sub-scores, and **one specific visible change, then rescan to compare**. $3.99/wk or $29.99/yr. No ratings shown.
- Judgement: same "score + specific fix + re-check" loop as Kitted, priced the same yearly ($29.99).

### FitMax: Rate Your Fit (Sahan Development LLC)
- URL: https://apps.apple.com/us/app/id6754903884 · released Dec 30, 2025 · v1.0.5 Sep 30, 2026 · 4+.
- Score from visual impact, trend relevance, color coordination, cohesion; shoppable suggestions; progress tracking. 38 ratings, 4.9.
- Reviews: "Really helped me discover what works well together" (Ayub Mohamud, 12/31/2025).

### Stylee - AI Fashion Scorer (SARAH Meacham)
- URL: https://apps.apple.com/us/app/id6760568827 · released Mar 26, 2026 · v2.0.1 Apr 17, 2026 · 9+.
- 1–10 score with a breakdown. 36 ratings, 5.0. All three visible reviews are dated Mar 30 (4 days after launch) and one says they're using a friend's app; in my judgement the rating is mostly friends-and-family.

### fitd. - rate your outfits (Adventure Labs d.o.o.)
- URL: https://apps.apple.com/us/app/fitd-rate-your-outfits/id6744093706 · released Apr 11, 2025 · v2.0.0 Aug 21, 2026 · 4+.
- Pick a style to match, photograph the outfit, get AI feedback; analysis requires a subscription. 9 "Unlimited access" price points ($3.99–$34.99).
- Reviews: "outfit battles" with friends (Xxxstaaa, 04/27/2025); confidence gains (jilliy19, 05/21/2025).

### Fit Score! AI Outfit Rating (Mustafa Anıl Kaya)
- URL: https://apps.apple.com/us/app/fit-score-ai-outfit-rating/id6758554007 · released Mar 9, 2026 · v1.1.22 Sep 17, 2026 · 9+.
- Out of 10 across 6 style categories. "Unlimited Style Scores Yearly" $29.99; "Yearly AI Stylist & Fit Scores" $59.99; weekly $5.99.
- Reviews: "The tips really helped" (CKSAVAGEEEEE, Mar 10).

### Beauty AI: Personal Stylist (David Voskanyan)
- URL: https://apps.apple.com/us/app/beauty-ai-outfit-closet/id6746948679 · released Jun 16, 2025 · 4+ · both men and women.
- Scores outfits, builds outfits, closet, shopping links. 17 ratings. Its blog (beautyai.app) runs "best outfit rating apps 2026" roundups that rank Beauty AI first, and these posts dominate search for the category. Treat them as marketing.

### DRIP AI: Rate Your Fit (Ermal Nimani)
- URL: https://apps.apple.com/us/app/-/id6747081636 · released Dec 23, 2025 · v1.2.4 Feb 14, 2026 · 4+.
- Feedback on fit, colors, proportions; the free tier allows up to 20 ratings a day (search snippet; the page says 3-day trial then subscription). $8.99/mo, $35.90/yr.
- The visible reviews are all dated Dec 25–26, 2025, 2–3 days after launch; in my judgement likely seeded.

### Rate My Outfit (Burak Akin)
- URL: https://apps.apple.com/us/app/rate-my-outfit/id6470764044 · released Aug 6, 2024 · v2.3.1 Apr 12, 2026 · 9+.
- Overall rating + per-piece feedback + occasion tips; $4.99/wk, $9.99/mo.
- Reviews: per-piece feedback "Super useful" (Kahioloren, 12/02/2024); paywall nags ("keeps saying you have to pay", Kc, 03/28/2025); **misreads** ("They just can't see well", Thefoxinatreee, Feb 21; a review the developer answered, about wrong colors and shoes).

### Small and dormant raters (one line each)
- **Twirl** (Rishi Gurjar), 8 ratings, $59/yr, rates fit, color, trendiness, "spice level", boldness, by occasion and skin tone; no update since Apr 9, 2025.
- **Fitcheck: Outfit Feedback** (Arjun Mehta), 5 ratings, $2.99 Pro, 4 categories; no update since Sep 6, 2024. One review asks for shopping links.
- **Dripmax** (Drip Max, Inc.), 9 ratings, out of 10 + tips, "no fashion jargon"; $39.99/yr.
- **Style AI - Outfit Rating** (Guy Haiby), 4 ratings, out of 10, $3.99/wk; one version (Jul 15, 2025); both reviews posted the same day.
- **Mirror: Rate My Outfit** (Avery Intelligence), 1 rating, 1–100 with sub-scores, $39.99/yr.
- **OuchFit** (Appside), 1 rating, "roast" plus a rating, $49.99/yr.
- **Endam** (Voventech), 0–100 by occasion, the only weekly price under $2 ($1.99) plus a $79.99 lifetime.
- **Style Muse**, **Outfit Score: Rate My Fit**, **Outfit Rating: AI Fit Check**, **Fashion Score**, **Rate My Outfit: AI Scanner** (Serkan Cay; $0.99–$24.99 "Unlimited access"): 2025–2026 launches with 0–1 ratings, all 0–100 or /10 scores.
- **GRWM -AI Styling Glow Up** (AlphaByte), 109 ratings, "AI-Style Check" score, try-on, makeup; no update since Jan 30, 2025.
- **Atricent** (244 ratings): reviews say the AI stylist "doesn't seem to remember me" (LCHutch, Jul 20) and "I cant find a button to cancel" (jenjeniscoolio, Mar 17).
- **Glam Guides** (157 ratings): women-first daily outfit feedback, no number; "The color tips are spot on" (puddingberryxo, 07/30/2025).
- **MogMax AI** (93 ratings): face + "Outfit Score", aggressive pack pricing up to $99.99; review doubts the scores ("Fake data spreading…", DucTheDuckkk, Mar 23).

### Men-specific apps
- **Suited** (https://apps.apple.com/us/app/mens-outfit-planner-suited/id6755077953): closet planner for men with weather and occasion, a "Quick Style Check" with no number. 2 ratings; review: "Good foundation and a lot of AI slop" (Oct 3). $79.99/yr.
- **Alice - AI Style for Men** (https://apps.apple.com/us/app/alice-ai-style-for-men/id6741170145): wardrobe-based suggestions, $27/mo, $77/yr; 1 rating (1.0).
- **Styled — Men's AI Stylist** (id6759204008): one outfit every morning from calendar + weather; 1 rating. Its pitch is close to Kitted's morning card (from the API description; page not opened).

### Looksmax apps (adjacent, not direct)
- **Umax - Become Hot** (https://apps.apple.com/us/app/umax-become-hot/id6471026798): 51,620 ratings, 4.6, 18+, face only. Reviews: per-scan charges ("you have to pay $5 PER SCAN"), ads that "call them ugly", crashes. **Estimates conflict badly:** co-founder Blake Anderson said in podcast interviews that Umax passed 10M downloads and earned ~$400–500K/month (peak ~$700K) (self-reported; seen in search snippets of podcast transcripts, unverified; e.g. https://scalenuggets.beehiiv.com/p/23yearold-whos-making-11myear-ai-apps), while ScreensDesign lists ~$65k/month and 35k installs (no source or date; https://screensdesign.com/apps/umax-become-hot/?vs=51228). Neither is audited; the versions page shows no update since Jun 2024.
- **LooksMax AI** (Mnkybrain Labs, id6474518292): 42,720 ratings, men-focused, face only, last version Apr 2024. ScreensDesign's page contradicts itself ($15K/mo and $55K/mo; 11K and 50K installs; https://screensdesign.com/showcase/looksmax-ai).
- **LooxUP** (id6478697267): 36,902 ratings; face rater that also lists "clothing style and accessories" as advice. Reviews: "I don't get the same results every time" (ImBeingRealDude, 11/07/2024); "charged … without the free trial" (OmarFaro, 04/27/2025).
- **UCHAD** (id6751680266): 13,236 ratings, 4.7, face/grooming only; the listing claims "5M+ scans" and "100,000+ users" (self-reported). Reviews: "need to pay for the results" (Mar 11).
- **PSL** (id6753061455): 11,913 ratings, face scans and routines; sells lifetime ($39.99/$49.99).

## Funding and press (found)
- **Style DNA:** TechCrunch, Jun 21, 2024 (Lauren Forristal): 3.2M downloads since 2022, 300k+ active users, 70k paying subscribers, €3.4M pre-seed (Black River Ventures); planned a male version. https://techcrunch.com/2024/06/21/style-dna-generative-ai-fashion-stylist-app
- **Alta:** $11M seed led by Menlo Ventures, June 2025 (TechCrunch headline via search; FashionUnited Jun 17, 2025: https://fashionunited.uk/news/business/alta-raises-11-million-in-seed-funding-for-ai-powered-personal-shopping-styling-app/2025061782265). A closet/shopping agent, not an outfit rater.
- **No funding or press found for any pure-play outfit-rating app.** Every pure rater found is an indie or small studio.
- **2026 launches in the niche:** 64 by name (see "The niche in numbers"), e.g. Looksee (Jan), Endam (Jan), Fit Score! (Mar), DRPD (Mar), Stylee (Mar), Style Muse (Jun), Outfit Rating: AI Fit Check (Jun), Outfit Score: Rate My Fit (Aug). None has passed 40 US ratings.

## Gaps and patterns (my judgement, based on the facts above)

1. **There is no leader in AI outfit rating.** The best-rated pure-play (GRWM) has 1,866 US ratings after nearly two years; 100+ clones launched in 2025–26 and most have no ratings. Building a rater is easy (a vision-model wrapper), but none has found distribution or retention. Kitted won't win on "AI rates your outfit" alone; it needs the TikTok channel and a reason to return.
2. **The paying, male, 18–30 "look better" audience exists, but it's in looksmax apps that rate faces.** Umax, LooksMax AI, LooxUP, UCHAD and PSL hold ~157k US ratings between them, while no men's outfit app has more than 2. Nobody serves "guys who want to look better without rating their face." Kitted's "never rate faces or bodies" line is a real position against that category, not just a policy.
3. **Most competitors paywall the result.** GRWM (analysis needs a subscription), fitd. (analysis needs a subscription), Looksee (the fix is premium), Umax (per scan), UCHAD ("need to pay for the results"). Kitted's free daily check with the score and at least one fix visible is a clear difference in a category where the first result is usually behind a trial.
4. **Consistency is a complaint and nobody claims it.** LooxUP ("I don't get the same results every time"), MogMax ("Fake data"), Rate My Outfit ("can't see well"). No listing promises the same score for the same photo. Kitted's deterministic, code-judged score is unclaimed, and worth saying in marketing.
5. **"Score + one specific fix + re-check" is no longer unique.** DRPD ("Honest Score & Specific Fixes", rescan to compare) and Looksee ("First Fix") already pitch it, and Fits gives fixes from your closet. Kitted's harder-to-copy parts are the closet that builds itself from fit-check photos (every closet app found requires manual uploads), the morning outfit card, beginner-plain wording, and the occasion-aware score.
6. **Pricing norm is weekly.** Most raters lead with $3.99–$11.99/week; yearly runs $19.99–$99.99 (most common $29.99–$39.99); a few sell lifetime ($39.99–$79.99). Kitted's $29.99/yr with no weekly plan is at the low, consumer-friendly end and matches DRPD and GRWM's main annual. Billing complaints (Dressly, Atricent, LooxUP, GRWM) are common, so plain trial terms are a trust advantage.
7. **Almost everything is gender-neutral or women-leaning.** Of 107 name-matched raters, one mentions men. The big style apps with scoring (Dressly, Glam Guides) lean women. The men-only apps (Suited, Alice, Styled, Olo) are tiny and none gives a score.
8. **Small-app ratings are unreliable.** Several apps' visible 5-star reviews all land within days of launch (DRIP AI, Stylee, Style AI). Treat any rating under ~100 as noise.
9. **Most raters are 4+; only Looksee and Umax are 18+.** Kitted's 18+ gate is in line with the apps that handle photos of real people most carefully.
10. **Category SEO is owned by competitors' own blogs** (beautyai.app, fits-app.com, stylepal.app, fashionadvice.ai each rank themselves first). Kitted won't get discovered through web search roundups; App Store search and short video matter more.

## Sources (all seen Oct 12, 2026 unless noted)

Apple data:
- iTunes Search API, US store, e.g. https://itunes.apple.com/search?term=rate+my+outfit&entity=software&country=us&limit=50 (28 terms; raw merged data kept in the session scratchpad, not in the repo)
- App Store pages (US): Dressly https://apps.apple.com/us/app/id6738174180 · GRWM - AI Stylist https://apps.apple.com/us/app/id6737596512 · Fits https://apps.apple.com/us/app/-/id6447482321 · Pureple https://apps.apple.com/us/app/id628106373 · Atricent https://apps.apple.com/us/app/id6448105847 · Glam Guides https://apps.apple.com/us/app/id6744360946 · GRWM -AI Styling Glow Up https://apps.apple.com/us/app/id6737396929 · MogMax https://apps.apple.com/us/app/id6480010751 · FitMax https://apps.apple.com/us/app/id6754903884 · Stylee https://apps.apple.com/us/app/id6760568827 · fitd. https://apps.apple.com/us/app/fitd-rate-your-outfits/id6744093706 · Beauty AI https://apps.apple.com/us/app/beauty-ai-outfit-closet/id6746948679 · Rate My Outfit https://apps.apple.com/us/app/rate-my-outfit/id6470764044 · Fit Score! https://apps.apple.com/us/app/fit-score-ai-outfit-rating/id6758554007 · Looksee https://apps.apple.com/us/app/id6757265239 · DRIP AI https://apps.apple.com/us/app/-/id6747081636 · Dripmax https://apps.apple.com/us/app/id6742699049 · Twirl https://apps.apple.com/us/app/-/id6743049586 · Fitcheck: Outfit Feedback https://apps.apple.com/us/app/-/id6572295055 · Style AI - Outfit Rating https://apps.apple.com/us/app/-/id6748058771 · Mirror https://apps.apple.com/us/app/mirror-rate-my-outfit/id6673901973 · OuchFit https://apps.apple.com/app/id6642680721 · Fashion Score https://apps.apple.com/us/app/fashion-score-outfit-rater/id6757362426 · DRPD https://apps.apple.com/us/app/rate-my-outfit-ai-drpd/id6759729079 · Endam https://apps.apple.com/app/endam/id6755446008 · Style Muse https://apps.apple.com/us/app/style-muse-rate-my-outfit/id6766219315 · Outfit Score https://apps.apple.com/us/app/outfit-score-rate-my-fit/id6789298942 · Outfit Rating: AI Fit Check https://apps.apple.com/us/app/outfit-rating-ai-fit-check/id6767791161 · Rate My Outfit: AI Scanner https://apps.apple.com/us/app/rate-my-outfit-ai-scanner/id6740042513 · Outfino https://apps.apple.com/us/app/id6736884918 · Suited https://apps.apple.com/us/app/mens-outfit-planner-suited/id6755077953 · Alice https://apps.apple.com/us/app/alice-ai-style-for-men/id6741170145 · Umax https://apps.apple.com/us/app/umax-become-hot/id6471026798 · LooksMax AI https://apps.apple.com/us/app/id6474518292 · LooxUP https://apps.apple.com/us/app/id6478697267 · UCHAD https://apps.apple.com/us/app/id6751680266 · PSL https://apps.apple.com/us/app/id6753061455 · Style DNA https://apps.apple.com/app/id1358319821 · Alta https://apps.apple.com/us/app/id6481705400 · Acloset https://apps.apple.com/us/app/id1542311809 · Nines https://apps.apple.com/us/app/id6736953764
- 404 on Oct 12, 2026: https://apps.apple.com/us/app/fit-rate-ai-fashion-stylist/id6746081861 · https://apps.apple.com/app/style-ai-style-scores-tips/id6740013981

Estimates, press, company pages:
- ScreensDesign (no stated source or date): Dressly https://screensdesign.com/apps/dressly-ai-outfit-stylist/ · Umax https://screensdesign.com/apps/umax-become-hot/?vs=51228 · LooksMax AI https://screensdesign.com/showcase/looksmax-ai
- Umax founder interviews (self-reported; search snippets only, unverified): https://scalenuggets.beehiiv.com/p/23yearold-whos-making-11myear-ai-apps · https://whop.com/blog/looksmaxxing-blake-anderson/
- Fits: https://www.fits-app.com/knowledge/let-ai-rate-your-outfit · https://www.fits-app.com/knowledge/free-vs-paid-features · https://www.fits-app.com/posts/most-downloaded-closet-apps-in-2026 (cites Sensor Tower, Sep 2026; vendor blog)
- TechCrunch, Style DNA, Jun 21, 2024: https://techcrunch.com/2024/06/21/style-dna-generative-ai-fashion-stylist-app
- FashionUnited, Alta $11M seed, Jun 17, 2025: https://fashionunited.uk/news/business/alta-raises-11-million-in-seed-funding-for-ai-powered-personal-shopping-styling-app/2025061782265
- Beauty AI roundup (vendor-written, updated Sep 3, 2026): https://beautyai.app/blog/best-outfit-rating-apps-2026
