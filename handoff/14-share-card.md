# 14 · The share card: build plan and tests

Written Oct 18, 2026, after the founder's go: "You can start planning out the implementations and also the test now."
The design is settled (DECISIONS-LOG #347–349; `mockups/share-card.html`; published page
https://claude.ai/artifact/F8VZN8HKY8khwxjUJaGAWg). The screen spec is `02-screens.md` D20, update block #347. This
doc is the plan to make it real on an iPhone, and the checks it must pass. Each check is written before its code, as
for every feature since #291.

A senior React Native reviewer read a first draft against the installed native sources (view-shot 5.1.0, expo-media-
library). Their findings are folded in (§2, #350). Results go in §8 as they come in.

## 1. What he'll see when it's done

- **Where Share shows:**
  - the fit-check card's share button, on a full check at 7.0 or more;
  - the re-check card's "Share the before and after", on a re-check that went up;
  - the Lookbook look page's share button, which is new (step 4).
  - Never on a partial check, a failed check, a check still reading, or Past chats.
- **The share screen:** a dark cover with the preview, then:
  - **Transparent · Solid · With photo**, opening on With photo;
  - **Light | Dark** under Solid, starting in the phone's own appearance;
  - **Neck down | Full photo** under With photo, neck down every time;
  - **Share** and **Save**, with one status line under them.
- **The images:**
  - Transparent: 1080 × 600 PNG with no background.
  - Solid: 1080 × 600 PNG, indigo or chalk, rounded corners (clear outside them).
  - With photo: 1080 × 1920 PNG.
- **Share** opens the iPhone share sheet with the image (Instagram, TikTok, Snapchat, Messages, Copy, Save Image…).
- **Save** puts the PNG file in Photos (add-only; Kitted never reads the library) and says "Saved to Photos." If he
  said no before: "Photos access is off." with an **Open Settings** button.
- **Posting the transparent sticker to Instagram:** depends on step 0. The likely route is Save, then Instagram's photo
  sticker in the story, or Copy from the share sheet and paste into the story.

## 2. Where it stands (PR #20, branch `claude/social-share-card-demos-c424a6`)

**Built and tested in Jest** (`app/src/__tests__/shareCard.test.ts`, 16 checks):
- the model: who's offered a card, the stats, and the neck-down crop from the measured heads;
- the three versions and their sizes;
- the light and dark solid cards;
- the share screen;
- capture → share and save (`exportCard.ts`);
- the guard that hides Share on a build without the native modules (`shareNative.ts`).

**Seen on the web preview:** demo screens 20 (re-check win) and 230 (single check), every version.

**Fixed while planning (#350, from the review, checked in the installed native code):**
1. **The image would have come out 3× too big.** view-shot's `width`/`height` are points drawn at the device's scale.
   `width: 1080` on a 3× iPhone renders 3240 px, upscaled from the 360 pt view. The capture now passes px ÷ pixel
   ratio.
2. **Save could have dropped the transparency.** The legacy `saveToLibraryAsync` re-encodes through
   `UIImageWriteToSavedPhotosAlbum`. Save now uses `Asset.create(file)`, which adds the PNG file itself
   (`creationRequestForAssetFromImage(atFileURL:)`) with add-only access (`checkIfWritePermissionGranted` accepts
   write-only).
3. **Temp files piled up.** Each capture is now released with view-shot's own `releaseCapture`: after a save at once,
   after the share sheet 30 s later, in case an extension is still copying it.
   - (`fileName` is ignored on iOS; files are `tmp/ReactNative/<UUID>.png`.)

**Still open (the steps below):**
- the capture can run before the photo or the Archivo font has loaded;
- the switches aren't locked while a capture runs;
- the look page has no share button;
- "denied" has no way to Settings;
- whether Instagram keeps a PNG's transparency at all;
- nothing has run on iOS.
- The photo prompt text "Save your Kitted card to Photos." is outward-facing and needs the founder's OK.

## 3. Build steps, in order

**Step 0 · Does Instagram keep the transparency? (founder, 5 min, no build).**
- **The file:** a real transparent PNG of the sticker (`screenshots/share-card/test-sticker.png`, made by Claude,
  1080 × 600, no background).
- **Get it onto his phone:** AirDrop it.
- **Try:**
  - **(a)** Photos → Instagram story → photo sticker: does it show with no box?
  - **(b)** In Photos, Share → Copy, then long-press in a story → Paste: does it paste as a sticker with no box?
  - **(c)** Photos → Share → Instagram → Stories: is the background solid?
- **What it decides:**
  - If (a) or (b) works, Transparent stays as built.
  - If (b) works, Copy needs no new package, because the share sheet has it.
  - If neither works, Transparent becomes "for TikTok and Snapchat; on Instagram use Solid" and the note says so.
- *Checks:* P0a–P0c.

**Step 1 · The native build on the Simulator (~1 h, mostly waiting).**
- **Disk:**
  - The worktree's own packages are already installed (973 MB).
  - Prebuild, Pods and DerivedData growth need ~2 GB more. 3.9 GB was free on Oct 18.
  - Ask the founder to free ~5 GB first (his call; Claude doesn't delete other sessions' folders).
- **Memory (rule 9):** one heavy job at a time. Check `top -l 1 | grep PhysMem` first, and shut the Simulator down
  after.
- **Commands, from this worktree:**
  1. `expo prebuild --platform ios --no-install`
  2. `pod install`
  3. `expo run:ios --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D --no-bundler`
- **Then:** a Metro from the worktree on its own port (CLAUDE.md lessons, #296), and demo screens 20 and 230 by
  `-demoScreen`.
- **Gate:** N1–N3 and M1 pass before step 2 starts. A wrong size or a blank capture changes the plan.
- *Checks:* N1–N3, M1–M4.

**Step 2 · Make the capture sure (~½ day).**
- **Ready gate:**
  - The off-screen copy (the one captured) reports ready when its images have loaded (`onLoad` on the photo, and in
    Full photo also the blurred copy) and `archivoLoaded` is true. Transparent and Solid have no images.
  - The gate resets whenever version, face or tone changes, because the copy remounts.
  - Share and Save show their spinner until it's ready.
  - After 4 s not ready: "Couldn't make the image. Try again." Never a different card than the preview shows.
- **Lock while busy:** the three switches and both buttons are disabled while a capture or the share sheet is open.
  Closing the screen mid-share is safe: the file is released, and no status is set on an unmounted screen.
- **Denied:** "Photos access is off. Turn it on in Settings." gets an **Open Settings** button (`Linking.openSettings`).
- **Timing:** log `[share] capture <version> <ms> ms <bytes> B` for every capture (P8 reads it).
- *Checks:* A1–A5, N4.

**Step 3 · If step 1 showed a blank capture (only then).**
- **First fallback:** keep the copy inside the screen at `opacity: 0.01` behind the preview, not at `left: -10000`.
- **Last resort:** capture the preview at its scale with px ÷ (pixel ratio × scale). It's blurrier, so only if the
  first fails.
- *Checks:* N2 again.

**Step 4 · Share on the Lookbook look page (~2 h).**
- A share button in the look page's header (`LookPageScreen.tsx`), with the same rule as the card (`shareOffered`) on
  the look's shown check. A re-checked look opens `/share/<re-check id>`, so the stats are Before · After · Change.
- A look whose photo was deleted still shares: Transparent and Solid need no photo, and With photo shows the score on
  night.
- *Checks:* A6–A7, S6.

**Step 5 · The Simulator pass (~½ day).** Every version and tone, both system appearances, the largest text size,
VoiceOver, Save allowed and denied, the share sheet, a Release build.
- *Checks:* S1–S11, M1–M6 (the Mac image checks read the copies in the Simulator's Photos).

**Step 6 · The phone pass (founder, ~10 min, after the reinstall).**
- Real checks:
  - a propped shot;
  - a mirror selfie;
  - an older check with no measured heads;
  - a re-check win.
- Posting: an Instagram story, a TikTok photo post, Messages.
- *Checks:* P1–P8.

**Not planned for v1:**
- the Instagram Stories share API (needs a Facebook App ID);
- a separate Copy button with `expo-clipboard` (only if step 0 shows the share sheet's Copy doesn't paste as a
  sticker; then it's the founder's OK).

## 4. Automated checks (Jest; run in `npm run check`)

Already passing (SC1–SC7 in `shareCard.test.ts`):
- who's offered a card;
- three versions of one overlay;
- what it says (no occasion, fix, date, brand or Kit);
- copper only on the dot;
- light and dark solid;
- neck down by default and never stored;
- above Instagram's bottom 20%;
- the capture at px ÷ pixel ratio;
- the add-only save of the file itself, and the file released after use;
- native modules loaded only when present;
- one VoiceOver label with the score once.

New, written before steps 2 and 4. These are behavior tests with `react-native-view-shot`, `expo-sharing` and
`expo-media-library` mocked, not source matching:

| # | Check | Pass when |
|---|---|---|
| A1 | The ready gate | With photo: pressing Share before the photo's `onLoad` captures nothing until it fires; Transparent and Solid capture at once; a font not loaded holds every version; 4 s with no load → "Couldn't make the image. Try again.", no capture |
| A2 | The gate resets | Switching version, face or tone after ready makes it not ready until the new copy loads |
| A3 | One at a time | While a capture or the sheet is open, the switches and buttons are disabled; a second press starts nothing |
| A4 | Files released | `releaseCapture` runs once per capture: at once after a save (done, denied after capture, or failed), 30 s after the sheet closes (done or cancelled); unmounting mid-share still releases it and sets no state |
| A5 | Denied → Settings | A denied save shows the line and an Open Settings button that calls `Linking.openSettings` |
| A6 | The look page's button | Shown exactly when `shareOffered(shown check)`: hidden for a partial, a 6.5 single check, a scoring or failed check; shown for 7.0+ and for a re-check win below 7 |
| A7 | The look page opens the right check | A re-checked look opens `/share/<re-check id>`; a plain look opens its own check |
| A8 | The crop never shows a head | For 500 seeded random sets of head boxes, the neck-down crop's top is at or below the lowest head's bottom + 1.5%, or there's no photo |

## 5. Mac checks on the captured images (`tools/share/check_png.sh`)

The script reads the saved copies from the Simulator's Photos
(`~/Library/Developer/CoreSimulator/Devices/<UDID>/data/Media/DCIM/`), never the temp file, so a save path that drops
the alpha is caught.

| # | Check | Pass when |
|---|---|---|
| M1 | Sizes | `sips -g pixelWidth -g pixelHeight`: Transparent and Solid 1080 × 600, With photo 1080 × 1920. **Step 1's gate** |
| M2 | Transparent has no background, in Photos | The saved file is a PNG with alpha (`sips -g format -g hasAlpha`); pixels outside the overlay's box (20 px grid) have alpha 0; the text's pixels have alpha > 0.9 |
| M3 | Solid's corners clear, its ground solid | The 4 corner pixels have alpha 0; the center of each quarter is #121628 (dark) or #F3F4F6 (light), ±2 per channel, alpha 1 |
| M4 | With photo is opaque | Every sampled pixel has alpha 1 |
| M5 | No face when neck down | Apple Vision's face detector (`VNDetectFaceRectanglesRequest`, a short Swift script beside `extraction-test/vision/`) finds 0 faces in With photo, neck down, for all 12 demo photos; as a control, ≥ 1 face in Full photo on the photos that show one |
| M6 | Copper is only the dot | The pixels within ±12 of copper (#DE9762 or #9C5326) all fall within 6 px of the dot's center |

## 6. Simulator checks (screenshots in `screenshots/share-card/`, git-ignored)

| # | Check | Pass when |
|---|---|---|
| N1 | The build has the modules | `shareNativeReady()` is true; the share button shows on demo screen 7's 8.0 card |
| N2 | The capture isn't blank | Save on each version: the copy in Photos matches the preview (M1–M4), the photo is in it |
| N3 | Fonts in the image | The numerals are Archivo Condensed and the wordmark Archivo Expanded (not the system font), compared against the preview screenshot |
| N4 | Fast tap | Save right after opening the screen: the saved photo card has the photo (the ready gate held it) |
| S1 | Every version, both system appearances | All three versions and both solid tones look as on the published page, with the system in light and in dark; the solid card starts in the system's tone |
| S2 | Largest text size | The controls stack and nothing is cut; the card itself doesn't change (it's an image) |
| S3 | Words fit | On the card, every rating word ("Put together", "Getting there", "Dialed in") and every re-check row fits on one line, measured with `onTextLayout` on demo rows for each score from 7.0 to 9.5 |
| S4 | VoiceOver | The preview reads "Share card: 8 out of 10, Sharp." once (plus "Transparent sticker." on Transparent); each switch reads as a group with its choices; Share and Save read their labels; the status line is announced |
| S5 | Save, first time | iOS asks with "Save your Kitted card to Photos."; Allow → "Saved to Photos." and the image is in Photos |
| S6 | Save, denied | Don't Allow → the line and Open Settings, which opens Kitted's Settings; nothing saved, no crash |
| S7 | Share sheet | Share opens the sheet with the image; Messages, Copy and Save Image work; closing it says nothing |
| S8 | Neck down without a safe line | A demo check whose photo has no measured heads: With photo shows the score on night and "I can't tell where this photo starts below your face…" |
| S9 | Partial and low checks | Demo screen 11 (partial) and a 6.5 single check show no share button |
| S10 | Past chats | No share button on a past day's card |
| S11 | Release build | `npm run guard:release` passes; a Release build runs the share screen with the demo tools off |

## 7. Phone checks (founder; Claude reads `tools/phone/pull.sh` and the Metro log)

| # | Check | Pass when |
|---|---|---|
| P0a | Instagram photo sticker | The test PNG, added from Photos as a story photo sticker, shows with no box |
| P0b | Copy and paste | Photos → Share → Copy, then Paste in a story: a sticker with no box |
| P0c | Share straight to Stories | Records what happens (likely a solid background); decides the Transparent note |
| P1 | A propped check, neck down | The photo card starts below his chin (no face, no beard); Full photo shows the whole picture |
| P2 | A mirror selfie | Same as P1; the photo the right way round (as in the app) |
| P3 | An older check with no measured heads | With photo, neck down, shows the score on night, never a guessed crop |
| P4 | A re-check win | Before · After · Change, with the hollow and copper dots in the right places |
| P5 | Instagram story | The Transparent route from step 0 works; With photo posted as the story has nothing under the reply bar |
| P6 | TikTok | With photo as a photo post: the stats clear the caption and the side buttons |
| P7 | Messages | Solid, light and dark, looks clean on both chat backgrounds |
| P8 | Speed | Share opens the sheet within 1 s of the tap; the log shows the capture under 600 ms |

## 8. Results

- **Oct 18 (#350):** the 3× size, the save path and the temp files fixed in `exportCard.ts`; SC6 now checks them. Jest
  green. Not yet run on iOS.

## 9. Decisions and asks

- **Settled by Claude:**
  - the ready gate (images and font; it resets on every switch; 4 s then "Couldn't make the image");
  - the lock while busy;
  - Open Settings on denied;
  - the release timing;
  - the capture fallbacks, in order;
  - the look page's button;
  - the check lists above.
- **Needs the founder:**
  1. step 0 on his phone (5 min; the PNG is ready);
  2. ~5 GB of free disk before step 1 (3.9 GB on Oct 18);
  3. OK the photo prompt "Save your Kitted card to Photos." (outward-facing);
  4. the reinstall and the phone pass (step 6).
