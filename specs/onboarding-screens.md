# Setup screens

**Approved by the founder:** 2026-11-09

After this, a new user meets setup as three plain screens with no stranger's photo and no pretend chat. Setup asks his age with one tap and ends in the Stylist chat, where Kit offers a fit check now or later; the camera opens only when he taps.

**Part of:** `specs.md` → "First run", F1 (Onboarding). Works with `specs/setup-and-you.md`: that spec owns Kit's hello and the tips (SY2–SY3), what the name is and where it's used (SY4), the agreement's rules (SY5) and Apple's age check (SY6). This one owns how the setup screens look and where setup ends. Where the two meet, the line is named below; neither repeats the other.

## Why
The founder went through setup fresh on the TestFlight build (Nov 9):
- **Welcome uses a photo found on the internet.** It's `s14`, "man walking on a path in a park" by Babak Eshaghian on Unsplash (shot in Tehran). The Unsplash License allows commercial use with no credit, but Unsplash's terms say it doesn't cover recognizable people (no model release; https://unsplash.com/terms §5). The face is cropped out, which lowers the risk but doesn't remove it. The Example check uses the same photo and says "A real photo".
- **The birth-year step looks awkward as a chat:** his picks echoed back in a blue bubble, Kit replying, then a field he still has to fill. Every setup step is shaped like a chat he can't type into.
- **The camera opens on its own right after setup.** He may have just downloaded the app outside, somewhere he can't take a fit check.

Research (Nov 9): Apple doesn't require a US 18+ app to collect age itself. Declared Age Range returns ranges, never birthdays, and App Review 5.1.4 leans against asking for birthdates. The FTC asks that an age question be neutral: nothing preselected, an honest under-age answer possible, and no hint which answer passes (COPPA FAQ D.7). Today's footnote, "Kitted is for 18 and up", gives that hint before he answers. An exact year is not more compliant than bands.

## Scope
- **In:** a code-drawn Welcome (OS1); the Example check drawn the same way (OS2); one plain style for every setup screen (OS3); the About you step with the name field and age bands (OS4); setup ending in Stylist with Kit's offer (OS5); Style profile's age row (OS4).
- **Out (non-goals):**
  - any person's photo on Welcome or the Example check, stock or AI-made;
  - a commissioned illustration;
  - changing Welcome's headline, body or buttons;
  - the tips' and Kit's hello's words (SY2);
  - Apple's age check itself (SY6, T32);
  - Apple's first name filling the name (F1.4, built with sign-in, T41);
  - saying the name anywhere (the greetings, T51);
  - the agreement's own words (SY5);
  - the reminder notification for someone who tapped Later. The founder asked for it on Nov 9; it goes to the notifications spec, keyed on OS5's Later mark.
- **For the beta:** all of it.

## OS1. Welcome
- The photo goes. In its place, on the theme's background, an outfit drawn by the same code that draws Closet's pieces (top, bottoms, shoes; never a person).
- **The mini score card stays** (tag `Fit check` · `Everyday`). It shows the outfit's score and word, then plays the fix once:
  1. on open, the outfit and its **before** score and word;
  2. after a beat, one piece swaps for the piece the outfit's top fix names, and the score counts up to the **after** score and its word, with the fix's own short words as the card's detail line;
  3. then it holds still. The whole thing takes about 2 seconds.
- Both scores, both words and the fix come from the scoring code run on the outfit's reading (the same reading the drawing is made from). Nothing is typed in by hand. Same reading, same score.
- With Reduce Motion on, or at the largest text sizes, it shows the after state with no animation.
- The headline, body, `Get started`, `See an example check` and `I already have an account` stay as they are. The status bar follows the theme; Welcome no longer forces it dark.
- VoiceOver: the drawing is hidden. The card reads `Example fit check. Everyday. {before} out of 10, {beforeWord}. One fix: {fix}. {after} out of 10, {afterWord}.`

## OS2. The Example check
- It shows Welcome's drawn outfit in place of the photo bubble, with the full result card for its **before** state, drawn the way `specs/explain-rating.md` draws every card: score, word, one fix with the rest a tap away, no gains and no Why. It stays read-only, as today, and has no Explain rating (there's no chat in setup).
- Changed words:
  - the intro: `Here's an example check. This is what you'll get.`
  - the caption: `A drawn example, scored by the same code as your photos. Nothing was sent.`
- Everything else stays (its buttons, the sheet from "See an example", nothing sent, nothing saved).

## OS3. One style for all of setup
- Setup is plain screens: a large title question, its choices, one button at the bottom. No echo bubbles and no Kit bubbles anywhere in setup. Kit's first words are in the Stylist chat after setup (SY2's hello).
- The steps: **Welcome → Looks → About you → Stylist.** Setup has no agreement step (SY5).
- The progress bar has 3 segments (Welcome, Looks, About you) and fills on About you. Back works as today.
- **Looks (from Nov 18: the style game, `specs/style-game.md`, which replaces everything in this bullet; the founder, #488):** the large title `What's your style?`, then `Pick up to 3 looks you like. Today's outfit comes next.` under it (founder, Nov 11, after a tester read the old title as "what are you wearing now"; DECISIONS-LOG #448). The Kit bubble goes; the tiles, `Something else?` and `Continue · {n} of 3` stay as they are. `Not sure` is gone (founder, Nov 11; DECISIONS-LOG #449): Continue stays off until he picks a look or types his words, so every profile starts with a look or his words.
- **The agreement** (now first shown on the camera, SY5): its Kit bubble becomes plain text at the top. Its words and buttons don't change.
- **Restore** (from "I already have an account", only once sign-in exists): the About you step with the title `Welcome back` and the line `Your age first, then I'll bring back your fits.` Age only, no name field.
- **The Example check stays chat-shaped:** it's a preview of the chat itself.

## OS4. About you
**Top to bottom**
1. The progress bar and Back.
2. The large title `About you`.
3. `What should Kit call you?`, then a text field with the placeholder `First name` (SY4's rules: trimmed, up to 30 characters, blank means no name). When the step opens with the field empty, the field has focus and the keyboard is up (not on Restore, which has no name field).
4. `How old are you?`, then five choices of equal size and weight, in this order: `Under 18` · `18–21` · `22–25` · `26–30` · `31 or older`. Nothing is picked when the step opens. One tap picks; tapping another moves the pick.
5. The footnote: `Stays on your phone. It never changes your score.`
6. At the bottom: `Continue`, on only with a name and an age. While it's off, one hint sits above it: `Add your first name to go on.` while the name is blank, else `Pick your age to go on.` While the name is blank, a small text button `Skip` sits under Continue: with an age picked it does what Continue does, without a name; with no age it's off. (#506: the name stays optional, as Apple requires, but skipping it takes a deliberate tap.)

**What Continue does**
- **An age of 18 or over:** setup is done (the profile is saved with his looks, name and age band; no agreement yet), and he lands in Stylist (OS5). Once SY6 is built, Apple's age sheet comes first, as SY6 says.
- **Under 18:** a confirm, title `Under 18?`, body `Kitted is for ages 18 and up.`, buttons `Change` and `That's right`. `Change` closes it with nothing changed. `That's right` shows today's stop screen: no camera, kept through a reinstall, as today.
- Closing the app on About you reopens it with his name and pick kept, as today.

**Style profile**
- The `Birth year` row becomes `Age`, showing his band (`22–25`). For a profile from before this change, the band comes from his birth year and the current year.
- The footnote becomes `Age can't be changed here.`
- A `Name` row changes or clears his name (SY4).

## OS5. Setup ends in Stylist
1. About you's Continue lands him on Stylist. The camera stays shut.
2. Kit's hello posts, as SY2 says. Until SY2 is built, it's today's AI note.
3. Under it, Kit's offer card:
   - title `Want to check a fit now?`
   - body `Stand back so your shoes are in the shot. Not dressed for it? Later works.`
   - buttons `Check my fit` and `Later`
4. `Check my fit` opens the camera. If he hasn't agreed yet, the agreement shows on top first (SY5):
   - `Agree` makes the camera live;
   - `Not now` takes him back to Stylist, where today's "Turn on fit checks" card posts once, and the offer card's buttons go.
5. `Later`: the buttons go, and Kit posts one line: `No rush. Tap the camera button whenever you're ready.` The time is kept as the Later mark, for the reminder in the notifications spec.
6. Once he has any scored check (from the card or the chat's camera button), the offer card's buttons are gone for good. The card's words stay as history, like the "Turn on fit checks" card.
7. An install that finished setup before this change gets no offer card.

**Taps to the camera:** Get started · a look · Continue · an age · Continue · Check my fit · Agree = 7 (F1.1). From Nov 18 (`specs/style-game.md`): Get started · the card-1 lesson · 8 cards · up to 3 this-or-thats · Continue · an age · Continue · Check my fit · Agree = 18 or fewer with 3 Me's.

## Rules
- The age band is kept on his profile with the day he picked it, on this phone only. It's never sent to the server or backed up, the same as the birth year today.
- An older install that had a birth year keeps it. Nothing asks him again.
- Nothing is sent anywhere before he agrees (F1.3). Setup itself sends nothing.
- An install closed mid-setup on the old agreement step reopens on About you, with his answers **(assumed)**.

## Data
- **New on the profile:** `ageBand` (`18-21`, `22-25`, `26-30` or `31+`) and `ageBandAt` (the day he picked it). Kept on the phone only, like `birthYear`. `name` comes from SY4.
- **New kv:** `firstCheckOffer.laterAt` (when he tapped Later), cleared by "Delete all my data". The notifications spec reads it.
- **New chat message:** Kit's offer card (`cardType: 'firstCheckOffer'`) and Kit's Later line, both ordinary chat messages.
- `birthYear` stays for older profiles; new setups leave it empty.

## Acceptance criteria
**OS1. Welcome**
- OS1.1 Welcome shows no photo. The bundled build has no person's photo reachable from Welcome or the Example check.
- OS1.2 The before score, after score, both words and the fix line equal the scoring code's output for the outfit's reading, checked by a test (not typed in).
- OS1.3 The swap plays once on open, then holds still; with Reduce Motion on, only the after state shows.
- OS1.4 The headline, body and buttons are unchanged; VoiceOver reads the card's label as in OS1; light, dark and the largest text size show nothing clipped.

**OS2. The Example check**
- OS2.1 The Example check shows the drawn outfit and its before result card, with the new intro and caption word for word; `Why {score}?` opens the math.
- OS2.2 Opening it sends nothing and saves nothing (from Welcome and from "See an example").

**OS3. One style**
- OS3.1 No setup screen shows a user bubble or a Kit bubble (Welcome, Looks, About you, Restore).
- OS3.2 Setup is Welcome → Looks → About you → Stylist, with no agreement screen; the progress bar has 3 segments.
- OS3.3 Looks shows the new title and line word for word; its tiles and buttons behave as before.

**OS4. About you**
- OS4.1 The step shows the title, the name field (focused, the keyboard up) and the five age choices in the stated order and words, none picked; Continue is off with the hint for what's missing (the name first, then the age) until both are given.
- OS4.2 A blank name with an age picked leaves Continue off and `Skip` on; `Skip` goes on with no name saved; `Skip` is off with no age and gone once a name is typed; a name is saved trimmed, at most 30 characters (SY4.2).
- OS4.3 An 18+ band saves `ageBand` and `ageBandAt` and lands in Stylist; no birth year is saved.
- OS4.4 `Under 18` asks once; `Change` changes nothing; `That's right` shows the stop screen with no camera, and it stays after a relaunch and a reinstall (as today).
- OS4.5 No screen before an age is picked says "18" except the `Under 18` and `18–21` choices.
- OS4.6 Style profile shows `Age` with the band (a band from the birth year for an older profile) and the new footnote.
- OS4.7 No request to the server carries the age band or the name (a test over every request builder).

**OS5. Setup ends in Stylist**
- OS5.1 After About you, Stylist shows Kit's hello, then the offer card word for word, and the camera does not open.
- OS5.2 `Check my fit` opens the camera, with the agreement on top when he hasn't agreed; `Agree` makes it live; `Not now` returns to Stylist with "Turn on fit checks" posted once and the offer's buttons gone.
- OS5.3 `Later` removes the buttons, posts Kit's line word for word and saves `firstCheckOffer.laterAt`.
- OS5.4 After any scored check, the offer card shows no buttons, also after a relaunch.
- OS5.5 A fresh install reaches a live camera in 7 taps by the path above (F1.1), checked by a tap-through flow.
- OS5.6 An install that finished setup before this change shows no offer card.
- OS5.7 Before `Agree`, nothing is sent (F1.3).

## Touches
- **OS1–OS2:** `app/src/features/onboarding/{WelcomeScreen,welcomeExample,ExampleCheckScreen,exampleCheck}`, a drawn-outfit view built on `features/closet/flats.ts`, a bundled reading for the drawn outfit, `en.ts`.
- **OS3–OS5:** `app/src/features/onboarding/` (the Looks, Basics, Consent and restore screens, `basics.ts`, `complete.ts`, `resume.ts`, a new offer card), `app/src/app/onboarding/`, the chat's card switch (one line), You → Style profile, `data/types.ts`, `data/tables.ts`, the request builders' tests, `app/e2e/flows/`, `en.ts`.

## Assumptions
- An install closed mid-setup on the old agreement step reopens on About you.
- Restore asks age only, no name.
- The drawn outfit is a neutral everyday outfit whose top fix swaps one visible piece (the plan picks it, and the founder sees it in the design stage).

## Later
- A real photo on Welcome or the Example check, if the founder gets a good one with the person's written OK.
- The reminder for someone who tapped Later (notifications spec).
