"""Parts engine PROTOTYPE (Oct 10, 2026; DECISIONS-LOG #195-199). NOT the live rubric: rubric.py v4.1 stays live.

The plan it implements: ../../rubric/research/parts/SPEC.md (approved, #196-197) and the part reports beside it
(fit.md, proportions.md, color.md, shoes.md, occasion.md, cohesion.md, condition.md). Paper test: ../parts_test.py,
report: ../../rubric/research/parts/prototype-results.md.

"The AI sees, the code judges": this file reads only the AI's garment description (the live v3 reading format,
schema.json) plus, when passed in, the second look's two yes/no answers (look1: the peek and "rests on the shoe").
It never reads face, body, weight or skin, never reads his profile (age or picked looks), and never asks the AI to judge.

How a score is made:
  1. Five PARTS, each 1-10 from its own checks:  Proportions 30 · Fit 25 · Color 15 · Shoes 15 · Cohesion 15.
     A part that isn't in the photo is NA and drops out; the other weights scale up.
  2. The weighted average of the parts (exact part values; the card shows them rounded to the half).
  3. CONDITION: faults only, subtracted (wrinkled -0.4, worn -0.4, stain -1.2, cap -1.6; footwear excluded,
     Shoes owns it; an untucked dress shirt under tailoring -0.6).
  4. OCCASION: final = min(average - a small deduction, a ceiling). It can only hold a score down.
  5. The 5.0 floor at everyday/class/home/gym (no stain, wear or strain), the 3.0 floor, round to the half.

Rules for what may move points (the design rule from the batch-1 and look1 tests, #198-199):
  - A check moves points only when the facts it reads passed a 3-run steadiness test in the grouping it uses
    (see STEADY below and the paper test's table). Anything else is a TIP: it's reported, with what it would
    cost once its reading passes, and never moves the number.
  - One fact, one owner (SPEC "Who owns each fact"): Shoes owns shoe weight vs the leg (both ways), slides with a
    dragging hem and shoe condition; Proportions owns a top running long; Fit owns sleeves, strain, too big and
    pooling; Cohesion owns too many statements and a standout piece (pattern); Color owns a standout color;
    Condition owns an untucked dress shirt; Occasion owns sneakers under a blazer at an interview.
  - No hard cliffs on the shoe's dressiness: batch 1 found v4's K4 line (|shoe - outfit| <= 0.75) was the main
    source of score wobble, because his grey suede boots flip between work boot (2.5), chukka (3) and derby (4).
    Here every dressiness comparison is a ramp with a flat middle wide enough to hold the whole boot family.

Fourteen engines. engine="v14" is THE DEFAULT since Oct 17 (the casual and athletic fits, see TUNE["v14"]); engine="v13" was the default from Oct 14 (v12 plus the founder's call on wrinkled knit tops: a tee,
hoodie, sweatshirt or tank read clearly wrinkled costs 0.2 when the outfit reads as minimal, smart casual or classic prep
and none of the loud-native looks; nothing on streetwear, workwear, vintage sport, outdoor or no clear style; the
amounts are knobs; TUNE["v13"], report ../../rubric/research/parts/v12.md -> "v13"); engine="v12" (the default earlier on Oct 14: v11 plus the founder's calls on his Oct 14 checks: a small graphic
on a bright tee isn't a loud print, fitted legs (slim, or "straight" at roominess 2 or less) cost 1.0 again, light on
light costs 1.0 on Color, and wrinkles are charged by garment and look; TUNE["v12"], report ../../rubric/research/parts/v12.md);
engine="v11" (the default Oct 13-14: v10 plus two fixes from the creators' own outfits: a tank or
tee under another top layer is judged by the layer over it in STY-4, and skinny joggers or sweats pay the skinny charge out
of the gym and home; TUNE["v11"], report ../../rubric/research/parts/v11.md); engine="v10" (the default earlier on Oct 13:
v9 plus the creators' rules, TUNE["v10"]; report ../../rubric/research/parts/v10.md); engine="v9" (the default Oct 12-13: v8 plus four consensus fixes, TUNE["v9"], #232);
engine="v8" (the default earlier on Oct 12 (the gold-set retune, DECISIONS-LOG #227-228: TUNE["v8"]
below, ../gold_tune.py, report ../../rubric/research/parts/gold-retune.md). engine="v7" (the default Oct 11-12: v6 plus "a condition read moves points only on a garment
read clear" (TUNE["v7"], ../parts7_test.py, DECISIONS-LOG #219). engine="v6" (the default before it: v5 plus PB1 "roomier than the look" (the council's per-style
bands, back as one Proportions fault), H2 judged on every style the outfit reads as, and Event's softer band; see
TUNE["v6"], ../parts6_test.py, report ../../rubric/research/parts/v6.md. engine="v5" is v4 plus SX1 "a piece from another look", the style-crossing
fault on Style; see TUNE["v5"], ../parts5_test.py, report ../../rubric/research/parts/style-clash.md). engine="v1" is parts-proto-1 exactly (results/parts1/). engine="v2" tunes only the rewards
whose readings passed, and adds one step after the average (see TUNE below). engine="v3" (the streetwear pass) is v2
plus one Proportions reward, PR4 "the streetwear shape" (see TUNE["v3"]; ../parts3_test.py, report
../../rubric/research/parts/streetwear-pass.md). engine="v4" (the default from Oct 11 until v5, approved by the main session;
the style fairness pass) is v3 plus the workwear and outdoor silhouettes (PR5, PR6), the track jacket as a short layer,
and H2 judged on the pick-free label so his picks can never move a number (see TUNE["v4"]; ../parts4_test.py, report
../../rubric/research/parts/style-fairness.md). v1-v4 stay reachable by name. v2's step after the average:
  2b. EARNED BONUS (v2): +0.25 when a second part reaches 8 and no part is under 7, so excellence in two parts adds
      up instead of being averaged away. Paper test: ../parts2_test.py, report: ../../rubric/research/parts/
      tuning-results.md.

Reuses rubric.py v4.1's helpers (formality, colors, style detection, prepare/normalize) by import; nothing copied.
Deterministic: same reading (+ same second look) -> same result.
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import rubric as R  # noqa: E402  (v4.1: the live helpers)

VERSION = "parts-proto-15 (Oct 28, 2026)"
VERSIONS = {"v1": "parts-proto-1 (Oct 10, 2026)", "v2": "parts-proto-2 (Oct 10, 2026)",
            "v3": "parts-proto-3 (Oct 10, 2026)", "v4": "parts-proto-4 (Oct 11, 2026)",
            "v5": "parts-proto-5 (Oct 11, 2026)", "v6": "parts-proto-6 (Oct 11, 2026)",
            "v7": "parts-proto-7 (Oct 11, 2026)"}

# ---- Reward tuning (Oct 10, founder-approved). engine="v1" reproduces parts-proto-1 exactly (paper test results/parts1/); engine="v2" is
# the tuned engine (paper test parts2_test.py, report rubric/research/parts/tuning-results.md). Only rewards built on
# readings that passed a steadiness test were tuned; every fault, ceiling and floor is the same in both.
TUNE = {
    "v1": {
        "pr1": 1.0, "pr1_mirror_short": 1.0, "pr1b": 0.5, "pr2": 1.0, "pr3": 0.5, "prop_cap": 2.0,   # Proportions
        "h1": 0.5, "h2": 0.5, "h2_suit": 0.5, "h4": 0.5,                         # Cohesion rewards
        "cp1": 1.0, "cp2": 0.5, "cp5": 0.5, "lightness": False, "color_cap": None,   # Color rewards
        "suit_shoe": False,                                                       # Shoes: a suit's own shoe
        "earned": None,                                                           # the bonus after the average
        "solid_line": False,                                                      # "every part is solid" card line
    },
    "v2": {
        # Proportions: the waist break and a short layer over a full leg are the two best-evidenced deliberate shapes
        # (proportions.md R1/R2: 6 and 4 sources, 0 against) and their readings are the steadiest in the engine
        # (tuck 97%, short top precision 100%, leg full/narrow 94%, layer type 100%). +1.0 left them at 8, which the
        # 30% weight turns into +0.3 on the total: one deliberate shape could never show. +1.5 -> part 8.5, the
        # anchor's "one deliberate shape, nothing off" (8-8.5). The tailored line (+0.5 -> +1.0) is the same idea
        # for tailoring: a jacket, a tucked top and pressed trousers, nothing skinny. The half tuck stays +0.5
        # (half vs none was never tested). Cap +2.0 -> +2.5, so a tuck plus a tailored line can reach 9.5.
        # One guard: an UNTUCKED short top in a mirror selfie earns +0.5 only. Both arms up to hold the phone lift the
        # hem, so "at the belt" there is often the pose, not the cut (proportions.md, known problem 2; web m06: a long
        # tee read at_belt with both arms raised). A full tuck reads the same in a mirror, so it keeps +1.5.
        "pr1": 1.5, "pr1_mirror_short": 0.5, "pr1b": 0.5, "pr2": 1.5, "pr3": 1.0, "prop_cap": 2.5,
        # Cohesion: "Reads as a style" stays +0.5 (style detection is the wobbliest fact: 11-12 of ~40 photos flip).
        # "Clearly that style top to toe" (an anchor piece in all 3 slots, nothing against) is the signature-pieces
        # credit, steady (1 of 3 and 0 of 7 flips): +0.5 -> +1.0. One standout piece +0.5 -> +0.75.
        "h1": 0.5, "h2": 1.0, "h2_suit": 1.0, "h4": 0.75,
        # Color: standout, quiet accent and tie-in unchanged in size; the lightness credits (tonal with a range +1.0,
        # tonal anchored by the shoes +0.5, light-mid-dark +0.5) switch on whenever the reading carries `lightness`
        # (it passed alone in batch 1: 95% the same, 94-98% right; it isn't in the live reading yet). They stack
        # with the standout and the tie-in up to +2.0 (part 9.0 at most).
        "cp1": 1.0, "cp2": 0.5, "cp5": 0.5, "lightness": True, "color_cap": 2.0,
        # Shoes: a matching suit is a look, so dress shoes, derbies, loafers or Chelsea boots under it are "the
        # look's own shoe" (style detection returns no style for a suit, so S-C could never fire under one).
        "suit_shoe": True,
        # The earned bonus: excellence adds up across parts instead of being diluted by the 15-30% weights. Each
        # part's excess over 7.5 (one routine credit is not excellence) is summed, the single largest is dropped
        # (one strong part is already in the average), and half of the rest is added, at most +0.25: in practice
        # "+0.25 when a second part reaches 8 and nothing is under 7". It fades in as the weakest part goes from
        # 6.5 to 7.0, so a weak part switches it off. The cap is 0.25, not 0.5: at 0.5, a flip-prone color fault
        # (s01's vest read as a third pattern on 2 of 3 runs) switched the whole bonus on and off and moved one
        # photo a full point between runs (batch 1, 48/49 steady); at 0.25 it stays 49/49.
        "earned": {"over": 7.5, "rate": 0.5, "cap": 0.25, "gate": (6.5, 7.0)},
        "solid_line": True,
    },
}
# v3 (Oct 10, the streetwear pass; report rubric/research/parts/streetwear-pass.md, test ../parts3_test.py): v2 plus ONE
# reward, so the defining streetwear shape can earn what the tailored shapes earn. Everything else is v2's.
#   PR4 "the streetwear shape": a boxy top (volume >= 4) worn untucked and ending at or above the fly (cropped /
#   at_belt / mid_fly) over relaxed or wide jeans or cargos, no layer, in an outfit that reads as streetwear and is
#   finished by a street shoe (chunky, basketball, canvas, retro runner, low-profile). Sources: v5-silhouette.md §1
#   "boxy/cropped top + straight or loose leg" (GQ Jun 2023, Mr Porter 2025, H&M 2026: 3 for, 0 against) and §5
#   streetwear's defining silhouette "boxy tee or hoodie + baggy/wide jeans + chunky or basketball sneakers"
#   (Highsnobiety ~2023, H&M, GQ Apr 2025, FashionBeans 2026; medium); proportions.md F4 ("hoodies, sweatshirts and
#   boxy tees are exempt: that's the defining street shape"); style_archetypes.md streetwear "done well" (deliberate
#   volume; a chunky or skate shoe that matches the leg width). "Both loose" is split outside streetwear (GQ 2025
#   "probably not", H&M "goes wrong"), so it's gated on the streetwear read and its shoe, and it is +1.0 (part 8,
#   "a good shape"), below the waist break's +1.5 (6 sources, 0 against). The white leather sneaker is left out on
#   purpose: it's the one sneaker every style shares (smart casual's anchor; minimal, prep and streetwear home), not
#   a street shoe in any source's streetwear silhouette, and the founder's black tee + wide jeans + white leather
#   sneakers is "clean but plain" (his call, Oct 10). A short top that already earns the waist break (PR1) takes the
#   larger of the two, never both: one top, one shape credit.
#   The shoe set flips inside itself between runs (canvas/chunky, low-profile/retro runner) without changing the
#   reward; "street shoe yes/no" held on 50/61 photos where it appears in any run (b1, zoom1, zoom1-stock), and his
#   white leather sneakers read white leather on 3 of 3 runs on all 3 of his photos.
TUNE["v3"] = dict(TUNE["v2"], pr4=1.0,
                  pr4_shoes=frozenset({"chunky_sneaker", "basketball_sneaker", "canvas_sneaker", "retro_runner",
                                       "low_profile_sneaker"}),
                  # what-ifs tested and NOT adopted (see the report): a graphic print as the one standout in
                  # streetwear (graphic vs plain flips on 4 of 12 photos where it's read), and a bigger SW2 (the
                  # chunky split is 3-2, so it stays +0.5)
                  h4_graphic_street=False, sw2=0.5,
                  # also tested and not adopted: a straight leg (pr4_legs), and a hoodie/sweatshirt/graphic tee read
                  # at volume 3 over chunky or basketball sneakers (pr4_signature_v3)
                  pr4_legs=R.LOOSE, pr4_signature_v3=False)
_OFF = dict(pr4=0.0, pr4_shoes=frozenset(), h4_graphic_street=False, sw2=0.5, pr4_legs=R.LOOSE, pr4_signature_v3=False)
TUNE["v1"].update(_OFF)
TUNE["v2"].update(_OFF)
# v4 (Oct 11, the style fairness pass; THE DEFAULT since the main session approved it, outdoor kept at +0.5; the TS
# port and the fix engine moved with it; report rubric/research/parts/style-fairness.md, test ../parts4_test.py). v3 plus
# the defining silhouettes of the two styles that had no path to 8 (v5-silhouette.md §5; style_archetypes.md Q2
# "done well"), each built only from readings that passed (garment type 100%, leg loose/full 94-97%, pooling 98%,
# shoe kind 77% with the set spanning the boot family so a type flip inside "boots" doesn't switch it), each gated
# on its style's detection and its own shoe, like PR4. Sized by evidence, like PR4: medium-strong -> +1.0, weak -> +0.5.
#   PR5 "the workwear silhouette" (+1.0): a chore coat over straight-or-fuller jeans, work pants or cargos, finished by
#   boots (work boots, chukkas, Chelsea boots: the whole kind), in an outfit that reads as workwear. v5-silhouette §5 workwear (1) "chore coat or trucker at
#   the hip + tee + straight/relaxed dark jeans or double-knees, cuffed, boots" (GQ Apr 2025, GQ Sep 2026, Mr Porter
#   2025, Stridewise 2026, Man of Many 2023; medium-strong) and §3: 6 sources pair a chore coat with a straight or fuller
#   leg (GQ Sep 2026: "something sturdy to sit on"); style_archetypes workwear done well "1 hero workwear piece + basics,
#   boots or a heritage sneaker, straight or relaxed leg". The trucker (denim jacket) already earns PR2 (+1.5).
#   Over sneakers it doesn't fire: the founder's call on his friend's chore coat + jeans + low-profile sneakers was
#   ~7 ("this shape didn't earn the points", v5-silhouette §2), and a boot is what the sources name.
#   PR6 "the outdoor silhouette" (+0.5): a fleece, shell or rain jacket over a straight-or-fuller leg, finished by trail
#   shoes, in an outfit that reads as outdoor. v5-silhouette §5 outdoor (1) "relaxed fleece or shell + straight or wide
#   cargo/trail pants + trail shoes" (retailer summaries only: WEAK, so half of PR5) and style_archetypes outdoor done
#   well "1-2 technical pieces + regular basics, trail shoe". The council's own outdoor uniform is a plain fit (RULEBOOK
#   ruling 5), so this is +0.5: it nudges, and the path to 8 still needs a second strong part (a standout color, the
#   look's own shoe).
#   PR2 + track jacket: a track jacket ends at the waist on a ribbed band by type, like a bomber (the PR2 stand-in is
#   the layer's type, because layer length reads 63%). Vintage sport's hero layer over full legs: v5-silhouette §1
#   family (c) "a short layer over a full leg" (GQ Apr 2025, H&M 2026, Mr Porter 2025, Put This On 2018: 4 for, 0
#   against); style_archetypes vintage sport done well "one sport hero piece (jersey or track top) + denim".
TUNE["v4"] = dict(TUNE["v3"],
                  pr5=1.0, pr5_layers=frozenset({"chore_coat"}),
                  pr5_bottoms=frozenset({"jeans", "work_pants", "cargos"}),
                  # the whole boots kind (rubric.py FOOT_KIND): kind is the steady grouping (77% right with close-ups),
                  # type is not (53%), so no line may sit inside "boots" (his suede boots read work boot / chukka)
                  pr5_shoes=frozenset(R.FOOT_KIND["boots"]),
                  pr6=0.5, pr6_layers=frozenset({"fleece", "shell_jacket", "rain_jacket"}),
                  pr6_shoes=frozenset({"trail_shoe"}),
                  short_layers_extra=frozenset({"track_jacket"}),
                  # tested and NOT adopted (see the report): "the look's own shoe" also when the shoe is an anchor of a
                  # style detected WITH the shoe and a non-shoe anchor of that style is worn (sc_pair: outdoor's trail
                  # shoe under a shell over regular basics can't pass the detect-without-the-shoe guard)
                  sc_pair=False,
                  # picks never move a number: H2 ("clearly X top to toe") was judged on the "Reads as" label, which
                  # his picks choose on a tie, so a pick could add H2 (5 of 25,048 reading x pick runs in v3, e.g. a
                  # minimal + smart casual tie picked as smart casual: 7.3 -> 7.7). v4 judges H2 on the label the
                  # outfit gets with no picks (look-alike rules, then the fixed order); the line names that style.
                  h2_pick_free=True)
_OFF4 = dict(pr5=0.0, pr5_layers=frozenset(), pr5_bottoms=frozenset(), pr5_shoes=frozenset(), pr6=0.0,
             pr6_layers=frozenset(), pr6_shoes=frozenset(), short_layers_extra=frozenset(), sc_pair=False,
             h2_pick_free=False)
for _e in ("v1", "v2", "v3"):
    TUNE[_e].update(_OFF4)
# v5 (Oct 11, the style-crossing pass; THE DEFAULT; report rubric/research/parts/style-clash.md, test ../parts5_test.py).
# The founder (Oct 11): "oversized shirts and graphics are good in streetwear, but in minimal or classy they wouldn't
# stand." v4 had no fault for a piece that breaks the rules of the look the REST of the outfit belongs to: an oversized
# graphic tee + pleated trousers + loafers, an oversized hoodie + slim chinos + loafers and an oversized plain tee +
# slim chinos + loafers all scored 7.0. v4.1's style bands (P1) never carried over into the parts.
#   SX1 "a piece from another look" (Cohesion): built only from the style council's own tables (RULEBOOK Part 4), so
#   it isn't new taste: smart casual and classic prep veto the graphic tee and the hoodie (prep: any boxy top), smart
#   casual's band stops at volume 3, minimal vetoes graphics. It fires on a TOP (not under a dressy layer) when
#     (a) the top is street-coded: a graphic tee (the subcategory, never the flip-prone `pattern`), or any top at
#         volume >= 4 (a steady extreme: 97-100%);
#     (b) the rest of the outfit (the top taken out) has at least two of the dressy styles' pieces that streetwear
#         rules out (its vetoes, plus chinos, its one "against" piece): pressed trousers or chinos, loafers / derbies /
#         dress shoes, a collared prep top, tailoring;
#     (c) the rest reads as one of the quiet looks (minimal, smart casual, classic prep: detect_styles on the rest,
#         no picks), and the top breaks EVERY one of them. A graphic tee breaks all three (smart casual and prep veto
#         it by name, minimal by its print; read by the subcategory, so a flip of `pattern` can't switch it). A roomy
#         top breaks a look when the whole outfit no longer reads as it, or its volume is above that look's band
#         (smart casual and prep stop at 3, minimal at 4: an oversized top over straight or wide trousers still reads
#         minimal, the city-boy shape);
#     (d) the top isn't the look's own piece: no style the whole outfit reads as counts it as an anchor or home piece
#         (a roomy knit or oxford in smart casual, a boxy cropped top in minimal).
#   Exempt by design (research-endorsed mixes; cohesion.md H3b, v5-tailoring.md "Hoodie: works with conditions"):
#   a top under a layer that belongs to the quiet look (an anchor or home piece of it in the council's tables: a tee or
#   hoodie under a blazer or a topcoat, a graphic tee under a chore coat or a leather jacket), and every outer layer
#   (the one place a high-low mix works; RULEBOOK ruling 24). A street layer (a bomber, a denim jacket, a puffer)
#   doesn't bridge: the graphic tee under a bomber with pleated trousers and loafers still fires. Shoes are never the
#   odd piece here: loafers with wide jeans are endorsed (RMRS 2026, notes/proportions.md), and Shoes already owns a
#   much-too-dressy shoe (SD3). Athletic bottoms stay the occasion ladder's (one fact, one owner).
#   Size: -3.0 on Style, twice the jacket rule. At Style's 15% weight the existing -1.5 moves the total only 0.225,
#   which leaves all three founder cases at 7.0; -3.0 lands them at 6.5 ("Getting there"). It replaces H1/H2 (an
#   outfit with a piece from another look doesn't "read as" the look) and takes the larger of itself and H3, never both.
#   A graphic tee with only ONE dressy piece in a rest that reads minimal (graphic tee + trousers + white sneakers) is
#   a tip only (SX1_tip): a very common outfit, and the gold set should say how raters judge it.
TUNE["v5"] = dict(TUNE["v4"], sx=3.0,
                  sx_street_tops=frozenset({"graphic_tee"}),
                  sx_dressy=frozenset(R.ST_VETO | R.DRESS_SHOES | R.PREP_TOPS | {"chinos"}),
                  sx_min_dressy=2,
                  sx_quiet={s: R.STYLE_BANDS[s][0][1] for s in ("minimalist", "smart_casual", "classic_prep")})
_OFF5 = dict(sx=0.0, sx_street_tops=frozenset(), sx_dressy=frozenset(), sx_min_dressy=2, sx_quiet={})
for _e in ("v1", "v2", "v3", "v4"):
    TUNE[_e].update(_OFF5)
# v6 (Oct 11, three known differences fixed; THE DEFAULT; report rubric/research/parts/v6.md, test ../parts6_test.py).
# The founder (Oct 11, "go ahead") on rubric/v5-styles.md's KD-3, KD-5 and KD-16:
#   KD-5 (a bug): H2 "clearly X top to toe" was judged on the label only, so a prep marker (a cardigan, a colored
#   oxford) renamed an oxford + chinos + loafers classic prep, whose tables have no signature bottoms or shoes, and the
#   same outfit lost the +1.0 it earned as smart casual. v6 judges H2 on EVERY style the outfit reads as (the detected
#   set, which never depends on his picks) and names the pick-free label in the line (h2_any).
#   KD-16: Event (career fairs, parties) took the interview band (3.5-4.5). The founder approved a softer band (#197):
#   v6 gives it the casual wedding's band, 3-4 (occ_target), between Class (2-3) and Interview (3.5-4.5). Only the
#   too-casual deduction and ceiling (O1) move, by half a level; slides, loungewear, the untucked dress shirt and the
#   no-floor rule at Event are unchanged.
#   KD-3: the style council's per-style bands (RULEBOOK Part 4; rubric.py STYLE_BANDS, joined to DEFAULT_BAND, widen
#   only) come back as ONE Proportions fault, PB1 "roomier than the look", read only on steady groupings: a top at
#   volume >= 4 (97-100% steady; 4 vs 5 and 1 vs 2 aren't, so a band edge inside them can't carry points) and a leg
#   narrow (skinny/slim) vs straight-or-fuller (94%; slim vs straight alone is 40-53%). The council's bands are
#   (top, leg) boxes: the default box holds every regular or close top over any leg, so only a ROOMY top can sit
#   outside every box the outfit reads as. Over a full leg, streetwear, minimal, workwear, vintage sport and outdoor
#   hold it (their volume band reaches 4); over a slim leg only outdoor's box does (slim -> wide): streetwear's volume
#   "never excuses an oversized top over a slim leg" (RULEBOOK). Exempt: a roomy top that's tucked or ends at the belt
#   over a full leg (a deliberate waist: PR1, minimal's boxy anchor), over full-leg pressed trousers (city boy), over
#   loungewear (its ladder), under a layer (the layer sets the line), over skinny legs (PF5 owns it), when FF5 already
#   calls it a size big, and whenever SX1 fires (one fact, one charge). Size -1.5: one band step, the council's own
#   price (v4.1 P1: 0.75 units x 0.6 = 0.45 on the score; here 1.5 x 30% = 0.45). The leg side of the default,
#   smart casual and prep bands (they stop at relaxed) sits on relaxed vs wide, which isn't steady: a tip (PB2).
_LEG_I = {leg: i for i, leg in enumerate(R.LEG_ORDER)}
TUNE["v6"] = dict(TUNE["v5"], pb=1.5,
                  # styles whose (top, leg) box holds a roomy top over a full leg / over a narrow (slim) leg
                  pb_roomy_full=frozenset(s for s, (v, _) in R.STYLE_BANDS.items() if v[1] >= 4),
                  pb_roomy_narrow=frozenset(s for s, (v, lg) in R.STYLE_BANDS.items()
                                            if v[1] >= 4 and _LEG_I[lg[0]] <= _LEG_I["slim"]),
                  # styles whose leg band reaches wide (PB2's tip is for the others and for no style)
                  pb_wide_ok=frozenset(s for s, (_, lg) in R.STYLE_BANDS.items() if lg[1] == "wide"),
                  h2_any=True,
                  occ_target={"event": (3, 4)})
_OFF6 = dict(pb=0.0, pb_roomy_full=frozenset(), pb_roomy_narrow=frozenset(), pb_wide_ok=frozenset(), h2_any=False,
             occ_target={})
for _e in ("v1", "v2", "v3", "v4", "v5"):
    TUNE[_e].update(_OFF6)
# v7 (Oct 11, THE DEFAULT; DECISIONS-LOG #219, test ../parts7_test.py). The founder's re-check of the identical photo
# (Oct 11) read his striped oxford "wrinkled" once and "clean" once: the condition read flips, and it moved points on
# a garment the AI itself only called "likely". v7: a condition read (wrinkled, worn, stained) moves points only on a
# garment read "clear". On a "likely" garment it becomes a Condition tip with no points, everywhere a condition read
# acts: the Condition deduction, ruling 46's "a worn piece earns no credit", the shoes' "look worn" (Shoes) and the
# floor's "no stain or wear" test. (A stain already needed "clear" in every engine.) Nothing else changes.
TUNE["v7"] = dict(TUNE["v6"], cond_clear_only=True)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6"):
    TUNE[_e].update(cond_clear_only=False)
# v8 (Oct 12, the default until v9, #227-228; test ../gold_tune.py, report
# ../../rubric/research/parts/gold-retune.md). The gold set (#224) showed the parts engine barely follows a 5-judge
# panel (r 0.33), and the founder's 20 blind ratings agree with the panel (r 0.69), not the app (-0.09; #225). Every
# change below reads only fields the live reading already has, and was chosen on the TUNE half of the gold photos
# (results/gold-tune/split.json); the test half and the founder's 20 were never used to choose or size anything.
# Each knob is 0/False in v1-v7, so those engines are unchanged.
#   Fit
#     ff5_roomy: a roomy non-tailored top or layer (volume >= 4) with sleeves past the hands is read as the cut, not a
#       size fault: MINOR (0.5) instead of CLEAR (2.0). On the tune half FF5 fired on 6 photos the panel rated 7.8
#       (deliberately boxy shirts, overshirts and bombers; judges: "sleeves run a touch long").
#     ff7_loose: pooling on a loose leg (relaxed / wide) is part of the shape (12 photos, panel 7.3, judges "hems pool
#       slightly"): nothing on loose jeans and cargos (the founder's ruling, #221), MINOR (0.5) on loose trousers or
#       chinos, and it no longer blocks the shape rewards. Pooling on a straight or narrow leg keeps v7's price.
#   Proportions
#     pn_narrow / pn_skinny / pn_rip: a narrow leg (skinny or slim jeans, chinos, cargos or trousers; not a suit's
#       trousers) under the outfit costs pn_narrow, skinny another pn_skinny, ripped narrow jeans another pn_rip.
#       Narrow vs straight-or-fuller is the steady grouping (94%); skinny is right 9/9 when it fires. The panel rated
#       narrow-leg fits 6.2 (n 15) and the founder docks them hardest of anything in his notes ("way too skinny").
#     pr1_loose / pr1_straight: the waist break (a tucked or short top) is worth more over a loose leg than over a
#       straight one (panel 7.9 vs 7.1 on the tune half; v7 gave both +1.5). The mirror-selfie guard keeps its +0.5
#       only over a straight leg: over a loose leg the short top is the look (30 photos, panel 7.6).
#   Shoes
#     sd3_off: no "much dressier than the clothes" charge (loafers or derbies with jeans and a tee; 7 photos, panel 7.7),
#       except with sweats. sw3_off: no "dainty under wide legs" tip (35 photos, panel 7.9).
#     sk2_runner: running shoes off the gym land at 5.0 (v7 6.0; panel Shoes 4.8 on them).
#   Color
#     cp1: one bright piece earns this (v7 +1.0; bright pieces' photos: panel Color 6.7, app 8.0).
#     cl1: a loud print on a top or layer costs this on Color: a bright graphic print, a graphic tee with a large logo, or a
#       large-scale plaid, check, floral, camo or "other" print. Small and medium patterns and stripes are untouched; a
#       big logo on a hoodie or sweatshirt is streetwear's own piece (the panel rated those 7-7.5).
#   Style (Cohesion)
#     h4: the one standout pattern earns this (v7 +0.75; the 17 photos it fired on: panel 6.6).
#     h2 / h2_suit: "clearly X top to toe" / "a suit worn properly" (v7 +1.0 each; panel 7.4 where they fired).
#     tk1: a tank top worn as the only top, out of the house, costs this on Style ("reads gym or undershirt").
_OFF8 = dict(sk1_soft=0.0, lounge_style=0.0, weights=None, pr1_ribbed_loose=False, pr2b=0.0, penalty=None, ff5_roomy=False, ff7_loose=False, pn_narrow=0.0, pn_skinny=0.0, pn_rip=0.0, pr1_loose=None,
             pr1_straight=None, sd3_off=False, sw3_off=False, sk2_runner=None, cl1=0.0, tk1=0.0)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7"):
    TUNE[_e].update(_OFF8)
TUNE["v8"] = dict(TUNE["v7"], ff5_roomy=True, ff7_loose=True, pn_narrow=1.0, pn_skinny=1.0, pn_rip=0.5,
                  pr1_loose=1.5, pr1_straight=0.5, sd3_off=True, sw3_off=True, sk2_runner=5.0,
                  cp1=0.0, cl1=1.5, h4=0.0, h2=0.5, h2_suit=0.5, tk1=2.0,
                  pr1_ribbed_loose=True, pr2b=1.0, sk1_soft=0.5, lounge_style=0.5,
                  weights={"proportions": 0.30, "fit": 0.15, "color": 0.20, "shoes": 0.15, "cohesion": 0.20},
                  penalty={"under": 6.5, "rate": 0.5, "cap": 1.0})
VERSIONS["v8"] = "parts-proto-8 (Oct 12, 2026)"
# v9 (Oct 12, the default until v10; DECISIONS-LOG #232; the founder: "Proceed" on #229's consensus fixes). Four rules most
# stylists agree on, from the stylist critic's 90-outfit check (rubric/research/parts/v8-critique.md, C1-C4). Each
# reads only fields the live reading has; each knob is 0/False in v1-v8.
#   int_top / int_hoodie: an interview needs a collared top, a knit or a jacket. Without one the score is held to
#     int_top (6.0); a hoodie or sweatshirt with nothing over it is held to int_hoodie (5.0). Business-casual guidance
#     is near-universal here, and v8 gave a tucked boxy tee + wide trousers + loafers 8.0 at an interview.
#   dd_same: two denim pieces in the same light or mid wash cost this on Color (the CC5 tip, now a fault); contrasting
#     washes cost nothing and lose the tip. Put This On / GQ: double denim works when the washes differ. Dark raw denim
#     on dark is a deliberate tonal heritage look and stays free (gold ig-040 panel 8.0, rd-009 7.5: judges praise it).
#   gt1: an oversized graphic tee (volume >= 4) under a tailored jacket costs this on Style (KD-9: a blazer excused any
#     top under it). A fitted graphic or plain tee under a blazer stays free.
#   cl1_own: the loud-print fault (CL1) skips a piece that is an anchor or home piece of a style the outfit reads as
#     where loud prints are native (streetwear, workwear, vintage sport, outdoor: a box-logo tee, a buffalo flannel),
#     unless it is bright; never in the quiet looks (an argyle sweater stays loud in smart casual). On v8 a textbook fit led its card
#     with "the big, loud print takes over the outfit".
_OFF9 = dict(int_top=None, int_hoodie=None, dd_same=0.0, gt1=0.0, cl1_own=False)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"):
    TUNE[_e].update(_OFF9)
TUNE["v9"] = dict(TUNE["v8"], int_top=6.0, int_hoodie=5.0, dd_same=1.0, gt1=1.5, cl1_own=True)
VERSIONS["v9"] = "parts-proto-9 (Oct 12, 2026)"
# v10 (Oct 13, the default until v11; "the creators' rules": the founder approved using how his taste sources judge, Tim
# Dessaint, Wanhee Kim, Jaye Alexander, plus Frugal Aesthetic as a fourth voice; rubric/research/creators/
# creators-rules.md, report rubric/research/parts/v10.md). Each reads only fields the live reading has; each knob is
# 0/False in v1-v9.
#   pn_narrow / pn_skinny (moved, B5-B6): slim costs 0.5, skinny 2.0 in all (ripped narrow jeans +0.5 as before). None
#     of the four calls slim "dated"; two are fine with it, two prefer straight; three of four reject skinny.
#   pn_slim_soft: the slim line says "would balance better with a straight leg"; only skinny keeps "read dated".
#   cp1_dark (COL-11, A6/B8): the one-standout credit back in a narrow form: exactly one bright piece, the only
#     non-neutral, earning, no color fault, not a loud print, and at least one other main piece a dark neutral (black,
#     charcoal, navy, dark denim): Wanhee's "tone down: surround a bright piece with black, dark brown or navy".
_OFF10 = dict(pn_slim_soft=False, cp1_dark=0.0)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9"):
    TUNE[_e].update(_OFF10)
TUNE["v10"] = dict(TUNE["v9"], pn_narrow=0.5, pn_skinny=1.5, pn_slim_soft=True, cp1_dark=0.5)
VERSIONS["v10"] = "parts-proto-10 (Oct 13, 2026)"
# v11 (Oct 13, THE DEFAULT; the founder: "yes build both fixes as v11"; creators-rules.md §8, report
# rubric/research/parts/v11.md). Two fixes from the app on the creators' own outfits; each reads only fields the live
# reading has; each knob is 0/False in v1-v10.
#   h3_base_covered (STY-4): a plain base top (a tank or a tee) worn under another top layer (a flannel, overshirt,
#     camp shirt, denim shirt, oxford or dress shirt, cardigan, or anything read as outerwear) is left out of H3's
#     level gap; the layer over it stands for the top half. Tim's white tank under a black flannel with pleated
#     trousers and loafers is the deliberate smart/casual mix all four creators praise (creators-rules A9). The
#     reading has no open/closed field for the outer layer, so it isn't required.
#   pn_lounge_skinny (PRO-13): joggers or sweatpants read skinny (not slim) cost this on Proportions out of the gym
#     and home, on top of the loungewear holds (Tim: "skinny, leather and jogger: three words that should never be in
#     the same sentence"). Skinny is 3 of 73 jogger/sweat readings (4%, all Tim's skinny leather joggers), so ordinary
#     cuffed joggers don't get it and the full skinny total (2.0) is used.
_OFF11 = dict(h3_base_covered=False, pn_lounge_skinny=0.0)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10"):
    TUNE[_e].update(_OFF11)
TUNE["v11"] = dict(TUNE["v10"], h3_base_covered=True, pn_lounge_skinny=2.0)
VERSIONS["v11"] = "parts-proto-11 (Oct 13, 2026)"
# v12 (Oct 14, THE DEFAULT; the founder's calls on his 12 real checks of Oct 14, report rubric/research/parts/v12.md).
# Each reads only fields the live reading has; each knob is 0/False/None in v1-v11.
#   cl1_scale (COL-8): a bright graphic print is loud only at a medium or large scale (or with a large logo). His red tee
#     with a small chest print (pattern_scale small) was charged "the big, loud print" -1.5 for its colour alone. The tee
#     still counts as a bright piece for every colour rule, and the COL-11 guard (_loud_print) uses the same test.
#   pn_narrow / pn_skinny (moved back, PRO-13): slim costs 1.0 again (v10: 0.5), skinny 2.0 in all as before (ripped
#     narrow jeans +0.5 as before). The founder: "all of these jeans were fitted... the silhouettes were bad".
#   pn_fitted_vol (PRO-13 and every rule that groups slim/skinny legs): a bottom read straight at roominess <= this is
#     judged as slim (the AI often calls fitted jeans "straight"; relaxed or wide at 2 or less never occurs in any reading,
#     and leaving them out lets "Not quite right?" escape it by picking relaxed or wide). Not sweats or joggers (their own
#     rules), not a suit's trousers, not under a tailored jacket. Proportions, Fit and Shoes read the judged leg (_leg);
#     style detection ("Reads as") keeps the reading's own leg.
#   ll1 (COL-12): the top (the outer layer when there is one) and the bottoms both in a light neutral (white, cream,
#     khaki), with no dark piece among the clothes (shoes don't count), cost this on Color (not a suit: suit trousers; not a
#     crisp white top over khaki, which is contrast). A colour fault, so it switches
#     off the colour rewards. The founder's taste call (Tim and Wanhee like tonal outfits with a range of shade, which the
#     reading can't see without lightness).
#   wr_look (CON-6): wrinkles by garment and look (rubric/research/notes/wrinkles-streetwear.md): knit tops never (a tee
#     under tailoring 0.2); casual wovens nothing when the outfit reads as a loud-native look, 0.2 otherwise; an oxford
#     with jeans at Everyday or Class 0.2; dressy pieces 0.4 as before; at an interview or event every woven piece keeps
#     its old charge. A waived charge shows nothing, not even the "might be wrinkled" tip.
_OFF12 = dict(cl1_scale=False, pn_fitted_vol=None, ll1=0.0, wr_look=False)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"):
    TUNE[_e].update(_OFF12)
TUNE["v12"] = dict(TUNE["v11"], cl1_scale=True, pn_narrow=1.0, pn_skinny=1.0, pn_fitted_vol=2, ll1=1.0, wr_look=True)
VERSIONS["v12"] = "parts-proto-12 (Oct 14, 2026)"
LIGHT_NEUTRALS = {"white", "off_white_cream", "khaki_beige"}   # v12 COL-12 (light_grey left out: it flips with grey)
LL_DARK = {"black", "charcoal", "navy", "denim_dark", "brown", "burgundy"}   # v12 COL-12: a dark piece anchors it
WR_KNITS = {"tee", "graphic_tee", "hoodie", "sweatshirt", "tank_top"}   # v12 CON-6: knit tops, made to look lived-in
WR_TEES = {"tee", "graphic_tee"}                                       # ... except a tee under tailoring
WR_CASUAL = {"overshirt", "flannel_shirt", "chore_coat", "field_jacket", "camp_collar_shirt", "denim_shirt",
             "denim_jacket", "cargos", "shorts", "drawstring_trousers"}   # v12 CON-6: casual wovens
WR_DRESSY_OCC = {"interview", "interview_corporate", "interview_tech", "event"}   # every woven keeps its charge
WR_CLEAN = {"minimalist", "smart_casual", "classic_prep"}             # v13 CON-6: looks where a crisp tee is part of the look
# v13 (Oct 14, THE DEFAULT; the founder's call on wrinkled knit tops, report rubric/research/parts/v12.md -> "v13").
# v12's two fixed amounts are knobs now (v12: 0.2 each, so v12 is unchanged), plus one new knob (0 in v1-v12):
#   wr_half (CON-6): the half charge (casual wovens off a loud-native look, an oxford with jeans at Everyday or Class).
#   wr_knit_tailored (CON-6): a tee or graphic tee under a tailored jacket.
#   wr_knit_clean (CON-6, new): a knit top (WR_KNITS) when the outfit reads as minimal, smart casual or classic prep and
#     as none of the loud-native looks (streetwear, workwear, vintage sport, outdoor); nothing on those looks or on no
#     clear style. The founder: a crisp tee is part of the minimal and smart casual look.
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"):
    TUNE[_e].update(wr_half=0.0, wr_knit_tailored=0.0, wr_knit_clean=0.0)   # unused there (wr_look is off)
TUNE["v12"].update(wr_half=0.2, wr_knit_tailored=0.2, wr_knit_clean=0.0)
TUNE["v13"] = dict(TUNE["v12"], wr_knit_clean=0.2)
VERSIONS["v13"] = "parts-proto-13 (Oct 14, 2026)"
# v14 (Oct 17, the default until Oct 28; casual and athletic fits, DECISIONS-LOG #331-#335, rubric/research/parts/casual-athletic.md;
# paper test ../casual_athletic_paper.py, whose candidate V12 this engine reproduces exactly). The founder: "fit and context
# should decide these scores, not flat holds", and at Everyday and Class "it should really depend on how good the
# components of the outfit come together": dressing up never earns points by itself. Each knob is 0/False/None in v1-v13.
#   Shorts get Proportions (PRO-1 changes; PRO-15, PRO-16): sh_prop judges shorts like pants (the part starts at 7): +sh_shape
#     for a roomy top worn alone over loose shorts, +sh_layer for a short jacket over them (one credit, at most sh_cap; real
#     shoes in the photo, never slides, runners only at the gym or home); -sh_roomy_fitted for a roomy top over short,
#     fitted shorts; -sh_fitted for short, tight shorts under any top, or shorts that clearly pull.
#   sd1_any_sneaker (SHO-4): any clean sneaker (not running shoes) or boot is a real shoe for "the shoes match"; the
#     window between the shoe and the clothes still decides. (v13: only a shoe at dressiness 2.5+.)
#   sw1_blocks_credit (SHO-4, SHO-7, SHO-9; found in the port): a shoe too heavy for the leg (chunky, basketball or running
#     shoes under slim or skinny legs) earns neither "the shoes match" nor "the look's own shoe". Without it the two new
#     credits offset SHO-9's charge (an oversized hoodie over slim jeans with chunky sneakers went 5.5 -> 6.5).
#   sc_pair (SHO-7, v4's tested-but-off knob): the look's own shoe also counts when the look needs the shoe to be
#     recognised, as long as another piece is that look's anchor (streetwear's sneakers).
#   goes_together (STY-12): +this on Style when the outfit reads as no look (and isn't a suit), every part is at least 7,
#     the shoes earned a credit and no condition fault fired: the credit a look's name gives dressy basics, for any basics.
#   tracksuit (VSP-9): a matched track jacket and track pants: +this on Style.
#   The loungewear ladder (LNG-2, LNG-3, LNG-4, LNG-8, LNG-9): gym_runner_unheld lets gym shorts with running shoes go
#     unheld at Everyday and Class (the parts decide); sweatsuit_sign counts a matched sweatsuit as the dressed upper
#     half, and sweatsuit_shape gives it +this on Proportions in a relaxed shape with a clean sneaker; look_sign counts
#     reading as a look as that sign at Everyday and Class (instead of lounge_style's half point); kit_cap holds a full
#     kit (a jersey with gym shorts) to this, minus kit_fit_rate x what Fit or Proportions lost.
#   pr1_tucked_layer (PRO-4, added Oct 17, DECISIONS-LOG #336, the founder's tucked/untucked pair): a button-up worn open
#     as the one layer (TUCKABLE_LAYERS) and read fully tucked sets the waist like a tucked top: it earns the waist break
#     in its place, and no layer shape credit (PR2b, PR5, PR6) on top. Faults and tips still see it as the layer.
_OFF14 = dict(sh_prop=False, sh_shape=0.0, sh_layer=0.0, sh_cap=0.0, sh_roomy_fitted=0.0, sh_fitted=0.0, sd1_any_sneaker=False,
              goes_together=0.0, tracksuit=0.0, gym_runner_unheld=False, sweatsuit_sign=False, sweatsuit_shape=0.0,
              look_sign=False, kit_cap=None, kit_fit_rate=0.0, sw1_blocks_credit=False,
              pr1_tucked_layer=False, peek_clearly_only=False)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11", "v12", "v13"):
    TUNE[_e].update(_OFF14)
TUNE["v14"] = dict(TUNE["v13"], sh_prop=True, sh_shape=1.0, sh_layer=1.0, sh_cap=1.5, sh_roomy_fitted=1.5, sh_fitted=1.0,
                   sd1_any_sneaker=True, sc_pair=True, goes_together=0.5, tracksuit=0.5, gym_runner_unheld=True,
                   sweatsuit_sign=True, sweatsuit_shape=1.0, look_sign=True, kit_cap=6.0, kit_fit_rate=0.5,
                   sw1_blocks_credit=True, pr1_tucked_layer=True, peek_clearly_only=True)
VERSIONS["v14"] = "parts-proto-14 (Oct 17, 2026)"
# v15 (Oct 28, THE DEFAULT; DECISIONS-LOG #385; the founder's call on his Oct 28 re-check: a zip hoodie layered over a tee should earn
# something; paper test ../hoodie_layer_paper.py). v14 plus one knob (0 in v1-v14):
#   hl (PRO-17): a hoodie or sweatshirt worn as the one layer (HL_LAYERS, category outerwear: the reader files a zip hoodie
#     open over a top there) over a tee or graphic tee (HL_TOPS, every top under it) and full legs earns this on
#     Proportions, the size of the short jacket ([PRO-6]). Like the track jacket (v4), it ends on a ribbed band by type, so
#     its hem sits at the hip whatever its read length (which the reading rarely gives an outer piece); and it's one shape
#     credit: it takes [PRO-14]'s place, never both. The same guards as [PRO-6] (no Proportions fault of 1+, no pooling on
#     a narrow leg, no sweats or joggers, no top showing clearly below, a clean layer), plus: read as ending past the fly,
#     nothing; with slides, nothing (a hoodie, a tee and slides read home; shoes out of the photo are fine, and running
#     shoes pay their own charge on Shoes). Shorts keep their own rules.
#   cp8 (COL-13): on in v15 at 0.5 (below).
#   cp8 (COL-13, Oct 28, the founder's follow-up): the one outer layer picks up the color family of the bottoms (a green
#     hoodie over olive cargos), with a top of another family between them, earns this on Color: the shoes' tie-in
#     ([COL-5]) for the layer. Not white, black, grey, navy or denim (NO_TIE_IN: they repeat by accident), not bright,
#     not sweats or joggers (a matched set is [LNG-9]'s), not tailoring (a suit is one color), only with no color fault.
_OFF15 = dict(hl=0.0, cp8=0.0)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11", "v12", "v13", "v14"):
    TUNE[_e].update(_OFF15)
TUNE["v15"] = dict(TUNE["v14"], hl=1.5, cp8=0.5)
VERSIONS["v15"] = "parts-proto-15 (Oct 28, 2026)"
# v16 (Nov 14, ON PAPER ONLY, T68; DECISIONS-LOG #464-#466; test ../v16_paper.py, results ../results/v16/). Not the
# default: v15 stays the default until the founder says yes and T69 ports it. The parts are v15's, with three
# changes inside them (each a knob, off in v1-v15):
#   v16_color (H3, the rulebook's "When a risky color works"): two brights are charged only with no neutral piece
#     beside them, a loud print or a third color; a strong shape halves the charge (after the parts, below).
#   sty3_off (suit.9): a blazer with loose or washed jeans is no longer charged; the formality-spread rule stays.
#   on a warm day: no light-on-light charge (color.11) and no tank-alone charge (season.3).
# What changes is the step after the parts (see v16_finish): faults count at full strength instead of being averaged
# away, lifts stack to a ceiling, dealbreakers cap, the season counts, a fixed curve maps raw to shown, 3.0-9.5.
_OFF16 = dict(v16=False, v16_color=False, sty3_off=False, v16_alpha=0.5, v16_beta=0.25, curve=(1.0, 1.0, 7.0),
              v16_knit=0.0, v16_h9_cap=False, v16_h7_cap=5.5, taste=None)
for _e in ("v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11", "v12", "v13", "v14", "v15"):
    TUNE[_e].update(_OFF16)
TUNE["v16"] = dict(TUNE["v15"], v16=True, v16_color=True, sty3_off=True,
                   # the worst part's charges count at alpha, every other part's at beta (v15: 15-30% each)
                   v16_alpha=0.5, v16_beta=0.25,
                   # the curve: shown = 7 + a(raw - 7) under 7, 7 + b(raw - 7) over it; fitted once on the gold set
                   # to the target shares by ../v16_paper.py --fit, then fixed here
                   curve=(1.1, 0.7, 7.0),                           # Nov 17 round 5: flatter top for steadiness (was 1.1, 0.85)
                   # layer.5 / ix.33: knit over knit (a cardigan over a sweater) on Style
                   v16_knit=1.5,
                   # H9 as a cap: off, the sleeve read flips between readings (it stays v15's Fit charge)
                   v16_h9_cap=False, v16_h7_cap=5.5,
                   # round 3 (Nov 16): his taste rules, on since his yes ("yea, i want to go the recommended way"):
                   # the base sizes fitted on all 164 rated photos against his consistent key (taste_rules.py --all
                   # --key consistent), each scaled by TASTE_BY_LOOK for the graded look; the creators win clashes
                   # Nov 17 (card by card): + the silhouette lift (SIL, alone), one color free, slides fine on a warm
                   # casual day, runners fine with casual pieces, skinny costs in every look; refit on all 164
                   taste=dict(lift_off=[], h7_tip=True, long_top=0.5, long_top_read="reading", shorts=0, one_lift=0.5,
                              leg_slim=0, color=0, sandals_warm=True, runners_casual=True, sil_mode="alone",
                              one_lift_mode="first", stack_prehalf=True, relaxed_factor=0.5,   # round 5: steadiness
                              sil=1.75, sil_line=0.5, sil_tonal=0.25, leg_skinny=0.5, leg_wide=0.75, hem_plus=0.5,
                              shorts_wide=0.5, shorts_above=0.5))
VERSIONS["v16"] = "parts-proto-16 (Nov 14, 2026, on paper)"
HL_LAYERS = {"hoodie", "sweatshirt"}                             # v15 PRO-17: worn as the layer (outerwear) ...
HL_TOPS = {"tee", "graphic_tee"}                                 # ... over a tee
SPORT_SNEAKERS = {"basketball_sneaker", "chunky_sneaker", "retro_runner", "canvas_sneaker", "low_profile_sneaker",
                  "white_leather_sneaker"}                       # v14: the clean sneakers (not running shoes)
SWEAT_TOPS = {"hoodie", "sweatshirt"}                            # v14: a matched sweatsuit's top ...
SWEAT_BOTTOMS = {"sweatpants", "joggers"}                        # ... and its bottoms
BASE_TOPS = {"tank_top", "tee"}                               # v11 STY-4: plain base tops judged by the layer over them
COVER_TOPS = {"flannel_shirt", "overshirt", "camp_collar_shirt", "denim_shirt", "oxford_shirt", "dress_shirt", "cardigan"}
DARK_NEUTRALS = {"black", "charcoal", "navy", "denim_dark"}   # v10 COL-11: the dark base that tones a bright piece down
LOUD_PRINTS = {"checks_plaid", "floral", "camo", "other"}      # CL1's patterns that are loud at a large scale
INT_TOPS = R.COLLARED | {"sweater", "cardigan", "quarter_zip", "camp_collar_shirt", "flannel_shirt", "overshirt", "denim_shirt"}
INT_OUTERS = (R.DRESSED_OUTER | R.TAILORED_OUTER) - {"track_jacket"}   # any tailored jacket counts (a suit jacket too)
HOODIES = {"hoodie", "sweatshirt"}
LOUD_NATIVE = {"streetwear", "workwear", "vintage_sport", "outdoor"}   # looks whose own pieces are loud by design
WEIGHTS ={"proportions": 0.30, "fit": 0.25, "color": 0.15, "shoes": 0.15, "cohesion": 0.15}
PART_ORDER = ["proportions", "fit", "color", "shoes", "cohesion"]
PART_NAMES = {"proportions": "Proportions", "fit": "Fit", "color": "Color", "shoes": "Shoes", "cohesion": "Style"}
BASE = 7.0                     # every part starts at "fine, nothing off"

# Which reading groupings passed a 3-run steadiness test (>= 90% the same; sources: proportions.md §1 table on
# zoom1/zoom1-stock arm B, fit.md, look1/report.md, b1/report.md; re-measured in parts_test.py on zoom1 arm B).
# Kept here as documentation: every check below names the grouping it reads.
STEADY = {
    "garment type (top / bottom / outer)": "tops 100%, bottoms 100% with close-ups (#104)",
    "tucked full yes/no": "97%",
    "leg narrow (skinny/slim) vs straight-or-fuller": "94% (narrow right 94%)",
    "leg skinny": "right 9/9 when it fires",
    "leg loose (relaxed/wide) yes/no": "97%",
    "top or layer volume >= 4": "97-100%",
    "hem pooling yes/no": "98%",
    "shoe bulky (chunky/basketball)": "98%",
    "shoe kind (boots / sneakers / slides / dress)": "kind 77% right; type 53% (so no cliff may sit inside a kind)",
    "sleeve_end covers_hand": "same in 3 runs 36/39 his, 49/55 stock",
    "strain clear": "63/66, 84/94",
    "second look: peek yes/no": "100% the same, 86% right when it fires (look1)",
    "second look: rests on the shoe yes/no": "94% the same, 97% right when it fires (look1)",
}
# Readings that FAILED or were never tested, so they only make tips here: top length below the crotch (fired 2 of
# 192 runs, both wrong), outer-layer length (63%), the 6-class hem (64-68%; heavy vs light 83%), the stack under a
# blazer, shows_below_outer (0 of 5 peeks), shoulder seam (78%), lightness (passed alone in b1 but isn't in the live
# reading), large logos outside the interview check (flip-flop).

TAILORED = R.TAILORED_OUTER                                   # blazer, suit jacket, sport coat, unstructured blazer
TAILORED_FIT = TAILORED | {"overcoat"}                        # sleeves over the hands read worst on these
RIBBED = {"hoodie", "sweatshirt", "sweater", "cardigan", "quarter_zip", "fleece"}   # ribbed cuffs/hems by design
SHORT_SLEEVE_TYPES = {"tee", "graphic_tee", "tank_top"}       # a "covers_hand" on these is a misread: ignored
PRESSED = {"chinos", "trousers", "suit_trousers", "drawstring_trousers"}
NARROW = {"skinny", "slim"}
FULL_LEG = {"straight", "relaxed", "wide"}                    # flare/bootcut and barrel are aliased by rubric.py
TUCKABLE_LAYERS = {"oxford_shirt", "dress_shirt", "flannel_shirt", "camp_collar_shirt", "denim_shirt", "overshirt"}  # v14 PR1: button-ups worn open
SHORT_LAYERS = {"bomber", "denim_jacket", "leather_jacket"}   # cut to end at the waist/hip by type (R2 stand-in)
BULKY = {"chunky_sneaker", "basketball_sneaker"}
SUIT_SHOES = {"dress_shoe", "derby", "loafer", "chelsea_boot"}   # v2: a suit's own shoes (v5-tailoring.md)
RUNNER = {"performance_runner"}
SLIDES = {"slides_sandals"}
SHORTS = {"shorts", "athletic_shorts"}
LOUNGE_OK = {"gym", "home"}
INTERVIEWISH = {"interview", "interview_corporate", "interview_tech"}
DRESSY_ROOM = INTERVIEWISH | {"event", "wedding_formal", "wedding_casual"}
LINEN_LIKELY = {"drawstring_trousers", "camp_collar_shirt"}
NO_TIE_IN = {"white", "black", "grey", "navy", "denim", "multicolor", None}   # repeat by accident, not a tie-in


def ramp(x, a, b):
    """0 at x <= a, 1 at x >= b, linear between (a < b)."""
    return R.clamp01((x - a) / (b - a))


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def round_half(x):
    return R.round_half(x)


def _fam(g):
    return R.FAMILY.get(g.get("color_family"), g.get("color_family")) if g else None


def _care_fault(g):
    """'stained' (sure) or 'worn' (not excused by a designed distress) or None. Wrinkles never block credits (ruling 46)."""
    c = g.get("condition")
    if c == "stained" and g.get("certainty") == "clear":
        return "stained"
    if c == "pilled_or_worn" and not (g.get("distressed_by_design") and g.get("category") != "footwear"):
        return "worn"           # designed distress excuses wear on clothes only, never scuffs on shoes (condition.md C2)
    return None


def _loud_print(g, t=None):
    """v10 COL-11's guard: a bright graphic print, or a large check, floral, camo or other print (CL1's loud pieces, on
    any garment)."""
    if g.get("pattern") == "graphic" and t is not None and t["cl1_scale"]:     # v12: a small graphic isn't loud
        return g.get("pattern_scale") in ("medium", "large") or g.get("logo") == "large"
    return g.get("pattern") == "graphic" or (g.get("pattern") in LOUD_PRINTS and g.get("pattern_scale") == "large")


def _earns(g):
    """Ruling 46: a stained or worn piece earns no credit in any part."""
    return g is not None and _care_fault(g) is None


def _leg(B, o):
    """v12 (pn_fitted_vol): the leg the Proportions, Fit and Shoes rules judge. A bottom read straight at roominess
    <= pn_fitted_vol is judged slim (the AI often calls fitted jeans "straight"); not sweats or joggers, not a
    suit's trousers, not under a tailored jacket. Style detection keeps the reading's own leg. None in v1-v11."""
    leg = B.get("leg_shape") if B else None
    cut = o["t"]["pn_fitted_vol"]
    if (cut is not None and leg == "straight" and (B.get("volume") or 3) <= cut
            and B.get("subcategory") not in R.LOUNGE_BOTTOMS and B.get("subcategory") != "suit_trousers"
            and not (o["outer"] is not None and o["outer"].get("subcategory") in TAILORED)):
        return "slim"
    return leg


def _refile(garments):
    """Two code-only re-filings the cohesion research needed (cohesion.md), applied to copies for every part:
    - a tank top worn with a collared shirt is a sweater vest the schema can't name (P001): file it as a sweater;
    - a suit jacket without suit trousers is judged as a blazer (the AI's blazer/suit-jacket call is shaky)."""
    gs = [dict(g) for g in garments]
    subs = {g.get("subcategory") for g in gs}
    collared = subs & (R.COLLARED | {"oxford_shirt", "dress_shirt"})
    for g in gs:
        if g.get("subcategory") == "tank_top" and collared and g.get("category") in ("top", "outerwear"):
            g["subcategory"] = "sweater"; g["refiled"] = "tank_top->sweater (vest)"
        if g.get("subcategory") == "suit_jacket" and "suit_trousers" not in subs:
            g["subcategory"] = "blazer"; g["refiled"] = "suit_jacket->blazer (no suit trousers)"
    return gs


def _second_look(sl, t=None):
    """Normalize the optional second look. Accepts the raw look answers ({under_present, under_shows, covers_shoe})
    or the reduced yes/no form ({peek, rests_on_shoe}). Returns {peek: bool|None, rests_on_shoe: bool|None}.
    v14 (peek_clearly_only, Oct 21, #367): only a top that "clearly" shows below the outer piece is a peek; "a little"
    is a deliberate layer (the founder's olive fleece over a black tee), and it's the answer look U gets wrong."""
    out = {"peek": None, "rests_on_shoe": None}
    if not sl:
        return out
    if "peek" in sl or "rests_on_shoe" in sl:
        out.update({k: sl.get(k) for k in out if k in sl})
        return out
    if "under_shows" in sl:
        shows = ("clearly",) if (t or {}).get("peek_clearly_only") else ("a_little", "clearly")
        out["peek"] = bool(sl.get("under_present") == "yes" and sl.get("under_shows") in shows)
    cs = sl.get("covers_shoe")
    if cs in ("partly", "mostly"):
        out["rests_on_shoe"] = True
    elif cs == "no":
        out["rests_on_shoe"] = False
    return out


class _Part:
    """One part's working state: score, reasons (checks that moved it), tips (checks that can't move it yet)."""

    def __init__(self, name):
        self.name, self.score, self.reasons, self.tips, self.na = name, BASE, [], [], None

    def add(self, delta, line, check):
        if abs(delta) < 1e-9:
            return
        self.score += delta
        self.reasons.append({"check": check, "points": round(delta, 3), "line": line})

    def tip(self, line, check, would=None):
        self.tips.append({"check": check, "line": line, "would_cost": would})

    def result(self, lo=2.0, hi=10.0):
        if self.na:
            return {"score": None, "display": None, "na": self.na, "reasons": [], "tips": self.tips}
        s = clamp(self.score, lo, hi)
        return {"score": round(s, 3), "display": round_half(s), "na": None, "reasons": self.reasons, "tips": self.tips}


def _band_fault(o, t):
    """v6's PB1 (see TUNE["v6"]): a roomy top worn on its own that sits outside every (top, leg) box of the council's
    bands the outfit reads as. Returns (points, line) or None."""
    if not t["pb"]:
        return None
    T, O, B = o["top"], o["outer"], o["bottom"]
    if T is None or O is not None or B is None or (T.get("volume") or 3) < 4:
        return None
    leg, bsub, sub = _leg(B, o), B.get("subcategory"), T.get("subcategory") or ""
    narrow, full = leg in NARROW and leg != "skinny", leg in FULL_LEG       # skinny: PF5 owns it
    if not (narrow or full) or bsub in R.LOUNGE_BOTTOMS or o["sx"][0]:
        return None                                                   # loungewear: its ladder; SX1: one fact, one charge
    if T.get("sleeve_end") == "covers_hand" and sub not in SHORT_SLEEVE_TYPES | TAILORED_FIT | RIBBED:
        return None                                                   # FF5 already calls it a size big
    if full and (T.get("tucked") == "full" or T.get("length") in ("cropped", "at_belt") or bsub in PRESSED):
        return None                                                   # a deliberate waist; city boy over trousers
    if any(s in (t["pb_roomy_narrow"] if narrow else t["pb_roomy_full"]) for s in o["det"]):
        return None                                                   # a look the outfit reads as holds it
    what = (sub or "top").replace("_", " ")
    if narrow:
        return t["pb"], f"a roomy {what} over slim legs: an oversized top wants a fuller leg"
    look = f"a {R.STYLE_NAMES[o['label']]} outfit" if o["label"] else "the rest of the outfit"
    return t["pb"], f"the roomy {what} is roomier than {look} calls for"


def _sweatsuit(o):
    """v14: a hoodie or sweatshirt with sweatpants or joggers in the same colour family."""
    up = [g for g in o["tops"] + o["outers"] if g.get("subcategory") in SWEAT_TOPS]
    B = o["bottom"]
    return bool(up and B is not None and B.get("subcategory") in SWEAT_BOTTOMS and any(_fam(g) == _fam(B) for g in up))


def _shorts_proportions(o, t):
    """v14 (PRO-1, PRO-15, PRO-16): shorts judged like pants, from the readings that held on the gold shorts (roominess
    4+ 23/24, loose or not 22/24). Length and socks aren't read, so they never move points."""
    p = _Part("proportions")
    T, O, B, S = o["top"], o["outer"], o["bottom"], o["shoes"]
    vol = B.get("volume") or 3
    loose = B.get("leg_shape") in R.LOOSE or vol >= 4
    fitted = B.get("leg_shape") in NARROW or vol <= 2
    s_sub = S.get("subcategory") if S is not None else None
    real = S is not None and s_sub not in SLIDES and (s_sub not in RUNNER or o.get("occasion") in LOUNGE_OK)
    if T is not None and O is None and (T.get("volume") or 3) >= 4 and fitted and not loose:
        p.add(-t["sh_roomy_fitted"], "a roomy top over short, fitted shorts: it wants a fuller pair", "PS2_roomy_over_fitted")
        return p
    if t["sh_fitted"] and B.get("strain") == "clear":
        p.add(-t["sh_fitted"], "the shorts pull: a size up would sit better", "PS3_fitted_shorts")
        return p
    if t["sh_fitted"] and fitted and not loose:
        p.add(-t["sh_fitted"], "the shorts look short and tight; a fuller pair balances the outfit", "PS3_fitted_shorts")
        return p
    rewards = []
    if loose and real:
        o_sub = O.get("subcategory") if O is not None else None
        if (O is None and T is not None and _earns(T) and T.get("tucked") in (None, "none", "na")
                and T.get("length") != "below_crotch" and (T.get("volume") or 3) >= 4):
            rewards.append((t["sh_shape"], f"a roomy {(T.get('subcategory') or 'top').replace('_', ' ')} over loose shorts: "
                            "a deliberate shape", "PS1_shorts_shape"))
        if (O is not None and _earns(O) and o_sub not in TAILORED
                and (o_sub in (SHORT_LAYERS | {"track_jacket"}) or O.get("length") in ("cropped", "at_belt"))):
            rewards.append((t["sh_layer"], f"a short {(o_sub or 'layer').replace('_', ' ')} over loose shorts",
                            "PS1_shorts_layer"))
    rewards = [x for x in rewards if x[0] > 0]
    if rewards:
        pts, line, check = max(rewards, key=lambda x: x[0])
        p.add(min(pts, t["sh_cap"]), line, check)
    return p


# =====================================================================================================
# PROPORTIONS (30%): length against length, weight against weight. Never a width against his body.
# =====================================================================================================
def _proportions(o, sl, t):
    p = _Part("proportions")
    T, O, B, S = o["top"], o["outer"], o["bottom"], o["shoes"]
    if B is None:
        p.na = "legs not in the photo"; return p
    if B.get("subcategory") in SHORTS:
        if t["sh_prop"]:
            return _shorts_proportions(o, t)                         # v14
        p.na = "shorts (no shorts-length reading yet)"; return p
    leg = _leg(B, o)                                                  # v12: a fitted "straight" leg is judged slim
    lounge = B.get("subcategory") in R.LOUNGE_BOTTOMS
    o_sub = O.get("subcategory") if O else None
    o_tailored = o_sub in TAILORED
    big_top = (T is not None and (T.get("volume") or 3) >= 4) or (O is not None and (O.get("volume") or 3) >= 4)

    # ---- faults that move points today
    faults = 0.0
    if big_top and leg == "skinny":                                   # proportions.md F5 (v4 P2), 1.5
        p.add(-1.5, "a roomy top over skinny legs", "PF5_big_top_skinny_leg"); faults += 1.5
    elif O is not None and leg == "skinny":                           # F6, a trend rule (review 2028)
        p.add(-0.5, f"the {o_sub.replace('_', ' ')} has nothing sturdy to sit on over skinny legs", "PF6_layer_over_skinny")
        faults += 0.5
    if sl["peek"]:                                                    # F10/F11 via the second look; -0.5 at most (look1)
        p.add(-0.5, "the top underneath shows below the outer piece", "PF10_peek")
        faults += 0.5
    pb = _band_fault(o, t)                                            # v6: PB1, the council's bands (0 in v1-v5)
    if pb:
        p.add(-pb[0], pb[1], "PB1_roomier_than_look")
        faults += pb[0]
    # v8 candidate: a narrow leg (0 in v1-v7). Not a suit's trousers; loungewear has its own ladder.
    b_sub = B.get("subcategory")
    if (t["pn_narrow"] and leg in NARROW and b_sub not in R.LOUNGE_BOTTOMS and b_sub != "suit_trousers"
            and not o_tailored):                                      # under a tailored jacket a slim trouser is the norm
        what = (b_sub or "pants").replace("_", " ")
        pts = t["pn_narrow"] + (t["pn_skinny"] if leg == "skinny" else 0.0) + (
            t["pn_rip"] if b_sub == "jeans" and B.get("distressed_by_design") else 0.0)
        subj = f"the {'skinny' if leg == 'skinny' else 'slim'}{' ripped' if b_sub == 'jeans' and B.get('distressed_by_design') else ''} {what}"
        if t["pn_slim_soft"] and leg != "skinny":                     # v10: slim isn't "dated" (creators-rules B6)
            p.add(-pts, f"{subj} would balance better with a straight leg", "PN1_narrow_leg")
        else:
            p.add(-pts, f"{subj} read dated; a straight leg balances the outfit", "PN1_narrow_leg")
        faults += pts
    # v11: skinny joggers or sweatpants out of the gym and home (0 in v1-v10), on top of the loungewear holds
    if (t["pn_lounge_skinny"] and leg == "skinny" and b_sub in R.LOUNGE_BOTTOMS
            and o.get("occasion") not in LOUNGE_OK):
        p.add(-t["pn_lounge_skinny"], f"the skinny {b_sub.replace('_', ' ')} read dated; a relaxed leg balances the outfit",
              "PN1_narrow_leg")
        faults += t["pn_lounge_skinny"]
    if (t.get("pf2_measured") and T is not None and O is None and T.get("tucked") in (None, "none", "na")
            and T.get("_len_measured") == "below_crotch"):
        p.add(-t["pf2_measured"], "the top runs long, past the hip: it shortens the legs", "PF2m_long_top_measured")
        faults += t["pf2_measured"]                                   # what-if (#269, off): the phone measured it

    # ---- tips: real rules whose readings haven't passed (they never move the number)
    if T is not None and O is None and T.get("tucked") in (None, "none", "na") and T.get("length") == "below_crotch":
        p.tip("the top may run long, past the bottom of the fly", "PF2_long_top", would=-2.0 if leg in R.LOOSE else -1.5)
    if O is not None and not o_tailored and O.get("length") == "below_crotch" and leg in R.LOOSE:
        p.tip("a long loose layer over loose legs can shorten the line", "PF3_long_layer_loose_leg", would=-1.5)
    if o_tailored and B.get("hem") in ("pooling", "full_break"):
        p.tip("check the hem: trousers that bunch on the shoes fight a tailored jacket", "PF1_heavy_hem_tailored",
              would=-2.0)
    pf4 = False
    if T is not None and O is None and T.get("subcategory") in ("oxford_shirt", "flannel_shirt", "camp_collar_shirt",
                                                               "dress_shirt") \
            and T.get("tucked") in (None, "none", "na") and leg == "wide" and (T.get("volume") or 3) <= 3:
        p.tip("an untucked shirt over wide legs can hang long; a front tuck gives it shape", "PF4_long_shirt_wide_leg",
              would=-1.0)
        pf4 = True
    # v6: PB2, the leg side of the bands that stop at relaxed (the general standard, smart casual, prep). Wide vs
    # relaxed isn't a steady reading, so it's a tip. Jeans and cargos and a close, short or tucked top are excused
    # (v4.1's leg_excused, #186); loungewear has its own ladder; PF4 already says it for a long shirt.
    if (t["pb"] and not pf4 and leg == "wide" and O is None and T is not None and not lounge
            and not R.leg_excused(B, T, []) and not any(s in t["pb_wide_ok"] for s in o["det"])):
        p.tip("wide trousers under a regular untucked top can swamp it; a tuck or a shorter top balances them",
              "PB2_wide_leg_band", would=-t["pb"])

    # ---- rewards: a deliberate shape. Blocked by any fault of 1+ and by a pooling hem (a shape needs a clean finish).
    # (Heavy-vs-light hem is 83% steady and finds 45% of heavy hems, so it can't block; pooling is 98% steady.)
    blocked = faults >= 1.0 or (B.get("hem") == "pooling" and not (t["ff7_loose"] and leg in R.LOOSE)) or lounge
    full = leg in FULL_LEG
    rewards = []
    # v14 (#336): a button-up worn open over a tee and tucked in sets the waist like a tucked top (the founder's pair)
    tucked_layer = bool(t["pr1_tucked_layer"] and O is not None and len(o["outers"]) == 1
                        and O.get("subcategory") in TUCKABLE_LAYERS and O.get("tucked") == "full")
    T1, O1 = (O, None) if tucked_layer else (T, O)
    if not blocked and full and T1 is not None:
        tuck = T1.get("tucked") == "full"
        short = T1.get("length") in t.get("pr1_short", ("cropped", "at_belt"))
        if short and t.get("pr1_ruler_veto") and T1.get("length") == "at_belt" and T1.get("_waist_ruler") == "low":
            short = False                                              # what-if (#264, off): the phone sees a low waistline
        ribbed_ok = T1.get("subcategory") not in RIBBED or (T1.get("volume") or 3) >= 4 or (
            t["pr1_ribbed_loose"] and leg in R.LOOSE)                 # v8: a knit at the belt over a loose leg
        if O1 is None and _earns(T1) and (tuck or (short and ribbed_ok)):
            pts = t["pr1"] if (tuck or not o.get("mirror")) else t["pr1_mirror_short"]
            if t["pr1_loose"] is not None:                            # v8: the leg sets the size, not the mirror
                pts = t["pr1_loose"] if leg in R.LOOSE else (t["pr1_straight"] if (tuck or not o.get("mirror"))
                                                             else min(t["pr1_straight"], t["pr1_mirror_short"]))
            rewards.append((pts, "a tucked or short top over a full leg gives it a waist", "PR1_waist_break"))
        elif O1 is None and _earns(T1) and T1.get("tucked") == "half" and T1.get("subcategory") not in RIBBED:
            rewards.append((t["pr1b"], "the front tuck gives it a waist", "PR1b_half_tuck"))
    # v3: the streetwear shape (PR4). Same top as the waist break, so it replaces PR1 when larger, never adds to it.
    S_sub = S.get("subcategory") if S is not None else None
    boxy = T is not None and ((T.get("volume") or 3) >= 4 or (                     # what-if knob, off: a hoodie,
        t["pr4_signature_v3"] and T.get("subcategory") in R.ST_TOP_A and S_sub in BULKY))   # sweatshirt or graphic tee at 3
    if (t["pr4"] and not blocked and O is None and T is not None and _earns(T) and boxy
            and T.get("tucked") in (None, "none", "na") and T.get("length") in ("cropped", "at_belt", "mid_fly")
            and leg in t["pr4_legs"] and B.get("subcategory") in ("jeans", "cargos") and "streetwear" in o["det"]
            and S_sub in t["pr4_shoes"]):
        pr1 = next((x for x in rewards if x[2] in ("PR1_waist_break", "PR1b_half_tuck")), None)
        if pr1 is None or pr1[0] < t["pr4"]:
            if pr1 is not None:
                rewards.remove(pr1)
            rewards.append((t["pr4"], "a boxy top over wide legs, finished by street sneakers: the streetwear shape",
                            "PR4_street_shape"))
    # v4 (off in v1-v3): the workwear and outdoor silhouettes (PR5, PR6). Their layers are never PR2's short layers,
    # so one layer earns one shape credit. NOTE: trail_shoe (PR6) and track_jacket (below) aren't values of the live
    # v3 reading yet (schema.json); they fire only on readings that carry them (the council's cases, the next batch).
    if not blocked and full and O is not None and not tucked_layer and _earns(O) and not sl["peek"] and S is not None and _earns(S):
        if (t["pr5"] and o_sub in t["pr5_layers"] and B.get("subcategory") in t["pr5_bottoms"]
                and S_sub in t["pr5_shoes"] and "workwear" in o["det"]):
            rewards.append((t["pr5"], f"a {o_sub.replace('_', ' ')} over a sturdy leg, finished by boots: the workwear shape",
                            "PR5_workwear_shape"))
        elif t["pr6"] and o_sub in t["pr6_layers"] and S_sub in t["pr6_shoes"] and "outdoor" in o["det"]:
            rewards.append((t["pr6"], f"a {o_sub.replace('_', ' ')} over a full leg, finished by trail shoes: the outdoor shape",
                            "PR6_outdoor_shape"))
    if not blocked and full and O is not None and o_sub in (SHORT_LAYERS | t["short_layers_extra"]) and _earns(O) \
            and not sl["peek"]:
        rewards.append((t["pr2"], f"a short {o_sub.replace('_', ' ')} over full legs: a clean, strong shape", "PR2_short_layer"))
    if (t["hl"] and not blocked and full and O is not None and len(o["outers"]) == 1 and o_sub in HL_LAYERS and _earns(O)
            and not sl["peek"] and O.get("length") != "below_crotch" and o["tops"]
            and all(g.get("subcategory") in HL_TOPS for g in o["tops"]) and S_sub not in SLIDES):
        rewards.append((t["hl"], f"the {o_sub} layered over the {T.get('subcategory').replace('_', ' ')} gives it a clean shape",
                        "PR2h_hoodie_layer"))                # v15 (PRO-17): a ribbed-band layer, like the track jacket
    if (t["pr2b"] and not blocked and leg in R.LOOSE and O is not None and not tucked_layer and not o_tailored
            and o_sub not in (SHORT_LAYERS | t["short_layers_extra"]) and O.get("length") in ("cropped", "at_belt")
            and _earns(O) and not sl["peek"]
            and not any(x[2] in ("PR5_workwear_shape", "PR6_outdoor_shape", "PR2h_hoodie_layer") for x in rewards)):
        rewards.append((t["pr2b"], f"a short {(o_sub or 'layer').replace('_', ' ')} over a loose leg: a clean, strong shape",
                        "PR2b_short_layer_read"))           # v8: the layer's own length, read (91% the same on 2 runs)
    if (not blocked and o_tailored and T is not None and T.get("tucked") == "full" and B.get("subcategory") in PRESSED
            and leg != "skinny" and _earns(O)):
        rewards.append((t["pr3"], "a complete tailored line", "PR3_tailored_line"))
    total = 0.0
    for pts, line, check in rewards:
        pts = min(pts, t["prop_cap"] - total)                         # reward cap (+2.0 v1, +2.5 v2)
        if pts > 0:
            p.add(pts, line, check); total += pts
    if not p.reasons and T is not None and O is None and T.get("subcategory") not in RIBBED:
        p.tip("a front tuck, or a jacket that ends at the hip, would give it more shape", "P_next_level")
    # v14 (LNG-9): a matched sweatsuit in a relaxed shape, finished by a clean sneaker (nothing on Proportions off)
    if (t["sweatsuit_shape"] and B.get("subcategory") in SWEAT_BOTTOMS and _sweatsuit(o)
            and not any(r["points"] < 0 for r in p.reasons)):
        top = next(g for g in o["tops"] + o["outers"] if g.get("subcategory") in SWEAT_TOPS)
        good = (B.get("leg_shape") not in NARROW and (B.get("volume") or 3) >= 3 and (top.get("volume") or 3) >= 3
                and ((top.get("volume") or 3) >= 4 or B.get("leg_shape") in R.LOOSE))
        if good and S is not None and S.get("subcategory") in SPORT_SNEAKERS and _earns(S) and _earns(top):
            p.add(t["sweatsuit_shape"], "a matched set in a relaxed shape, finished by clean sneakers", "PR7_sweatsuit_shape")
    return p


# =====================================================================================================
# FIT (25%): each piece's size against its cut. Worst piece counts, plus half of what the others lost.
# Today it can only find faults (no shoulder-seam reading), so a clean outfit tops out at 7.
# =====================================================================================================
MINOR, MODERATE, CLEAR, SEVERE = 0.5, 1.5, 2.0, 4.0


def _piece_faults(g, o):
    cat, sub = g.get("category"), g.get("subcategory") or ""
    out = []
    if cat in ("top", "outerwear"):
        if g.get("sleeve_end") == "covers_hand" and sub not in SHORT_SLEEVE_TYPES:
            vol = g.get("volume") or 3
            if sub in TAILORED_FIT:
                out.append((CLEAR, f"the {sub.replace('_', ' ')}'s sleeves cover the hands", "FF1_sleeves_tailored"))
            elif sub in RIBBED:
                out.append((MINOR, f"the {sub.replace('_', ' ')} cuffs bunch over the hands", "FF1_cuffs_ribbed"))
            elif vol >= 4 and o["t"]["ff5_roomy"]:    # v8: the roomy cut's long sleeves, not a size fault
                out.append((MINOR, f"the roomy {sub.replace('_', ' ')}'s sleeves run past the wrists",
                            "FF5_roomy_sleeves"))
            elif vol >= 4:                       # today's "too big" stand-in: a roomy cut + sleeves past the hand
                out.append((CLEAR, f"the {sub.replace('_', ' ')} looks a size big: roomy, sleeves over the hands",
                            "FF5_too_big"))
            else:
                out.append((MODERATE, f"the {sub.replace('_', ' ')}'s sleeves run past the wrists", "FF1_sleeves_long"))
        if g.get("strain") == "clear":
            out.append((CLEAR, f"the {sub.replace('_', ' ')} pulls", "FF6_strain"))
    elif cat == "bottom":
        hem, leg = g.get("hem"), _leg(g, o)
        drags_on_slides = (sub in ("jeans", "cargos") and leg in R.LOOSE and o["shoes"] is not None
                           and o["shoes"].get("subcategory") in SLIDES)
        if hem == "pooling" and not drags_on_slides:          # loose jeans on slides: Shoes owns that hem
            sev = CLEAR if sub in PRESSED else MINOR if sub in R.LOUNGE_BOTTOMS else MODERATE
            if o["t"]["ff7_loose"] and leg in R.LOOSE:        # v8: a stack on a loose leg is part of the shape
                sev = 0.0 if sub in ("jeans", "cargos") else MINOR   # #221: never a point on baggy jeans or cargos
            if sev:
                out.append((sev, f"the {sub.replace('_', ' ')} pile up on the shoes", "FF7_pooling"))
        if g.get("strain") == "clear":
            sev = MODERATE if leg in NARROW else CLEAR
            out.append((sev, f"the {sub.replace('_', ' ')} pull", "FF6_strain"))
    return out


def _fit(o):
    p = _Part("fit")
    pieces = o["tops"] + o["outers"] + ([o["bottom"]] if o["bottom"] else [])
    if not pieces:
        p.na = "no clothes to check"; return p
    scored = []
    for g in pieces:
        fs = sorted(_piece_faults(g, o), key=lambda f: -f[0])
        drop = min(SEVERE, fs[0][0] + 0.5 * sum(f[0] for f in fs[1:])) if fs else 0.0
        scored.append((drop, g, fs))
        # tip: a full break on a narrow leg (the 6-class hem is 64-68% steady, so it can't move points)
        if g.get("category") == "bottom" and g.get("hem") == "full_break" and _leg(g, o) in NARROW \
                and g.get("certainty") == "clear":
            p.tip("slim pants with a full break run a little long; a hem to just touch the shoe", "FF7b_full_break_narrow",
                  would=-0.5)
    scored.sort(key=lambda x: -x[0])
    worst = scored[0][0]
    others = sum(d for d, _, _ in scored[1:])
    total = worst + 0.5 * others
    if total > 0:
        # one reason line per faulted piece, worst first; the points shown are what the part lost to it
        for i, (d, g, fs) in enumerate(scored):
            if d <= 0:
                continue
            p.add(-(d if i == 0 else 0.5 * d), fs[0][1], fs[0][2])
    return p


# =====================================================================================================
# COLOR (15%): the clothes' colors and patterns (the shoe's color is Shoes'). Faults block the positives.
# =====================================================================================================
def _color(o, boldness, t):
    p = _Part("color")
    main = [g for g in o["main"] if g.get("category") in ("top", "outerwear", "bottom")]
    if len(main) < 2:
        p.na = "fewer than two pieces of clothing in view"; return p
    colored = [g for g in main if g.get("color_family") and g.get("color_family") != "multicolor"]
    accents = {}
    for g in colored:
        c = g["color_family"]
        if c in R.NEUTRALS:
            continue
        accents[_fam(g)] = max(accents.get(_fam(g), 0), 0.5 if R.half_accent(g) else 1.0)
    n_acc = sum(accents.values())
    families = {_fam(g) for g in colored}
    street = "streetwear" in o["det"]
    if n_acc >= 3:
        p.add(-2.5, "too many colors competing", "CC1_too_many_accents")
    elif len(families) >= 5 and n_acc >= 2:
        p.add(-1.0, "a few too many colors", "CC1_busy")
    bright = [g for g in main if R.is_bright(g)]
    if len({_fam(g) for g in bright}) >= 2:
        amt = -1.0 if (boldness == "bold" or street) else -2.0
        if t["v16_color"]:                                            # v16 (H3, rulebook "When a risky color works")
            bf = {_fam(g) for g in bright}
            calm = any(not R.is_bright(g) and g.get("color_family") in R.NEUTRALS for g in o["main"])
            loud = any(_loud_print(g, t) for g in main)
            third = bool({_fam(g) for g in colored if g["color_family"] not in R.NEUTRALS} - bf)
            if calm and not loud and not third:
                p.tip("two bright colors, calmed by the neutral pieces around them", "CC2_calmed")
                amt = 0.0
        if amt:
            p.add(amt, "two bright colors fighting", "CC2_bright_clash")
    jacket = next((x for x in o["outers"] if x.get("subcategory") in R.SEPARATE_JACKETS), None)
    B = o["bottom"]
    if (jacket and B and B.get("subcategory") in ("trousers", "chinos") and jacket.get("color_family") in R.DARK_SUITING
            and B.get("color_family") in R.DARK_SUITING and jacket.get("color_family") != B.get("color_family")):
        p.add(-1.5, "the dark jacket and trousers almost match", "CC4_near_match")
    pats = [g for g in main if g.get("pattern") not in (None, "solid")]
    seen = {}
    for g in pats:
        if g.get("pattern") != "graphic":
            k = (g.get("pattern"), g.get("pattern_scale"))
            seen[k] = seen.get(k, 0) + 1
    if any(n >= 2 and k[1] not in (None, "na") for k, n in seen.items()):
        p.add(-1.5, "two of the same pattern at the same size", "CC6_same_pattern_scale")
    elif any(n >= 2 for n in seen.values()):
        p.add(-0.75, "the same pattern twice", "CC6_same_pattern")
    if len(pats) >= 3 and not street:
        p.add(-1.5, "three patterns at once", "CC6_three_patterns")
    denims = [g for g in main if R.is_denim(g)]
    if t["dd_same"] and any(sum(1 for x in denims if x.get("color_family") == g.get("color_family")) >= 2
                            for g in denims if g.get("color_family") in ("denim_light", "denim_mid")):
        p.add(-t["dd_same"], "double denim in the same wash blurs together; make the washes clearly different",
              "CC5_same_wash_denim")                                   # v9: same light or mid wash is a fault
    if t["cl1"]:                                                      # v8 candidate: a loud print (0 in v1-v7)
        co = R.Outfit(o["main"]) if t["cl1_own"] else None
        own = lambda g: bool(co) and not R.is_bright(g) and any(R.STYLES[st][0](g, co)[0] >= 1 for st in o["det"]  # noqa: E731
                                                                if st in LOUD_NATIVE)
        loud = next((g for g in main if g.get("category") in ("top", "outerwear") and (
            (g.get("pattern") == "graphic" and ((R.is_bright(g) and (not t["cl1_scale"] or _loud_print(g, t)))
                                                or (g.get("logo") == "large" and g.get("subcategory") in ("tee", "graphic_tee"))))
            or (g.get("pattern") in ("checks_plaid", "floral", "camo", "other") and g.get("pattern_scale") == "large"))
            and not own(g)), None)                                    # v9: a look's own loud piece isn't "loud"
        if loud is not None:
            what = (loud.get("subcategory") or "piece").replace("_", " ")
            kind = "print" if loud.get("pattern") == "graphic" else (loud.get("pattern") or "pattern").replace("_", " ").replace("checks plaid", "check")
            p.add(-t["cl1"], f"the big, loud {kind} on the {what} takes over the outfit", "CL1_loud_print")
    if t["ll1"] and not (t["v16"] and o.get("season") == "warm"):    # v12 COL-12 (v16: not on a warm day, color.11)
        up = o["outers"][0] if o["outers"] else o["top"]
        if (up is not None and B is not None and up.get("color_family") in LIGHT_NEUTRALS
                and B.get("color_family") in LIGHT_NEUTRALS and B.get("subcategory") != "suit_trousers"   # a suit is one colour
                and not (up.get("color_family") == "white" and B.get("color_family") == "khaki_beige")   # crisp white over khaki: contrast
                and not any(g.get("color_family") in LL_DARK for g in main)):
            p.add(-t["ll1"], "light on light washes out; a darker pant would anchor it", "CL2_light_on_light")
    fault = bool(p.reasons)
    # tips that need readings we don't have (lightness for muddy/tonal, measured wash for double denim)
    if len(families) == 1:
        p.tip("all one color: a lighter or darker piece would add depth", "CP3_tonal_flat")
    if len(denims) >= 2 and not t["dd_same"]:
        p.tip("double denim: make the washes clearly different", "CC5_denim_near_match", would=-1.0)
    if fault:
        return p
    # positives (only when no fault). P3/P4/P6 need the lightness word, which isn't in the live reading.
    non_neutral = [g for g in colored if g["color_family"] not in R.NEUTRALS]
    pos = []                                                          # (points, line, check); capped below (v2)
    if len(bright) == 1 and len(non_neutral) == 1 and _earns(bright[0]) and t["cp1"]:
        g = bright[0]
        pos.append((t["cp1"], f"the {(g.get('color_family') or 'colour').replace('_', ' ')} {(g.get('subcategory') or 'piece').replace('_', ' ')} is the one standout",
                    "CP1_standout_color"))
        o["credited"].add(id(g))
    elif (t["cp1_dark"] and len(bright) == 1 and len(non_neutral) == 1 and _earns(bright[0])
          and not _loud_print(bright[0], t)
          and any(x is not bright[0] and x.get("color_family") in DARK_NEUTRALS for x in main)):
        g = bright[0]                                                 # v10 COL-11: one accent toned down by dark pieces
        pos.append((t["cp1_dark"], f"the {(g.get('color_family') or 'colour').replace('_', ' ')} {(g.get('subcategory') or 'piece').replace('_', ' ')} "
                    "is the one accent, toned down by the dark pieces around it", "CP1_toned_down"))
        o["credited"].add(id(g))
    elif not bright and len(non_neutral) == 1 and _earns(non_neutral[0]):
        g = non_neutral[0]
        pos.append((t["cp2"], f"the {(g.get('color_family') or 'colour').replace('_', ' ')} {(g.get('subcategory') or 'piece').replace('_', ' ')} is a quiet accent",
                    "CP2_quiet_accent"))
    S = o["shoes"]
    upper = [g for g in main if g.get("category") in ("top", "outerwear")]
    if S is not None and _fam(S) not in NO_TIE_IN and not R.is_bright(S) \
            and any(_fam(g) == _fam(S) for g in upper):
        pos.append((t["cp5"], f"the shoes pick up the {_fam(S).replace('_', ' ')} up top", "CP5_tie_in"))
    L = o["outers"][0] if len(o["outers"]) == 1 else None
    if (t["cp8"] and L is not None and B is not None and _fam(L) not in NO_TIE_IN and _fam(L) == _fam(B)
            and not R.is_bright(L) and not R.is_bright(B) and B.get("subcategory") not in R.LOUNGE_BOTTOMS
            and L.get("subcategory") not in TAILORED and _earns(L) and _earns(B)
            and o["tops"] and all(_fam(g) != _fam(L) for g in o["tops"])):
        pos.append((t["cp8"], f"the {(L.get('subcategory') or 'layer').replace('_', ' ')} picks up the "
                    f"{_fam(L).replace('_', ' ')} of the {(B.get('subcategory') or 'pants').replace('_', ' ')}", "CP8_layer_tie_in"))
    # v2: the lightness credits (color.md P3/P4/P6), only when the reading carries `lightness` on every main piece
    # (and on the shoes for the two that use them). Same logic as the parts1 what-if.
    LV = ("light", "mid", "dark")
    if t["lightness"] and main and all(g.get("lightness") in LV for g in main):
        fams = {_fam(g) for g in main}
        lv = {g.get("lightness") for g in main}
        shoe_l = S.get("lightness") if S is not None and S.get("lightness") in LV else None
        if len(fams) == 1 and fams != {"black"} and len(lv) >= 2:
            pos.append((1.0, f"all {next(iter(fams)).replace('_', ' ')}, with a lighter and a darker piece for depth",
                        "CP3_tonal_range"))
        else:
            tb = [g for g in main if g.get("category") in ("top", "bottom")]
            if shoe_l and tb and len({_fam(g) for g in tb}) == 1 and shoe_l not in {g.get("lightness") for g in tb}:
                pos.append((0.5, "one color top and bottom, anchored by the shoes", "CP4_tonal_shoes"))
        up_l = next((g.get("lightness") for g in main if g.get("category") == "top"), None) or \
            next((g.get("lightness") for g in main if g.get("category") == "outerwear"), None)
        bot_l = next((g.get("lightness") for g in main if g.get("category") == "bottom"), None)
        if shoe_l and up_l and bot_l and len({up_l, bot_l, shoe_l}) == 3:
            pos.append((0.5, "light, mid and dark from top to shoes", "CP6_light_mid_dark"))
    total = 0.0
    cap = t["color_cap"] if t["color_cap"] is not None else 99.0
    for pts, line, check in pos:
        pts = min(pts, cap - total)
        if pts > 0:
            p.add(pts, line, check); total += pts
    return p


# =====================================================================================================
# SHOES (15%): are these the right shoes for these clothes? Same number at every occasion except Gym/Home.
# No cliffs on dressiness (ramps with a flat middle that holds the whole boot family).
# =====================================================================================================
def _match_window(gap):
    """How well the shoe's dressiness matches the clothes', 0..1. gap = clothes' mean - shoe (+ = shoe more casual).
    Flat 1.0 from -1.5 (dressier) to +0.75 (more casual): work boot / chukka / Chelsea under jeans and a hoodie all
    sit inside it. It fades out linearly over the next 0.75 on each side (v4's K4 was a hard 0.75 line)."""
    if gap < -1.5:
        return 1.0 - ramp(-gap, 1.5, 2.25)
    if gap > 0.75:
        return 1.0 - ramp(gap, 0.75, 1.5)
    return 1.0


def _shoes(o, occasion, sl, t):
    p = _Part("shoes")
    S, B = o["shoes"], o["bottom"]
    if S is None:
        p.na = "shoes not in the photo"; return p
    sub = S.get("subcategory")
    if sub == "other":                     # type lost: the app asks "Boots, sneakers or slides?"; on Skip, NA (#123)
        p.na = "shoe type unclear (ask: boots, sneakers or slides?)"; return p
    clothes = [g for g in o["main"] if g.get("category") in ("top", "outerwear", "bottom")]
    if not clothes:
        p.na = "shoes only"; return p
    fs = R.formality(S)
    mean = sum(R.formality(g) for g in clothes) / len(clothes)
    gap = mean - fs
    tailored = any(g.get("subcategory") in TAILORED for g in o["outers"])
    lounge_ok = occasion in LOUNGE_OK
    leg = _leg(B, o) if B else None                                   # v12: a fitted "straight" leg is judged slim
    loose_denim = bool(B and B.get("subcategory") in ("jeans", "cargos") and leg in R.LOOSE)
    athletic_bottom = bool(B and B.get("subcategory") in R.LOUNGE_BOTTOMS)
    up = 1.0                               # how much of the upward moves still apply (shrinks smoothly, never a switch)

    if sub in SLIDES and not lounge_ok:
        p.score = 2.5 if tailored else 4.5
        p.reasons.append({"check": "SK1_slides_out", "points": round(p.score - BASE, 3),
                          "line": "slides read as staying in" + (" under a tailored jacket" if tailored else "")})
        drag = sl["rests_on_shoe"] if sl["rests_on_shoe"] is not None else (B is not None and B.get("hem") in ("pooling", "full_break"))
        if loose_denim and drag:
            p.add(-0.5, "the loose jeans drag on the slides: the hem has nothing to sit on", "SK1b_hem_drags")
        up = 0.0
    elif sub in RUNNER and not lounge_ok and "outdoor" not in o["det"]:
        p.score = 4.5 if tailored else (t["sk2_runner"] if t["sk2_runner"] is not None else 6.0)
        p.reasons.append({"check": "SK2_runners", "points": round(p.score - BASE, 3),
                          "line": "running shoes read gym" + (" under a tailored jacket" if tailored else " with these clothes")})
        up = 0.0
    else:
        if tailored and sub in BULKY:
            p.add(-2.0, "chunky sneakers fight a tailored jacket", "SD4_chunky_under_tailoring")
        # too casual for the clothes: a ramp from 1 to 3 levels (v4 S2 against the average, not the dressiest piece)
        too_casual = 1.5 * ramp(gap, 1.0, 2.0) + 1.0 * ramp(gap, 2.0, 3.0)
        if lounge_ok and sub in SLIDES | RUNNER:
            too_casual = 0.0               # at the gym or at home they're the right shoe (shoes.md)
        p.add(-too_casual, "the shoes are more casual than the clothes", "SD2_too_casual")
        # much dressier than the clothes (dress shoes with a hoodie): a ramp, and it fades the upward moves out
        too_dressy = ramp(-gap, 2.0, 2.5)
        if t["sd3_off"] and not athletic_bottom:
            too_dressy = 0.0               # v8: loafers or derbies with jeans and a tee are a look now (panel 7.7)
        p.add(-0.5 * too_dressy, "the shoes are much dressier than the clothes", "SD3_too_dressy")
        up = 1.0 - too_dressy
        # matches the clothes' dressiness (a real shoe; with sweats only a sneaker matches)
        real = ramp(fs, 2.0, 2.5)
        if athletic_bottom and sub not in R.FOOT_KIND["sneakers"]:
            real = 0.0
        if t["sd1_any_sneaker"] and (sub in SPORT_SNEAKERS or sub in R.FOOT_KIND["boots"]):
            real = 1.0                     # v14: a clean sneaker or boot is a real shoe; the window decides the match
        # v14: a shoe too heavy for the leg (SW1 below) doesn't suit the outfit: no match and no "look's own shoe"
        heavy = t["sw1_blocks_credit"] and leg in NARROW and (sub in BULKY or sub in RUNNER)
        if heavy:
            real = 0.0
        p.add(0.5 * up * real * _match_window(gap), "the shoes match how dressed-up the clothes are", "SD1_matches")
        # chosen for this look: the shoe is an anchor or home shoe of a style the clothes read as WITHOUT the shoe
        # (detection without the shoe, so the shoe can't reward itself; cohesion.md / shoes.md S-C)
        c = R.Outfit(o["main"])
        role = max([R.STYLES[st][0](S, c)[0] for st in o["det_noshoe"]] or [0])
        subs = {g.get("subcategory") for g in o["main"]}
        suit = "suit_jacket" in subs and "suit_trousers" in subs
        if heavy:
            pass
        elif role and _earns(S):
            p.add(0.5 * up, f"a {R.STYLE_NAMES[o['det_noshoe'][0]]} shoe for a {R.STYLE_NAMES[o['det_noshoe'][0]]} outfit"
                  if len(o["det_noshoe"]) == 1 else "the shoes belong to the look", "SC_chosen_for_look")
        elif t["sc_pair"] and _earns(S) and any(
                R.STYLES[st][0](S, c)[0] >= 2 and any(R.STYLES[st][0](g, c)[0] >= 2 for g in o["main"]
                                                       if g.get("category") != "footwear")
                for st in o["det"]):
            # v4 what-if (off): the look's anchor shoe with the look's anchor piece on the body (detected with the shoe)
            p.add(0.5 * up, "the shoes belong to the look", "SC_chosen_for_look")
        elif t["suit_shoe"] and suit and sub in SUIT_SHOES and _earns(S):
            # v2: a matching suit is a look of its own (style detection names none), and these are its shoes
            p.add(0.5 * up, "the right shoes for a suit", "SC_chosen_for_look")
    # shoe weight against the leg (Shoes owns both directions)
    if sub in BULKY and leg in NARROW:
        p.add(-1.5, "chunky sneakers look heavy under narrow legs", "SW1_chunky_narrow")
    elif sub in RUNNER and leg in NARROW:
        p.add(-0.5, "runners look heavy under narrow legs", "SW1_runner_narrow")
    if sub in BULKY and loose_denim and "streetwear" in o["det"] and B.get("hem") != "pooling" and up > 0:
        p.add(t["sw2"] * up, "chunky sneakers carry the wide jeans", "SW2_weight_carries_leg")
    # color (not for slides: their stripes read multicolor in some runs)
    if sub not in SLIDES:
        loud = R.is_bright(S) or S.get("color_family") == "multicolor"
        loud_clothes = sum(1 for g in clothes if R.is_bright(g) or (g.get("pattern") not in (None, "solid") and (
            g.get("pattern_scale") in ("medium", "large") or g.get("pattern") in ("graphic", "camo", "floral"))))
        if loud and loud_clothes >= 1:
            p.add(-0.75, "a loud shoe competing with a loud piece", "SCol1_loud_vs_loud")
        elif loud and loud_clothes == 0 and up > 0 and p.score >= BASE:
            p.add(0.5 * up, "the shoes are the one accent", "SCol2_shoe_accent")
    # wear (Condition skips footwear). A flat -1.0, not shoes.md's cap at 6.0: the worn read flips between runs on
    # about half the photos where it fires (5 of 9 in batch 1) and reads his grey suede boots' nap as wear, so a cap
    # turned one flip-prone read into a 1.5-2 point drop. Work boots and suede (patina, nap) cost half.
    if _care_fault(S):
        half = sub in ("work_boot", "suede_chukka")
        p.add(-0.5 if half else -1.0, "the shoes look worn" if _care_fault(S) == "worn" else "the shoes look dirty", "SQ_worn")
    p.score = clamp(p.score, 2.0, 9.5)
    if leg == "wide" and sub in ("loafer", "dress_shoe", "derby") and not t["sw3_off"]:   # shoe_profile untested: tip
        p.tip("check the shoe isn't swallowed by the wide legs (a slim shoe can look dainty)", "SW3_dainty_wide", would=-1.0)
    return p


def _style_clash(o, t):
    """v5's SX1 (see TUNE["v5"]): a top (not under a dressy layer) that breaks the quiet look the rest of the outfit
    reads as. Returns (points, line, tip): points 0 when it doesn't fire; tip is the one-dressy-piece minimal case's line."""
    if not t["sx"]:
        return 0.0, None, None
    c = None
    tip = None
    for T in o["tops"]:
        sub, vol = T.get("subcategory"), T.get("volume") or 3
        if not (sub in t["sx_street_tops"] or vol >= 4):
            continue
        others = [g for g in o["main"] if g is not T]
        dressy = [g for g in others if g.get("subcategory") in t["sx_dressy"]]
        rest = R.detect_styles(others)["detected"]
        quiet = [s for s in rest if s in t["sx_quiet"]]
        if not quiet:
            continue
        if o["outers"]:
            co = R.Outfit(others)
            if any(R.STYLES[s][0](L, co)[0] >= 1 for L in o["outers"] for s in quiet):
                continue                                              # a dressy layer over it bridges the two looks
        # every quiet look vetoes the graphic tee (smart casual and prep by name, minimal by its print; read by the
        # subcategory, never the flip-prone `pattern`); a roomy top breaks a look when the whole outfit no longer
        # reads as it or the volume is above that look's band
        if sub not in t["sx_street_tops"] and any(s in o["det"] and vol <= t["sx_quiet"][s] for s in quiet):
            continue                                                  # the rest still reads as a look the top fits
        if c is None:
            c = R.Outfit(o["main"])
        if any(R.STYLES[st][0](T, c)[0] >= 1 for st in o["det"]):
            continue                                                  # the top is the look's own piece
        what = "graphic tee" if sub == "graphic_tee" else f"oversized {(sub or 'top').replace('_', ' ')}"
        if len(dressy) >= t["sx_min_dressy"]:
            return t["sx"], f"the {what} and the dressier pieces with it come from different looks", None
        if tip is None and "minimalist" in quiet and sub in t["sx_street_tops"]:
            tip = f"the {what} pulls against the quiet, minimal pieces with it; a plain tee keeps the look"
    return 0.0, None, tip


# =====================================================================================================
# COHESION / STYLE (15%): a narrow, written-down version (the council's tables). "Is the mix deliberate?" stays out.
# =====================================================================================================
def _cohesion(o, boldness, t):
    p = _Part("cohesion")
    if len(o["slots"]) < 2:
        p.na = "fewer than two of top, bottoms and shoes in view"; return p
    det, label = o["det"], o["label"]
    h2_label = o["label_nopick"] if t["h2_pick_free"] else label     # v4: picks never move a number
    subs = {g.get("subcategory") for g in o["main"]}
    suit = "suit_jacket" in subs and "suit_trousers" in subs
    sx, sx_line, sx_tip = o["sx"]                                     # v5 (0 in v1-v4); computed once in score_parts
    if (det or suit) and not sx:
        p.add(t["h1"], f"reads as {R.STYLE_NAMES[label]}" if label else "a matching suit", "H1_reads_as_style")
    # H2: the label style has an anchor (role 2) in all three slots and nothing against it; or a suit over a top
    if sx:
        pass                                                          # v5: a piece from another look: no "reads as"
    elif h2_label and len(o["slots"]) == 3:
        # v6 (h2_any): judged on every style the outfit reads as, not only the named one, so the name a prep marker
        # picks can't take the credit away (KD-5); the line names the pick-free label
        c = R.Outfit(o["main"])
        for st in [h2_label] + ([s for s in det if s != h2_label] if t["h2_any"] else []):
            role = R.STYLES[st][0]
            best, against = {}, 0
            for g in o["main"]:
                pos, neg = role(g, c)
                sl = R.SLOT[g["category"]]
                best[sl] = max(best.get(sl, 0), pos)
                against += neg
            if all(best.get(s, 0) >= 2 for s in ("upper", "bottom", "shoes")) and against == 0:
                p.add(t["h2"], f"clearly {R.STYLE_NAMES[h2_label]} top to toe", "H2_clear_top_to_toe")
                break
    elif suit and o["tops"]:
        p.add(t["h2_suit"], "a suit worn properly over a top", "H2_suit")
    # H3: a piece from another world (the larger of the jacket rule and the spread rule, never both)
    B = o["bottom"]
    h3, h3_line = 0.0, None
    if not t["sty3_off"] and any(x.get("subcategory") in TAILORED for x in o["outers"]) and B and B.get("subcategory") == "jeans" and (
            B.get("leg_shape") in R.LOOSE or B.get("color_family") in ("denim_light", "denim_mid")
            or B.get("distressed_by_design")):
        h3, h3_line = 1.5, "the tailored jacket and the loose or washed jeans come from different worlds"
    nonshoe = [g for g in o["main"] if g.get("category") != "footwear"
               and not (g.get("category") == "bottom" and g.get("subcategory") in R.LOUNGE_BOTTOMS)]
    if t["h3_base_covered"] and (o["outers"] or any(g.get("subcategory") in COVER_TOPS for g in o["tops"])):
        # v11: a tank or tee under another top layer is judged by the layer over it (0 in v1-v10)
        nonshoe = [g for g in nonshoe if not (g.get("category") == "top" and g.get("subcategory") in BASE_TOPS)]
    f = [R.formality(g) for g in nonshoe]
    if len(f) >= 2 and max(f) - min(f) >= 2.5:
        inner = [R.formality(g) for g in nonshoe if g.get("category") != "outerwear"]
        bridged = len(inner) >= 1 and (max(inner) - min(inner) < 2.5 if len(inner) >= 2 else True)
        if not bridged:                                   # an outer layer is the one place a high-low mix works
            amt = 4.0 if max(f) - min(f) >= 3.5 else 1.5
            if amt > h3:
                h3, h3_line = amt, "formal and very casual pieces fight"
    if sx and sx >= h3:                                               # v5: the larger of SX1 and H3, never both
        p.add(-sx, sx_line, "SX1_another_look")
    elif h3:
        p.add(-h3, h3_line, "H3_another_world")
    if sx_tip:
        p.tip(sx_tip, "SX1_tip", would=-t["sx"])
    # v9: GT1 an oversized graphic tee under a tailored jacket (0 in v1-v8; a fitted one stays free)
    if t["gt1"] and any(x.get("subcategory") in TAILORED for x in o["outers"]) and any(
            g.get("subcategory") == "graphic_tee" and (g.get("volume") or 3) >= 4 for g in o["tops"]):
        p.add(-t["gt1"], "an oversized graphic tee fights the tailored jacket; a fitted plain tee works under it",
              "GT1_graphic_under_tailoring")
    # v8 candidate: a tank top as the only top, out of the house (0 in v1-v7; under a collared shirt it's refiled a vest)
    if (t["tk1"] and not o["outers"] and len(o["tops"]) == 1 and o["tops"][0].get("subcategory") == "tank_top"
            and o.get("occasion") not in LOUNGE_OK
            and not (t["v16"] and o.get("season") == "warm")):          # v16: a tank is summer's own top (season.3)
        p.add(-t["tk1"], "a tank top on its own reads gym or undershirt", "TK1_tank_alone")
    # H5: too many statements (v4 B1's focal count, his boldness allowance)
    focal = 0.0
    for g in [x for x in o["main"] if x.get("category") in ("top", "bottom", "outerwear")]:
        focal += 1 if R.is_bright(g) else 0.5 if R.half_accent(g) else 0
        if g.get("pattern") not in (None, "solid") and (g.get("pattern_scale") == "large" or g.get("pattern") in ("graphic", "camo", "floral")):
            focal += 1
    base_allow = {"subtle": 1, "a_little": 1.5, "bold": 2.5}.get(boldness, 1.5)
    allow = base_allow + (1 if "streetwear" in det else 0)
    if focal > allow:
        p.add(-min(1.0, 0.5 * math.ceil(focal - allow)), "too many things compete for attention", "H5_too_many_statements")
    # H4: one standout piece by pattern (a bright color is Color's; one garment, one credit)
    if not o["color_fault"] and focal <= base_allow:
        pat = [g for g in o["main"] if g.get("category") in ("top", "bottom", "outerwear")
               and g.get("pattern") not in (None, "solid", "graphic", "other") and g.get("pattern_scale") not in ("small", "na", None)]
        if t["h4_graphic_street"] and not pat and "streetwear" in det and o["shoes"] is not None \
                and o["shoes"].get("subcategory") in t["pr4_shoes"]:
            # what-if (off in every engine): a graphic print as streetwear's one standout (cohesion.md H4: Modest Man)
            pat = [g for g in o["main"] if g.get("category") in ("top", "outerwear") and g.get("pattern") == "graphic"]
        if len(pat) == 1 and _earns(pat[0]) and id(pat[0]) not in o["credited"]:
            g = pat[0]
            p.add(t["h4"], f"the {(g.get('pattern') or 'patterned').replace('_', ' ')} {(g.get('subcategory') or 'piece').replace('_', ' ')} is the one standout",
                  "H4_standout_piece")
    if t["tracksuit"]:                                                # v14 (VSP-9): a matched tracksuit
        J = [g for g in o["outers"] if g.get("subcategory") == "track_jacket"]
        if J and B is not None and B.get("subcategory") == "track_pants" and _fam(J[0]) == _fam(B):
            p.add(t["tracksuit"], "a matched tracksuit, worn as one set", "H7_tracksuit")
    return p


# =====================================================================================================
# CONDITION: faults only, subtracted after the average (condition.md). Footwear excluded (Shoes owns it).
# =====================================================================================================
CARE_READS = ("wrinkled", "pilled_or_worn", "stained")


def _unsure_care(garments, t):
    """v7 (cond_clear_only): a condition read on a garment that isn't "clear" moves no points. On the engine's own
    copies, the condition becomes "clean" (kept as condition_raw) and a no-points tip is returned for each, in garment
    order. Clothes worn by design were already excused (no tip). Off in v1-v6: nothing changes, no tips."""
    tips = []
    if not t["cond_clear_only"]:
        return tips
    for g in garments:
        c = g.get("condition")
        if c not in CARE_READS or g.get("certainty") == "clear":
            continue
        foot = g.get("category") == "footwear"
        if c == "pilled_or_worn" and g.get("distressed_by_design") and not foot:
            continue
        name = "shoes" if foot else (g.get("subcategory") or "piece").replace("_", " ")
        what = {"wrinkled": f"the {name} might be wrinkled", "pilled_or_worn": f"the {name} might look worn",
                "stained": f"there might be a stain on the {name}"}[c]
        tips.append({"check": "C_unsure_" + {"wrinkled": "wrinkled", "pilled_or_worn": "worn", "stained": "stain"}[c],
                     "line": f"{what}; not counted, it isn't clear enough in the photo", "would_cost": None})
        g["condition_raw"] = c
        g["condition"] = "clean"
    return tips


def _wrinkle_cost(g, o, occasion):
    """CON-1's wrinkle charge for one piece. v12 (wr_look, CON-6): by garment and look; v1-v11: 0.2 on likely-linen
    pieces, else 0.4."""
    sub = g.get("subcategory")
    base = 0.2 if sub in LINEN_LIKELY else 0.4
    t = o["t"]
    if not t["wr_look"]:
        return base
    loud = any(st in LOUD_NATIVE for st in o["det"])
    if sub in WR_KNITS:                                               # knit tops: lived-in...
        if sub in WR_TEES and any(x.get("subcategory") in TAILORED for x in o["outers"]):
            return t["wr_knit_tailored"]                              # ...except a tee under tailoring
        if not loud and any(st in WR_CLEAN for st in o["det"]):
            return t["wr_knit_clean"]                                 # v13: ...and on a minimal, smart casual or prep look
        return 0.0
    if occasion in WR_DRESSY_OCC:                                     # interview or event: every woven keeps its charge
        return base
    if sub in WR_CASUAL:
        return 0.0 if loud else min(base, t["wr_half"])
    if sub == "oxford_shirt" and o["bottom"] is not None and o["bottom"].get("subcategory") == "jeans" \
            and occasion in ("everyday", "class"):
        return t["wr_half"]
    return base


def _condition(o, scene, occasion, tips=()):
    if o["t"]["wr_look"]:                                             # v12 CON-6: a waived wrinkle shows no tip either
        drop, keep = set(), set()
        for g in o["main"]:
            if g.get("category") != "footwear" and g.get("condition_raw") == "wrinkled":
                line = f"the {(g.get('subcategory') or 'piece').replace('_', ' ')} might be wrinkled; not counted, it isn't clear enough in the photo"
                (keep if _wrinkle_cost(g, o, occasion) else drop).add(line)
        tips = [x for x in tips if not (x["check"] == "C_unsure_wrinkled" and x["line"] in drop - keep)]
    if scene.get("lighting") == "dim":
        return {"deduction": 0.0, "faults": [], "display": "couldn't check in this light", "part": None, "tips": []}
    care, faults = 0.0, []
    for g in o["main"]:
        if g.get("category") == "footwear":
            continue
        name = (g.get("subcategory") or "piece").replace("_", " ")
        c = g.get("condition")
        if c == "stained" and g.get("certainty") == "clear":
            care += 1.2; faults.append(f"a stain on the {name}")
        elif c == "wrinkled":
            w = _wrinkle_cost(g, o, occasion)                         # v12 CON-6: by garment and look
            if w:
                care += w; faults.append(f"the {name} looks wrinkled")
        elif c == "pilled_or_worn" and not g.get("distressed_by_design"):
            care += 0.4; faults.append(f"the {name} looks worn")
    care = min(care, 1.6)
    T = o["top"]
    t1 = 0.0
    if T is not None and T.get("subcategory") == "dress_shirt" and T.get("tucked") in ("none", None) and (
            any(x.get("subcategory") in TAILORED for x in o["outers"])
            or (o["bottom"] is not None and o["bottom"].get("subcategory") in ("trousers", "suit_trousers"))
            or occasion in R.DRESSY_OCCASIONS):
        t1 = 0.6; faults.append("the dress shirt is untucked")
    ded = care + t1
    part = None if not care else round_half(max(2.0, BASE - 2.5 * care))
    return {"deduction": round(ded, 3), "faults": faults, "display": "clean" if not faults else "; ".join(faults),
            "part": part, "tips": list(tips)}


# =====================================================================================================
# OCCASION: a step after the average that only holds a score down (occasion.md). Never averaged in.
# =====================================================================================================
O1_CURVE = [(0.75, 7.0), (1.0, 6.0), (1.5, 5.0), (2.0, 4.0), (2.5, 3.5)]   # gap -> ceiling, linear between points


def _o1_ceiling(gap):
    if gap <= O1_CURVE[0][0]:
        return None
    for (g0, c0), (g1, c1) in zip(O1_CURVE, O1_CURVE[1:]):
        if gap <= g1:
            return c0 + (c1 - c0) * (gap - g0) / (g1 - g0)
    return O1_CURVE[-1][1]


def _occasion(o, occasion, t):
    core = []
    for g in o["main"]:
        f = R.formality(g)
        if g.get("category") == "bottom" and g.get("subcategory") in R.LOUNGE_BOTTOMS and occasion in R.ATHLETIC_AS_CASUAL:
            f = max(f, 2)                      # loungewear is O-2's one charge at everyday/class
        core.append(f)
    out = {"deduction": 0.0, "ceiling": None, "lines": [], "status": "right for it"}
    if not core:
        return out
    avg = sum(core) / len(core)
    lo, hi = t["occ_target"].get(occasion) or R.OCCASION_TARGET.get(occasion, (2, 3))   # v6: Event's softer band
    gap = lo - avg
    ded = 0.5 * ramp(gap, 0.25, 0.75)
    ceilings = []
    c1 = _o1_ceiling(gap)
    if c1 is not None:
        ceilings.append((c1, f"too casual for {occasion.replace('_', ' ')}"))
    elif ded > 0:
        out["lines"].append(f"a bit casual for {occasion.replace('_', ' ')}")
    over = avg - hi
    od = 0.5 * ramp(over, 1.5, 2.0)                       # overdressed (> 1.5 above the band): up to -0.5, a ramp
    if od > ded:
        ded = od; out["lines"].append(f"a bit dressy for {occasion.replace('_', ' ')}")
    B, S = o["bottom"], o["shoes"]
    dressy_room = occasion in ("interview", "interview_corporate", "interview_tech", "event")
    if B is not None and B.get("subcategory") in R.LOUNGE_BOTTOMS and occasion not in LOUNGE_OK:
        if dressy_room:
            ceilings.append((4.0, "athletic bottoms at a dressy occasion"))
        else:
            dressed = any(x.get("subcategory") in R.DRESSED_OUTER for x in o["outers"]) or \
                any(g.get("subcategory") in R.DRESSED_TOPS for g in o["tops"])
            if t["sweatsuit_sign"] and _sweatsuit(o):               # v14 (LNG-9): a matched set is chosen on purpose
                dressed = True
            look_sign = False
            if t["look_sign"] and not dressed and o["det"] and occasion in R.ATHLETIC_AS_CASUAL:
                dressed, look_sign = True, True                     # v14 (LNG-2): reading as a look is the sign
            # shoes out of the photo count as a real shoe: what isn't in the photo never costs points
            real_shoe = bool(S is None or S.get("subcategory") not in R.NOT_REAL_SHOES)
            kit = B.get("subcategory") == "athletic_shorts" and any(g.get("subcategory") == "jersey" for g in o["tops"])
            signs = 0 if kit else int(dressed) + int(real_shoe)
            hero = signs == 2 and bool(R.Outfit(o["main"]).hero)
            gym_shorts_ok = B.get("subcategory") == "athletic_shorts" and not kit and real_shoe
            if (t["gym_runner_unheld"] and B.get("subcategory") == "athletic_shorts" and not kit and S is not None
                    and S.get("subcategory") in RUNNER and occasion in R.ATHLETIC_AS_CASUAL):
                gym_shorts_ok = True                                # v14 (LNG-8): the parts decide
            if kit and t["kit_cap"] is not None:                    # v14 (LNG-4): the kit's hold follows its fit
                ceilings.append((t["kit_cap"], "a full kit out of the game"))
                o["kit_hold"] = True
            elif not hero and not gym_shorts_ok:
                lift = t["lounge_style"] if (o["det"] and not look_sign) else 0.0   # v8: a clear style around the sweats
                ceilings.append(({0: 5.5, 1: 6.5, 2: 7.5}[signs] + lift, "loungewear out of the house"))
    if dressy_room and S is not None and S.get("subcategory") in SLIDES:
        ceilings.append((4.0, "slides at a dressy occasion"))
    if occasion in INTERVIEWISH and S is not None and S.get("subcategory") in R.FOOT_KIND["sneakers"] \
            and any(x.get("subcategory") in TAILORED for x in o["outers"]):
        ceilings.append((7.0, "sneakers under a blazer at an interview"))
    if t["int_top"] is not None and occasion in INTERVIEWISH:          # v9: an interview wants a collar, a knit or a jacket
        jacket = any(x.get("subcategory") in INT_OUTERS for x in o["outers"])
        dressed_top = any(x.get("subcategory") in INT_TOPS for x in o["tops"])
        if not jacket and not dressed_top:
            if any(x.get("subcategory") in HOODIES for x in o["tops"] + o["outers"]):
                ceilings.append((t["int_hoodie"], "a hoodie at an interview"))
            else:
                ceilings.append((t["int_top"], "an interview wants a collared shirt, a knit or a jacket"))
    if occasion in INTERVIEWISH and any(g.get("logo") == "large" and g.get("certainty") == "clear" for g in o["main"]):
        ceilings.append((6.5, "a big logo at an interview"))
    out["deduction"] = round(ded, 3)
    if ceilings:
        c, line = min(ceilings, key=lambda x: x[0])
        out["ceiling"] = round(c, 3)
        out["lines"].append(f"{line}: held to {round_half(c)}")
        out["status"] = out["lines"][-1]
    elif out["lines"]:
        out["status"] = out["lines"][0]
    out["dressiness"] = round(avg, 3)
    return out


def _tune(engine="v15", tune=None):
    t = dict(TUNE[engine])
    t.update(tune or {})
    return t


def earned_bonus(part_scores, engine="v15", tune=None):
    """v2's bonus after the average (0 in v1). Every part's excess over `over` (7.5) is summed, the largest single
    excess is dropped (one strong part is already in the average), `rate` of the rest is added, capped at `cap`,
    and the whole bonus fades in as the weakest part goes from gate[0] to gate[1] (6.5 -> 7.0): a weak part turns it
    off without a cliff. Uses the exact part values, so a ramped shoe credit counts in proportion."""
    e = _tune(engine, tune)["earned"]
    if not e or not part_scores:
        return 0.0
    ex = sorted((max(0.0, v - e["over"]) for v in part_scores.values()), reverse=True)
    raw = e["rate"] * sum(ex[1:])
    gate = ramp(min(part_scores.values()), *e["gate"])
    return round(min(e["cap"], raw) * gate, 4)


def piled_penalty(part_scores, engine="v15", tune=None):
    """v8 candidate (None in v1-v7): the mirror of the earned bonus. Each part's shortfall under `under` is summed,
    the largest is dropped (one weak part is already in the average), `rate` of the rest is taken off, capped at `cap`:
    separate problems in different parts add up instead of averaging away."""
    e = _tune(engine, tune)["penalty"]
    if not e or not part_scores:
        return 0.0
    sh = sorted((max(0.0, e["under"] - v) for v in part_scores.values()), reverse=True)
    return round(min(e["cap"], e["rate"] * sum(sh[1:])), 4)


def combine(part_scores, cond, occ, occasion, care_or_strain, engine="v15", tune=None):
    """The steps after the parts: weighted average of the live parts (weights rescaled over the parts present),
    plus v2's earned bonus, minus condition, minus the occasion deduction, held under the occasion ceiling, the 5.0
    floor at everyday/class/home/gym (not when a stain, wear or strain fault fired), the 3.0 floor. Returns
    (average, raw final, floored, wsum). Public so the paper tests can ask "what if a part read differently" without
    a second copy of these steps."""
    t = _tune(engine, tune)
    Wt = t["weights"] or WEIGHTS                                      # v8 candidate: tuned weights (None = WEIGHTS)
    wsum = sum(Wt[k] for k in part_scores)
    avg = sum(Wt[k] * v for k, v in part_scores.items()) / wsum
    x = avg + earned_bonus(part_scores, engine, tune) - piled_penalty(part_scores, engine, tune) - cond["deduction"] - occ["deduction"]
    if occ["ceiling"] is not None:
        x = min(x, occ["ceiling"])
    floored = False
    if occasion in R.FLOOR_OCCASIONS and not care_or_strain and x < R.FLOOR:
        x, floored = R.FLOOR, True
    return avg, max(3.0, min(10.0, x)), floored, wsum


# =====================================================================================================
# v16 (ON PAPER, T68): the step after the parts. DECISIONS-LOG #464 (the plan), #466 (his marks), the creators'
# rulebook (PR #123). Every piece below reads only fields the live reading has, plus the season band he gives.
# =====================================================================================================
# A part credit that is one of the founder's lifts (L1-L7), with its size on the shown score. "layer" lifts count on
# cool days only (a warm day expects no layer, season.8). One lift per id: the largest wins.
V16_LIFTS = {
    "PR1_waist_break": ("L1", None, False),          # size from the part points: 1.0 over a loose leg, else 0.5
    "PR1b_half_tuck": ("L1", 0.5, False),
    "PR4_street_shape": ("L1", 1.0, False),
    "PR3_tailored_line": ("L1", 0.75, False),
    "PS1_shorts_shape": ("L1", 0.75, False),
    "PR7_sweatsuit_shape": ("L1", 0.5, False),
    "PR2_short_layer": ("L2", 1.0, True),
    "PR2b_short_layer_read": ("L2", 0.75, True),
    "PR2h_hoodie_layer": ("L2", 0.75, True),
    "PR5_workwear_shape": ("L2", 1.0, True),
    "PR6_outdoor_shape": ("L2", 0.5, True),
    "PS1_shorts_layer": ("L2", 0.75, True),
    "CP1_standout_color": ("L5", 0.5, False),
    "CP1_toned_down": ("L5", 0.5, False),
    "CP2_quiet_accent": ("L5", 0.5, False),
    "CP5_tie_in": ("L6", 0.25, False),
    "CP8_layer_tie_in": ("L6", 0.25, False),
    "H2_clear_top_to_toe": ("L7", 0.5, False),
    "H2_suit": ("L7", 0.5, False),
}
PRO_PIECES = {"suit_jacket", "blazer", "sport_coat", "unstructured_blazer", "dress_shirt", "suit_trousers", "trousers"}
V16_LIFT_NAMES = {"SIL": "a strong silhouette (a full leg over a real shoe, or a straight line to a dressy shoe)",
                  "L1": "a deliberate shape (a waist, a tuck, the look's own silhouette)", "L2": "a short layer over a full leg",
                  "L3": "an open layer over a tee", "L4s": "a light tonal summer outfit", "L5": "one accent on a calm base",
                  "L6": "a color picked up", "L7": "one look top to toe", "L7b": "one smart piece with casual ones",
                  "SL1": "a fitted top over loose trousers, summer's shape"}
OPEN_LAYERS = {"overshirt", "chore_coat", "cardigan", "flannel_shirt", "denim_shirt", "camp_collar_shirt", "oxford_shirt"}
LIGHT_SHIRTS = {"camp_collar_shirt", "oxford_shirt", "denim_shirt", "dress_shirt"}   # a warm day's light open layer
UNDER_TEES = {"tee", "graphic_tee", "tank_top"}
KNIT_LAYERS = {"sweater", "cardigan", "quarter_zip"}                                # layer.5: knit over knit blurs
HEAVY_LAYERS = {"puffer", "overcoat", "fleece", "leather_jacket"}                    # season.8: wrong in heat
SUMMER_TOPS = {"tee", "tank_top", "polo", "knit_polo"}
SUMMER_BOTTOMS = {"trousers", "chinos", "drawstring_trousers", "jeans", "cargos", "suit_trousers"}
SMART = 4.0                                     # contrast.3 / world.5: a smart garment (trousers, blazer, dress shirt, coat)
# What v16 can't see yet: the rules it would run, and the read each needs (reported on every result)
V16_UNREAD = {
    "S3": "a top hanging past the crotch: the top-length read fails (#465); a tip only",
    "H2": "a tee long in the body over baggy pants: the same top-length read",
    "H7_no_closeup": "pooling: needs the shoe close-up (look L); the main read's hem isn't trusted",
    "L4": "tonal range (one color, light to dark): needs a light/mid/dark read per piece",
    "L8": "two or three textures: needs a fabric read",
    "season.9": "bare ankles in winter: socks aren't read",
    "season.5": "linen and summer fabric: fabric isn't read",
}


def _v16_lifts(o, parts, sl, t):
    """The lifts that fire, after the season: [(id, size, line, layer?)]. One per id, the largest."""
    warm = o.get("season") == "warm"
    best = {}

    def put(lid, size, line, layer=False):
        if size > best.get(lid, (0,))[0]:
            best[lid] = (size, line, layer)
    for k, p in parts.items():
        for r in p.reasons:
            m = V16_LIFTS.get(r["check"])
            if m is None or r["points"] <= 0:
                continue
            lid, size, layer = m
            if size is None:                                          # a tuck over a loose leg is big; "at the belt"
                tucked = any(g.get("tucked") == "full" for g in o["tops"] + o["outers"])   # is a weak read: 0.5
                size = 1.0 if (r["points"] >= 1.5 and tucked) else 0.5
            put(lid, size, r["line"], layer)
    T, O, B, S = o["top"], o["outer"], o["bottom"], o["shoes"]
    leg = B.get("leg_shape") if B else None
    prop_fault = any(r["points"] < 0 for r in parts["proportions"].reasons)
    color_fault = any(r["points"] < 0 for r in parts["color"].reasons)
    # L3: an open layer over a tee (sheet L3 + creators: the inner layer shows, in a contrasting color)
    if (len(o["outers"]) == 1 and O.get("subcategory") in OPEN_LAYERS and _earns(O) and O.get("tucked") != "full"
            and o["tops"] and all(g.get("subcategory") in UNDER_TEES for g in o["tops"])
            and all(_fam(g) != _fam(O) for g in o["tops"]) and not sl["peek"] and "L2" not in best):
        light = O.get("subcategory") in LIGHT_SHIRTS
        put("L3", 0.5, f"the open {O.get('subcategory').replace('_', ' ')} over the "
            f"{o['tops'][0].get('subcategory').replace('_', ' ')} adds a layer", layer=not light)
    # L6: black or navy picked up subtly by the shoes (the creators' change): one upper piece, not the bottoms
    if S is not None and S.get("color_family") in ("black", "navy") and _earns(S) and "L6" not in best and not color_fault:
        c = S.get("color_family")
        up = [g for g in o["tops"] + o["outers"] if g.get("color_family") == c]
        if len(up) == 1 and B is not None and B.get("color_family") != c and len(o["tops"] + o["outers"]) >= 1:
            put("L6", 0.25, f"the {c} shoes pick up the {c} {up[0].get('subcategory').replace('_', ' ')}")
    # L7b: one smart piece with casual ones, two levels of dressiness, never three (contrast.1-3, world.5)
    cohesion_neg = [r["check"] for r in parts["cohesion"].reasons if r["points"] < 0]
    covered = bool(o["outers"]) or any(g.get("subcategory") in COVER_TOPS for g in o["tops"])
    clothes = [g for g in o["main"] if g.get("category") != "footwear"
               and not (covered and g.get("category") == "top" and g.get("subcategory") in BASE_TOPS)]
    f = [R.formality(g) for g in clothes]
    lounge = B is not None and B.get("subcategory") in R.LOUNGE_BOTTOMS
    subs = {g.get("subcategory") for g in o["main"]}
    suit = "suit_jacket" in subs and "suit_trousers" in subs
    casual = [g for g in o["main"] if g.get("category") != "footwear" and R.formality(g) <= 2]
    if (len(clothes) >= 2 and max(f) >= SMART and casual and max(f) - min(f) <= 2.5 and not lounge and not suit
            and not cohesion_neg and "L7" not in best and all(_earns(g) for g in o["main"])):
        smart = max(clothes, key=R.formality)
        put("L7b", 0.5, f"the {smart.get('subcategory').replace('_', ' ')} dresses up the casual pieces: one smart piece, done right")
    if warm:
        # SL1: a fitted tee or a tank over loose trousers (season.3, Frugal's "tight waist wide legs")
        if (not o["outers"] and T is not None and len(o["tops"]) == 1 and T.get("subcategory") in SUMMER_TOPS
                and ((T.get("volume") or 3) <= 2 or T.get("subcategory") == "tank_top") and leg in R.LOOSE
                and B.get("subcategory") in SUMMER_BOTTOMS and not prop_fault and _earns(T)
                and best.get("L1", (0,))[0] < 0.75):
            best.pop("L1", None)                                      # one top, one shape credit: the larger one
            put("SL1", 0.75, "a fitted top over loose trousers: summer's shape")
        # L4s: a light tonal outfit (color.11): the top half and the bottoms in light neutrals, nothing dark
        up = o["outers"][0] if o["outers"] else T
        if (up is not None and B is not None and up.get("color_family") in LIGHT_NEUTRALS | {"light_grey"}
                and B.get("color_family") in LIGHT_NEUTRALS | {"light_grey"} and not color_fault
                and not any(g.get("color_family") in LL_DARK for g in o["main"] if g.get("category") != "footwear")):
            put("L4s", 0.5, "light, tonal and clean: a summer look")
        best = {k: v for k, v in best.items() if not v[2]}           # layer lifts count on cool days only
    return [(k, v[0], v[1], v[2]) for k, v in sorted(best.items())]


# The part charges each dealbreaker owns: when the cap fires it replaces them (one fact, one charge), so the cap is
# where the score lands when the rest is fine, and only other faults take it lower.
V16_OWNS = {
    "S1": {"PF5_big_top_skinny_leg", "PF6_layer_over_skinny", "PN1_narrow_leg", "PB1_roomier_than_look"},
    "S4": {"CC1_too_many_accents", "CC1_busy", "CC2_bright_clash", "H5_too_many_statements", "SCol1_loud_vs_loud"},
    "S6": {"H3_another_world", "SD3_too_dressy"},
    "S8": {"H3_another_world", "SD3_too_dressy"},
    "S9": set(),                                                      # the stain's Condition charge (below)
    "H7": {"FF7_pooling"},
    "H1": {"PB1_roomier_than_look", "PN1_narrow_leg"},
    "H3": {"CC2_bright_clash"},
    "H4": {"PN1_narrow_leg"},
    "H8": {"FF6_strain"},
    "H9": {"FF1_sleeves_tailored", "FF1_sleeves_long", "FF5_too_big", "FF5_roomy_sleeves"},
    "H10": {"SW1_chunky_narrow"},
    "H11": {"SK2_runners", "SD4_chunky_under_tailoring"},
}
V16_OWNS["S2"] = V16_OWNS["S1"]
# Charges whose read flips between the two stored gold readings on half or more of the photos where they fire
# (v16_paper.py's steadiness table: sleeves past the hands 67-71%, the main read's pooling hem 50%). Under v15's
# averaging they moved a score by 0.1-0.3; at full strength they would swing it, so in v16 they stay on the card and
# move no points (the design rule since #198). Pooling moves points through the shoe close-up instead (H7).
V16_UNSTEADY = {"FF1_sleeves_tailored", "FF1_sleeves_long", "FF1_cuffs_ribbed", "FF5_too_big", "FF5_roomy_sleeves",
                "FF7_pooling"}
for _r in ("S5", "S7", "H6", "H5"):
    V16_OWNS[_r] = {"X_" + _r}                                         # only when it sinks (a second fault)


def _v16_caps(o, parts, sl_raw, occasion, t):
    """Dealbreaker caps (#466), on reliable reads only: [(cap, id, kind, line)], kind 'sink' or 'hold'."""
    out = []
    T, O, B, S = o["top"], o["outer"], o["bottom"], o["shoes"]
    bsub = B.get("subcategory") if B else None
    leg = B.get("leg_shape") if B else None                          # the reading's own leg: no fitted-straight guess
    s_sub = S.get("subcategory") if S else None
    uppers = o["tops"] + o["outers"]
    lounge = bsub in R.LOUNGE_BOTTOMS
    # S1 / S2: a hoodie or sweatshirt, or an oversized top, over skinny legs (one fact: one sink)
    if B is not None and leg == "skinny" and not lounge and bsub not in SHORTS:
        hood = next((g for g in uppers if g.get("subcategory") in HOODIES), None)
        big = next((g for g in uppers if (g.get("volume") or 3) >= 4), None)
        if hood is not None:
            out.append((5.5, "S1", "sink", f"the {hood.get('subcategory')} over skinny {bsub}: a straight leg fixes it"))
        elif big is not None:
            out.append((5.5, "S2", "sink", f"the oversized {big.get('subcategory').replace('_', ' ')} over skinny {bsub}: "
                        "a straight or wider leg fixes it"))
    # S4: three or more bright colors (clothes and shoes)
    br = {_fam(g) for g in o["main"] if R.is_bright(g)}
    if len(br) >= 3:
        out.append((4.5, "S4", "sink", "three bright colors at once: keep one, make the rest neutral"))
    # S6: a blazer or sport coat with sweatpants or joggers (an overcoat or a shirt over plain sweats is spared)
    if bsub in ("sweatpants", "joggers") and any(g.get("subcategory") in R.SEPARATE_JACKETS for g in o["outers"]):
        out.append((5.5, "S6", "sink", f"a blazer with {bsub}: two worlds that don't meet"))
    # S8: dress shoes with gym shorts or sweats (minimal loafers with plain sweats spared)
    if lounge and (s_sub in ("dress_shoe", "derby") or (s_sub == "loafer" and bsub == "athletic_shorts")):
        out.append((5.5, "S8", "sink", f"{s_sub.replace('_', ' ')}s with {bsub.replace('_', ' ')}"))
    # S9: a visible stain, read clear, not on a piece distressed by design
    st = next((g for g in o["main"] if g.get("category") != "footwear" and g.get("condition") == "stained"
               and g.get("certainty") == "clear" and not g.get("distressed_by_design")), None)
    if st is not None:
        out.append((5.5, "S9", "sink", f"a stain on the {st.get('subcategory').replace('_', ' ')}"))
    # H7: pooling over the shoe, from the shoe close-up (look L "mostly"); a soft stack on a loose leg is free
    if sl_raw and sl_raw.get("covers_shoe") == "mostly" and B is not None and leg not in R.LOOSE and bsub not in SHORTS:
        h7 = t.get("v16_h7_cap", 5.5)
        out.append((h7, "H7", "sink" if h7 <= 5.5 else "hold", f"the {bsub} pile up over the shoes: a shorter hem fixes it"))
    # H1: an oversized top over slim legs (outdoor's fleece over slim cargos is spared)
    big = next((g for g in uppers if (g.get("volume") or 3) >= 4), None)
    if (big is not None and leg == "slim" and not lounge and bsub not in SHORTS
            and not any(s in t["pb_roomy_narrow"] for s in o["det"])):
        out.append((6.5, "H1", "hold", f"the oversized {big.get('subcategory').replace('_', ' ')} over slim {bsub}"))
    # H3: two brights that clash (after the v16 color nuance), unless a strong shape softened it
    if any(r["check"] == "CC2_bright_clash" for r in parts["color"].reasons) and not any(
            r["check"] == "CC2s_shape_softens" for r in parts["color"].reasons):
        out.append((6.5, "H3", "hold", "two bright colors fighting"))
    # H4: skinny joggers or sweatpants out of the house
    if bsub in ("joggers", "sweatpants") and leg == "skinny" and occasion not in LOUNGE_OK:
        out.append((6.5, "H4", "hold", f"skinny {bsub}"))
    # H8: a top that clearly pulls
    tight = next((g for g in uppers if g.get("strain") == "clear"), None)
    if tight is not None:
        out.append((6.5, "H8", "hold", f"the {tight.get('subcategory').replace('_', ' ')} pulls: a size up"))
    # H9: sleeves over the hands (roomy pieces cut long, ribbed knits and a relaxed blazer spared), read clear
    sl_g = next((g for g in uppers if g.get("sleeve_end") == "covers_hand" and g.get("certainty") == "clear"
                 and g.get("subcategory") not in SHORT_SLEEVE_TYPES | RIBBED | {"unstructured_blazer"}
                 and (g.get("volume") or 3) <= 3), None)
    if sl_g is not None and t["v16_h9_cap"]:     # off: the read flips between readings (3 of the 12 unsteady gold photos)
        out.append((6.5, "H9", "hold", f"the {sl_g.get('subcategory').replace('_', ' ')}'s sleeves cover the hands"))
    # H10: chunky sneakers under slim or skinny legs (6.0, his "maybe even a lesser rating")
    if s_sub in BULKY and leg in NARROW:
        out.append((6.0, "H10", "hold", "chunky sneakers under narrow legs"))
    # H11: suit or dress trousers with chunky or running shoes
    if bsub in ("suit_trousers", "trousers") and (s_sub in BULKY or s_sub in RUNNER):
        out.append((6.5, "H11", "hold", f"{s_sub.replace('_', ' ')}s with {bsub.replace('_', ' ')}"))
    return out


def _v16_depends(o, parts, t):
    """S5, S7, H6, H5 (#466 "it should also depend on other factors"): a clash charge on Style that grows when color
    or shape is also weak and shrinks when both are strong. Returns (id, base, factor) or None."""
    B, S = o["bottom"], o["shoes"]
    if B is None or B.get("subcategory") not in SHORTS:
        return None
    gym = B.get("subcategory") == "athletic_shorts"
    blazer = any(g.get("subcategory") in R.SEPARATE_JACKETS for g in o["outers"])
    leather = any(g.get("subcategory") == "leather_jacket" for g in o["outers"])
    if blazer:
        rid, base = ("S5", 2.0) if gym else ("H6", 1.0)
    elif leather:
        rid, base = ("S7", 1.5) if gym else ("H5", 0.75)
        if not gym and B.get("color_family") in ("black", "charcoal") and S is not None and S.get("subcategory") in R.FOOT_KIND["boots"]:
            return None                                               # black tailored shorts and boots: the sheet's "not when"
    else:
        return None
    neg = lambda k: any(r["points"] < 0 for r in parts[k].reasons)   # noqa: E731
    pos = lambda k: any(r["points"] > 0 for r in parts[k].reasons)   # noqa: E731
    weak = neg("color") or neg("proportions") or neg("fit")
    strong = pos("color") and pos("proportions") and not weak
    return rid, base, 1.5 if weak else 0.5 if strong else 1.0


def _v16_curve(raw, t):
    """shown = 7 + a(raw - k) under k, 7 + b(raw - k) over it: a fixed, monotone two-slope map, k the raw score shown
    as 7.0."""
    a, b, k = t["curve"]
    return 7.0 + (a if raw < k else b) * (raw - k)


# ---- Round 3: his taste rules, keyed by the look the outfit is graded as (T68, Nov 16; the founder's yes:
# "yea, i want to go the recommended way" = patterns yes, rules follow the outfit's own look (A), the creators win
# where his ratings and theirs clash, Tailored recognized in scoring). The table is rubric/research/rules-by-style.md
# §3 (PR #127): 1 = the rule's size, 0.5 = half, 0 = off, "2nd" = the first color is free. A mix takes, rule by rule,
# the friendliest value over its looks (the largest plus, the gentlest charge). A look missing from a row = 1.
TL_JACKET = {"suit_jacket", "blazer", "sport_coat", "unstructured_blazer"}
TL_NEVER = {"jeans", "chinos", "cargos", "sweatpants", "joggers", "shorts", "athletic_shorts", "track_pants",
            "chunky_sneaker", "performance_runner", "basketball_sneaker", "slides_sandals", "work_boot", "hoodie",
            "sweatshirt", "graphic_tee", "tank_top", "jersey", "fleece"}
TASTE_BY_LOOK = {
    # a. wide or relaxed legs: full where the look is built on volume; off in tailored (sil.8, suit.5)
    "leg_wide": {"vintage_sport": 0.5, "outdoor": 0.5, "workwear": 0.5, "streetwear": 1, "tailored": 0,
                 "classic_prep": 0.5, "minimalist": 1, "smart_casual": 0.5, "none": 0.5},
    # c. roomy shorts follow the wide-leg column (tailored never has shorts)
    "shorts_wide": {"vintage_sport": 0.5, "outdoor": 0.5, "workwear": 0.5, "streetwear": 1, "tailored": 0,
                    "classic_prep": 0.5, "minimalist": 1, "smart_casual": 0.5, "none": 0.5},
    # d. colors beside the neutrals: off in the loud looks, the first free in prep and workwear (world.15, color.12)
    "color": {"vintage_sport": 0, "outdoor": 0, "workwear": "2nd", "streetwear": 0, "tailored": 1,
              "classic_prep": "2nd", "minimalist": 0.5, "smart_casual": 1, "none": 0.5},
    # e. a hem covering the shoe, wide legs only (prop.9; off in tailored, suit.3; half where prop.14 asks more)
    "hem_plus": {"vintage_sport": 1, "outdoor": 1, "workwear": 1, "streetwear": 1, "tailored": 0,
                 "classic_prep": 0.5, "minimalist": 1, "smart_casual": 0.5, "none": 1},
    # g. one accent (L5): a lift in every look since Nov 17 (the founder: one accent on a neutral base is Wanhee's
    # "point", color.2), so it has no row here
    # j. a long top: half where a long street proportion can work (prop.16)
    "long_top": {"vintage_sport": 0.5, "streetwear": 0.5},
}


# the Nov 16 accent row (minimal and tailored full, smart casual half, the rest off); used when taste["accent_by_look"]
L5_BY_LOOK = {"vintage_sport": 0, "outdoor": 0, "workwear": 0, "streetwear": 0, "tailored": 1, "classic_prep": 0,
              "minimalist": 1, "smart_casual": 0.5, "none": 0}


def is_tailored(main):
    """specs/tailored.md TL1: a tailored jacket and dress trousers, nothing from the 'never' list, nothing at
    roominess 5 (with a jacket and dress trousers in view, TL1's points rule always passes)."""
    subs = {g.get("subcategory") for g in main}
    return (bool(subs & TL_JACKET) and bool(subs & {"suit_trousers", "trousers"}) and not subs & TL_NEVER
            and all((g.get("volume") or 3) < 5 for g in main))


def graded_looks(o, graded_look=None):
    """The look(s) the taste rules follow. graded_look: a look key or a list of them (his pick after the photo, when
    that step exists); None = the outfit's own looks: the pick-free detected set, plus Tailored by TL1. Never his
    profile picks. An empty set grades as "none"."""
    if graded_look:
        g = {graded_look} if isinstance(graded_look, str) else set(graded_look)
    else:
        g = set(o["det"])
        if is_tailored(o["main"]):                                   # TL2's look-alike rule: Tailored stands for the
            g = (g - {"smart_casual", "classic_prep"}) | {"tailored"}  # smart casual or prep it also passes
    return g or {"none"}


def _look_val(rule, looks):
    row = TASTE_BY_LOOK.get(rule)
    return [1 if row is None else row.get(lk, 1) for lk in looks]


def _v16_taste(o, sl_raw, lifts, caps, t, parts=None):
    """Round 3 (T68, Nov 16): the founder's taste patterns as rules, all base sizes in t["taste"] (None = off), each
    scaled by TASTE_BY_LOOK for the look(s) the outfit is graded as (o["graded"]). Returns (lifts, caps, items):
    lifts and caps after the taste rules, and the raw-score adjustments [(points, id, line)].
      lift_off   lifts that never count (empty since the creators won the clash: L3 and L7b count everywhere, L5 by look)
      one_lift   a single remaining lift counts at this fraction (his taste in every look: one lift isn't a step)
      h7_tip     the pooling cap becomes a tip
      hem_plus   a hem that covers most of the shoe (look L) on a wide or relaxed leg (never on a straight one: prop.1)
      leg_skinny, leg_slim, leg_wide   leg width, graded
      shorts, shorts_wide   a shorts charge (0: no creator calls shorts a fault) and roomy shorts (volume 4-5)
      shorts_above  shorts that end above the knee (the October narrow look, second_look["shorts_end"]; not in the
                 app's second looks yet): a charge, never a cap
      color      each color beyond neutrals and denim, up to two
      long_top   an untucked top with no jacket that ends low, half a point at most, never a cap; long_top_read
                 "reading" (default: the reading's below_crotch) or "ruler" (the Mac's body ruler, second_look["long_top"])"""
    T = t.get("taste")
    if not T:
        return lifts, caps, [], set()
    looks = o.get("graded") or {"none"}
    items, waived = [], set()
    pending_sil = None
    # Nov 17 (the founder, card by card): "proportions are a very important thing that we have to nail".
    # SIL, a strong silhouette, as a lift of its own (sil.2, sil.7, sil.10, prop.3, prop.10, prop.11, prop.15): nothing
    # off in fit or proportions, no dealbreaker, the top not hanging long, and either
    #   a full leg (wide or relaxed trousers, or roomy or wide shorts) over a real shoe (any but slides and runners), or
    #   a straight line: straight trousers (slim too in tailored) over loafers, derbies, dress shoes or boots.
    # All neutrals (and denim) add sil_tonal: "in one color the outline is the whole outfit" (sil.7).
    if T.get("sil") and parts is not None:
        B, S = o["bottom"], o["shoes"]
        sub_b = B.get("subcategory") if B else None
        legb = B.get("leg_shape") if B else None
        ss = S.get("subcategory") if S else None
        real = ss is not None and ss not in SLIDES | RUNNER | {"other"}
        if sub_b in SHORTS:
            full = (B.get("volume") or 3) >= 4 or legb in R.LOOSE
        else:
            full = legb in R.LOOSE
        subs = {g.get("subcategory") for g in o["main"]}
        jk = next((g for g in o["outers"] if g.get("subcategory") == "suit_jacket"), None)
        suit_matched = (jk is not None and sub_b == "suit_trousers" and jk.get("color_family") == B.get("color_family"))
        # the straight line counts only for a clean matched suit (Nov 17: "a clean, matched suit can reach 9"); his
        # ratings don't lift other straight-leg outfits (19 photos: his 6.8 against 8.1 with it)
        line = (suit_matched and (legb in ("straight", "slim")) and ss in {"loafer", "derby", "dress_shoe", "chelsea_boot"}
                and "suit_jacket" in subs)
        long_top = any(g.get("length") == "below_crotch" and g.get("tucked") not in ("full", "half")
                       for g in o["tops"] + o["outers"])
        shape_fault = any(r["points"] < 0 for k in ("fit", "proportions") for r in parts[k].reasons)
        dealbreaker = any(c[2] in ("sink", "hold") for c in caps)
        if ((full and real) or line) and not long_top and not shape_fault and not dealbreaker:
            cols = {g.get("color_family") for g in o["tops"] + o["outers"] + [B]}
            tonal = all(c in R.NEUTRALS or str(c).startswith("denim") for c in cols if c)
            size = T["sil"] * (1.0 if full else T.get("sil_line", 1.0)) + (T.get("sil_tonal", 0.0) if tonal else 0.0)
            if full and legb == "relaxed" and sub_b not in SHORTS:     # round 5: relaxed sits between straight and wide
                size *= T.get("relaxed_factor", 1.0)                  # (the read flips straight/relaxed), partial credit
            what = (f"{'roomy shorts' if sub_b in SHORTS else legb + ' ' + sub_b.replace('_', ' ')} over "
                    f"{ss.replace('_', ' ')}s" if full else f"a straight line down to the {ss.replace('_', ' ')}s")
            sil = ("SIL", round(size, 3), f"a strong silhouette: {what}" + (", all in neutrals" if tonal else ""), False)
            mode = T.get("sil_mode", "alone")
            if mode == "alone":                                       # only when nothing else lifts
                if not lifts:
                    lifts = [sil]
            elif mode == "single":                                    # with at most one other lift: the larger of the
                pending_sil = sil                                     # two (after the one-lift rule, below); two or
                pending_sil = sil if len(lifts) <= 1 else None        # more lifts already stack past it
            elif mode == "top_up":                                    # applied after the one-lift rule (below)
                pending_sil = sil
            else:                                                     # one shape credit: the larger of SIL and L1/SL1
                shape = [x for x in lifts if x[0] in ("L1", "SL1")]
                if not shape or max(x[1] for x in shape) < sil[1]:
                    lifts = [x for x in lifts if x[0] not in ("L1", "SL1")] + [sil]
    # sandals and slides (Nov 17): fine on a warm day with streetwear or casual pieces; they still cost with a tailored
    # or professional piece, and on a cool day. Runners: no charge with athletic or casual pieces, only with dressy ones.
    pro = any(g.get("subcategory") in PRO_PIECES for g in o["main"])
    if T.get("sandals_warm") and o.get("season") == "warm" and not pro:
        waived |= {"SK1_slides_out", "SK1b_hem_drags"}
    if T.get("runners_casual") and not pro:
        waived |= {"SK2_runners"}
    off = set(T.get("lift_off") or ())
    out = []
    for a, b, c, d in lifts:
        if a in off:
            continue
        if a == "L5" and T.get("accent_agree"):                       # round 5: the accent lift only when the outfit
            B0 = o["bottom"]                                          # has exactly one color beside the neutrals (a
            cl = {g.get("color_family") for g in o["tops"] + o["outers"] + ([B0] if B0 else [])}   # steadier fact)
            if len({c for c in cl if c and c not in R.NEUTRALS and not str(c).startswith("denim")}) != 1:
                continue
        if a == "L5" and T.get("accent_by_look"):
            m = max(L5_BY_LOOK.get(lk, 1) for lk in looks)
            if not m:
                continue
            b = round(b * m, 3)
        elif a in TASTE_BY_LOOK:
            m = max(_look_val(a, looks))
            if not m:
                continue
            b = round(b * m, 3)
        out.append((a, b, c, d))
    lifts = out
    stack_n = sum(1 for x in lifts if x[1] >= 0.5)                   # lifts that count for stacking, before halving
    if T.get("one_lift_mode") == "first" and T.get("one_lift", 1.0) != 1.0 and lifts:
        # round 5: the first (largest) lift counts at one_lift, the rest in full: one lift against two is a smaller step
        big = max(range(len(lifts)), key=lambda i: lifts[i][1])
        if lifts[big][0] != "SIL":
            a, b, c, d = lifts[big]
            lifts = lifts[:big] + [(a, round(b * T["one_lift"], 3), c, d)] + lifts[big + 1:]
    elif len(lifts) == 1 and T.get("one_lift", 1.0) != 1.0 and lifts[0][0] != "SIL":   # a great shape alone still lifts
        a, b, c, d = lifts[0]
        lifts = [(a, round(b * T["one_lift"], 3), c, d)]
    o["stack_n"] = stack_n if T.get("stack_prehalf") else None
    if pending_sil is not None and T.get("sil_mode") == "single":
        if not lifts or lifts[0][1] < pending_sil[1]:
            lifts = [pending_sil]
    elif pending_sil is not None:                                     # top-up: with a great shape the lifts come to at
        have = sum(x[1] for x in lifts)                               # least SIL's size; steady when a small lift flips
        if pending_sil[1] > have:
            lifts = lifts + [(pending_sil[0], round(pending_sil[1] - have, 3), pending_sil[2], False)]
    if T.get("h7_tip"):
        caps = [c for c in caps if c[1] != "H7"]
    B = o["bottom"]
    sub = B.get("subcategory") if B else None
    leg = B.get("leg_shape") if B else None
    if B is not None and sub in SHORTS:
        if T.get("shorts"):
            items.append((-T["shorts"], "T_shorts", "shorts"))
        if T.get("shorts_wide") and (B.get("volume") or 3) >= 4:
            m = max(_look_val("shorts_wide", looks))
            if m:
                items.append((T["shorts_wide"] * m, "T_shorts_wide", "roomy shorts"))
        if T.get("shorts_above") and (sl_raw or {}).get("shorts_end") == "above_knee":
            items.append((-T["shorts_above"], "T_shorts_above", "shorts above the knee"))
    elif B is not None:
        if leg in ("relaxed", "wide"):
            m = max(_look_val("leg_wide", looks)) * (T.get("relaxed_factor", 1.0) if leg == "relaxed" else 1.0)
            if T.get("leg_wide") and m:
                items.append((T["leg_wide"] * m, "T_leg", f"{leg} legs"))
            mh = max(_look_val("hem_plus", looks))
            if T.get("hem_plus") and mh and sl_raw and sl_raw.get("covers_shoe") == "mostly":
                items.append((T["hem_plus"] * mh, "T_hem", "a full hem over the shoe"))
        elif leg in ("skinny", "slim") and T.get(f"leg_{leg}"):
            items.append((-T[f"leg_{leg}"], "T_leg", f"{leg} legs"))
    if T.get("color"):
        cols = {g.get("color_family") for g in o["tops"] + o["outers"] + ([B] if B else [])}
        n = min(2, len({c for c in cols if c and c not in R.NEUTRALS and not str(c).startswith("denim")}))
        if n:
            charged = min((max(n - 1, 0) if m == "2nd" else n * m) for m in _look_val("color", looks))
            if charged:
                items.append((-T["color"] * charged, "T_color", f"{n} color{'s' if n > 1 else ''} beside the neutrals"))
    if T.get("long_top") and not o["outers"] and o["tops"]:
        top = o["tops"][0]
        if top.get("tucked") not in ("full", "half"):
            ruler = (sl_raw or {}).get("long_top") if T.get("long_top_read") == "ruler" else None
            long_ = ruler if ruler is not None else top.get("length") == "below_crotch"
            m = min(_look_val("long_top", looks))
            if long_ and m:
                items.append((-T["long_top"] * m, "T_long_top", "the top ends low"))
    return lifts, caps, items, waived


def v16_finish(o, parts, sl, sl_raw, cond, occ, occasion, t, engine, tune):
    """v16's step after the parts. Returns the pieces score_parts puts in the result."""
    warm = o.get("season") == "warm"
    # a strong shape softens a bright clash (ix.2): halve CC2 when Proportions earned a credit and nothing is off in it
    cc2 = next((r for r in parts["color"].reasons if r["check"] == "CC2_bright_clash"), None)
    prop = parts["proportions"].reasons
    if cc2 is not None and any(r["points"] > 0 for r in prop) and not any(r["points"] < 0 for r in prop):
        parts["color"].add(-cc2["points"] / 2, "the strong shape carries the two brights", "CC2s_shape_softens")
    knits = [g for g in o["tops"] + o["outers"] if g.get("subcategory") in KNIT_LAYERS]
    if len(knits) >= 2 and t["v16_knit"]:
        parts["cohesion"].add(-t["v16_knit"], f"the {knits[-1].get('subcategory')} over the {knits[0].get('subcategory')}: "
                              "knit on knit blurs together; a smooth layer over the knit adds depth", "X_knit_on_knit")
    dep = _v16_depends(o, parts, t)
    if dep:
        rid, base, k = dep
        what = {"S5": "a blazer with gym shorts", "S7": "a leather jacket with gym shorts", "H6": "a blazer with shorts",
                "H5": "a leather jacket with shorts"}[rid]
        parts["cohesion"].add(-base * k, f"{what}: the two halves come from different worlds", "X_" + rid)
    res = {k: (v.result(lo=1.0) if k == "cohesion" else v.result()) for k, v in parts.items()}
    live = {k: r for k, r in res.items() if r["score"] is not None}
    Wt = t["weights"] or WEIGHTS
    wsum = sum(Wt[k] for k in live)
    lifts = _v16_lifts(o, parts, sl, t)
    lift_checks = {c for c, m in V16_LIFTS.items()}
    caps = _v16_caps(o, parts, sl_raw, occasion, t)
    lifts, caps, taste, waived = _v16_taste(o, sl_raw, lifts, caps, t, parts)   # round 3: off unless t["taste"] is set
    if dep:                                                            # a clash never reads sharp: held at 7.0; with a
        if dep[2] == 1.5:                                              # second fault it sinks, and the cap owns the charge
            caps.append((5.5 if dep[0] != "H5" else 6.5, dep[0], "sink" if dep[0] != "H5" else "hold",
                         "the clash, with a second fault"))
        else:
            caps.append((7.0, dep[0], "clash", "the two halves come from different worlds"))
    owned = set().union(*[V16_OWNS.get(c[1], set()) for c in caps if c[2] != "clash"]) if caps else set()
    owned |= V16_UNSTEADY | waived
    # faults: the worst part's charges at alpha, every other part's at beta (they no longer average away); a charge a
    # dealbreaker owns is left out, since the cap stands for it
    negs = sorted((-sum(r["points"] for r in parts[k].reasons if r["points"] < 0 and r["check"] not in owned)
                   for k in live), reverse=True)
    cond_ded = cond["deduction"] - (min(1.2, cond["deduction"]) if any(c[1] == "S9" for c in caps) else 0.0)
    drop = (t["v16_alpha"] * negs[0] + t["v16_beta"] * sum(negs[1:])) if negs else 0.0
    # small credits that aren't lifts keep v15's weight (a shoe that suits the look, reads as a style ...)
    minor = sum(Wt[k] / wsum * r["points"] for k in live for r in parts[k].reasons
                if r["points"] > 0 and r["check"] not in lift_checks and r["check"] != "CC2s_shape_softens")
    lift_sum = sum(x[1] for x in lifts)
    heavy = None
    if warm:
        hv = next((g for g in o["outers"] if g.get("subcategory") in HEAVY_LAYERS), None)
        if hv is None and len(o["outers"]) >= 2:
            hv = o["outers"][0]
        if hv is not None:
            heavy = (0.5, f"the {hv.get('subcategory').replace('_', ' ')} is a lot of layer for a warm day")
    raw = 7.0 + lift_sum + minor - drop - cond_ded - occ["deduction"] - (heavy[0] if heavy else 0.0)
    if any(c[2] in ("sink", "hold") for c in caps):              # a dealbreaker owns the taste charges, as it owns
        taste = [x for x in taste if x[0] > 0]                      # its part charges (the cap stands for them)
    raw += sum(x[0] for x in taste)
    raw = clamp(raw, 3.0, 9.5)
    shown = clamp(_v16_curve(raw, t), 3.0, 9.5)
    # the ceilings: the stacking rule, the occasion, the dealbreakers
    subs = {g.get("subcategory") for g in o["main"]}
    one_look = bool(o["det"]) or ("suit_jacket" in subs and "suit_trousers" in subs) or any(x[0] == "L7b" for x in lifts)
    n = sum(1 for x in lifts if x[1] >= 0.5)
    if o.get("stack_n") is not None:                                  # round 5: a halved lift still counts as a lift
        n = max(n, o["stack_n"])
    anything_off = (any(r["points"] < 0 and r["check"] not in waived for p in parts.values() for r in p.reasons)
                    or bool(cond["faults"]) or bool(caps))
    owned_lines = sorted(owned & {r["check"] for p in parts.values() for r in p.reasons})
    if n == 0:
        stack = 7.5
    elif n == 1:
        stack = 8.0
    elif n == 2 or not one_look:
        stack = 8.5
    elif n == 3 or anything_off:
        stack = 9.0
    else:
        stack = 9.5
    ceilings = [(stack, f"{n} lift{'s' if n != 1 else ''}" + (" in one look" if one_look and n >= 3 else ""))]
    # fit is the floor (fit.1, ix.17): with a fit or shape fault, no lift makes it sharp
    if any(r["points"] < 0 and r["check"] not in owned for k in ("fit", "proportions") for r in parts[k].reasons):
        ceilings.append((7.5, "a fit or shape fault: lifts can't cover it"))
    if occ["ceiling"] is not None:
        ceilings.append((occ["ceiling"], "occasion"))
    sinks = [c for c in caps if c[2] == "sink"]
    holds = [c for c in caps if c[2] == "hold"]                      # (a "clash" 7.0 hold isn't counted)
    for c in caps:
        ceilings.append((c[0], c[1]))
    if len(sinks) >= 2:
        ceilings.append((4.5, "two sinking faults: a redo"))
    elif len(holds) >= 2:
        ceilings.append((6.0, "two holding faults"))
    final = shown
    held_by = None
    for c, why in ceilings:
        if c < final:
            final, held_by = c, why
    final = clamp(final, 3.0, 9.5)
    return {
        "res": res, "live": live, "wsum": wsum, "raw": raw, "shown_before_caps": shown, "final": final,
        "v16": {"season": o.get("season") or "cool", "lifts": [{"id": a, "size": b, "line": c, "layer": d} for a, b, c, d in lifts],
                "lift_sum": round(lift_sum, 3), "minor": round(minor, 3), "fault_drop": round(drop, 3),
                "heavy_layer": heavy, "caps": [{"cap": c, "id": i, "kind": k, "line": l} for c, i, k, l in caps],
                "stack_ceiling": stack, "one_look": one_look, "held_by": held_by, "raw": round(raw, 3),
                "curved": round(shown, 3), "owned": owned_lines, "ceiling": min(c for c, _ in ceilings), "depends": dep,
                "unread": V16_UNREAD, "taste": [{"points": a, "id": b, "line": c} for a, b, c in taste],
                "graded_look": sorted(o.get("graded") or [])},
    }


# =====================================================================================================
# THE ENTRY POINT
# =====================================================================================================
def _outfit(garments, styles):
    gs = garments
    tops = [g for g in gs if g.get("category") == "top"]
    outers = [g for g in gs if g.get("category") == "outerwear"]
    bottom = next((g for g in gs if g.get("category") == "bottom"), None)
    shoes = next((g for g in gs if g.get("category") == "footwear"), None)
    main = [g for g in gs if g.get("category") in R.SLOT]
    d = R.detect_styles(gs, styles)
    nd = R.detect_styles([g for g in gs if g.get("category") != "footwear"], styles)
    d0 = R.detect_styles(gs, {}) if styles else d                    # the label with no picks (v4's H2)
    return {"tops": tops, "outers": outers, "top": tops[0] if tops else None, "outer": outers[0] if outers else None,
            "bottom": bottom, "shoes": shoes, "main": main, "det": d["detected"], "label": d["label"],
            "label_nopick": d0["label"],
            "det_noshoe": nd["detected"], "slots": {R.SLOT[g["category"]] for g in main}, "credited": set(),
            "color_fault": False, "mirror": False}


def score_parts(reading, occasion="everyday", styles=None, second_look=None, boldness="a_little", engine="v15", tune=None,
                season=None, graded_look=None):
    """reading: the live v3 reading. occasion: the app key. styles: his picks ({style: weight}); like v4.1 they only
    pick the "Reads as" label on a tie and never change a number. second_look: optional look1 answers (see
    _second_look). engine: "v15" (v14 + a hoodie or sweatshirt layered over a tee, PRO-17; default), "v14" (the casual and athletic
    fits), "v13" (v12 + wrinkled knit tops cost 0.2 on a minimal, smart casual or prep look),
    "v12" (v11 + the founder's Oct 14 calls: small bright graphics aren't loud, fitted legs are
    slim and cost 1.0, light on light, wrinkles by garment and look), "v11" (v10 + the covered base top and skinny joggers), "v10" (v9 + the creators' rules), "v9" (v8 + four consensus fixes), "v8" (the gold-set retune), "v7" (condition reads count only on "clear" garments), "v6" (KD-3/5/16 fixed), "v5" (the style-crossing pass), "v4" (the style fairness pass), "v3" (the streetwear pass), "v2" (parts-proto-2,
    exactly) or "v1" (parts-proto-1, exactly); tune: optional overrides of TUNE[engine]
    (for the ablations). Returns every part with its reasons and tips, the NA parts, condition, occasion and the final score."""
    t = _tune(engine, tune)
    styles = styles or {}
    sl = _second_look(second_look, t)
    scene, garments, not_rated = R._prepare(reading)
    if scene.get("clothed") != "fully":
        return {"overall": None, "reason": "not_fully_clothed", "parts": {}, "na_parts": PART_ORDER[:]}
    if not garments:
        return {"overall": None, "reason": "nothing_readable", "parts": {}, "na_parts": PART_ORDER[:]}
    garments = _refile(R._normalize(garments))
    care_tips = _unsure_care(garments, t)                            # v7: condition reads count only when "clear"
    o = _outfit(garments, styles)
    o["mirror"] = bool(scene.get("mirror_selfie"))
    o["sx"] = _style_clash(o, t)                                      # v5's SX1, read by Style and (v6) Proportions
    o["t"] = t
    o["occasion"] = occasion
    o["season"] = season if t["v16"] else None                     # v16: "warm", or "cool" (mild and cold; the default)
    o["graded"] = graded_looks(o, graded_look)                       # round 3: the look(s) the taste rules follow

    color = _color(o, boldness, t)
    o["color_fault"] = bool(color.reasons) and any(r["points"] < 0 for r in color.reasons)
    parts = {"proportions": _proportions(o, sl, t), "fit": _fit(o), "color": color,
             "shoes": _shoes(o, occasion, sl, t), "cohesion": _cohesion(o, boldness, t)}
    if t["sk1_soft"] and any(r["check"] == "SK1_slides_out" for r in parts["shoes"].reasons) and not any(
            r["points"] <= -1.0 for k, v in parts.items() if k != "shoes" for r in v.reasons):
        parts["shoes"].add(t["sk1_soft"], "the rest of the outfit is clean, so the slides cost less",
                           "SK1s_slides_soft")              # v8 candidate: slides under an otherwise clean outfit
    res = {k: (v.result(lo=1.0) if k == "cohesion" else v.result()) for k, v in parts.items()}
    live = {k: r for k, r in res.items() if r["score"] is not None}
    if not live:
        return {"overall": None, "reason": "no_part_readable", "parts": res, "na_parts": PART_ORDER[:]}
    cond = _condition(o, scene, occasion, care_tips)
    if t["goes_together"] and "cohesion" in live:                      # v14 (STY-12): the pieces go together
        subs = {g.get("subcategory") for g in o["main"]}
        suit = "suit_jacket" in subs and "suit_trousers" in subs
        if (not o["det"] and not suit and len(o["slots"]) == 3 and live.get("shoes", {}).get("score", 0) > BASE
                and all(r["score"] >= BASE for r in live.values()) and not cond["faults"]):
            parts["cohesion"].add(t["goes_together"], "the pieces go together: nothing off, and the shoes suit the clothes",
                                  "H6_goes_together")
            res["cohesion"] = parts["cohesion"].result(lo=1.0)
            live["cohesion"] = res["cohesion"]
    occ = _occasion(o, occasion, t)
    care_or_strain = any(_care_fault(g) for g in o["main"]) or any(g.get("strain") == "clear" for g in o["main"])
    ps = {k: r["score"] for k, r in live.items()}
    if o.get("kit_hold") and occ["ceiling"] is not None and t["kit_fit_rate"]:   # v14 (LNG-4): fit moves the kit's hold
        cut = t["kit_fit_rate"] * max(0.0, BASE - min(ps.get(k, BASE) for k in ("proportions", "fit")))
        if cut > 0 and t["kit_cap"] - cut < occ["ceiling"]:
            occ["ceiling"] = round(t["kit_cap"] - cut, 3)
            occ["lines"][-1] = f"a full kit out of the game, and it doesn't fit cleanly: held to {round_half(occ['ceiling'])}"
            occ["status"] = occ["lines"][-1]
    if t["v16"]:
        return _v16_result(o, parts, sl, second_look, cond, occ, occasion, t, engine, tune, not_rated, care_or_strain)
    avg, x, floored, wsum = combine(ps, cond, occ, occasion, care_or_strain, engine, tune)
    bonus = earned_bonus(ps, engine, tune)
    penalty = piled_penalty(ps, engine, tune)                        # v8 (0 in v1-v7): problems in several parts add up
    overall = round_half(x)

    # the lowest part leads the card, with its one-line reason (ties: the heavier part)
    low_k = min(live, key=lambda k: (live[k]["score"], -(t["weights"] or WEIGHTS)[k]))
    lr = live[low_k]
    neg = [r for r in lr["reasons"] if r["points"] < 0]
    line = (neg[0]["line"] if neg else lr["reasons"][0]["line"] if lr["reasons"] else
            {"fit": "nothing looks the wrong size", "proportions": "a balanced, classic shape",
             "color": "clean neutrals, nothing fighting", "shoes": "clean and easy with this",
             "cohesion": "the pieces go together; nothing ties them to one look yet"}[low_k])
    lowest = {"part": low_k, "score": lr["display"], "line": f"{PART_NAMES[low_k]} {lr['display']:g}: {line}"}
    if t["solid_line"] and all(r["display"] == BASE for r in live.values()):
        # the founder's call (Oct 10): when every part is 7, don't name a "weakest" part
        lowest = {"part": None, "score": BASE, "line": "Every part is solid: nothing off, nothing standing out yet."}
    return {
        "overall": overall, "raw_score": round(x, 3), "average": round(avg, 3), "earned_bonus": bonus, "piled_penalty": penalty,
        "version": VERSIONS[engine], "engine": engine,
        "parts": res, "na_parts": [k for k in PART_ORDER if res[k]["score"] is None],
        "weights_used": {k: round((t["weights"] or WEIGHTS)[k] / wsum, 3) for k in live},
        "condition": cond, "occasion": occ, "floored": floored, "care_or_strain": care_or_strain,
        "lowest": lowest,
        "second_look": sl, "detected_styles": o["det"], "style_label": o["label"], "not_rated": not_rated,
        "partial": bool(not_rated),
    }


def _v16_result(o, parts, sl, sl_raw, cond, occ, occasion, t, engine, tune, not_rated, care_or_strain):
    v = v16_finish(o, parts, sl, sl_raw, cond, occ, occasion, t, engine, tune)
    res, live = v["res"], v["live"]
    low_k = min(live, key=lambda k: (live[k]["score"], -(t["weights"] or WEIGHTS)[k]))
    lr = live[low_k]
    neg = [r for r in lr["reasons"] if r["points"] < 0]
    line = neg[0]["line"] if neg else (lr["reasons"][0]["line"] if lr["reasons"] else "nothing off")
    return {
        "overall": round_half(v["final"]), "raw_score": round(v["final"], 3), "average": v["raw"], "earned_bonus": 0.0,
        "piled_penalty": 0.0, "version": VERSIONS[engine], "engine": engine, "parts": res,
        "na_parts": [k for k in PART_ORDER if res[k]["score"] is None],
        "weights_used": {k: round((t["weights"] or WEIGHTS)[k] / v["wsum"], 3) for k in live},
        "condition": cond, "occasion": occ, "floored": False, "care_or_strain": care_or_strain,
        "lowest": {"part": low_k, "score": lr["display"], "line": f"{PART_NAMES[low_k]} {lr['display']:g}: {line}"},
        "second_look": sl, "detected_styles": o["det"], "style_label": o["label"], "not_rated": not_rated,
        "partial": bool(not_rated), "v16": v["v16"],
    }


def card_row(result):
    """'Proportions 7 · Fit 5.5 · Color 7 · Shoes 7.5 · Style 7.5' (NA parts left out)."""
    return " · ".join(f"{PART_NAMES[k]} {result['parts'][k]['display']:g}" for k in PART_ORDER
                      if result["parts"].get(k, {}).get("display") is not None)
