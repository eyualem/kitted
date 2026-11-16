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

**Results (`print_faces_test.py --full`, Nov 16, at `4bba24cb`; JSON in `extraction-test/results/t96s/`):**
- PASS: print rule logic; real prints sent (P1, P2, P3 each left alone, with one `prints` rect); his face when the pose lies; strangers at torso height; re-check and prints; where the rule doesn't apply; same photo.
- FAIL built prints:
  - (a) 31 of 36 left alone (D3);
  - (b) 28 of 30 hidden (D2);
  - (c) passes;
  - (L) 8 of 8 kept prints left alone (main's whole-photo blur path).
- FAIL grey square on him: (1) S1 passes; (2) 335 of 336 pass, and the one left is a hand face T96 greys (D4); (3) passes (0 of 168 lost; second-mirror-panel reflections hidden).
- FAIL T96 still holds (T96 `--full`, 110 min):
  - pass: sweep logic, old sends purged, same photo, false refusals, time (reported), built small faces, second mirror panel, missed people, no regression;
  - red: leak set and kmeasure copies (one core, D1), and held out and regression (D5).
- The same failures came up in the first `--full` (stopped early); `--quick` passed every line but these.

**Not done or not verified here:** `npm run check` in `app/` wasn't run. The Mac had about 150 MB unused (PhysMem) after the full run, under the roughly 1 GB the coordinator set; this task changes no JS or TS. Also not done: an iOS build and a phone check (no native install this session); `swiftc -typecheck` against the iOS SDKs (only the Mac typecheck and the harness compiles ran).

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

**D2 · T96s › built prints (b): 2 of 30 "touching his head" faces lie where rule 5 (as planned) calls them chest prints (implementer, Nov 16, first `--full`).**
- **The test:** `print_faces_test.py` › `F2.2 · built prints` (b) expects 100% hidden. `--full` measured 28 of 30. The misses were `b-4.jpg` (core 29 px) and `b-5.jpg` (core 61 px), both sent untouched (upload "leak", unchanged 1.0). `--quick` was 10 of 10.
- **Why it looks wrong:**
  - `place_head` puts the **paste square's** top edge inside the band grown by 25% of the band's own size (`fl.grow`). The face core sits lower inside a 1.6× square.
  - Rule 5 as written (IMPLEMENTATION.md → The fix 5, Interfaces; DECISIONS-LOG #474): "doesn't intersect his head region grown by 25% of his head width", where head width is "the narrowest of `head`'s widths, as a face".
  - Rebuilt from the test's own seed and measured with this build:
    - `b-4`: band [617, 478, 265, 326], bottom 804; narrowest head width 126, so the gap is 32. Vision's boxes on the print start at y 869 and 882, 65–78 px below the band. That's below his lower shoulder (796), wholly on his outline, and between his shoulders.
    - `b-5`: band bottom 807; head width 108, so the gap is 27. The print's face boxes start at y 906–942, about 100 px below the band and clear even of the band grown 25% of its height (891). Its square is 300 px tall.
  - So by the spec's own rule, both faces are on his chest.
- **Why I didn't widen the gap:** the logic line pins it. "Band ends at the shoulder line": band [400, 200, 200, 340], a box at y 566 must be a print, so the gap must be under 26 px with head width 72 (k < 0.36). `b-4` needs k > 0.52 and `b-5` k > 0.92. No constant, and no head-size scale (narrowest width, band width or band height), satisfies both locked lines. A rule keyed to his detected face would, but that's a new rule tuned to these photos, not the spec.
- **What I think it should say:** (b) places the **face box** (the core grown to the detector's box), not the paste square, with its top inside his head region grown as rule 5 defines it. Or (b) counts as "touching" only faces whose core intersects the band grown 25%. Either keeps (b) a must-hide test of what rule 5 promises. The privacy call (how far below his band a face may sit and still be a print) is the coordinator's and the founder's, not mine.

**D3 · T96s › built prints (a): 31 of 36 left alone at `--full` (≥ 90% asked), every miss a pose the paste broke (implementer, Nov 16).**
- **The 5 misses:** `a-5`, `a-6`, `a-15`, `a-25` and `a-27`. On each, the line's own report gives `printZone` nil and `torsoJoints` empty, so the print is blurred as today.
- Rebuilt and probed:
  - `a-6`: Vision's pose on the pasted photo finds no hips at all (neck, shoulders, elbows and wrists only).
  - `a-5`: the pose is scrambled (a neck at (327, 367), far from him; one shoulder; no hips).
  - Rule 2 (a whole, upright pose) rightly declines. It's the guard that keeps his own face from being read as a print when the pose lies (S1–S7).
- **Not a rule fault:** the test writer noted the same effect at lock ("the pasted face changed the body pose so `torsoJoints` was empty … placement faults, not rule faults") and capped the sizes; at 30 per placement it still happens 5 times in 36. `--quick` was 12 of 12.
- **What I think it should say:** the (a) gate counts only photos where the pasted photo's own pose is whole (`torsoJoints` set, as the line already reports), or it reports these as "zone nil from the paste" outside the 90%. Loosening rule 2 to pass it would weaken the guard on his face, so I haven't.

**D4 · T96s › grey square on him (2): one normal photo greyed by a "face" T96 sees on his hand, above his hips (implementer, Nov 16, `--full`).**
- **The test:** (2) at `--full` measured 336 photos. One is worse than main + 0.02: `inputs/ig/Screenshot 2026-10-12 at 1.44.25 PM.png`, with 5.9% of his outline flat grey vs main's 3.9%. `--quick` samples 60, and this photo wasn't among them.
- **What makes the grey:** the tile pass finds a "face" at [410, 547, 43, 43] (confidence 0.58) on his left hand. His left wrist is at (471, 553). T96 hides and greys its head box [397, 524, 68, 81].
  - This build does exactly what round 3 does here: no print (the box's centre is outside his shoulders, so rule 4 turns it away), no `otherHeads`, and no "him again".
  - The S1 and s25 squares are fixed; this one isn't a pose head.
- **Why it looks wrong:** TESTING.md → Scope lists it as out of scope: "the 'faces' the detector imagines on his shoes, jeans or a hand (T96 greys them) stay as T96 leaves them". But (2) leaves out only "the head boxes the sweep drew for faces below his hip line". This hand is held at waist height, above his hips (641), so it isn't left out.
- **What I think it should say:** (2) also leaves out the head boxes drawn for tile faces centred within his hands' reach: the box holds a wrist joint, or its centre lies outside his shoulders. Or (2) compares with round 3, not main, for regions T96 added and this task doesn't touch. Making a hand "face" un-greyed is founder question 3 (legs, feet, hands), a later task, so I haven't built it.

**D5 · T96 › held out and regression (automatic part) is red at `--full`, and on the 26 non-held-out photos I could compare, round 3 hides exactly the same (implementer, Nov 16).**
- **The line:** `face_leak_test.py --full` run inside "T96 still holds". 36 cores fail: 8 held-out photos and 27 baseline photos, all but one "his" cores.
- **The committed round-3 JSON can't be compared:** `extraction-test/results/t96/held-out-and-regression.json` (0 fails) was run under the old lock, before the re-lock (#477) split cores into his, spotted, unspotted and print. DECISIONS-LOG #477 says the re-locked file passes on round 3 at `--quick`, and `--quick` doesn't run this line.
- **What I checked:** the failing baseline photos (not held out), through a Mac probe that prints `locate`'s `otherHeads` and the sweep's `hide` and `swept`, on this build and on round 3 (`a00da29d`).
  - On 26 of the 27, both builds give the same rects (for example: `mirror-fit-check-1/m11/before_mirror.jpg` hides nothing on either; `fitcheck-photos/s19/before_phone.jpg` the same two rects).
  - The 27th is `2ddd0fbc…`, which is D1.
  - So these cores fail on round 3 too, under the re-locked rule; this task didn't cause them.
- **The 8 held-out photos weren't compared.** They're held out (never opened by the implementer); their fails read the same way (his cores, unchanged 0.47–1.0).
- **What I think it should say:** the T96 test writer re-baselines this line on round 3 under the re-lock (one `--full` run of `a00da29d`). Then "T96 still holds" compares against that (as it does for built small faces and missed people), not against "passes".

**T96 test writer on D1 (Nov 16): upheld, not a face.** I looked at `2ddd0fbc…` at full size and at 6×. [308.5, 338.3, 16.2, 22.0] is wavy brown hair over her shoulder, well below her chin: no eyes, no skin. It's added to T96's `EYE_NOT_FACES` (add only, IoU ≥ 0.5 at 1024; the photo is 682×1024, so the box is in its own pixels). With it, T96's leak set passes on this build (0 strict leaks, fit 53 of 59 sent, 185-box gate 0). Kmeasure copies judges the same cores through the same list, so its one fail goes too; I didn't re-run it. Re-locked at `d1612584`.

**T96 test writer on D5 (Nov 16): the gate was wrong as written, not a regression and not a code defect. Fixed; his face isn't loosened.**
- **Round 3 against the gate:** I ran the locked file's own classification and judging on the 35 photos, on round 3 (`fdef92ba`, in a temporary worktree). It fails the same 35 cores with identical numbers; only `2ddd0fbc…` (D1) differs, hidden there by the oversized square. So this task didn't cause them, and the re-scoped gate failed round 3 too.
- **By eye** (crops of the original and of the sent upload, all 36), none is a readable face in what's sent:
  - **26 aren't faces:** MediaPipe "heads" on hands, wrists, a ring, a camera, a phone, sleeves, a shirt back, a necklace, lace, hair, a hat brim and a neck.
  - **6 are real faces, fully pixelated in the upload:** `6a0f64b8`, `899bf79b`, `82edc318`, Pinterest 3.05.18 PM, `ew3gCk1zkso/f-08-08`, and his chin in `703a8b12`. A mosaic over a smooth face keeps 51–66% of the grey values within 12, so rule (b) calls it not hidden at T = 0.5.
  - **The rest:** faces out of the frame (`m11`, `XIYvycsZxDk`), the interviewer in `Jh8dz` (pixelated), the woman behind her camera in `d7054d8a`.
- **Fix** (TESTING.md → "Changed at the re-lock (T96s disputes D1 and D5)"):
  - A Vision face box of his or of a spotted face, left outside the hidden rects, fails automatically.
  - MediaPipe-only cores, and faces inside the hidden rects that fail only on the unchanged share, go on the sheets labelled EYE, where a readable one fails the line.
  - T and every other line are unchanged.
- **Proved on the 35 photos:** 0 automatic fails on this build. A planted "his head regions dropped from the blur and from `hidden`" gives 40 fails.
- **No re-baseline needed:** the line now passes on both builds by the same rule. It still needs one `--full` (and the eye on the EYE crops) for the record.

**T96s test writer on D2, D3 and D4 (Nov 16).** Judged against `specs.md` F2.2, IMPLEMENTATION.md (rules 2 and 5) and DECISIONS-LOG #474. Nothing about his own face is loosened.

**D2 · built prints (b): upheld; the placement was wrong, rule 5 stands.**
- (b) is meant to prove that a face touching his head stays hidden. At the lock I placed the paste **square's** top edge in his band grown 25% of the band's size. Inside a 1.6× square, the face sat 65–100 px lower, below his lower shoulder, on his outline and between his shoulders. By rule 5 as planned and logged (#474: clear of his head region grown by 0.25 of his narrowest head width), that's a chest print, so the test contradicted the spec.
- **Fixed:** the pasted **face** now touches his head. The core's top edge lies inside his head band itself (from 40% of the way down the band to 2 px above its bottom), with the core's centre across the band's middle 40%. So every (b) face box intersects his head region before any gap is added.
- **(b)'s head check made like for like:** the face is now pasted over his head regions, so for (b) his head is compared with main on the same built photo, not with main on the photo without the print. A face touching his head is hidden as today.
- **Rule 5 at 0.25 stands.** I found no real case where a face of his, his chin or his neck, sits below his lower shoulder and clear of his band. His chin is inside the band (the band runs to 0.3 of his outline's height). His face sits below the shoulder line only when the pose lies (S1–S7), and rule 2 guards that (the pose-lies line's nil-zone check). The logic line keeps pinning the gap. So I'm not taking it to the founder.
- `--full` on this build: (b) 30 of 30 hidden or refused, his face and head as main hides them on all 30.

**D3 · built prints (a): upheld, with a guard against swallowing the line.**
- When the paste breaks Vision's pose (no hips, or a scrambled body), the photo no longer shows him whole. The spec's rule 2 says the box is then treated exactly as today, so counting those prints as misses tests the photo, not the rule.
- **Changed:** an (a) photo leaves the 90% count when **main's** `locate` on the pasted photo has lost any of his neck, shoulders or hips. It's judged from main's pose, never the build's, so a build can't excuse itself by breaking `torsoJoints`.
- Such a photo still must not be refused, and his face is still checked.
- **Added guard:** at least 24 of the 30 (a) photos (`--quick` 8) must keep a whole pose, or the line fails its setup. The excluded photos are listed.
- `--full`: main's pose is broken on exactly the five the implementer named (`a-5`, `a-6`, `a-15`, `a-25`, `a-27`). The other 25 photos: 31 of 31 prints left alone, 0 refused.

**D4 · grey square (2): upheld by eye, for that one box only.**
- I looked at `ig … 1.44.25 PM` (696×1314) at 4×. The tile "face" [410, 547, 43, 43] (working) is his left fist with a ring, at his jacket hem at waist height: knuckles and a ring, no eyes or skin of a face. That's the known gap in TESTING.md's Scope ("shoes, jeans or a hand").
- **Changed:** `T96S_EYE_HAND_FACES` lists the box at 1024 ([319.3, 425.9, 33.5, 33.5]). (2) leaves out the head box of a swept face matching a listed box (IoU ≥ 0.5), the way the eye lists work.
- I didn't add a general "within his hands' reach" or "outside his shoulders" rule. That would also excuse a real stranger's face at that spot, and making hand faces un-greyed is founder question 3.
- `--full` on this build: (2) 336 photos measured, 0 worse than main + 0.02. (1) S1 has no square. (3) keeps 168 of 168 other heads, with 7 panels.

**Re-runs on this build (`12d4d235` plus the test changes), `--full`:** `PASS F2.2 · built prints` ((a) 31/31 on 25 photos, (b) 30/30, (c) 30/30, (L) 8 kept of 16 built, 8/8 left alone) and `PASS F2.2 · grey square on him`. Re-locked: see the Lock line in TESTING.md.
