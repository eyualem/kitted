# Running shoes at Everyday and Class (Oct 24, 2026): on paper

**The ask (founder, Oct 24):** "Soften running shoes at Everyday and Class (Shoes 6.0 instead of 5.0, so about half a point). Test it on paper first and show me the before/after."

**Why it came up:** on Oct 24 his cream striped shirt worn open over a grey hoodie, with baggy jeans and black Puma runners, scored 6.5, and the same outfit with white sneakers scored 8.0. Re-scoring that photo one change at a time showed the runners cost a full point (Shoes 5.0, the flat [SHO-3] charge since v8) and a "the hoodie peeks below the shirt" read that flipped between the two photos cost the other point. The flip is being fixed in its own session ("Same clothes, same read").

**The candidate:** [SHO-3]'s running-shoe Shoes score goes from 5.0 to **6.0 at Everyday and Class only**. Unchanged: 4.5 under a tailored jacket; nothing lifts it (no "shoes match" credit); free at the gym, at home and in an outdoor outfit; 5.0 at Going out, Date, Work, Interview and Event. In the engine it's the existing `sk2_runner` knob, passed only for those two occasions. Nothing in the app changed.

**Script:** `extraction-test/runners_paper.py` (run from a worktree with `KITTED_DATA=/Users/eyu/Desktop/files/Kitted`); output `extraction-test/results/runners/report.txt`.

## Bars, set before the run: all pass

| Bar | Result |
|---|---|
| R1 Shoes 5.0 → 6.0 only at Everyday/Class; dressier occasions, gym/home and a tailored jacket unchanged (10 runner test outfits × 9 occasions) | PASS |
| R2 nothing without running shoes moves (gold set and his checks) | PASS |
| R3 held-out gold r with the panel doesn't drop by more than 0.03 | PASS, 0.47 → 0.47 |
| R4 his 20 blind ratings: no fewer within 0.5 | PASS, 12 → 12 (none of the 20 has runners) |
| R5 the two gold runs as steady on runner photos | PASS, 7/7 → 7/7 |

## Before → after

**His saved checks** (his profile: born 2004, streetwear / minimal / workwear; each at its own occasion; 74 checks across the phone pulls): **3 move, all runners at Everyday.**

| Check | Before | After |
|---|---|---|
| Oct 24 3:21 pm: cream striped shirt open over the charcoal hoodie, baggy mid-wash jeans, black runners | 6.5 | **7.0** |
| Oct 18 2:08 am: black hoodie, light straight jeans, black runners | 6.5 | **7.0** |
| Oct 18 2:10 am: black hoodie, light relaxed jeans, black runners | 7.5 | 7.5 (Shoes 5.0 → 6.0, below the rounding) |

**Today's check once the peek read is fixed too** (same photo, the hoodie read as showing "a little"):

| | Shoes 5.0 (today) | Shoes 6.0 |
|---|---|---|
| Black runners | 7.0 | **7.5** |
| White sneakers | 8.0 | 8.0 |

So once both fixes are in, the runners cost half a point against the sneakers, the gap he asked for.

**The gold set** (225 public photos, 5-judge AI panel, "profile unknown", test profile Minimal + Smart casual, Everyday): 7 photos have running shoes.

| | Before | After |
|---|---|---|
| All photos: r with the panel | 0.56 | 0.55 |
| Held-out half: r | 0.47 | 0.47 |
| The 7 runner photos: app mean (panel 5.86) | 6.00 | 6.14 |
| The 7 runner photos: within 0.5 of the panel | 5 | 4 |
| 8+ share | 42 of 225 | 42 of 225 |

Three runner photos move up half a point: denim shorts with a camp shirt and overshirt (6.0 → 6.5, panel 4.5), a graphic tee with gym shorts (5.5 → 6.0, panel 5.0), and one more below the rounding. The panel was harsher on runners than the app before this change. That's the reason v8 set 5.0 (the panel gave runners Shoes 4.8), and the panel leans toward dressy outfits (#334), so its view of casual runners isn't the target here.

## Side effects to know before porting

- **4 conformance cases change** (SHO-3-runner, OUT-3-other and LNG-8-runners 6.5 → 7.0; SHO-9-runner-skinny keeps 5.5 with Shoes 4.5 → 5.5). Update their expected numbers and the plain-words rule [SHO-3] in `rubric/v5-styles.md`.
- **While the peek flip is still there,** today's check would read 7.0, and "Swap to your cream chunky sneakers" would also land on 7.0, so the card would show it as a "Smaller step" with no number instead of "→ 7.5". Once the peek is fixed, the swap shows again as 7.5 → 8.0.
- **The port touches** `parts_proto.py` and `@kitted/core`'s `parts.ts` (the runner branch of the Shoes part needs the occasion), which the "Same clothes, same read" session is also editing. Port after it merges, or coordinate.
