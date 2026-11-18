# Reading the whole outline: layers, balance and rise

Nov 17, 2026 · for the founder, before T69 (moving v16 into the app) starts · $0 spent · cloud copy: none yet

You asked whether the scoring is balanced in how it reads outfits, how the silhouette work is going, and said a coat has to count in the shape, along with what's worn inside it, the colors, where things end at the waist, and maybe rise. This is the answer, tested on your 164 blind ratings with the reads the app already has. Nothing here is in the app; v16 is still what T69 would port.

## The short version

- **One part does almost all the work, and it's the right one.** Silhouette and proportions moves the score on 70% of your photos and carries nearly all of v16's agreement with you: take it out and the match with your ratings falls from r 0.63 to 0.33. Fit, color, shoes and style each move a score on a fifth to a quarter of photos or less, and none of them tracks your taste on its own (r 0.09–0.13). Fit is nearly silent (it moves 2% of scores), because its least steady reads were muted on purpose in v16.
- **Coats and jackets are where v16 is weakest.** On the 69 photos with a layer, v16 is within a point of you 77% of the time (r 0.54); on the 95 without, 85% (r 0.69). Your instinct was right: the coat isn't in the outline today.
- **The read that would fix it is already paid for.** Look U, the upper close-up the app asks on every check, already answers where the outermost layer ends (waistband, hip, crotch, thigh, knee). The app throws that answer away today. It repeats itself 90% of the time on the three bands that matter (short, mid, long), against 75% for the main reading's own jacket length.
- **The rule, in plain words:** the outline is the outermost layer plus the legs. A jacket or open shirt that stops at the waistband over full or straight legs makes a clean break and lifts; a long coat over anything but skinny legs makes one long line and lifts; a casual layer that stops at the hip or crotch splits the outfit in half and costs, and it doesn't earn the short-layer or open-layer credits. Blazers and suit jackets are spared (the creators say a tailored jacket has no fixed length), and so is a plain untucked tee with nothing over it (they say untucked is never a fault on a casual outfit).
- **What it buys, honestly: not enough to prove.** Measured the fair way (every size refit on each random half, T68's method, the same 8 splits), the creators' version is 83.1% within a point of you and r 0.648, against v16's 82.0% and 0.631. That's better on 6 of 8 splits and worse on 2, and the ranking is better on only 5 of 8: inside the noise. Steadiness is the same as v16's.
- **Only the stricter version clearly helps, and it fails a bar.** If every top and jacket that stops at the hip pays, blazers and plain tees included, it reaches 85.7% and r 0.687, better on all 8 splits. But it breaks two creator rules (suit.6, prop.7) and drops steadiness to 215 of 223 in the app's case (bar 218). Your rule is that the creators win a clash, and the steadiness bar is yours too, so it can't ship as is.
- **The colors of the layers didn't help.** Dark inside light and a tonal stack with a light-to-dark step gave nothing on unseen photos, so they don't ship.
- **Rise isn't worth paying for yet.** Where the waistband shows, you score high-rise outfits higher, but the engine already does (they're mostly tucked outfits that earn the waist break). A rise rule at its best would fix none of the misses. The read is designed and quoted below; it waits.
- **Recommendation:** port v16 as is for T69, and keep the outline on paper behind its switch. What's real: layered outfits are v16's weak spot, and where the outer layer ends is what you react to. What isn't there yet: a version that fixes it within the creators' rules and the steadiness bar. Ranked options at the end.

## 1. The balance audit: what each part moves

Every one of your 164 rated photos was scored by approved v16, then again with one part's contribution switched off, and the two compared. This is the score you'd see, after the curve and the caps. In sample (no fitting happens here). Script `extraction-test/outline_audit.py`, full output `extraction-test/results/outline1/audit.txt`.

| Part | Changes the shown score on | Average size (either way) | Tracks your taste (r of its move with your score) | v16's r with you if it were taken out (0.63 with it) |
| --- | --- | --- | --- | --- |
| Silhouette and proportions | **70%** of photos | 0.49 | **0.62** | **0.33** |
| Style and cohesion | 27% | 0.14 | 0.12 | 0.62 |
| Shoes | 24% | 0.12 | 0.11 | 0.63 |
| Color | 21% | 0.11 | 0.13 | 0.62 |
| Look taste (the look table) | 11% | 0.07 | −0.15 | 0.65 |
| Condition | 7% | 0.03 | 0.00 | 0.63 |
| Season (warm day) | 5% | 0.04 | −0.09 | 0.62 |
| Fit | 2% | 0.01 | 0.09 | 0.63 |

What it says:
- **Shape dominates, and that's where your agreement comes from.** It's the only part whose moves line up with your ratings. That matches what you said: silhouette and proportions are the most important thing to nail.
- **Fit is nearly silent.** v16 muted its least steady reads (sleeves past the hands, a roomy piece) because they flip between two shots. Fit can only find faults today, so a well-fitting outfit gets nothing for it.
- **The other parts move scores but don't track you.** Color, shoes and style each change a score on a fifth to a quarter of photos, but those moves are close to random with respect to your taste.
- **The look table slightly hurts in sample** (r 0.65 without it). That's in sample only, so it's a flag for later, not a finding.
- **Where v16 misses you by more than a point:** 30 photos, 25 of them too high. On them, shape is what most often causes the miss (removing it fixes 7). Many are outfits with a jacket or open shirt that stops at the hip over straight or slim legs: you gave them 5.5–6, v16 gave 7.5–8.
- **Layers are the weak spot:** with a layer, 77% within a point of you (r 0.54); without, 85% (r 0.69).

## 2. Layers in the outline: the rules

The creators' rule is sil.5, "the outer layer defines silhouette" (Jaye), and prop.2, split the outfit about a third over two thirds, measured from the collar to "the lowest visible hem of the top layer". So the outline is the outermost layer plus the legs. Every rule is garment against garment: the hem of one piece against the waistband and legs of another, never the body.

| Rule | What it does | Creators | Size | Result |
| --- | --- | --- | --- | --- |
| A short outline | the outermost layer (or the top itself, tucked or cropped) ends at the waistband or above, over full or straight legs, real shoes, and no shape lift already | prop.3, prop.5, sil.2 | +0.25 | **ships** |
| A long coat | a coat ending at the thigh or knee over any leg but skinny, on a cool day | sil.5, sil.6 (Tim: "a nice coat just makes everything look better") | +0.25 | **ships** |
| The halfway layer | a casual layer ending at the hip or crotch over full legs (as the leg-width look sees them, so many straight jeans count) costs, and the short-layer and open-layer lifts don't count. Over legs even the leg look calls slim, its size fitted to 0, so it's off there | prop.2, sil.5 | −0.5 | **ships** |
| Spared: tailored jackets | a blazer, sport coat or suit jacket ending at the seat pays nothing | suit.6 (no fixed jacket length) | | **ships** |
| Spared: a plain top | an untucked tee with nothing over it never pays the halfway charge | prop.7 (untucked is never a fault on a casual outfit) | | **ships** |
| Dark inside light | the inner top two or more steps darker than the layer over it | color.10 (Tim: "lighter colors closer to the body") | −0.25 to −0.5 | no help held out: **off** |
| A tonal stack | inner, outer and bottom all neutral, with a light-to-dark step | color.8 | +0.25 | fitted to 0: **off** |
| Over shorts | the same rules over shorts | sil.11 | | worse held out: **off** |

**The reads they use** (all already in the app's look U; core reads only two of its fields today):

| Read | Steady across two shots (gold, 79 layered photos) | Agrees with an eye label (64 of his layered photos) |
| --- | --- | --- |
| Where the outermost layer ends (look U `outer_hem_at`), three bands | 90% (8 classes: 85%) | 75%; misses are at the waistband/hip border, both ways |
| Short or not (waistband and above) | 94% | eye says short on 23, look finds 16 |
| Long or not (thigh, knee) | 96% | 3 of 3 found; 3 false |
| What the outer piece is (look U `outer_kind`) | 97% | |
| The under piece shows below (look U `under_shows`) | 96% | |
| For comparison: the main reading's own jacket length | 75% | |

The eye labels came from a separate agent that never saw a score or an AI answer; it marked most of them "likely", not "sure", so they are a rough check, not ground truth. **No new read is needed for these rules.** Two would help later: whether the front is open or closed (not read; expected around 90%, since it's a yes/no anyone can see) and the shoulder structure of a coat (sil.6; expected weak).

**Edge cases, and what each does** (sensible defaults, not separate studies):

| Case | What the rules do |
| --- | --- |
| An open coat against a closed one | Treated alike: the hem sets the line either way. Open vs closed isn't read; the open-layer lift (L3) still comes from the layer type |
| A coat with no visible top under it | The coat's hem is the line; the color-stack rules are off anyway |
| A long top hanging below a short jacket | When look U says the under piece "clearly" shows, the line is the under piece's hem (prop.2's lowest visible hem): no short-outline lift, and the halfway charge if it ends at the hip |
| Two or three layers | Look U describes the outermost; any tailored jacket in the stack spares the halfway charge |
| A vest or gilet | No outline rule: the shirt under it sets the line and isn't read separately (NA) |
| Shorts with a coat | No outline rule over shorts (tested: worse); v16's shorts rules stand |
| A seated or cropped photo, legs or shoes not shown | No outline credit or charge (NA) |
| A one-piece (overall, jumpsuit) | No separate bottom in the reading, so no outline rule (NA) |
| A tucked tee where the waistband shows, against one where it's covered | The short-outline rule credits the tuck either way; rise isn't read |
| A hoodie under a coat | The coat's hem sets the line; whether the coat has room for the hoodie (sil.5) isn't checked (inner volume is hidden) |
| A coat in heat | No long-coat lift on a warm day; v16's heavy-layer charge (season.8) stays |
| Look U late or failed | The rules don't run: the score is v16's |

## 3. Rise

**What the creators say** (prop.8, all four agree; suit.5): a high rise with a tuck, a crop or an open jacket lengthens the leg line ("High rise on the other end, it elongates your legs", Jaye); low rise under a tuck cuts the outfit in half; mid rise is the safe everyday choice. It only matters when the waistband shows, and Jaye says high rise is hard to pull off.

**Is there room for it in your ratings?** 65 of your 164 photos show the waistband (a tucked or cropped top). A separate agent labelled their rise by eye, blind to every score. Script `extraction-test/outline_rise.py`, output `results/outline1/rise.txt`.

| Rise (by eye) | Photos | Your mean | The outline version |
| --- | --- | --- | --- |
| High | 18 | 7.64 | 7.69 |
| Mid | 33 | 6.83 | 7.35 |
| Low | 4 | 5.62 | 5.50 |
| Can't tell | 10 | 7.25 | 7.30 |

You do like high rise more, but the engine already scores those outfits right, because they're mostly tucked ones that earn the waist break. Mid-rise tucked outfits are the ones scored too high. At its best in sample, a rise lift would move 18 photos and bring none of them inside a point that wasn't already. Only 11 of the 55 readable labels were marked "sure".

**The narrow read, ready but not run** (`extraction-test/rise_look.py`, `prompt_look_r.txt`, `schema_look_r.json`): one garment question, how high the pants are cut, judged on the fly and the front seam. It runs only when the main reading's top is tucked or cropped with nothing over it, like `secondLook.ts`'s looks: 28% of the gold set, a gate that holds on 212 of 225 photos across two shots. About 0.21–0.30¢ a call, so about 0.06–0.08¢ a check on average.

**Quote, if you ever want it:** a 5-photo pilot is 5 calls, about 1–1.5¢ (stop at 3¢). The full test (every gated gold photo twice, for steadiness) is 126 calls, about 26–38¢ (stop at 40¢). **My recommendation is not to run it now:** the paper test says there's nothing for it to fix yet. Nothing was spent.

## 4. The rescore on paper

All on your 164 blind ratings, refit on each random half and tested on the other, over the same 8 splits as T68 and PR #137. v16 refit this way reproduces T68's 82.0% and r 0.63 exactly. Scripts `extraction-test/outline_paper.py` (results `results/outline1/paper.txt`), `outline_bars.py` (`bars.txt`), `outline_variants.py` (`variants.txt`). Engine changes are in `parts_proto.py`'s `_outline`, off unless `taste["outline"]` is set; v16 and v15 give identical results with it off (4,912 results compared, `outline_parity.py`).

| Measured the fair way: every size refit on each half A, tested on half B, 8 splits | v16 | **v16 + outline, creators' version, with the edge defaults** | v16 + outline, stricter (blazers and plain tees at the hip cost too) |
| --- | --- | --- | --- |
| Within a point of you | 82.0% (79–84) | **83.1% (80–87)**: better on 6/8 splits, worse on 2 | 85.7% (83–89): better on 8/8 |
| r with you (bar 0.69) | 0.631 | **0.648**: better on 5/8 | 0.687: better on 8/8 |
| Steadiness, every look (the app's case, stricter than T68's; bar 218) | 217/223 | **217/223** | 215/223 |
| Steadiness, your Y44 count (T68's 218, as measured then) | 218/223 | **218/223** | 218/223 |
| Dealbreakers, creators' pairs and anchors (B2–B4) | as T68 | **unchanged** (no look U on those frames, so the outline can't fire there: not tested by it) | unchanged |
| Band shares, your checks (worst gap) | 18.4 points | **16.8** | 21.6 |
| Breaks a creator rule | | **no** | yes: suit.6 and prop.7 |

Steadiness, the band shares and what moved are scored with the version that would ship: approved v16's sizes plus the outline sizes fitted on all 164.

**Note: the same three with approved v16's sizes held fixed** (only the outline sizes refit per half). This flatters every column a little, because the approved sizes were fitted on all 164 and have seen half B: v16 82.2%, r 0.651; creators' version 83.2%, 0.677; stricter 87.2%, 0.711. The first version of this report led with these numbers.

**v16's baseline is T68's.** Refit this way, v16 is 82.0%, r 0.631, exactly as T68 and PR #137 measured it. The creators' version without the edge defaults is 84.0%, r 0.658 (better on 6/8, r on 7/8): the edge defaults cost about a point, mostly by switching off the photos where the shoes aren't read.

**Why steadiness shows 217 and 218.** T68's 218/223, the bar you counted in Y44, scores each gold reading with its own leg-width look. That count is the "Y44 count" row: 218 for both, so v16 still passes its own bar. The "every look" row is a different, stricter measurement: each reading also gets its own looks U and L, which is the app's real case once look U's hem is read. There v16 itself is 217, one under 218, and the outline version is 217 too. That's worth knowing for T69: once look U's answers count in the score, the steadiness test should use every look.

Sizes the creators' version fitted per split: the halfway charge over full legs 0.25–0.5 on every split; over slim legs 0 on every split; the short outline and the long coat about 0.25. The stricter version's sizes: the halfway charge 0.5–1.0, the short outline 0.25, the long coat 0–0.5.

**What moved** (in sample, the creators' version: 17 of 164 photos; 13 closer to you, 3 further, 1 the same distance):

| Outfit | You | v16 | Outline | Why |
| --- | --- | --- | --- | --- |
| Tan flannel open over a grey tee, relaxed jeans, brown work boots | 6.0 | 8.0 | 7.5 | the flannel stops at the hip: no open-layer lift, halfway charge |
| Navy bomber read at the hip, cream polo, brown chinos, black loafers | 6.0 | 8.0 | 7.5 | the bomber was credited as a short jacket by type; the look says it isn't |
| Orange chore coat read at the hip, grey tee, dark jeans, brown derbies | 6.0 | 7.5 | 7.0 | the same |
| Blue chore coat read at the hip, white tee, navy trousers, work boots | 6.0 | 8.0 | 7.5 | the same |
| Black overcoat to the knee, black shirt, black jeans, black boots | 7.0 | 6.5 | 7.0 | the long coat makes one line |
| Black blazer to the thigh, navy trousers, black derbies | 7.0 | 6.5 | 7.0 | the same |
| Blue sweatshirt cropped at the waist, white tee, wide olive cargos, black derbies | 8.0 | 6.5 | 7.0 | a short outline over full legs |
| White tee tucked into black chinos, Chelsea boots | 7.5 | 7.0 | 7.5 | the same |
| **Further:** black leather jacket read at the hip, white shirt, wide black trousers, dress shoes | 9.0 | 8.0 | 7.5 | the look says hip; you clearly see a short jacket |
| **Further:** brown cardigan to the crotch over a sage sweatshirt, wide grey jeans | 8.0 | 8.0 | 7.5 | a long cardigan over wide legs is a look you like (big on big, sil.4) |

The full list is in `results/outline1/bars.txt`.

**What isn't verified:** the creators' frames have no look U, so the creator pairs and anchors don't exercise the new rules. The eye labels are one rater, mostly "likely". All of this is web photos with one test profile ("profile unknown"), plus your rated sheet. Nothing has run on the phone.

## 5. Ranked recommendation

1. **Port v16 as is (recommended).** Already approved, passes its own bars, and the honest test can't tell the creators' outline apart from it. T69 doesn't wait. Nothing is lost: the app already stores look U's answers with every check, so the outline can be switched on later and scored on your real checks without a new read.
2. **v16 plus the outline, creators' version.** No bar broken and $0 a check, but its gain (about a point, better on 5–6 of 8 splits) is inside the noise, and it adds about a day to T69 (passing look U's `outer_hem_at`, `outer_kind`, `under_hem_at` and `under_shows` into core, porting `_outline` and its parity fixtures).
3. **The stricter version**, only if you overrule the creators on two points (a blazer that ends at the seat and a plain untucked tee to the hip both cost). It's the only version that clearly helps, but it fails the steadiness bar in the app's case (215, bar 218) and still misses r 0.69. To ship, it would need a steadier read at the waistband/hip border first.

What would settle the outline: more of your blind ratings of layered outfits (69 today), or look U asked twice at the waistband/hip border.

Not recommended now: the layer color rules (no help), the rise read (nothing to fix), a re-read of the main reading's jacket length (look U's is better and free).

## Two things worth knowing from this (for interviews)

- **Ablation: measuring a part by taking it out.** To see how much each part of the score matters, the audit scored every photo twice: once normally, once with one part's contribution switched off, and took the difference. This is called an ablation (from medicine and machine learning: remove a piece, see what breaks). It answers "what does this part actually do?" better than reading the code, because it includes everything downstream (the curve, the caps, the rounding). In an interview: "How would you find out which feature of a model matters most?" — switch each off and measure the drop on held-out data; it's model-agnostic and honest about interactions.
- **Held-out testing, and why we refit on each half.** A rule's size (half a point, a quarter) is fitted to your ratings. If we fit on all 164 and then measure on the same 164, the rule looks better than it is: it has already seen the answers (that's "leakage", the mistake PR #137 caught). So each test here splits your photos in half at random, fits every size on half A only, and scores half B, which the fit never saw, eight times with different splits. A rule ships only if it wins on half B. In an interview this is cross-validation; the trap they want you to name is tuning on the test set.

Something you could try by hand: open `extraction-test/results/outline1/bars.txt`, pick three photos from "What moved", find them in your rating sheet, and decide whether the new score or the old one is closer to what you'd say now.
