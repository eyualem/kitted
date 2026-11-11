# T39 · Report

The implementer and the verifier write the rest of this file. The test writer adds only to Disputes.

## Disputes

**Re-lock 1 (test writer, 2026-11-10, at the coordinator's request): retiring the old birth-year tests.** The implementer may not edit tests, and the approved spec (`specs/onboarding-screens.md` OS3–OS4; DECISIONS-LOG #412–#413) removes the behaviour these tests pinned, so after the build they would fail or pin removed code. Each was retargeted, or retired only where a named T39 test holds the same promise under the new spec:
- `birthYearStep.test.ts` BY1 (source text of the birth-year card): retired. Its promise (only the age is asked, no height, build or fit; one layout for setup and Restore) is held by `T39-setupScreens` › `OS4.1 · on open: …` and `SY4.1 · the name comes first and is optional`, both strengthened to assert no "Height", "Build", "Fit you like", "Fitted", "Regular" or "Relaxed" (and Restore's same five radio rows).
- BY2 (source text: Continue waits for a year, hint while none): retired → `OS4.1 · on open: …` and `OS4.1 · one tap picks, another moves the pick`.
- BY3 (source text: under 18 asks once, then the Keychain lock): retired → `OS4.4 · Under 18 asks once with the new title`, `OS4.4 · That's right locks the app`, and `F1.2 · nothing picked, then the stop`. The under-18 stop stays asserted.
- `onboardingAccount.test.ts` "fills on Consent (step 4)": retargeted to "fills on About you (step 3)" (`ONBOARDING_STEPS` 3, "Step 3 of 3"); red now (4 ≠ 3).
- `youTonight.test.ts` YT6 "the birth-year row reads …": retired (YT6's "Score my fits" hint check kept) → `T39-styleProfile` › `OS4.6 · Name, Fit you like, Age, and the footnote` and `OS4.6 · an older profile shows the band from its birth year`.
- `heightBuildRemoved.test.ts` HB3's last line (`profile.tsx` matching `onb.basics.birthYear`): retired; the rest of HB3 kept → `OS4.6 · Name, Fit you like, Age, and the footnote`.

No test was loosened: three source-text checks of removed code were replaced by rendered tests that already existed in the lock, and two of those were strengthened.

**OS4.7's synced-kv clause, narrowed (accepted by the coordinator).** "For every key in `KV_SYNCED`, its outgoing value for a stored value containing the name and band contains neither" can't hold for keys with no `outgoing` (they send whatever is stored). The test checks every synced key's outgoing value for the values the app actually holds mid-setup and after `finishSetup`. The wording in TESTING.md now says so.

**Implementer (build 1, 2026-11-10): two locked tests that no build can pass.** Built around neither; both need a test-writer fix.

1. `app/src/__tests__/T39-setupScreens.test.tsx` › `OS4.4 · Change changes nothing` (lines 510–513). The test presses Continue with Under 18 (the alert is shown), then calls `jest.clearAllMocks()`, then `alertButtons()`, which reads `life.alert.mock.calls.at(-1)![2]`. `life.alert` is a `jest.spyOn(Alert, 'alert')`, and `clearAllMocks` empties its `mock.calls`, so `.at(-1)` is `undefined` and the test throws `TypeError: Cannot read properties of undefined (reading '2')` before it checks anything. The spec (OS4.4: "`Change` changes nothing") and the screen agree; the test's own set-up loses the alert. What it should say: take the buttons before clearing, e.g. `const buttons = alertButtons(); jest.clearAllMocks(); buttons[0]!.onPress?.();`, or clear only the router and Keychain mocks. (Its sibling tests `Under 18 asks once …` and `That's right locks the app` pass, and the Change button is `{ text: 'Change', style: 'cancel' }` with no handler.)
2. `app/src/__tests__/T39-offerCard.test.tsx` › `OS5.7 · setup, the offer, Later, Check my fit and Not now send nothing` (line 302). Run 2 clears the mocks, then `walkToCard()` taps a Looks tile and `Continue · 1 of 3`, which pushes `/onboarding/basics` (OS3.2 › `each step goes to the next …` requires exactly that push, and OS3.3 says Looks behaves "as before"). Then `expect(pushes()).toEqual(['/camera'])` gets `['/onboarding/basics', '/camera']`. The two tests can't both hold. What it should say: `expect(pushes().filter((p) => p.startsWith('/camera'))).toEqual(['/camera'])`, or `(router.push as jest.Mock).mockClear()` after `walkToCard()`. Because the test stops at line 302, the rest of run 2 (the camera's agreement, Not now, nothing sent) isn't reached by this test; run 1 (Later) passed before it, and `OS5.2 · Not now and the X …` covers the same Not now path with fetch and the transport asserted empty in every test's afterEach.

**Test writer's ruling on the implementer's two disputes (re-lock 2, 2026-11-10): both upheld; both were bugs in my tests, not in the spec or the build.** Fixed without loosening any expectation:
1. `OS4.4 · Change changes nothing`: the test cleared all mocks (the `Alert` spy with them) before reading the alert's buttons. Now it takes the buttons first, asserts the one it presses is `{ text: 'Change', style: 'cancel' }`, then clears and presses it; every check after is unchanged. Passes on build `09498ef6`; bites: giving Change the lock as its `onPress` fails it ("setAgeBlocked: expected 0 calls, received 1"), reverted.
2. `OS5.7 · setup, the offer, Later, Check my fit and Not now send nothing`: run 2 compared all pushes to `['/camera']`, but the walk's own Looks Continue must push `/onboarding/basics` (OS3.2). Now it asserts the walk pushed exactly `['/onboarding/basics']` (so a camera opened during setup still fails it), clears `router.push`, and then Check my fit must push exactly `['/camera']`. Passes on the build; bites: a `router.push('/camera')` after setup's Continue fails it (an extra "/camera"), and a `fetch` inside `tapLater` fails it (fetch: expected 0 calls, received 1); both reverted.
The spec is unchanged; both files pass in full on the build (setupScreens 21/21, offerCard 10/10).

## Built

**What changed, in plain words**
- Setup is Welcome → Looks → About you → Stylist. Looks has a large title ("Which of these would you actually wear?") and the line "Tap up to 3." instead of Kit's bubble; the progress bar has 3 segments.
- About you (the Basics screen, rebuilt): "About you", "What should Kit call you?" with an optional first-name field, "How old are you?" with five choices (Under 18, 18–21, 22–25, 26–30, 31 or older), nothing picked, the footnote "Stays on your phone. It never changes your score.", and Continue off with "Pick your age to go on." until he picks one. His pick and name are kept in kv (`onboarding.about`, local) on every change, so a close keeps both. Restore shows the same list titled "Welcome back" with "Your age first, then I'll bring back your fits." and no name field.
- Continue with an 18+ band: `finishSetup` saves the profile (looks, an older draft's fit, `ageBand`, `ageBandAt`, the cleaned name, no birth year, no consent), posts Kit's first message as today (the `aiNote` line in `complete.ts` is untouched), then the offer card under it, and clears the step drafts and resume step; the screen then marks setup done and goes to Stylist. Nothing opens the camera. A failed write leaves him on About you with Continue working. Under 18 asks "Under 18?" / "Kitted is for ages 18 and up." once per tap; That's right sets the Keychain flag and the gate shows today's stop screen.
- The old agreement step is gone: `/onboarding/consent` redirects to About you, and an install closed on it resumes on About you.
- Kit's offer card in Stylist: "Want to check a fit now?" and its line as one VoiceOver element, Check my fit (camera icon, "Check my fit. Opens the camera.") and Later. Check my fit opens the camera, where the agreement shows first for a new install (today's camera words; the intro is now plain text). Later posts "No rush. Tap the camera button whenever you're ready." once and saves `firstCheckOffer.laterAt`. Not now or the X on the camera's agreement posts today's "Turn on fit checks" once (only after a new setup). The buttons go for good after Later, Not now, or any scored check, and never show read-only.
- Style profile: a Name row (editable inline field, saved trimmed to 30 by the page's usual save), Fit you like, and a read-only Age row ("Age, 22–25"; an older profile shows the band from its birth year; "Not set" with neither), with "Age can't be changed here." under the card.
- Data: migration V9 adds `age_band`, `age_band_at`, `name` (nullable) to `profile`; sync never sends the three (a pulled row keeps this phone's), and both new kv keys are local.

**Files**
- New: `app/src/features/onboarding/ChoiceList.tsx`.
- Rewritten from the test writer's stubs: `app/src/features/onboarding/aboutStep.ts`, `firstCheckOffer.ts`, `FirstCheckOfferCard.tsx`.
- Changed: `app/src/features/onboarding/{BasicsScreen.tsx, PickLooksScreen.tsx, OnboardingNav.tsx, resume.ts, ConsentScreen.tsx, basics.ts, complete.ts}`, `app/src/app/onboarding/consent.tsx`, `app/src/features/you/profile.ts`, `app/src/app/(tabs)/you/profile.tsx`, `app/src/data/{tables.ts, migrations.ts}`, `app/src/sync/schema.ts`, `app/src/i18n/en.ts`, `app/src/features/stylist/MessageView.tsx` (the import and one card-switch line), `app/src/demo/{scenarios.ts, prepareDemoScreen.ts}`, `app/src/design-system/components/KText.tsx` (deviation 1).

**Deviations**
1. `design-system/components/KText.tsx` (listed as not touched): an optional `testID` prop passed to the `Text`. The locked tests find `looks-title`, `about-title`, `offer-title`, `profile-age-value` and the rest as `Text` elements carrying a testID (OS3.3 filters `n.type === 'Text'` with a testID), and `KText` had no way to take one. No visual change.
2. The About you draft's pure parts (`AgeChoice`, `AGE_CHOICES`, `isAgeBand`, `ABOUT_KEY`, `AboutDraft`, `EMPTY_ABOUT`, `parseAbout`) live in `basics.ts` and are re-exported by `aboutStep.ts` with the interface's names, so `loadDraft` can return the About draft without an import cycle (Metro warns on cycles).
3. `saveAbout` and `tapLater` write their kv keys as string literals (`'onboarding.about'`, `'firstCheckOffer.laterAt'`), not the constants: `syncSchema.test.ts`'s scan of `.setKv(` calls only resolves literals and a fixed list of constant names, and it isn't T39's to extend.
4. Kit's new messages (the card, the Later line, the "Turn on fit checks" card) take the next id no message has: an id that's already in the chat would replace that message. Found by `OS5.3 · tapLater once`, whose fresh `counterIds()` repeats `M-1` (Kit's first message).
5. Demo screens 280–283 use a scenario helper (`prepareOffer` in `prepareDemoScreen.ts`); screen 283 adds a story entry (the first check, as 150–162).
6. `sync/schema.ts`: the three omitted profile fields start `undefined` (absent) on a new phone, not `null` as the plan wrote. With `null`, the sync engine's E8 test ("a fresh phone ends with the same synced data") failed: the pulled row gained three `null` keys the original row didn't have. Absent is what a pre-V9 profile has, and the app reads them as `p.ageBand ?? null` (technical default 3). They are still never sent, and a pulled row keeps this phone's values (the T39 no-leak tests pass).

**Test results (build 1)**
- T39 files: aboutStep 12/12, noLeak 3/3, styleProfile 4/4, setupScreens 20/21, offerCard 9/10; the two red ones are the disputes above.
- T38's locked tests (the four drawnWelcome files) and the retargeted older ones (birthYearStep, onboardingAccount, youTonight, heightBuildRemoved) pass.
- Full app Jest (`npx jest --no-watchman -w 2`): 1738 passed, 2 failed (the disputes), 4 skipped. `npm run check`: tsc, core typecheck, lint (0 errors; 1 warning in tryOn's test, not T39's) and core tests (853) pass; its Jest step died on watchman ("unable to talk to your watchman"), so Jest was run with `--no-watchman` instead.
- In one busy full run with default workers, `OS3.1 · Looks, About you … render no bubble` hit Jest's 5 s timeout (it renders 5 screens in 8 looks; about 1.9 s on its own, and it passed in the two-worker run).

**Not done / not verified**
- The two disputed tests above (red until the test writer fixes them).
- No flow run and no screenshot: no Simulator this session (low memory). Every flow in TESTING.md and the UI inventory's light, dark and largest-text states are not verified, including VoiceOver's reading order, the keyboard riding the dock, and the Name row's tap-to-focus.
- Demo screens 3, 4, 280–284 were not opened (no Simulator or web preview); their set-up only runs code the unit tests cover.
- `ChoiceList`'s pressed `surface2` fill and the checkmark's look are as written, not seen.
- Follow-ups from the plan's technical defaults: move `ChoiceList` into the design system; RestoreScreen passing `ageBand` (T41); deleting `BirthYearSheet`, `/sheets/birth-year`, the echo helpers and their strings.

**Demo screens that show it**
- 2 Looks · 3 About you (on open) · 4 About you · ready (22–25, "Alex") · 136 Restore · welcome back.
- 280 Stylist · Kit's offer · 281 after Later · 282 after Not now · 283 after a scored check.
- 284 Style profile · Name and Age ("Alex", 22–25) · 80 Style profile, an older profile (birth year 2005 → 18–21).
- 12 and 212: set up before this change, no offer card.

## Screenshots (coordinator, Nov 10)
On the iPhone 17 Pro Simulator, light and dark, in `tasks/T39/shots/`: Looks (demo 2), About you on open (3) and ready (4), Kit's offer (280), after Later (281), after Not now on the camera's agreement (282), Style profile with Name and Age (284).
- **Trap hit:** the first set showed Style profile's old "Birth year" rows. Metro was bundling route files (`app/(tabs)/you/profile.tsx`) from the main checkout, through the borrowed `node_modules` (build notes #377). Re-shot with a temporary, uncommitted `app/metro.config.js` that gives this worktree its own cache. The `features/` screens were right in both sets.
- **Checks on the merged branch (T38 + main + T39):**
  - The T39, T38 and retargeted suites pass, 157 of 157. `tsc` is clean, and lint has 0 errors (6 warnings, all in main's test files).
  - The full Jest run had 1826 passed and 2 failed, both timeouts under load: `outfitSpeed` (352 ms against 300 ms) and `T39-offerCard` OS5.7 (more than 5 s). Core had one parity test time out.
  - Run alone, all three pass (15 of 15; parity 8 of 8). `T39-offerCard` OS5.7 runs close to the 5 s default, so it can flake on a loaded machine.
