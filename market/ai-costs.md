# What the Gemini calls cost, per call and per user

*Oct 15, 2026. DECISIONS-LOG #269. Token counts are measured from the app's own calls (`extraction-test/results/gold1`, `creators1`, `closet1`, `hem3`/look1 raw logs; the founder's phone data `screenshots/phone/20261014-180424`). Chat numbers are estimates until step C2 measures a real answer. Prices are from Google's Gemini API pricing page, read Oct 15, 2026; Apple's cut is 15% (Small Business Program).*

## 1. Prices (per million tokens, paid tier)
| Model | Input | Output | Cached input | Change |
|---|---|---|---|---|
| `gemini-3.8-flash` (what the app uses) | $0.75 | $3.75 | $0.075 | **Doubles on Jan 1, 2027** to $1.50 / $7.50 / $0.15 |
| `gemini-3.5-flash-lite` | $0.30 | $2.50 | $0.03 | None announced |
| `gemini-3.1-flash-lite` | $0.25 | $1.50 | $0.025 | None announced |
| Batch or Flex (any model) | half price | half price | | Slower, best-effort; fine for calls nobody waits on |

## 2. Each call the app makes
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
