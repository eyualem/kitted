#!/usr/bin/env python3
"""Rules conformance (Oct 11, 2026; DECISIONS-LOG #216, v6 rules #217; v8 rules Oct 12, #228; v9 rules Oct 12, #232; v10 and v11 rules Oct 13; v12 and v13 rules Oct 14). One or
more made-up outfits per rule ID in ../rubric/v5-styles.md, each asserting that the rule works in the parts engine
(parts_proto.py, default v14; v14 rules Oct 17): the
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
import copy
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402
sys.path.insert(0, str(HERE.parent / "handoff" / "fixtures"))
import parts_fixes as PF  # noqa: E402  (v10: the fix engine's no-points tips, `fix_tip`)

OUT = K / "handoff" / "fixtures" / "rules_conformance.json"
DOC = K / "rubric" / "v5-styles.md"   # every **[ID]** defined there must have a case here, and the other way round
SCHEMA = json.loads((HERE / "schema.json").read_text())
APP_OCCASIONS = {"everyday", "class", "date", "going_out", "interview", "event", "gym", "home"}   # app/src/data/types.ts
FUTURE_VALUES = {"trail_shoe", "vest", "track_jacket", "track_pants", "work_pants", "technical_pants", "denim_shirt"}
BANDS = [(5.5, "Needs a fix"), (6.5, "Getting there"), (7.5, "Put together"), (8.5, "Sharp"), (10.0, "Dialed in")]
# v16 (T69): 3.0-9.5 in six bands; 3-4.5 has its own word (the founder's "Start fresh", Q-W1)
BANDS_V16 = [(4.5, "Start fresh"), (5.5, "Needs a fix"), (6.5, "Getting there"), (7.5, "Put together"), (8.5, "Sharp"), (9.5, "Dialed in")]


def band_of(x, c=None):
    return next(name for top, name in (BANDS_V16 if c and c.get("engine") == "v16" else BANDS) if x <= top)


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
         vs=None, future=None, kd=None, engine="v15", season=None, graded_look=None):
    c = {"id": cid, "rule": rule, "what": what, "reading": reading, "occasion": occasion,
         "styles": [list(p) for p in (styles or [])], "boldness": boldness, "second_look": second_look,
         "expect": expect, "vs": vs, "future": sorted(future or []), "kd": kd}
    if engine != "v15":                       # T69: a v16 case names its engine, season and graded look (v15's stay as they were)
        c.update(engine=engine, season=season, graded_look=graded_look)
    CASES.append(c)


def case16(cid, rule, what, reading, expect, **kw):
    case(cid, rule, what, reading, expect, engine="v16", **kw)


F = lambda check, part=None, points=None, line=None: {k: v for k, v in (("check", check), ("part", part), ("points", points),
                                                                       ("line", line)) if v is not None}

# ===== How a score is made (SCO) =====================================================================================
case("SCO-1-plain", "SCO-1", "plain white tee, dark straight jeans, white leather sneakers: every part starts at 7 (v14: the "
     "matching shoes make Shoes 7.5 and, with nothing off, the pieces go together on Style, [STY-12])",
     Rd(TEE, DJEANS, WLS),
     {"overall": 7.0, "band": "Put together",
      "part": {"proportions": {"score": 7.0}, "fit": {"score": 7.0}, "color": {"score": 7.0}, "cohesion": {"score": 7.5},
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
case("SCO-6-ignored", "SCO-6", "a belt, a watch and an unsure accessory change nothing",
     Rd(TEE, DJEANS, WLS, acc("belt"), acc("watch"), mod(acc("hat"), certainty="unsure")),
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
case("PRO-1-shorts", "PRO-1", "shorts: Proportions is scored like pants since v14, and plain shorts start at 7",
     Rd(TEE, bottom("shorts", "khaki_beige", "straight", "na"), WLS),
     {"part": {"proportions": {"score": 7.0}}, "band": "Put together"})
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
case("PRO-4-open-shirt-out", "PRO-4", "a check flannel worn open over a navy tee, untucked, over relaxed light jeans: no waist break",
     Rd(top("tee", "navy"), outer("flannel_shirt", "tan_camel", 4, pattern="checks_plaid", length="mid_fly", tucked="none"),
        bottom("jeans", "denim_light", "relaxed", volume=4), WLS), {"not_fired": [F("PR1_waist_break")], "overall": 7.0, "band": "Put together"})
case("PRO-4-open-shirt", "PRO-4", "v14 (#336): the same open flannel and tee, both tucked in: the tucked shirt sets the waist, +1.5",
     Rd(top("tee", "navy", tucked="full", length="na"),
        outer("flannel_shirt", "tan_camel", 4, pattern="checks_plaid", length="na", tucked="full"),
        bottom("jeans", "denim_light", "relaxed", volume=4), WLS),
     {"fired": [F("PR1_waist_break", "proportions", 1.5)], "not_fired": [F("PR2b_short_layer_read")], "overall": 7.5, "band": "Put together"},
     vs={"case": "PRO-4-open-shirt-out", "parts": {"proportions": 1.5}, "overall": "up"})
case("PRO-4-open-jacket", "PRO-4", "a chore coat read as tucked isn't a button-up: no waist break",
     Rd(top("tee", "navy", tucked="full", length="na"), outer("chore_coat", "brown", length="na", tucked="full"),
        bottom("jeans", "denim_light", "relaxed", volume=4), WLS), {"not_fired": [F("PR1_waist_break")], "overall": 7.0, "band": "Put together"})
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
case("PRO-9-little", "PRO-9", "v14: the tee shows only a little below the denim jacket: a deliberate layer, no charge, the short-jacket credit stays (#367)",
     Rd(TEE, outer("denim_jacket", "denim_light"), DJEANS, WLS),
     {"not_fired": [F("PF10_peek")], "fired": [F("PR2_short_layer")], "band": "Put together"},
     second_look={"under_present": "yes", "under_shows": "a_little"})
case("PRO-9-clearly", "PRO-9", "v14: the tee clearly hangs below the denim jacket: -0.5, and no short-jacket credit (#367)",
     Rd(TEE, outer("denim_jacket", "denim_light"), DJEANS, WLS),
     {"fired": [F("PF10_peek", "proportions", -0.5)], "not_fired": [F("PR2_short_layer")], "band": "Put together"},
     second_look={"under_present": "yes", "under_shows": "clearly"})
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
case("PRO-13-slim", "PRO-13", "a plain white tee over slim black jeans with white leather sneakers: -1.0 (v12; -0.5 in v10-v11), 'would balance better', never 'dated' (v10)",
     Rd(TEE, SLJEANS, WLS), {"fired": [F(PN1, "proportions", -1.0, line="the slim jeans would balance better with a straight leg")],
                             "part": {"proportions": {"score": 6.0}}, "overall": 7.0, "band": "Put together"})
case("PRO-13-slim-not-dated", "PRO-13", "the slim line never says 'dated' (v10)", Rd(TEE, SLJEANS, WLS),
     {"fired": [F(PN1, "proportions", -1.0, line="would balance better")], "band": "Put together"},
     vs={"case": "PRO-13-slim", "overall": "same"})
case("PRO-13-skinny", "PRO-13", "the same tee over skinny jeans: -2.0, and the card still says 'read dated'", Rd(TEE, SKJEANS, WLS),
     {"fired": [F(PN1, "proportions", -2.0, line="the skinny jeans read dated; a straight leg balances the outfit")],
      "overall": 6.5, "band": "Getting there"})
case("PRO-13-slim-ripped", "PRO-13", "slim jeans ripped by design: -1.5 (-1.0 for the leg, -0.5 for the rips), 6.5 'Getting there' (v12)",
     Rd(TEE, mod(SLJEANS, distressed_by_design=True), WLS),
     {"fired": [F(PN1, "proportions", -1.5, line="the slim ripped jeans would balance better")], "overall": 6.5, "band": "Getting there"})
case("PRO-13-ripped", "PRO-13", "skinny jeans ripped by design: -2.5", Rd(TEE, mod(SKJEANS, distressed_by_design=True), WLS),
     {"fired": [F(PN1, "proportions", -2.5)], "band": "Getting there"})
case("PRO-13-chinos", "PRO-13", "a light blue oxford over slim khaki chinos with loafers: chinos count too, -1.0",
     Rd(top("oxford_shirt", "light_blue"), SLCHINOS, LOAFER), {"fired": [F(PN1, "proportions", -1.0, line="the slim chinos would balance")],
                                                               "band": "Put together"})
# v12: a leg read straight at roominess 2 or less is judged slim (the AI calls fitted jeans "straight")
FITJEANS = bottom("jeans", "denim_mid", "straight", volume=2)
case("PRO-13-fitted", "PRO-13", "a black tee over mid-wash jeans read straight at roominess 2: judged slim, -1.0, 'the slim jeans' (v12)",
     Rd(top("tee", "black"), FITJEANS, WLS),
     {"fired": [F(PN1, "proportions", -1.0, line="the slim jeans would balance better with a straight leg")],
      "part": {"proportions": {"score": 6.0}}, "band": "Put together"})
case("PRO-13-regular", "PRO-13", "the same jeans read straight at roominess 3: a straight leg, no charge",
     Rd(top("tee", "black"), mod(FITJEANS, volume=3), WLS), {"not_fired": [F(PN1)], "part": {"proportions": {"score": 7.0}},
                                                             "band": "Put together"},
     vs={"case": "PRO-13-fitted", "parts": {"proportions": 1.0}})
case("PRO-13-fitted-tuck", "PRO-13", "a tucked black polo over the roominess-2 'straight' jeans: judged slim, so no waist break, and -1.0",
     Rd(top("polo", "black", tucked="full", length="na"), FITJEANS, WLS),
     {"fired": [F(PN1, "proportions", -1.0)], "not_fired": [F("PR1_waist_break")], "band_in": ["Getting there", "Put together"]})
case("PRO-13-fitted-relaxed", "PRO-13", "jeans read relaxed at roominess 2: only a 'straight' read is re-judged, no charge",
     Rd(top("tee", "black"), mod(FITJEANS, leg_shape="relaxed"), WLS), {"not_fired": [F(PN1)], "band": "Put together"})
case("PRO-13-fitted-joggers", "PRO-13", "joggers read straight at roominess 2: loungewear keeps its own rules, no charge",
     Rd(top("sweater", "black"), bottom("joggers", "black", "straight", "cuffed", volume=2), WLS), {"not_fired": [F(PN1)], "band": "Put together"})
case("PRO-13-fitted-blazer", "PRO-13", "grey trousers read straight at roominess 2 under a navy blazer: the norm under tailoring, no charge",
     Rd(top("dress_shirt", "white", tucked="full"), outer("blazer", "navy"), bottom("trousers", "grey", "straight", volume=2), DERBY),
     {"not_fired": [F(PN1)], "fired": [F("PR3_tailored_line", "proportions", 1.0)], "band": "Sharp"})
case("PRO-13-fitted-suit", "PRO-13", "suit trousers read straight at roominess 2: a suit's trousers are never charged",
     Rd(top("oxford_shirt", "white"), bottom("suit_trousers", "navy", "straight", "no_break", volume=2), DERBY), {"not_fired": [F(PN1)], "band": "Put together"})
case("PRO-13-fitted-chunky", "PRO-13", "chunky sneakers under the roominess-2 'straight' jeans: judged a slim leg for [SHO-9] too, -1.5 on Shoes",
     Rd(top("tee", "black"), FITJEANS, CHUNKY), {"fired": [F(PN1, "proportions", -1.0), F("SW1_chunky_narrow", "shoes", -1.5)], "band": "Getting there"})
case("PRO-13-blazer", "PRO-13", "slim grey trousers under a navy blazer over a tucked dress shirt: the norm under tailoring, no charge",
     Rd(top("dress_shirt", "white", tucked="full"), outer("blazer", "navy"), bottom("trousers", "grey", "slim"), DERBY),
     {"not_fired": [F(PN1)], "fired": [F("PR3_tailored_line", "proportions", 1.0)], "band": "Sharp"})
case("PRO-13-suit", "PRO-13", "slim suit trousers with an oxford and derbies: a suit's trousers are never charged",
     Rd(top("oxford_shirt", "white"), bottom("suit_trousers", "navy", "slim", "no_break"), DERBY),
     {"not_fired": [F(PN1)], "part": {"proportions": {"score": 7.0}}, "band": "Put together"})
case("PRO-13-joggers", "PRO-13", "slim joggers: loungewear has its own rules, no charge",
     Rd(TEE, bottom("joggers", "grey", "slim", "cuffed"), WLS), {"not_fired": [F(PN1)], "band": "Getting there"})
SKJOG = Rd(top("sweater", "black"), bottom("joggers", "black", "skinny", "cuffed"), WLS)
case("PRO-13-skinny-joggers", "PRO-13", "a black sweater over skinny black joggers with white leather sneakers at Everyday: -2.0, 'read dated' (v11)",
     SKJOG, {"fired": [F(PN1, "proportions", -2.0, line="the skinny joggers read dated; a relaxed leg balances the outfit")],
             "part": {"proportions": {"score": 5.0}}, "ceiling": 7.5, "overall": 6.5, "band": "Getting there"})
case("PRO-13-skinny-joggers-gym", "PRO-13", "the same skinny joggers at the gym: no charge", SKJOG,
     {"not_fired": [F(PN1)], "part": {"proportions": {"score": 7.0}}, "overall": 7.0, "band": "Put together"}, occasion="gym",
     vs={"case": "PRO-13-skinny-joggers", "parts": {"proportions": 2.0}})
case("PRO-13-skinny-joggers-home", "PRO-13", "the same skinny joggers at home: no charge", SKJOG,
     {"not_fired": [F(PN1)], "band": "Put together"}, occasion="home")
case("PRO-13-slim-joggers", "PRO-13", "the same sweater over slim black joggers: slim joggers are never charged",
     Rd(top("sweater", "black"), bottom("joggers", "black", "slim", "cuffed"), WLS),
     {"not_fired": [F(PN1)], "overall": 7.0, "band": "Put together"}, vs={"case": "PRO-13-skinny-joggers", "overall": "up"})
case("PRO-13-skinny-sweats-class", "PRO-13", "a tee over skinny grey sweatpants at Class: charged on Proportions, and the loungewear hold (6.5) still applies",
     Rd(TEE, bottom("sweatpants", "grey", "skinny", "cuffed"), WLS),
     {"fired": [F(PN1, "proportions", -2.0, line="the skinny sweatpants read dated")], "ceiling": 6.5, "band": "Getting there"},
     occasion="class")
case("PRO-13-skinny-joggers-interview", "PRO-13", "the skinny joggers at an interview: charged, on top of the 4.0 hold", SKJOG,
     {"fired": [F(PN1, "proportions", -2.0)], "ceiling": 4.0, "overall": 4.0, "band": "Needs a fix"}, occasion="interview")
PR2B = "PR2b_short_layer_read"
case("PRO-14-overshirt", "PRO-14", "an olive overshirt read as ending at the belt, over a tee and wide jeans: +1.0",
     Rd(TEE, outer("overshirt", "olive", length="at_belt"), WJEANS, WLS),
     {"fired": [F(PR2B, "proportions", 1.0)], "not_fired": [F("PR2_short_layer")], "band": "Sharp"})
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
case("PRO-15-shape", "PRO-15", "an oversized grey hoodie over loose gym shorts with basketball sneakers: a roomy top over loose "
     "shorts, +1.0", Rd(top("hoodie", "grey", 4), bottom("athletic_shorts", "black", "relaxed", "na", volume=4), shoe("basketball_sneaker", "white")),
     {"fired": [F("PS1_shorts_shape", "proportions", 1.0)], "band": "Sharp"}, occasion="class")
case("PRO-15-regular", "PRO-15", "the same with a regular hoodie: no shape credit", Rd(top("hoodie", "grey"),
     bottom("athletic_shorts", "black", "relaxed", "na", volume=4), shoe("basketball_sneaker", "white")),
     {"not_fired": [F("PS1_shorts_shape")], "part": {"proportions": {"score": 7.0}}, "band": "Put together"}, occasion="class")
case("PRO-15-layer", "PRO-15", "a grey bomber over a white tee with wide cream shorts and chunky sneakers: a short jacket over "
     "loose shorts, +1.0", Rd(TEE, outer("bomber", "light_grey"), bottom("shorts", "off_white_cream", "wide", "na", volume=4),
                              shoe("chunky_sneaker", "black")), {"fired": [F("PS1_shorts_layer", "proportions", 1.0)], "band": "Sharp"})
case("PRO-15-slides", "PRO-15", "the oversized hoodie over loose shorts with slides: no credit (not a real shoe)",
     Rd(top("hoodie", "grey", 4), bottom("shorts", "black", "wide", "na", volume=4), SLIDES), {"not_fired": [F("PS1_shorts_shape")],
                                                                                            "band_in": ["Needs a fix", "Getting there"]})
case("PRO-16-tight", "PRO-16", "a plain tee over short, tight khaki shorts (slim, roominess 2) with basketball sneakers: -1.0",
     Rd(TEE, bottom("shorts", "khaki_beige", "slim", "na", volume=2), shoe("basketball_sneaker", "white")),
     {"fired": [F("PS3_fitted_shorts", "proportions", -1.0)], "band": "Getting there"}, occasion="class")
case("PRO-16-roomy", "PRO-16", "an oversized hoodie over the same shorts: a roomy top over short, fitted shorts, -1.5",
     Rd(top("hoodie", "grey", 4), bottom("shorts", "khaki_beige", "slim", "na", volume=2), shoe("basketball_sneaker", "white")),
     {"fired": [F("PS2_roomy_over_fitted", "proportions", -1.5)], "not_fired": [F("PS3_fitted_shorts")],
      "band_in": ["Needs a fix", "Getting there"]}, occasion="class")
case("PRO-16-pull", "PRO-16", "a plain tee over gym shorts that clearly pull: -1.0 on Proportions, on top of Fit's charge",
     Rd(TEE, bottom("athletic_shorts", "black", "relaxed", "na", volume=4, strain="clear"), shoe("basketball_sneaker", "white")),
     {"fired": [F("PS3_fitted_shorts", "proportions", -1.0), F("FF6_strain")], "band_in": ["Needs a fix", "Getting there"]},
     occasion="class")
PR2H = "PR2h_hoodie_layer"
OCT28 = Rd(top("tee", "navy"), outer("hoodie", "green", length="na"), bottom("cargos", "olive", "straight"),
           shoe("performance_runner", "black"), mirror_selfie=True)
case("PRO-17-oct28", "PRO-17", "v15 (#385): the founder's Oct 28 re-check, a green zip hoodie over a navy tee with olive straight "
     "cargos and black runners: the hoodie layer earns +1.5, 7.0 -> 7.5 (the runners still cost on Shoes)", OCT28,
     {"fired": [F(PR2H, "proportions", 1.5, line="the hoodie layered over the tee gives it a clean shape")],
      "part": {"proportions": {"score": 8.5}, "shoes": {"score": 5.0}}, "overall": 7.5, "band": "Put together"},
     styles=[("streetwear", 0.5), ("minimalist", 0.25), ("workwear", 0.25)])
case("PRO-17-sweatshirt", "PRO-17", "a grey zip sweatshirt over a white tee, dark straight jeans, white leather sneakers: the same "
     "credit (hoodie and sweatshirt flip between reads)", Rd(TEE, outer("sweatshirt", "grey", length="na"), DJEANS, WLS),
     {"fired": [F(PR2H, "proportions", 1.5)], "overall": 7.5, "band": "Put together"})
case("PRO-17-over-hoodie", "PRO-17", "a zip hoodie over a pullover hoodie: nothing",
     Rd(top("hoodie", "grey"), outer("hoodie", "green", length="na"), DJEANS, WLS), {"not_fired": [F(PR2H)], "band": "Put together"})
case("PRO-17-over-tank", "PRO-17", "a zip hoodie over a tank top: nothing",
     Rd(top("tank_top", "white"), outer("hoodie", "green", length="na"), DJEANS, WLS), {"not_fired": [F(PR2H)], "band": "Put together"})
case("PRO-17-over-oxford", "PRO-17", "a zip hoodie over an oxford: nothing from this rule (tees only, KD-22)",
     Rd(top("oxford_shirt", "white"), outer("hoodie", "green", length="na"), DJEANS, WLS), {"not_fired": [F(PR2H)], "band": "Put together"}, kd="KD-22")
case("PRO-17-joggers", "PRO-17", "a zip hoodie over a tee with joggers at Class: loungewear blocks it ([PRO-8])",
     Rd(top("tee", "navy"), outer("hoodie", "green", length="na"), bottom("joggers", "black", "straight"), WLS),
     {"not_fired": [F(PR2H)], "band": "Getting there"}, occasion="class")
case("PRO-17-slim", "PRO-17", "a zip hoodie over a tee with slim jeans: it needs a full leg, nothing",
     Rd(top("tee", "navy"), outer("hoodie", "green", length="na"), SLJEANS, WLS), {"not_fired": [F(PR2H)], "band": "Put together"})
case("PRO-17-slides", "PRO-17", "a zip hoodie over a tee with dark jeans and slides: nothing (it reads home)",
     Rd(top("tee", "navy"), outer("hoodie", "green", length="na"), DJEANS, SLIDES), {"not_fired": [F(PR2H)], "band": "Put together"})
case("PRO-17-long", "PRO-17", "a zip hoodie read as ending past the fly over wide jeans: nothing",
     Rd(top("tee", "navy"), outer("hoodie", "green", length="below_crotch"), WJEANS, WLS), {"not_fired": [F(PR2H)], "band": "Put together"})
case("PRO-17-two-layers", "PRO-17", "a zip hoodie under a bomber: the bomber's credit ([PRO-6]), not this one",
     Rd(top("tee", "navy"), outer("bomber"), outer("hoodie", "green", length="na"), DJEANS, WLS),
     {"fired": [F("PR2_short_layer", "proportions", 1.5)], "not_fired": [F(PR2H)], "band": "Put together"})
case("PRO-17-peek", "PRO-17", "the tee clearly hangs below the zip hoodie: -0.5 and no credit ([PRO-9])",
     Rd(top("tee", "navy"), outer("hoodie", "green", length="na"), DJEANS, WLS),
     {"fired": [F("PF10_peek", "proportions", -0.5)], "not_fired": [F(PR2H)], "band": "Put together"},
     second_look={"under_present": "yes", "under_shows": "clearly", "covers_shoe": "no"})
case("PRO-17-at-belt", "PRO-17", "a zip hoodie read at the belt over wide jeans: +1.5 in [PRO-14]'s place, never both",
     Rd(top("tee", "navy"), outer("hoodie", "green", length="at_belt"), WJEANS, WLS),
     {"fired": [F(PR2H, "proportions", 1.5)], "not_fired": [F(PR2B)], "part": {"proportions": {"score": 8.5}}, "band": "Sharp"})
case("PRO-17-interview", "PRO-17", "a zip hoodie over a tee at an interview: the credit fires, the hoodie's hold still caps it at 5.0",
     Rd(top("tee", "navy"), outer("hoodie", "green", length="na"), DJEANS, WLS),
     {"fired": [F(PR2H)], "ceiling": 5.0, "overall": 5.0, "band": "Needs a fix"}, occasion="interview")

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
case("COL-5-standout", "COL-5", "one red sweater with light neutrals (khaki chinos): no credit for one bright piece",
     Rd(top("sweater", "red"), CHINOS, WLS), {"not_fired": [F("CP1_standout_color"), F("CP1_toned_down"), F("CP2_quiet_accent")],
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
case("COL-7-denim", "COL-7", "a dark denim jacket over dark jeans: no double-denim tip any more, and no points ([COL-10])",
     Rd(TEE, outer("denim_jacket", "denim_dark"), DJEANS, WLS),
     {"tips_lacks": [F("CC5_denim_near_match", "color")], "not_fired": [F("CC5_same_wash_denim")],
      "part": {"color": {"score": 7.0}}, "band_in": ["Put together", "Sharp"]})

CL1 = "CL1_loud_print"
case("COL-8-bright", "COL-8", "a bright red graphic tee with a large print, dark jeans and white leather sneakers: -1.5",
     Rd(top("graphic_tee", "red", pattern_scale="large"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "part": {"color": {"score": 5.5}},
                                                  "band": "Getting there"})
case("COL-8-logo", "COL-8", "a black graphic tee whose print is a large logo: -1.5",
     Rd(top("graphic_tee", "black", logo="large"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "band": "Put together"})
case("COL-8-tee-logo", "COL-8", "a white tee printed with a large logo: -1.5",
     Rd(top("tee", "white", pattern="graphic", logo="large"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "band": "Put together"})
FLANNEL_L = top("flannel_shirt", "navy", pattern="checks_plaid", pattern_scale="large")
case("COL-8-plaid", "COL-8", "a large-check navy flannel over a tee with khaki chinos and loafers (no look): -1.5",
     Rd(TEE, FLANNEL_L, CHINOS, LOAFER), {"fired": [F(CL1, "color", -1.5)], "detected_lacks": ["workwear", "streetwear"],
                                          "part": {"color": {"score": 5.5}}, "band": "Put together"})
case("COL-8-medium", "COL-8", "the same flannel in a medium check: fine",
     Rd(TEE, top("flannel_shirt", "navy", pattern="checks_plaid"), CHINOS, LOAFER), {"not_fired": [F(CL1)], "band": "Put together"},
     vs={"case": "COL-8-plaid", "parts": {"color": 1.5}, "overall": "same"})
case("COL-8-stripes", "COL-8", "a white oxford with large stripes: stripes are never loud",
     Rd(top("oxford_shirt", "white", pattern="stripes", pattern_scale="large"), CHINOS, LOAFER),
     {"not_fired": [F(CL1)], "band": "Put together"})
case("COL-8-bright-medium", "COL-8", "the same red tee with a medium print: still loud, -1.5 (v12)",
     Rd(top("graphic_tee", "red", pattern_scale="medium"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "band": "Getting there"})
case("COL-8-bright-small", "COL-8", "the red tee with a small chest print: not a loud print (v12); the red still counts as the one accent on the dark jeans ([COL-11], +0.5)",
     Rd(top("graphic_tee", "red", pattern_scale="small", logo="small"), DJEANS, WLS),
     {"not_fired": [F(CL1)], "fired": [F("CP1_toned_down", "color", 0.5)], "part": {"color": {"score": 7.5}}, "band": "Put together"},
     vs={"case": "COL-8-bright", "parts": {"color": 2.0}, "overall": "up"})
case("COL-8-bright-small-logo", "COL-8", "a red tee with a small print but a large logo: loud, -1.5",
     Rd(top("graphic_tee", "red", pattern_scale="small", logo="large"), DJEANS, WLS), {"fired": [F(CL1, "color", -1.5)], "band": "Getting there"})
case("COL-8-bright-nosize", "COL-8", "a bright red graphic tee whose print size wasn't read: not counted as loud (v12)",
     Rd(top("graphic_tee", "red"), DJEANS, WLS), {"not_fired": [F(CL1)], "band": "Put together"})
case("COL-8-plain", "COL-8", "a black graphic tee with a small print: fine", Rd(top("graphic_tee", "black"), DJEANS, WLS),
     {"not_fired": [F(CL1)], "part": {"color": {"score": 7.0}}, "band": "Put together"})
case("COL-8-hoodie", "COL-8", "a black hoodie with a large logo over wide jeans and chunky sneakers: streetwear's own piece, fine",
     Rd(top("hoodie", "black", pattern="graphic", logo="large"), WJEANS, CHUNKY), {"not_fired": [F(CL1)], "band": "Put together"})
# COL-9 (v9): a loud look's own loud piece isn't "loud"
case("COL-9-flannel", "COL-9", "the large-check flannel over a tee with dark jeans and work boots reads as workwear: its own piece, no charge",
     Rd(TEE, FLANNEL_L, DJEANS, BOOTS),
     {"not_fired": [F(CL1)], "detected_has": ["workwear"], "part": {"color": {"score": 7.0}}, "overall": 7.5, "band": "Put together"})
case("COL-9-bright", "COL-9", "the same flannel in bright red: a bright piece is always charged",
     Rd(TEE, mod(FLANNEL_L, color_family="red"), DJEANS, BOOTS),
     {"fired": [F(CL1, "color", -1.5)], "detected_has": ["workwear"], "band": "Put together"},
     vs={"case": "COL-9-flannel", "parts": {"color": -1.5}, "overall": "down"})
case("COL-9-boxlogo", "COL-9", "a black graphic tee with a large logo over wide jeans and chunky sneakers reads as streetwear: no charge",
     Rd(top("graphic_tee", "black", logo="large"), WJEANS, CHUNKY),
     {"not_fired": [F(CL1)], "detected_has": ["streetwear"], "part": {"color": {"score": 7.0}}, "band": "Put together"})
case("COL-9-nolook", "COL-9", "the same tee with dark straight jeans and white leather sneakers reads as nothing: charged",
     Rd(top("graphic_tee", "black", logo="large"), DJEANS, WLS),
     {"fired": [F(CL1, "color", -1.5)], "detected_lacks": ["streetwear"], "band": "Put together"})
case("COL-9-streetbright", "COL-9", "a bright red graphic tee in a streetwear outfit: still charged",
     Rd(top("graphic_tee", "red", pattern_scale="large"), WJEANS, CHUNKY),
     {"fired": [F(CL1, "color", -1.5)], "detected_has": ["streetwear"], "band": "Put together"})
case("COL-9-argyle", "COL-9", "a large-print navy sweater with chinos and loafers (a quiet look): still charged",
     Rd(top("sweater", "navy", pattern="other", pattern_scale="large"), CHINOS, LOAFER),
     {"fired": [F(CL1, "color", -1.5)], "detected_has": ["smart_casual"], "band": "Put together"})
# COL-10 (v9): double denim in the same light or mid wash
MIDJ = bottom("jeans", "denim_mid", "straight")
case("COL-10-mid", "COL-10", "a mid-wash denim jacket over mid-wash straight jeans: -1.0 on Color",
     Rd(TEE, outer("denim_jacket", "denim_mid"), MIDJ, WLS),
     {"fired": [F("CC5_same_wash_denim", "color", -1.0)], "part": {"color": {"score": 6.0}}, "band": "Put together"})
case("COL-10-light", "COL-10", "the same in light wash: -1.0",
     Rd(TEE, outer("denim_jacket", "denim_light"), bottom("jeans", "denim_light", "straight"), WLS),
     {"fired": [F("CC5_same_wash_denim", "color", -1.0)], "band": "Put together"})
case("COL-10-shirt", "COL-10", "a mid-wash denim shirt over mid-wash jeans with work boots: -1.0 (any two denim pieces)",
     Rd(TEE, top("oxford_shirt", "denim_mid"), MIDJ, BOOTS),
     {"fired": [F("CC5_same_wash_denim", "color", -1.0)], "band": "Put together"})
case("COL-10-dark", "COL-10", "dark denim on dark denim: a deliberate tonal look, free",
     Rd(TEE, outer("denim_jacket", "denim_dark"), DJEANS, WLS),
     {"not_fired": [F("CC5_same_wash_denim")], "part": {"color": {"score": 7.0}}, "band": "Put together"},
     vs={"case": "COL-10-mid", "parts": {"color": 1.0}})
case("COL-10-black", "COL-10", "a black denim jacket over black jeans: black denim is free",
     Rd(TEE, outer("denim_jacket", "black"), bottom("jeans", "black", "straight"), WLS),
     {"not_fired": [F("CC5_same_wash_denim")], "part": {"color": {"score": 7.0}}, "band_in": ["Put together", "Sharp"]})
case("COL-10-contrast", "COL-10", "a light-wash jacket over dark jeans: different washes, free, and no tip",
     Rd(TEE, outer("denim_jacket", "denim_light"), DJEANS, WLS),
     {"not_fired": [F("CC5_same_wash_denim")], "tips_lacks": [F("CC5_denim_near_match")], "part": {"color": {"score": 7.0}},
      "band": "Put together"})
case("COL-10-lightmid", "COL-10", "a light-wash jacket over mid-wash jeans: counts as different washes, free",
     Rd(TEE, outer("denim_jacket", "denim_light"), MIDJ, WLS),
     {"not_fired": [F("CC5_same_wash_denim")], "band": "Put together"})
case("COL-10-blocks", "COL-10", "it's a color fault: a green sweater's quiet-accent reward goes",
     Rd(top("sweater", "green"), outer("denim_jacket", "denim_mid"), MIDJ, WLS),
     {"fired": [F("CC5_same_wash_denim", "color", -1.0)], "not_fired": [F("CP2_quiet_accent")], "band": "Put together"})

CP1D = "CP1_toned_down"
case("COL-11-orange", "COL-11", "an orange sweater with black jeans and white leather sneakers: +0.5, the one accent on a dark base",
     Rd(top("sweater", "orange"), bottom("jeans", "black", "straight"), WLS),
     {"fired": [F(CP1D, "color", 0.5, line="the orange sweater is the one accent, toned down by the dark pieces around it")],
      "part": {"color": {"score": 7.5}}, "overall": 7.5, "band": "Put together"})
case("COL-11-dark-denim", "COL-11", "a red sweater over dark jeans: dark denim is a dark base too, +0.5",
     Rd(top("sweater", "red"), DJEANS, WLS), {"fired": [F(CP1D, "color", 0.5)], "part": {"color": {"score": 7.5}},
                                              "band": "Put together"})
case("COL-11-navy-jacket", "COL-11", "a red tee under a navy bomber with mid-wash jeans: the navy jacket tones it down, +0.5",
     Rd(top("tee", "red"), outer("bomber", "navy"), bottom("jeans", "denim_mid", "straight"), WLS),
     {"fired": [F(CP1D, "color", 0.5)], "band_in": ["Put together", "Sharp"]})
case("COL-11-no-dark", "COL-11", "the orange sweater with khaki chinos: no dark piece beside it, no credit",
     Rd(top("sweater", "orange"), CHINOS, WLS), {"not_fired": [F(CP1D)], "part": {"color": {"score": 7.0}}, "band": "Put together"},
     vs={"case": "COL-11-orange", "parts": {"color": -0.5}})
case("COL-11-dark-shoes-only", "COL-11", "the orange sweater, khaki chinos and black boots: the shoes don't count as the dark base",
     Rd(top("sweater", "orange"), CHINOS, shoe("chelsea_boot", "black")), {"not_fired": [F(CP1D)], "band_in": ["Put together", "Sharp"]})
case("COL-11-two-brights", "COL-11", "an orange tee under a yellow bomber with black jeans: two bright pieces, no credit (and a clash)",
     Rd(top("tee", "orange"), outer("bomber", "yellow"), bottom("jeans", "black", "straight"), WLS),
     {"not_fired": [F(CP1D)], "fired": [F("CC2_bright_clash", "color")], "band_in": ["Getting there", "Put together"]})
case("COL-11-bright-plus-accent", "COL-11", "an orange sweater under a green overshirt with black jeans: a second color, no credit",
     Rd(top("sweater", "orange"), outer("overshirt", "green"), bottom("jeans", "black", "straight"), WLS),
     {"not_fired": [F(CP1D)], "band_in": ["Getting there", "Put together"]})
case("COL-11-fault", "COL-11", "the orange sweater and black jeans over a black shirt and black trousers in the same stripe: a color fault, no credit",
     Rd(top("sweater", "orange"), top("oxford_shirt", "black", pattern="stripes"),
        bottom("trousers", "black", "straight", pattern="stripes", pattern_scale="medium"), DERBY),
     {"not_fired": [F(CP1D)], "fired": [F("CC6_same_pattern_scale", "color")], "band_in": ["Getting there", "Put together"]})
case("COL-11-loud", "COL-11", "a bright orange graphic tee with black jeans: a loud print is a fault ([COL-8]), no credit",
     Rd(top("graphic_tee", "orange", pattern_scale="medium"), bottom("jeans", "black", "straight"), WLS),
     {"not_fired": [F(CP1D)], "fired": [F(CL1, "color", -1.5)], "band_in": ["Getting there", "Put together"]})
case("COL-11-worn", "COL-11", "the orange sweater worn and pilled: a worn piece earns nothing ([CON-4])",
     Rd(top("sweater", "orange", condition="pilled_or_worn"), bottom("jeans", "black", "straight"), WLS),
     {"not_fired": [F(CP1D)], "band_in": ["Getting there", "Put together"]})

# COL-12 (v12): light on light (the founder's taste call)
LL = "CL2_light_on_light"
case("COL-12-cream", "COL-12", "a cream oxford over khaki chinos with brown loafers: light on light, -1.0 on Color",
     Rd(top("oxford_shirt", "off_white_cream"), CHINOS, LOAFER),
     {"fired": [F(LL, "color", -1.0, line="light on light washes out; a darker pant would anchor it")], "part": {"color": {"score": 6.0}},
      "band": "Put together"})
case("COL-12-white-khaki", "COL-12", "a crisp white oxford over khaki chinos with loafers: contrast, not light on light, 7.5",
     Rd(top("oxford_shirt", "white"), CHINOS, LOAFER), {"not_fired": [F(LL)], "part": {"color": {"score": 7.0}}, "overall": 7.5,
                                                        "band": "Put together"})
case("COL-12-white-cream", "COL-12", "a white tee over cream jeans: light on light, -1.0",
     Rd(TEE, bottom("jeans", "off_white_cream", "straight"), WLS), {"fired": [F(LL, "color", -1.0)], "band": "Put together"})
case("COL-12-khaki-white", "COL-12", "a khaki tee over white jeans: light on light (only a white top over khaki is spared), -1.0",
     Rd(top("tee", "khaki_beige"), bottom("jeans", "white", "straight"), WLS), {"fired": [F(LL, "color", -1.0)], "band": "Put together"})
case("COL-12-white", "COL-12", "a white tee over white jeans with white leather sneakers: light on light, -1.0",
     Rd(TEE, bottom("jeans", "white", "straight"), WLS), {"fired": [F(LL, "color", -1.0)], "band": "Put together"})
case("COL-12-dark-pant", "COL-12", "the cream oxford over navy chinos: a darker pant anchors it, no charge",
     Rd(top("oxford_shirt", "off_white_cream"), NCHINOS, LOAFER), {"not_fired": [F(LL)], "part": {"color": {"score": 7.0}},
                                                                   "band": "Put together"},
     vs={"case": "COL-12-cream", "parts": {"color": 1.0}})
case("COL-12-dark-shoes", "COL-12", "the cream oxford and khaki chinos with black loafers: the shoes don't count, still charged",
     Rd(top("oxford_shirt", "off_white_cream"), CHINOS, LOAFER_BK), {"fired": [F(LL, "color", -1.0)], "band": "Put together"})
case("COL-12-dark-layer", "COL-12", "a navy cardigan over a white tee with khaki chinos: the outer layer is the top half, and it's dark",
     Rd(TEE, outer("cardigan", "navy"), CHINOS, LOAFER), {"not_fired": [F(LL)], "band": "Put together"})
case("COL-12-dark-inner", "COL-12", "a cream overshirt over a black tee with khaki chinos: the black tee anchors it, no charge",
     Rd(top("tee", "black"), outer("overshirt", "off_white_cream"), CHINOS, LOAFER), {"not_fired": [F(LL)], "band": "Put together"})
case("COL-12-light-layer", "COL-12", "the cream overshirt over a white tee with khaki chinos: light on light",
     Rd(TEE, outer("overshirt", "off_white_cream"), CHINOS, LOAFER), {"fired": [F(LL, "color", -1.0)], "band": "Put together"})
case("COL-12-suit", "COL-12", "a khaki suit over a white dress shirt with brown derbies: a suit is one colour by design, no charge",
     Rd(top("dress_shirt", "white", tucked="full"), outer("suit_jacket", "khaki_beige"), bottom("suit_trousers", "khaki_beige", "straight", "no_break"), DERBY),
     {"not_fired": [F(LL)], "band_in": ["Put together", "Sharp"]})
case("COL-12-light-grey", "COL-12", "a light grey tee over white jeans: light grey is left out (it flips with grey between runs), no charge",
     Rd(top("tee", "light_grey"), bottom("jeans", "white", "straight"), WLS), {"not_fired": [F(LL)], "band": "Put together"})
case("COL-12-light-denim", "COL-12", "a white tee over light-wash jeans: light denim isn't a light neutral, no charge",
     Rd(TEE, bottom("jeans", "denim_light", "straight"), WLS), {"not_fired": [F(LL)], "band": "Put together"})
case("COL-12-rewards-off", "COL-12", "a khaki overshirt over a white tee, cream chinos and tan chukkas: a color fault, so the shoes' tie-in earns nothing ([COL-5])",
     Rd(TEE, outer("overshirt", "khaki_beige"), bottom("chinos", "off_white_cream", "straight"), shoe("suede_chukka", "tan_camel")),
     {"fired": [F(LL, "color", -1.0)], "not_fired": [F("CP5_tie_in")], "band": "Put together"})
# v1.9 (#376): the anchoring tip on the card, no points
ANCHOR_SHOES = "Light on light washes out: darker pants, or dark shoes like brown leather, would ground it."
ANCHOR = "Light on light washes out: darker pants, like navy chinos or dark jeans, would ground it."
case("COL-12-tip-shoes", "COL-12", "a white tee over cream jeans with white leather sneakers: the anchoring tip, with dark shoes as the other way",
     Rd(TEE, bottom("jeans", "off_white_cream", "straight"), WLS),
     {"fix_tip": "tip_anchor_shoes", "fix_tip_line": ANCHOR_SHOES, "band": "Put together"})
case("COL-12-tip", "COL-12", "the same with brown chukkas: the shoes are already dark, so the tip names only darker pants",
     Rd(TEE, bottom("jeans", "off_white_cream", "straight"), CHUKKA),
     {"fired": [F(LL, "color", -1.0)], "fix_tip": "tip_anchor", "fix_tip_line": ANCHOR, "band": "Put together"})
case("COL-12-tip-fix", "COL-12", "the cream oxford over khaki chinos: the card already offers navy chinos with a number, so no tip",
     Rd(top("oxford_shirt", "off_white_cream"), CHINOS, LOAFER), {"fix_tip_lacks": "tip_anchor", "band": "Put together"})
case("COL-12-tip-jacket", "COL-12", "a cream hoodie over cream jeans: the short black jacket fix anchors it too, so no tip",
     Rd(top("hoodie", "off_white_cream", 4, length="at_belt"), bottom("jeans", "off_white_cream", "relaxed"), WLS),
     {"fix_tip_lacks": "tip_anchor_shoes", "band": "Put together"})
case("COL-12-tip-free", "COL-12", "a white tee over khaki chinos with white sneakers: no charge, no tip",
     Rd(TEE, CHINOS, WLS), {"not_fired": [F(LL)], "fix_tip_lacks": "tip_anchor_shoes", "band": "Put together"})

CP8 = "CP8_layer_tie_in"
GHOOD = outer("hoodie", "green", length="na", saturation="muted")
OLIVE = bottom("cargos", "olive", "straight")
case("COL-13-oct28", "COL-13", "v15 (#385): the founder's green zip hoodie over a navy tee picks up the green of his olive cargos: +0.5 "
     "on Color, with the quiet accent: Color 8.0 (the score stays 7.5; Proportions and the runners set it)", OCT28,
     {"fired": [F(CP8, "color", 0.5, line="the hoodie picks up the green of the cargos"), F("CP2_quiet_accent", "color", 0.5)],
      "part": {"color": {"score": 8.0}}, "overall": 7.5, "band": "Put together"},
     styles=[("streetwear", 0.5), ("minimalist", 0.25), ("workwear", 0.25)])
case("COL-13-coat", "COL-13", "a tan chore coat over a white tee with khaki chinos and brown boots: the coat picks up the tan, +0.5",
     Rd(TEE, outer("chore_coat", "tan_camel", length="na"), CHINOS, BOOTS),
     {"fired": [F(CP8, "color", 0.5)], "band_in": ["Put together", "Sharp"]})
case("COL-13-one-family", "COL-13", "all one family (a green tee under the green hoodie, olive cargos): no tie-in, that's [COL-7]'s flat tonal",
     Rd(top("tee", "green", saturation="muted"), GHOOD, OLIVE, WLS), {"not_fired": [F(CP8)], "band": "Put together"})
case("COL-13-denim", "COL-13", "a denim jacket over a tee with jeans: denim repeats by accident, nothing",
     Rd(TEE, outer("denim_jacket", "denim_mid"), DJEANS, WLS), {"not_fired": [F(CP8)], "band_in": ["Put together", "Sharp"]})
case("COL-13-black", "COL-13", "a black bomber over a white tee with black jeans: black never ties in",
     Rd(TEE, outer("bomber", "black"), bottom("jeans", "black", "straight"), WLS), {"not_fired": [F(CP8)], "band": "Put together"})
case("COL-13-sweats", "COL-13", "a green hoodie over a white tee with olive joggers: a matched set is the loungewear rules', nothing",
     Rd(TEE, GHOOD, bottom("joggers", "olive", "straight"), WLS), {"not_fired": [F(CP8)], "band": "Put together"}, occasion="class")
case("COL-13-bright", "COL-13", "a bright green hoodie over olive cargos: nothing (not on a bright piece)",
     Rd(TEE, outer("hoodie", "green", length="na", saturation="bright"), OLIVE, WLS), {"not_fired": [F(CP8)], "band": "Put together"})
case("COL-13-tailored", "COL-13", "a brown blazer with brown trousers: tailoring is one color by design, nothing",
     Rd(top("oxford_shirt", "white", tucked="full"), outer("blazer", "brown"), bottom("trousers", "brown", "straight"), LOAFER),
     {"not_fired": [F(CP8)], "band_in": ["Put together", "Sharp"]}, occasion="date")
case("COL-13-fault", "COL-13", "a big red graphic tee under the green hoodie: a color fault, so no reward",
     Rd(top("graphic_tee", "red", pattern_scale="large", logo="large"), GHOOD, OLIVE, WLS),
     {"fired": [F("CL1_loud_print")], "not_fired": [F(CP8)], "band": "Put together"})

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
case("SHO-4-canvas", "SHO-4", "canvas sneakers with a tee and jeans: a clean sneaker earns the match too (v14; v13 said too plain)",
     Rd(TEE, DJEANS, CANVAS), {"fired": [F("SD1_matches", "shoes", 0.5)], "part": {"shoes": {"score": 7.5}}, "band": "Put together"},
     vs={"case": "SCO-1-plain", "parts": {"shoes": 0.0}})
case("SHO-4-heavy", "SHO-4", "an oversized hoodie over slim jeans with chunky sneakers: a shoe too heavy for the leg earns neither "
     "the match nor the look's own shoe (v14), only [SHO-9]'s charge",
     Rd(top("hoodie", "grey", 4), SLJEANS, CHUNKY),
     {"fired": [F("SW1_chunky_narrow", "shoes", -1.5)], "not_fired": [F("SD1_matches"), F("SC_chosen_for_look")],
      "part": {"shoes": {"score": 5.5}}, "band": "Needs a fix"})
case("SHO-4-match", "SHO-4", "white leather sneakers with a tee and jeans: +0.5", Rd(TEE, DJEANS, WLS),
     {"fired": [F("SD1_matches", "shoes", 0.5)], "band": "Put together"})
case("SHO-4-sweats", "SHO-4", "Chelsea boots with sweatpants: boots are a real shoe since v14, but far dressier than the "
     "clothes, so the window gives only a sixth of the match",
     Rd(TEE, bottom("sweatpants", "grey", "relaxed", "cuffed"), shoe("chelsea_boot", "black")),
     {"fired": [F("SD1_matches", "shoes", 0.167)], "band_in": ["Getting there", "Put together"]})
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
      "band": "Put together"})   # v14: the matched grey set counts as effort ([LNG-9]), so it's held to 7.5, not 6.5
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
case("STY-1-none", "STY-1", "no clear style: no 'reads as' credit and no charge (v14: the pieces go together instead, [STY-12])",
     Rd(TEE, DJEANS, WLS),
     {"not_fired": [F("H1_reads_as_style")], "fired": [F("H6_goes_together", "cohesion", 0.5)],
      "part": {"cohesion": {"score": 7.5}}, "label": None, "band": "Put together"})
case("STY-12-canvas", "STY-12", "a plain tee, dark jeans and canvas sneakers: no look, nothing off, the shoes earn a credit: +0.5 "
     "on Style", Rd(TEE, DJEANS, CANVAS), {"fired": [F("H6_goes_together", "cohesion", 0.5)], "band": "Put together"})
case("STY-12-worn", "STY-12", "the same with a tee that looks worn: something is off, no credit",
     Rd(top("tee", "white", condition="pilled_or_worn"), DJEANS, CANVAS), {"not_fired": [F("H6_goes_together")],
                                                                          "band_in": ["Getting there", "Put together"]})
case("STY-12-look", "STY-12", "an outfit that reads as a look gets that look's credit instead, never both",
     POLO, {"fired": [F("H1_reads_as_style", "cohesion", 0.5)], "not_fired": [F("H6_goes_together")], "band": "Put together"})
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
# v11: a plain base top (a tank or a tee) under another top layer is judged by the layer over it
TIM3 = Rd(top("tank_top", "white", 2, tucked="full", length="na"), outer("flannel_shirt", "black", 4, length="mid_fly"),
          bottom("trousers", "black", "wide"), LOAFER_BK)
case("STY-4-covered-flannel", "STY-4", "a white tank under a roomy black flannel with wide black trousers and black loafers (Tim's 'after'): the flannel stands for the top half, no charge (v11)",
     TIM3, {"not_fired": [F("H3_another_world"), F("TK1_tank_alone")], "part": {"cohesion": {"score": 7.5}}, "overall": 7.5,
            "band": "Put together"})
case("STY-4-covered-shirt-top", "STY-4", "the same tank under the flannel read as a second top, with dress shoes: no charge (v11)",
     Rd(top("tank_top", "white", tucked="full", length="na"), top("flannel_shirt", "black", 4), bottom("trousers", "black", "wide"), DRESS),
     {"not_fired": [F("H3_another_world")], "part": {"cohesion": {"score": 7.5}}, "band": "Put together"})
case("STY-4-covered-cardigan", "STY-4", "a tank under a navy cardigan with grey trousers and derbies: no charge (v11)",
     Rd(top("tank_top", "white"), top("cardigan", "navy"), TROUSERS, DERBY),
     {"not_fired": [F("H3_another_world")], "part": {"cohesion": {"score": 7.5}}, "band": "Put together"})   # v14: [STY-12]
case("STY-4-covered-suit", "STY-4", "a white tee under a navy suit with dress shoes: the jacket stands for the top half, no charge (v11)",
     Rd(TEE, outer("suit_jacket", "navy"), bottom("suit_trousers", "navy", "straight", "no_break"), DRESS),
     {"not_fired": [F("H3_another_world")], "band_in": ["Put together", "Sharp"]})
case("STY-4-tank-alone", "STY-4", "the tank with nothing over it, wide black trousers and black loafers: still charged, and [STY-9] too",
     Rd(top("tank_top", "white"), bottom("trousers", "black", "wide"), LOAFER_BK),
     {"fired": [F("H3_another_world", "cohesion", -1.5), F("TK1_tank_alone", "cohesion", -2.0)], "part": {"cohesion": {"score": 4.0}},
      "overall": 6.5, "band": "Getting there"}, vs={"case": "STY-4-covered-flannel", "overall": "down"})
case("STY-4-hoodie-not-cover", "STY-4", "a tank under a grey hoodie with grey trousers and loafers: a hoodie isn't a layer that covers it, still charged",
     Rd(top("tank_top", "white"), top("hoodie", "grey"), TROUSERS, LOAFER), {"fired": [F("H3_another_world", "cohesion", -1.5)],
                                                                             "band": "Put together"})
# STY-5: a piece from another look (the founder's three outfits, then the exemptions)
GT_TROUSERS = Rd(top("graphic_tee", "white", 4), mod(TROUSERS, color_family="charcoal"), LOAFER_BK)
case("STY-5-graphic", "STY-5", "oversized graphic tee, pleated trousers, loafers (founder case 1): Style -3.0, 6.5", GT_TROUSERS,
     {"fired": [F("SX1_another_look", "cohesion", -3.0)], "not_fired": [F("H1_reads_as_style")],
      "part": {"cohesion": {"score": 4.0}}, "overall": 6.5, "band": "Getting there"})
case("STY-5-hoodie", "STY-5", "oversized hoodie, slim chinos, loafers (founder case 2): the slim chinos cost 1.0 as well ([PRO-13], v12), 6.0",
     Rd(top("hoodie", "grey", 4), SLCHINOS, LOAFER),
     {"fired": [F("SX1_another_look", "cohesion", -3.0), F("PN1_narrow_leg", "proportions", -1.0)], "overall": 6.0,
      "band": "Getting there"})
case("STY-5-tee", "STY-5", "oversized plain tee, slim chinos, loafers (founder case 3): 6.0, as case 2 (v12: the slim chinos cost 1.0; a white top over khaki isn't light on light, [COL-12])",
     Rd(top("tee", "white", 4), SLCHINOS, LOAFER),
     {"fired": [F("SX1_another_look", "cohesion", -3.0)], "not_fired": [F("CL2_light_on_light")], "overall": 6.0, "band": "Getting there"})
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
case("STY-5-gtblazer", "STY-5", "an oversized graphic tee under a blazer: the blazer still bridges this rule, but [STY-10] charges it",
     Rd(top("graphic_tee", "white", 4), outer("blazer", "navy"), TROUSERS, LOAFER_BK),
     {"not_fired": [F("SX1_another_look")], "fired": [F("GT1_graphic_under_tailoring", "cohesion", -1.5)],
      "band_in": ["Getting there", "Put together"]})
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

# STY-10 (v9): an oversized graphic tee under tailoring (closes KD-9)
GT_BLAZER = Rd(top("graphic_tee", "black", 4), outer("unstructured_blazer", "navy"), DJEANS, LOAFER)
case("STY-10-oversized", "STY-10", "an oversized graphic tee under an unstructured blazer with dark jeans and loafers: -1.5 Style",
     GT_BLAZER, {"fired": [F("GT1_graphic_under_tailoring", "cohesion", -1.5)], "not_fired": [F("SX1_another_look")],
                 "part": {"cohesion": {"score": 5.5}}, "overall": 7.0, "band": "Put together"})
case("STY-10-fitted", "STY-10", "the same graphic tee at regular roominess: free",
     Rd(top("graphic_tee", "black"), outer("unstructured_blazer", "navy"), DJEANS, LOAFER),
     {"not_fired": [F("GT1_graphic_under_tailoring")], "band_in": ["Put together", "Sharp"]})
case("STY-10-plain", "STY-10", "an oversized plain tee under a blazer: only a graphic tee is charged",
     Rd(top("tee", "white", 4), outer("blazer", "navy"), TROUSERS, LOAFER_BK),
     {"not_fired": [F("GT1_graphic_under_tailoring")], "band_in": ["Put together", "Sharp"]})
case("STY-10-overcoat", "STY-10", "the oversized graphic tee under an overcoat: an overcoat isn't tailoring, free",
     Rd(top("graphic_tee", "white", 4), outer("overcoat", "navy"), TROUSERS, LOAFER_BK),
     {"not_fired": [F("GT1_graphic_under_tailoring")], "band_in": ["Put together", "Sharp"]})
case("STY-10-stack", "STY-10", "with wide mid-wash jeans: adds to the blazer-with-jeans charge ([STY-3]), Style 4.0",
     Rd(top("graphic_tee", "black", 4), outer("blazer", "navy"), WJEANS, LOAFER),
     {"fired": [F("GT1_graphic_under_tailoring", "cohesion", -1.5), F("H3_another_world", "cohesion", -1.5)],
      "part": {"cohesion": {"score": 4.0}}, "band": "Getting there"})

KNIT_TIP = "Two knits together blur: try a smooth layer over the knit, like an overshirt or a jacket."
case("STY-11-cardigan", "STY-11", "a navy cardigan over a grey sweater with dark jeans and suede chukkas: the knit-on-knit tip, no points",
     Rd(outer("cardigan", "navy"), top("sweater", "grey", length="at_belt"), DJEANS, CHUKKA),
     {"fix_tip": "tip_knit", "fix_tip_line": KNIT_TIP, "band_in": ["Put together", "Sharp"]})
case("STY-11-qz-polo", "STY-11", "a quarter-zip over a knit polo with khaki chinos and loafers: the same tip",
     Rd(top("quarter_zip", "navy", length="at_belt"), top("knit_polo", "white", length="at_belt"), CHINOS, LOAFER),
     {"fix_tip": "tip_knit", "band_in": ["Put together", "Sharp"]})
case("STY-11-oxford", "STY-11", "the cardigan over an oxford shirt: a woven shirt under a knit is fine, no tip",
     Rd(outer("cardigan", "navy"), top("oxford_shirt", "white", length="at_belt"), DJEANS, CHUKKA),
     {"fix_tip_lacks": "tip_knit", "band_in": ["Put together", "Sharp"]})
case("STY-11-tee", "STY-11", "a sweater over a tee: no tip",
     Rd(top("sweater", "grey", length="at_belt"), TEE, DJEANS, CHUKKA), {"fix_tip_lacks": "tip_knit", "band_in": ["Put together", "Sharp"]})
case("STY-11-score", "STY-11", "the tip never moves the score: the cardigan over the sweater scores as the cardigan over the oxford",
     Rd(outer("cardigan", "navy"), top("sweater", "grey", length="at_belt"), DJEANS, CHUKKA),
     {"not_fired": [F("TIP_knit")], "band_in": ["Put together", "Sharp"]}, vs={"case": "STY-11-oxford", "overall": "same"})

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

# CON-6 (v12; v13): wrinkles by garment and look
case("CON-6-tee", "CON-6", "a wrinkled white tee with dark jeans and white leather sneakers (no clear style): a knit top, no charge and no line",
     Rd(top("tee", "white", condition="wrinkled"), DJEANS, WLS), {"cond_deduction": 0.0, "cond_tips": [], "band": "Put together"})
case("CON-6-graphic", "CON-6", "a wrinkled bright red graphic tee with a small print over black wide jeans: no charge",
     Rd(top("graphic_tee", "red", pattern_scale="small", condition="wrinkled"), bottom("jeans", "black", "wide"), CHUNKY),
     {"cond_deduction": 0.0, "band": "Sharp"})   # v14: the chunky sneakers now match and are the look's own shoe
case("CON-6-hoodie", "CON-6", "a wrinkled grey hoodie: no charge", Rd(top("hoodie", "grey", condition="wrinkled"), DJEANS, WLS),
     {"cond_deduction": 0.0, "band": "Put together"})
case("CON-6-tee-interview", "CON-6", "a wrinkled tee under a navy chore coat with navy chinos and loafers at an interview: it reads as smart casual, so -0.2 like any day (v13; the occasion doesn't change the knit rule)",
     Rd(top("tee", "white", condition="wrinkled"), outer("chore_coat", "navy"), NCHINOS, LOAFER),
     {"detected_has": ["smart_casual"], "cond_deduction": 0.2, "band": "Getting there"}, occasion="interview")
# v13: knit tops on a clean look (minimal, smart casual, classic prep) cost 0.2; nothing on a loud-native look or no clear style
case("CON-6-tee-smart-clean", "CON-6", "a clean white tee with navy chinos and loafers (smart casual): 7.5", Rd(TEE, NCHINOS, LOAFER), {"cond_deduction": 0.0, "overall": 7.5, "band": "Put together"})
case("CON-6-tee-smart", "CON-6", "a wrinkled white tee with navy chinos and loafers (smart casual): -0.2, 7.0 (7.5 in v12)",
     Rd(top("tee", "white", condition="wrinkled"), NCHINOS, LOAFER),
     {"detected_has": ["smart_casual"], "cond_deduction": 0.2, "overall": 7.0, "band": "Put together"},
     vs={"case": "CON-6-tee-smart-clean", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": "down"})
case("CON-6-sweatshirt-minimal", "CON-6", "a wrinkled grey sweatshirt with navy chinos and loafers (minimal): -0.2",
     Rd(top("sweatshirt", "grey", condition="wrinkled"), NCHINOS, LOAFER),
     {"detected_has": ["minimalist"], "detected_lacks": ["streetwear", "workwear", "vintage_sport", "outdoor"], "cond_deduction": 0.2,
      "band": "Put together"})
case("CON-6-tee-prep", "CON-6", "a wrinkled white tee under a navy cardigan with khaki chinos and loafers (classic prep): -0.2",
     Rd(outer("cardigan", "navy"), top("tee", "white", condition="wrinkled"), bottom("chinos", "khaki_beige", "straight"), LOAFER),
     {"detected_has": ["classic_prep"], "cond_deduction": 0.2, "band": "Put together"})
case("CON-6-tee-smart-likely", "CON-6", "the smart casual tee read only 'likely' wrinkled: no points, but the 'might be wrinkled' tip shows (the charge isn't waived on this look)",
     Rd(top("tee", "white", condition="wrinkled", certainty="likely"), NCHINOS, LOAFER),
     {"cond_deduction": 0.0, "cond_tips": ["C_unsure_wrinkled"], "overall": 7.5, "band": "Put together"})
case("CON-6-tee-mixed", "CON-6", "a wrinkled cream tee with black jeans and chunky sneakers, roomy and at the belt over wide black jeans, read as streetwear and minimal: a loud-native look, no charge",
     Rd(top("tee", "off_white_cream", 4, length="at_belt", condition="wrinkled"), bottom("jeans", "black", "wide"), CHUNKY),
     {"detected_has": ["streetwear", "minimalist"], "cond_deduction": 0.0, "cond_tips": [], "band": "Sharp"})   # v14 shoes
case("CON-6-tee-workwear", "CON-6", "a wrinkled tee under a clean brown chore coat with dark jeans and work boots (workwear): no charge",
     Rd(top("tee", "white", condition="wrinkled"), outer("chore_coat", "brown"), DJEANS, BOOTS),
     {"detected_has": ["workwear"], "cond_deduction": 0.0, "cond_tips": [], "band": "Sharp"})
case("CON-6-tee-blazer", "CON-6", "a wrinkled tee under a navy blazer with grey trousers and loafers: -0.2 (part of a tailored outfit)",
     Rd(top("tee", "white", condition="wrinkled"), outer("blazer", "navy"), TROUSERS, LOAFER), {"cond_deduction": 0.2,
                                                                                            "band_in": ["Put together", "Sharp"]})
case("CON-6-tee-likely", "CON-6", "a tee the AI is only 'likely' is wrinkled: waived, so no 'might be wrinkled' tip either",
     Rd(top("tee", "white", condition="wrinkled", certainty="likely"), DJEANS, WLS), {"cond_deduction": 0.0, "cond_tips": [],
                                                                                     "band": "Put together"})
WRK_COAT = outer("chore_coat", "brown", condition="wrinkled")
case("CON-6-workwear", "CON-6", "a wrinkled brown chore coat over a tee with dark jeans and work boots (workwear): no charge",
     Rd(TEE, WRK_COAT, DJEANS, BOOTS), {"detected_has": ["workwear"], "cond_deduction": 0.0, "band_in": ["Put together", "Sharp"]})
case("CON-6-workwear-likely", "CON-6", "the same chore coat read only 'likely' wrinkled: waived, no tip",
     Rd(TEE, mod(WRK_COAT, certainty="likely"), DJEANS, BOOTS), {"cond_deduction": 0.0, "cond_tips": [],
                                                               "band_in": ["Put together", "Sharp"]})
case("CON-6-casual-other", "CON-6", "the wrinkled chore coat over a tee with navy chinos and loafers (no loud look): -0.2",
     Rd(TEE, WRK_COAT, NCHINOS, LOAFER), {"detected_lacks": ["workwear", "streetwear", "vintage_sport", "outdoor"], "cond_deduction": 0.2,
                                         "band": "Put together"})
case("CON-6-casual-interview", "CON-6", "the workwear chore coat outfit at an interview: every woven piece keeps -0.4",
     Rd(TEE, WRK_COAT, DJEANS, BOOTS), {"cond_deduction": 0.4, "band": "Getting there"}, occasion="interview")
case("CON-6-casual-event", "CON-6", "the same at an event: -0.4", Rd(TEE, WRK_COAT, DJEANS, BOOTS), {"cond_deduction": 0.4, "band": "Put together"},
     occasion="event")
case("CON-6-cargos", "CON-6", "wrinkled cargos under a hoodie with chunky sneakers (streetwear): no charge",
     Rd(top("hoodie", "black", 4), bottom("cargos", "olive", "wide", condition="wrinkled"), CHUNKY),
     {"detected_has": ["streetwear"], "cond_deduction": 0.0, "band": "Sharp"})
case("CON-6-oxford-jeans", "CON-6", "a wrinkled white oxford with dark jeans at Everyday: -0.2",
     Rd(top("oxford_shirt", "white", condition="wrinkled"), DJEANS, WLS), {"cond_deduction": 0.2, "band": "Put together"})
case("CON-6-oxford-jeans-class", "CON-6", "the same at Class: -0.2",
     Rd(top("oxford_shirt", "white", condition="wrinkled"), DJEANS, WLS), {"cond_deduction": 0.2, "band": "Put together"}, occasion="class")
case("CON-6-oxford-jeans-date", "CON-6", "the same on a date: -0.4 (the half charge is only for Everyday and Class)",
     Rd(top("oxford_shirt", "white", condition="wrinkled"), DJEANS, WLS), {"cond_deduction": 0.4, "band": "Put together"}, occasion="date")
case("CON-6-oxford-chinos", "CON-6", "a wrinkled light blue oxford with navy chinos: -0.4 on every look",
     Rd(top("oxford_shirt", "light_blue", condition="wrinkled"), NCHINOS, LOAFER), {"cond_deduction": 0.4, "band": "Put together"})
case("CON-6-chinos-workwear", "CON-6", "wrinkled navy chinos under a chore coat with boots: dressy pieces keep -0.4 even in a casual look",
     Rd(TEE, outer("chore_coat", "brown"), mod(NCHINOS, condition="wrinkled"), BOOTS), {"cond_deduction": 0.4, "band": "Put together"})
case("CON-6-dress-shirt", "CON-6", "a wrinkled dress shirt tucked into trousers with derbies: -0.4",
     Rd(top("dress_shirt", "white", tucked="full", condition="wrinkled"), TROUSERS, DERBY), {"cond_deduction": 0.4, "band": "Put together"})

# ===== Occasion (OCC) ================================================================================================
HOODIE_FIT = Rd(top("hoodie", "grey"), DJEANS, WLS)
case("OCC-1-everyday", "OCC-1", "a hoodie, dark jeans and white sneakers at Everyday: right for it", HOODIE_FIT,
     {"ceiling": None, "occ_deduction": 0.0, "band": "Put together"})
OXFORD_FIT = Rd(top("oxford_shirt", "white"), DJEANS, CANVAS)
case("OCC-1-oxford", "OCC-1", "an oxford, dark jeans and canvas sneakers at Everyday: right for it", OXFORD_FIT,
     {"ceiling": None, "occ_deduction": 0.0, "band": "Put together"})
case("OCC-1-interview", "OCC-1", "the same at an interview (a level under its band): held to 6.0 and -0.5", OXFORD_FIT,
     {"ceiling": 6.0, "occ_deduction": 0.5, "occ_lines_has": ["too casual for interview"], "band": "Getting there"},
     occasion="interview", vs={"case": "OCC-1-oxford", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": "down"})
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

# OCC-7 (v9): an interview wants a collared top, a knit or a jacket
case("OCC-7-hoodie", "OCC-7", "a hoodie, dark jeans and white sneakers at an interview: held to 5.0", HOODIE_FIT,
     {"ceiling": 5.0, "overall": 5.0, "occ_lines_has": ["a hoodie at an interview"], "band": "Needs a fix"}, occasion="interview",
     vs={"case": "OCC-1-everyday", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": "down"})
case("OCC-7-openhoodie", "OCC-7", "a tee under an open zip hoodie at an interview: the hoodie as the jacket counts too, 5.0",
     Rd(TEE, outer("hoodie", "grey"), DJEANS, WLS),
     {"ceiling": 5.0, "occ_lines_has": ["a hoodie at an interview"], "band": "Needs a fix"}, occasion="interview")
case("OCC-7-puffer", "OCC-7", "a hoodie under a puffer at an interview: a puffer isn't a jacket here, 5.0",
     Rd(top("hoodie", "grey"), outer("puffer"), DJEANS, WLS),
     {"ceiling": 5.0, "occ_lines_has": ["a hoodie at an interview"], "band": "Needs a fix"}, occasion="interview")
case("OCC-7-boxytee", "OCC-7", "a tucked boxy tee, wide trousers and loafers at an interview (v8 gave 8.0): held to 6.0",
     Rd(top("tee", "white", 4, tucked="full"), WTROUSERS, LOAFER_BK),
     {"ceiling": 6.0, "overall": 6.0, "occ_lines_has": ["an interview wants a collared shirt, a knit or a jacket"],
      "band": "Getting there"}, occasion="interview")
case("OCC-7-teepuffer", "OCC-7", "a tee under a puffer at an interview: no collar, knit or jacket, held to 6.0 or lower",
     Rd(TEE, outer("puffer"), DJEANS, WLS),
     {"overall_max": 6.0, "occ_lines_lacks": ["a hoodie at an interview"], "band": "Getting there"}, occasion="interview")
case("OCC-7-sweater", "OCC-7", "a sweater with trousers and derbies at an interview: a knit is enough, no hold",
     Rd(top("sweater", "navy"), TROUSERS, DERBY),
     {"ceiling": None, "band": "Put together"}, occasion="interview")
case("OCC-7-bomber", "OCC-7", "a hoodie under a bomber at an interview: the bomber is a jacket, so only the too-casual hold ([OCC-1])",
     Rd(top("hoodie", "grey"), outer("bomber"), DJEANS, WLS),
     {"occ_lines_lacks": ["a hoodie at an interview", "an interview wants"], "band": "Getting there"}, occasion="interview")
case("OCC-7-blazer", "OCC-7", "a plain tee under a blazer with trousers and loafers at an interview: no hold",
     Rd(TEE, outer("blazer", "navy"), TROUSERS, LOAFER),
     {"ceiling": None, "band_in": ["Put together", "Sharp"]}, occasion="interview")
case("OCC-7-suitjacket", "OCC-7", "a tee under a suit jacket at an interview: the suit jacket counts as a jacket, no hold",
     Rd(TEE, outer("suit_jacket", "navy"), bottom("suit_trousers", "navy", "straight", "no_break"), DRESS),
     {"occ_lines_lacks": ["a hoodie at an interview", "an interview wants"], "ceiling": None, "band": "Put together"},
     occasion="interview")
case("OCC-7-everyday", "OCC-7", "the hoodie fit at Everyday: the rule is only for interviews", HOODIE_FIT,
     {"occ_lines_lacks": ["a hoodie at an interview"], "band": "Put together"})

case("OCC-6-hoodie", "OCC-6", "the hoodie, dark jeans and white sneakers at an event: half a level under its band, -0.25, no ceiling",
     HOODIE_FIT, {"ceiling": None, "occ_deduction": 0.25, "occ_lines_has": ["a bit casual for event"], "band": "Put together"},
     occasion="event", vs={"case": "OCC-7-hoodie", "parts": {k: 0.0 for k in P.PART_ORDER}, "overall": "up"})
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
case("LNG-4-kit", "LNG-4", "a jersey with gym shorts that fit cleanly: a full kit, held to 6.0 (v14; 5.5 before)",
     Rd(top("jersey", "green"), bottom("athletic_shorts", "black", "straight", "na"), RETRO),
     {"ceiling": 6.0, "detected_lacks": ["vintage_sport"], "band": "Getting there"})
case("LNG-4-tight", "LNG-4", "the same kit in short, tight gym shorts: Proportions loses 1.0, so the hold drops by half of it, to 5.5",
     Rd(top("jersey", "green"), bottom("athletic_shorts", "black", "slim", "na", volume=2), RETRO),
     {"ceiling": 5.5, "fired": [F("PS3_fitted_shorts", "proportions", -1.0)], "band": "Needs a fix"})
case("LNG-5-gym", "LNG-5", "joggers, a tee and running shoes at the gym: no hold, no shoe charge",
     Rd(TEE, JOG, RUNNER), {"ceiling": None, "not_fired": [F("SK2_runners")], "band_in": ["Put together", "Sharp"]},
     occasion="gym")
case("LNG-6-class", "LNG-6", "joggers, a tee and slides at Class: counted as casual, so only a little casual for class",
     Rd(TEE, JOG, SLIDES), {"occ_lines_has": ["a bit casual for class"], "occ_lines_lacks": ["too casual"],
                            "band": "Needs a fix"}, occasion="class")
case("LNG-7-style", "LNG-7", "a grey hoodie, matching wide joggers and chunky sneakers: the set counts as effort ([LNG-9]) and it "
     "reads as streetwear, so the hold rises half a point too: 8.0 (v14; 7.0 before)",
     Rd(top("hoodie", "grey"), bottom("joggers", "grey", "wide", "cuffed"), CHUNKY),
     {"label": "streetwear", "ceiling": 8.0, "band": "Sharp"})
case("LNG-7-none", "LNG-7", "a plain tee with the same joggers and sneakers reads as no style: held to 6.5",
     Rd(TEE, bottom("joggers", "grey", "wide", "cuffed"), CHUNKY), {"label": None, "ceiling": 6.5, "band": "Getting there"},
     vs={"case": "LNG-7-style", "overall": "down"})
case("LNG-2-look", "LNG-2", "a grey hoodie, black wide joggers and chunky sneakers at Class: reading as streetwear counts as the "
     "dressed-upper-half sign (v14), so it's held to 7.5", Rd(top("hoodie", "grey"), bottom("joggers", "black", "wide", "cuffed"), CHUNKY),
     {"label": "streetwear", "ceiling": 7.5, "band_in": ["Put together", "Sharp"]}, occasion="class")
case("LNG-8-runners", "LNG-8", "a plain tee, gym shorts and running shoes at Class: not held (v14); the runners still cost on Shoes",
     Rd(TEE, bottom("athletic_shorts", "black", "relaxed", "na", volume=4), RUNNER),
     {"ceiling": None, "fired": [F("SK2_runners")], "overall": 6.5, "band": "Getting there"}, occasion="class")
case("LNG-8-going-out", "LNG-8", "the same, going out: the occasion still holds it", Rd(TEE, bottom("athletic_shorts", "black", "relaxed",
     "na", volume=4), RUNNER), {"band_in": ["Needs a fix", "Getting there"]}, occasion="going_out")
case("LNG-9-set", "LNG-9", "a roomy grey hoodie, grey relaxed sweatpants and white leather sneakers: the set counts as effort and "
     "its relaxed shape earns +1.0", Rd(top("hoodie", "grey", 4), bottom("sweatpants", "grey", "relaxed", "cuffed"), WLS),
     {"fired": [F("PR7_sweatsuit_shape", "proportions", 1.0)], "ceiling": 7.5, "overall": 7.5, "band": "Put together"})
case("LNG-9-slim", "LNG-9", "the same set with slim joggers: no shape credit", Rd(top("hoodie", "grey"),
     bottom("joggers", "grey", "slim", "cuffed"), WLS), {"not_fired": [F("PR7_sweatsuit_shape")], "band": "Put together"})
case("LNG-9-slides", "LNG-9", "the set with slides: no shape credit, and slides aren't a real shoe", Rd(top("hoodie", "grey", 4),
     bottom("sweatpants", "grey", "relaxed", "full_break"), SLIDES), {"not_fired": [F("PR7_sweatsuit_shape")], "ceiling": 6.5,
                                                                    "band_in": ["Needs a fix", "Getting there"]})

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
     {"fired": [F("SW2_weight_carries_leg", "shoes", 0.5)], "part": {"shoes": {"score": 8.5}}, "band": "Put together"})   # v14 [SHO-4]
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
                                                     F("SW1_chunky_narrow", "shoes", -1.5)], "overall": 5.5, "band": "Needs a fix"})
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
     {"detected_lacks": ["vintage_sport"], "band": "Getting there"})   # v14: a clean kit is held to 6.0 ([LNG-4])
case("VSP-9-tracksuit", "VSP-9", "a navy track jacket and navy track pants with grey retro runners: a matched tracksuit, +0.5 on Style",
     Rd(TEE, outer("track_jacket", "navy"), bottom("track_pants", "navy", "straight", "slight_break"), RETRO),
     {"fired": [F("H7_tracksuit", "cohesion", 0.5)], "band_in": ["Put together", "Sharp"]}, future=["track_jacket", "track_pants"])
case("VSP-9-mixed", "VSP-9", "a navy track jacket over black track pants: not a set, no credit",
     Rd(TEE, outer("track_jacket", "navy"), bottom("track_pants", "black", "straight", "slight_break"), RETRO),
     {"not_fired": [F("H7_tracksuit")], "band_in": ["Put together", "Sharp"]}, future=["track_jacket", "track_pants"])
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

case("SMC-6-slim", "SMC-6", "a roomy oxford over slim chinos with loafers: smart casual's band stops at regular, -1.5 (and the slim leg -1.0, v12)",
     Rd(top("oxford_shirt", "light_blue", 4), SLCHINOS, LOAFER), {"detected_has": ["smart_casual"],
                                                                 "fired": [F(PB1, "proportions", -1.5), F("PN1_narrow_leg", "proportions", -1.0)],
                                                                 "overall": 6.5, "band": "Getting there"})
case("SMC-6-chinos", "SMC-6", "the same oxford over straight chinos: full-leg pressed trousers carry it, no charge",
     Rd(top("oxford_shirt", "light_blue", 4), CHINOS, LOAFER), {"not_fired": [F(PB1), F("PN1_narrow_leg")], "band": "Put together"},
     vs={"case": "SMC-6-slim", "parts": {"proportions": 2.5}})

# ===== No clear style (GEN) ==========================================================================================
case("GEN-1-none", "GEN-1", "a grey sweater, wide light-wash jeans and white leather sneakers: no style, judged by the shared rules",
     Rd(top("sweater", "grey"), bottom("jeans", "denim_light", "wide", "cuffed"), WLS),
     {"label": None, "part": {"cohesion": {"score": 7.5}, "proportions": {"score": 7.0}, "fit": {"score": 7.0}},
      "band": "Put together"})   # v14: the pieces go together ([STY-12])
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


# ===== Tailored (TLR; T94, specs/tailored.md) ========================================================================
# The cases above whose outfit meets TL1 (a tailored jacket and dress trousers, nothing on the never-list, no roominess
# 5) now read as Tailored, and the "reads as" line names it where it said "a matching suit", "reads as smart casual"
# or "reads as classic prep" (TL2). Name only: every number they assert stays as it was (TL3).
MEETS_TL1 = ["PRO-7-tailored", "PRO-7-untucked", "PRO-10-hem", "PRO-13-fitted-blazer", "PRO-13-blazer", "PRO-14-blazer",
             "FIT-1-ceiling", "FIT-2-tailored", "FIT-5-worst", "COL-3-near", "COL-12-suit", "COL-13-tailored", "SHO-5-casual",
             "SHO-7-suit", "STY-2-suit", "STY-4-covered-suit", "STY-5-blazer", "STY-10-plain", "CON-6-tee-blazer",
             "OCC-2-derby", "OCC-2-over", "OCC-4-sneakers", "OCC-4-everyday", "OCC-7-blazer", "OCC-7-suitjacket",
             "MIN-3-blazer", "PRP-3-tailored", "SMC-2-suit", "SMC-5-interview"]
_by_id = {c["id"]: c for c in CASES}
assert set(MEETS_TL1) <= set(_by_id), sorted(set(MEETS_TL1) - set(_by_id))
for _cid in MEETS_TL1:
    _e = _by_id[_cid]["expect"]
    _e["label"] = "tailored"
    _e["detected_has"] = list(dict.fromkeys(_e.get("detected_has", []) + ["tailored"]))
    _e["fired"] = _e.get("fired", []) + [F("H1_reads_as_style", "cohesion", 0.5, "reads as tailored")]

TL_SHIRT = top("dress_shirt", "white", tucked="full")
TL_SUIT = Rd(TL_SHIRT, outer("suit_jacket", "charcoal"), bottom("suit_trousers", "charcoal", "straight", "no_break"), shoe("derby", "black"))
TL_BLZ = Rd(TL_SHIRT, outer("blazer", "navy"), TROUSERS, LOAFER)
TL_MIN_TIE = Rd(TEE, outer("unstructured_blazer", "navy"), bottom("trousers", "black", "straight"), LOAFER_BK)
TL_SLEEVES = Rd(TL_SHIRT, outer("blazer", "navy", sleeve_end="covers_hand"), bottom("trousers", "grey", "straight", "no_break"),
                shoe("canvas_sneaker", "red"))
H1_TL = F("H1_reads_as_style", "cohesion", 0.5, "reads as tailored")

case("TLR-1-blazer", "TLR-1", "a navy blazer over a tucked white dress shirt, grey trousers and brown loafers: Tailored",
     TL_BLZ, {"detected_has": ["tailored", "classic_prep", "smart_casual"], "label": "tailored", "fired": [H1_TL], "band": "Sharp"})
case("TLR-1-clean-sneakers", "TLR-1", "the same with white leather sneakers (a home piece): still Tailored",
     Rd(TL_SHIRT, outer("blazer", "navy"), TROUSERS, WLS), {"detected_has": ["tailored"], "label": "tailored", "band": "Sharp"})
case("TLR-1-two-slots", "TLR-1", "a charcoal suit with the shoes out of the photo: jacket and trousers are enough",
     Rd(*TL_SUIT["garments"], shoes_visible=False), {"detected_has": ["tailored"], "label": "tailored", "band": "Put together"})
case("TLR-2-suit", "TLR-2", "a charcoal suit over a white dress shirt with black derbies: a matching suit always meets it",
     TL_SUIT, {"detected_has": ["tailored"], "label": "tailored", "fired": [H1_TL], "band": "Sharp"})
case("TLR-2-no-jacket", "TLR-2", "a grey sweater, grey trousers and loafers: no tailored jacket, so minimal as before",
     Rd(top("sweater", "grey"), bottom("trousers", "grey", "straight"), LOAFER),
     {"detected_lacks": ["tailored"], "label": "minimalist", "band": "Put together"})
case("TLR-2-overcoat", "TLR-2", "the same under a camel overcoat: an overcoat isn't a tailored jacket",
     Rd(top("sweater", "grey"), outer("overcoat", "tan_camel"), bottom("trousers", "grey", "straight"), LOAFER),
     {"detected_lacks": ["tailored"], "band": "Put together"})
case("TLR-2-top-half", "TLR-2", "the suit with only the top half in the photo: no trousers in view, not Tailored",
     Rd(*TL_SUIT["garments"], framing="upper_only"), {"detected_lacks": ["tailored"], "label": None, "band": "Put together"})
case("TLR-3-chinos", "TLR-3", "a navy blazer over a white oxford with khaki chinos and loafers: classic prep, never Tailored",
     Rd(top("oxford_shirt", "white"), outer("blazer", "navy"), CHINOS, LOAFER),
     {"detected_lacks": ["tailored"], "label": "classic_prep", "fired": [F("H1_reads_as_style", "cohesion", 0.5, "reads as classic prep")],
      "band": "Put together"})
case("TLR-3-jeans", "TLR-3", "a navy blazer over a white tee with dark straight jeans and loafers: never Tailored",
     Rd(TEE, outer("blazer", "navy"), DJEANS, LOAFER), {"detected_lacks": ["tailored"], "label": "classic_prep", "band": "Put together"})
case("TLR-3-chunky", "TLR-3", "the Tailored blazer outfit with chunky sneakers: never Tailored, smart casual as before",
     Rd(TL_SHIRT, outer("blazer", "navy"), TROUSERS, CHUNKY),
     {"detected_lacks": ["tailored"], "label": "smart_casual", "fired": [F("H1_reads_as_style", "cohesion", 0.5, "reads as smart casual")],
      "band": "Put together"})
case("TLR-3-hoodie", "TLR-3", "a hoodie under a navy blazer with grey trousers and loafers: never Tailored",
     Rd(top("hoodie", "grey"), outer("blazer", "navy"), TROUSERS, LOAFER),
     {"detected_lacks": ["tailored"], "label": "classic_prep", "band": "Put together"})
case("TLR-3-roomy", "TLR-3", "the Tailored blazer outfit with the trousers at roominess 5: never Tailored",
     Rd(TL_SHIRT, outer("blazer", "navy"), mod(TROUSERS, volume=5), LOAFER),
     {"detected_lacks": ["tailored"], "label_in": ["classic_prep", "smart_casual", None], "band_in": ["Getting there", "Put together", "Sharp"]})
case("TLR-4-picks", "TLR-4", "the blazer outfit with smart casual as his pick: Tailored wins before his picks",
     TL_BLZ, {"label": "tailored", "detected_has": ["tailored", "smart_casual"], "fired": [H1_TL], "band": "Sharp"},
     styles=[("smart_casual", 1.0)])
case("TLR-4-prep-marker", "TLR-4", "a pink oxford under a navy blazer with grey trousers and loafers, classic prep picked: still Tailored",
     Rd(top("oxford_shirt", "pink"), outer("blazer", "navy"), TROUSERS, LOAFER),
     {"label": "tailored", "detected_has": ["tailored", "classic_prep"], "fired": [H1_TL], "band": "Put together"},
     styles=[("classic_prep", 1.0)])
case("TLR-4-minimal-pick", "TLR-4", "a tee under an unstructured blazer with black trousers and loafers reads minimal and Tailored: his minimal pick names it",
     TL_MIN_TIE, {"detected_has": ["tailored", "minimalist"], "label": "minimalist", "band": "Put together"}, styles=[("minimalist", 1.0)])
case("TLR-4-order", "TLR-4", "the same with no picks: the fixed order puts Tailored before minimal",
     TL_MIN_TIE, {"detected_has": ["tailored", "minimalist"], "label": "tailored", "fired": [H1_TL], "band": "Put together"})
case("TLR-5-suit", "TLR-5", "the charcoal suit keeps what it earned as a suit: +0.5 reads as, +0.5 worn properly, nothing more",
     TL_SUIT, {"overall": 8.0, "part": {"cohesion": {"score": 8.0}}, "fired": [H1_TL, F("H2_suit", "cohesion", 0.5)], "label": "tailored",
               "band": "Sharp"})
case("TLR-5-blazer", "TLR-5", "the blazer outfit keeps what it earned as smart casual: the same +0.5 and +0.5, renamed",
     TL_BLZ, {"overall": 8.0, "part": {"cohesion": {"score": 8.0}}, "label": "tailored",
              "fired": [H1_TL, F("H2_clear_top_to_toe", "cohesion", 0.5, "clearly tailored top to toe")], "band": "Sharp"})
case("TLR-5-picks", "TLR-5", "the same with Tailored picked: no number moves",
     TL_BLZ, {"label": "tailored", "band": "Sharp"}, styles=[("tailored", 1.0)],
     vs={"case": "TLR-5-blazer", "parts": {"proportions": 0.0, "fit": 0.0, "color": 0.0, "shoes": 0.0, "cohesion": 0.0}, "overall": 0.0})
case("TLR-5-no-look", "TLR-5", "a blazer, dress shirt and trousers with trail shoes read as no look before: now Tailored, with no new credit",
     Rd(TL_SHIRT, outer("blazer", "navy"), TROUSERS, shoe("trail_shoe", "grey")),
     {"label": "tailored", "not_fired": [F("H1_reads_as_style"), F("H2_clear_top_to_toe")], "overall": 7.0, "band": "Put together"},
     future=["trail_shoe"])
case("TLR-5-suit-not-tailored", "TLR-5", "a charcoal suit with chunky sneakers isn't Tailored: it keeps +0.5 as a matching suit (founder, option 1)",
     Rd(*TL_SUIT["garments"][:3], CHUNKY),
     {"label": None, "detected_lacks": ["tailored"], "fired": [F("H1_reads_as_style", "cohesion", 0.5, "a matching suit")],
      "band": "Put together"})
case("TLR-6-lead", "TLR-6", "blazer sleeves over the hands with red canvas sneakers, Tailored picked: the sleeve fix leads",
     TL_SLEEVES, {"fix_order": ["fit_better", "shoes_loafers"], "label": "tailored", "overall": 6.5, "band": "Getting there"}, styles=[("tailored", 1.0)])
case("TLR-6-no-pick", "TLR-6", "the same with no picks: the bigger gain first, as before",
     TL_SLEEVES, {"fix_order": ["shoes_loafers", "fit_better"], "label": "tailored", "overall": 6.5, "band": "Getting there"})
case("TLR-6-second-pick", "TLR-6", "Tailored as his second pick behind streetwear: the sleeve fix still leads",
     TL_SLEEVES, {"fix_order": ["fit_better", "shoes_loafers"], "label": "tailored", "overall": 6.5, "band": "Getting there"},
     styles=[("streetwear", 0.5), ("tailored", 0.5)])
case("TLR-6-class", "TLR-6", "a wrinkled shirt too: the free steam stays ahead of the sleeve fix (the lead is within a class)",
     Rd(top("dress_shirt", "white", tucked="full", condition="wrinkled"), outer("blazer", "navy", sleeve_end="covers_hand"), TROUSERS, LOAFER),
     {"fix_order": ["steam", "fit_better"], "label": "tailored", "band": "Put together"}, styles=[("tailored", 1.0)])
case("TLR-6-no-jacket", "TLR-6", "overcoat sleeves over the hands: not a tailored jacket, so no lead",
     Rd(top("sweater", "grey"), outer("overcoat", "tan_camel", sleeve_end="covers_hand"), TROUSERS, shoe("canvas_sneaker", "red")),
     {"fix_order": ["shoes_loafers", "fit_better"], "band": "Getting there"}, styles=[("tailored", 1.0)])


# ===== v16 (T69, #484/#487): every number is the engine's (v16_paper.py, results/v16/), checked against the doc line ====
def _from(cid):
    return copy.deepcopy(next(c for c in CASES if c["id"] == cid)["reading"])


def _ctx(cid):
    c = next(x for x in CASES if x["id"] == cid)
    return {"occasion": c["occasion"], "styles": c["styles"], "second_look": c["second_look"]}


TL11 = Rd(outer("suit_jacket", "charcoal"), top("dress_shirt", "white"), bottom("suit_trousers", "charcoal", "straight"), shoe("derby"))
case16('SCO-1-v16-plain', 'SCO-1', 'v16: plain basics land at 7.0, cool or warm', Rd(TEE, DJEANS, WLS), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday')
case16('SCO-1-v16-plain-warm', 'SCO-1', 'v16: the same plain basics on a warm day: 7.0', Rd(TEE, DJEANS, WLS), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday', season='warm')
case16('SCO-2-v16-boxy', 'SCO-2', 'v16: a boxy white tee tucked into charcoal wide trousers with black loafers: lifts stack to 8.5', Rd(top('tee', 'white', 4, tucked='full'), WTROUSERS, LOAFER_BK), dict({'overall': 8.5, 'band': 'Sharp'}, **{'fired': [F('PR1_waist_break', 'proportions')]}), occasion='everyday')
case16('SCO-2-v16-fitfault', 'SCO-2', "v16: the same tuck over slim trousers: a shape fault, the lifts can't lift it (held by H1)", Rd(top('tee', 'white', 4, tucked='full'), bottom('trousers', 'charcoal', 'slim'), LOAFER_BK), dict({'overall': 5.5, 'band': 'Needs a fix'}, **{'fired': [F('PN1_narrow_leg')]}), occasion='everyday')
case16('SCO-2-v16-top', 'SCO-2', 'v16: a boxy black tee tucked into wide trousers, a burgundy cardigan, black loafers: four lifts in one look, raw clamped at 9.5, shows 9.0 (Q-F1)', Rd(top('tee', 'black', 4, tucked='full'), outer('cardigan', 'burgundy'), WTROUSERS, LOAFER_BK), dict({'overall': 9.0, 'band': 'Dialed in'}, **{}), occasion='everyday')
case16('SCO-3-v16-nofloor', 'SCO-3', "v16: the messy outfit at Everyday isn't lifted to 5.0 any more", LOW, dict({'overall': 4.5, 'band': 'Start fresh'}, **{'floored': False}), occasion='everyday')
case16('SCO-3-v16-bottom', 'SCO-3', 'v16: a stained bright oversized hoodie over skinny yellow joggers and purple slides at a date: never under 3.0', Rd(mod(top('hoodie', 'red', 5), condition='stained'), bottom('joggers', 'yellow', 'skinny', 'cuffed'), shoe('slides_sandals', 'purple')), dict({'overall': 4.5, 'band': 'Start fresh'}, **{'floored': False}), occasion='date')
case16('SCO-4-v16-none', 'SCO-4', 'v16: a grey sweater over charcoal wide trousers with loafers, no picks', Rd(top('sweater', 'grey'), WTROUSERS, LOAFER), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday')
case16('SCO-4-v16-picks', 'SCO-4', 'v16: the same with Smart casual picked, his taste rules on: no number moves', Rd(top('sweater', 'grey'), WTROUSERS, LOAFER), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday', styles=[['smart_casual', 1.0]], vs={'case': 'SCO-4-v16-none', 'parts': {k: 0.0 for k in P.PART_ORDER}, 'overall': 'same'})
case16('SCO-7-v16-print', 'SCO-7', 'v16: a big loud floral on a tee with dark jeans: the Color charge counts at full strength, 6.0', Rd(top('tee', 'red', pattern='floral', pattern_scale='large'), DJEANS, WLS), dict({'overall': 6.0, 'band': 'Getting there'}, **{'fired': [F('CL1_loud_print', 'color')]}), occasion='everyday')
case16('SCO-7-v16-skinny', 'SCO-7', 'v16: skinny jeans under a fitted tee: 5.5 (the fault, then his skinny-leg charge; Q-F2)', Rd(top('tee', 'white', 2), SKJEANS, WLS), dict({'overall': 5.5, 'band': 'Needs a fix'}, **{'fired': [F('PN1_narrow_leg', 'proportions')]}), occasion='everyday')
case16('SCO-8-sink', 'SCO-8', 'a grey hoodie over black skinny jeans, white leather sneakers: one sinking fault caps it at 5.5', Rd(top('hoodie', 'grey'), SKJEANS, WLS), dict({'overall': 5.5, 'band': 'Needs a fix'}, **{}), occasion='everyday')
case16('SCO-8-two-holds', 'SCO-8', 'an oversized tee over slim black jeans with chunky sneakers: two holding faults, 6.0', Rd(top('tee', 'white', 4), SLJEANS, CHUNKY), dict({'overall': 6.0, 'band': 'Getting there'}, **{}), occasion='everyday')
case16('SCO-8-two-sinks', 'SCO-8', 'the messy outfit: two sinking faults (oversized over skinny, three brights): a redo, 4.5', LOW, dict({'overall': 4.5, 'band': 'Start fresh'}, **{}), occasion='everyday')
case16('SCO-9-tank-cool', 'SCO-9', 'a white tank top alone with dark jeans on a cool day: charged', Rd(top('tank_top', 'white'), DJEANS, WLS), dict({'overall': 6.0, 'band': 'Getting there'}, **{'fired': [F('TK1_tank_alone')]}), occasion='everyday')
case16('SCO-9-tank-warm', 'SCO-9', 'the same on a warm day: no charge', Rd(top('tank_top', 'white'), DJEANS, WLS), dict({'overall': 7.0, 'band': 'Put together'}, **{'not_fired': [F('TK1_tank_alone')]}), occasion='everyday', season='warm', vs={'case': 'SCO-9-tank-cool', 'overall': 'up'})
case16('SCO-9-puffer-warm', 'SCO-9', 'a black puffer over a white tee on a warm day: a heavy layer costs 0.5', Rd(TEE, outer('puffer', 'black'), DJEANS, WLS), dict({'overall': 6.5, 'band': 'Getting there'}, **{}), occasion='everyday', season='warm')
case16('SCO-9-puffer-cool', 'SCO-9', 'the same puffer on a cool day: no cost', Rd(TEE, outer('puffer', 'black'), DJEANS, WLS), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday', vs={'case': 'SCO-9-puffer-warm', 'overall': 'up'})
case16('SCO-10-over', 'SCO-10', "the curve over 7: the four-lift outfit's raw 9.5 shows 8.75, rounded 9.0", Rd(top('tee', 'black', 4, tucked='full'), outer('cardigan', 'burgundy'), WTROUSERS, LOAFER_BK), dict({'overall': 9.0, 'band': 'Dialed in'}, **{}), occasion='everyday')
case16('SCO-10-under', 'SCO-10', "the curve under 7: the tank alone's raw 6.075 shows 5.98, rounded 6.0", Rd(top('tank_top', 'white'), DJEANS, WLS), dict({'overall': 6.0, 'band': 'Getting there'}, **{}), occasion='everyday')
case16('LFT-1-tuck-wide', 'LFT-1', 'a tee tucked into wide jeans: a deliberate shape, a lift', Rd(top('tee', 'white', tucked='full'), WJEANS, WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{'fired': [F('PR1_waist_break', 'proportions')]}), occasion='everyday')
case16('LFT-1-tuck-straight', 'LFT-1', 'a tee tucked into straight jeans: the smaller lift (one lift, halved: [LFT-S])', Rd(top('tee', 'white', tucked='full'), DJEANS, WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{'fired': [F('PR1_waist_break', 'proportions')]}), occasion='everyday')
case16('LFT-2-cool', 'LFT-2', 'a black bomber over a tee with wide jeans on a cool day: a short layer over a full leg', Rd(TEE, outer('bomber', 'black'), WJEANS, WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{'fired': [F('PR2_short_layer', 'proportions')]}), occasion='everyday')
case16('LFT-2-warm', 'LFT-2', "the same on a warm day: the layer isn't a lift (the silhouette is)", Rd(TEE, outer('bomber', 'black'), WJEANS, WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday', season='warm')
case16('LFT-3-cool', 'LFT-3', 'an open olive overshirt over a white tee with khaki chinos, cool: a lift', Rd(TEE, outer('overshirt', 'olive', length='mid_fly'), CHINOS, WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{}), occasion='everyday')
case16('LFT-3-warm-camp', 'LFT-3', 'an open navy camp-collar shirt over a tee on a warm day: a light open shirt still counts', Rd(TEE, outer('camp_collar_shirt', 'navy', length='mid_fly'), CHINOS, WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{}), occasion='everyday', season='warm')
case16('LFT-4s-warm', 'LFT-4s', 'a cream tee with khaki chinos on a warm day: light and tonal', Rd(top('tee', 'off_white_cream'), bottom('chinos', 'khaki_beige', 'straight'), WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{}), occasion='everyday', season='warm')
case16('LFT-5-accent', 'LFT-5', 'a burgundy sweater on black jeans and white sneakers: one accent on a calm base', Rd(top('sweater', 'burgundy'), bottom('jeans', 'black', 'straight'), WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{'fired': [F('CP2_quiet_accent', 'color')]}), occasion='everyday')
case16('LFT-6-pickup', 'LFT-6', 'a black tee, dark jeans, black low sneakers: the shoes pick up the tee', Rd(top('tee', 'black'), DJEANS, shoe('low_profile_sneaker', 'black')), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday')
case16('LFT-7-smart', 'LFT-7', 'a white tee with grey trousers and white sneakers: one smart piece with casual ones', Rd(TEE, TROUSERS, WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{}), occasion='everyday')
case16('LFT-S-one', 'LFT-S', 'one lift alone counts at half: the tee tucked into straight jeans stays 7.5', Rd(top('tee', 'white', tucked='full'), DJEANS, WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{}), occasion='everyday')
case16('SL-1-warm', 'SL-1', "a fitted tee over wide grey trousers on a warm day: summer's shape", Rd(top('tee', 'white', 2), bottom('trousers', 'grey', 'wide'), WLS), dict({'overall': 8.5, 'band': 'Sharp'}, **{}), occasion='everyday', season='warm')
case16('SL-1-cool', 'SL-1', 'the same on a cool day: no summer shape', Rd(top('tee', 'white', 2), bottom('trousers', 'grey', 'wide'), WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday', vs={'case': 'SL-1-warm', 'overall': 'down'})
case16('STY-13-knit', 'STY-13', 'a navy cardigan over a grey sweater: knit on knit', Rd(top('sweater', 'grey'), outer('cardigan', 'navy'), DJEANS, WLS), dict({'overall': 6.5, 'band': 'Getting there'}, **{'fired': [F('X_knit_on_knit')]}), occasion='everyday')
case16('STY-13-one', 'STY-13', 'the cardigan over a tee: one knit, no charge', Rd(TEE, outer('cardigan', 'navy'), DJEANS, WLS), dict({'overall': 7.5, 'band': 'Put together'}, **{'not_fired': [F('X_knit_on_knit')]}), occasion='everyday', vs={'case': 'STY-13-knit', 'overall': 'up'})
case16('TST-0-suit', 'TST-0', 'a charcoal suit, white dress shirt, black derbies: graded as Tailored (TL1.1)', TL11, dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday')
case16('TST-0-graded', 'TST-0', 'the boxy tee outfit graded as Tailored: the taste rules follow the graded look (wide legs are off in tailored)', Rd(top('tee', 'white', 4, tucked='full'), WTROUSERS, LOAFER_BK), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday', graded_look='tailored', vs={'case': 'SCO-2-v16-boxy', 'overall': 'down'})
case16('TST-mix', 'TST-mix', 'graded as streetwear and tailored: the friendliest size wins (8.5, as streetwear)', Rd(top('tee', 'white', 4, tucked='full'), WTROUSERS, LOAFER_BK), dict({'overall': 8.5, 'band': 'Sharp'}, **{}), occasion='everyday', graded_look=['streetwear', 'tailored'], vs={'case': 'SCO-2-v16-boxy', 'overall': 'same'})
case16('TST-a-wide', 'TST-a', 'a tee over wide dark jeans: wide legs, his plus', Rd(TEE, bottom('jeans', 'denim_dark', 'wide'), WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday')
case16('TST-a-relaxed', 'TST-a', 'the same with relaxed jeans: half (and the silhouette at half)', Rd(TEE, bottom('jeans', 'denim_dark', 'relaxed'), WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday')
case16('TST-c-roomy', 'TST-c', 'a tee over roomy khaki shorts: roomy shorts, his plus', Rd(TEE, bottom('shorts', 'khaki_beige', 'relaxed', 'na', volume=4), WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday')
case16('TST-e-hem', 'TST-e', 'wide jeans whose hem covers most of the shoe (look L): his plus', Rd(TEE, WJEANS, WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday', second_look={'covers_shoe': 'mostly'})
case16('TST-j-long', 'TST-j', 'an untucked tee ending below the crotch, no jacket: a small charge', Rd(top('tee', 'white', length='below_crotch'), DJEANS, WLS), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday')
case16('TST-sk-skinny', 'TST-sk', 'skinny jeans cost more in every look: 5.5', Rd(top('tee', 'white', 2), SKJEANS, WLS), dict({'overall': 5.5, 'band': 'Needs a fix'}, **{}), occasion='everyday')
case16('TST-SIL-wide', 'TST-SIL', 'a tee over wide charcoal trousers with black loafers: a strong silhouette', Rd(TEE, WTROUSERS, LOAFER_BK), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday')
case16('TST-leg-wide', 'TST-leg', 'plain straight jeans the leg-width look says hang away: read wide (8.0)', Rd(TEE, DJEANS, WLS), dict({'overall': 8.0, 'band': 'Sharp'}, **{}), occasion='everyday', second_look={'knee': 'hangs_away', 'opening': 'about_the_same'}, vs={'case': 'SCO-1-v16-plain', 'overall': 1.0})
case16('TST-leg-straight', 'TST-leg', 'the same jeans the look says skim and match the shoe: stays straight (7.0)', Rd(TEE, DJEANS, WLS), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday', second_look={'knee': 'skims', 'opening': 'about_the_same'}, vs={'case': 'SCO-1-v16-plain', 'overall': 'same'})
case16('TST-st-oxford', 'TST-st', 'a white oxford with grey trousers and brown loafers scores as a dress shirt', Rd(top('oxford_shirt', 'white'), TROUSERS, LOAFER), dict({'overall': 6.5, 'band': 'Getting there'}, **{}), occasion='everyday')
case16('TST-st-dress', 'TST-st', 'the same with a dress shirt: identical', Rd(top('dress_shirt', 'white'), TROUSERS, LOAFER), dict({'overall': 6.5, 'band': 'Getting there'}, **{}), occasion='everyday', vs={'case': 'TST-st-oxford', 'parts': {k: 0.0 for k in P.PART_ORDER}, 'overall': 'same'})
case16('TST-sd-warm', 'TST-sd', 'slides with a tee and dark jeans on a warm casual day: no extra charge', Rd(TEE, DJEANS, SLIDES), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday', season='warm')
case16('TST-sd-cool', 'TST-sd', 'the same on a cool day: they cost', Rd(TEE, DJEANS, SLIDES), dict({'overall': 5.5, 'band': 'Needs a fix'}, **{}), occasion='everyday', vs={'case': 'TST-sd-warm', 'overall': 'down'})
case16('TST-sd-blazer', 'TST-sd', 'slides with a blazer on a warm day: still charged (a tailored piece)', Rd(TEE, outer('blazer', 'navy'), DJEANS, SLIDES), dict({'overall': 5.0, 'band': 'Needs a fix'}, **{}), occasion='everyday', season='warm', vs={'case': 'TST-sd-warm', 'overall': 'down'})
case16('TST-rn-casual', 'TST-rn', 'running shoes with a tee and jeans: no charge beyond the part', Rd(TEE, DJEANS, RUNNER), dict({'overall': 7.0, 'band': 'Put together'}, **{}), occasion='everyday')
case16('TST-rn-blazer', 'TST-rn', 'running shoes under a blazer: charged', Rd(TEE, outer('blazer', 'navy'), DJEANS, RUNNER), dict({'overall': 6.0, 'band': 'Getting there'}, **{}), occasion='everyday', vs={'case': 'TST-rn-casual', 'overall': 'down'})
case16('STY-3-v16-wide', 'STY-3', 'v16: a blazer with wide jeans: no charge any more (suit.9)', _from('STY-3-wide'), dict({'overall': 8.0, 'band': 'Sharp'}, **{'not_fired': [F('H3_another_world')]}), **_ctx('STY-3-wide'))
case16('STY-3-v16-wash', 'STY-3', 'v16: a blazer with light-wash jeans: no charge', _from('STY-3-wash'), dict({'overall': 7.0, 'band': 'Put together'}, **{'not_fired': [F('H3_another_world')]}), **_ctx('STY-3-wash'))
case16('STY-9-v16-cool', 'STY-9', 'v16: the tank alone on a cool day is charged', _from('STY-9-tank'), dict({'overall': 6.0, 'band': 'Getting there'}, **{'fired': [F('TK1_tank_alone')]}), **_ctx('STY-9-tank'))
case16('STY-9-v16-warm', 'STY-9', 'v16: the tank alone on a warm day is fine', _from('STY-9-tank'), dict({'overall': 7.0, 'band': 'Put together'}, **{'not_fired': [F('TK1_tank_alone')]}), **_ctx('STY-9-tank'), season='warm')
case16('COL-2-v16-neutral', 'COL-2', 'v16: a red sweater and yellow chinos with neutral pieces beside them: a tip, not a charge', _from('COL-2-bright'), dict({'overall': 7.0, 'band': 'Put together'}, **{'not_fired': [F('CC2_bright_clash')]}), **_ctx('COL-2-bright'))
case16('COL-2-v16-alone', 'COL-2', 'v16: a red tee over bright green chinos and red sneakers, no neutral beside them: charged (held by H3)', Rd(top('tee', 'red'), bottom('chinos', 'green', 'straight', saturation='bright'), shoe('canvas_sneaker', 'red')), dict({'overall': 6.5, 'band': 'Getting there'}, **{'fired': [F('CC2_bright_clash')]}), occasion='everyday')
case16('COL-12-v16-cool', 'COL-12', 'v16: the cream oxford over khaki chinos on a cool day: light on light', _from('COL-12-cream'), dict({'overall': 6.5, 'band': 'Getting there'}, **{'fired': [F('CL2_light_on_light', 'color')]}), **_ctx('COL-12-cream'))
case16('COL-12-v16-warm', 'COL-12', 'v16: the same on a warm day: not charged', _from('COL-12-cream'), dict({'overall': 7.5, 'band': 'Put together'}, **{'not_fired': [F('CL2_light_on_light')]}), **_ctx('COL-12-cream'), season='warm', vs={'case': 'COL-12-v16-cool', 'overall': 'up'})

# the dealbreakers (v16_paper.SINKS_HOLDS / SPARED / DEPENDS): each row at its cap, the spared versions under none
_GYM = bottom("athletic_shorts", "black", "relaxed", "na")
_PLAIN_SHORTS = bottom("shorts", "khaki_beige", "relaxed", "na")
_SWEATS = bottom("sweatpants", "grey", "relaxed", "cuffed")
_MOSTLY = {"covers_shoe": "mostly"}
_B16 = lambda x: next(n for t, n in BANDS_V16 if x <= t)  # noqa: E731
for _rid, _what, _rd, _sl, _cap in [
        ("S1", "a grey hoodie over black skinny jeans, white leather sneakers", Rd(top("hoodie", "grey"), SKJEANS, WLS), None, 5.5),
        ("S2", "an oversized white tee over black skinny jeans", Rd(top("tee", "white", 4), SKJEANS, WLS), None, 5.5),
        ("S4", "a red tee, yellow chinos, purple sneakers", Rd(top("tee", "red"), bottom("chinos", "yellow", "straight"), shoe("canvas_sneaker", "purple")), None, 4.5),
        ("S6", "a navy blazer over a tee with grey sweatpants", Rd(outer("blazer", "navy"), TEE, _SWEATS, WLS), None, 5.5),
        ("S8", "derbies with gym shorts and a tee", Rd(TEE, _GYM, DERBY), None, 5.5),
        ("S8", "derbies with sweatpants and a tee", Rd(TEE, _SWEATS, DERBY), None, 5.5),
        ("S9", "a clear stain on the tee", Rd(mod(TEE, condition="stained"), DJEANS, WLS), None, 5.5),
        ("H7", "straight jeans that pile up over the sneakers (the shoe close-up says mostly): a tip, no cap (Y34)", Rd(TEE, DJEANS, WLS), _MOSTLY, 7.0),
        ("H1", "an oversized white tee over black slim jeans", Rd(top("tee", "white", 4), SLJEANS, WLS), None, 6.5),
        ("H3", "a red tee over bright green chinos, red canvas sneakers (no neutral beside them)",
         Rd(top("tee", "red"), bottom("chinos", "green", "straight", saturation="bright"), shoe("canvas_sneaker", "red")), None, 6.5),
        ("H4", "a black sweater with skinny joggers", Rd(top("sweater", "black"), bottom("joggers", "black", "skinny", "cuffed"), WLS), None, 6.5),
        ("H8", "a tee that clearly pulls", Rd(mod(TEE, strain="clear"), DJEANS, WLS), None, 6.5),
        ("H10", "chunky sneakers under black slim jeans", Rd(TEE, SLJEANS, CHUNKY), None, 6.0),
        ("H11", "grey trousers with chunky sneakers", Rd(top("oxford_shirt", "white"), TROUSERS, CHUNKY), None, 6.5)]:
    case16(f"DB-{_rid}-{len([c for c in CASES if c['rule'] == 'DB-' + _rid]) + 1}", "DB-" + _rid, _what, _rd,
           {"overall": _cap, "band": _B16(_cap)}, second_look=_sl)
for _rid, _what, _rd, _sl, _ov in [
        ("S6", "an overcoat over a tee with grey sweatpants (spared)", Rd(outer("overcoat", "black"), TEE, _SWEATS, WLS), None, 7.5),
        ("S8", "loafers with plain sweatpants (spared)", Rd(TEE, _SWEATS, LOAFER_BK), None, 6.5),
        ("S9", "a stain on jeans ripped by design (spared)", Rd(TEE, mod(DJEANS, condition="stained", distressed_by_design=True), WLS), None, 6.0),
        ("H7", "wide jeans stacking on the sneakers (a soft stack, spared)", Rd(TEE, WJEANS, WLS), _MOSTLY, 8.0),
        ("H3", "a red tee over bright blue chinos with black sneakers and a navy jacket (calmed, spared)",
         Rd(top("tee", "red"), bottom("chinos", "blue", "straight", saturation="bright"), outer("bomber", "navy"), shoe("canvas_sneaker", "black")), None, 7.0),
        ("H1", "a fleece over slim cargos (outdoor, spared)", Rd(outer("fleece", "green", 4), TEE, bottom("cargos", "olive", "slim"), shoe("trail_shoe", "grey")), None, 7.0)]:
    case16(f"DB-{_rid}-spared", "DB-" + _rid, _what, _rd, {"overall": _ov, "band": _B16(_ov)}, second_look=_sl,
           future=["trail_shoe"] if _rid == "H1" else None)
for _rid, _what, _base, _weak, _strong, (_b, _w, _s) in [
        ("S5", "a blazer with gym shorts", Rd(TEE, outer("blazer", "navy"), _GYM, WLS),
         Rd(top("graphic_tee", "red", pattern_scale="large"), outer("blazer", "navy"), _GYM, WLS),
         Rd(top("tee", "green", saturation="muted"), outer("blazer", "navy"), _GYM, WLS), (7.0, 5.5, 6.5)),
        ("S7", "a leather jacket with gym shorts", Rd(TEE, outer("leather_jacket", "black"), _GYM, WLS),
         Rd(top("graphic_tee", "red", pattern_scale="large"), outer("leather_jacket", "black"), _GYM, WLS),
         Rd(top("tee", "green", saturation="muted"), outer("leather_jacket", "black"), _GYM, WLS), (7.0, 5.5, 7.0)),
        ("H6", "a blazer with plain shorts", Rd(TEE, outer("blazer", "navy"), _PLAIN_SHORTS, WLS),
         Rd(top("graphic_tee", "red", pattern_scale="large"), outer("blazer", "navy"), _PLAIN_SHORTS, WLS),
         Rd(top("tee", "green", saturation="muted"), outer("blazer", "navy"), _PLAIN_SHORTS, WLS), (7.0, 5.5, 7.0))]:
    case16(f"DB-X-{_rid}", "DB-X", f"depends ({_rid}): {_what}, never above 7.0", _base, {"overall": _b, "band": _B16(_b)})
    case16(f"DB-X-{_rid}-strong", "DB-X", f"depends ({_rid}): {_what} with a quiet accent", _strong, {"overall": _s, "band": _B16(_s)})
    case16(f"DB-X-{_rid}-weak", "DB-X", f"depends ({_rid}): {_what} with a loud print: below the quiet one", _weak,
           {"overall": _w, "band": _B16(_w)}, vs={"case": f"DB-X-{_rid}-strong", "overall": "down"})

# T94 x T69 (the merge, Nov 18): v16's card carries the 8-look name as v15's does, so a v16 case whose outfit meets TL1
# reads as Tailored and declares it, as MEETS_TL1 does above (T94's check below, TL2). Adds a label only; every number
# stays T69's.
for _cid in ["TST-0-suit"]:
    _e = next(c for c in CASES if c["id"] == _cid)["expect"]
    _e["label"] = "tailored"
    # T94's test writer (Disputes 4): the same as MEETS_TL1 asks of every Tailored outfit: the look, and the line that names it
    _e["detected_has"] = list(dict.fromkeys(_e.get("detected_has", []) + ["tailored"]))
    _e["fired"] = _e.get("fired", []) + [F("H1_reads_as_style", "cohesion", 0.5, "reads as tailored")]


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
    if c.get("engine") == "v16":
        return P.score_parts(c["reading"], c["occasion"], dict(c["styles"]), c["second_look"], c["boldness"], engine="v16",
                             season=c.get("season"), graded_look=c.get("graded_look"))
    return P.score_parts(c["reading"], c["occasion"], dict(c["styles"]), c["second_look"], c["boldness"])


def fix_next_level(c):
    """The fix engine's Next level / tip line for the case (no closet, not a warm day, not the first check)."""
    if c.get("engine") == "v16":
        return PF.suggest_parts_fixes(c["reading"], c["occasion"], dict(c["styles"]), c["boldness"], c["second_look"],
                                      engine="v16", season=c.get("season"))["next_level"]
    return PF.suggest_parts_fixes(c["reading"], c["occasion"], dict(c["styles"]), c["boldness"], c["second_look"])["next_level"]


def fix_order(c):
    """T94: the fix engine's fixes for the case, in order (ids), on the case's own engine (as fix_next_level)."""
    if c.get("engine") == "v16":
        return [x["id"] for x in PF.suggest_parts_fixes(c["reading"], c["occasion"], dict(c["styles"]), c["boldness"], c["second_look"],
                                                       engine="v16", season=c.get("season"))["fixes"]]
    return [x["id"] for x in PF.suggest_parts_fixes(c["reading"], c["occasion"], dict(c["styles"]), c["boldness"], c["second_look"])["fixes"]]


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
    if "band" in e and band_of(ov, c) != e["band"]:
        bad.append(f"band {band_of(ov, c)} ({ov}) != {e['band']}")
    if "band_in" in e and band_of(ov, c) not in e["band_in"]:
        bad.append(f"band {band_of(ov, c)} ({ov}) not in {e['band_in']}")
    for f in e.get("fired", []):
        hits = [x for _, x in reasons(r, f.get("part")) if x["check"] == f["check"]]
        if not hits:
            bad.append(f"{f['check']} didn't fire" + (f" on {f['part']}" if "part" in f else ""))
        elif "points" in f and not any(abs(x["points"] - f["points"]) < EPS for x in hits):
            bad.append(f"{f['check']} moved {[x['points'] for x in hits]}, want {f['points']}")
        elif "line" in f and not any(f["line"] in x["line"] for x in hits):
            bad.append(f"{f['check']} line {[x['line'] for x in hits]} lacks '{f['line']}'")
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
    if "fix_tip" in e or "fix_tip_lacks" in e:                       # v10: the fix engine's tip line (no points)
        nl = fix_next_level(c)
        if "fix_tip" in e and (nl or {}).get("id") != e["fix_tip"]:
            bad.append(f"fix tip {(nl or {}).get('id')} != {e['fix_tip']}")
        if "fix_tip" in e and "fix_tip_line" in e and e["fix_tip_line"] not in (nl or {}).get("line", ""):
            bad.append(f"fix tip line {(nl or {}).get('line')} lacks '{e['fix_tip_line']}'")
        if "fix_tip_lacks" in e and (nl or {}).get("id") == e["fix_tip_lacks"]:
            bad.append(f"fix tip {e['fix_tip_lacks']} shown")
    if "fix_order" in e:                                            # T94 (TLR-6): the fixes, in order
        got = fix_order(c)
        if got != e["fix_order"]:
            bad.append(f"fixes {got} != {e['fix_order']}")
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


def snapshot(r, c=None):
    if r.get("overall") is None:
        return {"overall": None, "reason": r.get("reason")}
    out = {"overall": r["overall"], "raw_score": r["raw_score"],
           "parts": {k: v["score"] for k, v in r["parts"].items()},
           "detected_styles": r["detected_styles"], "style_label": r["style_label"]}
    if c is not None and ({"fix_tip", "fix_tip_lacks"} & set(c["expect"])):
        out["next_level"] = fix_next_level(c)                       # v10: the TS checks the tip line equals Python's
    if c is not None and "fix_order" in c["expect"]:
        out["fix_order"] = fix_order(c)                              # T94: the TS checks the order equals Python's
    return out


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
    undeclared_tl = [c["id"] for c in CASES if results[c["id"]].get("style_label") == "tailored"
                     and c["expect"].get("label") != "tailored"]
    if undeclared_tl:
        fails += 1
        print(f"FAIL these cases read as Tailored but don't say so (T94, TL2): {undeclared_tl}")
    rules = sorted({c["rule"] for c in CASES})
    text = DOC.read_text()
    doc = set(re.findall(r"\*\*\[([A-Z]{3}-\d+)\]", text))
    main_ids = {r for r in rules if re.fullmatch(r"[A-Z]{3}-\d+", r)}   # T69: sub-IDs (DB-S1, TST-a, LFT-4s) checked below
    if doc != main_ids:
        fails += 1
        print(f"FAIL the doc and the cases disagree: rules with no case {sorted(doc - main_ids)}, "
              f"cases for rules not in the doc {sorted(main_ids - doc)}")
    loose = sorted(r for r in rules if f"**[{r}]" not in text)
    if loose:
        fails += 1
        print(f"FAIL cases for rules not in the doc: {loose}")
    print(f"{len(CASES) - fails}/{len(CASES)} cases pass, {len(rules)} rule IDs covered")
    if fails:
        return 1
    data = json.loads((K / "handoff/fixtures/parts.json").read_text())
    out = {"about": "Rules conformance: one or more made-up outfits per rule ID in rubric/v5-styles.md. Generated by "
                    "extraction-test/rules_conformance.py from parts_proto.py; read by "
                    "app/packages/kitted-core/test/rulesConformance.test.ts. Never edit by hand.",
           "parts_version": data["version"], "engine": data["engine"], "bands": BANDS, "bands_v16": BANDS_V16,
           "counts": {"cases": len(CASES), "rules": len(rules)}, "rules": rules,
           "cases": [dict(c, python=snapshot(results[c["id"]], c)) for c in CASES]}
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(K)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
