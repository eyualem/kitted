# T1 · The 10 waiting pull requests, reviewed against the spec

Reviewed Nov 7 against main at 2abd6b91, `specs.md` and CLAUDE.md. Read-only: four reviewers each read a group of branches, and Claude re-checked each verdict's key claim in the code (noted under "Checked"). No branch was rebuilt and no test was run, so every PR's own "tests pass" is from its author and is not re-verified.

**What all 10 share:** every one was opened before `specs.md` (Nov 7), and every one conflicts with main in the same two places. Each one writes to the old status lines in CLAUDE.md, which main has since removed, and each reuses a DECISIONS-LOG number main already has. Those two conflicts are easy: drop the CLAUDE.md hunks and give the log entry the next free number (395 and up).

## The verdicts
- **Fix, then merge (4):** #50, #36, #48, #58 → #57
- **Close, branch kept for parts (4):** #59, #49, #44, #39
- **Your call on a line of copy (1):** #41
- (#57 and #58 count as one sign-in and backup job, done in that order.)

### Fix, then merge

**#50 · Camera: the "too dark" tip waits for the camera to adjust**
- **What you'd see:** "Too dark", the flash offer and the 3-2-1 stay quiet for the first second after the camera opens or flips. Today they flash on every open, because the first frame comes before the camera adjusts. A really dark room still says so at about 1.4 s. It also fixes two small things:
  - the re-check's "+1.5" pill wraps instead of being cut off at the largest text
  - the folded morning row shows the re-check's photo next to the re-check's score
- **Spec:** no conflict, no new words, no new packages.
- **Fix:** drop the CLAUDE.md hunks, renumber the log entry, run `npm run check`.
- **Checked:** main has no settling logic in the camera's guidance.

**#36 · Scan camera: a cut-off piece gets a warning triangle, not color alone**
- **What you'd see:** about 13 lines of change. A piece running off the frame on the clothes-scan camera gets a small triangle as well as copper brackets. This is the spec's accessibility rule (never color alone), and you OK'd it in October.
- **Fix:** drop the CLAUDE.md hunk, renumber the log entry, add a small render test, run `npm run check`, take a Simulator shot.

**#48 · The morning card picks outfits with the same scoring as a fit check** → new task **T64**
- **What you'd see:** the morning and evening card, Kit's ideas and Swap rank outfits with the fit check's scoring. Today they use an older rubric. That older rubric is how the card planned your black Pumas with jeans twice in a week when you own better shoes. Scores you see don't change.
- **Spec:** no new screens or words. The Python engine isn't involved, since nothing scores the card there, and no fixtures were edited.
- **Fix:** main has changed the same picker twice since (the warm layer, and Swap following rotation), and moved to the newer scoring rules (parts v15). Rebuilding it on today's main is real work, so it gets its own task.
- **Checked:** main's `ideas.ts` still ranks with the older rubric (`defaultRubric`).

**#58 then #57 · Sign in with Apple and Google, then backup and sync** → task **T41**, after the sign-in spec (T40)
- **What you'd see:** "Continue with Apple" joins Google in You → Settings → Account. Signed in, your fits, closet, Lookbook, chats and facts back up and come back on a new phone. Delete account revokes the sign-in and wipes the server.
- **#58 needs:**
  - **Ask Apple for his first name, not just email.** F1.4 says Apple's first name fills an empty name, and a test today pins "email only".
  - **Take out the paid Apple team switch.** It quietly brought in `paid: true`, four entitlements and new location-prompt wording you haven't OK'd. That belongs to T80.
- **#57 needs:**
  - **Build the photo-backup switch, off by default.** There is no switch today: photos always upload when signed in. That breaks the spec's "never a photo on our server without the switch on".
  - **Delete in one order:** revoke the sign-in, then the server once, then the phone. Merged as is, the two PRs delete in opposite orders, and the server job runs twice.
  - **Don't add `expo-network` and `expo-battery`.** It proposes them, and they're not on your OK'd package list.
- **Both:**
  - **Email sign-in is already on main.** Neither PR adds it, so removing it is main cleanup, done in T41.
  - **The server's delete skips the app-only lock (App Check).** The reasoning holds, since a caller can only delete his own account, but it gets logged as a decision.
  - Neither is superseded by main.
- **Checked:** `paid: true` on #58 vs `false` on main; Apple is asked for EMAIL only; #57's photo setting falls back to on (`engine.ts:63`), with nothing that turns it off.

### Close (branches kept)

**#59 · Welcome plays one example check** → feeds the setup spec (T30)
- **Why close:**
  - **You turned this version down after seeing it** ("too many things going on on this screen", Nov 4, on the branch in `handoff/10-onboarding.md` §14.9).
  - **Its words promise "Your daily check is free."** The spec gives 7 free checks.
  - **Its test locks in 8 taps to the camera.** The spec says 6 or fewer.
- **Keep for T30:**
  - the drawn outfit scored by the real engine (`welcomeExample.ts`)
  - the play-once and Reduce Motion logic (`welcomePlay.ts`)
  - the round-2 research and `mockups/welcome-calm.html`

**#49 · "The same clothes, the same read, minutes apart"**
- **Why close:**
  - **It adds three things the spec doesn't have, with words you never approved:**
    - a "Read a little differently this time" row on the re-check card
    - an "Are these one piece?" card
    - Closet linking near-duplicate pieces
  - **It clashes with the re-check card main has rebuilt since.**
- **Keep:** the rule that a "shirt peeks below" charge on a re-check only counts if both photos show it, as an input to the re-check spec.

**#44 · Re-check ticks only the named closet piece; the piece peek**
- **Why close:**
  - **The tick fix is already on main,** done another way in abdf2b1b ("A closet swap promises what that piece really does").
  - **The piece peek is new UI,** with no mockup or spec and unapproved words.
- **Keep:** `PiecePeek.tsx` and `fixPeek.ts`, if a spec wants the peek later.
- **Checked:** abdf2b1b is on main and says a swap counts only when that piece is in the photo.

**#39 · Sessions clean up after themselves (a CLAUDE.md rule)**
- **Why close:**
  - **Its rule number and status line no longer fit** today's CLAUDE.md.
  - **Half of it is already there:** rule 9 shuts down Simulators, rule 10 covers stash.
- **Not on main:** stopping an extra Metro (never the one on 8081), emulators and background shells, and saying in one line what was left running.
- **Your call:** whether to add that as one line in CLAUDE.md. Nothing in the PR shows it was your rule, so it isn't added.

### Your call

**#41 · A later card credits your own 8+ fit**
- **What you'd see:** when an outfit you chose scored 8 or more in the last 6 days, the next morning or evening card that reuses one of its pieces ends its why line with:
  > "Your olive overshirt was in Tuesday's 8.0."
- **Spec:** the code writes the line, and the score is the stored one, so the hard lines hold. The words aren't in the spec or the mockups.
- **Recommendation:** close the PR, keep the branch, and bring the line to the Kit-and-morning interview (T50). If you like it there, rebuilding takes about an hour: it's one file plus 14 tests.

## What the founder decides (Y3)
1. OK the four fixes (#50, #36 now; #48 as T64; #58 → #57 inside T41).
2. OK closing #59, #49, #44, #39 and #41 (branches kept).
3. The cleanup line for CLAUDE.md: yes or no.
4. Merging #50 and #36 once fixed and green.

## After the founder's yes (Nov 7)
- **Closed** #59, #49, #44, #39 and #41, each with a comment pointing here. Branches kept.
- **#36 and #50 brought up to date with main** (a merge, not a rebase, so nothing was force-pushed). Their CLAUDE.md status edits were dropped, and their log entries were renumbered to 396 and 397. Both show as mergeable on GitHub. #50's old CLAUDE.md to-dos became Y16 in `plan.md`.
- **Checks, each run on its own:**
  - **#36:** types and lint clean (one old unused-import warning in `tryOn.test.ts`), core 853 passed, app 1,617 passed (4 skipped, the same as main).
  - **#50:** the same, with app 1,626 passed. That includes its 9 new tests.
  - **Run note:** Jest was run with `--no-watchman`, because watchman wasn't reachable.
- **On the iOS Simulator** (both branches combined in a throwaway copy, one Metro; shots in `screenshots/t1/`, git-ignored):
  - **#36, screen 49 in dark:** the cut-off jeans get copper brackets plus the warning triangle on a dark tag. The hoodie and sneaker don't.
  - **#50, screen 97 at the largest text size:** "9.0 /10 +1.0" with the pill whole, after "/10".
- **When merging:** #36, #50 and #68 each add one entry at the end of the decisions log, so the second and third to merge need a one-line conflict resolved there.

## Not verified
- Only #36's and #50's tests were run, and only their screens were looked at.
- #50's main change, the dark tip waiting about a second, depends on a real camera. It is proven only by its tests on the founder's real `guide.log` frames, not on a phone. #50's other walk fix (the folded morning row's photo) wasn't looked at.
- #48's and #49's numbers were recorded before main moved to the newer scoring rules (parts v15). They may shift.
- #57's `storage.rules` weren't read; the review relied on its emulator test X5 ("no one else can read them").
