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
| N5 | Pass on web (S) | demo 182: the card under the count; the sheet (`/sheets/next-buy`, replacing the C7 placeholder): +16, $50–60, six unlocked outfits with the jeans dashed, Got it; light and dark. **Not yet on the Simulator** (the Mac was low on memory) |
| N6 | Pass | `npm run check`: 1041 app tests |
| Found | | **Two "+N" rules in the app:** the chat's buy card, the Starter list and the first-3-moves card count with `fitsGain` (core `rotation`: any combination without a hard clash, v4), while the Closet now counts outfits rated Put together (#84.3). So on the demo closet the chat suggests a navy polo (+12) and the Closet dark straight jeans (+16). Proposed as a follow-up: one count everywhere |

## 15. Next best buy on the Simulator: two fixes, pass/fail checks set before building (Oct 17, #312)
Found on the iOS Simulator (iPhone 17 Pro Max, demo 182; first time the sheet ran on iOS, since N5 had passed only on the web): in dark mode the sheet's big "+16" is near-black on the dark sheet, and the sheet says "What it unlocks · 16" but shows 6 outfits with no way to see the other 10.
- **N7 (S)** The "+16" reads in both themes: it takes a real theme color. `Numeral`'s `color` is a color value, not a token name, so `color="accent"` was an invalid color (black on iOS). It becomes ink, the default: copper is kept for a score that moves (#231).
- **N8 (T)** No `<Numeral … color="…">` in the app passes a string literal (a token name is never a color); a test scans the source.
- **N9 (S)** The sheet shows the first 6 outfits, then "Show {n} more" (the Outfits list's own words), which shows all 16 and becomes "Show fewer". 6 or fewer: no link.
- **N10** `npm run check` green.
