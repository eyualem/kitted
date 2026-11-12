# What the Gemini calls cost, per call and per user

*Oct 15, 2026. DECISIONS-LOG #270. Token counts are measured from the app's own calls (`extraction-test/results/gold1`, `creators1`, `closet1`, `hem3`/look1 raw logs; the founder's phone data `screenshots/phone/20261014-180424`). Chat numbers are estimates until step C2 measures a real answer. Prices are from Google's Gemini API pricing page, read Oct 15, 2026; Apple's cut is 15% (Small Business Program).*

## 1. Prices (per million tokens, paid tier)
| Model | Input | Output | Cached input | Change |
|---|---|---|---|---|
| `gemini-3.8-flash` (what the app uses) | $0.75 | $3.75 | $0.075 | **Doubles on Jan 1, 2027** to $1.50 / $7.50 / $0.15 |
| `gemini-3.5-flash-lite` | $0.30 | $2.50 | $0.03 | None announced |
| `gemini-3.1-flash-lite` | $0.25 | $1.50 | $0.025 | None announced |
| Batch or Flex (any model) | half price | half price | | Slower, best-effort; fine for calls nobody waits on |

## 2. Each call the app makes
> **Nov 12 (§7):** live, a check costs about 1.73¢, not 1.08¢. Most checks pay for the read twice (the 5 s backup), and the second look's calls think. Use §7's numbers.

| Call | When | Tokens in / out (median, measured) | Now | From Jan 1, 2027 |
|---|---|---|---|---|
| **Scoring read** (photo + 2 close-ups) | every new photo | 4,118 / 764 | 0.60¢ | 1.19¢ |
| **Second look** (2 small calls, U and L) | every new photo | 2 × (1,370 / 32) | 0.23¢ | 0.46¢ |
| **Closet call** (names, shades, boxes) | every new photo, after the card shows | 1,567 / 364 | 0.25¢ | 0.51¢ |
| **= one fit check** (or a re-check with a new photo) | | | **1.08¢** | **2.16¢** |
| Same-photo re-check, occasion change, Going for, quick tap, corrections, Why, morning card, weather | | none (code, or the free weather service) | 0 | 0 |
| **A chat question** on 3.8 Flash (estimate: 8,700 in incl. the 5,600-token rules + guide, 180 out) | per question | cached prefix / not cached | 0.34¢ / 0.72¢ | 0.68¢ / 1.44¢ |
| A chat question on 3.5 Flash-Lite, cached | | | 0.16¢ | 0.16¢ |
| A chat question on 3.5 Flash-Lite with the guide trimmed to the question's sections (~4,000 in) | | | 0.10¢ | 0.10¢ |
| **A chat question on OpenAI GPT-5.6 Luna, measured** (the chat's model since Oct 17, #329; ~4,470 in, 81% cached at a tenth, ~89 out; $0.20 / $1.20 per million) | per question | | **0.035¢** | 0.035¢ (no rise announced) |

The scoring read's **output** is half its cost (764 tokens at the output price). The shorter v4.1 answer format halved it in the Oct 6 test but read 5 details differently; it's waiting on the gold set (`extraction-test/results/INDEX.md`).

A slow scoring read can send a backup request at 5 s if no garment has streamed yet (`DEFAULT_TIMERS.hedgeMs`); on the founder's phone 24 of 30 reads took over 5 s in total, but garments usually stream earlier, so the backup is probably rare. **Not measured:** log the hedge rate (planned since ruling 19).

## 3. Per user, per month
| Who (assumed use a month) | Today's prices | From Jan 2027 | Jan 2027, chat on Flash-Lite | He pays (after Apple's 15%) |
|---|---|---|---|---|
| **Free, light** (8 checks, 2 re-checks, 10 questions) | $0.14 | $0.28 | $0.23 | $0 |
| **Free, every day** (30 checks, 10 re-checks, 60 questions; the free caps are 1 check + 1 re-check + 5 questions a day) | $0.64 | $1.27 | $0.96 | $0 |
| **Pro, typical** (45 checks, 15 re-checks, 120 questions) | $1.06 | $2.12 | $1.48 | $2.12 (yearly) · $5.09 (monthly) |
| **Pro, at the caps every day** (10 checks + re-checks, 50 questions a day) | $11.60 | $23.21 | $15.27 | $2.12 · $5.09 |

## 4. What that means (the honest part)
- **Per 100 monthly users** (98 free averaging 6 checks, 2 re-checks and 15 questions a month; 2 on Pro, typical), from Jan 2027: AI ≈ **$31 a month against ≈ $6 of revenue.** Free users are about 85% of the AI bill. The 2% conversion is the market research's estimate (`market/market-research.md`).
- **A typical Pro user on the yearly plan costs about what he pays** from Jan 2027, before any free users are paid for.
- **The cap is a promise we can't afford if many people use it:** "up to 10 fit checks and 50 questions a day" costs ~$23 a month at the cap. Few will reach it, but heavy users are exactly who'd stay.
- **#268's AI line was too low:** it counted only the scoring read (0.83¢ in 2027); a full check is 2.16¢.

## 4b. Measured Oct 15 (#278, `rubric/research/notes/model-test.md`)
- **OpenAI GPT-6 Luna** for the scoring read: 0.054¢ a read (about 3,300 tokens in, 400 out at $0.10/$0.50 per million), against Gemini 3.8 Flash's 0.59¢.
  - Its scores match the judges as well, but it names clothes worse (garment types right 75% vs 85%).
  - A whole check on Luna would be ≈ 0.15¢ (the second look and the closet call untested on it), against 1.08¢ now and 2.16¢ from Jan 2027.
- **Gemini 3.5 Flash-Lite:** 0.32¢ a read (it needs "minimal" thinking, not off). Its scores are worse, so it's dropped as a lever.
- **Voting / cascades on Luna:** 0.13–0.16¢ a read, no quality gain.

**OpenAI's list prices (standard tier, developers.openai.com/api/docs/pricing, read Oct 15), per outfit read** at the measured ~3,300 tokens in and ~400 out (the larger models may count image tokens a little differently; confirm on a first call):

| Model | $ per million (in / out) | ¢ a read | vs Gemini 3.8 today (0.59¢) | 10,000 reads a month |
|---|---|---|---|---|
| GPT-6 Astra | 10 / 50 | 5.35 | 9× | $535 |
| GPT-5.5 | 5 / 30 | 2.88 | 4.9× | $288 |
| GPT-5.6 Sol | 4 / 20 | 2.14 | 3.6× | $214 |
| GPT-5.6 Terra | 2 / 12 | 1.15 | 2× | $115 |
| GPT-6 Sol / 6.1 Sol | 2 / 10 | 1.07 | 1.8× | $107 |
| Gemini 3.8 Flash from Jan 2027 | (doubles) | ≈1.18 | 2× | ≈$118 |
| GPT-5.4 mini | 0.75 / 4.50 | 0.43 | 0.73× | $43 |
| Gemini 3.5 Flash-Lite (measured) | 0.30 / 2.50 | 0.32 | 0.54× | $32 |
| GPT-5.4 nano | 0.20 / 1.25 | 0.12 | 0.2× | $12 |
| GPT-5.6 Luna | 0.20 / 1.20 | 0.12 | 0.2× | $12 |
| GPT-6 Luna (measured) | 0.10 / 0.50 | 0.054 | 0.09× | $5 |

Batch is about half price but too slow for a live check.

**Tested Oct 15 (#280):** no OpenAI model names clothes as well as Gemini 3.8 Flash in a blind check (82% right):
- GPT-6 Sol 78% (1.8× the cost);
- GPT-6 Luna 75% (1/11);
- GPT-5.6 Luna 74% (1/5);
- GPT-5.4 mini 71%.
The cheap Lunas score outfits as well as Gemini. So the model lever is real money (about −0.5¢ a check) at the price of about 2× the naming errors; it's the founder's call (`rubric/research/notes/model-test.md`).

## 5. The levers, biggest first (none changes a score until tested)
| Lever | Saves per check (2027) | Cost to find out | Who decides |
|---|---|---|---|
| **Scoring read on a cheaper model** (3.5 Flash-Lite: ~0.32¢ instead of 1.19¢) | ~0.9¢ (~40%) | A gold-set run, ~$1–2; it must hold "same photo, same score" and the gold-set agreement | Founder (money); the test decides if it's possible |
| **The shorter answer format** (v4.1-style: less output) | ~0.5¢ | Waits on the gold set (already planned) | Claude after the test |
| **The closet call on Flex** (half price; nobody waits on it) | ~0.25¢ (~12%) | Check its latency on Flex; a few calls | Claude |
| **The second look** (0.46¢; it changed no shown score on 79 photos before shipping, #236) | 0.46¢ (~21%) | Keep only if the gold set shows it earns its points | Founder |
| **Chat on Flash-Lite with a trimmed guide** | per question: 0.68¢ → 0.10¢ | The C5 chat test (already planned) | Founder (D1, voice) |
| **The free tier** (1 check + 1 re-check + 5 questions a day) | — | — | Founder (product and money) |

**Everything combined** (scoring and second look on Flash-Lite, the closet call on Flash-Lite Flex, the chat on Flash-Lite trimmed) is about **0.48¢ a check and 0.10¢ a question**: per 100 users ≈ $6 a month of AI against ≈ $6 of revenue. That's break-even only if the cheaper model reads as well, and it still needs better than 2% paying, or a lighter free tier, to make money.

**Anthropic, tested Oct 15 (#283):**
- **Claude Sonnet 5.5** names clothes best in the blind check (83% vs Gemini's 79% that round), at 1.73¢ a read: ~3× Gemini now, ~1.5× from Jan 2027.
- **Claude Haiku 5.5** (0.086¢) names clothes worst (64%) and matches the judges worst. Out.
- Claude counts the photos at ~5,400 tokens, against ~3,300 for Gemini and OpenAI.

**Decided Oct 15 (#284, the founder): the reading stays on Gemini 3.8 Flash.** The model lever is closed. The bill is cut by the other levers in §5 (the free tier, the cheaper closet call, caching and Batch for calls nobody waits on).

## 6. At $9.99 a month (the founder's direction, Oct 15, #285)
| | Per Pro subscriber per month |
|---|---|
| He pays, after Apple's 15% | $8.49 |
| AI, typical Pro (45 checks, 15 re-checks, 120 questions), from Jan 2027 | $2.12 |
| Left over | **$6.37** |
| AI at the current cap (10 checks + re-checks and 50 questions every day), from Jan 2027 | $23.21: a loss |

- **Per 100 monthly users at 2% paying (Jan 2027):** ~$17 in vs ~$31 of AI (was ~$6 in under $29.99/yr and $5.99/mo).
- **Break-even share paying, AI only:** ~1.8% at today's prices, ~4.1% from Jan 2027 (free users ~$0.27 a month each).
- **A 1-week trial** costs ~$0.53 of AI per trial user who doesn't convert (half the 14-day trial). 5–9 day trials convert 37% vs 42% for longer ones (RevenueCat 2026).
- **Open (CLAUDE.md to-do, P2):** a yearly plan, the Pro cap, the free tier, the founding offer.


## 7. Cutting the cost of a fit check (Nov 12, 2026; DECISIONS-LOG #455)
*Measured for free: the live server's own call log (184 finished calls, Oct 17 – Nov 12, all from the founder's own TestFlight and Release use), an offline replay of saved answers on today's engine, and the saved test answers (`extraction-test/cost_paper.py` prints every number below; no AI calls). Prices from §1; "2027" means from Jan 1, 2027. Margins count the AI bill only, not hosting or Apple's yearly fee.*

### What a check really costs (corrects §2)
- **The live server pays for the main read twice on most checks.**
  - 29 of 36 real checks sent it twice, including all 6 in November. Both copies were the same photo and both ran to the end, so both were billed.
  - The 5-second backup read fires when no piece has reached the phone yet. On the server path, the first read's pieces evidently don't reach the phone in time, and the phone hanging up doesn't stop the first read.
  - On the founder's dev builds (straight to Google) pieces stream early, so the backup is rare there. That's why no one saw it.
- **The second look costs about twice what §2 says.** 55 of its 77 live calls "thought" (a median of 201 hidden tokens) even though thinking is off in the request. The saved look1 test shows the same thing (197 of 450 calls). That makes it about 0.21¢ a call, 0.42¢ for the pair today, and **0.84¢ in 2027**.
- **Real cost per new photo:** 1.73¢ today on average (median 1.69¢), against the 1.08¢ in §2. **In 2027 that's about 3.49¢:** read 1.19 + the duplicate read 0.95 + second look 0.84 + closet call 0.51.
- **Three corrections to §2 and §5:**
  - The shorter answer format saves about 0.38¢ in 2027, not 0.5¢ (the Oct 6 runs went from 762 to 259 output tokens).
  - Prompt caching saves nothing here. The read's fixed text is 863 tokens, under Google's minimum for automatic caching (1,024–4,096), and the live log shows 0 cached tokens on every call.
  - Making the close-ups smaller in pixels saves nothing. Gemini 3 bills about 1,090 tokens per image at its default resolution, whatever the size.

### The plan, ranked (cents saved per new photo in 2027)
1. **Pay for the read once (−0.95¢).**
   - **What changes:** the server turns away a second read on a check that's already being read. The phone's backup copy then simply loses, and the first answer wins as it does today. The server log also notes each read's number on its check, so the backup rate stays measured. Then find out why pieces don't reach the phone before 5 s (the server holding the stream back, or the Release build's download), so the pills fill in as they used to.
   - **What he'd notice:** nothing. Possibly the reading card's pieces appearing one by one again, if the second fix lands.
   - **Risk:** low. A truly stuck read is no longer rescued by its copy; the 14 s give-up still ends it, and the slowest live read so far took 11.7 s.
   - **Proof:** server tests in the emulator (free). After the deploy (his OK), the live log shows one read per check for his next 5 checks.
   - **Ships:** as a server deploy, no new app build, so it protects the beta testers at once. Task T27.
2. **Drop the second look (−0.84¢).**
   - **What changes:** no more U and L calls for new photos. Old checks keep their stored answers, so their scores don't move.
   - **What he'd notice:** almost never anything. On today's engine it changed the shown score on 1 of his 34 real checks and on 1 of 150 test reads, each by half a point. Those were a tee peeking under a hoodie (−0.5) and loose jeans dragging on slides; without the second look the engine falls back on the read's own hem answer.
   - **Risk:** low. It's a rule he approved shipping (#236), so it's his call.
   - **Proof:** done (`cost_paper.py`, part 1).
   - **Ships:** in the next TestFlight build. Task T68, after his yes.
3. **A shorter answer, same questions (about −0.25¢, an estimate).**
   - **What changes:** the read answers the same v3 questions with two-letter field names and skips "na" fields; code maps it back to v3 before scoring. Field names are 58% of the answer's characters and "na" fields 23%, so the answer shrinks to about 44% of its characters.
   - **What he'd notice:** nothing, if it passes.
   - **Risk:** medium. A format change can shift readings, as v4.1 did.
   - **Proof:** one gold-set run. About $2.50 for 450 reads before Dec 31, about $5 after, so it's worth running in December. It needs bars written before the run: same photo within 0.5 at least as often as today, panel agreement and his 20 ratings no worse, and each field agreeing with today's read at least as often as today's read agrees with itself (~90%). Task T69.
4. **Close-ups at medium resolution (about −0.16¢).**
   - **What changes:** the two close-ups are sent at Gemini's medium setting (560 tokens each instead of ~1,090); the main photo stays at full resolution.
   - **What he'd notice:** nothing, if it passes.
   - **Risk:** medium. The close-ups are what fixed boots read as slides (#104).
   - **Proof:** a second arm of the same gold run (+~$2.50). Task T69.
5. **The closet call on Google's half-price Flex tier (−0.25¢).**
   - **What changes:** the closet call goes through Flex, which costs half but aims to answer within 1–15 minutes and can be turned away when Google is busy.
   - **What he'd notice:** his pieces would land in Closet minutes after the card instead of seconds. That's a visible change and his taste call.
   - **Proof:** about 10 timed Flex calls (≈$0.03, his OK). Task T76, only if he's fine with the delay.

**Not worth doing:**
- Caching: nothing to cache (see above).
- Smaller close-up pixels: no saving.
- Folding the closet call into the read: it saves the photo's tokens but adds as many output tokens, and it slows the card.
- The closet call on Flash-Lite: it names clothes worse (#278), and naming is the closet call's whole job.
- Lower Pro caps: after 1–2 the monthly plan makes money even at the cap, and the cap's words are already approved.

**Kept in reserve: the read on GPT-6 Luna** (a further −1.14¢; 0.31¢ a photo after 1–3).
- **Why not now:** it names clothes worse (75% vs 85%), it means a new consent screen and Data table (they name Google), and the founder closed it (#284).
- **When to reopen:** only if subscribers don't cover the AI bill at 60 days, which is the bar in specs.md.

### The result (2027 prices; Pro after Apple's 15%: $8.49 monthly, $2.83 a month on the yearly plan)
- **Per new photo:**
  - as it runs today: 3.49¢
  - after 1–2: **1.70¢**
  - after 1–3: about 1.45¢
  - after all five: about 1.04¢
- **A free user's whole allowance** (7 checks + 3 re-checks, 30 questions): $0.36 → $0.18 after 1–2 → $0.11 after all.
- **Typical Pro** (60 photos, 120 questions a month):

  | | AI a month | Monthly plan keeps | Yearly plan keeps |
  |---|---|---|---|
  | Today | $2.14 | $6.36 (75%) | $0.70 (25%) |
  | After 1–2 | $1.06 | $7.43 (87%) | $1.77 (63%) |
  | After all five | $0.67 | $7.83 (92%) | $2.17 (76%) |

- **Pro at the cap every day** (5 checks + 5 re-checks, 30 questions):

  | | AI a month | Monthly plan | Yearly plan |
  |---|---|---|---|
  | Today | $10.78 | −$2.29 | −$7.95 |
  | After 1–2 | $5.42 | +$3.08 | −$2.58 |
  | After all five | $3.44 | +$5.06 | −$0.60 |

  Few will do that every day; the $25-a-day spend cap and analytics (T91) show if they do.
- **How many free users one subscriber pays for** (his monthly margin over one free user's whole allowance):
  - today: 2 per yearly subscriber, 18 per monthly one
  - after 1–2: 10 yearly, 41 monthly
  - after all five: 19 yearly, 68 monthly

### Order and timing
- **Now:** T27 is a server deploy and needs no new app build.
- **Next TestFlight build:** T68, after the founder's yes.
- **December:** the gold run (T69), to pay half price before Jan 1. A format that passes ships as its own build task.
- **Last, if at all:** Flex (T76).
