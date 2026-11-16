# T96s · A face printed on his own clothes is left alone; his own face stays hidden

**Size:** strict (privacy: what leaves the phone) · **From:** `plan.md` → T96s (same branch and PR as T96, `claude/T96-face-leaks`) · **Spec:** `specs.md` (approved, #388) → F2.2 ("Only the face-blurred copy leaves the phone; with no head found, nothing is sent and the card says why"), §"How a check works" step 1, the "Head not found" row, the **Never** line ("a face sent unblurred"); CLAUDE.md hard line on privacy · **Lane:** Fit check and scoring · **Files on the plan line:** `app/modules/kitted-vision/ios/KittedPrep.swift`, `extraction-test/vision/`

**The founder (Nov 16, verbatim, through the coordinator):** "the app is accidentally bluring out faces on shirts too whic is not right" and "we're mainly protecting the user, the literal user. We don't have to worry about the people around…". The coordinator's limits: his own face stays strict (his reflection and a second mirror panel included); if his head can't be found, nothing is sent; a box that touches his head region is always hidden; no new face model; no new work on strangers' faces; T96's locked lines stay as they are.

## Goal
A graphic on his own top (a band tee, a photo print, a cartoon face on a hoodie) reaches the clothes reading as it is, not blurred or greyed, while his face, anything touching his head, and every face that isn't clearly printed on his torso are hidden exactly as today. Also: the grey square T96 round 3 drew over his own head and shoulders on `… 2.55.27 PM` is gone.

## Where the blurring and greying come from (read Nov 16, this branch at `a00da29d`; main at `1c34082d`)
Both places do it, and a third would refuse once the first two are fixed.
1. **Main's `Prep.locate` (already on his phone):** `out.hide = faceBoxes.map { headBox(around: $0) }` (`KittedPrep.swift`, `locate`, the line after `var out = Located(...)`). Every face Vision's face detector finds on the whole 2048 px photo is blurred and pixelated by `hideRegions`, printed or not. `mainHasFace` also counts a print on his outline as "his face" (`faceBoxes.contains { $0.intersects(main…) && onOutline($0) }`), so a print can stand in for his head and switch off the head-joint and shoulder fallback boxes. The #188 comment in `locate` describes this exact trap (printed faces on T-shirts).
2. **T96's sweep (this branch, not merged):** step 1 runs the face detector on 30 tiles (1, 2×2, 3×3, 4×4) of the original. Every face not ≥ 95% inside one of `locate`'s regions (`alreadyHiddenShare`) gets `headBox(around:)` added to `hide` and then **filled flat grey** (`fillRegions(sent, weak + added)`). Tiles find small prints the whole-photo pass misses, so T96 greys many more of them. Separately, `weak` fills any of `locate`'s regions grey when the blur left ≥ 40% unchanged.
3. **T96's re-check (step 4)** runs the detector again on the copy about to be sent, on every tile that touches a newly hidden head. A print left alone in such a tile is found again, so the photo is refused (`faceRemains`). The fix must make the re-check skip prints too.

**Measured (probe, Nov 16, $0, Mac):** `locate`, then the sweep's tile pass, on the 342 normal photos, the 59 leak photos and 17 Fashionpedia photos tagged "cartoon". Then 2,400 more Fashionpedia photos (every file outside T96's held-out and pool splits). On all of these, every face on a person's torso comes from the **tile pass (2)**; main's `locate` (1) blurred no print on them. It can, though: a large, clear printed face is found by the whole-photo pass.

**The grey head square (round 3, code 2):** on `inputs/pinterest/Screenshot 2026-10-12 at 2.55.27 PM.png` (576×1262) the body pose finds him twice. The second "body" (`otherBodies` [117, 0, 458, 1262], nearly his box) gets `otherHeads` [78, −131, 441, 524], centred on his own head, which the sweep fills grey. The cause is `poseHead`: `0.9 × shoulder span` isn't capped by `poseHeadMaxShare`, and nothing checks that the "other" body is him again. `missedPeople` already guards `otherBodies` against "him found twice"; `otherHeads` has no such guard.

## The fix (chosen, with reasons)
**A face box is a print, and is left alone, only when every test below passes. If any test fails or can't be run, the box is treated exactly as today.** The tests use only what `locate` already finds (his box, his pose, his outline, his head regions). No new model, no new Vision request.

1. **Fit only.** Snaps (`.snap`) and clothes scans (`.items`) are unchanged. They have no "him" to anchor to; see founder question 2 for scans.
2. **His pose is whole and upright.** His body (the pose `locate` picked as his) has the neck, both shoulders and both hips at confidence > 0.3. The neck and both shoulders lie inside his box (`found.main`) and on his outline. The hip line sits below the shoulder line by at least 15% of his box height. The shoulder span is at least 10% of his box width.
3. **His head is found apart from the box.** At least one of these exists, and its centre is above the shoulder line: his head band (top of his outline), the head-joint box (≥ 2 of nose, eyes, ears on his outline), or a whole-photo face box centred above the shoulder line on his outline. Together these are **his head region**. If there is none, nothing is a print.
4. **The box is on his torso.** All of it is below the lower shoulder. Its bottom is above the hip line plus 15% of the shoulder-to-hip distance (`printHemShare`, for a long tee's hem). Its centre lies between the two shoulders' x. It is no wider than 0.8 of the shoulder span.
5. **It doesn't touch his head.** It doesn't intersect his head region grown by 25% of his head width (`printHeadGap`). None of his head joints lies inside the box grown 1.5×.
6. **It's on his own outline.** At least 90% of the box lies on his outline (`printMinOnOutline`): the person mask `locate` used, with the cover taken out. A face in the gap between his arm and body, or behind his legs (runway audiences), fails this.
7. **Nobody else claims it.** It doesn't intersect any `otherHeads` region, and no other instance label covers more than 10% of it when the instance mask was run.

**What changes in what's sent:**
- `locate`'s whole-photo face boxes that are prints are left out of what's blurred in every copy that can leave the phone. If a print was the only face that made `mainHasFace` true, the head box `locate` would otherwise have drawn (from his head joints, or from his shoulders) is added in its place. If there is no such box, the print isn't left alone.
- The sweep's tile faces that are prints are neither hidden nor greyed.
- The `weak` grey fill runs only on regions that are still hidden.
- **The re-check ignores prints.** The rule depends only on `found` and the box, so a print found again on the copy about to be sent is still a print. Any other face found refuses, as today.

**The grey head square:**
- In `locate` (fit), another pose body whose `poseHead` centre lies inside one of his own head regions is him found again. Its head is already hidden as his, so no `otherHeads` entry is made for it.
- In `poseHead`, the shoulder-span term is capped like the nearest-shoulder term: `min(0.9 × span, poseHeadMaxShare × max(W, H))`.
- `otherBodies` is unchanged; `missedPeople` already guards it.

**Why this shape.**
- The probe's real photos show that "inside his box and below his shoulders" alone is unsafe. On 6 photos the subject's **own face** sits below the pose's shoulder line, because the pose belongs to someone else or found only one shoulder: `… 2.55.27 PM`, and leak-set `caa7c7b7…`, `cefdf3bd…`, `d5da50f2…`, `f304cfe8…`, `956bd805…`. On about 20 photos a stranger's **real face** sits inside the subject's box below the shoulders (runway audiences between the legs, a man in the background at `82d90f72…`).
- Tests 2–5 together turn away every one of those, even before test 6 is applied.
- On the 2,818 probed photos, tests 2–5 and 7 leave alone exactly the 3 real prints, a necklace pendant (`2.51.33 PM`) and a tattooed hand (`dad143d9…`). The last two aren't faces. A 7th subject's own face below a wrong shoulder line (`4f906962…`) is turned away too. See TESTING.md → Real photos.
- Why not the whole body below his head: the detector also "finds faces" on his shoes, a hand and jeans in 9 of the 342 normal photos, and T96 greys them. Leaving those alone would also stop greying his shoes. But strangers' faces at leg height are common (runway audiences), and the founder named shirts. So legs and feet stay out of this task (founder question 3).

**Cost:** no new Vision request. A few rectangle tests per face, plus one mask lookup per candidate box. The time line of T96 must still pass.

## Files
- `app/modules/kitted-vision/ios/KittedPrep.swift`:
  - `Located` gains `faces`, `headBand`, `headPoints`, `fallbackHead`, `outline`, `torso` (below). All are set in `locate`; nothing `locate` already returns changes.
  - New: `PrintZone`, `printZone`, `isPrint`, the four constants.
  - `sweep` uses them (steps above). `Swept` gains `prints`.
  - `run` adds two result keys.
  - `poseHead` caps the shoulder term. `locate` skips "him again" when making `otherHeads`.
- `extraction-test/vision/main.swift`:
  - `kmeasure prep` prints the new keys (no change needed if it prints `run`'s dict as today).
  - `kmeasure locate` adds `faces`, `fallbackHead`, `torso` to its JSON (for the harness and the eye).
- `extraction-test/vision/print_faces_test.py`: the test writer's, locked (TESTING.md). It may import `face_leak_test.py` read-only and run it as a subprocess; it never edits it.
- `extraction-test/results/t96s/`: JSON committed; crops and sheets are images, git-ignored (`extraction-test/results/**/*.jpg|png` already).
- **Not touched:**
  - `tasks/T96/TESTING.md`, `extraction-test/vision/face_leak_test.py` and its thresholds;
  - `KittedGuide.swift`, `KittedMeasure.swift`, `KittedVisionModule.swift`;
  - every JS/TS file and `en.ts`.

  No words, screens or packages. If the build finds it needs one of these files, stop and raise it.

## Interfaces (everything a test calls)
All boxes are in pixels of the upright working image (long edge ≤ `Prep.workPx` = 2048), origin top-left, unless "normalized".

```swift
extension Prep {
  /// Where a face box can be a print on his own top, and what can't be touched. Nil when the rule can't be trusted
  /// (not a fit photo, status not ok, pose not whole and upright, no outline, no head region found).
  struct PrintZone {
    var torso: CGRect            // x: between the two shoulders; y: lower shoulder → hip line + printHemShare × (hip − shoulder)
    var shoulderSpan: CGFloat
    var head: [CGRect]           // his head region: band, head-joint box, whole-photo faces centred above the shoulder line on his outline
    var headWidth: CGFloat       // the narrowest of `head`'s widths, as a face (a headBox's width / 1.6; the band's width / 1.3)
    var headPoints: [CGPoint]    // his nose, eyes, ears (confidence > 0.3, on his outline)
    var outline: Guide.Gray      // the person mask locate used, the cover taken out
  }

  static let printHemShare: CGFloat = 0.15      // the band reaches this share of shoulder→hip below the hips
  static let printHeadGap: CGFloat = 0.25       // his head region grown by this share of his head width
  static let printMinOnOutline: CGFloat = 0.9   // share of the box on his outline
  static let printMaxWidthShare: CGFloat = 0.8  // the box's width at most this share of the shoulder span

  /// The zone for `found` (fit, status "ok"), or nil (fix, rules 1–3). Pure: same `found`, same zone.
  static func printZone(_ found: Located, kind: Kind, W: CGFloat, H: CGFloat) -> PrintZone?

  /// True only when `face` (a face box, not a head box) passes rules 4–7 against `zone`; false when `zone` is nil.
  /// `instances`: the instance mask when the sweep ran it (rule 7), else nil.
  static func isPrint(_ face: CGRect, zone: PrintZone?, found: Located, instances: Instances?) -> Bool
}

// Located gains (set in locate; status, hide, main, candidates, others, cover, joints, people, pose, picked unchanged):
//   var faces: [CGRect] = []        // the whole-photo face boxes, in order; hide[0..<faces.count] are their headBoxes
//   var headBand: CGRect?           // his band (the same rect already appended to hide), nil when none
//   var headPoints: [CGPoint] = []  // his head joints on his outline (the `headPts` locate already computes)
//   var fallbackHead: CGRect?       // the head-joint box, else the shoulder box, that locate draws when no face is his,
//                                   // computed whether or not it was drawn
//   var outline: Guide.Gray?        // `mask` (fit), cover excluded; nil when none
//   var torsoJoints: [String: CGPoint] = [:]  // neck, lShoulder, rShoulder, lHip, rHip of his body, only when each is
//                                   // > 0.3 and the shoulders and neck are on his outline (empty otherwise)

// Swept gains:
//   var prints: [CGRect]   // face boxes left alone as prints (locate's and the tile pass's), de-duplicated (IoU ≥ 0.5)
// Swept.hide no longer lists a print's head box; it still lists everything else as T96 defines it.
```

**`sweep` (T96's steps, with the print rule):**
- 0. `zone = printZone(found, kind:, W:, H:)`.
- 1. `printed = found.faces.filter { isPrint($0, zone:, found:, instances: nil) }`. Then `hide0 = found.hide` minus each `headBox(around: p)` for `p` in `printed`, plus `found.fallbackHead` when a removed face was one of those that intersect `main` on his outline and no remaining face does.
  - If `fallbackHead` is nil in that case, `printed` is emptied (nothing is left alone).
  - `today = hideRegions(coverOthers(image, cover) ?? image, hide0)`. With no prints this is exactly T96's today's copy.
- 2. Tile faces as T96, then: drop `isPrint` faces (they go to `prints`); drop faces ≥ 95% inside one region of `hide0`.
- 3. Missed people, drawing and the grey fill as T96, on `hide0` and its additions. `weak` is computed only over `hide0`.
- 4. The re-check as T96, except a face for which `isPrint` is true doesn't refuse.
- Rule 7 uses the instance mask only where the sweep already has it (`missedPeople`'s run). With no mask, rule 7 is the `otherHeads` test alone.

**`run`'s result** (fit and snap `ok`; existing keys unchanged):
- `"printsKept": Int` (`Swept.prints.count`);
- `"prints": [[Double]]` (normalized `[x, y, w, h]`);
- `"hidden"` = `Swept.hide`, so no print head box appears in it.

Items `ok`: the same two keys (always 0 and `[]`, since the rule is fit only). Refusals unchanged: exactly the five keys.

**`otherHeads` (fit):** a body `!== body` whose `poseHead` centre lies inside any of his head regions (`headBand`, `fallbackHead`, or the headBox of a whole-photo face that intersects `main` on his outline) gets no entry. `poseHead` side = `max(2.2 × spread, 0.02 × max(W, H), min(0.9 × shoulder span, poseHeadMaxShare × max(W, H)), min(near, poseHeadMaxShare × max(W, H)))`.

**`kmeasure locate <photo>`:** adds `"faces"`, `"fallbackHead"`, `"torsoJoints"` and `"zone"` (`PrintZone`'s rects, or null) to its JSON.

**UI:** none. No screen, state, words, VoiceOver label, testID or demo screen. What he sees changes only in the sent copy (You → Privacy → "See what I send" shows the upload): the graphic on his tee is visible there. No demo screen is needed (TESTING.md → UI inventory).

## Data
No stored data changes. `sweepVersion` stays 1: retry copies made by an earlier build hid more, never less.

## Steps
1. `Located`'s new fields in `locate`, copied from values `locate` already computes. Re-run T96's `--quick --only no-regression` to confirm nothing `locate` returned moved.
2. `printZone`, `isPrint`, the constants.
3. `sweep`: steps 0–4 above; `Swept.prints`; `run`'s keys.
4. `otherHeads`: skip "him again"; cap the shoulder term.
5. `kmeasure locate` additions; rebuild `bin/kmeasure` (`build.sh`).
6. Run `print_faces_test.py --quick` while building, then `--full`. Run T96's `face_leak_test.py --full` (heavy, about an hour). Check `top -l 1 | grep PhysMem` before each, one heavy job at a time (CLAUDE.md rule 8). Tune the four constants only on the tuning photos TESTING.md names, never on the held-out ones. Any constant changed goes in TASK.md → Built and a DECISIONS-LOG entry.
7. `npm run check` in `app/` (no JS changed; still run it). Run `swiftc -typecheck` of the three Swift files against the iOS Simulator and device SDKs. Do the iOS build only if memory allows; otherwise say so.

## Must not break
- `locate`'s status, `hide`, `main`, `candidates`, `others`, `cover`, `joints`, `people`, `pose`, `picked`: byte for byte as main's. The camera's quick look, "Which one is you?" and closet measuring see `locate` as today.
- His face: every region `locate` hides for his head (band, face, head joints, shoulders, top edge) is still hidden in every sent copy. A face touching his head region is still hidden.
- Nothing refused today becomes sendable. Nothing sent today is newly refused because of a print.
- T96's passing lines stay passing: sweep logic, old sends purged, same photo, leak set, kmeasure copies, false refusals, second mirror panel, no regression, held out (automatic part). Time is not verified yet (memory).
- Same photo, same copy: byte-identical across two preps.
- No new package, model or download; no JS, words or screens.

## Collisions with T96's locked lines (raised plainly; not planned around)
The founder said T96's lines stay locked until he approves a re-scope. This task can collide with four of them. **On today's test photos it measures as no collision**, but the wording collides:
1. **"Prints and posters count automatically"** (T96 TESTING.md, How the test file reads these lines). A face the 4×4 hunt or MediaPipe finds counts as a face core, print or not, in the leak set, the "Which one is you?" pick edge, kmeasure copies and the held-out automatic gate. A print this task leaves alone, if one of those sets holds it on the subject's torso, fails T96 although it's correct by the founder's rule.
   - Measured: no leak-set photo has a print that rules 2–5 leave alone.
   - The 6 pick photos weren't probed with a pick: the implementer runs T96's `--full --only false-refusals` early and reports.
2. **No regression:** "in each region `hide` lists, the new upload's unchanged share is at most main's + 0.05". A print main's `locate` blurs and this task un-blurs fails it.
   - Measured: main's `locate` blurs no torso print on the 342 normal photos, so it passes today.
3. **Sweep logic (2) and (6):** with a find-nothing detector the copy must equal `hideRegions(coverOthers(…), found.hide)` and main's upload byte for byte. It differs on any photo where `found.hide` holds a print.
   - The 4 photos are his phone's; none has a torso print (probe). The grey-square fix can change which 4 photos the test picks (it chooses photos with no `otherHeads`); that's the test's choice, not a loosening.
4. **TESTING.md Scope: "every face" means his and anyone else's.** The founder's direction narrows "face" to a real person's face: a print isn't one. T96's own eye rule already says so ("a real person's face (not a print, poster, screen or drawing)").

**What's needed:** the founder's yes that a face printed on his own top isn't a face for F2.2, and then the T96 test writer adds, never loosens: prints left alone by T96s are excused only where `run`'s `prints` lists them and the eye agrees. Until then, if a T96 line goes red only because of a print this task correctly left alone, the implementer stops and reports it as a dispute; no T96 file changes.

## Open questions
**For the founder**
1. **Is a face printed on his own top "not a face" for F2.2?** `specs.md` says "a copy with every face blurred". Default: yes, recorded as a DECISIONS-LOG entry (his words of Nov 16) with no `specs.md` edit, since T96's eye rule already treats prints as not faces. If he wants the spec to say so, that's a `specs.md` change and needs his yes. This also unlocks the T96 re-scope above.
2. **Clothes scans of a graphic tee** (laid flat or hung, no person): a face printed on it stays blurred, because with no body there's nothing to tell a print from a face. Default: unchanged in this task; a later task if he wants it.
3. **His shoes and jeans:** T96 greys "faces" the detector imagines on his shoes, a hand or jeans (9 of 342 normal photos, by eye: shoes, a loafer bit, a ring hand, a cuff). Default: not in this task (strangers' faces at leg height are common on runway photos); a later task can extend the rule to his legs and feet behind the same tests.
4. **Someone in front of his torso** (a child he holds, a friend leaning on his chest) whom the body pose and the outline masks all miss would be read as a print. Rules 6–7 catch most of these: another person is usually another outline label or another pose body. Default: accept this as the residual risk, by his "the literal user" rule; the to-do Y37 photos would show it.

**Technical defaults (the coordinator logs them)**
1. Fit only; snaps and scans unchanged.
2. Torso band only (shoulders → hips + 15% of shoulder→hip).
3. The constants: `printHemShare` 0.15, `printHeadGap` 0.25, `printMinOnOutline` 0.9, `printMaxWidthShare` 0.8, and the pose minimums (hips below shoulders by 15% of his box, shoulder span ≥ 10% of his box width). Tuned only on the tuning photos TESTING.md names.
4. When the print was the face that stood in for his head, the fallback head box is drawn; with none, the print stays hidden.
5. The re-check ignores prints by the same rule; no new refusal reason.
6. The grey-square fix touches `otherHeads` only (not `otherBodies`), by "head already hidden as his" plus the cap.
7. `sweepVersion` stays 1.

**Answers (coordinator, Nov 16; DECISIONS-LOG #474)**
- Founder 1: **yes**, from his own words ("bluring out faces on shirts too … is not right"). The decision is logged with no `specs.md` edit; the T96 re-scope still waits on his separate yes.
- Founder 2–4: the defaults stand for now (scans unchanged; legs and feet out; the person held against his chest accepted). They went to the founder through the parent session. A different answer adds a case later; it doesn't change this task's fit-photo checks.
- Technical 1–7: accepted as written.

## Risks in the lane
- **His own face read as a print.** The worst failure. The guards are rules 2–5 together. Every trap on the probed photos is a bad pose, and each is turned away by rule 2 alone (missing hips or shoulders, or shoulders outside his box). A wrong but complete pose isn't seen in these sets; the built "pose lies" check (TESTING.md) covers it as well as built photos can.
- **Closet measuring** (`Measure.run`) still treats a whole-photo print as a head and leaves it out of the shirt's colours: `locate` is locked by T96's no-regression line. This only affects prints the whole-photo pass finds; none in the probed sets. It's a reading cost, not privacy.
- **T96 collisions** (above).
- **Few real prints.** 3 real torso prints were found locally, across 2,818 photos probed (plus 1 in a "Which one is you?" photo). Non-faces on the body (a necklace pendant, a tattooed hand) are also left alone, which is harmless. Built prints add weight but can't stand alone.
- **Mac vs iPhone:** as T96. The rule uses Vision's pose and masks, which can differ on the Neural Engine at the margin.
- **Native change:** reaches his phone only with `tools/phone/install.sh` or the next build.
