# UI review, Oct 15: the problem list and the redesign ideas

**What this is.** A running list of UI problems and redesign ideas from 4 read-only agents (Oct 15, DECISIONS-LOG #274), founder: "look for UI problems and just keep a list of them … how to make the UI beautiful, interactive, and instinctive", plus how the real photo behind each drawn closet tile could live inside the card. Nothing was built or changed. Every item was found in the current code (file:line, paths under `app/src/` unless they start elsewhere). Screenshots are older than some code, so the code decides. I re-checked six of the High items by hand (marked ✔).

**Built Oct 15 (#277):** §1 items 1, 2, 3, 4, 5, 9 (the piece page) and 14, the crop-privacy part of 10, and these from §2: the re-check "Tell me", the two numbers, the not-seen button order, copper on tips and the Why strip, one decimal in the strip, the Why loading title, Past chats read-only, camera speech, the morning row's chevron and Archivo, closet names mid-sentence, the VoiceOver "Top fix", the onboarding progress bar, pick-order badges and even tiles, the header hairlines, the Welcome status bar, the Lookbook score in Archivo, the ink tab. Item 10 (merge, wrong type) is still open; "Not this piece" now exists on the piece page.

**How to use it.** Check items off here as they're fixed, and add new ones. Severity: **H** breaks trust or is a dead end, **M** confusing or unpolished, **L** polish. Effort: S under half a day, M 1–2 days, L more. "(#233)" = already on the Oct 12 review list and still open.

---

## 1. Fix first: 14 items that break trust (most are small)

1. ✔ **One stray tap can lock an adult out for good.** The birth-year −/+ stepper moves one year per tap; picking 2008 then tapping + gives 2009, and "Looks right" sets the permanent under-18 block with no confirmation (it survives "Delete all my data"). Fix: no stepper on birth year (the value only opens the list), plus one confirm: "Born in 2009? Kitted is for 18 and up." `features/onboarding/BasicsScreen.tsx:46-53, 96-101` · H · S
2. ✔ **"Not quite right?" previews a score from the old rules.** The live "7.5 → 8.0" uses the v4 `score()`/`suggestFixes()`, but Save re-scores with the parts engine, so he can be shown one number and get another, and "before → after" can move when nothing changed. Fix: a preview that runs `evaluateCheck` with the check's engine, like `previewLens` (`fitcheck/service.ts:933`). `features/correct/CorrectSheet.tsx:57, 64` · H · S–M
3. ✔ **A re-check whose score dropped says "Nothing else changed."** The line is always "{word}. Nothing else changed." and starts "Layered and clean." even on a drop; the arrow is copper; the new problem is saved but never shown (the copy "New: {problem}" exists, unused); the "not seen" case hides the old score. Fix: branch on up / same / down; on a drop a neutral arrow and "New: the overshirt hides the tuck". `fitcheck/explain.ts:44-51`, `RecheckCard.tsx:111-120`, `CardParts.tsx:86-107`, `i18n/en.ts:82` · H · M
4. ✔ **The Welcome card says 8.5 "Sharp" for a photo the app scores 8.0**, and the s15 photo shows the man's mouth and beard (#48). The first screen breaks "same photo, same score" and "faces hidden". Fix: take the number from the engine and crop lower, or use our own photo (stock is also a licensing question, research-context §C15). `features/onboarding/WelcomeScreen.tsx:41, 95, 104` · H · S
5. ✔ **The closet long-press preview can show his face.** When no clean cut-out exists it crops his *unblurred* kept photo to the piece's box and shows nothing above the box, but never checks where his head is: a hood up, a scarf, or a box drawn too high shows the face. Mirror selfies also show logos backwards there and on the question card (cut-outs are flipped back; crops aren't). Fix: clamp every crop's top edge below the head prep found, and flip mirror crops. `features/closet/piecePreview.ts:44-62`, `SightingCrop.tsx`, `cropLayout.ts:13-15` · H · S
6. ✔ (#280, the Limit card (the photo is kept, "Save for tomorrow")) **The daily limit shows only after he has posed and shot.** The camera opens whatever the quota; a used check surfaces as a 5 s toast after the camera closes. The morning card's "Check my fit" button ignores `checkUsed`. Fix: gate the camera route with a limit card (resets at 4 am, the open re-check, Pro). `camera/startCheck.ts:134-135`, `app/camera.tsx:12-18`, `morning/MorningCard.tsx:195` (#233) · H · S–M
7. ✔ (#305) **A second photo while one is reading vanishes.** `busy` shows no words: the camera closes, nothing happens (the #245 symptom). The copy is ready: "Still reading your last photo. Send this one when it's done." `camera/startCheck.ts:144` (#233 item 8) · H · S
8. **"How I score" explains the old scoring** (credits, "an elevated piece") while every check is scored by five parts, and its X acts as Back. `en.generated.ts:250-255`, `why/WhySheet.tsx:34-44` (#233 item 1) · H · S
9. ✔ (#276–277) **Tapping a closet tile does nothing.** No tap action, no pressed state; the piece page is a placeholder. The grid looks tappable. `app/(tabs)/closet/index.tsx:82`, `closet/item/[id].tsx:3-5` · H · M (see §3)
10. ✔ (#280–286, #289) **Old duplicates and misreads can't be fixed.** No merge, no "this isn't mine", no "it's boots, not slides"; his real duplicates ("Washed black jeans 2", "Grey tee", "Grey slides") wait on the piece page. `added/AddedSheet.tsx:27` (`EDIT_ITEM_BUILT = false`) · H · M
11. ✔ (#280–286) **Scans go into a box nothing opens.** After "Saved for your closet" nothing appears anywhere: no count, no "3 photos waiting", no delete. The "+" is the tab's biggest button. Fix: show a "Waiting to be read · 3 photos" row, or hide "+" until reading clothes works. `features/scan/inbox.ts:53` · H · S
12. ✔ (#280–286) **A Lookbook row opens only the bare photo** (no score card, fixes, pieces, "Show in chat"), and a look with no photo opens an empty black viewer. `app/(tabs)/lookbook/index.tsx:66, 75-81`, `look/[id].tsx:5`, `PhotoViewer.tsx:34-37` · H · M
13. **Beta testers have no way to report anything.** Support, Report a wrong score, privacy policy and terms are all hidden until the 3 links exist. Fix: a temporary support email now (on the to-do list). `you/settings.tsx:61-76`, `config/links.ts` · H for the beta · S
14. ✔ (#277) **Build and fit are saved as answers he never gave.** "Average" and "Regular" are preselected, then shown on You and sent to the chat as fact ("Build: average"). Height was left blank on purpose to avoid this. Fix: start empty, add "Rather not say" (#247), send build only when he tapped it. `onboarding/basics.ts:25`, `ask/context.ts:136`, `you/profile.ts:45-50` · M–H · S

---

## 2. The full list, by screen

### Stylist and the fit check
- [ ] **The result card crowds the score.** Before the number: the Going-for line and "FIT CHECK · FULL"; below it up to ~10 blocks (advice, fixes, Next level, weather tip, closet row, closet question, finish the check, Re-check, Why / Not quite right, a re-score footnote). Dashed and solid dividers are mixed. Fix: Going-for under the score or folded into the tagline, drop "· Full", at most one tip, one divider style. `fitcheck/FitCheckCard.tsx:331-456` · M · M
- [ ] **"No quick fixes for this one." reads as a shrug** next to "Put together", and with no fix the Re-check button hides too, so the only next step is a tip. Fix: a positive verdict ("Clean base. Nothing off.") and a Next-level row he can act on. Copy is yours. `explain.ts:30`, `FitCheckCard.tsx:223, 428` · M · S
- [ ] **Copper on tips that don't move the score** ("Next level", "Smaller step", "Weather" leads, and the Why strip's highlight), against #231's "copper only when the score moves". `design-system/typography.ts:245`, `why/PartsBreakdown.tsx:52, 79` · M · S
- [ ] **A re-check win still offers "Didn't catch the change? Tell me"** right under the caught fix, and the re-check card has no Why / Not quite right. `RecheckCard.tsx:145-147` · M · S
- [ ] **Two numbers for one re-check:** the fix row says +0.75, the pill +1.0. `RecheckCard.tsx:129`, `CardParts.tsx:109` · M · S
- [ ] **The "not seen" re-check puts his own claim first:** "I did make the change" is the filled button, "Try another photo" secondary. Swap them and show was → now. `RecheckCard.tsx:135-139` · M · S
- [ ] **The five-part strip:** prints "7" next to "7.5"; "Proportions" shrinks smaller than the rest (rename "Shape", #233 item 6); the copper cell has no legend; "Nothing moved it ±0" rows are filler; cells aren't tappable. `why/partsRows.ts:60`, `PartsBreakdown.tsx:79` · M · S
- [ ] **The Why sheet loads as an empty sheet titled "How I score".** `WhySheet.tsx:31` · M · S
- [ ] **Past chats aren't read-only:** yesterday's card can still change the occasion (re-scoring an old check), answer closet questions, change Going-for. `stylist/PastChats.tsx:111-128`, `FitCheckCard.tsx:471-478` · M · S–M
- [ ] **Problems after the shot are 5 s toasts with no way forward** ("I can't find you in this photo.", "Couldn't frame this one" (#233 item 7)), in the same capsule as "Logged for today", no warning haptic, no Retake. Fix: send them back to the camera's retake panel, which already does this well. `camera/startCheck.ts:129-143`, `toast/ToastHost.tsx` · M · M
- [ ] **In Propped, the controls cover his feet:** mode switch, 88 pt shutter and side buttons take the bottom ~260 pt, so he can't see his shoes are in frame; the guide also rings the head. Fix: a thin control bar in Propped (he's 3 m away), the guide down to the bottom edge, no head ring. `camera/CameraScreen.tsx:316-317, 542-548` · M · M
- [ ] **The camera can keep talking after it closes** (no `Speech.stop` anywhere). `CameraScreen.tsx:196, 227` · M · S
- [ ] **Two flash controls at once** when it's dark (the toggle and the "Turn on flash" pill). `CameraScreen.tsx:381, 385-394` · L · S
- [ ] **The collapsed morning row doesn't look tappable** (no chevron) and its score isn't in Archivo. `morning/MorningCard.tsx:302, 346-376` · M · S
- [ ] **The full morning card has ~7 controls** (two pickers, a weather-source caption, a location row, Wear this + Swap, the link). Fold the source into the badge's VoiceOver label; one "Class · Smart casual ⌄" control. `MorningCard.tsx:136-205` · M · M
- [ ] **Chat answers:** send is disabled while streaming with no Stop; the voice line is cut to its last 34 characters; answers can't be copied. `stylist/Composer.tsx:120, 147-149`, `Chat.tsx:52` · M · S–M
- [ ] **Closet names keep a capital mid-sentence** ("Wearing your Khaki chinos lifts Style"). `packages/kitted-core/src/partsFixes.ts:412, 527` · M · S
- [ ] **Consent still says "face cropped out or blurred"** (#233 item 3). `en.generated.ts:91` · M · S
- [ ] Two names for one place: the "Earlier chats" pill and the clock ("Past chats"). `StylistScreen.tsx:289-306` · L · S
- [ ] At 3 questions left, "3 questions left today" replaces the check status in the header. `services/quota.ts:63-69` · L · S
- [ ] The reading card grows taller than the screen (pills + 4 stages + Going-for), so his photo scrolls off. `stylist/cards/ReadingCard.tsx:68-100` · L · S
- [ ] Blank flashes while the camera opens (consent loading, permission "asking"). `app/camera.tsx:17`, `CameraScreen.tsx:336-345` · L · S
- [ ] The camera-off screen sits left-aligned. `CameraScreen.tsx:466-482` · L · S
- [ ] VoiceOver reads "Top fix: No quick fixes for this one, ." `FitCheckCard.tsx:300-307` · L · S
- [ ] The photo bubble repeats the occasion the card shows. `MessageView.tsx:97` · L · S
- [ ] Error toasts look like success toasts (no icon, no warning haptic, no swipe away). `toast/ToastHost.tsx` · L · S

### Closet
- [x] (#307) **The approved Outfits half isn't built** (Pieces | Outfits, "Try next", "Your go-tos", "16 pieces · 24 outfits"). The core counter `rotation()` exists but nothing calls it, and it uses the old v4 rules and counts layers (against #84). Rebuild it on the parts engine with layers off before showing a count. `closet/index.tsx`, `packages/kitted-core/src/rotation.ts:9-13, 82-86` · H · L
- [x] (#307, Goes with and the count; next buy still to do) **No "Goes with", no outfit count per piece, no next buy** (all specced, #87). Start with Goes with on the piece page. · M · M
- [ ] **The grid has no order:** shirts, boots, jeans and sneakers mixed, newest first. Fix: shelves in body order (Layers · Tops · Bottoms · Shoes) with counts, dark to light inside each, filter chips at 12+ (the Oct 14 mockup `screenshots/theme-round2/v2-3-closet.png`). `closet/index.tsx:40` · M · S
- [ ] **Open questions bury the clothes:** each is ~400 pt and they all stack on top; the cap of 3 (#111) isn't enforced. Fix: one row "2 pieces to confirm ›" opening a one-at-a-time sheet. `closet/index.tsx:67-79`, `closet/service.ts:1060-1071` · M · S
- [ ] **An answered question vanishes with no confirmation or Undo**, and a merged tile disappears without animation. Fix: "Saved as your khaki chinos." with Undo, a success haptic, a layout animation. `service.ts:1066` · M · S
- [ ] **Tiles don't use the measured color,** so two grey hoodies, or charcoal and grey, draw the same (the agreed answer to #141's look-alike caveat). `closet/profile.ts:222-225` · M · S
- [ ] **Look-alike drawings:** navy chinos vs dark jeans, black sweatshirt vs navy crewneck share one shape; the brand word ("NEW BALANCE") is unreadable at tile size. Stronger cues per type (chino slant pockets, sweatshirt ribbing); brand word only on big tiles and the piece page. `closet/flats.ts` · M · M
- [ ] **Long-press is the only way to act, and Closet and Lookbook do it differently** (a native menu with preview vs a bottom action sheet). HIG: a context menu shouldn't be the only path. `closet/PieceMenu.ios.tsx:55-77`, `lookbook/index.tsx:99-118` · M · S
- [ ] **The empty and thin Closet:** empty offers only "Check my fit" while "+" offers scanning; with 2 pieces nothing says what's next. Build #88's checklist ("Add shoes and you'd have 4 outfits"). `closet/index.tsx:60-63` · M · S
- [ ] **The "Added to your closet" sheet promises fixes it can't make** ("Fix anything I got wrong."), and its only action is an unlabeled curved-arrow icon. Until editing exists: "Remove anything that isn't yours." and a text button "Not mine". `en.generated.ts:468`, `AddedSheet.tsx:191-221` · M · S
- [ ] Shoes look small next to tops (one 0.8 scale for every type). `ClosetTile.tsx:46` · L · S
- [ ] White pieces fade into light tiles (the halo is dark mode only). `flats.ts:91-103` · L · S
- [ ] Dashed tiles don't say "No photo yet". `PieceMenu.ios.tsx:60` · L · S
- [ ] No haptics or motion anywhere in Closet or Lookbook. · L · S
- [ ] The "+" menu slides up from the bottom; iOS 26 uses a pull-down from the button. `closet/_layout.tsx:11-18` · L · S
- [ ] The Closet question: "This photo" has no date; Yes/No are small chips while the Stylist quick question uses two equal buttons. `DuplicateQuestion.tsx:76` · L · S
- [ ] Three words for removing ("Undo" / "Add back" with a line-through, "Remove from Closet", "Remove from Lookbook"). Settle on Remove / Add back. · L · S
- [ ] At the largest text sizes long names cut off and 2-line names break the row rhythm. `closet/index.tsx:56`, `ClosetTile.tsx:50` · L · S
- [ ] The grid will slow at 100+ pieces (every change re-reads all sightings and checks a file per tile; shows nothing while loading). `closet/index.tsx:42-49` · L · M

### Lookbook
- [ ] The score isn't in Archivo. `lookbook/index.tsx:90` · L · S
- [ ] No chevron, no "Partial" label, no month headers; one long card. `lookbook/index.tsx:57-92` · L · S
- [ ] A removed look is gone once the toast ends. `lookbook/index.tsx:114` · L · S

### Onboarding
- [ ] **The progress bar never fills:** 6 segments, the walk ends at 4 and jumps into Stylist. Show 4 until the rest exist. `onboarding/OnboardingNav.tsx:7` · M · S
- [ ] **Pick order isn't shown** on the style tiles (a check mark only), though order matters and You numbers 1·2·3. `LookTile.tsx:90-96` · M · S
- [ ] **Basics:** "Looks right" is disabled with no reason; "so the advice fits your frame" is body talk; the tape-measure figure with his height in copper is the measured-body look #246–247 dropped; "This never changes your score" is missing. `BasicsScreen.tsx:113`, `Silhouette.tsx:24-34` · M · M
- [ ] The "Something else?" box may open under the keyboard. `PickLooksScreen.tsx:84, 105-120` · M · S (check on the phone)
- [ ] Consent shown from the Privacy switch or a typed question still says "Last thing before your first check" / "Agree & check my fit". `ConsentScreen.tsx:133, 140` · M · S
- [ ] Consent's footer points to "You → Privacy" (it's You → gear → Privacy & data), and the questions bullet leaves out the style picks, height and build (D2). `en.generated.ts:93, 102` · M · S
- [ ] Style tiles are uneven heights and shift when selected (border 1 → 2.5 pt). `LookTile.tsx:75` · L · S
- [ ] Height can't be cleared once set. `basics.ts:32-35` · L · S
- [ ] The birth-year list starts at 2016 and opens at the top (scroll ~16 rows). Open near 2004, nothing preselected. `basics.ts:56-58` · L · S
- [ ] Welcome: a white status bar over the light photo in dark mode; "FIT CHECK" and "EVERYDAY" run together. `app/_layout.tsx:140`, `WelcomeScreen.tsx:99-102` · L · S
- [ ] Consent's text is cut hard under the buttons (no fade), buttons 5 pt apart. `ConsentScreen.tsx:139, 153` · L · S

### You and Settings
- [x] (#306) **Style profile drops edits on a Back swipe** with no prompt, while Settings saves instantly. Autosave it. `you/profile.tsx:125` · M · S
- [ ] **Privacy is three taps deep;** "See what I send", the best trust feature, sits under You → gear → Privacy & data. The approved mockup puts Privacy first. `you/settings.tsx:44-48` · M · M
- [ ] **Notification switches look live but do nothing** (nothing is scheduled until P6), under "That's all I send." Hide or say "arrives in the next update". `you/notifications.tsx:34-41` · M · S
- [ ] **You's "Today" card can't be acted on** ("1 free check today", no button). Add "Check my fit". `you/index.tsx:112-156` · M · S
- [ ] VoiceOver reads the birth-year row as just "2005". `you/profile.tsx:74-78, 182` · M · S
- [ ] A 4th style tap in the editor does nothing (onboarding buzzes and shakes). `you/profile.tsx:97-100` · L · S
- [ ] With no profile You has no way into the editor. `you/index.tsx:32` · L · S
- [ ] "Manage subscription" appears 3 times, also for free users. `you/settings.tsx:55-58`, `plan.tsx:49-53`, `privacy.tsx:129-137` · L · S
- [ ] "Score my fits" has VoiceOver hints written but never passed. `you/privacy.tsx:118` · L · S
- [ ] The paywall is a placeholder (correctly hidden) and its drafted title reads as unlimited (#233 item 4). `app/paywall/index.tsx`, `en.generated.ts:659` · M · L

### App-wide
- [ ] **Four menu patterns:** native context menu (Closet), bottom action sheets (Lookbook, facts, Closet +), and the custom MorphPicker (Settings). One system: native context menus for every long-press, native menus for pickers; MorphPicker only on the morning card. · M · M
- [ ] **Grouped lists don't match:** You's cards radius 26 with full dividers, Settings 20 with inset dividers, Style profile its own 52 pt rows. One GroupedList component. `you/FactRows.tsx:82`, `SettingsList.tsx:40-43`, `you/profile.tsx:148-200` · M · S
- [ ] **Every press is just a fade to 0.82**, no spring, no haptic on commit actions (Agree, save, delete). A small press scale plus light haptics. `design-system/tokens.ts:278`, `KButton.tsx:72` · L · M
- [ ] Delete buttons look different everywhere (a local `DANGER`, a grey "Delete", system red). A `danger` token. `you/privacy.tsx:21`, `sheets/fact/[id].tsx:105` · L · S
- [ ] A hairline under pushed nav bars (Stylist removed its own). `you/_layout.tsx:26-32` · L · S
- [ ] The selected tab is copper, the most-seen copper in the app. Ink instead? (your taste call) `(tabs)/_layout.tsx:21` · L · S
- [ ] Two text greys are nearly the same (ink2 #585E70, ink3 #646A7A); outline button borders are ~1.2:1, under 3:1 (WCAG 1.4.11). `design-system/tokens.ts:56-59` · L · S
- [ ] The rest of your 8 copy fixes (#233): "two or three moves", "Couldn't frame this one.", "resets 4 am" vs "Resets 4 am". · M · S

---

## 3. Your real photo inside the closet card

### What exists today
- **The drawing** comes from the closet call's words (type, shade, details, brand word, pattern) and is drawn by code, the same every time (#141, #143).
- **The photos live on each sighting**, not on the piece: which check it came from (and that check's kept photo, unblurred, `Documents/photos/`), the piece's box in the photo, the measured color, and a cut-out (`Documents/closet/<sha>-garment-<i>.png`, made on the phone from the face-hidden copy, heads removed, mirror flipped back) with a quality score (`data/types.ts:417-443`; `KittedMeasure.swift:439-444`). The piece's own `photoFile` / `cropFile` columns are never filled.
- **What he sees:** tap does nothing. Long-press (#244) shows a preview, picking the best cut-out (quality ≥ 0.6), else his photo cropped to the box, else a bigger drawing, with Rename and Remove from Closet (`piecePreview.ts:44-62`). Note this already shows cut-outs, which #141 said he wouldn't see.
- **Gaps:** no piece page; no choosing, hiding or adding a photo; the face risk in item 5 above; and **no removal deletes any file:** removed pieces, removed looks and undone pieces keep their photos and cut-outs on the phone until "Delete all photos" (`service.ts:972-976, 1024-1044`). The face-hidden detail copies are deleted after a week, so a cut-out can't be re-made later. The two privacy wipes do work (`privacy/wipe.ts:50-101`).

### Three ways to do it (ranked)
**A. A piece page: the drawing on top, his photos underneath (recommended; M–L, about 3–4 days, JS only, no migration).**
1. **Tap a tile** and it grows into the piece page (the iOS zoom transition). Long-press stays as the shortcut.
2. **The hero is a swipe gallery:** page 1 is the drawing, then his cover photo and other photos, page dots, a light tick per page. Tap a photo for the full-screen viewer on that check, the piece outlined, with a "Whole photo" toggle. No photos = no dots, the drawing alone.
3. **Under it:** the name (tap to rename), "Layer · Grey · Regular fit", worn n×, last worn, added from which check.
4. **"Your photos · 4":** square crops, best first, the cover marked. Long-press one: **Use as cover · Open the look · Not this piece** (a correction: splits it off) · **Remove photo** (red; toast "Photo removed. It's still in your Lookbook." with Undo). Half-hidden photos fold into "2 more, partly hidden"; the same photo re-checked shows once.
5. **Add a photo of it** (step 2, +1–2 days, needs a reinstall): the scan camera, "Lay it flat or hang it up"; the phone cuts it out (Apple's on-device subject mask), nothing is sent, it becomes the cover; the drawing doesn't change.
6. Then Goes with / Style this, and Remove from Closet at the bottom.
- **Privacy:** every crop's top clamped below his head, mirror crops flipped, nothing leaves the phone. If Firebase photo backup ships (#268, on by default), every removal needs a delete marker so it reaches the backup too.
- **Storage:** the cover and hidden photos fit in the piece's existing `profile` field; "Add a photo" is a new sighting kind.
- Files: `app/(tabs)/closet/item/[id].tsx`, `closet/index.tsx`, a photo-strip component, `piecePreview.ts`, `SightingCrop.tsx`, `cropLayout.ts`, `PieceMenu.ios.tsx`, `closet/service.ts`, `privacy/files.ts`, `i18n/en.ts`, tests; for step 5 `KittedMeasure.swift` and `features/scan/`.

**B. Grow the long-press menu only (S, about 1 day):** add "See all photos (4)", "Use a different photo", "Hide photo". Quick, but long-press is hard to find and VoiceOver users only get it as a custom action. Good as a stopgap or as A's shortcut.

**C. A "Drawings | Photos" switch on the grid (S–M):** what Whering and Indyx users expect (their own photo, background removed; Whering lets you replace an item's photo: whering.co.uk/faq/replace-item-photo). But it goes against #141 (you called the cut-outs ugly), and half-seen pieces have no clean photo, so the grid would mix styles. If ever, per piece, not the whole grid.

### What each removal does (proposed; today in brackets)
| Action | What goes | What stays | Undo | Files deleted from the phone |
|---|---|---|---|---|
| Remove one photo from a piece (new) | That photo from the piece's page, preview and cover | The sighting (scores, wear count, matching), the look and its photo in Lookbook and chat | 8 s toast | That sighting's cut-out and fingerprint, after Undo ends; never the kept photo (it belongs to the check) |
| Remove a piece [hidden; files stay forever] | The piece from the grid, outfits, the morning card, matching | Its sightings and every score; wearing it again adds it as new | 8 s toast | Proposed: all its cut-outs and fingerprints after Undo ends |
| Remove a look [hidden, wears subtracted, chat card stays] | The look from Lookbook (and with "and its new pieces", those pieces) | The chat card, the score, the day's used check | 8 s toast | [nothing] Proposed: nothing by default, plus a new "Delete photo" on the look that removes the kept photo, thumbnail, cut-outs and detail copy; the chat shows its existing missing-photo state |
| Delete all photos [built] | Every photo file and every path to one | Scores, readings, the closet, every drawing | Confirm, no Undo | All six photo folders |
| Delete all my data [built] | Everything, back to Welcome | Only the under-18 block | Confirm, no Undo | Everything, plus logs and the device ID |

---

## 4. Redesign ideas (bigger moves, merged from the four reports)

1. **One "result stack" on the score card.** The score owns the top (number, word, a one-line verdict), then one main action chosen by state (Re-check after fixing / Finish the check / Ask your stylist), and everything else folds into "More about this fit". Fixes the crowding, "No quick fixes" and the 7-control morning card together.
2. **Fix rows that do something.** Tap a fix for a one-line "how" with the drawn piece ("in your closet: your navy crewneck") and a "Try it" button that opens the re-check camera with that fix named.
3. **Re-check as a before/after moment.** The two photos side by side, neck down, the fix ticking off between them, the score rolling; honest when it drops (grey arrow, "New: …"). It's also the before/after share card for videos.
4. **Why as a story, not a ledger.** Start with "What held it at 7.5" (the one or two reasons that matter), then the strip (cells tap to jump), the full ledger folded below.
5. **A tighter Propped camera.** Full-bleed preview, a thin control strip, a full-height guide that fills in from the feet up as each part is found, the copper stitch-ring countdown (#242), a shutter flash and haptic so the shot feels taken.
6. **Closet as shelves, with a piece page** (the Oct 14 mockup v2-3): "16 pieces · 24 outfits you can make", one "2 pieces to confirm ›" row, shelves by slot, "In 6 outfits" under each name; the tile zooms into its page (§3, option A).
7. **"To confirm" as a 10-second game.** One comparison at a time, Yes/No advances with a haptic and "2 of 3", closing says "All set".
8. **Build an outfit by dragging.** Long-press a piece and drop it on an outfit tray; as bottoms and shoes join, the reason line updates live ("One dark base, nothing fighting"). No predicted score (#84). Plus "Style this": pin one piece, swipe through outfits built around it; the most shareable Closet moment.
9. **Next best buy as a ghost tile** on the right shelf ("White oxford shirt · +9 outfits"); tap to see the outfits it would unlock, the new piece dashed in. No brands, no links (#87).
10. **Lookbook as a month:** "October · 11 looks", the month's best look as the hero, a 2-column photo grid with the score under each; a look page with the stored card, its pieces (linking to Closet) and "Wear this again".
11. **Onboarding that feels like the product.** The Welcome card plays the real score reveal with its buzz; style tiles spring and show 1/2/3; Basics uses the #247 figure tiles with "This never changes your score".
12. **One Settings page, Privacy first** (as approved in v2-1), and a **privacy receipt** on every check: a small lock on the score card that opens the exact blurred copy that was sent. "It rates the outfit, never you", made visible.
13. **One menu system and one GroupedList component** across the app, and **one quota language** (a small header capsule that opens a sheet with resets and Pro; the camera gate, limit card and subtitle read from it).
14. **Chat answers that feel alive:** cards rising in after the text, a Stop button while streaming, long-press to copy or "Save as tip".

---

## 5. Your calls: decided Oct 15 (#276)
- **Closet photos:** (1) his real photo with the piece outlined, never the cut-out alone; (2) tiles stay pure drawings, photos on the piece page; (3) an added photo never changes the drawing.
- **The selected tab:** ink, not copper.
- **Still open (outward-facing copy):** the "No quick fixes for this one." replacement lines (default "Clean base. Nothing off."), and the #233 copy items on the to-do list.

---

## 6. Next batch: pass/fail checks, set before building (Oct 15, #280)
Founder: "proceed with the plan. make sure that you test the things that you implement with parameters that are set before implementation." These checks were written and committed before any of this batch's code. The build must not edit them; a check that turns out wrong is reported, not quietly changed. Every check becomes an automated test where it can (T), and the ones that need eyes are done on the Simulator (S). The #233 copy fixes are not in this batch (still waiting on his OK).

**Global (all items):** G1 every existing test stays green (app tsc, core tsc, lint, core tests, app tests). G2 no score changes: the parity suites and every demo check's stored score are unchanged (T). G3 light and dark, and the largest text size, show no clipped or overlapping text on each new screen (S). G4 every new string is listed in the report for the founder to skim.

**1. The limit card (§1 item 6; spec `handoff/02-screens.md` D19 S17 and S17h, copy already in the deck):**
- L1 (T) A free user whose check and re-check for today are used takes a photo (camera or library): the reading service is never called, today's count doesn't change, and an inline Limit card is posted in the thread: tag "Daily limit", "Resets 4 am", title "That's today's free check.", the body with the questions left (or the no-questions body), button "Save for tomorrow". "Try Pro" shows only when the paywall is built (`PAYWALL_BUILT`).
- L2 (T) The photo is kept on the phone (the file exists) and the check is held; ignoring the card leaves it held.
- L3 (T) "Save for tomorrow" turns the card into S17h: "Waiting to score" / "After 4 am", "Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check.", link "Don't score it".
- L4 (T) "Don't score it": the held photo is never scored, now or after 4 am.
- ~~L5 (T) With the clock moved past the next 4 am, opening or returning to the app scores the held photo exactly once; it uses that day's free check, and never more photos are scored than that day allows.~~ **Wrong as written; amended Oct 15 (#281), before the fix was built:** it contradicts ruling 27 and spec S17h (a held photo is never sent on its own; one tap scores it). The build followed L5 and was caught by its agent.
- L5′ (T) With the clock past the next 4 am, opening or returning to the app posts once the stylist message "Ready to score last night's photo?" with "Score it" and "Not this one"; nothing is read or sent before he taps. "Score it" scores that photo exactly once, on that day's free check, and never more photos than that day allows. "Not this one" deletes the photo and its files (it was never sent). A photo he chose "Don't score it" for never gets the message.
- L6 (T) When today's re-check is still open, the card shows "Today's re-check still works."
- L7 (T) A Pro user under 10 checks a day never sees the card.
- L8 (T) The old "Check used today" toast no longer appears on this path.
- L9 (S) A demo screen shows the card and its saved state.

**2. The scan inbox made visible (§1 item 11):**
- S1 (T) With 1 or more scans waiting, Closet shows one row at the top, "Waiting to be read · N photos" ("1 photo" for one); with none, no row.
- S2 (T) Tapping it opens a sheet with each scan's thumbnail and date and the existing line "Reading clothes from photos is coming soon."
- S3 (T) Deleting a scan removes its entry, and its kept, thumbnail and face-hidden files are gone from disk; the count updates.
- S4 (T) "Delete all photos" still empties the inbox (the existing test stays green).
- S5 (S) A demo screen with 2 waiting scans shows the row and the sheet.

**3. Merging duplicates on the piece page (§1 item 10):**
- M1 (T) The piece page offers "Same as another piece…", which lists only his own pieces in the same slot (top, bottom, shoes or layer), never the piece itself, and never across slots.
- M2 (T) Picking one asks once to confirm; then every sighting moves to the chosen piece, the merged piece leaves the grid, the kept piece's worn count is the two combined (a check counted once), and the two are never asked "same as?" again.
- M3 (T) Undo within the toast puts both pieces back exactly: ids, sightings, cover and hidden photos.
- M4 (T) Every fit check's score is the same before and after a merge and after its Undo.
- M5 (S) On the Simulator a merge empties the duplicate tile and the kept piece's photos include both.

**4. The Lookbook look page (§1 item 12):**
- K1 (T) Tapping a Lookbook row opens the look's page, not the bare photo viewer.
- K2 (T) The page shows the photo neck-down (tap → the full viewer), the score in Archivo with its word, the date and occasion, the stored fixes in the card's words, the pieces as drawn tiles that open their piece pages, and "Show in chat".
- K3 (T) A look with no photo shows its drawn pieces and never opens the empty viewer.
- K4 (T) The page is read-only: no re-score, no occasion change, no re-check.
- K5 (T) The score shown equals the stored check's score.
- K6 (S) The page in light and dark on a demo look.
- K7 (T) (added Oct 15, #282, before building) "Open the look" on a piece-page photo opens that look's page, not the chat card or the bare photo.
- K8 (T) (added Oct 15, #282, before building) The read-only look page never shows a line that asks him to do something the page can't do (e.g. "Change the occasion.").

**5. The re-check fix row (§2 nit):**
- N1 (T) A caught fix's row on a re-check shows the same number, formatted the same way, as the pill ("+1.0", not "+1").

### §6 results (Oct 15, #286): checked against the list above, unchanged except L5 (amended before its fix, #281)
| Check | Result | How |
|---|---|---|
| G1 | Pass | app tsc, core tsc, lint clean; core 755/755, app 689/689 in 63 suites, jest exit 0 |
| G2 | Pass | core parity suites green; M4 asserts every stored score before, after and after Undo |
| G3 | Pass | Simulator at the largest text size, light and dark: screens 19, 98, 111, 113, 121; text wraps, nothing clipped or overlapping |
| G4 | Pass | new strings listed in DECISIONS-LOG #286 |
| L1–L4, L6–L8 | Pass | `limitCard.test.ts`, failed first, then green |
| L5 | Struck | wrong against ruling 27; replaced by L5′ before the change (#281) |
| L5′ | Pass | `limitCard.test.ts` L5′ tests, failed against the auto-scoring build first |
| L9 | Pass | Simulator screens 19 (limit card), 120 (saved), 121 ("Ready to score last night's photo?") |
| S1–S4 | Pass | `scanInboxRow.test.ts`, failed first |
| S5 | Pass | Simulator screens 110–111: "Waiting to be read · 2 photos", the sheet with dates and delete |
| M1–M4 | Pass | `pieceMerge.test.ts`, failed first |
| M5 | Pass | Simulator: from the duplicate's page, "Same as another piece…" → the khaki chinos → "Yes, same one": the page moves to the kept piece with both photos, the duplicate's tile leaves the grid; Undo brings it back |
| K1–K5, K7, K8 | Pass | `lookPage.test.ts`, failed first |
| K6 | Pass | Simulator screens 97 (re-checked look, dark) and 98 (photo deleted, drawn pieces) |
| N1 | Pass | `recheckFixRow.test.ts`, failed first |

**Found while testing, fixed:** the held-photo catch-up timer threw after tests and made jest exit 1 (it now never throws, and the startup jobs don't start under jest); demo screen 121 scored its 9:12 pm photo instead of holding it (a dev build with a live key counts no checks; the story now spends the day for that step only); demo screens 112–113 opened a blank page (the matcher linked the second chinos photo by itself, so no duplicate existed; the story now splits one off as "Not this piece" would). **Small, left open:** after a merge's Undo the page stays on the kept piece instead of returning to the restored one; on screen 111 at the largest text size the inbox row's chevron is hidden.

---

## 7. Next batch: pass/fail checks, set before building (Oct 15, #287)
Same rules as §6 (founder: "continue working while testing using parameters u set before implementation"): written and committed before the code, never edited to fit; a wrong check is struck and replaced openly. Only settled items with no new words (none needs his OK). Global checks G1–G3 from §6 apply again.
- **C1 (T) Tiles in his measured color** (#141, #143's "still to do"): a piece with a measured color from his photos draws in it, kept inside its color family (a grey hoodie never draws blue); a piece without a measurement draws exactly as today; two pieces with the same color words but measured shades far apart draw in visibly different colors (ΔE ≥ 10). No score changes (G2).
- **C2 (T) "To confirm" shows at most 3 questions** (#111): with 5 open, Closet shows 3; answering one brings the 4th in. No new words.
- **C3 (T) Undo after a merge returns the page:** when the piece page that ran the merge is still on screen, Undo puts it back on the restored piece; from anywhere else Undo changes no screen.
- **C4 (T) Shoes are drawn as large as other pieces:** in a tile, a drawn shoe spans at least 80% of the tile's drawing width, like a top or pants (measured from the drawing's own bounds).
- **C5 (T) Light pieces keep an edge in light mode:** a white or very light piece (lightness ≥ 90) gets a thin outline at about 12% ink in light mode; dark mode and other pieces are unchanged.
- **C6 (T) One flash control at a time:** while the camera shows the "Turn on flash" pill, the separate flash toggle is hidden; when the pill goes, the toggle is back.
- **C7 (T) No blank flash opening the camera:** while consent or the camera permission loads, the screen is the camera's dark background with its close button, never an empty white or black frame without controls.
- **C8 (T, S) The Closet "+" is a pull-down menu:** it opens from the button (the native menu) with the same two actions, not an action sheet from the bottom of the screen.
- **C9 (S)** on the Simulator: the Closet grid (light and dark) with measured colors, full-size shoes and outlined white pieces; the "+" menu; the camera opening.

### §7 results (Oct 15, #288): checked against the list above, no check changed
| Check | Result | How |
|---|---|---|
| C1 | Pass (T) | `closetBatch287.test.ts`: measured color used, kept in family (every family × 175 Lab samples), unmeasured unchanged, ΔE76 ≥ 10 between far-apart shades, no score moves. Not visible on demo screens (demo photos carry no measurements); shows on real checks. |
| C2 | Pass (T) | 3 shown of 5; answering one brings the 4th. The "To confirm" count still shows the total waiting. |
| C3 | Pass (T, S) | Simulator: merge → Undo moved the open page back to the restored Tan chinos (worn 1 time). Undo took a few seconds there; tapping Back before it finishes leaves the page where it is (by design: the page is no longer on screen). |
| C4 | Pass (T, S) | shoes span ≥ 80% of the tile; seen full-size in the grid, light and dark |
| C5 | Pass (T, S) | white soles and pieces outlined in light mode; dark unchanged |
| C6 | Pass (T, S) | Simulator screen 41: "Turn on flash" pill with no second flash toggle |
| C7 | Pass (T) | `cameraBatch287.test.ts`: a dark shell with its close button while consent or permission loads |
| C8 | Pass (T, S) | the native pull-down from "+" with Take photo / Choose photos |
| C9 | Pass | `screenshots/sim-oct15c/` |
| G1 | Pass | this batch alone on HEAD in a clean worktree: app tsc and lint clean, 763 app tests in 68 suites, exit 0. (The live folder also holds another session's unfinished account work, not part of this commit.) |
| G2 | Pass | no fit-check score moves (C1 service tests) |
| G3 | Pass for what was seen | light and dark on the grid; the largest text size was checked for §6's screens, not re-run here |

---

## 8. A photo on the wrong card: pass/fail checks, set before building (Oct 15, #289)
Founder: "long pressing that clothes is going to bring up a small … menu … not this cloth or new one … so that the user wouldn't get annoyed"; then "go with it's another piece, build both". Same rules as §6–§7. Global checks G1–G3 apply. The only new words: the menu label "It's another piece…".
- **W1 (T) Undo on "Not this piece":** the toast "Saved as its own piece: {item}." now has Undo. Undo inside the window puts everything back exactly: the photo's sighting on its old piece, the new piece gone, the "never the same" mark between them removed, the old piece's cover and hidden photos as before, and the check's closet summary as before.
- **W2 (T) "It's another piece…" is offered only when it can work:** on a photo that "Not this piece" can split off, and only when he owns at least one other piece of the same kind (top, bottom, shoes or layer) besides this one.
- **W3 (T) Its picker lists only his own pieces of the same kind,** never this piece and never another kind, titled with the existing "Same as which piece?".
- **W4 (T) Picking one moves only that photo:** its sighting (and the same photo re-checked) moves to the chosen piece; every other photo stays; worn counts follow (each check counted once); the moved photo is never matched back to the old piece. The toast is the existing "Saved as your {item}." with Undo.
- **W5 (T) Undo of a move restores exactly** what W4 changed.
- **W6 (T) No fit-check score changes** after W1, W4 or either Undo.
- **W7 (S)** on the Simulator: the long-press menu shows both options; "It's another piece…" → a piece → the photo shows on that piece's page and leaves this one; Undo brings it back; "Not this piece" → Undo removes the new card.
- **W8 (T) (added after "you can close the other gaps as well", before building) The first photo too:** when a piece has 2 or more photos, "Not this piece" and "It's another piece…" work on its first photo as on any other; the piece keeps its name and drawing, and its other photos stay. Seed and "you added it" pieces with no fit-check photo are unaffected.
- **W9 (T) (same) A piece's only photo:** "Not this piece" isn't offered (there's nothing to split it from; Remove from Closet covers a wrong card); "It's another piece…" is offered and merges this piece into the chosen one exactly as "Same as another piece…" does, with its Undo.

### §8 results (Oct 15, #291): checked against W1–W9, none changed
| Check | Result | How |
|---|---|---|
| W1–W6, W8, W9 | Pass (T) | `wrongCard.test.ts`, 13 tests, failed first (12 of 13), then green; "exactly" = every piece, sighting and check deep-equal to the snapshot after Undo |
| W7 | Pass, one open item | Simulator demo 114: the long-press menu shows Use as cover · Open the look · Not this piece · It's another piece… · Remove photo; the picker "Same as which piece?" lists only the grey tee; picking it moves the photo off the white tee with "Saved as your grey tee." and Undo. **Open:** Undo took several seconds to show on the device (as merge Undo did in §7); the other session's hot reloads kept resetting the demo, so the delay wasn't pinned down. Data correctness is proven by W1/W5. |
| G1 | Pass | this batch alone on HEAD in a clean worktree: tsc clean, 809 app tests in 70 suites, lint clean |
| G2 | Pass | W6 compares every check's score, raw score and part scores |
| G3 | Partly | light mode seen; dark and the largest text not re-run |

---

## 9. Undo that shows late: pass/fail checks, set before building (Oct 15, #296)
§7 and §8 W7 left one open item: on the Simulator the Undo of a merge ("Same as another piece…") and of a moved or split photo ("It's another piece…", "Not this piece") put the rows back exactly (M3, W1, W5) but took several seconds to show. The fix is timing only: nothing about what Undo restores changes, and no new words. Same rules as §6–§8; G1–G3 apply.
- **U1 (T) Undo isn't stuck behind slow closet work:** with a slow closet job already waiting in the closet queue (a late closet answer being written, a launch catch-up, the color refresh, or the photo measuring inside them), the merge Undo and the photo Undo start and finish without waiting for that job. Measured in a jest test with a job that takes 5 s on fake timers: Undo is done before it.
- **U2 (T) The queue stays safe:** a job that was already running when Undo was tapped finishes first (Undo never interleaves with another closet write), and nothing queued after Undo runs before it. A closet answer that lands after the Undo reads the restored rows, so no stale closet summary is written over them. The existing ordering tests (`patchCheckKeepCloset`, the closet call vs Undo on the score card) still pass.
- **U3 (T) Undo is restored exactly,** as today: M3, W1 and W5 pass unchanged.
- **U4 (T) The piece page shows the restored piece with one reload, not one per row:** a burst of writes from one Undo leads to at most 2 page reloads, and the last one shows the restored rows.
- **U5 (logs)** every Undo logs `[closet] undo queued`, `started +N ms` and `done +N ms` (and what it waited behind), so a slow one on his phone can be read from Metro or `pull.sh`.
- **U6 (S) On the Simulator:** demo 112 (Same as another piece… → pick → Yes → Undo) and demo 114 (long-press a photo → It's another piece… → Grey tee → Undo): the restored page shows within ~300 ms of the tap on Undo, read from the U5 log lines (tap to done) and a screenshot.
- **U7 (T) No fit-check score changes** after any of these Undos (as W6).

### §9 results (Oct 15, #296): checked against U1–U7, U1 reworded before building (a held job, not 5 s on fake timers)
| Check | Result | How |
|---|---|---|
| U1 | Pass (T) | `undoQueue.test.ts`: a closet job held open in the queue (it never ends until the test releases it); the merge and photo Undos finish before it starts. Against the old queue the Undo hung behind it (the test timed out) |
| U2 | Pass (T) | a running job finishes before the Undo starts; a closet write queued during the merge, run after the Undo, reads the restored summary; jobs queued after an Undo never run before it |
| U3 | Pass (T) | `pieceMerge.test.ts` M3, `wrongCard.test.ts` W1/W5 unchanged and green; U1 also deep-compares every table to before the merge |
| U4 | Pass (T, S) | one Undo wakes a watching screen once (was 6 in the test story); on the Simulator the old code reloaded the page 7 times per merge Undo, the new code once |
| U5 | Pass (T, S) | the three log lines, seen in Metro: `undo photo queued · behind nothing`, `started +13 ms`, `done +17 ms (ran 4 ms)` |
| U6 | Pass (S) | tap → restored page: demo 114 photo Undo +26 ms, demo 113 merge Undo +76 ms (back on the tan chinos, worn 1 time); the old code was +110 ms on the same merge, so the "several seconds" in §7/§8 W7 didn't reproduce (likely the test taps, DECISIONS-LOG #296) |
| U7 | Pass (T) | every check's score, raw score and part scores equal after a merge and its Undo jump the queue |
| G1 | Pass | `npm run check`: tsc, lint, core tests and 823 app tests in 72 suites |
- **U8 (T) (added Oct 15, #297, before building) The photo measuring leaves the queue:** a new check's photo is measured before its closet write joins the closet queue, not inside it. While the measuring runs (held open in a test), an Undo and a "Same as your …?" answer run and finish. The closet write that follows uses that measured result. A failed measure still writes the closet (no cut-outs), as today. No score changes.

### U8 result (Oct 15, #297)
| Check | Result | How |
|---|---|---|
| U8 | Pass (T) | `undoQueue.test.ts` U8: a new check's measuring is held open; the merge Undo finishes meanwhile and the tables equal the pre-merge ones; after release the check's sightings carry their cut-outs and the photo was measured once. Against the old service the Undo hung behind the measuring (timed out). A measure that throws still writes the sightings, with no cut-outs. Closet suites 154/154 |

---

## 10. Face hiding: a head cut off at the top edge (Oct 16, #304)
The gap found in the gold set (#224, on the founder's list as P1): ig-098, a mirror selfie whose head runs off the top of the photo, was sent with his chin, mouth and part of his nose uncovered. Why: the face detector misses a face cut off mid-way; with no head joints and only one shoulder found, prep took "his outline touches the top edge" to mean "the head is outside the photo" and hid nothing. Ruling 10 stays the rule: if we can't be sure his face is hidden, nothing is sent. No new words. Checks set before building; (M) = the Mac harness (`kmeasure`, the app's own Swift), on the gold set (226 screenshots), his and his friends' fit photos (`inputs/fitcheck-photos`, `mirror-fit-check-1`, `phone-oct7`) and the 14 demo photos.
- **H1 (M) ig-098 is covered:** in the copy sent, the region of his chin, mouth and nose (marked by eye before the fix) is entirely inside what prep hides.
- **H2 (M) Nothing that was hidden comes uncovered:** on every photo, every pixel hidden before the fix is still hidden after it.
- **H3 (M) No photo newly stops sending:** every photo that was "ok" before is still "ok" (a new cover is added; no new "couldNotFrame").
- **H4 (M) The extra cover stays small and only where a head could be:** a new cover is only added when his outline touches the top edge; it's never more than 25% of the frame; and on photos where both shoulders sit at the very top (a true chest-down shot) nothing new is hidden. Every photo that gains a cover is looked at by eye: none may have a face left showing, and the cost to the clothes (a collar, a tie knot) is listed.
- **H5 (M) Same photo, same result:** run twice, the same regions.
- **H6 (T)** `npm run check` green; the Swift compiles for the Simulator (a native change: it reaches his phone with the next reinstall, which is already on his list for Oct 21).

### §10 results (Oct 16, #304): checked against H1–H6, none changed
| Check | Result | How |
|---|---|---|
| H1 | Pass (M) | ig-098: the chin, mouth and nose region (x 300–540, y 0–175, marked by eye before the fix) is entirely hidden in the copy sent and in its close-up |
| H2 | Pass (M) | 296 photos: every pixel hidden before is still hidden (`extraction-test/face_gap.py compare`, `results/facegap/report.txt`) |
| H3 | Pass (M) | 295 "ok" before, the same 295 after; no new "couldNotFrame" |
| H4 | Pass (M) | 4 photos gain a cover, all with his outline at the top edge, the largest 18% of the frame. Seen by eye: ig-098 (a face, now hidden), ig-040 (a sliver of chin under the phone, a 5% strip). pin-068 and m06 show no face: there prep found no shoulder joints, so it can't tell. The cost there is the top of the jacket collar and neckline (pin-068) and the phone hands and shirt top (m06); the clothes still read |
| H5 | Pass (M) | the 4 plus 3 unchanged photos run twice: identical |
| H6 | Pass | the Swift typechecks for the iOS Simulator SDK; `npm run check` green (930). It reaches his phone with the next reinstall |

---

## 11. A second photo while one is reading: pass/fail checks, set before building (Oct 16, #305)
§1 item 7 (#245's symptom): a photo sent while another is still being read is dropped with no word. The words are the founder's listed default (#233 item 8), built with them and listed for his skim.
- **K1 (T)** a check refused as busy shows `Still reading your last photo. Send this one when it's done.`; nothing is sent and nothing is counted.
- **K2 (T)** the photo he just took is thrown away only after the line shows (the temporary file, as every refused photo is today).
- **K3 (T)** the other outcomes keep their own answer: "Which one is you?" and the held photo's Limit card still show no toast, and every existing outcome's toast is unchanged.
- **K4 (T)** `npm run check` green.

### §11 results (Oct 16, #305): checked against K1–K4, none changed
| Check | Result | How |
|---|---|---|
| K1 | Pass (T) | `busyPhoto.test.ts`: a busy refusal shows the line; failed first, then green |
| K2 | Pass (T) | the temporary original is deleted after the line shows; a sample photo has nothing to delete. Found while building: before this, a busy photo's unblurred temporary file was never deleted |
| K3 | Pass (T) | Which one is you? and held stay silent; limit and error keep their toasts |
| K4 | Pass | `npm run check`: 933 app tests |

## 12. The Style profile keeps edits on Back: pass/fail checks, set before building (Oct 16, #306)
§2 You: "Style profile drops edits on a Back swipe … Autosave it." Leaving the screen any way (Back, swipe) now saves what he changed, like Settings; Save stays and still saves and goes back. No new words.
- **Q1 (T)** leaving with unsaved edits writes them to his profile, exactly as Save would (`applyDraft`).
- **Q2 (T)** leaving with nothing changed writes nothing (no write, no change notice).
- **Q3 (T)** an edit and then Save, then leaving, writes once.
- **Q4 (S)** web preview: change a look, go Back, open the Style profile again: the change is there.

### §12 results (Oct 16, #306): checked against Q1–Q4, none changed
| Check | Result | How |
|---|---|---|
| Q1–Q3 | Pass (T) | `profileLeave.test.ts` (`saveDraft`), failed first, then green |
| Q4 | Pass (S) | web preview demo 80: picked $100+, went Back without Save, reopened: still $100+ |
| Seen, not changed | | on web the You tab's style card nests its Edit button inside the tappable card (a web-only "button inside button" warning; iOS is fine). Logged here for a later pass |

---

## 13. The Closet's Outfits half: plan and pass/fail checks, set before building (Oct 16, #307)
Approved Oct 8 (#84, #87, #88; 02 D15; `mockups/closet-concepts.html`), never built (§2 Closet: "The approved Outfits half isn't built"; "No Goes with"). All words are D15's approved labels; the only new ones are a reason fallback and the go-to caption, listed for his skim. Everything runs on code (no AI, free on every plan); no score moves.

**The plan**
- **Engine (`features/closet/outfits.ts`, pure):** every top + bottoms + shoes he owns (not ones waiting on "Same as…?"), kept when core's `outfitValid` passes; each scored by the parts engine (today's scoring) on `outfitReading`. A layer joins a trio only when it raises that score by at least 0.5 (it never multiplies the count). Reason line: the outfit's top positive reason from the parts engine, else a plain fallback.
- **The count** ("{n} pieces · {m} outfits"): trios rated Put together (7.0+) at Everyday; pieces he only mentioned in chat aren't counted.
- **Worn = a scored fit check whose pieces include the whole trio.** "Your go-tos" shows his kept photo and that check's real score (the best one if worn more than once); "Try next" is the rest, best first for the occasion, never a score.
- **Closet:** a Pieces | Outfits control under the title; opens on Outfits once he can make 3+, else Pieces; remembers his pick. Outfits: occasion chips (Everyday, Class, Date, Going out, Interview, Event), then Try next and Your go-tos. Each card: the standing outfit (his pieces stacked top / bottoms / shoes, a layer at the side), the reason, Wear this (logs today, Undo) and Check it (camera with the occasion).
- **No outfits yet:** `No outfits yet` + Top · Bottoms · Shoes with ✓ or what's missing ("Add shoes and you'd have {n} outfits", n from the Starter piece for that slot) + `Tap the basics you own` and `Check my fit`. With 1–2: "{n} outfits so far".
- **Piece page:** `Goes with`: up to 3 outfits with this piece, `Best match` · `Dressier` · `More relaxed` (the next best fills a missing role), and `{n} outfits` beside Worn and Last worn.

**Checks**
- **O1 (T)** the engine lists only trios that pass `outfitValid`, never a piece he doesn't own or one waiting on an answer, and never the same trio twice.
- **O2 (T)** the count equals the trios at 7.0+ at Everyday; adding a layer to the closet never raises it; a chat-only piece never raises it.
- **O3 (T)** a layer joins a trio only when it raises the score by 0.5 or more.
- **O4 (T)** the order is best first for the chosen occasion, and changing occasion re-orders.
- **O5 (T)** an unworn outfit's card data has no score; a worn one carries the check's real score and photo, the best when worn more than once.
- **O6 (T)** every outfit has a reason line (never blank).
- **O7 (T)** opening segment: Outfits at 3+ outfits, else Pieces; his tap is remembered and wins after that.
- **O8 (T)** no outfits yet: the checklist marks each slot, names the missing one with a real "+n" (or says it plainly when n is 0).
- **O9 (T)** Goes with: every outfit includes the piece; roles Best match / Dressier / More relaxed by dressiness, next best filling a missing role; at most 3; none when the piece can't make an outfit.
- **O10 (T)** Wear this logs today with Undo; Check it opens the camera with the occasion.
- **O11 (T)** no fit-check score changes; the engine is the same twice (same closet, same list).
- **O12 (T)** a 40-piece closet lists in under 300 ms on the Mac (the grid shows while it computes).
- **O13 (S)** web preview and, if free, the Simulator: demo screens for Outfits (full closet), No outfits yet, and the piece page's Goes with; light and dark; the largest text size.
- **O14** `npm run check` green.

### §13 results (Oct 16, #307): checked against O1–O14, none changed
| Check | Result | How |
|---|---|---|
| O1–O12 | Pass (T) | `closetOutfits.test.ts`, 12 tests on the full demo closet (16 pieces): 37 outfits at Everyday (the mockup's own number), 41 ms; a 40-piece closet under 300 ms (best of 3) |
| O13 | Pass after two fixes (S) | web preview 182–184 light and dark; then the Simulator (`screenshots/outfits-oct16/`): Outfits, Pieces (the grid draws on iOS), the chinos' page in dark, Outfits at the largest size (chips one per row, the drawing above the text, nothing clipped). **Fixed:** the Pieces / Outfits labels shrank to a few points on iOS (the shared control's shrink-to-fit; off for this bar), and the standing outfit's shoes were drawn too small |
| O14 | Pass | `npm run check`: 948 app tests |
| Found, not mine | | on the web preview the Pieces grid draws nothing (main too, before this change); iOS is unaffected as far as earlier sessions saw. Worth a look |

## 14. Next best buy: pass/fail checks, set before building (Oct 16, #308)
§2 Closet: "no next buy"; approved #87 (named by kind and spec, never a brand; shows the outfits it unlocks with the new piece dashed; no shop links) and 02 C7. Built from the Starter basics (`finish/starter.ts`); words from the deck (`closet.nextBuy.tag`, `nextBuy.*`) and the chat's "+{n} outfits with what you own". 02 C7's per-piece "What to look for" bullets exist for one example only, so they wait for copy. The full list is free (07 §12: "everything that runs on code is free").
- **N1 (T)** the pick is the Starter piece he doesn't own (by the closet or a tap) that adds the most outfits under the Closet's own count (7.0+ at Everyday); ties keep the Starter order; none when nothing adds an outfit.
- **N2 (T)** its "+n" equals the count with it minus the count without it, and never counts chat-only pieces.
- **N3 (T)** "what it unlocks" lists only outfits that contain the new piece, each new outfit once, best first.
- **N4 (T)** no brand or shop anywhere in it (the sentence gate's brand rule on every line), and no link out.
- **N5 (S)** Outfits shows the card under the count; a tap opens the sheet: the piece, "+n outfits with what you own", its price, the unlocked outfits with the new piece dashed, and Got it. Light, dark, the largest size where the Simulator is free.
- **N6** `npm run check` green.

### §14 results (Oct 16, #308): checked against N1–N6, none changed
| Check | Result | How |
|---|---|---|
| N1–N4 | Pass (T) | `nextBuy.test.ts` (written right after the engine; the checks were committed first): on the demo closet the pick is dark straight jeans, +16 |
| N5 | Pass on web (S) | demo 182: the card under the count; the sheet (`/sheets/next-buy`, replacing the C7 placeholder): +16, $50–60, six unlocked outfits with the jeans dashed, Got it; light and dark. **On the Simulator Oct 17 (§15):** two fixes, then pass |
| N6 | Pass | `npm run check`: 1041 app tests |
| Found | | **Two "+N" rules in the app:** the chat's buy card, the Starter list and the first-3-moves card count with `fitsGain` (core `rotation`: any combination without a hard clash, v4), while the Closet now counts outfits rated Put together (#84.3). So on the demo closet the chat suggests a navy polo (+12) and the Closet dark straight jeans (+16). Proposed as a follow-up: one count everywhere |

## 15. Next best buy on the Simulator: two fixes, pass/fail checks set before building (Oct 17, #312)
Found on the iOS Simulator (iPhone 17 Pro Max, demo 182; first time the sheet ran on iOS, since N5 had passed only on the web): in dark mode the sheet's big "+16" is near-black on the dark sheet, and the sheet says "What it unlocks · 16" but shows 6 outfits with no way to see the other 10.
- **N7 (S)** The "+16" reads in both themes: it takes a real theme color. `Numeral`'s `color` is a color value, not a token name, so `color="accent"` was an invalid color (black on iOS). It becomes ink, the default: copper is kept for a score that moves (#231).
- **N8 (T)** No `<Numeral … color="…">` in the app passes a string literal (a token name is never a color); a test scans the source.
- **N9 (S)** The sheet shows the first 6 outfits, then "Show {n} more" (the Outfits list's own words), which shows all 16 and becomes "Show fewer". 6 or fewer: no link.
- **N10** `npm run check` green.

### §15 results (Oct 17, #312): checked against N7–N10, none changed
On a second Simulator (iPhone 17 Pro Max, the founder's one-time OK; the shared iPhone 17 Pro left alone), demo 182, light, dark and the largest text size; screenshots `screenshots/nextbuy-oct17/` (git-ignored).
| Check | Result | How |
|---|---|---|
| N7 | Pass (S) | "+16" in ink, clear on the dark sheet (was near-black on it) |
| N8 | Pass (T) | `numeralColor.test.ts` failed on `NextBuySheet.tsx` before the fix, passes after; it was the app's only string-literal Numeral color |
| N9 | Pass (S) | 6 outfits, "Show 10 more" shows all 16 (4 rows), then "Show fewer"; Got it below; at the largest size the title, number and line stack and the link reads |
| N10 | Pass | `npm run check`'s typecheck, lint and 1053 app tests (core untouched) |
| Found | | The card appears about a second after the outfit list on a cold load, so the list moves down once (`loadNextBuy` scores each Starter candidate). Not fixed: a reserved-height placeholder or computing it with the list is the follow-up if it bothers him. |
---

## 17. Fix what a piece is: plan and pass/fail checks, set before building (Oct 16, #315)
Founder (Oct 16, voice): sometimes the tile itself is wrong, "slim jeans as relaxed, relaxed as slim, a sweatshirt as a hoodie", so give him "a way to change what the tile represents, from a limited choice", with the drawing changing to match; "this has to get planned well because what I am saying right now might not go with the whole thing." **Plan only: nothing is built until he reviews it** (mockup `mockups/piece-edit.html`; DECISIONS-LOG #315). Numbered §17 and #315 because main took §15 and #311–312, and open PRs hold §15–16, #309 and #313. Global checks G1–G4 (§6) apply.

### 17.1 What he'll see
- **On a piece's page, a new section "What it is"** right under the name (above worn / last worn / added, so it shows without scrolling past the photos): one row per thing he can change, each showing today's value with a chevron: **Kind · Jeans ›**, **Color · Dark denim ›**, **Leg · Slim ›** (bottoms) or **Fit · Regular ›** (tops and layers), **Pattern · Plain ›** (tops and layers). Under it, one footnote: "Got one wrong? Change it here. The drawing and your outfits follow. Your scores stay the same." The old line under the name ("Bottom · Dark denim · Slim leg") becomes just the slot word ("Bottoms"), since the rows now say the rest.
- **A tap on a row opens a short sheet** (half height, a Close button, the familiar iOS pattern of picking one from a list): a grid of pictures, each the piece itself drawn with just that one thing changed, in its own color, with the name under it; the current one ringed with a check. Color is a grid of swatches with names instead of drawings (24 drawings of the same jeans would say nothing).
- **One tap picks.** The sheet closes, the big drawing redraws to match, a light tick, and the toast: "Changed to relaxed leg. Your scores stay the same." with **Undo** (8 s, as every closet toast). Picking the value it already has just closes the sheet.
- **The long-press menu stays Rename and Remove** (it's a shortcut; the page is one tap away).

### 17.2 The choices (short, plain words, never a brand)
The lists come from the schema's own values and the words the app already uses (`garmentName`, `value.leg.*`, `value.topFit.*`), so no new vocabulary. Each kind list has a first group of 8 that all draw differently, and a "More kinds" row that opens the rest in the same sheet (a near-synonym there may share a drawing; its name tells it apart). The piece's current kind and its look-alikes (core `FLIP_PAIRS` and the quick tap's pairs) are always in the first group.

| Slot | Rows | Kind, first 8 | More kinds |
|---|---|---|---|
| Top | Kind, Color, Fit, Pattern | Tee, Graphic tee, Polo, Oxford, Flannel, Sweater, Sweatshirt, Hoodie | Tank top, Dress shirt, Camp shirt, Knit polo, Quarter-zip, Cardigan, Rugby shirt, Jersey, Fleece, Overshirt, Denim jacket, Chore coat |
| Layer | Kind, Color, Fit, Pattern | Overshirt, Denim jacket, Bomber, Field jacket, Blazer, Puffer, Overcoat, Hoodie | Chore coat, Sweatshirt, Quarter-zip, Cardigan, Flannel, Fleece, Leather jacket, Rain jacket, Shell jacket, Sport coat, Suit jacket, Camp shirt |
| Bottoms | Kind, Color, Leg (not for shorts) | Jeans, Chinos, Trousers, Cargos, Sweatpants, Shorts | Joggers, Gym shorts, Drawstring trousers, Suit trousers |
| Shoes | Kind, Color | Leather sneakers, Canvas sneakers, Runners, Chunky sneakers, Work boots, Chelsea boots, Loafers, Slides | Low-profile sneakers, High-tops, Running shoes, Chukkas, Derbies, Dress shoes |

- **Leg:** Skinny · Slim · Straight · Relaxed · Wide (the closet matcher's own five).
- **Fit (tops and layers):** Slim · Regular · Relaxed · Oversized (the reading's volume 2–5, as "Not quite right?" offers).
- **Pattern (tops and layers):** Plain · Stripes · Checks · Graphic print. A piece read as camo or floral also shows its own value. Bottoms and shoes get no pattern row (the drawing doesn't draw patterned bottoms or shoes, and the reading rarely sees one).
- **Color:** the 24 color families in four groups (Neutrals; Blues and denim; Earth tones; Colors), never "multicolor". The three denim washes are offered only for jeans and denim jackets (plus the current value). Changing jeans to another kind while the color is a denim wash moves it to the nearest plain color (dark → navy, mid → blue, light → light blue) and the toast says so: "Changed to chinos, in navy."
- **Not offered, on purpose:** the brand word (never in a picker), the slot (a top stays a top and a layer a layer: every kind a top can become is a top or a piece worn either way; a real top ↔ layer move waits, §17.6 call 6), sleeve length (no drawing or scoring for it yet), the hem and the tuck (how he wore it that day, not the piece; they stay on "Not quite right?"), condition, details like zips (they come from the photos).
- **Drawn apart first (part of the build):** today the real drawing code (bundled as is for the mockup) draws these pairs the same: Skinny = Slim, Relaxed = Oversized, Sweater = Sweatshirt, Tee = Graphic tee (when the pattern reads plain), Leather = Canvas sneakers. The build gives each its own look (a narrower leg; dropped shoulders and a longer body; a fine knit texture; the print on every graphic tee; a rubber toe cap), so every first-group option looks different. The other look-alikes (Joggers = Sweatpants, Chore coat = Overshirt, the field / rain / shell jackets, Derbies = Dress shoes, the sneaker subtypes in More) keep one drawing and are told apart by name.

### 17.3 What a change touches
One closet-service action, `editPiece(itemId, field, value)`, run in the closet's queue like every other closet write (§9: Undo goes ahead of background work).
- **The piece's own reading** (`garment`): the field takes his value (`subcategory`, `color_family`, `leg_shape`, `pattern`, or `volume` for Fit). Nothing else on it moves.
- **"He said so"**: the field joins `confirmedFields` and the piece profile's `confirmed` values (both, because the drawing reads one and "known pieces" read the other: `artOf` takes the pattern from `profile.confirmed`, `knownPieces` counts a piece as confirmed from `profile.confirmed`). Volume isn't a confirmable matcher field; Fit is stored on the reading only.
- **Later photos never flip it back, and still find the piece:** a confirmed value beats every sighting (`itemVal`), and the drawing's drift guard already lets a confirmed value win. The value he corrected away from, as his own photos of this piece read it, is taught to the matcher the same way a "Yes, same one" teaches (#115): an old kind becomes an alias (`profile.aliases`), old leg reads join `fieldAliases.leg_shape`. So the next photo that reads his sweatshirt as a hoodie again still lands on this piece instead of making a new tile. Only values his own sightings read are taught, never the whole look-alike family, and "never the same" marks stay.
- **The next fit check:** a kind he set makes the piece a known piece, so an unsure read of it can ask "Your grey sweatshirt?" before the score, exactly as #126 does today (only when Yes moves the score by 0.5+). Leg and fit are never asked (#122: no fit questions). Otherwise the new check scores what its photo shows, as now.
- **The drawing, color and name** are re-derived (`refreshItem`, `renameAll`): an auto-named piece renames ("Grey hoodie" → "Grey sweatshirt", "Navy tee" → "Navy striped tee"); a name he set himself never changes; leg and fit aren't in names (they're on the rows), so "Dark jeans" stays "Dark jeans". His measured color stays only while it reads as the new color family (`hexOfArt`), else the family's own color.
- **Outfits, Next best buy, Starter essentials, the first 3 moves and the chat** all read the piece live, so they follow on the next render: the Outfits count and Goes with can move, the next buy can change, and the chat's piece line says "relaxed leg" from the next question. A Starter piece he only marked ("I own this") whose new kind no longer fills its Starter row is unmarked, so the row shows as not owned (Undo marks it back).
- **Sync:** the closet row with a new `updatedAt`; no new field, no migration, the newest edit wins (#288).
- **Never touched:** any fit check's score, raw score or part scores; any reading; any sighting (`closetObs`) or its photo; Lookbook; worn counts; the check's closet summary; `@kitted/core` (no file changes).
- **Undo** puts back every closet row the action changed (the piece, any other piece `renameAll` renamed, an unmarked Starter piece) exactly as before.

### 17.4 Past fit checks: left alone (decided by Claude, reasons)
A correction here changes the closet piece, not the checks it was seen in. The checks keep their scores, and the toast says so.
1. **"Same photo, same score"** is the product's promise: a check is a reading of that photo. The piece is his summary across photos; one wrong merge or one bad reading shouldn't rewrite five scores.
2. **The check may have been read right.** A photo that read "relaxed" may really show a different pair (the AI merged two pieces), so pushing the piece's new value into every photo could make right scores wrong. "It's another piece…" and "Not this piece" (§8) are the tools for that.
3. **The blast radius** of a silent re-score is large: Lookbook scores, Your go-tos, the moves card and the chat's history would all shift without him asking.
4. **The honest path already exists:** each check's "Not quite right?" shows the before and after and makes a new corrected reading. A bulk "Re-score the 3 checks it was in" is a taste call (§17.6 call 2), default no.

### 17.5 Accessibility, sizes, themes
- VoiceOver: each row reads "Leg, Slim. Button. Double-tap to change."; each option "Relaxed leg, button", the current one "Slim leg, selected"; after a pick the toast is announced and the drawing's label updates (it now names the kind and leg or fit: "Dark jeans, relaxed leg").
- The largest text sizes: rows stack the value under the label (`ValueRow` as today), the sheet's grid drops to 2 columns, names wrap to 2 lines, Close stays 44 pt.
- Light and dark: the drawings use the app's dark-mode rims; swatches get a hairline ring so black on night and white on chalk still show.
- Touch targets 44 pt; no gesture-only path (every pick is a tap).

### 17.6 Taste calls (founder; Claude's default first)
1. **Where it lives:** rows on the piece page, each opening a picture sheet (default) · or one "Edit" button top right opening a form with every field. Rows: one glance shows what the app thinks, one tap fixes one thing.
2. **Past checks:** leave them, and say "Your scores stay the same" (default) · or offer "Re-score the {n} checks it was in" with a before/after list (a bulk "Not quite right?"; about +1 day).
3. **A long-press entry** ("Change what it is…"): no (default) · yes.
4. **Draw the look-alikes apart** (17.2's five pairs, about half a day in `flats.ts` / `artSpec.ts`): yes (default) · names only.
5. **The words** (all new): "What it is", "Kind", "Color", "Leg", "Fit", "Pattern", "More kinds", "Plain", "Stripes", "Checks", "Graphic print", "Neutrals", "Blues and denim", "Earth tones", "Colors", the footnote "Got one wrong? Change it here. The drawing and your outfits follow. Your scores stay the same.", the toast "Changed to {value}. Your scores stay the same.", "Changed to {kind}, in {color}.", the sheet subtitle "Pick what it really is.", and VoiceOver's "Double-tap to change." Default: as written.
6. **Top ↔ layer:** not in v1 (default; the outfit engine treats a top and a layer differently, so moving one is a bigger change than a picker) · a "Worn as · Top / Layer over a top" row.
7. **"Long-sleeve tee"** isn't a kind the reading knows: later, with the reading and a drawing (default) · now as a sleeve-length row (drawing only, never scored).

### 17.7 Pass/fail checks (written before building; the build must not edit them)
- **X1 (T) The lists:** for a piece in each slot, the Kind sheet offers exactly 17.2's first group and More kinds, plus the piece's current kind and its look-alikes in the first group when missing; never another slot's kinds; Leg, Fit, Pattern and Color offer exactly 17.2's values. No option label contains a brand (the sentence gate's brand rule) or a body word.
- **X2 (T) The rows:** tops and layers show Kind, Color, Fit, Pattern; bottoms Kind, Color, Leg (no Leg for Shorts and Gym shorts); shoes Kind, Color. The denim washes show only for jeans and denim jackets, or as the current value.
- **X3 (T) What a pick writes:** exactly the field on `garment`, the field in `confirmedFields` and `profile.confirmed` (confirmable fields), the taught aliases (17.3), `art`, `hex`, `name` (auto-named only) and `updatedAt`; every other field of the row deep-equal to before.
- **X4 (T) The drawing follows:** after each pick the piece's `artSpec` matches a piece that was read with that value (hoodie → sweatshirt: no hood, no drawstrings; slim → relaxed: the relaxed leg), including a pattern pick on a piece whose photos read another pattern, and a color pick whose measured color is from another family (the family's own color is drawn).
- **X5 (T) The pictures differ:** within each sheet's first group, every option renders a different drawing (`renderFlat` output) in light and in dark; only the listed More-kinds look-alikes may share one.
- **X6 (T) The name:** an auto-named "Grey hoodie" becomes "Grey sweatshirt"; a pattern pick names it ("Navy striped tee"); a leg or fit pick leaves the name; a name he set stays; a clash with another piece is settled by the existing detail-word rule.
- **X7 (T) It sticks:** three later sightings that read the old value (hoodie; relaxed) each match this piece with no veto and a score no lower than before the edit, and none of them changes the piece's kind, leg, color or pattern; a genuinely different piece he said "never the same" to stays apart.
- **X8 (T) Known piece:** after a kind pick, `knownPieces` lists the piece as confirmed with the new kind, and `askWithClosetBy` on an unsure read of its look-alike asks about it under #126's unchanged rules.
- **X9 (T) No score moves:** every fit check's score, raw score and part scores, every reading, every sighting and every closet summary are deep-equal before a pick, after it and after its Undo; `packages/kitted-core` has no diff (G2).
- **X10 (T) Everything that reads the closet follows:** after slim → relaxed on the demo closet's jeans, the Outfits count, Goes with, the next best buy and Starter ownership equal a fresh computation on the edited closet, and the chat's piece line says "relaxed leg". A marked Starter piece that no longer fills its row is unmarked.
- **X11 (T) Undo:** inside the toast window every row the pick changed (the piece, a renamed neighbor, an unmarked Starter piece) is deep-equal to before, and everything in X10 is back.
- **X12 (T) Edge cases:** jeans → chinos in a denim wash moves to the nearest plain color and the toast says it; picking the current value writes nothing and shows no toast; a piece waiting on "Same as your …?" has no editor (it isn't a tile); chat, Starter and seed pieces edit by the same rules; a pick while the closet call is still out for a check that wore the piece is kept when that call lands.
- **X13 (T) Sync:** the edited row round-trips through the sync envelope (`app/src/sync/schema.ts`) with every edited field; no field is added to the local-only list.
- **X14 (T) Words and VoiceOver:** every new string is in `en.ts` and passes the copy checks (no emoji, no "unlimited", no "AI stylist", no body words); the rows' and options' VoiceOver labels are as 17.5.
- **X15 (S) On the Simulator** (a new demo screen with the demo jeans and hoodie): the section, Leg → Relaxed redraws the hero and shows the toast; Undo restores; Kind → Sweatshirt on the hoodie; light, dark and the largest text size with nothing clipped; VoiceOver reads a row and an option.
- **X16** `npm run check` green (G1).

**Estimate:** about 2 days: the action and its Undo (half a day), the section and sheets (half a day), the drawings apart (half a day), tests and the Simulator pass (half a day). JS only: on his phone through Metro, no reinstall.

### §17 results (Oct 16, #315): built with every default (founder: "After the mockups, I agree with them. You may continue."), checked against X1–X16, none changed
| Check | Result | How |
|---|---|---|
| X1–X14 | Pass (T) | `pieceEdit.test.ts`, 27 tests, run first against no code (the module didn't exist), then green. Two test fixes, not check changes: the demo hoodie's real name is "Heather grey Nike hoodie" (the closet call reads the shade and logo), not the "Grey hoodie" the test guessed, and the seed's "Grey tee" becomes "Heather grey striped tee"; `toHaveProperty` read the dotted string keys as paths |
| X5 | Pass (T) | 5 drawings added: a skinny leg (narrower, tapered), an oversized top (dropped shoulders, longer and wider), a knit texture on sweaters, the print on every graphic tee, a canvas toe cap; and one more the test found: chinos and trousers drew the same in navy, so trousers are now smooth cloth with a sharper crease. #287's C5 render hashes still pass: every other drawing is byte for byte the same |
| X9 | Pass (T) | 6 picks and their Undos across p01b and s12 checks: every score, raw score, part score, reading, sighting and closet summary unchanged; `packages/kitted-core` has no diff |
| X15 | Pass (S), one note | iPhone 17 Pro Simulator, demo screens 185 (the jeans' page), 186 (Leg), 187 (Kind on the black sweatshirt), 188 (Color) (renumbered 197–200 at the merge with main, whose two-shot check took 185–188): Leg → Relaxed redraws the hero and shows "Changed to relaxed leg. Your scores stay the same." with Undo; Undo puts it back (log `undo edit … ran 5 ms`); light, dark and the largest size (rows stack, the sheet drops to 2 columns, nothing clipped). VoiceOver labels are checked by X14, not read aloud on the Simulator. **Note:** the Simulator tool's screenshots take seconds, so a timed Undo tap twice landed on the row under the toast after the toast had gone; with the toast up, Undo worked |
| X16 | Pass | typecheck, lint, 755 core tests, 1088 app tests |
| Fixed on the Simulator | | the selected swatch's check was drawn in the swatch's own color (white or ink now); the knit lines were too faint on black, then too strong (read as grey), now in between; the sheet now closes the moment he taps and the write lands just after (it waited for the write) |
| Not built (defaults) | | no long-press entry (call 3), no re-scoring of past checks (call 2), no top ↔ layer (call 6), no long-sleeve tee (call 7) |


## 18. How baggy a piece is: how the app knows, how sure it is, how he corrects it (plan and pass/fail checks, set before building; Oct 16, #316)
Founder (Oct 16): "what are we gonna do about how baggy anything is? how will we know and let the user correct?" **Plan only: nothing is built or re-scored. His four calls were decided Oct 16 with the defaults (§18.6).** Numbered §18 and #316 because §15–§17 and #309–#315 are held by main and the open PRs (eyualem/kitted#4, #5, #7). It builds on §17, the piece page's "What it is" rows (PR eyualem/kitted#5, #315). Global checks G1–G4 (§6) apply.

### 18.1 What exists today (from the code)
- **The reading** (`extraction-test/schema.json`, the live v3 format): `volume` 1–5 on every garment ("1 = fitted close to body, 3 = regular, 5 = very oversized. Garment cut, not the person's body.") and `leg_shape` on bottoms (skinny · slim · straight · relaxed · wide · flare/bootcut · barrel). For tops one number mixes two things: how the piece is cut, and whether it's his size (#164).
- **What moves points** (parts engine v13, `extraction-test/rubrics/parts_proto.py`, ported in `@kitted/core` `parts.ts`). Only steady groupings are used: a top or layer is **roomy (4–5) or not**; 4 vs 5 and 1 vs 2 never move points (#217). A bottom read "straight" at volume 2 or less is judged slim (v12 `_leg`).
  - Proportions: a roomy top over skinny legs −1.5 (PF5); "roomier than the look" −1.5 (PB1, #217: a roomy top worn on its own outside every band of the looks the outfit reads as; not when it's tucked or ends at the belt over a full leg, under a layer, over pressed trousers, over loungewear, or when FF5 or SX1 already charged); a slim leg −1.0, skinny −2.0 (PN1); the streetwear shape (PR4) and the waist credit reward a boxy or short top over wide jeans.
  - Fit: a roomy, non-tailored piece with sleeves over the hands costs 0.5 since v8 ("the roomy hoodie's sleeves run past the wrists", FF5); a stack on loose jeans or cargos never costs (#221).
  - Style: an oversized top with two dressy pieces (SX1, #214); an oversized graphic tee under a blazer (GT1).
  - **So "on purpose" vs "too big" is told apart only by the outfit around the piece** (the leg, the look, a tuck, a layer) plus one cue (sleeves past the hands). **There is no size reading:** a jacket a size big with its sleeves at the wrist costs nothing for its size.
- **Corrections today:**
  - "Not quite right?" (`app/src/features/correct/fields.ts`), per check: Fit for tops and layers (Slim 2 · Regular 3 · Relaxed 4 · Oversized 5) and Leg for bottoms (the five). It re-scores that check with a before and after, and the closet service also sets the field on the linked piece and marks it confirmed. His phone (Oct 15 pull): 4 corrections stored, all type taps; never a fit or leg correction.
  - The piece page's Fit and Leg rows (§17): they set the piece and never move a score.
  - The quick tap asks no fit questions (#122: people answer fuzzy fit questions in their own favour).
  - The closet matcher: a volume 3+ away from the piece's average costs −2; a leg 3 steps away (slim vs wide) vetoes the match unless he taught it (`closetIdentity.ts`).

### 18.2 How steady the readings are (from saved results; no new spend)
Script `extraction-test/bagginess_steady.py`, output `extraction-test/results/bagginess1/steadiness.txt`.
**Rule 7:** every photo here is **profile unknown**. His own profile isn't set yet (the phone's profile row has no birth year and no looks; his to-do list), and the gold, stock and Reddit photos have none. All were scored with one stated test profile: no picked looks, Everyday (a pick never changes a number, #211). So no split by age band or picked look is possible yet; the split is by source. Re-run once he gives his profile.

**The same photo, read 2–3 times** (the shipped reading with close-ups: zoom1 and zoom1-stock arm B, gold1):

| Source | Tops: roomy call same | Layers | Legs: exact | narrow vs not | loose vs not | Score moved by these flips alone |
|---|---|---|---|---|---|---|
| His photos (16 tops, 15 bottoms) | 100% | 100% | 67% | 87% | 73% | 3 of 14 (21%) |
| Instagram (gold) | 96% | 95% | 85% | 100% | 96% | 4 of 125 (3%) |
| Pinterest (gold) | 100% | 96% | 81% | 96% | 91% | 5 of 69 (7%) |
| Reddit (gold) | 100% | 100% | 81% | 95% | 86% | 1 of 21 (5%) |
| Stock | 100% | 94% | 87% | 95% | 95% | 0 of 39 |
| Stock mirror selfies | 100% | 100% | 75% | 100% | 75% | 0 of 12 |

"Score moved": run 2's reading scored once as read and once with run 1's volume and leg put in.

**Photos of the same piece** (his phone closet; 20 tops and layers and 6 bottoms seen in 2+ checks):
- Tops: the roomy call agrees on 19 of 20. The one: his black tee, roomy (4) in 4 checks and fitted (2) in one.
- Bottoms: 5 of 6 keep one leg. His mid-wash jeans (9 checks, including a merged duplicate) read slim 3 times, straight twice, relaxed once and wide 3 times, every time "clear". Either the reading can't hold that pair's leg across photos, or two pairs were merged; the app can't tell which.
- This overstates steadiness: the matcher splits a piece whose leg reads 3 steps off, so a pair read wildly may already sit as two tiles.

**Is it right?** (Claude's blind labels in `leg_labels.csv`, every run counted): the exact leg is right on 56% of his photos, 72% of stock and 77% of mirror selfies; narrow vs not 80% / 87% / 60%; loose vs not 67% / 80% / 83%. On Fashionpedia's 90 pants, slim vs straight 75% (#223). **Volume has never been labeled: there is no truth for it.**

**How sure is it?** The reading's own `certainty` doesn't predict a flip: tops read "clear" flip the roomy call 2% of the time, "likely" 1%; bottoms 5% and 5%. Flips cluster on overshirts (14%), knit polos (9%) and bombers (8%). So "how sure" can't come from the AI's flag; it has to come from repeats: the same piece read differently across his photos.

**How much it matters:** re-scoring each photo as if nothing were roomy and every leg straight changes 20% of his checks, 26% of stock, 33% of Pinterest and 53% of Instagram (where boxy tops and wide legs earn the shape credits). Bagginess is one of the engine's biggest levers.

**What the judges say** (the gold panel, #224): a roomy top over a loose leg gets the panel's best Fit, 7.6 (38 photos); a roomy top over a slim or straight leg the worst, 5.5 (6 photos); regular tops 6.6–7.4. So for the judges too, the shape around a piece is what makes big read as intended, which is what PB1 and PR4 already do. 30 of 225 photos (13%) have 2+ judges calling a piece swamping, shapeless or a size big, and only 7 of those had a top read roomy: most are hems swallowing the shoes (the stack, which the reading can't see, #273), long shorts or a shapeless blazer. **A size fault isn't in `volume`.**

**In short:** the same photo reads steadily enough for the groupings scores use (tops 94–100%, legs narrow vs not 87–100%), weakest on his own photos' legs (straight, relaxed and wide trade places). The leg is often wrong in detail (56–77%) and roughly right on narrow vs not. Whether a piece is a size big isn't read at all.

### 18.3 Recommended decisions (ranked; Claude's default first)
**(a) Oversized on purpose vs a size too big**
1. **Default, now: judge "roomy" by the outfit around it, never the piece alone, and never call a piece "too big" from volume.** That's today's engine (PB1, PR4, PF5, SX1, FF5 at 0.5) and what the judges do (7.6 vs 5.5 above). The piece page's Fit words describe the cut ("Oversized" means cut big), never how it sits on him. No score moves.
2. **After the size-ladder shoot: two garment cues in the reading,** as #164 planned: `shoulder_seam` (on the shoulder · just past · down the arm) and `ribbed_hem` (a banded hem at the hips). Code decides, never the AI: **cut big** = the seam just past or down the arm with a short or banded body; **a size big** = the seam down the arm with a long body and sleeves past the hands, or a jacket whose sleeves cover the hands. A size big costs on Fit in every look; a cut that's big on purpose is judged only by proportion, as now. Each cue must pass the flip test (90%+ the same over 3 runs, about $2, his OK) and the ladder (80%+ right), or it stays a tip with no points.
3. **"Runs big / Fits / Runs small" as a piece fact** (about the garment's size, no body word): not in v1; it comes with option 2, when a size rule exists to use it.
- **Rejected:** asking the AI "oversized on purpose?" (the same guess as volume, `rubric/research/notes/v5-fit.md`); measuring a garment's width against his body (it would rate bodies; never, #164); the body ruler for widths.

**(b) When to ask, when to guess**
1. **Default: never ask about fit or leg before the score** (#122 stands). Flips that move a score are rare on public photos (3–7%), and an answer about his own fit carries his hopes. The photo's reading scores; "Not quite right?" stays the correction for one check, with its before and after.
2. **Ask on the piece, afterwards, only when its own photos disagree.** A piece seen in 3+ checks whose readings fall in different groups that scores use (tops: roomy or not; bottoms: narrow, straight or loose) shows **"Not sure"** on its Fit or Leg row ("Seen as slim and as wide. Which is it?"), and Closet's To confirm holds at most one card, "How do your mid-wash jeans fit?", with §17's picture sheet. Never on the score card, Skip keeps it quiet until a new photo disagrees again, and a pick confirms the piece by §17's rules without moving a score. This is the "how sure" signal: repeats, not the AI's flag.
3. **Rejected:** a tap before the score on the leg (a rare score effect, his hopes in the answer); a question on every new piece (noise: 19 of 20 tops already agree).

**(c) Should a fit he set on a piece feed a new check's score?** It moves scores, so it's his call.
1. **Default: yes, but only through a question, never silently, after his OK and a paper test.** When a new photo's piece matches a piece he set (a known piece, #126's rules), the photo's fit or leg falls in a different scoring group from his setting, and his setting would move the score by 0.5 or more, the card asks before the score, the way "Your grey work boots?" does: **"Your mid-wash jeans?"** with the piece's drawing, Yes / No. Yes scores with his setting (the Why sheet row says "Leg: straight, from your closet"); No scores the photo as read (it may be another pair). The answer is stored on the check like every tap answer, so the same photo keeps the same score and a re-check reuses it. Old checks never move.
   - **Why:** on his photos the leg is exact only 56% of the time, and his word about his own jeans is likely better; the question catches a wrong match (the mid-wash case: if two pairs were merged, he says No); it reuses a question he already knows; nothing changes without him seeing it.
   - **His hopes:** he sets the piece on a screen that says "Your scores stay the same" with no score in sight, so there's no pull toward the flattering value (BG4 keeps any number off that sheet).
   - **Limits:** one question per check (today's cap; the larger swing wins a tie), never at Gym or Home.
   - **Build:** after PR #5, about 1 day, behind a switch that ships off (`CLOSET_FIT_FEEDS_SCORE`). His Leg wins over the v12 "fitted straight is slim" rule; a Fit sets volume to its value (Slim 2, Regular 3, Relaxed 4, Oversized 5).
2. **Use his setting silently whenever the piece matches** (rejected: a wrong match would move a score with no sign of why).
3. **Never** (today's §17 rule): honest, but it leaves the 56% leg reading in charge of his own jeans for good.

**(d) Truth needed, and what ships before it**
Truth, most useful first:
1. **His own picks on the piece page,** free from PR #5 on: each Fit or Leg he sets labels every earlier photo of that piece. The phone already keeps both; `tools/phone/pull.sh` copies them and the script above measures the AI on his own clothes. No shoot needed, and nothing new leaves the phone.
2. **The size-ladder shoot** (P2 on his list, ~45 min with a friend): the same tee, hoodie and jeans in 2–3 sizes each, plus one piece cut oversized on purpose, mirror and propped. The only truth for "a size big" vs "cut big", and the gate for (a)2.
3. **The gold set's one-outfit variants** (P1): slim vs straight jeans with the same top, in his own light.
4. Fashionpedia's leg labels (done, #223): legs only.

**Ships before any of it, no score moves:** §17's Fit and Leg rows; (b)2's "Not sure" row and the one To confirm card; the measuring in (d)1; the paper test for (c)1 on his saved checks. **After the ladder:** (a)2's cues and the size rule, the "Runs big" piece fact, and fixes like "Try a size down in the tee" and "Have the sleeves shortened".
**Never:** a word about his body, a width measured against him, or a fit word not about the garment ("oversized tee", "runs big"; never "big on you" or "your frame").

### 18.4 What he'll see, once built
- **The piece page** (on top of §17): a row whose photos disagree reads "Leg · Not sure ›" with "Seen as slim and as wide. Which is it?"; a pick settles it ("Changed to straight leg. Your scores stay the same.").
- **Closet → To confirm:** "How do your mid-wash jeans fit?" with the drawings, one card at a time.
- **Only if he OKs (c):** a new photo of those jeans read wide asks "Your mid-wash jeans?" before the score; Yes scores them straight, and the Why sheet row says "from your closet".
- **New words to skim:** "Not sure", "Seen as {a} and as {b}. Which is it?", "How do your {item} fit?" / "How does your {item} fit?", "from your closet".

### 18.5 Pass/fail checks (written before building; the build must not edit them)
**Group 1, after PR #5, no score moves (about half a day):**
- **BG1 (T)** "Not sure" shows on a Fit row exactly when the piece's own unconfirmed readings from 3+ checks include both roomy (4–5) and not (3 or less), and on a Leg row exactly when they span 2+ of narrow (skinny, slim) · straight · loose (relaxed, wide, barrel); never once he has set it; never with 2 checks or fewer.
- **BG2 (T)** Closet's To confirm holds at most one fit card, the piece with the most checks first; Skip hides it until a new photo of that piece disagrees again; never on a score card.
- **BG3 (T)** A pick from the row or the card writes exactly what §17's pick writes (X3); every fit check's score, raw score, parts, reading and closet summary are deep-equal before and after (X9).
- **BG4 (T)** The Fit and Leg sheets show no score, number or "+N".
- **BG5 (T)** Every new string passes the copy checks and the body-words test; no option or line says "on you", "your body", "frame" or "big on you".
- **BG6 (T)** `bagginess_steady.py`, run on a pull with piece-page picks, reports the reading's roomy and leg accuracy against them, by source and, once his profile exists, by his age band and looks.
**Group 2, (c), only on his OK, behind `CLOSET_FIT_FEEDS_SCORE` (about 1 day):**
- **BG7 (T)** The paper test comes first, before any app code: on his saved checks with his piece picks applied, how many would ask (target: 1 in 5 checks or fewer) and every score that would move, listed before and after for him.
- **BG8 (T)** The question asks only when the piece is a known piece he set that field on, the photo's group differs from his setting's, the swing is 0.5 or more, the occasion isn't Gym or Home, and no other question is asked on that check (the larger swing first).
- **BG9 (T)** Yes scores with his value (Leg: the leg the rules judge, over the v12 fitted-straight rule; Fit: volume 2, 3, 4 or 5); No and Skip score the photo as read; the answer is stored on the check, and the same photo scored again gives the same score.
- **BG10 (T)** Switch off: no score anywhere differs from today (G2, parity). Switch on: every old check is deep-equal.
- **BG11 (T)** The Why sheet row says "from your closet" whenever his value was used.
**Group 3, after the size-ladder shoot (its own plan then):**
- **BG12** `shoulder_seam` and `ribbed_hem` each read the same on 90%+ over 3 runs and right on 80%+ of the ladder, or they stay tips.
- **BG13 (T)** No rule reads a garment's width against the body (a test checks the engine takes no pose widths).

**Order from here:** Group 1 once PR eyualem/kitted#5 (the piece page's rows) is merged; then BG7's paper test, which needs a few of his own piece-page picks first; Group 2 only after he has seen that before/after; Group 3 after the size-ladder shoot.

### 18.6 His calls: decided Oct 16 (founder: "i agree with you recommendations"), all four defaults
1. **(c) Decided:** his setting feeds new scores only through the "Your …?" question, behind `CLOSET_FIT_FEEDS_SCORE`, built only after BG7's paper test is shown to him (not chosen: never · silently).
2. **(b) Decided:** the "Not sure" row and at most one To confirm card; never a fit question before the score (not chosen: the row only · neither).
3. **(a) Decided:** "on purpose vs too big" stays judged by the outfit around the piece; size faults wait for the size-ladder shoot (not chosen: the ~$2 cue test now).
4. **The new words (18.4) decided:** as written.

### §18 results, Group 1 (Oct 16, #316): checked against BG1–BG6, none changed
Built on PR eyualem/kitted#5's branch (the piece page's rows), so this PR goes in after #5. On the iOS Simulator (iPhone 17 Pro, a turn handed over by the chat session) on demo screens **194** (Closet, "How do your dark jeans fit?"), **195** (the dark jeans' page, Leg · Not sure) and **196** (the Leg picker): the demo jeans read slim, wide, wide and straight in four checks. Screenshots `screenshots/bagginess-oct16/` (git-ignored).

| Check | Result | How |
|---|---|---|
| BG1 | Pass (T) | `fitDoubt.test.ts`: his mid-wash jeans' 9 reads give "Seen as slim and as wide."; his black tee's 4, 4, 2, 4, 4 gives "slim and relaxed"; one group never (all narrow, all loose, 4 vs 5, flare = straight); never under 3 checks, a re-check of one photo counts once, seed and undone sightings never; never once set (piece page, "Not quite right?", a confirmed leg), never on shoes or shorts |
| BG2 | Pass (T, S) | one card, the piece in the most checks (then the newest photo, then the id); "do" for a pair, "does" for a top; Skip hides it and the next piece comes in; a newer photo that disagrees brings it back, an agreeing or older one doesn't; bad skip data reads as none; the skips stay on this phone (`closet.fitSkip`, local); only the Closet screen uses the card (a source scan). On the Simulator: the card, tap → the Leg picker, Straight → the card goes and the toast says "Changed to straight leg. Your scores stay the same.", Undo brings it back, Skip hides it (the web preview, the same code) |
| BG3 | Pass (T) | a pick writes what §17's pick writes (`editPlan`), and every fit check's score, raw score, parts, reading, sighting and closet summary are deep-equal before, after and after Undo. **Two changes to §17, said openly:** (1) on a Not sure row the value it read most is a real answer, so picking it writes (elsewhere picking the current value still writes nothing, X12 passes), and its sheet rings no option; (2) a Fit pick now lists `volume` in `confirmedFields`, as a "Not quite right?" fit correction already did, so a Not sure Fit goes for good; core reads only its matcher fields there. X3's fit test was amended for (2), with the reason in the test |
| BG4 | Pass (T) | no digit or "+" in any Fit or Leg option, the sheet's subtitle or a Not sure line; `EditSheet.tsx` draws no score, Numeral or outfit count |
| BG5 | Pass (T) | the six new strings are the OK'd words; each passes the chat's sentence gate and the body-words rule; `copyChecks` green |
| BG6 | Pass (T) | `bagginess_steady.py --db=<pull>` reports the reading against the Fit and Leg he set, with his age band and looks when set. On a copy of his Oct 15 pull with test picks (mid-wash jeans straight, black tee relaxed, born 2004, minimal + streetwear): legs 22% right on 9 photos, fit 80% on 5. The real pull has no picks yet ("none set yet") |
| G1 | Pass | `npm run check` steps: tsc, core tsc, lint clean, core tests, 1105 app tests in 87 suites |
| G2 | Pass | no file under `packages/kitted-core` changed; BG3's deep-equal |
| G3 | Pass (S) | 194–196 in light, dark and the largest text size. **Fixed:** at the largest size a row's "Seen as…" line sat between "Leg" and "Not sure"; it now comes after the value. Skip lines up with the question, not the drawing |
| G4 | | New words: "Not sure", "Seen as {a} and as {b}.", "Which is it?", "How do your {item} fit?", "How does your {item} fit?", and VoiceOver's "Opens the choices. Your scores stay the same." |
| Found | | `stylistContext.test.ts` failed on main: #311 added the weekday to the chat pack's "Earlier this week" lines and the test still expected the bare date. Fixed the test (its own commit) |

## 19. Bagginess on the fit-check card: plan and pass/fail checks, set before building (Oct 17, #322)
Founder (Oct 17): "Build X with the judges' fixes: the scored-fix rule first, then the card line that opens straight to that piece's Leg or Fit, the Outfits card, the answer log, and the stop-after-two cap." The verdict came from a debate (4 advocates, a rebuttal round, 3 blind judges; files in the session's shared notes, `bagginess-debate-*.md`, `judge-1..3.md`): X won 2 of 3 judges; Z (as built) won the integrity judge; the chat asking (Y) won none. It bends §18.6 call 2 ("never on a score card") with a statement, not a question; nothing asks before the score (#122 stands). Numbered §19 and #322: main holds #317–321 (first numbered #319, then #321; the composer fix, the gap audit and the large-text fixes took #319–321 the same day).

### 19.1 What he'll see
- **On a fit-check card**, when a piece in it is "Not sure" (§18: its own photos disagree), one quiet line above Why / Not quite right?: **"Not sure about your mid-wash jeans' leg? Tap."** (a top: "Not sure about your black tee's fit? Tap."). It shows whether or not a fix would move the score, so seeing it never says an answer pays. A tap opens "Not quite right?" straight on that piece's row, offering only the leg shapes (or fits) his photos of it showed, plus this photo's; then the live before and after, and Save.
- **The fix re-scores this check only** (the scored-fix rule): the toast says "Correction saved." The piece in Closet stays as it was and stays "Not sure" until he settles it on its page or the Closet card, with no score in sight.
- **The line stops for a piece** once he has tapped it once, or after it has shown on 2 checks without a tap. It never shows on Past chats' cards.
- **Closet → Outfits** shows the same single "How do your … fit?" card at the top (Pieces already does).
- **Nothing new is sent anywhere.** Every answer is logged on the phone next to what the photos read (for the paper test and to see drift toward the flattering answer).

### 19.2 The scored-fix rule (what changes in built code)
Today a "Not quite right?" Fit or Leg correction also sets the piece (its `garment`, `confirmedFields`, the sighting's `userConfirmed`) and can move the sighting to another piece when it conflicts with the piece's other photos. From now on, for the two scored bagginess fields (`volume`, `leg_shape`):
- the check re-scores exactly as today (its new corrected reading);
- the sighting's garment takes the corrected value (it is that photo's record), but not as confirmed (`userConfirmed` unchanged), so the matcher treats it as one more read;
- the piece's `garment`, `confirmedFields` and profile are unchanged, so `isSettled` stays false; the sighting is never moved (identity is "It's another piece…"'s job);
- the toast is "Correction saved." (no "Saved to your …"), and the sheet's "Updated in Closet" pill doesn't show for these fields.
Kind ("Wrong item") corrections keep today's behaviour.

### 19.3 Pass/fail checks (written before building; the build must not edit them)
- **BX1 (T) Scored-fix rule:** a Leg or Fit correction from "Not quite right?" changes the check's score and reading as before; the linked piece's `garment`, `confirmedFields`, `profile` and every other closet row are deep-equal before and after; the sighting's garment has the new value and its `userConfirmed` is unchanged; no sighting moves piece; every other check's score, reading and closet summary are deep-equal; the result names no piece (toast "Correction saved."). A Kind correction still sets the piece as today.
- **BX2 (T) It doesn't settle:** after such a fix on a "Not sure" piece whose photos still disagree, `fitDoubt` still returns Not sure; a pick on the piece page settles it (§18 BG3).
- **BX3 (T) The line:** a card shows it exactly when a garment of its current reading links (closet summary) to a piece `fitDoubt` calls Not sure, that garment has a Fit or Leg row in "Not quite right?" (not `certainty: 'unsure'`, not an accessory), the card isn't read-only, and the cap allows it; at most one line (the first such garment); its words are the two above with the piece's name lowercased; it doesn't depend on whether a correction would move the score.
- **BX4 (T) Straight to the row:** the tap opens `/sheets/correct/<check>?reason=detail&garment=<i>&only=<values>`; the sheet opens on that garment, and its Fit or Leg chips are only the values his photos of the piece showed plus this photo's read (legs mapped to the five, flare → straight, barrel → wide; fits to 2–5), in the usual order.
- **BX5 (T) The cap:** after one tap the line never shows for that piece again; shown on 2 different checks without a tap, it doesn't show on a 3rd; the same check shown again doesn't count twice; the cap lives in a local kv key.
- **BX6 (T) The answer log:** each of a piece-page pick (with where: the row or the Closet card), a line tap and a scored fix (Fit or Leg) appends one entry with the time, the piece, the field, the value (or none for a tap) and what that piece's photos read; at most the newest 300 are kept; the key is local, never synced.
- **BX7 (T, S) Outfits:** the single fit card shows at the top of Outfits and of Pieces (the same piece); Pieces' "Same as your …?" questions stay on Pieces only.
- **BX8 (T) No other score moves:** core has no diff; with no "Not sure" piece the card renders exactly as before.
- **BX9 (S) On the Simulator** (a new demo screen: a check of a piece whose photos disagree): the line, a tap opening the sheet on the jeans with only their seen legs, Save, the toast; Outfits with the card; light, dark and the largest text size, nothing clipped.
- **BX10 (T) Words:** the new strings pass the copy checks, the sentence gate and the body-words rule.
- **G1–G4** (§6) apply.

### §19 results (Oct 17, #322): checked against BX1–BX10, none changed
Demo screens **201** (a check of s12 whose mid-wash jeans read slim, wide and wide in earlier photos), **202** (Closet → Outfits with the fit card) and **203** (the sheet the line opens). Seen on the iOS Simulator (iPhone 17 Pro, a turn from the large-text session) and on the web preview. Screenshots `screenshots/bagginess-oct17/` (git-ignored).

| Check | Result | How |
|---|---|---|
| BX1 | Pass (T) | `fitLine.test.ts`, on the real fit-check and closet services: a Leg fix on s12's jeans takes the check to the new read; every closet row deep-equal; the sighting has the new leg with `userConfirmed` unchanged; nothing moves piece; another check deep-equal; no piece named. A Fit fix on the hoodie: same. A Kind fix still sets the piece |
| BX2 | Pass (T) | the jeans stay Not sure after a scored fix; a piece-page pick settles them |
| BX3 | Pass (T, S) | the line names the piece ("Not sure about your mid-wash jeans' leg? Tap."); none on a check with no Not sure piece, on a garment read `unsure`, or once settled; the line's code never reads a score; the card passes `readOnly` |
| BX4 | Pass (T, S) | the href carries `only=slim,straight,wide` (this photo straight, earlier slim, wide, wide); `limitTo` keeps the usual order; on the Simulator and the web the sheet opens on the jeans with Slim · Straight · Wide only. Picking Slim showed 7.0 → 6.5 and no "Updated in Closet" pill; Save gave "Correction saved.", the card read 6.5 and the line was gone |
| BX5 | Pass (T) | one tap stops it; 2 untapped checks stop a 3rd; a check it showed on keeps it; the same check doesn't count twice; `closet.fitLine` is local |
| BX6 | Pass (T) | a scored fix, a line tap and a Closet-card pick each add one entry (`via: 'card'`), with the photos' reads before the answer; the newest 300 kept; `closet.fitAnswers` is local |
| BX7 | Pass (T, S) | Outfits draws the same one card; "Same as your …?" stays on Pieces |
| BX8 | Pass (T) | no Not sure piece: no line; `packages/kitted-core` untouched |
| BX9 | Pass (S) | 201–203 in light and dark, 201 and 202 at the largest text size: the line wraps inside its pill, nothing clipped |
| BX10 | Pass (T) | the four new strings pass the sentence gate and the body-words rule |
| G1 | Pass | `npm run check` steps: tsc, core tsc, lint, core tests, 1167 app tests |
| G4 | | New words: "Not sure about your {owner} leg?", "Not sure about your {owner} fit?", "Tap.", VoiceOver "Opens Not quite right? for this piece." |
| Amended | | Two older tests expected a Leg fix to set the piece ("Saved to your tan chinos"): `closetService.test` now shows the patch-in-place path with a Kind fix; `fitCheckService.test` expects the piece left as it was. Both say why in the test |
| Found | | Picking the honest leg can cost points (Slim took the demo check from 7.0 to 6.5), which cuts against the worry that the line only invites flattering answers; the log will show what he actually picks |

---

## 20. What's missing right now: the whole-app gap audit (Oct 17, #320)

**What this is.** Founder, Oct 17: "go through the app and try to find things that are missing right now." Five read-only agents went through the code area by area: Stylist; Closet and Lookbook; You, onboarding and the paywall; the release plumbing; navigation and dead ends. Each was compared against 02, 05, 07, 10 and this file. Nothing was built or changed. I re-checked by hand the items marked ✔. Paths are under `app/src/` unless they start elsewhere.

Each item carries who it needs: **[code]** Claude can fix it alone; **[you]** it needs an account, money, a package or an outward-facing OK.

**The headline.** On his phone (a dev build through Metro) the app is close to whole. But a TestFlight build today can't score a photo or answer a question, ships the demo tools, and has never been built. That is the real gap to the Nov 3 beta, and most of it is on the to-do list already (Cloudflare, $99). Items 20.1–20.3 below are not on it.

### 20.1 Blocks the beta: a tester's build doesn't work
1. ✔ **No server exists.** There's no Worker, no wrangler config, no `/v1/score` or `/v1/ask` client; the only server code is `firebase/functions` (account deletion, not deployed). In a build without `__DEV__` the Gemini key is undefined (`services/readingSource/live.ts:10`, `closetSource/live.ts:10`, `ask/liveSource.ts:13`).
   - A real photo then falls to the mock and fails: "This demo only knows its sample photos.", with no Try again (`readingSource/mock.ts:88`, `stylist/cards/FitCheckCard.tsx:164-170`).
   - Every question gets "Questions are coming soon. For now I can check your fit…", which isn't true either (`ask/session.ts:36-41`).
   - Daily limits live only in the phone's SQLite (`services/quota.ts:1-4`), so a reinstall or a clock change resets them.
   - There's no $3/day spend stop (`app-build-spec.md:243`), and the "paused" line can never fire. `online()` is hard-wired to true (`ask/pipeline.ts:70,136`).
   - App Attest isn't built, even log-only.
   - [you: Cloudflare account] then [code]: the Worker, the proxy sources, server-side limits and the kill switch.
2. ✔ ✅ **Done (#323, §20.7 R3).** ~~**Fake demo readings would leak into real checks.**~~ With no key, the mock answers *any* shoe snap or pants-and-shoes snap with a canned demo reading (`readingSource/mock.ts:64-65`). A tester's real snap would merge someone else's shoes into his score. [code] In a non-demo build the mock must refuse every snap.
3. ✔ ◐ **Mostly done (#323, §20.7 R1):** demo off by default in Release, `guard:release`, a local Release build booted. Still open: the dev launcher's local-network strings, and the paid team. ~~**No safe release build.**~~
   - The demo tools are on unless `KITTED_DEMO=0` (`app/app.config.ts:4`), and nothing sets that: no `eas.json`, no release script, and `tools/phone/install.sh:11` builds Debug.
   - The `guard:release` script promised in 05 §P8 (`05-build-plan.md:679`) isn't in `package.json`. As written it would always fail anyway: the Firebase key is also `AIza…` and is bundled on purpose.
   - No Release build has ever been made, so minifier, Hermes and `__DEV__` surprises are untested.
   - The dev launcher's local-network strings ship in `Info.plist` (`NSLocalNetworkUsageDescription` "Expo Dev Launcher…", `NSBonjourServices`).
   - [code] for the script, the default and a local Release build on the Simulator; [you: $99 program] for the paid team and App ID (`app.config.ts:22-24`, still the Personal Team `6652QVRQAL`).
4. ✔ ✅ **Done (#323, §20.7 R1–R2):** the paywall route needs `paywallOn()`; Release builds have no demo tools, so no `?resetData` or demo links. ~~**Two deep links do damage.**~~
   - `kitted://paywall/plans` opens the paywall on any build: its route is guarded only by age and onboarding (`app/_layout.tsx:89`), not `PAYWALL_BUILT`. The mock "purchase" then turns on Pro until the app restarts (`services/purchases.ts:58-66`, `services/entitlements.ts:21`).
   - In any demo-enabled build, `?resetData=1` wipes the real store and the age block (`state/boot.ts:52-55`), and `kitted://demo/screen/N` wipes it and loads demo data (`demo/prepareDemoScreen.ts:271`).
   - [code] Guard the paywall route by `paywallOn()`; demo off in release (item 3).
5. ✔ **Consent doesn't match what's sent.**
   - Questions go with height, build, picked looks, budget and saved facts (`ask/context.ts:166-181`). Consent says only "plus the clothes in your closet" (`en.generated.ts:93`), and `CONSENT_VERSION` is still `'1'` (`onboarding/complete.ts:18`).
   - It still says "face cropped out or blurred" (`:91`), and the generated plist camera string says "cropped out" (`:713`; `app.config.ts` has the right one).
   - The privacy manifest declares no collected data (`ios/Kitted/PrivacyInfo.xcprivacy`, `NSPrivacyCollectedDataTypes` empty). The privacy-label plan in `inputs/app-store-and-age-rules.md` §4.1 says height and build never leave the phone, which is no longer true.
   - [you: OK D2 and #233 item 3, outward-facing] then [code]: the words, the version bump (everyone sees consent once more), and the manifest.
6. **No way to hear from testers.**
   - `SUPPORT_EMAIL` is null, so "Report a wrong score" and "Contact support" are hidden (§1 item 13).
   - There's no crash or error reporting: no Sentry or Crashlytics, no ErrorBoundary, no global error handler. Logs go to Metro and dev-only files.
   - If a tester's check fails, he only learns of it if they tell him.
   - [you: an email] and [code]: an error boundary now, and failure logging in the Worker. A crash-reporting package needs [you].
7. **The beta is free-tier only.** Pro is an in-memory demo flag and the paywall is off, so testers get 1 check and 5 questions a day with no way up. [you] Decide: a beta allowance set on the server (default: testers get Pro's limits during the beta), or accept it.

### 20.2 Looks real but does nothing (fix before the beta; all [code] unless marked)
8. ✔ ✅ **Done (#323, R4).** ~~**A failed scan says "Saved."**~~ `save()` shows success with `Math.max(saved, 1)` even when every photo failed (`scan/ScanCameraScreen.tsx:132-146`).
9. **Closet "+" leads only to "coming soon."** Scans are never read into pieces, and nothing reads `scan.inbox` but its own row (`scan/inbox.ts`, `closet/addActions.ts:13-16`). It's the tab's only header button. Until the item reading exists (it needs the server): put Starter basics first in "+" and keep scanning as "Save for later".
10. ✔ ✅ **Done (#323, R5): the row is hidden.** ~~**Settings › Notifications has 3 switches that do nothing.**~~ The row shows whatever `NOTIFICATIONS_BUILT` says (`you/settings.tsx:47`), and nothing schedules anything. The screen says "That's all I send." Hide the row until `expo-notifications` [you].
11. ✅ **Done (#323, R5): hidden with the paywall.** ~~**Subscription and "Restore purchases" show with nothing to buy.**~~ `settings.tsx:58-61`, `you/plan.tsx:56`; Restore always says "No purchases to restore." (`settings/plan.ts:81-87`). Hide them with the paywall.
12. **"Wear this" changes nothing he can see.**
    - It writes the wear log only (`closet/outfitActions.ts:15-29`, `morning/service.ts:287-299`). Worn ×N, Last worn and Your go-tos count fit checks only (`closet/service.ts:387,419,438`, `closet/outfits.ts:126-140`).
    - The log keeps one row a day (`data/migrations.ts:127-132`), so a second Wear this replaces the first silently.
13. ✅ **Done (#323, R6): rows open the piece page.** ~~**"Added to your closet" says "Fix anything I got wrong." but its rows are dead.**~~ `EDIT_ITEM_BUILT = false` (`added/AddedSheet.tsx:27,193`), though the piece page has had "What it is" since #315. Point each row at its piece page; the existing `onEdit` pushes no `?field=`.
14. ✔ ✅ **Done (#323, R7).** ~~**A re-check or snap whose first check is gone closes the camera silently.**~~ `noParent` (`fitcheck/service.ts:661`) has no case in `explain()` (`camera/startCheck.ts:157-179`).
15. **A scored re-check card has no "Why X?" and no "Not quite right?"** (`stylist/cards/RecheckCard.tsx:161-176`). After a drop he can't see why or correct a misread.
16. **A dialed-in card (9+) has no next step.** With no fixes and Save and Share switched off (`FitCheckCard.tsx:44-46, 439-447`), the action row is empty.
17. **"How I score" still explains credits** (§1 item 8, #233 item 1). Waits on [you: #233 OK].
18. **No offline handling.** `banner.offline` and `banner.online` are unused, send is never disabled, and offline questions get the generic "I couldn't answer that". The photo caption is always "Not scored" (`stylist/MessageView.tsx:130`), and `fail.cap.notSent` is unused.
19. **Saying "that score is wrong" in chat can't open "Not quite right?"** The router detects it (`ask/router.ts:25`), but no card type opens the sheet (`ask/cards.ts:14-21`).
20. ✅ **Done (#323, R8): 500 characters.** ~~**Questions have no length cap.**~~ No `maxLength` (`stylist/Composer.tsx:222-240`), and the whole text goes into the prompt. That's a cost risk once the server pays.
21. ✅ **Done (#323, R9).** ~~**Past chats aren't fully read-only.**~~ An old evening card's occasion picker still edits (`MessageView.tsx:39` renders `MorningCard` without `readOnly`; `MorningCard.tsx:312-326`). Tapping a past day's checked morning row re-pushes the same page (`StylistScreen.tsx:225-227`).
22. **He can't delete one photo or one check.** The look page's ⋯ (Save, Share, Delete photo) isn't built (`lookbook/LookPageScreen.tsx:10`), and "Remove from Lookbook" keeps the file. The only way out is "Delete all photos". Privacy expectation: H.
23. **"Not now" on consent leaves a bare thread.** The S26 "Turn on fit checks" card isn't built (`noConsent.title` unused, `onboarding/complete.ts:27`).
24. **The empty Closet has no "Tap the basics you own."** It offers only "Check my fit" (`app/(tabs)/closet/index.tsx:82-85`). Starter essentials is reachable only from "No outfits yet" or Your moves, and with 1–2 pieces the "Add shoes and you'd have N outfits" hint sits on the hidden Outfits half (`closet/outfits.ts:151-155`).
25. ✅ **Done (#323, R10): a toast with Undo.** ~~**A "Same as your …?" answer in Closet just vanishes:**~~ no toast, no Undo (`app/(tabs)/closet/index.tsx:107`).

### 20.3 Missing pieces a user will expect (decide or schedule)
26. **Adding a piece by hand** beyond the 12 Starter basics: "Describe it" (C4d) is a placeholder nothing links to (`app/sheets/describe.tsx`). With 1 free check a day, the closet fills slowly.
27. **The share card** (S12, P6; `SHARE_CARD_BUILT = false`; `app/share/[checkId].tsx` is a placeholder). It's the before/after video asset for his daily posts.
28. **The Lookbook calendar and "Days dressed"** (D16; only filters and Saved were deferred). Logged wear days show nowhere.
29. **The Pieces grid** has no order or sections: newest first, kinds mixed, no Tops/Layers/Bottoms/Shoes chips at 12+ (`closet/merge.ts:14-17`).
30. **In the thread,** a new answer can land off-screen with no "Latest" pill, and there's no Stop while an answer streams (07 §6.1).
31. ✅ **Done (#323, R11): "This isn't here anymore." and `+not-found`.** ~~**Missing records give blank screens.**~~ These show an empty page or only a title: the look page, piece page, photo viewer, past day, and the Why, Correct, Added, Tell me, Edit, Merge and Fact sheets (Pick shoes is fully empty). There's no `app/+not-found.tsx`, so a bad link shows Expo's "Unmatched Route".
32. ✅ **Done (#323, R12): five deleted, the share card's route guarded.** ~~**Six placeholder routes show spec IDs**~~ ("S12 · Share card / Placeholder. Built in P6.") if a link reaches them: `share/[checkId]`, `shoe-snap` (replaced by `camera?mode=shoeSnap`), `sheets/describe`, `sheets/looks-by-name`, `sheets/rotation`, `sheets/swap/[ideaId]`. Delete or guard them.
33. **A wrong birth year can't be fixed.** "Birth year can't be changed here." points nowhere (`you/profile.tsx:84-90`). An age block survives Delete all my data and has no contact line (`onboarding/AgeStopScreen.tsx`). The check uses the year only, so someone born in late 2008 passes at 17; Declared Age Range is the real check.
34. **Location, once denied, can't be turned back on.** The weather ask shows only for `unknown` (`morning/MorningCard.tsx:177`).
35. **Morning-card Swap** never says "Nothing else in your closet works here yet." It leaves out only the last swap, so the original can come back (`morning/service.ts:278-284`).
36. **Chat outfit tiles and the buy card don't open anything.** `OutfitTiles.tsx` has no onPress. `BuyCard` could open the next-buy sheet, which exists.
37. **Performance at hundreds of pieces is unmeasured.** Outfits score every top × bottom × shoes on the JS thread several times per change (`closet/outfits.ts:82-94, 233-243`; `PiecePage.tsx:100`). The grid and Lookbook aren't virtualized, and Lookbook loads full photos for 50 pt thumbnails (`lookbook/index.tsx:207`). Beta closets are likely fine.
38. **Nothing to keep the code honest between sessions:** no CI (`.github/` doesn't exist), no end-to-end tests (Maestro, 05 §P7), no remote off-switch, no forced update.

### 20.4 Blocks submission (~Nov 14), already on the to-do list
- The 3 links (privacy policy, terms, support). App Store Connect also needs a Support URL page.
- Declared Age Range: not built. It needs iOS 26.4's API while the target is 26.0.
- Real purchases (RevenueCat), Pro checked on the server, Pro kept across launches, "Redeem a code".
- Sign in with Apple once Google ships (4.8). Account deletion: `requires-recent-login` has no re-sign-in path, and the server `deleteAccount` needs App Check, which the app doesn't set up.
- The trial line promises a reminder 2 days before it ends, which needs notifications.
- The privacy label and review notes are stale: they still say yearly with a 14-day trial, and the example is no longer on the camera.
- If the chat moves to OpenAI: consent, the promise, the provider name and the label all change.
- A report path for chat answers (long-press → mailto) once the support email exists.

### 20.5 This file's own drift
§2 items done in code but not ticked: the "+" pull-down menu (`closet/AddMenu.ios.tsx`), the Lookbook score in Archivo, and the closet's 3-question cap (`closet/toConfirm.ts`).

### 20.6 What I'd do, in order
1. **[code], about a day, no founder input:** items 2, 3 (script, default and a local Release build on the Simulator), 4, 8, 10, 11, 13, 14, 20, 21, 25, 31, 32. These make a release build safe and remove things that lie.
2. **[you] this week:** the Cloudflare account (already P1), a support email, OK D2 + #233 so consent matches, and the beta allowance call (item 7).
3. **[code] after Cloudflare:** the Worker (score, ask, closet read, limits, kill switch, failure log), then the proxy sources, then a TestFlight dry run after the $99 program.
4. **[code] before the beta:** items 9, 12, 15, 16, 18, 19, 22, 23, 24, 26.

### 20.7 Step 1 built: the release-safety batch (Oct 17, #323). Checks first
Written before the code. Each passes or fails; the results are under each group once built.

**R1 · A release build is safe**
- R1.1 With `KITTED_DEMO` unset, the demo tools are on in a Debug build and **off in a Release build** (`__DEV__` false); `KITTED_DEMO=1` turns them on in Release (the Maestro demo build, 05 §P7), `KITTED_DEMO=0` off everywhere.
- R1.2 `npm run guard:release` exists. It makes a production iOS export and fails when the bundle holds: any `AIza…` key except the Firebase web key (bundled on purpose), the dev Gemini key's exact value, or any other secret value from `app/.env*` (the OpenAI and Anthropic test keys); and when the config with `KITTED_DEMO` unset turns the demo on.
- R1.3 The guard passes on today's code (run, result recorded below).
- R1.4 One local Release build boots on the Simulator: Stylist opens, there's no dev menu, and `kitted://demo/screen/7` doesn't open a demo screen.

**R2 · The paywall can't be reached while it's off.** The `paywall` route is registered only while `paywallOn()`; `kitted://paywall/plans` on a real build goes nowhere, so no mock "purchase" can turn on Pro.

**R3 · No canned demo reading in a real check.** The mock reading source answers a shoe snap or a pants-and-shoes snap with its canned reading only for a bundled sample photo or on a demo screen; a real photo's snap gets `unknownPhoto` (nothing counted, nothing merged).

**R4 · A failed scan never says "Saved".** When no photo was saved, the scan camera says so ("Couldn't save that photo. Try again.") and stays open; with some saved, the count is the real count.

**R5 · Settings hides what does nothing.** You › Settings shows no Notifications row while `NOTIFICATIONS_BUILT` is off, and no Subscription section (Manage, Restore) while the paywall is off; Plan & usage shows no Restore while it's off.

**R6 · "Added to your closet" rows open the piece's page** (no `EDIT_ITEM_BUILT`): a tap (and VoiceOver's action) closes the sheet and opens `/closet/item/<id>`; an undone row stays inert.

**R7 · A re-check whose first check is gone says so:** `noParent` shows "That check isn't here anymore. Nothing was sent or counted."

**R8 · A question has a length cap:** the composer's field takes at most 500 characters, and the send path cuts anything longer (dictation) to 500.

**R9 · Past chats are read-only:** an earlier day's "Staying in" card shows its occasion as plain text (no picker), and its "You went with your own" row isn't a button (it pushed the same day again).

**R10 · A "Same as your …?" answer in Closet gets a toast with Undo:** "Saved as your {item}." or "Kept as a new piece."; Undo puts the question back exactly as it was (closet service `unanswer`, an urgent Undo like the others).

**R11 · A missing record shows "This isn't here anymore."** instead of a blank screen: the look page, the piece page (not while a merge moves it), the photo viewer, a past day, and the Why, Not quite right?, Added, What changed?, What it is, Same as which piece?, Fact and Which shoes? sheets. A bad link shows the same page (`app/+not-found.tsx`) with "Go to Kitted".

**R12 · No placeholder route ships:** `shoe-snap`, `sheets/describe`, `sheets/looks-by-name`, `sheets/rotation` and `sheets/swap/[ideaId]` are deleted with their registrations; `share/[checkId]` (linked behind `SHARE_CARD_BUILT` and demo screen 20) is registered only while that flag is on or the demo tools are.

**R13 · Nothing else moves:** `npm run check` green; consent copy untouched.

**Results (Oct 17): all pass.**
- R1.1–R1.2, R2–R12 in `app/src/__tests__/releaseSafety.test.ts` (41 checks) and the Undo story in `closetService.test.ts`; `npm run check` green, 1,202 app tests.
- R1.3: `npm run guard:release` passed on today's code: one 6.9 MB Hermes bundle, 3 secret values and every key shape checked; its only `AIza` string is the Firebase key.
- R1.4: a local Release build booted on the Simulator: Stylist with the saved data, no dev menu; `-demoScreen 7` and `kitted://demo/screen/7` both gave plain Stylist with nothing wiped; `kitted://paywall/plans` opened nothing; `kitted://closet/item/NOPE` showed "This isn't here anymore."; Settings had no Notifications, Subscription or Restore. Then the Debug app went back on and the Simulator was shut down.
- R6 seen on the Debug build: demo screen 21, a tap on Tan chinos closed the sheet and opened its page on "What it is".
- Not seen on a screen, tested in code only: R4's panel, R8's stop, R9, R10's toast.
- Screenshots: `screenshots/release-oct17/` (git-ignored).
