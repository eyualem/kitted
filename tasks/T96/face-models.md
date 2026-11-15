# T96 · Would a dedicated face model catch the faces round 3 still sends? (Nov 15, Mac only, $0)

A test, not a build: nothing in the app changed. The founder's approval (chat, Nov 15): "Yes, you can test them, but test them in a separate child session." A fourth build round waits on his second yes on these results.

## In plain words
- **YuNet catches almost every readable face round 3 still lets through.** Of the 34 built test faces round 3 sends unhidden, 18 are readable by eye; YuNet (recommended setting below) hides **17 of 18**. In total it hides 22 of 34. Most of the 12 it leaves are not readable: hair only, a mouth and chin with the eyes off the frame, or already half grey. Edge faces: 8 of the 15 still sent get hidden.
- **It also finds real strangers round 3's own test never counted.** On the runway and street photos, round 3's leak test reported "0 faces left", but only because its own face hunt couldn't see them either. YuNet boxes about 26 more real faces on the 59 leak photos and about 52 on the 400 held-out photos. On 32 of 33 and 104 of 105 of those boxes, the pixels are unchanged from the original, so they really are sent. A few are readable: a smiling woman beside a grey cover in `6b74faf4…`, a woman in glasses in `8d598922…`, and the audience row in `5afdd663…` the eye check flagged (the man in glasses and the man in the cap).
- **What it would wrongly hide.** It adds a grey patch on **15 of 336** normal photos, and on **1 of his own 66** (a chandelier beside his head in a mirror photo). About half of those 15 are real tiny faces in the background of low-res screenshots. The other half are background objects: a car wheel, wall stickers, grass, a brick wall. **It never lands on him, his clothes or his phone hand**, but only because of one rule (below). Without it, YuNet hides his hand holding the phone, ripped-jeans knees, a belt and shirt prints on 44 normal photos. With the rule, none of those are hidden.
- **BlazeFace doesn't work here.** It is safe to ship (Apache 2.0), but its model card says faces must be at least 20% of the image side and within 2 m. At the threshold where it gets close to YuNet's catches (0.3), it puts boxes on 321 of 336 normal photos.
- **It runs in Core ML.** Converted: 200 KB (fp16). It gives the same boxes as the Python model (217 of 217 matched), at about 15 ms per tile on the Mac, or about 205 ms per photo for 14 tiles. That is the one cost to watch: added to round 3's sweep (about 187 ms at normal load), it is right at the 400 ms budget on the Mac. The phone's time is not measured.

## What was tested
- **Downloads** (each in its own empty folder under `inputs/face-models/`, git-ignored; nothing else was downloaded):

  | File | Size | SHA-256 | From |
  |---|---|---|---|
  | `blazeface-short/blaze_face_short_range.tflite` | 229,746 B | `b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f` | storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/ |
  | `blazeface-full/blaze_face_full_range.tflite` | 1,083,786 B | `3698b18f063835bc609069ef052228fbe86d9c9a6dc8dcb7c7c2d69aed2b181b` | storage.googleapis.com/mediapipe-models/face_detector/blaze_face_full_range/float16/latest/ |
  | `yunet/face_detection_yunet_2023mar.onnx` | 232,589 B | `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4` | github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/ |

- **Installs:** a fresh venv at `inputs/face-models/venv` (Python 3.9.6): `mediapipe==1.1.1` (the harness's version; it brings `opencv-contrib-python` 5.0, which runs YuNet), and `coremltools` 9.0. No onnxruntime, onnx or torch: the ONNX file is read by a 150-line protobuf reader (`extraction-test/vision/onnx_lite.py`). No npm package.
- **The images:** the round-3 build's own `Prep.run`, through the locked harness's driver (imported unmodified), kept the fit upload each photo would send (1024 px). Sets: the 60 built photos with 120 pasted faces (the same seed: it reproduced round 3's exact misses, 34 faces), the 59-photo leak set (53 sent), the 400 held-out photos (368 sent), the 336 normal photos sent today, and the 5 eye-list photos. Scripts: `extraction-test/vision/face_model_probe.py` (`collect`, `detect`, `report`) and `yunet_coreml.py`.
- **How the models looked:** on the copy about to be sent, whole and in the app's 1 + 2×2 + 3×3 tiles (14 calls), each tile scaled to 640 or 1024 px on its long edge. BlazeFace also used 1 to 5×5 tiles (55 calls). A face counts as caught when 90% of its visible core lies inside the app's `headBox` of a model box. A "new box" is one less than half inside what round 3 already hides.
- **The outline rule:** drop a model box when half or more of it lies on his outline. In the test, his outline is Vision's person mask inside his person box grown 10%. In the app it would be round 3's own "his" instance label.
- **Readable or not:** each of the 34 still-sent built faces was judged once by eye (`yunet-123-640@0.6/built-misses/sheet00–01.jpg`): 18 readable, 6 borderline, 10 not readable.

## Results
Normal photos with a new box: of the 336 sent today. "On him (his box)" means the box's centre is inside his person box; by eye, every one left with the rule is background seen through that box (a wheel, a chandelier, faces behind him), not his body.

| Model · tiles (calls) | Thr. | Outline rule | Readable caught /18 | All caught /34 | Edge /15 | Normal photos with a new box | ...centre in his box | His own 66 | Leak-set new boxes | Held-out new boxes |
|---|---|---|---|---|---|---|---|---|---|---|
| YuNet · whole 1024 (1) | 0.5 | yes | 10 | 12 | 4 | 9 | 4 | 2 | 16 | 98 |
| YuNet · whole 1024 (1) | 0.7 | yes | 5 | 6 | 1 | 1 | 1 | 1 | 7 | 34 |
| YuNet · 1+4+9 @ 640 (14) | 0.5 | yes | 17 | 23 | 9 | 35 | 11 | 10 | 52 | 209 |
| YuNet · 1+4+9 @ 640 (14) | 0.6 | yes | 15 | 19 | 5 | 17 | 9 | 3 | 36 | 139 |
| YuNet · 1+4+9 @ 640 (14) | 0.7 | no | 13 | 16 | 3 | 27 | 26 | 3 | 25 | 104 |
| YuNet · 1+4+9 @ 640 (14) | 0.7 | yes | 13 | 16 | 3 | 7 | 6 | 1 | 21 | 69 |
| YuNet · 1+4+9 @ 1024 (14) | 0.6 | yes | 17 | 23 | 9 | 30 | 15 | 5 | 51 | 193 |
| **YuNet · 1+4+9 @ 1024 (14)** | **0.7** | no | 17 | 22 | 8 | 49 | 44 | 1 | 42 | 157 |
| **YuNet · 1+4+9 @ 1024 (14)** | **0.7** | **yes** | **17** | **22** | **8** | **15** | **9** | **1** | **33** | **105** |
| YuNet · 1+4+9 @ 1024 (14) | 0.8 | yes | 16 | 18 | 5 | 4 | 4 | 0 | 13 | 33 |
| BlazeFace full · 1+4+9 (14) | 0.3 | yes | 14 | 20 | 5 | 196 | 139 | 53 | 145 | 611 |
| BlazeFace full · 1+4+9 (14) | 0.5 | yes | 10 | 13 | 2 | 76 | 40 | 22 | 30 | 102 |
| BlazeFace full · 1–5×5 (55) | 0.5 | yes | 10 | 14 | 3 | 147 | 74 | 43 | 67 | 236 |
| BlazeFace short · 1–5×5 (55) | 0.5 | yes | 3 | 3 | 1 | 70 | 41 | 15 | 57 | 449 |

Every config at every threshold: `extraction-test/results/t96-face-models/summary.json` (no rule) and `summary+outline.json`. YuNet at 0.9 finds nothing at all; its scores on small faces stay below 0.9.

**By eye, the recommended setting (YuNet, 1+4+9 at 1024, 0.7, outline rule):**
- **Normal set, 19 new boxes on 15 photos** (`yunet-123-1024@0.7+outline/normal/sheet00.jpg`):
  - about 10 are real tiny faces (7–24 px, people behind him in low-res Instagram and Pinterest screenshots, a woman in pink on a street);
  - 8 are objects: a car wheel, wall stickers, a car, a door, grass, a brick wall, a chandelier, a framed picture;
  - 1 is a carved ornament;
  - **0 are on his body, clothes, phone or a mirror frame.**
- **His own 66 photos (his phone and the mirror set):** 1 box, the chandelier beside his head in `before_studio.jpg`. His phone's 59 checks: 0.
- **Held-out set, 105 new boxes** (`…/heldout/sheet00–03.jpg`): about 52 real faces (mostly dark or blurred audience members, some readable), 15 unclear, 38 not faces. The not-faces are logo letters, a brick wall, rock texture, an ornate door, car wheels, stairs, and five on the runway model's own arms, hand or bracelet that the test's coarse outline missed.
- **Leak set, 33 new boxes:** about 26 real faces, 2 unclear, 5 not faces (a logo, a hanging shirt, the floor by the model's feet, darkness, an arm).
- **What the outline rule drops** (`…/dropped-by-outline-*/`):
  - normal set: 39 boxes, every one on him: hands holding the phone, ripped knees, a belt, camo shorts, shirt buttons;
  - stranger sets: 64 boxes, mostly the runway model's hands, prints and clothes, but also **about 5 real faces pressed against the main person**: the woman beside the model's leg in `5afdd663…`, two audience faces behind the model's arm in `d5da50f2…`, one behind an arm in `57b4b96f…`, and the mouth and chin at the top of `f-08-40`. The test's "his outline" is Vision's all-people mask, which also covers people standing next to him. Round 3's per-person instance label should separate some of them, but that isn't measured here.
- **The eye-list photos:**
  - `5afdd663…`: the man in glasses, the man in the cap and one more audience face are caught. The woman next to them is dropped by the rule.
  - `eaac0d86…`: the half dark face beside the photographer is caught at 0.6 (640 px tiles) but not at 0.7. At 0.7 only the tiny model far down the runway is caught.
  - `e915a35a…`: three audience faces are caught.
  - `f-08-40`: the mouth and chin are found (0.82) but dropped by the rule.

## Time and memory (Mac)
- **OpenCV (Python), the whole photo:** 1+4+9 tiles at 1024 take a median of 156 ms (p95 225 ms) per photo; at 640, 79 ms (p95 112 ms). The Mac had 70–800 MB free during the runs.
- **Core ML, the converted model (Python `predict`, so slightly pessimistic):**

  | Model | Size | ms per tile (median) | 14 tiles |
  |---|---|---|---|
  | YuNet 1024, fp16, all compute units | 199,944 B | 14.7 | about 205 ms |
  | YuNet 1024, fp32, CPU | 297,647 B | 26.2 | about 366 ms |
  | YuNet 640, fp16, all compute units | 199,878 B | 5.6 | about 79 ms |

- The iPhone's Neural Engine time is **not measured**. It needs the model in a build and the `[prep]` log from his phone.

## Does the converted model give the same boxes?
- **Conversion:** coremltools' MIL builder, node by node. The graph has 8 op types (Conv, Relu, MaxPool, nearest Resize, Add, Transpose, Reshape, Sigmoid). The output is an `mlprogram` for iOS 16 or later, with a 1×3×S×S BGR 0–255 input, as OpenCV feeds it.
- **Sample:** 30 sent copies (normal, built and held-out), 420 tiles. Files: `extraction-test/results/t96-face-models/compare-640.json` and `compare-1024.json`.
- **Our decoder vs OpenCV's FaceDetectorYN on the same input:** 217 of 217 boxes identical (1024), 148 of 149 (640).
- **fp32 Core ML:** identical to OpenCV (raw score difference 0.0).
- **fp16 Core ML:** every box with a score of 0.5 or more matched; none missing, none extra. Median IoU 0.999, lowest 0.66; score difference at most 0.005; raw score difference at most 0.012.
- **Square padding:** each tile padded to a square (how a fixed-size Core ML model is fed) vs the tile at its own shape (how the tables above were measured), on 100 photos at 0.7: 21 of 22 boxes kept, 0 new. One borderline box is lost.

## Licences
- **YuNet:** opencv_zoo's folder says "All files in this directory are licensed under MIT License" (`models/face_detection_yunet/README.md` and its `LICENSE`, copyright 2020 Shiqi Yu). Shipping the weights is allowed under MIT.
- **YuNet's training data: a risk, not verified here.** The task brief says YuNet was trained on WIDER FACE, which is licensed for non-commercial research. The opencv_zoo README names WIDER Face only as its validation set and links `ShiqiYu/libfacedetection.train` for training details (not read). WIDER FACE's own terms page couldn't be fetched (a TLS certificate error). Whether a model trained on a research-only dataset may ship in a paid app is a legal question: MIT on the weights doesn't settle it. Before shipping, confirm the training data and WIDER FACE's terms; a lawyer's read is the safe step.
- **BlazeFace:** its model card says "Licensed under Apache License, Version 2.0" and "trained and evaluated on consented images". It is safe to ship, but it fails this job (above).

## Recommendation
**YuNet, tiles 1 + 2×2 + 3×3 each scaled to 1024 px, threshold 0.7, boxes on his own outline ignored.** BlazeFace is ruled out on results, not licence. Fallback if time is too high on the phone: the same at 640 px with threshold 0.6 (15 of 18 readable, 17 normal photos, about 79 ms).

**How it would slot into `KittedPrep.swift`** (for round 4, only after the founder's yes; no code was written):
1. A new detector beside `detectFaces`: `detectYuNet(image, in rect)` runs the bundled `YuNet1024.mlmodelc` through Core ML, with the tile scaled to 1024 on its long edge and padded to a square, BGR 0–255. It decodes strides 8/16/32 (score = √(cls·obj)), runs NMS at 0.3 and maps the boxes back to the image. It returns `[Face]`, so it fits the existing `FaceDetect` type.
2. **Layer 3b, the last pass of `sweep`, on the copy about to be sent** (`img1`, after every round-3 layer: that is the image this test measured), over `tiles(W, H, grids: [1, 2, 3])`:
   - keep boxes with a score of 0.7 or more;
   - drop boxes at least 95% inside `locate`'s own hidden regions (`alreadyHiddenShare`, as today);
   - drop boxes at least half on his outline: his instance label inside his box, grown `himMargin`, the same "his" rule the missed-people cover uses;
   - grey-fill `headBox` of every box left, as for swept faces.
3. **Layer 4 re-check:** YuNet runs again on the tiles that touch a new head box. A box at 0.7 or more still there → `couldNotFrame` / `faceRemains`. A Core ML error → `sweepFailed` (send nothing).
4. **Tests for round 4:**
   - built small faces: the readable profile and edge faces, judged against the eye list above;
   - leak and held-out sets: YuNet's own boxes added to the face cores, so the faces found here count against the build;
   - false refusals and "never on him": hands holding a phone, knees and belts on the normal set.
   - It is Apple's detector plus a second model, so it also eases round 3's "circular checking" risk.
5. **Cost:** 14 more Core ML calls per photo (about 205 ms on the Mac at fp16). Measure on his phone first. If it's too slow, use the 640 fallback, or run YuNet only on the 2×2 and 3×3 tiles.
6. **No npm package.** It is a native change (a 200 KB model in the module), so it reaches his phone only with a rebuild.

**Open before round 4:** the founder's yes; the WIDER FACE licence check; whether round 3's instance label drops fewer of the faces pressed against him than this test's coarse mask (measure in round 4).

## Not verified
- iPhone Neural Engine time and boxes: Core ML on the phone can differ from the Mac at the margins.
- The outline rule with round 3's real instance label (the test used Vision's all-people mask in his box).
- The "readable" calls are one person's eye (this session), on 3× crops.
- Real photos with a second mirror panel (the founder's Y37).
- WIDER FACE's terms (page unreachable) and YuNet's training data (not read at the source).

## Files
- Scripts (committed): `extraction-test/vision/face_model_probe.py`, `onnx_lite.py`, `yunet_coreml.py`.
- Results (JSON committed, sheets git-ignored): `extraction-test/results/t96-face-models/`: `summary.json`, `summary+outline.json`, `compare-*.json`, `convert-*.json`. Sheets are in `<config>@<threshold>[+outline]/<set>/sheetNN.jpg`, and `extra-whole/` holds the eye-list photos with every box drawn.
- Not committed (`inputs/`, git-ignored): the venv, the three downloads, the converted `.mlpackage` files, and the saved sent copies in `inputs/face-models/run/` (other people's photos; delete after round 4).
