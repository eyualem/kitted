# Share cards: policy and engineering review

## Blocking
1. **The p01b/p01a pair is wrong.** He wears socks and no shoes, so the "white leather sneakers" line is false. The "before" shows the overshirt in his hands, and the "after" is a different room and pose. That breaks "same fit, one fix" (a2, b1 #5, b3, c2). Replace the pair.
2. **c2 LOUD "NOT SHARP. YET."** The app calls 7.5 "Put together", so this renames a score. It's also a negative line on the face-shown cut, which invites pile-ons. Use "7.5. ONE FIX."
3. **c1 "SCORE IN 3 S"** is false: the read takes about 6.6 to 8 s. Cut it, or say "Score in seconds."
4. **a3 link preview (trykitted.com/f/…)** needs his photo on a public host. That breaks "our server stores no photos" and the consent copy. Drop it for v1 and share the PNG file.
5. **Brands in piece names.** Closet names keep a brand seen once ("Grey Nike hoodie", #115). Cards must build a brand-free name (kind + color + cut).
6. **Other people.** s25, shown face-on in b1, has a framed photo of people on the wall and printed tees. Pick another demo. The app can't check for bystanders, so the "Show my face" toggle should say it shares the whole photo.

## Should fix
- **c3 and sticker #6 ("Guess the score"):** this is the most likely format to pull comments about his face or body. Make the copy "Guess the fit's score." and lock it to neck-down.
- **b2 "FIT TICKET Nº 0412 · 18 OCT 2026 · 4:12 PM":** the app computes no ticket number. A serial reads as a collectible. Time to the minute plus the place in the photo tells strangers where he was. Show the date only.
- **b3 recap:** the copper "BEST FIT" tab is a ranking badge, and it uses copper that isn't score movement. The counts don't match the 8 shown: "7 of 12 minimal" with 2 visible, and "khaki chinos in 5 fits" with 3 visible, which mix tan and khaki. Use one face toggle for all 8, default neck-down, and never reuse an earlier share's face choice.
- **a2 "Why it works":** nothing computes this line. Build it from the engine's Why reasons, or drop it.
- **Partial checks:** stickers, tags and pills have no room for "Partial check: shoes not included". In v1, offer no share card for a partial check.
- **Neck-down in the app:** take the crop from the face box saved at photo prep, not a fixed fraction. If there's no face box, show only the garment-flat card (D20).
- **Names:** "Burgundy turtleneck" and "Sweater" are the same piece, and so are "Cream overshirt" and "Cream check overshirt". Read the stored names. Use "SCORED BY KITTED", not "SEALED BY KIT".
- **Scores:** 7.5 → 8.5 is illustrative, and demo 10's story broke in v6. Check the engine's real numbers before any public video.
- **D20 is stale:** it still has the occasion pill and says "the face never appears". Log the face toggle and edit D20.

**Passed:** no emoji, "unlimited", "AI stylist", occasion, streaks, or pending fix on a single check. Both face states appear per family. The neck-down crops I checked show no chin.

## Build cost
| Format | Rendered by | New deps | Days | When |
|---|---|---|---|---|
| A1 story, A2 slides 1+3, A3 1:1 | `react-native-view-shot` of an offscreen view at 3x; RN `Share` with a file URL | view-shot; `expo-media-library` for Save (or the share sheet's Save Image); `NSPhotoLibraryAddUsageDescription` | 2–2.5 | **v1** |
| A2 slide 2, A3 16:9 and 2:3 | view-shot | none | 0.5–1 | v1 if time |
| B2 tag still | view-shot | none | 1 | v1 or v1.1 |
| B3 recap | view-shot + month queries | none | 1.5 | v1.1 |
| Videos: C1, C2, C3 loop, B2 swing | Own Swift module: `AVAssetWriter` + Core Animation layers, or Skia offscreen frames → AVAssetWriter. Not ffmpeg-kit (retired 2025). Not Remotion (web only; server rendering would upload his photo). view-shot per frame is too slow. | none (Swift); `@shopify/react-native-skia` if Skia | 4–6 for the renderer + 1–2 per format | later; C2 premium first. |
| B1 IG Stories sticker | `instagram-stories://` + pasteboard, own native module or `react-native-share` | Facebook App ID (Meta developer account), `LSApplicationQueriesSchemes` | 1.5 | v1.1 (D20 defers it) |
| B1 Snapchat | Creative Kit SDK | Snap Kit registration + SDK | 1–1.5 | later |
| C3 green screen + TikTok Share Kit | view-shot PNG; Share Kit green-screen format (check the current SDK) | TikTok developer app + review, OpenSDK, expo-media-library | 2–2.5 | later |
| A3 link preview | server image + web page | hosting, domain, consent change | 3+ | later, after a privacy call |
