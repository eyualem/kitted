# T96s · Testing contract (strict)

Written by the session; tests written and locked by the test writer. The task's logic criteria go here, never words, labels or layout. **Locked once the Lock line is filled.** After that only the test writer changes this file or the tests, only to add or strengthen, with the reason in TASK.md → Disputes.

**Lock:** `<commit SHA>` · <date> · tests: `extraction-test/vision/print_faces_test.py`

**Scope.** The plan line's one check is **F2.2** (`specs.md`): "Only the face-blurred copy leaves the phone; with no head found, nothing is sent and the card says why", read with §"How a check works" step 1, the "Head not found" row and the **Never** line ("a face sent unblurred").
- The founder's direction of Nov 16 (through the coordinator): a face printed on his own clothes isn't a person's face; his own face stays strict, including his reflection and a second mirror panel; anything touching his head is hidden; strangers' faces get no new work.
- Every line below is F2.2. Where it needs his yes to be read this way, see IMPLEMENTATION.md → Open questions, founder 1.

## Where and how these tests run (read first)
- **Mac harness only, never in `npm run check`.** The photos are other people's and stay git-ignored in the main checkout (`/Users/eyu/Desktop/files/Kitted/inputs/…`). Nothing leaves the Mac; no network, no AI, $0. Photos are never committed.
- **One locked file:** `extraction-test/vision/print_faces_test.py`, with its own Swift driver source (a string compiled with `xcrun swiftc` against the **worktree's** `KittedPrep.swift`, `KittedGuide.swift`, `KittedMeasure.swift`).
- **Three builds:**
  - the worktree's (`-D T96S`, under test);
  - the round-3 build at **`a00da29d`** ("before": T96 round 3, the build that greys prints);
  - main at **`1c34082d`** ("main").
- It may import helpers from `extraction-test/vision/face_leak_test.py` read-only and run it as a subprocess. It never edits it, its thresholds or `tasks/T96/TESTING.md`.
- **Run:** `/Users/eyu/Desktop/files/Kitted/extraction-test/.venv-mp/bin/python extraction-test/vision/print_faces_test.py --full`. It prints `PASS`/`FAIL F2.2 · <name>` per line and exits non-zero on any fail.
  - `--quick` (every line but T96's re-run) is for building; **a line passes only on `--full`**.
  - `--full` includes T96's `--full` (heavy, about an hour): check `top -l 1 | grep PhysMem` first, nothing else heavy alongside.
  - Output: `extraction-test/results/t96s/` (JSON committed; crops and sheets git-ignored).
- **Eye boxes.** A print's face, and the real faces used as "must stay hidden" cases, are boxes set **by eye** at lock and written in the file, the way `EYE_NOT_FACES` is:
  - at the 1024 upload's size, `[x, y, w, h]`;
  - around the eyes, nose and mouth of the face, grown 10%;
  - never taken from the build's detector.
- **Measures:**
  - **Unchanged share** of a box: the share of its pixels whose grey differs from the original (resized to that copy's size) by under 12.
  - **Grey share:** the share of pixels within 10 of 128 on every channel.
  - **Hidden:** T96's rule (TESTING.md of T96, T = 0.5).
  - **Left alone:** unchanged share ≥ **0.90** and grey share ≤ **0.02**, in the upload (1024) and the detail copy (2048), and in each close-up whose `zoomRects` rect holds at least 80% of the box. JPEG re-encoding alone measures 0.97–1.0 on untouched regions; the line reports each value.

## Real photos (found Nov 16 by the planner, by eye; paths relative to `/Users/eyu/Desktop/files/Kitted/`)
**Prints on the subject's own torso** (all "profile unknown": web photos; none of his 59 phone checks has a printed face):
- **P1** `inputs/ig/Screenshot 2026-10-12 at 2.05.18 PM.png` (692×1512): a mirror selfie, white tee with a black-and-white photo print of a woman (surf scene); her head is about 20 px at 1024. The phone covers his face. In the T96 normal set (tuning).
- **P2** `inputs/ig/Screenshot 2026-10-12 at 1.44.56 PM.png` (764×1508): a vintage band-style tee ("T.R. … '88") with a printed man in a pink suit; the face is about 30 px at 1024. His face is visible under a cap. In the T96 normal set (tuning).
- **P3** `inputs/fashionpedia/images/test/f6890fd9ddbb8cf2d17a332eb72e0ea2.jpg` (683×1024): a white tank with a Nefertiti face print, about 55 px (runway, a woman: the rule is the same). File index % 8 = 3 (sorted file names): not T96's held-out set (% 8 = 4) or face pool (% 8 = 2).
- **P4 (needs a pick)** `inputs/fashionpedia/images/test/6c1cf70085fef21a41cb374e84bfd6c3.jpg`: a top and trousers covered in small repeated portrait prints. `locate` says "Which one is you?". It's judged with the candidate that overlaps the model most picked; if that pick isn't `ok` on the round-3 build, P4 is reported and not gated.
- **The scan found no more.** `locate` and the tile pass ran on 2,400 Fashionpedia photos (every file not in T96's held-out or pool split; 2,158 sent), and every torso face was looked at by eye. Only P3 is a print. The rest are:
  - a jacket pocket;
  - runway audiences;
  - one subject's own face below a wrong shoulder line (S7);
  - a dark graphic too unclear to call;
  - a tattooed hand (`dad143d95446d9ee58f3987bdf48dbce.jpg`, index % 8 = 6), which the rule leaves alone. It's not a face, so that's fine, and it's reported only.

  So there are **3 real prints, plus P4 behind a pick: fewer than the 5 asked for**. The built prints line adds weight but never stands alone.

**Not a face, on her chest:** `inputs/pinterest/Screenshot 2026-10-12 at 2.51.33 PM.png`, a necklace pendant the tile pass calls a face. Reported only; left alone or hidden are both fine.

**His own face where the pose lies (must stay hidden).** On each, the body pose that `locate` takes as "his" has shoulders above, or away from, the subject's real face, so the face sits "below the shoulders":
- **S1** `inputs/pinterest/Screenshot 2026-10-12 at 2.55.27 PM.png`: an older man in a hat; the pose finds only one shoulder and the neck. Also the grey-head-square photo.
- **S2–S6**, runway photos from the T96 leak set (`inputs/fashionpedia/images/test/`): `caa7c7b751d4acf2ef5a8aaf1896d3f0.jpg` (no hips), `cefdf3bda4f600792ddbed990887d837.jpg` (no hips), `d5da50f251cc2ba7d90e5ab8251d2b94.jpg` (the pose is a person at the left edge), `f304cfe8f41748fa2e35cb7b670b4a54.jpg` (the pose is a person behind her, shoulders outside her box), `956bd805fafef7524b88d3629224b151.jpg` (one hip). Each also has audience faces; those stay T96's leak-set line.
- **S7** `inputs/fashionpedia/images/test/4f90696201ecfc4a4fe2ca9dfacc42c8.jpg` (a woman at a premiere in front of a poster; her face lies below the pose's shoulder line). Index % 8 = 0; held out for T96s.

**Strangers' real faces inside the subject's box below the shoulders, off her outline (must stay hidden).**
- **X1** `inputs/fashionpedia/images/test/82d90f72c9745665b559a423f5e4e101.jpg`: a man in a green cap behind her, at chest height. Index % 8 = 5 (not held out or pool).
- **X2…** every T96 leak-set photo where a dense-hunt core lies inside `locate`'s main box below its lower shoulder. By the probe these are runway audiences between or beside the legs: `053888747f…`, `1646a045…`, `1851ff9e…`, `948f43eb…`, `ad3b7f7f…`, `ca395e77…`, `f79f1d0f…`, `a5faa285…`, `d96606ae…`, `3dda1140…`, `742ca0de…`, `5252d050…`, `cc046b02…`, `98f21cbd…`, `ebb38e79…`, `6c8834c6…`, and YouTube `ove4zof6W2k/f-09-17`, `4hwelpjhDTM/f-04-55`, `3RdxtHvsuxk/f-08-13`.
- The cores minus `EYE_NOT_FACES` are the faces.

**Tuning vs held out (for T96s):**
- The implementer may look at and tune on P1, P2, S1, X1 and the T96 tuning sets.
- **Held out for T96s:** P3, P4 and S7. The implementer never opens them; they are judged only by `--full`.
- S2–S6 and X2… are T96 tuning photos and may be looked at.

## Criteria
- **F2.2** · The print rule's logic, detector-free · how: unit, Swift driver, hand-built `Located` values (no Vision), on a 1000×2000 canvas. His box [300, 200, 400, 1700], an outline mask filling his box, neck (500, 520), shoulders (380, 540) and (620, 540), hips (420, 1100) and (580, 1100), head band [400, 200, 200, 300], head points (470, 380), (530, 380), (500, 420) · test: `print_faces_test.py` › `F2.2 · print rule logic` · expect:
  - (1) `printZone(found, kind: .fit, W: 1000, H: 2000)` is non-nil, with `torso` = x 380…620, y 540…1184 (1100 + 0.15 × 560), ±1 px, and `shoulderSpan` 240.
  - (2) `isPrint([450, 700, 80, 80])` true.
  - (3) false for each of these boxes:
    - [450, 500, 80, 80] (above the lower shoulder);
    - [450, 560, 80, 80] with the head band moved to [400, 200, 200, 380] (inside his head region grown 25%);
    - [450, 1150, 80, 80] (past the hem line);
    - [300, 700, 60, 60] (centre outside the shoulders);
    - [380, 700, 200, 200] (wider than 0.8 × 240);
    - [450, 700, 80, 80] with the mask emptied left of x = 500 (under 90% on his outline);
    - [450, 700, 80, 80] with `otherHeads` = [[440, 690, 100, 100]];
    - [450, 700, 80, 80] with a head point at (490, 740).
  - (4) `printZone` nil for each of these:
    - `kind` `.snap` or `.items`;
    - `status` other than ok;
    - any of neck, shoulders, hips missing;
    - a shoulder outside his box;
    - hips less than 15% of his box height below the shoulders;
    - shoulder span under 10% of his box width;
    - no outline;
    - no head region (no band, no head-joint box, no face above the shoulders).
  - (5) `isPrint` with a nil zone is false for every box above.
  - (6) The same `found` twice gives equal zones and answers · must not: a box touching his head region, or any box with no trusted zone, counted as a print · edges: a box exactly on the hem or shoulder line (inclusive on the inside, as written in the Interfaces); a head band only (the phone over his face, no head points) still makes a zone · red: stubs (`fatalError("T96s: not built")`) crash the driver
- **F2.2** · Real prints on the subject's torso reach the reading as they are · how: Mac harness, `Prep.run` (fit) with the real detector, on P1, P2, P3 (and P4 with the pick, and any print added from the scan) · test: `print_faces_test.py` › `F2.2 · real prints sent` · expect:
  - For each: status `ok`, no `reason`.
  - Each eye-boxed print face is **left alone** (above).
  - `printsKept` ≥ 1, and one `prints` rect overlaps the eye box (IoU ≥ 0.3 at the 1024 size).
  - Every region main's `locate` hides for the subject's head (`locate`'s `hide` rects centred above the lower shoulder) is hidden in the upload and detail copy at least as well as on main: unchanged share ≤ main's + 0.05.
  - Reported: the print's unchanged and grey shares on the round-3 build (red there) and on the new build.
  - must not: the print greyed, blurred or pixelated; the photo refused; his own face less hidden than on main.
  - edges: P1 has his face behind the phone (his head is only the band); P3's print is a large stylised face (the whole-photo pass may find it, which tests the `locate` side of the fix).
  - red: on the round-3 build (`a00da29d`), the tile pass greys P1's, P2's and P3's print faces (each was found by the probe at confidence 0.59–0.65, outside every `locate` region). The test writer confirms the red line at lock.
- **F2.2** · His own face is never taken for a print, even when the body pose lies · how: Mac harness, `Prep.run` (fit), on S1–S7 · test: `print_faces_test.py` › `F2.2 · his face when the pose lies` · expect: on each, no `prints` rect overlaps the subject's eye-boxed face (IoU > 0); the subject's face is hidden in the upload and detail copy by T96's rule; every region main's `locate` hides has unchanged share ≤ main's + 0.05; status as the round-3 build's · must not: the subject's real face left alone · edges: S1 (one shoulder, neck only); S5 (the pose is a person behind her, shoulders outside her box); S2 and S3 (no hips) · red: passes on the round-3 build (it has no rule). **Bites** via a planted rule that skips the pose test (rule 2): S1 or S5 sends the subject's face unhidden. The test writer shows it at lock.
- **F2.2** · A stranger's face at his chest height, off his outline, stays hidden · how: Mac harness, `Prep.run` (fit), X1 and X2… · test: `print_faces_test.py` › `F2.2 · strangers at torso height` · expect:
  - every eye face (X1's man; X2…'s dense-hunt cores inside the main box below the lower shoulder, minus `EYE_NOT_FACES`) is hidden in every copy, as on the round-3 build, or the photo is refused as on the round-3 build;
  - no `prints` rect overlaps any of them;
  - statuses equal the round-3 build's.
  - must not: an audience face between a model's legs, or a passer-by beside his chest, left alone.
  - edges: faces 12–30 px between legs, where his outline at 384 px can blur into them (rule 6).
  - red: passes on the round-3 build. **Bites** via a planted rule without the outline test (rule 6) and without the head-region test. The test writer shows which of the two bites at lock; a line that no planted rule bites is reported in TASK.md.
- **F2.2** · Built prints: left alone on his chest, hidden at his head or beside him (an extra; never the only proof) · how: Mac harness, built photos.
  - Hosts: his phone's sent photos and the mirror set, where main's `locate` gives all of neck, shoulders and hips and his head band.
  - A frontal face from the T96 pool (Fashionpedia index % 8 = 2), cut as a hard-edged square (a flat print, not a soft oval), pasted with its face core 24–80 px tall in the 1024 copy;
  - seeded; 30 photos (`--quick` 10);
  - JPEG q95 in a private folder under `/private/tmp`, deleted after.

  Placements: **(a)** on his chest: centre between the shoulders, top ≥ 15% of shoulder→hip below the lower shoulder, bottom above the hip line, wholly on main's person mask. **(b)** touching his head: the same face with its top edge inside his head band grown 25%. **(c)** beside him at chest height, wholly off his outline (≥ 10 px from main's person mask). · test: `print_faces_test.py` › `F2.2 · built prints` · expect:
  - (a) at least **90%** left alone and **0** refused because of it (statuses equal the host's without the paste);
  - (b) **100%** hidden by T96's rule, or the photo refused;
  - (c) **100%** hidden or covered, or refused.

  Reported: (a)'s misses with the reason (`printZone` nil, or the rule that said no) · must not: a face touching his head left alone; a face off his outline left alone · edges: a print at the hem line; two prints side by side on his chest (every 5th (a)) · red: on the round-3 build (a) is greyed (0% left alone if the tile pass finds the pasted face; the line reports how many it finds); (b) and (c) pass there
- **F2.2** · The re-check doesn't refuse a print, and still refuses anything else · how: unit, Swift driver, stand-in detectors on P1 and P2 (and the built (a) photos) · test: `print_faces_test.py` › `F2.2 · re-check and prints` · expect:
  - (1) A detector that always "sees" the print box P (P1's eye box at working size, wherever a tile contains it), and also a background box B (40×40, outside his box grown 10%) while B's pixels are unchanged: status `ok`, `prints` ⊇ [P], B's `headBox` in `hidden`, B no longer unchanged (≤ T).
  - (2) A detector that always "sees" B: `couldNotFrame` / `faceRemains`, exactly the five keys, no file written (as T96).
  - (3) A detector that always sees a box on his torso that fails rule 6 (half on his outline): `couldNotFrame` / `faceRemains`.
  - (4) A detector that throws on the 7th call: `sweepFailed`.

  must not: a print forcing a refusal; a non-print box let through by the re-check · red: on the round-3 build, (1) is `faceRemains` (the re-check finds P on a tile that touches B's head) or P is greyed
- **F2.2** · The grey square no longer lands on his own head and shoulders · how: Mac harness, `Prep.run` (fit), S1 and every one of the 336 normal photos sent both by main and now · test: `print_faces_test.py` › `F2.2 · grey square on him` · expect:
  - **(1) S1:** no `hidden` rect larger than 1.5× the area of main's largest head region on that photo, centred inside main's head region (his `locate` hide rects centred above his shoulders). On the round-3 build there's one: the 441×524 square.
  - **(2) Every photo:** the share of his outline that is flat grey stays at most main's + **0.02**. His outline here is main's `Measure.personMask` inside his box, 2 px in from its edge, **outside main's own `locate` hide rects** (not outside the new `hidden`, which is T96's verifier's test 1 gap).
  - **(3) Every other head T96 hid is still hidden:** on the leak set, the second-mirror-panel built photos and S1, each `otherHeads` rect of the round-3 build that isn't centred inside his head region is still in `hidden`.

  must not: a stranger's head beside his losing its cover · edges: his second reflection in a mirror panel (T96's panel (c)) keeps its head hidden · red: (1) and (2) fail on the round-3 build at S1 (`… 2.55.27 PM`: about 8% of his body grey, 0% on main)
- **F2.2** · Snaps, clothes scans, and a cut-off head are unchanged · how: Mac harness · test: `print_faces_test.py` › `F2.2 · where the rule doesn't apply` · expect:
  - (1) P1, P2 and P3 through `run` with kind `.snap` and `.items`: `printsKept` 0, and the result and every copy byte-identical to the round-3 build's (except `*Ms` and the two new keys).
  - (2) P1 and P2 cropped just below the top of his shoulders (his head out of the frame): `printsKept` 0, status and copies as the round-3 build's. This is the "Head not found" row: no head region means nothing is a print, and today's rules decide what's sent.

  must not: a print left alone when his head can't be placed · red: passes on the round-3 build (no rule); bites via a planted rule that allows a zone with no head region
- **F2.2** · T96's lines stay where they are · how: Mac harness, `face_leak_test.py --full` run as a subprocess on the worktree, unchanged · test: `print_faces_test.py` › `F2.2 · T96 still holds` · expect:
  - **Still passing** (they pass on the round-3 build): sweep logic, old sends purged, same photo, leak set, kmeasure copies, false refusals, second mirror panel, no regression, held out and regression (automatic part).
  - **Not worse** on the lines red on the round-3 build:
    - built small faces: caught counts per band ≥ round 3's (frontal 12–19 13, 20–31 21, 32–64 19; profile 12–19 4, 20–31 14, 32–64 15; side 0, eyesIn 4, topEyesOut 3);
    - missed people: ≥ 9 of 12 fully grey.
  - The time line is reported, not gated, while the Mac has under 1 GB free (as T96).
  - must not: any T96 count fall.
  - If a T96 line goes red **only** because of a print this task left alone, the line fails here too and the implementer stops: it's a dispute for the founder (IMPLEMENTATION.md → Collisions), not a pass.
  - red: n/a (regression); the round-3 run's JSONs in `extraction-test/results/t96/` are the baseline.
- **F2.2** · Same photo, same copy · how: Mac harness · test: `print_faces_test.py` › `F2.2 · same photo` · expect: P1, P2, P3, S1 and 4 built (a) photos, each prepped twice into fresh roots: identical `sha256`, upload, detail and close-up bytes; identical result keys and values except the `*Ms` timings; identical `prints` · must not: a sent copy or a print verdict that changes between two preps · red: passes on the round-3 build; bites via a jittered `printMinOnOutline` (0.9 ± random 0.05)
- **F2.2** · Nothing else breaks · how: existing checks · test: `npm run check` in `app/` · expect: green, no test file changed (no JS or TS change in this task) · must not: an existing test edited · red: n/a

## Edges from the spec's failure table
- **Head not found:** covered by "where the rule doesn't apply" (2). No head region means no print, so today's rules decide, and the "nothing sent" path is unchanged.
- **A failure mid-way:** a detector error (re-check (4)), a missing outline (logic (4)) or no instance mask all fall back to today's behaviour, never to "print".
- **Offline, the 4 am day change, a wipe or reinstall:** don't apply. The rule runs on the phone on one photo, keeps no state, and writes no new file (`sweepVersion` stays 1). The purge behaviour is T96's "old sends purged" line, re-run in "T96 still holds".

## UI inventory
**No new UI.** No screen, state, words, VoiceOver label, testID or demo screen is added or changed, so no flow and no screenshots are required. The only visible change is in the sent copy:
- You → Privacy → "See what I send" shows the upload, now with the graphic on his tee as it is.
- His face stays blurred as today; that screen's words and layout are unchanged.

A refusal still reaches him through today's `couldNotFrame` paths (T96 TESTING.md → UI inventory).

## Not testable yet
Never dropped, never counted as done.
- **F2.2 on his own graphic tees** · why: none of his 59 phone checks has a printed face; the real prints are web photos · would verify it: the founder's to-do: 3–5 mirror checks in a tee or hoodie with a face on it (a band tee, a photo print), one with a second mirror panel. Then "real prints sent" and "his face when the pose lies" run on them, plus an eye check of "See what I send".
- **F2.2, someone held in front of his chest** (a child, a friend leaning in) whom no pose or outline separates from him · why: no such local photo · would verify it: the same to-do (with their OK) or Y37's photos; until then it's a stated limit (IMPLEMENTATION.md → founder 4).
- **F2.2 on the iPhone's Neural Engine** · why: every line runs Vision on the Mac; the pose and masks the rule trusts can differ at the margin · would verify it: after `tools/phone/install.sh`, the to-do's checks pulled with `tools/phone/pull.sh` and run through the pixel checks.
- **F2.2, a whole-photo print that `locate` blurs** · why: none of the probed photos has one (every torso print was found only by the tiles), so the `locate` side of the fix (a print in `found.hide`, the fallback head box) rests on the logic line and P3 if the whole-photo pass finds it · would verify it: a real photo with a large, clear printed face (the to-do above), or a built (a) print large enough for the whole-photo pass (the line reports how many built prints `locate` itself found).
