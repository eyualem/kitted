# The two-shot check: a fit check without a full-length mirror (Oct 16, #313)

**Founder, Oct 16:** "not everybody has a full-size body mirror … some people only have a mirror inside their
bathroom." When the mirror shows only his top half, the camera should notice, then walk him through a second
photo of his pants and shoes by pointing the phone down, all inside the camera, before anything is scored.

**Status (Oct 16):** planned, checks set first (§6), free tests T1–T3 run (§8): the camera can tell when the
shoes are missing (0 false asks on 36 of his real photos, every cut copy caught), today's guide tells a
short-mirror shot to "Step back" on nearly every try, and a top-only card's "Finish the check" can't change
the score (a bug). Nothing in the app has changed yet. Next: step 0, then his shoot (§9) for T4–T5.

---

## 1. What he'll see (the target)

1. **Mirror mode, bathroom mirror.** Today the tip says "Step back a little. Shoes in frame if you can." and he
   can't. New: "Short mirror? Take your top half. I'll get the rest next." He shoots as usual.
2. **The camera notices his shoes are missing** (the quick check after the shot, about 0.2 s; photos taken in
   the Kitted camera only, T1). It doesn't score
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
2. **Founder, Oct 16 (agreed): the down shot's own facts count.** Whether the pants are baggy, slim or wide,
   how they meet the shoes, and the shoes themselves are read from the down shot and scored like any check;
   only measurements that need both photos (height, where things sit on the body) are dropped. T4 confirms each
   fact against the full-body truth; shoes and how loose the pants are look the most readable from above.
   **Priority lowered (founder: "I completely forgot about prop mode … we shouldn't focus too much on this"):**
   step 0 stays worth doing; steps 1–3 and the shoot wait until after the beta or the interviews show the need.
3. **Don't stitch the two photos or measure across them.** The mirror shot is straight on; the down shot looks
   from above, so the legs are foreshortened (thighs big, shoes small) and no height or proportion can be
   carried from one photo to the other. The app doesn't measure the body for scoring anyway (the waist and hem
   rulers weren't adopted, #264, #269, #273). Instead each fact comes from the photo that shows it, and the
   reading test (T4) decides which facts the down shot is trusted for. **The real risk is Proportions:** leg
   shape, the tuck and where the top ends move a shown score on 8–14 of 79 photos when read one step off
   (#222). If the down shot can't read leg shape, two-shot checks can't earn or lose those points.
4. **Propped mode already needs no mirror.** The camera should offer it as the other way out, every time. But
   it needs floor space and something to lean the phone on, and many guys won't do it with roommates around,
   so the two-shot is worth building.
5. **The 40% is a guess.** Add one question to the 10 interviews already on your list: "Where do you check your
   outfit? Does that mirror show your shoes?" Not blocking: the step-0 fixes are worth doing anyway.
6. **Two readings, merged by code (not one call with both photos), recommended,** because the top half can be
   read while he takes the down shot: the wait after the second photo is about the same as today. T4 compares
   both ways before it's built.
7. **One check counts, not two,** and a two-shot check is never charged when he bails out halfway.

## 4. Copy (draft, outward-facing: for the founder's skim; built with these words)

| Where | Words |
|---|---|
| Live tip, Mirror, no hips or feet | Step 0 (built): "Can't step back? Prop your phone up instead." + "Use Propped" Once step 1 is built: "Short mirror? Take your top half. I'll get the rest next." |
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

**T4 · Reading from two photos (needs the founder's shoot, ~20 min, and ≤ $1.50 of Gemini; his OK).**
8 outfits (shot list in §9). For each: one full-body propped photo (the truth reading), one bathroom-mirror top
half, one down shot at 1× and one at 0.5×. Score the two-shot (two readings merged, and one call with both
photos) against the truth reading. (Set Oct 16 before any run: 8 outfits, not 10, so it fits one session.)
- **P4a** shown score within 0.5 of the full-body truth on **≥ 7 of 8** outfits, **none off by 1.5 or more**.
- **P4b** pants and shoes found on **8 of 8**; the top never doubled (it shows in both photos).
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

### T1 · Does the camera know the shoes are missing? Run Oct 16 (free). Passes on the app's own photos.
Harness: `kmeasure cutoff` (the app's own `Prep.locate`, with "Which one is you?" resolved to the biggest person
as he'd usually pick), `extraction-test/twoshot_cutoff.py`, results `extraction-test/results/twoshot1/`.
The rule tested is the one the installed app already computes: **ask for the down shot when the quick check
finds no ankle** (`pose` is not `full`).

| | His and his friends' camera photos (37) | Public gold screenshots (225; test half) |
|---|---|---|
| P1a full body with shoes, asked anyway (≤ 3%) | **0 of 36** | 4 of 106 = 3.8% (both halves 13 of 210 = 6.2%) |
| P1b cut copies, asked (≥ 95%) | **252 of 252** | 689 of 693 = 99.4% |
| A real cut-off, asked | **1 of 1** (703a8b: a bathroom mirror cut at the thighs) | 9 of 12 the AI read as shoes out |
| P1c cut copies that can still be sent | **252 of 252** | 98% at chest and navel (3 small figures not found), 100% below |

- **Why the public set misses the bar:** the 13 false asks are tight Instagram and Pinterest crops where Apple's
  body tracker loses the legs (5 even lose the hips); the feet sit at the very bottom edge, so "does he run off
  the bottom" can't separate them either (tried, `mainBottom`). Two-ankle rules are worse (18–20%).
- **Decision:** the in-camera second shot runs **only for photos taken in the Kitted camera** (passes every bar).
  A library photo or screenshot keeps today's path: scored as one photo, and when the AI reads it as top only or
  shoes out, the card's finish row offers the right snap (after step 0).
- **What it misses fails safe:** a cut just above the ankle where an ankle is still found (7 of 184) scores as
  today's "Partial check: shoes not included", with the shoe snap on the card.

### T2 · What today's live guide says on short-mirror shots. Run Oct 16. Confirms the problem.
| Cut at | His photos told "Step back" | Gold photos told "Step back" |
|---|---|---|
| chest | 36 of 36 | 93% |
| navel | 32 of 36 | 97% |
| hip | 13 of 36 | 95% |
| mid-thigh and lower | 0 | 52% → 5% |

A guy at a bathroom mirror is told to step back on nearly every shot, which he can't do.

### T3 · The top-only finish. Run Oct 16: the bug is real.
`app/packages/kitted-core/test/twoShot.test.ts` (3 pass): a top-only reading plus a shoe snap stays "Partial
check: top only" with the same score; a bottom snap (`mergeBottomSnap`) makes it a full check scored exactly as
the full photo. In the app, `finalizeSnap` always uses the shoe snap, so a top-only card's "Finish the check"
does nothing to the score today. Fixed by step 0.

### T4–T7: waiting on the founder (§9 shot list, the spend OK, the interview question).

## 9. The founder's shoot for T4 and T5 (~20 min, `inputs/two-shot/`)

8 outfits you'd really wear (mix: a tee over wide jeans, a tucked shirt with chinos, a hoodie with slim jeans,
a jacket with boots, a dark-on-dark one, shorts, one with a long top, one with cuffed pants). For each outfit,
4 photos, named `o1-full.jpg`, `o1-mirror.jpg`, `o1-down1x.jpg`, `o1-down05x.jpg`:
1. **full:** the phone propped on the floor 2–3 m away, the whole body with shoes (the truth).
2. **mirror:** in the bathroom mirror, as you'd shoot it there (top half).
3. **down1x:** the phone at chest height, looking down at your feet, waistband at the top and both shoes in.
4. **down05x:** the same at 0.5× (the wide lens).

Plus 10 down shots **without** both shoes (just the floor, one shoe, a bed, the shoes cut off), named
`noshoes-1.jpg` … for T5. Rule 7: write who's in each photo in `inputs/two-shot/who.txt` (you, or a friend's
code with birth year and 3 picked looks if they OK it).

## 10. Step 0: what it does and its checks (set Oct 16 before building; founder: "finish these things up")

Step 0 makes the **post-score** path work for a short mirror: a top-only card offers a photo of the pants and
shoes, and that photo finishes the check. The spec already describes this (02 S9 "Top-only partial", D11 "Top
only" row); it was never built. Two bugs found while planning it are fixed too.

**Bugs found (on the way):**
- **B1 (T3):** a top-only card's Finish the check offers the shoe snap, which can't change the score or label.
- **B2:** every snap goes through the full-body photo prep, which refuses a photo with no person found ("can't find
  you"). On the bottom quarter of his 37 photos (a close shoe snap seen from the front) today's prep refuses 14 of
  37; the clothes-scan prep accepts all 37 (`kmeasure snapprep`, `results/twoshot1/snapprep-phone.jsonl`). So a real
  shoe snap of just the shoes has likely never worked on the phone.

**Copy (new, for the founder's skim; outward-facing, built with these words):**
- Bottom-snap camera tip: "Point your phone down at your pants and shoes." (shortened from "…at your feet. Get your pants and shoes in.", which was cut off in the 2-line pill at 375 pt; differs from 02 S9's
  "Step back so your pants and shoes are in frame." because a rear camera pointed at himself can't step back; the
  look-down shot is the founder's idea, #313). Guide over the lower 60%: "Pants and shoes here". Shutter
  VoiceOver: "Take a photo of your pants and shoes". Bubble caption: "Pants and shoes". Failure toast: "Couldn't
  read your pants and shoes. Try again." Finish tile VoiceOver: "Snap your pants and shoes".
- Mirror mode, no hips found: "Can't step back? Prop your phone up instead." (shortened: the longer line was cut off in the pill beside the timer) with a "Use Propped"
  button (Propped keeps "Step back a little. Shoes in frame if you can.").

**Checks (pass/fail):**
- **S0.1** A top-only card's Finish row: "Snap your bottom half to finish.", the camera tile and Skip only (no
  closet pair, no "Same shoes as …"); its VoiceOver actions are "Snap your pants and shoes" and Skip.
- **S0.2** That tile opens the bottom snap: the tip, the 60% guide and the shutter label above; a shoes-only card
  still opens today's shoe snap (40%, "Shoes and hems here"), unchanged.
- **S0.3** A snap on a top-only check is read as a bottom snap and merged with `mergeBottomSnap`: the card says
  "Full check", the score equals scoring the merged reading, no check or re-check is used.
- **S0.4** A snap on a shoes-only check is unchanged (`mergeShoeSnap`; demo screen 11's story and every existing
  test pass).
- **S0.5** The bottom snap's pants and shoes join the closet, linked to the check (a shoe snap: footwear only).
- **S0.6** A failed bottom snap shows "Couldn't read your pants and shoes. Try again." and the Finish row stays.
- **S0.7** Snap prep (native; on the phone with the next reinstall): a snap with no person found is prepared and
  sent, faces still hidden; on the Mac, the bottom-25% crops of his 37 photos prepare 37 of 37 (today 23); a snap
  that does show a face still has it hidden; the upload is 1024 px like a check. A build without it falls back to
  today's prep (no crash, today's behavior).
- **S0.8** Mirror, no hips: the short-mirror tip and "Use Propped", which switches to Propped; Propped, no hips:
  today's "Step back" tip. Unit-tested in `guidance`.
- **S0.9** The quick check after a bottom snap checks only light and blur (like the shoe snap).
- **S0.10** `npm run check` green; the core and app tests above; the card and camera seen on the web preview in
  light and dark (and on the Simulator if the Mac has the memory; otherwise said so).

## 11. Step 0 results (built Oct 16, every check passes)

| Check | Result |
|---|---|
| S0.1 finish row | Pass. Top only: "Snap your bottom half to finish.", the camera tile and Skip only (no "Same shoes as …", no closet pick); VoiceOver "Snap your pants and shoes". `app/src/features/fitcheck/finish.ts`, tests `app/src/__tests__/twoShot.test.ts`. Seen on demo screen 185. |
| S0.2 camera | Pass. The tile opens `/camera?mode=shoeSnap&…&part=bottom`: "Point your phone down at your pants and shoes.", the guide over the lower 60% "Pants and shoes here" (demo 187, light and dark). Shoes-only cards still open the 40% shoe snap (demo 11 unchanged). |
| S0.3 merge | Pass. Read as a bottom snap, merged with `mergeBottomSnap`: "Full check", score = the merged reading's (p01t + its snap = 7.5, the same as the full p01b photo; demo 186); no check, no re-check used. |
| S0.4 shoe snap | Pass. Unchanged (s24 tests, demo 11). |
| S0.5 closet | Pass. The snap's pants and shoes join the closet, linked to the check (a shoe snap: footwear only); demo 186 asks "Are these your khaki chinos?". |
| S0.6 failure | Pass. "Couldn't read your pants and shoes. Try again." / "Couldn't read your shoes. Try again or pick a pair." (the shoe line was in the deck but never shown: **bug B3**, a failed snap said nothing). |
| S0.7 snap prep | Pass on the Mac (`kmeasure snapprep`, the app's own `KittedPrep.swift`): the bottom 25% of his 37 photos prepares 37 of 37 (the old prep 23), nothing hidden on legs and shoes; whole photos through the snap prep hide exactly what a fit photo hides (0 of 32 hide less; the outline head check runs whenever his shoulders are in view). Native: on his phone with the next reinstall; until then the old prep runs. `KittedVisionModule.swift`'s new `prepareSnap` and `KittedPrep`'s `.snap` kind compile in Xcode (a fresh `expo run:ios` build for the Simulator, Oct 16, no warnings in either file). |
| S0.8 Mirror tip | Pass. Mirror, no hips: "Can't step back? Prop your phone up instead." + "Use Propped", which switches to Propped (then "Step back a little…", the button goes) (demo 188); Propped unchanged. |
| S0.9 quick check | Pass (unchanged: snaps are checked for light and blur only). |
| S0.10 checks | Pass. `npm run check` parts: app typecheck, core typecheck, lint 0 problems, core 758 tests, app 1,091 tests (3 skipped). Web preview, light and dark; the iOS Simulator below (§11.1). |

### 11.1 Seen on the iOS Simulator (Oct 16, a new dev build; screenshots `screenshots/short-mirror/`, git-ignored)

Demo screens 185–188 in light, dark and the largest text size (AX5), plus demo 11 (the shoes-only card) as a control.

| Screen | Light / dark | AX5 |
|---|---|---|
| 185 top only | Pass: "Partial check: top only", "Snap your bottom half to finish.", the camera tile and Skip only | Pass: rows stack, the tile keeps 44 pt |
| 186 finished | "FIT CHECK · FULL", 7.5, "Full check", "Are these your khaki chinos?". **Bug: the bubble's caption read "Pants and…"** (109 pt beside the time). **Fixed:** it wraps to 2 lines ("Pants and / shoes"), like the reading caption | Pass: the caption already goes under the bubble there ("Pants and shoes · 8:12") |
| 187 snap camera | Pass: the tip in 2 lines, the 60% box; the label "Pants and shoes here" now sits on a dark tag (white text alone vanished over a white shirt) | **Bug: the label ran wider than the box and under the 5-line tip pill. Fixed:** capped at 2× (`CONTROL_TEXT_MAX_SCALE`), 2 lines at most, and never above the tip bar's measured bottom (`guideLayout.ts`, tests in `twoShot.test.ts`) |
| 188 short mirror | Pass: "Can't step back? Prop your phone up instead." + "Use Propped"; **tapping it (0.15 s) switches to Propped** and the tip becomes "Step back a little. Shoes in frame if you can." | **Bug: "Use Propped" sat on top of the tip pill** (a fixed 52 pt below the top). **Fixed:** the offer pills (Use Propped and Turn on flash) sit 8 pt under the top bar's measured height |
| 11 shoes-only (control) | Unchanged: "Same shoes as Monday?", the closet pair, the camera tile, Skip | — |

`npm run check` green after the fixes. On his phone through Metro (JS only); `prepareSnap` with the next reinstall.

**Also fixed on the way:** a top-only card's summary said "Your score may change once I see your shoes." (now
"…your pants and shoes."); the chat context test still expected "FC3 · Oct 20" after #311 added the weekday.
