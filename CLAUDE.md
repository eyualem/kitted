# Kitted

A chat-first stylist iOS app for guys 18–30: send an outfit photo, get a fit score out of 10 with a word and the fix that raises it, and the app learns your closet as you go. React Native + Expo (iOS first), scoring in `@kitted/core`, AI calls through a Firebase server. Built by one founder, a college student, with $0 marketing.

**This file holds only the rules.** It loads in every chat, so keep it short (under ~150 lines). Change it only for a lasting rule: one the founder gives, or a trap every chat would hit. Never put status, dates, to-dos, feature descriptions or test results here.

## The documents
- **`CLAUDE.md`** (this file): how to work.
- **`specs.md`**: the blueprint of what the app is (product, audience, scoring, privacy, tabs, pricing). Written once with the founder. **Changed only for a big change, and only after the founder says yes in chat.** Never edit it to match what got built: if the build and the spec disagree, stop and ask.
- **`specs/<feature>.md`**: one per feature, planned with the founder before any code: what the user sees, the copy, the states, and the pass/fail checks. Once the founder approves it, the same rule as `specs.md`: changes only with the founder's yes. Status and results never go in a spec.
- **`plan.md`**: the live state: where things stand, what's next in order, the founder's to-do list, open decisions with their defaults. **Update it after every finished step and at the end of every session, without being asked.**
- **`handoff/DECISIONS-LOG.md`**: append-only and numbered. Every decision, settled contradiction or technical lesson, with the reason.
- **`specs/` is written lane by lane** (each lane's first task in `plan.md`). Until a feature has its spec, its detail is in the `handoff/` docs; where they disagree with `specs.md`, `specs.md` wins.
- Never start any other status, handoff or plan file.

## How to work
1. **Start a task** by reading `plan.md`, then the spec for the feature you're touching. Open only the reference docs the task needs. Claim your task first: mark it `[~] <your session name>` in `plan.md`, commit and push, so no other session takes it. Work only on files in your task's lane; a shared file (listed in `plan.md`) is edited by one session at a time.
2. **Build what the spec says.** Write the pass/fail checks before the code. If the spec looks wrong, or the work needs something it doesn't cover, ask; never redesign quietly.
3. **After each finished step:** `npm run check` in `app/` (on its own, then commit), commit, push the branch, update `plan.md`, and add a DECISIONS-LOG entry if anything was decided. In `plan.md` change only your own task lines, your to-do items and one session-log line (keep the last 15). A task is `[x]` only once merged to main; until then it stays `[~]` with its pull request.
4. **Ask before:** spending money (AI test runs included), installing or downloading anything, a new npm package, an EAS build, merging to main, or making the repo public.
5. **Work only in this folder.** Codex and Gemini research outputs go in `inputs/`.
6. **Test with a real person's profile, never a made-up one.** For each photo record who it is, the age band from their own birth year (18–21, 22–25, 26–30, 31+), their picked looks (up to 3, in order), their fit if given, and the occasion; split results by age band and by look. Never estimate age from a photo. Stock and web photos are "profile unknown", run with one stated test profile. Profiles live in `inputs/` (git-ignored): first names or codes, with the person's OK.
7. **Keep the founder's to-do list current** (in `plan.md`): anything only the founder can do (a phone test, photos, an account, a decision) goes there in plain words, with P1 (this week), P2 (before the beta) or P3 (before launch), how long it takes and what it unblocks. Now and then, not every message, end a report with one line naming the 1–3 items that unblock the most.
8. **The Mac's memory:** several agents are fine, but check `top -l 1 | grep PhysMem` before heavy work and never stack heavy jobs (an iOS build, a Simulator, `npm run check`, big Python runs). Slower is fine.
9. **Simulators: at most two booted at once.** The main one is iPhone 17 Pro, `111D0A09-C2CA-4F72-BF3C-44019A05C89D`. Boot a second only when another session is using the first, and shut down any Simulator you booted when you're done. Never use `EF7ADF2A` (a broken duplicate).
10. **Other sessions share this repo:** stage only your own hunks of shared files (`git add -p`), and never use a bare `git stash`.

## The founder, and how to report
- A college student building alone for income. Into style, anime and good movies; taste from Tim Dessaint, Wanhee Kim, Jaye Alexander and Frugal Aesthetic. Often talks by voice dictation: read for intent.
- **Teach as you go.** The founder is learning software engineering to apply for internships. When a task uses something worth knowing (git, tests, an architecture choice, a trade-off, a debugging method), explain it in a few plain sentences: what it is, why it's used here, and how it might come up in an interview. One or two lessons per task, not a lecture on every step. Offer small parts the founder could try by hand.
- Uses **Codex** (Chrome: Reddit, TikTok; also machine setup) and **Gemini** (YouTube transcripts) for research. Claude writes their prompts and checks what comes back.
- **Honesty first.** Honest, critical feedback backed by research, with sources, in plain language. Push back when something is a bad idea.
- **Never pretend something works.** Say what's real, what's mocked and what wasn't checked. If a test fails, say so and show the output.
- Give concrete recommended decisions, not open questions. Rank options when it helps (user psychology, competition, chance of success, money).
- Status updates say what the founder will **see** in the app, never spec IDs or PR numbers, with screenshots.
- **Ask the founder only about** taste, money, installs and downloads, new dependencies, and anything outward-facing (words users read, store text, posts). Settle everything else yourself and log it.
- Navigation and setup must be flawless: check plans against Apple's HIG and the UX checklist in `research-context.md` §C14.

## Hard lines (never break; the detail lives in the spec)
- **Never rate faces, bodies, weight or skin,** and never say anything about a user's body. Traditional clothing is "not rated".
- **"The AI sees, the code judges, the AI explains."** The vision model only describes clothes; `@kitted/core` computes every score and number; the AI only puts it into words. Same photo, same score.
- **The Python engine in `extraction-test/` is the scoring source of truth.** `@kitted/core` must match it exactly (the parity tests). Never edit fixtures to make tests pass.
- **Privacy:** only the copy with every face blurred is sent for scoring; if the head can't be found, nothing is sent. The server keeps no questions or answers, and no photos unless he turns on photo backup (off by default; his own photos, readable only by his account). Location is approximate, for weather only, never stored.
- **18+, US App Store only.** Marketing speaks to adults (college, first job, dates), never high school.
- **Words:** no emoji, no RPG ranks or anime theme, no daily streaks. Never "unlimited", never "AI stylist". The stylist is Kit, an AI persona, and says so plainly if asked; the app is Kitted.

## Which document wins
1. The founder, in chat.
2. This file.
3. `specs.md`, then the feature's spec in `specs/` (until they exist: `brainstorm/13_setup-decisions.md`, then the `handoff/` docs).
4. Everything older (`app-build-spec.md`, `demo-app-spec.md`, `brainstorm/`).

`plan.md` records status and never overrides a spec. The mockups win on layout and copy unless a spec says why it differs. The Python engine wins on scoring.

## Running things
- Node 22.23. Xcode 26.6 (`/Applications/Xcode-26.6.app`, selected); leave Xcode 26.3 alone. Bundle id `com.trykitted.kitted`; Apple Team ID `6652QVRQAL`.
- **Metro and the web preview:** the Browser pane's `preview_start` with `name: "kitted-web"`. The web preview (`http://localhost:8081/demo/screen/<n>?theme=dark&frame=1`) is for layout only; iOS is the truth.
- **Checks:** `npm run check` in `app/`. Before a release: `npm run guard:release`, then `npm run check:app -- <Kitted.app>`. Server: `npm --prefix tests run emulate` in `firebase/`.
- **A demo screen on the Simulator:** `xcrun simctl launch <udid> com.trykitted.kitted -demoScreen 7 -theme light -demoLatency 0`, then `xcrun simctl io <udid> screenshot <a new path>`. Don't use `simctl openurl` (it raises a prompt a script can't dismiss).
- **Native rebuild,** only after a native package or `app.config.ts` change: `LANG=en_US.UTF-8 npx expo prebuild --platform ios --no-install` first, then `LANG=en_US.UTF-8 npx expo run:ios --device <udid> --no-bundler` (always the UDID, never the name). A new Swift file in a local module needs `pod install`.
- **The founder's phone:** `tools/phone/install.sh` (Metro running, phone unlocked, same Wi-Fi); `tools/phone/pull.sh` copies its logs and data. Troubleshooting (trust, the 7-day permit, the Mac's address, the under-18 lock) is in `handoff/15-build-notes.md`.

## Coding traps (the full list: `handoff/15-build-notes.md`, and DECISIONS-LOG)
- DECISIONS-LOG numbers collide across parallel branches (two branches each take "the next one"). Before merging, renumber the branch's entries to the next free number on main.
- Hermes on iOS lacks parts of `Intl`: use `app/src/i18n/format.ts` and core `time.ts`.
- A scrolling iOS sheet needs its ScrollView as the root (`SheetScaffold`). No `inverted` FlatList on iOS 26. No `KeyboardAvoidingView` around absolutely positioned docks.
- The closet belongs to the closet service: fit-check code writes through `patchCheckKeepCloset`, never `closetSummary` or `itemIds` directly.
- The React Compiler lint rejects `sharedValue.value = …` in callbacks (use `.set()`) and `Date.now()` in render.
- The Mac's disk ignores case: `latestPill.ts` next to `LatestPill.tsx` breaks imports.
- iOS 26 tab bar: it draws above the screen, and shrink-on-scroll needs the screen's first view to be a ScrollView.
- On the Simulator, tap glass buttons and a toast's Undo with `duration: 0.15`.
- A worktree that borrows `node_modules` by symlink tests the main checkout's `@kitted/core` and shares Metro's cache; see the full list before testing a core change from a worktree.

## Docs map
- `handoff/DECISIONS-LOG.md`: every decision and lesson (append).
- `handoff/01`–`06`: product brief, screens and copy deck, design system, logic and fixtures, build plan, React Native mapping.
- `handoff/07`–`14`: the stylist chat, accounts and sync, the UI review backlog, onboarding, the Firestore schema, the two-shot check, the server, the share card.
- `handoff/15-build-notes.md`: how to run things in detail, and every lesson from the build.
- `rubric/v5-styles.md`: the live scoring rules in plain words. `rubric/stylist-guide.md`: what Kit knows about style.
- `mockups/kitted-mockups.html`: the visual source of truth.
- `market/`: market research, AI costs, App Store Connect drafts.
- `extraction-test/`: the Python engine, the vision tests and their results.
- `handoff/archive/`: history only; don't follow.
