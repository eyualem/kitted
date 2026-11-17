# Your taste rules, look by look (proposal, Nov 16)

**Status: a design on paper, $0. Nothing in the scoring changed.** The rescoring session builds it into v16 (`extraction-test/rubrics/parts_proto.py`, `_v16_taste`) only after your yes. Log #478.

**Your answer (Nov 16, relayed by the coordinating session):** "yea, i want to go the recommended way": **A** (the rules follow the outfit's look), **the four creators win clashes**, and **Tailored recognized in scoring now** (`specs/tailored.md` TL3 changed with your yes, Nov 17). Log #480. Refinement in a separate spec interview: the user confirms the look after the photo, with the detected look preselected, so the look becomes an engine input that defaults to the detected one. The rescoring session builds the table that way.

**Your ask (Nov 16):** "make sure u make the rules specific to what preferences the user has like streetwear or a combination like streetwear and formal."

**The problem:** Round 3 (`tasks/T68/TASK.md`) turned your 164 blind ratings into taste rules: wide legs up, shorts and extra colors down, a long hem over the shoe up, some lifts off, one lift worth half, a long top down. Applied to every outfit, they would mark down good outfits in looks where a slim leg, an open layer or one accent is right.

**Data:** `extraction-test/rules_by_style.py` → `extraction-test/results/taste1/by_style.txt`. It splits your 164 ratings by the look each outfit reads as on its own.

---

## 1. First, your call: what do the rules follow?

**Today's rule (log #60.1 and #80, Oct 7–8, yours):** "a style picked before the photo never changes the score; the clothes decide." The engine already works this way:
- The look comes from the clothes, in code.
- Your picks only break a tie in the card's "Reads as" name.
- The one place a pick could leak into a number (the "one look top to toe" credit) was closed in v4 and v6. That credit is now judged on the look the outfit reads as with no picks (`h2_pick_free`, KD-5).
- `CLAUDE.md`'s hard lines say it plainly: "Same photo, same score."

**The reason then:**
- Both camera paths have to score the same.
- A "7.5 streetwear" must never sit under a different look's label.
- A score has to mean the same thing between friends.
- Nobody should be able to raise a score by changing a setting.

**Option A: the rules follow the outfit's own look (recommended).**
- A wide-leg outfit that reads as streetwear gets the streetwear rules, whoever wears it.
- A mix (minimal + smart casual) gets both looks' rules (§4).
- The same photo gets the same score for everyone.
- **What your picks still do:** which fix comes first (spec F9.2), what Kit says ("for your streetwear side, the wide leg is right"), and the tie in the card's name.
- Nothing about Today's rule changes.

**Option B: the rules follow the user's picked looks.**
- If you picked streetwear, your suit gets the wide-leg credit; if your friend picked tailored, the same photo of the same suit scores differently.
- It breaks "same photo, same score" (a hard line in `CLAUDE.md`, and #80).
- It makes scores hard to compare or share.
- It lets anyone nudge a number by editing their picks.
- It also means a user who picks nothing gets no rules at all.

**Recommendation: A.**
- The user's style still counts, where it should: the advice.
- The score stays one honest number.
- Under B the table below would still be the same, only keyed off the picks.
- So this decision doesn't block anything else here.

---

## 2. What your 164 ratings show, split by look

**Half your photos read as no look.**

| Reads as (no picks) | Photos | Your average |
|---|---|---|
| No look | 78 | 6.68 |
| Smart casual | 27 | 6.78 |
| Minimal | 22 | 7.91 |
| Streetwear | 13 | 7.65 |
| Workwear | 13 | 6.50 |
| Classic prep | 10 | 6.50 |
| Vintage sport | 1 | 7.50 |
| Outdoor | 0 | – |
| Tailored | not built yet (T94); 13 outfits pass its test by hand, 5 of them read as no look today | |

- **Your taste isn't only streetwear.** Only 13 of 164 read as streetwear.
- Your wide-leg preference shows up in almost every look:

| Group | Slim | Straight | Wide |
|---|---|---|---|
| Smart casual | 6.36 (7) | 6.86 (11) | 7.43 (7) |
| Minimal | – | 7.50 (8) | 8.12 (12) |
| Classic prep | – | 6.10 (5) | 7.67 (3) |
| No look | 6.20 (15) | 6.68 (22) | 8.00 (12) |
| **Tailored** | **7.12 (4)** | **7.19 (8)** | 6.0 (1) |

- **Tailored is the one look where it vanishes.** A slim leg under a jacket and dress trousers doesn't cost you.
- **Colors cost you in the dressier looks, not in the loud ones.** Against your average for the same leg shape:
  - smart casual −0.46 (14 photos with a color);
  - classic prep −0.62 (4);
  - workwear −0.62 (4);
  - no look −0.52 (27);
  - streetwear about 0 (3);
  - minimal about 0 (3).
  - Muted colors cost about as much as bright ones (−0.33, 35 photos; bright −0.48, 13).
- **A hem covering the shoe** helps in minimal (+0.85, 5 photos) and streetwear (+0.66, 4), but not in smart casual (−0.52, 5).
- **One lift scores below none in every look:**

| Group | No lift | One lift | Two or more |
|---|---|---|---|
| All photos | +0.11 (57) | −0.33 (69) | +0.43 (38) |
| Minimal | +1.09 | −0.14 | +0.82 |
| Smart casual | +0.23 | −0.28 | +0.10 |

  - It holds even when the one lift is a shape (L1 alone: −0.37, 12 photos).
  - This one is just your taste, the same in every look.
- **Shorts don't cost you on their own** (6.98 vs 6.90 for every other bottom). They only miss the plus that wide legs get.

**How much to trust this:**
- Any group under 10 photos is direction only. Every claim below gives its count.
- Your ratings are gut taste and drift (your words, Nov 16).
- The tailored group holds your biggest wobble: the black suit you gave 9.5, next to three near-identical ones at 7, 7.5 and 7.5.
- The re-rate sheet (Y38) will settle it.

---

## 3. The table: each rule in each look

**Sizes are the dry-run sizes from Round 3:**
- wide legs +0.5;
- a hem over the shoe +0.5;
- roomy shorts +0.5;
- each color −0.5, up to two;
- a long top −0.5;
- one lift at half.

**The cell words:**
- **Keep** = that size.
- **Half** = half of it.
- **Off** = nothing.
- **2nd only** = the first color is free and the second costs.
- **–** = the rule can't fire in that look.

The source for each cell is in the notes below the table.

| Rule (dry-run size) | Vintage sport | Outdoor | Workwear | Streetwear | Tailored | Classic prep | Minimal | Smart casual | No look |
|---|---|---|---|---|---|---|---|---|---|
| **a.** Wide or relaxed legs (+0.5) | Half | Half | Half | **Keep** | **Off** | Half | **Keep** | Half | Half |
| **b.** Skinny and slim (v16's own charges; the taste rule adds 0) | as v16 | as v16 | as v16 | as v16 | as v16 (slim already free under a jacket) | as v16 | as v16 | as v16 | as v16 |
| **c.** Shorts (charge 0; roomy shorts +0.5) | charge Off; roomy Half | charge Off; roomy Half | – (rare) | charge Off; roomy **Keep** | – (never tailored) | charge Off; roomy Half | charge Off; roomy **Keep** | charge Off; roomy Half | charge Off; roomy Half |
| **d.** Colors beside the neutrals (−0.5 each) | **Off** | **Off** | 2nd only | **Off** | Keep | 2nd only | Half | Keep | Half |
| **e.** Hem covering the shoe, wide legs (+0.5) | Keep | Keep | Keep | Keep | **Off** | Half | Keep | Half | Keep |
| **e.** Hem covering the shoe, straight legs (+0.5) | Off | Off | Off | Off | Off | Off | Off | Off | Off |
| **f.** An open layer over a tee (L3, dry run: off) | Keep | Keep | **Keep** | Keep | Keep | Keep | Keep | Keep | Keep |
| **g.** One accent (L5, dry run: off) | Off | Off | Off | Off | **Keep** | Off | **Keep** | Half | Off |
| **h.** One smart piece with casual ones (L7b, dry run: off) | Keep | Keep | Keep | Keep | Keep | Keep | Keep | **Keep** | Keep |
| **i.** A single lift counts at half | Keep | Keep | Keep | Keep | Keep | Keep | Keep | Keep | Keep |
| **j.** A long top (−0.5) | Half | Keep | Keep | Half | – (jacket on) | Keep | Keep | Keep | Keep |
| **k.** Shorts above the knee (−0.75, added Nov 16, log #474) | Keep | Keep | – (rare) | Keep | – (never tailored) | Keep | Keep | Keep | Keep |

**What changes against the dry run, in one line each:**
- **Wide legs:** the plus stays full only in streetwear and minimal, and goes in tailored.
- **Colors:** stop costing in the loud looks.
- **Hem over the shoe:** stops counting on straight legs.
- **The three lifts the dry run switched off:** two come back everywhere (the open layer, the smart piece). The accent comes back in minimal, tailored and smart casual.
- **The long top:** softer in streetwear.

### Notes and sources, rule by rule

The creators' rule ids are from `rubric/research/creators/rulebook-2026.md` (PR #123).

**a. Wide legs.**
- **The creators treat straight, relaxed and wide as equal** (sil.8: "no charge between straight, relaxed, wide and barrel"; Tim, Wanhee and Frugal call straight the safe default). So the full plus is your taste.
- **Streetwear:** keep it where the look itself is built on volume. Streetwear is "oversized proportions… very baggy, even dragging jeans can be right" (world.15). Yours: wide 7.78 (9).
- **Minimal:** the city-boy shape is "a relaxed top over straight or wide trousers" (`stylist-guide.md` §12). Yours: 8.12 (12) wide vs 7.50 (8) straight.
- **Half where the creators lean straight:**
  - workwear: "straight or relaxed", world.17; yours 7.50 (4) vs 5.90 (5);
  - smart casual: Tim's smart trousers "look better cut straight than tapered", sil.8; yours 7.43 (7) vs 6.86 (11);
  - classic prep: "neat, not tight", stylist guide; yours 7.67 (3) vs 6.10 (5);
  - vintage sport: "straight jeans", stylist guide; 1 photo;
  - outdoor: no photos;
  - no look: the shared rules, world.23; yours 8.00 (12) vs 6.68 (22).
- **Off in tailored:**
  - A fuller suit trouser that "falls straight" is welcome (suit.5), but wide over straight isn't a creator rule.
  - Your own 13 tailored outfits show no leg effect.

**b. Skinny and slim.**
- The dry-run fit already put these at 0: v16's own charges carry them.
- v16 already leaves slim free under a jacket or with suit trousers ([PRO-13]). That matches the creators (Wanhee's "really slim Italian guy in a suit", sil.10; suit.1 "slim is never charged unless it pulls") and your tailored 7.12 vs 7.19.
- No change.

**c. Shorts.**
- None of the four calls shorts a fault:
  - big shorts work with any real shoe (prop.15);
  - a jacket over shorts can work (sil.11);
  - relaxed shorts are summer staples (season.3).
- Your own numbers agree: shorts alone don't cost you.
- So the charge goes everywhere. Roomy shorts follow the wide-leg column, since that's what they are.

**d. Colors.**
- **Off in the loud looks**, where bold color is the look's own:
  - streetwear "bold pieces and bold color allowed" (world.15), and your 3 photos show no cost;
  - vintage sport and outdoor are loud-native (`LOUD_NATIVE`), with "one color pop" in outdoor (stylist guide).
- **2nd only in classic prep:** a colored or striped oxford is how prep is recognized (`_prep_marker`; stylist guide). Your 4 photos: −0.62.
- **2nd only in workwear:** earth tones; two brights already stop it reading as workwear. Your 4 photos: −0.62.
- **Half in minimal:** one color on a neutral base is Wanhee's "point" (color.2). 3 photos.
- **Keep in smart casual and tailored:** your strongest evidence (14 photos, −0.46).
- **Why this isn't a clash with the creators' "one accent lifts":** the colors here are always a top, jacket or pants. The creators call a big colored piece the outfit's statement, not an accent: "on a small piece it is a point" (color.12). Their own smart-casual mix is "kept muted" (world.5).
- **Rule g carries the true accent** (a small or toned-down color on a calm base).

**e. A hem covering the shoe.**
- **Wide legs, kept in the casual and street looks:** a soft stack on a wide or relaxed leg over a real shoe "is part of the shape" (prop.9, Tim and Frugal).
- **Half in smart casual and prep:** "a full break needs a fashion-forward rest of the outfit" (prop.14). Your smart casual: −0.52 (5).
- **Off in tailored:** the suit trouser touches the shoe "with no break or one clean break; too long bunches" (suit.3).
- **Straight legs, off in every look:** piling on a straight leg is a dealbreaker to three of the four ("trousers should reach the shoe, with no break or one clean break", prop.1). Your 4 straight-leg photos like it (7.62 vs 6.61), but the four win a clash, and 4 photos is thin.
- The pooling cap stays a tip (Y34), so a straight leg covering the shoe is neither charged nor credited.

**f. An open layer over a tee (L3).**
- Your 8 photos say it costs (−0.8): workwear 3, smart casual 4.
- **The creators say it lifts:** "an open layer over the base adds depth" (layer.2; Tim, Frugal and Jaye).
- The four win, so it comes back at its v16 size everywhere. In workwear it's the look's signature ("the chore jacket layers well", world.17).
- Several of your 8 have another fault that explains the low score:
  - skinny jeans (pin-002, 5);
  - a tank and overshirt over shorts (C027, 6).

**g. One accent (L5).**
- The four all agree one accent on a quiet base lifts (color.2). Your ratings disagree (33 photos, −0.32; −0.67 when it's the only lift, 18).
- **Keep it where the quiet base is the look:** minimal and tailored (2 photos each).
- **Half in smart casual** (6 photos, −0.36).
- **Off in the loud looks**, where color is native and an accent isn't special.
- **Off in prep**, where a color is the marker, not an accent.
- **Off on no look** (17 photos, −0.29), which also matches your Y34 call.

**h. One smart piece with casual ones (L7b).**
- It's the creators' definition of smart casual: "one traditionally smart piece with a casual one" (contrast.2, world.5, world.21; all four agree).
- Your ratings don't disagree in any look with 5+ photos:
  - smart casual +0.23 (12);
  - classic prep +0.55 (3);
  - minimal +0.13 (7);
  - all +0.08 (27).
- It also gives a streetwear + tailored mix its tailored credit (§4).

**i. A single lift at half.**
- Your ratings show it in every look (§2).
- The creators' ladder leans the other way: "one or two deliberate moves" make an outfit good (ladder.2).
- There's no look-specific reason to vary it, so it stays as the dry run had it, everywhere. It's on your list as the one rule where your taste overrides the creators' ladder.

**j. A long top.**
- All four call a long body hanging toward the thigh a fault (prop.6, Tim's "biggest pet peeve").
- **Half in streetwear and vintage sport:**
  - "a committed long, low or dragging street proportion can work" (prop.16, Wanhee 2026);
  - Frugal's "neutral to longer" top over bulky sneakers (prop.4);
  - jerseys run long.
- Your 17 photos are mostly no look (13), so per-look evidence is thin. The read itself is still unproven (#465, T98).

**k. Shorts above the knee.**
- The rescoring session added this charge while this table was being written (log #474). It reads the October shorts look (43/48 right).
- The creators are silent on shorts length; the outside sources they cite allow "mid-thigh to knee" relaxed shorts in summer (season.3). So no look is a reason to change it, and it stays the same everywhere.
- The question it raises is the season, not the look: a summer charge for shorts above the knee is softer per season.3 and season.8. That's for the rescoring session's season work.
- This split doesn't check it by look: your 28 shorts photos are mostly no look (20).

**Where the creators are silent:**
- **Classic prep:** the four "barely define it" (world.20), so its cells rest on `rubric/stylist-guide.md` and your 10 photos.
- **Vintage sport and outdoor:** they have almost no photos (1 and 0), so their cells follow the creators' world notes (world.18, world.19) and the shared rules.
- **Transcripts I couldn't read:** I opened Frugal's 2026 decade video in the built-in browser (`TUYSTimnDJg`). It only names "Ivy Prep making a comeback" (13:28). The YouTube search pages didn't render in the pane, so no other prep transcript was read. Those cells are the place more transcripts would help.

---

## 4. Mixes: how a two-look outfit gets its rules

**The rule:**
- An outfit that passes two looks gets **every plus at the size its friendliest look gives**, and **every charge at the size its gentlest look gives**.
- An outfit doing two looks on purpose isn't charged by the look it isn't following.
- The looks come from the pick-free detected set (as the top-to-toe credit already does since v6), never from the card's name. So under A your picks still never move a number.

**The mixes in your 164 today:**
- classic prep + smart casual: 15;
- minimal + smart casual: 11;
- classic prep + minimal + smart casual: 4;
- workwear + streetwear: 2;
- four others: 1 each.

**Examples:**
- **Minimal + smart casual** (a knit polo, wide black trousers, loafers):
  - wide legs Keep (from minimal);
  - colors Half (minimal's);
  - one accent Keep;
  - the hem over the shoe Keep on the wide leg.
- **Classic prep + smart casual** (an oxford, straight chinos, loafers):
  - wide legs Half;
  - colors 2nd only (prep's);
  - one accent Half (smart casual's);
  - the hem on a wide leg Half.
- **Workwear + streetwear** (a chore coat over a hoodie, wide jeans):
  - wide legs Keep;
  - colors Off;
  - one accent Off;
  - long top Half.

**Your example, streetwear + formal ("smart streetwear"), can't be detected today:**
- Streetwear's recognizer turns away every tailored piece: a blazer, sport coat, suit pieces, trousers, a dress shirt, an overcoat, and dress shoes (`ST_VETO`, `_veto_street`).
- Tailored turns away jeans, hoodies, graphic tees and chunky sneakers (`specs/tailored.md` TL1).
- So a blazer over a hoodie with wide jeans reads as no look.

**What the creators say about this mix, if it's added:**
- **Good:**
  - a blazer with wide or light jeans ("cool professor", suit.9; Tim's own outfit);
  - a tee or tank under tailoring (suit.8);
  - clean low sneakers under tailoring (suit.10);
  - Frugal's "smart streetwear" and Jaye's "business core" (world.21).
- **Still faults:**
  - chunky or running sneakers under a blazer (suit.10, [SHO-8]);
  - a loud graphic tee under tailoring, unless it's muted under a dark blazer (suit.13).

**Its rules, by the mix rule:**
- wide legs Keep (streetwear);
- colors Off (streetwear);
- the smart piece Keep (the blazer, rule h);
- the long top Half;
- the hem on a wide leg Keep.

**Making it detectable is a new mix the card names**, which needs your yes (decision 3).

**The risk: steadiness.**
- The look is the wobbliest thing the engine reads (about 11 of 40 photos change label between two readings, v1 notes).
- With per-look rules, a label flip can move a score.
- **Mitigation:**
  - every per-look difference is half a point or less;
  - a mix takes the friendlier side, so passing one extra look never costs;
  - the steadiness bar (B6) has to pass before this ships.

---

## 5. The decisions for you

1. **A or B** (§1). Recommended: **A**. The outfit's own look sets the rules; your picks set the advice.
2. **Where your ratings and the four disagree, the four win** (your #464 yardstick), unless you say otherwise. Four places:
   - **An open layer over a tee:** back as a plus everywhere. Your 8 photos say no; the creators say yes.
   - **One accent:** a plus only in minimal and tailored (half in smart casual). Your 33 photos say no; the creators say yes.
   - **Pants covering the shoe on a straight leg:** no plus. Your 4 photos like it; the creators call it a fault.
   - **Wide over straight:** the full plus only in streetwear and minimal, half elsewhere, none in tailored. The creators call straight and wide equal.
3. **A new mix the card can name, "smart streetwear"** (a street look with one tailored piece: a blazer with wide jeans, a tee under a suit). Recommended: yes, as a later task after Tailored (T94). It changes how outfits are recognized, so it needs its own short spec.
4. **The Tailored column needs Tailored recognized inside the scoring.** The Tailored spec (TL3, approved Nov 13) says the new look moves no score. This design would make it move scores, by turning wide-leg and hem credits off for tailored outfits. Recommended: yes, the rescoring uses Tailored's approved test inside the scoring now. The name on the card still waits for T94.

---

## 6. For the build (the rescoring session, after your yes)

**Shape:** `tune["taste"]` gains a per-look table: `{rule: {look: size}}`, with `"none"` for no look.
- The looks come from `o["det"]` (pick-free), plus Tailored from TL1's test. Never from `label`.
- A mix takes the largest plus and the smallest charge over `o["det"]`.
- L3, L5 and L7b move from `lift_off` to per-look multipliers.
- The hem plus splits by leg (wide only).

**Re-run:**
- the half-split fit (`taste_rules.py`, 8 seeds), with the per-look sizes fixed from this table and only the base sizes fitted;
- every bar in `v16_paper.py --taste`, B6 steadiness first;
- a look-by-look check that no look's share of 8+ falls more than 5 points.

**A small bug found on the way:** `taste_patterns.py` checks the detected looks with the keys `"minimal"` and `"prep"`, but the detector uses `"minimalist"` and `"classic_prep"`. So the Round 3 rows "reads minimal" and "reads streetwear and minimal together" never fired and were left out. Round 3's other numbers don't depend on them.
