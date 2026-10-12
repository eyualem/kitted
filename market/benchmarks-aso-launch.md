# Kitted: subscription benchmarks, App Store search, and $0 launch evidence

Researched Oct 12, 2026. Every web source was accessed that day. Kitted context: iOS, US only, 18+, men 18–30, free tier (1 fit check and 5 questions a day), Pro $29.99/yr with a 14-day trial, $5.99/mo, $19.99 founding offer, $0 marketing budget.

**How to read this**
- **Fact** = a number or rule taken from the named source, with its URL.
- **(secondary)** = taken from a press write-up of the report, not from the report itself.
- **(self-reported)** = a founder's own claim that nobody audited.
- **(snippet, unverified)** = seen only in a search snippet or a vendor blog; I could not open a primary source.
- **Judgement** = my reading. It is always labelled.
- The RevenueCat 2026 PDF (330+ pages) is behind an email form, so I didn't download it. Its numbers below come from the public report web page and RevenueCat's own blog posts. A few figures contradict each other on that web page; I flag those.

---

## 1. Subscription benchmarks

### 1a. The reports
| Report | Publisher | Data | Published |
|---|---|---|---|
| State of Subscription Apps 2026 (SOSA 2026) | RevenueCat | 115,000+ apps, $16B+ revenue, mostly 2025 data; iOS, Android, web | Mar 2026 (part 1); part 2 on retention, May 2026 |
| State of In-App Subscriptions 2026 (SOIS 2026) | Adapty | 16,000+ apps, $3B+ revenue, 2025 data, mostly Apple App Store | early 2026 |
| State of Mobile 2026 | Sensor Tower | whole market, 2025 | Jan 2026 |
| Mobile app benchmarks (retention) | OneSignal | not stated (OneSignal message data) | 2024 page |

Superwall publishes no aggregate benchmark report that I could find. Its site has single-app case studies only. I found no Appfigures report with conversion benchmarks for this category.

### 1b. The numbers

**Conversion: install to trial, trial to paid, install to paid**
| Metric | Value | Category / segment | Source | Date |
|---|---|---|---|---|
| Install → trial (D30), median | 9.1% Business; 6.9% Health & Fitness; 6.5% Education and Utilities; 4.0% Media & Entertainment. Social & Lifestyle and Photo & Video not shown | by category | RevenueCat SOSA 2026, [report page](https://www.revenuecat.com/state-of-subscription-apps) | 2026 |
| Install → trial (D30), median | 7.1% | North America users | same | 2026 |
| Install → trial | 11.2% overall; 14.5% North America | all categories | Adapty SOIS 2026, [report page](https://adapty.io/state-of-in-app-subscriptions-report/) | 2026 |
| Trial → paid, median | 43.5% Travel; 37.7% Health & Fitness; 25.0% Gaming; **22.2% Photo & Video (lowest; top quartile above 33.1%)** | by category | RevenueCat SOSA 2026 page | 2026 |
| Trial → paid, median | 34.2% | North America | same | 2026 |
| Trial → paid, by trial length | **17–32 days: 42.5%**; 5–9 days: 37.4%; ≤4 days: 25.5% | all | same | 2026 |
| Trial → paid | 27.8% | all categories | Adapty SOIS 2026 page | 2026 |
| Install → paid within 35 days, median | **2.0% overall**; 2.9% Health & Fitness (top quartile above 6.2%); 2.6% Business; 1.3% Shopping; 1.0% Gaming | by category | RevenueCat SOSA 2026 page | 2026 |
| Install → paid within 35 days, North America | 2.6% (by where the developer is based) or 2.8% (by where the users are). The page gives both | region | same | 2026 |
| Install → paid, Lifestyle, direct (no trial) | "18–38%", depending on where the paywall sits. Weekly no-trial Lifestyle setup: 5% of installs pay; monthly and annual direct conversion below 4% at every price tier | Lifestyle | Adapty, [Lifestyle benchmarks post](https://adapty.io/blog/lifestyle-app-subscription-benchmarks/) | Apr 9, 2026 |

*Judgement:* Adapty's "18–38%" for Lifestyle can't be read as "share of all installs that pay." The same post says direct annual and monthly conversion is below 4%. The 18–38% is probably measured among users who saw a particular paywall. Use RevenueCat's ~2% install → paid as the planning number.

**Hard paywall vs freemium**
| Metric | Hard paywall | Freemium | Source | Date |
|---|---|---|---|---|
| Install → paid within 35 days, median | **10.7%** (top quartile above 20.0%) | **2.1%** (top quartile above 4.5%) | RevenueCat SOSA 2026 page | 2026 |
| Revenue per install at day 14, median | $2.32 | $0.27 | same | 2026 |
| Revenue per install at day 60, median | $3.09 | $0.38 | same | 2026 |
| Share of conversions after week 6 | 15.3% | 22.9% (freemium users convert later) | same | 2026 |
| Median one-year LTV per subscriber | $24 | $20 ("21% higher" for hard). Soft paywalls convert about 50% better on raw conversion | Adapty SOIS 2026 / Lifestyle post | 2026 |

**Plan mix and prices**
| Metric | Value | Category | Source | Date |
|---|---|---|---|---|
| Plans sold | 42% monthly, 34% yearly | all | RevenueCat SOSA 2026 page | 2026 |
| Weekly share of plan mix | **47% in Social & Lifestyle**, the highest of any category | Social & Lifestyle | same | 2026 |
| Apps with no trial | **43.6% in Social & Lifestyle**, the only category where no-trial beats mixed-trial setups | Social & Lifestyle | same | 2026 |
| Median monthly price | **$9.99 in Social & Lifestyle** (tied highest with Education and Health & Fitness); $9.99 in North America | category / region | same | 2026 |
| Median yearly price | **$39.99 in North America**; $39.44 Western Europe. Overall median given as "$31.60 to $34.80" | region | same | 2026 |
| Median weekly price | $5.99 overall | all | same | 2026 |
| Global median prices | weekly $7.48, monthly $12.99, annual $38.42. Lifestyle is said to "cluster near" these; no Lifestyle-only medians | all | Adapty Lifestyle post | Apr 9, 2026 |
| Lifestyle revenue by plan | weekly 31%, monthly 29% (36% in 2023), one-time 26% | Lifestyle | same | Apr 9, 2026 |
| Weekly share of all subscription revenue | 55.6% (2025) | all, mostly iOS | Adapty SOIS 2026 page | 2026 |

**Retention and renewals**
| Metric | Value | Category | Source | Date |
|---|---|---|---|---|
| **First renewal, annual plans** (25th pct / median / 75th pct) | **Social & Lifestyle 13% / 25% / 41%**; Photo & Video 15% / 23% / 35%; Health & Fitness 16% / 25% / 37% | by category | RevenueCat blog, [Average subscription renewal rates by app category (2026 benchmarks)](https://www.revenuecat.com/blog/growth/average-subscription-renewal-rates-by-app-category/) (cites SOSA 2026) | 2026 (the page metadata says 2022; the content is the 2026 data) |
| **First renewal, monthly plans** | **Social & Lifestyle 27% / 42% / 61%** (lowest monthly median of all 11 categories); Photo & Video 35% / 48% / 59%; Health & Fitness 46% / 57% / 68% | by category | same | 2026 |
| First renewal, weekly plans | Social & Lifestyle 25% / 35% / 50% (lowest weekly median) | by category | same | 2026 |
| First annual renewal, all categories | 23–40% median by category (Productivity 23%, Business 40%); 2nd renewal 44–64%; 3rd 56–70% | by category | RevenueCat, [SOSA 2026 insights part 2](https://www.revenuecat.com/sosa-2026-insights-part-2) | May 2026 |
| First-year retention by plan | annual 31% (2023 cohort) → 28% (2024); monthly 10% → 8%; weekly 1.7% → 1.2% | all | same | May 2026 |
| Reactivation within a year | annual 5%; monthly 20% | all | same; also [9to5Mac](https://9to5mac.com/2026/05/27/new-report-shows-annual-app-subscribers-rarely-return-after-they-cancel/) (secondary) | May 27, 2026 |
| Annual plans cancelled in month 1 | 35% | all | 9to5Mac (secondary) | May 27, 2026 |
| Trial cancelled on day 0 | 3-day trial 55.4%; 7-day 39.8%; **14-day 35.7%**; 30-day 31.1% | all | RevenueCat SOSA 2026 page | 2026 |
| Renewals, all categories | 1st 59.2%, 2nd 45.1%, 3rd 37.1%, 4th 31.6%, 5th 27.6% | all | Adapty SOIS 2026 page | 2026 |
| Retained at day 380 | annual 19.9%, monthly 14.2%, weekly 5.5% | all | Adapty Lifestyle post | Apr 9, 2026 |
| Lifestyle: trial vs direct buyers | trial users are **21.2% less valuable** over 12 months; Lifestyle is the only category where this is true | Lifestyle | same | Apr 9, 2026 |
| Lifestyle one-year LTV per install, median | $0.70 (7th of 8 categories); Health & Fitness $1.21; Photo & Video $0.82 | by category | Adapty SOIS 2026 page | 2026 |
| Lifestyle 12-month LTV, monthly plan | $42.8 | Lifestyle | Adapty Lifestyle post | Apr 9, 2026 |
| App retention D1 / D7 / D30 (all users, not just subscribers) | Lifestyle 25% / 13.13% / 5.94%; Health & Fitness 28% / 18.13% / 8.48%; overall 28.29% / 17.86% / 7.88%. iOS and Android combined, period and method not stated | by category | OneSignal, [Mobile app benchmarks](https://onesignal.com/mobile-app-benchmarks-2024) | 2024 page |
| App retention D30, iOS | Photo & Video 2.3%; Shopping 4.6% (attributed to AppsFlyer via Business of Apps; year unclear) | by category | Braze article (snippet, unverified) | — |

*Caveat on D1/D7/D30:* I found no 2025–2026 primary source that gives iOS Lifestyle day-1/7/30 retention. AppsFlyer's 2025 retention report page returned 404, and Adjust's is behind a form. Treat the OneSignal row as the rough guide.

**Refunds**
| Metric | Value | Source | Date |
|---|---|---|---|
| Refund rate, all categories | 8.3% | Adapty SOIS 2026 page | 2026 |
| Photo & Video, trial-start refunds | 6.4% globally (14.1% in Asia-Pacific) | same | 2026 |
| Refunds' cost | up to 14% of subscription revenue | same | 2026 |
| Median refund rate, AI vs non-AI apps | 4.2% vs 3.5% | RevenueCat SOSA 2026 via [Storyboard18](https://storyboard18.com/digital/ai-apps-struggle-to-retain-users-despite-strong-early-monetisation-report-finds-91785.html) (secondary) | Mar 11, 2026 |

Adapty's 8.3% and RevenueCat's ~3.5–4.2% measure different things (Adapty doesn't define its rate on the page; RevenueCat counts refunds in the first billing period). Don't compare them directly.

**AI apps**
| Metric | AI apps | Others | Source | Date |
|---|---|---|---|---|
| Revenue per customer / churn | +41% revenue per customer, churn about 30% faster (Jacob Eiting, RevenueCat CEO) | — | RevenueCat SOSA 2026 page | 2026 |
| Annual plan retention after 12 months | 21.1% | 30.7% | Storyboard18 (secondary) | Mar 11, 2026 |
| Monthly retention | 6.1% | 9.5% | same (secondary) | Mar 11, 2026 |
| Install → paid, median | 2.4% | 2.0% | same (secondary) | Mar 11, 2026 |
| Realised LTV, annual plans, median | $30.16 | $21.37 | same (secondary) | Mar 11, 2026 |
| Install → trial / trial → paid | 5.31% / 20.60% | 10.92% / 25.59% | Adapty SOIS 2026 page (the chart labels are unclear; mapped from the text) | 2026 |
| Annual + trial, 12-month LTV | $66.70 | $49.92 | Adapty SOIS 2026 page | 2026 |
| Lifestyle AI apps revenue growth | +691% year over year (2025) | — | Adapty Lifestyle post | Apr 9, 2026 |
| Gen-AI apps in 2025 | 3.8B downloads (2x), more than $5B in-app revenue (nearly 3x), 48B hours | — | Sensor Tower, [State of Mobile 2026 blog](https://sensortower.com/blog/state-of-mobile-2026) | Jan 2026 |

Storyboard18 also lists AI trial → paid as "8.5% vs 5.6%". That doesn't fit any other trial → paid figure in either report (all 20–45%), so I left it out as probably mislabelled.

**Market shape**
- Lifestyle is the most concentrated category: the top 10% of apps take **97.9%** of its revenue (all categories: 94.5%). Source: Adapty SOIS 2026.
- 58% of new apps earn under $1K in their first year. Source: Adapty SOIS 2026.
- Social & Lifestyle apps take a median of 45 days from launch to $1K monthly revenue. Source: RevenueCat SOSA 2026 page.
- New subscription apps launching each month: about 2,000 three years ago, close to 15,000 now. Source: RevenueCat SOSA 2026 founder letter.
- Apple says the average App Store product page converts **1.6%** of viewers, and custom product pages add 2.5 percentage points on average. Source: [Apple, custom product pages](https://developer.apple.com/app-store/custom-product-pages/).

### 1c. Price check against direct competitors (App Store listings, Oct 12, 2026)
| App | What it does | Prices listed | Ratings |
|---|---|---|---|
| [GRWM - AI Stylist](https://apps.apple.com/us/app/grwm-ai-stylist/id6737596512) | rates an outfit from a mirror photo with tips (paywalled) | weekly $3.99; monthly $6.99 / $9.99 / $12.99; annual $19.99 / $29.99 / $39.99 | 4.6 from 1.9K |
| [Fits](https://apps.apple.com/us/app/fits-outfit-planner-closet/id6447482321) | digital closet + outfit planner | Pro $9.99 / $29.99 / $59.99; AI credits $1.99–$79.99 | 4.6 from 5.6K |
| [Alta Daily](https://apps.apple.com/us/app/alta-daily-digital-ai-closet/id6481705400) | AI closet ("Your Personal AI Stylist"), age 13+ | in-app prices not shown on the page | 4.9 from 16K; #58 Lifestyle (Top Free) |

---

## 2. App Store search (ASO)

### 2a. The fields, from Apple's own docs
| Field | Limit | Used for search? | Notes | Source |
|---|---|---|---|---|
| App name | 30 characters | Yes | Distinctive, easy to spell, hints at what the app does | [Product page](https://developer.apple.com/app-store/product-page/) |
| Subtitle | 30 characters | Yes | Features or typical uses, no "world's best" claims. Changes only with a new version | same; [Search](https://developer.apple.com/app-store/search/) |
| Keywords | 100 characters, commas, no spaces after commas | Yes (hidden) | Don't repeat words from the name, subtitle or category. Skip plurals of words already used, "app", filler words, competitor names, trademarks, celebrity names. Misuse is a common rejection reason. Balance popular and less common terms | [Search](https://developer.apple.com/app-store/search/) |
| Primary + secondary category | — | Yes (indexed) | An irrelevant category can get the app rejected | same |
| Promotional text | 170 characters | **No** | Sits above the description; can change at any time without a new version | [Product page](https://developer.apple.com/app-store/product-page/) |
| Description | — | Not listed as a search field | Only the first sentence shows before "more" | same |
| Screenshots | up to 10 | — | The first 1–3 show in search results when there's no preview video | same |
| App previews | up to 3, 30 s each | — | Autoplay muted | same |
| App tags | generated | may show in results | Apple generates them with large language models from your metadata | [Search](https://developer.apple.com/app-store/search/) |
| Custom product pages | up to 70 | **Yes, you can now give each page its own keywords**, so it shows in search instead of the default page | Different screenshots, previews and promo text; a unique URL; a deep link (iOS 18+); reviewed separately from app updates; works with pre-orders | [Custom product pages](https://developer.apple.com/app-store/custom-product-pages/) |
| In-app events | 15 approved, 10 live at once; each up to 31 days, promoted up to 14 days before | Yes: event cards in search, plus Today/Apps tab picks | Name 30, short description 50, long description 120 characters. Badges: Challenge, Competition, Live Event, Major Update, New Season, Premiere, Special Event | [In-app events](https://developer.apple.com/app-store/in-app-events/) |
| Pre-orders | listed 2–180 days before release (new apps) | Yes, pre-orders appear in search | The app must pass review first. It downloads automatically on release day with a notification. Pre-orders are counted in App Analytics, and `AppTransaction.preorderDate` identifies who pre-ordered | [Pre-orders](https://developer.apple.com/app-store/pre-orders/) |

Ranking factors, per Apple: text relevance (name, subtitle, keywords, primary category) and user behaviour (downloads, ratings and reviews). Source: [Search](https://developer.apple.com/app-store/search/).

### 2b. Keyword popularity: what public data exists
- **Apple's own number** is the Search Popularity score in Apple Ads. Apple's dashboard shows it as 1–5 dots, and the API and ASO tools show it as 5–100 (the MobileAction and AppFollow help centres say the tools copy Apple's value). It needs an Apple Ads account (free to open). One unverified blog says that since Oct 2025 the API returns scores only for keywords at 35 or above. **I found no public page that lists popularity scores for "outfit", "rate my outfit", "fit check" and similar terms.** AppTweak, Astro, Appfigures and MobileAction all put them behind an account.
- **What I could measure for free:** Apple's own search autocomplete (the App Store "hints" endpoint, US store) and the public iTunes Search API, both queried Oct 12, 2026. Autocomplete only lists terms people actually search. Its order is a rough popularity signal, not a score.

**Autocomplete (US App Store, Oct 12, 2026)**
| You type | Apple suggests (in order, first ~6) |
|---|---|
| outfit | outfit maker, outfit planner, outfit formulas, outfit creator, outfit builder, outfit finder |
| outfit r | **outfit rater**, outfit rater - outfitby, outfit runner, outfit rating: ai fit check, … |
| rate my | rate my professor, rate my physique, rate my face, rate my singing, rate my music, … ("rate my outfit" isn't in the top 10) |
| rate my outfit | rate my outfit, then 9 app names (rate my outfit: ai scanner, … drpd, brutalcoach, dressa, drip roast, dripscore, mirror, nuum, rmo) |
| fit check | fit check, fit check ai stylist, fit check - swagpunch, fit check: ai virtual try on, … |
| ai stylist | ai stylist, wardrobly, free ai stylist, closet ai stylist, atricent, aiuta, … |
| outfit check | outfit checker, outfit check, outfit check - fashion finder, … |
| what to wear | what to wear weather, what to wear, … what to wear today, what to wear tomorrow |
| wardrobe | wardrobe outfit planner, wardrobe clothing app, wardrobe tracker, wardrobe, … |
| closet | closet: outfit organizer, closet organizer, closet design app, … |
| ootd | ootd, ootdbuy, nolera, travel ootd, … |
| mens fashion | mens fashion, mr porter, boohooman, … (shopping) |
| looksmax | looksmax ai, looksmax face rating, looksmaxxing, … |
| **drip check**, **men outfit** | **no suggestions** |
| mens style, how to dress | only the term itself |

*Judgement:* "drip check", "men outfit", "mens style" and "how to dress" get almost no searches. People think in "outfit", "fit check", "outfit rater / rate my outfit", "ai stylist", "what to wear", "wardrobe", "closet". Nobody searches for a men-specific version. "Men" belongs in the name for conversion and clarity, not for search volume.

### 2c. Who ranks (iTunes Search API, US, top results, Oct 12, 2026)
The public API's order is close to, but not the same as, the live App Store order. Rating counts show how strong each app is.
| Term | Top results (ratings count) | Judgement: how hard |
|---|---|---|
| fit check | FitCheck: Outfit of the Day (151), FitCheck - Improve Your Outfit (7), FitCheck Gym Manager (0), Fitdrop (133), Fits (5,596) | Easy: weak apps on top, but many "FitCheck" names |
| rate my outfit | Rate My Outfit (13), … DRPD (0), … AI Scanner (0), RMO (1), Mirror (1), GRWM (1,866), BrutalCoach (0), Outfit Score (0), Judge My Outfit (0), Drip Roast (0) | Easy: crowded with 2026 launches that have almost no ratings |
| outfit rating | Outfit Rating: AI Fit Check (0), Outfit Rating & Digital Closet (0), Rate My Outfit (13), Mirror (1), Fit Score! (12), Twirl (8), DRESSFIT (10) | Easy |
| outfit | Whering (11,882), Fits (5,596), Combyne (87,677), Alta Daily (16,188), Atelier (3), Pinterest (5.8M) | Hard |
| ai stylist | Alta Daily (16,188), Fits (5,596), Dressly (31,865), Style DNA (7,501), GRWM (1,866) | Hard |
| wardrobe / closet | Whering, Alta Daily, Fits, Indyx, Stylebook, Acloset (all 1.6K–16K) | Hard |
| what to wear | (autocomplete only; mostly weather-outfit apps) | Medium (not checked in the API) |
| outfit ideas men | Wardrobe: Outfit ideas for men (50), Essembl (4,653), Combyne, gacha/Toca "outfit ideas" games | Medium, noisy |
| mens fashion | BOOHOOMAN, Fashion Nova, H&M, MR PORTER, ASOS, SSENSE, ZARA | Not worth it (shopping intent) |
| drip check | DripCheck: Dress Better (0), OuchFit (1), DripCheck - AI Stylist (0), Dripcheck (0) | Easy but no volume |
| men style / style men ai | Alice - AI Style for Men (1), Men's Outfit Planner - Suited (2), Styled — Men's AI Stylist (1), Moggr (4,145) | Easy; men-specific stylists are tiny |
| **kitted** | **no results**: the name is free on the US store | — |

Other men-focused rivals spotted: Modus: Stylist for Men (1–10 rating, updated Mar 2026), Styled (men's morning outfit from your closet), Alice. All have almost no ratings. **Fact:** the "rate my outfit" results are a pile of near-identical 2025–2026 launches. **Judgement:** that cluster is easy to rank in but cheapens the category. Kitted's difference (same photo, same score; the fixes; the closet) has to show in the first two screenshots.

### 2d. Suggested metadata (my suggestion, not tested)
Counts were checked with a script.
- **Name (28/30):** `Kitted: Outfit Rater for Men`
  - Alternative (26): `Kitted: Fit Check for Guys`. "Fit check" is the brand language, but the SERP is full of "FitCheck" names, so it's harder to stand out.
- **Subtitle (30/30):** `Fit check, style tips & closet`
  - Alternatives: `Rate your fit. Get the fixes.` (29), `Outfit score, fixes & closet` (28).
- **Keywords (99/100):** `rate,rating,score,ai,stylist,wardrobe,ootd,drip,fashion,mens,guys,what,wear,ideas,advice,look,dress`
  - Leaves out words already in the name and subtitle (outfit, rater, men, fit, check, style, tips, closet) and the category name.
  - Built so that "rate my outfit", "outfit rating", "outfit score", "ai stylist", "what to wear", "outfit ideas" and "fit check" can be formed. Apple's docs only say not to repeat words; that it combines words across fields is common ASO practice, not something Apple states.
- **Category:** Lifestyle (primary); Photo & Video secondary is optional. Every direct competitor is in Lifestyle.
- **Wording conflict to resolve:** CLAUDE.md says the app always says "your stylist", never "AI stylist". The hidden keyword field can still hold "ai" and "stylist" (people search "ai stylist"), but the visible name and subtitle above avoid "AI stylist".
- **Custom product pages:** one per video theme: "Interview outfit check", "Date night fit check", "College fits". Give each its own keywords (e.g. interview outfit, date outfit) and use its URL in the matching TikTok bio link or video.
- **In-app events after launch:** e.g. "Holiday Party Fit Check" (Special Event, December) and "New Year Closet Reset" (Challenge, January). They give the app extra search and Today-tab surface for free.
- **Pre-order:** once the $99 program is active and a build passes review, put Kitted on pre-order straight away (allowed up to 180 days ahead). Use the pre-order link in videos before launch so launch-day downloads land on one day. (Judgement: concentrated downloads should help ranking, since Apple names downloads as a factor. Apple doesn't say how much.)

---

## 3. $0-budget launch evidence (2025–2026)

### 3a. Apps that grew this way
| App | What they did | Numbers (and how strong the evidence is) | Source |
|---|---|---|---|
| **Cal AI** (photo calorie tracker; founders 17–18) | Influencer marketing run by a co-founder; Superwall paywall tests | TechCrunch, Mar 16, 2025: over 5M downloads in 8 months, over $2M revenue the previous month, retention "over 30%" (self-reported; **TechCrunch says it couldn't validate** the download and revenue claims). TechCrunch, Sep 24, 2026: 15M+ downloads and $30M+ annual revenue in under two years; acquired by MyFitnessPal (closed Dec 2025). Latka interview: about 250 influencers on monthly retainers, influencer spend reaching mid six figures in one month (self-reported) | [TechCrunch 2025](https://techcrunch.com/?p=2979629), [TechCrunch 2026](https://techcrunch.com/?p=3168701), [Latka](https://getlatka.com/interviews/cal-ai-zach-yadegari-2025) |
| **Umax** (face rating / looksmax; solo founder Blake Anderson) | Launched into an existing TikTok/Reddit trend; a looksmax creator promoted the launch | About $6M a year (podcast summaries); downloads quoted as 3M to 10M+; peak ~$700K/month (all self-reported, sources disagree). Creator launch video "hundreds of thousands of views", first month ~$100K (snippet, unverified) | [Starter Story](https://www.starterstory.com/stories/he-made-10m-with-3-iphone-apps), [MFM summary](https://podpulse.ai/podcast-notes-and-takeaways/my-first-million-the-ai-app-doing-6m-with-1-employee) |
| **Rizz** (AI dating replies) | Many TikTok accounts with B-roll videos | AP interview, 2024: over 7.5M downloads, growing ~30% a month (self-reported). "550M views across 15+ TikTok accounts" (vendor blog, unverified); ~$500K/month (Starter Story estimate) | [ABC/AP](https://abcnews.go.com/Business/wireStory/rizz-founder-new-dating-app-ai-matchmaking-wingman-113511426), [Shortimize](https://www.shortimize.com/blog/rizz-apps-b-roll-strategy-that-got-them-half-a-billion-views-on-tiktok) |
| **Stronger** (gym planner) | A founder-run TikTok: 725 posts in 295 days, 98% of the top ones slideshows | "700,000 users" (vendor blog, unverified; users, not downloads) | [Shortimize](https://shortimize.com/blog/the-slideshow-strategy-that-generated-700000-users-in-275-days) |
| **Saturn** (student calendar) | Campus ambassadors: paid leads ($25/hr) recruit 5–10 ambassadors; a college role paid up to $600 for 100 sign-ups | Over 1M high schoolers (from its own job posting); $44M raised in 2021 | [Built In NYC](https://www.builtinnyc.com/articles/saturn-raises-44m-hiring-social-calendar-app), [job post](https://jobs.generalcatalyst.com/companies/saturn-technologies/jobs/30407503-college-research-ambassador) |
| **Finch** (self-care pet) | CEO: mostly word of mouth plus performance marketing, then a national brand campaign | About 4.76M active users and $0 raised (aggregator, unverified); revenue estimates differ about 3x | [MediaPost](https://www.mediapost.com/publications/article/415234/) |
| **Lock In, Amy** | — | Couldn't confirm which apps were meant. A "Lock In" on TrustMRR is a desktop productivity app with $27 total revenue. Nothing usable | — |

**Pay-per-view creators ("clipping" / UGC campaigns):** platforms such as Whop Content Rewards let a brand set a rate per 1,000 views and a budget, and pay only for approved posts. Typical quoted rates are about $0.50–$3 per 1,000 views (range $0.20–$6). These come from vendor guides, so treat them as indicative ([Whop docs](https://docs.whop.com/manage-your-business/growth-marketing/content-rewards), [viral.app guide](https://viral.app/blog/guides/sub-1-cpm-ugc-playbook)).

**Product Hunt:** no aggregate data on how many downloads a launch brings. Founder anecdotes range from 20 downloads to a few hundred users ([HackerNoon](https://hackernoon.com/is-product-hunt-dead-what-results-can-you-expect-from-product-hunt-launch), [PH poll](https://www.producthunt.com/p/general/poll-how-much-traffic-did-you-get-from-your-recent-launches-on-product-hunt)). Its audience is builders, not 18–30 guys into style.

**Reddit:** the common rule of thumb is no more than 1 post in 10 promoting your own thing, and subreddit rules can be stricter. I couldn't open Reddit's own help page (403), so this comes from secondary sources and is unverified.

**Waitlists:** I found no hard data on waitlist conversion for consumer apps. Apple's pre-order is the one mechanism with first-party mechanics (auto-download on launch day, counted in App Analytics).

### 3b. Rules for promoting your own app
- **TikTok (own account):** posts that promote your own product must have **Disclose commercial content** turned on, choosing **"Your brand"** for your own business (TikTok's [how-to page](https://ads.tiktok.com/resources/help/article/how-to-turn-on-the-commercial-content-disclosure-setting-in-tiktok?lang=en)). TikTok spots commercial intent from links, promo codes, brand tags, demos and "buy now" calls to action.
  - If TikTok finds undisclosed commercial content, the post may lose For You eligibility. You get 24 hours to turn the setting on or appeal.
  - TikTok says the label itself doesn't change how a post is recommended (it cites an internal study). Source: [TikTok, About the content disclosure setting for creators](https://ads.tiktok.com/help/article/about-the-content-disclosure-setting-for-creators), updated Apr 2026.
- **TikTok (paid creators):** choose "Branded content", which adds a "Paid partnership" label.
- **Instagram:** when a creator gets value from a business partner (money or free products), they must tag the partner with the "Paid partnership" label. That covers paid UGC creators, ambassadors and gifted Pro. Posts on your own brand account aren't "branded content" in Meta's sense. Source: Instagram Help Center via secondary guides; I couldn't open Meta's policy page directly.
- **FTC:** the revised Endorsement Guides took effect July 26, 2023 (16 CFR Part 255). In video, the paid relationship has to be said in the video itself, not only in the caption (vendor summary of the Guides).
  - The FTC rule on fake reviews took effect Oct 21, 2024. It bans buying fake reviews, insider reviews without a clear disclosure, and fake social-influence metrics. Knowing violations carry civil penalties of about $52K each ([FTC press release](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)).
  - For Kitted: friends who review the app must say they know the founder, and paid creators must disclose on screen.

---

## 4. What this means for Kitted's pricing and launch (judgement)

**Pricing**
1. **Expect freemium-level conversion: plan on about 2% of installs paying within 35 days**, not 10%. The free tier is locked ("never charge to see a score"), and RevenueCat's freemium median is 2.1% against 10.7% for hard paywalls. So 10,000 installs means roughly 200 payers in the first five weeks. A top-quartile freemium app gets 4.5%, about 450. The skippable onboarding paywall is the right lever, because about 80–90% of trial starts happen on day 0 (RevenueCat: Health & Fitness 82.1%; Adapty: 89.4%).
2. **$29.99/yr is below the market** (North America yearly median $39.99; Adapty global $38.42). It matches GRWM's middle tier and Fits' annual. **$5.99/mo is well below** the Social & Lifestyle monthly median of $9.99. Ranked options (pricing is your call):
   - (a) Launch at $29.99/yr and $5.99/mo, then test $39.99/yr after about 1,000 paywall views. Adapty finds high-priced apps earn about 3x the LTV of low-priced ones.
   - (b) Raise the monthly plan to $7.99–$9.99 so the annual looks like a bigger saving. Today $29.99 against $71.88 is already 58% off, so this is mostly about framing.
   - (c) Keep both. This is the lowest risk for a young audience with no ad budget.
3. **The 14-day trial is supported, but test a no-trial annual too.**
   - For: longer trials convert better (17–32 days 42.5%, 5–9 days 37.4%, ≤4 days 25.5%), and 14-day trials see fewer day-0 cancellations (35.7% vs 55.4% for 3-day trials).
   - Against: in Lifestyle, trial users are 21% less valuable than direct buyers (Adapty), and 43.6% of Social & Lifestyle apps run no trial (RevenueCat).
   - Run this as one A/B test after launch.
4. **Plan on about 1 in 4 annual subscribers renewing** (Social & Lifestyle first annual renewal median 25%; quartiles 13–41%). Monthly first renewal is 42%, the lowest of any category. AI apps also churn about 30% faster.
   - The closet, the morning card and "how you're doing" are what have to beat 25%. Year-one revenue should be modelled without counting on renewals.
   - Annual plans that cancel rarely come back (5%), so win-back emails matter less than keeping people in year one.
5. **Leaving out weekly plans costs conversion, but fits the brand.** Weekly is 47% of the Social & Lifestyle plan mix. Weekly plans convert 2–7x better than annual (Adapty), but keep only about 1.2% of subscribers after a year. Keeping them out (as locked) is consistent with "never say unlimited" and the premium feel. Just know that rivals like GRWM ($3.99/week) will show bigger launch numbers.
6. **Refunds:** budget for 4–8% (AI apps median 4.2% in RevenueCat; Adapty overall 8.3%).
7. **Lifestyle is winner-take-most** (top 10% of apps get 97.9% of revenue). The median outcome for a new app is under $1K in year one. That is the real base rate behind the Nov 17–20 launch.

**ASO**
1. The name **"Kitted" is free on the US store.** Pair it with "Outfit Rater" or "Fit Check" in the name, since nobody searches "Kitted" at launch.
2. Aim at the weak search results first: "rate my outfit", "outfit rating", "outfit rater", "fit check", "outfit score". They're full of 0–150-rating apps. Then grow into "ai stylist", "outfit" and "what to wear". Skip "mens fashion" (shopping) and "drip check" (no volume).
3. Ratings are a ranking factor. Ask for a rating right after a good score or a re-check that went up, using Apple's built-in rating prompt only. Never offer a reward for a rating (FTC rule, App Review).
4. Custom product pages with their own keywords, plus pre-order, are free first-party levers most small rivals don't use.

**Launch**
1. **Founder-led daily short videos are the core channel, and the evidence supports them**:
   - Rizz's B-roll accounts, Stronger's 725 slideshows, Umax riding a trend.
   - Format: the score reveal plus a before/after fix, which is the same shareable "satisfying scan" loop as Cal AI.
   - Turn on "Your brand" disclosure on any post with a link, code or call to action.
2. **The famous wins weren't $0.** Cal AI paid about 250 creators on retainer, and Umax and Rizz paid creators early. The cheapest proven step up is **pay-per-view creator campaigns** (about $1 per 1,000 views, paid only on results). That needs a small budget, which is your call.
3. **College ambassadors fit the audience** (18+, college). Saturn-style pay per real sign-up (e.g. 1 month of Pro, or cash per 25 activated users) keeps cost tied to results. Ambassadors must disclose (FTC, and Instagram's Paid partnership label).
4. **Product Hunt: low priority.** No evidence it brings 18–30 style beginners. Do it on launch week only for the backlink.
5. **Reddit:** answer fit-check questions in men's style communities from a real account, keep promotion under about 10% of activity, and read each subreddit's rules first.

**What I couldn't get (and how to close the gaps)**
- Search popularity scores for each term: open a free Apple Ads account and check them in the keyword planner (about 10 minutes).
- iOS Lifestyle D1/D7/D30 retention from AppsFlyer or Adjust: their reports are behind forms.
- Social & Lifestyle trial → paid and install → paid: probably in the RevenueCat PDF, which needs the email form. Downloading it is your call.

---

## Sources (all accessed Oct 12, 2026)
- RevenueCat, State of Subscription Apps 2026 (web page): https://www.revenuecat.com/state-of-subscription-apps
- RevenueCat, SOSA 2026 insights part 2 (May 2026): https://www.revenuecat.com/sosa-2026-insights-part-2
- RevenueCat blog, Average subscription renewal rates by app category (2026 benchmarks): https://www.revenuecat.com/blog/growth/average-subscription-renewal-rates-by-app-category/
- 9to5Mac, May 27, 2026: https://9to5mac.com/2026/05/27/new-report-shows-annual-app-subscribers-rarely-return-after-they-cancel/
- Storyboard18, Mar 11, 2026 (RevenueCat AI-app figures): https://storyboard18.com/digital/ai-apps-struggle-to-retain-users-despite-strong-early-monetisation-report-finds-91785.html
- Adapty, State of In-App Subscriptions 2026: https://adapty.io/state-of-in-app-subscriptions-report/
- Adapty, In-app subscription benchmarks for Lifestyle apps (Apr 9, 2026): https://adapty.io/blog/lifestyle-app-subscription-benchmarks/
- Sensor Tower, State of Mobile 2026 (Jan 2026): https://sensortower.com/blog/state-of-mobile-2026
- OneSignal, Mobile app benchmarks: https://onesignal.com/mobile-app-benchmarks-2024
- Apple, Product page: https://developer.apple.com/app-store/product-page/
- Apple, Search: https://developer.apple.com/app-store/search/
- Apple, Custom product pages: https://developer.apple.com/app-store/custom-product-pages/
- Apple, In-app events: https://developer.apple.com/app-store/in-app-events/
- Apple, Pre-orders: https://developer.apple.com/app-store/pre-orders/
- Apple App Store search hints and iTunes Search API (queried Oct 12, 2026; raw JSON in the session scratchpad, not kept)
- App Store listings: GRWM https://apps.apple.com/us/app/grwm-ai-stylist/id6737596512 · Fits https://apps.apple.com/us/app/fits-outfit-planner-closet/id6447482321 · Alta Daily https://apps.apple.com/us/app/alta-daily-digital-ai-closet/id6481705400
- MobileAction, popularity score: https://helpcenter.mobileaction.co/what-is-popularity-score
- TechCrunch, Cal AI (Mar 16, 2025): https://techcrunch.com/?p=2979629 · (Sep 24, 2026): https://techcrunch.com/?p=3168701
- Latka, Cal AI founder interview (2025): https://getlatka.com/interviews/cal-ai-zach-yadegari-2025
- Starter Story, Blake Anderson: https://www.starterstory.com/stories/he-made-10m-with-3-iphone-apps
- ABC News / AP, Rizz: https://abcnews.go.com/Business/wireStory/rizz-founder-new-dating-app-ai-matchmaking-wingman-113511426
- Shortimize, Rizz B-roll: https://www.shortimize.com/blog/rizz-apps-b-roll-strategy-that-got-them-half-a-billion-views-on-tiktok · Stronger slideshows: https://shortimize.com/blog/the-slideshow-strategy-that-generated-700000-users-in-275-days
- Built In NYC, Saturn: https://www.builtinnyc.com/articles/saturn-raises-44m-hiring-social-calendar-app · Saturn job post: https://jobs.generalcatalyst.com/companies/saturn-technologies/jobs/30407503-college-research-ambassador
- MediaPost, Finch: https://www.mediapost.com/publications/article/415234/
- Whop Content Rewards docs: https://docs.whop.com/manage-your-business/growth-marketing/content-rewards · viral.app guide: https://viral.app/blog/guides/sub-1-cpm-ugc-playbook
- TikTok, commercial content disclosure: https://ads.tiktok.com/help/article/about-the-content-disclosure-setting-for-creators · how-to: https://ads.tiktok.com/resources/help/article/how-to-turn-on-the-commercial-content-disclosure-setting-in-tiktok?lang=en
- FTC, fake reviews final rule (Aug 2024): https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- Davis Wright Tremaine, FTC Endorsement Guides update (Jul 2023): https://www.dwt.com/insights/2023/07/ftc-advertising-endorsement-and-testimonial-guides
- Product Hunt poll: https://www.producthunt.com/p/general/poll-how-much-traffic-did-you-get-from-your-recent-launches-on-product-hunt · HackerNoon: https://hackernoon.com/is-product-hunt-dead-what-results-can-you-expect-from-product-hunt-launch
