# T38 · Design: Welcome and the Example check, drawn in code

**Approved by the founder:** 2026-11-09 in chat (all 13 phones; the open questions as picked: 8.0 in ink, "Full check" before the swap, the s14 reading, `onb.example.a11yOutfit` as written, Closet's night-rim rule kept, the drawing kept at AX sizes)

<!-- Leave this comment. Only the coordinator replaces it with the approval line, after the founder's yes in chat. -->

**From:** `plan.md` → T38 · **Spec:** `specs/onboarding-screens.md` → OS1 (OS1.1–OS1.4), OS2 (OS2.1–OS2.2) · **Frames:** `tasks/T38/design.html` (open with `preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/T38/design.html`) · **PNGs:** `tasks/T38/design/`

Approved, this file is the contract: the planner copies the UI inventory from it word for word, and the critic holds the build to it. It changes only with the founder's yes.

## What he sees
Welcome has no photo. An outfit drawn by Closet's code sits on the screen's background, next to the mini score card. A second after it opens, the sneakers swap for the ones the top fix names, and the card counts up from 7.5 "Put together" to 8.0 "Sharp" with the fix's words under it. Then it holds still. "See an example check" shows the same drawn outfit where his photo bubble would be, with the full result card for the 7.5 state.

## Where it lives
- **Welcome** (`app/onboarding/welcome`, `WelcomeScreen`): the first screen of a fresh install, and where setup resumes before Looks. He leaves by `Get started` (Looks), `See an example check` (the Example check, pushed), or `I already have an account` (the sign-in sheet; shown only once accounts exist, `useAccountsOn()`, so it isn't in the beta frames). No Back.
- **The Example check** (`app/onboarding/example`, `ExampleCheckScreen`): pushed from Welcome, with a Back circle and `Get started` docked at the bottom. The same screen opens as a sheet from "See an example" after setup (mode `sheet`), with an X and `Check my own fit`. Both read-only. He leaves by Back / X / swipe down (sheet), or the docked button.
- **The drawn outfit.** Both screens draw the same bundled reading, and the scores come from it (see "The outfit" below). The frames use the real `renderFlat` output for these pieces, light and dark. No person, no skin, no face, nothing photographic.

### The outfit (the frames assume this; the planner confirms it)
- **The reading:** the bundled `s14` reading as it is today: charcoal denim jacket, white sweater, grey drawstring trousers, grey chunky sneakers (worn), full body, shoes visible. Only the reading is kept (it's garment fields, not a likeness); the photo goes. *Recommended:* it is a neutral everyday outfit, its top fix swaps one visible piece, and its numbers are already covered by tests.
- **What the scoring code gives it** (run Nov 9 in this worktree, `exampleCheck()` and `applyPartsFix` on the worktree's own sources, Everyday, no picks, empty closet, first check):
  - before: **7.5**, "Put together"; summary "Good base. Swapping one piece gets you to 8.0."
  - top fix: "Swap the chunky sneakers for low-profile sneakers" · detail "Raises Shoes to 8 · free if you own one" · → 8.0. Its edit sets the shoes to `low_profile_sneaker`, white, clean.
  - next level: "Clean chunky sneakers lift Shoes to 7.5. Not enough to move the score yet."
  - after (the fix applied to the reading, scored again): **8.0**, "Sharp".
  - These numbers and lines are engine output, shown here only so the founder can see them. The build computes every one of them (OS1.2). If the engine changes before the build, the frames' numbers change with it. Nothing is typed in.
- **How it's drawn:** each garment goes through `artSpec` (its family's swatch hex, no closet art), then `renderFlat`. The layout is Closet's `StandingOutfit`: top, bottoms, shoes stacked in body order, and the outer layer (the jacket) at the side. On Welcome there's no tile behind it (the spec says "on the theme's background"); in the Example bubble it sits on the `surface2` tile, the same way StandingOutfit draws it.

## States
In the order he meets them.

### Welcome · on open · when: Welcome appears (fresh install, or setup resumed at Welcome) · phone 1 · `design/01-light.png`, `design/01-dark.png`
Top to bottom, in VoiceOver's reading order (the drawing is hidden, so VoiceOver starts on the card):
- Status bar · system · follows the theme: dark text in light, light text in dark. *Change from today:* Welcome no longer forces it dark (`setStatusBarStyle` and its `useFocusEffect` go).
- Drawn outfit · **new** `DrawnOutfit` (see New parts) · no words · drawn in a base box 214 × 324 pt, scaled by **k** (see "How Welcome fits every phone" below; k = 0.88 on this 402 × 874 phone, so 188 × 285, top 132, left 12). Base layout, before scaling: jacket 104 pt (left 0, top 24), sweater 134 (left 64, top 0), trousers 134 (left 64, top 124), shoes 150 (left 56, top 204, Closet's wider shoe art); each size is the art's 200 × 200 box, which has its own margins, so the drawn left edge lands about 12 pt inside the box (about 24 pt from the screen edge, in line with the text column) · drawn in the theme's flats scheme (`light` / `dark`). **No rim on this outfit in dark:** `renderFlat`'s dark halo is only for pieces darker than `HALO_LUM` (0.05), and the charcoal jacket (`#4A4D55`, 0.074) is above it, as it is in Closet. The rule is unchanged; this sentence was wrong in round 1. Its fill is 2.28:1 on dark `bg` (see Open questions) · VoiceOver: hidden (`accessibilityElementsHidden`, `no-hide-descendants`) · tap: nothing.
- Mini score card · `KCard` radius `cardSmall` (20) · right 20 (`space.xl`), width 188, padding 12 (`space.m`), gap 8 (`space.s`); its top is fixed and it grows downward, centred on the drawing's middle by its after-state height (top 208 here) · one VoiceOver element, label below · tap: nothing.
  - At the larger non-accessibility text sizes (xLarge to xxxLarge) the row stays side by side; the word and detail wrap (no `numberOfLines` anywhere in the card) and the card grows downward. It never overlaps the drawing, because the drawing's right edge is kept left of the card's left edge whatever its height (below).
  - Tag row · `MonoLabel` ×2, space-between, gap 8 · "Fit check" (`en.generated.ts` `onb.welcome.cardTag`) · "Everyday" (`onb.welcome.cardOccasion`) · `caption` mono 12, `ink3`.
  - Score row · `Numeral` 52 (Archivo) `ink` "7.5" (engine) + gap 12 + the word `KText` `subheadline` 600 `ink` "Put together" (`scoreWordLabel`), aligned on the bottom.
  - Detail line · `KText` `caption` `ink2` · "Full check" (`onb.welcome.cardDetail`) · now **under** the score row at the card's full width (today it sits beside the word). The after state needs that width for the fix's words, and keeping it in one place stops the card jumping sideways.
  - VoiceOver label (the after state, read the same from the first frame, so it never changes under his finger): "Example fit check. Everyday. 7.5 out of 10, Put together. One fix: Swap the chunky sneakers for low-profile sneakers. 8 out of 10, Sharp." (spec OS1 template, NEW key `onb.welcome.cardA11y`: `Example fit check. {occasion}. {before} out of 10, {beforeWord}. One fix: {fix}. {after} out of 10, {afterWord}.`; scores through `spokenScore`, so "8", never "eight point zero").
- Wordmark · `WovenLabel` small · "KITTED" · left-aligned · VoiceOver: as today.
- Headline · `KText` `largeTitle` 700 `ink`, header trait · "Look put together.\nWithout trying\ntoo hard." (`onb.welcome.title`, unchanged).
- Body · `KText` `body` `ink2` · "Send a fit. Get a score out of 10 and the two or three moves that raise it." (`onb.welcome.body`, unchanged).
- `Get started` · `KButton` primary, 50 tall, full width · `onb.welcome.start` · tap: saves step `looks`, pushes Looks (unchanged).
- `See an example check` · `KButton` ghost (ink2 text), 44 · `onb.welcome.example` · tap: pushes the Example check (unchanged).
- `I already have an account` · `TextLink` ink2, centred · `onb.welcome.haveAccount` · only once accounts exist; not drawn (unchanged).
- Bottom block · left/right 24 (`space.heroGutter`), gap 16 (`space.l`), buttons 8 below the body with 2 between them, bottom max(safe area, 10) + 10 = 44. Unchanged.

**How Welcome fits every phone** (new in round 2; phones 11–13). One scroll view holds two groups: the hero group (the drawing and the card) at the top, and the bottom block. The content is at least the screen's height, with the bottom block pinned to the bottom (`flexGrow: 1`, `justifyContent: 'space-between'`). Nothing is absolutely positioned against the screen any more.
- **The drawing's scale** k = min(1, k_w, k_h), floored at 0.6:
  - k_w = (W − 228) / 198, so the drawing's drawn right edge (12 + 198k; 198 is the shoes' drawn right edge in the base box, the widest piece beside the card) stays at least 8 pt left of the card's left edge (W − 20 − 188).
  - k_h = (H − safe-area top − 24 − 24 − bottom block's height) / 324, so the drawing and the bottom block fit on one screen with 24 pt above the drawing and at least 24 pt between it and the wordmark.
  - Results: 402 × 874 → 0.88 (width); 375 × 667 → 0.74 (both); 390 × 844 with accounts on → 0.82 (width); 440 × 956 → 1.0.
- **Where the hero group sits:** centred vertically in the space between safe-area top + 24 and the bottom block's top − 24, so on a tall phone (Pro Max) the extra room is shared above and below instead of collecting between the shoes and the wordmark. The card is centred on the drawing's middle, using its after-state height so its top never moves during the swap.
- **When it doesn't fit** (k would fall under 0.6: an accessibility text size, or a short phone with accounts on and a large size), k stays 0.6 and the page scrolls; the bottom block follows the hero group with 24 pt between them. At accessibility sizes the AX layout applies (phones 8–9).
- *Change from today:* the hero is an absolute 455 pt block and the card is absolute at top 125. Both go.
- The hero photo, its neck crop and its fade-to-background gradient are **gone**.
- **Motion and haptics:** see phone 2. No haptic (nothing he did caused it).
- **Dark:** token swap; the flats use their `dark` scheme. The card loses its shadow (light only, 03 §4.4) and keeps its 1 pt `line` border.
- **Largest text:** phones 8–9. **Small phones:** phones 11–13.

### Welcome · the swap, mid-way · when: about 0.6–1.6 s after Welcome first appears · phone 2 · `design/02-light.png`, `design/02-dark.png`
The same elements as phone 1. What moves, about 2 s in all:
- 0–600 ms: phone 1, still.
- 600–1200 ms: the shoes cross-fade from the grey chunky sneakers to the white low-profile sneakers (the after reading's shoes), opacity only, ease-in-out. No other piece moves.
- 900–1500 ms: the numeral counts 7.5 → 8.0 in tenths (7.6 at 1000 ms, 7.7 at 1100, 7.8, 7.9, 8.0 at 1400–1500), about 100 ms a step, with tabular figures so the word beside it doesn't shift (`Numeral` gains a `tabular` prop, see New parts). The frame is at 1100 ms: 7.7, the shoes about 80% faded in.
- At 1500 ms (when the count lands): the word cross-fades "Put together" → "Sharp", and the detail line cross-fades "Full check" → the fix's words, 200 ms. The card grows by one line (the fix wraps to two), downward from its fixed top, over the same 200 ms.
- From 2000 ms: still (phone 3). It plays **once per visit** to Welcome: on first appearance, and again only if Welcome is mounted again (say, Back from Looks after setup restarted). It doesn't replay when he scrolls or when the app comes back from the background.
- **Reduce Motion on, or an accessibility text size:** no motion at all; phone 3's state from the first frame (spec OS1). If Reduce Motion is turned on mid-play, it jumps to the after state.
- Haptics: none.

### Welcome · after the fix · when: from about 2 s on; and from the first frame with Reduce Motion · phone 3 · `design/03-light.png`, `design/03-dark.png`
As phone 1, with:
- Shoes: the white low-profile sneakers (the fix's edit applied to the reading, drawn by the same code).
- Numeral "8.0" (engine, the after reading's score) in `ink`. See the open question on copper.
- Word "Sharp" (`scoreWordLabel`).
- Detail line: "Swap the chunky sneakers for low-profile sneakers" (the top fix's `copy`, from the engine; spec "the fix's own short words") · `caption` `ink2`, wraps to 2 lines in the 164 pt text width (3 or more at the larger text sizes), never truncated (no `numberOfLines`).
- VoiceOver: the same label as phone 1.

### Example check · from Welcome · when: `See an example check` on Welcome · phone 4 · `design/04-light.png`, `design/04-dark.png`
Top to bottom, in VoiceOver's reading order:
- Back · `IconButton` `back`, solid, 44 · VoiceOver "Back" (`common.back`) · tap: back to Welcome (unchanged). The bar beside it is empty (this isn't a step).
- Kit's name · `StylistMessage showHeader` · "Kit" (`common.who`) · `stylistWho`, `ink3` · hidden from VoiceOver (as today).
- Kit's intro · `StylistMessage` · "Here's an example check. This is what you'll get." (spec OS2; changes `onb.example.intro`, today "Here's a real check. This is what you'll get.") · VoiceOver reads the text.
- Drawn bubble · **new** `DrawnOutfitBubble` (see New parts), right-aligned in the photo bubble's place · PhotoBubble's frame exactly: width 135 (`size.photoBubbleWidth`), padding 4, fill `me`, radii 21/21/6 tail/21 · inside, a 127 × 172 tile, `surface2`, inner radii 17/17/4/17, with the drawn outfit in its **before** state (chunky sneakers) laid out by StandingOutfit's rules at width 127 (piece 53: jacket 42 at left 2, top 21; sweater 53 at 37, 13; trousers 53 at 37, 66; shoes 61 at 33, 109) · caption row in the frame: "Everyday" (`onb.welcome.cardOccasion`) left, "Example" (`onb.example.time`) right, `photoCaption`, `onMe` at 90%, gap 4 (PhotoBubble's row as today: in 109 pt the two words nearly touch, as they do on today's photo bubble) · VoiceOver: one image element, "Drawn example outfit, Everyday: Charcoal denim jacket, White sweater, Grey drawstring trousers, Grey chunky sneakers." (**NEW** `onb.example.a11yOutfit`: `Drawn example outfit, {occasion}: {pieces}.`, the pieces in the reading's order, each named by Closet's `baseName`) · tap: nothing.
- Result card · `KCard` (radius 26), sections 16 × 20 · one VoiceOver element, label "Example fit check. Everyday. Score 7.5 out of 10, Put together. Good base. Swapping one piece gets you to 8.0." (`onb.example.a11y`, unchanged) · its parts, unchanged from today:
  - `TagLine` · "Example · Full" (`onb.example.tag`) · "Everyday".
  - `ScoreBlock` · "7.5" + "/10" · "Put together" · verdict "Good base. Swapping one piece gets you to 8.0." (engine summary) · tap: opens or closes the math (phone 6).
  - `Seam`, then `FixRow` 1 · "Swap the chunky sneakers for low-profile sneakers" · "Raises Shoes to 8 · free if you own one" · gain "→ 8.0" in `accent` (`card.gainTo`; copper, score movement).
  - `TipLine` · lead "Next level" (`card.nextLevel`, copper) · "Clean chunky sneakers lift Shoes to 7.5. Not enough to move the score yet." (engine).
  - `Seam`, then `TextLink` · "Why 7.5?" (`card.why`) · tap: opens the math in place (phone 6).
- Caption · `KText` `footnote` `ink3`, padding 0 4 · "A drawn example, scored by the same code as your photos. Nothing was sent." (spec OS2; changes `onb.example.note`, today "A real photo, scored by the same code as yours. Nothing was sent.") · phone 5.
- Dock · `KButton` primary 50 · "Get started" (`onb.welcome.start`) · top hairline `line`, padding 8 / 16, bottom max(safe area, 16) · tap: saves step `looks`, pushes Looks (unchanged).
- Nothing is sent, saved or counted (OS2.2, unchanged: the result is computed on the phone).
- **Motion and haptics:** none. The bubble is still (the swap plays only on Welcome).
- **Dark:** token swap; `me` bubble, `surface2` tile and flats in `dark`.
- **Largest text:** phone 10.

### Example check · scrolled to the end · when: he scrolls the screen of phone 4 · phone 5 · `design/05-light.png`, `design/05-dark.png`
The same screen scrolled to the bottom: the fix, "Why 7.5?" and the new caption above the docked `Get started`. Nothing else is new.

### Example check · the math open · when: `Why 7.5?` or a tap on the score · phone 6 · `design/06-light.png`, `design/06-dark.png`
- The link reads "Hide the math" (`onb.example.whyHide`) and closes it again.
- `PartsBreakdown` under the card at the thread's width, unchanged: the strip (Proportions 8.5 · Fit 7.0 · Color 7.0 · Shoes 6.5, the most to gain, marked with the ink up arrow and the raised cell · Style 7.5; one VoiceOver element, `stripLabel`), then one group per part with its rows (Proportions 30% 8.5, "A short denim jacket over full legs: a clean, strong shape" +1.5; Fit 15% 7.0, "Nothing moved it" ±0, with its note …), then the average, the condition row and the total 7.5. All from the engine for the drawn outfit's reading. The frame shows the top of it.
- **Motion:** as today (appears in place, no animation).

### Example check · as a sheet · when: "See an example" after setup (when fit checks aren't on yet) · phone 7 · `design/07-light.png`, `design/07-dark.png`
Same content as phone 4, with today's sheet chrome:
- Close · `IconButton` `close`, top right · VoiceOver "Close" (`common.close`) · tap: closes the sheet.
- Dock · "Check my own fit" (`onb.example.ctaOwn`) · tap: closes the sheet, then opens the agreement as a sheet (unchanged).
- The native sheet grabber and swipe down to close (unchanged).

### Largest text · Welcome · phone 8 (top) · phone 9 (the end) · `design/08-*.png`, `design/09-*.png`
At AX5 (largeTitle 60 / 72, body 53 / 64, subheadline 49 / 59, caption 40 / 48; numerals capped at 1.6×; button text capped at 2×, 34 pt):
- The after state from the first frame, no animation (OS1).
- Everything is in the one scroll view, stacked: the drawing (smaller: about 250 pt tall, centred, jacket 72, sweater 92, trousers 92, shoes 104), then the card, then the wordmark, headline, body and buttons.
- **The card shows at accessibility sizes** (today it's hidden there). Full width (left/right 24), padding 12 × 14. Its rows stack: "Fit check" over "Everyday" (the tag row wraps), in sentence case with no tracking, because `MonoLabel` is sentence case at accessibility sizes (`KText.tsx`, `typography.ts`); then the numeral (83 pt) over "Sharp", then the fix's words on three lines at 40 pt. Nothing truncates.
- Phone 8 ends on the wordmark and the start of the headline. Headline and body wrap (phone 9 shows from "Without trying" down; above it is "Look put together."). Buttons grow to fit their 34 pt text and wrap if they must.
- VoiceOver order and labels unchanged.

### Largest text · Example check · phone 10 · `design/10-light.png`, `design/10-dark.png`
- Kit's intro wraps at 53 pt.
- The drawn bubble keeps its 135 × 180 size (a drawing, like a photo). Its caption moves under it as "Everyday · Example" (`dayStamp` role, `ink2`), right-aligned in PhotoBubble's below-caption wrapper (`maxWidth: '88%'`, about 326 pt, gap 4; unchanged), so at 44 pt it wraps to two lines: "Everyday ·" / "Example". The frame shows the first line; the second is under the dock until he scrolls.
- The card follows with today's AX layout (ScoreBlock stacks number over word; FixRow puts the gain under the text). `Get started` grows to its 34 pt text.

### Small phone · Welcome on open · when: as phone 1, on a 375 × 667 iPhone SE, accounts off · phone 11 · `design/11-light.png`, `design/11-dark.png`
As phone 1, laid out by "How Welcome fits every phone": status bar 20 pt (home-button phone), k = 0.74 (drawing 158 × 240, top 44, left 12), card top 96, bottom block with bottom padding 20 (no home indicator: max(0, 10) + 10). The body wraps to two lines at 327 pt. The drawing ends at least 24 pt above the wordmark; its drawn right edge (about 159 pt) stays left of the card (167 pt). Nothing scrolls.

### Small phone · Welcome after the fix · phone 12 · `design/12-light.png`, `design/12-dark.png`
Phone 11 once the swap has played (and with Reduce Motion): white low-profile sneakers, 8.0, Sharp, the fix on two lines. The card grows down by one line from its fixed top and still clears the drawing and the wordmark.

### 390 × 844 with accounts on · Welcome after the fix · phone 13 · `design/13-light.png`, `design/13-dark.png`
iPhone 12–14 and 16e size, once sign-in exists (`useAccountsOn()`), so `I already have an account` (`TextLink`, ink2, 44 pt row, centred) is under the ghost button. k = 0.82 (the width decides), the drawing top 100, the card top 168. The drawing sits centred in the space above the wordmark, nothing overlaps, and the page doesn't scroll.

## Words
Every string he reads in this task.
- "Fit check" · `onb.welcome.cardTag` (unchanged)
- "Everyday" · `onb.welcome.cardOccasion` (unchanged)
- "Full check" · `onb.welcome.cardDetail` (unchanged; before state only)
- "Put together", "Sharp" · `scoreWordLabel` (engine)
- "7.5", "8.0", and the counting tenths · engine, `displayScore`
- "Swap the chunky sneakers for low-profile sneakers" · the engine's top fix (`Fix.copy`), never typed in
- "Look put together.\nWithout trying\ntoo hard." · `onb.welcome.title` (unchanged)
- "Send a fit. Get a score out of 10 and the two or three moves that raise it." · `onb.welcome.body` (unchanged)
- "Get started" · `onb.welcome.start` (unchanged)
- "See an example check" · `onb.welcome.example` (unchanged)
- "I already have an account" · `onb.welcome.haveAccount` (unchanged; only with accounts)
- "Example fit check. {occasion}. {before} out of 10, {beforeWord}. One fix: {fix}. {after} out of 10, {afterWord}." · spec OS1, as **new key** `onb.welcome.cardA11y` (replaces today's inline label)
- "Kit" · `common.who` (unchanged)
- "Here's an example check. This is what you'll get." · spec OS2 (`onb.example.intro`, changed). This key lives in `en.generated.ts`, which is generated from `handoff/02-screens.md` §5 ("Don't edit"): the change goes into 02's copy deck and the file is regenerated (or the key is overridden in `en.ts`). It is not edited by hand.
- "Everyday" / "Example" · `onb.welcome.cardOccasion` / `onb.example.time` (unchanged)
- "Drawn example outfit, {occasion}: {pieces}." · **NEW** `onb.example.a11yOutfit` (VoiceOver only): the founder's call, asked on its own under Open questions. Piece names from Closet's `baseName` ("Charcoal denim jacket, White sweater, Grey drawstring trousers, Grey chunky sneakers").
- "Example · Full" · `onb.example.tag` (unchanged)
- "Good base. Swapping one piece gets you to 8.0." · engine summary
- "Raises Shoes to 8 · free if you own one" · engine fix detail
- "→ {score}" · `card.gainTo` · "Next level" · `card.nextLevel` · "Clean chunky sneakers lift Shoes to 7.5. Not enough to move the score yet." · engine
- "Why {score}?" · `card.why` · "Hide the math" · `onb.example.whyHide` (unchanged)
- The math's labels and rows · `PartsBreakdown` and the engine (unchanged)
- "A drawn example, scored by the same code as your photos. Nothing was sent." · spec OS2 (`onb.example.note`, changed)
- "Check my own fit" · `onb.example.ctaOwn` · "Close" · `common.close` · "Back" · `common.back` (unchanged)
- "Example fit check. {occasion}. Score {score} out of 10, {word}. {summary}" · `onb.example.a11y` (unchanged)

## New parts
- **`DrawnOutfit`** (the spec's "drawn-outfit view built on `flats.ts`"): draws a reading's garments in body order with the layer at the side, by `artSpec` + `renderFlat` (`GarmentArt`), at a given width, with or without the `surface2` tile, and with an optional cross-fade of one piece (Welcome's swap). Why not `StandingOutfit`: it takes `ClosetItemRow`s from his closet and always draws the tile; this one takes a bundled reading (and the fixed reading after the fix), so Welcome and the Example check draw from the same reading the score comes from. It should share StandingOutfit's layout numbers, not copy them.
- **`DrawnOutfitBubble`**: PhotoBubble's frame, caption row and AX caption-below rule around a `DrawnOutfit` tile instead of `NeckDownPhoto`. Why not `PhotoBubble`: it only takes an image source. Simplest build: let PhotoBubble take children in the photo's place.
- **`Numeral` `tabular` prop** (`fontVariant: ['tabular-nums']`), for the count-up, so "Put together" doesn't move sideways on every tenth. If Archivo's static cut has no tabular figures, `Numeral` instead gets a `minWidth` from the widest digits in the range (the width of "8.8" at that size). Why: `Numeral` has no such option today.
- The mini card's detail line moves under the score row, and its tag row wraps at AX sizes: changes to Welcome's own card, not new components.
- No new tokens.

## Checked by the designer
- **HIG:** Launch / onboarding (get people to content fast; no splash-like delay): the motion never blocks a tap; `Get started` works from the first frame. Motion (purposeful, brief, respects Reduce Motion): about 2 s, once, none with Reduce Motion. Status bar follows the appearance. Typography (Dynamic Type to AX5, nothing truncated): pass, phones 8–10. Layout (adapt to every supported size): pass by the rule in "How Welcome fits every phone", drawn at 375 × 667 (phones 11–12), 390 × 844 with accounts on (phone 13) and 402 × 874. Accessibility (decorative images hidden, one element per card): pass.
- **§C14:** the first screen states the value and the main action at once: pass at the default text sizes, on every phone from 375 × 667 up (unchanged headline, `Get started` above the fold). At AX sizes `Get started` is about two screens down (see Open questions). One primary action per screen: pass. Back always available on pushed screens: pass (Back, X). No dead ends: pass. 44 pt hit areas: pass (buttons 50 / 44, circles 44). Text contrast 4.5:1: pass (ink, ink2, ink3 on bg and surface per 03 §2.1; onMe on me). Dark mode from tokens: pass. Reduce Motion: pass. Nothing preselected / no consent asked here: not applicable.
- **Design system:** only 03 tokens and existing components (`KCard`, `MonoLabel`, `Numeral`, `KText`, `WovenLabel`, `KButton`, `TextLink`, `StylistMessage`, `TagLine`, `ScoreBlock`, `FixRow`, `TipLine`, `Seam`, `PartsBreakdown`, `IconButton`), plus the two new parts above.
- **Hard lines:** no face, body, skin or person anywhere: the photo is gone from both screens and the drawing is garments only. No emoji, ranks or streaks. Copper only on "→ 8.0" and "Next level" (score movement and the tip lead, as today). Same reading, same score: every number comes from the engine on the bundled reading.

## Open questions for the founder
- **The new VoiceOver words for the drawn bubble** (`onb.example.a11yOutfit`): "Drawn example outfit, Everyday: Charcoal denim jacket, White sweater, Grey drawstring trousers, Grey chunky sneakers." · recommended: yes, as written. Today's bubble says "Your outfit photo…", which would be false for a drawing, and naming the pieces gives a VoiceOver user the outfit the card is talking about. · other: shorter, "Drawn example outfit, Everyday." (no pieces).
- **The charcoal jacket on the dark background** is 2.28:1 (1.81:1 on the bubble's dark tile), under 03 §2.2's 3:1 for shapes that carry meaning. Closet draws it the same way. · recommended: keep Closet's rule for now. On Welcome the drawing is decorative (hidden from VoiceOver), in the bubble the label names the jacket, and its copper stitching and buttons still show it. · other: raise the dark halo threshold app-wide (`HALO_LUM` 0.05 → about 0.1) in its own small Closet task, so charcoal and dark navy pieces get the faint rim everywhere, here included.
- **At the largest text sizes, `Get started` is about two screens down** (the drawing about 250 pt, the card about 410 pt, then the headline). · recommended: keep the drawing at AX sizes. The card's words ("swap the chunky sneakers…") point at it, and the spec draws an outfit in the photo's place. · other: at AX sizes drop the drawing and keep only the card (VoiceOver is unchanged either way, since the drawing is hidden from it).
- **Does 8.0 land in ink or copper?** · recommended: ink. The card is a score, and 03 says the score is a number and a word in ink. The count-up already shows the movement, and Reduce Motion's still frame should look the same as the end of the animation. · other: copper for the after numeral, like a re-check's new score.
- **What sits under the score before the swap?** · recommended: today's "Full check", so the first frame looks finished and the line has something to change into. · other: nothing until the fix appears (the card grows by two lines at the swap).
- **The outfit:** · recommended: today's s14 reading (jacket, white sweater, grey drawstring trousers, chunky sneakers; 7.5 → 8.0 by one shoe swap). Its numbers are known and tested, and only the reading is kept, not the photo. · other: a new reading written for Welcome (a plainer tee-and-jeans outfit). That needs its own engine run and could land on a fix that doesn't swap a visible piece.

## Out of scope
- Looks, About you, the agreement, Restore, Stylist's offer card (OS3–OS5): T39.
- The `I already have an account` row's behaviour (sign-in, T41).
- Any person's photo (spec non-goal).

## Design check (critic)
Written by the critic, round by round.

### Round 1 (Nov 9) · verdict: **doesn't match** (3 blockers)
Read: CLAUDE.md, `specs/onboarding-screens.md` OS1–OS2, this file, all 20 PNGs, `design.html`, 03 (§2, §3.3, §4.4, §9), `tokens.ts`, §C14, `12_ios26-metrics.md`, the pro-rules pre-delivery checklist, `WelcomeScreen.tsx`, `ExampleCheckScreen.tsx`, `welcomeExample.ts`, `exampleCheck.ts`, `StandingOutfit.tsx`, `flats.ts`, `Chat.tsx` (PhotoBubble, StylistMessage), `KText.tsx`, `typography.ts`, `Numeral.tsx`, `en.ts` / `en.generated.ts`. PNGs are 804 px wide, so 2 px = 1 pt. The engine numbers (7.5 → 8.0, the fix and tip lines, the math rows) were **not re-run** by the critic (the Mac had under 200 MB free); the planner's test confirms them (OS1.2).

**What passes.** Every state the spec implies is drawn (before, mid-swap, after, Reduce Motion = after, Example from Welcome, scrolled, math open, sheet, AX5 for both screens). Every word traces to the spec, an existing key, or is flagged NEW. Text contrast from `tokens.ts` (the frames use the fixed tokens): ink3 on surface 5.41 / 5.87, ink3 on bg 4.91 / 6.51, ink2 on surface 6.46 / 7.21, accent on surface 5.71 / 7.21, onMe at 90% on me 9.66 / 8.50 (light / dark). Hit areas: buttons 50 / 44, circles 44. Back, X and swipe-down on every pushed screen and sheet. Reduce Motion and the AX sizes skip the animation. No face, body, skin, emoji, rank or streak; copper only on "→ 8.0" and "Next level".

**Blockers**
1. **The smaller supported iPhones aren't designed, and the fixed positions break there.** Phones 1–3 · the drawing (absolute, top 94, art down to about 418 pt) and the card (right 20, width 188). Deployment target is iOS 26.0 (`app.config.ts`), which includes 375-pt phones (iPhone SE 2nd/3rd gen 375 × 667, 12 mini / 13 mini 375 × 812). Measured from phone 1: the trousers' drawn right edge is at 172.5 pt. At 375 wide the card's left edge is 375 − 20 − 188 = **167 pt: it covers the trousers by 5.5 pt** (and the 214-pt drawing box by 61 pt). At 375 × 667 the bottom block (wordmark, 3-line title, body wrapping to 3 lines at 327 pt, both buttons, bottom 20) is about 381 pt, so the wordmark would start near **286 pt, under the card (234–366) and the trousers**, unless the page scrolls; DESIGN.md doesn't say which. With accounts on (`I already have an account`, +44 pt), even a 390 × 844 phone puts the wordmark (≈ 416 pt) on the shoes (to ≈ 418). Rule: HIG Layout (adapt to every supported screen size); pro-rules pre-delivery checklist "Tested on 375px (small phone)". **Fix:** say how Welcome adapts: the drawing and card in the scroll view's top (or the scroll's top padding = the drawing's bottom + 16), so a short phone scrolls instead of overlapping; the drawing scaled with the width so its right edge stays at least 8 pt left of the card (or the card's width from the screen width); and add one frame pair at 375 × 667 (phone 1 and phone 3).
2. **DESIGN.md says the dark pieces get the night rim; the frames (and `flats.ts`) draw none for this jacket.** Phones 1–7 dark · the charcoal denim jacket. Its fill `#4A4D55` has relative luminance 0.074, above `HALO_LUM` 0.05 in `flats.ts`, so `renderFlat` draws no halo; the light and dark SVGs in `design.html` differ only in shading opacity. Measured: the jacket's fill is **2.28:1 on dark `bg`** (Welcome) and **1.81:1 on dark `surface2`** (the Example bubble, which is a VoiceOver image naming the jacket), and its edge stroke is darker still. Rule: frames and DESIGN.md must agree (the planner copies this file word for word); 03 §2.2 (3:1 where the shape carries meaning). **Fix (pick one):** correct the sentence to "no rim: the jacket is above the halo threshold, as in Closet" and accept it as the founder's call; or give `DrawnOutfit` the dark halo for pieces under a higher luminance (about 0.1) and redraw the dark frames.
3. **Phone 8 draws the card's tag row in spaced capitals at AX5; `MonoLabel` is sentence case there.** Phone 8 (both themes) shows "FIT CHECK" / "EVERYDAY" in uppercase with tracking. `KText.tsx` line 72 uppercases a mono label only when `MONO_UPPERCASE_AT_NORMAL_SIZES && !theme.isAccessibilitySize` (`typography.ts` 138–143: "still sentence case at AX sizes"). The build will show "Fit check" / "Everyday", which build review would score as different words. Rule: frames and DESIGN.md agree (DESIGN.md names `MonoLabel`). **Fix:** redraw phone 8's tag row as "Fit check" over "Everyday", sentence case, no tracking.

**Polish**
- Phone 2 can't happen on its own timeline. It shows the shoes half cross-faded with the numeral at 7.8, but the timeline ends the shoe fade at 1000 ms and reaches 7.8 at about 1200 ms (5 steps over 900–1500 ms); the figcaption says "about 1.1 s". Show 7.6 or 7.7 with the fade, or stretch the fade to about 1200 ms.
- "Tabular figures so it doesn't shift": `Numeral` has no tabular option (`Numeral.tsx` props: size, face, color, fixedSize, trimDescender, strikethrough, stat, style, accessible). If Archivo's digits are proportional, "Put together" moves sideways on every tenth. List the `Numeral` change (a `tabular` prop, `fontVariant: ['tabular-nums']`) under New parts, or fix the numeral box's width.
- `onb.example.intro` is in `en.generated.ts`, generated from `handoff/02-screens.md` §5 ("Don't edit"). Say that the change goes into 02's copy deck and gets regenerated (or is overridden in `en.ts`), so the planner doesn't edit the generated file.
- The mini card's fixed 188 pt width at xLarge–xxxLarge (not AX, so the row stays side by side) isn't drawn. `WelcomeScreen.tsx` notes a fixed width clipped the score before (#276). Say the word wraps (no `numberOfLines`) and the card grows downward.
- Off the 4-pt grid: the drawing's left inset 14 and the jacket's top 26. The jacket's drawn left edge lands at 27.5 pt against the text column's 24 pt (3.5 pt off).
- Phone 10: the caption under the bubble runs 358 pt wide (23 → 381 pt). PhotoBubble's below-caption wrapper is `maxWidth: '88%'` (about 326 pt), so "Everyday · Example" will wrap to 2 lines in the build.

**Suggestions (the founder's call, never blocking)**
- At AX5, `Get started` sits about two screens down (drawing about 250 pt, card about 410 pt, then the title). The "§C14 … `Get started` above the fold: pass" line holds only at default sizes. Option: at AX sizes, drop the drawing and keep the card (the spec needs only the card's after state).
- On a Pro Max (440 × 956) the drawing stays at the left while the card moves right, with about 170 pt of empty band between the shoes (≈ 418) and the wordmark (≈ 589). Anchoring the drawing to the bottom block (or centring the pair) would keep them together.
- Put the new VoiceOver line `onb.example.a11yOutfit` ("Drawn example outfit, {occasion}: {pieces}.") under Open questions, so the founder approves those words explicitly rather than inside the whole design.
- In the 127-pt bubble tile the drawing sits left of centre (art spans about 7–90 pt of 127, leaving about 37 pt empty on the right). That's StandingOutfit's rule; centring the group would look more deliberate.

### Round 2 (Nov 9) · verdict: **matches** (no blockers)
Re-read: Changes → Round 2, the revised States ("How Welcome fits every phone", phones 1–3, 8, 10–13), Words, New parts, Checked by the designer, Open questions. Read PNGs 01–03, 08, 10, 11, 12 (light and dark) and 13. The PNGs are 2 px per pt. Engine numbers still not re-run by the critic (OS1.2's test covers them).

**Round 1 blockers**
1. **Small phones: fixed.** k = min(1, (W − 228)/198, k_h), floored at 0.6. I checked the arithmetic: 402 → 0.879, 375 → 0.742, 390 → 0.818, 440 → 1.0. The drawn right edge, 12 + 198k, stays ≥ 8 pt left of the card's left edge (W − 208) on every width. Measured in the frames:

   | Phone | Shoes' drawn right edge | Card's left edge | Gap | Drawing ends | Wordmark | Clearance |
   |---|---|---|---|---|---|---|
   | Phone 1, 402 × 874 | 186 pt | 195 pt | 9 pt | 418 pt | 490 pt | 72 pt |
   | Phone 11, 375 × 667 | 158.5 pt | 168 pt | 9.5 pt | 284 pt (box) | 307.5 pt | 23.5 pt |
   | Phone 13, 390 × 844, accounts on | 174.5 pt | 183 pt | 8.5 pt | 365 pt | 415 pt | 50 pt |

   - **Phone 11:** the body wraps to two lines as stated, and "See an example check" ends at 647 pt with 20 pt below it. k_h works out to (667 − 20 − 48 − 359) / 324 = 0.74, matching DESIGN.md.
   - **Phone 13:** "I already have an account" is a 44-pt row; nothing overlaps and nothing scrolls.
   - **Stated positions:** the card and drawing tops in DESIGN.md (208/132, 96/44, 168/100) agree with the centring rule within 2 pt.
   - **Worst case:** 375 × 667 with accounts on lands exactly on the 0.6 floor ((667 − 20 − 48 − 403) / 324 = 0.60), so the stated scroll fallback covers anything shorter.
2. **The night rim: fixed.** The sentence now says no rim, with the 0.074 vs 0.05 reasoning and the 2.28:1 / 1.81:1 numbers. Raising `HALO_LUM` is put to the founder as an open question. The frames, DESIGN.md and `flats.ts` now agree.
3. **Phone 8's tag row: fixed.** It now reads "Fit check" over "Everyday", sentence case, no tracking, matching `KText`'s rule at AX sizes.

**Round 1 polish, all addressed**
- **Phone 2:** now 7.7 at 1100 ms, with the shoe fade running 600–1200 ms. Consistent.
- **`Numeral`:** the `tabular` prop is listed under New parts, with a minWidth fallback.
- **`onb.example.intro`:** its `en.generated.ts` / 02 source is noted.
- **Card at xLarge–xxxLarge:** wraps and grows downward.
- **4-pt grid:** inset 12, jacket top 24, and the jacket's drawn edge measures 24 pt on phone 1 (22.5 on phone 11).
- **Phone 10:** the caption wraps inside the 88% wrapper ("Everyday ·" / "Example").

**Polish (new)**
- The rule doesn't say how tall the hero group is. k_h uses only the drawing's 324k, and the card is centred on the drawing's middle. At xLarge–xxxLarge on a short phone (k floored at 0.6, so the drawing is about 194 pt tall), the after-state card can be taller than the drawing (estimated 200–240 pt with the wrapped word and a 3–4-line fix). It would then reach past the group's edges, eating into the 24 pt above the drawing and the 24 pt gap to the wordmark. Fix: make the hero group's height max(324k, the card's after-state height) in both the centring and the k_h / scroll rule.

**Suggestions:** none new. The round 1 suggestions are now open questions for the founder, or the designer declined them with a reason (the bubble tile's centring, the Pro Max frame), which is fine.

## Changes
- **Round 2** · from the critic, round 1:
  - **Blocker 1 (small phones):** Welcome is now one scroll view with the hero group and the bottom block, and the drawing scales by k = min(1, (W − 228)/198, the height fit), floored at 0.6 ("How Welcome fits every phone"). Added phones 11–12 (375 × 667, on open and after) and 13 (390 × 844 with accounts on). Phones 1–3 redrawn at k = 0.88, drawing top 132, card top 208.
  - **Blocker 2 (the night rim):** the sentence was wrong and is corrected. **The rule is unchanged**: no rim on this jacket, as in Closet. Raising the halo threshold is offered to the founder under Open questions. No dark frames changed for this.
  - **Blocker 3 (phone 8):** the tag row is "Fit check" over "Everyday" in sentence case with no tracking; redrawn.
  - Polish: the shoe fade runs 600–1200 ms and phone 2 shows 7.7 (redrawn); `Numeral`'s `tabular` prop is listed under New parts; the `en.generated.ts` source of `onb.example.intro` is noted; the card at xLarge–xxxLarge wraps and grows downward; the drawing's left inset is 12 and the jacket's top 24 (on the grid, drawn edge in line with the text); phone 10's caption now wraps in the 88% wrapper (redrawn).
  - Open questions: added `onb.example.a11yOutfit` on its own, the jacket contrast, and `Get started` at AX sizes. The §C14 "above the fold" line now says it holds at the default sizes only.
  - Not changed: the bubble tile's drawing stays left of centre (StandingOutfit's rule, the critic's suggestion), and Pro Max is covered by the centring rule without a frame.
