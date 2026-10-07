# Kitted: a men's pocket-stylist iOS app

**This file is the one place for current status and instructions.** Read it first in every new chat, then open only the reference docs the task needs (the "Docs map" below). **Last updated: Oct 7, 2026.**

## How we keep context (rules for every chat)

1. **This file holds the live state:** where things stand, what's next, what's waiting on the founder, and how to run things. Keep it true.
   - Update it whenever a decision is made or a step is finished.
   - Always update it at the end of a session. Don't wait to be asked.
   - Don't start new status, handoff or plan files. Put that content here instead.
2. **Reference docs** (specs, research) hold detail too big for this file. When a decision changes one of them, edit that doc in the same session. If a doc goes stale, fix it or move it to `handoff/archive/` and remove it from the map.
3. **`handoff/DECISIONS-LOG.md`** is the append-only record of decisions and technical lessons, with the reasons. Add a numbered entry whenever you settle a contradiction or change a decision.
4. **Commit and push to GitHub** (`eyualem/kitted`, private) after every finished step.
5. Work only in this folder. Codex and Gemini research outputs go in `inputs/`.

## Who I am and how I like to work
- **Who I am:**
  - A college student building a consumer iOS app for income, alone.
  - **$0 marketing budget**; I post short-form video daily.
  - I'm into style, anime and good movies.
  - I often talk by voice dictation, so read for intent.
- **Research tools:**
  - I use **Codex** (it has Chrome and can reach Reddit and TikTok) and **Gemini** (YouTube transcripts) for browsing research.
  - Claude writes the prompts for them and verifies what comes back.
  - Codex can also do machine setup (it installed Xcode 26.6 and the Simulator).
- **The feedback I want:**
  - **Honest, critical feedback backed by research, with sources, in plain language.**
  - Concrete recommended decisions, not open questions. Rank options when it helps (user psychology, competition, chance of success, monetization).
- **Status updates:**
  - Say what I'll *see* in the app, not spec IDs.
  - Include screenshots.
  - Say what's real and what's mocked.
  - Never pretend something works.
- **Ask me only about:** taste, money, installs and downloads, new dependencies, and anything outward-facing. Settle everything else yourself and log it.
- **Navigation:** keep the app's setup and navigation flawless. Check plans against Apple's HIG and the UX checklist in `research-context.md` §C14.

## The product (locked)
- **What it is:** a chat-first personal stylist for guys, built for beginners.
  - You send an outfit photo and get a **fit score out of 10**, with a word ("Sharp") and 2–3 specific fixes (at least one free).
  - The app **learns your closet as you go**.
- **Positioning line:** "Look put together. Without trying too hard."
- **Audience:**
  - Guys **18–30**: college students and young professionals.
  - **The app is 18+, US App Store only.** Gemini's terms require it, and it avoids Texas's parental-consent law.
  - Under 18 is blocked by a birth-year gate that starts blank, plus Apple's Declared Age Range check.
  - **Marketing targets adults only** (college, first job, interviews, dates; never prom or high school).
  - Revisit 16+ in 2027; that needs a teen-friendly AI provider (Qwen on Groq, or Anthropic).
- **Tabs:** Stylist (chat) · Closet · Lookbook · You. **Do things in Stylist; look at things in the other tabs.**
- **Scoring:** "**The AI sees, the code judges, the AI explains.**"
  - The vision model only describes garments.
  - Code (`@kitted/core`, the TypeScript port of `extraction-test/rubric.py` v3.1) computes **score = 7.0 + credits − mistakes**, rounded to the nearest half.
  - The best possible score is **9.5** for now.
  - Same photo → same score. Re-checks reuse the first reading.
  - **"Not quite right?"** lets him correct a detail.
  - Score words: ≤5.5 Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9–9.5 Dialed in. Always shown with the number.
- **Never rate faces, bodies, weight or skin.** Traditional clothing is "not rated."
- **Wording:**
  - Always "your stylist," never "AI stylist." The consent screen and the first chat message still say plainly that it's an AI.
  - No emoji, no RPG ranks or anime theme, no daily streak chain.
  - Never say "unlimited". Pro says "Up to 10 fit checks and 50 questions a day".
- **Partial checks:**
  - Full-body photos are preferred, never required. What isn't in the photo never costs points.
  - The card says so in words ("Partial check: shoes not included") and offers a shoe snap or a pick from Closet.
- **Camera:**
  - The phone propped up, with a body-outline framing guide, a 3-2-1 auto-capture and a staged loading card.
  - Mirror selfies and library photos are backups.
- **Free and Pro:**
  - **Free tier:** 1 fit check a day (with one re-check) and 5 questions a day. Everything that runs on code is free; never charge to see a score.
  - **Pro:** $29.99/yr with a 14-day trial, or $5.99/mo, plus a $19.99 founding offer for the waitlist. No lifetime plan, weekly plan or Family Sharing.
- **Onboarding** (6 taps to the first check):
  1. Welcome
  2. Looks you like (max 3)
  3. Basics (height, build, fit, birth year)
  4. Consent (Apple 5.1.2(i): names Google, says what's sent and kept)
  5. First fit check
  6. Result, then "your first 3 moves"
  7. A skippable paywall
  8. The notification ask
- **Notifications:** only 3 kinds, all local: the daily outfit idea, "fit check ready," and "trial ending."
- **Privacy:**
  - Only the neck-down crop of a photo is saved, on the phone; the full-face original is never stored.
  - To score a fit, a face-cropped copy goes to Google's Gemini API, which doesn't train on it and keeps it up to 55 days for abuse checks. Our server stores no photos.
  - Consent copy: `inputs/app-store-and-age-rules.md` §3.
- **Look:**
  - Clean and premium, per the mockups: chalk/night backgrounds, indigo ink, a copper accent, Archivo numerals, iOS 26 Liquid Glass tab bar.
  - Mockups: `mockups/kitted-mockups.html` (20 screens). Inside each phone 1 CSS px = 1 pt.
- **Name: KITTED.** Handles @kitted.app and @trykitted are free on TikTok/IG; trykitted.com and trykitted.app are free. Never use "getkitted" (an Australian shop).

## Where things stand (Oct 7, 2026, end of day)

### The app build (React Native + Expo SDK 57, TypeScript; iOS first)
- **P0, the skeleton: done.**
  - Expo app in `app/`, expo-router, NativeTabs (the real iOS 26 glass tab bar).
  - Every screen has a route.
  - Demo links: `/demo/screen/<n>` on web; `-demoScreen <n>` as an iOS launch argument.
  - SQLite with migrations (V3). The web preview uses an in-memory store with the same interface.
- **The scoring engine** (`app/packages/kitted-core`, pure TypeScript):
  - Matches `rubric.py` on all **5,694** parity cases.
  - It also has the day key (4 am rollover), the "Why" ledger, closet matching, re-check outcomes, corrections and partial-check merges.
- **P2, Stylist chat and the fit check: done (Oct 7).** It works on the iPhone Simulator and matches mockup screens 6–12 closely:
  - **Screen 6:** the reading card.
  - **Screen 7:** the 8.0 "Sharp" card, with the fix → 9.0 and "Added 4 to Closet".
  - **Screen 8:** "Why 8.0" (the rows add up).
  - **Screen 9:** "Not quite right?".
  - **Screen 10:** the re-check, 8.0 → 9.0, +1.0.
  - **Screen 11:** the partial check, 6.5, "Same shoes as Monday?".
  - **Screen 12:** Stylist home, with the morning outfit idea.
  - Also real: occasion changes re-score instantly; the same photo gets the same score; the daily limit; failures never use a check; the 9 s "Taking longer" and 14 s give-up timers.
  - **Added Oct 7:** the "Added to your closet" sheet (Undo / Add back), "Which shoes?" (pick a pair for a partial check), "What changed?" (confirm a fix the re-check missed), the photo viewer, toasts ("Logged for today." with Undo, "Saved to your tan chinos."), and an extra-large-text pass.
  - Undrawn sheets have demo screens: **21** Added to your closet · **22** Which shoes? · **23** What changed? · **24** Photo viewer.
  - P2 report with screenshots: `screenshots/p2-report/index.html` (git-ignored).
- **Mocked in the demo:**
  - The AI reading: saved readings replayed with the real timing.
  - The camera: a sample-photo sheet stands in until P3.
  - Purchases: the paywall runs on a mock store (P6).
- **Tests:** `npm run check` in `app/` runs the typecheck, lint, 64 core tests and 126 app tests (incl. automated copy checks). All green.

### Other workstreams
- **Extraction test PASSED (Oct 6).** Log: `extraction-test/results/INDEX.md`.
  - **Locked config:** gemini-3.8-flash, thinking off, v3 answer format, rubric v3.1.
  - **Speed and cost:** 6.6 s median, 0.42¢ per check (0.83¢ from Jan 2027), 100% consistent.
  - **Fix detection is unproven** (67–83%); real staged fix photos are needed.
  - Speed plan: `speed-and-detail-plan.md`.
  - **How to run it:**
    - Use `/usr/bin/python3`.
    - Set the key with `read -s GEMINI_API_KEY && export GEMINI_API_KEY`.
    - Turn billing on (the free tier allows 20 calls a day).
- **Rubric v3:** `rubric/v3.md`. Waiting for my review, including 2 decisions: whether a 10 should be reachable, and human calibration.
- **Research:**
  - Gemini creator research: I still need to export the Google Sheet as `.xlsx` into `inputs/`. Only rules backed by 2024+ videos count.
  - Codex sneaker deep-dive (sneakers with jeans/chinos, 2025+): results pending.
- **Timeline:** beta Nov 3, submit about Nov 14, launch about Nov 17–20.

## Next steps, in order

### 1. My feedback from Oct 7: done
1. **Done: the composer no longer disappears when you tap the text box.** It rides just above the keyboard; the thread moves up with it (DECISIONS-LOG #29). Verified on the Simulator.
2. **Done: composer buttons.** The photo-library circle is gone; the camera button hides while the field is focused or has text, so the field gets the full width (#28, a logged difference from the mockup).
3. **Done: spacing pass, kept** (founder: "looks good", Oct 7). Card padding 16/20, row gap 12, fix rows 12, gap between messages 16 (#30).
- Note: the floating gear with "Tools" at the top right is the Expo development build's own menu, not app code. It isn't in release builds. In demo runs the first tap after launch sometimes only dismisses its label.

### 2. P2 leftovers (small)
1. **Rubric question for me:** correcting a detail can make the only fix vanish (DECISIONS-LOG #37). Recommended: fall back to the layering/elevate fixes; show "No quick fixes" once.
2. The "Same as your white tee?" duplicate question in the closet sheet waits for real closet matching (P3+, #31).
3. Thread list height drops 116 pt after a sheet closes (#34). It looks right, but understand it before P5.

### 3. Then P3 (camera, simulated) and P4 (onboarding)
The phases and their acceptance checks are in `handoff/05-build-plan.md` §5. Every screen's layout and copy is in `handoff/02-screens.md`.

### 4. Non-build steps (mine)
1. **Delete the Gemini API key** pasted in chat on Oct 6, and create a new one.
2. Review `rubric/v3.md` and decide its 2 open questions.
3. Shoot the gold set: about 80 photos, with 3+ friends (plan in `speed-and-detail-plan.md`).
4. Claim @kitted.app / @trykitted and register trykitted.com. Then the waitlist page and the TikTok account.
5. Join the Apple Developer Program ($99/yr) and sign the Paid Apps Agreement. They block TestFlight, purchases and the age check, not the demo.

### 5. After launch: v1.1 (December)
- **"Should I buy this?"** In Stylist, he snaps an item in the store and gets what it goes with in his closet, "+N fits", a duplicate warning, then Buy it / Skip it. No barcodes or prices; Google Lens owns those. With a thin closet the card says what it's based on. Before building: a Codex check of Reddit and TikTok on demand. Details: DECISIONS-LOG #40.
- **For launch videos now:** fitting-room fit checks already work (mirror selfie), with no new build.

## Waiting on the founder (Claude builds the default meanwhile)
- **Archivo fonts:** 3 files of about 185 KB each, OFL license, from `github.com/Omnibus-Type/Archivo` (`fonts/ttf/`). Default: the system font. When approved:
  - fill the map in `app/src/design-system/fontFiles.ts`
  - uncomment the expo-font plugin in `app/app.config.ts`
  - rebuild
- **Copy I wrote that isn't in the copy deck:** `app/src/i18n/en.ts` → `addedInBuild` holds the card summaries, the 27 rule names, the VoiceOver lines, and (new Oct 7) the closet-sheet rows ("Top · Regular fit"), the viewer caption ("Date · October 22") and "Pick shoes from your closet". Skim it.
- **Already built; just confirm:**
  - The "Why" sheet's "Rounded to the nearest half · +0.25" line.
  - "Dialed in. Nothing to fix." only at 9+.
  - A correction before a re-check gives the honest 8.5, not 9.0.
- **Later decisions:**
  - RevenueCat vs. expo-iap for purchases (recommended: RevenueCat with our own paywall).
  - Install Maestro (UI tests) before P7.
  - A 16+ app in 2027.

## How to run things
- **Node and Xcode:** Node 22.23; Xcode 26.6 at `/Applications/Xcode-26.6.app`, selected with `xcode-select`. Leave Xcode 26.3 alone.
- **Simulator:** iPhone 17 Pro, iOS 26.5, UDID `111D0A09-C2CA-4F72-BF3C-44019A05C89D`, bundle id `com.trykitted.kitted`.
- **Metro and the web preview:** run by the `kitted-web` launch config (`.claude/launch.json`). Start it with the Browser pane's `preview_start` tool, `name: "kitted-web"`. The dev build hot-reloads from it.
- **Rebuild native** only after a native package or `app.config.ts` change:
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo run:ios --device "iPhone 17 Pro" --no-bundler
  ```
- **Open a demo screen on the Simulator, then take a screenshot:**
  ```bash
  xcrun simctl launch 111D0A09-C2CA-4F72-BF3C-44019A05C89D com.trykitted.kitted -demoScreen 7 -theme light -demoLatency 0
  ```
  ```bash
  xcrun simctl io 111D0A09-C2CA-4F72-BF3C-44019A05C89D screenshot shot.png
  ```
  Don't use `simctl openurl`: iOS shows an "Open in Kitted?" prompt that can't be dismissed by script.
- **Web preview:** `http://localhost:8081/demo/screen/<n>?theme=dark&frame=1`. Use it for layout only; iOS is the truth.
- **Screenshots vs. the mockup:**
  - `tools/mockshots/preview.sh <n> light|dark` renders a mockup screen.
  - `tools/mockshots/webshot.sh <n> light|dark` renders the web preview.
  - `tools/mockshots/compare.html` puts them side by side.
  - Output goes to `screenshots/` (git-ignored).
- **Ask before:** installing anything, any download, any new npm package outside `handoff/05-build-plan.md` §1.1, any EAS build, or making the repo public.

## Which document wins when they disagree
Highest first:
1. What I say in chat.
2. **This file.**
3. `brainstorm/13_setup-decisions.md` (the referee's rulings).
4. `handoff/` (01–06, fixtures). Each doc owns its area:
   - **02:** screens and copy
   - **03:** the design system
   - **04:** logic and data. A generated fixture beats its prose.
   - **05:** process and environment
5. `app-build-spec.md`.
6. `demo-app-spec.md` and older brainstorm files.

Exceptions:
- **The mockups win on layout and copy,** except where `02` says "differs from mockup because…".
- **`rubric.py` wins on scoring.** The TypeScript must match it; never edit the fixtures to make tests pass.

## Docs map
| File | What it's for | State |
|---|---|---|
| `handoff/DECISIONS-LOG.md` | Every decision and lesson since the build started (#1–40) | **Live**; append to it |
| `handoff/01-product-brief.md` | Product, locked rules, voice | Reference |
| `handoff/02-screens.md` | Every screen: layout, copy deck §5, states, VoiceOver | Reference (copy is generated into `app/src/i18n/`) |
| `handoff/03-design-system.md` | Tokens, type, components, SF Symbols | Reference |
| `handoff/04-logic-and-demo-data.md` + `handoff/fixtures/` | Rubric port, fixes, re-check, seed data, expected scores | Reference |
| `handoff/05-build-plan.md` | Stack (§1.1), phases P0–P8 with acceptance checks, traps (§7) | Reference; its Oct 6 environment notes are outdated (see "How to run things") |
| `handoff/06-react-native-mapping.md` | How the SwiftUI terms in 02/03 map to React Native | Reference |
| `handoff/p2-design-spec.md` | Measured spec for the chat and cards (screens 6–12) | Reference |
| `mockups/kitted-mockups.html` | The visual source of truth | Reference |
| `app-build-spec.md` | Engineering spec: pipeline, proxy (Cloudflare Worker + D1), milestones M0–M4. Its SwiftUI parts are replaced by 05/06 | Reference, partly stale |
| `rubric/v3.md`, `extraction-test/` | Style rules in plain words; the vision test tools and results | Reference |
| `research-context.md`, `brainstorm/`, `inputs/*.md` | Research, competitors, legal, UX checklist §C14 | Reference |
| `speed-and-detail-plan.md`, `testing-plan.md` | Vision speed plan; the 5 validation tests | Reference |
| `demo-app-spec.md` | Older product spec | Stale; overridden by everything above |
| `handoff/archive/` | Superseded docs (the original handoff brief, review notes, the P2 plan, the SwiftUI starter) | History only; don't follow |

## Lessons from the build (details in DECISIONS-LOG)
- **Hermes on iOS lacks `Intl.PluralRules` and parts of `Intl` time zones.** No `Intl` in app code without checking it on iOS. Use `app/src/i18n/format.ts` and core `time.ts`.
- **A scrolling iOS sheet must have its ScrollView as the root.** Use `SheetScaffold`. A sticky header's row layout must sit one View deeper.
- **No `inverted` FlatList on iOS 26** (the edge fade washes it out). `scrollToEnd` ignores padding, so use a footer spacer.
- **Web preview limits:**
  - No `ui-monospace` in Chrome; web uses CSS font stacks.
  - Some `AccessibilityInfo` calls are missing on web.
  - SVG can't take iOS accessibility props; wrap it in a View.
  - Headless Chrome can't go narrower than about 500 px; `frame=1` boxes the app at 402 × 874.
- **Run `npm run check`, then commit, as separate steps.** Chaining them once committed a type error.
- **Large text:** at AX sizes rows stack (`isAccessibilitySize`), and control labels cap at 2× (`CONTROL_TEXT_MAX_SCALE`); wrapping 3-line button labels got clipped on iOS.
- **A card that changes behind a sheet** needs a scroll-to-end after the sheet closes (Stylist does it on focus, 400 ms).
- **`simctl io … screenshot` can fail silently** when the target file exists and is protected; write to a new path.
- **No `KeyboardAvoidingView` around absolutely positioned docks.** Its padding stacks on the fixed `bottom`. Drive the dock from `useAnimatedKeyboard` (see `StylistScreen.tsx`).
