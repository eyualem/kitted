# T62 · Design: Head not found (what he sees when nothing is sent)

<!-- The coordinator adds the approval line here only after the founder's yes in chat. -->

**From:** `plan.md` → T62 · **Spec:** `specs.md` → F2.2, and "Failure and edge cases" → the "Head not found" row · **Frames:** `tasks/T62/design.html` (open with `preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/T62/design.html`) · **PNGs:** `tasks/T62/design/`

Approved, this file is the contract: the planner copies the UI inventory from it word for word, and the critic holds the build to it. It changes only with the founder's yes.

*Dry run of the design stage: this covers F2.2 only. F2.3 and F3.3 are still to design (see Out of scope).*

## What he sees
When the phone can't find his head to blur it, nothing leaves the phone, and Kit says why in the spec's words. One button lets him try again.

## Where it lives
- **Mainly the camera's after-shot panel** (02 S3, `RetakePanel`), inside the camera cover. The camera is always dark. The panel sits over his frozen photo. **How he gets there:** the shutter (Propped 3-2-1, or Mirror's shutter or volume button), or a pick from the library button. Next, the "Checking the photo…" pill shows while the quick check runs on the phone. If that check can't find his head (`fitIssue` → `cantFrame`), the panel slides up. That happens when his whole figure, top included, is inside the photo, but Vision finds no face, no head points and no two shoulders to place the blur on: he's small or far from the phone, turned away with his shoulders hidden, or too dim to read. A head cut off at the photo's top edge is a different case: its top is hidden down to just above his shoulders and the photo is sent (DECISIONS-LOG #304, `KittedPrep.swift` `topEdgeBand`), so it never shows this panel. **How he leaves:** Retake (back to the live camera), Choose another (the photo picker, for a library photo), or the X (closes the camera). No way out sends anything. Retake and Choose another delete the temporary photo (`discard()`); Close only closes the camera (`router.back()`), as today. The cover has no swipe-down.
- **Rarely, a toast on Stylist** (02 G2, `ToastHost`). This happens when the quick check passed, or couldn't measure, but the full photo prep that runs after the cover closes still can't find his head (`photoProblem` / `couldNotFrame`). No photo bubble or card is posted. The thread shows what it showed before.
- Around it: the camera's top bar (Close, and the flash toggle in Propped or the timer in Mirror) stays visible above the panel. The mode switch, library button, shutter and flip sit under the panel and are covered by it. On Stylist: the header, the thread, the "Ask Kit…" bar and the tab bar.

## States
In the order he meets them. Before any of them, the existing "Checking the photo…" pill shows in the camera's top bar. It is unchanged and not drawn.

### Head not found · a photo he took · when: the quick check after the shutter finds his figure but no face, head points or shoulders (far, turned away or dim) · phone 1 · `design/01-light.png`, `design/01-dark.png`
The frozen photo in the frames is a drawn, faceless figure standing in for his photo: whole figure inside the frame, top included, far from the phone in a dim room. On his phone it is his own photo, shown only to him; nothing of it leaves the phone. *Not this panel:* a photo with his head cut off at the top edge is hidden and sent (#304).

Top to bottom, in VoiceOver's reading order:
- Close · `IconButton` variant glass, diameter 44, glyph `close` · no visible words · color `fixed.white` on the glass · top bar at safe-area top + 3, side inset 18 · VoiceOver: "Close camera" (`en.ts` `cam.a11y.close`) · tap: closes the camera (`router.back()`, as today). Nothing is sent.
- Flash toggle · `IconButton` glass 44, glyph `flashOff` / `flash` · VoiceOver: "Flash off" / "Flash on" (`en.ts` `cam.a11y.flashOff`, `cam.a11y.flashOn`) · tap: toggles the flash (unchanged). In Mirror mode this slot is the timer (`cam.timer.on` / `cam.timer.off`), unchanged.
- Panel · `RetakePanel` (tone `warning`) · background `fixed.panel` (#171A23), radius 38, left and right inset 8, bottom max(safe-area bottom, 8) = 34, padding 20 (`space.xl`), gap 12 (`space.m`). It hugs its content, anchored at the bottom.
  - Warning icon · `Icon` `warning`, 26 · `fixed.white` · decorative, hidden from VoiceOver.
  - Title · `KText` variant `headline` (17/22, 600) · `fixed.white` · "I couldn't find your face to blur it, so I didn't send it." (source: spec, the first sentence of the "Head not found" line) · with the body, one VoiceOver element (see below).
  - Body · `KText` variant `subheadline` (15/20) · `fixed.textDim` (white 75%) · "Get your head in the shot and try again." (source: spec, the line's second sentence).
  - **Title and body are one VoiceOver element** with the header trait, label "I couldn't find your face to blur it, so I didn't send it. Get your head in the shot and try again." (title, a space, body).
  - **No** "This one doesn't count." under it: the line already says "I didn't send it" (open question 1). **No** "Use anyway": a photo whose face can't be hidden is never sent (ruling 10, `allowUse: false`).
  - Retake · `PanelButton` (inside `RetakePanel`), min height 50 (`size.buttonLarge`), radius 25, fill `fixed.white`, text `fixed.indigo`, variant `headline`, `CONTROL_TEXT_MAX_SCALE` · "Retake" (`en.ts` `cam.retake.retake`) · margin top 4 (`space.xs`), full width · VoiceOver: "Retake", button · tap: deletes the temporary photo, closes the panel, back to the live camera (`discard()`). Nothing is sent or counted. VoiceOver focus goes back to the shutter ("Take photo").
- **Where VoiceOver focus goes.** When the panel appears, focus moves to the panel's text element (title + body, header trait), so VoiceOver reads both sentences once. There is no separate announcement, so the line isn't read twice and isn't cut off by a focus jump. On Retake, focus goes back to the shutter. On Choose another (phone 2), the photo picker takes focus. On Close, focus is wherever the screen under the camera puts it, as today. *Change from today:* `RetakePanel` calls `announceForAccessibility(title)` and doesn't move focus. With VoiceOver on, focus is still on the shutter or library button he double-tapped, which this design hides (next point).
- **While the panel shows, the controls it covers** (mode switch, library button, shutter, flip) **are hidden from VoiceOver**, so swiping from the panel's text goes on to Retake, and back to the flash toggle and Close. *Change from today:* they stay in the tree under the panel.
- **Motion and haptics:** the existing ones, both meaningful. A warning haptic (`notificationAsync(Warning)`) once, when the panel appears. The panel slides up (`FadeInDown` 220 ms). With Reduce Motion it fades in (150 ms), with no slide. On Retake it slides down (160 ms), or fades out (120 ms) with Reduce Motion.
- **Dark:** none. The camera uses the fixed dark set in both appearances, so the light and dark PNGs are the same.
- **Largest text:** phone 4. The title wraps to 4 lines at 53 pt and the body to 3 lines at 49 pt. The button's text is capped at 2× (34 pt). The panel grows upward from the bottom and every word shows. Its cap is the camera's top bar: top ≥ safe-area top + 3 + 44 + 8. So Close stays reachable, and the words would scroll inside the panel above a pinned Retake if they ever needed more room. With these words at AX5 the panel is about 600 pt tall against about 720 pt of room, so nothing scrolls. *Change from today:* `RetakePanel` has no height cap.

### Head not found · a photo from his library · when: the same check, on a photo he picked with the library button · phone 2 · `design/02-light.png`, `design/02-dark.png`
Same as phone 1, except the button:
- Choose another · `PanelButton` with the `photo` glyph (small, `fixed.indigo`), gap 8 · "Choose another" (`en.ts` `cam.retake.chooseAnother`) · VoiceOver: "Choose another", button · tap: deletes the temporary photo, closes the panel and opens the photo picker (`discard()` then `pickFromLibrary()`), unchanged. The picker takes VoiceOver focus.
- **Motion and haptics, Dark:** as phone 1.
- **Largest text:** as phone 4. "Choose another" fits on one line at 34 pt beside its glyph. If it ever didn't, it wraps (`flexShrink: 1`) and is never cut.

### Head not found · caught after the camera closed · when: the full photo prep on the phone finds no head after the quick check let the photo through · phone 3 · `design/03-light.png`, `design/03-dark.png`
Top to bottom, in VoiceOver's reading order. Everything but the toast is today's Stylist screen, unchanged:
- Header · `StylistHeaderTitle` · "Stylist" (`en.ts` `stylist.title`) with "1 free check today" (`stylist.quota.free`) under it in `caption` 500 `ink3`. It still says 1 free check after this toast: nothing was counted.
- Kit's message, the thread as it was · `StylistMessage` · "Kit" (`common.who`) + "I'm Kit, your stylist. Quick note: I'm an AI. I read clothes, never faces, and I can get things wrong. Tap "Not quite right?" when I do." (`stylist.aiNote`). This is the context of a first-day user.
- **Toast** · `ToastHost` capsule, no Undo · fill `surface` (`surface2` in dark), 1 pt `line` border, `shadow.card`, radius 999 (the system clamps it to half its height; 24 at accessibility sizes, phone 5), left and right 16, bottom 153 (the "Ask Kit…" bar's top at 145, + 8 `ABOVE_DOCK`), padding 4 / 16 with 8 around the text · `KText` `subheadline` `ink` · "I couldn't find your face to blur it, so I didn't send it. Get your head in the shot and try again." (source: spec, the whole line) · VoiceOver: announced once when it appears, with the same words · on screen 5 s (`TOAST_MS`), or 10 s with VoiceOver on · tap: nothing. Holding it pauses the timer, as on every toast.
- "Ask Kit…" bar · `StylistBar` (tab-bar accessory) · camera circle 38 (`primary` fill, `onPrimary` glyph), VoiceOver "Check my fit. Opens the camera." (`composer.a11y.camera`) · field "Ask Kit…" (`composer.placeholder`), `body` `ink2`, VoiceOver "Ask Kit", hint "Opens the keyboard" · mic, VoiceOver per `mic.a11y`. All unchanged. Tapping the camera here is his way to try again.
- Tab bar · NativeTabs: Stylist (active), Closet, Lookbook, You. Unchanged.
- **Motion and haptics:** the toast's existing ones. It slides up (`FadeInDown` 220 ms) and fades out (150 ms), or fades in (150 ms) with Reduce Motion. No haptic: the camera's warning haptic never fired on this path. Adding one would be new behaviour, so none is designed.
- **Dark:** the toast takes `surface2` (#21252F) on `bg` (#0C0E14), as all toasts do. Text `ink` (#ECEEF3).
- **Largest text:** phone 5. At AX5 the line wraps to 6 lines at 49/59 in the 338 pt text width (the frame shows 6), so the toast is about 380 pt tall and grows upward over the thread from 153 pt off the bottom. Nothing is cut. *Change from today:* `ToastHost` uses the 999 capsule unless it's stacked (only with Undo). A toast this tall would clamp its corner to about half its height, and the starts of the first and last lines would fall outside the fill, over the thread. So at accessibility sizes every toast takes the stacked toast's radius 24, with or without Undo (padding 8 top, 4 bottom, 16 sides, as the stacked one).

### Largest text · phone 1 at AX5 · phone 4 · `design/04-light.png`, `design/04-dark.png`
The same elements, words and order as phone 1, at AX5 (headline 53/64, subheadline 49/59, the button's text 34/44 under `CONTROL_TEXT_MAX_SCALE` 2). Its reflow is described under phone 1.

### Largest text · phone 3 at AX5 · phone 5 · `design/05-light.png`, `design/05-dark.png`
The same elements, words and order as phone 3, at AX5: the toast's `subheadline` 49/59 with radius 24; Kit's message `chatText` 53/64 (it runs under the toast and the bar, as the thread does today); the header ("Stylist" 34, "1 free check today" 24) and the "Ask Kit…" bar (34) capped at 2× (`CONTROL_TEXT_MAX_SCALE`); the tab bar as the system draws it. Its reflow is described under phone 3.

### States that don't apply
- **First time:** the same panel. Consent is already agreed before the camera opens, and his first-ever check behaves the same.
- **Empty, loading-slow, done:** none. The check takes about 0.1–0.3 s on the phone and nothing is sent, so there's no wait to show.
- **Offline:** the head check runs on the phone before any network call, so offline doesn't change it. The offline line comes only for a photo that passed.
- **Re-check camera:** the same panel and buttons. Nothing is sent, so the re-check isn't used.
- **Shoe or bottom snap:** never shows this panel (snaps are checked for light and blur only). A snap whose prep fails keeps its own toast (`cam.shoe.failed` / `cam.bottom.failed`), unchanged.
- **The must-not case** ("a face sent unblurred"): this whole design is what he sees in its place. Nothing is sent, ever, when the head isn't found.

## Words
Every string he reads in this task.
- "I couldn't find your face to blur it, so I didn't send it." · spec, `specs.md` → Failure and edge cases → Head not found (sentence 1). It is the panel title. Today the panel says `cam.retake.cantFrame` "Couldn't frame this one. Try again." here.
- "Get your head in the shot and try again." · spec, the same line (sentence 2). It is the panel body. Today the body is `cam.retake.noCount` "This one doesn't count."
- "I couldn't find your face to blur it, so I didn't send it. Get your head in the shot and try again." · spec, the whole line. It is the toast. Today the toast is `cam.retake.cantFrame`.
- "Retake" · `en.ts` `cam.retake.retake`
- "Choose another" · `en.ts` `cam.retake.chooseAnother`
- "Close camera" · "Flash off" · "Flash on" (VoiceOver) · `en.ts` `cam.a11y.close`, `cam.a11y.flashOff`, `cam.a11y.flashOn`
- Unchanged context on phone 3: "Stylist" (`stylist.title`) · "1 free check today" (`stylist.quota.free`) · "Kit" (`common.who`) · `stylist.aiNote` · "Ask Kit…" (`composer.placeholder`) · "Check my fit. Opens the camera." (`composer.a11y.camera`) · "Ask Kit" / "Opens the keyboard" · the four tab names.
- **No NEW words.**
- **Which words for which cause.** The spec's line is only for the head-not-found cause. Prep reports `couldNotFrame` for other causes too: a photo that won't decode, a cover that can't be drawn over someone else, a "Which one is you?" tap that matches no one, and a retry whose blurred copy is gone. Saying "I couldn't find your face" for those would be untrue. They keep "Couldn't frame this one. Try again." (`cam.retake.cantFrame`), unchanged. On the camera panel, `cantFrame` already means only the head (the quick check runs `Prep.locate` with no pick). The planner separates the toast's causes. Today they share one status.
- `en.ts` gets the two spec sentences as their own keys (the toast joins them with one space). The planner names them. `cam.retake.cantFrame` keeps its words for the other causes.

## New parts
None. Changes to existing parts, used by these states:
- `RetakePanel`: the title and body become one VoiceOver element with the header trait, and VoiceOver focus moves to it when the panel appears. This replaces `announceForAccessibility(title)`, so the line is read once, in full. It also gets a height cap at the camera's top bar, with the words scrolling inside above the pinned buttons. The other retake reasons get both changes for free, and they are harmless there.
- `CameraScreen`: while the panel shows, the controls under it are hidden from VoiceOver (`accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"` on the bottom controls). On Retake, VoiceOver focus goes back to the shutter.
- `ToastHost`: at accessibility text sizes every toast uses radius 24 (the stacked toast's), with or without Undo, so a tall toast keeps all its text on its fill. Today only a toast with Undo does.

## Checked by the designer
- **HIG:** checked against Accessibility (VoiceOver focus moves to the new content and back, VoiceOver order, Dynamic Type to AX5, Reduce Motion: pass with the changes above), Feedback (one warning haptic and a plain statement of what happened and what to do: pass) and Modality (the camera cover keeps a visible Close at every text size: pass). Toasts aren't a native iOS pattern, but they're the app's existing G2 pattern for "nothing happened" (Jakob's Law over novelty).
- **§C14:** tab bar for top-level navigation only: n/a (camera cover) / unchanged (phone 3) · never a tab as an action: pass · settings behind a gear: n/a · 44 pt targets: pass (Close 44, Retake and Choose another 50 tall at full width) · 4.5:1 text: pass. Title white on #171A23 is about 17:1. Body white 75% on #171A23 is 10.17:1. Retake #121628 on white is 17.9:1. The toast's `ink` on `surface` is about 17:1 (light), and on `surface2` about 13:1 (dark) · Dynamic Type at the largest sizes: pass (phones 4 and 5) · feedback within ~0.1 s: pass (the "Checking the photo…" pill at once, then the haptic with the panel) · a clear X on every camera: pass · familiar patterns: pass (the same panel as every other retake reason) · progressive disclosure, notifications, accounts: n/a · privacy in plain words: pass. The line says what wasn't sent and why.
- **Design system:** only 03 / `tokens.ts` tokens and existing components: `RetakePanel`, `PanelButton`, `IconButton`, `Icon`, `KText`, `ToastHost`, `StylistBar`, `StylistMessage`, NativeTabs. Fixed dark set on the camera (03 §2.3, §9). No new colors or type roles.
- **Hard lines:** no face or body. The camera frames use a drawn, faceless figure in place of his photo (no face drawn); phone 3 and 5 show no photo (03 §8). No emoji, ranks or streaks. Copper appears only as the active Stylist tab, which 03 §1 allows. The frames' colors come from `tokens.ts` (light and dark), not the old mockup values. No score is shown, so copper marks nothing else. Nothing is said about his body: the words are about the photo ("your head in the shot"), not about him.
- **Not checked:** the web preview (`kitted-web`) wasn't opened. The Mac had about 100 MB of memory free, so I didn't start Metro. Today's chrome is taken from the code (`CameraScreen.tsx`, `RetakePanel.tsx`, `ToastHost.tsx`, `StylistBar.tsx`, `HeaderTitle.tsx`). The critic or verifier can compare against demo screen 45 (`/camera?review=noPerson`, the sibling reason) and `/camera?review=cantFrame` (`simIssue` already accepts it). The library variant (phone 2) has no demo route: in the Simulator the review source is always the camera.

## Open questions for the founder
1. **Keep "This one doesn't count." under the line, like the other retake panels?** · recommended: **drop it here.** "I didn't send it" already says nothing happened, and a third sentence makes the panel 4 lines at normal size and much taller at large text. · other: keep it as the body's second sentence ("Get your head in the shot and try again. This one doesn't count."), which matches the sibling panels and spells out that his free check is safe.
2. **Should Kit say the line out loud in Propped mode?** · recommended: **yes, once, in the same voice as the camera tips.** In Propped he's 2–3 m from a phone propped against something, and 17 pt words are hard to read from there. The camera already speaks its tips in Propped. · other: leave it silent (today). Either way it's new behaviour beyond F2.2, so it needs your yes.
3. **The rare after-the-camera case: a toast, or a card in the thread?** The spec says "the card says why". · recommended: **the toast (phone 3), with the camera panel counted as "the card"**, since that's where he almost always sees it. Nothing was posted, so there's no photo bubble to hang a card on, and a card would leave a permanent "nothing happened" entry in his chat. · other: post a "Not sent" card with Retake (like the unused 02 S19e). It stays readable after 5 s, but it needs a photo bubble for a check that never ran.

## Out of scope
- **F2.3** ("Taking longer…" at 9 s, giving up at 14 s with a retry, a failed check never uses a check) and **F3.3** ("I did make the change" and "Scored from what you told me."): the other two-thirds of T62, still to design when T62 runs.
- No person found ("I can't find you in this photo."), two people ("Which one is you?"), the clothes scan's "There's a person here I can't blur…", and the snap failure toasts: unchanged.
- `fail.cantFrame` (an unused failed-card string) and the old copy for this case in `handoff/02-screens.md` S3 / S19e and `handoff/03-design-system.md` §8 step 7: the spec wins over them. Updating those docs isn't this design's job.

## Design check (critic)
Written by the critic, round by round.

### Round 1 · Nov 8 · verdict: doesn't match (4 blockers)
Read: CLAUDE.md, specs.md (F2.2, the privacy line, the failure table), this file, all 8 PNGs, `design.html`, 03 (§1, §2.3, §8, §9, §11), `tokens.ts`, §C14, `brainstorm/12_ios26-metrics.md`, the pro-rules checklist, and the code (`RetakePanel.tsx`, `CameraScreen.tsx`, `guidance.ts`, `guidanceCopy.ts`, `startCheck.ts`, `service.ts`, `ToastHost.tsx`, `toast.ts`, `Icon.tsx`, `KittedPrep.swift`, `KittedGuide.swift`). Pixels sampled from the PNGs (2x: divide by 2). Contrast computed from `tokens.ts`. Nothing run (no Metro, no Simulator).

**Blockers**
1. **The phone 3 frames use the wrong ink3, which fails contrast.** Where: phone 3, light and dark, on "1 free check today" and "Kit". The pixels sample `#848A99` (light) and `#6E7484` (dark). Those are the old mockup values that 03 §11 item 1 demoted to `inkFaint`, for decoration only. Measured: 3.14:1 on `bg` in light and 4.13:1 in dark, both under 4.5:1. `tokens.ts` ink3 is `#646A7A` (4.91:1) and `#9096A5` (6.51:1). The same `:root` block in `design.html` also draws `primary` as `#121628` (the camera circle samples `#121628`; the token is `#1A2448`) and `accentSoft` at 11% (the token is 9%). Rule: §C14 (4.5:1 text), 03 §11, and "only design-system tokens". Fix: copy the light and dark app tokens in `design.html`'s `:root` from `tokens.ts` (ink3, inkFaint, primary, me, accentSoft), then re-export `03-light.png` and `03-dark.png`.
2. **Phone 3 at the largest text isn't drawn, and today's toast would put text outside its own background.** Where: the phone 3 toast at AX5. `ToastHost` sets `borderRadius: stacked ? 24 : 999`, and `stacked` is true only with an Undo, so this toast keeps 999 at accessibility sizes. At 49/59 the line wraps to about 9 lines in the 336 pt text width, so the capsule is about 557 × 370 pt and its radius clamps to 185. At the first line's top (y ≈ 13) the fill's left edge sits at x ≈ 117. At that line's bottom (y ≈ 72) it sits at x ≈ 38. The text starts at x ≈ 17, so the start of the first line and of the last line falls outside the fill, over the thread, with nothing behind it. The design says "Nothing is cut", but no frame shows it. Rule: §C14 (Dynamic Type at the largest sizes), 03 §1 item 3 (layouts reflow to AX5), pro-rules (scrim and modal legibility). Fix: add a phone 5 (phone 3 at AX5), and design the toast without an Undo at accessibility sizes with radius 24, like the stacked toast. List it under New parts as a change to `ToastHost`.
3. **Where VoiceOver focus goes isn't said, and the design's own change takes the focused control away.** Where: phones 1, 2 and 4, when the panel appears. With VoiceOver on, he double-taps the shutter (or comes back from the photo picker to the library button), so focus is on that control. The design hides the shutter, library button, mode switch and flip while the panel shows. iOS then moves focus to some other element and reads it, which can cut off the `announceForAccessibility` line, and nothing says where focus lands. Rule: HIG Accessibility (VoiceOver: when content changes, move focus to it) and pro-rules (accessibility focus). Fix: say it in DESIGN.md. Recommended: when the panel appears, focus moves to the panel's text (title and body as one element with the header trait, read as both sentences), with no separate announcement so the line isn't read twice. On Retake, focus goes back to the shutter. On Choose another, the picker takes focus.
4. **The frozen photos show a case the engine sends; they don't show head not found.** Where: phones 1, 2 and 4. In each, his body runs off the top edge of the photo (phone 1: shirt and jacket; phone 2: the raised arm and hoodie). Under DECISIONS-LOG #304 and `KittedPrep.swift` (the `topEdgeBand` branch), that photo gets its top hidden down to just above the shoulders, and it is **sent**. `couldNotFrame` comes only when his top is inside the photo and no face, head points or shoulders are found (a small or far figure, turned away with the shoulders hidden, too dark to read). The founder would approve the copy against the wrong picture of when he sees it, and "Get your head in the shot" reads right beside a neck-down crop, which is exactly the case that doesn't trigger it. Rule: the state's "when" (this file) has to match the engine and #304. Fix: use a frozen photo with his whole figure inside the frame and no face visible (for example turned away, or far and dim), and add one line under phone 1's "when": a head cut off at the top edge is hidden and sent (#304), so it never shows this panel.

**Polish**
- Phone 1's Close is described as "closes the camera, deletes the temporary photo". Today Close is `router.back()` (`CameraScreen.tsx`, top bar), and `discard()` isn't called, so the review file stays. Either mark it *Change from today* (so the planner builds it) or drop "deletes the temporary photo".
- The designer's §C14 line gives the body as "about 11:1". Computed: white 75% on `#171A23` = 10.17:1. It still passes. The other numbers check out: title 17.38, Retake 17.93, toast 17.93 (light) and 13.20 (dark).

**Suggestions (the founder's choice; none blocks)**
- Toast time: 5 s for a two-sentence, 20-word line that leaves no trace in the thread is short, and holding to pause isn't discoverable. `toast.ts` already has an 8 s window (`TOAST_MS_REMOVAL`); use it here. This goes with open question 3.
- The spec's second sentence: since the real trigger is usually a head that is in the shot but can't be found (turned away, too far, too dark), "Get your head in the shot" may puzzle him. Something like "Face the camera and try again" would fit more cases. This is a spec change, so only with the founder's yes.
- Phone 2: the flash toggle stays in the top bar over a library photo, where it does nothing. It could step aside while a library photo is in review (`flashControls`, `canOffer`/`toggle`). This is how it works today, not new.
- Open question 2 (say the line out loud in Propped): agree with the recommendation. On a propped phone the warning haptic can't be felt, and 17 pt from 2–3 m is hard to read.

**Passes**
- Words: the title, the body and the toast match the spec's line exactly. "Retake", "Choose another", "Close camera", "Flash off/on" and the phone 3 strings all exist in `en.generated.ts`. No NEW words. No emoji, ranks or streaks.
- Targets: Close and flash are 44. Retake and Choose another are 50 tall at full width (60 at AX5).
- Phone 4 reflow: the panel top is at 241 pt (599 tall against the 723 pt cap), title lines 64 apart and body lines about 60 apart, with nothing cut. "Choose another" at 34 pt is about 282 pt including its glyph, inside a 306 pt button, so it fits.
- Camera glass over the photos is 4.6–17:1 for the white glyphs. The panel and its text are on the fixed set (03 §2.3), and the light and dark PNGs are byte-identical, as stated.
- The warning icon is hidden from VoiceOver (`Icon` with no label). Reduce Motion matches `RetakePanel`. The haptic matches `reviewPhoto`. Copper appears only on the active tab (`#9C5326` sampled).
- Nothing is counted on either path: `photoProblem` returns before any count (`service.ts`), and the quick check's `cantFrame` has `allowUse: false`.

**Not verified**
- What he sees between the cover closing and the phone 3 toast (full prep on the phone). Nothing is drawn or timed for that gap, and §C14 wants feedback within about 0.1 s. Checking it needs a device run of a photo that passes the quick check but fails prep.
- Bold Text and Increase Contrast (03 §9's test matrix) aren't drawn. The parts are unchanged, so the risk is low.

### Round 2 · Nov 9 · verdict: doesn't match (1 blocker)
Re-read this file (Changes, Round 2), all 10 PNGs, and `design.html` (its `:root` block and the figure script). Pixels sampled again, and the code re-checked where the design now leans on it: `HeaderTitle.tsx`, `StylistScreen.tsx`, `StylistBar.tsx`, `en.generated.ts`, and the users of `RetakePanel`. Nothing was run.

**Round 1's points**
- Blocker 1 (tokens): **fixed.** Phone 3 and 5 sample `#646A7A` (light) and `#9096A5` (dark) for "1 free check today" and "Kit", which is 4.91:1 and 6.51:1. The camera circle samples `#1A2448`.
- Blocker 2 (the toast at AX5): **fixed.** Phone 5 draws it with radius 24, and the six lines all sit on the fill (white in light, `#21252F` in dark). The text starts 16 pt inside the toast's edge. The line pitch is 59.5 pt. Ink on the fill is 17.93:1 in light and 13.20:1 in dark. It's listed under New parts as a `ToastHost` change.
- Blocker 3 (VoiceOver focus): **fixed.** Focus goes to one text element with the header trait when the panel appears, with no second announcement. On Retake it goes back to the shutter ("Take photo", `cam.a11y.shutter`, which exists). On Choose another the picker takes it. Both are in New parts.
- Blocker 4 (the trigger): **the words are fixed; the picture isn't.** "Where it lives" and phone 1's "when" now match `KittedPrep.swift` and #304, and the figure's whole body, top included, is inside the frame. The new frames have their own problem, below.
- Polish (Close, and 10.17:1): **both fixed.**

**Blockers**
1. **The drawn figure's head is blurred, so the frames show a blurred face under the line "I couldn't find your face to blur it".** Where: phones 1, 2 and 4, the head of the frozen figure. `design.html` draws it with `data-head="1"`, which puts the head through `feGaussianBlur stdDeviation="8"`, so the head reads as a blurred face. That isn't what the app shows: the frozen photo is drawn as is (`reviewUri` in `CameraScreen.tsx`), with no blur. It also isn't what this file says ("a drawn, faceless figure"). The picture says "the face was blurred" while the words say "I couldn't blur it". The founder would approve against that contradiction, and in build mode no build could match this frame. Rule: frames and DESIGN.md agree, element for element. Fix: draw the head as a plain, featureless shape in the skin and hair tones with no blur (like 03's faceless silhouette), or as the back of his head if he's turned away. Then re-export `01`, `02` and `04`.

**Polish**
- The figure doesn't read as far. Phones 1 and 2 are marked `data-zoom="far"`, but the head starts about 250 pt from the top and the body runs past the panel's top at 620 pt. That's more than half the screen, facing the camera with both shoulders plain to see, which is the case Vision handles. Draw him smaller (roughly a third of the height), or turned away, so the picture matches "small or far, turned away, or too dim" in this file.
- Phone 5's thread is drawn from the top of Kit's message ("I'm Kit, your stylist. Quick…"), but `StylistScreen` scrolls to the end (`scrollToEnd`). At AX5 the message is taller than the screen, so he'd see its end just above the bar, mostly under the toast. It's context only, but the frame should show the real scroll position.
- `RetakePanel` is shared with `ScanCameraScreen`. The new focus move reaches the scan camera's panels too, but hiding the covered controls is only planned in `CameraScreen`. On the scan camera, swiping from the panel's text would reach controls under the panel. Either hide them there as well or say it's out of scope. Either way, the planner should know.

**Suggestions:** Round 1's suggestions stand (an 8 s toast; the second sentence's wording, which is the founder's call; no flash toggle over a library photo). Nothing new.

**Passes (this round)**
- Camera glass is 11.5–12.4:1 for the glyphs on the new dim photos. The panel is unchanged at 17.38, 10.17 and 17.93. The light and dark camera PNGs are still byte-identical.
- Phone 5's header is capped at 2x, as the code does it (`HeaderTitle`: headline 34, caption 24, `CONTROL_TEXT_MAX_SCALE`), and so is the bar's "Ask Kit…" (`StylistBar`). Copper appears only on the active tab. No emoji, ranks or streaks.
- The words are unchanged from Round 1, and all of them trace to the spec or `en.generated.ts`.

**Not verified:** the same two as Round 1 (the gap between the cover closing and the phone 3 toast; Bold Text and Increase Contrast).

## Changes
- **Round 2** · from the critic, Round 1 · what changed:
  - Blocker 1: `design.html` now carries the `tokens.ts` light and dark block (from `design-shell.sh`) before the board, so `ink3`, `primary`, `me` and `accentSoft` match the app (ink3 #646A7A light, #9096A5 dark). Re-shot phones 3 and 5 (and every phone, for the same tokens).
  - Blocker 2: added phone 5 (phone 3 at AX5). The toast takes radius 24 at accessibility sizes, with or without Undo. This is listed under New parts as a `ToastHost` change, and phone 3's Largest text now points to phone 5.
  - Blocker 3: wrote where VoiceOver focus goes. On appear, it moves to the panel's text (title + body, one element, header trait), with no separate announcement. On Retake it goes back to the shutter. On Choose another the picker takes it. This is added to New parts (`RetakePanel`, `CameraScreen`).
  - Blocker 4: phones 1, 2 and 4 now show his whole figure inside the frame, far from the phone in a dim room, with no face (a drawn figure stands in for his photo). The "when" lines and Where it lives now say what triggers the panel, and that a head cut off at the top edge is hidden and sent (#304), so it never shows this panel. Re-shot `01`, `02` and `04`.
  - Polish: dropped "deletes the temporary photo" from Close. Close is `router.back()`, as today. Fixed the body contrast to 10.17:1.
  - Not changed: the critic's suggestions and the three open questions are left for the founder.
