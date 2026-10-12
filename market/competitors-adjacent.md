# Adjacent competitors: digital closets, AI stylists, AI fashion shopping

Research date: **Oct 12, 2026**. Scope: closet / wardrobe / AI-stylist / outfit-planning / AI fashion-shopping apps. Direct "rate my outfit" apps are covered only where they overlap (see §4).

**How to read this file**
- **App Store data** (rating count, average, age rating, price, listed in-app purchases) comes from the US App Store page (`apps.apple.com/us/app/id<ID>`) and Apple's public iTunes Lookup API (`itunes.apple.com/lookup?id=<ID>&country=us`), both pulled Oct 12, 2026. Exact counts come from the API; the page rounds them ("16K"). Age ratings come from the page, which uses Apple's new tiers (13+, 16+, 18+). The API still shows the old ones (12+, 17+).
- **In-app purchase prices** are the items the App Store lists, which can include old or A/B-test price points. They are not necessarily what a new user sees today.
- **Funding, user and revenue numbers** carry their source and date. **"(snippet, unverified)"** means I saw it only in a search-result summary or an aggregator (CB Insights, Caplight, Dealroom, Wellfound) and did not confirm it on a primary page. **"(self-reported)"** means the company's own claim.
- **Judgement** is labelled as such. Everything else is a sourced fact.

---

## 1. Summary table

Ratings are US App Store, Oct 12, 2026. "Closet from photos": **auto-from-outfit** = items pulled out of a photo of you wearing them (what Kitted does). **per-item photo** = you photograph each piece and AI cuts it out and tags it. **manual/catalog** = you pick from a database, receipts or links.

| App | Ratings (US) | Avg | Pricing (US, listed) | Men support (judgement) | Scores outfits? | Closet from photos? | Funding (sourced below) |
|---|---|---|---|---|---|---|---|
| **Alta Daily** (Flagship AI) | 16,188 | 4.88 | Free; no in-app purchases listed | Works for men; has a menswear blog post; marketing is women-first | No | Per-item photo (finds the original product image), receipts, database | $11M seed, Menlo lead (Jun 2025) |
| **Whering** | 11,882 | 4.67 | Free; credits $2.99–$12.99; "supporter" $0.99–$49.99; Outfit Maker $4.99 | No men's angle found; Gen Z, women-leaning | No | Per-item photo, database, retailer import. **"Gallery scanner" (items from camera-roll outfit photos) announced Jul 2026** | $7M seed, eBay Ventures + Google AI Futures Fund (Jul 7, 2026); 10M users (self-reported) |
| **Indyx** | 1,613 | 4.76 | $12.99/mo, $74.99/yr | Neutral copy; women-leaning marketing | No | Per-item photo, receipts, links, plus a paid in-home "Archivist" | Undisclosed pre-seed/seed, Alante Capital (2022) (snippet, unverified) |
| **Acloset** (Looko) | 5,371 | 4.45 | Free up to 100 items; Basic $3.99/mo or $27.99/yr; Premium $9.99/mo or $59.99/yr; Expert $24.99/mo or $147.99/yr | Neutral | No number; AI chat answers "does this match?" | Per-item photo | ~KRW 3.0B Series A (May 2022) (snippet, unverified); "4 million users" (self-reported) |
| **Style DNA** | 7,501 | 4.29 | $7.99–$19.99/mo; $29.99 or $39.99/yr; add-ons $9.99–$12.99 | **Explicitly "women and men"** | No | Per-item photo | €1.3M seed (Aug 2023) (snippet); 3.2M downloads, 70K paying (mid-2024, self-reported) |
| **Cladwell** | 1,027 | 4.26 | $2.99–$9.99/mo; $39.99 or $59.99/yr; weekly $7.99 | **Menswear explicit** (Style Map for womenswear or menswear) | No | Snap a photo or browse similar items | $1.7M–$3.65M total (snippet, unverified) |
| **Fits** (L. & J. Henne UG) | 5,596 | 4.59 | Fits Pro $9.99 / $29.99 / $59.99; AI credits $1.99–$79.99 | Neutral | No | Per-item photo with auto-tagging | None found; "2M+ users" (self-reported, snippet) |
| **OpenWardrobe** | 171 | 4.02 | Circle $12.99/mo, $79/yr, $199 lifetime | Neutral | No | Manual/per-item | Accelerator round, Loyal VC (Jan 2023), amount undisclosed (snippet) |
| **Stylebook** / **Stylebook Men** | 8,845 / 254 | 4.68 / 4.46 | $4.99 paid app (no subscription found) | **Separate men's app** | No | Per-item photo with AI background removal | None found (indie) |
| **Combyne** | 87,677 | 4.76 | Premium $2.99 / $19.99; "Superlikes" $0.99–$4.99 | Women-leaning (dresses, skirts; judgement) | Community likes and challenge ratings, not AI | Catalog collages (shop items), not your closet | $1.1M–$3.4M (aggregators conflict, snippet) |
| **Smart Closet** (Rabbit Tech) | 4,345 | 4.41 | $2.99 paid; sync $0.99/mo or $3.99 | Neutral | No | Manual/per-item photo | None found |
| **Pureple** | 6,118 | 3.94 | Weekly $6.99; yearly up to $89.99; "AI Style Advisor+" $39.99; Pro $14.99 | Neutral (also beauty and hairstyles) | **Yes**: "scoring the looks you assemble" and "Instant Outfit Feedback by AI" | Per-item photo, auto-categorize | None found; "3M+ people" (self-reported) |
| **Daydream** (Dahlia Labs) | 78 | 4.23 | Free; commission on sales | Brand list skews womenswear (judgement) | No | Not a closet app | $50M seed, Forerunner + Index co-lead (Jun 2024); 1.5M shoppers (Jul 2026, self-reported) |
| **Google Doppl** | n/a (removed) | n/a | Was free | n/a | No | No (try-on) | Google Labs; **shut down Apr 30, 2026** |
| **Glance** (InMobi) | 3,289 | 4.83 | Free | Neutral | No | No (selfie try-on feed) | Parent backed by Google ($145M, 2020) and Jio ($200M) (snippets) |
| **Stitch Fix** | 139,903 | 4.70 | Free app; pay per item or box | **Full men's line** (XS–3XL, Big + Tall) | No | No | Public: FY26 revenue $1,348.1M, 2.277M active clients |
| **Lyst** | 84,898 | 4.85 | Free | Men's and women's (judgement) | No | No | Acquired by ZOZO for $154M (Apr 2025) |
| **Phia** | 22,782 | 4.77 | Free (affiliate) | Neutral | No | No | $8M seed + ~$35M round; $43.5M total; ~$185M valuation |
| **Dressly** (Tikvex / Skelar) | 31,865 | 4.40 | Weekly $7.99–$11.99; $24.99–$34.99/mo; $55.99–$79.99/yr | Neutral; selfie colour analysis | **Yes**: scores style, fit and colour harmony | No real closet | ~$400K seed (Dealroom snippet) |
| **Fitted** | 1,157 | 4.48 | $2.49/wk, $9.99/mo, $38.99–$59.99/yr; credits | Neutral | No | **Yes, auto-from-outfit ("Fit Pic Magic")**, plus Gmail receipts | 600K+ downloads (Nov 2025); funding unclear |
| **Gensmo** | 1,757 | 4.68 | Credits $5–$50 | Neutral | No | No (shopping and try-on) | $60M+ seed (Jun 2025) |
| **Styled: Men's AI Stylist** (new) | 1 | 5.0 | $9.99/mo, $79.99/yr | **Men only** | No | Per-item photo | None found (solo) |
| **Grayne: Men's Outfit Planner** (new) | 10 | 5.0 | **$5.99/mo, $39.99/yr**, 7-day trial | **Men only** | No | Per-item photo | None found (solo) |
| **Twelve70** ("Men's Pocket Stylist") | 32 | 4.22 | $4.99/mo, $39.99/yr | **Men only** | No | No photos (pick from a list) | None found |

---

## 2. One section per app

### Alta (Alta Daily: Digital AI Closet)
- **Developer / store:** Flagship AI, Inc. · [App Store id6481705400](https://apps.apple.com/us/app/alta-daily-digital-ai-closet/id6481705400) · 16,188 ratings, 4.88 · 13+ · Free. The page lists no in-app purchases. The page shows a "#58 Lifestyle" chart badge. First released Mar 13, 2025; v2.2.5 on Oct 1, 2026.
- **What it does:** An AI stylist that builds outfits from your closet using lifestyle, budget, occasion and weather. Packing lists, gap-filling shopping picks, and an avatar try-on.
- **Closet entry:** Forward email receipts, pick from Alta's database, or photograph an item so Alta finds the original product image. Background removal and auto details (fabric, fit). Per-item; it does not read pieces off an outfit photo.
- **Scores outfits:** No (App Store description).
- **Men:** The description never mentions men. Alta does publish a men's landing post, "The Best AI Outfit and Styling App for Men" (Nov 22, 2025) ([altadaily.com/blog/menswear](https://www.altadaily.com/blog/menswear)). *Judgement:* it works for men, but the brand, investors and press are women-fashion led.
- **Funding:** **$11M seed led by Menlo Ventures**, with Aglaé Ventures (Arnault-backed), Benchstrength, Conviction, Phenomenal Ventures and angels including Karlie Kloss and Tony Xu. Founder Jenny Wang ([FashionUnited, Jun 17, 2025](https://fashionunited.com/news/business/alta-raises-11-million-in-seed-funding-for-ai-powered-personal-shopping-styling-app/2025061766632)). Preqin dates the round to April 2026, which looks like an error (snippet).
- **Users / revenue:** None found.
- **News:** TIME Best Inventions 2025 "special mention" and a Fast Company "Next Big Things in Tech" listing, per Alta's own Oct 22, 2025 press release (self-reported; [press release](https://markets.financialcontent.com/pennwell.elp/article/abnewswire-2025-10-22-time-magazine-and-fast-company-have-selected-ai-styling-app-alta-for-their-lists-of-best-inventions-and-next-big-things-in-tech-of-2025)). e.l.f. was named its first beauty brand partner (snippet, [retailboss tag page](https://retailboss.co/tag/alta/), date not confirmed).

### Whering
- **Store:** Whering Ltd · [id1519461680](https://apps.apple.com/us/app/whering-your-digital-closet/id1519461680) · 11,882 ratings, 4.67 · 13+ · Free with in-app purchases: credits (10 / 50 / 100 for $2.99 / $7.99 / $12.99), "Supporter" tiers ($0.99, $9.99, $14.99, $29.99, $49.99) and Outfit Maker $4.99. v3.4.147 on Oct 7, 2026.
- **What it does:** A digital wardrobe with a 100M-item database, retailer import and a Chrome extension. Background removal, outfit planner, lookbooks, packing lists, cost-per-wear analytics, a social closet, and a seasonal "Unpacked" recap.
- **Scores outfits:** No.
- **Men:** No men-specific features found. *Judgement:* women-leaning, Gen Z audience.
- **Funding:** **$7M seed led by eBay Ventures and Google AI Futures Fund**, announced Jul 7, 2026, with **10 million users globally** (self-reported) ([tech.eu, Jul 7, 2026](https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/); [FashionUnited](https://fashionunited.com/news/business/whering-secures-funding-from-ebay-ventures-and-google-ai-futures/2026070773352)). Total raised about $14M (snippet, unverified).
- **Planned features (key for Kitted):** a **"gallery scanner" that pulls individual items out of outfit photos in your camera roll**, virtual try-on, mood/weather/occasion suggestions and image enhancement (FashionUnited, tech.eu above).

### Indyx
- **Store:** Indyx Inc. · [id1599179405](https://apps.apple.com/us/app/indyx-wardrobe-outfit-app/id1599179405) · 1,613 ratings, 4.76 · 4+ · Monthly Membership $12.99, Annual $74.99. v9.8.3 on Sep 26, 2026.
- **What it does:** A wardrobe app with photo, receipt and link import, auto background removal and AI tagging into "editorial flatlays". Calendar, cost-per-wear, collections and packing, a style quiz and an 8-week style workshop. Paid human styling (a "Lookbook" of 10 outfits) and an **in-home Archivist** who digitizes your closet for you. A first resale event, "Indyx Closet Sale" (App Store description and version notes).
- **Scores outfits:** No. **Men:** neutral copy. *Judgement:* women-leaning.
- **Funding:** Undisclosed pre-seed/seed led by Alante Capital, Jul 2022 (snippet, unverified; [yespress](https://yespress.io/indyx), [Caplight](https://www.caplight.com/company/indyx)). No 2025–2026 news found.

### Acloset
- **Store:** Looko Inc. (Korea) · [id1542311809](https://apps.apple.com/us/app/acloset-ai-fashion-assistant/id1542311809) · 5,371 ratings, 4.45 · 4+ · Free up to 100 items. Basic $3.99/mo or $27.99/yr, Premium $9.99/mo or $59.99/yr, Expert $24.99/mo or $147.99/yr, plus "beans" $1.99–$9.99. v6.41.1 on Oct 12, 2026.
- **What it does:** A digital closet and an AI stylist chat ("what should I wear today?", "does this match?"), personal-colour and "fit diagnosis", weather and schedule outfit ideas, outfit calendar, cost-per-wear, community. Version notes mention an AI shopping advisor, a try-on avatar and packing (search snippet).
- **Scores outfits:** No numeric score in the listing. The chat gives match opinions.
- **Men:** neutral.
- **Users / funding:** "community of 4 million users" (self-reported, App Store description). A KRW 3.0B Series A from KT Investment and Laguna Investment in May 2022, and $2.81M total per Caplight (snippet, unverified; [Caplight](https://www.caplight.com/company/acloset)).

### Style DNA
- **Store:** AI Style by DNA S.L. (Barcelona) · [id1358319821](https://apps.apple.com/us/app/style-dna-ai-stylist-closet/id1358319821) · 7,501 ratings, 4.29 · 16+ · Listed: monthly $7.99, $9.99 or $19.99; 3 months $14.99 or $19.99; 6 months $29.99; annual $29.99 or $39.99; add-ons $9.99–$12.99.
- **What it does:** A selfie-based colour season, body type and style type profile; an AI chatbot; 5 daily outfits from your closet; shopping filtered to your profile; an in-store "does this suit me?" check.
- **Men:** **the description says "for women and men."**
- **Scores outfits:** No.
- **Numbers:** 3.2M downloads, 300K active users and **70K paying subscribers as of mid-2024** (self-reported, in [Mercado&Consumo, May 22, 2026](https://mercadoeconsumo.com.br/22/05/2026/inovacao/style-dna-um-personal-stylist-com-ia-que-cria-um-perfil-de-estilo-a-partir-de-uma-selfie/)). Funding: a €1.3M seed (Aug 2023, Black River Ventures) per [Catalonia Startup Hub](https://startupshub.catalonia.com/startup/barcelona/style-dna/4776) (snippet), or $4.11M per CB Insights (snippet). Sources conflict.

### Cladwell
- **Store:** Cladwell, Inc. · [id1140550878](https://apps.apple.com/us/app/cladwell/id1140550878) · 1,027 ratings, 4.26 · 4+ · Listed: $2.99, $7.99 or $9.99 a month, $21.99 a quarter, $39.99 or $59.99 a year, and a $7.99 weekly membership. v5.15.0 on Oct 12, 2026; it is now titled "Cladwell: AI Stylist & Outfits".
- **What it does:** A capsule wardrobe, a style quiz giving a "Style Map", a colour season, "See it on me", the "Ask Cladwell" AI chat, and daily outfits by weather.
- **Men:** **explicit: the Style Map is for womenswear or menswear.** A recent update added menswear content (snippet).
- **Scores outfits:** No.
- **Funding:** $1.7M per [Wellfound](https://wellfound.com/company/cladwell/funding) or $3.65M per [CB Insights](https://www.cbinsights.com/company/cladwell/financials) (snippet, unverified).
- **Reviews:** users complain that $60 a year is too much for the value (snippet of App Store reviews).

### Fits
- **Store:** L. & J. Henne UG (Germany) · [id6447482321](https://apps.apple.com/us/app/fits-outfit-planner-closet/id6447482321) · 5,596 ratings, 4.59 · 13+ · Fits Pro $9.99, $29.99 or $59.99; AI credits $1.99–$79.99.
- **What it does:** A closet that auto-detects type, colour and brand, swipe-to-build outfits, an AI stylist, a calendar, OOTD sharing and virtual try-on.
- **Scores outfits:** No. **Men:** neutral.
- **Users:** "loved by over 2 million users" (self-reported, [fits-app.com](https://fits-app.com/fits-vs-whering), snippet). No funding found.

### OpenWardrobe
- **Store:** OpenWardrobe, Inc. (Redwood City) · [id1549029468](https://apps.apple.com/us/app/openwardrobe-outfit-planner/id1549029468) · 171 ratings, 4.02 · 4+ · Circle $12.99/mo, $79/yr or **$199 lifetime**.
- **What it does:** Wardrobe organizing, outfit grids, wear and resale value, the "LolaAI" stylist, Poshmark resale, and booking alterations in the US.
- **Scores outfits:** No. **Funding:** accelerator round with Loyal VC, Jan 2023, amount undisclosed ([Caplight](https://www.caplight.com/company/openwardrobe), snippet).

### Stylebook / Stylebook Men
- **Store:** left brain / right brain, LLC · [Stylebook id335709058](https://apps.apple.com/us/app/stylebook/id335709058) 8,845 ratings, 4.68, 9+, **$4.99 paid** (the page shows a "#3 Lifestyle" chart badge). [Stylebook Men id515126225](https://apps.apple.com/us/app/stylebook-men/id515126225) 254 ratings, 4.46, $4.99 ("#22 Lifestyle" badge). Both last updated Jun 2025.
- **What it does:** A manual closet with AI background removal, outfit calendar, packing and cost-per-wear. No AI styling claims. **The only long-running men's-branded closet app**, and it is small.

### Combyne
- **Store:** combyne GmbH (Munich). The page footer says "© 2025 SIA URSTYLE". · [id989727742](https://apps.apple.com/us/app/combyne-your-perfect-outfit/id989727742) · 87,677 ratings, 4.76 · 4+ · Premium $2.99 or $19.99; Superlikes $0.99–$4.99.
- **What it does:** A social outfit-collage maker from 800+ brands' products, with daily challenges where users **rate each other's looks**. Shoppable.
- **Men:** *Judgement:* women-leaning (the categories listed are dresses, skirts, etc.).
- **Funding:** aggregators range from $1.1M to $3.4M (snippet, conflicting; [Seedtable](https://seedtable.com/companies/combyne), [CB Insights](https://www.cbinsights.com/company/combyne/financials)). I found no confirmation of who owns it now, beyond the copyright line.

### Smart Closet
- **Store:** Rabbit Tech Inc · [id1198057728](https://apps.apple.com/us/app/smart-closet-your-stylist/id1198057728) · 4,345 ratings, 4.41 · 16+ · **$2.99 paid**, plus sync $0.99/mo or $3.99 (the description says $9.99/yr) · last updated Nov 10, 2025 · "#14 Shopping" chart badge on the page.
- A manual closet with brand catalog, background removal, random looks by rules, calendar and packing. No AI scoring.

### Pureple
- **Store:** ICECLIP LLC · [id628106373](https://apps.apple.com/us/app/pureple-outfit-planner/id628106373) · 6,118 ratings, **3.94** · 4+ · Weekly $6.99, yearly $89.99, other subscriptions $34.99–$62.99, "AI Style Advisor+" $39.99, Pro $14.99.
- **What it does:** Snap clothes once, then an AI stylist **"scoring the looks you assemble"**, **"Instant Outfit Feedback by AI: snap or build a look and get immediate, actionable tips"**, AI try-on on a model, calendar and packing.
- **Users:** "Trusted by 3M+ people" (self-reported). No funding found.
- *Judgement:* the oldest closet app now copies the fit-check feature. Its low average (3.94) suggests the execution is weak.

### Daydream (AI fashion search)
- **Store:** Dahlia Labs, Inc. · [id6692634357](https://apps.apple.com/us/app/daydream-ai-for-fashion/id6692634357) · **78 ratings**, 4.23 · 4+ · Free, no in-app purchases (iOS app released Nov 17, 2025).
- **What it does:** Chat-to-shop and screenshot-to-shop across 10,000+ brands, with no ads. It takes **a percentage cut of each sale** ([TechCrunch, Jun 25, 2025](https://techcrunch.com/2025/06/25/julie-bornsteins-daydream-is-releasing-an-ai-powered-chatbot-for-fashion-related-shopping)).
- **Men:** men's was reported in the catalog at launch (snippet, unverified). The App Store brand list is womenswear-heavy (judgement).
- **Funding:** **$50M seed co-led by Forerunner and Index, with GV and True** (announced Jun 2024; [Index Ventures](https://www.indexventures.com/perspectives/bringing-ai-to-the-fashion-industry-our-investment-in-daydream/)). Founder Julie Bornstein (ex-Stitch Fix, Sephora; The Yes, sold to Pinterest).
- **2026 news:** "exited beta", **1.5M+ shoppers**, 325 retailers, 10,000+ brands, 3M products, and a B2B "Powered by Daydream" program ([PR, Jul 29, 2026](https://www.webull.com/news/15310957041558528)). iOS 27 Siri AI integration and a "shoppable camera roll" (Sep 30, 2026, snippet). Puck ran a critical piece, "Requiem for Daydream" (Mar 2026; [puck.news](https://puck.news/does-anyone-actually-want-ai-to-help-them-shop/), paywalled, not read).
- *Judgement:* 78 iOS ratings against 1.5M claimed shoppers suggests most use is on the web, or the app is a low-engagement shopping habit.

### Google Doppl (virtual try-on)
- **Status: shut down.** Google Labs announced on X (Mar 23, 2026) that Doppl would close **Apr 30, 2026**, pointing users to virtual try-on in Google Search and Shopping ([Jetstream, Mar 24, 2026](https://jetstream.blog/2026/03/24/google-doppl-shut-down-end-of-april-2026/), citing [Google Labs on X](https://twitter.com/GoogleLabs/status/2036188820128071786)). Corroborated today: the US App Store page for id6741596720 returns 404, and labs.google/doppl returns 404.
- **History:** launched Jun 26, 2025, US only, 18+. Full-body photo plus outfit screenshots produced AI try-on images and video ([TechCrunch, Jun 26, 2025](https://techcrunch.com/2025/06/26/google-launches-doppl-a-new-app-that-lets-you-visualize-how-an-outfit-might-look-on-you)). A shoppable discovery feed was added Dec 2025 ([Google blog](https://blog.google/technology/google-labs/discover-new-outfits-try-them-on-and-shop-from-doppls-new-discovery-feed/)).
- *Judgement:* Google's try-on now sits inside Search for free, so a standalone try-on app is a weak business. That is a reason for Kitted not to lead with try-on.

### Glance (Glance AI, InMobi)
- **Store:** GLANCE INMOBI PTE LTD · [id6742974181](https://apps.apple.com/us/app/glance-my-personal-shopper/id6742974181) · 3,289 ratings, 4.83 · **18+** · Free.
- **What it does:** A personal-shopper feed (fashion, beauty, home) with selfie-based "styled try-ons" generated on the device, plus Siri AI ("Hey Siri, Let's Glance") per the description. Built on Gemini and Imagen.
- **Numbers:** opt-in on an estimated **50M Samsung Galaxy devices in the US**, 400+ brands ([Digital Commerce 360, Jun 4, 2025](https://www.digitalcommerce360.com/2025/06/04/samsung-glance-launch-ai-shopping-tool/)). "1.5M active users" in its first weeks (May 2025 press release, snippet, unverified).
- **Parent funding:** $145M from Google and Mithril (Dec 2020) ([Entrepreneur India](https://india.entrepreneur.com/en-in/news-and-trends/inmobi-groups-glance-raises-145-mn-from-google-and/362172), snippet); $200M from Jio ([Inc42](https://inc42.com/?p=277142), snippet, date not confirmed).
- **Scores outfits:** No. **Closet:** none.

### Stitch Fix (men's)
- **Store:** [id1022579925](https://apps.apple.com/us/app/stitch-fix-personal-styling/id1022579925) · **139,903 ratings, 4.70** · 13+ · Free app; items "start around $28".
- **Men:** a full men's line, XS–3XL, waists 28–48, Big + Tall (App Store description).
- **AI:** "Stitch Fix Vision" (Oct 2025) generates images of you in recommended outfits from a selfie, and "See it on me" expanded across Freestyle (Jun 24, 2026) ([FashionNetwork, Jun 25, 2026](https://us.fashionnetwork.com/news/Stitch-fix-expands-ai-styling-tool-with-personalized-outfit-visualization-feature,1847029.html)). A StyleFile AI profile for women and men ([Glossy](https://www.glossy.co/fashion/stitch-fix-introduces-ai-driven-customer-profiles-amid-revenue-decline), snippet).
- **Financials:** **FY2026 (ended Aug 1, 2026) net revenue $1,348.1M (+6.4%), 2.277M active clients (−1.4%), net loss $12.6M. FY27 guidance $1.31–1.36B**, which is −2.8% to +0.9% ([8-K, Sep 23, 2026](https://www.sec.gov/Archives/edgar/data/0001576942/000162828026063208/exhibit991-fy26.htm)). The men's business had double-digit growth in Q1 FY26 (snippet of the earnings call, unverified).
- *Judgement:* the incumbent for "dress me" for men, but it sells clothes. It does not review what you already wear.

### Lyst
- **Store:** [id597940518](https://apps.apple.com/us/app/lyst-dont-shop-around/id597940518) · 84,898 ratings, 4.85 · 4+ · Free.
- **Acquired by ZOZO for $154M** (agreement Apr 9, 2025). It stays standalone in London. ZOZO funds its AI discovery and adds sizing and fit tech. Lyst says it reaches 160M shoppers a year and 27,000 brands ([Lyst, Apr 9, 2025](https://www.lyst.co.uk/news/lyst-zozo/)). It had raised at about $700M in 2021 (snippet, [Seedtable](https://seedtable.com/exits/lyst)).
- **AI stylist:** AI search and discovery, not a closet or outfit review. Not a direct threat.

### Phia
- **Store:** "Renaissanse Inc." · [id6739351340](https://apps.apple.com/us/app/phia-fashion-deals-rewards/id6739351340) · 22,782 ratings, 4.77 · 16+ · Free · "#109 Shopping" badge.
- **What it does:** an AI shopping agent that compares retail and resale prices and applies coupons. No styling or closet.
- **Funding:** $8M seed led by Kleiner Perkins (Sep 2025; [Digital Commerce 360](https://www.digitalcommerce360.com/2025/09/18/phia-raises-8-million-to-scale-ai-shopping-platform/amp/), snippet). A **~$35M round led by Notable Capital at a ~$185M valuation** ([Fortune, Feb 21, 2026](https://fortune.com/2026/02/21/phoebe-gates-startup-phia-succeed-without-help-parents-bill-gates-melinda-french-gates), snippet). Shopifreaks (Jun 6, 2026) calls it a $35.5M Series A, puts the **total at $43.5M** and reports **1.5M users** ([Shopifreaks](https://www.shopifreaks.com/phia-the-ai-shopping-app-from-phoebe-gates-and-sophia-kianni-raises-a-35-5m-series-a-backed-by-a-long-list-of-celebrity-investors/)). The round labels conflict; the totals agree.
- *Judgement:* not a competitor on styling, but it shows investors pay up for AI fashion when distribution comes from celebrities and creators.

### Dressly (adjacent app that already scores outfits)
- **Store:** TIKVEX LIMITED (Cyprus; a Skelar venture-builder app per [Dealroom](https://app.dealroom.co/companies/dressly), snippet) · [id6738174180](https://apps.apple.com/us/app/dressly-ai-outfit-maker/id6738174180) · **31,865 ratings, 4.40** · 9+ · weekly $7.99 or $11.99, monthly $24.99 or $34.99, yearly $55.99 or $79.99, colour scanner $9.99 · "#198 Lifestyle" badge.
- **What it does:** selfie colour and body analysis, and **"Outfit Scoring: upload or snap a picture of your outfit, and Dressly will score it based on style, fit, and color harmony"**, plus lookbooks and shopping. No real closet.
- **Funding / revenue:** ~$400K seed (Dealroom, snippet). A "$75k revenue" estimate from a third-party tracker has no stated period ([screensdesign](https://screensdesign.com/apps/dressly-ai-outfit-stylist/), snippet, unreliable).
- *Judgement:* the biggest app in this scope with a fit score. It earns on weekly subscriptions and the paywall comes first, the opposite of Kitted's "never charge to see a score".

### Fitted (closest to Kitted's "closet from your fit pics")
- **Store:** Chute Laundry Inc / "Fitted Virtual Closet" · [id6596771952](https://apps.apple.com/us/app/fitted/id6596771952) · 1,157 ratings, 4.48 · 4+ · $2.49/wk, $9.99/mo, $38.99 or $59.99/yr; AI credits $1.99–$19.99.
- **What it does:** **"Fit Pic Magic": upload a photo of yourself in an outfit and AI extracts each piece into flat-lays.** Also Gmail receipt import, "Ask Fitted" chat by weather and occasion, a digital-twin try-on, and public closets.
- **Numbers:** **600K+ downloads**, growth from organic TikTok and about $20 creator videos (Superwall blog, Nov 22, 2025, [superwall.dev](https://superwall.dev/blog/how-reid-moncada-built-a-viral-ai-fashion-app-that-hit-600k)). The same post says paywalls were removed at that time, but the store lists subscriptions today. Funding: aggregators conflict, and Caplight's $13.15M figure is doubtful (snippet, unverified).
- **Scores outfits:** No.
- **Deep dive (Claude, Oct 12, after the founder asked):**
  - **Listing:** Apple's lookup API says "Fitted — AI Closet. Digital Twin. Style Assistant." Lifestyle, 4+, released Feb 7, 2025, v11.8 on Aug 22, 2026. Features:
    - Fit Pic Magic
    - Gmail import
    - "Ask Fitted" chat by weather and occasion
    - a Smart Outfit Generator (shuffle, lock pieces)
    - a trip planner
    - a digital-twin try-on from a face and body photo
  - **Founder story** (the Superwall post, re-read today):
    - founder Reid Moncada (previously a dorm laundry service in 18 cities)
    - "over 600,000 downloads", "500 million views", "over two million pieces" uploaded
    - creators paid about $20 a video to test, winners boosted with ads, downloads at "1 to 15 cents each" (self-reported)
    - the fashion creator Max Gomez went from paid creator to co-founder with equity
    - a crypto token, "Fitcoin"
    - "now free to use, with paywalls removed". Subscriptions are listed again today.
  - **Reviews:** the 180 most recent US reviews (Feb 2025 – Aug 2026, Apple's review feed) are 57% 5★ and 30% 1–2★.
    - Keyword counts: charges/subscriptions 41, bugs/sign-in/slow processing 48, closet/upload 53. "Fit Pic Magic" or extraction is never mentioned by name.
    - Hand-read complaints: charged for over a year, sign-in timeouts, one photo processed at a time, graphic tees cut wrong ("cuts the graphic out and gets rid of the tee"), "doesn't know what a shirt is".
    - The audience reads young and mixed-gender (college students, "bro").
  - **Ratings vs downloads:** 600K+ downloads and ~1,150 ratings is roughly 1 rating per 500 downloads (one data point).
  - *Judgement:* the closest grown competitor to Kitted's closet side, and medium threat. If it added a fit score, it would be the nearest rival.

### Gensmo
- **Store:** Serendipity One Inc. · [id6636520663](https://apps.apple.com/us/app/gensmo-ai-stylist-try-on/id6636520663) · 1,757 ratings, 4.68 · 13+ · credits $5–$50.
- An AI shopping agent (snap-to-shop, try-on, walk videos, couple try-on). **$60M+ seed** (Jun 2025; founder Ning Hu, ex-Google/Alibaba) ([FashionUnited](https://fashionunited.com/news/business/ai-powered-fashion-agent-gensmo-secures-60-million-dollars-in-funding/2025062766848)). Investors not named.

### New men-only entrants (2025–2026), all tiny so far
- **Styled: Men's AI Stylist** (Jeremy Kirby / Kirby Holdings) · [id6759204008](https://apps.apple.com/us/app/id6759204008) · released Feb 24, 2026 · **1 rating** · $9.99/mo, $79.99/yr. Pitch: "a personal AI stylist for ambitious men". **One outfit every morning at 7 AM, checked against weather and calendar, from clothes you photograph once**, plus chat follow-ups. The listing says its styling model is Claude (Anthropic). It targets founders, executives and lawyers, not beginners or 18–22.
- **Grayne: Men's Outfit Planner** (Christopher Shepard / Herding Lab) · [id6758533844](https://apps.apple.com/us/app/id6758533844) · released Feb 27, 2026 · 10 ratings · **$5.99/mo, $39.99/yr, 7-day trial** (the same monthly price as Kitted Pro). Free: unlimited closet, a daily weather outfit, and 3 "Style Me" a week. Local-first, AI photo analysis needs consent, no shopping links.
- **Twelve70: Outfit Generator**, subtitle **"Men's Pocket Stylist"** · [id6478133766](https://apps.apple.com/us/app/id6478133766) · Jul 2024 · 32 ratings · $4.99/mo, $39.99/yr. A menswear "outfit calculator", no photos.
- Also seen, each with 1–2 ratings: "Men's Outfit Planner - Suited" (id6755077953), "Alice - AI Style for Men" (id6741170145), "Color analysis - Daily Male" (id6741358608). **Olo**, described as a web chat "AI style companion for men", appears only on aggregator sites (snippet, unverified; no US App Store listing found).

### Other AI-stylist apps with traction (same scope, briefly)
| App | Ratings / avg | Price | Note |
|---|---|---|---|
| GRWM - AI Stylist ([id6737596512](https://apps.apple.com/us/app/id6737596512)) | 1,866 / 4.58 | $3.99/wk; $6.99–$12.99/mo; $19.99–$39.99/yr | **Mirror photo, pick an occasion, get "ratings and tips"; tips need a subscription.** The same core loop as Kitted |
| Essembl ([id6479642952](https://apps.apple.com/us/app/id6479642952)) | 4,653 / 4.54 | $9.99/wk; $29.99–$59.99/yr | Outfit planner (Switzerland) |
| Closetly ([id6744034749](https://apps.apple.com/us/app/id6744034749)) | 1,947 / 4.57 | $7.99/mo; $29.99–$59.99/yr | Hard paywall ("subscription required") |
| DLOOK ([id6745005234](https://apps.apple.com/us/app/id6745005234)) | 1,324 / 4.80 | $9.99/wk; $59.99–$69.99/yr | Try-on and capsule |
| Lumi ([id1637080045](https://apps.apple.com/us/app/id1637080045)) | 16,484 / 4.04 | $49.99/mo; $199.99/yr | High-price styling plan |
| shoppin ([id6738202299](https://apps.apple.com/us/app/id6738202299)) | 13,641 / 4.74 | Free | AI-styled shopping (India-based) |

---

## 3. What this means for Kitted

**Verified facts behind these takeaways:** none of the 20+ adjacent apps checked is built for **beginner men aged 18–30 with a fit score plus a closet that fills itself**. The apps that score outfits (Dressly, Pureple, GRWM) are gender-neutral, closet-light and paywall-first. The men-only apps (Styled, Grayne, Twelve70, Stylebook Men) have 1–254 ratings and none scores outfits.

### Threats (ranked, judgement)
1. **Whering's "gallery scanner" (announced Jul 2026, 10M users, Google + eBay money)** and **Fitted's "Fit Pic Magic" (live, 600K+ downloads)** both chip at "the closet learns itself from your photos". Once Whering ships, that claim is no longer unique. *Response:* lead with the score and fixes. The closet that fills itself becomes the reason to stay, not the headline, and its edge is that it needs zero extra effort: Kitted builds it from fit checks the user was taking anyway, with no cataloguing step.
2. **Alta** (4.88 from 16K ratings, $11M, a menswear landing page, free) is the best-funded "AI stylist from your closet". If it adds a fit check and men's marketing, it is the most dangerous. *Today* its funnel is women-first and it doesn't score outfits.
3. **Dressly-style apps (31.9K ratings) already sell "score my outfit"** behind weekly paywalls ($7.99–$11.99/wk). Users already know the idea, which helps, but App Store search results for "outfit score" are crowded. Kitted's honest edges: a **steady score** (same photo, same score), **specific fixes**, and **free scoring**.
4. **Platform AI:** Google moved try-on into Search and killed Doppl. Daydream and Glance both added **Siri AI on iOS 27**. General assistants (Siri, Gemini, ChatGPT) can give a one-off "how do I look?". *Response:* compete on consistency, memory of his closet and a daily habit (the morning card), which one-off chats don't give.
5. **Styled** (launched Feb 2026) copies Kitted's morning-card idea for men and uses Claude. It is small (1 rating) and aimed at executives at $79.99/yr, but it shows the idea is easy to copy.

### Openings
- **Men are underserved by funded players.** Every funded closet or stylist app (Alta, Whering, Indyx, Acloset, Phia, Daydream) markets women-first. Men's support is either a toggle (Cladwell, Style DNA) or a separate tiny app (Stylebook Men, 254 ratings). **Beginner** men aged 18–30 are not anyone's stated target.
- **Price room.** Kitted Pro at **$29.99/yr** sits at the bottom of the yearly range seen here ($27.99 Acloset Basic up to $89.99 Pureple, $199.99 Lumi). Most rivals use weekly plans or credits. Grayne matches the $5.99/mo price but with no score. A free daily score is unusual: Dressly, GRWM and Closetly gate it.
- **Scoring quality is unproven everywhere.** Acloset reviews complain about absurd suggestions (snippet: a summer dress with a puffer at 20°F). Pureple averages 3.94. Style DNA users report about 50/50 item matching (snippet). No rival shows a "same photo, same score" guarantee or explains its score part by part. Kitted's "the code judges" design is a real, demo-able difference. Show it in videos (same fit twice, same 7.5).
- **Distribution playbook proven:** Fitted reached 600K downloads mostly through organic TikTok and about $20 creator videos (Superwall, Nov 2025). That matches the founder's $0-budget daily-video plan.
- **Naming collision to note:** Twelve70's App Store subtitle is literally "Men's Pocket Stylist". Avoid that exact phrase in Kitted's App Store subtitle, for search ranking and distinctiveness.

### What not to copy (judgement)
- Avatar or AI try-on as a headline (Doppl shut down; credit-metered try-ons are a cost sink).
- Manual cataloguing, receipts or a "100M-item database" (the job beginners quit, per review and Substack snippets).
- Weekly plans and credits: they earn fast but hurt trust and reviews. Kitted's yearly-first plan is consistent with its "honest" positioning.

---

## 4. Out of scope but flagged
Direct outfit-rater apps seen while searching, mostly fewer than 30 ratings and 2026 launches: Outfit Rater - Outfitby, Fashion Score, Outfit Rating: AI Fit Check, Rate My Outfit AI: DRPD, Judge My Outfit - Fit Score, Drip Roast, FitCheck - Improve Your Outfit (Numeration Technologies, Jan 2026), Stillo. GRWM (1,866 ratings) and Dressly (31,865) are the only rating apps with real traction found in this pass. A dedicated pass on direct competitors should cover them.

---

## 5. Sources

**App Store (US), all fetched Oct 12, 2026:** pages at `https://apps.apple.com/us/app/id<ID>` and the Lookup API `https://itunes.apple.com/lookup?id=<ID>&country=us`, for IDs 6481705400 (Alta), 1519461680 (Whering), 1599179405 (Indyx), 1542311809 (Acloset), 1358319821 (Style DNA), 1140550878 (Cladwell), 6447482321 (Fits), 1549029468 (OpenWardrobe), 335709058 and 515126225 (Stylebook, Stylebook Men), 989727742 (Combyne), 1198057728 (Smart Closet), 628106373 (Pureple), 6692634357 (Daydream), 6742974181 (Glance), 1022579925 (Stitch Fix), 597940518 (Lyst), 6739351340 (Phia), 6738174180 (Dressly), 6596771952 (Fitted), 6636520663 (Gensmo), 6759204008 (Styled), 6758533844 (Grayne), 6478133766 (Twelve70), 6737596512 (GRWM), 6479642952 (Essembl), 6744034749 (Closetly), 6745005234 (DLOOK), 1637080045 (Lumi), 6738202299 (shoppin). Doppl id6741596720: US page returns 404.

**Funding and news (fetched and verified unless marked):**
- Alta $11M seed: https://fashionunited.com/news/business/alta-raises-11-million-in-seed-funding-for-ai-powered-personal-shopping-styling-app/2025061766632 (Jun 17, 2025)
- Alta men's page: https://www.altadaily.com/blog/menswear (Nov 22, 2025)
- Alta TIME / Fast Company (self-reported press release): https://markets.financialcontent.com/pennwell.elp/article/abnewswire-2025-10-22-time-magazine-and-fast-company-have-selected-ai-styling-app-alta-for-their-lists-of-best-inventions-and-next-big-things-in-tech-of-2025 (snippet)
- Whering $7M, 10M users: https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/ (Jul 7, 2026); https://fashionunited.com/news/business/whering-secures-funding-from-ebay-ventures-and-google-ai-futures/2026070773352
- Indyx: https://yespress.io/indyx ; https://www.caplight.com/company/indyx (snippet)
- Acloset: https://www.caplight.com/company/acloset ; https://bouncewatch.com/company/acloset-looko (snippet)
- Style DNA: https://mercadoeconsumo.com.br/22/05/2026/inovacao/style-dna-um-personal-stylist-com-ia-que-cria-um-perfil-de-estilo-a-partir-de-uma-selfie/ (May 22, 2026); https://startupshub.catalonia.com/startup/barcelona/style-dna/4776 (snippet); https://www.cbinsights.com/company/style-dna/financials (snippet)
- Cladwell: https://wellfound.com/company/cladwell/funding ; https://www.cbinsights.com/company/cladwell/financials (snippet)
- Fits users: https://fits-app.com/fits-vs-whering (snippet)
- OpenWardrobe: https://www.caplight.com/company/openwardrobe (snippet)
- Combyne: https://seedtable.com/companies/combyne ; https://www.cbinsights.com/company/combyne/financials (snippet)
- Daydream: https://techcrunch.com/2025/06/25/julie-bornsteins-daydream-is-releasing-an-ai-powered-chatbot-for-fashion-related-shopping (Jun 25, 2025); https://www.webull.com/news/15310957041558528 (PR, Jul 29, 2026); https://www.indexventures.com/perspectives/bringing-ai-to-the-fashion-industry-our-investment-in-daydream/ ; https://puck.news/does-anyone-actually-want-ai-to-help-them-shop/ (Mar 2026, paywalled, headline only)
- Doppl: https://techcrunch.com/2025/06/26/google-launches-doppl-a-new-app-that-lets-you-visualize-how-an-outfit-might-look-on-you ; https://jetstream.blog/2026/03/24/google-doppl-shut-down-end-of-april-2026/ (Mar 24, 2026); https://twitter.com/GoogleLabs/status/2036188820128071786 ; https://blog.google/technology/google-labs/discover-new-outfits-try-them-on-and-shop-from-doppls-new-discovery-feed/
- Glance: https://www.digitalcommerce360.com/2025/06/04/samsung-glance-launch-ai-shopping-tool/ (Jun 4, 2025); https://india.entrepreneur.com/en-in/news-and-trends/inmobi-groups-glance-raises-145-mn-from-google-and/362172 (snippet); https://inc42.com/?p=277142 (snippet)
- Stitch Fix: https://www.sec.gov/Archives/edgar/data/0001576942/000162828026063208/exhibit991-fy26.htm (Sep 23, 2026); https://us.fashionnetwork.com/news/Stitch-fix-expands-ai-styling-tool-with-personalized-outfit-visualization-feature,1847029.html (Jun 25, 2026); https://www.glossy.co/fashion/stitch-fix-introduces-ai-driven-customer-profiles-amid-revenue-decline (snippet)
- Lyst / ZOZO: https://www.lyst.co.uk/news/lyst-zozo/ (Apr 9, 2025); https://seedtable.com/exits/lyst (snippet)
- Phia: https://www.shopifreaks.com/phia-the-ai-shopping-app-from-phoebe-gates-and-sophia-kianni-raises-a-35-5m-series-a-backed-by-a-long-list-of-celebrity-investors/ (Jun 6, 2026); https://fortune.com/2026/02/21/phoebe-gates-startup-phia-succeed-without-help-parents-bill-gates-melinda-french-gates (snippet); https://www.digitalcommerce360.com/2025/09/18/phia-raises-8-million-to-scale-ai-shopping-platform/amp/ (snippet)
- Dressly: https://app.dealroom.co/companies/dressly (snippet); https://screensdesign.com/apps/dressly-ai-outfit-stylist/ (snippet)
- Fitted: https://superwall.dev/blog/how-reid-moncada-built-a-viral-ai-fashion-app-that-hit-600k (Nov 22, 2025)
- Gensmo: https://fashionunited.com/news/business/ai-powered-fashion-agent-gensmo-secures-60-million-dollars-in-funding/2025062766848 (Jun 27, 2025)
