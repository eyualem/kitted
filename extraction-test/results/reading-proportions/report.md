# Can the app see tight legs, a long top, a bulky top and shorts that don't work? (T98)

*Nov 16, 2026. Claude. The $0 round: script `extraction-test/proportions_test.py`, numbers in `numbers.txt`, the Mac's measurements in `measures.csv`. The paid round (**$0.4137**, 252 calls, run by the coordinating session under the founder's yes): script `extraction-test/proportions_looks.py`, answers in `results/proportions-looks1/` (`raw.json`, `report.txt`).*

## The short answer

The founder's blind scores do punish these four things. But today's reading misses less than we thought: **two of the four are already in the stored readings, steady enough for a rule, and simply not used the way his scores use them.** The long top needs the new body ruler (a new AI question failed again). Shorts length passes with the October narrow look, now checked on his own photos.

| The thing | Best read | Right | Steady | Cost per check | Good enough for |
|---|---|---|---|---|---|
| **Tight or skinny legs** | today's reading, `leg_shape` | `skinny`: 8 of 17 tight pants, **never wrong** (0 of 71). `skinny` or `slim`: **all 17**, plus 16 of 30 ordinary slim pants, 1 of 75 others | `skinny` flips 1 in 9 photos where it fires; `slim` or `skinny`, 4 in 29 | $0 (already in the scoring call) | A **graded rule**: skinny costs most, slim a little. As a hard cap it's at the edge (1 flip in 9, and the flip is always skinny ↔ slim) |
| **A top that's too long** | **new: the body ruler** (code on his joints) + today's reading for "no jacket, untucked" | 8 of 8 measured long tops; false alarm on 8 of 122 others (7%); 1 long top couldn't be measured | 1 of 12 firing photos changed across 2 readings × 2 copies; the same photo always gives the same answer | $0 (on the phone; half a second on the Mac) | A **small rule** (half a point) or a tip. Not a dealbreaker: with long tops this rare, about half of all alarms are wrong |
| **A bulky top** | today's reading, upper-body `volume` 4 or 5 | 5 of 7 bulky tops; false alarm 5 of 124 | flips 8 in 49 photos where it fires (16%) | $0 | **A tip only.** His scores don't punish bulky tops: he gave them 7.75 on average (others 6.85) |
| **Shorts: fit** | today's reading, `volume` 4 or 5 (or `leg_shape wide`) | 9 of 13 wide shorts, never wrong (0 of 11) | volume flips 1 in 11 where it fires | $0 | A **rule** (wide shorts score higher: 7.5 vs 6.5) |
| **Shorts: length** | the October narrow look (`prompt_shorts1.txt`) on the lower close-up | **43 of 48 answers right (90%)** on his 24 shorts; every above-the-knee pair right; the 5 misses are knee-length shorts read as above (3) or below (2). The Mac's shorts ruler gets only 65% | **23 of 24** photos the same on both runs; when it says "above the knee", 1 flip in 11 | 0.16¢ (measured) | **Passes. A rule:** a shorts-above-the-knee charge (his scores: 6.2 above, 7.0 at, 7.8 below). Not a cap: its errors sit on knee-length shorts |
| **Shorts: the top over them** | the long-top read above | (as above) | (as above) | $0 | Same as the long top |

## What his scores say (the 150 blind ratings, mean 6.95)

- **Legs:** by the reading's leg shape, skinny 5.4, slim 6.2, straight 6.8, wide 8.3. The leg shape alone tracks his score at a rank correlation of **0.69** (120 photos); part of that is style (wide trousers come with more fashion-forward outfits), not fit alone. His own notes: "he is wearing tights for jeans" (read `skinny`), "the pants are too tight and high on the ankle" (read `slim`).
- **Top length:** a top read `mid_fly` averages 6.3, `at_belt` 7.3, `below_crotch` 6.1.
- **Bulk:** tops Claude labelled bulky average **7.75**, higher than the rest. His two "too bulky" notes are about specific outfits (a hoodie with wide jeans and slides; a boxy shirt over long cargo shorts, which he still gave 7.5).
- **Shorts:** above the knee 6.2, at the knee 7.0, below the knee 7.8; wide 7.5 against regular 6.6; a long top hanging over shorts 5.8 against 7.5.

## Each read in detail

### 1. Tight or skinny legs

- **Today's reading is the read.** It never calls a not-narrow pant skinny or slim except once (1 of 75). It splits "narrow" into `skinny` (the clearest tights, all 8 right) and `slim` (9 tight pants and 16 ordinary slim ones mixed together).
- **The body ruler** (leg width just above the ankle, in cm on a ruler from his joints) separates tight from not-narrow well *when it measures* (right 87–90%, leave-one-out) but:
  - measures only 40–46 of 88 photos on face-hidden copies;
  - can't split tights from ordinary slim (the widths overlap almost fully);
  - tracks his scores much less (0.30 against the reading's 0.69);
  - and a width in cm includes the leg under the fabric, so it would read a thinner person in straight jeans as "tight". **Don't use it.** (#269 already said ratios, not cm; the ratio measured even fewer photos.)
- **His line isn't "tights vs slim".** Inside the reading's `slim`, he scored the ordinary slim pants as low as the tights (several at 5.5–6.0). So the rule should grade by the reading's leg shape, not hunt for a separate "tights" read.

### 2. A top that's too long

- **Today's `below_crotch`** catches 4 of 9 clear long tops (the Nov 14 result again) and false-alarms 3%. `mid_fly or lower` catches all 9 but false-alarms 22% and flips 25% of the time when it fires. Neither works alone.
- **The body ruler** places where the top's color ends against a ruler built from his shoulders and knees (the crotch sits at 0.619 of the way from shoulders to knees on an average man, ANSUR II). With today's reading saying no jacket and not tucked, **a top ending 0.62 of the way down or further** caught 8 of 8 measured long tops, 4 of 12 borderline ones, and false-alarmed on 8 of 122 others. Adding "the reading says mid_fly or lower" changes almost nothing (8 vs 10 false alarms), so the ruler does the work.
- **Where it fails:** the ruler finds the hem by a color step, so a top and pants of the same color ("top and pants look the same", 27 of 144) can't be measured; on face-hidden copies the head block also lowers Apple's joint confidence (the "shoulders" failures). On the phone the joints come from the original photo before faces are hidden, so it should measure more often there. **Not verified on a phone.**
- **Why a small rule only:** there were 9 clear long tops in about 180 photos. At a 7% false-alarm rate, the ruler fires on roughly as many fine outfits as long ones.

### 3. A bulky top

- The reading's upper-body volume (4 or 5) finds 5 of 7 bulky tops with few false alarms, but flips 16% of the time it fires.
- The ruler's widths (shoulders, the top at its hem) carry **no signal** (0.51–0.61, where 0.5 is a coin flip), and any cm width of a top includes the torso under it. Not usable, and not something to measure.
- His scores don't punish bulk in general, so there's no case for a bulk rule. Keep it as a tip at most.

### 4. Shorts

- **Named as shorts:** 24 of 24, never confused with pants.
- **Fit:** the reading's bottom `volume` 4–5 marks wide shorts, 9 of 13, never wrong, and is steadier than `leg_shape wide` (1 flip in 11 vs 2 in 12).
- **Length:** today's scoring call doesn't read it, and the Mac's shorts ruler fails (65% right, unsure 5 of 25, flips 3 in 20 on a resized copy). The October narrow look (`prompt_shorts1.txt`) is the candidate; it has never seen his photos.
- **The top over them:** every shorts outfit he called off had a top hanging to the crotch, so this is the long-top read, not a new one.

## The paid round (Nov 16, $0.4137 of the 70¢ stop)

Bars written before any call (`tasks/T98/COST.md`). 252 calls, no errors: 5 pilot and 247 more, 2 runs each; about 0.164¢ a call (157 thinking tokens on average, billed with thinking off).

- **Shorts length passes.** Above the knee vs at or below: 43 of 48 answers right (bar 90%); 23 of 24 photos steady (bar 90%); never "can't see". All 16 answers on above-the-knee shorts are right; the misses are all knee-length shorts (C079, C131 read above both times; C114 once; C026, C103 read below, which doesn't change the two-way call).
- **The long-top presence question fails every bar**, on a hip-to-knee crop the code cut from his joints: clear long tops caught 5 of 12 (bar 7 of 9), false yes 5 of 72 (7%, bar under 5%), and 4 of the 12 photos where it fires flip between runs (33%, bar 10%). Obvious long tees (pin-038, pin-070, pin-071, stock-s02, C042, C097) still read "pants show" both times. That is the #199 and #465 lesson a third time: asking the model where a hem ends fails, in any wording and on any crop. **The long top stays with the body ruler.**

## How it was tested

- **Labels (Claude's eye, Nov 16):** all 150 photos of his blind sheet, from the face-hidden copies, written and committed before any run (`extraction-test/proportions_labels.csv`, commit b3363f2a). The 13 photos with his notes were labelled with the notes already read. Long tops also used the Nov 14 labels (62 photos). One labeller; every photo profile unknown; age bands unknown, so no split by age band or look.
- **Readings:** the stored scoring reads (gold photos twice, from October; the rest once, Nov 16). Steadiness comes from the 225 gold photos read twice.
- **The ruler:** `kmeasure waist` and `kmeasure ruler --shorts` (the app's own prep, plus the harness-only rulers) on the face-hidden copies, at the default joint gate and at a lowered gate (`RULER_JOINT_MIN=0.1`; one harness line lets the waist ruler take it). Steadiness: a 1600 px, 3%-cropped copy. The same photo twice is identical (code, checked on 8).
- **Thresholds:** judged leave-one-out (each photo by a cut chosen without it), so the accuracy isn't flattered by fitting the cut to the answers.
- **Not tested:** the phone itself; his own saved checks (none in this set); dark-on-dark and same-color outfits (the ruler skips them); a second labeller.

## What the rescoring session can use now

1. **Legs:** grade by `leg_shape`: `skinny` the big charge, `slim` a smaller one. (How v16 charges `slim` today wasn't checked here.)
2. **Shorts fit:** wide or roomy shorts (bottom `volume` 4–5) score higher than regular or slim ones.
3. **Long top:** the body ruler's "top ends at or past the crotch, untucked, no jacket" as a half-point charge or a tip, once it's ported to the phone. Until then `below_crotch` (catches half, rarely wrong) is the safe stand-in.
4. **Bulk:** no rule.
5. **Shorts length:** the October narrow look (a second-look call on the lower close-up, ~0.16¢, only when the reading names shorts) can back an above-the-knee charge. It's not in the app yet: `secondLook.ts` has no shorts question.
6. **The top over shorts:** the long-top read (the body ruler), nothing new.

## Round 3: the phone's own cutout as the shape (Nov 17, $0)

*The founder: "Can't an iPhone make cutouts of people?... If we take that cutout and then use that as the shape, what do you think about that?" Script `extraction-test/outline_test.py`, harness `vision/OutlineProbe.swift` (`kmeasure outline`), numbers in `outline.txt` and `outline.csv`.*

**The short answer: it doesn't replace the reading's leg shape.** The cutout's leg taper agrees with the reading and with Claude's eye, but it measures fewer than half the photos, tracks his scores less well, flips too often to back a rule on its own, and leaks body size on exactly the pants a rule would charge. Top-against-legs, the waist break and the shorts hem carry no usable signal.

**What was measured.** Apple's person segmentation (the cutout iOS makes), with Apple's body joints, on the face-hidden copy of every photo he rated blind (150 + his first 20). Widths across each leg at fixed shares of the bone, and across the torso, divided into **ratios only, never cm**: ankle against thigh, ankle against knee, knee against thigh, the torso against both thighs, where the torso outline steps in or out (the waist break), and the shorts hem as a step in the leg outline. Steadiness on two reframed copies: 1600 px with 3% cropped off, and a 4% off-center shift.

| Measure | Measures | Agrees with | Tracks his scores | Steady | Body size | Verdict |
|---|---|---|---|---|---|---|
| **Leg taper** (ankle ÷ thigh) | 63 of 141 pants photos | the reading's leg shape, rank 0.60; narrow vs the rest 76% (leave-one-out); Claude's tight vs not-narrow 84% | 0.46 (the reading, same photos: 0.57; all photos: 0.69) | the narrow call flips 8–12% overall, **20–29% where it fires** | **leaks**: in skinny and slim pants it follows the leg's own girth (−0.54) and the build (−0.39) | **not a replacement**; at most a check |
| Ankle ÷ knee, knee ÷ thigh | 63 | weaker (0.45, 0.55) | 0.26, 0.53 | similar | leak −0.38 to −0.48 in narrow pants | no |
| **Top against legs** | 51 of 170 | nothing (bulky-labelled tops didn't stand out) | **0.01** | 90th-percentile change 0.15–0.30 | − | no |
| **Waist break** (where the torso outline steps) | 86 of 101 with a torso profile | the step sits anywhere from the ribs to below the hips (mostly where the arms and hands meet the body); 1 long top measured | − | − | − | no |
| **Shorts hem** (a step in the leg outline) | 11 of 25 | 9 of 11 right on above vs at-or-below | − | − | − | no; the narrow look gets 43 of 48 on all 24 |

- **Why so few photos:** in the cutout, legs that touch, cross or walk merge into one shape, so neither leg's width can be read (48 skips). Another 19 had no knee or ankle joints, and the prep found no person in 9 face-hidden copies. Wide trousers touch most often, so the measured set leans toward narrow pants.
- **Why it leaks:** a cutout includes the body under the clothes. In pants that hug the leg, the outline *is* the leg, so the ratio follows the person's own leg shape: a fuller thigh reads as more tapered. That's the case where a rule would charge points, so a rule built on it would mark down bodies, not trousers. In straight and wide pants the fabric hides the leg and the leak mostly disappears (+0.10 and −0.35 against build, small samples).
- **What it adds:** inside the reading's own `straight`, the taper tracks his score at 0.35 (25 photos); inside `slim`, 0.17. A small hint that a cutout could split the reading's middle class, not enough for a rule.
- **Phone vs Mac (not verified):** the phone makes the cutout from the original photo before faces are hidden, with full-confidence joints, so the 9 prep failures and some missing joints would likely go away. Touching legs and the body-size leak wouldn't: they come from what a cutout is, not from the face block.
- **Recommendation:** keep the reading's `leg_shape` for the leg rules and the silhouette lift. The cutout can't back a rule; it could only ever be a tip-level cross-check on straight pants, and that isn't worth building.
