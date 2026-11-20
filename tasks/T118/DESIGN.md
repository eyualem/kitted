# T118 · Design: the app tour (Closet stop, Lookbook stop, the two new example looks)

**Approved by the founder:** 2026-11-19 in chat (new looks: white tee + tan chinos + white sneakers, and navy striped hoodie + jeans + white runners; row title `Everyday`, no date; the example closet scrolls under the card)

**From:** `plan.md` → T118 · **Spec:** `specs/app-tour.md` → AT1, AT2, AT5 (AT3 is where `Skip` and `Done` go; nothing to draw) · **Frames:** `tasks/T118/design.html` (`preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/T118/design.html`) · **PNGs:** `tasks/T118/design/` · Light only.

Approved, the build follows this look and these words. It changes only with the founder's yes.

## What he sees
Right after About you he lands on the real Closet tab, full of an example closet under a small `Example` tag, with a card above the dimmed tab bar: `1 of 2`, `Next`, `Skip`. `Next` shows the real Lookbook with three example looks and a second card: `2 of 2`, `Done`, `Skip`. `Skip` (either stop) and `Done` leave for Stylist. Nothing on the tabs underneath responds.

## How it was drawn
Every drawing is Kitted's own: each piece comes from `drawnPieces` + `renderFlat` (what Closet and Welcome use), the tiles are `ClosetTile`'s (surface-2, radius 18, art at 80%, shoes on the width), the sections are Closet's (`Jackets and layers · Tops · Bottoms · Shoes`, `TagLine` with its count), the rows are Lookbook's (50 × 63 thumb, title, word, Archivo numeral). The tab bar is the shell's iOS 26 bar. The scores below are an offline run of `evaluateCheck` on each bundled reading, at Everyday with no picks, an empty closet and `firstCheck: true`, exactly how `exampleCheck()` scores Welcome's outfit: $0, no network, no AI. Welcome's own 7.5 `Put together` came out the same as the app's, so the method matches. The build recomputes them and a test checks them (AT2.2); these are not typed in.

## States
### Closet stop · when: About you's `Continue`, an 18+ band · phone 1 · `design/01-light.png`
- Large title `Closet`, the `+` as today (nothing to tap during the tour). No Pieces / Outfits switcher (it is off for the beta).
- `Example` (a gray `Pill`, left, under the title): the only tag on the screen.
- The example closet, as today's Closet sections with their counts: `Jackets and layers 1`, `Tops 3`, `Bottoms 3`, `Shoes 3`, 10 pieces in all, three to a row, each tile named under it. Welcome's pieces come first in each section (newest first).
- The tour card, just above the tab bar (12 pt gap): `KCard` with a `TagLine` `1 of 2`, the title `Your closet builds itself.` (title3, semibold), the line (subheadline, ink2), then one row: `Next` (primary, takes the width) and `Skip` (ghost, ink2, beside it). Both buttons 36 pt drawn with a 44 pt hit area.
- The tab bar is drawn but dimmed (items at 38%), `Closet` still the selected one. Under the card and bar the screen colour backs the list, so nothing peeks out between them; the list fades out over 22 pt above the card.
- The pieces drop in over about a second; the frame shows the finished state. `Next`/`Skip` work from the first frame.
- Closet's list stays scrollable under the card with room left at its end (phone 5): with the card up, only `Jackets and layers` and `Tops` are in view at first.

### Closet stop, scrolled to the end · phone 5 · `design/05-light.png`
- The same stop after he scrolls: the large title has collapsed to `Closet`, `Bottoms` and `Shoes` sit clear above the card. Nothing else changes.

### Lookbook stop · when: `Next` · phone 2 · `design/02-light.png`
- Large title `Lookbook`, `Example` pill, then one `KCard` of three real Lookbook rows: Welcome's outfit on top (`Everyday`, `Put together`, `7.5`), then `Everyday`, `Put together`, `7.5` (new look 1), then `Everyday`, `Getting there`, `6.5` (new look 2). No divider after the last row. Each thumb is the drawn outfit (the Welcome composition, scaled) on surface-2.
- Rows say `Everyday` only: no date (they are not real days). The rows aren't tappable and don't show the long-press menu.
- The card: `2 of 2`, `Every look, saved.`, its line, `Done` (primary) and `Skip`. The same place, the same dimmed bar (`Lookbook` selected). The space between the rows and the card stays empty.

### Closet stop, largest text · phone 3 · `design/03-light.png`
- Accessibility extra extra extra large (the type ramp's 53 / 49 / 40 pt, buttons capped at 2× as `KButton` does). The examples go to two columns behind the card (as Closet does at these sizes); the card is at most about 60% of the screen tall, so the title and the `Example` tag stay visible above it.
- Inside the card: `1 of 2` (sentence case at these sizes, like `TagLine`) and the title and line in a region that scrolls, with a soft fade and a scroll bar to show there is more; a hairline, then `Next` full width and `Skip` under it, pinned. They are never clipped and never scroll away. No word breaks mid-word. The Lookbook stop behaves the same (not drawn separately).

### The two new example looks · phone 4 · `design/04-light.png`
A design aid for your pick, not a screen. Welcome's outfit stays; two more, each a reading the app already bundles (no new photo, no new AI call), all neutral and everyday:
- **New 1 (my pick), reading p01b:** White tee · Tan chinos · White leather sneakers. Scores 7.5 `Put together`.
- **New 2 (my pick), reading s05:** Navy striped hoodie · Mid-wash jeans · White runners. Scores 6.5 `Getting there`.
- With Welcome's four (charcoal denim jacket, white sweater, grey drawstring trousers, grey chunky sneakers, 7.5 `Put together`) that is 10 pieces. Colours are grey, beige and navy: the closet doesn't look like one outfit.
- Other readings that fit, in case you want to swap one: **p01a** (beige overshirt, white tee, tan chinos, white leather sneakers, 8.0 `Sharp`, 4 pieces, 11 in all), **s25** (cream camp shirt, beige drawstring trousers, tan Chelsea boots, 6.5 `Getting there`), **s13** (black top, navy trousers, brown low-profile sneakers, 7.5 `Put together`). The scoring code puts the range at 6.5 to 8.0 for these readings, so a look that scores 6.5 teaches that the scores are honest.

## Words
- `1 of 2` · `Your closet builds itself.` · `Every fit you check adds its pieces here, so Kit can plan outfits from what you own.` · `Next` · `Skip` · `2 of 2` · `Every look, saved.` · `Each fit you check lands here with its score and its fix.` · `Done` · spec AT1, AT2 (word for word).
- `Example` · already in `en.ts` (`ask.card.example`, `onb.example.time`, both `Example`), reused.
- `Jackets and layers`, `Tops`, `Bottoms`, `Shoes` · `en.ts` (`closet.section.*`). Piece names ("White tee", "Tan chinos") come from `baseName`, as in Closet and Welcome. Word under each score: `scoreWordLabel`. Row title: `Everyday` (`occasion.everyday`).
- VoiceOver (spec AT5, new keys, spec words): `Tour, 1 of 2. …` · `Example closet, 10 pieces` · `Example lookbook, 3 looks`.
- **NEW: none.** Every word is the spec's or an existing string. The labels on phone 4 are for you, not the app.

## New parts
One: the tour card (a `KCard` with a `TagLine`, a title, a line and a button row, scrolling its text at the largest sizes with the buttons pinned). It is made only of design-system parts (`KCard`, `TagLine`, `KText`, `KButton`); the `Example` tag is `Pill`. No new component in the design system.

## Hard list (the designer's check)
- **44 pt:** `Next`, `Done`, `Skip` draw 36 pt tall with a 44 pt hit area (`KButton` regular); at the largest text they are taller than 44 and stack full width.
- **Contrast (tokens, light):** card title ink on surface 17.9:1; the line ink2 on surface 6.5:1; `Next` on-primary on primary 15.1:1; `Skip` ink2 on surface 6.5:1; `Example` ink2 on surface-2 5.6:1; `1 of 2` ink3 on surface 5.4:1; tile names ink2 on bg 5.9:1. The dimmed tab bar is inactive and needs no pass (spec).
- **No face, body, weight or skin:** every picture is a drawn garment; no photo anywhere, no person.
- **No emoji, ranks or streaks:** none. `1 of 2` is a step count, not progress to unlock.
- **Copper:** none used on any frame (no score moves).
- **A way out:** `Skip` is on both stops from the first frame, `Done` closes the second; both lead to Stylist. No back swipe or dead end.
- **Every state:** the normal state of each stop, the largest text, and the scrolled list are drawn. Dark mode comes from the tokens and is checked in the build's screenshots. Not drawn: Reduce Motion (it is the same frames, with the pieces already in place and a fade between tabs, as AT5 says); VoiceOver (listed above); an example that fails to score (the spec has no such state: see open question 5).

## For him
- **The one thing he came for:** to see what the app does for him before he checks a fit, in two glances. It is not a task; he can leave with one tap.
- **Elements on each stop:** Closet stop, 3 (the example, the `Example` tag, the card), plus the dimmed bar that is already there. Lookbook stop, 3 (the same).
- **A reason for each:** the example closet shows where his clothes land (AT1). The `Example` tag says it isn't his. The card says what he is looking at and the one next step (AT1.3). On the card: `1 of 2` tells him it is short (the research: 1–2 steps are the ones people finish), the title and line are the lesson, `Next`/`Done` move on, `Skip` is the way out (AT3). No dots, no swipe hint, no icon, no second line: cut.
- **Detail behind one tap:** nothing needed. There is no `Learn more`; the Lookbook rows and the pieces don't open.

## Open questions for the founder
1. **Which two new looks?** · recommended: **p01b** (white tee, tan chinos, white sneakers) and **s05** (navy striped hoodie, jeans, white runners): the most ordinary outfits, three pieces each, and none shares a colour with Welcome's grey. 10 pieces in all (the spec says "about 9"). · other: swap in **p01a** (8.0 `Sharp`, adds a layer, 11 pieces), **s25** or **s13** (see phone 4).
2. **Row title on example looks** · recommended: `Everyday` with no date (a date would be a made-up day). · other: `Everyday · Today` (a new word) or the real date, which would date the example.
3. **Can he scroll the example closet under the card?** The spec doesn't say; without it, `Bottoms` and `Shoes` are never seen (only 4 of 10 pieces show at first). · recommended: yes, it scrolls, with room left at the end (phone 5); only taps do nothing (AT3.3). · other: no scrolling, and the closet drops in from the top with the two last sections cut off.
4. **The drawing in a 50 × 63 Lookbook thumb is small** (colour blocks you can recognise, not detail; Welcome's four pieces are the smallest). · recommended: keep today's thumb size so the rows are the real rows. · other: 64 × 80 thumbs in the tour only.
5. **If an example reading ever stops scoring** (the spec has no state for it): · recommended: leave that look out and show the rest (the test in AT2.2 fails the build before it can happen). · other: skip the whole tour.

## Changes
