# T74 · Design: The piece questions, one card at a time

**Approved by the founder:** 2026-11-10 in chat (round 2 frames, all 9 phones)

**From:** `plan.md` → T74 · **Spec:** `specs/closet-beta.md` → CB2 → CB2.1–CB2.10 · **Frames:** `tasks/T74/design.html` (open with `preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/T74/design.html`) · **PNGs:** `tasks/T74/design/`

Approved, this file is the contract: the planner copies the UI inventory from it word for word, and the critic holds the build to it. It changes only with the founder's yes.

## What he sees
Closet's To confirm card holds one question at a time, with "2 of 5" in its tag line. He answers with the same buttons as today, or moves on with `Skip ›` (at the end of the answers' row) or a sideways swipe, which never answer. The pictures are smaller (110 pt tall), so the card is about 312 pt tall against today's about 378.

## Where it lives
- **Closet tab, the root screen** (`app/src/app/(tabs)/closet/index.tsx`, after T73: no Pieces | Outfits switch). Top to bottom: the large title "Closet" with the + (AddMenu) in the bar, the "Waiting to be read" row when scans wait (unchanged, not drawn), **the To confirm card**, then his pieces head to toe (Jackets and layers · Tops · Bottoms · Shoes, each a tag line with its count over a 3-column grid). All on one ScrollView, which stays the screen's first child.
- **How he gets there:** the Closet tab; or "1 more in Closet" / "{n} more in Closet" from a score card (unchanged).
- **How he leaves:** another tab, a tap on a piece, or the fit card's sheet. Nothing on the card is modal.
- **The deck** (spec): every open "Is this your …?" question, newest first, then the one "How do your … fit?" question if there is one, last. `total` is all of them; `n` is the shown card's place in the deck as it is now. Which card shows is screen state only.
- **What "Closet opens" means.** The tab's screen stays mounted when he switches tabs or opens a piece and comes back (Expo Router keeps it), and the shown card stays as it was. After a fresh launch (the screen mounts again), the deck starts on card 1. Skipped questions are still open either way.
- **A new question arriving while a card shows** (a scan from Closet's +, or a fit check): the shown card stays on screen and only the numbers change (a newer question goes in front, so "2 of 5" becomes "3 of 6"). Nothing slides. A question that leaves the same way works like CB2.10 (under phone 4).

## States
In the order he meets them. Every card uses the same parts; phone 1 lists them in full, later phones list only what differs.

### First of several · 1 of 5 · when: Closet opens with 4 open questions and a fit question (CB2.1) · phone 1 · `design/01-light.png`, `design/01-dark.png`
Top to bottom, in VoiceOver's reading order:
- Bar · native large title "Closet" (`en.ts` `tab.closet`) and the + (`AddMenu`), unchanged.
- Card · `KCard` (radius 26, 1 pt `line` border, `shadow.card` in light, none in dark) → `KCardSection` (padding 20 / 16). One card only; never a second card or a peek of the next.
- Tag line · `TagLine` · left "To confirm" (`en.ts` `closet.confirm.tag`), right "1 of 5" (spec `{n} of {total}`) · mono label 12/16 500, spaced capitals at normal sizes ("TO CONFIRM", "1 OF 5"), left `ink3`, right `ink2` · margin below 12 · **hidden from VoiceOver** (its words are in the question's label, next line).
- Question · `KText` `subheadline` 600 `ink` · "Are these your khaki chinos?" (`closet.q.areThese` / `closet.q.isThis`, as today) · header trait · VoiceOver: "Question 1 of 5. Are these your khaki chinos? The color looked a little different. This photo and your khaki chinos are shown side by side." (spec `Question {n} of {total}.`, then `closet.q.a11y`, as today) · **VoiceOver action "Skip"** (`tap.skip`; `accessibilityActions` `[{ name: 'skip', label: 'Skip' }]`): swiping up or down on the question offers "Skip", which does what the Skip button does, so he can move through the deck without swiping past every answer. Only when the card shows a Skip button (not on a lone "Is this your …?" question).
- Reason · `KText` `footnote` `ink2` · "The color looked a little different." (`closet.q.why.*`, as today) · gap 3 · part of the question's label, not its own stop.
- Score line · `KText` `footnote` `ink3` · "Your score stays the same either way." (`closet.q.scoreSame`) · only while he has answered fewer than 3 (`SCORE_LINE_UNTIL`), as today · VoiceOver reads it on its own, after the question.
- Pictures · margin top 10 · two `View`s side by side, gap 12, **left-aligned**, each 96 wide × **110 tall** (today 150 × 172; the 1.15 ratio is kept), radius 14 · hidden from VoiceOver (the question's label describes them).
  - "This photo" · `SightingCrop` (the piece's box fitted and centred, outlined 2 pt `ink2`, the rest dimmed; nothing above his neck ever shows) · caption `KText` `caption` `ink2` centred, gap 4 · "This photo" (`item.dup.thisPhoto`).
  - "In your closet" · its best earlier photo as a `SightingCrop`, else `ClosetTile` (drawing at 0.7) · caption "In your closet" (`item.dup.inCloset`).
- Answers row · `ChipFlow` (label = the question), margin top 4 so the chips sit 10 pt under the captions, items centred on the row · `Chip` small (32 tall, 44 hit), subheadline 400, 8 pt apart:
  - "Yes, same one" (`item.dup.yes`) · VoiceOver: "Yes, same one", button · tap: saves `same` (next state).
  - "No, a new one" (`item.dup.no`) · tap: saves `new`.
- Skip · `TextLink` "Skip" (`tap.skip`) with a trailing `Icon` `next` 13 pt semibold `ink`, gap 4, scaling with the text · `textLink` role (subheadline 600 `ink`) · **at the trailing end of the answers' row** (founder, Nov 10; spec CB2 item 5), pushed to the end by the row's free space, at least 8 pt after the last chip.
  - **Its target is its own box**, not the row: 44 tall, the words and chevron (48 pt at the default size) plus 8 pt of hit slop on each side, so 64 × 44 pt. The slop on its leading side ends at the chip's edge (the 8 pt gap), so the two never overlap; on its trailing side it reaches into the card's padding. The rest of the row does nothing.
  - **When it can't fit** (a third answer, the largest text sizes, or a narrow phone, below), it takes its own row under the answers, trailing, 44 tall, with margin bottom −12 so its target uses the card's bottom padding (the visible gap under it stays 16).
  - **Not shown** when the deck is a single "Is this your …?" question (phone 6).
  - VoiceOver: "Skip", button (no hint: it says what it does) · tap: shows the next card, saves nothing; on the last card it shows card 1.
- Pieces · unchanged: `PieceSections` 16 pt under the card.
- **Swipe:** a horizontal pan on the card (the whole card, not only the pictures) moves to the next card (finger to the left) or the previous one (finger to the right), wrapping at both ends (DECISIONS-LOG #432). It never answers. Phone 3 draws it.
  - **Start rule:** the pan starts once the finger has moved 12 pt sideways (`activeOffsetX` ±12) and fails if it moves 10 pt up or down first (`failOffsetY` ±10), so a vertical drag always scrolls Closet. A pan that starts on a chip or on Skip cancels that press: lifting the finger after a swipe never answers or skips.
  - **Commit rule:** past a third of the card's width, or a flick faster than 500 pt/s, moves to the next or previous card; anything less springs back (a spring, about 200 ms).
  - With a single card (either kind), a swipe springs back.
- **Motion and haptics:** none on arrival. The changes are under the next phones.
- **Dark:** token swap only (card `surface` #171A23 on `bg` #0C0E14, no shadow; the crop's dimming is the same in both, as `SightingCrop` already does).
- **Largest text:** phones 8 and 9.

### A middle card, with a runner-up · 2 of 5 · when: Skip or a swipe left on card 1 (CB2.4) · phone 2 · `design/02-light.png`, `design/02-dark.png`
Same parts as phone 1, with:
- Tag line right "2 of 5".
- Question "Is this your brown crewneck?" · reason "They look a lot alike." (`closet.q.why.similar`) · VoiceOver: "Question 2 of 5. Is this your brown crewneck? They look a lot alike. This photo and your brown crewneck are shown side by side."
- A third answer · `Chip` small "It's my black crewneck" (`item.dup.runnerUp`) · wraps to its own row (the flow wraps, row gap from the chips' own hit padding) · tap: saves `runnerUp`.
- Skip · on its own row under the three answers, trailing (spec: it doesn't share a row with a third answer, so it never reads as a fourth). This card is about 388 pt tall; today's card with a runner-up would be about 422.
- Card 1 stays open; nothing was saved.
- **Motion and haptics:** on Skip, card 1 slides out to the leading side and card 2 slides in from the trailing side together, 16 pt apart, 240 ms ease-out; no haptic. The card's height eases to the new card's over the same 240 ms and the pieces below move with it. **Reduce Motion:** the cards cross-fade (150 ms) and the height jumps (CB2.9).
- **VoiceOver focus** moves to the new card's question ("Question 2 of 5. …").

### Mid-swipe · 2 of 5 to 3 of 5 · when: his finger drags card 2 to the left · phone 3 · `design/03-light.png`, `design/03-dark.png`
- Card 2 follows his finger sideways; card 3 ("Is this your white tee?" · "I could only see part of it under your beige overshirt." `closet.q.why.halfSeen`) follows 16 pt behind it from the trailing side, top-aligned. The cards slide under the screen's edges (not clipped at the gutter).
- **Let go** past a third of the card's width, or with a flick: card 3 settles (the rest of the 240 ms move). Short of that: card 2 springs back. Swiping right does the same toward the previous card; on card 1 it shows the last card (wraps, DECISIONS-LOG #432).
- While dragging, the card section keeps card 2's height; when card 3 settles it eases to card 3's.
- **Reduce Motion:** the card doesn't follow the finger; a swipe past the same distance cross-fades to the next card (150 ms).
- **Haptics:** none on a swipe (a swipe saves nothing; only an answer gets the haptic).
- **VoiceOver:** never needs the swipe (VoiceOver's own swipes move between elements). Skip and the answers are buttons (CB2.8).

### Right after an answer · 2 of 4 · when: he tapped "It's my black crewneck" on card 2 of 5 (CB2.2) · phone 4 · `design/04-light.png`, `design/04-dark.png`
- The answer saves through the closet service, as today (`fitCheck.answerDuplicate`, `answerWithUndo`).
- A light haptic (`impactAsync(Light)`) on the tap.
- Card 2 slides out to the leading side and the next open question slides in from the trailing side (240 ms; cross-fade with Reduce Motion). The tag line reads "2 of 4": the answered question left the deck, so the next one takes its place.
- Toast · `ToastHost`, as today · "Saved as your black crewneck." (`item.dup.saidSame`; "Kept as a new piece." `item.dup.saidNew` after No) with the countdown ring and "Undo" (`common.undo`) · 100 pt off the bottom, above the tab bar · VoiceOver: "Saved as your black crewneck. Undo, for 10 seconds." (`toast.undoFor`, as today).
- **Undo** (CB2.3) · the question comes back in its place and shows as the card on screen with the count it had ("2 of 5"), sliding in from the leading side (it's going back; cross-fade with Reduce Motion). VoiceOver focus moves to its question.
- **VoiceOver order after an answer:** he hears the toast's line, then focus moves to the new card's question. Neither cuts the other off (the focus move waits for the announcement).
- **Answered elsewhere** (CB2.10, not drawn): a question answered on the score card or in the Added sheet leaves the deck; the tag line's count updates in place. If it was the card on screen, the next one shows with the same slide; if not, the card stays and only the numbers change.

### The fit card, last in the deck · 5 of 5 · when: he reaches the end of the deck (CB2.5) · phone 5 · `design/05-light.png`, `design/05-dark.png`
- Tag line "To confirm" · "5 of 5", as on every card.
- `FitQuestion`, its own look and size as today: `Pressable` row with the `ClosetTile` drawing 64 × 64 (radius 18), "How do your mid-wash jeans fit?" (`closet.unsure.askLeg` / `askFit`) `callout` 600, "Seen as slim and as wide." (`closet.unsure.seen`) `footnote` `ink3`, chevron `next` 13 `ink3` · VoiceOver: "Question 5 of 5. How do your mid-wash jeans fit? Seen as slim and as wide.", button, hint "Opens the choices. Your scores stay the same." (`closet.unsure.a11y.hint`) · tap: opens its Leg or Fit sheet, as today; a pick settles it and it leaves the deck (then the deck shows card 1, or the card goes if it was the only one).
- Skip · on its own row under the fit row, trailing, the same `Skip ›` box as the other cards (*change from today:* it sat at the left, under the question). The card has no answers' row to share. · tap: keeps today's meaning (§18, `FIT_SKIP_KEY`): the card leaves the deck until a newer photo disagrees, and card 1 shows ("1 of 4"). No toast, as today.
- **Two chevrons, on purpose:** the row's chevron (13 pt `ink3`) is the disclosure mark for "opens a sheet", as today; Skip's (13 pt `ink`) is part of the link. Same size; the color difference is intended, so the sheet's mark reads as quieter than the action.
- A swipe left from here shows card 1 and **doesn't** skip the fit card (only `Skip` does); it stays in the deck.
- **Motion, haptics, dark:** as phone 2. A Skip here gets no haptic.

### One question only · 1 of 1 · when: the deck holds a single question · phone 6 · `design/06-light.png`, `design/06-dark.png`
- Tag line "1 of 1" (spec). Question "Is this your beige overshirt?" · "The fit looked a little different in this photo." (`closet.q.why.fit`). He has answered 3 or more before, so no score line.
- **No Skip** (founder, Nov 10; spec CB2 item 5, CB2.4): with one "Is this your …?" question it would do nothing. No VoiceOver "Skip" action either. The answers' row ends after "No, a new one"; the card is about 291 pt.
- A swipe springs back (no other card to show).
- If the one card is the fit card, Skip hides it (§18) and the card goes away, with no toast, as after the last answer.

### After the last answer · when: he answers the only card (CB2.6) · phone 7 · `design/07-light.png`, `design/07-dark.png`
- He tapped "No, a new one". The card goes away (no "All set" screen): it fades out (150 ms) while the pieces move up into its place (240 ms). **Reduce Motion:** it fades and the pieces jump.
- The light haptic and the toast "Kept as a new piece." with Undo, as phone 4. The new piece now shows as a tile of its own (first in Jackets and layers, which reads 4), as today.
- **Undo** brings the card back as "1 of 1" (it fades in and pushes the pieces down; it jumps with Reduce Motion), and the extra tile leaves.
- **VoiceOver focus** moves to the first section title ("Jackets and layers. 4", `TagLine`'s own label), where the card was, so it doesn't drop to the top of the screen.

### Largest text · the top of the card · phone 8 · `design/08-light.png`, `design/08-dark.png`
Phone 2 at AX5 (subheadline 49/59, footnote 44/52, caption and mono 40/48), scrolled so the card's top sits under the bar (the large title has collapsed into the bar, as iOS draws it):
- Tag line stacks: "To confirm" over "2 of 5", sentence case (as `TagLine` already does at accessibility sizes).
- The question wraps to 3 lines, the reason to 2, the score line to 3.
- The pictures stack (spec, as today), each still 96 × 110, left-aligned; each caption runs the card's full width under its picture (not the picture's 96 pt, which would break "closet" mid-word).

### Largest text · the answers · phone 9 · `design/09-light.png`, `design/09-dark.png`
- The same card scrolled further: each answer on its own row, its words wrapping inside the chip ("It's my black / crewneck"), never cut; Skip on its own row under them (large text), trailing, at 49 pt with its chevron scaled the same (about 42 pt), gap 12. Then the pieces in 2 columns, as today.
- Every answer and Skip is at least 44 × 44 pt at every size (CB2.8).

### States that don't apply
- **Empty:** no open questions and no fit question: no card, as today.
- **Loading, slow, offline, error:** none. The deck reads the phone's own store; an answer saves on the phone. An answer that doesn't land (the check or the question is gone) shows no toast and the card stays, as `answerWithUndo` does today.
- **First time:** the same card. The score line is the first-time help, as today.
- **The must-not case:** a swipe that answers. A swipe only ever moves between cards; nothing is saved without a tap on an answer.

## Words
Every string he reads or hears in this task.
- "To confirm" · `en.ts` `closet.confirm.tag`
- "{n} of {total}" ("1 of 5", "2 of 5", "2 of 4", "5 of 5", "1 of 1") · spec, CB2 New words
- "Question {n} of {total}." (VoiceOver) · spec, CB2 New words
- "Are these your {item}?" / "Is this your {item}?" · `closet.q.areThese` / `closet.q.isThis`
- The reasons: "The color looked a little different." · "They look a lot alike." · "I could only see part of it under your {layer}." · "The fit looked a little different in this photo." · `closet.q.why.color`, `.similar`, `.halfSeen`, `.fit` (and the other `closet.q.why.*`, unchanged)
- "Your score stays the same either way." · `closet.q.scoreSame`
- "{question} {reason} This photo and your {item} are shown side by side." (VoiceOver) · `closet.q.a11y`
- "This photo" · "In your closet" · `item.dup.thisPhoto`, `item.dup.inCloset`
- "Yes, same one" · "No, a new one" · "It's my {item}" · `item.dup.yes`, `item.dup.no`, `item.dup.runnerUp`
- "Skip" · `tap.skip` (the button, and the VoiceOver action's name; the "›" is the `next` icon, not text)
- "Saved as your {item}." · "Kept as a new piece." · `item.dup.saidSame`, `item.dup.saidNew`
- "Undo" · "{text} Undo, for {n} seconds." · `common.undo`, `toast.undoFor`
- "How do your {item} fit?" / "How does your {item} fit?" · "Seen as {a} and as {b}." · "Opens the choices. Your scores stay the same." · `closet.unsure.askLeg`, `.askFit`, `.seen`, `.a11y.hint`
- Context, unchanged: "Closet" (`tab.closet`), the section titles, piece names, the four tab names.
- **No NEW words** beyond the spec's two.

## New parts
- **The deck** (`features/closet/`, the spec's "new deck"): holds the open questions and the fit card, which one shows, the swipe and the slide or cross-fade between cards. It reuses `KCard`, `TagLine`, `DuplicateQuestion`, `FitQuestion`, `Chip`, `TextLink`, `Icon`. Nothing in the design system pages cards today (the closest is a horizontal paging ScrollView, which can't wrap from the last card to the first, keep one card's height, or cross-fade under Reduce Motion).
- Changes to existing parts:
  - `TextLink` (`KButton.tsx`): a new optional `trailingIcon` prop (a symbol name), drawn after the title as `Icon` 13 pt semibold in the link's color, gap 4, scaling with the text, hidden from VoiceOver (the label stays the title). Skip is `<TextLink title={t('tap.skip')} trailingIcon="next" compact />` with 8 pt horizontal hit slop (`compact` already gives 12 above and below) inside a 44 pt-tall box. TextLink takes no icon today.
  - `DuplicateQuestion`: pictures 96 × 110 (today up to 150 × 172), left-aligned; at accessibility sizes the captions run full width; the question's label starts with "Question {n} of {total}."; the question carries the "Skip" accessibility action when Skip shows; Skip at the trailing end of the answers' row (its own row when it can't fit); no Skip on a lone question.
  - `FitQuestion`: its label starts with "Question {n} of {total}."; its row carries the same "Skip" accessibility action; Skip moves to the trailing row.
  - `TagLine` on this card: hidden from VoiceOver (its props already allow a label; it needs a way to be hidden, or the card passes the tag as plain `MonoLabel`s).
  - `toConfirm.ts`: the 3-at-a-time cap (`TO_CONFIRM_MAX`) goes; the card shows one.

## Checked by the designer
- **HIG:** Gestures (a swipe is a shortcut with a visible button for the same thing, Skip; the swipe only starts on a sideways drag so scrolling still works: pass) · Accessibility (VoiceOver never needs the swipe, focus moves to the new question, Dynamic Type to AX5, Reduce Motion cross-fades: pass) · Feedback (a light haptic and a toast with Undo on an answer: pass) · Page controls: not used; "2 of 5" says where he is in words, which also reads at AX5.
- **§C14:** tab bar for navigation only: unchanged · never a tab as an action: pass · settings behind a gear: n/a · 44 pt targets: pass (chips 32 visible with 44 hit; Skip 64 × 44; the fit row 64+) · 4.5:1 text: pass (`ink` on `surface` 17.9:1 light, 15.0:1 dark; `ink2` #585E70 on white 6.5:1, #A1A7B5 on #171A23 7.2:1; `ink3` #646A7A on white 5.4:1, #9096A5 on #171A23 5.9:1; the section titles' `ink3` on `bg` 4.9:1 light, 6.5:1 dark) · Dynamic Type at the largest sizes: pass (phones 8 and 9, nothing cut) · feedback within ~0.1 s: pass (haptic on the tap, the slide starts at once) · a clear way out: n/a (no modal) · familiar patterns: pass (one card at a time with "n of total", like a review queue; the answers and toast are today's) · progressive disclosure: pass (one question at a time) · notifications, accounts: n/a · privacy: pass (crops never show above the neck).
- **Design system:** only `tokens.ts` colors and existing components (`KCard`, `KCardSection`, `TagLine`, `KText`, `Chip`, `ChipFlow`, `TextLink`, `Icon`, `SightingCrop`, `ClosetTile`, `ToastHost`); one new part, the deck, built from them. Spacing on the 4-pt grid except today's 3 and 10 gaps inside the question, kept as they are.
- **Hard lines:** no face or body: the photo crops start below the neck and paint anything above a top's box solid (as `SightingCrop` does); nothing is said about his body. No emoji, ranks or streaks. Copper only on the active Closet tab (03 §1 allows); the card has none. The fit card's words are about the clothes ("How do your mid-wash jeans fit?"), as today.
- **Card height** (measured in the frames, 402 pt wide): phone 1 is 312 pt against today's 378 pt (your Simulator shot), 66 pt or 17% shorter (CB2.7); with a runner-up (phone 2) 388 against about 422 for today's card with three answers; a lone question (phone 6) 291; the fit card 158. The pictures are 110 pt (≤ 120). It's 312, not the critic's estimated ~303: the answers' row stays 44 tall (the chips' own hit padding), and the card keeps its 16 pt bottom padding.
- **A 375 pt-wide phone** (iPhone SE, 13 mini; measured with the same page at 375): the card's inner width is 301 pt. Yes / No / Skip need 119.7 + 8 + 118.2 + 8 + 48 = 301.9 pt, so Skip drops to its own row by about 1 pt and the card is 356 pt (still under today's 378). At 390 pt and wider (every current iPhone) it fits on the row with 14 pt to spare. Bold Text widens the chips, and Skip then drops to its own row by the same rule. Nothing is cut at either width; the pictures (96 + 12 + 96 = 204) fit everywhere.
- **Not checked:** the web preview and the Simulator weren't opened (the Mac had about 100–200 MB of memory free). Today's chrome is taken from the code (`closet/index.tsx`, `_layout.tsx`, `DuplicateQuestion.tsx`, `FitQuestion.tsx`, `ToastHost.tsx`) and the founder's Simulator shot of today's card. The frames use mockup photos (profile unknown) and drawn tiles.

## Open questions for the founder
None open. Answered on Nov 10 and written in above:
- Picture shape: tall, 96 × 110 (the recommended pick; the critic agreed).
- Skip on a lone "Is this your …?" question: hidden, a swipe springs back; a lone fit card keeps it ("Hide it (Recommended)"; spec CB2 item 5, CB2.4).
- Swipe right on card 1: shows the last card (DECISIONS-LOG #432).
- Card size: Skip on the answers' row ("Skip on the answers row (Recommended)"; spec CB2 item 5).
- Not added: a VoiceOver hint on the fit card's Skip (it would need new words).

## Out of scope
- The same one-card deck in the Added sheet (spec, Later).
- Fewer look-alike questions in the matcher (spec, Later; scoring lane).
- The score card's own question and its "1 more in Closet" line: unchanged.
- The fit card's Leg or Fit sheet: unchanged.

## Design check (critic)
Written by the critic, round by round.

### Round 1 · 2026-11-09 · verdict: matches (no blockers)
Read: CLAUDE.md, `specs/closet-beta.md` CB2 and CB2.1–CB2.10, this file, all 18 PNGs, `design.html` (the `.t74-*` rules), 03, `tokens.ts`, §C14, `pro-rules.md`, `DuplicateQuestion.tsx`, `FitQuestion.tsx`, `toConfirm.ts`, `Chip.tsx`, `MonoLabel.tsx` (`TagLine`), `KButton.tsx` (`TextLink`), `closet/index.tsx`, `ToastHost.tsx`, and today's shot (`scratchpad/shots/today-confirm-1.png`). No Simulator (memory). Frames measured at 2x (402 pt wide).

**Checked and passing**
- Contrast, recomputed from `tokens.ts`: `ink` on `surface` 17.9:1 light / 15.0:1 dark; `ink2` 6.5 / 7.2; `ink3` 5.4 / 5.9; `ink3` on `bg` 4.9 / 6.5. All ≥ 4.5:1. The chip's `line` border is 1.3:1, but the chip's words carry its meaning (as today).
- Hit areas: `Chip` small pads `(size.hit − 32) / 2` = 6 pt above and below, so 44 pt (code). Skip row 44 tall (frame: 453–497 pt on phone 1). Fit row ≥ 64.
- Picture height 110 pt (≤ 120, CB2.7); card on phone 1 measures 341 pt (159–500.5).
- Every word traces to `en.ts` or the spec's two new strings; no NEW words. No emoji, ranks or streaks. Copper only on the active Closet tab. No face in any crop (phones 1–4, 6 show clothes and hands only).
- Dark frames are token swaps; nothing lost. AX5 (phones 8, 9): nothing cut, chips wrap inside, Skip ≥ 44.
- States: 1 of 5, middle with runner-up, mid-swipe, after an answer + Undo, fit card last, 1 of 1, after the last answer, AX5 top and bottom; the must-not case (a swipe that answers) is stated. No new package: `react-native-gesture-handler` 2.32 and `react-native-reanimated` 4.5.1 are installed.

**Blockers:** none.

**Polish**
1. **Skip's parts aren't listed as a change.** Where: phone 1 → Skip; "New parts". `TextLink` (`KButton.tsx`) takes only a title, no icon, so "`TextLink` + `Icon` `next`" needs either a trailing-icon prop on `TextLink` or a new small part. Fix: add it under "Changes to existing parts" so the planner doesn't invent one.
2. **"The whole row is the 44 × ≥ 52 pt target" reads two ways.** Where: phone 1 → Skip. If the full-width row is tappable, a tap in the blank 270 pt left of "Skip" skips. Fix: say the target is the link's own box (44 tall, the words + chevron + padding, ≥ 52 wide), trailing; the rest of the row does nothing.
3. **Two look-alike chevrons, 54 pt apart, in one column.** Where: phone 5, x ≈ 359 pt: the row's `next` 13 pt `ink3` (opens the sheet) at y ≈ 235 and Skip's `next` 12 pt `ink` at y ≈ 289. Same glyph, two meanings, sizes 1 pt apart. Fix: keep both (the spec asks for `Skip ›`) but make them one size, or note the difference as intended.
4. **Skip's text–chevron gap is 3 pt** (`.t74-skip` gap 3px), off the 4-pt grid and unlike `TagLine`'s own chevron gap of 4. Fix: 4.
5. **"Today about 391 pt" is too high.** Today's shot (3x, 1170 px wide) measures the card at 668–1804 px = about 378 pt. The new card is about 37 pt (10%) shorter, not about 50. CB2.7 still passes; the founder should see the honest number.
6. **VoiceOver words for phone 7's focus target.** DESIGN.md says "Jackets and layers, 4"; `TagLine` speaks `"{left}. {right}"`, so it says "Jackets and layers. 4". Fix: write what the code says.
7. **Two undrawn moments the builder will guess at.** (a) What "Closet opens" means: Expo Router keeps tab screens mounted, so switching tabs or going to a piece page and back doesn't remount. Recommend: keep the shown card while the screen stays mounted; card 1 on a fresh launch. (b) A new question arriving while a card is shown (he scans from Closet's +): recommend the shown card stays and its numbers update, as CB2.10 does for a removal. Fix: one line each under "States".
8. **The swipe's start rule needs numbers** for the planner (pro-rules: no nested tap/drag conflicts). Fix: e.g. pan starts after 12 pt sideways, fails after 10 pt vertical; a pan that starts on a chip cancels the chip's press.
9. **Not drawn at 375 pt wide** (pro-rules process). By arithmetic it fits: inner width 303 pt; pictures 96 + 12 + 96 = 204; the two chips about 118 + 8 + 118 = 244. Note it as checked by arithmetic.

**Suggestions (the founder's call)**
- **Put Skip on the answers' row when it fits** (trailing, same row as "No, a new one"; under them only when the chips wrap). It saves about 38 pt, so the card goes from about 341 to about 303 pt (20% under today's instead of 10%). That's a spec change ("`Skip ›`, trailing, under the answers"), so it's his yes.
- **A VoiceOver action "Skip" on the question.** Focus moves to each new question (spec), so skipping three cards means swiping down past the reason, score line and 2–3 chips each time. A custom action named "Skip" (existing word) skips from the question itself.
- **A hint on the fit card's Skip.** There it hides the card until a newer photo disagrees, unlike every other Skip. A VoiceOver hint would need NEW words, so his call.

**The three open questions**
- **Picture shape:** agree with tall 96 × 110. The crop is there to compare the piece's outline; wide frames would shrink trousers to a strip. Left-aligned under left-aligned text follows HIG's leading alignment.
- **Skip on 1 of 1:** agree with hiding it on a lone "Is this your …?" card (swipe springs back). A control that looks tappable but does nothing visible breaks pro-rules ("Controls that look tappable but do nothing") and HIG feedback. Keep it on a lone fit card, where it does something. It also saves about 38 pt. Needs his yes: it differs from the spec's layout.
- **Swipe right on card 1:** agree with wrapping to the last card. Forward already wraps (spec), "n of total" says where he is, and wrapping one way while springing back the other reads like a bug.

### Round 2 · 2026-11-10 · verdict: matches (no blockers)
Read: the spec change (d1ba28be, CB2 item 5 and CB2.4), DECISIONS-LOG #432, this file in full (Changes → Round 2), the 16 re-shot PNGs (phones 1–6, 8, 9, light and dark), the `.t74-*` rules in `design.html`, `ChipFlow` (`Chip.tsx`). Phone 7 is unchanged from round 1. No Simulator (memory).

**Round 1 polish 1–9: all folded in.** Checked each: `TextLink` `trailingIcon` is listed (1); Skip's target is its own 64 × 44 box (2); both fit-card chevrons are 13 pt, the colour difference written as intended (3); gap 4 (4); 378 pt (5); "Jackets and layers. 4" (6); "Closet opens" and a new question arriving are under Where it lives (7); start and commit rules with numbers (8); 375 pt measured (9). The VoiceOver "Skip" action is added, only where Skip shows.

**Checked and passing**
- **The spec as changed:** Skip trails the Yes / No row (phones 1, 4); it gets its own row with a third answer (phone 2), at AX5 (phone 9) and on the fit card (phone 5); there's no Skip and no Skip action on a lone question (phone 6). A swipe back on card 1 wraps (phone 3 text, #432).
- **Measured at 2x:** phone 1's card is 159–469 pt, so 310 pt (DESIGN.md says 312: within 2 pt, an HTML rendering difference). Phone 6 is 289 (says 291). Phone 5 is about 156 (says 158). Under every chip row the visible gap is 22.5 pt: the chip's 6 pt hit padding plus the card's 16. It's the same on phones 1 and 6, so the row keeps its rhythm with or without Skip.
- **Skip on the row:** "Skip" starts 35 pt after "No, a new one" on phone 1 (x 282.5 → 317.5), so its 8 pt hit slop never meets the chip. Its trailing edge sits at 361.5 against the 365 inner edge (the chevron's side bearing).
- **Contrast** is unchanged from round 1 (no new colours), so it passes in light and dark. Hit areas: Skip is 64 × 44; the chips are 44 tall (code).
- **Words:** still no NEW strings. The VoiceOver action reuses `tap.skip`.
- **Dark frames:** token swaps only; nothing lost.

**Blockers:** none.

**Polish**
1. **Skip's gap at the largest sizes is written two ways.** The `TextLink` change says "gap 4", but phone 9 says "gap 12" (`.ax .t74-skip` gap 12px). The planner copies the part spec. Fix: say whether the gap scales with the text (then 4 at default, about 13 at AX5) or stays 4, and make phone 9 match.
2. **The −12 bottom margin is wrong at accessibility sizes.** Where: phone 9, Skip row. The trick works at the default size: a 20 pt line sits in a 44 pt row, leaving 12 pt of slack. At AX5 the 59 pt line fills its 59 pt row, so the −12 eats the visible gap: Skip's words end about 11 pt above the card's edge (y ≈ 690 vs 701), not 16. Fix: apply the −12 only while the row is taller than its text (default sizes); drop it at accessibility sizes.
3. **How a narrow phone decides to wrap isn't written.** The HTML puts Skip inside the flow with `margin-left: auto`, so at 375 pt it wraps by itself. The third-answer and AX cases are fixed rules instead (a separate row with the −12 margin). Fix: one line under phone 1 saying Skip is the last child of `ChipFlow` with `marginLeft: 'auto'`, so it wraps on its own when it doesn't fit (narrow phone, Bold Text), with no −12 margin in that case; with a third answer or at accessibility sizes it's a separate row. Otherwise the builder may measure widths by hand.

**Suggestions (optional)**
- Skip now sits at a different height from card to card: on the answers' row on two-answer cards (phone 1, y ≈ 431 pt), but on its own row with a runner-up (phone 2, y ≈ 519) and on the fit card. Tapping Skip over and over means re-aiming each time. This comes with the founder's pick and the VoiceOver action covers VoiceOver users, so nothing to do now. Worth watching in the beta if testers skip a lot.

## Changes
- **Round 2** · from the founder (Nov 10): "Skip on the answers row (Recommended)" and, for 1 of 1, "Hide it (Recommended)"; picture shape stays tall; a swipe back on card 1 wraps (DECISIONS-LOG #432); and the critic's round 1 polish and VoiceOver suggestion.
  - Skip moved to the trailing end of the Yes / No row; its own row only with a third answer, at the largest sizes, or on a narrow phone. Phone 1's card is now 312 pt (was 341; today 378). Re-shot phones 1–6, 8, 9 (light and dark); phone 7 has no card and is unchanged.
  - No Skip (and no Skip action) on a lone "Is this your …?" question; a swipe springs back (phone 6, 291 pt). A lone fit card keeps Skip.
  - Swipe right on card 1 shows the last card; open questions closed.
  - Polish 1: `TextLink` gets a `trailingIcon` prop, listed under Changes to existing parts.
  - Polish 2: Skip's target is its own 64 × 44 box (48 pt of words and chevron plus 8 pt hit slop each side), not the row.
  - Polish 3: both chevrons on the fit card are 13 pt; the color difference (`ink3` vs `ink`) is noted as intended.
  - Polish 4: Skip's text–chevron gap is 4 (was 3).
  - Polish 5: today's card is 378 pt (was "about 391").
  - Polish 6: phone 7's VoiceOver target reads "Jackets and layers. 4".
  - Polish 7: "Closet opens" and a question arriving while a card shows are written under Where it lives.
  - Polish 8: the swipe's start rule (12 pt sideways, fails at 10 pt vertical, a pan cancels a chip's press) and commit rule (a third of the width, or 500 pt/s) are under phone 1.
  - Polish 9: measured at 375 pt: Skip drops to its own row by about 1 pt (card 356 pt); it fits from 390 pt up.
  - Added: a VoiceOver "Skip" action (`tap.skip`) on the question and on the fit card's row, whenever Skip shows.
  - Not added: a hint on the fit card's Skip (new words).
