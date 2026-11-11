# T39 · Design: Setup as plain screens, About you, and Kit's first-check offer

**Not approved for looks.** The founder (Nov 10, in chat): "Actually, don't worry about the design. I'm going to take care of the design in a different session. Just nail the onboarding process. That's what I want from you." These frames are the working layout for the build: the states, the flow and the VoiceOver order hold; the look (spacing, components, colors) is his to redo. The agreement on the camera keeps today's camera words unchanged (his "Something else" had no text; no new words without his yes).

**From:** `plan.md` → T39 · **Spec:** `specs/onboarding-screens.md` → OS3 (OS3.1–OS3.3), OS4 (OS4.1–OS4.7), OS5 (OS5.1–OS5.7); `specs.md` → F1.1–F1.3; `specs/setup-and-you.md` → SY4.1, SY4.2, SY4.4 (as merged to main in PR #81) · **Frames:** `tasks/T39/design.html` (open with `preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/T39/design.html`) · **PNGs:** `tasks/T39/design/` (17 phones, light and dark)

Approved, this file is the contract: the planner copies the UI inventory from it word for word, and the critic holds the build to it. It changes only with the founder's yes.

## What he sees
Setup after Welcome is two plain screens with a big question at the top and no chat bubbles: Looks (`Which of these would you actually wear?`) and About you (an optional first name and five age choices, nothing picked). Continue lands him in Stylist, where Kit's first message is followed by a card, `Want to check a fit now?`, with `Check my fit` and `Later`. The camera opens only when he taps. The first time it opens, the agreement shows in its place, with its words now as plain text at the top. In You → Style profile, `Birth year` becomes `Age` (his band), and a `Name` row lets him change or clear his name.

## Where it lives
- **Looks** (`app/onboarding/looks`, `PickLooksScreen`): pushed from Welcome's `Get started` (and Welcome's Example check). Back circle (to Welcome) and the 3-segment progress bar at step 2. He leaves by Continue or Not sure (About you), or Back.
- **About you** (`app/onboarding/basics`, `BasicsScreen`, today the birth-year step): pushed from Looks. Back (to Looks) and the bar at step 3 (full). He leaves by Continue (Stylist, or the under-18 confirm) or Back. Closing the app here reopens here with his name and pick kept (as today); an install closed on the old agreement step also reopens here (spec assumption).
- **The under-18 confirm**: a native alert (`Alert.alert`) over About you. **The age stop** (`AgeStopScreen`): unchanged, terminal.
- **Restore** (`BasicsScreen` with `restore`): only once sign-in exists (`ACCOUNTS_BUILT`), after `I already have an account` signs in to an account with fits. Back only, no bar. Continue goes to today's restore screen.
- **Stylist** (the tabs' first screen): About you's Continue replaces the setup stack with the tabs (as today's end of setup does), on Stylist. The camera stays shut. The thread starts with today's day stamp, Kit's first message, then the offer card (`cardType: 'firstCheckOffer'`, a chat message rendered by the chat's card switch).
- **The agreement on the camera** (`app/camera` → `ConsentScreen mode="camera"`): from `Check my fit` on the card or the camera button in the tab bar's accessory, while he hasn't agreed. Full-screen, in the camera's place, with an X (top right). `Agree & check my fit` turns it into the live camera in place; `Not now` or the X closes it and returns to Stylist.
- **Style profile** (`app/(tabs)/you/profile`): You → the Your style card. Native header: Back, `Style profile`, `Done`. Unchanged apart from the Basics card and its footnote.

## The parts used throughout
- **Plain step layout** (Looks, About you, Restore): `OnboardingNav` (44 pt, as today), then one `ScrollView` with the page: side padding 16 (`space.gutter`), top 8 (`space.s`), bottom 24. The title is `KText largeTitle` (34/41, weight 700) `ink`, header trait, left-aligned, wraps (never truncated). An optional line under it: `body` `ink2`, 4 (`space.xs`) below the title. Each question: `headline` (17/22, weight 600) `ink`, 24 (`space.xxl`) above it and 8 below it. The footnote: `footnote` `ink3`, 12 below the list, inset 4. The dock (as today): padding 8 top, 16 sides, bottom max(safe area, 16) = 34; gap 8; the hint above the button.
- **Age choices** · **new** `ChoiceList` (see New parts): a `KCard` with radius `cardSmall` (20), five rows, each at least 52 pt tall, padding 0 × 16, label `body` (17/22) `ink`, a hairline `RowDivider` inset 16 between rows. The picked row: label weight 600 and a checkmark (`check`, `checkmark`, 20 pt, `ink`) at the trailing edge. No other difference, so every row is the same size and weight until he taps (OS4 "equal size and weight"). The whole row is the button. **Pressed:** while his finger is down the row fills with `surface2` (an iOS list row's highlight), and the checkmark lands when he lifts it.
- **Name field**: the same `TextInput` style as Looks' `Something else?` field (border 1 `line`, radius 22, `surface`, min height 44, padding 0 × 16, `body` size, placeholder `ink3`, `maxFontSizeMultiplier` 2). `autoCapitalize="words"`, `autoComplete="given-name"`, `textContentType="givenName"`, `autoCorrect={false}`, `returnKeyType="done"`, `maxLength={30}`, `clearButtonMode="while-editing"`.

## States
In the order he meets them.

### Looks · on open · when: `Get started` on Welcome, or Back from About you · phone 1 · `design/01-light.png`, `design/01-dark.png`
Top to bottom, in VoiceOver's reading order:
- Back · `IconButton` `back`, solid, 44 · VoiceOver "Back" (`common.back`) · tap: Welcome (unchanged).
- Progress bar · `OnboardingNav` · **3 segments** (Welcome, Looks, About you; today 4), 2 filled `ink`, 1 `line`, 4 tall, gap 5 · VoiceOver "Step 2 of 3" (`onb.progress.a11y` with `total` 3; see Words) · tap: nothing.
- Title · `largeTitle` 700 `ink`, header · "Which of these would you actually wear?" (spec OS3) · wraps to 2 lines here · VoiceOver reads it as a header.
- Line · `body` `ink2`, 4 below · "Tap up to 3." (spec OS3) · VoiceOver reads it.
- *Removed:* Kit's bubble (`StylistMessage`, "Which of these would you actually wear? Tap up to 3.").
- The tiles, `Something else?`, its field, `Not sure`, the `Up to 3.` note and `Continue` / `Continue · {n} of 3` · **unchanged** (`LookTile`, the grid's 10 pt gap, 2 columns, 1 at AX sizes; real `renderFlat` output in the frame). The grid starts 24 below the line (today 12 below the bubble). Continue is off until a pick or his own words, as today.
- **Motion and haptics:** unchanged (selection haptic per tap; a 4th tap buzzes and shakes, dims with Reduce Motion).
- **Dark:** token swap; the flats use their `dark` scheme (as today).
- **Largest text:** the title wraps to about 5 lines at 60 pt; the grid is 1 column (as today). Not drawn: no new element beyond the title.

### About you · on open · when: Continue (or Not sure) on Looks · phone 2 · `design/02-light.png`, `design/02-dark.png`
- Back · as phone 1 · tap: back to Looks (his picks kept, as today).
- Progress bar · 3 of 3 filled · VoiceOver "Step 3 of 3".
- Title · `largeTitle` · "About you" (spec OS4) · header.
- Question 1 · `headline` `ink` · "What should Kit call you?" (spec OS4 / SY4) · hidden from VoiceOver as its own element (it is the field's label, below).
- Name field · see "The parts used throughout" · placeholder "First name (optional)" (spec) · VoiceOver: text field, label "What should Kit call you?", value his name or nothing (iOS reads the placeholder when empty) · tap: focuses, keyboard up (phone 3).
- Question 2 · `headline` `ink` · "How old are you?" (spec) · **its own VoiceOver element with the header trait**, read just before the first choice (React Native on iOS doesn't speak a `radiogroup`'s label, so the question must be read on its own). The list keeps "How old are you?" as its `radiogroup` label as well. The build confirms it with `maestro hierarchy` (the header is in the tree, before "Under 18").
- Age choices · `ChoiceList` · "Under 18" · "18–21" · "22–25" · "26–30" · "31 or older" (spec, this order, en dashes) · nothing picked · VoiceOver: a radio group (labelled "How old are you?", which iOS doesn't speak; the header above does); each row a radio button, label below (**NEW** spoken labels, so the ranges are read as ranges), selected state when picked · tap: picks that row (checkmark, weight 600) and clears any other; selection haptic (`Haptics.selectionAsync`, like a Looks tile); closes the keyboard if it's up.
  - Spoken labels: "Under 18" · "18 to 21" · "22 to 25" · "26 to 30" · "31 or older".
- Footnote · `footnote` `ink3` · "Stays on your phone. It never changes your score." (spec OS4; replaces `onb.basics.never`, "Kitted is for 18 and up…", so nothing before the pick hints which answer passes, OS4.5).
- Hint · `footnote` `ink2`, centred, in the dock · "Pick your age to go on." (spec OS4) · shown only while no age is picked. **Hidden from VoiceOver** (`accessibilityElementsHidden`, `importantForAccessibility="no"`): VoiceOver hears it once, as the disabled Continue's hint.
- Continue · `KButton` primary, large (50) · "Continue" (`onb.basics.cta` in `en.ts`) · disabled (opacity 0.4) until an age is picked · VoiceOver "Continue, dimmed", hint "Pick your age to go on." · tap: see phone 4.
- Reading order: Back, progress, title, the field, "How old are you?" (header), the five choices, the footnote, Continue (with the hint while dimmed). What he hears: "Back, button · Step 3 of 3 · About you, heading · What should Kit call you?, text field · How old are you?, heading · Under 18, radio button …".
- *Removed:* his looks echoed in a bubble, Kit's reply bubble, the `Birth year` card and its year sheet (`/sheets/birth-year`), "Pick your birth year to go on."
- **Motion and haptics:** the selection haptic above; nothing animates.
- **Dark:** token swap. The list card has its 1 pt `line` border and no shadow (03 §4.4).
- **Largest text:** phone 14 (ready) and phone 16 (on open, with the hint). **Small phone (375 × 667):** the page is about 14 pt taller than the space above the dock, so it scrolls a little under the dock; nothing overlaps (not drawn).

### About you · typing his name · when: he taps the field · phone 3 · `design/03-light.png`, `design/03-dark.png`
- The keyboard (system, letters, return key "done") comes up. **The dock rides above it** (bottom padding 8 while the keyboard is up), so the hint and Continue stay visible; the page above scrolls as usual. Built with React Native's `KeyboardAvoidingView` (`behavior="padding"`) on the screen's root: the dock is in the layout, not absolutely positioned, so the build-notes trap doesn't apply.
- The field shows his text in `ink`, the caret, and iOS's clear button while editing.
- What closes the keyboard: `done`, tapping an age row, or dragging the page (`keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`, so a tap on a row both picks and closes).
- Nothing is saved per keystroke beyond today's draft rule (the step's answers wait in kv until setup ends); the name is trimmed and cut to 30 when saved (OS4.2 / SY4.2), and spaces only means no name. `maxLength` 30 stops typing at 30.
- **Motion:** the system keyboard's own; the dock moves with it.
- **Dark:** the system dark keyboard.

### About you · ready · when: an age picked (a name typed or not) · phone 4 · `design/04-light.png`, `design/04-dark.png`
- As phone 2, with "Alex" in the field (`ink`) and "22–25" picked (checkmark, weight 600).
- The hint is gone; Continue is on.
- Continue, with an 18+ band: setup is done. The profile is saved with his looks, name (if any) and `ageBand` + `ageBandAt`, no agreement, no birth year (OS4.3); Stylist opens (phone 8). With SY6 built later, Apple's age sheet comes first.
- Continue with a blank name works the same (OS4.2).

### About you · Under 18, the confirm · when: Continue with "Under 18" picked · phone 5 · `design/05-light.png`, `design/05-dark.png`
- Native alert (system style, not drawn by us) · title "Under 18?" (spec OS4; today "Born in {year}?") · message "Kitted is for ages 18 and up." (spec; the same words as `onb.age.title`, as today) · buttons "Change" (`onb.age.confirm.change`, cancel style, left) and "That's right" (`onb.age.confirm.yes`, destructive style, right), as today.
- `Change`: the alert closes; nothing changes (Under 18 stays picked, so he can pick another band and go on).
- `That's right`: the age flag is set for good and the stop screen replaces everything (phone 6), as today.
- VoiceOver: the system alert's own order (title, message, the two buttons).
- **Dark:** the system dark alert.

### The age stop · unchanged · when: `That's right` · phone 6 · `design/06-light.png`, `design/06-dark.png`
- Today's `AgeStopScreen`, word for word: the `WovenLabel` small, "Kitted is for ages 18 and up." (`onb.age.title`, `title2` 700, header), "Thanks for checking it out. You can delete the app from your Home Screen." (`onb.age.body`, `body` `ink2`), centred. No Back, no camera, kept through a relaunch and a reinstall (OS4.4). Drawn only as the must-not case.

### Restore · Welcome back · when: `I already have an account` → signed in to an account with fits (once sign-in exists) · phone 7 · `design/07-light.png`, `design/07-dark.png`
- Back (to Welcome, as today) · no progress bar (this isn't a step; `OnboardingNav step={undefined}`).
- Title · `largeTitle` · "Welcome back" (spec OS3) · header.
- Line · `body` `ink2` · "Your age first, then I'll bring back your fits." (spec OS3; replaces the Kit bubble `acct.restore.basics`).
- "How old are you?" (its own header element, as on About you), the same `ChoiceList`, the same footnote, hint and Continue as About you, with the same VoiceOver rules. **No name field** (spec assumption).
- Continue (18+): today's restore screen (`acct.restore.title`). Under 18: the same confirm and stop as phone 5.

### Stylist · setup done, Kit's offer · when: Continue on About you · phone 8 · `design/08-light.png`, `design/08-dark.png`
- Header (today's, unchanged): the Past chats button (`history`, left) · "Stylist" with today's quota line under it ("1 free check today" on a fresh install, before any server answer; no line once the server says beta, as today).
- Day stamp · `DayStamp` · "Tuesday 9:42 am" (`fmt.stampRecent`) · header (as today).
- "Kit" mark · `StylistMessage showHeader` · `common.who`.
- Kit's first message · `StylistMessage` · **today's AI note** "I'm Kit, your stylist. Quick note: I'm an AI. I read clothes, never faces, and I can get things wrong. Tap "Not quite right?" when I do." (`stylist.aiNote`) · **a stand-in:** Kit's hello (`specs/setup-and-you.md` SY2, built by another session) replaces it word for word in its place; this design doesn't own those words (spec OS5 step 2).
- Offer card · **new** `FirstCheckOfferCard` (see New parts), 12 pt below the message (the thread's `stylistCards` gap: the card is a card, not one of Kit's text lines) · `KCard` (radius 26), one `KCardSection` (16 × 20, gap 12):
  - Title · `headline` `ink` · "Want to check a fit now?" (spec OS5).
  - Body · `subheadline` `ink2`, 4 below the title · "Stand back so your shoes are in the shot. Not dressed for it? Later works." (spec).
  - The title and body are one VoiceOver element: "Want to check a fit now? Stand back so your shoes are in the shot. Not dressed for it? Later works." **No header trait** on that joined element (the title's `accessibilityRole="header"` goes; a header that also reads a sentence of body would be odd in the rotor).
  - The buttons stay separate VoiceOver elements (as `AccountOfferCard` does), on purpose: this is the one thing setup asks him to do, so both buttons are reachable by swiping. `NoConsentCard`, which posts under it after Not now (phone 11), keeps today's pattern (one element, its buttons as actions); it isn't this task's card.
  - `Check my fit` · `KButton` primary, `size="regular"` (36 visual, 44 hit), full width, with the `camera` icon (the same icon as the accessory's camera button) · "Check my fit" (spec; the same words as `composer.check`) · VoiceOver label "Check my fit. Opens the camera." (`composer.a11y.camera`) · tap: opens the camera (`/camera`); before he has agreed, the agreement shows first (phone 9).
  - `Later` · `KButton` secondary, regular, full width · "Later" (spec) · VoiceOver "Later", button · tap: phone 10.
  - Buttons 8 below the body (the section gap plus the button's own 4 pt hit padding, as in `NoConsentCard`), 16 apart visually.
- The tab bar's accessory (camera, "Ask Kit…", mic) and the tab bar (Stylist selected, `ink` tint): today's, unchanged. The camera button there opens the camera the same way (with the agreement first).
- Reading order: header, stamp, Kit's message, the card's text, Check my fit, Later, then the accessory and tabs.
- Nothing is sent (F1.3, OS5.7): the screen only shows local messages.
- **Motion and haptics:** none. The card appears with the thread (no reveal animation).
- **Dark:** token swap: the card with its `line` border, no shadow; the primary button becomes the light pill with dark text (`primary` / `onPrimary` dark tokens).
- **Largest text:** phone 15.

### The agreement · first camera open · when: `Check my fit` (or the accessory's camera button) before he has agreed · phone 9 · `design/09-light.png`, `design/09-dark.png`
- `ConsentScreen` in camera mode, full screen in the camera's place (as today). Close · `IconButton` `close`, top right, 44 · VoiceOver "Close" · tap: as `Not now`.
- **Change (OS3):** the intro is no longer a Kit bubble. It is plain text at the top: `KText` `body` `ink`, left-aligned at the 16 pt gutter, 4 below the close row, no "Kit" mark · VoiceOver reads it as text.
- Intro words: "Last thing before your first check. Here's what happens to your photo." (`onb.consent.intro`, the setup step's words, per SY5 "same words and buttons as today's agreement step"; see Open questions: today's camera mode says `onb.consent.introLater` and `Agree`).
- The card (`onb.consent.header` "Before your first fit check" and its four rows), the footer line, `See an example first` (a `TextLink` under the card, below the fold in the frame) and the dock (`Agree & check my fit` primary large, `Not now` secondary large, hairline above): **today's words and layout, unchanged**.
- `Agree & check my fit`: the agreement is saved and the camera goes live in place (OS5.2).
- `Not now` or Close: the camera closes; back on Stylist the offer card's buttons go and today's "Turn on fit checks" card posts once (phone 11).
- `See an example first`: the Example check as a sheet (T38's), over the agreement; closing it returns here.
- **Dark:** token swap.
- **Largest text:** as today's agreement (not redrawn; the only change is a bubble becoming plain text, which wraps the same way).

### Stylist · after Later · when: `Later` on the card · phone 10 · `design/10-light.png`, `design/10-dark.png`
- The card stays with its title and body only; both buttons are gone (OS5.3). Its VoiceOver element reads the same words.
- Kit's line, 12 below the card, with the "Kit" mark (a new run after a card, the thread's rule) · `StylistMessage` · "No rush. Tap the camera button whenever you're ready." (spec OS5) · VoiceOver "Kit: No rush…" (`a11y.stylistSays`).
- `firstCheckOffer.laterAt` is saved (not visible). The notifications spec posts its own ask under this line (NT1.8); not drawn here.
- **Motion:** none; the buttons are removed and the thread reflows (as `NoConsentCard` and the account card do).

### Stylist · after Not now · when: `Check my fit` → `Not now` (or Close) on the agreement · phone 11 · `design/11-light.png`, `design/11-dark.png`
- The offer card, buttons gone (as phone 10).
- Today's "Turn on fit checks" message, once (`cardType: 'turnOnChecks'`, `NoConsentCard`, unchanged): "Kit" mark, "Send me a fit. I'll score it and start your closet." (`noConsent.greeting`), then the card: "Turn on fit checks" (`noConsent.title`), "To score a photo, I need your OK to send a face-free copy to Google's Gemini API." (`noConsent.body` with `config.providerDefault`), `Review and turn on` (`noConsent.cta`), `See an example` (`noConsent.example`). Its buttons go once he agrees, as today.
- A second Not now (from `Review and turn on` or the camera button) posts no second copy.

### Stylist · after a scored check · when: any scored check (from the card or the camera button); also after a relaunch · phone 12 · `design/12-light.png`, `design/12-dark.png`
- The offer card keeps its words with no buttons, for good (OS5.4).
- His photo bubble (`PhotoBubble`, neck-down, as today) and the check's own result card follow, unchanged. The frame's photo and numbers are only an example (the mockup's), not this task's.
- The header's quota line is today's rule (`stylistSubtitle`), not this task's: after the day's free check it reads "Re-check included" (`stylist.quota.recheck`), drawn that way.
- Not shown, and not changed: the closet card, the first-score tip (SY2), the account offer.

### Stylist · an install that finished setup before this change · when: he updates the app having already finished setup (OS5.6) · not drawn
- Today's Stylist, unchanged: his thread as it was, **no offer card**, and nothing posted by the update (no `firstCheckOffer` message is ever created for him). The must-not case for OS5.6; there is no new pixel to draw, so it has no phone.

### Style profile · Name and Age · when: You → Your style · phone 13 · `design/13-light.png`, `design/13-dark.png`
- Header (today's native stack): Back · "Style profile" (`profile.title`) · "Done" (`common.done`).
- Section header · `MonoLabel` · "Basics" (`profile.basics`).
- Basics card · `KCard` radius 20, the existing `Row` (52 pt) and `RowDivider` (inset 16):
  1. **Name** row (new, first) · label "Name" (**NEW** label; see Words) `callout` 500 `ink` · value: an inline `TextInput`, right-aligned, `callout` **`ink`** (so the editable row reads differently from the read-only Age value in `ink2`), showing his name ("Alex") or the placeholder "First name (optional)" (`ink3`, the same placeholder as setup, SY4) · the same input settings as About you's field (given name, words, 30 max, clear button while editing, done) · VoiceOver: text field, label "Name", value his name · tap: anywhere on the row focuses the field. A change saves the way the page already saves (on Done, Back or a swipe); a blank field (or spaces) clears the name (SY4.2).
  2. **Fit you like** · unchanged (`BasicsFields`, `Segmented`; dark: the selected segment takes the ink fill, as the component does today).
  3. **Age** row (replaces Birth year) · label "Age" (**NEW** label) · value "22–25" (`callout` `ink2`) · read-only, one VoiceOver element: "Age, 22 to 25" (`settings.a11y.value` with the spoken band) · tap: nothing.
     - Value rules (OS4.6): his `ageBand`; for an older profile with only a birth year, the band from the birth year and the current year (`18–21` … `31 or older`); with neither, "Not set" (`profile.birthYearNone`, as today).
- Footnote under the card · `footnote` `ink3` · "Age can't be changed here." (spec OS4; replaces `profile.birthYearNote`).
- Styles and Budget sections: unchanged.
- **Largest text:** phone 17. The existing `Row` stacks its label over the value at accessibility sizes: "Name" (49 pt) over the inline field, now full width and left-aligned (its text capped at 2×, 34 pt); "Fit you like" over `Segmented`'s stacked choices (as today); "Age" over "22–25". Nothing truncates.
- **Dark:** token swap.

### Largest text · About you, ready · phone 14 · `design/14-light.png`, `design/14-dark.png`
At AX5 (largeTitle 60/72, body and headline 53/64, footnote 44/53; the field's text, Continue and the nav are capped at 2×: 34/44):
- The title on one line; each question wraps (2 lines); the field grows to its 34 pt text (min 60 tall, radius 30).
- Each age row grows with its 53 pt label ("31 or older" wraps to 2 lines); the checkmark scales with the text (40 pt) and stays at the trailing edge, vertically centred.
- The page scrolls under the pinned dock; Continue grows to its 34 pt text (min 60). The footnote is reached by scrolling.
- Nothing truncates; no `numberOfLines` anywhere on this screen.

### Largest text · Kit's offer · phone 15 · `design/15-light.png`, `design/15-dark.png`
- The thread opens scrolled to the newest message, so the frame shows the end of the card: the title (3 lines at 53 pt) and the body (5 lines at 49 pt) wrap; both buttons grow to their 34 pt text (min 60) and put the camera icon above the words (`KButton`'s AX layout, as today).
- The header's title and quota line are capped at 2× (as today). Nothing truncates.

### Largest text · About you, on open · phone 16 · `design/16-light.png`, `design/16-dark.png`
- AX5 with nothing picked. The hint wraps to 2 lines at 44 pt over the dimmed Continue (34 pt text, min 60). The pinned dock measures about 216 pt (8 top + 106 hint + 8 gap + 60 button + 34 bottom), leaving about 550 pt of page above it (from the nav's bottom at 106). The page scrolls under the dock; the frame shows down to the first choice.
- Once he picks, the hint goes and the dock shrinks to about 102 pt (phone 14).

### Largest text · Style profile · phone 17 · `design/17-light.png`, `design/17-dark.png`
- AX5. The header's title and Done are capped (as today); "Basics" is `MonoLabel` in sentence case at AX sizes. Each `Row` stacks: "Name" (`callout` 500 at 49 pt) over the inline field ("Alex", `ink`, 34 pt, full width, left-aligned); "Fit you like" over the stacked `Segmented` choices; "Age" over "22–25" (`ink2`, 34 pt). The footnote "Age can't be changed here." follows at 44 pt; Styles and Budget are below the fold. Nothing truncates.

## Words
Every string he reads in this task (VoiceOver-only strings marked).
- "Which of these would you actually wear?" · "Tap up to 3." · spec OS3. Today both are one string, `onb.looks.prompt`, in `en.generated.ts` (generated from `handoff/02-screens.md` §5, "Don't edit"): the split goes into 02's copy deck and is regenerated, or the two keys are added in `en.ts` (suggested `onb.looks.title`, `onb.looks.sub`).
- "Step {n} of {total}" · `onb.progress.a11y` (VoiceOver; `total` becomes 3)
- "About you" · "What should Kit call you?" · "First name (optional)" · "How old are you?" · spec OS4 / SY4 (new keys)
- "Under 18" · "18–21" · "22–25" · "26–30" · "31 or older" · spec OS4
- "Under 18" · "18 to 21" · "22 to 25" · "26 to 30" · "31 or older" · **NEW** (VoiceOver only): the founder's call; approving the design approves them
- "Stays on your phone. It never changes your score." · spec OS4 (replaces `onb.basics.never`)
- "Pick your age to go on." · spec OS4 (replaces `onb.basics.yearHint`)
- "Continue" · `onb.basics.cta` (`en.ts`)
- "Under 18?" · spec OS4 (replaces `onb.age.confirm.title`, "Born in {year}?")
- "Kitted is for ages 18 and up." · spec / `onb.age.title` · "Change" · `onb.age.confirm.change` · "That's right" · `onb.age.confirm.yes`
- "Thanks for checking it out. You can delete the app from your Home Screen." · `onb.age.body` (unchanged)
- "Welcome back" · "Your age first, then I'll bring back your fits." · spec OS3 (replaces `acct.restore.basics`)
- "I'm Kit, your stylist. Quick note: …" · `stylist.aiNote` (stand-in for SY2's hello, not this task's words)
- "Want to check a fit now?" · "Stand back so your shoes are in the shot. Not dressed for it? Later works." · "Check my fit" · "Later" · spec OS5 (new keys)
- "Check my fit. Opens the camera." · `composer.a11y.camera` (VoiceOver, existing)
- "No rush. Tap the camera button whenever you're ready." · spec OS5 (new key)
- "Last thing before your first check. Here's what happens to your photo." · `onb.consent.intro` (unchanged words; see Open questions)
- The agreement's card, footer, `Agree & check my fit`, `Not now`, `See an example first` · today's `onb.consent.*` (unchanged)
- "Send me a fit. I'll score it and start your closet." · "Turn on fit checks" · "To score a photo, I need your OK to send a face-free copy to {provider}." · "Review and turn on" · "See an example" · `noConsent.*` (unchanged)
- "Name" · **NEW** label for the Style profile row: the founder's call (the spec says "a `Name` row" but doesn't give a key; this is the word it names)
- "Age" · spec OS4 ("The `Birth year` row becomes `Age`")
- "Age can't be changed here." · spec OS4 (replaces `profile.birthYearNote`)
- "{label}, {value}" · `settings.a11y.value` (VoiceOver, existing)
- "Not set" · `profile.birthYearNone` (unchanged)
- Header, stamp, tab names, "Ask Kit…", "Done", "Basics", "Fit you like", the fit labels, the Styles and Budget sections · unchanged

No visible word is invented: every visible string is the spec's or already in the app. The only NEW strings are the five spoken band labels and the "Name" row label.

## New parts
- **`ChoiceList`** (design system, next to `Chip`): a single-choice list of equal rows in a `KCard`, a checkmark on the picked row, radio semantics (`accessibilityRole="radiogroup"` on the list with the question as its label, `radio` + `selected` on each row), each row at least 52 pt, the label wrapping at any size. Why not the existing parts:
  - `Segmented`: five labels in one 32 pt bar on a 370 pt-wide card get about 66 pt each; "31 or older" would shrink (the component's `adjustsFontSizeToFit`) and the bar reads as a view switch, not a question.
  - `Chip` / `ChipFlow`: chips size to their words, so the five choices wouldn't be equal in size (OS4), and they wrap unevenly (3 + 2).
  - A wheel or menu (`MorphPicker`): hides four of the five choices and needs two taps (F1.1's count is one tap).
- **`FirstCheckOfferCard`** (`features/onboarding/`): Kit's offer card for `cardType: 'firstCheckOffer'`, built only from `KCard`, `KCardSection`, `KText` and `KButton`, the way `NoConsentCard` and `AccountOfferCard` are. Shows its buttons while he has no scored check, hasn't tapped Later and hasn't said Not now on the agreement; after that, its title and body only (OS5.3–OS5.6). Why new: no existing card has these words or this rule.
- **The name field**: the `TextInput` style already used by Looks' `Something else?` field. If the planner prefers, it becomes a small shared `KTextField` (that style, plus the given-name settings); not a new look.
- **Style profile's Name row**: the existing `Row` holding an inline `TextInput` (Row already "lets the control speak"). No new component.
- **Plain step title**: `largeTitle` + optional `body` line. It can be a few lines in each screen or a tiny shared `StepTitle`; no new style.
- No new tokens.

## Checked by the designer
- **HIG:**
  - Onboarding: setup stays short (two questions after Welcome), the main task is one tap away at the end, and the camera opens only on his tap. Pass.
  - Entering data / text fields: a label above the field, a placeholder that says it's optional, the given-name content type (AutoFill can offer his name), the clear button and Done, no autocorrect on a name. Pass.
  - Lists and tables: a checkmark on the picked row of a short single-choice list; rows at least 44 pt. Pass.
  - Alerts: a short title, one line of message, two buttons, the cancel on the left and the irreversible one in the destructive style. Pass (today's alert, new title).
  - Typography: Dynamic Type to AX5 with nothing truncated (phones 14–15). Pass.
  - Dark Mode: token swap, system keyboard and alert. Pass.
  - Accessibility: every control has a label, the radio group has its question, the disabled button says why, decorative drawings are hidden (Looks, unchanged). Pass.
- **§C14:**
  - Tab bar for top-level navigation only: pass (setup shows none; Stylist's is today's).
  - Never a tab as an action: pass (the camera is a button on the card and in the accessory).
  - Settings behind a gear: not applicable (SY1 moved settings to You).
  - 44 × 44 touch targets: pass (rows 52, field 44, large buttons 50, card buttons 36 visual + 4 pt padding = 44, circles 44).
  - Text contrast 4.5:1: pass; only `ink`, `ink2`, `ink3` on `bg` / `surface` (03 §2.1; the T38 critic's measurements: `ink3` on `bg` 4.91 / 6.51, on `surface` 5.41 / 5.87, light / dark). The disabled Continue is exempt (disabled controls) and says why in the hint.
  - Dynamic Type at the largest sizes: pass (phones 14–15).
  - Feedback within ~0.1 s: pass (the checkmark and haptic on tap).
  - A clear X or Back on every modal and the camera: pass (Back on Looks, About you, Restore; X on the agreement). The stop screen has none on purpose (unchanged ruling).
  - Familiar patterns: pass (a native list with checkmarks, a system alert, a chat card like the account and fit-check cards).
  - Progressive disclosure: pass (no agreement in setup; it comes at the camera).
  - Notifications, accounts: not applicable here.
  - Privacy in plain words: pass ("Stays on your phone. It never changes your score.").
  - A neutral age question (FTC COPPA FAQ D.7, cited in the spec): nothing preselected, an honest "Under 18" answer, and no line before the pick that says which answer passes (OS4.5). Pass.
- **Design system:** only 03 / `tokens.ts` tokens and existing components (`OnboardingNav`, `KText`, `KCard`, `KCardSection`, `KButton`, `IconButton`, `RowDivider`, `Row`, `MonoLabel`, `Segmented`, `StylistMessage`, `DayStamp`, `NoConsentCard`, `LookTile`, `WovenLabel`, `Icon`), plus `ChoiceList` and `FirstCheckOfferCard` above.
- **Hard lines:** no face, body or skin: the Looks tiles are drawn garments (unchanged), and the only photo (phone 12, his own check) is neck-down. No emoji, ranks or streaks. Copper: none added; the agreement's row icons stay in `accent` as today. Kit says he is an AI in the first message (the stand-in AI note, and SY2's hello keeps it). Nothing is sent before Agree.

## Open questions for the founder
- **The name field's outline is faint** (`line` on `surface` 1.29:1; the field's `surface` on `bg` 1.10:1), the same as Looks' existing field. The label above and the placeholder identify it, so I've kept it. · recommended: keep it as Looks' field. · other: a `surface2` fill for both fields (a small design-system change, best in its own task).
- **The keyboard on Looks and About you.** About you's Continue rides the keyboard; Looks' `Something else?` field leaves its dock under it, as today. · recommended: About you as drawn; Looks unchanged in T39 (its behaviour is out of scope). · other: move both to one approach (`useAnimatedKeyboard`, as `StylistScreen` does) in T39.
- **How the five age choices look.** · recommended: a list with a checkmark (phone 2), like iOS Settings: every choice the same size, the whole row is the button, and it reads as a question, not a switch. · other: five equal capsules (chip style) stacked full width, or one segmented bar (too tight for "31 or older").
- **The agreement's words when it opens on the camera.** The spec keeps "today's agreement step" words (`Last thing before your first check…`, `Agree & check my fit`, `See an example first`), but today's camera version says `Before I score a photo, here's what happens to it.` and `Agree`, with no example link. · recommended: the setup step's words (as drawn) while he has no scored check yet; today's camera words after that. "Last thing before your first check" is then only ever said before a first check (someone who later turns "Score my fits" off and back on would see the camera words). · other: the setup step's words every time.
- **`Pick by name instead` on Looks.** The spec says it "stays as it is", but today's Looks has no such link (only `Not sure`; `onb.looks.byName` exists in the copy file but nothing shows it). · recommended: keep Looks as today, with no new link (drawn that way): a new way to pick is a behaviour change the spec didn't plan. · other: add the link back (needs its own sheet, `onb.byName.*`).
- **The agreement's "What doesn't" row says "your birth year".** New setups no longer save a birth year. · recommended: leave the agreement's words to the task that owns them (SY5 / T33) and change it there to "your age"; T39 doesn't touch the agreement's words. · other: change that one word in T39.

## Out of scope
- Welcome and the Example check (OS1–OS2, T38, approved): not redrawn.
- Kit's hello and the tips' words (SY2, another session): phone 8 shows today's AI note in the hello's place.
- Apple's age sheet (SY6, T32); Apple's first name filling the name (F1.4, T41); saying the name in greetings (T51).
- The agreement's own words and its footer ("You → Settings → Privacy & data", which SY1's task changes).
- The reminder and notification ask after Later (`specs/notifications.md`, NT1.8): it posts under Kit's Later line.
- The camera itself, the reading screen and the result card (unchanged).

## Design check (critic)
Written by the critic, round by round.

### Round 1 · 2026-11-10 · verdict: doesn't match (1 blocker)
I read all 30 PNGs (2x, so px ÷ 2 = pt), design.html (its words, by search), the specs (OS3–OS5, F1.1–F1.3, and SY4 from `origin/main`), 03, `tokens.ts`, §C14, 12_ios26-metrics, the pro-rules checklist, and `BasicsScreen`, `NoConsentCard`, `OnboardingNav`, `ConsentScreen`, `KButton`, `Row` and `Segmented`. No Simulator or browser, because memory was low.

**What checks out (measured):**
- Every visible word traces to the spec or to `en.ts` / `en.generated.ts`.
- About you rows are 52 pt. The dock sits 34 pt off the bottom. With the keyboard up, the dock is 8 pt above it.
- The card buttons are 36 pt drawn (44 pt hit, from `KButton` padding (44−36)/2) and 16 pt apart.
- The gutters are 16 pt and the spacing between parts is 24 / 8.
- Contrast from the tokens, light / dark:
  - `ink3` on `bg`: 4.91 / 6.51; on `surface`: 5.41 / 5.87.
  - `ink2` on `bg`: 5.87 / 8.00.
  - `onPrimary` on `primary`: 15.11 / 16.62.
- No emoji, ranks or streaks. No copper is added (the tab tint is `ink`, `(tabs)/_layout.tsx:28`).
- The frames match DESIGN.md element for element.

**Blockers**
1. **The age question is never read aloud by VoiceOver** (phone 2, and phone 7 Restore: "How old are you?").
   - What's wrong: DESIGN.md makes it "the list's group label, not its own VoiceOver stop", and the reading order leaves it out. But React Native on iOS doesn't speak a group label. `RCTViewManager.m:87` maps `radiogroup` to `UIAccessibilityTraitNone`. Fabric's `RCTViewComponentView.mm` handles only `radio` (it adds "radio button" to the value) and sets no container type. So a container's `accessibilityLabel` is never spoken when focus lands on a row.
   - What he hears: "About you, heading · What should Kit call you?, text field · Under 18, radio button …", with no question.
   - Rule: a missing VoiceOver label (HIG Accessibility; critic blocker list).
   - Fix: make "How old are you?" its own VoiceOver element with the header trait, read just before the list. Put it in the reading order ("… the field, How old are you?, the five choices …"). Keep the radiogroup label as well. Confirm it with `maestro hierarchy` in the build.

**Polish**
1. **The hint is read twice** (phone 2): once as a text stop in the dock, then again as Continue's hint. Fix: keep one of them. Either keep the button hint and hide the dock line from VoiceOver, or the other way round.
2. **The age rows have no pressed state** (phone 2, `ChoiceList`). The checkmark only shows when he lifts his finger (pro-rules: every tappable element shows clear feedback when pressed). Fix: define the row's pressed look, for example `opacity.pressed` like `KButton`, or a `surface2` highlight like an iOS list row.
3. **The offer card's VoiceOver setup is unclear and differs from the card under it** (phone 8 / 11).
   - The title is marked "header", but the title and body are also "one VoiceOver element". Does the joined element carry the header trait?
   - `NoConsentCard`, drawn right under it in phone 11, is a single element with its buttons as actions.
   - Fix: say which trait the joined element has (recommend no header on it), and note that the different button handling is on purpose.
4. **The OS5.6 must-not case isn't named in States.** That's an install that finished setup before this change: Stylist with no offer card. Fix: add one line (today's Stylist, no card) so the planner writes its test.
5. **Phone 12's header says "1 free check today" after a scored check.** After a check is used, the quota line changes (`services/quota.ts` `stylistSubtitle`). Fix the frame, or add "header not this task's" to its note.
6. **The largest text size isn't drawn for two cases:**
   - The Style profile Name row. It's a new inline field, and `Row` stacks at AX sizes.
   - About you's dock with the hint showing, at about 44 pt footnote plus a 60 pt button pinned at the bottom.

   Fix: draw them, or give the measured dock height and say the page still scrolls under it.
7. **The name field's outline is faint** (phone 2, 13). `line` on `surface` is 1.29:1 (1.30 dark), and the field's `surface` on `bg` is 1.10:1, under 3:1 for the outline. It's the same as Looks' existing field, and the label above plus the placeholder identify it, so it doesn't block. Optional fix: a `surface2` fill or a darker border, applied to both fields.

**Suggestions (for the founder, optional)**
1. **Style profile:** the editable Name row and the read-only Age row look the same (label on the left, an `ink2` value on the right). Showing the name in `ink` would hint that it can be edited. The footnote "Age can't be changed here." helps already.
2. **Keyboard:** About you uses `KeyboardAvoidingView`. Looks, the step before, has the same kind of field and leaves its dock under the keyboard. The build notes suggest `useAnimatedKeyboard` (as `StylistScreen` does). One approach for both steps would feel more consistent.
3. **The build should check that VoiceOver says "First name (optional)"** on the empty field once it has `accessibilityLabel`. If iOS doesn't read the placeholder, add the hint "Optional".
4. **Phone 12's photo is from the stock test set** (design.html's `PH` table, Unsplash/Pexels). It's fine in an internal frame. For the reason given in OS1, it should never reach anything people outside see.

**Outside this task (not counted):** the agreement's row icons are copper (`ConsentScreen.tsx`, `color="accent"`), drawn unchanged in phone 9. 03 principle 1 says copper is for score movement only. This belongs with the agreement's own task (SY5 / T33), next to the "your birth year" wording the designer already raised.

### Round 2 · 2026-11-10 · verdict: matches (no blockers)
I re-read DESIGN.md (States, the Changes for Round 2 and the Open questions) and the redrawn and new PNGs, light and dark: phones 12, 13, 16 and 17. The other PNGs are dated before round 1 and are unchanged. No Simulator or browser.

**Round 1 items:**
- **Blocker 1, fixed.** "How old are you?" is now its own header element, read just before the choices, on About you and on Restore. The reading order and what he hears are spelled out ("… What should Kit call you?, text field · How old are you?, heading · Under 18, radio button …"), and the radiogroup label stays. **Build check:** the header appears in `maestro hierarchy` just before "Under 18".
- **Polish 1, fixed.** The dock hint is hidden from VoiceOver, so he hears it once, as Continue's hint.
- **Polish 2, fixed.** A pressed row fills with `surface2`. Text on it stays readable: `ink` on `surface2` is 15.43 / 13.20.
- **Polish 3, fixed.** The joined title-and-body element has no header trait, and the separate buttons are on purpose.
- **Polish 4, fixed.** OS5.6 is named under States (an older install: no offer card, nothing posted).
- **Polish 5, fixed.** Phone 12's header reads "Re-check included" (`stylist.quota.recheck`, in `en.generated.ts`), noted as not this task's.
- **Polish 6, fixed:**
  - Phone 16 (About you at the largest size): the hint wraps to 2 lines over the dimmed Continue. I measure the dock's top edge at y 646, so about 228 pt against the 216 stated. The 12 pt gap is how the HTML frame draws text, and the page still scrolls under the dock. Nothing is cut off.
  - Phone 17 (Style profile at the largest size): each row stacks its label over its value, and "Basics" turns sentence case as `MonoLabel` does today. Nothing is cut off.
- **Polish 7 (the faint field outline): with the founder** under Open questions. I agree it doesn't block.
- **Suggestions:**
  - Name's value is now `ink`, against Age's `ink2` (phones 13 and 17). That's 17.93 / 14.97 on `surface`.
  - The keyboard point is with the founder.
  - The placeholder check is passed to the build. Without a new word that's the right call, and the planner raises it if iOS stays silent.
  - The stock photo stays inside the frames.

**New findings:** none. All the new words are in the string files or the spec. No copper is added, and the tokens are unchanged.

**What the build-mode critic must check:**
- VoiceOver reads "How old are you?" as a header just before the choices, on About you and Restore.
- VoiceOver says "First name (optional)" on the empty name field.
- A row turns `surface2` while pressed.
- Tapping anywhere on the Style profile Name row (52 pt) focuses its field.

**Still outside this task:** the copper icons on the agreement (as in round 1).

## Changes
- **Round 2** · from the critic, round 1:
  - **Blocker 1 (the age question isn't spoken):** "How old are you?" is now its own VoiceOver element with the header trait, read just before the choices, on About you and Restore; the `radiogroup` label stays too. The reading order now lists it, with what he hears. The build checks it with `maestro hierarchy`. No pixels changed.
  - Polish 1: the dock's hint is hidden from VoiceOver; it is heard once, as the disabled Continue's hint.
  - Polish 2: the age rows' pressed look is a `surface2` fill while the finger is down (`ChoiceList`).
  - Polish 3: the offer card's joined title-and-body element has no header trait; its buttons stay separate elements on purpose (unlike `NoConsentCard`, which isn't this task's card).
  - Polish 4: the OS5.6 must-not state (an older install: today's Stylist, no offer card) is named under States, without a phone.
  - Polish 5: phone 12's header now reads "Re-check included" (today's quota rule after the day's check), and its note says the header isn't this task's. Redrawn: 12.
  - Polish 6: added phone 16 (About you on open at AX5, the dock with the hint, measured at about 216 pt) and phone 17 (Style profile at AX5, the Name row stacked).
  - Polish 7 (the faint field outline): kept as Looks' field; put to the founder under Open questions.
  - Suggestions: the Name value is now `ink` (editable) against Age's `ink2` (redrawn: 13, and 17). The keyboard consistency point is under Open questions. The placeholder check is for the build: VoiceOver should say "First name (optional)" on the empty field; if iOS doesn't read the placeholder once the field has an `accessibilityLabel`, the planner raises it (no "Optional" hint added, since that would be a new word). The stock photo in phone 12 stays internal to the frames.
  - Redrawn phones: 12, 13 (light and dark); new: 16, 17 (light and dark). Every other PNG is unchanged.
