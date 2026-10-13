#!/usr/bin/env python3
"""Rules conformance (Oct 11, 2026; DECISIONS-LOG #216, v6 rules #217; v8 rules Oct 12, #228). One or more made-up
outfits per rule ID in ../rubric/v5-styles.md, each asserting that the rule works in the parts engine (parts_proto.py,
default v8): the
right check fires (or doesn't), the right part moves by the right amount, and the final score lands in the right band.

  /usr/bin/python3 rules_conformance.py          -> runs every case against parts_proto.py; exits 1 on any failure;
                                                    writes ../handoff/fixtures/rules_conformance.json when all pass
  /usr/bin/python3 rules_conformance.py --show ID -> prints one case's full result (for writing a new case)

The TypeScript twin, app/packages/kitted-core/test/rulesConformance.test.ts, runs the same cases from the JSON against
scoreParts with the same assertion rules, and also checks each result equals Python's.

The rule: if a case shows the engine contradicting the plain-words rule, the ENGINE IS NOT CHANGED. Either the
plain-words line was wrong (fix the doc), or the engine differs from the research on purpose (the case asserts what the
engine does and names its "Known differences" entry in `kd`).

Rule 7: these are made-up readings with no person in them (no age, no picks unless a case says so; boldness "a little").
Readings use only values of the live reading (schema.json), except cases marked `future`, which name the values the
reading can't produce yet (the rule exists in the engine but can't fire on a live check).
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402

OUT = K / "handoff" / "fixtures" / "rules_conformance.json"
DOC = K / "rubric" / "v5-styles.md"   # every **[ID]** defined there must have a case here, and the other way round
SCHEMA = json.loads((HERE / "schema.json").read_text())
APP_OCCASIONS = {"everyday", "class", "date", "going_out", "interview", "event", "gym", "home"}   # app/src/data/types.ts
FUTURE_VALUES = {"trail_shoe", "vest", "track_jacket", "track_pants", "work_pants", "technical_pants", "denim_shirt"}
BANDS = [(5.5, "Needs a fix"), (6.5, "Getting there"), (7.5, "Put together"), (8.5, "Sharp"), (10.0, "Dialed in")]


def band_of(x):
    return next(name for top, name in BANDS if x <= top)


# --------------------------------------------------------------------------------------------- garments and readings
def G(cat, sub, color="black", vol=3, leg="na", hem="na", tucked="na", length="na", pattern="solid", **kw):
    g = {"category": cat, "subcategory": sub, "color_family": color, "pattern": pattern, "logo": "none", "volume": vol,
         "leg_shape": leg, "hem": hem, "tucked": tucked, "condition": "clean", "certainty": "clear", "length": length,
         "pattern_scale": "na" if pattern in ("solid", "graphic") else "medium", "saturation": "na",
         "sleeve_end": "at_wrist" if cat in ("top", "outerwear") else "na", "strain": "none",
         "distressed_by_design": False, "shows_below_outer": False}
    g.update(kw)
    return g


def top(sub, color="white", vol=3, **kw):
    kw.setdefault("tucked", "none"); kw.setdefault("length", "mid_fly")
    if sub == "graphic_tee":
        kw.setdefault("pattern", "graphic")
    return G("top", sub, color, vol, **kw)


def outer(sub, color="black", vol=3, **kw):
    kw.setdefault("length", "at_belt")
    return G("outerwear", sub, color, vol, **kw)


def bottom(sub, color, leg, hem="slight_break", **kw):
    return G("bottom", sub, color, 3, leg, hem, **kw)


def shoe(sub, color="black", **kw):
    return G("footwear", sub, color, **kw)


def acc(sub):
    return G("accessory", sub, "brown")


def Rd(*gs, **scene):
    s = {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False, "lighting": "good",
         "clothed": "fully"}
    s.update(scene)
    return {"scene": s, "garments": list(gs)}


# the everyday pieces most cases share
TEE = top("tee", "white")
DJEANS = bottom("jeans", "denim_dark", "straight")
WJEANS = bottom("jeans", "denim_mid", "wide", "cuffed")
SKJEANS = bottom("jeans", "black", "skinny")
SLJEANS = bottom("jeans", "black", "slim")
CHINOS = bottom("chinos", "khaki_beige", "straight")
NCHINOS = bottom("chinos", "navy", "straight")
SLCHINOS = bottom("chinos", "khaki_beige", "slim")
TROUSERS = bottom("trousers", "grey", "straight")
CTROUSERS = bottom("trousers", "charcoal", "straight")
WTROUSERS = bottom("trousers", "charcoal", "wide")
WLS = shoe("white_leather_sneaker", "white")
CHUNKY = shoe("chunky_sneaker", "white")
LOWP = shoe("low_profile_sneaker", "black")
CANVAS = shoe("canvas_sneaker", "black")
RETRO = shoe("retro_runner", "grey")
RUNNER = shoe("performance_runner", "grey")
SLIDES = shoe("slides_sandals", "black")
LOAFER = shoe("loafer", "brown")
LOAFER_BK = shoe("loafer", "black")
DERBY = shoe("derby", "brown")
DRESS = shoe("dress_shoe", "black")
BOOTS = shoe("work_boot", "brown")
CHUKKA = shoe("suede_chukka", "brown")


def mod(g, **kw):
    out = dict(g)
    out.update(kw)
    return out


# --------------------------------------------------------------------------------------------- the cases
CASES = []


def case(cid, rule, what, reading, expect, occasion="everyday", styles=None, boldness="a_little", second_look=None,
         vs=None, future=None, kd=None):
    CASES.append({"id": cid, "rule": rule, "what": what, "reading": reading, "occasion": occasion,
                  "styles": [list(p) for p in (styles or [])], "boldness": boldness, "second_look": second_look,
                  "expect": expect, "vs": vs, "future": sorted(future or []), "kd": kd})


F = lambda check, part=None, points=None: {k: v for k, v in (("check", check), ("part", part), ("points", points))
                                             if v is not None}

# ===== How a score is made (SCO) =====================================================================================
case("SCO-1-plain", "SCO-1", "plain white tee, dark straight jeans, white leather sneakers: every part starts at 7",
     Rd(TEE, DJEANS, WLS),
     {"overall": 7.0, "band": "Put together",
      "part": {"proportions": {"score": 7.0}, "fit": {"score": 7.0}, "color": {"score": 7.0}, "cohesion": {"score": 7.0},
               "shoes": {"score": 7.5}}, "detected_lacks": ["streetwear", "minimalist", "smart_casual"]})
case("SCO-1-noshoes", "SCO-1", "the same with the shoes out of the photo: Shoes drops out, the rest scale up",
     Rd(TEE, DJEANS, WLS, shoes_visible=False),
     {"overall": 7.0, "band": "Put together", "part": {"shoes": {"na": True}}})
case("SCO-2-bonus", "SCO-2", "two parts at 8+ and none under 7 add the +0.25 earned bonus",
     Rd(top("hoodie", "grey"), WJEANS, CHUNKY),
     {"bonus": 0.25, "band": "Put together", "overall": 7.5})
case("SCO-2-gate", "SCO-2", "the same with the hoodie cuffs over the hands (Fit 6.5): no bonus",
     Rd(top("hoodie", "grey", sleeve_end="covers_hand"), WJEANS, CHUNKY),
     {"bonus": 0.0, "band": "Put together", "part": {"fit": {"score": 6.5}}})
LOW = Rd(top("oxford_shirt", "red", 4, sleeve_end="covers_hand"), top("sweater", "yellow"), outer("bomber", "purple"),
         mod(SKJEANS, hem="pooling"), SLIDES)
case("SCO-3-floor", "SCO-3", "a messy outfit at Everyday is held up at 5.0",
     LOW, {"overall": 5.0, "floored": True, "band": "Needs a fix"})
case("SCO-3-date", "SCO-3", "the same outfit at a date gets no floor",
     LOW, {"floored": False, "band": "Needs a fix", "overall_max": 4.5}, occasion="date")
case("SCO-3-stain", "SCO-3", "the same at Everyday with a sure stain loses the floor",
     Rd(top("oxford_shirt", "red", 4, sleeve_end="covers_hand", condition="stained"), top("sweater", "yellow"),
        outer("bomber", "purple"), mod(SKJEANS, hem="pooling"), SLIDES),
     {"floored": False, "band": "Needs a fix", "overall_max": 4.5})
case("SCO-4-picks-none", "SCO-4", "black sweater, charcoal wide trousers, black loafers, no picks",
     Rd(top("sweater", "black"), WTROUSERS, LOAFER_BK), {"label": "minimalist", "band": "Put together"})
case("SCO-4-picks-sc", "SCO-4", "the same with Smart casual picked: the label changes, no number does",
     Rd(top("sweater", "black"), WTROUSERS, LOAFER_BK), {"label": "smart_casual", "band": "Put together"},
     styles=[("smart_casual", 1.0)],
     vs={"case": "SCO-4-picks-none", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": 0.0})
case("SCO-5-unclothed", "SCO-5", "a photo where he isn't fully clothed isn't scored",
     Rd(TEE, DJEANS, WLS, clothed="partial"), {"unscored": "not_fully_clothed"})
case("SCO-6-ignored", "SCO-6", "a belt, a watch and an unsure piece change nothing",
     Rd(TEE, DJEANS, WLS, acc("belt"), acc("watch"), top("graphic_tee", "red", certainty="unsure")),
     {"band": "Put together"},
     vs={"case": "SCO-1-plain", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": 0.0})
case("SCO-7-add", "SCO-7", "a hoodie over skinny jeans with chunky sneakers: Proportions 5 and Shoes 5.5, so half of the smaller "
     "shortfall under 6.5 comes off too (-0.5)",
     Rd(top("hoodie", "grey"), SKJEANS, CHUNKY),
     {"penalty": 0.5, "part": {"proportions": {"score": 5.0}, "shoes": {"score": 5.5}}, "overall": 5.5, "band": "Needs a fix"})
case("SCO-7-one", "SCO-7", "one weak part on its own adds nothing: a tee that clearly pulls (Fit 5) is already in the average",
     Rd(top("tee", "white", strain="clear"), DJEANS, WLS),
     {"penalty": 0.0, "part": {"fit": {"score": 5.0}}, "band": "Put together"})
case("SCO-7-cap", "SCO-7", "the messy outfit at a date: problems in every part, capped at -1.0", LOW,
     {"penalty": 1.0, "floored": False, "band": "Needs a fix"}, occasion="date")

# ===== Proportions (PRO) =============================================================================================
case("PRO-1-shorts", "PRO-1", "shorts: Proportions isn't scored", Rd(TEE, bottom("shorts", "khaki_beige", "straight", "na"), WLS),
     {"part": {"proportions": {"na": True}}, "band": "Put together"})
case("PRO-1-upper", "PRO-1", "an upper-body photo: no legs, no Proportions",
     Rd(TEE, outer("denim_jacket", "denim_mid"), framing="upper_only", shoes_visible=False),
     {"part": {"proportions": {"na": True}}, "band": "Put together"})
case("PRO-2-skinny", "PRO-2", "a roomy tee over skinny jeans costs 1.5", Rd(top("tee", "white", 4), SKJEANS, WLS),
     {"fired": [F("PF5_big_top_skinny_leg", "proportions", -1.5)], "band": "Getting there"})
case("PRO-3-layer-skinny", "PRO-3", "a bomber over skinny jeans costs 0.5 (on top of the skinny leg's own -2.0, [PRO-13])",
     Rd(TEE, outer("bomber"), SKJEANS, WLS),
     {"fired": [F("PF6_layer_over_skinny", "proportions", -0.5), F("PN1_narrow_leg", "proportions", -2.0)],
      "not_fired": [F("PR2_short_layer")], "part": {"proportions": {"score": 4.5}}, "band": "Getting there"})
case("PRO-4-base", "PRO-4", "an untucked white oxford over straight chinos with loafers",
     Rd(top("oxford_shirt", "white"), CHINOS, LOAFER), {"not_fired": [F("PR1_waist_break")], "band": "Put together"})
case("PRO-4-tuck", "PRO-4", "the same oxford tucked into the straight chinos: +0.5 over a straight leg",
     Rd(top("oxford_shirt", "white", tucked="full"), CHINOS, LOAFER),
     {"fired": [F("PR1_waist_break", "proportions", 0.5)], "band": "Sharp"},
     vs={"case": "PRO-4-base", "parts": {"proportions": 0.5}, "overall": "up"})
case("PRO-4-wide", "PRO-4", "a white tee tucked into wide jeans: +1.5 over a loose leg",
     Rd(top("tee", "white", tucked="full"), WJEANS, WLS), {"fired": [F("PR1_waist_break", "proportions", 1.5)],
                                                            "part": {"proportions": {"score": 8.5}}, "band": "Put together"})
case("PRO-4-short", "PRO-4", "a tee that ends at the belt over straight jeans: +0.5",
     Rd(top("tee", "white", length="at_belt"), DJEANS, WLS), {"fired": [F("PR1_waist_break", "proportions", 0.5)],
                                                               "band": "Put together"})
case("PRO-4-mirror", "PRO-4", "a short tee over wide jeans in a mirror selfie: the full +1.5 (over a loose leg the short top is the look)",
     Rd(top("tee", "white", length="at_belt"), WJEANS, WLS, mirror_selfie=True),
     {"fired": [F("PR1_waist_break", "proportions", 1.5)], "band": "Put together"})
case("PRO-4-mirror-tuck", "PRO-4", "a full tuck over straight jeans in a mirror selfie: +0.5, the same as without the mirror",
     Rd(top("tee", "white", tucked="full"), DJEANS, WLS, mirror_selfie=True),
     {"fired": [F("PR1_waist_break", "proportions", 0.5)], "band": "Put together"})
case("PRO-4-hoodie", "PRO-4", "a regular hoodie ending at the belt over straight jeans doesn't count as short (ribbed hem)",
     Rd(top("hoodie", "grey", length="at_belt"), DJEANS, WLS), {"not_fired": [F("PR1_waist_break")], "band": "Put together"})
case("PRO-4-knit-loose", "PRO-4", "a regular black sweater ending at the belt over wide trousers with loafers: over a loose leg a knit counts, +1.5",
     Rd(top("sweater", "black", length="at_belt"), WTROUSERS, LOAFER_BK),
     {"fired": [F("PR1_waist_break", "proportions", 1.5)], "overall": 8.0, "band": "Sharp"})
case("PRO-4-skinny", "PRO-4", "a tuck over skinny jeans earns no waist break (needs a full leg)",
     Rd(top("tee", "white", tucked="full"), SKJEANS, WLS),
     {"not_fired": [F("PR1_waist_break")], "fired": [F("PN1_narrow_leg", "proportions", -2.0)], "band": "Getting there"})
case("PRO-5-half", "PRO-5", "a front tuck: +0.5", Rd(top("tee", "white", tucked="half"), DJEANS, WLS),
     {"fired": [F("PR1b_half_tuck", "proportions", 0.5)], "band": "Put together"})
case("PRO-5-half-hoodie", "PRO-5", "a front-tucked hoodie earns nothing",
     Rd(top("hoodie", "grey", tucked="half"), DJEANS, WLS), {"not_fired": [F("PR1b_half_tuck")], "band": "Put together"})
case("PRO-6-denim", "PRO-6", "a denim jacket over straight jeans: +1.5",
     Rd(TEE, outer("denim_jacket", "denim_light"), DJEANS, WLS),
     {"fired": [F("PR2_short_layer", "proportions", 1.5)], "band_in": ["Put together", "Sharp"]})
case("PRO-6-leather", "PRO-6", "a leather jacket over chinos: +1.5", Rd(TEE, outer("leather_jacket"), CHINOS, WLS),
     {"fired": [F("PR2_short_layer", "proportions", 1.5)], "band_in": ["Put together", "Sharp"]})
case("PRO-6-overshirt", "PRO-6", "an overshirt isn't a short jacket: nothing",
     Rd(TEE, outer("overshirt", "olive"), DJEANS, WLS), {"not_fired": [F("PR2_short_layer")], "band": "Put together"})
TAILORED_OK = Rd(top("dress_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, DERBY)
case("PRO-7-tailored", "PRO-7", "navy blazer, tucked white dress shirt, grey trousers, derbies: +1.0",
     TAILORED_OK, {"fired": [F("PR3_tailored_line", "proportions", 1.0)], "band_in": ["Put together", "Sharp"]})
case("PRO-7-untucked", "PRO-7", "the same with the shirt untucked: no tailored line",
     Rd(top("dress_shirt", "white"), outer("blazer", "navy"), TROUSERS, DERBY),
     {"not_fired": [F("PR3_tailored_line")], "band_in": ["Getting there", "Put together"]})
case("PRO-8-one", "PRO-8", "a tucked tee under a bomber earns the short jacket only, not the waist too",
     Rd(top("tee", "white", tucked="full"), outer("bomber"), DJEANS, WLS),
     {"fired": [F("PR2_short_layer", "proportions", 1.5)], "not_fired": [F("PR1_waist_break")],
      "part": {"proportions": {"score": 8.5}}, "band_in": ["Put together", "Sharp"]})
case("PRO-8-pooling", "PRO-8", "a tuck over straight jeans read as pooling: the pooling blocks the shape",
     Rd(top("tee", "white", tucked="full"), mod(DJEANS, hem="pooling"), WLS),
     {"not_fired": [F("PR1_waist_break")], "fired": [F("FF7_pooling", "fit")], "band_in": ["Getting there", "Put together"]})
case("PRO-8-loose", "PRO-8", "a tuck over wide jeans read as pooling: on a loose leg the stack is part of the shape, so the waist break stays",
     Rd(top("tee", "white", tucked="full"), mod(WJEANS, hem="pooling"), WLS),
     {"fired": [F("PR1_waist_break", "proportions", 1.5)], "not_fired": [F("FF7_pooling")], "band": "Put together"})
case("PRO-8-joggers", "PRO-8", "a tuck over joggers: athletic bottoms block the shape",
     Rd(top("tee", "white", tucked="full"), bottom("joggers", "grey", "straight", "cuffed"), WLS),
     {"not_fired": [F("PR1_waist_break")], "band_in": ["Getting there", "Put together"]})
case("PRO-9-peek", "PRO-9", "second look: the tee shows below a denim jacket (-0.5, and no short-jacket credit)",
     Rd(TEE, outer("denim_jacket", "denim_light"), DJEANS, WLS),
     {"fired": [F("PF10_peek", "proportions", -0.5)], "not_fired": [F("PR2_short_layer")], "band": "Put together"},
     second_look={"peek": True})
case("PRO-10-long", "PRO-10", "a tee that may run past the fly: a tip, no points",
     Rd(top("tee", "white", length="below_crotch"), DJEANS, WLS),
     {"tips": [F("PF2_long_top", "proportions")], "band": "Put together"},
     vs={"case": "SCO-1-plain", "parts": {"proportions": 0.0}, "overall": 0.0})
case("PRO-10-layer", "PRO-10", "a long field jacket over wide jeans: a tip, no points",
     Rd(TEE, outer("field_jacket", "olive", length="below_crotch"), WJEANS, WLS),
     {"tips": [F("PF3_long_layer_loose_leg", "proportions")], "part": {"proportions": {"score": 7.0}},
      "band": "Put together"})
case("PRO-10-hem", "PRO-10", "a full-break hem under a blazer: a tip, no points",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy"), mod(TROUSERS, hem="full_break"), DERBY),
     {"tips": [F("PF1_heavy_hem_tailored", "proportions")], "band_in": ["Put together", "Sharp"]})
case("PRO-10-shirt", "PRO-10", "an untucked oxford over wide jeans: a tip, no points",
     Rd(top("oxford_shirt", "light_blue"), WJEANS, WLS), {"tips": [F("PF4_long_shirt_wide_leg", "proportions")],
                                                          "part": {"proportions": {"score": 7.0}}, "band": "Put together"})

PB1 = "PB1_roomier_than_look"
BIGTEE = top("tee", "white", 4)
case("PRO-11-none", "PRO-11", "an oversized tee over dark straight jeans with white leather sneakers (no look holds the room): -1.5",
     Rd(BIGTEE, DJEANS, WLS), {"label": None, "fired": [F(PB1, "proportions", -1.5)], "overall": 6.5, "band": "Getting there"})
case("PRO-11-slim", "PRO-11", "an oversized tee over slim jeans: -1.5 (oversized wants a fuller leg)",
     Rd(BIGTEE, SLJEANS, WLS), {"fired": [F(PB1, "proportions", -1.5)], "band": "Getting there"})
case("PRO-11-base", "PRO-11", "a regular tee over the same slim jeans: inside the general band, no band charge (the slim leg's own -1.0, [PRO-13], is in both)",
     Rd(TEE, SLJEANS, WLS), {"not_fired": [F(PB1)], "band": "Put together"},
     vs={"case": "PRO-11-slim", "parts": {"proportions": 1.5}, "overall": "up"})
case("PRO-11-picks", "PRO-11", "the oversized tee over straight jeans with Streetwear picked: picks never hold the room",
     Rd(BIGTEE, DJEANS, WLS), {"fired": [F(PB1, "proportions", -1.5)], "band": "Getting there"}, styles=[("streetwear", 1.0)],
     vs={"case": "PRO-11-none", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": 0.0})
case("PRO-11-waist", "PRO-11", "a boxy tee that ends at the belt over straight jeans: a deliberate waist, no charge",
     Rd(top("tee", "white", 4, length="at_belt"), DJEANS, WLS), {"not_fired": [F(PB1)], "fired": [F("PR1_waist_break")],
                                                                  "band_in": ["Put together", "Sharp"]})
case("PRO-11-tuck", "PRO-11", "the oversized tee tucked into straight jeans: no charge",
     Rd(top("tee", "white", 4, tucked="full"), DJEANS, WLS), {"not_fired": [F(PB1)], "fired": [F("PR1_waist_break")],
                                                               "band": "Put together"})
case("PRO-11-halftuck", "PRO-11", "the oversized tee front-tucked: still charged (only a full tuck excuses it), and the front tuck earns nothing",
     Rd(top("tee", "white", 4, tucked="half"), DJEANS, WLS), {"fired": [F(PB1, "proportions", -1.5)], "not_fired": [F("PR1b_half_tuck")],
                                                               "band": "Getting there"})
case("PRO-11-cityboy", "PRO-11", "a roomy knit over straight chinos with loafers: full-leg pressed trousers carry it (city boy)",
     Rd(top("sweater", "navy", 4), CHINOS, LOAFER), {"not_fired": [F(PB1)], "band": "Put together"})
case("PRO-11-layer", "PRO-11", "an oversized hoodie under a chore coat over slim jeans: the layer sets the line, no charge",
     Rd(top("hoodie", "grey", 4), outer("chore_coat", "tan_camel"), SLJEANS, BOOTS), {"not_fired": [F(PB1)], "band": "Put together"})
case("PRO-11-lounge", "PRO-11", "an oversized hoodie over slim joggers: loungewear has its own ladder, no band charge",
     Rd(top("hoodie", "grey", 4), bottom("joggers", "grey", "slim", "cuffed"), CANVAS), {"not_fired": [F(PB1)],
                                                                                       "band_in": ["Getting there", "Put together"]})
case("PRO-11-skinny", "PRO-11", "an oversized tee over skinny jeans: [PRO-2] charges it, not this rule",
     Rd(BIGTEE, SKJEANS, WLS), {"fired": [F("PF5_big_top_skinny_leg", "proportions", -1.5)], "not_fired": [F(PB1)],
                                "band": "Getting there"})
case("PRO-11-sx1", "PRO-11", "an oversized hoodie over slim chinos with loafers: [STY-5] charges the top, so this rule doesn't (one fact, one charge)",
     Rd(top("hoodie", "grey", 4), SLCHINOS, LOAFER), {"fired": [F("SX1_another_look", "cohesion", -3.0)], "not_fired": [F(PB1)],
                                                     "overall": 6.0, "band": "Getting there"})
case("PRO-11-ff5", "PRO-11", "a roomy oxford with the sleeves over the hands: Fit charges the long sleeves ([FIT-2]), so this rule doesn't",
     Rd(top("oxford_shirt", "white", 4, sleeve_end="covers_hand"), DJEANS, WLS), {"fired": [F("FF5_roomy_sleeves", "fit", -0.5)],
                                                                                 "not_fired": [F(PB1)], "band": "Put together"})
case("PRO-12-tip", "PRO-12", "a red sweater over wide grey trousers with derbies (smart casual: its legs stop at relaxed): a tip, no points",
     Rd(top("sweater", "red"), bottom("trousers", "grey", "wide"), DERBY),
     {"label": "smart_casual", "tips": [F("PB2_wide_leg_band", "proportions")], "part": {"proportions": {"score": 7.0}},
      "band_in": ["Put together", "Sharp"]})
case("PRO-12-minimal", "PRO-12", "a black sweater over wide black trousers with loafers (minimal: its legs reach wide): no tip",
     Rd(top("sweater", "black"), WTROUSERS, LOAFER_BK), {"tips_lacks": [F("PB2_wide_leg_band")], "band": "Put together"})
case("PRO-12-jeans", "PRO-12", "a grey sweater over wide jeans: wide jeans are never charged, not even as a tip",
     Rd(top("sweater", "grey"), WJEANS, WLS), {"tips_lacks": [F("PB2_wide_leg_band")], "band": "Put together"})
case("PRO-12-close", "PRO-12", "a close tee over wide chinos ('big pants, little shirt'): no tip",
     Rd(top("tee", "grey", 2), bottom("chinos", "khaki_beige", "wide"), WLS), {"tips_lacks": [F("PB2_wide_leg_band")],
                                                                               "band": "Put together"})

PN1 = "PN1_narrow_leg"
case("PRO-13-slim", "PRO-13", "a plain white tee over slim black jeans with white leather sneakers: -1.0",
     Rd(TEE, SLJEANS, WLS), {"fired": [F(PN1, "proportions", -1.0)], "part": {"proportions": {"score": 6.0}}, "overall": 7.0,
                             "band": "Put together"})
case("PRO-13-skinny", "PRO-13", "the same tee over skinny jeans: -2.0", Rd(TEE, SKJEANS, WLS),
     {"fired": [F(PN1, "proportions", -2.0)], "overall": 6.5, "band": "Getting there"})
case("PRO-13-ripped", "PRO-13", "skinny jeans ripped by design: -2.5", Rd(TEE, mod(SKJEANS, distressed_by_design=True), WLS),
     {"fired": [F(PN1, "proportions", -2.5)], "band": "Getting there"})
case("PRO-13-chinos", "PRO-13", "a white oxford over slim chinos with loafers: chinos count too, -1.0",
     Rd(top("oxford_shirt", "white"), SLCHINOS, LOAFER), {"fired": [F(PN1, "proportions", -1.0)], "band": "Put together"})
case("PRO-13-blazer", "PRO-13", "slim grey trousers under a navy blazer over a tucked dress shirt: the norm under tailoring, no charge",
     Rd(top("dress_shirt", "white", tucked="full"), outer("blazer", "navy"), bottom("trousers", "grey", "slim"), DERBY),
     {"not_fired": [F(PN1)], "fired": [F("PR3_tailored_line", "proportions", 1.0)], "band": "Sharp"})
case("PRO-13-suit", "PRO-13", "slim suit trousers with an oxford and derbies: a suit's trousers are never charged",
     Rd(top("oxford_shirt", "white"), bottom("suit_trousers", "navy", "slim", "no_break"), DERBY),
     {"not_fired": [F(PN1)], "part": {"proportions": {"score": 7.0}}, "band": "Put together"})
case("PRO-13-joggers", "PRO-13", "slim joggers: loungewear has its own rules, no charge",
     Rd(TEE, bottom("joggers", "grey", "slim", "cuffed"), WLS), {"not_fired": [F(PN1)], "band": "Getting there"})
PR2B = "PR2b_short_layer_read"
case("PRO-14-overshirt", "PRO-14", "an olive overshirt read as ending at the belt, over a tee and wide jeans: +1.0",
     Rd(TEE, outer("overshirt", "olive", length="at_belt"), WJEANS, WLS),
     {"fired": [F(PR2B, "proportions", 1.0)], "not_fired": [F("PR2_short_layer")], "band": "Put together"})
case("PRO-14-long", "PRO-14", "the same overshirt read as ending at mid-fly: nothing",
     Rd(TEE, outer("overshirt", "olive", length="mid_fly"), WJEANS, WLS), {"not_fired": [F(PR2B)], "band": "Put together"},
     vs={"case": "PRO-14-overshirt", "parts": {"proportions": -1.0}})
case("PRO-14-straight", "PRO-14", "the overshirt at the belt over straight jeans: it needs a loose leg, nothing",
     Rd(TEE, outer("overshirt", "olive", length="at_belt"), DJEANS, WLS), {"not_fired": [F(PR2B)], "band": "Put together"})
case("PRO-14-bomber", "PRO-14", "a bomber over wide jeans: the short-jacket credit ([PRO-6]), not this one as well",
     Rd(TEE, outer("bomber"), WJEANS, WLS), {"fired": [F("PR2_short_layer", "proportions", 1.5)], "not_fired": [F(PR2B)],
                                             "band": "Sharp"})
case("PRO-14-blazer", "PRO-14", "an unstructured blazer at the belt over wide grey trousers: tailoring isn't counted",
     Rd(TEE, outer("unstructured_blazer", "navy", length="at_belt"), bottom("trousers", "grey", "wide"), LOAFER_BK),
     {"not_fired": [F(PR2B)], "band_in": ["Put together", "Sharp"]})

# ===== Fit (FIT) =====================================================================================================
case("FIT-1-ceiling", "FIT-1", "a sharp tailored outfit still has Fit 7 (no reading can show a good fit)", TAILORED_OK,
     {"part": {"fit": {"score": 7.0}}, "band_in": ["Put together", "Sharp"]})
case("FIT-2-tailored", "FIT-2", "blazer sleeves over the hands: -2.0",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy", sleeve_end="covers_hand"), TROUSERS, DERBY),
     {"fired": [F("FF1_sleeves_tailored", "fit", -2.0)], "band_in": ["Getting there", "Put together"]})
case("FIT-2-ribbed", "FIT-2", "hoodie cuffs over the hands: -0.5",
     Rd(top("hoodie", "grey", sleeve_end="covers_hand"), DJEANS, WLS),
     {"fired": [F("FF1_cuffs_ribbed", "fit", -0.5)], "band": "Put together"})
case("FIT-2-roomy", "FIT-2", "a roomy oxford with sleeves over the hands: the cut, not a size fault, -0.5",
     Rd(top("oxford_shirt", "light_blue", 4, sleeve_end="covers_hand"), DJEANS, WLS),
     {"fired": [F("FF5_roomy_sleeves", "fit", -0.5)], "not_fired": [F("FF5_too_big")], "band": "Put together"})
case("FIT-2-roomy-layer", "FIT-2", "a roomy bomber with sleeves over the hands over wide jeans: -0.5",
     Rd(TEE, outer("bomber", "black", 4, sleeve_end="covers_hand"), WJEANS, CHUNKY),
     {"fired": [F("FF5_roomy_sleeves", "fit", -0.5)], "band_in": ["Put together", "Sharp"]})
case("FIT-2-long", "FIT-2", "a regular oxford with sleeves past the wrists: -1.5",
     Rd(top("oxford_shirt", "light_blue", sleeve_end="covers_hand"), DJEANS, WLS),
     {"fired": [F("FF1_sleeves_long", "fit", -1.5)], "band_in": ["Getting there", "Put together"]})
case("FIT-2-tee", "FIT-2", "a tee read as covering the hands is a misread: ignored",
     Rd(top("tee", "white", sleeve_end="covers_hand"), DJEANS, WLS),
     {"part": {"fit": {"score": 7.0}}, "band": "Put together"})
case("FIT-3-top", "FIT-3", "a top that clearly pulls: -2.0", Rd(top("tee", "white", strain="clear"), DJEANS, WLS),
     {"fired": [F("FF6_strain", "fit", -2.0)], "part": {"fit": {"score": 5.0}}, "band": "Put together"})
case("FIT-3-slim", "FIT-3", "slim jeans that clearly pull: -1.5", Rd(TEE, mod(SLJEANS, strain="clear"), WLS),
     {"fired": [F("FF6_strain", "fit", -1.5)], "band_in": ["Getting there", "Put together"]})
case("FIT-3-straight", "FIT-3", "straight chinos that clearly pull: -2.0", Rd(TEE, mod(CHINOS, strain="clear"), WLS),
     {"fired": [F("FF6_strain", "fit", -2.0)], "band": "Put together"})
case("FIT-3-some", "FIT-3", "'some' strain never counts", Rd(top("tee", "white", strain="some"), DJEANS, WLS),
     {"part": {"fit": {"score": 7.0}}, "band": "Put together"})
case("FIT-4-trousers", "FIT-4", "straight trousers piling on the shoes: -2.0", Rd(TEE, mod(TROUSERS, hem="pooling"), WLS),
     {"fired": [F("FF7_pooling", "fit", -2.0)], "part": {"fit": {"score": 5.0}}, "band": "Put together"})
case("FIT-4-wide-jeans", "FIT-4", "wide jeans piling on the shoes: a stack on a loose leg is part of the shape, nothing",
     Rd(TEE, mod(WJEANS, hem="pooling"), WLS), {"not_fired": [F("FF7_pooling")], "part": {"fit": {"score": 7.0}}, "band": "Put together"})
case("FIT-4-wide-trousers", "FIT-4", "wide trousers piling on the shoes: -0.5",
     Rd(TEE, mod(WTROUSERS, hem="pooling"), WLS), {"fired": [F("FF7_pooling", "fit", -0.5)], "band": "Put together"})
case("FIT-4-jeans", "FIT-4", "jeans piling on the shoes: -1.5", Rd(TEE, mod(DJEANS, hem="pooling"), WLS),
     {"fired": [F("FF7_pooling", "fit", -1.5)], "band_in": ["Getting there", "Put together"]})
case("FIT-4-joggers", "FIT-4", "joggers piling on the shoes: -0.5",
     Rd(TEE, bottom("joggers", "grey", "straight", "pooling"), WLS),
     {"fired": [F("FF7_pooling", "fit", -0.5)], "band_in": ["Getting there", "Put together"]})
case("FIT-4-slides", "FIT-4", "loose jeans piling over slides: Fit doesn't charge it (Shoes does)",
     Rd(TEE, mod(WJEANS, hem="pooling"), SLIDES),
     {"not_fired": [F("FF7_pooling")], "fired": [F("SK1b_hem_drags", "shoes", -0.5)], "band_in": ["Getting there", "Put together"]})
case("FIT-5-worst", "FIT-5", "blazer sleeves (-2) and pooling trousers (-2): the worst counts fully, the other half",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy", sleeve_end="covers_hand"),
        mod(TROUSERS, hem="pooling"), DERBY),
     {"part": {"fit": {"score": 4.0}}, "band_in": ["Getting there", "Put together"]})
case("FIT-5-piece", "FIT-5", "one oxford with long sleeves (-1.5) that also pulls (-2): -2.0 - 0.75",
     Rd(top("oxford_shirt", "light_blue", sleeve_end="covers_hand", strain="clear"), DJEANS, WLS),
     {"part": {"fit": {"score": 4.25}}, "band_in": ["Getting there", "Put together"]})
case("FIT-6-break", "FIT-6", "slim jeans with a full break: a tip, no points", Rd(TEE, mod(SLJEANS, hem="full_break"), WLS),
     {"tips": [F("FF7b_full_break_narrow", "fit")], "part": {"fit": {"score": 7.0}}, "band": "Put together"})

# ===== Color (COL) ===================================================================================================
case("COL-1-three", "COL-1", "green tee, blue bomber, bright orange chinos: three accents, -2.5",
     Rd(top("tee", "green"), outer("bomber", "blue"), bottom("chinos", "orange", "straight"), WLS),
     {"fired": [F("CC1_too_many_accents", "color", -2.5)], "band_in": ["Getting there", "Put together"]})
case("COL-1-muted", "COL-1", "the same with muted orange chinos: a muted color counts half, so no fault",
     Rd(top("tee", "green"), outer("bomber", "blue"), bottom("chinos", "orange", "straight", saturation="muted"), WLS),
     {"not_fired": [F("CC1_too_many_accents"), F("CC1_busy")], "band_in": ["Put together", "Sharp"]})
case("COL-1-busy", "COL-1", "five color families with two accents: -1.0",
     Rd(top("tee", "white"), top("cardigan", "navy"), top("overshirt", "blue"), outer("bomber", "green"), CHINOS, WLS),
     {"fired": [F("CC1_busy", "color", -1.0)], "band_in": ["Put together", "Sharp"]})
case("COL-2-bright", "COL-2", "a red sweater and yellow chinos: two brights fighting, -2.0",
     Rd(top("sweater", "red"), bottom("chinos", "yellow", "straight"), WLS),
     {"fired": [F("CC2_bright_clash", "color", -2.0)], "band_in": ["Getting there", "Put together"]})
case("COL-2-bold", "COL-2", "the same for a man who likes bold color: -1.0",
     Rd(top("sweater", "red"), bottom("chinos", "yellow", "straight"), WLS),
     {"fired": [F("CC2_bright_clash", "color", -1.0)], "band_in": ["Getting there", "Put together"]}, boldness="bold")
case("COL-3-near", "COL-3", "a navy blazer with charcoal trousers almost match: -1.5",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy"), CTROUSERS, DERBY),
     {"fired": [F("CC4_near_match", "color", -1.5)], "band_in": ["Put together", "Sharp"]})
case("COL-4-scale", "COL-4", "two stripes at the same size: -1.5",
     Rd(top("oxford_shirt", "white", pattern="stripes"), bottom("trousers", "grey", "straight", pattern="stripes",
                                                                  pattern_scale="medium"), DERBY),
     {"fired": [F("CC6_same_pattern_scale", "color", -1.5)], "band_in": ["Getting there", "Put together"]})
case("COL-4-twice", "COL-4", "two stripes whose size wasn't read: -0.75",
     Rd(top("oxford_shirt", "white", pattern="stripes", pattern_scale="na"),
        bottom("trousers", "grey", "straight", pattern="stripes", pattern_scale="na"), DERBY),
     {"fired": [F("CC6_same_pattern", "color", -0.75)], "band": "Put together"})
THREE_PAT = Rd(top("tee", "white", pattern="stripes", pattern_scale="small"),
               top("overshirt", "olive", pattern="checks_plaid"), bottom("chinos", "khaki_beige", "straight", pattern="other"), WLS)
case("COL-4-three", "COL-4", "stripes, checks and a third pattern outside streetwear: -1.5", THREE_PAT,
     {"fired": [F("CC6_three_patterns", "color", -1.5)], "band_in": ["Getting there", "Put together"]})
case("COL-5-standout", "COL-5", "one red sweater with neutrals: no credit for one bright piece",
     Rd(top("sweater", "red"), DJEANS, WLS), {"not_fired": [F("CP1_standout_color"), F("CP2_quiet_accent")],
                                              "part": {"color": {"score": 7.0}}, "band": "Put together"})
case("COL-5-accent", "COL-5", "one green sweater with neutrals: a quiet accent, +0.5",
     Rd(top("sweater", "green"), DJEANS, WLS), {"fired": [F("CP2_quiet_accent", "color", 0.5)], "band": "Put together"})
case("COL-5-tiein", "COL-5", "brown chukkas picking up a brown jacket: +0.5",
     Rd(TEE, outer("chore_coat", "brown"), DJEANS, CHUKKA), {"fired": [F("CP5_tie_in", "color", 0.5)],
                                                             "band_in": ["Put together", "Sharp"]})
case("COL-5-blocked", "COL-5", "a red sweater over two same-size stripes: the fault blocks the standout",
     Rd(top("sweater", "red"), top("oxford_shirt", "white", pattern="stripes"),
        bottom("trousers", "grey", "straight", pattern="stripes", pattern_scale="medium"), DERBY),
     {"not_fired": [F("CP1_standout_color")], "fired": [F("CC6_same_pattern_scale", "color")],
      "band_in": ["Getting there", "Put together"]})
case("COL-6-na", "COL-6", "only one piece of clothing in view: Color isn't scored",
     Rd(TEE, framing="upper_only", shoes_visible=False), {"part": {"color": {"na": True}}, "band": "Put together"})
case("COL-7-tonal", "COL-7", "all black: a tip to add depth, no points",
     Rd(top("tee", "black"), bottom("jeans", "black", "straight"), shoe("chelsea_boot", "black")),
     {"tips": [F("CP3_tonal_flat", "color")], "part": {"color": {"score": 7.0}}, "band_in": ["Put together", "Sharp"]})
case("COL-7-denim", "COL-7", "a denim jacket over jeans: a tip about the washes, no points",
     Rd(TEE, outer("denim_jacket", "denim_dark"), DJEANS, WLS),
     {"tips": [F("CC5_denim_near_match", "color")], "part": {"color": {"score": 7.0}}, "band_in": ["Put together", "Sharp"]})

CL1 = "CL1_loud_print"
case("COL-8-bright", "COL-8", "a bright red graphic tee with dark jeans and white leather sneakers: -1.5",
     Rd(top("graphic_tee", "red"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "part": {"color": {"score": 5.5}},
                                                  "band": "Getting there"})
case("COL-8-logo", "COL-8", "a black graphic tee whose print is a large logo: -1.5",
     Rd(top("graphic_tee", "black", logo="large"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "band": "Put together"})
case("COL-8-tee-logo", "COL-8", "a white tee printed with a large logo: -1.5",
     Rd(top("tee", "white", pattern="graphic", logo="large"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "band": "Put together"})
case("COL-8-plaid", "COL-8", "a large-check navy flannel over a tee with jeans and work boots: -1.5",
     Rd(TEE, top("flannel_shirt", "navy", pattern="checks_plaid", pattern_scale="large"), DJEANS, BOOTS),
     {"fired": [F(CL1, "color", -1.5)], "band": "Put together"})
case("COL-8-medium", "COL-8", "the same flannel in a medium check: fine",
     Rd(TEE, top("flannel_shirt", "navy", pattern="checks_plaid"), DJEANS, BOOTS), {"not_fired": [F(CL1)], "band": "Put together"},
     vs={"case": "COL-8-plaid", "parts": {"color": 1.5}, "overall": "up"})
case("COL-8-stripes", "COL-8", "a white oxford with large stripes: stripes are never loud",
     Rd(top("oxford_shirt", "white", pattern="stripes", pattern_scale="large"), CHINOS, LOAFER),
     {"not_fired": [F(CL1)], "band": "Put together"})
case("COL-8-plain", "COL-8", "a black graphic tee with a small print: fine", Rd(top("graphic_tee", "black"), DJEANS, WLS),
     {"not_fired": [F(CL1)], "part": {"color": {"score": 7.0}}, "band": "Put together"})
case("COL-8-hoodie", "COL-8", "a black hoodie with a large logo over wide jeans and chunky sneakers: streetwear's own piece, fine",
     Rd(top("hoodie", "black", pattern="graphic", logo="large"), WJEANS, CHUNKY), {"not_fired": [F(CL1)], "band": "Put together"})

# ===== Shoes (SHO) ===================================================================================================
case("SHO-1-other", "SHO-1", "shoe type lost: Shoes isn't scored", Rd(TEE, DJEANS, shoe("other", "black")),
     {"part": {"shoes": {"na": True}}, "band": "Put together"})
case("SHO-2-slides", "SHO-2", "slides out of the house: Shoes 4.5 (5.0 with [SHO-13], the rest being clean)", Rd(TEE, DJEANS, SLIDES),
     {"fired": [F("SK1_slides_out", "shoes", -2.5)], "part": {"shoes": {"score": 5.0}}, "band_in": ["Getting there", "Put together"]})
case("SHO-2-tailored", "SHO-2", "slides under a blazer: Shoes 2.5 (3.0 with [SHO-13])",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, SLIDES),
     {"fired": [F("SK1_slides_out", "shoes", -4.5)], "part": {"shoes": {"score": 3.0}}, "band_in": ["Getting there", "Put together"]})
case("SHO-2-drag", "SHO-2", "loose jeans dragging on slides: 0.5 more", Rd(TEE, mod(WJEANS, hem="pooling"), SLIDES),
     {"fired": [F("SK1b_hem_drags", "shoes", -0.5)], "part": {"shoes": {"score": 4.5}}, "band_in": ["Getting there", "Put together"]},
     vs={"case": "SHO-2-slides", "parts": {"shoes": -0.5}})
case("SHO-2-home", "SHO-2", "slides at home: right there, no charge", Rd(TEE, bottom("sweatpants", "grey", "relaxed", "cuffed"), SLIDES),
     {"not_fired": [F("SK1_slides_out"), F("SD2_too_casual")], "band_in": ["Put together", "Sharp"]}, occasion="home")
case("SHO-3-runner", "SHO-3", "running shoes with a tee and jeans: Shoes 5.0", Rd(TEE, DJEANS, RUNNER),
     {"fired": [F("SK2_runners", "shoes")], "part": {"shoes": {"score": 5.0}}, "overall": 6.5, "band": "Getting there"})
case("SHO-3-runner-tailored", "SHO-3", "running shoes under a blazer: Shoes 4.5",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, RUNNER),
     {"part": {"shoes": {"score": 4.5}}, "band_in": ["Getting there", "Put together"]})
case("SHO-3-gym", "SHO-3", "running shoes at the gym: fine", Rd(TEE, bottom("athletic_shorts", "black", "straight", "na"), RUNNER),
     {"not_fired": [F("SK2_runners")], "band_in": ["Put together", "Sharp"]}, occasion="gym")
case("SHO-4-canvas", "SHO-4", "canvas sneakers with a tee and jeans: too plain a shoe to earn the match",
     Rd(TEE, DJEANS, CANVAS), {"not_fired": [F("SD1_matches")], "part": {"shoes": {"score": 7.0}}, "band": "Put together"},
     vs={"case": "SCO-1-plain", "parts": {"shoes": -0.5}})
case("SHO-4-match", "SHO-4", "white leather sneakers with a tee and jeans: +0.5", Rd(TEE, DJEANS, WLS),
     {"fired": [F("SD1_matches", "shoes", 0.5)], "band": "Put together"})
case("SHO-4-sweats", "SHO-4", "Chelsea boots with sweatpants: only a sneaker matches sweats",
     Rd(TEE, bottom("sweatpants", "grey", "relaxed", "cuffed"), shoe("chelsea_boot", "black")),
     {"not_fired": [F("SD1_matches")], "band_in": ["Getting there", "Put together"]})
case("SHO-5-casual", "SHO-5", "canvas sneakers under a blazer, dress shirt and trousers: too casual, -1.5",
     Rd(top("dress_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, CANVAS),
     {"fired": [F("SD2_too_casual", "shoes", -1.5)], "band_in": ["Put together", "Sharp"]})
case("SHO-6-jeans", "SHO-6", "dress shoes with a hoodie and light jeans: no charge (the match credit doesn't reach this far, so Shoes 7)",
     Rd(top("hoodie", "grey"), bottom("jeans", "denim_light", "straight"), DRESS),
     {"not_fired": [F("SD3_too_dressy"), F("SD1_matches")], "part": {"shoes": {"score": 7.0}}, "band": "Put together"})
case("SHO-6-loafers", "SHO-6", "loafers with a tee and wide jeans: no charge",
     Rd(TEE, WJEANS, LOAFER), {"not_fired": [F("SD3_too_dressy")], "band": "Put together"})
case("SHO-6-sweats", "SHO-6", "dress shoes with a hoodie and sweatpants: much dressier, -0.5",
     Rd(top("hoodie", "grey"), bottom("sweatpants", "grey", "relaxed", "cuffed"), DRESS),
     {"fired": [F("SD3_too_dressy", "shoes", -0.5)], "not_fired": [F("SD1_matches")], "part": {"shoes": {"score": 6.5}},
      "band": "Getting there"})
case("SHO-7-suit", "SHO-7", "derbies under a matching navy suit: the suit's own shoes, +0.5",
     Rd(top("dress_shirt", "white", tucked="full"), outer("suit_jacket", "navy"), bottom("suit_trousers", "navy", "straight", "no_break"), DERBY),
     {"fired": [F("SC_chosen_for_look", "shoes", 0.5)], "band_in": ["Put together", "Sharp"]})
case("SHO-7-look", "SHO-7", "chunky sneakers with a hoodie and wide jeans: the look's own shoe, +0.5",
     Rd(top("hoodie", "grey"), WJEANS, CHUNKY), {"fired": [F("SC_chosen_for_look", "shoes", 0.5)], "band": "Put together"})
case("SHO-7-none", "SHO-7", "white leather sneakers with a plain tee and dark jeans: no look, no credit",
     Rd(TEE, DJEANS, WLS), {"not_fired": [F("SC_chosen_for_look")], "band": "Put together"})
case("SHO-8-chunky-blazer", "SHO-8", "chunky sneakers under a blazer: -2.0",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, CHUNKY),
     {"fired": [F("SD4_chunky_under_tailoring", "shoes", -2.0)], "band_in": ["Getting there", "Put together"]})
case("SHO-9-chunky-slim", "SHO-9", "chunky sneakers under slim jeans: -1.5", Rd(TEE, SLJEANS, CHUNKY),
     {"fired": [F("SW1_chunky_narrow", "shoes", -1.5)], "band_in": ["Getting there", "Put together"]})
case("SHO-9-runner-skinny", "SHO-9", "running shoes under skinny jeans: -0.5 on top of the runner rule", Rd(TEE, SKJEANS, RUNNER),
     {"fired": [F("SW1_runner_narrow", "shoes", -0.5)], "part": {"shoes": {"score": 4.5}}, "band_in": ["Needs a fix", "Getting there"]})
case("SHO-10-loud", "SHO-10", "red sneakers with a graphic tee: two loud things, -0.75",
     Rd(top("graphic_tee", "black"), DJEANS, shoe("canvas_sneaker", "red")),
     {"fired": [F("SCol1_loud_vs_loud", "shoes", -0.75)], "band_in": ["Getting there", "Put together"]})
case("SHO-10-accent", "SHO-10", "red sneakers with plain clothes: the one accent, +0.5",
     Rd(TEE, DJEANS, shoe("canvas_sneaker", "red")), {"fired": [F("SCol2_shoe_accent", "shoes", 0.5)], "band": "Put together"})
case("SHO-11-worn", "SHO-11", "worn white sneakers: -1.0", Rd(TEE, DJEANS, mod(WLS, condition="pilled_or_worn")),
     {"fired": [F("SQ_worn", "shoes", -1.0)], "band": "Put together"})
case("SHO-11-boots", "SHO-11", "worn work boots: only -0.5", Rd(TEE, DJEANS, mod(BOOTS, condition="pilled_or_worn")),
     {"fired": [F("SQ_worn", "shoes", -0.5)], "band": "Put together"})
case("SHO-12-dainty", "SHO-12", "loafers under wide jeans: no points and no tip",
     Rd(TEE, WJEANS, LOAFER), {"tips_lacks": [F("SW3_dainty_wide")], "not_fired": [F("SW1_chunky_narrow")],
                               "part": {"shoes": {"score": 7.5}}, "band": "Put together"})
case("SHO-13-clean", "SHO-13", "slides with a tee and dark jeans: nothing else is off, +0.5 back", Rd(TEE, DJEANS, SLIDES),
     {"fired": [F("SK1s_slides_soft", "shoes", 0.5)], "part": {"shoes": {"score": 5.0}}, "band": "Getting there"})
case("SHO-13-small", "SHO-13", "slides with a hoodie whose cuffs cover the hands (-0.5 on Fit): a small fault, still +0.5",
     Rd(top("hoodie", "grey", sleeve_end="covers_hand"), DJEANS, SLIDES), {"fired": [F("SK1s_slides_soft", "shoes", 0.5)],
                                                                         "band": "Getting there"})
case("SHO-13-fault", "SHO-13", "slides under skinny jeans (-2.0 on Proportions): no softening",
     Rd(TEE, SKJEANS, SLIDES), {"not_fired": [F("SK1s_slides_soft")], "part": {"shoes": {"score": 4.5}}, "band": "Needs a fix"})

# ===== Style part (STY) ==============================================================================================
POLO = Rd(top("polo", "navy"), CHINOS, WLS)
case("STY-1-reads", "STY-1", "navy polo, khaki chinos, white leather sneakers: reads as smart casual, +0.5", POLO,
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5)], "label": "smart_casual", "band": "Put together"})
case("STY-1-none", "STY-1", "no clear style: no credit, no charge", Rd(TEE, DJEANS, WLS),
     {"not_fired": [F("H1_reads_as_style")], "part": {"cohesion": {"score": 7.0}}, "label": None, "band": "Put together"})
case("STY-2-toe", "STY-2", "the same polo outfit: smart casual top to toe, +0.5", POLO,
     {"fired": [F("H2_clear_top_to_toe", "cohesion", 0.5)], "part": {"cohesion": {"score": 8.0}}, "band": "Put together"})
case("STY-2-any", "STY-2", "a black cardigan over wide black trousers with loafers reads as minimal and smart casual: smart casual's top to toe still counts",
     Rd(top("cardigan", "black"), WTROUSERS, LOAFER_BK), {"label": "minimalist", "fired": [F("H2_clear_top_to_toe", "cohesion", 0.5)],
                                                          "band": "Put together"})
SUIT = Rd(top("dress_shirt", "white", tucked="full"), outer("suit_jacket", "navy"),
          bottom("suit_trousers", "navy", "straight", "no_break"), DERBY)
case("STY-2-suit", "STY-2", "a matching suit over a shirt: +0.5 and +0.5", SUIT,
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5), F("H2_suit", "cohesion", 0.5)], "part": {"cohesion": {"score": 8.0}},
      "band_in": ["Put together", "Sharp"]})
case("STY-3-wide", "STY-3", "a blazer with wide jeans: -1.5",
     Rd(top("oxford_shirt", "white"), outer("blazer", "navy"), mod(WJEANS, color_family="denim_dark"), LOAFER),
     {"fired": [F("H3_another_world", "cohesion", -1.5)], "band_in": ["Getting there", "Put together"]})
case("STY-3-wash", "STY-3", "a blazer with light-wash straight jeans: -1.5",
     Rd(top("oxford_shirt", "white"), outer("blazer", "navy"), bottom("jeans", "denim_light", "straight"), LOAFER),
     {"fired": [F("H3_another_world", "cohesion", -1.5)], "band_in": ["Getting there", "Put together"]})
case("STY-3-dark", "STY-3", "a blazer with dark straight jeans: fine",
     Rd(top("oxford_shirt", "white"), outer("blazer", "navy"), DJEANS, LOAFER),
     {"not_fired": [F("H3_another_world")], "band_in": ["Put together", "Sharp"]})
case("STY-4-spread", "STY-4", "a tank top with dress trousers: formal and very casual, -1.5",
     Rd(top("tank_top", "white"), TROUSERS, LOAFER), {"fired": [F("H3_another_world", "cohesion", -1.5)],
                                                     "band_in": ["Getting there", "Put together"]})
case("STY-4-big", "STY-4", "a tank top with suit trousers: a very big spread, -4.0",
     Rd(top("tank_top", "white"), bottom("suit_trousers", "navy", "straight", "no_break"), DRESS),
     {"fired": [F("H3_another_world", "cohesion", -4.0)], "band_in": ["Getting there", "Put together"]})
case("STY-4-bridged", "STY-4", "a tank top under a blazer with dark jeans: the jacket is the one place a high-low mix works",
     Rd(top("tank_top", "white"), outer("blazer", "navy"), DJEANS, LOAFER),
     {"not_fired": [F("H3_another_world")], "band_in": ["Put together", "Sharp"]})
# STY-5: a piece from another look (the founder's three outfits, then the exemptions)
GT_TROUSERS = Rd(top("graphic_tee", "white", 4), mod(TROUSERS, color_family="charcoal"), LOAFER_BK)
case("STY-5-graphic", "STY-5", "oversized graphic tee, pleated trousers, loafers (founder case 1): Style -3.0, 6.5", GT_TROUSERS,
     {"fired": [F("SX1_another_look", "cohesion", -3.0)], "not_fired": [F("H1_reads_as_style")],
      "part": {"cohesion": {"score": 4.0}}, "overall": 6.5, "band": "Getting there"})
case("STY-5-hoodie", "STY-5", "oversized hoodie, slim chinos, loafers (founder case 2): the slim chinos cost 1.0 as well ([PRO-13]), 6.0",
     Rd(top("hoodie", "grey", 4), SLCHINOS, LOAFER),
     {"fired": [F("SX1_another_look", "cohesion", -3.0), F("PN1_narrow_leg", "proportions", -1.0)], "overall": 6.0,
      "band": "Getting there"})
case("STY-5-tee", "STY-5", "oversized plain tee, slim chinos, loafers (founder case 3): 6.0, as case 2",
     Rd(top("tee", "white", 4), SLCHINOS, LOAFER),
     {"fired": [F("SX1_another_look", "cohesion", -3.0)], "overall": 6.0, "band": "Getting there"})
case("STY-5-solidread", "STY-5", "a regular graphic tee whose print reads as solid, with trousers and loafers: still charged",
     Rd(top("graphic_tee", "black", pattern="solid"), WTROUSERS, LOAFER_BK),
     {"fired": [F("SX1_another_look", "cohesion", -3.0)], "band": "Getting there"})
case("STY-5-bomber", "STY-5", "a graphic tee under a bomber with trousers and loafers: a street layer doesn't bridge",
     Rd(top("graphic_tee", "white"), outer("bomber"), mod(TROUSERS, color_family="charcoal"), LOAFER_BK),
     {"fired": [F("SX1_another_look", "cohesion", -3.0)], "band_in": ["Getting there", "Put together"]})
case("STY-5-blazer", "STY-5", "a tee under an unstructured blazer with trousers and loafers: the blazer bridges, no charge",
     Rd(TEE, outer("unstructured_blazer", "navy"), mod(TROUSERS, color_family="charcoal"), LOAFER_BK),
     {"not_fired": [F("SX1_another_look")], "band_in": ["Put together", "Sharp"]})
case("STY-5-topcoat", "STY-5", "a hoodie under an overcoat with trousers and loafers: no charge",
     Rd(top("hoodie", "grey"), outer("overcoat", "navy"), mod(TROUSERS, color_family="charcoal"), LOAFER_BK),
     {"not_fired": [F("SX1_another_look")], "band_in": ["Put together", "Sharp"]})
case("STY-5-gtblazer", "STY-5", "an oversized graphic tee under a blazer: no charge (the founder's open call)",
     Rd(top("graphic_tee", "white", 4), outer("blazer", "navy"), mod(TROUSERS, color_family="charcoal"), LOAFER_BK),
     {"not_fired": [F("SX1_another_look")], "band_in": ["Put together", "Sharp"]}, kd="KD-9")
case("STY-5-sweatshirt", "STY-5", "a regular grey sweatshirt with navy chinos and loafers (Ivy): no charge",
     Rd(top("sweatshirt", "grey"), NCHINOS, LOAFER), {"not_fired": [F("SX1_another_look")], "band": "Put together"})
case("STY-5-cityboy", "STY-5", "a boxy tee at the belt over wide trousers with loafers: minimal's own shape, no charge",
     Rd(top("tee", "white", 4, length="at_belt"), mod(WTROUSERS, color_family="black"), LOAFER_BK),
     {"not_fired": [F("SX1_another_look")], "band": "Sharp"})
case("STY-5-onedressy", "STY-5", "a graphic tee with khaki chinos and white leather sneakers: one dressy piece, a tip only",
     Rd(top("graphic_tee", "black"), CHINOS, WLS),
     {"not_fired": [F("SX1_another_look")], "tips": [F("SX1_tip", "cohesion")], "band": "Put together"})
case("STY-5-knit", "STY-5", "a roomy sweater with chinos and loafers: the look's own piece, no charge",
     Rd(top("sweater", "navy", 4), CHINOS, LOAFER), {"not_fired": [F("SX1_another_look")], "band": "Put together"})
case("STY-6-statements", "STY-6", "a graphic tee, a big plaid shirt over it and bright red chinos: -1.0",
     Rd(top("graphic_tee", "black"), top("flannel_shirt", "navy", pattern="checks_plaid", pattern_scale="large"),
        bottom("chinos", "red", "straight"), WLS),
     {"fired": [F("H5_too_many_statements", "cohesion", -1.0)], "band_in": ["Getting there", "Put together"]})
case("STY-6-two", "STY-6", "a red sweater with camo cargos: two statements, -0.5",
     Rd(top("sweater", "red"), bottom("cargos", "olive", "straight", pattern="camo"), WLS),
     {"fired": [F("H5_too_many_statements", "cohesion", -0.5)], "band": "Put together"})
case("STY-6-bold", "STY-6", "the same for a man who likes bold: allowed",
     Rd(top("sweater", "red"), bottom("cargos", "olive", "straight", pattern="camo"), WLS),
     {"not_fired": [F("H5_too_many_statements")], "band": "Put together"}, boldness="bold")
case("STY-7-pattern", "STY-7", "a striped oxford with navy chinos and loafers: no credit for the one standout pattern",
     Rd(top("oxford_shirt", "white", pattern="stripes"), NCHINOS, LOAFER),
     {"not_fired": [F("H4_standout_piece")], "band_in": ["Put together", "Sharp"]},
     vs={"case": "PRO-4-base", "parts": {"cohesion": 0.0}})
case("STY-7-small", "STY-7", "a small-pattern oxford: too small to stand out",
     Rd(top("oxford_shirt", "white", pattern="checks_plaid", pattern_scale="small"), NCHINOS, LOAFER),
     {"not_fired": [F("H4_standout_piece")], "band_in": ["Put together", "Sharp"]})
case("STY-8-na", "STY-8", "only the top half in view: Style isn't scored",
     Rd(TEE, outer("bomber"), framing="upper_only", shoes_visible=False), {"part": {"cohesion": {"na": True}},
                                                                           "band": "Put together"})

TK1 = "TK1_tank_alone"
case("STY-9-tank", "STY-9", "a white tank top on its own with dark jeans and white leather sneakers: -2.0",
     Rd(top("tank_top", "white"), DJEANS, WLS), {"fired": [F(TK1, "cohesion", -2.0)], "part": {"cohesion": {"score": 5.0}},
                                                 "overall": 6.5, "band": "Getting there"})
case("STY-9-layer", "STY-9", "the same tank under an open overshirt: not on its own, no charge",
     Rd(top("tank_top", "white"), outer("overshirt", "olive"), DJEANS, WLS), {"not_fired": [F(TK1)], "band": "Put together"})
case("STY-9-shirt", "STY-9", "the tank under an open camp-collar shirt: not on its own, no charge",
     Rd(top("tank_top", "white"), top("camp_collar_shirt", "navy"), DJEANS, WLS), {"not_fired": [F(TK1)], "band": "Put together"})
case("STY-9-gym", "STY-9", "a tank top with gym shorts and running shoes at the gym: fine",
     Rd(top("tank_top", "white"), bottom("athletic_shorts", "black", "straight", "na"), RUNNER),
     {"not_fired": [F(TK1)], "band": "Put together"}, occasion="gym")

# ===== Condition (CON) ===============================================================================================
case("CON-1-stain", "CON-1", "a sure stain on the tee: -1.2", Rd(top("tee", "white", condition="stained"), DJEANS, WLS),
     {"cond_deduction": 1.2, "band": "Getting there"})
case("CON-1-unsure", "CON-1", "a stain the AI is only 'likely' about: no charge",
     Rd(top("tee", "white", condition="stained", certainty="likely"), DJEANS, WLS), {"cond_deduction": 0.0, "band": "Put together"})
case("CON-1-wrinkled", "CON-1", "a wrinkled oxford: -0.4",
     Rd(top("oxford_shirt", "white", condition="wrinkled"), CHINOS, LOAFER), {"cond_deduction": 0.4, "band": "Put together"})
case("CON-1-linen", "CON-1", "wrinkled pull-on trousers (likely linen): -0.2",
     Rd(TEE, bottom("drawstring_trousers", "khaki_beige", "relaxed", condition="wrinkled"), LOAFER),
     {"cond_deduction": 0.2, "band": "Put together"})
case("CON-1-worn", "CON-1", "a worn, pilled hoodie: -0.4", Rd(top("hoodie", "grey", condition="pilled_or_worn"), DJEANS, WLS),
     {"cond_deduction": 0.4, "band_in": ["Getting there", "Put together"]})
case("CON-1-distressed", "CON-1", "worn-looking jeans that are distressed by design: no charge",
     Rd(TEE, mod(DJEANS, condition="pilled_or_worn", distressed_by_design=True), WLS), {"cond_deduction": 0.0, "band": "Put together"})
case("CON-1-cap", "CON-1", "two stains: capped at -1.6",
     Rd(top("tee", "white", condition="stained"), mod(DJEANS, condition="stained"), WLS),
     {"cond_deduction": 1.6, "band": "Needs a fix"})
case("CON-1-shoes", "CON-1", "worn shoes aren't a Condition fault (Shoes owns them)",
     Rd(TEE, DJEANS, mod(WLS, condition="pilled_or_worn")), {"cond_deduction": 0.0, "band": "Put together"})
case("CON-2-dim", "CON-2", "a stain in a dim photo: not checked", Rd(top("tee", "white", condition="stained"), DJEANS, WLS,
                                                                     lighting="dim"),
     {"cond_deduction": 0.0, "band": "Put together"})
case("CON-3-shirt", "CON-3", "an untucked dress shirt with dress trousers: -0.6",
     Rd(top("dress_shirt", "white"), TROUSERS, DERBY), {"cond_deduction": 0.6, "band_in": ["Getting there", "Put together"]})
case("CON-3-jeans", "CON-3", "an untucked dress shirt with jeans at Everyday: no charge",
     Rd(top("dress_shirt", "white"), DJEANS, WLS), {"cond_deduction": 0.0, "band": "Put together"})
case("CON-4-clean", "CON-4", "a clean green sweater earns the quiet accent", Rd(top("sweater", "green"), DJEANS, WLS),
     {"fired": [F("CP2_quiet_accent", "color", 0.5)], "band": "Put together"})
case("CON-4-stained", "CON-4", "the same sweater stained earns nothing anywhere",
     Rd(top("sweater", "green", condition="stained"), DJEANS, WLS),
     {"not_fired": [F("CP2_quiet_accent")], "band": "Getting there"},
     vs={"case": "CON-4-clean", "parts": {"color": -0.5}, "overall": "down"})
case("CON-5-wrinkled", "CON-5", "a wrinkled oxford the AI is only 'likely' about: no charge, a no-points tip",
     Rd(top("oxford_shirt", "white", condition="wrinkled", certainty="likely"), CHINOS, LOAFER),
     {"cond_deduction": 0.0, "cond_tips": ["C_unsure_wrinkled"], "band": "Put together"},
     vs={"case": "CON-1-wrinkled", "parts": {"proportions": 0.0, "fit": 0.0, "color": 0.0, "shoes": 0.0, "cohesion": 0.0}})
case("CON-5-clear", "CON-5", "the same oxford read 'clear': -0.4 and no tip",
     Rd(top("oxford_shirt", "white", condition="wrinkled"), CHINOS, LOAFER), {"cond_deduction": 0.4, "cond_tips": [], "band": "Put together"})
case("CON-5-shoes", "CON-5", "worn sneakers the AI is only 'likely' about: no Shoes charge, a tip",
     Rd(TEE, DJEANS, mod(WLS, condition="pilled_or_worn", certainty="likely")),
     {"not_fired": [F("SQ_worn")], "cond_deduction": 0.0, "cond_tips": ["C_unsure_worn"], "band": "Put together"},
     vs={"case": "SHO-11-worn", "parts": {"shoes": 1.0}, "overall": "same"})
case("CON-5-credit", "CON-5", "a worn green sweater the AI is only 'likely' about keeps its quiet accent",
     Rd(top("sweater", "green", condition="pilled_or_worn", certainty="likely"), DJEANS, WLS),
     {"fired": [F("CP2_quiet_accent", "color", 0.5)], "cond_deduction": 0.0, "cond_tips": ["C_unsure_worn"], "band": "Put together"},
     vs={"case": "CON-4-clean", "parts": {"color": 0.0}, "overall": "same"})
case("CON-5-floor", "CON-5", "the messy outfit with a 'likely' worn top keeps the 5.0 floor",
     Rd(top("oxford_shirt", "red", 4, sleeve_end="covers_hand", condition="pilled_or_worn", certainty="likely"), top("sweater", "yellow"),
        outer("bomber", "purple"), mod(SKJEANS, hem="pooling"), SLIDES),
     {"floored": True, "overall": 5.0, "cond_tips": ["C_unsure_worn"], "band": "Needs a fix"})
case("CON-5-dim", "CON-5", "in a dim photo nothing is checked, so no tip either",
     Rd(top("tee", "white", condition="wrinkled", certainty="likely"), DJEANS, WLS, lighting="dim"),
     {"cond_deduction": 0.0, "cond_tips": [], "band": "Put together"})

# ===== Occasion (OCC) ================================================================================================
HOODIE_FIT = Rd(top("hoodie", "grey"), DJEANS, WLS)
case("OCC-1-everyday", "OCC-1", "a hoodie, dark jeans and white sneakers at Everyday: right for it", HOODIE_FIT,
     {"ceiling": None, "occ_deduction": 0.0, "band": "Put together"})
case("OCC-1-interview", "OCC-1", "the same at an interview (a level under its band): held to 6.0 and -0.5", HOODIE_FIT,
     {"ceiling": 6.0, "occ_deduction": 0.5, "band": "Getting there"}, occasion="interview",
     vs={"case": "OCC-1-everyday", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": "down"})
case("OCC-1-date", "OCC-1", "a hoodie, light-wash jeans and canvas sneakers on a date: half a level under, -0.25",
     Rd(top("hoodie", "grey"), bottom("jeans", "denim_light", "straight"), CANVAS),
     {"ceiling": None, "occ_deduction": 0.25, "occ_lines_has": ["a bit casual for date"], "band_in": ["Getting there", "Put together"]},
     occasion="date")
case("OCC-2-derby", "OCC-2", "a full suit with derbies at Everyday: 1.5 levels over its band, not yet charged", SUIT,
     {"occ_deduction": 0.0, "band_in": ["Put together", "Sharp"]})
case("OCC-2-over", "OCC-2", "the same suit with dress shoes at Everyday: 1.75 levels over, a bit dressy, -0.25",
     Rd(top("dress_shirt", "white", tucked="full"), outer("suit_jacket", "navy"),
        bottom("suit_trousers", "navy", "straight", "no_break"), DRESS),
     {"occ_deduction": 0.25, "occ_lines_has": ["a bit dressy for everyday"], "band_in": ["Put together", "Sharp"]})
case("OCC-3-slides", "OCC-3", "slides at an interview: held to 4.0",
     Rd(top("dress_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, SLIDES),
     {"ceiling": 4.0, "overall": 4.0, "band": "Needs a fix"}, occasion="interview")
case("OCC-4-sneakers", "OCC-4", "white sneakers under a blazer at an interview: held to 7.0",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, WLS),
     {"ceiling": 7.0, "overall_max": 7.0, "band_in": ["Getting there", "Put together"]}, occasion="interview")
case("OCC-4-everyday", "OCC-4", "the same at a date: no hold", Rd(top("oxford_shirt", "white", tucked="full"),
                                                                  outer("blazer", "navy"), TROUSERS, WLS),
     {"ceiling": None, "band_in": ["Put together", "Sharp"]}, occasion="date")
case("OCC-5-logo", "OCC-5", "a big logo the AI is sure of at an interview: held to 6.5",
     Rd(top("sweater", "navy", logo="large", tucked="full"), TROUSERS, DERBY),
     {"ceiling": 6.5, "overall_max": 6.5, "band": "Getting there"}, occasion="interview")

case("OCC-6-hoodie", "OCC-6", "the hoodie, dark jeans and white sneakers at an event: half a level under its band, -0.25, no ceiling",
     HOODIE_FIT, {"ceiling": None, "occ_deduction": 0.25, "occ_lines_has": ["a bit casual for event"], "band": "Put together"},
     occasion="event", vs={"case": "OCC-1-interview", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": "up"})
case("OCC-6-oxford", "OCC-6", "an oxford, chinos and loafers at an event: right for it",
     Rd(top("oxford_shirt", "white"), CHINOS, LOAFER), {"ceiling": None, "occ_deduction": 0.0, "band": "Put together"}, occasion="event")
case("OCC-6-tank", "OCC-6", "a tank top, shorts and canvas sneakers at an event: still too casual, held to about 5.3",
     Rd(top("tank_top", "white"), bottom("shorts", "khaki_beige", "straight", "na"), CANVAS),
     {"ceiling": 5.333, "occ_deduction": 0.5, "band": "Needs a fix"}, occasion="event")
case("OCC-6-slides", "OCC-6", "slides at an event: still held to 4.0 ([OCC-3])",
     Rd(top("oxford_shirt", "white"), CHINOS, SLIDES), {"ceiling": 4.0, "overall": 4.0, "band": "Needs a fix"}, occasion="event")

# ===== Loungewear (LNG) ==============================================================================================
JOG = bottom("joggers", "grey", "straight", "cuffed")
case("LNG-1-interview", "LNG-1", "joggers at an interview: held to 4.0",
     Rd(top("oxford_shirt", "white", tucked="full"), JOG, LOAFER), {"ceiling": 4.0, "band": "Needs a fix"}, occasion="interview")
case("LNG-2-zero", "LNG-2", "joggers, a plain tee and slides at Everyday: no signs of intent, held to 5.5",
     Rd(TEE, JOG, SLIDES), {"ceiling": 5.5, "band": "Needs a fix", "occ_lines_has": ["loungewear out of the house"]})
case("LNG-2-one", "LNG-2", "joggers, a plain tee and white sneakers: one sign (a real shoe), held to 6.5",
     Rd(TEE, JOG, WLS), {"ceiling": 6.5, "overall_max": 6.5, "band": "Getting there"})
case("LNG-2-two", "LNG-2", "joggers, an oxford and white sneakers: two signs, held to 7.5",
     Rd(top("oxford_shirt", "white"), JOG, WLS), {"ceiling": 7.5, "band_in": ["Getting there", "Put together"]})
case("LNG-2-hidden", "LNG-2", "joggers and a plain tee with the shoes out of view: the shoes count as real, 6.5",
     Rd(TEE, JOG, shoes_visible=False), {"ceiling": 6.5, "band": "Getting there"})
case("LNG-3-hero", "LNG-3", "a jersey with joggers and retro runners: a vintage sport hero with both signs, no hold",
     Rd(top("jersey", "green"), JOG, RETRO), {"ceiling": None, "band_in": ["Put together", "Sharp"]})
case("LNG-3-shorts", "LNG-3", "gym shorts with a tee and white sneakers: no hold",
     Rd(TEE, bottom("athletic_shorts", "black", "straight", "na"), WLS), {"ceiling": None, "band": "Put together"})
case("LNG-4-kit", "LNG-4", "a jersey with gym shorts: a full kit counts no signs, held to 5.5",
     Rd(top("jersey", "green"), bottom("athletic_shorts", "black", "straight", "na"), RETRO),
     {"ceiling": 5.5, "detected_lacks": ["vintage_sport"], "band": "Needs a fix"})
case("LNG-5-gym", "LNG-5", "joggers, a tee and running shoes at the gym: no hold, no shoe charge",
     Rd(TEE, JOG, RUNNER), {"ceiling": None, "not_fired": [F("SK2_runners")], "band_in": ["Put together", "Sharp"]},
     occasion="gym")
case("LNG-6-class", "LNG-6", "joggers, a tee and slides at Class: counted as casual, so only a little casual for class",
     Rd(TEE, JOG, SLIDES), {"occ_lines_has": ["a bit casual for class"], "occ_lines_lacks": ["too casual"],
                            "band": "Needs a fix"}, occasion="class")
case("LNG-7-style", "LNG-7", "a grey hoodie, wide joggers and chunky sneakers reads as streetwear: held to 7.0, not 6.5",
     Rd(top("hoodie", "grey"), bottom("joggers", "grey", "wide", "cuffed"), CHUNKY),
     {"label": "streetwear", "ceiling": 7.0, "band": "Put together"})
case("LNG-7-none", "LNG-7", "a plain tee with the same joggers and sneakers reads as no style: held to 6.5",
     Rd(TEE, bottom("joggers", "grey", "wide", "cuffed"), CHUNKY), {"label": None, "ceiling": 6.5, "band": "Getting there"},
     vs={"case": "LNG-7-style", "overall": "down"})

# ===== Streetwear (STR) ==============================================================================================
HOODIE_STREET = Rd(top("hoodie", "grey"), WJEANS, CHUNKY)
case("STR-1-reads", "STR-1", "grey hoodie, wide jeans, chunky sneakers: streetwear", HOODIE_STREET,
     {"detected_has": ["streetwear"], "label": "streetwear", "band": "Put together"})
case("STR-1-hoodie-layer", "STR-1", "a green zip hoodie worn open over a cream striped oxford, light wide jeans, basketball sneakers: "
     "the hoodie as the jacket is a signature piece too (the founder's Oct 11 check)",
     Rd(top("oxford_shirt", "off_white_cream", pattern="stripes", pattern_scale="small"), outer("hoodie", "green"),
        bottom("jeans", "denim_mid", "wide", "full_break", volume=4), shoe("basketball_sneaker", "black")),
     {"detected_has": ["streetwear"], "label": "streetwear", "fired": [F("PR2b_short_layer_read", "proportions", 1.0)],
      "overall": 8.0, "band": "Sharp"}, occasion="class")
case("STR-1-sweatshirt-layer", "STR-1", "a sweatshirt worn over a tee with wide jeans and chunky sneakers: streetwear",
     Rd(TEE, outer("sweatshirt", "grey"), WJEANS, CHUNKY), {"detected_has": ["streetwear"], "band": "Sharp"})
case("STR-2-home", "STR-2", "a plain tee over wide jeans with white leather sneakers: streetwear from home pieces",
     Rd(TEE, WJEANS, WLS), {"detected_has": ["streetwear"], "band": "Put together"})
case("STR-3-loafers", "STR-3", "a hoodie and wide jeans with loafers: dress shoes rule streetwear out",
     Rd(top("hoodie", "grey"), WJEANS, LOAFER), {"detected_lacks": ["streetwear"], "band": "Put together"})
case("STR-3-skinny", "STR-3", "a hoodie over skinny jeans with chunky sneakers: skinny legs rule it out",
     Rd(top("hoodie", "grey"), SKJEANS, CHUNKY), {"detected_lacks": ["streetwear"], "band_in": ["Needs a fix", "Getting there"]})
case("STR-3-polo", "STR-3", "a polo over wide jeans with chunky sneakers and no jacket: not streetwear",
     Rd(top("polo", "white"), WJEANS, CHUNKY), {"detected_lacks": ["streetwear"], "band": "Put together"})
case("STR-4-straight", "STR-4", "a regular hoodie over straight dark jeans with chunky sneakers: no volume, not streetwear",
     Rd(top("hoodie", "grey"), DJEANS, CHUNKY), {"detected_lacks": ["streetwear"], "band": "Put together"})
case("STR-4-sweater", "STR-4", "a sweater over wide jeans with chunky sneakers: no street piece up top, not streetwear",
     Rd(top("sweater", "grey"), WJEANS, CHUNKY), {"detected_lacks": ["streetwear"], "band": "Put together"})
case("STR-4-outdoor", "STR-4", "a shell over wide cargos with chunky sneakers: both fit, the chunky sneakers make it streetwear",
     Rd(TEE, outer("shell_jacket", "black"), bottom("cargos", "olive", "wide", "cuffed"), CHUNKY),
     {"detected_has": ["streetwear", "outdoor"], "label": "streetwear", "band_in": ["Put together", "Sharp"]})
SHAPE = Rd(top("graphic_tee", "white", 4), WJEANS, CHUNKY)
case("STR-5-shape", "STR-5", "an oversized graphic tee over wide jeans with chunky sneakers: the streetwear shape, +1.0",
     SHAPE, {"fired": [F("PR4_street_shape", "proportions", 1.0)], "band": "Sharp", "overall": 8.0})
case("STR-5-wls", "STR-5", "the same with white leather sneakers: no shape credit (not a street shoe here)",
     Rd(top("graphic_tee", "white", 4), WJEANS, WLS), {"not_fired": [F("PR4_street_shape")], "band": "Put together"},
     vs={"case": "STR-5-shape", "parts": {"proportions": -1.0}, "overall": "down"})
case("STR-5-canvas", "STR-5", "the same with canvas sneakers: the shape counts", Rd(top("graphic_tee", "white", 4), WJEANS, CANVAS),
     {"fired": [F("PR4_street_shape", "proportions", 1.0)], "band_in": ["Put together", "Sharp"]})
case("STR-5-tucked", "STR-5", "the same tee tucked in: no streetwear shape (the waist break takes over)",
     Rd(top("graphic_tee", "white", 4, tucked="full"), WJEANS, CHUNKY),
     {"not_fired": [F("PR4_street_shape")], "fired": [F("PR1_waist_break", "proportions", 1.5)], "band": "Sharp"})
case("STR-5-layer", "STR-5", "the same tee under a bomber: the short jacket earns instead, not both",
     Rd(top("graphic_tee", "white", 4), outer("bomber"), WJEANS, CHUNKY),
     {"not_fired": [F("PR4_street_shape")], "fired": [F("PR2_short_layer", "proportions", 1.5)], "band_in": ["Put together", "Sharp"]})
case("STR-6-carry", "STR-6", "chunky sneakers under wide jeans in a streetwear fit: +0.5", HOODIE_STREET,
     {"fired": [F("SW2_weight_carries_leg", "shoes", 0.5)], "part": {"shoes": {"score": 8.0}}, "band": "Put together"})
case("STR-7-toe", "STR-7", "the same hoodie fit: reads as streetwear (+0.5) and top to toe (+0.5)", HOODIE_STREET,
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5), F("H2_clear_top_to_toe", "cohesion", 0.5)],
      "part": {"cohesion": {"score": 8.0}}, "band": "Put together"})
case("STR-7-against", "STR-7", "a hoodie, wide cargos and canvas sneakers: streetwear, but no top-to-toe (canvas is a home shoe)",
     Rd(top("hoodie", "grey"), bottom("cargos", "olive", "wide", "cuffed"), CANVAS),
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5)], "not_fired": [F("H2_clear_top_to_toe")], "band": "Put together"})
BRIGHTS_STREET = Rd(top("hoodie", "red"), outer("puffer", "yellow"), WJEANS, CHUNKY)
case("STR-8-bright", "STR-8", "a red hoodie under a yellow puffer in a streetwear fit: two brights cost half, -1.0",
     BRIGHTS_STREET, {"detected_has": ["streetwear"], "fired": [F("CC2_bright_clash", "color", -1.0)], "band": "Put together"})
case("STR-9-patterns", "STR-9", "a graphic tee, a plaid flannel over it and camo cargos, streetwear: three patterns allowed",
     Rd(top("graphic_tee", "black"), top("flannel_shirt", "red", pattern="checks_plaid", saturation="muted"),
        bottom("cargos", "olive", "wide", "cuffed", pattern="camo"), CHUNKY),
     {"detected_has": ["streetwear"], "not_fired": [F("CC6_three_patterns")], "band_in": ["Put together", "Sharp"]})
case("STR-10-statements", "STR-10", "a red hoodie with camo wide cargos and chunky sneakers: one more statement allowed",
     Rd(top("hoodie", "red"), bottom("cargos", "olive", "wide", "cuffed", pattern="camo"), CHUNKY),
     {"detected_has": ["streetwear"], "not_fired": [F("H5_too_many_statements")], "band_in": ["Put together", "Sharp"]})
case("STR-10-nostreet", "STR-10", "the same two statements in a sweater outfit that isn't streetwear: -0.5",
     Rd(top("sweater", "red"), bottom("cargos", "olive", "straight", pattern="camo"), WLS),
     {"detected_lacks": ["streetwear"], "fired": [F("H5_too_many_statements", "cohesion", -0.5)], "band": "Put together"})
case("STR-11-baggy", "STR-11", "an oversized tee over wide jeans: no charge for the volume (for anyone)",
     Rd(top("tee", "black", 4), bottom("jeans", "black", "wide", "cuffed"), WLS),
     {"part": {"proportions": {"score": 7.0}, "fit": {"score": 7.0}}, "band": "Put together"})
case("STR-11-slim", "STR-11", "an oversized hoodie over slim jeans with chunky sneakers: streetwear's room needs a fuller leg ([PRO-11])",
     Rd(top("hoodie", "grey", 4), SLJEANS, CHUNKY), {"detected_has": ["streetwear"], "fired": [F(PB1, "proportions", -1.5),
                                                     F("SW1_chunky_narrow", "shoes", -1.5)], "band": "Needs a fix"})
case("STR-12-stack", "STR-12", "wide jeans read as pooling under the shape: no Fit charge, the shape credit stays, only the carry credit goes",
     Rd(top("graphic_tee", "white", 4), mod(WJEANS, hem="pooling"), CHUNKY),
     {"fired": [F("PR4_street_shape", "proportions", 1.0)], "not_fired": [F("FF7_pooling"), F("SW2_weight_carries_leg")],
      "part": {"fit": {"score": 7.0}}, "band": "Sharp"})
case("STR-12-cuffed", "STR-12", "the same jeans cuffed: no hem charge", SHAPE,
     {"not_fired": [F("FF7_pooling")], "band": "Sharp"})
case("STR-13-crossing", "STR-13", "the same oversized graphic tee with trousers and loafers: charged as a piece from another look",
     GT_TROUSERS, {"fired": [F("SX1_another_look", "cohesion", -3.0)], "band": "Getting there"},
     vs={"case": "STR-5-shape", "overall": "down"})
case("STR-14-hoodie3", "STR-14", "a regular hoodie over wide jeans with chunky sneakers: no shape credit (read as regular)",
     HOODIE_STREET, {"not_fired": [F("PR4_street_shape")], "band": "Put together"}, kd="KD-1")
case("STR-14-graphic", "STR-14", "a graphic tee is never the 'one standout piece'",
     Rd(top("graphic_tee", "black"), WJEANS, CHUNKY), {"not_fired": [F("H4_standout_piece")], "band": "Put together"})
case("STR-14-puffer", "STR-14", "a puffer over wide jeans read as ending at the belt: not a short jacket by type, but its read length earns [PRO-14]'s +1.0",
     Rd(TEE, outer("puffer", "black", length="at_belt"), WJEANS, CHUNKY),
     {"not_fired": [F("PR2_short_layer")], "fired": [F("PR2b_short_layer_read", "proportions", 1.0)], "band": "Sharp"})
case("STR-14-puffer-long", "STR-14", "the same puffer read as ending at mid-fly: no shape credit",
     Rd(TEE, outer("puffer", "black", length="mid_fly"), WJEANS, CHUNKY),
     {"not_fired": [F("PR2_short_layer"), F("PR2b_short_layer_read")], "band": "Put together"})

# ===== Workwear (WRK) ================================================================================================
WW = Rd(TEE, outer("chore_coat", "tan_camel"), DJEANS, BOOTS)
case("WRK-1-reads", "WRK-1", "a tan chore coat over a white tee, dark jeans, work boots: workwear", WW,
     {"detected_has": ["workwear"], "label": "workwear", "band": "Sharp"})
case("WRK-1-flannel", "WRK-1", "a flannel with jeans and Chelsea boots: workwear",
     Rd(top("flannel_shirt", "red", pattern="checks_plaid", saturation="muted"), DJEANS, shoe("chelsea_boot", "brown")),
     {"detected_has": ["workwear"], "band_in": ["Put together", "Sharp"]})
case("WRK-1-overshirt", "WRK-1", "an overshirt with jeans and white sneakers: home pieces only, not workwear",
     Rd(TEE, outer("overshirt", "olive"), DJEANS, WLS), {"detected_lacks": ["workwear"], "band": "Put together"})
case("WRK-2-against", "WRK-2", "a chore coat over a graphic tee with chunky sneakers: too much against it, not workwear",
     Rd(top("graphic_tee", "black"), outer("chore_coat", "tan_camel"), DJEANS, CHUNKY),
     {"detected_lacks": ["workwear"], "band": "Put together"})
case("WRK-3-veto", "WRK-3", "a chore coat with jeans and slides: never workwear",
     Rd(TEE, outer("chore_coat", "tan_camel"), DJEANS, SLIDES), {"detected_lacks": ["workwear"], "band_in": ["Getting there", "Put together"]})
case("WRK-3-joggers", "WRK-3", "a chore coat over joggers with work boots: never workwear",
     Rd(TEE, outer("chore_coat", "tan_camel"), JOG, BOOTS), {"detected_lacks": ["workwear"], "band_in": ["Getting there", "Put together"]})
case("WRK-4-shape", "WRK-4", "the chore coat outfit: the workwear shape, +1.0, scoring 8.0", WW,
     {"fired": [F("PR5_workwear_shape", "proportions", 1.0)], "overall": 8.0, "band": "Sharp"})
case("WRK-4-sneakers", "WRK-4", "the same chore coat with low-profile sneakers: no workwear shape",
     Rd(TEE, outer("chore_coat", "tan_camel"), DJEANS, LOWP),
     {"not_fired": [F("PR5_workwear_shape")], "band": "Put together"},
     vs={"case": "WRK-4-shape", "overall": "down"})
case("WRK-4-chukka", "WRK-4", "the same with suede chukkas: boots of any kind count",
     Rd(TEE, outer("chore_coat", "tan_camel"), DJEANS, CHUKKA),
     {"fired": [F("PR5_workwear_shape", "proportions", 1.0)], "band": "Sharp"})
case("WRK-4-chinos", "WRK-4", "a chore coat over chinos with boots: no workwear shape (needs jeans or cargos)",
     Rd(TEE, outer("chore_coat", "tan_camel"), CHINOS, BOOTS), {"not_fired": [F("PR5_workwear_shape")],
                                                                "band_in": ["Put together", "Sharp"]})
case("WRK-5-trucker", "WRK-5", "a denim jacket (trucker) over a tee and dark jeans with work boots: the short jacket, +1.5",
     Rd(TEE, outer("denim_jacket", "denim_mid"), DJEANS, BOOTS),
     {"fired": [F("PR2_short_layer", "proportions", 1.5)], "detected_has": ["workwear"], "band_in": ["Put together", "Sharp"]})
case("WRK-6-boots", "WRK-6", "work boots in the chore coat fit: the look's own shoe, +0.5", WW,
     {"fired": [F("SC_chosen_for_look", "shoes", 0.5)], "band": "Sharp"})
case("WRK-7-worn", "WRK-7", "worn work boots in the chore coat fit: only -0.5, but worn boots earn no credit, so the shape and the look's shoe go",
     Rd(TEE, outer("chore_coat", "tan_camel"), DJEANS, mod(BOOTS, condition="pilled_or_worn")),
     {"fired": [F("SQ_worn", "shoes", -0.5)], "not_fired": [F("PR5_workwear_shape"), F("SC_chosen_for_look")],
      "band": "Put together"})
case("WRK-8-skinny", "WRK-8", "a chore coat over skinny jeans: -0.5 (nothing sturdy to sit on)",
     Rd(TEE, outer("chore_coat", "tan_camel"), SKJEANS, BOOTS), {"fired": [F("PF6_layer_over_skinny", "proportions", -0.5),
                                                                            F("PN1_narrow_leg", "proportions", -2.0)],
                                                                  "band": "Getting there"})
case("WRK-9-notoe", "WRK-9", "the chore coat outfit gets no top-to-toe credit: jeans are only a home piece", WW,
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5)], "not_fired": [F("H2_clear_top_to_toe")], "band": "Sharp"}, kd="KD-4")

case("WRK-10-roomy", "WRK-10", "a roomy flannel over straight dark jeans with work boots: workwear's band holds the room",
     Rd(top("flannel_shirt", "red", 4, pattern="checks_plaid", saturation="muted"), DJEANS, BOOTS),
     {"detected_has": ["workwear"], "not_fired": [F(PB1)], "band_in": ["Put together", "Sharp"]})
case("WRK-10-slim", "WRK-10", "the same flannel over slim black jeans: workwear's legs start at straight, so it's charged",
     Rd(top("flannel_shirt", "red", 4, pattern="checks_plaid", saturation="muted"), SLJEANS, BOOTS),
     {"detected_has": ["workwear"], "fired": [F(PB1, "proportions", -1.5)], "band_in": ["Getting there", "Put together"]})

# ===== Vintage sport (VSP) ===========================================================================================
VS = Rd(top("jersey", "green"), DJEANS, RETRO)
case("VSP-1-reads", "VSP-1", "a green football jersey, dark straight jeans, retro runners: vintage sport", VS,
     {"detected_has": ["vintage_sport"], "label": "vintage_sport", "band": "Put together"})
case("VSP-1-rugby", "VSP-1", "a rugby shirt with jeans and low-profile sneakers: vintage sport",
     Rd(top("rugby_shirt", "navy", pattern="stripes"), DJEANS, LOWP), {"detected_has": ["vintage_sport"], "band": "Put together"})
case("VSP-1-nohero", "VSP-1", "a plain tee, jeans and retro runners: no hero piece, not vintage sport",
     Rd(TEE, DJEANS, RETRO), {"detected_lacks": ["vintage_sport"], "band": "Put together"})
case("VSP-2-against", "VSP-2", "a jersey with straight jeans and chunky sneakers: the shoe is against it",
     Rd(top("jersey", "green"), DJEANS, CHUNKY), {"detected_lacks": ["vintage_sport"], "band": "Put together"})
case("VSP-3-kit", "VSP-3", "a jersey with gym shorts: a full kit, never vintage sport",
     Rd(top("jersey", "green"), bottom("athletic_shorts", "black", "straight", "na"), RETRO),
     {"detected_lacks": ["vintage_sport"], "band": "Needs a fix"})
case("VSP-4-prep", "VSP-4", "a rugby shirt with chinos and loafers: the bottom decides, classic prep",
     Rd(top("rugby_shirt", "navy", pattern="stripes"), CHINOS, LOAFER),
     {"detected_lacks": ["vintage_sport"], "detected_has": ["classic_prep"], "label": "classic_prep", "band_in": ["Put together", "Sharp"]})
case("VSP-5-shoe", "VSP-5", "the jersey fit: retro runners are the look's shoe, +0.5", VS,
     {"fired": [F("SC_chosen_for_look", "shoes", 0.5)], "band": "Put together"})
case("VSP-5-reads", "VSP-5", "the jersey fit: reads as vintage sport (+0.5), never top to toe", VS,
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5)], "not_fired": [F("H2_clear_top_to_toe")], "band": "Put together"},
     kd="KD-4")
case("VSP-6-sweats", "VSP-6", "a jersey with joggers and retro runners: no loungewear hold", Rd(top("jersey", "green"), JOG, RETRO),
     {"ceiling": None, "band_in": ["Put together", "Sharp"]})
case("VSP-6-tee", "VSP-6", "a plain tee with the same joggers and runners: held to 6.5", Rd(TEE, JOG, RETRO),
     {"ceiling": 6.5, "band": "Getting there"}, vs={"case": "VSP-6-sweats", "overall": "down"})
case("VSP-7-track", "VSP-7", "a track jacket over jeans (a future reading value): the short jacket, +1.5",
     Rd(TEE, outer("track_jacket", "navy"), DJEANS, RETRO),
     {"fired": [F("PR2_short_layer", "proportions", 1.5)], "detected_has": ["vintage_sport"], "band_in": ["Put together", "Sharp"]},
     future=["track_jacket"])

case("VSP-8-slim", "VSP-8", "a roomy jersey over slim black jeans with retro runners: vintage sport's legs start at straight, -1.5",
     Rd(top("jersey", "green", 4), SLJEANS, RETRO), {"detected_has": ["vintage_sport"], "fired": [F(PB1, "proportions", -1.5)],
                                                     "band_in": ["Getting there", "Put together"]})
case("VSP-8-straight", "VSP-8", "the same jersey over dark straight jeans: inside its band, no charge",
     Rd(top("jersey", "green", 4), DJEANS, RETRO), {"detected_has": ["vintage_sport"], "not_fired": [F(PB1)],
                                                    "band_in": ["Put together", "Sharp"]})

# ===== Outdoor (OUT) =================================================================================================
OD = Rd(TEE, outer("shell_jacket", "orange"), bottom("cargos", "olive", "straight"), LOWP)
case("OUT-1-reads", "OUT-1", "an orange shell over a tee, olive cargos, low-profile sneakers: outdoor", OD,
     {"detected_has": ["outdoor"], "label": "outdoor", "band": "Put together"})
case("OUT-1-fleece", "OUT-1", "a fleece with dark jeans and work boots: nothing outdoor below the waist, and boots count against it",
     Rd(top("fleece", "grey"), DJEANS, BOOTS), {"detected_lacks": ["outdoor"], "band": "Put together"})
case("OUT-2-veto", "OUT-2", "a fleece with trousers and loafers: never outdoor",
     Rd(top("fleece", "grey"), TROUSERS, LOAFER), {"detected_lacks": ["outdoor"], "band_in": ["Getting there", "Put together"]})
case("OUT-3-runners", "OUT-3", "the shell outfit with running shoes: not charged as gym shoes",
     Rd(TEE, outer("shell_jacket", "orange"), bottom("cargos", "olive", "straight"), RUNNER),
     {"detected_has": ["outdoor"], "not_fired": [F("SK2_runners")], "band": "Put together"})
case("OUT-3-other", "OUT-3", "running shoes with a tee and jeans (not outdoor): Shoes 5.0", Rd(TEE, DJEANS, RUNNER),
     {"fired": [F("SK2_runners", "shoes")], "part": {"shoes": {"score": 5.0}}, "band": "Getting there"})
case("OUT-4-live", "OUT-4", "the shell outfit with low-profile sneakers: no outdoor shape (it needs trail shoes)", OD,
     {"not_fired": [F("PR6_outdoor_shape")], "band": "Put together"})
case("OUT-4-trail", "OUT-4", "the shell over cargos with trail shoes (a future reading value): the outdoor shape, +0.5",
     Rd(TEE, outer("shell_jacket", "orange"), bottom("cargos", "olive", "straight"), shoe("trail_shoe", "grey")),
     {"fired": [F("PR6_outdoor_shape", "proportions", 0.5)], "band_in": ["Put together", "Sharp"]}, future=["trail_shoe"])
case("OUT-5-reads", "OUT-5", "the shell outfit reads as outdoor (+0.5), never top to toe", OD,
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5)], "not_fired": [F("H2_clear_top_to_toe")], "band": "Put together"},
     kd="KD-4")
case("OUT-6-workwear", "OUT-6", "a shell over a flannel with cargos and suede chukkas: workwear and outdoor both fit; the technical layer makes it outdoor",
     Rd(top("flannel_shirt", "navy", pattern="checks_plaid"), outer("shell_jacket", "black"),
        bottom("cargos", "olive", "straight"), CHUKKA),
     {"detected_has": ["outdoor", "workwear"], "label": "outdoor", "band_in": ["Put together", "Sharp"]})

case("OUT-7-slim", "OUT-7", "a roomy fleece over slim olive cargos with low-profile sneakers: outdoor's band runs slim to wide, no charge",
     Rd(top("fleece", "green", 4), bottom("cargos", "olive", "slim"), LOWP), {"detected_has": ["outdoor"], "not_fired": [F(PB1)],
                                                                            "band_in": ["Put together", "Sharp"]})
case("OUT-7-jeans", "OUT-7", "the same fleece over slim black jeans: nothing outdoor below the waist, so no look holds the room, -1.5",
     Rd(top("fleece", "green", 4), SLJEANS, LOWP), {"detected_lacks": ["outdoor"], "fired": [F(PB1, "proportions", -1.5)],
                                                    "band_in": ["Getting there", "Put together"]})

# ===== Minimal (MIN) =================================================================================================
MN = Rd(top("sweater", "black"), WTROUSERS, LOAFER_BK)
case("MIN-1-reads", "MIN-1", "black sweater, charcoal wide trousers, black loafers: minimal", MN,
     {"detected_has": ["minimalist"], "label": "minimalist", "band": "Put together"})
case("MIN-1-wash", "MIN-1", "the same sweater with mid-wash wide jeans and white sneakers: mid-wash denim is never minimal",
     Rd(top("sweater", "black"), WJEANS, WLS), {"detected_lacks": ["minimalist"], "band": "Put together"})
case("MIN-1-bright", "MIN-1", "a red sweater with charcoal wide trousers: a bright piece isn't minimal",
     Rd(top("sweater", "red"), WTROUSERS, LOAFER_BK), {"detected_lacks": ["minimalist"], "band": "Put together"})
case("MIN-2-boxy", "MIN-2", "a boxy white tee at the belt over black straight jeans and white sneakers: minimal",
     Rd(top("tee", "white", 4, length="at_belt"), bottom("jeans", "black", "straight"), WLS),
     {"detected_has": ["minimalist"], "band_in": ["Put together", "Sharp"]})
case("MIN-2-against", "MIN-2", "the minimal outfit with chunky sneakers: against it, and no longer minimal",
     Rd(top("sweater", "black"), WTROUSERS, CHUNKY), {"detected_lacks": ["minimalist"], "band_in": ["Getting there", "Put together"]})
case("MIN-3-graphic", "MIN-3", "a graphic print anywhere rules minimal out",
     Rd(top("graphic_tee", "black"), WTROUSERS, LOAFER_BK), {"detected_lacks": ["minimalist"], "band": "Getting there"})
case("MIN-3-collar", "MIN-3", "a regular oxford over straight chinos: smart casual's, not minimal",
     Rd(top("oxford_shirt", "white"), CHINOS, LOAFER), {"detected_lacks": ["minimalist"], "band": "Put together"})
case("MIN-3-blazer", "MIN-3", "a blazer rules minimal out", Rd(top("sweater", "black"), outer("blazer", "black"), WTROUSERS, LOAFER_BK),
     {"detected_lacks": ["minimalist"], "band_in": ["Put together", "Sharp"]})
case("MIN-4-tuck", "MIN-4", "the black sweater tucked into wide trousers with loafers: the waist break reaches 8",
     Rd(top("sweater", "black", tucked="full"), WTROUSERS, LOAFER_BK),
     {"fired": [F("PR1_waist_break", "proportions", 1.5)], "overall": 8.0, "band": "Sharp"})
case("MIN-5-reads", "MIN-5", "the minimal outfit: reads as minimal (+0.5), never top to toe", MN,
     {"fired": [F("H1_reads_as_style", "cohesion", 0.5)], "not_fired": [F("H2_clear_top_to_toe")], "band": "Put together"},
     kd="KD-4")
case("MIN-5-shoe", "MIN-5", "the minimal outfit: loafers are the look's shoe, +0.5", MN,
     {"fired": [F("SC_chosen_for_look", "shoes", 0.5)], "band": "Put together"})
case("MIN-6-cityboy", "MIN-6", "a boxy tee over wide black trousers with loafers: allowed, and it earns the waist",
     Rd(top("tee", "white", 4, length="at_belt"), mod(WTROUSERS, color_family="black"), LOAFER_BK),
     {"not_fired": [F("SX1_another_look")], "fired": [F("PR1_waist_break", "proportions", 1.5)], "band": "Sharp"})
case("MIN-6-trousers", "MIN-6", "an oversized tee at mid-fly over straight charcoal trousers with loafers: city boy, no charge",
     Rd(BIGTEE, CTROUSERS, LOAFER_BK), {"detected_has": ["minimalist"], "not_fired": [F(PB1), F("SX1_another_look")],
                                         "band": "Put together"})
case("MIN-7-crossing", "MIN-7", "a graphic tee with wide trousers and loafers: a piece from another look, -3.0",
     Rd(top("graphic_tee", "black"), WTROUSERS, LOAFER_BK), {"fired": [F("SX1_another_look", "cohesion", -3.0)],
                                                             "band": "Getting there"})
case("MIN-7-tip", "MIN-7", "a graphic tee with chinos and white sneakers: only a tip", Rd(top("graphic_tee", "black"), CHINOS, WLS),
     {"tips": [F("SX1_tip", "cohesion")], "not_fired": [F("SX1_another_look")], "band": "Put together"})
case("MIN-8-tonal", "MIN-8", "all black in a minimal outfit: no points for the tonal look, just a tip",
     Rd(top("sweater", "black"), bottom("trousers", "black", "wide"), LOAFER_BK),
     {"tips": [F("CP3_tonal_flat", "color")], "part": {"color": {"score": 7.0}}, "band": "Put together"}, kd="KD-6")

# ===== Classic prep (PRP) ============================================================================================
PREP = Rd(top("cardigan", "navy"), top("oxford_shirt", "white"), CHINOS, LOAFER)
case("PRP-1-reads", "PRP-1", "a navy cardigan over a white oxford, khaki chinos, loafers: classic prep", PREP,
     {"detected_has": ["classic_prep"], "label": "classic_prep", "band": "Put together"})
case("PRP-1-plain", "PRP-1", "a white oxford, chinos and loafers: prep fits, but with no prep marker the label is smart casual",
     Rd(top("oxford_shirt", "white"), CHINOS, LOAFER), {"detected_has": ["classic_prep", "smart_casual"], "label": "smart_casual",
                                                        "band": "Put together"})
case("PRP-2-hoodie", "PRP-2", "a hoodie with chinos and loafers, no jacket: never prep",
     Rd(top("hoodie", "navy"), CHINOS, LOAFER), {"detected_lacks": ["classic_prep"], "band": "Put together"})
case("PRP-2-hoodie-blazer", "PRP-2", "the same hoodie under a blazer: prep again",
     Rd(top("hoodie", "grey"), outer("blazer", "navy"), CHINOS, LOAFER), {"detected_has": ["classic_prep"], "band_in": ["Put together", "Sharp"]})
case("PRP-2-boots", "PRP-2", "an oxford and chinos with work boots: never prep",
     Rd(top("oxford_shirt", "white"), CHINOS, BOOTS), {"detected_lacks": ["classic_prep"], "band_in": ["Put together", "Sharp"]})
case("PRP-2-boxy", "PRP-2", "a roomy polo with chinos and loafers: never prep",
     Rd(top("polo", "navy", 4), CHINOS, LOAFER), {"detected_lacks": ["classic_prep"], "band": "Put together"})
case("PRP-3-tailored", "PRP-3", "a navy blazer over a tucked oxford with grey trousers and loafers: the tailored line, +1.0",
     Rd(top("oxford_shirt", "light_blue", tucked="full"), outer("blazer", "navy"), TROUSERS, LOAFER),
     {"fired": [F("PR3_tailored_line", "proportions", 1.0)], "band_in": ["Put together", "Sharp"]})
case("PRP-4-marker", "PRP-4", "the cardigan outfit: reads as prep (+0.5) and is still top to toe (+0.5): its pieces are smart casual's signature pieces",
     PREP, {"label": "classic_prep", "fired": [F("H1_reads_as_style", "cohesion", 0.5), F("H2_clear_top_to_toe", "cohesion", 0.5)],
            "part": {"cohesion": {"score": 8.0}}, "band": "Put together"})
case("PRP-4-nomarker", "PRP-4", "the plain oxford outfit (labelled smart casual): the same Style and score as with the cardigan",
     Rd(top("oxford_shirt", "white"), CHINOS, LOAFER), {"label": "smart_casual", "fired": [F("H2_clear_top_to_toe", "cohesion", 0.5)],
                                                        "part": {"cohesion": {"score": 8.0}}, "band": "Put together"},
     vs={"case": "PRP-4-marker", "parts": {"cohesion": 0.0}, "overall": 0.0})
case("PRP-4-pink", "PRP-4", "a pink oxford (a colored collar: prep) with chinos and loafers: named prep, top to toe too",
     Rd(top("oxford_shirt", "pink"), CHINOS, LOAFER), {"label": "classic_prep", "fired": [F("H2_clear_top_to_toe", "cohesion", 0.5)],
                                                       "not_fired": [F("CP1_standout_color")], "overall": 7.5, "band": "Put together"})
case("PRP-5-crossing", "PRP-5", "an oversized hoodie with slim chinos and loafers: a piece from another look, -3.0",
     Rd(top("hoodie", "navy", 4), SLCHINOS, LOAFER), {"fired": [F("SX1_another_look", "cohesion", -3.0)], "band": "Getting there"})
case("PRP-5-jeans", "PRP-5", "a blazer over an oxford with light-wash jeans: another world, -1.5",
     Rd(top("oxford_shirt", "white"), outer("blazer", "navy"), bottom("jeans", "denim_light", "straight"), LOAFER),
     {"fired": [F("H3_another_world", "cohesion", -1.5)], "band_in": ["Getting there", "Put together"]})

# ===== Smart casual (SMC) ============================================================================================
case("SMC-1-reads", "SMC-1", "a navy quarter-zip over chinos with Chelsea boots: smart casual",
     Rd(top("quarter_zip", "navy"), CHINOS, shoe("chelsea_boot", "brown")), {"detected_has": ["smart_casual"], "band": "Put together"})
case("SMC-1-jeans", "SMC-1", "an overshirt over a tee with dark jeans and white leather sneakers: smart casual",
     Rd(TEE, outer("overshirt", "olive"), DJEANS, WLS), {"detected_has": ["smart_casual"], "label": "smart_casual", "band": "Put together"})
case("SMC-2-veto", "SMC-2", "a hoodie with chinos and loafers: never smart casual", Rd(top("hoodie", "navy"), CHINOS, LOAFER),
     {"detected_lacks": ["smart_casual"], "band": "Put together"})
case("SMC-2-logo", "SMC-2", "a polo with a big logo: never smart casual", Rd(top("polo", "navy", logo="large"), CHINOS, WLS),
     {"detected_lacks": ["smart_casual"], "band": "Put together"})
case("SMC-2-suit", "SMC-2", "a matching suit isn't smart casual (it's judged as a suit)", SUIT,
     {"detected_lacks": ["smart_casual"], "band_in": ["Put together", "Sharp"]})
case("SMC-3-tie", "SMC-3", "a sweater over wide trousers with loafers reads both minimal and smart casual: smart casual loses the tie",
     MN, {"detected_has": ["minimalist", "smart_casual"], "label": "minimalist", "band": "Put together"})
case("SMC-4-toe", "SMC-4", "a navy polo, chinos and white leather sneakers: smart casual top to toe, +0.5", POLO,
     {"fired": [F("H2_clear_top_to_toe", "cohesion", 0.5)], "part": {"cohesion": {"score": 8.0}}, "band": "Put together"})
case("SMC-4-tuck", "SMC-4", "the same polo tucked into the straight chinos: the waist break (+0.5) as well, 8.0",
     Rd(top("polo", "navy", tucked="full"), CHINOS, WLS), {"fired": [F("PR1_waist_break", "proportions", 0.5)], "overall": 8.0,
                                                           "band": "Sharp"})
case("SMC-5-crossing", "SMC-5", "a graphic tee with chinos and derbies: a piece from another look, -3.0",
     Rd(top("graphic_tee", "black"), CHINOS, DERBY), {"fired": [F("SX1_another_look", "cohesion", -3.0)], "band": "Getting there"})
case("SMC-5-interview", "SMC-5", "white sneakers under a blazer at an interview: held to 7.0",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "navy"), TROUSERS, WLS),
     {"ceiling": 7.0, "band_in": ["Getting there", "Put together"]}, occasion="interview")

case("SMC-6-slim", "SMC-6", "a roomy oxford over slim chinos with loafers: smart casual's band stops at regular, -1.5 (and the slim leg -1.0)",
     Rd(top("oxford_shirt", "light_blue", 4), SLCHINOS, LOAFER), {"detected_has": ["smart_casual"],
                                                                 "fired": [F(PB1, "proportions", -1.5), F("PN1_narrow_leg", "proportions", -1.0)],
                                                                 "overall": 6.5, "band": "Getting there"})
case("SMC-6-chinos", "SMC-6", "the same oxford over straight chinos: full-leg pressed trousers carry it, no charge",
     Rd(top("oxford_shirt", "light_blue", 4), CHINOS, LOAFER), {"not_fired": [F(PB1), F("PN1_narrow_leg")], "band": "Put together"},
     vs={"case": "SMC-6-slim", "parts": {"proportions": 2.5}})

# ===== No clear style (GEN) ==========================================================================================
case("GEN-1-none", "GEN-1", "a grey sweater, wide light-wash jeans and white leather sneakers: no style, judged by the shared rules",
     Rd(top("sweater", "grey"), bottom("jeans", "denim_light", "wide", "cuffed"), WLS),
     {"label": None, "part": {"cohesion": {"score": 7.0}, "proportions": {"score": 7.0}, "fit": {"score": 7.0}},
      "band": "Put together"})
case("GEN-2-wide", "GEN-2", "the same outfit: wide legs cost nothing without a style",
     Rd(top("sweater", "grey"), bottom("jeans", "denim_light", "wide", "cuffed"), WLS),
     {"not_fired": [F("PF5_big_top_skinny_leg"), F(PB1)], "overall": 7.0, "band": "Put together"})
case("GEN-3-shapes", "GEN-3", "a leather jacket over a sweater with light-wash straight jeans and white sneakers (no style): the shape credits still apply",
     Rd(top("sweater", "grey"), outer("leather_jacket", "black"), bottom("jeans", "denim_light", "straight"), WLS),
     {"label": None, "fired": [F("PR2_short_layer", "proportions", 1.5)], "band_in": ["Put together", "Sharp"]})
case("GEN-2-roomy", "GEN-2", "an oversized tee over wide black jeans with white leather sneakers: the room reads as streetwear, no charge",
     Rd(top("tee", "white", 4), bottom("jeans", "black", "wide", "cuffed"), WLS),
     {"detected_has": ["streetwear"], "not_fired": [F(PB1)], "part": {"proportions": {"score": 7.0}}, "band": "Put together"})
case("GEN-2-slim", "GEN-2", "an oversized tee over slim jeans with no style: the general band charges the room ([PRO-11])",
     Rd(top("tee", "white", 4), SLJEANS, WLS),
     {"label": None, "fired": [F(PB1, "proportions", -1.5)], "not_fired": [F("PF5_big_top_skinny_leg")], "band": "Getting there"})


# --------------------------------------------------------------------------------------------- checking
def schema_problems(reading, future):
    props = SCHEMA["properties"]["garments"]["items"]["properties"]
    scene = SCHEMA["properties"]["scene"]["properties"]
    out = []
    for k, v in reading["scene"].items():
        if "enum" in scene.get(k, {}) and v not in scene[k]["enum"]:
            out.append(f"scene.{k}={v}")
    for g in reading["garments"]:
        for k, v in g.items():
            if k not in props:
                out.append(f"unknown field {k}")
            elif "enum" in props[k] and v not in props[k]["enum"] and v not in future:
                out.append(f"{k}={v}")
    return out


def run(c):
    return P.score_parts(c["reading"], c["occasion"], dict(c["styles"]), c["second_look"], c["boldness"])


def reasons(r, part=None):
    out = []
    for k, p in (r.get("parts") or {}).items():
        if part is None or k == part:
            out += [(k, x) for x in p.get("reasons", [])]
    return out


def tips(r, part=None):
    out = []
    for k, p in (r.get("parts") or {}).items():
        if part is None or k == part:
            out += [(k, x) for x in p.get("tips", [])]
    return out


EPS = 1e-6


def check(c, r, results):
    """The assertion rules (mirrored line for line in rulesConformance.test.ts). Returns a list of failures."""
    e, bad = c["expect"], []
    ov = r.get("overall")
    if "unscored" in e:
        if ov is not None or r.get("reason") != e["unscored"]:
            bad.append(f"unscored: want {e['unscored']}, got overall {ov} reason {r.get('reason')}")
        return bad
    if ov is None:
        return [f"unscored ({r.get('reason')})"]
    if "overall" in e and abs(ov - e["overall"]) > EPS:
        bad.append(f"overall {ov} != {e['overall']}")
    if "overall_max" in e and ov > e["overall_max"] + EPS:
        bad.append(f"overall {ov} > {e['overall_max']}")
    if "band" in e and band_of(ov) != e["band"]:
        bad.append(f"band {band_of(ov)} ({ov}) != {e['band']}")
    if "band_in" in e and band_of(ov) not in e["band_in"]:
        bad.append(f"band {band_of(ov)} ({ov}) not in {e['band_in']}")
    for f in e.get("fired", []):
        hits = [x for _, x in reasons(r, f.get("part")) if x["check"] == f["check"]]
        if not hits:
            bad.append(f"{f['check']} didn't fire" + (f" on {f['part']}" if "part" in f else ""))
        elif "points" in f and not any(abs(x["points"] - f["points"]) < EPS for x in hits):
            bad.append(f"{f['check']} moved {[x['points'] for x in hits]}, want {f['points']}")
    for f in e.get("not_fired", []):
        if any(x["check"] == f["check"] for _, x in reasons(r, f.get("part"))):
            bad.append(f"{f['check']} fired")
    for f in e.get("tips", []):
        if not any(x["check"] == f["check"] for _, x in tips(r, f.get("part"))):
            bad.append(f"tip {f['check']} missing")
    for f in e.get("tips_lacks", []):
        if any(x["check"] == f["check"] for _, x in tips(r, f.get("part"))):
            bad.append(f"tip {f['check']} present")
    for k, want in e.get("part", {}).items():
        p = (r.get("parts") or {}).get(k) or {}
        if want.get("na"):
            if p.get("score") is not None:
                bad.append(f"{k} scored {p.get('score')}, want NA")
        elif "score" in want and (p.get("score") is None or abs(p["score"] - want["score"]) > EPS):
            bad.append(f"{k} {p.get('score')} != {want['score']}")
    det = r.get("detected_styles") or []
    for s in e.get("detected_has", []):
        if s not in det:
            bad.append(f"{s} not detected ({det})")
    for s in e.get("detected_lacks", []):
        if s in det:
            bad.append(f"{s} detected ({det})")
    if "label" in e and r.get("style_label") != e["label"]:
        bad.append(f"label {r.get('style_label')} != {e['label']}")
    if "label_in" in e and r.get("style_label") not in e["label_in"]:
        bad.append(f"label {r.get('style_label')} not in {e['label_in']}")
    occ = r.get("occasion") or {}
    if "ceiling" in e:
        got = occ.get("ceiling")
        if (got is None) != (e["ceiling"] is None) or (got is not None and abs(got - e["ceiling"]) > 1e-3):
            bad.append(f"ceiling {got} != {e['ceiling']}")
    if "occ_deduction" in e and abs((occ.get("deduction") or 0) - e["occ_deduction"]) > 1e-3:
        bad.append(f"occasion deduction {occ.get('deduction')} != {e['occ_deduction']}")
    for s in e.get("occ_lines_has", []):
        if not any(s in ln for ln in occ.get("lines", [])):
            bad.append(f"occasion line '{s}' missing ({occ.get('lines')})")
    for s in e.get("occ_lines_lacks", []):
        if any(s in ln for ln in occ.get("lines", [])):
            bad.append(f"occasion line '{s}' present ({occ.get('lines')})")
    if "cond_deduction" in e and abs((r.get("condition") or {}).get("deduction", 0) - e["cond_deduction"]) > 1e-3:
        bad.append(f"condition {(r.get('condition') or {}).get('deduction')} != {e['cond_deduction']}")
    if "cond_tips" in e and [t["check"] for t in (r.get("condition") or {}).get("tips", [])] != e["cond_tips"]:
        bad.append(f"condition tips {[t['check'] for t in (r.get('condition') or {}).get('tips', [])]} != {e['cond_tips']}")
    if "floored" in e and bool(r.get("floored")) != e["floored"]:
        bad.append(f"floored {r.get('floored')} != {e['floored']}")
    if "bonus" in e and abs((r.get("earned_bonus") or 0) - e["bonus"]) > EPS:
        bad.append(f"bonus {r.get('earned_bonus')} != {e['bonus']}")
    if "penalty" in e and abs((r.get("piled_penalty") or 0) - e["penalty"]) > EPS:
        bad.append(f"penalty {r.get('piled_penalty')} != {e['penalty']}")
    vs = c.get("vs")
    if vs:
        b = results[vs["case"]]
        for k, d in (vs.get("parts") or {}).items():
            a, z = (r["parts"][k]["score"], b["parts"][k]["score"])
            if a is None or z is None:
                bad.append(f"vs {vs['case']}: {k} is NA")
            elif abs((a - z) - d) > EPS:
                bad.append(f"vs {vs['case']}: {k} moved {a - z:+.3f}, want {d:+.3f}")
        want = vs.get("overall")
        if want is not None:
            delta = r["overall"] - b["overall"]
            ok = {"up": delta > EPS, "down": delta < -EPS, "same": abs(delta) < EPS}.get(want) if isinstance(want, str) \
                else abs(delta - want) < EPS
            if not ok:
                bad.append(f"vs {vs['case']}: overall moved {delta:+.1f}, want {want}")
    return bad


def snapshot(r):
    if r.get("overall") is None:
        return {"overall": None, "reason": r.get("reason")}
    return {"overall": r["overall"], "raw_score": r["raw_score"],
            "parts": {k: v["score"] for k, v in r["parts"].items()},
            "detected_styles": r["detected_styles"], "style_label": r["style_label"]}


def main():
    ids = [c["id"] for c in CASES]
    assert len(ids) == len(set(ids)), "duplicate case ids"
    if "--show" in sys.argv:
        c = next(c for c in CASES if c["id"] == sys.argv[sys.argv.index("--show") + 1])
        print(json.dumps(run(c), indent=1, default=str))
        return 0
    results, fails = {}, 0
    for c in CASES:
        r = run(c)
        results[c["id"]] = r
        probs = schema_problems(c["reading"], set(c["future"]))
        undeclared = {v for g in c["reading"]["garments"] for v in g.values() if v in FUTURE_VALUES} - set(c["future"])
        bad = check(c, r, results)
        if probs:
            bad.append(f"not in the live reading: {probs}")
        if c["occasion"] not in APP_OCCASIONS:
            bad.append(f"occasion {c['occasion']} isn't one the app offers")
        if undeclared:
            bad.append(f"future values not declared: {sorted(undeclared)}")
        e = c["expect"]
        if not ({"band", "band_in", "unscored"} & set(e)):
            bad.append("no band assertion")
        tag = "PASS" if not bad else "FAIL"
        if bad:
            fails += 1
            print(f"{tag} {c['rule']} {c['id']}: {c['what']}\n     " + "\n     ".join(bad))
    rules = sorted({c["rule"] for c in CASES})
    doc = set(re.findall(r"\*\*\[([A-Z]{3}-\d+)\]", DOC.read_text()))
    if doc != set(rules):
        fails += 1
        print(f"FAIL the doc and the cases disagree: rules with no case {sorted(doc - set(rules))}, "
              f"cases for rules not in the doc {sorted(set(rules) - doc)}")
    print(f"{len(CASES) - fails}/{len(CASES)} cases pass, {len(rules)} rule IDs covered")
    if fails:
        return 1
    data = json.loads((K / "handoff/fixtures/parts.json").read_text())
    out = {"about": "Rules conformance: one or more made-up outfits per rule ID in rubric/v5-styles.md. Generated by "
                    "extraction-test/rules_conformance.py from parts_proto.py; read by "
                    "app/packages/kitted-core/test/rulesConformance.test.ts. Never edit by hand.",
           "parts_version": data["version"], "engine": data["engine"], "bands": BANDS,
           "counts": {"cases": len(CASES), "rules": len(rules)}, "rules": rules,
           "cases": [dict(c, python=snapshot(results[c["id"]])) for c in CASES]}
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(K)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
