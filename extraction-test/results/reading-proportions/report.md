# Can the app see tight legs, a long top, a bulky top and shorts that don't work? (T98)

*Nov 16, 2026. Claude. **$0 spent**: no model calls. Script `extraction-test/proportions_test.py`; every number below is in `numbers.txt`; the Mac's measurements are in `measures.csv`.*

## The short answer

The founder's blind scores do punish these four things. But today's reading misses less than we thought: **two of the four are already in the stored readings, steady enough for a rule, and simply not used the way his scores use them.** One needs the new body ruler, and one still needs a 25-photo check.

| The thing | Best read | Right | Steady | Cost per check | Good enough for |
|---|---|---|---|---|---|
| **Tight or skinny legs** | today's reading, `leg_shape` | `skinny`: 8 of 17 tight pants, **never wrong** (0 of 71). `skinny` or `slim`: **all 17**, plus 16 of 30 ordinary slim pants, 1 of 75 others | `skinny` flips 1 in 9 photos where it fires; `slim` or `skinny`, 4 in 29 | $0 (already in the scoring call) | A **graded rule**: skinny costs most, slim a little. As a hard cap it's at the edge (1 flip in 9, and the flip is always skinny ↔ slim) |
| **A top that's too long** | **new: the body ruler** (code on his joints) + today's reading for "no jacket, untucked" | 8 of 8 measured long tops; false alarm on 8 of 122 others (7%); 1 long top couldn't be measured | 1 of 12 firing photos changed across 2 readings × 2 copies; the same photo always gives the same answer | $0 (on the phone; half a second on the Mac) | A **small rule** (half a point) or a tip. Not a dealbreaker: with long tops this rare, about half of all alarms are wrong |
| **A bulky top** | today's reading, upper-body `volume` 4 or 5 | 5 of 7 bulky tops; false alarm 5 of 124 | flips 8 in 49 photos where it fires (16%) | $0 | **A tip only.** His scores don't punish bulky tops: he gave them 7.75 on average (others 6.85) |
| **Shorts: fit** | today's reading, `volume` 4 or 5 (or `leg_shape wide`) | 9 of 13 wide shorts, never wrong (0 of 11) | volume flips 1 in 11 where it fires | $0 | A **rule** (wide shorts score higher: 7.5 vs 6.5) |
| **Shorts: length** | the October narrow look (not yet on his photos) | 99% on 24 gold photos in October; the Mac's shorts ruler gets only 65% | 92% (October) | ~0.22¢ | **Not verified on his photos.** About 11¢ checks it on his 25 (asked separately) |
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

## How it was tested

- **Labels (Claude's eye, Nov 16):** all 150 photos of his blind sheet, from the face-hidden copies, written and committed before any run (`extraction-test/proportions_labels.csv`, commit b3363f2a). The 13 photos with his notes were labelled with the notes already read. Long tops also used the Nov 14 labels (62 photos). One labeller; every photo profile unknown; age bands unknown, so no split by age band or look.
- **Readings:** the stored scoring reads (gold photos twice, from October; the rest once, Nov 16). Steadiness comes from the 225 gold photos read twice.
- **The ruler:** `kmeasure waist` and `kmeasure ruler --shorts` (the app's own prep, plus the harness-only rulers) on the face-hidden copies, at the default joint gate and at a lowered gate (`RULER_JOINT_MIN=0.1`; one harness line lets the waist ruler take it). Steadiness: a 1600 px, 3%-cropped copy. The same photo twice is identical (code, checked on 8).
- **Thresholds:** judged leave-one-out (each photo by a cut chosen without it), so the accuracy isn't flattered by fitting the cut to the answers.
- **Not tested:** the phone itself; his own saved checks (none in this set); dark-on-dark and same-color outfits (the ruler skips them); a second labeller.

## What the rescoring session can use now ($0)

1. **Legs:** grade by `leg_shape`: `skinny` the big charge, `slim` a smaller one. (How v16 charges `slim` today wasn't checked here.)
2. **Shorts fit:** wide or roomy shorts (bottom `volume` 4–5) score higher than regular or slim ones.
3. **Long top:** the body ruler's "top ends at or past the crotch, untucked, no jacket" as a half-point charge or a tip, once it's ported to the phone. Until then `below_crotch` (catches half, rarely wrong) is the safe stand-in.
4. **Bulk:** no rule.
5. **Shorts length:** wait for the 11¢ check on his photos (or use the October narrow look's gold result, knowing it hasn't seen his photos).

The paid round that would close the two gaps is costed in `tasks/T98/COST.md` (about 56¢, waiting on his OK).
