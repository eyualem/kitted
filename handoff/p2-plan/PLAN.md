# P2 build plan: the Stylist chat and the fit check (Oct 7, 2026)

Merged from four planning passes: designer (`design-spec.md`, saved verbatim), engineer, tester and an iOS investigation (the sheet-scroll fix, DECISIONS-LOG #18). The engineer and tester reports were not saved as files; their substance is below.

**Goal (what the founder sees):** in the Stylist tab, pick a demo photo, watch the reading card, get the 8.0 "Sharp" card with its fix, open "Why 8.0?" and "Not quite right?", re-check to 9.0, see the partial check on s24, and the idle Stylist home. Mockup screens 6–12 (and 13's thread), real scoring, bundled readings.

## Architecture (engineer)

- **Core additions (pure TS, tested in Vitest):** `time.ts` (`dayKey` with the 4 am rollover, `nextRolloverMs`, `weekdayOf`, US Eastern offset, Nov 1 DST cases); `ledger.ts` `explainScore()` (a trace hook in `rubric.ts`; parity guard that `.result` equals `score()` on all 5,694 cases); `closetMatch.ts` (`matchClosetItem`, `closetPlan` for "Added N to Closet"); `recheckOutcome()`; `removeGarment()`; `FixOptions.excludeTargets`.
- **Data:** V2 migration (`fit_checks.details` JSON, `readings.derived_from`); repos for chat, fitChecks, readings (insert only), closet, usage, profile, corrections, outfits, wearLog behind one `KittedStore`; SQLite and an in-memory store (web + Jest) with the same interface; a change bus + `useLive()` hook for live reads; `seedLoader` (`full` with `asOf`, `firstRun`; snake_case fixes → camelCase).
- **Services behind interfaces:** `ReadingSource` (async iterable of events) with `MockReadingSource` (schedule at fractions of the latency: photoOK .03, sending .06, top .40, outer/held .52, bottom .64, shoes/missing .78, fit .85, color .92, reading 1.0; `holdAt` for screen 6; faults); `ImagePrep` (demo); `QuotaService`; `Entitlements`; a scheduler (fake in Jest); ids.
- **Fit-check machine** (`src/features/fitcheck/machine.ts`, pure reducer + effects): idle → preparing → reading{stage, slots, slow} → explaining → scored | partial | failed{counted:false} | unreadable | notClothed | unknownPhoto | cacheHit | limitReached | held. Timers per attempt: hedge 5 s (only before the first slot), slow 9 s, **abort 14 s**. Failures never use quota. Occasion taps during a reading only store the choice.
- **Service** (`service.ts`) runs the effects: posts the photo + card messages, writes readings (never edits them), scores via `evaluateCheck` (score + suggestFixes + closet plan), handles re-check (anchor = the parent's *current* reading), corrections (new `corrected` reading + closet field confirm), shoe snap / pick from closet / skip, occasion re-score (score first, fixes next tick, cached).
- **Thread:** inverted `FlatList` of `buildThreadItems()` (day stamps, "who" header on the first stylist message after a stamp); cards look up their fit check by id and re-render alone. Composer idle (quick-starts + "Check my fit") vs compact.
- **Sheets:** all via `SheetScaffold` (ScrollView as the sheet root). Why, Not quite right?, Added items, Pick shoes, Tell me; Photo viewer cover; a demo **Sample photos** sheet stands in for the camera and library in P2 (camera = P3; `expo-image-picker` deferred to P3).

## Visual spec (designer)

See `design-spec.md` for every measurement. Key rules: neck-down crops everywhere (crop math in §C, implemented and tested); copper only on gains, links, the Next-level lead, the delta pill/chevron, mistake values, the open read-row question and the spinning ring; hit padding inside `KButton`/`Chip`/`TextLink` means card gaps shrink (footer gap 6); one VoiceOver element per card with custom actions.

## Build order (one commit each, `npm run check` green after each)

1. Core `time.ts`. 2. Core `explainScore` ledger + parity guard. 3. Core closet match, re-check outcome, removeGarment, excludeTargets.
4. App clock gets `offsetMs`. 5. Data V2 + repos + memory store + change bus + `useLive`. 6. Seed loader + boot seeding.
7. Mock reading source, demo photos, image prep, quota, entitlements. 8. `scoring.ts`, `explain.ts` (summary templates), `labels.ts`, new strings.
9. Machine + tests. 10. Service + end-to-end story tests.
11. Design-system additions: GarmentIcon (port of the mockup's `gi()`), Toast, DeltaRow, AddedRow, QuickStartChip, Composer.
12. Stylist screen: thread, composer, header subtitle, cards, sample-photos sheet. 13. Sheets: Why, Not quite right?, Added, Pick shoes, Tell me, Photo viewer.
14. Demo wiring (`prepareDemoScreen` runs the real service at latency 0) + screenshots vs mockup (web, then Simulator, light + dark, AX5).
15. If time: Ask a question (mock answers), Turn on fit checks, offline banner.

## Tests (tester)

- Reducer: every transition incl. timers with a fake clock (latency 12 → slow at 9 s then scored; latency 20 → hedge once at 5 s, slow 9 s, failed at 14 s, no timers left), occasion changes (p01b: everyday/class/date/gym/home 8.0, interview/event 6.5), re-check (p01b→p01a 9.0 raw 8.75, +1.0; no change keeps 8.0 and shows S21; Tell me → 9.0), corrections (chinos→slim "Score stays 8.0", raw 7.775; →wide 7.5), partial s24 (pick S1 → 7.0 "Full check (shoes from your closet)"; snap → 6.5 "Full check"; skip persists), same photo twice (no quota, same score), unknown photo.
- Mock source event order and times at 6.6 s; latency 0 runs instantly; abort cancels cleanly.
- Seed counts (16 closet items 6/3/4/3, FC0–FC3R scores 8/9/6.5/8/9, usage 1/1 + re-check used + 2/5 questions at 12:20, 9 facts, 19 wear days); re-scoring every seeded check reproduces its stored score.
- Card view-models for every `expected_scores.json → fixes` case; Why ledger rows; re-check view-model.
- Copy audit over strings **and view-model output**: no "AI stylist", no "unlimited", no emoji or dingbats (✓ ▾ ↑), no unfilled `{`, no score above 9.5, words always from `overall`; never body/face words outside the allowed four strings.
- Components: one accessible element per card, `spokenScore` ("8", not "8.0"), ≥ 44 pt targets, AX5 stacking.
- Visual QA per screen vs the mockup DOM positions (tester's numbers), allowed differences listed in `design-spec.md` §B.

## Decisions taken (defaults; flagged to the founder)

1. **Re-check anchors on the latest (corrected) reading.** A chinos correction before the re-check makes the after-score 8.5, not 9.0 (honest). Demo screen 10 skips the correction step; the paywall's "8.0 → 9.0" is computed, not copied.
2. **Why sheet adds a rounding line** ("Rounded to the nearest half · +0.25") when the rows don't add up to the shown score. New copy; founder to confirm.
3. **"This is dialed in. Nothing to fix." only at 9+.** Below 9 with no fix, a neutral line instead ("No quick fixes for this one."). New copy; founder to confirm.
4. **Never show "Go unlimited"** from `seed.json`; use `limit.pro`.
5. **Abort at 14 s** (T8, 04 §11), not 16 s (D6's wording is the live request timeout).
6. **Screen 6 shows the honest event order** (pieces 3 of 4 with shoes pending, so "Checking fit" isn't active yet), a small difference from the mockup.
7. **Screen 11 runs the s24 check live** inside the `full` scenario as of Oct 20 08:09, so it uses the real code path; "Same shoes as Monday?" is computed from the check's own date.
8. **Ledger order:** earned credits in rubric order, then unearned in rubric order (matches mockup 8).
9. **Occasion-hint** shows only until he taps a chip.
10. **Tailor tag** uses the deck's `Tailor ~${price}`.
11. **Fix copy and rule names come from rubric data** (English in the core), treated like remote data; summary templates and the 27 rule names are new copy drafted from `rubric/v3.md`.
