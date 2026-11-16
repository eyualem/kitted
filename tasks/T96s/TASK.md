# T96s · A face printed on his own clothes is left alone; his own face stays hidden

**Size:** strict (privacy) · **Branch:** `claude/T96-face-leaks` (same PR as T96) · **Plan:** `IMPLEMENTATION.md` · **Tests:** `TESTING.md` (locked at `907e1fdb`) · **Decisions:** #474 (the rule), #477 (T96's re-scope)

## Plan (short)
1. `locate` fills the new `Located` fields from values it already computes (`faces`, `headBand`, `headPoints`, `fallbackHead`, `outline`, `torsoJoints`); everything it returned before stays byte for byte.
2. `printZone` (rules 1–3) and `isPrint` (rules 4–7), with the four constants from IMPLEMENTATION.md.
3. `sweep`: whole-photo prints leave `hide` (his fallback head box drawn when a print stood in for his face), tile prints are neither hidden nor greyed, the grey fill runs only on regions still hidden, and the re-check skips prints. `run` adds `printsKept` and `prints`.
4. The grey square on his head: a narrower "him again" test for `otherHeads`, and the `poseHead` cap for fit photos only (the test writer's two findings).
5. `kmeasure locate` prints `faces`, `fallbackHead`, `torsoJoints` and `zone`.

## Built
**What changed, in plain words.** A face printed on his own top (a band tee, a photo print) now gets to the clothes reading as it is, not blurred or greyed. His own face, anything near his head, and any face not clearly printed on his torso are hidden exactly as before. The big grey square T96 round 3 drew over the older man's head and shoulders (`… 2.55.27 PM`) is gone. Snaps and clothes scans are unchanged.

**Files:**
- `app/modules/kitted-vision/ios/KittedPrep.swift`:
  - `locate` fills `faces`, `headBand`, `headPoints`, `fallbackHead`, `outline` and `torsoJoints` from values it already computed. The head-joint and shoulder boxes are now computed once before they're drawn (`headJointBox`, same arithmetic), so `hide` is unchanged byte for byte.
  - `printZone` (rules 1–3) and `isPrint` (rules 4–7), with the four constants from IMPLEMENTATION.md. The pose minimums are named constants too (`printMinTorsoShare` 0.15, `printMinSpanShare` 0.1, `printMaxOtherLabel` 0.1).
  - `sweep`: locate's whole-photo prints leave `hide`. When a print was the only face that stood in for his, his fallback head box (head joints, else shoulders) is drawn in its place; if there's none, nothing is left alone. Tile-pass prints are neither hidden nor greyed. The weak-blur grey fill runs only over regions still hidden. The re-check skips prints. `Swept.prints` is de-duplicated.
  - `run` adds `printsKept` and `prints`, which are always 0 and `[]` for a snap or a scan.
  - `otherHeads` (fit): the narrower "him again" test (below). `poseHead` caps the shoulder-span term on fit photos only (`capSpan`).
- `extraction-test/vision/main.swift`: `kmeasure locate` adds `faces`, `fallbackHead`, `torsoJoints` and `zone`.

**Deviations (with reasons):**
1. **"Him again" is narrower than written (the test writer's finding 1).** Another pose body loses its `otherHeads` box only when both of these hold:
   - its head's centre lies inside a region already hidden as his: his band, the head box drawn for him, or the head box of a face taken for his;
   - its body box overlaps his by IoU ≥ 0.5 (`himAgainIoU`).

   On S1 the second body is [117, 0, 459, 1262] against his box [158, 25, 406, 1228]. It's him found twice, so it's dropped. A runway audience member whose face touches his box has a small body of her own (low IoU), so her head stays hidden. Grey square (3) lost 0 of 168 heads (`--quick`).
2. **The `poseHead` cap applies to fit photos only (the test writer's finding 2).** Snaps and scans use `poseHead` for every body, so they keep it uncapped and stay byte-identical to round 3.
3. **`PrintZone` gains `size`** (the working image's W × H). `isPrint`'s signature has no W and H, and rules 6 and 7 need them to map the outline and instance grids back to pixels. The driver only reads the zone's fields, so nothing that's tested changes.
4. **Rule 7 runs without the instance mask in the sweep.** I first used the mask from `missedPeople` in steps 1, 2 and 4. On built photo a-6 (`--quick`), the instance mask gave the pasted print its own "person" label (885 of 1,089 pixels), so the print was blurred. IMPLEMENTATION.md has step 1 run with `instances: nil`, and in T96's order the mask exists only after the tile pass. So the sweep now uses `nil` throughout (rule 7 is the `otherHeads` test, the spec's "with no mask" case), the same answer in steps 1, 2 and 4. `isPrint` still applies the mask when given one (the logic line tests it). This sits inside the accepted risk "someone held against his chest" (IMPLEMENTATION.md → founder 4).

No constant from IMPLEMENTATION.md was changed.

## Disputes
**D1 · T96's leak set vs T96s's grey square: one dense-hunt core that T96s's eye list calls "her hair" (implementer, Nov 16).**
- **The T96 line:** `face_leak_test.py` › `F2.2 · leak set` (locked at `6a916e4b`). With this build it fails on one core only:
  - photo: `inputs/fashionpedia/images/test/2ddd0fbcbeb60656e0a46efe621b5a9f.jpg`, kind fit;
  - core: [308.5, 338.3, 16.2, 22.0], judged "his" (it lies on the subject);
  - in the upload, detail and upper close-up: unchanged 0.322, only 0.696 of it inside `hidden` (needs 0.9);
  - spotted by the app's detector: no.
  - The same core also fails T96's `F2.2 · kmeasure copies` (`kmeasure zoom` writes the same sweep copy: inside 0.696, unchanged 0.322). One core, two lines.
- **What the eye says:** that exact box is in `print_faces_test.py`'s `T96S_EYE_NOT_FACES` ("her hair", test writer at the T96s lock). It's hair below her chin, not a face. T96's own eye rule (TESTING.md of T96, Independence 4) counts only "a real person's face".
- **Why it turns red:** round 3 hid it only through the oversized `otherHeads` square [35, −46, 393, 466], which is her own head found a second time. That's the same grey square T96s must remove:
  - On this photo, the pose body `locate` takes as hers is a small second person on the right. Her real body is the "other" body: head centre (231, 187), inside her head band and her face's head box; body box IoU 0.66 with her box.
  - The square is grey-filled over her head, hair and shoulders.
  - The planned rule ("a body whose head lies inside his head regions gets no `otherHeads` entry") drops it, and so does the narrower one built here.
- **Why I didn't build around it:** `fitcheck-photos/s25/before_mirror.jpg` (his phone's set, T96s › grey square (2)) has the same structure. The body taken as his is a small figure beside him (box [58, 356, 221, 317]); his real body is the "other" one (IoU 0.68 with his box).
  - I tried a third condition: drop only when the body taken as his is a fragment or lies on the same body. It keeps 2ddd0fbc green, but it brings the grey square back on s25 (16.5% of his outline flat grey vs main's 1.2%). So T96s › grey square (2) fails.
  - No head-shaped box reaches this core. Capped, joint-sized and blur-instead-of-grey versions were each worked out on the measured boxes, and none reaches y 360 without a box larger than S1's 1.5× limit. Only round 3's oversized square covers it.
  - Any rule that passes both lines would be a special case for one photo.
- **What I think it should say:** T96's leak set should leave this core out the way it leaves out its other eye-ruled non-faces (T96's `EYE_NOT_FACES`, IoU ≥ 0.5 at 1024): add [308.5, 338.3, 16.2, 22.0] for `2ddd0fbc…` ("her hair", already judged by the T96s test writer). That adds an eye verdict; it loosens no threshold. Until then, "T96 still holds" fails on this one core, and I'm reporting it, not working around it.
- **Shipped:** the narrower "him again" rule (Built → Deviations 1). This fixes S1 and s25 and keeps every stranger's head (grey square (3): 0 of 168 lost).
