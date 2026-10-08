# Round 2: Classic prep's challenges

*Classic prep advocate, Oct 7, 2026. I read all 8 round-1 files. Re-runs used my patched copy of `rubric.py`, which adds R4 (one credit per garment, best assignment), R5 (patterns count as interest only at medium/large scale) and R6 (no partial scale-up) to my round-1 changes. The scripts are in the scratchpad (`classic_prep/r2_check.py`). "Saved set" means 155 scorable readings, everyday, no style picked.*

## 1. Challenges

**Calibration: the band text and the arithmetic disagree at 9.0.** The bands say 9.0–9.5 is "all of the above plus one considered point of interest." But three credits with no point of interest (K1 + K2 + K4 = 1.75) give a raw 8.75, and that rounds up to 9.0. **R1–R6 don't touch this case.** Every credit comes from a different garment, so "one credit per garment" doesn't bite:

| Outfit | v3.1 | R1–R6 + my changes | Honest |
|---|---|---|---|
| Navy crewneck over oxford + chinos + loafers | 9.0 | **9.0** (8.75) | 8.5 |
| Costume: navy blazer + cream knit + cream trousers + loafers | 9.0 | **9.0** (8.75) | 8.0–8.5 |
| Quiet-luxury tonal: camel coat + cream knit + brown wide trousers + loafers | 8.5 | **9.0** (8.75) | 9.0 |

Your own examples split on this too. "Navy blazer + oxford + chinos + loafers, 9.0" and the tonal olive suit (s07, 9.0) have no point of interest.

- **My proposal:** "Dialed in" needs a raw score of 9.0 or more. Never round up into 9.
- **On the saved set:** 9+ goes from 8 readings to **0**; 8+ is unchanged at 64.
- **The cost:** s07 and p03-after (suits) show 8.5 against your 9.0 estimates.
- If you think 0 is too few, the alternative is C10 (below). It gives tonal outfits a route to the K3 slot. Don't keep the round-up.

**Minimalist: the "clean palette" credit (M-K3) rewards the wrong tonal.** It needs at most 2 color families, so all-black passes. Cream → tan → brown has 3 families and fails. The research report cites lab evidence the other way:
- A light-mid-dark tonal range (cream, tan, brown) is "the most harmonious kind."
- Dark palettes were rated poorly in the 2011 color study (O'Donovan & Agarwala, via `proportions-color-style.md`).

As written, M-K3 can never fire on the quiet-luxury flavor, which is the classic tonal look. Amend it so the tonal test counts the warm neutrals (cream, khaki, tan, brown) as one family. Or wait for the `lightness` field and test for a range instead of a family count.

**Smart casual: two of my prep markers were really yours.**
- I conceded these, so my round-1 label count overstated prep.
- **"Knit over a collar"** is the smart-casual staple; it no longer counts as a prep marker.
- **"Classic pattern"** fired on s22 because a ribbed knit polo was read as stripes. That isn't a prep signal either.

New marker list:
- a rugby shirt or cardigan
- a collared top with shorts
- a medium or large stripe or plaid on a collared top or shorts
- a non-neutral color on a collared top or shorts
- a blazer over chinos or jeans

s22 now reads "classic prep / smart casual." No score changes; the two allowance sets are the same there.

**Vintage sport: the rugby split needs one line, and you nearly wrote it.**
- Your terrace path counts chinos as an "anchor bottom," so rugby + chinos + Samba reads as vintage sport. It reads as prep too (3.5 points).
- **The tie-break (C7):** the bottom decides first. Chinos, trousers or non-athletic shorts → prep. Jeans, cargos or athletic bottoms → vintage sport. The shoe breaks a remaining tie: loafer, white leather sneaker, derby or boat shoe → prep; low-profile or retro runner → vintage sport.
- Applying both styles' allowances is safe. Neither excuses anything the other punishes on chinos.
- We also proposed the same fix independently: one garment counts as at most one focal point. Yours is limited to "hero pieces." Make it apply to every garment. A bright, large-check flannel (s11) hits the same double count; it scores 7.5 today and 8.0 with the fix.

**Smart casual + Minimalist + me: one wide-trouser rule, not three.** SC-A1, Minimal's wide band and my "tailored wide" rule all remove the same −0.45. The shared rule:
- the bottom is trousers, suit trousers or drawstring trousers, with a wide or barrel leg
- the shoes are leather or minimal (or hidden)
- wide chinos and jeans are excluded

Whichever style is detected, it fires once. The label goes to Minimal when the outfit is tonal with no collared top, and to prep or smart casual otherwise.

**Outdoor and Smart casual: one `vest` value.** Outdoor's `vest` and smart casual's `vest_gilet` are the same garment. The "Midtown vest" over an oxford is both a prep and a smart-casual look. Make it one value that earns K1 at the technical tier (0.5, see C2), whoever's look it is.

## 2. Concessions
- **R5 (fine stripes aren't a point of interest).** I accept it. My 9.5 anchor (navy blazer + fine-stripe oxford tucked + grey trousers + loafers) drops to **9.0**, or **8.5** under my 9.0 proposal. Prep can still reach 9+ through a real point of interest: a rugby stripe, madras, one color.
- **Polo + chinos + white leather sneakers = 8.0.** Calibration's band ("2 credits from different garments, zero mistakes" = Sharp) describes this outfit exactly. My 7.5 was taste. Withdrawn.
- **The m02 cost.** My wide-trouser rule (now the shared one) moves m02 from 8.5 to 9.0 in all 3 runs. Claude's estimate is 8.5. Under my 9.0 proposal it shows 8.5 again; without that proposal, the wide rule overshoots m02.
- **The label goes to Minimal for tonal + wide** (Minimal's tie-break). My "quiet" flavor still names the wording when a collared top or blazer is present.
- **Workwear's fix D:** a piece read as stained earns no credit. My sloppy 4.0 anchor relied on a stained oxford still earning K2. Accepted for every style.

## 3. Votes on the cross-cutting conflicts

| # | Vote | Why |
|---|---|---|
| C1 One garment, one credit | **For, amended** | Shoes can earn only K4. K2 needs a top, outer or bottom piece. One garment counts at most 1 focal point and 1 point of interest. The work-boot (2.5) and street-sneaker changes then only open K4 and can't double-dip |
| C2 Technical layers earn 0.5 | **For** | Lowers scores, and a puffer over a hoodie isn't a styling choice. Camel overcoats and field (Barbour-type) jackets stay at 0.75 |
| C3 Loungewear | **For vintage sport's ladder** (0 / 1 / 2 signs of intent: −1.2 / −0.6 / 0). **Picks alone waive nothing** | Founder rule 1 says picks break ties. Streetwear's "anchor" is the same idea, so count it as one of the two signs |
| C4 Detection only widens a band | **For** | My merged band (slim → relaxed) already does this |
| C5 Occasion beats style at work and interviews | **For** | Prep is the style most worn to interviews; the occasion rules have to hold |
| C6 `denim_wear` (none / faded / ripped / not visible); undistressed black jeans = dark | **For** | Today's flag is true on 33 of 46 saved jeans readings. Black-as-dark is backed by m07 (30 of 30 runs) |
| C7 Tie-breaks | **For**, with my rugby line above | Shell + cargos + trail shoes → outdoor; chore coat over a hoodie → either label, allowances combined; mid-wash denim is never Minimal (label only) |
| C8 R1–R6 and the target spread | **For all six**, plus **"9+ needs raw ≥ 9.0"** | Measured below. The target spread is right, but the saved set still sits at 41% 8+ after the package |
| C9 Slides under jeans −0.3 / −0.4 | **Against for now** | Slides already cost through the dressiness average and a lost K4. Streetwear's own sources lean the other way. Gold set first |
| C10 Minimal's clean-palette credit | **Amend** | Off until the gold set. When it ships, it should be the only route for tonal outfits to 9+ (pairs with my C8 addition) and test for a warm-neutral or light-to-dark range, not ≤2 families |
| C11 Loungewear cap −2.0 | **Against** | Redundant once R1 (per-garment cap), R3 (5.0 floor) and the C3 ladder exist. Two caps on one fact is hard to explain on the "Why" card |
| C12 The founder's outfit, read correctly | **6.5** | Jeans read correctly with a resting or stacked hem: today 6.5 (only P1, wide leg, −0.45). Streetwear detection waives P1; streetwear's "stack needs a shoe" rule (−0.4 with slides) keeps it at 6.5. If the hem is read as `pooling`: 6.0 (R1 caps it at −1.0). Classic prep never touches it: the hoodie and slides veto it |

## 4. Net inflation check
My own round-1 proposals move only **7 of 155 saved readings, all up**:
- s11 ×3: 7.5 → 8.0 (one focal point per garment)
- m02 ×3: 8.5 → 9.0 (wide trousers)
- m12 ×1: 8.5 → 9.0

They are mildly inflationary on their own. With R4–R6, which I support:

| | v3.1 | Package (mine + R4–R6) | + "9+ needs raw ≥ 9.0" |
|---|---|---|---|
| Readings up / down | — | 6 up / 48 down | — |
| 8+ | 82 (53%) | 64 (41%) | 64 (41%) |
| 9+ | 8 (5.2%) | 8 (5.2%) | **0** |

**The 6 that go up:**
- m02 ×3: the wide rule
- s11 ×3: the focal fix

**The 48 that go down (0.5 each):**
- the pattern-credit and double-credit cases calibration listed: m03, m05, m07, m09, m10, m12, p04, p05, p06, s01, s15, s17, s19, s22, s26

The other proposals I vote for push mostly down too, by their authors' own counts:
- vintage sport's ladder: 7 up, 11 down
- outdoor's K1 tier: 1 down
- workwear's boot fix: 3 readings of s20 up
- R1–R3: only the founder's misread photo goes up

**Net: clearly deflationary.** 8+ stays near 40%, above the 20–25% target. Most saved photos are professional shoots, so the founder's 20-shot phone test is the real check.
