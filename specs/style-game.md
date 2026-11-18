# The style game (setup's Looks step)

**Written for the founder's review:** 2026-11-18, from his decisions #459–#488 and his Nov 18 instruction to build it overnight ("build the whole onboarding … the one that we picked, which is D"). Not yet approved: the approval line goes here only after his yes in chat.

After this, a new user finds his style by playing, not by reading style names: eight "Is this your style?" cards, one drawn outfit each, then a few this-or-thats to put his Me's in order, then "Here's your style", which he can fix in place. His picks still never move a score.

**Part of:** `specs.md` → F1 (Onboarding), step 2. Replaces the tile grid in `specs/onboarding-screens.md` OS3's Looks bullet (see "Changes to other specs"). Works with `specs/tailored.md` (Tailored is one of the 8 looks; T94 ships with this) and `specs/setup-and-you.md` SY1 (You → Style profile keeps its tiles for later changes). The clickable source of truth is the mockup `tasks/style-quiz/design.html` (tab D), built from `tasks/style-quiz/src/`; where this spec and the mockup disagree, this spec wins and the mockup gets fixed.

## Why
- Testers stalled on the tile grid: some didn't know what "Workwear" or "Vintage sport" means, others skipped the tiles and typed their own (founder, Nov 12).
- Of four directions drawn, the founder chose D on Nov 17 (#488) after playing A, the this-or-that bracket: when neither outfit was him he picked one anyway and had to replay. D asks about each look on its own.
- In a $0 simulation of made-up people (`tasks/style-quiz/quiz_sim.py`, #482–#487), D puts every look in its fan's top 3 at least 91% of the time and lets a disliked look into the top 3 2–3% of the time (A: 5–6%). Not yet proven with real people (plan.md Y30).

## Scope
- **In:** the cards (SG1), the ranking (SG2), the results screen (SG3), Add a look (SG4), his own words (SG5), Nothing clicked (SG6), the fail-safes the flow test kept (SG7), what's saved (SG8), access and motion (SG9).
- **Out (non-goals):** the tile grid anywhere in setup; A, B and C; real photos in the game (drawings only); Kit using his No's (they're saved, not used yet); a retake button on Style profile; any change to scoring, the camera, About you or Stylist.
- **For the beta:** all of it, in the same build as Tailored (T94). The friends' beta is paused (#462); this ships in the next TestFlight build.

## SG1. Is this your style?
*Changed on Nov 18 after a real tester thought swiping meant "next outfit" and rejected looks he liked (the founder: "it should be more intuitive"; #494). Was "Me or not me?" with Me / Not me.*
- Large title `Is this your style?`, line `One outfit at a time.`
- One card at a time, 8 in all, one per look: Streetwear, Minimal, Smart casual, Classic prep, Tailored, Workwear, Outdoor, Vintage sport. The card shows the look's first drawing (the app's own drawing code, never a person) and no name.
- **Order:** a fresh shuffle each game, with no look-alikes side by side, counting the last card as next to the first (Classic prep–Tailored, Minimal–Smart casual, Workwear–Outdoor, Streetwear–Vintage sport, Smart casual–Classic prep). Each look is equally likely at each position. The game's seed is kept with the game, so Back keeps the order and Play again deals a new one.
- **Answering:** two buttons side by side under the card, 50 pt tall: `No` on the left with an ✕ icon (secondary) and `Yes` on the right with a ✓ icon (primary); or swipe the card right for Yes, left for No. Past the swipe line the matching button lights up and a stamp shows (`Yes` on the left, filled; `No` on the right, outlined). An answered card slides off from where it is, also after a tap. The icons are drawn (the design system's icons), never emoji.
- **Progress:** 8 dots; answered ones filled, the current one a longer pill. Under the card: `Swipe right for Yes, left for No.` and, on a second line, `Not sure? Tap it for another outfit.` (SG7, FS1).
- **Card 1 teaches first (once per install):** before card 1 can be answered, an overlay on the card reads `Swipe right if it's your style, left if it's not.` with a right arrow and a left arrow. One tap on it dismisses it; while it shows, Yes and No are dimmed and a swipe is ignored. It shows on the first game only (not after Play again or a relaunch). After it's dismissed, card 1 leans right then left once to show the swipe (never under Reduce Motion, never again).
- **Back** undoes the last card (or the last ranking pick); on card 1 it goes to Welcome.

## SG2. Now put them in order
- Shown only when he said Me to 2 or more looks. Title `Now put them in order`, line `Tap the one that's more you.` (the founder, Nov 18: no "You said Me to {n}.", #493)
- Two of his Me's side by side, each on its second drawing, mid-screen in thumb reach. He taps the one that's more him.
- Each Me is placed into a top 3 by binary insertion: at most 2 taps per Me after the first. The first pair starts on a random side, then sides alternate, so neither side wins more often.
- With 1 Me, this step is skipped; with 0, he lands on SG6.

## SG3. Here's your style
- Title `Here's your style`, line `Your top looks, in order. Not quite right? Drag, remove or add one.` (SG7 FS3; with one look, `Your top look. Not quite right? Add one, or play again.`).
- Up to 3 rows in order: the drawing he said Me to with its number (1, 2, 3) on its corner, the look's name and line, a × (44 × 44 pt), and a drag handle (44 × 44 pt).
- **Drag** a row by its handle: the row lifts, the others slide to make room, dropping past a row's middle takes its place, and the numbers follow.
- **×** removes the row and shows `Removed {name}` with Undo for 5 seconds.
- Under the rows: `Add a look` (always; SG4 and SG7 FS2), then `Not quite you? Tell me in your words` (SG5). On a full list the words link may sit just under the fold on a 6.3-inch phone; the list scrolls to it.
- **Buttons:** `Continue` (full width, primary) and `Play again` (a text button under it). Continue needs at least one look or his words (#449); it saves (SG8) and goes to About you. Play again clears this game and deals a new one; his words stay.

## SG4. Add a look
- The iOS 26 inset sheet with a grabber and an X: title `Add a look`, the looks he doesn't have, each as today's setup tile (two drawings, name, line). One tap adds it last and closes the sheet; on a full list (3) it takes #3's place instead (SG7 FS2).

## SG5. His own words
- `Not quite you? Tell me in your words` opens a field on the same screen: placeholder `Like skater, or all black`, 80 characters, Done. Saved, it reads `In your words: "…"` with Edit. Typing turns Continue on at once.

## SG6. Nothing clicked yet
- When he says No to all 8: title `Nothing clicked yet`, line `Add a look you like, play again, or tell me in your words.`, then `Add a look`, the words link, Continue (off until he adds one) and Play again.

## SG7. Fail-safes (from the flow test, T111; #490)
Three small ones, each kept because it helped in the flow test's simulation (made-up people and slips at stated rates, `tasks/style-quiz/flow_sim.py`). Together they raise the share who end with the style they want by about 2 points across every kind of person and slip (one favourite 94 → 95%, two loves 86 → 89%, a style not in the 8 92 → 95%, every slip at once 80 → 84%), for 0.6 extra taps, and only by choice.
- **FS1. Tap the card for its other outfit.** On any card, a tap (a press that moves under 6 pt; past 90 pt is a swipe; in between springs back) switches between the look's two drawings. Two small dots at the top of the card show which one is up. It's not an answer, so Back doesn't undo it; the answer counts for the look, whichever drawing shows, and the next card starts on its first. VoiceOver: an `Another outfit` action, and the card reads `Outfit 3 of 8, view 2 of 2. {description}`. Words: `Not sure? Tap it for another outfit.` *(Why: a drawing that half-reads as a neighbour is the commonest way the right look gets a Not me.)*
- **FS2. Add a look works on a full list.** With 3 looks, the pick takes #3's place, with the note `{name} in, {old} out` and Undo for 5 seconds. The sheet never lists a look he has. *(Why: at 3, "Add a look" was a dead end for a guy whose real #1 was missed.)*
- **FS3. The results line names the fixes** (words only): `Your top looks, in order. Not quite right? Drag, remove or add one.` *(Why: people fix a wrong result more often when the screen says they can, especially a guy whose style isn't one of the 8.)*
- **FS4. Catch "swiping to browse" (#494, from a real tester).** If his first 3 answers are all No, each given less than 1.5 s after its card appeared, with no Back in between, a small card shows before card 4: `Just checking: left means it's not your style.` with `Start over` (primary) and `Keep going`. Start over clears those 3 answers and returns to card 1 of the same deal (no overlay again); Keep going goes on to card 4. It shows at most once per game. *(Why: a guy who thinks a swipe means "next" says No to everything at browsing speed; a guy who really dislikes the first three loses one tap.)*
- **Back, already there, pinned down:** undoes exactly one answer (a card or a this-or-that); on card 1 it goes to the previous setup step, and coming back resumes the same game (same deal, same answers).
- **Tested and dropped, so not to add:** a visible Undo under the card (Back already does it); a second look offered when he says Me to 0 or 1 (it talked the guy whose style isn't listed into looks he doesn't like, −4.8 points); a double-check at 6+ Me's; an automatic second drawing when he hesitates (a step for nearly everyone).
- **Known cost, left alone:** a guy who says Me to all 8 makes about 13 this-or-thats; "likes almost everything" is the weakest group (77 → 78%).

## SG8. What's saved
- On Continue: his looks in order (as today, `LOOKS_KEY`), his words if any (as today, `OTHER_STYLE_KEY`), and, new, the looks he said No to (`looks.notMe`, the look keys, kept with his style profile; wiped by "Delete all my data"; synced like his looks when sign-in exists). Not me's are saved but not used yet (Later).
- Nothing is sent anywhere by the game itself; Kit gets his looks and words as today.
- **Closing the app mid-game** reopens the Looks step at card 1 with a new deal. Closing on Here's your style reopens it with his looks and words as he left them.

## SG9. Access, motion and haptics
- **VoiceOver:** each drawing has a description (`Grey hoodie, washed wide jeans, chunky white sneakers`; drafts in the mockup's `DESC`, written from `looks.ts`); a card reads `Outfit 3 of 8. {description}` with Me and Not me as its buttons; results rows read `1 of 3, Classic prep. {line}` with Move up, Move down and Remove actions; moves and removals are announced.
- **Largest text:** Yes and No stack (Yes on top); rows put the name and line under the drawing; the sheet is one column; button labels stop at 2× (`CONTROL_TEXT_MAX_SCALE`).
- **Reduce Motion:** cards fade instead of flying; no lean on the first card.
- **Haptics** (expo-haptics): a selection tick when a dragged card crosses the swipe line and when a dragged row passes another; a light impact when a card is answered, a ranking card tapped and a row dropped.

## Rules
- Never a person in the drawings; never rate a body. No emoji, no all-caps. Picks never move a score (F9.2).
- The words on these screens are the design pass's recommended options (#487); the founder confirms or changes them.

## Changes to other specs (on the founder's Nov 18 instruction; confirm in his review)
- `specs/onboarding-screens.md` OS3, the Looks bullet: the title, line, tiles, `Something else?` and `Continue · {n} of 3` give way to this spec ("Looks is the style game, `specs/style-game.md`").
- `specs.md` F1 step 2: "Play the style game (8 \"Is this your style?\" cards, then a few this-or-thats), then keep, reorder or fix his top looks, or describe his style in his own words."
- `specs.md` F1.1: "A fresh install reaches the camera in 17 taps or fewer when he says Me to 3 looks or fewer (7 until Nov 18; #488) …" (Get started · 8 cards · up to 3 this-or-thats · Continue · an age · Continue · Check my fit · Agree).

## Acceptance criteria
**SG1**
- SG1.1 A fresh install shows `Is this your style?` after Welcome, with 8 cards in a fresh order; over 2,000 seeded deals every look is first 12.5% ± 1.5%, and no deal puts look-alikes side by side (first and last count).
- SG1.2 Yes and No (with their ✕ and ✓ icons) answer by tap and by swipe past the line; the stamps read Yes and No; Back undoes the last card and keeps the order.
- SG1.4 On a fresh install, card 1 shows the teaching overlay word for word; while it shows, Yes, No and a swipe do nothing; one tap dismisses it and then the lean plays; Play again and a relaunch don't show it again.
- SG1.3 The first card leans once (not under Reduce Motion); the dots show progress.
**SG2**
- SG2.1 With 2+ Me's the ranking shows two Me's on second drawings; with a seeded game, the sides start random and alternate; with 1 Me it's skipped; with 0, SG6.
- SG2.2 Binary insertion places each Me with at most 2 taps after the first; a player who prefers Streetwear > Vintage sport > Outdoor > Workwear and says Me to those four ends with Streetwear, Vintage sport, Outdoor.
**SG3–SG6**
- SG3.1 Drag reorders and the numbers follow; × removes with Undo for 5 s; Back restores each change.
- SG3.2 Continue is off with no looks and no words, on with either; it saves looks in order, words and No's, and goes to About you.
- SG4.1 Add a look lists only looks he doesn't have; a tap adds it last (or takes #3's place on a full list, SG7.2) and closes the sheet.
- SG5.1 His words save and turn Continue on; 80 characters max.
- SG6.1 No to all 8 shows Nothing clicked yet with Continue off.
**SG7–SG9**
- SG7.1 Tap card 1 once: it shows that look's second drawing and the second dot is lit; answering counts for that look, and card 2 opens on its first drawing; a swipe past 90 pt answers and never switches the drawing.
- SG7.2 With Outdoor, Vintage sport, Workwear, adding Streetwear gives Outdoor, Vintage sport, Streetwear and `Streetwear in, Workwear out · Undo`; Undo restores the three; the sheet never lists a look already on the list.
- SG7.3 With 2+ looks the results line reads as FS3; with 1 look, the one-look line.
- SG7.5 Three No's, each under 1.5 s after its card, show the check before card 4; Start over returns to card 1 of the same deal with no answers; Keep going shows card 4 with the 3 No's kept; three No's with one taking 2 s, or with a Back between, don't show it; it never shows twice in a game.
- SG7.4 Answer 3 cards, Back: card 3 shows again with 2 answers kept; Back on card 1, then forward, resumes the same deal and answers.
- SG8.1 Closing mid-game reopens at card 1 with a new deal; closing on results reopens them as left; Delete all my data wipes `looks.notMe`.
- SG9.1 VoiceOver labels and actions as SG9; light, dark and the largest text show nothing clipped (Simulator screenshots); Reduce Motion fades.
- F1.1 (new) A fresh install reaches the camera in 17 taps or fewer with 3 Me's (a Maestro flow).

## Touches
`app/src/features/onboarding/` (a new game screen, ranking and results, replacing `PickLooksScreen.tsx`'s grid; the shuffle and ranking ported from `tasks/style-quiz/src/logic.js` as a pure, tested module), `app/src/app/onboarding/`, `resume.ts`, `basics.ts` (the Not me key), `privacy/wipe.ts` (one key), `en.ts`, the T39 tests and the Maestro setup flows (new taps), `specs/onboarding-screens.md` OS3, `specs.md` F1. Not touched: `features/you/` (Style profile keeps its tiles), scoring.

## Assumptions (Claude's defaults; the founder confirms)
- No's are saved but not used by Kit yet (he was asked; he went to sleep before answering).
- The words are the design pass's recommended options (#487) and the flow test's (#490: the FS1 line, the FS2 note, the FS3 results line).
- Mid-game close restarts the game; results are kept.
- The fairness redraws (Outdoor's shell and fleece, Streetwear's black sneakers) apply to the app's tiles too (T94 carries them).

## Later
- Kit using his No's as a soft signal, shown in Privacy → What Kit knows.
- A "Play the style game again" row on Style profile.
- Real outfit photos in the game, with the people's written OK.
