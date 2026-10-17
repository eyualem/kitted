# A second look when the AI is unsure (Oct 17, 2026; DECISIONS-LOG #333)

*Claude, a side session. The founder's idea (Oct 17): when the reading is shaky on a detail that would move the score, ask again, narrowly, and use this beyond shorts. Script `extraction-test/unsure_look.py`; prompt `prompt_unsure_lower.txt` + `schema_unsure_lower.json`; truth `unsure_labels.csv`; results `extraction-test/results/unsure1/`. Nothing in the app or the engine changed.*

**Rule 7:** the gold photos are public screenshots, profile unknown, run with one stated test profile (minimal + smart casual, 0.5 each; boldness "a little"; no age) at Everyday, as `gold_tune.py`. The founder's saved checks are scored at their own occasion with no picks (his profile is still pending). No age or look split is possible.

## 1. What's already known (not repeated here)

- **Asking the whole read again doesn't help.** Voting 3 reads and a cascade cost more and matched the judges no better; the same model makes the same mistakes (#278 point 4, #220).
- **A narrow look at one close-up does.** The second look (#199) and the shorts look (#332): 92–96% the same on 3 runs, where the same question inside the main read was 75–88% and shook the other fields.
- **The app already asks the person** when unsure: the quick tap on 9 look-alike pairs (incl. "Chelsea boots or work boots?"), "Boots, sneakers or slides?" when the type is lost, "Your grey work boots?" for a confirmed closet piece, and "Not sure" on a piece's Fit/Leg row when its photos disagree (#316, #322).

## 2. Measured for free on the gold set's two runs (225 photos, engine v13)

Scores are identical between runs on 174 photos, 0.5 apart on 44, 1.0+ on 5. For each field I swapped one run's value into the other run's reading to see whether **that field alone** moves the score:

| Field | Differs between runs | Moves the score by itself | The AI's own "not sure" flag on the flips |
|---|---|---|---|
| Hem | 53 (24%) | 6 | 5 of 53 |
| Leg shape | 37 (16%) | 9 | **0 of 37** |
| Top length | 30 (13%) | 6 | 6 of 30 |
| Shoe type | 26 (12%) | 12 | **24 of 26, and all 12 that move the score** |
| Top type | 18 (8%) | 10 | 5 of 18 |

So the two details worth a second look are **shoe type** (most score-moving flips, and the AI knows when it's unsure) and **leg shape** (the AI is blind to its own doubt). Hem and top length rarely move the score and already failed narrow looks (#199: pant_end 54% right; outer_hem_at 70%). Top type is the quick tap's job (sweater/sweatshirt).

## 3. The trigger design

**One rule for every detail: ask again only when the answer could change the score.** The trigger is computed by code from the stored reading, so the same photo always triggers the same way.

| Trigger | Fires on readings | Catches the score-moving flips | Fires on photos whose runs agree |
|---|---|---|---|
| U-T1 shoe: flagged "likely"/"unsure" **and** another shoe of the same family (leather shoes and boots, or sneakers) would move the score | 98/450 (22%) | 12/12 shoe | 45/199 (23%) |
| (shoe flagged alone) | 161/450 (36%) | 12/12 | 73/199 (37%) |
| (a look-alike moves the score, flag ignored) | 250/450 (56%) | 12/12 | 117/199 (59%) |
| U-T2 leg: a neighbouring leg (skinny–slim–straight–relaxed–wide–barrel; flare next to straight) would move the score | 139/450 (31%) | 9/9 leg | 57/188 (30%) |

- **Shoes:** U-T1 keeps every score-moving flip and fires on 22% of readings instead of 36%. Ignoring the flag fires on more than half for nothing.
- **Legs:** the flag can't be used (0 of 37), so the trigger is the score swing alone. On the founder's checks it mostly means "straight, where slim would cost 0.5" (v12 judges a fitted straight leg as slim): 19 of his 39 checks.
- **The closet stays as it is:** a piece he set reaches a new score only through the existing "Your mid-wash jeans?" tap, never silently (#316 (c), #126). The look doesn't change that.

**Who settles it:**
1. **The narrow look**, when the trigger fires and the look gives a real answer: its value replaces the main read's for scoring, silently (no extra tap, no extra wait). The test also reports a symmetric variant: the look's answer wins whenever it gives one (it runs on every check anyway), since a trigger that fires on one photo of an outfit and not on the next can itself make two photos score apart (the ceiling below shows it once: 1.0+ apart 5 → 6).
2. **The person**, only as today: the existing quick taps ("Chelsea boots or work boots?", "Boots, sneakers or slides?", "Your grey work boots?") keep their rules and fire when the look couldn't see (cant_see) or was late. No new question for him; the 1-question cap stays. Asking him every time the AI is unsure would mean a question on ~46% of checks (U-T1 or U-T2 fires on 207 of 450 readings), against the taps' ~4% today.

**Where the look runs:** inside the second look L the app already sends on every check, on the same lower close-up, in parallel with the scoring read (`prompt_look_l.txt` plus two questions, shoe and leg_shape). No new call, no new wait: the card already waits for L until the read is in plus 1.5 s, and when L is late (about 1 in 8) the main read stands as it does today. The answers are stored with the check, so the same photo keeps the same score. (A separate triggered call after the read would add ~2.6 s to a fifth to a third of checks; one more parallel call would cost 0.11¢ on every check. Folding into L is cheaper than both, if it doesn't shake L's own answer: check U9.)

## 4. The test (written before any answer existed)

**Photos:** gold photos already on the Mac, their face-hidden lower close-ups as gold1 cut them (51 lower, 6 body close-ups where there's no hip split). No downloads, no shoot.
- **Set S (shoe):** 31 photos where U-T1 fires on run 0 or 1: all 19 whose two runs read different shoes, plus 12 steady controls (seeded).
- **Set G (leg):** 30 photos where U-T2 fires on run 0 or 1: all 20 whose runs read different legs, plus 10 steady controls (seeded).
- 57 photos in all (4 in both); one call answers both questions on every photo.

**Arm N:** the shipped look L prompt with `shoe` and `leg_shape` added, gemini-3.8-flash, thinking off, temperature 0, 3 runs. **The control** is the main read's own two gold1 runs (Oct 12; same model, the full photo plus both close-ups): no new calls.

**Truth:** two independent blind labellers (Claude subagents) from the same close-ups, with the prompt's own definitions, before any narrow answer existed; they could open only the images. A value is truth only when both agree; the rest is "soft" and left out (and counted). "Score-right" means the answer gives the same score as the truth would when swapped into run 0's reading: a derby read as a dress shoe that scores the same is not a miss that matters.

**Pass bars (as #198/#199; all must pass to ship):**

| Check | Bar |
|---|---|
| U1 shoe steady | the same shoe on all 3 runs on ≥ 90% of set S, and runs 0–1 agree ≥ 10 points more often than the main read's runs 0–1 |
| U2 shoe right | score-right ≥ 85% against the agreed labels when it answers, and ≥ 10 points above the main read's on the same photos |
| U3 shoe unsure | cant_see (or "other") on ≤ 30% of runs |
| U4–U6 | the same three for leg shape on set G |
| U7 steadier | settling each run with the look's same-numbered run: more photos whose runs score the same (174 of 223 scored today), and no more 1.0+ apart; reported for "when triggered" and "always", and the one that passes is the one that ships |
| U8 not worse against people | the held-out panel r (run 0) no more than 0.02 lower; the founder's 20 blind ratings: no fewer within 0.5 |
| U9 harmless | the shipped answer (covers_shoe as "rests on the shoe") ≥ 90% the same on 3 runs and ≥ 85% right (look1: 94% / 97%) |
| U10 cost | ≤ 0.05¢ added per check (the folded design) |

If a detail passes U1–U3 (or U4–U6) but U9 fails, it ships as its own parallel call instead (0.11¢ a check) and that's the founder's call. If U2/U5 pass but U8 fails, being right by our labels isn't scoring the way people do (the #278 lesson) and nothing ships.

**Budget:** 171 calls at an estimated 0.16¢ (look1's L was 0.110¢; the added definitions are ~600 tokens) ≈ 27¢. **Hard stop 30¢**, counted from the real token usage plus the worst case of every call in flight; the calls go run by run, so a stop cuts run 3 first. **Nothing is spent until the founder OKs it.**

## 5. Results

### Free, before any spend: the ceiling is small

With the blind labels in hand, the most the look could ever buy, on the gold set's two runs:

| If the look were… | Runs give the same score | 1.0+ apart | Held-out panel r | The founder's 20 within 0.5 |
|---|---|---|---|---|
| today (no look) | 174/223 (78%) | 5 | 0.490 | 13 |
| **perfectly steady** (both runs get the same shoe and leg wherever U-T1 or U-T2 fires) | **185/223 (83%)** | 5 | 0.490 | 13 |
| always right (the agreed truth swapped in where the trigger fires, labelled photos only) | 176/223 (79%) | 6 | 0.493 | 13 |

- **Steadiness is the only prize, and it's +11 photos of 223 (+5 points) at best.** None of the 5 big swings goes away: each is several fields at once (ig-004: top length, jacket length, leg and hem; ig-015: a bomber read as "other"; ig-061: the shoe plus the top's wear and sleeves). Of the 49 photos whose runs score apart, swapping the shoe type alone closes 7, the leg alone 7, and 11 need two or more fields. The wobble is spread thin across the reading.
- **Being right buys nothing against people:** the panel r and the founder's 20 don't move even with the truth swapped in.
- **The truth is soft exactly where the AI wobbles.** The two blind labellers agree on the shoe type on 39 of 57 photos (68%) and the leg on 42 (74%). On the photos where they agree, the main read is score-right on 76% of shoe reads and 80% of leg reads (exact type: 50% each). So U2 and U5 can only be judged on the easier half (17 shoe photos, 20 leg photos), and the look needs ≥ 86% / ≥ 90% score-right there to pass.

### The run

*Not run: it waits on the founder's OK of ≤ 30¢ (CLAUDE.md to-do list). The harness was checked end to end with a fake model (no network): the hard stop, the run-by-run order and every check in the report work; a random answerer fails U1–U9 as it should.* Run it with:

```bash
cd extraction-test && KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 unsure_look.py --run --runs 3
```

## 6. ## 6. The founder's saved checks (paper, free)

39 scored checks across his phone pulls (deduped; his own and his friends' photos). U-T1 fires on 4 (10%), U-T2 on 19 (49%):
- **Shoes:** a suede chukka read "likely" twice (d918c0: 7.5, any other leather shoe 7.0; d1967f, the friend's blazer: a dress shoe 6.5), a low-profile sneaker read "likely" (5a9049: a performance runner 6.0), and a basketball sneaker (af7e93: 8.0; canvas or retro 7.5).
- **Legs:** mostly "straight", where slim would cost 0.5 (703a8b 7.5 → 6.5; ebe23f, d6559a, f4870b, fb0b17, e438d4: 7.0 → 6.5); a few where relaxed would add 0.5 to 1.0 (7f3c60, 729b22, 9a2e71, 4c21bb, d58b14).
- The settled scores need the look's answers on his own close-ups: his photos aren't in the gold set, so they're not in this test (on his list if the test passes: one more ~3¢ run on his kept close-ups).

## 7. Cost per check

| Design | Added per check | Added wait |
|---|---|---|
| **Folded into the second look L** (recommended) | ~600 prompt tokens + ~10 answer tokens on every check (L runs on every check): **≈ 0.05¢** (+4.5% on 1.08¢) | none (L already runs next to the read; the card waits read + 1.5 s) |
| A separate call only when triggered, after the read | 0.16¢ × 46% (U-T1 or U-T2 fires on 207 of 450 readings) ≈ 0.07¢ | ~2.6 s median on ~46% of checks (the "Taking longer" line starts at 9 s) |
| A separate call next to the read, every check | ≈ 0.12–0.16¢ | none |

On the founder's saved checks the trigger fires on 23 of 39 (59%), mostly legs read "straight" where slim would cost 0.5. Same-photo steadiness in the app is unchanged either way: the look's answer is stored with the check like L's today, so the same photo keeps the same score; what changes is how far apart two photos of the same outfit can land.

## 8. Recommendation

1. **Run the test, ≤ 30¢ (Claude's call: yes, but with low expectations).** It's cheap and the folded design costs ~0.05¢ a check at run time, so even the +5-point steadiness ceiling is worth knowing. It will answer three things the paper can't: whether the narrow look is steadier than the main read on these exact photos (U1, U4), whether it's right more often on the half the labellers agree on (U2, U5), and whether adding two questions shakes L's own answer (U9).
2. **If it passes,** fold `shoe` and `leg_shape` into L (prompt, schema, the app's `secondLook.ts` and `@kitted/core`'s `_second_look`, behind a switch that ships off), then one ~3¢ run on the founder's kept close-ups for his before/after, then his go.
3. **If it fails,** stop chasing steadiness through the reading: the wobble is spread over a dozen fields, and the honest lever left for his real use (the same clothes over and over) is the closet: the "Your …?" tap already settles a piece he confirmed, from his own answer.
4. **Not worth a look:** hem and top length (they rarely move the score and already failed narrow looks, #199), top type (the quick tap's job), and anything the flag already hands to a tap.

**The founder's calls** (CLAUDE.md to-do list): the ≤ 30¢; and, if it passes, whether the look settles silently (default) or the Why sheet's shoe or leg line says "read from a closer look".
