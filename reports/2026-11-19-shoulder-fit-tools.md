# Can a free tool tell when a jacket's shoulders don't fit? (Nov 19, research only)

Research in the built-in browser plus a read of our own code and past results. Nothing was installed or downloaded, nothing was run, $0 spent. What I read is cited by link; what I could not check is marked **not verified**.

## The short answer

1. **The tool is already in the app.** Apple Vision body pose and person mask are already used by `app/modules/kitted-vision/ios/` (`KittedPrep.swift`, `KittedMeasure.swift`) and by the Mac harness. A shoulder-fit reading needs **no new package and no new native module**, only new Swift in the existing one.
2. **A pose model alone can't answer it.** It finds where his shoulders are, not where the jacket's seam is. The seam is the thing we need, and no pose model gives it. What the code can measure is the jacket's **outline** (Vision's person mask, cut to the outer-layer box) against his shoulder joint. That shows how hard the shoulder line slopes and how far it sits from the joint.
3. **The weak spot is the puffer itself.** Under padding the joint is a guess. The models were trained on labels where a person marked hidden shoulders by eye, so on a thick puffer the "body shoulder" may be read off the jacket, which makes the comparison circular. Nobody has measured this. It is the main unknown, and the $0 test below answers it.
4. **We've been here before, with a mixed result.** The Oct 9 fit ruler (DECISIONS-LOG #170, `rubric/research/notes/fit-ruler.md`) measured sleeve ends against his joints. It scored 79% when sure against the AI's 93%, and was unsure 42% of the time (60% on his photos). So expect a shoulder version to be a partial signal that says "unsure" often, not a replacement for the AI.

**Recommendation: try Apple Vision first, on the Mac, for $0 (test at the bottom). Don't add MediaPipe, MoveNet, RTMPose, ViTPose or a clothes-parsing model to the app now.**

## What the app and the harness already have

| Piece | Where | What it gives |
|---|---|---|
| Body pose (2D) | `VNDetectHumanBodyPoseRequest` in `KittedPrep.swift`, `KittedCameraView.swift` | neck, both shoulders, elbows, wrists, hips, knees, ankles, each with a confidence |
| Person mask | `VNGeneratePersonInstanceMaskRequest` and `VNGeneratePersonSegmentationRequest` in `KittedPrep.swift`, `KittedMeasure.swift` | his outline, one mask per person |
| Hand pose | `VNDetectHumanHandPoseRequest` in `KittedMeasure.swift` | hands, used for sleeves over the hand |
| Garment boxes | the closet call (AI) | an outerwear box, intersected with the mask in `Measure` |
| Fit ruler | `extraction-test/vision/FitRuler.swift` (Mac only) | where a garment ends, as a fraction of a limb segment |
| MediaPipe heavy | `extraction-test/waist_mediapipe.py`, venv `.venv-mp`, model in `inputs/mediapipe/` | 33 landmarks. Tried for the waist (DECISIONS-LOG #269): it agreed with Apple's 2D shoulders and knees to SD 1.9 cm, and Apple's 3D pose was too noisy (4–6 cm) and dropped |

So "re-propose MediaPipe" is already answered: it's on disk and gives the same 2D shoulders as Apple to within about 2 cm. It adds no new information for this question.

## Candidates compared

| Tool | Licence | Runs where | Shoulder accuracy | Size and speed | New package or native code | Links |
|---|---|---|---|---|---|---|
| **Apple Vision body pose (2D)** and person mask | Part of iOS, no licence to manage | On the phone (Neural Engine); also the Mac | No shoulder-specific figure published. Our own check: agrees with MediaPipe to 1.9 cm on shoulders and knees (#269). Nothing known for padded jackets | Built in; already in the photo-prep path | **None** | [VNDetectHumanBodyPoseRequest](https://developer.apple.com/documentation/vision/vndetecthumanbodyposerequest) |
| **Apple Vision 3D body pose** (`VNDetectHumanBodyPose3DRequest`, iOS 17+) | Same | Phone | We tested a 3D ruler in #269: 4–6 cm noise, dropped | Built in | None, but not useful | Apple docs (same site) |
| **MediaPipe Pose Landmarker** (BlazePose, lite / full / heavy) | Code and models Apache 2.0 | Phone (iOS Tasks library) or Mac (Python) | 33 landmarks plus optional mask; no per-joint accuracy on the docs page | CNN like MobileNetV2, built for real-time fitness | On the phone: a new native package. Mac: already set up | [Pose Landmarker guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) |
| **MoveNet** (Lightning / Thunder, single and multi-person) | Apache 2.0 | Phone (TF Lite) or browser | 17 COCO keypoints, no better than Vision for our case | Multi-pose Lightning `saved_model.pb` is 9.12 MB; runs above 30 FPS | New TF Lite package and wiring | [Kaggle model page](https://www.kaggle.com/models/google/movenet) |
| **RTMPose** (MMPose) | Apache 2.0 (repo licence **not verified** on the page I read) | Mac easily; phone via ncnn or ONNX | Body8 PCK and AUC are in their tables; COCO AP 75.8 for RTMPose-m, 72.2 for RTMPose-s | RTMPose-s runs 70+ FPS on a Snapdragon 865 (their number) | New runtime and a model conversion; nothing ready for Core ML | [RTMPose README](https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose) |
| **ViTPose** | Apache 2.0 | Mac (PyTorch). Too heavy for the phone | Best accuracy of the group: 75.8 AP (B) to 79.1 (H) on COCO val at 256×192; 81.1 test-dev | Large; GPU-class | PyTorch, weights hosted on OneDrive | [ViTPose repo](https://github.com/ViTAE-Transformer/ViTPose) |
| **SCHP human parsing** | MIT | Mac (PyTorch); phone only after a Core ML conversion | LIP 59.4% mIoU (has a **Coat** class), ATR 82.3% (no coat class, one "Upper-clothes" for tee and jacket) | PyTorch checkpoints; size not checked | Conversion work, nothing off the shelf | [SCHP repo](https://github.com/GoGoDuck912/Self-Correction-Human-Parsing) |
| **SegFormer B2 clothes** | **"Other": NVIDIA Source Code License, section 3.3 limits use to non-commercial.** Can't ship in a paid app | Mac / PyTorch | ATR labels (no coat class): Upper-clothes IoU 0.78, arms 0.73–0.74 | 27.4M parameters | n/a | [Model card](https://huggingface.co/mattmdjaga/segformer_b2_clothes), [licence](https://github.com/NVlabs/SegFormer/blob/master/LICENSE) |
| **DeepFashion2 landmarks** | Dataset behind a request form; licence terms **not verified** (treat as research-only until read) | Mac training only | 294 landmarks over 13 categories, including long-sleeve outwear. This is the only family that labels the **garment's own** shoulder, sleeve end and hem points | Dataset: 491K images | **No ready pretrained model found.** Training one is a project, not a test | [DeepFashion2](https://github.com/switchablenorms/DeepFashion2) |
| **Fashionpedia** | Terms **not verified** | Mac | Masks for 27 apparel categories and 19 parts (sleeve, collar, neckline), no seam point | Dataset | Training needed | [Fashionpedia](https://github.com/cvdfoundation/fashionpedia) |
| **SAM-style segmentation** | Not read this session; **not verified** | Mac / phone variants exist | Not read | Not read | Probably large | Not researched: Vision's mask already gives the outline |

Gaps in my reading, so nothing here overstates: I did not find a published accuracy number for any model on shoulders under thick outerwear. COCO AP is an all-joints figure. I did not read the SAM or MobileSAM pages. Licences for RTMPose, DeepFashion2 and Fashionpedia need a second look before any of them are used for anything shipped.

## Ranked recommendation

1. **Apple Vision pose plus person mask (already in the app).** $0, nothing new to install, on-device, nothing to send. It is the only option that is both free of new code and already tested in our harness. Try it before anything else.
2. **MediaPipe heavy on the Mac, as a cross-check only.** Already installed. Run it only if Apple's joints look unreliable on puffers; if the two disagree, that itself says the joint can't be trusted under padding. Don't put it in the app.
3. **ViTPose-H or RTMPose on the Mac, as a ceiling test.** If Apple and MediaPipe both fail on puffers, a stronger model tells us whether better joints help at all. That needs a download and an install, so it needs his yes. Only worth it if step 1 is close to the bar.
4. **A garment-landmark model trained on DeepFashion2.** It is the only route that sees the garment's own shoulder point, but it is a training project with unclear data terms. Park it unless steps 1–3 show the outline idea works and the joint is the problem.
5. **Clothes parsing (SCHP, SegFormer): don't.** SegFormer's licence blocks a paid app. SCHP's ATR version has no coat class. The AI's outerwear box already tells us which pixels are the jacket.

## What it would take to build the winner

If the $0 test passes: a new Swift function in `KittedMeasure.swift` (the same file that already handles the person mask and pose), a Mac probe first in `extraction-test/vision/` (like `LegShapeProbe.swift`, which stays out of the app), parity-style tests for the logic, a new field on the check result (for example `jacket_shoulder: fits | slopes | unsure`), and a small rule in `@kitted/core` that lowers Fit for a clear "slopes" with "short sleeve" or "short body" from the AI. That is a strict task (scoring), roughly 3–5 sessions after the probe, no new package, no native rebuild beyond the normal one when Swift changes. Cost per check: $0 on the server (all on the phone).

## Hard-line check

| Risk | Where | How to stay inside the line |
|---|---|---|
| **A measure of his body.** Any ratio of jacket width to his shoulder width is a body measure. | Every option | Positions only, as fractions of his own limb segments, never a width against the body. That is the rule the fit ruler already keeps (#170). The result is a jacket label (`slopes` / `fits` / `unsure`), never a number about him |
| **Copy that points at him.** "Too small for you" reads as a comment on his frame. | The words | Say only what the clothes do: "The shoulder line on this jacket slopes down", "Sleeves end short of the wrist". Never "your shoulders", never a size verdict about him. The body-aware advice spec (`specs/body-aware-advice.md`) already governs what Kit may say about cuts |
| **Storing body data.** | Pose joints, mask | Compute and discard on the phone. Store only the jacket label with the check, never joints, mask or slope numbers. Check the label against the privacy copy before it ships |
| **Bias.** A mask and pose that work worse on some skin tones or builds would score some people's jackets worse. | Vision, MediaPipe, any parser | The fit ruler answered the sleeve on 75% of light, 50% of medium and 45% of deep-skinned photos (#170). The test must split by skin tone and build and show equal answer and accuracy rates before anything ships |
| **Sending anything.** | n/a | On-device only. Nothing leaves the phone, and the face-blurred copy rule is untouched |
| **Face rule.** | Pose models | Vision pose already runs in photo prep; the shoulder reading uses the same copy. A cloud pose API would break the privacy rule, so none is considered |

## The $0 first test (needs his yes only because it is a session of work; no spend, no install)

**Question:** can Apple Vision's shoulder joints plus the jacket outline tell a jacket that slopes at the shoulder from one that fits, on photos where we already know the answer?

1. **Photos.** From the gold set and his own pull, pick every photo with an outer layer (jacket, coat, puffer, overshirt), plus today's puffer and any size-ladder photos. Count them first. Aim for about 40, with skin tones and builds spread. Record the person's age band and looks per CLAUDE.md rule 6; stock and web photos count as "profile unknown". **Not verified:** how many gold photos have an outer layer. Counting them is step one.
2. **Labels first.** Before running anything, label each photo by eye as shoulder line sits on the shoulder, drops or slopes below it, or can't tell (arm raised, bag strap, crossed arms). Write them to a CSV the way `ruler_labels.csv` was done. Claude labels, the founder spot-checks 10.
3. **Probe.** Add a harness-only Swift file next to `FitRuler.swift` and build it with `extraction-test/vision/build.sh`. For each photo it reads the Apple pose neck and shoulder joints (with confidence), walks the person mask along the shoulder band, and reports the outline's slope from neck to outer arm edge and how far the outermost outline point sits below the shoulder joint, as a fraction of the shoulder-to-elbow segment. A confidence gate says `unsure` when a joint is weak or the arm is raised.
4. **Cross-check.** Run `waist_mediapipe.py`-style MediaPipe on the same photos and compare the joints. Where Apple and MediaPipe disagree by more than a few cm, count it as "joint unreliable".
5. **Bar to pass** (same as the fit ruler's): beats the AI's 78% on the same photos, and `unsure` is 20% or less, with equal rates across skin tones.
6. **Cost:** $0 (no API calls; the Mac only). **Time:** about half a day of one session, run the heavy steps one at a time per the Mac-memory rule.

**My honest odds (a judgment, not a measured number):** about one in three that it clears the bar. It will likely catch the hard "puffer cut for a much smaller frame" cases, because the outline slope is large. It will likely fail at the subtle cases, and with padding the joint may be pulled onto the jacket. If it fails, the result is still worth having: it tells us the AI side (the parallel session's shoulder-line question plus the sleeve and body-length reads the AI already does at about 90%) is the right path, and that combining several weak jacket cues may beat the one seam we can't read.

## What I did not do

No download, install or paid call. Nothing was run on any photo, so no claim here is a result on our photos. Documents were read through the Browser pane: Apple, MediaPipe, MMPose, ViTPose, SCHP, SegFormer, MoveNet, DeepFashion2 and Fashionpedia pages.
