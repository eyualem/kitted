# The two-shot check: a fit check without a full-length mirror (Oct 16, #313)

**Founder, Oct 16:** "not everybody has a full-size body mirror … some people only have a mirror inside their
bathroom." When the mirror shows only his top half, the camera should notice, then walk him through a second
photo of his pants and shoes by pointing the phone down, all inside the camera, before anything is scored.

**Status:** planned, checks set first (§6), free tests run (§8). Nothing in the app has changed yet.

---

## 1. What he'll see (the target)

1. **Mirror mode, bathroom mirror.** Today the tip says "Step back a little. Shoes in frame if you can." and he
   can't. New: "Short mirror? Take your top half. I'll get the rest next." He shoots as usual.
2. **The camera notices his shoes are missing** (the quick check after the shot, about 0.2 s). It doesn't score
   yet. His top-half photo shrinks to a corner thumbnail with a check mark, and the camera says:
   **"Now your pants and shoes. Point the phone down at your feet."**
3. **The down shot.** He holds the phone at chest height and looks down through it, like a shoe pic. The tip
   follows the phone's tilt and what it sees: "Tilt down more" · "Both shoes in" · "Hold still". When it's good
   for half a second it takes the photo itself (a light tap buzz), no countdown needed.
4. **One reading, one score.** The card is a normal full check: no "Partial check" label. The card's photo is
   his top half; swipe for the second photo. The Why sheet says "From two photos: your top in the mirror, your
   pants and shoes from above." Anything the down shot can't show reliably costs nothing and earns nothing
   (the rule we already have: what isn't seen never costs points), and the Why sheet says which.
5. **Ways out, always:** "Score the top only" (today's partial check) and "Prop your phone instead" (one full
   photo, the Propped mode). One fit check is used, never two.
6. **Re-check:** his first fix decides which half he retakes (a pants or shoes fix → the down shot only; a top
   fix → the mirror shot only); the other half keeps its first reading, so the score only moves for what he
   changed.

## 2. What exists today (Oct 16)

- **The live guide** (`KittedCameraView.swift`): shoulders but no hips → `tooClose` → "Step back a little".
  A waist-up bathroom shot gets told to step back, which he can't.
- **The quick check after the shot** already reports `pose`: `full` (an ankle found), `upper` (a hip, no
  ankle), `none` (`KittedPrep.swift` `locate`, in the installed build). Nothing uses it yet.
- **Partial checks:** the AI's framing `upper_only` → "Partial check: top only"; `shoes_visible: false` →
  "Partial check: shoes not included". The card's "Finish the check" row offers a shoe snap or a closet pick.
- **The shoe snap** (`/camera?mode=shoeSnap`) reads a second photo and merges with `mergeShoeSnap`.
- **`mergeBottomSnap`** (replace pants and shoes, framing becomes full body) is in the scoring core, ported and
  tested, but **nothing calls it**, and the copy "Snap your bottom half to finish." is in the copy deck, unused.
- **A bug found while planning (T3):** a top-only check's finish row still offers the shoe snap, and the shoe
  snap's merge leaves the framing at `upper_only`, so the scorer drops the new shoes again. He snaps his shoes,
  the card says "snapped", and the score and the "top only" label don't change.

## 3. Pushback and the calls Claude made (founder can overrule)

1. **Agree with the feature.** A guided second shot inside the camera, before the score, is better than today's
   "finish it on the card after a partial score" (he sees one honest number instead of a partial one that
   changes).
2. **Don't stitch the two photos or measure across them.** The mirror shot is straight on; the down shot looks
   from above, so the legs are foreshortened (thighs big, shoes small) and no height or proportion can be
   carried from one photo to the other. The app doesn't measure the body for scoring anyway (the waist and hem
   rulers weren't adopted, #264, #269, #273). Instead each fact comes from the photo that shows it, and the
   reading test (T4) decides which facts the down shot is trusted for. **The real risk is Proportions:** leg
   shape, the tuck and where the top ends move a shown score on 8–14 of 79 photos when read one step off
   (#222). If the down shot can't read leg shape, two-shot checks can't earn or lose those points.
3. **Propped mode already needs no mirror.** The camera should offer it as the other way out, every time. But
   it needs floor space and something to lean the phone on, and many guys won't do it with roommates around,
   so the two-shot is worth building.
4. **The 40% is a guess.** Add one question to the 10 interviews already on your list: "Where do you check your
   outfit? Does that mirror show your shoes?" Not blocking: the step-0 fixes are worth doing anyway.
5. **Two readings, merged by code (not one call with both photos), recommended,** because the top half can be
   read while he takes the down shot: the wait after the second photo is about the same as today. T4 compares
   both ways before it's built.
6. **One check counts, not two,** and a two-shot check is never charged when he bails out halfway.

## 4. Copy (draft, outward-facing: for the founder's skim; built with these words)

| Where | Words |
|---|---|
| Live tip, Mirror, no hips or feet | "Short mirror? Take your top half. I'll get the rest next." |
| After the top shot | "Now your pants and shoes." · "Point the phone down at your feet." |
| Down-shot tips | "Tilt down more" · "Both shoes in" · "Hold still" · "Too dark. Turn on the light." |
| Down-shot quick check fails | "I can't see your shoes. Try again with both feet in the frame." |
| Ways out | "Score the top only" · "Prop your phone instead" · "Retake the top" |
| Why sheet | "From two photos: your top in the mirror, your pants and shoes from above." |
| Why sheet, a fact not trusted from above | "Leg shape isn't scored from above." (only if T4 says so) |
| Card finish row, top-only check (step 0) | "Snap your bottom half to finish." (already in the deck) |

## 5. Build steps (each after its checks pass)

- **Step 0 (JS only, through Metro, no reinstall):** fix the top-only finish (bottom snap, `mergeBottomSnap`,
  "Snap your bottom half to finish."); in Mirror mode, replace "Step back" with the short-mirror tip.
- **Step 1 (JS only):** the in-camera second shot, using the quick check's `pose` (T1's rule) and a plain
  shutter with a dashed leg-and-shoe outline; the reading merged by code; one check counted.
- **Step 2 (native, a reinstall):** the tilt guide from the phone's motion sensor (CoreMotion, part of iOS, no
  new package) and the live "both shoes in" detector T5 picks; auto-capture.
- **Step 3:** the trust rules from T4 (which facts the down shot sets), the Why line, the re-check by half, the
  second photo on the look page and the piece page, and a second photo path in the sync schema (`11` §photos).

## 6. The tests, set before building (pass bars)

**T1 · Does the camera know the shoes are missing? (Mac, free, now)**
Cut-off copies of real full-body photos at set heights (chest, navel, hip, mid-thigh, knee, mid-shin, just above
the ankle) plus the uncut photo, run through the app's own Swift (`Prep.locate`), held-out half for testing.
- **P1a** uncut full-body photos asked for a second shot: **≤ 3%** (a false ask annoys most users).
- **P1b** cut above the ankles and asked: **≥ 95%** (a miss falls back to today's partial card, so it fails safe).
- **P1c** a cut photo the app refuses to send (no person found, or a face it can't hide): reported per height;
  it must not be worse than the uncut photo at heights of the hip and above.
- Real cut-offs: the gold photos the AI read as shoes not visible must be asked on too (reported).

**T2 · What today's live guide says on the same cut-offs (baseline, free, now).** Report the share told "Step
back" (no hips) and "Step into the frame" (no shoulders) at each height. No bar; it shows the problem.

**T3 · The top-only finish (unit test, free).** Today: confirm the bug. After step 0: a top-only check finished
by a bottom snap scores exactly as the merged reading scored as a full photo, with no partial label.

**T4 · Reading from two photos (needs the founder's shoot, ~15 min, and ≤ $0.50 of Gemini; his OK).**
10 outfits. For each: one full-body propped photo (the truth reading), one bathroom-mirror top half, one down
shot at 1× and one at 0.5×. Score the two-shot (two readings merged, and one call with both photos) against
the truth reading.
- **P4a** shown score within 0.5 of the full-body truth on **≥ 8 of 10** outfits, **none off by 1.5 or more**.
- **P4b** pants and shoes found on **10 of 10**; the top never doubled (it shows in both photos).
- **P4c** per fact against the truth: shoe type ≥ 90%, pants type ≥ 90%, colors ≥ 85%; leg shape, hem, tuck and
  top length each ≥ 75%, **else that fact isn't scored on two-shot checks** (no points either way).
- **P4d** steady: the same two photos 3 times give a shown score within 0.5 every time.
- Report the cost and the wait after the second photo for both ways (merged vs one call).

**T5 · The down-shot guide (his down shots on the Mac, then the phone).** On his ~20 down shots plus 10 with no
shoes (the floor, a bed, a half shot):
- **P5a** "both shoes in" found **≥ 90%** with both shoes in, wrongly **≤ 5%** without.
- **P5b** on the phone, the tilt tip is right on 10 of 10 tries (too flat → "Tilt down more").

**T6 · On the phone with 3 people (him + 2 friends), each twice, one with a bathroom mirror.**
- **P6a** both shots done without help **≥ 5 of 6**; median time from the first shutter to the score **≤ 25 s**.
- **P6b** no loop (asked for the down shot more than twice) on any try.

**T7 · How many guys need it (the 10 interviews, one question).** Not a pass bar: below ~15% "no mirror that
shows my shoes", step 0 plus the Propped way out may be enough; at your 40%, build steps 1–3.

## 7. Rule 7 (profiles)

T1 and T2 use the 226 gold photos (public, profile unknown; one stated test profile, Minimal + Smart casual,
everyday); age and picked looks can't change anything they measure. T4–T6 record who is in each photo and
their profile (birth year as an age band, picked looks), as the app would hold it.

## 8. Results

(filled below as the tests run)
