"""Writes fixtures/parts_parity.json: the parts engine's exact Python output (extraction-test/rubrics/parts_proto.py,
v16 by default) over many readings x configs, for @kitted/core's scoreParts() parity test (test/parts.parity.test.ts).

Run (after make_parity.py, whose readings it reuses by id):
    /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/handoff/fixtures/make_parts_parity.py

Readings and configs:
  1. every case of rubric_parity.json (each reading under that case's occasion, picks and boldness), referenced by
     reading id so the readings aren't stored twice
  2. the real saved corpus (extraction-test/results/parts1/corpus.json, 78 readings) and the newest phone pull's
     scored checks (screenshots/phone/<newest>/SQLite/kitted.db, the reading each check used, deduped by image hash),
     each at its own occasion and at every other occasion key, with the second look (look1, 2-of-3 majority) where
     the paper tests use it (parts_test.second_look_for)
  3. batch 1 arm A and arm B1 (lightness) runs with that run's second look (the paper tests' steadiness pairing),
     and arm A with B1's lightness copied on (parts2_test.with_lightness); zoom1 / zoom1-stock arm B
  4. second-look variants (both input forms) on rubric_parity's hand-written edge readings
  5. hand-written parts edge cases that force every check, tip, NA reason, ceiling and early return
  6. tune variants: engines v1 to v15 (TUNE["v1"..."v15"]; v13, v14 and v15 are what the app's three switches roll back to), a v15 what-if, a v14 what-if, a v13 what-if, a v12 what-if, a v11 what-if, a v10 what-if, a v9 what-if, a v8 what-if (the retune's knobs moved or off), the v4 what-if knobs, a v5 what-if (SX1 smaller, one
     dressy piece enough) and a v6 what-if (PB1 smaller, H2 on the label only, Event on the interview band), on the
     corpus, the pull and the edge cases, so a tuning change is proven to be a data change
  7. picks variants: the corpus and the pull at their own occasion, and the parts edge cases, with no picks, one pick
     and three picks. Picks never move a number: the generator asserts every reading x occasion x boldness x second
     look scores the same under every picks it ran (the TS test checks it again)
The run also re-scores every default case with engine v15 and stores which cases v16 changed (`v16_vs_v15`). The checks v8
retired (CP1, H4, FF5_too_big, the SW3 tip) must still fire somewhere in the v7 cases, so v7 stays proven.
Profile (CLAUDE.md rule 7): real readings use the paper tests' one stated test profile (picks Minimal + Smart casual
0.5 each, boldness a little, no age); picks only choose the "Reads as" label and never move a number.

Each case's `expected` is score_parts()'s dict plus `average_unrounded` and `raw_unrounded` (the doubles before
round(x, 3), recomputed with parts_proto.combine). A reading Python can't score (it raises) is stored as
{"error": "..."}: the TypeScript must throw on it too. Those are prototype bugs, reported, not fixed here.
"""
import sys as _sys; _sys.dont_write_bytecode = True  # never write __pycache__ next to rubric.py
import copy, glob, hashlib, json, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
KEMPT = os.path.abspath(os.path.join(HERE, "../.."))
ET = os.path.join(KEMPT, "extraction-test")
sys.path.insert(0, ET)
sys.path.insert(0, os.path.join(ET, "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import parts_test as T  # noqa: E402  (the paper test's loaders and second_look_for)
import parts2_test as T2  # noqa: E402  (with_lightness)
import make_parts_json as MJ  # noqa: E402

PROFILE = [["minimalist", 0.5], ["smart_casual", 0.5]]
BOLD = "a_little"
OCCASIONS = list(R.OCCASION_TARGET) + ["brunch"]          # "brunch" = unknown key -> default (2, 3)
WHATIF = {"h4_graphic_street": True, "pr4_signature_v3": True, "sw2": 1.0, "pr4_legs": ("straight", "relaxed", "wide"),
          # v4's what-ifs (style-fairness.md "Tested and not adopted"): the look's pair, outdoor at +1.0, PR5 over
          # sneakers, and H2 on the picked label (v3's behaviour)
          "sc_pair": True, "pr6": 1.0, "pr5_shoes": frozenset(R.FOOT_KIND["boots"]) | {"low_profile_sneaker", "canvas_sneaker"},
          "h2_pick_free": False}
WHATIF5 = {"sx": 1.5, "sx_min_dressy": 1}       # v5's what-ifs (style-clash.md): the jacket rule's size, one dressy piece
WHATIF6 = {"pb": 1.0, "h2_any": False, "occ_target": {"event": (3.5, 4.5)},   # v6's what-ifs (v6.md): a smaller PB1, KD-5
           "pb_roomy_narrow": frozenset({"outdoor", "streetwear"})}             # and KD-16 not fixed, streetwear over slim
# v8's what-ifs (gold-retune.md): other sizes for the new rules, v7's PR1 and runner, no penalty, the old weights
WHATIF8 = {"cl1": 1.0, "pn_narrow": 0.5, "pn_skinny": 0.0, "pn_rip": 1.0, "pr1_loose": None, "pr1_straight": None,
           "sk2_runner": None, "penalty": {"under": 7.0, "rate": 1.0, "cap": 0.5}, "weights": None, "pr2b": 0.5,
           "sk1_soft": 1.0, "lounge_style": 1.0, "tk1": 1.0, "cp1": 0.5, "h4": 0.25, "ff7_loose": False}
# v9's what-ifs: other sizes for the four consensus fixes, and the loud-print exemption off
WHATIF9 = {"int_top": 6.5, "int_hoodie": 5.5, "dd_same": 0.5, "gt1": 1.0, "cl1_own": False}
# v10's what-ifs: v9's narrow-leg sizes and line, and a bigger toned-down accent
WHATIF10 = {"pn_narrow": 1.0, "pn_skinny": 1.0, "pn_slim_soft": False, "cp1_dark": 1.0}
# v11's what-ifs: the covered base top off, and the softer skinny-jogger charge
WHATIF11 = {"h3_base_covered": False, "pn_lounge_skinny": 1.0}
# v12's what-ifs: the old loud-print test, v11's slim size, a roominess-3 cut, a smaller light-on-light, the old wrinkles
WHATIF12 = {"cl1_scale": False, "pn_narrow": 0.5, "pn_skinny": 1.5, "pn_fitted_vol": 3, "ll1": 0.5, "wr_look": False}
# v13's what-ifs: every wrinkle amount moved (a bigger clean-look knit charge, no tailored-tee charge, a bigger half)
WHATIF13 = {"wr_knit_clean": 0.4, "wr_knit_tailored": 0.0, "wr_half": 0.3}
# v14's what-ifs (casual-athletic.md): other sizes, the kit flat, no look sign, and the shorts credits without the cap
WHATIF14 = {"sh_shape": 1.5, "sh_layer": 0.5, "sh_cap": 1.0, "sh_fitted": 0.5, "goes_together": 1.0, "kit_cap": 5.5,
            "kit_fit_rate": 1.0, "look_sign": False, "sweatsuit_shape": 0.5, "tracksuit": 1.0, "sd1_any_sneaker": False,
            "gym_runner_unheld": False}
# v15's what-if (#385): a smaller hoodie layer credit
WHATIF15 = {"hl": 1.0, "cp8": 1.0}
PICKS_VARIANTS = {"none": [], "one": [["workwear", 1.0]],
                  "three": [["streetwear", 0.5], ["vintage_sport", 0.25], ["smart_casual", 0.25]]}


def canon(r):
    return json.dumps({"scene": r.get("scene"), "garments": r.get("garments")}, sort_keys=True, separators=(",", ":"))


def rid_of(r):
    return "r" + hashlib.sha256(canon(r).encode()).hexdigest()[:12]


def run(reading, occ, styles, sl, bold, engine="v16", tune=None):
    try:
        res = P.score_parts(copy.deepcopy(reading), occ, {k: w for k, w in styles}, copy.deepcopy(sl), bold, engine, tune)
    except Exception as e:  # a prototype bug: recorded, the TS must throw too
        return {"error": f"{type(e).__name__}: {e}"}
    if res["overall"] is not None:
        ps = {k: res["parts"][k]["score"] for k in P.PART_ORDER if res["parts"][k]["score"] is not None}
        avg, x, floored, _ = P.combine(ps, res["condition"], res["occasion"], occ, res["care_or_strain"], engine, tune)
        assert round(avg, 3) == res["average"] and round(x, 3) == res["raw_score"] and floored == res["floored"]
        res["average_unrounded"], res["raw_unrounded"] = avg, x
    return res


# ---------------------------------------------------------------------------------------------------- edge cases
SCENE = {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False, "lighting": "good", "clothed": "fully"}


def G(cat, sub, color, **kw):
    g = {"category": cat, "subcategory": sub, "color_family": color, "pattern": "solid", "logo": "none", "volume": 3,
         "leg_shape": "na", "hem": "na", "tucked": "na", "condition": "clean", "certainty": "clear", "length": "na",
         "pattern_scale": "na", "saturation": "na", "sleeve_end": "at_wrist" if cat in ("top", "outerwear") else "na",
         "strain": "none", "distressed_by_design": False, "shows_below_outer": False}
    g.update(kw)
    return g


def Rd(*garments, **scene):
    s = dict(SCENE); s.update(scene)
    return {"scene": s, "garments": list(garments)}


TEE = lambda **kw: G("top", kw.pop("sub", "tee"), kw.pop("color", "white"), **{"tucked": "none", "length": "mid_fly", **kw})  # noqa: E731
JEANS = lambda **kw: G("bottom", kw.pop("sub", "jeans"), kw.pop("color", "denim_mid"), **{"leg_shape": "straight", "hem": "slight_break", **kw})  # noqa: E731
SHOE = lambda sub="white_leather_sneaker", color="white", **kw: G("footwear", sub, color, **kw)  # noqa: E731


def parts_edges():
    E = []
    add = lambda name, r, occ="everyday", sl=None, bold=BOLD, styles=PROFILE: E.append((name, r, occ, sl, bold, styles))  # noqa: E731
    # early returns and NA
    add("not_fully_clothed", Rd(TEE(), JEANS(), SHOE(), clothed="partial"))
    add("nothing_readable", Rd(G("accessory", "watch", "black")))
    add("no_part_readable_shoes_only", Rd(SHOE()))
    add("upper_only", Rd(TEE(), G("outerwear", "bomber", "olive"), framing="upper_only", shoes_visible=False))
    add("shorts_na", Rd(TEE(), JEANS(sub="shorts", color="khaki_beige"), SHOE(sub="canvas_sneaker")))
    add("shoe_other_na", Rd(TEE(), JEANS(), SHOE(sub="other", color="olive")))
    add("shoes_hidden", Rd(TEE(), JEANS(), SHOE(), shoes_visible=False))
    add("top_only_color_na", Rd(TEE(), SHOE()))
    add("traditional", Rd(G("traditional", "other", "white"), JEANS(), SHOE()))
    # proportions
    add("PR1_tuck", Rd(TEE(sub="oxford_shirt", color="light_blue", tucked="full"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("PR1_short", Rd(TEE(length="at_belt"), JEANS(), SHOE()))
    add("PR1_short_mirror", Rd(TEE(length="cropped"), JEANS(leg_shape="wide"), SHOE(), mirror_selfie=True))
    add("PR1_tuck_mirror", Rd(TEE(tucked="full"), JEANS(), SHOE(), mirror_selfie=True))
    add("PR1_ribbed_no", Rd(TEE(sub="hoodie", color="grey", length="at_belt"), JEANS(), SHOE()))
    add("PR1_ribbed_boxy", Rd(TEE(sub="sweatshirt", color="grey", length="at_belt", volume=4), JEANS(leg_shape="relaxed"), SHOE()))
    add("PR1b_half", Rd(TEE(sub="oxford_shirt", color="white", tucked="half"), JEANS(), SHOE()))
    add("PR1_stained_no", Rd(TEE(tucked="full", condition="stained"), JEANS(), SHOE()))
    add("PR2_short_layer", Rd(TEE(), G("outerwear", "denim_jacket", "denim_dark"), JEANS(color="black"), SHOE(sub="chelsea_boot", color="black")))
    add("PR2_peek_blocks", Rd(TEE(), G("outerwear", "bomber", "black"), JEANS(), SHOE()), sl={"peek": True})
    add("PR3_tailored_line", Rd(G("top", "dress_shirt", "white", tucked="full", length="mid_fly"), G("outerwear", "blazer", "navy"),
                                G("bottom", "trousers", "grey", leg_shape="straight", hem="no_break"), SHOE(sub="derby", color="black")), occ="work")
    add("PR3_cap", Rd(G("top", "oxford_shirt", "white", tucked="full"), G("outerwear", "sport_coat", "grey"),
                      G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE(sub="loafer", color="brown")))
    add("PR4_street", Rd(TEE(sub="graphic_tee", color="black", volume=4, length="mid_fly", pattern="graphic"), JEANS(leg_shape="wide", hem="cuffed", color="denim_light"),
                         SHOE(sub="chunky_sneaker", color="white")), styles=[["streetwear", 1.0]])
    add("PR4_beats_PR1", Rd(TEE(color="black", volume=5, length="cropped"), JEANS(sub="cargos", color="olive", leg_shape="relaxed", hem="cuffed"),
                            SHOE(sub="basketball_sneaker", color="white")))
    add("PR4_white_leather_no", Rd(TEE(color="black", volume=4, length="at_belt"), JEANS(color="black", leg_shape="wide", hem="cuffed"), SHOE()))
    add("PR4_signature_v3", Rd(TEE(sub="hoodie", color="black", volume=3, length="mid_fly"), JEANS(color="black", leg_shape="wide", hem="cuffed"),
                               SHOE(sub="chunky_sneaker", color="white")))
    # v4: the workwear and outdoor shapes, the track jacket, H2 on the pick-free label
    CHORE = lambda **kw: G("outerwear", "chore_coat", kw.pop("color", "tan_camel"), **kw)  # noqa: E731
    add("PR5_workwear", Rd(TEE(), CHORE(), JEANS(color="black"), SHOE(sub="work_boot", color="brown")), styles=[["workwear", 1.0]])
    add("PR5_chukka_wide", Rd(TEE(), CHORE(color="olive"), JEANS(color="denim_dark", leg_shape="wide", hem="cuffed"), SHOE(sub="suede_chukka", color="brown")))
    add("PR5_cargos_chelsea", Rd(TEE(color="black"), CHORE(color="navy"), JEANS(sub="cargos", color="olive", leg_shape="relaxed"), SHOE(sub="chelsea_boot", color="black")))
    add("PR5_flannel", Rd(TEE(sub="flannel_shirt", color="red", pattern="checks_plaid", pattern_scale="large"), CHORE(),
                          JEANS(color="black"), SHOE(sub="work_boot", color="brown")))
    add("PR5_sneakers_no", Rd(TEE(), CHORE(), JEANS(color="black"), SHOE(sub="canvas_sneaker", color="white")))
    add("PR5_slim_no", Rd(TEE(), CHORE(), JEANS(color="black", leg_shape="slim"), SHOE(sub="work_boot", color="brown")))
    add("PR5_chinos_no", Rd(TEE(), CHORE(), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="work_boot", color="brown")))
    add("PR5_worn_boots_no", Rd(TEE(), CHORE(), JEANS(color="black"), SHOE(sub="work_boot", color="brown", condition="pilled_or_worn")))
    add("PR5_pooling_no", Rd(TEE(), CHORE(), JEANS(color="black", hem="pooling"), SHOE(sub="work_boot", color="brown")))
    add("PR5_peek_no", Rd(TEE(), CHORE(), JEANS(color="black"), SHOE(sub="work_boot", color="brown")), sl={"peek": True})
    add("PR6_outdoor", Rd(TEE(color="grey"), G("outerwear", "shell_jacket", "orange"), JEANS(sub="cargos", color="olive", leg_shape="relaxed"),
                          SHOE(sub="trail_shoe", color="grey")))
    add("PR6_fleece", Rd(TEE(), G("outerwear", "fleece", "green", volume=4), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="trail_shoe", color="brown")))
    add("PR6_rain_runner_no", Rd(TEE(), G("outerwear", "rain_jacket", "navy"), JEANS(sub="cargos", color="black", leg_shape="wide"),
                                 SHOE(sub="performance_runner", color="black")))
    add("PR2_track_jacket", Rd(TEE(), G("outerwear", "track_jacket", "green"), JEANS(color="denim_dark"), SHOE(sub="low_profile_sneaker", color="white")),
        styles=[["vintage_sport", 1.0]])
    add("PR2_track_jacket_narrow_no", Rd(TEE(), G("outerwear", "track_jacket", "navy"), JEANS(leg_shape="slim"), SHOE(sub="retro_runner", color="white")))
    for nm, st in (("none", []), ("minimal", [["minimalist", 1.0]]), ("smart", [["smart_casual", 1.0]]), ("both", PROFILE)):
        add("H2_pick_tie_" + nm, Rd(G("top", "polo", "navy", tucked="full", length="na"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"),
                                    SHOE(sub="loafer", color="brown")), styles=st)
    add("PF5_big_top_skinny", Rd(TEE(volume=5), JEANS(leg_shape="skinny"), SHOE()))
    add("PF6_layer_skinny", Rd(TEE(), G("outerwear", "overshirt", "olive"), JEANS(leg_shape="skinny"), SHOE()))
    add("PF10_peek", Rd(TEE(), G("outerwear", "chore_coat", "tan_camel"), JEANS(), SHOE(sub="work_boot", color="brown")), sl={"peek": True})
    add("PF2_tip_loose", Rd(TEE(length="below_crotch"), JEANS(leg_shape="wide"), SHOE()))
    add("PF2_tip", Rd(TEE(length="below_crotch"), JEANS(), SHOE()))
    add("PF3_tip", Rd(TEE(), G("outerwear", "overcoat", "camel", length="below_crotch"), JEANS(leg_shape="relaxed"), SHOE()))
    add("PF1_tip", Rd(TEE(), G("outerwear", "blazer", "navy"), JEANS(sub="trousers", color="grey", hem="pooling"), SHOE(sub="derby", color="black")))
    add("PF4_tip", Rd(TEE(sub="flannel_shirt", color="red", pattern="checks_plaid", pattern_scale="medium"), JEANS(leg_shape="wide"), SHOE()))
    add("pooling_blocks", Rd(TEE(tucked="full"), JEANS(hem="pooling"), SHOE()))
    add("lounge_blocks", Rd(TEE(tucked="full"), G("bottom", "sweatpants", "grey", leg_shape="relaxed", hem="cuffed"), SHOE(sub="retro_runner")))
    add("P_next_level", Rd(TEE(), JEANS(sub="trousers", color="black", leg_shape="skinny"), SHOE()))
    # fit
    add("FF1_tailored", Rd(TEE(), G("outerwear", "blazer", "navy", sleeve_end="covers_hand"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("FF1_ribbed", Rd(TEE(sub="hoodie", color="grey", sleeve_end="covers_hand"), JEANS(), SHOE()))
    add("FF5_too_big", Rd(TEE(sub="oxford_shirt", color="white", volume=4, sleeve_end="covers_hand"), JEANS(), SHOE()))
    add("FF1_long", Rd(TEE(sub="oxford_shirt", color="white", sleeve_end="covers_hand"), JEANS(), SHOE()))
    add("FF1_short_sleeve_ignored", Rd(TEE(sleeve_end="covers_hand"), JEANS(), SHOE()))
    add("FF6_strain_top_and_pooling", Rd(TEE(strain="clear"), JEANS(sub="chinos", color="navy", hem="pooling"), SHOE()))
    add("FF6_strain_narrow", Rd(TEE(), JEANS(leg_shape="slim", strain="clear"), SHOE()))
    add("FF7_lounge_pool", Rd(TEE(), G("bottom", "joggers", "black", leg_shape="slim", hem="pooling"), SHOE(sub="canvas_sneaker")))
    add("FF_severe_cap", Rd(G("top", "oxford_shirt", "white", sleeve_end="covers_hand", volume=4, strain="clear"),
                            G("outerwear", "blazer", "navy", sleeve_end="covers_hand", strain="clear"),
                            G("bottom", "trousers", "grey", leg_shape="wide", hem="pooling", strain="clear"), SHOE(sub="derby", color="black")))
    add("FF7b_tip", Rd(TEE(), JEANS(leg_shape="slim", hem="full_break"), SHOE()))
    add("FF7_slides_drag_owned_by_shoes", Rd(TEE(), JEANS(leg_shape="wide", hem="pooling"), SHOE(sub="slides_sandals", color="black")))
    # color
    add("CC1_too_many", Rd(TEE(color="red"), G("outerwear", "bomber", "green"), JEANS(sub="chinos", color="yellow"), SHOE()))
    add("CC1_busy", Rd(TEE(color="red"), G("outerwear", "bomber", "purple", saturation="muted"), JEANS(sub="chinos", color="blue", saturation="muted"),
                       G("top", "tee", "navy"), G("outerwear", "vest", "khaki_beige"), SHOE()))
    add("CC2_bright_clash", Rd(TEE(color="red"), JEANS(sub="chinos", color="yellow"), SHOE()))
    add("CC2_bold", Rd(TEE(color="red"), JEANS(sub="chinos", color="yellow"), SHOE()), bold="bold")
    add("CC4_near_match", Rd(TEE(), G("outerwear", "blazer", "navy"), JEANS(sub="trousers", color="black"), SHOE(sub="derby", color="black")))
    add("CC6_same_scale", Rd(TEE(sub="flannel_shirt", color="red", pattern="checks_plaid", pattern_scale="medium"),
                             G("outerwear", "overshirt", "navy", pattern="checks_plaid", pattern_scale="medium"), JEANS(), SHOE()))
    add("CC6_same", Rd(TEE(pattern="stripes", pattern_scale="na"), G("outerwear", "overshirt", "navy", pattern="stripes", pattern_scale="na"), JEANS(), SHOE()))
    add("CC6_three", Rd(TEE(pattern="graphic"), G("outerwear", "overshirt", "navy", pattern="checks_plaid", pattern_scale="small"),
                        JEANS(sub="cargos", color="olive", pattern="camo", leg_shape="relaxed"), SHOE()))
    add("CP1_standout", Rd(TEE(color="orange"), JEANS(), SHOE()))
    add("CP2_quiet", Rd(TEE(color="burgundy"), JEANS(), SHOE()))
    add("CP5_tie_in", Rd(TEE(color="brown"), JEANS(color="denim_dark"), SHOE(sub="suede_chukka", color="brown")))
    add("CP3_tonal_tip", Rd(TEE(color="black"), JEANS(color="black"), SHOE(color="black")))
    add("CC5_double_denim_tip", Rd(G("top", "denim_shirt", "denim_light", tucked="none"), JEANS(color="denim_dark"), SHOE()))
    L3 = lambda g, l: dict(g, lightness=l)  # noqa: E731
    add("CP3_tonal_range", Rd(L3(TEE(color="grey"), "light"), L3(JEANS(sub="trousers", color="grey"), "dark"), L3(SHOE(color="grey"), "mid")))
    add("CP3_black_no", Rd(L3(TEE(color="black"), "mid"), L3(JEANS(color="black"), "dark"), L3(SHOE(color="black"), "dark")))
    add("CP4_tonal_shoes", Rd(L3(TEE(color="navy"), "dark"), L3(G("outerwear", "overshirt", "olive"), "mid"), L3(JEANS(sub="chinos", color="navy"), "dark"),
                              L3(SHOE(color="white"), "light")))
    add("CP6_light_mid_dark", Rd(L3(TEE(color="white"), "light"), L3(JEANS(sub="chinos", color="khaki_beige"), "mid"), L3(SHOE(sub="loafer", color="brown"), "dark")))
    add("CP_cap", Rd(L3(TEE(color="orange"), "light"), L3(JEANS(sub="chinos", color="khaki_beige"), "mid"), L3(SHOE(sub="loafer", color="orange"), "dark")))
    # shoes
    add("SK1_slides", Rd(TEE(), JEANS(), SHOE(sub="slides_sandals", color="black")))
    add("SK1_slides_tailored", Rd(TEE(), G("outerwear", "blazer", "navy"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="slides_sandals", color="black")))
    add("SK1b_drags_hem", Rd(TEE(sub="hoodie", color="grey"), JEANS(leg_shape="wide", hem="full_break", color="black"), SHOE(sub="slides_sandals", color="black")))
    add("SK1b_drags_look", Rd(TEE(sub="hoodie", color="grey"), JEANS(leg_shape="wide", hem="cuffed", color="black"), SHOE(sub="slides_sandals", color="black")),
        sl={"under_present": "no", "under_shows": "na", "covers_shoe": "mostly"})
    add("SK1b_look_says_no", Rd(TEE(sub="hoodie", color="grey"), JEANS(leg_shape="wide", hem="pooling", color="black"), SHOE(sub="slides_sandals", color="black")),
        sl={"covers_shoe": "no"})
    add("slides_at_home", Rd(TEE(), G("bottom", "sweatpants", "grey", leg_shape="relaxed", hem="cuffed"), SHOE(sub="slides_sandals", color="black")), occ="home")
    add("SK2_runners", Rd(TEE(), JEANS(), SHOE(sub="performance_runner", color="grey")))
    add("SK2_runners_tailored", Rd(TEE(), G("outerwear", "blazer", "navy"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="performance_runner", color="grey")))
    add("SK2_runners_gym", Rd(TEE(), G("bottom", "athletic_shorts", "black"), SHOE(sub="performance_runner", color="grey")), occ="gym")
    add("SD4_chunky_tailored", Rd(TEE(), G("outerwear", "blazer", "navy"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="chunky_sneaker", color="white")))
    add("SD2_too_casual", Rd(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "charcoal"),
                             G("bottom", "suit_trousers", "charcoal", leg_shape="straight"), SHOE(sub="canvas_sneaker", color="white")), occ="event")
    add("SD3_too_dressy", Rd(TEE(sub="hoodie", color="grey"), G("bottom", "sweatpants", "grey", leg_shape="relaxed", hem="cuffed"), SHOE(sub="dress_shoe", color="black")))
    add("SC_suit_shoe", Rd(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "navy"),
                           G("bottom", "suit_trousers", "navy", leg_shape="straight", hem="no_break"), SHOE(sub="derby", color="black")), occ="wedding_formal")
    add("SC_chosen", Rd(TEE(sub="flannel_shirt", color="red", pattern="checks_plaid", pattern_scale="large"), G("outerwear", "chore_coat", "tan_camel"),
                        JEANS(color="denim_dark", leg_shape="straight", hem="cuffed"), SHOE(sub="work_boot", color="brown")))
    add("SW1_chunky_narrow", Rd(TEE(), JEANS(leg_shape="slim"), SHOE(sub="chunky_sneaker", color="white")))
    add("SW1_runner_narrow", Rd(TEE(), JEANS(leg_shape="skinny"), SHOE(sub="performance_runner", color="grey")))
    add("SW2_carries", Rd(TEE(sub="hoodie", color="black", volume=4), JEANS(leg_shape="wide", hem="cuffed", color="black"), SHOE(sub="basketball_sneaker", color="white")),
        styles=[["streetwear", 1.0]])
    add("SCol1_loud", Rd(TEE(sub="graphic_tee", color="black", pattern="graphic"), JEANS(), SHOE(sub="canvas_sneaker", color="red")))
    add("SCol2_accent", Rd(TEE(), JEANS(color="denim_dark"), SHOE(sub="retro_runner", color="multicolor")))
    add("SQ_worn", Rd(TEE(), JEANS(), SHOE(condition="pilled_or_worn")))
    add("SQ_worn_boot_half", Rd(TEE(), JEANS(), SHOE(sub="work_boot", color="brown", condition="pilled_or_worn")))
    add("SQ_dirty", Rd(TEE(), JEANS(), SHOE(condition="stained")))
    add("SW3_dainty_tip", Rd(TEE(), JEANS(sub="trousers", color="black", leg_shape="wide"), SHOE(sub="loafer", color="black")))
    add("shoes_only_clothes_none", Rd(G("accessory", "hat", "black"), SHOE(), G("top", "tee", "white", certainty="unsure")))
    # cohesion
    add("H1_H2_street", Rd(TEE(sub="hoodie", color="black", volume=4), JEANS(color="black", leg_shape="wide", hem="cuffed"), SHOE(sub="chunky_sneaker", color="white")))
    add("H2_suit", Rd(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "charcoal"), G("bottom", "suit_trousers", "charcoal", leg_shape="straight")))
    add("H3_jacket_jeans", Rd(TEE(), G("outerwear", "blazer", "navy"), JEANS(leg_shape="relaxed"), SHOE()))
    add("H3_spread_big", Rd(G("top", "tank_top", "white", tucked="none"), G("bottom", "suit_trousers", "black", leg_shape="straight"), SHOE(sub="derby", color="black")))
    add("H3_spread_bridged", Rd(TEE(), G("outerwear", "overcoat", "charcoal"), G("bottom", "sweatpants", "grey"), JEANS(), SHOE()))
    add("H3_spread_unbridged", Rd(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "fleece", "grey"), JEANS(sub="shorts", color="khaki_beige"), SHOE()))
    add("H4_standout", Rd(TEE(sub="flannel_shirt", color="navy", pattern="checks_plaid", pattern_scale="medium"), JEANS(color="denim_dark"), SHOE(sub="chelsea_boot", color="brown")))
    add("H4_graphic_street", Rd(TEE(sub="graphic_tee", color="black", pattern="graphic", volume=4), JEANS(color="black", leg_shape="wide", hem="cuffed"),
                                SHOE(sub="chunky_sneaker", color="white")))
    add("H5_statements", Rd(TEE(color="red", pattern="floral"), G("outerwear", "bomber", "orange"), JEANS(sub="chinos", color="pink"), SHOE()), bold="subtle")
    add("H5_unknown_boldness", Rd(TEE(color="red", pattern="floral"), G("outerwear", "bomber", "orange"), JEANS(sub="chinos", color="pink"), SHOE()), bold="loud")
    # v5: SX1 "a piece from another look" (a street-coded top in a quiet outfit) and its exemptions
    LOAF = lambda: SHOE(sub="loafer", color="black")  # noqa: E731
    PLEATS = lambda **kw: G("bottom", "trousers", kw.pop("color", "charcoal"), **{"leg_shape": "straight", "hem": "slight_break", **kw})  # noqa: E731
    SLIMCH = lambda: G("bottom", "chinos", "khaki_beige", leg_shape="slim", hem="slight_break")  # noqa: E731
    add("SX1_graphic_trousers_loafers", Rd(TEE(sub="graphic_tee", color="white", volume=4, pattern="graphic"), PLEATS(), LOAF()), styles=[])
    add("SX1_hoodie_slim_chinos", Rd(TEE(sub="hoodie", color="grey", volume=4), SLIMCH(), SHOE(sub="loafer", color="brown")))
    add("SX1_tee_slim_chinos", Rd(TEE(volume=4), SLIMCH(), SHOE(sub="loafer", color="brown")), styles=[["smart_casual", 1.0]])
    add("SX1_graphic_flip_solid", Rd(TEE(sub="graphic_tee", color="black"), PLEATS(color="black", leg_shape="wide"), LOAF()))
    add("SX1_graphic_derby", Rd(TEE(sub="graphic_tee", color="black", pattern="graphic"), G("bottom", "chinos", "navy", leg_shape="straight"), SHOE(sub="derby", color="brown")))
    add("SX1_under_bomber", Rd(TEE(sub="graphic_tee", color="white", pattern="graphic"), G("outerwear", "bomber", "black"), PLEATS(), LOAF()))
    add("SX1_bridged_blazer", Rd(TEE(sub="graphic_tee", color="black", volume=4, pattern="graphic"), G("outerwear", "blazer", "navy"), PLEATS(), LOAF()))
    add("SX1_bridged_chore", Rd(TEE(sub="graphic_tee", color="black", pattern="graphic"), G("outerwear", "chore_coat", "tan_camel"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), LOAF()))
    add("SX1_minimal_band_ok", Rd(TEE(sub="sweatshirt", color="grey", volume=4), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE(sub="loafer", color="brown")))
    add("SX1_own_piece_oxford", Rd(TEE(sub="oxford_shirt", color="light_blue", volume=4), SLIMCH(), SHOE(sub="loafer", color="brown")))
    add("SX1_city_boy_cropped", Rd(TEE(color="black", volume=4, length="at_belt"), PLEATS(color="black", leg_shape="wide"), LOAF()))
    add("SX1_one_dressy_tip", Rd(TEE(sub="graphic_tee", color="black", pattern="graphic"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE()))
    add("SX1_one_dressy_no_tip", Rd(TEE(sub="hoodie", color="grey", volume=4), JEANS(color="denim_dark", leg_shape="slim"), SHOE(sub="loafer", color="brown")))
    add("SX1_h3_bigger", Rd(G("top", "tank_top", "white", tucked="none", volume=4), G("bottom", "suit_trousers", "black", leg_shape="straight"), SHOE(sub="dress_shoe", color="black")))
    add("SX1_two_tops", Rd(TEE(color="white"), TEE(sub="hoodie", color="grey", volume=4), SLIMCH(), SHOE(sub="loafer", color="brown")))
    add("SX1_suit_spread", Rd(TEE(sub="graphic_tee", color="white", pattern="graphic"), G("bottom", "suit_trousers", "navy", leg_shape="straight"), SHOE(sub="dress_shoe", color="black")))
    # v6: PB1 "roomier than the look" (the council's bands), PB2's tip, H2 on every detected style, Event's band
    SLJ = lambda **kw: JEANS(**{"color": "black", "leg_shape": "slim", **kw})  # noqa: E731
    add("PB1_slim_no_style", Rd(TEE(volume=4), SLJ(), SHOE()), styles=[])
    add("PB1_slim_streetwear", Rd(TEE(sub="hoodie", color="grey", volume=4), SLJ(), SHOE(sub="chunky_sneaker", color="white")))
    add("PB1_full_no_style", Rd(TEE(volume=5), JEANS(color="denim_dark"), SHOE()), styles=[["streetwear", 1.0]])
    add("PB1_slim_smart_casual", Rd(TEE(sub="sweater", color="grey", volume=4), SLJ(), SHOE(sub="chelsea_boot", color="black")))
    add("PB1_oxford_slim_chinos", Rd(TEE(sub="oxford_shirt", color="light_blue", volume=4), SLIMCH(), SHOE(sub="loafer", color="brown")))
    add("PB1_no_subcategory", Rd(G("top", None, "white", volume=4, tucked="none", length="mid_fly"), SLJ(), SHOE()))
    add("PB1_outdoor_holds", Rd(TEE(sub="fleece", color="green", volume=4), JEANS(sub="cargos", color="olive", leg_shape="slim"), SHOE(sub="trail_shoe", color="grey")))
    add("PB1_street_holds", Rd(TEE(volume=4), JEANS(color="black", leg_shape="wide", hem="cuffed"), SHOE()))
    add("PB1_city_boy", Rd(TEE(sub="sweater", color="navy", volume=4), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE(sub="loafer", color="brown")))
    add("PB1_short_ok", Rd(TEE(volume=4, length="at_belt"), JEANS(color="denim_dark"), SHOE()))
    add("PB1_tucked_ok", Rd(TEE(volume=4, tucked="full"), JEANS(color="denim_dark"), SHOE()))
    add("PB1_short_slim_fires", Rd(TEE(volume=4, length="cropped"), SLJ(), SHOE()))
    add("PB1_layer_ok", Rd(TEE(sub="hoodie", color="grey", volume=4), G("outerwear", "chore_coat", "tan_camel"), SLJ(), SHOE(sub="work_boot", color="brown")))
    add("PB1_lounge_ok", Rd(TEE(sub="hoodie", color="grey", volume=4), G("bottom", "joggers", "grey", leg_shape="slim", hem="cuffed"), SHOE(sub="canvas_sneaker")))
    add("PB1_skinny_is_PF5", Rd(TEE(volume=4), JEANS(color="black", leg_shape="skinny"), SHOE()))
    add("PB1_sx1_owns", Rd(TEE(sub="hoodie", color="grey", volume=4), SLIMCH(), SHOE(sub="loafer", color="brown")), styles=[])
    add("PB1_ff5_owns", Rd(TEE(sub="oxford_shirt", color="white", volume=4, sleeve_end="covers_hand"), JEANS(color="denim_dark"), SHOE()))
    add("PB1_ribbed_cuffs_fire", Rd(TEE(sub="hoodie", color="grey", volume=4, sleeve_end="covers_hand"), SLJ(), SHOE()))
    add("PB1_leg_unread", Rd(TEE(volume=4), JEANS(color="black", leg_shape="na"), SHOE()))
    add("PB1_mirror", Rd(TEE(sub="graphic_tee", color="black", volume=4, pattern="graphic"), SLJ(), SHOE(sub="canvas_sneaker", color="black"), mirror_selfie=True))
    add("PB2_tip", Rd(TEE(sub="sweater", color="grey"), G("bottom", "trousers", "grey", leg_shape="wide", hem="slight_break"), SHOE(sub="derby", color="black")))
    add("PB2_minimal_ok", Rd(TEE(sub="sweater", color="black"), G("bottom", "trousers", "black", leg_shape="wide", hem="slight_break"), SHOE(sub="loafer", color="black")))
    add("PB2_jeans_ok", Rd(TEE(sub="sweater", color="grey"), JEANS(leg_shape="wide", hem="cuffed"), SHOE()))
    add("PB2_close_top_ok", Rd(TEE(color="grey", volume=2), G("bottom", "chinos", "khaki_beige", leg_shape="wide"), SHOE()))
    add("PB2_pf4_first", Rd(TEE(sub="oxford_shirt", color="white"), G("bottom", "chinos", "khaki_beige", leg_shape="wide"), SHOE(sub="loafer", color="brown")))
    CARD = lambda: G("top", "cardigan", "navy", tucked="none", length="mid_fly")  # noqa: E731
    OXF = lambda c="white": G("top", "oxford_shirt", c, tucked="none", length="mid_fly")  # noqa: E731
    CH = lambda: G("bottom", "chinos", "khaki_beige", leg_shape="straight", hem="slight_break")  # noqa: E731
    for nm, st in (("none", []), ("prep", [["classic_prep", 1.0]]), ("smart", [["smart_casual", 1.0]])):
        add("H2_any_cardigan_" + nm, Rd(CARD(), OXF(), CH(), SHOE(sub="loafer", color="brown")), styles=st)
    add("H2_any_pink_oxford", Rd(OXF("pink"), CH(), SHOE(sub="loafer", color="brown")))
    add("H2_any_minimal_label", Rd(G("top", "cardigan", "black", tucked="none"), G("bottom", "trousers", "black", leg_shape="wide", hem="slight_break"),
                                   SHOE(sub="loafer", color="black")))
    add("H2_any_rugby_no", Rd(G("top", "rugby_shirt", "navy", tucked="none", pattern="stripes", pattern_scale="large"), CH(), SHOE(sub="loafer", color="brown")))
    for occ in ("event", "interview", "wedding_casual"):
        add("event_band_hoodie@" + occ, Rd(TEE(sub="hoodie", color="grey"), JEANS(color="denim_dark"), SHOE()), occ=occ)
        add("event_band_tee@" + occ, Rd(TEE(color="black"), JEANS(color="denim_dark"), SHOE(sub="low_profile_sneaker", color="black")), occ=occ)
        add("event_band_tank@" + occ, Rd(G("top", "tank_top", "white", tucked="none"), JEANS(sub="shorts", color="khaki_beige"), SHOE(sub="canvas_sneaker")), occ=occ)
    add("refile_vest", Rd(G("top", "oxford_shirt", "white", tucked="full"), G("top", "tank_top", "navy"), G("bottom", "chinos", "grey", leg_shape="straight"), SHOE(sub="loafer", color="brown")))
    add("refile_suit_jacket", Rd(TEE(), G("outerwear", "suit_jacket", "navy"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE(sub="loafer", color="brown")))
    # condition
    add("cond_dim", Rd(TEE(condition="wrinkled"), JEANS(), SHOE(), lighting="dim"))
    add("cond_faults", Rd(TEE(condition="stained"), G("outerwear", "overshirt", "olive", condition="wrinkled"), JEANS(condition="pilled_or_worn"), SHOE()))
    # v7: a condition read on a garment that isn't "clear" is a no-points tip (DECISIONS-LOG #219)
    add("v7_cond_likely_wrinkled", Rd(TEE(sub="oxford_shirt", color="off_white_cream", pattern="stripes", certainty="likely", condition="wrinkled"),
                                       G("outerwear", "hoodie", "green", length="at_belt"), JEANS(leg_shape="wide", hem="full_break", volume=4),
                                       SHOE(sub="basketball_sneaker", color="black", certainty="likely")), occ="class")
    add("v7_cond_likely_all", Rd(TEE(condition="stained", certainty="likely"), G("outerwear", "overshirt", "olive", condition="wrinkled", certainty="likely"),
                                  JEANS(condition="pilled_or_worn", certainty="likely"), SHOE(condition="pilled_or_worn", certainty="likely")))
    add("v7_cond_likely_linen", Rd(TEE(sub="camp_collar_shirt", condition="wrinkled", certainty="likely"), JEANS(sub="drawstring_trousers", color="khaki_beige", condition="wrinkled"), SHOE(sub="loafer", color="brown")))
    add("v7_cond_likely_distressed", Rd(TEE(), JEANS(condition="pilled_or_worn", certainty="likely", distressed_by_design=True),
                                         SHOE(sub="work_boot", color="brown", condition="pilled_or_worn", certainty="likely", distressed_by_design=True)))
    add("v7_cond_likely_dirty_shoes", Rd(TEE(), JEANS(), SHOE(condition="stained", certainty="likely")))
    add("v7_cond_likely_dim", Rd(TEE(condition="wrinkled", certainty="likely"), JEANS(), SHOE(), lighting="dim"))
    add("v7_cond_likely_floor", Rd(G("top", "hoodie", "grey", condition="pilled_or_worn", certainty="likely"),
                                    G("bottom", "sweatpants", "grey", leg_shape="relaxed", hem="pooling"), SHOE(sub="slides_sandals", color="black")))
    add("v7_cond_clear_still_counts", Rd(TEE(condition="wrinkled"), JEANS(condition="pilled_or_worn"), SHOE(condition="pilled_or_worn")))
    add("cond_cap", Rd(TEE(condition="stained"), G("outerwear", "overshirt", "olive", condition="stained"), JEANS(condition="wrinkled"), SHOE()))
    add("cond_linen", Rd(G("top", "camp_collar_shirt", "white", condition="wrinkled", tucked="none"), G("bottom", "drawstring_trousers", "khaki_beige", leg_shape="straight", condition="wrinkled"), SHOE(sub="loafer", color="brown")))
    add("cond_distressed", Rd(TEE(), JEANS(condition="pilled_or_worn", distressed_by_design=True), SHOE()))
    add("cond_stain_likely", Rd(TEE(condition="stained", certainty="likely"), JEANS(), SHOE()))
    add("T1_untucked", Rd(G("top", "dress_shirt", "white", tucked="none"), G("bottom", "trousers", "grey", leg_shape="straight"), SHOE(sub="derby", color="black")))
    add("T1_occasion", Rd(G("top", "dress_shirt", "white", tucked="none"), JEANS(), SHOE()), occ="interview")
    # occasion
    add("O1_curve", Rd(G("top", "tank_top", "white", tucked="none"), G("bottom", "athletic_shorts", "black"), SHOE(sub="slides_sandals", color="black")), occ="interview_corporate")
    add("O1_mid", Rd(TEE(), JEANS(), SHOE(sub="canvas_sneaker")), occ="interview")
    add("O1_casual_line", Rd(TEE(), JEANS(), SHOE(sub="canvas_sneaker")), occ="date")
    add("overdressed", Rd(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "suit_jacket", "charcoal"), G("bottom", "suit_trousers", "charcoal", leg_shape="straight"),
                          SHOE(sub="dress_shoe", color="black")), occ="gym")
    add("lounge_dressy", Rd(TEE(), G("bottom", "sweatpants", "grey"), SHOE()), occ="event")
    add("lounge_0", Rd(TEE(sub="hoodie", color="grey"), G("bottom", "sweatpants", "grey"), SHOE(sub="slides_sandals", color="grey")))
    add("lounge_1", Rd(TEE(sub="hoodie", color="grey"), G("bottom", "sweatpants", "grey"), SHOE(sub="retro_runner", color="grey")))
    add("lounge_2", Rd(G("top", "quarter_zip", "navy", tucked="none"), G("outerwear", "overcoat", "charcoal"), G("bottom", "sweatpants", "grey"), SHOE(sub="retro_runner")))
    add("lounge_hero", Rd(G("top", "jersey", "red", tucked="none"), G("outerwear", "denim_jacket", "denim_mid"), G("bottom", "sweatpants", "black"), SHOE(sub="low_profile_sneaker")))
    add("lounge_kit", Rd(G("top", "jersey", "blue", tucked="none"), G("bottom", "athletic_shorts", "white"), SHOE(sub="performance_runner")))
    add("lounge_gym_shorts_ok", Rd(TEE(), G("bottom", "athletic_shorts", "black"), SHOE(sub="canvas_sneaker")))
    add("lounge_no_shoes", Rd(TEE(sub="hoodie", color="grey"), G("bottom", "sweatpants", "grey"), SHOE(), shoes_visible=False))
    add("slides_dressy", Rd(G("top", "oxford_shirt", "white", tucked="full"), G("bottom", "chinos", "navy", leg_shape="straight"), SHOE(sub="slides_sandals", color="black")), occ="event")
    add("sneakers_blazer_interview", Rd(G("top", "dress_shirt", "white", tucked="full"), G("outerwear", "blazer", "navy"), G("bottom", "trousers", "grey", leg_shape="straight"),
                                        SHOE()), occ="interview_tech")
    add("big_logo_interview", Rd(TEE(sub="sweater", color="navy", logo="large"), G("bottom", "chinos", "khaki_beige", leg_shape="straight"), SHOE(sub="loafer", color="brown")), occ="interview")
    add("floor_everyday", Rd(TEE(color="red", volume=5, sleeve_end="covers_hand"), G("outerwear", "puffer", "green", sleeve_end="covers_hand"),
                             JEANS(sub="chinos", color="yellow", leg_shape="skinny"), SHOE(sub="slides_sandals", color="pink")), occ="everyday")
    add("floor_lift", Rd(G("top", "tank_top", "red", tucked="none", volume=5), G("outerwear", "puffer", "green", sleeve_end="covers_hand", volume=5),
                         G("bottom", "suit_trousers", "yellow", leg_shape="skinny"), SHOE(sub="slides_sandals", color="pink")), occ="everyday")
    add("floor_blocked_strain", Rd(TEE(color="red", volume=5, strain="clear"), G("outerwear", "puffer", "green"), JEANS(sub="chinos", color="yellow", leg_shape="skinny"),
                                   SHOE(sub="slides_sandals", color="pink")), occ="class")
    add("min_3", Rd(G("top", "tank_top", "red", strain="clear", condition="stained", volume=5, sleeve_end="covers_hand"),
                    G("bottom", "athletic_shorts", "yellow", hem="pooling", leg_shape="skinny", condition="stained"),
                    SHOE(sub="slides_sandals", color="pink"), G("outerwear", "puffer", "orange", pattern="camo"), G("top", "graphic_tee", "purple", pattern="floral")),
        occ="interview_corporate", bold="subtle")
    # earned bonus, the solid line, the lowest-part line
    add("earned_bonus", Rd(G("top", "oxford_shirt", "light_blue", tucked="full"), G("outerwear", "sport_coat", "navy"),
                           G("bottom", "chinos", "khaki_beige", leg_shape="straight", hem="no_break"), SHOE(sub="loafer", color="brown")), occ="date")
    add("solid_all_seven", Rd(TEE(sub="hoodie", color="grey"), JEANS(), SHOE(sub="canvas_sneaker", color="white")))
    # second-look forms
    for i, s in enumerate([None, {}, {"peek": False}, {"rests_on_shoe": True}, {"peek": True, "rests_on_shoe": False},
                           {"under_present": "yes", "under_shows": "a_little"}, {"under_present": "no", "under_shows": "clearly"},
                           {"under_present": "yes", "under_shows": "clearly", "covers_shoe": "partly"}, {"covers_shoe": "unsure"}]):
        add(f"second_look_form_{i}", Rd(TEE(), G("outerwear", "bomber", "black"), JEANS(leg_shape="wide", hem="cuffed"), SHOE(sub="slides_sandals", color="black")), sl=s)
    # v8 (the gold-set retune, #227-228)
    add("v8_skinny_ripped", Rd(TEE(), JEANS(leg_shape="skinny", distressed_by_design=True), SHOE()))
    add("v8_slim_chinos", Rd(G("top", "polo", "navy", tucked="none", length="mid_fly"), JEANS(sub="chinos", color="khaki_beige", leg_shape="slim"), SHOE(sub="loafer", color="brown")))
    add("v8_slim_under_blazer", Rd(G("outerwear", "blazer", "navy"), G("top", "oxford_shirt", "white", tucked="full"), JEANS(sub="trousers", color="grey", leg_shape="slim"), SHOE(sub="derby", color="black")))
    add("v8_slim_suit", Rd(G("outerwear", "suit_jacket", "navy"), G("top", "dress_shirt", "white", tucked="full"), JEANS(sub="suit_trousers", color="navy", leg_shape="slim"), SHOE(sub="dress_shoe", color="black")))
    add("v8_loud_plaid_sweater", Rd(TEE(sub="sweater", color="navy", pattern="checks_plaid", pattern_scale="large", length="at_belt"), JEANS(sub="chinos", color="grey"), SHOE(sub="loafer", color="brown")))
    add("v8_loud_floral_outer", Rd(G("outerwear", "overshirt", "multicolor", pattern="floral", pattern_scale="large"), TEE(), JEANS(), SHOE()))
    add("v8_bright_graphic", Rd(TEE(sub="graphic_tee", color="orange", pattern="graphic", pattern_scale="medium", saturation="bright"), JEANS(color="black", leg_shape="slim"), SHOE()))
    add("v8_logo_tee", Rd(TEE(sub="graphic_tee", color="white", pattern="graphic", pattern_scale="large", logo="large"), JEANS(), SHOE(sub="retro_runner")))
    add("v8_logo_hoodie", Rd(TEE(sub="hoodie", color="black", pattern="graphic", pattern_scale="large", logo="large"), JEANS(leg_shape="wide"), SHOE(sub="chunky_sneaker", color="black")))
    add("v8_stripes_large_ok", Rd(TEE(sub="knit_polo", color="tan_camel", pattern="stripes", pattern_scale="large", length="at_belt"), JEANS(sub="trousers", color="black", leg_shape="wide"), SHOE(sub="loafer", color="black")))
    add("v8_tank_alone", Rd(TEE(sub="tank_top", color="white"), JEANS(), SHOE(sub="canvas_sneaker")))
    add("v8_tank_gym", Rd(TEE(sub="tank_top", color="white"), G("bottom", "athletic_shorts", "black"), SHOE(sub="performance_runner", color="black")), occ="gym")
    add("v8_tank_under_shirt", Rd(G("top", "oxford_shirt", "white", tucked="none", length="mid_fly"), TEE(sub="tank_top", color="white"), JEANS(), SHOE()))
    add("v8_knit_belt_wide", Rd(TEE(sub="sweater", color="burgundy", length="at_belt"), JEANS(sub="trousers", color="black", leg_shape="wide", hem="full_break"), SHOE(sub="loafer", color="black")))
    add("v8_knit_belt_straight", Rd(TEE(sub="sweater", color="burgundy", length="at_belt"), JEANS(sub="trousers", color="black"), SHOE(sub="loafer", color="black")))
    add("v8_mirror_short_wide", Rd(TEE(length="at_belt"), JEANS(leg_shape="wide"), SHOE(sub="dress_shoe", color="black"), mirror_selfie=True))
    add("v8_mirror_short_straight", Rd(TEE(length="at_belt"), JEANS(), SHOE(), mirror_selfie=True))
    add("v8_tuck_straight", Rd(TEE(sub="dress_shirt", tucked="full", length="na"), JEANS(sub="trousers", color="grey"), SHOE(sub="dress_shoe", color="black")))
    add("v8_pool_wide_jeans", Rd(TEE(length="at_belt"), JEANS(leg_shape="wide", hem="pooling"), SHOE(sub="chunky_sneaker", color="black")))
    add("v8_pool_wide_trousers", Rd(TEE(length="at_belt"), JEANS(sub="trousers", color="black", leg_shape="wide", hem="pooling"), SHOE(sub="loafer", color="black")))
    add("v8_pool_straight", Rd(TEE(), JEANS(hem="pooling"), SHOE()))
    add("v8_roomy_shirt_sleeves", Rd(TEE(sub="oxford_shirt", color="light_blue", volume=4, sleeve_end="covers_hand", length="at_belt"), JEANS(sub="trousers", color="black", leg_shape="wide"), SHOE(sub="dress_shoe", color="black")))
    add("v8_layer_at_belt_wide", Rd(G("outerwear", "chore_coat", "black", length="at_belt"), TEE(), JEANS(color="black", leg_shape="wide"), SHOE(sub="derby", color="black")))
    add("v8_layer_at_belt_straight", Rd(G("outerwear", "fleece", "burgundy", length="at_belt"), TEE(), JEANS(), SHOE(sub="work_boot", color="tan_camel")))
    add("v8_layer_bomber_wide", Rd(G("outerwear", "bomber", "black", length="at_belt"), TEE(), JEANS(sub="trousers", color="tan_camel", leg_shape="wide"), SHOE(sub="loafer", color="brown")))
    add("v8_loafer_jeans_tee", Rd(TEE(), JEANS(), SHOE(sub="dress_shoe", color="black")))
    add("v8_dress_shoe_sweats", Rd(G("top", "hoodie", "grey", tucked="none", length="mid_fly"), G("bottom", "sweatpants", "grey", leg_shape="relaxed"), SHOE(sub="dress_shoe", color="black")))
    add("v8_wide_loafer_tip", Rd(TEE(tucked="full", length="na"), JEANS(sub="trousers", color="off_white_cream", leg_shape="wide"), SHOE(sub="loafer", color="black")))
    add("v8_runner", Rd(TEE(), JEANS(), SHOE(sub="performance_runner", color="blue", saturation="bright")))
    add("v8_slides_clean", Rd(G("top", "dress_shirt", "light_blue", pattern="stripes", pattern_scale="small", tucked="none", length="mid_fly", volume=4), JEANS(sub="trousers", color="off_white_cream", leg_shape="wide"), SHOE(sub="slides_sandals", color="black")))
    add("v8_slides_narrow", Rd(TEE(), JEANS(leg_shape="slim"), SHOE(sub="slides_sandals", color="black")))
    add("v8_lounge_style", Rd(G("outerwear", "cardigan", "navy", length="at_belt"), TEE(), G("bottom", "sweatpants", "navy", leg_shape="wide", hem="full_break", volume=4), SHOE(sub="basketball_sneaker", color="multicolor")))
    add("v8_lounge_no_style", Rd(G("top", "hoodie", "navy", tucked="none", length="at_belt", volume=4), G("bottom", "sweatpants", "light_grey", leg_shape="wide", volume=5)))
    add("v8_penalty_piles", Rd(TEE(sub="graphic_tee", color="orange", pattern="graphic", pattern_scale="large", saturation="bright", logo="large", strain="clear"), JEANS(leg_shape="skinny", distressed_by_design=True, strain="clear"), SHOE(sub="performance_runner", color="black")))
    add("v8_bright_one", Rd(TEE(sub="sweater", color="blue", saturation="bright", length="at_belt"), JEANS(color="white", leg_shape="wide"), SHOE(sub="loafer", color="brown")))
    # v9 (four consensus fixes, #232)
    add("v9_int_tee", Rd(TEE(volume=4, tucked="full", length="na"), JEANS(sub="trousers", color="black", leg_shape="wide"), SHOE(sub="loafer", color="black")), occ="interview")
    add("v9_int_hoodie", Rd(G("top", "hoodie", "grey", tucked="none", length="mid_fly"), JEANS(color="denim_dark"), SHOE()), occ="interview")
    add("v9_int_hoodie_blazer", Rd(G("outerwear", "blazer", "navy"), G("top", "hoodie", "grey", tucked="none", length="mid_fly"), JEANS(sub="trousers", color="grey"), SHOE(sub="loafer", color="black")), occ="interview")
    add("v9_int_oxford", Rd(G("top", "oxford_shirt", "white", tucked="full", length="na"), JEANS(sub="chinos", color="navy"), SHOE(sub="loafer", color="brown")), occ="interview_corporate")
    add("v9_int_knit", Rd(TEE(sub="sweater", color="navy", length="at_belt"), JEANS(sub="trousers", color="grey"), SHOE(sub="derby", color="black")), occ="interview_tech")
    add("v9_denim_mid_mid", Rd(G("outerwear", "denim_jacket", "denim_mid"), TEE(), JEANS(color="denim_mid"), SHOE()))
    add("v9_denim_dark_dark", Rd(G("outerwear", "denim_jacket", "denim_dark"), TEE(), JEANS(color="denim_dark", leg_shape="wide"), SHOE(sub="loafer", color="black")))
    add("v9_denim_light_dark", Rd(G("outerwear", "denim_jacket", "denim_light"), TEE(), JEANS(color="denim_dark"), SHOE()))
    add("v9_graphic_blazer_big", Rd(G("outerwear", "blazer", "navy"), TEE(sub="graphic_tee", pattern="graphic", pattern_scale="large", volume=4), JEANS(color="denim_dark"), SHOE(sub="loafer", color="brown")))
    add("v9_graphic_blazer_fitted", Rd(G("outerwear", "blazer", "navy"), TEE(sub="graphic_tee", pattern="graphic", pattern_scale="medium", volume=3), JEANS(color="denim_dark"), SHOE(sub="loafer", color="brown")))
    add("v9_street_logo_tee", Rd(TEE(sub="graphic_tee", color="black", pattern="graphic", pattern_scale="large", logo="large", volume=4), JEANS(color="black", leg_shape="wide"), SHOE(sub="chunky_sneaker", color="white")))
    add("v9_workwear_flannel", Rd(G("outerwear", "flannel_shirt", "red", pattern="checks_plaid", pattern_scale="large"), TEE(color="grey"), JEANS(color="denim_dark"), SHOE(sub="work_boot", color="brown")))
    add("v9_argyle_smart", Rd(TEE(sub="sweater", color="navy", pattern="checks_plaid", pattern_scale="large", length="at_belt"), JEANS(sub="chinos", color="grey"), SHOE(sub="loafer", color="brown")))
    add("v9_bright_street_graphic", Rd(TEE(sub="graphic_tee", color="orange", pattern="graphic", pattern_scale="large", saturation="bright", volume=4), JEANS(color="black", leg_shape="wide"), SHOE(sub="chunky_sneaker", color="black")))
    # v10 (the creators' rules)
    add("v10_toned_down", Rd(TEE(sub="sweater", color="orange", length="at_belt"), JEANS(color="black"), SHOE()))
    add("v10_toned_down_navy", Rd(G("outerwear", "bomber", "navy"), TEE(color="red"), JEANS(color="denim_mid"), SHOE()))
    add("v10_toned_down_no_dark", Rd(TEE(color="orange"), JEANS(color="khaki_beige", sub="chinos"), SHOE()))
    add("v10_toned_down_two_bright", Rd(TEE(color="orange"), JEANS(color="black", sub="chinos"), G("outerwear", "bomber", "yellow"), SHOE()))
    add("v10_toned_down_fault", Rd(TEE(color="orange"), G("outerwear", "overshirt", "black", pattern="checks_plaid", pattern_scale="medium"),
                                    JEANS(color="black", pattern="checks_plaid", pattern_scale="medium"), SHOE()))
    add("v10_toned_down_loud", Rd(TEE(color="red"), JEANS(sub="chinos", color="black"), G("bottom", "shorts", "orange", pattern="floral", pattern_scale="large"), SHOE()))
    add("v10_toned_down_bright_bottom_print", Rd(TEE(color="black"), JEANS(sub="chinos", color="orange", pattern="camo", pattern_scale="large"), SHOE()))
    add("v10_toned_down_worn", Rd(TEE(color="orange", condition="pilled_or_worn"), JEANS(color="black"), SHOE()))
    add("v10_slim_jeans", Rd(TEE(), JEANS(color="black", leg_shape="slim"), SHOE()))
    add("v10_slim_ripped", Rd(TEE(), JEANS(color="black", leg_shape="slim", distressed_by_design=True), SHOE()))
    add("v10_skinny_jeans", Rd(TEE(), JEANS(color="black", leg_shape="skinny"), SHOE()))
    add("v10_slim_chinos", Rd(TEE(sub="oxford_shirt", color="light_blue"), JEANS(sub="chinos", color="khaki_beige", leg_shape="slim"), SHOE(sub="loafer", color="brown")))
    # v11 (a base top under a layer in STY-4; skinny joggers)
    add("v11_tank_flannel_trousers", Rd(TEE(sub="tank_top", tucked="full", length="na"), G("outerwear", "flannel_shirt", "black", volume=4),
                                        JEANS(sub="trousers", color="black", leg_shape="wide", volume=4), SHOE(sub="loafer", color="black")))
    add("v11_tank_flannel_top", Rd(TEE(sub="tank_top", tucked="full", length="na"), TEE(sub="flannel_shirt", color="black", volume=4),
                                   JEANS(sub="trousers", color="black", leg_shape="wide"), SHOE(sub="dress_shoe", color="black")))
    add("v11_tank_cardigan", Rd(TEE(sub="tank_top"), TEE(sub="cardigan", color="navy"), JEANS(sub="trousers", color="grey"), SHOE(sub="derby", color="brown")))
    add("v11_tank_alone_trousers", Rd(TEE(sub="tank_top"), JEANS(sub="trousers", color="black", leg_shape="wide"), SHOE(sub="loafer", color="black")))
    add("v11_tank_hoodie_trousers", Rd(TEE(sub="tank_top"), TEE(sub="hoodie", color="grey"), JEANS(sub="trousers", color="black"), SHOE(sub="loafer", color="black")))
    add("v11_tee_suit", Rd(TEE(), G("outerwear", "suit_jacket", "navy"), JEANS(sub="suit_trousers", color="navy"), SHOE(sub="dress_shoe", color="black")))
    add("v11_skinny_joggers", Rd(TEE(sub="sweater", color="black"), JEANS(sub="joggers", color="black", leg_shape="skinny"), SHOE()))
    add("v11_skinny_sweats_roomy", Rd(TEE(sub="hoodie", color="grey", volume=4), JEANS(sub="sweatpants", color="grey", leg_shape="skinny"), SHOE(sub="chunky_sneaker", color="white")))
    add("v11_skinny_joggers_gym", Rd(TEE(sub="sweater", color="black"), JEANS(sub="joggers", color="black", leg_shape="skinny"), SHOE()), occ="gym")
    add("v11_skinny_joggers_interview", Rd(TEE(sub="sweater", color="black"), JEANS(sub="joggers", color="black", leg_shape="skinny"), SHOE()), occ="interview")
    add("v11_slim_joggers", Rd(TEE(sub="sweater", color="black"), JEANS(sub="joggers", color="black", leg_shape="slim"), SHOE()))
    # v12 (the founder's Oct 14 calls)
    add("v12_red_small_graphic", Rd(TEE(sub="graphic_tee", color="red", pattern="graphic", pattern_scale="small", logo="small", saturation="bright", length="at_belt"),
                                    JEANS(color="black", leg_shape="wide", volume=4, hem="full_break"), SHOE(sub="slides_sandals", color="black")))
    add("v12_red_medium_graphic", Rd(TEE(sub="graphic_tee", color="red", pattern="graphic", pattern_scale="medium", saturation="bright"), JEANS(color="denim_dark"), SHOE()))
    add("v12_red_small_big_logo", Rd(TEE(sub="graphic_tee", color="red", pattern="graphic", pattern_scale="small", logo="large", saturation="bright"), JEANS(color="denim_dark"), SHOE()))
    add("v12_red_graphic_nosize", Rd(TEE(sub="graphic_tee", color="red", pattern="graphic", saturation="bright"), JEANS(color="black"), SHOE()))
    add("v12_fitted_straight", Rd(TEE(color="black"), JEANS(volume=2), SHOE()))
    add("v12_fitted_straight_tuck", Rd(TEE(sub="polo", color="black", tucked="full", length="na"), JEANS(volume=2), SHOE()))
    add("v12_fitted_straight_chunky", Rd(TEE(color="black"), JEANS(volume=2, strain="clear", hem="full_break"), SHOE(sub="chunky_sneaker")))
    add("v12_fitted_wide_v2", Rd(TEE(color="black", volume=4), JEANS(volume=2, leg_shape="wide"), SHOE(sub="performance_runner", color="black")))
    add("v12_fitted_joggers", Rd(TEE(sub="sweater", color="black"), JEANS(sub="joggers", color="black", volume=2), SHOE()))
    add("v12_fitted_suit", Rd(TEE(sub="oxford_shirt"), JEANS(sub="suit_trousers", color="navy", volume=2), SHOE(sub="derby", color="brown")))
    add("v12_fitted_blazer", Rd(TEE(sub="dress_shirt", tucked="full", length="na"), G("outerwear", "blazer", "navy"), JEANS(sub="trousers", color="grey", volume=2), SHOE(sub="derby", color="brown")))
    add("v12_fitted_no_volume", Rd(TEE(color="black"), JEANS(volume=None), SHOE()))
    add("v12_cream_khaki", Rd(TEE(sub="oxford_shirt", color="off_white_cream", condition="wrinkled"), JEANS(sub="chinos", color="khaki_beige", leg_shape="slim", volume=2, hem="full_break")))
    add("v12_white_white", Rd(TEE(), JEANS(color="white"), SHOE()))
    add("v12_light_dark_inner", Rd(TEE(color="black"), G("outerwear", "overshirt", "off_white_cream"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("v12_light_outer", Rd(TEE(), G("outerwear", "overshirt", "off_white_cream"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="suede_chukka", color="tan_camel")))
    add("v12_light_dark_outer", Rd(TEE(), G("outerwear", "cardigan", "navy"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("v12_white_khaki", Rd(TEE(sub="oxford_shirt"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("v12_white_cream", Rd(TEE(), JEANS(color="off_white_cream"), SHOE()))
    add("v12_khaki_white", Rd(TEE(color="khaki_beige"), JEANS(color="white"), SHOE()))
    add("v12_light_suit", Rd(TEE(sub="dress_shirt", tucked="full", length="na"), G("outerwear", "suit_jacket", "khaki_beige"), JEANS(sub="suit_trousers", color="khaki_beige"), SHOE(sub="derby", color="brown")))
    add("v12_light_grey", Rd(TEE(color="light_grey"), JEANS(color="white"), SHOE()))
    add("v12_wr_tee", Rd(TEE(condition="wrinkled"), JEANS(color="denim_dark"), SHOE()))
    add("v12_wr_tee_likely", Rd(TEE(condition="wrinkled", certainty="likely"), JEANS(color="denim_dark"), SHOE()))
    add("v12_wr_tee_blazer", Rd(TEE(condition="wrinkled"), G("outerwear", "blazer", "navy"), JEANS(sub="trousers", color="grey"), SHOE(sub="loafer", color="brown")))
    add("v12_wr_hoodie_interview", Rd(TEE(sub="hoodie", color="grey", condition="wrinkled"), JEANS(color="denim_dark"), SHOE()), occ="interview")
    add("v12_wr_chore_work", Rd(TEE(), G("outerwear", "chore_coat", "brown", condition="wrinkled"), JEANS(color="denim_dark"), SHOE(sub="work_boot", color="brown")))
    add("v12_wr_chore_work_likely", Rd(TEE(), G("outerwear", "chore_coat", "brown", condition="wrinkled", certainty="likely"), JEANS(color="denim_dark"), SHOE(sub="work_boot", color="brown")))
    add("v12_wr_chore_chinos", Rd(TEE(), G("outerwear", "chore_coat", "brown", condition="wrinkled"), JEANS(sub="chinos", color="navy"), SHOE(sub="loafer", color="brown")))
    add("v12_wr_chore_interview", Rd(TEE(), G("outerwear", "chore_coat", "brown", condition="wrinkled"), JEANS(color="denim_dark"), SHOE(sub="work_boot", color="brown")), occ="interview")
    add("v12_wr_chore_event", Rd(TEE(), G("outerwear", "chore_coat", "brown", condition="wrinkled"), JEANS(color="denim_dark"), SHOE(sub="work_boot", color="brown")), occ="event")
    add("v12_wr_camp_linen", Rd(TEE(sub="camp_collar_shirt", color="olive", condition="wrinkled"), JEANS(sub="drawstring_trousers", color="khaki_beige", condition="wrinkled", leg_shape="relaxed"), SHOE(sub="loafer", color="brown")))
    add("v12_wr_oxford_jeans", Rd(TEE(sub="oxford_shirt", condition="wrinkled"), JEANS(color="denim_dark"), SHOE()), occ="class")
    add("v12_wr_oxford_jeans_date", Rd(TEE(sub="oxford_shirt", condition="wrinkled"), JEANS(color="denim_dark"), SHOE()), occ="date")
    add("v12_wr_oxford_chinos", Rd(TEE(sub="oxford_shirt", color="light_blue", condition="wrinkled"), JEANS(sub="chinos", color="navy"), SHOE(sub="loafer", color="brown")))
    add("v12_wr_two_tees_likely", Rd(TEE(condition="wrinkled", certainty="likely"), G("outerwear", "blazer", "navy"), TEE(condition="wrinkled", certainty="likely"), JEANS(sub="trousers", color="grey"), SHOE(sub="loafer", color="brown")))
    add("v12_wr_cargos_street", Rd(TEE(sub="hoodie", color="black", volume=4), JEANS(sub="cargos", color="olive", leg_shape="wide", condition="wrinkled"), SHOE(sub="chunky_sneaker")))
    # v13 (wrinkled knit tops by look)
    add("v13_wr_tee_smart", Rd(TEE(condition="wrinkled"), JEANS(sub="chinos", color="navy"), SHOE(sub="loafer", color="brown")))
    add("v13_wr_tee_smart_likely", Rd(TEE(condition="wrinkled", certainty="likely"), JEANS(sub="chinos", color="navy"), SHOE(sub="loafer", color="brown")))
    add("v13_wr_sweatshirt_minimal", Rd(TEE(sub="sweatshirt", color="grey", condition="wrinkled"), JEANS(sub="chinos", color="navy"), SHOE(sub="loafer", color="brown")))
    add("v13_wr_tee_prep", Rd(G("outerwear", "cardigan", "navy"), TEE(condition="wrinkled"), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("v13_wr_tee_overshirt_smart", Rd(TEE(color="black", condition="wrinkled"), G("outerwear", "overshirt", "olive"), JEANS(sub="chinos", color="navy"), SHOE(sub="suede_chukka", color="brown")))
    add("v13_wr_hoodie_blazer", Rd(TEE(sub="hoodie", color="grey", condition="wrinkled"), G("outerwear", "blazer", "navy"), JEANS(sub="trousers", color="grey"), SHOE(sub="loafer", color="brown")))
    add("v13_wr_sweatshirt_interview", Rd(TEE(sub="sweatshirt", color="grey", condition="wrinkled"), JEANS(sub="chinos", color="navy"), SHOE(sub="loafer", color="brown")), occ="interview")
    add("v13_wr_tee_mixed_street", Rd(TEE(color="off_white_cream", volume=4, length="at_belt", condition="wrinkled"), JEANS(color="black", leg_shape="wide"), SHOE(sub="chunky_sneaker")))
    add("v13_wr_tee_workwear", Rd(TEE(condition="wrinkled"), G("outerwear", "chore_coat", "brown"), JEANS(sub="chinos", color="navy"), SHOE(sub="work_boot", color="brown")))
    add("v13_wr_hoodie_street", Rd(TEE(sub="hoodie", color="black", volume=4, condition="wrinkled"), JEANS(color="black", leg_shape="wide", volume=4), SHOE(sub="chunky_sneaker")))
    add("v13_wr_tee_nostyle", Rd(TEE(color="red", condition="wrinkled"), G("bottom", "shorts", "olive"), SHOE(sub="slides_sandals", color="black")))
    add("v13_wr_tee_nostyle_likely", Rd(TEE(condition="wrinkled", certainty="likely"), JEANS(color="denim_dark"), SHOE()))
    # v14 (casual and athletic fits)
    GYM = lambda **kw: G("bottom", kw.pop("sub", "athletic_shorts"), kw.pop("color", "black"), **{"leg_shape": "relaxed", "volume": 4, **kw})  # noqa: E731
    add("v14_shorts_plain", Rd(TEE(), GYM(sub="shorts", color="khaki_beige", volume=3), SHOE(sub="canvas_sneaker", color="black")), occ="class")
    add("v14_shorts_shape", Rd(TEE(sub="hoodie", color="grey", volume=4), GYM(), SHOE(sub="basketball_sneaker")), occ="class")
    add("v14_shorts_layer", Rd(TEE(), G("outerwear", "bomber", "light_grey", length="at_belt"), GYM(sub="shorts", color="off_white_cream", leg_shape="wide"), SHOE(sub="chunky_sneaker", color="black")))
    add("v14_shorts_layer_read", Rd(TEE(), G("outerwear", "overshirt", "olive", length="at_belt"), GYM(sub="shorts", color="black", leg_shape="wide"), SHOE(sub="retro_runner", color="grey")))
    add("v14_shorts_roomy_fitted", Rd(TEE(sub="hoodie", color="grey", volume=4), GYM(sub="shorts", color="khaki_beige", leg_shape="slim", volume=2), SHOE(sub="basketball_sneaker")), occ="class")
    add("v14_shorts_fitted", Rd(TEE(), GYM(sub="shorts", color="khaki_beige", leg_shape="slim", volume=2), SHOE(sub="basketball_sneaker")), occ="class")
    add("v14_shorts_strain", Rd(TEE(), GYM(strain="clear"), SHOE(sub="basketball_sneaker")), occ="class")
    add("v14_shorts_slides", Rd(TEE(sub="hoodie", color="grey", volume=4), GYM(sub="shorts", leg_shape="wide"), SHOE(sub="slides_sandals", color="black")))
    add("v14_shorts_runners_gym", Rd(TEE(sub="tank_top"), GYM(), SHOE(sub="performance_runner", color="grey")), occ="gym")
    add("v14_shorts_hidden_shoes", Rd(TEE(sub="hoodie", color="grey", volume=4), GYM(), shoes_visible=False))
    add("v14_gym_runners_class", Rd(TEE(), GYM(), SHOE(sub="performance_runner", color="grey")), occ="class")
    add("v14_gym_runners_going_out", Rd(TEE(), GYM(), SHOE(sub="performance_runner", color="grey")), occ="going_out")
    add("v14_kit_clean", Rd(TEE(sub="jersey", color="green"), GYM(), SHOE(sub="basketball_sneaker")), occ="class")
    add("v14_kit_tight", Rd(TEE(sub="jersey", color="green"), GYM(leg_shape="slim", volume=2), SHOE(sub="basketball_sneaker")), occ="class")
    add("v14_kit_pulls", Rd(TEE(sub="jersey", color="green", strain="clear"), GYM(), SHOE(sub="basketball_sneaker")))
    add("v14_kit_gym", Rd(TEE(sub="jersey", color="green"), GYM(), SHOE(sub="basketball_sneaker")), occ="gym")
    add("v14_sweatsuit_good", Rd(TEE(sub="hoodie", color="grey", volume=4), GYM(sub="sweatpants", color="grey", hem="cuffed"), SHOE()))
    add("v14_sweatsuit_regular", Rd(TEE(sub="hoodie", color="grey"), GYM(sub="sweatpants", color="grey", volume=3, hem="cuffed"), SHOE()))
    add("v14_sweatsuit_slim", Rd(TEE(sub="hoodie", color="grey"), GYM(sub="joggers", color="grey", leg_shape="slim", volume=3, hem="cuffed"), SHOE()))
    add("v14_sweatsuit_slides", Rd(TEE(sub="hoodie", color="grey", volume=4), GYM(sub="sweatpants", color="grey", hem="full_break"), SHOE(sub="slides_sandals", color="black")))
    add("v14_sweatsuit_zip", Rd(TEE(), G("outerwear", "hoodie", "navy"), GYM(sub="joggers", color="navy", hem="cuffed"), SHOE(sub="retro_runner", color="grey")), occ="class")
    add("v14_look_sign", Rd(TEE(sub="hoodie", color="grey"), GYM(sub="sweatpants", color="black", leg_shape="wide", hem="cuffed"), SHOE(sub="chunky_sneaker")), occ="class")
    add("v14_look_sign_date", Rd(TEE(sub="hoodie", color="grey"), GYM(sub="sweatpants", color="black", leg_shape="wide", hem="cuffed"), SHOE(sub="chunky_sneaker")), occ="date")
    add("v14_canvas_match", Rd(TEE(), JEANS(color="denim_dark"), SHOE(sub="canvas_sneaker", color="black")), occ="class")
    add("v14_boots_sweats", Rd(TEE(sub="hoodie", color="grey"), GYM(sub="sweatpants", color="black", hem="cuffed"), SHOE(sub="work_boot", color="brown")))
    add("v14_goes_together_suit", Rd(TEE(sub="dress_shirt", tucked="full", length="na"), G("outerwear", "suit_jacket", "navy"), JEANS(sub="suit_trousers", color="navy"), SHOE(sub="derby", color="brown")))
    add("v14_sc_pair_street", Rd(TEE(sub="hoodie", color="grey"), JEANS(color="black", leg_shape="wide", volume=4), SHOE(sub="chunky_sneaker")), occ="class")
    add("v14_tracksuit", Rd(TEE(), G("outerwear", "track_jacket", "navy"), GYM(sub="track_pants", color="navy", leg_shape="straight", volume=3, hem="slight_break"), SHOE(sub="retro_runner", color="grey")))
    add("v14_heavy_chunky_slim", Rd(TEE(sub="hoodie", color="grey", volume=4), JEANS(color="black", leg_shape="slim"), SHOE(sub="chunky_sneaker")), occ="class")
    add("v14_heavy_chunky_skinny", Rd(TEE(sub="hoodie", color="grey"), JEANS(color="black", leg_shape="skinny"), SHOE(sub="basketball_sneaker")))
    # v15 (#385): a hoodie or sweatshirt layered over a tee (PRO-17), and each guard
    HOOD = lambda **kw: G("outerwear", kw.pop("sub", "hoodie"), kw.pop("color", "green"), **kw)  # noqa: E731
    RUN = SHOE(sub="performance_runner", color="black")
    add("v15_hoodie_cargos_runners", Rd(TEE(color="navy"), HOOD(), JEANS(sub="cargos", color="olive"), RUN), styles=[["streetwear", 0.5], ["minimalist", 0.25], ["workwear", 0.25]])
    add("v15_hoodie_jeans", Rd(HOOD(color="grey"), TEE(), JEANS(color="denim_dark"), SHOE()))
    add("v15_sweatshirt_layer", Rd(HOOD(sub="sweatshirt", color="grey"), TEE(color="navy"), JEANS(color="denim_dark"), SHOE()))
    add("v15_hoodie_graphic_wide", Rd(HOOD(), TEE(sub="graphic_tee", color="black", pattern="graphic"), JEANS(leg_shape="wide", volume=4), SHOE(sub="chunky_sneaker")), occ="class")
    add("v15_hoodie_at_belt_wide", Rd(HOOD(length="at_belt"), TEE(color="navy"), JEANS(leg_shape="wide"), SHOE()))
    add("v15_hoodie_long", Rd(HOOD(length="below_crotch"), TEE(color="navy"), JEANS(leg_shape="wide"), SHOE()))
    add("v15_hoodie_over_hoodie", Rd(HOOD(), TEE(sub="hoodie", color="grey"), JEANS(color="denim_dark"), SHOE()))
    add("v15_hoodie_over_tank", Rd(HOOD(), TEE(sub="tank_top"), JEANS(color="denim_dark"), SHOE()))
    add("v15_hoodie_over_oxford", Rd(HOOD(), TEE(sub="oxford_shirt"), JEANS(color="denim_dark"), SHOE()))
    add("v15_hoodie_slim", Rd(HOOD(), TEE(color="navy"), JEANS(color="black", leg_shape="slim"), SHOE()))
    add("v15_hoodie_joggers", Rd(HOOD(), TEE(color="navy"), JEANS(sub="joggers", color="black"), SHOE()), occ="class")
    add("v15_hoodie_two_layers", Rd(G("outerwear", "bomber", "black"), HOOD(), TEE(color="navy"), JEANS(color="denim_dark"), SHOE()))
    add("v15_hoodie_slides", Rd(HOOD(), TEE(color="navy"), JEANS(color="denim_dark"), SHOE(sub="slides_sandals", color="black")))
    add("v15_hoodie_no_shoes", Rd(HOOD(), TEE(color="navy"), JEANS(color="denim_dark"), shoes_visible=False))
    add("v15_hoodie_stained", Rd(HOOD(condition="stained"), TEE(color="navy"), JEANS(color="denim_dark"), SHOE()))
    add("v15_hoodie_pooling", Rd(HOOD(), TEE(color="navy"), JEANS(color="denim_dark", hem="pooling"), SHOE()))
    add("v15_hoodie_shorts", Rd(HOOD(), TEE(color="navy"), G("bottom", "shorts", "khaki_beige", leg_shape="relaxed", volume=4), SHOE()))
    add("v15_hoodie_interview", Rd(HOOD(), TEE(color="navy"), JEANS(color="denim_dark"), SHOE()), occ="interview")
    add("v15_hoodie_peek", Rd(HOOD(), TEE(color="navy"), JEANS(color="denim_dark"), SHOE()), sl={"under_present": "yes", "under_shows": "clearly", "covers_shoe": "no"})
    add("v15_hoodie_little_peek", Rd(HOOD(), TEE(color="navy"), JEANS(color="denim_dark"), SHOE()), sl={"under_present": "yes", "under_shows": "a_little", "covers_shoe": "no"})
    # v15 (COL-13): a layer that picks up the bottoms' color family, and its guards
    add("v15_tie_green_olive", Rd(HOOD(saturation="muted"), TEE(color="navy"), JEANS(sub="cargos", color="olive"), RUN))
    add("v15_tie_tan_coat", Rd(G("outerwear", "chore_coat", "tan_camel"), TEE(), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="work_boot", color="brown")))
    add("v15_tie_brown_leather", Rd(G("outerwear", "leather_jacket", "brown"), TEE(color="off_white_cream"), JEANS(sub="trousers", color="brown"), SHOE(sub="loafer", color="brown")), occ="date")
    add("v15_tie_all_green", Rd(HOOD(saturation="muted"), TEE(color="green", saturation="muted"), JEANS(sub="cargos", color="olive"), RUN))
    add("v15_tie_denim", Rd(G("outerwear", "denim_jacket", "denim_mid"), TEE(color="navy"), JEANS(), SHOE()))
    add("v15_tie_grey", Rd(HOOD(color="grey"), TEE(color="navy"), JEANS(color="grey"), SHOE()))
    add("v15_tie_joggers", Rd(HOOD(saturation="muted"), TEE(), JEANS(sub="joggers", color="olive"), SHOE()), occ="class")
    add("v15_tie_bright", Rd(HOOD(saturation="bright"), TEE(), JEANS(sub="cargos", color="olive"), SHOE()))
    add("v15_tie_blazer", Rd(G("outerwear", "blazer", "brown"), TEE(sub="oxford_shirt", tucked="full"), JEANS(sub="trousers", color="brown"), SHOE(sub="loafer", color="brown")), occ="date")
    add("v15_tie_loud", Rd(HOOD(saturation="muted"), TEE(sub="graphic_tee", color="red", pattern="graphic", pattern_scale="large", logo="large"), JEANS(sub="cargos", color="olive"), SHOE()))
    add("v15_tie_red_tee", Rd(HOOD(saturation="muted"), TEE(color="red"), JEANS(sub="cargos", color="olive"), SHOE()))
    add("v15_tie_stained", Rd(HOOD(saturation="muted", condition="stained"), TEE(color="navy"), JEANS(sub="cargos", color="olive"), SHOE()))
    add("v14_tracksuit_runners", Rd(TEE(), G("outerwear", "track_jacket", "navy"), GYM(sub="track_pants", color="navy", leg_shape="straight", volume=3, hem="slight_break"), SHOE(sub="performance_runner", color="grey")))
    # v14 (#336): a button-up worn open and tucked in sets the waist; guards: two layers, a jacket, untucked, a slim leg, a mirror
    OPEN = lambda **kw: G("outerwear", kw.pop("sub", "flannel_shirt"), kw.pop("color", "tan_camel"), **{"tucked": "full", "volume": 4, **kw})  # noqa: E731
    add("v14_tucked_layer", Rd(TEE(color="navy", tucked="full", length="na"), OPEN(), JEANS(color="denim_light", leg_shape="relaxed", volume=4), SHOE()))
    add("v14_tucked_layer_mirror", Rd(TEE(color="navy", tucked="full", length="na"), OPEN(sub="overshirt", color="brown"), JEANS(color="denim_light", leg_shape="wide", volume=4), SHOE(sub="retro_runner"), mirror_selfie=True))
    add("v14_tucked_layer_oxford", Rd(TEE(), OPEN(sub="oxford_shirt", color="light_blue", volume=3), JEANS(sub="chinos", color="khaki_beige"), SHOE(sub="loafer", color="brown")))
    add("v14_tucked_layer_untucked", Rd(TEE(color="navy"), OPEN(tucked="none", length="mid_fly"), JEANS(color="denim_light", leg_shape="relaxed", volume=4), SHOE()))
    add("v14_tucked_layer_slim", Rd(TEE(color="navy", tucked="full", length="na"), OPEN(), JEANS(color="denim_dark", leg_shape="slim", volume=2), SHOE()))
    add("v14_tucked_layer_two_outers", Rd(TEE(color="navy", tucked="full", length="na"), OPEN(), G("outerwear", "bomber", "black"), JEANS(color="denim_light", leg_shape="relaxed", volume=4), SHOE()))
    add("v14_tucked_layer_jacket", Rd(TEE(color="navy", tucked="full", length="na"), G("outerwear", "chore_coat", "brown", tucked="full"), JEANS(color="denim_dark", leg_shape="straight"), SHOE(sub="work_boot", color="brown")))
    add("v14_tucked_layer_wrinkled", Rd(TEE(color="navy", tucked="full", length="na"), OPEN(condition="wrinkled"), JEANS(color="denim_light", leg_shape="relaxed", volume=4), SHOE()))
    add("v10_knit_on_knit", Rd(G("outerwear", "cardigan", "navy"), TEE(sub="sweater", color="grey", length="at_belt"), JEANS(color="denim_dark"), SHOE(sub="suede_chukka", color="brown")))
    add("v8_standout_pattern", Rd(G("outerwear", "overshirt", "green", pattern="checks_plaid", pattern_scale="medium"), TEE(), JEANS(), SHOE(sub="work_boot", color="brown")))
    # v16 (T93, #452): the slides-once readings, verbatim from rules_conformance.py (slides_shape_paper.py's OUTFITS)
    import rules_conformance as RCF  # noqa: E402
    for c in RCF.CASES:
        if c["id"].startswith("SHO-14-") or c["id"] in ("PRO-17-slides", "PRO-17-slides-wide", "STR-5-slides-line"):
            add("v16_" + c["id"], copy.deepcopy(c["reading"]), occ=c["occasion"], sl=copy.deepcopy(c["second_look"]),
                bold=c["boldness"], styles=[list(x) for x in c["styles"]])
    return E


# ---------------------------------------------------------------------------------------------------- main
def newest_pull():
    pulls = sorted(p for p in glob.glob(os.path.join(KEMPT, "screenshots/phone/*/SQLite/kitted.db")))
    return pulls[-1] if pulls else None


def main():
    rp = json.load(open(os.path.join(HERE, "rubric_parity.json")))
    readings = {}             # readings not already in rubric_parity.json
    cases = []
    cov = Counter()
    cov7 = Counter()

    def ref(r):
        rid = rid_of(r)
        if rid not in rp["readings"] and rid not in readings:
            readings[rid] = {"scene": r.get("scene"), "garments": r.get("garments")}
        return rid

    def add(src, r, occ, styles, bold, sl=None, tune=None):
        rid = ref(r)
        eng, tn = ("v16", None) if tune is None else TUNES[tune]["call"]
        exp = run(r, occ, styles, sl, bold, eng, tn)
        case = {"src": src, "reading": rid, "occasion": occ, "styles": styles, "boldness": bold, "second_look": sl, "expected": exp}
        if tune is not None:
            case["tune"] = tune
        x = exp.get("raw_unrounded")
        if x is not None:
            y = x * 2 + 0.5
            if abs(y - round(y)) < 1e-9 and y != round(y):
                case["fp_boundary"] = "below" if y < round(y) else "above"
        cases.append(case)
        if tune == "v7":                    # the checks v8 retired stay proven on v7
            for p in exp.get("parts", {}).values():
                for rr in p["reasons"]:
                    cov7[rr["check"]] += 1
                for t in p["tips"]:
                    cov7["tip " + t["check"]] += 1
        if tune is None:
            if "error" in exp:
                cov["(error) " + exp["error"]] += 1
                return
            if exp["overall"] is None:
                cov["(none) " + exp["reason"]] += 1
            for k, p in exp.get("parts", {}).items():
                for rr in p["reasons"]:
                    cov[rr["check"]] += 1
                for t in p["tips"]:
                    cov["tip " + t["check"]] += 1
                if p["na"]:
                    cov[f"na {k}: {p['na']}"] += 1
            if exp["overall"] is not None:
                cov["earned_bonus>0"] += exp["earned_bonus"] > 0
                cov["piled_penalty>0"] += exp["piled_penalty"] > 0
                cov["floored"] += exp["floored"]
                cov["solid_line"] += exp["lowest"]["part"] is None
                cov["condition part"] += exp["condition"]["part"] is not None
                cov["condition dim"] += exp["condition"]["display"] == "couldn't check in this light"
                for t in exp["condition"]["tips"]:
                    cov["condition tip " + t["check"]] += 1
                for ln in exp["occasion"]["lines"]:
                    cov["occasion: " + ln.split(" for ")[0].split(":")[0]] += 1

    TUNES = {
        "v1": {"call": ("v1", None), "data": {"engine": "v1", "label": P.VERSIONS["v1"], "tune": MJ.tune_json(P.TUNE["v1"])}},
        "v2": {"call": ("v2", None), "data": {"engine": "v2", "label": P.VERSIONS["v2"], "tune": MJ.tune_json(P.TUNE["v2"])}},
        "v3": {"call": ("v3", None), "data": {"engine": "v3", "label": P.VERSIONS["v3"], "tune": MJ.tune_json(P.TUNE["v3"])}},
        "v4": {"call": ("v4", None), "data": {"engine": "v4", "label": P.VERSIONS["v4"], "tune": MJ.tune_json(P.TUNE["v4"])}},
        "v4_whatif": {"call": ("v4", WHATIF), "data": {"engine": "v4", "label": P.VERSIONS["v4"], "tune": MJ.tune_json(P._tune("v4", WHATIF))}},
        "v5": {"call": ("v5", None), "data": {"engine": "v5", "label": P.VERSIONS["v5"], "tune": MJ.tune_json(P.TUNE["v5"])}},
        "v5_whatif": {"call": ("v5", WHATIF5), "data": {"engine": "v5", "label": P.VERSIONS["v5"], "tune": MJ.tune_json(P._tune("v5", WHATIF5))}},
        "v6": {"call": ("v6", None), "data": {"engine": "v6", "label": P.VERSIONS["v6"], "tune": MJ.tune_json(P.TUNE["v6"])}},
        "v6_whatif": {"call": ("v6", WHATIF6), "data": {"engine": "v6", "label": P.VERSIONS["v6"], "tune": MJ.tune_json(P._tune("v6", WHATIF6))}},
        "v7": {"call": ("v7", None), "data": {"engine": "v7", "label": P.VERSIONS["v7"], "tune": MJ.tune_json(P.TUNE["v7"])}},
        "v8": {"call": ("v8", None), "data": {"engine": "v8", "label": P.VERSIONS["v8"], "tune": MJ.tune_json(P.TUNE["v8"])}},
        "v9": {"call": ("v9", None), "data": {"engine": "v9", "label": P.VERSIONS["v9"], "tune": MJ.tune_json(P.TUNE["v9"])}},
        "v10": {"call": ("v10", None), "data": {"engine": "v10", "label": P.VERSIONS["v10"], "tune": MJ.tune_json(P.TUNE["v10"])}},
        "v11": {"call": ("v11", None), "data": {"engine": "v11", "label": P.VERSIONS["v11"], "tune": MJ.tune_json(P.TUNE["v11"])}},
        "v12": {"call": ("v12", None), "data": {"engine": "v12", "label": P.VERSIONS["v12"], "tune": MJ.tune_json(P.TUNE["v12"])}},
        "v13": {"call": ("v13", None), "data": {"engine": "v13", "label": P.VERSIONS["v13"], "tune": MJ.tune_json(P.TUNE["v13"])}},
        "v14": {"call": ("v14", None), "data": {"engine": "v14", "label": P.VERSIONS["v14"], "tune": MJ.tune_json(P.TUNE["v14"])}},
        "v15": {"call": ("v15", None), "data": {"engine": "v15", "label": P.VERSIONS["v15"], "tune": MJ.tune_json(P.TUNE["v15"])}},
        "v15_whatif": {"call": ("v15", WHATIF15), "data": {"engine": "v15", "label": P.VERSIONS["v15"], "tune": MJ.tune_json(P._tune("v15", WHATIF15))}},
        "v14_whatif": {"call": ("v14", WHATIF14), "data": {"engine": "v14", "label": P.VERSIONS["v14"], "tune": MJ.tune_json(P._tune("v14", WHATIF14))}},
        "v13_whatif": {"call": ("v13", WHATIF13), "data": {"engine": "v13", "label": P.VERSIONS["v13"], "tune": MJ.tune_json(P._tune("v13", WHATIF13))}},
        "v12_whatif": {"call": ("v12", WHATIF12), "data": {"engine": "v12", "label": P.VERSIONS["v12"], "tune": MJ.tune_json(P._tune("v12", WHATIF12))}},
        "v11_whatif": {"call": ("v11", WHATIF11), "data": {"engine": "v11", "label": P.VERSIONS["v11"], "tune": MJ.tune_json(P._tune("v11", WHATIF11))}},
        "v10_whatif": {"call": ("v10", WHATIF10), "data": {"engine": "v10", "label": P.VERSIONS["v10"], "tune": MJ.tune_json(P._tune("v10", WHATIF10))}},
        "v9_whatif": {"call": ("v9", WHATIF9), "data": {"engine": "v9", "label": P.VERSIONS["v9"], "tune": MJ.tune_json(P._tune("v9", WHATIF9))}},
        "v8_whatif": {"call": ("v8", WHATIF8), "data": {"engine": "v8", "label": P.VERSIONS["v8"], "tune": MJ.tune_json(P._tune("v8", WHATIF8))}},
    }

    # 1. every rubric_parity case
    for c in rp["cases"]:
        add("rubric_parity", rp["readings"][c["reading"]], c["occasion"], c["styles"], c["boldness"])
    n_rp = len(cases)

    # 2. the corpus and the newest pull, with the paper tests' second look
    U = T.load_runs(os.path.join(ET, "results/look1/raw.json"), "U")
    L = T.load_runs(os.path.join(ET, "results/look1/raw.json"), "L")
    corpus = json.load(open(os.path.join(ET, "results/parts1/corpus.json")))
    pull_path = newest_pull()
    T.PULL = pull_path
    pull = T.load_pull() if pull_path else {}
    real = []                                           # (src, key, reading, own occasion)
    for x in corpus:
        real.append(("corpus:" + x["id"], T.key_from_corpus(x["id"]), x["reading"], x["occ"]))
    for k, v in pull.items():
        real.append((f"pull:{os.path.basename(os.path.dirname(os.path.dirname(pull_path)))}:{v['check']}", k, v["reading"], v["occ"]))
    for src, k, r, occ in real:
        sl = T.second_look_for(k, U, L)
        for o in [occ] + [o for o in OCCASIONS if o != occ]:
            add(f"{src}@{o}", r, o, PROFILE, BOLD, sl)
    n_real = len(cases) - n_rp

    # 3. batch 1 runs (per-run second look), lightness, zoom1 arm B
    B1A = T.load_runs(os.path.join(ET, "results/b1/raw.json"), "A")
    B1L = T.load_runs(os.path.join(ET, "results/b1/raw.json"), "B1")
    for k in sorted(B1A):
        for i, j in enumerate(B1A[k]):
            sl = T.second_look_for(k, U, L, i) if k in U and k in L and i < len(U[k]) and i < len(L[k]) else None
            add(f"b1:A:{k}:run{i}", j, "everyday", PROFILE, BOLD, sl)
            if k in B1L and i < len(B1L[k]):
                add(f"b1:A+lightness:{k}:run{i}", T2.with_lightness(j, B1L[k][i]), "everyday", PROFILE, BOLD, sl)
    for k in sorted(B1L):
        for i, j in enumerate(B1L[k]):
            sl = T.second_look_for(k, U, L, i) if k in U and k in L and i < len(U[k]) and i < len(L[k]) else None
            add(f"b1:B1:{k}:run{i}", j, "everyday", PROFILE, BOLD, sl)
    Z = T.load_runs(os.path.join(ET, "results/zoom1/raw.json"), "B")
    Z.update(T.load_runs(os.path.join(ET, "results/zoom1-stock/raw.json"), "B"))
    for p in sorted(Z):
        k = T.zoom_key(p)
        for i, j in enumerate(Z[p]):
            add(f"zoom1:B:{p}:run{i}", j, "everyday", PROFILE, BOLD, T.second_look_for(k, U, L))
    n_runs = len(cases) - n_rp - n_real

    # 4. second-look variants on rubric_parity's edge readings
    edge_ids = [rid for rid, srcs in rp["provenance"].items() if any(s.startswith("edge:") for s in srcs)]
    SLS = [{"peek": True}, {"rests_on_shoe": False}, {"under_present": "yes", "under_shows": "clearly", "covers_shoe": "mostly"},
           {"covers_shoe": "no"}]
    for rid in edge_ids:
        for s in SLS:
            add("edge-second-look:" + rid, rp["readings"][rid], "everyday", PROFILE, BOLD, s)

    # 5. parts edge cases
    edges = parts_edges()
    for name, r, occ, sl, bold, styles in edges:
        add("parts-edge:" + name, r, occ, styles, bold, sl)

    # 6. tune variants
    n_before_tunes = len(cases)
    for tname in TUNES:
        for src, k, r, occ in real:
            add(f"{src}@{occ}", r, occ, PROFILE, BOLD, T.second_look_for(k, U, L), tname)
        for name, r, occ, sl, bold, styles in edges:
            add("parts-edge:" + name, r, occ, styles, bold, sl, tname)
        for rid in edge_ids:
            add("edge:" + rid, rp["readings"][rid], "everyday", PROFILE, BOLD, None, tname)

    # 7. picks variants (none / one / three)
    n_before_picks = len(cases)
    for src, k, r, occ in real:
        for pn, st in PICKS_VARIANTS.items():
            add(f"picks:{pn}:{src}@{occ}", r, occ, st, BOLD, T.second_look_for(k, U, L))
    for name, r, occ, sl, bold, styles in edges:
        for pn, st in PICKS_VARIANTS.items():
            add(f"picks:{pn}:parts-edge:{name}", r, occ, st, bold, sl)
    n_picks = len(cases) - n_before_picks

    # picks never move a number: every reading x occasion x boldness x second look scores the same under any picks
    groups = {}
    for c in cases:
        if "tune" in c or "error" in c["expected"]:
            continue
        g = (c["reading"], c["occasion"], c["boldness"], json.dumps(c["second_look"], sort_keys=True))
        e = c["expected"]
        groups.setdefault(g, set()).add((e["overall"], e.get("raw_unrounded"),
                                         tuple((kk, e["parts"][kk]["score"]) for kk in sorted(e.get("parts", {})))))
    bad = [g for g, v in groups.items() if len(v) > 1]
    assert not bad, f"picks moved a score: {bad[:3]}"

    # what v16 changed against v15 (default cases only)
    changed = []
    for c in cases:
        if "tune" in c or "error" in c["expected"]:
            continue
        r = rp["readings"].get(c["reading"]) or readings[c["reading"]]
        e4 = run(r, c["occasion"], c["styles"], c["second_look"], c["boldness"], "v15")
        e5 = c["expected"]
        if e4.get("overall") != e5.get("overall") or e4.get("raw_score") != e5.get("raw_score"):
            r4 = {rr["check"] for p in e4.get("parts", {}).values() for rr in p["reasons"]}
            r5 = {rr["check"] for p in e5.get("parts", {}).values() for rr in p["reasons"]}
            changed.append({"src": c["src"], "occasion": c["occasion"], "styles": c["styles"], "v15": e4.get("overall"),
                            "v16": e5.get("overall"), "v15_raw": e4.get("raw_score"), "v16_raw": e5.get("raw_score"),
                            "added": sorted(r5 - r4), "removed": sorted(r4 - r5)})

    must = ["PB1_roomier_than_look", "tip PB2_wide_leg_band", "SX1_another_look", "tip SX1_tip", "PR5_workwear_shape", "PR6_outdoor_shape", "PF5_big_top_skinny_leg", "PF6_layer_over_skinny", "PF10_peek", "PR1_waist_break", "PR1b_half_tuck", "PR4_street_shape",
            "PR2_short_layer", "PR3_tailored_line", "FF1_sleeves_tailored", "FF1_cuffs_ribbed", "FF5_too_big", "FF1_sleeves_long",
            "FF6_strain", "FF7_pooling", "CC1_too_many_accents", "CC1_busy", "CC2_bright_clash", "CC4_near_match",
            "CC6_same_pattern_scale", "CC6_same_pattern", "CC6_three_patterns", "CP1_standout_color", "CP2_quiet_accent", "CP5_tie_in",
            "CP3_tonal_range", "CP4_tonal_shoes", "CP6_light_mid_dark", "SK1_slides_out", "SK1b_hem_drags", "SK2_runners",
            "SD4_chunky_under_tailoring", "SD2_too_casual", "SD3_too_dressy", "SD1_matches", "SC_chosen_for_look", "SW1_chunky_narrow",
            "SW1_runner_narrow", "SW2_weight_carries_leg", "SCol1_loud_vs_loud", "SCol2_shoe_accent", "SQ_worn", "H1_reads_as_style",
            "H2_clear_top_to_toe", "H2_suit", "H3_another_world", "H5_too_many_statements", "H4_standout_piece",
            "tip PF2_long_top", "tip PF3_long_layer_loose_leg", "tip PF1_heavy_hem_tailored", "tip PF4_long_shirt_wide_leg",
            "tip P_next_level", "tip FF7b_full_break_narrow", "tip CP3_tonal_flat", "tip CC5_denim_near_match", "tip SW3_dainty_wide",
            "(none) not_fully_clothed", "(none) nothing_readable", "(none) no_part_readable", "earned_bonus>0", "floored", "solid_line",
            "condition part", "condition dim", "condition tip C_unsure_wrinkled", "condition tip C_unsure_worn",
            "condition tip C_unsure_stain",
            # v8
            "PN1_narrow_leg", "CL1_loud_print", "TK1_tank_alone", "PR2b_short_layer_read", "SK1s_slides_soft", "FF5_roomy_sleeves",
            "piled_penalty>0",
            # v9
            "CC5_same_wash_denim", "GT1_graphic_under_tailoring", "occasion: a hoodie at an interview",
            "occasion: an interview wants a collared shirt, a knit or a jacket",
            # v10
            "CP1_toned_down",
            # v12
            "CL2_light_on_light",
            # v14
            "PS1_shorts_shape", "PS1_shorts_layer", "PS2_roomy_over_fitted", "PS3_fitted_shorts", "PR7_sweatsuit_shape",
            "H6_goes_together", "H7_tracksuit", "occasion: a full kit out of the game",
            # v15
            "PR2h_hoodie_layer", "CP8_layer_tie_in"]  # v13 adds no new check id (CON-6's knit charge fires in new places; v13 edge cases); v11 adds no new check id (PN1 and H3 fire in new places; see the v11 edge cases)
    retired = {"CP1_standout_color", "H4_standout_piece", "FF5_too_big", "tip SW3_dainty_wide",   # v8 retired them; v7 only
               "tip CC5_denim_near_match"}                                                       # v9: a fault now (cov7)
    missing = [m for m in must if not (cov7[m] if m in retired else cov[m])]
    assert not missing, f"never fired: {missing}"

    # Interning: the same part / condition / occasion / lowest / weights objects repeat across thousands of cases (a
    # reading's parts rarely change with the occasion), so each is stored once in `pool` and referenced by index.
    pool, seen = [], {}

    def intern(v):
        key = json.dumps(v, sort_keys=True, separators=(",", ":"))
        if key not in seen:
            seen[key] = len(pool); pool.append(v)
        return seen[key]

    for c in cases:
        e = c["expected"]
        if "parts" in e:
            e["parts"] = {k: intern(v) for k, v in e["parts"].items()}
        for k in ("condition", "occasion", "lowest", "weights_used"):
            if k in e:
                e[k] = intern(e[k])

    tunes = {k: v["data"] for k, v in TUNES.items()}
    base = MJ.data()
    out = {
        "_doc": "Parts engine parity fixtures (parts_proto.py, v7 unless `tune` names a variant in `tunes`). For each case, "
                "scoreParts(reading, {occasion, styles, boldness, secondLook}) in TypeScript must equal `expected` after mapping "
                "camelCase to these keys: overall, reason, parts (score, display, na, reasons in order, tips in order), na_parts, "
                "weights_used, condition, occasion, lowest, second_look, detected_styles, style_label, not_rated, partial, floored, "
                "care_or_strain, earned_bonus, average, raw_score, version, engine exactly; average_unrounded and raw_unrounded within "
                "1e-9 (they are compared exactly). An `error` expected means Python raised: TypeScript must throw. A case's reading is "
                "readings[id] here, else rubric_parity.json's readings[id]. A `tune` case runs with parts.json's data with engine, "
                "label and tune replaced by tunes[name]. Interned: expected.parts[name], condition, occasion, lowest and "
                "weights_used are indices into `pool` (the object is pool[i]).",
        "parts_version": base["version"], "parts_proto_sha256": base["sourceSha256"],
        "rubric_sha256": hashlib.sha256(open(os.path.join(ET, "rubric.py"), "rb").read()).hexdigest(),
        "rubric_parity_sha256": rp["rubric_sha256"],
        "pull": os.path.relpath(pull_path, KEMPT) if pull_path else None,
        "counts": {"rubric_parity_cases": n_rp, "real_cases": n_real, "real_readings": len(real), "run_cases": n_runs,
                   "edge_second_look_cases": len(edge_ids) * len(SLS), "parts_edge_cases": len(edges),
                   "tune_cases": n_before_picks - n_before_tunes, "picks_cases": n_picks, "cases": len(cases), "own_readings": len(readings),
                   "python_errors": sum(1 for c in cases if "error" in c["expected"]),
                   "fp_boundary_cases": dict(Counter(c["fp_boundary"] for c in cases if c.get("fp_boundary")))},
        "coverage": dict(sorted(cov.items())),
        "overall_histogram": dict(sorted(Counter(str(c["expected"].get("overall")) for c in cases if "tune" not in c).items())),
        "v16_vs_v15": {"cases_changed": len(changed), "overall_changed": sum(1 for x in changed if x["v15"] != x["v16"]),
                     "changed": changed},
        "tunes": tunes,
        "pool": pool,
        "readings": readings,
        "cases": cases,
    }
    path = os.path.join(HERE, "parts_parity.json")
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print(json.dumps(out["counts"]))
    print("file size MB:", round(os.path.getsize(path) / 1e6, 2))
    print("overall histogram (v16):", out["overall_histogram"])
    print("v16 vs v15:", out["v16_vs_v15"]["cases_changed"], "cases changed,", out["v16_vs_v15"]["overall_changed"], "with a new overall")
    for k, v in sorted(cov.items()):
        print(f"   {v:6d}  {k}")


if __name__ == "__main__":
    main()
