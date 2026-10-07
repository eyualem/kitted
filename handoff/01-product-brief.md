# 01 · Product brief: what Kitted is and the rules you must keep

> **Stack:** React Native + Expo (TypeScript), iOS first. Decided by the founder on Oct 6, 2026; it replaces the earlier SwiftUI plan.

*Written Oct 6, 2026 for a new Claude chat with no memory of how these decisions were made. Everything here is decided unless it is marked **FOUNDER DECIDES**. If a document disagrees with this brief, the precedence order is in `README.md`.*

---

## 1. The product in one paragraph

Kitted is a chat-first personal stylist for guys who are beginners at style. He props up his phone or takes a mirror selfie and sends an outfit photo. He gets a **fit score out of 10** with a word next to it ("Sharp"), plus two or three specific fixes, at least one of them free (cuff, tuck, wear the overshirt you're holding). He makes the fix and re-checks, and the score goes up. The pieces in his photo land in his closet automatically. Over time the app knows his clothes, suggests outfits from them, and shows quiet progress: how many outfits his closet makes, how many of the 12 essentials he owns, and how many days he dressed with intent.

- **Positioning line:** "Look put together. Without trying too hard."
- **Core audience:** guys 18–30 (college students, young professionals). The default launch is **18+, US App Store only** (see §6).
- **The founder:** a college student building this solo for income, with a $0 marketing budget. He posts short-form video daily. He wants honest, critical feedback in plain language, and concrete recommendations instead of open questions.

## 2. Why it beats free ChatGPT (keep these true in the build)

| ChatGPT | Kitted |
|---|---|
| Judges from scratch every time, so scores drift | **Same photo, same score.** Code computes the score from a fixed rubric, and every score is explained line by line |
| Doesn't know your clothes | Remembers your closet, sizes, styles and past outfits |
| Can't be corrected | **"Not quite right?"** Fix a detail the app got wrong and it re-scores instantly |
| No progress | Rotation ("37 fits"), Starter 12 essentials, Lookbook history |

## 3. How a fit check works: "The AI sees, the code judges, the AI explains"

1. **On the phone:** fix orientation, strip metadata, check quality, and **crop from the neck down** (pixelate any face that's still visible). If neither the body nor the face can be found, the photo is not sent.
2. **Vision model** (Gemini 3.8 Flash, paid tier, thinking off, original v3 answer format; behind a `ReadingSource` interface so it can be swapped): it only *describes garments* in fixed categories (schema: `/Users/eyu/Desktop/files/Kitted/extraction-test/schema.json`). **It never outputs a score.**
3. **Code (`@kitted/core`, a TypeScript port of `/Users/eyu/Desktop/files/Kitted/extraction-test/rubric.py` v3.1, shared by the app and later the proxy)** computes **score = 7.0 + credits − mistakes**, rounded to the nearest 0.5. The best possible score is 9.5 for now. Same photo → same reading → same score (results are cached by the photo's SHA-256).
4. **A small text model** writes 2–4 friendly sentences explaining the result. It never sees the photo and never sets a number; every number in its text is checked against the computed values, with a template fallback.

**In the demo you build first,** step 2 is replaced by **bundled readings** (`/Users/eyu/Desktop/files/Kitted/handoff/fixtures/readings/`) and step 4 by template sentences. Steps 1 and 3 are real code.

## 4. Locked product rules (never break these)

- **Never rate faces, bodies, weight or skin.** No rule reads them. Height and build only rank advice; they never lower a score. Traditional and cultural garments are marked **"not rated"**, never "wrong."
- **Always "your stylist," never "AI stylist"** in UI labels. Consent and the first Stylist message still disclose plainly that it is an AI (ruling 17; exact copy in `02-screens.md`: consent row 4 "Your stylist is an AI. It can make mistakes, so use "Not quite right?" to fix it." and `stylist.aiNote`).
- **No RPG classes, E→S ranks, XP, quests or anime theme.** The founder finds them cringe. The look is clean and premium.
- **No emoji in the UI.**
- **No daily streak chain.** Progress is "days dressed with intent: 4 this week · 19 total." After time away the copy says "Welcome back," never a loss.
- **Partial checks:** a full-body photo is preferred, never required. What isn't in the photo never costs points, and the card always says so in words ("Partial check: shoes not included"). It offers one optional way to finish (a shoe snap, or pick the shoes from Closet). Skip means he's never asked again for that check.
- **Free tier:** 1 fit check a day (with 1 included re-check, open for 30 minutes; after the first-ever check it stays open until the 4 am reset, ruling 22) and 5 questions a day. Everything that runs on code is free forever: score, fixes, closet, Lookbook, outfit ideas, share cards. **Never charge to see a score** and never blur a result.
- **Pro:** $29.99/yr with a 14-day free trial, or $5.99/mo; a $19.99 founding offer code for the waitlist. Pro copy says **"Up to 10 fit checks and 50 questions a day"** (ruling 25), never "Unlimited." No lifetime plan, weekly plan or Family Sharing.
- **Notifications: only 3 kinds,** all local: the daily outfit idea at the time he picks, "fit check ready," and "trial ending" (sent 2 days before). Never "we miss you," never streak guilt.
- **Photos stay on the phone** (and in the iPhone's own backup). The server never stores images, readings or scores.
- **Share cards** are neck-down by default, never gated, with a small "scored by Kitted" watermark.
- **Navigation rule:** **do things in Stylist; look at things in the other tabs.** Buttons like "Style this item" or "Re-check" jump to Stylist with that item attached.
- **Every camera, paywall and sheet has a visible X or Done from the first frame.** Onboarding uses Back.
- **No accounts in v1.** No Sign in with Apple, no restore-account screen and no "I've used Kitted before" button (those come in v1.1 with iCloud sync). **Restore Purchases** stays on the paywall, because App Review requires it.

## 5. The app at a glance

- **Tabs** (iOS 26 floating Liquid Glass tab bar, always labeled): **Stylist** (the chat, home) · **Closet** · **Lookbook** · **You**.
- **Onboarding** (6 taps to the first check, inside a chat-styled flow with tap answers only):
  1. Welcome
  2. Tap up to 3 looks you'd wear
  3. Basics: height, build, fit preference and birth year (the year wheel **starts blank**; under 18 sees a polite stop screen)
  4. Consent (Apple guideline 5.1.2(i): names Google, says what's sent and kept)
  5. First fit check
  6. Result, then re-check (or "Later"), then "Your first 3 moves"
  7. A 2-page paywall, skippable from the first frame
  8. The notification ask, only after "Yes, pick a time"

  Goal, boldness and budget are asked later, when they change an answer.
- **Card types in the chat:** Fit check, Re-check, Outfit idea, Item ("+N fits"), Buy suggestion, Plan ("your first 3 moves"), Question (tap answers), Limit, plus loading, failed, offline, held, dialed-in and not-rated states.
- **Score words** (always shown with the number, never color alone): **5.5 and under: Needs a fix · 6–6.5: Getting there · 7–7.5: Put together · 8–8.5: Sharp · 9–9.5: Dialed in.** A clean, basic outfit lands near 7.

## 6. Decisions with defaults (FOUNDER DECIDES). Build with the default, and keep each switchable from one config value.

These are the three big ones. The full list of open founder decisions, with the default to use meanwhile, is in `README.md` → "Known open decisions for the founder".

| Decision | Default to build | Where it's discussed |
|---|---|---|
| **Age and AI provider.** Google's Gemini API terms (updated Apr 28, 2026) require users 18+ and bar apps "likely to be accessed by" under-18s; CLAUDE.md still says "open to 14+". | **18+, US only.** Put `minAge` in config. Keep the provider behind `ReadingSource`. | `/Users/eyu/Desktop/files/Kitted/inputs/ai-provider-research.md`, `/Users/eyu/Desktop/files/Kitted/inputs/app-store-and-age-rules.md`, `brainstorm/13_setup-decisions.md` |
| **Visual design system.** The mockups (cool chalk, indigo ink, copper accent, Archivo score numerals) vs. `app-build-spec.md` §6 (warm paper, loden green, New York serif). | **The mockup look**, as specified in `handoff/03-design-system.md`. | `brainstorm/13_setup-decisions.md` |
| **Keep the original photo with the face, or not.** | **Never store the face.** Save only the neck-down copy (about 2048 px) and use it everywhere: chat bubble, card, Lookbook, share card. The mockups draw his chat bubble face-blurred; `02-screens.md` replaces that with the neck-down crop. | `brainstorm/09_photos-in-the-ui.md` |

## 7. The voice

- Confident peer, plain words, short sentences. He's a stylish friend, not a brand.
- Specific beats clever. Say "Cuff your chinos once," not "Elevate your look."
- No em-dash asides, no "not X but Y" framing, no hype, no apologies in errors. An error says what happened and what to do.
- The stylist says "I" ("Your score may change once I see your shoes").
- Example lines from the mockups:
  - "Clean base. The overshirt in your hand finishes it."
  - "Layered and clean. Dialed in. Nothing else changed."
  - "I score the clothes only. Never your face, body or skin."
  - "That's today's free check."

## 8. Where the full context lives (read only when you need it)

| File | What's in it |
|---|---|
| `/Users/eyu/Desktop/files/Kitted/CLAUDE.md` | The founder's handoff file (current state, decisions, next steps). Read first, always. |
| `/Users/eyu/Desktop/files/Kitted/app-build-spec.md` | The canonical v1 engineering spec: stack, pipeline, proxy, screens, data model, milestones M0–M4, risks. |
| `/Users/eyu/Desktop/files/Kitted/brainstorm/13_setup-decisions.md` | The referee's rulings that override the older docs, plus a list of stale lines in other docs. |
| `/Users/eyu/Desktop/files/Kitted/brainstorm/09–12_*.md` | Photos in the UI, the product app map and state matrix, the engineering setup, iOS 26 metrics. |
| `/Users/eyu/Desktop/files/Kitted/demo-app-spec.md` | The older product spec (some lines are stale; 13 lists them). |
| `/Users/eyu/Desktop/files/Kitted/rubric/v3.md` | The style rules in plain language. |
| `/Users/eyu/Desktop/files/Kitted/research-context.md` | All research (competitors, psychology, UX checklist §C14, legal). |
| `/Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html` | The visual source of truth (20 screens, light and dark). Live copy: https://claude.ai/artifact/DnMPLuPxLFs4N1x4wwjPy9 |
