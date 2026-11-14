# T96 · Every face that isn't hidden gets found before the copy leaves the phone

**Size:** strict (privacy: what leaves the phone) · **From:** `plan.md` → T96 · **Spec:** `specs.md` (approved, #388) → F2.2 ("Only the face-blurred copy leaves the phone; with no head found, nothing is sent and the card says why"), §"How a check works" step 1 ("A copy with every face blurred is made for sending"), the "Head not found" row and the **Never** line ("a face sent unblurred"); CLAUDE.md hard line on privacy; ruling 10 (when in doubt, send nothing) · **Lane:** Fit check and scoring · **Files named on the plan line:** `app/modules/kitted-vision/ios/KittedPrep.swift`, `extraction-test/vision/`

## Goal
A fit check, a shoe or pants snap, or a clothes scan never sends a stranger's face (or a second reflection of his): faces too small for one whole-photo look, people the person detector misses, and heads seen only as body points are hidden or covered; and if a face can still be found in the copy about to be sent, nothing is sent.

## What is there today (read Nov 14, main at 1c34082d)
- `Prep.locate` runs Vision's face detector **once on the whole 2048 px image**. Faces 12–50 px in the 1024 copy are missed (`tasks/T96/baseline/BASELINE.md`: 59 of 1,513 photos sent with a stranger's face; 185 boxes; every one found by the same detector once the photo is tiled).
- Other people are covered grey only when the **human-rectangle detector finds 2+ people** (`people.count >= 2` gates `personInstances`); small, seated, cut-off or reflected people aren't found, so `others` stays empty.
- `VNDetectHumanBodyPoseRequest` returns every body it sees, but only **his** body's head joints are used.
- `Prep.run`: `covered = coverOthers(image, cover)`, `hidden = hideRegions(covered, hide)`; `hidden` feeds the upload (1024), the detail copy (2048, the source for closet crops), the close-ups (`zoomCrops`) and, for a scan, `sendUri`. Nothing checks `hidden` after it's made.
- On any refusal `run` returns `["status": "couldNotFrame", "sha256", sourceWidth, sourceHeight]` before writing a file. JS (`services/imagePrep/real.ts`) passes `status` on and logs the rest; `couldNotFrame` → `photoProblem` → the existing toast `cam.retake.cantFrame`; a scan → `cantHide`. **No JS change is needed** and none is planned.
- The camera's quick look after the shot (`Guide.assess`) calls `Prep.locate` on a 1024 copy; closet measuring (`Measure.run`) calls `Prep.locate(kept)` for head regions. Neither sends anything.
- "Try again" (`reloadUpload`, `reloadZoom`) resends `Caches/upload/<sha>.jpg` and `<sha>-<kind>.jpg` from the first prep.
- Mac timing today (`kmeasure prep`, 4 of his phone photos, Nov 14): visionMs 180–246, totalMs 347–503.

## What changes

The fix, the files and the interfaces below (sections "The fix", "Files", "Interfaces") are what changes.

## The fix (chosen, with reasons)
Four layers, all in `Prep.run` after `locate`, so the quick look and closet measuring stay as fast and as they are:

1. **Other people's heads from the body pose (free).** `locate` already has every body; each body that isn't his (every body, for a snap or a scan) with a head point (nose, an eye or an ear, confidence > 0.3) gets a head region. This is the only layer that sees a **profile** (an ear and a nose), the #468 side-mirror case, since the face detector misses strong profiles. Kept in a new `Located.otherHeads`, not in `hide`, so `Measure` and `assess` are unchanged.
2. **People the person detector misses (fit only).** The person instance mask runs on every fit photo, not only when 2+ boxes are found. Every outline label that isn't his and is at least `instanceMinShare` of the frame is covered grey like any other person (`coverMasks`). It is **never** a "Which one is you?" candidate (the question's rule is unchanged), so this can't add a question. This covers a second reflection of him in another mirror panel and people beside him the box detector skipped.
3. **Small faces: look again at the copy about to be sent, in tiles.** The face detector runs on the covered, hidden image over the whole frame and overlapping 2×2 and 3×3 tiles (each tile is zoomed by Vision, so a 12 px face becomes findable). Every face it finds there is, by definition, still visible, so it is hidden too. Running it on the *output* rather than the original makes one pass do both jobs: find what was missed and check the result.
4. **Send nothing when a face may remain.** After hiding what layer 3 found, the detector runs again on every tile that touches a newly hidden region. If any face is still found, or any detector call fails, the photo is refused (`couldNotFrame`, with a `reason` for the log). Pixels outside the new regions didn't change, so tiles that don't touch them needn't be re-checked.

Why not the other options alone: hiding every *found* face is already done (the gap is faces never found); a refusal check alone would refuse every audience photo instead of hiding the faces (the plan line says hide or cover first, refuse only when in doubt); covering people alone misses faces with no person detected around them (a crowd, a poster-sized photo, a 12 px face).

**Cost:** layer 1 is free; layer 2 adds one instance-mask run on photos with one person (Mac: about 100 ms, measured in this task); layer 3 adds 14 face-detector calls (1 + 4 + 9 tiles); layer 4 adds calls only when layer 3 found something. Budget in TESTING.md (Mac median added ≤ 400 ms, p95 ≤ 800 ms); the phone's number comes from the `[prep]` log after the next install.

## Files
- `app/modules/kitted-vision/ios/KittedPrep.swift`: `Located.otherHeads` (set in `locate`), `Face`, `FaceDetect`, `detectFaces`, `faceGrids`, `tiles`, `instanceMinShare`, `Swept`, `sweep`, `sweepVersion`, `purgeOldSends`; `run` gains the `detect` parameter, uses `sweep`'s image for every copy, adds result keys, returns the new refusal. `cpuOnSimulator` for every new request.
- `extraction-test/vision/main.swift`: `kmeasure prep <photo> <root> [--kind fit|snap|items]`; `kmeasure zoom` and `kmeasure people --out` make their copies through `sweep` (with the cover), so face-hidden photo sets made on the Mac (#468) match what the app would send. `build.sh` unchanged unless a file is added.
- `extraction-test/vision/face_leak_test.py`: **the test writer's, locked** (see TESTING.md). The implementer never edits it.
- `extraction-test/results/t96/`: the measurement output (JSON committed; crops and sheets are images, git-ignored by `extraction-test/results/**/*.jpg|png`).
- Not touched: `KittedVisionModule.swift`, `KittedGuide.swift`, `KittedMeasure.swift`, every JS/TS file, `en.ts`. If the build finds it needs one of them, stop and raise it (open question), don't edit.

## Interfaces (everything a test calls)
All boxes are in pixels of the decoded working image (long edge ≤ `Prep.workPx` = 2048), origin top-left, unless a line says "normalized".

```swift
extension Prep {
  /// One face the detector found: its box (pixels, origin top-left, in the whole image) and Vision's confidence.
  struct Face { var box: CGRect; var confidence: Float }

  /// Finds faces inside `rect` of `image` and returns them in the whole image's pixels. Throws when the request fails.
  typealias FaceDetect = (_ image: CGImage, _ rect: CGRect) throws -> [Face]

  /// The real detector: VNDetectFaceRectanglesRequest on `image.cropping(to: rect)` (cpuOnSimulator), every result
  /// kept (no confidence floor), mapped back to the whole image.
  static func detectFaces(_ image: CGImage, in rect: CGRect) throws -> [Face]

  /// The tile grids the sweep looks at: 1 = the whole image, n = n×n overlapping tiles.
  static let faceGrids: [Int] = [1, 2, 3]

  /// The tiles for `grids`, in order (grid by grid, then column, then row): for each n, tile side
  /// W/(0.75n+0.25) × H/(0.75n+0.25), stepped by 0.75 of a side, `.integral`, clipped to the image.
  /// [1, 2, 3] → 14 rects; their union is the whole image (the same geometry as `tasks/T96/baseline/oracle.swift`).
  static func tiles(W: CGFloat, H: CGFloat, grids: [Int]) -> [CGRect]

  /// Fit only: an outline label from the instance mask that isn't his is covered when its pixels are at least this
  /// share of the mask grid.
  static let instanceMinShare: CGFloat = 0.002

  /// What the sweep decided.
  struct Swept {
    var status: String          // "ok" | "couldNotFrame"
    var reason: String?         // nil when ok; "faceRemains" | "sweepFailed" when refused
    var image: CGImage?         // the copy to send (covered, then every region hidden); nil when refused
    var hide: [CGRect]          // every region hidden in `image`: found.hide + found.otherHeads + headBox of each swept face
    var cover: Guide.Gray?      // the final cover (found.cover plus missed people), nil when none
    var swept: [Face]           // faces the tile pass found in the covered, hidden copy (then hidden)
    var coveredExtra: Int       // people covered that locate didn't cover (missed by the person detector)
    var ms: Int                 // the sweep's time
  }

  /// Layers 2–4 above, on the upright working image. Never changes found.status; only adds hiding or refuses.
  ///  1. cover = found.cover ∪ (kind == .fit: every instance label ≠ his with ≥ instanceMinShare of the grid, via
  ///     coverMasks; his = the label with most pixels inside found.main, as sortPeople)
  ///  2. hide = found.hide + found.otherHeads; img0 = hideRegions(coverOthers(image, cover), hide)
  ///  3. F = detect(img0, t) for every t in tiles(faceGrids), de-duplicated (IoU ≥ 0.5 keeps the larger)
  ///  4. F empty → ok with img0. Else hide += F.map(headBox); img1 = hideRegions(coverOthers(image, cover), hide);
  ///     R = detect(img1, t) for every t in tiles(faceGrids) that intersects any headBox(F).
  ///     R non-empty → couldNotFrame / "faceRemains"; else ok with img1.
  ///  Any detect throw, or coverOthers/hideRegions returning nil → couldNotFrame / "sweepFailed".
  static func sweep(_ image: CGImage, found: Located, kind: Kind, detect: FaceDetect = detectFaces) -> Swept

  /// As today, plus `detect` (the app always uses the default). Order: decode → locate (status as today) → sweep →
  /// files. Every copy that can leave the phone is cut from Swept.image: the upload, the detail copy, the close-ups,
  /// and a scan's sendUri. The kept photo and thumb stay his unblurred photo, as today.
  static func run(uri: String, kind: Kind = .fit, pick: [Double]? = nil, detect: FaceDetect = detectFaces) throws -> [String: Any]

  /// Retry payloads made before this sweep existed are never resent (an upgrade with a failed check waiting).
  static let sweepVersion = 1
  /// If `<caches>/upload/.sweep-v<sweepVersion>` is missing: delete every *.jpg in `<caches>/upload`, then write the
  /// marker. Called by run before it writes anything (with rootOverride's Caches on the Mac). Caches/detail untouched.
  static func purgeOldSends(caches: URL)
}

// Located gains:
//   var otherHeads: [CGRect] = []
//   .fit: one region per body-pose observation that isn't his `body`, set on the path that returns "ok".
//   .items/.snap: one region per body, set before the early "no person needed" return (a body with only head
//   points has no person box, and its head must still be hidden).
//   A body counts when it has ≥ 1 of nose/leftEye/rightEye/leftEar/rightEar at confidence > 0.3.
//   Region: headBox(around:) a square centred on the mean of those points, side = max(2.2 × their spread,
//   0.9 × shoulder span when both shoulders > 0.3, 0.02 × max(W, H)).
```

**`run`'s result** (keys added; existing keys unchanged; JS ignores the new ones):
- `ok` (fit and snap): `"sweptFaces": Int` (Swept.swept.count), `"otherHeads": Int`, `"coveredExtra": Int`, `"sweepMs": Int`, `"hidden": [[Double]]` (Swept.hide, normalized [x, y, w, h], origin top-left), `"zoomRects": [[Double]]` (each close-up's rect, normalized, in `zoomKinds` order; `[]` when none). `faceBoxes` becomes `Swept.hide.count`.
- `ok` (items): the same four counts and `"hidden"`.
- Refused by the sweep: exactly `["status": "couldNotFrame", "reason": "faceRemains" | "sweepFailed", "sha256": …, "sourceWidth": …, "sourceHeight": …]`. No `uploadBase64`, no file written under Documents or Caches (not the kept photo, thumb, upload, detail, close-ups or scan files), the temporary original not deleted (as every refusal today).
- Statuses `noPerson`, `multiplePeople`, `couldNotFrame` from `locate` return exactly as today (no `reason` key, no sweep run).

**Harness (`kmeasure`, Mac only):** `kmeasure prep <photo> <root> [--kind fit|snap|items]` prints `run`'s result (base64 shortened, as today); files under `<root>/Caches/upload/<sha>.jpg`, `<sha>-<kind>.jpg`, `<root>/Caches/detail/<sha>.jpg`, `<root>/Documents/scans/<sha>-send.jpg`. `kmeasure zoom` and `kmeasure people --out` write copies made through `locate` + `sweep` (status other than ok → no copy).

**UI:** none. No new screen, state, words, testID or demo screen. A sweep refusal reaches the user through today's `couldNotFrame` paths (see TESTING.md → UI inventory).

## Data
No stored data changes. One new marker file, `Caches/upload/.sweep-v1`. The one-time purge deletes old retry payloads in `Caches/upload` only.

## Steps
1. `main.swift`: `prep --kind`. Optionally (heavy) re-run the baseline (`runprep.sh`, `compare.py`) on this branch before any change to confirm the 59 and the statuses in `baseline/before/prep.jsonl` (sanity, not a test).
2. `Located.otherHeads` in `locate` (no change to `hide`, `status` or anything else `locate` returns).
3. `Face`, `FaceDetect`, `detectFaces`, `faceGrids`, `tiles`.
4. `sweep`: the cover for missed people (reuse `personInstances`, `sortPeople`'s "his" rule, `coverMasks`, `coverOthers`); hiding; the tile pass; the re-check; the refusals. Wrap tile work in `autoreleasepool`.
5. `run`: `purgeOldSends`, the sweep after a non-refused `locate` for every kind, `Swept.image` for every copy, the new keys, the refusal. `zoomCrops` takes the swept image (its `image:` argument stays the original for sizing).
6. `kmeasure zoom` / `people --out` through `sweep`.
7. Run `face_leak_test.py --quick` while building, then `--full` once (heavy: check `top -l 1 | grep PhysMem` first, nothing else heavy at the same time, CLAUDE.md rule 8). Tune `instanceMinShare` and the `otherHeads` box only on the **tuning sets** (`leak-set.json`, `normal-set.json`); never look at or tune on the held-out or synthetic sets. Any constant changed from this file goes in TASK.md → Built and a DECISIONS-LOG entry.
8. `face_gap.py run after` and `compare` (#304's checks), `npm run check` in `app/`, the iOS build compiles (Simulator, `--no-bundler`, only if memory allows; otherwise say so).

## Must not break
- `locate`'s results: status, `hide`, `main`, `joints`, `candidates`, `others`, `cover` byte-for-byte the same, so the camera's quick look, "Which one is you?" and closet measuring don't move (face_gap.py H1–H6 stay green; `kmeasure people` guarantees: `coverMin` and every pick "him").
- No photo refused today becomes sendable; a photo `ok` today is refused only by the sweep (`reason` set).
- "Which one is you?": the same photos ask, with the same candidates; a picked photo is swept like any other.
- The photo's hash (`sha256` of the original bytes, and the picked-person hash) is unchanged: same photo, same score. The same photo prepped twice gives byte-identical upload, detail and close-ups.
- The kept photo and thumb stay unblurred (#55). You → Privacy → "See what I send" shows the upload file, so it shows the swept copy with no change.
- The close-ups still come out for the same photos (`zoomKinds` unchanged on the normal set).
- No new package, model or download. No JS, words or screens.

## Open questions
**For the founder**
1. **How many normal mirror checks may be refused to keep strangers' faces out?** Default: at most 2% of the normal set newly refused (6 of 336), and none of his own 54 sent phone checks or the 12 mirror-set photos; above that, the build stops and he decides. Ruling 10 says send nothing when in doubt, so a few refusals are the price.
2. **What he reads when a stranger's face is the reason.** Today any `couldNotFrame` shows the toast "Couldn't frame this one. Try again." (unchanged by this task). T62 will put the spec's head-not-found line there: "I couldn't find your face to blur it, so I didn't send it…", which would be wrong when the face is someone else's. Default: this task keeps today's toast and adds only the log `reason`; T62 (or a spec change he approves) decides whether `faceRemains` gets its own words. No new words are written here.
3. **To-do, not a question:** 5–10 real photos with a second mirror panel or a fitting room with people behind (his own or friends', with their OK), and his OK to re-download #468's three originals (rule 4). That's the only real check of the reflection case; until then it rests on built test photos.

**Technical defaults (the coordinator logs them)**
1. The sweep lives in `run` only, not in `locate`: the quick look stays fast, so a photo the camera passed can still be refused after the camera closes (Stylist toast, the rare path in T62's design).
2. The tile pass looks at the copy about to be sent, not the original, and hides every face it finds at any confidence (over-hiding a print or a pattern costs a little reading, never privacy).
3. Refusal: any face found again on a re-checked tile, any detector error, or a failed cover/blur. No confidence floor for refusing; if the false-refusal line (founder Q1) is crossed, the implementer reports the confidences of the refusing faces instead of adding a floor quietly.
4. Missed people are covered, never asked about; `instanceMinShare` 0.2% of the frame; smaller ones are left to the face pass.
5. Every body's head points are hidden for a snap or a scan (there's no "him" to keep).
6. Refusal keeps `couldNotFrame` and adds `reason` (no JS change, no new status).
7. One-time purge of `Caches/upload` on the first prep after the update (a retry of an old failed check then says "Couldn't frame this one. Try again."); `Caches/detail` is left (never sent by itself).
8. Timing budget on the Mac: added median ≤ 400 ms, p95 ≤ 800 ms over the normal set.

## Risks in the lane
- **Mac vs iPhone.** The harness runs Vision on the Mac; the phone runs it on the Neural Engine. Detections can differ at the margin, so a face found on the Mac might be missed on a phone. Only a check on his phone closes this (TESTING.md → Not testable yet).
- **Time on older phones.** 14+ detector calls and an instance mask per photo; if the phone's prep gets noticeably slower, the fix is fewer tiles, decided with data.
- **Profiles.** Nothing Apple offers on-device finds a small profile face reliably; layer 1 needs the body to be visible, layer 2 needs the outline to be segmented. Small profiles in the background are the most likely remaining leak; the eye check is the backstop.
- **Clothes reading.** More prints and patterns on his clothes get pixelated; measured (TESTING.md) but not scored here.
- **Circular checking.** The fix and the baseline's hunt use the same Vision detector; the tests lean on built photos, a second model (MediaPipe pose), a denser hunt and the eye (TESTING.md → Independence).
- **Native change:** reaches his phone only with `tools/phone/install.sh` or the next build.

## Built

(the implementer fills this)

## Disputes

(none yet)

## Review

(the verifier fills this)
