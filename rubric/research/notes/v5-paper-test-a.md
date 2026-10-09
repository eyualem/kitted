# Paper test A: five code-only rules on every saved reading

*Oct 9, 2026. Claude (a paper-test session for v5, step 3 of DECISIONS-LOG #184). No AI calls, $0. Rules come from `v5-silhouette.md` (S6) and `v5-tailoring.md` (TJ1, SU2/OC2, TJ7, TF1/SU1). Nothing live changed: `extraction-test/rubric.py`, the fixtures and the app are untouched. Nothing is committed.*

## What was run

- **Prototype:** `extraction-test/rubrics/v5a_proto.py`, a copy of `rubric.py` v4.0 with one switch per rule (`score(..., F={...})`). The switches and what each one does are listed at the top of the file.
- **Identity proof, all switches off:** the whole result (score, raw score, rules, credits, tips, styles) matches `rubric.py` on **7,233 of 7,233** parity cases and **79 of 79** real readings. That's 0 differences.
- **Harness:** scratchpad `v5a_test.py` (scoring, counts, lists) and `synth.py` (made-up check outfits). Neither is committed.
- **Real corpus, 79 readings:**
  - The 78 saved readings: 12 phone, 27 zoom1, 39 stock.
  - Plus the Oct 9 phone pull `screenshots/phone/20261009-182134/` (deduped by image hash). It adds one new reading, FC-02089755.
  - For phone checks I used the reading the app actually scored, with that check's own occasion (all Class). Two corpus entries had stored "everyday". d58b1491's scored reading is the tapped answer, not the first read.
  - All 79 real readings are Everyday or Class. **No saved real check was taken at an interview, event, date or wedding.**
- **Who is in the photos (rule 7):**

  | Group | Readings | What they are | Profile |
  |---|---|---|---|
  | **Founder** | 25 | His 10 phone readings, plus zoom1 reruns of his 11 Oct 8 and 4 Oct 7 photos | Pending: he hasn't given his birth year or picks |
  | **Friend** | 3 | FC-a5aa395e, FC-250a5089, FC-02089755 | Unknown |
  | **Stock/web** | 51 | 39 stock photos and 12 web mirror selfies | Unknown |

  - Founder notes: 968016f0 is counted as his because the fit-ruler note lists it among his saved readings. The Oct 7 set (ph1–ph4) is listed as his in `results/INDEX.md`.
  - **Test profile:** no age band and no picks, for everyone.
  - I checked that picks can't change a score: re-scoring all 79 with picks (minimal 0.5, smart casual 0.3, streetwear 0.2) moved **0 of 79**.
  - **So results can't be split by age band or picked look yet.** Everything falls in one "profile unknown" group.
- **Parity:** `handoff/fixtures/rubric_parity.json` has 7,233 made-up cases across 15 occasions. Only 8 of those occasions exist in the app: Everyday, Class, Date, Going out, Interview, Event, Gym, Home. Counts are given both ways. Parity cases repeat the same outfit under several occasions and boldness settings, so "45 cases" can be just 2 outfits.

## Results at a glance

| Rule | Real moved (of 79) | Parity moved (all / app occasions) | Direction | New 9+ | Verdict |
|---|---|---|---|---|---|
| A1, literal | 1 (stock, +0.5) | 200 / 105, all +0.5 | up | 45 / 29 | Drop as written |
| **A1, refined (A1rx)** | 0 | 89 / 42, all +0.5 | up | 0 | **Ship code-only** |
| **A1b** | 1 (founder, 7.0 → 7.5) | 43 / 24, all +0.5 | up | 0 | **Ship if he OKs "Wide jeans"** (recommended) |
| A2 (fault) | 0 | 0 / 0 | n/a | 0 | Wait: ship with the hem/`stacked` reading |
| A2b (blocks layer) | 0 | 9 / 4 | down | 0 | Drop in favour of A2 |
| A3, literal | 0 | 0 / 0 | **no-op** | 0 | Drop: it can't change anything |
| **A3f** (sneaker under tailoring at Interview) | 0 | 12 / 7 | down | 0 | **Ship code-only, Interview only** |
| A4 | 1 (friend, 8.5 → 8.0) | 10 / 5 | down | 0 | Wait: fires only on a misread |
| A4e (+ no Elevated) | 1 (friend, 8.5 → 7.5) | 12 / 5 | down | 0 | Wait |
| A5 | 0 | 38 / 24 | down | 0 | Wait for the gold set |
| A5e (+ no Elevated) | 0 | 62 / 35 | down | 0 | Wait for the gold set |

### Real score distribution

| Scenario | Mean | Share at 8+ | At 9+ |
|---|---|---|---|
| v4 today | 7.456 | 39.2% (31/79) | 3 (all stock) |
| Recommended set (A1rx + A1b + A3f) | 7.462 | 39.2% (31/79) | 3 |
| Every rule on (A1rx, A1b, A2, A3f, A4e, A5e) | 7.449 | 38.0% (30/79) | 3 |

**By group, v4 today:**

| Group | Mean | At 8+ |
|---|---|---|
| Founder | 7.06 | 3 of 25 |
| Friend | 8.50 | 3 of 3 |
| Stock/web | 7.59 | 25 of 51 |

**Recommended set:**
- Founder: 7.06 → 7.08 (one check +0.5).
- Friend and stock: unchanged.

**Every rule on:**
- Friend: 8.50 → 8.17.
- Founder and stock: unchanged, apart from that same founder +0.5.

**The headline:** these five rules barely touch the real corpus.
- Only 3 real readings have a leg-width charge at all: one founder, one founder misread, one stock.
- Only 1 real reading has a tailored jacket over jeans.
- None is at a dressy occasion.

They are guards for cases the gold set and beta will bring, not fixes for today's saved scores.

## The friends' fits (the founder judged ~7 for each)

| Check | Reading (plain words) | v4 | What these rules do |
|---|---|---|---|
| **FC-02089755** | Navy blazer read as **suit jacket** (looseness 2, length past the crotch) + black tee read **tucked** + mid-wash **relaxed** jeans, hem read **slight break** + grey suede chukkas; Class | **8.5** (Layered + Shoes that complement; no faults; no style detected) | **A4: 8.0. A4e: 7.5.** A2 doesn't fire: the hem was read slight break, though the founder says the jeans stack. Nothing else moves |
| FC-a5aa395e | Navy chore coat + white tee + charcoal **straight** jeans (slight break) + navy low-profile sneakers; Class | **8.5** (Layered + Shoes; workwear) | Nothing moves |
| FC-250a5089 | Same outfit, second photo (tee read at the belt) | **8.5** | Nothing moves |

**FC-02089755, by hem reading.** These are made-up variants of his real reading: only the hem and the jacket's name were changed.

| Hem reading | v4 | A2 | A2b | A4e |
|---|---|---|---|---|
| Slight break (as read) | 8.5 | 8.5 | 8.5 | 7.5 |
| Full break | 8.5 | **7.5** | 8.0 | 7.5 |
| Pooling | 8.0 | **7.5** | 7.5 | 7.0 |

- **A2 lands in the tailoring report's 7.0–7.5 band as soon as the hem is read for what it is.**
- With the jacket read correctly as a *blazer*, A4 and A4e change nothing (8.5). Only A2 can bring it down, and only if the hem is read right.

**Chore-coat fits.** Even read as *slim*, v4 still gives 8.5. Only *skinny* changes it (8.0). As the silhouette note says, this needs a better leg reading (the hem-on-shoe cue) plus a reduced layer credit (S7). It's outside this test. **None of A1–A5 can move it.**

**The founder's own fits we agree on:**
- His black oversized tee + black wide jeans + white leather sneakers (403ade26, 8ad378e7; 7.5 since #183) **don't move under any rule.**
- No founder or stock fit drops under any rule.

## Rule by rule

### A1: no leg charge under a close, short or tucked top (silhouette S6)
**As written** (top looseness ≤ 2, or the top ends at the belt or above, or it's tucked in): 1 real case moves, and 200 parity cases go up +0.5.
- **Moved real case:** stock-s15 (stock, profile unknown, Everyday): off-white overshirt (looseness 4) over a tucked tan tee + wide khaki trousers + white chunky sneakers, **8.0 → 8.5**.
- **The flaw:** under a jacket, the *inner* top's tuck excuses the leg. A loose overshirt over a tucked tee isn't "big pants, little shirt". H&M says a boxy overshirt "needs a narrower leg".
- **Inflation:** 45 parity cases become 9.0. They're 2 outfits: a light denim jacket over a tucked oxford or camp shirt + wide cropped black trousers + loafers. That goes 8.5 → 9.0, because three credits with no fault round 8.75 up to 9.0.
- **Refinement (A1r):** when a layer is worn, *the layer* decides (looseness ≤ 2, or it ends at the belt or above); the inner tee's tuck doesn't count. Logged reason: the silhouette is set by the outermost piece.
- **Second refinement (A1x):** not for sweatpants, joggers or gym shorts. The loungewear ladder already prices those. Without this, wide sweatpants under a cropped hoodie went 5.0 → 5.5, which no source asked for.
- **Result (A1rx):** 0 real moves, 89 parity cases +0.5 (42 at app occasions), **0 new 9+**.
- **Tried and not taken: A1s.** It also counts a bomber, denim or leather jacket as short by its type, since the AI fills in an outer layer's length only about half the time. It brings back the same 45 cases at 9.0. The 9.0 is defensible: 4 sources endorse a short jacket over a full leg. But it collides with the open "9+ needs a standout piece" question, so it stays out until the gold set.
- **Direction:** right. It only removes a penalty that 4 of 5 sources call wrong.
- **Recommendation: ship A1rx code-only.** It changes no saved real score.

**Exact `rubric.py` change:** in PROPORTION, before `P1_leg_vs_style`, skip that charge when **all** of these hold:
1. The bottom's `leg_shape` is relaxed or wide (after the aliases).
2. The bottom isn't in `LOUNGE_BOTTOMS`.
3. One of these:
   - **if a layer is worn,** the first outer garment has `volume` ≤ 2 or `length` cropped/at_belt;
   - **if no layer is worn,** the first top has `volume` ≤ 2, or `length` cropped/at_belt, or `tucked` = full.

### A1b: wide or relaxed jeans and cargos sit inside the default band (his open "Wide jeans" call)
- **1 real case moves:** FC-aa2f3d0b (founder, Class): grey tee + tan overshirt (sleeves over the hands) + wide black jeans (full break) + grey shoes the AI couldn't name, **7.0 → 7.5**. That's the case #183 predicted.
- **Parity:** 43 cases +0.5 (24 at app occasions), 0 new 9+.
- Widening the whole default band would move 321 cases (#183). Widening it for jeans and cargos only moves 43.
- **Direction:** matches his reaction to the 6.5 on his own baggy jeans. It doesn't reward width (GQ, Sep 2026: the huge-trouser era is winding down); it only stops charging for it.
- **Remaining risk:** a long, loose coat over wide jeans now costs only P3 (when the top reads looseness 4+). S1 (a long loose layer over a loose leg) isn't built.
- **Recommendation: ship it if he says yes on his to-do item.** I'd say yes.

**Exact change:** skip `P1_leg_vs_style` when the bottom is jeans or cargos and its leg is relaxed or wide. Wide trousers, chinos, drawstring trousers and sweatpants keep the charge, and A1rx covers them under a close top.

### A2: a heavy hem under a tailored jacket (tailoring TJ1)
- **Rule:** tailored jacket + jeans, chinos or trousers whose hem is pooling, or full break on a relaxed/wide leg. That's a −0.8 fault (F4_pooling's trouser value). It replaces F4's loose-denim discount (one fact, one penalty), and no streetwear exemption applies.
- **Result:** **0 moves, real and parity.** No saved reading has that combination: F4 already charges full price on pooling trousers, and the parity set has no blazer over loose, heavy-hemmed jeans.
- **On the friend's reading:** it fires only if the hem is read full break or pooling. Then it gives 7.5 (table above).
- **Variant A2b** (no "Layered" credit instead of a fault) is weaker. The jacket just moves to "Elevated piece", so the net is −0.25 (8.5 → 8.0 at full break). It moves 9 parity cases.
- **Recommendation: wait.**
  - The rule is right and well sourced (6 sources), but **the hem reading can't see the stack.** The friend's stack was read slight break, and hem flips on 16 of 52 photos.
  - Ship A2 (not A2b) **together with** the hem/`stacked` reading test (#184 step 2).
  - Make sure the planned `stacked` value counts as heavy under a tailored jacket.

### A3: sneakers under tailoring at a formal wedding or an interview (SU2/OC2)
- **What S2 and O1 do today:**
  - S2 charges by the gap between the dressiest piece and the shoe, starting at **2** levels. White leather sneakers are dressiness 3 and the dressiest piece is at most 5 (suit jacket), so the gap is never more than 2.
  - **So the white-leather exemption in S2 never changes a score.** It's dead code.
  - O1 averages dressiness: suit + dress shirt + white leather averages 4.25 against Interview's 3.5 floor. Nothing fires.
- **Literal A3 (close the exemption at those occasions): 0 moves anywhere.**
- **A3f:** any sneaker under a tailored jacket at those occasions costs at least 1.0 occasion unit (−1.2).
  - Navy suit + white shirt + white leather sneakers at Interview: **8.5 → 7.0**, inside the report's 6.5–7.0 band.
  - Navy blazer + tucked oxford + dark jeans + white leather at Interview: 8.5 → 7.0.
  - Suit + low-profile sneakers at Interview: 7.5 → 7.0 (the existing ramp already charged part of it).
  - Real: 0 (no real check at those occasions). Parity: 12 cases down (7 at Interview), no rises.
- **App detail:** the app has no `wedding_formal` or `interview_corporate`. Its occasions are Everyday, Class, Date, Going out, Interview, Event, Gym and Home. **So in the app A3f means Interview only.** The A3x variant adds Event (and corporate interview): 24 parity cases. I'd hold Event: in the app it covers casual parties too, where SU3 says clean sneakers with a suit are fine.
- **Direction:** right. 4+ sources, and it reads two reliable things: the shoe type and the occasion he picked.
- **Recommendation: ship A3f for Interview code-only.**

**Exact change:** in OCCASION, when the occasion is `interview` (plus `wedding_formal` in the rubric's own table) and a TAILORED_OUTER is worn, don't exempt `white_leather_sneaker`. If the shoe is any sneaker (FOOT_KIND "sneakers"), S2 charges `max(ramp, 1.0)` occasion units. The fix line is already "Swap to dress shoes / loafers".

### A4: an orphan suit jacket over jeans or chinos earns no "Layered" (TJ7)
- **1 real move:** FC-02089755 (friend, Class), **8.5 → 8.0**.
  - The jacket simply moves to "Elevated piece".
  - **A4e** (no Elevated from it either): **8.5 → 7.5**.
- **Parity:** 10 / 12 cases down (5 at app occasions).
- **Direction: right number, wrong reason.**
  - The founder says that jacket is a **navy blazer**. It scores lower here only because the AI misnamed it.
  - The card's "Why" would blame an orphan suit jacket that isn't there. Read as a blazer, A4 does nothing.
  - No saved run (about 460 tailored readings across `extraction-test/results/`) has a correctly read suit jacket alone over jeans. So there's no way yet to measure how often this fires for the right reason.
  - The tailoring note assumed lone jackets read as "blazer". **The one real lone jacket read as "suit jacket".**
- **Recommendation: wait.** Add 2–3 lone blazers and one orphan suit jacket over jeans to the gold set. Test whether the AI tells them apart before any points move. A tip is fine meanwhile.

### A5: a too-big tailored jacket earns no "Layered" (TF1)
- **Rule:** a tailored jacket with looseness 5 or sleeves over the hands.
- **Real:** 0 moves. No real jacket reads that way.
- **Parity:** 38 down (A5e: 62), 24 / 35 at app occasions, all −0.5 or −1.0.
- **Made-up checks:**
  - Too-big blazer + white tee + slim dark jeans + loafers: 8.0 → 7.5 (A5e 7.0; band 6.0–6.5).
  - Baggy suit at a formal wedding: 7.5 → 6.5 (band 5–6).
- **Direction:** right, but short of the bands.
- **Caution:**
  - "Sleeves over the hands" already costs −0.4 (F9). This makes one reading cost twice, against v4's one fact, one penalty.
  - Sleeve end is right 70–76% of the time on his photos.
  - With the jacket moving to "Elevated", plain A5 is often only −0.25.
- **Recommendation: wait for the gold set.** It already plans one too-big blazer. If it ships, ship A5e and let it replace F9 for tailored jackets rather than stacking on top.

## Surprises worth logging
1. **The white-leather exemption in S2 is dead code** (always 0). Harmless, but the tailoring report's "exempt everywhere" worry doesn't apply as written. The real gap is the ramp starting at 2 levels.
2. **"Blocks the layer credit" is usually only −0.25 for a tailored jacket.** The best-assignment step moves the jacket to "Elevated piece" (it's dressiness 4–5). Any rule meant to take a jacket's credit away has to block both credits (the "e" variants).
3. **Removing a wrong penalty from a 3-credit outfit lands it at 9.0** (8.75 rounds up). That's v4's own design, but every such rule feeds the "9+ needs a standout piece" question. A1rx avoids it in this data.
4. **The friend's blazer was read as a suit jacket**, and his stack as slight break. Two misreads on one photo. Both rules aimed at it (A2, A4) depend on readings that are wrong today.

## Next
- If he approves, a port session applies A1rx, A1b and A3f (Interview) to `rubric.py` and regenerates the fixtures (`make_*.py`, `gen:rubric`).
  - 122 parity scores change (the three rules together); all were checked here.
  - It needs a rubric version bump, since the parity file is an expected-scores contract.
- A2, A4 and A5 wait for the hem/`stacked` and jacket-name reading test (#184 step 2) and the gold set.
