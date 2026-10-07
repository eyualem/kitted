# 09. Photos in the UI: what to show, where it lives, what leaves the phone

Written Oct 6, 2026, for Kitted v1 (SwiftUI, iOS 18+, Supabase proxy, Gemini vision).

## Recommended decisions (ranked)

1. **Fix the age conflict first.** Gemini's API terms (updated Mar 23, 2026) say you must not use it in an app "likely to be accessed by individuals under the age of 18." A 14+ app breaks that. **Recommended:** launch at 18+ (the core audience is 18–30 anyway), or move the vision call to a provider whose terms allow 13–17 with safeguards (OpenAI, Anthropic) before letting teens in.
2. **Upload a neck-down crop, not the full photo.** Crop just above the collar using body pose, then blur any face still detected. This makes "faces never leave the phone" true even when face detection misses.
3. **Inside the app, show the full photo only where he looks at one check** (the chat bubble, the fit-check card, Lookbook detail). Grids, the calendar, the closet and share cards use **neck-down crops or garment cut-outs**.
4. **Closet tiles come from Gemini boxes plus the Apple person mask.** Crop each garment by its `box_2d`, then remove the background with `VNGeneratePersonInstanceMaskRequest`. If that fails, use the plain crop. If there's no usable crop, show a category icon in the item's color.
5. **Items he photographs on their own** (Closet "+") use `VNGenerateForegroundInstanceMaskRequest` for a clean cut-out.
6. **Capture:** use a custom AVFoundation camera and `PhotosPicker`. **Never ask for library access.** Ask for the camera only at his first "Check my fit" tap. Ask for add-only Photos access only when he saves a share card.
7. **Storage:** keep photos in Application Support as HEIC with file protection, and **leave them in the iPhone's own backup.** That way a new phone restores his Lookbook. Opt-in iCloud sync (CloudKit private database) comes in v1.1. **Never store photos in Supabase.**
8. **Server:** the proxy handles the image in memory and keeps only a hash and the garment JSON. Use **paid Gemini only** (the free tier lets human reviewers read and train on uploads). Disclose Google's 55-day abuse log in the consent and the privacy label.
9. **Run the clothed check on the phone before upload *and* before saving.** A blocked photo is never written to disk. Apple's Sensitive Content Analysis is only a bonus layer, because it's off for most users.
10. **Share card:** a neck-down crop rendered with `ImageRenderer` and shared with `ShareLink`, plus a small "scored by Kitted" watermark. The Instagram Stories sticker API waits for v1.1.

---

## 1. Can the UI show his photos, and where?

Yes. They're his photos on his phone, and no rule stops an app from showing a user his own images. The design question is **context**. A grid of 40 faces looks like a dating profile and shows his face to anyone glancing at the screen. A grid of outfits looks like a lookbook. Show the clothes, keep the face for detail views, and never show the face anywhere it could leave the phone.

- **Full original:** the chat bubble (it's his message, like iMessage) and Lookbook detail (with an eye toggle to hide the face).
- **Neck-down crop:** the fit-check card (the thing that gets screenshotted), Lookbook grid and calendar, the share card, and the paywall "your result" (a face beside a price feels manipulative).
- **Garment cut-outs:** closet tiles and item detail (§2).
- **No photo:** the You tab. Use the silhouette and a storage line ("31 photos · 42 MB").

The full mapping is in the table near the end.

## 2. Closet images from fit-check photos

**What Apple can and can't do:**
- **`VNGenerateForegroundInstanceMaskRequest` (iOS 17+)** lifts "salient objects" of any kind. On a photo of a person, the whole dressed person comes out as one instance, not a shirt and pants. It's great for a garment lying flat or hanging, useless for splitting an outfit.
- **`VNGeneratePersonSegmentationRequest` / `VNGeneratePersonInstanceMaskRequest` (iOS 17+)** give a mask of each person (up to 4). Good for removing the background, and for masking other people.
- **VisionKit subject lifting (`ImageAnalyzer` + `ImageAnalysisInteraction`, iOS 17+)** exposes `subjects` and `image(for:)` in code. It's the same engine as long-press "Lift Subject," so it has the same limit: it lifts the person, not each garment. It's useful later as a "fix the cut-out" tool.
- **No Apple API segments clothing by garment.**

**Recommended v1 pipeline:**
1. Schema v4 already plans per-garment `box_2d` (07_detail-engineer T5). Map each box from the uploaded crop back to the original photo, and add about 6% padding.
2. Crop the original at full resolution. **Clamp the top garment's top edge below the face box or the neck point**, so a closet tile can never contain a face.
3. Inside the crop, apply the person mask so the room disappears. Place the result on a soft neutral tile, centered.
4. Shoes come from the shoe snap when there is one (sharper and closer).

**Fallbacks:**
- The mask fails (low light, a busy background): use the plain rectangular crop with rounded corners.
- The box is missing, or the item is under 120 px: show the category icon in the detected color family, with a "Photo it" chip.
- Never fake it with a stock image presented as his item.

**Competitors:**
- **Whering, Acloset, Indyx, Alta:** automatic background removal on single-item photos. Alta also imports from receipts and finds the original product photo.
- **Cladwell:** pushes generic "similar item" library images, and reviewers say its background removal struggled.
- **fitd.:** rate-only, no closet. Photos are "Linked to You"; rated 4+.

**Takeaway:** clean cut-outs are expected in the closet category. Kitted's edge is that tiles appear **automatically from fit checks**, which no one above does.

## 3. Capture and import

- **Camera (AVFoundation):** this is required for the propped-phone body outline and the 3-2-1 capture. Add `NSCameraUsageDescription`: "Kitted uses the camera to check your outfit. Photos stay on your iPhone." The system prompt appears on his first camera tap (in onboarding, at the first fit check), never at launch. If he declines, show "Choose a photo instead" and a link to Settings.
- **`PhotosPicker`:** runs outside the app, needs **no permission and no plist string**, and supports multi-select (`maxSelectionCount: 20` for Closet "+"). Guideline 5.1.1(iii) tells apps to prefer exactly this. Re-encode every import through ImageIO to strip EXIF and GPS.
- **Full or limited library access:** don't request either. Limited access only adds the "select more photos" prompt and a settings burden for no gain.
- **Saving the share card:** "Save Image" in the share sheet needs `NSPhotoLibraryAddUsageDescription` (add-only) or the app crashes: "Save your Kitted card to Photos."

## 4. Storage and privacy

**On the phone:**
- **Files:** `Application Support/Photos/{checkID}/`, holding the original HEIC (2048 px long edge, quality 0.7, about 300–500 KB), a neck-down thumbnail (400 px, about 30 KB) and cut-outs (HEIC with transparency, about 50 KB).
- **Thumbnails:** generate them with `CGImageSourceCreateThumbnailAtIndex` at capture, so grids never decode full photos.
- **File protection:** `.complete` for originals and the default class for thumbnails and the database.
- **Growth:** at 1 check a day plus snaps, expect about 200–250 MB a year.

**New phone:** don't set `isExcludedFromBackup`. Apple's backup guidance says content the user created belongs in the backup. iCloud Backup and Quick Start then restore the Lookbook. That backup is his own Apple account (end-to-end encrypted with Advanced Data Protection), not Kitted's servers, so the promise holds.
- **Promise wording:** "Your photos are stored on your iPhone and in your iPhone's own backup. Kitted never keeps them."
- **v1.1:** opt-in "Sync photos with iCloud" through the CloudKit **private database**. Apple encrypts CKAssets, they count against his iCloud storage, and we can't read them. Wording: "Keep your Lookbook on all your Apple devices, using your iCloud. Kitted can't see it."

**Deletion:**
- Per look, per item, and "Delete all photos" (confirmation dialog). This deletes local files and the CloudKit records.
- Delete account (required by 5.1.1(v)) also deletes the server JSON.
- Retention choices from 03_ia_ux §7.2 stay: keep / cut-outs only / 30 days.

**What leaves the phone:**
- **Uploaded:** only the processed neck-down JPEG (1024 px, faces blurred, no metadata) and the shoe-snap crop.
- **Proxy:** handles the image in memory. Don't log request bodies, and don't write it to storage.
- **Kept on our server:** the SHA-256 of the processed upload (for "same photo, same score"), the garment JSON and the score.
- **Kept by Google:** on the paid tier, Google doesn't train on prompts or images but **keeps them 55 days for abuse monitoring**.

**Consent screen (5.1.2(i) requires naming the third-party AI and an explicit opt-in):**
> "To read your clothes, a copy of your photo cut off at the neck, with faces blurred, is sent to Google's Gemini AI. Google keeps it up to 55 days for safety checks and doesn't use it for training. Kitted doesn't store it. [I agree] [Not now]"

**Privacy nutrition label:** Apple counts data as "collected" when a partner can read it longer than the request takes. Because of Google's 55 days, **declare Photos or Videos: App Functionality, not linked, not tracking.** It's honest, and it doesn't hurt: fitd. and Alta both declare more.

**Guideline 1.2:** it only applies if users can see each other's content. Keep v1 free of feeds and submissions, and it doesn't apply.

**Minors (if allowed later):**
- The UK Children's Code expects privacy at maximum by default and sharing off by default.
- COPPA: keep the under-14 block.

**GDPR and faces:** Recital 51 says photos are biometric data only when processed to *identify* someone. Face *detection* for blurring is not recognition. Never store face boxes, never build face templates, and pick "Which one is you?" by tap, never by face matching. This also keeps clear of Illinois BIPA.

## 5. Face handling

- **Upload copy:** crop neck-down from the body-pose neck and shoulder points. Then run `VNDetectFaceRectanglesRequest` on what's left, grow each box by 30%, and use **heavy pixelation or a solid fill**. A light Gaussian blur can be partly reversed.
- **If body pose fails:** blur the full frame above the top garment box.
- **Risk to test:** neck-down uploads drop hats and glasses, and the extraction tests used full photos. Re-run the X-series consistency test on cropped inputs before locking this.
- **In the UI:** his originals stay unblurred in his chat and Lookbook detail. Blurring a man's own face from himself feels broken. Share cards and the paywall are neck-down.
- **Mirror selfies:** the phone often covers the face, so detection fails. The neck-down crop covers this case, and the phone itself is out of frame. Also hide the phone's outline in the cut-out by clamping to the garment box.
- **Other people:** `VNDetectHumanRectanglesRequest` counts people. If there's more than one, ask "Which one is you?" (a tap), then mask everyone else completely with the person instance mask before upload and on share cards. Their clothes never enter his closet.

## 6. Share cards

- **Render:** a SwiftUI view through `ImageRenderer`, at 1080×1920 (Stories) and 1080×1350 (feed).
- **Contents:** the neck-down crop (from the pose neck point minus a small margin), the score, the verdict, "6.0 → 6.5 after 1 fix," and a small watermark: "scored by Kitted · trykitted.com."
- **If pose fails:** show a collage of his garment cut-outs instead of the photo.
- **Export:** `ShareLink` with a `Transferable` image and a `SharePreview`. Instagram, TikTok and Messages appear there for free.
- **Instagram Stories sticker (v1.1):** the `instagram-stories://share?source_application=<Meta App ID>` scheme with `com.instagram.sharedSticker.stickerImage` on the pasteboard, plus `LSApplicationQueriesSchemes`. It needs a Meta developer app ID. The payoff is a card that lands as a movable sticker over a background color.

## 7. Risks and edge cases

- **Not fully clothed:**
  - Run on the phone, before upload and before anything is saved. Use a bundled Core ML clothed/unclothed classifier (check its license) plus a body-pose skin-area heuristic.
  - Use `SCSensitivityAnalyzer` only when its policy isn't `.disabled`. It needs an entitlement and only works if the user turned on Sensitive Content Warning or Communication Safety.
  - Server backstop: a `not_fully_clothed` field in the schema plus Gemini's safety blocks. If either fires, the proxy refuses and the app deletes the local file too.
  - Copy: "I score outfits you'd wear out."
- **Screenshots of other people:** `PhotosPicker` can't tell us it's a screenshot. Guess from the clues: screen-sized pixels and no camera EXIF (Make/Model). Then ask "Is this you?" If no, use inspiration mode: no score for the person, nothing added to the closet, and nothing saved to the Lookbook.
- **Storage growth:** show the size in Privacy, offer "Keep only thumbnails after 90 days," and handle a full disk without crashing.
- **Low light:** the quality gate (average brightness via `CIAreaAverage` plus pose confidence) asks for a retake before upload, and it doesn't use up the free check. Cut-outs fall back to plain crops in dim photos.
- **Wrong cut-out:** "Not quite right?" on an item offers "Retake item photo" and "Use icon instead."

---

## Screen → image shown → source → stored where

| Screen | Image shown | Source | Stored where |
|---|---|---|---|
| Stylist chat bubble | Full original | Camera / PhotosPicker | Device (Application Support), in his iPhone backup |
| Fit-check card | Neck-down crop (tap for full) | Derived from original via body pose | Device |
| "Why this score" sheet | None, or garment cut-out chips | Gemini boxes + person mask | Device |
| Lookbook grid / calendar | Neck-down thumbnail, 400 px | Derived at capture | Device |
| Lookbook detail | Full original + shoe snap, hide-face toggle | Original | Device |
| Closet tile | Garment cut-out → plain crop → color icon | Gemini `box_2d` + person mask, or foreground mask for solo shots | Device |
| Item detail | Large cut-out + "Seen in" neck-down thumbnails | Same | Device |
| Share card | Neck-down crop or cut-out collage + watermark | `ImageRenderer` | Not stored; exported only by his choice |
| Paywall "your result" | Score card with neck-down crop | Derived | Device |
| You tab | Silhouette, no photo | Basics | Device |
| Uploaded to proxy | Neck-down, face-blurred JPEG, no EXIF | Processed copy | Memory only on our side; Google keeps 55 days; our server keeps a hash + JSON |
| v1.1 iCloud sync | Originals + cut-outs | Device | His CloudKit private database (opt-in) |

## Open questions for the founder

1. **Age:** launch at 18+ to fit Gemini's terms (recommended), or switch the vision provider so 14–17 can use photo checks?
2. **Upload crop:** OK to send neck-down only, which loses hats and glasses as rated items, once the re-test confirms consistency holds?
3. **Lookbook grid:** neck-down thumbnails (recommended) or full photos?
4. **Default original retention for adults:** forever (recommended, with a visible storage line) or 90 days, then thumbnails?
5. **iCloud sync:** v1.1 (recommended), or required for launch?

## Sources

- Apple App Review Guidelines 1.2, 5.1.1, 5.1.2(i): https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details ("collect" definition, Photos or Videos): https://developer.apple.com/app-store/app-privacy-details/
- Gemini API Additional Terms (age, paid vs. unpaid data use, Mar 23, 2026): https://ai.google.dev/gemini-api/terms
- Gemini abuse monitoring (55-day retention): https://ai.google.dev/gemini-api/docs/abuse-monitoring
- Developer question on Gemini age terms (unanswered): https://discuss.ai.google.dev/t/age-restrictions-in-gemini-api-terms-general-audience-app-rated-3-with-an-adult-only-ai-feature/179916
- Anthropic guidelines for organizations serving minors: https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors
- OpenAI terms (13–17 with parental permission): https://conductatlas.com/platform/openai/openai-terms-of-use/age-restriction-and-parental-consent/
- Vision foreground instance mask: https://developer.apple.com/documentation/vision/vngenerateforegroundinstancemaskrequest and WWDC23 "Lift subjects from images in your app": https://developer.apple.com/videos/play/wwdc2023/10176/
- Person instance mask / segmentation: https://developer.apple.com/documentation/vision/vngeneratepersoninstancemaskrequest , https://developer.apple.com/documentation/vision/vngeneratepersonsegmentationrequest
- Face rectangles / human rectangles / body pose: https://developer.apple.com/documentation/vision/vndetectfacerectanglesrequest , https://developer.apple.com/documentation/vision/vndetecthumanrectanglesrequest , https://developer.apple.com/documentation/vision/vndetecthumanbodyposerequest
- VisionKit ImageAnalysisInteraction (subjects): https://developer.apple.com/documentation/visionkit/imageanalysisinteraction
- Sensitive Content Analysis (policy disabled unless the user setting is on): https://developer.apple.com/documentation/sensitivecontentanalysis/scsensitivityanalyzer
- PhotosPicker: https://developer.apple.com/documentation/photokit/photospicker
- NSPhotoLibraryAddUsageDescription: https://developer.apple.com/documentation/bundleresources/information-property-list/nsphotolibraryaddusagedescription
- File protection: https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files ; backup guidance: https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup
- CloudKit encryption: https://developer.apple.com/documentation/cloudkit/encrypting-user-data
- ShareLink / ImageRenderer: https://developer.apple.com/documentation/swiftui/sharelink , https://developer.apple.com/documentation/swiftui/imagerenderer
- Instagram Sharing to Stories: https://developers.facebook.com/docs/instagram-platform/sharing-to-stories
- UK Children's Code: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/
- COPPA Rule: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- GDPR Recital 51 (photos and biometrics): https://gdpr-info.eu/recitals/no-51/
- Illinois BIPA: https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004
- Competitors: Alta App Store page https://apps.apple.com/us/app/alta-daily-digital-ai-closet/id6481705400 ; fitd. https://apps.apple.com/us/app/-/id6744093706 ; Whering vs. Cladwell https://myindyx.com/versus/whering-vs-cladwell ; Acloset vs. Cladwell (Indyx) https://www.myindyx.com/versus/acloset-cladwell
