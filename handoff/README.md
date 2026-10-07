# Kitted build handoff: START HERE

> **For the founder:** open a new chat in this folder and paste this one line:
>
> `Read /Users/eyu/Desktop/files/Kitted/handoff/README.md and follow it. Start with Phase 0.`

---

## To the new chat: who you are and what you're doing

You're picking up a project mid-stream in a fresh context window, so you remember none of it. This folder (`/Users/eyu/Desktop/files/Kitted/handoff/`) was written for you by the previous chat and several research agents, so you can start building without redoing the research.

**Your mission:** build **Kitted**, a men's pocket-stylist app in **React Native with Expo (TypeScript)**, iOS first with the iOS 26 look and Android later. Start with a **runnable demo** that matches the approved mockups screen for screen. Then grow the demo into the real v1 along the milestones in `app-build-spec.md`.

**Stack decision (founder, Oct 6, 2026): React Native + Expo, not SwiftUI.** `app-build-spec.md` and the older brainstorm docs were written for SwiftUI. Their product logic, proxy design (Cloudflare Worker + D1, TypeScript), privacy model and milestones still apply, but wherever they name SwiftUI, SwiftData, StoreKit 2 views, XcodeGen or a Swift `KittedCore`, use the React Native equivalents in `05-build-plan.md` and `06-react-native-mapping.md` instead.

**The demo, concretely:**
- Every screen in `/Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html` is reachable in the app (iOS Simulator or a device; the web preview is for quick layout checks only), with the same layout, copy and states, in light and dark mode.
- The fit check runs end to end on bundled photos:
  - The vision step is a mock `ReadingSource` that returns bundled readings.
  - Scoring is the real TypeScript port of `rubric.py` (`ts/kitted-core/`), and its output matches the Python exactly on the parity fixtures.
- Closet, Lookbook and You are filled from seed data.
- The paywall runs on a mock store in the demo (real in-app purchases come later; see `05`).
- No network and no API key are needed.

**Who you're working with:** the founder is a college student building this alone for income, with $0 for marketing. He often talks to you by voice dictation, so messages can be rough; read for intent. He wants:
- Honest, critical feedback in plain language.
- A concrete recommendation, not a list of open questions. Rank options when it helps.
- Short status updates with screenshots. Tell him what's real and what's mocked.
- Never pretend something works. If a build fails or a test doesn't match, say so with the output.

Ask him only about genuine taste or risk decisions. Otherwise pick the sensible default, say which one you picked, and keep going.

---

## Read in this order

1. **`/Users/eyu/Desktop/files/Kitted/CLAUDE.md`**: the founder's own handoff file. It's always current, so read it first.
2. **`01-product-brief.md`** (this folder): what the product is, the locked rules, the voice, and the three FOUNDER DECIDES defaults.
3. **`05-build-plan.md`** and **`06-react-native-mapping.md`**: the Expo stack, this Mac's environment, project setup, the phased plan with acceptance criteria, the verification loop, known traps and what not to build.
4. **`02-screens.md`**: every screen. Layout, sizes in points, exact copy, states, navigation, VoiceOver labels, plus the screens the mockups don't draw yet and a copy deck.
5. **`03-design-system.md`** and **`ts/design-system/`**: color tokens (light and dark), type, spacing, radii, the component catalog and starter React Native code.
6. **`04-logic-and-demo-data.md`**, **`ts/kitted-core/`** and **`fixtures/`**: the rubric spec and its TypeScript port, the fix engine, re-check, corrections, partial checks, the bundled readings, the expected scores, the parity fixtures and the seed data.
7. As needed: `/Users/eyu/Desktop/files/Kitted/app-build-spec.md` (canonical engineering spec) and `/Users/eyu/Desktop/files/Kitted/brainstorm/13_setup-decisions.md` (rulings that override older docs).

**Look at the mockups before you write any UI.** Open `/Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html`, or render it to PNG with the headless-Chrome command in `05-build-plan.md`. The live copy is at https://claude.ai/artifact/DnMPLuPxLFs4N1x4wwjPy9; use the Artifact tool's `read` action if you have it. Inside each phone, **1 CSS px = 1 iOS point**: the phones are drawn at true iPhone 17 size (402 × 874 pt) and scaled with CSS `zoom`, so the numbers in the CSS are real point values.

## When documents disagree (precedence)

1. What the founder tells you in chat.
2. `CLAUDE.md`.
3. `brainstorm/13_setup-decisions.md` (the referee's rulings).
4. This handoff folder (`01`–`05`, fixtures). Inside it, each file owns one area: `02` = screens, navigation and copy; `03` = tokens, type, icons and components; `04` = logic and data (where its prose and a generated fixture disagree, the fixture wins, since the generators assert the numbers); `05` = environment, process and launch arguments.
5. `app-build-spec.md`.
6. `demo-app-spec.md` and the older brainstorm files.

**Exception:** for **visual layout, sizes and copy, the mockups win** over every spec doc, except where `02-screens.md` marks "differs from mockup because…" (those are deliberate fixes from the rulings). For **scoring, `rubric.py` is the source of truth**, and the TypeScript port must match it exactly.

**Reading SwiftUI terms:** `02` and `03` were first written in SwiftUI terms (NavigationStack, `.sheet`, text styles, SF Symbols). Translate them with `06-react-native-mapping.md`; the point sizes, copy and behavior stay the same.

**Known stale lines in `CLAUDE.md`:** "open to 14+", "under 14 is blocked" and "photos stay on the device" were written before the Oct 6 rulings. The founder hasn't re-decided them, so build the FOUNDER DECIDES defaults (18+, US only; the privacy wording in `02-screens.md` Y7) until he says otherwise. `brainstorm/13` §3 lists the suggested `CLAUDE.md` fixes; offer them, don't apply them yourself.

If you find a real contradiction that this order doesn't settle, pick the option that keeps the locked rules in `01-product-brief.md` §4, note it in `handoff/DECISIONS-LOG.md` (create it), and mention it in your next status update.

## What's in this folder

| File | What it is |
|---|---|
| `README.md` | This file: mission, read order, precedence, open decisions, working rules |
| `01-product-brief.md` | Product, locked rules, voice, the three big FOUNDER DECIDES defaults |
| `02-screens.md` | Screen-by-screen UI spec (screen IDs in §1.6), navigation model, copy deck (§5) |
| `03-design-system.md` | Tokens, type, components, the canonical SF Symbol table (§7), photo crops, dark mode |
| `06-react-native-mapping.md` | SwiftUI/iOS concept → React Native/Expo equivalent, for reading `02` and `03` |
| `ts/design-system/` | Starter React Native design system: tokens, typography, theme, fonts, symbols, components. `_stubs/` + its `tsconfig.json` let it type-check before the app exists; delete both once it's copied into the app (`05` §4.5) |
| `ts/kitted-core/` | `@kitted/core`, the TypeScript scoring package (rubric port, fixes, re-check, corrections, partial checks, Rotation): `src/`, Vitest tests in `test/`, `scripts/verify.mjs` (dependency-free gate) and `scripts/gen-rubric-data.mjs`. Reads `fixtures/` in place from here or from `app/packages/kitted-core/` |
| `archive/swift/` | The superseded SwiftUI starter code, for reference only |
| `04-logic-and-demo-data.md` | Rubric port spec, fix engine, re-check, corrections, partial checks, Rotation, seed data, mock `ReadingSource` |
| `05-build-plan.md` | Environment, what works before the Simulator runtime, setup commands, launch arguments, phases P0–P8 (with every screen mapped to a phase), verification loop, traps, scope limits |
| `REVIEW-NOTES.md` | The consistency passes: the SwiftUI-era pass, then the final **React Native pass** (at the end; it supersedes the Swift-specific items above it): every fix, the check results, and what's still open |
| `DECISIONS-LOG.md` | Doesn't exist yet. You create it the first time you settle a contradiction or change a decision |

**`fixtures/`** (all generated; regenerate with the command in `04` §0, which runs in about 2 s and needs no network):

| File | What it is |
|---|---|
| `readings/<id>.json` (12) + `readings/INDEX.json` | One v3 reading per demo photo, plus provenance, SHA-256 and latency |
| `readings/variants/*.json` (8) | Correction, swap, snap and the real p01 readings |
| `expected_scores.json` | 181 demo scoring cases + 23 mockup checks + fixes, re-checks, corrections, partials |
| `rubric_parity.json` (6.1 MB, one line) | 5,694 parity cases against `rubric.py` |
| `rubric.json` | The rubric's tables, rule amounts, fix catalog and `config` (minAge 18, limits) |
| `fixes.json` | The fix catalog (also inside `rubric.json`) |
| `rotation_expected.json` | Rotation results on the seed closet |
| `seed.json` | The two demo scenarios, `firstRun` and `full` |
| `kitted_logic.py` | Python reference for fixes, re-check, snaps, corrections, Rotation |
| `make_readings.py`, `make_seed.py`, `make_expected.py`, `make_parity.py`, `make_rubric_json.py` | The generators |

**Assets you'll bundle:** the demo photos are in `/Users/eyu/Desktop/files/Kitted/mockups/img/` (12 free-license Unsplash/Pexels stock photos; licenses are in `/Users/eyu/Desktop/files/Kitted/inputs/fitcheck-photos/metadata.csv`). They're fine for the demo, but must be replaced with the founder's own photos before any App Store or marketing use. **Never bundle or commit `inputs/mirror-fit-check-1*`.** Those are other people's photos, for private testing only.

## Working rules

- **Plan the phase, build, test, compare with the mockup, then commit.** Small commits with clear messages. Don't start the next phase while the current one's tests fail.
- **Verify, don't assume.** Typecheck, lint and run the tests, build the app (`npx expo run:ios` once a Simulator runtime exists), take screenshots, and put each one next to the matching mockup screen. Check light and dark mode, plus one large Dynamic Type size.
- **Keep it real where it's cheap.** Scoring, fixes, re-check anchoring, corrections, partial-check logic and Rotation are real code even in the demo. Only the AI calls are mocked.
- **Keep dependencies few and mainstream:** Expo SDK modules first, then the specific libraries `05` names. Ask before adding anything else. `@kitted/core` stays dependency-free. No API keys anywhere in the repo.
- **Respect the locked rules** (`01-product-brief.md` §4) in code, copy and screenshots.
- **Keep the docs honest.** If you change a decision, log it in `handoff/DECISIONS-LOG.md`. At the end of a session, offer to update `CLAUDE.md` with what was decided; it's the founder's file, so ask first.
- **Report like this:** what you finished, screenshots (light and dark), what's real vs. mocked, what's next, and any decision you need from him (with your recommendation).

## Your first steps

1. Read `CLAUDE.md`, then `01-product-brief.md`, then `05-build-plan.md` §1–§3 and `06-react-native-mapping.md`.
2. Re-run the environment checks in `05` §1. On Oct 6 there were **three blockers for any iOS build**, Simulator or real iPhone:
   - Node is v20.20.0, and Expo SDK 57 needs **Node 22.13+**.
   - Xcode is 26.3, and SDK 57 needs **Xcode 26.4+** (`05` recommends 26.6, which the founder downloads himself while signed in).
   - **No iOS platform or Simulator runtime** is installed (about 8–10 GB).

   The Android SDK has no emulator yet. An Expo account is already logged in on this Mac (`eas whoami`). **Ask the founder before installing or upgrading anything**, and before any EAS build. Wait for a clear yes on each.
3. **Right away, on today's Node 20 (no approval needed):** run the `@kitted/core` gate from `05` §1.3 (`tsc` from the global eas-cli + `scripts/verify.mjs`; it must end with "ALL CHECKS PASSED", 5,694/5,694), type-check `ts/design-system`, set up git and make the first commit (`05` §4.1), render the mockups to PNGs (`05` §6), and send the founder the Node 22 / Xcode asks (`05` §1.4).
4. **After he approves Node 22:** create the Expo project and copy in `ts/kitted-core` and `ts/design-system` in the exact order of `05` §4.2 steps 1–7, then build screens against the **web preview** (`npx expo start --web`, which needs Node 22 too), checking them with screenshots. Everything iOS waits for Xcode ≥ 26.4 and the iOS runtime.
5. Start **Phase 0** from `05-build-plan.md` (P0 + P1 are mostly this setup), and send the P0 report.

## Known open decisions for the founder

Build with the default; keep each one switchable from a single config value or constant; raise them in the P0 report (`05` §9) and don't block on them.

| # | Decision | Default to build meanwhile | Where |
|---|---|---|---|
| 1 | **Age floor and AI provider.** Gemini's terms require 18+ and bar apps "likely to be accessed by" under-18s; `CLAUDE.md` still says "open to 14+". | **18+, US App Store only.** `rubric.json → config.minAge` = 18; provider behind `ReadingSource`, name from config. | ruling 1, `inputs/app-store-and-age-rules.md`, `inputs/ai-provider-research.md` |
| 2 | **Design system.** Mockup look (chalk, indigo, copper, Archivo numerals) vs. `app-build-spec.md` §6 (warm paper, loden, New York). | **The mockup look**, exactly as in `03-design-system.md`. | ruling 29 |
| 3 | **Keep the full-face original?** | **Never store the face.** Only the neck-down 2048 px copy + 400 px thumb, used everywhere (chat bubble, card, Lookbook, share card). | ruling 11, `brainstorm/09` |
| 4 | **Declared Age Range.** `expo-age-range` covers it, but the iOS 26.4 call needs Xcode 26.4+ (also required by Expo SDK 57). | **Stub it behind an `AgeAssurance` interface** in the demo; the blank birth-year gate is the real check. Wire up `expo-age-range` after the Xcode upgrade. | `05`, ruling 3 |
| 5 | **Rotation counting with layers.** The specified rule gives about 180 fits for the 16-item seed closet (one layer item shows "+48 fits"); the mockup shows 37. | **Implement `04` §9.1 exactly**, and show the seed's display numbers (37, "+3 this week", "+9 fits") with the rules in `04` §9.4. Options for him: core-only counting, or "a layer counts only if it changes formality or color story". | `04` §9.4 |
| 6 | **Unblocking iOS builds:** Node 22, Xcode 26.4+ (26.6 recommended), and the iOS platform/runtime (about 8–10 GB). Later: a development build on his iPhone (needs the Developer Program) or EAS builds. | **Don't install until he says yes.** Until then build against the web preview and run the core tests (`05`). | `05` |
| 7 | **Mono label case.** Ruling 29 says sentence case; the mockup draws uppercase. | **Sentence case** (`MONO_UPPERCASE_AT_NORMAL_SIZES = false` in `ts/design-system/typography.ts`). Flip the constant for the mockup look. | `03` §3.3 |
| 8 | **Archivo for stat numerals** (Rotation "37", Lookbook "4 / 19", fits counts, the camera countdown). Ruling 29 says "Archivo only for score and wordmark". | **Yes, Archivo** (they're drawn with the score's `.score` class). Prices and the height stepper stay SF Pro either way. One-line switch: `ARCHIVO_FOR_STAT_NUMERALS` in `ts/design-system/typography.ts`. | `03` §3.3 |
| 9 | **Should a 10 be reachable?** (rubric v3 maxes at 9.5) and **human calibration** of the rubric. | **9.5 max**; never claim 10 in copy. | `rubric/v3.md` |
| 10 | **Developer Program + Paid Apps Agreement**, and **deleting the Gemini key pasted in chat on Oct 6**. | Not needed for the demo; remind him in the P0 report. Never use that key. | `CLAUDE.md`, `05` §9 |
| 11 | **Stack.** Decided by the founder on Oct 6: **React Native + Expo**. | Build with Expo. Native Swift only inside one small Expo module, `modules/kitted-vision` (Apple Vision neck-down crop, face pixelation, and later the camera view). Age range and App Attest use first-party Expo packages. | `05`, `06` |
| 12 | **In-app purchases for v1.** | Mock store in the demo. For v1, `05` recommends **RevenueCat** (`react-native-purchases`, free up to $2.5K/month) with our own paywall screens; the alternative is `expo-iap`. | `05` P6 |
